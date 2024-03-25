A metapool is a pool where a stablecoin is paired against the LP token from another pool, a so-called base pool.

!!!deploy "Contract Source & Deployment"
    Source code available on [Github](https://github.com/curvefi/stableswap-ng/blob/bff1522b30819b7b240af17ccfb72b0effbf6c47/contracts/main/CurveStableSwapMetaNG.vy).

The deployment of metapools is permissionless and can be done via the [**`deploy_metapool`**](../../../factory/stableswapNG/deployer-api.md#deploy_metapool) function within the StableSwap-NG Factory.

!!!warning "Examples"
    The examples following each code block of the corresponding functions provide a basic illustration of input/output values. **When using the function in production, ensure not to set `_min_dy`, `_min_amount`, etc., to zero or other arbitrary numbers**. Otherwise, MEV bots may frontrun or sandwich your transaction, leading to a potential loss of funds.

    The examples are based on the USDV<>3CRV metapool: [0xc273fd237F23cb13296D0Cc2897F0B7A61e83387](https://etherscan.io/address/0xc273fd237F23cb13296D0Cc2897F0B7A61e83387#code).


!!!info "**Oracle Methods Documentation**"
    Comprehensive documentation for Oracle Methods is available on a dedicated page, accessible [here](./oracles.md).

---

*The AMM metapool contract implementation utilizes two internal functions to transfer tokens/coins in and out of the pool and then accordingly update `stored_balances`.*

*These function slightly differ to the ones from plain pools, as there needs to be some additional logic because of the basepools:*

- **`_transfer_in()`**  

    ??? quote "`_transfer_in(coin_metapool_idx: int128, coin_basepool_idx: int128, dx: uint256, sender: address, expect_optimistic_transfer: bool, is_base_pool_swap: bool = False) -> uint256:`"

        | Input                     | Type      | Description                                                                                 |
        | ------------------------- | --------- | ------------------------------------------------------------------------------------------- |
        | `coin_metapool_idx`      | `int128`  | Metapool index of the input coin.                                                           |
        | `coin_basepool_idx`      | `int128`  | Basepool index of the input coin.                                                           |
        | `dx`                      | `uint256` | Amount to transfer in.                                                                      |
        | `sender`                  | `address` | Address to transfer coins from.                                                             |
        | `expect_optimistic_transfer` | `bool` | `True` if the contract expects an optimistic coin transfer (see [`exchange_received()`](#exchange_received)). |
        | `is_base_pool_swap`      | `bool`    | If the exchange is a basepool swap (if `i and i > 0`); defaulted to `False`.                 |

        ```vyper
        @internal
        def _transfer_in(
            coin_metapool_idx: int128,
            coin_basepool_idx: int128,
            dx: uint256,
            sender: address,
            expect_optimistic_transfer: bool,
            is_base_pool_swap: bool = False,
        ) -> uint256:
            """
            @notice Contains all logic to handle ERC20 token transfers.
            @param coin_metapool_idx metapool index of input coin
            @param coin_basepool_idx basepool index of input coin
            @param dx amount of `_coin` to transfer into the pool.
            @param sender address to transfer `_coin` from.
            @param expect_optimistic_transfer True if contract expects an optimistic coin transfer
            @param is_base_pool_swap Default is set to False.
            @return amount of coins received
            """
            _input_coin: ERC20 = ERC20(coins[coin_metapool_idx])
            _stored_balance: uint256 = self.stored_balances[coin_metapool_idx]
            _input_coin_is_in_base_pool: bool = False

            # Check if _transfer_in is being called by _exchange_underlying:
            if coin_basepool_idx >= 0 and coin_metapool_idx == 1:

                _input_coin = ERC20(BASE_COINS[coin_basepool_idx])
                _input_coin_is_in_base_pool = True

            _dx: uint256 = _input_coin.balanceOf(self)

            # ------------------------- Handle Transfers -----------------------------

            if expect_optimistic_transfer:

                if not _input_coin_is_in_base_pool:
                    _dx = _dx - _stored_balance
                    assert _dx >= dx  # dev: pool did not receive tokens for swap

            else:

                assert dx > 0  # dev : do not transferFrom 0 tokens into the pool
                assert _input_coin.transferFrom(
                    sender,
                    self,
                    dx,
                    default_return_value=True
                )
                _dx = _input_coin.balanceOf(self) - _dx

            # ------------ Check if liquidity needs to be added somewhere ------------

            if _input_coin_is_in_base_pool:
                if is_base_pool_swap:
                    return _dx  # <----- _exchange_underlying: all input goes to swap.
                    # So, we will not increment self.stored_balances for metapool_idx.

                # Swap involves base <> meta pool interaction. Add incoming base pool
                # token to the base pool, mint _dx base pool LP token (idx 1) and add
                # that to self.stored_balances and return that instead.
                _dx = self._meta_add_liquidity(_dx, coin_basepool_idx)

            # ----------------------- Update Stored Balances -------------------------

            self.stored_balances[coin_metapool_idx] += _dx

            return _dx

        @internal
        def _meta_add_liquidity(dx: uint256, base_i: int128) -> uint256:

            coin_i: address = coins[MAX_METAPOOL_COIN_INDEX]
            x: uint256 = ERC20(coin_i).balanceOf(self)

            if BASE_N_COINS == 2:

                base_inputs: uint256[2] = empty(uint256[2])
                base_inputs[base_i] = dx
                StableSwap2(BASE_POOL).add_liquidity(base_inputs, 0)

            if BASE_N_COINS == 3:

                base_inputs: uint256[3] = empty(uint256[3])
                base_inputs[base_i] = dx
                StableSwap3(BASE_POOL).add_liquidity(base_inputs, 0)

            return ERC20(coin_i).balanceOf(self) - x
        ```

- **`_transfer_out()`**

    ??? quote "`_transfer_out(_coin_idx: int128, _amount: uint256, receiver: address):`"

        | Input      | Type      | Description                               |
        | ---------- | --------- | ----------------------------------------- |
        | `coin_idx` | `int128`  | Index value of the token to transfer out. |
        | `_amount`  | `uint256` | Amount to transfer out.                   |
        | `receiver` | `address` | Address to send the tokens to.            |

        ```vyper 
        stored_balances: DynArray[uint256, MAX_COINS]

        @internal
        def _transfer_out(
            _coin_idx: int128, _amount: uint256, receiver: address
        ):
            """
            @notice Transfer a single token from the pool to receiver.
            @param _coin_idx Index of the token to transfer out
            @param _amount Amount of token to transfer out
            @param receiver Address to send the tokens to
            """

            coin_balance: uint256 = ERC20(coins[_coin_idx]).balanceOf(self)

            # ------------------------- Handle Transfers -----------------------------

            assert ERC20(coins[_coin_idx]).transfer(
                receiver, _amount, default_return_value=True
            )

            # ----------------------- Update Stored Balances -------------------------

            self.stored_balances[_coin_idx] = coin_balance - _amount
        ```
        

!!!info "Methods with underlying coins"
    In metapools, `coin[0]` is always the metapool token, and `coin[1]` is always the basepool token. When working with the basepool underlying tokens such as `exchange_underlying` and others, the coin indices of the basepool are appended after `coin[0]`, which is the metapool token.

    E.g., in the USDV<>3CRV pool: `coin[0]` = USDV, `coin[1]` = DAI, `coin[2]` = USDC, and `coin[3]` = USDT.


---


## **Exchange Methods**

*Three functions for token exchanges:*

- The regular `exchange` function.
- A novel `exchange_received` function that executes a token exchange based on the internal balances of the pool.
- Additionally, the metapool implementation includes an `exchange_underlying` function, which allows tokens to be exchanged with the underlying tokens the asset is paired against. For example, swapping USDV for USDT in the USDV<>3CRV pool.


### `exchange`
!!! description "`StableSwap.exchange(i: int128, j: int128, _dx: uint256, _min_dy: uint256, _receiver: address = msg.sender) -> uint256:`"

    !!!warning
        This exchange swaps between the metapool token and the basepool LP token. coin[0] is always the metapool token and coin[1] is the basepool LP token. To exchange the metapool token against underlying coins, one needs to use the `exchange_underlying` function.

    Function to exchange `_dx` amount of coin `i` for coin `j` and receive a minimum amount of `_min_dy`.

    Returns: amount of output coin received (`uint256`).

    Emits: `TokenExchange`

    | Input       | Type      | Description                                            |
    | ----------- | --------- | ------------------------------------------------------ |
    | `i`         | `int128`  | Index value of the input coin.                         |
    | `j`         | `int128`  | Index value of the output coin.                        |
    | `_dx`       | `uint256` | Amount of coin `i` being exchanged.                    |
    | `_min_dy`   | `uint256` | Minimum amount of coin `j` to receive.                 |
    | `_receiver` | `address` | Receiver of the output tokens; defaults to msg.sender. |


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
                -1,  # <----- we're not handling underlying coins here.
                _dx,
                sender,
                expect_optimistic_transfer
            )

            # ------------------------------- Exchange -------------------------------

            # xp[i] + dx * rates[i] / PRECISION
            x: uint256 = xp[i] + unsafe_div(dx * rates[i], PRECISION)
            dy: uint256 = self.__exchange(x, xp, rates, i, j)
            assert dy >= _min_dy, "Exchange resulted in fewer coins than expected"

            # --------------------------- Do Transfer out ----------------------------

            self._transfer_out(j, dy, receiver)

            # ------------------------------------------------------------------------

            log TokenExchange(msg.sender, i, _dx, j, dy)

            return dy

        @internal
        def __exchange(
            x: uint256,
            _xp: DynArray[uint256, MAX_COINS],
            rates: DynArray[uint256, MAX_COINS],
            i: int128,
            j: int128,
        ) -> uint256:

            amp: uint256 = self._A()
            D: uint256 = math.get_D(_xp, amp, N_COINS)
            y: uint256 = math.get_y(i, j, x, _xp, amp, D, N_COINS)

            dy: uint256 = _xp[j] - y - 1  # -1 just in case there were some rounding errors
            dy_fee: uint256 = dy * self._dynamic_fee((_xp[i] + x) / 2, (_xp[j] + y) / 2, self.fee) / FEE_DENOMINATOR

            # Convert all to real units
            dy = (dy - dy_fee) * PRECISION / rates[j]

            self.admin_balances[j] += (
                unsafe_div(dy_fee * admin_fee, FEE_DENOMINATOR)  # dy_fee * admin_fee / FEE_DENOMINATOR
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

        ```shell
        >>> StableSwap.get_balances()
        [4183467888075, 2556883713184291687567176]
        >>> StableSwap.exchange(0, 1, 10**6, 0)
        971169724887534588
        >>> StableSwap.get_balances()
        [4183468888075, 2556882741963895491313748]
        ```


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
                -1,  # <----- we're not handling underlying coins here.
                _dx,
                sender,
                expect_optimistic_transfer
            )

            # ------------------------------- Exchange -------------------------------

            # xp[i] + dx * rates[i] / PRECISION
            x: uint256 = xp[i] + unsafe_div(dx * rates[i], PRECISION)
            dy: uint256 = self.__exchange(x, xp, rates, i, j)
            assert dy >= _min_dy, "Exchange resulted in fewer coins than expected"

            # --------------------------- Do Transfer out ----------------------------

            self._transfer_out(j, dy, receiver)

            # ------------------------------------------------------------------------

            log TokenExchange(msg.sender, i, _dx, j, dy)

            return dy

        @internal
        def __exchange(
            x: uint256,
            _xp: DynArray[uint256, MAX_COINS],
            rates: DynArray[uint256, MAX_COINS],
            i: int128,
            j: int128,
        ) -> uint256:

            amp: uint256 = self._A()
            D: uint256 = math.get_D(_xp, amp, N_COINS)
            y: uint256 = math.get_y(i, j, x, _xp, amp, D, N_COINS)

            dy: uint256 = _xp[j] - y - 1  # -1 just in case there were some rounding errors
            dy_fee: uint256 = dy * self._dynamic_fee((_xp[i] + x) / 2, (_xp[j] + y) / 2, self.fee) / FEE_DENOMINATOR

            # Convert all to real units
            dy = (dy - dy_fee) * PRECISION / rates[j]

            self.admin_balances[j] += (
                unsafe_div(dy_fee * admin_fee, FEE_DENOMINATOR)  # dy_fee * admin_fee / FEE_DENOMINATOR
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

        ```shell
        >>> USDV.transfer("0xc273fd237F23cb13296D0Cc2897F0B7A61e83387", 10**6)
        >>> StableSwap.received(0, 1, 10**6, 0)
        998545692103751082
        ```

    !!!note
        More informations on this method [here](./overview.md#exchange_received).


### `exchange_underlying`
!!! description "`StableSwap.exchange_underlying(i: int128, j: int128, _dx: uint256, _min_dy: uint256, _receiver: address = msg.sender) -> uint256:`"

    Function to exchange `_dx` amount of the underlying coin `i` for the underlying coin `j` and receive a minimum amount of `_min_dy`. Index values are the `coins` followed by the `base_coins`, where the base pool LP token is not included as a value.

    Returns: amount of output coin received (`uint256`).

    Emits: `TokenExchangeUnderlying`

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `i` |  `int128` | Index value of underlying input coin. |
    | `j` |  `int128` | Index value of underlying output coin. |
    | `_dx` |  `uint256` | Amount of coin `i` being exchanged. |
    | `_min_dy` |  `uint256` | Minimum amount of coin `j` to receive. |
    | `receiver` |  `address` | Receiver of the output tokens; defaults to msg.sender. |

    ??? quote "Source code"

        ```vyper
        event TokenExchangeUnderlying:
            buyer: indexed(address)
            sold_id: int128
            tokens_sold: uint256
            bought_id: int128
            tokens_bought: uint256

        @external
        @nonreentrant('lock')
        def exchange_underlying(
            i: int128,
            j: int128,
            _dx: uint256,
            _min_dy: uint256,
            _receiver: address = msg.sender,
        ) -> uint256:
            """
            @notice Perform an exchange between two underlying coins
            @param i Index value for the underlying coin to send
            @param j Index value of the underlying coin to receive
            @param _dx Amount of `i` being exchanged
            @param _min_dy Minimum amount of `j` to receive
            @param _receiver Address that receives `j`
            @return Actual amount of `j` received
            """
            return self._exchange_underlying(
                msg.sender,
                i,
                j,
                _dx,
                _min_dy,
                _receiver,
                False
            )

        @internal
        def _exchange_underlying(
            sender: address,
            i: int128,
            j: int128,
            _dx: uint256,
            _min_dy: uint256,
            receiver: address,
            expect_optimistic_transfer: bool = False
        ) -> uint256:

            rates: DynArray[uint256, MAX_COINS] = self._stored_rates()
            old_balances: DynArray[uint256, MAX_COINS] = self._balances()
            xp: DynArray[uint256, MAX_COINS]  = self._xp_mem(rates, old_balances)

            dy: uint256 = 0
            base_i: int128 = 0
            base_j: int128 = 0
            meta_i: int128 = 0
            meta_j: int128 = 0
            x: uint256 = 0
            output_coin: address = empty(address)

            # ------------------------ Determine coin indices ------------------------

            # Get input coin indices:
            if i > 0:
                base_i = i - MAX_METAPOOL_COIN_INDEX
                meta_i = 1

            # Get output coin and indices:
            if j == 0:
                output_coin = coins[0]
            else:
                base_j = j - MAX_METAPOOL_COIN_INDEX
                meta_j = 1
                output_coin = BASE_COINS[base_j]

            # --------------------------- Do Transfer in -----------------------------

            # If incoming coin is supposed to go to the base pool, the _transfer_in
            # method will add_liquidity in the base pool and return dx_w_fee LP tokens
            dx_w_fee: uint256 =  self._transfer_in(
                meta_i,
                base_i,
                _dx,
                sender,
                expect_optimistic_transfer,
                (i > 0 and j > 0),  # <--- if True: do not add liquidity to base pool.
            )

            # ------------------------------- Exchange -------------------------------

            if i == 0 or j == 0:  # meta swap

                if i == 0:

                    # xp[i] + dx_w_fee * rates[i] / PRECISION
                    x = xp[i] + unsafe_div(dx_w_fee * rates[i], PRECISION)

                else:

                    # dx_w_fee is the number of base_pool LP tokens minted after
                    # base_pool.add_liquidity in self._transfer_in

                    # dx_w_fee * rates[MAX_METAPOOL_COIN_INDEX] / PRECISION
                    x = unsafe_div(dx_w_fee * rates[MAX_METAPOOL_COIN_INDEX], PRECISION)
                    x += xp[MAX_METAPOOL_COIN_INDEX]

                dy = self.__exchange(x, xp, rates, meta_i, meta_j)

                # Adjust stored balances of meta-level tokens:
                self.stored_balances[meta_j] -= dy

                # Withdraw from the base pool if needed
                if j > 0:
                    out_amount: uint256 = ERC20(output_coin).balanceOf(self)
                    StableSwap(BASE_POOL).remove_liquidity_one_coin(dy, base_j, 0)
                    dy = ERC20(output_coin).balanceOf(self) - out_amount

                assert dy >= _min_dy

            else:  # base pool swap (user should swap at base pool for better gas)

                dy = ERC20(output_coin).balanceOf(self)
                StableSwap(BASE_POOL).exchange(base_i, base_j, dx_w_fee, _min_dy)
                dy = ERC20(output_coin).balanceOf(self) - dy

            # --------------------------- Do Transfer out ----------------------------

            assert ERC20(output_coin).transfer(receiver, dy, default_return_value=True)

            # ------------------------------------------------------------------------

            log TokenExchangeUnderlying(sender, i, _dx, j, dy)

            return dy

        @internal
        def __exchange(
            x: uint256,
            _xp: DynArray[uint256, MAX_COINS],
            rates: DynArray[uint256, MAX_COINS],
            i: int128,
            j: int128,
        ) -> uint256:

            amp: uint256 = self._A()
            D: uint256 = math.get_D(_xp, amp, N_COINS)
            y: uint256 = math.get_y(i, j, x, _xp, amp, D, N_COINS)

            dy: uint256 = _xp[j] - y - 1  # -1 just in case there were some rounding errors
            dy_fee: uint256 = dy * self._dynamic_fee((_xp[i] + x) / 2, (_xp[j] + y) / 2, self.fee) / FEE_DENOMINATOR

            # Convert all to real units
            dy = (dy - dy_fee) * PRECISION / rates[j]

            self.admin_balances[j] += (
                unsafe_div(dy_fee * admin_fee, FEE_DENOMINATOR)  # dy_fee * admin_fee / FEE_DENOMINATOR
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

        ```shell
        >>> StableSwap.exchange_underlying(0, 1, 10**6, 0)
        998545692103751082
        >>> StableSwap.exchange_underlying(0, 2, 10**6, 0)
        998565
        ```


### `get_dy`
!!! description "`StableSwap.get_dy(i: int128, j: int128, dx: uint256) -> uint256`"

    Function to calculate the predicted output amount `j` to receive at the pool's current state given an input of `dx` amount of coin `i`. This is just a simple getter method; the calculation logic is within the CurveStableSwapNGViews contract. See [here](../utility_contracts/views.md#get_dy).

    Returns: predicted output amount of `j` (`uint256`).

    | Input  | Type     | Description                                |
    | ------ | -------- | ------------------------------------------ |
    | `i`    | `int128` | Index value of input coin.                 |
    | `j`    | `int128` | Index value of output coin.                |
    | `dx`   | `uint256`| Amount of input coin being exchanged.      |

    ??? quote "Source code"

        === "CurveStableSwapMetaNG.vy"

            ```vyper
            interface StableSwapViews:
                def get_dx(i: int128, j: int128, dy: uint256, pool: address) -> uint256: view
                def get_dy(i: int128, j: int128, dx: uint256, pool: address) -> uint256: view
                def get_dx_underlying(i: int128, j: int128, dy: uint256, pool: address) -> uint256: view
                def get_dy_underlying(i: int128, j: int128, dx: uint256, pool: address) -> uint256: view
                def dynamic_fee(i: int128, j: int128, pool: address) -> uint256: view
                def calc_token_amount(
                    _amounts: DynArray[uint256, MAX_COINS],
                    _is_deposit: bool,
                    _pool: address
                ) -> uint256: view

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

        ```shell
        >>> StableSwap.get_dy(0, 1, 10**6)
        971173697952445825
        ```


### `get_dy_underlying`
!!! description "`StableSwap.get_dy_underlying(i: int128, j: int128, dx: uint256) -> uint256:`"

    Function to calculate the predicted output amount `j` to receive given an input of `dx` amount of coin `i`, including underlying coins. Index values are the `coins` followed by the `base_coins`, where the base pool LP token is not included as a value.

    Returns: predicted amount of `j` (`uint256`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `i` |  `int128` | Index value of input coin. |
    | `j` |  `int128` | Index value of output coin. |
    | `dx` |  `uint256` | Amount of input coin being exchanged. |

    ??? quote "Source code"

        === "CurveStableSwapMetaNG.vy"

            ```vyper
            interface StableSwapViews:
                def get_dx(i: int128, j: int128, dy: uint256, pool: address) -> uint256: view
                def get_dy(i: int128, j: int128, dx: uint256, pool: address) -> uint256: view
                def get_dx_underlying(i: int128, j: int128, dy: uint256, pool: address) -> uint256: view
                def get_dy_underlying(i: int128, j: int128, dx: uint256, pool: address) -> uint256: view
                def dynamic_fee(i: int128, j: int128, pool: address) -> uint256: view
                def calc_token_amount(
                    _amounts: DynArray[uint256, MAX_COINS],
                    _is_deposit: bool,
                    _pool: address
                ) -> uint256: view

            @view
            @external
            def get_dy_underlying(i: int128, j: int128, dx: uint256) -> uint256:
                return StableSwapViews(factory.views_implementation()).get_dy_underlying(i, j, dx, self)

            ```

        === "CurveStableSwapNGViews.vy"

            ```vyper
            @view
            @external
            def get_dy_underlying(
                i: int128,
                j: int128,
                dx: uint256,
                pool: address,
            ) -> uint256:
                """
                @notice Calculate the current output dy given input dx on underlying
                @dev Index values can be found via the `coins` public getter method
                @param i Index value for the coin to send
                @param j Index valie of the coin to recieve
                @param dx Amount of `i` being exchanged
                @return Amount of `j` predicted
                """

                N_COINS: uint256 = StableSwapNG(pool).N_COINS()
                MAX_COIN: int128 = convert(N_COINS, int128) - 1
                BASE_POOL: address = StableSwapNG(pool).BASE_POOL()

                rates: DynArray[uint256, MAX_COINS] = empty(DynArray[uint256, MAX_COINS])
                balances: DynArray[uint256, MAX_COINS] = empty(DynArray[uint256, MAX_COINS])
                xp: DynArray[uint256, MAX_COINS] = empty(DynArray[uint256, MAX_COINS])
                rates, balances, xp = self._get_rates_balances_xp(pool, N_COINS)

                x: uint256 = 0
                base_i: int128 = 0
                base_j: int128 = 0
                meta_i: int128 = 0
                meta_j: int128 = 0

                if i != 0:
                    base_i = i - MAX_COIN
                    meta_i = 1
                if j != 0:
                    base_j = j - MAX_COIN
                    meta_j = 1

                if i == 0:

                    x = xp[i] + dx * rates[0] / 10**18

                else:

                    if j == 0:

                        # i is from BasePool
                        base_n_coins: uint256 = StableSwapNG(pool).BASE_N_COINS()
                        x = self._base_calc_token_amount(
                            dx, base_i, base_n_coins, BASE_POOL, True
                        ) * rates[1] / PRECISION

                        # Adding number of pool tokens
                        x += xp[1]

                    else:
                        # If both are from the base pool
                        return StableSwapNG(BASE_POOL).get_dy(base_i, base_j, dx)

                # This pool is involved only when in-pool assets are used
                amp: uint256 = StableSwapNG(pool).A() * A_PRECISION
                D: uint256 = self.get_D(xp, amp, N_COINS)
                y: uint256 = self.get_y(meta_i, meta_j, x, xp, amp, D, N_COINS)
                dy: uint256 = xp[meta_j] - y - 1

                # calculate output after subtracting dynamic fee
                base_fee: uint256 = StableSwapNG(pool).fee()
                fee_multiplier: uint256 = StableSwapNG(pool).offpeg_fee_multiplier()

                dynamic_fee: uint256 = self._dynamic_fee((xp[meta_i] + x) / 2, (xp[meta_j] + y) / 2, base_fee, fee_multiplier)
                dy = (dy - dynamic_fee * dy / FEE_DENOMINATOR)

                # If output is going via the metapool
                if j == 0:
                    dy = dy * 10**18 / rates[0]
                else:
                    # j is from BasePool
                    # The fee is already accounted for
                    dy = StableSwapNG(BASE_POOL).calc_withdraw_one_coin(dy * PRECISION / rates[1], base_j)

                return dy
            ```

    === "Example"

        ```shell
        >>> StableSwap.get_dy_underlying(0, 1, 10**6)
        999713269803541066
        >>> StableSwap.get_dy_underlying(0, 2, 10**6)
        998565
        >>> StableSwap.get_dy_underlying(0, 3, 10**6)
        999171
        >>> StableSwap.get_dy_underlying(3, 0, 10**6)
        1000587
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

        === "CurveStableSwapMetaNG.vy"

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

        ```shell
        >>> StableSwap.get_dx(0, 1 10**6)
        971173697952445825
        ```


### `get_dx_underlying`
!!! description "`StableSwap.get_dx_underlying(i: int128, j: int128, dy: uint256) -> uint256:`"

    Function to calculate the predicted input amount `i` to receive `dy` of coin `j`, including underlying coins. Index values are the `coins` followed by the `base_coins`, where the base pool LP token is not included as a value.

    Returns: predicted amount of `i` (`uint256`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `i` |  `int128` | Index value of input coin. |
    | `j` |  `int128` | Index value of output coin. |
    | `dy` |  `uint256` | Amount of output coin received. |

    ??? quote "Source code"

        === "CurveStableSwapMetaNG.vy"

            ```vyper
            interface StableSwapViews:
            def get_dx(i: int128, j: int128, dy: uint256, pool: address) -> uint256: view
            def get_dy(i: int128, j: int128, dx: uint256, pool: address) -> uint256: view
            def get_dx_underlying(i: int128, j: int128, dy: uint256, pool: address) -> uint256: view
            def get_dy_underlying(i: int128, j: int128, dx: uint256, pool: address) -> uint256: view
            def dynamic_fee(i: int128, j: int128, pool: address) -> uint256: view
            def calc_token_amount(
                _amounts: DynArray[uint256, MAX_COINS],
                _is_deposit: bool,
                _pool: address
            ) -> uint256: view

            @view
            @external
            def get_dx_underlying(i: int128, j: int128, dy: uint256) -> uint256:
                return StableSwapViews(factory.views_implementation()).get_dx_underlying(i, j, dy, self)
            ```

        === "CurveStableSwapNGViews.vy"

            ```vyper
            @view
            @external
            def get_dx_underlying(
                i: int128,
                j: int128,
                dy: uint256,
                pool: address,
            ) -> uint256:

                BASE_POOL: address = StableSwapNG(pool).BASE_POOL()
                BASE_N_COINS: uint256 = StableSwapNG(pool).BASE_N_COINS()
                N_COINS: uint256 = StableSwapNG(pool).N_COINS()
                base_pool_has_static_fee: bool = self._has_static_fee(BASE_POOL)

                # CASE 1: Swap does not involve Metapool at all. In this case, we kindly as the user
                # to use the right pool for their swaps.
                if min(i, j) > 0:
                    raise "Not a Metapool Swap. Use Base pool."

                # CASE 2:
                #    1. meta token_0 of (unknown amount) > base pool lp_token
                #    2. base pool lp_token > calc_withdraw_one_coin gives dy amount of (j-1)th base coin
                # So, need to do the following calculations:
                #    1. calc_token_amounts on base pool for depositing liquidity on (j-1)th token > lp_tokens.
                #    2. get_dx on metapool for i = 0, and j = 1 (base lp token) with amt calculated in (1).
                if i == 0:
                    # Calculate LP tokens that are burnt to receive dy amount of base_j tokens.
                    lp_amount_burnt: uint256 = self._base_calc_token_amount(
                        dy, j - 1, BASE_N_COINS, BASE_POOL, False
                    )
                    return self._get_dx(0, 1, lp_amount_burnt, pool, False, N_COINS)

                # CASE 3: Swap in token i-1 from base pool and swap out dy amount of token 0 (j) from metapool.
                #    1. deposit i-1 token from base pool > receive base pool lp_token
                #    2. swap base pool lp token > 0th token of the metapool
                # So, need to do the following calculations:
                #    1. get_dx on metapool with i = 0, j = 1 > gives how many base lp tokens are required for receiving
                #       dy amounts of i-1 tokens from the metapool
                #    2. We have number of lp tokens: how many i-1 base pool coins are needed to mint that many tokens?
                #       We don't have a method where user inputs lp tokens and it gives number of coins of (i-1)th token
                #       is needed to mint that many base_lp_tokens. Instead, we will use calc_withdraw_one_coin. That's
                #       close enough.
                lp_amount_required: uint256 = self._get_dx(1, 0, dy, pool, False, N_COINS)
                return StableSwapNG(BASE_POOL).calc_withdraw_one_coin(lp_amount_required, i-1)

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

            @view
            @external
            def calc_withdraw_one_coin(_burn_amount: uint256, i: int128, pool: address) -> uint256:
                # First, need to calculate
                # * Get current D
                # * Solve Eqn against y_i for D - _token_amount

                amp: uint256 = StableSwapNG(pool).A() * A_PRECISION
                N_COINS: uint256 = StableSwapNG(pool).N_COINS()

                rates: DynArray[uint256, MAX_COINS] = empty(DynArray[uint256, MAX_COINS])
                balances: DynArray[uint256, MAX_COINS] = empty(DynArray[uint256, MAX_COINS])
                xp: DynArray[uint256, MAX_COINS] = empty(DynArray[uint256, MAX_COINS])
                rates, balances, xp = self._get_rates_balances_xp(pool, N_COINS)

                D0: uint256 = self.get_D(xp, amp, N_COINS)

                total_supply: uint256 = StableSwapNG(pool).totalSupply()
                D1: uint256 = D0 - _burn_amount * D0 / total_supply
                new_y: uint256 = self.get_y_D(amp, i, xp, D1, N_COINS)
                ys: uint256 = (D0 + D1) / (2 * N_COINS)

                base_fee: uint256 = StableSwapNG(pool).fee() * N_COINS / (4 * (N_COINS - 1))
                fee_multiplier: uint256 = StableSwapNG(pool).offpeg_fee_multiplier()
                xp_reduced: DynArray[uint256, MAX_COINS] = xp
                xp_j: uint256 = 0
                xavg: uint256 = 0
                dynamic_fee: uint256 = 0

                for j in range(MAX_COINS):

                    if j == N_COINS:
                        break

                    dx_expected: uint256 = 0
                    xp_j = xp[j]
                    if convert(j, int128) == i:
                        dx_expected = xp_j * D1 / D0 - new_y
                        xavg = (xp[j] + new_y) / 2
                    else:
                        dx_expected = xp_j - xp_j * D1 / D0
                        xavg = xp[j]

                    dynamic_fee = self._dynamic_fee(xavg, ys, base_fee, fee_multiplier)
                    xp_reduced[j] = xp_j - dynamic_fee * dx_expected / FEE_DENOMINATOR

                dy: uint256 = xp_reduced[i] - self.get_y_D(amp, i, xp_reduced, D1, N_COINS)
                dy = (dy - 1) * PRECISION / rates[i]  # Withdraw less to account for rounding errors

                return dy
            ```

    === "Example"

        ```shell
        >>> StableSwap.get_dx_underlying(0, 1, 10**6)
        998546308572137376
        >>> StableSwap.get_dx_underlying(0, 3, 10**6)
        999171
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

            for i in range(N_COINS_128):

                if _amounts[i] > 0:

                    new_balances[i] += self._transfer_in(
                        i,
                        -1,  # <--- we're not handling underlying coins here
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
                # base_fee: uint256 = self.fee * N_COINS / (4 * (N_COINS - 1))
                # unsafe math is safu here:
                base_fee: uint256 = unsafe_div(unsafe_mul(self.fee, N_COINS), 4)

                for i in range(N_COINS_128):

                    ideal_balance = D1 * old_balances[i] / D0
                    new_balance = new_balances[i]

                    # unsafe math is safu here:
                    if ideal_balance > new_balance:
                        difference = unsafe_sub(ideal_balance, new_balance)
                    else:
                        difference = unsafe_sub(new_balance, ideal_balance)

                    # fee[i] = _dynamic_fee(i, j) * difference / FEE_DENOMINATOR
                    xs = unsafe_div(rates[i] * (old_balances[i] + new_balance), PRECISION)
                    _dynamic_fee_i = self._dynamic_fee(xs, ys, base_fee)
                    fees.append(
                        unsafe_div(
                            _dynamic_fee_i * difference,
                            FEE_DENOMINATOR
                        )
                    )

                    # fees[i] * admin_fee / FEE_DENOMINATOR
                    self.admin_balances[i] += unsafe_div(fees[i] * admin_fee, FEE_DENOMINATOR)
                    new_balances[i] -= fees[i]

                xp: DynArray[uint256, MAX_COINS] = self._xp_mem(rates, new_balances)
                D1 = math.get_D(xp, amp, N_COINS)  # <------ Reuse D1 for new D value.
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

        ```shell
        >>> StableSwap.get_balances()
        [4183467888075, 2556883713184291687567176]
        >>> StableSwap.add_liquidity([10**6, 0], 0)
        9992841836391963157
        >>> StableSwap.get_balances()
        [4183477887978, 2556883713089250297597078]
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
            assert _burn_amount > 0  # dev: invalid _burn_amount
            amounts: DynArray[uint256, MAX_COINS] = empty(DynArray[uint256, MAX_COINS])
            balances: DynArray[uint256, MAX_COINS] = self._balances()

            value: uint256 = 0

            for i in range(N_COINS_128):

                value = unsafe_div(balances[i] * _burn_amount, total_supply)
                assert value >= _min_amounts[i], "Withdrawal resulted in fewer coins than expected"
                amounts.append(value)
                self._transfer_out(i, value, _receiver)

            self._burnFrom(msg.sender, _burn_amount)  # dev: insufficient funds

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

        ```shell
        >>> StableSwap.get_balances()
        [4183477887978, 2556883713089250297628878]
        >>> StableSwap.remove_liquidity(10**18, [0, 0])
        614190, 375384835097322069
        >>> StableSwap.get_balances()
        [4183477273788, 2556883337704415200306809]
        ```


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

            # fee * admin_fee / FEE_DENOMINATOR
            self.admin_balances[i] += unsafe_div(fee * admin_fee, FEE_DENOMINATOR)

            self._burnFrom(msg.sender, _burn_amount)

            log Transfer(msg.sender, empty(address), _burn_amount)

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

            # First, need to:
            # * Get current D
            # * Solve Eqn against y_i for D - _token_amount

            # get pool state
            amp: uint256 = self._A()
            rates: DynArray[uint256, MAX_COINS] = self._stored_rates()
            xp: DynArray[uint256, MAX_COINS] = self._xp_mem(rates, self._balances())
            D0: uint256 = math.get_D(xp, amp, N_COINS)

            total_supply: uint256 = self.total_supply
            D1: uint256 = D0 - _burn_amount * D0 / total_supply
            new_y: uint256 = math.get_y_D(amp, i, xp, D1, N_COINS)

            xp_reduced: DynArray[uint256, MAX_COINS] = xp
            ys: uint256 = (D0 + D1) / (2 * N_COINS)
            base_fee: uint256 = self.fee * N_COINS / (4 * (N_COINS - 1))

            dx_expected: uint256 = 0
            xp_j: uint256 = 0
            xavg: uint256 = 0
            dynamic_fee: uint256 = 0

            for j in range(N_COINS_128):

                dx_expected = 0
                xp_j = xp[j]
                if j == i:
                    dx_expected = xp_j * D1 / D0 - new_y
                    xavg = (xp_j + new_y) / 2
                else:
                    dx_expected = xp_j - xp_j * D1 / D0
                    xavg = xp_j

                # xp_j - dynamic_fee * dx_expected / FEE_DENOMINATOR
                dynamic_fee = self._dynamic_fee(xavg, ys, base_fee)
                xp_reduced[j] = xp_j - unsafe_div(dynamic_fee * dx_expected, FEE_DENOMINATOR)

            dy: uint256 = xp_reduced[i] - math.get_y_D(amp, i, xp_reduced, D1, N_COINS)
            dy_0: uint256 = (xp[i] - new_y) * PRECISION / rates[i]  # w/o fees
            dy = (dy - 1) * PRECISION / rates[i]  # Withdraw less to account for rounding errors

            # calculate state price
            xp[i] = new_y

            return dy, dy_0 - dy, xp, amp, D1
        ```

    === "Example"

        ```shell
        >>> StableSwap.remove_liquidity_one_coin(10**18, 0, 0)
        1000638
        >>> StableSwap.remove_liquidity_one_coin(10**18, 1, 0)
        971872609646322618
        ```


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

            for i in range(N_COINS_128):

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

            for i in range(N_COINS_128):

                ideal_balance = D1 * old_balances[i] / D0
                new_balance = new_balances[i]

                if ideal_balance > new_balance:
                    difference = ideal_balance - new_balance
                else:
                    difference = new_balance - ideal_balance

                # base_fee * difference / FEE_DENOMINATOR
                xs = unsafe_div(rates[i] * (old_balances[i] + new_balance), PRECISION)
                dynamic_fee = self._dynamic_fee(xs, ys, base_fee)
                fees.append(unsafe_div(dynamic_fee * difference, FEE_DENOMINATOR))

                # fees[i] * admin_fee / FEE_DENOMINATOR
                self.admin_balances[i] += unsafe_div(fees[i] * admin_fee, FEE_DENOMINATOR)

                new_balances[i] -= fees[i]

            D1 = self.get_D_mem(rates, new_balances, amp)  # dev: reuse D1 for new D.

            self.upkeep_oracles(new_balances, amp, D1)

            total_supply: uint256 = self.total_supply
            burn_amount: uint256 = ((D0 - D1) * total_supply / D0) + 1
            assert burn_amount > 1  # dev: zero tokens burned
            assert burn_amount <= _max_burn_amount, "Slippage screwed you"

            self._burnFrom(msg.sender, burn_amount)

            log RemoveLiquidityImbalance(msg.sender, _amounts, fees, D1, total_supply)

            return burn_amount
        ```

    === "Example"

        ```shell
        >>> StableSwap.remove_liquidity_imbalance([2000000, 10**18], 50**18)
        3027537955031682593
        ```

    !!!note
        This method removes liquidity in an imbalanced portion (2 USDV and one 3CRV) by burning a `burn_amount` of LP tokens (3027537955031682593).


### `calc_token_amount`
!!! description "`StableSwap.calc_token_amount(_amounts: DynArray[uint256, MAX_COINS], _is_deposit: bool) -> uint256:`"

    Function to calculate the addition or reduction of token supply from a deposit (add liquidity) or withdrawal (remove liquidity). This function does take fees into consideration.

    Returns: amount of LP tokens (`uint256`).

    | Input          | Type                           | Description                                        |
    | -------------- | ------------------------------ | -------------------------------------------------- |
    | `_amounts`     | `DynArray[uint256, MAX_COINS]` | Amount of coins being deposited/withdrawn.        |
    | `_is_deposit`  | `bool`                         | `true` = deposit, `false` = withdraw.             |

    ??? quote "Source code"

        === "CurveStableSwapMetaNG.vy"

            ```vyper
            interface StableSwapViews:
                def get_dx(i: int128, j: int128, dy: uint256, pool: address) -> uint256: view
                def get_dy(i: int128, j: int128, dx: uint256, pool: address) -> uint256: view
                def get_dx_underlying(i: int128, j: int128, dy: uint256, pool: address) -> uint256: view
                def get_dy_underlying(i: int128, j: int128, dx: uint256, pool: address) -> uint256: view
                def dynamic_fee(i: int128, j: int128, pool: address) -> uint256: view
                def calc_token_amount(
                    _amounts: DynArray[uint256, MAX_COINS],
                    _is_deposit: bool,
                    _pool: address
                ) -> uint256: view

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

        ```shell
        >>> StableSwap.calc_token_amount([10**6, 10**18], False)
        2028274156743388789
        ```


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

            # First, need to:
            # * Get current D
            # * Solve Eqn against y_i for D - _token_amount

            # get pool state
            amp: uint256 = self._A()
            rates: DynArray[uint256, MAX_COINS] = self._stored_rates()
            xp: DynArray[uint256, MAX_COINS] = self._xp_mem(rates, self._balances())
            D0: uint256 = math.get_D(xp, amp, N_COINS)

            total_supply: uint256 = self.total_supply
            D1: uint256 = D0 - _burn_amount * D0 / total_supply
            new_y: uint256 = math.get_y_D(amp, i, xp, D1, N_COINS)

            xp_reduced: DynArray[uint256, MAX_COINS] = xp
            ys: uint256 = (D0 + D1) / (2 * N_COINS)
            base_fee: uint256 = self.fee * N_COINS / (4 * (N_COINS - 1))

            dx_expected: uint256 = 0
            xp_j: uint256 = 0
            xavg: uint256 = 0
            dynamic_fee: uint256 = 0

            for j in range(N_COINS_128):

                dx_expected = 0
                xp_j = xp[j]
                if j == i:
                    dx_expected = xp_j * D1 / D0 - new_y
                    xavg = (xp_j + new_y) / 2
                else:
                    dx_expected = xp_j - xp_j * D1 / D0
                    xavg = xp_j

                # xp_j - dynamic_fee * dx_expected / FEE_DENOMINATOR
                dynamic_fee = self._dynamic_fee(xavg, ys, base_fee)
                xp_reduced[j] = xp_j - unsafe_div(dynamic_fee * dx_expected, FEE_DENOMINATOR)

            dy: uint256 = xp_reduced[i] - math.get_y_D(amp, i, xp_reduced, D1, N_COINS)
            dy_0: uint256 = (xp[i] - new_y) * PRECISION / rates[i]  # w/o fees
            dy = (dy - 1) * PRECISION / rates[i]  # Withdraw less to account for rounding errors

            # calculate state price
            xp[i] = new_y

            return dy, dy_0 - dy, xp, amp, D1
        ```

    === "Example"

        ```shell
        >>> StableSwap.calc_withdraw_one_coin(10**18, 0)
        1000638
        >>> StableSwap.calc_withdraw_one_coin(10**18, 1)
        971872610064262793
        >>> StableSwap.get_balances()
        [4183467888075, 2556883713184291687567176] # [coin[0], coin[1]]
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

    Getter method for the fee of the pool. The fee is expressed as an integer with a 1e10 precision. This is the value set when initializing the contract and can be changed via [`set_new_fee`](../pools/admin_controls.md#set_new_fee).

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
            _math_implementation: address,
            _base_pool: address,
            _coins: DynArray[address, MAX_COINS],
            _base_coins: DynArray[address, MAX_COINS],
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

        ```shell
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

        ```shell
        >>> StableSwap.dynamic_fee(0, 1)
        1043403
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

        ```shell
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
            _math_implementation: address,
            _base_pool: address,
            _coins: DynArray[address, MAX_COINS],
            _base_coins: DynArray[address, MAX_COINS],
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

        ```shell
        >>> StableSwap.offpeg_fee_multiplier()
        50000000000
        ```

    !!!note
        The method returns an integer with with 1e10 precision.


### `stored_rates`
!!! description "`StableSwap.stored_rates() -> DynArray[uint256, MAX_COINS]:`view"

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
            rates: DynArray[uint256, MAX_COINS] = [
                rate_multipliers[0],
                StableSwap(BASE_POOL).get_virtual_price()
            ]
            oracles: DynArray[uint256, MAX_COINS] = self.oracles

            if asset_types[0] == 1 and not self.oracles[0] == 0:

                # NOTE: fetched_rate is assumed to be 10**18 precision
                fetched_rate: uint256 = convert(
                    raw_call(
                        convert(oracles[0] % 2**160, address),
                        _abi_encode(oracles[0] & ORACLE_BIT_MASK),
                        max_outsize=32,
                        is_static_call=True,
                    ),
                    uint256
                )

                # rates[0] * fetched_rate / PRECISION
                rates[0] = unsafe_div(rates[0] * fetched_rate, PRECISION)

            elif asset_types[0] == 3:  # ERC4626

                # rates[0] * fetched_rate / PRECISION
                rates[0] = unsafe_div(
                    rates[0] * ERC4626(coins[0]).convertToAssets(call_amount) * scale_factor,
                    PRECISION
                )  # 1e18 precision

            return rates
        ```

    === "Example"

        ```shell
        >>> StableSwap.stored_rates()
        [1000000000000000000000000000000, 1028532570390672122]
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

        ```shell
        >>> StableSwap.admin_balances(0)
        73146476
        >>> StableSwap.admin_balances(1)
        129624596387098161946
        ```


### `withdraw_admin_fees`
!!! description "`StableSwap.withdraw_admin_fees():`"

    Function to withdraw accumulated admin fees from the pool and send them to the `fee_receiver` set within the Factory.

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
            for i in range(N_COINS_128):

                if admin_balances[i] > 0:

                    self._transfer_out(i, admin_balances[i], fee_receiver)
                    admin_balances[i] = 0

            self.admin_balances = admin_balances
        ```

    === "Example"

        ```shell
        >>> StableSwap.withdraw_admin_fees()
        ```


---


## **Amplification Coefficient**

The amplification coefficient **`A`** determines a pool’s tolerance for imbalance between the assets within it. A higher value means that trades will incur slippage sooner as the assets within the pool become imbalanced.

The appropriate value for A is dependent upon the type of coin being used within the pool, and is subject to optimisation. It is possible to modify the amplification coefficient for a pool via the **`ramp_A`** function. See [admin controls](../pools/admin_controls.md#ramp_a).

When a ramping of A has been initialized, the process can be stopped by calling the function [**`stop_ramp_A()`**](../pools/admin_controls.md#stop_ramp_a).

### `A`
!!! description "`StableSwap.A() -> uint256: view`"

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
            return unsafe_div(self._A(), A_PRECISION)

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

        ```shell
        >>> StableSwap.A()
        500
        ```

    !!!note
        The amplification coefficient is scaled by `A_precise`.


### `A_precise`
!!! description "`StableSwap.A_precise() -> uint256: view`"

    Getter for the precise A value, which is not divided by `A_precise` unlike `A`.

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
        ```

    === "Example"

        ```shell
        >>> StableSwap.A_precise()
        50000
        ```


### `initial_A`
!!! description "`StableSwap.initial_A() -> uint256: view`"

    Getter for the initial A value. This is the A value when the ramping was initialized.

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

        ```shell
        >>> StableSwap.initial_A()
        500
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

        ```shell
        >>> StableSwap.future_A()
        500
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

        ```shell
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

        ```shell
        >>> StableSwap.future_A_time()
        0
        ```


---


## **Contract Info Methods** 

### `BASE_POOL`
!!! description "`StableSwap.BASE_POOL() -> address: view`"

    Getter for the base pool.

    Returns: base pool (`address`).

    ??? quote "Source code"

        ```vyper
        BASE_POOL: public(immutable(address))

        @external
        def __init__(
            _name: String[32],
            _symbol: String[10],
            _A: uint256,
            _fee: uint256,
            _offpeg_fee_multiplier: uint256,
            _ma_exp_time: uint256,
            _math_implementation: address,
            _base_pool: address,
            _coins: DynArray[address, MAX_COINS],
            _base_coins: DynArray[address, MAX_COINS],
            _rate_multipliers: DynArray[uint256, MAX_COINS],
            _asset_types: DynArray[uint8, MAX_COINS],
            _method_ids: DynArray[bytes4, MAX_COINS],
            _oracles: DynArray[address, MAX_COINS],
        ):
            ...

            BASE_POOL = _base_pool
            
            ...
        ```

    === "Example"

        ```shell
        >>> StableSwap.BASE_POOL()
        '0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7'
        ```


### `BASE_N_COINS`
!!! description "`StableSwap.BASE_N_COINS() -> uint256: view`"

    Getter for the number of coins within the base pool.

    Returns: number of coins (`uint256`).

    ??? quote "Source code"

        ```vyper
        MAX_COINS: constant(uint256) = 8  # max coins is 8 in the factory

        BASE_N_COINS: public(immutable(uint256))

        @external
        def __init__(
            _name: String[32],
            _symbol: String[10],
            _A: uint256,
            _fee: uint256,
            _offpeg_fee_multiplier: uint256,
            _ma_exp_time: uint256,
            _math_implementation: address,
            _base_pool: address,
            _coins: DynArray[address, MAX_COINS],
            _base_coins: DynArray[address, MAX_COINS],
            _rate_multipliers: DynArray[uint256, MAX_COINS],
            _asset_types: DynArray[uint8, MAX_COINS],
            _method_ids: DynArray[bytes4, MAX_COINS],
            _oracles: DynArray[address, MAX_COINS],
        ):
            ...

            BASE_N_COINS = len(_base_coins)
            
            ...
        ```

    === "Example"

        ```shell
        >>> StableSwap.BASE_N_COINS()
        3
        ```


### `BASE_COINS`
!!! description "`StableSwap.BASE_COINS(arg0: uint256) -> address: view`"

    Getter for the coin at index value `arg0` within the base pool.

    Returns: coin (`address`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `arg0` |  `uint256` | Index value of the coin. |

    ??? quote "Source code"

        ```vyper
        BASE_COINS: public(immutable(DynArray[address, MAX_COINS]))

        @external
        def __init__(
            _name: String[32],
            _symbol: String[10],
            _A: uint256,
            _fee: uint256,
            _offpeg_fee_multiplier: uint256,
            _ma_exp_time: uint256,
            _math_implementation: address,
            _base_pool: address,
            _coins: DynArray[address, MAX_COINS],
            _base_coins: DynArray[address, MAX_COINS],
            _rate_multipliers: DynArray[uint256, MAX_COINS],
            _asset_types: DynArray[uint8, MAX_COINS],
            _method_ids: DynArray[bytes4, MAX_COINS],
            _oracles: DynArray[address, MAX_COINS],
        ):
            ...

            BASE_COINS = _base_coins
            
            ...
        ```

    === "Example"

        ```shell
        >>> StableSwap.BASE_COINS(0)
        '0x6B175474E89094C44Da98b954EedeAC495271d0F'
        >>> StableSwap.BASE_COINS(1)
        '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
        >>> StableSwap.BASE_COINS(2)
        '0xdAC17F958D2ee523a2206206994597C13D831ec7'
        ```


### `coins`
!!! description "`StableSwap.coins(arg0: uint256) -> addresss: view`"

    Getter for the coin at index `arg0` within the metapool. coins[0] always return the coin paired against the basepool.

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
            _math_implementation: address,
            _base_pool: address,
            _coins: DynArray[address, MAX_COINS],
            _base_coins: DynArray[address, MAX_COINS],
            _rate_multipliers: DynArray[uint256, MAX_COINS],
            _asset_types: DynArray[uint8, MAX_COINS],
            _method_ids: DynArray[bytes4, MAX_COINS],
            _oracles: DynArray[address, MAX_COINS],
        ):
            ...

            coins = _coins  # <---------------- coins[1] is always base pool LP token.
            
            ...
        ```

    === "Example"

        ```shell
        >>> StableSwap.coins(0)
        '0x0E573Ce2736Dd9637A0b21058352e1667925C7a8'
        >>> StableSwap.coins(1)
        '0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490'
        ```

    !!!note
        The `coin[0]` is always the metapool token, and `coin[1]` is always the basepool token.



### `balances`
!!! description "`StableSwap.balances(i: uint256) -> uint256: view`"

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

            for i in range(N_COINS_128):

                if 2 in asset_types:
                    balances_i = ERC20(coins[i]).balanceOf(self) - self.admin_balances[i]
                else:
                    balances_i = self.stored_balances[i] - self.admin_balances[i]

                result.append(balances_i)

            return result
        ```

    === "Example"

        ```shell
        >>> StableSwap.balances(0)
        4183467888075
        >>> StableSwap.balances(1)
        2556883713184291687567176
        ```


### `get_balances`
!!! description "`StableSwap.get_balances() -> DynArray[uint256, MAX_COINS]: view`"

    Getter for an array with all coin balances in the pool.

    Returns: coin balances (`DynArray[uint256, MAX_COINS]`).

    !!!info
        This getter method does not account for admin fees. 

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

            for i in range(N_COINS_128):

                if 2 in asset_types:
                    balances_i = ERC20(coins[i]).balanceOf(self) - self.admin_balances[i]
                else:
                    balances_i = self.stored_balances[i] - self.admin_balances[i]

                result.append(balances_i)

            return result
        ```

    === "Example"

        ```shell
        >>> StableSwap.get_balances()
        [4183467888075, 2556883713184291687567176]
        ```

    !!!note
        The returned values do not take admin fees into account.


### `N_COINS`
!!! description "`StableSwap.N_COINS() -> uint256: view`"

    Getter for the total number of coins in the pool.

    Returns: number of coins (`uint256`).

    !!!info
        A metapool always consists of two tokens - basepool token and the token paired against it.

    ??? quote "Source code"

        ```vyper
        N_COINS: public(constant(uint256)) = 2
        ```

    === "Example"

        ```shell
        >>> StableSwap.N_COINS()
        2
        ```


### `totalSupply`
!!! description "`StableSwap.totalSupply() -> uint256: view`"

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

        ```shell
        >>> StableSwap.totalSupply()
        6811356567627648910003460
        ```