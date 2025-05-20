<h1>Meta Registry</h1>

The `MetaRegistry` functions as a Curve Pool Registry Aggregator and offers an **on-chain API** for various properties of Curve pools by **consolidating different registries into a single contract**.


!!!github "GitHub"
    The source code of the `MetaRegistry.vy` and `MetaRegistryL2.vy` contracts can be found on [:material-github: GitHub](https://github.com/curvefi/metaregistry/tree/main/contracts).

    Additionally, each `MetaRegistry` is integrated into the chain-specific [`AddressProvider`](./address-provider.md) at `ID = 7`. To get the **most recent contract, users are advised to fetch it directly from the `AddressProvider`.

    *For example, to query the `MetaRegistry` contract on Ethereum:*

    ```vyper
    >>> AddressProvider.get_address(7)
    '0xF98B45FA17DE75FB1aD0e7aFD971b0ca00e379fC'
    ```


*The contract utilizes `RegistryHandlers` interfaces to return data for most of the methods documented in this section:*

??? quote "`_get_registry_handlers_from_pool(_pool: address) -> address[MAX_REGISTRIES]:`"

    ```py
    # registry and registry handlers are considered to be the same here.
    # registry handlers are just wrapper contracts that simplify/fix underlying registries
    # for integrating it into the Metaregistry.
    interface RegistryHandler:
        def find_pool_for_coins(_from: address, _to: address, i: uint256 = 0) -> address: view
        def get_admin_balances(_pool: address) -> uint256[MAX_COINS]: view
        def get_balances(_pool: address) -> uint256[MAX_COINS]: view
        def get_base_pool(_pool: address) -> address: view
        def get_coins(_pool: address) -> address[MAX_COINS]: view
        def get_coin_indices(_pool: address, _from: address, _to: address) -> (int128, int128, bool): view
        def get_decimals(_pool: address) -> uint256[MAX_COINS]: view
        def get_fees(_pool: address) -> uint256[10]: view
        def get_gauges(_pool: address) -> (address[10], int128[10]): view
        def get_lp_token(_pool: address) -> address: view
        def get_n_coins(_pool: address) -> uint256: view
        def get_n_underlying_coins(_pool: address) -> uint256: view
        def get_pool_asset_type(_pool: address) -> uint256: view
        def get_pool_from_lp_token(_lp_token: address) -> address: view
        def get_pool_name(_pool: address) -> String[64]: view
        def get_pool_params(_pool: address) -> uint256[20]: view
        def get_underlying_balances(_pool: address) -> uint256[MAX_COINS]: view
        def get_underlying_coins(_pool: address) -> address[MAX_COINS]: view
        def get_underlying_decimals(_pool: address) -> uint256[MAX_COINS]: view
        def is_meta(_pool: address) -> bool: view
        def is_registered(_pool: address) -> bool: view
        def pool_count() -> uint256: view
        def pool_list(_index: uint256) -> address: view
        def get_virtual_price_from_lp_token(_addr: address) -> uint256: view
        def base_registry() -> address: view

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
            raise "no registry"
        return pool_registry_handler
    ```



---


## **Finding Pools**

Because the deployment of liquidity pools is permissionless, a significant number of pools are being deployed. Managing this vast array of pools can be challenging, and relying solely on a UI may not be the most effective and reliable approach. The `MetaRegistry` serves as an ideal tool for querying specific pools directly on-chain.

!!!info "Understanding Base- and Metapool Logic"
    The `MetaRegistry` considers metapools as well[^1]. For example, the [mkUSD/3CRV pool](https://etherscan.io/address/0x0CFe5C777A7438C9Dd8Add53ed671cEc7A5FAeE5) pairs `mkUSD` with the `3CRV` LP Token, which consists of `USDT`, `USDC`, and `DAI`. The contract identifies this logic and returns this pool e.g. when querying for `find_pools_for_coins(mkUSD, USDC)`, because mkUSD and USDC can be exchanged through this pool.

    [^1]: Metapools are liquidity pools that pair a token against the LP token of another pool.


*There are two key methods for querying pools containing two specific assets:*

- [`find_pools_for_coins`](#find_pools_for_coins): This function returns a list of all pools containing two specific tokens.
- [`find_pool_for_coins`](#find_pool_for_coins): This function returns a single pool containing two specific tokens, based on the input index from the list returned by `find_pools_for_coins`.


!!!colab "Google Colab Notebook"
    A guide on how to find liquidity pools which hold specific coins can be found [here](../integration/metaregistry.md#fetching-liquidity-pools).

    A Jupyter notebook showcasing how to fetch pools directly from the blockchain, which contain two specific assets, can be found [here](https://colab.research.google.com/drive/1QsxqxQu7Um8gYPda30304W8ZcYbnbr1b?usp=sharing).


### `find_pools_for_coins`
!!! description "`MetaRegistry.find_pools_for_coins(_from: address, _to: address) -> DynArray[address, 1000]`"

    Getter method for a list of pools that contain both the `_from` and `_to` tokens. It is designed to identify specific swap routes. The method returns all pools containing the specified assets, disregarding metrics such as total value locked (TVL) or other parameters.

    Returns: pools (`DynArray[address, 1000]`).

    | Input   | Type      | Description                    |
    | ------- | --------- | ------------------------------ |
    | `_from` | `address` | Address of coin to be sent     |
    | `_to`   | `address` | Address of coin to be received |

    ??? quote "Source code"

        === "MetaRegistry.vy"

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

            @view
            @external
            def find_pool_for_coins(
                _from: address, _to: address, i: uint256 = 0
            ) -> address:
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

        In this example, we search for pools that include `crvUSD` and `ETH`. The function returns all pools including those two assets.

        ```shell
        >>> MetaRegistry.find_pools_for_coins('0xf939E0A03FB07F59A73314E73794Be0E57ac1b4E', '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2')
        [[0x4eBdF703948ddCEA3B11f675B4D1Fba9d2414A14]           # triCRV: crvUSD <> ETH <> CRV
        [0x6A62EE3e5c4b412Cd9167D3aFd5E481e1E30715a]            # triOSAK: ETH <> crvUSD <> OSAK
        [0x5b3BA844b3859f56524e99Ae54857b36c8Ae3eFE]            # tirLDO: crvUSD <> ETH <> LDO
        [0xBed58C1053fd347843883eadE0781f562A66f623]            # triCVG: crvUSD <> ETH <> CVG
        [0x888a9cCA07Ad3A79Ee6671843A36941A45ECaF5A]            # yoooo: crvUSD <> DPI <> ETH
        [0xb72c9B6EfEd482c9Ba0D379164283E1EDf8212CF]]           # yoooo: crvUSD <> DPI <> ETH
        ```


### `find_pool_for_coins`
!!! description "`MetaRegistry.find_pool_for_coins(_from: address, _to: address, i: uint256 = 0) -> address`"

    Getter method for a pool that holds two coins (even if the pool is a metapool). The index in the query returns the index of the list of pools containing the two coins. The method returns all pools containing the specified assets, disregarding metrics such as total value locked (TVL) or other parameters.

    Returns: pool (`address`).

    | Input   | Type      | Description                    |
    | ------- | --------- | ------------------------------ |
    | `_from` | `address` | Address of coin to be sent     |
    | `_to`   | `address` | Address of coin to be received |
    | `i`     | `uint256` | Index of the pool to return    |

    ??? quote "Source code"

        === "MetaRegistry.vy"

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

        In this example, we search for a single pool at index `i` which includes `crvUSD` and `ETH`. This method essentially returns the pools returned by `find_pools_for_coins`.

        ```shell
        >>> MetaRegistry.find_pool_for_coins('0xf939E0A03FB07F59A73314E73794Be0E57ac1b4E', '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' 0)
        '0x4eBdF703948ddCEA3B11f675B4D1Fba9d2414A14'            # triCRV: crvUSD <> ETH <> CRV

        >>> MetaRegistry.find_pool_for_coins('0xf939E0A03FB07F59A73314E73794Be0E57ac1b4E', '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', 1)
        '0x6A62EE3e5c4b412Cd9167D3aFd5E481e1E30715a'            # triOSAK: ETH <> crvUSD <> OSAK
        ```


---


## **Pool Specific Informations**

All relevant pool and coin data for liquidity pools are stored in the `MetaRegistry`. This registry includes various functions that provide a wide range of data, such as pool balances, fees, decimals, and more.


### `pool_count`
!!! description "`MetaRegistry.pool_count() -> uint256`"

    Getter for the total number of pools registered in the `MetaRegistry`.

    Returns: number of pools registered (`uint256`).

    ??? quote "Source code"

        === "MetaRegistry.vy"

            ```vyper
            # get registry/registry_handler by index, index starts at 0:
            get_registry: public(HashMap[uint256, address])
            registry_length: public(uint256)

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
        1155
        ```


### `pool_list`
!!! description "`MetaRegistry.pool_list(_index: uint256) -> address`"

    Getter for the pool at `_index`, with the index starting at `0`.

    Returns: pool (`address`)

    | Input    | Type      | Description       |
    | -------  | --------- | ----------------- |
    | `_index` | `uint256` | Index of the pool |

    ??? quote "Source code"

        === "MetaRegistry.vy"

            ```vyper
            # get registry/registry_handler by index, index starts at 0:
            get_registry: public(HashMap[uint256, address])
            registry_length: public(uint256)

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

        These examples essentially return the pools at index `0` and `1`, which are the first and second pools added to the `MetaRegistry`.

        ```shell
        >>> MetaRegistry.pool_list(0)
        '0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7'

        >>> MetaRegistry.pool_list(0)
        '0xDeBF20617708857ebe4F679508E7b7863a8A8EeE'
        ```


### `get_pool_name`
!!! description "`MetaRegistry.get_pool_name(_pool: address, _handler_id: uint256 = 0) -> String[64]`"

    Getter for the name of a pool.

    Returns: name (`String[64]`).

    | Input         | Type      | Description |
    | ------------- | --------- | ------------------- |
    | `_pool`       | `address` | Address of the pool |
    | `_handler_id` | `uint256` | ID of the `RegistryHandler`; defaults to 0 |

    ??? quote "Source code"

        === "MetaRegistry.vy"

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
                    raise "no registry"
                return pool_registry_handler
            ```

    === "Example"

        ```shell
        >>> MetaRegistry.get_pool_name('0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7')
        '3pool'
        ```


### `is_meta`
!!! description "`MetaRegistry.is_meta(_pool: address, _handler_id: uint256 = 0) -> bool`"

    Getter method to check if a pool is a metapool. Metapools are pools that pair a coin to a base pool.

    Returns: true or false (`bool`).

    | Input         | Type      | Description                                |
    | ------------- | --------- | ------------------------------------------ |
    | `_pool`       | `address` | Address of the pool                        |
    | `_handler_id` | `uint256` | ID of the `RegistryHandler`; defaults to 0 |

    ??? quote "Source code"

        === "MetaRegistry.vy"

            ```vyper
            # registry and registry handlers are considered to be the same here.
            # registry handlers are just wrapper contracts that simplify/fix underlying registries
            # for integrating it into the Metaregistry.
            interface RegistryHandler:
                def is_meta(_pool: address) -> bool: view

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
                    raise "no registry"
                return pool_registry_handler
            ```

    === "Example"

        An example is the [LUSD-3CRV](https://etherscan.io/address/0xed279fdd11ca84beef15af5d39bb4d4bee23f0ca) pool, which pairs [Liquity's](https://www.liquity.org/) [LUSD](https://etherscan.io/address/0x5f98805a4e8be255a32880fdec7f6728c6568ba0) against [3CRV](https://etherscan.io/address/0x6c3f90f043a72fa612cbac8115ee7e52bde6e490). 3CRV is a liquidity pool token that represents a share of a pool containing DAI, USDC, and USDT.

        ```shell
        >>> MetaRegistry.is_meta('0xEd279fDD11cA84bEef15AF5D39BB4d4bEE23F0cA')
        'true'
        ```


### `get_base_pool`
!!! description "`MetaRegistry.get_base_pool(_pool: address, _handler_id: uint256 = 0) -> address`"

    Getter for the base pool of a metapool. This function can also be called on non-metapool pools; in that case, there is no base pool and the function will return `ZERO_ADDRESS`.

    Returns: base pool (`address`).

    | Input         | Type      | Description                                |
    | ------------- | --------- | ------------------------------------------ |
    | `_pool`       | `address` | Address of the pool                        |
    | `_handler_id` | `uint256` | ID of the `RegistryHandler`; defaults to 0 |

    ??? quote "Source code"

        === "MetaRegistry.vy"

            ```vyper
            # registry and registry handlers are considered to be the same here.
            # registry handlers are just wrapper contracts that simplify/fix underlying registries
            # for integrating it into the Metaregistry.
            interface RegistryHandler:
                def get_base_pool(_pool: address) -> address: view

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
                    raise "no registry"
                return pool_registry_handler
            ```

    === "Example"

        In the case of the LUSD-3CRV pool example, the function will return the 3pool as it is the base pool. When calling the same function for the 3pool itself, it returns `ZERO_ADDRESS` as it is a normal pool[^2].

        [^2]: A base pool is also a regular pool.

        ```shell
        >>> MetaRegistry.get_base_pool('0xEd279fDD11cA84bEef15AF5D39BB4d4bEE23F0cA')
        '0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7'

        >>> MetaRegistry.get_base_pool('0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7')
        '0x0000000000000000000000000000000000000000'
        ```


### `get_fees`
!!! description "`MetaRegistry.get_fees(_pool: address, _handler_id: uint256 = 0) -> uint256[10]`"

    Getter for the fee parameters that a Curve pool charges per swap. The fee data returned varies depending on the type of pool (see examples below).

    Returns: fee parameters (`uint256[10]`).

    | Input         | Type      | Description                                |
    | ------------- | --------- | ------------------------------------------ |
    | `_pool`       | `address` | Address of the pool                        |
    | `_handler_id` | `uint256` | ID of the `RegistryHandler`; defaults to 0 |

    ??? quote "Source code"

        === "MetaRegistry.vy"

            ```vyper
            # registry and registry handlers are considered to be the same here.
            # registry handlers are just wrapper contracts that simplify/fix underlying registries
            # for integrating it into the Metaregistry.
            interface RegistryHandler:
                def get_fees(_pool: address) -> uint256[10]: view

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
                    raise "no registry"
                return pool_registry_handler
            ```

    === "Example"

        **Stableswap** pools return the `fee` per swap and the `admin_fee` percentage. For the `3pool`, it shows that the pool charges 1 basis point per swap, 50% of which goes to the DAO. Stableswap-NG pools additionally return `offpeg_fee_multiplier`.

        **Cryptoswap** pools return `fee`, `admin_fee` percentage, `mid_fee` and `out_fee`. The fee is the dynamic fee charged per swap, and ranges between `mid_fee` (balances in the pool are fully balanced) and the `out_fee` (balances in the pool are fully imbalanced).

        ```shell
        >>> MetaRegistry.get_fees('0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7')     # stableswap
        1000000, 5000000000, 0, 0, 0, 0, 0, 0, 0, 0

        >>> MetaRegistry.get_fees('0xdb74dfdd3bb46be8ce6c33dc9d82777bcfc3ded5')     # stableswap-ng
        1000000, 5000000000, 50000000000, 0, 0, 0, 0, 0, 0, 0

        >>> MetaRegistry.get_fees('0xd51a44d3fae010294c616388b506acda1bfaae46')     # cryptoswap
        8889269, 5000000000, 3000000, 30000000, 0, 0, 0, 0, 0, 0
        ```


### `get_pool_params`
!!! description "`MetaRegistry.get_pool_params(_pool: address, _handler_id: uint256 = 0) -> uint256[MAX_POOL_PARAMS]`"

    Getter for the parameters of a pool. The parameters returned varies depending on the type of pool (see examples below).

    Returns: parameters (`uint256[MAX_POOL_PARAMS]`).

    | Input         | Type      | Description                                |
    | ------------- | --------- | ------------------------------------------ |
    | `_pool`       | `address` | Address of the pool                        |
    | `_handler_id` | `uint256` | ID of the `RegistryHandler`; defaults to 0 |

    ??? quote "Source code"

        === "MetaRegistry.vy"

            ```vyper
            # registry and registry handlers are considered to be the same here.
            # registry handlers are just wrapper contracts that simplify/fix underlying registries
            # for integrating it into the Metaregistry.
            interface RegistryHandler:
                def get_pool_params(_pool: address) -> uint256[20]: view

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
                    raise "no registry"
                return pool_registry_handler
            ```

    === "Example"

        **Stableswap** pools return the amplification coefficient (`A`).

        **Cryptoswap** pools return the amplification coefficient (`A`), `D` invariant, `gamma`, `allowed_extra_profit`, `fee_gamma`, `adjustment_step` and `ma_half_time`.

        ```shell
        >>> MetaRegistry.metaregistry.get_pool_params('0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7')
        2000, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0

        >>> MetaRegistry.metaregistry.get_pool_params('0xd51a44d3fae010294c616388b506acda1bfaae46')
        1707629, 24588676849282493872649954, 11809167828997, 2000000000000, 500000000000000, 490000000000000, 600, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
        ```


### `get_lp_token`
!!! description "`MetaRegistry.get_lp_token(_pool: address, _handler_id: uint256 = 0) -> address`"

    Getter for the LP token of a pool.

    Returns: LP token (`address`).

    | Input         | Type      | Description                                |
    | ------------- | --------- | ------------------------------------------ |
    | `_pool`       | `address` | Address of the pool                        |
    | `_handler_id` | `uint256` | ID of the `RegistryHandler`; defaults to 0 |

    ??? quote "Source code"

        === "MetaRegistry.vy"

            ```vyper
            # registry and registry handlers are considered to be the same here.
            # registry handlers are just wrapper contracts that simplify/fix underlying registries
            # for integrating it into the Metaregistry.
            interface RegistryHandler:
                def get_lp_token(_pool: address) -> address: view

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
                    raise "no registry"
                return pool_registry_handler
            ```

    === "Example"

        ```shell
        >>> MetaRegistry.get_lp_token('0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7')
        '0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490'
        ```


### `get_pool_asset_type`
!!! description "`MetaRegistry.get_pool_asset_type(_pool: address, _handler_id: uint256 = 0) -> uint256`"

    Getter for the asset type of a pool according to: **`0 = USD`, `1 = ETH`, `2 = BTC`, `3 = Other`, `4 = CryptoPool`**. The asset type is only a property of StableSwap pools and is not enforced in CryptoSwap pools (which always return 4).

    Returns: asset type (`uint256`).

    | Input         | Type      | Description                                |
    | ------------- | --------- | ------------------------------------------ |
    | `_pool`       | `address` | Address of the pool                        |
    | `_handler_id` | `uint256` | ID of the `RegistryHandler`; defaults to 0 |

    ??? quote "Source code"

        === "MetaRegistry.vy"

            ```vyper
            # registry and registry handlers are considered to be the same here.
            # registry handlers are just wrapper contracts that simplify/fix underlying registries
            # for integrating it into the Metaregistry.
            interface RegistryHandler:
                def get_pool_asset_type(_pool: address) -> uint256: view

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
                    raise "no registry"
                return pool_registry_handler
            ```

    === "Example"

        ```shell
        >>> MetaRegistry.get_pool_asset_type('0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7')      # 3pool (USD)
        0

        >>> MetaRegistry.get_pool_asset_type('0xDB74dfDD3BB46bE8Ce6C33dC9D82777BCFc3dEd5')      # weETH/wETH (ETH)
        1

        >>> MetaRegistry.get_pool_asset_type('0xd51a44d3fae010294c616388b506acda1bfaae46')      # tricryptoUSDT (cryptoswap)
        4
        ```


### `get_pool_from_lp_token`
!!! description "`MetaRegistry.get_pool_from_lp_token(_token: address, _handler_id: uint256 = 0) -> address`"

    Getter for the liquidity pool contract derived from an LP token.

    Returns: pool (`address`).

    | Input         | Type      | Description                                |
    | ------------- | --------- | ------------------------------------------ |
    | `_pool`       | `address` | Address of the pool                        |
    | `_handler_id` | `uint256` | ID of the `RegistryHandler`; defaults to 0 |

    ??? quote "Source code"

        === "MetaRegistry.vy"

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

            @internal
            @view
            def _get_pool_from_lp_token(_token: address) -> address:
                for i in range(MAX_REGISTRIES):
                    if i == self.registry_length:
                        break
                    handler: address = self.get_registry[i]
                    pool: address = RegistryHandler(handler).get_pool_from_lp_token(_token)
                    if pool != empty(address):
                        return pool
                return empty(address)
            ```

    === "Example"

        ```shell
        >>> MetaRegistry.get_pool_from_lp_token('0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490')
        '0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7'
        ```


### `get_virtual_price_from_lp_token`
!!! description "`MetaRegistry.get_virtual_price_from_lp_token(_token: address, _handler_id: uint256 = 0) -> uint256`"

    Getter for a token's virtual price. The virtual price of any pool starts with a value of `1.0` and increases as the pool accrues fees. This number constantly increases for StableSwap pools unless the pool's amplification coefficient changes. For CryptoSwap pools, there are moments when the virtual price can decrease (e.g., admin fee claims, changes to the pool's parameters, etc.).

    Returns: virtual price of the LP token (`uint256`).

    | Input         | Type      | Description                                |
    | ------------- | --------- | ------------------------------------------ |
    | `_pool`       | `address` | Address of the pool                        |
    | `_handler_id` | `uint256` | ID of the `RegistryHandler`; defaults to 0 |

    ??? quote "Source code"

        === "MetaRegistry.vy"

            ```vyper
            # registry and registry handlers are considered to be the same here.
            # registry handlers are just wrapper contracts that simplify/fix underlying registries
            # for integrating it into the Metaregistry.
            interface RegistryHandler:
                def get_virtual_price_from_lp_token(_addr: address) -> uint256: view

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

            @internal
            @view
            def _get_pool_from_lp_token(_token: address) -> address:
                for i in range(MAX_REGISTRIES):
                    if i == self.registry_length:
                        break
                    handler: address = self.get_registry[i]
                    pool: address = RegistryHandler(handler).get_pool_from_lp_token(_token)
                    if pool != empty(address):
                        return pool
                return empty(address)

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
                    raise "no registry"
                return pool_registry_handler
            ```

    === "Example"

        ```shell
        >>> MetaRegistry.get_virtual_price_from_lp_token('0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490')
        1033796609988765878
        ```


### `is_registered`
!!! description "`MetaRegistry.is_registered(_pool: address, _handler_id: uint256 = 0) -> bool`"

    Function to check if a pool is registered in the `MetaRegistry`.

    Returns: true or false (`bool`).

    | Input         | Type      | Description                                |
    | ------------- | --------- | ------------------------------------------ |
    | `_pool`       | `address` | Address of the pool                        |
    | `_handler_id` | `uint256` | ID of the `RegistryHandler`; defaults to 0 |

    ??? quote "Source code"

        === "MetaRegistry.vy"

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
                    raise "no registry"
                return pool_registry_handler
            ```

    === "Example"

        ```shell
        >>> MetaRegistry.is_registered('0xbebc44782c7db0a1a60cb6fe97d0b483032ff1c7')
        'true'
        ```


### `get_gauge`
!!! description "`MetaRegistry.get_gauge(_pool: address, gauge_idx: uint256 = 0, _handler_id: uint256 = 0) -> address`"

    Getter for the liquidity gauge of a pool.

    Returns: gauge address (`address`).

    | Input         | Type      | Description                                |
    | ------------- | --------- | ------------------------------------------ |
    | `_pool`       | `address` | Address of the pool                        |
    | `gauge_idx`   | `uint256` | Index of the gauge; defaults to 0          |
    | `_handler_id` | `uint256` | ID of the `RegistryHandler`; defaults to 0 |

    ??? quote "Source code"

        === "MetaRegistry.vy"

            ```vyper
            # registry and registry handlers are considered to be the same here.
            # registry handlers are just wrapper contracts that simplify/fix underlying registries
            # for integrating it into the Metaregistry.
            interface RegistryHandler:
                def get_gauges(_pool: address) -> (address[10], int128[10]): view

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
                    raise "no registry"
                return pool_registry_handler
            ```

    === "Example"

        ```shell
        >>> MetaRegistry.get_gauge('0xbebc44782c7db0a1a60cb6fe97d0b483032ff1c7')
        '0xbFcF63294aD7105dEa65aA58F8AE5BE2D9d0952A'
        ```


### `get_gauge_type`
!!! description "`MetaRegistry.get_gauge_type(_pool: address, gauge_idx: uint256 = 0, _handler_id: uint256 = 0) -> int128`"

    Getter for the gauge type of the gauge associated with a liquidity pool.

    Returns: gauge type (`int128`).

    | Input         | Type      | Description                                |
    | ------------  | --------- | ------------------------------------------ |
    | `_pool`       | `address` | Address of the pool                        |
    | `gauge_idx`   | `uint256` | Index of the gauge; defaults to 0          |
    | `_handler_id` | `uint256` | ID of the `RegistryHandler`; defaults to 0 |

    ??? quote "Source code"

        === "MetaRegistry.vy"

            ```vyper
            # registry and registry handlers are considered to be the same here.
            # registry handlers are just wrapper contracts that simplify/fix underlying registries
            # for integrating it into the Metaregistry.
            interface RegistryHandler:
                def get_gauges(_pool: address) -> (address[10], int128[10]): view

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
                    raise "no registry"
                return pool_registry_handler
            ```

    === "Example"

        ```shell
        >>> MetaRegistry.get_gauge_type('0xbebc44782c7db0a1a60cb6fe97d0b483032ff1c7')
        0

        >>> MetaRegistry.get_gauge_type('0xd51a44d3fae010294c616388b506acda1bfaae46')
        5
        ```


### `get_coins`
!!! description "`MetaRegistry.get_coins(_pool: address, _handler_id: uint256 = 0) -> address[MAX_COINS]`"

    Getter method for the coins in a pool. If the pool is a metapool, the method returns the LP token of the base pool, not the underlying coins. To additionally return the underlying coins, see: [`get_underlying_coins`](#get_underlying_coins).

    Retuns: coins (`address[MAX_COINS]`).

    | Input         | Type      | Description                                |
    | ------------- | --------- | ------------------------------------------ |
    | `_pool`       | `address` | Address of the pool                        |
    | `_handler_id` | `uint256` | ID of the `RegistryHandler`; defaults to 0 |

    ??? quote "Source code"

        === "MetaRegistry.vy"

            ```vyper
            # registry and registry handlers are considered to be the same here.
            # registry handlers are just wrapper contracts that simplify/fix underlying registries
            # for integrating it into the Metaregistry.
            interface RegistryHandler:
                def get_coins(_pool: address) -> address[MAX_COINS]: view

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
                    raise "no registry"
                return pool_registry_handler
            ```

    === "Example"

        ```shell
        >>> MetaRegistry.get_coins('0xEd279fDD11cA84bEef15AF5D39BB4d4bEE23F0cA')    # LUSD-3CRV pool
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
!!! description "`MetaRegistry.get_n_coins(_pool: address, _handler_id: uint256 = 0) -> uint256`"

    Getter for the number of coins in a pool. If the pool is a metapool, the method returns `2`, the meta- and base pool token. To additionally return the number of coins including the underlying ones from the base pool, see: [`get_n_underlying_coins`](#get_underlying_coins).

    Returns: number of coins (`uint256`).

    | Input         | Type      | Description                                |
    | ------------- | --------- | ------------------------------------------ |
    | `_pool`       | `address` | Address of the pool                        |
    | `_handler_id` | `uint256` | ID of the `RegistryHandler`; defaults to 0 |

    ??? quote "Source code"

        === "MetaRegistry.vy"

            ```vyper
            # registry and registry handlers are considered to be the same here.
            # registry handlers are just wrapper contracts that simplify/fix underlying registries
            # for integrating it into the Metaregistry.
            interface RegistryHandler:
                def get_n_coins(_pool: address) -> uint256: view

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
                    raise "no registry"
                return pool_registry_handler
            ```

    === "Example"

        ```shell
        >>> MetaRegistry.get_n_coins('0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7')
        3
        ```


### `get_decimals`
!!! description "`MetaRegistry.get_decimals(_pool: address, _handler_id: uint256 = 0) -> uint256[MAX_COINS]`"

    Getter for the number of coins in a pool. If the pool is a metapool, the method returns the decimals of the meta- and base pool token. To additionally return the decimals of the underlying coin from the base pool, see: [`get_underlying_decimals`](#get_underlying_decimals).

    Returns: coin decimals (`uint256[MAX_COINS]`).

    | Input         | Type      | Description                                |
    | ------------- | --------- | ------------------------------------------ |
    | `_pool`       | `address` | Address of the pool                        |
    | `_handler_id` | `uint256` | ID of the `RegistryHandler`; defaults to 0 |

    ??? quote "Source code"

        === "MetaRegistry.vy"

            ```vyper
            # registry and registry handlers are considered to be the same here.
            # registry handlers are just wrapper contracts that simplify/fix underlying registries
            # for integrating it into the Metaregistry.
            interface RegistryHandler:
                def get_decimals(_pool: address) -> uint256[MAX_COINS]: view

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
                    raise "no registry"
                return pool_registry_handler
            ```

    === "Example"

        ```shell
        >>> MetaRegistry.get_decimals('0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7')
        18, 6, 6, 0, 0, 0, 0, 0         # decimals of DAI, USDT, USDC

        >>> MetaRegistry.get_decimals('0xEd279fDD11cA84bEef15AF5D39BB4d4bEE23F0cA')
        18, 18, 0, 0, 0, 0, 0, 0        # decimals of LUSD, 3CRV
        ```


### `get_balances`
!!! description "`MetaRegistry.get_balances(_pool: address, _handler_id: uint256 = 0)  -> uint256[MAX_COINS]`"

    Getter for the coin balances in a pool. If the pool is a metapool, the method returns the balances of the meta- and base pool tokens. To additionally return the balances of the underlying coins from the base pool, see: [`get_underlying_balances`](#get_underlying_balances).

    Returns: balances (`uint256[MAX_COINS]`).

    | Input         | Type      | Description                                |
    | ------------- | --------- | ------------------------------------------ |
    | `_pool`       | `address` | Address of the pool                        |
    | `_handler_id` | `uint256` | ID of the `RegistryHandler`; defaults to 0 |

    ??? quote "Source code"

        === "MetaRegistry.vy"

            ```vyper
            # registry and registry handlers are considered to be the same here.
            # registry handlers are just wrapper contracts that simplify/fix underlying registries
            # for integrating it into the Metaregistry.
            interface RegistryHandler:
                def get_balances(_pool: address) -> uint256[MAX_COINS]: view

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
                    raise "no registry"
                return pool_registry_handler
            ```

    === "Example"

        ```shell
        >>> MetaRegistry.get_balances('0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7')
        147006104035945155794243533, 141336760960804, 94869577680718, 0, 0, 0, 0, 0

        >>> MetaRegistry.get_balances('0xEd279fDD11cA84bEef15AF5D39BB4d4bEE23F0cA')
        6781730641038140101957300, 5934556341193690490470482, 0, 0, 0, 0, 0, 0
        ```


### `get_underlying_coins`
!!! description "`MetaRegistry.get_underlying_coins(_pool: address, _handler_id: uint256 = 0) -> address[MAX_COINS]`"

    Getter for all coins in a pool, including the underlying ones. For non-metapools, it returns the same value as [`get_coins`](#get_coins).

    Returns: underlying coins (`address[MAX_COINS]`).

    | Input         | Type      | Description                                |
    | ------------- | --------- | ------------------------------------------ |
    | `_pool`       | `address` | Address of the pool                        |
    | `_handler_id` | `uint256` | ID of the `RegistryHandler`; defaults to 0 |

    ??? quote "Source code"

        === "MetaRegistry.vy"

            ```vyper
            # registry and registry handlers are considered to be the same here.
            # registry handlers are just wrapper contracts that simplify/fix underlying registries
            # for integrating it into the Metaregistry.
            interface RegistryHandler:
                def get_underlying_coins(_pool: address) -> address[MAX_COINS]: view

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
                    raise "no registry"
                return pool_registry_handler
            ```

    === "Example"

        ```shell
        >>> MetaRegistry.get_underlying_coins('0xEd279fDD11cA84bEef15AF5D39BB4d4bEE23F0cA')
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
!!! description "`MetaRegistry.get_n_underlying_coins(_pool: address, _handler_id: uint256 = 0) -> uint256`"

    Getter for the number of coins in a pool, including the underlying ones. For non-metapools, it returns the same value as [`get_n_coins`](#get_n_coins).

    Returns: number of coins (`uin256`).

    | Input         | Type      | Description                                |
    | ------------- | --------- | ------------------------------------------ |
    | `_pool`       | `address` | Address of the pool                        |
    | `_handler_id` | `uint256` | ID of the `RegistryHandler`; defaults to 0 |

    ??? quote "Source code"

        === "MetaRegistry.vy"

            ```vyper
            # registry and registry handlers are considered to be the same here.
            # registry handlers are just wrapper contracts that simplify/fix underlying registries
            # for integrating it into the Metaregistry.
            interface RegistryHandler:
                def get_n_underlying_coins(_pool: address) -> uint256: view

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
                    raise "no registry"
                return pool_registry_handler
            ```

    === "Example"

        ```shell
        >>> MetaRegistry.get_n_underlying_coins('0xEd279fDD11cA84bEef15AF5D39BB4d4bEE23F0cA')
        4
        ```


### `get_underlying_decimals`
!!! description "`MetaRegistry.get_underlying_decimals(_pool: address, _handler_id: uint256 = 0) -> uint256[MAX_COINS]`"

    Getter for the decimals of the coins in a pool, including those for the underlying ones. For non-metapools, it returns the same value as [`get_decimals`](#get_decimals).

    Returns: coin decimals (`uint256[MAX_COINS]`).

    | Input         | Type      | Description                                |
    | ------------- | --------- | ------------------------------------------ |
    | `_pool`       | `address` | Address of the pool                        |
    | `_handler_id` | `uint256` | ID of the `RegistryHandler`; defaults to 0 |

    ??? quote "Source code"

        === "MetaRegistry.vy"

            ```vyper
            # registry and registry handlers are considered to be the same here.
            # registry handlers are just wrapper contracts that simplify/fix underlying registries
            # for integrating it into the Metaregistry.
            interface RegistryHandler:
                def get_underlying_decimals(_pool: address) -> uint256[MAX_COINS]: view

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
                    raise "no registry"
                return pool_registry_handler
            ```

    === "Example"

        ```shell
        >>> MetaRegistry.get_underlying_decimals('0xEd279fDD11cA84bEef15AF5D39BB4d4bEE23F0cA')
        18, 18, 6, 6, 0, 0, 0, 0        # decimals of LUSD, DAI, USDC, USDT
        ```


### `get_underlying_balances`
!!! description "`MetaRegistry.get_underlying_balances(_pool: address, _handler_id: uint256 = 0) -> uint256[MAX_COINS]`"

    Getter method for the coin balances in a pool, including those for the underlying ones. For non-metapools, it returns the same value as [`get_balances`](#get_balances).

    Returns: coin balances (`uint256[MAX_COINS]`).

    | Input         | Type      | Description                                |
    | ------------- | --------- | ------------------------------------------ |
    | `_pool`       | `address` | Address of the pool                        |
    | `_handler_id` | `uint256` | ID of the `RegistryHandler`; defaults to 0 |

    ??? quote "Source code"

        === "MetaRegistry.vy"

            ```vyper
            # registry and registry handlers are considered to be the same here.
            # registry handlers are just wrapper contracts that simplify/fix underlying registries
            # for integrating it into the Metaregistry.
            interface RegistryHandler:
                def get_underlying_balances(_pool: address) -> uint256[MAX_COINS]: view

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
                    raise "no registry"
                return pool_registry_handler
            ```

    === "Example"

        ```shell
        >>> MetaRegistry.get_balances('0xEd279fDD11cA84bEef15AF5D39BB4d4bEE23F0cA')
        4362795413803847111710482, 7574850164613791626778647, 7282723353910, 4888387736171, 0, 0, 0, 0          # balances of LUSD, DAI, USDC, USDT
        ```


### `get_admin_balances`
!!! description "`MetaRegistry.get_admin_balances(_pool: address, _handler_id: uint256 = 0) -> uint256[MAX_COINS]`"

    Getter for the pool's admin balances. The admin balances are essentially the fees that can be claimed and paid out to veCRV holders.

    Returns: admin balances (`uint256[MAX_COINS]`).

    | Input         | Type      | Description                                |
    | ------------- | --------- | ------------------------------------------ |
    | `_pool`       | `address` | Address of the pool                        |
    | `_handler_id` | `uint256` | ID of the `RegistryHandler`; defaults to 0 |

    ??? quote "Source code"

        === "MetaRegistry.vy"

            ```vyper
            # registry and registry handlers are considered to be the same here.
            # registry handlers are just wrapper contracts that simplify/fix underlying registries
            # for integrating it into the Metaregistry.
            interface RegistryHandler:
                def get_admin_balances(_pool: address) -> uint256[MAX_COINS]: view

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
                    raise "no registry"
                return pool_registry_handler
            ```

    === "Example"

        ```shell
        >>> MetaRegistry.get_admin_balances('0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7')
        1590779934844205413773, 3866051363, 5204415383, 0, 0, 0, 0, 0           # admin balances of DAI, USDC, USDT (3pool)

        >>> MetaRegistry.get_admin_balances('0xEd279fDD11cA84bEef15AF5D39BB4d4bEE23F0cA')
        574625025164093926144, 321761837541842998875, 0, 0, 0, 0, 0, 0          # admin balances of LUSD, 3CRV (LUSD<>CRV)
        ```


### `get_coin_indices`
!!! description "`MetaRegistry.get_coin_indices(_pool: address, _from: address, _to: address, _handler_id: uint256 = 0) -> (int128, int128, bool)`"

    Getter method that converts coin addresses to indices.

    Returns: index for `_from` (`int128`), index for `_to` (`int128`) and whether the market a metapool or not (`bool`).

    | Input         | Type      | Description                                    |
    | ------------- | --------- | ---------------------------------------------- |
    | `_pool`       | `address` | Address of the pool                            |
    | `_from`       | `address` | Coin address to be used as `i` within the pool |
    | `_to`         | `address` | Coin address to be used as `j` within the pool |
    | `_handler_id` | `uint256` | ID of the `RegistryHandler`; defaults to 0     |

    ??? quote "Source code"

        === "MetaRegistry.vy"

            ```vyper
            # registry and registry handlers are considered to be the same here.
            # registry handlers are just wrapper contracts that simplify/fix underlying registries
            # for integrating it into the Metaregistry.
            interface RegistryHandler:
                def get_coin_indices(_pool: address, _from: address, _to: address) -> (int128, int128, bool): view

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
                    raise "no registry"
                return pool_registry_handler
            ```

    === "Example"

        The first example checks the index of `DAI` and `USDC` within the 3pool. The second one checks the index of `LUSD` and `USDC` within the `LUSD<>3CRV` pool.

        ```shell
        >>> MetaRegistry.metaregistry.get_coin_indices('0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7', '0x6B175474E89094C44Da98b954EedeAC495271d0F', '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48')
        0, 1, false     # DAI is coin index0, USDC is coin index1 and no metapool

        >>> MetaRegistry.metaregistry.get_coin_indices('0x5f98805A4E8be255a32880FDeC7F6728C6568bA0', '0x6B175474E89094C44Da98b954EedeAC495271d0F', '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48')
        0, 2, true      # LUSD is coin index0, USDC is coin index1 and its a metapool
        ```


---


## **Handlers and Registries**

The `MetaRegistry` makes use of `Handlers`, which are essentially wrappers around other contracts (mostly Pool Factories) to ensure ABI compatibility with the contract itself.

New handlers can be added or existing ones can be updated by the [`owner`](#owner) of the contract.

*To fetch registry information from the contract, fhe following methods can be used:*

- `get_registry_length`: Returns the total number of registries added.
- `get_registry`: Fetches single registries.
- `get_base_registry`: Returns the "base registry" of a handler.
- `get_registry_handlers_from_pool`: Fetches the handler from pools.


!!!colab "Google Colab Notebook"
    A Google Colab notebook showcasing how to query registries or add/update them can be found [here :material-arrow-up-right:](https://colab.research.google.com/drive/1wFvIeNKpKhy58xkGSfKw0XzEPnwn9Zym?usp=sharing).



### `get_registry_handlers_from_pool`
!!! description "`MetaRegistry._get_registry_handlers_from_pool(_pool: address) -> address[MAX_REGISTRIES]`"

    Getter for the `RegistryHandler` that a pool has been registered in. Usually, each pool is registered in a single registry.

    Returns: `RegistryHandler` (`address[MAX_REGISTRIES]`).

    | Input         | Type      | Description         |
    | ------------- | --------- | ------------------- |
    | `_pool`       | `address` | Address of the pool |

    ??? quote "Source code"

        === "MetaRegistry.vy"

            ```vyper
            @external
            @view
            def get_registry_handlers_from_pool(_pool: address) -> address[MAX_REGISTRIES]:
                """
                @notice Get the registry handlers associated with a pool
                @param _pool Pool address
                @return List of registry handlers
                """
                return self._get_registry_handlers_from_pool(_pool)

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
            ```

    === "Example"

        ```shell
        >>> MetaRegistry.get_registry_handlers_from_pool('0xbebc44782c7db0a1a60cb6fe97d0b483032ff1c7')
        '0x46a8a9CF4Fc8e99EC3A14558ACABC1D93A27de68'
        ```


### `get_base_registry`
!!! description "`MetaRegistry.get_base_registry(registry_handler: address) -> address`"

    Getter for the `BaseRegistry` associated with a `RegistryHandler`.

    Returns: `BaseRegistry` (`address`).

    | Input              | Type      | Description                |
    | ------------------ | --------- | -------------------------- |
    | `registry_handler` | `address` | `RegistryHandler` contract |

    ??? quote "Source code"

        === "MetaRegistry.vy"

            ```vyper
            # registry and registry handlers are considered to be the same here.
            # registry handlers are just wrapper contracts that simplify/fix underlying registries
            # for integrating it into the Metaregistry.
            interface RegistryHandler:
                def base_registry() -> address: view

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
        >>> MetaRegistry.get_base_registry('0x46a8a9CF4Fc8e99EC3A14558ACABC1D93A27de68')
        '0x90E00ACe148ca3b23Ac1bC8C240C2a7Dd9c2d7f5'
        ```


### `get_registry`
!!! description "`MetaRegistry.get_registry(arg0: uint256) -> address`"

    Getter for the `RegistryHandler` at index `arg0`. New handlers can be added via the [`add_registry_handler`](#add_registry_handler) function.

    Returns: `Registry` (`address`).

    | Input  | Type      | Description           |
    | ------ | --------- | --------------------- |
    | `arg0` | `uint256` | Index (starts at `0`) |

    ??? quote "Source code"

        === "MetaRegistry.vy"

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
!!! description "`MetaRegistry.registry_length() -> uint256`"

    Getter for the registry length, essentially how many registries have been added to the `MetaRegistry`. This variable is incremented by one when adding a new registry.

    Returns: number of registries added (`uint256`).

    ??? quote "Source code"

        === "MetaRegistry.vy"

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
!!! description "`MetaRegistry.address_provider() -> address: view`"

    Getter for the `AddressProvider` contract.

    Returns: `AddressProvider` (`address`).

    ??? quote "Source code"

        === "MetaRegistry.vy"

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
!!! description "`MetaRegistry.owner() -> address: view`"

    Getter for the owner of the contract, who can perform owner-guarded functions.

    Returns: owner (`address`).

    ??? quote "Source code"

        === "MetaRegistry.vy"

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
!!! description "`MetaRegistry.add_registry_handler(_registry_handler: address)`"

    !!!guard "Guarded Method"
        This function is only callable by the `owner` of the contract.

    Function to add a `RegistryHandler` to the `MetaRegistry`.

    | Input               | Type      | Description                      |
    | ------------------- | --------- | -------------------------------- |
    | `_registry_handler` | `address` | `RegistryHandler` to add         |

    ??? quote "Source code"

        === "MetaRegistry.vy"

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

    === "Example"

        ```shell
        >>> soon
        ```


### `update_registry_handler`
!!! description "`MetaRegistry.update_registry_handler(_index: uint256, _registry_handler: address)`"

    !!!guard "Guarded Method"
        This function is only callable by the `owner` of the contract.

    Function to update an already existing `RegistryHandler` with a new one.

    | Input               | Type      | Description                                       |
    | ------------------- | --------- | ------------------------------------------------- |
    | `_index`            | `uint256` | Index of the registry according to `get_registry` |
    | `_registry_handler` | `address` | address of the new handler contract               |

    ??? quote "Source code"

        === "MetaRegistry.vy"

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

    === "Example"

        ```shell
        >>> soon
        ```
