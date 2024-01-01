todo:
code block: change python to vyper


### `last_timestamp`
### `D`


## Exchange Methods

todo:
- transfer in
- transfer out

exchange methods. tran

### `exchange`
!!! description "`TwoCrypto.exchange(i: uint256, j: uint256, dx: uint256, min_dy: uint256, receiver: address = msg.sender) -> uint256:`"

    todo: interal _exchange has all the calculations of fee, dy etc. passes values into exchange().
    Function to exchange `dx` amount of coin `i` for coin `j` and receive a minimum amount of `min_dy`.

    Returns:  Amount of tokens at index j received (uint256).

    Emits `TokenExchange`

    | Input      | Type      | Description |
    | ---------- | --------- | ----------- |
    | `i` | `uint256` | Index value for the input coin |
    | `j` | `uint256` | Index value for the output coin |
    | `dx` | `uint256` | Amount of input coin being swapped in |
    | `min_dy` | `uint256` | Minimum amount of output coin to receive |
    | `receiver` | `address` | Address to send output coin to. Defaults to `msg.sender` |

    ??? quote "Source code"

        === "CurveTwocryptoOptimized.vy"

            ```python
            event TokenExchange:
                buyer: indexed(address)
                sold_id: uint256
                tokens_sold: uint256
                bought_id: uint256
                tokens_bought: uint256
                fee: uint256
                packed_price_scale: uint256

            @external
            @nonreentrant("lock")
            def exchange(
                i: uint256,
                j: uint256,
                dx: uint256,
                min_dy: uint256,
                receiver: address = msg.sender
            ) -> uint256:
                """
                @notice Exchange using wrapped native token by default
                @param i Index value for the input coin
                @param j Index value for the output coin
                @param dx Amount of input coin being swapped in
                @param min_dy Minimum amount of output coin to receive
                @param receiver Address to send the output coin to. Default is msg.sender
                @return uint256 Amount of tokens at index j received by the `receiver
                """
                # _transfer_in updates self.balances here:
                dx_received: uint256 = self._transfer_in(
                    i,
                    dx,
                    msg.sender,
                    False
                )

                # No ERC20 token transfers occur here:
                out: uint256[3] = self._exchange(
                    i,
                    j,
                    dx_received,
                    min_dy,
                )

                # _transfer_out updates self.balances here. Update to state occurs before
                # external calls:
                self._transfer_out(j, out[0], receiver)

                # log:
                log TokenExchange(msg.sender, i, dx_received, j, out[0], out[1], out[2])

                return out[0]

            @internal
            def _exchange(
                i: uint256,
                j: uint256,
                dx_received: uint256,
                min_dy: uint256,
            ) -> uint256[3]:

                assert i != j  # dev: coin index out of range
                assert dx_received > 0  # dev: do not exchange 0 coins

                A_gamma: uint256[2] = self._A_gamma()
                xp: uint256[N_COINS] = self.balances
                dy: uint256 = 0

                y: uint256 = xp[j]
                x0: uint256 = xp[i] - dx_received  # old xp[i]

                price_scale: uint256 = self.cached_price_scale
                xp = [
                    xp[0] * PRECISIONS[0],
                    unsafe_div(xp[1] * price_scale * PRECISIONS[1], PRECISION)
                ]

                # ----------- Update invariant if A, gamma are undergoing ramps ---------

                t: uint256 = self.future_A_gamma_time
                if t > block.timestamp:

                    x0 *= PRECISIONS[i]

                    if i > 0:
                        x0 = unsafe_div(x0 * price_scale, PRECISION)

                    x1: uint256 = xp[i]  # <------------------ Back up old value in xp ...
                    xp[i] = x0                                                         # |
                    self.D = MATH.newton_D(A_gamma[0], A_gamma[1], xp, 0)              # |
                    xp[i] = x1  # <-------------------------------------- ... and restore.

                # ----------------------- Calculate dy and fees --------------------------

                D: uint256 = self.D
                y_out: uint256[2] = MATH.get_y(A_gamma[0], A_gamma[1], xp, D, j)
                dy = xp[j] - y_out[0]
                xp[j] -= dy
                dy -= 1

                if j > 0:
                    dy = dy * PRECISION / price_scale
                dy /= PRECISIONS[j]

                fee: uint256 = unsafe_div(self._fee(xp) * dy, 10**10)
                dy -= fee  # <--------------------- Subtract fee from the outgoing amount.
                assert dy >= min_dy, "Slippage"
                y -= dy

                y *= PRECISIONS[j]
                if j > 0:
                    y = unsafe_div(y * price_scale, PRECISION)
                xp[j] = y  # <------------------------------------------------- Update xp.

                # ------ Tweak price_scale with good initial guess for newton_D ----------

                price_scale = self.tweak_price(A_gamma, xp, 0, y_out[1])

                return [dy, fee, price_scale]
            ```

        === "CurveCryptoMathOptimized2.vy"

            ```python
            @external
            @view
            def newton_D(ANN: uint256, gamma: uint256, x_unsorted: uint256[N_COINS], K0_prev: uint256 = 0) -> uint256:
                """
                Finding the invariant using Newton method.
                ANN is higher by the factor A_MULTIPLIER
                ANN is already A * N**N
                """

                # Safety checks
                assert ANN > MIN_A - 1 and ANN < MAX_A + 1  # dev: unsafe values A
                assert gamma > MIN_GAMMA - 1 and gamma < MAX_GAMMA + 1  # dev: unsafe values gamma

                # Initial value of invariant D is that for constant-product invariant
                x: uint256[N_COINS] = x_unsorted
                if x[0] < x[1]:
                    x = [x_unsorted[1], x_unsorted[0]]

                assert x[0] > 10**9 - 1 and x[0] < 10**15 * 10**18 + 1  # dev: unsafe values x[0]
                assert unsafe_div(x[1] * 10**18, x[0]) > 10**14 - 1  # dev: unsafe values x[i] (input)

                S: uint256 = unsafe_add(x[0], x[1])  # can unsafe add here because we checked x[0] bounds

                D: uint256 = 0
                if K0_prev == 0:
                    D = N_COINS * isqrt(unsafe_mul(x[0], x[1]))
                else:
                    # D = isqrt(x[0] * x[1] * 4 / K0_prev * 10**18)
                    D = isqrt(unsafe_mul(unsafe_div(unsafe_mul(unsafe_mul(4, x[0]), x[1]), K0_prev), 10**18))
                    if S < D:
                        D = S

                __g1k0: uint256 = gamma + 10**18
                diff: uint256 = 0

                for i in range(255):
                    D_prev: uint256 = D
                    assert D > 0
                    # Unsafe division by D and D_prev is now safe

                    # K0: uint256 = 10**18
                    # for _x in x:
                    #     K0 = K0 * _x * N_COINS / D
                    # collapsed for 2 coins
                    K0: uint256 = unsafe_div(unsafe_div((10**18 * N_COINS**2) * x[0], D) * x[1], D)

                    _g1k0: uint256 = __g1k0
                    if _g1k0 > K0:
                        _g1k0 = unsafe_add(unsafe_sub(_g1k0, K0), 1)  # > 0
                    else:
                        _g1k0 = unsafe_add(unsafe_sub(K0, _g1k0), 1)  # > 0

                    # D / (A * N**N) * _g1k0**2 / gamma**2
                    mul1: uint256 = unsafe_div(unsafe_div(unsafe_div(10**18 * D, gamma) * _g1k0, gamma) * _g1k0 * A_MULTIPLIER, ANN)

                    # 2*N*K0 / _g1k0
                    mul2: uint256 = unsafe_div(((2 * 10**18) * N_COINS) * K0, _g1k0)

                    # calculate neg_fprime. here K0 > 0 is being validated (safediv).
                    neg_fprime: uint256 = (S + unsafe_div(S * mul2, 10**18)) + mul1 * N_COINS / K0 - unsafe_div(mul2 * D, 10**18)

                    # D -= f / fprime; neg_fprime safediv being validated
                    D_plus: uint256 = D * (neg_fprime + S) / neg_fprime
                    D_minus: uint256 = unsafe_div(D * D,  neg_fprime)
                    if 10**18 > K0:
                        D_minus += unsafe_div(unsafe_div(D * unsafe_div(mul1, neg_fprime), 10**18) * unsafe_sub(10**18, K0), K0)
                    else:
                        D_minus -= unsafe_div(unsafe_div(D * unsafe_div(mul1, neg_fprime), 10**18) * unsafe_sub(K0, 10**18), K0)

                    if D_plus > D_minus:
                        D = unsafe_sub(D_plus, D_minus)
                    else:
                        D = unsafe_div(unsafe_sub(D_minus, D_plus), 2)

                    if D > D_prev:
                        diff = unsafe_sub(D, D_prev)
                    else:
                        diff = unsafe_sub(D_prev, D)

                    if diff * 10**14 < max(10**16, D):  # Could reduce precision for gas efficiency here

                        for _x in x:
                            frac: uint256 = _x * 10**18 / D
                            assert (frac >= 10**16 - 1) and (frac < 10**20 + 1)  # dev: unsafe values x[i]
                        return D

                raise "Did not converge"

            @external
            @pure
            def get_y(
                _ANN: uint256,
                _gamma: uint256,
                _x: uint256[N_COINS],
                _D: uint256,
                i: uint256
            ) -> uint256[2]:

                # Safety checks
                assert _ANN > MIN_A - 1 and _ANN < MAX_A + 1  # dev: unsafe values A
                assert _gamma > MIN_GAMMA - 1 and _gamma < MAX_GAMMA + 1  # dev: unsafe values gamma
                assert _D > 10**17 - 1 and _D < 10**15 * 10**18 + 1 # dev: unsafe values D

                ANN: int256 = convert(_ANN, int256)
                gamma: int256 = convert(_gamma, int256)
                D: int256 = convert(_D, int256)
                x_j: int256 = convert(_x[1 - i], int256)
                gamma2: int256 = unsafe_mul(gamma, gamma)

                # savediv by x_j done here:
                y: int256 = D**2 / (x_j * N_COINS**2)

                # K0_i: int256 = (10**18 * N_COINS) * x_j / D
                K0_i: int256 = unsafe_div(10**18 * N_COINS * x_j, D)
                assert (K0_i > 10**16 * N_COINS - 1) and (K0_i < 10**20 * N_COINS + 1)  # dev: unsafe values x[i]

                ann_gamma2: int256 = ANN * gamma2

                # a = 10**36 / N_COINS**2
                a: int256 = 10**32

                # b = ANN*D*gamma2/4/10000/x_j/10**4 - 10**32*3 - 2*gamma*10**14
                b: int256 = (
                    D*ann_gamma2/400000000/x_j
                    - convert(unsafe_mul(10**32, 3), int256)
                    - unsafe_mul(unsafe_mul(2, gamma), 10**14)
                )

                # c = 10**32*3 + 4*gamma*10**14 + gamma2/10**4 + 4*ANN*gamma2*x_j/D/10000/4/10**4 - 4*ANN*gamma2/10000/4/10**4
                c: int256 = (
                    unsafe_mul(10**32, convert(3, int256))
                    + unsafe_mul(unsafe_mul(4, gamma), 10**14)
                    + unsafe_div(gamma2, 10**4)
                    + unsafe_div(unsafe_div(unsafe_mul(4, ann_gamma2), 400000000) * x_j, D)
                    - unsafe_div(unsafe_mul(4, ann_gamma2), 400000000)
                )

                # d = -(10**18+gamma)**2 / 10**4
                d: int256 = -unsafe_div(unsafe_add(10**18, gamma) ** 2, 10**4)

                # delta0: int256 = 3*a*c/b - b
                delta0: int256 = 3 * a * c / b - b  # safediv by b

                # delta1: int256 = 9*a*c/b - 2*b - 27*a**2/b*d/b
                delta1: int256 = 3 * delta0 + b - 27*a**2/b*d/b

                divider: int256 = 1
                threshold: int256 = min(min(abs(delta0), abs(delta1)), a)
                if threshold > 10**48:
                    divider = 10**30
                elif threshold > 10**46:
                    divider = 10**28
                elif threshold > 10**44:
                    divider = 10**26
                elif threshold > 10**42:
                    divider = 10**24
                elif threshold > 10**40:
                    divider = 10**22
                elif threshold > 10**38:
                    divider = 10**20
                elif threshold > 10**36:
                    divider = 10**18
                elif threshold > 10**34:
                    divider = 10**16
                elif threshold > 10**32:
                    divider = 10**14
                elif threshold > 10**30:
                    divider = 10**12
                elif threshold > 10**28:
                    divider = 10**10
                elif threshold > 10**26:
                    divider = 10**8
                elif threshold > 10**24:
                    divider = 10**6
                elif threshold > 10**20:
                    divider = 10**2

                a = unsafe_div(a, divider)
                b = unsafe_div(b, divider)
                c = unsafe_div(c, divider)
                d = unsafe_div(d, divider)

                # delta0 = 3*a*c/b - b: here we can do more unsafe ops now:
                delta0 = unsafe_div(unsafe_mul(unsafe_mul(3, a), c), b) - b

                # delta1 = 9*a*c/b - 2*b - 27*a**2/b*d/b
                delta1 = 3 * delta0 + b - unsafe_div(unsafe_mul(unsafe_div(unsafe_mul(27, a**2), b), d), b)

                # sqrt_arg: int256 = delta1**2 + 4*delta0**2/b*delta0
                sqrt_arg: int256 = delta1**2 + unsafe_mul(unsafe_div(4*delta0**2, b), delta0)
                sqrt_val: int256 = 0
                if sqrt_arg > 0:
                    sqrt_val = convert(isqrt(convert(sqrt_arg, uint256)), int256)
                else:
                    return [
                        self._newton_y(_ANN, _gamma, _x, _D, i),
                        0
                    ]

                b_cbrt: int256 = 0
                if b > 0:
                    b_cbrt = convert(self._cbrt(convert(b, uint256)), int256)
                else:
                    b_cbrt = -convert(self._cbrt(convert(-b, uint256)), int256)

                second_cbrt: int256 = 0
                if delta1 > 0:
                    # second_cbrt = convert(self._cbrt(convert((delta1 + sqrt_val), uint256) / 2), int256)
                    second_cbrt = convert(self._cbrt(convert(unsafe_add(delta1, sqrt_val), uint256) / 2), int256)
                else:
                    # second_cbrt = -convert(self._cbrt(convert(unsafe_sub(sqrt_val, delta1), uint256) / 2), int256)
                    second_cbrt = -convert(self._cbrt(unsafe_div(convert(unsafe_sub(sqrt_val, delta1), uint256), 2)), int256)

                # C1: int256 = b_cbrt**2/10**18*second_cbrt/10**18
                C1: int256 = unsafe_div(unsafe_mul(unsafe_div(b_cbrt**2, 10**18), second_cbrt), 10**18)

                # root: int256 = (10**18*C1 - 10**18*b - 10**18*b*delta0/C1)/(3*a), keep 2 safe ops here.
                root: int256 = (unsafe_mul(10**18, C1) - unsafe_mul(10**18, b) - unsafe_mul(10**18, b)/C1*delta0)/unsafe_mul(3, a)

                # y_out: uint256[2] =  [
                #     convert(D**2/x_j*root/4/10**18, uint256),   # <--- y
                #     convert(root, uint256)  # <----------------------- K0Prev
                # ]
                y_out: uint256[2] = [convert(unsafe_div(unsafe_div(unsafe_mul(unsafe_div(D**2, x_j), root), 4), 10**18), uint256), convert(root, uint256)]

                frac: uint256 = unsafe_div(y_out[0] * 10**18, _D)
                assert (frac >= 10**16 - 1) and (frac < 10**20 + 1)  # dev: unsafe value for y

                return y_out
            ```

    === "Example"

        ```shell
        >>> TwoCrypto.
        ```

    !!!note todo
        Token indices can be check by Pool.coins(i) which returns the token address of the token at index i.


### `exchange_received`
!!! description "`TwoCrypto.exchange_received(i: uint256, j: uint256, dx: uint256, min_dy: uint256, receiver: address = msg.sender) -> uint256:`"

    !!! warning
        The transfer of coins into the pool and then calling `exchange_received` is highly advised to be done in the same transaction. If not, other users or MEV bots may call `exchange_received` before you, potentially *stealing* the coins.

    Function to exchange `dx` amount of coin `i` for coin `j` and receive a minimum amount of `min_dy`. This function requires a transfer of dx amount of coin i to the pool proior to calling this function, as this exchange is based on the change of token balances in the pool. The pool will not call transferFrom and will only check if a surplus of coins[i] is greater than or equal to `dx`.

    Returns:  Amount of tokens at index j received (uint256).

    Emits `TokenExchange`

    | Input      | Type      | Description |
    | ---------- | --------- | ----------- |
    | `i` | `uint256` | Index value for the input coin |
    | `j` | `uint256` | Index value for the output coin |
    | `dx` | `uint256` | Amount of input coin being swapped in |
    | `min_dy` | `uint256` | Minimum amount of output coin to receive |
    | `receiver` | `address` | Address to send output coin to. Defaults to `msg.sender` |

    ??? quote "Source code"

        === "CurveTwocryptoOptimized.vy"

            ```python
            event TokenExchange:
                buyer: indexed(address)
                sold_id: uint256
                tokens_sold: uint256
                bought_id: uint256
                tokens_bought: uint256
                fee: uint256
                packed_price_scale: uint256

            @external
            @nonreentrant('lock')
            def exchange_received(
                i: uint256,
                j: uint256,
                dx: uint256,
                min_dy: uint256,
                receiver: address = msg.sender,
            ) -> uint256:
                """
                @notice Exchange: but user must transfer dx amount of coin[i] tokens to pool first.
                        Pool will not call transferFrom and will only check if a surplus of
                        coins[i] is greater than or equal to `dx`.
                @dev Use-case is to reduce the number of redundant ERC20 token
                    transfers in zaps. Primarily for dex-aggregators/arbitrageurs/searchers.
                    Note for users: please transfer + exchange_received in 1 tx.
                @param i Index value for the input coin
                @param j Index value for the output coin
                @param dx Amount of input coin being swapped in
                @param min_dy Minimum amount of output coin to receive
                @param receiver Address to send the output coin to
                @return uint256 Amount of tokens at index j received by the `receiver`
                """
                # _transfer_in updates self.balances here:
                dx_received: uint256 = self._transfer_in(
                    i,
                    dx,
                    msg.sender,
                    True  # <---- expect_optimistic_transfer is set to True here.
                )

                # No ERC20 token transfers occur here:
                out: uint256[3] = self._exchange(
                    i,
                    j,
                    dx_received,
                    min_dy,
                )

                # _transfer_out updates self.balances here. Update to state occurs before
                # external calls:
                self._transfer_out(j, out[0], receiver)

                # log:
                log TokenExchange(msg.sender, i, dx_received, j, out[0], out[1], out[2])

                return out[0]

            @internal
            def _exchange(
                i: uint256,
                j: uint256,
                dx_received: uint256,
                min_dy: uint256,
            ) -> uint256[3]:

                assert i != j  # dev: coin index out of range
                assert dx_received > 0  # dev: do not exchange 0 coins

                A_gamma: uint256[2] = self._A_gamma()
                xp: uint256[N_COINS] = self.balances
                dy: uint256 = 0

                y: uint256 = xp[j]
                x0: uint256 = xp[i] - dx_received  # old xp[i]

                price_scale: uint256 = self.cached_price_scale
                xp = [
                    xp[0] * PRECISIONS[0],
                    unsafe_div(xp[1] * price_scale * PRECISIONS[1], PRECISION)
                ]

                # ----------- Update invariant if A, gamma are undergoing ramps ---------

                t: uint256 = self.future_A_gamma_time
                if t > block.timestamp:

                    x0 *= PRECISIONS[i]

                    if i > 0:
                        x0 = unsafe_div(x0 * price_scale, PRECISION)

                    x1: uint256 = xp[i]  # <------------------ Back up old value in xp ...
                    xp[i] = x0                                                         # |
                    self.D = MATH.newton_D(A_gamma[0], A_gamma[1], xp, 0)              # |
                    xp[i] = x1  # <-------------------------------------- ... and restore.

                # ----------------------- Calculate dy and fees --------------------------

                D: uint256 = self.D
                y_out: uint256[2] = MATH.get_y(A_gamma[0], A_gamma[1], xp, D, j)
                dy = xp[j] - y_out[0]
                xp[j] -= dy
                dy -= 1

                if j > 0:
                    dy = dy * PRECISION / price_scale
                dy /= PRECISIONS[j]

                fee: uint256 = unsafe_div(self._fee(xp) * dy, 10**10)
                dy -= fee  # <--------------------- Subtract fee from the outgoing amount.
                assert dy >= min_dy, "Slippage"
                y -= dy

                y *= PRECISIONS[j]
                if j > 0:
                    y = unsafe_div(y * price_scale, PRECISION)
                xp[j] = y  # <------------------------------------------------- Update xp.

                # ------ Tweak price_scale with good initial guess for newton_D ----------

                price_scale = self.tweak_price(A_gamma, xp, 0, y_out[1])

                return [dy, fee, price_scale]
            ```

        === "CurveCryptoMathOptimized2.vy"

            ```python
            @external
            @view
            def newton_D(ANN: uint256, gamma: uint256, x_unsorted: uint256[N_COINS], K0_prev: uint256 = 0) -> uint256:
                """
                Finding the invariant using Newton method.
                ANN is higher by the factor A_MULTIPLIER
                ANN is already A * N**N
                """

                # Safety checks
                assert ANN > MIN_A - 1 and ANN < MAX_A + 1  # dev: unsafe values A
                assert gamma > MIN_GAMMA - 1 and gamma < MAX_GAMMA + 1  # dev: unsafe values gamma

                # Initial value of invariant D is that for constant-product invariant
                x: uint256[N_COINS] = x_unsorted
                if x[0] < x[1]:
                    x = [x_unsorted[1], x_unsorted[0]]

                assert x[0] > 10**9 - 1 and x[0] < 10**15 * 10**18 + 1  # dev: unsafe values x[0]
                assert unsafe_div(x[1] * 10**18, x[0]) > 10**14 - 1  # dev: unsafe values x[i] (input)

                S: uint256 = unsafe_add(x[0], x[1])  # can unsafe add here because we checked x[0] bounds

                D: uint256 = 0
                if K0_prev == 0:
                    D = N_COINS * isqrt(unsafe_mul(x[0], x[1]))
                else:
                    # D = isqrt(x[0] * x[1] * 4 / K0_prev * 10**18)
                    D = isqrt(unsafe_mul(unsafe_div(unsafe_mul(unsafe_mul(4, x[0]), x[1]), K0_prev), 10**18))
                    if S < D:
                        D = S

                __g1k0: uint256 = gamma + 10**18
                diff: uint256 = 0

                for i in range(255):
                    D_prev: uint256 = D
                    assert D > 0
                    # Unsafe division by D and D_prev is now safe

                    # K0: uint256 = 10**18
                    # for _x in x:
                    #     K0 = K0 * _x * N_COINS / D
                    # collapsed for 2 coins
                    K0: uint256 = unsafe_div(unsafe_div((10**18 * N_COINS**2) * x[0], D) * x[1], D)

                    _g1k0: uint256 = __g1k0
                    if _g1k0 > K0:
                        _g1k0 = unsafe_add(unsafe_sub(_g1k0, K0), 1)  # > 0
                    else:
                        _g1k0 = unsafe_add(unsafe_sub(K0, _g1k0), 1)  # > 0

                    # D / (A * N**N) * _g1k0**2 / gamma**2
                    mul1: uint256 = unsafe_div(unsafe_div(unsafe_div(10**18 * D, gamma) * _g1k0, gamma) * _g1k0 * A_MULTIPLIER, ANN)

                    # 2*N*K0 / _g1k0
                    mul2: uint256 = unsafe_div(((2 * 10**18) * N_COINS) * K0, _g1k0)

                    # calculate neg_fprime. here K0 > 0 is being validated (safediv).
                    neg_fprime: uint256 = (S + unsafe_div(S * mul2, 10**18)) + mul1 * N_COINS / K0 - unsafe_div(mul2 * D, 10**18)

                    # D -= f / fprime; neg_fprime safediv being validated
                    D_plus: uint256 = D * (neg_fprime + S) / neg_fprime
                    D_minus: uint256 = unsafe_div(D * D,  neg_fprime)
                    if 10**18 > K0:
                        D_minus += unsafe_div(unsafe_div(D * unsafe_div(mul1, neg_fprime), 10**18) * unsafe_sub(10**18, K0), K0)
                    else:
                        D_minus -= unsafe_div(unsafe_div(D * unsafe_div(mul1, neg_fprime), 10**18) * unsafe_sub(K0, 10**18), K0)

                    if D_plus > D_minus:
                        D = unsafe_sub(D_plus, D_minus)
                    else:
                        D = unsafe_div(unsafe_sub(D_minus, D_plus), 2)

                    if D > D_prev:
                        diff = unsafe_sub(D, D_prev)
                    else:
                        diff = unsafe_sub(D_prev, D)

                    if diff * 10**14 < max(10**16, D):  # Could reduce precision for gas efficiency here

                        for _x in x:
                            frac: uint256 = _x * 10**18 / D
                            assert (frac >= 10**16 - 1) and (frac < 10**20 + 1)  # dev: unsafe values x[i]
                        return D

                raise "Did not converge"

            @external
            @pure
            def get_y(
                _ANN: uint256,
                _gamma: uint256,
                _x: uint256[N_COINS],
                _D: uint256,
                i: uint256
            ) -> uint256[2]:

                # Safety checks
                assert _ANN > MIN_A - 1 and _ANN < MAX_A + 1  # dev: unsafe values A
                assert _gamma > MIN_GAMMA - 1 and _gamma < MAX_GAMMA + 1  # dev: unsafe values gamma
                assert _D > 10**17 - 1 and _D < 10**15 * 10**18 + 1 # dev: unsafe values D

                ANN: int256 = convert(_ANN, int256)
                gamma: int256 = convert(_gamma, int256)
                D: int256 = convert(_D, int256)
                x_j: int256 = convert(_x[1 - i], int256)
                gamma2: int256 = unsafe_mul(gamma, gamma)

                # savediv by x_j done here:
                y: int256 = D**2 / (x_j * N_COINS**2)

                # K0_i: int256 = (10**18 * N_COINS) * x_j / D
                K0_i: int256 = unsafe_div(10**18 * N_COINS * x_j, D)
                assert (K0_i > 10**16 * N_COINS - 1) and (K0_i < 10**20 * N_COINS + 1)  # dev: unsafe values x[i]

                ann_gamma2: int256 = ANN * gamma2

                # a = 10**36 / N_COINS**2
                a: int256 = 10**32

                # b = ANN*D*gamma2/4/10000/x_j/10**4 - 10**32*3 - 2*gamma*10**14
                b: int256 = (
                    D*ann_gamma2/400000000/x_j
                    - convert(unsafe_mul(10**32, 3), int256)
                    - unsafe_mul(unsafe_mul(2, gamma), 10**14)
                )

                # c = 10**32*3 + 4*gamma*10**14 + gamma2/10**4 + 4*ANN*gamma2*x_j/D/10000/4/10**4 - 4*ANN*gamma2/10000/4/10**4
                c: int256 = (
                    unsafe_mul(10**32, convert(3, int256))
                    + unsafe_mul(unsafe_mul(4, gamma), 10**14)
                    + unsafe_div(gamma2, 10**4)
                    + unsafe_div(unsafe_div(unsafe_mul(4, ann_gamma2), 400000000) * x_j, D)
                    - unsafe_div(unsafe_mul(4, ann_gamma2), 400000000)
                )

                # d = -(10**18+gamma)**2 / 10**4
                d: int256 = -unsafe_div(unsafe_add(10**18, gamma) ** 2, 10**4)

                # delta0: int256 = 3*a*c/b - b
                delta0: int256 = 3 * a * c / b - b  # safediv by b

                # delta1: int256 = 9*a*c/b - 2*b - 27*a**2/b*d/b
                delta1: int256 = 3 * delta0 + b - 27*a**2/b*d/b

                divider: int256 = 1
                threshold: int256 = min(min(abs(delta0), abs(delta1)), a)
                if threshold > 10**48:
                    divider = 10**30
                elif threshold > 10**46:
                    divider = 10**28
                elif threshold > 10**44:
                    divider = 10**26
                elif threshold > 10**42:
                    divider = 10**24
                elif threshold > 10**40:
                    divider = 10**22
                elif threshold > 10**38:
                    divider = 10**20
                elif threshold > 10**36:
                    divider = 10**18
                elif threshold > 10**34:
                    divider = 10**16
                elif threshold > 10**32:
                    divider = 10**14
                elif threshold > 10**30:
                    divider = 10**12
                elif threshold > 10**28:
                    divider = 10**10
                elif threshold > 10**26:
                    divider = 10**8
                elif threshold > 10**24:
                    divider = 10**6
                elif threshold > 10**20:
                    divider = 10**2

                a = unsafe_div(a, divider)
                b = unsafe_div(b, divider)
                c = unsafe_div(c, divider)
                d = unsafe_div(d, divider)

                # delta0 = 3*a*c/b - b: here we can do more unsafe ops now:
                delta0 = unsafe_div(unsafe_mul(unsafe_mul(3, a), c), b) - b

                # delta1 = 9*a*c/b - 2*b - 27*a**2/b*d/b
                delta1 = 3 * delta0 + b - unsafe_div(unsafe_mul(unsafe_div(unsafe_mul(27, a**2), b), d), b)

                # sqrt_arg: int256 = delta1**2 + 4*delta0**2/b*delta0
                sqrt_arg: int256 = delta1**2 + unsafe_mul(unsafe_div(4*delta0**2, b), delta0)
                sqrt_val: int256 = 0
                if sqrt_arg > 0:
                    sqrt_val = convert(isqrt(convert(sqrt_arg, uint256)), int256)
                else:
                    return [
                        self._newton_y(_ANN, _gamma, _x, _D, i),
                        0
                    ]

                b_cbrt: int256 = 0
                if b > 0:
                    b_cbrt = convert(self._cbrt(convert(b, uint256)), int256)
                else:
                    b_cbrt = -convert(self._cbrt(convert(-b, uint256)), int256)

                second_cbrt: int256 = 0
                if delta1 > 0:
                    # second_cbrt = convert(self._cbrt(convert((delta1 + sqrt_val), uint256) / 2), int256)
                    second_cbrt = convert(self._cbrt(convert(unsafe_add(delta1, sqrt_val), uint256) / 2), int256)
                else:
                    # second_cbrt = -convert(self._cbrt(convert(unsafe_sub(sqrt_val, delta1), uint256) / 2), int256)
                    second_cbrt = -convert(self._cbrt(unsafe_div(convert(unsafe_sub(sqrt_val, delta1), uint256), 2)), int256)

                # C1: int256 = b_cbrt**2/10**18*second_cbrt/10**18
                C1: int256 = unsafe_div(unsafe_mul(unsafe_div(b_cbrt**2, 10**18), second_cbrt), 10**18)

                # root: int256 = (10**18*C1 - 10**18*b - 10**18*b*delta0/C1)/(3*a), keep 2 safe ops here.
                root: int256 = (unsafe_mul(10**18, C1) - unsafe_mul(10**18, b) - unsafe_mul(10**18, b)/C1*delta0)/unsafe_mul(3, a)

                # y_out: uint256[2] =  [
                #     convert(D**2/x_j*root/4/10**18, uint256),   # <--- y
                #     convert(root, uint256)  # <----------------------- K0Prev
                # ]
                y_out: uint256[2] = [convert(unsafe_div(unsafe_div(unsafe_mul(unsafe_div(D**2, x_j), root), 4), 10**18), uint256), convert(root, uint256)]

                frac: uint256 = unsafe_div(y_out[0] * 10**18, _D)
                assert (frac >= 10**16 - 1) and (frac < 10**20 + 1)  # dev: unsafe value for y

                return y_out
            ```

    === "Example"

        ```shell
        >>> TwoCrypto.
        ```


### `fee_calc`
!!! description "`TwoCrypto.fee_calc(xp: uint256[N_COINS]) -> uint256:`"

    Getter for the charged fee by the pool at the current state.

    Returns: fee value (uint256).

    | Input      | Type      | Description |
    | ---------- | --------- | ----------- |
    | `xp` |  `uint256[N_COINS]` | pool balances multiplied by the coin precisions |

    ??? quote "Source code"

        ```vyper
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

            fee_params: uint256[3] = self._unpack_3(self.packed_fee_params)
            f: uint256 = xp[0] + xp[1]
            f = fee_params[2] * 10**18 / (
                fee_params[2] + 10**18 -
                (10**18 * N_COINS**N_COINS) * xp[0] / f * xp[1] / f
            )

            return unsafe_div(
                fee_params[0] * f + fee_params[1] * (10**18 - f),
                10**18
            )
        ```

    === "Example"

        ```shell
        >>> TwoCrypto.fee_calc(todo)
        ```


### `get_dy`
!!! description "`TwoCrypto.get_dy(i: uint256, j: uint256, dx: uint256) -> uint256:`"

    Getter for the received amount of coin `j` for swapping in `dx` amount of coin `i`. This method includes fees.

    Returns: Exact amount of output `j` tokens (`uint256`). 

    | Input      | Type      | Description |
    | ---------- | --------- | ----------- |
    | `i` |  `uint256` | index of input token |
    | `j` |  `uint256` | index of output token |
    | `dx` |  `uint256` | amount of input tokens |

    ??? quote "Source code"

        === "CurveTwocryptoOptimized.vy"

            ```vyper
            @external
            @view
            def get_dy(i: uint256, j: uint256, dx: uint256) -> uint256:
                """
                @notice Get amount of coin[j] tokens received for swapping in dx amount of coin[i]
                @dev Includes fee.
                @param i index of input token. Check pool.coins(i) to get coin address at ith index
                @param j index of output token
                @param dx amount of input coin[i] tokens
                @return uint256 Exact amount of output j tokens for dx amount of i input tokens.
                """
                view_contract: address = factory.views_implementation()
                return Views(view_contract).get_dy(i, j, dx, self)
            ```

        === "CurveCryptoViews2Optimized.vy"

            ```vyper
            @external
            @view
            def get_dy(
                i: uint256, j: uint256, dx: uint256, swap: address
            ) -> uint256:

                dy: uint256 = 0
                xp: uint256[N_COINS] = empty(uint256[N_COINS])

                # dy = (get_y(x + dx) - y) * (1 - fee)
                dy, xp = self._get_dy_nofee(i, j, dx, swap)
                dy -= Curve(swap).fee_calc(xp) * dy / 10**10

                return dy

            @internal
            @view
            def _get_dy_nofee(
                i: uint256, j: uint256, dx: uint256, swap: address
            ) -> (uint256, uint256[N_COINS]):

                assert i != j and i < N_COINS and j < N_COINS, "coin index out of range"
                assert dx > 0, "do not exchange 0 coins"

                math: Math = Curve(swap).MATH()

                xp: uint256[N_COINS] = empty(uint256[N_COINS])
                precisions: uint256[N_COINS] = empty(uint256[N_COINS])
                price_scale: uint256 = 0
                D: uint256 = 0
                token_supply: uint256 = 0
                A: uint256 = 0
                gamma: uint256 = 0

                xp, D, token_supply, price_scale, A, gamma, precisions = self._prep_calc(swap)

                # adjust xp with input dx
                xp[i] += dx
                xp = [
                    xp[0] * precisions[0],
                    xp[1] * price_scale * precisions[1] / PRECISION
                ]

                y_out: uint256[2] = math.get_y(A, gamma, xp, D, j)

                dy: uint256 = xp[j] - y_out[0] - 1
                xp[j] = y_out[0]
                if j > 0:
                    dy = dy * PRECISION / price_scale
                dy /= precisions[j]

                return dy, xp
            ```

        === "CurveCryptoMathOptimized2.vy"

            ```vyper
            @external
            @pure
            def get_y(
                _ANN: uint256,
                _gamma: uint256,
                _x: uint256[N_COINS],
                _D: uint256,
                i: uint256
            ) -> uint256[2]:

                # Safety checks
                assert _ANN > MIN_A - 1 and _ANN < MAX_A + 1  # dev: unsafe values A
                assert _gamma > MIN_GAMMA - 1 and _gamma < MAX_GAMMA + 1  # dev: unsafe values gamma
                assert _D > 10**17 - 1 and _D < 10**15 * 10**18 + 1 # dev: unsafe values D

                ANN: int256 = convert(_ANN, int256)
                gamma: int256 = convert(_gamma, int256)
                D: int256 = convert(_D, int256)
                x_j: int256 = convert(_x[1 - i], int256)
                gamma2: int256 = unsafe_mul(gamma, gamma)

                # savediv by x_j done here:
                y: int256 = D**2 / (x_j * N_COINS**2)

                # K0_i: int256 = (10**18 * N_COINS) * x_j / D
                K0_i: int256 = unsafe_div(10**18 * N_COINS * x_j, D)
                assert (K0_i > 10**16 * N_COINS - 1) and (K0_i < 10**20 * N_COINS + 1)  # dev: unsafe values x[i]

                ann_gamma2: int256 = ANN * gamma2

                # a = 10**36 / N_COINS**2
                a: int256 = 10**32

                # b = ANN*D*gamma2/4/10000/x_j/10**4 - 10**32*3 - 2*gamma*10**14
                b: int256 = (
                    D*ann_gamma2/400000000/x_j
                    - convert(unsafe_mul(10**32, 3), int256)
                    - unsafe_mul(unsafe_mul(2, gamma), 10**14)
                )

                # c = 10**32*3 + 4*gamma*10**14 + gamma2/10**4 + 4*ANN*gamma2*x_j/D/10000/4/10**4 - 4*ANN*gamma2/10000/4/10**4
                c: int256 = (
                    unsafe_mul(10**32, convert(3, int256))
                    + unsafe_mul(unsafe_mul(4, gamma), 10**14)
                    + unsafe_div(gamma2, 10**4)
                    + unsafe_div(unsafe_div(unsafe_mul(4, ann_gamma2), 400000000) * x_j, D)
                    - unsafe_div(unsafe_mul(4, ann_gamma2), 400000000)
                )

                # d = -(10**18+gamma)**2 / 10**4
                d: int256 = -unsafe_div(unsafe_add(10**18, gamma) ** 2, 10**4)

                # delta0: int256 = 3*a*c/b - b
                delta0: int256 = 3 * a * c / b - b  # safediv by b

                # delta1: int256 = 9*a*c/b - 2*b - 27*a**2/b*d/b
                delta1: int256 = 3 * delta0 + b - 27*a**2/b*d/b

                divider: int256 = 1
                threshold: int256 = min(min(abs(delta0), abs(delta1)), a)
                if threshold > 10**48:
                    divider = 10**30
                elif threshold > 10**46:
                    divider = 10**28
                elif threshold > 10**44:
                    divider = 10**26
                elif threshold > 10**42:
                    divider = 10**24
                elif threshold > 10**40:
                    divider = 10**22
                elif threshold > 10**38:
                    divider = 10**20
                elif threshold > 10**36:
                    divider = 10**18
                elif threshold > 10**34:
                    divider = 10**16
                elif threshold > 10**32:
                    divider = 10**14
                elif threshold > 10**30:
                    divider = 10**12
                elif threshold > 10**28:
                    divider = 10**10
                elif threshold > 10**26:
                    divider = 10**8
                elif threshold > 10**24:
                    divider = 10**6
                elif threshold > 10**20:
                    divider = 10**2

                a = unsafe_div(a, divider)
                b = unsafe_div(b, divider)
                c = unsafe_div(c, divider)
                d = unsafe_div(d, divider)

                # delta0 = 3*a*c/b - b: here we can do more unsafe ops now:
                delta0 = unsafe_div(unsafe_mul(unsafe_mul(3, a), c), b) - b

                # delta1 = 9*a*c/b - 2*b - 27*a**2/b*d/b
                delta1 = 3 * delta0 + b - unsafe_div(unsafe_mul(unsafe_div(unsafe_mul(27, a**2), b), d), b)

                # sqrt_arg: int256 = delta1**2 + 4*delta0**2/b*delta0
                sqrt_arg: int256 = delta1**2 + unsafe_mul(unsafe_div(4*delta0**2, b), delta0)
                sqrt_val: int256 = 0
                if sqrt_arg > 0:
                    sqrt_val = convert(isqrt(convert(sqrt_arg, uint256)), int256)
                else:
                    return [
                        self._newton_y(_ANN, _gamma, _x, _D, i),
                        0
                    ]

                b_cbrt: int256 = 0
                if b > 0:
                    b_cbrt = convert(self._cbrt(convert(b, uint256)), int256)
                else:
                    b_cbrt = -convert(self._cbrt(convert(-b, uint256)), int256)

                second_cbrt: int256 = 0
                if delta1 > 0:
                    # second_cbrt = convert(self._cbrt(convert((delta1 + sqrt_val), uint256) / 2), int256)
                    second_cbrt = convert(self._cbrt(convert(unsafe_add(delta1, sqrt_val), uint256) / 2), int256)
                else:
                    # second_cbrt = -convert(self._cbrt(convert(unsafe_sub(sqrt_val, delta1), uint256) / 2), int256)
                    second_cbrt = -convert(self._cbrt(unsafe_div(convert(unsafe_sub(sqrt_val, delta1), uint256), 2)), int256)

                # C1: int256 = b_cbrt**2/10**18*second_cbrt/10**18
                C1: int256 = unsafe_div(unsafe_mul(unsafe_div(b_cbrt**2, 10**18), second_cbrt), 10**18)

                # root: int256 = (10**18*C1 - 10**18*b - 10**18*b*delta0/C1)/(3*a), keep 2 safe ops here.
                root: int256 = (unsafe_mul(10**18, C1) - unsafe_mul(10**18, b) - unsafe_mul(10**18, b)/C1*delta0)/unsafe_mul(3, a)

                # y_out: uint256[2] =  [
                #     convert(D**2/x_j*root/4/10**18, uint256),   # <--- y
                #     convert(root, uint256)  # <----------------------- K0Prev
                # ]
                y_out: uint256[2] = [convert(unsafe_div(unsafe_div(unsafe_mul(unsafe_div(D**2, x_j), root), 4), 10**18), uint256), convert(root, uint256)]

                frac: uint256 = unsafe_div(y_out[0] * 10**18, _D)
                assert (frac >= 10**16 - 1) and (frac < 10**20 + 1)  # dev: unsafe value for y

                return y_out
            ```

    === "Example"

        ```shell
        >>> TwoCrypto.get_dy(todo)
        ```


### `get_dx`
!!! description "`TwoCrypto.get_dx(i: uint256, j: uint256, dy: uint256) -> uint256:`"

    Getter for the required amount of coin `i` to input for swapping out `dy` amount of token `j`.

    Returns: amount of coins received (`uint256`).

    | Input      | Type      | Description |
    | ---------- | --------- | ----------- |
    | `i` |  `uint256` | index of input token |
    | `j` |  `uint256` | index of output token |
    | `dy`|  `uint256` | amount of input tokens |

    ??? quote "Source code"

        === "CurveTwocryptoOptimized.vy"

            ```vyper
            @external
            @view
            def get_dx(i: uint256, j: uint256, dy: uint256) -> uint256:
                """
                @notice Get amount of coin[i] tokens to input for swapping out dy amount
                        of coin[j]
                @dev This is an approximate method, and returns estimates close to the input
                    amount. Expensive to call on-chain.
                @param i index of input token. Check pool.coins(i) to get coin address at
                    ith index
                @param j index of output token
                @param dy amount of input coin[j] tokens received
                @return uint256 Approximate amount of input i tokens to get dy amount of j tokens.
                """
                view_contract: address = factory.views_implementation()
                return Views(view_contract).get_dx(i, j, dy, self)
            ```

        === "CurveCryptoViews2Optimized.vy"

            ```vyper
            @view
            @external
            def get_dx(
                i: uint256, j: uint256, dy: uint256, swap: address
            ) -> uint256:

                dx: uint256 = 0
                xp: uint256[N_COINS] = empty(uint256[N_COINS])
                fee_dy: uint256 = 0
                _dy: uint256 = dy

                # for more precise dx (but never exact), increase num loops
                for k in range(5):
                    dx, xp = self._get_dx_fee(i, j, _dy, swap)
                    fee_dy = Curve(swap).fee_calc(xp) * _dy / 10**10
                    _dy = dy + fee_dy + 1

                return dx

            @internal
            @view
            def _get_dx_fee(
                i: uint256, j: uint256, dy: uint256, swap: address
            ) -> (uint256, uint256[N_COINS]):

                # here, dy must include fees (and 1 wei offset)

                assert i != j and i < N_COINS and j < N_COINS, "coin index out of range"
                assert dy > 0, "do not exchange out 0 coins"

                math: Math = Curve(swap).MATH()

                xp: uint256[N_COINS] = empty(uint256[N_COINS])
                precisions: uint256[N_COINS] = empty(uint256[N_COINS])
                price_scale: uint256 = 0
                D: uint256 = 0
                token_supply: uint256 = 0
                A: uint256 = 0
                gamma: uint256 = 0

                xp, D, token_supply, price_scale, A, gamma, precisions = self._prep_calc(swap)

                # adjust xp with output dy. dy contains fee element, which we handle later
                # (hence this internal method is called _get_dx_fee)
                xp[j] -= dy
                xp = [xp[0] * precisions[0], xp[1] * price_scale * precisions[1] / PRECISION]

                x_out: uint256[2] = math.get_y(A, gamma, xp, D, i)
                dx: uint256 = x_out[0] - xp[i]
                xp[i] = x_out[0]

                if i > 0:
                    dx = dx * PRECISION / price_scale
                dx /= precisions[i]

                return dx, xp
            ```

        === "CurveCryptoMathOptimized2.vy"

            ```vyper
            @external
            @pure
            def get_y(
                _ANN: uint256,
                _gamma: uint256,
                _x: uint256[N_COINS],
                _D: uint256,
                i: uint256
            ) -> uint256[2]:

                # Safety checks
                assert _ANN > MIN_A - 1 and _ANN < MAX_A + 1  # dev: unsafe values A
                assert _gamma > MIN_GAMMA - 1 and _gamma < MAX_GAMMA + 1  # dev: unsafe values gamma
                assert _D > 10**17 - 1 and _D < 10**15 * 10**18 + 1 # dev: unsafe values D

                ANN: int256 = convert(_ANN, int256)
                gamma: int256 = convert(_gamma, int256)
                D: int256 = convert(_D, int256)
                x_j: int256 = convert(_x[1 - i], int256)
                gamma2: int256 = unsafe_mul(gamma, gamma)

                # savediv by x_j done here:
                y: int256 = D**2 / (x_j * N_COINS**2)

                # K0_i: int256 = (10**18 * N_COINS) * x_j / D
                K0_i: int256 = unsafe_div(10**18 * N_COINS * x_j, D)
                assert (K0_i > 10**16 * N_COINS - 1) and (K0_i < 10**20 * N_COINS + 1)  # dev: unsafe values x[i]

                ann_gamma2: int256 = ANN * gamma2

                # a = 10**36 / N_COINS**2
                a: int256 = 10**32

                # b = ANN*D*gamma2/4/10000/x_j/10**4 - 10**32*3 - 2*gamma*10**14
                b: int256 = (
                    D*ann_gamma2/400000000/x_j
                    - convert(unsafe_mul(10**32, 3), int256)
                    - unsafe_mul(unsafe_mul(2, gamma), 10**14)
                )

                # c = 10**32*3 + 4*gamma*10**14 + gamma2/10**4 + 4*ANN*gamma2*x_j/D/10000/4/10**4 - 4*ANN*gamma2/10000/4/10**4
                c: int256 = (
                    unsafe_mul(10**32, convert(3, int256))
                    + unsafe_mul(unsafe_mul(4, gamma), 10**14)
                    + unsafe_div(gamma2, 10**4)
                    + unsafe_div(unsafe_div(unsafe_mul(4, ann_gamma2), 400000000) * x_j, D)
                    - unsafe_div(unsafe_mul(4, ann_gamma2), 400000000)
                )

                # d = -(10**18+gamma)**2 / 10**4
                d: int256 = -unsafe_div(unsafe_add(10**18, gamma) ** 2, 10**4)

                # delta0: int256 = 3*a*c/b - b
                delta0: int256 = 3 * a * c / b - b  # safediv by b

                # delta1: int256 = 9*a*c/b - 2*b - 27*a**2/b*d/b
                delta1: int256 = 3 * delta0 + b - 27*a**2/b*d/b

                divider: int256 = 1
                threshold: int256 = min(min(abs(delta0), abs(delta1)), a)
                if threshold > 10**48:
                    divider = 10**30
                elif threshold > 10**46:
                    divider = 10**28
                elif threshold > 10**44:
                    divider = 10**26
                elif threshold > 10**42:
                    divider = 10**24
                elif threshold > 10**40:
                    divider = 10**22
                elif threshold > 10**38:
                    divider = 10**20
                elif threshold > 10**36:
                    divider = 10**18
                elif threshold > 10**34:
                    divider = 10**16
                elif threshold > 10**32:
                    divider = 10**14
                elif threshold > 10**30:
                    divider = 10**12
                elif threshold > 10**28:
                    divider = 10**10
                elif threshold > 10**26:
                    divider = 10**8
                elif threshold > 10**24:
                    divider = 10**6
                elif threshold > 10**20:
                    divider = 10**2

                a = unsafe_div(a, divider)
                b = unsafe_div(b, divider)
                c = unsafe_div(c, divider)
                d = unsafe_div(d, divider)

                # delta0 = 3*a*c/b - b: here we can do more unsafe ops now:
                delta0 = unsafe_div(unsafe_mul(unsafe_mul(3, a), c), b) - b

                # delta1 = 9*a*c/b - 2*b - 27*a**2/b*d/b
                delta1 = 3 * delta0 + b - unsafe_div(unsafe_mul(unsafe_div(unsafe_mul(27, a**2), b), d), b)

                # sqrt_arg: int256 = delta1**2 + 4*delta0**2/b*delta0
                sqrt_arg: int256 = delta1**2 + unsafe_mul(unsafe_div(4*delta0**2, b), delta0)
                sqrt_val: int256 = 0
                if sqrt_arg > 0:
                    sqrt_val = convert(isqrt(convert(sqrt_arg, uint256)), int256)
                else:
                    return [
                        self._newton_y(_ANN, _gamma, _x, _D, i),
                        0
                    ]

                b_cbrt: int256 = 0
                if b > 0:
                    b_cbrt = convert(self._cbrt(convert(b, uint256)), int256)
                else:
                    b_cbrt = -convert(self._cbrt(convert(-b, uint256)), int256)

                second_cbrt: int256 = 0
                if delta1 > 0:
                    # second_cbrt = convert(self._cbrt(convert((delta1 + sqrt_val), uint256) / 2), int256)
                    second_cbrt = convert(self._cbrt(convert(unsafe_add(delta1, sqrt_val), uint256) / 2), int256)
                else:
                    # second_cbrt = -convert(self._cbrt(convert(unsafe_sub(sqrt_val, delta1), uint256) / 2), int256)
                    second_cbrt = -convert(self._cbrt(unsafe_div(convert(unsafe_sub(sqrt_val, delta1), uint256), 2)), int256)

                # C1: int256 = b_cbrt**2/10**18*second_cbrt/10**18
                C1: int256 = unsafe_div(unsafe_mul(unsafe_div(b_cbrt**2, 10**18), second_cbrt), 10**18)

                # root: int256 = (10**18*C1 - 10**18*b - 10**18*b*delta0/C1)/(3*a), keep 2 safe ops here.
                root: int256 = (unsafe_mul(10**18, C1) - unsafe_mul(10**18, b) - unsafe_mul(10**18, b)/C1*delta0)/unsafe_mul(3, a)

                # y_out: uint256[2] =  [
                #     convert(D**2/x_j*root/4/10**18, uint256),   # <--- y
                #     convert(root, uint256)  # <----------------------- K0Prev
                # ]
                y_out: uint256[2] = [convert(unsafe_div(unsafe_div(unsafe_mul(unsafe_div(D**2, x_j), root), 4), 10**18), uint256), convert(root, uint256)]

                frac: uint256 = unsafe_div(y_out[0] * 10**18, _D)
                assert (frac >= 10**16 - 1) and (frac < 10**20 + 1)  # dev: unsafe value for y

                return y_out
            ```

    === "Example"

        ```shell
        >>> TwoCrypto.get_dx(todo)
        ```



## Adding / Removing Liquidity

adding removing liq

### `add_liquidity`
!!! description "`TwoCrypto.add_liquidity(amounts: uint256[N_COINS], min_mint_amount: uint256, receiver: address = msg.sender) -> uint256:`"

    Function to add liquidity to the pool and mint the corresponding lp tokens.

    Returns: amount of lp tokens received (`uint256`).

    Emits ``

    | Input      | Type      | Description |
    | ---------- | --------- | ----------- |
    | `amounts` |  `uint256[N_COINS]` | amount of each coin to add |
    | `min_mint_amount` |  `uint256` | minimum amount of lp tokens to mint |
    | `receiver` |  `address` | receiver of the lp tokens; defaults to msg.sender|

    ??? quote "Source code"

        === "CurveTwocryptoOptimized.vy"

            ```python
            event AddLiquidity:
                provider: indexed(address)
                token_amounts: uint256[N_COINS]
                fee: uint256
                token_supply: uint256
                packed_price_scale: uint256

            @external
            @nonreentrant("lock")
            def add_liquidity(
                amounts: uint256[N_COINS],
                min_mint_amount: uint256,
                receiver: address = msg.sender
            ) -> uint256:
                """
                @notice Adds liquidity into the pool.
                @param amounts Amounts of each coin to add.
                @param min_mint_amount Minimum amount of LP to mint.
                @param receiver Address to send the LP tokens to. Default is msg.sender
                @return uint256 Amount of LP tokens received by the `receiver
                """

                A_gamma: uint256[2] = self._A_gamma()
                xp: uint256[N_COINS] = self.balances
                amountsp: uint256[N_COINS] = empty(uint256[N_COINS])
                d_token: uint256 = 0
                d_token_fee: uint256 = 0
                old_D: uint256 = 0

                assert amounts[0] + amounts[1] > 0  # dev: no coins to add

                # --------------------- Get prices, balances -----------------------------

                price_scale: uint256 = self.cached_price_scale

                # -------------------------------------- Update balances and calculate xp.
                xp_old: uint256[N_COINS] = xp
                amounts_received: uint256[N_COINS] = empty(uint256[N_COINS])

                ########################## TRANSFER IN <-------

                for i in range(N_COINS):
                    if amounts[i] > 0:
                        # Updates self.balances here:
                        amounts_received[i] = self._transfer_in(
                            i,
                            amounts[i],
                            msg.sender,
                            False,  # <--------------------- Disable optimistic transfers.
                        )
                        xp[i] = xp[i] + amounts_received[i]

                xp = [
                    xp[0] * PRECISIONS[0],
                    unsafe_div(xp[1] * price_scale * PRECISIONS[1], PRECISION)
                ]
                xp_old = [
                    xp_old[0] * PRECISIONS[0],
                    unsafe_div(xp_old[1] * price_scale * PRECISIONS[1], PRECISION)
                ]

                for i in range(N_COINS):
                    if amounts_received[i] > 0:
                        amountsp[i] = xp[i] - xp_old[i]

                # -------------------- Calculate LP tokens to mint -----------------------

                if self.future_A_gamma_time > block.timestamp:  # <--- A_gamma is ramping.

                    # ----- Recalculate the invariant if A or gamma are undergoing a ramp.
                    old_D = MATH.newton_D(A_gamma[0], A_gamma[1], xp_old, 0)

                else:

                    old_D = self.D

                D: uint256 = MATH.newton_D(A_gamma[0], A_gamma[1], xp, 0)

                token_supply: uint256 = self.totalSupply
                if old_D > 0:
                    d_token = token_supply * D / old_D - token_supply
                else:
                    d_token = self.get_xcp(D, price_scale)  # <----- Making initial virtual price equal to 1.

                assert d_token > 0  # dev: nothing minted

                if old_D > 0:

                    d_token_fee = (
                        self._calc_token_fee(amountsp, xp) * d_token / 10**10 + 1
                    )

                    d_token -= d_token_fee
                    token_supply += d_token
                    self.mint(receiver, d_token)
                    self.admin_lp_virtual_balance += unsafe_div(ADMIN_FEE * d_token_fee, 10**10)

                    price_scale = self.tweak_price(A_gamma, xp, D, 0)

                else:

                    # (re)instatiating an empty pool:

                    self.D = D
                    self.virtual_price = 10**18
                    self.xcp_profit = 10**18
                    self.xcp_profit_a = 10**18

                    # Initialise xcp oracle here:
                    self.cached_xcp_oracle = d_token  # <--- virtual_price * totalSupply / 10**18

                    self.mint(receiver, d_token)

                assert d_token >= min_mint_amount, "Slippage"

                # ---------------------------------------------- Log and claim admin fees.

                log AddLiquidity(
                    receiver,
                    amounts_received,
                    d_token_fee,
                    token_supply,
                    price_scale
                )

                return d_token
            ``` 

        === "CurveCryptoMathOptimized2.vy"

            ```python
            @external
            @view
            def newton_D(ANN: uint256, gamma: uint256, x_unsorted: uint256[N_COINS], K0_prev: uint256 = 0) -> uint256:
                """
                Finding the invariant using Newton method.
                ANN is higher by the factor A_MULTIPLIER
                ANN is already A * N**N
                """

                # Safety checks
                assert ANN > MIN_A - 1 and ANN < MAX_A + 1  # dev: unsafe values A
                assert gamma > MIN_GAMMA - 1 and gamma < MAX_GAMMA + 1  # dev: unsafe values gamma

                # Initial value of invariant D is that for constant-product invariant
                x: uint256[N_COINS] = x_unsorted
                if x[0] < x[1]:
                    x = [x_unsorted[1], x_unsorted[0]]

                assert x[0] > 10**9 - 1 and x[0] < 10**15 * 10**18 + 1  # dev: unsafe values x[0]
                assert unsafe_div(x[1] * 10**18, x[0]) > 10**14 - 1  # dev: unsafe values x[i] (input)

                S: uint256 = unsafe_add(x[0], x[1])  # can unsafe add here because we checked x[0] bounds

                D: uint256 = 0
                if K0_prev == 0:
                    D = N_COINS * isqrt(unsafe_mul(x[0], x[1]))
                else:
                    # D = isqrt(x[0] * x[1] * 4 / K0_prev * 10**18)
                    D = isqrt(unsafe_mul(unsafe_div(unsafe_mul(unsafe_mul(4, x[0]), x[1]), K0_prev), 10**18))
                    if S < D:
                        D = S

                __g1k0: uint256 = gamma + 10**18
                diff: uint256 = 0

                for i in range(255):
                    D_prev: uint256 = D
                    assert D > 0
                    # Unsafe division by D and D_prev is now safe

                    # K0: uint256 = 10**18
                    # for _x in x:
                    #     K0 = K0 * _x * N_COINS / D
                    # collapsed for 2 coins
                    K0: uint256 = unsafe_div(unsafe_div((10**18 * N_COINS**2) * x[0], D) * x[1], D)

                    _g1k0: uint256 = __g1k0
                    if _g1k0 > K0:
                        _g1k0 = unsafe_add(unsafe_sub(_g1k0, K0), 1)  # > 0
                    else:
                        _g1k0 = unsafe_add(unsafe_sub(K0, _g1k0), 1)  # > 0

                    # D / (A * N**N) * _g1k0**2 / gamma**2
                    mul1: uint256 = unsafe_div(unsafe_div(unsafe_div(10**18 * D, gamma) * _g1k0, gamma) * _g1k0 * A_MULTIPLIER, ANN)

                    # 2*N*K0 / _g1k0
                    mul2: uint256 = unsafe_div(((2 * 10**18) * N_COINS) * K0, _g1k0)

                    # calculate neg_fprime. here K0 > 0 is being validated (safediv).
                    neg_fprime: uint256 = (S + unsafe_div(S * mul2, 10**18)) + mul1 * N_COINS / K0 - unsafe_div(mul2 * D, 10**18)

                    # D -= f / fprime; neg_fprime safediv being validated
                    D_plus: uint256 = D * (neg_fprime + S) / neg_fprime
                    D_minus: uint256 = unsafe_div(D * D,  neg_fprime)
                    if 10**18 > K0:
                        D_minus += unsafe_div(unsafe_div(D * unsafe_div(mul1, neg_fprime), 10**18) * unsafe_sub(10**18, K0), K0)
                    else:
                        D_minus -= unsafe_div(unsafe_div(D * unsafe_div(mul1, neg_fprime), 10**18) * unsafe_sub(K0, 10**18), K0)

                    if D_plus > D_minus:
                        D = unsafe_sub(D_plus, D_minus)
                    else:
                        D = unsafe_div(unsafe_sub(D_minus, D_plus), 2)

                    if D > D_prev:
                        diff = unsafe_sub(D, D_prev)
                    else:
                        diff = unsafe_sub(D_prev, D)

                    if diff * 10**14 < max(10**16, D):  # Could reduce precision for gas efficiency here

                        for _x in x:
                            frac: uint256 = _x * 10**18 / D
                            assert (frac >= 10**16 - 1) and (frac < 10**20 + 1)  # dev: unsafe values x[i]
                        return D

                raise "Did not converge"
            ```

    === "Example"

        ```shell
        >>> TwoCrypto.add_liquidity(todo)
        ```


