how can the immediate use of the spot price for the calculation for the moving average lead to single-block oracle manipulation?

if there are is one exchange and no trades or any price changing action after, after how many seconds does `price_oracle` reach `last_price`? need to plot this!!!



---



there is `last_prices_packed` which contains two uint256 values (packed). first is the `last_price`, second is the `ma_price`.

`last_price` is adjusted whenever `upkeep_oracle` is called and is set to `min(spot_price[i], 2 * 10**18)`.

`_get_p` retuns a DnyArray with the spot prices of the coins in the pool (based on balances in the pool, A and D)

iterates over the number of coins in the pool:
if the spot_price != 0, we update the `last_price_packed` of the coin with the spot value calculated in `_get_p`. BUT: this value is capped by 2 * 10**18, why???

`ma_exp_time`


`price_oracle` -> this method uses `_calc_moving_average` to calculates the price oracle based on the most recent spot price (`last_price`, which is stored in the first of `last_prices_packed`) and the last moving average price (`ma_price`, which is the second value in `last_prices_packed`). Additionally uses `ma_exp_time` and `ma_last_time` to calc the ema oracle.
`ma_exp_time` -> variable which is used for calculating the ma price



`get_p` -> returns the AMM state price of the token. is calculated using `_get_p`, so whats the difference to `last_price`? can the AMM price change compraed to the value stored within `last_prices_packed`. e.g. when A or D changes?



`D_oracle` -> ema oracle or D. also uses `_calc_moving_average` but uses `last_D_packed` values (`last_D` and `ma_D`) instead of `last_prices_pacled`
`D_ma_time`


`ma_last_time` -> holds the timestamp of the last change of the ma oracle for price and D. 


`get_virtual_price` -> 





## **Technical runthrough on how the oracles are updated**

To update or upkeep oracles, the pool uses the internal function `upkeep_oracle`.

??? quote "upkeep_oracles(xp: DynArray[uint256, MAX_COINS], amp: uint256, D: uint256):"

    !!!warning
        The input values for this function are not the values stored in `A` or `D`. Instead, these input values are "fresh" values computed directly before calling this function. For example, if there was an exchange, the `xp`, `amp`, and `D` values were computed beforehand and then passed into this function.

    Function to upkeep price and D oracles.

    | Input | Type                            | Description                |
    | ----- | ------------------------------- | -------------------------- |
    | `xp`  | `DynArray[uint256, MAX_COINS]` | Pool balances              |
    | `amp` | `uint256`                      | Amplification coefficient |
    | `D`   | `uint256`                      | D invariant                |

    ```python
    # ----------------------- Oracle Specific vars -------------------------------

    last_prices_packed: DynArray[uint256, MAX_COINS]  #  packing: last_price, ma_price
    last_D_packed: uint256                            #  packing: last_D, ma_D
    ma_exp_time: public(uint256)
    D_ma_time: public(uint256)
    ma_last_time: public(uint256)                     # packing: ma_last_time_p, ma_last_time_D
    # ma_last_time has a distinction for p and D because p is _not_ updated if
    # users remove_liquidity, but D is.

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

                # Upate packed prices -----------------
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

*The function start of by storing several values into memory:[^1]*

```py
@internal
def upkeep_oracles(xp: DynArray[uint256, MAX_COINS], amp: uint256, D: uint256):
    """
    @notice Upkeeps price and D oracles.
    """
    ma_last_time_unpacked: uint256[2] = self.unpack_2(self.ma_last_time)
    last_prices_packed_current: DynArray[uint256, MAX_COINS] = self.last_prices_packed
    last_prices_packed_new: DynArray[uint256, MAX_COINS] = last_prices_packed_current

    spot_price: DynArray[uint256, MAX_COINS] = self._get_p(xp, amp, D)
```
   
[^1]: When using values multiple times within a function, it's more gas-efficient to store them in memory rather than reading them from storage multiple times.

1. `ma_last_time_unpacked` stores the unpacked values of `ma_last_time_p` and `ma_last_time_D`. Differentiation between `p` and `D` is necessary because the price oracle is not updated when liquidity is removed in a balanced proportion via `remove_liquidity`.
2. `last_prices_packed_current` stores the current value of `last_prices_packed` in a DynArray.
3. `last_prices_packed_new` is initially set to the value of `last_prices_packed_current`. This variable will be updated with new values after the EMA oracles are calculated.
4. `spot_price` is calculated using the internal `_get_p` function.


---

*Now its time to upkeep the price oracle:*

```python
# -------------------------- Upkeep price oracle -------------------------

for i in range(MAX_COINS):

    if i == N_COINS - 1:
        break

    if spot_price[i] != 0:

        # Upate packed prices -----------------
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


The code iterates over the range of `MAX_COINS` and breaks when `N_COINS - 1` is reached. Additionally, the prices are only updated if `spot_price[i] != 0`. This condition ensures that only valid spot prices are considered for updating.

Now, we calculate new values for `last_prices_packed_new` by packing the following two values:

