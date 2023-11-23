<h1> </h1>

# **Curve DAO: Protocol Ownership**

The Curve DAO controls admin functionality throughout the protocol. Performing calls to owner/admin-level functions is only possible via a successful DAO vote.

Ownership is handled via a series of proxy contracts. At a high level, the flow of ownership is:

<div align="center">

``` mermaid
graph LR
  A(DAO) --> B(Aragon Agent);
  B --> C(Ownership Proxy);
  C --> D(Contract);
```

</div>


*The DAO is capable of replacing the ownership proxies via a vote*.


# **Admin Ownership**

Pool and Gauge proxies usually have three different admins (representing the different [agents](../ownership-proxy/Agents.md) of curve):

- **`ownership_admin`**: controls most functionality; requires a 30% quorum with 51% support  
- **`parameter_admin`**: authority to modify parameters on pools; requries a 15% quorum with 60% support  
- **`emergency_admin`**: limited authority to kill pools and gauges under certain circumstances  


## **Changing Admins**

### `commit_set_admins`
!!! description "`PoolProxy.commit_set_admins(_o_admin: address, _p_admin: address, _e_admin: address):`"

    Function to commit `_o_admin` as ownership admin, `_p_admin` as parameter admin and `_e_admin` as emergency admin.   
    These changes need to be applied by calling [`apply_set_admin`](#apply_set_admins).

    Emits: `CommitAdmins`

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_o_admin` |  `address` | New Ownership Admin Address |
    | `_p_admin` |  `address` | New Parameter Admin Address |
    | `_e_admin` |  `address` | New Emergency Admin Address |

    !!!note
        This function is only callable by the current `ownership_admin`.

    ??? quote "Source code"

        ```vyper
        event CommitAdmins:
            ownership_admin: address
            parameter_admin: address
            emergency_admin: address

        @external
        def commit_set_admins(_o_admin: address, _p_admin: address, _e_admin: address):
            """
            @notice Set ownership admin to `_o_admin`, parameter admin to `_p_admin` and emergency admin to `_e_admin`
            @param _o_admin Ownership admin
            @param _p_admin Parameter admin
            @param _e_admin Emergency admin
            """
            assert msg.sender == self.ownership_admin, "Access denied"

            self.future_ownership_admin = _o_admin
            self.future_parameter_admin = _p_admin
            self.future_emergency_admin = _e_admin

            log CommitAdmins(_o_admin, _p_admin, _e_admin)
        ```

    === "Example"
        ```shell
        >>> PoolProxy.commit_set_admins("0x0000000000000000000000000000000000000000", "0x0000000000000000000000000000000000000000", "0x0000000000000000000000000000000000000000")
        ```


### `apply_set_admins`
!!! description "`PoolProxy.apply_set_admins():`"

    Function to apply the admin changes.

    Emits: `ApplyAdmins`

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_o_admin` |  `address` | New Ownership Admin Address |
    | `_p_admin` |  `address` | New Parameter Admin Address |
    | `_e_admin` |  `address` | New Emergency Admin Address |

    !!!note
        This function is only callable by the current `ownership_admin`.

    ??? quote "Source code"

        ```vyper
        event ApplyAdmins:
            ownership_admin: address
            parameter_admin: address
            emergency_admin: address

        @external
        def apply_set_admins():
            """
            @notice Apply the effects of `commit_set_admins`
            """
            assert msg.sender == self.ownership_admin, "Access denied"

            _o_admin: address = self.future_ownership_admin
            _p_admin: address = self.future_parameter_admin
            _e_admin: address = self.future_emergency_admin
            self.ownership_admin = _o_admin
            self.parameter_admin = _p_admin
            self.emergency_admin = _e_admin

            log ApplyAdmins(_o_admin, _p_admin, _e_admin)
        ```

    === "Example"
        ```shell
        >>> PoolProxy.apply_set_admins()
        ```



## **Querying Admins**

### `ownership_admin`
!!! description "`PoolProxy.ownership_admin() -> address: view`"

    Getter for the ownership admin of the contract.

    Retuns: ownership admin (`address`).

    ??? quote "Source code"

        ```vyper
        ownership_admin: public(address)

        @external
        def __init__(
            _ownership_admin: address,
            _parameter_admin: address,
            _emergency_admin: address
        ):
            self.ownership_admin = _ownership_admin
            self.parameter_admin = _parameter_admin
            self.emergency_admin = _emergency_admin
        ```

    === "Example"
        ```shell
        >>> PoolProxy.ownership_admin()
        '0x40907540d8a6C65c637785e8f8B742ae6b0b9968'
        ```

#### `parameter_admin`
!!! description "`PoolProxy.parameter_admin() -> address: view`"

    Getter for the parameter admin of the contract.

    Retuns: parameter admin (`address`).

    ??? quote "Source code"

        ```vyper
        parameter_admin: public(address)

        @external
        def __init__(
            _ownership_admin: address,
            _parameter_admin: address,
            _emergency_admin: address
        ):
            self.ownership_admin = _ownership_admin
            self.parameter_admin = _parameter_admin
            self.emergency_admin = _emergency_admin
        ```

    === "Example"
        ```shell
        >>> PoolProxy.parameter_admin()
        '0x4EEb3bA4f221cA16ed4A0cC7254E2E32DF948c5f'
        ```

### `emergency_admin`
!!! description "`PoolProxy.emergency_admin() -> address: view`"

    Getter for the emergency admin of the contract.

    Retuns: emergency admin (`address`).

    ??? quote "Source code"

        ```vyper
        emergency_admin: public(address)

        @external
        def __init__(
            _ownership_admin: address,
            _parameter_admin: address,
            _emergency_admin: address
        ):
            self.ownership_admin = _ownership_admin
            self.parameter_admin = _parameter_admin
            self.emergency_admin = _emergency_admin
        ```

    === "Example"
        ```shell
        >>> PoolProxy.emergency_admin()
        '0x40907540d8a6C65c637785e8f8B742ae6b0b9968'
        ```


### `future_ownership_admin`
!!! description "`PoolProxy.future_ownership_admin() -> address: view`"

    Getter for the future ownership admin.

    Retuns: future ownership admin (`address`).

    ??? quote "Source code"

        ```vyper
        future_ownership_admin: public(address)

        @external
        def commit_set_admins(_o_admin: address, _p_admin: address, _e_admin: address):
            """
            @notice Set ownership admin to `_o_admin`, parameter admin to `_p_admin` and emergency admin to `_e_admin`
            @param _o_admin Ownership admin
            @param _p_admin Parameter admin
            @param _e_admin Emergency admin
            """
            assert msg.sender == self.ownership_admin, "Access denied"

            self.future_ownership_admin = _o_admin
            self.future_parameter_admin = _p_admin
            self.future_emergency_admin = _e_admin

            log CommitAdmins(_o_admin, _p_admin, _e_admin)
        ```

    === "Example"
        ```shell
        >>> PoolProxy.future_ownership_admin()
        '0x40907540d8a6C65c637785e8f8B742ae6b0b9968'
        ```


### `future_parameter_admin`
!!! description "`PoolProxy.future_parameter_admin() -> address: view`"

    Getter for the future parameter admin.

    Retuns: future parameter admin (`address`).

    ??? quote "Source code"

        ```vyper
        future_parameter_admin: public(address)

        @external
        def commit_set_admins(_o_admin: address, _p_admin: address, _e_admin: address):
            """
            @notice Set ownership admin to `_o_admin`, parameter admin to `_p_admin` and emergency admin to `_e_admin`
            @param _o_admin Ownership admin
            @param _p_admin Parameter admin
            @param _e_admin Emergency admin
            """
            assert msg.sender == self.ownership_admin, "Access denied"

            self.future_ownership_admin = _o_admin
            self.future_parameter_admin = _p_admin
            self.future_emergency_admin = _e_admin

            log CommitAdmins(_o_admin, _p_admin, _e_admin)
        ```

    === "Example"
        ```shell
        >>> PoolProxy.future_parameter_admin()
        '0x4EEb3bA4f221cA16ed4A0cC7254E2E32DF948c5f'
        ```


### `future_emergency_admin`
!!! description "`PoolProxy.future_emergency_admin() -> address: view`"

    Getter for the future emergency admin.

    Retuns: future emergency admin (`address`).

    ??? quote "Source code"

        ```vyper
        future_emergency_admin: public(address)

        @external
        def commit_set_admins(_o_admin: address, _p_admin: address, _e_admin: address):
            """
            @notice Set ownership admin to `_o_admin`, parameter admin to `_p_admin` and emergency admin to `_e_admin`
            @param _o_admin Ownership admin
            @param _p_admin Parameter admin
            @param _e_admin Emergency admin
            """
            assert msg.sender == self.ownership_admin, "Access denied"

            self.future_ownership_admin = _o_admin
            self.future_parameter_admin = _p_admin
            self.future_emergency_admin = _e_admin

            log CommitAdmins(_o_admin, _p_admin, _e_admin)
        ```

    === "Example"
        ```shell
        >>> PoolProxy.future_emergency_admin()
        '0x467947EE34aF926cF1DCac093870f613C96B1E0c'
        ```