l2 vault is a contract that holds the chains native assets and ERC20s. The contracts are owned by the ownership agents on the according chain.

Additionally, this contract allows to transfer asset.

`transfer`
!!! description "`L2-Vault.transfer(_token: address, _to: address, _value: uint256):`"

    !!!guard "Guarded Method"
        This function is only callable by the `owner`, which is the L2 Ownership Agent.

    Function to transfer assets.

    | Input     | Type       | Description                  |
    | --------- | ---------- | ---------------------------- |
    | `_token`  |  `address` | token to transfer            |
    | `_to`     |  `address` | destination of the asset     |
    | `_value`  |  `uint256` | amount of assets to transfer |

    ??? quote "Source code"

        ```vyper
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
        >>> L2-Vault.transfer(todo)
        'todo'
        ```



## **Contract Ownership**

Ownership of the vault contract resembles the classic model of contract ownership. There is an `owner` address, which can be changed by first committing a future owner and then applying the new owner address.

`owner`
`future_owner`
`commit_future_owner`
`apply_future_owner`