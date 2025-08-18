These functions are guarded and may only be called by the **`admin`** of the contract.

## **Implementations**

*New implementations can be set via the following functions:*


### `set_pool_implementations`
!!! description "`Factory.set_pool_implementations(_implementation_index: uint256, _implementation: address,):`"

    !!!guard "Guarded Method"
        This function is only callable by the `admin` of the contract.

    Function to set/add a new pool implementation.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_implementation_index` |  `uint256` | index value of implementation |
    | `_implementation` |  `address` | implementation contract address |

    ??? quote "Source code"

        ```vyper
        # index -> implementation address
        pool_implementations: public(HashMap[uint256, address])
        metapool_implementations: public(HashMap[uint256, address])
        math_implementation: public(address)
        gauge_implementation: public(address)
        views_implementation: public(address)

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
        >>> Factory.set_pool_implementations('todo')
        ```


### `set_metapool_implementations`
!!! description "`Factory.set_pool_implementations(_implementation_index: uint256, _implementation: address,):`"

    !!!guard "Guarded Method"
        This function is only callable by the `admin` of the contract.

    Function to set/add a new metapool implementation.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_implementation_index` |  `uint256` | index value of implementation |
    | `_implementation` |  `address` | implementation contract address |

    ??? quote "Source code"

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
        >>> Factory.set_metapool_implementations('todo')
        ```


### `set_math_implementation`
!!! description "`Factory.set_math_implementation(_math_implementation: address):`"

    !!!guard "Guarded Method"
        This function is only callable by the `admin` of the contract.

    Function to set a new math implementation. There can only be one math implementation.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_math_implementation` |  `address` | new math implementation contract |

    ??? quote "Source code"

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
        >>> Factory.set_math_implementations('todo')
        ```


### `set_gauge_implementations`
!!! description "`Factory.set_gauge_implementation(_gauge_implementation: address):`"

    !!!guard "Guarded Method"
        This function is only callable by the `admin` of the contract. There can only be one gauge implementation.

    Function to set a new gauge implementation.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_gauge_implementation` |  `address` | new gauge implementation contract |

    ??? quote "Source code"

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
        >>> Factory.set_gauge_implementations('todo')
        ```


### `set_views_implementation`
!!! description "`Factory.set_views_implementation(_views_implementation: address):`"

    !!!guard "Guarded Method"
        This function is only callable by the `admin` of the contract. There can only be one views implementation.

    Function to set a new views implementation.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_views_implementation` |  `address` | new views implementation contract |

    ??? quote "Source code"

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
        >>> Factory.set_views_implementations('todo')
        ```


## **Set Fee Receiver**

### `set_fee_receiver`
!!! description "`Factory.set_fee_receiver(_pool: address, _fee_receiver: address)`"

    !!!guard "Guarded Method"
        This function is only callable by the `admin` of the contract.

    Function to set a new fee receiver.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_pool` |  `address` | this variable has no use; insert a random address, otherwise the tx will fail. |
    | `_fee_receiver` |  `address` | address of the new fee receiver |


    ??? quote "Source code"

        ```vyper
        # fee receiver for all pools
        fee_receiver: public(address)

        @external
        def set_fee_receiver(_pool: address, _fee_receiver: address):
            """
            @notice Set fee receiver for all pools
            @param _pool Address of  pool to set fee receiver for.
            @param _fee_receiver Address that fees are sent to
            """
            assert msg.sender == self.admin  # dev: admin only
            self.fee_receiver = _fee_receiver
        ```

    === "Example"

        ```shell
        >>> Factory.set_fee_receiver('0x0000000000000000000000000000000000000000')    
        ```


## **Asset Types**

### `add_asset_type`
!!! description "`Factory.add_asset_type(_id: uint8, _name: String[10])`"

    !!!guard "Guarded Method"
        This function is only callable by the `admin` of the contract.

    Function to add a new asset type.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_id` |  `uint8` | asset type id |
    | `_name` |  `String[10]` | name of the new asset type |


    ??? quote "Source code"

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

    === "Example"

        ```shell
        >>> Factory.add_asset_type(4, "whatever")
        ```


## **Adding Base Pool**

Limitations when adding new base pools:

- Rebasing tokens are not allowed in the base pool
- Do not add base pool which contains native tokens (e.g. ETH)
- As much as possible: use standard ERC20 tokens

### `add_base_pool`
!!! description "`Factory.add_base_pool(_base_pool: address, _base_lp_token: address, _asset_types: DynArray[uint8, MAX_COINS], _n_coins: uint256):`"

    !!!guard "Guarded Method"
        This function is only callable by the `admin` of the contract.

    Function to add a new base pool.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_base_pool` |  `address` | pool address to add as a basepool |
    | `_base_lp_token` |  `address` | lp token address of the pool |
    | `_asset_types` |  `DynArray[uint8, MAX_COINS]` | array of asset types of the pool |
    | `_n_coins` |  `uint256` | number of coins in the base pool |

    ??? quote "Source code"

        ```vyper
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
                2. Rebasing tokens are not allowed in the base pool.
                3. Do not add base pool which contains native tokens (e.g. ETH).
                4. As much as possible: use standard ERC20 tokens.
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

    === "Example"

        ```shell
        >>> Factory.add_base_pool("whatever")
        ```



## **Transfer Contract Ownership**

### `commit_transfer_ownership`
!!! description "`Factory.commit_transfer_ownership(_addr: address):`"

    !!!guard "Guarded Method"
        This function is only callable by the `admin` of the contract.

    Function to commit a transfer of ownership. This function sets `_addr` as the future admin of the contract. These changes need to be applied via `accept_transfer_ownership` by the future admin itself.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_addr` |  `address` | address of the future admin |

    ??? quote "Source code"

        ```vyper
        admin: public(address)
        future_admin: public(address)

        @external
        def commit_transfer_ownership(_addr: address):
            """
            @notice Transfer ownership of this contract to `addr`
            @param _addr Address of the new owner
            """
            assert msg.sender == self.admin  # dev: admin only
            self.future_admin = _addr
        ```

    === "Example"

        ```shell
        >>> Factory.commit_transfer_ownership("whatever")
        ```


### `accept_transfer_ownership`
!!! description "`Factory.accept_transfer_ownership():`"

    !!!guard "Guarded Method"
        This function is only callable by the `future_admin` of the contract.

    Function to accept the ownership transfer.

    ??? quote "Source code"

        ```vyper
        admin: public(address)
        future_admin: public(address)

        @external
        def accept_transfer_ownership():
            """
            @notice Accept a pending ownership transfer
            @dev Only callable by the new owner
            """
            _admin: address = self.future_admin
            assert msg.sender == _admin  # dev: future admin only

            self.admin = _admin
            self.future_admin = empty(address)
        ```

    === "Example"

        ```shell
        >>> Factory.accept_transfer_ownership()
        ```