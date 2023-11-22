The StableSwapNG-Factory serves as a permissionless pool deployer and registry. For further information regarding the registry, please refer to this [section](../../registry/overview.md).

!!!deploy "Contract Source & Deployment"
    **Stableswap-NG Factory** contract is deployed to the Ethereum mainnet at: [0x6A8cbed756804B16E05E741eDaBd5cB544AE21bf](https://etherscan.io/address/0x6A8cbed756804B16E05E741eDaBd5cB544AE21bf#code).
    Source code available on [Github](https://github.com/curvefi/stableswap-ng/blob/bff1522b30819b7b240af17ccfb72b0effbf6c47/contracts/main/CurveStableSwapFactoryNG.vy).  
    A list of all deployments can be found [here](../../references/deployed-contracts.md#stableswap-ng).


## **Fee Receiver**

All deployed pools share the same fee receiver. A new address can be designated by using the [`set_fee_receiver`](../factory/admin_controls.md#set_fee_receiver) function.

### `fee_receiver`
!!! description "`Factory.fee_receiver() -> address: view`"

    Getter for the fee receiver of the pools admin fees.

    Returns: fee receiver (`address`).

    ??? quote "Source code"

        ```vyper
        # fee receiver for all pools
        fee_receiver: public(address)
        ```

    === "Example"

        ```shell
        >>> Factory.fee_receiver()
        '0xeCb456EA5365865EbAb8a2661B0c503410e9B347'
        ```


## **Asset Types**

A pool can contain different asset types. All avalaible types can be queried with the following getter method: 

### `asset_types`
!!! description "`Factory.asset_types(arg0: uint8) -> String[20]`"

    Getter for the asset types.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `arg0` |  `uint8` | index value of the asset type |


    ??? quote "Source code"

        ```vyper
        asset_types: public(HashMap[uint8, String[20]])
        ```

    === "Example"

        ```shell
        >>> Factory.asset_types(2)
        'Rebasing'    
        ```


## **Implementations**

Pools and gauges are created through blueprint contracts based on the implementation chosen during deployment.

Additionally, there are utility contracts for Math  (`math_implementation`) and Views (`views_implementation`).


### `pool_implementations`
!!! description "`Factory.pool_implementations(arg0: uint256) -> address: view`"

    Getter for the pool implementations. There might be multiple pool implementations base on various circumstances. 

    Returns: implementation (`address`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `arg0` |  `uint256` | index value of the implementation |

    ??? quote "Source code"

        ```vyper
        # index -> implementation address
        pool_implementations: public(HashMap[uint256, address])
        ```

    === "Example"

        ```shell
        >>> Factory.pool_implementation(0)
        '0x3E3B5F27bbf5CC967E074b70E9f4046e31663181'
        ```


### `metapool_implementations`
!!! description "`Factory.metapool_implementations(arg0: uint256) -> address: view`"

    Getter for the pool implementations. There might be multiple metapool implementations base on various circumstances. 


    Returns: implementation (`address`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `arg0` |  `uint256` | index value of the implementation |

    ??? quote "Source code"

        ```vyper
        # index -> implementation address
        metapool_implementations: public(HashMap[uint256, address])
        ```

    === "Example"

        ```shell
        >>> Factory.metapool_implementation(0)
        '0x19bd1AB34d6ABB584b9C1D5519093bfAA7f6c7d2'
        ```


### `math_implementations`
!!! description "`Factory.math_implementations() -> address: view`"

    Getter for the math implementations.

    Returns: implementation (`address`).

    ??? quote "Source code"

        ```vyper
        # index -> implementation address
        math_implementation: public(address)
        ```

    === "Example"

        ```shell
        >>> Factory.math_implementation()
        '0x20D1c021525C85D9617Ccc64D8f547d5f730118A'
        ```


### `gauge_implementations`
!!! description "`Factory.gauge_implementations() -> address: view`"

    Getter for the gauge implementations.

    Returns: implementation (`address`).

    ??? quote "Source code"

        ```vyper
        # index -> implementation address
        gauge_implementation: public(address)
        ```

    === "Example"

        ```shell
        >>> Factory.gauge_implementation()
        '0xF5617D4f7514bE35fce829a1C19AE7f6c9106979'
        ```


### `views_implementation`
!!! description "`Factory.views_implementations() -> address: view`"

    Getter for the views implementations.

    Returns: implementation (`address`).

    ??? quote "Source code"

        ```vyper
        # index -> implementation address
        views_implementation: public(address)
        ```

    === "Example"

        ```shell
        >>> Factory.views_implementation()
       '0x87DD13Dd25a1DBde0E1EdcF5B8Fa6cfff7eABCaD' 
        ```



## **Ownership**

`Admin` is the owner of the contract and has exclusive possibility to call admin-only functions. Ownership can be transferred; for details, see [here](../factory/admin_controls.md#commit_transfer_ownership).

### `admin`
!!! description "`Factory.admin() -> address: view`"

    Getter for the admin.

    Returns: 

    ??? quote "Source code"

        ```vyper
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

        ```vyper
        future_admin: public(address)
        ```

    === "Example"

        ```shell
        >>> Factory.future_admin()
        ```