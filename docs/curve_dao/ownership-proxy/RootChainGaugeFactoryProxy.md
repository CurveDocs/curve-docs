ProxyOwnership contracct for the [RootChainGaugeFactory](https://etherscan.io/address/0xabC000d88f23Bb45525E447528DBF656A9D55bf5#code).

!!! info
    **`RootChainGaugeFactoryProxy`** contract is deployed on the Ethereum mainnet at: [0x017dB2B92233018973902858B31269Ed071E1D39](https://etherscan.io/address/0x017dB2B92233018973902858B31269Ed071E1D39#code).  
    Source code for this contract is available on [Github](https://github.com/curvefi/curve-dao-contracts/blob/master/contracts/GaugeProxy.vy).


Admin functions of the RootChainFactory or RootChainGauges need to be called via the RootChainGaugeFactoryProxy and therefore require a successfully passed DAO vote.

Additionally, there is a contract `manager` who is able to call functions such as `set_bridger`, `set_implementation` or `set_call_proxy`. *The manager CAN NOT kill gauges or change the admins of this contract*!

For further documentation on what those function do please refer to [`RootChainGaugeFactory`](../LiquidityGaugesAndMintingCRV/evm-sidechains/RootChainGaugeFactory.md)



## Admin and Manager Ownership

The Proxy has the usual ownersip and emergency admins and the usual functions to changes those variables.

- OwnershipAdmin: [0x40907540d8a6C65c637785e8f8B742ae6b0b9968](https://etherscan.io/address/0x40907540d8a6C65c637785e8f8B742ae6b0b9968)
- EmergencyAdmin: [0x467947EE34aF926cF1DCac093870f613C96B1E0c](https://etherscan.io/address/0x467947EE34aF926cF1DCac093870f613C96B1E0c)


### `commit_set_admins`
!!! description "`RootChainFactory.commit_set_admins(_o_admin: address, _e_admin: address):`"

    Function to commit a new ownership and emergency admins.

    Emits: `CommitAdmins`

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_o_admin` |  `address` | New Ownership Admin Address |
    | `_e_admin` |  `address` | New Emergency Admin Address |

    !!!note
        This function can only be called by the `ownership_admin`.

    ??? quote "Source code"

        ```python hl_lines="1 9 15 17 18 20"
        event CommitAdmins:
            ownership_admin: indexed(address)
            emergency_admin: indexed(address)

        ownership_admin: public(address)
        emergency_admin: public(address)

        @external
        def commit_set_admins(_o_admin: address, _e_admin: address):
            """
            @notice Set ownership admin to `_o_admin` and emergency admin to `_e_admin`
            @param _o_admin Ownership admin
            @param _e_admin Emergency admin
            """
            assert msg.sender == self.ownership_admin, "Access denied"

            self.future_ownership_admin = _o_admin
            self.future_emergency_admin = _e_admin

            log CommitAdmins(_o_admin, _e_admin)
        ```

    === "Example"

        ```shell
        >>> RootChainFactory.commit_set_admins():        
        ```


### `accept_set_admin`
!!! description "`RootChainFactory.accept_set_admins():`"

    Function to accept the ownership and emergency admin changes.

    Emits: `ApplyAdmins`

    !!!note
        This function can only be called by the `future_ownership_admin`.

    ??? quote "Source code"

        ```python hl_lines="1 9 14 17 18 20"
        event ApplyAdmins:
            ownership_admin: indexed(address)
            emergency_admin: indexed(address)

        ownership_admin: public(address)
        emergency_admin: public(address)

        @external
        def accept_set_admins():
            """
            @notice Apply the effects of `commit_set_admins`
            @dev Only callable by the new owner admin
            """
            assert msg.sender == self.future_ownership_admin, "Access denied"

            e_admin: address = self.future_emergency_admin
            self.ownership_admin = msg.sender
            self.emergency_admin = e_admin

            log ApplyAdmins(msg.sender, e_admin)
        ```

    === "Example"

        ```shell
        >>> RootChainFactory.accept_set_admins():        
        ```


### `manager`
!!! description "`RootChainFactory.manager() -> address: view`"

    Function to accept the ownership and emergency admin changes.

    Emits: `ApplyAdmins`

    !!!note
        This function can only be called by the `future_ownership_admin`.

    ??? quote "Source code"

        ```python hl_lines="1"
        manager: public(address)
        ```

    === "Example"

        ```shell
        >>> RootChainFactory.manager():
        '0x7f3026195D1b689d187D28A182CCE16B8BEcF77f'        
        ```


### `set_manager`
!!! description "`RootChainFactory.set_manager(_new_manager: address):`"

    Function to accept the ownership and emergency admin changes.

    Emits: `ApplyAdmins`

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_new_manager` |  `address` | New Manager Address |

    !!!note
        This function can only be called by the `ownership_admin`, `emergency_admin` or `manager`.

    ??? quote "Source code"

        ```python hl_lines="1 4 7 12 13 14"
        event SetManager:
            _manager: indexed(address)

        manager: public(address)

        @external
        def set_manager(_new_manager: address):
            """
            @notice Set the manager account which is not capable of killing gauges.
            @param _new_manager The new manager account
            """
            assert msg.sender in [self.ownership_admin, self.emergency_admin, self.manager]
            self.manager = _new_manager
            log SetManager(_new_manager)
        ```

    === "Example"

        ```shell
        >>> RootChainFactory.set_manager('todo'):
        ```

