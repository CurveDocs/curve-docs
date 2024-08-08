<h1>LLAMMA.vy</h1>

LLAMMA (Lending Liquidating Automated Market Maker Algorithm) is the **market-making contract that rebalances the collateral of a loan**. It is an algorithm implemented into a smart contract which is **responsible for liquidating and de-liquidating collateral based on market conditions** through arbitrage traders. Each individual market has its own AMM **containing the collateral and borrowable asset**. E.g. the AMM of the [ETH<>crvUSD](https://etherscan.io/address/0x1681195c176239ac5e72d9aebacf5b2492e0c4ee) contains of `ETH` and `crvUSD`.

!!!info "Getting familiar with LLAMMA"
    Before interacting with the `LLAMMA` contract, it is highly advised to read the following section go gain a broader understanding of the system: [LLAMMA Explainer](todo).


| Glossary             | Description |
| -------------------- | ---------------------------------------------------------------------------- |
| `ticks`, `bands`     | Price ranges where liquidity is deposited.                                   |
| `x`                  | Coin which is being borrowed, typically a stablecoin.                        |
| `y`                  | Collateral coin.                                                             |
| `A`                  | Amplification, the measure of how concentrated the tick is.                  |
| `rate`               | Interest rate.                                                               |
| `rate_mul`           | Rate multiplier, 1 + integral(rate * dt).                                    |
| `active_band`        | Current band. Other bands are either in one or the other coin, but not both. |
| `min_band`           | Bands below this are definitely empty.                                       |
| `max_band`           | Bands above this are definitely empty.                                       |
| `bands_x[n]`, `bands_y[n]` | Amounts of coin x or y deposited in band n.                            |
| `user_shares[user,n] / total_shares[n]` | Fraction of the n'th band owned by a user.                |
| `p_oracle`           | External oracle price (can be from another AMM).                             |
| `p (as in get_p)`    | Current price of AMM. It depends not only on the balances (x,y) in the band and active_band, but also on p_oracle. |
| `p_current_up`, `p_current_down` | The value of p at constant p_oracle when y=0 or x=0 respectively for the band n. |
| `p_oracle_up`, `p_oracle_down` | Edges of the band when p=p_oracle (steady state), happen when x=0 or y=0 respectively, for band n. |


---


# **Depositing and Withdrawing Collateral**

Whenever a user performs a collateral-specific action such as creating a new loan or adding more collateral, the collateral asset is deposited or withdrawn from the AMM. These functions are only callable by the admin of the AMM, which is the Controller.

*There are two functions to facilitate the depositing or withdrawing of collateral:*

- Collateral is put into bands by calling `deposit_range()`: This function is called by the `Controller` when one of the following functions is called: `_create_loan`, `_add_collateral_borrow`, `repay`, and `repay_extended`.
- Collateral is removed by calling `withdraw()`: This function is called by the `Controller` when one of the following functions is called: `_liquidate`, `_add_collateral_borrow`, `repay`, and `repay_extended`.


### `deposit_range`
!!! description "`LLAMMA.deposit_range(user: address, amount: uint256, n1: int256, n2: int256)`"

    !!!guard "Guarded Method" 
        This function is only callable by the `admin` of the contract, which is the `Controller`.

    Function to deposit collateral `amount` for `user` in the range between the upper band `n1` and the lower band `n2`. Values for `n1` and `n2` are already determined in the `Controller` contract using the internal `_calculate_debt_n1` method.

    Emits: `Deposit`

    | Input    | Type      | Description                       |
    | -------- | --------- | --------------------------------- |
    | `user`   | `address` | User address.                     |
    | `amount` | `uint256` | Amount of collateral to deposit.  |
    | `n1`     | `int256`  | Lower band in the deposit range.  |
    | `n2`     | `int256`  | Upper band in the deposit range.  |

    ??? quote "Source code"

        === "LLAMMA.vy"

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

        === "Controller.vy"

            ```vyper
            @internal
            @view
            def _calculate_debt_n1(collateral: uint256, debt: uint256, N: uint256) -> int256:
                """
                @notice Calculate the upper band number for the deposit to sit in to support
                        the given debt. Reverts if requested debt is too high.
                @param collateral Amount of collateral (at its native precision)
                @param debt Amount of requested debt
                @param N Number of bands to deposit into
                @return Upper band n1 (n1 <= n2) to deposit into. Signed integer
                """
                assert debt > 0, "No loan"
                n0: int256 = AMM.active_band()
                p_base: uint256 = AMM.p_oracle_up(n0)

                # x_effective = y / N * p_oracle_up(n1) * sqrt((A - 1) / A) * sum_{0..N-1}(((A-1) / A)**k)
                # === d_y_effective * p_oracle_up(n1) * sum(...) === y_effective * p_oracle_up(n1)
                # d_y_effective = y / N / sqrt(A / (A - 1))
                y_effective: uint256 = self.get_y_effective(collateral * COLLATERAL_PRECISION, N, self.loan_discount)
                # p_oracle_up(n1) = base_price * ((A - 1) / A)**n1

                # We borrow up until min band touches p_oracle,
                # or it touches non-empty bands which cannot be skipped.
                # We calculate required n1 for given (collateral, debt),
                # and if n1 corresponds to price_oracle being too high, or unreachable band
                # - we revert.

                # n1 is band number based on adiabatic trading, e.g. when p_oracle ~ p
                y_effective = y_effective * p_base / (debt + 1)  # Now it's a ratio

                # n1 = floor(log2(y_effective) / self.logAratio)
                # EVM semantics is not doing floor unlike Python, so we do this
                assert y_effective > 0, "Amount too low"
                n1: int256 = self.log2(y_effective)  # <- switch to faster ln() XXX?
                if n1 < 0:
                    n1 -= LOG2_A_RATIO - 1  # This is to deal with vyper's rounding of negative numbers
                n1 /= LOG2_A_RATIO

                n1 = min(n1, 1024 - convert(N, int256)) + n0
                if n1 <= n0:
                    assert AMM.can_skip_bands(n1 - 1), "Debt too high"

                # Let's not rely on active_band corresponding to price_oracle:
                # this will be not correct if we are in the area of empty bands
                assert AMM.p_oracle_up(n1) < AMM.price_oracle(), "Debt too high"

                return n1
            ```


### `withdraw`
!!! description "`LLAMMA.withdraw(user: address, frac: uint256) -> uint256[2]:`"

    !!!guard "Guarded Method" 
        This function is only callable by the `admin` of the contract, which is the `Controller`.

    Function to withdraw liquidity from bands for `user`.

    Returns: amount of x (borrow token) and y (collateral token) withdrawn (`uint256[2]`).

    Emits: `Withdraw`

    | Input      | Type       | Description |
    | ---------- | ---------- | ----------- |
    | `user`     |  `address` | User address. |
    | `frac`     |  `uint256` | Fraction to withdraw (1e18 = 100%). |

    ??? quote "Source code"

        === "LLAMMA.vy"

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


---


# **Exchanging Tokens**

The LLAMMA can be used to exchange tokens, just like any other AMM. This is crucial as arbitrage opportunities are created by the LLAMMA, which can be exploited by buying and selling tokens in the AMM. More information: TODO.

*There are two functions to exchange tokens:*

- `exchange`: Allows users to swap a certain amount of input token `i` for output token `j`.
- `exchange_dy`: Allows users to swap input token `i` for a desired amount of output token `j`.

Besides these two exchange functions, there are plenty of "helper functions" which are definitely of good use for searchers and arbitrageurs.

!!! colab "Google Colab Notebook"
    todo: A Google Colab notebook that showcases the use of `exchange` and `exchange_dy` can be found here: [:simple-googlecolab: Google Colab Notebook](https://colab.research.google.com/drive/1jT8eMgsFNdYIN2EPBeRtJ-SqaJdzYmIe?usp=sharing).


### `exchange`
!!! description "`LLAMMA.exchange(i: uint256, j: uint256, in_amount: uint256, min_amount: uint256, _for: address = msg.sender) -> uint256[2]:`"

    Function to exchange `in_amount` of token `i` for a minimum amount of `min_amount` of token `j`. If the exchange results in less than `min_amount` of tokens, the function call reverts.

    Returns: amount of coins swapped in and out (`uint256`).

    Emits: `TokenExchange`

    | Input        | Type      | Description                                         |
    | ------------ | --------- | --------------------------------------------------- |
    | `i`          | `uint256` | Input coin index.                                   |
    | `j`          | `uint256` | Output coin index.                                  |
    | `in_amount`  | `uint256` | Amount of input coin to swap.                       |
    | `min_amount` | `uint256` | Minimum amount of output coin to get.               |
    | `_for`       | `address` | Address to send coins to. Defaults to `msg.sender`. |

    ??? quote "Source code"

        === "LLAMMA.vy"

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


### `exchange_dy`
!!! description "`LLAMMA.exchange_dy(i: uint256, j: uint256, out_amount: uint256, max_amount: uint256, _for: address = msg.sender) -> uint256[2]:`"
    
    Function to exchange a maximum amount of `max_amount` of input token `i` for a total of `out_amount` of output token `j`. If `max_amount` is not enough to cover the purchase of `out_amount` of tokens, the function will revert.

    Returns: amount of coins swapped in and out (`uint256`).

    Emits: `TokenExchange`

    | Input        | Type      | Description                                          |
    | ------------ | --------- | ---------------------------------------------------- |
    | `i`          | `uint256` | Input coin index.                                    |
    | `j`          | `uint256` | Output coin index.                                   |
    | `out_amount` | `uint256` | Desired amout of output tokens to receive.           |
    | `max_amount` | `uint256` | Maximum amount of input token to use.                |
    | `_for`       | `address` | Address to send coins to (defaults to `msg.sender`). |

    ??? quote "Source code"

        === "LLAMMA.vy"            

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


### `get_dy`
!!! description "`LLAMMA.get_dy(i: uint256, j: uint256, in_amount: uint256) -> uint256:`"

    Function to calculate the amount of output tokens `j` to receive when exchanging for `in_amount` of input token `i`. 

    Returns: out amount (`uint256`).

    | Input       | Type      | Description                    |
    | ----------- | --------- | ------------------------------ |
    | `i`         | `uint256` | Input coin index.              |
    | `j`         | `uint256` | Output coin index.             |
    | `in_amount` | `uint256` | Amount of input coin to swap.  |

    ??? quote "Source code"

        === "LLAMMA.vy"

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
        >>> LLAMMA.get_dy(0, 1, 10**21)  -> swapping 1,000 crvUSD (`i`) for ETH (`j`).
        0.305354737739302832

        >>> LLAMMA.get_dy(1, 0, 10**18)  -> swapping 1 ETH (`j`) for crvUSD (`i`).
        3150.900144377803783784
        ```


### `get_dx`
!!! description "`LLAMMA.get_dx(i: uint256, j: uint256, out_amount: uint256) -> uint256:`"

    Function to calculate the `in_amount` of token `i` required to receive `out_amount` of token `j`.

    Returns: in amount (`uint256`).

    | Input       | Type      | Description                               |
    | ----------- | --------- | ----------------------------------------- |
    | `i`         | `uint256` | Input coin index.                         |
    | `j`         | `uint256` | Output coin index.                        |
    | `out_amount`| `uint256` | Desired amount of output coin to receive. |

    ??? quote "Source code"

        === "LLAMMA.vy"

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

        The function essentially returns how much input tokens (`crvUSD`) are needed to receive `10**18` output tokens (`tBTC`).
        todo: how much crvUSD does a user need to swap in to receive 1 tbtc at the currents pool state?

        ```shell
        >>> LLAMMA.get_dx(0, 1, 10**18)
        3276112209984625364927

        >>> LLAMMA.get_dx(1, 0, 10**21)
        317266677056025978          todo: how much ETH (`j`) do i need to receive 10**21 crvZSD (`i`)
        ```


### `get_dydx`
!!! description "`LLAMMA.get_dydx(i: uint256, j: uint256, out_amount: uint256) -> (uint256, uint256):`"

    Function to calculate both the input amount required and the output amount received when swapping tokens `i` for a specified `out_amount` of token `j`. This function performs similar calculations to `get_dx` but additionally returns the amount of output tokens received.

    Function to calculate the `in_amount` required and `out_amount` received.

    Returns: out and in amount (`uint256`).|

    | Input       | Type      | Description                               |
    | ----------- | --------- | ----------------------------------------- |
    | `i`         | `uint256` | Input coin index.                         |
    | `j`         | `uint256` | Output coin index.                        |
    | `out_amount`| `uint256` | Desired amount of output coin to receive. |

    ??? quote "Source code"

        === "LLAMMA.vy"

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
        >>> LLAMMA.get_dydx(0, 1, 10**18)
        (1000000000000000000, 3275951499856300880467)   todo

        >>> LLAMMA.get_dydx(1, 0, 10**21)
        (1000000000000000000000, 317280848541649185)   todo
        ```


### `get_dxdy`
!!! description "`LLAMMA.get_dxdy(i: uint256, j: uint256, in_amount: uint256) -> (uint256, uint256):`"

    Function to calculate both the input and output amounts when swapping `in_amount` of token `i` for token `j`. This function performs similar calculations to `get_dy` but additionally returns the amount of input tokens used in the swap.

    Returns: in and out amount (`uint256`).

    | Input       | Type      | Description                   |
    | ----------- | --------- | ----------------------------- |
    | `i`         | `uint256` | Input coin index.             |
    | `j`         | `uint256` | Output coin index.            |
    | `in_amount` | `uint256` | Amount of input coin to swap. |

    ??? quote "Source code"

        === "LLAMMA.vy"

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

        todo

        ```shell
        >>> LLAMMA.get_dxdy(0, 1, 10**21)
        (1000000000000000000000, 305269619091735494)

        >>> LLAMMA.get_dxdy(1, 0, 10**18)
        (1000000000000000000, 3151594754708902902339)
        ```


### `get_amount_for_price`
!!! description "`LLAMMA.get_amount_for_price(p: uint256) -> (uint256, bool)`"

    Function to calculate the necessary amount of tokens to be exchanged to achieve the final price `p` in the AMM.

    Returns: The amount to exchange (`uint256`) and a boolean (`bool`). `True` means exchanging the borrowed token for the collateral token to reach the final price `p` (pumping the collateral price). `False` means the opposite (dumping the collateral price).

    | Input | Type      | Description             |
    | ----- | --------- | ----------------------- |
    | `p`   | `uint256` | Final price of the AMM. |

    ??? quote "Source code"

        === "LLAMMA.vy"

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

        - `bool = true`: One needs to exchange borrowed for collateral tokens (to get the price of the collateral **UP**).
        - `bool = false`: One needs to exchange collateral for borrowed tokens (to get the price of the collateral **DOWN**).

        ```shell
        >>> Controller.amm_price()
        3213458506041024105600

        >>> LLAMMA.get_amount_for_price(3213458506041024105600)
        (0, True)                               # no need for any swaps as the price is already where we want it

        >>> LLAMMA.get_amount_for_price(3250000000000000000000)
        (80060004111772800648528, true)         # need to swap around 80k crvUSD for ETH to raise the price of ETH up to 3250 within the AMM

        >>> LLAMMA.get_amount_for_price(3150000000000000000000)
        (42058023845976978330, false)           # need to swap around 42 ETH for crvUSD to dump the price of ETH down to 3150 within the AMM
        ```


---


# **Bands**

*"Each band works like Uniswap V3, concentrating liquidity between two prices, and being all in the collateral at the lower price and all in crvUSD at the higher price. However since the entire interval of prices are aggressively placed with respect to the market (higher than oracle price when it's moving up and lower when it's moving down), each band gets arbed to hold all of either collateral or stablecoin in the opposite manner than expected when LP-ing with Uniswap V3."*[^2]

[^2]: https://github.com/chanhosuh/curvefi-math/blob/master/LLAMMA.ipynb


Bands in LLAMMA function similarly to UniswapV3, concentrating liquidity between two prices. Essentially, a band is a range of prices into which liquidity is deposited. LLAMMA consists of multiple bands, and when creating a loan, liquidity is equally distributed across the number of bands (`N`) chosen when opening the loan using the [`deposit_range`](amm.md#deposit_range) function. The minimum number of bands is 4, and the maximum is 50.

<figure markdown="span">
  ![](../assets/images/llamma/deposit_range.svg){ width="600" }
  <figcaption></figcaption>
</figure>


Each individual band has an upper ([`p_oracle_up`](#p_oracle_up)) and lower ([`p_oracle_down`](#p_oracle_down)) price bound. These prices are not actual AMM prices, but rather thresholds for the bands. A single band is part of the entire liquidation range. When considering all bands combined, where a user has deposited collateral, we essentially get the entire liquidation range. The entire liquidation range is composed of the "smaller" liquidation ranges of the individual bands. For example, a loan with bands spanning from $1000 to $600 would have a total liquidation range from $1000 to $600.


!!!warning ""
    The following sections assume that arbitrage traders are performing their role and arbitraging the bands. In theory, prices can move through bands without any action if arbitrage traders do not capitalize on the opportunity for free money. We assume that arbitrage traders are taking these opportunities and arbitraging the bands accordingly.
    

*There are three possible scenarios for bands regarding their content of assets. The asset composition of the individual bands is dependant on the collateral price bzw. the "liquidation status" of the loan:*

1. **Band contains both collateral and borrowable token:** This indicates that the band is currently in continuous liquidation mode (either being soft-liquidated because the collateral price is decreasing or de-liquidated because the collateral price is increasing). The band in which the collateral price is currently located is defined as the [`active_band`](amm.md#active_band).

    <figure markdown="span">
    ![](../assets/images/llamma/one_band_final.svg){ width="260" }
    <figcaption></figcaption>
    </figure>

2. **Band contains only the collateral token:** This band has not been soft-liquidated. The collateral price is higher than the upper price of the band and is therefore outside the band. The liquidity in this band is untouched. These are the bands above the [`active_band`](amm.md#active_band). If the active band is 0, all bands greater than 0 consist solely of the collateral token.

    <figure markdown="span">
    ![](../assets/images/llamma/two_bands_eth_final.svg){ width="400" }
    <figcaption></figcaption>
    </figure>

3. **Band contains only the borrowable token:** This band has already been soft-liquidated, meaning the collateral price is below the band, and arbitrage trades have already exchanged all the ETH for crvUSD in the band. These are the bands below the [`active_band`](amm.md#active_band). If the active band is 0, all bands less than 0 consist solely of the borrowable token.

    <figure markdown="span">
    ![](../assets/images/llamma/two_bands_crvusd_final.svg){ width="400" }
    <figcaption></figcaption>
    </figure>



*A full set up bands can look the following:* todo: fix graph by adding more bands with gradient

<figure markdown="span">
  ![](../assets/images/llamma/three_bands_final.svg){ width="700" }
  <figcaption></figcaption>
</figure>


*In the code, `x` represents the borrowable token, and `y` the collateral token.*


### `A`
!!! description "`LLAMMA.A() -> uint256: view`"

    Getter for A (amplicitation coefficient). The amplication defines the density of the liquidty and band size. The higher `A`, the smaller are the upper and lower prices of the bands an therefor the more leveraged the AMM within each band. The relative band size is $\frac{1}{A}$.

    Returns: amplification coefficient (`uint256`).

    ??? quote "Source code"

        === "LLAMMA.vy"

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
        >>> LLAMMA.A()
        100
        ```


### `active_band`
!!! description "`LLAMMA.active_band() -> int256: view`"

    Getter for the currently active band, which is the band where `get_p` (collateral price in the AMM) currently is in. Other bands are either fully in the collateral or borrowable token, but not in both.

    - bands > `active_band`: These bands are fully in the borrowable token.
    - bands < `active_band`: These bands are fully in the collateral token.

    Returns: active band (`int256`).

    ??? quote "Source code"

        === "LLAMMA.vy"

            ```vyper 
            active_band: public(int256)
            ```

    === "Example"

        ```shell
        >>> LLAMMA.active_band()
        -40
        ```


### `min_band`
!!! description "`LLAMMA.min_band() -> int256: view`"

    Getter for the minimum band. This is essentially the lowest band where liquidity was deposited into. All bands below are definitely empty.

    Returns: minimum band (`int256`).

    ??? quote "Source code"

        === "LLAMMA.vy"

            ```vyper
            min_band: public(int256)
            ```

    === "Example"

        ```shell
        >>> LLAMMA.min_band()
        -70
        ```


### `max_band`
!!! description "`LLAMMA.max_band() -> int256: view`"

    Getter for the maximum band. thi is the highest band where liquidity was deposited into. All bands above are definitely empty. 

    Returns: maximum band (`int256`).

    ??? quote "Source code"

        === "LLAMMA.vy"

            ```vyper
            max_band: public(int256)
            ```

    === "Example"

        ```shell
        >>> LLAMMA.max_band()
        1043
        ```


### `has_liquidity`
!!! description "`LLAMMA.has_liquidity(user_: address) -> bool`"

    Function to check if `user` has any liquidity in the AMM.

    Returns: true or false (`bool`).

    | Input  | Type      | Description   |
    | ------ | --------- | ------------- |
    | `user` | `address` | User Address. |

    ??? quote "Source code"

        === "LLAMMA.vy"

            ```vyper
            user_shares: HashMap[address, UserTicks]

            struct UserTicks:
                ns: int256  # packs n1 and n2, each is int128
                ticks: uint256[MAX_TICKS/2]  # Share fractions packed 2 per slot

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
        >>> LLAMMA.has_liquidity('0x5A684c08261380B91D8976eDB0cabf87744650a5')
        'True'
        ```


### `bands_x`
!!! description "`LLAMMA.bands_x(arg0: int256) -> uint256: view`"

    Getter for the amount of the borrowable token deposited in a specific band.

    Returns: amount of borrowable token in the band (`uint256`).

    | Input  | Type      | Description         |
    | ------ | --------- | ------------------- |
    | `arg0` | `int256`  | Number of the band. |

    ??? quote "Source code"

        === "LLAMMA.vy"

            ```vyper 
            bands_x: public(HashMap[int256, uint256])
            ```

    === "Example"

        In this example, the `active_band` is `-40`, which consists both of the colltaral and borrowable token. All bands above do not hold any balances of the borrowable token as those bands fully consist of the collateral token. But all bands below are fully in the borrowable token.

        ```shell
        >>> LLAMMA.bands_x(-39)
        0

        >>> LLAMMA.bands_x(-40)
        45065024748584993052511

        >>> LLAMMA.bands_x(-41)
        128175190583901226590255
        ```


### `bands_y`
!!! description "`LLAMMA.bands_y(arg0: int256) -> uint256: view`"

    Getter for the amount of collateral token deposited in band number `arg0`.

    Returns: amount of collateral token in the band (`uint256`).

    | Input  | Type      | Description         |
    | ------ | --------- | ------------------- |
    | `arg0` | `int256`  | Number of the band. |

    ??? quote "Source code"

        === "LLAMMA.vy"

            ```vyper
            bands_y: public(HashMap[int256, uint256])
            ```

    === "Example"

        In this example, the `active_band` is `-40`, which consists both of the colltaral and borrowable token. All bands above do not hold any balances of the borrowable token as those bands fully consist of the collateral token. But all bands below are fully in the borrowable token.

        ```shell
        >>> LLAMMA.bands_x(-39)
        53056498461522064143

        >>> LLAMMA.bands_x(-40)
        29290524643091268376

        >>> LLAMMA.bands_x(-41)
        0
        ```


### `get_xy`
!!! description "`LLAMMA.get_xy(user: address) -> DynArray[uint256, MAX_TICKS_UINT][2]`"

    Function to get the collateral and borrowable token balance of a user across all bands.

    Returns: balance of borrowed and collateral token (`uint256`).

    | Input  | Type      | Description   |
    | ------ | --------- | ------------- |
    | `user` | `address` | User address. |

    ??? quote "Source code"

        === "LLAMMA.vy"

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

        This user uses 4 bands for their loan. The function returns the collateral composition of all bands. In this case, the 4 bands do not hold any borrow token (the first four returned values), but they hold the collateral token (the last four return values). This signals, that user is not is soft-liquidation, as all his bands are still fully allocated in the collateral tokens. 

        **Fictive example:** E.g. if the first band of the loan would have been liquidated and the second band is currently undergoing liquidation, the returned values could look like the second example below. The first band would be fully in the borrow token (because the band as already been soft-liquidated), the second band would be in both, the borrow and collateral token (because the band is currently being liquidated) and the remaining two bands are still fully composited of the collteral token (because these bands have not been liquidated).

        ```shell
        >>> LLAMMA.get_xy('0x5A684c08261380B91D8976eDB0cabf87744650a5') 
        [0, 0, 0, 0][524583942253332472, 525000000000000000, 525000000000000000, 525000000000000000]

        # see fivtive example above
        [1573751826760000000000, 7573751826760000000000, 0, 0] [0, 265000000000000000, 525000000000000000, 525000000000000000]
        ```



### `get_sum_xy`
!!! description "`LLAMMA.get_sum_xy(user: address) -> uint256[2]:`"

    Function to measure the amount of borrow and collateral token a user currently owns inside the AMM. This function does not include the borrowed tokens from the market in any way but rather reflects the current collateral composition summed up across the entire AMM.

    Returns: total borrow token and collateral token (`uint256[2]`).

    | Input   | Type     | Description  |
    | ------- | -------- | ------------ |
    | `user`  | `address`| User address. |

    ??? quote "Source code"

        === "LLAMMA.vy"

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

        This function returns the total balance of the borrow and collateral token across all bands. This essentially equals to the summed up returned values of the `get_xy` method (see above).

        ```shell
        >>> LLAMMA.get_sum_xy('0x5A684c08261380B91D8976eDB0cabf87744650a5')
        [0, 2099583942253332472]
        ```


### `read_user_tick_numbers`
!!! description "`LLAMMA.read_user_tick_numbers(user: address) -> int256[2]:`"

    Getter for the band (tick) numbers of a user's loan. 

    Returns: highest and lowest band (`int256`).

    | Input  | Type      | Description   |
    | ------ | --------- | ------------- |
    | `user` | `address` | User address. |

    ??? quote "Source code"

        === "LLAMMA.vy"

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
        >>> LLAMMA.read_user_tick_numbers('0x5A684c08261380B91D8976eDB0cabf87744650a5')
        [-32, -29]
        ```


### `get_y_up`
!!! description "`LLAMMA.get_y_up(user: address) -> uint256`"

    Function to measure the amount of `y` (collateral token) in band n for `user` if its adiabatically traded near `p_oracle` on the way up.

    Returns: amount of collateral (`uint256`).

    | Input  | Type      | Description   |
    | ------ | --------- | ------------- |
    | `user` | `address` | User address. |

    ??? quote "Source code"

        === "LLAMMA.vy"

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
        >>> LLAMMA.get_y_up('0x5A684c08261380B91D8976eDB0cabf87744650a5')
        2099583942253332471
        ```


### `get_x_down`
!!! description "`LLAMMA.get_x_down(user: address) -> uint256:`"

    Function to measure the amount of x (borrowable token) in band n for `user` if its adiabatically traded down.

    Returns: amount of collateral (`uint256`).

    | Input  | Type      | Description   |
    | ------ | --------- | ------------- |
    | `user` | `address` | User address. |

    ??? quote "Source code"

        === "LLAMMA.vy"

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
        >>> LLAMMA.get_x_down('0x5A684c08261380B91D8976eDB0cabf87744650a5')
        5911655561808789389866
        ```


### `can_skip_bands`
!!! description "`LLAMMA.can_skip_bands(n_end: int256) -> bool`"

    Function to check if there is no liquidity between `active_band` and `n_end`.

    Returns: true or false (`bool`).

    | Input   | Type     | Description                        |
    | ------- | -------- | ---------------------------------- |
    | `n_end` | `int256` | Band number to check until.        |

    ??? quote "Source code"

        === "LLAMMA.vy"

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
        >>> LLAMMA.can_skip_bands(-50)
        'False'
        ```
 

---


# **AMM and Oracle Prices**


todo:
!!!info "A user's loan is only in soft-liquidation when the price oracle is within the bands of the deposited collateral"
    A position enters soft-liquidation mode only when the price oracle falls within a band where the user has deposited collateral. 
    For example, if a user has collateral deposited between bands 10 and 0, they will not enter soft-liquidation as long as the oracle price stays outside these bands. In this scenario, the only "loss" the user faces is the variable interest rate of the market.
    Additionally, there is a rather rare possibility that a user's loan was fully soft-liquidated, resulting in all their collateral being converted to the borrowable asset. In such a case, the user would be out of soft-liquidation because the price oracle is below the lowest band.


*The AMM relies on two different prices:*

Soft- and de-liquidation of a loan only occurrs when the collateral price is within a band the user deposited liquidity into. The AMM creates an arbitrage opportunity by utilizing the following two prices:

- **`price_oracle`**: The collateral price fetched from a price oracle contract.
- **`get_p`**: The price of colalteral in the AMM itself.

When `price_oracle` equals `get_p`, the external oracle price and the AMM price are identical, indicating no need for arbitrage. When the external oracle price diverges, the AMM price `get_p` is adjusted to be more sensitive than the regular `price_oracle`, creating arbitrage opportunities. Essentially, arbitrage traders are incentivized to maintain `get_p = price_oracle` within the LLAMMA.

<figure markdown="span">
  ![](../assets/images/llamma/ramp-cubic.svg){ width="700" }
  <figcaption></figcaption>
</figure>


### `get_p` 
!!! description "`LLAMMA.get_p() -> uint256`"

    Function to get the current collateral price within the AMM. `get_p` in always in the active band (`acitve_band`).

    Returns: collateral price within the AMM (`uint256`).

    ??? quote "Source code"

        === "LLAMMA.vy"

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
        >>> LLAMMA.get_p()
        3215032751001233561432
        ```


### `price_oracle` 
!!! description "`LLAMMA.price_oracle() -> uint256: view`"

    Getter for the collateral price according to an external price oracle contract. The address of the price oracle contract is stored in the `price_oracle_contract` variable.

    Returns: collateral price according to external price oracle (`uint256`).

    ??? quote "Source code"

        === "LLAMMA.vy"

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
        >>> LLAMMA.price_oracle()
        3140087429510122285500
        ```


### `get_base_price`
!!! description "`LLAMMA.get_base_price() -> uint256`"

    Function to get the base price of the AMM which corresponds to band 0. The base price grows over time to account for the interest rate: `BASE_PRICE` (= the 'real' base price when the contract was deployed) is multiplied by `_rate_mul` to do so.

    Returns: base price (`uint256`).

    ??? quote "Source code"

        === "LLAMMA.vy"

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
        >>> LLAMMA.get_base_price()
        2082598343438884801420
        ```


### `p_current_up`
!!! description "`LLAMMA.p_current_up(n: int256) -> uint256`"

    Getter for the highest possible price of the band at the current oracle price.

    Returns: highest possible price (`uint256`).

    | Input | Type    | Description   |
    | ----- | ------- | ------------- |
    | `n`   | `int256`| Band Number.  |

    ??? quote "Source code"

        === "LLAMMA.vy"

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
            >>> LLAMMA.p_current_up(-40)
            3260783573764672399539
            ```


### `p_current_down`
!!! description "`LLAMMA.p_current_down(n: int256) -> uint256`"

    Getter for the lowest possible price of the band at the current oracle price.

    Returns: lowest price (`uint256`) of band `n`.

    | Input | Type    | Description   |
    | ----- | ------- | ------------- |
    | `n`   | `int256`| Band Number.  |

    ??? quote "Source code"

        === "LLAMMA.vy"

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
            >>> LLAMMA.p_current_down(-40)
            3260768088630089780416
            ```


### `p_oracle_up`
!!! description "`LLAMMA.p_oracle_up(n: int256) -> uint256`"

    Getter for the upper price bound of an individual band when `get_p` = `price_oracle`.

    Returns: upper band price (`uint256`).

    | Input | Type    | Description  |
    | ----- | ------- | ------------ |
    | `n`   | `int256`| Band Number. |

    ??? quote "Source code"

        === "LLAMMA.vy"

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
        >>> LLAMMA.p_oracle_down(-40)
        3113143435284666584035
        ```


### `p_oracle_down`
!!! description "`LLAMMA.p_oracle_down(n: int256) -> uint256`"

    Getter for the lower price bound of an individual band when `get_p` = `price_oracle`. This lower bound is calculated in the same way as `p_oracle_up` but for the next band, essentially taking the upper price of band `n + 1`. It calculates \( n + 1 \) because the lower bound of the current band is defined by the upper bound of the next band.

    Returns: lower price bound (`uint256`).

    | Input | Type    | Description  |
    | ----- | ------- | ------------ |
    | `n`   | `int256`| Band Number. |

    ??? quote "Source code"

        === "LLAMMA.vy"

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
        >>> AMM.p_oracle_down(-40)
        3082012397252988332539
        ```


### `price_oracle_contract`
!!! description "`LLAMMA.price_oracle_contract() -> uint256: view`"

    Getter for the price oracle contract which provides the external `price_oracle`.

    Returns: oracle contract (`address`).

    ??? quote "Source code"

        === "LLAMMA.vy"

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
        >>> LLAMMA.price_oracle_contract()
        '0x966cBDeceFB60A289b0460F7638f4A75F432cA06'
        ```


---


# **Fees and Interest Rates**

**There are three different types of "fees" within the AMM:**

- **`fee`**: This is charged on token exchanges within the AMM.
- **`admin_fee`**: This determines the percentage of the total fees that are distributed to veCRV holders.
- **`rate`**: This represents the borrow rate a user pays on their loan.

The interest rate (`rate`) is updated whenever the `_save_rate()` method within the `Controller.vy` contract is called. This method is triggered under several circumstances:

- When a loan is created (`_create_loan`).
- When collateral is added or removed, or more debt is borrowed (`_add_collateral_borrow`).
- When debt is repaid (`repay` or `repay_extended`).
- When a hard liquidation is performed (`_liquidate`).
- When fees are collected (`collect_fees`).


### `fee`
!!! description "`LLAMMA.fee() -> uint256: view`"

    Getter for the fee for exchanging tokens in the AMM. This fee is static and can only be changed by the DAO using the [`set_fee`](#set_fee) function. The fee is denominated to a base of $10^{18}$.

    Returns: fee (`uint256`).

    ??? quote "Source code"

        === "LLAMMA.vy"

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

        The fee value is denominated to a base of $10^{18}$. Therefore, `19000000000000000` corresponds to a fee of `1.9%`.

        ```shell
        >>> LLAMMA.fee()
        19000000000000000
        ```


### `set_fee`
!!! description "`LLAMMA.set_fee(fee: uint256):`"

    !!!guard "Guarded Method" 
        This function is only callable by the `admin` of the contract, which is the `Controller` contract.

    Function to set a new AMM exchange fee. 

    Emits: `SetFee`

    | Input | Type      | Description        |
    | ----- | --------- | ------------------ |
    | `fee` | `uint256` | Fee (1e18 == 100%). |

    ??? quote "Source code"

        === "LLAMMA.vy"

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
        >>> LLAMMA.set_fee(todo)
        ```


### `admin_fee`
!!! description "`LLAMMA.admin_fee() -> uint256: view`"

    Getter for the admin fee of the AMM. This value represents the portion of the `fee` that is awarded to veCRV holders. Currently, the admin fees of the AMMs are set to 1 (1 / 1e18), making them virtually nonexistent. The reason for setting such a small value is to increase resistance to oracle manipulation. Essentially, taking no admin fee ensures that the accumulated fees are distributed among liquidity providers in the AMM (those who provide collateral), which helps offset the losses incurred through soft or de-liquidation and interest rates. Admin fees can be changed by the DAO via the `set_admin_fee` function.

    Returns: admin fee (`uint256`).

    ??? quote "Source code"

        === "LLAMMA.vy"

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
        >>> LLAMMA.admin_fee()
        1
        ```


### `admin_fees_x`
!!! description "`LLAMMA.admin_fees_x() -> uint256: view`"

    Getter for the accured admin fees in form of the borrowed token since the last fee collection.

    Returns: accured fees (`uint256`).

    ??? quote "Source code"

        === "LLAMMA.vy"

            ```vyper
            admin_fees_x: public(uint256)
            ```

    === "Example"

        ```shell
        >>> LLAMMA.admin_fees_x()
        632
        ```


### `admin_fees_y`
!!! description "`LLAMMA.admin_fees_y() -> uint256: view`"

    Getter for the accured admin fees in form of the collateral token since the last fee collection.

    Returns: accured fees (`uint256`).

    ??? quote "Source code"

        === "LLAMMA.vy"

            ```vyper
            admin_fees_y: public(uint256)
            ```

    === "Example"

        ```shell
        >>> LLAMMA.admin_fees_y()
        0
        ```


### `set_admin_fee`
!!! description "`LLAMMA.set_admin_fee(fee: uint256):`"

    !!!guard "Guarded Method" 
        This function is only callable by the `admin` of the contract, which is the `Controller` contract.

    Function to set a new admin fee value. 

    Emits: `SetAdminFee`

    | Input | Type      | Description           |
    | ----- | --------- | --------------------- |
    | `fee` | `uint256` | Admin Fee (1e18 == 100%). |

    ??? quote "Source code"

        === "LLAMMA.vy"

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
        >>> LLAMMA.set_admin_fee(todo)
        ```


### `reset_admin_fee`
!!! description "`LLAMMA.reset_admin_fees()`"

    !!!guard "Guarded Method" 
        This function is only callable by the `admin` of the contract, which is the Controller.

    Function to reset the accumulated admin fees (`admin_fees_x` and `admin_fees_y`) to zero. This function is automatically called when `collect_fees()` via the `Controller` contract is called.

    ??? quote "Source code"

        === "LLAMMA.vy"

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

        === "Controller.vy"

            ```vyper
            @external
            @nonreentrant('lock')
            def collect_fees() -> uint256:
                """
                @notice Collect the fees charged as interest
                """
                _to: address = FACTORY.fee_receiver()
                # AMM-based fees
                borrowed_fees: uint256 = AMM.admin_fees_x()
                collateral_fees: uint256 = AMM.admin_fees_y()
                if borrowed_fees > 0:
                    STABLECOIN.transferFrom(AMM.address, _to, borrowed_fees)
                if collateral_fees > 0:
                    assert COLLATERAL_TOKEN.transferFrom(AMM.address, _to, collateral_fees, default_return_value=True)
                AMM.reset_admin_fees()

                # Borrowing-based fees
                rate_mul: uint256 = self._rate_mul_w()
                loan: Loan = self._total_debt
                loan.initial_debt = loan.initial_debt * rate_mul / loan.rate_mul
                loan.rate_mul = rate_mul
                self._total_debt = loan

                # Amount which would have been redeemed if all the debt was repaid now
                to_be_redeemed: uint256 = loan.initial_debt + self.redeemed
                # Amount which was minted when borrowing + all previously claimed admin fees
                minted: uint256 = self.minted
                # Difference between to_be_redeemed and minted amount is exactly due to interest charged
                if to_be_redeemed > minted:
                    self.minted = to_be_redeemed
                    to_be_redeemed = unsafe_sub(to_be_redeemed, minted)  # Now this is the fees to charge
                    STABLECOIN.transfer(_to, to_be_redeemed)
                    log CollectFees(to_be_redeemed, loan.initial_debt)
                    return to_be_redeemed
                else:
                    log CollectFees(0, loan.initial_debt)
                    return 0
            ```

    === "Example"

        ```shell
        >>> LLAMMA.admin_fees_x()
        327

        >>> LLAMMA.admin_fees_y()
        0

        >>> Controller.collect_fees()   # this function calls `reset_admin_fees`

        >>> LLAMMA.admin_fees_x()
        0

        >>> LLAMMA.admin_fees_y()
        0
        ```


### `rate`
!!! description "`LLAMMA.rate() -> uint256: view`"

    Getter for the current interest rate per second. This rate is determined by the monetary policy contract and can depend on various factors within the contract.

    Returns: interest rate (`uint256`).

    ??? quote "Source code"

        === "LLAMMA.vy"

            ```vyper
            rate: public(uint256)
            ```

    === "Example"

        This is the interest rate per second. The formula for calculating the annualized rate is the following:

        $rate_{\text{annualized}} = \left(1 + \frac{\text{rate}}{10^{18}}\right)^{86400 \times 365} - 1$

        ```shell
        >>> LLAMMA.rate()
        5358112633          # annualized: 0.18789942609 ≈ 18.79%
        ```


### `get_rate_mul`
!!! description "`LLAMMA.get_rate_mul() -> uint256: view`"

    Getter for the interest rate multiplier, which is $1.0 + \int \text{rate}(t) \, dt$.

    Returns: interest rate multiplier (`uint256`).

    ??? quote "Source code"

        === "LLAMMA.vy"

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
        >>> LLAMMA.get_rate_mul()
        1100902413540693190
        ```


### `set_rate`
!!! description "`LLAMMA.set_rate(rate: uint256) -> uint256:`"

    !!!guard "Guarded Method" 
        This function is only callable by the `admin` of the contract, which is the `Controller` contract.

    Function to set the interest rate. The rate is always updated whenever the internal `_save_rate` function within the Controller contract is called (e.g., when a new loan is created or assets are repaid). The new rate is calculated in `get_rate_mul()`.

    Returns: rate multiplier (`uint256`).

    Emits: `SetRate`

    | Input  | Type      | Description  |
    | ------ | --------- | ------------ |
    | `rate` | `uint256` | New rate.    |

    ??? quote "Source code"

        === "LLAMMA.vy"

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
        >>> LLAMMA.set_rate(todo)
        ```


---


## **Admin Ownership**

The `admin` of each AMM is usually set to the corresponding `Controller` contract of the according market. This variable can only be set once and not updated agian as the `set_admin` function checks the follwoing: `assert self.admin == empty(address)`.


The admin can only be set once, which is done when deploying the AMM. Therefore, the `admin` cannot be changed.


### `admin`
!!! description "`LLAMMA.admin() -> address: view`"

    Getter for the admin of the contract, which is the corresponding Controller.

    Returns: admin (`address`).

    ??? quote "Source code"

        === "LLAMMA.vy"

            ```vyper 
            admin: public(address)
            ```

    === "Example"

        ```shell
        >>> LLAMMA.admin()
        '0xA920De414eA4Ab66b97dA1bFE9e6EcA7d4219635'
        ```


### `set_admin`
!!! description "`LLAMMA.set_admin(_admin: address):`"

    !!!guard "Guarded Method" 
        This function is only callable when `admin` is set to `ZERO_ADDRESS`. This condition was met at deployment, but after setting the admin for the first time, it cannot be changed. Admin for the AMM is always the corresponding Controller.

    Function to set the admin of the AMM. Maximum approval is given to the Controller in order for it to effectively call functions such as `deposit_range` and `withdraw`. This is achieved through an extra `approve_max` function, because it consumes less byte space compared to calling it directly.

    | Input    | Type      | Description      |
    | -------- | --------- | ---------------- |
    | `_admin` | `address` | Admin address.   |

    ??? quote "Source code"

        === "LLAMMA.vy"

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
        >>> LLAMMA.set_admin(todo)
        ```


---


# **Contract Info Methods**

### `coins`
!!! description "`LLAMMA.coins(i: uint256) -> address`"

    Getter for the coins in the AMM, with `i = 0` as the borrowed token and `i = 1` as the collateral token.

    Returns: coin (`address`).

    | Input | Type      | Description   |
    | ----- | --------- | ------------- |
    | `i`   | `uint256` | Coin Index.   |

    ??? quote "Source code"

        === "LLAMMA.vy"

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
        >>> LLAMMA.coins(0)
        '0xf939E0A03FB07F59A73314E73794Be0E57ac1b4E'

        >>> LLAMMA.coins(1)
        '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
        ```


### `liquidity_mining_callback`
!!! description "`LLAMMA.liquidity_mining_callback() -> address: view`"

    Getter for the liquidity mining callback address.

    Returns: liquidity mining callback contract (`address`).

    ??? quote "Source code"

        === "LLAMMA.vy"

            ```vyper 
            liquidity_mining_callback: public(LMGauge)
            ```

    === "Example"

        ```shell
        >>> LLAMMA.liquidity_mining_callback()
        0x0000000000000000000000000000000000000000
        ```


### `set_callback`
!!! description "`LLAMMA.set_callback(liquidity_mining_callback: LMGauge):`"

    !!!guard "Guarded Method" 
        This function is only callable by the `admin` of the contract, which is the Controller.

    Function to set the liquidity mining callback.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `liquidity_mining_callback` |  `LMGauge` | Liquidity Mining Gauge Address |

    ??? quote "Source code"

        === "LLAMMA.vy"

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