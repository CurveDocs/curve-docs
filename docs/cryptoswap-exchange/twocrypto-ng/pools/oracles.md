<h1>Twocrypto-NG Oracles</h1>


## **Price Oracle**

*Twocrypto-NG pools contains the following built-in oracle:*

<div class="grid cards" markdown>

-   **`price_oracle`**

    ---

    An exponential moving-average (EMA) price oracle with a periodicity determined by `ma_time`. It returns the price of the coin at index 1 with regard to the coin at index 0 in the pool.

-   **`xcp_oracle`**

    ---

    An exponential moving-average (EMA) oracle value of the estimated TVL in the pool with a periodicity determined by `xcp_ma_time`.

</div>


!!!example "Example: Price Oracle for CVG/ETH"

    The [`CVG/ETH`](https://etherscan.io/address/0x004c167d27ada24305b76d80762997fa6eb8d9b2) pool consists of `CVG <> wETH`.

    Because `wETH` is `coin[0]`, the price of `CVG`is returned with regard to `wETH`.

    ```shell
    >>> price_oracle() = 74644221911389
    0.000074644221911389       # price of CVG w.r.t wETH
    ```

    *In order to get the reverse EMA (e.g. price of `wETH` with regard to `CVG`):*

    $\frac{10^{36}}{\text{price_oracle()}} = 1.3396884e+22$


---

*The AMM implementation uses several private variables to pack and store values, which are used for calculating the EMA oracles.*


=== "Packing Values"

    ```vyper
    @internal
    @pure
    def _pack_3(x: uint256[3]) -> uint256:
        """
        @notice Packs 3 integers with values <= 10**18 into a uint256
        @param x The uint256[3] to pack
        @return uint256 Integer with packed values
        """
        return (x[0] << 128) | (x[1] << 64) | x[2]

    @pure
    @internal
    def _pack_2(p1: uint256, p2: uint256) -> uint256:
        return p1 | (p2 << 128)
    ```

=== "Unpacking Values"

    ```vyper
    @internal
    @pure
    def _unpack_3(_packed: uint256) -> uint256[3]:
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

    @pure
    @internal
    def _unpack_2(packed: uint256) -> uint256[2]:
        return [packed & (2**128 - 1), packed >> 128]
    ```


| Variable | Description |
| -------- | ----------- |
| `block.timestamp`       | Timestamp of the block. Since all transactions within a block share the same timestamp, EMA oracles can only be updated once per block. |
| `last_prices_timestamp` | Timestamp when the EMA oracle was last updated. |
| `ma_time`               | Time window for the moving-average oracle. |
| `last_prices`           | Last stored spot price of the coin to calculate the price oracle for. |
| `price_scale`           | Price scale value of the coin to calculate the price oracle for. |
| `price_oracle`          | Price oracle value of the coin to calculate the price oracle for. |
| `alpha`                 | Weighting multiplier that adjusts the impact of the latest spot value versus the previous EMA in the new EMA calculation. |



### `price_oracle`
!!! description "`CurveTwocryptoOptimized.price_oracle() -> uint256:`"

    !!!danger "Oracle Manipulation Prevention"
        The state price that goes into the EMA is capped with `2 x price_scale` to prevent oracle manipulation.

    Getter for the oracle price of the coin at `index 1` with regard to the coin at `index 0`. The price oracle is an exponential moving-average, with a periodicity determined by `ma_time`. The aggregated prices are cached state prices (dy/dx) calculated AFTER the latest trade.

    $$\alpha = e^{\text{power}}$$

    $$\text{power} = -\frac{(\text{block.timestamp} - \text{last_prices_timestamp}) \times 10^{18}}{\text{ma_time}}$$

    $$\text{EMA} = \frac{\min(\text{last_prices}, 2 \times \text{price_scale}) \times (10^{18} - \alpha) + \text{price_oracle} \times \alpha}{10^{18}}$$

    Returns: ema oracle price of coin at index 1 w.r.t coin at index 0 (`uint256`).

    ??? quote "Source code"

        === "CurveTwocryptoOptimized.vy"

            ```vyper
            @external
            @view
            @nonreentrant("lock")
            def price_oracle() -> uint256:
                """
                @notice Returns the oracle price of the coin at index `k` w.r.t the coin
                        at index 0.
                @dev The oracle is an exponential moving average, with a periodicity
                    determined by `self.ma_time`. The aggregated prices are cached state
                    prices (dy/dx) calculated AFTER the latest trade.
                @return uint256 Price oracle value of kth coin.
                """
                return self.internal_price_oracle()

            @internal
            @view
            def internal_price_oracle() -> uint256:
                """
                @notice Returns the oracle price of the coin at index `k` w.r.t the coin
                        at index 0.
                @dev The oracle is an exponential moving average, with a periodicity
                    determined by `self.ma_time`. The aggregated prices are cached state
                    prices (dy/dx) calculated AFTER the latest trade.
                @param k The index of the coin.
                @return uint256 Price oracle value of kth coin.
                """
                price_oracle: uint256 = self.cached_price_oracle
                price_scale: uint256 = self.cached_price_scale
                last_prices_timestamp: uint256 = self.last_timestamp

                if last_prices_timestamp < block.timestamp:  # <------------ Update moving
                    #                                                   average if needed.

                    last_prices: uint256 = self.last_prices
                    ma_time: uint256 = self._unpack_3(self.packed_rebalancing_params)[2]
                    alpha: uint256 = MATH.wad_exp(
                        -convert(
                            unsafe_sub(block.timestamp, last_prices_timestamp) * 10**18 / ma_time,
                            int256,
                        )
                    )

                    # ---- We cap state price that goes into the EMA with 2 x price_scale.
                    return (
                        min(last_prices, 2 * price_scale) * (10**18 - alpha) +
                        price_oracle * alpha
                    ) / 10**18

                return price_oracle
            ```

        === "CurveCryptoMathOptimized2.vy"

            ```vyper
            @external
            @pure
            def wad_exp(x: int256) -> int256:
                """
                @dev Calculates the natural exponential function of a signed integer with
                    a precision of 1e18.
                @notice Note that this function consumes about 810 gas units. The implementation
                        is inspired by Remco Bloemen's implementation under the MIT license here:
                        https://xn--2-umb.com/22/exp-ln.
                @param x The 32-byte variable.
                @return int256 The 32-byte calculation result.
                """
                value: int256 = x

                # If the result is `< 0.5`, we return zero. This happens when we have the following:
                # "x <= floor(log(0.5e18) * 1e18) ~ -42e18".
                if (x <= -42_139_678_854_452_767_551):
                    return empty(int256)

                # When the result is "> (2 ** 255 - 1) / 1e18" we cannot represent it as a signed integer.
                # This happens when "x >= floor(log((2 ** 255 - 1) / 1e18) * 1e18) ~ 135".
                assert x < 135_305_999_368_893_231_589, "Math: wad_exp overflow"

                # `x` is now in the range "(-42, 136) * 1e18". Convert to "(-42, 136) * 2 ** 96" for higher
                # intermediate precision and a binary base. This base conversion is a multiplication with
                # "1e18 / 2 ** 96 = 5 ** 18 / 2 ** 78".
                value = unsafe_div(x << 78, 5 ** 18)

                # Reduce the range of `x` to "(-½ ln 2, ½ ln 2) * 2 ** 96" by factoring out powers of two
                # so that "exp(x) = exp(x') * 2 ** k", where `k` is a signer integer. Solving this gives
                # "k = round(x / log(2))" and "x' = x - k * log(2)". Thus, `k` is in the range "[-61, 195]".
                k: int256 = unsafe_add(unsafe_div(value << 96, 54_916_777_467_707_473_351_141_471_128), 2 ** 95) >> 96
                value = unsafe_sub(value, unsafe_mul(k, 54_916_777_467_707_473_351_141_471_128))

                # Evaluate using a "(6, 7)"-term rational approximation. Since `p` is monic,
                # we will multiply by a scaling factor later.
                y: int256 = unsafe_add(unsafe_mul(unsafe_add(value, 1_346_386_616_545_796_478_920_950_773_328), value) >> 96, 57_155_421_227_552_351_082_224_309_758_442)
                p: int256 = unsafe_add(unsafe_mul(unsafe_add(unsafe_mul(unsafe_sub(unsafe_add(y, value), 94_201_549_194_550_492_254_356_042_504_812), y) >> 96,\
                                    28_719_021_644_029_726_153_956_944_680_412_240), value), 4_385_272_521_454_847_904_659_076_985_693_276 << 96)

                # We leave `p` in the "2 ** 192" base so that we do not have to scale it up
                # again for the division.
                q: int256 = unsafe_add(unsafe_mul(unsafe_sub(value, 2_855_989_394_907_223_263_936_484_059_900), value) >> 96, 50_020_603_652_535_783_019_961_831_881_945)
                q = unsafe_sub(unsafe_mul(q, value) >> 96, 533_845_033_583_426_703_283_633_433_725_380)
                q = unsafe_add(unsafe_mul(q, value) >> 96, 3_604_857_256_930_695_427_073_651_918_091_429)
                q = unsafe_sub(unsafe_mul(q, value) >> 96, 14_423_608_567_350_463_180_887_372_962_807_573)
                q = unsafe_add(unsafe_mul(q, value) >> 96, 26_449_188_498_355_588_339_934_803_723_976_023)

                # The polynomial `q` has no zeros in the range because all its roots are complex.
                # No scaling is required, as `p` is already "2 ** 96" too large. Also,
                # `r` is in the range "(0.09, 0.25) * 2**96" after the division.
                r: int256 = unsafe_div(p, q)

                # To finalise the calculation, we have to multiply `r` by:
                #   - the scale factor "s = ~6.031367120",
                #   - the factor "2 ** k" from the range reduction, and
                #   - the factor "1e18 / 2 ** 96" for the base conversion.
                # We do this all at once, with an intermediate result in "2**213" base,
                # so that the final right shift always gives a positive value.

                # Note that to circumvent Vyper's safecast feature for the potentially
                # negative parameter value `r`, we first convert `r` to `bytes32` and
                # subsequently to `uint256`. Remember that the EVM default behaviour is
                # to use two's complement representation to handle signed integers.
                return convert(unsafe_mul(convert(convert(r, bytes32), uint256), 3_822_833_074_963_236_453_042_738_258_902_158_003_155_416_615_667) >>\
                    convert(unsafe_sub(195, k), uint256), int256)
            ```

    === "Example"

        ```shell
        >>> CurveTwocryptoOptimized.price_oracle()
        176068711374120           # CVG/ETH price
        ```


### `xcp_oracle`
!!! description "`CurveTwocryptoOptimized.xcp_oracle() -> uint256`"

    Getter for the oracle value for xcp. The oracle is an exponential moving-average, with a periodicity determined by `xcp_ma_time`.

    $$\alpha = e^{\text{power}}$$

    $$\text{power} = -\frac{(\text{block.timestamp} - \text{last_prices_timestamp}) \times 10^{18}}{\text{xcp_ma_time}}$$

    $$\text{xcp_oracle} = \frac{\text{last_xcp} \times (10^{18} - \alpha) + \text{cached_xcp_oracle} \times \alpha}{10^{18}}$$

    Returns: xcp ema oracle value (`uint256`).

    ??? quote "Source code"

        === "CurveTwocryptoOptimized.vy"

            ```vyper
            cached_xcp_oracle: uint256  # <----------- EMA of totalSupply * virtual_price.

            @external
            @view
            @nonreentrant("lock")
            def xcp_oracle() -> uint256:
                """
                @notice Returns the oracle value for xcp.
                @dev The oracle is an exponential moving average, with a periodicity
                    determined by `self.xcp_ma_time`.
                    `TVL` is xcp, calculated as either:
                        1. virtual_price * total_supply, OR
                        2. self.get_xcp(...), OR
                        3. MATH.geometric_mean(xp)
                @return uint256 Oracle value of xcp.
                """

                last_prices_timestamp: uint256 = self._unpack_2(self.last_timestamp)[1]
                cached_xcp_oracle: uint256 = self.cached_xcp_oracle

                if last_prices_timestamp < block.timestamp:

                    alpha: uint256 = MATH.wad_exp(
                        -convert(
                            unsafe_div(
                                unsafe_sub(block.timestamp, last_prices_timestamp) * 10**18,
                                self.xcp_ma_time
                            ),
                            int256,
                        )
                    )

                    return (self.last_xcp * (10**18 - alpha) + cached_xcp_oracle * alpha) / 10**18

                return cached_xcp_oracle
            ```

    === "Example"

        ```shell
        In  [1]:  CurveTwocryptoOptimized.xcp_oracle()
        Out [1]:  3501656271269889041418
        ```


---


## **Updating Oracles**

The AMM has an internal `tweak_price` function that updates `price_oracle`, `xcp_oracle`, and `last_prices`, and conditionally adjusts `price_scale` based on the new invariant and xcp profit. The function includes logic to adjust the `price_scale` if certain conditions are met, such as sufficient profits being made within the pool. This mechanism ensures the pool remains balanced.

The function is called whenever `add_liquidity`, `remove_liquidity_one_coin`, or `_exchange` is called. It is not called when removing liquidity in a balanced manner via `remove_liquidity`, as this function does not alter prices. However, the xcp oracle is updated nonetheless.

To prevent oracle manipulation, `price_oracle` and `xcp_oracle` are only **updated once per block**.


??? quote "`tweak_price`"

    *The function takes the following inputs:*

    | Input     | Type               | Description                         |
    | --------- | ------------------ | ----------------------------------- |
    | `A_gamma` | `uint256[2]`       | Array of `A` and `gamma` values.    |
    | `_xp`     | `uint256[N_COINS]` | Array of the current coin balances. |
    | `new_D`   | `uint256`          | New `D` value.                      |
    | `K0_prev` | `uint256`          | Initial guess for `newton_D`.       |

    === "CurveTwocryptoOptimized.vy"

        ```py
        @internal
        def tweak_price(
            A_gamma: uint256[2],
            _xp: uint256[N_COINS],
            new_D: uint256,
            K0_prev: uint256 = 0,
        ) -> uint256:
            """
            @notice Updates price_oracle, last_price and conditionally adjusts
                    price_scale. This is called whenever there is an unbalanced
                    liquidity operation: _exchange, add_liquidity, or
                    remove_liquidity_one_coin.
            @dev Contains main liquidity rebalancing logic, by tweaking `price_scale`.
            @param A_gamma Array of A and gamma parameters.
            @param _xp Array of current balances.
            @param new_D New D value.
            @param K0_prev Initial guess for `newton_D`.
            """

            # ---------------------------- Read storage ------------------------------

            price_oracle: uint256 = self.cached_price_oracle
            last_prices: uint256 = self.last_prices
            price_scale: uint256 = self.cached_price_scale
            rebalancing_params: uint256[3] = self._unpack_3(self.packed_rebalancing_params)
            # Contains: allowed_extra_profit, adjustment_step, ma_time. -----^

            total_supply: uint256 = self.totalSupply
            old_xcp_profit: uint256 = self.xcp_profit
            old_virtual_price: uint256 = self.virtual_price

            # ----------------------- Update Oracles if needed -----------------------

            last_timestamp: uint256[2] = self._unpack_2(self.last_timestamp)
            alpha: uint256 = 0
            if last_timestamp[0] < block.timestamp:  # 0th index is for price_oracle.

                #   The moving average price oracle is calculated using the last_price
                #      of the trade at the previous block, and the price oracle logged
                #              before that trade. This can happen only once per block.

                # ------------------ Calculate moving average params -----------------

                alpha = MATH.wad_exp(
                    -convert(
                        unsafe_div(
                            unsafe_sub(block.timestamp, last_timestamp[0]) * 10**18,
                            rebalancing_params[2]  # <----------------------- ma_time.
                        ),
                        int256,
                    )
                )

                # ---------------------------------------------- Update price oracles.

                # ----------------- We cap state price that goes into the EMA with
                #                                                 2 x price_scale.
                price_oracle = unsafe_div(
                    min(last_prices, 2 * price_scale) * (10**18 - alpha) +
                    price_oracle * alpha,  # ^-------- Cap spot price into EMA.
                    10**18
                )

                self.cached_price_oracle = price_oracle
                last_timestamp[0] = block.timestamp

            # ----------------------------------------------------- Update xcp oracle.

            if last_timestamp[1] < block.timestamp:

                cached_xcp_oracle: uint256 = self.cached_xcp_oracle
                alpha = MATH.wad_exp(
                    -convert(
                        unsafe_div(
                            unsafe_sub(block.timestamp, last_timestamp[1]) * 10**18,
                            self.xcp_ma_time  # <---------- xcp ma time has is longer.
                        ),
                        int256,
                    )
                )

                self.cached_xcp_oracle = unsafe_div(
                    self.last_xcp * (10**18 - alpha) + cached_xcp_oracle * alpha,
                    10**18
                )

                # Pack and store timestamps:
                last_timestamp[1] = block.timestamp

            self.last_timestamp = self._pack_2(last_timestamp[0], last_timestamp[1])

            #  `price_oracle` is used further on to calculate its vector distance from
            # price_scale. This distance is used to calculate the amount of adjustment
            # to be done to the price_scale.
            # ------------------------------------------------------------------------

            # ------------------ If new_D is set to 0, calculate it ------------------

            D_unadjusted: uint256 = new_D
            if new_D == 0:  #  <--------------------------- _exchange sets new_D to 0.
                D_unadjusted = MATH.newton_D(A_gamma[0], A_gamma[1], _xp, K0_prev)

            # ----------------------- Calculate last_prices --------------------------

            self.last_prices = unsafe_div(
                MATH.get_p(_xp, D_unadjusted, A_gamma) * price_scale,
                10**18
            )

            # ---------- Update profit numbers without price adjustment first --------

            xp: uint256[N_COINS] = [
                unsafe_div(D_unadjusted, N_COINS),
                D_unadjusted * PRECISION / (N_COINS * price_scale)  # <------ safediv.
            ]  #                                                     with price_scale.

            xcp_profit: uint256 = 10**18
            virtual_price: uint256 = 10**18

            if old_virtual_price > 0:

                xcp: uint256 = isqrt(xp[0] * xp[1])
                virtual_price = 10**18 * xcp / total_supply

                xcp_profit = unsafe_div(
                    old_xcp_profit * virtual_price,
                    old_virtual_price
                )  # <---------------- Safu to do unsafe_div as old_virtual_price > 0.

                #       If A and gamma are not undergoing ramps (t < block.timestamp),
                #         ensure new virtual_price is not less than old virtual_price,
                #                                        else the pool suffers a loss.
                if self.future_A_gamma_time < block.timestamp:
                    assert virtual_price > old_virtual_price, "Loss"

                # -------------------------- Cache last_xcp --------------------------

                self.last_xcp = xcp  # geometric_mean(D * price_scale)

            self.xcp_profit = xcp_profit

            # ------------ Rebalance liquidity if there's enough profits to adjust it:
            if virtual_price * 2 - 10**18 > xcp_profit + 2 * rebalancing_params[0]:
                #                          allowed_extra_profit --------^

                # ------------------- Get adjustment step ----------------------------

                #                Calculate the vector distance between price_scale and
                #                                                        price_oracle.
                norm: uint256 = unsafe_div(
                    unsafe_mul(price_oracle, 10**18), price_scale
                )
                if norm > 10**18:
                    norm = unsafe_sub(norm, 10**18)
                else:
                    norm = unsafe_sub(10**18, norm)
                adjustment_step: uint256 = max(
                    rebalancing_params[1], unsafe_div(norm, 5)
                )  #           ^------------------------------------- adjustment_step.

                if norm > adjustment_step:  # <---------- We only adjust prices if the
                    #          vector distance between price_oracle and price_scale is
                    #             large enough. This check ensures that no rebalancing
                    #           occurs if the distance is low i.e. the pool prices are
                    #                                     pegged to the oracle prices.

                    # ------------------------------------- Calculate new price scale.

                    p_new: uint256 = unsafe_div(
                        price_scale * unsafe_sub(norm, adjustment_step) +
                        adjustment_step * price_oracle,
                        norm
                    )  # <---- norm is non-zero and gt adjustment_step; unsafe = safe.

                    # ---------------- Update stale xp (using price_scale) with p_new.

                    xp = [
                        _xp[0],
                        unsafe_div(_xp[1] * p_new, price_scale)
                    ]

                    # ------------------------------------------ Update D with new xp.
                    D: uint256 = MATH.newton_D(A_gamma[0], A_gamma[1], xp, 0)

                    for k in range(N_COINS):
                        frac: uint256 = xp[k] * 10**18 / D  # <----- Check validity of
                        assert (frac > 10**16 - 1) and (frac < 10**20 + 1)  #   p_new.

                    # ------------------------------------- Convert xp to real prices.
                    xp = [
                        unsafe_div(D, N_COINS),
                        D * PRECISION / (N_COINS * p_new)
                    ]

                    # ---------- Calculate new virtual_price using new xp and D. Reuse
                    #              `old_virtual_price` (but it has new virtual_price).
                    old_virtual_price = unsafe_div(
                        10**18 * isqrt(xp[0] * xp[1]), total_supply
                    )  # <----- unsafe_div because we did safediv before (if vp>1e18)

                    # ---------------------------- Proceed if we've got enough profit.
                    if (
                        old_virtual_price > 10**18 and
                        2 * old_virtual_price - 10**18 > xcp_profit
                    ):

                        self.D = D
                        self.virtual_price = old_virtual_price
                        self.cached_price_scale = p_new

                        return p_new

            # --------- price_scale was not adjusted. Update the profit counter and D.
            self.D = D_unadjusted
            self.virtual_price = virtual_price

            return price_scale
        ```


---


## **Other Methods**

### `last_prices`
!!! description "`CurveTwocryptoOptimized.last_prices -> uint256: view`"

    Getter for the last price of the coin at index 1 with regard to the coin at index 0. This variable is used to calculate the moving average price oracle.

    Returns: last price (`uint256`).

    ??? quote "Source code"

        === "CurveTwocryptoOptimized.vy"

            ```vyper
            last_prices: public(uint256)

            @internal
            def tweak_price(
                A_gamma: uint256[2],
                _xp: uint256[N_COINS],
                new_D: uint256,
                K0_prev: uint256 = 0,
            ) -> uint256:
                """
                @notice Updates price_oracle, last_price and conditionally adjusts
                        price_scale. This is called whenever there is an unbalanced
                        liquidity operation: _exchange, add_liquidity, or
                        remove_liquidity_one_coin.
                @dev Contains main liquidity rebalancing logic, by tweaking `price_scale`.
                @param A_gamma Array of A and gamma parameters.
                @param _xp Array of current balances.
                @param new_D New D value.
                @param K0_prev Initial guess for `newton_D`.
                """

                ...

                # ----------------------- Calculate last_prices --------------------------

                self.last_prices = unsafe_div(
                    MATH.get_p(_xp, D_unadjusted, A_gamma) * price_scale,
                    10**18
                )

                ...
            ```

        === "CurveCryptoMathOptimized2.vy"

            ```py
            @external
            @view
            def get_p(
                _xp: uint256[N_COINS], _D: uint256, _A_gamma: uint256[N_COINS]
            ) -> uint256:
                """
                @notice Calculates dx/dy.
                @dev Output needs to be multiplied with price_scale to get the actual value.
                @param _xp Balances of the pool.
                @param _D Current value of D.
                @param _A_gamma Amplification coefficient and gamma.
                """

                assert _D > 10**17 - 1 and _D < 10**15 * 10**18 + 1  # dev: unsafe D values

                # K0 = P * N**N / D**N.
                # K0 is dimensionless and has 10**36 precision:
                K0: uint256 = unsafe_div(
                    unsafe_div(4 * _xp[0] * _xp[1], _D) * 10**36,
                    _D
                )

                # GK0 is in 10**36 precision and is dimensionless.
                # GK0 = (
                #     2 * _K0 * _K0 / 10**36 * _K0 / 10**36
                #     + (gamma + 10**18)**2
                #     - (_K0 * _K0 / 10**36 * (2 * gamma + 3 * 10**18) / 10**18)
                # )
                # GK0 is always positive. So the following should never revert:
                GK0: uint256 = (
                    unsafe_div(unsafe_div(2 * K0 * K0, 10**36) * K0, 10**36)
                    + pow_mod256(unsafe_add(_A_gamma[1], 10**18), 2)
                    - unsafe_div(
                        unsafe_div(pow_mod256(K0, 2), 10**36) * unsafe_add(unsafe_mul(2, _A_gamma[1]), 3 * 10**18),
                        10**18
                    )
                )

                # NNAG2 = N**N * A * gamma**2
                NNAG2: uint256 = unsafe_div(unsafe_mul(_A_gamma[0], pow_mod256(_A_gamma[1], 2)), A_MULTIPLIER)

                # denominator = (GK0 + NNAG2 * x / D * _K0 / 10**36)
                denominator: uint256 = (GK0 + unsafe_div(unsafe_div(NNAG2 * _xp[0], _D) * K0, 10**36) )

                # p_xy = x * (GK0 + NNAG2 * y / D * K0 / 10**36) / y * 10**18 / denominator
                # p is in 10**18 precision.
                return unsafe_div(
                    _xp[0] * ( GK0 + unsafe_div(unsafe_div(NNAG2 * _xp[1], _D) * K0, 10**36) ) / _xp[1] * 10**18,
                    denominator
                )
            ```

    === "Example"

        ```shell
        >>> CurveTwocryptoOptimized.last_prices()
        '74644221911388'
        ```


### `last_timestamp`
!!! description "`CurveTwocryptoOptimized.last_timestamp() -> uint256: view`"

    Getter for the last timestamps when price and xcp oracles were updated. Both timestamps are packed into a single variable. The lower 128 bits represent the timestamp of the price update, the upper 128 bits the timestamps of the xcp update. The distinction between price and xcp is necessary because these values are not always updated in parallel. Usually they are, but when liquidity is removed in a balanced matter, the price oracle is not updated but the xcp one is.

    Returns: packed value of the timestamps of the most recent updated of the price and xcp oracle (`uint256`).

    ??? quote "Source code"

        === "CurveTwocryptoOptimized.vy"

            ```vyper
            last_timestamp: public(uint256)    # idx 0 is for prices, idx 1 is for xcp.
            ```

    === "Example"

        ```shell
        >>> CurveTwocryptoOptimized.last_timestamp()
        585060874787625947552086540639603571285491911031

        # unpacking
        >>> 585060874787625947552086540639603571285491911031 & (2**128 - 1)
        1719339383

        >>> 585060874787625947552086540639603571285491911031 >> 128
        1719339383
        ```


### `ma_time`
!!! description "`CurveTwocryptoOptimized.ma_time() -> uint256:`"

    Getter for the moving average time for `price_oracle` denominated in seconds. This variable can be changed using the `apply_new_parameters` method.

    Returns: moving average time (`uint256`).

    ??? quote "Source code"

        === "CurveTwocryptoOptimized.vy"

            ```vyper
            packed_rebalancing_params: public(uint256)  # <---------- Contains rebalancing
            #               parameters allowed_extra_profit, adjustment_step, and ma_time.

            @view
            @external
            def ma_time() -> uint256:
                """
                @notice Returns the current moving average time in seconds
                @dev To get time in seconds, the parameter is multiplied by ln(2)
                    One can expect off-by-one errors here.
                @return uint256 ma_time value.
                """
                return self._unpack_3(self.packed_rebalancing_params)[2] * 694 / 1000
            ```

    === "Example"

        ```shell
        >>> CurveTwocryptoOptimized.ma_time()
        601
        ```


### `xcp_ma_time`
!!! description "`CurveTwocryptoOptimized.xcp_ma_time() -> uint256: view`"

    Getter for the moving-average periodicity for `price_oracle` denominated in seconds. This variable can be changed using the `apply_new_parameters` method.

    Returns: ma time (`uint256`).

    ??? quote "Source code"

        === "CurveTwocryptoOptimized.vy"

            ```vyper
            xcp_ma_time: public(uint256)

            @external
            def __init__(
                _name: String[64],
                _symbol: String[32],
                _coins: address[N_COINS],
                _math: address,
                _salt: bytes32,
                packed_precisions: uint256,
                packed_gamma_A: uint256,
                packed_fee_params: uint256,
                packed_rebalancing_params: uint256,
                initial_price: uint256,
            ):
                ...
                self.xcp_ma_time = 62324  # <--------- 12 hours default on contract start.
                ...
            ```

    === "Example"

        ```shell
        >>> CurveTwocryptoOptimized.xcp_ma_time()
        62324
        ```


### `lp_price`
!!! description "`CurveTwocryptoOptimized.lp_price() -> uint256:`"

    Function to calculate the price of the LP token with regard to the coin at `index 0` in the pool. The value is calculate the following:

    $$\text{lp_price} = \frac{2 \times \text{virtual_price} \times \sqrt{\text{price_oracle} \times 10^{18}}}{10^{18}}$$

    Returns: LP token price (`uint256`).

    ??? quote "Source code"

        === "CurveTwocryptoOptimized.vy"

            ```vyper
            @external
            @view
            @nonreentrant("lock")
            def lp_price() -> uint256:
                """
                @notice Calculates the current price of the LP token w.r.t coin at the 0th index
                @return uint256 LP price.
                """
            return 2 * self.virtual_price * isqrt(self.internal_price_oracle() * 10**18) / 10**18

            @internal
            @view
            def internal_price_oracle() -> uint256:
                """
                @notice Returns the oracle price of the coin at index `k` w.r.t the coin
                        at index 0.
                @dev The oracle is an exponential moving average, with a periodicity
                    determined by `self.ma_time`. The aggregated prices are cached state
                    prices (dy/dx) calculated AFTER the latest trade.
                @param k The index of the coin.
                @return uint256 Price oracle value of kth coin.
                """
                price_oracle: uint256 = self.cached_price_oracle
                price_scale: uint256 = self.cached_price_scale
                last_prices_timestamp: uint256 = self._unpack_2(self.last_timestamp)[0]

                if last_prices_timestamp < block.timestamp:  # <------------ Update moving
                    #                                                   average if needed.

                    last_prices: uint256 = self.last_prices
                    ma_time: uint256 = self._unpack_3(self.packed_rebalancing_params)[2]
                    alpha: uint256 = MATH.wad_exp(
                        -convert(
                            unsafe_sub(block.timestamp, last_prices_timestamp) * 10**18 / ma_time,
                            int256,
                        )
                    )

                    # ---- We cap state price that goes into the EMA with 2 x price_scale.
                    return (
                        min(last_prices, 2 * price_scale) * (10**18 - alpha) +
                        price_oracle * alpha
                    ) / 10**18

                return price_oracle
            ```

    === "Example"

        ```shell
        >>> CurveTwocryptoOptimized.lp_price()
        26545349102641443     # lp token price in wETH
        ```


### `virtual_price`
!!! description "`CurveTwocryptoOptimized.virtual_price() -> uint256: view`"

    !!!warning "`get_virtual_price` ≠ `virtual_price`"
        `get_virtual_price` should not be confused with `virtual_price`, which is a cached virtual price.

    Getter for the cached virtual price. This variable provides a fast read by accessing the cached value instead of recalculating it.

    Returns: cached virtual price (`uint256`).

    ??? quote "Source code"

        === "CurveTwocryptoOptimized.vy"

            ```vyper
            virtual_price: public(uint256)  # <------ Cached (fast to read) virtual price.
            #                          The cached `virtual_price` is also used internally.
            ```

    === "Example"

        ```shell
        >>> CurveTwocryptoOptimized.virtual_price()
        1000270251060292804
        ```


### `get_virtual_price`
!!! description "`CurveTwocryptoOptimized.get_virtual_price() -> uint256: view`"

    !!!warning "`get_virtual_price` ≠ `virtual_price`"
        `get_virtual_price` should not be confused with `virtual_price`, which is a cached virtual price.

    Function to dynamically calculate the current virtual price of the pool's LP token. It essentially calculates the virtual price based on the current state of the pool (`D` and `cached_price_scale`) and the total supply of LP tokens.

    Returns: virtual price (`uint256`).

    ??? quote "Source code"

        === "CurveTwocryptoOptimized.vy"

            ```vyper
            @external
            @view
            @nonreentrant("lock")
            def get_virtual_price() -> uint256:
                """
                @notice Calculates the current virtual price of the pool LP token.
                @dev Not to be confused with `self.virtual_price` which is a cached
                    virtual price.
                @return uint256 Virtual Price.
                """
                return 10**18 * self.get_xcp(self.D, self.cached_price_scale) / self.totalSupply

            @internal
            @pure
            def get_xcp(D: uint256, price_scale: uint256) -> uint256:

                x: uint256[N_COINS] = [
                    unsafe_div(D, N_COINS),
                    D * PRECISION / (price_scale * N_COINS)
                ]

                return isqrt(x[0] * x[1])  # <------------------- Geometric Mean.
            ```

    === "Example"

        ```shell
        >>> CurveTwocryptoOptimized.get_virtual_price()
        1000270251060292804
        ```