### `calc_token_fee`
!!! description "`TwoCrypto.calc_token_fee(amounts: uint256[N_COINS], xp: uint256[N_COINS]) -> uint256:`"

    Function to calculate the charged fee on `amounts` when adding liquidity.

    Returns: charged fee (`uint256`).

    | Input      | Type      | Description |
    | ---------- | --------- | ----------- |
    | `amounts` |  `uint256[N_COINS]` | amount of coins added to the pool |
    | `xp` |  `uint256[N_COINS]` | pool balances multiplied by the coin precisions |

    ??? quote "Source code"

        ```vyper
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
        ```

    === "Example"

        ```shell
        >>> TwoCrypto.calc_token_fee
        ```


### `remove_liquidity`
!!! description "`TwoCrypto.remove_liquidity(_amount: uint256, min_amounts: uint256[N_COINS], receiver: address = msg.sender) -> uint256[N_COINS]:`"

    Function to remove liquidity from the pool and burn `_amount` of lp tokens. When removing liquidity with this function, no fees are charged as the coins are withdrawin in balanced proportions. This function also upkeeps the xcp_oracle since liquidity was removed.

    Returns: withdrawn balances (`uint256[N_COINS]`).

    Emits: `RemoveLiquidity`

    | Input      | Type      | Description |
    | ---------- | --------- | ----------- |
    | `_amount` |  `uint256` | amount of lp tokens to burn |
    | `min_amounts` |  `uint256[N_COINS]` | minimum amounts of token to withdraw |
    | `receiver` |  `address` | receiver of the coins; defaults to msg.sender |

    !!!info 
        This withdrawal method is very safe, does no complex math since tokens are withdrawn in balanced proportions.

    ??? quote "Source code"

        === "CurveTwocryptoOptimized.vy"

            ```vyper
            event RemoveLiquidity:
                provider: indexed(address)
                token_amounts: uint256[N_COINS]
                token_supply: uint256

            @external
            @nonreentrant("lock")
            def remove_liquidity(
                _amount: uint256,
                min_amounts: uint256[N_COINS],
                receiver: address = msg.sender,
            ) -> uint256[N_COINS]:
                """
                @notice This withdrawal method is very safe, does no complex math since
                        tokens are withdrawn in balanced proportions. No fees are charged.
                @param _amount Amount of LP tokens to burn
                @param min_amounts Minimum amounts of tokens to withdraw
                @param receiver Address to send the withdrawn tokens to
                @return uint256[3] Amount of pool tokens received by the `receiver`
                """
                amount: uint256 = _amount
                balances: uint256[N_COINS] = self.balances
                withdraw_amounts: uint256[N_COINS] = empty(uint256[N_COINS])

                # -------------------------------------------------------- Burn LP tokens.

                total_supply: uint256 = self.totalSupply  # <------ Get totalSupply before
                self.burnFrom(msg.sender, _amount)  # ---- reducing it with self.burnFrom.

                # There are two cases for withdrawing tokens from the pool.
                #   Case 1. Withdrawal does not empty the pool.
                #           In this situation, D is adjusted proportional to the amount of
                #           LP tokens burnt. ERC20 tokens transferred is proportional
                #           to : (AMM balance * LP tokens in) / LP token total supply
                #   Case 2. Withdrawal empties the pool.
                #           In this situation, all tokens are withdrawn and the invariant
                #           is reset.

                if amount == total_supply:  # <----------------------------------- Case 2.

                    for i in range(N_COINS):

                        withdraw_amounts[i] = balances[i]

                else:  # <-------------------------------------------------------- Case 1.

                    amount -= 1  # <---- To prevent rounding errors, favor LPs a tiny bit.

                    for i in range(N_COINS):

                        withdraw_amounts[i] = balances[i] * amount / total_supply
                        assert withdraw_amounts[i] >= min_amounts[i]

                D: uint256 = self.D
                self.D = D - unsafe_div(D * amount, total_supply)  # <----------- Reduce D
                #      proportional to the amount of tokens leaving. Since withdrawals are
                #       balanced, this is a simple subtraction. If amount == total_supply,
                #                                                             D will be 0.

                # ---------------------------------- Transfers ---------------------------

                for i in range(N_COINS):
                    # _transfer_out updates self.balances here. Update to state occurs
                    # before external calls:
                    self._transfer_out(i, withdraw_amounts[i], receiver)

                log RemoveLiquidity(msg.sender, withdraw_amounts, total_supply - _amount)

                # --------------------------- Upkeep xcp oracle --------------------------

                # Update xcp since liquidity was removed:
                xp: uint256[N_COINS] = self.xp(self.balances, self.cached_price_scale)
                last_xcp: uint256 = isqrt(xp[0] * xp[1])  # <----------- Cache it for now.

                last_timestamp: uint256[2] = self._unpack_2(self.last_timestamp)
                if last_timestamp[1] < block.timestamp:

                    cached_xcp_oracle: uint256 = self.cached_xcp_oracle
                    alpha: uint256 = MATH.wad_exp(
                        -convert(
                            unsafe_div(
                                unsafe_sub(block.timestamp, last_timestamp[1]) * 10**18,
                                self.xcp_ma_time  # <---------- xcp ma time has is longer.
                            ),
                            int256,
                        )
                    )

                    self.cached_xcp_oracle = unsafe_div(
                        last_xcp * (10**18 - alpha) + cached_xcp_oracle * alpha,
                        10**18
                    )
                    last_timestamp[1] = block.timestamp

                    # Pack and store timestamps:
                    self.last_timestamp = self._pack_2(last_timestamp[0], last_timestamp[1])

                # Store last xcp
                self.last_xcp = last_xcp

                return withdraw_amounts
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
        >>> TwoCrypto.remove_liquidity(todo)
        ```


