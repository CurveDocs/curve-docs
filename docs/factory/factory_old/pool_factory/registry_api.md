# Factory Getters

Each pool factory has a built-in registry:

### `metapool_implementations`

!!! description "`Factory.metapool_implementations(_base_pool: address) -> address[10]`"

    Get a list of implementation contracts for metapools targetting the given base pool.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_base_pool` |  `address` | Address of the base pool |

    ??? quote "Source code"

        ```vyper
        @view
        @external
        def metapool_implementations(_base_pool: address) -> address[10]:
            """
            @notice Get a list of implementation contracts for metapools targetting the given base pool
            @dev A base pool is the pool for the LP token contained within the metapool
            @param _base_pool Address of the base pool
            @return List of implementation contract addresses
            """
            return self.base_pool_data[_base_pool].implementations
        ```

    === "Example"

        ```shell
        >>> todo: 
        ```

# Find Pools

The following getter methods are available for finding pools that were deployed via the factory:

### `pool_count`

!!! description "`Factory.pool_count() → uint256: view`"

    Returns the total number of pools that the factory has deployed.

    ??? quote "Source code"

        ```vyper
        pool_count: public(uint256)              # actual length of pool_list
        ...
        ```

    === "Example"

        ```shell
        >>> todo:
        ```

### `pool_list`

!!! description "`Factory.pool_list(i: uint256) → address: view`"

    Returns the n’th entry in a zero-indexed array of deployed pools. Returns `ZERO_ADDRESS` when `i` is greater than 
    the number of deployed pools.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `i` |  `uint256` | Pool index |

    ??? quote "Source code"

        ```vyper
        pool_list: public(address[4294967296])   # master list of pools
        ...
        ```

    === "Example"

        ```shell
        >>> todo:
        ```

    !!! note

        As factory-deployed pools are not killable, they cannot be removed from the registry. For this 
        reason the ordering of pools within this array will never change.

### `find_pool_for_coins`

!!! description "`Factory.find_pool_for_coins(_from: address, _to: address, i: uint256 = 0) → address: view`"

    Finds a pool allowing swaps between `_from` and `_to`. You can optionally include `i` to get the i-th pool, 
    when multiple pools exist for the given pairing. The order of `_from` and `_to` does not affect the result.
    
    Returns `ZERO_ADDRESS` when swaps are impossible for the pair or `i` exceeds the number of available pools.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_from` |  `address` | Coin to swap from |
    | `_to` |  `address` | Coin to swap to |
    | `i` |  `uint256` | Optional index to get the i-th pool from the output. Defaults to zero. |

    ??? quote "Source code"

        ```vyper
        @view
        @external
        def find_pool_for_coins(_from: address, _to: address, i: uint256 = 0) -> address:
            """
            @notice Find an available pool for exchanging two coins
            @param _from Address of coin to be sent
            @param _to Address of coin to be received
            @param i Index value. When multiple pools are available
                    this value is used to return the n'th address.
            @return Pool address
            """
            key: uint256 = bitwise_xor(convert(_from, uint256), convert(_to, uint256))
            return self.markets[key][i]
        ```

    === "Example"

        ```shell
        >>> esd = Contract('0x36F3FD68E7325a35EB768F1AedaAe9EA0689d723')
        >>> usdc = Contract('0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48')
        
        >>> factory.find_pool_for_coins(esd, usdc)
        '0xFD9f9784ac00432794c8D370d4910D2a3782324C'
        ```

# Get Pool Info

The factory has a similar API to that of the main Registry, which can be used to query information about existing pools.

## Coins and Coin Info

### `get_n_coins`

!!! description "`Factory.get_n_coins(pool: address) → (uint256): view`"

    Get the number of coins and underlying coins within a pool. Returns a tuple of `uint256` representing number
    of coins at their respective indices in the pool being queried.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `pool` |  `address` | Address of the pool |

    ??? quote "Source code"

        ```vyper
        @view
        @external
        def get_n_coins(_pool: address) -> (uint256):
            """
            @notice Get the number of coins in a pool
            @param _pool Pool address
            @return Number of coins
            """
            return self.pool_data[_pool].n_coins
        ```

    === "Example"

        ```shell
        >>> factory.get_n_coins('0xFD9f9784ac00432794c8D370d4910D2a3782324C')
        todo: 
        ```

