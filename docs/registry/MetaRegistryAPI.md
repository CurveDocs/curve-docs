<h1>MetaRegistry: API </h1>

The MetaRegistry offers an **on-chain API** for various properties of Curve pools.

A full list of all deployment addresses can be found [here](../references/deployed-contracts.md#metaregistry).


---


## **Finding Pools**

!!!colab "Google Colab Notebook"
    A guide on how to find liquidity pools which hold specific coins can be found [here](../integration/metaregistry.md#fetching-liquidity-pools).

    A Jupyter notebook showcasing how to fetch pools directly from the blockchain, which contain two specific assets, can be found [here](https://colab.research.google.com/drive/1QsxqxQu7Um8gYPda30304W8ZcYbnbr1b?usp=sharing).


### `find_pools_for_coins`
!!! description "`MetaRegistry.find_pools_for_coins(_from: address, _to: address) -> DynArray[address, 1000]:`"

    Getter method for a list of pools that holds `_from` and `_to` coins.

    Returns: pool list (`DynArray[address, 1000]`).

    | Input   | Type      | Description                    |
    | ------- | --------- | ------------------------------ |
    | `_from` | `address` | Address of coin to be sent     |
    | `_to`   | `address` | Address of coin to be received |

    ??? quote "Source code"

        ```vyper
        @view
        @external
        def find_pools_for_coins(_from: address, _to: address) -> DynArray[address, 1000]:
            """
            @notice Find all pools that contain the input pair
            @param _from Address of coin to be sent
            @param _to Address of coin to be received
            @return Pool addresses
            """
            pools_found: DynArray[address, 1000]= empty(DynArray[address, 1000])
            pool: address = empty(address)
            registry: address = empty(address)

            for registry_index in range(MAX_REGISTRIES):

                registry = self.get_registry[registry_index]
                if registry == empty(address):
                    break

                for j in range(0, 65536):

                    pool = RegistryHandler(registry).find_pool_for_coins(_from, _to, j)
                    if pool == empty(address):
                        break
                    pools_found.append(pool)

            return pools_found
        ```

    === "Example"
        ```shell
        >>> MetaRegistry.find_pool_for_coins("0x6B175474E89094C44Da98b954EedeAC495271d0F", "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48")
        [[0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7]
        [0xDeBF20617708857ebe4F679508E7b7863a8A8EeE]
        [0x79a8C46DeA5aDa233ABaFFD40F3A0A2B1e5A4F27]
        [0xA2B47E3D5c44877cca798226B7B8118F9BFb7A56]
        [0x2dded6Da1BF5DBdF597C45fcFaa3194e53EcfeAF]
        [0x06364f10B501e868329afBc005b3492902d6C763]
        [0xA5407eAE9Ba41422680e2e00537571bcC53efBfD]
        [0xA5407eAE9Ba41422680e2e00537571bcC53efBfD]
        [0x52EA46506B9CC5Ef470C5bf89f17Dc28bB35D85C]
        [0x45F783CCE6B7FF23B2ab2D70e416cdb7D6055f51]]
        ```


### `find_pool_for_coins`
!!! description "`MetaRegistry.find_pool_for_coins(_from: address, _to: address, i: uint256 = 0) -> address:`"

    Getter method for a pool that holds two coins (even if the pool is a metapool). The index in the query returns the index of the list of pools containing the two coins.

    Returns: pool (`address`).

    | Input   | Type      | Description                    |
    | ------- | --------- | ------------------------------ |
    | `_from` | `address` | Address of coin to be sent     |
    | `_to`   | `address` | Address of coin to be received |
    | `i`     | `uint256` | Index of the pool to return    |

    ??? quote "Source code"

        ```vyper
        @view
        @external
        def find_pool_for_coins(_from: address, _to: address, i: uint256 = 0) -> address:
            """
            @notice Find the ith available pool containing the input pair
            @param _from Address of coin to be sent
            @param _to Address of coin to be received
            @param i Index of the pool to return
            @return Pool address
            """
            pools_found: uint256 = 0
            pool: address = empty(address)
            registry: address = empty(address)

            for registry_index in range(MAX_REGISTRIES):

                registry = self.get_registry[registry_index]
                if registry == empty(address):
                    break

                for j in range(0, 65536):

                    pool = RegistryHandler(registry).find_pool_for_coins(_from, _to, j)
                    if pool == empty(address):
                        break
                    pools_found += 1
                    if pools_found > i:
                        return pool

            return pool
        ```

    === "Example"
        ```shell
        >>> MetaRegistry.find_pool_for_coins("0x6B175474E89094C44Da98b954EedeAC495271d0F", "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", 0)
        '0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7'

        >>> MetaRegistry.find_pool_for_coins("0x6B175474E89094C44Da98b954EedeAC495271d0F", "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", 1)
        '0xDeBF20617708857ebe4F679508E7b7863a8A8EeE'
        ```


---


## **MetaRegistry Specific Information**

The factory has a similar API to that of the main Registry, which can be used to query information about existing pools.

### `pool_count`
!!! description "`MetaRegistry.pool_count() -> uint256:`"

    Getter for the total number of pools of all registries registered in the metaregistry.

    Returns: number of pools (`uint256`).

    ??? quote "Source code"

        ```vyper
        @external
        @view
        def pool_count() -> uint256:
            """
            @notice Return the total number of pools tracked by the metaregistry
            @return uint256 The number of pools in the metaregistry
            """
            total_pools: uint256 = 0
            for i in range(MAX_REGISTRIES):
                if i == self.registry_length:
                    break
                handler: address = self.get_registry[i]
                total_pools += RegistryHandler(handler).pool_count()
            return total_pools
        ```

    === "Example"
        ```shell
        >>> MetaRegistry.pool_count()
        49
        ```


### `pool_list`
!!! description "`MetaRegistry.pool_list(_index: uint256) -> address:`"

    Getter for the pool at `_index`.

    Returns: pool (`address`)

    | Input    | Type      | Description       |
    | -------  | --------- | ----------------- |
    | `_index` | `uint256` | Index of the pool |

    ??? quote "Source code"

        ```vyper
        @external
        @view
        def pool_list(_index: uint256) -> address:
            """
            @notice Return the pool at a given index in the metaregistry
            @param _index The index of the pool in the metaregistry
            @return The address of the pool at the given index
            """
            pools_skip: uint256 = 0
            for i in range(MAX_REGISTRIES):
                if i == self.registry_length:
                    break
                handler: address = self.get_registry[i]
                count: uint256 = RegistryHandler(handler).pool_count()
                if _index - pools_skip < count:
                    return RegistryHandler(handler).pool_list(_index - pools_skip)
                pools_skip += count
            return empty(address)
        ```

    === "Example"
        ```shell
        >>> MetaRegistry.pool_list(0)
        '0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7'
        ```


---


## **Pool Specific Information**

*The following methods are used to fetch pool specific information:*

### `get_pool_name`
!!! description "`MetaRegistry.get_pool_name(_pool: address, _handler_id: uint256 = 0) -> String[64]:`"

    Getter for the name of the pool.

    Returns: pool name (`String[64]`).

    | Input         | Type      | Description |
    | ------------- | --------- | ------------------- |
    | `_pool`       | `address` | Address of the pool |
    | `_handler_id` | `uint256` | ID of the `RegistryHandler`; defaults to 0 |

    ??? quote "Source code"

        ```vyper
        @external
        @view
        def get_pool_name(_pool: address, _handler_id: uint256 = 0) -> String[64]:
            """
            @notice Get the given name for a pool
            @param _pool Pool address
            @return The name of a pool
            """
            return RegistryHandler(self._get_registry_handlers_from_pool(_pool)[_handler_id]).get_pool_name(_pool)
        ```

    === "Example"
        ```shell
        >>> MetaRegistry.get_pool_name("0xEd279fDD11cA84bEef15AF5D39BB4d4bEE23F0cA")
        'lusd'
        ```


### `is_meta`
!!! description "`MetaRegistry.is_meta(_pool: address, _handler_id: uint256 = 0) -> bool:`"

    Getter method to check if a pool is a metapool. Metapools are pools that pair a coin to a base pool comprising of multiple coins.

    Returns: true or false (`bool`).

    !!!example
        An example is the [LUSD-3CRV](https://etherscan.io/address/0xed279fdd11ca84beef15af5d39bb4d4bee23f0ca) pool which pairs [Liquity's](https://www.liquity.org/) [LUSD](https://etherscan.io/address/0x5f98805a4e8be255a32880fdec7f6728c6568ba0) against [3CRV](https://etherscan.io/address/0x6c3f90f043a72fa612cbac8115ee7e52bde6e490), where 3CRV is a liquidity pool token that represents a share of a pool containing DAI, USDC and USDT.

    | Input         | Type      | Description |
    | ------------- | --------- | ------------------- |
    | `_pool`       | `address` | Address of the pool |
    | `_handler_id` | `uint256` | ID of the `RegistryHandler`; defaults to 0 |

    ??? quote "Source code"

        ```vyper
        @external
        @view
        def is_meta(_pool: address, _handler_id: uint256 = 0) -> bool:
            """
            @notice Verify `_pool` is a metapool
            @param _pool Pool address
            @param _handler_id id of registry handler
            @return True if `_pool` is a metapool
            """
            return RegistryHandler(self._get_registry_handlers_from_pool(_pool)[_handler_id]).is_meta(_pool)
        ```

    === "Example"
        ```shell
        >>> MetaRegistry.is_meta("0xEd279fDD11cA84bEef15AF5D39BB4d4bEE23F0cA")
        'true'
        ```


### `get_base_pool`
!!! description "`MetaRegistry.get_base_pool(_pool: address, _handler_id: uint256 = 0) -> address:`"

    Getter for the base pool of a metapool. If there is no base pool, it will return `ZERO_ADDRESS`.

    Returns: base pool (`address`).

    !!!example
        In the case of the LUSD-3CRV pool example, the pool containing 3CRV underlying coins is the base pool of the LUSD-3CRV pool, which is the [3pool](https://etherscan.io/address/0xbebc44782c7db0a1a60cb6fe97d0b483032ff1c7).

    | Input         | Type      | Description |
    | ------------- | --------- | ------------------- |
    | `_pool`       | `address` | Address of the pool |
    | `_handler_id` | `uint256` | ID of the `RegistryHandler`; defaults to 0 |

    ??? quote "Source code"

        ```vyper
        @external
        @view
        def get_base_pool(_pool: address, _handler_id: uint256 = 0) -> address:
            """
            @notice Get the base pool for a given factory metapool
            @dev Will return empty(address) if pool is not a metapool
            @param _pool Metapool address
            @param _handler_id id of registry handler
            @return Address of base pool
            """
            return RegistryHandler(self._get_registry_handlers_from_pool(_pool)[_handler_id]).get_base_pool(_pool)
        ```

    === "Example"
        ```shell
        >>> MetaRegistry.get_base_pool("0xEd279fDD11cA84bEef15AF5D39BB4d4bEE23F0cA")
        '0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7'
        ```


### `get_fees`
!!! description "`MetaRegistry.get_fees(_pool: address, _handler_id: uint256 = 0) -> uint256[10]:`"

    Getter for the fees that a Curve pool charges per swap. The fee data returned varies depending on the type of pool:

    - **Stableswap pools:** Use a single fee parameter.
    - **Cryptoswap pools:** Use multiple fee parameters due to their dynamic fee structure.

    | Input         | Type      | Description |
    | ------------- | --------- | ------------------- |
    | `_pool`       | `address` | Address of the pool |
    | `_handler_id` | `uint256` | ID of the `RegistryHandler`; defaults to 0 |

    ??? quote "Source code"

        ```vyper
        @external
        @view
        def get_fees(_pool: address, _handler_id: uint256 = 0) -> uint256[10]:
            """
            @notice Get pool fees
            @dev Fees are expressed as integers
            @param _pool Pool address
            @param _handler_id id of registry handler
            @return Pool fee as uint256 with 1e10 precision
                    Admin fee as 1e10 percentage of pool fee
                    Mid fee
                    Out fee
                    6 blank spots for future use cases
            """
            return RegistryHandler(self._get_registry_handlers_from_pool(_pool)[_handler_id]).get_fees(_pool)
        ```

    For Stableswap, the getter returns the `fee` per swap and the `admin_fee` percentage. For the `3pool`, it shows that the pool charges 1 basis point per swap, 50% of which goes to the DAO.

    === "Example"
        ```shell
        >>> MetaRegistry.get_fees("0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7")
        1000000, 5000000000, 0, 0, 0, 0, 0, 0, 0, 0
        ```

    ---

    For **Cryptoswap**, the getter returns: `fee`, `admin_fee` percentage, `mid_fee` and `out_fee`. The fee is the dynamic fee charged per swap, and depends on the `mid_fee` (fee when the Cryptoswap pool is pegged) and the `out_fee`. To understand the dynamic fee algorithm, the reader is pointed to the Cryptoswap Paper.

    === "Example"
        ```shell
        >>> MetaRegistry.get_fees("0xd51a44d3fae010294c616388b506acda1bfaae46")
        4013741, 5000000000, 3000000, 30000000
        ```


### `get_pool_params`
!!! description "`MetaRegistry.get_pool_params(_pool: address, _handler_id: uint256 = 0) -> uint256[MAX_POOL_PARAMS]:`"

    Getter for the parameters of a pool.

    Returns: parameters (`uint256[MAX_POOL_PARAMS]`).

    | Input         | Type      | Description |
    | ------------- | --------- | ------------------- |
    | `_pool`       | `address` | Address of the pool |
    | `_handler_id` | `uint256` | ID of the `RegistryHandler`; defaults to 0 |

    ??? quote "Source code"

        ```vyper
        @external
        @view
        def get_pool_params(_pool: address, _handler_id: uint256 = 0) -> uint256[MAX_POOL_PARAMS]:
            """
            @notice Get the parameters of a pool
            @param _pool Pool address
            @param _handler_id id of registry handler
            @return Pool parameters
            """
            registry_handler: address = self._get_registry_handlers_from_pool(_pool)[_handler_id]
            return RegistryHandler(registry_handler).get_pool_params(_pool)
        ```

    For **Stableswap**, the getter returns the pool's amplification coefficient (`A`).

    === "Example"
        ```shell
        >>> MetaRegistry.metaregistry.get_pool_params("0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7")
        2000, ...
        ```

    ---

    For **Cryptoswap**, the getter returns:

    1. Amplification coefficient (A)
    2. Invariant (D)
    3. Gamma coefficient (gamma)
    4. Allowed extra profit
    5. Fee gamma
    6. Adjustment step
    7. MA (moving average) half time

    === "Example"
        ```shell
        >>> MetaRegistry.metaregistry.get_pool_params("0xd51a44d3fae010294c616388b506acda1bfaae46")
        1707629, 213185652730133888176923598, 11809167828997, 2000000000000, 500000000000000, 490000000000000, 600, ...
        ```


### `get_lp_token`
!!! description "`MetaRegistry.get_lp_token(_pool: address, _handler_id: uint256 = 0) -> address:`"

    Getter for the LP token of a liquidity pool.

    Returns: LP Token (`address`).

    | Input         | Type      | Description |
    | ------------- | --------- | ------------------- |
    | `_pool`       | `address` | Address of the pool |
    | `_handler_id` | `uint256` | ID of the `RegistryHandler`; defaults to 0 |

    ??? quote "Source code"

        ```vyper
        @external
        @view
        def get_lp_token(_pool: address, _handler_id: uint256 = 0) -> address:
            """
            @notice Get the address of the LP token of a pool
            @param _pool Pool address
            @param _handler_id id of registry handler
            @return Address of the LP token
            """
            return RegistryHandler(self._get_registry_handlers_from_pool(_pool)[_handler_id]).get_lp_token(_pool)
        ```

    === "Example"
        ```shell
        >>> MetaRegistry.get_lp_token("0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7")
        '0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490'
        ```


### `get_pool_asset_type`
!!! description "`MetaRegistry.get_pool_asset_type(_pool: address, _handler_id: uint256 = 0) -> uint256:`"

    Getter for the asset type of a pool. **`0 = USD`, `1 = ETH`, `2 = BTC`, `3 = Other`, `4 = CryptoPool`** token. The asset type is a property of Stableswaps, and is not enforced in Cryptoswap pools (which always return 4).

    Returns: asset type id (`uint256`).

    | Input         | Type      | Description |
    | ------------- | --------- | ------------------- |
    | `_pool`       | `address` | Address of the pool |
    | `_handler_id` | `uint256` | ID of the `RegistryHandler`; defaults to 0 |

    ??? quote "Source code"

        ```vyper
        @external
        @view
        def get_pool_asset_type(_pool: address, _handler_id: uint256 = 0) -> uint256:
            """
            @notice Query the asset type of `_pool`
            @param _pool Pool Address
            @return The asset type as an unstripped string
            @dev 0 : USD, 1: ETH, 2: BTC, 3: Other, 4: CryptoSwap
            """
            return RegistryHandler(self._get_registry_handlers_from_pool(_pool)[_handler_id]).get_pool_asset_type(_pool)
        ```

    === "Example"
        ```shell
        >>> MetaRegistry.get_pool_asset_type("0xed279fdd11ca84beef15af5d39bb4d4bee23f0ca")
        0
        ```


### `get_pool_from_lp_token`
!!! description "`MetaRegistry.get_pool_from_lp_token(_token: address, _handler_id: uint256 = 0) -> address:`"

    Getter for the liquidity pool associated with a LP token.

    Returns: liquidity pool (`address`).

    | Input         | Type      | Description |
    | ------------- | --------- | ------------------- |
    | `_pool`       | `address` | Address of the pool |
    | `_handler_id` | `uint256` | ID of the `RegistryHandler`; defaults to 0 |

    ??? quote "Source code"

        ```vyper
        @external
        @view
        def get_pool_from_lp_token(_token: address, _handler_id: uint256 = 0) -> address:
            """
            @notice Get the pool associated with an LP token
            @param _token LP token address
            @return Pool address
            """
            return self._get_pool_from_lp_token(_token)
        ```

    === "Example"
        ```shell
        >>> MetaRegistry.get_pool_from_lp_token("0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490")
        '0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7'
        ```


### `get_virtual_price_from_lp_token`
!!! description "`MetaRegistry.get_virtual_price_from_lp_token(_token: address, _handler_id: uint256 = 0) -> uint256:`"

    Getter for a token's virtual price. The virtual price of any pool begins with `1`, and increases as the pool accrues fees. This number constantly increases for Stableswap pools, unless the pool's amplification coefficient changes. For Cryptoswap pools, there are moments when the virtual price can go down (admin fee claims, changes to pool's parameters).

    Returns: virtual price of the lp token (`uint256`).

    | Input         | Type      | Description |
    | ------------- | --------- | ------------------- |
    | `_pool`       | `address` | Address of the pool |
    | `_handler_id` | `uint256` | ID of the `RegistryHandler`; defaults to 0 |

    ??? quote "Source code"

        ```vyper
        @external
        @view
        def get_virtual_price_from_lp_token(_token: address, _handler_id: uint256 = 0) -> uint256:
            """
            @notice Get the virtual price of a pool LP token
            @param _token LP token address
            @param _handler_id id of registry handler
            @return uint256 Virtual price
            """
            pool: address = self._get_pool_from_lp_token(_token)
            registry_handler: address = self._get_registry_handlers_from_pool(pool)[_handler_id]
            return RegistryHandler(registry_handler).get_virtual_price_from_lp_token(_token)
        ```

    === "Example"
        ```shell
        >>> MetaRegistry.get_virtual_price_from_lp_token("0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490")
        1025825497283946867
        ```


### `is_registered`
!!! description "`MetaRegistry.is_registered(_pool: address, _handler_id: uint256 = 0) -> bool:`"

    Method to check if a pool is in the `MetaRegistry` using `get_n_coins`.

    Returns: true or false (`bool`).

    | Input         | Type      | Description |
    | ------------- | --------- | ------------------- |
    | `_pool`       | `address` | Address of the pool |
    | `_handler_id` | `uint256` | ID of the `RegistryHandler`; defaults to 0 |

    ??? quote "Source code"

        ```vyper
        @external
        @view
        def is_registered(_pool: address, _handler_id: uint256 = 0) -> bool:
            """
            @notice Check if a pool is in the metaregistry using get_n_coins
            @param _pool The address of the pool
            @param _handler_id id of registry handler
            @return A bool corresponding to whether the pool belongs or not
            """
            return self._get_registry_handlers_from_pool(_pool)[_handler_id] != empty(address)
        ```

    === "Example"
        ```shell
        >>> MetaRegistry.is_registered('0xbebc44782c7db0a1a60cb6fe97d0b483032ff1c7')
        'true'
        ```


### `get_gauge`
!!! description "`MetaRegistry.get_gauge(_pool: address, gauge_idx: uint256 = 0, _handler_id: uint256 = 0) -> address:`"

    Getter for the liquidity gauge of a pool.

    Returns: gauge address (`address`).

    | Input         | Type      | Description |
    | ------------- | --------- | ------------------- |
    | `_pool`       | `address` | Address of the pool |
    | `_handler_id` | `uint256` | ID of the `RegistryHandler`; defaults to 0 |

    ??? quote "Source code"

        ```vyper
        @external
        @view
        def get_gauge(_pool: address, gauge_idx: uint256 = 0, _handler_id: uint256 = 0) -> address:
            """
            @notice Get a single liquidity gauge contract associated with a pool
            @param _pool Pool address
            @param gauge_idx Index of gauge to return
            @param _handler_id id of registry handler
            @return Address of gauge
            """
            registry_handler: RegistryHandler = RegistryHandler(self._get_registry_handlers_from_pool(_pool)[_handler_id])
            handler_output: address[10] = registry_handler.get_gauges(_pool)[0]
            return handler_output[gauge_idx]
        ```

    === "Example"
        ```shell
        >>> MetaRegistry.get_gauge("0xd51a44d3fae010294c616388b506acda1bfaae46")
        '0xdefd8fdd20e0f34115c7018ccfb655796f6b2168'
        ```


### `get_gauge_type`
!!! description "`MetaRegistry.get_gauge_type(_pool: address, gauge_idx: uint256 = 0, _handler_id: uint256 = 0) -> int128:`"

    Getter for the gauge type of the gauge associated with a liquidity pool.

    Returns: gauge type (`int128`).

    | Input         | Type   | Description |
    | ------------  | -------| ----|
    | `_pool`       | `address` |  Address of the pool |
    | `gauge_idx`   | `uint256` | Index of gauge to return; defaults to 0 |
    | `_handler_id` | `uint256` | ID of the `RegistryHandler`; defaults to 0 |

    ??? quote "Source code"

        ```vyper
        @external
        @view
        def get_gauge_type(_pool: address, gauge_idx: uint256 = 0, _handler_id: uint256 = 0) -> int128:
            """
            @notice Get gauge_type of a single liquidity gauge contract associated with a pool
            @param _pool Pool address
            @param gauge_idx Index of gauge to return
            @param _handler_id id of registry handler
            @return Address of gauge
            """
            registry_handler: RegistryHandler = RegistryHandler(self._get_registry_handlers_from_pool(_pool)[_handler_id])
            handler_output: int128[10] = registry_handler.get_gauges(_pool)[1]
            return handler_output[gauge_idx]
        ```

    === "Example"
        ```shell
        >>> MetaRegistry.get_gauge_type("0xd51a44d3fae010294c616388b506acda1bfaae46")
        5
        ```


---


## **Coin Specific Information**

*The following methods are used to fetch coin specific information:*

### `get_coins`
!!! description "`MetaRegistry.get_coins(_pool: address, _handler_id: uint256 = 0) -> address[MAX_COINS]:`"

    Getter method for the coins in a pool. If the pool is a metapool, it then returns the LP token of the base pool, and not the underlying coins.

    Returns: coin addresses (`address[MAX_COINS]`).

    | Input         | Type      | Description |
    | ------------- | --------- | ------------------- |
    | `_pool`       | `address` | Address of the pool |
    | `_handler_id` | `uint256` | ID of the `RegistryHandler`; defaults to 0 |

    ??? quote "Source code"

        ```vyper
        @external
        @view
        def get_coins(_pool: address, _handler_id: uint256 = 0) -> address[MAX_COINS]:
            """
            @notice Get the coins within a pool
            @dev For metapools, these are the wrapped coin addresses
            @param _pool Pool address
            @param _handler_id id of registry handler
            @return List of coin addresses
            """
            return RegistryHandler(self._get_registry_handlers_from_pool(_pool)[_handler_id]).get_coins(_pool)
        ```

    === "Example"
        ```shell
        >>> MetaRegistry.get_coins("0xEd279fDD11cA84bEef15AF5D39BB4d4bEE23F0cA")    # LUSD-3CRV pool
        [[0x5f98805A4E8be255a32880FDeC7F6728C6568bA0]                               # LUSD
        [0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490]                                # 3CRV (basepool LP token)
        [0x0000000000000000000000000000000000000000]
        [0x0000000000000000000000000000000000000000]
        [0x0000000000000000000000000000000000000000]
        [0x0000000000000000000000000000000000000000]
        [0x0000000000000000000000000000000000000000]
        [0x0000000000000000000000000000000000000000]]
        ```


### `get_n_coins`
!!! description "`MetaRegistry.get_n_coins(_pool: address, _handler_id: uint256 = 0) -> uint256:`"

    Getter for the number of coins in a pool.

    Returns: number of coins (`uint256`).

    | Input         | Type      | Description |
    | ------------- | --------- | ------------------- |
    | `_pool`       | `address` | Address of the pool |
    | `_handler_id` | `uint256` | ID of the `RegistryHandler`; defaults to 0 |

    ??? quote "Source code"

        ```vyper
        @external
        @view
        def get_n_coins(_pool: address, _handler_id: uint256 = 0) -> uint256:
            """
            @notice Get the number of coins in a pool
            @dev For metapools, it is tokens + wrapping/lending token (no underlying)
            @param _pool Pool address
            @return Number of coins
            """
            return RegistryHandler(self._get_registry_handlers_from_pool(_pool)[_handler_id]).get_n_coins(_pool)
        ```

    === "Example"
        ```shell
        >>> MetaRegistry.get_n_coins("0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7")
        3
        ```


### `get_decimals`
!!! description "`MetaRegistry.get_decimals(_pool: address, _handler_id: uint256 = 0) -> uint256[MAX_COINS]:`"

    Getter for the decimals of the coins that are returned by `get_coins`. When querying for metapools, this method returns the decimals of the metapool token and the LP token of the basepool.

    Returns: number of decimals (`uint256[MAX_COINS]`).

    | Input         | Type      | Description |
    | ------------- | --------- | ------------------- |
    | `_pool`       | `address` | Address of the pool |
    | `_handler_id` | `uint256` | ID of the `RegistryHandler`; defaults to 0 |

    ??? quote "Source code"

        ```vyper
        @external
        @view
        def get_decimals(_pool: address, _handler_id: uint256 = 0) -> uint256[MAX_COINS]:
            """
            @notice Get decimal places for each coin within a pool
            @dev For metapools, these are the wrapped coin decimal places
            @param _pool Pool address
            @param _handler_id id of registry handler
            @return uint256 list of decimals
            """
            return RegistryHandler(self._get_registry_handlers_from_pool(_pool)[_handler_id]).get_decimals(_pool)
        ```

    === "Example"
        ```shell
        >>> MetaRegistry.get_decimals("0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7")
        18, 6, 6, 0, 0, 0, 0, 0         # decimals of DAI, USDT, USDC

        >>> MetaRegistry.get_decimals("0xEd279fDD11cA84bEef15AF5D39BB4d4bEE23F0cA")
        18, 18, 0, 0, 0, 0, 0, 0        # decimals of LUSD, 3CRV
        ```


### `get_balances`
!!! description "`MetaRegistry.get_balances(_pool: address, _handler_id: uint256 = 0)  -> uint256[MAX_COINS]:`"

    Getter for the balance of each coin within a pool. When querying for metapools, this method returns the balances of the metapool token and the LP token of the basepool. To also fetch the underlying balances of the basepool, see [`get_underlying_balances`](#get_underlying_balances).

    Returns: balances (`uint256[MAX_COINS]`).

    | Input         | Type      | Description |
    | ------------- | --------- | ------------------- |
    | `_pool`       | `address` | Address of the pool |
    | `_handler_id` | `uint256` | ID of the `RegistryHandler`; defaults to 0 |

    ??? quote "Source code"

        ```vyper
        @external
        @view
        def get_balances(_pool: address, _handler_id: uint256 = 0)  -> uint256[MAX_COINS]:
            """
            @notice Get balances for each coin within a pool
            @dev For metapools, these are the wrapped coin balances
            @param _pool Pool address
            @param _handler_id id of registry handler
            @return uint256 list of balances
            """
            return RegistryHandler(self._get_registry_handlers_from_pool(_pool)[_handler_id]).get_balances(_pool)
        ```

    === "Example"
        ```shell
        >>> MetaRegistry.get_balances("0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7")
        147006104035945155794243533, 141336760960804, 94869577680718, 0, 0, 0, 0, 0

        >>> MetaRegistry.get_balances("0xEd279fDD11cA84bEef15AF5D39BB4d4bEE23F0cA")
        6781730641038140101957300, 5934556341193690490470482, 0, 0, 0, 0, 0, 0
        ```


### `get_underlying_coins`
!!! description "`MetaRegistry.get_underlying_coins(_pool: address, _handler_id: uint256 = 0) -> address[MAX_COINS]:`"

    Getter for the underlying coins in a metapool. For non-metapools it returns the same value as **`get_coins`**.

    Returns: underlying coins (`address[MAX_COINS]`).

    | Input         | Type      | Description |
    | ------------- | --------- | ------------------- |
    | `_pool`       | `address` | Address of the pool |
    | `_handler_id` | `uint256` | ID of the `RegistryHandler`; defaults to 0 |

    ??? quote "Source code"

        ```vyper
        @external
        @view
        def get_underlying_coins(_pool: address, _handler_id: uint256 = 0) -> address[MAX_COINS]:
            """
            @notice Get the underlying coins within a pool
            @dev For non-metapools, returns the same value as `get_coins`
            @param _pool Pool address
            @param _handler_id id of registry handler
            @return List of coin addresses
            """
            return RegistryHandler(self._get_registry_handlers_from_pool(_pool)[_handler_id]).get_underlying_coins(_pool)
        ```

    === "Example"
        ```shell
        >>> MetaRegistry.get_underlying_coins("0xEd279fDD11cA84bEef15AF5D39BB4d4bEE23F0cA")
        [[0x5f98805A4E8be255a32880FDeC7F6728C6568bA0]       # LUSD
        [0x6B175474E89094C44Da98b954EedeAC495271d0F]        # DAI
        [0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48]        # USDC
        [0xdAC17F958D2ee523a2206206994597C13D831ec7]        # USDT
        [0x0000000000000000000000000000000000000000]
        [0x0000000000000000000000000000000000000000]
        [0x0000000000000000000000000000000000000000]
        [0x0000000000000000000000000000000000000000]]
        ```


### `get_n_underlying_coins`
!!! description "`MetaRegistry.get_n_underlying_coins(_pool: address, _handler_id: uint256 = 0) -> uint256:`"

    Getter method for the total number of underlying coins in a pool. For non-metapools it returns the same value as [`get_n_coins`](#get_n_coins).

    Returns: number of underlying coins (`uin256`).

    | Input         | Type      | Description |
    | ------------- | --------- | ------------------- |
    | `_pool`       | `address` | Address of the pool |
    | `_handler_id` | `uint256` | ID of the `RegistryHandler`; defaults to 0 |

    ??? quote "Source code"

        ```vyper
        @external
        @view
        def get_n_underlying_coins(_pool: address, _handler_id: uint256 = 0) -> uint256:
            """
            @notice Get the number of underlying coins in a pool
            @dev For non-metapools, returns the same as get_n_coins
            @param _pool Pool address
            @return Number of coins
            """
            return RegistryHandler(self._get_registry_handlers_from_pool(_pool)[_handler_id]).get_n_underlying_coins(_pool)
        ```

    === "Example"
        ```shell
        >>> MetaRegistry.get_n_underlying_coins("0xEd279fDD11cA84bEef15AF5D39BB4d4bEE23F0cA")
        4
        ```


### `get_underlying_decimals`
!!! description "`MetaRegistry.get_underlying_decimals(_pool: address, _handler_id: uint256 = 0) -> uint256[MAX_COINS]:`"

    Getter method for the decimal of each underlying coin within a pool.

    Returns: number of decimals (`uint256[MAX_COINS]`).

    | Input         | Type      | Description |
    | ------------- | --------- | ------------------- |
    | `_pool`       | `address` | Address of the pool |
    | `_handler_id` | `uint256` | ID of the `RegistryHandler`; defaults to 0 |

    ??? quote "Source code"

        ```vyper
        @external
        @view
        def get_underlying_decimals(_pool: address, _handler_id: uint256 = 0) -> uint256[MAX_COINS]:
            """
            @notice Get decimal places for each underlying coin within a pool
            @dev For non-metapools, returns the same value as `get_decimals`
            @param _pool Pool address
            @param _handler_id id of registry handler
            @return uint256 list of decimals
            """
            return RegistryHandler(self._get_registry_handlers_from_pool(_pool)[_handler_id]).get_underlying_decimals(_pool)
        ```

    === "Example"
        ```shell
        >>> MetaRegistry.get_decimals("0xEd279fDD11cA84bEef15AF5D39BB4d4bEE23F0cA")
        18, 18, 6, 6, 0, 0, 0, 0        # decimals of LUSD, DAI, USDC, USDT
        ```


### `get_underlying_balances`
!!! description "`MetaRegistry.get_underlying_balances(_pool: address, _handler_id: uint256 = 0) -> uint256[MAX_COINS]:`"

    Getter method for a pool's balances of the underlying coins which are returned by [`get_underlying_coins`](#get_underlying_coins).

    Returns: balances (`uint256[MAX_COINS]`).

    | Input         | Type      | Description |
    | ------------- | --------- | ------------------- |
    | `_pool`       | `address` | Address of the pool |
    | `_handler_id` | `uint256` | ID of the `RegistryHandler`; defaults to 0 |

    ??? quote "Source code"

        ```vyper
        @external
        @view
        def get_underlying_balances(_pool: address, _handler_id: uint256 = 0) -> uint256[MAX_COINS]:
            """
            @notice Get balances for each underlying coin within a pool
            @dev For non-metapools, returns the same value as `get_balances`
            @param _pool Pool address
            @param _handler_id id of registry handler
            @return uint256 List of underlying balances
            """
            return RegistryHandler(self._get_registry_handlers_from_pool(_pool)[_handler_id]).get_underlying_balances(_pool)
        ```

    === "Example"
        ```shell
        >>> MetaRegistry.get_balances("0xEd279fDD11cA84bEef15AF5D39BB4d4bEE23F0cA")
        4362795413803847111710482, 7574850164613791626778647, 7282723353910, 4888387736171, 0, 0, 0, 0
        # balances of LUSD, DAI, USDC, USDT
        ```


### `get_admin_balances`
!!! description "`MetaRegistry.get_admin_balances(_pool: address, _handler_id: uint256 = 0) -> uint256[MAX_COINS]:`"

    Getter for the pool's admin balances. The balances represent the balances per coin, and retain the coin's precision.

    Returns: admin balances (`uint256[MAX_COINS]`).

    | Input         | Type      | Description |
    | ------------- | --------- | ------------------- |
    | `_pool`       | `address` | Address of the pool |
    | `_handler_id` | `uint256` | ID of the `RegistryHandler`; defaults to 0 |

    ??? quote "Source code"

        ```vyper
        @external
        @view
        def get_admin_balances(_pool: address, _handler_id: uint256 = 0) -> uint256[MAX_COINS]:
            """
            @notice Get the current admin balances (uncollected fees) for a pool
            @dev _handler_id < 1 if pool is registry in one handler, more than 0 otherwise
            @param _pool Pool address
            @param _handler_id id of registry handler
            @return List of uint256 admin balances
            """
            return RegistryHandler(self._get_registry_handlers_from_pool(_pool)[_handler_id]).get_admin_balances(_pool)
        ```

    === "Example"
        ```shell
        >>> MetaRegistry.get_admin_balances("0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7")
        1590779934844205413773, 3866051363, 5204415383, 0, 0, 0, 0, 0           # admin balances of DAI, USDC, USDT

        >>> MetaRegistry.get_admin_balances("0xEd279fDD11cA84bEef15AF5D39BB4d4bEE23F0cA")
        574625025164093926144, 321761837541842998875, 0, 0, 0, 0, 0, 0          # admin balances of LUSD, 3CRV
        ```


### `get_coin_indices` todo
!!! description "`MetaRegistry.get_coin_indices(_pool: address, _from: address, _to: address, _handler_id: uint256 = 0) -> (int128, int128, bool):`"

    Getter method which converts coin addresses to indices for use with pool methods.

    Returns: from index (`int128`), to index (`int128`) and whether the market is underlying or not (`bool`).

    | Input         | Type      | Description                                    |
    | ------------- | --------- | ---------------------------------------------- |
    | `_pool`       | `address` | Address of the pool                            |
    | `_from`       | `address` | Coin address to be used as `i` within the pool |
    | `_to`         | `address` | Coin address to be used as `j` within the pool |
    | `_handler_id` | `uint256` | ID of the `RegistryHandler`; defaults to 0     |

    ??? quote "Source code"

        ```vyper
        @view
        @external
        def get_coin_indices(_pool: address, _from: address, _to: address, _handler_id: uint256 = 0) -> (int128, int128, bool):
            """
            @notice Convert coin addresses to indices for use with pool methods
            @param _pool Pool address
            @param _from Coin address to be used as `i` within a pool
            @param _to Coin address to be used as `j` within a pool
            @param _handler_id id of registry handler
            @return from index, to index, is the market underlying ?
            """
            return RegistryHandler(self._get_registry_handlers_from_pool(_pool)[_handler_id]).get_coin_indices(_pool, _from, _to)
        ```

    === "Example"
        ```shell
        >>> MetaRegistry.metaregistry.get_coin_indices("0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7", "0x6B175474E89094C44Da98b954EedeAC495271d0F", "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48")
        0, 1, false     # DAI is coin index0, USDC is coin index1 and no underlying coins

        >>> MetaRegistry.metaregistry.get_coin_indices("0xEd279fDD11cA84bEef15AF5D39BB4d4bEE23F0cA", "0x5f98805A4E8be255a32880FDeC7F6728C6568bA0", "0xdAC17F958D2ee523a2206206994597C13D831ec7")

        0, 3, false     # LUSD is coin index0, USDT is coin index3 and underlying
        ```


---


## **Handler and Registry Specific Information**

*The following methods are used to fetch handler and registry specific information and function to add or update handlers:*


### `get_registry_handlers_from_pool`
!!! description "`MetaRegistry.get_registry_handlers_from_pool(_pool: address) -> address[MAX_REGISTRIES]:`"

    Getter for the `RegistryHandler` that a pool has been registered in. Usually, each pool is registered in a single registry.

    Returns: `RegistryHandler` (`address[MAX_REGISTRIES]`).

    | Input         | Type      | Description |
    | ------------- | --------- | ------------------- |
    | `_pool`       | `address` | Address of the pool |

    ??? quote "Source code"

        ```vyper
        @internal
        @view
        def _get_registry_handlers_from_pool(_pool: address) -> address[MAX_REGISTRIES]:
            """
            @notice Get registry handler that handles the registry api for a pool
            @dev sometimes a factory pool can be registered in a manual registry
                because of this, we always take the last registry a pool is
                registered in and not the first, as manual registries are first
                and factories come later
            @param _pool address of the pool
            @return registry_handlers: address[MAX_REGISTRIES]
            """

            pool_registry_handler: address[MAX_REGISTRIES] = empty(address[MAX_REGISTRIES])
            c: uint256 = 0
            for i in range(MAX_REGISTRIES):

                if i == self.registry_length:
                    break
                handler: address = self.get_registry[i]

                if RegistryHandler(handler).is_registered(_pool):
                    pool_registry_handler[c] = handler
                    c += 1

            if pool_registry_handler[0] == empty(address):
                raise("no registry")
            return pool_registry_handler

        @external
        @view
        def get_registry_handlers_from_pool(_pool: address) -> address[MAX_REGISTRIES]:
            """
            @notice Get the registry handlers associated with a pool
            @param _pool Pool address
            @return List of registry handlers
            """
            return self._get_registry_handlers_from_pool(_pool)
        ```

    === "Example"
        ```shell
        >>> MetaRegistry.get_registry_handlers_from_pool("0xbebc44782c7db0a1a60cb6fe97d0b483032ff1c7")
        '0x46a8a9CF4Fc8e99EC3A14558ACABC1D93A27de68'
        ```


### `get_base_registry`
!!! description "`MetaRegistry.get_base_registry(registry_handler: address) -> address:`"

    Getter for the registry associated with a registry handler.

    Returns: base registry (`address`).

    | Input              | Type      | Description                |
    | ------------------ | --------- | -------------------------- |
    | `registry_handler` | `address` | `RegistryHandler` contract |

    ??? quote "Source code"

        ```vyper
        @external
        @view
        def get_base_registry(registry_handler: address) -> address:
            """
            @notice Get the registry associated with a registry handler
            @param registry_handler Registry Handler address
            @return Address of base registry
            """
            return RegistryHandler(registry_handler).base_registry()
        ```

    === "Example"
        ```shell
        >>> MetaRegistry.get_base_registry("0x46a8a9CF4Fc8e99EC3A14558ACABC1D93A27de68")
        '0x90E00ACe148ca3b23Ac1bC8C240C2a7Dd9c2d7f5'
        ```


### `get_registry`
!!! description "`MetaRegistry.get_registry(arg0: uint256) -> address:`"

    Getter for the `RegistryHandler` at index `arg0`. New handlers can be added via [`add_registry_handler`](#add_registry_handler).

    Returns: Registry (`address`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `arg0` |  `uint256` | index (starts with 0) |

    ??? quote "Source code"

        ```vyper
        # get registry/registry_handler by index, index starts at 0:
        get_registry: public(HashMap[uint256, address])
        registry_length: public(uint256)
        ```

    === "Example"
        ```shell
        >>> MetaRegistry.get_registry(0)
        '0x46a8a9CF4Fc8e99EC3A14558ACABC1D93A27de68'
        ```


### `registry_length`
!!! description "`MetaRegistry.registry_length() -> uin256:`"

    Getter for the registry length.

    Returns: number of registries added (`uint256`).

    ??? quote "Source code"

        ```vyper
        # get registry/registry_handler by index, index starts at 0:
        get_registry: public(HashMap[uint256, address])
        registry_length: public(uint256)
        ```

    === "Example"
        ```shell
        >>> MetaRegistry.registry_length(0)
        7
        ```


### `address_provider`
!!! description "`MetaRegistry.address_provider() -> address:`"

    Getter for the `AddressProvider` contract.

    Returns: `AddressProvider` (`address`).

    ??? quote "Source code"

        ```vyper
        address_provider: public(AddressProvider)

        @external
        def __init__(_address_provider: address):
            self.address_provider = AddressProvider(_address_provider)
            self.owner = AddressProvider(_address_provider).admin()
        ```

    === "Example"
        ```shell
        >>> MetaRegistry.address_provider()
        '0x0000000022D53366457F9d5E68Ec105046FC4383'
        ```


---


## **Adding and Updating Registries**

New registries can be added by the `owner` of the contract using the [`add_registry_handler`](#add_registry_handler) function. Existing ones can be updated using the [`update_registry_handler`](#update_registry_handler) function.

!!!colab "Google Colab Notebook"
    A Google Colab notebook showcasing how to query registries or add/update them can be found [:logos-googlecolab: here](https://colab.research.google.com/drive/1wFvIeNKpKhy58xkGSfKw0XzEPnwn9Zym?usp=sharing).


### `owner`
!!! description "`MetaRegistry.owner() -> address:`"

    Getter for the owner of the contract. This address can perform owner-guarded functions (see below).

    Returns: owner (`address`).

    ??? quote "Source code"

        ```vyper
        owner: public(address)

        @external
        def __init__(_address_provider: address):
            self.address_provider = AddressProvider(_address_provider)
            self.owner = AddressProvider(_address_provider).admin()
        ```

    === "Example"
        ```shell
        >>> MetaRegistry.owner()
        '0xEdf2C58E16Cc606Da1977e79E1e69e79C54fe242'
        ```


### `add_registry_handler`
!!! description "`MetaRegistry.add_registry_handler(_registry_handler: address):`"

    !!!guard "Guarded Method"
        This function is only callable by the `owner` of the contract.

    Function to add a registry handler to the `MetaRegistry`.

    | Input               | Type      | Description                      |
    | ------------------- | --------- | -------------------------------- |
    | `_registry_handler` | `address` | `RegistryHandler` address to add |

    ??? quote "Source code"

        ```vyper
        @external
        def add_registry_handler(_registry_handler: address):
            """
            @notice Adds a registry from the address provider entry
            @param _registry_handler Address of the handler contract
            """
            assert msg.sender == self.owner  # dev: only owner

            self._update_single_registry(self.registry_length, _registry_handler)

        @internal
        def _update_single_registry(_index: uint256, _registry_handler: address):
            assert _index <= self.registry_length

            if _index == self.registry_length:
                self.registry_length += 1

            self.get_registry[_index] = _registry_handler
        ```


### `update_registry_handler`
!!! description "`MetaRegistry.update_registry_handler(_index: uint256, _registry_handler: address):`"

    !!!guard "Guarded Method"
        This function is only callable by the `owner` of the contract.

    Function to update the `RegistryHandler` for a already existing one.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_index` |  `uint256` | index of registry according to `get_registry` |
    | `registry_handler` |  `address` | address of the new handler contract |

    ??? quote "Source code"

        ```vyper
        @external
        def update_registry_handler(_index: uint256, _registry_handler: address):
            """
            @notice Updates the contract used to handle a registry
            @param _index The index of the registry in get_registry
            @param _registry_handler Address of the new handler contract
            """
            assert msg.sender == self.owner  # dev: only owner
            assert _index < self.registry_length

            self._update_single_registry(_index, _registry_handler)

        @internal
        def _update_single_registry(_index: uint256, _registry_handler: address):
            assert _index <= self.registry_length

            if _index == self.registry_length:
                self.registry_length += 1

            self.get_registry[_index] = _registry_handler
        ```
