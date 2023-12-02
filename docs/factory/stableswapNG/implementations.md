## **Implementations**

Additionally to other Factories, the stableswap-ng uses utility contracts for Math  (**`math_implementation`**) and Views (**`views_implementation`**).


### `pool_implementations`
!!! description "`Factory.pool_implementations(arg0: uint256) -> address: view`"

    Getter for the pool implementations. There might be multiple pool implementations base on various circumstances. 

    Returns: implementation (`address`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `arg0` |  `uint256` | index value of the implementation |

    ??? quote "Source code"

        ```vyper
        # index -> implementation address
        pool_implementations: public(HashMap[uint256, address])
        ```

    === "Example"

        ```shell
        >>> Factory.pool_implementation(0)
        '0x3E3B5F27bbf5CC967E074b70E9f4046e31663181'
        ```


### `metapool_implementations`
!!! description "`Factory.metapool_implementations(arg0: uint256) -> address: view`"

    Getter for the pool implementations. There might be multiple metapool implementations base on various circumstances. 


    Returns: implementation (`address`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `arg0` |  `uint256` | index value of the implementation |

    ??? quote "Source code"

        ```vyper
        # index -> implementation address
        metapool_implementations: public(HashMap[uint256, address])
        ```

    === "Example"

        ```shell
        >>> Factory.metapool_implementation(0)
        '0x19bd1AB34d6ABB584b9C1D5519093bfAA7f6c7d2'
        ```


### `math_implementations`
!!! description "`Factory.math_implementations() -> address: view`"

    Getter for the math implementations.

    Returns: implementation (`address`).

    ??? quote "Source code"

        ```vyper
        # index -> implementation address
        math_implementation: public(address)
        ```

    === "Example"

        ```shell
        >>> Factory.math_implementation()
        '0x20D1c021525C85D9617Ccc64D8f547d5f730118A'
        ```


### `gauge_implementations`
!!! description "`Factory.gauge_implementations() -> address: view`"

    Getter for the gauge implementations.

    Returns: implementation (`address`).

    ??? quote "Source code"

        ```vyper
        # index -> implementation address
        gauge_implementation: public(address)
        ```

    === "Example"

        ```shell
        >>> Factory.gauge_implementation()
        '0xF5617D4f7514bE35fce829a1C19AE7f6c9106979'
        ```


### `views_implementation`
!!! description "`Factory.views_implementations() -> address: view`"

    Getter for the views implementations.

    Returns: implementation (`address`).

    ??? quote "Source code"

        ```vyper
        # index -> implementation address
        views_implementation: public(address)
        ```

    === "Example"

        ```shell
        >>> Factory.views_implementation()
        '0x87DD13Dd25a1DBde0E1EdcF5B8Fa6cfff7eABCaD' 
        ```

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