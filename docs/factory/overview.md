<h1> Pool Factory Overview </h1>

Curve Pool Factories allow the **permissionless deployment of liquidity pools, gauges, and LP tokens**.

!!!deploy "Contract Source & Deployment"
    Factories are deployed on the Ethereum Mainnet as well as on Sidechains/L2.  
    A list of all deployed contracts can be found [here](../references/deployed-contracts.md#pool-factory).

Every Factory contract from Curve comes with built-in functions designed to feed the [MetaRegistry](../../registry/MetaRegistryAPI.md) with informations about the created pools. These functions will not be documented in this section. For more information, please read [here](../../registry/overview.md).

!!!warning
    The methods below might slightly vary depending on the Factory contract being examined. If there are any abnormalities or important standouts, they will be detailed as accurately as possible within the appropriate section!



## **How are contracts deployed?**

Pool, gauge, or LP token contracts are created according to their implementation contracts set within the Factory contract. Contracts deployed by newer factories combine both liquidity pool and LP token, whereas for older ones, they are separate contracts.

*There are two ways the contracts are deployed:*


### **`create_forwarder_to`**
Earlier factories like the regular [stableswap](./stableswap/deployer-api.md) or [cryptoswap](./cryptoswap/deployer-api.md) one use Vyper's built-in [**`create_forwarder_to()`**](https://docs.vyperlang.org/en/stable/built-in-functions.html?highlight=create_forwarder_to#chain-interaction) function (renamed to **`create_minimal_proxy_to`** starting from Vyper version 0.3.4) to deploy liquidity pools, LP tokens, or gauge contracts.

The contracts then need to be initialized, which is done automatically.


### **`Blueprint Contracts`**
Newer factories make use of blueprints ([EIP-5202](https://eips.ethereum.org/EIPS/eip-5202)). The contracts are directly created from their corresponding blueprint implementations. This is the most desired and used method for all newly deployed factories.



## **Fee Receiver**
The fee receiver is set within the Factory. All pools deployed from a Factory share the same fee receiver address. The address can be changed by the **`admin`** of the contract by calling the [**`set_fee_receiver`**](#set_fee_receiver) method and setting a new address.


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


### `set_fee_receiver`
!!! description "`Factory.set_fee_receiver(_pool: address, _fee_receiver: address)`"

    !!!guard "Guarded Method"
        This function is only callable by the `admin` of the contract.

    Function to set a new fee receiver.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_pool` |  `address` | this variable has no use; insert a random address, otherwise the tx will fail. |
    | `_fee_receiver` |  `address` | address of the new fee receiver |


    ??? quote "Source code"

        ```vyper
        # fee receiver for all pools
        fee_receiver: public(address)

        @external
        def set_fee_receiver(_pool: address, _fee_receiver: address):
            """
            @notice Set fee receiver for all pools
            @param _pool Address of  pool to set fee receiver for.
            @param _fee_receiver Address that fees are sent to
            """
            assert msg.sender == self.admin  # dev: admin only
            self.fee_receiver = _fee_receiver
        ```

    === "Example"

        ```shell
        >>> Factory.set_fee_receiver('0x0000000000000000000000000000000000000000')    
        ```


## **Implementations**
Technical documentation was done separately for each factory, as they partially vary from each other. Please refer to the corresponding section.

!!!note
    **Implementation contracts are upgradable.** They can either be replaced or additional implementation contracts can be added. Therefore, please always make sure to check the most recent ones.


## **Factory Contract Ownership**
The **`admin`** is the owner of the Factory contract and has the ability to call admin-only functions. Ownership can be transferred by first committing to the transfer of ownership (**`commit_transfer_ownership`**), which then needs to be accepted by the **`future_admin`** (**`accept_transfer_ownership`**). 

Most contracts are 'owned' by a proxy, which in turn is owned by the DAO. For some factories, the DAO is directly the owner.


### `admin`
!!! description "`Factory.admin() -> address: view`"

    Getter for the admin of the Factory.

    Returns: admin (`address`).

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


### `commit_transfer_ownership`
!!! description "`Factory.commit_transfer_ownership(_addr: address):`"

    !!!guard "Guarded Method"
        This function is only callable by the `admin` of the contract.

    Function to commit a transfer of ownership. This function sets `_addr` as the future admin of the contract. These changes need to be applied via `accept_transfer_ownership` by the future admin itself.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_addr` |  `address` | address of the future admin |

    ??? quote "Source code"

        ```vyper
        admin: public(address)
        future_admin: public(address)

        @external
        def commit_transfer_ownership(_addr: address):
            """
            @notice Transfer ownership of this contract to `addr`
            @param _addr Address of the new owner
            """
            assert msg.sender == self.admin  # dev: admin only
            self.future_admin = _addr
        ```

    === "Example"

        ```shell
        >>> Factory.commit_transfer_ownership("whatever")
        ```


### `accept_transfer_ownership`
!!! description "`Factory.accept_transfer_ownership():`"

    !!!guard "Guarded Method"
        This function is only callable by the `future_admin` of the contract.

    Function to accept the ownership transfer.

    ??? quote "Source code"

        ```vyper
        admin: public(address)
        future_admin: public(address)

        @external
        def accept_transfer_ownership():
            """
            @notice Accept a pending ownership transfer
            @dev Only callable by the new owner
            """
            _admin: address = self.future_admin
            assert msg.sender == _admin  # dev: future admin only

            self.admin = _admin
            self.future_admin = empty(address)
        ```

    === "Example"

        ```shell
        >>> Factory.accept_transfer_ownership()
        ```