### `get_coins`

!!! description "`Factory.get_coins(_pool: address) -> address[4]`"

    Get a list of the swappable coins within a pool. Returns a list of `address` of coins at their respective indices.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_pool` |  `address` | Address of the pool |

    ??? quote "Source code"

        ```vyper
        @view
        @external
        def get_coins(_pool: address) -> address[4]:
            """
            @notice Get the coins within a pool
            @param _pool Pool address
            @return List of coin addresses
            """
            return self.pool_data[_pool].coins
        ```

    === "Example"

        ```shell
        >>> factory.get_coins('0xFD9f9784ac00432794c8D370d4910D2a3782324C')
        ("0x36F3FD68E7325a35EB768F1AedaAe9EA0689d723", "0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490")
        ```

### `get_underlying_coins`

!!! description "`Factory.get_underlying_coins(pool: address) → address[8]: view`"

    Get a list of the swappable underlying coins within a pool. Returns a list of `address` of coins at their 
    respective indices.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_pool` |  `address` | Address of the pool |

    ??? quote "Source code"

        ```vyper
        @view
        @external
        def get_underlying_coins(_pool: address) -> address[MAX_COINS]:
            """
            @notice Get the underlying coins within a pool
            @dev Reverts if a pool does not exist or is not a metapool
            @param _pool Pool address
            @return List of coin addresses
            """
            coins: address[MAX_COINS] = empty(address[MAX_COINS])
            base_pool: address = self.pool_data[_pool].base_pool
            assert base_pool != ZERO_ADDRESS  # dev: pool is not metapool
            coins[0] = self.pool_data[_pool].coins[0]
            for i in range(1, MAX_COINS):
                coins[i] = self.base_pool_data[base_pool].coins[i - 1]
                if coins[i] == ZERO_ADDRESS:
                    break
        
            return coins
        ```

    === "Example"

        ```shell
        >>> factory.get_underlying_coins('0xFD9f9784ac00432794c8D370d4910D2a3782324C')
        (
            "0x36F3FD68E7325a35EB768F1AedaAe9EA0689d723", 
            "0x6B175474E89094C44Da98b954EedeAC495271d0F", 
            "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", 
            "0xdAC17F958D2ee523a2206206994597C13D831ec7", 
            "0x0000000000000000000000000000000000000000", 
            "0x0000000000000000000000000000000000000000", 
            "0x0000000000000000000000000000000000000000", 
            "0x0000000000000000000000000000000000000000"
        )
        ```

### `get_decimals`

!!! description "`Factory.get_decimals(pool: address) → uint256[8]: view`"

    Get a list of decimal places for each coin within a pool.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_pool` |  `address` | Address of the pool |

    ??? quote "Source code"

        ```vyper
        @view
        @external
        def get_decimals(_pool: address) -> uint256[MAX_PLAIN_COINS]:
            """
            @notice Get decimal places for each coin within a pool
            @param _pool Pool address
            @return uint256 list of decimals
            """
            if self.pool_data[_pool].base_pool != ZERO_ADDRESS:
                decimals: uint256[MAX_PLAIN_COINS] = empty(uint256[MAX_PLAIN_COINS])
                decimals = self.pool_data[_pool].decimals
                decimals[1] = 18
                return decimals
            return self.pool_data[_pool].decimals
        ```

    === "Example"

        ```shell
        >>> factory.get_decimals('0xFD9f9784ac00432794c8D370d4910D2a3782324C')
        (18, 18, 0, 0, 0, 0, 0, 0)
        ```

### `get_underlying_decimals`

!!! description "`Factory.get_underlying_decimals(pool: address) → uint256[8]: view`"

    Get a list of decimal places for each underlying coin within a pool.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_pool` |  `address` | Address of the pool |

    ??? quote "Source code"

        ```vyper
        @view
        @external
        def get_underlying_decimals(_pool: address) -> uint256[MAX_COINS]:
            """
            @notice Get decimal places for each underlying coin within a pool
            @param _pool Pool address
            @return uint256 list of decimals
            """
            # decimals are tightly packed as a series of uint8 within a little-endian bytes32
            # the packed value is stored as uint256 to simplify unpacking via shift and modulo
            pool_decimals: uint256[MAX_PLAIN_COINS] = empty(uint256[MAX_PLAIN_COINS])
            pool_decimals = self.pool_data[_pool].decimals
            decimals: uint256[MAX_COINS] = empty(uint256[MAX_COINS])
            decimals[0] = pool_decimals[0]
            base_pool: address = self.pool_data[_pool].base_pool
            packed_decimals: uint256 = self.base_pool_data[base_pool].decimals
            for i in range(MAX_COINS):
                unpacked: uint256 = shift(packed_decimals, -8 * i) % 256
                if unpacked == 0:
                    break
                decimals[i+1] = unpacked
        
            return decimals
        ```

    === "Example"

        ```shell
        >>> factory.get_decimals('0xFD9f9784ac00432794c8D370d4910D2a3782324C')
        (18, 18, 0, 0, 0, 0, 0, 0)
        ```

    !!! note

        The return value is identical to ``Registry.get_decimals``for pools that do not involve lending. 
        Non-lending coins that still involve querying a rate (e.g. renBTC) are marked as having `0` decimals.

