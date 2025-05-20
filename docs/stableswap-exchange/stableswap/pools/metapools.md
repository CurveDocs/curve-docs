A metapool is a pool where a stablecoin is paired against the LP token from another pool, a so-called _base_ pool.

For example, a liquidity provider may deposit ``DAI`` into
[3Pool](https://etherscan.io/address/0xbebc44782c7db0a1a60cb6fe97d0b483032ff1c7#code) and in exchange receive the
pool’s LP token ``3CRV``. The ``3CRV`` LP token may then be deposited into the
[GUSD metapool](https://etherscan.io/address/0x4f062658EaAF2C1ccf8C8e36D6824CDf41167956), which contains the
coins ``GUSD`` and ``3CRV``, in exchange for the metapool’s LP token gusd3CRV. The obtained LP token may then be staked
in the metapool’s liquidity gauge for ``CRV`` rewards.

Metapools provide an opportunity for the base pool liquidity providers to earn additional trading fees by depositing
their LP tokens into the metapool. Note that the ``CRV`` rewards received for staking LP tokens into the pool’s liquidity
gauge may differ for the base pool’s liquidity gauge and the metapool’s liquidity gauge. For details on liquidity
gauges and protocol rewards, please refer to Liquidity Gauges and Minting CRV.

!!! note

    Metapools also implement the ABI from plain pools. The template source code for metapools may be viewed on
    [GitHub](https://github.com/curvefi/curve-contract/blob/master/contracts/pool-templates/meta/SwapTemplateMeta.vy).

## **Pool Info Methods**

### `base_coins`

!!! description "`StableSwap.base_coins(i: uint256) → address: view`"

    Get the coins of the base pool. Returns `address` of the coin at index `i`.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `i`       |  `uint256` | Coin index |

    ??? quote "Source code"

        ```vyper hl_lines="2 6 44 45 46 47 48 49 50 51 52 53 54 55 56 57 58 59"
        # Token corresponding to the pool is always the last one
        BASE_POOL_COINS: constant(int128) = 3

        ...

        base_coins: public(address[BASE_POOL_COINS])

        ...

        @external
        def __init__(
            _owner: address,
            _coins: address[N_COINS],
            _pool_token: address,
            _base_pool: address,
            _A: uint256,
            _fee: uint256,
            _admin_fee: uint256
        ):
            """
            @notice Contract constructor
            @param _owner Contract owner address
            @param _coins Addresses of ERC20 conracts of coins
            @param _pool_token Address of the token representing LP share
            @param _base_pool Address of the base pool (which will have a virtual price)
            @param _A Amplification coefficient multiplied by n * (n - 1)
            @param _fee Fee to charge for exchanges
            @param _admin_fee Admin fee
            """
            for i in range(N_COINS):
                assert _coins[i] != ZERO_ADDRESS
            self.coins = _coins
            self.initial_A = _A * A_PRECISION
            self.future_A = _A * A_PRECISION
            self.fee = _fee
            self.admin_fee = _admin_fee
            self.owner = _owner
            self.kill_deadline = block.timestamp + KILL_DEADLINE_DT
            self.token = CurveToken(_pool_token)

            self.base_pool = _base_pool
            self.base_virtual_price = Curve(_base_pool).get_virtual_price()
            self.base_cache_updated = block.timestamp
            for i in range(BASE_POOL_COINS):
                _base_coin: address = Curve(_base_pool).coins(convert(i, uint256))
                self.base_coins[i] = _base_coin

                # approve underlying coins for infinite transfers
                _response: Bytes[32] = raw_call(
                    _base_coin,
                    concat(
                        method_id("approve(address,uint256)"),
                        convert(_base_pool, bytes32),
                        convert(MAX_UINT256, bytes32),
                    ),
                    max_outsize=32,
                )
                if len(_response) > 0:
                    assert convert(_response, bool)
        ```

    === "Example"

        ```shell
        >>> metapool.base_coins(0)
        '0x6B175474E89094C44Da98b954EedeAC495271d0F'
        >>> metapool.base_coins(1)
        '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
        >>> metapool.base_coins(2)
        '0xdAC17F958D2ee523a2206206994597C13D831ec7'
        ```

### `StableSwap.coins`

!!! description "`StableSwap.coins(i: uint256) → address: view`"

    Get the coins of the metapool. Returns `address` of coin at index `i`.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `i`       |  `uint256` | Coin index |

    ??? quote "Source code"

        ```vyper hl_lines="1 5 12 22 29 30 31"
        N_COINS: constant(int128) = 2

        ...

        coins: public(address[N_COINS])

        ...

        @external
        def __init__(
            _owner: address,
            _coins: address[N_COINS],
            _pool_token: address,
            _base_pool: address,
            _A: uint256,
            _fee: uint256,
            _admin_fee: uint256
        ):
            """
            @notice Contract constructor
            @param _owner Contract owner address
            @param _coins Addresses of ERC20 conracts of coins
            @param _pool_token Address of the token representing LP share
            @param _base_pool Address of the base pool (which will have a virtual price)
            @param _A Amplification coefficient multiplied by n * (n - 1)
            @param _fee Fee to charge for exchanges
            @param _admin_fee Admin fee
            """
            for i in range(N_COINS):
                assert _coins[i] != ZERO_ADDRESS
            self.coins = _coins
            self.initial_A = _A * A_PRECISION
            self.future_A = _A * A_PRECISION
            self.fee = _fee
            self.admin_fee = _admin_fee
            self.owner = _owner
            self.kill_deadline = block.timestamp + KILL_DEADLINE_DT
            self.token = CurveToken(_pool_token)

            self.base_pool = _base_pool
            self.base_virtual_price = Curve(_base_pool).get_virtual_price()
            self.base_cache_updated = block.timestamp
            for i in range(BASE_POOL_COINS):
                _base_coin: address = Curve(_base_pool).coins(convert(i, uint256))
                self.base_coins[i] = _base_coin

                # approve underlying coins for infinite transfers
                _response: Bytes[32] = raw_call(
                    _base_coin,
                    concat(
                        method_id("approve(address,uint256)"),
                        convert(_base_pool, bytes32),
                        convert(MAX_UINT256, bytes32),
                    ),
                    max_outsize=32,
                )
                if len(_response) > 0:
                    assert convert(_response, bool)
        ```

    === "Example"

        ```shell
        >>> metapool.coins(0)
        '0x056Fd409E1d7A124BD7017459dFEa2F387b6d5Cd'
        >>> metapool.coins(1)
        '0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490'
        ```

        In this console example, ``coins(0)`` is the metapool’s coin (``GUSD``) and ``coins(1)`` is the LP token of
        the base pool (``3CRV``).

### `StableSwap.base_pool`

!!! description "`StableSwap.base_pool() → address: view`"

    Get the address of the base pool. Returns `address` of the base pool implementation.

    ??? quote "Source code"

        ```vyper hl_lines="1 10 20 36 40"
        base_pool: public(address)

        ...

        @external
        def __init__(
            _owner: address,
            _coins: address[N_COINS],
            _pool_token: address,
            _base_pool: address,
            _A: uint256,
            _fee: uint256,
            _admin_fee: uint256
        ):
            """
            @notice Contract constructor
            @param _owner Contract owner address
            @param _coins Addresses of ERC20 conracts of coins
            @param _pool_token Address of the token representing LP share
            @param _base_pool Address of the base pool (which will have a virtual price)
            @param _A Amplification coefficient multiplied by n * (n - 1)
            @param _fee Fee to charge for exchanges
            @param _admin_fee Admin fee
            """
            for i in range(N_COINS):
                assert _coins[i] != ZERO_ADDRESS
            self.coins = _coins
            self.initial_A = _A * A_PRECISION
            self.future_A = _A * A_PRECISION
            self.fee = _fee
            self.admin_fee = _admin_fee
            self.owner = _owner
            self.kill_deadline = block.timestamp + KILL_DEADLINE_DT
            self.token = CurveToken(_pool_token)

            self.base_pool = _base_pool
            self.base_virtual_price = Curve(_base_pool).get_virtual_price()
            self.base_cache_updated = block.timestamp
            for i in range(BASE_POOL_COINS):
                _base_coin: address = Curve(_base_pool).coins(convert(i, uint256))
                self.base_coins[i] = _base_coin

                # approve underlying coins for infinite transfers
                _response: Bytes[32] = raw_call(
                    _base_coin,
                    concat(
                        method_id("approve(address,uint256)"),
                        convert(_base_pool, bytes32),
                        convert(MAX_UINT256, bytes32),
                    ),
                    max_outsize=32,
                )
                if len(_response) > 0:
                    assert convert(_response, bool)
        ```

    === "Example"

        ```shell
        >>> metapool.base_pool()
        '0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7'
        ```

### `StableSwap.base_virtual_price`

!!! description "`StableSwap.base_virtual_price() → uint256: view`"

    Get the current price of the base pool LP token relative to the underlying base pool assets.

    ??? quote "Source code"

        ```vyper hl_lines="1 37"
        base_virtual_price: public(uint256)

        ...

        @external
        def __init__(
            _owner: address,
            _coins: address[N_COINS],
            _pool_token: address,
            _base_pool: address,
            _A: uint256,
            _fee: uint256,
            _admin_fee: uint256
        ):
            """
            @notice Contract constructor
            @param _owner Contract owner address
            @param _coins Addresses of ERC20 conracts of coins
            @param _pool_token Address of the token representing LP share
            @param _base_pool Address of the base pool (which will have a virtual price)
            @param _A Amplification coefficient multiplied by n * (n - 1)
            @param _fee Fee to charge for exchanges
            @param _admin_fee Admin fee
            """
            for i in range(N_COINS):
                assert _coins[i] != ZERO_ADDRESS
            self.coins = _coins
            self.initial_A = _A * A_PRECISION
            self.future_A = _A * A_PRECISION
            self.fee = _fee
            self.admin_fee = _admin_fee
            self.owner = _owner
            self.kill_deadline = block.timestamp + KILL_DEADLINE_DT
            self.token = CurveToken(_pool_token)

            self.base_pool = _base_pool
            self.base_virtual_price = Curve(_base_pool).get_virtual_price()
            self.base_cache_updated = block.timestamp
            for i in range(BASE_POOL_COINS):
                _base_coin: address = Curve(_base_pool).coins(convert(i, uint256))
                self.base_coins[i] = _base_coin

                # approve underlying coins for infinite transfers
                _response: Bytes[32] = raw_call(
                    _base_coin,
                    concat(
                        method_id("approve(address,uint256)"),
                        convert(_base_pool, bytes32),
                        convert(MAX_UINT256, bytes32),
                    ),
                    max_outsize=32,
                )
                if len(_response) > 0:
                    assert convert(_response, bool)
        ```

    === "Example"

        ```shell
        >>> metapool.base_virtual_price()
        1014750545929625438
        ```

    !!! note

        The base pool’s virtual price is only fetched from the base pool if the cached price has expired. A
        fetched based pool virtual price is cached for 10 minutes (``BASE_CACHE_EXPIRES: constant(int128) = 10 * 60``).

### `StableSwap.base_cache_update()`

!!! description "`StableSwap.base_cache_update() → uint256: view`"

    Get the timestamp at which the base pool virtual price was last cached.

    ??? quote "Source code"

        ```vyper hl_lines="1 5 42 64 67 75"
        base_cache_updated: public(uint256)

        ...

        BASE_CACHE_EXPIRES: constant(int128) = 10 * 60  # 10 min

        ...

        @external
        def __init__(
            _owner: address,
            _coins: address[N_COINS],
            _pool_token: address,
            _base_pool: address,
            _A: uint256,
            _fee: uint256,
            _admin_fee: uint256
        ):
            """
            @notice Contract constructor
            @param _owner Contract owner address
            @param _coins Addresses of ERC20 conracts of coins
            @param _pool_token Address of the token representing LP share
            @param _base_pool Address of the base pool (which will have a virtual price)
            @param _A Amplification coefficient multiplied by n * (n - 1)
            @param _fee Fee to charge for exchanges
            @param _admin_fee Admin fee
            """
            for i in range(N_COINS):
                assert _coins[i] != ZERO_ADDRESS
            self.coins = _coins
            self.initial_A = _A * A_PRECISION
            self.future_A = _A * A_PRECISION
            self.fee = _fee
            self.admin_fee = _admin_fee
            self.owner = _owner
            self.kill_deadline = block.timestamp + KILL_DEADLINE_DT
            self.token = CurveToken(_pool_token)

            self.base_pool = _base_pool
            self.base_virtual_price = Curve(_base_pool).get_virtual_price()
            self.base_cache_updated = block.timestamp
            for i in range(BASE_POOL_COINS):
                _base_coin: address = Curve(_base_pool).coins(convert(i, uint256))
                self.base_coins[i] = _base_coin

                # approve underlying coins for infinite transfers
                _response: Bytes[32] = raw_call(
                    _base_coin,
                    concat(
                        method_id("approve(address,uint256)"),
                        convert(_base_pool, bytes32),
                        convert(MAX_UINT256, bytes32),
                    ),
                    max_outsize=32,
                )
                if len(_response) > 0:
                    assert convert(_response, bool)

        ...

        @internal
        def _vp_rate() -> uint256:
            if block.timestamp > self.base_cache_updated + BASE_CACHE_EXPIRES:
                vprice: uint256 = Curve(self.base_pool).get_virtual_price()
                self.base_virtual_price = vprice
                self.base_cache_updated = block.timestamp
                return vprice
            else:
                return self.base_virtual_price

        @internal
        @view
        def _vp_rate_ro() -> uint256:
            if block.timestamp > self.base_cache_updated + BASE_CACHE_EXPIRES:
                return Curve(self.base_pool).get_virtual_price()
            else:
                return self.base_virtual_price
        ```

    === "Example"

        ```shell
        >>> metapool.base_cache_updated()
        1616583340
        ```

## Exchange Methods

Similar to lending pools, on metapools exchanges can be made either between the coins the metapool actually holds
(another pool’s LP token and some other coin) or between the metapool’s underlying coins. In the context of a metapool,
**underlying** coins refers to the metapool’s coin and any of the base pool’s coins. The base pool’s LP token is **not**
included as an underlying coin.

For example, the GUSD metapool would have the following:

Coins: ``GUSD``, ``3CRV`` (3Pool LP)

Underlying coins: ``GUSD``, ``DAI``, ``USDC``, ``USDT``

!!! note

    While metapools contain public getters for ``coins`` and ``base_coins``, there exists no getter for obtaining a list
    of all underlying coins.

### `StableSwap.exchange`

!!! description "`StableSwap.exchange(i: int128, j: int128, _dx: uint256, _min_dy: uint256) → uint256`"

    Perform an exchange between two (non-underlying) coins in the metapool. Index values can be found via the ``coins``
    public getter method.

    Returns: the actual amount of coin ``j`` received.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `i`       |  `int128` | Index value for the coin to send |
    | `j`       |  `int128` | Index value of the coin to receive|
    | `_dx`       |  `uint256` | Amount of ``i`` being exchanged |
    | `_min_dy`      |  `uint256` | Minimum amount of ``j`` to receive |

    Emits: <mark style="background-color: #FFD580; color: black">TokenExchange</mark>

    todo: explain how fee is calculated

    ??? quote "Source code"

        ```vyper
        @external
        @nonreentrant('lock')
        def exchange(i: int128, j: int128, dx: uint256, min_dy: uint256) -> uint256:
            """
            @notice Perform an exchange between two coins
            @dev Index values can be found via the `coins` public getter method
            @param i Index value for the coin to send
            @param j Index valie of the coin to recieve
            @param dx Amount of `i` being exchanged
            @param min_dy Minimum amount of `j` to receive
            @return Actual amount of `j` received
            """
            assert not self.is_killed  # dev: is killed
            rates: uint256[N_COINS] = RATES
            rates[MAX_COIN] = self._vp_rate()

            old_balances: uint256[N_COINS] = self.balances
            xp: uint256[N_COINS] = self._xp_mem(rates[MAX_COIN], old_balances)

            x: uint256 = xp[i] + dx * rates[i] / PRECISION
            y: uint256 = self.get_y(i, j, x, xp)

            dy: uint256 = xp[j] - y - 1  # -1 just in case there were some rounding errors
            dy_fee: uint256 = dy * self.fee / FEE_DENOMINATOR

            # Convert all to real units
            dy = (dy - dy_fee) * PRECISION / rates[j]
            assert dy >= min_dy, "Too few coins in result"

            dy_admin_fee: uint256 = dy_fee * self.admin_fee / FEE_DENOMINATOR
            dy_admin_fee = dy_admin_fee * PRECISION / rates[j]

            # Change balances exactly in same way as we change actual ERC20 coin amounts
            self.balances[i] = old_balances[i] + dx
            # When rounding errors happen, we undercharge admin fee in favor of LP
            self.balances[j] = old_balances[j] - dy - dy_admin_fee

            assert ERC20(self.coins[i]).transferFrom(msg.sender, self, dx)
            assert ERC20(self.coins[j]).transfer(msg.sender, dy)

            log TokenExchange(msg.sender, i, dx, j, dy)

            return dy
        ```

    === "Example"

        ```shell
        >>> lending_pool.exchange()
        todo: console output
        ```

### `StableSwap.exchange_underlying`

!!! description "StableSwap.exchange_underlying(i: int128, j: int128, _dx: uint256, _min_dy: uint256) → uint256"

    Perform an exchange between two underlying tokens. Index values are the ``coins`` followed by the ``base_coins``,
    where the base pool LP token is **not** included as a value.

    Returns: the actual amount of coin ``j`` received.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `i`       |  `int128` | Index value for the coin to send |
    | `j`       |  `int128` | Index value of the coin to receive|
    | `_dx`       |  `uint256` | Amount of ``i`` being exchanged |
    | `_min_dy`      |  `uint256` | Minimum amount of ``j`` to receive |

    Emits: <mark style="background-color: #FFD580; color: black">TokenExchangeUnderlying</mark>

    ??? quote "Source code"

        ```vyper
        @external
        @nonreentrant('lock')
        def exchange_underlying(i: int128, j: int128, dx: uint256, min_dy: uint256) -> uint256:
            """
            @notice Perform an exchange between two underlying coins
            @dev Index values can be found via the `underlying_coins` public getter method
            @param i Index value for the underlying coin to send
            @param j Index valie of the underlying coin to recieve
            @param dx Amount of `i` being exchanged
            @param min_dy Minimum amount of `j` to receive
            @return Actual amount of `j` received
            """
            assert not self.is_killed  # dev: is killed
            rates: uint256[N_COINS] = RATES
            rates[MAX_COIN] = self._vp_rate()
            _base_pool: address = self.base_pool

            # Use base_i or base_j if they are >= 0
            base_i: int128 = i - MAX_COIN
            base_j: int128 = j - MAX_COIN
            meta_i: int128 = MAX_COIN
            meta_j: int128 = MAX_COIN
            if base_i < 0:
                meta_i = i
            if base_j < 0:
                meta_j = j
            dy: uint256 = 0

            # Addresses for input and output coins
            input_coin: address = ZERO_ADDRESS
            if base_i < 0:
                input_coin = self.coins[i]
            else:
                input_coin = self.base_coins[base_i]
            output_coin: address = ZERO_ADDRESS
            if base_j < 0:
                output_coin = self.coins[j]
            else:
                output_coin = self.base_coins[base_j]

            # Handle potential Tether fees
            dx_w_fee: uint256 = dx
            if input_coin == FEE_ASSET:
                dx_w_fee = ERC20(FEE_ASSET).balanceOf(self)
            # "safeTransferFrom" which works for ERC20s which return bool or not
            _response: Bytes[32] = raw_call(
                input_coin,
                concat(
                    method_id("transferFrom(address,address,uint256)"),
                    convert(msg.sender, bytes32),
                    convert(self, bytes32),
                    convert(dx, bytes32),
                ),
                max_outsize=32,
            )  # dev: failed transfer
            if len(_response) > 0:
                assert convert(_response, bool)  # dev: failed transfer
            # end "safeTransferFrom"
            # Handle potential Tether fees
            if input_coin == FEE_ASSET:
                dx_w_fee = ERC20(FEE_ASSET).balanceOf(self) - dx_w_fee

            if base_i < 0 or base_j < 0:
                old_balances: uint256[N_COINS] = self.balances
                xp: uint256[N_COINS] = self._xp_mem(rates[MAX_COIN], old_balances)

                x: uint256 = 0
                if base_i < 0:
                    x = xp[i] + dx_w_fee * rates[i] / PRECISION
                else:
                    # i is from BasePool
                    # At first, get the amount of pool tokens
                    base_inputs: uint256[BASE_N_COINS] = empty(uint256[BASE_N_COINS])
                    base_inputs[base_i] = dx_w_fee
                    coin_i: address = self.coins[MAX_COIN]
                    # Deposit and measure delta
                    x = ERC20(coin_i).balanceOf(self)
                    Curve(_base_pool).add_liquidity(base_inputs, 0)
                    # Need to convert pool token to "virtual" units using rates
                    # dx is also different now
                    dx_w_fee = ERC20(coin_i).balanceOf(self) - x
                    x = dx_w_fee * rates[MAX_COIN] / PRECISION
                    # Adding number of pool tokens
                    x += xp[MAX_COIN]

                y: uint256 = self.get_y(meta_i, meta_j, x, xp)

                # Either a real coin or token
                dy = xp[meta_j] - y - 1  # -1 just in case there were some rounding errors
                dy_fee: uint256 = dy * self.fee / FEE_DENOMINATOR

                # Convert all to real units
                # Works for both pool coins and real coins
                dy = (dy - dy_fee) * PRECISION / rates[meta_j]

                dy_admin_fee: uint256 = dy_fee * self.admin_fee / FEE_DENOMINATOR
                dy_admin_fee = dy_admin_fee * PRECISION / rates[meta_j]

                # Change balances exactly in same way as we change actual ERC20 coin amounts
                self.balances[meta_i] = old_balances[meta_i] + dx_w_fee
                # When rounding errors happen, we undercharge admin fee in favor of LP
                self.balances[meta_j] = old_balances[meta_j] - dy - dy_admin_fee

                # Withdraw from the base pool if needed
                if base_j >= 0:
                    out_amount: uint256 = ERC20(output_coin).balanceOf(self)
                    Curve(_base_pool).remove_liquidity_one_coin(dy, base_j, 0)
                    dy = ERC20(output_coin).balanceOf(self) - out_amount

                assert dy >= min_dy, "Too few coins in result"

            else:
                # If both are from the base pool
                dy = ERC20(output_coin).balanceOf(self)
                Curve(_base_pool).exchange(base_i, base_j, dx_w_fee, min_dy)
                dy = ERC20(output_coin).balanceOf(self) - dy

            # "safeTransfer" which works for ERC20s which return bool or not
            _response = raw_call(
                output_coin,
                concat(
                    method_id("transfer(address,uint256)"),
                    convert(msg.sender, bytes32),
                    convert(dy, bytes32),
                ),
                max_outsize=32,
            )  # dev: failed transfer
            if len(_response) > 0:
                assert convert(_response, bool)  # dev: failed transfer
            # end "safeTransfer"

            log TokenExchangeUnderlying(msg.sender, i, dx, j, dy)

            return dy
        ```

    === "Example"

        ```shell
        >>> lending_pool.exchange_underlying()
        todo: console output
        ```
