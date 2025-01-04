<h1>L2 Vault</h1>

The `Vault` is a simple smart contract designed to enable the DAO to manage chain-native assets and ERC-20 tokens across chains other than Ethereum.

!!!vyper "`Vault.vy`"
    The source code of the `Vault.vy` contract can be found on [GitHub :material-github:](https://github.com/curvefi/curve-xgov/blob/master/contracts/Vault.vy).

    A comprehensive list of all deployed contracts is available [here :material-arrow-up-right:](../../deployments/crosschain.md#curve-x-gov).

This contract is directly controlled by its `owner`, which is the `OwnershipAgent` of the respective chain.

---

## Transferring Assets

The contract features a transfer function that allows the `owner` to transfer tokens out of the Vault to a specified receiver address.

`transfer`
!!! description "`Vault.transfer(_token: address, _to: address, _value: uint256):`"

    !!!guard "Guarded Method"
        This function can only be called by the `owner` of the contract, which is the respective chain's `OwnershipAgent`.

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

        This example transfers 1 ARB token from the vault to `0x0000000000000000000000000000000000000000` on Arbitrum.

        ```shell
        >>> Vault.transfer('0x912CE59144191C1204E64559FE8253a0e49E6548', '0x0000000000000000000000000000000000000000', 1000000000000000000)
        ```

---

## Contract Ownership

Ownership of the Vault contract follows the classic model of contract ownership. It includes an `owner` address, which can be updated by first committing a future owner and then applying the changes. More on transfering ownership can be found [here](../../references/curve-practices.md#commit--apply).
