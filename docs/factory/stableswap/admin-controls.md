## **Set Fee Receiver**

### `set_fee_receiver`
!!! description "`Factory.set_fee_receiver(_base_pool: address, _fee_receiver: address):`"

    !!!guard "Guarded Method"
        This function is only callable by the `admin` of the contract.

    Function to set a new `fee_receiver` address.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_base_pool` |  `address` | base pool address to set fee receiver for |
    | `_fee_receiver` |  `address` | new fee receiver address |

    ??? quote "Source code"

        ```vyper
        @external
        def set_fee_receiver(_base_pool: address, _fee_receiver: address):
            """
            @notice Set fee receiver for base and plain pools
            @param _base_pool Address of base pool to set fee receiver for.
                            For plain pools, leave as `ZERO_ADDRESS`.
            @param _fee_receiver Address that fees are sent to
            """
            assert msg.sender == self.admin  # dev: admin only
            if _base_pool == ZERO_ADDRESS:
                self.fee_receiver = _fee_receiver
            else:
                self.base_pool_data[_base_pool].fee_receiver = _fee_receiver
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
        >>> Factory.commit_transfer_ownership("todo")
        'todo'
        ```


### `accept_transfer_ownership`
!!! description "`Factory.accept_transfer_ownership():`"

    !!!guard "Guarded Method"
        This function is only callable by the `future_admin` of the contract.

    Function to accept ownership changes.

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
            self.future_admin = ZERO_ADDRESS
        ```

    === "Example"
        ```shell
        >>> Factory.accept_transfer_ownership()
        ```


## **Implementations**

More on implementations [here](./implementations.md).