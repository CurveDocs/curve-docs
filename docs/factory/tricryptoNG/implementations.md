**The Tricrypto-NG Factory makes use of blueprint contracts to deploy its contracts from the implementations.**

It utilizes four different implementations:

- **`pool_implementation`** containing multiple blueprint contracts which are utilized to deploy the pools
- **`gauge_implementation`** containing a blueprint contract which is utilized when deploying gauges for pools
- **`views_implementation`** containing a view methods contract relevant for integrators and users looking to interact with the AMMs 
- **`math_implementation`** containing math functions used in the AMM

*More on the [**Math Implementation**](../../cryptoswap-exchange/tricrypto-ng/utility_contracts/math.md) and [**Views Implementation**](../../cryptoswap-exchange/tricrypto-ng/utility_contracts/views.md).*


## **Query Implementations**

### `pool_implementation`
!!! description "`Factory.pool_implementation(arg0: uint256) -> address: view`"

    Getter for the current pool implementation contract. hashamp because two-coin and three-pool pools?

    Returns: pool blueprint contract (`address`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `arg0` |  `uint256` | index |

    ??? quote "Source code"

        ```vyper
        pool_implementations: public(HashMap[uint256, address])
        ```

    === "Example"

        ```shell
        >>> Factory.pool_implementation(0)
        '0x66442B0C5260B92cAa9c234ECf2408CBf6b19a6f'
        ```


### `gauge_implementation`
!!! description "`Factory.gauge_implementation() -> address: view`"

    Getter for the current gauge implementation contract.

    Returns: gauge blueprint contract (`address`).

    ??? quote "Source code"

        ```vyper
        gauge_implementation: public(address)
        ```

    === "Example"

        ```shell
        >>> Factory.gauge_implementation()
        '0x5fC124a161d888893529f67580ef94C2784e9233'
        ```


### `views_implementation`
!!! description "`Factory.views_implementation() -> address: view`"

    Getter for the current views implementation contract.

    Returns: views blueprint contract (`address`).

    ??? quote "Source code"

        ```vyper
        views_implementation: public(address)
        ```

    === "Example"

        ```shell
        >>> Factory.views_implementation()
        '0x064253915b8449fdEFac2c4A74aA9fdF56691a31'
        ```


### `math_implementation`
!!! description "`Factory.math_implementation() -> address: view`"

    Getter for the current pool implementation contract.

    Returns: math blueprint contract (`address`).

    ??? quote "Source code"

        ```vyper
        math_implementation: public(address)
        ```

    === "Example"

        ```shell
        >>> Factory.math_implementation()
        '0xcBFf3004a20dBfE2731543AA38599A526e0fD6eE'
        ```



## **Changing Implementations** 

These implementations can be changed by the `admin` of the contract, which is the DAO.

### `set_pool_implementation`
!!! description "`Factory.set_pool_implementation(_pool_implementation: address, _implementation_index: uint256):`"

    !!!guard "Guarded Method"
        This function is only callable by the `admin` of the contract.

    Function to set a `_pool_implementation` for `_implementation_index`. Index for the pool implementation is needed as there can be multiple different versions of pools (two-coin and three-coin).

    Emits event: `UpdatePoolImplementation`

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_pool_implementation` |  `address` | pool blueprint contract |
    | `_implementation_index` |  `uint256` | index |

    ??? quote "Source code"

        ```vyper
        event UpdatePoolImplementation:
            _implemention_id: uint256
            _old_pool_implementation: address
            _new_pool_implementation: address

        pool_implementations: public(HashMap[uint256, address])

        @external
        def set_pool_implementation(
            _pool_implementation: address, _implementation_index: uint256
        ):
            """
            @notice Set pool implementation
            @dev Set to empty(address) to prevent deployment of new pools
            @param _pool_implementation Address of the new pool implementation
            @param _implementation_index Index of the pool implementation
            """
            assert msg.sender == self.admin, "dev: admin only"

            log UpdatePoolImplementation(
                _implementation_index,
                self.pool_implementations[_implementation_index],
                _pool_implementation
            )

            self.pool_implementations[_implementation_index] = _pool_implementation
        ```

    === "Example"
        ```shell
        >>> Factory.set_pool_implementation("todo")
        'todo'
        ```


### `set_gauge_implementation`
!!! description "`Factory.set_gauge_implementation(_gauge_implementation: address):`"

    !!!guard "Guarded Method"
        This function is only callable by the `admin` of the contract.

    Function to set a new `_gauge_implementation`.

    Emits event: `UpdateGaugeImplementation`

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_gauge_implementation` |  `address` | gauge blueprint contract |

    ??? quote "Source code"

        ```vyper
        event UpdateGaugeImplementation:
            _old_gauge_implementation: address
            _new_gauge_implementation: address

        gauge_implementation: public(address)

        @external
        def set_gauge_implementation(_gauge_implementation: address):
            """
            @notice Set gauge implementation
            @dev Set to empty(address) to prevent deployment of new gauges
            @param _gauge_implementation Address of the new token implementation
            """
            assert msg.sender == self.admin, "dev: admin only"

            log UpdateGaugeImplementation(self.gauge_implementation, _gauge_implementation)
            self.gauge_implementation = _gauge_implementation
        ```

    === "Example"
        ```shell
        >>> Factory.set_gauge_implementation("todo")
        'todo'
        ```


### `set_views_implementation`
!!! description "`Factory.set_views_implementation(_views_implementation: address):`"

    !!!guard "Guarded Method"
        This function is only callable by the `admin` of the contract.

    Function to set a new `_views_implementation`.

    Emits event: `UpdateViewsImplementation`

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_views_implementation` |  `address` | views blueprint contract |

    ??? quote "Source code"

        ```vyper
        event UpdateViewsImplementation:
            _old_views_implementation: address
            _new_views_implementation: address

        views_implementation: public(address)

        @external
        def set_views_implementation(_views_implementation: address):
            """
            @notice Set views contract implementation
            @param _views_implementation Address of the new views contract
            """
            assert msg.sender == self.admin,  "dev: admin only"

            log UpdateViewsImplementation(self.views_implementation, _views_implementation)
            self.views_implementation = _views_implementation
        ```

    === "Example"
        ```shell
        >>> Factory.set_views_implementation("todo")
        'todo'
        ```


### `set_math_implementation`
!!! description "`Factory.set_math_implementation(_math_implementation: address):`"

    !!!guard "Guarded Method"
        This function is only callable by the `admin` of the contract.

    Function to set a new `_math_implementation`.

    Emits event: `UpdateMathImplementation`

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_math_implementation` |  `address` | math blueprint contract |

    ??? quote "Source code"

        ```vyper
        event UpdateMathImplementation:
            _old_math_implementation: address
            _new_math_implementation: address

        math_implementation: public(address)

        @external
        def set_math_implementation(_math_implementation: address):
            """
            @notice Set math implementation
            @param _math_implementation Address of the new math contract
            """
            assert msg.sender == self.admin, "dev: admin only"

            log UpdateMathImplementation(self.math_implementation, _math_implementation)
            self.math_implementation = _math_implementation
        ```

    === "Example"
        ```shell
        >>> Factory.set_math_implementation("todo")
        'todo'
        ```
    