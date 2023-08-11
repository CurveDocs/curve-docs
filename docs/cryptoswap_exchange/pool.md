cryptoswap pool smart contracts


## **Fees**
add explainer here

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

### `mid_fee`
### `out_fee`
### `fee_gamma`
### `allowed_extra_profit`
### `xcp_profit`
### `xcp_profit_a`
### `ADMIN_FEE`
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