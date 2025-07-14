A viewer contract deployed to Ethereum mainnet that provides access to block numbers and hashes. This contract is useful for cross-chain applications that need to verify block data from Ethereum mainnet. To prevent reorg-related issues, it only returns hashes for blocks that are at least 65 blocks old.

This contract is called off-chain via LayerZero's `lzRead` functionality.

???+ vyper "`MainnetBlockView.vy`"
    The source code for the `MainnetBlockView.vy` contract can be found on [:material-github: GitHub](https://github.com/curvefi/blockhash-oracle/blob/main/contracts/MainnetBlockView.vy). The contract is written using [Vyper](https://github.com/vyperlang/vyper) version `0.4.3`.

    The contract is deployed on :logos-ethereum: Ethereum at [`0xb10CfacE69cc0B7F1AE0Dc8E6aD186914f6e7EEA`](https://etherscan.io/address/0xb10CfacE69cc0B7F1AE0Dc8E6aD186914f6e7EEA).

    ??? abi "Contract ABI"
    
        ```json
        [{"inputs":[],"name":"get_blockhash","outputs":[{"name":"","type":"uint256"},{"name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[{"name":"_block_number","type":"uint256"}],"name":"get_blockhash","outputs":[{"name":"","type":"uint256"},{"name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[{"name":"_block_number","type":"uint256"},{"name":"_avoid_failure","type":"bool"}],"name":"get_blockhash","outputs":[{"name":"","type":"uint256"},{"name":"","type":"bytes32"}],"stateMutability":"view","type":"function"}]
        ```


---


### `get_blockhash`
!!! description "`MainnetBlockView.get_blockhash(_block_number: uint256 = block.number - 65, _avoid_failure: bool = False) -> (uint256, bytes32)`"

    Retrieves the block hash for a given block number. The valid range for historical block hashes is between the last 64 and the last 8192 blocks.

    Block Range Constraints:

    - **Too recent**: Blocks within the last 64 blocks (to mitigate Ethereum Mainnet reorg risk)
    - **Too old:** Blocks older than 8192 blocks (EVM limit post EIP-2935)
    - **Valid range:** Between `block.number - 8192` and `block.number - 64`

    **Returns:** A tuple containing `(block_number, block_hash)`

    | Input  | Type      | Description           |
    | ------ | --------- | --------------------- |
    | `_block_number` | `uint256` | Block number to get the hash for. Defaults to `block.number - 65` |
    | `_avoid_failure` | `bool` | If `True`, returns `(0, 0x0)` on failure instead of reverting. Useful for cross-chain calls. |

    ??? quote "Source code"

        === "MainnetBlockView.vy"

            ```python
            from snekmate.utils import block_hash as snekmate_block_hash

            @view
            @external
            def get_blockhash(
                _block_number: uint256 = block.number - 65, _avoid_failure: bool = False
            ) -> (uint256, bytes32):
                """
                @notice Get block hash for a given block number.
                @dev The valid range for historical block hashes is between the last 64
                    and the last 8192 blocks.
                @param _block_number Block number to get hash for, defaults to block.number - 65.
                @param _avoid_failure If True, returns (0, 0x0) on failure instead of reverting.
                @return Tuple of (actual block number, block hash).
                """
                # Use a local variable for the requested block number.
                requested_block_number: uint256 = _block_number

                # If the default value was passed as 0 (e.g., from a cross-chain call
                # that doesn't know the current block number), set a safe default.
                if requested_block_number == 0:
                    requested_block_number = block.number - 65

                # Check for invalid conditions first to exit early.
                # The requested block must be at least 64 blocks old for reorg protection
                # and not more than 8192 blocks old, which is the EVM's limit post EIP-2935.
                is_too_recent: bool = requested_block_number >= block.number - 64
                is_too_old: bool = requested_block_number <= block.number - 8192

                if is_too_recent or is_too_old:
                    if _avoid_failure:
                        # For sensitive callers (like LayerZero), return a zeroed response
                        # instead of reverting the transaction.
                        return 0, empty(bytes32)
                    else:
                        # Revert with a descriptive custom error.
                        raise ("Block is too recent or too old")
                # If all checks pass, retrieve and return the blockhash.
                return requested_block_number, snekmate_block_hash._block_hash(requested_block_number)
            ```

        === "block_hash.vy"

            Source code of this Vyper module can be found [:material-github: here](https://github.com/pcaversaccio/snekmate/blob/main/src/snekmate/utils/block_hash.vy).

            ```python
            # pragma version ~=0.4.3
            # pragma nonreentrancy off
            """
            @title Utility Functions to Access Historical Block Hashes
            @custom:contract-name block_hash
            @license GNU Affero General Public License v3.0 only
            @author pcaversaccio
            @notice These functions can be used to access the historical block
                    hashes beyond the default 256-block limit. We use the EIP-2935
                    (https://eips.ethereum.org/EIPS/eip-2935) history contract,
                    which maintains a ring buffer of the last 8,191 block hashes
                    stored in state. For the blocks within the last 256 blocks,
                    we use the native `BLOCKHASH` opcode. For blocks between 257
                    and 8,191 blocks ago, the function `_block_hash` queries via
                    the specified `get` (https://eips.ethereum.org/EIPS/eip-2935#get)
                    method the EIP-2935 history contract. For blocks older than
                    8,191 or future blocks (including the current one), we return
                    zero, matching the `BLOCKHASH` behaviour.

                    Please note that after EIP-2935 is activated, it takes 8,191
                    blocks to fully populate the history. Before that, only block
                    hashes from the fork block onward are available.
            """


            # @dev The `HISTORY_STORAGE_ADDRESS` contract address.
            # @notice See the EIP-2935 specifications here: https://eips.ethereum.org/EIPS/eip-2935#specification.
            _HISTORY_STORAGE_ADDRESS: constant(address) = 0x0000F90827F1C53a10cb7A02335B175320002935


            # @dev The `keccak256` hash of the runtime bytecode of the
            # history contract deployed at `HISTORY_STORAGE_ADDRESS`.
            _HISTORY_STORAGE_RUNTIME_BYTECODE_HASH: constant(bytes32) = (
                0x6e49e66782037c0555897870e29fa5e552daf4719552131a0abce779daec0a5d
            )


            @deploy
            @payable
            def __init__():
                """
                @dev To omit the opcodes for checking the `msg.value`
                    in the creation-time EVM bytecode, the constructor
                    is declared as `payable`.
                """
                pass


            @internal
            @view
            def _block_hash(block_number: uint256) -> bytes32:
                """
                @dev Returns the block hash for block number `block_number`.
                @notice For blocks older than 8,191 or future blocks (including
                        the current one), returns zero, matching the `BLOCKHASH`
                        behaviour. Furthermore, this function does verify if the
                        history contract is deployed. If the history contract is
                        undeployed, the function will fallback to the `BLOCKHASH`
                        behaviour.
                @param block_number The 32-byte block number.
                @return bytes32 The 32-byte block hash for block number `block_number`.
                """
                # For future blocks (including the current one), we already return
                # an empty `bytes32` value here in order not to iterate through the
                # remaining code.
                if block_number >= block.number:
                    return empty(bytes32)

                delta: uint256 = unsafe_sub(block.number, block_number)

                if delta <= 256:
                    return blockhash(block_number)
                elif delta > 8191 or _HISTORY_STORAGE_ADDRESS.codehash != _HISTORY_STORAGE_RUNTIME_BYTECODE_HASH:
                    # The Vyper built-in function `blockhash` reverts if the block number
                    # is more than `256` blocks behind the current block. We explicitly
                    # handle this case (i.e. `delta > 8191`) to ensure the function returns
                    # an empty `bytes32` value rather than reverting (i.e. exactly matching
                    # the `BLOCKHASH` opcode behaviour).
                    return empty(bytes32)
                else:
                    return self._get_history_storage(block_number)


            @internal
            @view
            def _get_history_storage(block_number: uint256) -> bytes32:
                """
                @dev Returns the block hash for block number `block_number` by
                    calling the `HISTORY_STORAGE_ADDRESS` contract address.
                @notice Please note that for any request outside the range of
                        `[block.number - 8191, block.number - 1]`, this function
                        reverts (see https://eips.ethereum.org/EIPS/eip-2935#get).
                        Furthermore, this function does not verify if the history
                        contract is deployed. If the history contract is undeployed,
                        the function will return an empty `bytes32` value.
                @param block_number The 32-byte block number.
                @return bytes32 The 32-byte block hash for block number `block_number`.
                """
                return convert(
                    raw_call(
                        _HISTORY_STORAGE_ADDRESS,
                        abi_encode(block_number),
                        max_outsize=32,
                        is_static_call=True,
                    ),
                    bytes32,
                )
            ```

    === "Example 1"

        Get the default block hash (65 blocks ago)

        ```shell
        >>> MainnetBlockView.get_blockhash()
        (22787735, 0x74fd0de77691b8408e795cfea10366f6ba340fcf2800d019abea8945d07fcb72)
        ```

    === "Example 2"

        Get a specific block hash

        ```shell
        >>> MainnetBlockView.get_blockhash(22787600)
        (22787600, 0x4bdaa00a7e9b85a9ab25565ef2d2de8817cbba08dd0c6880ecee4ac4674e1378)
        ```

    === "Example 3"

        Use avoid_failure parameter

        ```shell
        >>> MainnetBlockView.get_blockhash(22787809, True)  # Too recent
        (0, 0x0000000000000000000000000000000000000000000000000000000000000000)
        ```

    === "Example 4"

        Error when block is too recent (without avoid_failure)

        ```shell
        >>> MainnetBlockView.get_blockhash(1, False)  # Will revert
        Error: Returned error: execution reverted: Block is too recent or too old
        ```
