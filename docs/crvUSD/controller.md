<h1>Controller.vy</h1>


The Controller contract acts as a on-chain interface for **creating loans and further managing existing positions**. It holds all user debt information. External liquidations are also done through it.

**Each market has its own Controller**, automatically deployed from a blueprint contract, as soon as a new market is added via the `add_market` function or, for lending markets, via the `create` or `create_from_pool` function within the respective Factory.


---

*Controller contracts are currently used for the following two cases:*


- **Curve Stablecoin - minting crvUSD**

    Minting crvUSD is only possible with whitelisted collateral by the DAO and requires users to provide collateral against which they can mint[^1] crvUSD. Provided collateral is deposited into LLAMMA according to the number of bands chosen. Subsequently, **crvUSD is backed by the assets provided as collateral**.

    <figure markdown="span">
    ![](../assets/images/mint_controller1.svg){ width="500" }
    <figcaption></figcaption>
    </figure>

    [^1]: The system does not actually mint crvUSD, as the tokens are "pre-minted". If a controller has a 100m debt ceiling, 100m crvUSD will be minted to the Controller from which the tokens can be borrowed.

    Repaying the loan is straightforward: Debt is repaid, the health of the loan improves, allowing for the removal of collateral from LLAMMA. When the entire loan is repaid, the user can remove their entire collateral.



- **Curve Lending Markets**

    *[:octicons-arrow-right-24: Curve Lending Overview](../lending/overview.md)*

    In lending markets, not only can crvUSD be borrowed. Every lending market token composition is possible as long as one of the assets, no matter if collateral or borrowable asset, is crvUSD.

    The main difference compared to the minting system above is that there are no tokens minted (neglecting the ERC-4626 vault token here) and therefore **not backed by the provided collateral token**. E.g., if there is a CRV<>crvUSD lending market, with CRV as collateral and crvUSD as borrowable asset, then the borrowed crvUSD are not minted but rather borrowed. **Borrowable assets are provided by lenders**, who deposit the assets into an [ERC-4626 Vault](../lending/contracts/vault.md), where they earn interest for lending out their assets.


    <figure markdown="span">
    ![](../assets/images/lending_overview.svg){ width="600" }
    <figcaption></figcaption>
    </figure>


    Repaying the loan is straightforward: Debt is repaid, the health of the loan improves, allowing for the removal of collateral from LLAMMA. When the entire loan is repaid, the user can remove their entire collateral.

---


## **Creating and Repaying Loans**

New loans are created via the **`create_loan`** function. When creating a loan the user needs to specify the **amount of collateral**, **debt** and the **number of bands** to deposit the collateral into.

The maximum amount of borrowable debt is determined by the number of bands, the amount of collateral, and the oracle price.