### `remove_liquidity_one_coin`
!!! description "`TwoCrypto.remove_liquidity_one_coin(token_amount: uint256, i: uint256, min_amount: uint256, receiver: address = msg.sender) -> uint256:`"

    Function to burn `token_amount` LP tokens and withdraw in a single token `i`.

    Returns: amount of coins withdrawn (`uint256`).

    Emits `RemoveLiquidityOne`

    | Input      | Type      | Description |
    | ---------- | --------- | ----------- |
    | `token_amount` |  `uint256` | amount of lp tokens to burn |
    | `i` |  `uint256` | index of the token to withdraw |
    | `min_amount` |  `uint256` | minimum amount of token to withdraw |
    | `receiver` |  `address` | receiver of the coins; defaults to msg.sender |

    ??? quote "Source code"

        === "CurveTwocryptoOptimized.vy"

            ```vyper
            event RemoveLiquidityOne:
                provider: indexed(address)
                token_amount: uint256
                coin_index: uint256
                coin_amount: uint256
                approx_fee: uint256
                packed_price_scale: uint256

            @external
            @nonreentrant("lock")
            def remove_liquidity_one_coin(
                token_amount: uint256,
                i: uint256,
                min_amount: uint256,
                receiver: address = msg.sender
            ) -> uint256:
                """
                @notice Withdraw liquidity in a single token.
                        Involves fees (lower than swap fees).
                @dev This operation also involves an admin fee claim.
                @param token_amount Amount of LP tokens to burn
                @param i Index of the token to withdraw
                @param min_amount Minimum amount of token to withdraw.
                @param receiver Address to send the withdrawn tokens to
                @return Amount of tokens at index i received by the `receiver`
                """

                self._claim_admin_fees()  # <--------- Auto-claim admin fees occasionally.

                A_gamma: uint256[2] = self._A_gamma()

                dy: uint256 = 0
                D: uint256 = 0
                p: uint256 = 0
                xp: uint256[N_COINS] = empty(uint256[N_COINS])
                approx_fee: uint256 = 0

                # ------------------------------------------------------------------------

                dy, D, xp, approx_fee = self._calc_withdraw_one_coin(
                    A_gamma,
                    token_amount,
                    i,
                    (self.future_A_gamma_time > block.timestamp),  # <------- During ramps
                )  #                                                  we need to update D.

                assert dy >= min_amount, "Slippage"

                # ---------------------------- State Updates -----------------------------

                # Burn user's tokens:
                self.burnFrom(msg.sender, token_amount)

                packed_price_scale: uint256 = self.tweak_price(A_gamma, xp, D, 0)
                #        Safe to use D from _calc_withdraw_one_coin here ---^

                # ------------------------- Transfers ------------------------------------

                # _transfer_out updates self.balances here. Update to state occurs before
                # external calls:
                self._transfer_out(i, dy, receiver)

                log RemoveLiquidityOne(
                    msg.sender, token_amount, i, dy, approx_fee, packed_price_scale
                )

                return dy

            @internal
            @view
            def _calc_withdraw_one_coin(
                A_gamma: uint256[2],
                token_amount: uint256,
                i: uint256,
                update_D: bool,
            ) -> (uint256, uint256, uint256[N_COINS], uint256):

                token_supply: uint256 = self.totalSupply
                assert token_amount <= token_supply  # dev: token amount more than supply
                assert i < N_COINS  # dev: coin out of range

                xx: uint256[N_COINS] = self.balances
                D0: uint256 = 0

                # -------------------------- Calculate D0 and xp -------------------------

                price_scale_i: uint256 = self.cached_price_scale * PRECISIONS[1]
                xp: uint256[N_COINS] = [
                    xx[0] * PRECISIONS[0],
                    unsafe_div(xx[1] * price_scale_i, PRECISION)
                ]
                if i == 0:
                    price_scale_i = PRECISION * PRECISIONS[0]

                if update_D:  # <-------------- D is updated if pool is undergoing a ramp.
                    D0 = MATH.newton_D(A_gamma[0], A_gamma[1], xp, 0)
                else:
                    D0 = self.D

                D: uint256 = D0

                # -------------------------------- Fee Calc ------------------------------

                # Charge fees on D. Roughly calculate xp[i] after withdrawal and use that
                # to calculate fee. Precision is not paramount here: we just want a
                # behavior where the higher the imbalance caused the more fee the AMM
                # charges.

                # xp is adjusted assuming xp[0] ~= xp[1] ~= x[2], which is usually not the
                #  case. We charge self._fee(xp), where xp is an imprecise adjustment post
                #  withdrawal in one coin. If the withdraw is too large: charge max fee by
                #   default. This is because the fee calculation will otherwise underflow.

                xp_imprecise: uint256[N_COINS] = xp
                xp_correction: uint256 = xp[i] * N_COINS * token_amount / token_supply
                fee: uint256 = self._unpack_3(self.packed_fee_params)[1]  # <- self.out_fee.

                if xp_correction < xp_imprecise[i]:
                    xp_imprecise[i] -= xp_correction
                    fee = self._fee(xp_imprecise)

                dD: uint256 = unsafe_div(token_amount * D, token_supply)
                D_fee: uint256 = fee * dD / (2 * 10**10) + 1  # <------- Actual fee on D.

                # --------- Calculate `approx_fee` (assuming balanced state) in ith token.
                # -------------------------------- We only need this for fee in the event.
                approx_fee: uint256 = N_COINS * D_fee * xx[i] / D  # <------------------<---------- TODO: Check math.

                # ------------------------------------------------------------------------
                D -= (dD - D_fee)  # <----------------------------------- Charge fee on D.
                # --------------------------------- Calculate `y_out`` with `(D - D_fee)`.
                y: uint256 = MATH.get_y(A_gamma[0], A_gamma[1], xp, D, i)[0]
                dy: uint256 = (xp[i] - y) * PRECISION / price_scale_i
                xp[i] = y

                return dy, D, xp, approx_fee

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
    
        === "CurveCryptoMathOptimized2.vy"

            ```vyper
            @external
            @view
            def newton_D(ANN: uint256, gamma: uint256, x_unsorted: uint256[N_COINS], K0_prev: uint256 = 0) -> uint256:
                """
                Finding the invariant using Newton method.
                ANN is higher by the factor A_MULTIPLIER
                ANN is already A * N**N
                """

                # Safety checks
                assert ANN > MIN_A - 1 and ANN < MAX_A + 1  # dev: unsafe values A
                assert gamma > MIN_GAMMA - 1 and gamma < MAX_GAMMA + 1  # dev: unsafe values gamma

                # Initial value of invariant D is that for constant-product invariant
                x: uint256[N_COINS] = x_unsorted
                if x[0] < x[1]:
                    x = [x_unsorted[1], x_unsorted[0]]

                assert x[0] > 10**9 - 1 and x[0] < 10**15 * 10**18 + 1  # dev: unsafe values x[0]
                assert unsafe_div(x[1] * 10**18, x[0]) > 10**14 - 1  # dev: unsafe values x[i] (input)

                S: uint256 = unsafe_add(x[0], x[1])  # can unsafe add here because we checked x[0] bounds

                D: uint256 = 0
                if K0_prev == 0:
                    D = N_COINS * isqrt(unsafe_mul(x[0], x[1]))
                else:
                    # D = isqrt(x[0] * x[1] * 4 / K0_prev * 10**18)
                    D = isqrt(unsafe_mul(unsafe_div(unsafe_mul(unsafe_mul(4, x[0]), x[1]), K0_prev), 10**18))
                    if S < D:
                        D = S

                __g1k0: uint256 = gamma + 10**18
                diff: uint256 = 0

                for i in range(255):
                    D_prev: uint256 = D
                    assert D > 0
                    # Unsafe division by D and D_prev is now safe

                    # K0: uint256 = 10**18
                    # for _x in x:
                    #     K0 = K0 * _x * N_COINS / D
                    # collapsed for 2 coins
                    K0: uint256 = unsafe_div(unsafe_div((10**18 * N_COINS**2) * x[0], D) * x[1], D)

                    _g1k0: uint256 = __g1k0
                    if _g1k0 > K0:
                        _g1k0 = unsafe_add(unsafe_sub(_g1k0, K0), 1)  # > 0
                    else:
                        _g1k0 = unsafe_add(unsafe_sub(K0, _g1k0), 1)  # > 0

                    # D / (A * N**N) * _g1k0**2 / gamma**2
                    mul1: uint256 = unsafe_div(unsafe_div(unsafe_div(10**18 * D, gamma) * _g1k0, gamma) * _g1k0 * A_MULTIPLIER, ANN)

                    # 2*N*K0 / _g1k0
                    mul2: uint256 = unsafe_div(((2 * 10**18) * N_COINS) * K0, _g1k0)

                    # calculate neg_fprime. here K0 > 0 is being validated (safediv).
                    neg_fprime: uint256 = (S + unsafe_div(S * mul2, 10**18)) + mul1 * N_COINS / K0 - unsafe_div(mul2 * D, 10**18)

                    # D -= f / fprime; neg_fprime safediv being validated
                    D_plus: uint256 = D * (neg_fprime + S) / neg_fprime
                    D_minus: uint256 = unsafe_div(D * D,  neg_fprime)
                    if 10**18 > K0:
                        D_minus += unsafe_div(unsafe_div(D * unsafe_div(mul1, neg_fprime), 10**18) * unsafe_sub(10**18, K0), K0)
                    else:
                        D_minus -= unsafe_div(unsafe_div(D * unsafe_div(mul1, neg_fprime), 10**18) * unsafe_sub(K0, 10**18), K0)

                    if D_plus > D_minus:
                        D = unsafe_sub(D_plus, D_minus)
                    else:
                        D = unsafe_div(unsafe_sub(D_minus, D_plus), 2)

                    if D > D_prev:
                        diff = unsafe_sub(D, D_prev)
                    else:
                        diff = unsafe_sub(D_prev, D)

                    if diff * 10**14 < max(10**16, D):  # Could reduce precision for gas efficiency here

                        for _x in x:
                            frac: uint256 = _x * 10**18 / D
                            assert (frac >= 10**16 - 1) and (frac < 10**20 + 1)  # dev: unsafe values x[i]
                        return D

                raise "Did not converge"

            @external
            @pure
            def get_y(
                _ANN: uint256,
                _gamma: uint256,
                _x: uint256[N_COINS],
                _D: uint256,
                i: uint256
            ) -> uint256[2]:

                # Safety checks
                assert _ANN > MIN_A - 1 and _ANN < MAX_A + 1  # dev: unsafe values A
                assert _gamma > MIN_GAMMA - 1 and _gamma < MAX_GAMMA + 1  # dev: unsafe values gamma
                assert _D > 10**17 - 1 and _D < 10**15 * 10**18 + 1 # dev: unsafe values D

                ANN: int256 = convert(_ANN, int256)
                gamma: int256 = convert(_gamma, int256)
                D: int256 = convert(_D, int256)
                x_j: int256 = convert(_x[1 - i], int256)
                gamma2: int256 = unsafe_mul(gamma, gamma)

                # savediv by x_j done here:
                y: int256 = D**2 / (x_j * N_COINS**2)

                # K0_i: int256 = (10**18 * N_COINS) * x_j / D
                K0_i: int256 = unsafe_div(10**18 * N_COINS * x_j, D)
                assert (K0_i > 10**16 * N_COINS - 1) and (K0_i < 10**20 * N_COINS + 1)  # dev: unsafe values x[i]

                ann_gamma2: int256 = ANN * gamma2

                # a = 10**36 / N_COINS**2
                a: int256 = 10**32

                # b = ANN*D*gamma2/4/10000/x_j/10**4 - 10**32*3 - 2*gamma*10**14
                b: int256 = (
                    D*ann_gamma2/400000000/x_j
                    - convert(unsafe_mul(10**32, 3), int256)
                    - unsafe_mul(unsafe_mul(2, gamma), 10**14)
                )

                # c = 10**32*3 + 4*gamma*10**14 + gamma2/10**4 + 4*ANN*gamma2*x_j/D/10000/4/10**4 - 4*ANN*gamma2/10000/4/10**4
                c: int256 = (
                    unsafe_mul(10**32, convert(3, int256))
                    + unsafe_mul(unsafe_mul(4, gamma), 10**14)
                    + unsafe_div(gamma2, 10**4)
                    + unsafe_div(unsafe_div(unsafe_mul(4, ann_gamma2), 400000000) * x_j, D)
                    - unsafe_div(unsafe_mul(4, ann_gamma2), 400000000)
                )

                # d = -(10**18+gamma)**2 / 10**4
                d: int256 = -unsafe_div(unsafe_add(10**18, gamma) ** 2, 10**4)

                # delta0: int256 = 3*a*c/b - b
                delta0: int256 = 3 * a * c / b - b  # safediv by b

                # delta1: int256 = 9*a*c/b - 2*b - 27*a**2/b*d/b
                delta1: int256 = 3 * delta0 + b - 27*a**2/b*d/b

                divider: int256 = 1
                threshold: int256 = min(min(abs(delta0), abs(delta1)), a)
                if threshold > 10**48:
                    divider = 10**30
                elif threshold > 10**46:
                    divider = 10**28
                elif threshold > 10**44:
                    divider = 10**26
                elif threshold > 10**42:
                    divider = 10**24
                elif threshold > 10**40:
                    divider = 10**22
                elif threshold > 10**38:
                    divider = 10**20
                elif threshold > 10**36:
                    divider = 10**18
                elif threshold > 10**34:
                    divider = 10**16
                elif threshold > 10**32:
                    divider = 10**14
                elif threshold > 10**30:
                    divider = 10**12
                elif threshold > 10**28:
                    divider = 10**10
                elif threshold > 10**26:
                    divider = 10**8
                elif threshold > 10**24:
                    divider = 10**6
                elif threshold > 10**20:
                    divider = 10**2

                a = unsafe_div(a, divider)
                b = unsafe_div(b, divider)
                c = unsafe_div(c, divider)
                d = unsafe_div(d, divider)

                # delta0 = 3*a*c/b - b: here we can do more unsafe ops now:
                delta0 = unsafe_div(unsafe_mul(unsafe_mul(3, a), c), b) - b

                # delta1 = 9*a*c/b - 2*b - 27*a**2/b*d/b
                delta1 = 3 * delta0 + b - unsafe_div(unsafe_mul(unsafe_div(unsafe_mul(27, a**2), b), d), b)

                # sqrt_arg: int256 = delta1**2 + 4*delta0**2/b*delta0
                sqrt_arg: int256 = delta1**2 + unsafe_mul(unsafe_div(4*delta0**2, b), delta0)
                sqrt_val: int256 = 0
                if sqrt_arg > 0:
                    sqrt_val = convert(isqrt(convert(sqrt_arg, uint256)), int256)
                else:
                    return [
                        self._newton_y(_ANN, _gamma, _x, _D, i),
                        0
                    ]

                b_cbrt: int256 = 0
                if b > 0:
                    b_cbrt = convert(self._cbrt(convert(b, uint256)), int256)
                else:
                    b_cbrt = -convert(self._cbrt(convert(-b, uint256)), int256)

                second_cbrt: int256 = 0
                if delta1 > 0:
                    # second_cbrt = convert(self._cbrt(convert((delta1 + sqrt_val), uint256) / 2), int256)
                    second_cbrt = convert(self._cbrt(convert(unsafe_add(delta1, sqrt_val), uint256) / 2), int256)
                else:
                    # second_cbrt = -convert(self._cbrt(convert(unsafe_sub(sqrt_val, delta1), uint256) / 2), int256)
                    second_cbrt = -convert(self._cbrt(unsafe_div(convert(unsafe_sub(sqrt_val, delta1), uint256), 2)), int256)

                # C1: int256 = b_cbrt**2/10**18*second_cbrt/10**18
                C1: int256 = unsafe_div(unsafe_mul(unsafe_div(b_cbrt**2, 10**18), second_cbrt), 10**18)

                # root: int256 = (10**18*C1 - 10**18*b - 10**18*b*delta0/C1)/(3*a), keep 2 safe ops here.
                root: int256 = (unsafe_mul(10**18, C1) - unsafe_mul(10**18, b) - unsafe_mul(10**18, b)/C1*delta0)/unsafe_mul(3, a)

                # y_out: uint256[2] =  [
                #     convert(D**2/x_j*root/4/10**18, uint256),   # <--- y
                #     convert(root, uint256)  # <----------------------- K0Prev
                # ]
                y_out: uint256[2] = [convert(unsafe_div(unsafe_div(unsafe_mul(unsafe_div(D**2, x_j), root), 4), 10**18), uint256), convert(root, uint256)]

                frac: uint256 = unsafe_div(y_out[0] * 10**18, _D)
                assert (frac >= 10**16 - 1) and (frac < 10**20 + 1)  # dev: unsafe value for y

                return y_out
            ```
    
    === "Example"

        ```shell
        >>> TwoCrypto.
        ```


