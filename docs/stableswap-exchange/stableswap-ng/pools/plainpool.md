Plain pools are liquidity **exchange contracts which contain at least 2 and up to 8 coins.** 

!!!deploy "Contract Source & Deployment"
    Source code available on [Github](https://github.com/curvefi/stableswap-ng/blob/bff1522b30819b7b240af17ccfb72b0effbf6c47/contracts/main/CurveStableSwapNG.vy).  

The deployment of plain pools is permissionless and can be done via the [**`deploy_plain_pool`**](../../../factory/stableswapNG/deployer-api.md#deploy_plain_pool) function within the StableSwap-NG Factory.

!!!warning "Examples"
    The examples following each code block of the corresponding functions provide a basic illustration of input/output values. **When using the function in production, ensure not to set `_min_dy`, `_min_amount`, etc., to zero or other arbitrary numbers**. Otherwise, MEV bots may frontrun or sandwich your transaction, leading to a potential loss of funds.

    The examples are based on the crvUSD-USDV pool: [0xe1e77de32fb301ce55871ba095fd6b8e5d9abad8](https://etherscan.io/address/0xe1e77de32fb301ce55871ba095fd6b8e5d9abad8#code)


---


*The AMM contract utilizes two internal functions to transfer tokens/coins in and out of the pool and then accordingly update `stored_balances`:*

- **`_transfer_in()`**

    ??? quote "`_transfer_in(coin_idx: int128, dx: uint256, sender: address, expect_optimistic_transfer: bool) -> uint256:`"

        `expect_optimistic_transfer` is relevant when using the [`exchange_received()`](#exchange_received) function.

        | Input                          | Type       | Description                                         |
        | ------------------------------ | ---------- | --------------------------------------------------- |
        | `coin_idx`                     | `int128`   | Index value of the token to transfer in.            |
        | `dx`                           | `uint256`  | Amount to transfer in.                              |
        | `sender`                       | `address`  | Address to transfer coins from.                      |
        | `expect_optimistic_transfer`  | `bool`     | `True` if the contract expects an optimistic coin transfer. |


        ```vyper
        stored_balances: DynArray[uint256, MAX_COINS]

        @internal
        def _transfer_in(
            coin_idx: int128,
            dx: uint256,
            sender: address,
            expect_optimistic_transfer: bool,
        ) -> uint256:
            """
            @notice Contains all logic to handle ERC20 token transfers.
            @param coin_idx Index of the coin to transfer in.
            @param dx amount of `_coin` to transfer into the pool.
            @param dy amount of `_coin` to transfer out of the pool.
            @param sender address to transfer `_coin` from.
            @param receiver address to transfer `_coin` to.
            @param expect_optimistic_transfer True if contract expects an optimistic coin transfer
            """
            _dx: uint256 = ERC20(coins[coin_idx]).balanceOf(self)

            # ------------------------- Handle Transfers -----------------------------

            if expect_optimistic_transfer:

                _dx = _dx - self.stored_balances[coin_idx]
                assert _dx >= dx

            else:

                assert dx > 0  # dev : do not transferFrom 0 tokens into the pool
                assert ERC20(coins[coin_idx]).transferFrom(
                    sender, self, dx, default_return_value=True
                )

                _dx = ERC20(coins[coin_idx]).balanceOf(self) - _dx

            # --------------------------- Store transferred in amount ---------------------------

            self.stored_balances[coin_idx] += _dx

            return _dx
        ```

- **`_transfer_out()`**

    ??? quote "`_transfer_out(_coin_idx: int128, _amount: uint256, receiver: address):`"

        | Input      | Type      | Description                               |
        | ---------- | --------- | ----------------------------------------- |
        | `coin_idx` | `int128`  | Index value of the token to transfer out. |
        | `_amount`  | `uint256` | Amount to transfer out.                    |
        | `receiver` | `address` | Address to send the tokens to.            |

        ```vyper
        stored_balances: DynArray[uint256, MAX_COINS]

        @internal
        def _transfer_out(_coin_idx: int128, _amount: uint256, receiver: address):
            """
            @notice Transfer a single token from the pool to receiver.
            @dev This function is called by `remove_liquidity` and
                `remove_liquidity_one`, `_exchange` and `_withdraw_admin_fees` methods.
            @param _coin_idx Index of the token to transfer out
            @param _amount Amount of token to transfer out
            @param receiver Address to send the tokens to
            """

            # 'gulp' coin balance of the pool to stored_balances here to account for
            # donations etc.
            coin_balance: uint256 = ERC20(coins[_coin_idx]).balanceOf(self)

            # ------------------------- Handle Transfers -----------------------------

            assert ERC20(coins[_coin_idx]).transfer(
                receiver, _amount, default_return_value=True
            )

            # ----------------------- Update Stored Balances -------------------------

            self.stored_balances[_coin_idx] = coin_balance - _amount
        ```


---


## **Exchange Methods**

*Two functions for token exchanges:*
 
- The regular `exchange` function.
- A novel `exchange_received` function that executes a token exchange based on the internal balances of the pool.

There is no `exchange_underlying` function, as this implementation is for plain pools and not for metapools, meaning no tokens are paired against other LP tokens.


### `exchange`
!!! description "`StableSwap.exchange(i: int128, j: int128, _dx: uint256, _min_dy: uint256, _receiver: address = msg.sender) -> uint256:`"

    Function to exchange `_dx` amount of coin `i` for coin `j` and receive a minimum amount of `_min_dy`.

    Returns: amount of output coin received (`uint256`).

    Emits: `TokenExchange`

    | Input        | Type       | Description                                        |
    | ------------ | ---------- | -------------------------------------------------- |
    | `i`          | `int128`   | Index value of input coin.                         |
    | `j`          | `int128`   | Index value of output coin.                        |
    | `_dx`        | `uint256`  | Amount of coin `i` being exchanged.               |
    | `_min_dy`    | `uint256`  | Minimum amount of coin `j` to receive.            |
    | `_receiver`  | `address`  | Receiver of the output tokens; defaults to `msg.sender`. |

    ??? quote "Source code"

        ```vyper
        event TokenExchange:
            buyer: indexed(address)
            sold_id: int128
            tokens_sold: uint256
            bought_id: int128
            tokens_bought: uint256

        @external
        @nonreentrant('lock')
        def exchange(
            i: int128,
            j: int128,
            _dx: uint256,
            _min_dy: uint256,
            _receiver: address = msg.sender,
        ) -> uint256:
            """
            @notice Perform an exchange between two coins
            @dev Index values can be found via the `coins` public getter method
            @param i Index value for the coin to send
            @param j Index value of the coin to recieve
            @param _dx Amount of `i` being exchanged
            @param _min_dy Minimum amount of `j` to receive
            @return Actual amount of `j` received
            """
            return self._exchange(
                msg.sender,
                i,
                j,
                _dx,
                _min_dy,
                _receiver,
                False
            )

        @internal
        def _exchange(
            sender: address,
            i: int128,
            j: int128,
            _dx: uint256,
            _min_dy: uint256,
            receiver: address,
            expect_optimistic_transfer: bool
        ) -> uint256:

            assert i != j  # dev: coin index out of range
            assert _dx > 0  # dev: do not exchange 0 coins

            rates: DynArray[uint256, MAX_COINS] = self._stored_rates()
            old_balances: DynArray[uint256, MAX_COINS] = self._balances()
            xp: DynArray[uint256, MAX_COINS] = self._xp_mem(rates, old_balances)

            # --------------------------- Do Transfer in -----------------------------

            # `dx` is whatever the pool received after ERC20 transfer:
            dx: uint256 = self._transfer_in(
                i,
                _dx,
                sender,
                expect_optimistic_transfer
            )

            # ------------------------------- Exchange -------------------------------

            x: uint256 = xp[i] + dx * rates[i] / PRECISION
            dy: uint256 = self.__exchange(x, xp, rates, i, j)
            assert dy >= _min_dy, "Exchange resulted in fewer coins than expected"

            # --------------------------- Do Transfer out ----------------------------

            self._transfer_out(j, dy, receiver)

            # ------------------------------------------------------------------------

            log TokenExchange(msg.sender, i, _dx, j, dy)

            return dy

        def __exchange(
            x: uint256,
            _xp: DynArray[uint256, MAX_COINS],
            rates: DynArray[uint256, MAX_COINS],
            i: int128,
            j: int128,
        ) -> uint256:

            amp: uint256 = self._A()
            D: uint256 = self.get_D(_xp, amp)
            y: uint256 = self.get_y(i, j, x, _xp, amp, D)

            dy: uint256 = _xp[j] - y - 1  # -1 just in case there were some rounding errors
            dy_fee: uint256 = dy * self._dynamic_fee((_xp[i] + x) / 2, (_xp[j] + y) / 2, self.fee) / FEE_DENOMINATOR

            # Convert all to real units
            dy = (dy - dy_fee) * PRECISION / rates[j]

            self.admin_balances[j] += (
                dy_fee * admin_fee / FEE_DENOMINATOR
            ) * PRECISION / rates[j]

            # Calculate and store state prices:
            xp: DynArray[uint256, MAX_COINS] = _xp
            xp[i] = x
            xp[j] = y
            # D is not changed because we did not apply a fee
            self.upkeep_oracles(xp, amp, D)

            return dy
        ```

    === "Example"

        ```python
        >>> expected_dy = pool.get_dy(0, 1, 10**18) * 0.99
        >>> StableSwap.exchange(0, 1, 10**18, expected_dy)
        999712
        ```

    !!!note
        This function exchanges one crvUSD for 0.999712 amount of USDV. `expected_dy` calculates the predicted input amount `j` to receive `dy` of coin `i`. This value can then be used as `_min_dy` in the `exchange` function.


### `exchange_received`
!!! description "`StableSwap.exchange_received(i: int128, j: int128, _dx: uint256, _min_dy: uint256, _receiver: address) -> uint256:`"

    !!!danger
        `exchange_received` will revert if the pool contains a rebasing asset. A pool that contains a rebasing token should have an `asset_type` of 2. If this is not the case, the pool is using an incorrect implementation, and rebases can be stolen.

    Function to exchange `_dx` amount of coin `i` for coin `j`, receiving a minimum amount of `_min_dy`. This is done **without actually transferring the coins into the pool**. The exchange is based on the change in the balance of coin `i`, eliminating the need to grant approval to the contract.

    Returns: amount of output coin received (`uint256`).

    Emits: `TokenExchange`

    | Input        | Type       | Description                                        |
    | ------------ | ---------- | -------------------------------------------------- |
    | `i`          | `int128`   | Index value of input coin.                         |
    | `j`          | `int128`   | Index value of output coin.                        |
    | `_dx`        | `uint256`  | Amount of coin `i` being exchanged.               |
    | `_min_dy`    | `uint256`  | Minimum amount of coin `j` to receive.            |
    | `_receiver`  | `address`  | Receiver of the output tokens; defaults to `msg.sender`. |


    ??? quote "Source code"

        ```vyper
        event TokenExchange:
            buyer: indexed(address)
            sold_id: int128
            tokens_sold: uint256
            bought_id: int128
            tokens_bought: uint256

        stored_balances: DynArray[uint256, MAX_COINS]

        @external
        @nonreentrant('lock')
        def exchange_received(
            i: int128,
            j: int128,
            _dx: uint256,
            _min_dy: uint256,
            _receiver: address = msg.sender,
        ) -> uint256:
            """
            @notice Perform an exchange between two coins without transferring token in
            @dev The contract swaps tokens based on a change in balance of coin[i]. The
                dx = ERC20(coin[i]).balanceOf(self) - self.stored_balances[i]. Users of
                this method are dex aggregators, arbitrageurs, or other users who do not
                wish to grant approvals to the contract: they would instead send tokens
                directly to the contract and call `exchange_received`.
                Note: This is disabled if pool contains rebasing tokens.
            @param i Index value for the coin to send
            @param j Index valie of the coin to recieve
            @param _dx Amount of `i` being exchanged
            @param _min_dy Minimum amount of `j` to receive
            @return Actual amount of `j` received
            """
            assert not 2 in asset_types  # dev: exchange_received not supported if pool contains rebasing tokens
            return self._exchange(
                msg.sender,
                i,
                j,
                _dx,
                _min_dy,
                _receiver,
                True,  # <--------------------------------------- swap optimistically.
            )

        @internal
        def _exchange(
            sender: address,
            i: int128,
            j: int128,
            _dx: uint256,
            _min_dy: uint256,
            receiver: address,
            expect_optimistic_transfer: bool
        ) -> uint256:

            assert i != j  # dev: coin index out of range
            assert _dx > 0  # dev: do not exchange 0 coins

            rates: DynArray[uint256, MAX_COINS] = self._stored_rates()
            old_balances: DynArray[uint256, MAX_COINS] = self._balances()
            xp: DynArray[uint256, MAX_COINS] = self._xp_mem(rates, old_balances)

            # --------------------------- Do Transfer in -----------------------------

            # `dx` is whatever the pool received after ERC20 transfer:
            dx: uint256 = self._transfer_in(
                i,
                _dx,
                sender,
                expect_optimistic_transfer
            )

            # ------------------------------- Exchange -------------------------------

            x: uint256 = xp[i] + dx * rates[i] / PRECISION
            dy: uint256 = self.__exchange(x, xp, rates, i, j)
            assert dy >= _min_dy, "Exchange resulted in fewer coins than expected"

            # --------------------------- Do Transfer out ----------------------------

            self._transfer_out(j, dy, receiver)

            # ------------------------------------------------------------------------

            log TokenExchange(msg.sender, i, _dx, j, dy)

            return dy

        def __exchange(
            x: uint256,
            _xp: DynArray[uint256, MAX_COINS],
            rates: DynArray[uint256, MAX_COINS],
            i: int128,
            j: int128,
        ) -> uint256:

            amp: uint256 = self._A()
            D: uint256 = self.get_D(_xp, amp)
            y: uint256 = self.get_y(i, j, x, _xp, amp, D)

            dy: uint256 = _xp[j] - y - 1  # -1 just in case there were some rounding errors
            dy_fee: uint256 = dy * self._dynamic_fee((_xp[i] + x) / 2, (_xp[j] + y) / 2, self.fee) / FEE_DENOMINATOR

            # Convert all to real units
            dy = (dy - dy_fee) * PRECISION / rates[j]

            self.admin_balances[j] += (
                dy_fee * admin_fee / FEE_DENOMINATOR
            ) * PRECISION / rates[j]

            # Calculate and store state prices:
            xp: DynArray[uint256, MAX_COINS] = _xp
            xp[i] = x
            xp[j] = y
            # D is not changed because we did not apply a fee
            self.upkeep_oracles(xp, amp, D)

            return dy
        ```

    === "Example"

        ```python
        >>> crvusd.transfer("0xe1e77de32fb301ce55871ba095fd6b8e5d9abad8", 10**18)
        >>> pool.exchange_received(0, 1, 10**18, 0)
        999712
        ```

    !!!note
        First, there needs to be a token transfer into the pool. Here, one crvUSD is transferred into the pool. Afterwards, `exchange_received` can be called to swap one crvUSD for `dy` USDV.

        More information on this method [here](../pools/overview.md#exchange_received).


### `get_dy`
!!! description "`StableSwap.get_dy(i: int128, j: int128, dx: uint256) -> uint256:`"

    Function to calculate the predicted output amount `j` to receive at the pool's current state given an input of `dx` amount of coin `i`. This is just a simple getter method; the calculation logic is within the CurveStableSwapNGViews contract. See [here](../utility_contracts/views.md#get_dy).

    Returns: predicted output amount of `j` (`uint256`).

    | Input  | Type     | Description                                |
    | ------ | -------- | ------------------------------------------ |
    | `i`    | `int128` | Index value of input coin.                 |
    | `j`    | `int128` | Index value of output coin.                |
    | `dx`   | `uint256`| Amount of input coin being exchanged.      |

    ??? quote "Source code"

        === "CurveStableSwapNG.vy"

            ```vyper
            interface Factory:
                def fee_receiver() -> address: view
                def admin() -> address: view
                def views_implementation() -> address: view

            @view
            @external
            def get_dy(i: int128, j: int128, dx: uint256) -> uint256:
                """
                @notice Calculate the current output dy given input dx
                @dev Index values can be found via the `coins` public getter method
                @param i Index value for the coin to send
                @param j Index valie of the coin to recieve
                @param dx Amount of `i` being exchanged
                @return Amount of `j` predicted
                """
                return StableSwapViews(factory.views_implementation()).get_dy(i, j, dx, self)
            ```

        === "CurveStableSwapNGViews.vy"

            ```vyper
            @view
            @external
            def get_dy(i: int128, j: int128, dx: uint256, pool: address) -> uint256:
                """
                @notice Calculate the current output dy given input dx
                @dev Index values can be found via the `coins` public getter method
                @param i Index value for the coin to send
                @param j Index valie of the coin to recieve
                @param dx Amount of `i` being exchanged
                @return Amount of `j` predicted
                """
                N_COINS: uint256 = StableSwapNG(pool).N_COINS()

                rates: DynArray[uint256, MAX_COINS] = empty(DynArray[uint256, MAX_COINS])
                balances: DynArray[uint256, MAX_COINS] = empty(DynArray[uint256, MAX_COINS])
                xp: DynArray[uint256, MAX_COINS] = empty(DynArray[uint256, MAX_COINS])
                rates, balances, xp = self._get_rates_balances_xp(pool, N_COINS)

                amp: uint256 = StableSwapNG(pool).A() * A_PRECISION
                D: uint256 = self.get_D(xp, amp, N_COINS)

                x: uint256 = xp[i] + (dx * rates[i] / PRECISION)
                y: uint256 = self.get_y(i, j, x, xp, amp, D, N_COINS)
                dy: uint256 = xp[j] - y - 1

                base_fee: uint256 = StableSwapNG(pool).fee()
                fee_multiplier: uint256 = StableSwapNG(pool).offpeg_fee_multiplier()
                fee: uint256 = self._dynamic_fee((xp[i] + x) / 2, (xp[j] + y) / 2, base_fee, fee_multiplier) * dy / FEE_DENOMINATOR

                return (dy - fee) * PRECISION / rates[j]
            ```

    === "Example"

        ```python
        >>> StableSwap.get_dy(0, 1, 10**18)
        999712
        ```


### `get_dx`
!!! description "`StableSwap.get_dx(i: int128, j: int128, dy: uint256) -> uint256:`"

    Function to calculate the predicted input amount `i` to receive `dy` of coin `j` at the pool's current state. This is just a simple getter method; the calculation logic is within the CurveStableSwapNGViews contract. See [here](../utility_contracts/views.md#get_dx).

    Returns: predicted input amount of `i` (`uint256`).

    | Input  | Type     | Description                                |
    | ------ | -------- | ------------------------------------------ |
    | `i`    | `int128` | Index value of input coin.                 |
    | `j`    | `int128` | Index value of output coin.                |
    | `dy`   | `uint256`| Amount of output coin received.            |

    ??? quote "Source code"

        === "CurveStableSwapNG.vy"

            ```vyper
            interface StableSwapViews:
                def get_dx(i: int128, j: int128, dy: uint256, pool: address) -> uint256: view
                def get_dy(i: int128, j: int128, dx: uint256, pool: address) -> uint256: view
                def dynamic_fee(i: int128, j: int128, pool: address) -> uint256: view
                def calc_token_amount(
                    _amounts: DynArray[uint256, MAX_COINS],
                    _is_deposit: bool,
                    _pool: address
                ) -> uint256: view

            @view
            @external
            def get_dx(i: int128, j: int128, dy: uint256) -> uint256:
                """
                @notice Calculate the current input dx given output dy
                @dev Index values can be found via the `coins` public getter method
                @param i Index value for the coin to send
                @param j Index valie of the coin to recieve
                @param dy Amount of `j` being received after exchange
                @return Amount of `i` predicted
                """
                return StableSwapViews(factory.views_implementation()).get_dx(i, j, dy, self)
            ```

        === "CurveStableSwapNGViews.vy"

            ```vyper
            @view
            @external
            def get_dx(i: int128, j: int128, dy: uint256, pool: address) -> uint256:
                """
                @notice Calculate the current input dx given output dy
                @dev Index values can be found via the `coins` public getter method
                @param i Index value for the coin to send
                @param j Index valie of the coin to recieve
                @param dy Amount of `j` being received after exchange
                @return Amount of `i` predicted
                """
                N_COINS: uint256 = StableSwapNG(pool).N_COINS()
                return self._get_dx(i, j, dy, pool, False, N_COINS)

            @view
            @internal
            def _get_dx(
                i: int128,
                j: int128,
                dy: uint256,
                pool: address,
                static_fee: bool,
                N_COINS: uint256
            ) -> uint256:

                rates: DynArray[uint256, MAX_COINS] = empty(DynArray[uint256, MAX_COINS])
                balances: DynArray[uint256, MAX_COINS] = empty(DynArray[uint256, MAX_COINS])
                xp: DynArray[uint256, MAX_COINS] = empty(DynArray[uint256, MAX_COINS])
                rates, balances, xp = self._get_rates_balances_xp(pool, N_COINS)

                amp: uint256 = StableSwapNG(pool).A() * A_PRECISION
                D: uint256 = self.get_D(xp, amp, N_COINS)

                base_fee: uint256 = StableSwapNG(pool).fee()
                dy_with_fee: uint256 = dy * rates[j] / PRECISION + 1

                fee: uint256 = base_fee
                if not static_fee:
                    fee_multiplier: uint256 = StableSwapNG(pool).offpeg_fee_multiplier()
                    fee = self._dynamic_fee(xp[i], xp[j], base_fee, fee_multiplier)

                y: uint256 = xp[j] - dy_with_fee * FEE_DENOMINATOR / (FEE_DENOMINATOR - fee)
                x: uint256 = self.get_y(j, i, y, xp, amp, D, N_COINS)
                return (x - xp[i]) * PRECISION / rates[i]
            ```

    === "Example"

        ```python
        >>> StableSwap.get_dx(1, 0, 10**18)
        999912
        ```


---


## **Adding and Removing Liquidity**

There are no restrictions on how liquidity can be added or removed. Liquidity can be provided or removed in any proportion. However, there are fees associated with adding and removing liquidity that depend on the balances within the pool.


### `add_liquidity`
!!! description "`StableSwap.add_liquidity(_amounts: DynArray[uint256, MAX_COINS], _min_mint_amount: uint256, _receiver: address = msg.sender) -> uint256:`"

    Function to add liquidity into the pool and mint a minimum of `_min_mint_amount` of the corresponding LP tokens to `_receiver`. A value for the minimum amount is used to prevent being front-run by MEV bots.

    Returns: amount of LP tokens received (`uint256`).

    Emits: `Transfer` and `AddLiquidity`

    | Input        | Type                           | Description                                        |
    | ------------ | ------------------------------ | -------------------------------------------------- |
    | `_amounts`   | `DynArray[uint256, MAX_COINS]`| List of coin amounts to deposit.                    |
    | `_min_amount`| `uint256`                      | Minimum amount of LP tokens to mint.               |
    | `_receiver`  | `address`                      | Receiver of the LP tokens; defaults to `msg.sender`.|

    ??? quote "Source code"

        ```vyper
        event Transfer:
            sender: indexed(address)
            receiver: indexed(address)
            value: uint256

        event AddLiquidity:
            provider: indexed(address)
            token_amounts: DynArray[uint256, MAX_COINS]
            fees: DynArray[uint256, MAX_COINS]
            invariant: uint256
            token_supply: uint256

        @external
        @nonreentrant('lock')
        def add_liquidity(
            _amounts: DynArray[uint256, MAX_COINS],
            _min_mint_amount: uint256,
            _receiver: address = msg.sender
        ) -> uint256:
            """
            @notice Deposit coins into the pool
            @param _amounts List of amounts of coins to deposit
            @param _min_mint_amount Minimum amount of LP tokens to mint from the deposit
            @param _receiver Address that owns the minted LP tokens
            @return Amount of LP tokens received by depositing
            """
            amp: uint256 = self._A()
            old_balances: DynArray[uint256, MAX_COINS] = self._balances()
            rates: DynArray[uint256, MAX_COINS] = self._stored_rates()

            # Initial invariant
            D0: uint256 = self.get_D_mem(rates, old_balances, amp)

            total_supply: uint256 = self.total_supply
            new_balances: DynArray[uint256, MAX_COINS] = old_balances

            # -------------------------- Do Transfers In -----------------------------

            for i in range(MAX_COINS_128):

                if i == N_COINS_128:
                    break

                if _amounts[i] > 0:

                    new_balances[i] += self._transfer_in(
                        i,
                        _amounts[i],
                        msg.sender,
                        False,  # expect_optimistic_transfer
                    )

                else:

                    assert total_supply != 0  # dev: initial deposit requires all coins

            # ------------------------------------------------------------------------

            # Invariant after change
            D1: uint256 = self.get_D_mem(rates, new_balances, amp)
            assert D1 > D0

            # We need to recalculate the invariant accounting for fees
            # to calculate fair user's share
            fees: DynArray[uint256, MAX_COINS] = empty(DynArray[uint256, MAX_COINS])
            mint_amount: uint256 = 0

            if total_supply > 0:

                ideal_balance: uint256 = 0
                difference: uint256 = 0
                new_balance: uint256 = 0

                ys: uint256 = (D0 + D1) / N_COINS
                xs: uint256 = 0
                _dynamic_fee_i: uint256 = 0

                # Only account for fees if we are not the first to deposit
                base_fee: uint256 = self.fee * N_COINS / (4 * (N_COINS - 1))

                for i in range(MAX_COINS_128):

                    if i == N_COINS_128:
                        break

                    ideal_balance = D1 * old_balances[i] / D0
                    difference = 0
                    new_balance = new_balances[i]

                    if ideal_balance > new_balance:
                        difference = ideal_balance - new_balance
                    else:
                        difference = new_balance - ideal_balance

                    # fee[i] = _dynamic_fee(i, j) * difference / FEE_DENOMINATOR
                    xs = unsafe_div(rates[i] * (old_balances[i] + new_balance), PRECISION)
                    _dynamic_fee_i = self._dynamic_fee(xs, ys, base_fee)
                    fees.append(_dynamic_fee_i * difference / FEE_DENOMINATOR)
                    self.admin_balances[i] += fees[i] * admin_fee / FEE_DENOMINATOR
                    new_balances[i] -= fees[i]

                xp: DynArray[uint256, MAX_COINS] = self._xp_mem(rates, new_balances)
                D1 = self.get_D(xp, amp)  # <--------------- Reuse D1 for new D value.
                mint_amount = total_supply * (D1 - D0) / D0
                self.upkeep_oracles(xp, amp, D1)

            else:

                mint_amount = D1  # Take the dust if there was any

                # (re)instantiate D oracle if totalSupply is zero.
                self.last_D_packed = self.pack_2(D1, D1)

            assert mint_amount >= _min_mint_amount, "Slippage screwed you"

            # Mint pool tokens
            total_supply += mint_amount
            self.balanceOf[_receiver] += mint_amount
            self.total_supply = total_supply
            log Transfer(empty(address), _receiver, mint_amount)

            log AddLiquidity(msg.sender, _amounts, fees, D1, total_supply)

            return mint_amount
        ```

    === "Example"

        ```python
        >>> StableSwap.add_liquidity([10000000000000000000, 0], 0)
        9997967030080774869        
        ```


### `remove_liquidity`
!!! description "`StableSwap.remove_liquidity(_burn_amount: uint256, _min_amounts: DynArray[uint256, MAX_COINS], _receiver: address = msg.sender, _claim_admin_fees: bool = True) -> DynArray[uint256, MAX_COINS]:`"

    !!!info
        When removing liquidity in a balanced ratio, there is no need to update the price oracle, as this function does not alter the balance ratio within the pool. Calling this function only updates `D_oracle`.    
        The calculation of `D` does not use Newton methods, ensuring that `remove_liquidity` should always work, even if the pool gets borked.

    Function to remove `_min_amount` coins from the liquidity pool based on the pools current ratios by burning `_burn_amount` of LP tokens. Admin fees might be claimed after liquidity is removed.

    Returns: amount of coins withdrawn (`DynArray[uint256, MAX_COINS]`).

    Emits: `RemoveLiquidity`

    | Input              | Type                           | Description                                        |
    | ------------------ | ------------------------------ | -------------------------------------------------- |
    | `_burn_amount`     | `uint256`                      | Amount of LP tokens to be burned.                 |
    | `_min_amounts`     | `DynArray[uint256, MAX_COINS]` | Minimum amounts of coins to receive.              |
    | `_receiver`        | `address`                      | Receiver of the coins; defaults to `msg.sender`.  |
    | `_claim_admin_fees`| `bool`                         | If admin fees should be claimed; defaults to `true`.|

    ??? quote "Source code"

        ```vyper
        event RemoveLiquidity:
            provider: indexed(address)
            token_amounts: DynArray[uint256, MAX_COINS]
            fees: DynArray[uint256, MAX_COINS]
            token_supply: uint256

        @external
        @nonreentrant('lock')
        def remove_liquidity(
            _burn_amount: uint256,
            _min_amounts: DynArray[uint256, MAX_COINS],
            _receiver: address = msg.sender,
            _claim_admin_fees: bool = True,
        ) -> DynArray[uint256, MAX_COINS]:
            """
            @notice Withdraw coins from the pool
            @dev Withdrawal amounts are based on current deposit ratios
            @param _burn_amount Quantity of LP tokens to burn in the withdrawal
            @param _min_amounts Minimum amounts of underlying coins to receive
            @param _receiver Address that receives the withdrawn coins
            @return List of amounts of coins that were withdrawn
            """
            total_supply: uint256 = self.total_supply
            assert _burn_amount > 0  # dev: invalid burn amount

            amounts: DynArray[uint256, MAX_COINS] = empty(DynArray[uint256, MAX_COINS])
            balances: DynArray[uint256, MAX_COINS] = self._balances()

            value: uint256 = 0
            for i in range(MAX_COINS_128):

                if i == N_COINS_128:
                    break

                value = balances[i] * _burn_amount / total_supply
                assert value >= _min_amounts[i], "Withdrawal resulted in fewer coins than expected"
                amounts.append(value)
                self._transfer_out(i, value, _receiver)

            self._burnFrom(msg.sender, _burn_amount)  # <---- Updates self.total_supply

            # --------------------------- Upkeep D_oracle ----------------------------

            ma_last_time_unpacked: uint256[2] = self.unpack_2(self.ma_last_time)
            last_D_packed_current: uint256 = self.last_D_packed
            old_D: uint256 = last_D_packed_current & (2**128 - 1)

            self.last_D_packed = self.pack_2(
                old_D - unsafe_div(old_D * _burn_amount, total_supply),  # new_D = proportionally reduce D.
                self._calc_moving_average(
                    last_D_packed_current,
                    self.D_ma_time,
                    ma_last_time_unpacked[1]
                )
            )

            if ma_last_time_unpacked[1] < block.timestamp:
                ma_last_time_unpacked[1] = block.timestamp

            self.ma_last_time = self.pack_2(ma_last_time_unpacked[0], ma_last_time_unpacked[1])

            # ------------------------------- Log event ------------------------------

            log RemoveLiquidity(
                msg.sender,
                amounts,
                empty(DynArray[uint256, MAX_COINS]),
                total_supply - _burn_amount
            )

            # ------- Withdraw admin fees if _claim_admin_fees is set to True --------
            if _claim_admin_fees:
                self._withdraw_admin_fees()

            return amounts
        ```

    === "Example"

        ```python
        >>> StableSwap.get_balances()
        [1156170050330410764719488, 1052703857490]
        >>> StableSwap.remove_liquidity(10**18, [0, 0])
        523455207306501616, 476610
        ```

    !!!note
        `remove_liquidity` removes liquidity in a balanced proportion according to the balances in the pool.


### `remove_liquidity_one_coin`
!!! description "`StableSwap.remove_liquidity_one_coin(_burn_amount: uint256, i: int128, _min_received: uint256, _receiver: address = msg.sender) -> uint256:`"

    Function to remove a minimum of `_min_received` of coin `i` by burning `_burn_amount` of LP tokens.

    Returns: coins received (`uint256`).

    Emits: `RemoveLiquidityOne`

    | Input           | Type       | Description                                        |
    | --------------- | ---------- | -------------------------------------------------- |
    | `_burn_amount` | `uint256`  | Amount of LP tokens to burn/withdraw.             |
    | `i`             | `int128`   | Index value of the coin to withdraw.              |
    | `_min_received`| `uint256`  | Minimum amount of coin to receive.                |
    | `_receiver`    | `address`  | Receiver of the coins; defaults to `msg.sender`.  |

    ??? quote "Source code"

        ```vyper
        event RemoveLiquidityOne:
            provider: indexed(address)
            token_id: int128
            token_amount: uint256
            coin_amount: uint256
            token_supply: uint256

        @external
        @nonreentrant('lock')
        def remove_liquidity_one_coin(
            _burn_amount: uint256,
            i: int128,
            _min_received: uint256,
            _receiver: address = msg.sender,
        ) -> uint256:
            """
            @notice Withdraw a single coin from the pool
            @param _burn_amount Amount of LP tokens to burn in the withdrawal
            @param i Index value of the coin to withdraw
            @param _min_received Minimum amount of coin to receive
            @param _receiver Address that receives the withdrawn coins
            @return Amount of coin received
            """
            assert _burn_amount > 0  # dev: do not remove 0 LP tokens
            dy: uint256 = 0
            fee: uint256 = 0
            xp: DynArray[uint256, MAX_COINS] = empty(DynArray[uint256, MAX_COINS])
            amp: uint256 = empty(uint256)
            D: uint256 = empty(uint256)

            dy, fee, xp, amp, D = self._calc_withdraw_one_coin(_burn_amount, i)
            assert dy >= _min_received, "Not enough coins removed"

            self.admin_balances[i] += fee * admin_fee / FEE_DENOMINATOR

            self._burnFrom(msg.sender, _burn_amount)

            self._transfer_out(i, dy, _receiver)

            log RemoveLiquidityOne(msg.sender, i, _burn_amount, dy, self.total_supply)

            self.upkeep_oracles(xp, amp, D)

            return dy

        @view
        @internal
        def _calc_withdraw_one_coin(
            _burn_amount: uint256,
            i: int128
        ) -> (
            uint256,
            uint256,
            DynArray[uint256, MAX_COINS],
            uint256,
            uint256
        ):
            # First, need to calculate
            # * Get current D
            # * Solve Eqn against y_i for D - _token_amount
            amp: uint256 = self._A()
            rates: DynArray[uint256, MAX_COINS] = self._stored_rates()
            xp: DynArray[uint256, MAX_COINS] = self._xp_mem(rates, self._balances())
            D0: uint256 = self.get_D(xp, amp)

            total_supply: uint256 = self.total_supply
            D1: uint256 = D0 - _burn_amount * D0 / total_supply
            new_y: uint256 = self.get_y_D(amp, i, xp, D1)

            base_fee: uint256 = self.fee * N_COINS / (4 * (N_COINS - 1))
            ys: uint256 = (D0 + D1) / (2 * N_COINS)
            xp_reduced: DynArray[uint256, MAX_COINS] = xp

            dx_expected: uint256 = 0
            xp_j: uint256 = 0
            xavg: uint256 = 0
            dynamic_fee: uint256 = 0

            for j in range(MAX_COINS_128):

                if j == N_COINS_128:
                    break

                dx_expected = 0
                xp_j = xp[j]

                if j == i:
                    dx_expected = xp_j * D1 / D0 - new_y
                    xavg = (xp_j + new_y) / 2
                else:
                    dx_expected = xp_j - xp_j * D1 / D0
                    xavg = xp_j

                dynamic_fee = self._dynamic_fee(xavg, ys, base_fee)
                xp_reduced[j] = xp_j - dynamic_fee * dx_expected / FEE_DENOMINATOR

            dy: uint256 = xp_reduced[i] - self.get_y_D(amp, i, xp_reduced, D1)
            dy_0: uint256 = (xp[i] - new_y) * PRECISION / rates[i]  # w/o fees
            dy = (dy - 1) * PRECISION / rates[i]  # Withdraw less to account for rounding errors

            # update xp with new_y for p calculations.
            xp[i] = new_y

            return dy, dy_0 - dy, xp, amp, D1
        ```

    === "Example"

        ```python
        >>> StableSwap.remove_liquidity_one_coin(10**18, 0, 9**18)
        1000107995665331176
        >>> StableSwap.remove_liquidity_one_coin(10**18, 1, 9**18)
        999915
        ```

    !!!note
        Both examples involve removing one LP token. With `remove_liquidity_one_coin` targeted at the higher balanced coin of the pool, a small premium is received. Conversely, when removing liquidity in the form of the lower balance token in the pool, slightly less is received. An estimated value of the output can be obtained via `calc_withdraw_one_coin`.


### `remove_liquidity_imbalance`
!!! description "`StableSwap.remove_liquidity_imbalance(_amounts: DynArray[uint256, MAX_COINS], _max_burn_amount: uint256, _receiver: address = msg.sender) -> uint256:`"

    Function to burn a maximum of `_max_burn_amount` of LP tokens in order to receive `_amounts` of underlying tokens.

    Returns: amount of LP tokens burned (`uint256`).

    Emits: `RemoveLiquidityImbalance`

    | Input              | Type                           | Description                                        |
    | ------------------ | ------------------------------ | -------------------------------------------------- |
    | `_amounts`         | `DynArray[uint256, MAX_COINS]`| List of amounts of coins to withdraw.              |
    | `_max_burn_amount` | `uint256`                      | Maximum amount of LP tokens to burn.               |
    | `_receiver`        | `address`                      | Receiver of the coins; defaults to `msg.sender`.   |

    ??? quote "Source code"

        ```vyper
        event RemoveLiquidityImbalance:
            provider: indexed(address)
            token_amounts: DynArray[uint256, MAX_COINS]
            fees: DynArray[uint256, MAX_COINS]
            invariant: uint256
            token_supply: uint256

        @external
        @nonreentrant('lock')
        def remove_liquidity_imbalance(
            _amounts: DynArray[uint256, MAX_COINS],
            _max_burn_amount: uint256,
            _receiver: address = msg.sender
        ) -> uint256:
            """
            @notice Withdraw coins from the pool in an imbalanced amount
            @param _amounts List of amounts of underlying coins to withdraw
            @param _max_burn_amount Maximum amount of LP token to burn in the withdrawal
            @param _receiver Address that receives the withdrawn coins
            @return Actual amount of the LP token burned in the withdrawal
            """
            amp: uint256 = self._A()
            rates: DynArray[uint256, MAX_COINS] = self._stored_rates()
            old_balances: DynArray[uint256, MAX_COINS] = self._balances()
            D0: uint256 = self.get_D_mem(rates, old_balances, amp)
            new_balances: DynArray[uint256, MAX_COINS] = old_balances

            for i in range(MAX_COINS_128):

                if i == N_COINS_128:
                    break

                if _amounts[i] != 0:
                    new_balances[i] -= _amounts[i]
                    self._transfer_out(i, _amounts[i], _receiver)

            D1: uint256 = self.get_D_mem(rates, new_balances, amp)
            base_fee: uint256 = self.fee * N_COINS / (4 * (N_COINS - 1))
            ys: uint256 = (D0 + D1) / N_COINS

            fees: DynArray[uint256, MAX_COINS] = empty(DynArray[uint256, MAX_COINS])
            dynamic_fee: uint256 = 0
            xs: uint256 = 0
            ideal_balance: uint256 = 0
            difference: uint256 = 0
            new_balance: uint256 = 0

            for i in range(MAX_COINS_128):

                if i == N_COINS_128:
                    break

                ideal_balance = D1 * old_balances[i] / D0
                difference = 0
                new_balance = new_balances[i]

                if ideal_balance > new_balance:
                    difference = ideal_balance - new_balance
                else:
                    difference = new_balance - ideal_balance

                xs = unsafe_div(rates[i] * (old_balances[i] + new_balance), PRECISION)
                dynamic_fee = self._dynamic_fee(xs, ys, base_fee)
                fees.append(dynamic_fee * difference / FEE_DENOMINATOR)

                self.admin_balances[i] += fees[i] * admin_fee / FEE_DENOMINATOR
                new_balances[i] -= fees[i]

            D1 = self.get_D_mem(rates, new_balances, amp)  # dev: reuse D1 for new D.

            self.upkeep_oracles(new_balances, amp, D1)

            total_supply: uint256 = self.total_supply
            burn_amount: uint256 = ((D0 - D1) * total_supply / D0) + 1
            assert burn_amount > 1  # dev: zero tokens burned
            assert burn_amount <= _max_burn_amount, "Slippage screwed you"

            total_supply -= burn_amount
            self._burnFrom(msg.sender, burn_amount)

            log RemoveLiquidityImbalance(msg.sender, _amounts, fees, D1, total_supply)

            return burn_amount
        ```

    === "Example"

        ```python
        >>> StableSwap.remove_liquidity_imbalance([10**18, 10**6] 10**19)
        1999880816717294817
        ```


### `calc_token_amount`
!!! description "`StableSwap.calc_token_amount(_amounts: DynArray[uint256, MAX_COINS], _is_deposit: bool) -> uint256:`"

    Function to calculate the addition or reduction of token supply from a deposit (add liquidity) or withdrawal (remove liquidity). This function does take fees into consideration.

    Returns: amount of LP tokens (`uint256`).

    | Input          | Type                           | Description                                        |
    | -------------- | ------------------------------ | -------------------------------------------------- |
    | `_amounts`     | `DynArray[uint256, MAX_COINS]` | Amount of coins being deposited/withdrawn.        |
    | `_is_deposit`  | `bool`                         | `true` = deposit, `false` = withdraw.             |

    ??? quote "Source code"

        === "CurveStableSwapNG.vy"

            ```vyper
            interface Factory:
                def fee_receiver() -> address: view
                def admin() -> address: view
                def views_implementation() -> address: view

            @view
            @external
            def calc_token_amount(
                _amounts: DynArray[uint256, MAX_COINS],
                _is_deposit: bool
            ) -> uint256:
                """
                @notice Calculate addition or reduction in token supply from a deposit or withdrawal
                @param _amounts Amount of each coin being deposited
                @param _is_deposit set True for deposits, False for withdrawals
                @return Expected amount of LP tokens received
                """
                return StableSwapViews(factory.views_implementation()).calc_token_amount(_amounts, _is_deposit, self)
            ```

        === "CurveStableSwapNGViews.vy"

            ```vyper
            @view
            @external
            def calc_token_amount(
                _amounts: DynArray[uint256, MAX_COINS],
                _is_deposit: bool,
                pool: address
            ) -> uint256:
                """
                @notice Calculate addition or reduction in token supply from a deposit or withdrawal
                @param _amounts Amount of each coin being deposited
                @param _is_deposit set True for deposits, False for withdrawals
                @return Expected amount of LP tokens received
                """
                amp: uint256 = StableSwapNG(pool).A() * A_PRECISION
                N_COINS: uint256 = StableSwapNG(pool).N_COINS()

                rates: DynArray[uint256, MAX_COINS] = empty(DynArray[uint256, MAX_COINS])
                old_balances: DynArray[uint256, MAX_COINS] = empty(DynArray[uint256, MAX_COINS])
                xp: DynArray[uint256, MAX_COINS] = empty(DynArray[uint256, MAX_COINS])
                rates, old_balances, xp = self._get_rates_balances_xp(pool, N_COINS)

                # Initial invariant
                D0: uint256 = self.get_D(xp, amp, N_COINS)

                total_supply: uint256 = StableSwapNG(pool).totalSupply()
                new_balances: DynArray[uint256, MAX_COINS] = old_balances
                for i in range(MAX_COINS):
                    if i == N_COINS:
                        break

                    amount: uint256 = _amounts[i]
                    if _is_deposit:
                        new_balances[i] += amount
                    else:
                        new_balances[i] -= amount

                # Invariant after change
                for idx in range(MAX_COINS):
                    if idx == N_COINS:
                        break
                    xp[idx] = rates[idx] * new_balances[idx] / PRECISION
                D1: uint256 = self.get_D(xp, amp, N_COINS)

                # We need to recalculate the invariant accounting for fees
                # to calculate fair user's share
                D2: uint256 = D1
                if total_supply > 0:

                    # Only account for fees if we are not the first to deposit
                    base_fee: uint256 = StableSwapNG(pool).fee() * N_COINS / (4 * (N_COINS - 1))
                    fee_multiplier: uint256 = StableSwapNG(pool).offpeg_fee_multiplier()
                    _dynamic_fee_i: uint256 = 0
                    xs: uint256 = 0
                    ys: uint256 = (D0 + D1) / N_COINS

                    for i in range(MAX_COINS):
                        if i == N_COINS:
                            break

                        ideal_balance: uint256 = D1 * old_balances[i] / D0
                        difference: uint256 = 0
                        new_balance: uint256 = new_balances[i]
                        if ideal_balance > new_balance:
                            difference = ideal_balance - new_balance
                        else:
                            difference = new_balance - ideal_balance

                        xs = old_balances[i] + new_balance
                        _dynamic_fee_i = self._dynamic_fee(xs, ys, base_fee, fee_multiplier)
                        new_balances[i] -= _dynamic_fee_i * difference / FEE_DENOMINATOR

                    for idx in range(MAX_COINS):
                        if idx == N_COINS:
                            break
                        xp[idx] = rates[idx] * new_balances[idx] / PRECISION

                    D2 = self.get_D(xp, amp, N_COINS)
                else:
                    return D1  # Take the dust if there was any

                diff: uint256 = 0
                if _is_deposit:
                    diff = D2 - D0
                else:
                    diff = D0 - D2
                return diff * total_supply / D0
            ```

    === "Example"

        ```python
        >>> StableSwap.calc_token_amount([10**18, 0], True) # deposit (coin[0])
        999701503692424994
        >>> StableSwap.calc_token_amount([0, 10**6], True) # deposit (coin[1])
        999875942505458416
        >>> StableSwap.calc_token_amount([10**18, 10**6], True) # deposit (coin[0] and coin[1])
        1999863130101592370
        >>> StableSwap.calc_token_amount([10**18, 0], False) # withdraw (coin[1])
        999987187514411723
        >>> StableSwap.calc_token_amount([10**18, 0], False) # withdraw (coin[0])
        1000188312578139610
        >>> StableSwap.calc_token_amount([10**18, 10**6], False) # withdraw (coin[0] and coin[1])
        1999889816188803581
        ```

    !!!note
        If `_is_deposit` is True, the method calculates the increase in LP token supply when adding `_amounts` of tokens to the pool. Conversely, when `_is_deposit` is False, the method calculates the decrease in LP token supply when removing `_amounts` of tokens from the pool. This is a `view` function and does not actually alter any states.




### `calc_withdraw_one_coin`
!!! description "`StableSwap.calc_withdraw_one_coin(_burn_amount: uint256, i: int128) -> uint256:`"

    Function to calculate the amount of single token `i` withdrawn when burning `_burn_amount` LP tokens.

    Returns: amount of tokens withdrawn (`uint256`).

    | Input           | Type      | Description                                        |
    | --------------- | --------- | -------------------------------------------------- |
    | `_burn_amount` | `uint256` | Amount of LP tokens to burn.                       |
    | `i`             | `int128`  | Index value of the coin to withdraw.              |

    ??? quote "Source code"

        ```vyper
        @view
        @external
        def calc_withdraw_one_coin(_burn_amount: uint256, i: int128) -> uint256:
            """
            @notice Calculate the amount received when withdrawing a single coin
            @param _burn_amount Amount of LP tokens to burn in the withdrawal
            @param i Index value of the coin to withdraw
            @return Amount of coin received
            """
            return self._calc_withdraw_one_coin(_burn_amount, i)[0]

        @view
        @internal
        def _calc_withdraw_one_coin(
            _burn_amount: uint256,
            i: int128
        ) -> (
            uint256,
            uint256,
            DynArray[uint256, MAX_COINS],
            uint256,
            uint256
        ):
            # First, need to calculate
            # * Get current D
            # * Solve Eqn against y_i for D - _token_amount
            amp: uint256 = self._A()
            rates: DynArray[uint256, MAX_COINS] = self._stored_rates()
            xp: DynArray[uint256, MAX_COINS] = self._xp_mem(rates, self._balances())
            D0: uint256 = self.get_D(xp, amp)

            total_supply: uint256 = self.total_supply
            D1: uint256 = D0 - _burn_amount * D0 / total_supply
            new_y: uint256 = self.get_y_D(amp, i, xp, D1)

            base_fee: uint256 = self.fee * N_COINS / (4 * (N_COINS - 1))
            ys: uint256 = (D0 + D1) / (2 * N_COINS)
            xp_reduced: DynArray[uint256, MAX_COINS] = xp

            dx_expected: uint256 = 0
            xp_j: uint256 = 0
            xavg: uint256 = 0
            dynamic_fee: uint256 = 0

            for j in range(MAX_COINS_128):

                if j == N_COINS_128:
                    break

                dx_expected = 0
                xp_j = xp[j]

                if j == i:
                    dx_expected = xp_j * D1 / D0 - new_y
                    xavg = (xp_j + new_y) / 2
                else:
                    dx_expected = xp_j - xp_j * D1 / D0
                    xavg = xp_j

                dynamic_fee = self._dynamic_fee(xavg, ys, base_fee)
                xp_reduced[j] = xp_j - dynamic_fee * dx_expected / FEE_DENOMINATOR

            dy: uint256 = xp_reduced[i] - self.get_y_D(amp, i, xp_reduced, D1)
            dy_0: uint256 = (xp[i] - new_y) * PRECISION / rates[i]  # w/o fees
            dy = (dy - 1) * PRECISION / rates[i]  # Withdraw less to account for rounding errors

            # update xp with new_y for p calculations.
            xp[i] = new_y

            return dy, dy_0 - dy, xp, amp, D1
        ```

    === "Example"

        ```python
        >>> StableSwap.calc_withdraw_one_coin(10**18, 0)
        1000107987022361129
        >>> StableSwap.calc_withdraw_one_coin(10**18, 1)
        999915
        >>> StableSwap.get_balances()
        [1156160050449617680048138, 1052703857609] 
        ```


---


## **Fee Methods**

Stableswap-ng introduces a dynamic fee based on the imbalance of the coins within the pool and their pegs:

??? quote "`_dynamic_fee`"

    ```vyper
    offpeg_fee_multiplier: public(uint256)  # * 1e10

    @view
    @internal
    def _dynamic_fee(xpi: uint256, xpj: uint256, _fee: uint256) -> uint256:

        _offpeg_fee_multiplier: uint256 = self.offpeg_fee_multiplier
        if _offpeg_fee_multiplier <= FEE_DENOMINATOR:
            return _fee

        xps2: uint256 = (xpi + xpj) ** 2
        return (
            (_offpeg_fee_multiplier * _fee) /
            ((_offpeg_fee_multiplier - FEE_DENOMINATOR) * 4 * xpi * xpj / xps2 + FEE_DENOMINATOR)
        )
    ```

More on dynamic fees [here](../pools/overview.md#dynamic-fees).


### `fee`
!!! description "`StableSwap.fee() -> uint256: view`"

    Getter method for the fee of the pool. This is the value set when initializing the contract and can be changed via [`set_new_fee`](../pools/admin_controls.md#set_new_fee).

    Returns: fee (`uint256`).

    ??? quote "Source code"

        ```vyper
        fee: public(uint256)  # fee * 1e10

        @external
        def __init__(
            _name: String[32],
            _symbol: String[10],
            _A: uint256,
            _fee: uint256,
            _offpeg_fee_multiplier: uint256,
            _ma_exp_time: uint256,
            _coins: DynArray[address, MAX_COINS],
            _rate_multipliers: DynArray[uint256, MAX_COINS],
            _asset_types: DynArray[uint8, MAX_COINS],
            _method_ids: DynArray[bytes4, MAX_COINS],
            _oracles: DynArray[address, MAX_COINS],
        ):
            ...

            self.fee = _fee

            ...
        ```

    === "Example"

        ```python
        >>> StableSwap.fee()
        1000000
        ```

    !!!note
        The method returns an integer with with 1e10 precision.


### `dynamic_fee`
!!! description "`StableSwap.dynamic_fee(i: int128, j: int128) -> uint256:`"

    Getter for the swap fee when exchanging between `i` and `j`. The swap fee is expressed as an integer with a 1e10 precision.

    Returns: dynamic fee (`uint256`).

    | Input  | Type     | Description                                |
    | ------ | -------- | ------------------------------------------ |
    | `i`    | `int128` | Index value of input coin.                 |
    | `j`    | `int128` | Index value of output coin.                |

    ??? quote "Source code"

        === "CurveStableSwapNG.vy"

            ```vyper
            @view
            @external
            def dynamic_fee(i: int128, j: int128) -> uint256:
                """
                @notice Return the fee for swapping between `i` and `j`
                @param i Index value for the coin to send
                @param j Index value of the coin to recieve
                @return Swap fee expressed as an integer with 1e10 precision
                """
                return StableSwapViews(factory.views_implementation()).dynamic_fee(i, j, self)
            ```

        === "CurveStableSwapNGViews.vy"

            ```vyper
            @view
            @external
            def dynamic_fee(i: int128, j: int128, pool:address) -> uint256:
                """
                @notice Return the fee for swapping between `i` and `j`
                @param i Index value for the coin to send
                @param j Index value of the coin to recieve
                @return Swap fee expressed as an integer with 1e10 precision
                """
                N_COINS: uint256 = StableSwapNG(pool).N_COINS()
                fee: uint256 = StableSwapNG(pool).fee()
                fee_multiplier: uint256 = StableSwapNG(pool).offpeg_fee_multiplier()

                rates: DynArray[uint256, MAX_COINS] = empty(DynArray[uint256, MAX_COINS])
                balances: DynArray[uint256, MAX_COINS] = empty(DynArray[uint256, MAX_COINS])
                xp: DynArray[uint256, MAX_COINS] = empty(DynArray[uint256, MAX_COINS])
                rates, balances, xp = self._get_rates_balances_xp(pool, N_COINS)

                return self._dynamic_fee(xp[i], xp[j], fee, fee_multiplier)

            @view
            @internal
            def _dynamic_fee(xpi: uint256, xpj: uint256, _fee: uint256, _fee_multiplier: uint256) -> uint256:

                if _fee_multiplier <= FEE_DENOMINATOR:
                    return _fee

                xps2: uint256 = (xpi + xpj) ** 2
                return (
                    (_fee_multiplier * _fee) /
                    ((_fee_multiplier - FEE_DENOMINATOR) * 4 * xpi * xpj / xps2 + FEE_DENOMINATOR)
                )

            @view
            @internal
            def _get_rates_balances_xp(pool: address, N_COINS: uint256) -> (
                DynArray[uint256, MAX_COINS],
                DynArray[uint256, MAX_COINS],
                DynArray[uint256, MAX_COINS],
            ):

                rates: DynArray[uint256, MAX_COINS] = StableSwapNG(pool).stored_rates()
                balances: DynArray[uint256, MAX_COINS] = StableSwapNG(pool).get_balances()
                xp: DynArray[uint256, MAX_COINS] = empty(DynArray[uint256, MAX_COINS])
                for idx in range(MAX_COINS):
                    if idx == N_COINS:
                        break
                    xp.append(rates[idx] * balances[idx] / PRECISION)

                return rates, balances, xp
            ```

    === "Example"

        ```python
        >>> StableSwap.dynamic_fee(0, 1)
        1001758
        ```

    !!!note
        The method returns an integer with with 1e10 precision.


### `admin_fee`
!!! description "`StableSwap.admin_fee() -> uint256: view`"

    Getter for the admin fee. It is a constant and is set to 50% (5000000000).

    Returns: admin fee (`uint256`).

    ??? quote "Source code"

        ```vyper
        admin_fee: public(constant(uint256)) = 5000000000
        ```

    === "Example"

        ```python
        >>> StableSwap.admin_fee()
        5000000000
        ```

    !!!note
        The method returns an integer with with 1e10 precision.


### `offpeg_fee_multiplier`
!!! description "`StableSwap.offpeg_fee_multiplier() -> uint256: view`"

    Getter method for the off-peg fee multiplier. This value determines how much the fee increases when assets within the AMM depeg. This value can be changed via [`set_new_fee`](../pools/admin_controls.md#set_new_fee).

    Returns: offpeg fee multiplier (`uint256`)

    ??? quote "Source code"

        ```vyper
        offpeg_fee_multiplier: public(uint256)  # * 1e10

        @external
        def __init__(
            _name: String[32],
            _symbol: String[10],
            _A: uint256,
            _fee: uint256,
            _offpeg_fee_multiplier: uint256,
            _ma_exp_time: uint256,
            _coins: DynArray[address, MAX_COINS],
            _rate_multipliers: DynArray[uint256, MAX_COINS],
            _asset_types: DynArray[uint8, MAX_COINS],
            _method_ids: DynArray[bytes4, MAX_COINS],
            _oracles: DynArray[address, MAX_COINS],
        ):
            ...

            self.offpeg_fee_multiplier = _offpeg_fee_multiplier

            ...
        ```

    === "Example"

        ```python
        >>> StableSwap.offpeg_fee_multiplier()
        50000000000
        ```

    !!!note
        The method returns an integer with with 1e10 precision.


### `stored_rates`
!!! description "`StableSwap.stored_rates() -> DynArray[uint256, MAX_COINS]:`"

    Getter for the rate multiplier of each coin.

    Returns: stored rates (`DynArray[uint256, MAX_COINS]`).

    !!!info
        If the coin has a rate oracle that has been properly initialized, this method queries that rate by static-calling an external contract.

    ??? quote "Source code"

        ```vyper
        rate_multipliers: immutable(DynArray[uint256, MAX_COINS])
        # [bytes4 method_id][bytes8 <empty>][bytes20 oracle]
        oracles: DynArray[uint256, MAX_COINS]

        @view
        @external
        def stored_rates() -> DynArray[uint256, MAX_COINS]:
            return self._stored_rates()

        @view
        @internal
        def _stored_rates() -> DynArray[uint256, MAX_COINS]:
            """
            @notice Gets rate multipliers for each coin.
            @dev If the coin has a rate oracle that has been properly initialised,
                this method queries that rate by static-calling an external
                contract.
            """
            rates: DynArray[uint256, MAX_COINS] = rate_multipliers
            oracles: DynArray[uint256, MAX_COINS] = self.oracles

            for i in range(MAX_COINS_128):

                if i == N_COINS_128:
                    break

                if asset_types[i] == 1 and not oracles[i] == 0:

                    # NOTE: fetched_rate is assumed to be 10**18 precision
                    fetched_rate: uint256 = convert(
                        raw_call(
                            convert(oracles[i] % 2**160, address),
                            _abi_encode(oracles[i] & ORACLE_BIT_MASK),
                            max_outsize=32,
                            is_static_call=True,
                        ),
                        uint256
                    )

                    rates[i] = unsafe_div(rates[i] * fetched_rate, PRECISION)

                elif asset_types[i] == 3:  # ERC4626

                    # fetched_rate: uint256 = ERC4626(coins[i]).convertToAssets(call_amount[i]) * scale_factor[i]
                    # here: call_amount has ERC4626 precision, but the returned value is scaled up to 18
                    # using scale_factor which is (18 - n) if underlying asset has n decimals.
                    rates[i] = unsafe_div(
                        rates[i] * ERC4626(coins[i]).convertToAssets(call_amount[i]) * scale_factor[i],
                        PRECISION
                    )  # 1e18 precision

            return rates
        ```

    === "Example"

        ```python
        >>> StableSwap.stored_rates()
        [1000000000000000000, 1000000000000000000000000000000]
        ```


### `admin_balances`
!!! description "`StableSwap.admin_balances(arg0: uint256) -> uint256: view`"

    Getter for the accumulated admin balance of the pool for a coin. These values essentially represent the claimable admin fee.

    Returns: admin balances (`uint256`).

    | Input  | Type      | Description                                |
    | ------ | --------- | ------------------------------------------ |
    | `arg0` | `uint256` | Index value of the coin.                   |

    ??? quote "Source code"

        ```vyper
        admin_balances: public(DynArray[uint256, MAX_COINS])
        ```

    === "Example"

        ```python
        >>> StableSwap.admin_balances(0)
        38117658162246205676
        >>> StableSwap.admin_balances(1)
        10683574
        ```


### `withdraw_admin_fees`
!!! description "`StableSwap.withdraw_admin_fees():`"

    Function to withdraw accumulated admin fees from the pool and send them to the `fee_receiver` set in the Factory.

    ??? quote "Source code"

        ```vyper
        interface Factory:
            def fee_receiver() -> address: view
            def admin() -> address: view
            def views_implementation() -> address: view

        admin_balances: public(DynArray[uint256, MAX_COINS])

        @external
        def withdraw_admin_fees():
            """
            @notice Claim admin fees. Callable by anyone.
            """
            self._withdraw_admin_fees()

        @internal
        def _withdraw_admin_fees():
            fee_receiver: address = factory.fee_receiver()
            assert fee_receiver != empty(address)  # dev: fee receiver not set

            admin_balances: DynArray[uint256, MAX_COINS] = self.admin_balances
            for i in range(MAX_COINS_128):

                if i == N_COINS_128:
                    break

                if admin_balances[i] > 0:

                    self._transfer_out(i, admin_balances[i], fee_receiver)
                    admin_balances[i] = 0

            self.admin_balances = admin_balances
        ```

    === "Example"

        ```python
        >>> StableSwap.withdraw_admin_fees()
        ```


---


## **Oracle Methods**

Stableswap-ng contains two different oracles:

- `price_oracle`: Exponential Moving Average (EMA) oracle representing the price of an asset within the AMM with respect to the token at index 0.
- `D_oracle`: EMA oracle for the D invariant. 

For full documentation on the available oracles, their update mechanisms, and functionality, please refer to the [Oracles](./oracles.md) section.


### `price_oracle`
!!! description "`StableSwap.price_oracle(i: uint256) -> uint256:`"

    Function to calculate the exponential moving average (EMA) price for the coin at index value `i` with regard to the coin at index 0.

    Returns: price oracle (`uint256`).

    | Input  | Type      | Description                        |
    | ------ | --------- | ---------------------------------- |
    | `i`    | `uint256` | Index value of the coin.           |

    ??? quote "Source code"

        ```vyper
        last_prices_packed: DynArray[uint256, MAX_COINS]  #  packing: last_price, ma_price
        last_D_packed: uint256                            #  packing: last_D, ma_D
        ma_exp_time: public(uint256)
        D_ma_time: public(uint256)
        ma_last_time: public(uint256)                     # packing: ma_last_time_p, ma_last_time_D
        # ma_last_time has a distinction for p and D because p is _not_ updated if
        # users remove_liquidity, but D is.

        @external
        @view
        @nonreentrant('lock')
        def price_oracle(i: uint256) -> uint256:
            return self._calc_moving_average(
                self.last_prices_packed[i],
                self.ma_exp_time,
                self.ma_last_time & (2**128 - 1)
            )

        @internal
        @view
        def _calc_moving_average(
            packed_value: uint256,
            averaging_window: uint256,
            ma_last_time: uint256
        ) -> uint256:

            last_spot_value: uint256 = packed_value & (2**128 - 1)
            last_ema_value: uint256 = (packed_value >> 128)

            if ma_last_time < block.timestamp:  # calculate new_ema_value and return that.
                alpha: uint256 = self.exp(
                    -convert(
                        (block.timestamp - ma_last_time) * 10**18 / averaging_window, int256
                    )
                )
                return (last_spot_value * (10**18 - alpha) + last_ema_value * alpha) / 10**18

            return last_ema_value
        ```

    === "Example"

        ```python
        >>> StableSwap.price_oracle(0)
        1000187813326452556
        ```


### `last_price`
!!! description "`StableSwap.last_price(i: uint256) -> uint256:`"

    !!!warning "Revert"
        This function reverts if `i >= MAX_COINS`.

    Getter method for the last price (often referred to as the spot price) for the coin at index value `i` stored in `last_prices_packed`. The spot price is retrieved from the lower 128 bits of the packed value in `last_prices_packed`.

    The last prices are updated whenever the internal `upkeep_oracles()` function is called.

    Returns: last price of token `i` (`uint256`).

    | Input  | Type      | Description                        |
    | ------ | --------- | ---------------------------------- |
    | `i`    | `uint256` | Index value of the coin.           |

    ??? quote "Source code"

        ```vyper
        last_prices_packed: DynArray[uint256, MAX_COINS]  #  packing: last_price, ma_price

        @view
        @external
        def last_price(i: uint256) -> uint256:
            return self.last_prices_packed[i] & (2**128 - 1)
        ```

    === "Example"

        ```python
        >>> StableSwap.last_price(0)
        1000187811171795736
        ```


### `ema_price`
!!! description "`StableSwap.ema_price(i: uint256) -> uint256:`"

    !!!warning "Revert"
        This function reverts if `i >= MAX_COINS`.

    Getter method for the EMA (exponential moving average) price for the coin at index value `i` stored in `last_prices_packed`. The EMA price is extracted by shifting the packed value in `last_prices_packed` to the right by 128 bits.

    The EMA price is updated whenever the internal `upkeep_oracles()` function is called.

    Returns: EMA price of coin `i` (`uint256`).

    | Input  | Type      | Description                        |
    | ------ | --------- | ---------------------------------- |
    | `i`    | `uint256` | Index value of the coin.           |

    ??? quote "Source code"

        ```vyper 
        last_prices_packed: DynArray[uint256, MAX_COINS]  #  packing: last_price, ma_price

        @view
        @external
        def ema_price(i: uint256) -> uint256:
            return (self.last_prices_packed[i] >> 128)
        ```

    === "Example"

        ```python
        >>> StableSwap.ema_price(0)
        1000187824576102231
        ```


### `get_p`
!!! description "`StableSwap.get_p(i: uint256) -> uint256:`"

    !!!info
        `i = 0` will return the state price of `coin[1]`.

    Getter for the AMM state price for the coin at index value `i`.

    Returns: state price (`uint256`).

    | Input  | Type      | Description                 |
    | ------ | --------- | --------------------------- |
    | `i`    | `uint256` | Index of state price.       |

    ??? quote "Source code"

        ```vyper 
        @external
        @view
        def get_p(i: uint256) -> uint256:
            """
            @notice Returns the AMM State price of token
            @dev if i = 0, it will return the state price of coin[1].
            @param i index of state price (0 for coin[1], 1 for coin[2], ...)
            @return uint256 The state price quoted by the AMM for coin[i+1]
            """
            amp: uint256 = self._A()
            xp: DynArray[uint256, MAX_COINS] = self._xp_mem(
                self._stored_rates(), self._balances()
            )
            D: uint256 = self.get_D(xp, amp)
            return self._get_p(xp, amp, D)[i]

        @internal
        @pure
        def _get_p(
            xp: DynArray[uint256, MAX_COINS],
            amp: uint256,
            D: uint256,
        ) -> DynArray[uint256, MAX_COINS]:

            # dx_0 / dx_1 only, however can have any number of coins in pool
            ANN: uint256 = unsafe_mul(amp, N_COINS)
            Dr: uint256 = unsafe_div(D, pow_mod256(N_COINS, N_COINS))

            for i in range(MAX_COINS_128):

                if i == N_COINS_128:
                    break

                Dr = Dr * D / xp[i]

            p: DynArray[uint256, MAX_COINS] = empty(DynArray[uint256, MAX_COINS])
            xp0_A: uint256 = ANN * xp[0] / A_PRECISION

            for i in range(1, MAX_COINS):

                if i == N_COINS:
                    break

                p.append(10**18 * (xp0_A + Dr * xp[0] / xp[i]) / (xp0_A + Dr))

            return p
        ```

    === "Example"

        ```python
        >>> StableSwap.get_p(0)
        1000187811171795736
        ```


### `ma_exp_time`
!!! description "`StableSwap.ma_exp_time() -> uint256: view`"

    Getter for the exponential moving average time. This value can be adjusted via `set_ma_exp_time()`, see [admin controls](../pools/admin_controls.md#set_ma_exp_time).

    Returns: EMA time (`uint256`). 

    ??? quote "Source code"

        ```vyper 
        ma_exp_time: public(uint256)
        ```

    === "Example"

        ```python
        >>> StableSwap.ma_exp_time()
        866
        ```


### `D_oracle`
!!! description "`StableSwap.D_oracle() -> uint256:`"

    Getter for the current ema oracle value for D.

    Returns: ema of D (`uint256`).

    ??? quote "Source code"

        ```vyper
        last_prices_packed: DynArray[uint256, MAX_COINS]  #  packing: last_price, ma_price
        last_D_packed: uint256                            #  packing: last_D, ma_D
        ma_exp_time: public(uint256)
        D_ma_time: public(uint256)
        ma_last_time: public(uint256)                     # packing: ma_last_time_p, ma_last_time_D
        # ma_last_time has a distinction for p and D because p is _not_ updated if
        # users remove_liquidity, but D is.

        @external
        @view
        @nonreentrant('lock')
        def D_oracle() -> uint256:
            return self._calc_moving_average(
                self.last_D_packed,
                self.D_ma_time,
                self.ma_last_time >> 128
            )

        @internal
        @view
        def _calc_moving_average(
            packed_value: uint256,
            averaging_window: uint256,
            ma_last_time: uint256
        ) -> uint256:

            last_spot_value: uint256 = packed_value & (2**128 - 1)
            last_ema_value: uint256 = (packed_value >> 128)

            if ma_last_time < block.timestamp:  # calculate new_ema_value and return that.
                alpha: uint256 = self.exp(
                    -convert(
                        (block.timestamp - ma_last_time) * 10**18 / averaging_window, int256
                    )
                )
                return (last_spot_value * (10**18 - alpha) + last_ema_value * alpha) / 10**18

            return last_ema_value
        ```

    === "Example"

        ```python
        >>> StableSwap.D_oracle()
        2183776033162328612308290
        ```


### `D_ma_time`
!!! description "`StableSwap.D_ma_time() -> uint256: view`"

    Getter for the exponential moving average time for D. This value can be adjusted via `set_ma_exp_time()`, see [admin controls](../pools/admin_controls.md#set_ma_exp_time).
    
    Returns: D EMA time (`uint256`). 

    ??? quote "Source code"

        ```vyper 
        D_ma_time: public(uint256)
        ```

    === "Example"

        ```python
        >>> StableSwap.D_ma_time()
        62324
        ```


### `ma_last_time`
!!! description "`StableSwap.ma_last_time() -> uint256: view`"

    Getter for the last time the moving average (MA) was updated. This variable contains two packed values: *ma_last_time_p* and *ma_last_time_D*, as they are not always updated simultaneously. For instance, when users `remove_liquidity`, ma_last_time of p is not updated, but D is. Other than that, both values are updated simultaneously. 

    Returns: last ma time (`uint256`).

    ??? quote "Source code"

        ```vyper 
        ma_last_time: public(uint256)                     # packing: ma_last_time_p, ma_last_time_D
        # ma_last_time has a distinction for p and D because p is _not_ updated if
        # users remove_liquidity, but D is.
        ```

    === "Example"

        ```python
        >>> StableSwap.ma_last_time()
        579359617954437487117250992339883299967854142015
        ```

    !!!note
        This value needs to be unpacked, as it contains two variables (`ma_last_time_p`, `ma_last_time_D`). The value 579359617954437487117250992339883299967854142015 is unpacked into two uint256 numbers. First, its lower 128 bits are isolated using a bitwise AND with 2**128 − 1, and then the value is shifted right by 128 bits to extract the upper 128 bits. It returns: [1702584895,1702584895].



### `get_virtual_price`
!!! description "`StableSwap.get_virtual_price() -> uint256:`"

    !!!danger "Attack Vector"
        This method may be vulnerable to donation-style attacks if the implementation contains rebasing tokens. For integrators, caution is advised.

    Getter for the current virtual price of the LP token, which represents a price relative to the underlying.

    Returns: virtual price (`uint256`).

    ??? quote "Source code"

        ```vyper
        @view
        @external
        @nonreentrant('lock')
        def get_virtual_price() -> uint256:
            """
            @notice The current virtual price of the pool LP token
            @dev Useful for calculating profits.
                The method may be vulnerable to donation-style attacks if implementation
                contains rebasing tokens. For integrators, caution is advised.
            @return LP token virtual price normalized to 1e18
            """
            amp: uint256 = self._A()
            xp: DynArray[uint256, MAX_COINS] = self._xp_mem(
                self._stored_rates(), self._balances()
            )
            D: uint256 = self.get_D(xp, amp)
            # D is in the units similar to DAI (e.g. converted to precision 1e18)
            # When balanced, D = n * x_u - total virtual value of the portfolio
            return D * PRECISION / self.total_supply
        ```

    === "Example"

        ```python
        >>> StableSwap.get_virtual_price()
        1000063971106330426
        ```

    !!!note
        The method returns `virtual_price` as an integer with 1e18 precision.



---


## **Amplification Coefficient**

The amplification coefficient **`A`** determines a pool’s tolerance for imbalance between the assets within it. A higher value means that trades will incur slippage sooner as the assets within the pool become imbalanced.

The appropriate value for A is dependent upon the type of coin being used within the pool, and is subject to optimisation and pool-parameter update based on the market history of the trading pair. It is possible to modify the amplification coefficient for a pool after it has been deployed. This can be done via the `ramp_A` function. See [admin controls](../pools/admin_controls.md#ramp_a).

When a ramping of A has been initialized, the process can be stopped by calling the function [`stop_ramp_A()`](../pools/admin_controls.md#stop_ramp_a).

### `A`
!!! description "`StableSwap.A() -> uint256:`"

    Getter for the amplification coefficient A.

    Returns: A (`uint256`).

    ??? quote "Source code"

        ```vyper
        A_PRECISION: constant(uint256) = 100
        MAX_A: constant(uint256) = 10 ** 6
        MAX_A_CHANGE: constant(uint256) = 10

        initial_A: public(uint256)
        future_A: public(uint256)
        initial_A_time: public(uint256)
        future_A_time: public(uint256)

        @view
        @external
        def A() -> uint256:
            return self._A() / A_PRECISION

        @view
        @internal
        def _A() -> uint256:
            """
            Handle ramping A up or down
            """
            t1: uint256 = self.future_A_time
            A1: uint256 = self.future_A

            if block.timestamp < t1:
                A0: uint256 = self.initial_A
                t0: uint256 = self.initial_A_time
                # Expressions in uint256 cannot have negative numbers, thus "if"
                if A1 > A0:
                    return A0 + (A1 - A0) * (block.timestamp - t0) / (t1 - t0)
                else:
                    return A0 - (A0 - A1) * (block.timestamp - t0) / (t1 - t0)

            else:  # when t1 == 0 or block.timestamp >= t1
                return A1
        ```

    === "Example"

        ```python
        >>> StableSwap.A()
        500
        ```


### `A_precise`
!!! description "`StableSwap.A_precise() -> uint256:`"

    Getter for the precise A value, which is not divided by `A_PRECISION` unlike `A()`.

    Returns: precise A (`uint256`).

    ??? quote "Source code"

        ```vyper
        A_PRECISION: constant(uint256) = 100
        MAX_A: constant(uint256) = 10 ** 6
        MAX_A_CHANGE: constant(uint256) = 10

        initial_A: public(uint256)
        future_A: public(uint256)
        initial_A_time: public(uint256)
        future_A_time: public(uint256)

        @view
        @external
        def A_precise() -> uint256:
            return self._A()

        @view
        @internal
        def _A() -> uint256:
            """
            Handle ramping A up or down
            """
            t1: uint256 = self.future_A_time
            A1: uint256 = self.future_A

            if block.timestamp < t1:
                A0: uint256 = self.initial_A
                t0: uint256 = self.initial_A_time
                # Expressions in uint256 cannot have negative numbers, thus "if"
                if A1 > A0:
                    return A0 + (A1 - A0) * (block.timestamp - t0) / (t1 - t0)
                else:
                    return A0 - (A0 - A1) * (block.timestamp - t0) / (t1 - t0)

            else:  # when t1 == 0 or block.timestamp >= t1
                return A1
        ```

    === "Example"

        ```python
        >>> StableSwap.A_precise()
        50000
        ```


### `initial_A`
!!! description "`StableSwap.initial_A() -> uint256: view`"

    Getter for the initial A value.

    Returns: initial A (`uint256`).

    ??? quote "Source code"

        ```vyper
        A_PRECISION: constant(uint256) = 100
        MAX_A: constant(uint256) = 10 ** 6
        MAX_A_CHANGE: constant(uint256) = 10

        initial_A: public(uint256)
        future_A: public(uint256)
        initial_A_time: public(uint256)
        future_A_time: public(uint256)

        @external
        def ramp_A(_future_A: uint256, _future_time: uint256):
            assert msg.sender == factory.admin()  # dev: only owner
            assert block.timestamp >= self.initial_A_time + MIN_RAMP_TIME
            assert _future_time >= block.timestamp + MIN_RAMP_TIME  # dev: insufficient time

            _initial_A: uint256 = self._A()
            _future_A_p: uint256 = _future_A * A_PRECISION

            assert _future_A > 0 and _future_A < MAX_A
            if _future_A_p < _initial_A:
                assert _future_A_p * MAX_A_CHANGE >= _initial_A
            else:
                assert _future_A_p <= _initial_A * MAX_A_CHANGE

            self.initial_A = _initial_A
            self.future_A = _future_A_p
            self.initial_A_time = block.timestamp
            self.future_A_time = _future_time

            log RampA(_initial_A, _future_A_p, block.timestamp, _future_time)
        ```

    === "Example"

        ```python
        >>> StableSwap.initial_A()
        50000
        ```


### `future_A`
!!! description "`StableSwap.future_A() -> uint256: view`"

    Getter for the future A value. This value is adjusted when ramping A.

    Returns: future A (`uint256`).

    ??? quote "Source code"

        ```vyper
        A_PRECISION: constant(uint256) = 100
        MAX_A: constant(uint256) = 10 ** 6
        MAX_A_CHANGE: constant(uint256) = 10

        initial_A: public(uint256)
        future_A: public(uint256)
        initial_A_time: public(uint256)
        future_A_time: public(uint256)

        @external
        def ramp_A(_future_A: uint256, _future_time: uint256):
            assert msg.sender == factory.admin()  # dev: only owner
            assert block.timestamp >= self.initial_A_time + MIN_RAMP_TIME
            assert _future_time >= block.timestamp + MIN_RAMP_TIME  # dev: insufficient time

            _initial_A: uint256 = self._A()
            _future_A_p: uint256 = _future_A * A_PRECISION

            assert _future_A > 0 and _future_A < MAX_A
            if _future_A_p < _initial_A:
                assert _future_A_p * MAX_A_CHANGE >= _initial_A
            else:
                assert _future_A_p <= _initial_A * MAX_A_CHANGE

            self.initial_A = _initial_A
            self.future_A = _future_A_p
            self.initial_A_time = block.timestamp
            self.future_A_time = _future_time

            log RampA(_initial_A, _future_A_p, block.timestamp, _future_time)
        ```

    === "Example"

        ```python
        >>> StableSwap.future_A()
        50000
        ```


### `initial_A_time`
!!! description "`StableSwap.initial_A_time() -> uint256: view`"

    Getter for the initial A time. This is the timestamp when ramping A was initialized.

    Returns: initial A time (`uint256`).

    ??? quote "Source code"

        ```vyper
        A_PRECISION: constant(uint256) = 100
        MAX_A: constant(uint256) = 10 ** 6
        MAX_A_CHANGE: constant(uint256) = 10

        initial_A: public(uint256)
        future_A: public(uint256)
        initial_A_time: public(uint256)
        future_A_time: public(uint256)

        @external
        def ramp_A(_future_A: uint256, _future_time: uint256):
            assert msg.sender == factory.admin()  # dev: only owner
            assert block.timestamp >= self.initial_A_time + MIN_RAMP_TIME
            assert _future_time >= block.timestamp + MIN_RAMP_TIME  # dev: insufficient time

            _initial_A: uint256 = self._A()
            _future_A_p: uint256 = _future_A * A_PRECISION

            assert _future_A > 0 and _future_A < MAX_A
            if _future_A_p < _initial_A:
                assert _future_A_p * MAX_A_CHANGE >= _initial_A
            else:
                assert _future_A_p <= _initial_A * MAX_A_CHANGE

            self.initial_A = _initial_A
            self.future_A = _future_A_p
            self.initial_A_time = block.timestamp
            self.future_A_time = _future_time

            log RampA(_initial_A, _future_A_p, block.timestamp, _future_time)
        ```

    === "Example"

        ```python
        >>> StableSwap.initial_A_time()
        0
        ```


### `future_A_time`
!!! description "`StableSwap.future_A_time() -> uint256: view`"

    Getter for the future A time. This is the timestamp when ramping A should be finished.

    Returns: future A time (`uint256`).

    ??? quote "Source code"

        ```vyper
        A_PRECISION: constant(uint256) = 100
        MAX_A: constant(uint256) = 10 ** 6
        MAX_A_CHANGE: constant(uint256) = 10

        initial_A: public(uint256)
        future_A: public(uint256)
        initial_A_time: public(uint256)
        future_A_time: public(uint256)

        @external
        def ramp_A(_future_A: uint256, _future_time: uint256):
            assert msg.sender == factory.admin()  # dev: only owner
            assert block.timestamp >= self.initial_A_time + MIN_RAMP_TIME
            assert _future_time >= block.timestamp + MIN_RAMP_TIME  # dev: insufficient time

            _initial_A: uint256 = self._A()
            _future_A_p: uint256 = _future_A * A_PRECISION

            assert _future_A > 0 and _future_A < MAX_A
            if _future_A_p < _initial_A:
                assert _future_A_p * MAX_A_CHANGE >= _initial_A
            else:
                assert _future_A_p <= _initial_A * MAX_A_CHANGE

            self.initial_A = _initial_A
            self.future_A = _future_A_p
            self.initial_A_time = block.timestamp
            self.future_A_time = _future_time

            log RampA(_initial_A, _future_A_p, block.timestamp, _future_time)
        ```

    === "Example"

        ```python
        >>> StableSwap.future_A_time()
        0
        ```


---


## **Contract Info Methods** 

### `coins`
!!! description "`StableSwap.coins(arg0: uint256) -> addresss: view`"

    Getter for the coin at index `arg0` within the pool.

    Returns: coin (`address`).

    ??? quote "Source code"

        ```vyper
        coins: public(immutable(DynArray[address, MAX_COINS]))

        @external
        def __init__(
            _name: String[32],
            _symbol: String[10],
            _A: uint256,
            _fee: uint256,
            _offpeg_fee_multiplier: uint256,
            _ma_exp_time: uint256,
            _coins: DynArray[address, MAX_COINS],
            _rate_multipliers: DynArray[uint256, MAX_COINS],
            _asset_types: DynArray[uint8, MAX_COINS],
            _method_ids: DynArray[bytes4, MAX_COINS],
            _oracles: DynArray[address, MAX_COINS],
        ):
            ...

            coins = _coins

            ...
        ```

    === "Example"

        ```python
        >>> StableSwap.coins(0)
        '0xf939E0A03FB07F59A73314E73794Be0E57ac1b4E'
        >>> StableSwap.coins(1)
        '0x0E573Ce2736Dd9637A0b21058352e1667925C7a8'
        ```


### `balances`
!!! description "`StableSwap.balances(i: uint256) -> uint256:`"

    Getter for the current balance of coin `i` within the pool.

    Returns: coin balance (`uint256`).

    | Input  | Type      | Description                 |
    | ------ | --------- | --------------------------- |
    | `i`    | `uint256` | Index value of the coin.    |

    ??? quote "Source code"

        ```vyper
        @view
        @external
        def balances(i: uint256) -> uint256:
            """
            @notice Get the current balance of a coin within the
                    pool, less the accrued admin fees
            @param i Index value for the coin to query balance of
            @return Token balance
            """
            return self._balances()[i]

        @view
        @internal
        def _balances() -> DynArray[uint256, MAX_COINS]:
            """
            @notice Calculates the pool's balances _excluding_ the admin's balances.
            @dev If the pool contains rebasing tokens, this method ensures LPs keep all
                    rebases and admin only claims swap fees. This also means that, since
                    admin's balances are stored in an array and not inferred from read balances,
                    the fees in the rebasing token that the admin collects is immune to
                    slashing events.
            """
            result: DynArray[uint256, MAX_COINS] = empty(DynArray[uint256, MAX_COINS])
            balances_i: uint256 = 0

            for i in range(MAX_COINS_128):

                if i == N_COINS_128:
                    break

                if 2 in asset_types:
                    balances_i = ERC20(coins[i]).balanceOf(self) - self.admin_balances[i]
                else:
                    balances_i = self.stored_balances[i] - self.admin_balances[i]

                result.append(balances_i)

            return result
        ```

    === "Example"

        ```python
        >>> StableSwap.balances(0)
        1156160050449617680048138
        >>> StableSwap.balances(1)
        1052703857609
        ```


### `get_balances`
!!! description "`StableSwap.get_balances() -> DynArray[uint256, MAX_COINS]:`"

    Getter for an array with all coin balances in the pool.

    Returns: coin balances (`DynArray[uint256, MAX_COINS]`).

    ??? quote "Source code"

        ```vyper
        @view
        @external
        def get_balances() -> DynArray[uint256, MAX_COINS]:
            return self._balances()

        @view
        @internal
        def _balances() -> DynArray[uint256, MAX_COINS]:
            """
            @notice Calculates the pool's balances _excluding_ the admin's balances.
            @dev If the pool contains rebasing tokens, this method ensures LPs keep all
                    rebases and admin only claims swap fees. This also means that, since
                    admin's balances are stored in an array and not inferred from read balances,
                    the fees in the rebasing token that the admin collects is immune to
                    slashing events.
            """
            result: DynArray[uint256, MAX_COINS] = empty(DynArray[uint256, MAX_COINS])
            balances_i: uint256 = 0

            for i in range(MAX_COINS_128):

                if i == N_COINS_128:
                    break

                if POOL_IS_REBASING_IMPLEMENTATION:
                    balances_i = ERC20(coins[i]).balanceOf(self) - self.admin_balances[i]
                else:
                    balances_i = self.stored_balances[i] - self.admin_balances[i]

                result.append(balances_i)

            return result
        ```

    === "Example"

        ```python
        >>> StableSwap.get_balances()
        [1156160050449617680048138, 1052703857609]
        ```

    !!!note
        The returned values do not take admin fees into account.


### `N_COINS`
!!! description "`StableSwap.N_COINS() -> uint256: view`"

    Getter for the total number of coins in the pool.

    Returns: number of coins (`uint256`).

    !!!info
        There can be a maximum of 8 coins per pool due to `MAX_COINS = 8`.

    ??? quote "Source code"

        ```vyper
        MAX_COINS: constant(uint256) = 8  # max coins is 8 in the factory

        N_COINS: public(immutable(uint256))

        @external
        def __init__(
            _name: String[32],
            _symbol: String[10],
            _A: uint256,
            _fee: uint256,
            _offpeg_fee_multiplier: uint256,
            _ma_exp_time: uint256,
            _coins: DynArray[address, MAX_COINS],
            _rate_multipliers: DynArray[uint256, MAX_COINS],
            _asset_types: DynArray[uint8, MAX_COINS],
            _method_ids: DynArray[bytes4, MAX_COINS],
            _oracles: DynArray[address, MAX_COINS],
        ):
            ...

            coins = _coins
            __n_coins: uint256 = len(_coins)
            N_COINS = __n_coins
            N_COINS_128 = convert(__n_coins, int128)
            
            ...
        ```

    === "Example"

        ```python
        >>> StableSwap.N_COINS()
        2
        ```


### `totalSupply`
!!! description "`StableSwap.totalSupply() -> uint256:`"

    Getter for the total supply of the LP token.

    Returns: total supply (`uint256`).

    ??? quote "Source code"

        ```vyper
        total_supply: uint256

        @view
        @external
        @nonreentrant('lock')
        def totalSupply() -> uint256:
            """
            @notice The total supply of pool LP tokens
            @return self.total_supply, 18 decimals.
            """
            return self.total_supply
        ```

    === "Example"

        ```python
        >>> StableSwap.totalSupply()
        2208717767450789394892159
        ```