### `get_coin_indices`

!!! description "`Factory.get_coin_indices(pool: address, _from: address, _to: address) → (int128, int128, bool): view`"

    Convert coin addresses into indices for use with pool methods. Returns the index of `_from`, index of `_to`, 
    and a `bool` indicates if the coins are underlying the given pool.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `pool` |  `address` | Address of the pool |
    | `_from` |  `address` | Address of the `from` coin |
    | `_to` |  `address` | Address of the `to` coin |

    ??? quote "Source code"

        ```vyper
        @view
        @external
        def get_coin_indices(
            _pool: address,
            _from: address,
            _to: address
        ) -> (int128, int128, bool):
            """
            @notice Convert coin addresses to indices for use with pool methods
            @param _pool Pool address
            @param _from Coin address to be used as `i` within a pool
            @param _to Coin address to be used as `j` within a pool
            @return int128 `i`, int128 `j`, boolean indicating if `i` and `j` are underlying coins
            """
            coin: address = self.pool_data[_pool].coins[0]
            base_pool: address = self.pool_data[_pool].base_pool
            if coin in [_from, _to] and base_pool != ZERO_ADDRESS:
                base_lp_token: address = self.pool_data[_pool].coins[1]
                if base_lp_token in [_from, _to]:
                    # True and False convert to 1 and 0 - a bit of voodoo that
                    # works because we only ever have 2 non-underlying coins if base pool is ZERO_ADDRESS
                    return convert(_to == coin, int128), convert(_from == coin, int128), False
        
            found_market: bool = False
            i: int128 = 0
            j: int128 = 0
            for x in range(MAX_COINS):
                if base_pool == ZERO_ADDRESS:
                    if x >= MAX_PLAIN_COINS:
                        raise "No available market"
                    if x != 0:
                        coin = self.pool_data[_pool].coins[x]
                else:
                    if x != 0:
                        coin = self.base_pool_data[base_pool].coins[x-1]
                if coin == ZERO_ADDRESS:
                    raise "No available market"
                if coin == _from:
                    i = x
                elif coin == _to:
                    j = x
                else:
                    continue
                if found_market:
                    # the second time we find a match, break out of the loop
                    break
                # the first time we find a match, set `found_market` to True
                found_market = True
        
            return i, j, True
        ```

    === "Example"

        ```shell
        >>> factory.get_coin_indices('0xFD9f9784ac00432794c8D370d4910D2a3782324C', '0xdac17f958d2ee523a2206206994597c13d831ec7', '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48')
        (2, 1, True)
        ```

        Based on the above call, we know:

        - the index of the coin we are swapping out of is `2`
        - the index of the coin we are swapping into is `1`
        - the coins are considered underlying, so we must call `exchange_underlying`

        From this information we can perform a token swap:

        ```shell
        >>> swap = Contract('0xFD9f9784ac00432794c8D370d4910D2a3782324C')
        >>> swap.exchange_underlying(2, 1, 1e18, 0, {'from': alice})
        ```

### `get_gauge`

