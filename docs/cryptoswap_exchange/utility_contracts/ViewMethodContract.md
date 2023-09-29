This contract contains view-only external methods which can be gas-inefficient when called from smart contracts.

!!! note
    The ViewMethodContract is deployed to the Ethereum mainnet at: [0x064253915b8449fdEFac2c4A74aA9fdF56691a31](https://etherscan.io/address/0x064253915b8449fdEFac2c4A74aA9fdF56691a31#code).
    Source code for this contract is available on [Github](https://github.com/curvefi/tricrypto-ng/blob/main/contracts/main/CurveCryptoViews3Optimized.vy).



## Token Exchange Methods

### `get_dy`
!!! description "`ViewMethodContract.get_dy(i: uint256, j: uint256, dx: uint256, swap: address) -> uint256:`"

    Getter method for the amount of coin[j] tokens received for swapping in dx amount of coin[i]. This function includes the fee.

    Returns: dy (`uint256`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `i` |  `uint256` | Index of input token (check pool.coins(i) to get coin address at i-th index) |
    | `j` |  `uint256` | Index of output token |
    | `dx` |  `uint256` | Amount of input coin[i] tokens |
    | `swap` |  `address` | Pool contract address  |

    ??? quote "Source code"

        ```python hl_lines="3 14"
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
        ```

    === "Example"

        ```shell
        >>> ViewMethodContract.get_dy(0, 1, 100000000000, "0xf5f5B97624542D72A9E06f04804Bf81baA15e2B4")
        384205076
        ```


### `get_dx`
!!! description "`ViewMethodContract.get_dx(i: uint256, j: uint256, dy: uint256, swap: address) -> uint256:`"

    Getter method for the amount of coin[i] tokens to input for swapping out dy amount of coin[j]

    Returns: dx (`uint256`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `i` |  `uint256` | Index of input token (check pool.coins(i) to get coin address at i-th index) |
    | `j` |  `uint256` | Index of output token |
    | `dy` |  `uint256` | amount of input coin[j] tokens received |
    | `swap` |  `address` | Pool contract address  |

    !!!note
        This is an approximate method, and returns estimates close to the input amount. Expensive to call on-chain.

    ??? quote "Source code"

        ```python hl_lines="3 17"
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
        ```

    === "Example"

        ```shell
        >>> ViewMethodContract.get_dx(0, 1, 1000, "0xf5f5B97624542D72A9E06f04804Bf81baA15e2B4")
        259849
        ```
    

### `calc_withdraw_one_coin` 
!!! description "`ViewMethodContract.calc_withdraw_one_coin(token_amount: uint256, i: uint256, swap: address) -> uint256:`"

    Getter method for the output tokens (including fees) when withdrawing one coin.

    Returns: amount of output tokens (`uint256`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `token_amount` |  `uint256` | LP token amount |
    | `i` |  `uint256` | Index of the token to withdraw |
    | `swap` |  `address` | Pool contract address  |

    ??? quote "Source code"

        ```python hl_lines="3 7 11 64"
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
            price_scale: uint256[N_COINS-1] = empty(uint256[N_COINS-1])
            for k in range(N_COINS):
                xx[k] = Curve(swap).balances(k)
                if k > 0:
                    price_scale[k - 1] = Curve(swap).price_scale(k - 1)

            precisions: uint256[N_COINS] = Curve(swap).precisions()
            A: uint256 = Curve(swap).A()
            gamma: uint256 = Curve(swap).gamma()
            xp: uint256[N_COINS] = precisions
            D0: uint256 = 0
            p: uint256 = 0

            price_scale_i: uint256 = PRECISION * precisions[0]
            xp[0] *= xx[0]
            for k in range(1, N_COINS):

                p = price_scale[k-1]
                if i == k:
                    price_scale_i = p * xp[i]
                xp[k] = xp[k] * xx[k] * p / PRECISION

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

    === "Example"

        ```shell
        >>> ViewMethodContract.calc_withdraw_one_coin(1000000000000000, 0, "0xf5f5B97624542D72A9E06f04804Bf81baA15e2B4")
        1049071
        ```


### `calc_token_amount`
!!! description "`ViewMethodContract.calc_token_amount(amounts: uint256[N_COINS], deposit: bool, swap: address) -> uint256:`"

    Function to calculate LP tokens minted or to be burned for depositing or removing `amounts` of coins to or from `swap`.

    Returns: LP token amount to be burned/minted (`uint256`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `amounts` |  `uint256[N_COINS]` | LP token amount |
    | `deposit` |  `bool` | `True` = deposit, `False` = withdraw |
    | `swap` |  `address` | Pool contract address  |

    ??? quote "Source code"

        ```python hl_lines="3 16 19"
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
            price_scale: uint256[N_COINS-1] = empty(uint256[N_COINS-1])
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

            xp[0] *= precisions[0]
            amountsp[0] *= precisions[0]
            for k in range(N_COINS - 1):
                p: uint256 = price_scale[k] * precisions[k + 1]
                xp[k + 1] = xp[k + 1] * p / PRECISION
                amountsp[k + 1] = amountsp[k + 1] * p / PRECISION

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
        >>> ViewMethodContract.calc_token_amount([1,1,1], 0, "0xf5f5B97624542D72A9E06f04804Bf81baA15e2B4")
        248287947930
        ```



## Calculating Fees Methods

Methods to calculate fees for `get_dy`, `withdraw_one_coin` and `calc_token_amount`.

### `calc_fee_get_dy`
!!! description "`ViewMethodContract.calc_fee_get_dy(i: uint256, j: uint256, dx: uint256, swap: address) -> uint256:`"

    Function to calculate the fees for `get_dy`.

    Returns: fee (`uint256`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `i` |  `uint256` | Index of input token (check pool.coins(i) to get coin address at i-th index) |
    | `j` |  `uint256` | Index of output token |
    | `dx` |  `uint256` | Amount of input coin[i] tokens |
    | `swap` |  `address` | Pool contract address  |

    ??? quote "Source code"

        ```python hl_lines="3 8 10 14"
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
            price_scale: uint256[N_COINS-1] = empty(uint256[N_COINS-1])
            D: uint256 = 0
            token_supply: uint256 = 0
            A: uint256 = 0
            gamma: uint256 = 0

            xp, D, token_supply, price_scale, A, gamma, precisions = self._prep_calc(swap)

            # adjust xp with input dx
            xp[i] += dx
            xp[0] *= precisions[0]
            for k in range(N_COINS - 1):
                xp[k + 1] = xp[k + 1] * price_scale[k] * precisions[k + 1] / PRECISION

            y_out: uint256[2] = math.get_y(A, gamma, xp, D, j)
            dy: uint256 = xp[j] - y_out[0] - 1
            xp[j] = y_out[0]
            if j > 0:
                dy = dy * PRECISION / price_scale[j - 1]
            dy /= precisions[j]

            return dy, xp
        ```

    === "Example"

        ```shell
        >>> ViewMethodContract.calc_fee_get_dy(0, 1, 100000000, "0xf5f5B97624542D72A9E06f04804Bf81baA15e2B4")
        142
        ```


### `calc_fee_withdraw_one_coin`
!!! description "`ViewMethodContract.calc_fee_withdraw_one_coin(token_amount: uint256, i: uint256, swap: address) -> uint256:`"

    Function to calculate the fees for `withdraw_one_coin`.

    Returns: fee (`uint256`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `token_amount` |  `uint256` | LP token amount |
    | `i` |  `uint256` | Index of the token to withdraw |
    | `swap` |  `address` | Pool contract address  |

    ??? quote "Source code"

        ```python hl_lines="3 7 11"
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
            price_scale: uint256[N_COINS-1] = empty(uint256[N_COINS-1])
            for k in range(N_COINS):
                xx[k] = Curve(swap).balances(k)
                if k > 0:
                    price_scale[k - 1] = Curve(swap).price_scale(k - 1)

            precisions: uint256[N_COINS] = Curve(swap).precisions()
            A: uint256 = Curve(swap).A()
            gamma: uint256 = Curve(swap).gamma()
            xp: uint256[N_COINS] = precisions
            D0: uint256 = 0
            p: uint256 = 0

            price_scale_i: uint256 = PRECISION * precisions[0]
            xp[0] *= xx[0]
            for k in range(1, N_COINS):

                p = price_scale[k-1]
                if i == k:
                    price_scale_i = p * xp[i]
                xp[k] = xp[k] * xx[k] * p / PRECISION

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

    === "Example"

        ```shell
        >>> ViewMethodContract.calc_fee_withdraw_one_coin(10000000000, 2, "0xf5f5B97624542D72A9E06f04804Bf81baA15e2B4")
        1176331
        ```


### `calc_fee_token_amount`
!!! description "`ViewMethodContract.calc_fee_token_amount(amounts: uint256[N_COINS], deposit: bool, swap: address) -> uint256:`"

    Function to calculate the fees for `calc_token_amount`.

    Returns: fee (`uint256`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `amounts` |  `uint256[N_COINS]` | LP token amount |
    | `deposit` |  `bool` | `True` = deposit, `False` = withdraw |
    | `swap` |  `address` | Pool contract address  |

    ??? quote "Source code"

        ```python hl_lines="3 12 16"
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
            price_scale: uint256[N_COINS-1] = empty(uint256[N_COINS-1])
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

            xp[0] *= precisions[0]
            amountsp[0] *= precisions[0]
            for k in range(N_COINS - 1):
                p: uint256 = price_scale[k] * precisions[k + 1]
                xp[k + 1] = xp[k + 1] * p / PRECISION
                amountsp[k + 1] = amountsp[k + 1] * p / PRECISION

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
        >>> ViewMethodContract.calc_fee_token_amount([1,1,1], 0, "0xf5f5B97624542D72A9E06f04804Bf81baA15e2B4")
        48166379
        ```