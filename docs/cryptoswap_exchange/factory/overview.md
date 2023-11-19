Every FactoryContract from Curve comes with built-in functions designed to feed the [MetaRegistry](../../registry/MetaRegistryAPI.md) with informations about the created pools. These functions will not be documented in this section. For more information, please read [here](../../registry/overview.md).


!!!deploy "Contract Source & Deployment"
    **CryptoSwap Factory** contract is deployed to the Ethereum mainnet at: [0xf18056bbd320e96a48e3fbf8bc061322531aac99](https://etherscan.io/address/0xf18056bbd320e96a48e3fbf8bc061322531aac99#code).


[Deployment API](../factory/deployer-api.md)


## **Fee Receiver**

All deployed pools share the same fee receiver. A new address can be set by calling the [**`set_fee_receiver()`**](../factory/admin-controls.md#set_fee_receiver) function.

### `fee_receiver`
!!! description "`Factory.fee_receiver() -> address: view`"

    Getter for the `fee_receiver` of the contract. This address is receiving the admin fees of all pools deployed through this Factory.

    Returns: fee receiver (`address`).

    ??? quote "Source code"

        ```vyper
        fee_receiver: public(address)

        @external
        def __init__(_fee_receiver: address, _admin: address):

            self.fee_receiver = _fee_receiver
            self.admin = _admin

            log UpdateFeeReceiver(empty(address), _fee_receiver)
            log TransferOwnership(empty(address), _admin)
        ```

    === "Example"
        ```shell
        >>> Factory.fee_receiver()
        '0xeCb456EA5365865EbAb8a2661B0c503410e9B347'
        ```



## **Implementations**

### `pool_implementations`
!!! description "`Factory.pool_implementations() -> address: view`"

    Getter for the pool implementation contract.

    Returns: pool implementation (`address`).

    ??? quote "Source code"

        ```vyper
        pool_implementation: public(address)
        ```

    === "Example"
        ```shell
        >>> Factory.pool_implementations()
        '0xa85461AFc2DEEC01bDA23b5cd267d51F765fba10'
        ```


### `token_implementation`
!!! description "`Factory.token_implementation() -> address: view`"

    Getter for the token implementation contract.

    Returns: token implementation (`address`).

    ??? quote "Source code"

        ```vyper
        token_implementation: public(address)
        ```

    === "Example"
        ```shell
        >>> Factory.token_implementation()
        '0xc08550A4cc5333f40e593eCc4C4724808085D304'
        ```


### `gauge_implementation`
!!! description "`Factory.gauge_implementation() -> address: view`"

    Getter for the gauge implementation contract.

    Returns: gauge implementation (`address`).

    ??? quote "Source code"

        ```vyper
        gauge_implementation: public(address)
        ```

    === "Example"
        ```shell
        >>> Factory.gauge_implementation()
        '0xdc892358d55d5Ae1Ec47a531130D62151EBA36E5'
        ```



## **Contract Ownership**

Admin is the owner of the contract and has exclusive possibility to call admin-only functions. Ownership can be transferred; for details, see [here](../factory/admin-controls.md).

### `admin`
!!! description "`Factory.admin() -> address: view`"

    Getter for the `admin` of the contract.

    Returns: admin (`address`).

    ??? quote "Source code"

        ```vyper hl_lines"1"
        admin: public(address)

        @external
        def __init__(_fee_receiver: address, _admin: address):

            self.fee_receiver = _fee_receiver
            self.admin = _admin

            log UpdateFeeReceiver(empty(address), _fee_receiver)
            log TransferOwnership(empty(address), _admin)
        ```

    === "Example"
        ```shell
        >>> Factory.admin()
        '0x40907540d8a6C65c637785e8f8B742ae6b0b9968'
        ```


### `future_admin`
!!! description "`Factory.future_admin() -> address: view`"

    Getter for the `future_admin` of the contract.

    Returns: future admin (`address`).

    ??? quote "Source code"

        ```vyper hl_lines"1"
        admin: public(address)

        @external
        def __init__(_fee_receiver: address, _admin: address):

            self.fee_receiver = _fee_receiver
            self.admin = _admin

            log UpdateFeeReceiver(empty(address), _fee_receiver)
            log TransferOwnership(empty(address), _admin)
        ```

    === "Example"
        ```shell
        >>> Factory.future_admin()
        '0x40907540d8a6C65c637785e8f8B742ae6b0b9968'
        ```