!!! description "`Factory.get_gauge(_pool: address) -> address`"

    Get the address of the liquidity gauge contract for a factory pool.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_pool` |  `address` | Address of the pool |

    ??? quote "Source code"

        ```vyper
        @view
        @external
        def get_gauge(_pool: address) -> address:
            """
            @notice Get the address of the liquidity gauge contract for a factory pool
            @dev Returns `ZERO_ADDRESS` if a gauge has not been deployed
            @param _pool Pool address
            @return Implementation contract address
            """
            return self.pool_data[_pool].liquidity_gauge
        ```

    === "Example"

        ```shell
        >>> todo: 
        ```

### `get_implementation_address`

!!! description "`Factory.get_implementation_address(_pool: address) -> address`"

    Get the address of the implementation contract used for a factory pool.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_pool` |  `address` | Address of the pool |


    ??? quote "Source code"

        ```vyper
        @view
        @external
        def get_implementation_address(_pool: address) -> address:
            """
            @notice Get the address of the implementation contract used for a factory pool
            @param _pool Pool address
            @return Implementation contract address
            """
            return self.pool_data[_pool].implementation
        ```

    === "Example"

        ```shell
        >>> todo: 
        ```

### `is_meta`

!!! description "`Factory.is_meta(_pool: address) -> bool`"

    Verify `_pool` is a metapool. Returns `True` if pool is indeed a metapool, else `False`. 

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_pool` |  `address` | Address of the pool |

    ??? quote "Source code"

        ```vyper
        @view
        @external
        def is_meta(_pool: address) -> bool:
            """
            @notice Verify `_pool` is a metapool
            @param _pool Pool address
            @return True if `_pool` is a metapool
            """
            return self.pool_data[_pool].base_pool != ZERO_ADDRESS
        ```

    === "Example"

        ```shell
        >>> todo: 
        ```

### `get_pool_asset_type`

!!! description "`Factory.get_pool_asset_type(_pool: address) -> uint256`"

    Query the asset type of `_pool`.

    Returns: `0` = USD, `1` = ETH, `2` = BTC, `3` = Other

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_pool` |  `address` | Address of the pool |

    ??? quote "Source code"

        ```vyper
        @view
        @external
        def get_pool_asset_type(_pool: address) -> uint256:
            """
            @notice Query the asset type of `_pool`
            @dev 0 = USD, 1 = ETH, 2 = BTC, 3 = Other
            @param _pool Pool Address
            @return Integer indicating the pool asset type
            """
            base_pool: address = self.pool_data[_pool].base_pool
            if base_pool == ZERO_ADDRESS:
                return self.pool_data[_pool].asset_type
            else:
                return self.base_pool_data[base_pool].asset_type
        ```

    === "Example"

        ```shell
        >>> todo: 
        ```

### `get_fee_receiver`

!!! description "`Factory.get_fee_receiver(_pool: address) -> address`"

    Get the `address` of the fee receiver of a factory deployed pool.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_pool` |  `address` | Address of the pool |

    ??? quote "Source code"

        ```vyper
        @view
        @external
        def get_fee_receiver(_pool: address) -> address:
            base_pool: address = self.pool_data[_pool].base_pool
            if base_pool == ZERO_ADDRESS:
                return self.fee_receiver
            else:
                return self.base_pool_data[base_pool].fee_receiver
        ```

    === "Example"

        ```shell
        >>> todo: 
        ```


## Balances and Rates

### `get_balances`

!!! description "`Factory.get_balances(_pool: address) → uint256[2]: view`"

    Get available balances for each coin within a pool.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_pool` |  `address` | Address of the pool |

    ??? quote "Source code"

        ```vyper
        @view
        @external
        def get_balances(_pool: address) -> uint256[MAX_PLAIN_COINS]:
            """
            @notice Get balances for each coin within a pool
            @dev For pools using lending, these are the wrapped coin balances
            @param _pool Pool address
            @return uint256 list of balances
            """
            if self.pool_data[_pool].base_pool != ZERO_ADDRESS:
                return [CurvePool(_pool).balances(0), CurvePool(_pool).balances(1), 0, 0]
            n_coins: uint256 = self.pool_data[_pool].n_coins
            balances: uint256[MAX_PLAIN_COINS] = empty(uint256[MAX_PLAIN_COINS])
            for i in range(MAX_PLAIN_COINS):
                if i < n_coins:
                    balances[i] = CurvePool(_pool).balances(i)
                else:
                    balances[i] = 0
            return balances
        ```

    === "Example"

        ```shell
        >>> factory.get_balances('0xFD9f9784ac00432794c8D370d4910D2a3782324C')
        (11428161394428689823275227, 47831326741306)   
        ```

    !!! note

        These values are not necessarily the same as calling `Token.balanceOf(pool)` as the total balance also includes 
        unclaimed admin fees.

