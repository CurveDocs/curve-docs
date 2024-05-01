<h1>LeverageZap.vy</h1>


## collateral

### `get_collateral`
!!! description "`LeverageZap.get_collateral(stablecoin: uint256, route_idx: uint256) -> uint256`"

    Function to calculate the expected amount of collateral for a given amount of `stablecoin`.

    Returns: amount of collateral (`uint256`).

    | Input        | Type      | Description  |
    | ------------ | --------- | ------------ |
    | `stablecoin` | `uint256` | Amount of stablecoins to exchange. | 
    | `route_idx`  | `uint256` | Index of the route to use. | 

    ??? quote "Source code"

        === "LeverageZap.vy"

            ```python
            interface Router:
                def exchange_multiple(_route: address[9], _swap_params: uint256[3][4], _amount: uint256, _expected: uint256, _pools: address[4]) -> uint256: payable
                def get_exchange_multiple_amount(_route: address[9], _swap_params: uint256[3][4], _amount: uint256, _pools: address[4]) -> uint256: view

            @view
            @external
            @nonreentrant('lock')
            def get_collateral(stablecoin: uint256, route_idx: uint256) -> uint256:
                """
                @notice Calculate the expected amount of collateral by given stablecoin amount
                @param stablecoin Amount of stablecoin
                @param route_idx Index of the route to use
                @return Amount of collateral
                """
                return self._get_collateral(stablecoin, route_idx)

            @view
            @internal
            def _get_collateral(stablecoin: uint256, route_idx: uint256) -> uint256:
                return ROUTER.get_exchange_multiple_amount(self.routes[route_idx], self.route_params[route_idx], stablecoin, self.route_pools[route_idx])
            ```

        === "CurveRegistryExchangeContract.vy"

            ```python
            @view
            @external
            def get_exchange_multiple_amount(
                _route: address[9],
                _swap_params: uint256[3][4],
                _amount: uint256,
                _pools: address[4]=[ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS]
            ) -> uint256:
                """
                @notice Get the current number the final output tokens received in an exchange
                @dev Routing and swap params must be determined off-chain. This
                    functionality is designed for gas efficiency over ease-of-use.
                @param _route Array of [initial token, pool, token, pool, token, ...]
                            The array is iterated until a pool address of 0x00, then the last
                            given token is transferred to `_receiver`
                @param _swap_params Multidimensional array of [i, j, swap type] where i and j are the correct
                                    values for the n'th pool in `_route`. The swap type should be
                                    1 for a stableswap `exchange`,
                                    2 for stableswap `exchange_underlying`,
                                    3 for a cryptoswap `exchange`,
                                    4 for a cryptoswap `exchange_underlying`,
                                    5 for factory metapools with lending base pool `exchange_underlying`,
                                    6 for factory crypto-meta pools underlying exchange (`exchange` method in zap),
                                    7-11 for wrapped coin (underlying for lending pool) -> LP token "exchange" (actually `add_liquidity`),
                                    12-14 for LP token -> wrapped coin (underlying for lending or fake pool) "exchange" (actually `remove_liquidity_one_coin`)
                                    15 for WETH -> ETH "exchange" (actually deposit/withdraw)
                @param _amount The amount of `_route[0]` token to be sent.
                @param _pools Array of pools for swaps via zap contracts. This parameter is only needed for
                            Polygon meta-factories underlying swaps.
                @return Expected amount of the final output token
                """
                amount: uint256 = _amount

                for i in range(1,5):
                    # 4 rounds of iteration to perform up to 4 swaps
                    swap: address = _route[i*2-1]
                    pool: address = _pools[i-1] # Only for Polygon meta-factories underlying swap (swap_type == 4)
                    params: uint256[3] = _swap_params[i-1]  # i, j, swap type

                    # Calc output amount according to the swap type
                    if params[2] == 1:
                        amount = CurvePool(swap).get_dy(convert(params[0], int128), convert(params[1], int128), amount)
                    elif params[2] == 2:
                        amount = CurvePool(swap).get_dy_underlying(convert(params[0], int128), convert(params[1], int128), amount)
                    elif params[2] == 3:
                        amount = CryptoPool(swap).get_dy(params[0], params[1], amount)
                    elif params[2] == 4:
                        amount = CryptoPool(swap).get_dy_underlying(params[0], params[1], amount)
                    elif params[2] == 5:
                        amount = CurvePool(pool).get_dy_underlying(convert(params[0], int128), convert(params[1], int128), amount)
                    elif params[2] == 6:
                        amount = CryptoMetaZap(swap).get_dy(pool, params[0], params[1], amount)
                    elif params[2] == 7:
                        _amounts: uint256[2] = [0, 0]
                        _amounts[params[0]] = amount
                        amount = BasePool2Coins(swap).calc_token_amount(_amounts, True)
                    elif params[2] in [8, 9]:
                        _amounts: uint256[3] = [0, 0, 0]
                        _amounts[params[0]] = amount
                        amount = BasePool3Coins(swap).calc_token_amount(_amounts, True)
                    elif params[2] == 10:
                        _amounts: uint256[4] = [0, 0, 0, 0]
                        _amounts[params[0]] = amount
                        amount = BasePool4Coins(swap).calc_token_amount(_amounts, True)
                    elif params[2] == 11:
                        _amounts: uint256[5] = [0, 0, 0, 0, 0]
                        _amounts[params[0]] = amount
                        amount = BasePool5Coins(swap).calc_token_amount(_amounts, True)
                    elif params[2] in [12, 13]:
                        # The number of coins doesn't matter here
                        amount = BasePool3Coins(swap).calc_withdraw_one_coin(amount, convert(params[1], int128))
                    elif params[2] == 14:
                        # The number of coins doesn't matter here
                        amount = CryptoBasePool3Coins(swap).calc_withdraw_one_coin(amount, params[1])
                    elif params[2] == 15:
                        # ETH <--> WETH rate is 1:1
                        pass
                    else:
                        raise "Bad swap type"

                    # check if this was the last swap
                    if i == 4 or _route[i*2+1] == ZERO_ADDRESS:
                        break

                return amount
            ```

    === "Example"
        ```shell
        >>> LeverageZap.
        ''
        ```


