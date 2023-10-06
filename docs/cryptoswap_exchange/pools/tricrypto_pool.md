!!!tip 
    Good article to get a basic understanding of CurveV2: https://nagaking.substack.com/p/deep-dive-curve-v2-parameters



## **Exchange Methods**


### `exchange`
!!! description "`CryptoSwap.exchange(i: uint256, j: uint256, dx: uint256, min_dy: uint256, receiver: address = msg.sender) -> uint256:`"

    Function to exchange `dx` amount of coin `i` for coin `j` and receive a minimum amount of `min_dy`.

    Returns: 
    
    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `i` | `uint256` | Index for input coin |
    | `j` | `uint256` | Index for output coin |
    | `dx` | `uint256` | Amount of input coin being swapped in |
    | `min_dy` | `uint256` | Minimum amount of output coin to receive |
    | `receiver` | `address` | Address to send output coin to. Deafaults to `msg.sender` |

    ??? quote "Source code"

        ```python hl_lines="1 12"
        event TokenExchange:
            buyer: indexed(address)
            sold_id: uint256
            tokens_sold: uint256
            bought_id: uint256
            tokens_bought: uint256
            fee: uint256
            packed_price_scale: uint256

        @external
        @nonreentrant("lock")
        def exchange(
            i: uint256,
            j: uint256,
            dx: uint256,
            min_dy: uint256,
            receiver: address = msg.sender
        ) -> uint256:
            """
            @notice Exchange using wrapped native token by default
            @param i Index value for the input coin
            @param j Index value for the output coin
            @param dx Amount of input coin being swapped in
            @param min_dy Minimum amount of output coin to receive
            @param receiver Address to send the output coin to. Default is msg.sender
            @return uint256 Amount of tokens at index j received by the `receiver
            """
            return self._exchange(
                msg.sender,
                i,
                j,
                dx,
                min_dy,
                receiver,
                False,
            )

        @internal
        def _exchange(
            sender: address,
            i: uint256,
            j: uint256,
            dx: uint256,
            min_dy: uint256,
            receiver: address,
            expect_optimistic_transfer: bool,
        ) -> uint256:

            assert i != j  # dev: coin index out of range
            assert dx > 0  # dev: do not exchange 0 coins

            A_gamma: uint256[2] = self._A_gamma()
            xp: uint256[N_COINS] = self.balances
            dy: uint256 = 0

            y: uint256 = xp[j]  # <----------------- if j > N_COINS, this will revert.
            x0: uint256 = xp[i]  # <--------------- if i > N_COINS, this will  revert.
            xp[i] = x0 + dx

            packed_price_scale: uint256 = self.price_scale_packed
            price_scale: uint256[N_COINS - 1] = self._unpack_prices(
                packed_price_scale
            )

            xp[0] *= PRECISIONS[0]
            for k in range(1, N_COINS):
                xp[k] = unsafe_div(
                    xp[k] * price_scale[k - 1] * PRECISIONS[k],
                    PRECISION
                )  # <-------- Safu to do unsafe_div here since PRECISION is not zero.

            prec_i: uint256 = PRECISIONS[i]

            # ----------- Update invariant if A, gamma are undergoing ramps ---------

            t: uint256 = self.future_A_gamma_time
            if t > block.timestamp:

                x0 *= prec_i

                if i > 0:
                    x0 = unsafe_div(x0 * price_scale[i - 1], PRECISION)

                x1: uint256 = xp[i]  # <------------------ Back up old value in xp ...
                xp[i] = x0                                                         # |
                self.D = MATH.newton_D(A_gamma[0], A_gamma[1], xp, 0)              # |
                xp[i] = x1  # <-------------------------------------- ... and restore.

            # ----------------------- Calculate dy and fees --------------------------

            D: uint256 = self.D
            prec_j: uint256 = PRECISIONS[j]
            y_out: uint256[2] = MATH.get_y(A_gamma[0], A_gamma[1], xp, D, j)
            dy = xp[j] - y_out[0]
            xp[j] -= dy
            dy -= 1

            if j > 0:
                dy = dy * PRECISION / price_scale[j - 1]
            dy /= prec_j

            fee: uint256 = unsafe_div(self._fee(xp) * dy, 10**10)

            dy -= fee  # <--------------------- Subtract fee from the outgoing amount.
            assert dy >= min_dy, "Slippage"

            y -= dy

            y *= prec_j
            if j > 0:
                y = unsafe_div(y * price_scale[j - 1], PRECISION)
            xp[j] = y  # <------------------------------------------------- Update xp.

            # ------ Tweak price_scale with good initial guess for newton_D ----------

            packed_price_scale = self.tweak_price(A_gamma, xp, 0, y_out[1])

            # ---------------------- Do Transfers in and out -------------------------

            ########################## TRANSFER IN <-------

            # _transfer_in updates self.balances here. Update to state occurs before
            # external calls:
            self._transfer_in(
                i,
                dx,
                sender,
                expect_optimistic_transfer  # <---- If True, pool expects dx tokens to
            )  #                                                    be transferred in.

            ########################## -------> TRANSFER OUT

            # _transfer_out updates self.balances here. Update to state occurs before
            # external calls:
            self._transfer_out(j, dy, receiver)

            log TokenExchange(sender, i, dx, j, dy, fee, packed_price_scale)

            return dy
        ```

    === "Example"

        ```shell
        >>> CryptoSwap.exchange("todo")
        
        ```


### `exchange_underlying`
### `calc_token_amount`
### `get_dy`
### `get_dx`
### `exchange_extended`


## **Add/Remove Liquidity Methods**
### `calc_withdraw_one_coin`
### `add_liquidity`
### `remove_liquidity`
### `remove_liquidity_one_coin`




## **Fee Methods**

### `fee`
!!! description "`CryptoSwap.fee() -> uint256:`"

    Getter for the fee charged by the pool at the current state.

    Returns: fee (`uint256`).

    ??? quote "Source code"

        === "CurveTricryptoOptimizedWETH.vy"

            ```python hl_lines="1"
            @external
            @view
            def fee() -> uint256:
                """
                @notice Returns the fee charged by the pool at current state.
                @dev Not to be confused with the fee charged at liquidity action, since
                    there the fee is calculated on `xp` AFTER liquidity is added or
                    removed.
                @return uint256 fee bps.
                """
                return self._fee(self.xp())

            @internal
            @view
            def _fee(xp: uint256[N_COINS]) -> uint256:
                fee_params: uint256[3] = self._unpack(self.packed_fee_params)
                f: uint256 = MATH.reduction_coefficient(xp, fee_params[2])
                return unsafe_div(
                    fee_params[0] * f + fee_params[1] * (10**18 - f),
                    10**18
                )

            @internal
            @view
            def _unpack(_packed: uint256) -> uint256[3]:
                """
                @notice Unpacks a uint256 into 3 integers (values must be <= 10**18)
                @param val The uint256 to unpack
                @return uint256[3] A list of length 3 with unpacked integers
                """
                return [
                    (_packed >> 128) & 18446744073709551615,
                    (_packed >> 64) & 18446744073709551615,
                    _packed & 18446744073709551615,
                ]
            ```

        === "Math.vy"

            ```python hl_lines="1"
            @external
            @view
            def reduction_coefficient(x: uint256[N_COINS], fee_gamma: uint256) -> uint256:
                """
                @notice Calculates the reduction coefficient for the given x and fee_gamma
                @dev This method is used for calculating fees.
                @param x The x values
                @param fee_gamma The fee gamma value
                """
                return self._reduction_coefficient(x, fee_gamma)

            @internal
            @pure
            def _reduction_coefficient(x: uint256[N_COINS], fee_gamma: uint256) -> uint256:

                # fee_gamma / (fee_gamma + (1 - K))
                # where
                # K = prod(x) / (sum(x) / N)**N
                # (all normalized to 1e18)

                S: uint256 = x[0] + x[1] + x[2]

                # Could be good to pre-sort x, but it is used only for dynamic fee
                K: uint256 = 10**18 * N_COINS * x[0] / S
                K = unsafe_div(K * N_COINS * x[1], S)  # <- unsafe div is safu.
                K = unsafe_div(K * N_COINS * x[2], S)

                if fee_gamma > 0:
                    K = fee_gamma * 10**18 / (fee_gamma + 10**18 - K)

                return K
            ```

    === "Example"

        ```shell
        >>> CryptoSwap.fee()
        3771992
        ```

### `mid_fee`
!!! description "`CryptoSwap.mid_fee() -> uint256:`"

    Getter for the current mid fee.

    Returns: mid fee (`uint256`).

    ??? quote "Source code"

        ```python hl_lines="1"
        packed_fee_params: public(uint256)  # <---- Packs mid_fee, out_fee, fee_gamma.

        @view
        @external
        def mid_fee() -> uint256:
            """
            @notice Returns the current mid fee
            @return uint256 mid_fee value.
            """
            return self._unpack(self.packed_fee_params)[0]
        ```

    === "Example"

        ```shell
        >>> CryptoSwap.mid_fee()
        3000000
        ```



### `out_fee`
!!! description "`CryptoSwap.out_fee() -> uint256:`"

    Function to calculate the fee on `amounts` when adding liquidity. 

    Returns: out fee (`uint256`).

    ??? quote "Source code"

        ```python hl_lines="1"
        packed_fee_params: public(uint256)  # <---- Packs mid_fee, out_fee, fee_gamma.

        @view
        @external
        def out_fee() -> uint256:
            """
            @notice Returns the current out fee
            @return uint256 out_fee value.
            """
            return self._unpack(self.packed_fee_params)[1]
        ```

    === "Example"

        ```shell
        >>> CryptoSwap.out_fee()
        30000000
        ```


### `fee_gamma`
!!! description "`CryptoSwap.fee_gamma() -> uint256:`"

    Getter for the current fee gamma.

    Returns: fee gamma (`uint256`).

    ??? quote "Source code"

        ```python hl_lines="1"
        packed_fee_params: public(uint256)  # <---- Packs mid_fee, out_fee, fee_gamma.

        @view
        @external
        def fee_gamma() -> uint256:
            """
            @notice Returns the current fee gamma
            @return uint256 fee_gamma value.
            """
            return self._unpack(self.packed_fee_params)[2]
        ```

    === "Example"

        ```shell
        >>> CryptoSwap.fee_gamma()
        500000000000000
        ```


### `fee_receiver`
!!! description "`CryptoSwap.fee_receiver() -> address: view`"

    Getter for the fee receiver of the admin fees.

    Returns: current fee receiver (`address`).

    ??? quote "Source code"

        ```python hl_lines="1 3 8 13"
        interface Factory:
            def admin() -> address: view
            def fee_receiver() -> address: view
            def views_implementation() -> address: view

        @external
        @view
        def fee_receiver() -> address:
            """
            @notice Returns the address of the admin fee receiver.
            @return address Fee receiver.
            """
            return Factory(self.factory).fee_receiver()
        ```

    === "Example"

        ```shell
        >>> CryptoSwap.fee_receiver()
        '0xeCb456EA5365865EbAb8a2661B0c503410e9B347'
        ```


### `calc_token_fee`
!!! description "`CryptoSwap.calc_token_fee(amounts: uint256[N_COINS], xp: uint256[N_COINS]) -> uint256:`"

    Function to calculate the fee on `amounts` when adding liquidity. 

    Returns: fee (`uint256`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `amounts` |  `uint256[N_COINS]` | Amount of coins added to the pool |
    | `xp` |  `uint256[N_COINS]` | Current balances of the pool (multiplied by coin precision) |

    ??? quote "Source code"

        ```python hl_lines="1"
        @view
        @internal
        def _calc_token_fee(amounts: uint256[N_COINS], xp: uint256[N_COINS]) -> uint256:
            # fee = sum(amounts_i - avg(amounts)) * fee' / sum(amounts)
            fee: uint256 = unsafe_div(
                unsafe_mul(self._fee(xp), N_COINS),
                unsafe_mul(4, unsafe_sub(N_COINS, 1))
            )

            S: uint256 = 0
            for _x in amounts:
                S += _x

            avg: uint256 = unsafe_div(S, N_COINS)
            Sdiff: uint256 = 0

            for _x in amounts:
                if _x > avg:
                    Sdiff += unsafe_sub(_x, avg)
                else:
                    Sdiff += unsafe_sub(avg, _x)

            return fee * Sdiff / S + NOISE_FEE

        @external
        @view
        def calc_token_fee(
            amounts: uint256[N_COINS], xp: uint256[N_COINS]
        ) -> uint256:
            """
            @notice Returns the fee charged on the given amounts for add_liquidity.
            @param amounts The amounts of coins being added to the pool.
            @param xp The current balances of the pool multiplied by coin precisions.
            @return uint256 Fee charged.
            """
            return self._calc_token_fee(amounts, xp)
        ```

    === "Example"

        ```shell
        >>> CryptoSwap.calc_token_fee()
        '0xeCb456EA5365865EbAb8a2661B0c503410e9B347'
        ```


### `fee_calc`
!!! description "`CryptoSwap.fee_calc(xp: uint256[N_COINS]) -> uint256: view`"

    Getter for the charged fee by the pool at the current state based on the pools balances.

    Returns: charged fee (`uint256`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `xp` |  `uint256[N_COINS]` | Balances of pool multiplied by the coin precision |

    ??? quote "Source code"

        === "CurveTricryptoOptimizedWETH.vy"

            ```python hl_lines="1"
            @external
            @view
            def fee_calc(xp: uint256[N_COINS]) -> uint256:  # <----- For by view contract.
                """
                @notice Returns the fee charged by the pool at current state.
                @param xp The current balances of the pool multiplied by coin precisions.
                @return uint256 Fee value.
                """
                return self._fee(xp)

            @internal
            @view
            def _fee(xp: uint256[N_COINS]) -> uint256:
                fee_params: uint256[3] = self._unpack(self.packed_fee_params)
                f: uint256 = MATH.reduction_coefficient(xp, fee_params[2])
                return unsafe_div(
                    fee_params[0] * f + fee_params[1] * (10**18 - f),
                    10**18
                )
            ```

        === "Math.vy"

            ```python hl_lines="1"
            @external
            @view
            def reduction_coefficient(x: uint256[N_COINS], fee_gamma: uint256) -> uint256:
                """
                @notice Calculates the reduction coefficient for the given x and fee_gamma
                @dev This method is used for calculating fees.
                @param x The x values
                @param fee_gamma The fee gamma value
                """
                return self._reduction_coefficient(x, fee_gamma)

            @internal
            @pure
            def _reduction_coefficient(x: uint256[N_COINS], fee_gamma: uint256) -> uint256:

                # fee_gamma / (fee_gamma + (1 - K))
                # where
                # K = prod(x) / (sum(x) / N)**N
                # (all normalized to 1e18)

                S: uint256 = x[0] + x[1] + x[2]

                # Could be good to pre-sort x, but it is used only for dynamic fee
                K: uint256 = 10**18 * N_COINS * x[0] / S
                K = unsafe_div(K * N_COINS * x[1], S)  # <- unsafe div is safu.
                K = unsafe_div(K * N_COINS * x[2], S)

                if fee_gamma > 0:
                    K = fee_gamma * 10**18 / (fee_gamma + 10**18 - K)

                return K
            ```


            === "Example"

                ```shell
                >>> CryptoSwap.fee_calc('todo')
                ''
                ```


### `allowed_extra_profit` (x)
!!! description "`CryptoSwap.allowed_extra_profit() -> uint256:`"

    Getter for the current allowed extra profit. what does this do? 

    Returns: allowed extra profit (`uint256`).

    ??? quote "Source code"

        ```python hl_lines="1"
        packed_rebalancing_params: public(uint256)  # <---------- Contains rebalancing
        #               parameters allowed_extra_profit, adjustment_step, and ma_time.

        @view
        @external
        def allowed_extra_profit() -> uint256:
            """
            @notice Returns the current allowed extra profit
            @return uint256 allowed_extra_profit value.
            """
            return self._unpack(self.packed_rebalancing_params)[0]
        ```

    === "Example"

        ```shell
        >>> CryptoSwap.allowed_extra_profit()
        2000000000000
        ```


### `xcp_profit` (x)
!!! description "`CryptoSwap.xcp_profit() -> uint256:`"

    todo

    Returns: 

    ??? quote "Source code"

        ```python hl_lines="1"
        xcp_profit: public(uint256)
        ```

    === "Example"

        ```shell
        >>> CryptoSwap.xcp_profit()
        1003213938530958270
        ```


### `xcp_profit_a` (x)
!!! description "`CryptoSwap.xcp_profit_a() -> uint256:`"

    todo. This is the full profit at the last claim of admin fees.

    Returns:

    ??? quote "Source code"

        ```python hl_lines="1"
        xcp_profit_a: public(uint256)  # <--- Full profit at last claim of admin fees.
        ```

    === "Example"

        ```shell
        >>> CryptoSwap.xcp_profit_a()
        1003211094190051384
        ```


### `ADMIN_FEE`
!!! description "`CryptoSwap.xcp_profit_a() -> uint256:`"

    Getter for the admin fee of the pool. 

    Returns: admin fee (`uint256`).

    !!!note
        `ADMIN_FEE` is a constant variable, therefore it cannot be changed.

    ??? quote "Source code"

        ```python hl_lines="1"
        ADMIN_FEE: public(constant(uint256)) = 5 * 10**9  # <----- 50% of earned fees.        ```
        ```

    === "Example"

        ```shell
        >>> CryptoSwap.xcp_profit_a()
        1003211094190051384
        ```


### `claim_admin_fees`
!!! description "`CryptoSwap.claim_admin_fees() -> uint256:`"

    Function to claim the accumulated admin fees of the pool.

    Emits event: `ClaimAdminFee`

    ??? quote "Source code"

        ```python hl_lines="1"
        interface Factory:
            def admin() -> address: view
            def fee_receiver() -> address: view
            def views_implementation() -> address: view

        event ClaimAdminFee:
            admin: indexed(address)
            tokens: uint256

        @external
        @nonreentrant("lock")
        def claim_admin_fees():
            """
            @notice Claim admin fees. Callable by anyone.
            """
            self._claim_admin_fees()

        @internal
        def _claim_admin_fees():
            """
            @notice Claims admin fees and sends it to fee_receiver set in the factory.
            """
            A_gamma: uint256[2] = self._A_gamma()

            xcp_profit: uint256 = self.xcp_profit  # <---------- Current pool profits.
            xcp_profit_a: uint256 = self.xcp_profit_a  # <- Profits at previous claim.
            total_supply: uint256 = self.totalSupply

            # Do not claim admin fees if:
            # 1. insufficient profits accrued since last claim, and
            # 2. there are less than 10**18 (or 1 unit of) lp tokens, else it can lead
            #    to manipulated virtual prices.
            if xcp_profit <= xcp_profit_a or total_supply < 10**18:
                return

            #      Claim tokens belonging to the admin here. This is done by 'gulping'
            #       pool tokens that have accrued as fees, but not accounted in pool's
            #         `self.balances` yet: pool balances only account for incoming and
            #                  outgoing tokens excluding fees. Following 'gulps' fees:

            for i in range(N_COINS):
                if coins[i] == WETH20:
                    self.balances[i] = self.balance
                else:
                    self.balances[i] = ERC20(coins[i]).balanceOf(self)

            #            If the pool has made no profits, `xcp_profit == xcp_profit_a`
            #                         and the pool gulps nothing in the previous step.

            vprice: uint256 = self.virtual_price

            #  Admin fees are calculated as follows.
            #      1. Calculate accrued profit since last claim. `xcp_profit`
            #         is the current profits. `xcp_profit_a` is the profits
            #         at the previous claim.
            #      2. Take out admin's share, which is hardcoded at 5 * 10**9.
            #         (50% => half of 100% => 10**10 / 2 => 5 * 10**9).
            #      3. Since half of the profits go to rebalancing the pool, we
            #         are left with half; so divide by 2.

            fees: uint256 = unsafe_div(
                unsafe_sub(xcp_profit, xcp_profit_a) * ADMIN_FEE, 2 * 10**10
            )

            # ------------------------------ Claim admin fees by minting admin's share
            #                                                of the pool in LP tokens.
            receiver: address = Factory(self.factory).fee_receiver()
            if receiver != empty(address) and fees > 0:

                frac: uint256 = vprice * 10**18 / (vprice - fees) - 10**18
                claimed: uint256 = self.mint_relative(receiver, frac)

                xcp_profit -= fees * 2

                self.xcp_profit = xcp_profit

                log ClaimAdminFee(receiver, claimed)

            # ------------------------------------------- Recalculate D b/c we gulped.
            D: uint256 = MATH.newton_D(A_gamma[0], A_gamma[1], self.xp(), 0)
            self.D = D

            # ------------------- Recalculate virtual_price following admin fee claim.
            #     In this instance we do not check if current virtual price is greater
            #               than old virtual price, since the claim process can result
            #                                     in a small decrease in pool's value.

            self.virtual_price = 10**18 * self.get_xcp(D) / self.totalSupply
            self.xcp_profit_a = xcp_profit  # <------------ Cache last claimed profit.
        ```

    === "Example"

        ```shell
        >>> CryptoSwap.claim_admin_fees()
        ```



## **Price Oracle Methods**
### `lp_price`
### `get_virtual_price`
### `price_oracle`
### `last_prices`
### `price_scale`
### `ma_time`
### `last_prices_timestamp`
### `virtual_price`



## **Contract Info Methods**
### `precisions`
### `DOMAIN_SEPERATOR`
### `WETH20`
### `MATH`
### `coins`
### `factory`
### `balances`
### `D`



## **Bonding Curve Parameters**

what does A do? what does gamma do? when does initial A gamma etc get changed? calling which functions?
`future_A_gamma_time` is the time when ramping up is finished, when the ramping process is initialized.


### `A`
!!! description "`CryptoSwap.A() -> uint256:`"

    Getter for the current pool amplification parameter.

    Returns: amplification parameter (A) (`uint256`).

    ??? quote "Source code"

        ```python hl_lines="1"
        @view
        @external
        def A() -> uint256:
            """
            @notice Returns the current pool amplification parameter.
            @return uint256 A param.
            """
            return self._A_gamma()[0]

        @view
        @internal
        def _A_gamma() -> uint256[2]:
            t1: uint256 = self.future_A_gamma_time

            A_gamma_1: uint256 = self.future_A_gamma
            gamma1: uint256 = A_gamma_1 & 2**128 - 1
            A1: uint256 = A_gamma_1 >> 128

            if block.timestamp < t1:

                # --------------- Handle ramping up and down of A --------------------

                A_gamma_0: uint256 = self.initial_A_gamma
                t0: uint256 = self.initial_A_gamma_time

                t1 -= t0
                t0 = block.timestamp - t0
                t2: uint256 = t1 - t0

                A1 = ((A_gamma_0 >> 128) * t2 + A1 * t0) / t1
                gamma1 = ((A_gamma_0 & 2**128 - 1) * t2 + gamma1 * t0) / t1

            return [A1, gamma1]
        ```

    === "Example"

        ```shell
        >>> CryptoSwap.A()
        1707629
        ```


### `gamma`
!!! description "`CryptoSwap.gamma() -> uint256:`"

    Getter for the current pool gamma parameter.

    Returns: gamma (`uint256`).

    ??? quote "Source code"

        ```python hl_lines="1"
        @view
        @external
        def gamma() -> uint256:
            """
            @notice Returns the current pool gamma parameter.
            @return uint256 gamma param.
            """
            return self._A_gamma()[1]

        @view
        @internal
        def _A_gamma() -> uint256[2]:
            t1: uint256 = self.future_A_gamma_time

            A_gamma_1: uint256 = self.future_A_gamma
            gamma1: uint256 = A_gamma_1 & 2**128 - 1
            A1: uint256 = A_gamma_1 >> 128

            if block.timestamp < t1:

                # --------------- Handle ramping up and down of A --------------------

                A_gamma_0: uint256 = self.initial_A_gamma
                t0: uint256 = self.initial_A_gamma_time

                t1 -= t0
                t0 = block.timestamp - t0
                t2: uint256 = t1 - t0

                A1 = ((A_gamma_0 >> 128) * t2 + A1 * t0) / t1
                gamma1 = ((A_gamma_0 & 2**128 - 1) * t2 + gamma1 * t0) / t1

            return [A1, gamma1]
        ```

    === "Example"

        ```shell
        >>> CryptoSwap.gamma()
        11809167828997
        ```

## **Price Scaling (todo)**
### `packed_rebalancing_params`
### `adjustment_step`




!!! description "`CryptoSwap.fee_receiver() -> address: view`"

    Getter for the fee receiver of the accumulated fees.

    Returns:

    Emits: <mark style="background-color: #FFD580; color: black">SomeLog</mark>

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `input` |  `type` | Contract input |

    ??? quote "Source code"

        ```python hl_lines="1"
    
        ```

    === "Example"

        ```shell
        >>> CryptoSwap.fee_receiver()
        '0xeCb456EA5365865EbAb8a2661B0c503410e9B347'
        ```