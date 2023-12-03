## **Liquidity Pools**

!!!warning
    Transaction will fail if the requirements are not met.

The pool **deployment is permissionless**, but it must adhere to certain parameter limitations:

| Parameter | Limitation |
| --------- | ---------- |
| `_fee` | 4000000 (0.04%) ≤ `_fee` ≤ 100000000 (1%) |

- Valid **`_implementation_idx`** (cannot be **`ZERO_ADDRESS`**).
- Minimum of 2 coins and maximum of 4 coins.
- Cannot pair with a coin which is included in a basepool.
- If paired against plain ETH (0xE...EeE), ETH must be the first coin of the pool (**`_coins[0] = plain ETH`**).
- Maximum of 18 decimals for the coins.
- No duplicate coins.

!!! description "`Factory.deploy_plain_pool(_name: String[32], _symbol: String[10], _coins: address[4], _A: uint256, _fee: uint256, _asset_type: uint256 = 0, _implementation_idx: uint256 = 0) → address: nonpayable`"

    Function to deploy a plain pool.

    Returns: Deployed pool (`address`).

    Emits: `PlainPoolDeployed`

    | Input                | Type          | Description |
    | -------------------- | ------------- | ----------- |
    | `_name`              | `String[32]`  | Name of the new plain pool |
    | `_symbol`            | `String[10]`  | Symbol for the new pool’s LP token. This value will be concatenated with the factory symbol |
    | `_coins`             | `address[4]`  | List of addresses of the coins being used in the pool |
    | `_A`                 | `uint256`     | Amplification coefficient |
    | `_fee`               | `uint256`     | Trade fee, given as an integer with `1e10` precision |
    | `_asset_type`        | `uint256`     | Asset type of the pool as an integer. 0 = `USD`, 1 = `ETH`, 2 = `BTC`, 3 = Other |
    | `_implementation_idx`| `uint256`     | Index of the implementation to use. All possible implementations for a pool of N_COINS can be publicly accessed via `plain_implementations(N_COINS)` |


    ??? quote "Source code"

        ```vyper
        event PlainPoolDeployed:
            coins: address[MAX_PLAIN_COINS]
            A: uint256
            fee: uint256
            deployer: address

        MAX_PLAIN_COINS: constant(int128) = 4  # max coins in a plain pool

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
        >>> Factory.deploy_plain_pool(
            _name: "alUSD-crvUSD",
            _symbol: "alcrvUSD",
            _coins: ['0xbc6da0fe9ad5f3b0d58160288917aa56653660e9', '0xf939E0A03FB07F59A73314E73794Be0E57ac1b4E'],
            _A: 200,
            _fee: 4000000,
            _asset_type: 0,
            _implementation_idx: 0,
            )    

        'returns address of deployed pool'
        ```



### `deploy_metapool`

Limitations when deploying meta pools:

| Parameter | Limitation |
| --------- | ---------- |
| `_fee` | 4000000 (0.04%) ≤ `_fee` ≤ 100000000 (0.1%) |

- Valid **`_implementation_idx`** (cannot be **`ZERO_ADDRESS`**).
- Maximum of 18 decimals for the coins.

!!!warning
    Transaction will fail if the requirements are not met.


!!! description "`Factory.deploy_metapool(_base_pool: address, _name: String[32], _symbol: String[10], _coin: address, _A: uint256, _fee: uint256, _implementation_idx: uint256 = 0) -> address:`"

    Function to deploy a metapool.

    Returns: Deployed metapool (`address`).

    Emits: `MetaPoolDeployed`

    | Input                | Type          | Description |
    | -------------------- | ------------- | ----------- |
    | `_base_pool`         | `address`     | Address of the base pool to pair the token with |
    | `_name`              | `String[32]`  | Name of the new metapool |
    | `_symbol`            | `String[10]`  | Symbol for the new metapool’s LP token. This value will be concatenated with the base pool symbol. |
    | `_coin`              | `address`     | Address of the coin being used in the metapool |
    | `_A`                 | `uint256`     | Amplification coefficient |
    | `_fee`               | `uint256`     | Trade fee, given as an integer with `1e10` precision |
    | `_implementation_idx`| `uint256`     | Index of the implementation to use. All possible implementations for a pool of N_COINS can be publicly accessed via `plain_implementations(N_COINS)` |


    ??? quote "Source code"

        ```vyper
        event MetaPoolDeployed:
            coin: address
            base_pool: address
            A: uint256
            fee: uint256
            deployer: address

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
        >>> Factory.deploy_metapool(
            _base_pool: '0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7',
            _name: "crvUSD/3CRV",
            _symbol: "crvUSD3CRV",
            _coin: '0xf939E0A03FB07F59A73314E73794Be0E57ac1b4E',
            _A: 200,
            _fee: 4000000,
            _implementation_idx: uint256 = 0,
            )

        'returns address of the deployed pool'
        ```


## **Liquidity Gauge**

!!!info
    Liquidity gauges can only be successfully deployed from the same contract from which the pool was deployed!

!!! description "`Factory.deploy_gauge(_pool: address) -> address:`"

    Function to deploy a liquidity gauge for a factory pool.

    Returns: Deployed gauge (`address`).

    Emits: `LiquidityGaugeDeployed`

    | Input    | Type      | Description                                  |
    | -------- | --------- | -------------------------------------------- |
    | `_pool`  | `address` | Factory pool address to deploy a gauge for   |


    ??? quote "Source code"

        ```vyper
        event LiquidityGaugeDeployed:
            pool: address
            gauge: address

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
        >>> Factory.deploy_gauge("pool address")
        'deployed gauge address'
        ```