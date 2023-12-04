
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

        ```vyper
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
            assert msg.sender == self.admin, "dev: admin only"

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

        ```vyper
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

        ```vyper
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
        >>> Factory.accept_transfer_ownership("todo")
        'todo'
        ```


## **Implementations**

More on implementations [here](./implementations.md).