- The first value, `last_price`, is determined by taking the minimum of the earlier calculated `spot_price[i]` or `2 * 10**18`. This effectively caps the spot value at 2.
- For the second value (`ma_price`), the moving average price is calculated using the internal `_calc_moving_average()` method. 

    ???quote "_calc_moving_average(packed_value: uint256, averaging_window: uint256, ma_last_time: uint256) -> uint256:"

        ```py
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

    For computation of the exponential, the code uses a derived version from [Snekmate](https://github.com/pcaversaccio/snekmate):

    ??? quote "exp(x: int256) -> uint256:"

        ```py
        @internal
        @pure
        def exp(x: int256) -> uint256:
            """
            @dev Calculates the natural exponential function of a signed integer with
                a precision of 1e18.
            @notice Note that this function consumes about 810 gas units. The implementation
                    is inspired by Remco Bloemen's implementation under the MIT license here:
                    https://xn--2-umb.com/22/exp-ln.
            @dev This implementation is derived from Snekmate, which is authored
                by pcaversaccio (Snekmate), distributed under the AGPL-3.0 license.
                https://github.com/pcaversaccio/snekmate
            @param x The 32-byte variable.
            @return int256 The 32-byte calculation result.
            """
            value: int256 = x

            # If the result is `< 0.5`, we return zero. This happens when we have the following:
            # "x <= floor(log(0.5e18) * 1e18) ~ -42e18".
            if (x <= -42139678854452767551):
                return empty(uint256)

            # When the result is "> (2 ** 255 - 1) / 1e18" we cannot represent it as a signed integer.
            # This happens when "x >= floor(log((2 ** 255 - 1) / 1e18) * 1e18) ~ 135".
            assert x < 135305999368893231589, "wad_exp overflow"

            # `x` is now in the range "(-42, 136) * 1e18". Convert to "(-42, 136) * 2 ** 96" for higher
            # intermediate precision and a binary base. This base conversion is a multiplication with
            # "1e18 / 2 ** 96 = 5 ** 18 / 2 ** 78".
            value = unsafe_div(x << 78, 5 ** 18)

            # Reduce the range of `x` to "(-½ ln 2, ½ ln 2) * 2 ** 96" by factoring out powers of two
            # so that "exp(x) = exp(x') * 2 ** k", where `k` is a signer integer. Solving this gives
            # "k = round(x / log(2))" and "x' = x - k * log(2)". Thus, `k` is in the range "[-61, 195]".
            k: int256 = unsafe_add(unsafe_div(value << 96, 54916777467707473351141471128), 2 ** 95) >> 96
            value = unsafe_sub(value, unsafe_mul(k, 54916777467707473351141471128))

            # Evaluate using a "(6, 7)"-term rational approximation. Since `p` is monic,
            # we will multiply by a scaling factor later.
            y: int256 = unsafe_add(unsafe_mul(unsafe_add(value, 1346386616545796478920950773328), value) >> 96, 57155421227552351082224309758442)
            p: int256 = unsafe_add(unsafe_mul(unsafe_add(unsafe_mul(unsafe_sub(unsafe_add(y, value), 94201549194550492254356042504812), y) >> 96,\
                                28719021644029726153956944680412240), value), 4385272521454847904659076985693276 << 96)

            # We leave `p` in the "2 ** 192" base so that we do not have to scale it up
            # again for the division.
            q: int256 = unsafe_add(unsafe_mul(unsafe_sub(value, 2855989394907223263936484059900), value) >> 96, 50020603652535783019961831881945)
            q = unsafe_sub(unsafe_mul(q, value) >> 96, 533845033583426703283633433725380)
            q = unsafe_add(unsafe_mul(q, value) >> 96, 3604857256930695427073651918091429)
            q = unsafe_sub(unsafe_mul(q, value) >> 96, 14423608567350463180887372962807573)
            q = unsafe_add(unsafe_mul(q, value) >> 96, 26449188498355588339934803723976023)

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
            return unsafe_mul(convert(convert(r, bytes32), uint256), 3822833074963236453042738258902158003155416615667) >> convert(unsafe_sub(195, k), uint256)
        ```

*`last_prices_packed_new`, which contains the new `last_price` and `ma_price` is then assigned as the new `last_prices_packed` variable. The price oracle is now updated.*


---

*After updating the price oracle, we want to update the D oracle*

```python
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

The D oracle is not coin-dependent; therefore, it does not need to iterate over the number of coins in the pool or anything similar. It's a pool-based value. Just like the price oracle, the D oracle is an EMA oracle using the internal `_calc_moving_average` method to calculate the value.

D oracle's values are packed and stored within `last_D_packed`, containing `last_D` and `ma_D`.

Now, we assign the following new values for `last_D_packed`:

1. For `last_D`, we assign the `D` value which was calculated in the specific function that called `upkeep_oracle`. For example, if there was an exchange, the `D` value was calculated within `__exchange` and passed into the method to upkeep the oracle.
2. For `ma_D`, we compute the value using the `_calc_moving_average` method using `last_D_packed_current`, `D_ma_time` (which is the moving average window of the D oracle), and `ma_last_time_unpacked[1]` (which is `ma_last_time` for D).


---

*Now that we've updated oracles for price and D, the code does some housekeeping:*

```python
# Housekeeping: Update ma_last_time for p and D oracles ------------------
for i in range(2):
    if ma_last_time_unpacked[i] < block.timestamp:
        ma_last_time_unpacked[i] = block.timestamp

self.ma_last_time = self.pack_2(ma_last_time_unpacked[0], ma_last_time_unpacked[1])
```

In this last step, `ma_last_time` values for p and D are updated if the values are less than `block.timestamp`. If the function to upkeep the oracles is called twice within a block, the first call will update this value, but the second one won't. This is consistent and makes sense because on the second call, the EMA values are not updated; it only happens once per block (during the first call). This is due to the line of code `if ma_last_time < block.timestamp:` in `_calc_moving_average`, which prevents the update of the oracle. Each block shares the same timestamp.


