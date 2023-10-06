TODO: 
- highlight lines in code blocks



!!!tip
    For Tricrypto-NG pools, price scaling and fee parameters are bundled and stored as a single unsigned integer. This consolidation reduces storage read and write operations, leading to more cost-efficient calls. When these parameters are accessed, they are subsequently unpacked.

    ??? quote "_pack()"

        ```python hl_lines="1 3 8 13"
        @internal
        @view
        def _pack(x: uint256[3]) -> uint256:
            """
            @notice Packs 3 integers with values <= 10**18 into a uint256
            @param x The uint256[3] to pack
            @return uint256 Integer with packed values
            """
            return (x[0] << 128) | (x[1] << 64) | x[2]
        ```


    ??? quote "_unpack()"

        ```python hl_lines="1 3 8 13"
        @internal
        @view
        def _unpack(_packed: uint256) -> uint256[3]:
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


## **Exchange Methods** (redo these!)


### `exchange` (todo)
!!! description "`CryptoSwap.exchange(i: uint256, j: uint256, dx: uint256, min_dy: uint256, receiver: address = msg.sender) -> uint256:`"

    Function to exchange `dx` amount of coin `i` for coin `j` and receive a minimum amount of `min_dy`.

    Returns:  Amount of tokens at index j received by the `receiver
    
    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `i` | `uint256` | Index value for the input coin |
    | `j` | `uint256` | Index value for the output coin |
    | `dx` | `uint256` | Amount of input coin being swapped in |
    | `min_dy` | `uint256` | Minimum amount of output coin to receive |
    | `receiver` | `address` | Address to send output coin to. Deafaults to `msg.sender` |

    ??? quote "Source code"

        === "Contract Name 1"

            ```python hl_lines="4 21"
            event TokenExchange:
                buyer: indexed(address)
                sold_id: uint256
                tokens_sold: uint256
                bought_id: uint256
                tokens_bought: uint256
                fee: uint256
                packed_price_scale: uint256

            @payable
            @external
            @nonreentrant("lock")
            def exchange(
                i: uint256,
                j: uint256,
                dx: uint256,
                min_dy: uint256,
                use_eth: bool = False,
                receiver: address = msg.sender
            ) -> uint256:
                """
                @notice Exchange using wrapped native token by default
                @param i Index value for the input coin
                @param j Index value for the output coin
                @param dx Amount of input coin being swapped in
                @param min_dy Minimum amount of output coin to receive
                @param use_eth True if the input coin is native token, False otherwise
                @param receiver Address to send the output coin to. Default is msg.sender
                @return uint256 Amount of tokens at index j received by the `receiver
                """
                return self._exchange(
                    msg.sender,
                    msg.value,
                    i,
                    j,
                    dx,
                    min_dy,
                    use_eth,
                    receiver,
                    empty(address),
                    empty(bytes32)
                )

            @internal
            def _exchange(
                sender: address,
                mvalue: uint256,
                i: uint256,
                j: uint256,
                dx: uint256,
                min_dy: uint256,
                use_eth: bool,
                receiver: address,
                callbacker: address,
                callback_sig: bytes32
            ) -> uint256:

                assert i != j  # dev: coin index out of range
                assert dx > 0  # dev: do not exchange 0 coins

                A_gamma: uint256[2] = self._A_gamma()
                xp: uint256[N_COINS] = self.balances
                precisions: uint256[N_COINS] = self._unpack(self.packed_precisions)
                dy: uint256 = 0

                y: uint256 = xp[j]  # <----------------- if j > N_COINS, this will revert.
                x0: uint256 = xp[i]  # <--------------- if i > N_COINS, this will  revert.
                xp[i] = x0 + dx
                self.balances[i] = xp[i]

                packed_price_scale: uint256 = self.price_scale_packed
                price_scale: uint256[N_COINS - 1] = self._unpack_prices(
                    packed_price_scale
                )

                xp[0] *= precisions[0]
                for k in range(1, N_COINS):
                    xp[k] = unsafe_div(
                        xp[k] * price_scale[k - 1] * precisions[k],
                        PRECISION
                    )  # <-------- Safu to do unsafe_div here since PRECISION is not zero.

                prec_i: uint256 = precisions[i]

                # ----------- Update invariant if A, gamma are undergoing ramps ---------

                t: uint256 = self.future_A_gamma_time
                if t > block.timestamp:

                    x0 *= prec_i

                    if i > 0:
                        x0 = unsafe_div(x0 * price_scale[i - 1], PRECISION)

                    x1: uint256 = xp[i]  # <------------------ Back up old value in xp ...
                    xp[i] = x0                                                         # |
                    self.D = MATH.newton_D(A_gamma[0], A_gamma[1], xp, 0)              # |
                    xp[i] = x1  # <-------------------------------------- ... and restore.

                # ----------------------- Calculate dy and fees --------------------------

                D: uint256 = self.D
                prec_j: uint256 = precisions[j]
                y_out: uint256[2] = MATH.get_y(A_gamma[0], A_gamma[1], xp, D, j)
                dy = xp[j] - y_out[0]
                xp[j] -= dy
                dy -= 1

                if j > 0:
                    dy = dy * PRECISION / price_scale[j - 1]
                dy /= prec_j

                fee: uint256 = unsafe_div(self._fee(xp) * dy, 10**10)

                dy -= fee  # <--------------------- Subtract fee from the outgoing amount.
                assert dy >= min_dy, "Slippage"

                y -= dy
                self.balances[j] = y  # <----------- Update pool balance of outgoing coin.

                y *= prec_j
                if j > 0:
                    y = unsafe_div(y * price_scale[j - 1], PRECISION)
                xp[j] = y  # <------------------------------------------------- Update xp.

                # ---------------------- Do Transfers in and out -------------------------

                ########################## TRANSFER IN <-------
                self._transfer_in(
                    coins[i], dx, dy, mvalue,
                    callbacker, callback_sig,  # <-------- Callback method is called here.
                    sender, receiver, use_eth,
                )

                ########################## -------> TRANSFER OUT
                self._transfer_out(coins[j], dy, use_eth, receiver)

                # ------ Tweak price_scale with good initial guess for newton_D ----------

                packed_price_scale = self.tweak_price(A_gamma, xp, 0, y_out[1])

                log TokenExchange(sender, i, dx, j, dy, fee, packed_price_scale)

                return dy
            ```

        === "Contract Name 2"

            ```python hl_lines="2"
            code here
            ```

    === "Example"

        ```shell
        >>> CryptoSwap.exchange("todo")
        
        ```


### `exchange_underlying`
!!! description "`TriCrypto.exchange_underlying(i: uint256, j: uint256, dx: uint256, min_dy: uint256, receiver: address = msg.sender) -> uint256:`"

    Function to exchange between two underlying tokens.

    Returns: amount of tokens received (`uint256`).

    Emits: `TokenExchange`

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `i` |  `uint256` | Index value for the input coin |
    | `j` |  `uint256` | Index value for the output coin |
    | `dx` |  `uint256` | Amount of input coin being swapped in |
    | `min_dy` |  `uint256` | Minimum amount of output coin to receive |
    | `receiver` |  `address` | Receiver Address; defaults to msg.sender |

    ??? quote "Source code"

        ```python hl_lines="4"
        event TokenExchange:
            buyer: indexed(address)
            sold_id: uint256
            tokens_sold: uint256
            bought_id: uint256
            tokens_bought: uint256
            fee: uint256
            packed_price_scale: uint256
    
        @payable
        @external
        @nonreentrant('lock')
        def exchange_underlying(
            i: uint256,
            j: uint256,
            dx: uint256,
            min_dy: uint256,
            receiver: address = msg.sender
        ) -> uint256:
            """
            @notice Exchange using native token transfers.
            @param i Index value for the input coin
            @param j Index value for the output coin
            @param dx Amount of input coin being swapped in
            @param min_dy Minimum amount of output coin to receive
            @param receiver Address to send the output coin to. Default is msg.sender
            @return uint256 Amount of tokens at index j received by the `receiver
            """
            return self._exchange(
                msg.sender,
                msg.value,
                i,
                j,
                dx,
                min_dy,
                True,
                receiver,
                empty(address),
                empty(bytes32)
            )

        @internal
        def _exchange(
            sender: address,
            mvalue: uint256,
            i: uint256,
            j: uint256,
            dx: uint256,
            min_dy: uint256,
            use_eth: bool,
            receiver: address,
            callbacker: address,
            callback_sig: bytes32
        ) -> uint256:

            assert i != j  # dev: coin index out of range
            assert dx > 0  # dev: do not exchange 0 coins

            A_gamma: uint256[2] = self._A_gamma()
            xp: uint256[N_COINS] = self.balances
            precisions: uint256[N_COINS] = self._unpack(self.packed_precisions)
            dy: uint256 = 0

            y: uint256 = xp[j]  # <----------------- if j > N_COINS, this will revert.
            x0: uint256 = xp[i]  # <--------------- if i > N_COINS, this will  revert.
            xp[i] = x0 + dx
            self.balances[i] = xp[i]

            packed_price_scale: uint256 = self.price_scale_packed
            price_scale: uint256[N_COINS - 1] = self._unpack_prices(
                packed_price_scale
            )

            xp[0] *= precisions[0]
            for k in range(1, N_COINS):
                xp[k] = unsafe_div(
                    xp[k] * price_scale[k - 1] * precisions[k],
                    PRECISION
                )  # <-------- Safu to do unsafe_div here since PRECISION is not zero.

            prec_i: uint256 = precisions[i]

            # ----------- Update invariant if A, gamma are undergoing ramps ---------

            t: uint256 = self.future_A_gamma_time
            if t > block.timestamp:

                x0 *= prec_i

                if i > 0:
                    x0 = unsafe_div(x0 * price_scale[i - 1], PRECISION)

                x1: uint256 = xp[i]  # <------------------ Back up old value in xp ...
                xp[i] = x0                                                         # |
                self.D = MATH.newton_D(A_gamma[0], A_gamma[1], xp, 0)              # |
                xp[i] = x1  # <-------------------------------------- ... and restore.

            # ----------------------- Calculate dy and fees --------------------------

            D: uint256 = self.D
            prec_j: uint256 = precisions[j]
            y_out: uint256[2] = MATH.get_y(A_gamma[0], A_gamma[1], xp, D, j)
            dy = xp[j] - y_out[0]
            xp[j] -= dy
            dy -= 1

            if j > 0:
                dy = dy * PRECISION / price_scale[j - 1]
            dy /= prec_j

            fee: uint256 = unsafe_div(self._fee(xp) * dy, 10**10)

            dy -= fee  # <--------------------- Subtract fee from the outgoing amount.
            assert dy >= min_dy, "Slippage"

            y -= dy
            self.balances[j] = y  # <----------- Update pool balance of outgoing coin.

            y *= prec_j
            if j > 0:
                y = unsafe_div(y * price_scale[j - 1], PRECISION)
            xp[j] = y  # <------------------------------------------------- Update xp.

            # ---------------------- Do Transfers in and out -------------------------

            ########################## TRANSFER IN <-------
            self._transfer_in(
                coins[i], dx, dy, mvalue,
                callbacker, callback_sig,  # <-------- Callback method is called here.
                sender, receiver, use_eth,
            )

            ########################## -------> TRANSFER OUT
            self._transfer_out(coins[j], dy, use_eth, receiver)

            # ------ Tweak price_scale with good initial guess for newton_D ----------

            packed_price_scale = self.tweak_price(A_gamma, xp, 0, y_out[1])

            log TokenExchange(sender, i, dx, j, dy, fee, packed_price_scale)

            return dy
        ```

    === "Example"

        ```shell
        >>> TriCrypto.fee_receiver()
        '0xeCb456EA5365865EbAb8a2661B0c503410e9B347'
        ```


