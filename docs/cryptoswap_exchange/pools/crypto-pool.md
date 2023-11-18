**Crypto-Pools are exchange contracts containing two volatile (non-pegged) assets.**

These exchange contracts are deployed via the [CryptoSwap Factory](../factory/overview.md). Unlike newer Factory contracts, which utilize blueprint contracts, the earlier versions did not have this feature at the time of their deployments. Instead, in these earlier versions, the exchange contract is created using the Vyper built-in **`create_forwarder_to()`** function. 

The pool is then initialized via the **`initialize()`** function of the pool implementation contract, which sets all the relevant variables, such as paired tokens, prices, and parameters.


??? quote "Initializing the Pool"

    ```python
    @external
    def initialize(
        A: uint256,
        gamma: uint256,
        mid_fee: uint256,
        out_fee: uint256,
        allowed_extra_profit: uint256,
        fee_gamma: uint256,
        adjustment_step: uint256,
        admin_fee: uint256,
        ma_half_time: uint256,
        initial_price: uint256,
        _token: address,
        _coins: address[N_COINS],
        _precisions: uint256,
    ):
        assert self.mid_fee == 0  # dev: check that we call it from factory

        self.factory = msg.sender

        # Pack A and gamma:
        # shifted A + gamma
        A_gamma: uint256 = shift(A, 128)
        A_gamma = bitwise_or(A_gamma, gamma)
        self.initial_A_gamma = A_gamma
        self.future_A_gamma = A_gamma

        self.mid_fee = mid_fee
        self.out_fee = out_fee
        self.allowed_extra_profit = allowed_extra_profit
        self.fee_gamma = fee_gamma
        self.adjustment_step = adjustment_step
        self.admin_fee = admin_fee

        self.price_scale = initial_price
        self._price_oracle = initial_price
        self.last_prices = initial_price
        self.last_prices_timestamp = block.timestamp
        self.ma_half_time = ma_half_time

        self.xcp_profit_a = 10**18

        self.token = _token
        self.coins = _coins
        self.PRECISIONS = _precisions
    ```


## **Exchange Methods**

### `exchange`
!!! description "`CryptoSwap.exchange(i: uint256, j: uint256, dx: uint256, min_dy: uint256, use_eth: bool = False, receiver: address = msg.sender) -> uint256:`"

    Function to exchange `dx` amount of coin `i` for coin `j` and receive a minimum amount of `min_dy`.

    Returns: output amount (`uint256`).

    Emits: `TokenExchange`

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `i` | `uint256` | Index value for the input coin |
    | `j` | `uint256` | Index value for the output coin |
    | `dx` | `uint256` | Amount of input coin being swapped in |
    | `min_dy` | `uint256` | Minimum amount of output coin to receive |
    | `use_eth` | `bool` | whether to use plain ETH; defaults to `False` (uses wETH instead) |
    | `receiver` | `address` | Address to send output coin to. Deafaults to `msg.sender` |

    ??? quote "Source code"

        ```python
        event TokenExchange:
            buyer: indexed(address)
            sold_id: uint256
            tokens_sold: uint256
            bought_id: uint256
            tokens_bought: uint256

        @payable
        @external
        @nonreentrant('lock')
        def exchange(i: uint256, j: uint256, dx: uint256, min_dy: uint256,
                    use_eth: bool = False, receiver: address = msg.sender) -> uint256:
            """
            Exchange using WETH by default
            """
            return self._exchange(msg.sender, msg.value, i, j, dx, min_dy, use_eth, receiver, ZERO_ADDRESS, EMPTY_BYTES32)

        @internal
        def _exchange(sender: address, mvalue: uint256, i: uint256, j: uint256, dx: uint256, min_dy: uint256,
                    use_eth: bool, receiver: address, callbacker: address, callback_sig: bytes32) -> uint256:
            assert i != j  # dev: coin index out of range
            assert i < N_COINS  # dev: coin index out of range
            assert j < N_COINS  # dev: coin index out of range
            assert dx > 0  # dev: do not exchange 0 coins

            A_gamma: uint256[2] = self._A_gamma()
            xp: uint256[N_COINS] = self.balances
            p: uint256 = 0
            dy: uint256 = 0

            in_coin: address = self.coins[i]
            out_coin: address = self.coins[j]

            y: uint256 = xp[j]
            x0: uint256 = xp[i]
            xp[i] = x0 + dx
            self.balances[i] = xp[i]

            price_scale: uint256 = self.price_scale
            precisions: uint256[2] = self._get_precisions()

            xp = [xp[0] * precisions[0], xp[1] * price_scale * precisions[1] / PRECISION]

            prec_i: uint256 = precisions[0]
            prec_j: uint256 = precisions[1]
            if i == 1:
                prec_i = precisions[1]
                prec_j = precisions[0]

            # In case ramp is happening
            t: uint256 = self.future_A_gamma_time
            if t > 0:
                x0 *= prec_i
                if i > 0:
                    x0 = x0 * price_scale / PRECISION
                x1: uint256 = xp[i]  # Back up old value in xp
                xp[i] = x0
                self.D = self.newton_D(A_gamma[0], A_gamma[1], xp)
                xp[i] = x1  # And restore
                if block.timestamp >= t:
                    self.future_A_gamma_time = 1

            dy = xp[j] - self.newton_y(A_gamma[0], A_gamma[1], xp, self.D, j)
            # Not defining new "y" here to have less variables / make subsequent calls cheaper
            xp[j] -= dy
            dy -= 1

            if j > 0:
                dy = dy * PRECISION / price_scale
            dy /= prec_j

            dy -= self._fee(xp) * dy / 10**10
            assert dy >= min_dy, "Slippage"
            y -= dy

            self.balances[j] = y

            # Do transfers in and out together
            # XXX coin vs ETH
            if use_eth and in_coin == WETH20:
                assert mvalue == dx  # dev: incorrect eth amount
            else:
                assert mvalue == 0  # dev: nonzero eth amount
                if callback_sig == EMPTY_BYTES32:
                    response: Bytes[32] = raw_call(
                        in_coin,
                        _abi_encode(
                            sender, self, dx, method_id=method_id("transferFrom(address,address,uint256)")
                        ),
                        max_outsize=32,
                    )
                    if len(response) != 0:
                        assert convert(response, bool)  # dev: failed transfer
                else:
                    b: uint256 = ERC20(in_coin).balanceOf(self)
                    raw_call(
                        callbacker,
                        concat(slice(callback_sig, 0, 4), _abi_encode(sender, receiver, in_coin, dx, dy))
                    )
                    assert ERC20(in_coin).balanceOf(self) - b == dx  # dev: callback didn't give us coins
                if in_coin == WETH20:
                    WETH(WETH20).withdraw(dx)

            if use_eth and out_coin == WETH20:
                raw_call(receiver, b"", value=dy)
            else:
                if out_coin == WETH20:
                    WETH(WETH20).deposit(value=dy)
                response: Bytes[32] = raw_call(
                    out_coin,
                    _abi_encode(receiver, dy, method_id=method_id("transfer(address,uint256)")),
                    max_outsize=32,
                )
                if len(response) != 0:
                    assert convert(response, bool)

            y *= prec_j
            if j > 0:
                y = y * price_scale / PRECISION
            xp[j] = y

            # Calculate price
            if dx > 10**5 and dy > 10**5:
                _dx: uint256 = dx * prec_i
                _dy: uint256 = dy * prec_j
                if i == 0:
                    p = _dx * 10**18 / _dy
                else:  # j == 0
                    p = _dy * 10**18 / _dx

            self.tweak_price(A_gamma, xp, p, 0)

            log TokenExchange(sender, i, dx, j, dy)

            return dy
        ```

    === "Example"

        ```shell
        >>> CryptoSwap.exchange()
        1696841675
        ```


