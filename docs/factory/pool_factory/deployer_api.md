!!! note
    After deploying a pool, one must also add initial liquidity before the pool can be used.


# Deploy Pools

Deploying pools need quite some advanced information. check implementations etc.

When deploying metapools, one need to know which implementation to use:

To obtain the viable implementations for metapools, query the basepool address within `metapool_implementations()` on the Factory contract:

```shell
>>> Factory.metapool_implementations("0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7"):
[[0x213be373FDff327658139C7df330817DAD2d5bBE]
[0x55Aa9BF126bCABF0bDC17Fa9E39Ec9239e1ce7A9]
[0x0000000000000000000000000000000000000000]
[0x0000000000000000000000000000000000000000]
[0x0000000000000000000000000000000000000000]
[0x0000000000000000000000000000000000000000]
[0x0000000000000000000000000000000000000000]
[0x0000000000000000000000000000000000000000]
[0x0000000000000000000000000000000000000000]
[0x0000000000000000000000000000000000000000]]
```






## **Stableswap-NG Factory**

### `deploy_plain_pool`

Limitations when deploying stableswap-ng pools:

- minimum of 2 and maximum of 8 coins
- all coin arrays should be same length
- `_fee` <= 100000000 (1%)
- `_offpeg_fee_multiplier` * `_fee` <= `MAX_FEE` * `FEE_DENOMINATOR`
- maximum of 18 decimals for a coin
- no duplicate coins
- valid implementation index

!!!warning
    Transaction will fail when the requirements are not met.

