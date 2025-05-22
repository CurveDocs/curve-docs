<h1>Stableswap-NG Oracles</h1>


!!!danger "WARNING: Oracle Vulnerability"
    A specific AMM implementation of [Stableswap-NG](https://github.com/curvefi/stableswap-ng) has a bug that can cause the price oracle to change sharply if the tokens within the AMM **do not all have the same token decimal precision of 18 or if the tokens use external rates**. For example, the [`USDe <> USDC`](https://etherscan.io/address/0x02950460e2b9529d0e00284a5fa2d7bdf3fa4d72) pool has this issue, as USDe has a precision of 18 and USDC of 6.

    A list of identified affected pools can be found in this [:material-google-spreadsheet: Google Spreadsheet](https://docs.google.com/spreadsheets/d/130LPSQbAnMWTC1yVO23cqRSblrkYFfdHdRwYNpaaoYY/edit?usp=sharing).

    **This bug only affects the use of the oracle and does not impact token exchanges or any liquidity actions at all. The AMM still functions as intended.** Pools deployed after **`Dec-12-2023 09:39:35 AM +UTC`** do not include the bug, as the fixed AMM implementation of the `StableSwapNG Factory` was [set to the updated version](https://etherscan.io/tx/0x5fc02a3f46e40a48ae4cecc07534bb3e0228b7a7a59b652801521f2af3a00b72).

    === "Code Changes"

        *The source of the bug is in the AMM implementations [`code line 777`](https://github.com/curvefi/stableswap-ng/commit/4bb402ecb386979c113bee770ffbea9aebd5ae66#diff-5fb59b0d4563b84cdb3bb3740486847e798a1eca825b537ecbab95cb74d03847L777-L779) and was fixed in commit [`4bb402ecb386979c113bee770ffbea9aebd5ae66`](https://github.com/curvefi/stableswap-ng/commit/4bb402ecb386979c113bee770ffbea9aebd5ae66). The function did not take token precisions into account when updating the oracle in the `remove_liquidity_imbalance` function. The only change to fix the bug was made in a single line to ensure the `upkeep_oracle` calls the internal `_xp_mem` function before upkeeping the oracle:*

        ```py hl_lines="2 6"
        ### ----- old code (bugged) ----- ###
        self.upkeep_oracles(new_balances, amp, D1)


        ### ----- new code (bug fixed) ----- ###
        self.upkeep_oracles(self._xp_mem(rates, new_balances), amp, D1)

        @pure
        @internal
        def _xp_mem(
            _rates: DynArray[uint256, MAX_COINS],
            _balances: DynArray[uint256, MAX_COINS]
        ) -> DynArray[uint256, MAX_COINS]:

            result: DynArray[uint256, MAX_COINS] = empty(DynArray[uint256, MAX_COINS])
            for i in range(N_COINS_128, bound=MAX_COINS_128):
                result.append(unsafe_div(_rates[i] * _balances[i], PRECISION))
            return result
        ```

    To **manually verify if a pool is using a correct (bug-free) implementation**, one can simply view the source code of the contract and check if `self.xp_mem(...)` is being called within `self.upkeep_oracles(...)` in the `remove_liquidity_imbalance` function.


---


## **Price and D Oracles**



*Stableswap-NG pools have the following oracles:*

<div class="grid cards" markdown>

-   **`price_oracle`**

    ---

    An exponential moving-average price oracle of an asset within the AMM with regard to the coin at index 0.


-   **`D_oracle`**

    ---

    An exponential moving-average oracle of the D invariant.

</div>

!!!example "Example: Price Oracle for crvUSD/USDC"

    The [`crvUSD/USDC`](https://etherscan.io/address/0x4dece678ceceb27446b35c672dc7d61f30bad69e) pool consists of `crvUSD <> USDC`.

    Because `USDC` is the coin at index 0, `price_oracle()` returns the price of `crvUSD` with regard to `USDC`.

    ```vyper
    >>> price_oracle() = 999043303185591283
    0.99904330318       # price of crvUSD w.r.t USDC
    ```

    *In order to get the reverse EMA (price of `USDC` with regard to `crvUSD`):*

    $\frac{10^{36}}{\text{price_oracle()}} = 1.0009576e+18$


---


The AMM implementation utilizes two private variables, `last_prices_packed` and `last_D_packed`, to store the latest spot and EMA values. These values serve as the foundation for calculating the oracles.


!!!danger "Oracle Manipulation Risk"
    The spot price cannot be immediately used for the calculation of the moving average, as this would permit single-block oracle manipulation. Consequently, the `_calc_moving_average` method, which calculates the moving average of the oracle, uses `last_prices_packed` or `last_D_packed`. These variables retain prices from previous actions.


    ???quote "`_calc_moving_average`"

        ```vyper
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
                        unsafe_div(unsafe_mul(unsafe_sub(block.timestamp, ma_last_time), 10**18), averaging_window), int256
                    )
                )
                return unsafe_div(last_spot_value * (10**18 - alpha) + last_ema_value * alpha, 10**18)

            return last_ema_value
        ```


*The formula to calculate the exponential moving-average essentially comes down to:*

$$\alpha = e^{\text{power}}$$

$$\text{power} = \frac{(\text{block.timestamp} - \text{ma_last_time}) \times 10^{18}}{\text{ma_time}}$$

$$\text{EMA} = \frac{\text{last_spot_value} \times (10^{18} - \alpha) + \text{last_ema_value} \times \alpha}{10^{18}}$$

*with:*

| Variable           | Description                                          |
| ------------------ | ---------------------------------------------------- |
| `block.timestamp`  | Timestamp of the block. Since all transactions within a block share the same timestamp, the EMA oracles can only be updated once per block. |
| `last_prices_timestamp` | Last time the ma oracle was updated. Differentiates between D and price. |
| `ma_time` | Time window for the moving-average oracle; for the `price_oracle` it's `ma_exp_time`, and for the `D_oracle` it's `D_ma_time`. |
| `last_spot_value`  | Last price within the AMM; for the `price_oracle` it's `last_price`, which is the first value of `last_prices_packed`. For calculating `D_oracle`, it's `last_D`, which is the first value in `last_D_packed`. |
| `last_ema_value`   | Last EMA value; for calculating `price_oracle` it's `ma_price`, which is the second value packed in `last_prices_packed`. For calculating `D_oracle` it's `ma_D`, also the second value in `last_D_packed`. |
| `alpha`            | Weighting multiplier that adjusts the impact of the latest spot value versus the previous EMA value in the new EMA calculation. |
| `exp`            | Function that calculates the natural exponential function of a signed integer with a precision of 1e18. |


`price_oracle` calculation is based on the two values stored in `last_prices_packed`, `last_price` and `ema_price`. These values are conditionally updated:
Generally speaking, both values are simultaneously updated whenever `upkeep_oracles` is called. This happens at certain actions, see [here](#updating-oracles).

While `last_price` (spot price) is always updated at every relevant action, the `ema_price` is maximally updated once per block. There might be the case that there is more than one relevant action within the same block. Let's say there are two relevant actions within the block which would update both values:
If this is the case, `last_price` is updated at every action, so there will be two updated. `ema_price` on the other hand will only be updated once (at the first action) and will not change a second time. Reasoning behind this is to prevent single-block manipulation. The `ema_price` will just be updated at the next action outside of this block.


`D_oracle` calculation is based on the two values stored in `last_D_packed`, `last_D` and `ma_D`.


!!!notebook "Jupyter Notebook"
    For a practical **demonstration of how individual variables behave during the upkeep of the oracle**, a Jupyter notebook is available for reference. This notebook provides a plot showcasing the dynamics in the process.

    It can be accessed here: https://try.vyperlang.org/hub/user-redirect/lab/tree/shared/mo-anon/stableswap-ng/oracles/ema_oracle.ipynb.

---


### `price_oracle`
!!! description "`StableSwap.price_oracle(i: uint256) -> uint256:`"

    Function to calculate the exponential moving average (EMA) price for the coin at index `i` with regard to the coin at index 0. The calculation is based on the last spot value (`last_price`), the last ma value (`ema_price`), the moving average time window (`ma_exp_time`), and on the difference between the current timestamp (`block.timestamp`) and the timestamp when the ma oracle was last updated (unpacks from the first value of `ma_last_time`).

    `i = 0` will return the price oracle of `coin[1]`, `i = 1` the price oracle of `coin[2]`, and so on.

    Returns: EMA price of coin `i` (`uint256`).

    | Input  | Type      | Description                        |
    | ------ | --------- | ---------------------------------- |
    | `i`    | `uint256` | Index value of the coin to calculate the EMA price for. i = 0 returns the price oracle for coin(1). |

    ??? quote "Source code"

        ```vyper
        last_prices_packed: DynArray[uint256, MAX_COINS]  #  packing: last_price, ma_price
        ma_exp_time: public(uint256)
        ma_last_time: public(uint256)                     # packing: ma_last_time_p, ma_last_time_D

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

        ```shell
        >>> StableSwap.price_oracle(0)
        1000187813326452556
        ```


### `D_oracle`
!!! description "`StableSwap.D_oracle() -> uint256:`"

    Function to calculate the exponential moving average (EMA) value for the `D` invariant, distinct from calculations for individual coins. This is based on the most recent "spot" value and EMA value of D, extracted from the private `last_D_packed` variable. It considers the moving average time window for D (`D_ma_time`), and calculates the difference between the current timestamp (`block.timestamp`) and the timestamp of the last update to the ma oracle of D, derived from the second value in `ma_last_time`.

    Returns: EMA of D (`uint256`).

    ??? quote "Source code"

        ```vyper
        last_D_packed: uint256                            #  packing: last_D, ma_D
        D_ma_time: public(uint256)
        ma_last_time: public(uint256)                     # packing: ma_last_time_p, ma_last_time_D

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

        ```shell
        >>> StableSwap.D_oracle()
        2183776033162328612308290
        ```

---


## **Other Methods**

### `last_price`
!!! description "`StableSwap.last_price(i: uint256) -> uint256:`"

    !!!warning "Revert"
        This function reverts if `i >= MAX_COINS`.

    Getter method for the last stored price for the coin at index value `i`, stored in `last_prices_packed`. The spot price is retrieved from the lower 128 bits of the packed value in `last_prices_packed` and is updated whenever the internal `upkeep_oracles` method is called.

    `i = 0` will return the last price of `coin[1]`, `i = 1` the last price of `coin[2]`, and so on.

    Returns: last stored spot price of coin `i` (`uint256`).

    | Input | Type      | Description                                  |
    |-------|-----------|----------------------------------------------|
    | `i`   | `uint256` | Index value of the coin to get the last price for. |

    ??? quote "Source code"

        ```vyper
        last_prices_packed: DynArray[uint256, MAX_COINS]  #  packing: last_price, ma_price

        @view
        @external
        def last_price(i: uint256) -> uint256:
            return self.last_prices_packed[i] & (2**128 - 1)
        ```

    === "Example"

        ```shell
        >>> StableSwap.last_price(0)
        1000187811171795736
        ```


### `ema_price`
!!! description "`StableSwap.ema_price(i: uint256) -> uint256:`"

    !!! Warning "Revert"
        This function will revert if `i >= MAX_COINS`.

    Getter method for the last stored exponential moving-average (EMA) price of the coin at index value `i`, retrieved from `last_prices_packed`. The EMA price is obtained by shifting the value in `last_prices_packed` to the right by 128 bits. This value is updated whenever the `upkeep_oracles()` function is internally called.

    `i = 0` will return the last EMA price of `coin[1]`, `i = 1` of `coin[2]`, and so on.

    Returns: the last stored EMA price of coin `i` (`uint256`).

    | Input | Type      | Description                                      |
    |-------|-----------|--------------------------------------------------|
    | `i`   | `uint256` | Index of the coin for which to retrieve the last EMA price. |

    ??? quote "Source code"

        ```vyper
        last_prices_packed: DynArray[uint256, MAX_COINS]  #  packing: last_price, ma_price

        @view
        @external
        def ema_price(i: uint256) -> uint256:
            return (self.last_prices_packed[i] >> 128)
        ```

    === "Example"

        ```shell
        >>> StableSwap.ema_price(0)
        1000187824576102231
        ```


### `get_p`
!!! description "`StableSwap.get_p(i: uint256) -> uint256:`"

    Function to calculate the current AMM spot price of coin `i` based on the coin balances in the pool, the amplification coefficient `A`, and the `D` invariant.

    `i = 0` will return the price of `coin[1]`, `i = 1` the price of `coin[2]`, and so on.

    Returns: current spot price (`uint256`).

    | Input | Type      | Description                                       |
    |-------|-----------|---------------------------------------------------|
    | `i`   | `uint256` | Index of the coin for which to calculate the current spot price. |

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

        ```shell
        >>> StableSwap.get_p(0)
        1000187811171795736
        ```


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

        ```shell
        >>> StableSwap.get_virtual_price()
        1000063971106330426
        ```


### `ma_exp_time`
!!! description "`StableSwap.ma_exp_time() -> uint256: view`"

    Getter for the exponential moving-average time for the price oracle (`price_oracle`). This value can be adjusted via `set_ma_exp_time()`, as detailed in the [admin controls](../pools/admin_controls.md#set_ma_exp_time) section.

    Returns: EMA time for the price oracle (`uint256`).

    ??? quote "Source code"

        ```vyper
        ma_exp_time: public(uint256)
        ```

    === "Example"

        ```shell
        >>> StableSwap.ma_exp_time()
        866
        ```


### `D_ma_time`
!!! description "`StableSwap.D_ma_time() -> uint256: view`"

    Getter for the exponential moving-average time for the D oracle. This value can be adjusted via `set_ma_exp_time()`, as detailed in [admin controls](../pools/admin_controls.md#set_ma_exp_time).

    Returns: EMA time for the D oracle (`uint256`).

    ??? quote "Source code"

        ```vyper
        D_ma_time: public(uint256)
        ```

    === "Example"

        ```shell
        >>> StableSwap.D_ma_time()
        62324
        ```


### `ma_last_time`
!!! description "`StableSwap.ma_last_time() -> uint256: view`"

    !!!warning "Distinction between price and D"
        This variable contains two packed values because there needs to be a distinction between prices and the D invariant. The reasoning behind this is that the **moving-average price oracle is not updated if users remove liquidity in a balanced proportion (`remove_liquidity`), but the D oracle is.**

    Getter for the last time the exponential moving-average oracle of coin prices or the D invariant was updated. This variable contains two packed values: **ma_last_time_p**, which represents the timestamp of the last update for prices, and **ma_last_time_D**, which represents the last timestamp of the oracle update for the D invariant.

    Returns: packed value (`uint256`).

    ??? quote "Source code"

        ```vyper
        ma_last_time: public(uint256)                     # packing: ma_last_time_p, ma_last_time_D
        ```

    === "Example"

        ```shell
        >>> StableSwap.ma_last_time()
        579359617954437487117250992339883299967854142015
        ```

    !!!note "Unpacking values"
        The value needs to be unpacked, as it contains two values, **ma_last_time_p** and **ma_last_time_D**.

        For example, 579359617954437487117250992339883299967854142015 is unpacked into two uint256 numbers. First, its lower 128 bits are isolated using a bitwise AND with 2**128 − 1, and then the value is shifted right by 128 bits to extract the upper 128 bits.
        It returns: [1702584895, 1702584895], meaning both moving-average oracles were updated at the same time.


---


## **Updating Oracles**

The internal `upkeep_oracles` method is responsible for updating the price and D oracle.

!!!info
    Both EMA values, `ema_price` and `ma_D`, are updated maximally once per block. If there are two or more actions within the same block that would update the oracles, only the first action will update these values. The spot price (`last_price` or `last_D`) will always update.

    The rationale behind this approach is that all transactions within a block share the same timestamp. Therefore, the condition `if ma_last_time < block.timestamp` can only be satisfied once per block (the first time it's called). If there are multiple actions that would trigger an oracle update, it will be updated in the next relevant action.


???quote "Source code for the internal **`upkeep_oracle`** function"

    ```vyper
    @internal
    def upkeep_oracles(xp: DynArray[uint256, MAX_COINS], amp: uint256, D: uint256):
        """
        @notice Upkeeps price and D oracles.
        """
        ma_last_time_unpacked: uint256[2] = self.unpack_2(self.ma_last_time)
        last_prices_packed_current: DynArray[uint256, MAX_COINS] = self.last_prices_packed
        last_prices_packed_new: DynArray[uint256, MAX_COINS] = last_prices_packed_current

        spot_price: DynArray[uint256, MAX_COINS] = self._get_p(xp, amp, D)

        # -------------------------- Upkeep price oracle -------------------------

        for i in range(MAX_COINS):

            if i == N_COINS - 1:
                break

            if spot_price[i] != 0:

                # Update packed prices -----------------
                last_prices_packed_new[i] = self.pack_2(
                    min(spot_price[i], 2 * 10**18),  # <----- Cap spot value by 2.
                    self._calc_moving_average(
                        last_prices_packed_current[i],
                        self.ma_exp_time,
                        ma_last_time_unpacked[0],  # index 0 is ma_last_time for prices
                    )
                )

        self.last_prices_packed = last_prices_packed_new

        # ---------------------------- Upkeep D oracle ---------------------------

        last_D_packed_current: uint256 = self.last_D_packed
        self.last_D_packed = self.pack_2(
            D,
            self._calc_moving_average(
                last_D_packed_current,
                self.D_ma_time,
                ma_last_time_unpacked[1],  # index 1 is ma_last_time for D
            )
        )

        # Housekeeping: Update ma_last_time for p and D oracles ------------------
        for i in range(2):
            if ma_last_time_unpacked[i] < block.timestamp:
                ma_last_time_unpacked[i] = block.timestamp

        self.ma_last_time = self.pack_2(ma_last_time_unpacked[0], ma_last_time_unpacked[1])
    ```

---

### Price Oracles

The price oracle is updated when the `upkeep_oracles` method is called. This occurs in response to one of the following actions:

- Token exchange (`__exchange`)
- Liquidity addition (`add_liquidity`)
- Single-sided liquidity (`remove_liquidity_one_coin`)
- Liquidity removal in an imbalanced proportion (`remove_liquidity_imbalance`)

*When price oracles are upkept, the code calculates both the spot price and the moving-average price. These values are then packed and stored together in `last_prices_packed`.*


```vyper
# -------------------------- Upkeep price oracle -------------------------

for i in range(MAX_COINS):

    if i == N_COINS - 1:
        break

    if spot_price[i] != 0:

        # Update packed prices -----------------
        last_prices_packed_new[i] = self.pack_2(
            min(spot_price[i], 2 * 10**18),  # <----- Cap spot value by 2.
            self._calc_moving_average(
                last_prices_packed_current[i],
                self.ma_exp_time,
                ma_last_time_unpacked[0],  # index 0 is ma_last_time for prices
            )
        )

self.last_prices_packed = last_prices_packed_new
```


1. `last_price` which represents the last stored spot price within the AMM is calculated using `_get_p`. Additionally, the value is capped at `2 * 10**18` to prevent price oracle manipulation. Note: It's not actually the spot price which is capped, but rather the spot price that is used in the calculation for the EMA price oracle.

    ???quote "`_get_p`"

        ```vyper
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

            for i in range(N_COINS_128, bound=MAX_COINS_128):
                Dr = Dr * D / xp[i]

            p: DynArray[uint256, MAX_COINS] = empty(DynArray[uint256, MAX_COINS])
            xp0_A: uint256 = unsafe_div(ANN * xp[0], A_PRECISION)

            for i in range(1, MAX_COINS):

                if i == N_COINS:
                    break

                p.append(10**18 * (xp0_A + unsafe_div(Dr * xp[0], xp[i])) / (xp0_A + Dr))

            return p
        ```


2. The moving-average price (`ema_price`) is calculated using `_calc_moving_average`. This value can only be updated once per block. If there are two actions which would update the value, only the first action will update it. For the second action, only the `last_price` is updated, while `ema_price` will not be updated and have the same value as in the first action.

    ???quote "`_calc_moving_average`"

        ```vyper
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
                        unsafe_div(unsafe_mul(unsafe_sub(block.timestamp, ma_last_time), 10**18), averaging_window), int256
                    )
                )
                return unsafe_div(last_spot_value * (10**18 - alpha) + last_ema_value * alpha, 10**18)

            return last_ema_value
        ```


---


### D Oracle

The D oracle is updated when the `upkeep_oracles` method is called. This occurs in response to one of the following actions:

- Token exchange (`__exchange`)
- Liquidity addition (`add_liquidity`)
- Single-sided liquidity (`remove_liquidity_one_coin`)
- Liquidity removal in an imbalanced proportion (`remove_liquidity_imbalance`)
- Balanced proportion liquidity removal. For this action, the `remove_liquidity` function, which executes it, does not directly call the `upkeep_oracles` method. Instead, the D oracle update is performed "manually" within the function. The rationale behind this approach is that updating the price oracle is not necessary in this scenario, because removing in a balanced proportion does not change the prices within the AMM.


*When the D oracle is updated, the code calculates both the "spot" D invariant and the moving-average D invariant value. These values are then packed and stored together in `last_D_packed`.*



```vyper
# ---------------------------- Upkeep D oracle ---------------------------

last_D_packed_current: uint256 = self.last_D_packed
self.last_D_packed = self.pack_2(
    D,
    self._calc_moving_average(
        last_D_packed_current,
        self.D_ma_time,
        ma_last_time_unpacked[1],  # index 1 is ma_last_time for D
    )
)
```