The loan-to-value (LTV) ratio depends on the number of bands `N` and the parameter `A`. The higher the number of bands, the lower the LTV. More on bands [here](../crvUSD/amm.md#bands).

$$LTV = \text{100%} - \text{loan_discount} - 100 * \frac{N}{2*A}$$


!!!tip "New implementation allows setting `extra_health`"
    With a new implementation introduced a in commits before hash [`b0240d8`](https://github.com/curvefi/curve-stablecoin/tree/b0240d844c9e60fdab78b481a556a187ceee3721), the contract now allows users to set [`extra_health`](#extra_health) using [`set_extra_health`](#set_extra_health). This adds a "health buffer" to the loan when creating it and results in having more health when entering soft liquidation.

!!!colab "Google Colab Notebook"
    A simple notebook showcasing how to create a loan using `create_loan` and then how to read loan information can be found here: [https://colab.research.google.com/drive/1MTtpbdeTDVB3LxzGhFc4vwLsDM_xJWKz?usp=sharing](https://colab.research.google.com/drive/1MTtpbdeTDVB3LxzGhFc4vwLsDM_xJWKz?usp=sharing)


### `create_loan`
!!! description "`Controller.create_loan(collateral: uint256, debt: uint256, N: uint256, _for: address = msg.sender)`"

    Function to create a new loan, requiring specification of the amount of `collateral` to be deposited into `N` bands and the amount of `debt` to be borrowed. Less bands mean the collateral is more concentrated into a smaller range, which can lead to higher losses in soft-liquidation. Should there already be an existing loan, the function will revert. Before creating a loan, there is the option to set [`extra_health`](#extra_health) using [`set_extra_health`](#set_extra_health) which leads to a higher health when entering soft liquidation.

    Emits: `UserState`, `Borrow`, `Deposit` and `Transfer`

    | Input        | Type      | Description                           |
    | ------------ | --------- | ------------------------------------- |
    | `collateral` | `uint256` | Amount of collateral token to put up as collateral (at its native precision) |
    | `debt`       | `uint256` | Amount of debt to take on             |
    | `N`          | `uint256` | Number of bands to deposit into; must range between `MIN_TICKS` and `MAX_TICKS` |
    | `_for`       | `address` | Address to create the loan for (requires [`approval`](#approve)); only available in new implementation |

    ??? quote "Source code"

        === "Commit `58289a4` — May 10, 2024"

            The following source code includes all changes up to commit hash [`58289a4`](https://github.com/curvefi/curve-stablecoin/tree/`58289a4`283d7cc3c53aba2d3801dcac5ef124957); any changes made after this commit are not included.

            === "Controller.vy"

                ```vyper
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

                MAX_TICKS: constant(int256) = 50
                MIN_TICKS: constant(int256) = 4

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
                    self._create_loan(collateral, debt, N, True)

                @internal
                def _create_loan(collateral: uint256, debt: uint256, N: uint256, transfer_coins: bool):
                    assert self.loan[msg.sender].initial_debt == 0, "Loan already created"
                    assert N > MIN_TICKS-1, "Need more ticks"
                    assert N < MAX_TICKS+1, "Need less ticks"

                    n1: int256 = self._calculate_debt_n1(collateral, debt, N)
                    n2: int256 = n1 + convert(N - 1, int256)

                    rate_mul: uint256 = AMM.get_rate_mul()
                    self.loan[msg.sender] = Loan({initial_debt: debt, rate_mul: rate_mul})
                    liquidation_discount: uint256 = self.liquidation_discount
                    self.liquidation_discounts[msg.sender] = liquidation_discount

                    n_loans: uint256 = self.n_loans
                    self.loans[n_loans] = msg.sender
                    self.loan_ix[msg.sender] = n_loans
                    self.n_loans = unsafe_add(n_loans, 1)

                    self._total_debt.initial_debt = self._total_debt.initial_debt * rate_mul / self._total_debt.rate_mul + debt
                    self._total_debt.rate_mul = rate_mul

                    AMM.deposit_range(msg.sender, collateral, n1, n2)
                    self.minted += debt

                    if transfer_coins:
                        self.transferFrom(COLLATERAL_TOKEN, msg.sender, AMM.address, collateral)
                        self.transfer(BORROWED_TOKEN, msg.sender, debt)

                self._save_rate()

                log UserState(msg.sender, collateral, debt, n1, n2, liquidation_discount)
                log Borrow(msg.sender, collateral, debt)
                ```

            === "AMM.vy"

                ```vyper
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

                    n_bands: uint256 = unsafe_add(convert(unsafe_sub(n2, n1), uint256), 1)
                    assert n_bands <= MAX_TICKS_UINT

                    y_per_band: uint256 = unsafe_div(amount * COLLATERAL_PRECISION, n_bands)
                    assert y_per_band > 100, "Amount too low"

                    assert self.user_shares[user].ticks[0] == 0  # dev: User must have no liquidity
                    self.user_shares[user].ns = unsafe_add(n1, unsafe_mul(n2, 2**128))

                    lm: LMGauge = self.liquidity_mining_callback

                    # Autoskip bands if we can
                    for i in range(MAX_SKIP_TICKS + 1):
                        if n1 > n0:
                            if i != 0:
                                self.active_band = n0
                            break
                        assert self.bands_x[n0] == 0 and i < MAX_SKIP_TICKS, "Deposit below current band"
                        n0 -= 1

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

                    log Deposit(user, amount, n1, n2)

                    if lm.address != empty(address):
                        lm.callback_collateral_shares(n1, collateral_shares)
                        lm.callback_user_shares(user, n1, user_shares)
                ```


        === "Commit `b0240d8` — Sep 8, 2024"

            The following source code includes all changes up to commit hash [`b0240d8`](https://github.com/curvefi/curve-stablecoin/tree/b0240d844c9e60fdab78b481a556a187ceee3721); any changes made after this commit are not included.

            This implementation was used for [Optimism](../deployments/lending.md#logos-optimism-optimism) and [Fraxtal](../deployments/lending.md#logos-fraxtal-fraxtal) lending deployments.

            === "Controller.vy"

                ```py
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

                MAX_TICKS: constant(int256) = 50
                MIN_TICKS: constant(int256) = 4

                approval: public(HashMap[address, HashMap[address, bool]])

                @external
                @nonreentrant('lock')
                def create_loan(collateral: uint256, debt: uint256, N: uint256, _for: address = msg.sender):
                    """
                    @notice Create loan
                    @param collateral Amount of collateral to use
                    @param debt Stablecoin debt to take
                    @param N Number of bands to deposit into (to do autoliquidation-deliquidation),
                        can be from MIN_TICKS to MAX_TICKS
                    @param _for Address to create the loan for
                    """
                    if _for != tx.origin:
                        # We can create a loan for tx.origin (for example when wrapping ETH with EOA),
                        # however need to approve in other cases
                        assert self._check_approval(_for)
                    self._create_loan(collateral, debt, N, True, _for)

                @internal
                @view
                def _check_approval(_for: address) -> bool:
                    return msg.sender == _for or self.approval[_for][msg.sender]

                @internal
                def _create_loan(collateral: uint256, debt: uint256, N: uint256, transfer_coins: bool, _for: address):
                    assert self.loan[_for].initial_debt == 0, "Loan already created"
                    assert N > MIN_TICKS-1, "Need more ticks"
                    assert N < MAX_TICKS+1, "Need less ticks"

                    n1: int256 = self._calculate_debt_n1(collateral, debt, N, _for)
                    n2: int256 = n1 + convert(unsafe_sub(N, 1), int256)

                    rate_mul: uint256 = AMM.get_rate_mul()
                    self.loan[_for] = Loan({initial_debt: debt, rate_mul: rate_mul})
                    liquidation_discount: uint256 = self.liquidation_discount
                    self.liquidation_discounts[_for] = liquidation_discount

                    n_loans: uint256 = self.n_loans
                    self.loans[n_loans] = _for
                    self.loan_ix[_for] = n_loans
                    self.n_loans = unsafe_add(n_loans, 1)

                    self._total_debt.initial_debt = self._total_debt.initial_debt * rate_mul / self._total_debt.rate_mul + debt
                    self._total_debt.rate_mul = rate_mul

                    AMM.deposit_range(_for, collateral, n1, n2)
                    self.minted += debt

                    if transfer_coins:
                        self.transferFrom(COLLATERAL_TOKEN, msg.sender, AMM.address, collateral)
                        self.transfer(BORROWED_TOKEN, _for, debt)

                    self._save_rate()

                    log UserState(_for, collateral, debt, n1, n2, liquidation_discount)
                    log Borrow(_for, collateral, debt)
                ```

            === "AMM.vy"

                ```vyper
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

                    n_bands: uint256 = unsafe_add(convert(unsafe_sub(n2, n1), uint256), 1)
                    assert n_bands <= MAX_TICKS_UINT

                    y_per_band: uint256 = unsafe_div(amount * COLLATERAL_PRECISION, n_bands)
                    assert y_per_band > 100, "Amount too low"

                    assert self.user_shares[user].ticks[0] == 0  # dev: User must have no liquidity
                    self.user_shares[user].ns = unsafe_add(n1, unsafe_mul(n2, 2**128))

                    lm: LMGauge = self.liquidity_mining_callback

                    # Autoskip bands if we can
                    for i in range(MAX_SKIP_TICKS + 1):
                        if n1 > n0:
                            if i != 0:
                                self.active_band = n0
                            break
                        assert self.bands_x[n0] == 0 and i < MAX_SKIP_TICKS, "Deposit below current band"
                        n0 -= 1

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

                    log Deposit(user, amount, n1, n2)

                    if lm.address != empty(address):
                        lm.callback_collateral_shares(n1, collateral_shares)
                        lm.callback_user_shares(user, n1, user_shares)
                ```

    === "Example"

        ```shell
        >>> Controller.create_loan(10**18, 10**21, 10)

        >>> Controller.debt(trader)
        1000000000000000000000

        >>> Controller.user_state(trader)
        [1000000000000000000, 0, 1000000000000000000000, 10]
        # [collateral, stablecoin, debt, bands]
        ```


### `create_loan_extended`
!!! description "`Controller.create_loan_extended(collateral: uint256, debt: uint256, N: uint256, callbacker: address, callback_args: DynArray[uint256,5], callback_bytes: Bytes[10**4] = b"", _for: address = msg.sender)`"

    Function to create a new loan using callbacks. This function passes the stablecoin to a callback first, enabling the construction of leverage. Earlier implementations of the contract did not have `callback_bytes` argument. This was added to enable [leveraging/de-leveraging using the 1inch router](./leverage/LeverageZap1inch.md#building-leverage). Before creating a loan, there is the option to set [`extra_health`](#extra_health) using [`set_extra_health`](#set_extra_health) which leads to a higher health when entering soft liquidation.

    Emits: `UserState`, `Borrow`, `Deposit`, and `Transfer`

    | Input           | Type                  | Description                                           |
    | --------------- | --------------------- | ----------------------------------------------------- |
    | `collateral`    | `uint256`             | Amount of collateral token to put up as collateral (at its native precision). |
    | `debt`          | `uint256`             | Amount of debt to take                               |
    | `N`             | `uint256`             | Number of bands to deposit into                      |
    | `callbacker`    | `address`             | Address of the callback contract                     |
    | `callback_args` | `DynArray[uint256,5]` | Extra arguments for the callback (up to 5), such as `min_amount`, etc. See [`LeverageZap1inch.vy`](./leverage/LeverageZap1inch.md) for more information |
    | `callback_bytes` | `Bytes[10**4]`       | Callback bytes passed to the LeverageZap. Defaults to `b""` |
    | `_for`       | `address` | Address to create the loan for (requires [`approval`](#approve)); only available in new implementation |

    ??? quote "Source code"

        === "Commit `58289a4` — May 10, 2024"

            The following source code includes all changes up to commit hash [`58289a4`](https://github.com/curvefi/curve-stablecoin/tree/58289a4283d7cc3c53aba2d3801dcac5ef124957); any changes made after this commit are not included.

            === "Controller.vy"

                ```vyper
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

                MAX_TICKS: constant(int256) = 50
                MIN_TICKS: constant(int256) = 4

                CALLBACK_DEPOSIT: constant(bytes4) = method_id("callback_deposit(address,uint256,uint256,uint256,uint256[])", output_type=bytes4)
                CALLBACK_REPAY: constant(bytes4) = method_id("callback_repay(address,uint256,uint256,uint256,uint256[])", output_type=bytes4)
                CALLBACK_LIQUIDATE: constant(bytes4) = method_id("callback_liquidate(address,uint256,uint256,uint256,uint256[])", output_type=bytes4)

                CALLBACK_DEPOSIT_WITH_BYTES: constant(bytes4) = method_id("callback_deposit(address,uint256,uint256,uint256,uint256[],bytes)", output_type=bytes4)
                # CALLBACK_REPAY_WITH_BYTES: constant(bytes4) = method_id("callback_repay(address,uint256,uint256,uint256,uint256[],bytes)", output_type=bytes4) <-- BUG! The reason is 0 at the beginning of method_id
                CALLBACK_REPAY_WITH_BYTES: constant(bytes4) = 0x008ae188
                CALLBACK_LIQUIDATE_WITH_BYTES: constant(bytes4) = method_id("callback_liquidate(address,uint256,uint256,uint256,uint256[],bytes)", output_type=bytes4)

                @external
                @nonreentrant('lock')
                def create_loan_extended(collateral: uint256, debt: uint256, N: uint256, callbacker: address, callback_args: DynArray[uint256,5], callback_bytes: Bytes[10**4] = b""):
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
                    self.transfer(BORROWED_TOKEN, callbacker, debt)

                    # For compatibility
                    callback_sig: bytes4 = CALLBACK_DEPOSIT_WITH_BYTES
                    if callback_bytes == b"":
                        callback_sig = CALLBACK_DEPOSIT
                    # Callback
                    # If there is any unused debt, callbacker can send it to the user
                    more_collateral: uint256 = self.execute_callback(
                        callbacker, callback_sig, msg.sender, 0, collateral, debt, callback_args, callback_bytes).collateral

                    # After callback
                    self._create_loan(collateral + more_collateral, debt, N, False)
                    self.transferFrom(COLLATERAL_TOKEN, msg.sender, AMM.address, collateral)
                    self.transferFrom(COLLATERAL_TOKEN, callbacker, AMM.address, more_collateral)

                @internal
                def execute_callback(callbacker: address, callback_sig: bytes4,
                                    user: address, stablecoins: uint256, collateral: uint256, debt: uint256,
                                    callback_args: DynArray[uint256, 5], callback_bytes: Bytes[10**4]) -> CallbackData:
                    assert callbacker != COLLATERAL_TOKEN.address

                    data: CallbackData = empty(CallbackData)
                    data.active_band = AMM.active_band()
                    band_x: uint256 = AMM.bands_x(data.active_band)
                    band_y: uint256 = AMM.bands_y(data.active_band)

                    # Callback
                    response: Bytes[64] = raw_call(
                        callbacker,
                        concat(callback_sig, _abi_encode(user, stablecoins, collateral, debt, callback_args, callback_bytes)),
                        max_outsize=64
                    )
                    data.stablecoins = convert(slice(response, 0, 32), uint256)
                    data.collateral = convert(slice(response, 32, 32), uint256)

                    # Checks after callback
                    assert data.active_band == AMM.active_band()
                    assert band_x == AMM.bands_x(data.active_band)
                    assert band_y == AMM.bands_y(data.active_band)

                    return data
                ```

            === "AMM.vy"

                ```vyper
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

                    n_bands: uint256 = unsafe_add(convert(unsafe_sub(n2, n1), uint256), 1)
                    assert n_bands <= MAX_TICKS_UINT

                    y_per_band: uint256 = unsafe_div(amount * COLLATERAL_PRECISION, n_bands)
                    assert y_per_band > 100, "Amount too low"

                    assert self.user_shares[user].ticks[0] == 0  # dev: User must have no liquidity
                    self.user_shares[user].ns = unsafe_add(n1, unsafe_mul(n2, 2**128))

                    lm: LMGauge = self.liquidity_mining_callback

                    # Autoskip bands if we can
                    for i in range(MAX_SKIP_TICKS + 1):
                        if n1 > n0:
                            if i != 0:
                                self.active_band = n0
                            break
                        assert self.bands_x[n0] == 0 and i < MAX_SKIP_TICKS, "Deposit below current band"
                        n0 -= 1

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

                    log Deposit(user, amount, n1, n2)

                    if lm.address != empty(address):
                        lm.callback_collateral_shares(n1, collateral_shares)
                        lm.callback_user_shares(user, n1, user_shares)
                ```

        === "Commit `b0240d8` — Sep 8, 2024"

            The following source code includes all changes up to commit hash [`b0240d8`](https://github.com/curvefi/curve-stablecoin/tree/b0240d844c9e60fdab78b481a556a187ceee3721); any changes made after this commit are not included.

            This implementation was used for [Optimism](../deployments/lending.md#logos-optimism-optimism) and [Fraxtal](../deployments/lending.md#logos-fraxtal-fraxtal) lending deployments.

            === "Controller.vy"

                ```vyper
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

                MAX_TICKS: constant(int256) = 50
                MIN_TICKS: constant(int256) = 4

                CALLBACK_DEPOSIT: constant(bytes4) = method_id("callback_deposit(address,uint256,uint256,uint256,uint256[])", output_type=bytes4)
                CALLBACK_REPAY: constant(bytes4) = method_id("callback_repay(address,uint256,uint256,uint256,uint256[])", output_type=bytes4)
                CALLBACK_LIQUIDATE: constant(bytes4) = method_id("callback_liquidate(address,uint256,uint256,uint256,uint256[])", output_type=bytes4)

                CALLBACK_DEPOSIT_WITH_BYTES: constant(bytes4) = method_id("callback_deposit(address,uint256,uint256,uint256,uint256[],bytes)", output_type=bytes4)
                # CALLBACK_REPAY_WITH_BYTES: constant(bytes4) = method_id("callback_repay(address,uint256,uint256,uint256,uint256[],bytes)", output_type=bytes4) <-- BUG! The reason is 0 at the beginning of method_id
                CALLBACK_REPAY_WITH_BYTES: constant(bytes4) = 0x008ae188
                CALLBACK_LIQUIDATE_WITH_BYTES: constant(bytes4) = method_id("callback_liquidate(address,uint256,uint256,uint256,uint256[],bytes)", output_type=bytes4)

                approval: public(HashMap[address, HashMap[address, bool]])

                @external
                @nonreentrant('lock')
                def create_loan_extended(collateral: uint256, debt: uint256, N: uint256, callbacker: address, callback_args: DynArray[uint256,5], callback_bytes: Bytes[10**4] = b"", _for: address = msg.sender):
                    """
                    @notice Create loan but pass stablecoin to a callback first so that it can build leverage
                    @param collateral Amount of collateral to use
                    @param debt Stablecoin debt to take
                    @param N Number of bands to deposit into (to do autoliquidation-deliquidation),
                        can be from MIN_TICKS to MAX_TICKS
                    @param callbacker Address of the callback contract
                    @param callback_args Extra arguments for the callback (up to 5) such as min_amount etc
                    @param _for Address to create the loan for
                    """
                    if _for != tx.origin:
                        assert self._check_approval(_for)

                    # Before callback
                    self.transfer(BORROWED_TOKEN, callbacker, debt)

                    # For compatibility
                    callback_sig: bytes4 = CALLBACK_DEPOSIT_WITH_BYTES
                    if callback_bytes == b"":
                        callback_sig = CALLBACK_DEPOSIT
                    # Callback
                    # If there is any unused debt, callbacker can send it to the user
                    more_collateral: uint256 = self.execute_callback(
                        callbacker, callback_sig, _for, 0, collateral, debt, callback_args, callback_bytes).collateral

                    # After callback
                    self._create_loan(collateral + more_collateral, debt, N, False, _for)
                    self.transferFrom(COLLATERAL_TOKEN, msg.sender, AMM.address, collateral)
                    self.transferFrom(COLLATERAL_TOKEN, callbacker, AMM.address, more_collateral)

                @internal
                @view
                def _check_approval(_for: address) -> bool:
                    return msg.sender == _for or self.approval[_for][msg.sender]

                @internal
                def _create_loan(collateral: uint256, debt: uint256, N: uint256, transfer_coins: bool, _for: address):
                    assert self.loan[_for].initial_debt == 0, "Loan already created"
                    assert N > MIN_TICKS-1, "Need more ticks"
                    assert N < MAX_TICKS+1, "Need less ticks"

                    n1: int256 = self._calculate_debt_n1(collateral, debt, N, _for)
                    n2: int256 = n1 + convert(unsafe_sub(N, 1), int256)

                    rate_mul: uint256 = AMM.get_rate_mul()
                    self.loan[_for] = Loan({initial_debt: debt, rate_mul: rate_mul})
                    liquidation_discount: uint256 = self.liquidation_discount
                    self.liquidation_discounts[_for] = liquidation_discount

                    n_loans: uint256 = self.n_loans
                    self.loans[n_loans] = _for
                    self.loan_ix[_for] = n_loans
                    self.n_loans = unsafe_add(n_loans, 1)

                    self._total_debt.initial_debt = self._total_debt.initial_debt * rate_mul / self._total_debt.rate_mul + debt
                    self._total_debt.rate_mul = rate_mul

                    AMM.deposit_range(_for, collateral, n1, n2)
                    self.minted += debt

                    if transfer_coins:
                        self.transferFrom(COLLATERAL_TOKEN, msg.sender, AMM.address, collateral)
                        self.transfer(BORROWED_TOKEN, _for, debt)

                    self._save_rate()

                    log UserState(_for, collateral, debt, n1, n2, liquidation_discount)
                    log Borrow(_for, collateral, debt)

                @internal
                def execute_callback(callbacker: address, callback_sig: bytes4,
                                    user: address, stablecoins: uint256, collateral: uint256, debt: uint256,
                                    callback_args: DynArray[uint256, 5], callback_bytes: Bytes[10**4]) -> CallbackData:
                    assert callbacker != COLLATERAL_TOKEN.address
                    assert callbacker != BORROWED_TOKEN.address

                    data: CallbackData = empty(CallbackData)
                    data.active_band = AMM.active_band()
                    band_x: uint256 = AMM.bands_x(data.active_band)
                    band_y: uint256 = AMM.bands_y(data.active_band)

                    # Callback
                    response: Bytes[64] = raw_call(
                        callbacker,
                        concat(callback_sig, _abi_encode(user, stablecoins, collateral, debt, callback_args, callback_bytes)),
                        max_outsize=64
                    )
                    data.stablecoins = convert(slice(response, 0, 32), uint256)
                    data.collateral = convert(slice(response, 32, 32), uint256)

                    # Checks after callback
                    assert data.active_band == AMM.active_band()
                    assert band_x == AMM.bands_x(data.active_band)
                    assert band_y == AMM.bands_y(data.active_band)
                ```

            === "AMM.vy"

                ```vyper
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

                    n_bands: uint256 = unsafe_add(convert(unsafe_sub(n2, n1), uint256), 1)
                    assert n_bands <= MAX_TICKS_UINT

                    y_per_band: uint256 = unsafe_div(amount * COLLATERAL_PRECISION, n_bands)
                    assert y_per_band > 100, "Amount too low"

                    assert self.user_shares[user].ticks[0] == 0  # dev: User must have no liquidity
                    self.user_shares[user].ns = unsafe_add(n1, unsafe_mul(n2, 2**128))

                    lm: LMGauge = self.liquidity_mining_callback

                    # Autoskip bands if we can
                    for i in range(MAX_SKIP_TICKS + 1):
                        if n1 > n0:
                            if i != 0:
                                self.active_band = n0
                            break
                        assert self.bands_x[n0] == 0 and i < MAX_SKIP_TICKS, "Deposit below current band"
                        n0 -= 1

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

                    log Deposit(user, amount, n1, n2)

                    if lm.address != empty(address):
                        lm.callback_collateral_shares(n1, collateral_shares)
                        lm.callback_user_shares(user, n1, user_shares)
                ```

    === "Example"

        ```shell
        >>> Controller.create_loan_extended(collateral: uint256, debt: uint256, N: uint256, callbacker: address, callback_args: DynArray[uint256,5])
        ```


### `extra_health`
!!! description "`Controller.extra_health(arg0: address) -> uint256: view`"

    !!!warning
        The mechanisms of `extra_health` were introduced in an improved version of LLAMMA. Earlier deployed crvUSD or lending markets might not have this.

    Getter for the extra health value for `arg0`. When setting extra health before creating a loan, a "health buffer" is added, which results in entering soft liquidation with more health. The `health` value when entering SL can be checked by using the [`health`](#health) function with using `bool = False`.

    ??? quote "Source code"

        === "Commit `b0240d8` — Sep 8, 2024"

            The following source code includes all changes up to commit hash [`b0240d8`](https://github.com/curvefi/curve-stablecoin/tree/b0240d844c9e60fdab78b481a556a187ceee3721); any changes made after this commit are not included.

            This implementation was used for [Optimism](../deployments/lending.md#logos-optimism-optimism) and [Fraxtal](../deployments/lending.md#logos-fraxtal-fraxtal) lending deployments.

            === "Controller.vy"

                ```vyper
                extra_health: public(HashMap[address, uint256])
                ```

    === "Example"

        ```shell
        >>> Controller.extra_health('user1')
        0
        >>> Controller.health('trader1', False)
        39438860614534486       # 3.9438860614534486% health when entering SL


        >>> Controller.extra_health('user2')
        10000000000000000       # 1% extra health
        >>> Controller.health('user2')
        49438860614534486       # 4.9438860614534486% health when entering SL
        ```


### `set_extra_health`
!!! description "`Controller.set_extra_health(_value: uint256)`"

    !!!warning
        The mechanisms of setting `extra_health` were introduced in an improved version of LLAMMA. Earlier deployed crvUSD or lending markets might not have this.

    Function to set `_value` as extra health for a user. Doing so will add a buffer to the loan a user creates which allows users to enter soft-liquidation with a higher health.

    Emits: `SetExtraHealth`

    ??? quote "Source code"

        === "Commit `b0240d8` — Sep 8, 2024"

            The following source code includes all changes up to commit hash [`b0240d8`](https://github.com/curvefi/curve-stablecoin/tree/b0240d844c9e60fdab78b481a556a187ceee3721); any changes made after this commit are not included.

            This implementation was used for [Optimism](../deployments/lending.md#logos-optimism-optimism) and [Fraxtal](../deployments/lending.md#logos-fraxtal-fraxtal) lending deployments.

            === "Controller.vy"

                ```vyper
                event SetExtraHealth:
                    user: indexed(address)
                    health: uint256

                extra_health: public(HashMap[address, uint256])

                @external
                def set_extra_health(_value: uint256):
                    """
                    @notice Add a little bit more to loan_discount to start SL with health higher than usual
                    @param _value 1e18-based addition to loan_discount
                    """
                    self.extra_health[msg.sender] = _value
                    log SetExtraHealth(msg.sender, _value)
                ```

    === "Example"

        ```shell
        >>> Controller.set_extra_health(10000000000000000)  # 1% extra health
        ```


### `approval`
!!! description "`Controller.approval(arg0: address, arg1: address) -> bool: view`"

    !!!warning
        The mechanism of granting approval, and therefore allowing, e.g., the creation of loans for another user, was introduced in an improved version of LLAMMA. Earlier deployed crvUSD or lending markets might not have this.

    Getter to check the approval status. Approval in this case is either `True` or `False`. It does not approve any specific values. Approval can be set using the [`approve`](#approve) function.

    Returns: `True` or `False`.

    | Input  | Type      | Description                                |
    | ------ | --------- | ------------------------------------------ |
    | `arg0` | `address` | Address for which a certain action is made |
    | `arg1` | `address` | Address which does certain actions         |

    ??? quote "Source code"

        === "Commit `b0240d8` — Sep 8, 2024"

            The following source code includes all changes up to commit hash [`b0240d8`](https://github.com/curvefi/curve-stablecoin/tree/b0240d844c9e60fdab78b481a556a187ceee3721); any changes made after this commit are not included.

            This implementation was used for [Optimism](../deployments/lending.md#logos-optimism-optimism) and [Fraxtal](../deployments/lending.md#logos-fraxtal-fraxtal) lending deployments.

            === "Controller.vy"

                ```vyper
                approval: public(HashMap[address, HashMap[address, bool]])
                ```

    === "Example"

        ```shell
        >>> Controller.approval('user1', 'user2')
        False
        ```



### `approve`
!!! description "`Controller.approve(_spender: address, _allow: bool)`"

    !!!warning
        The mechanism of granting approval, and therefore allowing, e.g., the creation of loans for another user, was introduced in an improved version of LLAMMA. Earlier deployed crvUSD or lending markets might not have this.

    Emits: `Approval`

    | Input      | Type      | Description                         |
    | ---------- | --------- | ----------------------------------- |
    | `_spender` | `address` | Address to whitelist for the action |
    | `_allow`   | `bool`    | Allowance status: `True` or `False` |

    ??? quote "Source code"

        === "Commit `b0240d8` — Sep 8, 2024"

            The following source code includes all changes up to commit hash [`b0240d8`](https://github.com/curvefi/curve-stablecoin/tree/b0240d844c9e60fdab78b481a556a187ceee3721); any changes made after this commit are not included.

            This implementation was used for [Optimism](../deployments/lending.md#logos-optimism-optimism) and [Fraxtal](../deployments/lending.md#logos-fraxtal-fraxtal) lending deployments.

            === "Controller.vy"

                ```vyper
                event Approval:
                    owner: indexed(address)
                    spender: indexed(address)
                    allow: bool

                approval: public(HashMap[address, HashMap[address, bool]])

                @external
                def approve(_spender: address, _allow: bool):
                    """
                    @notice Allow another address to borrow and repay for the user
                    @param _spender Address to whitelist for the action
                    @param _allow Whether to turn the approval on or off (no amounts)
                    """
                    self.approval[msg.sender][_spender] = _allow
                    log Approval(msg.sender, _spender, _allow)

                @internal
                @view
                def _check_approval(_for: address) -> bool:
                    return msg.sender == _for or self.approval[_for][msg.sender]
                ```

    === "Example"

        Example to approve `user1` to do certain actions for `user2`.

        ```shell
        >>> Controller.approve('user1', True)
        ```



### `max_borrowable`
!!! description "`Controller.max_borrowable(collateral: uint256, N: uint256, current_debt: uint256 = 0, user: address = empty(address)) -> uint256`"

    Function to calculate the maximum amount of crvUSD that can be borrowed against `collateral` using `N` bands. If the max borrowable amount exceeds the crvUSD balance of the controller, which essentially is what's left to be borrowed, it returns the amount that remains available for borrowing.

    Returns: maximum borrowable amount (`uint256`).

    | Input       | Type      | Description          |
    | ----------- | --------- | -------------------- |
    | `collateral`| `uint256` | Collateral amount (at its native precision) |
    | `N`         | `uint256` | Number of bands |
    | `current_debt` | `uint256` | Current debt (if any) |
    | `user`   | `empty(address)` | User to calculate the value for; this input is only necessary for nonzero `extra_health` |

    ??? quote "Source code"

        === "Commit `58289a4` — May 10, 2024"

            The following source code includes all changes up to commit hash [`58289a4`](https://github.com/curvefi/curve-stablecoin/tree/`58289a4`283d7cc3c53aba2d3801dcac5ef124957); any changes made after this commit are not included.

            === "Controller.vy"

                ```vyper
                @external
                @view
                @nonreentrant('lock')
                def max_borrowable(collateral: uint256, N: uint256, current_debt: uint256 = 0) -> uint256:
                    """
                    @notice Calculation of maximum which can be borrowed (details in comments)
                    @param collateral Collateral amount against which to borrow
                    @param N number of bands to have the deposit into
                    @param current_debt Current debt of the user (if any)
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
                    x = unsafe_div(x * (10**18 - 10**14), unsafe_mul(10**18, BORROWED_PRECISION))  # Make it a bit smaller
                    return min(x, BORROWED_TOKEN.balanceOf(self) + current_debt)  # Cannot borrow beyond the amount of coins Controller has

                @internal
                @pure
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
                        10**18, min(discount + unsafe_div((DEAD_SHARES * 10**18), max(unsafe_div(collateral, N), DEAD_SHARES)), 10**18)
                    ) / unsafe_mul(SQRT_BAND_RATIO, N)
                    y_effective: uint256 = d_y_effective
                    for i in range(1, MAX_TICKS_UINT):
                        if i == N:
                            break
                        d_y_effective = unsafe_div(d_y_effective * Aminus1, A)
                        y_effective = unsafe_add(y_effective, d_y_effective)
                    return y_effective
                ```

        === "Commit `b0240d8` — Sep 8, 2024"

            The following source code includes all changes up to commit hash [`b0240d8`](https://github.com/curvefi/curve-stablecoin/tree/b0240d844c9e60fdab78b481a556a187ceee3721); any changes made after this commit are not included.

            This implementation was used for [Optimism](../deployments/lending.md#logos-optimism-optimism) and [Fraxtal](../deployments/lending.md#logos-fraxtal-fraxtal) lending deployments.

            === "Controller.vy"

                ```vyper
                MAX_TICKS: constant(int256) = 50
                MAX_TICKS_UINT: constant(uint256) = 50
                MIN_TICKS: constant(int256) = 4
                MIN_TICKS_UINT: constant(uint256) = 4

                liquidation_discounts: public(HashMap[address, uint256])
                extra_health: public(HashMap[address, uint256])

                @external
                @view
                @nonreentrant('lock')
                def max_borrowable(collateral: uint256, N: uint256, current_debt: uint256 = 0, user: address = empty(address)) -> uint256:
                    """
                    @notice Calculation of maximum which can be borrowed (details in comments)
                    @param collateral Collateral amount against which to borrow
                    @param N number of bands to have the deposit into
                    @param current_debt Current debt of the user (if any)
                    @param user User to calculate the value for (only necessary for nonzero extra_health)
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
                    # if N < MIN_TICKS or N > MAX_TICKS:
                    assert N >= MIN_TICKS_UINT and N <= MAX_TICKS_UINT

                    y_effective: uint256 = self.get_y_effective(collateral * COLLATERAL_PRECISION, N,
                                                                self.loan_discount + self.extra_health[user])

                    x: uint256 = unsafe_sub(max(unsafe_div(y_effective * self.max_p_base(), 10**18), 1), 1)
                    x = unsafe_div(x * (10**18 - 10**14), unsafe_mul(10**18, BORROWED_PRECISION))  # Make it a bit smaller
                    return min(x, BORROWED_TOKEN.balanceOf(self) + current_debt)  # Cannot borrow beyond the amount of coins Controller has

                @internal
                @pure
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
                    d_y_effective: uint256 = unsafe_div(
                        collateral * unsafe_sub(
                            10**18, min(discount + unsafe_div((DEAD_SHARES * 10**18), max(unsafe_div(collateral, N), DEAD_SHARES)), 10**18)
                        ),
                        unsafe_mul(SQRT_BAND_RATIO, N))
                    y_effective: uint256 = d_y_effective
                    for i in range(1, MAX_TICKS_UINT):
                        if i == N:
                            break
                        d_y_effective = unsafe_div(d_y_effective * Aminus1, A)
                        y_effective = unsafe_add(y_effective, d_y_effective)
                    return y_effective
                ```

    === "Example"

        This example shows the maximum borrowable debt when using a defined amount of collateral and a specified number of bands. For instance, in the first case, using 1 BTC as collateral with 5 bands, a user can borrow up to approximately 37,965 crvUSD.

        ```shell
        >>> Controller.max_borrowable(10**18, 5)
        37965133715410776274198

        >>> Controller.max_borrowable(10**18, 50)
        30597863183498027832984
        ```


### `min_collateral`
!!! description "`Controller.min_collateral(debt: uint256, N: uint256, user: address = empty(address)) -> uint256`"

    Function to calculate the minimum amount of collateral that is necessary to support `debt` using `N` bands.

    Returns: minimal collateral required to support the give amount of debt (`uint256`).

    | Input  | Type      | Description          |
    | ------ | --------- | -------------------- |
    | `debt` | `uint256` | Debt to support      |
    | `N`    | `uint256` | Number of bands used |
    | `user` | `empty(address)` | User to calculate the value for; this input is only necessary for nonzero `extra_health` |

    ??? quote "Source code"

        === "Commit `58289a4` — May 10, 2024"

            The following source code includes all changes up to commit hash [`58289a4`](https://github.com/curvefi/curve-stablecoin/tree/`58289a4`283d7cc3c53aba2d3801dcac5ef124957); any changes made after this commit are not included.

            === "Controller.vy"

                ```vyper
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
                    # Add N**2 to account for precision loss in multiple bands, e.g. N / (y/N) = N**2 / y
                    return unsafe_div(
                        unsafe_div(
                            debt * unsafe_mul(10**18, BORROWED_PRECISION) / self.max_p_base() * 10**18 / self.get_y_effective(10**18, N, self.loan_discount) + N * (N + 2 * DEAD_SHARES) + unsafe_sub(COLLATERAL_PRECISION, 1),
                            COLLATERAL_PRECISION
                        ) * 10**18,
                        10**18 - 10**14)

                @internal
                @pure
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
                        10**18, min(discount + unsafe_div((DEAD_SHARES * 10**18), max(unsafe_div(collateral, N), DEAD_SHARES)), 10**18)
                    ) / unsafe_mul(SQRT_BAND_RATIO, N)
                    y_effective: uint256 = d_y_effective
                    for i in range(1, MAX_TICKS_UINT):
                        if i == N:
                            break
                        d_y_effective = unsafe_div(d_y_effective * Aminus1, A)
                        y_effective = unsafe_add(y_effective, d_y_effective)
                    return y_effective
                ```

        === "Commit `b0240d8` — Sep 8, 2024"

            The following source code includes all changes up to commit hash [`b0240d8`](https://github.com/curvefi/curve-stablecoin/tree/b0240d844c9e60fdab78b481a556a187ceee3721); any changes made after this commit are not included.

            This implementation was used for [Optimism](../deployments/lending.md#logos-optimism-optimism) and [Fraxtal](../deployments/lending.md#logos-fraxtal-fraxtal) lending deployments.

            === "Controller.vy"

                ```vyper
                @external
                @view
                @nonreentrant('lock')
                def min_collateral(debt: uint256, N: uint256, user: address = empty(address)) -> uint256:
                    """
                    @notice Minimal amount of collateral required to support debt
                    @param debt The debt to support
                    @param N Number of bands to deposit into
                    @param user User to calculate the value for (only necessary for nonzero extra_health)
                    @return Minimal collateral required
                    """
                    # Add N**2 to account for precision loss in multiple bands, e.g. N / (y/N) = N**2 / y
                    assert N <= MAX_TICKS_UINT
                    return unsafe_div(
                        unsafe_div(
                            debt * unsafe_mul(10**18, BORROWED_PRECISION) / self.max_p_base() * 10**18 / self.get_y_effective(10**18, N, self.loan_discount + self.extra_health[user]) + unsafe_add(unsafe_mul(N, unsafe_add(N, 2 * DEAD_SHARES)), unsafe_sub(COLLATERAL_PRECISION, 1)),
                            COLLATERAL_PRECISION
                        ) * 10**18,
                        10**18 - 10**14)

                @internal
                @pure
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
                    d_y_effective: uint256 = unsafe_div(
                        collateral * unsafe_sub(
                            10**18, min(discount + unsafe_div((DEAD_SHARES * 10**18), max(unsafe_div(collateral, N), DEAD_SHARES)), 10**18)
                        ),
                        unsafe_mul(SQRT_BAND_RATIO, N))
                    y_effective: uint256 = d_y_effective
                    for i in range(1, MAX_TICKS_UINT):
                        if i == N:
                            break
                        d_y_effective = unsafe_div(d_y_effective * Aminus1, A)
                        y_effective = unsafe_add(y_effective, d_y_effective)
                    return y_effective
                ```

    === "Example"

        This example shows the amount of collateral needed to support debt using different numbers of bands. The collateral in this example is BTC. For instance, in the first case, to support 10,000 crvUSD as debt using 5 bands, approximately 0.26 BTC is needed as collateral.

        ```shell
        >>> Controller.min_collateral(10**22, 5)
        263399572749066565

        >>> Controller.min_collateral(10**22, 50)
        326820207673727834
        ```


### `calculate_debt_n1`
!!! description "`Controller.calculate_debt_n1(collateral: uint256, debt: uint256, N: uint256, user: address = empty(address)) -> int256`"

    Getter method to calculate the upper band number for the deposited collateral to sit in to support the given debt. This call reverts if the requested debt is too high.

    Returns: upper band n1 (`int256`) to deposit the collateral into.

    | Input        | Type      | Description                                    |
    | ------------ | --------- | ---------------------------------------------- |
    | `collateral` | `uint256` | Amount of collateral (at its native precision) |
    | `debt`       | `uint256` | Amount of requested debt                       |
    | `N`          | `uint256` | Number of bands to deposit into                |
    | `user`   | `empty(address)` | User to calculate the value for; this input is only necessary for nonzero `extra_health` |

    ??? quote "Source code"

        === "Commit `58289a4` — May 10, 2024"

            The following source code includes all changes up to commit hash [`58289a4`](https://github.com/curvefi/curve-stablecoin/tree/`58289a4`283d7cc3c53aba2d3801dcac5ef124957); any changes made after this commit are not included.

            === "Controller.vy"

                ```vyper
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
                    y_effective = unsafe_div(y_effective * p_base, debt * BORROWED_PRECISION + 1)  # Now it's a ratio

                    # n1 = floor(log(y_effective) / self.logAratio)
                    # EVM semantics is not doing floor unlike Python, so we do this
                    assert y_effective > 0, "Amount too low"
                    n1: int256 = self.wad_ln(y_effective)
                    if n1 < 0:
                        n1 -= unsafe_sub(LOGN_A_RATIO, 1)  # This is to deal with vyper's rounding of negative numbers
                    n1 = unsafe_div(n1, LOGN_A_RATIO)

                    n1 = min(n1, 1024 - convert(N, int256)) + n0
                    if n1 <= n0:
                        assert AMM.can_skip_bands(n1 - 1), "Debt too high"

                    # Let's not rely on active_band corresponding to price_oracle:
                    # this will be not correct if we are in the area of empty bands
                    assert AMM.p_oracle_up(n1) < AMM.price_oracle(), "Debt too high"

                    return n1
                ```

        === "Commit `b0240d8` — Sep 8, 2024"

            The following source code includes all changes up to commit hash [`b0240d8`](https://github.com/curvefi/curve-stablecoin/tree/b0240d844c9e60fdab78b481a556a187ceee3721); any changes made after this commit are not included.

            This implementation was used for [Optimism](../deployments/lending.md#logos-optimism-optimism) and [Fraxtal](../deployments/lending.md#logos-fraxtal-fraxtal) lending deployments.

            === "Controller.vy"

                ```vyper
                @external
                @view
                @nonreentrant('lock')
                def calculate_debt_n1(collateral: uint256, debt: uint256, N: uint256, user: address = empty(address)) -> int256:
                    """
                    @notice Calculate the upper band number for the deposit to sit in to support
                            the given debt. Reverts if requested debt is too high.
                    @param collateral Amount of collateral (at its native precision)
                    @param debt Amount of requested debt
                    @param N Number of bands to deposit into
                    @param user User to calculate n1 for (only necessary for nonzero extra_health)
                    @return Upper band n1 (n1 <= n2) to deposit into. Signed integer
                    """
                    return self._calculate_debt_n1(collateral, debt, N, user)

                @internal
                @view
                def _calculate_debt_n1(collateral: uint256, debt: uint256, N: uint256, user: address) -> int256:
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
                    y_effective: uint256 = self.get_y_effective(collateral * COLLATERAL_PRECISION, N, self.loan_discount + self.extra_health[user])
                    # p_oracle_up(n1) = base_price * ((A - 1) / A)**n1

                    # We borrow up until min band touches p_oracle,
                    # or it touches non-empty bands which cannot be skipped.
                    # We calculate required n1 for given (collateral, debt),
                    # and if n1 corresponds to price_oracle being too high, or unreachable band
                    # - we revert.

                    # n1 is band number based on adiabatic trading, e.g. when p_oracle ~ p
                    y_effective = unsafe_div(y_effective * p_base, debt * BORROWED_PRECISION + 1)  # Now it's a ratio

                    # n1 = floor(log(y_effective) / self.logAratio)
                    # EVM semantics is not doing floor unlike Python, so we do this
                    assert y_effective > 0, "Amount too low"
                    n1: int256 = self.wad_ln(y_effective)
                    if n1 < 0:
                        n1 -= unsafe_sub(LOGN_A_RATIO, 1)  # This is to deal with vyper's rounding of negative numbers
                    n1 = unsafe_div(n1, LOGN_A_RATIO)

                    n1 = min(n1, 1024 - convert(N, int256)) + n0
                    if n1 <= n0:
                        assert AMM.can_skip_bands(n1 - 1), "Debt too high"

                    # Let's not rely on active_band corresponding to price_oracle:
                    # this will be not correct if we are in the area of empty bands
                    assert AMM.p_oracle_up(n1) < AMM.price_oracle(), "Debt too high"

                    return n1
                ```

    === "Example"

        This example shows the upper band into which the collateral is deposited.

        ```shell
        >>> Controller.calculate_debt_n1(10**18, 10**22, 5)
        85

        >>> Controller.calculate_debt_n1(10**18, 10**22, 25)
        76
        ```


### `repay`
!!! description "`Controller.repay(_d_debt: uint256, _for: address = msg.sender, max_active_band: int256 = 2**255-1)`"

    Function to partially or fully repay `_d_debt` amount of debt. If `_d_debt` exceeds the total debt amount of the user, a full repayment will be done.

    Emits: `UserState` and `Repay`

    | Input              | Type      | Description                                                     |
    | ------------------ | --------- | --------------------------------------------------------------- |
    | `_d_debt`          | `uint256` | Amount of debt to repay                                         |
    | `_for`             | `address` | Address to repay the debt for; defaults to `msg.sender`         |
    | `max_active_band`  | `int256`  | Highest active band. Used to prevent front-running the repay; defaults to `2**255-1` |
    | `use_eth`          | `bool`    | Use wrapping/unwrapping if collateral is ETH                    |

    ??? quote "Source code"

        === "Commit `58289a4` — May 10, 2024"

            The following source code includes all changes up to commit hash [`58289a4`](https://github.com/curvefi/curve-stablecoin/tree/`58289a4`283d7cc3c53aba2d3801dcac5ef124957); any changes made after this commit are not included.

            === "Controller.vy"

                ```vyper
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
                            self.transferFrom(BORROWED_TOKEN, AMM.address, _for, xy[0])
                        if xy[1] > 0:
                            self.transferFrom(COLLATERAL_TOKEN, AMM.address, _for, xy[1])
                        log UserState(_for, 0, 0, 0, 0, 0)
                        log Repay(_for, xy[1], d_debt)
                        self._remove_from_list(_for)

                    else:
                        active_band: int256 = AMM.active_band_with_skip()
                        assert active_band <= max_active_band

                        ns: int256[2] = AMM.read_user_tick_numbers(_for)
                        size: uint256 = convert(unsafe_add(unsafe_sub(ns[1], ns[0]), 1), uint256)
                        liquidation_discount: uint256 = self.liquidation_discounts[_for]

                        if ns[0] > active_band:
                            # Not in liquidation - can move bands
                            xy: uint256[2] = AMM.withdraw(_for, 10**18)
                            n1: int256 = self._calculate_debt_n1(xy[1], debt, size)
                            n2: int256 = n1 + unsafe_sub(ns[1], ns[0])
                            AMM.deposit_range(_for, xy[1], n1, n2)
                            if _for == msg.sender:
                                # Update liquidation discount only if we are that same user. No rugs
                                liquidation_discount = self.liquidation_discount
                                self.liquidation_discounts[_for] = liquidation_discount
                            log UserState(_for, xy[1], debt, n1, n2, liquidation_discount)
                            log Repay(_for, 0, d_debt)
                        else:
                            # Underwater - cannot move band but can avoid a bad liquidation
                            log UserState(_for, max_value(uint256), debt, ns[0], ns[1], liquidation_discount)
                            log Repay(_for, 0, d_debt)

                        if _for != msg.sender:
                            # Doesn't allow non-sender to repay in a way which ends with unhealthy state
                            # full = False to make this condition non-manipulatable (and also cheaper on gas)
                            assert self._health(_for, debt, False, liquidation_discount) > 0

                    # If we withdrew already - will burn less!
                    self.transferFrom(BORROWED_TOKEN, msg.sender, self, d_debt)  # fail: insufficient funds
                    self.redeemed += d_debt

                    self.loan[_for] = Loan({initial_debt: debt, rate_mul: rate_mul})
                    total_debt: uint256 = self._total_debt.initial_debt * rate_mul / self._total_debt.rate_mul
                    self._total_debt.initial_debt = unsafe_sub(max(total_debt, d_debt), d_debt)
                    self._total_debt.rate_mul = rate_mul

                    self._save_rate()
                ```

            === "AMM.vy"

                ```vyper
                event Withdraw:
                    provider: indexed(address)
                    amount_borrowed: uint256
                    amount_collateral: uint256

                @external
                @nonreentrant('lock')
                def withdraw(user: address, frac: uint256) -> uint256[2]:
                    """
                    @notice Withdraw liquidity for the user. Only admin contract can do it
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
                    old_max_band: int256 = self.max_band
                    max_band: int256 = n - 1

                    for i in range(MAX_TICKS):
                        x: uint256 = self.bands_x[n]
                        y: uint256 = self.bands_y[n]
                        ds: uint256 = unsafe_div(frac * user_shares[i], 10**18)
                        user_shares[i] = unsafe_sub(user_shares[i], ds)  # Can ONLY zero out when frac == 10**18
                        s: uint256 = self.total_shares[n]
                        new_shares: uint256 = s - ds
                        self.total_shares[n] = new_shares
                        s += DEAD_SHARES  # after this s is guaranteed to be bigger than 0
                        dx: uint256 = unsafe_div((x + 1) * ds, s)
                        dy: uint256 = unsafe_div((y + 1) * ds, s)

                        x -= dx
                        y -= dy

                        # If withdrawal is the last one - transfer dust to admin fees
                        if new_shares == 0:
                            if x > 0:
                                self.admin_fees_x += unsafe_div(x, BORROWED_PRECISION)
                            if y > 0:
                                self.admin_fees_y += unsafe_div(y, COLLATERAL_PRECISION)
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

                    if lm.address != empty(address):
                        lm.callback_collateral_shares(0, [])  # collateral/shares ratio is unchanged
                        lm.callback_user_shares(user, ns[0], user_shares)

                    return [total_x, total_y]
                ```

        === "Commit `b0240d8` — Sep 8, 2024"

            The following source code includes all changes up to commit hash [`b0240d8`](https://github.com/curvefi/curve-stablecoin/tree/b0240d844c9e60fdab78b481a556a187ceee3721); any changes made after this commit are not included.

            This implementation was used for [Optimism](../deployments/lending.md#logos-optimism-optimism) and [Fraxtal](../deployments/lending.md#logos-fraxtal-fraxtal) lending deployments.

            === "Controller.vy"

                ```vyper
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
                def repay(_d_debt: uint256, _for: address = msg.sender, max_active_band: int256 = 2**255-1):
                    """
                    @notice Repay debt (partially or fully)
                    @param _d_debt The amount of debt to repay. If higher than the current debt - will do full repayment
                    @param _for The user to repay the debt for
                    @param max_active_band Don't allow active band to be higher than this (to prevent front-running the repay)
                    @param _for Address to repay for
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
                    approval: bool = self._check_approval(_for)

                    if debt == 0:
                        # Allow to withdraw all assets even when underwater
                        xy: uint256[2] = AMM.withdraw(_for, 10**18)
                        if xy[0] > 0:
                            # Only allow full repayment when underwater for the sender to do
                            assert approval
                            self.transferFrom(BORROWED_TOKEN, AMM.address, _for, xy[0])
                        if xy[1] > 0:
                            self.transferFrom(COLLATERAL_TOKEN, AMM.address, _for, xy[1])
                        log UserState(_for, 0, 0, 0, 0, 0)
                        log Repay(_for, xy[1], d_debt)
                        self._remove_from_list(_for)

                    else:
                        active_band: int256 = AMM.active_band_with_skip()
                        assert active_band <= max_active_band

                        ns: int256[2] = AMM.read_user_tick_numbers(_for)
                        size: int256 = unsafe_sub(ns[1], ns[0])
                        liquidation_discount: uint256 = self.liquidation_discounts[_for]

                        if ns[0] > active_band:
                            # Not in liquidation - can move bands
                            xy: uint256[2] = AMM.withdraw(_for, 10**18)
                            n1: int256 = self._calculate_debt_n1(xy[1], debt, convert(unsafe_add(size, 1), uint256), _for)
                            n2: int256 = n1 + size
                            AMM.deposit_range(_for, xy[1], n1, n2)
                            if approval:
                                # Update liquidation discount only if we are that same user. No rugs
                                liquidation_discount = self.liquidation_discount
                                self.liquidation_discounts[_for] = liquidation_discount
                            log UserState(_for, xy[1], debt, n1, n2, liquidation_discount)
                            log Repay(_for, 0, d_debt)
                        else:
                            # Underwater - cannot move band but can avoid a bad liquidation
                            log UserState(_for, max_value(uint256), debt, ns[0], ns[1], liquidation_discount)
                            log Repay(_for, 0, d_debt)

                        if not approval:
                            # Doesn't allow non-sender to repay in a way which ends with unhealthy state
                            # full = False to make this condition non-manipulatable (and also cheaper on gas)
                            assert self._health(_for, debt, False, liquidation_discount) > 0

                    # If we withdrew already - will burn less!
                    self.transferFrom(BORROWED_TOKEN, msg.sender, self, d_debt)  # fail: insufficient funds
                    self.redeemed += d_debt

                    self.loan[_for] = Loan({initial_debt: debt, rate_mul: rate_mul})
                    total_debt: uint256 = self._total_debt.initial_debt * rate_mul / self._total_debt.rate_mul
                    self._total_debt.initial_debt = unsafe_sub(max(total_debt, d_debt), d_debt)
                    self._total_debt.rate_mul = rate_mul

                    self._save_rate()
                ```

            === "AMM.vy"

                ```vyper
                event Withdraw:
                    provider: indexed(address)
                    amount_borrowed: uint256
                    amount_collateral: uint256

                @external
                @nonreentrant('lock')
                def withdraw(user: address, frac: uint256) -> uint256[2]:
                    """
                    @notice Withdraw liquidity for the user. Only admin contract can do it
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
                    old_max_band: int256 = self.max_band
                    max_band: int256 = n - 1

                    for i in range(MAX_TICKS):
                        x: uint256 = self.bands_x[n]
                        y: uint256 = self.bands_y[n]
                        ds: uint256 = unsafe_div(frac * user_shares[i], 10**18)
                        user_shares[i] = unsafe_sub(user_shares[i], ds)  # Can ONLY zero out when frac == 10**18
                        s: uint256 = self.total_shares[n]
                        new_shares: uint256 = s - ds
                        self.total_shares[n] = new_shares
                        s += DEAD_SHARES  # after this s is guaranteed to be bigger than 0
                        dx: uint256 = unsafe_div((x + 1) * ds, s)
                        dy: uint256 = unsafe_div((y + 1) * ds, s)

                        x -= dx
                        y -= dy

                        # If withdrawal is the last one - transfer dust to admin fees
                        if new_shares == 0:
                            if x > 0:
                                self.admin_fees_x += unsafe_div(x, BORROWED_PRECISION)
                            if y > 0:
                                self.admin_fees_y += unsafe_div(y, COLLATERAL_PRECISION)
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

                    if lm.address != empty(address):
                        lm.callback_collateral_shares(0, [])  # collateral/shares ratio is unchanged
                        lm.callback_user_shares(user, ns[0], user_shares)

                    return [total_x, total_y]
                ```

    === "Example"

        ```shell
        >>> soon
        ```


### `repay_extended`
!!! description "`Controller.repay_extended(callbacker: address, callback_args: DynArray[uint256,5], callback_bytes: Bytes[10**4] = b"",  _for: address = msg.sender)`"

    Extended function to repay a loan but obtain a stablecoin for that from a callback (to deleverage). Earlier implementations of the contract did not have `callback_bytes` argument. This was added to enable [leveraging/de-leveraging using the 1inch router](./leverage/LeverageZap1inch.md#unwinding-leverage).

    Emits: `UserState` and `Repay`

    | Input            | Type                  | Description                                          |
    | ---------------- | --------------------- | ---------------------------------------------------- |
    | `callbacker`     | `address`             | Address of the callback contract                     |
    | `callback_args`  | `DynArray[uint256,5]` | Extra arguments for the callback (up to 5), such as `min_amount` |
    | `callback_bytes` | `Bytes[10**4]`        | Callback bytes passed to the LeverageZap. Defaults to `b""` |
    | `_for`       | `address` | Address to repay debt for (requires approval); only available in new implementation |

    ??? quote "Source code"

        === "Commit `58289a4` — May 10, 2024"

            The following source code includes all changes up to commit hash [`58289a4`](https://github.com/curvefi/curve-stablecoin/tree/`58289a4`283d7cc3c53aba2d3801dcac5ef124957); any changes made after this commit are not included.

            === "Controller.vy"

                ```vyper
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

                CALLBACK_DEPOSIT: constant(bytes4) = method_id("callback_deposit(address,uint256,uint256,uint256,uint256[])", output_type=bytes4)
                CALLBACK_REPAY: constant(bytes4) = method_id("callback_repay(address,uint256,uint256,uint256,uint256[])", output_type=bytes4)
                CALLBACK_LIQUIDATE: constant(bytes4) = method_id("callback_liquidate(address,uint256,uint256,uint256,uint256[])", output_type=bytes4)

                CALLBACK_DEPOSIT_WITH_BYTES: constant(bytes4) = method_id("callback_deposit(address,uint256,uint256,uint256,uint256[],bytes)", output_type=bytes4)
                # CALLBACK_REPAY_WITH_BYTES: constant(bytes4) = method_id("callback_repay(address,uint256,uint256,uint256,uint256[],bytes)", output_type=bytes4) <-- BUG! The reason is 0 at the beginning of method_id
                CALLBACK_REPAY_WITH_BYTES: constant(bytes4) = 0x008ae188
                CALLBACK_LIQUIDATE_WITH_BYTES: constant(bytes4) = method_id("callback_liquidate(address,uint256,uint256,uint256,uint256[],bytes)", output_type=bytes4)

                @external
                @nonreentrant('lock')
                def repay_extended(callbacker: address, callback_args: DynArray[uint256,5], callback_bytes: Bytes[10**4] = b""):
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
                    self.transferFrom(COLLATERAL_TOKEN, AMM.address, callbacker, xy[1])

                    # For compatibility
                    callback_sig: bytes4 = CALLBACK_REPAY_WITH_BYTES
                    if callback_bytes == b"":
                        callback_sig = CALLBACK_REPAY
                    cb: CallbackData = self.execute_callback(
                        callbacker, callback_sig, msg.sender, xy[0], xy[1], debt, callback_args, callback_bytes)

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
                        self.transferFrom(BORROWED_TOKEN, callbacker, self, cb.stablecoins)
                        self.transferFrom(BORROWED_TOKEN, AMM.address, self, xy[0])
                        if total_stablecoins > d_debt:
                            self.transfer(BORROWED_TOKEN, msg.sender, unsafe_sub(total_stablecoins, d_debt))
                        self.transferFrom(COLLATERAL_TOKEN, callbacker, msg.sender, cb.collateral)

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

                        self.transferFrom(COLLATERAL_TOKEN, callbacker, AMM.address, cb.collateral)
                        # Stablecoin is all spent to repay debt -> all goes to self
                        self.transferFrom(BORROWED_TOKEN, callbacker, self, cb.stablecoins)
                        # We are above active band, so xy[0] is 0 anyway

                        log UserState(msg.sender, cb.collateral, debt, n1, n2, liquidation_discount)
                        xy[1] -= cb.collateral

                        # No need to check _health() because it's the sender

                    # Common calls which we will do regardless of whether it's a full repay or not
                    log Repay(msg.sender, xy[1], d_debt)
                    self.redeemed += d_debt
                    self.loan[msg.sender] = Loan({initial_debt: debt, rate_mul: rate_mul})
                    total_debt: uint256 = self._total_debt.initial_debt * rate_mul / self._total_debt.rate_mul
                    self._total_debt.initial_debt = unsafe_sub(max(total_debt, d_debt), d_debt)
                    self._total_debt.rate_mul = rate_mul

                    self._save_rate()
                ```

            === "AMM.vy"

                ```vyper
                event Withdraw:
                    provider: indexed(address)
                    amount_borrowed: uint256
                    amount_collateral: uint256

                @external
                @nonreentrant('lock')
                def withdraw(user: address, frac: uint256) -> uint256[2]:
                    """
                    @notice Withdraw liquidity for the user. Only admin contract can do it
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
                    old_max_band: int256 = self.max_band
                    max_band: int256 = n - 1

                    for i in range(MAX_TICKS):
                        x: uint256 = self.bands_x[n]
                        y: uint256 = self.bands_y[n]
                        ds: uint256 = unsafe_div(frac * user_shares[i], 10**18)
                        user_shares[i] = unsafe_sub(user_shares[i], ds)  # Can ONLY zero out when frac == 10**18
                        s: uint256 = self.total_shares[n]
                        new_shares: uint256 = s - ds
                        self.total_shares[n] = new_shares
                        s += DEAD_SHARES  # after this s is guaranteed to be bigger than 0
                        dx: uint256 = unsafe_div((x + 1) * ds, s)
                        dy: uint256 = unsafe_div((y + 1) * ds, s)

                        x -= dx
                        y -= dy

                        # If withdrawal is the last one - transfer dust to admin fees
                        if new_shares == 0:
                            if x > 0:
                                self.admin_fees_x += unsafe_div(x, BORROWED_PRECISION)
                            if y > 0:
                                self.admin_fees_y += unsafe_div(y, COLLATERAL_PRECISION)
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

                    if lm.address != empty(address):
                        lm.callback_collateral_shares(0, [])  # collateral/shares ratio is unchanged
                        lm.callback_user_shares(user, ns[0], user_shares)

                    return [total_x, total_y]
                ```

        === "Commit `b0240d8` — Sep 8, 2024"

            The following source code includes all changes up to commit hash [`b0240d8`](https://github.com/curvefi/curve-stablecoin/tree/b0240d844c9e60fdab78b481a556a187ceee3721); any changes made after this commit are not included.

            This implementation was used for [Optimism](../deployments/lending.md#logos-optimism-optimism) and [Fraxtal](../deployments/lending.md#logos-fraxtal-fraxtal) lending deployments.

            === "Controller.vy"

                ```vyper
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

                CALLBACK_DEPOSIT: constant(bytes4) = method_id("callback_deposit(address,uint256,uint256,uint256,uint256[])", output_type=bytes4)
                CALLBACK_REPAY: constant(bytes4) = method_id("callback_repay(address,uint256,uint256,uint256,uint256[])", output_type=bytes4)
                CALLBACK_LIQUIDATE: constant(bytes4) = method_id("callback_liquidate(address,uint256,uint256,uint256,uint256[])", output_type=bytes4)

                CALLBACK_DEPOSIT_WITH_BYTES: constant(bytes4) = method_id("callback_deposit(address,uint256,uint256,uint256,uint256[],bytes)", output_type=bytes4)
                # CALLBACK_REPAY_WITH_BYTES: constant(bytes4) = method_id("callback_repay(address,uint256,uint256,uint256,uint256[],bytes)", output_type=bytes4) <-- BUG! The reason is 0 at the beginning of method_id
                CALLBACK_REPAY_WITH_BYTES: constant(bytes4) = 0x008ae188
                CALLBACK_LIQUIDATE_WITH_BYTES: constant(bytes4) = method_id("callback_liquidate(address,uint256,uint256,uint256,uint256[],bytes)", output_type=bytes4)

                @external
                @nonreentrant('lock')
                def repay_extended(callbacker: address, callback_args: DynArray[uint256,5], callback_bytes: Bytes[10**4] = b"",  _for: address = msg.sender):
                    """
                    @notice Repay loan but get a stablecoin for that from callback (to deleverage)
                    @param callbacker Address of the callback contract
                    @param callback_args Extra arguments for the callback (up to 5) such as min_amount etc
                    @param _for Address to repay for
                    """
                    assert self._check_approval(_for)

                    # Before callback
                    ns: int256[2] = AMM.read_user_tick_numbers(_for)
                    xy: uint256[2] = AMM.withdraw(_for, 10**18)
                    debt: uint256 = 0
                    rate_mul: uint256 = 0
                    debt, rate_mul = self._debt(_for)
                    self.transferFrom(COLLATERAL_TOKEN, AMM.address, callbacker, xy[1])

                    # For compatibility
                    callback_sig: bytes4 = CALLBACK_REPAY_WITH_BYTES
                    if callback_bytes == b"":
                        callback_sig = CALLBACK_REPAY
                    cb: CallbackData = self.execute_callback(
                        callbacker, callback_sig, _for, xy[0], xy[1], debt, callback_args, callback_bytes)

                    # After callback
                    total_stablecoins: uint256 = cb.stablecoins + xy[0]
                    assert total_stablecoins > 0  # dev: no coins to repay

                    # d_debt: uint256 = min(debt, total_stablecoins)

                    d_debt: uint256 = 0

                    # If we have more stablecoins than the debt - full repayment and closing the position
                    if total_stablecoins >= debt:
                        d_debt = debt
                        debt = 0
                        self._remove_from_list(_for)

                        # Transfer debt to self, everything else to _for
                        self.transferFrom(BORROWED_TOKEN, callbacker, self, cb.stablecoins)
                        self.transferFrom(BORROWED_TOKEN, AMM.address, self, xy[0])
                        if total_stablecoins > d_debt:
                            self.transfer(BORROWED_TOKEN, _for, unsafe_sub(total_stablecoins, d_debt))
                        self.transferFrom(COLLATERAL_TOKEN, callbacker, _for, cb.collateral)

                        log UserState(_for, 0, 0, 0, 0, 0)

                    # Else - partial repayment -> deleverage, but only if we are not underwater
                    else:
                        size: int256 = unsafe_sub(ns[1], ns[0])
                        assert ns[0] > cb.active_band
                        d_debt = cb.stablecoins  # cb.stablecoins <= total_stablecoins < debt
                        debt = unsafe_sub(debt, cb.stablecoins)

                        # Not in liquidation - can move bands
                        n1: int256 = self._calculate_debt_n1(cb.collateral, debt, convert(unsafe_add(size, 1), uint256), _for)
                        n2: int256 = n1 + size
                        AMM.deposit_range(_for, cb.collateral, n1, n2)
                        liquidation_discount: uint256 = self.liquidation_discount
                        self.liquidation_discounts[_for] = liquidation_discount

                        self.transferFrom(COLLATERAL_TOKEN, callbacker, AMM.address, cb.collateral)
                        # Stablecoin is all spent to repay debt -> all goes to self
                        self.transferFrom(BORROWED_TOKEN, callbacker, self, cb.stablecoins)
                        # We are above active band, so xy[0] is 0 anyway

                        log UserState(_for, cb.collateral, debt, n1, n2, liquidation_discount)
                        xy[1] -= cb.collateral

                        # No need to check _health() because it's the _for

                    # Common calls which we will do regardless of whether it's a full repay or not
                    log Repay(_for, xy[1], d_debt)
                    self.redeemed += d_debt
                    self.loan[_for] = Loan({initial_debt: debt, rate_mul: rate_mul})
                    total_debt: uint256 = self._total_debt.initial_debt * rate_mul / self._total_debt.rate_mul
                    self._total_debt.initial_debt = unsafe_sub(max(total_debt, d_debt), d_debt)
                    self._total_debt.rate_mul = rate_mul

                    self._save_rate()
                ```

            === "AMM.vy"

                ```vyper
                event Withdraw:
                    provider: indexed(address)
                    amount_borrowed: uint256
                    amount_collateral: uint256

                @external
                @nonreentrant('lock')
                def withdraw(user: address, frac: uint256) -> uint256[2]:
                    """
                    @notice Withdraw liquidity for the user. Only admin contract can do it
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
                    old_max_band: int256 = self.max_band
                    max_band: int256 = n - 1

                    for i in range(MAX_TICKS):
                        x: uint256 = self.bands_x[n]
                        y: uint256 = self.bands_y[n]
                        ds: uint256 = unsafe_div(frac * user_shares[i], 10**18)
                        user_shares[i] = unsafe_sub(user_shares[i], ds)  # Can ONLY zero out when frac == 10**18
                        s: uint256 = self.total_shares[n]
                        new_shares: uint256 = s - ds
                        self.total_shares[n] = new_shares
                        s += DEAD_SHARES  # after this s is guaranteed to be bigger than 0
                        dx: uint256 = unsafe_div((x + 1) * ds, s)
                        dy: uint256 = unsafe_div((y + 1) * ds, s)

                        x -= dx
                        y -= dy

                        # If withdrawal is the last one - transfer dust to admin fees
                        if new_shares == 0:
                            if x > 0:
                                self.admin_fees_x += unsafe_div(x, BORROWED_PRECISION)
                            if y > 0:
                                self.admin_fees_y += unsafe_div(y, COLLATERAL_PRECISION)
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

                    if lm.address != empty(address):
                        lm.callback_collateral_shares(0, [])  # collateral/shares ratio is unchanged
                        lm.callback_user_shares(user, ns[0], user_shares)

                    return [total_x, total_y]
                ```

    === "Example"

        ```shell
        >>> soon
        ```


---


## **Adjusting Existing Loans**

An already existing loan can be managed in different ways:

- `add_collateral`: Adding more collateral.
- `remove_collateral`: Removing collateral.
- `borrow_more`: Borrowing more assets.
- `liquidate`: Partially or fully liquidating a position.



### `add_collateral`
!!! description "`Controller.add_collateral(collateral: uint256, _for: address = msg.sender)`"

    Function to add extra collateral to an existing loan. Reverts when trying to add `0` collateral tokens.

    Emits: `UserState` and `Borrow`

    | Input        | Type      | Description                    |
    | ------------ | --------- | ------------------------------ |
    | `collateral` | `uint256` | Amount of collateral to add    |
    | `_for`       | `address` | Address to add collateral for; defaults to `msg.sender` |

    ??? quote "Source code"

        === "Commit `58289a4` — May 10, 2024"

            The following source code includes all changes up to commit hash [`58289a4`](https://github.com/curvefi/curve-stablecoin/tree/`58289a4`283d7cc3c53aba2d3801dcac5ef124957); any changes made after this commit are not included.

            === "Controller.vy"

                ```vyper
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

                @external
                @nonreentrant('lock')
                def add_collateral(collateral: uint256, _for: address = msg.sender):
                    """
                    @notice Add extra collateral to avoid bad liquidations
                    @param collateral Amount of collateral to add
                    @param _for Address to add collateral for
                    """
                    if collateral == 0:
                        return
                    self._add_collateral_borrow(collateral, 0, _for, False)
                    self.transferFrom(COLLATERAL_TOKEN, msg.sender, AMM.address, collateral)
                    self._save_rate()

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

                    liquidation_discount: uint256 = 0
                    if _for == msg.sender:
                        liquidation_discount = self.liquidation_discount
                        self.liquidation_discounts[_for] = liquidation_discount
                    else:
                        liquidation_discount = self.liquidation_discounts[_for]

                    if d_debt != 0:
                        self._total_debt.initial_debt = self._total_debt.initial_debt * rate_mul / self._total_debt.rate_mul + d_debt
                        self._total_debt.rate_mul = rate_mul

                    if remove_collateral:
                        log RemoveCollateral(_for, d_collateral)
                    else:
                        log Borrow(_for, d_collateral, d_debt)

                    log UserState(_for, xy[1], debt, n1, n2, liquidation_discount)
                ```

            === "AMM.vy"

                ```vyper
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

                    n_bands: uint256 = unsafe_add(convert(unsafe_sub(n2, n1), uint256), 1)
                    assert n_bands <= MAX_TICKS_UINT

                    y_per_band: uint256 = unsafe_div(amount * COLLATERAL_PRECISION, n_bands)
                    assert y_per_band > 100, "Amount too low"

                    assert self.user_shares[user].ticks[0] == 0  # dev: User must have no liquidity
                    self.user_shares[user].ns = unsafe_add(n1, unsafe_mul(n2, 2**128))

                    lm: LMGauge = self.liquidity_mining_callback

                    # Autoskip bands if we can
                    for i in range(MAX_SKIP_TICKS + 1):
                        if n1 > n0:
                            if i != 0:
                                self.active_band = n0
                            break
                        assert self.bands_x[n0] == 0 and i < MAX_SKIP_TICKS, "Deposit below current band"
                        n0 -= 1

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

                    log Deposit(user, amount, n1, n2)

                    if lm.address != empty(address):
                        lm.callback_collateral_shares(n1, collateral_shares)
                        lm.callback_user_shares(user, n1, user_shares)
                ```

        === "Commit `b0240d8` — Sep 8, 2024"

            The following source code includes all changes up to commit hash [`b0240d8`](https://github.com/curvefi/curve-stablecoin/tree/b0240d844c9e60fdab78b481a556a187ceee3721); any changes made after this commit are not included.

            This implementation was used for [Optimism](../deployments/lending.md#logos-optimism-optimism) and [Fraxtal](../deployments/lending.md#logos-fraxtal-fraxtal) lending deployments.

            === "Controller.vy"

                ```vyper
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

                @external
                @nonreentrant('lock')
                def add_collateral(collateral: uint256, _for: address = msg.sender):
                    """
                    @notice Add extra collateral to avoid bad liquidations
                    @param collateral Amount of collateral to add
                    @param _for Address to add collateral for
                    """
                    if collateral == 0:
                        return
                    self._add_collateral_borrow(collateral, 0, _for, False)
                    self.transferFrom(COLLATERAL_TOKEN, msg.sender, AMM.address, collateral)
                    self._save_rate()

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
                    n1: int256 = self._calculate_debt_n1(xy[1], debt, size, _for)
                    n2: int256 = n1 + unsafe_sub(ns[1], ns[0])

                    AMM.deposit_range(_for, xy[1], n1, n2)
                    self.loan[_for] = Loan({initial_debt: debt, rate_mul: rate_mul})

                    liquidation_discount: uint256 = 0
                    if _for == msg.sender:
                        liquidation_discount = self.liquidation_discount
                        self.liquidation_discounts[_for] = liquidation_discount
                    else:
                        liquidation_discount = self.liquidation_discounts[_for]

                    if d_debt != 0:
                        self._total_debt.initial_debt = self._total_debt.initial_debt * rate_mul / self._total_debt.rate_mul + d_debt
                        self._total_debt.rate_mul = rate_mul

                    if remove_collateral:
                        log RemoveCollateral(_for, d_collateral)
                    else:
                        log Borrow(_for, d_collateral, d_debt)

                    log UserState(_for, xy[1], debt, n1, n2, liquidation_discount)
                ```

            === "AMM.vy"

                ```vyper
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

                    n_bands: uint256 = unsafe_add(convert(unsafe_sub(n2, n1), uint256), 1)
                    assert n_bands <= MAX_TICKS_UINT

                    y_per_band: uint256 = unsafe_div(amount * COLLATERAL_PRECISION, n_bands)
                    assert y_per_band > 100, "Amount too low"

                    assert self.user_shares[user].ticks[0] == 0  # dev: User must have no liquidity
                    self.user_shares[user].ns = unsafe_add(n1, unsafe_mul(n2, 2**128))

                    lm: LMGauge = self.liquidity_mining_callback

                    # Autoskip bands if we can
                    for i in range(MAX_SKIP_TICKS + 1):
                        if n1 > n0:
                            if i != 0:
                                self.active_band = n0
                            break
                        assert self.bands_x[n0] == 0 and i < MAX_SKIP_TICKS, "Deposit below current band"
                        n0 -= 1

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

                    log Deposit(user, amount, n1, n2)

                    if lm.address != empty(address):
                        lm.callback_collateral_shares(n1, collateral_shares)
                        lm.callback_user_shares(user, n1, user_shares)
                ```

    === "Example"

        ```shell
        >>> Controller.add_collateral(10**18, trader)

        >>> Controller.user_state(trader)
        [2000000000000000000, 0, 1000000892890902175729, 10]
        # [collateral, stablecoin, debt, bands]
        ```


### `remove_collateral`
!!! description "`Controller.remove_collateral(collateral: uint256, _for: address = msg.sender)`"

    Function to remove collateral from an existing loan.

    Emits: `UserState` and `RemoveCollateral`

    | Input        | Type      | Description                                                |
    | ------------ | --------- | ---------------------------------------------------------- |
    | `collateral` | `uint256` | Amount of collateral to remove                             |
    | `_for`    | `address`    | Address to remove collateral for |

    ??? quote "Source code"

        === "Commit `58289a4` — May 10, 2024"

            The following source code includes all changes up to commit hash [`58289a4`](https://github.com/curvefi/curve-stablecoin/tree/`58289a4`283d7cc3c53aba2d3801dcac5ef124957); any changes made after this commit are not included.

            === "Controller.vy"

                ```vyper
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
                    self.transferFrom(COLLATERAL_TOKEN, AMM.address, msg.sender, collateral)
                    self._save_rate()

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

                    liquidation_discount: uint256 = 0
                    if _for == msg.sender:
                        liquidation_discount = self.liquidation_discount
                        self.liquidation_discounts[_for] = liquidation_discount
                    else:
                        liquidation_discount = self.liquidation_discounts[_for]

                    if d_debt != 0:
                        self._total_debt.initial_debt = self._total_debt.initial_debt * rate_mul / self._total_debt.rate_mul + d_debt
                        self._total_debt.rate_mul = rate_mul

                    if remove_collateral:
                        log RemoveCollateral(_for, d_collateral)
                    else:
                        log Borrow(_for, d_collateral, d_debt)

                    log UserState(_for, xy[1], debt, n1, n2, liquidation_discount)
                ```

            === "AMM.vy"

                ```vyper
                event Withdraw:
                    provider: indexed(address)
                    amount_borrowed: uint256
                    amount_collateral: uint256

                @external
                @nonreentrant('lock')
                def withdraw(user: address, frac: uint256) -> uint256[2]:
                    """
                    @notice Withdraw liquidity for the user. Only admin contract can do it
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
                    old_max_band: int256 = self.max_band
                    max_band: int256 = n - 1

                    for i in range(MAX_TICKS):
                        x: uint256 = self.bands_x[n]
                        y: uint256 = self.bands_y[n]
                        ds: uint256 = unsafe_div(frac * user_shares[i], 10**18)
                        user_shares[i] = unsafe_sub(user_shares[i], ds)  # Can ONLY zero out when frac == 10**18
                        s: uint256 = self.total_shares[n]
                        new_shares: uint256 = s - ds
                        self.total_shares[n] = new_shares
                        s += DEAD_SHARES  # after this s is guaranteed to be bigger than 0
                        dx: uint256 = unsafe_div((x + 1) * ds, s)
                        dy: uint256 = unsafe_div((y + 1) * ds, s)

                        x -= dx
                        y -= dy

                        # If withdrawal is the last one - transfer dust to admin fees
                        if new_shares == 0:
                            if x > 0:
                                self.admin_fees_x += unsafe_div(x, BORROWED_PRECISION)
                            if y > 0:
                                self.admin_fees_y += unsafe_div(y, COLLATERAL_PRECISION)
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

                    if lm.address != empty(address):
                        lm.callback_collateral_shares(0, [])  # collateral/shares ratio is unchanged
                        lm.callback_user_shares(user, ns[0], user_shares)

                    return [total_x, total_y]
                ```

        === "Commit `b0240d8` — Sep 8, 2024"

            The following source code includes all changes up to commit hash [`b0240d8`](https://github.com/curvefi/curve-stablecoin/tree/b0240d844c9e60fdab78b481a556a187ceee3721); any changes made after this commit are not included.

            This implementation was used for [Optimism](../deployments/lending.md#logos-optimism-optimism) and [Fraxtal](../deployments/lending.md#logos-fraxtal-fraxtal) lending deployments.

            === "Controller.vy"

                ```vyper
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

                approval: public(HashMap[address, HashMap[address, bool]])

                @external
                @nonreentrant('lock')
                def remove_collateral(collateral: uint256, _for: address = msg.sender):
                    """
                    @notice Remove some collateral without repaying the debt
                    @param collateral Amount of collateral to remove
                    @param _for Address to remove collateral for
                    """
                    if collateral == 0:
                        return
                    assert self._check_approval(_for)
                    self._add_collateral_borrow(collateral, 0, _for, True)
                    self.transferFrom(COLLATERAL_TOKEN, AMM.address, _for, collateral)
                    self._save_rate()

                @internal
                @view
                def _check_approval(_for: address) -> bool:
                    return msg.sender == _for or self.approval[_for][msg.sender]

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
                    n1: int256 = self._calculate_debt_n1(xy[1], debt, size, _for)
                    n2: int256 = n1 + unsafe_sub(ns[1], ns[0])

                    AMM.deposit_range(_for, xy[1], n1, n2)
                    self.loan[_for] = Loan({initial_debt: debt, rate_mul: rate_mul})

                    liquidation_discount: uint256 = 0
                    if _for == msg.sender:
                        liquidation_discount = self.liquidation_discount
                        self.liquidation_discounts[_for] = liquidation_discount
                    else:
                        liquidation_discount = self.liquidation_discounts[_for]

                    if d_debt != 0:
                        self._total_debt.initial_debt = self._total_debt.initial_debt * rate_mul / self._total_debt.rate_mul + d_debt
                        self._total_debt.rate_mul = rate_mul

                    if remove_collateral:
                        log RemoveCollateral(_for, d_collateral)
                    else:
                        log Borrow(_for, d_collateral, d_debt)

                    log UserState(_for, xy[1], debt, n1, n2, liquidation_discount)
                ```

            === "AMM.vy"

                ```vyper
                event Withdraw:
                    provider: indexed(address)
                    amount_borrowed: uint256
                    amount_collateral: uint256

                @external
                @nonreentrant('lock')
                def withdraw(user: address, frac: uint256) -> uint256[2]:
                    """
                    @notice Withdraw liquidity for the user. Only admin contract can do it
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
                    old_max_band: int256 = self.max_band
                    max_band: int256 = n - 1

                    for i in range(MAX_TICKS):
                        x: uint256 = self.bands_x[n]
                        y: uint256 = self.bands_y[n]
                        ds: uint256 = unsafe_div(frac * user_shares[i], 10**18)
                        user_shares[i] = unsafe_sub(user_shares[i], ds)  # Can ONLY zero out when frac == 10**18
                        s: uint256 = self.total_shares[n]
                        new_shares: uint256 = s - ds
                        self.total_shares[n] = new_shares
                        s += DEAD_SHARES  # after this s is guaranteed to be bigger than 0
                        dx: uint256 = unsafe_div((x + 1) * ds, s)
                        dy: uint256 = unsafe_div((y + 1) * ds, s)

                        x -= dx
                        y -= dy

                        # If withdrawal is the last one - transfer dust to admin fees
                        if new_shares == 0:
                            if x > 0:
                                self.admin_fees_x += unsafe_div(x, BORROWED_PRECISION)
                            if y > 0:
                                self.admin_fees_y += unsafe_div(y, COLLATERAL_PRECISION)
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

                    if lm.address != empty(address):
                        lm.callback_collateral_shares(0, [])  # collateral/shares ratio is unchanged
                        lm.callback_user_shares(user, ns[0], user_shares)

                    return [total_x, total_y]
                ```

    === "Example"

        ```shell
        >>> Controller.remove_collateral(10**18, False)

        >>> Controller.user_state(trader)
        [1000000000000000000, 0, 1000001403805330760116, 10]
        # [collateral, stablecoin, debt, bands]
        ```


### `borrow_more`
!!! description "`Controller.borrow_more(collateral: uint256, debt: uint256, _for: address = msg.sender)`"

    Function to borrow more assets while adding more collateral (not necessary).

    Emits: `UserState` and `Borrow`

    | Input        | Type      | Description                      |
    | ------------ | --------- | -------------------------------- |
    | `collateral` | `uint256` | Amount of collateral to add      |
    | `debt`       | `uint256` | Amount of debt to take           |
    | `_for`       | `address` | Address to borrow for (requires approval); only available in new implementation |

    ??? quote "Source code"

        === "Commit `58289a4` — May 10, 2024"

            The following source code includes all changes up to commit hash [`58289a4`](https://github.com/curvefi/curve-stablecoin/tree/`58289a4`283d7cc3c53aba2d3801dcac5ef124957); any changes made after this commit are not included.

            === "Controller.vy"

                ```vyper
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
                    self.minted += debt
                    self.transferFrom(COLLATERAL_TOKEN, msg.sender, AMM.address, collateral)
                    self.transfer(BORROWED_TOKEN, msg.sender, debt)
                    self._save_rate()

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

                    liquidation_discount: uint256 = 0
                    if _for == msg.sender:
                        liquidation_discount = self.liquidation_discount
                        self.liquidation_discounts[_for] = liquidation_discount
                    else:
                        liquidation_discount = self.liquidation_discounts[_for]

                    if d_debt != 0:
                        self._total_debt.initial_debt = self._total_debt.initial_debt * rate_mul / self._total_debt.rate_mul + d_debt
                        self._total_debt.rate_mul = rate_mul

                    if remove_collateral:
                        log RemoveCollateral(_for, d_collateral)
                    else:
                        log Borrow(_for, d_collateral, d_debt)

                    log UserState(_for, xy[1], debt, n1, n2, liquidation_discount)
                ```

            === "AMM.vy"

                ```vyper
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

                    n_bands: uint256 = unsafe_add(convert(unsafe_sub(n2, n1), uint256), 1)
                    assert n_bands <= MAX_TICKS_UINT

                    y_per_band: uint256 = unsafe_div(amount * COLLATERAL_PRECISION, n_bands)
                    assert y_per_band > 100, "Amount too low"

                    assert self.user_shares[user].ticks[0] == 0  # dev: User must have no liquidity
                    self.user_shares[user].ns = unsafe_add(n1, unsafe_mul(n2, 2**128))

                    lm: LMGauge = self.liquidity_mining_callback

                    # Autoskip bands if we can
                    for i in range(MAX_SKIP_TICKS + 1):
                        if n1 > n0:
                            if i != 0:
                                self.active_band = n0
                            break
                        assert self.bands_x[n0] == 0 and i < MAX_SKIP_TICKS, "Deposit below current band"
                        n0 -= 1

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

                    log Deposit(user, amount, n1, n2)

                    if lm.address != empty(address):
                        lm.callback_collateral_shares(n1, collateral_shares)
                        lm.callback_user_shares(user, n1, user_shares)
                ```

        === "Commit `b0240d8` — Sep 8, 2024"

            The following source code includes all changes up to commit hash [`b0240d8`](https://github.com/curvefi/curve-stablecoin/tree/b0240d844c9e60fdab78b481a556a187ceee3721); any changes made after this commit are not included.

            This implementation was used for [Optimism](../deployments/lending.md#logos-optimism-optimism) and [Fraxtal](../deployments/lending.md#logos-fraxtal-fraxtal) lending deployments.

            === "Controller.vy"

                ```vyper
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

                approval: public(HashMap[address, HashMap[address, bool]])

                @external
                @nonreentrant('lock')
                def borrow_more(collateral: uint256, debt: uint256, _for: address = msg.sender):
                    """
                    @notice Borrow more stablecoins while adding more collateral (not necessary)
                    @param collateral Amount of collateral to add
                    @param debt Amount of stablecoin debt to take
                    @param _for Address to borrow for
                    """
                    if debt == 0:
                        return
                    assert self._check_approval(_for)
                    self._add_collateral_borrow(collateral, debt, _for, False)
                    self.minted += debt
                    self.transferFrom(COLLATERAL_TOKEN, msg.sender, AMM.address, collateral)
                    self.transfer(BORROWED_TOKEN, _for, debt)
                    self._save_rate()

                @internal
                @view
                def _check_approval(_for: address) -> bool:
                    return msg.sender == _for or self.approval[_for][msg.sender]

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
                    n1: int256 = self._calculate_debt_n1(xy[1], debt, size, _for)
                    n2: int256 = n1 + unsafe_sub(ns[1], ns[0])

                    AMM.deposit_range(_for, xy[1], n1, n2)
                    self.loan[_for] = Loan({initial_debt: debt, rate_mul: rate_mul})

                    liquidation_discount: uint256 = 0
                    if _for == msg.sender:
                        liquidation_discount = self.liquidation_discount
                        self.liquidation_discounts[_for] = liquidation_discount
                    else:
                        liquidation_discount = self.liquidation_discounts[_for]

                    if d_debt != 0:
                        self._total_debt.initial_debt = self._total_debt.initial_debt * rate_mul / self._total_debt.rate_mul + d_debt
                        self._total_debt.rate_mul = rate_mul

                    if remove_collateral:
                        log RemoveCollateral(_for, d_collateral)
                    else:
                        log Borrow(_for, d_collateral, d_debt)

                    log UserState(_for, xy[1], debt, n1, n2, liquidation_discount)
                ```

            === "AMM.vy"

                ```vyper
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

                    n_bands: uint256 = unsafe_add(convert(unsafe_sub(n2, n1), uint256), 1)
                    assert n_bands <= MAX_TICKS_UINT

                    y_per_band: uint256 = unsafe_div(amount * COLLATERAL_PRECISION, n_bands)
                    assert y_per_band > 100, "Amount too low"

                    assert self.user_shares[user].ticks[0] == 0  # dev: User must have no liquidity
                    self.user_shares[user].ns = unsafe_add(n1, unsafe_mul(n2, 2**128))

                    lm: LMGauge = self.liquidity_mining_callback

                    # Autoskip bands if we can
                    for i in range(MAX_SKIP_TICKS + 1):
                        if n1 > n0:
                            if i != 0:
                                self.active_band = n0
                            break
                        assert self.bands_x[n0] == 0 and i < MAX_SKIP_TICKS, "Deposit below current band"
                        n0 -= 1

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

                    log Deposit(user, amount, n1, n2)

                    if lm.address != empty(address):
                        lm.callback_collateral_shares(n1, collateral_shares)
                        lm.callback_user_shares(user, n1, user_shares)
                ```

    === "Example"

        ```shell
        >>> Controller.borrow_more(10**18, 10**22)

        >>> Controller.user_state(trader)
        [2000000000000000000, 0, 11000001592726154783594, 10]
        # [collateral, stablecoin, debt, bands]
        ```


### `borrow_more_extended`
!!! description "`Controller.borrow_more_extended(collateral: uint256, debt: uint256, callbacker: address, callback_args: DynArray[uint256,5], callback_bytes: Bytes[10**4] = b"", _for: address = msg.sender)`"

    Function to borrow more assets while adding more collateral. This method uses callbacks to build up leverage. Earlier implementations of the contract did not have `callback_bytes` argument. This was added to enable [leveraging/de-leveraging using the 1inch router](./leverage/LeverageZap1inch.md#building-leverage).

    Emits: `UserState` and `Borrow`

    | Input            | Type                  | Description                      |
    | ---------------- | --------------------- | -------------------------------- |
    | `collateral`     | `uint256`             | Amount of collateral to add      |
    | `debt`           | `uint256`             | Amount of debt to take           |
    | `callbacker`    | `address`             | Address of the callback contract  |
    | `debt`           | `DynArray[uint256,5]` | Amount of debt to take on  |
    | `callback_args` | `DynArray[uint256,5]` | Extra arguments for the callback (up to 5), such as `min_amount`, etc; see [`LeverageZap1inch.vy`](./leverage/LeverageZap1inch.md) for more information |
    | `callback_bytes` | `Bytes[10**4]`        | Callback bytes passed to the LeverageZap. Defaults to `b""` |
    | `_for`       | `address` | Address to borrow for (requires approval); only available in new implementation |

    ??? quote "Source code"

        === "Commit `58289a4` — May 10, 2024"

            The following source code includes all changes up to commit hash [`58289a4`](https://github.com/curvefi/curve-stablecoin/tree/`58289a4`283d7cc3c53aba2d3801dcac5ef124957); any changes made after this commit are not included.

            === "Controller.vy"

                ```vyper
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

                @external
                @nonreentrant('lock')
                def borrow_more_extended(collateral: uint256, debt: uint256, callbacker: address, callback_args: DynArray[uint256,5], callback_bytes: Bytes[10**4] = b""):
                    """
                    @notice Borrow more stablecoins while adding more collateral using a callback (to leverage more)
                    @param collateral Amount of collateral to add
                    @param debt Amount of stablecoin debt to take
                    @param callbacker Address of the callback contract
                    @param callback_args Extra arguments for the callback (up to 5) such as min_amount etc
                    """
                    if debt == 0:
                        return

                    # Before callback
                    self.transfer(BORROWED_TOKEN, callbacker, debt)

                    # For compatibility
                    callback_sig: bytes4 = CALLBACK_DEPOSIT_WITH_BYTES
                    if callback_bytes == b"":
                        callback_sig = CALLBACK_DEPOSIT
                    # Callback
                    # If there is any unused debt, callbacker can send it to the user
                    more_collateral: uint256 = self.execute_callback(
                        callbacker, callback_sig, msg.sender, 0, collateral, debt, callback_args, callback_bytes).collateral

                    # After callback
                    self._add_collateral_borrow(collateral + more_collateral, debt, msg.sender, False)
                    self.minted += debt
                    self.transferFrom(COLLATERAL_TOKEN, msg.sender, AMM.address, collateral)
                    self.transferFrom(COLLATERAL_TOKEN, callbacker, AMM.address, more_collateral)
                    self._save_rate()

                @internal
                def execute_callback(callbacker: address, callback_sig: bytes4,
                                    user: address, stablecoins: uint256, collateral: uint256, debt: uint256,
                                    callback_args: DynArray[uint256, 5], callback_bytes: Bytes[10**4]) -> CallbackData:
                    assert callbacker != COLLATERAL_TOKEN.address

                    data: CallbackData = empty(CallbackData)
                    data.active_band = AMM.active_band()
                    band_x: uint256 = AMM.bands_x(data.active_band)
                    band_y: uint256 = AMM.bands_y(data.active_band)

                    # Callback
                    response: Bytes[64] = raw_call(
                        callbacker,
                        concat(callback_sig, _abi_encode(user, stablecoins, collateral, debt, callback_args, callback_bytes)),
                        max_outsize=64
                    )
                    data.stablecoins = convert(slice(response, 0, 32), uint256)
                    data.collateral = convert(slice(response, 32, 32), uint256)

                    # Checks after callback
                    assert data.active_band == AMM.active_band()
                    assert band_x == AMM.bands_x(data.active_band)
                    assert band_y == AMM.bands_y(data.active_band)

                    return data

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

                    liquidation_discount: uint256 = 0
                    if _for == msg.sender:
                        liquidation_discount = self.liquidation_discount
                        self.liquidation_discounts[_for] = liquidation_discount
                    else:
                        liquidation_discount = self.liquidation_discounts[_for]

                    if d_debt != 0:
                        self._total_debt.initial_debt = self._total_debt.initial_debt * rate_mul / self._total_debt.rate_mul + d_debt
                        self._total_debt.rate_mul = rate_mul

                    if remove_collateral:
                        log RemoveCollateral(_for, d_collateral)
                    else:
                        log Borrow(_for, d_collateral, d_debt)

                    log UserState(_for, xy[1], debt, n1, n2, liquidation_discount)
                ```

            === "AMM.vy"

                ```vyper
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

                    n_bands: uint256 = unsafe_add(convert(unsafe_sub(n2, n1), uint256), 1)
                    assert n_bands <= MAX_TICKS_UINT

                    y_per_band: uint256 = unsafe_div(amount * COLLATERAL_PRECISION, n_bands)
                    assert y_per_band > 100, "Amount too low"

                    assert self.user_shares[user].ticks[0] == 0  # dev: User must have no liquidity
                    self.user_shares[user].ns = unsafe_add(n1, unsafe_mul(n2, 2**128))

                    lm: LMGauge = self.liquidity_mining_callback

                    # Autoskip bands if we can
                    for i in range(MAX_SKIP_TICKS + 1):
                        if n1 > n0:
                            if i != 0:
                                self.active_band = n0
                            break
                        assert self.bands_x[n0] == 0 and i < MAX_SKIP_TICKS, "Deposit below current band"
                        n0 -= 1

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

                    log Deposit(user, amount, n1, n2)

                    if lm.address != empty(address):
                        lm.callback_collateral_shares(n1, collateral_shares)
                        lm.callback_user_shares(user, n1, user_shares)
                ```

        === "Commit `b0240d8` — Sep 8, 2024"

            The following source code includes all changes up to commit hash [`b0240d8`](https://github.com/curvefi/curve-stablecoin/tree/b0240d844c9e60fdab78b481a556a187ceee3721); any changes made after this commit are not included.

            This implementation was used for [Optimism](../deployments/lending.md#logos-optimism-optimism) and [Fraxtal](../deployments/lending.md#logos-fraxtal-fraxtal) lending deployments.

            === "Controller.vy"

                ```vyper
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

                approval: public(HashMap[address, HashMap[address, bool]])

                @external
                @nonreentrant('lock')
                def borrow_more_extended(collateral: uint256, debt: uint256, callbacker: address, callback_args: DynArray[uint256,5], callback_bytes: Bytes[10**4] = b"", _for: address = msg.sender):
                    """
                    @notice Borrow more stablecoins while adding more collateral using a callback (to leverage more)
                    @param collateral Amount of collateral to add
                    @param debt Amount of stablecoin debt to take
                    @param callbacker Address of the callback contract
                    @param callback_args Extra arguments for the callback (up to 5) such as min_amount etc
                    @param _for Address to borrow for
                    """
                    if debt == 0:
                        return
                    assert self._check_approval(_for)

                    # Before callback
                    self.transfer(BORROWED_TOKEN, callbacker, debt)

                    # For compatibility
                    callback_sig: bytes4 = CALLBACK_DEPOSIT_WITH_BYTES
                    if callback_bytes == b"":
                        callback_sig = CALLBACK_DEPOSIT
                    # Callback
                    # If there is any unused debt, callbacker can send it to the user
                    more_collateral: uint256 = self.execute_callback(
                        callbacker, callback_sig, _for, 0, collateral, debt, callback_args, callback_bytes).collateral

                    # After callback
                    self._add_collateral_borrow(collateral + more_collateral, debt, _for, False)
                    self.minted += debt
                    self.transferFrom(COLLATERAL_TOKEN, msg.sender, AMM.address, collateral)
                    self.transferFrom(COLLATERAL_TOKEN, callbacker, AMM.address, more_collateral)
                    self._save_rate()

                @internal
                @view
                def _check_approval(_for: address) -> bool:
                    return msg.sender == _for or self.approval[_for][msg.sender]

                @internal
                def execute_callback(callbacker: address, callback_sig: bytes4,
                                    user: address, stablecoins: uint256, collateral: uint256, debt: uint256,
                                    callback_args: DynArray[uint256, 5], callback_bytes: Bytes[10**4]) -> CallbackData:
                    assert callbacker != COLLATERAL_TOKEN.address
                    assert callbacker != BORROWED_TOKEN.address

                    data: CallbackData = empty(CallbackData)
                    data.active_band = AMM.active_band()
                    band_x: uint256 = AMM.bands_x(data.active_band)
                    band_y: uint256 = AMM.bands_y(data.active_band)

                    # Callback
                    response: Bytes[64] = raw_call(
                        callbacker,
                        concat(callback_sig, _abi_encode(user, stablecoins, collateral, debt, callback_args, callback_bytes)),
                        max_outsize=64
                    )
                    data.stablecoins = convert(slice(response, 0, 32), uint256)
                    data.collateral = convert(slice(response, 32, 32), uint256)

                    # Checks after callback
                    assert data.active_band == AMM.active_band()
                    assert band_x == AMM.bands_x(data.active_band)
                    assert band_y == AMM.bands_y(data.active_band)

                    return data

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
                    n1: int256 = self._calculate_debt_n1(xy[1], debt, size, _for)
                    n2: int256 = n1 + unsafe_sub(ns[1], ns[0])

                    AMM.deposit_range(_for, xy[1], n1, n2)
                    self.loan[_for] = Loan({initial_debt: debt, rate_mul: rate_mul})

                    liquidation_discount: uint256 = 0
                    if _for == msg.sender:
                        liquidation_discount = self.liquidation_discount
                        self.liquidation_discounts[_for] = liquidation_discount
                    else:
                        liquidation_discount = self.liquidation_discounts[_for]

                    if d_debt != 0:
                        self._total_debt.initial_debt = self._total_debt.initial_debt * rate_mul / self._total_debt.rate_mul + d_debt
                        self._total_debt.rate_mul = rate_mul

                    if remove_collateral:
                        log RemoveCollateral(_for, d_collateral)
                    else:
                        log Borrow(_for, d_collateral, d_debt)

                    log UserState(_for, xy[1], debt, n1, n2, liquidation_discount)
                ```

            === "AMM.vy"

                ```vyper
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

                    n_bands: uint256 = unsafe_add(convert(unsafe_sub(n2, n1), uint256), 1)
                    assert n_bands <= MAX_TICKS_UINT

                    y_per_band: uint256 = unsafe_div(amount * COLLATERAL_PRECISION, n_bands)
                    assert y_per_band > 100, "Amount too low"

                    assert self.user_shares[user].ticks[0] == 0  # dev: User must have no liquidity
                    self.user_shares[user].ns = unsafe_add(n1, unsafe_mul(n2, 2**128))

                    lm: LMGauge = self.liquidity_mining_callback

                    # Autoskip bands if we can
                    for i in range(MAX_SKIP_TICKS + 1):
                        if n1 > n0:
                            if i != 0:
                                self.active_band = n0
                            break
                        assert self.bands_x[n0] == 0 and i < MAX_SKIP_TICKS, "Deposit below current band"
                        n0 -= 1

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

                    log Deposit(user, amount, n1, n2)

                    if lm.address != empty(address):
                        lm.callback_collateral_shares(n1, collateral_shares)
                        lm.callback_user_shares(user, n1, user_shares)
                ```


### `health_calculator`
!!! description "`Controller.health_calculator(user: address, d_collateral: int256, d_debt: int256, full: bool, N: uint256 = 0) -> int256`"

    Function to predict the health of `user` after changing collateral by `d_collateral` and/or debt by `d_debt`.

    Returns: health (`int256`).

    | Input          | Type      | Description                                  |
    | -------------- | --------- | -------------------------------------------- |
    | `user`         | `address` | Address of the user                          |
    | `d_collateral` | `int256`  | Change in collateral amount                  |
    | `d_debt`       | `int256`  | Change in debt amount                        |
    | `full`         | `bool`    | Weather to take into account the price difference above the highest user's band |
    | `N`            | `uint256` | Number of bands in case loan does not exist yet  |

    ??? quote "Source code"

        === "Commit `58289a4` — May 10, 2024"

            The following source code includes all changes up to commit hash [`58289a4`](https://github.com/curvefi/curve-stablecoin/tree/`58289a4`283d7cc3c53aba2d3801dcac5ef124957); any changes made after this commit are not included.

            === "Controller.vy"

                ```vyper
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
                    debt: int256 = convert(self._debt(user)[0], int256)
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

                    if ns[0] > active_band:  # re-deposit
                        collateral = convert(AMM.get_sum_xy(user)[1], int256) + d_collateral
                        n1 = self._calculate_debt_n1(convert(collateral, uint256), convert(debt, uint256), n)
                        collateral *= convert(COLLATERAL_PRECISION, int256)  # now has 18 decimals
                    else:
                        n1 = ns[0]
                        x_eff = convert(AMM.get_x_down(user) * unsafe_mul(10**18, BORROWED_PRECISION), int256)

                    debt *= convert(BORROWED_PRECISION, int256)

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

        === "Commit `b0240d8` — Sep 8, 2024"

            The following source code includes all changes up to commit hash [`b0240d8`](https://github.com/curvefi/curve-stablecoin/tree/b0240d844c9e60fdab78b481a556a187ceee3721); any changes made after this commit are not included.

            This implementation was used for [Optimism](../deployments/lending.md#logos-optimism-optimism) and [Fraxtal](../deployments/lending.md#logos-fraxtal-fraxtal) lending deployments.

            === "Controller.vy"

                ```vyper
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
                    debt: int256 = convert(self._debt(user)[0], int256)
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

                    if ns[0] > active_band:  # re-deposit
                        collateral = convert(AMM.get_sum_xy(user)[1], int256) + d_collateral
                        n1 = self._calculate_debt_n1(convert(collateral, uint256), convert(debt, uint256), n, user)
                        collateral *= convert(COLLATERAL_PRECISION, int256)  # now has 18 decimals
                    else:
                        n1 = ns[0]
                        x_eff = convert(AMM.get_x_down(user) * unsafe_mul(10**18, BORROWED_PRECISION), int256)

                    debt *= convert(BORROWED_PRECISION, int256)

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

        This example shows the calculated health based on changes in collateral and borrowed assets. For instance, in the first example, the predicted health is calculated by adding 1 WBTC as collateral and taking on an additional 10,000 crvUSD in debt.

        ```shell
        >>> Controller.health_calculator(trader, 10**18, 10**22, True, 0)
        5026488624797598934

        >>> Controller.health_calculator(trader, 10**18, 10**22, False, 0)
        40995665483999083
        ```


### `liquidate`
!!! description "`Controller.liquidate(user: address, min_x: uint256, use_eth: bool = True)`"

    Function to perform a bad liquidation (or self-liquidation) of `user` if `health` is not good.

    Emits: `UserState`, `Repay`, and `Liquidate`

    | Input    | Type      | Description                                                          |
    | -------- | --------- | -------------------------------------------------------------------- |
    | `user`   | `address` | Address to be liquidated                                             |
    | `min_x`  | `uint256` | Minimal amount of asset to receive (to avoid liquidators being sandwiched) |
    | `use_eth`| `bool`    | Use wrapping/unwrapping if collateral is ETH                        |

    ??? quote "Source code"

        === "Commit `58289a4` — May 10, 2024"

            The following source code includes all changes up to commit hash [`58289a4`](https://github.com/curvefi/curve-stablecoin/tree/`58289a4`283d7cc3c53aba2d3801dcac5ef124957); any changes made after this commit are not included.

            === "Controller.vy"

                ```vyper
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

                @external
                @nonreentrant('lock')
                def liquidate(user: address, min_x: uint256, use_eth: bool = True):
                    """
                    @notice perform a bad liquidation (or self-liquidation) of user if health is not good
                    @param min_x Minimal amount of stablecoin to receive (to avoid liquidators being sandwiched)
                    @param use_eth Use wrapping/unwrapping if collateral is ETH
                    """
                    discount: uint256 = 0
                    if user != msg.sender:
                        discount = self.liquidation_discounts[user]
                    self._liquidate(user, min_x, discount, 10**18, use_eth, empty(address), [])

                @internal
                def _liquidate(user: address, min_x: uint256, health_limit: uint256, frac: uint256,
                            callbacker: address, callback_args: DynArray[uint256,5], callback_bytes: Bytes[10**4] = b""):
                    """
                    @notice Perform a bad liquidation of user if the health is too bad
                    @param user Address of the user
                    @param min_x Minimal amount of stablecoin withdrawn (to avoid liquidators being sandwiched)
                    @param health_limit Minimal health to liquidate at
                    @param frac Fraction to liquidate; 100% = 10**18
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
                    xy: uint256[2] = AMM.withdraw(user, self._get_f_remove(frac, health_limit))  # [stable, collateral]

                    # x increase in same block -> price up -> good
                    # x decrease in same block -> price down -> bad
                    assert xy[0] >= min_x, "Slippage"

                    min_amm_burn: uint256 = min(xy[0], debt)
                    self.transferFrom(BORROWED_TOKEN, AMM.address, self, min_amm_burn)

                    if debt > xy[0]:
                        to_repay: uint256 = unsafe_sub(debt, xy[0])

                        if callbacker == empty(address):
                            # Withdraw collateral if no callback is present
                            self.transferFrom(COLLATERAL_TOKEN, AMM.address, msg.sender, xy[1])
                            # Request what's left from user
                            self.transferFrom(BORROWED_TOKEN, msg.sender, self, to_repay)

                        else:
                            # Move collateral to callbacker, call it and remove everything from it back in
                            self.transferFrom(COLLATERAL_TOKEN, AMM.address, callbacker, xy[1])
                            # For compatibility
                            callback_sig: bytes4 = CALLBACK_LIQUIDATE_WITH_BYTES
                            if callback_bytes == b"":
                                callback_sig = CALLBACK_LIQUIDATE
                            # Callback
                            cb: CallbackData = self.execute_callback(
                                callbacker, callback_sig, user, xy[0], xy[1], debt, callback_args, callback_bytes)
                            assert cb.stablecoins >= to_repay, "not enough proceeds"
                            if cb.stablecoins > to_repay:
                                self.transferFrom(BORROWED_TOKEN, callbacker, msg.sender, unsafe_sub(cb.stablecoins, to_repay))
                            self.transferFrom(BORROWED_TOKEN, callbacker, self, to_repay)
                            self.transferFrom(COLLATERAL_TOKEN, callbacker, msg.sender, cb.collateral)

                    else:
                        # Withdraw collateral
                        self.transferFrom(COLLATERAL_TOKEN, AMM.address, msg.sender, xy[1])
                        # Return what's left to user
                        if xy[0] > debt:
                            self.transferFrom(BORROWED_TOKEN, AMM.address, msg.sender, unsafe_sub(xy[0], debt))

                    self.redeemed += debt
                    self.loan[user] = Loan({initial_debt: final_debt, rate_mul: rate_mul})
                    log Repay(user, xy[1], debt)
                    log Liquidate(msg.sender, user, xy[1], xy[0], debt)
                    if final_debt == 0:
                        log UserState(user, 0, 0, 0, 0, 0)  # Not logging partial removal b/c we have not enough info
                        self._remove_from_list(user)

                    d: uint256 = self._total_debt.initial_debt * rate_mul / self._total_debt.rate_mul
                    self._total_debt.initial_debt = unsafe_sub(max(d, debt), debt)
                    self._total_debt.rate_mul = rate_mul

                    self._save_rate()
                ```

            === "AMM.vy"

                ```vyper
                event Withdraw:
                    provider: indexed(address)
                    amount_borrowed: uint256
                    amount_collateral: uint256

                @external
                @nonreentrant('lock')
                def withdraw(user: address, frac: uint256) -> uint256[2]:
                    """
                    @notice Withdraw liquidity for the user. Only admin contract can do it
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
                    old_max_band: int256 = self.max_band
                    max_band: int256 = n - 1

                    for i in range(MAX_TICKS):
                        x: uint256 = self.bands_x[n]
                        y: uint256 = self.bands_y[n]
                        ds: uint256 = unsafe_div(frac * user_shares[i], 10**18)
                        user_shares[i] = unsafe_sub(user_shares[i], ds)  # Can ONLY zero out when frac == 10**18
                        s: uint256 = self.total_shares[n]
                        new_shares: uint256 = s - ds
                        self.total_shares[n] = new_shares
                        s += DEAD_SHARES  # after this s is guaranteed to be bigger than 0
                        dx: uint256 = unsafe_div((x + 1) * ds, s)
                        dy: uint256 = unsafe_div((y + 1) * ds, s)

                        x -= dx
                        y -= dy

                        # If withdrawal is the last one - transfer dust to admin fees
                        if new_shares == 0:
                            if x > 0:
                                self.admin_fees_x += unsafe_div(x, BORROWED_PRECISION)
                            if y > 0:
                                self.admin_fees_y += unsafe_div(y, COLLATERAL_PRECISION)
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

                    if lm.address != empty(address):
                        lm.callback_collateral_shares(0, [])  # collateral/shares ratio is unchanged
                        lm.callback_user_shares(user, ns[0], user_shares)

                    return [total_x, total_y]
                ```

        === "Commit `b0240d8` — Sep 8, 2024"

            The following source code includes all changes up to commit hash [`b0240d8`](https://github.com/curvefi/curve-stablecoin/tree/b0240d844c9e60fdab78b481a556a187ceee3721); any changes made after this commit are not included.

            This implementation was used for [Optimism](../deployments/lending.md#logos-optimism-optimism) and [Fraxtal](../deployments/lending.md#logos-fraxtal-fraxtal) lending deployments.

            === "Controller.vy"

                ```vyper
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

                @external
                @nonreentrant('lock')
                def liquidate(user: address, min_x: uint256, use_eth: bool = True):
                    """
                    @notice Perform a bad liquidation (or self-liquidation) of user if health is not good
                    @param min_x Minimal amount of stablecoin to receive (to avoid liquidators being sandwiched)
                    @param use_eth Use wrapping/unwrapping if collateral is ETH
                    """
                    discount: uint256 = 0
                    if user != msg.sender:
                        discount = self.liquidation_discounts[user]
                    self._liquidate(user, min_x, discount, 10**18, use_eth, empty(address), [])

                @internal
                def _liquidate(user: address, min_x: uint256, health_limit: uint256, frac: uint256,
                            callbacker: address, callback_args: DynArray[uint256,5], callback_bytes: Bytes[10**4] = b""):
                    """
                    @notice Perform a bad liquidation of user if the health is too bad
                    @param user Address of the user
                    @param min_x Minimal amount of stablecoin withdrawn (to avoid liquidators being sandwiched)
                    @param health_limit Minimal health to liquidate at
                    @param frac Fraction to liquidate; 100% = 10**18
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
                    xy: uint256[2] = AMM.withdraw(user, self._get_f_remove(frac, health_limit))  # [stable, collateral]

                    # x increase in same block -> price up -> good
                    # x decrease in same block -> price down -> bad
                    assert xy[0] >= min_x, "Slippage"

                    min_amm_burn: uint256 = min(xy[0], debt)
                    self.transferFrom(BORROWED_TOKEN, AMM.address, self, min_amm_burn)

                    if debt > xy[0]:
                        to_repay: uint256 = unsafe_sub(debt, xy[0])

                        if callbacker == empty(address):
                            # Withdraw collateral if no callback is present
                            self.transferFrom(COLLATERAL_TOKEN, AMM.address, msg.sender, xy[1])
                            # Request what's left from user
                            self.transferFrom(BORROWED_TOKEN, msg.sender, self, to_repay)

                        else:
                            # Move collateral to callbacker, call it and remove everything from it back in
                            self.transferFrom(COLLATERAL_TOKEN, AMM.address, callbacker, xy[1])
                            # For compatibility
                            callback_sig: bytes4 = CALLBACK_LIQUIDATE_WITH_BYTES
                            if callback_bytes == b"":
                                callback_sig = CALLBACK_LIQUIDATE
                            # Callback
                            cb: CallbackData = self.execute_callback(
                                callbacker, callback_sig, user, xy[0], xy[1], debt, callback_args, callback_bytes)
                            assert cb.stablecoins >= to_repay, "not enough proceeds"
                            if cb.stablecoins > to_repay:
                                self.transferFrom(BORROWED_TOKEN, callbacker, msg.sender, unsafe_sub(cb.stablecoins, to_repay))
                            self.transferFrom(BORROWED_TOKEN, callbacker, self, to_repay)
                            self.transferFrom(COLLATERAL_TOKEN, callbacker, msg.sender, cb.collateral)

                    else:
                        # Withdraw collateral
                        self.transferFrom(COLLATERAL_TOKEN, AMM.address, msg.sender, xy[1])
                        # Return what's left to user
                        if xy[0] > debt:
                            self.transferFrom(BORROWED_TOKEN, AMM.address, msg.sender, unsafe_sub(xy[0], debt))

                    self.redeemed += debt
                    self.loan[user] = Loan({initial_debt: final_debt, rate_mul: rate_mul})
                    log Repay(user, xy[1], debt)
                    log Liquidate(msg.sender, user, xy[1], xy[0], debt)
                    if final_debt == 0:
                        log UserState(user, 0, 0, 0, 0, 0)  # Not logging partial removal b/c we have not enough info
                        self._remove_from_list(user)

                    d: uint256 = self._total_debt.initial_debt * rate_mul / self._total_debt.rate_mul
                    self._total_debt.initial_debt = unsafe_sub(max(d, debt), debt)
                    self._total_debt.rate_mul = rate_mul

                    self._save_rate()
                ```

            === "AMM.vy"

                ```vyper
                event Withdraw:
                    provider: indexed(address)
                    amount_borrowed: uint256
                    amount_collateral: uint256

                @external
                @nonreentrant('lock')
                def withdraw(user: address, frac: uint256) -> uint256[2]:
                    """
                    @notice Withdraw liquidity for the user. Only admin contract can do it
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
                    old_max_band: int256 = self.max_band
                    max_band: int256 = n - 1

                    for i in range(MAX_TICKS):
                        x: uint256 = self.bands_x[n]
                        y: uint256 = self.bands_y[n]
                        ds: uint256 = unsafe_div(frac * user_shares[i], 10**18)
                        user_shares[i] = unsafe_sub(user_shares[i], ds)  # Can ONLY zero out when frac == 10**18
                        s: uint256 = self.total_shares[n]
                        new_shares: uint256 = s - ds
                        self.total_shares[n] = new_shares
                        s += DEAD_SHARES  # after this s is guaranteed to be bigger than 0
                        dx: uint256 = unsafe_div((x + 1) * ds, s)
                        dy: uint256 = unsafe_div((y + 1) * ds, s)

                        x -= dx
                        y -= dy

                        # If withdrawal is the last one - transfer dust to admin fees
                        if new_shares == 0:
                            if x > 0:
                                self.admin_fees_x += unsafe_div(x, BORROWED_PRECISION)
                            if y > 0:
                                self.admin_fees_y += unsafe_div(y, COLLATERAL_PRECISION)
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

                    if lm.address != empty(address):
                        lm.callback_collateral_shares(0, [])  # collateral/shares ratio is unchanged
                        lm.callback_user_shares(user, ns[0], user_shares)

                    return [total_x, total_y]
                ```

    === "Example"
        ```shell
        >>> soon
        ```


### `liquidate_extended`
!!! description "`Controller.liquidate_extended(user: address, min_x: uint256, frac: uint256, callbacker: address, callback_args: DynArray[uint256,5], callback_bytes: Bytes[10**4] = b"")`"

    Extended function to perform a bad liquidation (or self-liquidation) of `user` if `health` is not good using callbacks. Earlier implementations of the contract did not have `callback_bytes` argument. This was added to enable [leveraging/de-leveraging using the 1inch router](./leverage/LeverageZap1inch.md).

    Emits: `Repay` and `Liquidate`

    | Input            | Type                  | Description                                                                |
    | ---------------- | --------------------- | -------------------------------------------------------------------------- |
    | `user`           | `address`             | Address to be liquidated                                                   |
    | `min_x`          | `uint256`             | Minimal amount of assets to receive (to avoid liquidators being sandwiched)  |
    | `frac`           | `uint256`             | Fraction to liquidate; 100% = 10**18                                       |
    | `use_eth`        | `bool`                | Use wrapping/unwrapping if collateral is ETH                              |
    | `callbacker`     | `address`             | Address of the callback contract                                          |
    | `callback_args`  | `DynArray[uint256,5]` | Extra arguments for the callback (up to 5), such as `min_amount`          |
    | `callback_bytes` | `Bytes[10**4]`        | Callback bytes passed to the LeverageZap. Defaults to `b""` |

    ??? quote "Source code"

        === "Commit `58289a4` — May 10, 2024"

            The following source code includes all changes up to commit hash [`58289a4`](https://github.com/curvefi/curve-stablecoin/tree/`58289a4`283d7cc3c53aba2d3801dcac5ef124957); any changes made after this commit are not included.

            === "Controller.vy"

                ```vyper
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

                @external
                @nonreentrant('lock')
                def liquidate_extended(user: address, min_x: uint256, frac: uint256,
                                    callbacker: address, callback_args: DynArray[uint256,5], callback_bytes: Bytes[10**4] = b""):
                    """
                    @notice Perform a bad liquidation (or self-liquidation) of user if health is not good
                    @param min_x Minimal amount of stablecoin to receive (to avoid liquidators being sandwiched)
                    @param frac Fraction to liquidate; 100% = 10**18
                    @param callbacker Address of the callback contract
                    @param callback_args Extra arguments for the callback (up to 5) such as min_amount etc
                    """
                    discount: uint256 = 0
                    if user != msg.sender:
                        discount = self.liquidation_discounts[user]
                    self._liquidate(user, min_x, discount, min(frac, 10**18), callbacker, callback_args, callback_bytes)

                @internal
                def _liquidate(user: address, min_x: uint256, health_limit: uint256, frac: uint256,
                            callbacker: address, callback_args: DynArray[uint256,5], callback_bytes: Bytes[10**4] = b""):
                    """
                    @notice Perform a bad liquidation of user if the health is too bad
                    @param user Address of the user
                    @param min_x Minimal amount of stablecoin withdrawn (to avoid liquidators being sandwiched)
                    @param health_limit Minimal health to liquidate at
                    @param frac Fraction to liquidate; 100% = 10**18
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
                    xy: uint256[2] = AMM.withdraw(user, self._get_f_remove(frac, health_limit))  # [stable, collateral]

                    # x increase in same block -> price up -> good
                    # x decrease in same block -> price down -> bad
                    assert xy[0] >= min_x, "Slippage"

                    min_amm_burn: uint256 = min(xy[0], debt)
                    self.transferFrom(BORROWED_TOKEN, AMM.address, self, min_amm_burn)

                    if debt > xy[0]:
                        to_repay: uint256 = unsafe_sub(debt, xy[0])

                        if callbacker == empty(address):
                            # Withdraw collateral if no callback is present
                            self.transferFrom(COLLATERAL_TOKEN, AMM.address, msg.sender, xy[1])
                            # Request what's left from user
                            self.transferFrom(BORROWED_TOKEN, msg.sender, self, to_repay)

                        else:
                            # Move collateral to callbacker, call it and remove everything from it back in
                            self.transferFrom(COLLATERAL_TOKEN, AMM.address, callbacker, xy[1])
                            # For compatibility
                            callback_sig: bytes4 = CALLBACK_LIQUIDATE_WITH_BYTES
                            if callback_bytes == b"":
                                callback_sig = CALLBACK_LIQUIDATE
                            # Callback
                            cb: CallbackData = self.execute_callback(
                                callbacker, callback_sig, user, xy[0], xy[1], debt, callback_args, callback_bytes)
                            assert cb.stablecoins >= to_repay, "not enough proceeds"
                            if cb.stablecoins > to_repay:
                                self.transferFrom(BORROWED_TOKEN, callbacker, msg.sender, unsafe_sub(cb.stablecoins, to_repay))
                            self.transferFrom(BORROWED_TOKEN, callbacker, self, to_repay)
                            self.transferFrom(COLLATERAL_TOKEN, callbacker, msg.sender, cb.collateral)

                    else:
                        # Withdraw collateral
                        self.transferFrom(COLLATERAL_TOKEN, AMM.address, msg.sender, xy[1])
                        # Return what's left to user
                        if xy[0] > debt:
                            self.transferFrom(BORROWED_TOKEN, AMM.address, msg.sender, unsafe_sub(xy[0], debt))

                    self.redeemed += debt
                    self.loan[user] = Loan({initial_debt: final_debt, rate_mul: rate_mul})
                    log Repay(user, xy[1], debt)
                    log Liquidate(msg.sender, user, xy[1], xy[0], debt)
                    if final_debt == 0:
                        log UserState(user, 0, 0, 0, 0, 0)  # Not logging partial removal b/c we have not enough info
                        self._remove_from_list(user)

                    d: uint256 = self._total_debt.initial_debt * rate_mul / self._total_debt.rate_mul
                    self._total_debt.initial_debt = unsafe_sub(max(d, debt), debt)
                    self._total_debt.rate_mul = rate_mul

                    self._save_rate()
                ```

            === "AMM.vy"

                ```vyper
                event Withdraw:
                    provider: indexed(address)
                    amount_borrowed: uint256
                    amount_collateral: uint256

                @external
                @nonreentrant('lock')
                def withdraw(user: address, frac: uint256) -> uint256[2]:
                    """
                    @notice Withdraw liquidity for the user. Only admin contract can do it
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
                    old_max_band: int256 = self.max_band
                    max_band: int256 = n - 1

                    for i in range(MAX_TICKS):
                        x: uint256 = self.bands_x[n]
                        y: uint256 = self.bands_y[n]
                        ds: uint256 = unsafe_div(frac * user_shares[i], 10**18)
                        user_shares[i] = unsafe_sub(user_shares[i], ds)  # Can ONLY zero out when frac == 10**18
                        s: uint256 = self.total_shares[n]
                        new_shares: uint256 = s - ds
                        self.total_shares[n] = new_shares
                        s += DEAD_SHARES  # after this s is guaranteed to be bigger than 0
                        dx: uint256 = unsafe_div((x + 1) * ds, s)
                        dy: uint256 = unsafe_div((y + 1) * ds, s)

                        x -= dx
                        y -= dy

                        # If withdrawal is the last one - transfer dust to admin fees
                        if new_shares == 0:
                            if x > 0:
                                self.admin_fees_x += unsafe_div(x, BORROWED_PRECISION)
                            if y > 0:
                                self.admin_fees_y += unsafe_div(y, COLLATERAL_PRECISION)
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

                    if lm.address != empty(address):
                        lm.callback_collateral_shares(0, [])  # collateral/shares ratio is unchanged
                        lm.callback_user_shares(user, ns[0], user_shares)

                    return [total_x, total_y]
                ```

        === "Commit `b0240d8` — Sep 8, 2024"

            The following source code includes all changes up to commit hash [`b0240d8`](https://github.com/curvefi/curve-stablecoin/tree/b0240d844c9e60fdab78b481a556a187ceee3721); any changes made after this commit are not included.

            This implementation was used for [Optimism](../deployments/lending.md#logos-optimism-optimism) and [Fraxtal](../deployments/lending.md#logos-fraxtal-fraxtal) lending deployments.

            === "Controller.vy"

                ```vyper
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

                @external
                @nonreentrant('lock')
                def liquidate_extended(user: address, min_x: uint256, frac: uint256,
                                    callbacker: address, callback_args: DynArray[uint256,5], callback_bytes: Bytes[10**4] = b""):
                    """
                    @notice Perform a bad liquidation (or self-liquidation) of user if health is not good
                    @param min_x Minimal amount of stablecoin to receive (to avoid liquidators being sandwiched)
                    @param frac Fraction to liquidate; 100% = 10**18
                    @param callbacker Address of the callback contract
                    @param callback_args Extra arguments for the callback (up to 5) such as min_amount etc
                    """
                    discount: uint256 = 0
                    if user != msg.sender:
                        discount = self.liquidation_discounts[user]
                    self._liquidate(user, min_x, discount, min(frac, 10**18), callbacker, callback_args, callback_bytes)

                @internal
                def _liquidate(user: address, min_x: uint256, health_limit: uint256, frac: uint256,
                            callbacker: address, callback_args: DynArray[uint256,5], callback_bytes: Bytes[10**4] = b""):
                    """
                    @notice Perform a bad liquidation of user if the health is too bad
                    @param user Address of the user
                    @param min_x Minimal amount of stablecoin withdrawn (to avoid liquidators being sandwiched)
                    @param health_limit Minimal health to liquidate at
                    @param frac Fraction to liquidate; 100% = 10**18
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
                    xy: uint256[2] = AMM.withdraw(user, self._get_f_remove(frac, health_limit))  # [stable, collateral]

                    # x increase in same block -> price up -> good
                    # x decrease in same block -> price down -> bad
                    assert xy[0] >= min_x, "Slippage"

                    min_amm_burn: uint256 = min(xy[0], debt)
                    self.transferFrom(BORROWED_TOKEN, AMM.address, self, min_amm_burn)

                    if debt > xy[0]:
                        to_repay: uint256 = unsafe_sub(debt, xy[0])

                        if callbacker == empty(address):
                            # Withdraw collateral if no callback is present
                            self.transferFrom(COLLATERAL_TOKEN, AMM.address, msg.sender, xy[1])
                            # Request what's left from user
                            self.transferFrom(BORROWED_TOKEN, msg.sender, self, to_repay)

                        else:
                            # Move collateral to callbacker, call it and remove everything from it back in
                            self.transferFrom(COLLATERAL_TOKEN, AMM.address, callbacker, xy[1])
                            # For compatibility
                            callback_sig: bytes4 = CALLBACK_LIQUIDATE_WITH_BYTES
                            if callback_bytes == b"":
                                callback_sig = CALLBACK_LIQUIDATE
                            # Callback
                            cb: CallbackData = self.execute_callback(
                                callbacker, callback_sig, user, xy[0], xy[1], debt, callback_args, callback_bytes)
                            assert cb.stablecoins >= to_repay, "not enough proceeds"
                            if cb.stablecoins > to_repay:
                                self.transferFrom(BORROWED_TOKEN, callbacker, msg.sender, unsafe_sub(cb.stablecoins, to_repay))
                            self.transferFrom(BORROWED_TOKEN, callbacker, self, to_repay)
                            self.transferFrom(COLLATERAL_TOKEN, callbacker, msg.sender, cb.collateral)

                    else:
                        # Withdraw collateral
                        self.transferFrom(COLLATERAL_TOKEN, AMM.address, msg.sender, xy[1])
                        # Return what's left to user
                        if xy[0] > debt:
                            self.transferFrom(BORROWED_TOKEN, AMM.address, msg.sender, unsafe_sub(xy[0], debt))

                    self.redeemed += debt
                    self.loan[user] = Loan({initial_debt: final_debt, rate_mul: rate_mul})
                    log Repay(user, xy[1], debt)
                    log Liquidate(msg.sender, user, xy[1], xy[0], debt)
                    if final_debt == 0:
                        log UserState(user, 0, 0, 0, 0, 0)  # Not logging partial removal b/c we have not enough info
                        self._remove_from_list(user)

                    d: uint256 = self._total_debt.initial_debt * rate_mul / self._total_debt.rate_mul
                    self._total_debt.initial_debt = unsafe_sub(max(d, debt), debt)
                    self._total_debt.rate_mul = rate_mul

                    self._save_rate()
                ```

            === "AMM.vy"

                ```vyper
                event Withdraw:
                    provider: indexed(address)
                    amount_borrowed: uint256
                    amount_collateral: uint256

                @external
                @nonreentrant('lock')
                def withdraw(user: address, frac: uint256) -> uint256[2]:
                    """
                    @notice Withdraw liquidity for the user. Only admin contract can do it
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
                    old_max_band: int256 = self.max_band
                    max_band: int256 = n - 1

                    for i in range(MAX_TICKS):
                        x: uint256 = self.bands_x[n]
                        y: uint256 = self.bands_y[n]
                        ds: uint256 = unsafe_div(frac * user_shares[i], 10**18)
                        user_shares[i] = unsafe_sub(user_shares[i], ds)  # Can ONLY zero out when frac == 10**18
                        s: uint256 = self.total_shares[n]
                        new_shares: uint256 = s - ds
                        self.total_shares[n] = new_shares
                        s += DEAD_SHARES  # after this s is guaranteed to be bigger than 0
                        dx: uint256 = unsafe_div((x + 1) * ds, s)
                        dy: uint256 = unsafe_div((y + 1) * ds, s)

                        x -= dx
                        y -= dy

                        # If withdrawal is the last one - transfer dust to admin fees
                        if new_shares == 0:
                            if x > 0:
                                self.admin_fees_x += unsafe_div(x, BORROWED_PRECISION)
                            if y > 0:
                                self.admin_fees_y += unsafe_div(y, COLLATERAL_PRECISION)
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

                    if lm.address != empty(address):
                        lm.callback_collateral_shares(0, [])  # collateral/shares ratio is unchanged
                        lm.callback_user_shares(user, ns[0], user_shares)

                    return [total_x, total_y]
                ```

    === "Example"
        ```shell
        >>> soon
        ```


### `tokens_to_liquidate`
!!! description "`Controller.tokens_to_liquidate(user: address, frac: uint256 = 10 ** 18) -> uint256`"

    Function to calculate the amount of assets to have in a liquidator's wallet in order to liquidate a user.

    Returns: amount of tokens needed (`uint256`).

    | Input    | Type      | Description                                 |
    | -------- | --------- | ------------------------------------------- |
    | `user`   | `address` | Address of the user to liquidate            |
    | `frac`   | `uint256` | Fraction to liquidate; 100% = 10**18        |

    ??? quote "Source code"

        === "Commit `58289a4` — May 10, 2024"

            The following source code includes all changes up to commit hash [`58289a4`](https://github.com/curvefi/curve-stablecoin/tree/`58289a4`283d7cc3c53aba2d3801dcac5ef124957); any changes made after this commit are not included.

            === "Collateral.vy"

                ```vyper
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
                    stablecoins: uint256 = unsafe_div(AMM.get_sum_xy(user)[0] * self._get_f_remove(frac, health_limit), 10 ** 18)
                    debt: uint256 = unsafe_div(self._debt(user)[0] * frac, 10 ** 18)

                    return unsafe_sub(max(debt, stablecoins), stablecoins)
                ```

        === "Commit `b0240d8` — Sep 8, 2024"

            The following source code includes all changes up to commit hash [`b0240d8`](https://github.com/curvefi/curve-stablecoin/tree/b0240d844c9e60fdab78b481a556a187ceee3721); any changes made after this commit are not included.

            This implementation was used for [Optimism](../deployments/lending.md#logos-optimism-optimism) and [Fraxtal](../deployments/lending.md#logos-fraxtal-fraxtal) lending deployments.

            === "Collateral.vy"

                ```vyper
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
                    stablecoins: uint256 = unsafe_div(AMM.get_sum_xy(user)[0] * self._get_f_remove(frac, health_limit), 10 ** 18)
                    debt: uint256 = unsafe_div(self._debt(user)[0] * frac, 10 ** 18)

                    return unsafe_sub(max(debt, stablecoins), stablecoins)
                ```

    === "Example"

        This example shows the amount of the borrowed asset required to liquidate the user.

        ```shell
        >>> Controller.tokens_to_liquidate(trader)
        10000067519253003373620
        ```


### `users_to_liquidate`
!!! description "`Controller.users_to_liquidate(_from: uint256=0, _limit: uint256=0) -> DynArray[Position, 1000]`"

    Getter for a dynamic array of users who can be hard-liquidated.

    Returns: detailed info about positions of users that can be hard-liquidated (`DynArray[Position, 1000]`).

    | Input     | Type     | Description                                        |
    | --------- | -------- | -------------------------------------------------- |
    | `_from`   | `uint256` | Loan index to start iteration from; defaults to 0 |
    | `_limit`  | `uint256` | Number of loans to look over; defaults to 0       |

    ??? quote "Source code"

        === "Commit `58289a4` — May 10, 2024"

            The following source code includes all changes up to commit hash [`58289a4`](https://github.com/curvefi/curve-stablecoin/tree/`58289a4`283d7cc3c53aba2d3801dcac5ef124957); any changes made after this commit are not included.

            === "Collateral.vy"

                ```vyper
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
                        debt: uint256 = self._debt(user)[0]
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

        === "Commit `b0240d8` — Sep 8, 2024"

            The following source code includes all changes up to commit hash [`b0240d8`](https://github.com/curvefi/curve-stablecoin/tree/b0240d844c9e60fdab78b481a556a187ceee3721); any changes made after this commit are not included.

            This implementation was used for [Optimism](../deployments/lending.md#logos-optimism-optimism) and [Fraxtal](../deployments/lending.md#logos-fraxtal-fraxtal) lending deployments.

            === "Collateral.vy"

                ```vyper
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
                        debt: uint256 = self._debt(user)[0]
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

        This example returns a list of all users with negative health and therefore eligible for hard liquidation. In this case, no positions are eligible.

        ```shell
        >>> Controller.users_to_liquidate(0)
        []
        ```


---


## **Loan Info Methods**

*All user information, such as `debt`, `health`, etc., is stored within the Controller contract.*

### `debt`
!!! description "`Controller.debt(user: address) -> uint256`"

    Getter for the amount of debt for `user`. Constantly increases due to the charged interest rate.

    Returns: debt (`uint256`).

    | Input  | Type      | Description     |
    | ------ | --------- | --------------- |
    | `user` | `address` | User Address    |

    ??? quote "Source code"

        === "Commit `58289a4` — May 10, 2024"

            The following source code includes all changes up to commit hash [`58289a4`](https://github.com/curvefi/curve-stablecoin/tree/`58289a4`283d7cc3c53aba2d3801dcac5ef124957); any changes made after this commit are not included.

            === "Controller.vy"

                ```vyper
                struct Loan:
                    initial_debt: uint256
                    rate_mul: uint256

                @external
                @view
                @nonreentrant('lock')
                def debt(user: address) -> uint256:
                    """
                    @notice Get the value of debt without changing the state
                    @param user User address
                    @return Value of debt
                    """
                    return self._debt(user)[0]

                @internal
                @view
                def _debt(user: address) -> (uint256, uint256):
                    """
                    @notice Get the value of debt and rate_mul and update the rate_mul counter
                    @param user User address
                    @return (debt, rate_mul)
                    """
                    rate_mul: uint256 = AMM.get_rate_mul()
                    loan: Loan = self.loan[user]
                    if loan.initial_debt == 0:
                        return (0, rate_mul)
                    else:
                        # Let user repay 1 smallest decimal more so that the system doesn't lose on precision
                        # Use ceil div
                        debt: uint256 = loan.initial_debt * rate_mul
                        if debt % loan.rate_mul > 0:  # if only one loan -> don't have to do it
                            if self.n_loans > 1:
                                debt += loan.rate_mul
                        debt /= loan.rate_mul
                        return (debt, rate_mul)
                ```

        === "Commit `b0240d8` — Sep 8, 2024"

            The following source code includes all changes up to commit hash [`b0240d8`](https://github.com/curvefi/curve-stablecoin/tree/b0240d844c9e60fdab78b481a556a187ceee3721); any changes made after this commit are not included.

            This implementation was used for [Optimism](../deployments/lending.md#logos-optimism-optimism) and [Fraxtal](../deployments/lending.md#logos-fraxtal-fraxtal) lending deployments.

            === "Controller.vy"

                ```vyper
                struct Loan:
                    initial_debt: uint256
                    rate_mul: uint256

                @external
                @view
                @nonreentrant('lock')
                def debt(user: address) -> uint256:
                    """
                    @notice Get the value of debt without changing the state
                    @param user User address
                    @return Value of debt
                    """
                    return self._debt(user)[0]

                @internal
                @view
                def _debt(user: address) -> (uint256, uint256):
                    """
                    @notice Get the value of debt and rate_mul and update the rate_mul counter
                    @param user User address
                    @return (debt, rate_mul)
                    """
                    rate_mul: uint256 = AMM.get_rate_mul()
                    loan: Loan = self.loan[user]
                    if loan.initial_debt == 0:
                        return (0, rate_mul)
                    else:
                        # Let user repay 1 smallest decimal more so that the system doesn't lose on precision
                        # Use ceil div
                        debt: uint256 = loan.initial_debt * rate_mul
                        if debt % loan.rate_mul > 0:  # if only one loan -> don't have to do it
                            if self.n_loans > 1:
                                debt += loan.rate_mul
                        debt = unsafe_div(debt, loan.rate_mul)  # loan.rate_mul is nonzero because we just had % successful
                        return (debt, rate_mul)
                ```

    === "Example"

        This example shows the debt of a specific user.

        ```shell
        >>> Controller.debt(trader)
        11000001592726154783594
        ```


### `total_debt`
!!! description "`Controller.total_debt() -> uint256`"

    Getter for the total debt of the Controller.

    Returns: total debt (`uint256`).

    ??? quote "Source code"

        === "Commit `58289a4` — May 10, 2024"

            The following source code includes all changes up to commit hash [`58289a4`](https://github.com/curvefi/curve-stablecoin/tree/`58289a4`283d7cc3c53aba2d3801dcac5ef124957); any changes made after this commit are not included.

            === "Controller.vy"

                ```vyper
                struct Loan:
                    initial_debt: uint256
                    rate_mul: uint256

                _total_debt: Loan

                # No decorator because used in monetary policy
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

        === "Commit `b0240d8` — Sep 8, 2024"

            The following source code includes all changes up to commit hash [`b0240d8`](https://github.com/curvefi/curve-stablecoin/tree/b0240d844c9e60fdab78b481a556a187ceee3721); any changes made after this commit are not included.

            This implementation was used for [Optimism](../deployments/lending.md#logos-optimism-optimism) and [Fraxtal](../deployments/lending.md#logos-fraxtal-fraxtal) lending deployments.

            === "Controller.vy"

                ```vyper
                struct Loan:
                    initial_debt: uint256
                    rate_mul: uint256

                _total_debt: Loan

                # No decorator because used in monetary policy
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

        This example shows the total debt of the market.

        ```shell
        >>> Controller.total_debt()
        4047221089417662821708552
        ```


### `loan_exists`
!!! description "`Controller.loan_exists(user: address) -> bool`"

    Function to check if a loan for `user` exists.

    Returns: true or false (`bool`).

    | Input  | Type      | Description  |
    | ------ | --------- | ------------ |
    | `user` | `address` | User address |

    ??? quote "Source code"

        === "Commit `58289a4` — May 10, 2024"

            The following source code includes all changes up to commit hash [`58289a4`](https://github.com/curvefi/curve-stablecoin/tree/`58289a4`283d7cc3c53aba2d3801dcac5ef124957); any changes made after this commit are not included.

            === "Controller.vy"

                ```vyper
                struct Loan:
                    initial_debt: uint256
                    rate_mul: uint256

                @external
                @view
                @nonreentrant('lock')
                def loan_exists(user: address) -> bool:
                    """
                    @notice Check whether there is a loan of `user` in existence
                    """
                    return self.loan[user].initial_debt > 0
                ```

        === "Commit `b0240d8` — Sep 8, 2024"

            The following source code includes all changes up to commit hash [`b0240d8`](https://github.com/curvefi/curve-stablecoin/tree/b0240d844c9e60fdab78b481a556a187ceee3721); any changes made after this commit are not included.

            This implementation was used for [Optimism](../deployments/lending.md#logos-optimism-optimism) and [Fraxtal](../deployments/lending.md#logos-fraxtal-fraxtal) lending deployments.

            === "Controller.vy"

                ```vyper
                struct Loan:
                    initial_debt: uint256
                    rate_mul: uint256

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

        This example shows if a loan exists for a specific user.

        ```shell
        >>> Controller.loan_exists(trader)
        'True'

        >>> Controller.loan_exists("0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B")
        'False'
        ```


### `user_prices`
!!! description "`Controller.user_prices(user: address) -> uint256[2]`"

    Getter for the highest price of the upper band and the lowest price of the lower band the user has deposited in the AMM. This is essentially the liquidation price range of the loan.

    Returns: upper and lower band price (`uint256`).

    | Input  | Type      | Description  |
    | ------ | --------- | ------------ |
    | `user` | `address` | User address |

    ??? quote "Source code"

        === "Commit `58289a4` — May 10, 2024"

            The following source code includes all changes up to commit hash [`58289a4`](https://github.com/curvefi/curve-stablecoin/tree/`58289a4`283d7cc3c53aba2d3801dcac5ef124957); any changes made after this commit are not included.

            === "Controller.vy"

                ```vyper
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

                ```vyper
                @external
                @view
                @nonreentrant('lock')
                def has_liquidity(user: address) -> bool:
                    """
                    @notice Check if `user` has any liquidity in the AMM
                    """
                    return self.user_shares[user].ticks[0] != 0

                @external
                @view
                @nonreentrant('lock')
                def read_user_tick_numbers(user: address) -> int256[2]:
                    """
                    @notice Unpacks and reads user tick numbers
                    @param user User address
                    @return Lowest and highest band the user deposited into
                    """
                    return self._read_user_tick_numbers(user)

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
                ```

        === "Commit `b0240d8` — Sep 8, 2024"

            The following source code includes all changes up to commit hash [`b0240d8`](https://github.com/curvefi/curve-stablecoin/tree/b0240d844c9e60fdab78b481a556a187ceee3721); any changes made after this commit are not included.

            This implementation was used for [Optimism](../deployments/lending.md#logos-optimism-optimism) and [Fraxtal](../deployments/lending.md#logos-fraxtal-fraxtal) lending deployments.

            === "Controller.vy"

                ```vyper
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

                ```vyper
                @external
                @view
                @nonreentrant('lock')
                def has_liquidity(user: address) -> bool:
                    """
                    @notice Check if `user` has any liquidity in the AMM
                    """
                    return self.user_shares[user].ticks[0] != 0

                @external
                @view
                @nonreentrant('lock')
                def read_user_tick_numbers(user: address) -> int256[2]:
                    """
                    @notice Unpacks and reads user tick numbers
                    @param user User address
                    @return Lowest and highest band the user deposited into
                    """
                    return self._read_user_tick_numbers(user)

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
                ```

    === "Example"

        This example shows the liquidation range of a user's loan. In this case, the liquidation range would be between 64,018 and 57,897.

        ```shell
        >>> Controller.users_price(trader):
        [6401870706098817273644, 5789737113118292909562]
        ```


### `health`
!!! description "`Controller.health(user: address, full: bool = False) -> int256`"

    Getter for the health of `user`'s loan normalized to 1e18. If health is lower than 0, the loan can be hard-liquidated.

    Returns: health (`int256`).

    | Input  | Type      | Description                                                         |
    | ------ | --------- | ------------------------------------------------------------------- |
    | `user` | `address` | User address                                                        |
    | `full` | `bool`    | Whether to take into account the price difference above the highest user's band |

    ??? quote "Source code"

        === "Commit `58289a4` — May 10, 2024"

            The following source code includes all changes up to commit hash [`58289a4`](https://github.com/curvefi/curve-stablecoin/tree/`58289a4`283d7cc3c53aba2d3801dcac5ef124957); any changes made after this commit are not included.

            === "Controller.vy"

                ```vyper
                @view
                @external
                @nonreentrant('lock')
                def health(user: address, full: bool = False) -> int256:
                    """
                    @notice Returns position health normalized to 1e18 for the user.
                            Liquidation starts when < 0, however devaluation of collateral doesn't cause liquidation
                    """
                    return self._health(user, self._debt(user)[0], full, self.liquidation_discounts[user])

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
                    health: int256 = 10**18 - convert(liquidation_discount, int256)
                    health = unsafe_div(convert(AMM.get_x_down(user), int256) * health, convert(debt, int256)) - 10**18

                    if full:
                        ns0: int256 = AMM.read_user_tick_numbers(user)[0] # ns[1] > ns[0]
                        if ns0 > AMM.active_band():  # We are not in liquidation mode
                            p: uint256 = AMM.price_oracle()
                            p_up: uint256 = AMM.p_oracle_up(ns0)
                            if p > p_up:
                                health += convert(unsafe_div(unsafe_sub(p, p_up) * AMM.get_sum_xy(user)[1] * COLLATERAL_PRECISION, debt * BORROWED_PRECISION), int256)

                    return health
                ```

        === "Commit `b0240d8` — Sep 8, 2024"

            The following source code includes all changes up to commit hash [`b0240d8`](https://github.com/curvefi/curve-stablecoin/tree/b0240d844c9e60fdab78b481a556a187ceee3721); any changes made after this commit are not included.

            This implementation was used for [Optimism](../deployments/lending.md#logos-optimism-optimism) and [Fraxtal](../deployments/lending.md#logos-fraxtal-fraxtal) lending deployments.

            === "Controller.vy"

                ```vyper
                @view
                @external
                @nonreentrant('lock')
                def health(user: address, full: bool = False) -> int256:
                    """
                    @notice Returns position health normalized to 1e18 for the user.
                            Liquidation starts when < 0, however devaluation of collateral doesn't cause liquidation
                    """
                    return self._health(user, self._debt(user)[0], full, self.liquidation_discounts[user])

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
                    health: int256 = 10**18 - convert(liquidation_discount, int256)
                    health = unsafe_div(convert(AMM.get_x_down(user), int256) * health, convert(debt, int256)) - 10**18

                    if full:
                        ns0: int256 = AMM.read_user_tick_numbers(user)[0] # ns[1] > ns[0]
                        if ns0 > AMM.active_band():  # We are not in liquidation mode
                            p: uint256 = AMM.price_oracle()
                            p_up: uint256 = AMM.p_oracle_up(ns0)
                            if p > p_up:
                                health += convert(unsafe_div(unsafe_sub(p, p_up) * AMM.get_sum_xy(user)[1] * COLLATERAL_PRECISION, debt * BORROWED_PRECISION), int256)

                    return health
                ```

    === "Example"

        These examples show the health of a loan, once by taking the price differences above the user's highest band into account, and once without.

        ```shell
        >>> Controller.health(trader, True)
        6703636365754288577

        >>> Controller.health(trader, False)
        40947705194891925
        ```


### `user_state`
!!! description "`Controller.user_state(user: address) -> uint256[4]`"

    Getter for `user`'s state.

    Returns: collateral, stablecoin, debt, and number of bands (`uint256`).

    | Input  | Type      | Description                        |
    | ------ | --------- | ---------------------------------- |
    | `user` | `address` | User address to return state for   |

    ??? quote "Source code"

        === "Commit `58289a4` — May 10, 2024"

            The following source code includes all changes up to commit hash [`58289a4`](https://github.com/curvefi/curve-stablecoin/tree/`58289a4`283d7cc3c53aba2d3801dcac5ef124957); any changes made after this commit are not included.

            === "Controller.vy"

                ```vyper
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

                ```vyper
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

                @external
                @view
                @nonreentrant('lock')
                def read_user_tick_numbers(user: address) -> int256[2]:
                    """
                    @notice Unpacks and reads user tick numbers
                    @param user User address
                    @return Lowest and highest band the user deposited into
                    """
                    return self._read_user_tick_numbers(user)

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

        === "Commit `b0240d8` — Sep 8, 2024"

            The following source code includes all changes up to commit hash [`b0240d8`](https://github.com/curvefi/curve-stablecoin/tree/b0240d844c9e60fdab78b481a556a187ceee3721); any changes made after this commit are not included.

            This implementation was used for [Optimism](../deployments/lending.md#logos-optimism-optimism) and [Fraxtal](../deployments/lending.md#logos-fraxtal-fraxtal) lending deployments.

            === "Controller.vy"

                ```vyper
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

                ```vyper
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

                @external
                @view
                @nonreentrant('lock')
                def read_user_tick_numbers(user: address) -> int256[2]:
                    """
                    @notice Unpacks and reads user tick numbers
                    @param user User address
                    @return Lowest and highest band the user deposited into
                    """
                    return self._read_user_tick_numbers(user)

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

        This example returns the state of a user's loan, including the collateral composition consisting of collateral and borrowable tokens, the debt, and the number of bands used.

        ```shell
        >>> Controller.user_state(trader)
        [2000000000000000000, 0, 11000001592726154783594, 10]
        ```


### `loans`
!!! description "`Controller.liquidation_discounts(arg0: uint256) -> uint256: view`"

    Getter for the user address that created a loan at index `arg0`. Only loans with debt greater than 0 are included. Liquidated ones get removed.

    Returns: user (`address`).

    | Input  | Type      | Description |
    | ------ | --------- | ----------- |
    | `arg0` | `uint256` | Loan index  |

    ??? quote "Source code"

        === "Commit `58289a4` — May 10, 2024"

            The following source code includes all changes up to commit hash [`58289a4`](https://github.com/curvefi/curve-stablecoin/tree/`58289a4`283d7cc3c53aba2d3801dcac5ef124957); any changes made after this commit are not included.

            === "Controller.vy"

                ```vyper
                loans: public(address[2**64 - 1])  # Enumerate existing loans

                @internal
                def _remove_from_list(_for: address):
                    last_loan_ix: uint256 = self.n_loans - 1
                    loan_ix: uint256 = self.loan_ix[_for]
                    assert self.loans[loan_ix] == _for  # dev: should never fail but safety first
                    self.loan_ix[_for] = 0
                    if loan_ix < last_loan_ix:  # Need to replace
                        last_loan: address = self.loans[last_loan_ix]
                        self.loans[loan_ix] = last_loan
                        self.loan_ix[last_loan] = loan_ix
                    self.n_loans = last_loan_ix
                ```

        === "Commit `b0240d8` — Sep 8, 2024"

            The following source code includes all changes up to commit hash [`b0240d8`](https://github.com/curvefi/curve-stablecoin/tree/b0240d844c9e60fdab78b481a556a187ceee3721); any changes made after this commit are not included.

            This implementation was used for [Optimism](../deployments/lending.md#logos-optimism-optimism) and [Fraxtal](../deployments/lending.md#logos-fraxtal-fraxtal) lending deployments.


            === "Controller.vy"

                ```vyper
                loans: public(address[2**64 - 1])  # Enumerate existing loans

                @internal
                def _remove_from_list(_for: address):
                    last_loan_ix: uint256 = self.n_loans - 1
                    loan_ix: uint256 = self.loan_ix[_for]
                    assert self.loans[loan_ix] == _for  # dev: should never fail but safety first
                    self.loan_ix[_for] = 0
                    if loan_ix < last_loan_ix:  # Need to replace
                        last_loan: address = self.loans[last_loan_ix]
                        self.loans[loan_ix] = last_loan
                        self.loan_ix[last_loan] = loan_ix
                    self.n_loans = last_loan_ix
                ```

    === "Example"

        ```shell
        >>> Controller.loans(0)
        '0x10E47fC06ede0CD8C43E2A7ea438BEfcF45BCAa8'

        >>> Controller.loans(21)
        '0x3ee18B2214AFF97000D974cf647E7C347E8fa585'
        ```


### `loan_ix`
!!! description "`Controller.loan_ix(arg0: address) -> address: view`"

    Getter for the user's loan in the list. Only loans with debt greater than 0 are included. Liquidated ones get removed.

    Returns: index (`uint256`).

    | Input  | Type      | Description    |
    | ------ | --------- | -------------- |
    | `arg0` | `address` | User address.  |

    ??? quote "Source code"

        === "Commit `58289a4` — May 10, 2024"

            The following source code includes all changes up to commit hash [`58289a4`](https://github.com/curvefi/curve-stablecoin/tree/`58289a4`283d7cc3c53aba2d3801dcac5ef124957); any changes made after this commit are not included.

            === "Controller.vy"

                ```vyper
                loan_ix: public(HashMap[address, uint256])  # Position of the loan in the list
                ```

        === "Commit `b0240d8` — Sep 8, 2024"

            The following source code includes all changes up to commit hash [`b0240d8`](https://github.com/curvefi/curve-stablecoin/tree/b0240d844c9e60fdab78b481a556a187ceee3721); any changes made after this commit are not included.

            This implementation was used for [Optimism](../deployments/lending.md#logos-optimism-optimism) and [Fraxtal](../deployments/lending.md#logos-fraxtal-fraxtal) lending deployments.

            === "Controller.vy"

                ```vyper
                loan_ix: public(HashMap[address, uint256])  # Position of the loan in the list
                ```

    === "Example"

        ```shell
        >>> Controller.loans_ix(trader)
        21
        ```


### `n_loans`
!!! description "`Controller.n_loans() -> uint256: view`"

    Getter for the total number of existing loans. This variable is increased by one when a loan is created and decreased by one when a loan is fully repaid.

    Returns: number of active loans (`uint256`).

    ??? quote "Source code"

        === "Commit `58289a4` — May 10, 2024"

            The following source code includes all changes up to commit hash [`58289a4`](https://github.com/curvefi/curve-stablecoin/tree/`58289a4`283d7cc3c53aba2d3801dcac5ef124957); any changes made after this commit are not included.

            === "Controller.vy"

                ```vyper
                n_loans: public(uint256)  # Number of nonzero loans

                @internal
                def _remove_from_list(_for: address):
                    last_loan_ix: uint256 = self.n_loans - 1
                    loan_ix: uint256 = self.loan_ix[_for]
                    assert self.loans[loan_ix] == _for  # dev: should never fail but safety first
                    self.loan_ix[_for] = 0
                    if loan_ix < last_loan_ix:  # Need to replace
                        last_loan: address = self.loans[last_loan_ix]
                        self.loans[loan_ix] = last_loan
                        self.loan_ix[last_loan] = loan_ix
                    self.n_loans = last_loan_ix
                ```

        === "Commit `b0240d8` — Sep 8, 2024"

            The following source code includes all changes up to commit hash [`b0240d8`](https://github.com/curvefi/curve-stablecoin/tree/b0240d844c9e60fdab78b481a556a187ceee3721); any changes made after this commit are not included.

            This implementation was used for [Optimism](../deployments/lending.md#logos-optimism-optimism) and [Fraxtal](../deployments/lending.md#logos-fraxtal-fraxtal) lending deployments.

            === "Controller.vy"

                ```vyper
                n_loans: public(uint256)  # Number of nonzero loans

                @internal
                def _remove_from_list(_for: address):
                    last_loan_ix: uint256 = self.n_loans - 1
                    loan_ix: uint256 = self.loan_ix[_for]
                    assert self.loans[loan_ix] == _for  # dev: should never fail but safety first
                    self.loan_ix[_for] = 0
                    if loan_ix < last_loan_ix:  # Need to replace
                        last_loan: address = self.loans[last_loan_ix]
                        self.loans[loan_ix] = last_loan
                        self.loan_ix[last_loan] = loan_ix
                    self.n_loans = last_loan_ix
                ```

    === "Example"

        ```shell
        >>> Controller.n_loans()
        22
        ```


---


# **Fees**

*There are two types of fees:*

1. `Borrowing-based fee`: Borrowers pay **interest** on the debt borrowed.
2. `AMM-based fee`: **Swap fee** for trades within the AMM. There is also the option for an **admin fee**, but at the time of writing, admin fees are set to zero[^2], meaning all swap fees go to the liquidity providers, who are the borrowers themselves.

[^2]: Technically, admin fees within the AMMs are not zero. Currently, the admin fees of the AMMs are set to 1 (= 1/1e18), making them virtually nonexistent. The reason for this is to increase oracle manipulation resistance.

Both fees can be determined by the DAO. To change the borrowing-based fee, a new monetary policy contract needs to be set via [`set_monetary_policy`](#set_monetary_policy).
Changing the AMM fee can be done through [`set_amm_fee`](#set_amm_fee), and admin fees through [`set_admin_fee`](#set_amm_admin_fee).



### `admin_fees`
!!! description "`Controller.admin_fees() -> uint256`"

    Getter for the claimable admin fees. Claimable by calling [`collect_fees`](#collect_fees).

    Returns: admin fees (`uint256`).

    ??? quote "Source code"

        === "Commit `58289a4` — May 10, 2024"

            The following source code includes all changes up to commit hash [`58289a4`](https://github.com/curvefi/curve-stablecoin/tree/`58289a4`283d7cc3c53aba2d3801dcac5ef124957); any changes made after this commit are not included.

            === "Controller.vy"

                ```vyper
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
                    loan.initial_debt = loan.initial_debt * rate_mul / loan.rate_mul + self.redeemed
                    minted: uint256 = self.minted
                    return unsafe_sub(max(loan.initial_debt, minted), minted)
                ```

            === "AMM.vy"

                ```vyper
                @external
                @view
                def get_rate_mul() -> uint256:
                    """
                    @notice Rate multiplier which is 1.0 + integral(rate, dt)
                    @return Rate multiplier in units where 1.0 == 1e18
                    """
                    return self._rate_mul()

                @internal
                @view
                def _rate_mul() -> uint256:
                    """
                    @notice Rate multiplier which is 1.0 + integral(rate, dt)
                    @return Rate multiplier in units where 1.0 == 1e18
                    """
                    return unsafe_div(self.rate_mul * (10**18 + self.rate * (block.timestamp - self.rate_time)), 10**18)
                ```

        === "Commit `b0240d8` — Sep 8, 2024"

            The following source code includes all changes up to commit hash [`b0240d8`](https://github.com/curvefi/curve-stablecoin/tree/b0240d844c9e60fdab78b481a556a187ceee3721); any changes made after this commit are not included.

            This implementation was used for [Optimism](../deployments/lending.md#logos-optimism-optimism) and [Fraxtal](../deployments/lending.md#logos-fraxtal-fraxtal) lending deployments.

            === "Controller.vy"

                ```vyper
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
                    loan.initial_debt = loan.initial_debt * rate_mul / loan.rate_mul + self.redeemed
                    minted: uint256 = self.minted
                    return unsafe_sub(max(loan.initial_debt, minted), minted)
                ```

            === "AMM.vy"

                ```vyper
                @external
                @view
                def get_rate_mul() -> uint256:
                    """
                    @notice Rate multiplier which is 1.0 + integral(rate, dt)
                    @return Rate multiplier in units where 1.0 == 1e18
                    """
                    return self._rate_mul()

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
        >>> Controller.admin_fees()
        1431079351921267396706
        ```



### `set_amm_fee`
!!! description "`Controller.set_amm_fee(fee: uint256)`"

    !!!guard "Guarded Method"
        This function is only callable by the `admin` of the `Factory`.

    Function to set the AMM fee. The new fee value should be between `MIN_FEE` (10**6) and `MAX_FEE` (10**17).

    Emits: `SetFee`

    | Input | Type      | Description   |
    | ----- | --------- | ------------- |
    | `fee` | `uint256` | New fee value |

    ??? quote "Source code"

        === "Commit `58289a4` — May 10, 2024"

            The following source code includes all changes up to commit hash [`58289a4`](https://github.com/curvefi/curve-stablecoin/tree/`58289a4`283d7cc3c53aba2d3801dcac5ef124957); any changes made after this commit are not included.

            === "Controller.vy"

                ```vyper
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

                ```vyper
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

        === "Commit `b0240d8` — Sep 8, 2024"

            The following source code includes all changes up to commit hash [`b0240d8`](https://github.com/curvefi/curve-stablecoin/tree/b0240d844c9e60fdab78b481a556a187ceee3721); any changes made after this commit are not included.

            This implementation was used for [Optimism](../deployments/lending.md#logos-optimism-optimism) and [Fraxtal](../deployments/lending.md#logos-fraxtal-fraxtal) lending deployments.

            === "Controller.vy"

                ```vyper
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

                ```vyper
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
        >>> soon
        ```


### `set_amm_admin_fee`
!!! description "`Controller.set_amm_admin_fee(fee: uint256)`"

    !!!guard "Guarded Method"
        This function is only callable by the `admin` of the `Factory`.

    !!!warning
        todo: function removed in new impl -> why?

    Function to set the AMM admin fee. Maximum admin fee is 50%.

    Emits: `SetAdminFee`

    | Input | Type      | Description   |
    | ----- | --------- | ------------- |
    | `fee` | `uint256` | New admin fee |

    ??? quote "Source code"

        === "Commit `58289a4` — May 10, 2024"

            The following source code includes all changes up to commit hash [`58289a4`](https://github.com/curvefi/curve-stablecoin/tree/`58289a4`283d7cc3c53aba2d3801dcac5ef124957); any changes made after this commit are not included.

            === "Controller.vy"

                ```vyper
                MAX_ADMIN_FEE: constant(uint256) = 5 * 10**17  # 50%

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

                ```vyper
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
        >>> Controller.set_amm_admin_fee(1):
        ```


### `collect_fees`
!!! description "`Controller.collect_fees()`"

    Function to collects all fees, including borrowing-based fees and AMM-based fees (if there are any). Collected fees are sent to the `fee_receiver` specified in the [Factory](./factory/overview.md#fee-receiver).

    Emits: `CollectFees`

    ??? quote "Source code"

        === "Commit `58289a4` — May 10, 2024"

            The following source code includes all changes up to commit hash [`58289a4`](https://github.com/curvefi/curve-stablecoin/tree/`58289a4`283d7cc3c53aba2d3801dcac5ef124957); any changes made after this commit are not included.

            === "Controller.vy"

                ```vyper
                event CollectFees:
                    amount: uint256
                    new_supply: uint256

                @external
                @nonreentrant('lock')
                def collect_fees() -> uint256:
                    """
                    @notice Collect the fees charged as interest
                    @notice None of this fees are collected if factory has no fee_receiver - e.g. for lending
                            This is by design: lending does NOT earn interest, system makes money by using crvUSD
                    """
                    # Calling fee_receiver will fail for lending markets because everything gets to lenders
                    _to: address = FACTORY.fee_receiver()
                    # AMM-based fees
                    borrowed_fees: uint256 = AMM.admin_fees_x()
                    collateral_fees: uint256 = AMM.admin_fees_y()
                    self.transferFrom(BORROWED_TOKEN, AMM.address, _to, borrowed_fees)
                    self.transferFrom(COLLATERAL_TOKEN, AMM.address, _to, collateral_fees)
                    AMM.reset_admin_fees()

                    # Borrowing-based fees
                    rate_mul: uint256 = AMM.get_rate_mul()
                    loan: Loan = self._total_debt
                    loan.initial_debt = loan.initial_debt * rate_mul / loan.rate_mul
                    loan.rate_mul = rate_mul
                    self._total_debt = loan

                    self._save_rate()

                    # Amount which would have been redeemed if all the debt was repaid now
                    to_be_redeemed: uint256 = loan.initial_debt + self.redeemed
                    # Amount which was minted when borrowing + all previously claimed admin fees
                    minted: uint256 = self.minted
                    # Difference between to_be_redeemed and minted amount is exactly due to interest charged
                    if to_be_redeemed > minted:
                        self.minted = to_be_redeemed
                        to_be_redeemed = unsafe_sub(to_be_redeemed, minted)  # Now this is the fees to charge
                        self.transfer(BORROWED_TOKEN, _to, to_be_redeemed)
                        log CollectFees(to_be_redeemed, loan.initial_debt)
                        return to_be_redeemed
                    else:
                        log CollectFees(0, loan.initial_debt)
                        return 0
                ```

            === "AMM.vy"

                ```vyper
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

        === "Commit `b0240d8` — Sep 8, 2024"

            The following source code includes all changes up to commit hash [`b0240d8`](https://github.com/curvefi/curve-stablecoin/tree/b0240d844c9e60fdab78b481a556a187ceee3721); any changes made after this commit are not included.

            This implementation was used for [Optimism](../deployments/lending.md#logos-optimism-optimism) and [Fraxtal](../deployments/lending.md#logos-fraxtal-fraxtal) lending deployments.

            === "Controller.vy"

                ```vyper
                event CollectFees:
                    amount: uint256
                    new_supply: uint256

                @external
                @nonreentrant('lock')
                def collect_fees() -> uint256:
                    """
                    @notice Collect the fees charged as interest.
                            None of this fees are collected if factory has no fee_receiver - e.g. for lending
                            This is by design: lending does NOT earn interest, system makes money by using crvUSD
                    """
                    # Calling fee_receiver will fail for lending markets because everything gets to lenders
                    _to: address = FACTORY.fee_receiver()

                    # Borrowing-based fees
                    rate_mul: uint256 = AMM.get_rate_mul()
                    loan: Loan = self._total_debt
                    loan.initial_debt = loan.initial_debt * rate_mul / loan.rate_mul
                    loan.rate_mul = rate_mul
                    self._total_debt = loan

                    self._save_rate()

                    # Amount which would have been redeemed if all the debt was repaid now
                    to_be_redeemed: uint256 = loan.initial_debt + self.redeemed
                    # Amount which was minted when borrowing + all previously claimed admin fees
                    minted: uint256 = self.minted
                    # Difference between to_be_redeemed and minted amount is exactly due to interest charged
                    if to_be_redeemed > minted:
                        self.minted = to_be_redeemed
                        to_be_redeemed = unsafe_sub(to_be_redeemed, minted)  # Now this is the fees to charge
                        self.transfer(BORROWED_TOKEN, _to, to_be_redeemed)
                        log CollectFees(to_be_redeemed, loan.initial_debt)
                        return to_be_redeemed
                    else:
                        log CollectFees(0, loan.initial_debt)
                        return 0
                ```

            === "AMM.vy"

                ```vyper
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

        This example shows the effect of claiming fees. Before calling `collect_fees`, the total admin fees amounted to approximately 1,431 crvUSD. After claiming, the admin fees are reset to 0.

        ```shell
        >>> Controller.admin_fees()
        1431079351921267396706

        >>> Controller.collect_fees()

        >>> Controller.admin_fees()
        0
        ```


---


# **Loan and Liquidation Discount**

*New values for `loan_discount` and `liquidation_discount` can be assigned by the admin of the Factory, which is the DAO.*

The **loan discount** is the percentage used to discount the collateral for calculating the maximum borrowable amount when creating a loan.

The **liquidation discount** is used to discount the collateral for calculating the recoverable value upon liquidation at the current market price.

### `loan_discount`
!!! description "`Controller.loan_discount() -> uint256: view`"

    Getter for the discount of the maximum loan size compared to `get_x_down()` value. This value defines the LTV.

    Returns: loan discount (`uint256`).

    ??? quote "Source code"

        === "Commit `58289a4` — May 10, 2024"

            The following source code includes all changes up to commit hash [`58289a4`](https://github.com/curvefi/curve-stablecoin/tree/`58289a4`283d7cc3c53aba2d3801dcac5ef124957); any changes made after this commit are not included.

            === "Controller.vy"

                ```vyper
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
                    ...
                    self.loan_discount = loan_discount
                    ...
                ```

        === "Commit `b0240d8` — Sep 8, 2024"

            The following source code includes all changes up to commit hash [`b0240d8`](https://github.com/curvefi/curve-stablecoin/tree/b0240d844c9e60fdab78b481a556a187ceee3721); any changes made after this commit are not included.

            This implementation was used for [Optimism](../deployments/lending.md#logos-optimism-optimism) and [Fraxtal](../deployments/lending.md#logos-fraxtal-fraxtal) lending deployments.

            === "Controller.vy"

                ```vyper
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
                    ...
                    self.loan_discount = loan_discount
                    ...
                ```

    === "Example"

        ```shell
        >>> Controller.loan_discount()
        90000000000000000
        ```


### `liquidation_discount`
!!! description "`Controller.liquidation_discount() -> uint256: view`"

    Getter for the liquidation discount. This value is used to discount the collateral value when calculating the health for liquidation purposes in order to incentivize liquidators.

    Returns: liquidation discount (`uint256`).

    ??? quote "Source code"

        === "Commit `58289a4` — May 10, 2024"

            The following source code includes all changes up to commit hash [`58289a4`](https://github.com/curvefi/curve-stablecoin/tree/`58289a4`283d7cc3c53aba2d3801dcac5ef124957); any changes made after this commit are not included.

            === "Controller.vy"

                ```vyper
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
                    ...
                    self.liquidation_discount = liquidation_discount
                    ...
                ```

        === "Commit `b0240d8` — Sep 8, 2024"

            The following source code includes all changes up to commit hash [`b0240d8`](https://github.com/curvefi/curve-stablecoin/tree/b0240d844c9e60fdab78b481a556a187ceee3721); any changes made after this commit are not included.

            This implementation was used for [Optimism](../deployments/lending.md#logos-optimism-optimism) and [Fraxtal](../deployments/lending.md#logos-fraxtal-fraxtal) lending deployments.

            === "Controller.vy"

                ```vyper
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
                    ...
                    self.liquidation_discount = liquidation_discount
                    ...
                ```

    === "Example"

        ```shell
        >>> Controller.liquidation_discount()
        60000000000000000
        ```


### `liquidation_discounts`
!!! description "`Controller.liquidation_discounts(arg0: address) -> uint256: view`"

    Getter method for the liquidation discount of a user. This value is used to discount the collateral for calculating the recoverable value upon liquidation at the current market price. The discount is factored into the health calculation.

    Returns: liquidation discount (`uint256`).

    | Input  | Type      | Description  |
    | ------ | --------- | ------------ |
    | `arg0` | `address` | User Address |

    ??? quote "Source code"

        === "Commit `58289a4` — May 10, 2024"

            The following source code includes all changes up to commit hash [`58289a4`](https://github.com/curvefi/curve-stablecoin/tree/`58289a4`283d7cc3c53aba2d3801dcac5ef124957); any changes made after this commit are not included.

            === "Controller.vy"

                ```vyper
                liquidation_discounts: public(HashMap[address, uint256])
                ```

        === "Commit `b0240d8` — Sep 8, 2024"

            The following source code includes all changes up to commit hash [`b0240d8`](https://github.com/curvefi/curve-stablecoin/tree/b0240d844c9e60fdab78b481a556a187ceee3721); any changes made after this commit are not included.

            This implementation was used for [Optimism](../deployments/lending.md#logos-optimism-optimism) and [Fraxtal](../deployments/lending.md#logos-fraxtal-fraxtal) lending deployments.

            === "Controller.vy"

                ```vyper
                liquidation_discounts: public(HashMap[address, uint256])
                ```

    === "Example"

        ```shell
        >>> Controller.liquidation_discounts(trader)
        0
        ```


### `set_borrowing_discounts`
!!! description "`Controller.set_borrowing_discounts(loan_discount: uint256, liquidation_discount: uint256)`"

    !!!guard "Guarded Method"
        This function is only callable by the `admin` of the Factory.

    Function to set new values for `loan_discount` and `liquidation_discount`. This metric defines the max LTV and where bad liquidations start.

    Emits: `SetBorrowingDiscount`

    | Input                  | Type      | Description                            |
    | ---------------------- | --------- | -------------------------------------- |
    | `loan_discount`        | `uint256` | New value for the loan discount        |
    | `liquidation_discount` | `uint256` | New value for the liquidation discount |

    ??? quote "Source code"

        === "Commit `58289a4` — May 10, 2024"

            The following source code includes all changes up to commit hash [`58289a4`](https://github.com/curvefi/curve-stablecoin/tree/`58289a4`283d7cc3c53aba2d3801dcac5ef124957); any changes made after this commit are not included.

            === "Controller.vy"

            ```vyper
            event SetBorrowingDiscounts:
                loan_discount: uint256
                liquidation_discount: uint256

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

        === "Commit `b0240d8` — Sep 8, 2024"

            The following source code includes all changes up to commit hash [`b0240d8`](https://github.com/curvefi/curve-stablecoin/tree/b0240d844c9e60fdab78b481a556a187ceee3721); any changes made after this commit are not included.

            This implementation was used for [Optimism](../deployments/lending.md#logos-optimism-optimism) and [Fraxtal](../deployments/lending.md#logos-fraxtal-fraxtal) lending deployments.

            === "Controller.vy"

            ```vyper
            event SetBorrowingDiscounts:
                loan_discount: uint256
                liquidation_discount: uint256

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
        >>> Controller.set_borrowing_discounts(90000000000000000, 60000000000000000)
        ```


---


# **Monetary Policy**

Each controller has a monetary policy contract. This contract is responsible for the interest rates within the markets.

While [monetary policies for minting markets](../crvUSD/monetarypolicy.md) depend on several factors such as the price of crvUSD, PegKeeper debt, etc., the monetary policy for lending markets is solely based on a [semi-log monetary policy](../lending/contracts/semilog-mp.md) which determines the rate based on the utilization of the assets.


### `monetary_policy`
!!! description "`Controller.monetary_policy() -> address: view`"

    Getter for the monetary policy contract.

    Returns: monetary policy contract (`address`).

    ??? quote "Source code"

        === "Commit `58289a4` — May 10, 2024"

            The following source code includes all changes up to commit hash [`58289a4`](https://github.com/curvefi/curve-stablecoin/tree/`58289a4`283d7cc3c53aba2d3801dcac5ef124957); any changes made after this commit are not included.

            === "Controller.vy"

                ```vyper
                interface MonetaryPolicy:
                    def rate_write() -> uint256: nonpayable

                monetary_policy: public(MonetaryPolicy)
                ```

        === "Commit `b0240d8` — Sep 8, 2024"

            The following source code includes all changes up to commit hash [`b0240d8`](https://github.com/curvefi/curve-stablecoin/tree/b0240d844c9e60fdab78b481a556a187ceee3721); any changes made after this commit are not included.

            This implementation was used for [Optimism](../deployments/lending.md#logos-optimism-optimism) and [Fraxtal](../deployments/lending.md#logos-fraxtal-fraxtal) lending deployments.

            === "Controller.vy"

                ```vyper
                interface MonetaryPolicy:
                    def rate_write() -> uint256: nonpayable

                monetary_policy: public(MonetaryPolicy)
                ```

    === "Example"

        ```shell
        >>> Controller.monetary_policy()
        '0x8c5A7F011f733fBb0A6c969c058716d5CE9bc933'
        ```


### `set_monetary_policy`
!!! description "`Controller.set_monetary_policy(monetary_policy: address)`"

    !!!guard "Guarded Method"
        This function is only callable by the `admin` of the contract, which is the Factory.

    Function to set the monetary policy contract. Initially, the monetary policy contract is configured when a new market is added via the Factory. However, this function allows the contract address to be changed later. When setting the new address, the function calls `rate_write()` from the monetary policy contract to verify if the ABI is correct.

    Emits: `SetMonetaryPolicy`

    | Input             | Type      | Description              |
    | ----------------- | --------- | ------------------------ |
    | `monetary_policy` | `address` | Monetary policy contract |

    ??? quote "Source code"

        === "Commit `58289a4` — May 10, 2024"

            The following source code includes all changes up to commit hash [`58289a4`](https://github.com/curvefi/curve-stablecoin/tree/`58289a4`283d7cc3c53aba2d3801dcac5ef124957); any changes made after this commit are not included.

            === "Controller.vy"

                ```vyper
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

            === "MonetaryPolicy.vy"

                ```vyper
                @external
                def rate_write(_for: address = msg.sender) -> uint256:
                    # Not needed here but useful for more automated policies
                    # which change rate0 - for example rate0 targeting some fraction pl_debt/total_debt
                    return self.calculate_rate(_for, PRICE_ORACLE.price_w())
                ```

        === "Commit `b0240d8` — Sep 8, 2024"

            The following source code includes all changes up to commit hash [`b0240d8`](https://github.com/curvefi/curve-stablecoin/tree/b0240d844c9e60fdab78b481a556a187ceee3721); any changes made after this commit are not included.

            This implementation was used for [Optimism](../deployments/lending.md#logos-optimism-optimism) and [Fraxtal](../deployments/lending.md#logos-fraxtal-fraxtal) lending deployments.

            === "Controller.vy"

                ```vyper
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

            === "MonetaryPolicy.vy"

                ```vyper
                @external
                def rate_write(_for: address = msg.sender) -> uint256:
                    # Not needed here but useful for more automated policies
                    # which change rate0 - for example rate0 targeting some fraction pl_debt/total_debt
                    return self.calculate_rate(_for, PRICE_ORACLE.price_w())
                ```

    === "Example"

        ```shell
        >>> Controller.set_monetary_policy("0xc684432FD6322c6D58b6bC5d28B18569aA0AD0A1")
        ```


---


# **Contract Info Methods**

### `FACTORY`
!!! description "`Controller.factory() -> address: view`"

    Getter of the Factory contract of the Controller. This variable is immutable and can not be changed.

    Returns: Factory (`address`).

    ??? quote "Source code"

        === "Commit `58289a4` — May 10, 2024"

            The following source code includes all changes up to commit hash [`58289a4`](https://github.com/curvefi/curve-stablecoin/tree/`58289a4`283d7cc3c53aba2d3801dcac5ef124957); any changes made after this commit are not included.

            === "Controller.vy"

                ```vyper
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
                    ...
                ```

        === "Commit `b0240d8` — Sep 8, 2024"

            The following source code includes all changes up to commit hash [`b0240d8`](https://github.com/curvefi/curve-stablecoin/tree/b0240d844c9e60fdab78b481a556a187ceee3721); any changes made after this commit are not included.

            This implementation was used for [Optimism](../deployments/lending.md#logos-optimism-optimism) and [Fraxtal](../deployments/lending.md#logos-fraxtal-fraxtal) lending deployments.

            === "Controller.vy"

                ```vyper
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
                    ...
                ```

    === "Example"

        ```shell
        >>> Controller.factory()
        '0xC9332fdCB1C491Dcc683bAe86Fe3cb70360738BC
        ```


### `amm`
!!! description "`Controller.amm() -> address: view`"

    Getter of the `AMM` contract of the `Controller`. This variable is immutable and can not be changed.

    Returns: `AMM` contract (`address`).

    ??? quote "Source code"

        === "Commit `58289a4` — May 10, 2024"

            The following source code includes all changes up to commit hash [`58289a4`](https://github.com/curvefi/curve-stablecoin/tree/`58289a4`283d7cc3c53aba2d3801dcac5ef124957); any changes made after this commit are not included.

            === "Controller.vy"

                ```vyper
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
                    ...
                    AMM = LLAMMA(amm)
                    ...
                ```

        === "Commit `b0240d8` — Sep 8, 2024"

            The following source code includes all changes up to commit hash [`b0240d8`](https://github.com/curvefi/curve-stablecoin/tree/b0240d844c9e60fdab78b481a556a187ceee3721); any changes made after this commit are not included.

            This implementation was used for [Optimism](../deployments/lending.md#logos-optimism-optimism) and [Fraxtal](../deployments/lending.md#logos-fraxtal-fraxtal) lending deployments.

            === "Controller.vy"

                ```vyper
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
                    ...
                    AMM = LLAMMA(amm)
                    ...
                ```

    === "Example"

        ```shell
        >>> Controller.amm()
        '0xf9bD9da2427a50908C4c6D1599D8e62837C2BCB0'
        ```


### `collateral_token`
!!! description "`Controller.collateral_token() -> address: view`"

    Getter of the collateral token for the market. This variable is immutable and can not be changed.

    Returns: collateral token (`address`).

    ??? quote "Source code"

        === "Commit `58289a4` — May 10, 2024"

            The following source code includes all changes up to commit hash [`58289a4`](https://github.com/curvefi/curve-stablecoin/tree/`58289a4`283d7cc3c53aba2d3801dcac5ef124957); any changes made after this commit are not included.

            === "Controller.vy"

                ```vyper
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
                    ...
                    COLLATERAL_TOKEN = _collateral_token
                    ...
                ```

        === "Commit `b0240d8` — Sep 8, 2024"

            The following source code includes all changes up to commit hash [`b0240d8`](https://github.com/curvefi/curve-stablecoin/tree/b0240d844c9e60fdab78b481a556a187ceee3721); any changes made after this commit are not included.

            This implementation was used for [Optimism](../deployments/lending.md#logos-optimism-optimism) and [Fraxtal](../deployments/lending.md#logos-fraxtal-fraxtal) lending deployments.

            === "Controller.vy"

                ```vyper
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
                    ...
                    COLLATERAL_TOKEN = _collateral_token
                    ...
                ```

    === "Example"

        ```shell
        >>> Controller.collateral_token()
        '0x18084fbA666a33d37592fA2633fD49a74DD93a88'
        ```


### `amm_price`
!!! description "`Controller.amm_price() -> uint256:`"

    Getter for the current price from the AMM.

    Returns: price (`uint256`).

    ??? quote "Source code"

        === "Commit `58289a4` — May 10, 2024"

            The following source code includes all changes up to commit hash [`58289a4`](https://github.com/curvefi/curve-stablecoin/tree/`58289a4`283d7cc3c53aba2d3801dcac5ef124957); any changes made after this commit are not included.

            === "Controller.vy"

                ```vyper
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

                ```vyper
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
                    assert p_o_up != 0

                    # Special cases
                    if x == 0:
                        if y == 0:  # x and y are 0
                            # Return mid-band
                            return unsafe_div((unsafe_div(unsafe_div(p_o**2, p_o_up) * p_o, p_o_up) * A), Aminus1)
                        # if x == 0: # Lowest point of this band -> p_current_down
                        return unsafe_div(unsafe_div(p_o**2, p_o_up) * p_o, p_o_up)
                    if y == 0: # Highest point of this band -> p_current_up
                        p_o_up = unsafe_div(p_o_up * Aminus1, A)  # now this is _actually_ p_o_down
                        return unsafe_div(p_o**2 / p_o_up * p_o, p_o_up)

                    y0: uint256 = self._get_y0(x, y, p_o, p_o_up)
                    # ^ that call also checks that p_o != 0

                    # (f(y0) + x) / (g(y0) + y)
                    f: uint256 = unsafe_div(A * y0 * p_o, p_o_up) * p_o
                    g: uint256 = unsafe_div(Aminus1 * y0 * p_o_up, p_o)
                    return (f + x * 10**18) / (g + y)
                ```

        === "Commit `b0240d8` — Sep 8, 2024"

            The following source code includes all changes up to commit hash [`b0240d8`](https://github.com/curvefi/curve-stablecoin/tree/b0240d844c9e60fdab78b481a556a187ceee3721); any changes made after this commit are not included.

            This implementation was used for [Optimism](../deployments/lending.md#logos-optimism-optimism) and [Fraxtal](../deployments/lending.md#logos-fraxtal-fraxtal) lending deployments.

            === "Controller.vy"

                ```vyper
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

                ```vyper
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
                    assert p_o_up != 0

                    # Special cases
                    if x == 0:
                        if y == 0:  # x and y are 0
                            # Return mid-band
                            return unsafe_div((unsafe_div(unsafe_div(p_o**2, p_o_up) * p_o, p_o_up) * A), Aminus1)
                        # if x == 0: # Lowest point of this band -> p_current_down
                        return unsafe_div(unsafe_div(p_o**2, p_o_up) * p_o, p_o_up)
                    if y == 0: # Highest point of this band -> p_current_up
                        p_o_up = unsafe_div(p_o_up * Aminus1, A)  # now this is _actually_ p_o_down
                        return unsafe_div(p_o**2 / p_o_up * p_o, p_o_up)

                    y0: uint256 = self._get_y0(x, y, p_o, p_o_up)
                    # ^ that call also checks that p_o != 0

                    # (f(y0) + x) / (g(y0) + y)
                    f: uint256 = unsafe_div(A * y0 * p_o, p_o_up) * p_o
                    g: uint256 = unsafe_div(Aminus1 * y0 * p_o_up, p_o)
                    return (f + x * 10**18) / (g + y)
                ```

    === "Example"

        ```shell
        >>> Controller.amm_price():
        42852102383927213434085
        ```


### `minted`
!!! description "`Controller.minted() -> uint256: view`"

    Getter for the total amount of crvUSD minted from this controller. Increments by the amount of debt when calling `create_loan` or `borrow_more`.

    Returns: total minted (`uint256`).

    ??? quote "Source code"

        === "Commit `58289a4` — May 10, 2024"

            The following source code includes all changes up to commit hash [`58289a4`](https://github.com/curvefi/curve-stablecoin/tree/`58289a4`283d7cc3c53aba2d3801dcac5ef124957); any changes made after this commit are not included.

            === "Controller.vy"

                ```vyper
                minted: public(uint256)
                ```

        === "Commit `b0240d8` — Sep 8, 2024"

            The following source code includes all changes up to commit hash [`b0240d8`](https://github.com/curvefi/curve-stablecoin/tree/b0240d844c9e60fdab78b481a556a187ceee3721); any changes made after this commit are not included.

            This implementation was used for [Optimism](../deployments/lending.md#logos-optimism-optimism) and [Fraxtal](../deployments/lending.md#logos-fraxtal-fraxtal) lending deployments.

            === "Controller.vy"

                ```vyper
                minted: public(uint256)
                ```

    === "Example"

        ```shell
        >>> Controller.minted()
        20682637249975500380405996
        ```


### `redeemed`
!!! description "`Controller.redeemed() -> uint256: view`"

    Getter for the total amount of crvUSD redeemed from this controller. Increments by the amount of debt that is repaid when calling `repay` or `repay_extended`.

    Returns: total redeemed (`uint256`).

    ??? quote "Source code"

        === "Commit `58289a4` — May 10, 2024"

            The following source code includes all changes up to commit hash [`58289a4`](https://github.com/curvefi/curve-stablecoin/tree/`58289a4`283d7cc3c53aba2d3801dcac5ef124957); any changes made after this commit are not included.

            === "Controller.vy"

                ```vyper
                redeemed: public(uint256)
                ```

        === "Commit `b0240d8` — Sep 8, 2024"

            The following source code includes all changes up to commit hash [`b0240d8`](https://github.com/curvefi/curve-stablecoin/tree/b0240d844c9e60fdab78b481a556a187ceee3721); any changes made after this commit are not included.

            This implementation was used for [Optimism](../deployments/lending.md#logos-optimism-optimism) and [Fraxtal](../deployments/lending.md#logos-fraxtal-fraxtal) lending deployments.

            === "Controller.vy"

                ```vyper
                redeemed: public(uint256)
                ```

    === "Example"

        ```shell
        >>> Controller.redeemed()
        16646401312086830122157869
        ```


---


# **Callbacks**

### `set_callback`
!!! description "`Controller.set_callback(cb: address) -> uint256: view`"

    !!!guard "Guarded Method"
        This function is only callable by the `admin` of the Factory.

    Function to set a callback for liquidity mining.

    | Input | Type      | Description |
    | ----- | --------- | ----------- |
    | `cb`  | `address` | Callback    |

    ??? quote "Source code"

        === "Commit `58289a4` — May 10, 2024"

            The following source code includes all changes up to commit hash [`58289a4`](https://github.com/curvefi/curve-stablecoin/tree/`58289a4`283d7cc3c53aba2d3801dcac5ef124957); any changes made after this commit are not included.

            === "Controller.vy"

                ```vyper
                @external
                @nonreentrant('lock')
                def set_callback(cb: address):
                    """
                    @notice Set liquidity mining callback
                    """
                    assert msg.sender == FACTORY.admin()
                    AMM.set_callback(cb)
                ```

        === "Commit `b0240d8` — Sep 8, 2024"

            The following source code includes all changes up to commit hash [`b0240d8`](https://github.com/curvefi/curve-stablecoin/tree/b0240d844c9e60fdab78b481a556a187ceee3721); any changes made after this commit are not included.

            This implementation was used for [Optimism](../deployments/lending.md#logos-optimism-optimism) and [Fraxtal](../deployments/lending.md#logos-fraxtal-fraxtal) lending deployments.

            === "Controller.vy"

                ```vyper
                @external
                @nonreentrant('lock')
                def set_callback(cb: address):
                    """
                    @notice Set liquidity mining callback
                    """
                    assert msg.sender == FACTORY.admin()
                    AMM.set_callback(cb)
                ```

    === "Example"

        ```shell
        >>> soon
        ```
