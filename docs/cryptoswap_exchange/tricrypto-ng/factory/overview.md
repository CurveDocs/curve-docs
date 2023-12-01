Every FactoryContract from Curve comes with built-in functions designed to feed the [MetaRegistry](../../registry/MetaRegistryAPI.md) with informations about the created pools. These functions will not be documented in this section. For more information, please read [here](../../registry/overview.md).

!!! note
    The TricryptoFactory contract is deployed to the Ethereum mainnet at: [0x0c0e5f2fF0ff18a3be9b835635039256dC4B4963](https://etherscan.io/address/0x0c0e5f2fF0ff18a3be9b835635039256dC4B4963).
    Source code for this contract is available on [Github](https://github.com/curvefi/tricrypto-ng/blob/main/contracts/main/CurveTricryptoFactory.vy). 


Created pools contain a ERC20 implementation. Pool and Token share the same contract.


## **Admin Controls**
The contract contains the typical admin controls. Ownership can be transferred, and fee receivers can be changed.

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


### `fee_receiver`
!!! description "`Factory.fee_receiver() -> address: view`"

    Getter for the `fee_receiver` of the contract. This address is receiving the admin fees of all pools deployed through this contract when calling `claim_admin_fees()`.

    Returns: fee receiver (`address`).

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
