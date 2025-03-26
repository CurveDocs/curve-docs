<h1>scrvUSD Verifier</h1>

The two verifier contracts work together to securely update and maintain the scrvUSD oracle using **on-chain state proofs**. 

`ScrvusdVerifierV1` extracts scrvUSD vault parameters (such as total debt, idle funds, supply, and profit unlocking metrics) from state proofs. It validates these parameters by verifying the block header or state root against the `BlockHashOracle` and then updates the scrvUSD oracle’s price via its `update_price` (see oracle documentation) function.

`ScrvusdVerifierV2` focuses specifically on updating the profit unlocking duration (`profit_max_unlock_time`). It uses similar state proof techniques—verifying either an RLP-encoded block header or a state root—to extract the period value. This period is then sent to the scrvUSD oracle via the `update_profit_max_unlock_time` function. 

*Together, these contracts ensure that the scrvUSD oracle remains accurate by securely integrating verified on-chain data.*


---


## **scrvUSD Verifier V1**

!!!solidity "`ScrvusdVerifierV1.sol`"
    The source code for the `ScrvusdVerifierV1` contract is available on [:material-github: GitHub](https://github.com/curvefi/storage-proofs/blob/main/contracts/scrvusd/verifiers/ScrvusdVerifierV1.sol). The contract is written in [Solidity](https://soliditylang.org/) version `0.8.18`.


### `verifyScrvusdByBlockHash`
!!! description "`ScrvusdVerifierV1.verifyScrvusdByBlockHash(_block_header_rlp: bytes, _proof_rlp: bytes) -> uint256`"

    This function verifies scrvUSD parameters using an RLP-encoded block header and a corresponding state proof. It parses the block header to ensure the `BlockHash` is valid and matches the expected value from the `BlockHashOracle`, then extracts the scrvUSD vault parameters from the state proof. It then updates the scrvUSD oracle with these parameters, returning the absolute relative price change scaled to $10^18$ precision.

    Returns: absolute relative price change of the scrvUSD price.

    | Input               | Type  | Description                                                       |
    | ------------------- | ----- | ----------------------------------------------------------------- |
    | `_block_header_rlp` | bytes | RLP-encoded block header containing block details                 |
    | `_proof_rlp`        | bytes | RLP-encoded state proof for the scrvUSD parameters                |

    ??? quote "Source code"

        === "ScrvusdVerifierV1.sol"

            ```solidity
            // SPDX-License-Identifier: MIT
            pragma solidity 0.8.18;

            import {RLPReader} from "hamdiallam/Solidity-RLP@2.0.7/contracts/RLPReader.sol";
            import {StateProofVerifier as Verifier} from "../../xdao/contracts/libs/StateProofVerifier.sol";

            uint256 constant PARAM_CNT = 2 + 5;
            uint256 constant PROOF_CNT = 1 + PARAM_CNT;

            interface IScrvusdOracle {
                function update_price(
                    uint256[PARAM_CNT] memory _parameters,
                    uint256 _ts,
                    uint256 _block_number
                ) external returns (uint256);
            }

            interface IBlockHashOracle {
                function get_block_hash(uint256 _number) external view returns (bytes32);
                function get_state_root(uint256 _number) external view returns (bytes32);
            }

            contract ScrvusdVerifierV1 {
                using RLPReader for bytes;
                using RLPReader for RLPReader.RLPItem;

                // Common constants
                address constant SCRVUSD = 0x0655977FEb2f289A4aB78af67BAB0d17aAb84367;
                bytes32 constant SCRVUSD_HASH = keccak256(abi.encodePacked(SCRVUSD));

                // Storage slots of parameters
                uint256[PROOF_CNT] internal PARAM_SLOTS = [
                    uint256(0), // filler for account proof
                    uint256(21), // total_debt
                    uint256(22), // total_idle
                    uint256(20), // totalSupply
                    uint256(38), // full_profit_unlock_date
                    uint256(39), // profit_unlocking_rate
                    uint256(40), // last_profit_update
                    uint256(keccak256(abi.encode(18, SCRVUSD))) // balanceOf(self)
                ];

                address public immutable SCRVUSD_ORACLE;
                address public immutable BLOCK_HASH_ORACLE;

                constructor(address _block_hash_oracle, address _scrvusd_oracle)
                {
                    BLOCK_HASH_ORACLE = _block_hash_oracle;
                    SCRVUSD_ORACLE = _scrvusd_oracle;
                }

                /// @param _block_header_rlp The RLP-encoded block header
                /// @param _proof_rlp The state proof of the parameters
                function verifyScrvusdByBlockHash(
                    bytes memory _block_header_rlp,
                    bytes memory _proof_rlp
                ) external returns (uint256) {
                    Verifier.BlockHeader memory block_header = Verifier.parseBlockHeader(_block_header_rlp);
                    require(block_header.hash != bytes32(0), "Invalid blockhash");
                    require(
                        block_header.hash == IBlockHashOracle(BLOCK_HASH_ORACLE).get_block_hash(block_header.number),
                        "Blockhash mismatch"
                    );

                    uint256[PARAM_CNT] memory params = _extractParametersFromProof(block_header.stateRootHash, _proof_rlp);
                    return _updatePrice(params, block_header.timestamp, block_header.number);
                }

                /// @dev Extract parameters from the state proof using the given state root.
                function _extractParametersFromProof(
                    bytes32 stateRoot,
                    bytes memory proofRlp
                ) internal view returns (uint256[PARAM_CNT] memory) {
                    RLPReader.RLPItem[] memory proofs = proofRlp.toRlpItem().toList();
                    require(proofs.length == PROOF_CNT, "Invalid number of proofs");

                    // Extract account proof
                    Verifier.Account memory account = Verifier.extractAccountFromProof(
                        SCRVUSD_HASH,
                        stateRoot,
                        proofs[0].toList()
                    );
                    require(account.exists, "scrvUSD account does not exist");

                    // Extract slot values
                    uint256[PARAM_CNT] memory params;
                    for (uint256 i = 1; i < PROOF_CNT; i++) {
                        Verifier.SlotValue memory slot = Verifier.extractSlotValueFromProof(
                            keccak256(abi.encode(PARAM_SLOTS[i])),
                            account.storageRoot,
                            proofs[i].toList()
                        );
                        // Slots might not exist, but typically we just read them.
                        params[i - 1] = slot.value;
                    }

                    return params;
                }

                /// @dev Calls the oracle to update the price parameters.
                ///      Both child contracts use the same oracle call, differing only in how they obtain the timestamp.
                function _updatePrice(
                    uint256[PARAM_CNT] memory params,
                    uint256 ts,
                    uint256 number
                ) internal returns (uint256) {
                    return IScrvusdOracle(SCRVUSD_ORACLE).update_price(params, ts, number);
                }
            }
            ```


### `verifyScrvusdByStateRoot`
!!! description "`ScrvusdVerifierV1.verifyScrvusdByStateRoot(_block_number: uint256, _proof_rlp: bytes) -> uint256`"

    This function verifies scrvUSD parameters by retrieving the state root for a given block number from the block hash oracle and then extracting the scrvUSD vault parameters using a state proof. The extracted parameters are used to update the scrvUSD oracle, returning the absolute relative price change scaled to 10^18 precision.

    Returns: The absolute relative price change of the scrvUSD price.

    | Input           | Type      | Description                                                       |
    | --------------- | --------- | ----------------------------------------------------------------- |
    | `_block_number` | uint256   | Block number for which to retrieve the state root                 |
    | `_proof_rlp`    | bytes     | RLP-encoded state proof for the scrvUSD parameters                  |

    ??? quote "Source code"

        === "ScrvusdVerifierV1.sol"

            ```solidity
            // SPDX-License-Identifier: MIT
            pragma solidity 0.8.18;

            import {RLPReader} from "hamdiallam/Solidity-RLP@2.0.7/contracts/RLPReader.sol";
            import {StateProofVerifier as Verifier} from "../../xdao/contracts/libs/StateProofVerifier.sol";

            uint256 constant PARAM_CNT = 2 + 5;
            uint256 constant PROOF_CNT = 1 + PARAM_CNT;

            interface IScrvusdOracle {
                function update_price(
                    uint256[PARAM_CNT] memory _parameters,
                    uint256 _ts,
                    uint256 _block_number
                ) external returns (uint256);
            }

            interface IBlockHashOracle {
                function get_block_hash(uint256 _number) external view returns (bytes32);
                function get_state_root(uint256 _number) external view returns (bytes32);
            }

            contract ScrvusdVerifierV1 {
                using RLPReader for bytes;
                using RLPReader for RLPReader.RLPItem;

                // Common constants
                address constant SCRVUSD = 0x0655977FEb2f289A4aB78af67BAB0d17aAb84367;
                bytes32 constant SCRVUSD_HASH = keccak256(abi.encodePacked(SCRVUSD));

                // Storage slots of parameters
                uint256[PROOF_CNT] internal PARAM_SLOTS = [
                    uint256(0), // filler for account proof
                    uint256(21), // total_debt
                    uint256(22), // total_idle
                    uint256(20), // totalSupply
                    uint256(38), // full_profit_unlock_date
                    uint256(39), // profit_unlocking_rate
                    uint256(40), // last_profit_update
                    uint256(keccak256(abi.encode(18, SCRVUSD))) // balanceOf(self)
                ];

                address public immutable SCRVUSD_ORACLE;
                address public immutable BLOCK_HASH_ORACLE;

                constructor(address _block_hash_oracle, address _scrvusd_oracle)
                {
                    BLOCK_HASH_ORACLE = _block_hash_oracle;
                    SCRVUSD_ORACLE = _scrvusd_oracle;
                }

                /// @param _block_number Number of the block to use state root hash
                /// @param _proof_rlp The state proof of the parameters
                function verifyScrvusdByStateRoot(
                    uint256 _block_number,
                    bytes memory _proof_rlp
                ) external returns (uint256) {
                    bytes32 state_root = IBlockHashOracle(BLOCK_HASH_ORACLE).get_state_root(_block_number);

                    uint256[PARAM_CNT] memory params = _extractParametersFromProof(state_root, _proof_rlp);
                    // Use last_profit_update as the timestamp surrogate
                    return _updatePrice(params, params[5], _block_number);
                }

                /// @dev Extract parameters from the state proof using the given state root.
                function _extractParametersFromProof(
                    bytes32 stateRoot,
                    bytes memory proofRlp
                ) internal view returns (uint256[PARAM_CNT] memory) {
                    RLPReader.RLPItem[] memory proofs = proofRlp.toRlpItem().toList();
                    require(proofs.length == PROOF_CNT, "Invalid number of proofs");

                    // Extract account proof
                    Verifier.Account memory account = Verifier.extractAccountFromProof(
                        SCRVUSD_HASH,
                        stateRoot,
                        proofs[0].toList()
                    );
                    require(account.exists, "scrvUSD account does not exist");

                    // Extract slot values
                    uint256[PARAM_CNT] memory params;
                    for (uint256 i = 1; i < PROOF_CNT; i++) {
                        Verifier.SlotValue memory slot = Verifier.extractSlotValueFromProof(
                            keccak256(abi.encode(PARAM_SLOTS[i])),
                            account.storageRoot,
                            proofs[i].toList()
                        );
                        // Slots might not exist, but typically we just read them.
                        params[i - 1] = slot.value;
                    }

                    return params;
                }

                /// @dev Calls the oracle to update the price parameters.
                ///      Both child contracts use the same oracle call, differing only in how they obtain the timestamp.
                function _updatePrice(
                    uint256[PARAM_CNT] memory params,
                    uint256 ts,
                    uint256 number
                ) internal returns (uint256) {
                    return IScrvusdOracle(SCRVUSD_ORACLE).update_price(params, ts, number);
                }
            }
            ```


---


## **scrvUSD Verifier V2**

!!!solidity "`ScrvusdVerifierV2.sol`"
    The source code for the `ScrvusdVerifierV2` contract is available on [:material-github: GitHub](https://github.com/curvefi/storage-proofs/blob/main/contracts/scrvusd/verifiers/ScrvusdVerifierV2.sol). The contract is written in [Solidity](https://soliditylang.org/) version `0.8.18`.


### `verifyPeriodByBlockHash`
!!! description "`ScrvusdVerifierV2.verifyPeriodByBlockHash(_block_header_rlp: bytes, _proof_rlp: bytes) -> bool`"

    This function verifies the period using an RLP-encoded block header and a corresponding state proof. It parses the block header to ensure the block hash is valid and matches the expected value from the block hash oracle, then extracts the period from the state proof. Finally, it uses the extracted period to update the scrvUSD oracle's `profit_max_unlock_time`.

    Returns: a boolean indicating whether the update was successful.

    | Input               | Type  | Description                                                       |
    | ------------------- | ----- | ----------------------------------------------------------------- |
    | `_block_header_rlp` | bytes | RLP-encoded block header containing block information             |
    | `_proof_rlp`        | bytes | RLP-encoded state proof for the period                            |

    ??? quote "Source code"

        === "ScrvusdVerifierV2.sol"

            ```solidity
            // SPDX-License-Identifier: MIT
            pragma solidity 0.8.18;

            import {ScrvusdVerifierV1, IBlockHashOracle} from "./ScrvusdVerifierV1.sol";
            import {RLPReader} from "hamdiallam/Solidity-RLP@2.0.7/contracts/RLPReader.sol";
            import {StateProofVerifier as Verifier} from "../../xdao/contracts/libs/StateProofVerifier.sol";

            interface IScrvusdOracleV2 {
                function update_profit_max_unlock_time(
                    uint256 _profit_max_unlock_time,
                    uint256 _block_number
                ) external returns (bool);
            }

            contract ScrvusdVerifierV2 is ScrvusdVerifierV1 {
                using RLPReader for bytes;
                using RLPReader for RLPReader.RLPItem;

                uint256 internal PERIOD_SLOT = 37; // profit_max_unlock_time

                constructor(address _block_hash_oracle, address _scrvusd_oracle)
                    ScrvusdVerifierV1(_block_hash_oracle, _scrvusd_oracle) {}

                /// @param _block_header_rlp The RLP-encoded block header
                /// @param _proof_rlp The state proof of the period
                function verifyPeriodByBlockHash(
                    bytes memory _block_header_rlp,
                    bytes memory _proof_rlp
                ) external returns (bool) {
                    Verifier.BlockHeader memory block_header = Verifier.parseBlockHeader(_block_header_rlp);
                    require(block_header.hash != bytes32(0), "Invalid blockhash");
                    require(
                        block_header.hash == IBlockHashOracle(ScrvusdVerifierV1.BLOCK_HASH_ORACLE).get_block_hash(block_header.number),
                        "Blockhash mismatch"
                    );

                    uint256 period = _extractPeriodFromProof(block_header.stateRootHash, _proof_rlp);
                    return IScrvusdOracleV2(SCRVUSD_ORACLE).update_profit_max_unlock_time(period, block_header.number);
                }

                /// @dev Extract period from the state proof using the given state root.
                function _extractPeriodFromProof(
                    bytes32 stateRoot,
                    bytes memory proofRlp
                ) internal view returns (uint256) {
                    RLPReader.RLPItem[] memory proofs = proofRlp.toRlpItem().toList();
                    require(proofs.length == 2, "Invalid number of proofs");

                    // Extract account proof
                    Verifier.Account memory account = Verifier.extractAccountFromProof(
                        ScrvusdVerifierV1.SCRVUSD_HASH,
                        stateRoot,
                        proofs[0].toList()
                    );
                    require(account.exists, "scrvUSD account does not exist");

                    Verifier.SlotValue memory slot = Verifier.extractSlotValueFromProof(
                        keccak256(abi.encode(PERIOD_SLOT)),
                        account.storageRoot,
                        proofs[1].toList()
                    );
                    require(slot.exists);

                    return slot.value;
                }
            }
            ```


### `verifyPeriodByStateRoot`
!!! description "`ScrvusdVerifierV2.verifyPeriodByStateRoot(_block_number: uint256, _proof_rlp: bytes) -> bool`"

    This function verifies the period by retrieving the state root for a given block number from the block hash oracle and then using a state proof to extract the period. The extracted period is used to update the scrvUSD oracle's `profit_max_unlock_time`.

    Returns: a boolean indicating whether the update was successful.

    | Input           | Type      | Description                                              |
    | --------------- | --------- | -------------------------------------------------------- |
    | `_block_number` | uint256   | Block number for which to retrieve the state root        |
    | `_proof_rlp`    | bytes     | RLP-encoded state proof for the period                   |

    ??? quote "Source code"

        === "ScrvusdVerifierV2.sol"

            ```solidity
            // SPDX-License-Identifier: MIT
            pragma solidity 0.8.18;

            import {ScrvusdVerifierV1, IBlockHashOracle} from "./ScrvusdVerifierV1.sol";
            import {RLPReader} from "hamdiallam/Solidity-RLP@2.0.7/contracts/RLPReader.sol";
            import {StateProofVerifier as Verifier} from "../../xdao/contracts/libs/StateProofVerifier.sol";

            interface IScrvusdOracleV2 {
                function update_profit_max_unlock_time(
                    uint256 _profit_max_unlock_time,
                    uint256 _block_number
                ) external returns (bool);
            }

            contract ScrvusdVerifierV2 is ScrvusdVerifierV1 {
                using RLPReader for bytes;
                using RLPReader for RLPReader.RLPItem;

                uint256 internal PERIOD_SLOT = 37; // profit_max_unlock_time

                constructor(address _block_hash_oracle, address _scrvusd_oracle)
                    ScrvusdVerifierV1(_block_hash_oracle, _scrvusd_oracle) {}

                /// @param _block_number Number of the block to use state root hash
                /// @param _proof_rlp The state proof of the period
                function verifyPeriodByStateRoot(
                    uint256 _block_number,
                    bytes memory _proof_rlp
                ) external returns (bool) {
                    bytes32 state_root = IBlockHashOracle(ScrvusdVerifierV1.BLOCK_HASH_ORACLE).get_state_root(_block_number);

                    uint256 period = _extractPeriodFromProof(state_root, _proof_rlp);
                    return IScrvusdOracleV2(SCRVUSD_ORACLE).update_profit_max_unlock_time(period, _block_number);
                }

                /// @dev Extract period from the state proof using the given state root.
                function _extractPeriodFromProof(
                    bytes32 stateRoot,
                    bytes memory proofRlp
                ) internal view returns (uint256) {
                    RLPReader.RLPItem[] memory proofs = proofRlp.toRlpItem().toList();
                    require(proofs.length == 2, "Invalid number of proofs");

                    // Extract account proof
                    Verifier.Account memory account = Verifier.extractAccountFromProof(
                        ScrvusdVerifierV1.SCRVUSD_HASH,
                        stateRoot,
                        proofs[0].toList()
                    );
                    require(account.exists, "scrvUSD account does not exist");

                    Verifier.SlotValue memory slot = Verifier.extractSlotValueFromProof(
                        keccak256(abi.encode(PERIOD_SLOT)),
                        account.storageRoot,
                        proofs[1].toList()
                    );
                    require(slot.exists);

                    return slot.value;
                }
            }
            ```
