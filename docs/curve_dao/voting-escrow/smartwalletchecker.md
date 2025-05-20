The SmartWalletChecker is an external contract that checks if certain smart contracts are approved to lock CRV tokens into the VotingEscrow. **Permission can be granted via the `approveWallet` and revoked via `revokeWallet` methods.**

!!! deploy "Contract Source & Deployment"
    **SmartWalletChecker** contract is deployed to the Ethereum mainnet at: [0xca719728Ef172d0961768581fdF35CB116e0B7a4](https://etherscan.io/address/0xca719728Ef172d0961768581fdF35CB116e0B7a4).


This **contract can be replaced in its entirety** with a new SmartWalletChecker through the VotingEscrow's [**`commit_smart_wallet_checker`**](../voting-escrow/admin-controls.md#commit_smart_wallet_checker) function.

Once this happens, the previously approved smart contracts will **not be able to create a new lock, extend the lock duration, or add more CRV to the already existing lock** if the new `SmartWalletChecker` does not approve them again. This is because all those methods (`create_lock`, `increase_unlock_time`, and `increase_amount`) check if the caller is approved via the internal `assert_not_contract` function.

??? quote "VotingEscrow: Internal `assert_not_contract` function"
    ```vyper
    @internal
    def assert_not_contract(addr: address):
        """
        @notice Check if the call is from a whitelisted smart contract, revert if not
        @param addr Address to be checked
        """
        if addr != tx.origin:
            checker: address = self.smart_wallet_checker
            if checker != ZERO_ADDRESS:
                if SmartWalletChecker(checker).check(addr):
                    return
            raise "Smart contract depositors not allowed"
    ```

## **Approve/Revoke SmartContracts**

### `approveWallet`
!!! description "`SmartWalletChecker.approveWallet(address _wallet) public`"

    !!!guard "Guarded Method"
        This function is only callable by the `dao`, which is the `CurveOwnershipAdmin`.

    Function to approve a smart contract to lock CRV.

    Emits: `ApproveWallet`

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_wallet`     |  `address` | smart contract to approve |

    ??? quote "Source code"

        ```solidity
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

    !!!guard "Guarded Method"
        This function is only callable by the `dao`, which is the `CurveOwnershipAdmin`.

    Function to revoke the allowance of a smart contract to lock CRV.

    Emits: `RevokeWallet`

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_wallet`     |  `address` | smart contract to revoke |

    ??? quote "Source code"

        ```solidity
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
    | `_wallet`     |  `address` | smart contract address |

    ??? quote "Source code"

        ```solidity
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
        'true'
        ```


### `dao`
!!! description "`SmartWalletChecker.commit_smart_wallet_checker(addr: address):`"

    Getter for the dao of the contract. `dao` in this context is pretty much the admin/owner of the contract.

    Returns: CurveOwnershipAgent (`address`).

    ??? quote "Source code"

        ```solidity
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
