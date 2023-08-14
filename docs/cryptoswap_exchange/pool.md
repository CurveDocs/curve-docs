cryptoswap pool smart contracts

pool is also lp token at the same time.

very, very good article to understand curve v2: https://nagaking.substack.com/p/deep-dive-curve-v2-parameters


what is `_domain_seperator`?


explain what `_pack()` and `_unpack()` does so i dont need to add code in every code source
explain the fee structure. what is mid_fee, out_fee: when creating a new contract, mid_fee, out_fee and fee_gamma gets packed into `packed_fee_params`. why are fees packed into one variable?
what does `allow_extra_profit` do??

how and when are fees charged? when can fees be claimed(enought profit?)?

three classes of parameters: 

- bonding curve: `A` and `gamma`  
- price scaling: `ma_time`, `allowed_extra_profit` and `adjustment_step`  
- [fee](#fee): `mid_fee`, `out_fee` and `fee_gamma`  





`packed_fee_params` contains `mid_fee`, `out_fee`, `fee_gamma`.
`packed_rebalacing_parameters` contains `allowed_extra_profit`, `adjustment_step`, and `ma_time`.

when chaning parameters, new fees get _pack() again into one variable.

??? quote "_pack()"

    ```python hl_lines="1 3 8 13"
    @internal
    @view
    def _pack(x: uint256[3]) -> uint256:
        """
        @notice Packs 3 integers with values <= 10**18 into a uint256
        @param x The uint256[3] to pack
        @return uint256 Integer with packed values
        """
        return (x[0] << 128) | (x[1] << 64) | x[2]
    ```


??? quote "_unpack()"

    ```python hl_lines="1 3 8 13"
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


## **Fees**

Fees are charged based on the balance/imbalance of the pool. Fee is low when the pool is balanced and increases the more it is imbalanced.

There are three different kind of fees:  

- `fee_mid`: charged fee when pool is perfectly balanced (minimum possible fee).  
- `out_fee`: charged fee when pools is completely imbalanced (maximum possible fee).
- `fee_gamma`: determines the speed at which the fee increases when the pool becomes imbalanced. A low value leads to a more rapid fee increase, while a high value causes the fee to rise more gradually.


<figure markdown>
  ![](../images/curveV2_fee.png){ width="400" }
  <figcaption></figcaption>
</figure>



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








## **Price Oracle**
### `lp_price`
### `get_virtual_price`
### `price_oracle`
### `last_prices`
### `price_scale`
### `ma_time`
### `last_prices_timestamp`
### `virtual_price`


## **Exchange Methods**
### `calc_token_amount`
### `get_dy`
### `get_dx`
### `exchange`
### `exchange_underlying`
### `exchange_extended`


## **Add/Remove Liquidity Methods**
### `calc_withdraw_one_coin`
### `add_liquidity`
### `remove_liquidity`
### `remove_liquidity_one_coin`



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


## **AMM Admin Functions**
### `ramp_A_gamma`
!!! description "`CryptoSwap.ramp_A_gamma(future_A: uint256, future_gamma: uint256, future_time: uint256):`"

    Function to ramp A and gamma parameter values linearly.

    Emits event: `RampAgamma`

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `future_A` | `uint256` | future A value |
    | `future_gamma` | `uint256` | future gamma value |
    | `future_time` | `uint256` | timestamp at which the ramping will end|

    !!!note
        This function is only callable by the `admin` of the factory contract. 

    ??? quote "Source code"

        ```python hl_lines="1"
        event RampAgamma:
            initial_A: uint256
            future_A: uint256
            initial_gamma: uint256
            future_gamma: uint256
            initial_time: uint256
            future_time: uint256

        @external
        def ramp_A_gamma(
            future_A: uint256, future_gamma: uint256, future_time: uint256
        ):
            """
            @notice Initialise Ramping A and gamma parameter values linearly.
            @dev Only accessible by factory admin, and only
            @param future_A The future A value.
            @param future_gamma The future gamma value.
            @param future_time The timestamp at which the ramping will end.
            """
            assert msg.sender == Factory(self.factory).admin()  # dev: only owner
            assert block.timestamp > self.initial_A_gamma_time + (MIN_RAMP_TIME - 1)  # dev: ramp undergoing
            assert future_time > block.timestamp + MIN_RAMP_TIME - 1  # dev: insufficient time

            A_gamma: uint256[2] = self._A_gamma()
            initial_A_gamma: uint256 = A_gamma[0] << 128
            initial_A_gamma = initial_A_gamma | A_gamma[1]

            assert future_A > MIN_A - 1
            assert future_A < MAX_A + 1
            assert future_gamma > MIN_GAMMA - 1
            assert future_gamma < MAX_GAMMA + 1

            ratio: uint256 = 10**18 * future_A / A_gamma[0]
            assert ratio < 10**18 * MAX_A_CHANGE + 1
            assert ratio > 10**18 / MAX_A_CHANGE - 1

            ratio = 10**18 * future_gamma / A_gamma[1]
            assert ratio < 10**18 * MAX_A_CHANGE + 1
            assert ratio > 10**18 / MAX_A_CHANGE - 1

            self.initial_A_gamma = initial_A_gamma
            self.initial_A_gamma_time = block.timestamp

            future_A_gamma: uint256 = future_A << 128
            future_A_gamma = future_A_gamma | future_gamma
            self.future_A_gamma_time = future_time
            self.future_A_gamma = future_A_gamma

            log RampAgamma(
                A_gamma[0],
                future_A,
                A_gamma[1],
                future_gamma,
                block.timestamp,
                future_time,
            )
        ```

    === "Example"

        ```shell
        >>> CryptoSwap.ramp_A_gamma('todo')
        ```


### `stop_ramp_A_gamma`
!!! description "`CryptoSwap.stop_ramp_A_gamma():`"

    Function to immediately stop ramping A and gamma parameters.

    Emits event: `StopRampA`

    !!!note
        This function is only callable by the `admin` of the factory contract. 

    ??? quote "Source code"

        ```python hl_lines="1"
        event StopRampA:
            current_A: uint256
            current_gamma: uint256
            time: uint256

        @external
        def stop_ramp_A_gamma():
            """
            @notice Stop Ramping A and gamma parameters immediately.
            @dev Only accessible by factory admin.
            """
            assert msg.sender == Factory(self.factory).admin()  # dev: only owner

            A_gamma: uint256[2] = self._A_gamma()
            current_A_gamma: uint256 = A_gamma[0] << 128
            current_A_gamma = current_A_gamma | A_gamma[1]
            self.initial_A_gamma = current_A_gamma
            self.future_A_gamma = current_A_gamma
            self.initial_A_gamma_time = block.timestamp
            self.future_A_gamma_time = block.timestamp

            # ------ Now (block.timestamp < t1) is always False, so we return saved A.

            log StopRampA(A_gamma[0], A_gamma[1], block.timestamp)
        ```

    === "Example"

        ```shell
        >>> CryptoSwap.stop_ramp_A_gamma()
        ```

### `initial_A_gamma` (x)
!!! description "`CryptoSwap.initial_A_gamma() -> uint256:`"

    Getter for the initial A/gamma.

    Returns: A/gamma (`uint256`).

    ??? quote "Source code"

        ```python hl_lines="1"
        initial_A_gamma: public(uint256)
        ```

    === "Example"

        ```shell
        >>> CryptoSwap.initial_A_gamma()
        581076037942835227425498917514114728328226821
        ```


### `initial_A_gamma_time` (x)
!!! description "`CryptoSwap.initial_A_gamma_time() -> uint256:`"

    Getter for the initial A/gamma time.

    Returns: A/gamma time (`uint256`).

    ??? quote "Source code"

        ```python hl_lines="1"
        initial_A_gamma_time: public(uint256)
        ```

    === "Example"

        ```shell
        >>> CryptoSwap.initial_A_gamma_time()
        0
        ```


### `future_A_gamma`
!!! description "`CryptoSwap.future_A_gamma() -> uint256:`"

    Getter for the future A/gamma.

    Returns: future A/gamma (`uint256`).

    ??? quote "Source code"

        ```python hl_lines="1"
        future_A_gamma: public(uint256)
        ```

    === "Example"

        ```shell
        >>> CryptoSwap.future_A_gamma()
        581076037942835227425498917514114728328226821
        ```

### `future_A_gamma_time`
!!! description "`CryptoSwap.future_A_gamma_time() -> uint256:`"

    Getter for the future A/gamma time.

    Returns: future A/gamma time (`uint256`).

    ??? quote "Source code"

        ```python hl_lines="1"
        future_A_gamma_time: public(uint256)
        ```

    === "Example"

        ```shell
        >>> CryptoSwap.future_A_gamma_time()
        0
        ```


### `commit_new_parameters` (x)
!!! description "`CryptoSwap.commit_new_parameters(_new_mid_fee: uint256, _new_out_fee: uint256, _new_fee_gamma: uint256, _new_allowed_extra_profit: uint256, _new_adjustment_step: uint256, _new_ma_time: uint256):`"

    Function to commit new parameters. When calling the function it checks if `admin_actions_deadline` is equal to zero. if not then there is an ongoing action. When calling the function successsfully it sets a new `deadline` to apply the new parameters. deadline is block.timestamp + `ADMIN_ACTIONS_DELAY`. applies the new values to `future_packed_rebalancing_params` and `future_packed_fee_params`.

    Emits event: `CommitNewParameters`

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_new_mid_fee` | `uint256` | new `mid_fee` value |
    | `_new_out_fee` | `uint256` | new `out_fee` value |
    | `_new_fee_gamma` | `uint256` | new `fee_gamma` value |
    | `_new_allowed_extra_profit` | `uint256` | new `allowed_extra_profit` value |
    | `_new_adjustment_step` | `uint256` |new `adjustment_step` value |
    | `_new_ma_time` | `uint256` | new `ma_time` value |

    !!!note
        This function is only callable by the `admin` of the factory contract. 

    ??? quote "Source code"

        ```python hl_lines="1"
        event CommitNewParameters:
            deadline: indexed(uint256)
            mid_fee: uint256
            out_fee: uint256
            fee_gamma: uint256
            allowed_extra_profit: uint256
            adjustment_step: uint256
            ma_time: uint256

        future_packed_rebalancing_params: uint256
        future_packed_fee_params: uint256

        ADMIN_ACTIONS_DELAY: constant(uint256) = 3 * 86400

        @external
        def commit_new_parameters(
            _new_mid_fee: uint256,
            _new_out_fee: uint256,
            _new_fee_gamma: uint256,
            _new_allowed_extra_profit: uint256,
            _new_adjustment_step: uint256,
            _new_ma_time: uint256,
        ):
            """
            @notice Commit new parameters.
            @dev Only accessible by factory admin.
            @param _new_mid_fee The new mid fee.
            @param _new_out_fee The new out fee.
            @param _new_fee_gamma The new fee gamma.
            @param _new_allowed_extra_profit The new allowed extra profit.
            @param _new_adjustment_step The new adjustment step.
            @param _new_ma_time The new ma time. ma_time is time_in_seconds/ln(2).
            """
            assert msg.sender == Factory(self.factory).admin()  # dev: only owner
            assert self.admin_actions_deadline == 0  # dev: active action

            _deadline: uint256 = block.timestamp + ADMIN_ACTIONS_DELAY
            self.admin_actions_deadline = _deadline

            # ----------------------------- Set fee params ---------------------------

            new_mid_fee: uint256 = _new_mid_fee
            new_out_fee: uint256 = _new_out_fee
            new_fee_gamma: uint256 = _new_fee_gamma

            current_fee_params: uint256[3] = self._unpack(self.packed_fee_params)

            if new_out_fee < MAX_FEE + 1:
                assert new_out_fee > MIN_FEE - 1  # dev: fee is out of range
            else:
                new_out_fee = current_fee_params[1]

            if new_mid_fee > MAX_FEE:
                new_mid_fee = current_fee_params[0]
            assert new_mid_fee <= new_out_fee  # dev: mid-fee is too high

            if new_fee_gamma < 10**18:
                assert new_fee_gamma > 0  # dev: fee_gamma out of range [1 .. 10**18]
            else:
                new_fee_gamma = current_fee_params[2]

            self.future_packed_fee_params = self._pack(
                [new_mid_fee, new_out_fee, new_fee_gamma]
            )

            # ----------------- Set liquidity rebalancing parameters -----------------

            new_allowed_extra_profit: uint256 = _new_allowed_extra_profit
            new_adjustment_step: uint256 = _new_adjustment_step
            new_ma_time: uint256 = _new_ma_time

            current_rebalancing_params: uint256[3] = self._unpack(self.packed_rebalancing_params)

            if new_allowed_extra_profit > 10**18:
                new_allowed_extra_profit = current_rebalancing_params[0]

            if new_adjustment_step > 10**18:
                new_adjustment_step = current_rebalancing_params[1]

            if new_ma_time < 872542:  # <----- Calculated as: 7 * 24 * 60 * 60 / ln(2)
                assert new_ma_time > 86  # dev: MA time should be longer than 60/ln(2)
            else:
                new_ma_time = current_rebalancing_params[2]

            self.future_packed_rebalancing_params = self._pack(
                [new_allowed_extra_profit, new_adjustment_step, new_ma_time]
            )

            # ---------------------------------- LOG ---------------------------------

            log CommitNewParameters(
                _deadline,
                new_mid_fee,
                new_out_fee,
                new_fee_gamma,
                new_allowed_extra_profit,
                new_adjustment_step,
                new_ma_time,
            )
        ```

    === "Example"

        ```shell
        >>> CryptoSwap.commit_new_parameters('todo')
        ```


### `apply_new_parameters` (rewrite)
!!! description "`CryptoSwap.apply_new_parameters()`"

    Function to apply the committed parameters. This function can only ne successfully called when the `admin_actions_deadline` is not zero and not yet reached. otherwise the call reverts. When call succeeds, it sets the `admin_actions_deadline` back to 0. sets the future parameters as the "normal" parameters.

    Emits event: `NewParameters`

    ??? quote "Source code"

        ```python hl_lines="1"
        event NewParameters:
            mid_fee: uint256
            out_fee: uint256
            fee_gamma: uint256
            allowed_extra_profit: uint256
            adjustment_step: uint256
            ma_time: uint256

        packed_rebalancing_params: public(uint256)  # <---------- Contains rebalancing
        #               parameters allowed_extra_profit, adjustment_step, and ma_time.
        future_packed_rebalancing_params: uint256

        packed_fee_params: public(uint256)  # <---- Packs mid_fee, out_fee, fee_gamma.
        future_packed_fee_params: uint256

        @external
        @nonreentrant("lock")
        def apply_new_parameters():
            """
            @notice Apply committed parameters.
            @dev Only callable after admin_actions_deadline.
            """
            assert block.timestamp >= self.admin_actions_deadline  # dev: insufficient time
            assert self.admin_actions_deadline != 0  # dev: no active action

            self.admin_actions_deadline = 0

            packed_fee_params: uint256 = self.future_packed_fee_params
            self.packed_fee_params = packed_fee_params

            packed_rebalancing_params: uint256 = self.future_packed_rebalancing_params
            self.packed_rebalancing_params = packed_rebalancing_params

            rebalancing_params: uint256[3] = self._unpack(packed_rebalancing_params)
            fee_params: uint256[3] = self._unpack(packed_fee_params)

            log NewParameters(
                fee_params[0],
                fee_params[1],
                fee_params[2],
                rebalancing_params[0],
                rebalancing_params[1],
                rebalancing_params[2],
            )
        ```

    === "Example"

        ```shell
        >>> CryptoSwap.apply_new_parameters()
        ```


### `revert_new_parameters`
!!! description "`CryptoSwap.revert_new_parameters() -> address: view`"

    Function to revert the new parameters changes. This call resets `admin_actions_deadline` to 0, ensuring that the `apply_new_parameters` function cannot be executed successfully.

    !!!note
        This function is only callable by the `admin` of the factory contract. 

    ??? quote "Source code"

        ```python hl_lines="2 9"
        @external
        def revert_new_parameters():
            """
            @notice Revert committed parameters
            @dev Only accessible by factory admin. Setting admin_actions_deadline to 0
                ensures a revert in apply_new_parameters.
            """
            assert msg.sender == Factory(self.factory).admin()  # dev: only owner
            self.admin_actions_deadline = 0
        ```

    === "Example"

        ```shell
        >>> CryptoSwap.revert_new_parameters()
        ```


### `admin_actions_deadline`
!!! description "`CryptoSwap.admin_actions_deadline() -> uint256: view`"

    Getter for the admin actions deadline. This is the deadline until which new parameter changes can be applied. When committing new changes, there is a three-day timespan to apply them (`ADMIN_ACTIONS_DELAY`), otherwise the call will revert.

    Returns: timestamp (`uint256`).

    ??? quote "Source code"

        ```python hl_lines="1"
        admin_actions_deadline: public(uint256)

        ADMIN_ACTIONS_DELAY: constant(uint256) = 3 * 86400
        ```

    === "Example"

        ```shell
        >>> CryptoSwap.admin_actions_deadline()
        0
        ```


## **Price Scaling**
### `packed_rebalancing_params`
### `adjustment_step`






## **LP Token Methods**
### `name`
!!! description "`CryptoSwap.name() -> String[64]: view`"

    Getter for the name of the LP token.

    Returns: name (`String[64]`).

    ??? quote "Source code"

        ```python hl_lines="1 4 5 23"
        name: public(immutable(String[64]))

        @external
        def __init__(
            _name: String[64],
            _symbol: String[32],
            _coins: address[N_COINS],
            _math: address,
            _weth: address,
            _salt: bytes32,
            packed_precisions: uint256,
            packed_A_gamma: uint256,
            packed_fee_params: uint256,
            packed_rebalancing_params: uint256,
            packed_prices: uint256,
        ):

            WETH20 = _weth
            MATH = Math(_math)

            self.factory = msg.sender

            name = _name
            symbol = _symbol
            coins = _coins

            self.packed_precisions = packed_precisions  # <------- Precisions of coins
            #                            are calculated as 10**(18 - coin.decimals()).

            self.initial_A_gamma = packed_A_gamma  # <------------------- A and gamma.
            self.future_A_gamma = packed_A_gamma

            self.packed_rebalancing_params = packed_rebalancing_params  # <-- Contains
            #               rebalancing params: allowed_extra_profit, adjustment_step,
            #                                                         and ma_exp_time.

            self.packed_fee_params = packed_fee_params  # <-------------- Contains Fee
            #                                  params: mid_fee, out_fee and fee_gamma.

            self.price_scale_packed = packed_prices
            self.price_oracle_packed = packed_prices
            self.last_prices_packed = packed_prices
            self.last_prices_timestamp = block.timestamp
            self.xcp_profit_a = 10**18

            #         Cache DOMAIN_SEPARATOR. If chain.id is not CACHED_CHAIN_ID, then
            #     DOMAIN_SEPARATOR will be re-calculated each time `permit` is called.
            #                   Otherwise, it will always use CACHED_DOMAIN_SEPARATOR.
            #                       see: `_domain_separator()` for its implementation.
            NAME_HASH = keccak256(name)
            salt = _salt
            CACHED_CHAIN_ID = chain.id
            CACHED_DOMAIN_SEPARATOR = keccak256(
                _abi_encode(
                    EIP712_TYPEHASH,
                    NAME_HASH,
                    VERSION_HASH,
                    chain.id,
                    self,
                    salt,
                )
            )

            log Transfer(empty(address), self, 0)  # <------- Fire empty transfer from
            #                                       0x0 to self for indexers to catch.
        ```

    === "Example"

        ```shell
        >>> CryptoSwap.name()
        'TricryptoUSDT'
        ```


### `symbol`
!!! description "`CryptoSwap.symbol() -> String[32]: view`"

    Getter for the symbol of the LP token.

    Returns: symbol (`String[32]`).

    ??? quote "Source code"

        ```python hl_lines="1 4 6 24"
        symbol: public(immutable(String[32]))

        @external
        def __init__(
            _name: String[64],
            _symbol: String[32],
            _coins: address[N_COINS],
            _math: address,
            _weth: address,
            _salt: bytes32,
            packed_precisions: uint256,
            packed_A_gamma: uint256,
            packed_fee_params: uint256,
            packed_rebalancing_params: uint256,
            packed_prices: uint256,
        ):

            WETH20 = _weth
            MATH = Math(_math)

            self.factory = msg.sender

            name = _name
            symbol = _symbol
            coins = _coins

            self.packed_precisions = packed_precisions  # <------- Precisions of coins
            #                            are calculated as 10**(18 - coin.decimals()).

            self.initial_A_gamma = packed_A_gamma  # <------------------- A and gamma.
            self.future_A_gamma = packed_A_gamma

            self.packed_rebalancing_params = packed_rebalancing_params  # <-- Contains
            #               rebalancing params: allowed_extra_profit, adjustment_step,
            #                                                         and ma_exp_time.

            self.packed_fee_params = packed_fee_params  # <-------------- Contains Fee
            #                                  params: mid_fee, out_fee and fee_gamma.

            self.price_scale_packed = packed_prices
            self.price_oracle_packed = packed_prices
            self.last_prices_packed = packed_prices
            self.last_prices_timestamp = block.timestamp
            self.xcp_profit_a = 10**18

            #         Cache DOMAIN_SEPARATOR. If chain.id is not CACHED_CHAIN_ID, then
            #     DOMAIN_SEPARATOR will be re-calculated each time `permit` is called.
            #                   Otherwise, it will always use CACHED_DOMAIN_SEPARATOR.
            #                       see: `_domain_separator()` for its implementation.
            NAME_HASH = keccak256(name)
            salt = _salt
            CACHED_CHAIN_ID = chain.id
            CACHED_DOMAIN_SEPARATOR = keccak256(
                _abi_encode(
                    EIP712_TYPEHASH,
                    NAME_HASH,
                    VERSION_HASH,
                    chain.id,
                    self,
                    salt,
                )
            )

            log Transfer(empty(address), self, 0)  # <------- Fire empty transfer from
            #                                       0x0 to self for indexers to catch.
        ```

    === "Example"

        ```shell
        >>> CryptoSwap.symbol()
        'crvUSDTWBTCWETH'
        ```


### `decimals`
!!! description "`CryptoSwap.name() -> uint8: view`"

    Getter for the decimals of the LP token.

    Returns: decimals (`uint8`).

    !!!note
        `decimals` is a constant variable which is set to 18.

    ??? quote "Source code"

        ```python hl_lines="1"
        decimals: public(constant(uint8)) = 18
        ```

    === "Example"

        ```shell
        >>> CryptoSwap.decimals()
        18
        ```


### `version`
!!! description "`CryptoSwap.version() -> String[8]: view`"

    Getter for the version of the LP token.

    Returns: version (`String[8]`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `input` |  `type` | Contract input |

    ??? quote "Source code"

        ```python hl_lines="1"
        version: public(constant(String[8])) = "v2.0.0"
        ```

    === "Example"

        ```shell
        >>> CryptoSwap.version()
        'v2.0.0'
        ```


### `balanceOf`
### `allowance`
### `totalSupply`
### `nonces`
### `salt`
### `transferFrom`
### `transfer`
### `approve`
### `increaseAllowance`
### `decreaseAllowance`
### `permit`






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