### `exchange_underlying`
!!! description "`CryptoSwap.exchange_underlying(i: uint256, j: uint256, dx: uint256, min_dy: uint256, receiver: address = msg.sender) -> uint256:`"

    !!!note 
        `exchange_underlying` exchanges tokens by using the 'underlying' ETH instead of wETH.

    Function to exchange `dx` amount of coin `i` for coin `j` and receive a minimum amount of `min_dy`.

    Returns: output amount (`uint256`).

    Emits: `TokenExchange`

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `i` | `uint256` | index value for the input coin |
    | `j` | `uint256` | index value for the output coin |
    | `dx` | `uint256` | amount of input coin being swapped in |
    | `min_dy` | `uint256` | minimum amount of output coin to receive |
    | `use_eth` | `bool` | whether to use plain ETH; defaults to `False` (uses wETH instead) |
    | `receiver` | `address` | address to send output coin to; deafaults to `msg.sender` |

    ??? quote "Source code"

        ```python
        event TokenExchange:
            buyer: indexed(address)
            sold_id: uint256
            tokens_sold: uint256
            bought_id: uint256
            tokens_bought: uint256

        @payable
        @external
        @nonreentrant('lock')
        def exchange_underlying(i: uint256, j: uint256, dx: uint256, min_dy: uint256,
                                receiver: address = msg.sender) -> uint256:
            """
            Exchange using ETH
            """
            return self._exchange(msg.sender, msg.value, i, j, dx, min_dy, True, receiver, ZERO_ADDRESS, EMPTY_BYTES32)

        @internal
        def _exchange(sender: address, mvalue: uint256, i: uint256, j: uint256, dx: uint256, min_dy: uint256,
                    use_eth: bool, receiver: address, callbacker: address, callback_sig: bytes32) -> uint256:
            assert i != j  # dev: coin index out of range
            assert i < N_COINS  # dev: coin index out of range
            assert j < N_COINS  # dev: coin index out of range
            assert dx > 0  # dev: do not exchange 0 coins

            A_gamma: uint256[2] = self._A_gamma()
            xp: uint256[N_COINS] = self.balances
            p: uint256 = 0
            dy: uint256 = 0

            in_coin: address = self.coins[i]
            out_coin: address = self.coins[j]

            y: uint256 = xp[j]
            x0: uint256 = xp[i]
            xp[i] = x0 + dx
            self.balances[i] = xp[i]

            price_scale: uint256 = self.price_scale
            precisions: uint256[2] = self._get_precisions()

            xp = [xp[0] * precisions[0], xp[1] * price_scale * precisions[1] / PRECISION]

            prec_i: uint256 = precisions[0]
            prec_j: uint256 = precisions[1]
            if i == 1:
                prec_i = precisions[1]
                prec_j = precisions[0]

            # In case ramp is happening
            t: uint256 = self.future_A_gamma_time
            if t > 0:
                x0 *= prec_i
                if i > 0:
                    x0 = x0 * price_scale / PRECISION
                x1: uint256 = xp[i]  # Back up old value in xp
                xp[i] = x0
                self.D = self.newton_D(A_gamma[0], A_gamma[1], xp)
                xp[i] = x1  # And restore
                if block.timestamp >= t:
                    self.future_A_gamma_time = 1

            dy = xp[j] - self.newton_y(A_gamma[0], A_gamma[1], xp, self.D, j)
            # Not defining new "y" here to have less variables / make subsequent calls cheaper
            xp[j] -= dy
            dy -= 1

            if j > 0:
                dy = dy * PRECISION / price_scale
            dy /= prec_j

            dy -= self._fee(xp) * dy / 10**10
            assert dy >= min_dy, "Slippage"
            y -= dy

            self.balances[j] = y

            # Do transfers in and out together
            # XXX coin vs ETH
            if use_eth and in_coin == WETH20:
                assert mvalue == dx  # dev: incorrect eth amount
            else:
                assert mvalue == 0  # dev: nonzero eth amount
                if callback_sig == EMPTY_BYTES32:
                    response: Bytes[32] = raw_call(
                        in_coin,
                        _abi_encode(
                            sender, self, dx, method_id=method_id("transferFrom(address,address,uint256)")
                        ),
                        max_outsize=32,
                    )
                    if len(response) != 0:
                        assert convert(response, bool)  # dev: failed transfer
                else:
                    b: uint256 = ERC20(in_coin).balanceOf(self)
                    raw_call(
                        callbacker,
                        concat(slice(callback_sig, 0, 4), _abi_encode(sender, receiver, in_coin, dx, dy))
                    )
                    assert ERC20(in_coin).balanceOf(self) - b == dx  # dev: callback didn't give us coins
                if in_coin == WETH20:
                    WETH(WETH20).withdraw(dx)

            if use_eth and out_coin == WETH20:
                raw_call(receiver, b"", value=dy)
            else:
                if out_coin == WETH20:
                    WETH(WETH20).deposit(value=dy)
                response: Bytes[32] = raw_call(
                    out_coin,
                    _abi_encode(receiver, dy, method_id=method_id("transfer(address,uint256)")),
                    max_outsize=32,
                )
                if len(response) != 0:
                    assert convert(response, bool)

            y *= prec_j
            if j > 0:
                y = y * price_scale / PRECISION
            xp[j] = y

            # Calculate price
            if dx > 10**5 and dy > 10**5:
                _dx: uint256 = dx * prec_i
                _dy: uint256 = dy * prec_j
                if i == 0:
                    p = _dx * 10**18 / _dy
                else:  # j == 0
                    p = _dy * 10**18 / _dx

            self.tweak_price(A_gamma, xp, p, 0)

            log TokenExchange(sender, i, dx, j, dy)

            return dy
        ```

    === "Example"

        ```shell
        >>> CryptoSwap.exchange_underlying()
        1696841675
        ```


### `exchange_extended`
!!! description "`CryptoSwap.exchange_extended(i: uint256, j: uint256, dx: uint256, min_dy: uint256, use_eth: bool, sender: address, receiver: address, cb: bytes32) -> uint256:`"

    !!!note 
        This method does not allow swapping in native token, but does allow swaps that transfer out native token from the pool.

    Function to exchange `dx` amount of coin `i` for coin `j` and receive a minimum amount of `min_dy` with using a callback method.

    Returns: output amount (`uint256`).

    Emits: `TokenExchange`

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `i` | `uint256` | index value for the input coin |
    | `j` | `uint256` | index value for the output coin |
    | `dx` | `uint256` | amount of input coin being swapped in |
    | `min_dy` | `uint256` | minimum amount of output coin to receive |
    | `use_eth` | `bool` | whether to use plain ETH; defaults to `False` (uses wETH instead) |
    | `receiver` | `address` | address to send output coin to; deafaults to `msg.sender` |
    | `cb` | `bytes32` | callback signature |

    ??? quote "Source code"

        ```python
        event TokenExchange:
            buyer: indexed(address)
            sold_id: uint256
            tokens_sold: uint256
            bought_id: uint256
            tokens_bought: uint256

        @payable
        @external
        @nonreentrant('lock')
        def exchange_extended(i: uint256, j: uint256, dx: uint256, min_dy: uint256,
                            use_eth: bool, sender: address, receiver: address, cb: bytes32) -> uint256:
            assert cb != EMPTY_BYTES32  # dev: No callback specified
            return self._exchange(sender, msg.value, i, j, dx, min_dy, use_eth, receiver, msg.sender, cb)

        @internal
        def _exchange(sender: address, mvalue: uint256, i: uint256, j: uint256, dx: uint256, min_dy: uint256,
                    use_eth: bool, receiver: address, callbacker: address, callback_sig: bytes32) -> uint256:
            assert i != j  # dev: coin index out of range
            assert i < N_COINS  # dev: coin index out of range
            assert j < N_COINS  # dev: coin index out of range
            assert dx > 0  # dev: do not exchange 0 coins

            A_gamma: uint256[2] = self._A_gamma()
            xp: uint256[N_COINS] = self.balances
            p: uint256 = 0
            dy: uint256 = 0

            in_coin: address = self.coins[i]
            out_coin: address = self.coins[j]

            y: uint256 = xp[j]
            x0: uint256 = xp[i]
            xp[i] = x0 + dx
            self.balances[i] = xp[i]

            price_scale: uint256 = self.price_scale
            precisions: uint256[2] = self._get_precisions()

            xp = [xp[0] * precisions[0], xp[1] * price_scale * precisions[1] / PRECISION]

            prec_i: uint256 = precisions[0]
            prec_j: uint256 = precisions[1]
            if i == 1:
                prec_i = precisions[1]
                prec_j = precisions[0]

            # In case ramp is happening
            t: uint256 = self.future_A_gamma_time
            if t > 0:
                x0 *= prec_i
                if i > 0:
                    x0 = x0 * price_scale / PRECISION
                x1: uint256 = xp[i]  # Back up old value in xp
                xp[i] = x0
                self.D = self.newton_D(A_gamma[0], A_gamma[1], xp)
                xp[i] = x1  # And restore
                if block.timestamp >= t:
                    self.future_A_gamma_time = 1

            dy = xp[j] - self.newton_y(A_gamma[0], A_gamma[1], xp, self.D, j)
            # Not defining new "y" here to have less variables / make subsequent calls cheaper
            xp[j] -= dy
            dy -= 1

            if j > 0:
                dy = dy * PRECISION / price_scale
            dy /= prec_j

            dy -= self._fee(xp) * dy / 10**10
            assert dy >= min_dy, "Slippage"
            y -= dy

            self.balances[j] = y

            # Do transfers in and out together
            # XXX coin vs ETH
            if use_eth and in_coin == WETH20:
                assert mvalue == dx  # dev: incorrect eth amount
            else:
                assert mvalue == 0  # dev: nonzero eth amount
                if callback_sig == EMPTY_BYTES32:
                    response: Bytes[32] = raw_call(
                        in_coin,
                        _abi_encode(
                            sender, self, dx, method_id=method_id("transferFrom(address,address,uint256)")
                        ),
                        max_outsize=32,
                    )
                    if len(response) != 0:
                        assert convert(response, bool)  # dev: failed transfer
                else:
                    b: uint256 = ERC20(in_coin).balanceOf(self)
                    raw_call(
                        callbacker,
                        concat(slice(callback_sig, 0, 4), _abi_encode(sender, receiver, in_coin, dx, dy))
                    )
                    assert ERC20(in_coin).balanceOf(self) - b == dx  # dev: callback didn't give us coins
                if in_coin == WETH20:
                    WETH(WETH20).withdraw(dx)

            if use_eth and out_coin == WETH20:
                raw_call(receiver, b"", value=dy)
            else:
                if out_coin == WETH20:
                    WETH(WETH20).deposit(value=dy)
                response: Bytes[32] = raw_call(
                    out_coin,
                    _abi_encode(receiver, dy, method_id=method_id("transfer(address,uint256)")),
                    max_outsize=32,
                )
                if len(response) != 0:
                    assert convert(response, bool)

            y *= prec_j
            if j > 0:
                y = y * price_scale / PRECISION
            xp[j] = y

            # Calculate price
            if dx > 10**5 and dy > 10**5:
                _dx: uint256 = dx * prec_i
                _dy: uint256 = dy * prec_j
                if i == 0:
                    p = _dx * 10**18 / _dy
                else:  # j == 0
                    p = _dy * 10**18 / _dx

            self.tweak_price(A_gamma, xp, p, 0)

            log TokenExchange(sender, i, dx, j, dy)

            return dy
        ```

    === "Example"

        ```shell
        >>> CryptoSwap.exchange_extended()
        1696841675
        ```

