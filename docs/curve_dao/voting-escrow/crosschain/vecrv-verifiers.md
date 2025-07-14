<h1>L2 veCRV Verifiers</h1>

L2 verifier contracts are used to securely synchronize veCRV and related state from Ethereum mainnet (L1) to supported L2s. They validate Merkle proofs and block data from L1, allowing trust-minimized updates of veCRV balances, total supply, and delegation state on L2.

---

## **veCRV Verifier**

The `VecrvVerifier` contract is used to verify and update the total supply and individual balances of veCRV on L2s by validating state proofs from L1. It enables trust-minimized synchronization of veCRV state by accepting Merkle proofs and block data, and updating the canonical veCRV oracle with supply and balance changes. This contract is typically called by relayers or bridges to reflect L1 veCRV state on L2.

!!!solidity "`VecrvVerifier.sol`"
    The source code for the `VecrvVerifier` contract is available on [:material-github: GitHub](https://github.com/curvefi/storage-proofs/blob/main/contracts/vecrv/verifiers/VecrvVerifier.sol). The contract is written in [Solidity](https://soliditylang.org/) version `0.8.18`.

    ??? abi "Contract ABI"

        ```json
        [{"inputs":[{"internalType":"address","name":"_block_hash_oracle","type":"address"},{"internalType":"address","name":"_vecrv_oracle","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[],"name":"BLOCK_HASH_ORACLE","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"MIN_SLOPE_CHANGES_CNT","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"VE_ORACLE","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_user","type":"address"},{"internalType":"bytes","name":"_block_header_rlp","type":"bytes"},{"internalType":"bytes","name":"_proof_rlp","type":"bytes"}],"name":"verifyBalanceByBlockHash","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_user","type":"address"},{"internalType":"uint256","name":"_block_number","type":"uint256"},{"internalType":"bytes","name":"_proof_rlp","type":"bytes"}],"name":"verifyBalanceByStateRoot","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes","name":"_block_header_rlp","type":"bytes"},{"internalType":"bytes","name":"_proof_rlp","type":"bytes"}],"name":"verifyTotalByBlockHash","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_block_number","type":"uint256"},{"internalType":"bytes","name":"_proof_rlp","type":"bytes"}],"name":"verifyTotalByStateRoot","outputs":[],"stateMutability":"nonpayable","type":"function"}]
        ```


### `BLOCK_HASH_ORACLE`
!!! description "`VecrvVerifier.BLOCK_HASH_ORACLE() -> address: public`"

    Getter for the block hash oracle contract, which is used to retrieve block hashes and state roots for verification.

    Returns: block hash oracle (`address`).

    ??? quote "Source code"

        === "VecrvVerifier.sol"

            ```solidity
            address public immutable BLOCK_HASH_ORACLE;
            ```

    === "Example"

        This examples returns the block has oracle on Optimism.

        ```shell
        >>> VecrvVerifier.BLOCK_HASH_ORACLE()
        '0xeB896fB7D1AaE921d586B0E5a037496aFd3E2412'
        ```


### `MIN_SLOPE_CHANGES_CNT`
!!! description "`VecrvVerifier.MIN_SLOPE_CHANGES_CNT() -> uint256: view`"

    Returns the minimum number of slope changes required for a valid proof. This is set to 4, corresponding to 1 month (assuming 1 week per slope change).

    Returns: minimum slope change (`uint256`).

    ??? quote "Source code"

        === "VecrvVerifier.sol"

            ```solidity
            import "./VecrvVerifierCore.sol";
            ```

        === "VecrvVerifierCore.sol"

            ```solidity
            uint256 public constant MIN_SLOPE_CHANGES_CNT = 4; // 1 month
            ```

    === "Example"

        This example returns the minimum slope change count.

        ```shell
        >>> VecrvVerifier.MIN_SLOPE_CHANGES_CNT()
        4
        ```


### `VE_ORACLE`
!!! description "`VecrvVerifier.VE_ORACLE() -> address: view`"

    Getter for the veCRV oracle contract, which is called to update the total supply and user balances after verification.

    Returns: vecrv oracle (`address`).

    ??? quote "Source code"

        === "VecrvVerifier.sol"

            ```solidity
            import "./VecrvVerifierCore.sol";
            ```

        === "VecrvVerifierCore.sol"

            ```solidity
            address public immutable VE_ORACLE;

            constructor(address _ve_oracle) {
                VE_ORACLE = _ve_oracle;
            }
            ```

    === "Example"

        This example returns the minimum slope change count.

        ```shell
        >>> VecrvVerifier.VE_ORACLE()
        '0xF1946D4879646e0FCD8F5bb32a5636ED8055176D'
        ```


### `verifyBalanceByBlockHash`
!!! description "`VecrvVerifier.verifyBalanceByBlockHash(address _user, bytes memory _block_header_rlp, bytes memory _proof_rlp) external`"

    Verifies a user's veCRV balance and updates the total veCRV supply using a block hash. This function is intended for use with RLP-encoded block headers and state proofs.

    | Input               | Type      | Description                    |
    | ------------------- | --------- | ------------------------------ |
    | `_user_`            | `address` | User to verify the balance for |
    | `_block_header_rlp` | `bytes`   | RLP-encoded block header       |
    | `_proof_rlp`        | `bytes`   | state proof of the parameters  |

    ??? quote "Source code"

        === "VecrvVerifier.sol"

            ```solidity
            /// @param _user User to verify balance for
            /// @param _block_header_rlp The RLP-encoded block header
            /// @param _proof_rlp The state proof of the parameters
            function verifyBalanceByBlockHash(
                    address _user,
                    bytes memory _block_header_rlp,
                    bytes memory _proof_rlp
                ) external {
                    RLPReader.RLPItem[] memory proofs = _proof_rlp.toRlpItem().toList();
                    require(proofs.length >= 1, "Invalid number of proofs");
                    (bytes32 storage_root, uint256 block_number) = _extractAccountStorageRoot(_block_header_rlp, proofs[0]);

                    _updateTotal(storage_root, block_number, proofs[1].toList());
                    _updateBalance(_user, storage_root, block_number, proofs[2].toList());
                }

            function _extractAccountStorageRoot(
                    bytes32 state_root_hash,
                    RLPReader.RLPItem memory account_proof
                ) internal returns (bytes32) {
                    Verifier.Account memory account = Verifier.extractAccountFromProof(
                        VOTING_ESCROW_HASH,
                        state_root_hash,
                        account_proof.toList()
                    );
                    require(account.exists, "VotingEscrow account does not exist");
                    return account.storageRoot;
                }

                /// @dev Update total parameters with proofs
                function _updateTotal(
                    bytes32 storageRoot,
                    uint256 block_number,
                    RLPReader.RLPItem[] memory proofs
                ) internal {
                    require(proofs.length >= SLOPE_CHANGES_PROOF_I + MIN_SLOPE_CHANGES_CNT, "Invalid number of total proofs");

                    // Extract slot values
                    uint256 epoch = Verifier.extractSlotValueFromProof(
                        keccak256(abi.encode(EPOCH_SLOT)),
                        storageRoot,
                        proofs[EPOCH_PROOF_I].toList()
                    ).value;
                    IVecrvOracle.Point memory point_history = _extract_point(
                        POINT_HISTORY_PROOF_I,
                        keccak256(abi.encode(uint256(keccak256(abi.encode(POINT_HISTORY_SLOT))) + epoch)),
                        storageRoot,
                        proofs
                    );
                    uint256 start = WEEK + point_history.ts / WEEK * WEEK;
                    int128[] memory slope_changes = new int128[](proofs.length - SLOPE_CHANGES_PROOF_I);
                    for (uint256 i = 0; i < proofs.length - SLOPE_CHANGES_PROOF_I; ++i) {
                        slope_changes[i] = int128(int256(Verifier.extractSlotValueFromProof(
                            keccak256(abi.encode(keccak256(abi.encode(SLOPE_CHANGES_SLOT, start + i * WEEK)))),
                            storageRoot,
                            proofs[SLOPE_CHANGES_PROOF_I + i].toList()
                        ).value));
                    }

                    return IVecrvOracle(VE_ORACLE).update_total(
                        epoch,
                        point_history,
                        slope_changes,
                        block_number
                    );
                }

            /// @dev Update user's balance with proofs
                function _updateBalance(
                    address user,
                    bytes32 storageRoot,
                    uint256 block_number,
                    RLPReader.RLPItem[] memory proofs
                ) internal {
                    require(proofs.length == LOCKED_BALANCE_PROOF_I + 2, "Invalid number of balance proofs");

                    // Extract slot values
                    uint256 user_point_epoch = Verifier.extractSlotValueFromProof(
                        keccak256(
                            abi.encode(keccak256(abi.encode(USER_POINT_EPOCH_SLOT, user)))
                        ),
                        storageRoot,
                        proofs[USER_POINT_EPOCH_PROOF_I].toList()
                    ).value;
                    IVecrvOracle.Point memory user_point_history = _extract_point(
                        USER_POINT_HISTORY_PROOF_I,
                        keccak256(abi.encode(uint256(keccak256(abi.encode(keccak256(abi.encode(USER_POINT_HISTORY_SLOT, user))))) + user_point_epoch)),
                        storageRoot,
                        proofs
                    );
                    IVecrvOracle.LockedBalance memory locked = _extract_locked_balance(
                        LOCKED_BALANCE_PROOF_I,
                        keccak256(abi.encode(keccak256(abi.encode(LOCKED_BALANCE_SLOT, user)))),
                        storageRoot,
                        proofs
                    );

                    return IVecrvOracle(VE_ORACLE).update_balance(
                        user,
                        user_point_epoch,
                        user_point_history,
                        locked,
                        block_number
                    );
                }
            ```

    === "Example"

        ```shell
        >>> soon
        ```


### `verifyBalanceByStateRoot`
!!! description "`VecrvVerifier.verifyBalanceByStateRoot(address _user, uint256 _block_number, bytes memory _proof_rlp) external`"

    Verifies a user's veCRV balance and updates the total veCRV supply using a state root obtained from the block hash oracle.

    | Input               | Type      | Description                    |
    | ------------------- | --------- | ------------------------------ |
    | `_user_`            | `address` | User to verify the balance for |
    | `_block_number_`    | `uint256` | Block number to use state root |
    | `_proof_rlp_`       | `bytes`   | State proof of the parameters  |

    ??? quote "Source code"

        === "VecrvVerifier.sol"

            ```solidity
            /// @param _user User to verify balance for
            /// @param _block_number Number of the block to use state root hash
            /// @param _proof_rlp The state proof of the parameters
            function verifyBalanceByStateRoot(
                address _user,
                uint256 _block_number,
                bytes memory _proof_rlp
            ) external {
                RLPReader.RLPItem[] memory proofs = _proof_rlp.toRlpItem().toList();
                require(proofs.length >= 1, "Invalid number of proofs");
                bytes32 state_root = IBlockHashOracle(BLOCK_HASH_ORACLE).get_state_root(_block_number);
                bytes32 storage_root = _extractAccountStorageRoot(state_root, proofs[0]);

                _updateTotal(storage_root, _block_number, proofs[1].toList());
                _updateBalance(_user, storage_root, _block_number, proofs[2].toList());
            }

            function _extractAccountStorageRoot(
                    bytes32 state_root_hash,
                    RLPReader.RLPItem memory account_proof
                ) internal returns (bytes32) {
                    Verifier.Account memory account = Verifier.extractAccountFromProof(
                        VOTING_ESCROW_HASH,
                        state_root_hash,
                        account_proof.toList()
                    );
                    require(account.exists, "VotingEscrow account does not exist");
                    return account.storageRoot;
                }
            ```

        === "VecrvVerifierCore.sol"

            ```solidity
            /// @dev Update total parameters with proofs
            function _updateTotal(
                bytes32 storageRoot,
                uint256 block_number,
                RLPReader.RLPItem[] memory proofs
            ) internal {
                require(proofs.length >= SLOPE_CHANGES_PROOF_I + MIN_SLOPE_CHANGES_CNT, "Invalid number of total proofs");

                // Extract slot values
                uint256 epoch = Verifier.extractSlotValueFromProof(
                    keccak256(abi.encode(EPOCH_SLOT)),
                    storageRoot,
                    proofs[EPOCH_PROOF_I].toList()
                ).value;
                IVecrvOracle.Point memory point_history = _extract_point(
                    POINT_HISTORY_PROOF_I,
                    keccak256(abi.encode(uint256(keccak256(abi.encode(POINT_HISTORY_SLOT))) + epoch)),
                    storageRoot,
                    proofs
                );
                uint256 start = WEEK + point_history.ts / WEEK * WEEK;
                int128[] memory slope_changes = new int128[](proofs.length - SLOPE_CHANGES_PROOF_I);
                for (uint256 i = 0; i < proofs.length - SLOPE_CHANGES_PROOF_I; ++i) {
                    slope_changes[i] = int128(int256(Verifier.extractSlotValueFromProof(
                        keccak256(abi.encode(keccak256(abi.encode(SLOPE_CHANGES_SLOT, start + i * WEEK)))),
                        storageRoot,
                        proofs[SLOPE_CHANGES_PROOF_I + i].toList()
                    ).value));
                }

                return IVecrvOracle(VE_ORACLE).update_total(
                    epoch,
                    point_history,
                    slope_changes,
                    block_number
                );
            }

            /// @dev Update user's balance with proofs
                function _updateBalance(
                    address user,
                    bytes32 storageRoot,
                    uint256 block_number,
                    RLPReader.RLPItem[] memory proofs
                ) internal {
                    require(proofs.length == LOCKED_BALANCE_PROOF_I + 2, "Invalid number of balance proofs");

                    // Extract slot values
                    uint256 user_point_epoch = Verifier.extractSlotValueFromProof(
                        keccak256(
                            abi.encode(keccak256(abi.encode(USER_POINT_EPOCH_SLOT, user)))
                        ),
                        storageRoot,
                        proofs[USER_POINT_EPOCH_PROOF_I].toList()
                    ).value;
                    IVecrvOracle.Point memory user_point_history = _extract_point(
                        USER_POINT_HISTORY_PROOF_I,
                        keccak256(abi.encode(uint256(keccak256(abi.encode(keccak256(abi.encode(USER_POINT_HISTORY_SLOT, user))))) + user_point_epoch)),
                        storageRoot,
                        proofs
                    );
                    IVecrvOracle.LockedBalance memory locked = _extract_locked_balance(
                        LOCKED_BALANCE_PROOF_I,
                        keccak256(abi.encode(keccak256(abi.encode(LOCKED_BALANCE_SLOT, user)))),
                        storageRoot,
                        proofs
                    );

                    return IVecrvOracle(VE_ORACLE).update_balance(
                        user,
                        user_point_epoch,
                        user_point_history,
                        locked,
                        block_number
                    );
                }
            ```

    === "Example"

        ```shell
        >>> soon
        ```


### `verifyTotalByBlockHash`
!!! description "`VecrvVerifier.verifyTotalByBlockHash(bytes memory _block_header_rlp, bytes memory _proof_rlp) external`"

    Verifies and updates the total veCRV supply using a block hash and state proof. Intended for use with RLP-encoded block headers and state proofs. The proofs must be constructed off-chain and provided as input.

    | Input         | Type      | Description                                 |
    | ------------- | --------- | ------------------------------------------- |
    | `_block_header_rlp_` | `bytes` | RLP-encoded block header from L1           |
    | `_proof_rlp_`        | `bytes` | State proof of the parameters              |

    ??? quote "Source code"

        === "VecrvVerifier.sol"

            ```solidity
            /// @param _block_header_rlp The RLP-encoded block header
            /// @param _proof_rlp The state proof of the parameters
            function verifyTotalByBlockHash(
                bytes memory _block_header_rlp,
                bytes memory _proof_rlp
            ) external {
                RLPReader.RLPItem[] memory proofs = _proof_rlp.toRlpItem().toList();
                require(proofs.length >= 1, "Invalid number of proofs");
                (bytes32 storage_root, uint256 block_number) = _extractAccountStorageRoot(_block_header_rlp, proofs[0]);

                _updateTotal(storage_root, block_number, proofs[1].toList());
            }
            ```

        === "VecrvVerifierCore.sol"

            ```solidity
            interface IVecrvOracle {
                struct Point {
                    int128 bias;
                    int128 slope;
                    uint256 ts;
                    uint256 blk;
                }

            /// @dev Update total parameters with proofs
            function _updateTotal(
                bytes32 storageRoot,
                uint256 block_number,
                RLPReader.RLPItem[] memory proofs
            ) internal {
                require(proofs.length >= SLOPE_CHANGES_PROOF_I + MIN_SLOPE_CHANGES_CNT, "Invalid number of total proofs");

                // Extract slot values
                uint256 epoch = Verifier.extractSlotValueFromProof(
                    keccak256(abi.encode(EPOCH_SLOT)),
                    storageRoot,
                    proofs[EPOCH_PROOF_I].toList()
                ).value;
                IVecrvOracle.Point memory point_history = _extract_point(
                    POINT_HISTORY_PROOF_I,
                    keccak256(abi.encode(uint256(keccak256(abi.encode(POINT_HISTORY_SLOT))) + epoch)),
                    storageRoot,
                    proofs
                );
                uint256 start = WEEK + point_history.ts / WEEK * WEEK;
                int128[] memory slope_changes = new int128[](proofs.length - SLOPE_CHANGES_PROOF_I);
                for (uint256 i = 0; i < proofs.length - SLOPE_CHANGES_PROOF_I; ++i) {
                    slope_changes[i] = int128(int256(Verifier.extractSlotValueFromProof(
                        keccak256(abi.encode(keccak256(abi.encode(SLOPE_CHANGES_SLOT, start + i * WEEK)))),
                        storageRoot,
                        proofs[SLOPE_CHANGES_PROOF_I + i].toList()
                    ).value));
                }

                return IVecrvOracle(VE_ORACLE).update_total(
                    epoch,
                    point_history,
                    slope_changes,
                    block_number
                );
            }
            ```

    === "Example"

        ```shell
        >>> soon
        ```


### `verifyTotalByStateRoot`
!!! description "`VecrvVerifier.verifyTotalByStateRoot(uint256 _block_number, bytes memory _proof_rlp) external`"

    Verifies and updates the total veCRV supply using a state root obtained from the block hash oracle. The proofs must be constructed off-chain and provided as input.

    | Input         | Type      | Description                                 |
    | ------------- | --------- | ------------------------------------------- |
    | `_block_number_` | `uint256` | Block number to use state root             |
    | `_proof_rlp_`    | `bytes`   | State proof of the parameters              |

    ??? quote "Source code"

        === "VecrvVerifier.sol"

            ```solidity
            /// @param _block_number Number of the block to use state root hash
            /// @param _proof_rlp The state proof of the parameters
            function verifyTotalByStateRoot(
                uint256 _block_number,
                bytes memory _proof_rlp
            ) external {
                RLPReader.RLPItem[] memory proofs = _proof_rlp.toRlpItem().toList();
                require(proofs.length >= 1, "Invalid number of proofs");
                bytes32 state_root = IBlockHashOracle(BLOCK_HASH_ORACLE).get_state_root(_block_number);
                bytes32 storage_root = _extractAccountStorageRoot(state_root, proofs[0]);

                _updateTotal(storage_root, _block_number, proofs[1].toList());
            }
            ```

        === "VecrvVerifierCore.sol"

            ```solidity
            interface IVecrvOracle {
                struct Point {
                    int128 bias;
                    int128 slope;
                    uint256 ts;
                    uint256 blk;
                }

            /// @dev Update total parameters with proofs
            function _updateTotal(
                bytes32 storageRoot,
                uint256 block_number,
                RLPReader.RLPItem[] memory proofs
            ) internal {
                require(proofs.length >= SLOPE_CHANGES_PROOF_I + MIN_SLOPE_CHANGES_CNT, "Invalid number of total proofs");

                // Extract slot values
                uint256 epoch = Verifier.extractSlotValueFromProof(
                    keccak256(abi.encode(EPOCH_SLOT)),
                    storageRoot,
                    proofs[EPOCH_PROOF_I].toList()
                ).value;
                IVecrvOracle.Point memory point_history = _extract_point(
                    POINT_HISTORY_PROOF_I,
                    keccak256(abi.encode(uint256(keccak256(abi.encode(POINT_HISTORY_SLOT))) + epoch)),
                    storageRoot,
                    proofs
                );
                uint256 start = WEEK + point_history.ts / WEEK * WEEK;
                int128[] memory slope_changes = new int128[](proofs.length - SLOPE_CHANGES_PROOF_I);
                for (uint256 i = 0; i < proofs.length - SLOPE_CHANGES_PROOF_I; ++i) {
                    slope_changes[i] = int128(int256(Verifier.extractSlotValueFromProof(
                        keccak256(abi.encode(keccak256(abi.encode(SLOPE_CHANGES_SLOT, start + i * WEEK)))),
                        storageRoot,
                        proofs[SLOPE_CHANGES_PROOF_I + i].toList()
                    ).value));
                }

                return IVecrvOracle(VE_ORACLE).update_total(
                    epoch,
                    point_history,
                    slope_changes,
                    block_number
                );
            }
            ```

    === "Example"

        ```shell
        >>> soon
        ```

---


## **Delegation Verifier**

The `DelegationVerifier` contract is used to verify and update veCRV delegation state on L2s by validating state proofs from L1. It enables trust-minimized synchronization of delegated veCRV balances by accepting Merkle proofs and block data, and updating the canonical veCRV oracle with delegation changes. This contract is typically called by relayers or bridges to reflect L1 delegation state on L2.

!!!solidity "`VecrvVerifier.sol`"
    The source code for the `VecrvVerifier` contract is available on [:material-github: GitHub](https://github.com/curvefi/storage-proofs/blob/main/contracts/vecrv/verifiers/DelegationVerifier.sol). The contract is written in [Solidity](https://soliditylang.org/) version `0.8.18`.

    ???abi "Contract ABI"

        ```json
        [{"inputs":[{"internalType":"address","name":"_block_hash_oracle","type":"address"},{"internalType":"address","name":"_vecrv_oracle","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[],"name":"BLOCK_HASH_ORACLE","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"VE_ORACLE","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_from","type":"address"},{"internalType":"bytes","name":"_block_header_rlp","type":"bytes"},{"internalType":"bytes","name":"_proof_rlp","type":"bytes"}],"name":"verifyDelegationByBlockHash","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_from","type":"address"},{"internalType":"uint256","name":"_block_number","type":"uint256"},{"internalType":"bytes","name":"_proof_rlp","type":"bytes"}],"name":"verifyDelegationByStateRoot","outputs":[],"stateMutability":"nonpayable","type":"function"}]
        ```


### `BLOCK_HASH_ORACLE`
!!! description "`DelegationVerifier.BLOCK_HASH_ORACLE() -> address: view`"

    Getter for the block hash oracle contract, which is used to retrieve block hashes and state roots for verification.

    Returns: block hash oracle (`address`).

    ??? quote "Source code"

        === "DelegationVerifier.sol"

            ```solidity
            address public immutable BLOCK_HASH_ORACLE;

            constructor(address _block_hash_oracle, address _vecrv_oracle)
            {
                BLOCK_HASH_ORACLE = _block_hash_oracle;
                VE_ORACLE = _vecrv_oracle;
            }
            ```

    === "Example"

        ```shell
        >>> DelegationVerifier.BLOCK_HASH_ORACLE()
        '0xeB896fB7D1AaE921d586B0E5a037496aFd3E2412'
        ```


### `VE_ORACLE`
!!! description "`DelegationVerifier.VE_ORACLE() -> address: view`"

    Getter for the veCRV oracle contract, which is called to update the total supply and user balances after verification.

    Returns: vecrv oracle (`address`).

    ??? quote "Source code"

        === "DelegationVerifier.sol"

            ```solidity
            address public immutable VE_ORACLE;

            constructor(address _block_hash_oracle, address _vecrv_oracle)
            {
                BLOCK_HASH_ORACLE = _block_hash_oracle;
                VE_ORACLE = _vecrv_oracle;
            }
            ```

    === "Example"

        ```shell
        >>> DelegationVerifier.VE_ORACLE()
        '0xF1946D4879646e0FCD8F5bb32a5636ED8055176D'
        ```


### `verifyDelegationByBlockHash`
!!! description "`DelegationVerifier.verifyDelegationByBlockHash(address _from, bytes memory _block_header_rlp, bytes memory _proof_rlp) external`"

    Verifies and updates the delegation of veCRV balance from `_from` to the delegated address using a block hash. This function is intended for use with RLP-encoded block headers and state proofs.

    | Input         | Type      | Description                                 |
    | ------------- | --------- | ------------------------------------------- |
    | `_from`       | `address` | Address from which balance is delegated     |
    | `_block_header_rlp` | `bytes` | RLP-encoded block header from L1           |
    | `_proof_rlp`        | `bytes` | State proof of the parameters              |

    ??? quote "Source code"

        === "DelegationVerifier.sol"

            ```solidity
            interface IBlockHashOracle {
                function get_block_hash(uint256 _number) external view returns (bytes32);
                function get_state_root(uint256 _number) external view returns (bytes32);
            }

            interface IVecrvOracle {
                function update_delegation(
                    address from,
                    address to,
                    uint256 block_number
                ) external;
            }

            function verifyDelegationByBlockHash(
                address _from,
                bytes memory _block_header_rlp,
                bytes memory _proof_rlp
            ) external {
                Verifier.BlockHeader memory block_header = Verifier.parseBlockHeader(_block_header_rlp);
                require(block_header.hash != bytes32(0), "Invalid blockhash");
                require(
                    block_header.hash == IBlockHashOracle(BLOCK_HASH_ORACLE).get_block_hash(block_header.number),
                    "Blockhash mismatch"
                );

                return _updateDelegation(_from, block_header.number, block_header.stateRootHash, _proof_rlp);
            }

            /// @dev Update delegation using proof. `blockNumber` is used for updates linearization
            function _updateDelegation(
                address from,
                uint256 blockNumber,
                bytes32 stateRoot,
                bytes memory proofRlp
            ) internal {
                RLPReader.RLPItem[] memory proofs = proofRlp.toRlpItem().toList();
                require(proofs.length == 2, "Invalid number of proofs");

                // Extract account proof
                Verifier.Account memory account = Verifier.extractAccountFromProof(
                    VE_DELEGATE_HASH,
                    stateRoot,
                    proofs[0].toList()
                );
                require(account.exists, "Delegate account does not exist");

                // Extract slot values
                address to = address(uint160(Verifier.extractSlotValueFromProof(
                    keccak256(abi.encode(
                        keccak256(abi.encode(
                            keccak256(abi.encode(1, block.chainid)), // slot of delegation_from[chain.id][]
                            from
                        ))
                    )),
                    account.storageRoot,
                    proofs[1].toList()
                ).value));
                require(to != VE_DELEGATE, "Delegate not set");

                return IVecrvOracle(VE_ORACLE).update_delegation(from, to, blockNumber);
            }
            ```

    === "Example"

        ```shell
        >>> soon
        ```


### `verifyDelegationByStateRoot`
!!! description "`DelegationVerifier.verifyDelegationByStateRoot(address _from, uint256 _block_number, bytes memory _proof_rlp) external`"

    Verifies and updates the delegation of veCRV balance from `_from` to the delegated address using a state root obtained from the block hash oracle.

    | Input         | Type      | Description                                 |
    | ------------- | --------- | ------------------------------------------- |
    | `_from`       | `address` | Address from which balance is delegated     |
    | `_block_number` | `uint256` | Block number to use state root             |
    | `_proof_rlp`    | `bytes`   | State proof of the parameters              |

    ??? quote "Source code"

        === "DelegationVerifier.sol"

            ```solidity
            interface IBlockHashOracle {
                function get_block_hash(uint256 _number) external view returns (bytes32);
                function get_state_root(uint256 _number) external view returns (bytes32);
            }

            interface IVecrvOracle {
                function update_delegation(
                    address from,
                    address to,
                    uint256 block_number
                ) external;
            }

            /// @param _from Address from which balance is delegated
            /// @param _block_number Number of the block to use state root hash
            /// @param _proof_rlp The state proof of the parameters
            function verifyDelegationByStateRoot(
                address _from,
                uint256 _block_number,
                bytes memory _proof_rlp
            ) external {
                bytes32 state_root = IBlockHashOracle(BLOCK_HASH_ORACLE).get_state_root(_block_number);

                return _updateDelegation(_from, _block_number, state_root, _proof_rlp);
            }

            /// @dev Update delegation using proof. `blockNumber` is used for updates linearization
            function _updateDelegation(
                address from,
                uint256 blockNumber,
                bytes32 stateRoot,
                bytes memory proofRlp
            ) internal {
                RLPReader.RLPItem[] memory proofs = proofRlp.toRlpItem().toList();
                require(proofs.length == 2, "Invalid number of proofs");

                // Extract account proof
                Verifier.Account memory account = Verifier.extractAccountFromProof(
                    VE_DELEGATE_HASH,
                    stateRoot,
                    proofs[0].toList()
                );
                require(account.exists, "Delegate account does not exist");

                // Extract slot values
                address to = address(uint160(Verifier.extractSlotValueFromProof(
                    keccak256(abi.encode(
                        keccak256(abi.encode(
                            keccak256(abi.encode(1, block.chainid)), // slot of delegation_from[chain.id][]
                            from
                        ))
                    )),
                    account.storageRoot,
                    proofs[1].toList()
                ).value));
                require(to != VE_DELEGATE, "Delegate not set");

                return IVecrvOracle(VE_ORACLE).update_delegation(from, to, blockNumber);
            }
            ```

    === "Example"

        ```shell
        >>> soon
        ```