### `calc_token_amount`
!!! description "`TwoCrypto.calc_token_amount(amounts: uint256[N_COINS], deposit: bool) -> uint256:`"

    Function to calculate the LP tokens to be minted or burned for depositing or removing `amounts` of coins. This method takes fees into consideration.

    Returns: Amount of LP tokens deposited or withdrawn (`uint256`).

    | Input      | Type      | Description |
    | ---------- | --------- | ----------- |
    | `amounts` |  `uint256[N_COINS]` | amounts of tokens being deposited or withdrawn |
    | `deposit` |  `bool` | true = deposit, false = withdraw |

    ??? quote "Source code"

        === "CurveTwocryptoOptimized.vy"

            ```vyper
            interface Factory:
                def views_implementation() -> address: view

            @external
            @view
            def calc_token_amount(amounts: uint256[N_COINS], deposit: bool) -> uint256:
                """
                @notice Calculate LP tokens minted or to be burned for depositing or
                        removing `amounts` of coins
                @dev Includes fee.
                @param amounts Amounts of tokens being deposited or withdrawn
                @param deposit True if it is a deposit action, False if withdrawn.
                @return uint256 Amount of LP tokens deposited or withdrawn.
                """
                view_contract: address = factory.views_implementation()
                return Views(view_contract).calc_token_amount(amounts, deposit, self)

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
            ```

        === "CurveCryptoViews2Optimized.vy"

            ```vyper
            @view
            @external
            def calc_token_amount(
                amounts: uint256[N_COINS], deposit: bool, swap: address
            ) -> uint256:

                d_token: uint256 = 0
                amountsp: uint256[N_COINS] = empty(uint256[N_COINS])
                xp: uint256[N_COINS] = empty(uint256[N_COINS])

                d_token, amountsp, xp = self._calc_dtoken_nofee(amounts, deposit, swap)
                d_token -= (
                    Curve(swap).calc_token_fee(amountsp, xp) * d_token / 10**10 + 1
                )

                return d_token

            @internal
            @view
            def _calc_dtoken_nofee(
                amounts: uint256[N_COINS], deposit: bool, swap: address
            ) -> (uint256, uint256[N_COINS], uint256[N_COINS]):

                math: Math = Curve(swap).MATH()

                xp: uint256[N_COINS] = empty(uint256[N_COINS])
                precisions: uint256[N_COINS] = empty(uint256[N_COINS])
                price_scale: uint256 = 0
                D0: uint256 = 0
                token_supply: uint256 = 0
                A: uint256 = 0
                gamma: uint256 = 0

                xp, D0, token_supply, price_scale, A, gamma, precisions = self._prep_calc(swap)

                amountsp: uint256[N_COINS] = amounts
                if deposit:
                    for k in range(N_COINS):
                        xp[k] += amounts[k]
                else:
                    for k in range(N_COINS):
                        xp[k] -= amounts[k]

                xp = [
                    xp[0] * precisions[0],
                    xp[1] * price_scale * precisions[1] / PRECISION
                ]
                amountsp = [
                    amountsp[0]* precisions[0],
                    amountsp[1] * price_scale * precisions[1] / PRECISION
                ]

                D: uint256 = math.newton_D(A, gamma, xp, 0)
                d_token: uint256 = token_supply * D / D0

                if deposit:
                    d_token -= token_supply
                else:
                    d_token = token_supply - d_token

                return d_token, amountsp, xp
            ```
    
    === "Example"

        ```shell
        >>> TwoCrypto.calc_token_amount(todo)
        ```


