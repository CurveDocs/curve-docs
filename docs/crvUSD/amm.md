LLAMMA is the **market-making contract that rebalances the collateral**. This contract is **responsible for liquidating and de-liquidating collateral** through arbitragurs. Every market has its own AMM (created from a blueprint) **containing the collateral and borrowable asset**.

When creating a new loan, the Controller evenly **deposits the provided collateral by the user across a specified number of bands within the AMM**, each representing a range of collateral prices, and mints stablecoins if it is a minting market or transfers the borrowed assets if it is a lending maket to the user. Withdrawing collateral is also done through the Controller.

!!!info "In-Depth Overview"
    For a more technical and detailed overview of the entire system, see here: https://github.com/chanhosuh/curvefi-math/blob/master/LLAMMA.ipynb


---


**The main concept behind LLAMMA:**

*"Conceptually, the main idea is that LLAMMA always skews the prices like a "taker", someone who pays for immediacy of trade execution by "crossing the spread", i.e. buys above the market mid and sells below the market mid. Of course, a smart contract cannot execute anything without an EOA triggering a transaction, so the way this works in practice is that LLAMMA sets the prices like a taker and relies upon arbitrageurs to "arb" the price back to market (oracle price)."*[^1]

[^1]: https://github.com/chanhosuh/curvefi-math/blob/master/LLAMMA.ipynb

In simple words: LLAMMA **automatically converts collateral into crvUSD as the collateral price decreases, and vice versa, converts crvUSD back into the collateral asset when prices rise.** Due to this, there is no instant hard-liquidation when certain collateral prices are reached, but during the soft-liquidation process, losses occur and consequently decrease the health of a loan. When the **health drops below 0%,** the user is eligible for **hard-liquidation**. The user's collateral can be sold off, and the position will be closed (just as in regular liquidations).

!!!warning "Disclaimer: Losses in Soft-Liquidation"
    When a position is in soft-liquidation, losses occur due to the "rebalancing" of collateral and borrowed asset within the bands of the AMM on the way down (converting collateral for borrowed asset) and on the way up (converting borrowed asset back to the collateral asset). These losses cannot numerically be quantified and are heavily dependent on the number of bands used for the loan and generally how efficient the arbitrage was.



---


**LTV Ratio**