### `get_collateral_underlying`
!!! description "`LeverageZap.get_collateral_underlying(stablecoin: uint256, route_idx: uint256) -> uint256`"

    Function to calculate the expected amount of collateral for a given amount of `stablecoin`. This is exactly the same function as `get_collateral` but its needed to make the ABI the sam as the ABI for sfrxETH and wsETH.

    Returns: amount of collateral (`uint256`).

    | Input        | Type      | Description  |
    | ------------ | --------- | ------------ |
    | `stablecoin` | `uint256` | Amount of stablecoins to exchange. | 
    | `route_idx`  | `uint256` | Index of the route to use. | 

    ??? quote "Source code"

        === "LeverageZap.vy"

            ```python
            interface Router:
                def exchange_multiple(_route: address[9], _swap_params: uint256[3][4], _amount: uint256, _expected: uint256, _pools: address[4]) -> uint256: payable
                def get_exchange_multiple_amount(_route: address[9], _swap_params: uint256[3][4], _amount: uint256, _pools: address[4]) -> uint256: view

            @view
            @external
            @nonreentrant('lock')
            def get_collateral_underlying(stablecoin: uint256, route_idx: uint256) -> uint256:
                """
                @notice This method is needed just to make ABI the same as ABI for sfrxETH and wstETH
                """
                return self._get_collateral(stablecoin, route_idx)

            @view
            @internal
            def _get_collateral(stablecoin: uint256, route_idx: uint256) -> uint256:
                return ROUTER.get_exchange_multiple_amount(self.routes[route_idx], self.route_params[route_idx], stablecoin, self.route_pools[route_idx])
            ```

        === "CurveRegistryExchangeContract.vy"

            ```python
            @view
            @external
            def get_exchange_multiple_amount(
                _route: address[9],
                _swap_params: uint256[3][4],
                _amount: uint256,
                _pools: address[4]=[ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS]
            ) -> uint256:
                """
                @notice Get the current number the final output tokens received in an exchange
                @dev Routing and swap params must be determined off-chain. This
                    functionality is designed for gas efficiency over ease-of-use.
                @param _route Array of [initial token, pool, token, pool, token, ...]
                            The array is iterated until a pool address of 0x00, then the last
                            given token is transferred to `_receiver`
                @param _swap_params Multidimensional array of [i, j, swap type] where i and j are the correct
                                    values for the n'th pool in `_route`. The swap type should be
                                    1 for a stableswap `exchange`,
                                    2 for stableswap `exchange_underlying`,
                                    3 for a cryptoswap `exchange`,
                                    4 for a cryptoswap `exchange_underlying`,
                                    5 for factory metapools with lending base pool `exchange_underlying`,
                                    6 for factory crypto-meta pools underlying exchange (`exchange` method in zap),
                                    7-11 for wrapped coin (underlying for lending pool) -> LP token "exchange" (actually `add_liquidity`),
                                    12-14 for LP token -> wrapped coin (underlying for lending or fake pool) "exchange" (actually `remove_liquidity_one_coin`)
                                    15 for WETH -> ETH "exchange" (actually deposit/withdraw)
                @param _amount The amount of `_route[0]` token to be sent.
                @param _pools Array of pools for swaps via zap contracts. This parameter is only needed for
                            Polygon meta-factories underlying swaps.
                @return Expected amount of the final output token
                """
                amount: uint256 = _amount

                for i in range(1,5):
                    # 4 rounds of iteration to perform up to 4 swaps
                    swap: address = _route[i*2-1]
                    pool: address = _pools[i-1] # Only for Polygon meta-factories underlying swap (swap_type == 4)
                    params: uint256[3] = _swap_params[i-1]  # i, j, swap type

                    # Calc output amount according to the swap type
                    if params[2] == 1:
                        amount = CurvePool(swap).get_dy(convert(params[0], int128), convert(params[1], int128), amount)
                    elif params[2] == 2:
                        amount = CurvePool(swap).get_dy_underlying(convert(params[0], int128), convert(params[1], int128), amount)
                    elif params[2] == 3:
                        amount = CryptoPool(swap).get_dy(params[0], params[1], amount)
                    elif params[2] == 4:
                        amount = CryptoPool(swap).get_dy_underlying(params[0], params[1], amount)
                    elif params[2] == 5:
                        amount = CurvePool(pool).get_dy_underlying(convert(params[0], int128), convert(params[1], int128), amount)
                    elif params[2] == 6:
                        amount = CryptoMetaZap(swap).get_dy(pool, params[0], params[1], amount)
                    elif params[2] == 7:
                        _amounts: uint256[2] = [0, 0]
                        _amounts[params[0]] = amount
                        amount = BasePool2Coins(swap).calc_token_amount(_amounts, True)
                    elif params[2] in [8, 9]:
                        _amounts: uint256[3] = [0, 0, 0]
                        _amounts[params[0]] = amount
                        amount = BasePool3Coins(swap).calc_token_amount(_amounts, True)
                    elif params[2] == 10:
                        _amounts: uint256[4] = [0, 0, 0, 0]
                        _amounts[params[0]] = amount
                        amount = BasePool4Coins(swap).calc_token_amount(_amounts, True)
                    elif params[2] == 11:
                        _amounts: uint256[5] = [0, 0, 0, 0, 0]
                        _amounts[params[0]] = amount
                        amount = BasePool5Coins(swap).calc_token_amount(_amounts, True)
                    elif params[2] in [12, 13]:
                        # The number of coins doesn't matter here
                        amount = BasePool3Coins(swap).calc_withdraw_one_coin(amount, convert(params[1], int128))
                    elif params[2] == 14:
                        # The number of coins doesn't matter here
                        amount = CryptoBasePool3Coins(swap).calc_withdraw_one_coin(amount, params[1])
                    elif params[2] == 15:
                        # ETH <--> WETH rate is 1:1
                        pass
                    else:
                        raise "Bad swap type"

                    # check if this was the last swap
                    if i == 4 or _route[i*2+1] == ZERO_ADDRESS:
                        break

                return amount
            ```

    === "Example"
        ```shell
        >>> soon
        ```



