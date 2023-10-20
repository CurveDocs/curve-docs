The StableSwapNG-Factory serves as a permissionless pool deployer and registry. For further information regarding the registry, please refer to this [section](../../registry/overview.md)


## **Fee Receiver**

All deployed pools share the same fee receiver. A new address can be designated by using the [`set_fee_receiver`](../factory/admin_controls.md#set_fee_receiver) function.

### `fee_receiver`
!!! description "`Factory.fee_receiver() -> address: view`"

    Getter for the fee receiver of the pools admin fees.

    Returns: fee receiver (`address`).

    ??? quote "Source code"

        ```python
        # fee receiver for all pools
        fee_receiver: public(address)
        ```

    === "Example"

        ```shell
        >>> Factory.fee_receiver()
        '0xecb456EA5365865EbAb8a2661B0c503410e9B347'
        ```

## **Implemetations**

Pools and gauges are created through blueprint contracts based on the implementation chosen during deployment.

Additionally, there are utility contracts for Math  (`math_implementations`) and Views (`views_implementation`).


### `pool_implementations`
!!! description "`Factory.pool_implementations(arg0: uint256) -> address: view`"

    Getter for the pool implementations.

    Returns: implementation (`address`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `arg0` |  `uint256` | index value of the implementation |

    ??? quote "Source code"

        ```python
        # index -> implementation address
        pool_implementations: public(HashMap[uint256, address])
        ```

    === "Example"

        ```shell
        >>> Factory.pool_implementation("todo")
        ```


### `metapool_implementations`
!!! description "`Factory.metapool_implementations(arg0: uint256) -> address: view`"

    Getter for the pool implementations.

    Returns: implementation (`address`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `arg0` |  `uint256` | index value of the implementation |

    ??? quote "Source code"

        ```python
        # index -> implementation address
        metapool_implementations: public(HashMap[uint256, address])
        ```

    === "Example"

        ```shell
        >>> Factory.metapool_implementation("todo")
        ```


### `math_implementations`
!!! description "`Factory.math_implementations() -> address: view`"

    Getter for the math implementations.

    Returns: implementation (`address`).

    ??? quote "Source code"

        ```python
        # index -> implementation address
        math_implementation: public(address)
        ```

    === "Example"

        ```shell
        >>> Factory.math_implementation()
        ```


### `gauge_implementations`
!!! description "`Factory.gauge_implementations() -> address: view`"

    Getter for the gauge implementations.

    Returns: implementation (`address`).

    ??? quote "Source code"

        ```python
        # index -> implementation address
        gauge_implementation: public(address)
        ```

    === "Example"

        ```shell
        >>> Factory.gauge_implementation()
        ```


### `views_implementation`
!!! description "`Factory.views_implementations() -> address: view`"

    Getter for the views implementations.

    Returns: implementation (`address`).

    ??? quote "Source code"

        ```python
        # index -> implementation address
        views_implementation: public(address)
        ```

    === "Example"

        ```shell
        >>> Factory.views_implementation()
        ```



## **Ownership**

Ownership of the contract can be transfered - see [here](../factory/admin_controls.md#commit_transfer_ownership)

### `admin`
!!! description "`Factory.admin() -> address: view`"

    Getter for the admin.

    Returns: 

    ??? quote "Source code"

        ```python
        admin: public(address)
        ```

    === "Example"

        ```shell
        >>> Factory.admin()

        ```

### `future_admin`
!!! description "`Factory.future_admin() -> address: view`"

    Getter for the future admin.

    Returns: future admin (`address`).

    ??? quote "Source code"

        ```python
        future_admin: public(address)
        ```

    === "Example"

        ```shell
        >>> Factory.future_admin()
        ```