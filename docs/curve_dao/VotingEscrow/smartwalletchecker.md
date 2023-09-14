The SmartWalletChecker is an external contract which checks if certain smart contracts are approved to lock CRV tokens. Permission can be granted via `approveWallet` and revoked via `revokeWallet`.

!!! info
    The current SmartWalletChecker address has been deployed at [0xca719728Ef172d0961768581fdF35CB116e0B7a4](https://etherscan.io/address/0xca719728Ef172d0961768581fdF35CB116e0B7a4). This contract can be replaced entirely with a new SmartWalletChecker through the VotingEscrow's [`commit_smart_wallet_checker`](../VotingEscrow/admin_controls.md#commit_smart_wallet_checker) function. Alternatively, new smart contracts can be approved or revoked directly within the SmartWalletChecker itself. All these actions require a successful DAO vote.
    

## **Approve/Revoke Smart Contracts**

### `approveWallet`
!!! description "`SmartWalletChecker.approveWallet(address _wallet) public`"

    Function to approve a smart contract to lock CRV.

    Emits: `ApproveWallet`

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_wallet`     |  `address` | Smart Contract to approve |

    !!!note
        **`approveWallet`** can only be called by the **`dao`** of the contract.

    ??? quote "Source code"

        ```python hl_lines="1 3 7"
        event ApproveWallet(address)

        function approveWallet(address _wallet) public {
            require(msg.sender == dao, "!dao");
            wallets[_wallet] = true;
        
            emit ApproveWallet(_wallet);
        }
        ```

    === "Example"
        ```shell
        >>> SmartWalletChecker.approveWallet("smart contract address")
        ```


### `revokeWallet`
!!! description "`SmartWalletChecker.revokeWallet(address _wallet) external`"

    Function to revoke the allowance of a smart contract to lock CRV.

    Emits: `RevokeWallet`

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_wallet`     |  `address` | Smart Contract to revoke |

    !!!note
        **`revokeWallet`** can only be called by the **`dao`** of the contract.

    ??? quote "Source code"

        ```python hl_lines="1 3 7"
        event RevokeWallet(address)

        function revokeWallet(address _wallet) external {
            require(msg.sender == dao, "!dao");
            wallets[_wallet] = false;
                
            emit RevokeWallet(_wallet);
        }
        ```

    === "Example"
        ```shell
        >>> SmartWalletChecker.revokeWallet("0x52f541764E6e90eeBc5c21Ff570De0e2D63766B6")
        ```


## **Contract Info Methods**

### `check`
!!! description "`SmartWalletChecker.check(address _wallet) external view returns (bool)`"

    Function to check if a wallet has been approved.

    Returns: True or False (`bool`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_wallet`     |  `address` | Smart Contract Address |

    ??? quote "Source code"

        ```python hl_lines="1"
        function check(address _wallet) external view returns (bool) {
            bool _check = wallets[_wallet];
            if (_check) {
                return _check;
            } else {
                if (checker != address(0)) {
                    return SmartWalletChecker(checker).check(_wallet);
                }
            }
            return false;
        }
        ```

    === "Example"
        ```shell
        >>> SmartWalletChecker.check("0x989AEb4d175e16225E39E87d0D97A3360524AD80")
        'True'
        ```


### `dao`
!!! description "`SmartWalletChecker.commit_smart_wallet_checker(addr: address):`"

    Getter for the DAO (can be seen as admin) of the contract.

    Returns: CurveOwnershipAgent (`address`).

    ??? quote "Source code"

        ```python hl_lines="1 3 4"
        address public dao
        
        constructor(address _dao) public {
            dao = _dao;
            wallets[0xF147b8125d2ef93FB6965Db97D6746952a133934] = true;
            emit ApproveWallet(0xF147b8125d2ef93FB6965Db97D6746952a133934);
        }
        ```

    === "Example"
        ```shell
        >>> SmartWalletChecker.dao()
        '0x40907540d8a6C65c637785e8f8B742ae6b0b9968'
        ```