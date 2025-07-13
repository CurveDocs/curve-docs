<h1>Smart Wallet Checker</h1>



???+ vyper "`SmartWalletWhitelist.vy`"
    The source code for the `SmartWalletWhitelist.vy` contract is available on [Etherscan](https://etherscan.io/address/0x9F9D3Ed278A018DB1Fc3aDe5D15A76BF5f672fdF#code). The contract is written in [Vyper](https://vyperlang.org/) version `0.4.1`.

    The `VotingEscrow` on :logos-ethereum: Ethereum is deployed at [`0x5f3b5DfEb7B28CDbD7FAba78963EE202a494e2A2`](https://etherscan.io/address/0x5f3b5DfEb7B28CDbD7FAba78963EE202a494e2A2).

    ??? abi "Contract ABI"

        ```json
        [{"inputs":[{"name":"_wallet","type":"address"}],"name":"check","outputs":[{"name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"outputs":[],"stateMutability":"nonpayable","type":"constructor"}]
        ```

### `check`
!!! description "`SmartWalletWhitelist.check(_wallet: address) -> bool`"

    Dummy function for compatibility regarding contracts locking CRV tokens as veCRV. This function always returns `True`, therefore allows every address (EOA's and contracts) to allow locking CRV.

    | Input     | Type      | Description    |
    | --------- | --------- | -------------- |
    | `_wallet` | `address` | Wallet address |

    ??? quote "Source code"

        === "SmartWalletWhitelist.vy"

            ```python
            @view
            @external
            def check(_wallet: address) -> bool:
                return True
            ```

    === "Example"

        ```shell
        >>> VotingEscrow.check("0x7a16fF8270133F063aAb6C9977183D9e72835428")
        'True'
        ```