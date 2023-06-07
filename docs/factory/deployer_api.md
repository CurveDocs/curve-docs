# Deployer API

## Deploy Pool

!!! note

    After deploying a pool, you must also add initial liquidity before the pool can be used.

### `Factory.deploy_plain_pool`

!!! description "`Factory.deploy_plain_pool(_name: String[32], _symbol: String[10], _coins: address[4], _A: uint256, _fee: uint256, _asset_type: uint256 = 0, _implementation_idx: uint256 = 0) → address: nonpayable`"

    Deploys a new plain pool. Returns `address` of the deployed pool.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_name` |  `String[32]` | Name of the new plain pool |
    | `_symbol` |  `String[10]` | Symbol for the new metapool’s LP token. This value will be concatenated with the factory symbol. |
    | `_coins` |  `address[4]` | List of addresses of the coins being used in the pool |
    | `_A` |  `uint256` | Amplification coefficient |
    | `_fee` |  `uint256` | Trade fee, given as an integer with `1e10` precision |
    | `_asset_type` |  `uint256` | Asset type of the pool as an integer. 0 = `USD`, 1 = `ETH`, 2 = `BTC`, 3 = Other. |
    | `_implementation_idx` |  `uint256` | Index of the implementation to use. All possible implementations for a pool of N_COINS can be publicly accessed via `plain_implementations(N_COINS)`. |

    Emits: <mark style="background-color: #FFD580; color: black">PlainPoolDeployed</mark>

    ??? quote "Source code"

        ```python
        MAX_PLAIN_COINS: constant(int128) = 4  # max coins in a plain pool

        ...

        @external
        def deploy_plain_pool(
            _name: String[32],
            _symbol: String[10],
            _coins: address[MAX_PLAIN_COINS],
            _A: uint256,
            _fee: uint256,
            _asset_type: uint256 = 0,
            _implementation_idx: uint256 = 0,
        ) -> address:
            """
            @notice Deploy a new plain pool
            @param _name Name of the new plain pool
            @param _symbol Symbol for the new plain pool - will be
                           concatenated with factory symbol
            @param _coins List of addresses of the coins being used in the pool.
            @param _A Amplification co-efficient - a lower value here means
                      less tolerance for imbalance within the pool's assets.
                      Suggested values include:
                       * Uncollateralized algorithmic stablecoins: 5-10
                       * Non-redeemable, collateralized assets: 100
                       * Redeemable assets: 200-400
            @param _fee Trade fee, given as an integer with 1e10 precision. The
                        minimum fee is 0.04% (4000000), the maximum is 1% (100000000).
                        50% of the fee is distributed to veCRV holders.
            @param _asset_type Asset type for pool, as an integer
                               0 = USD, 1 = ETH, 2 = BTC, 3 = Other
            @param _implementation_idx Index of the implementation to use. All possible
                        implementations for a pool of N_COINS can be publicly accessed
                        via `plain_implementations(N_COINS)`
            @return Address of the deployed pool
            """
            # fee must be between 0.04% and 1%
            assert _fee >= 4000000 and _fee <= 100000000, "Invalid fee"
        
            n_coins: uint256 = MAX_PLAIN_COINS
            rate_multipliers: uint256[MAX_PLAIN_COINS] = empty(uint256[MAX_PLAIN_COINS])
            decimals: uint256[MAX_PLAIN_COINS] = empty(uint256[MAX_PLAIN_COINS])
        
            for i in range(MAX_PLAIN_COINS):
                coin: address = _coins[i]
                if coin == ZERO_ADDRESS:
                    assert i > 1, "Insufficient coins"
                    n_coins = i
                    break
                assert self.base_pool_assets[coin] == False, "Invalid asset, deploy a metapool"
        
                if _coins[i] == 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE:
                    assert i == 0, "ETH must be first coin"
                    decimals[0] = 18
                else:
                    decimals[i] = ERC20(coin).decimals()
                    assert decimals[i] < 19, "Max 18 decimals for coins"
        
                rate_multipliers[i] = 10 ** (36 - decimals[i])
        
                for x in range(i, i+MAX_PLAIN_COINS):
                    if x+1 == MAX_PLAIN_COINS:
                        break
                    if _coins[x+1] == ZERO_ADDRESS:
                        break
                    assert coin != _coins[x+1], "Duplicate coins"
        
            implementation: address = self.plain_implementations[n_coins][_implementation_idx]
            assert implementation != ZERO_ADDRESS, "Invalid implementation index"
            pool: address = create_forwarder_to(implementation)
            CurvePlainPool(pool).initialize(_name, _symbol, _coins, rate_multipliers, _A, _fee)
        
            length: uint256 = self.pool_count
            self.pool_list[length] = pool
            self.pool_count = length + 1
            self.pool_data[pool].decimals = decimals
            self.pool_data[pool].n_coins = n_coins
            self.pool_data[pool].base_pool = ZERO_ADDRESS
            self.pool_data[pool].implementation = implementation
            if _asset_type != 0:
                self.pool_data[pool].asset_type = _asset_type
        
            for i in range(MAX_PLAIN_COINS):
                coin: address = _coins[i]
                if coin == ZERO_ADDRESS:
                    break
                self.pool_data[pool].coins[i] = coin
                raw_call(
                    coin,
                    concat(
                        method_id("approve(address,uint256)"),
                        convert(pool, bytes32),
                        convert(MAX_UINT256, bytes32)
                    )
                )
                for j in range(MAX_PLAIN_COINS):
                    if i < j:
                        swappable_coin: address = _coins[j]
                        key: uint256 = bitwise_xor(convert(coin, uint256), convert(swappable_coin, uint256))
                        length = self.market_counts[key]
                        self.markets[key][length] = pool
                        self.market_counts[key] = length + 1
        
            log PlainPoolDeployed(_coins, _A, _fee, msg.sender)
            return pool
        ```

    === "Example"

        ```shell
        >>> factory = Contract('0xB9fC157394Af804a3578134A6585C0dc9cc990d4')
        >>> esd = Contract('0x36F3FD68E7325a35EB768F1AedaAe9EA0689d723')
        >>> todo:
        ```


### `Factory.deploy_metapool`

!!! description "`Factory.deploy_metapool(_base_pool: address, _name: String[32], _symbol: String[10], _coin: address, _A: uint256, _fee: uint256) → address: nonpayable`"

    Deploys a new metapool. Returns `address` of the deployed pool.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_base_pool` |  `address` | Address of the base pool to use within the new metapool |
    | `_name` |  `String[32]` | Name of the new metapool |
    | `_symbol` |  `String[10]` | Symbol for the new metapool’s LP token. This value will be concatenated with the base pool symbol. |
    | `_coin` |  `address` | Address of the coin being used in the metapool |
    | `_A` |  `uint256` | Amplification coefficient |
    | `_fee` |  `uint256` | Trade fee, given as an integer with `1e10` precision |

    Emits: <mark style="background-color: #FFD580; color: black">MetaPoolDeployed</mark>

    ??? quote "Source code"

        ```python
        @external
        def deploy_metapool(
            _base_pool: address,
            _name: String[32],
            _symbol: String[10],
            _coin: address,
            _A: uint256,
            _fee: uint256,
            _implementation_idx: uint256 = 0,
        ) -> address:
            """
            @notice Deploy a new metapool
            @param _base_pool Address of the base pool to use
                              within the metapool
            @param _name Name of the new metapool
            @param _symbol Symbol for the new metapool - will be
                           concatenated with the base pool symbol
            @param _coin Address of the coin being used in the metapool
            @param _A Amplification co-efficient - a higher value here means
                      less tolerance for imbalance within the pool's assets.
                      Suggested values include:
                       * Uncollateralized algorithmic stablecoins: 5-10
                       * Non-redeemable, collateralized assets: 100
                       * Redeemable assets: 200-400
            @param _fee Trade fee, given as an integer with 1e10 precision. The
                        minimum fee is 0.04% (4000000), the maximum is 1% (100000000).
                        50% of the fee is distributed to veCRV holders.
            @param _implementation_idx Index of the implementation to use. All possible
                        implementations for a BASE_POOL can be publicly accessed
                        via `metapool_implementations(BASE_POOL)`
            @return Address of the deployed pool
            """
            # fee must be between 0.04% and 1%
            assert _fee >= 4000000 and _fee <= 100000000, "Invalid fee"
        
            implementation: address = self.base_pool_data[_base_pool].implementations[_implementation_idx]
            assert implementation != ZERO_ADDRESS, "Invalid implementation index"
        
            # things break if a token has >18 decimals
            decimals: uint256 = ERC20(_coin).decimals()
            assert decimals < 19, "Max 18 decimals for coins"
        
            pool: address = create_forwarder_to(implementation)
            CurvePool(pool).initialize(_name, _symbol, _coin, 10 ** (36 - decimals), _A, _fee)
            ERC20(_coin).approve(pool, MAX_UINT256)
        
            # add pool to pool_list
            length: uint256 = self.pool_count
            self.pool_list[length] = pool
            self.pool_count = length + 1
        
            base_lp_token: address = self.base_pool_data[_base_pool].lp_token
        
            self.pool_data[pool].decimals = [decimals, 0, 0, 0]
            self.pool_data[pool].n_coins = 2
            self.pool_data[pool].base_pool = _base_pool
            self.pool_data[pool].coins[0] = _coin
            self.pool_data[pool].coins[1] = self.base_pool_data[_base_pool].lp_token
            self.pool_data[pool].implementation = implementation
        
            is_finished: bool = False
            for i in range(MAX_COINS):
                swappable_coin: address = self.base_pool_data[_base_pool].coins[i]
                if swappable_coin == ZERO_ADDRESS:
                    is_finished = True
                    swappable_coin = base_lp_token
        
                key: uint256 = bitwise_xor(convert(_coin, uint256), convert(swappable_coin, uint256))
                length = self.market_counts[key]
                self.markets[key][length] = pool
                self.market_counts[key] = length + 1
                if is_finished:
                    break
        
            log MetaPoolDeployed(_coin, _base_pool, _A, _fee, msg.sender)
            return pool
        ```

    === "Example"

        ```shell
        >>> factory = Contract('0xB9fC157394Af804a3578134A6585C0dc9cc990d4')
        >>> esd = Contract('0x36F3FD68E7325a35EB768F1AedaAe9EA0689d723')
        >>> threepool = Contract('0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7')
        
        >>> tx = factory.deploy_metapool(threepool, "Empty Set Dollar", "ESD", esd, 10, 4000000, {'from': alice})
        Transaction sent: 0x2702cfc4b96be1877f853c246be567cbe8f80ef7a56348ace1d17c026bc31b68
          Gas price: 20 gwei   Gas limit: 1100000   Nonce: 9
        
        >>> tx.return_value
        "0xFD9f9784ac00432794c8D370d4910D2a3782324C"
        ```

