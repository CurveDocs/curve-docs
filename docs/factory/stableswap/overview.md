Every FactoryContract from Curve comes with built-in functions designed to feed the [MetaRegistry](../../registry/MetaRegistryAPI.md) with informations about the created pools. These functions will not be documented in this section. For more information, please read [here](../../registry/overview.md).


!!!deploy "Contract Source & Deployment"
    **Metapool Factory** contract is deployed to the Ethereum mainnet at: [0xb9fc157394af804a3578134a6585c0dc9cc990d4](https://etherscan.io/address/0xb9fc157394af804a3578134a6585c0dc9cc990d4#code).


[Deployment API](./deployer-api.md)


## **Fee Receiver**  

All deployed pools share the same fee receiver. A new address can be designated by using the [**`set_fee_receiver`**](./admin-controls.md#set-fee-receiver) function.

### `fee_receiver`
!!! description "`Factory.fee_receiver() -> address: view`"

    Getter for the `fee_receiver` of the contract. This address is receiving the admin fees of all pools deployed through this Factory.

    Returns: fee receiver (`address`).

    ??? quote "Source code"

        ```vyper
        # fee receiver for plain pools
        fee_receiver: address

        @external
        def __init__(_fee_receiver: address):
            self.admin = msg.sender
            self.manager = msg.sender
            self.fee_receiver = _fee_receiver
        ```

    === "Example"
        ```shell
        >>> Factory.fee_receiver()
        '0xeCb456EA5365865EbAb8a2661B0c503410e9B347'
        ```


## **Implementations**

[Implementations](./implementations.md)


## **Contract Ownership**

Admin is the owner of the contract and has exclusive possibility to call admin-only functions. Ownership can be transferred; for details, see [here](./admin-controls.md#transfer-contract-ownership).

### `admin`
!!! description "`Factory.admin() -> address: view`"

    Getter for the `admin` of the contract.

    Returns: admin (`address`).

    ??? quote "Source code"

        ```vyper
        admin: public(address)

        @external
        def __init__(_fee_receiver: address):
            self.admin = msg.sender
            self.manager = msg.sender
            self.fee_receiver = _fee_receiver
        ```

    === "Example"
        ```shell
        >>> Factory.admin()
        '0x742C3cF9Af45f91B109a81EfEaf11535ECDe9571'
        ```


### `future_admin`
!!! description "`Factory.future_admin() -> address: view`"

    Getter for the `future_admin` of the contract.

    Returns: future admin (`address`).

    ??? quote "Source code"

        ```vyper
        admin: public(address)

        @external
        def __init__(_fee_receiver: address):
            self.admin = msg.sender
            self.manager = msg.sender
            self.fee_receiver = _fee_receiver
        ```

    === "Example"
        ```shell
        >>> Factory.future_admin()
        '0x0000000000000000000000000000000000000000'
        ```