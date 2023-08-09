The controller contract is the contract the user interacts with to **create a loan**, **repay** and **withdraw**. It holds all user debt information. External liquidations are also done through it.  

Each market has its individual controller, which is created from a blueprint contract.


# **Loans**

## **Creating and Repaying Loans**

New loans are created via the `ceate_loan` function. When creating a loan the user need to spcify the **amount of collateral** and **debt** and the **number of bands** to deposit the collateral into. The maximum amount of borrowable debt is determined by the number of bands, amount of collateral and the oracle price.  

Before doing that, users can utilise some functions to pre-calculate metrics: [Loan calculations](#loan-calculations-borrowable-etc)


### `create_loan`
!!! description "`controller.create_loan(collateral: uint256, debt: uint256, N: uint256):`"

    Function to create a loan. User needs to specify the amount of `collateral` to deposit into `N`-bands and the amount of `debt` to borrow. If a user already has an existing loan, the funtion will revert.

    Emits event: `UserState`, `Borrow` and `Deposit` (in AMM)

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `collateral` |  `uint256` |  Amount of collateral to use |
    | `debt` |  `uint256` | Amount of debt to take |
    | `N` |  `uint256` | Number of bands to deposit into |

    !!!note
        `N` can range between `MIN_TICKS` and `MAX_TICKS`. A loan cannot be created if one already exists.

    ??? quote "Source code"

        === "Controller.vy"

            ```python hl_lines="1 2 4 5 8 30 37 38 43 51"
            log UserState(msg.sender, collateral, debt, n1, n2, liquidation_discount)
            log Borrow(msg.sender, collateral, debt)

            MAX_TICKS: constant(int256) = 50
            MIN_TICKS: constant(int256) = 4

            @internal
            def _create_loan(mvalue: uint256, collateral: uint256, debt: uint256, N: uint256, transfer_coins: bool):
                assert self.loan[msg.sender].initial_debt == 0, "Loan already created"
                assert N > MIN_TICKS-1, "Need more ticks"
                assert N < MAX_TICKS+1, "Need less ticks"

                n1: int256 = self._calculate_debt_n1(collateral, debt, N)
                n2: int256 = n1 + convert(N - 1, int256)

                rate_mul: uint256 = self._rate_mul_w()
                self.loan[msg.sender] = Loan({initial_debt: debt, rate_mul: rate_mul})
                liquidation_discount: uint256 = self.liquidation_discount
                self.liquidation_discounts[msg.sender] = liquidation_discount

                n_loans: uint256 = self.n_loans
                self.loans[n_loans] = msg.sender
                self.loan_ix[msg.sender] = n_loans
                self.n_loans = unsafe_add(n_loans, 1)

                total_debt: uint256 = self._total_debt.initial_debt * rate_mul / self._total_debt.rate_mul + debt
                self._total_debt.initial_debt = total_debt
                self._total_debt.rate_mul = rate_mul

                AMM.deposit_range(msg.sender, collateral, n1, n2)
                self.minted += debt

                if transfer_coins:
                    self._deposit_collateral(collateral, mvalue)
                    STABLECOIN.transfer(msg.sender, debt)

                log UserState(msg.sender, collateral, debt, n1, n2, liquidation_discount)
                log Borrow(msg.sender, collateral, debt)

            @payable
            @external
            @nonreentrant('lock')
            def create_loan(collateral: uint256, debt: uint256, N: uint256):
                """
                @notice Create loan
                @param collateral Amount of collateral to use
                @param debt Stablecoin debt to take
                @param N Number of bands to deposit into (to do autoliquidation-deliquidation),
                    can be from MIN_TICKS to MAX_TICKS
                """
                self._create_loan(msg.value, collateral, debt, N, True)
            ```
        
        === "AMM.vy"

            ```python hl_lines="3"
            @external
            @nonreentrant('lock')
            def deposit_range(user: address, amount: uint256, n1: int256, n2: int256):
                """
                @notice Deposit for a user in a range of bands. Only admin contract (Controller) can do it
                @param user User address
                @param amount Amount of collateral to deposit
                @param n1 Lower band in the deposit range
                @param n2 Upper band in the deposit range
                """
                assert msg.sender == self.admin

                user_shares: DynArray[uint256, MAX_TICKS_UINT] = []
                collateral_shares: DynArray[uint256, MAX_TICKS_UINT] = []

                n0: int256 = self.active_band

                # We assume that n1,n2 area already sorted (and they are in Controller)
                assert n2 < 2**127
                assert n1 > -2**127

                lm: LMGauge = self.liquidity_mining_callback

                # Autoskip bands if we can
                for i in range(MAX_SKIP_TICKS + 1):
                    if n1 > n0:
                        if i != 0:
                            self.active_band = n0
                        break
                    assert self.bands_x[n0] == 0 and i < MAX_SKIP_TICKS, "Deposit below current band"
                    n0 -= 1

                n_bands: uint256 = unsafe_add(convert(unsafe_sub(n2, n1), uint256), 1)
                assert n_bands <= MAX_TICKS_UINT

                y_per_band: uint256 = unsafe_div(amount * COLLATERAL_PRECISION, n_bands)
                assert y_per_band > 100, "Amount too low"

                assert self.user_shares[user].ticks[0] == 0  # dev: User must have no liquidity
                self.user_shares[user].ns = unsafe_add(n1, unsafe_mul(n2, 2**128))

                for i in range(MAX_TICKS):
                    band: int256 = unsafe_add(n1, i)
                    if band > n2:
                        break

                    assert self.bands_x[band] == 0, "Band not empty"
                    y: uint256 = y_per_band
                    if i == 0:
                        y = amount * COLLATERAL_PRECISION - y * unsafe_sub(n_bands, 1)

                    total_y: uint256 = self.bands_y[band]

                    # Total / user share
                    s: uint256 = self.total_shares[band]
                    ds: uint256 = unsafe_div((s + DEAD_SHARES) * y, total_y + 1)
                    assert ds > 0, "Amount too low"
                    user_shares.append(ds)
                    s += ds
                    assert s <= 2**128 - 1
                    self.total_shares[band] = s

                    total_y += y
                    self.bands_y[band] = total_y

                    if lm.address != empty(address):
                        # If initial s == 0 - s becomes equal to y which is > 100 => nonzero
                        collateral_shares.append(unsafe_div(total_y * 10**18, s))

                self.min_band = min(self.min_band, n1)
                self.max_band = max(self.max_band, n2)

                self.save_user_shares(user, user_shares)

                self.rate_mul = self._rate_mul()
                self.rate_time = block.timestamp

                log Deposit(user, amount, n1, n2)

                if lm.address != empty(address):
                    lm.callback_collateral_shares(n1, collateral_shares)
                    lm.callback_user_shares(user, n1, user_shares)
            ```

    === "Example"
        ```shell
        >>> controller.create_loan(todo)
        todo
        ```


### `create_loan_extended`
!!! description "`controller.create_loan_extended(collateral: uint256, debt: uint256, N: uint256, callbacker: address, callback_args: DynArray[uint256,5]):`"

    Extended function to create a loan. This function passes crvUSD to a callback first so that it can leverage up.

    Emits event: `UserState`, `Borrow` and `Deposit` (in AMM)

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `collateral` |  `uint256` |  Amount of collateral to use |
    | `debt` |  `uint256` | Amount of debt to take |
    | `N` |  `uint256` | Number of bands to deposit into |
    | `callbacker` |  `address` | Address of the callback contract |
    | `callback_args` |  `DynArray[uint256,5]` | Extra arguments for the callback (up to 5) such as `min_amount` etc |


    ??? quote "Source code"

        === "Controller.vy"

            ```python hl_lines="1 2 5 27 34 35 40 61"
            log UserState(msg.sender, collateral, debt, n1, n2, liquidation_discount)
            log Borrow(msg.sender, collateral, debt)

            @internal
            def _create_loan(mvalue: uint256, collateral: uint256, debt: uint256, N: uint256, transfer_coins: bool):
                assert self.loan[msg.sender].initial_debt == 0, "Loan already created"
                assert N > MIN_TICKS-1, "Need more ticks"
                assert N < MAX_TICKS+1, "Need less ticks"

                n1: int256 = self._calculate_debt_n1(collateral, debt, N)
                n2: int256 = n1 + convert(N - 1, int256)

                rate_mul: uint256 = self._rate_mul_w()
                self.loan[msg.sender] = Loan({initial_debt: debt, rate_mul: rate_mul})
                liquidation_discount: uint256 = self.liquidation_discount
                self.liquidation_discounts[msg.sender] = liquidation_discount

                n_loans: uint256 = self.n_loans
                self.loans[n_loans] = msg.sender
                self.loan_ix[msg.sender] = n_loans
                self.n_loans = unsafe_add(n_loans, 1)

                total_debt: uint256 = self._total_debt.initial_debt * rate_mul / self._total_debt.rate_mul + debt
                self._total_debt.initial_debt = total_debt
                self._total_debt.rate_mul = rate_mul

                AMM.deposit_range(msg.sender, collateral, n1, n2)
                self.minted += debt

                if transfer_coins:
                    self._deposit_collateral(collateral, mvalue)
                    STABLECOIN.transfer(msg.sender, debt)

                log UserState(msg.sender, collateral, debt, n1, n2, liquidation_discount)
                log Borrow(msg.sender, collateral, debt)

            @payable
            @external
            @nonreentrant('lock')
            def create_loan_extended(collateral: uint256, debt: uint256, N: uint256, callbacker: address, callback_args: DynArray[uint256,5]):
                """
                @notice Create loan but pass stablecoin to a callback first so that it can build leverage
                @param collateral Amount of collateral to use
                @param debt Stablecoin debt to take
                @param N Number of bands to deposit into (to do autoliquidation-deliquidation),
                    can be from MIN_TICKS to MAX_TICKS
                @param callbacker Address of the callback contract
                @param callback_args Extra arguments for the callback (up to 5) such as min_amount etc
                """
                # Before callback
                STABLECOIN.transfer(callbacker, debt)

                # Callback
                # If there is any unused debt, callbacker can send it to the user
                more_collateral: uint256 = self.execute_callback(
                    callbacker, CALLBACK_DEPOSIT, msg.sender, 0, collateral, debt, callback_args).collateral

                # After callback
                self._deposit_collateral(collateral, msg.value)
                assert COLLATERAL_TOKEN.transferFrom(callbacker, AMM.address, more_collateral, default_return_value=True)
                self._create_loan(0, collateral + more_collateral, debt, N, False)
            ```
        
        === "AMM.vy"

            ```python hl_lines="3"
            @external
            @nonreentrant('lock')
            def deposit_range(user: address, amount: uint256, n1: int256, n2: int256):
                """
                @notice Deposit for a user in a range of bands. Only admin contract (Controller) can do it
                @param user User address
                @param amount Amount of collateral to deposit
                @param n1 Lower band in the deposit range
                @param n2 Upper band in the deposit range
                """
                assert msg.sender == self.admin

                user_shares: DynArray[uint256, MAX_TICKS_UINT] = []
                collateral_shares: DynArray[uint256, MAX_TICKS_UINT] = []

                n0: int256 = self.active_band

                # We assume that n1,n2 area already sorted (and they are in Controller)
                assert n2 < 2**127
                assert n1 > -2**127

                lm: LMGauge = self.liquidity_mining_callback

                # Autoskip bands if we can
                for i in range(MAX_SKIP_TICKS + 1):
                    if n1 > n0:
                        if i != 0:
                            self.active_band = n0
                        break
                    assert self.bands_x[n0] == 0 and i < MAX_SKIP_TICKS, "Deposit below current band"
                    n0 -= 1

                n_bands: uint256 = unsafe_add(convert(unsafe_sub(n2, n1), uint256), 1)
                assert n_bands <= MAX_TICKS_UINT

                y_per_band: uint256 = unsafe_div(amount * COLLATERAL_PRECISION, n_bands)
                assert y_per_band > 100, "Amount too low"

                assert self.user_shares[user].ticks[0] == 0  # dev: User must have no liquidity
                self.user_shares[user].ns = unsafe_add(n1, unsafe_mul(n2, 2**128))

                for i in range(MAX_TICKS):
                    band: int256 = unsafe_add(n1, i)
                    if band > n2:
                        break

                    assert self.bands_x[band] == 0, "Band not empty"
                    y: uint256 = y_per_band
                    if i == 0:
                        y = amount * COLLATERAL_PRECISION - y * unsafe_sub(n_bands, 1)

                    total_y: uint256 = self.bands_y[band]

                    # Total / user share
                    s: uint256 = self.total_shares[band]
                    ds: uint256 = unsafe_div((s + DEAD_SHARES) * y, total_y + 1)
                    assert ds > 0, "Amount too low"
                    user_shares.append(ds)
                    s += ds
                    assert s <= 2**128 - 1
                    self.total_shares[band] = s

                    total_y += y
                    self.bands_y[band] = total_y

                    if lm.address != empty(address):
                        # If initial s == 0 - s becomes equal to y which is > 100 => nonzero
                        collateral_shares.append(unsafe_div(total_y * 10**18, s))

                self.min_band = min(self.min_band, n1)
                self.max_band = max(self.max_band, n2)

                self.save_user_shares(user, user_shares)

                self.rate_mul = self._rate_mul()
                self.rate_time = block.timestamp

                log Deposit(user, amount, n1, n2)

                if lm.address != empty(address):
                    lm.callback_collateral_shares(n1, collateral_shares)
                    lm.callback_user_shares(user, n1, user_shares)
            ```

    === "Example"
        ```shell
        >>> controller.create_loan_extended(todo)
        todo
        ```


### `repay`
!!! description "`controller.repay(_d_debt: uint256, _for: address = msg.sender, max_active_band: int256 = 2**255-1, use_eth: bool = True):`"

    Function to partially or fully repay `_d_debt` amount of debt.

    Emits event: `UserState` and `Repay`

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_d_debt` |  `uint256` |  Amount of debt to repay |
    | `_for` |  `address` |  Address to repay the debt for |
    | `max_active_band` |  `int256` |  Highest active band. Used to prevent front-running the repay |
    | `use_eth` |  `bool` |  Use wrapping/unwrapping if collateral is ETH |

    !!! note
        If `_d_debt` exceeds the total debt amount of the user, a full repayment will be done.

    ??? quote "Source code"

        === "Controller.vy"

            ```python hl_lines="1 9 17"
            event UserState:
                user: indexed(address)
                collateral: uint256
                debt: uint256
                n1: int256
                n2: int256
                liquidation_discount: uint256

            event Repay:
                user: indexed(address)
                collateral_decrease: uint256
                loan_decrease: uint256

            @payable
            @external
            @nonreentrant('lock')
            def repay(_d_debt: uint256, _for: address = msg.sender, max_active_band: int256 = 2**255-1, use_eth: bool = True):
                """
                @notice Repay debt (partially or fully)
                @param _d_debt The amount of debt to repay. If higher than the current debt - will do full repayment
                @param _for The user to repay the debt for
                @param max_active_band Don't allow active band to be higher than this (to prevent front-running the repay)
                @param use_eth Use wrapping/unwrapping if collateral is ETH
                """
                if _d_debt == 0:
                    return
                # Or repay all for MAX_UINT256
                # Withdraw if debt become 0
                debt: uint256 = 0
                rate_mul: uint256 = 0
                debt, rate_mul = self._debt(_for)
                assert debt > 0, "Loan doesn't exist"
                d_debt: uint256 = min(debt, _d_debt)
                debt = unsafe_sub(debt, d_debt)

                if debt == 0:
                    # Allow to withdraw all assets even when underwater
                    xy: uint256[2] = AMM.withdraw(_for, 10**18)
                    if xy[0] > 0:
                        # Only allow full repayment when underwater for the sender to do
                        assert _for == msg.sender
                        STABLECOIN.transferFrom(AMM.address, _for, xy[0])
                    if xy[1] > 0:
                        self._withdraw_collateral(_for, xy[1], use_eth)
                    log UserState(_for, 0, 0, 0, 0, 0)
                    log Repay(_for, xy[1], d_debt)
                    self._remove_from_list(_for)

                else:
                    active_band: int256 = AMM.active_band_with_skip()
                    assert active_band <= max_active_band

                    ns: int256[2] = AMM.read_user_tick_numbers(_for)
                    size: uint256 = convert(unsafe_add(unsafe_sub(ns[1], ns[0]), 1), uint256)


                    if ns[0] > active_band:
                        # Not in liquidation - can move bands
                        xy: uint256[2] = AMM.withdraw(_for, 10**18)
                        n1: int256 = self._calculate_debt_n1(xy[1], debt, size)
                        n2: int256 = n1 + unsafe_sub(ns[1], ns[0])
                        AMM.deposit_range(_for, xy[1], n1, n2)
                        liquidation_discount: uint256 = self.liquidation_discount
                        self.liquidation_discounts[_for] = liquidation_discount
                        log UserState(_for, xy[1], debt, n1, n2, liquidation_discount)
                        log Repay(_for, 0, d_debt)
                    else:
                        # Underwater - cannot move band but can avoid a bad liquidation
                        log UserState(_for, max_value(uint256), debt, ns[0], ns[1], self.liquidation_discounts[_for])
                        log Repay(_for, 0, d_debt)

                # If we withdrew already - will burn less!
                STABLECOIN.transferFrom(msg.sender, self, d_debt)  # fail: insufficient funds
                self.redeemed += d_debt

                self.loan[_for] = Loan({initial_debt: debt, rate_mul: rate_mul})
                total_debt: uint256 = self._total_debt.initial_debt * rate_mul / self._total_debt.rate_mul
                self._total_debt.initial_debt = unsafe_sub(max(total_debt, d_debt), d_debt)
                self._total_debt.rate_mul = rate_mul
            ```
        
        === "AMM.vy"

            ```python hl_lines="1 9 84"
            event Deposit:
                provider: indexed(address)
                amount: uint256
                n1: int256
                n2: int256

            @external
            @nonreentrant('lock')
            def deposit_range(user: address, amount: uint256, n1: int256, n2: int256):
                """
                @notice Deposit for a user in a range of bands. Only admin contract (Controller) can do it
                @param user User address
                @param amount Amount of collateral to deposit
                @param n1 Lower band in the deposit range
                @param n2 Upper band in the deposit range
                """
                assert msg.sender == self.admin

                user_shares: DynArray[uint256, MAX_TICKS_UINT] = []
                collateral_shares: DynArray[uint256, MAX_TICKS_UINT] = []

                n0: int256 = self.active_band

                # We assume that n1,n2 area already sorted (and they are in Controller)
                assert n2 < 2**127
                assert n1 > -2**127

                lm: LMGauge = self.liquidity_mining_callback

                # Autoskip bands if we can
                for i in range(MAX_SKIP_TICKS + 1):
                    if n1 > n0:
                        if i != 0:
                            self.active_band = n0
                        break
                    assert self.bands_x[n0] == 0 and i < MAX_SKIP_TICKS, "Deposit below current band"
                    n0 -= 1

                n_bands: uint256 = unsafe_add(convert(unsafe_sub(n2, n1), uint256), 1)
                assert n_bands <= MAX_TICKS_UINT

                y_per_band: uint256 = unsafe_div(amount * COLLATERAL_PRECISION, n_bands)
                assert y_per_band > 100, "Amount too low"

                assert self.user_shares[user].ticks[0] == 0  # dev: User must have no liquidity
                self.user_shares[user].ns = unsafe_add(n1, unsafe_mul(n2, 2**128))

                for i in range(MAX_TICKS):
                    band: int256 = unsafe_add(n1, i)
                    if band > n2:
                        break

                    assert self.bands_x[band] == 0, "Band not empty"
                    y: uint256 = y_per_band
                    if i == 0:
                        y = amount * COLLATERAL_PRECISION - y * unsafe_sub(n_bands, 1)

                    total_y: uint256 = self.bands_y[band]

                    # Total / user share
                    s: uint256 = self.total_shares[band]
                    ds: uint256 = unsafe_div((s + DEAD_SHARES) * y, total_y + 1)
                    assert ds > 0, "Amount too low"
                    user_shares.append(ds)
                    s += ds
                    assert s <= 2**128 - 1
                    self.total_shares[band] = s

                    total_y += y
                    self.bands_y[band] = total_y

                    if lm.address != empty(address):
                        # If initial s == 0 - s becomes equal to y which is > 100 => nonzero
                        collateral_shares.append(unsafe_div(total_y * 10**18, s))

                self.min_band = min(self.min_band, n1)
                self.max_band = max(self.max_band, n2)

                self.save_user_shares(user, user_shares)

                self.rate_mul = self._rate_mul()
                self.rate_time = block.timestamp

                log Deposit(user, amount, n1, n2)

                if lm.address != empty(address):
                    lm.callback_collateral_shares(n1, collateral_shares)
                    lm.callback_user_shares(user, n1, user_shares)
            ```

    === "Example"
        ```shell
        >>> controller.repay(todo)
        todo
        ```


### `repay_extended`
!!! description "`controller.repay_extended(callbacker: address, callback_args: DynArray[uint256,5]):`"

    Extended function to repay a loan but get a stablecoin for that from callback (to deleverage).

    Emits event: `UserState` and `Repay`

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `callbacker` |  `address` |  Address of the callback contract |
    | `callback_args` |  `DynArray[uint256,5]` |  Extra arguments for the callback (up to 5) such as `min_amount` |


    ??? quote "Source code"

        === "Controller.vy"

            ```python hl_lines="1 9 16"
            event UserState:
                user: indexed(address)
                collateral: uint256
                debt: uint256
                n1: int256
                n2: int256
                liquidation_discount: uint256

            event Repay:
                user: indexed(address)
                collateral_decrease: uint256
                loan_decrease: uint256

            @external
            @nonreentrant('lock')
            def repay_extended(callbacker: address, callback_args: DynArray[uint256,5]):
                """
                @notice Repay loan but get a stablecoin for that from callback (to deleverage)
                @param callbacker Address of the callback contract
                @param callback_args Extra arguments for the callback (up to 5) such as min_amount etc
                """
                # Before callback
                ns: int256[2] = AMM.read_user_tick_numbers(msg.sender)
                xy: uint256[2] = AMM.withdraw(msg.sender, 10**18)
                debt: uint256 = 0
                rate_mul: uint256 = 0
                debt, rate_mul = self._debt(msg.sender)
                COLLATERAL_TOKEN.transferFrom(AMM.address, callbacker, xy[1], default_return_value=True)

                cb: CallbackData = self.execute_callback(
                    callbacker, CALLBACK_REPAY, msg.sender, xy[0], xy[1], debt, callback_args)

                # After callback
                total_stablecoins: uint256 = cb.stablecoins + xy[0]
                assert total_stablecoins > 0  # dev: no coins to repay

                # d_debt: uint256 = min(debt, total_stablecoins)

                d_debt: uint256 = 0

                # If we have more stablecoins than the debt - full repayment and closing the position
                if total_stablecoins >= debt:
                    d_debt = debt
                    debt = 0
                    self._remove_from_list(msg.sender)

                    # Transfer debt to self, everything else to sender
                    if cb.stablecoins > 0:
                        STABLECOIN.transferFrom(callbacker, self, cb.stablecoins)
                    if xy[0] > 0:
                        STABLECOIN.transferFrom(AMM.address, self, xy[0])
                    if total_stablecoins > d_debt:
                        STABLECOIN.transfer(msg.sender, unsafe_sub(total_stablecoins, d_debt))
                    if cb.collateral > 0:
                        assert COLLATERAL_TOKEN.transferFrom(callbacker, msg.sender, cb.collateral, default_return_value=True)

                    log UserState(msg.sender, 0, 0, 0, 0, 0)

                # Else - partial repayment -> deleverage, but only if we are not underwater
                else:
                    size: uint256 = convert(unsafe_add(unsafe_sub(ns[1], ns[0]), 1), uint256)
                    assert ns[0] > cb.active_band
                    d_debt = cb.stablecoins  # cb.stablecoins <= total_stablecoins < debt
                    debt = unsafe_sub(debt, cb.stablecoins)

                    # Not in liquidation - can move bands
                    n1: int256 = self._calculate_debt_n1(cb.collateral, debt, size)
                    n2: int256 = n1 + unsafe_sub(ns[1], ns[0])
                    AMM.deposit_range(msg.sender, cb.collateral, n1, n2)
                    liquidation_discount: uint256 = self.liquidation_discount
                    self.liquidation_discounts[msg.sender] = liquidation_discount

                    assert COLLATERAL_TOKEN.transferFrom(callbacker, AMM.address, cb.collateral, default_return_value=True)
                    # Stablecoin is all spent to repay debt -> all goes to self
                    STABLECOIN.transferFrom(callbacker, self, cb.stablecoins)
                    # We are above active band, so xy[0] is 0 anyway

                    log UserState(msg.sender, cb.collateral, debt, n1, n2, liquidation_discount)
                    xy[1] = 0

                # Common calls which we will do regardless of whether it's a full repay or not
                log Repay(msg.sender, xy[1], d_debt)
                self.redeemed += d_debt
                self.loan[msg.sender] = Loan({initial_debt: debt, rate_mul: rate_mul})
                total_debt: uint256 = self._total_debt.initial_debt * rate_mul / self._total_debt.rate_mul
                self._total_debt.initial_debt = unsafe_sub(max(total_debt, d_debt), d_debt)
                self._total_debt.rate_mul = rate_mul
            ```
        
        === "AMM.vy"

            ```python hl_lines="1 9 84"
            event Deposit:
                provider: indexed(address)
                amount: uint256
                n1: int256
                n2: int256

            @external
            @nonreentrant('lock')
            def deposit_range(user: address, amount: uint256, n1: int256, n2: int256):
                """
                @notice Deposit for a user in a range of bands. Only admin contract (Controller) can do it
                @param user User address
                @param amount Amount of collateral to deposit
                @param n1 Lower band in the deposit range
                @param n2 Upper band in the deposit range
                """
                assert msg.sender == self.admin

                user_shares: DynArray[uint256, MAX_TICKS_UINT] = []
                collateral_shares: DynArray[uint256, MAX_TICKS_UINT] = []

                n0: int256 = self.active_band

                # We assume that n1,n2 area already sorted (and they are in Controller)
                assert n2 < 2**127
                assert n1 > -2**127

                lm: LMGauge = self.liquidity_mining_callback

                # Autoskip bands if we can
                for i in range(MAX_SKIP_TICKS + 1):
                    if n1 > n0:
                        if i != 0:
                            self.active_band = n0
                        break
                    assert self.bands_x[n0] == 0 and i < MAX_SKIP_TICKS, "Deposit below current band"
                    n0 -= 1

                n_bands: uint256 = unsafe_add(convert(unsafe_sub(n2, n1), uint256), 1)
                assert n_bands <= MAX_TICKS_UINT

                y_per_band: uint256 = unsafe_div(amount * COLLATERAL_PRECISION, n_bands)
                assert y_per_band > 100, "Amount too low"

                assert self.user_shares[user].ticks[0] == 0  # dev: User must have no liquidity
                self.user_shares[user].ns = unsafe_add(n1, unsafe_mul(n2, 2**128))

                for i in range(MAX_TICKS):
                    band: int256 = unsafe_add(n1, i)
                    if band > n2:
                        break

                    assert self.bands_x[band] == 0, "Band not empty"
                    y: uint256 = y_per_band
                    if i == 0:
                        y = amount * COLLATERAL_PRECISION - y * unsafe_sub(n_bands, 1)

                    total_y: uint256 = self.bands_y[band]

                    # Total / user share
                    s: uint256 = self.total_shares[band]
                    ds: uint256 = unsafe_div((s + DEAD_SHARES) * y, total_y + 1)
                    assert ds > 0, "Amount too low"
                    user_shares.append(ds)
                    s += ds
                    assert s <= 2**128 - 1
                    self.total_shares[band] = s

                    total_y += y
                    self.bands_y[band] = total_y

                    if lm.address != empty(address):
                        # If initial s == 0 - s becomes equal to y which is > 100 => nonzero
                        collateral_shares.append(unsafe_div(total_y * 10**18, s))

                self.min_band = min(self.min_band, n1)
                self.max_band = max(self.max_band, n2)

                self.save_user_shares(user, user_shares)

                self.rate_mul = self._rate_mul()
                self.rate_time = block.timestamp

                log Deposit(user, amount, n1, n2)

                if lm.address != empty(address):
                    lm.callback_collateral_shares(n1, collateral_shares)
                    lm.callback_user_shares(user, n1, user_shares)
            ```

    === "Example"
        ```shell
        >>> controller.repay_extended(todo)
        todo
        ```


## **Adjusting existing Loans**

### `add_collateral` 
!!! description "`controller.add_collateral(collateral: uint256, _for: address = msg.sender):`"

    Function to add extra collateral to a position.

    Emits event: `UserState` and `Borrow`

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `collateral` |  `uint256` |  Amount of collateral to add |
    | `_for` |  `address` | Address to add collateral for |


    ??? quote "Source code"

        === "Controller.vy"

            ```python hl_lines="1 9 15 52 53 54 59 67 68 71"
            event UserState:
                user: indexed(address)
                collateral: uint256
                debt: uint256
                n1: int256
                n2: int256
                liquidation_discount: uint256

            event Borrow:
                user: indexed(address)
                collateral_increase: uint256
                loan_increase: uint256

            @internal
            def _add_collateral_borrow(d_collateral: uint256, d_debt: uint256, _for: address, remove_collateral: bool):
                """
                @notice Internal method to borrow and add or remove collateral
                @param d_collateral Amount of collateral to add
                @param d_debt Amount of debt increase
                @param _for Address to transfer tokens to
                @param remove_collateral Remove collateral instead of adding
                """
                debt: uint256 = 0
                rate_mul: uint256 = 0
                debt, rate_mul = self._debt(_for)
                assert debt > 0, "Loan doesn't exist"
                debt += d_debt
                ns: int256[2] = AMM.read_user_tick_numbers(_for)
                size: uint256 = convert(unsafe_add(unsafe_sub(ns[1], ns[0]), 1), uint256)

                xy: uint256[2] = AMM.withdraw(_for, 10**18)
                assert xy[0] == 0, "Already in underwater mode"
                if remove_collateral:
                    xy[1] -= d_collateral
                else:
                    xy[1] += d_collateral
                n1: int256 = self._calculate_debt_n1(xy[1], debt, size)
                n2: int256 = n1 + unsafe_sub(ns[1], ns[0])

                AMM.deposit_range(_for, xy[1], n1, n2)
                self.loan[_for] = Loan({initial_debt: debt, rate_mul: rate_mul})
                liquidation_discount: uint256 = self.liquidation_discount
                self.liquidation_discounts[_for] = liquidation_discount

                if d_debt != 0:
                    total_debt: uint256 = self._total_debt.initial_debt * rate_mul / self._total_debt.rate_mul + d_debt
                    self._total_debt.initial_debt = total_debt
                    self._total_debt.rate_mul = rate_mul

                if remove_collateral:
                    log RemoveCollateral(_for, d_collateral)
                else:
                    log Borrow(_for, d_collateral, d_debt)
                log UserState(_for, xy[1], debt, n1, n2, liquidation_discount)

            @payable
            @external
            @nonreentrant('lock')
            def add_collateral(collateral: uint256, _for: address = msg.sender):
                """
                @notice Add extra collateral to avoid bad liqidations
                @param collateral Amount of collateral to add
                @param _for Address to add collateral for
                """
                if collateral == 0:
                    return
                self._add_collateral_borrow(collateral, 0, _for, False)
                self._deposit_collateral(collateral, msg.value)

            @internal
            def _deposit_collateral(amount: uint256, mvalue: uint256):
                """
                Deposits raw ETH, WETH or both at the same time
                """
                if not USE_ETH:
                    assert mvalue == 0  # dev: Not accepting ETH
                diff: uint256 = amount - mvalue  # dev: Incorrect ETH amount
                if mvalue > 0:
                    WETH(COLLATERAL_TOKEN.address).deposit(value=mvalue)
                    assert COLLATERAL_TOKEN.transfer(AMM.address, mvalue)
                if diff > 0:
                    assert COLLATERAL_TOKEN.transferFrom(msg.sender, AMM.address, diff, default_return_value=True)
            ```
        
        === "AMM.vy"

            ```python hl_lines="1 9 84"
            event Deposit:
                provider: indexed(address)
                amount: uint256
                n1: int256
                n2: int256

            @external
            @nonreentrant('lock')
            def deposit_range(user: address, amount: uint256, n1: int256, n2: int256):
                """
                @notice Deposit for a user in a range of bands. Only admin contract (Controller) can do it
                @param user User address
                @param amount Amount of collateral to deposit
                @param n1 Lower band in the deposit range
                @param n2 Upper band in the deposit range
                """
                assert msg.sender == self.admin

                user_shares: DynArray[uint256, MAX_TICKS_UINT] = []
                collateral_shares: DynArray[uint256, MAX_TICKS_UINT] = []

                n0: int256 = self.active_band

                # We assume that n1,n2 area already sorted (and they are in Controller)
                assert n2 < 2**127
                assert n1 > -2**127

                lm: LMGauge = self.liquidity_mining_callback

                # Autoskip bands if we can
                for i in range(MAX_SKIP_TICKS + 1):
                    if n1 > n0:
                        if i != 0:
                            self.active_band = n0
                        break
                    assert self.bands_x[n0] == 0 and i < MAX_SKIP_TICKS, "Deposit below current band"
                    n0 -= 1

                n_bands: uint256 = unsafe_add(convert(unsafe_sub(n2, n1), uint256), 1)
                assert n_bands <= MAX_TICKS_UINT

                y_per_band: uint256 = unsafe_div(amount * COLLATERAL_PRECISION, n_bands)
                assert y_per_band > 100, "Amount too low"

                assert self.user_shares[user].ticks[0] == 0  # dev: User must have no liquidity
                self.user_shares[user].ns = unsafe_add(n1, unsafe_mul(n2, 2**128))

                for i in range(MAX_TICKS):
                    band: int256 = unsafe_add(n1, i)
                    if band > n2:
                        break

                    assert self.bands_x[band] == 0, "Band not empty"
                    y: uint256 = y_per_band
                    if i == 0:
                        y = amount * COLLATERAL_PRECISION - y * unsafe_sub(n_bands, 1)

                    total_y: uint256 = self.bands_y[band]

                    # Total / user share
                    s: uint256 = self.total_shares[band]
                    ds: uint256 = unsafe_div((s + DEAD_SHARES) * y, total_y + 1)
                    assert ds > 0, "Amount too low"
                    user_shares.append(ds)
                    s += ds
                    assert s <= 2**128 - 1
                    self.total_shares[band] = s

                    total_y += y
                    self.bands_y[band] = total_y

                    if lm.address != empty(address):
                        # If initial s == 0 - s becomes equal to y which is > 100 => nonzero
                        collateral_shares.append(unsafe_div(total_y * 10**18, s))

                self.min_band = min(self.min_band, n1)
                self.max_band = max(self.max_band, n2)

                self.save_user_shares(user, user_shares)

                self.rate_mul = self._rate_mul()
                self.rate_time = block.timestamp

                log Deposit(user, amount, n1, n2)

                if lm.address != empty(address):
                    lm.callback_collateral_shares(n1, collateral_shares)
                    lm.callback_user_shares(user, n1, user_shares)
            ```

    === "Example"
        ```shell
        >>> controller.add_collateral(todo)
        todo
        ```


### `remove_collateral`
!!! description "`controller.remove_collateral(collateral: uint256, use_eth: bool = True):`"

    Function to remove collateral from a position.

    Emits event: `UserState` and `RemoveCollateral`

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `collateral` |  `uint256` |  Amount of collateral to remove |


    ??? quote "Source code"

        === "Controller.vy"

            ```python hl_lines="1 9 14 49 50 53 57 65 66 69"
            event UserState:
                user: indexed(address)
                collateral: uint256
                debt: uint256
                n1: int256
                n2: int256
                liquidation_discount: uint256

            event RemoveCollateral:
                user: indexed(address)
                collateral_decrease: uint256

            @internal
            def _add_collateral_borrow(d_collateral: uint256, d_debt: uint256, _for: address, remove_collateral: bool):
                """
                @notice Internal method to borrow and add or remove collateral
                @param d_collateral Amount of collateral to add
                @param d_debt Amount of debt increase
                @param _for Address to transfer tokens to
                @param remove_collateral Remove collateral instead of adding
                """
                debt: uint256 = 0
                rate_mul: uint256 = 0
                debt, rate_mul = self._debt(_for)
                assert debt > 0, "Loan doesn't exist"
                debt += d_debt
                ns: int256[2] = AMM.read_user_tick_numbers(_for)
                size: uint256 = convert(unsafe_add(unsafe_sub(ns[1], ns[0]), 1), uint256)

                xy: uint256[2] = AMM.withdraw(_for, 10**18)
                assert xy[0] == 0, "Already in underwater mode"
                if remove_collateral:
                    xy[1] -= d_collateral
                else:
                    xy[1] += d_collateral
                n1: int256 = self._calculate_debt_n1(xy[1], debt, size)
                n2: int256 = n1 + unsafe_sub(ns[1], ns[0])

                AMM.deposit_range(_for, xy[1], n1, n2)
                self.loan[_for] = Loan({initial_debt: debt, rate_mul: rate_mul})
                liquidation_discount: uint256 = self.liquidation_discount
                self.liquidation_discounts[_for] = liquidation_discount

                if d_debt != 0:
                    total_debt: uint256 = self._total_debt.initial_debt * rate_mul / self._total_debt.rate_mul + d_debt
                    self._total_debt.initial_debt = total_debt
                    self._total_debt.rate_mul = rate_mul

                if remove_collateral:
                    log RemoveCollateral(_for, d_collateral)
                else:
                    log Borrow(_for, d_collateral, d_debt)
                log UserState(_for, xy[1], debt, n1, n2, liquidation_discount)

            @external
            @nonreentrant('lock')
            def remove_collateral(collateral: uint256, use_eth: bool = True):
                """
                @notice Remove some collateral without repaying the debt
                @param collateral Amount of collateral to remove
                @param use_eth Use wrapping/unwrapping if collateral is ETH
                """
                if collateral == 0:
                    return
                self._add_collateral_borrow(collateral, 0, msg.sender, True)
                self._withdraw_collateral(msg.sender, collateral, use_eth)

            @internal
            def _withdraw_collateral(_for: address, amount: uint256, use_eth: bool):
                if use_eth and USE_ETH:
                    assert COLLATERAL_TOKEN.transferFrom(AMM.address, self, amount)
                    WETH(COLLATERAL_TOKEN.address).withdraw(amount)
                    raw_call(_for, b"", value=amount, gas=MAX_ETH_GAS)
                else:
                    assert COLLATERAL_TOKEN.transferFrom(AMM.address, _for, amount, default_return_value=True)
            ```
        
        === "AMM.vy"

            ```python hl_lines="1 9 84"
            event Deposit:
                provider: indexed(address)
                amount: uint256
                n1: int256
                n2: int256

            @external
            @nonreentrant('lock')
            def deposit_range(user: address, amount: uint256, n1: int256, n2: int256):
                """
                @notice Deposit for a user in a range of bands. Only admin contract (Controller) can do it
                @param user User address
                @param amount Amount of collateral to deposit
                @param n1 Lower band in the deposit range
                @param n2 Upper band in the deposit range
                """
                assert msg.sender == self.admin

                user_shares: DynArray[uint256, MAX_TICKS_UINT] = []
                collateral_shares: DynArray[uint256, MAX_TICKS_UINT] = []

                n0: int256 = self.active_band

                # We assume that n1,n2 area already sorted (and they are in Controller)
                assert n2 < 2**127
                assert n1 > -2**127

                lm: LMGauge = self.liquidity_mining_callback

                # Autoskip bands if we can
                for i in range(MAX_SKIP_TICKS + 1):
                    if n1 > n0:
                        if i != 0:
                            self.active_band = n0
                        break
                    assert self.bands_x[n0] == 0 and i < MAX_SKIP_TICKS, "Deposit below current band"
                    n0 -= 1

                n_bands: uint256 = unsafe_add(convert(unsafe_sub(n2, n1), uint256), 1)
                assert n_bands <= MAX_TICKS_UINT

                y_per_band: uint256 = unsafe_div(amount * COLLATERAL_PRECISION, n_bands)
                assert y_per_band > 100, "Amount too low"

                assert self.user_shares[user].ticks[0] == 0  # dev: User must have no liquidity
                self.user_shares[user].ns = unsafe_add(n1, unsafe_mul(n2, 2**128))

                for i in range(MAX_TICKS):
                    band: int256 = unsafe_add(n1, i)
                    if band > n2:
                        break

                    assert self.bands_x[band] == 0, "Band not empty"
                    y: uint256 = y_per_band
                    if i == 0:
                        y = amount * COLLATERAL_PRECISION - y * unsafe_sub(n_bands, 1)

                    total_y: uint256 = self.bands_y[band]

                    # Total / user share
                    s: uint256 = self.total_shares[band]
                    ds: uint256 = unsafe_div((s + DEAD_SHARES) * y, total_y + 1)
                    assert ds > 0, "Amount too low"
                    user_shares.append(ds)
                    s += ds
                    assert s <= 2**128 - 1
                    self.total_shares[band] = s

                    total_y += y
                    self.bands_y[band] = total_y

                    if lm.address != empty(address):
                        # If initial s == 0 - s becomes equal to y which is > 100 => nonzero
                        collateral_shares.append(unsafe_div(total_y * 10**18, s))

                self.min_band = min(self.min_band, n1)
                self.max_band = max(self.max_band, n2)

                self.save_user_shares(user, user_shares)

                self.rate_mul = self._rate_mul()
                self.rate_time = block.timestamp

                log Deposit(user, amount, n1, n2)

                if lm.address != empty(address):
                    lm.callback_collateral_shares(n1, collateral_shares)
                    lm.callback_user_shares(user, n1, user_shares)
            ```

    === "Example"
        ```shell
        >>> controller.remove_collateral(todo)
        todo
        ```


### `borrow_more`
!!! description "`controller.borrow_more(collateral: uint256, debt: uint256):`"

    Function to borrow more stablecoins while adding more collateral (not necessary).

    Emits event: `UserState` and `Borrow`

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `collateral` |  `uint256` |  Amount of collateral to add |
    | `debt` |  `uint256` |  Amount of debt to take |


    ??? quote "Source code"

        === "Controller.vy"

            ```python hl_lines="1 9 14 49 50 53 58 66 68"
            event UserState:
                user: indexed(address)
                collateral: uint256
                debt: uint256
                n1: int256
                n2: int256
                liquidation_discount: uint256

            event RemoveCollateral:
                user: indexed(address)
                collateral_decrease: uint256

            @internal
            def _add_collateral_borrow(d_collateral: uint256, d_debt: uint256, _for: address, remove_collateral: bool):
                """
                @notice Internal method to borrow and add or remove collateral
                @param d_collateral Amount of collateral to add
                @param d_debt Amount of debt increase
                @param _for Address to transfer tokens to
                @param remove_collateral Remove collateral instead of adding
                """
                debt: uint256 = 0
                rate_mul: uint256 = 0
                debt, rate_mul = self._debt(_for)
                assert debt > 0, "Loan doesn't exist"
                debt += d_debt
                ns: int256[2] = AMM.read_user_tick_numbers(_for)
                size: uint256 = convert(unsafe_add(unsafe_sub(ns[1], ns[0]), 1), uint256)

                xy: uint256[2] = AMM.withdraw(_for, 10**18)
                assert xy[0] == 0, "Already in underwater mode"
                if remove_collateral:
                    xy[1] -= d_collateral
                else:
                    xy[1] += d_collateral
                n1: int256 = self._calculate_debt_n1(xy[1], debt, size)
                n2: int256 = n1 + unsafe_sub(ns[1], ns[0])

                AMM.deposit_range(_for, xy[1], n1, n2)
                self.loan[_for] = Loan({initial_debt: debt, rate_mul: rate_mul})
                liquidation_discount: uint256 = self.liquidation_discount
                self.liquidation_discounts[_for] = liquidation_discount

                if d_debt != 0:
                    total_debt: uint256 = self._total_debt.initial_debt * rate_mul / self._total_debt.rate_mul + d_debt
                    self._total_debt.initial_debt = total_debt
                    self._total_debt.rate_mul = rate_mul

                if remove_collateral:
                    log RemoveCollateral(_for, d_collateral)
                else:
                    log Borrow(_for, d_collateral, d_debt)
                log UserState(_for, xy[1], debt, n1, n2, liquidation_discount)

            @payable
            @external
            @nonreentrant('lock')
            def borrow_more(collateral: uint256, debt: uint256):
                """
                @notice Borrow more stablecoins while adding more collateral (not necessary)
                @param collateral Amount of collateral to add
                @param debt Amount of stablecoin debt to take
                """
                if debt == 0:
                    return
                self._add_collateral_borrow(collateral, debt, msg.sender, False)
                if collateral != 0:
                    self._deposit_collateral(collateral, msg.value)
                STABLECOIN.transfer(msg.sender, debt)
                self.minted += debt
            ```
        
        === "AMM.vy"

            ```python hl_lines="1 9 84"
            event Deposit:
                provider: indexed(address)
                amount: uint256
                n1: int256
                n2: int256

            @external
            @nonreentrant('lock')
            def deposit_range(user: address, amount: uint256, n1: int256, n2: int256):
                """
                @notice Deposit for a user in a range of bands. Only admin contract (Controller) can do it
                @param user User address
                @param amount Amount of collateral to deposit
                @param n1 Lower band in the deposit range
                @param n2 Upper band in the deposit range
                """
                assert msg.sender == self.admin

                user_shares: DynArray[uint256, MAX_TICKS_UINT] = []
                collateral_shares: DynArray[uint256, MAX_TICKS_UINT] = []

                n0: int256 = self.active_band

                # We assume that n1,n2 area already sorted (and they are in Controller)
                assert n2 < 2**127
                assert n1 > -2**127

                lm: LMGauge = self.liquidity_mining_callback

                # Autoskip bands if we can
                for i in range(MAX_SKIP_TICKS + 1):
                    if n1 > n0:
                        if i != 0:
                            self.active_band = n0
                        break
                    assert self.bands_x[n0] == 0 and i < MAX_SKIP_TICKS, "Deposit below current band"
                    n0 -= 1

                n_bands: uint256 = unsafe_add(convert(unsafe_sub(n2, n1), uint256), 1)
                assert n_bands <= MAX_TICKS_UINT

                y_per_band: uint256 = unsafe_div(amount * COLLATERAL_PRECISION, n_bands)
                assert y_per_band > 100, "Amount too low"

                assert self.user_shares[user].ticks[0] == 0  # dev: User must have no liquidity
                self.user_shares[user].ns = unsafe_add(n1, unsafe_mul(n2, 2**128))

                for i in range(MAX_TICKS):
                    band: int256 = unsafe_add(n1, i)
                    if band > n2:
                        break

                    assert self.bands_x[band] == 0, "Band not empty"
                    y: uint256 = y_per_band
                    if i == 0:
                        y = amount * COLLATERAL_PRECISION - y * unsafe_sub(n_bands, 1)

                    total_y: uint256 = self.bands_y[band]

                    # Total / user share
                    s: uint256 = self.total_shares[band]
                    ds: uint256 = unsafe_div((s + DEAD_SHARES) * y, total_y + 1)
                    assert ds > 0, "Amount too low"
                    user_shares.append(ds)
                    s += ds
                    assert s <= 2**128 - 1
                    self.total_shares[band] = s

                    total_y += y
                    self.bands_y[band] = total_y

                    if lm.address != empty(address):
                        # If initial s == 0 - s becomes equal to y which is > 100 => nonzero
                        collateral_shares.append(unsafe_div(total_y * 10**18, s))

                self.min_band = min(self.min_band, n1)
                self.max_band = max(self.max_band, n2)

                self.save_user_shares(user, user_shares)

                self.rate_mul = self._rate_mul()
                self.rate_time = block.timestamp

                log Deposit(user, amount, n1, n2)

                if lm.address != empty(address):
                    lm.callback_collateral_shares(n1, collateral_shares)
                    lm.callback_user_shares(user, n1, user_shares)
            ```

    === "Example"
        ```shell
        >>> controller.borrow_more(todo)
        todo
        ```


### `liquidate`
!!! description "`controller.liquidate(user: address, min_x: uint256, use_eth: bool = True):`"

    Function to perform a bad liquidation (or self-liquidation) of `user` if `health` is not good.

    Emits event: `Repay` and `Liquidate` 

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `user` |  `address` |  Address to be liquidated |
    | `min_x` |  `uint256` |  Minimal amount of stablecoin to receive (to avoid liquidators being sandwiched) |
    | `use_eth` |  `bool` | Use wrapping/unwrapping if collateral is ETH  |


    ??? quote "Source code"

        === "Controller.vy"

            ```python hl_lines="1 9 14 22 52"
            event UserState:
                user: indexed(address)
                collateral: uint256
                debt: uint256
                n1: int256
                n2: int256
                liquidation_discount: uint256

            event Repay:
                user: indexed(address)
                collateral_decrease: uint256
                loan_decrease: uint256

            event Liquidate:
                liquidator: indexed(address)
                user: indexed(address)
                collateral_received: uint256
                stablecoin_received: uint256
                debt: uint256

            @internal
            def _liquidate(user: address, min_x: uint256, health_limit: uint256, frac: uint256, use_eth: bool,
                        callbacker: address, callback_args: DynArray[uint256,5]):
                """
                @notice Perform a bad liquidation of user if the health is too bad
                @param user Address of the user
                @param min_x Minimal amount of stablecoin withdrawn (to avoid liquidators being sandwiched)
                @param health_limit Minimal health to liquidate at
                @param frac Fraction to liquidate; 100% = 10**18
                @param use_eth Use wrapping/unwrapping if collateral is ETH
                @param callbacker Address of the callback contract
                @param callback_args Extra arguments for the callback (up to 5) such as min_amount etc
                """
                debt: uint256 = 0
                rate_mul: uint256 = 0
                debt, rate_mul = self._debt(user)

                if health_limit != 0:
                    assert self._health(user, debt, True, health_limit) < 0, "Not enough rekt"

                final_debt: uint256 = debt
                debt = unsafe_div(debt * frac, 10**18)
                assert debt > 0
                final_debt = unsafe_sub(final_debt, debt)

                # Withdraw sender's stablecoin and collateral to our contract
                # When frac is set - we withdraw a bit less for the same debt fraction
                # f_remove = ((1 + h/2) / (1 + h) * (1 - frac) + frac) * frac
                # where h is health limit.
                # This is less than full h discount but more than no discount
                f_remove: uint256 = self._get_f_remove(frac, health_limit)
                xy: uint256[2] = AMM.withdraw(user, f_remove)  # [stable, collateral]

                # x increase in same block -> price up -> good
                # x decrease in same block -> price down -> bad
                assert xy[0] >= min_x, "Slippage"

                min_amm_burn: uint256 = min(xy[0], debt)
                if min_amm_burn != 0:
                    STABLECOIN.transferFrom(AMM.address, self, min_amm_burn)

                if debt > xy[0]:
                    to_repay: uint256 = unsafe_sub(debt, xy[0])

                    if callbacker == empty(address):
                        # Withdraw collateral if no callback is present
                        self._withdraw_collateral(msg.sender, xy[1], use_eth)
                        # Request what's left from user
                        STABLECOIN.transferFrom(msg.sender, self, to_repay)

                    else:
                        # Move collateral to callbacker, call it and remove everything from it back in
                        if xy[1] > 0:
                            assert COLLATERAL_TOKEN.transferFrom(AMM.address, callbacker, xy[1], default_return_value=True)
                        # Callback
                        cb: CallbackData = self.execute_callback(
                            callbacker, CALLBACK_LIQUIDATE, user, xy[0], xy[1], debt, callback_args)
                        assert cb.stablecoins >= to_repay, "not enough proceeds"
                        if cb.stablecoins > to_repay:
                            STABLECOIN.transferFrom(callbacker, msg.sender, unsafe_sub(cb.stablecoins, to_repay))
                        STABLECOIN.transferFrom(callbacker, self, to_repay)
                        if cb.collateral > 0:
                            assert COLLATERAL_TOKEN.transferFrom(callbacker, msg.sender, cb.collateral)

                else:
                    # Withdraw collateral
                    self._withdraw_collateral(msg.sender, xy[1], use_eth)
                    # Return what's left to user
                    if xy[0] > debt:
                        STABLECOIN.transferFrom(AMM.address, msg.sender, unsafe_sub(xy[0], debt))

                self.redeemed += debt
                self.loan[user] = Loan({initial_debt: final_debt, rate_mul: rate_mul})
                log Repay(user, xy[1], debt)
                log Liquidate(msg.sender, user, xy[1], xy[0], debt)
                if final_debt == 0:
                    log UserState(user, 0, 0, 0, 0, 0)  # Not logging partial removeal b/c we have not enough info
                    self._remove_from_list(user)

                d: uint256 = self._total_debt.initial_debt * rate_mul / self._total_debt.rate_mul
                self._total_debt.initial_debt = unsafe_sub(max(d, debt), debt)
                self._total_debt.rate_mul = rate_mul

            @external
            @nonreentrant('lock')
            def liquidate(user: address, min_x: uint256, use_eth: bool = True):
                """
                @notice Peform a bad liquidation (or self-liquidation) of user if health is not good
                @param min_x Minimal amount of stablecoin to receive (to avoid liquidators being sandwiched)
                @param use_eth Use wrapping/unwrapping if collateral is ETH
                """
                discount: uint256 = 0
                if user != msg.sender:
                    discount = self.liquidation_discounts[user]
                self._liquidate(user, min_x, discount, 10**18, use_eth, empty(address), [])
            ```
        
        === "AMM.vy"

            ```python hl_lines="1 8"
            event Withdraw:
                provider: indexed(address)
                amount_borrowed: uint256
                amount_collateral: uint256

            @external
            @nonreentrant('lock')
            def withdraw(user: address, frac: uint256) -> uint256[2]:
                """
                @notice Withdraw all liquidity for the user. Only admin contract can do it
                @param user User who owns liquidity
                @param frac Fraction to withdraw (1e18 being 100%)
                @return Amount of [stablecoins, collateral] withdrawn
                """
                assert msg.sender == self.admin
                assert frac <= 10**18

                lm: LMGauge = self.liquidity_mining_callback

                ns: int256[2] = self._read_user_tick_numbers(user)
                n: int256 = ns[0]
                user_shares: DynArray[uint256, MAX_TICKS_UINT] = self._read_user_ticks(user, ns)
                assert user_shares[0] > 0, "No deposits"

                total_x: uint256 = 0
                total_y: uint256 = 0
                min_band: int256 = self.min_band
                old_min_band: int256 = min_band
                max_band: int256 = self.max_band
                old_max_band: int256 = max_band

                for i in range(MAX_TICKS):
                    x: uint256 = self.bands_x[n]
                    y: uint256 = self.bands_y[n]
                    ds: uint256 = unsafe_div(frac * user_shares[i], 10**18)  # Can ONLY zero out when frac == 10**18
                    user_shares[i] = unsafe_sub(user_shares[i], ds)
                    s: uint256 = self.total_shares[n]
                    new_shares: uint256 = s - ds
                    self.total_shares[n] = new_shares
                    s += DEAD_SHARES
                    dx: uint256 = (x + 1) * ds / s
                    dy: uint256 = unsafe_div((y + 1) * ds, s)

                    x -= dx
                    y -= dy

                    # If withdrawal is the last one - tranfer dust to admin fees
                    if new_shares == 0:
                        if x > 0:
                            self.admin_fees_x += x
                        if y > 0:
                            self.admin_fees_y += y / COLLATERAL_PRECISION
                        x = 0
                        y = 0

                    if n == min_band:
                        if x == 0:
                            if y == 0:
                                min_band += 1
                    if x > 0 or y > 0:
                        max_band = n
                    self.bands_x[n] = x
                    self.bands_y[n] = y
                    total_x += dx
                    total_y += dy

                    if n == ns[1]:
                        break
                    else:
                        n = unsafe_add(n, 1)

                # Empty the ticks
                if frac == 10**18:
                    self.user_shares[user].ticks[0] = 0
                else:
                    self.save_user_shares(user, user_shares)

                if old_min_band != min_band:
                    self.min_band = min_band
                if old_max_band <= ns[1]:
                    self.max_band = max_band

                total_x = unsafe_div(total_x, BORROWED_PRECISION)
                total_y = unsafe_div(total_y, COLLATERAL_PRECISION)
                log Withdraw(user, total_x, total_y)

                self.rate_mul = self._rate_mul()
                self.rate_time = block.timestamp

                if lm.address != empty(address):
                    lm.callback_collateral_shares(0, [])  # collateral/shares ratio is unchanged
                    lm.callback_user_shares(user, ns[0], user_shares)

                return [total_x, total_y]
            ```

    === "Example"
        ```shell
        >>> controller.liquidate(todo)
        todo
        ```


### `liquidate_extended`
!!! description "`controller.liquidate_extended(user: address, min_x: uint256, frac: uint256, use_eth: bool, callbacker: address, callback_args: DynArray[uint256,5]):`"

    Extended function to perform a bad liquidation (or self-liquidation) of `user` if `health` is not good.

    Emits event: `Repay` and `Liquidate`

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `user` |  `address` |  Address to be liquidated |
    | `min_x` |  `uint256` |  Minimal amount of stablecoin to receive (to avoid liquidators being sandwiched) |
    | `frac` |  `uint256` | Fraction to liquidate; 100% = 10**18  |
    | `use_eth` |  `bool` | Use wrapping/unwrapping if collateral is ETH  |
    | `callbacker` |  `bool` | Address of the callback contract  |
    | `callback_args` |  `DynArray[uint256,5]` |  Extra arguments for the callback (up to 5) such as `min_amount` |


    ??? quote "Source code"

        === "Controller.vy"

            ```python hl_lines="1 9 14 22 52"
            event UserState:
                user: indexed(address)
                collateral: uint256
                debt: uint256
                n1: int256
                n2: int256
                liquidation_discount: uint256

            event Repay:
                user: indexed(address)
                collateral_decrease: uint256
                loan_decrease: uint256

            event Liquidate:
                liquidator: indexed(address)
                user: indexed(address)
                collateral_received: uint256
                stablecoin_received: uint256
                debt: uint256

            @internal
            def _liquidate(user: address, min_x: uint256, health_limit: uint256, frac: uint256, use_eth: bool,
                        callbacker: address, callback_args: DynArray[uint256,5]):
                """
                @notice Perform a bad liquidation of user if the health is too bad
                @param user Address of the user
                @param min_x Minimal amount of stablecoin withdrawn (to avoid liquidators being sandwiched)
                @param health_limit Minimal health to liquidate at
                @param frac Fraction to liquidate; 100% = 10**18
                @param use_eth Use wrapping/unwrapping if collateral is ETH
                @param callbacker Address of the callback contract
                @param callback_args Extra arguments for the callback (up to 5) such as min_amount etc
                """
                debt: uint256 = 0
                rate_mul: uint256 = 0
                debt, rate_mul = self._debt(user)

                if health_limit != 0:
                    assert self._health(user, debt, True, health_limit) < 0, "Not enough rekt"

                final_debt: uint256 = debt
                debt = unsafe_div(debt * frac, 10**18)
                assert debt > 0
                final_debt = unsafe_sub(final_debt, debt)

                # Withdraw sender's stablecoin and collateral to our contract
                # When frac is set - we withdraw a bit less for the same debt fraction
                # f_remove = ((1 + h/2) / (1 + h) * (1 - frac) + frac) * frac
                # where h is health limit.
                # This is less than full h discount but more than no discount
                f_remove: uint256 = self._get_f_remove(frac, health_limit)
                xy: uint256[2] = AMM.withdraw(user, f_remove)  # [stable, collateral]

                # x increase in same block -> price up -> good
                # x decrease in same block -> price down -> bad
                assert xy[0] >= min_x, "Slippage"

                min_amm_burn: uint256 = min(xy[0], debt)
                if min_amm_burn != 0:
                    STABLECOIN.transferFrom(AMM.address, self, min_amm_burn)

                if debt > xy[0]:
                    to_repay: uint256 = unsafe_sub(debt, xy[0])

                    if callbacker == empty(address):
                        # Withdraw collateral if no callback is present
                        self._withdraw_collateral(msg.sender, xy[1], use_eth)
                        # Request what's left from user
                        STABLECOIN.transferFrom(msg.sender, self, to_repay)

                    else:
                        # Move collateral to callbacker, call it and remove everything from it back in
                        if xy[1] > 0:
                            assert COLLATERAL_TOKEN.transferFrom(AMM.address, callbacker, xy[1], default_return_value=True)
                        # Callback
                        cb: CallbackData = self.execute_callback(
                            callbacker, CALLBACK_LIQUIDATE, user, xy[0], xy[1], debt, callback_args)
                        assert cb.stablecoins >= to_repay, "not enough proceeds"
                        if cb.stablecoins > to_repay:
                            STABLECOIN.transferFrom(callbacker, msg.sender, unsafe_sub(cb.stablecoins, to_repay))
                        STABLECOIN.transferFrom(callbacker, self, to_repay)
                        if cb.collateral > 0:
                            assert COLLATERAL_TOKEN.transferFrom(callbacker, msg.sender, cb.collateral)

                else:
                    # Withdraw collateral
                    self._withdraw_collateral(msg.sender, xy[1], use_eth)
                    # Return what's left to user
                    if xy[0] > debt:
                        STABLECOIN.transferFrom(AMM.address, msg.sender, unsafe_sub(xy[0], debt))

                self.redeemed += debt
                self.loan[user] = Loan({initial_debt: final_debt, rate_mul: rate_mul})
                log Repay(user, xy[1], debt)
                log Liquidate(msg.sender, user, xy[1], xy[0], debt)
                if final_debt == 0:
                    log UserState(user, 0, 0, 0, 0, 0)  # Not logging partial removeal b/c we have not enough info
                    self._remove_from_list(user)

                d: uint256 = self._total_debt.initial_debt * rate_mul / self._total_debt.rate_mul
                self._total_debt.initial_debt = unsafe_sub(max(d, debt), debt)
                self._total_debt.rate_mul = rate_mul

            @external
            @nonreentrant('lock')
            def liquidate_extended(user: address, min_x: uint256, frac: uint256, use_eth: bool,
                                callbacker: address, callback_args: DynArray[uint256,5]):
                """
                @notice Peform a bad liquidation (or self-liquidation) of user if health is not good
                @param min_x Minimal amount of stablecoin to receive (to avoid liquidators being sandwiched)
                @param frac Fraction to liquidate; 100% = 10**18
                @param use_eth Use wrapping/unwrapping if collateral is ETH
                @param callbacker Address of the callback contract
                @param callback_args Extra arguments for the callback (up to 5) such as min_amount etc
                """
                discount: uint256 = 0
                if user != msg.sender:
                    discount = self.liquidation_discounts[user]
                self._liquidate(user, min_x, discount, min(frac, 10**18), use_eth, callbacker, callback_args)
            ```
        
        === "AMM.vy"

            ```python hl_lines="1 8"
            event Withdraw:
                provider: indexed(address)
                amount_borrowed: uint256
                amount_collateral: uint256

            @external
            @nonreentrant('lock')
            def withdraw(user: address, frac: uint256) -> uint256[2]:
                """
                @notice Withdraw all liquidity for the user. Only admin contract can do it
                @param user User who owns liquidity
                @param frac Fraction to withdraw (1e18 being 100%)
                @return Amount of [stablecoins, collateral] withdrawn
                """
                assert msg.sender == self.admin
                assert frac <= 10**18

                lm: LMGauge = self.liquidity_mining_callback

                ns: int256[2] = self._read_user_tick_numbers(user)
                n: int256 = ns[0]
                user_shares: DynArray[uint256, MAX_TICKS_UINT] = self._read_user_ticks(user, ns)
                assert user_shares[0] > 0, "No deposits"

                total_x: uint256 = 0
                total_y: uint256 = 0
                min_band: int256 = self.min_band
                old_min_band: int256 = min_band
                max_band: int256 = self.max_band
                old_max_band: int256 = max_band

                for i in range(MAX_TICKS):
                    x: uint256 = self.bands_x[n]
                    y: uint256 = self.bands_y[n]
                    ds: uint256 = unsafe_div(frac * user_shares[i], 10**18)  # Can ONLY zero out when frac == 10**18
                    user_shares[i] = unsafe_sub(user_shares[i], ds)
                    s: uint256 = self.total_shares[n]
                    new_shares: uint256 = s - ds
                    self.total_shares[n] = new_shares
                    s += DEAD_SHARES
                    dx: uint256 = (x + 1) * ds / s
                    dy: uint256 = unsafe_div((y + 1) * ds, s)

                    x -= dx
                    y -= dy

                    # If withdrawal is the last one - tranfer dust to admin fees
                    if new_shares == 0:
                        if x > 0:
                            self.admin_fees_x += x
                        if y > 0:
                            self.admin_fees_y += y / COLLATERAL_PRECISION
                        x = 0
                        y = 0

                    if n == min_band:
                        if x == 0:
                            if y == 0:
                                min_band += 1
                    if x > 0 or y > 0:
                        max_band = n
                    self.bands_x[n] = x
                    self.bands_y[n] = y
                    total_x += dx
                    total_y += dy

                    if n == ns[1]:
                        break
                    else:
                        n = unsafe_add(n, 1)

                # Empty the ticks
                if frac == 10**18:
                    self.user_shares[user].ticks[0] = 0
                else:
                    self.save_user_shares(user, user_shares)

                if old_min_band != min_band:
                    self.min_band = min_band
                if old_max_band <= ns[1]:
                    self.max_band = max_band

                total_x = unsafe_div(total_x, BORROWED_PRECISION)
                total_y = unsafe_div(total_y, COLLATERAL_PRECISION)
                log Withdraw(user, total_x, total_y)

                self.rate_mul = self._rate_mul()
                self.rate_time = block.timestamp

                if lm.address != empty(address):
                    lm.callback_collateral_shares(0, [])  # collateral/shares ratio is unchanged
                    lm.callback_user_shares(user, ns[0], user_shares)

                return [total_x, total_y]
            ```

    === "Example"
        ```shell
        >>> controller.liquidate_extended(todo)
        todo
        ```


## **Loan Info Methods**

### `debt`
!!! description "`controller.debt(user: address) -> uint256:`"

    Getter for the amount of debt for `user`. Decreases every block due to interest rate.

    Returns: debt (`uint256`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `user` |  `address` | User Address |

    ??? quote "Source code"

        ```python hl_lines="1 7 23"
        struct Loan:
            initial_debt: uint256
            rate_mul: uint256

        @internal
        @view
        def _debt_ro(user: address) -> uint256:
            """
            @notice Get the value of debt without changing the state
            @param user User address
            @return Value of debt
            """
            rate_mul: uint256 = AMM.get_rate_mul()
            loan: Loan = self.loan[user]
            if loan.initial_debt == 0:
                return 0
            else:
                return loan.initial_debt * rate_mul / loan.rate_mul

        @external
        @view
        @nonreentrant('lock')
        def debt(user: address) -> uint256:
            """
            @notice Get the value of debt without changing the state
            @param user User address
            @return Value of debt
            """
            return self._debt_ro(user)

        ```

    === "Example"
        ```shell
        >>> controller.debt("0x7a16fF8270133F063aAb6C9977183D9e72835428")
        1552311414080668514314009
        ```


### `total_debt`
!!! description "`controller.total_debt() -> uint256:`"

    Getter for the total debt of the controller (=total borrowed crvusd for the market).

    Returns: total debt (`uint256`) of the market.

    ??? quote "Source code"

        ```python hl_lines="3"
        @external
        @view
        def total_debt() -> uint256:
            """
            @notice Total debt of this controller
            """
            rate_mul: uint256 = AMM.get_rate_mul()
            loan: Loan = self._total_debt
            return loan.initial_debt * rate_mul / loan.rate_mul
        ```

    === "Example"
        ```shell
        >>> controller.total_debt()
        9045646634477681048071827
        ```


### `loan_exists`
!!! description "`controller.loan_exists(user: address) -> bool:`"

    Function to check if a loan for `user` exists.

    Returns: true or false (`bool`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `user` |  `address` | Address |

    ??? quote "Source code"

        ```python hl_lines="4"
        @external
        @view
        @nonreentrant('lock')
        def loan_exists(user: address) -> bool:
            """
            @notice Check whether there is a loan of `user` in existence
            """
            return self.loan[user].initial_debt > 0
        ```

    === "Example"
        ```shell
        >>> controller.loan_exists("0x7a16fF8270133F063aAb6C9977183D9e72835428")
        'true'
        ```


### `user_prices`
!!! description "`controller.user_prices(user: address) -> uint256[2]:`"

    Getter for the highest price of the upper band and lowest price of the lower band the user has deposited in the AMM.

    Returns: upper and lower band-price (`uint256`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `user` |  `address` | User address |


    ??? quote "Source code"

        === "Controller.vy"

            ```python hl_lines="4"
            @view
            @external
            @nonreentrant('lock')
            def user_prices(user: address) -> uint256[2]:  # Upper, lower
                """
                @notice Lowest price of the lower band and highest price of the upper band the user has deposit in the AMM
                @param user User address
                @return (upper_price, lower_price)
                """
                assert AMM.has_liquidity(user)
                ns: int256[2] = AMM.read_user_tick_numbers(user) # ns[1] > ns[0]
                return [AMM.p_oracle_up(ns[0]), AMM.p_oracle_down(ns[1])]
            ```

        === "AMM.vy"

            ```python hl_lines="3 50 60"
            @internal
            @view
            def _p_oracle_up(n: int256) -> uint256:
                """
                @notice Upper oracle price for the band to have liquidity when p = p_oracle
                @param n Band number (can be negative)
                @return Price at 1e18 base
                """
                # p_oracle_up(n) = p_base * ((A - 1) / A) ** n
                # p_oracle_down(n) = p_base * ((A - 1) / A) ** (n + 1) = p_oracle_up(n+1)
                # return unsafe_div(self._base_price() * self.exp_int(-n * LOG_A_RATIO), 10**18)

                power: int256 = -n * LOG_A_RATIO

                # ((A - 1) / A) ** n = exp(-n * A / (A - 1)) = exp(-n * LOG_A_RATIO)
                ## Exp implementation based on solmate's
                assert power > -42139678854452767551
                assert power < 135305999368893231589

                x: int256 = unsafe_div(unsafe_mul(power, 2**96), 10**18)

                k: int256 = unsafe_div(
                    unsafe_add(
                        unsafe_div(unsafe_mul(x, 2**96), 54916777467707473351141471128),
                        2**95),
                    2**96)
                x = unsafe_sub(x, unsafe_mul(k, 54916777467707473351141471128))

                y: int256 = unsafe_add(x, 1346386616545796478920950773328)
                y = unsafe_add(unsafe_div(unsafe_mul(y, x), 2**96), 57155421227552351082224309758442)
                p: int256 = unsafe_sub(unsafe_add(y, x), 94201549194550492254356042504812)
                p = unsafe_add(unsafe_div(unsafe_mul(p, y), 2**96), 28719021644029726153956944680412240)
                p = unsafe_add(unsafe_mul(p, x), (4385272521454847904659076985693276 * 2**96))

                q: int256 = x - 2855989394907223263936484059900
                q = unsafe_add(unsafe_div(unsafe_mul(q, x), 2**96), 50020603652535783019961831881945)
                q = unsafe_sub(unsafe_div(unsafe_mul(q, x), 2**96), 533845033583426703283633433725380)
                q = unsafe_add(unsafe_div(unsafe_mul(q, x), 2**96), 3604857256930695427073651918091429)
                q = unsafe_sub(unsafe_div(unsafe_mul(q, x), 2**96), 14423608567350463180887372962807573)
                q = unsafe_add(unsafe_div(unsafe_mul(q, x), 2**96), 26449188498355588339934803723976023)

                exp_result: uint256 = shift(
                    unsafe_mul(convert(unsafe_div(p, q), uint256), 3822833074963236453042738258902158003155416615667),
                    unsafe_sub(k, 195))
                ## End exp
                return unsafe_div(self._base_price() * exp_result, 10**18)

            @external
            @view
            def p_oracle_up(n: int256) -> uint256:
                """
                @notice Highest oracle price for the band to have liquidity when p = p_oracle
                @param n Band number (can be negative)
                @return Price at 1e18 base
                """
                return self._p_oracle_up(n)

            @external
            @view
            def p_oracle_down(n: int256) -> uint256:
                """
                @notice Lowest oracle price for the band to have liquidity when p = p_oracle
                @param n Band number (can be negative)
                @return Price at 1e18 base
                """
                return self._p_oracle_up(n + 1)
            ```

    === "Example"
        ```shell
        >>> controller.users_price("0x7a16fF8270133F063aAb6C9977183D9e72835428"):
        1975909341832570932896, 1786976990595821859153
        ```


### `health`
!!! description "`controller.health(user: address, full: bool = False) -> int256:`"

    Getter for the health of the position normalized to 1e18 for `user`.

    Returns: health (`int256`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `user` |  `address` |  User address |
    | `full` |  `bool` | Weather to take into account the price difference above the highest user's band |
    | `liquidation_discount` |  `uint256` | Liquidation discount (defaults to 0) |

    ??? quote "Source code"

        ```python hl_lines="3 32"
        @internal
        @view
        def _health(user: address, debt: uint256, full: bool, liquidation_discount: uint256) -> int256:
            """
            @notice Returns position health normalized to 1e18 for the user.
                    Liquidation starts when < 0, however devaluation of collateral doesn't cause liquidation
            @param user User address to calculate health for
            @param debt The amount of debt to calculate health for
            @param full Whether to take into account the price difference above the highest user's band
            @param liquidation_discount Liquidation discount to use (can be 0)
            @return Health: > 0 = good.
            """
            assert debt > 0, "Loan doesn't exist"
            health: int256 = 10**18
            if liquidation_discount > 0:
                health -= convert(liquidation_discount, int256)
            health = unsafe_div(convert(AMM.get_x_down(user), int256) * health, convert(debt, int256)) - 10**18

            if full:
                ns: int256[2] = AMM.read_user_tick_numbers(user) # ns[1] > ns[0]
                if ns[0] > AMM.active_band():  # We are not in liquidation mode
                    p: uint256 = AMM.price_oracle()
                    p_up: uint256 = AMM.p_oracle_up(ns[0])
                    if p > p_up:
                        health += convert(unsafe_div((p - p_up) * AMM.get_sum_xy(user)[1] * COLLATERAL_PRECISION, debt), int256)

            return health

        @view
        @external
        @nonreentrant('lock')
        def health(user: address, full: bool = False) -> int256:
            """
            @notice Returns position health normalized to 1e18 for the user.
                    Liquidation starts when < 0, however devaluation of collateral doesn't cause liquidation
            """
            return self._health(user, self._debt_ro(user), full, self.liquidation_discounts[user])
        ```

    === "Example"
        ```shell
        >>> controller.health("0x04d52e150E49c1bbc9Ddde258060A3bF28D9fD70")
        33346624773659668
        >>> controller.health("0x04d52e150E49c1bbc9Ddde258060A3bF28D9fD70", 1)
        493166314275207865
        ```


### `user_state`
!!! description "`controller.user_state(user: address) -> uint256[4]:`"

    Getter for the user state in one call.

    Returns: collateral, stablecoin, debt and number of bands (`uint256`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `user` |  `address` | User address to return state for |


    ??? quote "Source code"

        === "Controller.vy"

            ```python hl_lines="4 12"
            @view
            @external
            @nonreentrant('lock')
            def user_state(user: address) -> uint256[4]:
                """
                @notice Return the user state in one call
                @param user User to return the state for
                @return (collateral, stablecoin, debt, N)
                """
                xy: uint256[2] = AMM.get_sum_xy(user)
                ns: int256[2] = AMM.read_user_tick_numbers(user) # ns[1] > ns[0]
                return [xy[1], xy[0], self._debt_ro(user), convert(unsafe_add(unsafe_sub(ns[1], ns[0]), 1), uint256)]
            ```

        === "AMM.vy"

            ```python hl_lines="4 15"
            @external
            @view
            @nonreentrant('lock')
            def get_sum_xy(user: address) -> uint256[2]:
                """
                @notice A low-gas function to measure amounts of stablecoins and collateral which user currently owns
                @param user User address
                @return Amounts of (stablecoin, collateral) in a tuple
                """
                xy: DynArray[uint256, MAX_TICKS_UINT][2] = self._get_xy(user, True)
                return [xy[0][0], xy[1][0]]

            @internal
            @view
            def _read_user_tick_numbers(user: address) -> int256[2]:
                """
                @notice Unpacks and reads user tick numbers
                @param user User address
                @return Lowest and highest band the user deposited into
                """
                ns: int256 = self.user_shares[user].ns
                n2: int256 = unsafe_div(ns, 2**128)
                n1: int256 = ns % 2**128
                if n1 >= 2**127:
                    n1 = unsafe_sub(n1, 2**128)
                    n2 = unsafe_add(n2, 1)
                return [n1, n2]
            ```

    === "Example"
        ```shell
        >>> controller.user_state("0x7a16fF8270133F063aAb6C9977183D9e72835428"):
        523889507286953887976, 643761728367446923280941, 1455238676830152227963549, 10
        ```


### `loans`
!!! description "`controller.liquidation_discounts(arg0: uint256) -> uint256: view`"

    Getter for the user that created loan at index `arg0`.

    Returns: user (`address`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `arg0` |  `uint256` |  Index |

    ??? quote "Source code"

        ```python hl_lines="1"
        loans: public(address[2**64 - 1])  # Enumerate existing loans
        ```

    === "Example"
        ```shell
        >>> controller.loans(0)
        '0x7a16fF8270133F063aAb6C9977183D9e72835428'
        ```


### `loan_ix`
!!! description "`controller.loan_ix(arg0: address) -> address: view`"

    Getter for the posistion of the loan in the list.

    Returns: index (`uint256`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `arg0` |  `address` |  User address |

    ??? quote "Source code"

        ```python hl_lines="1"
        loan_ix: public(HashMap[address, uint256])  # Position of the loan in the list
        ```

    === "Example"
        ```shell
        >>> controller.loans_ix("0x7a16fF8270133F063aAb6C9977183D9e72835428")
        0
        ```

     
### `n_loans`
!!! description "`controller.n_loans() -> uint256: view`"

    Getter for the number of loans.

    Returns: total loans (`uint256`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `arg0` |  `address` |  User address |

    ??? quote "Source code"

        ```python hl_lines="1"
        n_loans: public(uint256)  # Number of nonzero loans
        ```

    === "Example"
        ```shell
        >>> controller.n_loans()
        136
        ```

## **Useful Loan Calculations**
The following functions can be used to pre-calculate metrics before creating a loan.

### `max_borrowable`
!!! description "`controller.max_borrowable(collateral: uint256, N: uint256) -> uint256:`"

    Function to calculate the maximum amount of crvUSD that can be borrowed against `collateral` using `N`-bands. If the max_borrowable amount exceeds the crvUSD balance of the controller (essentially, what is left to be borrowed), it returns the amount that remains available for borrowing.

    Returns: maximum borrowable amount (`uint256`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `collateral` |  `uint256` | Collateral amount |
    | `N` |  `uint256` | Number of bands |

    ??? quote "Source code"

        ```python hl_lines="3 28 33 58"
        @internal
        @view
        def get_y_effective(collateral: uint256, N: uint256, discount: uint256) -> uint256:
            """
            @notice Intermediary method which calculates y_effective defined as x_effective / p_base,
                    however discounted by loan_discount.
                    x_effective is an amount which can be obtained from collateral when liquidating
            @param collateral Amount of collateral to get the value for
            @param N Number of bands the deposit is made into
            @param discount Loan discount at 1e18 base (e.g. 1e18 == 100%)
            @return y_effective
            """
            # x_effective = sum_{i=0..N-1}(y / N * p(n_{n1+i})) =
            # = y / N * p_oracle_up(n1) * sqrt((A - 1) / A) * sum_{0..N-1}(((A-1) / A)**k)
            # === d_y_effective * p_oracle_up(n1) * sum(...) === y_effective * p_oracle_up(n1)
            # d_y_effective = y / N / sqrt(A / (A - 1))
            # d_y_effective: uint256 = collateral * unsafe_sub(10**18, discount) / (SQRT_BAND_RATIO * N)
            # Make some extra discount to always deposit lower when we have DEAD_SHARES rounding
            d_y_effective: uint256 = collateral * unsafe_sub(
                10**18, min(discount + (DEAD_SHARES * 10**18) / max(collateral / N, DEAD_SHARES), 10**18)
            ) / (SQRT_BAND_RATIO * N)
            y_effective: uint256 = d_y_effective
            for i in range(1, MAX_TICKS_UINT):
                if i == N:
                    break
                d_y_effective = unsafe_div(d_y_effective * Aminus1, A)
                y_effective = unsafe_add(y_effective, d_y_effective)
            return y_effective

        @external
        @view
        @nonreentrant('lock')
        def max_borrowable(collateral: uint256, N: uint256) -> uint256:
            """
            @notice Calculation of maximum which can be borrowed (details in comments)
            @param collateral Collateral amount against which to borrow
            @param N number of bands to have the deposit into
            @return Maximum amount of stablecoin to borrow
            """
            # Calculation of maximum which can be borrowed.
            # It corresponds to a minimum between the amount corresponding to price_oracle
            # and the one given by the min reachable band.
            #
            # Given by p_oracle (perhaps needs to be multiplied by (A - 1) / A to account for mid-band effects)
            # x_max ~= y_effective * p_oracle
            #
            # Given by band number:
            # if n1 is the lowest empty band in the AMM
            # xmax ~= y_effective * amm.p_oracle_up(n1)
            #
            # When n1 -= 1:
            # p_oracle_up *= A / (A - 1)

            y_effective: uint256 = self.get_y_effective(collateral * COLLATERAL_PRECISION, N, self.loan_discount)

            x: uint256 = unsafe_sub(max(unsafe_div(y_effective * self.max_p_base(), 10**18), 1), 1)
            x = unsafe_div(x * (10**18 - 10**14), 10**18)  # Make it a bit smaller
            return min(x, STABLECOIN.balanceOf(self))  # Cannot borrow beyond the amount of coins Controller has
        ```

    === "Example"
        ```shell
        >>> controller.max_borrowable(1000000000000000000, 20)
        1609245276829365771473
        ```


### `min_collateral`
!!! description "`controller.min_collateral(debt: uint256, N: uint256) -> uint256:`"

    Function to calculate the minimum amount of collateral that is necessary to support `debt` using `N`-bands.

    Returns: minimal collateral amount (`uint256`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `debt` |  `uint256` |  Debt |
    | `N` |  `uint256` | Number of bands |

    ??? quote "Source code"

        ```python hl_lines="3 28 33 41 42"
        @internal
        @view
        def get_y_effective(collateral: uint256, N: uint256, discount: uint256) -> uint256:
            """
            @notice Intermediary method which calculates y_effective defined as x_effective / p_base,
                    however discounted by loan_discount.
                    x_effective is an amount which can be obtained from collateral when liquidating
            @param collateral Amount of collateral to get the value for
            @param N Number of bands the deposit is made into
            @param discount Loan discount at 1e18 base (e.g. 1e18 == 100%)
            @return y_effective
            """
            # x_effective = sum_{i=0..N-1}(y / N * p(n_{n1+i})) =
            # = y / N * p_oracle_up(n1) * sqrt((A - 1) / A) * sum_{0..N-1}(((A-1) / A)**k)
            # === d_y_effective * p_oracle_up(n1) * sum(...) === y_effective * p_oracle_up(n1)
            # d_y_effective = y / N / sqrt(A / (A - 1))
            # d_y_effective: uint256 = collateral * unsafe_sub(10**18, discount) / (SQRT_BAND_RATIO * N)
            # Make some extra discount to always deposit lower when we have DEAD_SHARES rounding
            d_y_effective: uint256 = collateral * unsafe_sub(
                10**18, min(discount + (DEAD_SHARES * 10**18) / max(collateral / N, DEAD_SHARES), 10**18)
            ) / (SQRT_BAND_RATIO * N)
            y_effective: uint256 = d_y_effective
            for i in range(1, MAX_TICKS_UINT):
                if i == N:
                    break
                d_y_effective = unsafe_div(d_y_effective * Aminus1, A)
                y_effective = unsafe_add(y_effective, d_y_effective)
            return y_effective

        @external
        @view
        @nonreentrant('lock')
        def min_collateral(debt: uint256, N: uint256) -> uint256:
            """
            @notice Minimal amount of collateral required to support debt
            @param debt The debt to support
            @param N Number of bands to deposit into
            @return Minimal collateral required
            """
            # Add N**2 to account for precision loss in multiple bands, e.g. N * 1 / (y/N) = N**2 / y
            return unsafe_div(unsafe_div(debt * 10**18 / self.max_p_base() * 10**18 / self.get_y_effective(10**18, N, self.loan_discount) + N * (N + 2 * DEAD_SHARES), COLLATERAL_PRECISION) * 10**18, 10**18 - 10**14)
        ```

    === "Example"
        ```shell
        >>> controller.min_collateral(1609245276829365771473, 20)
        999999846411950179
        ```


### `calculate_debt_n1`
!!! description "`controller.calculate_debt_n1(collateral: uint256, debt: uint256, N: uint256) -> int256:`"

    Getter method to calculate the upper band number for the deposit to sit in to support the give debt.

    Returns: upper band n1 (`int256`) to depostit the collateral into.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `collateral` |  `uint256` |  Amount of collateral (at its native precision) |
    | `debt` |  `uint256` | Amount of requested debt |
    | `N` |  `uint256` | Number of bands to deposit into |

    !!!note
        This call reverts if the requested debt is too high.

    ??? quote "Source code"

        ```python hl_lines="3 52"
        @internal
        @view
        def _calculate_debt_n1(collateral: uint256, debt: uint256, N: uint256) -> int256:
            """
            @notice Calculate the upper band number for the deposit to sit in to support
                    the given debt. Reverts if requested debt is too high.
            @param collateral Amount of collateral (at its native precision)
            @param debt Amount of requested debt
            @param N Number of bands to deposit into
            @return Upper band n1 (n1 <= n2) to deposit into. Signed integer
            """
            assert debt > 0, "No loan"
            n0: int256 = AMM.active_band()
            p_base: uint256 = AMM.p_oracle_up(n0)

            # x_effective = y / N * p_oracle_up(n1) * sqrt((A - 1) / A) * sum_{0..N-1}(((A-1) / A)**k)
            # === d_y_effective * p_oracle_up(n1) * sum(...) === y_effective * p_oracle_up(n1)
            # d_y_effective = y / N / sqrt(A / (A - 1))
            y_effective: uint256 = self.get_y_effective(collateral * COLLATERAL_PRECISION, N, self.loan_discount)
            # p_oracle_up(n1) = base_price * ((A - 1) / A)**n1

            # We borrow up until min band touches p_oracle,
            # or it touches non-empty bands which cannot be skipped.
            # We calculate required n1 for given (collateral, debt),
            # and if n1 corresponds to price_oracle being too high, or unreachable band
            # - we revert.

            # n1 is band number based on adiabatic trading, e.g. when p_oracle ~ p
            y_effective = y_effective * p_base / (debt + 1)  # Now it's a ratio

            # n1 = floor(log2(y_effective) / self.logAratio)
            # EVM semantics is not doing floor unlike Python, so we do this
            assert y_effective > 0, "Amount too low"
            n1: int256 = self.log2(y_effective)  # <- switch to faster ln() XXX?
            if n1 < 0:
                n1 -= LOG2_A_RATIO - 1  # This is to deal with vyper's rounding of negative numbers
            n1 /= LOG2_A_RATIO

            n1 = min(n1, 1024 - convert(N, int256)) + n0
            if n1 <= n0:
                assert AMM.can_skip_bands(n1 - 1), "Debt too high"

            # Let's not rely on active_band corresponding to price_oracle:
            # this will be not correct if we are in the area of empty bands
            assert AMM.p_oracle_up(n1) < AMM.price_oracle(), "Debt too high"

            return n1

            @external
            @view
            @nonreentrant('lock')
            def calculate_debt_n1(collateral: uint256, debt: uint256, N: uint256) -> int256:
                """
                @notice Calculate the upper band number for the deposit to sit in to support
                        the given debt. Reverts if requested debt is too high.
                @param collateral Amount of collateral (at its native precision)
                @param debt Amount of requested debt
                @param N Number of bands to deposit into
                @return Upper band n1 (n1 <= n2) to deposit into. Signed integer
                """
                return self._calculate_debt_n1(collateral, debt, N)
        ```

    === "Example"
        ```shell
        >>> controller.calculate_debt_n1(todo)
        todo
        ```


### `health_calculator`
!!! description "`controller.health_calculator(user: address, d_collateral: int256, d_debt: int256, full: bool, N: uint256 = 0) -> int256:`"

    Function to predict the health after changing collateral (`d_collateral`) or debt (`d_debt`).

    Returns: health value (`int256`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `user` |  `address` |  Address of the user |
    | `d_collateral` |  `int256` | Change in collateral amount |
    | `d_debt` |  `int256` | Change in debt amount |
    | `full` |  `bool` | Weather it is a 'full' health or not |
    | `N` |  `uint256` | Number of bands in case loan does not exist yet |


    ??? quote "Source code"

        ```python hl_lines="4"
        @external
        @view
        @nonreentrant('lock')
        def health_calculator(user: address, d_collateral: int256, d_debt: int256, full: bool, N: uint256 = 0) -> int256:
            """
            @notice Health predictor in case user changes the debt or collateral
            @param user Address of the user
            @param d_collateral Change in collateral amount (signed)
            @param d_debt Change in debt amount (signed)
            @param full Whether it's a 'full' health or not
            @param N Number of bands in case loan doesn't yet exist
            @return Signed health value
            """
            ns: int256[2] = AMM.read_user_tick_numbers(user)
            debt: int256 = convert(self._debt_ro(user), int256)
            n: uint256 = N
            ld: int256 = 0
            if debt != 0:
                ld = convert(self.liquidation_discounts[user], int256)
                n = convert(unsafe_add(unsafe_sub(ns[1], ns[0]), 1), uint256)
            else:
                ld = convert(self.liquidation_discount, int256)
                ns[0] = max_value(int256)  # This will trigger a "re-deposit"

            n1: int256 = 0
            collateral: int256 = 0
            x_eff: int256 = 0
            debt += d_debt
            assert debt > 0, "Non-positive debt"

            active_band: int256 = AMM.active_band_with_skip()

            if ns[0] > active_band and (d_collateral != 0 or d_debt != 0):  # re-deposit
                collateral = convert(AMM.get_sum_xy(user)[1] * COLLATERAL_PRECISION, int256) + d_collateral
                n1 = self._calculate_debt_n1(convert(collateral, uint256), convert(debt, uint256), n)

            else:
                n1 = ns[0]
                x_eff = convert(AMM.get_x_down(user) * 10**18, int256)

            p0: int256 = convert(AMM.p_oracle_up(n1), int256)
            if ns[0] > active_band:
                x_eff = convert(self.get_y_effective(convert(collateral, uint256), n, 0), int256) * p0

            health: int256 = unsafe_div(x_eff, debt)
            health = health - unsafe_div(health * ld, 10**18) - 10**18

            if full:
                if n1 > active_band:  # We are not in liquidation mode
                    p_diff: int256 = max(p0, convert(AMM.price_oracle(), int256)) - p0
                    if p_diff > 0:
                        health += unsafe_div(p_diff * collateral, debt)

            return health
        ```

    === "Example"
        ```shell
        >>> controller.health_calculator(todo)
        todo
        ```


### `tokens_to_liquidate`
!!! description "`controller.tokens_to_liquidate(user: address, frac: uint256 = 10 ** 18) -> uint256:`"

    Function to calculate the amount of stablecoins to have in a liquidator's wallet in order to liquidate a user.

    Returns: amount (`uint256`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `user` |  `address` |  Address of the user to liquidate |
    | `frac` |  `uint256` | Fraction to liquidate; 100% = 10**18|

    ??? quote "Source code"

        ```python hl_lines="4"
        @view
        @external
        @nonreentrant('lock')
        def tokens_to_liquidate(user: address, frac: uint256 = 10 ** 18) -> uint256:
            """
            @notice Calculate the amount of stablecoins to have in liquidator's wallet to liquidate a user
            @param user Address of the user to liquidate
            @param frac Fraction to liquidate; 100% = 10**18
            @return The amount of stablecoins needed
            """
            health_limit: uint256 = 0
            if user != msg.sender:
                health_limit = self.liquidation_discounts[user]
            f_remove: uint256 = self._get_f_remove(frac, health_limit)
            stablecoins: uint256 = unsafe_div(AMM.get_sum_xy(user)[0] * f_remove, 10 ** 18)
            debt: uint256 = unsafe_div(self._debt_ro(user) * frac, 10 ** 18)

            return unsafe_sub(max(debt, stablecoins), stablecoins)
        ```

    === "Example"
        ```shell
        >>> controller.tokens_to_liquidate(todo)
        todo
        ```


### `users_to_liquidate`
!!! description "`controller.users_to_liquidate(_from: uint256=0, _limit: uint256=0) -> DynArray[Position, 1000]:`"

    Getter for a dynamic array of users who can be "hard-liquidated".

    Returns: dymamic array (`DynArray[Position, 1000]`) with detailed info about positions of users.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_from` |  `uin256` |  Loan index to start iteration from |
    | `_limit` |  `uin256` | Number of loans to look over |

    !!!note
        `_from` and `_limit` default to 0 if no input is given when calling the function.

    ??? quote "Source code"

        ```python hl_lines="4"
        @view
        @external
        @nonreentrant('lock')
        def users_to_liquidate(_from: uint256=0, _limit: uint256=0) -> DynArray[Position, 1000]:
            """
            @notice Returns a dynamic array of users who can be "hard-liquidated".
                    This method is designed for convenience of liquidation bots.
            @param _from Loan index to start iteration from
            @param _limit Number of loans to look over
            @return Dynamic array with detailed info about positions of users
            """
            n_loans: uint256 = self.n_loans
            limit: uint256 = _limit
            if _limit == 0:
                limit = n_loans
            ix: uint256 = _from
            out: DynArray[Position, 1000] = []
            for i in range(10**6):
                if ix >= n_loans or i == limit:
                    break
                user: address = self.loans[ix]
                debt: uint256 = self._debt_ro(user)
                health: int256 = self._health(user, debt, True, self.liquidation_discounts[user])
                if health < 0:
                    xy: uint256[2] = AMM.get_sum_xy(user)
                    out.append(Position({
                        user: user,
                        x: xy[0],
                        y: xy[1],
                        debt: debt,
                        health: health
                    }))
                ix += 1
            return out
        ```

    === "Example"
        ```shell
        >>> controller.users_to_liquidate(0)
        []
        ```



# **Fees**
There are two kinds of fees:
1. Borrowing-based fee: interest rate
2. AMM-based fee: swap fee for trades within the AMM

While the borrowing-based fee is determined by the MonetaryPolicy Contract, the AMM fee can be set by the DAO. Currently, the AMM fees are set to 0.6% with an admin_fee of 0, meaning all the generated fees from trades within the AMM go to the liquidity providers who are essentially the borrowers.

### `admin_fees`
!!! description "`ControllerFactory.admin_fees() -> uint256:`"

    Getter for the claimable admin fees. Claimable by calling [`colletct_fees`](#collect_fees). 

    Returns: admin fees (`uint256`). 

    ??? quote "Source code"

        === "Controller.vy"

            ```python hl_lines="1 7 16"
            struct Loan:
                initial_debt: uint256
                rate_mul: uint256

            @external
            @view
            def admin_fees() -> uint256:
                """
                @notice Calculate the amount of fees obtained from the interest
                """
                rate_mul: uint256 = AMM.get_rate_mul()
                loan: Loan = self._total_debt
                loan.initial_debt = loan.initial_debt * rate_mul / loan.rate_mul
                loan.initial_debt += self.redeemed
                minted: uint256 = self.minted
                return unsafe_sub(max(loan.initial_debt, minted), minted)
            ```

        === "AMM.vy"

                ```python hl_lines="3 8"
                @internal
                @view
                def _rate_mul() -> uint256:
                    """
                    @notice Rate multiplier which is 1.0 + integral(rate, dt)
                    @return Rate multiplier in units where 1.0 == 1e18
                    """
                    return unsafe_div(self.rate_mul * (10**18 + self.rate * (block.timestamp - self.rate_time)), 10**18)
                ```

    === "Example"
        ```shell
        >>> ControllerFactory.admin_fees()
        1412804120167468477413
        ```



### `set_amm_fee`
!!! description "`PoolProxy.set_amm_fee(fee: uint256):`"

    Function to set the AMM fee.

    !!!note 
        This function can only be called by the factory admin. The new fee value should be in between `MIN_FEE` and `MAX_FEE`.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `fee` |  `uint256` | New Fee |


    ??? quote "Source code"

        === "Controller.vy"

            ```python hl_lines="1 2 6 13"
            MIN_FEE: constant(uint256) = 10**6  # 1e-12, still needs to be above 0
            MAX_FEE: constant(uint256) = 10**17  # 10%

            # AMM has nonreentrant decorator
            @external
            def set_amm_fee(fee: uint256):
                """
                @notice Set the AMM fee (factory admin only)
                @param fee The fee which should be no higher than MAX_FEE
                """
                assert msg.sender == FACTORY.admin()
                assert fee <= MAX_FEE and fee >= MIN_FEE, "Fee"
                AMM.set_fee(fee)
            ```

        === "AMM.vy"

            ```python hl_lines="1 4 6 10"
            event SetFee:
                fee: uint256
            
            fee: public(uint256)

            @external
            @nonreentrant('lock')
            def set_fee(fee: uint256):
                """
                @notice Set AMM fee
                @param fee Fee where 1e18 == 100%
                """
                assert msg.sender == self.admin
                self.fee = fee
                log SetFee(fee)
            ```

    === "Example"
        ```shell
        >>> PoolProxy.set_amm_fee(todo):
        todo
        ```


### `set_amm_admin_fee`
!!! description "`PoolProxy.set_amm_admin_fee(fee: uint256):`"

    Function to set the AMM admin fee.

    !!!note 
        This function can only be called by the factory admin. The new fee value should be in between `MIN_ADMIN_FEE` and `MAX_ADMIN_FEE`.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `fee` |  `uint256` | New Fee  |


    ??? quote "Source code"

        === "Controller.vy"

            ```python hl_lines="1 2 6 13"
            MIN_FEE: constant(uint256) = 10**6  # 1e-12, still needs to be above 0
            MAX_FEE: constant(uint256) = 10**17  # 10%

            # AMM has nonreentrant decorator
            @external
            def set_amm_admin_fee(fee: uint256):
                """
                @notice Set AMM's admin fee
                @param fee New admin fee (not higher than MAX_ADMIN_FEE)
                """
                assert msg.sender == FACTORY.admin()
                assert fee <= MAX_ADMIN_FEE, "High fee"
                AMM.set_admin_fee(fee)
            ```

        === "AMM.vy"

            ```python hl_lines="1 4 6 10"
            event SetAdminFee:
                fee: uint256
            
            admin_fee: public(uint256)

            @external
            @nonreentrant('lock')
            def set_admin_fee(fee: uint256):
                """
                @notice Set admin fee - fraction of the AMM fee to go to admin
                @param fee Admin fee where 1e18 == 100%
                """
                assert msg.sender == self.admin
                self.admin_fee = fee
                log SetAdminFee(fee)
            ```

    === "Example"
        ```shell
        >>> PoolProxy.set_amm_admin_fee(todo):
        todo
        ```


### `collect_fees`
!!! description "`PoolProxy.collect_fees():`"

    Function to **collects all fees**, including **Borrwing-based fees (interest rate)** and **AMM-based fees (swap fee)**(if applicable). If there are any AMM-based fees (represented by `admin_fee_x` and/or `admin_fee_y`), the `reset_admin_fee()` method will be invoked, which resets these variables to zero.

    !!!note
        The collected fees will be sent to the `fee_receiver` as specified in the [factory contract](/curve-docs/docs/LLAMMA/factory.md).

    ??? quote "Source code"

        === "Controller.vy"

            ```python hl_lines="3 7 13"
            @external
            @nonreentrant('lock')
            def collect_fees() -> uint256:
                """
                @notice Collect the fees charged as interest
                """
                _to: address = FACTORY.fee_receiver()
                # AMM-based fees
                borrowed_fees: uint256 = AMM.admin_fees_x()
                collateral_fees: uint256 = AMM.admin_fees_y()
                if borrowed_fees > 0:
                    STABLECOIN.transferFrom(AMM.address, _to, borrowed_fees)
                if collateral_fees > 0:
                    assert COLLATERAL_TOKEN.transferFrom(AMM.address, _to, collateral_fees, default_return_value=True)
                AMM.reset_admin_fees()

                # Borrowing-based fees
                rate_mul: uint256 = self._rate_mul_w()
                loan: Loan = self._total_debt
                loan.initial_debt = loan.initial_debt * rate_mul / loan.rate_mul
                loan.rate_mul = rate_mul
                self._total_debt = loan

                # Amount which would have been redeemed if all the debt was repaid now
                to_be_redeemed: uint256 = loan.initial_debt + self.redeemed
                # Amount which was minted when borrowing + all previously claimed admin fees
                minted: uint256 = self.minted
                # Difference between to_be_redeemed and minted amount is exactly due to interest charged
                if to_be_redeemed > minted:
                    self.minted = to_be_redeemed
                    to_be_redeemed = unsafe_sub(to_be_redeemed, minted)  # Now this is the fees to charge
                    STABLECOIN.transfer(_to, to_be_redeemed)
                    log CollectFees(to_be_redeemed, loan.initial_debt)
                    return to_be_redeemed
                else:
                    log CollectFees(0, loan.initial_debt)
                    return 0
            ```

        === "AMM.vy"

            ```python hl_lines="1 2 6 10"
            admin_fees_x: public(uint256)
            admin_fees_y: public(uint256)

            @external
            @nonreentrant('lock')
            def reset_admin_fees():
                """
                @notice Zero out AMM fees collected
                """
                assert msg.sender == self.admin
                self.admin_fees_x = 0
                self.admin_fees_y = 0
            ```

    === "Example"
        ```shell
        >>> PoolProxy.collect_fees():
        ```


# **Monetary Policy**
MonetaryPolicy determines the interest rate for the market: [MonetaryPolicy Documenatation](/curve-docs/docs/LLAMMA/monetarypolicy.md).

### `monetary_policy`
!!! description "`controller.monetary_policy() -> address: view`"

    Getter for the monetary policy contract.

    Returns: monetary policy contract (`address`).

    ??? quote "Source code"

        ```python hl_lines="1"
        monetary_policy: public(MonetaryPolicy)
        ```

    === "Example"
        ```shell
        >>> controller.monetary_policy()
        '0xc684432FD6322c6D58b6bC5d28B18569aA0AD0A1'
        ```

### `set_monetary_policy`
!!! description "`controller.set_monetary_policy(monetary_policy: address):"

    Function to set the monetary policy contract. Initially, the monetary policy contract is configured when a new market is added via the Factory. However, this function allows the contract address to be changed later. When setting the new address, the function calls `rate_write()` from the monetary policy contract to verify if the ABI is correct.

    Emits: **SetMonetaryPolicy** event.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `monetary_policy` |  `address` |  Monetary policy contract |

    !!! warning
        This function can only be called by the `admin` of the contract.

    ??? quote "Source code"

        === "Controller.vy"

            ```python hl_lines="1 4 8 16"
            event SetMonetaryPolicy:
                monetary_policy: address

            monetary_policy: public(MonetaryPolicy)

            @nonreentrant('lock')
            @external
            def set_monetary_policy(monetary_policy: address):
                """
                @notice Set monetary policy contract
                @param monetary_policy Address of the monetary policy contract
                """
                assert msg.sender == FACTORY.admin()
                self.monetary_policy = MonetaryPolicy(monetary_policy)
                MonetaryPolicy(monetary_policy).rate_write()
                log SetMonetaryPolicy(monetary_policy)
            ```

        === "AMM.vy"

            ```python hl_lines="1"
            @external
            def rate_write(_for: address = msg.sender) -> uint256:
                # Not needed here but useful for more automated policies
                # which change rate0 - for example rate0 targeting some fraction pl_debt/total_debt
                return self.calculate_rate(_for, PRICE_ORACLE.price_w())
            ```

    === "Example"
        ```shell
        >>> controller.set_monetary_policy("todo")
        todo
        ```



# **Contract Info Methods**

### `factory`
!!! description "`controller.factory() -> address: view`"

    Getter of the factory contract of the controller.

    Returns: factory contract (`address`). 

    !!!note
        `factory` is an immutable variable; hence, it cannot be changed.

    ??? quote "Source code"

        ```python hl_lines="1 7 10 17 25"
        interface Factory:
            def stablecoin() -> address: view
            def admin() -> address: view
            def fee_receiver() -> address: view
            def WETH() -> address: view

        FACTORY: immutable(Factory)

        @external
        def __init__(
                collateral_token: address,
                monetary_policy: address,
                loan_discount: uint256,
                liquidation_discount: uint256,
                amm: address):
            """
            @notice Controller constructor deployed by the factory from blueprint
            @param collateral_token Token to use for collateral
            @param monetary_policy Address of monetary policy
            @param loan_discount Discount of the maximum loan size compare to get_x_down() value
            @param liquidation_discount Discount of the maximum loan size compare to
                get_x_down() for "bad liquidation" purposes
            @param amm AMM address (Already deployed from blueprint)
            """
            FACTORY = Factory(msg.sender)
            stablecoin: ERC20 = ERC20(Factory(msg.sender).stablecoin())
            STABLECOIN = stablecoin
            assert stablecoin.decimals() == 18

            self.monetary_policy = MonetaryPolicy(monetary_policy)

            self.liquidation_discount = liquidation_discount
            self.loan_discount = loan_discount
            self._total_debt.rate_mul = 10**18

            AMM = LLAMMA(amm)
            _A: uint256 = LLAMMA(amm).A()
            A = _A
            Aminus1 = _A - 1
            LOG2_A_RATIO = self.log2(_A * 10**18 / unsafe_sub(_A, 1))

            COLLATERAL_TOKEN = ERC20(collateral_token)
            COLLATERAL_PRECISION = pow_mod256(10, 18 - ERC20(collateral_token).decimals())

            SQRT_BAND_RATIO = isqrt(unsafe_div(10**36 * _A, unsafe_sub(_A, 1)))

            stablecoin.approve(msg.sender, max_value(uint256))

            if Factory(msg.sender).WETH() == collateral_token:
                USE_ETH = True
        ```

    === "Example"
        ```shell
        >>> controller.factory()
        '0xC9332fdCB1C491Dcc683bAe86Fe3cb70360738BC
        ```


### `amm`
!!! description "`controller.amm() -> address: view`"

    Getter of the AMM contract of the controller.

    Returns: AMM contract (`address`). 

    !!!note
        `amm` is an immutable variable; hence, it cannot be changed.

    ??? quote "Source code"

        ```python hl_lines="1 4 9 17 30"
        AMM: immutable(LLAMMA)

        @external
        def __init__(
                collateral_token: address,
                monetary_policy: address,
                loan_discount: uint256,
                liquidation_discount: uint256,
                amm: address):
            """
            @notice Controller constructor deployed by the factory from blueprint
            @param collateral_token Token to use for collateral
            @param monetary_policy Address of monetary policy
            @param loan_discount Discount of the maximum loan size compare to get_x_down() value
            @param liquidation_discount Discount of the maximum loan size compare to
                get_x_down() for "bad liquidation" purposes
            @param amm AMM address (Already deployed from blueprint)
            """
            FACTORY = Factory(msg.sender)
            stablecoin: ERC20 = ERC20(Factory(msg.sender).stablecoin())
            STABLECOIN = stablecoin
            assert stablecoin.decimals() == 18

            self.monetary_policy = MonetaryPolicy(monetary_policy)

            self.liquidation_discount = liquidation_discount
            self.loan_discount = loan_discount
            self._total_debt.rate_mul = 10**18

            AMM = LLAMMA(amm)
            _A: uint256 = LLAMMA(amm).A()
            A = _A
            Aminus1 = _A - 1
            LOG2_A_RATIO = self.log2(_A * 10**18 / unsafe_sub(_A, 1))

            COLLATERAL_TOKEN = ERC20(collateral_token)
            COLLATERAL_PRECISION = pow_mod256(10, 18 - ERC20(collateral_token).decimals())

            SQRT_BAND_RATIO = isqrt(unsafe_div(10**36 * _A, unsafe_sub(_A, 1)))

            stablecoin.approve(msg.sender, max_value(uint256))

            if Factory(msg.sender).WETH() == collateral_token:
                USE_ETH = True
        ```

    === "Example"
        ```shell
        >>> controller.amm()
        '0x136e783846ef68C8Bd00a3369F787dF8d683a696'
        ```


### `collateral_token`
!!! description "`controller.collateral_token() -> address: view`"

    Getter of the collateral token for the market.

    Returns: collateral token (`address`).

    !!!note
        `collateral_token` is an immutable variable; hence, it cannot be changed.

    ??? quote "Source code"

        ```python hl_lines="1 5 12"
        COLLATERAL_TOKEN: immutable(ERC20)

        @external
        def __init__(
                collateral_token: address,
                monetary_policy: address,
                loan_discount: uint256,
                liquidation_discount: uint256,
                amm: address):
            """
            @notice Controller constructor deployed by the factory from blueprint
            @param collateral_token Token to use for collateral
            @param monetary_policy Address of monetary policy
            @param loan_discount Discount of the maximum loan size compare to get_x_down() value
            @param liquidation_discount Discount of the maximum loan size compare to
                get_x_down() for "bad liquidation" purposes
            @param amm AMM address (Already deployed from blueprint)
            """
            FACTORY = Factory(msg.sender)
            stablecoin: ERC20 = ERC20(Factory(msg.sender).stablecoin())
            STABLECOIN = stablecoin
            assert stablecoin.decimals() == 18

            self.monetary_policy = MonetaryPolicy(monetary_policy)

            self.liquidation_discount = liquidation_discount
            self.loan_discount = loan_discount
            self._total_debt.rate_mul = 10**18

            AMM = LLAMMA(amm)
            _A: uint256 = LLAMMA(amm).A()
            A = _A
            Aminus1 = _A - 1
            LOG2_A_RATIO = self.log2(_A * 10**18 / unsafe_sub(_A, 1))

            COLLATERAL_TOKEN = ERC20(collateral_token)
            COLLATERAL_PRECISION = pow_mod256(10, 18 - ERC20(collateral_token).decimals())

            SQRT_BAND_RATIO = isqrt(unsafe_div(10**36 * _A, unsafe_sub(_A, 1)))

            stablecoin.approve(msg.sender, max_value(uint256))

            if Factory(msg.sender).WETH() == collateral_token:
                USE_ETH = True
        ```

    === "Example"
        ```shell
        >>> controller.collateral_token()
        '0xac3E018457B222d93114458476f3E3416Abbe38F'
        ```


### `amm_price`
!!! description "`controller.amm_price() -> uint256:`"

    Getter for the current price from the AMM.

    Returns: price (`uint256`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_pool` |  `address` | Pool address |


    ??? quote "Source code"

        === "Controller.vy"

            ```python hl_lines="4 8"
            # AMM has a nonreentrant decorator
            @view
            @external
            def amm_price() -> uint256:
                """
                @notice Current price from the AMM
                """
                return AMM.get_p()
            ```

        === "AMM.vy"

            ```python hl_lines="3 36"
            @internal
            @view
            def _get_p(n: int256, x: uint256, y: uint256) -> uint256:
                """
                @notice Get current AMM price in band
                @param n Band number
                @param x Amount of stablecoin in band
                @param y Amount of collateral in band
                @return Current price at 1e18 base
                """
                p_o_up: uint256 = self._p_oracle_up(n)
                p_o: uint256 = self._price_oracle_ro()[0]

                # Special cases
                if x == 0:
                    if y == 0:  # x and y are 0
                        # Return mid-band
                        return unsafe_div((unsafe_div(p_o**2 / p_o_up * p_o, p_o_up) * A), Aminus1)
                    # if x == 0: # Lowest point of this band -> p_current_down
                    return unsafe_div(p_o**2 / p_o_up * p_o, p_o_up)
                if y == 0: # Highest point of this band -> p_current_up
                    p_o_up = unsafe_div(p_o_up * Aminus1, A)  # now this is _actually_ p_o_down
                    return unsafe_div(p_o**2 / p_o_up * p_o, p_o_up)

                y0: uint256 = self._get_y0(x, y, p_o, p_o_up)
                # ^ that call also checks that p_o != 0

                # (f(y0) + x) / (g(y0) + y)
                f: uint256 = A * y0 * p_o / p_o_up * p_o
                g: uint256 = unsafe_div(Aminus1 * y0 * p_o_up, p_o)
                return (f + x * 10**18) / (g + y)

            @external
            @view
            @nonreentrant('lock')
            def get_p() -> uint256:
                """
                @notice Get current AMM price in active_band
                @return Current price at 1e18 base
                """
                n: int256 = self.active_band
                return self._get_p(n, self.bands_x[n], self.bands_y[n])
            ```

    === "Example"
        ```shell
        >>> controller.amm_price():
        1894335198818887625018
        ```


### `liquidation_discounts`
!!! description "`controller.liquidation_discounts(arg0: address) -> uint256: view`"

    Getter method for the liquidation discount of a user.

    Returns: **liquidation discount** (`uint256`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `arg0` |  `address` |  Address |

    ??? quote "Source code"

        ```python hl_lines="1"
        liquidation_discounts: public(HashMap[address, uint256])
        ```

    === "Example"
        ```shell
        >>> controller.liquidation_discounts("0x7a16fF8270133F063aAb6C9977183D9e72835428")
        60000000000000000
        ```


### `minted`
!!! description "`controller.minted() -> uint256: view`"

    Getter for the total amount of crvUSD minted from this controller. Increments by the amount of debt when calling `create_loan` or `borrow_more`.

    Returns: **total minted** (`uint256`).

    ??? quote "Source code"

        ```python hl_lines="1"
        minted: public(uint256)
        ```

    === "Example"
        ```shell
        >>> controller.minted()
        17090918188139724484312313
        ```


### `redeemed`
!!! description "`controller.redeemed() -> uint256: view`"

    Getter for the total amount of crvUSD redeemed from this controller. Increments by the amount of debt that is repayed when calling `repay` or `repay_extended`.

    Returns: **total redeemed** (`uint256`).

    ??? quote "Source code"

        ```python hl_lines="1"
        redeemed: public(uint256)
        ```

    === "Example"
        ```shell
        >>> controller.redeemed()
        7731390765158807406740136
        ```        

### `liquidation_discount`
!!! description "`controller.liquidation_discount() -> uint256: view`"

    Getter for the liquidation discount. This value is used to discount the collateral value when calculating the health for liquidation puroses in order to incentivize liquidators.

    Returns: **liquidation discount** (`uint256`).

    ??? quote "Source code"

        ```python hl_lines="1 4 8 26"
        liquidation_discount: public(uint256)

        @external
        def __init__(
                collateral_token: address,
                monetary_policy: address,
                loan_discount: uint256,
                liquidation_discount: uint256,
                amm: address):
            """
            @notice Controller constructor deployed by the factory from blueprint
            @param collateral_token Token to use for collateral
            @param monetary_policy Address of monetary policy
            @param loan_discount Discount of the maximum loan size compare to get_x_down() value
            @param liquidation_discount Discount of the maximum loan size compare to
                get_x_down() for "bad liquidation" purposes
            @param amm AMM address (Already deployed from blueprint)
            """
            FACTORY = Factory(msg.sender)
            stablecoin: ERC20 = ERC20(Factory(msg.sender).stablecoin())
            STABLECOIN = stablecoin
            assert stablecoin.decimals() == 18

            self.monetary_policy = MonetaryPolicy(monetary_policy)

            self.liquidation_discount = liquidation_discount
            self.loan_discount = loan_discount
            self._total_debt.rate_mul = 10**18

            AMM = LLAMMA(amm)
            _A: uint256 = LLAMMA(amm).A()
            A = _A
            Aminus1 = _A - 1
            LOG2_A_RATIO = self.log2(_A * 10**18 / unsafe_sub(_A, 1))

            COLLATERAL_TOKEN = ERC20(collateral_token)
            COLLATERAL_PRECISION = pow_mod256(10, 18 - ERC20(collateral_token).decimals())

            SQRT_BAND_RATIO = isqrt(unsafe_div(10**36 * _A, unsafe_sub(_A, 1)))

            stablecoin.approve(msg.sender, max_value(uint256))

            if Factory(msg.sender).WETH() == collateral_token:
                USE_ETH = True
        ```

    === "Example"
        ```shell
        >>> controller.liquidation_discount()
        60000000000000000
        ```


### `loan_discounts`
!!! description "`controller.liquidation_discount() -> uint256: view`"

    Getter for the discount of the maximum loan size compared to `get_x_down()` value. This value defines the LTV.

    Returns: **loan discount** (`uint256`).

    ??? quote "Source code"

        ```python hl_lines="1 4 7 27"
        loan_discount: public(uint256)

        @external
        def __init__(
                collateral_token: address,
                monetary_policy: address,
                loan_discount: uint256,
                liquidation_discount: uint256,
                amm: address):
            """
            @notice Controller constructor deployed by the factory from blueprint
            @param collateral_token Token to use for collateral
            @param monetary_policy Address of monetary policy
            @param loan_discount Discount of the maximum loan size compare to get_x_down() value
            @param liquidation_discount Discount of the maximum loan size compare to
                get_x_down() for "bad liquidation" purposes
            @param amm AMM address (Already deployed from blueprint)
            """
            FACTORY = Factory(msg.sender)
            stablecoin: ERC20 = ERC20(Factory(msg.sender).stablecoin())
            STABLECOIN = stablecoin
            assert stablecoin.decimals() == 18

            self.monetary_policy = MonetaryPolicy(monetary_policy)

            self.liquidation_discount = liquidation_discount
            self.loan_discount = loan_discount
            self._total_debt.rate_mul = 10**18

            AMM = LLAMMA(amm)
            _A: uint256 = LLAMMA(amm).A()
            A = _A
            Aminus1 = _A - 1
            LOG2_A_RATIO = self.log2(_A * 10**18 / unsafe_sub(_A, 1))

            COLLATERAL_TOKEN = ERC20(collateral_token)
            COLLATERAL_PRECISION = pow_mod256(10, 18 - ERC20(collateral_token).decimals())

            SQRT_BAND_RATIO = isqrt(unsafe_div(10**36 * _A, unsafe_sub(_A, 1)))

            stablecoin.approve(msg.sender, max_value(uint256))

            if Factory(msg.sender).WETH() == collateral_token:
                USE_ETH = True
        ```

    === "Example"
        ```shell
        >>> controller.loan_discount()
        90000000000000000
        ```

## **Setting parameters** 
### `set_borrowing_discounts`
!!! description "`controller.set_borrowing_discounts(loan_discount: uint256, liquidation_discount: uint256)`"

    Function to set the borrowing discounts for 

    Returns: total redeemed (`uint256`).

    Emits event: `SetBorrowingDiscount`

    !!!note
        This function is only callable by the admin of the contract. 

    ??? quote "Source code"

        ```python hl_lines="1"
        @nonreentrant('lock')
        @external
        def set_borrowing_discounts(loan_discount: uint256, liquidation_discount: uint256):
            """
            @notice Set discounts at which we can borrow (defines max LTV) and where bad liquidation starts
            @param loan_discount Discount which defines LTV
            @param liquidation_discount Discount where bad liquidation starts
            """
            assert msg.sender == FACTORY.admin()
            assert loan_discount > liquidation_discount
            assert liquidation_discount >= MIN_LIQUIDATION_DISCOUNT
            assert loan_discount <= MAX_LOAN_DISCOUNT
            self.liquidation_discount = liquidation_discount
            self.loan_discount = loan_discount
            log SetBorrowingDiscounts(loan_discount, liquidation_discount)
        ```

    === "Example"
        ```shell
        >>> controller.set_borrowing_discounts()
        7731390765158807406740136
        ```  

### `liquidity_mining_callback`
!!! description "`controller.liquidity_mining_callback() -> uint256: view`"

    Getter for the liquidity mining callback contract.

    Returns: liquidity mining callback address (`uint256`).

    ??? quote "Source code"

        ```python hl_lines="1"
        liquidity_mining_callback: public(LMGauge)
        ```

    === "Example"
        ```shell
        >>> controller.liquidity_mining_callback()
        '0x0000000000000000000000000000000000000000'
        ```  


### `set_callback`
!!! description "`controller.redeemed() -> uint256: view`"

    Function to set a callback for liquidity mining.

    !!!note
        This function is only callable by the admin of the contract. 

    ??? quote "Source code"

        ```python hl_lines="3"
        # nonreentrant decorator is in Controller which is admin
        @external
        def set_callback(liquidity_mining_callback: LMGauge):
            """
            @notice Set a gauge address with callbacks for liquidity mining for collateral
            @param liquidity_mining_callback Gauge address
            """
            assert msg.sender == self.admin
            self.liquidity_mining_callback = liquidity_mining_callback
        ```

    === "Example"
        ```shell
        >>> controller.set_callback('todo')
        todo
        ```  