---


## routes

### `route_count`
!!! description "`LeverageZap.route_count() -> uint256: view`"

    Getter for the total amount of routes.

    Returns: amount of routes (`uint256`).

    ??? quote "Source code"

        === "LeverageZap.vy"

            ```python
            routes_count: public(uint256)

            @external
            def __init__(
                    _controller: address,
                    _collateral: address,
                    _router: address,
                    _routes: DynArray[address[9], 20],
                    _route_params: DynArray[uint256[3][4], 20],
                    _route_pools: DynArray[address[4], 20],
                    _route_names: DynArray[String[64], 20],
            ):
                ...
                for i in range(20):
                    if i >= len(_routes):
                        break
                    self.routes[i] = _routes[i]
                    self.route_params[i] = _route_params[i]
                    self.route_pools[i] = _route_pools[i]
                    self.route_names[i] = _route_names[i]
                self.routes_count = len(_routes)
                ...
            ```

    === "Example"
        ```shell
        >>> LeverageZap.route_counts()
        5
        ```


### `routes`
!!! description "`LeverageZap.routes(arg0: uint256, arg1: uint256) -> address: view`"

    Getter for the pools and coins of a specific route.

    Returns: pool or coin (`address`).

    | Input  | Type      | Description  |
    | ------ | --------- | ------------ |
    | `arg0` | `uint256` | Index of the route. | 
    | `arg1` | `uint256` | Pool or coin of the route. | 

    ??? quote "Source code"

        === "LeverageZap.vy"

            ```python
            routes: public(HashMap[uint256, address[9]])

            @external
            def __init__(
                    _controller: address,
                    _collateral: address,
                    _router: address,
                    _routes: DynArray[address[9], 20],
                    _route_params: DynArray[uint256[3][4], 20],
                    _route_pools: DynArray[address[4], 20],
                    _route_names: DynArray[String[64], 20],
            ):
                CONTROLLER = _controller
                ROUTER = Router(_router)

                amm: address = Controller(_controller).amm()
                AMM = LLAMMA(amm)
                _A: uint256 = LLAMMA(amm).A()
                A = _A
                Aminus1 = _A - 1
                LOG2_A_RATIO = self.log2(_A * 10 ** 18 / unsafe_sub(_A, 1))
                SQRT_BAND_RATIO = isqrt(unsafe_div(10 ** 36 * _A, unsafe_sub(_A, 1)))
                COLLATERAL_PRECISION = pow_mod256(10, 18 - ERC20(_collateral).decimals())

                for i in range(20):
                    if i >= len(_routes):
                        break
                    self.routes[i] = _routes[i]
                    self.route_params[i] = _route_params[i]
                    self.route_pools[i] = _route_pools[i]
                    self.route_names[i] = _route_names[i]
                self.routes_count = len(_routes)

                ERC20(CRVUSD).approve(_router, max_value(uint256), default_return_value=True)
                ERC20(_collateral).approve(_controller, max_value(uint256), default_return_value=True)
            ```

    === "Example"
        ```shell
        >>> LeverageZap.routes(1, 0)
        '0xf939E0A03FB07F59A73314E73794Be0E57ac1b4E'    # crvUSD

        >>> LeverageZap.routes(1, 1)
        '0x4DEcE678ceceb27446b35C672dC7d61F30bAD69E'    # crvUSD/USDC pool

        >>> LeverageZap.routes(1, 2)
        '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'    # USDC

        >>> LeverageZap.routes(1, 3)
        '0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7'    # threepool (DAI, USDC, USDT)

        >>> LeverageZap.routes(1, 4)
        '0xdAC17F958D2ee523a2206206994597C13D831ec7'    # tether

        >>> LeverageZap.routes(1, 5)
        '0xD51a44d3FaE010294C616388b506AcdA1bfAAE46'    # tricrypto2 pool

        >>> LeverageZap.routes(1, 6)
        '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599'    # wBTC

        >>> LeverageZap.routes(1, 7)
        '0xB7ECB2AA52AA64a717180E030241bC75Cd946726'    # tBTC/wBTC pool

        >>> LeverageZap.routes(1, 8)
        '0x18084fbA666a33d37592fA2633fD49a74DD93a88'    # tBTC
        ```


