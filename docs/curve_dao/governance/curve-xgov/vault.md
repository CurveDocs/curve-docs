<h1>L2 Vault</h1>


The `Vault` contract is a straightforward smart contract designed to enable the DAO to **manage chain-native assets and ERC-20 tokens** across blockchains other than Ethereum.

This contract is directly controlled by the `owner`, which is the ownership agent ([more here](./agents.md)) of the respective chain.


---


## **Transferring Assets**

The contract features a simple **transfer function** that allows the owner to transfer tokens out of the Vault.


`transfer`
!!! description "`Vault.transfer(_token: address, _to: address, _value: uint256):`"

    !!!guard "Guarded Method"
        This function can only be called by the `owner` of the contract, which is the L2 Ownership Agent.

    Function to transfer a specific amount of tokens from the vault to another address. 

    | Input     | Type       | Description                  |
    | --------- | ---------- | ---------------------------- |
    | `_token`  |  `address` | Token to transfer            |
    | `_to`     |  `address` | Destination of the asset     |
    | `_value`  |  `uint256` | Amount of assets to transfer |

    ??? quote "Source code"

        === "Vault.vy"

            ```vyper
            NATIVE: constant(address) = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE

            owner: public(address)

            @external
            def transfer(_token: address, _to: address, _value: uint256):
                """
                @notice Transfer an asset
                @param _token The token to transfer, or NATIVE if transferring the chain native asset
                @param _to The destination of the asset
                @param _value The amount of the asset to transfer
                """
                assert msg.sender == self.owner

                if _token == NATIVE:
                    send(_to, _value)
                else:
                    assert ERC20(_token).transfer(_to, _value, default_return_value=True)
            ```

    === "Example"
        ```shell
        >>> Vault.transfer('0x912CE59144191C1204E64559FE8253a0e49E6548', '0x0000000000000000000000000000000000000000', 1000000000000000000)
        ```


---


## **Contract Ownership**

Ownership of the Vault contract follows the classic model of contract ownership. It includes an `owner` address, which can be updated by first committing a future owner and then applying the changes.

!!!notebook "Jupyter Notebook"
    For a basic demonstration of how to change the ownership of the Vault, please refer to the following example: https://try.vyperlang.org/hub/user-redirect/lab/tree/shared/mo-anon/basic/ownership.ipynb
