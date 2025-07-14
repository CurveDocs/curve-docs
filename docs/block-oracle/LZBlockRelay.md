<h1>LZBlockRelay</h1>

The `LZBlockRelay` contract is a cross-chain block hash relay built on LayerZero’s messaging protocol, designed for deployment on multiple EVM-compatible chains alongside the `BlockOracle` and `MainnetBlockView` contracts. Its core function is to securely and efficiently relay recent Ethereum mainnet block hashes to other chains, enabling trust-minimized cross-chain state proofs and interoperability.

Operating in two modes — **read-enabled** (which can request and broadcast block hashes) and **broadcast-only** (which only receives broadcasts) — the contract verifies incoming LayerZero messages, commits block hashes to the local `BlockOracle`, and, when appropriate, rebroadcasts them to additional chains. All LayerZero peer and channel configurations are owner-controlled to ensure only trusted sources are permitted, supporting robust, decentralized, and secure cross-chain communication.

???+ vyper "`LZBlockRelay.vy`"
    The source code for the `LZBlockRelay.vy` contract can be found on [:material-github: GitHub](https://github.com/curvefi/blockhash-oracle/blob/main/contracts/messengers/LZBlockRelay.vy). The contract is written using [Vyper](https://github.com/vyperlang/vyper) version `0.4.3`.

    The contract is deployed on all supported chains at `0xFacEFeeD696BFC0ebe7EaD3FFBb9a56290d31752`.

    ??? abi "Contract ABI"

        ```json
        [{"anonymous":false,"inputs":[{"indexed":true,"name":"block_number","type":"uint256"},{"indexed":true,"name":"block_hash","type":"bytes32"},{"components":[{"name":"eid","type":"uint32"},{"name":"fee","type":"uint256"}],"indexed":false,"name":"targets","type":"tuple[]"}],"name":"BlockHashBroadcast","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"previous_owner","type":"address"},{"indexed":true,"name":"new_owner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"eid","type":"uint32"},{"indexed":false,"name":"peer","type":"bytes32"}],"name":"PeerSet","type":"event"},{"inputs":[],"name":"owner","outputs":[{"name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"name":"new_owner","type":"address"}],"name":"transfer_ownership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"renounce_ownership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"endpoint","outputs":[{"name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"name":"arg0","type":"uint32"}],"name":"peers","outputs":[{"name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[{"name":"_eid","type":"uint32"},{"name":"_peer","type":"bytes32"}],"name":"setPeer","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"name":"_delegate","type":"address"}],"name":"setDelegate","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"components":[{"name":"srcEid","type":"uint32"},{"name":"sender","type":"bytes32"},{"name":"nonce","type":"uint64"}],"name":"_origin","type":"tuple"},{"name":"_message","type":"bytes"},{"name":"_sender","type":"address"}],"name":"isComposeMsgSender","outputs":[{"name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"components":[{"name":"srcEid","type":"uint32"},{"name":"sender","type":"bytes32"},{"name":"nonce","type":"uint64"}],"name":"_origin","type":"tuple"}],"name":"allowInitializePath","outputs":[{"name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"name":"_srcEid","type":"uint32"},{"name":"_sender","type":"bytes32"}],"name":"nextNonce","outputs":[{"name":"","type":"uint64"}],"stateMutability":"pure","type":"function"},{"inputs":[{"name":"_is_enabled","type":"bool"},{"name":"_read_channel","type":"uint32"},{"name":"_mainnet_eid","type":"uint32"},{"name":"_mainnet_view","type":"address"}],"name":"set_read_config","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"name":"_eids","type":"uint32[]"},{"name":"_peers","type":"address[]"}],"name":"set_peers","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"name":"_oracle","type":"address"}],"name":"set_block_oracle","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"name":"_amount","type":"uint256"}],"name":"withdraw_eth","outputs":[],"stateMutability":"nonpayable","type":"function"},{"stateMutability":"payable","type":"fallback"},{"inputs":[{"name":"_read_gas_limit","type":"uint128"},{"name":"_value","type":"uint128"}],"name":"quote_read_fee","outputs":[{"name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"name":"_target_eids","type":"uint32[]"},{"name":"_lz_receive_gas_limit","type":"uint128"}],"name":"quote_broadcast_fees","outputs":[{"name":"","type":"uint256[]"}],"stateMutability":"view","type":"function"},{"inputs":[{"name":"_target_eids","type":"uint32[]"},{"name":"_target_fees","type":"uint256[]"},{"name":"_lz_receive_gas_limit","type":"uint128"},{"name":"_read_gas_limit","type":"uint128"}],"name":"request_block_hash","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"name":"_target_eids","type":"uint32[]"},{"name":"_target_fees","type":"uint256[]"},{"name":"_lz_receive_gas_limit","type":"uint128"},{"name":"_read_gas_limit","type":"uint128"},{"name":"_block_number","type":"uint256"}],"name":"request_block_hash","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"name":"_target_eids","type":"uint32[]"},{"name":"_target_fees","type":"uint256[]"},{"name":"_lz_receive_gas_limit","type":"uint128"}],"name":"broadcast_latest_block","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"components":[{"name":"srcEid","type":"uint32"},{"name":"sender","type":"bytes32"},{"name":"nonce","type":"uint64"}],"name":"_origin","type":"tuple"},{"name":"_guid","type":"bytes32"},{"name":"_message","type":"bytes"},{"name":"_executor","type":"address"},{"name":"_extraData","type":"bytes"}],"name":"lzReceive","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[],"name":"read_enabled","outputs":[{"name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"read_channel","outputs":[{"name":"","type":"uint32"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"mainnet_eid","outputs":[{"name":"","type":"uint32"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"mainnet_block_view","outputs":[{"name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"block_oracle","outputs":[{"name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"name":"_endpoint","type":"address"}],"outputs":[],"stateMutability":"nonpayable","type":"constructor"}]
        ```

---

## **Configuration & Ownership**

This section covers owner-only functions for configuring LayerZero channels, peers, delegates, and the block oracle. These functions are critical for secure cross-chain operation and must be managed by the contract owner (DAO).

### `set_read_config`
!!! description "`LZBlockRelay.set_read_config(_is_enabled, _read_channel, _mainnet_eid, _mainnet_view)`"

    !!!guard "Guarded Method by [Snekmate 🐍](https://github.com/pcaversaccio/snekmate)"
        This contract makes use of a Snekmate module to manage roles and permissions. This specific function can only be called by the current `owner` of the contract.

    Configure read functionality

    | Input         | Type      | Description                          |
    |--------------|-----------|--------------------------------------|
    | `_is_enabled`    | `bool`    | Whether this contract can initiate reads |
    | `_read_channel`  | `uint32`  | LZ read channel ID                   |
    | `_mainnet_eid`   | `uint32`  | Mainnet endpoint ID                  |
    | `_mainnet_view`  | `address` | MainnetBlockView contract address    |

    ??? quote "Source code"

        === "LZBlockRelay.vy"

            ```python
            read_enabled: public(bool)
            read_channel: public(uint32)
            mainnet_eid: public(uint32)
            mainnet_block_view: public(address)

            @external
            def set_read_config(
                _is_enabled: bool, _read_channel: uint32, _mainnet_eid: uint32, _mainnet_view: address
            ):
                """
                @notice Configure read functionality
                @param _is_enabled Whether this contract can initiate reads
                @param _read_channel LZ read channel ID
                @param _mainnet_eid Mainnet endpoint ID
                @param _mainnet_view MainnetBlockView contract address
                """
                ownable._check_owner()

                assert _read_channel > OApp.READ_CHANNEL_THRESHOLD, "Invalid read channel"

                assert (_is_enabled and _mainnet_eid != 0 and _mainnet_view != empty(address)) or (
                    not _is_enabled and _mainnet_eid == 0 and _mainnet_view == empty(address)
                ), "Invalid read config"

                # Clean up old peer if switching channels while read is enabled
                # This prevents leaving stale peer mappings when changing read channels
                if self.read_enabled and self.read_channel != _read_channel:
                    OApp._setPeer(self.read_channel, convert(empty(address), bytes32))

                self.read_enabled = _is_enabled
                self.read_channel = _read_channel
                self.mainnet_eid = _mainnet_eid
                self.mainnet_block_view = _mainnet_view

                peer: bytes32 = convert(self, bytes32) if _is_enabled else convert(empty(address), bytes32)
                OApp._setPeer(_read_channel, peer)
            ```

        === "OApp.vy"

            ```py
            event PeerSet:
                eid: uint32
                peer: bytes32

            # Mapping to store peers associated with corresponding endpoints
            peers: public(HashMap[uint32, bytes32])

            @internal
            def _setPeer(_eid: uint32, _peer: bytes32):
                """
                @notice Internal function to set peer address
                @param _eid The endpoint ID.
                @param _peer The address of the peer to be associated with the corresponding endpoint.
                """
                self.peers[_eid] = _peer

                log PeerSet(eid=_eid, peer=_peer)
            ```

### `set_block_oracle`
!!! description "`LZBlockRelay.set_block_oracle(_oracle: address)`"

    !!!guard "Guarded Method by [Snekmate 🐍](https://github.com/pcaversaccio/snekmate)"
        This contract makes use of a Snekmate module to manage roles and permissions. This specific function can only be called by the current `owner` of the contract.

    Sets the BlockOracle address for this contract.

    | Input     | Type    | Description                |
    |-----------|---------|----------------------------|
    | _oracle   | address | The BlockOracle address to set. |

    ??? quote "Source code"

        === "LZBlockRelay.vy"

            ```python
            interface IBlockOracle:
                def commit_block(block_number: uint256, block_hash: bytes32) -> bool: nonpayable
                def last_confirmed_block_number() -> uint256: view
                def get_block_hash(block_number: uint256) -> bytes32: view

            from snekmate.auth import ownable

            @external
            def set_block_oracle(_oracle: address):
                """
                @notice Set the block oracle address
                @param _oracle Block oracle address
                """
                ownable._check_owner()

                self.block_oracle = IBlockOracle(_oracle)
            ```

    === "Example"

        ```shell
        >>> LZBlockRelay.set_block_oracle('0xb10cface69821Ff7b245Cf5f28f3e714fDbd86b8')
        ```

### `withdraw_eth`
!!! description "`LZBlockRelay.withdraw_eth(_amount: uint256)`"

    !!!guard "Guarded Method by [Snekmate 🐍](https://github.com/pcaversaccio/snekmate)"
        This contract makes use of a Snekmate module to manage roles and permissions. This specific function can only be called by the current `owner` of the contract.

    Withdraws ETH from the contract. ETH can be accumulated from LayerZero refunds.

    | Input   | Type    | Description                |
    |---------|---------|----------------------------|
    | _amount | uint256 | Amount of ETH to withdraw. |

    ??? quote "Source code"

        === "LZBlockRelay.vy"

            ```python
            from snekmate.auth import ownable

            @external
            def withdraw_eth(_amount: uint256):
                """
                @notice Withdraw ETH from contract
                @dev ETH can be accumulated from LZ refunds
                @param _amount Amount to withdraw
                """
                ownable._check_owner()

                assert self.balance >= _amount, "Insufficient balance"
                send(msg.sender, _amount)
            ```

    === "Example"

        ```shell
        >>> LZBlockRelay.withdraw_eth(1000000000000000000)
        ```


---


# **LayerZero Messaging & Peers**

This section documents LayerZero-specific configuration and peer management. These functions are critical for secure cross-chain communication. Only trusted peers should be set to avoid malicious message injection.

### `endpoint`
!!! description "`LZBlockRelay.endpoint() -> address: view`"

    Getter for the LayerZero endpoint.

    Returns: Lz Endpoint (`address`).

    ??? quote "Source code"

        === "LZBlockRelay.vy"

            ```python
            from ..modules.oapp_vyper.src import OApp  # main module

            exports: (
                OApp.endpoint,
                OApp.peers,
                OApp.setPeer,
                OApp.setDelegate,
                OApp.isComposeMsgSender,
                OApp.allowInitializePath,
                OApp.nextNonce,
            )
            ```

        === "OApp.vy"

            ```python
            # LayerZero EndpointV2 interface
            interface ILayerZeroEndpointV2:
                def quote(_params: MessagingParams, _sender: address) -> MessagingFee: view
                def send(_params: MessagingParams, _refundAddress: address) -> MessagingReceipt: payable
                def setDelegate(_delegate: address): nonpayable
                def eid() -> uint32: view
                def lzToken() -> address: view

            # The LayerZero endpoint associated with the given OApp
            endpoint: public(immutable(ILayerZeroEndpointV2))
            ```

    === "Example"

        endpoint on Arbitrum

        ```shell
        >>> LZBlockRelay.endpoint()
        '0x1a44076050125825900e736c501f859c50fE728c'
        ```

### `peers`
!!! description "`LZBlockRelay.peers(_eid: uint32) -> bytes32: view`"

    Getter for the peer address (OApp instance) for a given endpoint ID.

    Returns: peer address (`bytes32`) for the given endpoint ID.

    | Input | Type   | Description      |
    |-------|--------|------------------|
    | `_eid`  | `uint32` | The endpoint ID. |

    ??? quote "Source code"

        === "LZBlockRelay.vy"

            ```python
            from ..modules.oapp_vyper.src import OApp  # main module

            exports: (
                OApp.endpoint,
                OApp.peers,
                OApp.setPeer,
                OApp.setDelegate,
                OApp.isComposeMsgSender,
                OApp.allowInitializePath,
                OApp.nextNonce,
            )
            ```

        === "OApp.vy"

            ```python
            # Mapping to store peers associated with corresponding endpoints
            peers: public(HashMap[uint32, bytes32])
            ```

    === "Example"

        ```shell
        >>> LZBlockRelay.peers(0)
        '0x0000000000000000000000000000000000000000000000000000000000000000'
        ```

### `setPeer`
!!! description "`LZBlockRelay.setPeer(_eid: uint32, _peer: bytes32)`"

    !!!guard "Guarded Method by [Snekmate 🐍](https://github.com/pcaversaccio/snekmate)"
        This contract makes use of a Snekmate module to manage roles and permissions. This specific function can only be called by the current `owner` of the contract.

    Sets the peer address (OApp instance) for a corresponding endpoint. This establishes a trusted cross-chain communication channel.

    | Input | Type   | Description                      |
    |-------|--------|----------------------------------|
    | `_eid`  | `uint32` | The endpoint ID.                 |
    | `_peer` | `bytes32`| The peer address (OApp instance) |

    ??? quote "Source code"

        === "LZBlockRelay.vy"

            ```python
            from ..modules.oapp_vyper.src import OApp  # main module

            exports: (
                OApp.endpoint,
                OApp.peers,
                OApp.setPeer,
                OApp.setDelegate,
                OApp.isComposeMsgSender,
                OApp.allowInitializePath,
                OApp.nextNonce,
            )
            ```

        === "OApp.vy"

            ```python
            event PeerSet:
                eid: uint32
                peer: bytes32

            # Mapping to store peers associated with corresponding endpoints
            peers: public(HashMap[uint32, bytes32])

            @external
            def setPeer(_eid: uint32, _peer: bytes32):
                """
                @notice Sets the peer address (OApp instance) for a corresponding endpoint.
                @param _eid The endpoint ID.
                @param _peer The address of the peer to be associated with the corresponding endpoint.
                @dev Only the owner/admin of the OApp can call this function.
                @dev Indicates that the peer is trusted to send LayerZero messages to this OApp.
                @dev Set this to bytes32(0) to remove the peer address.
                @dev Peer is a bytes32 to accommodate non-evm chains.
                """
                ownable._check_owner()

                self._setPeer(_eid, _peer)

            @internal
            def _setPeer(_eid: uint32, _peer: bytes32):
                """
                @notice Internal function to set peer address
                @param _eid The endpoint ID.
                @param _peer The address of the peer to be associated with the corresponding endpoint.
                """
                self.peers[_eid] = _peer

                log PeerSet(eid=_eid, peer=_peer)
            ```

### `set_peers`
!!! description "`LZBlockRelay.set_peers(_eids: DynArray[uint32, MAX_N_BROADCAST], _peers: DynArray[address, MAX_N_BROADCAST])`"

    Function to set peers for a corresponding endpoints. This is a batched version of the `OApp.setPeer` that accepts EVM addresses only.

    | Input    | Type                              | Description                      |
    |----------|-----------------------------------|----------------------------------|
    | `_eids`  | `DynArray[uint32, MAX_N_BROADCAST]` | The endpoint IDs                 |
    | `_peers` | `DynArray[address, MAX_N_BROADCAST]` | Addresses of the peers to associate |

    ??? quote "Source code"

        === "LZBlockRelay.vy"

            ```python
            from ..modules.oapp_vyper.src import OApp  # main module

            exports: (
                OApp.endpoint,
                OApp.peers,
                OApp.setPeer,
                OApp.setDelegate,
                OApp.isComposeMsgSender,
                OApp.allowInitializePath,
                OApp.nextNonce,
            )

            @external
            def set_peers(_eids: DynArray[uint32, MAX_N_BROADCAST], _peers: DynArray[address, MAX_N_BROADCAST]):
                """
                @notice Set peers for a corresponding endpoints. Batched version of OApp.setPeer that accept address (EVM only).
                @param _eids The endpoint IDs.
                @param _peers Addresses of the peers to be associated with the corresponding endpoints.
                """
                ownable._check_owner()

                assert len(_eids) == len(_peers), "Invalid peer arrays"
                for i: uint256 in range(0, len(_eids), bound=MAX_N_BROADCAST):
                    OApp._setPeer(_eids[i], convert(_peers[i], bytes32))
            ```

        === "OApp.vy"

            ```python
            event PeerSet:
                eid: uint32
                peer: bytes32

            # Mapping to store peers associated with corresponding endpoints
            peers: public(HashMap[uint32, bytes32])

            @internal
            def _setPeer(_eid: uint32, _peer: bytes32):
                """
                @notice Internal function to set peer address
                @param _eid The endpoint ID.
                @param _peer The address of the peer to be associated with the corresponding endpoint.
                """
                self.peers[_eid] = _peer

                log PeerSet(eid=_eid, peer=_peer)
            ```

### `setDelegate`
!!! description "`LZBlockRelay.setDelegate(_delegate: address)`"

    !!!guard "Guarded Method by [Snekmate 🐍](https://github.com/pcaversaccio/snekmate)"
        This contract makes use of a Snekmate module to manage roles and permissions. This specific function can only be called by the current `owner` of the contract.

    Sets the delegate address for the OApp. The delegate can manage LayerZero configurations on behalf of the contract.

    | Input      | Type      | Description                        |
    |------------|-----------|------------------------------------|
    | `_delegate`  | `address`   | The address of the delegate to set. |

    ??? quote "Source code"

        === "LZBlockRelay.vy"

            ```python
            from ..modules.oapp_vyper.src import OApp  # main module

            exports: (
                OApp.endpoint,
                OApp.peers,
                OApp.setPeer,
                OApp.setDelegate,
                OApp.isComposeMsgSender,
                OApp.allowInitializePath,
                OApp.nextNonce,
            )
            ```

        === "OApp.vy"

            ```python
            # LayerZero EndpointV2 interface
            interface ILayerZeroEndpointV2:
                def quote(_params: MessagingParams, _sender: address) -> MessagingFee: view
                def send(_params: MessagingParams, _refundAddress: address) -> MessagingReceipt: payable
                def setDelegate(_delegate: address): nonpayable
                def eid() -> uint32: view
                def lzToken() -> address: view

            @external
            def setDelegate(_delegate: address):
                """
                @notice Sets the delegate address for the OApp.
                @param _delegate The address of the delegate to be set.
                @dev Only the owner/admin of the OApp can call this function.
                @dev Provides the ability for a delegate to set configs, on behalf of the OApp,
                directly on the Endpoint contract.
                """
                ownable._check_owner()

                extcall endpoint.setDelegate(_delegate)
            ```

### `isComposeMsgSender`
!!! description "`LZBlockRelay.isComposeMsgSender(_origin: Origin, _message: Bytes[MAX_MESSAGE_SIZE], _sender: address) -> bool`"

    Funtion to check whether an address is an approved composeMsg sender to the Endpoint.

    Returns: true or false (`bool`)

    | Input  | Type      | Description           |
    | ------ | --------- | --------------------- |
    | `_origin` | `Origin` | Struct containing of srcEid, sender and nonce  |
    | `_message` | `Bytes[MAX_MESSAGE_SIZE]` | The sender address  |
    | `_sender` | `address` |  The sender address |

    ??? quote "Source code"

        === "LZBlockRelay.vy"

            ```python
            from ..modules.oapp_vyper.src import OApp  # main module

            exports: (
                OApp.endpoint,
                OApp.peers,
                OApp.setPeer,
                OApp.setDelegate,
                OApp.isComposeMsgSender,
                OApp.allowInitializePath,
                OApp.nextNonce,
            )
            ```

        === "OApp.vy"

            ```python
            struct Origin:
                srcEid: uint32
                sender: bytes32
                nonce: uint64

            @external
            @view
            def isComposeMsgSender(
                _origin: Origin, _message: Bytes[MAX_MESSAGE_SIZE], _sender: address
            ) -> bool:
                """
                @notice Indicates whether an address is an approved composeMsg sender to the Endpoint.
                @param _origin The origin information containing the source endpoint and sender address.
                @param _message The lzReceive payload.
                @param _sender The sender address.
                @return isSender Is a valid sender.
                """
                return _sender == self
            ```

### `allowInitializePath`
!!! description "`LZBlockRelay.allowInitializePath(_origin: Origin) -> bool`"

    Function to check if the path initialization is allowed based on the provided origin.

    Returns: true or false (`bool`)

    | Input  | Type      | Description           |
    | ------ | --------- | --------------------- |
    | `_origin` | `Origin` | Struct containing of srcEid, sender and nonce  |

    ??? quote "Source code"

        === "LZBlockRelay.vy"

            ```python
            from ..modules.oapp_vyper.src import OApp  # main module

            exports: (
                OApp.endpoint,
                OApp.peers,
                OApp.setPeer,
                OApp.setDelegate,
                OApp.isComposeMsgSender,
                OApp.allowInitializePath,
                OApp.nextNonce,
            )
            ```

        === "OApp.vy"

            ```python
            struct Origin:
                srcEid: uint32
                sender: bytes32
                nonce: uint64

            @external
            @view
            def allowInitializePath(_origin: Origin) -> bool:
                """
                @notice Checks if the path initialization is allowed based on the provided origin.
                @param _origin The origin information containing the source endpoint and sender address.
                @return Whether the path has been initialized.
                @dev This indicates to the endpoint that the OApp has enabled msgs for this particular path to be received.
                @dev This defaults to assuming if a peer has been set, its initialized.
                """
                return self.peers[_origin.srcEid] == _origin.sender
            ```

### `nextNonce`
!!! description "`LZBlockRelay.nextNonce(_srcEid: uint32, _sender: bytes32) -> uint64`"

    !!!warning
        Vyper-specific: If your app relies on ordered execution, you must change this function. By default this is NOT enabled. ie. nextNonce is hardcoded to return 0.

    Function which retrieves the next nonce for a given source endpoint and sender address. The path nonce starts from 1. If 0 is returned it means that there is NO nonce ordered enforcement. Is required by the off-chain executor to determine the OApp expects msg execution is ordered. This is also enforced by the OApp.

    Returns: next nonce (`uint64`)

    | Input  | Type      | Description           |
    | ------ | --------- | --------------------- |
    | `_srcEid` | `uint32` | The source endpoint ID.  |
    | `_sender` | `bytes32` | The sender address. |

    ??? quote "Source code"

        === "LZBlockRelay.vy"

            ```python
            from ..modules.oapp_vyper.src import OApp  # main module

            exports: (
                OApp.endpoint,
                OApp.peers,
                OApp.setPeer,
                OApp.setDelegate,
                OApp.isComposeMsgSender,
                OApp.allowInitializePath,
                OApp.nextNonce,
            )
            ```

        === "OApp.vy"

            ```python
            @external
            @pure
            def nextNonce(_srcEid: uint32, _sender: bytes32) -> uint64:
                """
                @notice Retrieves the next nonce for a given source endpoint and sender address.
                @dev Vyper-specific: If your app relies on ordered execution, you must change this function.
                @param _srcEid The source endpoint ID.
                @param _sender The sender address.
                @return nonce The next nonce.
                @dev The path nonce starts from 1. If 0 is returned it means that there is NO nonce ordered enforcement.
                @dev Is required by the off-chain executor to determine the OApp expects msg execution is ordered.
                @dev This is also enforced by the OApp.
                @dev By default this is NOT enabled. ie. nextNonce is hardcoded to return 0.
                """
                return 0
            ```


---


# **Block Hash Operations**

This section covers the core cross-chain and block hash relay logic. These functions are responsible for requesting, broadcasting, and receiving block hashes. 

!!!info
    Currently, only block hashes received via trusted LayerZero channels are committed to the oracle. Later on, more channels can be added.


### `request_block_hash`
!!! description "`LZBlockRelay.request_block_hash(_target_eids: DynArray[uint32, MAX_N_BROADCAST], _target_fees: DynArray[uint256, MAX_N_BROADCAST], _lz_receive_gas_limit: uint128, _read_gas_limit: uint128, _block_number: uint256 = 0):`"

    Function to request a block hash from mainnet and broadcast it to specified targets. User must ensure `msg.value` is sufficient. The caller covers read fee (`quote_read_fee`) and broadcast fee (`quote_broadcast_fees`).

    | Input  | Type      | Description           |
    | ------ | --------- | --------------------- |
    | `_target_eids` | `DynArray[uint32, MAX_N_BROADCAST]` | List of chain IDs to broadcast to |
    | `_target_fees` | `DynArray[uint256, MAX_N_BROADCAST]` | List of fees per chain (must match _target_eids length) |
    | `_lz_receive_gas_limit` | `uint128` | Gas limit for lzReceive (same for all targets) |
    | `_read_gas_limit` | `uint128` | Gas limit for read operation |
    | `_block_number` | `uint256` | Optional block number (0 means latest) |

    ??? quote "Source code"

        === "LZBlockRelay.vy"

            ```python
            @external
            @payable
            def request_block_hash(
                _target_eids: DynArray[uint32, MAX_N_BROADCAST],
                _target_fees: DynArray[uint256, MAX_N_BROADCAST],
                _lz_receive_gas_limit: uint128,
                _read_gas_limit: uint128,
                _block_number: uint256 = 0,
            ):
                """
                @notice Request block hash from mainnet and broadcast to specified targets
                @param _target_eids List of chain IDs to broadcast to
                @param _target_fees List of fees per chain (must match _target_eids length)
                @param _lz_receive_gas_limit Gas limit for lzReceive (same for all targets)
                @param _read_gas_limit Gas limit for read operation
                @param _block_number Optional block number (0 means latest)
                @dev User must ensure msg.value is sufficient:
                    - must cover read fee (quote_read_fee)
                    - must cover broadcast fees (quote_broadcast_fees)
                """

                assert self.read_enabled, "Read not enabled"
                assert len(_target_eids) == len(_target_fees), "Length mismatch"

                self._request_block_hash(
                    _block_number,
                    _target_eids,
                    _target_fees,
                    _lz_receive_gas_limit,
                    _read_gas_limit,
                )

            @internal
            @payable
            def _request_block_hash(
                _block_number: uint256,
                _target_eids: DynArray[uint32, MAX_N_BROADCAST],
                _target_fees: DynArray[uint256, MAX_N_BROADCAST],
                _lz_receive_gas_limit: uint128,
                _read_gas_limit: uint128,
            ):
                """
                @notice Internal function to request block hash from mainnet and broadcast to specified targets
                @param _block_number Block number to request
                @param _target_eids Target EIDs to broadcast to
                @param _target_fees Target fees to pay per broadcast
                @param _lz_receive_gas_limit Gas limit for lzReceive
                @param _read_gas_limit Gas limit for read operation
                """

                # Store target EIDs and fees for lzReceive
                cached_targets: DynArray[BroadcastTarget, MAX_N_BROADCAST] = []
                sum_target_fees: uint256 = 0
                for i: uint256 in range(0, len(_target_eids), bound=MAX_N_BROADCAST):
                    cached_targets.append(BroadcastTarget(eid=_target_eids[i], fee=_target_fees[i]))
                    sum_target_fees += _target_fees[i]

                assert sum_target_fees <= msg.value, "Insufficient value" # dev: check is here because we sum here

                message: Bytes[OApp.MAX_MESSAGE_SIZE] = self._prepare_read_request(_block_number)

                # Create options using OptionsBuilder module
                options: Bytes[OptionsBuilder.MAX_OPTIONS_TOTAL_SIZE] = OptionsBuilder.newOptions()
                options = OptionsBuilder.addExecutorLzReadOption(
                    options, _read_gas_limit, READ_RETURN_SIZE, convert(sum_target_fees, uint128)
                )

                # Send message
                fees: OApp.MessagingFee = OApp.MessagingFee(nativeFee=msg.value, lzTokenFee=0)
                # Fees = read fee + broadcast fees (value of read return message)
                receipt: OApp.MessagingReceipt = OApp._lzSend(
                    self.read_channel, message, options, fees, msg.sender # dev: refund excess fee to sender
                )

                # Store targets for lzReceive using receipt.guid as key
                self.broadcast_data[receipt.guid] = BroadcastData(
                    targets=cached_targets,
                    gas_limit=_lz_receive_gas_limit,
                )
            ```

    === "Example"

        ```shell
        >>> soon
        ```

### `broadcast_latest_block`
!!! description "`LZBlockRelay.broadcast_latest_block(_target_eids: DynArray[uint32, MAX_N_BROADCAST], _target_fees: DynArray[uint256, MAX_N_BROADCAST], _lz_receive_gas_limit: uint128):`"

    !!!info
        Only broadcast what was received via lzRead to prevent potentially malicious hashes from other sources

    Function to broadcast the latest confirmed block hash to specified chains.


    | Input  | Type      | Description           |
    | ------ | --------- | --------------------- |
    | `_target_eids` | `DynArray[uint32, MAX_N_BROADCAST]` | List of chain IDs to broadcast to |
    | `_target_fees` | `DynArray[uint256, MAX_N_BROADCAST]` | List of fees per chain (must match _target_eids length) |
    | `_lz_receive_gas_limit` | `uint128` | Gas limit for lzReceive (same for all targets) |

    ??? quote "Source code"

        === "LZBlockRelay.vy"

            ```python
            @external
            @payable
            def broadcast_latest_block(
                _target_eids: DynArray[uint32, MAX_N_BROADCAST],
                _target_fees: DynArray[uint256, MAX_N_BROADCAST],
                _lz_receive_gas_limit: uint128,
            ):
                """
                @notice Broadcast latest confirmed block hash to specified chains
                @param _target_eids List of chain IDs to broadcast to
                @param _target_fees List of fees per chain (must match _target_eids length)
                @param _lz_receive_gas_limit Gas limit for lzReceive (same for all targets)
                @dev Only broadcast what was received via lzRead to prevent potentially malicious hashes from other sources
                """

                assert self.read_enabled, "Can only broadcast from read-enabled chains"
                assert self.block_oracle != empty(IBlockOracle), "Oracle not configured"
                assert len(_target_eids) == len(_target_fees), "Length mismatch"

                # Get latest block from oracle
                block_number: uint256 = staticcall self.block_oracle.last_confirmed_block_number()
                block_hash: bytes32 = staticcall self.block_oracle.get_block_hash(block_number)
                assert block_hash != empty(bytes32), "No confirmed blocks"

                # Only broadcast if this block was received via lzRead
                assert self.received_blocks[block_number] == block_hash, "Unknown source"

                # Prepare broadcast targets
                broadcast_targets: DynArray[BroadcastTarget, MAX_N_BROADCAST] = []
                for i: uint256 in range(0, len(_target_eids), bound=MAX_N_BROADCAST):
                    broadcast_targets.append(BroadcastTarget(eid=_target_eids[i], fee=_target_fees[i]))

                self._broadcast_block(
                    block_number,
                    block_hash,
                    BroadcastData(targets=broadcast_targets, gas_limit=_lz_receive_gas_limit),
                    msg.sender,
                )
            ```

    === "Example"

        ```shell
        >>> soon
        ```

### `lzReceive`
!!! description "`LZBlockRelay.lzReceive(_origin: OApp.Origin, _guid: bytes32, _message: Bytes[OApp.MAX_MESSAGE_SIZE], _executor: address, _extraData: Bytes[OApp.MAX_EXTRA_DATA_SIZE])`"

    Handles incoming LayerZero messages, including block hash read responses from mainnet and block hash broadcasts from other chains. Verifies the message source, commits the block hash to the local BlockOracle, and, if appropriate, rebroadcasts the hash to additional chains. Only block hashes received via trusted LayerZero channels are committed.

    This function may emit events such as block hash commit or broadcast events, depending on the message type and contract state.

    | Input        | Type                              | Description                                                                 |
    |-------------|-----------------------------------|-----------------------------------------------------------------------------|
    | `_origin`   | `OApp.Origin`                     | Struct containing the source endpoint ID (`srcEid`), sender address, and nonce. Used to verify the message source. |
    | `_guid`     | `bytes32`                         | Global unique identifier for the message, used for tracking and rebroadcast logic. |
    | `_message`  | `Bytes[OApp.MAX_MESSAGE_SIZE]`    | Encoded message payload containing the block number and block hash.          |
    | `_executor` | `address`                         | Address of the executor for the message.                                     |
    | `_extraData`| `Bytes[OApp.MAX_EXTRA_DATA_SIZE]` | Additional data passed by the executor, used for advanced LayerZero features.|

    ??? quote "Source code"

        === "LZBlockRelay.vy"

            ```python
            @payable
            @external
            def lzReceive(
                _origin: OApp.Origin,
                _guid: bytes32,
                _message: Bytes[OApp.MAX_MESSAGE_SIZE],
                _executor: address,
                _extraData: Bytes[OApp.MAX_EXTRA_DATA_SIZE],
            ):
                """
                @notice Handle messages: read responses, and regular messages
                @dev Two types of messages:
                    1. Read responses (from read channel)
                    2. Regular messages (block hash broadcasts from other chains)
                @param _origin Origin information containing srcEid, sender, and nonce
                @param _guid Global unique identifier for the message
                @param _message The encoded message payload containing block number and hash
                @param _executor Address of the executor for the message
                @param _extraData Additional data passed by the executor
                """
                # Verify message source
                OApp._lzReceive(_origin, _guid, _message, _executor, _extraData)

                if _origin.srcEid == self.read_channel:
                    # Only handle read response if read is enabled
                    assert self.read_enabled, "Read not enabled"
                    # Decode block hash and number from response
                    block_number: uint256 = 0
                    block_hash: bytes32 = empty(bytes32)
                    block_number, block_hash = abi_decode(_message, (uint256, bytes32))
                    if block_hash == empty(bytes32):
                        return  # Invalid response

                    # Store received block hash
                    self.received_blocks[block_number] = block_hash

                    # Commit block hash to oracle
                    self._commit_block(block_number, block_hash)

                    broadcast_data: BroadcastData = self.broadcast_data[_guid]

                    if len(broadcast_data.targets) > 0:
                        # Verify that attached value covers requested broadcast fees
                        total_fee: uint256 = 0
                        for target: BroadcastTarget in broadcast_data.targets:
                            total_fee += target.fee
                        assert msg.value >= total_fee, "Insufficient msg.value"

                        # Perform broadcast
                        self._broadcast_block(
                            block_number,
                            block_hash,
                            broadcast_data,
                            self, # dev: refund excess fee to self
                        )
                else:
                    # Regular message - decode and commit block hash
                    block_number: uint256 = 0
                    block_hash: bytes32 = empty(bytes32)
                    block_number, block_hash = abi_decode(_message, (uint256, bytes32))
                    self._commit_block(block_number, block_hash)
            ```

        === "OApp.vy"

            ```py
            struct Origin:
                srcEid: uint32
                sender: bytes32
                nonce: uint64
            ```

    === "Example"

        ```shell
        >>> soon
        ```


---


# **Fee Quoting**

### `quote_read_fee`
!!! description "`LZBlockRelay.quote_read_fee(_read_gas_limit: uint128, _value: uint128) -> uint256: view`"

    Quotes the fee required for reading a block hash from mainnet via LayerZero. Only callable if read is enabled.

    Returns: Fee in native tokens required for the read operation (`uint256`).

    | Input            | Type      | Description                                 |
    |------------------|-----------|---------------------------------------------|
    | `_read_gas_limit`| `uint128` | Gas to be provided in return message        |
    | `_value`         | `uint128` | Value to be provided in return message      |

    ??? quote "Source code"

        === "LZBlockRelay.vy"

            ```python
            @external
            @view
            def quote_read_fee(
                _read_gas_limit: uint128,
                _value: uint128,
            ) -> uint256:
                """
                @notice Quote fee for reading block hash from mainnet
                @param _read_gas_limit Gas to be provided in return message
                @param _value Value to be provided in return message
                @return Fee in native tokens required for the read operation
                """
                assert self.read_enabled, "Read not enabled - call set_read_config"

                message: Bytes[OApp.MAX_MESSAGE_SIZE] = self._prepare_read_request(0) # dev: 0 for latest block

                # Create options using OptionsBuilder module
                options: Bytes[OptionsBuilder.MAX_OPTIONS_TOTAL_SIZE] = OptionsBuilder.newOptions()
                options = OptionsBuilder.addExecutorLzReadOption(
                    options, _read_gas_limit, READ_RETURN_SIZE, _value
                )

                return OApp._quote(
                    self.read_channel,
                    message,
                    options,
                    False,
                ).nativeFee
            ```

        === "OptionsBuilder.vy"

            ```python
            @internal
            @pure
            def newOptions() -> Bytes[MAX_OPTIONS_TOTAL_SIZE]:
                """
                @notice Creates a new options container with type 3.
                @return options The newly created options container.
                """
                options: Bytes[MAX_OPTIONS_TOTAL_SIZE] = concat(convert(TYPE_3, bytes2), b"")

                return options

            @internal
            @pure
            def addExecutorOption(
                _options: Bytes[MAX_OPTIONS_TOTAL_SIZE],
                _optionType: uint8,
                _option: Bytes[MAX_OPTION_SINGLE_SIZE],
            ) -> Bytes[MAX_OPTIONS_TOTAL_SIZE]:
                """
                @dev Adds an executor option to the existing options.
                @param _options The existing options container.
                @param _optionType The type of the executor option.
                @param _option The encoded data for the executor option.
                @return options The updated options container.
                """
                assert convert(slice(_options, 0, 2), uint16) == TYPE_3, "OApp: invalid option type"
                # Account for header bytes: 1 worker + 2 size + 1 type = 4 bytes
                assert (len(_options) + len(_option) + 4 <= MAX_OPTIONS_TOTAL_SIZE), "OApp: options size exceeded"

                return concat(
                    convert(_options, Bytes[MAX_OPTIONS_TOTAL_SIZE - MAX_OPTION_SINGLE_SIZE - 4]), # downcast Bytes size, -4 for header
                    convert(EXECUTOR_WORKER_ID, bytes1),
                    convert(convert(len(_option) + 1, uint16), bytes2),  # +1 for optionType
                    convert(_optionType, bytes1),
                    _option,
                )
            ```

        === "OApp.vy"

            ```py
            interface ILayerZeroEndpointV2:
                def quote(_params: MessagingParams, _sender: address) -> MessagingFee: view
                def send(_params: MessagingParams, _refundAddress: address) -> MessagingReceipt: payable
                def setDelegate(_delegate: address): nonpayable
                def eid() -> uint32: view
                def lzToken() -> address: view

            # Mapping to store peers associated with corresponding endpoints
            peers: public(HashMap[uint32, bytes32])

            @internal
            @view
            def _quote(
                _dstEid: uint32,
                _message: Bytes[MAX_MESSAGE_SIZE],
                _options: Bytes[MAX_OPTIONS_TOTAL_SIZE],
                _payInLzToken: bool,
            ) -> MessagingFee:
                """
                @dev Internal function to interact with the LayerZero EndpointV2.quote() for fee calculation.
                @param _dstEid The destination endpoint ID.
                @param _message The message payload.
                @param _options Additional options for the message.
                @param _payInLzToken Flag indicating whether to pay the fee in LZ tokens.
                @return fee The calculated MessagingFee for the message.
                        - nativeFee: The native fee for the message.
                        - lzTokenFee: The LZ token fee for the message.
                """

                return staticcall endpoint.quote(
                    MessagingParams(
                        dstEid=_dstEid,
                        receiver=self._getPeerOrRevert(_dstEid),
                        message=_message,
                        options=_options,
                        payInLzToken=_payInLzToken,
                    ),
                    self,
                )

            @view
            @internal
            def _getPeerOrRevert(_eid: uint32) -> bytes32:
                """
                @notice Internal function to get the peer address associated with a specific endpoint;
                reverts if NOT set.
                @param _eid The endpoint ID.
                @return peer The address of the peer associated with the specified endpoint.
                """
                peer: bytes32 = self.peers[_eid]
                assert peer != empty(bytes32), "OApp: no peer"
                return peer
            ```

    === "Example"

        ```shell
        >>> soon
        ```

### `quote_broadcast_fees`
!!! description "`LZBlockRelay.quote_broadcast_fees(_target_eids: DynArray[uint32, MAX_N_BROADCAST], _lz_receive_gas_limit: uint128) -> DynArray[uint256, MAX_N_BROADCAST]: view`"

    Estimates the LayerZero fee required to broadcast a block hash to each specified target chain. Useful for integrators to determine the cost of broadcasting to multiple chains before submitting a transaction. Only targets with a configured peer will return a nonzero fee.

    Returns: An array of fees in native tokens (`DynArray[uint256, MAX_N_BROADCAST]`), one per target chain, with zero for any target not configured.

    | Input | Type | Description |
    |------|-|-|
    | `_target_eids`   | `DynArray[uint32, MAX_N_BROADCAST]` | List of target chain endpoint IDs to quote broadcast fees for. |
    | `_lz_receive_gas_limit` | `uint128` | Gas limit to be provided for the lzReceive call on each target.     |

    ??? quote "Source code"

        === "LZBlockRelay.vy"

            ```python
            @external
            @view
            def quote_broadcast_fees(
                _target_eids: DynArray[uint32, MAX_N_BROADCAST],
                _lz_receive_gas_limit: uint128,
            ) -> DynArray[uint256, MAX_N_BROADCAST]:
                """
                @notice Quote fees for broadcasting block hash to specified targets
                @param _target_eids List of chain IDs to broadcast to
                @param _lz_receive_gas_limit Gas limit for lzReceive
                @return Array of fees per target chain (0 if target not configured)
                """
                # Prepare dummy broadcast message (uint256 number, bytes32 hash)
                message: Bytes[OApp.MAX_MESSAGE_SIZE] = abi_encode(empty(uint256), empty(bytes32))

                # Prepare array of fees per chain
                fees: DynArray[uint256, MAX_N_BROADCAST] = []

                # Prepare options (same for all targets)
                options: Bytes[OptionsBuilder.MAX_OPTIONS_TOTAL_SIZE] = OptionsBuilder.newOptions()
                options = OptionsBuilder.addExecutorLzReceiveOption(options, _lz_receive_gas_limit, 0)

                # Cycle through targets
                for eid: uint32 in _target_eids:
                    target: bytes32 = OApp.peers[eid]  # Use peers directly
                    if target == empty(bytes32):
                        fees.append(0)
                        continue

                    # Get fee for target EID and append to array
                    fees.append(OApp._quote(eid, message, options, False).nativeFee)

                return fees
            ```

        === "OptionsBuilder.vy"

            ```py
            from . import VyperConstants as constants

            MAX_OPTIONS_TOTAL_SIZE: constant(uint256) = constants.MAX_OPTIONS_TOTAL_SIZE
            MAX_OPTION_SINGLE_SIZE: constant(uint256) = constants.MAX_OPTION_SINGLE_SIZE

            @internal
            @pure
            def newOptions() -> Bytes[MAX_OPTIONS_TOTAL_SIZE]:
                """
                @notice Creates a new options container with type 3.
                @return options The newly created options container.
                """
                options: Bytes[MAX_OPTIONS_TOTAL_SIZE] = concat(convert(TYPE_3, bytes2), b"")

                return options

            @internal
            @pure
            def addExecutorOption(
                _options: Bytes[MAX_OPTIONS_TOTAL_SIZE],
                _optionType: uint8,
                _option: Bytes[MAX_OPTION_SINGLE_SIZE],
            ) -> Bytes[MAX_OPTIONS_TOTAL_SIZE]:
                """
                @dev Adds an executor option to the existing options.
                @param _options The existing options container.
                @param _optionType The type of the executor option.
                @param _option The encoded data for the executor option.
                @return options The updated options container.
                """
                assert convert(slice(_options, 0, 2), uint16) == TYPE_3, "OApp: invalid option type"
                # Account for header bytes: 1 worker + 2 size + 1 type = 4 bytes
                assert (len(_options) + len(_option) + 4 <= MAX_OPTIONS_TOTAL_SIZE), "OApp: options size exceeded"

                return concat(
                    convert(_options, Bytes[MAX_OPTIONS_TOTAL_SIZE - MAX_OPTION_SINGLE_SIZE - 4]), # downcast Bytes size, -4 for header
                    convert(EXECUTOR_WORKER_ID, bytes1),
                    convert(convert(len(_option) + 1, uint16), bytes2),  # +1 for optionType
                    convert(_optionType, bytes1),
                    _option,
                )
            ```

        === "OApp.vy"

            ```py
            interface ILayerZeroEndpointV2:
                def quote(_params: MessagingParams, _sender: address) -> MessagingFee: view
                def send(_params: MessagingParams, _refundAddress: address) -> MessagingReceipt: payable
                def setDelegate(_delegate: address): nonpayable
                def eid() -> uint32: view
                def lzToken() -> address: view

            # Mapping to store peers associated with corresponding endpoints
            peers: public(HashMap[uint32, bytes32])

            @internal
            @view
            def _quote(
                _dstEid: uint32,
                _message: Bytes[MAX_MESSAGE_SIZE],
                _options: Bytes[MAX_OPTIONS_TOTAL_SIZE],
                _payInLzToken: bool,
            ) -> MessagingFee:
                """
                @dev Internal function to interact with the LayerZero EndpointV2.quote() for fee calculation.
                @param _dstEid The destination endpoint ID.
                @param _message The message payload.
                @param _options Additional options for the message.
                @param _payInLzToken Flag indicating whether to pay the fee in LZ tokens.
                @return fee The calculated MessagingFee for the message.
                        - nativeFee: The native fee for the message.
                        - lzTokenFee: The LZ token fee for the message.
                """

                return staticcall endpoint.quote(
                    MessagingParams(
                        dstEid=_dstEid,
                        receiver=self._getPeerOrRevert(_dstEid),
                        message=_message,
                        options=_options,
                        payInLzToken=_payInLzToken,
                    ),
                    self,
                )

            @view
            @internal
            def _getPeerOrRevert(_eid: uint32) -> bytes32:
                """
                @notice Internal function to get the peer address associated with a specific endpoint;
                reverts if NOT set.
                @param _eid The endpoint ID.
                @return peer The address of the peer associated with the specified endpoint.
                """
                peer: bytes32 = self.peers[_eid]
                assert peer != empty(bytes32), "OApp: no peer"
                return peer
            ```

    === "Example"

        ```shell
        >>> soon
        ```


---


# **State & Utility Views**

### `read_enabled`
!!! description "`LZBlockRelay.read_enabled() -> bool: view`"

    Getter whether the contract is configured to initiate block hash reads from mainnet. This is true if the contract is operating in read-enabled mode.

    Returns: `True` if read functionality is enabled (`bool`).

    ??? quote "Source code"

        === "LZBlockRelay.vy"

            ```python
            read_enabled: public(bool)
            ```

    === "Example"

        ```shell
        >>> LZBlockRelay.read_enabled()
        'true'
        ```

### `read_channel`
!!! description "`LZBlockRelay.read_channel() -> uint32: view`"

    Getter for the LayerZero endpoint ID for the configured read channel. This is the channel used for mainnet block hash reads.

    Returns: read channel endpoint ID (`uint32`).

    ??? quote "Source code"

        === "LZBlockRelay.vy"

            ```python
            read_channel: public(uint32)
            ```

    === "Example"

        ```shell
        >>> LZBlockRelay.read_channel()
        30101
        ```

### `mainnet_eid`
!!! description "`LZBlockRelay.mainnet_eid() -> uint32: view`"

    Getter for the mainnet eid.

    Returns: mainnet eid (`uint32`).

    ??? quote "Source code"

        === "LZBlockRelay.vy"

            ```python
            mainnet_eid: public(uint32)
            ```

    === "Example"

        ```shell
        >>> LZBlockRelay.mainnet_eid()
        30101
        ```

### `mainnet_block_view`
!!! description "`LZBlockRelay.mainnet_block_view() -> address: view`"

    Getter for the `MainnetBlockViewer` contract.

    Returns: `MainnetBlockViewer` (`address`).

    ??? quote "Source code"

        === "LZBlockRelay.vy"

            ```python
            mainnet_block_view: public(address)
            ```

    === "Example"

        ```shell
        >>> LZBlockRelay.mainnet_block_view()
        '0xb10CfacE69cc0B7F1AE0Dc8E6aD186914f6e7EEA'
        ```

### `block_oracle`
!!! description "`LZBlockRelay.block_oracle() -> address: view`"

    Getter for the `BlockOracle` contract.

    Returns: `BlockOracle` (`address`).

    ??? quote "Source code"

        === "LZBlockRelay.vy"

            ```python
            block_oracle: public(IBlockOracle)
            ```

    === "Example"

        ```shell
        >>> LZBlockRelay.block_oracle()
        '0xb10cface69821Ff7b245Cf5f28f3e714fDbd86b8'
        ```


---


## **Ownership**

Standard Ownable interface for querying the current owner and transferring or renouncing ownership. Ownership controls all privileged operations, including configuration and peer management. Owner of the contract is the DAO.

More here: https://github.com/pcaversaccio/snekmate/blob/main/src/snekmate/auth/ownable.vy
