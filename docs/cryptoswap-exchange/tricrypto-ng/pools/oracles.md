<h1>Tricrypto-NG Oracles</h1>


*Tricrypto-NG pools have the following oracle:*

<div class="grid cards" markdown>

-   **`price_oracle`**

    ---

    An exponential moving-average price oracle with a periodicity determined by `ma_time` of an asset within the AMM which returns its price with regard to the coin at index 0.

</div>


!!!example "Oracle Price for TriCRV"

    The [`TriCRV`](https://etherscan.io/address/0x4ebdf703948ddcea3b11f675b4d1fba9d2414a14) pool consists of `crvUSD <> wETH <> CRV`.

    Because `crvUSD` is `coin[0]`, the prices of `wETH` and `CRV` are returned with regard to `crvUSD`.

    ```vyper
    >>> price_oracle(0) = 3670949576287168254655
    3670.94957629       # price of wETH w.r.t crvUSD

    >>> price_oracle(1) = 724988309167051066
    0.72498830916       # price of CRV w.r.t crvUSD
    ```

*The formula to calculate the exponential moving-average essentially comes down to:*

$$\alpha = e^{\left(\frac{(\text{block.timestamp} - \text{last_prices_timestamp}) \times 10^{18}}{\text{ma_time}}\right)}$$


$$\text{EMA} = \frac{\min(\text{last_prices}, 2 \times \text{price_scale}) \times (10^{18} - \alpha) + \text{price_oracle} \times \alpha}{10^{18}}$$

**Note:** The state price that goes into the EMA is capped with `2 x price_scale` to prevent manipulation.


| Variable                | Description                                                                                           |
|-------------------------|-------------------------------------------------------------------------------------------------------|
| `block.timestamp`       | Timestamp of the block. Since all transactions within a block share the same timestamp, EMA oracles can only be updated once per block. |
| `last_prices_timestamp` | Timestamp when the EMA oracle was last updated.                                                       |
| `ma_time`               | Time window for the moving-average oracle.                                                            |
| `last_prices`           | Last stored spot price of the coin to calculate the price oracle for.                                 |
| `price_scale`           | Price scale value of the coin to calculate the price oracle for.                                      |
| `price_oracle`          | Price oracle value of the coin to calculate the price oracle for.                                     |
| `alpha`                 | Weighting multiplier that adjusts the impact of the latest spot value versus the previous EMA in the new EMA calculation. |


---


*The AMM implementation uses several private variables to pack and store key values, which are used for calculating the EMA oracle.*

!!!info
    Some storage variables pack multiple values into a single entry to save on gas costs. These values are unpacked when needed for use.

    ???quote "Source Code"

        === "Packing"

            ```py
            PRICE_SIZE: constant(uint128) = 256 / (N_COINS - 1)
            PRICE_MASK: constant(uint256) = 2**PRICE_SIZE - 1

            last_prices_packed: uint256

            @internal
            @view
            def _pack_prices(prices_to_pack: uint256[N_COINS-1]) -> uint256:
                """
                @notice Packs N_COINS-1 prices into a uint256.
                @param prices_to_pack The prices to pack
                @return uint256 An integer that packs prices
                """
                packed_prices: uint256 = 0
                p: uint256 = 0
                for k in range(N_COINS - 1):
                    packed_prices = packed_prices << PRICE_SIZE
                    p = prices_to_pack[N_COINS - 2 - k]
                    assert p < PRICE_MASK
                    packed_prices = p | packed_prices
                return packed_prices
            ```

        === "Unpacking"

            ```py
            PRICE_SIZE: constant(uint128) = 256 / (N_COINS - 1)
            PRICE_MASK: constant(uint256) = 2**PRICE_SIZE - 1

            last_prices_packed: uint256

            @internal
            @view
            def _unpack_prices(_packed_prices: uint256) -> uint256[2]:
                """
                @notice Unpacks N_COINS-1 prices from a uint256.
                @param _packed_prices The packed prices
                @return uint256[2] Unpacked prices
                """
                unpacked_prices: uint256[N_COINS-1] = empty(uint256[N_COINS-1])
                packed_prices: uint256 = _packed_prices
                for k in range(N_COINS - 1):
                    unpacked_prices[k] = packed_prices & PRICE_MASK
                    packed_prices = packed_prices >> PRICE_SIZE

                return unpacked_prices
            ```


- `last_prices_packed` stores the latest prices of all coins, packaging them into a single variable. To access these prices, they must be unpacked using the `_unpack_prices` method.

- `price_oracle_packed` consolidates the moving averages of the coins in a three-coin pool. This variable includes two values: the first represents the moving average for coin(1) relative to coin(0), and the second represents the moving average for coin(2) relative to coin(0).

- `price_scale_packed` functions similarly by packing the price scales of coin 1 and 2 with respect to coin 0. The `price_scale` method unpacks these values and returns the price scale at index `k`.

- `last_prices_timestamp` marks the timestamp when the `price_oracle` for a coin was last updated.



---


## **Price Oracle**

### `price_oracle`
!!! description "`CurveTricryptoOptimizedWETH.price_oracle(k: uint256) -> uint256:`"

    !!!warning "Revert"
        This function reverts if `i >= 2`.

    Function to calculate the exponential moving average (EMA) price for the coin at index `k` with regard to the coin at index 0. The oracle is an exponential moving average, with a periodicity determined by `ma_time`. The aggregated prices are cached state prices (dy/dx) calculated AFTER the latest trade. The moving average price oracle is calculated using the last_price of the trade at the previous block, and the price oracle logged before that trade. This can happen only once per block.

    Returns: EMA price of coin `k` (`uint256`).

    | Input  | Type      | Description        |
    | ------ | --------- | ------------------ |
    | `k`    | `uint256` | Index of the coin. |

    ??? quote "Source code"

        === "CurveTricryptoOptimizedWETH.vy"

            ```python
            price_scale_packed: uint256  # <------------------------ Internal price scale.
            price_oracle_packed: uint256  # <------- Price target given by moving average.

            last_prices_packed: uint256
            last_prices_timestamp: public(uint256)

            @external
            @view
            @nonreentrant("lock")
            def price_oracle(k: uint256) -> uint256:
                """
                @notice Returns the oracle price of the coin at index `k` w.r.t the coin
                        at index 0.
                @dev The oracle is an exponential moving average, with a periodicity
                    determined by `self.ma_time`. The aggregated prices are cached state
                    prices (dy/dx) calculated AFTER the latest trade.
                @param k The index of the coin.
                @return uint256 Price oracle value of kth coin.
                """
                price_oracle: uint256 = self._unpack_prices(self.price_oracle_packed)[k]
                price_scale: uint256 = self._unpack_prices(self.price_scale_packed)[k]
                last_prices_timestamp: uint256 = self.last_prices_timestamp

                if last_prices_timestamp < block.timestamp:  # <------------ Update moving
                    #                                                   average if needed.

                    last_prices: uint256 = self._unpack_prices(self.last_prices_packed)[k]
                    ma_time: uint256 = self._unpack(self.packed_rebalancing_params)[2]
                    alpha: uint256 = MATH.wad_exp(
                        -convert(
                            (block.timestamp - last_prices_timestamp) * 10**18 / ma_time,
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
        >>> CurveTricryptoOptimizedWETH.price_oracle(0)
        66466761042718407573921

        >>> CurveTricryptoOptimizedWETH.price_oracle(1)
        3243401255685792725933
        ```


### `price_scale`
!!! description "`CurveTricryptoOptimizedWETH.price_scale(k: uint256) -> uint256:`"

    !!!warning "Revert"
        This function reverts if `i >= 2`.

    Getter for the price scale of the coin at index `k`.

    Returns: price scale (`uint256`).

    | Input  | Type     | Description        |
    | ------ | -------- | ------------------ |
    | `k`    | `uint256`| Index of the coin. |

    ??? quote "Source code"

        === "CurveTricryptoOptimizedWETH.vy"

            ```python
            price_scale_packed: uint256  # <------------------------ Internal price scale.

            @external
            @view
            def price_scale(k: uint256) -> uint256:
                """
                @notice Returns the price scale of the coin at index `k` w.r.t the coin
                        at index 0.
                @dev Price scale determines the price band around which liquidity is
                    concentrated.
                @param k The index of the coin.
                @return uint256 Price scale of coin.
                """
                return self._unpack_prices(self.price_scale_packed)[k]
            ```

    === "Example"
        ```shell
        >>> CurveTricryptoOptimizedWETH.price_scale(0)
        64955165867890305070839

        >>> CurveTricryptoOptimizedWETH.price_scale(1)
        3133935659389092150237
        ```


### `last_prices`
!!! description "`CurveTricryptoOptimizedWETH.last_prices(k: uint256) -> uint256:`"

    !!!warning "Revert"
        This function reverts if `i >= 2`.

    Getter method for the last stored price for coin at index value `k`, stored in `last_prices_packed`.

    Returns: last stored spot price of coin `k` (`uint256`).

    | Input  | Type     | Description        |
    | ------ | -------- | ------------------ |
    | `k`    | `uint256`| Index of the coin. |

    ??? quote "Source code"

        === "CurveTricryptoOptimizedWETH.vy"

            ```python
            last_prices_packed: uint256

            @external
            @view
            def last_prices(k: uint256) -> uint256:
                """
                @notice Returns last price of the coin at index `k` w.r.t the coin
                        at index 0.
                @dev last_prices returns the quote by the AMM for an infinitesimally small swap
                    after the last trade. It is not equivalent to the last traded price, and
                    is computed by taking the partial differential of `x` w.r.t `y`. The
                    derivative is calculated in `get_p` and then multiplied with price_scale
                    to give last_prices.
                @param k The index of the coin.
                @return uint256 Last logged price of coin.
                """
                return self._unpack_prices(self.last_prices_packed)[k]

            @internal
            @view
            def _unpack_prices(_packed_prices: uint256) -> uint256[2]:
                """
                @notice Unpacks N_COINS-1 prices from a uint256.
                @param _packed_prices The packed prices
                @return uint256[2] Unpacked prices
                """
                unpacked_prices: uint256[N_COINS-1] = empty(uint256[N_COINS-1])
                packed_prices: uint256 = _packed_prices
                for k in range(N_COINS - 1):
                    unpacked_prices[k] = packed_prices & PRICE_MASK
                    packed_prices = packed_prices >> PRICE_SIZE

                return unpacked_prices
            ```

    === "Example"
        ```shell
        >>> CurveTricryptoOptimizedWETH.last_prices(0)
        66512510695325991643669

        >>> CurveTricryptoOptimizedWETH.last_prices(1)
        3249719806881710136102
        ```


### `last_prices_timestamp`
!!! description "`CurveTricryptoOptimizedWETH.last_prices_timestamp() -> uint256: view`"

    Getter for the timestamp when the EMA price oracle was updated the last time. 

    Returns: timestamp (`uint256`).

    ??? quote "Source code"

        === "CurveTricryptoOptimizedWETH.vy"

            ```python
            last_prices_timestamp: public(uint256)
            ```

    === "Example"
        ```shell
        >>> CurveTricryptoOptimizedWETH.last_prices_timestamp()
        1713167903
        ```


### `ma_time`
!!! description "`CurveTricryptoOptimizedWETH.ma_time() -> uint256: view`"

    Getter fir the exponential moving average time for the price oracle. This value can be adjusted via `commit_new_parameters()`, as detailed in the [admin controls](./admin-controls.md#commit_new_parameters) section.

    Returns: periodicity of the EMA (`uint256`) 

    ??? quote "Source code"

        === "CurveTricryptoOptimizedWETH.vy"

            ```python

            ```

    === "Example"
        ```shell
        >>> CurveTricryptoOptimizedWETH.ma_time()
        600
        ```


### `lp_price`
!!! description "`CurveTricryptoOptimizedWETH.lp_price() -> uint256: view`"

    Getter for price of the LP token, calculated as following:

    $$\text{lp token price} = 3 * \text{virtual_price} * \sqrt[3]{\frac{(\text{price_oracle[0]} * \text{price_oracle[1]})}{10^{24}}}$$

    Returns: LP token price (`uint256`).

    ??? quote "Source code"

        === "CurveTricryptoOptimizedWETH.vy"

            ```python
            price_oracle_packed: uint256  # <------- Price target given by moving average.
                        
            @external
            @view
            @nonreentrant("lock")
            def lp_price() -> uint256:
                """
                @notice Calculates the current price of the LP token w.r.t coin at the
                        0th index
                @return uint256 LP price.
                """

                price_oracle: uint256[N_COINS-1] = self._unpack_prices(
                    self.price_oracle_packed
                )
                return (
                    3 * self.virtual_price * MATH.cbrt(price_oracle[0] * price_oracle[1])
                ) / 10**24
            ```

    === "Example"
        ```shell
        >>> CurveTricryptoOptimizedWETH.lp_price()
        1809325066767569054740
        ```


### `get_virtual_price`
!!! description "`CurveTricryptoOptimizedWETH.get_virtual_price() -> uint256:`"

    Function to calculate the current virtual price of the pool 's LP token.

    Returns: virtual price (`uint256`).

    ??? quote "Source code"

        === "CurveTricryptoOptimizedWETH.vy"

            ```python
            totalSupply: public(uint256)

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
                return 10**18 * self.get_xcp(self.D) / self.totalSupply
            ```

    === "Example"
        ```shell
        >>> CurveTricryptoOptimizedWETH.get_virtual_price()
        1005849271542625678
        ```


### `virtual_price`
!!! description "`CurveTricryptoOptimizedWETH.virtual_price() -> uint256: view`"

    Getter for the cached virtual price.

    Returns: cached virtual price (`uint256`).

    ??? quote "Source code"

        === "CurveTricryptoOptimizedWETH.vy"

            ```python
            virtual_price: public(uint256)  # <------ Cached (fast to read) virtual price.
            #                          The cached `virtual_price` is also used internally.
            ```

    === "Example"
        ```shell
        >>> CurveTricryptoOptimizedWETH.virtual_price()
        1005849271542625678
        ```


---


## **Updating Oracles and Other Storage Variables**

The EMA oracle and other storage variables are updated each time the internal `tweak_price` function is called. This function tweaks`price_oracle` and `last_price`, and conditionally adjusts `price_scale`.

The `tweak_price` function is called whenever there is an unbalanced liquidity operation, including:

- `_exchange`
- `add_liquidity`
- `remove_liquidity_one_coin`


??? quote "Source Code"

    ```py
    @internal
    def tweak_price(
        A_gamma: uint256[2],
        _xp: uint256[N_COINS],
        new_D: uint256,
        K0_prev: uint256 = 0,
    ) -> uint256:
        """
        @notice Tweaks price_oracle, last_price and conditionally adjusts
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

        rebalancing_params: uint256[3] = self._unpack(
            self.packed_rebalancing_params
        )  # <---------- Contains: allowed_extra_profit, adjustment_step, ma_time.
        price_oracle: uint256[N_COINS - 1] = self._unpack_prices(
            self.price_oracle_packed
        )
        last_prices: uint256[N_COINS - 1] = self._unpack_prices(
            self.last_prices_packed
        )
        packed_price_scale: uint256 = self.price_scale_packed
        price_scale: uint256[N_COINS - 1] = self._unpack_prices(
            packed_price_scale
        )

        total_supply: uint256 = self.totalSupply
        old_xcp_profit: uint256 = self.xcp_profit
        old_virtual_price: uint256 = self.virtual_price
        last_prices_timestamp: uint256 = self.last_prices_timestamp

        # ----------------------- Update MA if needed ----------------------------

        if last_prices_timestamp < block.timestamp:

            #   The moving average price oracle is calculated using the last_price
            #      of the trade at the previous block, and the price oracle logged
            #              before that trade. This can happen only once per block.

            # ------------------ Calculate moving average params -----------------

            alpha: uint256 = MATH.wad_exp(
                -convert(
                    unsafe_div(
                        (block.timestamp - last_prices_timestamp) * 10**18,
                        rebalancing_params[2]  # <----------------------- ma_time.
                    ),
                    int256,
                )
            )

            for k in range(N_COINS - 1):

                # ----------------- We cap state price that goes into the EMA with
                #                                                 2 x price_scale.
                price_oracle[k] = unsafe_div(
                    min(last_prices[k], 2 * price_scale[k]) * (10**18 - alpha) +
                    price_oracle[k] * alpha,  # ^-------- Cap spot price into EMA.
                    10**18
                )

            self.price_oracle_packed = self._pack_prices(price_oracle)
            self.last_prices_timestamp = block.timestamp  # <---- Store timestamp.

        #                  price_oracle is used further on to calculate its vector
        #            distance from price_scale. This distance is used to calculate
        #                  the amount of adjustment to be done to the price_scale.

        # ------------------ If new_D is set to 0, calculate it ------------------

        D_unadjusted: uint256 = new_D
        if new_D == 0:  #  <--------------------------- _exchange sets new_D to 0.
            D_unadjusted = MATH.newton_D(A_gamma[0], A_gamma[1], _xp, K0_prev)

        # ----------------------- Calculate last_prices --------------------------

        last_prices = MATH.get_p(_xp, D_unadjusted, A_gamma)
        for k in range(N_COINS - 1):
            last_prices[k] = unsafe_div(last_prices[k] * price_scale[k], 10**18)
        self.last_prices_packed = self._pack_prices(last_prices)

        # ---------- Update profit numbers without price adjustment first --------

        xp: uint256[N_COINS] = empty(uint256[N_COINS])
        xp[0] = unsafe_div(D_unadjusted, N_COINS)
        for k in range(N_COINS - 1):
            xp[k + 1] = D_unadjusted * 10**18 / (N_COINS * price_scale[k])

        # ------------------------- Update xcp_profit ----------------------------

        xcp_profit: uint256 = 10**18
        virtual_price: uint256 = 10**18

        if old_virtual_price > 0:

            xcp: uint256 = MATH.geometric_mean(xp)
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

        self.xcp_profit = xcp_profit

        # ------------ Rebalance liquidity if there's enough profits to adjust it:
        if virtual_price * 2 - 10**18 > xcp_profit + 2 * rebalancing_params[0]:
            #                          allowed_extra_profit --------^

            # ------------------- Get adjustment step ----------------------------

            #                Calculate the vector distance between price_scale and
            #                                                        price_oracle.
            norm: uint256 = 0
            ratio: uint256 = 0
            for k in range(N_COINS - 1):

                ratio = unsafe_div(price_oracle[k] * 10**18, price_scale[k])
                # unsafe_div because we did safediv before ----^

                if ratio > 10**18:
                    ratio = unsafe_sub(ratio, 10**18)
                else:
                    ratio = unsafe_sub(10**18, ratio)
                norm = unsafe_add(norm, ratio**2)

            norm = isqrt(norm)  # <-------------------- isqrt is not in base 1e18.
            adjustment_step: uint256 = max(
                rebalancing_params[1], unsafe_div(norm, 5)
            )  #           ^------------------------------------- adjustment_step.

            if norm > adjustment_step:  # <---------- We only adjust prices if the
                #          vector distance between price_oracle and price_scale is
                #             large enough. This check ensures that no rebalancing
                #           occurs if the distance is low i.e. the pool prices are
                #                                     pegged to the oracle prices.

                # ------------------------------------- Calculate new price scale.

                p_new: uint256[N_COINS - 1] = empty(uint256[N_COINS - 1])
                for k in range(N_COINS - 1):
                    p_new[k] = unsafe_div(
                        price_scale[k] * unsafe_sub(norm, adjustment_step)
                        + adjustment_step * price_oracle[k],
                        norm
                    )  # <- norm is non-zero and gt adjustment_step; unsafe = safe

                # ---------------- Update stale xp (using price_scale) with p_new.
                xp = _xp
                for k in range(N_COINS - 1):
                    xp[k + 1] = unsafe_div(_xp[k + 1] * p_new[k], price_scale[k])
                    # unsafe_div because we did safediv before ----^

                # ------------------------------------------ Update D with new xp.
                D: uint256 = MATH.newton_D(A_gamma[0], A_gamma[1], xp, 0)

                for k in range(N_COINS):
                    frac: uint256 = xp[k] * 10**18 / D  # <----- Check validity of
                    assert (frac > 10**16 - 1) and (frac < 10**20 + 1)  #   p_new.

                xp[0] = D / N_COINS
                for k in range(N_COINS - 1):
                    xp[k + 1] = D * 10**18 / (N_COINS * p_new[k])  # <---- Convert
                    #                                           xp to real prices.

                # ---------- Calculate new virtual_price using new xp and D. Reuse
                #              `old_virtual_price` (but it has new virtual_price).
                old_virtual_price = unsafe_div(
                    10**18 * MATH.geometric_mean(xp), total_supply
                )  # <----- unsafe_div because we did safediv before (if vp>1e18)

                # ---------------------------- Proceed if we've got enough profit.
                if (
                    old_virtual_price > 10**18 and
                    2 * old_virtual_price - 10**18 > xcp_profit
                ):

                    packed_price_scale = self._pack_prices(p_new)

                    self.D = D
                    self.virtual_price = old_virtual_price
                    self.price_scale_packed = packed_price_scale

                    return packed_price_scale

        # --------- price_scale was not adjusted. Update the profit counter and D.
        self.D = D_unadjusted
        self.virtual_price = virtual_price

        return packed_price_scale
    ```