### `calc_withdraw_one_coin`
!!! description "`TwoCrypto.calc_withdraw_one_coin(token_amount: uint256, i: uint256) -> uint256:`"

    Function to calculate the amount of output token `i` when burning `token_amount` of LP tokens. This method takes fees into consideration.

    Returns: Amount of tokens receiving (`uint256`).

    | Input      | Type      | Description |
    | ---------- | --------- | ----------- |
    | `token_amount` |  `uint256` | amount of lp tokens burned |
    | `i` |  `uint256` | index of the coin to withdraw |

    ??? quote "Source code"

        === "CurveTwocryptoOptimized.vy"

            ```vyper
            @view
            @external
            def calc_withdraw_one_coin(token_amount: uint256, i: uint256) -> uint256:
                """
                @notice Calculates output tokens with fee
                @param token_amount LP Token amount to burn
                @param i token in which liquidity is withdrawn
                @return uint256 Amount of ith tokens received for burning token_amount LP tokens.
                """

                return self._calc_withdraw_one_coin(
                    self._A_gamma(),
                    token_amount,
                    i,
                    (self.future_A_gamma_time > block.timestamp)
                )[0]

            @internal
            @view
            def _calc_withdraw_one_coin(
                A_gamma: uint256[2],
                token_amount: uint256,
                i: uint256,
                update_D: bool,
            ) -> (uint256, uint256, uint256[N_COINS], uint256):

                token_supply: uint256 = self.totalSupply
                assert token_amount <= token_supply  # dev: token amount more than supply
                assert i < N_COINS  # dev: coin out of range

                xx: uint256[N_COINS] = self.balances
                D0: uint256 = 0

                # -------------------------- Calculate D0 and xp -------------------------

                price_scale_i: uint256 = self.cached_price_scale * PRECISIONS[1]
                xp: uint256[N_COINS] = [
                    xx[0] * PRECISIONS[0],
                    unsafe_div(xx[1] * price_scale_i, PRECISION)
                ]
                if i == 0:
                    price_scale_i = PRECISION * PRECISIONS[0]

                if update_D:  # <-------------- D is updated if pool is undergoing a ramp.
                    D0 = MATH.newton_D(A_gamma[0], A_gamma[1], xp, 0)
                else:
                    D0 = self.D

                D: uint256 = D0

                # -------------------------------- Fee Calc ------------------------------

                # Charge fees on D. Roughly calculate xp[i] after withdrawal and use that
                # to calculate fee. Precision is not paramount here: we just want a
                # behavior where the higher the imbalance caused the more fee the AMM
                # charges.

                # xp is adjusted assuming xp[0] ~= xp[1] ~= x[2], which is usually not the
                #  case. We charge self._fee(xp), where xp is an imprecise adjustment post
                #  withdrawal in one coin. If the withdraw is too large: charge max fee by
                #   default. This is because the fee calculation will otherwise underflow.

                xp_imprecise: uint256[N_COINS] = xp
                xp_correction: uint256 = xp[i] * N_COINS * token_amount / token_supply
                fee: uint256 = self._unpack_3(self.packed_fee_params)[1]  # <- self.out_fee.

                if xp_correction < xp_imprecise[i]:
                    xp_imprecise[i] -= xp_correction
                    fee = self._fee(xp_imprecise)

                dD: uint256 = unsafe_div(token_amount * D, token_supply)
                D_fee: uint256 = fee * dD / (2 * 10**10) + 1  # <------- Actual fee on D.

                # --------- Calculate `approx_fee` (assuming balanced state) in ith token.
                # -------------------------------- We only need this for fee in the event.
                approx_fee: uint256 = N_COINS * D_fee * xx[i] / D  # <------------------<---------- TODO: Check math.

                # ------------------------------------------------------------------------
                D -= (dD - D_fee)  # <----------------------------------- Charge fee on D.
                # --------------------------------- Calculate `y_out`` with `(D - D_fee)`.
                y: uint256 = MATH.get_y(A_gamma[0], A_gamma[1], xp, D, i)[0]
                dy: uint256 = (xp[i] - y) * PRECISION / price_scale_i
                xp[i] = y

                return dy, D, xp, approx_fee
            ```


        === "CurveCryptoMathOptimized2.vy"

            ```vyper
            @external
            @view
            def newton_D(ANN: uint256, gamma: uint256, x_unsorted: uint256[N_COINS], K0_prev: uint256 = 0) -> uint256:
                """
                Finding the invariant using Newton method.
                ANN is higher by the factor A_MULTIPLIER
                ANN is already A * N**N
                """

                # Safety checks
                assert ANN > MIN_A - 1 and ANN < MAX_A + 1  # dev: unsafe values A
                assert gamma > MIN_GAMMA - 1 and gamma < MAX_GAMMA + 1  # dev: unsafe values gamma

                # Initial value of invariant D is that for constant-product invariant
                x: uint256[N_COINS] = x_unsorted
                if x[0] < x[1]:
                    x = [x_unsorted[1], x_unsorted[0]]

                assert x[0] > 10**9 - 1 and x[0] < 10**15 * 10**18 + 1  # dev: unsafe values x[0]
                assert unsafe_div(x[1] * 10**18, x[0]) > 10**14 - 1  # dev: unsafe values x[i] (input)

                S: uint256 = unsafe_add(x[0], x[1])  # can unsafe add here because we checked x[0] bounds

                D: uint256 = 0
                if K0_prev == 0:
                    D = N_COINS * isqrt(unsafe_mul(x[0], x[1]))
                else:
                    # D = isqrt(x[0] * x[1] * 4 / K0_prev * 10**18)
                    D = isqrt(unsafe_mul(unsafe_div(unsafe_mul(unsafe_mul(4, x[0]), x[1]), K0_prev), 10**18))
                    if S < D:
                        D = S

                __g1k0: uint256 = gamma + 10**18
                diff: uint256 = 0

                for i in range(255):
                    D_prev: uint256 = D
                    assert D > 0
                    # Unsafe division by D and D_prev is now safe

                    # K0: uint256 = 10**18
                    # for _x in x:
                    #     K0 = K0 * _x * N_COINS / D
                    # collapsed for 2 coins
                    K0: uint256 = unsafe_div(unsafe_div((10**18 * N_COINS**2) * x[0], D) * x[1], D)

                    _g1k0: uint256 = __g1k0
                    if _g1k0 > K0:
                        _g1k0 = unsafe_add(unsafe_sub(_g1k0, K0), 1)  # > 0
                    else:
                        _g1k0 = unsafe_add(unsafe_sub(K0, _g1k0), 1)  # > 0

                    # D / (A * N**N) * _g1k0**2 / gamma**2
                    mul1: uint256 = unsafe_div(unsafe_div(unsafe_div(10**18 * D, gamma) * _g1k0, gamma) * _g1k0 * A_MULTIPLIER, ANN)

                    # 2*N*K0 / _g1k0
                    mul2: uint256 = unsafe_div(((2 * 10**18) * N_COINS) * K0, _g1k0)

                    # calculate neg_fprime. here K0 > 0 is being validated (safediv).
                    neg_fprime: uint256 = (S + unsafe_div(S * mul2, 10**18)) + mul1 * N_COINS / K0 - unsafe_div(mul2 * D, 10**18)

                    # D -= f / fprime; neg_fprime safediv being validated
                    D_plus: uint256 = D * (neg_fprime + S) / neg_fprime
                    D_minus: uint256 = unsafe_div(D * D,  neg_fprime)
                    if 10**18 > K0:
                        D_minus += unsafe_div(unsafe_div(D * unsafe_div(mul1, neg_fprime), 10**18) * unsafe_sub(10**18, K0), K0)
                    else:
                        D_minus -= unsafe_div(unsafe_div(D * unsafe_div(mul1, neg_fprime), 10**18) * unsafe_sub(K0, 10**18), K0)

                    if D_plus > D_minus:
                        D = unsafe_sub(D_plus, D_minus)
                    else:
                        D = unsafe_div(unsafe_sub(D_minus, D_plus), 2)

                    if D > D_prev:
                        diff = unsafe_sub(D, D_prev)
                    else:
                        diff = unsafe_sub(D_prev, D)

                    if diff * 10**14 < max(10**16, D):  # Could reduce precision for gas efficiency here

                        for _x in x:
                            frac: uint256 = _x * 10**18 / D
                            assert (frac >= 10**16 - 1) and (frac < 10**20 + 1)  # dev: unsafe values x[i]
                        return D

                raise "Did not converge"

            @external
            @pure
            def get_y(
                _ANN: uint256,
                _gamma: uint256,
                _x: uint256[N_COINS],
                _D: uint256,
                i: uint256
            ) -> uint256[2]:

                # Safety checks
                assert _ANN > MIN_A - 1 and _ANN < MAX_A + 1  # dev: unsafe values A
                assert _gamma > MIN_GAMMA - 1 and _gamma < MAX_GAMMA + 1  # dev: unsafe values gamma
                assert _D > 10**17 - 1 and _D < 10**15 * 10**18 + 1 # dev: unsafe values D

                ANN: int256 = convert(_ANN, int256)
                gamma: int256 = convert(_gamma, int256)
                D: int256 = convert(_D, int256)
                x_j: int256 = convert(_x[1 - i], int256)
                gamma2: int256 = unsafe_mul(gamma, gamma)

                # savediv by x_j done here:
                y: int256 = D**2 / (x_j * N_COINS**2)

                # K0_i: int256 = (10**18 * N_COINS) * x_j / D
                K0_i: int256 = unsafe_div(10**18 * N_COINS * x_j, D)
                assert (K0_i > 10**16 * N_COINS - 1) and (K0_i < 10**20 * N_COINS + 1)  # dev: unsafe values x[i]

                ann_gamma2: int256 = ANN * gamma2

                # a = 10**36 / N_COINS**2
                a: int256 = 10**32

                # b = ANN*D*gamma2/4/10000/x_j/10**4 - 10**32*3 - 2*gamma*10**14
                b: int256 = (
                    D*ann_gamma2/400000000/x_j
                    - convert(unsafe_mul(10**32, 3), int256)
                    - unsafe_mul(unsafe_mul(2, gamma), 10**14)
                )

                # c = 10**32*3 + 4*gamma*10**14 + gamma2/10**4 + 4*ANN*gamma2*x_j/D/10000/4/10**4 - 4*ANN*gamma2/10000/4/10**4
                c: int256 = (
                    unsafe_mul(10**32, convert(3, int256))
                    + unsafe_mul(unsafe_mul(4, gamma), 10**14)
                    + unsafe_div(gamma2, 10**4)
                    + unsafe_div(unsafe_div(unsafe_mul(4, ann_gamma2), 400000000) * x_j, D)
                    - unsafe_div(unsafe_mul(4, ann_gamma2), 400000000)
                )

                # d = -(10**18+gamma)**2 / 10**4
                d: int256 = -unsafe_div(unsafe_add(10**18, gamma) ** 2, 10**4)

                # delta0: int256 = 3*a*c/b - b
                delta0: int256 = 3 * a * c / b - b  # safediv by b

                # delta1: int256 = 9*a*c/b - 2*b - 27*a**2/b*d/b
                delta1: int256 = 3 * delta0 + b - 27*a**2/b*d/b

                divider: int256 = 1
                threshold: int256 = min(min(abs(delta0), abs(delta1)), a)
                if threshold > 10**48:
                    divider = 10**30
                elif threshold > 10**46:
                    divider = 10**28
                elif threshold > 10**44:
                    divider = 10**26
                elif threshold > 10**42:
                    divider = 10**24
                elif threshold > 10**40:
                    divider = 10**22
                elif threshold > 10**38:
                    divider = 10**20
                elif threshold > 10**36:
                    divider = 10**18
                elif threshold > 10**34:
                    divider = 10**16
                elif threshold > 10**32:
                    divider = 10**14
                elif threshold > 10**30:
                    divider = 10**12
                elif threshold > 10**28:
                    divider = 10**10
                elif threshold > 10**26:
                    divider = 10**8
                elif threshold > 10**24:
                    divider = 10**6
                elif threshold > 10**20:
                    divider = 10**2

                a = unsafe_div(a, divider)
                b = unsafe_div(b, divider)
                c = unsafe_div(c, divider)
                d = unsafe_div(d, divider)

                # delta0 = 3*a*c/b - b: here we can do more unsafe ops now:
                delta0 = unsafe_div(unsafe_mul(unsafe_mul(3, a), c), b) - b

                # delta1 = 9*a*c/b - 2*b - 27*a**2/b*d/b
                delta1 = 3 * delta0 + b - unsafe_div(unsafe_mul(unsafe_div(unsafe_mul(27, a**2), b), d), b)

                # sqrt_arg: int256 = delta1**2 + 4*delta0**2/b*delta0
                sqrt_arg: int256 = delta1**2 + unsafe_mul(unsafe_div(4*delta0**2, b), delta0)
                sqrt_val: int256 = 0
                if sqrt_arg > 0:
                    sqrt_val = convert(isqrt(convert(sqrt_arg, uint256)), int256)
                else:
                    return [
                        self._newton_y(_ANN, _gamma, _x, _D, i),
                        0
                    ]

                b_cbrt: int256 = 0
                if b > 0:
                    b_cbrt = convert(self._cbrt(convert(b, uint256)), int256)
                else:
                    b_cbrt = -convert(self._cbrt(convert(-b, uint256)), int256)

                second_cbrt: int256 = 0
                if delta1 > 0:
                    # second_cbrt = convert(self._cbrt(convert((delta1 + sqrt_val), uint256) / 2), int256)
                    second_cbrt = convert(self._cbrt(convert(unsafe_add(delta1, sqrt_val), uint256) / 2), int256)
                else:
                    # second_cbrt = -convert(self._cbrt(convert(unsafe_sub(sqrt_val, delta1), uint256) / 2), int256)
                    second_cbrt = -convert(self._cbrt(unsafe_div(convert(unsafe_sub(sqrt_val, delta1), uint256), 2)), int256)

                # C1: int256 = b_cbrt**2/10**18*second_cbrt/10**18
                C1: int256 = unsafe_div(unsafe_mul(unsafe_div(b_cbrt**2, 10**18), second_cbrt), 10**18)

                # root: int256 = (10**18*C1 - 10**18*b - 10**18*b*delta0/C1)/(3*a), keep 2 safe ops here.
                root: int256 = (unsafe_mul(10**18, C1) - unsafe_mul(10**18, b) - unsafe_mul(10**18, b)/C1*delta0)/unsafe_mul(3, a)

                # y_out: uint256[2] =  [
                #     convert(D**2/x_j*root/4/10**18, uint256),   # <--- y
                #     convert(root, uint256)  # <----------------------- K0Prev
                # ]
                y_out: uint256[2] = [convert(unsafe_div(unsafe_div(unsafe_mul(unsafe_div(D**2, x_j), root), 4), 10**18), uint256), convert(root, uint256)]

                frac: uint256 = unsafe_div(y_out[0] * 10**18, _D)
                assert (frac >= 10**16 - 1) and (frac < 10**20 + 1)  # dev: unsafe value for y

                return y_out
            ```
    
    === "Example"

        ```shell
        >>> TwoCrypto.
        ```



## Fee Methods

fee params are packed and can be unpacked like this:

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
```