### `get_dy`
!!! description "`CryptoSwap.get_dy(i: uint256, j: uint256, dx: uint256) -> uint256:`"

    Getter for the received amount of coin `j` for swapping in `dx` amount of coin `i`. 

    Returns: output amount (`uint256`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `i` | `uint256` | index value for the input coin |
    | `j` | `uint256` | index value for the output coin |
    | `dx` | `uint256` | amount of input coin being swapped in |

    !!!note
        This method takes fees into consideration.

    ??? quote "Source code"

        ```python
        @external
        @view
        def get_dy(i: uint256, j: uint256, dx: uint256) -> uint256:
            assert i != j  # dev: same input and output coin
            assert i < N_COINS  # dev: coin index out of range
            assert j < N_COINS  # dev: coin index out of range

            precisions: uint256[2] = self._get_precisions()

            price_scale: uint256 = self.price_scale * precisions[1]
            xp: uint256[N_COINS] = self.balances

            A_gamma: uint256[2] = self._A_gamma()
            D: uint256 = self.D
            if self.future_A_gamma_time > 0:
                D = self.newton_D(A_gamma[0], A_gamma[1], self.xp())

            xp[i] += dx
            xp = [xp[0] * precisions[0], xp[1] * price_scale / PRECISION]

            y: uint256 = self.newton_y(A_gamma[0], A_gamma[1], xp, D, j)
            dy: uint256 = xp[j] - y - 1
            xp[j] = y
            if j > 0:
                dy = dy * PRECISION / price_scale
            else:
                dy /= precisions[0]
            dy -= self._fee(xp) * dy / 10**10

            return dy
        ```

    === "Example"

        ```shell
        >>> CryptoSwap.get_dy(0, 1, 1e18) # get_dy: 1 ETH for dy PRISMA
        2244836869048665161301
        ```


### `calc_withdraw_one_coin`
!!! description "`CryptoSwap.calc_withdraw_one_coin(token_amount: uint256, i: uint256) -> uint256:`"

    Method to calculate the amount of output token `i` when burning `token_amount` of lp tokens, taking fees into condsideration.

    Returns: amount of token received (`uint256`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `token_amount` |  `uint256` | amount of lp tokens burned |
    | `i` |  `uint256` | index of the coin to withdraw |

    !!!note
        This method takes fees into consideration.

    ??? quote "Source code"

        ```python
        N_COINS: constant(int128) = 2

        @view
        @external
        def calc_withdraw_one_coin(token_amount: uint256, i: uint256) -> uint256:
            return self._calc_withdraw_one_coin(self._A_gamma(), token_amount, i, True, False)[0]

        @internal
        @view
        def _calc_withdraw_one_coin(A_gamma: uint256[2], token_amount: uint256, i: uint256, update_D: bool,
                                    calc_price: bool) -> (uint256, uint256, uint256, uint256[N_COINS]):
            token_supply: uint256 = CurveToken(self.token).totalSupply()
            assert token_amount <= token_supply  # dev: token amount more than supply
            assert i < N_COINS  # dev: coin out of range

            xx: uint256[N_COINS] = self.balances
            D0: uint256 = 0
            precisions: uint256[2] = self._get_precisions()

            price_scale_i: uint256 = self.price_scale * precisions[1]
            xp: uint256[N_COINS] = [xx[0] * precisions[0], xx[1] * price_scale_i / PRECISION]
            if i == 0:
                price_scale_i = PRECISION * precisions[0]

            if update_D:
                D0 = self.newton_D(A_gamma[0], A_gamma[1], xp)
            else:
                D0 = self.D

            D: uint256 = D0

            # Charge the fee on D, not on y, e.g. reducing invariant LESS than charging the user
            fee: uint256 = self._fee(xp)
            dD: uint256 = token_amount * D / token_supply
            D -= (dD - (fee * dD / (2 * 10**10) + 1))
            y: uint256 = self.newton_y(A_gamma[0], A_gamma[1], xp, D, i)
            dy: uint256 = (xp[i] - y) * PRECISION / price_scale_i
            xp[i] = y

            # Price calc
            p: uint256 = 0
            if calc_price and dy > 10**5 and token_amount > 10**5:
                # p_i = dD / D0 * sum'(p_k * x_k) / (dy - dD / D0 * y0)
                S: uint256 = 0
                precision: uint256 = precisions[0]
                if i == 1:
                    S = xx[0] * precisions[0]
                    precision = precisions[1]
                else:
                    S = xx[1] * precisions[1]
                S = S * dD / D0
                p = S * PRECISION / (dy * precision - dD * xx[i] * precision / D0)
                if i == 0:
                    p = (10**18)**2 / p

            return dy, p, D, xp
        ```

    === "Example"

        ```shell
        >>> CryptoSwap.calc_withdraw_one_coin(1000000000000000000, 0) # withdraw 1 LP token in coin[0]
        43347133051647883
        ```


## **Adding/Removing Liquidity**

### `add_liquidity`
!!! description "`CryptoSwap.add_liquidity(amounts: uint256[N_COINS], min_mint_amount: uint256, use_eth: bool = False, receiver: address = msg.sender) -> uint256:`"

    Function to add liquidity to the pool and mint the corresponding lp tokens.

    Returns: amount of lp tokens received (`uint256`).

    Emits: `AddLiquidity`

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `amounts` |  `uint256[N_COINS]` | list of amounts to add of each coin |
    | `min_mint_amount` |  `uint256` | minimum amount of lp tokens to mint |
    | `use_eth` |  `bool` | `True` if native token is being added to the pool; default to `False` |
    | `receiver` |  `address` | receiver of the lp tokens; deaults to `msg.sender` |

    ??? quote "Source code"

        ```python
        event AddLiquidity:
            provider: indexed(address)
            token_amounts: uint256[N_COINS]
            fee: uint256
            token_supply: uint256

        N_COINS: constant(int128) = 2

        @payable
        @external
        @nonreentrant('lock')
        def add_liquidity(amounts: uint256[N_COINS], min_mint_amount: uint256,
                        use_eth: bool = False, receiver: address = msg.sender) -> uint256:
            assert amounts[0] > 0 or amounts[1] > 0  # dev: no coins to add

            A_gamma: uint256[2] = self._A_gamma()

            xp: uint256[N_COINS] = self.balances
            amountsp: uint256[N_COINS] = empty(uint256[N_COINS])
            xx: uint256[N_COINS] = empty(uint256[N_COINS])
            d_token: uint256 = 0
            d_token_fee: uint256 = 0
            old_D: uint256 = 0

            xp_old: uint256[N_COINS] = xp

            for i in range(N_COINS):
                bal: uint256 = xp[i] + amounts[i]
                xp[i] = bal
                self.balances[i] = bal
            xx = xp

            precisions: uint256[2] = self._get_precisions()

            price_scale: uint256 = self.price_scale * precisions[1]
            xp = [xp[0] * precisions[0], xp[1] * price_scale / PRECISION]
            xp_old = [xp_old[0] * precisions[0], xp_old[1] * price_scale / PRECISION]

            if not use_eth:
                assert msg.value == 0  # dev: nonzero eth amount

            for i in range(N_COINS):
                coin: address = self.coins[i]
                if use_eth and coin == WETH20:
                    assert msg.value == amounts[i]  # dev: incorrect eth amount
                if amounts[i] > 0:
                    if (not use_eth) or (coin != WETH20):
                        response: Bytes[32] = raw_call(
                            coin,
                            _abi_encode(
                                msg.sender,
                                self,
                                amounts[i],
                                method_id=method_id("transferFrom(address,address,uint256)"),
                            ),
                            max_outsize=32,
                        )
                        if len(response) != 0:
                            assert convert(response, bool)  # dev: failed transfer
                        if coin == WETH20:
                            WETH(WETH20).withdraw(amounts[i])
                    amountsp[i] = xp[i] - xp_old[i]

            t: uint256 = self.future_A_gamma_time
            if t > 0:
                old_D = self.newton_D(A_gamma[0], A_gamma[1], xp_old)
                if block.timestamp >= t:
                    self.future_A_gamma_time = 1
            else:
                old_D = self.D

            D: uint256 = self.newton_D(A_gamma[0], A_gamma[1], xp)

            lp_token: address = self.token
            token_supply: uint256 = CurveToken(lp_token).totalSupply()
            if old_D > 0:
                d_token = token_supply * D / old_D - token_supply
            else:
                d_token = self.get_xcp(D)  # making initial virtual price equal to 1
            assert d_token > 0  # dev: nothing minted

            if old_D > 0:
                d_token_fee = self._calc_token_fee(amountsp, xp) * d_token / 10**10 + 1
                d_token -= d_token_fee
                token_supply += d_token
                CurveToken(lp_token).mint(receiver, d_token)

                # Calculate price
                # p_i * (dx_i - dtoken / token_supply * xx_i) = sum{k!=i}(p_k * (dtoken / token_supply * xx_k - dx_k))
                # Simplified for 2 coins
                p: uint256 = 0
                if d_token > 10**5:
                    if amounts[0] == 0 or amounts[1] == 0:
                        S: uint256 = 0
                        precision: uint256 = 0
                        ix: uint256 = 0
                        if amounts[0] == 0:
                            S = xx[0] * precisions[0]
                            precision = precisions[1]
                            ix = 1
                        else:
                            S = xx[1] * precisions[1]
                            precision = precisions[0]
                        S = S * d_token / token_supply
                        p = S * PRECISION / (amounts[ix] * precision - d_token * xx[ix] * precision / token_supply)
                        if ix == 0:
                            p = (10**18)**2 / p

                self.tweak_price(A_gamma, xp, p, D)

            else:
                self.D = D
                self.virtual_price = 10**18
                self.xcp_profit = 10**18
                CurveToken(lp_token).mint(receiver, d_token)

            assert d_token >= min_mint_amount, "Slippage"

            log AddLiquidity(receiver, amounts, d_token_fee, token_supply)

            return d_token
        ```

    === "Example"

        ```shell
        >>> CryptoSwap.add_liquidity(todo)
        
        ```

### `remove_liquidity`
!!! description "`CryptoSwap.remove_liquidity(_amount: uint256, min_amounts: uint256[N_COINS], use_eth: bool = False, receiver: address = msg.sender):`"

    Function to remove liquidity from the pool and burn the lp tokens. When removing liquidity via this function, no fees are charged as the coins are withdrawin in balanced proportions.

    Emits: `RemoveLiquidity`

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_amount` |  `uint256[N_COINS]` | amount of lp tokens to burn |
    | `min_amounts` |  `uint256[N_COINS]` | minimum amounts of token to withdraw |
    | `use_eth` |  `bool` | True = withdraw ETH, False = withdraw wETH |
    | `receiver` |  `address` | receiver of the coins; defaults to msg.sender |

    ??? quote "Source code"

        ```python
        event RemoveLiquidity:
            provider: indexed(address)
            token_amounts: uint256[N_COINS]
            token_supply: uint256

        N_COINS: constant(int128) = 2

        @external
        @nonreentrant('lock')
        def remove_liquidity(_amount: uint256, min_amounts: uint256[N_COINS],
                            use_eth: bool = False, receiver: address = msg.sender):
            """
            This withdrawal method is very safe, does no complex math
            """
            lp_token: address = self.token
            total_supply: uint256 = CurveToken(lp_token).totalSupply()
            CurveToken(lp_token).burnFrom(msg.sender, _amount)
            balances: uint256[N_COINS] = self.balances
            amount: uint256 = _amount - 1  # Make rounding errors favoring other LPs a tiny bit

            for i in range(N_COINS):
                d_balance: uint256 = balances[i] * amount / total_supply
                assert d_balance >= min_amounts[i]
                self.balances[i] = balances[i] - d_balance
                balances[i] = d_balance  # now it's the amounts going out
                coin: address = self.coins[i]
                if use_eth and coin == WETH20:
                    raw_call(receiver, b"", value=d_balance)
                else:
                    if coin == WETH20:
                        WETH(WETH20).deposit(value=d_balance)
                    response: Bytes[32] = raw_call(
                        coin,
                        _abi_encode(receiver, d_balance, method_id=method_id("transfer(address,uint256)")),
                        max_outsize=32,
                    )
                    if len(response) != 0:
                        assert convert(response, bool)

            D: uint256 = self.D
            self.D = D - D * amount / total_supply

            log RemoveLiquidity(msg.sender, balances, total_supply - _amount)
        ```

    === "Example"

        ```shell
        >>> CryptoSwap.remove_liquidity(todo)
        ```


### `remove_liquidity_one_coin`
!!! description "`CryptoSwap.remove_liquidity_one_coin(token_amount: uint256, i: uint256, min_amount: uint256, use_eth: bool = False, receiver: address = msg.sender) -> uint256:`"

    Funtion to withdraw liquidity in a single token.

    Returns: amount of withdrawn coin (`uint256`).

    Emits: `RemoveLiquidityOne`

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `token_amount` |  `uint256` | amount of lp tokens to burn |
    | `i` |  `uint256` | index of the token to withdraw |
    | `min_amount` |  `uint256` | minimum amount of token to withdraw |
    | `use_eth` |  `bool` | True = withdraw ETH, False = withdraw wETH |
    | `receiver` |  `address` | receiver of the coins; defaults to msg.sender |

    ??? quote "Source code"

        ```python
        event RemoveLiquidityOne:
            provider: indexed(address)
            token_amount: uint256
            coin_index: uint256
            coin_amount: uint256

        @external
        @nonreentrant('lock')
        def remove_liquidity_one_coin(token_amount: uint256, i: uint256, min_amount: uint256,
                                    use_eth: bool = False, receiver: address = msg.sender) -> uint256:
            A_gamma: uint256[2] = self._A_gamma()

            dy: uint256 = 0
            D: uint256 = 0
            p: uint256 = 0
            xp: uint256[N_COINS] = empty(uint256[N_COINS])
            future_A_gamma_time: uint256 = self.future_A_gamma_time
            dy, p, D, xp = self._calc_withdraw_one_coin(A_gamma, token_amount, i, (future_A_gamma_time > 0), True)
            assert dy >= min_amount, "Slippage"

            if block.timestamp >= future_A_gamma_time:
                self.future_A_gamma_time = 1

            self.balances[i] -= dy
            CurveToken(self.token).burnFrom(msg.sender, token_amount)

            coin: address = self.coins[i]
            if use_eth and coin == WETH20:
                raw_call(receiver, b"", value=dy)
            else:
                if coin == WETH20:
                    WETH(WETH20).deposit(value=dy)
                response: Bytes[32] = raw_call(
                    coin,
                    _abi_encode(receiver, dy, method_id=method_id("transfer(address,uint256)")),
                    max_outsize=32,
                )
                if len(response) != 0:
                    assert convert(response, bool)

            self.tweak_price(A_gamma, xp, p, D)

            log RemoveLiquidityOne(msg.sender, token_amount, i, dy)

            return dy
        ```

    === "Example"

        ```shell
        >>> CryptoSwap.remove_liquidity_one_coin()
        ```


## **Oracles Methods**

Oracle prices are updated whenever the `tweak_price` function is called. This occurs when any of the `_exchange()`, `add_liquidity()`, or `remove_liquidity_one_coin()` functions are called.


??? quote "Source code"

```python "Update Price Oracles"

@internal
def tweak_price(A_gamma: uint256[2],_xp: uint256[N_COINS], p_i: uint256, new_D: uint256):
    price_oracle: uint256 = self._price_oracle
    last_prices: uint256 = self.last_prices
    price_scale: uint256 = self.price_scale
    last_prices_timestamp: uint256 = self.last_prices_timestamp
    p_new: uint256 = 0

    if last_prices_timestamp < block.timestamp:
        # MA update required
        ma_half_time: uint256 = self.ma_half_time
        alpha: uint256 = self.halfpow((block.timestamp - last_prices_timestamp) * 10**18 / ma_half_time)
        price_oracle = (last_prices * (10**18 - alpha) + price_oracle * alpha) / 10**18
        self._price_oracle = price_oracle
        self.last_prices_timestamp = block.timestamp

    D_unadjusted: uint256 = new_D  # Withdrawal methods know new D already
    if new_D == 0:
        # We will need this a few times (35k gas)
        D_unadjusted = self.newton_D(A_gamma[0], A_gamma[1], _xp)

    if p_i > 0:
        last_prices = p_i

    else:
        # calculate real prices
        __xp: uint256[N_COINS] = _xp
        dx_price: uint256 = __xp[0] / 10**6
        __xp[0] += dx_price
        last_prices = price_scale * dx_price / (_xp[1] - self.newton_y(A_gamma[0], A_gamma[1], __xp, D_unadjusted, 1))

    self.last_prices = last_prices

    total_supply: uint256 = CurveToken(self.token).totalSupply()
    old_xcp_profit: uint256 = self.xcp_profit
    old_virtual_price: uint256 = self.virtual_price

    # Update profit numbers without price adjustment first
    xp: uint256[N_COINS] = [D_unadjusted / N_COINS, D_unadjusted * PRECISION / (N_COINS * price_scale)]
    xcp_profit: uint256 = 10**18
    virtual_price: uint256 = 10**18

    if old_virtual_price > 0:
        xcp: uint256 = self.geometric_mean(xp, True)
        virtual_price = 10**18 * xcp / total_supply
        xcp_profit = old_xcp_profit * virtual_price / old_virtual_price

        t: uint256 = self.future_A_gamma_time
        if virtual_price < old_virtual_price and t == 0:
            raise "Loss"
        if t == 1:
            self.future_A_gamma_time = 0

    self.xcp_profit = xcp_profit

    norm: uint256 = price_oracle * 10**18 / price_scale
    if norm > 10**18:
        norm -= 10**18
    else:
        norm = 10**18 - norm
    adjustment_step: uint256 = max(self.adjustment_step, norm / 5)

    needs_adjustment: bool = self.not_adjusted
    # if not needs_adjustment and (virtual_price-10**18 > (xcp_profit-10**18)/2 + self.allowed_extra_profit):
    # (re-arrange for gas efficiency)
    if not needs_adjustment and (virtual_price * 2 - 10**18 > xcp_profit + 2*self.allowed_extra_profit) and (norm > adjustment_step) and (old_virtual_price > 0):
        needs_adjustment = True
        self.not_adjusted = True

    if needs_adjustment:
        if norm > adjustment_step and old_virtual_price > 0:
            p_new = (price_scale * (norm - adjustment_step) + adjustment_step * price_oracle) / norm

            # Calculate balances*prices
            xp = [_xp[0], _xp[1] * p_new / price_scale]

            # Calculate "extended constant product" invariant xCP and virtual price
            D: uint256 = self.newton_D(A_gamma[0], A_gamma[1], xp)
            xp = [D / N_COINS, D * PRECISION / (N_COINS * p_new)]
            # We reuse old_virtual_price here but it's not old anymore
            old_virtual_price = 10**18 * self.geometric_mean(xp, True) / total_supply

            # Proceed if we've got enough profit
            # if (old_virtual_price > 10**18) and (2 * (old_virtual_price - 10**18) > xcp_profit - 10**18):
            if (old_virtual_price > 10**18) and (2 * old_virtual_price - 10**18 > xcp_profit):
                self.price_scale = p_new
                self.D = D
                self.virtual_price = old_virtual_price

                return

            else:
                self.not_adjusted = False

                # Can instead do another flag variable if we want to save bytespace
                self.D = D_unadjusted
                self.virtual_price = virtual_price
                self._claim_admin_fees()

                return

    # If we are here, the price_scale adjustment did not happen
    # Still need to update the profit counter and D
    self.D = D_unadjusted
    self.virtual_price = virtual_price

    # norm appeared < adjustment_step after
    if needs_adjustment:
        self.not_adjusted = False
        self._claim_admin_fees()
```


### `lp_price`
!!! description "`CryptoSwap.lp_price() -> uint256:`"

    Getter for the approximate LP token price with regard to the token at index 0.

    Returns: LP token price (`uint256`).

    ??? quote "Source code"

        ```python
        @external
        @view
        def lp_price() -> uint256:
            """
            Approximate LP token price
            """
            return 2 * self.virtual_price * self.sqrt_int(self.internal_price_oracle()) / 10**18

        @internal
        @view
        def internal_price_oracle() -> uint256:
            price_oracle: uint256 = self._price_oracle
            last_prices_timestamp: uint256 = self.last_prices_timestamp

            if last_prices_timestamp < block.timestamp:
                ma_half_time: uint256 = self.ma_half_time
                last_prices: uint256 = self.last_prices
                alpha: uint256 = self.halfpow((block.timestamp - last_prices_timestamp) * 10**18 / ma_half_time)
                return (last_prices * (10**18 - alpha) + price_oracle * alpha) / 10**18

            else:
                return price_oracle
        ```

    === "Example"

        ```shell
        >>> CryptoSwap.lp_price()
        41793722011818265
        ```


### `price_oracle`
!!! description "`CryptoSwap.price_oracle() -> uint256:`"

    Getter for the oracle price of the coin at index `k` with regard to coin at index 0. 

    Returns: oracle price (`uint256`).

    ??? quote "Source code"

        ```python
        @external
        @view
        def price_oracle() -> uint256:
            return self.internal_price_oracle()

        @internal
        @view
        def internal_price_oracle() -> uint256:
            price_oracle: uint256 = self._price_oracle
            last_prices_timestamp: uint256 = self.last_prices_timestamp

            if last_prices_timestamp < block.timestamp:
                ma_half_time: uint256 = self.ma_half_time
                last_prices: uint256 = self.last_prices
                alpha: uint256 = self.halfpow((block.timestamp - last_prices_timestamp) * 10**18 / ma_half_time)
                return (last_prices * (10**18 - alpha) + price_oracle * alpha) / 10**18

            else:
                return price_oracle
        ```

    === "Example"

        ```shell
        >>> CryptoSwap.price_oracle()
        409798289826499
        ```


### `last_prices`
!!! description "`CryptoSwap.last_prices() -> uint256: view`"

    Getter for the last price of the coin at index `k` with regard to the coin at index 0. `last_price` stores the last price when calling the functions `_exchange()`, `add_liquidity()` or `remove_liquitiy_one_coin()`.

    Returns: last price (`uint256`).

    ??? quote "Source code"

        ```python
        last_prices: public(uint256)
        ```

    === "Example"

        ```shell
        >>> CryptoSwap.last_prices()
        409119503867160
        ```


### `last_prices_timestamp`
!!! description "`CryptoSwap.last_prices_timestamp() -> uint256: view`"

    Getter for the timestamp of the most recent update for `last_prices`.

    Returns: timestamp (`uint256`).

    ??? quote "Source code"

        ```python
        last_prices_timestamp: public(uint256)
        ```

    === "Example"

        ```shell
        >>> CryptoSwap.last_prices_timestamp()
        1700314907
        ```


### `price_scale`
!!! description "`CryptoSwap.price_scale -> uint256: view`"

    Getter for the price scale of the coin at index `k` with regard to the coin at index 0. Price scale determines the price band around which liquidity is
    concentrated and is conditionally updated when calling the functions `_exchange()`, `add_liquidity()` or `remove_liquitiy_one_coin()`.

    Returns: last price (`uint256`).

    ??? quote "Source code"

        ```python
        price_scale: public(uint256)   # Internal price scale
        ```

    === "Example"

        ```shell
        >>> CryptoSwap.price_scale()
        410228896677145
        ```


### `ma_half_time`
!!! description "`CryptoSwap.ma_half_time() -> uint256: view`"

    Getter for the moving-average (ma) half time in seconds.

    Returns: ma half time (`uint256`).

    ??? quote "Source code"

        ```python
        ma_half_time: public(uint256)
        ```

    === "Example"

        ```shell
        >>> CryptoSwap.ma_half_time()
        600
        ```


### `virtual_price`
!!! description "`CryptoSwap.geometric_mean(unsorted_x: uint256[N_COINS], sort: bool) -> uint256:`"

    Getter for the virtual price. This variable is cached, fast to read and mostly used internally.

    Returns: virtual price (`uint256`).

    ??? quote "Source code"

        ```python
        virtual_price: public(uint256)  # Cached (fast to read) virtual price also used internally
        ```

    === "Example"

        ```shell
        >>> CryptoSwap.virtual_price()
        1032276363484815360
        ```


### `get_virtual_price`
!!! description "`CryptoSwap.geometric_mean(unsorted_x: uint256[N_COINS], sort: bool) -> uint256:`"

    Getter for the virtual price.

    Returns: virtual price (`uint256`).

    ??? quote "Source code"

        ```python
        @external
        @view
        def get_virtual_price() -> uint256:
            return 10**18 * self.get_xcp(self.D) / CurveToken(self.token).totalSupply()
        ```

    === "Example"

        ```shell
        >>> CryptoSwap.get_virtual_price()
        1032276363484815360
        ```





## **Fee Methods**

Fees are charged based on the balance/imbalance of the pool. Fee is low when the pool is balanced and increases the more it is imbalanced.

### `fee`
!!! description "`CryptoSwap.fee() -> uint256:`"

    Getter for the fee charged by the pool at the current state.

    Returns: fee (`uint256`).

    ??? quote "Source code"

        ```python
        @external
        @view
        def fee() -> uint256:
            return self._fee(self.xp())

        @internal
        @view
        def _fee(xp: uint256[N_COINS]) -> uint256:
            """
            f = fee_gamma / (fee_gamma + (1 - K))
            where
            K = prod(x) / (sum(x) / N)**N
            (all normalized to 1e18)
            """
            fee_gamma: uint256 = self.fee_gamma
            f: uint256 = xp[0] + xp[1]  # sum
            f = fee_gamma * 10**18 / (
                fee_gamma + 10**18 - (10**18 * N_COINS**N_COINS) * xp[0] / f * xp[1] / f
            )
            return (self.mid_fee * f + self.out_fee * (10**18 - f)) / 10**18
        ```

    === "Example"

        ```shell
        >>> CryptoSwap.fee()
        26417626
        ```


### `mid_fee`
!!! description "`CryptoSwap.mid_fee() -> uint256: view`"

    Getter for the current 'mid-fee'. This is the minimum fee and is charged when the pool is completely balanced.

    Returns: mid fee (`uint256`).

    ??? quote "Source code"

        ```python
        mid_fee: public(uint256)
        ```

    === "Example"

        ```shell
        >>> CryptoSwap.mid_fee()
        26000000
        ```


### `out_fee`
!!! description "`CryptoSwap.out_fee() -> uint256: view`"

    Getter for the 'out-fee'. This is the maximum fee and is charged when the pool is completely imbalanced.

    Returns: out fee (`uint256`).

    ??? quote "Source code"

        ```python
        out_fee: public(uint256)
        ```

    === "Example"

        ```shell
        >>> CryptoSwap.out_fee()
        45000000
        ```


### `fee_gamma`
!!! description "`CryptoSwap.fee_gamma() -> uint256: view`"

    Getter for the 'fee-gamma'. This parameter modifies the rate at which fees rise as imbalance intensifies. Smaller values result in rapid fee hikes with growing imbalances, while larger values lead to more gradual increments in fees as imbalance expands.

    Returns: fee gamma (`uint256`).

    ??? quote "Source code"

        ```python
        fee_gamma: public(uint256)
        ```

    === "Example"

        ```shell
        >>> CryptoSwap.fee_gamma()
        230000000000000
        ```


### `xcp_profit`
!!! description "`CryptoSwap.xcp_profit() -> uint256: view`"

    Getter for the current pool profits.

    Returns: current profits (`uint256`).

    ??? quote "Source code"

        ```python
        xcp_profit: public(uint256)
        ```

    === "Example"

        ```shell
        >>> CryptoSwap.xcp_profit()
        1058938494058326335
        ```


### `xcp_profit_a`
!!! description "`CryptoSwap.xcp_profit_a() -> uint256:`"

    Getter for the full profit at the last claim of admin fees.

    Returns: profit at last claim (`uint256`).

    ??? quote "Source code"

        ```python
        xcp_profit_a: public(uint256)  # Full profit at last claim of admin fees
        ```

    === "Example"

        ```shell
        >>> CryptoSwap.xcp_profit_a()
        1058927586013478083
        ```


### `admin_fee`
!!! description "`CryptoSwap.admin_fee() -> uint256:`"

    Getter for the admin fee of the pool. This value is hardcoded to 50% (5000000000).

    Returns: admin fee (`uint256`).

    ??? quote "Source code"

        ```python
        admin_fee: public(uint256)
        ```

    === "Example"

        ```shell
        >>> CryptoSwap.admin_fee()
        5000000000
        ```


### `claim_admin_fees`
!!! description "`CryptoSwap.admin_fee() -> uint256:`"

    Function to claim admin fees from the pool and send them to the fee receiver. `fee_receiver` is set within the [Factory](https://etherscan.io/address/0xF18056Bbd320E96A48e3Fbf8bC061322531aac99). 

    Emits: `ClaimAdminFee`

    ??? quote "Source code"

        ```python
        event ClaimAdminFee:
            admin: indexed(address)
            tokens: uint256

        @external
        @nonreentrant('lock')
        def claim_admin_fees():
            self._claim_admin_fees()

        @internal
        def _claim_admin_fees():
            A_gamma: uint256[2] = self._A_gamma()

            xcp_profit: uint256 = self.xcp_profit
            xcp_profit_a: uint256 = self.xcp_profit_a

            # Gulp here
            for i in range(N_COINS):
                coin: address = self.coins[i]
                if coin == WETH20:
                    self.balances[i] = self.balance
                else:
                    self.balances[i] = ERC20(coin).balanceOf(self)

            vprice: uint256 = self.virtual_price

            if xcp_profit > xcp_profit_a:
                fees: uint256 = (xcp_profit - xcp_profit_a) * self.admin_fee / (2 * 10**10)
                if fees > 0:
                    receiver: address = Factory(self.factory).fee_receiver()
                    if receiver != ZERO_ADDRESS:
                        frac: uint256 = vprice * 10**18 / (vprice - fees) - 10**18
                        claimed: uint256 = CurveToken(self.token).mint_relative(receiver, frac)
                        xcp_profit -= fees*2
                        self.xcp_profit = xcp_profit
                        log ClaimAdminFee(receiver, claimed)

            total_supply: uint256 = CurveToken(self.token).totalSupply()

            # Recalculate D b/c we gulped
            D: uint256 = self.newton_D(A_gamma[0], A_gamma[1], self.xp())
            self.D = D

            self.virtual_price = 10**18 * self.get_xcp(D) / total_supply

            if xcp_profit > xcp_profit_a:
                self.xcp_profit_a = xcp_profit
        ```

    === "Example"

        ```shell
        >>> CryptoSwap.claim_admin_fees()
        ```



## **Price Scaling**

Curve v2 pools adaptively adjust liquidity to optimize depth near prevailing market prices, thereby reducing slippage. This is achieved by maintaining a continuous EMA (exponential moving average) of the pool's recent exchange rates (termed "internal oracle"), and relocating liquidity around this EMA when it's economically sensible for LPs.

You can envision this mechanism as "resetting" the bonding curve to align the peak liquidity concentration (the curve's center) with the EMA. The price with the highest liquidity focus is termed the "price scale", while the ongoing EMA is labeled as the "price oracle."

The price scaling parameters can be adjusted by the admin of the pool, see [here](../pools/admin_controls.md).


### `allowed_extra_profit`
!!! description "`CryptoSwap.allowed_extra_profit() -> uint256: view`"

    Getter for the allowed extra profit.

    Returns: extra profit allowed (`uint256`).

    ??? quote "Source code"

        ```python
        allowed_extra_profit: public(uint256)  # 2 * 10**12 - recommended value
        ```

    === "Example"

        ```shell
        >>> CryptoSwap.allowed_extra_profit()
        2000000000000
        ```


### `adjustment_step`
!!! description "`CryptoSwap.adjustment_step() -> uint256: view`"

    Getter for the minimum size of price scale adjustments.

    Returns: adjustment step (`uint256`).

    ??? quote "Source code"

        ```python
        adjustment_step: public(uint256)
        ```

    === "Example"

        ```shell
        >>> CryptoSwap.adjustment_step()
        146000000000000
        ```




## **Bonding Curve Parameters**

Similar to many AMMs, Curve v2 employs a bonding curve to determine asset prices based on the pool's availability of each asset. To centralize liquidity near the bonding curve's midpoint, Curve v2 utilizes an invariant that sits between the StableSwap (Curve v1) and the constant-product models (like Uniswap, Balancer, and others).

The bonding curve parameters can be adjusted by the admin of the pool, see [here](../pools/admin_controls.md).


### `A`
!!! description "`CryptoSwap.A() -> uint256:`"

    Getter for the current pool amplification value.

    Returns: A (`uint256`).

    ??? quote "Source code"

        ```python
        @view
        @external
        def A() -> uint256:
            return self._A_gamma()[0]

        @view
        @internal
        def _A_gamma() -> uint256[2]:
            t1: uint256 = self.future_A_gamma_time

            A_gamma_1: uint256 = self.future_A_gamma
            gamma1: uint256 = bitwise_and(A_gamma_1, 2**128-1)
            A1: uint256 = shift(A_gamma_1, -128)

            if block.timestamp < t1:
                # handle ramping up and down of A
                A_gamma_0: uint256 = self.initial_A_gamma
                t0: uint256 = self.initial_A_gamma_time

                # Less readable but more compact way of writing and converting to uint256
                # gamma0: uint256 = bitwise_and(A_gamma_0, 2**128-1)
                # A0: uint256 = shift(A_gamma_0, -128)
                # A1 = A0 + (A1 - A0) * (block.timestamp - t0) / (t1 - t0)
                # gamma1 = gamma0 + (gamma1 - gamma0) * (block.timestamp - t0) / (t1 - t0)

                t1 -= t0
                t0 = block.timestamp - t0
                t2: uint256 = t1 - t0

                A1 = (shift(A_gamma_0, -128) * t2 + A1 * t0) / t1
                gamma1 = (bitwise_and(A_gamma_0, 2**128-1) * t2 + gamma1 * t0) / t1

            return [A1, gamma1]
        ```

    === "Example"

        ```shell
        >>> CryptoSwap.A()
        400000
        ```


### `gamma`
!!! description "`CryptoSwap.gamma() -> uint256:`"

    Getter for the current gamma value.

    Returns: gamma (`uint256`).

    ??? quote "Source code"

        ```python
        @view
        @external
        def gamma() -> uint256:
            return self._A_gamma()[1]

        @view
        @internal
        def _A_gamma() -> uint256[2]:
            t1: uint256 = self.future_A_gamma_time

            A_gamma_1: uint256 = self.future_A_gamma
            gamma1: uint256 = bitwise_and(A_gamma_1, 2**128-1)
            A1: uint256 = shift(A_gamma_1, -128)

            if block.timestamp < t1:
                # handle ramping up and down of A
                A_gamma_0: uint256 = self.initial_A_gamma
                t0: uint256 = self.initial_A_gamma_time

                # Less readable but more compact way of writing and converting to uint256
                # gamma0: uint256 = bitwise_and(A_gamma_0, 2**128-1)
                # A0: uint256 = shift(A_gamma_0, -128)
                # A1 = A0 + (A1 - A0) * (block.timestamp - t0) / (t1 - t0)
                # gamma1 = gamma0 + (gamma1 - gamma0) * (block.timestamp - t0) / (t1 - t0)

                t1 -= t0
                t0 = block.timestamp - t0
                t2: uint256 = t1 - t0

                A1 = (shift(A_gamma_0, -128) * t2 + A1 * t0) / t1
                gamma1 = (bitwise_and(A_gamma_0, 2**128-1) * t2 + gamma1 * t0) / t1

            return [A1, gamma1]
        ```

    === "Example"

        ```shell
        >>> CryptoSwap.gamma()
        145000000000000
        ```



## **Contract Info Methods**
### `coins`
!!! description "`CryptoSwap.coins(arg0: uint256) -> address: view`"

    Getter for the coin at index `arg0`.

    Returns: coin (`address`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `arg0` |  `uint256` | index of coin |

    ??? quote "Source code"

        ```python
        coins: public(address[N_COINS])
        ```

    === "Example"

        ```shell
        >>> CryptoSwap.coins(0)
        '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
        ```


### `balances`
!!! description "`CryptoSwap.balances(arg0: uint256) -> uint256: view`"

    Getter for the pool balance of coin at index `arg0`.

    Returns: coin balance (`uint256`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `arg0` |  `uint256` | index of coin |

    ??? quote "Source code"

        ```python
        coins: public(address[N_COINS])
        ```

    === "Example"

        ```shell
        >>> CryptoSwap.balances(0)
        669157518183204053847
        ```


### `D`
!!! description "`CryptoSwap.D() -> uint256: view`"

    Getter for the D invariant.

    Returns: D (`address`).

    ??? quote "Source code"

        ```python
        D: public(uint256)
        ```

    === "Example"

        ```shell
        >>> CryptoSwap.D()
        1386359478656960977136
        ```


### `token`
!!! description "`CryptoSwap.token() -> uint256: view`"

    Getter for the LP token contract.

    Returns: lp token (`address`).

    ??? quote "Source code"

        ```python
        token: public(address)
        ```

    === "Example"

        ```shell
        >>> CryptoSwap.token()
        '0xb34e1a3D07f9D180Bc2FDb9Fd90B8994423e33c1'
        ```


### `factory`
!!! description "`CryptoSwap.factory()`"

    Getter for the factory contract. 

    Returns: factory (`address`).

    ??? quote "Source code"

        ```python
        factory: public(address)
        ```

    === "Example"

        ```shell
        >>> CryptoSwap.factory()
        '0xF18056Bbd320E96A48e3Fbf8bC061322531aac99'
        ```

## **Internal Math Functions**

All these math functions are interally embedded into the contract. They can not be called externally.

### `geometric_mean`
!!! description "`CryptoSwap.geometric_mean(unsorted_x: uint256[N_COINS], sort: bool) -> uint256:`"

    Function to calculate the geometric mean of a list of numbers in 1e18 precision.

    Returns: gemoetric mean (`uint256`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `unsorted_x` |  `uint256[N_COINS]` | array containing two values |
    | `sort` |  `bool` | whether to sort or not  |

    ??? quote "Source code"

        ```python
        N_COINS: constant(int128) = 2

        @internal
        @pure
        def geometric_mean(unsorted_x: uint256[N_COINS], sort: bool) -> uint256:
            """
            (x[0] * x[1] * ...) ** (1/N)
            """
            x: uint256[N_COINS] = unsorted_x
            if sort and x[0] < x[1]:
                x = [unsorted_x[1], unsorted_x[0]]
            D: uint256 = x[0]
            diff: uint256 = 0
            for i in range(255):
                D_prev: uint256 = D
                # tmp: uint256 = 10**18
                # for _x in x:
                #     tmp = tmp * _x / D
                # D = D * ((N_COINS - 1) * 10**18 + tmp) / (N_COINS * 10**18)
                # line below makes it for 2 coins
                D = (D + x[0] * x[1] / D) / N_COINS
                if D > D_prev:
                    diff = D - D_prev
                else:
                    diff = D_prev - D
                if diff <= 1 or diff * 10**18 < D:
                    return D
            raise "Did not converge"
        ```



### `newton_D`
!!! description "`CryptoSwap.newton_D(ANN: uint256, gamma: uint256, x_unsorted: uint256[N_COINS]) -> uint256:`"

    Function to find the D invariant using Newton method.

    Returns: D invariant (`uint256`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `AMN` |  `uint256` | `ANN = A * N**N` |
    | `gamma` |  `uint256` | `AMM.gamma()` value |
    | `x_unsorted` |  `uint256[N_COINS]` | unsorted array of coin balances |

    ??? quote "Source code"

        ```python
        N_COINS: constant(int128) = 2

        @internal
        @view
        def newton_D(ANN: uint256, gamma: uint256, x_unsorted: uint256[N_COINS]) -> uint256:
            """
            Finding the invariant using Newton method.
            ANN is higher by the factor A_MULTIPLIER
            ANN is already A * N**N

            Currently uses 60k gas
            """
            # Safety checks
            assert ANN > MIN_A - 1 and ANN < MAX_A + 1  # dev: unsafe values A
            assert gamma > MIN_GAMMA - 1 and gamma < MAX_GAMMA + 1  # dev: unsafe values gamma

            # Initial value of invariant D is that for constant-product invariant
            x: uint256[N_COINS] = x_unsorted
            if x[0] < x[1]:
                x = [x_unsorted[1], x_unsorted[0]]

            assert x[0] > 10**9 - 1 and x[0] < 10**15 * 10**18 + 1  # dev: unsafe values x[0]
            assert x[1] * 10**18 / x[0] > 10**14-1  # dev: unsafe values x[i] (input)

            D: uint256 = N_COINS * self.geometric_mean(x, False)
            S: uint256 = x[0] + x[1]

            for i in range(255):
                D_prev: uint256 = D

                # K0: uint256 = 10**18
                # for _x in x:
                #     K0 = K0 * _x * N_COINS / D
                # collapsed for 2 coins
                K0: uint256 = (10**18 * N_COINS**2) * x[0] / D * x[1] / D

                _g1k0: uint256 = gamma + 10**18
                if _g1k0 > K0:
                    _g1k0 = _g1k0 - K0 + 1
                else:
                    _g1k0 = K0 - _g1k0 + 1

                # D / (A * N**N) * _g1k0**2 / gamma**2
                mul1: uint256 = 10**18 * D / gamma * _g1k0 / gamma * _g1k0 * A_MULTIPLIER / ANN

                # 2*N*K0 / _g1k0
                mul2: uint256 = (2 * 10**18) * N_COINS * K0 / _g1k0

                neg_fprime: uint256 = (S + S * mul2 / 10**18) + mul1 * N_COINS / K0 - mul2 * D / 10**18

                # D -= f / fprime
                D_plus: uint256 = D * (neg_fprime + S) / neg_fprime
                D_minus: uint256 = D*D / neg_fprime
                if 10**18 > K0:
                    D_minus += D * (mul1 / neg_fprime) / 10**18 * (10**18 - K0) / K0
                else:
                    D_minus -= D * (mul1 / neg_fprime) / 10**18 * (K0 - 10**18) / K0

                if D_plus > D_minus:
                    D = D_plus - D_minus
                else:
                    D = (D_minus - D_plus) / 2

                diff: uint256 = 0
                if D > D_prev:
                    diff = D - D_prev
                else:
                    diff = D_prev - D
                if diff * 10**14 < max(10**16, D):  # Could reduce precision for gas efficiency here
                    # Test that we are safe with the next newton_y
                    for _x in x:
                        frac: uint256 = _x * 10**18 / D
                        assert (frac > 10**16 - 1) and (frac < 10**20 + 1)  # dev: unsafe values x[i]
                    return D

            raise "Did not converge"
        ```


### `newton_y`
!!! description "`CryptoSwap.newton_y(ANN: uint256, gamma: uint256, x: uint256[N_COINS], D: uint256, i: uint256) -> uint256:`"

    Function to calculate x[i] given balances `x` and invariant D.

    Returns: y (`uint256`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `AMN` |  `uint256` | `ANN = A * N**N` |
    | `gamma` |  `uint256` | `AMM.gamma()` value |
    | `x` |  `uint256[N_COINS]` | array containing coin balances |
    | `D` |  `uint256` | D invariant |
    | `i` |  `uint256` | coin index to calculate x[i] for |

    ??? quote "Source code"

        ```python
        N_COINS: constant(int128) = 2

        @internal
        @pure
        def newton_y(ANN: uint256, gamma: uint256, x: uint256[N_COINS], D: uint256, i: uint256) -> uint256:
            """
            Calculating x[i] given other balances x[0..N_COINS-1] and invariant D
            ANN = A * N**N
            """
            # Safety checks
            assert ANN > MIN_A - 1 and ANN < MAX_A + 1  # dev: unsafe values A
            assert gamma > MIN_GAMMA - 1 and gamma < MAX_GAMMA + 1  # dev: unsafe values gamma
            assert D > 10**17 - 1 and D < 10**15 * 10**18 + 1 # dev: unsafe values D

            x_j: uint256 = x[1 - i]
            y: uint256 = D**2 / (x_j * N_COINS**2)
            K0_i: uint256 = (10**18 * N_COINS) * x_j / D
            # S_i = x_j

            # frac = x_j * 1e18 / D => frac = K0_i / N_COINS
            assert (K0_i > 10**16*N_COINS - 1) and (K0_i < 10**20*N_COINS + 1)  # dev: unsafe values x[i]

            # x_sorted: uint256[N_COINS] = x
            # x_sorted[i] = 0
            # x_sorted = self.sort(x_sorted)  # From high to low
            # x[not i] instead of x_sorted since x_soted has only 1 element

            convergence_limit: uint256 = max(max(x_j / 10**14, D / 10**14), 100)

            for j in range(255):
                y_prev: uint256 = y

                K0: uint256 = K0_i * y * N_COINS / D
                S: uint256 = x_j + y

                _g1k0: uint256 = gamma + 10**18
                if _g1k0 > K0:
                    _g1k0 = _g1k0 - K0 + 1
                else:
                    _g1k0 = K0 - _g1k0 + 1

                # D / (A * N**N) * _g1k0**2 / gamma**2
                mul1: uint256 = 10**18 * D / gamma * _g1k0 / gamma * _g1k0 * A_MULTIPLIER / ANN

                # 2*K0 / _g1k0
                mul2: uint256 = 10**18 + (2 * 10**18) * K0 / _g1k0

                yfprime: uint256 = 10**18 * y + S * mul2 + mul1
                _dyfprime: uint256 = D * mul2
                if yfprime < _dyfprime:
                    y = y_prev / 2
                    continue
                else:
                    yfprime -= _dyfprime
                fprime: uint256 = yfprime / y

                # y -= f / f_prime;  y = (y * fprime - f) / fprime
                # y = (yfprime + 10**18 * D - 10**18 * S) // fprime + mul1 // fprime * (10**18 - K0) // K0
                y_minus: uint256 = mul1 / fprime
                y_plus: uint256 = (yfprime + 10**18 * D) / fprime + y_minus * 10**18 / K0
                y_minus += 10**18 * S / fprime

                if y_plus < y_minus:
                    y = y_prev / 2
                else:
                    y = y_plus - y_minus

                diff: uint256 = 0
                if y > y_prev:
                    diff = y - y_prev
                else:
                    diff = y_prev - y
                if diff < max(convergence_limit, y / 10**14):
                    frac: uint256 = y * 10**18 / D
                    assert (frac > 10**16 - 1) and (frac < 10**20 + 1)  # dev: unsafe value for y
                    return y

            raise "Did not converge"
        ```


### `halfpow`
!!! description "`CryptoSwap.halfpow(power: uint256) -> uint256:`"

    Function to calculate the halfpow.

    Returns: halfpow (`uint256`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `power` |  `uint256` | value |

    ??? quote "Source code"

        ```python
        @internal
        @pure
        def halfpow(power: uint256) -> uint256:
            """
            1e18 * 0.5 ** (power/1e18)

            Inspired by: https://github.com/balancer-labs/balancer-core/blob/master/contracts/BNum.sol#L128
            """
            intpow: uint256 = power / 10**18
            otherpow: uint256 = power - intpow * 10**18
            if intpow > 59:
                return 0
            result: uint256 = 10**18 / (2**intpow)
            if otherpow == 0:
                return result

            term: uint256 = 10**18
            x: uint256 = 5 * 10**17
            S: uint256 = 10**18
            neg: bool = False

            for i in range(1, 256):
                K: uint256 = i * 10**18
                c: uint256 = K - 10**18
                if otherpow > c:
                    c = otherpow - c
                    neg = not neg
                else:
                    c -= otherpow
                term = term * (c * x / 10**18) / K
                if neg:
                    S -= term
                else:
                    S += term
                if term < EXP_PRECISION:
                    return result * S / 10**18

            raise "Did not converge"
        ```