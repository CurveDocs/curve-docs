<h1>Optimism Block Hash Oracle</h1>


# BlockHashOracle

### `commit`
!!! description "`BlockHashOracle.commit(_block_number: uint256) -> uint256: view`"

    Function to commit (and apply) a block hash.

    Returns: block number (`uint256`).

    ??? quote "Source code"

        === "BlockHashOracle.vy"

            ```python
            event CommitBlockHash:
                committer: indexed(address)
                number: indexed(uint256)
                hash: bytes32

            event ApplyBlockHash:
                number: indexed(uint256)
                hash: bytes32

            L1_BLOCK: constant(IL1Block) = IL1Block(0x4200000000000000000000000000000000000015)

            block_hash: public(HashMap[uint256, bytes32])
            commitments: public(HashMap[address, HashMap[uint256, bytes32]])

            @external
            def commit() -> uint256:
                """
                @notice Commit (and apply) a block hash.
                @dev Same as `apply()` but saves committer
                """
                number: uint256 = 0
                hash: bytes32 = empty(bytes32)
                number, hash = self._update_block_hash()

                self.commitments[msg.sender][number] = hash
                log CommitBlockHash(msg.sender, number, hash)
                log ApplyBlockHash(number, hash)
                return number

            @internal
            def _update_block_hash() -> (uint256, bytes32):
                number: uint256 = convert(staticcall L1_BLOCK.number(), uint256)
                hash: bytes32 = staticcall L1_BLOCK.hash()
                self.block_hash[number] = hash

                return number, hash
            ```

    === "Example"

        ```py
        >>> BlockHashOracle.commit()
        ```


### `apply`
!!! description "`BlockHashOracle.apply() -> uint256: view`"

    Function to apply a block hash.

    Returns: block number (`uint256`).

    ??? quote "Source code"

        === "BlockHashOracle.vy"

            ```python
            event CommitBlockHash:
                committer: indexed(address)
                number: indexed(uint256)
                hash: bytes32

            event ApplyBlockHash:
                number: indexed(uint256)
                hash: bytes32

            L1_BLOCK: constant(IL1Block) = IL1Block(0x4200000000000000000000000000000000000015)

            block_hash: public(HashMap[uint256, bytes32])
            commitments: public(HashMap[address, HashMap[uint256, bytes32]])

            @external
            def apply() -> uint256:
                """
                @notice Apply a block hash.
                """
                number: uint256 = 0
                hash: bytes32 = empty(bytes32)
                number, hash = self._update_block_hash()

                log ApplyBlockHash(number, hash)
                return number

            @internal
            def _update_block_hash() -> (uint256, bytes32):
                number: uint256 = convert(staticcall L1_BLOCK.number(), uint256)
                hash: bytes32 = staticcall L1_BLOCK.hash()
                self.block_hash[number] = hash

                return number, hash
            ```

    === "Example"

        ```py
        >>> BlockHashOracle.apply()
        ```


### `get_block_hash`
!!! description "`BlockHashOracle.get_block_hash(_number: uint256) -> bytes32: view`"

    Getter for the block hash of a given block number. This function will revert if the block hash has not been set.

    Returns: block hash (`bytes32`).

    ??? quote "Source code"

        === "BlockHashOracle.vy"

            ```python
            block_hash: public(HashMap[uint256, bytes32])

            @view
            @external
            def get_block_hash(_number: uint256) -> bytes32:
                """
                @notice Query the block hash of a block.
                @dev Reverts for block numbers which have yet to be set.
                """
                block_hash: bytes32 = self.block_hash[_number]
                assert block_hash != empty(bytes32)

                return block_hash
            ```

    === "Example"

        This example returns the block hash for block number 21192041 (on Ethereum).

        ```py
        >>> BlockHashOracle.get_block_hash(21192041)
        '0x9db78f319e1bfde9cb0723b6e96de3dce6d378b01b341a5e45546ac4b7f7269a'

        >>> BlockHashOracle.get_block_hash(21192042)
        Error: Returned error: execution reverted
        ```


### `block_hash`
!!! description "`BlockHashOracle.block_hash(_number: uint256) -> bytes32: view`"

    Getter for the block hash of a given block number.

    Returns: block hash (`bytes32`).

    ??? quote "Source code"

        === "BlockHashOracle.vy"

            ```python
            block_hash: public(HashMap[uint256, bytes32])
            ```

    === "Example"

        This example returns the block hash for block number 21192041 (on Ethereum).

        ```py
        >>> BlockHashOracle.block_hash(21192041)
        '0x9db78f319e1bfde9cb0723b6e96de3dce6d378b01b341a5e45546ac4b7f7269a'

        >>> BlockHashOracle.block_hash(21192042)
        '0x0000000000000000000000000000000000000000000000000000000000000000'
        ```


### `commitments`
!!! description "`BlockHashOracle.commitments(_committer: address, _number: uint256) -> bytes32: view`"

    Getter for the block hash of a given block number.

    Returns: block hash (`bytes32`).

    | Input | Type | Description |
    | ----- | ---- | ----------- |
    | `_committer` | `address` | The committer's address. |
    | `_number` | `uint256` | The block number. |

    ??? quote "Source code"

        === "BlockHashOracle.vy"

            ```python
            commitments: public(HashMap[address, HashMap[uint256, bytes32]])
            ```

    === "Example"

        ```py
        >>> BlockHashOracle.commitments('0x0000000000000000000000000000000000000000', 21192041)
        '0x9db78f319e1bfde9cb0723b6e96de3dce6d378b01b341a5e45546ac4b7f7269a'
        ```


### `version`
!!! description "`BlockHashOracle.version() -> String[8]: view`"

    Getter for the version of the contract.

    Returns: version (`String[8]`).

    ??? quote "Source code"

        === "BlockHashOracle.vy"

            ```python
            version: public(constant(String[8])) = "0.0.1"
            ```

    === "Example"

        ```py
        >>> BlockHashOracle.version()
        '0.0.1'
        ```
