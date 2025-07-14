<h1>BlockOracle</h1>

The `BlockOracle` contract is a decentralized block hash oracle which implements a threshold-based, multi-committer consensus mechanism for block hash commitments. Trusted committers submit and validate block hashes; once a threshold of matching commitments is reached, the block hash is confirmed and becomes immutable. The contract supports secure, permissionless block hash storage, committers management, threshold configuration, and integration with external header verifiers for cross-chain and state proof use cases.

???+ vyper "`BlockOracle.vy`"
    The source code for the `BlockOracle.vy` contract can be found on [:material-github: GitHub](https://github.com/curvefi/blockhash-oracle/blob/main/contracts/BlockOracle.vy). The contract is written using [Vyper](https://github.com/vyperlang/vyper) version `0.4.3`.

    The contract is deployed on all supported chains at `0xb10cface69821Ff7b245Cf5f28f3e714fDbd86b8`.

    ??? abi "Contract ABI"
        ```json
        [{"anonymous":false,"inputs":[{"indexed":true,"name":"committer","type":"address"},{"indexed":true,"name":"block_number","type":"uint256"},{"indexed":false,"name":"block_hash","type":"bytes32"}],"name":"CommitBlock","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"block_number","type":"uint256"},{"indexed":false,"name":"block_hash","type":"bytes32"}],"name":"ApplyBlock","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"block_number","type":"uint256"},{"indexed":false,"name":"block_hash","type":"bytes32"}],"name":"SubmitBlockHeader","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"committer","type":"address"}],"name":"AddCommitter","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"committer","type":"address"}],"name":"RemoveCommitter","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"new_threshold","type":"uint256"}],"name":"SetThreshold","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"old_verifier","type":"address"},{"indexed":true,"name":"new_verifier","type":"address"}],"name":"SetHeaderVerifier","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"previous_owner","type":"address"},{"indexed":true,"name":"new_owner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"inputs":[],"name":"owner","outputs":[{"name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"name":"new_owner","type":"address"}],"name":"transfer_ownership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"renounce_ownership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"name":"_verifier","type":"address"}],"name":"set_header_verifier","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"name":"_committer","type":"address"}],"name":"add_committer","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"name":"_committer","type":"address"},{"name":"_bump_threshold","type":"bool"}],"name":"add_committer","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"name":"_committer","type":"address"}],"name":"remove_committer","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"name":"_new_threshold","type":"uint256"}],"name":"set_threshold","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"name":"_block_number","type":"uint256"},{"name":"_block_hash","type":"bytes32"}],"name":"admin_apply_block","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"name":"_block_number","type":"uint256"},{"name":"_block_hash","type":"bytes32"}],"name":"commit_block","outputs":[{"name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"name":"_block_number","type":"uint256"},{"name":"_block_hash","type":"bytes32"},{"name":"_apply","type":"bool"}],"name":"commit_block","outputs":[{"name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"name":"_block_number","type":"uint256"},{"name":"_block_hash","type":"bytes32"}],"name":"apply_block","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"components":[{"name":"block_hash","type":"bytes32"},{"name":"parent_hash","type":"bytes32"},{"name":"state_root","type":"bytes32"},{"name":"receipt_root","type":"bytes32"},{"name":"block_number","type":"uint256"},{"name":"timestamp","type":"uint256"}],"name":"_header_data","type":"tuple"}],"name":"submit_block_header","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"get_all_committers","outputs":[{"name":"","type":"address[]"}],"stateMutability":"view","type":"function"},{"inputs":[{"name":"_block_number","type":"uint256"}],"name":"get_block_hash","outputs":[{"name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[{"name":"_block_number","type":"uint256"}],"name":"get_state_root","outputs":[{"name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"last_confirmed_block_number","outputs":[{"name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"header_verifier","outputs":[{"name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"name":"arg0","type":"uint256"}],"name":"block_header","outputs":[{"components":[{"name":"block_hash","type":"bytes32"},{"name":"parent_hash","type":"bytes32"},{"name":"state_root","type":"bytes32"},{"name":"receipt_root","type":"bytes32"},{"name":"block_number","type":"uint256"},{"name":"timestamp","type":"uint256"}],"name":"","type":"tuple"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"last_confirmed_header","outputs":[{"components":[{"name":"block_hash","type":"bytes32"},{"name":"parent_hash","type":"bytes32"},{"name":"state_root","type":"bytes32"},{"name":"receipt_root","type":"bytes32"},{"name":"block_number","type":"uint256"},{"name":"timestamp","type":"uint256"}],"name":"","type":"tuple"}],"stateMutability":"view","type":"function"},{"inputs":[{"name":"arg0","type":"uint256"}],"name":"committers","outputs":[{"name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"name":"arg0","type":"address"}],"name":"is_committer","outputs":[{"name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"name":"arg0","type":"uint256"},{"name":"arg1","type":"bytes32"}],"name":"commitment_count","outputs":[{"name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"name":"arg0","type":"address"},{"name":"arg1","type":"uint256"}],"name":"committer_votes","outputs":[{"name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"threshold","outputs":[{"name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"outputs":[],"stateMutability":"nonpayable","type":"constructor"}]
        ```



---


# **Committers**

Committers are tracked on-chain and are required for consensus operations. Only the contract owner can modify the committer set; all users can query committer status.

## Managing Committers

Owner-only functions for adding or removing committers, as well as retrieving the current committer list. These operations directly affect consensus security, as only committers can submit or update block hash commitments. Exceeding the maximum committer count (32) is prevented at the contract level.

### `add_committer`
!!! description "`BlockOracle.add_committer(_committer: address, _bump_threshold: bool = False)`"

    !!!guard "Guarded Method by [Snekmate 🐍](https://github.com/pcaversaccio/snekmate)"
        This contract makes use of a Snekmate module to manage roles and permissions. This specific function can only be called by the current `owner` of the contract.

    Function to add a committer.

    Event: `AddCommitter`

    | Input  | Type      | Description           |
    | ------ | --------- | --------------------- |
    | `_committer` | `address` | Address of the committer to add |
    | `_bump_threshold` | `bool` | If true, automatically increase threshold by 1 |

    ??? quote "Source code"

        === "BlockOracle.vy"

            ```python
            event AddCommitter:
                committer: indexed(address)

            MAX_COMMITTERS: constant(uint256) = 32
            committers: public(DynArray[address, MAX_COMMITTERS])  # List of all committers
            is_committer: public(HashMap[address, bool])

            threshold: public(uint256)

            @external
            def add_committer(_committer: address, _bump_threshold: bool = False):
                """
                @notice Set trusted address that can commit block data
                @param _committer Address of trusted committer
                @param _bump_threshold If True, bump threshold to 1 more (useful for initial setup)
                """

                ownable._check_owner()
                if not self.is_committer[_committer]:
                    assert len(self.committers) < MAX_COMMITTERS, "Max committers reached"
                    self.is_committer[_committer] = True
                    self.committers.append(_committer)
                    log  AddCommitter(committer=_committer)

                    if _bump_threshold:
                        self.threshold += 1
            ```

    === "Example"

        ```shell
        >>> BlockOracle.add_committer('0x1234567890123456789012345678901234567890', False)
        ```

### `remove_committer`
!!! description "`BlockOracle.remove_committer(_committer: address)`"

    !!!guard "Guarded Method by [Snekmate 🐍](https://github.com/pcaversaccio/snekmate)"
        This contract makes use of a Snekmate module to manage roles and permissions. This specific function can only be called by the current `owner` of the contract.

    Function to remove a committer.

    Emits: `RemoveCommitter`

    | Input  | Type      | Description           |
    | ------ | --------- | --------------------- |
    | `_committer` | `address` | Address of the committer to remove |

    ??? quote "Source code"

        === "BlockOracle.vy"

            ```python
            event RemoveCommitter:
                committer: indexed(address)

            MAX_COMMITTERS: constant(uint256) = 32
            committers: public(DynArray[address, MAX_COMMITTERS])  # List of all committers
            is_committer: public(HashMap[address, bool])

            @external
            def remove_committer(_committer: address):
                """
                @notice Remove trusted address that can commit block data
                @param _committer Address of trusted committer
                """

                ownable._check_owner()
                if self.is_committer[_committer]:
                    self.is_committer[_committer] = False

                    # Rebuild committers array excluding the removed committer
                    new_committers: DynArray[address, MAX_COMMITTERS] = []
                    for committer: address in self.committers:
                        if committer != _committer:
                            new_committers.append(committer)
                    self.committers = new_committers

                    log  RemoveCommitter(committer=_committer)
            ```

    === "Example"

        ```shell
        >>> BlockOracle.remove_committer('0x1234567890123456789012345678901234567890')
        ```

### `get_all_committers`
!!! description "`BlockOracle.get_all_committers() -> DynArray[address, MAX_COMMITTERS]`"

    Getter which returns all registered committers.

    Returns: array of all committers (`DynArray[address, MAX_COMMITTERS]`)

    ??? quote "Source code"

        === "BlockOracle.vy"

            ```python
            MAX_COMMITTERS: constant(uint256) = 32
            committers: public(DynArray[address, MAX_COMMITTERS])  # List of all committers

            @view
            @external
            def get_all_committers() -> DynArray[address, MAX_COMMITTERS]:
                """
                @notice Utility viewer that returns list of all committers
                @return Array of all registered committer addresses
                """
                return self.committers
            ```

    === "Example"

        ```shell
        >>> BlockOracle.get_all_committers()
        ['0xFacEFeeD696BFC0ebe7EaD3FFBb9a56290d31752']
        ```

### `committers`
!!! description "`BlockOracle.committers(arg0: uint256) -> address: view`"

    Getter for the committers at a specific index.

    Returns: address of the committer at the specified index

    | Input  | Type      | Description           |
    | ------ | --------- | --------------------- |
    | `arg0` | `uint256` | Index of the committer  |

    ??? quote "Source code"

        === "BlockOracle.vy"

            ```python
            MAX_COMMITTERS: constant(uint256) = 32
            committers: public(DynArray[address, MAX_COMMITTERS])  # List of all committers
            ```

    === "Example"

        This example returns the committer at index 0.

        ```shell
        >>> BlockOracle.committers(0)
        '0xFacEFeeD696BFC0ebe7EaD3FFBb9a56290d31752'
        ```

### `is_committer`
!!! description "`BlockOracle.is_committer(arg0: address) -> bool: view`"

    Getter to check if a certain address is a committer.

    Returns: true if the address is a committer, false otherwise

    | Input  | Type      | Description           |
    | ------ | --------- | --------------------- |
    | `arg0` | `address` | Address to check  |

    ??? quote "Source code"

        === "BlockOracle.vy"

            ```python
            is_committer: public(HashMap[address, bool])
            ```

    === "Example"

        ```shell
        >>> BlockOracle.is_committer('0xFacEFeeD696BFC0ebe7EaD3FFBb9a56290d31752')
        True
        ```

## Threshold Management

Owner-only functions for setting and querying the threshold parameter, which defines the minimum number of matching committer votes required to confirm a block hash. The threshold cannot exceed the number of registered committers.

### `set_threshold`
!!! description "`BlockOracle.set_threshold(_new_threshold: uint256)`"

    !!!guard "Guarded Method by [Snekmate 🐍](https://github.com/pcaversaccio/snekmate)"
        This contract makes use of a Snekmate module to manage roles and permissions. This specific function can only be called by the current `owner` of the contract.

    Function to update the threshold for block applications.

    Emits: `SetThreshold`

    | Input  | Type      | Description           |
    | ------ | --------- | --------------------- |
    | `_new_threshold` | `uint256` | New `threshold` value  |

    ??? quote "Source code"

        === "BlockOracle.vy"

            ```python
            event SetThreshold:
                new_threshold: indexed(uint256)

            threshold: public(uint256)

            @external
            def set_threshold(_new_threshold: uint256):
                """
                @notice Update threshold for block application
                @param _new_threshold New threshold value
                """

                ownable._check_owner()
                assert _new_threshold <= len(
                    self.committers
                ), "Threshold cannot be greater than number of committers"
                self.threshold = _new_threshold

                log  SetThreshold(new_threshold=_new_threshold)
            ```

    === "Example"

        ```shell
        >>> BlockOracle.set_threshold(2)
        ```

### `threshold`
!!! description "`BlockOracle.threshold() -> uint256: view`"

    Getter for the threshold of how many matching commitments required to confirm a block.

    Returns: number of commitments required (uint256).

    ??? quote "Source code"

        === "BlockOracle.vy"

            ```python
            threshold: public(uint256)
            ```

    === "Example"

        ```shell
        >>> BlockOracle.threshold()
        1
        ```

---

# **Committing Block Hashes**

Only registered committers may call commit functions. The contract maintains a mapping of committer votes and a count of votes per block hash. Commitments are mutable until a block is confirmed; after confirmation, the block hash is immutable.

### `commit_block`
!!! description "`BlockOracle.commit_block(_block_number: uint256, _block_hash: bytes32, _apply: bool = True) -> bool`"

    Function to commit a block hash and optionally attempt to apply it.

    Returns: bool if the block was applied

    Event: `CommitBlock`

    | Input  | Type      | Description           |
    | ------ | --------- | --------------------- |
    | `_block_number` | `uint256` | Block number to commit  |
    | `_block_hash` | `bytes32` | The hash to commit |
    | `_apply` | `bool` | `true` -> check if threshold is met and applies the block. |

    ??? quote "Source code"

        === "BlockOracle.vy"

            ```python
            @external
            def commit_block(_block_number: uint256, _block_hash: bytes32, _apply: bool = True) -> bool:
                """
                @notice Commit a block hash and optionally attempt to apply it
                @param _block_number The block number to commit
                @param _block_hash The hash to commit
                @param _apply If True, checks if threshold is met and applies block
                @return True if block was applied
                """

                assert self.is_committer[msg.sender], "Not authorized"
                assert self.block_hash[_block_number] == empty(bytes32), "Already applied"
                assert _block_hash != empty(bytes32), "Invalid block hash"

                previous_commitment: bytes32 = self.committer_votes[msg.sender][_block_number]

                # Remove previous vote if exists, to avoid duplicate commitments
                if previous_commitment != empty(bytes32):
                    self.commitment_count[_block_number][previous_commitment] -= 1

                self.committer_votes[msg.sender][_block_number] = _block_hash
                self.commitment_count[_block_number][_block_hash] += 1
                log  CommitBlock(committer=msg.sender, block_number=_block_number, block_hash=_block_hash)

                # Optional attempt to apply block
                if _apply and self.commitment_count[_block_number][_block_hash] >= self.threshold:
                    self._apply_block(_block_number, _block_hash)
                    return True
                return False
            ```

    === "Example"

        ```shell
        >>> BlockOracle.commit_block(22788903, 0xc215221221dd6673ae7ed2e50f47f6d020034657bb4a08010b5677a1f9d06d6d, True)
        True
        ```

### `committer_votes`
!!! description "`BlockOracle.committer_votes(arg0: address, arg1: uint256) -> bytes32: view`"

    Getter for the committed hash by a specific committer for a specific block number.

    Returns: committed hash for the committer and block number, or empty bytes32 if no commitment

    | Input  | Type      | Description           |
    | ------ | --------- | --------------------- |
    | `arg0` | `address` | Address of the committer |
    | `arg1` | `uint256` | Block number |

    ??? quote "Source code"

        === "BlockOracle.vy"

            ```python
            committer_votes: public(
                HashMap[address, HashMap[uint256, bytes32]]
            )  # committer => block_number => committed_hash
            ```

    === "Example"

        ```shell
        >>> BlockOracle.committer_votes('0xFacEFeeD696BFC0ebe7EaD3FFBb9a56290d31752', 22788903)
        '0xc215221221dd6673ae7ed2e50f47f6d020034657bb4a08010b5677a1f9d06d6d'
        ```

### `commitment_count`
!!! description "`BlockOracle.commitment_count(arg0: uint256, arg1: bytes32) -> uint256: view`"

    Getter for the number of commitments for a specific hash at a specific block number.

    Returns: number of commitments for the hash at the block number

    | Input  | Type      | Description           |
    | ------ | --------- | --------------------- |
    | `arg0` | `uint256` | Block number |
    | `arg1` | `bytes32` | Hash to get count for |

    ??? quote "Source code"

        === "BlockOracle.vy"

            ```python
            commitment_count: public(
                HashMap[uint256, HashMap[bytes32, uint256]]
            )  # block_number => hash => count
            ```

    === "Example"

        ```shell
        >>> BlockOracle.commitment_count(22788903, 0xc215221221dd6673ae7ed2e50f47f6d020034657bb4a08010b5677a1f9d06d6d)
        1
        ```

---

# **Block Application**

Block application includes both permissionless (anyone can call) and owner-only (admin) application. Also provides views for querying confirmed block hashes and the most recent confirmed block number. Once applied, block hashes are immutable and serve as the canonical record for the oracle.

### `apply_block`
!!! description "`BlockOracle.apply_block(_block_number: uint256, _block_hash: bytes32)`"

    Function to apply a block hash if it has sufficient commitments.

    Event: `ApplyBlock`

    | Input  | Type      | Description           |
    | ------ | --------- | --------------------- |
    | `_block_number` | `uint256` | Block number to apply  |
    | `_block_hash` | `bytes32` | The block hash to apply |

    ??? quote "Source code"

        === "BlockOracle.vy"

            ```python
            event ApplyBlock:
                block_number: indexed(uint256)
                block_hash: bytes32

            block_hash: HashMap[uint256, bytes32]  # block_number => hash
            last_confirmed_block_number: public(uint256)  # number of the last confirmed block hash

            @external
            def apply_block(_block_number: uint256, _block_hash: bytes32):
                """
                @notice Apply a block hash if it has sufficient commitments
                @param _block_number The block number to apply
                @param _block_hash The block hash to apply
                """

                assert self.block_hash[_block_number] == empty(bytes32), "Already applied"
                assert (
                    self.commitment_count[_block_number][_block_hash] >= self.threshold
                ), "Insufficient commitments"
                self._apply_block(_block_number, _block_hash)

            @internal
            def _apply_block(_block_number: uint256, _block_hash: bytes32):
                """
                @notice Confirm a block hash and apply it
                @dev All security checks must be performed outside!
                @param _block_number The block number to confirm
                @param _block_hash The hash to confirm
                """

                self.block_hash[_block_number] = _block_hash
                if self.last_confirmed_block_number < _block_number:
                    self.last_confirmed_block_number = _block_number
                log  ApplyBlock(block_number=_block_number, block_hash=_block_hash)
            ```

    === "Example"

        ```shell
        >>> BlockOracle.apply_block(22788903, 0xc215221221dd6673ae7ed2e50f47f6d020034657bb4a08010b5677a1f9d06d6d)
        ```

### `admin_apply_block`
!!! description "`BlockOracle.admin_apply_block(_block_number: uint256, _block_hash: bytes32)`"

    !!!guard "Guarded Method by [Snekmate 🐍](https://github.com/pcaversaccio/snekmate)"
        This contract makes use of a Snekmate module to manage roles and permissions. This specific function can only be called by the current `owner` of the contract.

    Function to apply a block hash with admin rights.

    | Input  | Type      | Description           |
    | ------ | --------- | --------------------- |
    | `_block_number` | `uint256` | Block number to apply  |
    | `_block_hash` | `bytes32` | Hash to apply |

    ??? quote "Source code"

        === "BlockOracle.vy"

            ```python
            @external
            def admin_apply_block(_block_number: uint256, _block_hash: bytes32):
                """
                @notice Apply a block hash with admin rights
                @param _block_number The block number to apply
                @param _block_hash The hash to apply
                @dev Only callable by owner
                """

                ownable._check_owner()
                self._apply_block(_block_number, _block_hash)
            ```

    === "Example"

        ```shell
        >>> BlockOracle.admin_apply_block(22788903, 0xc215221221dd6673ae7ed2e50f47f6d020034657bb4a08010b5677a1f9d06d6d)
        ```

### `get_block_hash`
!!! description "`BlockOracle.get_block_hash(_block_number: uint256) -> bytes32`"

    Getter for the confirmed block hash for a given block number.

    Returns: confirmed block hash or empty `bytes32` if not confirmed

    | Input  | Type      | Description           |
    | ------ | --------- | --------------------- |
    | `_block_number` | `uint256` | Block number  |

    ??? quote "Source code"

        === "BlockOracle.vy"

            ```python
            block_hash: HashMap[uint256, bytes32]  # block_number => hash

            @view
            @external
            def get_block_hash(_block_number: uint256) -> bytes32:
                """
                @notice Get the confirmed block hash for a given block number
                @param _block_number The block number to query
                @return The confirmed block hash, or empty bytes32 if not confirmed
                """
                return self.block_hash[_block_number]
            ```

    === "Example"

        ```shell
        >>> BlockOracle.get_block_hash(22788903)
        '0xc215221221dd6673ae7ed2e50f47f6d020034657bb4a08010b5677a1f9d06d6d'
        ```

### `last_confirmed_block_number`
!!! description "`BlockOracle.last_confirmed_block_number() -> uint256: view`"

    Getter for the last confirmed block number.

    Returns: most recently confirmed block number (uint256).

    ??? quote "Source code"

        === "BlockOracle.vy"

            ```python
            last_confirmed_block_number: public(uint256)  # number of the last confirmed block hash
            ```

    === "Example"

        ```shell
        >>> BlockOracle.last_confirmed_block_number()
        22788903
        ```

---

# **Block Headers**

Functions for submitting and retrieving full block headers. Only the designated verifier contract may submit headers, which must match a previously confirmed block hash. Includes views for retrieving the state root, full header data, and the most recently confirmed header. These features enable advanced use cases such as state proofs and cross-chain verification.

### `submit_block_header`
!!! description "`BlockOracle.submit_block_header(_header_data: bh_rlp.BlockHeader)`"

    !!!guard "Guarded Method by [Snekmate 🐍](https://github.com/pcaversaccio/snekmate)"
        This contract makes use of a Snekmate module to manage roles and permissions. This specific function can only be called by the current `owner` of the contract.

    Function to submit a block header.

    Emits: `SubmitBlockHeader`

    | Input  | Type      | Description           |
    | ------ | --------- | --------------------- |
    | `_header_data` | `bh_rlp.BlockHeader` | Block header to submit  |

    ??? quote "Source code"

        === "BlockOracle.vy"

            ```python
            # Import RLP Block Header Decoder
            from modules import BlockHeaderRLPDecoder as bh_rlp

            block_hash: HashMap[uint256, bytes32]  # block_number => hash
            last_confirmed_block_number: public(uint256)  # number of the last confirmed block hash
            header_verifier: public(address)  # address of the header verifier

            block_header: public(HashMap[uint256, bh_rlp.BlockHeader])  # block_number => header
            last_confirmed_header: public(bh_rlp.BlockHeader)  # last confirmed header

            @external
            def submit_block_header(_header_data: bh_rlp.BlockHeader):
                """
                @notice Submit block header. Available only to whitelisted verifier contract.
                @param _header_data The block header to submit
                """
                assert msg.sender == self.header_verifier, "Not authorized"

                # Safety checks
                assert _header_data.block_hash != empty(bytes32), "Invalid block hash"
                assert self.block_hash[_header_data.block_number] != empty(bytes32), "Blockhash not applied"
                assert _header_data.block_hash == self.block_hash[_header_data.block_number], "Blockhash does not match"
                assert self.block_header[_header_data.block_number].block_hash == empty(bytes32), "Header already submitted"

                # Store decoded header
                self.block_header[_header_data.block_number] = _header_data

                # Update last confirmed header if new
                if _header_data.block_number > self.last_confirmed_header.block_number:
                    self.last_confirmed_header = _header_data

                log  SubmitBlockHeader(
                    block_number=_header_data.block_number,
                    block_hash=_header_data.block_hash,
                )
            ```

    === "Example"

        ```shell
        >>> BlockOracle.submit_block_header(header_data)
        ```

### `get_state_root`
!!! description "`BlockOracle.get_state_root(_block_number: uint256) -> bytes32`"

    Getter for the state root for a given block number.

    Returns: state root from the block header, or empty `bytes32` if the header is not submitted.

    | Input  | Type      | Description           |
    | ------ | --------- | --------------------- |
    | `_block_number` | `uint256` | Block number |

    ??? quote "Source code"

        === "BlockOracle.vy"

            ```python
            @view
            @external
            def get_state_root(_block_number: uint256) -> bytes32:
                """
                @notice Get the state root for a given block number
                @param _block_number The block number to query
                @return The state root from the block header, or empty bytes32 if header not submitted
                """
                return self.block_header[_block_number].state_root
            ```

    === "Example"

        ```shell
        >>> BlockOracle.get_state_root(22788903)
        '0x1338f27ed74ec2766875e2db65ca08b79fd2ce67a4f800acac4fa264e99a1984'
        ```

### `block_header`
!!! description "`BlockOracle.block_header(arg0: uint256) -> tuple: view`"

    Getter for the block header for a specific block number.

    Returns: block header tuple containing (parent_hash, state_root, transactions_root, receipts_root, block_number, timestamp)

    | Input  | Type      | Description           |
    | ------ | --------- | --------------------- |
    | `arg0` | `uint256` | Block number |

    ??? quote "Source code"

        === "BlockOracle.vy"

            ```python
            block_header: public(HashMap[uint256, bh_rlp.BlockHeader])  # block_number => header
            ```

    === "Example"

        ```shell
        >>> BlockOracle.block_header(22788903)
        
        0xc215221221dd6673ae7ed2e50f47f6d020034657bb4a08010b5677a1f9d06d6d, 0x1338f27ed74ec2766875e2db65ca08b79fd2ce67a4f800acac4fa264e99a1984, 0x168986623a9cca07db8e17253b119dc1e93d68c2838e59c8cb5a10a88f5ad7a7, 0x46a8b05c582e75b876b106621e02542c6a9b3608d10d3e1973f3bf5aae9639a1,22788903,1750944347
        ```

### `last_confirmed_header`
!!! description "`BlockOracle.last_confirmed_header() -> tuple: view`"

    Getter for the last confirmed header.

    Returns: block header tuple of the most recently confirmed header

    ??? quote "Source code"

        === "BlockOracle.vy"

            ```python
            last_confirmed_header: public(bh_rlp.BlockHeader)  # last confirmed header
            ```

    === "Example"

        ```shell
        >>> BlockOracle.last_confirmed_header()
        0xc215221221dd6673ae7ed2e50f47f6d020034657bb4a08010b5677a1f9d06d6d, 0x1338f27ed74ec2766875e2db65ca08b79fd2ce67a4f800acac4fa264e99a1984, 0x168986623a9cca07db8e17253b119dc1e93d68c2838e59c8cb5a10a88f5ad7a7, 0x46a8b05c582e75b876b106621e02542c6a9b3608d10d3e1973f3bf5aae9639a1,22788903,1750944347
        ```

---

# **Verifier**

Owner-only functions for setting and querying the verifier contract address. The verifier is responsible for submitting RLP-encoded block headers. Proper verifier management is essential for the integrity of header submissions and downstream state proof operations.

### `set_header_verifier`
!!! description "`BlockOracle.set_header_verifier(_verifier: address)`"

    !!!guard "Guarded Method by [Snekmate 🐍](https://github.com/pcaversaccio/snekmate)"
        This contract makes use of a Snekmate module to manage roles and permissions. This specific function can only be called by the current `owner` of the contract.

    Function to set the block header verifier.

    Emits: `SetHeaderVerifier`

    | Input  | Type      | Description           |
    | ------ | --------- | --------------------- |
    | `_verifier` | `address` | Block verifier address  |

    ??? quote "Source code"

        === "BlockOracle.vy"

            ```python
            event SetHeaderVerifier:
                old_verifier: indexed(address)
                new_verifier: indexed(address)

            header_verifier: public(address)  # address of the header verifier

            @external
            def set_header_verifier(_verifier: address):
                """
                @notice Set the block header verifier
                @dev Emits SetHeaderVerifier event
                @param _verifier Address of the block header verifier
                """

                ownable._check_owner()
                old_verifier: address = self.header_verifier
                self.header_verifier = _verifier
                log SetHeaderVerifier(old_verifier=old_verifier, new_verifier=_verifier)
            ```

    === "Example"

        ```shell
        >>> BlockOracle.set_header_verifier('0x1234567890123456789012345678901234567890')
        ```

### `header_verifier`
!!! description "`BlockOracle.header_verifier() -> address: view`"

    Getter for the block header verifier.

    Returns: verifier (`address`)

    ??? quote "Source code"

        === "BlockOracle.vy"

            ```python
            header_verifier: public(address)  # address of the header verifier
            ```

    === "Example"

        ```shell
        >>> BlockOracle.header_verifier()
        '0xB10CDEC0DE69c88a47c280a97A5AEcA8b0b83385'
        ```

---

# **Ownership**

Standard Ownable interface for querying the current owner and transferring or renouncing ownership. Ownership controls all privileged operations, including committer management, threshold updates, and verifier assignment. Owner of the contract is the DAO.
