cryptoswap pool smart contracts


very, very good article to understand curve v2: https://nagaking.substack.com/p/deep-dive-curve-v2-parameters


explain what `_pack()` and `_unpack()` does so i dont need to add code in every code source
explain the fee structure. what is mid_fee, out_fee: when creating a new contract, mid_fee, out_fee and fee_gamma gets packed into `packed_fee_params`. why are fees packed into one variable?
what does `allow_extra_profit` do??

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








## **Price Oracle**
### `lp_price`
### `get_virtual_price`
### `price_oracle`
### `last_prices`
### `price_scale`
### `ma_time`
### `last_prices_timestamp`
### `virtual_price`


## **LP Token Methods**
### `name`
### `symbol`
### `decimals`
### `version`
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



## **Parameters**
### `A`
### `gamma`
### `initial_A_gamma`
### `initial_A_gamma_time`
### `future_A_gamma`
### `future_A_gamma_time`
### `packed_rebalancing_params`
### `admin_actions_deadline`
### `adjustment_step`
### `ramp_A_gamma`
### `stop_ramp_A_gamma`
### `commit_new_parameters`
### `apply_new_parameters`
### `revert_new_parameters`



## **Contract Info Methods**
### `precisions`
### `DOMAIN_SEPERATOR`
### `WETH20`
### `MATH`
### `coins`
### `factory`
### `balances`
### `D`



## **Price Scaling**




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