## Deploy Gauge

### `Factory.deploy_gauge`

!!! description "`Factory.deploy_gauge(_pool: address) -> address`"

    Deploy a liquidity gauge for a factory pool. The deployed gauge implementation is whatever the factory admin
    has set `Factory.gauge_implementation` to.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_pool` |  `address` | Factory pool address to deploy a gauge for |

    ??? quote "Source code"

        ```python
        @external
        def deploy_gauge(_pool: address) -> address:
            """
            @notice Deploy a liquidity gauge for a factory pool
            @param _pool Factory pool address to deploy a gauge for
            @return Address of the deployed gauge
            """
            assert self.pool_data[_pool].coins[0] != ZERO_ADDRESS, "Unknown pool"
            assert self.pool_data[_pool].liquidity_gauge == ZERO_ADDRESS, "Gauge already deployed"
            implementation: address = self.gauge_implementation
            assert implementation != ZERO_ADDRESS, "Gauge implementation not set"
        
            gauge: address = create_forwarder_to(implementation)
            LiquidityGauge(gauge).initialize(_pool)
            self.pool_data[_pool].liquidity_gauge = gauge
        
            log LiquidityGaugeDeployed(_pool, gauge)
            return gauge
        ```

    === "Example"

        ```shell
        >>> todo: 
        ```