The loan-to-value (LTV) ratio depends on the number of bands `N` and the parameter `A`. The higher the number of bands, the lower the LTV. More on bands [here](#bands).

$$LTV = \text{100%} - \text{loan_discount} - 100 * \frac{N}{2*A}$$

The loan discount is the percentage used to discount the collateral for calculating the maximum borrowable amount when creating a loan.

!!!example "LTV"
    Example: At the time of writing, the [wBTC market](https://crvusd.curve.fi/#/ethereum/markets/wbtc/create) has a loan discount of 9% and a A value of 100.  
        
    $\text{LTV (4 bands)} = \text{100%} - \text{9%} - 100 * \frac{4}{2*100} = \text{89%}$

    $\text{LTV (50 bands)} = \text{100%} - \text{9%} - 100 * \frac{50}{2*100} = \text{66%}$

---


**Liquidation Range**

*The start of the liquidation range is also determined by the LTV:*

$$\text{starting_price} = \frac{debt}{collateral * LTV}$$

To obtain the acutal the starting price value in dollars, one must multiply the value by the `price_oracle` at the time when creating the loan.


---


| Glossary             | Description |
| -------------------- | ----------- |
| `ticks`, `bands`     | Price ranges where liquidity is deposited. |
| `x`                  | Coin which is being borrowed, typically a stablecoin. |
| `y`                  | Collateral coin. |
| `A`                  | Amplification, the measure of how concentrated the tick is. |
| `rate`               | Interest rate. |
| `rate_mul`           | Rate multiplier, 1 + integral(rate * dt). |
| `active_band`        | Current band. Other bands are either in one or the other coin, but not both. |
| `min_band`           | Bands below this are definitely empty. |
| `max_band`           | Bands above this are definitely empty. |
| `bands_x[n]`, `bands_y[n]` | Amounts of coin x or y deposited in band n. |
| `user_shares[user,n] / total_shares[n]` | Fraction of the n'th band owned by a user. |
| `p_oracle`           | External oracle price (can be from another AMM). |
| `p (as in get_p)`    | Current price of AMM. It depends not only on the balances (x,y) in the band and active_band, but also on p_oracle. |
| `p_current_up`, `p_current_down` | The value of p at constant p_oracle when y=0 or x=0 respectively for the band n. |
| `p_oracle_up`, `p_oracle_down` | Edges of the band when p=p_oracle (steady state), happen when x=0 or y=0 respectively, for band n. |


---


## **Depositing and Withdrawing Collateral**

Depositing and withdrawing collateral can only be done by the `admin` of the AMM, the Controller.

- Collateral is put into bands by calling `deposit_range()` whenever someone creates a new loan or adds collateral to the existing position. 
- Collateral is removed by calling `withdraw()`.


### `deposit_range`
!!! description "`AMM.deposit_range(user: address, amount: uint256, n1: int256, n2: int256):`"

    !!!guard "Guarded Method" 
        This function is only callable by the `admin` of the contract, which is the Controller.

    Function to deposit collateral `amount` for `user` in the range of bands between `n1` and `n2`. 

    Emits: `Deposit`

    | Input    | Type      | Description                       |
    | -------- | --------- | --------------------------------- |
    | `user`   | `address` | User address.                     |
    | `amount` | `uint256` | Amount of collateral to deposit.  |
    | `n1`     | `int256`  | Lower band in the deposit range.  |
    | `n2`     | `int256`  | Upper band in the deposit range.  |

    ??? quote "Source code"

        ```vyper 
        event Deposit:
            provider: indexed(address)
            amount: uint256
            n1: int256
            n2: int256

        @external
        @nonreentrant('lock')
        def deposit_range(user: address, amount: uint256, n1: int256, n2: int256):
            """
            @notice Deposit for a user in a range of bands. Only admin contract (Controller) can do it
            @param user User address
            @param amount Amount of collateral to deposit
            @param n1 Lower band in the deposit range
            @param n2 Upper band in the deposit range
            """
            assert msg.sender == self.admin

            user_shares: DynArray[uint256, MAX_TICKS_UINT] = []
            collateral_shares: DynArray[uint256, MAX_TICKS_UINT] = []

            n0: int256 = self.active_band

            # We assume that n1,n2 area already sorted (and they are in Controller)
            assert n2 < 2**127
            assert n1 > -2**127

            n_bands: uint256 = unsafe_add(convert(unsafe_sub(n2, n1), uint256), 1)
            assert n_bands <= MAX_TICKS_UINT

            y_per_band: uint256 = unsafe_div(amount * COLLATERAL_PRECISION, n_bands)
            assert y_per_band > 100, "Amount too low"

            assert self.user_shares[user].ticks[0] == 0  # dev: User must have no liquidity
            self.user_shares[user].ns = unsafe_add(n1, unsafe_mul(n2, 2**128))

            lm: LMGauge = self.liquidity_mining_callback

            # Autoskip bands if we can
            for i in range(MAX_SKIP_TICKS + 1):
                if n1 > n0:
                    if i != 0:
                        self.active_band = n0
                    break
                assert self.bands_x[n0] == 0 and i < MAX_SKIP_TICKS, "Deposit below current band"
                n0 -= 1

            for i in range(MAX_TICKS):
                band: int256 = unsafe_add(n1, i)
                if band > n2:
                    break

                assert self.bands_x[band] == 0, "Band not empty"
                y: uint256 = y_per_band
                if i == 0:
                    y = amount * COLLATERAL_PRECISION - y * unsafe_sub(n_bands, 1)

                total_y: uint256 = self.bands_y[band]

                # Total / user share
                s: uint256 = self.total_shares[band]
                ds: uint256 = unsafe_div((s + DEAD_SHARES) * y, total_y + 1)
                assert ds > 0, "Amount too low"
                user_shares.append(ds)
                s += ds
                assert s <= 2**128 - 1
                self.total_shares[band] = s

                total_y += y
                self.bands_y[band] = total_y

                if lm.address != empty(address):
                    # If initial s == 0 - s becomes equal to y which is > 100 => nonzero
                    collateral_shares.append(unsafe_div(total_y * 10**18, s))

            self.min_band = min(self.min_band, n1)
            self.max_band = max(self.max_band, n2)

            self.save_user_shares(user, user_shares)

            log Deposit(user, amount, n1, n2)

            if lm.address != empty(address):
                lm.callback_collateral_shares(n1, collateral_shares)
                lm.callback_user_shares(user, n1, user_shares)
        ```


### `withdraw`
!!! description "`AMM.withdraw(user: address, frac: uint256) -> uint256[2]:`"

    !!!guard "Guarded Method" 
        This function is only callable by the `admin` of the contract, which is the Controller.

    Function to withdraw liquidity for `user`.

    Emits: `Withdraw`

    | Input      | Type       | Description |
    | ---------- | ---------- | ----------- |
    | `user`     |  `address` | User address. |
    | `frac`     |  `uint256` | Fraction to withdraw (1e18 = 100%). |

    ??? quote "Source code"

        ```vyper 
        event Withdraw:
            provider: indexed(address)
            amount_borrowed: uint256
            amount_collateral: uint256

        @external
        @nonreentrant('lock')
        def withdraw(user: address, frac: uint256) -> uint256[2]:
            """
            @notice Withdraw liquidity for the user. Only admin contract can do it
            @param user User who owns liquidity
            @param frac Fraction to withdraw (1e18 being 100%)
            @return Amount of [stablecoins, collateral] withdrawn
            """
            assert msg.sender == self.admin
            assert frac <= 10**18

            lm: LMGauge = self.liquidity_mining_callback

            ns: int256[2] = self._read_user_tick_numbers(user)
            n: int256 = ns[0]
            user_shares: DynArray[uint256, MAX_TICKS_UINT] = self._read_user_ticks(user, ns)
            assert user_shares[0] > 0, "No deposits"

            total_x: uint256 = 0
            total_y: uint256 = 0
            min_band: int256 = self.min_band
            old_min_band: int256 = min_band
            old_max_band: int256 = self.max_band
            max_band: int256 = n - 1

            for i in range(MAX_TICKS):
                x: uint256 = self.bands_x[n]
                y: uint256 = self.bands_y[n]
                ds: uint256 = unsafe_div(frac * user_shares[i], 10**18)
                user_shares[i] = unsafe_sub(user_shares[i], ds)  # Can ONLY zero out when frac == 10**18
                s: uint256 = self.total_shares[n]
                new_shares: uint256 = s - ds
                self.total_shares[n] = new_shares
                s += DEAD_SHARES  # after this s is guaranteed to be bigger than 0
                dx: uint256 = unsafe_div((x + 1) * ds, s)
                dy: uint256 = unsafe_div((y + 1) * ds, s)

                x -= dx
                y -= dy

                # If withdrawal is the last one - transfer dust to admin fees
                if new_shares == 0:
                    if x > 0:
                        self.admin_fees_x += unsafe_div(x, BORROWED_PRECISION)
                    if y > 0:
                        self.admin_fees_y += unsafe_div(y, COLLATERAL_PRECISION)
                    x = 0
                    y = 0

                if n == min_band:
                    if x == 0:
                        if y == 0:
                            min_band += 1
                if x > 0 or y > 0:
                    max_band = n
                self.bands_x[n] = x
                self.bands_y[n] = y
                total_x += dx
                total_y += dy

                if n == ns[1]:
                    break
                else:
                    n = unsafe_add(n, 1)

            # Empty the ticks
            if frac == 10**18:
                self.user_shares[user].ticks[0] = 0
            else:
                self.save_user_shares(user, user_shares)

            if old_min_band != min_band:
                self.min_band = min_band
            if old_max_band <= ns[1]:
                self.max_band = max_band

            total_x = unsafe_div(total_x, BORROWED_PRECISION)
            total_y = unsafe_div(total_y, COLLATERAL_PRECISION)
            log Withdraw(user, total_x, total_y)

            if lm.address != empty(address):
                lm.callback_collateral_shares(0, [])  # collateral/shares ratio is unchanged
                lm.callback_user_shares(user, ns[0], user_shares)

            return [total_x, total_y]
        ```


## **Exchange Methods**

The AMM can be used to exchange tokens, just like in any other AMM. This is necessary, as positions are arbitraged by trades within the AMM.


### `exchange`
!!! description "`AMM.exchange(i: uint256, j: uint256, in_amount: uint256, min_amount: uint256, _for: address = msg.sender) -> uint256[2]:`"

    Function to exchange `in_amount` of token `i` for a minimum amount of `_min_amount` of token `j`.

    Returns: amount of coins given in and out (`uint256`).

    Emits: `TokenExchange`

    | Input        | Type      | Description                                         |
    | ------------ | --------- | --------------------------------------------------- |
    | `i`          | `uint256` | Input coin index.                                   |
    | `j`          | `uint256` | Output coin index.                                  |
    | `in_amount`  | `uint256` | Amount of input coin to swap.                       |
    | `min_amount` | `uint256` | Minimum amount of output coin to get.               |
    | `_for`       | `address` | Address to send coins to. Defaults to `msg.sender`. |

    ??? quote "Source code"

        ```vyper 
        event TokenExchange:
            buyer: indexed(address)
            sold_id: uint256
            tokens_sold: uint256
            bought_id: uint256
            tokens_bought: uint256

        @external
        @nonreentrant('lock')
        def exchange(i: uint256, j: uint256, in_amount: uint256, min_amount: uint256, _for: address = msg.sender) -> uint256[2]:
            """
            @notice Exchanges two coins, callable by anyone
            @param i Input coin index
            @param j Output coin index
            @param in_amount Amount of input coin to swap
            @param min_amount Minimal amount to get as output
            @param _for Address to send coins to
            @return Amount of coins given in/out
            """
            return self._exchange(i, j, in_amount, min_amount, _for, True)

        @internal
        def _exchange(i: uint256, j: uint256, amount: uint256, minmax_amount: uint256, _for: address, use_in_amount: bool) -> uint256[2]:
            """
            @notice Exchanges two coins, callable by anyone
            @param i Input coin index
            @param j Output coin index
            @param amount Amount of input/output coin to swap
            @param minmax_amount Minimal/maximum amount to get as output/input
            @param _for Address to send coins to
            @param use_in_amount Whether input or output amount is specified
            @return Amount of coins given in and out
            """
            assert (i == 0 and j == 1) or (i == 1 and j == 0), "Wrong index"
            p_o: uint256[2] = self._price_oracle_w()  # Let's update the oracle even if we exchange 0
            if amount == 0:
                return [0, 0]

            lm: LMGauge = self.liquidity_mining_callback
            collateral_shares: DynArray[uint256, MAX_TICKS_UINT] = []

            in_coin: ERC20 = BORROWED_TOKEN
            out_coin: ERC20 = COLLATERAL_TOKEN
            in_precision: uint256 = BORROWED_PRECISION
            out_precision: uint256 = COLLATERAL_PRECISION
            if i == 1:
                in_precision = out_precision
                in_coin = out_coin
                out_precision = BORROWED_PRECISION
                out_coin = BORROWED_TOKEN

            out: DetailedTrade = empty(DetailedTrade)
            if use_in_amount:
                out = self.calc_swap_out(i == 0, amount * in_precision, p_o, in_precision, out_precision)
            else:
                amount_to_swap: uint256 = max_value(uint256)
                if amount < amount_to_swap:
                    amount_to_swap = amount * out_precision
                out = self.calc_swap_in(i == 0, amount_to_swap, p_o, in_precision, out_precision)
            in_amount_done: uint256 = unsafe_div(out.in_amount, in_precision)
            out_amount_done: uint256 = unsafe_div(out.out_amount, out_precision)
            if use_in_amount:
                assert out_amount_done >= minmax_amount, "Slippage"
            else:
                assert in_amount_done <= minmax_amount and (out_amount_done == amount or amount == max_value(uint256)), "Slippage"
            if out_amount_done == 0 or in_amount_done == 0:
                return [0, 0]

            out.admin_fee = unsafe_div(out.admin_fee, in_precision)
            if i == 0:
                self.admin_fees_x += out.admin_fee
            else:
                self.admin_fees_y += out.admin_fee

            n: int256 = min(out.n1, out.n2)
            n_start: int256 = n
            n_diff: int256 = abs(unsafe_sub(out.n2, out.n1))

            for k in range(MAX_TICKS):
                x: uint256 = 0
                y: uint256 = 0
                if i == 0:
                    x = out.ticks_in[k]
                    if n == out.n2:
                        y = out.last_tick_j
                else:
                    y = out.ticks_in[unsafe_sub(n_diff, k)]
                    if n == out.n2:
                        x = out.last_tick_j
                self.bands_x[n] = x
                self.bands_y[n] = y
                if lm.address != empty(address):
                    s: uint256 = 0
                    if y > 0:
                        s = unsafe_div(y * 10**18, self.total_shares[n])
                    collateral_shares.append(s)
                if k == n_diff:
                    break
                n = unsafe_add(n, 1)

            self.active_band = out.n2

            log TokenExchange(_for, i, in_amount_done, j, out_amount_done)

            if lm.address != empty(address):
                lm.callback_collateral_shares(n_start, collateral_shares)

            assert in_coin.transferFrom(msg.sender, self, in_amount_done, default_return_value=True)
            assert out_coin.transfer(_for, out_amount_done, default_return_value=True)

            return [in_amount_done, out_amount_done]

        @internal
        @view
        def calc_swap_out(pump: bool, in_amount: uint256, p_o: uint256[2], in_precision: uint256, out_precision: uint256) -> DetailedTrade:
            """
            @notice Calculate the amount which can be obtained as a result of exchange.
                    If couldn't exchange all - will also update the amount which was actually used.
                    Also returns other parameters related to state after swap.
                    This function is core to the AMM functionality.
            @param pump Indicates whether the trade buys or sells collateral
            @param in_amount Amount of token going in
            @param p_o Current oracle price and ratio (p_o, dynamic_fee)
            @return Amounts spent and given out, initial and final bands of the AMM, new
                    amounts of coins in bands in the AMM, as well as admin fee charged,
                    all in one data structure
            """
            # pump = True: borrowable (USD) in, collateral (ETH) out; going up
            # pump = False: collateral (ETH) in, borrowable (USD) out; going down
            min_band: int256 = self.min_band
            max_band: int256 = self.max_band
            out: DetailedTrade = empty(DetailedTrade)
            out.n2 = self.active_band
            p_o_up: uint256 = self._p_oracle_up(out.n2)
            x: uint256 = self.bands_x[out.n2]
            y: uint256 = self.bands_y[out.n2]

            in_amount_left: uint256 = in_amount
            fee: uint256 = max(self.fee, p_o[1])
            admin_fee: uint256 = self.admin_fee
            j: uint256 = MAX_TICKS_UINT

            for i in range(MAX_TICKS + MAX_SKIP_TICKS):
                y0: uint256 = 0
                f: uint256 = 0
                g: uint256 = 0
                Inv: uint256 = 0
                dynamic_fee: uint256 = fee

                if x > 0 or y > 0:
                    if j == MAX_TICKS_UINT:
                        out.n1 = out.n2
                        j = 0
                    y0 = self._get_y0(x, y, p_o[0], p_o_up)  # <- also checks p_o
                    f = unsafe_div(A * y0 * p_o[0] / p_o_up * p_o[0], 10**18)
                    g = unsafe_div(Aminus1 * y0 * p_o_up, p_o[0])
                    Inv = (f + x) * (g + y)
                    dynamic_fee = max(self.get_dynamic_fee(p_o[0], p_o_up), fee)

                antifee: uint256 = unsafe_div(
                    (10**18)**2,
                    unsafe_sub(10**18, min(dynamic_fee, 10**18 - 1))
                )

                if j != MAX_TICKS_UINT:
                    # Initialize
                    _tick: uint256 = y
                    if pump:
                        _tick = x
                    out.ticks_in.append(_tick)

                # Need this to break if price is too far
                p_ratio: uint256 = unsafe_div(p_o_up * 10**18, p_o[0])

                if pump:
                    if y != 0:
                        if g != 0:
                            x_dest: uint256 = (unsafe_div(Inv, g) - f) - x
                            dx: uint256 = unsafe_div(x_dest * antifee, 10**18)
                            if dx >= in_amount_left:
                                # This is the last band
                                x_dest = unsafe_div(in_amount_left * 10**18, antifee)  # LESS than in_amount_left
                                out.last_tick_j = min(Inv / (f + (x + x_dest)) - g + 1, y)  # Should be always >= 0
                                x_dest = unsafe_div(unsafe_sub(in_amount_left, x_dest) * admin_fee, 10**18)  # abs admin fee now
                                x += in_amount_left  # x is precise after this
                                # Round down the output
                                out.out_amount += y - out.last_tick_j
                                out.ticks_in[j] = x - x_dest
                                out.in_amount = in_amount
                                out.admin_fee = unsafe_add(out.admin_fee, x_dest)
                                break

                            else:
                                # We go into the next band
                                dx = max(dx, 1)  # Prevents from leaving dust in the band
                                x_dest = unsafe_div(unsafe_sub(dx, x_dest) * admin_fee, 10**18)  # abs admin fee now
                                in_amount_left -= dx
                                out.ticks_in[j] = x + dx - x_dest
                                out.in_amount += dx
                                out.out_amount += y
                                out.admin_fee = unsafe_add(out.admin_fee, x_dest)

                    if i != MAX_TICKS + MAX_SKIP_TICKS - 1:
                        if out.n2 == max_band:
                            break
                        if j == MAX_TICKS_UINT - 1:
                            break
                        if p_ratio < unsafe_div(10**36, MAX_ORACLE_DN_POW):
                            # Don't allow to be away by more than ~50 ticks
                            break
                        out.n2 += 1
                        p_o_up = unsafe_div(p_o_up * Aminus1, A)
                        x = 0
                        y = self.bands_y[out.n2]

                else:  # dump
                    if x != 0:
                        if f != 0:
                            y_dest: uint256 = (unsafe_div(Inv, f) - g) - y
                            dy: uint256 = unsafe_div(y_dest * antifee, 10**18)
                            if dy >= in_amount_left:
                                # This is the last band
                                y_dest = unsafe_div(in_amount_left * 10**18, antifee)
                                out.last_tick_j = min(Inv / (g + (y + y_dest)) - f + 1, x)
                                y_dest = unsafe_div(unsafe_sub(in_amount_left, y_dest) * admin_fee, 10**18)  # abs admin fee now
                                y += in_amount_left
                                out.out_amount += x - out.last_tick_j
                                out.ticks_in[j] = y - y_dest
                                out.in_amount = in_amount
                                out.admin_fee = unsafe_add(out.admin_fee, y_dest)
                                break

                            else:
                                # We go into the next band
                                dy = max(dy, 1)  # Prevents from leaving dust in the band
                                y_dest = unsafe_div(unsafe_sub(dy, y_dest) * admin_fee, 10**18)  # abs admin fee now
                                in_amount_left -= dy
                                out.ticks_in[j] = y + dy - y_dest
                                out.in_amount += dy
                                out.out_amount += x
                                out.admin_fee = unsafe_add(out.admin_fee, y_dest)

                    if i != MAX_TICKS + MAX_SKIP_TICKS - 1:
                        if out.n2 == min_band:
                            break
                        if j == MAX_TICKS_UINT - 1:
                            break
                        if p_ratio > MAX_ORACLE_DN_POW:
                            # Don't allow to be away by more than ~50 ticks
                            break
                        out.n2 -= 1
                        p_o_up = unsafe_div(p_o_up * A, Aminus1)
                        x = self.bands_x[out.n2]
                        y = 0

                if j != MAX_TICKS_UINT:
                    j = unsafe_add(j, 1)

            # Round up what goes in and down what goes out
            # ceil(in_amount_used/BORROWED_PRECISION) * BORROWED_PRECISION
            out.in_amount = unsafe_mul(unsafe_div(unsafe_add(out.in_amount, unsafe_sub(in_precision, 1)), in_precision), in_precision)
            out.out_amount = unsafe_mul(unsafe_div(out.out_amount, out_precision), out_precision)

            return out

        @internal
        @view
        def calc_swap_in(pump: bool, out_amount: uint256, p_o: uint256[2], in_precision: uint256, out_precision: uint256) -> DetailedTrade:
            """
            @notice Calculate the input amount required to receive the desired output amount.
                    If couldn't exchange all - will also update the amount which was actually received.
                    Also returns other parameters related to state after swap.
            @param pump Indicates whether the trade buys or sells collateral
            @param out_amount Desired amount of token going out
            @param p_o Current oracle price and antisandwich fee (p_o, dynamic_fee)
            @return Amounts required and given out, initial and final bands of the AMM, new
                    amounts of coins in bands in the AMM, as well as admin fee charged,
                    all in one data structure
            """
            # pump = True: borrowable (USD) in, collateral (ETH) out; going up
            # pump = False: collateral (ETH) in, borrowable (USD) out; going down
            min_band: int256 = self.min_band
            max_band: int256 = self.max_band
            out: DetailedTrade = empty(DetailedTrade)
            out.n2 = self.active_band
            p_o_up: uint256 = self._p_oracle_up(out.n2)
            x: uint256 = self.bands_x[out.n2]
            y: uint256 = self.bands_y[out.n2]

            out_amount_left: uint256 = out_amount
            fee: uint256 = max(self.fee, p_o[1])
            admin_fee: uint256 = self.admin_fee
            j: uint256 = MAX_TICKS_UINT

            for i in range(MAX_TICKS + MAX_SKIP_TICKS):
                y0: uint256 = 0
                f: uint256 = 0
                g: uint256 = 0
                Inv: uint256 = 0
                dynamic_fee: uint256 = fee

                if x > 0 or y > 0:
                    if j == MAX_TICKS_UINT:
                        out.n1 = out.n2
                        j = 0
                    y0 = self._get_y0(x, y, p_o[0], p_o_up)  # <- also checks p_o
                    f = unsafe_div(A * y0 * p_o[0] / p_o_up * p_o[0], 10**18)
                    g = unsafe_div(Aminus1 * y0 * p_o_up, p_o[0])
                    Inv = (f + x) * (g + y)
                    dynamic_fee = max(self.get_dynamic_fee(p_o[0], p_o_up), fee)

                antifee: uint256 = unsafe_div(
                    (10**18)**2,
                    unsafe_sub(10**18, min(dynamic_fee, 10**18 - 1))
                )

                if j != MAX_TICKS_UINT:
                    # Initialize
                    _tick: uint256 = y
                    if pump:
                        _tick = x
                    out.ticks_in.append(_tick)

                # Need this to break if price is too far
                p_ratio: uint256 = unsafe_div(p_o_up * 10**18, p_o[0])

                if pump:
                    if y != 0:
                        if g != 0:
                            if y >= out_amount_left:
                                # This is the last band
                                out.last_tick_j = unsafe_sub(y, out_amount_left)
                                x_dest: uint256 = Inv / (g + out.last_tick_j) - f - x
                                dx: uint256 = unsafe_div(x_dest * antifee, 10**18)  # MORE than x_dest
                                out.out_amount = out_amount  # We successfully found liquidity for all the out_amount
                                out.in_amount += dx
                                x_dest = unsafe_div(unsafe_sub(dx, x_dest) * admin_fee, 10**18)  # abs admin fee now
                                out.ticks_in[j] = x + dx - x_dest
                                out.admin_fee = unsafe_add(out.admin_fee, x_dest)
                                break

                            else:
                                # We go into the next band
                                x_dest: uint256 = (unsafe_div(Inv, g) - f) - x
                                dx: uint256 = max(unsafe_div(x_dest * antifee, 10**18), 1)
                                out_amount_left -= y
                                out.in_amount += dx
                                out.out_amount += y
                                x_dest = unsafe_div(unsafe_sub(dx, x_dest) * admin_fee, 10**18)  # abs admin fee now
                                out.ticks_in[j] = x + dx - x_dest
                                out.admin_fee = unsafe_add(out.admin_fee, x_dest)

                    if i != MAX_TICKS + MAX_SKIP_TICKS - 1:
                        if out.n2 == max_band:
                            break
                        if j == MAX_TICKS_UINT - 1:
                            break
                        if p_ratio < unsafe_div(10**36, MAX_ORACLE_DN_POW):
                            # Don't allow to be away by more than ~50 ticks
                            break
                        out.n2 += 1
                        p_o_up = unsafe_div(p_o_up * Aminus1, A)
                        x = 0
                        y = self.bands_y[out.n2]

                else:  # dump
                    if x != 0:
                        if f != 0:
                            if x >= out_amount_left:
                                # This is the last band
                                out.last_tick_j = unsafe_sub(x, out_amount_left)
                                y_dest: uint256 = Inv / (f + out.last_tick_j) - g - y
                                dy: uint256 = unsafe_div(y_dest * antifee, 10**18)  # MORE than y_dest
                                out.out_amount = out_amount
                                out.in_amount += dy
                                y_dest = unsafe_div(unsafe_sub(dy, y_dest) * admin_fee, 10**18)  # abs admin fee now
                                out.ticks_in[j] = y + dy - y_dest
                                out.admin_fee = unsafe_add(out.admin_fee, y_dest)
                                break

                            else:
                                # We go into the next band
                                y_dest: uint256 = (unsafe_div(Inv, f) - g) - y
                                dy: uint256 = max(unsafe_div(y_dest * antifee, 10**18), 1)
                                out_amount_left -= x
                                out.in_amount += dy
                                out.out_amount += x
                                y_dest = unsafe_div(unsafe_sub(dy, y_dest) * admin_fee, 10**18)  # abs admin fee now
                                out.ticks_in[j] = y + dy - y_dest
                                out.admin_fee = unsafe_add(out.admin_fee, y_dest)

                    if i != MAX_TICKS + MAX_SKIP_TICKS - 1:
                        if out.n2 == min_band:
                            break
                        if j == MAX_TICKS_UINT - 1:
                            break
                        if p_ratio > MAX_ORACLE_DN_POW:
                            # Don't allow to be away by more than ~50 ticks
                            break
                        out.n2 -= 1
                        p_o_up = unsafe_div(p_o_up * A, Aminus1)
                        x = self.bands_x[out.n2]
                        y = 0

                if j != MAX_TICKS_UINT:
                    j = unsafe_add(j, 1)

            # Round up what goes in and down what goes out
            # ceil(in_amount_used/BORROWED_PRECISION) * BORROWED_PRECISION
            out.in_amount = unsafe_mul(unsafe_div(unsafe_add(out.in_amount, unsafe_sub(in_precision, 1)), in_precision), in_precision)
            out.out_amount = unsafe_mul(unsafe_div(out.out_amount, out_precision), out_precision)

            return out
        ```

    === "Example"

        ```shell
        >>> tbtc.balanceOf(trader)
        339653435930000000000
        >>> crvusd.balanceOf(trader)
        0
        >>> AMM.exchange(1, 0, 10**18, 0, trader)
        >>> tbtc.balanceOf(trader)
        338653435930000000000
        >>> crvusd.balanceOf(trader)
        41483257798652907646746
        ```


### `exchange_dy`
!!! description "`AMM.exchange_dy(i: uint256, j: uint256, out_amount: uint256, max_amount: uint256, _for: address = msg.sender) -> uint256[2]:`"

    Function to exchange a maximum amount of `max_amount` of input token `j` for a total of `out_amount` of output token `j`.

    Returns: amount of coins given: in and out (`uint256`).

    Emits: `TokenExchange`

    | Input        | Type      | Description                                          |
    | ------------ | --------- | ---------------------------------------------------- |
    | `i`          | `uint256` | Input coin index.                                    |
    | `j`          | `uint256` | Output coin index.                                   |
    | `in_amount`  | `uint256` | Amount of input coin to swap.                        |
    | `min_amount` | `uint256` | Minimum amount of output coin to get.                |
    | `_for`       | `address` | Address to send coins to (defaults to `msg.sender`). |

    ??? quote "Source code"

        ```vyper
        event TokenExchange:
            buyer: indexed(address)
            sold_id: uint256
            tokens_sold: uint256
            bought_id: uint256
            tokens_bought: uint256

        @external
        @nonreentrant('lock')
        def exchange_dy(i: uint256, j: uint256, out_amount: uint256, max_amount: uint256, _for: address = msg.sender) -> uint256[2]:
            """
            @notice Exchanges two coins, callable by anyone
            @param i Input coin index
            @param j Output coin index
            @param out_amount Desired amount of output coin to receive
            @param max_amount Maximum amount to spend (revert if more)
            @param _for Address to send coins to
            @return Amount of coins given in/out
            """
            return self._exchange(i, j, out_amount, max_amount, _for, False)

        @internal
        def _exchange(i: uint256, j: uint256, amount: uint256, minmax_amount: uint256, _for: address, use_in_amount: bool) -> uint256[2]:
            """
            @notice Exchanges two coins, callable by anyone
            @param i Input coin index
            @param j Output coin index
            @param amount Amount of input/output coin to swap
            @param minmax_amount Minimal/maximum amount to get as output/input
            @param _for Address to send coins to
            @param use_in_amount Whether input or output amount is specified
            @return Amount of coins given in and out
            """
            assert (i == 0 and j == 1) or (i == 1 and j == 0), "Wrong index"
            p_o: uint256[2] = self._price_oracle_w()  # Let's update the oracle even if we exchange 0
            if amount == 0:
                return [0, 0]

            lm: LMGauge = self.liquidity_mining_callback
            collateral_shares: DynArray[uint256, MAX_TICKS_UINT] = []

            in_coin: ERC20 = BORROWED_TOKEN
            out_coin: ERC20 = COLLATERAL_TOKEN
            in_precision: uint256 = BORROWED_PRECISION
            out_precision: uint256 = COLLATERAL_PRECISION
            if i == 1:
                in_precision = out_precision
                in_coin = out_coin
                out_precision = BORROWED_PRECISION
                out_coin = BORROWED_TOKEN

            out: DetailedTrade = empty(DetailedTrade)
            if use_in_amount:
                out = self.calc_swap_out(i == 0, amount * in_precision, p_o, in_precision, out_precision)
            else:
                amount_to_swap: uint256 = max_value(uint256)
                if amount < amount_to_swap:
                    amount_to_swap = amount * out_precision
                out = self.calc_swap_in(i == 0, amount_to_swap, p_o, in_precision, out_precision)
            in_amount_done: uint256 = unsafe_div(out.in_amount, in_precision)
            out_amount_done: uint256 = unsafe_div(out.out_amount, out_precision)
            if use_in_amount:
                assert out_amount_done >= minmax_amount, "Slippage"
            else:
                assert in_amount_done <= minmax_amount and (out_amount_done == amount or amount == max_value(uint256)), "Slippage"
            if out_amount_done == 0 or in_amount_done == 0:
                return [0, 0]

            out.admin_fee = unsafe_div(out.admin_fee, in_precision)
            if i == 0:
                self.admin_fees_x += out.admin_fee
            else:
                self.admin_fees_y += out.admin_fee

            n: int256 = min(out.n1, out.n2)
            n_start: int256 = n
            n_diff: int256 = abs(unsafe_sub(out.n2, out.n1))

            for k in range(MAX_TICKS):
                x: uint256 = 0
                y: uint256 = 0
                if i == 0:
                    x = out.ticks_in[k]
                    if n == out.n2:
                        y = out.last_tick_j
                else:
                    y = out.ticks_in[unsafe_sub(n_diff, k)]
                    if n == out.n2:
                        x = out.last_tick_j
                self.bands_x[n] = x
                self.bands_y[n] = y
                if lm.address != empty(address):
                    s: uint256 = 0
                    if y > 0:
                        s = unsafe_div(y * 10**18, self.total_shares[n])
                    collateral_shares.append(s)
                if k == n_diff:
                    break
                n = unsafe_add(n, 1)

            self.active_band = out.n2

            log TokenExchange(_for, i, in_amount_done, j, out_amount_done)

            if lm.address != empty(address):
                lm.callback_collateral_shares(n_start, collateral_shares)

            assert in_coin.transferFrom(msg.sender, self, in_amount_done, default_return_value=True)
            assert out_coin.transfer(_for, out_amount_done, default_return_value=True)

            return [in_amount_done, out_amount_done]

        @internal
        @view
        def calc_swap_out(pump: bool, in_amount: uint256, p_o: uint256[2], in_precision: uint256, out_precision: uint256) -> DetailedTrade:
            """
            @notice Calculate the amount which can be obtained as a result of exchange.
                    If couldn't exchange all - will also update the amount which was actually used.
                    Also returns other parameters related to state after swap.
                    This function is core to the AMM functionality.
            @param pump Indicates whether the trade buys or sells collateral
            @param in_amount Amount of token going in
            @param p_o Current oracle price and ratio (p_o, dynamic_fee)
            @return Amounts spent and given out, initial and final bands of the AMM, new
                    amounts of coins in bands in the AMM, as well as admin fee charged,
                    all in one data structure
            """
            # pump = True: borrowable (USD) in, collateral (ETH) out; going up
            # pump = False: collateral (ETH) in, borrowable (USD) out; going down
            min_band: int256 = self.min_band
            max_band: int256 = self.max_band
            out: DetailedTrade = empty(DetailedTrade)
            out.n2 = self.active_band
            p_o_up: uint256 = self._p_oracle_up(out.n2)
            x: uint256 = self.bands_x[out.n2]
            y: uint256 = self.bands_y[out.n2]

            in_amount_left: uint256 = in_amount
            fee: uint256 = max(self.fee, p_o[1])
            admin_fee: uint256 = self.admin_fee
            j: uint256 = MAX_TICKS_UINT

            for i in range(MAX_TICKS + MAX_SKIP_TICKS):
                y0: uint256 = 0
                f: uint256 = 0
                g: uint256 = 0
                Inv: uint256 = 0
                dynamic_fee: uint256 = fee

                if x > 0 or y > 0:
                    if j == MAX_TICKS_UINT:
                        out.n1 = out.n2
                        j = 0
                    y0 = self._get_y0(x, y, p_o[0], p_o_up)  # <- also checks p_o
                    f = unsafe_div(A * y0 * p_o[0] / p_o_up * p_o[0], 10**18)
                    g = unsafe_div(Aminus1 * y0 * p_o_up, p_o[0])
                    Inv = (f + x) * (g + y)
                    dynamic_fee = max(self.get_dynamic_fee(p_o[0], p_o_up), fee)

                antifee: uint256 = unsafe_div(
                    (10**18)**2,
                    unsafe_sub(10**18, min(dynamic_fee, 10**18 - 1))
                )

                if j != MAX_TICKS_UINT:
                    # Initialize
                    _tick: uint256 = y
                    if pump:
                        _tick = x
                    out.ticks_in.append(_tick)

                # Need this to break if price is too far
                p_ratio: uint256 = unsafe_div(p_o_up * 10**18, p_o[0])

                if pump:
                    if y != 0:
                        if g != 0:
                            x_dest: uint256 = (unsafe_div(Inv, g) - f) - x
                            dx: uint256 = unsafe_div(x_dest * antifee, 10**18)
                            if dx >= in_amount_left:
                                # This is the last band
                                x_dest = unsafe_div(in_amount_left * 10**18, antifee)  # LESS than in_amount_left
                                out.last_tick_j = min(Inv / (f + (x + x_dest)) - g + 1, y)  # Should be always >= 0
                                x_dest = unsafe_div(unsafe_sub(in_amount_left, x_dest) * admin_fee, 10**18)  # abs admin fee now
                                x += in_amount_left  # x is precise after this
                                # Round down the output
                                out.out_amount += y - out.last_tick_j
                                out.ticks_in[j] = x - x_dest
                                out.in_amount = in_amount
                                out.admin_fee = unsafe_add(out.admin_fee, x_dest)
                                break

                            else:
                                # We go into the next band
                                dx = max(dx, 1)  # Prevents from leaving dust in the band
                                x_dest = unsafe_div(unsafe_sub(dx, x_dest) * admin_fee, 10**18)  # abs admin fee now
                                in_amount_left -= dx
                                out.ticks_in[j] = x + dx - x_dest
                                out.in_amount += dx
                                out.out_amount += y
                                out.admin_fee = unsafe_add(out.admin_fee, x_dest)

                    if i != MAX_TICKS + MAX_SKIP_TICKS - 1:
                        if out.n2 == max_band:
                            break
                        if j == MAX_TICKS_UINT - 1:
                            break
                        if p_ratio < unsafe_div(10**36, MAX_ORACLE_DN_POW):
                            # Don't allow to be away by more than ~50 ticks
                            break
                        out.n2 += 1
                        p_o_up = unsafe_div(p_o_up * Aminus1, A)
                        x = 0
                        y = self.bands_y[out.n2]

                else:  # dump
                    if x != 0:
                        if f != 0:
                            y_dest: uint256 = (unsafe_div(Inv, f) - g) - y
                            dy: uint256 = unsafe_div(y_dest * antifee, 10**18)
                            if dy >= in_amount_left:
                                # This is the last band
                                y_dest = unsafe_div(in_amount_left * 10**18, antifee)
                                out.last_tick_j = min(Inv / (g + (y + y_dest)) - f + 1, x)
                                y_dest = unsafe_div(unsafe_sub(in_amount_left, y_dest) * admin_fee, 10**18)  # abs admin fee now
                                y += in_amount_left
                                out.out_amount += x - out.last_tick_j
                                out.ticks_in[j] = y - y_dest
                                out.in_amount = in_amount
                                out.admin_fee = unsafe_add(out.admin_fee, y_dest)
                                break

                            else:
                                # We go into the next band
                                dy = max(dy, 1)  # Prevents from leaving dust in the band
                                y_dest = unsafe_div(unsafe_sub(dy, y_dest) * admin_fee, 10**18)  # abs admin fee now
                                in_amount_left -= dy
                                out.ticks_in[j] = y + dy - y_dest
                                out.in_amount += dy
                                out.out_amount += x
                                out.admin_fee = unsafe_add(out.admin_fee, y_dest)

                    if i != MAX_TICKS + MAX_SKIP_TICKS - 1:
                        if out.n2 == min_band:
                            break
                        if j == MAX_TICKS_UINT - 1:
                            break
                        if p_ratio > MAX_ORACLE_DN_POW:
                            # Don't allow to be away by more than ~50 ticks
                            break
                        out.n2 -= 1
                        p_o_up = unsafe_div(p_o_up * A, Aminus1)
                        x = self.bands_x[out.n2]
                        y = 0

                if j != MAX_TICKS_UINT:
                    j = unsafe_add(j, 1)

            # Round up what goes in and down what goes out
            # ceil(in_amount_used/BORROWED_PRECISION) * BORROWED_PRECISION
            out.in_amount = unsafe_mul(unsafe_div(unsafe_add(out.in_amount, unsafe_sub(in_precision, 1)), in_precision), in_precision)
            out.out_amount = unsafe_mul(unsafe_div(out.out_amount, out_precision), out_precision)

            return out

        @internal
        @view
        def calc_swap_in(pump: bool, out_amount: uint256, p_o: uint256[2], in_precision: uint256, out_precision: uint256) -> DetailedTrade:
            """
            @notice Calculate the input amount required to receive the desired output amount.
                    If couldn't exchange all - will also update the amount which was actually received.
                    Also returns other parameters related to state after swap.
            @param pump Indicates whether the trade buys or sells collateral
            @param out_amount Desired amount of token going out
            @param p_o Current oracle price and antisandwich fee (p_o, dynamic_fee)
            @return Amounts required and given out, initial and final bands of the AMM, new
                    amounts of coins in bands in the AMM, as well as admin fee charged,
                    all in one data structure
            """
            # pump = True: borrowable (USD) in, collateral (ETH) out; going up
            # pump = False: collateral (ETH) in, borrowable (USD) out; going down
            min_band: int256 = self.min_band
            max_band: int256 = self.max_band
            out: DetailedTrade = empty(DetailedTrade)
            out.n2 = self.active_band
            p_o_up: uint256 = self._p_oracle_up(out.n2)
            x: uint256 = self.bands_x[out.n2]
            y: uint256 = self.bands_y[out.n2]

            out_amount_left: uint256 = out_amount
            fee: uint256 = max(self.fee, p_o[1])
            admin_fee: uint256 = self.admin_fee
            j: uint256 = MAX_TICKS_UINT

            for i in range(MAX_TICKS + MAX_SKIP_TICKS):
                y0: uint256 = 0
                f: uint256 = 0
                g: uint256 = 0
                Inv: uint256 = 0
                dynamic_fee: uint256 = fee

                if x > 0 or y > 0:
                    if j == MAX_TICKS_UINT:
                        out.n1 = out.n2
                        j = 0
                    y0 = self._get_y0(x, y, p_o[0], p_o_up)  # <- also checks p_o
                    f = unsafe_div(A * y0 * p_o[0] / p_o_up * p_o[0], 10**18)
                    g = unsafe_div(Aminus1 * y0 * p_o_up, p_o[0])
                    Inv = (f + x) * (g + y)
                    dynamic_fee = max(self.get_dynamic_fee(p_o[0], p_o_up), fee)

                antifee: uint256 = unsafe_div(
                    (10**18)**2,
                    unsafe_sub(10**18, min(dynamic_fee, 10**18 - 1))
                )

                if j != MAX_TICKS_UINT:
                    # Initialize
                    _tick: uint256 = y
                    if pump:
                        _tick = x
                    out.ticks_in.append(_tick)

                # Need this to break if price is too far
                p_ratio: uint256 = unsafe_div(p_o_up * 10**18, p_o[0])

                if pump:
                    if y != 0:
                        if g != 0:
                            if y >= out_amount_left:
                                # This is the last band
                                out.last_tick_j = unsafe_sub(y, out_amount_left)
                                x_dest: uint256 = Inv / (g + out.last_tick_j) - f - x
                                dx: uint256 = unsafe_div(x_dest * antifee, 10**18)  # MORE than x_dest
                                out.out_amount = out_amount  # We successfully found liquidity for all the out_amount
                                out.in_amount += dx
                                x_dest = unsafe_div(unsafe_sub(dx, x_dest) * admin_fee, 10**18)  # abs admin fee now
                                out.ticks_in[j] = x + dx - x_dest
                                out.admin_fee = unsafe_add(out.admin_fee, x_dest)
                                break

                            else:
                                # We go into the next band
                                x_dest: uint256 = (unsafe_div(Inv, g) - f) - x
                                dx: uint256 = max(unsafe_div(x_dest * antifee, 10**18), 1)
                                out_amount_left -= y
                                out.in_amount += dx
                                out.out_amount += y
                                x_dest = unsafe_div(unsafe_sub(dx, x_dest) * admin_fee, 10**18)  # abs admin fee now
                                out.ticks_in[j] = x + dx - x_dest
                                out.admin_fee = unsafe_add(out.admin_fee, x_dest)

                    if i != MAX_TICKS + MAX_SKIP_TICKS - 1:
                        if out.n2 == max_band:
                            break
                        if j == MAX_TICKS_UINT - 1:
                            break
                        if p_ratio < unsafe_div(10**36, MAX_ORACLE_DN_POW):
                            # Don't allow to be away by more than ~50 ticks
                            break
                        out.n2 += 1
                        p_o_up = unsafe_div(p_o_up * Aminus1, A)
                        x = 0
                        y = self.bands_y[out.n2]

                else:  # dump
                    if x != 0:
                        if f != 0:
                            if x >= out_amount_left:
                                # This is the last band
                                out.last_tick_j = unsafe_sub(x, out_amount_left)
                                y_dest: uint256 = Inv / (f + out.last_tick_j) - g - y
                                dy: uint256 = unsafe_div(y_dest * antifee, 10**18)  # MORE than y_dest
                                out.out_amount = out_amount
                                out.in_amount += dy
                                y_dest = unsafe_div(unsafe_sub(dy, y_dest) * admin_fee, 10**18)  # abs admin fee now
                                out.ticks_in[j] = y + dy - y_dest
                                out.admin_fee = unsafe_add(out.admin_fee, y_dest)
                                break

                            else:
                                # We go into the next band
                                y_dest: uint256 = (unsafe_div(Inv, f) - g) - y
                                dy: uint256 = max(unsafe_div(y_dest * antifee, 10**18), 1)
                                out_amount_left -= x
                                out.in_amount += dy
                                out.out_amount += x
                                y_dest = unsafe_div(unsafe_sub(dy, y_dest) * admin_fee, 10**18)  # abs admin fee now
                                out.ticks_in[j] = y + dy - y_dest
                                out.admin_fee = unsafe_add(out.admin_fee, y_dest)

                    if i != MAX_TICKS + MAX_SKIP_TICKS - 1:
                        if out.n2 == min_band:
                            break
                        if j == MAX_TICKS_UINT - 1:
                            break
                        if p_ratio > MAX_ORACLE_DN_POW:
                            # Don't allow to be away by more than ~50 ticks
                            break
                        out.n2 -= 1
                        p_o_up = unsafe_div(p_o_up * A, Aminus1)
                        x = self.bands_x[out.n2]
                        y = 0

                if j != MAX_TICKS_UINT:
                    j = unsafe_add(j, 1)

            # Round up what goes in and down what goes out
            # ceil(in_amount_used/BORROWED_PRECISION) * BORROWED_PRECISION
            out.in_amount = unsafe_mul(unsafe_div(unsafe_add(out.in_amount, unsafe_sub(in_precision, 1)), in_precision), in_precision)
            out.out_amount = unsafe_mul(unsafe_div(out.out_amount, out_precision), out_precision)

            return out
        ```

    === "Example"

        ```shell
        >>> AMM.exchange_dy(1, 0, 41483257798652907646746, 0. trader)
        1000000000000000000
        ```


### `get_dy`
!!! description "`AMM.get_dy(i: uint256, j: uint256, in_amount: uint256) -> uint256:`"

    Function to calculate the amount of output tokens `j` to receive when exchanging `in_amount` of input token `i`. 

    Returns: out amount (`uint256`).

    | Input       | Type      | Description                    |
    | ----------- | --------- | ------------------------------ |
    | `i`         | `uint256` | Input coin index.              |
    | `j`         | `uint256` | Output coin index.             |
    | `in_amount` | `uint256` | Amount of input coin to swap.  |

    ??? quote "Source code"

        ```vyper 
        struct DetailedTrade:
            in_amount: uint256
            out_amount: uint256
            n1: int256
            n2: int256
            ticks_in: DynArray[uint256, MAX_TICKS_UINT]
            last_tick_j: uint256
            admin_fee: uint256

        @external
        @view
        @nonreentrant('lock')
        def get_dy(i: uint256, j: uint256, in_amount: uint256) -> uint256:
            """
            @notice Method to use to calculate out amount
            @param i Input coin index
            @param j Output coin index
            @param in_amount Amount of input coin to swap
            @return Amount of coin j to give out
            """
            return self._get_dxdy(i, j, in_amount, True).out_amount

        @internal
        @view
        def _get_dxdy(i: uint256, j: uint256, amount: uint256, is_in: bool) -> DetailedTrade:
            """
            @notice Method to use to calculate out amount and spent in amount
            @param i Input coin index
            @param j Output coin index
            @param amount Amount of input or output coin to swap
            @param is_in Whether IN our OUT amount is known
            @return DetailedTrade with all swap results
            """
            # i = 0: borrowable (USD) in, collateral (ETH) out; going up
            # i = 1: collateral (ETH) in, borrowable (USD) out; going down
            assert (i == 0 and j == 1) or (i == 1 and j == 0), "Wrong index"
            out: DetailedTrade = empty(DetailedTrade)
            if amount == 0:
                return out
            in_precision: uint256 = COLLATERAL_PRECISION
            out_precision: uint256 = BORROWED_PRECISION
            if i == 0:
                in_precision = BORROWED_PRECISION
                out_precision = COLLATERAL_PRECISION
            p_o: uint256[2] = self._price_oracle_ro()
            if is_in:
                out = self.calc_swap_out(i == 0, amount * in_precision, p_o, in_precision, out_precision)
            else:
                out = self.calc_swap_in(i == 0, amount * out_precision, p_o, in_precision, out_precision)
            out.in_amount = unsafe_div(out.in_amount, in_precision)
            out.out_amount = unsafe_div(out.out_amount, out_precision)
            return out
        ```

    === "Example"

        ```shell
        >>> AMM.get_dy(1, 0, 10**18)  -> swapping 1 tbtc (`i`) for crvusd (`j`).
        41443710620713878872934
        ```


### `get_dxdy`
!!! description "`AMM.get_dxdy(i: uint256, j: uint256, in_amount: uint256) -> (uint256, uint256):`"

    Function to calculate `out_amount` and `in_amount` spent.

    Returns: in and out amount (`uint256`).

    | Input       | Type      | Description                   |
    | ----------- | --------- | ----------------------------- |
    | `i`         | `uint256` | Input coin index.                   |
    | `j`         | `uint256` | Output coin index.                  |
    | `in_amount` | `uint256` | Amount of input coin to swap. |

    ??? quote "Source code"

        ```vyper 
        struct DetailedTrade:
            in_amount: uint256
            out_amount: uint256
            n1: int256
            n2: int256
            ticks_in: DynArray[uint256, MAX_TICKS_UINT]
            last_tick_j: uint256
            admin_fee: uint256

        @external
        @view
        @nonreentrant('lock')
        def get_dxdy(i: uint256, j: uint256, in_amount: uint256) -> (uint256, uint256):
            """
            @notice Method to use to calculate out amount and spent in amount
            @param i Input coin index
            @param j Output coin index
            @param in_amount Amount of input coin to swap
            @return A tuple with in_amount used and out_amount returned
            """
            out: DetailedTrade = self._get_dxdy(i, j, in_amount, True)
            return (out.in_amount, out.out_amount)

        @internal
        @view
        def _get_dxdy(i: uint256, j: uint256, amount: uint256, is_in: bool) -> DetailedTrade:
            """
            @notice Method to use to calculate out amount and spent in amount
            @param i Input coin index
            @param j Output coin index
            @param amount Amount of input or output coin to swap
            @param is_in Whether IN our OUT amount is known
            @return DetailedTrade with all swap results
            """
            # i = 0: borrowable (USD) in, collateral (ETH) out; going up
            # i = 1: collateral (ETH) in, borrowable (USD) out; going down
            assert (i == 0 and j == 1) or (i == 1 and j == 0), "Wrong index"
            out: DetailedTrade = empty(DetailedTrade)
            if amount == 0:
                return out
            in_precision: uint256 = COLLATERAL_PRECISION
            out_precision: uint256 = BORROWED_PRECISION
            if i == 0:
                in_precision = BORROWED_PRECISION
                out_precision = COLLATERAL_PRECISION
            p_o: uint256[2] = self._price_oracle_ro()
            if is_in:
                out = self.calc_swap_out(i == 0, amount * in_precision, p_o, in_precision, out_precision)
            else:
                out = self.calc_swap_in(i == 0, amount * out_precision, p_o, in_precision, out_precision)
            out.in_amount = unsafe_div(out.in_amount, in_precision)
            out.out_amount = unsafe_div(out.out_amount, out_precision)
            return out
        ```

    === "Example"
        Selling 2000 crvUSD for sfrxETH:
        ```shell
        >>> AMM.get_dxdy(1, 0, 10**18)
        (1000000000000000000, 41443710620713878872934)
        ```


### `get_dx`
!!! description "`AMM.get_dx(i: uint256, j: uint256, out_amount: uint256) -> uint256:`"

    Function to calculate the `in_amount` of token `i` required to receive `out_amount` of token `j`.

    Returns: in amount (`uint256`).

    | Input       | Type      | Description                               |
    | ----------- | --------- | ----------------------------------------- |
    | `i`         | `uint256` | Input coin index.                         |
    | `j`         | `uint256` | Output coin index.                        |
    | `out_amount`| `uint256` | Desired amount of output coin to receive. |

    ??? quote "Source code"

        ```vyper 
        struct DetailedTrade:
            in_amount: uint256
            out_amount: uint256
            n1: int256
            n2: int256
            ticks_in: DynArray[uint256, MAX_TICKS_UINT]
            last_tick_j: uint256
            admin_fee: uint256

        @external
        @view
        @nonreentrant('lock')
        def get_dx(i: uint256, j: uint256, out_amount: uint256) -> uint256:
            """
            @notice Method to use to calculate in amount required to receive the desired out_amount
            @param i Input coin index
            @param j Output coin index
            @param out_amount Desired amount of output coin to receive
            @return Amount of coin i to spend
            """
            # i = 0: borrowable (USD) in, collateral (ETH) out; going up
            # i = 1: collateral (ETH) in, borrowable (USD) out; going down
            trade: DetailedTrade = self._get_dxdy(i, j, out_amount, False)
            assert trade.out_amount == out_amount
            return trade.in_amount

        @internal
        @view
        def _get_dxdy(i: uint256, j: uint256, amount: uint256, is_in: bool) -> DetailedTrade:
            """
            @notice Method to use to calculate out amount and spent in amount
            @param i Input coin index
            @param j Output coin index
            @param amount Amount of input or output coin to swap
            @param is_in Whether IN our OUT amount is known
            @return DetailedTrade with all swap results
            """
            # i = 0: borrowable (USD) in, collateral (ETH) out; going up
            # i = 1: collateral (ETH) in, borrowable (USD) out; going down
            assert (i == 0 and j == 1) or (i == 1 and j == 0), "Wrong index"
            out: DetailedTrade = empty(DetailedTrade)
            if amount == 0:
                return out
            in_precision: uint256 = COLLATERAL_PRECISION
            out_precision: uint256 = BORROWED_PRECISION
            if i == 0:
                in_precision = BORROWED_PRECISION
                out_precision = COLLATERAL_PRECISION
            p_o: uint256[2] = self._price_oracle_ro()
            if is_in:
                out = self.calc_swap_out(i == 0, amount * in_precision, p_o, in_precision, out_precision)
            else:
                out = self.calc_swap_in(i == 0, amount * out_precision, p_o, in_precision, out_precision)
            out.in_amount = unsafe_div(out.in_amount, in_precision)
            out.out_amount = unsafe_div(out.out_amount, out_precision)
            return out
        ```

    === "Example"
        ```shell
        # how much crvUSD does a user need to swap in to receive 1 tbtc at the currents pool state?
        >>> AMM.get_dx(0, 1, 10**18)
        43345361787695375761802
        ```


### `get_dydx`
!!! description "`AMM.get_dydx(i: uint256, j: uint256, out_amount: uint256) -> (uint256, uint256):`"

    Function to calculate the `in_amount` required and `out_amount` received.

    Returns: out and in amount (`uint256`).|

    | Input       | Type      | Description                               |
    | ----------- | --------- | ----------------------------------------- |
    | `i`         | `uint256` | Input coin index.                         |
    | `j`         | `uint256` | Output coin index.                        |
    | `out_amount`| `uint256` | Desired amount of output coin to receive. |

    ??? quote "Source code"

        ```vyper 
        struct DetailedTrade:
            in_amount: uint256
            out_amount: uint256
            n1: int256
            n2: int256
            ticks_in: DynArray[uint256, MAX_TICKS_UINT]
            last_tick_j: uint256
            admin_fee: uint256

        @external
        @view
        @nonreentrant('lock')
        def get_dydx(i: uint256, j: uint256, out_amount: uint256) -> (uint256, uint256):
            """
            @notice Method to use to calculate in amount required and out amount received
            @param i Input coin index
            @param j Output coin index
            @param out_amount Desired amount of output coin to receive
            @return A tuple with out_amount received and in_amount returned
            """
            # i = 0: borrowable (USD) in, collateral (ETH) out; going up
            # i = 1: collateral (ETH) in, borrowable (USD) out; going down
            out: DetailedTrade = self._get_dxdy(i, j, out_amount, False)
            return (out.out_amount, out.in_amount)

        @internal
        @view
        def _get_dxdy(i: uint256, j: uint256, amount: uint256, is_in: bool) -> DetailedTrade:
            """
            @notice Method to use to calculate out amount and spent in amount
            @param i Input coin index
            @param j Output coin index
            @param amount Amount of input or output coin to swap
            @param is_in Whether IN our OUT amount is known
            @return DetailedTrade with all swap results
            """
            # i = 0: borrowable (USD) in, collateral (ETH) out; going up
            # i = 1: collateral (ETH) in, borrowable (USD) out; going down
            assert (i == 0 and j == 1) or (i == 1 and j == 0), "Wrong index"
            out: DetailedTrade = empty(DetailedTrade)
            if amount == 0:
                return out
            in_precision: uint256 = COLLATERAL_PRECISION
            out_precision: uint256 = BORROWED_PRECISION
            if i == 0:
                in_precision = BORROWED_PRECISION
                out_precision = COLLATERAL_PRECISION
            p_o: uint256[2] = self._price_oracle_ro()
            if is_in:
                out = self.calc_swap_out(i == 0, amount * in_precision, p_o, in_precision, out_precision)
            else:
                out = self.calc_swap_in(i == 0, amount * out_precision, p_o, in_precision, out_precision)
            out.in_amount = unsafe_div(out.in_amount, in_precision)
            out.out_amount = unsafe_div(out.out_amount, out_precision)
            return out
        ```

    === "Example"
        ```shell
        >>> AMM.get_dydx(0, 1, 10**18)
        (1000000000000000000, 43345361787695375761802)
        ```


### `get_amount_for_price`
!!! description "`AMM.get_amount_for_price(p: uint256) -> (uint256, bool):`"

    Function to calculate the necessary amount to be exchanged to have the AMM at the final price `p`.

    Returns: amount to exchange (`uint256`) and true or false (`bool`). The returned `bool` reflects whether the exchange "pumps" the collateral price or "dumps" it. `True` reflects the need to buy the collateral token with crvUSD in order to reach the final price `p`, and `False` vice versa.

    | Input | Type      | Description       |
    | ----- | --------- | ----------------- |
    | `p`   | `uint256` | Price of the AMM. |

    ??? quote "Source code"

        ```vyper
        @external
        @view
        @nonreentrant('lock')
        def get_amount_for_price(p: uint256) -> (uint256, bool):
            """
            @notice Amount necessary to be exchanged to have the AMM at the final price `p`
            @return (amount, is_pump)
            """
            min_band: int256 = self.min_band
            max_band: int256 = self.max_band
            n: int256 = self.active_band
            p_o: uint256[2] = self._price_oracle_ro()
            p_o_up: uint256 = self._p_oracle_up(n)
            p_down: uint256 = unsafe_div(unsafe_div(p_o[0]**2, p_o_up) * p_o[0], p_o_up)  # p_current_down
            p_up: uint256 = unsafe_div(p_down * A2, Aminus12)  # p_crurrent_up
            amount: uint256 = 0
            y0: uint256 = 0
            f: uint256 = 0
            g: uint256 = 0
            Inv: uint256 = 0
            j: uint256 = MAX_TICKS_UINT
            pump: bool = True

            for i in range(MAX_TICKS + MAX_SKIP_TICKS):
                assert p_o_up > 0
                x: uint256 = self.bands_x[n]
                y: uint256 = self.bands_y[n]
                if i == 0:
                    if p < self._get_p(n, x, y):
                        pump = False
                not_empty: bool = x > 0 or y > 0
                if not_empty:
                    y0 = self._get_y0(x, y, p_o[0], p_o_up)
                    f = unsafe_div(unsafe_div(A * y0 * p_o[0], p_o_up) * p_o[0], 10**18)
                    g = unsafe_div(Aminus1 * y0 * p_o_up, p_o[0])
                    Inv = (f + x) * (g + y)
                    if j == MAX_TICKS_UINT:
                        j = 0

                if p <= p_up:
                    if p >= p_down:
                        if not_empty:
                            ynew: uint256 = unsafe_sub(max(self.sqrt_int(Inv * 10**18 / p), g), g)
                            xnew: uint256 = unsafe_sub(max(Inv / (g + ynew), f), f)
                            if pump:
                                amount += unsafe_sub(max(xnew, x), x)
                            else:
                                amount += unsafe_sub(max(ynew, y), y)
                        break

                # Need this to break if price is too far
                p_ratio: uint256 = unsafe_div(p_o_up * 10**18, p_o[0])

                if pump:
                    if not_empty:
                        amount += (Inv / g - f) - x
                    if n == max_band:
                        break
                    if j == MAX_TICKS_UINT - 1:
                        break
                    if p_ratio < unsafe_div(10**36, MAX_ORACLE_DN_POW):
                        # Don't allow to be away by more than ~50 ticks
                        break
                    n += 1
                    p_down = p_up
                    p_up = unsafe_div(p_up * A2, Aminus12)
                    p_o_up = unsafe_div(p_o_up * Aminus1, A)

                else:
                    if not_empty:
                        amount += (Inv / f - g) - y
                    if n == min_band:
                        break
                    if j == MAX_TICKS_UINT - 1:
                        break
                    if p_ratio > MAX_ORACLE_DN_POW:
                        # Don't allow to be away by more than ~50 ticks
                        break
                    n -= 1
                    p_up = p_down
                    p_down = unsafe_div(p_down * Aminus12, A2)
                    p_o_up = unsafe_div(p_o_up * A, Aminus1)

                if j != MAX_TICKS_UINT:
                    j = unsafe_add(j, 1)

            amount = amount * 10**18 / unsafe_sub(10**18, max(self.fee, p_o[1]))
            if amount == 0:
                return 0, pump

            # Precision and round up
            if pump:
                amount = unsafe_add(unsafe_div(unsafe_sub(amount, 1), BORROWED_PRECISION), 1)
            else:
                amount = unsafe_add(unsafe_div(unsafe_sub(amount, 1), COLLATERAL_PRECISION), 1)

            return amount, pump
        ```

    === "Example"
        ```shell
        >>> Controller.amm_price(42360604244534725358731)
        42360604244534725358731
        >>> AMM.get_amount_for_price(42360604244534725358731)
        (0, True)                               # value is 0, because we already are at the current amm price
        >>> AMM.get_amount_for_price(43500000000000000000000)
        (33883533434143618564545, True)         # need to sell crvusd for tbtc to get the price up
        >>> AMM.get_amount_for_price(41500000000000000000000)
        (648390479703549124, False)             # need to sell tbtc for crvusd to get the price down
        ```

    !!!note
        `bool = true` -> need to exchange crvUSD for collateral (to get the price of the collateral **UP**)      
        `bool = false` -> need to exchange collateral for crvUSD (to get the price of the collateral **DOWN**)


---


## **Bands**

*"Each band works like Uniswap V3, concentrating liquidity between two prices, and being all in the collateral at the lower price and all in crvUSD at the higher price. However since the entire interval of prices are aggressively placed with respect to the market (higher than oracle price when it's moving up and lower when it's moving down), each band gets arbed to hold all of either collateral or stablecoin in the opposite manner than expected when LP-ing with Uniswap V3."*[^2]

[^2]: https://github.com/chanhosuh/curvefi-math/blob/master/LLAMMA.ipynb

Each individual band has an upper ([`p_oracle_up`](#p_oracle_up)) and lower ([`p_oracle_down`](#p_oracle_down)) price bound. These prices are not actual AMM prices, but rather thresholds for the bands.  
Therefore, because it is a continuous grid, the lower price bound of, let's say, band 0 is the same as the upper price bound of band 1.


*There are **three possible compositions** of bands:*   

- **`active_band`** consists of both the borrowable and collateral asset, depending on the oracle price within the band  
- Bands < **`active_band`**: fully in borrowable asset as the bands above have already gone through soft-liquidation  
- Bands > **`active_band`**: fully in the collateral asset as the bands have not been in soft-liquidation mode

<figure markdown>
  ![](../assets/images/llamma.png)
  <figcaption>bands > -2: fully in collateral asset, bands < -2: fully in borrowable asset and band -2: contains both assets</figcaption>
</figure>


*In the code, `x` represents the borrowable token, and `y` the collateral token.*


### `A`
!!! description "`AMM.A() -> uint256: view`"

    Getter for A (amplicitation coefficient). The amplication defines the density of the liquidty and band size. The relative band size is $\frac{1}{A}$.

    Returns: amplification coefficient (`uint256`).

    ??? quote "Source code"

        ```vyper
        A: public(immutable(uint256))

        @external
        def __init__(
                _borrowed_token: address,
                _borrowed_precision: uint256,
                _collateral_token: address,
                _collateral_precision: uint256,
                _A: uint256,
                _sqrt_band_ratio: uint256,
                _log_A_ratio: int256,
                _base_price: uint256,
                fee: uint256,
                admin_fee: uint256,
                _price_oracle_contract: address,
            ):
            """
            @notice LLAMMA constructor
            @param _borrowed_token Token which is being borrowed
            @param _collateral_token Token used as collateral
            @param _collateral_precision Precision of collateral: we pass it because we want the blueprint to fit into bytecode
            @param _A "Amplification coefficient" which also defines density of liquidity and band size. Relative band size is 1/_A
            @param _sqrt_band_ratio Precomputed int(sqrt(A / (A - 1)) * 1e18)
            @param _log_A_ratio Precomputed int(ln(A / (A - 1)) * 1e18)
            @param _base_price Typically the initial crypto price at which AMM is deployed. Will correspond to band 0
            @param fee Relative fee of the AMM: int(fee * 1e18)
            @param admin_fee Admin fee: how much of fee goes to admin. 50% === int(0.5 * 1e18)
            @param _price_oracle_contract External price oracle which has price() and price_w() methods
                which both return current price of collateral multiplied by 1e18
            """

            ...

            A = _A

            ...
        ```

    === "Example"

        ```shell
        >>> AMM.A()
        100
        ```


### `active_band`
!!! description "`AMM.active_band() -> int256: view`"

    Getter for the current active band, the band in which `get_p` currently is in. Other bands are either in one or the other coin, but not in both. Upper bands are in the borrowable token, lower bands in the collateral token.

    Returns: active band (`int256`).

    ??? quote "Source code"

        ```vyper 
        active_band: public(int256)
        ```

    === "Example"

        ```shell
        >>> AMM.active_band()
        -48
        ```


### `min_band`
!!! description "`AMM.min_band() -> int256: view`"

    Getter for the minimum band. All bands below this one are definitely empty. 

    Returns: minimum band (`int256`).

    ??? quote "Source code"

        ```vyper
        min_band: public(int256)
        ```

    === "Example"

        ```shell
        >>> AMM.min_band()
        -55
        ```


### `max_band`
!!! description "`AMM.max_band() -> int256: view`"

    Getter for the maximum band. All bands above this one are definitely empty. 

    Returns: maximum band (`int256`).

    ??? quote "Source code"

        ```vyper
        max_band: public(int256)
        ```

    === "Example"

        ```shell
        >>> AMM.max_band()
        653
        ```


### `has_liquidity`
!!! description "`AMM.has_liquidity(user_: address) -> bool:`"

    Function to check if `user` has any liquidity in the AMM.

    Returns: true or false (`bool`).

    | Input  | Type      | Description   |
    | ------ | --------- | ------------- |
    | `user` | `address` | User Address. |

    ??? quote "Source code"

        ```vyper
        user_shares: HashMap[address, UserTicks]

        @external
        @view
        @nonreentrant('lock')
        def has_liquidity(user: address) -> bool:
            """
            @notice Check if `user` has any liquidity in the AMM
            """
            return self.user_shares[user].ticks[0] != 0
        ```

    === "Example"

        ```shell
        >>> AMM.has_liquidity(trader)
        'True'
        ```


### `bands_x`
!!! description "`AMM.bands_x(arg0: int256) -> uint256: view`"

    Getter for the amount of the borrowable token deposited in band number `arg0`.

    Returns: token amount (`uint256`).

    | Input  | Type      | Description        |
    | ------ | --------- | ------------------ |
    | `arg0` | `int256` | Number of the band. |

    ??? quote "Source code"

        ```vyper 
        bands_x: public(HashMap[int256, uint256])
        ```

    === "Example"

        ```shell
        >>> AMM.bands_x(-47)
        0
        >>> AMM.bands_x(-48)
        11659955945097877786254
        >>> AMM.bands_x(-49)
        27556035453154780961521
        ```

    !!!note
        At the time of creating these examples, `active_band` was -48. Band -48 consists of the borrowable and collateral token. All bands below fully in the borrowable token, and all bands above fully in the collateral token.


### `bands_y`
!!! description "`AMM.bands_y(arg0: int256) -> uint256: view`"

    Getter for the amount of collateral token deposited in band number `arg0`.

    Returns: amount (`uint256`) of coin y deposited in a band.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `arg0` |  `int256` | Band |

    ??? quote "Source code"

        ```vyper
        bands_y: public(HashMap[int256, uint256])
        ```

    === "Example"

        ```shell
        >>> AMM.bands_x(-47)
        595268927247021363
        >>> AMM.bands_x(-48)
        316435642081117977
        >>> AMM.bands_x(-49)
        0
        ```

    !!!note
        At the time of creating these examples, `active_band` was -48. Band -48 consists of the borrowable and collateral token. All bands below fully in the borrowable token, and all bands above fully in the collateral token.


### `get_xy`
!!! description "`AMM.get_xy(user: address) -> DynArray[uint256, MAX_TICKS_UINT][2]:`"

    Function to measure balances of the borrowed and collateral assets across the different bands for `user`.

    Returns: balances of borrowed and collateral token (`uint256`) in the different bands.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `user` |  `address` | User address |

    ??? quote "Source code"

        ```vyper
        @external
        @view
        @nonreentrant('lock')
        def get_xy(user: address) -> DynArray[uint256, MAX_TICKS_UINT][2]:
            """
            @notice A low-gas function to measure amounts of stablecoins and collateral by bands which user currently owns
            @param user User address
            @return Amounts of (stablecoin, collateral) by bands in a tuple
            """
            return self._get_xy(user, False)

        @internal
        @view
        def _get_xy(user: address, is_sum: bool) -> DynArray[uint256, MAX_TICKS_UINT][2]:
            """
            @notice A low-gas function to measure amounts of stablecoins and collateral which user currently owns
            @param user User address
            @param is_sum Return sum or amounts by bands
            @return Amounts of (stablecoin, collateral) in a tuple
            """
            xs: DynArray[uint256, MAX_TICKS_UINT] = []
            ys: DynArray[uint256, MAX_TICKS_UINT] = []
            if is_sum:
                xs.append(0)
                ys.append(0)
            ns: int256[2] = self._read_user_tick_numbers(user)
            ticks: DynArray[uint256, MAX_TICKS_UINT] = self._read_user_ticks(user, ns)
            if ticks[0] != 0:
                for i in range(MAX_TICKS):
                    total_shares: uint256 = self.total_shares[ns[0]] + DEAD_SHARES
                    ds: uint256 = ticks[i]
                    dx: uint256 = unsafe_div((self.bands_x[ns[0]] + 1) * ds, total_shares)
                    dy: uint256 = unsafe_div((self.bands_y[ns[0]] + 1) * ds, total_shares)
                    if is_sum:
                        xs[0] += dx
                        ys[0] += dy
                    else:
                        xs.append(unsafe_div(dx, BORROWED_PRECISION))
                        ys.append(unsafe_div(dy, COLLATERAL_PRECISION))
                    if ns[0] == ns[1]:
                        break
                    ns[0] = unsafe_add(ns[0], 1)

            if is_sum:
                xs[0] = unsafe_div(xs[0], BORROWED_PRECISION)
                ys[0] = unsafe_div(ys[0], COLLATERAL_PRECISION)

            return [xs, ys]
        ```

    === "Example"
        ```shell
        >>> AMM.get_xy(trader) 
        [[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [33333333333333343, 33333333333333333, 33333333333333333, 33333333333333333, 33333333333333333, 33333333333333333, 33333333333333333, 33333333333333333, 33333333333333333, 33333333333333333, 33333333333333333, 33333333333333333, 33333333333333333, 33333333333333333, 33333333333333333, 33333333333333333, 33333333333333333, 33333333333333333, 33333333333333333, 33333333333333333, 33333333333333333, 33333333333333333, 33333333333333333, 33333333333333333, 33333333333333333, 33333333333333333, 33333333333333333, 33333333333333333, 33333333333333333, 33333333333333333]]
        ```


### `read_user_tick_numbers`
!!! description "`AMM.read_user_tick_numbers(user: address) -> int256[2]:`"

    Function to unpack and read the user's tick numbers (= lowest and highest band the user deposited into).

    Returns: upper and lower band (`int256`).

    | Input  | Type      | Description   |
    | ------ | --------- | ------------- |
    | `user` | `address` | User address. |

    ??? quote "Source code"

        ```vyper
        user_shares: HashMap[address, UserTicks]
    
        @external
        @view
        @nonreentrant('lock')
        def read_user_tick_numbers(user: address) -> int256[2]:
            """
            @notice Unpacks and reads user tick numbers
            @param user User address
            @return Lowest and highest band the user deposited into
            """
            return self._read_user_tick_numbers(user)

        @internal
        @view
        def _read_user_tick_numbers(user: address) -> int256[2]:
            """
            @notice Unpacks and reads user tick numbers
            @param user User address
            @return Lowest and highest band the user deposited into
            """
            ns: int256 = self.user_shares[user].ns
            n2: int256 = unsafe_div(ns, 2**128)
            n1: int256 = ns % 2**128
            if n1 >= 2**127:
                n1 = unsafe_sub(n1, 2**128)
                n2 = unsafe_add(n2, 1)
            return [n1, n2]
        ```

    === "Example"

        ```shell
        >>> AMM.read_user_tick_numbers(trader)
        [73, 102]
        ```


### `get_y_up`
!!! description "`AMM.get_y_up(user: address) -> uint256:`"

    Function to measure the amount of y (collateral token) in band n for `user` if we adiabatically trade near `p_oracle` on the way up.

    Returns: amount of collateral (`uint256`).

    | Input  | Type      | Description   |
    | ------ | --------- | ------------- |
    | `user` | `address` | User address. |

    ??? quote "Source code"

        ```vyper
        @external
        @view
        @nonreentrant('lock')
        def get_y_up(user: address) -> uint256:
            """
            @notice Measure the amount of y (collateral) in the band n if we adiabatically trade near p_oracle on the way up
            @param user User the amount is calculated for
            @return Amount of coins
            """
            return self.get_xy_up(user, True)

        @internal
        @view
        def get_xy_up(user: address, use_y: bool) -> uint256:
            """
            @notice Measure the amount of y (collateral) in the band n if we adiabatically trade near p_oracle on the way up,
                    or the amount of x (stablecoin) if we trade adiabatically down
            @param user User the amount is calculated for
            @param use_y Calculate amount of collateral if True and of stablecoin if False
            @return Amount of coins
            """
            ns: int256[2] = self._read_user_tick_numbers(user)
            ticks: DynArray[uint256, MAX_TICKS_UINT] = self._read_user_ticks(user, ns)
            if ticks[0] == 0:  # Even dynamic array will have 0th element set here
                return 0
            p_o: uint256 = self._price_oracle_ro()[0]
            assert p_o != 0

            n: int256 = ns[0] - 1
            n_active: int256 = self.active_band
            p_o_down: uint256 = self._p_oracle_up(ns[0])
            XY: uint256 = 0

            for i in range(MAX_TICKS):
                n += 1
                if n > ns[1]:
                    break
                x: uint256 = 0
                y: uint256 = 0
                if n >= n_active:
                    y = self.bands_y[n]
                if n <= n_active:
                    x = self.bands_x[n]
                # p_o_up: uint256 = self._p_oracle_up(n)
                p_o_up: uint256 = p_o_down
                # p_o_down = self._p_oracle_up(n + 1)
                p_o_down = unsafe_div(p_o_down * Aminus1, A)
                if x == 0:
                    if y == 0:
                        continue

                total_share: uint256 = self.total_shares[n]
                user_share: uint256 = ticks[i]
                if total_share == 0:
                    continue
                if user_share == 0:
                    continue
                total_share += DEAD_SHARES
                # Also ideally we'd want to add +1 to all quantities when calculating with shares
                # but we choose to save bytespace and slightly under-estimate the result of this call
                # which is also more conservative

                # Also this will revert if p_o_down is 0, and p_o_down is 0 if p_o_up is 0
                p_current_mid: uint256 = unsafe_div(p_o**2 / p_o_down * p_o, p_o_up)

                # if p_o > p_o_up - we "trade" everything to y and then convert to the result
                # if p_o < p_o_down - "trade" to x, then convert to result
                # otherwise we are in-band, so we do the more complex logic to trade
                # to p_o rather than to the edge of the band
                # trade to the edge of the band == getting to the band edge while p_o=const

                # Cases when special conversion is not needed (to save on computations)
                if x == 0 or y == 0:
                    if p_o > p_o_up:  # p_o < p_current_down
                        # all to y at constant p_o, then to target currency adiabatically
                        y_equiv: uint256 = y
                        if y == 0:
                            y_equiv = x * 10**18 / p_current_mid
                        if use_y:
                            XY += unsafe_div(y_equiv * user_share, total_share)
                        else:
                            XY += unsafe_div(unsafe_div(y_equiv * p_o_up, SQRT_BAND_RATIO) * user_share, total_share)
                        continue

                    elif p_o < p_o_down:  # p_o > p_current_up
                        # all to x at constant p_o, then to target currency adiabatically
                        x_equiv: uint256 = x
                        if x == 0:
                            x_equiv = unsafe_div(y * p_current_mid, 10**18)
                        if use_y:
                            XY += unsafe_div(unsafe_div(x_equiv * SQRT_BAND_RATIO, p_o_up) * user_share, total_share)
                        else:
                            XY += unsafe_div(x_equiv * user_share, total_share)
                        continue

                # If we are here - we need to "trade" to somewhere mid-band
                # So we need more heavy math

                y0: uint256 = self._get_y0(x, y, p_o, p_o_up)
                f: uint256 = unsafe_div(unsafe_div(A * y0 * p_o, p_o_up) * p_o, 10**18)
                g: uint256 = unsafe_div(Aminus1 * y0 * p_o_up, p_o)
                # (f + x)(g + y) = const = p_top * A**2 * y0**2 = I
                Inv: uint256 = (f + x) * (g + y)
                # p = (f + x) / (g + y) => p * (g + y)**2 = I or (f + x)**2 / p = I

                # First, "trade" in this band to p_oracle
                x_o: uint256 = 0
                y_o: uint256 = 0

                if p_o > p_o_up:  # p_o < p_current_down, all to y
                    # x_o = 0
                    y_o = unsafe_sub(max(Inv / f, g), g)
                    if use_y:
                        XY += unsafe_div(y_o * user_share, total_share)
                    else:
                        XY += unsafe_div(unsafe_div(y_o * p_o_up, SQRT_BAND_RATIO) * user_share, total_share)

                elif p_o < p_o_down:  # p_o > p_current_up, all to x
                    # y_o = 0
                    x_o = unsafe_sub(max(Inv / g, f), f)
                    if use_y:
                        XY += unsafe_div(unsafe_div(x_o * SQRT_BAND_RATIO, p_o_up) * user_share, total_share)
                    else:
                        XY += unsafe_div(x_o * user_share, total_share)

                else:
                    # Equivalent from Chainsecurity (which also has less numerical errors):
                    y_o = unsafe_div(A * y0 * unsafe_sub(p_o, p_o_down), p_o)
                    # x_o = unsafe_div(A * y0 * p_o, p_o_up) * unsafe_sub(p_o_up, p_o)
                    # Old math
                    # y_o = unsafe_sub(max(self.sqrt_int(unsafe_div(Inv * 10**18, p_o)), g), g)
                    x_o = unsafe_sub(max(Inv / (g + y_o), f), f)

                    # Now adiabatic conversion from definitely in-band
                    if use_y:
                        XY += unsafe_div((y_o + x_o * 10**18 / self.sqrt_int(p_o_up * p_o)) * user_share, total_share)

                    else:
                        XY += unsafe_div((x_o + unsafe_div(y_o * self.sqrt_int(p_o_down * p_o), 10**18)) * user_share, total_share)

            if use_y:
                return unsafe_div(XY, COLLATERAL_PRECISION)
            else:
                return unsafe_div(XY, BORROWED_PRECISION)
        ```

    === "Example"

        ```shell
        >>> AMM.get_y_up(trader)
        999999999999999970
        ```


### `get_x_down`
!!! description "`AMM.get_x_down(user: address) -> uint256:`"

    Function to measure the amount of x (borrowable token) in band n for `user` if we adiabatically trade down.

    Returns: amount of collateral (`uint256`).

    | Input  | Type      | Description   |
    | ------ | --------- | ------------- |
    | `user` | `address` | User address. |

    ??? quote "Source code"

        ```vyper 
        @external
        @view
        @nonreentrant('lock')
        def get_x_down(user: address) -> uint256:
            """
            @notice Measure the amount of x (stablecoin) if we trade adiabatically down
            @param user User the amount is calculated for
            @return Amount of coins
            """
            return self.get_xy_up(user, False)

        @internal
        @view
        def get_xy_up(user: address, use_y: bool) -> uint256:
            """
            @notice Measure the amount of y (collateral) in the band n if we adiabatically trade near p_oracle on the way up,
                    or the amount of x (stablecoin) if we trade adiabatically down
            @param user User the amount is calculated for
            @param use_y Calculate amount of collateral if True and of stablecoin if False
            @return Amount of coins
            """
            ns: int256[2] = self._read_user_tick_numbers(user)
            ticks: DynArray[uint256, MAX_TICKS_UINT] = self._read_user_ticks(user, ns)
            if ticks[0] == 0:  # Even dynamic array will have 0th element set here
                return 0
            p_o: uint256 = self._price_oracle_ro()[0]
            assert p_o != 0

            n: int256 = ns[0] - 1
            n_active: int256 = self.active_band
            p_o_down: uint256 = self._p_oracle_up(ns[0])
            XY: uint256 = 0

            for i in range(MAX_TICKS):
                n += 1
                if n > ns[1]:
                    break
                x: uint256 = 0
                y: uint256 = 0
                if n >= n_active:
                    y = self.bands_y[n]
                if n <= n_active:
                    x = self.bands_x[n]
                # p_o_up: uint256 = self._p_oracle_up(n)
                p_o_up: uint256 = p_o_down
                # p_o_down = self._p_oracle_up(n + 1)
                p_o_down = unsafe_div(p_o_down * Aminus1, A)
                if x == 0:
                    if y == 0:
                        continue

                total_share: uint256 = self.total_shares[n]
                user_share: uint256 = ticks[i]
                if total_share == 0:
                    continue
                if user_share == 0:
                    continue
                total_share += DEAD_SHARES
                # Also ideally we'd want to add +1 to all quantities when calculating with shares
                # but we choose to save bytespace and slightly under-estimate the result of this call
                # which is also more conservative

                # Also this will revert if p_o_down is 0, and p_o_down is 0 if p_o_up is 0
                p_current_mid: uint256 = unsafe_div(p_o**2 / p_o_down * p_o, p_o_up)

                # if p_o > p_o_up - we "trade" everything to y and then convert to the result
                # if p_o < p_o_down - "trade" to x, then convert to result
                # otherwise we are in-band, so we do the more complex logic to trade
                # to p_o rather than to the edge of the band
                # trade to the edge of the band == getting to the band edge while p_o=const

                # Cases when special conversion is not needed (to save on computations)
                if x == 0 or y == 0:
                    if p_o > p_o_up:  # p_o < p_current_down
                        # all to y at constant p_o, then to target currency adiabatically
                        y_equiv: uint256 = y
                        if y == 0:
                            y_equiv = x * 10**18 / p_current_mid
                        if use_y:
                            XY += unsafe_div(y_equiv * user_share, total_share)
                        else:
                            XY += unsafe_div(unsafe_div(y_equiv * p_o_up, SQRT_BAND_RATIO) * user_share, total_share)
                        continue

                    elif p_o < p_o_down:  # p_o > p_current_up
                        # all to x at constant p_o, then to target currency adiabatically
                        x_equiv: uint256 = x
                        if x == 0:
                            x_equiv = unsafe_div(y * p_current_mid, 10**18)
                        if use_y:
                            XY += unsafe_div(unsafe_div(x_equiv * SQRT_BAND_RATIO, p_o_up) * user_share, total_share)
                        else:
                            XY += unsafe_div(x_equiv * user_share, total_share)
                        continue

                # If we are here - we need to "trade" to somewhere mid-band
                # So we need more heavy math

                y0: uint256 = self._get_y0(x, y, p_o, p_o_up)
                f: uint256 = unsafe_div(unsafe_div(A * y0 * p_o, p_o_up) * p_o, 10**18)
                g: uint256 = unsafe_div(Aminus1 * y0 * p_o_up, p_o)
                # (f + x)(g + y) = const = p_top * A**2 * y0**2 = I
                Inv: uint256 = (f + x) * (g + y)
                # p = (f + x) / (g + y) => p * (g + y)**2 = I or (f + x)**2 / p = I

                # First, "trade" in this band to p_oracle
                x_o: uint256 = 0
                y_o: uint256 = 0

                if p_o > p_o_up:  # p_o < p_current_down, all to y
                    # x_o = 0
                    y_o = unsafe_sub(max(Inv / f, g), g)
                    if use_y:
                        XY += unsafe_div(y_o * user_share, total_share)
                    else:
                        XY += unsafe_div(unsafe_div(y_o * p_o_up, SQRT_BAND_RATIO) * user_share, total_share)

                elif p_o < p_o_down:  # p_o > p_current_up, all to x
                    # y_o = 0
                    x_o = unsafe_sub(max(Inv / g, f), f)
                    if use_y:
                        XY += unsafe_div(unsafe_div(x_o * SQRT_BAND_RATIO, p_o_up) * user_share, total_share)
                    else:
                        XY += unsafe_div(x_o * user_share, total_share)

                else:
                    # Equivalent from Chainsecurity (which also has less numerical errors):
                    y_o = unsafe_div(A * y0 * unsafe_sub(p_o, p_o_down), p_o)
                    # x_o = unsafe_div(A * y0 * p_o, p_o_up) * unsafe_sub(p_o_up, p_o)
                    # Old math
                    # y_o = unsafe_sub(max(self.sqrt_int(unsafe_div(Inv * 10**18, p_o)), g), g)
                    x_o = unsafe_sub(max(Inv / (g + y_o), f), f)

                    # Now adiabatic conversion from definitely in-band
                    if use_y:
                        XY += unsafe_div((y_o + x_o * 10**18 / self.sqrt_int(p_o_up * p_o)) * user_share, total_share)

                    else:
                        XY += unsafe_div((x_o + unsafe_div(y_o * self.sqrt_int(p_o_down * p_o), 10**18)) * user_share, total_share)

            if use_y:
                return unsafe_div(XY, COLLATERAL_PRECISION)
            else:
                return unsafe_div(XY, BORROWED_PRECISION)
        ```

    === "Example"

        ```shell
        >>> AMM.get_x_down(trader)
        11057439659522034798651
        ```


### `can_skip_bands`
!!! description "`AMM.can_skip_bands(n_end: int256) -> bool:`"

    Function to check if there is liquidity between `active_band` and `n_end`.

    Returns: true or false (`bool`).

    | Input   | Type     | Description                        |
    | ------- | -------- | ---------------------------------- |
    | `n_end` | `int256` | Band number to check until.        |

    ??? quote "Source code"

        ```vyper 
        @external
        @view
        @nonreentrant('lock')
        def can_skip_bands(n_end: int256) -> bool:
            """
            @notice Check that we have no liquidity between active_band and `n_end`
            """
            n: int256 = self.active_band
            for i in range(MAX_SKIP_TICKS):
                if n_end > n:
                    if self.bands_y[n] != 0:
                        return False
                    n = unsafe_add(n, 1)
                else:
                    if self.bands_x[n] != 0:
                        return False
                    n = unsafe_sub(n, 1)
                if n == n_end:  # not including n_end
                    break
            return True
            # Actually skipping bands:
            # * change self.active_band to the new n
            # * change self.p_base_mul
            # to do n2-n1 times (if n2 > n1):
            # out.base_mul = unsafe_div(out.base_mul * Aminus1, A)
        ```

    === "Example"

        ```shell
        >>> AMM.can_skip_bands(-50)
        'False'
        ```


### `get_sum_xy`
!!! description "`AMM.get_sum_xy(user: address) -> uint256[2]:`"

    Function to measure the amount of borrowable and collateral token `user` currently owns inside the AMM.

    Returns: balances of borrowable token and collateral token (`uint256[2]`).

    | Input   | Type     | Description  |
    | ------- | -------- | ------------ |
    | `user`  | `address`| User address. |

    ??? quote "Source code"

        ```vyper 
        @external
        @view
        @nonreentrant('lock')
        def get_sum_xy(user: address) -> uint256[2]:
            """
            @notice A low-gas function to measure amounts of stablecoins and collateral which user currently owns
            @param user User address
            @return Amounts of (stablecoin, collateral) in a tuple
            """
            xy: DynArray[uint256, MAX_TICKS_UINT][2] = self._get_xy(user, True)
            return [xy[0][0], xy[1][0]]

        @internal
        @view
        def _get_xy(user: address, is_sum: bool) -> DynArray[uint256, MAX_TICKS_UINT][2]:
            """
            @notice A low-gas function to measure amounts of stablecoins and collateral which user currently owns
            @param user User address
            @param is_sum Return sum or amounts by bands
            @return Amounts of (stablecoin, collateral) in a tuple
            """
            xs: DynArray[uint256, MAX_TICKS_UINT] = []
            ys: DynArray[uint256, MAX_TICKS_UINT] = []
            if is_sum:
                xs.append(0)
                ys.append(0)
            ns: int256[2] = self._read_user_tick_numbers(user)
            ticks: DynArray[uint256, MAX_TICKS_UINT] = self._read_user_ticks(user, ns)
            if ticks[0] != 0:
                for i in range(MAX_TICKS):
                    total_shares: uint256 = self.total_shares[ns[0]] + DEAD_SHARES
                    ds: uint256 = ticks[i]
                    dx: uint256 = unsafe_div((self.bands_x[ns[0]] + 1) * ds, total_shares)
                    dy: uint256 = unsafe_div((self.bands_y[ns[0]] + 1) * ds, total_shares)
                    if is_sum:
                        xs[0] += dx
                        ys[0] += dy
                    else:
                        xs.append(unsafe_div(dx, BORROWED_PRECISION))
                        ys.append(unsafe_div(dy, COLLATERAL_PRECISION))
                    if ns[0] == ns[1]:
                        break
                    ns[0] = unsafe_add(ns[0], 1)

            if is_sum:
                xs[0] = unsafe_div(xs[0], BORROWED_PRECISION)
                ys[0] = unsafe_div(ys[0], COLLATERAL_PRECISION)

            return [xs, ys]
        ```

    === "Example"
        ```shell
        >>> AMM.get_sum_xy(trader)
        [0, 1000000000000000000]    # collateral composition: [crvusd, collateral token]
        # if a position is in self-liquidation, `get_sum_xy` will contain both crvusd and collateral token
        ```
 

---


## **Price Oracles**

*The AMM relies on **two different prices**:*

- **`price_oracle`:** Collateral price fetched from a price oracle.
- **`get_p`:** Oracle price of the AMM itself.

When $\text{price_oracle} = \text{get_p}$, the external oracle price and the AMM prices are identical, indicating no need for arbitrage.
When the external oracle price begins to diverge, the AMM price `get_p` is adjusted to be more sensitive than the regular `price_oracle`, creating arbitrage opportunities.

- When the **price of the collateral rises** ($\text{price_oracle} > \text{get_p}$), arbitrage is possible by **swapping collateral into the borrowable asset** until equilibrium is restored.
- Conversely, when the **price begins to decrease** ($\text{price_oracle} < \text{get_p}$), arbitrage by **swapping the borrowable asset into collateral** is possible until both prices align again.


!!!info "A user's loan is only in soft-liquidation when the price oracle is within the bands of the deposited collateral"
    A position enters soft-liquidation mode only when the price oracle falls within a band where the user has deposited collateral. 
    For example, if a user has collateral deposited between bands 10 and 0, they will not enter soft-liquidation as long as the oracle price stays outside these bands. In this scenario, the only "loss" the user faces is the variable interest rate of the market.
    Additionally, there is a rather rare possibility that a user's loan was fully soft-liquidated, resulting in all their collateral being converted to the borrowable asset. In such a case, the user would be out of soft-liquidation because the price oracle is below the lowest band.



### `get_base_price`
!!! description "`AMM.get_base_price() -> uint256:`"

    Function to get the base price of the AMM which corresponds to band 0. The base price grows over time to account for the interest rate: `BASE_PRICE` (= the 'real' base price when the contract was deployed) is multiplied by `_rate_mul` to account for the interest rate.

    Returns: base price (`uint256`).

    ??? quote "Source code"

        ```vyper
        BASE_PRICE: immutable(uint256)
        rate: public(uint256)
        rate_time: uint256
        rate_mul: uint256

        @external
        @view
        def get_base_price() -> uint256:
            """
            @notice Price which corresponds to band 0.
                    Base price grows with time to account for interest rate (which is 0 by default)
            """
            return self._base_price()

        @internal
        @view
        def _base_price() -> uint256:
            """
            @notice Price which corresponds to band 0.
                    Base price grows with time to account for interest rate (which is 0 by default)
            """
            return unsafe_div(BASE_PRICE * self._rate_mul(), 10**18)

        @internal
        @view
        def _rate_mul() -> uint256:
            """
            @notice Rate multiplier which is 1.0 + integral(rate, dt)
            @return Rate multiplier in units where 1.0 == 1e18
            """
            return unsafe_div(self.rate_mul * (10**18 + self.rate * (block.timestamp - self.rate_time)), 10**18)
        ```

    === "Example"

        ```shell
        >>> AMM.get_base_price()
        26675679125535389229023
        ```


### `p_current_up`
!!! description "`AMM.p_current_up(n: int256) -> uint256:`"

    Getter for the highest possible price of the band at the current oracle price.

    Returns: highest possible price (`uint256`).

    | Input | Type    | Description   |
    | ----- | ------- | ------------- |
    | `n`   | `int256`| Band Number.  |

    ??? quote "Source code"

        ```vyper
        @external
        @view
        def p_current_up(n: int256) -> uint256:
            """
            @notice Highest possible price of the band at current oracle price
            @param n Band number (can be negative)
            @return Price at 1e18 base
            """
            return self._p_current_band(n + 1)

        @internal
        @view
        def _p_current_band(n: int256) -> uint256:
            """
            @notice Lowest possible price of the band at current oracle price
            @param n Band number (can be negative)
            @return Price at 1e18 base
            """
            # k = (self.A - 1) / self.A  # equal to (p_down / p_up)
            # p_base = self.p_base * k ** n = p_oracle_up(n)
            p_base: uint256 = self._p_oracle_up(n)

            # return self.p_oracle**3 / p_base**2
            p_oracle: uint256 = self._price_oracle_ro()[0]
            return unsafe_div(p_oracle**2 / p_base * p_oracle, p_base)
        ```

        === "Example"

            ```shell
            >>> AMM.p_current_up(-47)
            43556091391620558676062
            >>> AMM.p_current_up(-48)
            42689325172927310418784
            >>> AMM.p_current_up(-49)
            41839807601986057796621
            ```


### `p_current_down` 
!!! description "`AMM.p_current_down(n: int256) -> uint256:`"

    Getter for the lowest possible price of the band at the current oracle price.

    Returns: lowest price (`uint256`) of band `n`.

    | Input | Type    | Description   |
    | ----- | ------- | ------------- |
    | `n`   | `int256`| Band Number.  |

    ??? quote "Source code"

        ```vyper 
        @external
        @view
        def p_current_down(n: int256) -> uint256:
            """
            @notice Lowest possible price of the band at current oracle price
            @param n Band number (can be negative)
            @return Price at 1e18 base
            """
            return self._p_current_band(n)

        @internal
        @view
        def _p_current_band(n: int256) -> uint256:
            """
            @notice Lowest possible price of the band at current oracle price
            @param n Band number (can be negative)
            @return Price at 1e18 base
            """
            # k = (self.A - 1) / self.A  # equal to (p_down / p_up)
            # p_base = self.p_base * k ** n = p_oracle_up(n)
            p_base: uint256 = self._p_oracle_up(n)

            # return self.p_oracle**3 / p_base**2
            p_oracle: uint256 = self._price_oracle_ro()[0]
            return unsafe_div(p_oracle**2 / p_base * p_oracle, p_base)
        ```

        === "Example"

            ```shell
            >>> AMM.p_current_down(-47)
            42689325172927310418784
            >>> AMM.p_current_down(-48)
            41839807601986057796621
            >>> AMM.p_current_down(-49)
            41007195430706536064090
            ```


### `p_oracle_up`
!!! description "`AMM.p_oracle_up(n: int256) -> uint256:`"

    Getter for the highest oracle price of the collateral in band `n` when `get_p` = `price_oracle`.

    Returns: highest oracle price (`uint256`).

    | Input | Type    | Description  |
    | ----- | ------- | ------------ |
    | `n`   | `int256`| Band Number. |

    ??? quote "Source code"

        ```vyper 
        @external
        @view
        def p_oracle_up(n: int256) -> uint256:
            """
            @notice Highest oracle price for the band to have liquidity when p = p_oracle
            @param n Band number (can be negative)
            @return Price at 1e18 base
            """
            return self._p_oracle_up(n)

        @internal
        @view
        def _p_oracle_up(n: int256) -> uint256:
            """
            @notice Upper oracle price for the band to have liquidity when p = p_oracle
            @param n Band number (can be negative)
            @return Price at 1e18 base
            """
            # p_oracle_up(n) = p_base * ((A - 1) / A) ** n
            # p_oracle_down(n) = p_base * ((A - 1) / A) ** (n + 1) = p_oracle_up(n+1)
            # return unsafe_div(self._base_price() * self.exp_int(-n * LOG_A_RATIO), 10**18)

            power: int256 = -n * LOG_A_RATIO

            # ((A - 1) / A) ** n = exp(-n * ln(A / (A - 1))) = exp(-n * LOG_A_RATIO)
            ## Exp implementation based on solmate's
            assert power > -41446531673892821376
            assert power < 135305999368893231589

            x: int256 = unsafe_div(unsafe_mul(power, 2**96), 10**18)

            k: int256 = unsafe_div(
                unsafe_add(
                    unsafe_div(unsafe_mul(x, 2**96), 54916777467707473351141471128),
                    2**95),
                2**96)
            x = unsafe_sub(x, unsafe_mul(k, 54916777467707473351141471128))

            y: int256 = unsafe_add(x, 1346386616545796478920950773328)
            y = unsafe_add(unsafe_div(unsafe_mul(y, x), 2**96), 57155421227552351082224309758442)
            p: int256 = unsafe_sub(unsafe_add(y, x), 94201549194550492254356042504812)
            p = unsafe_add(unsafe_div(unsafe_mul(p, y), 2**96), 28719021644029726153956944680412240)
            p = unsafe_add(unsafe_mul(p, x), (4385272521454847904659076985693276 * 2**96))

            q: int256 = x - 2855989394907223263936484059900
            q = unsafe_add(unsafe_div(unsafe_mul(q, x), 2**96), 50020603652535783019961831881945)
            q = unsafe_sub(unsafe_div(unsafe_mul(q, x), 2**96), 533845033583426703283633433725380)
            q = unsafe_add(unsafe_div(unsafe_mul(q, x), 2**96), 3604857256930695427073651918091429)
            q = unsafe_sub(unsafe_div(unsafe_mul(q, x), 2**96), 14423608567350463180887372962807573)
            q = unsafe_add(unsafe_div(unsafe_mul(q, x), 2**96), 26449188498355588339934803723976023)

            exp_result: uint256 = shift(
                unsafe_mul(convert(unsafe_div(p, q), uint256), 3822833074963236453042738258902158003155416615667),
                unsafe_sub(k, 195))
            ## End exp
            assert exp_result > 1000  # dev: limit precision of the multiplier
            return unsafe_div(self._base_price() * exp_result, 10**18)
        ```

    === "Example"

        ```shell
        >>> AMM.p_oracle_up(-47)
        42782025149416813700210
        >>> AMM.p_oracle_up(-48)
        43214166817592740669693
        >>> AMM.p_oracle_up(-49)
        43650673553123980039273
        ```


### `p_oracle_down`
!!! description "`AMM.p_oracle_down(n: int256) -> uint256:`"

    Getter for the lowest oracle price for band `n` to have liquidity when `get_p` = `price_oracle`.

    Returns: lowest oracle price (`uint256`).

    | Input | Type    | Description  |
    | ----- | ------- | ------------ |
    | `n`   | `int256`| Band Number. |

    ??? quote "Source code"

        ```vyper 
        @external
        @view
        def p_oracle_down(n: int256) -> uint256:
            """
            @notice Lowest oracle price for the band to have liquidity when p = p_oracle
            @param n Band number (can be negative)
            @return Price at 1e18 base
            """
            return self._p_oracle_up(n + 1)

        @internal
        @view
        def _p_oracle_up(n: int256) -> uint256:
            """
            @notice Upper oracle price for the band to have liquidity when p = p_oracle
            @param n Band number (can be negative)
            @return Price at 1e18 base
            """
            # p_oracle_up(n) = p_base * ((A - 1) / A) ** n
            # p_oracle_down(n) = p_base * ((A - 1) / A) ** (n + 1) = p_oracle_up(n+1)
            # return unsafe_div(self._base_price() * self.exp_int(-n * LOG_A_RATIO), 10**18)

            power: int256 = -n * LOG_A_RATIO

            # ((A - 1) / A) ** n = exp(-n * A / (A - 1)) = exp(-n * LOG_A_RATIO)
            ## Exp implementation based on solmate's
            assert power > -42139678854452767551
            assert power < 135305999368893231589

            x: int256 = unsafe_div(unsafe_mul(power, 2**96), 10**18)

            k: int256 = unsafe_div(
                unsafe_add(
                    unsafe_div(unsafe_mul(x, 2**96), 54916777467707473351141471128),
                    2**95),
                2**96)
            x = unsafe_sub(x, unsafe_mul(k, 54916777467707473351141471128))

            y: int256 = unsafe_add(x, 1346386616545796478920950773328)
            y = unsafe_add(unsafe_div(unsafe_mul(y, x), 2**96), 57155421227552351082224309758442)
            p: int256 = unsafe_sub(unsafe_add(y, x), 94201549194550492254356042504812)
            p = unsafe_add(unsafe_div(unsafe_mul(p, y), 2**96), 28719021644029726153956944680412240)
            p = unsafe_add(unsafe_mul(p, x), (4385272521454847904659076985693276 * 2**96))

            q: int256 = x - 2855989394907223263936484059900
            q = unsafe_add(unsafe_div(unsafe_mul(q, x), 2**96), 50020603652535783019961831881945)
            q = unsafe_sub(unsafe_div(unsafe_mul(q, x), 2**96), 533845033583426703283633433725380)
            q = unsafe_add(unsafe_div(unsafe_mul(q, x), 2**96), 3604857256930695427073651918091429)
            q = unsafe_sub(unsafe_div(unsafe_mul(q, x), 2**96), 14423608567350463180887372962807573)
            q = unsafe_add(unsafe_div(unsafe_mul(q, x), 2**96), 26449188498355588339934803723976023)

            exp_result: uint256 = shift(
                unsafe_mul(convert(unsafe_div(p, q), uint256), 3822833074963236453042738258902158003155416615667),
                unsafe_sub(k, 195))
            ## End exp
            return unsafe_div(self._base_price() * exp_result, 10**18)
        ```

    === "Example"

        ```shell
        >>> AMM.p_oracle_down(-47)
        42354204897922645990019
        >>> AMM.p_oracle_down(-48)
        42782025149416813700210
        >>> AMM.p_oracle_down(-49)
        43214166817592740669693
        ```


### `get_p` 
!!! description "`AMM.get_p() -> uint256:`"

    Function to get the current AMM price in the active band.

    Returns: current AMM price (`uint256`).

    ??? quote "Source code"

        ```vyper
        @external
        @view
        @nonreentrant('lock')
        def get_p() -> uint256:
            """
            @notice Get current AMM price in active_band
            @return Current price at 1e18 base
            """
            n: int256 = self.active_band
            return self._get_p(n, self.bands_x[n], self.bands_y[n])

        @internal
        @view
        def _get_p(n: int256, x: uint256, y: uint256) -> uint256:
            """
            @notice Get current AMM price in band
            @param n Band number
            @param x Amount of stablecoin in band
            @param y Amount of collateral in band
            @return Current price at 1e18 base
            """
            p_o_up: uint256 = self._p_oracle_up(n)
            p_o: uint256 = self._price_oracle_ro()[0]
            assert p_o_up != 0

            # Special cases
            if x == 0:
                if y == 0:  # x and y are 0
                    # Return mid-band
                    return unsafe_div((unsafe_div(unsafe_div(p_o**2, p_o_up) * p_o, p_o_up) * A), Aminus1)
                # if x == 0: # Lowest point of this band -> p_current_down
                return unsafe_div(unsafe_div(p_o**2, p_o_up) * p_o, p_o_up)
            if y == 0: # Highest point of this band -> p_current_up
                p_o_up = unsafe_div(p_o_up * Aminus1, A)  # now this is _actually_ p_o_down
                return unsafe_div(p_o**2 / p_o_up * p_o, p_o_up)

            y0: uint256 = self._get_y0(x, y, p_o, p_o_up)
            # ^ that call also checks that p_o != 0

            # (f(y0) + x) / (g(y0) + y)
            f: uint256 = unsafe_div(A * y0 * p_o, p_o_up) * p_o
            g: uint256 = unsafe_div(Aminus1 * y0 * p_o_up, p_o)
            return (f + x * 10**18) / (g + y)
        ```

    === "Example"

        ```shell
        >>> AMM.get_p()
        42233442666531455461678
        ```


### `price_oracle` 
!!! description "`AMM.price_oracle() -> uint256: view`"

    Getter for the value (price) of the external oracle contract `price_oracle_contract`.

    Returns: external oracle price (`uint256`).

    ??? quote "Source code"

        ```vyper 
        @external
        @view
        def price_oracle() -> uint256:
            """
            @notice Value returned by the external price oracle contract
            """
            return self._price_oracle_ro()[0]

        @internal
        @view
        def _price_oracle_ro() -> uint256[2]:
            return self.limit_p_o(price_oracle_contract.price())

        @internal
        @view
        def limit_p_o(p: uint256) -> uint256[2]:
            """
            @notice Limits oracle price to avoid losses at abrupt changes, as well as calculates a dynamic fee.
                If we consider oracle_change such as:
                    ratio = p_new / p_old
                (let's take for simplicity p_new < p_old, otherwise we compute p_old / p_new)
                Then if the minimal AMM fee will be:
                    fee = (1 - ratio**3),
                AMM will not have a loss associated with the price change.
                However, over time fee should still go down (over PREV_P_O_DELAY), and also ratio should be limited
                because we don't want the fee to become too large (say, 50%) which is achieved by limiting the instantaneous
                change in oracle price.

            @return (limited_price_oracle, dynamic_fee)
            """
            p_new: uint256 = p
            dt: uint256 = unsafe_sub(PREV_P_O_DELAY, min(PREV_P_O_DELAY, block.timestamp - self.prev_p_o_time))
            ratio: uint256 = 0

            # ratio = 1 - (p_o_min / p_o_max)**3

            if dt > 0:
                old_p_o: uint256 = self.old_p_o
                old_ratio: uint256 = self.old_dfee
                # ratio = p_o_min / p_o_max
                if p > old_p_o:
                    ratio = unsafe_div(old_p_o * 10**18, p)
                    if ratio < 10**36 / MAX_P_O_CHG:
                        p_new = unsafe_div(old_p_o * MAX_P_O_CHG, 10**18)
                        ratio = 10**36 / MAX_P_O_CHG
                else:
                    ratio = unsafe_div(p * 10**18, old_p_o)
                    if ratio < 10**36 / MAX_P_O_CHG:
                        p_new = unsafe_div(old_p_o * 10**18, MAX_P_O_CHG)
                        ratio = 10**36 / MAX_P_O_CHG

                # ratio is lower than 1e18
                # Also guaranteed to be limited, therefore can have all ops unsafe
                ratio = min(
                    unsafe_div(
                        unsafe_mul(
                            unsafe_sub(unsafe_add(10**18, old_ratio), unsafe_div(pow_mod256(ratio, 3), 10**36)),  # (f' + (1 - r**3))
                            dt),                                                                                  # * dt / T
                    PREV_P_O_DELAY),
                10**18 - 1)

            return [p_new, ratio]
        ```

    === "Example"

        ```shell
        >>> AMM.price_oracle()
        42793985938449777891127
        ```


### `price_oracle_contract`
!!! description "`AMM.price_oracle_contract() -> uint256: view`"

    Getter for the price oracle contract.

    Returns: oracle contract (`address`).

    ??? quote "Source code"

        ```vyper 
        price_oracle_contract: public(PriceOracle)

        @external
        def __init__(
                _borrowed_token: address,
                _borrowed_precision: uint256,
                _collateral_token: address,
                _collateral_precision: uint256,
                _A: uint256,
                _sqrt_band_ratio: uint256,
                _log_A_ratio: int256,
                _base_price: uint256,
                fee: uint256,
                admin_fee: uint256,
                _price_oracle_contract: address,
            ):
            """
            @notice LLAMMA constructor
            @param _borrowed_token Token which is being borrowed
            @param _collateral_token Token used as collateral
            @param _collateral_precision Precision of collateral: we pass it because we want the blueprint to fit into bytecode
            @param _A "Amplification coefficient" which also defines density of liquidity and band size. Relative band size is 1/_A
            @param _sqrt_band_ratio Precomputed int(sqrt(A / (A - 1)) * 1e18)
            @param _log_A_ratio Precomputed int(ln(A / (A - 1)) * 1e18)
            @param _base_price Typically the initial crypto price at which AMM is deployed. Will correspond to band 0
            @param fee Relative fee of the AMM: int(fee * 1e18)
            @param admin_fee Admin fee: how much of fee goes to admin. 50% === int(0.5 * 1e18)
            @param _price_oracle_contract External price oracle which has price() and price_w() methods
                which both return current price of collateral multiplied by 1e18
            """

            ...

            self.price_oracle_contract = PriceOracle(_price_oracle_contract)
            
            ...
        ```

    === "Example"

        ```shell
        >>> AMM.price_oracle_contract()
        '0xbeF434E2aCF0FBaD1f0579d2376fED0d1CfC4217'
        ```


---


## **Fees and Interest Rates**

Just like all Curve pools, there are three different kinds of fees: 

- **Regular swap fees** are charged when tokens within the AMM are exchanged.
- **Admin fees** determine the percentage of the "total fees" that are ultimately distributed to veCRV holders.
- **Interest rate** which is charged on the borrowed assets tokens.

If there are accumulated admin fees, they cannot be claimed separately. Instead, they can only be claimed by also claiming the interest rate fees at the same time. This is accomplished by calling `collect_fee()` on the Controller.


### `fee`
!!! description "`AMM.fee() -> uint256: view`"

    Getter for the exchange fee of the AMM.

    Returns: fee (`uint256`).

    ??? quote "Source code"

        ```vyper
        fee: public(uint256)

        @external
        def __init__(
                _borrowed_token: address,
                _borrowed_precision: uint256,
                _collateral_token: address,
                _collateral_precision: uint256,
                _A: uint256,
                _sqrt_band_ratio: uint256,
                _log_A_ratio: int256,
                _base_price: uint256,
                fee: uint256,
                admin_fee: uint256,
                _price_oracle_contract: address,
            ):
            """
            @notice LLAMMA constructor
            @param _borrowed_token Token which is being borrowed
            @param _collateral_token Token used as collateral
            @param _collateral_precision Precision of collateral: we pass it because we want the blueprint to fit into bytecode
            @param _A "Amplification coefficient" which also defines density of liquidity and band size. Relative band size is 1/_A
            @param _sqrt_band_ratio Precomputed int(sqrt(A / (A - 1)) * 1e18)
            @param _log_A_ratio Precomputed int(ln(A / (A - 1)) * 1e18)
            @param _base_price Typically the initial crypto price at which AMM is deployed. Will correspond to band 0
            @param fee Relative fee of the AMM: int(fee * 1e18)
            @param admin_fee Admin fee: how much of fee goes to admin. 50% === int(0.5 * 1e18)
            @param _price_oracle_contract External price oracle which has price() and price_w() methods
                which both return current price of collateral multiplied by 1e18
            """

            ...

            self.fee = fee

            ...

        ```

    === "Example"

        ```shell
        >>> AMM.fee()
        6000000000000000
        ```


### `dynamic_fee`
!!! description "`AMM.dynamic_fee() -> uint256: view`"

    Getter for the dynamic fee of the AMM. Dynamic fee is set to the maixmum of either `fee` or `_price_oracle_ro()[1]`.

    Returns: dynamic fee (`uint256`).

    ??? quote "Source code"

        ```vyper
        @external
        @view
        def dynamic_fee() -> uint256:
            """
            @notice Dynamic fee which accounts for price_oracle shifts
            """
            return max(self.fee, self._price_oracle_ro()[1])

        @internal
        @view
        def _price_oracle_ro() -> uint256[2]:
            return self.limit_p_o(price_oracle_contract.price())

        @internal
        @view
        def limit_p_o(p: uint256) -> uint256[2]:
            """
            @notice Limits oracle price to avoid losses at abrupt changes, as well as calculates a dynamic fee.
                If we consider oracle_change such as:
                    ratio = p_new / p_old
                (let's take for simplicity p_new < p_old, otherwise we compute p_old / p_new)
                Then if the minimal AMM fee will be:
                    fee = (1 - ratio**3),
                AMM will not have a loss associated with the price change.
                However, over time fee should still go down (over PREV_P_O_DELAY), and also ratio should be limited
                because we don't want the fee to become too large (say, 50%) which is achieved by limiting the instantaneous
                change in oracle price.

            @return (limited_price_oracle, dynamic_fee)
            """
            p_new: uint256 = p
            dt: uint256 = unsafe_sub(PREV_P_O_DELAY, min(PREV_P_O_DELAY, block.timestamp - self.prev_p_o_time))
            ratio: uint256 = 0

            # ratio = 1 - (p_o_min / p_o_max)**3

            if dt > 0:
                old_p_o: uint256 = self.old_p_o
                old_ratio: uint256 = self.old_dfee
                # ratio = p_o_min / p_o_max
                if p > old_p_o:
                    ratio = unsafe_div(old_p_o * 10**18, p)
                    if ratio < 10**36 / MAX_P_O_CHG:
                        p_new = unsafe_div(old_p_o * MAX_P_O_CHG, 10**18)
                        ratio = 10**36 / MAX_P_O_CHG
                else:
                    ratio = unsafe_div(p * 10**18, old_p_o)
                    if ratio < 10**36 / MAX_P_O_CHG:
                        p_new = unsafe_div(old_p_o * 10**18, MAX_P_O_CHG)
                        ratio = 10**36 / MAX_P_O_CHG

                # ratio is lower than 1e18
                # Also guaranteed to be limited, therefore can have all ops unsafe
                ratio = min(
                    unsafe_div(
                        unsafe_mul(
                            unsafe_sub(unsafe_add(10**18, old_ratio), unsafe_div(pow_mod256(ratio, 3), 10**36)),  # (f' + (1 - r**3))
                            dt),                                                                                  # * dt / T
                    PREV_P_O_DELAY),
                10**18 - 1)

            return [p_new, ratio]
        ```

    === "Example"

        ```shell
        >>> AMM.dynamic_fee()
        6000000000000000
        ```


### `set_fee`
!!! description "`AMM.set_fee(fee: uint256):`"

    !!!guard "Guarded Method" 
        This function is only callable by the `admin` of the contract, which is the Controller.

    Function to set a new AMM exchange fee. 

    Emits: `SetFee`

    | Input | Type      | Description        |
    | ----- | --------- | ------------------ |
    | `fee` | `uint256` | Fee (1e18 == 100%). |

    ??? quote "Source code"

        ```vyper 
        event SetFee:
            fee: uint256

        fee: public(uint256)

        @external
        @nonreentrant('lock')
        def set_fee(fee: uint256):
            """
            @notice Set AMM fee
            @param fee Fee where 1e18 == 100%
            """
            assert msg.sender == self.admin
            self.fee = fee
            log SetFee(fee)
        ```

    === "Example"

        ```shell
        >>> AMM.set_fee(7000000000000000)
        ```


### `admin_fee`
!!! description "`AMM.admin_fee() -> uint256: view`"

    Getter for the admin fee of the AMM. This value represents the portion of how much of `fee` is awarded to veCRV holders. Currently, the admin fees of the AMMs are set to 1 (1 / 1e18), making them virtually nonexistent. The reason for this is to increase oracle manipulation resistance.

    Returns: admin fee (`uint256`).

    ??? quote "Source code"

        ```vyper 
        admin_fee: public(uint256)

        @external
        def __init__(
                _borrowed_token: address,
                _borrowed_precision: uint256,
                _collateral_token: address,
                _collateral_precision: uint256,
                _A: uint256,
                _sqrt_band_ratio: uint256,
                _log_A_ratio: int256,
                _base_price: uint256,
                fee: uint256,
                admin_fee: uint256,
                _price_oracle_contract: address,
            ):
            """
            @notice LLAMMA constructor
            @param _borrowed_token Token which is being borrowed
            @param _collateral_token Token used as collateral
            @param _collateral_precision Precision of collateral: we pass it because we want the blueprint to fit into bytecode
            @param _A "Amplification coefficient" which also defines density of liquidity and band size. Relative band size is 1/_A
            @param _sqrt_band_ratio Precomputed int(sqrt(A / (A - 1)) * 1e18)
            @param _log_A_ratio Precomputed int(ln(A / (A - 1)) * 1e18)
            @param _base_price Typically the initial crypto price at which AMM is deployed. Will correspond to band 0
            @param fee Relative fee of the AMM: int(fee * 1e18)
            @param admin_fee Admin fee: how much of fee goes to admin. 50% === int(0.5 * 1e18)
            @param _price_oracle_contract External price oracle which has price() and price_w() methods
                which both return current price of collateral multiplied by 1e18
            """

            ...

            self.admin_fee = admin_fee

            ...
        ```

    === "Example"

        ```shell
        >>> AMM.admin_fee()
        1
        ```


### `admin_fees_x`
!!! description "`AMM.admin_fees_x() -> uint256: view`"

    Getter for the accured admin fees of the borrowed token since the last fee collection.

    Returns: accured fees (`uint256`).

    ??? quote "Source code"

        ```vyper
        admin_fees_x: public(uint256)
        ```

    === "Example"

        ```shell
        >>> AMM.admin_fees_x()
        327
        ```


### `admin_fees_y`
!!! description "`AMM.admin_fees_y() -> uint256: view`"

    Getter for the accrued admin fees of the collateral token since the last fee collection.

    Returns: accured fees (`uint256`).

    ??? quote "Source code"

        ```vyper
        admin_fees_y: public(uint256)
        ```

    === "Example"

        ```shell
        >>> AMM.admin_fees_y()
        0
        ```


### `set_admin_fee`
!!! description "`AMM.set_admin_fee(fee: uint256):`"

    !!!guard "Guarded Method" 
        This function is only callable by the `admin` of the contract, which is the Controller.

    Function to set a new admin fee of the AMM.

    Emits: `SetAdminFee`

    | Input | Type      | Description           |
    | ----- | --------- | --------------------- |
    | `fee` | `uint256` | Admin Fee (1e18 == 100%). |

    ??? quote "Source code"

        ```vyper 
        event SetAdminFee:
            fee: uint256

        admin_fee: public(uint256)

        @external
        @nonreentrant('lock')
        def set_admin_fee(fee: uint256):
            """
            @notice Set admin fee - fraction of the AMM fee to go to admin
            @param fee Admin fee where 1e18 == 100%
            """
            assert msg.sender == self.admin
            self.admin_fee = fee
            log SetAdminFee(fee)
        ```

    === "Example"

        ```shell
        >>> AMM.set_admin_fee(2)
        ```


### `reset_admin_fee`
!!! description "`AMM.reset_admin_fees():`"

    !!!guard "Guarded Method" 
        This function is only callable by the `admin` of the contract, which is the Controller.

    Function to reset the accumulated admin fees (`admin_fees_x` and `admin_fees_y`) to zero. This function is automatically called when `collect_fees()` via the Controller is called.

    ??? quote "Source code"

        ```vyper 
        @external
        @nonreentrant('lock')
        def reset_admin_fees():
            """
            @notice Zero out AMM fees collected
            """
            assert msg.sender == self.admin
            self.admin_fees_x = 0
            self.admin_fees_y = 0
        ```

    === "Example"

        ```shell
        >>> AMM.admin_fees_x()
        327
        >>> AMM.admin_fees_y()
        0
        >>> Controller.collect_fees()   # this function calls `reset_admin_fees`
        >>> AMM.admin_fees_x()
        0
        >>> AMM.admin_fees_y()
        0
        ```


### `rate`
!!! description "`AMM.rate() -> uint256: view`"

    Getter for the current interest/borrow rate. The rate is based on the monetary policy contract.

    Returns: interest rate (`uint256`).

    ??? quote "Source code"

        ```vyper
        rate: public(uint256)
        ```

    === "Example"

        ```shell
        >>> AMM.rate()
        2193424322
        ```

    !!!note "Annualized rate"
        Annualized interest rate is calculated by $1 + (\frac{rate}{1e18})^{86400*365} -1$.


### `get_rate_mul`
!!! description "`AMM.get_rate_mul() -> uint256: view`"

    Getter for the interest rate multiplier, which is $1.0 + \int \text{rate}(t) \, dt$.

    Returns: interest rate multiplier (`uint256`).

    ??? quote "Source code"

        ```vyper
        rate: public(uint256)
        rate_time: uint256
        rate_mul: uint256

        @external
        @view
        def get_rate_mul() -> uint256:
            """
            @notice Rate multiplier which is 1.0 + integral(rate, dt)
            @return Rate multiplier in units where 1.0 == 1e18
            """
            return self._rate_mul()

        @internal
        @view
        def _rate_mul() -> uint256:
            """
            @notice Rate multiplier which is 1.0 + integral(rate, dt)
            @return Rate multiplier in units where 1.0 == 1e18
            """
            return unsafe_div(self.rate_mul * (10**18 + self.rate * (block.timestamp - self.rate_time)), 10**18)
        ```

    === "Example"

        ```shell
        >>> AMM.get_rate_mul()
        1029018787268879746
        ```


### `set_rate`
!!! description "`AMM.set_rate(rate: uint256) -> uint256:`"

    !!!guard "Guarded Method" 
        This function is only callable by the `admin` of the contract, which is the Controller.

    Function to update the interest rate. The rate is always updated whenever the internal `_save_rate` function within the Controller contract is called (e.g., when a new loan is created or assets are repaid). The new rate is calculated in `get_rate_mul()`.

    Returns: rate multiplier (`uint256`).

    Emits: `SetRate`

    | Input  | Type      | Description  |
    | ------ | --------- | ------------ |
    | `rate` | `uint256` | New rate.    |

    ??? quote "Source code"

        ```vyper
        event SetRate:
            rate: uint256
            rate_mul: uint256
            time: uint256
            
        @external
        @nonreentrant('lock')
        def set_rate(rate: uint256) -> uint256:
            """
            @notice Set interest rate. That affects the dependence of AMM base price over time
            @param rate New rate in units of int(fraction * 1e18) per second
            @return rate_mul multiplier (e.g. 1.0 + integral(rate, dt))
            """
            assert msg.sender == self.admin
            rate_mul: uint256 = self._rate_mul()
            self.rate_mul = rate_mul
            self.rate_time = block.timestamp
            self.rate = rate
            log SetRate(rate, rate_mul, block.timestamp)
            return rate_mul

        @internal
        @view
        def _rate_mul() -> uint256:
            """
            @notice Rate multiplier which is 1.0 + integral(rate, dt)
            @return Rate multiplier in units where 1.0 == 1e18
            """
            return unsafe_div(self.rate_mul * (10**18 + self.rate * (block.timestamp - self.rate_time)), 10**18)
        ```

    === "Example"

        ```shell
        >>> AMM.set_rate(4386848644)
        ```


---



## **Contract Info Methods**

### `coins`
!!! description "`AMM.coins(i: uint256) -> address`"

    Getter for the coins in the AMM, with `i = 0` as the borrowed token and `i = 1` as the collateral token.

    Returns: coin at index `i`.

    | Input | Type      | Description   |
    | ----- | --------- | ------------- |
    | `i`   | `uint256` | Coin Index.  |

    ??? quote "Source code"

        ```vyper
        BORROWED_TOKEN: immutable(ERC20)    # x
        COLLATERAL_TOKEN: immutable(ERC20)  # y

        @external
        @pure
        def coins(i: uint256) -> address:
            return [BORROWED_TOKEN.address, COLLATERAL_TOKEN.address][i]
        ```

    === "Example"

        ```shell
        >>> AMM.coins(0)
        '0xf939E0A03FB07F59A73314E73794Be0E57ac1b4E'
        >>> AMM.coins(1)
        '0x18084fbA666a33d37592fA2633fD49a74DD93a88'
        ```



## **Admin Ownership**

The admin of each AMM is the corresponding Controller contract. The admin can only be set once, which is done when deploying the AMM. Therefore, the `admin` cannot be changed.


### `admin`
!!! description "`AMM.admin() -> address: view`"

    Getter for the admin of the contract, which is the corresponding Controller.

    Returns: admin (`address`).

    ??? quote "Source code"

        ```vyper 
        admin: public(address)
        ```

    === "Example"

        ```shell
        >>> AMM.admin()
        '0x1C91da0223c763d2e0173243eAdaA0A2ea47E704'
        ```


### `set_admin`
!!! description "`AMM.set_admin(_admin: address):`"

    !!!guard "Guarded Method" 
        This function is only callable when `admin` is set to `ZERO_ADDRESS`. This condition was met at deployment, but after setting the admin for the first time, it cannot be changed. Admin for the AMM is always the corresponding Controller.

    Function to set the admin of the AMM. Maximum approval is given to the Controller in order for it to effectively call functions such as `deposit_range` and `withdraw`. This is achieved through an extra `approve_max` function, because it consumes less byte space compared to calling it directly.

    | Input    | Type      | Description      |
    | -------- | --------- | ---------------- |
    | `_admin` | `address` | Admin address.   |

    ??? quote "Source code"

        ```vyper 
        @external
        def set_admin(_admin: address):
            """
            @notice Set admin of the AMM. Typically it's a controller (unless it's tests)
            @param _admin Admin address
            """
            assert self.admin == empty(address)
            self.admin = _admin
            self.approve_max(BORROWED_TOKEN, _admin)
            self.approve_max(COLLATERAL_TOKEN, _admin)

        @internal
        def approve_max(token: ERC20, _admin: address):
            """
            Approve max in a separate function because it uses less bytespace than
            calling directly, and gas doesn't matter in set_admin
            """
            assert token.approve(_admin, max_value(uint256), default_return_value=True)
        ```

    === "Example"

        ```shell
        >>> AMM.set_admin(vitalik.eth)
        ```


---


## **Callbacks**


### `liquidity_mining_callback`
!!! description "`AMM.liquidity_mining_callback() -> address: view`"

    Getter for the liquidity mining callback address.

    Returns: liquidity mining callback contract (`address`).

    ??? quote "Source code"

        ```vyper 
        liquidity_mining_callback: public(LMGauge)
        ```

    === "Example"

        ```shell
        >>> AMM.liquidity_mining_callback()
        0x0000000000000000000000000000000000000000
        ```


### `set_callback`
!!! description "`AMM.set_callback(liquidity_mining_callback: LMGauge):`"

    !!!guard "Guarded Method" 
        This function is only callable by the `admin` of the contract, which is the Controller.

    Function to set the liquidity mining callback.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `liquidity_mining_callback` |  `LMGauge` | Liquidity Mining Gauge Address |


    ??? quote "Source code"

        ```vyper
        interface LMGauge:
            def callback_collateral_shares(n: int256, collateral_per_share: DynArray[uint256, MAX_TICKS_UINT]): nonpayable
            def callback_user_shares(user: address, n: int256, user_shares: DynArray[uint256, MAX_TICKS_UINT]): nonpayable

        liquidity_mining_callback: public(LMGauge)

        # nonreentrant decorator is in Controller which is admin
        @external
        def set_callback(liquidity_mining_callback: LMGauge):
            """
            @notice Set a gauge address with callbacks for liquidity mining for collateral
            @param liquidity_mining_callback Gauge address
            """
            assert msg.sender == self.admin
            self.liquidity_mining_callback = liquidity_mining_callback
        ```

    === "Example"

        ```shell
        >>> soon
        ```