packed fee params
packed rebalancing params

### `fee`
!!! description "`TwoCrypto.fee() -> uint256:`"

    Getter for the fee charged by the pool at the current state.

    Returns: fee in bps (`uint256`).

    ??? quote "Source code"

        === "CurveTwocryptoOptimized.vy"

            ```vyper
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
                return self._fee(self.xp(self.balances, self.cached_price_scale))

            @internal
            @view
            def _fee(xp: uint256[N_COINS]) -> uint256:

                fee_params: uint256[3] = self._unpack_3(self.packed_fee_params)
                f: uint256 = xp[0] + xp[1]
                f = fee_params[2] * 10**18 / (
                    fee_params[2] + 10**18 -
                    (10**18 * N_COINS**N_COINS) * xp[0] / f * xp[1] / f
                )

                return unsafe_div(
                    fee_params[0] * f + fee_params[1] * (10**18 - f),
                    10**18
                )
            ```

    === "Example"

        ```shell
        >>> TwoCrypto.fee()
        'todo'
        ```



### `mid_fee`
!!! description "`TwoCrypto.mid_fee() -> uint256:`"

    Getter for the `mid_fee`. This is the minimum fee and is charged when the pool is completely balanced.

    Returns: mid fee (`uint255`).

    ??? quote "Source code"

        === "CurveTwocryptoOptimized.vy"

            ```vyper
            packed_fee_params: public(uint256)  # <---- Packs mid_fee, out_fee, fee_gamma.

            @view
            @external
            def mid_fee() -> uint256:
                """
                @notice Returns the current mid fee
                @return uint256 mid_fee value.
                """
                return self._unpack_3(self.packed_fee_params)[0]
            ```

    === "Example"

        ```shell
        >>> TwoCrypto.(todo)
        ```


