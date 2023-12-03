**The CryptoSwap Factory makes use of the `create_forwarder_to` function to deploy its contracts from the implementations.**

!!!warning
    **Implementation contracts are upgradable.** They can either be replaced, or additional implementation contracts can be added. Therefore, please always make sure to check the most recent ones.

It utilizes three different implementations:

- **`pool_implementation`**, containing a contract that is used to deploy the pools.
- **`token_implementation`**, containing a contract that is used to deploy LP tokens.
- **`gauge_implementation`**, containing a blueprint contract that is used when deploying gauges for pools.


## **Query Implementations**
 
### `pool_implementations`
!!! description "`Factory.pool_implementations() -> address: view`"

    Getter for the pool implementation contract.

    Returns: pool implementation (`address`).

    ??? quote "Source code"

        ```vyper
        pool_implementation: public(address)
        ```

    === "Example"
        ```shell
        >>> Factory.pool_implementations()
        '0xa85461AFc2DEEC01bDA23b5cd267d51F765fba10'
        ```


### `token_implementation`
!!! description "`Factory.token_implementation() -> address: view`"

    Getter for the token implementation contract.

    Returns: token implementation (`address`).

    ??? quote "Source code"

        ```vyper
        token_implementation: public(address)
        ```

    === "Example"
        ```shell
        >>> Factory.token_implementation()
        '0xc08550A4cc5333f40e593eCc4C4724808085D304'
        ```


### `gauge_implementation`
!!! description "`Factory.gauge_implementation() -> address: view`"

    Getter for the gauge implementation contract.

    Returns: gauge implementation (`address`).

    ??? quote "Source code"

        ```vyper
        gauge_implementation: public(address)
        ```

    === "Example"
        ```shell
        >>> Factory.gauge_implementation()
        '0xdc892358d55d5Ae1Ec47a531130D62151EBA36E5'
        ```


## **Set New Implementation**

*New implementations can be set via these admin-only functions:*

### `set_pool_implementation`
!!! description "`Factory.set_pool_implementation(_pool_implementation: address):`"

    !!!guard "Guarded Method"
        This function is only callable by the `admin` of the contract.

    Function to set a new pool implementation contract.

    Emits event: `UpdatePoolImplementation`

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_pool_implementation` |  `address` | new pool implementation |

    ??? quote "Source code"

        ```vyper
        event UpdatePoolImplementation:
            _old_pool_implementation: address
            _new_pool_implementation: address

        pool_implementation: public(address)

        @external
        def set_pool_implementation(_pool_implementation: address):
            """
            @notice Set pool implementation
            @dev Set to ZERO_ADDRESS to prevent deployment of new pools
            @param _pool_implementation Address of the new pool implementation
            """
            assert msg.sender == self.admin  # dev: admin only

            log UpdatePoolImplementation(self.pool_implementation, _pool_implementation)
            self.pool_implementation = _pool_implementation
        ```

    === "Example"
        ```shell
        >>> Factory.set_pool_implementation("todo")
        'todo'
        ```


### `set_token_implementation`
!!! description "`Factory.set_token_implementation(_token_implementation: address):`"

    !!!guard "Guarded Method"
        This function is only callable by the `admin` of the contract.

    Function to set a new token implementation contract.

    Emits event: `UpdateTokenImplementation`

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_token_implementation` |  `address` | new token implementation |

    ??? quote "Source code"

        ```vyper
        event UpdateTokenImplementation:
            _old_token_implementation: address
            _new_token_implementation: address

        token_implementation: public(address)

        @external
        def set_token_implementation(_token_implementation: address):
            """
            @notice Set token implementation
            @dev Set to ZERO_ADDRESS to prevent deployment of new pools
            @param _token_implementation Address of the new token implementation
            """
            assert msg.sender == self.admin  # dev: admin only

            log UpdateTokenImplementation(self.token_implementation, _token_implementation)
            self.token_implementation = _token_implementation
        ```

    === "Example"
        ```shell
        >>> Factory.set_token_implementation("todo")
        'todo'
        ```


### `set_gauge_implementation`
!!! description "`Factory.set_fee_receiver(_fee_receiver: address):`"

    !!!guard "Guarded Method"
        This function is only callable by the `admin` of the contract.

    Function to set a new gauge implementation contract.

    Emits event: `UpdateGaugeImplementation`

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_gauge_implementation` |  `address` | new gauge implementation |

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
            @dev Set to ZERO_ADDRESS to prevent deployment of new gauges
            @param _gauge_implementation Address of the new token implementation
            """
            assert msg.sender == self.admin  # dev: admin-only function

            log UpdateGaugeImplementation(self.gauge_implementation, _gauge_implementation)
            self.gauge_implementation = _gauge_implementation
        ```

    === "Example"
        ```shell
        >>> Factory.set_gauge_implementation("todo")
        'todo'
        ```