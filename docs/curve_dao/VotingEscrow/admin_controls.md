The *CurveOwnershipAgent* is the current admin of the VotingEscrow. As such, a change to these parameters would require a successfully passed DAO vote.


## **Change SmartWalletChecker**

### `commit_smart_wallet_checker`
!!! description "`VotingEscrow.commit_smart_wallet_checker(addr: address):`"

    !!!guard "Guarded Method"
        This function is only callable by the `admin` of the contract.

    Function to commit a new smart wallet checker contract address to `addr`. Changes can be applied via [`apply_smart_contract_wallet`](#apply_smart_wallet_checker).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `addr`     |  `address` | New SmartWalletChecker Contract Address |

    ??? quote "Source code"

        ```python hl_lines="2"
        @external
        def commit_smart_wallet_checker(addr: address):
            """
            @notice Set an external contract to check for approved smart contract wallets
            @param addr Address of Smart contract checker
            """
            assert msg.sender == self.admin
            self.future_smart_wallet_checker = addr  
        ```

    === "Example"
        ```shell
        >>> VotingEscrow.commit_smart_wallet_checker("new SmartWalletChecker contract")
        ```


### `apply_smart_wallet_checker`
!!! description "`VotingEscrow.apply_smart_wallet_checker():`"

    !!!guard "Guarded Method"
        This function is only callable by the `admin` of the contract.

    Function to apply the new SmartWalletChecker address.

    ??? quote "Source code"

        ```python hl_lines="2"
        @external
        def apply_smart_wallet_checker():
            """
            @notice Apply setting external contract to check approved smart contract wallets
            """
            assert msg.sender == self.admin
            self.smart_wallet_checker = self.future_smart_wallet_checker
        ```

    === "Example"
        ```shell
        >>> VotingEscrow.apply_smart_wallet_checker():
        ```



## **Admin Ownership**

### `commit_transfer_ownership`
!!! description "`VotingEscrow.commit_transfer_ownership(addr: address):`"

    !!!guard "Guarded Method"
        This function is only callable by the `admin` of the contract.

    Function to commit the ownership of the contract to `addr`. Changes need to be applied via [`apply_transfer_ownership`](#apply_transfer_ownership)

    Emits: `CommitOwnership`

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `addr`       |  `address` | Address |

    ??? quote "Source code"

        ```python hl_lines="1 8 15"
        event CommitOwnership:
            admin: address

        admin: public(address)  # Can and will be a smart contract
        future_admin: public(address)

        @external
        def commit_transfer_ownership(addr: address):
            """
            @notice Transfer ownership of VotingEscrow contract to `addr`
            @param addr Address to have ownership transferred to
            """
            assert msg.sender == self.admin  # dev: admin only
            self.future_admin = addr
            log CommitOwnership(addr)   
        ```

    === "Example"
        ```shell
        >>> VotingEscrow.commit_transfer_ownership("0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"):
        ```


### `apply_transfer_ownership`
!!! description "`VotingEscrow.apply_transfer_ownership():`"

    !!!guard "Guarded Method"
        This function is only callable by the `admin` of the contract.

    Function to apply the new ownership.

    Emits: `ApplyOwnership`

    ??? quote "Source code"

        ```python hl_lines="1 8 10 16"
        event ApplyOwnership:
            admin: address

        admin: public(address)  # Can and will be a smart contract
        future_admin: public(address)

        @external
        def apply_transfer_ownership():
            """
            @notice Apply ownership transfer
            """
            assert msg.sender == self.admin  # dev: admin only
            _admin: address = self.future_admin
            assert _admin != ZERO_ADDRESS  # dev: admin not set
            self.admin = _admin
            log ApplyOwnership(_admin)  
        ```


    === "Example"
        ```shell
        >>> VotingEscrow.apply_transfer_ownership():
        ```