### `out_fee`
!!! description "`TwoCrypto.out_fee() -> uint256:`"

    Getter for the `out_fee`. This is the maximum fee and is charged when the pool is completely imbalanced.

    Returns: out fee (`uint255`).

    ??? quote "Source code"

        === "CurveTwocryptoOptimized.vy"

            ```vyper
            packed_fee_params: public(uint256)  # <---- Packs mid_fee, out_fee, fee_gamma.

            @view
            @external
            def out_fee() -> uint256:
                """
                @notice Returns the current out fee
                @return uint256 out_fee value.
                """
                return self._unpack_3(self.packed_fee_params)[1]
            ```

    === "Example"

        ```shell
        >>> TwoCrypto.(todo)
        ```


### `fee_gamma`
!!! description "`TwoCrypto.fee_gamma() -> uint256:`"

    Getter for the current `fee_gamma`. This parameter modifies the rate at which fees rise as imbalance intensifies. Smaller values result in rapid fee hikes with growing imbalances, while larger values lead to more gradual increments in fees as imbalance expands.

    Returns: fee gamma (`uint256`).

    ??? quote "Source code"

        === "CurveTwocryptoOptimized.vy"

            ```vyper
            packed_fee_params: public(uint256)  # <---- Packs mid_fee, out_fee, fee_gamma.

            @view
            @external
            def fee_gamma() -> uint256:
                """
                @notice Returns the current fee gamma
                @return uint256 fee_gamma value.
                """
                return self._unpack_3(self.packed_fee_params)[2]
            ```

    === "Example"

        ```shell
        >>> TwoCrypto.(todo)
        ```


