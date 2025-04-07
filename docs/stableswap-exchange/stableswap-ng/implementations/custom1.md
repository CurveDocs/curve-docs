---
hide_feature_button: true
---

<h1>Plain and Meta-Pool Implementation with Custom Admin Controls</h1>

This implementation enables **arbitrary assignment of an `admin` and `admin_fee`** for a specific pool. The `Factory.admin()` is, and will always remain, one of the pool’s owners—ensuring full control via the DAO.

!!!vyper "Contract Implementations"
    The source code for the implementation can be found on GitHub in the [admin-implementation branch](https://github.com/curvefi/stableswap-ng/tree/admin-implementation). This implementation is initially used by CrossCurve on Sonic.

    The implementations were added to the StableSwapFactory on Sonic via Vote ID #1010 and are deployed at `index = 710420`.

    ```py
    >>> Factory.metapool_implementations(710420)
    '0x8663426e8713922D81e44d73295759e74Afc230F'

    >>> Factory.pool_implementations(710420)
    '0xA7c2DD4356168153792EF05D27922064b3c71A26'
    ```


The implementation introduces the ability to designate an additional admin with the following permissions:

- The admin has the authority to set the contract’s admin fee, which can range from 0% to 100%. Previously, this fee was hardcoded at 50%.
- Once an `admin` is set, their address replaces the `fee_receiver` and starts receiving all pool admin fees. If no admin is set, the `fee_receiver` remains the default recipient.

At contract initialization, the admin is set to `ZERO_ADDRESS`. This means assigning a new admin requires a DAO vote via the `set_admin` function. The `admin_fee` defaults to 50% but can be updated later.

---

### `admin`
!!! description "`CurveStableSwap.admin() -> address: view`"

    Getter for the admin of the contract. At contract initialization, the address of the admin is always set to `ZERO_ADDRESS`.

    Returns: admin of the contract (`address`).

    ??? quote "Source code"

        === "CurveStableSwap.vy"

            ```python
            @external
            def __init__(
                ...
            ):

                ...
                self.admin = empty(address)
                ...

            admin: public(address)
            ```

    === "Example"

        This example returns the current admin of the contract.

        ```shell
        >>> CurveStableSwap.admin()
        '0x0000000000000000000000000000000000000000'
        ```


### `set_admin`
!!! description "`CurveStableSwap.set_admin(_new_admin: address)`"

    !!!guard "Guarded Method"
        This function is only callable by the `admin` of the `Factory`.

    Function to set the admin of the contract. Setting the admin will revert if its not called by the admin of the `Factory`.

    Emits: `SetAdmin` event.

    | Input        | Type      | Description        |
    | ------------ | --------- | ------------------ |
    | `_new_admin` | `address` | New admin address. |

    ??? quote "Source code"

        === "CurveStableSwap.vy"

            ```python
            interface Factory:
                def fee_receiver() -> address: view

            event SetAdmin:
                admin: address

            admin: public(address)

            @external
            def set_admin(_new_admin: address):
                assert msg.sender == factory.admin()  # dev: only owner

                self.admin = _new_admin
                log SetAdmin(_new_admin)
            
            @view
            @internal
            def _check_admins():
                assert msg.sender == factory.admin() or msg.sender == self.admin  # dev: only admin
            ```

    === "Example"

        This example sets the admin of the contract.

        ```shell
        >>> CurveStableSwap.admin()
        '0x0000000000000000000000000000000000000000'

        >>> CurveStableSwap.set_admin('0x7a16ff8270133f063aab6c9977183d9e72835428')

        >>> CurveStableSwap.admin()
        '0x7a16ff8270133f063aab6c9977183d9e72835428'
        ```

---

### `admin_fee`
!!! description "`CurveStableSwap.admin_fee() -> uint256: view`"

    Getter for the admin fee of the pool. At contract initialization, the admin fee is set to 50%.

    Returns: admin fee (`uint256`).

    ??? quote "Source code"

        === "CurveStableSwap.vy"

            ```python
            @external
            def __init__(
                ...
            ):

                ...
                self.admin_fee = 5000000000
                ...

            admin_fee: public(uint256)
            ```

    === "Example"

        This example returns the current admin fee of the contract.

        ```shell
        >>> CurveStableSwap.admin()
        '0x0000000000000000000000000000000000000000'
        ```


### `set_new_admin_fee`
!!! description "`CurveStableSwap.set_new_admin_fee(_new_admin_fee: uint256):`"

    !!!guard "Guarded Method"
        This function is only callable by the `admin` of the `Pool` or the `Factory`.

    Function to set the admin fee of the pool. 

    Emits: `SetAdmin` event.

    | Input        | Type      | Description        |
    | ------------ | --------- | ------------------ |
    | `_new_admin_fee` | `uint256` | New admin fee value. |

    ??? quote "Source code"

        === "CurveStableSwap.vy"

            ```python
            interface Factory:
                def fee_receiver() -> address: view

            event ApplyNewAdminFee:
                admin_fee: uint256

            admin_fee: public(uint256)

            FEE_DENOMINATOR: constant(uint256) = 10 ** 10

            @external
            def set_new_admin_fee(_new_admin_fee: uint256):
                self._check_admins()
                # FEE_DENOMINATOR = 1 = 100%
                assert _new_admin_fee <= FEE_DENOMINATOR  # dev: more than 100%

                self.admin_fee = _new_admin_fee
                log ApplyNewAdminFee(_new_admin_fee)

            @view
            @internal
            def _check_admins():
                assert msg.sender == factory.admin() or msg.sender == self.admin  # dev: only admin
            ```

    === "Example"

        This example sets the admin of the contract.

        ```shell
        >>> StableSwapNG.admin_fee()
        5000000000

        >>> StableSwapNG.set_new_admin_fee(0)

        >>> StableSwapNG.admin_fee()
        0
        ```