!!! description "`Factory.deploy_plain_pool(_name: String[32], _symbol: String[10], _coins: DynArray[address, MAX_COINS], _A: uint256, _fee: uint256, _offpeg_fee_multiplier: uint256, _ma_exp_time: uint256, _implementation_idx: uint256, _asset_types: DynArray[uint8, MAX_COINS], _method_ids: DynArray[bytes4, MAX_COINS], _oracles: DynArray[address, MAX_COINS], ) -> address:`"

    Function to deploy a stableswap-ng plain pool. The pool is created from a blueprint contract.

    Returns: deployed pool (`address`).

    Emits: `PlainPoolDeployed`

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_name` |  `String[32]` | name of the new plain pool |
    | `_symbol` |  `String[10]` | symbol for the new metapool’s LP token; this value will be concatenated with the factory symbol |
    | `_coins` |  `DynArray[address, MAX_COINS]` | list of addresses of the coins being used in the pool |
    | `_A` |  `uint256` | amplification coefficient |
    | `_fee` |  `uint256` | trade fee, given as an integer with `1e10` precision |
    | `_offpeg_fee_multiplier` |  `uint256` | off-peg multiplier |
    | `_ma_exp_time` |  `uint256` | ma time; set as time_in_seconds / ln(2) |
    | `_implementation_idx` |  `uint256` | index of the implementation to use |
    | `_asset_type` |  `DynArray[uint8, MAX_COINS]` | asset type of the pool as an integer |
    | `_methods_id` |  `DynArray[bytes4, MAX_COINS]` | array of first four bytes of the Keccak-256 hash of the function signatures of the oracle addresses that give rate oracles |
    | `_oracles` |  `DynArray[address, MAX_COINS]` | array of rate oracle addresses |


    ??? quote "Source code"

        ```python
        event PlainPoolDeployed:
            coins: DynArray[address, MAX_COINS]
            A: uint256
            fee: uint256
            deployer: address

        MAX_COINS: constant(uint256) = 8

        MAX_FEE: constant(uint256) = 5 * 10 ** 9
        FEE_DENOMINATOR: constant(uint256) = 10 ** 10

        @external
        def deploy_plain_pool(
            _name: String[32],
            _symbol: String[10],
            _coins: DynArray[address, MAX_COINS],
            _A: uint256,
            _fee: uint256,
            _offpeg_fee_multiplier: uint256,
            _ma_exp_time: uint256,
            _implementation_idx: uint256,
            _asset_types: DynArray[uint8, MAX_COINS],
            _method_ids: DynArray[bytes4, MAX_COINS],
            _oracles: DynArray[address, MAX_COINS],
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
                        maximum is 1% (100000000). 50% of the fee is distributed to veCRV holders.
            @param _ma_exp_time Averaging window of oracle. Set as time_in_seconds / ln(2)
                                Example: for 10 minute EMA, _ma_exp_time is 600 / ln(2) ~= 866
            @param _implementation_idx Index of the implementation to use
            @param _asset_types Asset types for pool, as an integer
            @param _method_ids Array of first four bytes of the Keccak-256 hash of the function signatures
                            of the oracle addresses that gives rate oracles.
                            Calculated as: keccak(text=event_signature.replace(" ", ""))[:4]
            @param _oracles Array of rate oracle addresses.
            @return Address of the deployed pool
            """
            assert len(_coins) >= 2  # dev: pool needs to have at least two coins!
            assert len(_coins) == len(_method_ids)  # dev: All coin arrays should be same length
            assert len(_coins) ==  len(_oracles)  # dev: All coin arrays should be same length
            assert len(_coins) ==  len(_asset_types)  # dev: All coin arrays should be same length
            assert _fee <= 100000000, "Invalid fee"
            assert _offpeg_fee_multiplier * _fee <= MAX_FEE * FEE_DENOMINATOR

            n_coins: uint256 = len(_coins)
            _rate_multipliers: DynArray[uint256, MAX_COINS] = empty(DynArray[uint256, MAX_COINS])
            decimals: DynArray[uint256, MAX_COINS] = empty(DynArray[uint256, MAX_COINS])

            for i in range(MAX_COINS):
                if i == n_coins:
                    break

                coin: address = _coins[i]

                decimals.append(ERC20(coin).decimals())
                assert decimals[i] < 19, "Max 18 decimals for coins"

                _rate_multipliers.append(10 ** (36 - decimals[i]))

                for j in range(i, i + MAX_COINS):
                    if (j + 1) == n_coins:
                        break
                    assert coin != _coins[j+1], "Duplicate coins"

            implementation: address = self.pool_implementations[_implementation_idx]
            assert implementation != empty(address), "Invalid implementation index"

            pool: address = create_from_blueprint(
                implementation,
                _name,                                          # _name: String[32]
                _symbol,                                        # _symbol: String[10]
                _A,                                             # _A: uint256
                _fee,                                           # _fee: uint256
                _offpeg_fee_multiplier,                         # _offpeg_fee_multiplier: uint256
                _ma_exp_time,                                   # _ma_exp_time: uint256
                _coins,                                         # _coins: DynArray[address, MAX_COINS]
                _rate_multipliers,                              # _rate_multipliers: DynArray[uint256, MAX_COINS]
                _asset_types,                                   # _asset_types: DynArray[uint8, MAX_COINS]
                _method_ids,                                    # _method_ids: DynArray[bytes4, MAX_COINS]
                _oracles,                                       # _oracles: DynArray[address, MAX_COINS]
                code_offset=3
            )

            length: uint256 = self.pool_count
            self.pool_list[length] = pool
            self.pool_count = length + 1
            self.pool_data[pool].decimals = decimals
            self.pool_data[pool].n_coins = n_coins
            self.pool_data[pool].base_pool = empty(address)
            self.pool_data[pool].implementation = implementation
            self.pool_data[pool].asset_types = _asset_types

            for i in range(MAX_COINS):
                if i == n_coins:
                    break

                coin: address = _coins[i]
                self.pool_data[pool].coins.append(coin)

                for j in range(i, i + MAX_COINS):
                    if (j + 1) == n_coins:
                        break
                    swappable_coin: address = _coins[j + 1]
                    key: uint256 = (convert(coin, uint256) ^ convert(swappable_coin, uint256))
                    length = self.market_counts[key]
                    self.markets[key][length] = pool
                    self.market_counts[key] = length + 1

            log PlainPoolDeployed(_coins, _A, _fee, msg.sender)
            return pool
        ```

    === "Example"

        ```shell
        >>> Factory.deploy_plain_pool(
            _name: String[32],
            _symbol: String[10],
            _coins: DynArray[address, MAX_COINS],
            _A: uint256,
            _fee: uint256,
            _offpeg_fee_multiplier: uint256,
            _ma_exp_time: uint256,
            _implementation_idx: uint256,
            _asset_types: DynArray[uint8, MAX_COINS],
            _method_ids: DynArray[bytes4, MAX_COINS],
            _oracles: DynArray[address, MAX_COINS],
        ) -> address:

        >>> 'returns address of deployed pool'
        ```


### `deploy_metapool`

Limitations when deploying meta pools:

- cannot pair against a token that is included in the base pool
- `_fee` <= 100000000 (1%)
- `_offpeg_fee_multiplier` * `_fee` <= `MAX_FEE` * `FEE_DENOMINATOR`
- valid implementation index
- maximum of 18 decimals for a coin

!!!warning
    Transaction will fail when the requirements are not met.


!!! description "`Factory.deploy_metapool(_base_pool: address, _name: String[32], _symbol: String[10], _coin: address, _A: uint256, _fee: uint256, _offpeg_fee_multiplier: uint256, _ma_exp_time: uint256, _implementation_idx: uint256, _asset_type: uint8, _method_id: bytes4, _oracle: address) -> address:`"

    Function to deploy a stableswap-ng metapool.

    Returns: deployed metapool (`address`).

    Emits: `MetaPoolDeployed`

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_base_pool` |  `address` | address of the base pool to pair the token with |
    | `_name` |  `String[32]` | name of the new metapool |
    | `_symbol` |  `String[10]` | symbol for the new metapool’s LP token - will be concatenated with the base pool symbol |
    | `_coin` |  `address` | address of the coin being used in the metapool |
    | `_A` |  `uint256` | amplification coefficient |
    | `_fee` |  `uint256` | trade fee, given as an integer with `1e10` precision |
    | `_offpeg_fee_multiplier` |  `uint256` | off-peg multiplier |
    | `_ma_exp_time` |  `uint256` | ma time; set as time_in_seconds / ln(2) |
    | `_implementation_idx` |  `uint256` | index of the implementation to use |
    | `_asset_type` |  `uint8` | asset type for the token |
    | `_method_id` |  `bytes4` | first four bytes of the Keccak-256 hash of the function signatures of the oracle addresses that give rate oracles |
    | `_oracle` |  `address` | rate oracle address |


    ??? quote "Source code"

        ```python
        event MetaPoolDeployed:
            coin: address
            base_pool: address
            A: uint256
            fee: uint256
            deployer: address

        MAX_COINS: constant(uint256) = 8

        MAX_FEE: constant(uint256) = 5 * 10 ** 9
        FEE_DENOMINATOR: constant(uint256) = 10 ** 10

        @external
        def deploy_metapool(
            _base_pool: address,
            _name: String[32],
            _symbol: String[10],
            _coin: address,
            _A: uint256,
            _fee: uint256,
            _offpeg_fee_multiplier: uint256,
            _ma_exp_time: uint256,
            _implementation_idx: uint256,
            _asset_type: uint8,
            _method_id: bytes4,
            _oracle: address,
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
                        the maximum is 1% (100000000).
                        50% of the fee is distributed to veCRV holders.
            @param _ma_exp_time Averaging window of oracle. Set as time_in_seconds / ln(2)
                                Example: for 10 minute EMA, _ma_exp_time is 600 / ln(2) ~= 866
            @param _implementation_idx Index of the implementation to use
            @param _asset_type Asset type for token, as an integer
            @param _method_id  First four bytes of the Keccak-256 hash of the function signatures
                            of the oracle addresses that gives rate oracles.
                            Calculated as: keccak(text=event_signature.replace(" ", ""))[:4]
            @param _oracle Rate oracle address.
            @return Address of the deployed pool
            """
            assert not self.base_pool_assets[_coin], "Invalid asset: Cannot pair base pool asset with base pool's LP token"
            assert _fee <= 100000000, "Invalid fee"
            assert _offpeg_fee_multiplier * _fee <= MAX_FEE * FEE_DENOMINATOR

            base_pool_n_coins: uint256 = len(self.base_pool_data[_base_pool].coins)
            assert base_pool_n_coins != 0, "Base pool is not added"

            implementation: address = self.metapool_implementations[_implementation_idx]
            assert implementation != empty(address), "Invalid implementation index"

            # things break if a token has >18 decimals
            decimals: uint256 = ERC20(_coin).decimals()
            assert decimals < 19, "Max 18 decimals for coins"

            # combine _coins's _asset_type and basepool coins _asset_types:
            base_pool_asset_types: DynArray[uint8, MAX_COINS] = self.base_pool_data[_base_pool].asset_types
            asset_types: DynArray[uint8, MAX_COINS]  = [_asset_type, 0]

            for i in range(0, MAX_COINS):
                if i == base_pool_n_coins:
                    break
                asset_types.append(base_pool_asset_types[i])

            _coins: DynArray[address, MAX_COINS] = [_coin, self.base_pool_data[_base_pool].lp_token]
            _rate_multipliers: DynArray[uint256, MAX_COINS] = [10 ** (36 - decimals), 10 ** 18]
            _method_ids: DynArray[bytes4, MAX_COINS] = [_method_id, empty(bytes4)]
            _oracles: DynArray[address, MAX_COINS] = [_oracle, empty(address)]

            pool: address = create_from_blueprint(
                implementation,
                _name,                                          # _name: String[32]
                _symbol,                                        # _symbol: String[10]
                _A,                                             # _A: uint256
                _fee,                                           # _fee: uint256
                _offpeg_fee_multiplier,                         # _offpeg_fee_multiplier: uint256
                _ma_exp_time,                                   # _ma_exp_time: uint256
                self.math_implementation,                       # _math_implementation: address
                _base_pool,                                     # _base_pool: address
                _coins,                                         # _coins: DynArray[address, MAX_COINS]
                self.base_pool_data[_base_pool].coins,          # base_coins: DynArray[address, MAX_COINS]
                _rate_multipliers,                              # _rate_multipliers: DynArray[uint256, MAX_COINS]
                asset_types,                                    # asset_types: DynArray[uint8, MAX_COINS]
                _method_ids,                                    # _method_ids: DynArray[bytes4, MAX_COINS]
                _oracles,                                       # _oracles: DynArray[address, MAX_COINS]
                code_offset=3
            )

            # add pool to pool_list
            length: uint256 = self.pool_count
            self.pool_list[length] = pool
            self.pool_count = length + 1

            base_lp_token: address = self.base_pool_data[_base_pool].lp_token

            self.pool_data[pool].decimals = [decimals, 18, 0, 0, 0, 0, 0, 0]
            self.pool_data[pool].n_coins = 2
            self.pool_data[pool].base_pool = _base_pool
            self.pool_data[pool].coins = [_coin, self.base_pool_data[_base_pool].lp_token]
            self.pool_data[pool].implementation = implementation

            is_finished: bool = False
            swappable_coin: address = empty(address)
            for i in range(MAX_COINS):
                if i < len(self.base_pool_data[_base_pool].coins):
                    swappable_coin = self.base_pool_data[_base_pool].coins[i]
                else:
                    is_finished = True
                    swappable_coin = base_lp_token

                key: uint256 = (convert(_coin, uint256) ^ convert(swappable_coin, uint256))
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

        >>> 'returns address of the deployed pool'
        ```



## **MetaPool Factory** 

MetaPool Factory allows the permissionless deployment of 


### `deploy_plain_pool`

Limitations when deploying plain pools:

| Parameter | Limitation |
| --------- | ---------- |
|`_fee`| 4000000 (0.04%) $\leq$ `_fee` $\leq$ 100000000 (0.1%) |

- valid `_implementation_idx` (can not be `ZERO_ADDRESS`)
- minimum of 2 coins and maximum of 4 coins
- can not pair with a coin which is included in a basepool
- if paired against plain eth (0xE...EeE), eth mus be first coin of the pool (`_coins[0] = plain eth`)
- maximum of 18 decimals for the coins
- no duplicate coins

!!!warning
    Transaction will fail when the requirements are not met.

!!! description "`Factory.deploy_plain_pool(_name: String[32], _symbol: String[10], _coins: address[4], _A: uint256, _fee: uint256, _asset_type: uint256 = 0, _implementation_idx: uint256 = 0) → address: nonpayable`"

    Function to deploy a plain pool.

    Returns: deployed pool (`address`).

    Emits: `PlainPoolDeployed`

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_name` |  `String[32]` | Name of the new plain pool |
    | `_symbol` |  `String[10]` | Symbol for the new metapool’s LP token. This value will be concatenated with the factory symbol. |
    | `_coins` |  `address[4]` | List of addresses of the coins being used in the pool |
    | `_A` |  `uint256` | Amplification coefficient |
    | `_fee` |  `uint256` | Trade fee, given as an integer with `1e10` precision |
    | `_asset_type` |  `uint256` | Asset type of the pool as an integer. 0 = `USD`, 1 = `ETH`, 2 = `BTC`, 3 = Other. |
    | `_implementation_idx` |  `uint256` | Index of the implementation to use. All possible implementations for a pool of N_COINS can be publicly accessed via `plain_implementations(N_COINS)`. |

    ??? quote "Source code"

        ```python
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

        >>> 'returns address of deployed pool'
        ```


### `deploy_metapool`

Limitations when deploying meta pools:

| Parameter | Limitation |
| --------- | ---------- |
|`_fee`| 4000000 (0.04%) $\leq$ `_fee` $\leq$ 100000000 (0.1%) |

- valid `_implementation_idx` (can not be `ZERO_ADDRESS`)
- maximum of 18 decimals for the coins


!!!warning
    Transaction will fail when the requirements are not met.

!!! description "`Factory.deploy_metapool(_base_pool: address, _name: String[32], _symbol: String[10], _coin: address, _A: uint256, _fee: uint256, _implementation_idx: uint256 = 0) -> address:`"

    Function to deploy a metapool.

    Returns: deployed metapool (`address`).

    Emits: `MetaPoolDeployed`

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_base_pool` |  `address` | address of the base pool to pair the token with |
    | `_name` |  `String[32]` | Name of the new metapool |
    | `_symbol` |  `String[10]` | Symbol for the new metapool’s LP token. This value will be concatenated with the base pool symbol. |
    | `_coin` |  `address` | Address of the coin being used in the metapool |
    | `_A` |  `uint256` | Amplification coefficient |
    | `_fee` |  `uint256` | Trade fee, given as an integer with `1e10` precision |
    | `_implementation_idx` |  `uint256` | Index of the implementation to use. All possible implementations for a pool of N_COINS can be publicly accessed via `plain_implementations(N_COINS)` |

    ??? quote "Source code"

        ```python
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

        >>> 'returns address of the deployed pool'
        ```


### `add_base_pool`
!!! description "`Factory.add_base_pool(_base_pool: address, _fee_receiver: address, _asset_type: uint256, _implementations: address[10])`"

    !!!guard "Guarded Method"
        This function is only callable by the `admin` of the contract.

    Function to add a base pool to the registry, which may be used in factory metapools.

    Emits: `BasePoolAdded`

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_base_pool` |  `address` | Pool address to add |
    | `_fee_receiver` |  `address` | Admin fee receiver address for metapools using this base pool |
    | `_asset_type` |  `uint256` | Asset type for pool, as an integer  `0` = USD, `1` = ETH, `2` = BTC, `3` = Other |
    | `implementations` | `address` | List of implementation addresses that can be used with this base pool |

    ??? quote "Source code"

        ```python
        event BasePoolAdded:
            base_pool: address

        @external
        def add_base_pool(
            _base_pool: address,
            _fee_receiver: address,
            _asset_type: uint256,
            _implementations: address[10],
        ):
            """
            @notice Add a base pool to the registry, which may be used in factory metapools
            @dev Only callable by admin
            @param _base_pool Pool address to add
            @param _fee_receiver Admin fee receiver address for metapools using this base pool
            @param _asset_type Asset type for pool, as an integer  0 = USD, 1 = ETH, 2 = BTC, 3 = Other
            @param _implementations List of implementation addresses that can be used with this base pool
            """
            assert msg.sender == self.admin  # dev: admin-only function
            assert self.base_pool_data[_base_pool].coins[0] == ZERO_ADDRESS  # dev: pool exists
        
            registry: address = AddressProvider(ADDRESS_PROVIDER).get_registry()
            n_coins: uint256 = Registry(registry).get_n_coins(_base_pool)
        
            # add pool to pool_list
            length: uint256 = self.base_pool_count
            self.base_pool_list[length] = _base_pool
            self.base_pool_count = length + 1
            self.base_pool_data[_base_pool].lp_token = Registry(registry).get_lp_token(_base_pool)
            self.base_pool_data[_base_pool].n_coins = n_coins
            self.base_pool_data[_base_pool].fee_receiver = _fee_receiver
            if _asset_type != 0:
                self.base_pool_data[_base_pool].asset_type = _asset_type
        
            for i in range(10):
                implementation: address = _implementations[i]
                if implementation == ZERO_ADDRESS:  
                    break
                self.base_pool_data[_base_pool].implementations[i] = implementation
        
            decimals: uint256 = 0
            coins: address[MAX_COINS] = Registry(registry).get_coins(_base_pool)
            for i in range(MAX_COINS):
                if i == n_coins:
                    break
                coin: address = coins[i]
                self.base_pool_data[_base_pool].coins[i] = coin
                self.base_pool_assets[coin] = True
                decimals += shift(ERC20(coin).decimals(), convert(i*8, int128))
            self.base_pool_data[_base_pool].decimals = decimals
        
            log BasePoolAdded(_base_pool)
        ```

    === "Example"

        ```shell
        >>> Factory.add_base_pool(
            _base_pool: '0x390f3595bca2df7d23783dfd126427cceb997bf4',
            _fee_receiver: '0xeCb456EA5365865EbAb8a2661B0c503410e9B347',
            _asset_type: 0,
            _implementations: ['0x213be373FDff327658139C7df330817DAD2d5bBE', '0x55Aa9BF126bCABF0bDC17Fa9E39Ec9239e1ce7A9'],
            ):
        ```


## **crvUSD Pool Factory**

The crvUSD Pool Factory is a new factory primarily used to deploy pools paired with crvUSD. Just like the metapool factory, it can be used to deploy both plain pools and metapools or to add new base pools. This factory was created because the metapool does not allow for the deployment of plain pools paired with tokens that are included in base pools. For this reason, pools like crvUSD<>USDT or crvUSD<>USDC would not be feasible.

Additionally, the new factory features a `plain_whitelist`. Plain pools can only be created if one of the coins is listed on this whitelist. Tokens can be added to the whitelist by invoking the `add_token_to_whitelist()` function. This function can only be called by the factory's admin. The proxy, whose owner is the curve ownership agent, serves as the admin.


Differences compared to the MetapoolFactory:

- when deploying plain pools, the factory doesn't verify if the paired tokens are part of a base pool. Instead, the contract checks if one of the tokens is listed on the `plain_whitelist`.
- fee for deployed plain pools must be > 1%; in contrast, the metapool factory requires a fee ranging between 0.04% and 1%.
- no option to modify the fee parameters of deployed pools.


To check if a coin is whitelisted, query its address using the `plain_whitelist()` function:

```shell
>>> Factory.plain_whitelist("0xf939E0A03FB07F59A73314E73794Be0E57ac1b4E"):
'true'
```



## **CryptoSwap Factory**

CryptoSwap Factory allows the permissionless deployment of two-coin pools including volatile assets.

### `deploy_pool`

Limitations when deploying plain crypto pools:

| Parameter | Limitation |
| --------- | ---------- |
|`A`| $A_{min} - 1 < A < A_{max} + 1$ |
|`gamma`| $gamma_{min} - 1 < gamma < gamma_{max} + 1$ |
|`mid_fee`| $fee_{min} - 1 < fee_{mid} < fee_{max} - 1$ |
|`out_fee`| $fee_{out} >= fee_{mid}$ AND $fee_{out} < fee_{max} - 1$ |
|`admin_fee`| $< 10^{18} + 1$
|`allowed_extra_profit`| $\text{allowed_extra_profit} < 10^{16} + 1$ |
|`fee_gamma`| $0 < gamma_{fee} < 10^{18} + 1$ |
|`adjustment_step`| $0 < \text{adjustment_step} < 10^{18} + 1$ |
|`ma_half_time`| $0 < \text{ma_half_time} < 604800$ |
|`initial_price`| $10^{6} < \text{initial_price} < 10^{30}$ |

- no duplicate coins
- only two coins
- maximum of 18 decimals of a coin


*with:*

| Parameters    | Value |
|---------------|-------|
|$n_{coins}$    | $2$ |
|$A_{multiplier}$ | $10000$ |
|$A_{min}$      | $\frac{n_{coins}^{n_{coins}} * A_{multiplier}}{10} = 4000$ |
|$A_{max}$      | $n_{coins}^{n_{coins}} * A_{multiplier} * 100000 = 4000000000$|  
|$gamma_{min}$  | $10^{10} = 10000000000$|  
|$gamma_{max}$  | $2 * 10^{16} = 20000000000000000$ |
|$fee_{min}$    | $5 * 10^{5} = 500000$ |
|$fee_{max}$    | $10 * 10^{9} = 10000000000$ |

!!!warning
    Transaction will fail when the requirements are not met.

!!! description "`Factory.deploy_pool(_name: String[32], _symbol: String[10], _coins: address[2], A: uint256, gamma: uint256, mid_fee: uint256, out_fee: uint256, allowed_extra_profit: uint256, fee_gamma: uint256, adjustment_step: uint256, admin_fee: uint256, ma_half_time: uint256, initial_price: uint256) -> address:`"

    Function to deploy a plain pool.

    Returns: deployed pool (`address`).

    Emits: `CryptoPoolDeployed`

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_name` |  `String[32]` | Name of the new plain pool |
    | `_symbol` |  `String[10]` | Symbol for the new metapool’s LP token. This value will be concatenated with the factory symbol. |
    | `_coins` |  `address[4]` | List of addresses of the coins being used in the pool |
    | `A` |  `uint256` | Amplification coefficient |
    | `gamma` |  `uint256` | Gamma |
    | `mid_fee` |  `uint256` | Mid fee |
    | `out_fee` |  `uint256` | Out fee |
    | `allowed_extra_profit` |  `uint256` | Allowed extra profit |
    | `fee_gamma` |  `uint256` | Fee Gamma |
    | `adjustment_step` |  `uint256` | Adjustment step |
    | `admin_fee` |  `uint256` | Admin fee |
    | `ma_half_time` |  `uint256` | Moving-Average half time |
    | `initial_price` |  `uint256` | Initial price |


    ??? quote "Source code"

        ```python
        event CryptoPoolDeployed:
            token: address
            coins: address[2]
            A: uint256
            gamma: uint256
            mid_fee: uint256
            out_fee: uint256
            allowed_extra_profit: uint256
            fee_gamma: uint256
            adjustment_step: uint256
            admin_fee: uint256
            ma_half_time: uint256
            initial_price: uint256
            deployer: address

        N_COINS: constant(int128) = 2
        A_MULTIPLIER: constant(uint256) = 10000

        # Limits
        MAX_ADMIN_FEE: constant(uint256) = 10 * 10 ** 9
        MIN_FEE: constant(uint256) = 5 * 10 ** 5  # 0.5 bps
        MAX_FEE: constant(uint256) = 10 * 10 ** 9

        MIN_GAMMA: constant(uint256) = 10 ** 10
        MAX_GAMMA: constant(uint256) = 2 * 10 ** 16

        MIN_A: constant(uint256) = N_COINS ** N_COINS * A_MULTIPLIER / 10
        MAX_A: constant(uint256) = N_COINS ** N_COINS * A_MULTIPLIER * 100000

        @external
        def deploy_pool(
            _name: String[32],
            _symbol: String[10],
            _coins: address[2],
            A: uint256,
            gamma: uint256,
            mid_fee: uint256,
            out_fee: uint256,
            allowed_extra_profit: uint256,
            fee_gamma: uint256,
            adjustment_step: uint256,
            admin_fee: uint256,
            ma_half_time: uint256,
            initial_price: uint256
        ) -> address:
            """
            @notice Deploy a new pool
            @param _name Name of the new plain pool
            @param _symbol Symbol for the new plain pool - will be concatenated with factory symbol
            Other parameters need some description
            @return Address of the deployed pool
            """
            # Validate parameters
            assert A > MIN_A-1
            assert A < MAX_A+1
            assert gamma > MIN_GAMMA-1
            assert gamma < MAX_GAMMA+1
            assert mid_fee > MIN_FEE-1
            assert mid_fee < MAX_FEE-1
            assert out_fee >= mid_fee
            assert out_fee < MAX_FEE-1
            assert admin_fee < 10**18+1
            assert allowed_extra_profit < 10**16+1
            assert fee_gamma < 10**18+1
            assert fee_gamma > 0
            assert adjustment_step < 10**18+1
            assert adjustment_step > 0
            assert ma_half_time < 7 * 86400
            assert ma_half_time > 0
            assert initial_price > 10**6
            assert initial_price < 10**30
            assert _coins[0] != _coins[1], "Duplicate coins"

            decimals: uint256[2] = empty(uint256[2])
            for i in range(2):
                d: uint256 = ERC20(_coins[i]).decimals()
                assert d < 19, "Max 18 decimals for coins"
                decimals[i] = d
            precisions: uint256 = (18 - decimals[0]) + shift(18 - decimals[1], 8)


            name: String[64] = concat("Curve.fi Factory Crypto Pool: ", _name)
            symbol: String[32] = concat(_symbol, "-f")

            token: address = create_forwarder_to(self.token_implementation)
            pool: address = create_forwarder_to(self.pool_implementation)

            Token(token).initialize(name, symbol, pool)
            CryptoPool(pool).initialize(
                A, gamma, mid_fee, out_fee, allowed_extra_profit, fee_gamma,
                adjustment_step, admin_fee, ma_half_time, initial_price,
                token, _coins, precisions)

            length: uint256 = self.pool_count
            self.pool_list[length] = pool
            self.pool_count = length + 1
            self.pool_data[pool].token = token
            self.pool_data[pool].decimals = shift(decimals[0], 8) + decimals[1]
            self.pool_data[pool].coins = _coins

            key: uint256 = bitwise_xor(convert(_coins[0], uint256), convert(_coins[1], uint256))
            length = self.market_counts[key]
            self.markets[key][length] = pool
            self.market_counts[key] = length + 1

            log CryptoPoolDeployed(
                token, _coins,
                A, gamma, mid_fee, out_fee, allowed_extra_profit, fee_gamma,
                adjustment_step, admin_fee, ma_half_time, initial_price,
                msg.sender)
            return pool
        ```

    === "Example"

        ```shell
        >>> CryptoFactory.deploy_pool(
            _name: crv/weth crypto pool,
            _symbol: crv/eth,
            _coins: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", "0xD533a949740bb3306d119CC777fa900bA034cd52",
            A: 20000000,
            gamma: 10000000000000000,
            mid_fee: 3000000,
            out_fee: 45000000,
            allowed_extra_profit: 10000000000,
            fee_gamma: 300000000000000000,
            adjustment_step: 5500000000000,
            admin_fee: 5000000000,
            ma_half_time: 600,
            initial_price: todo,
            ) 

        >>> 'returns address of the deployed pool'
        ```



## **Tricrypto Factory**

### `deploy_pool

Limitations when deploying tricrypto crypto pools:

| Parameter | Limitation |
| --------- | ---------- |
|`A`| $A_{min} - 1 < A < A_{max} + 1$ |
|`gamma`| $gamma_{min} - 1 < gamma < gamma_{max} + 1$ |
|`mid_fee`| $fee_{mid} < fee_{max} - 1$; (`mid_fee` can be 0) |
|`out_fee`| $fee_{out} >= fee_{mid}$ AND $fee_{out} < fee_{max} - 1$ |
|`fee_gamma`| $0 < gamma_{fee} < 10^{18} + 1$ |
|`allowed_extra_profit`| $\text{allowed_extra_profit} < 10^{18} + 1$|
|`adjustment_step`| $0 < \text{adjustment_step} < 10^{18} + 1$ |
|`ma_exp_time`| $86 < \text{ma_exp_time} < 872542$ |
|`initial_prices`| $10^{6} < \text{initial_prices[0] and initial_prices[1]} < 10^{30}$ |

- three coins; no duplicate coins possible 
- `implemention_id` cannot be `ZERO_ADDRESS`

*with:*

| Parameters    | Value |
|---------------|-------|
|$n_{coins}$ | $3$ |
|$A_{multiplier}$ | $10000$ |
|$A_{min}$      | $n_{coins}^{n_{coins}} * A_{multiplier} = 270000$ |
|$A_{max}$      | $1000 * A_{multiplier} * n_{coins}^{n_{coins}} = 270000000$|  
|$gamma_{min}$  | $10^{10} = 10000000000$|  
|$gamma_{max}$  | $5 * 10^{16} = 50000000000000000$ |
|$fee_{max}$   | $10 * 10^{9} = 10000000000$ |


!!!warning
    Transaction will fail when the requirements are not met.


!!! description "`Factory.deploy_pool(_name: String[64], _symbol: String[32], _coins: address[N_COINS], _weth: address, implementation_id: uint256, A: uint256, gamma: uint256, mid_fee: uint256, out_fee: uint256, fee_gamma: uint256, allowed_extra_profit: uint256, adjustment_step: uint256, ma_exp_time: uint256, initial_prices: uint256[N_COINS-1],) -> address:`"   

    Function to deploy a tricrypto pool.

    Returns: deployed pool (`address`).

    Emits: `TricryptoPoolDeployed`

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_name` |  `String[64]` | Pool Name |
    | `_symbol` |  `String[32]` | Pool Symbol |
    | `_coins` |  `address[N_COINS]` | Included Coins |
    | `_weth` |  `address` | WETH Address |
    | `implementation_id` |  `uint256` | Index of Pool Implementation |
    | `A` |  `uint256` | Amplification Factor |
    | `gamma` |  `uint256` | Gamma |
    | `mid_fee` |  `uint256` | Mid Fee |
    | `out_fee` |  `uint256` | Out Fee |
    | `fee_gamma` |  `uint256` | Fee Gamma |
    | `allowed_extra_profit` |  `uint256` | Allowed Extra Profit |
    | `adjustment_step` |  `uint256` | Adjustment Step |
    | `ma_exp_time` |  `uint256` | Exponention Moving Average Time |
    | `initial_prices` |  `uint256[N_COINS-1]` | Initial Prices |

    ??? quote "Source code"

        ```python hl_lines="1"
        event TricryptoPoolDeployed:
            pool: address
            name: String[64]
            symbol: String[32]
            weth: address
            coins: address[N_COINS]
            math: address
            salt: bytes32
            packed_precisions: uint256
            packed_A_gamma: uint256
            packed_fee_params: uint256
            packed_rebalancing_params: uint256
            packed_prices: uint256
            deployer: address

        N_COINS: constant(uint256) = 3
        A_MULTIPLIER: constant(uint256) = 10000

        MAX_FEE: constant(uint256) = 10 * 10 ** 9

        MIN_GAMMA: constant(uint256) = 10 ** 10
        MAX_GAMMA: constant(uint256) = 5 * 10**16

        MIN_A: constant(uint256) = N_COINS ** N_COINS * A_MULTIPLIER / 100
        MAX_A: constant(uint256) = 1000 * A_MULTIPLIER * N_COINS**N_COINS

        PRICE_SIZE: constant(uint128) = 256 / (N_COINS - 1)
        PRICE_MASK: constant(uint256) = 2**PRICE_SIZE - 1

        @external
        def deploy_pool(
            _name: String[64],
            _symbol: String[32],
            _coins: address[N_COINS],
            _weth: address,
            implementation_id: uint256,
            A: uint256,
            gamma: uint256,
            mid_fee: uint256,
            out_fee: uint256,
            fee_gamma: uint256,
            allowed_extra_profit: uint256,
            adjustment_step: uint256,
            ma_exp_time: uint256,
            initial_prices: uint256[N_COINS-1],
        ) -> address:
            """
            @notice Deploy a new pool
            @param _name Name of the new plain pool
            @param _symbol Symbol for the new plain pool - will be concatenated with factory symbol

            @return Address of the deployed pool
            """
            pool_implementation: address = self.pool_implementations[implementation_id]
            assert pool_implementation != empty(address), "Pool implementation not set"

            # Validate parameters
            assert A > MIN_A-1
            assert A < MAX_A+1

            assert gamma > MIN_GAMMA-1
            assert gamma < MAX_GAMMA+1

            assert mid_fee < MAX_FEE-1  # mid_fee can be zero
            assert out_fee >= mid_fee
            assert out_fee < MAX_FEE-1
            assert fee_gamma < 10**18+1
            assert fee_gamma > 0

            assert allowed_extra_profit < 10**18+1

            assert adjustment_step < 10**18+1
            assert adjustment_step > 0

            assert ma_exp_time < 872542  # 7 * 24 * 60 * 60 / ln(2)
            assert ma_exp_time > 86  # 60 / ln(2)

            assert min(initial_prices[0], initial_prices[1]) > 10**6
            assert max(initial_prices[0], initial_prices[1]) < 10**30

            assert _coins[0] != _coins[1] and _coins[1] != _coins[2] and _coins[0] != _coins[2], "Duplicate coins"

            decimals: uint256[N_COINS] = empty(uint256[N_COINS])
            precisions: uint256[N_COINS] = empty(uint256[N_COINS])
            for i in range(N_COINS):
                d: uint256 = ERC20(_coins[i]).decimals()
                assert d < 19, "Max 18 decimals for coins"
                decimals[i] = d
                precisions[i] = 10** (18 - d)

            # pack precisions
            packed_precisions: uint256 = self._pack(precisions)

            # pack fees
            packed_fee_params: uint256 = self._pack(
                [mid_fee, out_fee, fee_gamma]
            )

            # pack liquidity rebalancing params
            packed_rebalancing_params: uint256 = self._pack(
                [allowed_extra_profit, adjustment_step, ma_exp_time]
            )

            # pack A_gamma
            packed_A_gamma: uint256 = A << 128
            packed_A_gamma = packed_A_gamma | gamma

            # pack initial prices
            packed_prices: uint256 = 0
            for k in range(N_COINS - 1):
                packed_prices = packed_prices << PRICE_SIZE
                p: uint256 = initial_prices[N_COINS - 2 - k]
                assert p < PRICE_MASK
                packed_prices = p | packed_prices

            # pool is an ERC20 implementation
            _salt: bytes32 = block.prevhash
            _math_implementation: address = self.math_implementation
            pool: address = create_from_blueprint(
                pool_implementation,
                _name,
                _symbol,
                _coins,
                _math_implementation,
                _weth,
                _salt,
                packed_precisions,
                packed_A_gamma,
                packed_fee_params,
                packed_rebalancing_params,
                packed_prices,
                code_offset=3
            )

            # populate pool data
            length: uint256 = self.pool_count
            self.pool_list[length] = pool
            self.pool_count = length + 1
            self.pool_data[pool].decimals = decimals
            self.pool_data[pool].coins = _coins

            # add coins to market:
            self._add_coins_to_market(_coins[0], _coins[1], pool)
            self._add_coins_to_market(_coins[0], _coins[2], pool)
            self._add_coins_to_market(_coins[1], _coins[2], pool)

            log TricryptoPoolDeployed(
                pool,
                _name,
                _symbol,
                _weth,
                _coins,
                _math_implementation,
                _salt,
                packed_precisions,
                packed_A_gamma,
                packed_fee_params,
                packed_rebalancing_params,
                packed_prices,
                msg.sender,
            )

            return pool
        ```

    === "Example"

        ```shell
        >>> TricryptoFactory.deploy_pool(
            _name: crv/weth/tbtc tripool,
            _symbol: crv-weth-tbtc,
            _coins: '0xD533a949740bb3306d119CC777fa900bA034cd52', '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', '0x8dAEBADE922dF735c38C80C7eBD708Af50815fAa',
            _weth: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
            implementation_id: 0,
            A: 2700000,
            gamma: 1300000000000,
            mid_fee: 2999999,
            out_fee: 80000000,
            fee_gamma: 350000000000000,
            allowed_extra_profit: 100000000000,
            adjustment_step: 100000000000,
            ma_exp_time: 600,
            initial_prices: todo,
            )

        >>> 'returns address of the deployed pool'
        ```




## Deploy Gauge

### `deploy_gauge`

!!! description "`deploy_gauge(_pool: address) -> address`"

    Deploy a liquidity gauge for a factory pool. The deployed gauge implementation is whatever the factory admin
    has set `gauge_implementation` to.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_pool` |  `address` | Factory pool address to deploy a gauge for |

    !!!info
        When deploying a gauge using the factory contract, one needs to use the same factory that deployed the pool.

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
        >>> Factory.deploy_gauge('0x...')

        >>> 'returns address of the deployed gauge' 
        ```
