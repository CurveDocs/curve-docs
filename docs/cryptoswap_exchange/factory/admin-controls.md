## **Set New Implementation Contracts**

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

        ```python
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

        ```python
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

        ```python
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


## **Set Fee Receiver**

### `set_fee_receiver`
!!! description "`Factory.set_fee_receiver(_fee_receiver: address):`"

    !!!guard "Guarded Method"
        This function is only callable by the `admin` of the contract.

    Function to set a new `fee_receiver` address.

    Emits event: `UpdateFeeReceiver`

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_fee_receiver` |  `address` | new fee receiver address |

    ??? quote "Source code"

        ```python
        event UpdateFeeReceiver:
            _old_fee_receiver: address
            _new_fee_receiver: address

        admin: public(address) 
        fee_receiver: public(address)

        @external
        def set_fee_receiver(_fee_receiver: address):
            """
            @notice Set fee receiver
            @param _fee_receiver Address that fees are sent to
            """
            assert msg.sender == self.admin  # dev: admin only

            log UpdateFeeReceiver(self.fee_receiver, _fee_receiver)
            self.fee_receiver = _fee_receiver
        ```

    === "Example"
        ```shell
        >>> Factory.set_fee_receiver("todo")
        'todo'
        ```



## **Transfer Contract Ownership**

### `commit_transfer_ownership`
!!! description "`Factory.commit_transfer_ownership(_addr: address):`"

    !!!guard "Guarded Method"
        This function is only callable by the `admin` of the contract.

    Function to commit the transfer of ownership of the contract to `_addr`. Calling this function sets `future_admin` to `_addr` which then needs to be accepted by calling `accept_transfer_ownership`.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_addr` |  `address` | address to commit the transfer of ownership to |

    ??? quote "Source code"

        ```python hl_lines="1"
        future_admin: public(address)    

        @external
        def commit_transfer_ownership(_addr: address):
            """
            @notice Transfer ownership of this contract to `addr`
            @param _addr Address of the new owner
            """
            assert msg.sender == self.admin, "dev: admin only"

            self.future_admin = _addr
        ```

    === "Example"
        ```shell
        >>> Factory.commit_transfer_ownership("todo")
        'todo'
        ```


### `accept_transfer_ownership`
!!! description "`Factory.accept_transfer_ownership(_addr: address):`"

    !!!guard "Guarded Method"
        This function is only callable by the `future_admin` of the contract.

    Function to accept ownership changes and set `future_admin` to `msg.sender` (which is `future_admin`).

    Emits event: `TransferOwnership`

    ??? quote "Source code"

        ```python
        event TransferOwnership:
            _old_owner: address
            _new_owner: address

        admin: public(address) 
        future_admin: public(address)    

        @external
        def accept_transfer_ownership():
            """
            @notice Accept a pending ownership transfer
            @dev Only callable by the new owner
            """
            assert msg.sender == self.future_admin, "dev: future admin only"

            log TransferOwnership(self.admin, msg.sender)
            self.admin = msg.sender
        ```

    === "Example"
        ```shell
        >>> Factory.accept_transfer_ownership()
        ```