### `packed_fee_params`
!!! description "`TwoCrypto.packed_fee_params() -> uint256: view`"

    Getter for the packed fee parameters.

    Returns: packed fee params (`uint256`).

    ??? quote "Source code"

        === "CurveTwocryptoOptimized.vy"

            ```vyper
            # Fee params that determine dynamic fees:
            packed_fee_params: public(uint256)  # <---- Packs mid_fee, out_fee, fee_gamma.

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
                self.packed_fee_params = packed_fee_params  # <-------------- Contains Fee
                #                                  params: mid_fee, out_fee and fee_gamma.
                ...
            ```

    === "Example"

        ```shell
        >>> TwoCrypto.packed_fee_params(todo)
        ```


### `ADMIN_FEE`
!!! description "`TwoCrypto.packed_fee_params() -> uint256: view`"

    Getter for the admin fee of the pool. This value is hardcoded to 50% (5000000000) of the earned fees.

    Returns: admin fee (`uint256`).

    ??? quote "Source code"

        === "CurveTwocryptoOptimized.vy"

            ```vyper
            ADMIN_FEE: public(constant(uint256)) = 5 * 10**9  # <----- 50% of earned fees.
            ```

    === "Example"

        ```shell
        >>> TwoCrypto.ADMIN_FEE()
        5000000000
        ```


### `fee_receiver`
!!! description "`TwoCrypto.fee_receiver() -> address:`"

    Getter for the fee receiver of the admin fees. This address is set within the TwoCrypto-NG (todo: insert hyperlink here) Factory. Every pool created through the Factory has the same fee receiver.

    Returns: fee receiver (`address`).

    ??? quote "Source code"

        === "CurveTwocryptoOptimized.vy"

            ```vyper
            interface Factory:
                def fee_receiver() -> address: view

            @external
            @view
            def fee_receiver() -> address:
                """
                @notice Returns the address of the admin fee receiver.
                @return address Fee receiver.
                """
                return factory.fee_receiver()
            ```

    === "Example"

        ```shell
        >>> TwoCrypto.fee_receiver(todo)
        ```


### `xcp_profit`
!!! description "`TwoCrypto.xcp_profit() -> uint256: view`"

    Getter for the current pool profits.

    Returns: current profits (`uint256`).

    ??? quote "Source code"

        === "CurveTwocryptoOptimized.vy"

            ```vyper
            xcp_profit: public(uint256)
            ```

    === "Example"

        ```shell
        >>> TwoCrypto.xcp_profit(todo)
        ```


### `xcp_profit_a`
!!! description "`TwoCrypto.xcp_profit_a() -> uint256: view`"

    Getter for the full profit at the last claim of admin fees.

    Returns: profit at last claim (`uint256`).

    ??? quote "Source code"

        === "CurveTwocryptoOptimized.vy"

            ```vyper
            xcp_profit_a: public(uint256)  # <--- Full profit at last claim of admin fees.

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
                self.xcp_profit_a = 10**18
                ...
            ```

    === "Example"

        ```shell
        >>> TwoCrypto.xcp_profit_a(todo)
        ```


### `last_xcp`
!!! description "`TwoCrypto.last_xcp() -> uint256: view`"

    todo: getter for the last xcp

    Returns: timestamp of last claim (`uint256`).

    ??? quote "Source code"

        === "CurveTwocryptoOptimized.vy"

            ```vyper
            last_xcp: public(uint256)
            ```

    === "Example"

        ```shell
        >>> TwoCrypto.last_xcp(todo)
        ```


## Price Oracle Methods

todo: prices are updated via tweak_prices():

### `lp_price`
!!! description "`TwoCrypto.lp_price() -> uint256:`"

    Function to calculate the current price of the LP token with regard to the coin at index 0.

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
        >>> TwoCrypto.lp_price(todo)
        ```


### `virtual_price`
!!! description "`TwoCrypto.virtual_price -> uint256: view`"

    Getter for the cached virtual price. This variable is fast as its only reading the cached one instead of re-calculating it.

    Returns: cached virtual price (`uint256`).

    ??? quote "Source code"

        === "CurveTwocryptoOptimized.vy"

            ```vyper
            virtual_price: public(uint256)  # <------ Cached (fast to read) virtual price.
            #                          The cached `virtual_price` is also used internally.
            ```
    
    === "Example"

        ```shell
        >>> TwoCrypto.virtual_price(todo)
        ```


### `get_virtual_price`
!!! description "`TwoCrypto.virtual_price -> uint256: view`"

    !!!warning
        `get_virtual_price` should not be confused with `virtual_price` which is a cached virtual price.

    Function to calculate the current virtual price of the pools LP token.

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
            ```
    
    === "Example"

        ```shell
        >>> TwoCrypto.get_virtual_price(todo)
        ```


### `price_oracle`
!!! description "`TwoCrypto.price_oracle() -> uint256:`"

    !!!info
        The aggregated price are cached state prices (dx/dy) calculated **AFTER** the last trade.

    Getter for the oracle price of the coin at index 1 with regard to the coin at index 0. The price oracle is an exponential moving average with a periodicity determined by `ma_time`.

    Returns: oracle price (`uint256`).

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
        >>> TwoCrypto.
        ```


### `last_prices`
!!! description "`TwoCrypto.last_prices -> uint256: view`"

    todo: Getter for the last price. `last_prices` is updated when calling `tweak_oracle`.

    Returns: 

    Emits ``

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
    
    === "Example"

        ```shell
        >>> TwoCrypto.
        ```


### `price_scale`
!!! description "`TwoCrypto.price_scale() -> uint256:`"

    Getter for the price scale of the coin at index 1 with regard to the coin at index 0. The price scale determines the price band around which liquidity is concentrated.

    Returns: price scale (`uint256`).

    ??? quote "Source code"

        === "CurveTwocryptoOptimized.vy"

            ```vyper
            cached_price_scale: uint256  # <------------------------ Internal price scale.

            @external
            @view
            @nonreentrant("lock")
            def price_scale() -> uint256:
                """
                @notice Returns the price scale of the coin at index `k` w.r.t the coin
                        at index 0.
                @dev Price scale determines the price band around which liquidity is
                    concentrated.
                @return uint256 Price scale of coin.
                """
                return self.cached_price_scale
            ```
    
    === "Example"

        ```shell
        >>> TwoCrypto.price_scale()
        ```


### `ma_time`
!!! description "`TwoCrypto.price_scale() -> uint256:`"

    Getter for the moving average time period.

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
                @dev To get time in seconds, the parameter is multipled by ln(2)
                    One can expect off-by-one errors here.
                @return uint256 ma_time value.
                """
                return self._unpack_3(self.packed_rebalancing_params)[2] * 694 / 1000
            ```
    
    === "Example"

        ```shell
        >>> TwoCrypto.ma_time()
        ```


### `xcp_oracle`
!!! description "`TwoCrypto.xcp_oracle() -> uint256`"

    Getter for the oracle value for xcp. The oracle is an exponential moving average, wich a periodocity determined by `xcp_ma_time`.

    Returns: xcp oracle value (`uint256`).

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
        >>> TwoCrypto.xcp_oracle(todo)
        ```

### `xcp_ma_time`
!!! description "`TwoCrypto.xcp_ma_time() -> uint256: view`"

    todo: moving average time window for `xcp_oracle`.

    Returns: moving average time window (`uint256`).

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
        >>> TwoCrypto.xcp_ma_time(todo)
        ```


## Price Scaling
### `allowed_extra_profit`
!!! description "`TwoCrypto.allowed_extra_profit() -> uint256:`"

    Getter for the allowed extra profit value. 

    Returns: allowed extra profit value (`uint256`).

    ??? quote "Source code"

        === "CurveTwocryptoOptimized.vy"

            ```vyper
            packed_rebalancing_params: public(uint256)  # <---------- Contains rebalancing
            #               parameters allowed_extra_profit, adjustment_step, and ma_time.

            @view
            @external
            def allowed_extra_profit() -> uint256:
                """
                @notice Returns the current allowed extra profit
                @return uint256 allowed_extra_profit value.
                """
                return self._unpack_3(self.packed_rebalancing_params)[0]
            ```
    
    === "Example"

        ```shell
        >>> TwoCrypto.
        ```


### `adjustment_step`
!!! description "`TwoCrypto.allowed_extra_profit() -> uint256:`"

    Getter for the adjustment step value.

    Returns: adjustment step value (`uint256`).

    ??? quote "Source code"

        === "CurveTwocryptoOptimized.vy"

            ```vyper
            packed_rebalancing_params: public(uint256)  # <---------- Contains rebalancing
            #               parameters allowed_extra_profit, adjustment_step, and ma_time.

            @view
            @external
            def adjustment_step() -> uint256:
                """
                @notice Returns the current adjustment step
                @return uint256 adjustment_step value.
                """
                return self._unpack_3(self.packed_rebalancing_params)[1]
            ```
    
    === "Example"

        ```shell
        >>> TwoCrypto.adjustment_step(todo)
        ```


### `packed_rebalancing_params`
!!! description "`TwoCrypto.packed_rebalancing_params() -> uint256: view`"

    Getter for the packed rebalancing parameters.

    Returns: packed rebalancing parameters (`uint256`).

    ??? quote "Source code"

        === "CurveTwocryptoOptimized.vy"

            ```vyper
            packed_rebalancing_params: public(uint256)  # <---------- Contains rebalancing
            #               parameters allowed_extra_profit, adjustment_step, and ma_time.
            ```
    
    === "Example"

        ```shell
        >>> TwoCrypto.packed_rebalancing_params(todo)
        ```



## Bonding Curve Parameters


### `A`
!!! description "`TwoCrypto.A() -> uint256:`"

    Getter for the current pool amplification parameter.

    Returns: A (`uint256`).

    ??? quote "Source code"

        === "CurveTwocryptoOptimized.vy"

            ```vyper
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
        >>> TwoCrypto.A(todo)
        ```


### `gamma`
!!! description "`TwoCrypto.gamma() -> uint256:`"

    Getter for the current pool gamma parameter.

    Returns: gamma (`uint256`).

    ??? quote "Source code"

        === "CurveTwocryptoOptimized.vy"

            ```vyper
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
        >>> TwoCrypto.gamma(todo)
        ```


## Contract Info Methods
### `admin`
!!! description "`TwoCrypto.admin() -> address:`"

    Getter for the admin of the pool.

    Returns: admin (`address`).

    ??? quote "Source code"

        === "CurveTwocryptoOptimized.vy"

            ```vyper
            interface Factory:
                def admin() -> address: view

            @external
            @view
            def admin() -> address:
                """
                @notice Returns the address of the pool's admin.
                @return address Admin.
                """
                return factory.admin()
            ```
    
    === "Example"

        ```shell
        >>> TwoCrypto.admin(todo)
        ```


### `precisions`
!!! description "`TwoCrypto.precisions() -> uint256[N_COINS]:`"

    Getter for the precisions of each coin in the pool.

    Returns: precision of coins (`uint256[N_COINS]`).

    ??? quote "Source code"

        === "CurveTwocryptoOptimized.vy"

            ```vyper
            PRECISION: constant(uint256) = 10**18  # <------- The precision to convert to.
            PRECISIONS: immutable(uint256[N_COINS])

            @view
            @external
            def precisions() -> uint256[N_COINS]:  # <-------------- For by view contract.
                """
                @notice Returns the precisions of each coin in the pool.
                @return uint256[3] precisions of coins.
                """
                return PRECISIONS
            ```
    
    === "Example"

        ```shell
        >>> TwoCrypto.precisions(todo)
        ```


### `MATH`
!!! description "`TwoCrypto.MATH() -> address: view`"

    Getter for the precisions of each coin in the pool.

    Returns: precision of coins (`uint256[N_COINS]`).

    ??? quote "Source code"

        === "CurveTwocryptoOptimized.vy"

            ```vyper
            MATH: public(immutable(Math))

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

                MATH = Math(_math)
                ...
            ```
    
    === "Example"

        ```shell
        >>> TwoCrypto.MATH(todo)
        ```


### `coins`
!!! description "`TwoCrypto.coins(arg0: uint256) -> address: view`"

    Getter for the coin at index arg0 in the pool.

    Returns: precision of coins (`uint256[N_COINS]`).

    | Input      | Type      | Description |
    | ---------- | --------- | ----------- |
    | `arg0` | `uint256` | coin index |

    ??? quote "Source code"

        === "CurveTwocryptoOptimized.vy"

            ```vyper
            coins: public(immutable(address[N_COINS]))

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

                MATH = Math(_math)

                factory = Factory(msg.sender)
                name = _name
                symbol = _symbol
                coins = _coins
                ...
            ```
    
    === "Example"

        ```shell
        >>> TwoCrypto.coins(todo)
        ```


### `factory`
!!! description "`TwoCrypto.factory() -> address: view`"

    Getter for the coin at index arg0 in the pool.

    Returns: precision of coins (`uint256[N_COINS]`).

    ??? quote "Source code"

        === "CurveTwocryptoOptimized.vy"

            ```vyper
            factory: public(immutable(Factory))

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

                MATH = Math(_math)

                factory = Factory(msg.sender)
                ...
            ```
    
    === "Example"

        ```shell
        >>> TwoCrypto.factory(todo)
        ```


### `balances`
!!! description "`TwoCrypto.balances(arg0: uint256) -> uint256: view`"

    Getter for the current coin balances in the pool.

    Returns: balances (`uint256`).

    ??? quote "Source code"

        === "CurveTwocryptoOptimized.vy"

            ```vyper
            balances: public(uint256[N_COINS])
            ```
    
    === "Example"

        ```shell
        >>> TwoCrypto.balances(todo)
        ```