### `calc_token_amount`
!!! description "`TriCrypto.def calc_token_amount(amounts: uint256[N_COINS], deposit: bool) -> uint256:`"

    Function to calculate LP tokens minted or burned from depositing or removing `amounts`. This function does include fees.

    Returns: amount of tokens (`uint256`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `amounts` |  `uint256[N_COINS]` | Amounts of tokens being deposited or withdrawn |
    | `deposit` |  `bool` | True = deposit, False = withdraw |

    ??? quote "Source code"

        === "TriCrypto Pool"

            ```python hl_lines="0"
            interface Factory:
                def admin() -> address: view
                def fee_receiver() -> address: view
                def views_implementation() -> address: view

            interface Views:
                def calc_token_amount(
                    amounts: uint256[N_COINS], deposit: bool, swap: address
                ) -> uint256: view
                def get_dy(
                    i: uint256, j: uint256, dx: uint256, swap: address
                ) -> uint256: view
                def get_dx(
                    i: uint256, j: uint256, dy: uint256, swap: address
                ) -> uint256: view

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
                view_contract: address = Factory(self.factory).views_implementation()
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

        === "Views Contract"

            ```python hl_lines="3"
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
            ```

    === "Example"

        ```shell
        >>> TriCrypto.calc_token_amount(todo)
        'todo'
        ```


### `get_dy`
!!! description "`TriCrypto.get_dy(i: uint256, j: uint256, dx: uint256) -> uint256:`"

    Getter for the fee receiver of the accumulated fees.

    Returns:

    Emits:

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `input` |  `type` | Contract input |

    ??? quote "Source code"

        === "TriCrypto Pool"

            ```python hl_lines="0"
            interface Factory:
                def admin() -> address: view
                def fee_receiver() -> address: view
                def views_implementation() -> address: view

            interface Views:
                def calc_token_amount(
                    amounts: uint256[N_COINS], deposit: bool, swap: address
                ) -> uint256: view
                def get_dy(
                    i: uint256, j: uint256, dx: uint256, swap: address
                ) -> uint256: view
                def get_dx(
                    i: uint256, j: uint256, dy: uint256, swap: address
                ) -> uint256: view

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
                view_contract: address = Factory(self.factory).views_implementation()
                return Views(view_contract).get_dy(i, j, dx, self)
            ```

        === "Views Contract"

            ```python hl_lines="3"
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
        >>> TriCrypto.get_dy()
        '0xeCb456EA5365865EbAb8a2661B0c503410e9B347'
        ```


### `get_dx`
!!! description "`TriCrypto.fee_receiver() -> address: view`"

    Getter for the fee receiver of the accumulated fees.

    Returns:

    Emits:

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `input` |  `type` | Contract input |

    ??? quote "Source code"

        === "TriCrypto Pool"

            ```python hl_lines="0"
            interface Factory:
                def admin() -> address: view
                def fee_receiver() -> address: view
                def views_implementation() -> address: view

            interface Views:
                def calc_token_amount(
                    amounts: uint256[N_COINS], deposit: bool, swap: address
                ) -> uint256: view
                def get_dy(
                    i: uint256, j: uint256, dx: uint256, swap: address
                ) -> uint256: view
                def get_dx(
                    i: uint256, j: uint256, dy: uint256, swap: address
                ) -> uint256: view

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
                view_contract: address = Factory(self.factory).views_implementation()
                return Views(view_contract).get_dx(i, j, dy, self)

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
                fee_params: uint256[3] = self._unpack(self.packed_fee_params)
                f: uint256 = MATH.reduction_coefficient(xp, fee_params[2])
                return unsafe_div(
                    fee_params[0] * f + fee_params[1] * (10**18 - f),
                    10**18
                )
            ```

        === "Views Contract"

            ```python hl_lines="3"
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
                price_scale: uint256[N_COINS-1] = empty(uint256[N_COINS-1])
                D: uint256 = 0
                token_supply: uint256 = 0
                A: uint256 = 0
                gamma: uint256 = 0

                xp, D, token_supply, price_scale, A, gamma, precisions = self._prep_calc(swap)

                # adjust xp with output dy. dy contains fee element, which we handle later
                # (hence this internal method is called _get_dx_fee)
                xp[j] -= dy
                xp[0] *= precisions[0]
                for k in range(N_COINS - 1):
                    xp[k + 1] = xp[k + 1] * price_scale[k] * precisions[k + 1] / PRECISION

                x_out: uint256[2] = math.get_y(A, gamma, xp, D, i)
                dx: uint256 = x_out[0] - xp[i]
                xp[i] = x_out[0]
                if i > 0:
                    dx = dx * PRECISION / price_scale[i - 1]
                dx /= precisions[i]

                return dx, xp

            @internal
            @view
            def _prep_calc(swap: address) -> (
                uint256[N_COINS],
                uint256,
                uint256,
                uint256[N_COINS-1],
                uint256,
                uint256,
                uint256[N_COINS]
            ):

                precisions: uint256[N_COINS] = Curve(swap).precisions()
                token_supply: uint256 = Curve(swap).totalSupply()
                xp: uint256[N_COINS] = empty(uint256[N_COINS])
                for k in range(N_COINS):
                    xp[k] = Curve(swap).balances(k)

                price_scale: uint256[N_COINS - 1] = empty(uint256[N_COINS - 1])
                for k in range(N_COINS - 1):
                    price_scale[k] = Curve(swap).price_scale(k)

                A: uint256 = Curve(swap).A()
                gamma: uint256 = Curve(swap).gamma()
                D: uint256 = self._calc_D_ramp(
                    A, gamma, xp, precisions, price_scale, swap
                )

                return xp, D, token_supply, price_scale, A, gamma, precisions
            ```

            === "Math"

                ```python hl_lines="3"
                @external
                @view
                def reduction_coefficient(x: uint256[N_COINS], fee_gamma: uint256) -> uint256:
                    """
                    @notice Calculates the reduction coefficient for the given x and fee_gamma
                    @dev This method is used for calculating fees.
                    @param x The x values
                    @param fee_gamma The fee gamma value
                    """
                    return self._reduction_coefficient(x, fee_gamma)

                @internal
                @pure
                def _reduction_coefficient(x: uint256[N_COINS], fee_gamma: uint256) -> uint256:

                    # fee_gamma / (fee_gamma + (1 - K))
                    # where
                    # K = prod(x) / (sum(x) / N)**N
                    # (all normalized to 1e18)

                    S: uint256 = x[0] + x[1] + x[2]

                    # Could be good to pre-sort x, but it is used only for dynamic fee
                    K: uint256 = 10**18 * N_COINS * x[0] / S
                    K = unsafe_div(K * N_COINS * x[1], S)  # <- unsafe div is safu.
                    K = unsafe_div(K * N_COINS * x[2], S)

                    if fee_gamma > 0:
                        K = fee_gamma * 10**18 / (fee_gamma + 10**18 - K)

                    return K
                ```

    === "Example"

        ```shell
        >>> TriCrypto.get_dx()
        '0xeCb456EA5365865EbAb8a2661B0c503410e9B347'
        ```


### `exchange_extended` (todo)


























































## **Add/Remove Liquidity Methods**


### `add_liquidity`
!!! description "`CryptoSwap.add_liquidity(amounts: uint256[N_COINS], min_mint_amount: uint256, use_eth: bool = False, receiver: address = msg.sender) -> uint256:`"

    Function to add liquidity to the pool and mint the corresponding lp tokens. After adding liquidity, admin fees are claimed.

    Returns: amount of lp tokens received (`uint256`).

    Emits: `AddLiquidity`

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `amounts` |  `uint256[N_COINS]` | amount of each coin to add |
    | `min_mint_amount` |  `uint256` | minimum amount of lp tokens to mint |
    | `use_eth` |  `bool` | `True` if native token is being added to the pool; default to `False` |
    | `receiver` |  `address` | receiver of the lp tokens |


    ??? quote "Source code"

        === "CurveTricryptoOptimizedWETH.vy"

            ```python hl_lines="1"
            event AddLiquidity:
                provider: indexed(address)
                token_amounts: uint256[N_COINS]
                fee: uint256
                token_supply: uint256
                packed_price_scale: uint256

            @payable
            @external
            @nonreentrant("lock")
            def add_liquidity(
                amounts: uint256[N_COINS],
                min_mint_amount: uint256,
                use_eth: bool = False,
                receiver: address = msg.sender
            ) -> uint256:
                """
                @notice Adds liquidity into the pool.
                @param amounts Amounts of each coin to add.
                @param min_mint_amount Minimum amount of LP to mint.
                @param use_eth True if native token is being added to the pool.
                @param receiver Address to send the LP tokens to. Default is msg.sender
                @return uint256 Amount of LP tokens received by the `receiver
                """

                A_gamma: uint256[2] = self._A_gamma()
                xp: uint256[N_COINS] = self.balances
                amountsp: uint256[N_COINS] = empty(uint256[N_COINS])
                xx: uint256[N_COINS] = empty(uint256[N_COINS])
                d_token: uint256 = 0
                d_token_fee: uint256 = 0
                old_D: uint256 = 0

                assert amounts[0] + amounts[1] + amounts[2] > 0  # dev: no coins to add

                # --------------------- Get prices, balances -----------------------------

                precisions: uint256[N_COINS] = self._unpack(self.packed_precisions)
                packed_price_scale: uint256 = self.price_scale_packed
                price_scale: uint256[N_COINS-1] = self._unpack_prices(packed_price_scale)

                # -------------------------------------- Update balances and calculate xp.
                xp_old: uint256[N_COINS] = xp
                for i in range(N_COINS):
                    bal: uint256 = xp[i] + amounts[i]
                    xp[i] = bal
                    self.balances[i] = bal
                xx = xp

                xp[0] *= precisions[0]
                xp_old[0] *= precisions[0]
                for i in range(1, N_COINS):
                    xp[i] = unsafe_div(xp[i] * price_scale[i-1] * precisions[i], PRECISION)
                    xp_old[i] = unsafe_div(
                        xp_old[i] * unsafe_mul(price_scale[i-1], precisions[i]),
                        PRECISION
                    )

                # ---------------- transferFrom token into the pool ----------------------

                for i in range(N_COINS):

                    if amounts[i] > 0:

                        if coins[i] == WETH20:

                            self._transfer_in(
                                coins[i],
                                amounts[i],
                                0,  # <-----------------------------------
                                msg.value,  #                             | No callbacks
                                empty(address),  # <----------------------| for
                                empty(bytes32),  # <----------------------| add_liquidity.
                                msg.sender,  #                            |
                                empty(address),  # <-----------------------
                                use_eth
                            )

                        else:

                            self._transfer_in(
                                coins[i],
                                amounts[i],
                                0,
                                0,  # <----------------- mvalue = 0 if coin is not WETH20.
                                empty(address),
                                empty(bytes32),
                                msg.sender,
                                empty(address),
                                False  # <-------- use_eth is False if coin is not WETH20.
                            )

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
                    d_token = self.get_xcp(D)  # <------------------------- Making initial
                    #                                            virtual price equal to 1.

                assert d_token > 0  # dev: nothing minted

                if old_D > 0:

                    d_token_fee = (
                        self._calc_token_fee(amountsp, xp) * d_token / 10**10 + 1
                    )

                    d_token -= d_token_fee
                    token_supply += d_token
                    self.mint(receiver, d_token)

                    packed_price_scale = self.tweak_price(A_gamma, xp, D, 0)

                else:

                    self.D = D
                    self.virtual_price = 10**18
                    self.xcp_profit = 10**18
                    self.xcp_profit_a = 10**18
                    self.mint(receiver, d_token)

                assert d_token >= min_mint_amount, "Slippage"

                log AddLiquidity(
                    receiver, amounts, d_token_fee, token_supply, packed_price_scale
                )

                self._claim_admin_fees()  # <--------------------------- Claim admin fees.

                return d_token
            ```

        === "Math.vy"

            ```python hl_lines="1"
            @external
            @view
            def newton_D(
                ANN: uint256,
                gamma: uint256,
                x_unsorted: uint256[N_COINS],
                K0_prev: uint256 = 0,
            ) -> uint256:
                """
                @notice Finding the invariant via newtons method using good initial guesses.
                @dev ANN is higher by the factor A_MULTIPLIER
                @dev ANN is already A * N**N
                @param ANN the A * N**N value
                @param gamma the gamma value
                @param x_unsorted the array of coin balances (not sorted)
                @param K0_prev apriori for newton's method derived from get_y_int. Defaults
                    to zero (no apriori)
                """
                x: uint256[N_COINS] = self._sort(x_unsorted)
                assert x[0] < max_value(uint256) / 10**18 * N_COINS**N_COINS  # dev: out of limits
                assert x[0] > 0  # dev: empty pool

                # Safe to do unsafe add since we checked largest x's bounds previously
                S: uint256 = unsafe_add(unsafe_add(x[0], x[1]), x[2])
                D: uint256 = 0

                if K0_prev == 0:
                    # Geometric mean of 3 numbers cannot be larger than the largest number
                    # so the following is safe to do:
                    D = unsafe_mul(N_COINS, self._geometric_mean(x))
                else:
                    if S > 10**36:
                        D = self._cbrt(
                            unsafe_div(
                                unsafe_div(x[0] * x[1], 10**36) * x[2],
                                K0_prev
                            ) * 27 * 10**12
                        )
                    elif S > 10**24:
                        D = self._cbrt(
                            unsafe_div(
                                unsafe_div(x[0] * x[1], 10**24) * x[2],
                                K0_prev
                            ) * 27 * 10**6
                        )
                    else:
                        D = self._cbrt(
                            unsafe_div(
                                unsafe_div(x[0] * x[1], 10**18) * x[2],
                                K0_prev
                            ) * 27
                        )

                    # D not zero here if K0_prev > 0, and we checked if x[0] is gt 0.

                # initialise variables:
                K0: uint256 = 0
                _g1k0: uint256 = 0
                mul1: uint256 = 0
                mul2: uint256 = 0
                neg_fprime: uint256 = 0
                D_plus: uint256 = 0
                D_minus: uint256 = 0
                D_prev: uint256 = 0

                diff: uint256 = 0
                frac: uint256 = 0

                for i in range(255):

                    D_prev = D

                    # K0 = 10**18 * x[0] * N_COINS / D * x[1] * N_COINS / D * x[2] * N_COINS / D
                    K0 = unsafe_div(
                        unsafe_mul(
                            unsafe_mul(
                                unsafe_div(
                                    unsafe_mul(
                                        unsafe_mul(
                                            unsafe_div(
                                                unsafe_mul(
                                                    unsafe_mul(10**18, x[0]), N_COINS
                                                ),
                                                D,
                                            ),
                                            x[1],
                                        ),
                                        N_COINS,
                                    ),
                                    D,
                                ),
                                x[2],
                            ),
                            N_COINS,
                        ),
                        D,
                    )  # <-------- We can convert the entire expression using unsafe math.
                    #   since x_i is not too far from D, so overflow is not expected. Also
                    #      D > 0, since we proved that already. unsafe_div is safe. K0 > 0
                    #        since we can safely assume that D < 10**18 * x[0]. K0 is also
                    #                            in the range of 10**18 (it's a property).

                    _g1k0 = unsafe_add(gamma, 10**18)  # <--------- safe to do unsafe_add.

                    if _g1k0 > K0:  #       The following operations can safely be unsafe.
                        _g1k0 = unsafe_add(unsafe_sub(_g1k0, K0), 1)
                    else:
                        _g1k0 = unsafe_add(unsafe_sub(K0, _g1k0), 1)

                    # D / (A * N**N) * _g1k0**2 / gamma**2
                    # mul1 = 10**18 * D / gamma * _g1k0 / gamma * _g1k0 * A_MULTIPLIER / ANN
                    mul1 = unsafe_div(
                        unsafe_mul(
                            unsafe_mul(
                                unsafe_div(
                                    unsafe_mul(
                                        unsafe_div(unsafe_mul(10**18, D), gamma), _g1k0
                                    ),
                                    gamma,
                                ),
                                _g1k0,
                            ),
                            A_MULTIPLIER,
                        ),
                        ANN,
                    )  # <------ Since D > 0, gamma is small, _g1k0 is small, the rest are
                    #        non-zero and small constants, and D has a cap in this method,
                    #                    we can safely convert everything to unsafe maths.

                    # 2*N*K0 / _g1k0
                    # mul2 = (2 * 10**18) * N_COINS * K0 / _g1k0
                    mul2 = unsafe_div(
                        unsafe_mul(2 * 10**18 * N_COINS, K0), _g1k0
                    )  # <--------------- K0 is approximately around D, which has a cap of
                    #      10**15 * 10**18 + 1, since we get that in get_y which is called
                    #    with newton_D. _g1k0 > 0, so the entire expression can be unsafe.

                    # neg_fprime: uint256 = (S + S * mul2 / 10**18) + mul1 * N_COINS / K0 - mul2 * D / 10**18
                    neg_fprime = unsafe_sub(
                        unsafe_add(
                            unsafe_add(S, unsafe_div(unsafe_mul(S, mul2), 10**18)),
                            unsafe_div(unsafe_mul(mul1, N_COINS), K0),
                        ),
                        unsafe_div(unsafe_mul(mul2, D), 10**18),
                    )  # <--- mul1 is a big number but not huge: safe to unsafely multiply
                    # with N_coins. neg_fprime > 0 if this expression executes.
                    # mul2 is in the range of 10**18, since K0 is in that range, S * mul2
                    # is safe. The first three sums can be done using unsafe math safely
                    # and since the final expression will be small since mul2 is small, we
                    # can safely do the entire expression unsafely.

                    # D -= f / fprime
                    # D * (neg_fprime + S) / neg_fprime
                    D_plus = unsafe_div(D * unsafe_add(neg_fprime, S), neg_fprime)

                    # D*D / neg_fprime
                    D_minus = unsafe_div(D * D, neg_fprime)

                    # Since we know K0 > 0, and neg_fprime > 0, several unsafe operations
                    # are possible in the following. Also, (10**18 - K0) is safe to mul.
                    # So the only expressions we keep safe are (D_minus + ...) and (D * ...)
                    if 10**18 > K0:
                        # D_minus += D * (mul1 / neg_fprime) / 10**18 * (10**18 - K0) / K0
                        D_minus += unsafe_div(
                            unsafe_mul(
                                unsafe_div(D * unsafe_div(mul1, neg_fprime), 10**18),
                                unsafe_sub(10**18, K0),
                            ),
                            K0,
                        )
                    else:
                        # D_minus -= D * (mul1 / neg_fprime) / 10**18 * (K0 - 10**18) / K0
                        D_minus -= unsafe_div(
                            unsafe_mul(
                                unsafe_div(D * unsafe_div(mul1, neg_fprime), 10**18),
                                unsafe_sub(K0, 10**18),
                            ),
                            K0,
                        )

                    if D_plus > D_minus:
                        D = unsafe_sub(D_plus, D_minus)  # <--------- Safe since we check.
                    else:
                        D = unsafe_div(unsafe_sub(D_minus, D_plus), 2)

                    if D > D_prev:
                        diff = unsafe_sub(D, D_prev)
                    else:
                        diff = unsafe_sub(D_prev, D)

                    # Could reduce precision for gas efficiency here:
                    if unsafe_mul(diff, 10**14) < max(10**16, D):

                        # Test that we are safe with the next get_y
                        for _x in x:
                            frac = unsafe_div(unsafe_mul(_x, 10**18), D)
                            assert frac >= 10**16 - 1 and frac < 10**20 + 1, "Unsafe values x[i]"

                        return D
                raise "Did not converge"
            ```


    === "Example"

        ```shell
        >>> TriCrypto.add_liquidity('todo')
        ''
        ```


### `remove_liquidity`
!!! description "`TriCrypto.remove_liquidity(_amount: uint256, min_amounts: uint256[N_COINS], use_eth: bool = False, receiver: address = msg.sender, claim_admin_fees: bool = True) -> uint256[N_COINS]:`"

    Function to remove liquidity from the pool and burn the lp tokens. When removing liquidity with this function, no fees are charged as the coins are withdrawin in balanced proportions. If admin fees are claimed, they are claimed before withdrawing liquidity and therefore make sure the DAO gets paid first.

    Returns: withdrawn balances (`uint256[N_COINS]`).

    Emits: `RemoveLiquidity`

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_amount` |  `uint256[N_COINS]` | amount of lp tokens to burn |
    | `min_amounts` |  `uint256[N_COINS]` | minimum amounts of token to withdraw |
    | `use_eth` |  `bool` | True = withdraw ETH, False = withdraw wETH |
    | `receiver` |  `address` | receiver of the coins; defaults to msg.sender |
    | `claim_admin_fees` |  `bool` | whether to claim admin fees; defaults to True |

    ??? quote "Source code"

        ```python hl_lines="1"
        event RemoveLiquidity:
            provider: indexed(address)
            token_amounts: uint256[N_COINS]
            token_supply: uint256

        @external
        @nonreentrant("lock")
        def remove_liquidity(
            _amount: uint256,
            min_amounts: uint256[N_COINS],
            use_eth: bool = False,
            receiver: address = msg.sender,
            claim_admin_fees: bool = True,
        ) -> uint256[N_COINS]:
            """
            @notice This withdrawal method is very safe, does no complex math since
                    tokens are withdrawn in balanced proportions. No fees are charged.
            @param _amount Amount of LP tokens to burn
            @param min_amounts Minimum amounts of tokens to withdraw
            @param use_eth Whether to withdraw ETH or not
            @param receiver Address to send the withdrawn tokens to
            @param claim_admin_fees If True, call self._claim_admin_fees(). Default is True.
            @return uint256[3] Amount of pool tokens received by the `receiver`
            """
            amount: uint256 = _amount
            balances: uint256[N_COINS] = self.balances
            d_balances: uint256[N_COINS] = empty(uint256[N_COINS])

            if claim_admin_fees:
                self._claim_admin_fees()  # <------ We claim fees so that the DAO gets
                #         paid before withdrawal. In emergency cases, set it to False.

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

                    d_balances[i] = balances[i]
                    self.balances[i] = 0  # <------------------------- Empty the pool.

            else:  # <-------------------------------------------------------- Case 1.

                amount -= 1  # <---- To prevent rounding errors, favor LPs a tiny bit.

                for i in range(N_COINS):
                    d_balances[i] = balances[i] * amount / total_supply
                    assert d_balances[i] >= min_amounts[i]
                    self.balances[i] = balances[i] - d_balances[i]
                    balances[i] = d_balances[i]  # <-- Now it's the amounts going out.

            D: uint256 = self.D
            self.D = D - unsafe_div(D * amount, total_supply)  # <----------- Reduce D
            #      proportional to the amount of tokens leaving. Since withdrawals are
            #       balanced, this is a simple subtraction. If amount == total_supply,
            #                                                             D will be 0.

            # ---------------------------------- Transfers ---------------------------

            for i in range(N_COINS):
                self._transfer_out(coins[i], d_balances[i], use_eth, receiver)

            log RemoveLiquidity(msg.sender, balances, total_supply - _amount)

            return d_balances
        ```


    === "Example"

        ```shell
        >>> TriCrypto.remove_liquidity('todo')
        ''
        ```


### `remove_liquidity_one_coin`
!!! description "`TriCrypto.remove_liquidity_one_coin(token_amount: uint256, i: uint256, min_amount: uint256, use_eth: bool = False, receiver: address = msg.sender) -> uint256:`"

    Funtion to withdraw liquidity in a single token.

    Returns: amount of withdrawn coin (`uint256`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `token_amount` |  `uint256` | amount of lp tokens to burn |
    | `i` |  `uint256` | index of the token to withdraw |
    | `min_amount` |  `uint256` | minimum amount of token to withdraw |
    | `use_eth` |  `bool` | True = withdraw ETH, False = withdraw wETH |
    | `receiver` |  `address` | receiver of the coins; defaults to msg.sender |

    ??? quote "Source code"

        === "CurveTricryptoOptimizedWETH.vy"

            ```python hl_lines="1"
            @external
            @nonreentrant("lock")
            def remove_liquidity_one_coin(
                token_amount: uint256,
                i: uint256,
                min_amount: uint256,
                use_eth: bool = False,
                receiver: address = msg.sender
            ) -> uint256:
                """
                @notice Withdraw liquidity in a single token.
                        Involves fees (lower than swap fees).
                @dev This operation also involves an admin fee claim.
                @param token_amount Amount of LP tokens to burn
                @param i Index of the token to withdraw
                @param min_amount Minimum amount of token to withdraw.
                @param use_eth Whether to withdraw ETH or not
                @param receiver Address to send the withdrawn tokens to
                @return Amount of tokens at index i received by the `receiver`
                """

                A_gamma: uint256[2] = self._A_gamma()

                dy: uint256 = 0
                D: uint256 = 0
                p: uint256 = 0
                xp: uint256[N_COINS] = empty(uint256[N_COINS])
                approx_fee: uint256 = 0

                # ---------------------------- Claim admin fees before removing liquidity.
                self._claim_admin_fees()

                # ------------------------------------------------------------------------

                dy, D, xp, approx_fee = self._calc_withdraw_one_coin(
                    A_gamma,
                    token_amount,
                    i,
                    (self.future_A_gamma_time > block.timestamp),  # <------- During ramps
                )  #                                                  we need to update D.

                assert dy >= min_amount, "Slippage"

                # ------------------------- Transfers ------------------------------------

                self.balances[i] -= dy
                self.burnFrom(msg.sender, token_amount)
                self._transfer_out(coins[i], dy, use_eth, receiver)

                packed_price_scale: uint256 = self.tweak_price(A_gamma, xp, D, 0)
                #        Safe to use D from _calc_withdraw_one_coin here ---^

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
                precisions: uint256[N_COINS] = self._unpack(self.packed_precisions)
                xp: uint256[N_COINS] = precisions
                D0: uint256 = 0

                # -------------------------- Calculate D0 and xp -------------------------

                price_scale_i: uint256 = PRECISION * precisions[0]
                packed_prices: uint256 = self.price_scale_packed
                xp[0] *= xx[0]
                for k in range(1, N_COINS):
                    p: uint256 = (packed_prices & PRICE_MASK)
                    if i == k:
                        price_scale_i = p * xp[i]
                    xp[k] = unsafe_div(xp[k] * xx[k] * p, PRECISION)
                    packed_prices = packed_prices >> PRICE_SIZE

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
                fee: uint256 = self._unpack(self.packed_fee_params)[1]  # <- self.out_fee.

                if xp_correction < xp_imprecise[i]:
                    xp_imprecise[i] -= xp_correction
                    fee = self._fee(xp_imprecise)

                dD: uint256 = unsafe_div(token_amount * D, token_supply)
                D_fee: uint256 = fee * dD / (2 * 10**10) + 1  # <------- Actual fee on D.

                # --------- Calculate `approx_fee` (assuming balanced state) in ith token.
                # -------------------------------- We only need this for fee in the event.
                approx_fee: uint256 = N_COINS * D_fee * xx[i] / D

                # ------------------------------------------------------------------------
                D -= (dD - D_fee)  # <----------------------------------- Charge fee on D.
                # --------------------------------- Calculate `y_out`` with `(D - D_fee)`.
                y: uint256 = MATH.get_y(A_gamma[0], A_gamma[1], xp, D, i)[0]
                dy: uint256 = (xp[i] - y) * PRECISION / price_scale_i
                xp[i] = y

                return dy, D, xp, approx_fee
            ```

        === "Math.vy"

            ```python hl_lines="1"
            @external
            @view
            def newton_D(
                ANN: uint256,
                gamma: uint256,
                x_unsorted: uint256[N_COINS],
                K0_prev: uint256 = 0,
            ) -> uint256:
                """
                @notice Finding the invariant via newtons method using good initial guesses.
                @dev ANN is higher by the factor A_MULTIPLIER
                @dev ANN is already A * N**N
                @param ANN the A * N**N value
                @param gamma the gamma value
                @param x_unsorted the array of coin balances (not sorted)
                @param K0_prev apriori for newton's method derived from get_y_int. Defaults
                    to zero (no apriori)
                """
                x: uint256[N_COINS] = self._sort(x_unsorted)
                assert x[0] < max_value(uint256) / 10**18 * N_COINS**N_COINS  # dev: out of limits
                assert x[0] > 0  # dev: empty pool

                # Safe to do unsafe add since we checked largest x's bounds previously
                S: uint256 = unsafe_add(unsafe_add(x[0], x[1]), x[2])
                D: uint256 = 0

                if K0_prev == 0:
                    # Geometric mean of 3 numbers cannot be larger than the largest number
                    # so the following is safe to do:
                    D = unsafe_mul(N_COINS, self._geometric_mean(x))
                else:
                    if S > 10**36:
                        D = self._cbrt(
                            unsafe_div(
                                unsafe_div(x[0] * x[1], 10**36) * x[2],
                                K0_prev
                            ) * 27 * 10**12
                        )
                    elif S > 10**24:
                        D = self._cbrt(
                            unsafe_div(
                                unsafe_div(x[0] * x[1], 10**24) * x[2],
                                K0_prev
                            ) * 27 * 10**6
                        )
                    else:
                        D = self._cbrt(
                            unsafe_div(
                                unsafe_div(x[0] * x[1], 10**18) * x[2],
                                K0_prev
                            ) * 27
                        )

                    # D not zero here if K0_prev > 0, and we checked if x[0] is gt 0.

                # initialise variables:
                K0: uint256 = 0
                _g1k0: uint256 = 0
                mul1: uint256 = 0
                mul2: uint256 = 0
                neg_fprime: uint256 = 0
                D_plus: uint256 = 0
                D_minus: uint256 = 0
                D_prev: uint256 = 0

                diff: uint256 = 0
                frac: uint256 = 0

                for i in range(255):

                    D_prev = D

                    # K0 = 10**18 * x[0] * N_COINS / D * x[1] * N_COINS / D * x[2] * N_COINS / D
                    K0 = unsafe_div(
                        unsafe_mul(
                            unsafe_mul(
                                unsafe_div(
                                    unsafe_mul(
                                        unsafe_mul(
                                            unsafe_div(
                                                unsafe_mul(
                                                    unsafe_mul(10**18, x[0]), N_COINS
                                                ),
                                                D,
                                            ),
                                            x[1],
                                        ),
                                        N_COINS,
                                    ),
                                    D,
                                ),
                                x[2],
                            ),
                            N_COINS,
                        ),
                        D,
                    )  # <-------- We can convert the entire expression using unsafe math.
                    #   since x_i is not too far from D, so overflow is not expected. Also
                    #      D > 0, since we proved that already. unsafe_div is safe. K0 > 0
                    #        since we can safely assume that D < 10**18 * x[0]. K0 is also
                    #                            in the range of 10**18 (it's a property).

                    _g1k0 = unsafe_add(gamma, 10**18)  # <--------- safe to do unsafe_add.

                    if _g1k0 > K0:  #       The following operations can safely be unsafe.
                        _g1k0 = unsafe_add(unsafe_sub(_g1k0, K0), 1)
                    else:
                        _g1k0 = unsafe_add(unsafe_sub(K0, _g1k0), 1)

                    # D / (A * N**N) * _g1k0**2 / gamma**2
                    # mul1 = 10**18 * D / gamma * _g1k0 / gamma * _g1k0 * A_MULTIPLIER / ANN
                    mul1 = unsafe_div(
                        unsafe_mul(
                            unsafe_mul(
                                unsafe_div(
                                    unsafe_mul(
                                        unsafe_div(unsafe_mul(10**18, D), gamma), _g1k0
                                    ),
                                    gamma,
                                ),
                                _g1k0,
                            ),
                            A_MULTIPLIER,
                        ),
                        ANN,
                    )  # <------ Since D > 0, gamma is small, _g1k0 is small, the rest are
                    #        non-zero and small constants, and D has a cap in this method,
                    #                    we can safely convert everything to unsafe maths.

                    # 2*N*K0 / _g1k0
                    # mul2 = (2 * 10**18) * N_COINS * K0 / _g1k0
                    mul2 = unsafe_div(
                        unsafe_mul(2 * 10**18 * N_COINS, K0), _g1k0
                    )  # <--------------- K0 is approximately around D, which has a cap of
                    #      10**15 * 10**18 + 1, since we get that in get_y which is called
                    #    with newton_D. _g1k0 > 0, so the entire expression can be unsafe.

                    # neg_fprime: uint256 = (S + S * mul2 / 10**18) + mul1 * N_COINS / K0 - mul2 * D / 10**18
                    neg_fprime = unsafe_sub(
                        unsafe_add(
                            unsafe_add(S, unsafe_div(unsafe_mul(S, mul2), 10**18)),
                            unsafe_div(unsafe_mul(mul1, N_COINS), K0),
                        ),
                        unsafe_div(unsafe_mul(mul2, D), 10**18),
                    )  # <--- mul1 is a big number but not huge: safe to unsafely multiply
                    # with N_coins. neg_fprime > 0 if this expression executes.
                    # mul2 is in the range of 10**18, since K0 is in that range, S * mul2
                    # is safe. The first three sums can be done using unsafe math safely
                    # and since the final expression will be small since mul2 is small, we
                    # can safely do the entire expression unsafely.

                    # D -= f / fprime
                    # D * (neg_fprime + S) / neg_fprime
                    D_plus = unsafe_div(D * unsafe_add(neg_fprime, S), neg_fprime)

                    # D*D / neg_fprime
                    D_minus = unsafe_div(D * D, neg_fprime)

                    # Since we know K0 > 0, and neg_fprime > 0, several unsafe operations
                    # are possible in the following. Also, (10**18 - K0) is safe to mul.
                    # So the only expressions we keep safe are (D_minus + ...) and (D * ...)
                    if 10**18 > K0:
                        # D_minus += D * (mul1 / neg_fprime) / 10**18 * (10**18 - K0) / K0
                        D_minus += unsafe_div(
                            unsafe_mul(
                                unsafe_div(D * unsafe_div(mul1, neg_fprime), 10**18),
                                unsafe_sub(10**18, K0),
                            ),
                            K0,
                        )
                    else:
                        # D_minus -= D * (mul1 / neg_fprime) / 10**18 * (K0 - 10**18) / K0
                        D_minus -= unsafe_div(
                            unsafe_mul(
                                unsafe_div(D * unsafe_div(mul1, neg_fprime), 10**18),
                                unsafe_sub(K0, 10**18),
                            ),
                            K0,
                        )

                    if D_plus > D_minus:
                        D = unsafe_sub(D_plus, D_minus)  # <--------- Safe since we check.
                    else:
                        D = unsafe_div(unsafe_sub(D_minus, D_plus), 2)

                    if D > D_prev:
                        diff = unsafe_sub(D, D_prev)
                    else:
                        diff = unsafe_sub(D_prev, D)

                    # Could reduce precision for gas efficiency here:
                    if unsafe_mul(diff, 10**14) < max(10**16, D):

                        # Test that we are safe with the next get_y
                        for _x in x:
                            frac = unsafe_div(unsafe_mul(_x, 10**18), D)
                            assert frac >= 10**16 - 1 and frac < 10**20 + 1, "Unsafe values x[i]"

                        return D
                raise "Did not converge"

            @external
            @view
            def get_y(
                _ANN: uint256, _gamma: uint256, x: uint256[N_COINS], _D: uint256, i: uint256
            ) -> uint256[2]:
                """
                @notice Calculate x[i] given other balances x[0..N_COINS-1] and invariant D.
                @dev ANN = A * N**N.
                @param _ANN AMM.A() value.
                @param _gamma AMM.gamma() value.
                @param x Balances multiplied by prices and precisions of all coins.
                @param _D Invariant.
                @param i Index of coin to calculate y.
                """

                # Safety checks
                assert _ANN > MIN_A - 1 and _ANN < MAX_A + 1  # dev: unsafe values A
                assert _gamma > MIN_GAMMA - 1 and _gamma < MAX_GAMMA + 1  # dev: unsafe values gamma
                assert _D > 10**17 - 1 and _D < 10**15 * 10**18 + 1  # dev: unsafe values D

                frac: uint256 = 0
                for k in range(3):
                    if k != i:
                        frac = x[k] * 10**18 / _D
                        assert frac > 10**16 - 1 and frac < 10**20 + 1, "Unsafe values x[i]"
                        # if above conditions are met, x[k] > 0

                j: uint256 = 0
                k: uint256 = 0
                if i == 0:
                    j = 1
                    k = 2
                elif i == 1:
                    j = 0
                    k = 2
                elif i == 2:
                    j = 0
                    k = 1

                ANN: int256 = convert(_ANN, int256)
                gamma: int256 = convert(_gamma, int256)
                D: int256 = convert(_D, int256)
                x_j: int256 = convert(x[j], int256)
                x_k: int256 = convert(x[k], int256)
                gamma2: int256 = unsafe_mul(gamma, gamma)

                a: int256 = 10**36 / 27

                # 10**36/9 + 2*10**18*gamma/27 - D**2/x_j*gamma**2*ANN/27**2/convert(A_MULTIPLIER, int256)/x_k
                b: int256 = (
                    unsafe_add(
                        10**36 / 9,
                        unsafe_div(unsafe_mul(2 * 10**18, gamma), 27)
                    )
                    - unsafe_div(
                        unsafe_div(
                            unsafe_div(
                                unsafe_mul(
                                    unsafe_div(unsafe_mul(D, D), x_j),
                                    gamma2
                                ) * ANN,
                                27**2
                            ),
                            convert(A_MULTIPLIER, int256)
                        ),
                        x_k,
                    )
                )  # <------- The first two expressions can be unsafe, and unsafely added.

                # 10**36/9 + gamma*(gamma + 4*10**18)/27 + gamma**2*(x_j+x_k-D)/D*ANN/27/convert(A_MULTIPLIER, int256)
                c: int256 = (
                    unsafe_add(
                        10**36 / 9,
                        unsafe_div(unsafe_mul(gamma, unsafe_add(gamma, 4 * 10**18)), 27)
                    )
                    + unsafe_div(
                        unsafe_div(
                            unsafe_mul(
                                unsafe_div(gamma2 * unsafe_sub(unsafe_add(x_j, x_k), D), D),
                                ANN
                            ),
                            27
                        ),
                        convert(A_MULTIPLIER, int256),
                    )
                )  # <--------- Same as above with the first two expressions. In the third
                #   expression, x_j + x_k will not overflow since we know their range from
                #                                              previous assert statements.

                # (10**18 + gamma)**2/27
                d: int256 = unsafe_div(unsafe_add(10**18, gamma)**2, 27)

                # abs(3*a*c/b - b)
                d0: int256 = abs(unsafe_mul(3, a) * c / b - b)  # <------------ a is smol.

                divider: int256 = 0
                if d0 > 10**48:
                    divider = 10**30
                elif d0 > 10**44:
                    divider = 10**26
                elif d0 > 10**40:
                    divider = 10**22
                elif d0 > 10**36:
                    divider = 10**18
                elif d0 > 10**32:
                    divider = 10**14
                elif d0 > 10**28:
                    divider = 10**10
                elif d0 > 10**24:
                    divider = 10**6
                elif d0 > 10**20:
                    divider = 10**2
                else:
                    divider = 1

                additional_prec: int256 = 0
                if abs(a) > abs(b):
                    additional_prec = abs(unsafe_div(a, b))
                    a = unsafe_div(unsafe_mul(a, additional_prec), divider)
                    b = unsafe_div(b * additional_prec, divider)
                    c = unsafe_div(c * additional_prec, divider)
                    d = unsafe_div(d * additional_prec, divider)
                else:
                    additional_prec = abs(unsafe_div(b, a))
                    a = unsafe_div(a / additional_prec, divider)
                    b = unsafe_div(unsafe_div(b, additional_prec), divider)
                    c = unsafe_div(unsafe_div(c, additional_prec), divider)
                    d = unsafe_div(unsafe_div(d, additional_prec), divider)

                # 3*a*c/b - b
                _3ac: int256 = unsafe_mul(3, a) * c
                delta0: int256 = unsafe_div(_3ac, b) - b

                # 9*a*c/b - 2*b - 27*a**2/b*d/b
                delta1: int256 = (
                    unsafe_div(3 * _3ac, b)
                    - unsafe_mul(2, b)
                    - unsafe_div(unsafe_div(27 * a**2, b) * d, b)
                )

                # delta1**2 + 4*delta0**2/b*delta0
                sqrt_arg: int256 = (
                    delta1**2 +
                    unsafe_div(4 * delta0**2, b) * delta0
                )

                sqrt_val: int256 = 0
                if sqrt_arg > 0:
                    sqrt_val = convert(isqrt(convert(sqrt_arg, uint256)), int256)
                else:
                    return [self._newton_y(_ANN, _gamma, x, _D, i), 0]

                b_cbrt: int256 = 0
                if b >= 0:
                    b_cbrt = convert(self._cbrt(convert(b, uint256)), int256)
                else:
                    b_cbrt = -convert(self._cbrt(convert(-b, uint256)), int256)

                second_cbrt: int256 = 0
                if delta1 > 0:
                    # convert(self._cbrt(convert((delta1 + sqrt_val), uint256)/2), int256)
                    second_cbrt = convert(
                        self._cbrt(unsafe_div(convert(delta1 + sqrt_val, uint256), 2)),
                        int256
                    )
                else:
                    second_cbrt = -convert(
                        self._cbrt(unsafe_div(convert(-(delta1 - sqrt_val), uint256), 2)),
                        int256
                    )

                # b_cbrt*b_cbrt/10**18*second_cbrt/10**18
                C1: int256 = unsafe_div(
                    unsafe_div(b_cbrt * b_cbrt, 10**18) * second_cbrt,
                    10**18
                )

                # (b + b*delta0/C1 - C1)/3
                root_K0: int256 = unsafe_div(b + b * delta0 / C1 - C1, 3)

                # D*D/27/x_k*D/x_j*root_K0/a
                root: int256 = unsafe_div(
                    unsafe_div(
                        unsafe_div(unsafe_div(D * D, 27), x_k) * D,
                        x_j
                    ) * root_K0,
                    a
                )

                out: uint256[2] = [
                    convert(root, uint256),
                    convert(unsafe_div(10**18 * root_K0, a), uint256)
                ]

                frac = unsafe_div(out[0] * 10**18, _D)
                assert frac >= 10**16 - 1 and frac < 10**20 + 1,  "Unsafe value for y"
                # due to precision issues, get_y can be off by 2 wei or so wrt _newton_y

                return out
            ```


    === "Example"

        ```shell
        >>> TriCrypto.remove_liquidity_one_coin('todo')
        ''
        ```


### `calc_withdraw_one_coin`
!!! description "`TriCrypto.calc_withdraw_one_coin(token_amount: uint256, i: uint256) -> uint256:`"

    Function to calculate the amount of output token `i` when burning `token_amount` of lp tokens, taking fees into condsideration.

    Returns: amount of token received (`uint256`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `token_amount` |  `uint256` | amount of lp tokens burned |
    | `i` |  `uint256` | index of the coin to withdraw |

    ??? quote "Source code"

        === "CurveTricryptoOptimizedWETH.vy"

            ```python hl_lines="1"
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
                precisions: uint256[N_COINS] = self._unpack(self.packed_precisions)
                xp: uint256[N_COINS] = precisions
                D0: uint256 = 0

                # -------------------------- Calculate D0 and xp -------------------------

                price_scale_i: uint256 = PRECISION * precisions[0]
                packed_prices: uint256 = self.price_scale_packed
                xp[0] *= xx[0]
                for k in range(1, N_COINS):
                    p: uint256 = (packed_prices & PRICE_MASK)
                    if i == k:
                        price_scale_i = p * xp[i]
                    xp[k] = unsafe_div(xp[k] * xx[k] * p, PRECISION)
                    packed_prices = packed_prices >> PRICE_SIZE

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
                fee: uint256 = self._unpack(self.packed_fee_params)[1]  # <- self.out_fee.

                if xp_correction < xp_imprecise[i]:
                    xp_imprecise[i] -= xp_correction
                    fee = self._fee(xp_imprecise)

                dD: uint256 = unsafe_div(token_amount * D, token_supply)
                D_fee: uint256 = fee * dD / (2 * 10**10) + 1  # <------- Actual fee on D.

                # --------- Calculate `approx_fee` (assuming balanced state) in ith token.
                # -------------------------------- We only need this for fee in the event.
                approx_fee: uint256 = N_COINS * D_fee * xx[i] / D

                # ------------------------------------------------------------------------
                D -= (dD - D_fee)  # <----------------------------------- Charge fee on D.
                # --------------------------------- Calculate `y_out`` with `(D - D_fee)`.
                y: uint256 = MATH.get_y(A_gamma[0], A_gamma[1], xp, D, i)[0]
                dy: uint256 = (xp[i] - y) * PRECISION / price_scale_i
                xp[i] = y

                return dy, D, xp, approx_fee
            ```

        === "Math.vy"

            ```python hl_lines="1"
            @external
            @view
            def newton_D(
                ANN: uint256,
                gamma: uint256,
                x_unsorted: uint256[N_COINS],
                K0_prev: uint256 = 0,
            ) -> uint256:
                """
                @notice Finding the invariant via newtons method using good initial guesses.
                @dev ANN is higher by the factor A_MULTIPLIER
                @dev ANN is already A * N**N
                @param ANN the A * N**N value
                @param gamma the gamma value
                @param x_unsorted the array of coin balances (not sorted)
                @param K0_prev apriori for newton's method derived from get_y_int. Defaults
                    to zero (no apriori)
                """
                x: uint256[N_COINS] = self._sort(x_unsorted)
                assert x[0] < max_value(uint256) / 10**18 * N_COINS**N_COINS  # dev: out of limits
                assert x[0] > 0  # dev: empty pool

                # Safe to do unsafe add since we checked largest x's bounds previously
                S: uint256 = unsafe_add(unsafe_add(x[0], x[1]), x[2])
                D: uint256 = 0

                if K0_prev == 0:
                    # Geometric mean of 3 numbers cannot be larger than the largest number
                    # so the following is safe to do:
                    D = unsafe_mul(N_COINS, self._geometric_mean(x))
                else:
                    if S > 10**36:
                        D = self._cbrt(
                            unsafe_div(
                                unsafe_div(x[0] * x[1], 10**36) * x[2],
                                K0_prev
                            ) * 27 * 10**12
                        )
                    elif S > 10**24:
                        D = self._cbrt(
                            unsafe_div(
                                unsafe_div(x[0] * x[1], 10**24) * x[2],
                                K0_prev
                            ) * 27 * 10**6
                        )
                    else:
                        D = self._cbrt(
                            unsafe_div(
                                unsafe_div(x[0] * x[1], 10**18) * x[2],
                                K0_prev
                            ) * 27
                        )

                    # D not zero here if K0_prev > 0, and we checked if x[0] is gt 0.

                # initialise variables:
                K0: uint256 = 0
                _g1k0: uint256 = 0
                mul1: uint256 = 0
                mul2: uint256 = 0
                neg_fprime: uint256 = 0
                D_plus: uint256 = 0
                D_minus: uint256 = 0
                D_prev: uint256 = 0

                diff: uint256 = 0
                frac: uint256 = 0

                for i in range(255):

                    D_prev = D

                    # K0 = 10**18 * x[0] * N_COINS / D * x[1] * N_COINS / D * x[2] * N_COINS / D
                    K0 = unsafe_div(
                        unsafe_mul(
                            unsafe_mul(
                                unsafe_div(
                                    unsafe_mul(
                                        unsafe_mul(
                                            unsafe_div(
                                                unsafe_mul(
                                                    unsafe_mul(10**18, x[0]), N_COINS
                                                ),
                                                D,
                                            ),
                                            x[1],
                                        ),
                                        N_COINS,
                                    ),
                                    D,
                                ),
                                x[2],
                            ),
                            N_COINS,
                        ),
                        D,
                    )  # <-------- We can convert the entire expression using unsafe math.
                    #   since x_i is not too far from D, so overflow is not expected. Also
                    #      D > 0, since we proved that already. unsafe_div is safe. K0 > 0
                    #        since we can safely assume that D < 10**18 * x[0]. K0 is also
                    #                            in the range of 10**18 (it's a property).

                    _g1k0 = unsafe_add(gamma, 10**18)  # <--------- safe to do unsafe_add.

                    if _g1k0 > K0:  #       The following operations can safely be unsafe.
                        _g1k0 = unsafe_add(unsafe_sub(_g1k0, K0), 1)
                    else:
                        _g1k0 = unsafe_add(unsafe_sub(K0, _g1k0), 1)

                    # D / (A * N**N) * _g1k0**2 / gamma**2
                    # mul1 = 10**18 * D / gamma * _g1k0 / gamma * _g1k0 * A_MULTIPLIER / ANN
                    mul1 = unsafe_div(
                        unsafe_mul(
                            unsafe_mul(
                                unsafe_div(
                                    unsafe_mul(
                                        unsafe_div(unsafe_mul(10**18, D), gamma), _g1k0
                                    ),
                                    gamma,
                                ),
                                _g1k0,
                            ),
                            A_MULTIPLIER,
                        ),
                        ANN,
                    )  # <------ Since D > 0, gamma is small, _g1k0 is small, the rest are
                    #        non-zero and small constants, and D has a cap in this method,
                    #                    we can safely convert everything to unsafe maths.

                    # 2*N*K0 / _g1k0
                    # mul2 = (2 * 10**18) * N_COINS * K0 / _g1k0
                    mul2 = unsafe_div(
                        unsafe_mul(2 * 10**18 * N_COINS, K0), _g1k0
                    )  # <--------------- K0 is approximately around D, which has a cap of
                    #      10**15 * 10**18 + 1, since we get that in get_y which is called
                    #    with newton_D. _g1k0 > 0, so the entire expression can be unsafe.

                    # neg_fprime: uint256 = (S + S * mul2 / 10**18) + mul1 * N_COINS / K0 - mul2 * D / 10**18
                    neg_fprime = unsafe_sub(
                        unsafe_add(
                            unsafe_add(S, unsafe_div(unsafe_mul(S, mul2), 10**18)),
                            unsafe_div(unsafe_mul(mul1, N_COINS), K0),
                        ),
                        unsafe_div(unsafe_mul(mul2, D), 10**18),
                    )  # <--- mul1 is a big number but not huge: safe to unsafely multiply
                    # with N_coins. neg_fprime > 0 if this expression executes.
                    # mul2 is in the range of 10**18, since K0 is in that range, S * mul2
                    # is safe. The first three sums can be done using unsafe math safely
                    # and since the final expression will be small since mul2 is small, we
                    # can safely do the entire expression unsafely.

                    # D -= f / fprime
                    # D * (neg_fprime + S) / neg_fprime
                    D_plus = unsafe_div(D * unsafe_add(neg_fprime, S), neg_fprime)

                    # D*D / neg_fprime
                    D_minus = unsafe_div(D * D, neg_fprime)

                    # Since we know K0 > 0, and neg_fprime > 0, several unsafe operations
                    # are possible in the following. Also, (10**18 - K0) is safe to mul.
                    # So the only expressions we keep safe are (D_minus + ...) and (D * ...)
                    if 10**18 > K0:
                        # D_minus += D * (mul1 / neg_fprime) / 10**18 * (10**18 - K0) / K0
                        D_minus += unsafe_div(
                            unsafe_mul(
                                unsafe_div(D * unsafe_div(mul1, neg_fprime), 10**18),
                                unsafe_sub(10**18, K0),
                            ),
                            K0,
                        )
                    else:
                        # D_minus -= D * (mul1 / neg_fprime) / 10**18 * (K0 - 10**18) / K0
                        D_minus -= unsafe_div(
                            unsafe_mul(
                                unsafe_div(D * unsafe_div(mul1, neg_fprime), 10**18),
                                unsafe_sub(K0, 10**18),
                            ),
                            K0,
                        )

                    if D_plus > D_minus:
                        D = unsafe_sub(D_plus, D_minus)  # <--------- Safe since we check.
                    else:
                        D = unsafe_div(unsafe_sub(D_minus, D_plus), 2)

                    if D > D_prev:
                        diff = unsafe_sub(D, D_prev)
                    else:
                        diff = unsafe_sub(D_prev, D)

                    # Could reduce precision for gas efficiency here:
                    if unsafe_mul(diff, 10**14) < max(10**16, D):

                        # Test that we are safe with the next get_y
                        for _x in x:
                            frac = unsafe_div(unsafe_mul(_x, 10**18), D)
                            assert frac >= 10**16 - 1 and frac < 10**20 + 1, "Unsafe values x[i]"

                        return D
                raise "Did not converge"

            @external
            @view
            def get_y(
                _ANN: uint256, _gamma: uint256, x: uint256[N_COINS], _D: uint256, i: uint256
            ) -> uint256[2]:
                """
                @notice Calculate x[i] given other balances x[0..N_COINS-1] and invariant D.
                @dev ANN = A * N**N.
                @param _ANN AMM.A() value.
                @param _gamma AMM.gamma() value.
                @param x Balances multiplied by prices and precisions of all coins.
                @param _D Invariant.
                @param i Index of coin to calculate y.
                """

                # Safety checks
                assert _ANN > MIN_A - 1 and _ANN < MAX_A + 1  # dev: unsafe values A
                assert _gamma > MIN_GAMMA - 1 and _gamma < MAX_GAMMA + 1  # dev: unsafe values gamma
                assert _D > 10**17 - 1 and _D < 10**15 * 10**18 + 1  # dev: unsafe values D

                frac: uint256 = 0
                for k in range(3):
                    if k != i:
                        frac = x[k] * 10**18 / _D
                        assert frac > 10**16 - 1 and frac < 10**20 + 1, "Unsafe values x[i]"
                        # if above conditions are met, x[k] > 0

                j: uint256 = 0
                k: uint256 = 0
                if i == 0:
                    j = 1
                    k = 2
                elif i == 1:
                    j = 0
                    k = 2
                elif i == 2:
                    j = 0
                    k = 1

                ANN: int256 = convert(_ANN, int256)
                gamma: int256 = convert(_gamma, int256)
                D: int256 = convert(_D, int256)
                x_j: int256 = convert(x[j], int256)
                x_k: int256 = convert(x[k], int256)
                gamma2: int256 = unsafe_mul(gamma, gamma)

                a: int256 = 10**36 / 27

                # 10**36/9 + 2*10**18*gamma/27 - D**2/x_j*gamma**2*ANN/27**2/convert(A_MULTIPLIER, int256)/x_k
                b: int256 = (
                    unsafe_add(
                        10**36 / 9,
                        unsafe_div(unsafe_mul(2 * 10**18, gamma), 27)
                    )
                    - unsafe_div(
                        unsafe_div(
                            unsafe_div(
                                unsafe_mul(
                                    unsafe_div(unsafe_mul(D, D), x_j),
                                    gamma2
                                ) * ANN,
                                27**2
                            ),
                            convert(A_MULTIPLIER, int256)
                        ),
                        x_k,
                    )
                )  # <------- The first two expressions can be unsafe, and unsafely added.

                # 10**36/9 + gamma*(gamma + 4*10**18)/27 + gamma**2*(x_j+x_k-D)/D*ANN/27/convert(A_MULTIPLIER, int256)
                c: int256 = (
                    unsafe_add(
                        10**36 / 9,
                        unsafe_div(unsafe_mul(gamma, unsafe_add(gamma, 4 * 10**18)), 27)
                    )
                    + unsafe_div(
                        unsafe_div(
                            unsafe_mul(
                                unsafe_div(gamma2 * unsafe_sub(unsafe_add(x_j, x_k), D), D),
                                ANN
                            ),
                            27
                        ),
                        convert(A_MULTIPLIER, int256),
                    )
                )  # <--------- Same as above with the first two expressions. In the third
                #   expression, x_j + x_k will not overflow since we know their range from
                #                                              previous assert statements.

                # (10**18 + gamma)**2/27
                d: int256 = unsafe_div(unsafe_add(10**18, gamma)**2, 27)

                # abs(3*a*c/b - b)
                d0: int256 = abs(unsafe_mul(3, a) * c / b - b)  # <------------ a is smol.

                divider: int256 = 0
                if d0 > 10**48:
                    divider = 10**30
                elif d0 > 10**44:
                    divider = 10**26
                elif d0 > 10**40:
                    divider = 10**22
                elif d0 > 10**36:
                    divider = 10**18
                elif d0 > 10**32:
                    divider = 10**14
                elif d0 > 10**28:
                    divider = 10**10
                elif d0 > 10**24:
                    divider = 10**6
                elif d0 > 10**20:
                    divider = 10**2
                else:
                    divider = 1

                additional_prec: int256 = 0
                if abs(a) > abs(b):
                    additional_prec = abs(unsafe_div(a, b))
                    a = unsafe_div(unsafe_mul(a, additional_prec), divider)
                    b = unsafe_div(b * additional_prec, divider)
                    c = unsafe_div(c * additional_prec, divider)
                    d = unsafe_div(d * additional_prec, divider)
                else:
                    additional_prec = abs(unsafe_div(b, a))
                    a = unsafe_div(a / additional_prec, divider)
                    b = unsafe_div(unsafe_div(b, additional_prec), divider)
                    c = unsafe_div(unsafe_div(c, additional_prec), divider)
                    d = unsafe_div(unsafe_div(d, additional_prec), divider)

                # 3*a*c/b - b
                _3ac: int256 = unsafe_mul(3, a) * c
                delta0: int256 = unsafe_div(_3ac, b) - b

                # 9*a*c/b - 2*b - 27*a**2/b*d/b
                delta1: int256 = (
                    unsafe_div(3 * _3ac, b)
                    - unsafe_mul(2, b)
                    - unsafe_div(unsafe_div(27 * a**2, b) * d, b)
                )

                # delta1**2 + 4*delta0**2/b*delta0
                sqrt_arg: int256 = (
                    delta1**2 +
                    unsafe_div(4 * delta0**2, b) * delta0
                )

                sqrt_val: int256 = 0
                if sqrt_arg > 0:
                    sqrt_val = convert(isqrt(convert(sqrt_arg, uint256)), int256)
                else:
                    return [self._newton_y(_ANN, _gamma, x, _D, i), 0]

                b_cbrt: int256 = 0
                if b >= 0:
                    b_cbrt = convert(self._cbrt(convert(b, uint256)), int256)
                else:
                    b_cbrt = -convert(self._cbrt(convert(-b, uint256)), int256)

                second_cbrt: int256 = 0
                if delta1 > 0:
                    # convert(self._cbrt(convert((delta1 + sqrt_val), uint256)/2), int256)
                    second_cbrt = convert(
                        self._cbrt(unsafe_div(convert(delta1 + sqrt_val, uint256), 2)),
                        int256
                    )
                else:
                    second_cbrt = -convert(
                        self._cbrt(unsafe_div(convert(-(delta1 - sqrt_val), uint256), 2)),
                        int256
                    )

                # b_cbrt*b_cbrt/10**18*second_cbrt/10**18
                C1: int256 = unsafe_div(
                    unsafe_div(b_cbrt * b_cbrt, 10**18) * second_cbrt,
                    10**18
                )

                # (b + b*delta0/C1 - C1)/3
                root_K0: int256 = unsafe_div(b + b * delta0 / C1 - C1, 3)

                # D*D/27/x_k*D/x_j*root_K0/a
                root: int256 = unsafe_div(
                    unsafe_div(
                        unsafe_div(unsafe_div(D * D, 27), x_k) * D,
                        x_j
                    ) * root_K0,
                    a
                )

                out: uint256[2] = [
                    convert(root, uint256),
                    convert(unsafe_div(10**18 * root_K0, a), uint256)
                ]

                frac = unsafe_div(out[0] * 10**18, _D)
                assert frac >= 10**16 - 1 and frac < 10**20 + 1,  "Unsafe value for y"
                # due to precision issues, get_y can be off by 2 wei or so wrt _newton_y

                return out
            ```


    === "Example"

        ```shell
        >>> TriCrypto.calc_withdraw_one_coin(1000000000000000000, 0)
        1071872163
        ```



## **Fee Methods**

### `fee`
!!! description "`TriCrypto.fee() -> uint256:`"

    Getter for the fee charged by the pool at the current state.

    Returns: fee (`uint256`).

    ??? quote "Source code"

        === "CurveTricryptoOptimizedWETH.vy"

            ```python hl_lines="1"
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
                return self._fee(self.xp())

            @internal
            @view
            def _fee(xp: uint256[N_COINS]) -> uint256:
                fee_params: uint256[3] = self._unpack(self.packed_fee_params)
                f: uint256 = MATH.reduction_coefficient(xp, fee_params[2])
                return unsafe_div(
                    fee_params[0] * f + fee_params[1] * (10**18 - f),
                    10**18
                )

            @internal
            @view
            def _unpack(_packed: uint256) -> uint256[3]:
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

        === "Math.vy"

            ```python hl_lines="1"
            @external
            @view
            def reduction_coefficient(x: uint256[N_COINS], fee_gamma: uint256) -> uint256:
                """
                @notice Calculates the reduction coefficient for the given x and fee_gamma
                @dev This method is used for calculating fees.
                @param x The x values
                @param fee_gamma The fee gamma value
                """
                return self._reduction_coefficient(x, fee_gamma)

            @internal
            @pure
            def _reduction_coefficient(x: uint256[N_COINS], fee_gamma: uint256) -> uint256:

                # fee_gamma / (fee_gamma + (1 - K))
                # where
                # K = prod(x) / (sum(x) / N)**N
                # (all normalized to 1e18)

                S: uint256 = x[0] + x[1] + x[2]

                # Could be good to pre-sort x, but it is used only for dynamic fee
                K: uint256 = 10**18 * N_COINS * x[0] / S
                K = unsafe_div(K * N_COINS * x[1], S)  # <- unsafe div is safu.
                K = unsafe_div(K * N_COINS * x[2], S)

                if fee_gamma > 0:
                    K = fee_gamma * 10**18 / (fee_gamma + 10**18 - K)

                return K
            ```

    === "Example"

        ```shell
        >>> TriCrypto.fee()
        3771992
        ```


### `mid_fee`
!!! description "`TriCrypto.mid_fee() -> uint256:`"

    Getter for the current mid fee.

    Returns: mid fee (`uint256`).

    ??? quote "Source code"

        ```python hl_lines="1"
        packed_fee_params: public(uint256)  # <---- Packs mid_fee, out_fee, fee_gamma.

        @view
        @external
        def mid_fee() -> uint256:
            """
            @notice Returns the current mid fee
            @return uint256 mid_fee value.
            """
            return self._unpack(self.packed_fee_params)[0]
        ```

    === "Example"

        ```shell
        >>> TriCrypto.mid_fee()
        3000000
        ```



### `out_fee`
!!! description "`TriCrypto.out_fee() -> uint256:`"

    Function to calculate the fee on `amounts` when adding liquidity. 

    Returns: out fee (`uint256`).

    ??? quote "Source code"

        ```python hl_lines="1"
        packed_fee_params: public(uint256)  # <---- Packs mid_fee, out_fee, fee_gamma.

        @view
        @external
        def out_fee() -> uint256:
            """
            @notice Returns the current out fee
            @return uint256 out_fee value.
            """
            return self._unpack(self.packed_fee_params)[1]
        ```

    === "Example"

        ```shell
        >>> TriCrypto.out_fee()
        30000000
        ```


### `fee_gamma`
!!! description "`TriCrypto.fee_gamma() -> uint256:`"

    Getter for the current fee gamma.

    Returns: fee gamma (`uint256`).

    ??? quote "Source code"

        ```python hl_lines="1"
        packed_fee_params: public(uint256)  # <---- Packs mid_fee, out_fee, fee_gamma.

        @view
        @external
        def fee_gamma() -> uint256:
            """
            @notice Returns the current fee gamma
            @return uint256 fee_gamma value.
            """
            return self._unpack(self.packed_fee_params)[2]
        ```

    === "Example"

        ```shell
        >>> TriCrypto.fee_gamma()
        500000000000000
        ```


### `fee_receiver`
!!! description "`TriCrypto.fee_receiver() -> address: view`"

    Getter for the fee receiver of the admin fees.

    Returns: current fee receiver (`address`).

    ??? quote "Source code"

        ```python hl_lines="1 3 8 13"
        interface Factory:
            def admin() -> address: view
            def fee_receiver() -> address: view
            def views_implementation() -> address: view

        @external
        @view
        def fee_receiver() -> address:
            """
            @notice Returns the address of the admin fee receiver.
            @return address Fee receiver.
            """
            return Factory(self.factory).fee_receiver()
        ```

    === "Example"

        ```shell
        >>> TriCrypto.fee_receiver()
        '0xeCb456EA5365865EbAb8a2661B0c503410e9B347'
        ```


### `calc_token_fee`
!!! description "`TriCrypto.calc_token_fee(amounts: uint256[N_COINS], xp: uint256[N_COINS]) -> uint256:`"

    Function to calculate the fee on `amounts` when adding liquidity. 

    Returns: fee (`uint256`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `amounts` |  `uint256[N_COINS]` | Amount of coins added to the pool |
    | `xp` |  `uint256[N_COINS]` | Current balances of the pool (multiplied by coin precision) |

    ??? quote "Source code"

        ```python hl_lines="1"
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
        >>> TriCrypto.calc_token_fee()
        'todo'
        ```


### `fee_calc`
!!! description "`TriCrypto.fee_calc(xp: uint256[N_COINS]) -> uint256: view`"

    Getter for the charged fee by the pool at the current state based on the pools balances.

    Returns: charged fee (`uint256`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `xp` |  `uint256[N_COINS]` | Balances of pool multiplied by the coin precision |

    ??? quote "Source code"

        === "CurveTricryptoOptimizedWETH.vy"

            ```python hl_lines="1"
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
                fee_params: uint256[3] = self._unpack(self.packed_fee_params)
                f: uint256 = MATH.reduction_coefficient(xp, fee_params[2])
                return unsafe_div(
                    fee_params[0] * f + fee_params[1] * (10**18 - f),
                    10**18
                )
            ```

        === "Math.vy"

            ```python hl_lines="1"
            @external
            @view
            def reduction_coefficient(x: uint256[N_COINS], fee_gamma: uint256) -> uint256:
                """
                @notice Calculates the reduction coefficient for the given x and fee_gamma
                @dev This method is used for calculating fees.
                @param x The x values
                @param fee_gamma The fee gamma value
                """
                return self._reduction_coefficient(x, fee_gamma)

            @internal
            @pure
            def _reduction_coefficient(x: uint256[N_COINS], fee_gamma: uint256) -> uint256:

                # fee_gamma / (fee_gamma + (1 - K))
                # where
                # K = prod(x) / (sum(x) / N)**N
                # (all normalized to 1e18)

                S: uint256 = x[0] + x[1] + x[2]

                # Could be good to pre-sort x, but it is used only for dynamic fee
                K: uint256 = 10**18 * N_COINS * x[0] / S
                K = unsafe_div(K * N_COINS * x[1], S)  # <- unsafe div is safu.
                K = unsafe_div(K * N_COINS * x[2], S)

                if fee_gamma > 0:
                    K = fee_gamma * 10**18 / (fee_gamma + 10**18 - K)

                return K
            ```


    === "Example"

        ```shell
        >>> TriCrypto.fee_calc('todo')
        ''
        ```


### `allowed_extra_profit` (x)
!!! description "`TriCrypto.allowed_extra_profit() -> uint256:`"

    Getter for the current allowed extra profit. what does this do? 

    Returns: allowed extra profit (`uint256`).

    ??? quote "Source code"

        ```python hl_lines="1"
        packed_rebalancing_params: public(uint256)  # <---------- Contains rebalancing
        #               parameters allowed_extra_profit, adjustment_step, and ma_time.

        @view
        @external
        def allowed_extra_profit() -> uint256:
            """
            @notice Returns the current allowed extra profit
            @return uint256 allowed_extra_profit value.
            """
            return self._unpack(self.packed_rebalancing_params)[0]
        ```

    === "Example"

        ```shell
        >>> TriCrypto.allowed_extra_profit()
        2000000000000
        ```


### `xcp_profit` (x)
!!! description "`TriCrypto.xcp_profit() -> uint256:`"

    todo

    Returns: 

    ??? quote "Source code"

        ```python hl_lines="1"
        xcp_profit: public(uint256)
        ```

    === "Example"

        ```shell
        >>> TriCrypto.xcp_profit()
        1003213938530958270
        ```


### `xcp_profit_a` (x)
!!! description "`TriCrypto.xcp_profit_a() -> uint256:`"

    todo. This is the full profit at the last claim of admin fees.

    Returns:

    ??? quote "Source code"

        ```python hl_lines="1"
        xcp_profit_a: public(uint256)  # <--- Full profit at last claim of admin fees.
        ```

    === "Example"

        ```shell
        >>> TriCrypto.xcp_profit_a()
        1003211094190051384
        ```






### `ADMIN_FEE`
!!! description "`TriCrypto.ADMIN_FEE() -> uint256: view`"

    Getter for the admin fee of the pool. 

    Returns: admin fee (`uint256`).

    !!!note
        `ADMIN_FEE` is a constant variable, therefore it cannot be changed.

    ??? quote "Source code"

        ```python hl_lines="1"
        ADMIN_FEE: public(constant(uint256)) = 5 * 10**9  # <----- 50% of earned fees.        ```
        ```

    === "Example"

        ```shell
        >>> TriCrypto.ADMIN_FEE()
        5000000000
        ```


### `claim_admin_fees`
!!! description "`CryptoSwap.claim_admin_fees() -> uint256:`"

    Function to claim the accumulated admin fees from the pool.

    Emits: `ClaimAdminFee`

    ??? quote "Source code"

        ```python hl_lines="1"
        interface Factory:
            def admin() -> address: view
            def fee_receiver() -> address: view
            def views_implementation() -> address: view

        event ClaimAdminFee:
            admin: indexed(address)
            tokens: uint256

        @external
        @nonreentrant("lock")
        def claim_admin_fees():
            """
            @notice Claim admin fees. Callable by anyone.
            """
            self._claim_admin_fees()

        @internal
        def _claim_admin_fees():
            """
            @notice Claims admin fees and sends it to fee_receiver set in the factory.
            """
            A_gamma: uint256[2] = self._A_gamma()

            xcp_profit: uint256 = self.xcp_profit  # <---------- Current pool profits.
            xcp_profit_a: uint256 = self.xcp_profit_a  # <- Profits at previous claim.
            total_supply: uint256 = self.totalSupply

            # Do not claim admin fees if:
            # 1. insufficient profits accrued since last claim, and
            # 2. there are less than 10**18 (or 1 unit of) lp tokens, else it can lead
            #    to manipulated virtual prices.
            if xcp_profit <= xcp_profit_a or total_supply < 10**18:
                return

            #      Claim tokens belonging to the admin here. This is done by 'gulping'
            #       pool tokens that have accrued as fees, but not accounted in pool's
            #         `self.balances` yet: pool balances only account for incoming and
            #                  outgoing tokens excluding fees. Following 'gulps' fees:

            for i in range(N_COINS):
                if coins[i] == WETH20:
                    self.balances[i] = self.balance
                else:
                    self.balances[i] = ERC20(coins[i]).balanceOf(self)

            #            If the pool has made no profits, `xcp_profit == xcp_profit_a`
            #                         and the pool gulps nothing in the previous step.

            vprice: uint256 = self.virtual_price

            #  Admin fees are calculated as follows.
            #      1. Calculate accrued profit since last claim. `xcp_profit`
            #         is the current profits. `xcp_profit_a` is the profits
            #         at the previous claim.
            #      2. Take out admin's share, which is hardcoded at 5 * 10**9.
            #         (50% => half of 100% => 10**10 / 2 => 5 * 10**9).
            #      3. Since half of the profits go to rebalancing the pool, we
            #         are left with half; so divide by 2.

            fees: uint256 = unsafe_div(
                unsafe_sub(xcp_profit, xcp_profit_a) * ADMIN_FEE, 2 * 10**10
            )

            # ------------------------------ Claim admin fees by minting admin's share
            #                                                of the pool in LP tokens.
            receiver: address = Factory(self.factory).fee_receiver()
            if receiver != empty(address) and fees > 0:

                frac: uint256 = vprice * 10**18 / (vprice - fees) - 10**18
                claimed: uint256 = self.mint_relative(receiver, frac)

                xcp_profit -= fees * 2

                self.xcp_profit = xcp_profit

                log ClaimAdminFee(receiver, claimed)

            # ------------------------------------------- Recalculate D b/c we gulped.
            D: uint256 = MATH.newton_D(A_gamma[0], A_gamma[1], self.xp(), 0)
            self.D = D

            # ------------------- Recalculate virtual_price following admin fee claim.
            #     In this instance we do not check if current virtual price is greater
            #               than old virtual price, since the claim process can result
            #                                     in a small decrease in pool's value.

            self.virtual_price = 10**18 * self.get_xcp(D) / self.totalSupply
            self.xcp_profit_a = xcp_profit  # <------------ Cache last claimed profit.
        ```

    === "Example"

        ```shell
        >>> CryptoSwap.claim_admin_fees()
        ```



## **Price Oracle Methods**
### `lp_price`
### `get_virtual_price`
### `price_oracle`
### `last_prices`
### `price_scale`
### `ma_time`
### `last_prices_timestamp`
### `virtual_price`



## **Contract Info Methods**
### `precisions`
### `DOMAIN_SEPERATOR`
### `WETH20`
### `MATH`
### `coins`
### `factory`
### `balances`
### `D`











## **Bonding Curve Parameters**

what does A do? what does gamma do? when does initial A gamma etc get changed? calling which functions?
`future_A_gamma_time` is the time when ramping up is finished, when the ramping process is initialized.


### `A`
!!! description "`CryptoSwap.A() -> uint256:`"

    Getter for the current pool amplification parameter.

    Returns: amplification parameter (A) (`uint256`).

    ??? quote "Source code"

        ```python hl_lines="1"
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
        >>> CryptoSwap.A()
        1707629
        ```


### `gamma`
!!! description "`CryptoSwap.gamma() -> uint256:`"

    Getter for the current pool gamma parameter.

    Returns: gamma (`uint256`).

    ??? quote "Source code"

        ```python hl_lines="1"
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
        >>> CryptoSwap.gamma()
        11809167828997
        ```

## **Price Scaling (todo)**
### `packed_rebalancing_params`


### `adjustment_step`




!!! description "`TriCrypto.fee_receiver() -> address: view`"

    Getter for the fee receiver of the accumulated fees.

    Returns:

    Emits:

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `input` |  `type` | Contract input |

    ??? quote "Source code"

        ```python hl_lines="1"
    
        ```

    === "Example"

        ```shell
        >>> TriCrypto.fee_receiver()
        '0xeCb456EA5365865EbAb8a2661B0c503410e9B347'
        ```





!!! description "`TriCrypto.fee_calc(xp: uint256[N_COINS]) -> uint256: view`"

    Getter for the charged fee by the pool at the current state based on the pools balances.

    Returns: charged fee (`uint256`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `xp` |  `uint256[N_COINS]` | Balances of pool multiplied by the coin precision |

    ??? quote "Source code"

        === "CurveTricryptoOptimizedWETH.vy"

            ```python hl_lines="1"
            ```

        === "Math.vy"

            ```python hl_lines="1"
            ```


    === "Example"

        ```shell
        >>> TriCrypto.fee_calc('todo')
        ''
        ```