### `route_params`
!!! description "`LeverageZap.`"

    Function to

    Returns:

    Emits: 

    ??? quote "Source code"

        === "LeverageZap.vy"

            ```python
            route_params: public(HashMap[uint256, uint256[3][4]])

            @external
            def __init__(
                    _controller: address,
                    _collateral: address,
                    _router: address,
                    _routes: DynArray[address[9], 20],
                    _route_params: DynArray[uint256[3][4], 20],
                    _route_pools: DynArray[address[4], 20],
                    _route_names: DynArray[String[64], 20],
            ):
                CONTROLLER = _controller
                ROUTER = Router(_router)

                amm: address = Controller(_controller).amm()
                AMM = LLAMMA(amm)
                _A: uint256 = LLAMMA(amm).A()
                A = _A
                Aminus1 = _A - 1
                LOG2_A_RATIO = self.log2(_A * 10 ** 18 / unsafe_sub(_A, 1))
                SQRT_BAND_RATIO = isqrt(unsafe_div(10 ** 36 * _A, unsafe_sub(_A, 1)))
                COLLATERAL_PRECISION = pow_mod256(10, 18 - ERC20(_collateral).decimals())

                for i in range(20):
                    if i >= len(_routes):
                        break
                    self.routes[i] = _routes[i]
                    self.route_params[i] = _route_params[i]
                    self.route_pools[i] = _route_pools[i]
                    self.route_names[i] = _route_names[i]
                self.routes_count = len(_routes)

                ERC20(CRVUSD).approve(_router, max_value(uint256), default_return_value=True)
                ERC20(_collateral).approve(_controller, max_value(uint256), default_return_value=True)
            ```

    === "Example"
        ```shell
        >>> LeverageZap.
        ''
        ```


