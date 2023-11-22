!!!info 
    When deploying pools that include coins not requiring a rate oracle, **`b""`** should be included in the `_methods_id` array and the **`ZERO_ADDRESS`** should be used in the `_oracles` array as placeholders for each coin.

## **Plain Pools**

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
    | `_implementation_idx` |  `uint256` | index of the implementation to use; more [here](../factory/overview.md#implementations) |
    | `_asset_type` |  `DynArray[uint8, MAX_COINS]` | asset type of the pool as an integer; more [here](../pools/overview.md#supported-assets)|
    | `_methods_id` |  `DynArray[bytes4, MAX_COINS]` | array of first four bytes of the Keccak-256 hash of the function signatures of the oracle addresses that give rate oracles |
    | `_oracles` |  `DynArray[address, MAX_COINS]` | array of rate oracle addresses |

    !!!info "Implementation ID"
        There might be multiple pool implementations. To query all available ones, see [here](../factory/overview.md#pool_implementations). As of the current date (31.10.2023), there is only one pool implementation available. Since the `_implementation_idx` starts at 0, users need to input "0" when deploying a pool.

    ??? quote "Source code"

        ```vyper
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
            "crvUSD/USDT",  # _name
            "crvusd-usdt",  # _symbol
            [ # coins:
                "0xf939E0A03FB07F59A73314E73794Be0E57ac1b4E", # crvusd 
                "0xdAC17F958D2ee523a2206206994597C13D831ec7" # usdt
            ],
            1500 # _A
            1000000, # _fee
            20000000000, # _offpeg_fee_multiplier
            865, # _ma_exp_time
            0, # _implementation_idx
            [0, 0], # _asset_types
            [b"", b""], # _method_ids
            ["0x0000000000000000000000000000000000000000", "0x0000000000000000000000000000000000000000"] # _oracles
        )

        'returns address of the deployed plain pool'  
        ```


## **Metapools**

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
    | `_implementation_idx` |  `uint256` | index of the implementation to use; more [here](../factory/overview.md#implementations) |
    | `_asset_type` |  `uint8` | asset type for the token |
    | `_method_id` |  `bytes4` | first four bytes of the Keccak-256 hash of the function signatures of the oracle addresses that give rate oracles |
    | `_oracle` |  `address` | rate oracle address |

    !!!info "Implementation ID"
        There might be multiple metapool implementations. To query all available ones, see [here](../factory/overview.md#metapool_implementations). As of the current date (31.10.2023), there is only one metapool implementation available. Since the `_implementation_idx` starts at 0, users need to input "0" when deploying a pool.

    ??? quote "Source code"

        ```vyper
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
            "0xbebc44782c7db0a1a60cb6fe97d0b483032ff1c7", # _base_pool
            "crvUSD/3CRV", # _name
            "crvusd-3crv" # _symbol
            "0xf939E0A03FB07F59A73314E73794Be0E57ac1b4E", # _coin
            1500 # _A
            1000000, # _fee
            20000000000, # _offpeg_fee_multiplier
            865, # _ma_exp_time
            0, # _implementation_idx
            0, # _asset_type
            "b""", # _method_id
            "0x0000000000000000000000000000000000000000" # _oracle
        )

        'returns address of the deployed metapool'   
        ```


## **Gauges**

### `deploy_gauge`
!!! description "`Factory.deploy_gauge(_pool: address) -> address:`"

    Function to deploy a gauge. The Factory utilizes the `gauge_implementation` to create the contract from a blueprint.

    Returns: deployed gauge (`address`).

    Emits: `LiquidityGaugeDeployed`

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_pool` |  `address` | pool address to deploy the gauge for |

    !!!info
        Deploying a gauge using this function will only be successful if the pool has been deployed from this Factory.

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
            assert self.pool_data[_pool].coins[0] != empty(address), "Unknown pool"
            assert self.pool_data[_pool].liquidity_gauge == empty(address), "Gauge already deployed"
            implementation: address = self.gauge_implementation
            assert implementation != empty(address), "Gauge implementation not set"

            gauge: address = create_from_blueprint(self.gauge_implementation, _pool, code_offset=3)
            self.pool_data[_pool].liquidity_gauge = gauge

            log LiquidityGaugeDeployed(_pool, gauge)
            return gauge
        ```

    === "Example"

        ```shell
        >>> Factory.deploy_gauge("0x36DfE783603522566C046Ba1Fa403C8c6F569220")
        'returns address of the deployed gauge'
        ```
