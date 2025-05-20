<h1>StableSwap-NG Factory: Overview</h1>

The `CurveStableswapFactoryNG.vy` allows the permissionless deployment of up to eight-coin plain- and metapools, as well as gauges. **Liquidity pool and LP token share the same contract.** For more details, see here: [StableSwap-NG Documentation](../../stableswap-exchange/stableswap-ng/overview.md).


!!!github "GitHub"
    The source code of the `CurveStableSwapFactoryNG.vy` can be found on [GitHub :material-github:](https://github.com/curvefi/stableswap-ng/blob/main/contracts/main/CurveStableSwapFactoryNG.vy).
    A list of all deployments can be found [here](../../references/deployed-contracts.md#stableswap-ng).



---


# **Asset Types**

Stableswap-NG pools supports various tokens with different [asset types](../../stableswap-exchange/stableswap-ng/pools/overview.md#supported-assets). New asset types can be added by the `admin` of the contract via the `add_asset_type` method.
For a list of all supported assets, please see [Deployer API](deployer-api.md#assets-types).


### `asset_types`
!!! description "`CurveStableswapFactoryNG.asset_types(arg0: uint8) -> String[20]`"

    Getter for name of the different asset types.

    Returns: asset type (`String[20]`)

    | Input   | Type     | Description                     |
    | ------- | -------- | ------------------------------- |
    | `arg0`  | `uint8`  | Index value of the asset type   |

    ??? quote "Source code"

        === "CurveStableswapFactoryNG.vy"

            ```vyper
            asset_types: public(HashMap[uint8, String[20]])
            ```

    === "Example"

        ```shell
        >>> CurveStableswapFactoryNG.asset_types(0)
        'Standard'

        >>> CurveStableswapFactoryNG.asset_types(1)
        'Oracle'
        ```


### `add_asset_type`
!!! description "`CurveStableSwapFactoryNG.add_asset_type(_id: uint8, _name: String[10])`"

    !!!guard "Guarded Method"
        This function is only callable by the `admin` of the contract.

    Function to add a new asset type.

    | Input   | Type         | Description              |
    | ------- | ------------ | ------------------------ |
    | `_id`   | `uint8`      | Asset type ID            |
    | `_name` | `String[10]` | Name of the new asset type |

    ??? quote "Source code"

        === "CurveStableswapFactoryNG.vy"

            ```vyper
            asset_types: public(HashMap[uint8, String[20]])

            @external
            def add_asset_type(_id: uint8, _name: String[10]):
                """
                @notice Admin only method that adds a new asset type.
                @param _id asset type id.
                @param _name Name of the asset type.
                """
                assert msg.sender == self.admin  # dev: admin only
                self.asset_types[_id] = _name
            ```


---


# **Base Pools**

StableSwap pools also allow the deployment of metapools (an asset paired against a base pool). When deploying a new Factory, the existing base pools must be manually added to the contract for them to be used for metapools.

*Limitations when adding new base pools:*

- Rebasing tokens are not allowed in a base pool.
- Can not add a base pool that contains native tokens (e.g., ETH).
- As much as possible: Use standard `ERC20` tokens.


### `add_base_pool`
!!! description "`CurveStableSwapFactoryNG.add_base_pool(_base_pool: address, _base_lp_token: address, _asset_types: DynArray[uint8, MAX_COINS], _n_coins: uint256):`"

    !!!guard "Guarded Method"
        This function is only callable by the `admin` of the contract.

    Function to add a new base pool.

    Emits: `BasePoolAdded`

    | Input            | Type                         | Description                      |
    | ---------------- | ---------------------------- | -------------------------------- |
    | `_base_pool`     | `address`                    | Pool address to add as a base pool |
    | `_base_lp_token` | `address`                    | LP token address of the pool     |
    | `_asset_types`   | `DynArray[uint8, MAX_COINS]` | Array of asset types of the pool |
    | `_n_coins`       | `uint256`                    | Number of coins in the base pool |


    ??? quote "Source code"

        === "CurveStableswapFactoryNG.vy"

            ```vyper
            event BasePoolAdded:
                base_pool: address

            @external
            def add_base_pool(
                _base_pool: address,
                _base_lp_token: address,
                _asset_types: DynArray[uint8, MAX_COINS],
                _n_coins: uint256,
            ):
                """
                @notice Add a base pool to the registry, which may be used in factory metapools
                @dev 1. Only callable by admin
                    1. Rebasing tokens are not allowed in the base pool.
                    2. Do not add base pool which contains native tokens (e.g. ETH).
                    3. As much as possible: use standard ERC20 tokens.
                    Should you choose to deviate from these recommendations, audits are advised.
                @param _base_pool Pool address to add
                @param _asset_types Asset type for pool, as an integer
                """
                assert msg.sender == self.admin  # dev: admin-only function
                assert 2 not in _asset_types  # dev: rebasing tokens cannot be in base pool
                assert len(self.base_pool_data[_base_pool].coins) == 0  # dev: pool exists
                assert _n_coins < MAX_COINS  # dev: base pool can only have (MAX_COINS - 1) coins.

                # add pool to pool_list
                length: uint256 = self.base_pool_count
                self.base_pool_list[length] = _base_pool
                self.base_pool_count = length + 1
                self.base_pool_data[_base_pool].lp_token = _base_lp_token
                self.base_pool_data[_base_pool].n_coins = _n_coins
                self.base_pool_data[_base_pool].asset_types = _asset_types

                decimals: uint256 = 0
                coins: DynArray[address, MAX_COINS] = empty(DynArray[address, MAX_COINS])
                coin: address = empty(address)
                for i in range(MAX_COINS):
                    if i == _n_coins:
                        break
                    coin = CurvePool(_base_pool).coins(i)
                    assert coin != 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE  # dev: native token is not supported
                    self.base_pool_data[_base_pool].coins.append(coin)
                    self.base_pool_assets[coin] = True
                    decimals += (ERC20(coin).decimals() << i*8)
                self.base_pool_data[_base_pool].decimals = decimals

                log BasePoolAdded(_base_pool)
            ```


### `base_pool_list`
!!! description "`CurveStableSwapFactoryNG.base_pool_list(arg0: uint256) -> address: view`"

    !!!guard "Guarded Method"
        This function is only callable by the `admin` of the contract.

    Getter for the base pool at index `arg0`.

    | Input            | Type                         | Description                      |
    | ---------------- | ---------------------------- | -------------------------------- |
    | `arg0`           | `uint256`                    | Index of the base pool           |

    ??? quote "Source code"

        === "CurveStableswapFactoryNG.vy"

            ```vyper
            base_pool_list: public(address[4294967296])   # list of base pools
            ```

    === "Example"

        ```shell
        >>> CurveStableSwapFactoryNG.base_pool_list(0)
        '0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7'
        ```


---


# **Implementations**

The StableSwap-NG Factory makes use of **blueprint contracts** to deploy its contracts from the implementations.

!!!warning
    **Implementation contracts are upgradable.** They can either be replaced, or additional implementation contracts can be added. Therefore, please always make sure to check the most recent ones.


*It utilizes five different implementations:*

- **`pool_implementations`**, containing multiple blueprint contracts that are used to deploy plain pools.
- **`metapool_implementations`**, containing multiple blueprint contracts that are used to deploy metapools.
- **`math_implementation`**, containing math functions used in the AMM.
- **`gauge_implementation`**, containing a blueprint contract that is used when deploying gauges for pools.[^1]
- **`views_implementation`**, containing a view methods contract relevant for integrators and users looking to interact with the AMMs.

[^1]: The `gauge_implementation` is only relevant on Ethereum mainnet. Liquidity gauges on sidechains need to be deployed through the `RootChainGaugeFactory`.

*More on the [**Math Implementation**](../../stableswap-exchange/stableswap-ng/utility_contracts/math.md) and [**Views Implementation**](../../stableswap-exchange/stableswap-ng/utility_contracts/views.md).*


## **Query Implementations**

### `pool_implementations`
!!! description "`CurveStableSwapFactoryNG.pool_implementations(arg0: uint256) -> address: view`"

    Getter for the pool implementations. There might be multiple pool implementations base on various circumstances.

    Returns: implementation (`address`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `arg0` |  `uint256` | index value of the implementation |

    ??? quote "Source code"

        === "CurveStableswapFactoryNG.vy"

            ```vyper
            # index -> implementation address
            pool_implementations: public(HashMap[uint256, address])
            ```

    === "Example"

        ```shell
        >>> CurveStableSwapFactoryNG.pool_implementation(0)
        '0x3E3B5F27bbf5CC967E074b70E9f4046e31663181'
        ```


### `metapool_implementations`
!!! description "`CurveStableSwapFactoryNG.metapool_implementations(arg0: uint256) -> address: view`"

    Getter for the pool implementations at index `arg0`. This variable can hold multiple implementations which may be tailored for specific setups.

    Returns: pool implementation (`address`).

    | Input  | Type      | Description                      |
    | ------ | --------- | -------------------------------- |
    | `arg0` | `uint256` | Index of the pool implementation |

    ??? quote "Source code"

        === "CurveStableswapFactoryNG.vy"

            ```vyper
            # index -> implementation address
            metapool_implementations: public(HashMap[uint256, address])
            ```

    === "Example"

        ```shell
        >>> CurveStableSwapFactoryNG.metapool_implementation(0)
        '0x19bd1AB34d6ABB584b9C1D5519093bfAA7f6c7d2'
        ```


### `math_implementations`
!!! description "`CurveStableSwapFactoryNG.math_implementations() -> address: view`"

    Getter for the math implementation.

    Returns: math implementation (`address`).

    ??? quote "Source code"

        === "CurveStableswapFactoryNG.vy"

            ```vyper
            # index -> implementation address
            math_implementation: public(address)
            ```

    === "Example"

        ```shell
        >>> CurveStableSwapFactoryNG.math_implementation()
        '0x20D1c021525C85D9617Ccc64D8f547d5f730118A'
        ```


### `gauge_implementations`
!!! description "`CurveStableSwapFactoryNG.gauge_implementations() -> address: view`"

    Getter for the gauge implementation.

    Returns: gauge implementation (`address`).

    ??? quote "Source code"

        === "CurveStableswapFactoryNG.vy"

            ```vyper
            # index -> implementation address
            gauge_implementation: public(address)
            ```

    === "Example"

        ```shell
        >>> CurveStableSwapFactoryNG.gauge_implementation()
        '0xF5617D4f7514bE35fce829a1C19AE7f6c9106979'
        ```


### `views_implementation`
!!! description "`CurveStableSwapFactoryNG.views_implementations() -> address: view`"

    Getter for the views implementation.

    Returns: views implementation (`address`).

    ??? quote "Source code"

        === "CurveStableswapFactoryNG.vy"

            ```vyper
            # index -> implementation address
            views_implementation: public(address)
            ```

    === "Example"

        ```shell
        >>> CurveStableSwapFactoryNG.views_implementation()
        '0x87DD13Dd25a1DBde0E1EdcF5B8Fa6cfff7eABCaD'
        ```


## **Setting New Implementations**

New implementation can be by the `admin` of the contract using the following functions:


### `set_pool_implementations`
!!! description "`CurveStableSwapFactoryNG.set_pool_implementations(_implementation_index: uint256, _implementation: address,):`"

    !!!guard "Guarded Method"
        This function is only callable by the `admin` of the contract.

    Function to set/add a new pool implementation. Existing implementations can be overritten or additionly implementations at another (not set index) can be added.[^2]

    [^2]: This only works for `pool_implementations` and `metapool_implementations`. For other the implementations, only a single contract can be set.

    | Input                   | Type      | Description                     |
    | ----------------------- | --------- | ------------------------------- |
    | `_implementation_index` | `uint256` | Index value at which the new implementation is set   |
    | `_implementation`       | `address` | Implementation contract address          |

    ??? quote "Source code"

        === "CurveStableswapFactoryNG.vy"

            ```vyper
            # index -> implementation address
            pool_implementations: public(HashMap[uint256, address])

            @external
            def set_pool_implementations(
                _implementation_index: uint256,
                _implementation: address,
            ):
                """
                @notice Set implementation contracts for pools
                @dev Only callable by admin
                @param _implementation_index Implementation index where implementation is stored
                @param _implementation Implementation address to use when deploying plain pools
                """
                assert msg.sender == self.admin  # dev: admin-only function
                self.pool_implementations[_implementation_index] = _implementation
            ```

    === "Example"

        ```shell
        >>> CurveStableSwapFactoryNG.set_pool_implementations('todo')
        ```


### `set_metapool_implementations`
!!! description "`CurveStableSwapFactoryNG.set_pool_implementations(_implementation_index: uint256, _implementation: address,):`"

    !!!guard "Guarded Method"
        This function is only callable by the `admin` of the contract.

    Function to set/add a new metapool implementation. Existing implementations can be overritten or additionly implementations at another (not set index) can be added.[^3]

    [^3]: This only works for `pool_implementations` and `metapool_implementations`. For other the implementations, only a single contract can be set.

    | Input                   | Type      | Description                     |
    | ----------------------- | --------- | ------------------------------- |
    | `_implementation_index` | `uint256` | Index value at which the new implementation is set   |
    | `_implementation`       | `address` | Implementation contract address          |

    ??? quote "Source code"

        === "CurveStableswapFactoryNG.vy"

            ```vyper
            # index -> implementation address
            pool_implementations: public(HashMap[uint256, address])
            metapool_implementations: public(HashMap[uint256, address])
            math_implementation: public(address)
            gauge_implementation: public(address)
            views_implementation: public(address)

            @external
            def set_metapool_implementations(
                _implementation_index: uint256,
                _implementation: address,
            ):
                """
                @notice Set implementation contracts for metapools
                @dev Only callable by admin
                @param _implementation_index Implementation index where implementation is stored
                @param _implementation Implementation address to use when deploying meta pools
                """
                assert msg.sender == self.admin  # dev: admin-only function
                self.metapool_implementations[_implementation_index] = _implementation
            ```

    === "Example"

        ```shell
        >>> CurveStableSwapFactoryNG.set_metapool_implementations('todo')
        ```


### `set_math_implementation`
!!! description "`CurveStableSwapFactoryNG.set_math_implementation(_math_implementation: address):`"

    !!!guard "Guarded Method"
        This function is only callable by the `admin` of the contract.

    Function to set a new math implementation. There can only be one math implementation.

    | Input                  | Type      | Description                              |
    | ---------------------- | --------- | ---------------------------------------- |
    | `_math_implementation` | `address` | New math implementation contract address |

    ??? quote "Source code"

        === "CurveStableswapFactoryNG.vy"

            ```vyper
            # index -> implementation address
            pool_implementations: public(HashMap[uint256, address])
            metapool_implementations: public(HashMap[uint256, address])
            math_implementation: public(address)
            gauge_implementation: public(address)
            views_implementation: public(address)

            @external
            def set_math_implementation(_math_implementation: address):
                """
                @notice Set implementation contracts for StableSwap Math
                @dev Only callable by admin
                @param _math_implementation Address of the math implementation contract
                """
                assert msg.sender == self.admin  # dev: admin-only function
                self.math_implementation = _math_implementation
            ```

    === "Example"

        ```shell
        >>> CurveStableSwapFactoryNG.set_math_implementations('todo')
        ```


### `set_gauge_implementations`
!!! description "`CurveStableSwapFactoryNG.set_gauge_implementation(_gauge_implementation: address):`"

    !!!guard "Guarded Method"
        This function is only callable by the `admin` of the contract. There can only be one gauge implementation.

    Function to set a new gauge implementation.

    | Input                   | Type      | Description                               |
    | ----------------------- | --------- | ----------------------------------------- |
    | `_gauge_implementation` | `address` | New gauge implementation contract address |

    ??? quote "Source code"

        === "CurveStableswapFactoryNG.vy"

            ```vyper
            # index -> implementation address
            pool_implementations: public(HashMap[uint256, address])
            metapool_implementations: public(HashMap[uint256, address])
            math_implementation: public(address)
            gauge_implementation: public(address)
            views_implementation: public(address)

            @external
            def set_gauge_implementation(_gauge_implementation: address):
                """
                @notice Set implementation contracts for liquidity gauge
                @dev Only callable by admin
                @param _gauge_implementation Address of the gauge blueprint implementation contract
                """
                assert msg.sender == self.admin  # dev: admin-only function
                self.gauge_implementation = _gauge_implementation
            ```

    === "Example"

        ```shell
        >>> CurveStableSwapFactoryNG.set_gauge_implementations('todo')
        ```


### `set_views_implementation`
!!! description "`CurveStableSwapFactoryNG.set_views_implementation(_views_implementation: address):`"

    !!!guard "Guarded Method"
        This function is only callable by the `admin` of the contract. There can only be one views implementation.

    Function to set a new views implementation.

    | Input                   | Type      | Description                               |
    | ----------------------- | --------- | ----------------------------------------- |
    | `_views_implementation` | `address` | New views implementation contract address |

    ??? quote "Source code"

        === "CurveStableswapFactoryNG.vy"

            ```vyper
            # index -> implementation address
            pool_implementations: public(HashMap[uint256, address])
            metapool_implementations: public(HashMap[uint256, address])
            math_implementation: public(address)
            gauge_implementation: public(address)
            views_implementation: public(address)

            @external
            def set_views_implementation(_views_implementation: address):
                """
                @notice Set implementation contracts for Views methods
                @dev Only callable by admin
                @param _views_implementation Implementation address of views contract
                """
                assert msg.sender == self.admin  # dev: admin-only function
                self.views_implementation = _views_implementation
            ```

    === "Example"

        ```shell
        >>> CurveStableSwapFactoryNG.set_views_implementations('todo')
        ```
