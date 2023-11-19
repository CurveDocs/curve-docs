`PoolProxy` is used for indirect ownership of exchange contracts.

As these proxies are the admins of the exchange contracts, they are used to call admin-only functions. These admin function differ mostly depending on the kind of liquidity pool if its a stableswap or a cryptoswap pool. For an more clear overview, please refer to the *admin control section of StableSwap or CryptoSwap pools*.

!!! info
    There are multiple deployed **`PoolProxy`** contracts. For a overview of all actively used proxies, see [here](../ownership-proxy/overview.md).


## **Admin Ownership**

### `ownership_admin`
!!! description "`PoolProxy.ownership_admin() -> address: view`"

    Getter for the ownership admin of the contract.

    Retuns: **ownership admin** (`address`).

    ??? quote "Source code"

        ```vyper hl_lines="1 5"
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

    Retuns: **parameter admin** (`address`).

    ??? quote "Source code"

        ```vyper hl_lines="1 6"
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

    Retuns: **emergency admin** (`address`).

    ??? quote "Source code"

        ```vyper hl_lines="1 7"
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

    Getter for the **future** ownership admin of the contract. This variable can be changed by calling [`commit_transfer_ownership`](#commit_transfer_ownership).

    Retuns: **future ownership admin** (`address`).

    ??? quote "Source code"

        ```vyper hl_lines="1 13"
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

    Getter for the **future** parameter admin of the contract. This variable can be changed by calling [`commit_transfer_ownership`](#commit_transfer_ownership).

    Retuns: **future parameter admin** (`address`).

    ??? quote "Source code"

        ```vyper hl_lines="1 14"
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

    Getter for the future emergency admin of the contract.

    Retuns: **future emergency admin** (`address`).

    ??? quote "Source code"

        ```vyper hl_lines="1 15"
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


### `commit_set_admins`
!!! description "`PoolProxy.commit_set_admins(_o_admin: address, _p_admin: address, _e_admin: address):`"

    Function to commit new admins for `ownership_admin`, `parameter_admin` and `emergency_admin`. Calling this function results in setting the corresponding `future_admin` for the different admins. The changes then need to be applied by calling [`apply_set_admin`](#apply_set_admins).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_o_admin` |  `address` | New Ownership Admin Address |
    | `_p_admin` |  `address` | New Parameter Admin Address |
    | `_e_admin` |  `address` | New Emergency Admin Address |

    ??? quote "Source code"

        ```vyper hl_lines="1 7 20"
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
        >>> PoolProxy.commit_set_admins("todo")
        'todo'
        ```

### `apply_set_admins`
!!! description "`PoolProxy.apply_set_admins():`"

    Function to apply the changes 

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_o_admin` |  `address` | New Ownership Admin Address |
    | `_p_admin` |  `address` | New Parameter Admin Address |
    | `_e_admin` |  `address` | New Emergency Admin Address |

    ??? quote "Source code"

        ```vyper hl_lines="1 7 20"
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

    !!! permission 
        This function can only be called by the `ownership_admin`.

    === "Example"
        ```shell
        >>> PoolProxy.apply_set_admins()
        ```


## **Pool Ownership**
### `commit_transfer_ownership`
!!! description "`PoolProxy.commit_transfer_ownership(_pool: address, new_owner: address):`"

    Function to transfer ownership for `_pool` pool to `new_owner` address.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_pool` |  `address` | Pool address |
    | `new_owner` | `address` | New pool owner address |

    ??? quote "Source code"

        ```vyper hl_lines="5 21"
        interface Curve:
            def withdraw_admin_fees(): nonpayable
            def kill_me(): nonpayable
            def unkill_me(): nonpayable
            def commit_transfer_ownership(new_owner: address): nonpayable
            def apply_transfer_ownership(): nonpayable
            def accept_transfer_ownership(): nonpayable
            def revert_transfer_ownership(): nonpayable
            def commit_new_parameters(amplification: uint256, new_fee: uint256, new_admin_fee: uint256): nonpayable
            def apply_new_parameters(): nonpayable
            def revert_new_parameters(): nonpayable
            def commit_new_fee(new_fee: uint256, new_admin_fee: uint256): nonpayable
            def apply_new_fee(): nonpayable
            def ramp_A(_future_A: uint256, _future_time: uint256): nonpayable
            def stop_ramp_A(): nonpayable
            def set_aave_referral(referral_code: uint256): nonpayable
            def donate_admin_fees(): nonpayable

        @external
        @nonreentrant('lock')
        def commit_transfer_ownership(_pool: address, new_owner: address):
            """
            @notice Transfer ownership for `_pool` pool to `new_owner` address
            @param _pool Pool which ownership is to be transferred
            @param new_owner New pool owner address
            """
            assert msg.sender == self.ownership_admin, "Access denied"
            Curve(_pool).commit_transfer_ownership(new_owner)
        ```

    === "Example"
        ```shell
        >>> PoolProxy.commit_transfer_ownership(todo):
        todo
        ```


### `apply_transfer_ownership`
!!! description "`PoolProxy.apply_transfer_ownership(_pool: address):`"

    Function to apply transferring ownership of `_pool`.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_pool` |  `address` | Pool address |

    ??? quote "Source code"

        ```vyper hl_lines="6 21"
        interface Curve:
            def withdraw_admin_fees(): nonpayable
            def kill_me(): nonpayable
            def unkill_me(): nonpayable
            def commit_transfer_ownership(new_owner: address): nonpayable
            def apply_transfer_ownership(): nonpayable
            def accept_transfer_ownership(): nonpayable
            def revert_transfer_ownership(): nonpayable
            def commit_new_parameters(amplification: uint256, new_fee: uint256, new_admin_fee: uint256): nonpayable
            def apply_new_parameters(): nonpayable
            def revert_new_parameters(): nonpayable
            def commit_new_fee(new_fee: uint256, new_admin_fee: uint256): nonpayable
            def apply_new_fee(): nonpayable
            def ramp_A(_future_A: uint256, _future_time: uint256): nonpayable
            def stop_ramp_A(): nonpayable
            def set_aave_referral(referral_code: uint256): nonpayable
            def donate_admin_fees(): nonpayable

        @external
        @nonreentrant('lock')
        def apply_transfer_ownership(_pool: address):
            """
            @notice Apply transferring ownership of `_pool`
            @param _pool Pool address
            """
            Curve(_pool).apply_transfer_ownership()
        ```

    === "Example"
        ```shell
        >>> PoolProxy.apply_transfer_ownership(_pool: address):
        todo
        ```


### `accept_transfer_ownership`
!!! description "`PoolProxy.accept_transfer_ownership(_pool: address):`"

    Function to accept transferring ownership of `_pool`.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_pool` |  `address` | Pool address |

    ??? quote "Source code"

        ```vyper hl_lines="7 21"
        interface Curve:
            def withdraw_admin_fees(): nonpayable
            def kill_me(): nonpayable
            def unkill_me(): nonpayable
            def commit_transfer_ownership(new_owner: address): nonpayable
            def apply_transfer_ownership(): nonpayable
            def accept_transfer_ownership(): nonpayable
            def revert_transfer_ownership(): nonpayable
            def commit_new_parameters(amplification: uint256, new_fee: uint256, new_admin_fee: uint256): nonpayable
            def apply_new_parameters(): nonpayable
            def revert_new_parameters(): nonpayable
            def commit_new_fee(new_fee: uint256, new_admin_fee: uint256): nonpayable
            def apply_new_fee(): nonpayable
            def ramp_A(_future_A: uint256, _future_time: uint256): nonpayable
            def stop_ramp_A(): nonpayable
            def set_aave_referral(referral_code: uint256): nonpayable
            def donate_admin_fees(): nonpayable

        @external
        @nonreentrant('lock')
        def accept_transfer_ownership(_pool: address):
            """
            @notice Apply transferring ownership of `_pool`
            @param _pool Pool address
            """
            Curve(_pool).accept_transfer_ownership()
        ```

    === "Example"
        ```shell
        >>> PoolProxy.accept_transfer_ownership(_pool: address):
        todo
        ```


### `revert_transfer_ownership`
!!! description "`PoolProxy.revert_transfer_ownership(_pool: address):`"

    Function to revert commited transferring ownership for `_pool`.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_pool` |  `address` | Pool address|

    ??? quote "Source code"

        ```vyper hl_lines="8 21"
        interface Curve:
            def withdraw_admin_fees(): nonpayable
            def kill_me(): nonpayable
            def unkill_me(): nonpayable
            def commit_transfer_ownership(new_owner: address): nonpayable
            def apply_transfer_ownership(): nonpayable
            def accept_transfer_ownership(): nonpayable
            def revert_transfer_ownership(): nonpayable
            def commit_new_parameters(amplification: uint256, new_fee: uint256, new_admin_fee: uint256): nonpayable
            def apply_new_parameters(): nonpayable
            def revert_new_parameters(): nonpayable
            def commit_new_fee(new_fee: uint256, new_admin_fee: uint256): nonpayable
            def apply_new_fee(): nonpayable
            def ramp_A(_future_A: uint256, _future_time: uint256): nonpayable
            def stop_ramp_A(): nonpayable
            def set_aave_referral(referral_code: uint256): nonpayable
            def donate_admin_fees(): nonpayable

        @external
        @nonreentrant('lock')
        def revert_transfer_ownership(_pool: address):
            """
            @notice Revert commited transferring ownership for `_pool`
            @param _pool Pool address
            """
            assert msg.sender in [self.ownership_admin, self.emergency_admin], "Access denied"
            Curve(_pool).revert_transfer_ownership()
        ```

    === "Example"
        ```shell
        >>> PoolProxy.revert_transfer_ownership(_pool: address):
        todo
        ```


## **Burners**
For configuration of burners please refer to [Burner](/docs/curve_dao/FeeCollection%26Distribution/burner.md).


## **Admin Fees**
For withdrawing and burning admin fees please refer to [Withdrawing and Burning Admin Fees](/docs/curve_dao/FeeCollection%26Distribution/withdraw-and-burn.md).



## **Pool Parameters**
input text and refer to the stableswap section!!!

### `commit_new_parameters`
!!! description "`PoolProxy.commit_new_parameters(_pool: address, amplification: uint256, new_fee: uint256, new_admin_fee: uint256, min_asymmetry: uint256):`"

    Function to commit new parameters for pool (`_pool`), A (`amplification`), fee (`new_fee`) and admin fee (`new_admin_fee`)

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_pool` |  `address` | Pool address |
    | `amplification` |  `uint256` | Amplification coefficient |
    | `new_fee` |  `uint256` | New fee |
    | `new_admin_fee` |  `uint256` | New admin fee |
    | `min_asymmetry` |  `uint256` | Minimal asymmetry factor allowed. Asymmetry factor is: $\frac{Prod(balances)}{(Sum(balances) / n )^N}$

    ??? quote "Source code"

        ```vyper hl_lines="9 21 38"
        interface Curve:
            def withdraw_admin_fees(): nonpayable
            def kill_me(): nonpayable
            def unkill_me(): nonpayable
            def commit_transfer_ownership(new_owner: address): nonpayable
            def apply_transfer_ownership(): nonpayable
            def accept_transfer_ownership(): nonpayable
            def revert_transfer_ownership(): nonpayable
            def commit_new_parameters(amplification: uint256, new_fee: uint256, new_admin_fee: uint256): nonpayable
            def apply_new_parameters(): nonpayable
            def revert_new_parameters(): nonpayable
            def commit_new_fee(new_fee: uint256, new_admin_fee: uint256): nonpayable
            def apply_new_fee(): nonpayable
            def ramp_A(_future_A: uint256, _future_time: uint256): nonpayable
            def stop_ramp_A(): nonpayable
            def set_aave_referral(referral_code: uint256): nonpayable
            def donate_admin_fees(): nonpayable

        @external
        @nonreentrant('lock')
        def commit_new_parameters(_pool: address,
                                amplification: uint256,
                                new_fee: uint256,
                                new_admin_fee: uint256,
                                min_asymmetry: uint256):
            """
            @notice Commit new parameters for `_pool`, A: `amplification`, fee: `new_fee` and admin fee: `new_admin_fee`
            @param _pool Pool address
            @param amplification Amplification coefficient
            @param new_fee New fee
            @param new_admin_fee New admin fee
            @param min_asymmetry Minimal asymmetry factor allowed.
                    Asymmetry factor is:
                    Prod(balances) / (Sum(balances) / N) ** N
            """
            assert msg.sender == self.parameter_admin, "Access denied"
            self.min_asymmetries[_pool] = min_asymmetry
            Curve(_pool).commit_new_parameters(amplification, new_fee, new_admin_fee)  # dev: if implemented by the pool
        ```

    === "Example"
        ```shell
        >>> PoolProxy.commit_new_parameters(_pool: address, amplification: uint256, new_fee: uint256, new_admin_fee: uint256, min_asymmetry: uint256):
        todo
        ```


### `apply_new_parameters`
!!! description "`PoolProxy.apply_new_parameters(_pool: address):`"

    Function to apply new parameters for `_pool`.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_pool` |  `address` | Pool address|

    ??? quote "Source code"

        ```vyper hl_lines="9 21 38"
        interface Curve:
            def withdraw_admin_fees(): nonpayable
            def kill_me(): nonpayable
            def unkill_me(): nonpayable
            def commit_transfer_ownership(new_owner: address): nonpayable
            def apply_transfer_ownership(): nonpayable
            def accept_transfer_ownership(): nonpayable
            def revert_transfer_ownership(): nonpayable
            def commit_new_parameters(amplification: uint256, new_fee: uint256, new_admin_fee: uint256): nonpayable
            def apply_new_parameters(): nonpayable
            def revert_new_parameters(): nonpayable
            def commit_new_fee(new_fee: uint256, new_admin_fee: uint256): nonpayable
            def apply_new_fee(): nonpayable
            def ramp_A(_future_A: uint256, _future_time: uint256): nonpayable
            def stop_ramp_A(): nonpayable
            def set_aave_referral(referral_code: uint256): nonpayable
            def donate_admin_fees(): nonpayable

        @external
        @nonreentrant('lock')
        def apply_new_parameters(_pool: address):
            """
            @notice Apply new parameters for `_pool` pool
            @dev Only callable by an EOA
            @param _pool Pool address
            """
            assert msg.sender == tx.origin

            min_asymmetry: uint256 = self.min_asymmetries[_pool]

            if min_asymmetry > 0:
                registry: address = AddressProvider(ADDRESS_PROVIDER).get_registry()
                underlying_balances: uint256[8] = Registry(registry).get_underlying_balances(_pool)
                decimals: uint256[8] = Registry(registry).get_decimals(_pool)

                balances: uint256[MAX_COINS] = empty(uint256[MAX_COINS])
                # asymmetry = prod(x_i) / (sum(x_i) / N) ** N =
                # = prod( (N * x_i) / sum(x_j) )
                S: uint256 = 0
                N: uint256 = 0
                for i in range(MAX_COINS):
                    x: uint256 = underlying_balances[i]
                    if x == 0:
                        N = i
                        break
                    x *= 10 ** (18 - decimals[i])
                    balances[i] = x
                    S += x

                asymmetry: uint256 = N * 10 ** 18
                for i in range(MAX_COINS):
                    x: uint256 = balances[i]
                    if x == 0:
                        break
                    asymmetry = asymmetry * x / S

                assert asymmetry >= min_asymmetry, "Unsafe to apply"

            Curve(_pool).apply_new_parameters()  # dev: if implemented by the pool
        ```

    === "Example"
        ```shell
        >>> PoolProxy.apply_new_parameters(_pool: address):
        todo
        ```

### `revert_new_parameters`
!!! description "`PoolProxy.revert_new_parameters(_pool: address):`"

    Function to revert commited parameter changes to `_pool`.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_pool` |  `address` | Pool address|

    ??? quote "Source code"

        ```vyper hl_lines="11 21"
        interface Curve:
            def withdraw_admin_fees(): nonpayable
            def kill_me(): nonpayable
            def unkill_me(): nonpayable
            def commit_transfer_ownership(new_owner: address): nonpayable
            def apply_transfer_ownership(): nonpayable
            def accept_transfer_ownership(): nonpayable
            def revert_transfer_ownership(): nonpayable
            def commit_new_parameters(amplification: uint256, new_fee: uint256, new_admin_fee: uint256): nonpayable
            def apply_new_parameters(): nonpayable
            def revert_new_parameters(): nonpayable
            def commit_new_fee(new_fee: uint256, new_admin_fee: uint256): nonpayable
            def apply_new_fee(): nonpayable
            def ramp_A(_future_A: uint256, _future_time: uint256): nonpayable
            def stop_ramp_A(): nonpayable
            def set_aave_referral(referral_code: uint256): nonpayable
            def donate_admin_fees(): nonpayable

        @external
        @nonreentrant('lock')
        def revert_new_parameters(_pool: address):
            """
            @notice Revert comitted new parameters for `_pool` pool
            @param _pool Pool address
            """
            assert msg.sender in [self.ownership_admin, self.parameter_admin, self.emergency_admin], "Access denied"
            Curve(_pool).revert_new_parameters()  # dev: if implemented by the pool
        ```

    === "Example"
        ```shell
        >>> PoolProxy.revert_new_parameters(_pool: address):
        todo
        ```


### `commit_new_fee`
!!! description "`PoolProxy.commit_new_fee(_pool: address, new_fee: uint256, new_admin_fee: uint256):`"

    Function to commit new fee for pool (`_pool`), fee (`new_fee`) and admin fee (`new_admin_fee`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_pool` |  `address` | Pool address |
    | `new_fee` |  `utin256` | New fee |
    | `new_admin_fee` |  `uint256` | New admin fee |

    ??? quote "Source code"

        ```vyper hl_lines="12 21"
        interface Curve:
            def withdraw_admin_fees(): nonpayable
            def kill_me(): nonpayable
            def unkill_me(): nonpayable
            def commit_transfer_ownership(new_owner: address): nonpayable
            def apply_transfer_ownership(): nonpayable
            def accept_transfer_ownership(): nonpayable
            def revert_transfer_ownership(): nonpayable
            def commit_new_parameters(amplification: uint256, new_fee: uint256, new_admin_fee: uint256): nonpayable
            def apply_new_parameters(): nonpayable
            def revert_new_parameters(): nonpayable
            def commit_new_fee(new_fee: uint256, new_admin_fee: uint256): nonpayable
            def apply_new_fee(): nonpayable
            def ramp_A(_future_A: uint256, _future_time: uint256): nonpayable
            def stop_ramp_A(): nonpayable
            def set_aave_referral(referral_code: uint256): nonpayable
            def donate_admin_fees(): nonpayable

        @external
        @nonreentrant('lock')
        def commit_new_fee(_pool: address, new_fee: uint256, new_admin_fee: uint256):
            """
            @notice Commit new fees for `_pool` pool, fee: `new_fee` and admin fee: `new_admin_fee`
            @param _pool Pool address
            @param new_fee New fee
            @param new_admin_fee New admin fee
            """
            assert msg.sender == self.parameter_admin, "Access denied"
            Curve(_pool).commit_new_fee(new_fee, new_admin_fee)
        ```

    === "Example"
        ```shell
        >>> PoolProxy.commit_new_fee(todo):
        todo
        ```


### `apply_new_fee`
!!! description "`PoolProxy.apply_new_fee(_pool: address):`"

    Function to apply new fee to `_pool`.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_pool` |  `address` | Pool address |

    ??? quote "Source code"

        ```vyper hl_lines="13 21"
        interface Curve:
            def withdraw_admin_fees(): nonpayable
            def kill_me(): nonpayable
            def unkill_me(): nonpayable
            def commit_transfer_ownership(new_owner: address): nonpayable
            def apply_transfer_ownership(): nonpayable
            def accept_transfer_ownership(): nonpayable
            def revert_transfer_ownership(): nonpayable
            def commit_new_parameters(amplification: uint256, new_fee: uint256, new_admin_fee: uint256): nonpayable
            def apply_new_parameters(): nonpayable
            def revert_new_parameters(): nonpayable
            def commit_new_fee(new_fee: uint256, new_admin_fee: uint256): nonpayable
            def apply_new_fee(): nonpayable
            def ramp_A(_future_A: uint256, _future_time: uint256): nonpayable
            def stop_ramp_A(): nonpayable
            def set_aave_referral(referral_code: uint256): nonpayable
            def donate_admin_fees(): nonpayable

        @external
        @nonreentrant('lock')
        def apply_new_fee(_pool: address):
            """
            @notice Apply new fees for `_pool` pool
            @param _pool Pool address
            """
            Curve(_pool).apply_new_fee()
        ```

    === "Example"
        ```shell
        >>> PoolProxy.apply_new_fee(_pool: address):
        todo
        ```


### `ramp_A`
!!! description "`PoolProxy.ramp_A(_pool: address, _future_A: uint256, _future_time: uint256):`"

    Function to start gradually increasing A of `_pool` reaching `future_A` at `_future_time`.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_pool` |  `address` | Pool address |
    | `_future_A` |  `uint256` | Future amplification coefficient  |
    | `_future_time` |  `uint256` | Future time when A is fully ramped up |

    ??? quote "Source code"

        ```vyper hl_lines="14 21"
        interface Curve:
            def withdraw_admin_fees(): nonpayable
            def kill_me(): nonpayable
            def unkill_me(): nonpayable
            def commit_transfer_ownership(new_owner: address): nonpayable
            def apply_transfer_ownership(): nonpayable
            def accept_transfer_ownership(): nonpayable
            def revert_transfer_ownership(): nonpayable
            def commit_new_parameters(amplification: uint256, new_fee: uint256, new_admin_fee: uint256): nonpayable
            def apply_new_parameters(): nonpayable
            def revert_new_parameters(): nonpayable
            def commit_new_fee(new_fee: uint256, new_admin_fee: uint256): nonpayable
            def apply_new_fee(): nonpayable
            def ramp_A(_future_A: uint256, _future_time: uint256): nonpayable
            def stop_ramp_A(): nonpayable
            def set_aave_referral(referral_code: uint256): nonpayable
            def donate_admin_fees(): nonpayable

        @external
        @nonreentrant('lock')
        def ramp_A(_pool: address, _future_A: uint256, _future_time: uint256):
            """
            @notice Start gradually increasing A of `_pool` reaching `_future_A` at `_future_time` time
            @param _pool Pool address
            @param _future_A Future A
            @param _future_time Future time
            """
            assert msg.sender == self.parameter_admin, "Access denied"
            Curve(_pool).ramp_A(_future_A, _future_time)
        ```

    === "Example"
        ```shell
        >>> PoolProxy.ramp_A(_pool: address, _future_A: uint256, _future_time: uint256):
        todo
        ```


### `stop_ramp_A`
!!! description "`PoolProxy.stop_ramp_A(_pool: address):`"

    Function to stop gradually increasing A of `_pool`.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_pool` |  `address` | Pool address |

    ??? quote "Source code"

        ```vyper hl_lines="15 21"
        interface Curve:
            def withdraw_admin_fees(): nonpayable
            def kill_me(): nonpayable
            def unkill_me(): nonpayable
            def commit_transfer_ownership(new_owner: address): nonpayable
            def apply_transfer_ownership(): nonpayable
            def accept_transfer_ownership(): nonpayable
            def revert_transfer_ownership(): nonpayable
            def commit_new_parameters(amplification: uint256, new_fee: uint256, new_admin_fee: uint256): nonpayable
            def apply_new_parameters(): nonpayable
            def revert_new_parameters(): nonpayable
            def commit_new_fee(new_fee: uint256, new_admin_fee: uint256): nonpayable
            def apply_new_fee(): nonpayable
            def ramp_A(_future_A: uint256, _future_time: uint256): nonpayable
            def stop_ramp_A(): nonpayable
            def set_aave_referral(referral_code: uint256): nonpayable
            def donate_admin_fees(): nonpayable

        @external
        @nonreentrant('lock')
        def stop_ramp_A(_pool: address):
            """
            @notice Stop gradually increasing A of `_pool`
            @param _pool Pool address
            """
            assert msg.sender in [self.parameter_admin, self.emergency_admin], "Access denied"
            Curve(_pool).stop_ramp_A()
        ```

    === "Example"
        ```shell
        >>> PoolProxy.stop_ramp_A(todo):
        todo
        ```


### `min_asymmetries`



### `set_aave_referral`

## **Kill Pools**

### `kill_me`
!!! description "`PoolProxy.kill_me(_pool: address):`"

    Function to pause the pool `_pool`.

    !!!warning
        This function can only be called by the emergency admin!  
        While the pool is killed, only `remove_liquidity` is callable.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_pool` |  `address` | Pool address |

    ??? quote "Source code"

        === "PoolProxy.vy"

            ```vyper hl_lines="3 21"
            interface Curve:
                def withdraw_admin_fees(): nonpayable
                def kill_me(): nonpayable
                def unkill_me(): nonpayable
                def commit_transfer_ownership(new_owner: address): nonpayable
                def apply_transfer_ownership(): nonpayable
                def accept_transfer_ownership(): nonpayable
                def revert_transfer_ownership(): nonpayable
                def commit_new_parameters(amplification: uint256, new_fee: uint256, new_admin_fee: uint256): nonpayable
                def apply_new_parameters(): nonpayable
                def revert_new_parameters(): nonpayable
                def commit_new_fee(new_fee: uint256, new_admin_fee: uint256): nonpayable
                def apply_new_fee(): nonpayable
                def ramp_A(_future_A: uint256, _future_time: uint256): nonpayable
                def stop_ramp_A(): nonpayable
                def set_aave_referral(referral_code: uint256): nonpayable
                def donate_admin_fees(): nonpayable

            @external
            @nonreentrant('lock')
            def kill_me(_pool: address):
                """
                @notice Pause the pool `_pool` - only remove_liquidity will be callable
                @param _pool Pool address to pause
                """
                assert msg.sender == self.emergency_admin, "Access denied"
                Curve(_pool).kill_me()
            ```

        === "Pool.vy"

            ```vyper hl_lines="1 4"
            is_killed: bool

            @external
            def kill_me():
                assert msg.sender == self.owner  # dev: only owner
                assert self.kill_deadline > block.timestamp  # dev: deadline has passed
                self.is_killed = True
            ```

    === "Example"
        ```shell
        >>> PoolProxy.kill_me(todo):
        todo
        ```


### `unkill_me`
!!! description "`PoolProxy.unkill_me(_pool: address):`"

    Function to unpause the pool `_pool`, re-enabling all functionality.

    !!!note 
        This function can either be called by the emergency or ownership admin.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_pool` |  `address` | Pool address |

    ??? quote "Source code"

        === "PoolProxy.vy"

            ```vyper hl_lines="4 21"
            interface Curve:
                def withdraw_admin_fees(): nonpayable
                def kill_me(): nonpayable
                def unkill_me(): nonpayable
                def commit_transfer_ownership(new_owner: address): nonpayable
                def apply_transfer_ownership(): nonpayable
                def accept_transfer_ownership(): nonpayable
                def revert_transfer_ownership(): nonpayable
                def commit_new_parameters(amplification: uint256, new_fee: uint256, new_admin_fee: uint256): nonpayable
                def apply_new_parameters(): nonpayable
                def revert_new_parameters(): nonpayable
                def commit_new_fee(new_fee: uint256, new_admin_fee: uint256): nonpayable
                def apply_new_fee(): nonpayable
                def ramp_A(_future_A: uint256, _future_time: uint256): nonpayable
                def stop_ramp_A(): nonpayable
                def set_aave_referral(referral_code: uint256): nonpayable
                def donate_admin_fees(): nonpayable

            @external
            @nonreentrant('lock')
            def unkill_me(_pool: address):
                """
                @notice Unpause the pool `_pool`, re-enabling all functionality
                @param _pool Pool address to unpause
                """
                assert msg.sender == self.emergency_admin or msg.sender == self.ownership_admin, "Access denied"
                Curve(_pool).unkill_me()
            ```

        === "Pool.vy"

            ```vyper hl_lines="1 4"
            is_killed: bool

            @external
            def unkill_me():
                assert msg.sender == self.owner  # dev: only owner
                self.is_killed = False
            ```

    === "Example"
        ```shell
        >>> PoolProxy.unkill_me(_pool: address):
        todo
        ```