<h1>Views Contract</h1>

This contract contains **view-only external methods** which can be gas-inefficient when called from smart contracts.

!!!deploy "Contract Source & Deployment"
    Source code available on [GitHub](https://github.com/curvefi/stableswap-ng/blob/bff1522b30819b7b240af17ccfb72b0effbf6c47/contracts/main/CurveStableSwapNGViews.vy).  
    All Views contract deployments can be found in the [Deployment Addresses](../../../references/deployed-contracts.md#stableswap-ng) section.  


## **Token Exchange Methods**

### `get_dx`
!!! description "`StableSwap.get_dx(i: int128, j: int128, dy: uint256, pool: address) -> uint256:`"

    Function to calculate the predicted input amount `i` to receive `dy` of coin `j`.

    Returns: predicted amount of `i` (`uint256`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `i` |  `int128` | index value of input coin |
    | `j` |  `int128` | index value of output coin |
    | `dy` |  `uint256` | amount of output coin received |
    | `pool` |  `address` | pool address |

    ??? quote "Source code"

        ```vyper
        @view
        @external
        def get_dx(i: int128, j: int128, dy: uint256, pool: address) -> uint256:
            """
            @notice Calculate the current input dx given output dy
            @dev Index values can be found via the `coins` public getter method
            @param i Index value for the coin to send
            @param j Index valie of the coin to recieve
            @param dy Amount of `j` being received after exchange
            @return Amount of `i` predicted
            """
            N_COINS: uint256 = StableSwapNG(pool).N_COINS()
            return self._get_dx(i, j, dy, pool, False, N_COINS)

        @view
        @internal
        def _get_dx(
            i: int128,
            j: int128,
            dy: uint256,
            pool: address,
            static_fee: bool,
            N_COINS: uint256
        ) -> uint256:

            rates: DynArray[uint256, MAX_COINS] = empty(DynArray[uint256, MAX_COINS])
            balances: DynArray[uint256, MAX_COINS] = empty(DynArray[uint256, MAX_COINS])
            xp: DynArray[uint256, MAX_COINS] = empty(DynArray[uint256, MAX_COINS])
            rates, balances, xp = self._get_rates_balances_xp(pool, N_COINS)

            amp: uint256 = StableSwapNG(pool).A() * A_PRECISION
            D: uint256 = self.get_D(xp, amp, N_COINS)

            base_fee: uint256 = StableSwapNG(pool).fee()
            dy_with_fee: uint256 = dy * rates[j] / PRECISION + 1

            fee: uint256 = base_fee
            if not static_fee:
                fee_multiplier: uint256 = StableSwapNG(pool).offpeg_fee_multiplier()
                fee = self._dynamic_fee(xp[i], xp[j], base_fee, fee_multiplier)

            y: uint256 = xp[j] - dy_with_fee * FEE_DENOMINATOR / (FEE_DENOMINATOR - fee)
            x: uint256 = self.get_y(j, i, y, xp, amp, D, N_COINS)
            return (x - xp[i]) * PRECISION / rates[i]
        ```

    === "Example"

        ```shell
        >>> StableSwap.get_y('todo')
        'todo'
        ```



### `get_dy`
!!! description "`StableSwap.get_dx(i: int128, j: int128, dy: uint256, pool: address) -> uint256:`"

    Function to calucalte the predicted input amount `j` to receive `dy` of coin `i`.

    Returns: predicted amount of `j` (`uint256`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `i` |  `int128` | index value of input coin |
    | `j` |  `int128` | index value of output coin |
    | `dy` |  `uint256` | amount of input coin being exchanged |
    | `pool` |  `address` | pool address |

    ??? quote "Source code"

        ```vyper
        @view
        @external
        def get_dy(i: int128, j: int128, dx: uint256, pool: address) -> uint256:
            """
            @notice Calculate the current output dy given input dx
            @dev Index values can be found via the `coins` public getter method
            @param i Index value for the coin to send
            @param j Index valie of the coin to recieve
            @param dx Amount of `i` being exchanged
            @return Amount of `j` predicted
            """
            N_COINS: uint256 = StableSwapNG(pool).N_COINS()

            rates: DynArray[uint256, MAX_COINS] = empty(DynArray[uint256, MAX_COINS])
            balances: DynArray[uint256, MAX_COINS] = empty(DynArray[uint256, MAX_COINS])
            xp: DynArray[uint256, MAX_COINS] = empty(DynArray[uint256, MAX_COINS])
            rates, balances, xp = self._get_rates_balances_xp(pool, N_COINS)

            amp: uint256 = StableSwapNG(pool).A() * A_PRECISION
            D: uint256 = self.get_D(xp, amp, N_COINS)

            x: uint256 = xp[i] + (dx * rates[i] / PRECISION)
            y: uint256 = self.get_y(i, j, x, xp, amp, D, N_COINS)
            dy: uint256 = xp[j] - y - 1

            base_fee: uint256 = StableSwapNG(pool).fee()
            fee_multiplier: uint256 = StableSwapNG(pool).offpeg_fee_multiplier()
            fee: uint256 = self._dynamic_fee((xp[i] + x) / 2, (xp[j] + y) / 2, base_fee, fee_multiplier) * dy / FEE_DENOMINATOR

            return (dy - fee) * PRECISION / rates[j]

        @view
        @internal
        def get_y(
            i: int128,
            j: int128,
            x: uint256,
            xp: DynArray[uint256, MAX_COINS],
            _amp: uint256,
            _D: uint256,
            N_COINS: uint256
        ) -> uint256:
            """
            Calculate x[j] if one makes x[i] = x

            Done by solving quadratic equation iteratively.
            x_1**2 + x_1 * (sum' - (A*n**n - 1) * D / (A * n**n)) = D ** (n + 1) / (n ** (2 * n) * prod' * A)
            x_1**2 + b*x_1 = c

            x_1 = (x_1**2 + c) / (2*x_1 + b)
            """
            # x in the input is converted to the same price/precision

            assert i != j       # dev: same coin
            assert j >= 0       # dev: j below zero
            assert j < convert(N_COINS, int128)  # dev: j above N_COINS

            # should be unreachable, but good for safety
            assert i >= 0
            assert i < convert(N_COINS, int128)

            amp: uint256 = _amp
            D: uint256 = _D
            S_: uint256 = 0
            _x: uint256 = 0
            c: uint256 = D
            Ann: uint256 = amp * N_COINS

            for _i in range(MAX_COINS):

                if _i == N_COINS:
                    break

                if  convert(_i, int128) == i:
                    _x = x
                elif convert(_i, int128) != j:
                    _x = xp[_i]
                else:
                    continue
                S_ += _x
                c = c * D / (_x * N_COINS)

            c = c * D * A_PRECISION / (Ann * N_COINS)
            b: uint256 = S_ + D * A_PRECISION / Ann  # - D
            y: uint256 = D

            return self.newton_y(b, c, D, y)

        @pure
        @internal
        def get_D(_xp: DynArray[uint256, MAX_COINS], _amp: uint256, N_COINS: uint256) -> uint256:
            """
            D invariant calculation in non-overflowing integer operations
            iteratively

            A * sum(x_i) * n**n + D = A * D * n**n + D**(n+1) / (n**n * prod(x_i))

            Converging solution:
            D[j+1] = (A * n**n * sum(x_i) - D[j]**(n+1) / (n**n prod(x_i))) / (A * n**n - 1)
            """
            S: uint256 = 0
            for i in range(MAX_COINS):
                if i == N_COINS:
                    break
                S += _xp[i]

            if S == 0:
                return 0

            D: uint256 = S
            Ann: uint256 = _amp * N_COINS
            D_P: uint256 = 0
            Dprev: uint256 = 0

            for i in range(255):

                D_P = D
                for x in _xp:
                    D_P = D_P * D / (x * N_COINS)
                Dprev = D

                D = (Ann * S / A_PRECISION + D_P * N_COINS) * D / ((Ann - A_PRECISION) * D / A_PRECISION + (N_COINS + 1) * D_P)
                # Equality with the precision of 1
                if D > Dprev:
                    if D - Dprev <= 1:
                        return D
                else:
                    if Dprev - D <= 1:
                        return D
            # convergence typically occurs in 4 rounds or less, this should be unreachable!
            # if it does happen the pool is borked and LPs can withdraw via `remove_liquidity`
            raise

        @internal
        @pure
        def newton_y(b: uint256, c: uint256, D: uint256, _y: uint256) -> uint256:

            y_prev: uint256 = 0
            y: uint256 = _y

            for _i in range(255):
                y_prev = y
                y = (y*y + c) / (2 * y + b - D)
                # Equality with the precision of 1
                if y > y_prev:
                    if y - y_prev <= 1:
                        return y
                else:
                    if y_prev - y <= 1:
                        return y
            raise
        ```

    === "Example"

        ```shell
        >>> StableSwap.get_dy('todo')
        'todo'
        ```


### `get_dx_underlying`
!!! description "`StableSwap.get_dx_underlying(i: int128, j: int128, dy: uint256, pool: address) -> uint256:`"

    Function to calucalte the predicted input amount `i` to receive `dy` of coin `j` on the underlying.

    Returns: predicted amount of `i` (`uint256`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `i` |  `int128` | index value of input coin |
    | `j` |  `int128` | index value of output coin |
    | `dy` |  `uint256` | amount of output coin received |
    | `pool` |  `address` | pool address |

    ??? quote "Source code"

        ```vyper
        @view
        @external
        def get_dx_underlying(
            i: int128,
            j: int128,
            dy: uint256,
            pool: address,
        ) -> uint256:

            BASE_POOL: address = StableSwapNG(pool).BASE_POOL()
            BASE_N_COINS: uint256 = StableSwapNG(pool).BASE_N_COINS()
            N_COINS: uint256 = StableSwapNG(pool).N_COINS()
            base_pool_has_static_fee: bool = self._has_static_fee(BASE_POOL)

            # CASE 1: Swap does not involve Metapool at all. In this case, we kindly as the user
            # to use the right pool for their swaps.
            if min(i, j) > 0:
                raise "Not a Metapool Swap. Use Base pool."

            # CASE 2:
            #    1. meta token_0 of (unknown amount) > base pool lp_token
            #    2. base pool lp_token > calc_withdraw_one_coin gives dy amount of (j-1)th base coin
            # So, need to do the following calculations:
            #    1. calc_token_amounts on base pool for depositing liquidity on (j-1)th token > lp_tokens.
            #    2. get_dx on metapool for i = 0, and j = 1 (base lp token) with amt calculated in (1).
            if i == 0:
                # Calculate LP tokens that are burnt to receive dy amount of base_j tokens.
                lp_amount_burnt: uint256 = self._base_calc_token_amount(
                    dy, j - 1, BASE_N_COINS, BASE_POOL, False
                )
                return self._get_dx(0, 1, lp_amount_burnt, pool, False, N_COINS)

            # CASE 3: Swap in token i-1 from base pool and swap out dy amount of token 0 (j) from metapool.
            #    1. deposit i-1 token from base pool > receive base pool lp_token
            #    2. swap base pool lp token > 0th token of the metapool
            # So, need to do the following calculations:
            #    1. get_dx on metapool with i = 0, j = 1 > gives how many base lp tokens are required for receiving
            #       dy amounts of i-1 tokens from the metapool
            #    2. We have number of lp tokens: how many i-1 base pool coins are needed to mint that many tokens?
            #       We don't have a method where user inputs lp tokens and it gives number of coins of (i-1)th token
            #       is needed to mint that many base_lp_tokens. Instead, we will use calc_withdraw_one_coin. That's
            #       close enough.
            lp_amount_required: uint256 = self._get_dx(1, 0, dy, pool, False, N_COINS)
            return StableSwapNG(BASE_POOL).calc_withdraw_one_coin(lp_amount_required, i-1)

        @internal
        @view
        def _base_calc_token_amount(
            dx: uint256,
            base_i: int128,
            base_n_coins: uint256,
            base_pool: address,
            is_deposit: bool
        ) -> uint256:

            if base_n_coins == 2:

                base_inputs: uint256[2] = empty(uint256[2])
                base_inputs[base_i] = dx
                return StableSwap2(base_pool).calc_token_amount(base_inputs, is_deposit)

            elif base_n_coins == 3:

                base_inputs: uint256[3] = empty(uint256[3])
                base_inputs[base_i] = dx
                return StableSwap3(base_pool).calc_token_amount(base_inputs, is_deposit)

            else:

                raise "base_n_coins > 3 not supported yet."
        ```

    === "Example"

        ```shell
        >>> StableSwap.get_y('todo')
        'todo'
        ```


### `get_dy_underlying`
!!! description "`StableSwap.get_dy_underlying(i: int128, j: int128, dx: uint256, pool: address) -> uint256:`"

    Function to calucalte the predicted input amount `j` to receive `dy` of coin `i` on the underlying.

    Returns: predicted amount of `j` (`uint256`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `i` |  `int128` | index value of input coin |
    | `j` |  `int128` | index value of output coin |
    | `dy` |  `uint256` | amount of input coin being exchanged |
    | `pool` |  `address` | pool address |


    ??? quote "Source code"

        ```vyper
        @view
        @external
        def get_dy_underlying(
            i: int128,
            j: int128,
            dx: uint256,
            pool: address,
        ) -> uint256:
            """
            @notice Calculate the current output dy given input dx on underlying
            @dev Index values can be found via the `coins` public getter method
            @param i Index value for the coin to send
            @param j Index valie of the coin to recieve
            @param dx Amount of `i` being exchanged
            @return Amount of `j` predicted
            """

            N_COINS: uint256 = StableSwapNG(pool).N_COINS()
            MAX_COIN: int128 = convert(N_COINS, int128) - 1
            BASE_POOL: address = StableSwapNG(pool).BASE_POOL()

            rates: DynArray[uint256, MAX_COINS] = empty(DynArray[uint256, MAX_COINS])
            balances: DynArray[uint256, MAX_COINS] = empty(DynArray[uint256, MAX_COINS])
            xp: DynArray[uint256, MAX_COINS] = empty(DynArray[uint256, MAX_COINS])
            rates, balances, xp = self._get_rates_balances_xp(pool, N_COINS)

            x: uint256 = 0
            base_i: int128 = 0
            base_j: int128 = 0
            meta_i: int128 = 0
            meta_j: int128 = 0

            if i != 0:
                base_i = i - MAX_COIN
                meta_i = 1
            if j != 0:
                base_j = j - MAX_COIN
                meta_j = 1

            if i == 0:

                x = xp[i] + dx * rates[0] / 10**18

            else:

                if j == 0:

                    # i is from BasePool
                    base_n_coins: uint256 = StableSwapNG(pool).BASE_N_COINS()
                    x = self._base_calc_token_amount(
                        dx, base_i, base_n_coins, BASE_POOL, True
                    ) * rates[1] / PRECISION

                    # Adding number of pool tokens
                    x += xp[1]

                else:
                    # If both are from the base pool
                    return StableSwapNG(BASE_POOL).get_dy(base_i, base_j, dx)

            # This pool is involved only when in-pool assets are used
            amp: uint256 = StableSwapNG(pool).A() * A_PRECISION
            D: uint256 = self.get_D(xp, amp, N_COINS)
            y: uint256 = self.get_y(meta_i, meta_j, x, xp, amp, D, N_COINS)
            dy: uint256 = xp[meta_j] - y - 1

            # calculate output after subtracting dynamic fee
            base_fee: uint256 = StableSwapNG(pool).fee()
            fee_multiplier: uint256 = StableSwapNG(pool).offpeg_fee_multiplier()

            dynamic_fee: uint256 = self._dynamic_fee((xp[meta_i] + x) / 2, (xp[meta_j] + y) / 2, base_fee, fee_multiplier)
            dy = (dy - dynamic_fee * dy / FEE_DENOMINATOR)

            # If output is going via the metapool
            if j == 0:
                dy = dy * 10**18 / rates[0]
            else:
                # j is from BasePool
                # The fee is already accounted for
                dy = StableSwapNG(BASE_POOL).calc_withdraw_one_coin(dy * PRECISION / rates[1], base_j)

            return dy
        ```

    === "Example"

        ```shell
        >>> StableSwap.get_y('todo')
        'todo'
        ```



## **Deposit / Withdrawl Methods**

### `calc_token_amount`
!!! description "`StableSwap.calc_token_amount(_amounts: DynArray[uint256, MAX_COINS], _is_deposit: bool, pool: address) -> uint256:`"

    Function to calculate the addition or reduction of token supply from a deposit (add liquidity) or withdrawl (remove liquidity) including fees.

    Returns: expected amount of LP tokens received (`uint256`)

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_amounts` |  `DynArray[uint256, MAX_COINS]` | amount of coins being deposited/withdrawn |
    | `_is_deposit` |  `bool` | `true` = deposit, `false` = withdraw |

    ??? quote "Source code"

        ```vyper
        @view
        @external
        def calc_token_amount(
            _amounts: DynArray[uint256, MAX_COINS],
            _is_deposit: bool,
            pool: address
        ) -> uint256:
            """
            @notice Calculate addition or reduction in token supply from a deposit or withdrawal
            @param _amounts Amount of each coin being deposited
            @param _is_deposit set True for deposits, False for withdrawals
            @return Expected amount of LP tokens received
            """
            amp: uint256 = StableSwapNG(pool).A() * A_PRECISION
            N_COINS: uint256 = StableSwapNG(pool).N_COINS()

            rates: DynArray[uint256, MAX_COINS] = empty(DynArray[uint256, MAX_COINS])
            old_balances: DynArray[uint256, MAX_COINS] = empty(DynArray[uint256, MAX_COINS])
            xp: DynArray[uint256, MAX_COINS] = empty(DynArray[uint256, MAX_COINS])
            rates, old_balances, xp = self._get_rates_balances_xp(pool, N_COINS)

            # Initial invariant
            D0: uint256 = self.get_D(xp, amp, N_COINS)

            total_supply: uint256 = StableSwapNG(pool).totalSupply()
            new_balances: DynArray[uint256, MAX_COINS] = old_balances
            for i in range(MAX_COINS):
                if i == N_COINS:
                    break

                amount: uint256 = _amounts[i]
                if _is_deposit:
                    new_balances[i] += amount
                else:
                    new_balances[i] -= amount

            # Invariant after change
            for idx in range(MAX_COINS):
                if idx == N_COINS:
                    break
                xp[idx] = rates[idx] * new_balances[idx] / PRECISION
            D1: uint256 = self.get_D(xp, amp, N_COINS)

            # We need to recalculate the invariant accounting for fees
            # to calculate fair user's share
            D2: uint256 = D1
            if total_supply > 0:

                # Only account for fees if we are not the first to deposit
                base_fee: uint256 = StableSwapNG(pool).fee() * N_COINS / (4 * (N_COINS - 1))
                fee_multiplier: uint256 = StableSwapNG(pool).offpeg_fee_multiplier()
                _dynamic_fee_i: uint256 = 0
                xs: uint256 = 0
                ys: uint256 = (D0 + D1) / N_COINS

                for i in range(MAX_COINS):
                    if i == N_COINS:
                        break

                    ideal_balance: uint256 = D1 * old_balances[i] / D0
                    difference: uint256 = 0
                    new_balance: uint256 = new_balances[i]
                    if ideal_balance > new_balance:
                        difference = ideal_balance - new_balance
                    else:
                        difference = new_balance - ideal_balance

                    xs = old_balances[i] + new_balance
                    _dynamic_fee_i = self._dynamic_fee(xs, ys, base_fee, fee_multiplier)
                    new_balances[i] -= _dynamic_fee_i * difference / FEE_DENOMINATOR

                for idx in range(MAX_COINS):
                    if idx == N_COINS:
                        break
                    xp[idx] = rates[idx] * new_balances[idx] / PRECISION

                D2 = self.get_D(xp, amp, N_COINS)
            else:
                return D1  # Take the dust if there was any

            diff: uint256 = 0
            if _is_deposit:
                diff = D2 - D0
            else:
                diff = D0 - D2
            return diff * total_supply / D0
        ```

    === "Example"

        ```shell
        >>> StableSwap.calc_token_amount('todo')
        'todo'
        ```


### `calc_withdraw_one_coin`
!!! description "`StableSwap.calc_withdraw_one_coin(_burn_amount: uint256, i: int128, pool: address) -> uint256:`"

    Function to calculate the amount of tokens withdrawn when burning `_burn_amount` amount of LP tokens.

    Returns: expected amount of `i` withdrawn (`uint256`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_burn_amount` |  `uint256` | amount of LP tokens to burn |
    | `i` |  `int128` | index value of the coin to withdraw |
    | `pool` |  `address` | pool address |

    ??? quote "Source code"

        ```vyper 
        @view
        @external
        def calc_withdraw_one_coin(_burn_amount: uint256, i: int128, pool: address) -> uint256:
            # First, need to calculate
            # * Get current D
            # * Solve Eqn against y_i for D - _token_amount

            amp: uint256 = StableSwapNG(pool).A() * A_PRECISION
            N_COINS: uint256 = StableSwapNG(pool).N_COINS()

            rates: DynArray[uint256, MAX_COINS] = empty(DynArray[uint256, MAX_COINS])
            balances: DynArray[uint256, MAX_COINS] = empty(DynArray[uint256, MAX_COINS])
            xp: DynArray[uint256, MAX_COINS] = empty(DynArray[uint256, MAX_COINS])
            rates, balances, xp = self._get_rates_balances_xp(pool, N_COINS)

            D0: uint256 = self.get_D(xp, amp, N_COINS)

            total_supply: uint256 = StableSwapNG(pool).totalSupply()
            D1: uint256 = D0 - _burn_amount * D0 / total_supply
            new_y: uint256 = self.get_y_D(amp, i, xp, D1, N_COINS)
            ys: uint256 = (D0 + D1) / (2 * N_COINS)

            base_fee: uint256 = StableSwapNG(pool).fee() * N_COINS / (4 * (N_COINS - 1))
            fee_multiplier: uint256 = StableSwapNG(pool).offpeg_fee_multiplier()
            xp_reduced: DynArray[uint256, MAX_COINS] = xp
            xp_j: uint256 = 0
            xavg: uint256 = 0
            dynamic_fee: uint256 = 0

            for j in range(MAX_COINS):

                if j == N_COINS:
                    break

                dx_expected: uint256 = 0
                xp_j = xp[j]
                if convert(j, int128) == i:
                    dx_expected = xp_j * D1 / D0 - new_y
                    xavg = (xp[j] + new_y) / 2
                else:
                    dx_expected = xp_j - xp_j * D1 / D0
                    xavg = xp[j]

                dynamic_fee = self._dynamic_fee(xavg, ys, base_fee, fee_multiplier)
                xp_reduced[j] = xp_j - dynamic_fee * dx_expected / FEE_DENOMINATOR

            dy: uint256 = xp_reduced[i] - self.get_y_D(amp, i, xp_reduced, D1, N_COINS)
            dy = (dy - 1) * PRECISION / rates[i]  # Withdraw less to account for rounding errors

            return dy
        ```

    === "Example"

        ```shell
        >>> StableSwap.get_y('todo')
        'todo'
        ```


## **Dynamic Fee Method**

### `dynamic_fee`
!!! description "`StableSwap.dynamic_fee(i: int128, j: int128, pool:address) -> uint256:`"

    Function to calculate the swap fee when exchanging between `i` and `j`. The swap fee is expressed as a integer with a 1e10 precision.

    Returns: swap fee (`uint256`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `i` |  `int128` | index value of input coin |
    | `j` |  `int128` | index value of output coin |
    | `pool` |  `address` | pool address |

    ??? quote "Source code"

        ```vyper
        @view
        @external
        def dynamic_fee(i: int128, j: int128, pool:address) -> uint256:
            """
            @notice Return the fee for swapping between `i` and `j`
            @param i Index value for the coin to send
            @param j Index value of the coin to recieve
            @return Swap fee expressed as an integer with 1e10 precision
            """
            N_COINS: uint256 = StableSwapNG(pool).N_COINS()
            fee: uint256 = StableSwapNG(pool).fee()
            fee_multiplier: uint256 = StableSwapNG(pool).offpeg_fee_multiplier()

            rates: DynArray[uint256, MAX_COINS] = empty(DynArray[uint256, MAX_COINS])
            balances: DynArray[uint256, MAX_COINS] = empty(DynArray[uint256, MAX_COINS])
            xp: DynArray[uint256, MAX_COINS] = empty(DynArray[uint256, MAX_COINS])
            rates, balances, xp = self._get_rates_balances_xp(pool, N_COINS)

            return self._dynamic_fee(xp[i], xp[j], fee, fee_multiplier)

        @view
        @internal
        def _dynamic_fee(xpi: uint256, xpj: uint256, _fee: uint256, _fee_multiplier: uint256) -> uint256:

            if _fee_multiplier <= FEE_DENOMINATOR:
                return _fee

            xps2: uint256 = (xpi + xpj) ** 2
            return (
                (_fee_multiplier * _fee) /
                ((_fee_multiplier - FEE_DENOMINATOR) * 4 * xpi * xpj / xps2 + FEE_DENOMINATOR)
            )

        @view
        @internal
        def _get_rates_balances_xp(pool: address, N_COINS: uint256) -> (
            DynArray[uint256, MAX_COINS],
            DynArray[uint256, MAX_COINS],
            DynArray[uint256, MAX_COINS],
        ):

            rates: DynArray[uint256, MAX_COINS] = StableSwapNG(pool).stored_rates()
            balances: DynArray[uint256, MAX_COINS] = StableSwapNG(pool).get_balances()
            xp: DynArray[uint256, MAX_COINS] = empty(DynArray[uint256, MAX_COINS])
            for idx in range(MAX_COINS):
                if idx == N_COINS:
                    break
                xp.append(rates[idx] * balances[idx] / PRECISION)

            return rates, balances, xp
        ```

    === "Example"

        ```shell
        >>> StableSwap.dynamic_fee('todo')
        'todo'
        ```