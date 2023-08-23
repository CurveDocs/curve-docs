# Admin Controls

Admin controls 


### `add_base_pool`

!!! description "`Factory.add_base_pool(_base_pool: address, _fee_receiver: address, _asset_type: uint256, _implementations: address[10])`"

    Add a base pool to the registry, which may be used in factory metapools. Only callable by fatory `admin`.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_base_pool` |  `address` | Pool address to add |
    | `_fee_receiver` |  `address` | Admin fee receiver address for metapools using this base pool |
    | `_asset_type` |  `uint256` | Asset type for pool, as an integer  `0` = USD, `1` = ETH, `2` = BTC, `3` = Other |
    | `implementations` | `address` | List of implementation addresses that can be used with this base pool |

    Emits: <mark style="background-color: #FFD580; color: black">BasePoolAdded</mark>

    ??? quote "Source code"

        ```python
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
        >>> todo:
        ```






