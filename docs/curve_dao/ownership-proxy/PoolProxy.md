`PoolProxy` is used for indirect ownership of exchange contracts.

Source code for this contract is available on [Github](https://github.com/curvefi/curve-dao-contracts/blob/master/contracts/PoolProxy.vy).


## **StableSwap Pool Proxy**

## **Admin Ownership**
### `ownership_admin`
!!! description "`PoolProxy.ownership_admin() -> address: view`"

    Getter for the ownership admin of the contract.

    Retuns: ownership admin (`address`).

    ??? quote "Source code"

        ```python hl_lines="1 5"
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

### `parameter_admin`
!!! description "`PoolProxy.parameter_admin() -> address: view`"

    Getter for the parameter admin of the contract.

    Retuns: parameter admin (`address`).

    ??? quote "Source code"

        ```python hl_lines="1 6"
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

        ```python hl_lines="1 7"
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
!!! description "`PoolProxy.emergency_admin() -> address: view`"

    Getter for the future emergency admin of the contract.

    Retuns: future emergency admin (`address`).

    ??? quote "Source code"

        ```python hl_lines="1 13"
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
        >>> PoolProxy.future_ownership_admin(todo)
        'todo'
        ```


### `future_parameter_admin`
### `future_emergency_admin`

### `min_asymmetries`
### `burners`
### `burner_kill`
### `donate_approval`


## **WRITE FUNCTION (HOW TO CALL THIS)**
### `commit_set_admins`
### `apply_set_admins`
### `set_burner`
### `set_many_burner`
### `withdraw_admin_fees`
### `withdraw_many`
### `burn`
### `burn_many`
### `kill_me`
### `unkill_me`
### `set_burner_kill`
### `commit_transfer_ownership`
### `apply_transfer_ownership`
### `accept_transfer_ownership`
### `revert_transfer_ownership`
### `commit_new_parameters`
### `apply_new_parameters`
### `revert_new_parameters`
### `commit_new_fee`
### `apply_new_fee`
### `ramp_A`
### `stop_ramp_A`
### `set_aave_referral`
### `set_donate_approval`
### `donate_admin_fees`

