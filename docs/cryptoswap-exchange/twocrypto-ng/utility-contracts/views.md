<h1>Views Contract</h1>

The Views Contract contains **view-only external methods**, which **may be gas-inefficient when called from within smart contracts**. However, it can be highly useful for searches, aggregators, or other entities looking to integrate with twocrypto-ng pools.

!!!deploy "Contract Source & Deployment"
    Source code for this contract is available on [GitHub](https://github.com/curvefi/twocrypto-ng/blob/main/contracts/main/CurveCryptoViews2Optimized.vy).
    Full list of all deployments can be found [here](../../../references/deployed-contracts.md#twocrypto-ng).


---


## **Exchange Methods**

### `get_dy`
!!! description "`Views.get_dy(i: uint256, j: uint256, dx: uint256, swap: address) -> uint256: view`"

    Function to calculate the amount of coin `j` tokens received for swapping in `dx` amount of coin `i` tokens. This function includes fees.

    Returns: `dy` (`uint256`).

    | Input | Type      | Description                                                               |
    |-------|-----------|---------------------------------------------------------------------------|
    | `i`   | `uint256` | Index of the input token (use `pool.coins(i)` to get the coin address at the i-th index). |
    | `j`   | `uint256` | Index of the output token.                                                |
    | `dx`  | `uint256` | Amount of input coin[i] tokens to be swapped.                             |
    | `swap`| `address` | Address of the pool contract where the swap will occur.                   |

    ??? quote "Source code"

        === "CurveCryptoViewsOptimized2.vy"

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

        === "CurveTwocryptoOptimized.vy"

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
        >>> Views.get_dy(0, 1, 100, pool)   # swaps 100 tokens coin(0) to coin(1) within "pool"
        returns dy                          # tokens received
        ```


### `get_dx`
!!! description "`Views.get_dx(i: uint256, j: uint256, dy: uint256, swap: address) -> uint256: view`"

    Getter method for the amount of coin `i` tokens required to input for swapping out `dy` amount of coin `j`.

    Returns: `dx` (`uint256`).

    | Input | Type      | Description                                                                |
    |-------|-----------|----------------------------------------------------------------------------|
    | `i`   | `uint256` | Index of the input token (use `pool.coins(i)` to get the coin address at the i-th index). |
    | `j`   | `uint256` | Index of the output token.                                                 |
    | `dy`  | `uint256` | Desired amount of output coin[j] tokens to receive.                        |
    | `swap`| `address` | Address of the pool contract where the swap will occur.                    |

    ??? quote "Source code"

        === "CurveCryptoViewsOptimized2.vy"

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

        === "CurveTwocryptoOptimized.vy"

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
        >>> Views.get_dx(0, 1, 100, pool)       # how much of coin(0) to input in order to get 100 of coin(1)
        returns dx
        ```


### `calc_fee_get_dy`
!!! description "`Views.calc_fee_get_dy(i: uint256, j: uint256, dx: uint256, swap: address) -> uint256: view`"

    Function to calculate the fees for `get_dy`.

    Returns: Approximate fee (`uint256`).

    | Input | Type      | Description                                                               |
    |-------|-----------|---------------------------------------------------------------------------|
    | `i`   | `uint256` | Index of the input token (use `pool.coins(i)` to get the coin address at the i-th index). |
    | `j`   | `uint256` | Index of the output token.                                                |
    | `dx`  | `uint256` | Amount of input coin[i] tokens.                                           |
    | `swap`| `address` | Address of the pool contract.                                             |


    ??? quote "Source code"

        === "CurveCryptoViewsOptimized2.vy"

            ```vyper
            @external
            @view
            def calc_fee_get_dy(i: uint256, j: uint256, dx: uint256, swap: address
            ) -> uint256:

                dy: uint256 = 0
                xp: uint256[N_COINS] = empty(uint256[N_COINS])
                dy, xp = self._get_dy_nofee(i, j, dx, swap)

                return Curve(swap).fee_calc(xp) * dy / 10**10

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

        === "CurveTwocryptoOptimized.vy"

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
        >>> Views.calc_fee_get_dy(0, 1, 100, pool)      # calculate fees for swapping 100 of coin 0 for coin 1
        returns approx_fee
        ```


## **Methods for Adding/Removing Liquidity**


### `calc_withdraw_one_coin`
!!! description "`Views.calc_withdraw_one_coin(token_amount: uint256, i: uint256, swap: address) -> uint256: view`"

    Function to calculate the output tokens (including fees) received when withdrawing LP tokens as a single coin.

    Returns: `dy` (`uint256`).

    | Input         | Type      | Description                                                      |
    |---------------|-----------|------------------------------------------------------------------|
    | `token_amount`| `uint256` | Amount of LP tokens to be withdrawn.                             |
    | `i`           | `uint256` | Index of the coin to withdraw in (use `Pool.coins(i)` to get the coin address at the i-th index). |
    | `swap`        | `address` | Address of the pool from which to withdraw.                      |

    ??? quote "Source code"

        === "CurveCryptoViewsOptimized2.vy"

            ```vyper
            @view
            @external
            def calc_withdraw_one_coin(
                token_amount: uint256, i: uint256, swap: address
            ) -> uint256:

                return self._calc_withdraw_one_coin(token_amount, i, swap)[0]

            @internal
            @view
            def _calc_withdraw_one_coin(
                token_amount: uint256,
                i: uint256,
                swap: address
            ) -> (uint256, uint256):

                token_supply: uint256 = Curve(swap).totalSupply()
                assert token_amount <= token_supply  # dev: token amount more than supply
                assert i < N_COINS  # dev: coin out of range

                math: Math = Curve(swap).MATH()

                xx: uint256[N_COINS] = empty(uint256[N_COINS])
                for k in range(N_COINS):
                    xx[k] = Curve(swap).balances(k)

                precisions: uint256[N_COINS] = Curve(swap).precisions()
                A: uint256 = Curve(swap).A()
                gamma: uint256 = Curve(swap).gamma()
                D0: uint256 = 0
                p: uint256 = 0

                price_scale_i: uint256 = Curve(swap).price_scale() * precisions[1]
                xp: uint256[N_COINS] = [
                    xx[0] * precisions[0],
                    unsafe_div(xx[1] * price_scale_i, PRECISION)
                ]
                if i == 0:
                    price_scale_i = PRECISION * precisions[0]

                if Curve(swap).future_A_gamma_time() > block.timestamp:
                    D0 = math.newton_D(A, gamma, xp, 0)
                else:
                    D0 = Curve(swap).D()

                D: uint256 = D0

                fee: uint256 = self._fee(xp, swap)
                dD: uint256 = token_amount * D / token_supply

                D_fee: uint256 = fee * dD / (2 * 10**10) + 1
                approx_fee: uint256 = N_COINS * D_fee * xx[i] / D

                D -= (dD - D_fee)

                y_out: uint256[2] = math.get_y(A, gamma, xp, D, i)
                dy: uint256 = (xp[i] - y_out[0]) * PRECISION / price_scale_i
                xp[i] = y_out[0]

                return dy, approx_fee
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
        >>> Views.calc_withdraw_one_coin(100, 0, pool)      # withdraw 100 lp tokens in as coin(0) from "pool"
        returns dy                                          # amount of tokens received
        ```


### `calc_token_amount`
!!! description "`Views.calc_token_amount(amounts: uint256[N_COINS], deposit: bool, swap: address) -> uint256: view`"

    Function to calculate LP tokens to be minted or burned when depositing or removing `amounts` of coins to or from the pool.

    Returns: `d_token` (`uint256`).

    | Input    | Type                | Description                                                          |
    |----------|---------------------|----------------------------------------------------------------------|
    | `amounts`| `uint256[N_COINS]`  | Array of amounts of coins being deposited or withdrawn.              |
    | `deposit`| `bool`              | Indicates the action: `True` for deposit, `False` for withdrawal.   |
    | `swap`   | `address`           | Address of the pool contract involved in the transaction.            |

    ??? quote "Source code"

        === "CurveCryptoViewsOptimized2.vy"

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

            @internal
            @view
            def _prep_calc(swap: address) -> (
                uint256[N_COINS],
                uint256,
                uint256,
                uint256,
                uint256,
                uint256,
                uint256[N_COINS]
            ):

                precisions: uint256[N_COINS] = Curve(swap).precisions()
                token_supply: uint256 = Curve(swap).totalSupply()
                xp: uint256[N_COINS] = empty(uint256[N_COINS])
                for k in range(N_COINS):
                    xp[k] = Curve(swap).balances(k)

                price_scale: uint256 = Curve(swap).price_scale()

                A: uint256 = Curve(swap).A()
                gamma: uint256 = Curve(swap).gamma()
                D: uint256 = self._calc_D_ramp(
                    A, gamma, xp, precisions, price_scale, swap
                )

                return xp, D, token_supply, price_scale, A, gamma, precisions

            @internal
            @view
            def _calc_D_ramp(
                A: uint256,
                gamma: uint256,
                xp: uint256[N_COINS],
                precisions: uint256[N_COINS],
                price_scale: uint256,
                swap: address
            ) -> uint256:

                math: Math = Curve(swap).MATH()
                D: uint256 = Curve(swap).D()
                if Curve(swap).future_A_gamma_time() > block.timestamp:
                    _xp: uint256[N_COINS] = xp
                    _xp[0] *= precisions[0]
                    _xp[1] = _xp[1] * price_scale * precisions[1] / PRECISION
                    D = math.newton_D(A, gamma, _xp, 0)

                return D
            ```

        === "CurveTwocryptoOptimized.vy"

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
            ```

    === "Example"

        ```shell
        >>> Views.calc_token_amount([100, 100], True, pool)     # depositing 100 of each coin into "pool"
        returns d_token                                         # LP tokens to be minted
        >>> Views.calc_token_amount([100, 100], False, pool)    # withdrawing 100 of each coin from "pool"
        returns d_token                                         # LP tokens to be burned
        ```


### `calc_fee_withdraw_one_coin`
!!! description "`Views.calc_fee_withdraw_one_coin(token_amount: uint256, i: uint256, swap: address) -> uint256: view`"

    Function to calculate the fee for `withdraw_one_coin`.

    Returns: Approximate fee (`uint256`).

    | Input         | Type      | Description                                                               |
    |---------------|-----------|---------------------------------------------------------------------------|
    | `token_amount`| `uint256` | Amount of LP tokens involved in the withdrawal.                           |
    | `i`           | `uint256` | Index of the token to be withdrawn (use `pool.coins(i)` to get the coin address at the i-th index). |
    | `swap`        | `address` | Address of the pool contract from which the withdrawal is being made.     |

    ??? quote "Source code"

        === "CurveCryptoViewsOptimized2.vy"

            ```vyper
            @external
            @view
            def calc_fee_withdraw_one_coin(
                token_amount: uint256, i: uint256, swap: address
            ) -> uint256:

                return self._calc_withdraw_one_coin(token_amount, i, swap)[1]

            @internal
            @view
            def _calc_withdraw_one_coin(
                token_amount: uint256,
                i: uint256,
                swap: address
            ) -> (uint256, uint256):

                token_supply: uint256 = Curve(swap).totalSupply()
                assert token_amount <= token_supply  # dev: token amount more than supply
                assert i < N_COINS  # dev: coin out of range

                math: Math = Curve(swap).MATH()

                xx: uint256[N_COINS] = empty(uint256[N_COINS])
                for k in range(N_COINS):
                    xx[k] = Curve(swap).balances(k)

                precisions: uint256[N_COINS] = Curve(swap).precisions()
                A: uint256 = Curve(swap).A()
                gamma: uint256 = Curve(swap).gamma()
                D0: uint256 = 0
                p: uint256 = 0

                price_scale_i: uint256 = Curve(swap).price_scale() * precisions[1]
                xp: uint256[N_COINS] = [
                    xx[0] * precisions[0],
                    unsafe_div(xx[1] * price_scale_i, PRECISION)
                ]
                if i == 0:
                    price_scale_i = PRECISION * precisions[0]

                if Curve(swap).future_A_gamma_time() > block.timestamp:
                    D0 = math.newton_D(A, gamma, xp, 0)
                else:
                    D0 = Curve(swap).D()

                D: uint256 = D0

                fee: uint256 = self._fee(xp, swap)
                dD: uint256 = token_amount * D / token_supply

                D_fee: uint256 = fee * dD / (2 * 10**10) + 1
                approx_fee: uint256 = N_COINS * D_fee * xx[i] / D

                D -= (dD - D_fee)

                y_out: uint256[2] = math.get_y(A, gamma, xp, D, i)
                dy: uint256 = (xp[i] - y_out[0]) * PRECISION / price_scale_i
                xp[i] = y_out[0]

                return dy, approx_fee
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
        >>> Views.calc_fee_withdraw_one_coin(100, 0, pool)      # withdrawing 100 lp tokens in coin(0)
        returns apporx_fee                                      # approx fee
        ```


### `calc_fee_token_amount`
!!! description "`Views.calc_fee_token_amount(amounts: uint256[N_COINS], deposit: bool, swap: address) -> uint256: view`"

    Function to calculate the fee for `calc_token_amount`.

    Returns: Approximate fee (`uint256`).

    | Input     | Type                | Description                                                          |
    |-----------|---------------------|----------------------------------------------------------------------|
    | `amounts` | `uint256[N_COINS]`  | Array of amounts of each coin being deposited or withdrawn.          |
    | `deposit` | `bool`              | Indicates the action: `True` for deposit, `False` for withdrawal.   |
    | `swap`    | `address`           | Address of the pool contract involved in the transaction.            |

    ??? quote "Source code"

        === "CurveCryptoViewsOptimized2.vy"

            ```vyper
            @view
            @external
            def calc_fee_token_amount(
                amounts: uint256[N_COINS], deposit: bool, swap: address
            ) -> uint256:

                d_token: uint256 = 0
                amountsp: uint256[N_COINS] = empty(uint256[N_COINS])
                xp: uint256[N_COINS] = empty(uint256[N_COINS])
                d_token, amountsp, xp = self._calc_dtoken_nofee(amounts, deposit, swap)

                return Curve(swap).calc_token_fee(amountsp, xp) * d_token / 10**10 + 1

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

        === "CurveTwocryptoOptimized.vy"

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
            ```

    === "Example"

        ```shell
        >>> Views.calc_fee_token_amount([100, 100], True, pool)     # depositing 100 of each coin into "pool"
        returns fee
        >>> Views.calc_fee_token_amount([100, 100], False, pool)    # withdrawing 100 of each coin from "pool"
        returns fee
        ```