### `get_underlying_balances`

!!! description "`Factory.get_underlying_balances(pool: address) → uint256[8]: view`"

    Get balances for each underlying coin within a pool.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_pool` |  `address` | Address of the pool |

    ??? quote "Source code"

        ```vyper
        @view
        @external
        def get_underlying_balances(_pool: address) -> uint256[MAX_COINS]:
            """
            @notice Get balances for each underlying coin within a metapool
            @param _pool Metapool address
            @return uint256 list of underlying balances
            """
        
            underlying_balances: uint256[MAX_COINS] = empty(uint256[MAX_COINS])
            underlying_balances[0] = CurvePool(_pool).balances(0)
        
            base_total_supply: uint256 = ERC20(self.pool_data[_pool].coins[1]).totalSupply()
            if base_total_supply > 0:
                underlying_pct: uint256 = CurvePool(_pool).balances(1) * 10**36 / base_total_supply
                base_pool: address = self.pool_data[_pool].base_pool
                assert base_pool != ZERO_ADDRESS  # dev: pool is not a metapool
                n_coins: uint256 = self.base_pool_data[base_pool].n_coins
                for i in range(MAX_COINS):
                    if i == n_coins:
                        break
                    underlying_balances[i + 1] = CurvePool(base_pool).balances(i) * underlying_pct / 10**36
        
            return underlying_balances
        ```

    === "Example"

        ```shell
        >>> factory.get_underlying_balances('0xFD9f9784ac00432794c8D370d4910D2a3782324C')
        (
            11876658145799734093379928, 
            48715210997790596223520238, 
            46553896776332824101242804, 
            49543896565857325657915396, 
            0, 
            0, 
            0, 
            0
        )  
        ```

### `get_admin_balances`

!!! description "`Factory.get_admin_balances(pool: address) → uint256[2]: view`"

    Get the current admin balances (uncollected fees) for a pool.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_pool` |  `address` | Address of the pool |

    ??? quote "Source code"

        ```vyper
        @view
        @external
        def get_admin_balances(_pool: address) -> uint256[MAX_PLAIN_COINS]:
            """
            @notice Get the current admin balances (uncollected fees) for a pool
            @param _pool Pool address
            @return List of uint256 admin balances
            """
            n_coins: uint256 = self.pool_data[_pool].n_coins
            admin_balances: uint256[MAX_PLAIN_COINS] = empty(uint256[MAX_PLAIN_COINS])
            for i in range(MAX_PLAIN_COINS):
                if i == n_coins:
                    break
                admin_balances[i] = CurvePool(_pool).admin_balances(i)
            return admin_balances
        ```

    === "Example"

        ```shell
        >>> factory.get_admin_balances('0xFD9f9784ac00432794c8D370d4910D2a3782324C')
        (10800690926373756722358, 30891687335)  
        ```

### `get_metapool_rates`

!!! description "`Factory.get_metapool_rates(_pool: address) → uint256[2]: view`"

    Get rates for coins within a metapool. Returns rates for each coin, precision normalized to `10**18` precision.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_pool` |  `address` | Address of the pool |

    ??? quote "Source code"

        ```vyper
        @view
        @external
        def get_metapool_rates(_pool: address) -> uint256[2]:
            """
            @notice Get rates for coins within a metapool
            @param _pool Pool address
            @return Rates for each coin, precision normalized to 10**18
            """
            rates: uint256[2] = [10**18, 0]
            rates[1] = CurvePool(self.pool_data[_pool].base_pool).get_virtual_price()
            return rates
        ```

    === "Example"

        ```shell
        >>> factory.get_rates('0xFD9f9784ac00432794c8D370d4910D2a3782324C')
        todo:
        ```