### `route_pools`
!!! description "`LeverageZap.`"

    Getter for 

    Returns:

    Emits: 

    ??? quote "Source code"

        === "LeverageZap.vy"

            ```python
            route_pools: public(HashMap[uint256, address[4]])

            @external
            def __init__(
                    _controller: address,
                    _collateral: address,
                    _router: address,
                    _routes: DynArray[address[9], 20],
                    _route_params: DynArray[uint256[3][4], 20],
                    _route_pools: DynArray[address[4], 20],
                    _route_names: DynArray[String[64], 20],
            ):
                CONTROLLER = _controller
                ROUTER = Router(_router)

                amm: address = Controller(_controller).amm()
                AMM = LLAMMA(amm)
                _A: uint256 = LLAMMA(amm).A()
                A = _A
                Aminus1 = _A - 1
                LOG2_A_RATIO = self.log2(_A * 10 ** 18 / unsafe_sub(_A, 1))
                SQRT_BAND_RATIO = isqrt(unsafe_div(10 ** 36 * _A, unsafe_sub(_A, 1)))
                COLLATERAL_PRECISION = pow_mod256(10, 18 - ERC20(_collateral).decimals())

                for i in range(20):
                    if i >= len(_routes):
                        break
                    self.routes[i] = _routes[i]
                    self.route_params[i] = _route_params[i]
                    self.route_pools[i] = _route_pools[i]
                    self.route_names[i] = _route_names[i]
                self.routes_count = len(_routes)

                ERC20(CRVUSD).approve(_router, max_value(uint256), default_return_value=True)
                ERC20(_collateral).approve(_controller, max_value(uint256), default_return_value=True)
            ```

    === "Example"
        ```shell
        >>> LeverageZap.
        ''
        ```


### `route_names`
!!! description "`LeverageZap.route_names(arg0: uint256) -> String[64]: view`"

    Getter for the route name of a route.

    Returns: route name (`String[64]`).

    | Input        | Type      | Description  |
    | ------------ | --------- | ------------ |
    | `arg0` | `uint256` | Index of the route. | 

    ??? quote "Source code"

        === "LeverageZap.vy"

            ```python
            route_names: public(HashMap[uint256, String[64]])

            @external
            def __init__(
                    _controller: address,
                    _collateral: address,
                    _router: address,
                    _routes: DynArray[address[9], 20],
                    _route_params: DynArray[uint256[3][4], 20],
                    _route_pools: DynArray[address[4], 20],
                    _route_names: DynArray[String[64], 20],
            ):
                ...
                for i in range(20):
                    if i >= len(_routes):
                        break
                    self.routes[i] = _routes[i]
                    self.route_params[i] = _route_params[i]
                    self.route_pools[i] = _route_pools[i]
                    self.route_names[i] = _route_names[i]
                self.routes_count = len(_routes)
                ...
            ```

    === "Example"
        ```shell
        >>> LeverageZap.route_names(0)
        'factory-tricrypto-2 (TricryptoLLAMA)'

        >>> LeverageZap.route_names(1)
        'crvUSD/USDC -> 3pool -> tricrypto2 -> factory-crvusd-16 (tBTC/WBTC)'
        ```


---

### `calculate_debt_n1`


## max borrowable
### `max_borrowable`
### `max_collateral`
### `max_borrowable_and_collateral`




### `callback_deposit`



---



!!! description "`LeverageZap.`"

    Function to

    Returns:

    Emits: 

    ??? quote "Source code"

        === "LeverageZap.vy"

            ```python
            ```

    === "Example"
        ```shell
        >>> LeverageZap.
        ''
        ```