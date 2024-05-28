layerZero 



## todo

### `quote`
!!! description "`Bridge.quote(_native_amount: uint256 = 0) -> uint256:`"

    Function to quote the cost of calling the `bridge` method.

    Returns: 

    | Input            | Type      | Description       |
    | ---------------- | --------- | ----------------- |
    | `_native_amount` | `uint256` | Amount to bridge. |

    ??? quote "Source code"

        === "CRVUSDLayerZeroBridge.vy"

            ```vyper 
            interface Endpoint:
                def send(
                    _dst_chain_id: uint16,
                    _destination: Bytes[40],
                    _payload: Bytes[64],
                    _refund_address: address,
                    _zro_payment_address: address,
                    _adapter_params: Bytes[86]
                ): payable
                def estimateFees(
                    _dst_chain_id: uint16,
                    _user_application: address,
                    _payload: Bytes[64],
                    _pay_in_zro: bool,
                    _adapter_params: Bytes[86]
                ) -> uint256: view

            @view
            @external
            def quote(_native_amount: uint256 = 0) -> uint256:
                """
                @notice Quote the cost of calling the `bridge` method
                """
                adapter_params: Bytes[86] = b""
                if _native_amount == 0:
                    adapter_params = concat(
                        b"\x00\x01",
                        convert(500_000, bytes32)
                    )
                else:
                    adapter_params = concat(
                        b"\x00\x02",
                        convert(500_000, bytes32),
                        convert(_native_amount, bytes32),
                        b"\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00"
                    )

                return Endpoint(LZ_ENDPOINT).estimateFees(
                    LZ_CHAIN_ID,
                    self,
                    concat(empty(bytes32), empty(bytes32)),
                    False,
                    adapter_params
                )
            ```

        === "LZ_ENDPOINT"

            ```solidity
            function estimateFees(uint16 _dstChainId, address _userApplication, bytes calldata _payload, bool _payInZRO, bytes calldata _adapterParams) external view override returns (uint nativeFee, uint zroFee) {
                LibraryConfig storage uaConfig = uaConfigLookup[_userApplication];
                ILayerZeroMessagingLibrary lib = uaConfig.sendVersion == DEFAULT_VERSION ? defaultSendLibrary : uaConfig.sendLibrary;
                return lib.estimateFees(_dstChainId, _userApplication, _payload, _payInZRO, _adapterParams);
            }
            ```

    === "Example"
        ```shell
        >>> 
        todo
        ```


### `LZ_ENDPOINT`
!!! description "`Bridge.LZ_ENDPOINT() -> address: view`"

    Getter for the LayerZero endpoint address. This endpoint can not be changed.

    Returns: LZ endpoint (`address`).

    ??? quote "Source code"

        === "CRVUSDLayerZeroBridge.vy"

            ```vyper 
            LZ_ENDPOINT: public(constant(address)) = 0x66A71Dcef29A0fFBDBE3c6a460a3B5BC225Cd675
            ```

    === "Example"
        ```shell
        >>> Bridge.LZ_ENDPOINT()
        '0x66A71Dcef29A0fFBDBE3c6a460a3B5BC225Cd675'
        ```


### `LZ_CHAIN_ID`
!!! description "`Bridge.LZ_CHAIN_ID() -> uint126: view`"

    Getter for the LayerZero chain id. A full list of all endpoint id's can be found [here](https://layerzero.gitbook.io/docs/technical-reference/mainnet/supported-chain-ids).

    Returns: LZ chain id (`address`).

    ??? quote "Source code"

        === "CRVUSDLayerZeroBridge.vy"

            ```vyper 
            LZ_CHAIN_ID: public(immutable(uint16))

            @external
            def __init__(_delay: uint256, _limit: uint256, _lz_chain_id: uint16):
                self.delay = _delay
                log SetDelay(_delay)

                self.limit = _limit
                log SetLimit(_limit)

                self.owner = msg.sender
                log TransferOwnership(msg.sender)

                LZ_CHAIN_ID = _lz_chain_id
                LZ_ADDRESS = concat(
                    slice(convert(self, bytes32), 12, 20), slice(convert(self, bytes32), 12, 20)
                )
                KECCAK_LZ_ADDRESS = keccak256(LZ_ADDRESS)
            ```

    === "Example"
        ```shell
        >>> Bridge.LZ_CHAIN_ID()
        102
        ```





## bridge actions



### `bridge`
!!! description "`Bridge.def bridge(_amount: uint256, _receiver: address = msg.sender, _refund_address: address = msg.sender, _zro_payment_address: address = empty(address), _native_amount: uint256 = 0, _native_receiver: address = empty(address)):`"

    Function to bridge `_amount` of crvUSD. Additionally, `_receiver`, `_refund_address`, `_zro_payment_address`, `_native_amount` and `_native_receiver` can be specified.

    Emits: `Bridged`

    | Input                  | Type      | Description |
    | ---------------------- | --------- | ------------ |
    | `_amount`              | `uint256` | Amount of crvUSD to bridge. |
    | `_receiver`            | `address` | Receiver of the bridged funds. |
    | `_refund_address`      | `address` | Refund address, if the  |
    | `_zro_payment_address` | `address` |  |
    | `_native_amount`       | `uint256` |  |
    | `_native_receiver`     | `address` |  |

    ??? quote "Source code"

        === "CRVUSDLayerZeroBridge.vy"

            ```vyper 
            event Bridged:
                receiver: indexed(address)
                amount: uint256

            @payable
            @external
            def bridge(
                _amount: uint256,
                _receiver: address = msg.sender,
                _refund_address: address = msg.sender,
                _zro_payment_address: address = empty(address),
                _native_amount: uint256 = 0,
                _native_receiver: address = empty(address)
            ):
                """
                @notice Bridge CRVUSD
                """
                assert not self.is_killed  # dev: dead
                assert _amount != 0 and _receiver != empty(address)  # dev: invalid

                assert ERC20(CRVUSD).transferFrom(msg.sender, self, _amount)

                adapter_params: Bytes[86] = b""
                if _native_amount == 0:
                    adapter_params = concat(
                        b"\x00\x01",
                        convert(500_000, bytes32)
                    )
                else:
                    adapter_params = concat(
                        b"\x00\x02",
                        convert(500_000, bytes32),
                        convert(_native_amount, bytes32),
                        slice(convert(_native_receiver, bytes32), 12, 20)
                    )

                Endpoint(LZ_ENDPOINT).send(
                    LZ_CHAIN_ID,
                    LZ_ADDRESS,
                    _abi_encode(_receiver, _amount),
                    _refund_address,
                    _zro_payment_address,
                    adapter_params,
                    value=msg.value
                )
                log Bridged(_receiver, _amount)
            ```

        === "Endpoint.sol"

            ```solidity
            function send(uint16 _dstChainId, bytes calldata _destination, bytes calldata _payload, address payable _refundAddress, address _zroPaymentAddress, bytes calldata _adapterParams) external payable override sendNonReentrant {
                LibraryConfig storage uaConfig = uaConfigLookup[msg.sender];
                uint64 nonce = ++outboundNonce[_dstChainId][msg.sender];
                _getSendLibrary(uaConfig).send{value: msg.value}(msg.sender, nonce, _dstChainId, _destination, _payload, _refundAddress, _zroPaymentAddress, _adapterParams);
            }
            ```


    === "Example"
        ```shell
        >>> 
        todo
        ```


### `lzReceive`
!!! description "`Bridge.lzReceive(_lz_chain_id: uint16, _lz_address: Bytes[40], _nonce: uint64, _payload: Bytes[64]):`"

    todo

    Emits: `Issued`

    | Input                  | Type        | Description |
    | ---------------------- | ----------- | ------------ |
    | `_lz_chain_id`         | `uint16`    |  |
    | `_lz_address`          | `Bytes[40]` |  |
    | `_nonce`               | `uint64`    |  |
    | `_payload`             | `Bytes[64]` |  |

    ??? quote "Source code"

        === "CRVUSDLayerZeroBridge.vy"

            ```vyper
            event Issued:
                nonce: indexed(uint64)
                receiver: indexed(address)
                amount: uint256

            @external
            def lzReceive(_lz_chain_id: uint16, _lz_address: Bytes[40], _nonce: uint64, _payload: Bytes[64]):
                """
                @dev LayerZero method which should not revert at all
                """
                assert msg.sender == LZ_ENDPOINT  # dev: invalid caller

                assert _lz_chain_id == LZ_CHAIN_ID  # dev: invalid source chain
                assert keccak256(_lz_address) == KECCAK_LZ_ADDRESS  # dev: invalid source address

                receiver: address = empty(address)
                amount: uint256 = empty(uint256)
                receiver, amount = _abi_decode(_payload, (address, uint256))

                if receiver in [empty(address), CRVUSD] or amount == 0:
                    # precaution
                    return

                period: uint256 = block.timestamp / ISSUANCE_INTERVAL
                issued: uint256 = self.issued[period] + amount

                if ERC20(CRVUSD).balanceOf(self) < amount:
                    self.failed[_nonce] = keccak256(_payload)
                    log Failed(_nonce, receiver, amount)
                elif issued > self.limit or self.is_killed:
                    self.delayed[_nonce] = keccak256(_abi_encode(block.timestamp, _payload))
                    log Delayed(_nonce, receiver, amount)
                else:
                    self.issued[period] = issued

                    ERC20(CRVUSD).transfer(receiver, amount)

                    log Issued(_nonce, receiver, amount)
            ```

        === "Endpoint.sol"

            ```solidity
            ```

    === "Example"
        ```shell
        >>> 
        todo
        ```



### `issued`



### `failed`


### `delayed`
### `retry`

### `recover`



## variables and setting them


### `delay`
!!! description "`Bridge.delay() -> uint256: view`"

    Getter for the current delay for retrying a delayed bridging attempt. This delay can be changed by the `owner` through the `set_delay` method.

    Returns: bridging delay (uint256).

    ??? quote "Source code"

        === "CRVUSDLayerZeroBridge.vy"

            ```vyper
            delay: public(uint256)

            @external
            def __init__(_delay: uint256, _limit: uint256, _lz_chain_id: uint16):
                self.delay = _delay
                log SetDelay(_delay)

                self.limit = _limit
                log SetLimit(_limit)

                self.owner = msg.sender
                log TransferOwnership(msg.sender)

                LZ_CHAIN_ID = _lz_chain_id
                LZ_ADDRESS = concat(
                    slice(convert(self, bytes32), 12, 20), slice(convert(self, bytes32), 12, 20)
                )
                KECCAK_LZ_ADDRESS = keccak256(LZ_ADDRESS)
            ```

    === "Example"
        ```shell
        >>> Bridge.delay()
        86400
        ```


### `set_delay`
!!! description "`Bridge.set_delay(_delay: uint256):`"

    !!!guard "Guarded Methods"
        This function can only be called by the `owner` of the contract.

    Function to set the delay for retrying a delayed bridge attempt. The value is denominated in seconds.

    Emits: `SetDelay`

    | Input    | Type      | Description       |
    | -------- | --------- | ----------------- |
    | `_delay` | `uint256` | New delay value.  |

    ??? quote "Source code"

        === "CRVUSDLayerZeroBridge.vy"

            ```vyper
            event SetDelay:
                delay: uint256

            @external
            def set_delay(_delay: uint256):
                """
                @notice Set the delay for retrying a delayed bridge attempt
                """
                assert msg.sender == self.owner

                self.delay = _delay
                log SetDelay(_delay)
            ```

        === "Endpoint.sol"

            ```solidity
            ```

    === "Example"
        ```shell
        >>> 
        todo
        ```


### `limit`
!!! description "`Bridge.limit() -> uint256: view`"

    Getter for the current limit of the crvUSD to bridge within the issuance interval (`ISSUANCE_INTERVAL`). The issuance internal is a constant and is set to 86400 (1 day).

    Returns: current limit (`uint256`).

    ??? quote "Source code"

        === "CRVUSDLayerZeroBridge.vy"

            ```vyper
            ISSUANCE_INTERVAL: constant(uint256) = 86400

            limit: public(uint256)
            ```

    === "Example"
        ```shell
        >>> Bridge.limit()
        125000000000000000000000
        ```


### `set_limit`
!!! description "`Bridge.set_limit(_limit: uint256):`"

    !!!guard "Guarded Methods"
        This function can only be called by the `owner` of the contract.

    Function to raise or lower the current limit to bridge within the issuance interval (`ISSUANCE_INTERVAL`).

    Emits: `SetLimit`

    | Input    | Type      | Description      |
    | -------- | --------- | ---------------- |
    | `_limit` | `uint256` | New limit value. |

    ??? quote "Source code"

        === "CRVUSDLayerZeroBridge.vy"

            ```vyper
            event SetLimit:
                limit: uint256

            @external
            def set_limit(_limit: uint256):
                """
                @notice Set the issuance limit for the issuance interval
                """
                assert msg.sender == self.owner

                self.limit = _limit
                log SetLimit(_limit)
            ```

        === "Endpoint.sol"

            ```solidity
            ```

    === "Example"
        ```shell
        >>> 
        todo
        ```



### `is_killed`
!!! description "`Bridge.is_killed() -> bool: view`"

    Getter method to check if the bridge is killed. If yes, no more assets can be bridged. todo: what can be done?

    Returns: whether the bridge is killed or not (`bool`)

    ??? quote "Source code"

        === "CRVUSDLayerZeroBridge.vy"

            ```vyper
            is_killed: public(bool)
            ```

    === "Example"
        ```shell
        >>> Bridge.is_killed()
        'False'
        ```


### `set_killed`
!!! description "`Bridge.`"

    !!!guard "Guarded Methods"
        This function can only be called by the `owner` of the contract.

    Function to kill or unkill the bridge.

    Emits: `SetKilled`

    ??? quote "Source code"

        === "CRVUSDLayerZeroBridge.vy"

            ```vyper
            event SetKilled:
                killed: bool

            @external
            def set_killed(_killed: bool):
                """
                @notice Set the kill status of this side of the bridge
                """
                assert msg.sender == self.owner

                self.is_killed = _killed
                log SetKilled(_killed)
            ```

    === "Example"
        ```shell
        >>> Bridge.set_killed('true')
        todo
        ```


## Contract Ownership

The owner of the contract is the address set as `owner`. To change the ownership, a two step process is required.

1. Commit the transfer of ownership
2. Accept the transfer of ownership


### `owner`
!!! description "`Bridge.owner() -> address: view`"

    Getter for the current owner of the contract.

    Returns: owner (`address`).

    ??? quote "Source code"

        === "CRVUSDLayerZeroBridge.vy"

            ```vyper
            owner: public(address)

            @external
            def __init__(_delay: uint256, _limit: uint256, _lz_chain_id: uint16):
                self.delay = _delay
                log SetDelay(_delay)

                self.limit = _limit
                log SetLimit(_limit)

                self.owner = msg.sender
                log TransferOwnership(msg.sender)

                LZ_CHAIN_ID = _lz_chain_id
                LZ_ADDRESS = concat(
                    slice(convert(self, bytes32), 12, 20), slice(convert(self, bytes32), 12, 20)
                )
                KECCAK_LZ_ADDRESS = keccak256(LZ_ADDRESS)
            ```

    === "Example"
        ```shell
        >>> Bridge.owner()
        '0x5a02d537fE0044E3eF506ccfA08f370425d1408C'
        ```


### `future_owner`
!!! description "`Bridge.future_owner() -> address: view`"

    Getter for the future owner of the contract. This variable is set when transfering ownership and is ultimately the address which needs to accept it by calling `accept_transfer_ownership`.

    Emits: future owner (`address`).

    ??? quote "Source code"

        === "CRVUSDLayerZeroBridge.vy"

            ```vyper
            future_owner: public(address)
            ```

    === "Example"
        ```shell
        >>> Bridge.future_owner()
        '0x5a02d537fE0044E3eF506ccfA08f370425d1408C'
        ```


### `commit_transfer_ownership`
!!! description "`Bridge.commit_transfer_ownership(_future_owner: address):`"

    !!!guard "Guarded Methods"
        This function can only be called by the `owner` of the contract.

    Function to commit the transfer of ownership of the contract to `_future_owner`. This change does not apply right away, it first needs to be accepted by the future owner by calling `accpet_transfer_ownership`.

    | Input           | Type      | Description      |
    | --------------- | --------- | ---------------- |
    | `_future_owner` | `address` | Future owner of the contract. |

    ??? quote "Source code"

        === "CRVUSDLayerZeroBridge.vy"

            ```vyper
            owner: public(address)
            future_owner: public(address)

            @external
            def commit_transfer_ownership(_future_owner: address):
                """
                @notice Transfer ownership to `_future_owner`
                @param _future_owner The account to commit as the future owner
                """
                assert msg.sender == self.owner  # dev: only owner

                self.future_owner = _future_owner
            ```

    === "Example"
        ```shell
        >>> Bridge.commit_transfer_ownership()
        todo
        ```


### `accept_transfer_ownership`
!!! description "`Bridge.accept_transfer_ownership():`"

    !!!guard "Guarded Methods"
        This function can only be called by the `future_owner` of the contract.

    Function to accept the change of ownership.

    Emits: `TransferOwnership`

    ??? quote "Source code"

        === "CRVUSDLayerZeroBridge.vy"

            ```vyper
            event TransferOwnership:
                owner: indexed(address)

            owner: public(address)
            future_owner: public(address)

            @external
            def accept_transfer_ownership():
                """
                @notice Accept the transfer of ownership
                @dev Only the committed future owner can call this function
                """
                assert msg.sender == self.future_owner  # dev: only future owner

                self.owner = msg.sender
                log TransferOwnership(msg.sender)
            ```

    === "Example"
        ```shell
        >>> Bridge.accept_transfer_ownership()
        todo
        ```




!!! description "`Bridge.`"

    Function to unpause the pool `_pool`, re-enabling all functionality.

    Returns:

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_pool` |  `address` | Pool address |

    ??? quote "Source code"

        === "CRVUSDLayerZeroBridge.vy"

            ```vyper
            ```

        === "Endpoint.sol"

            ```solidity
            ```

    === "Example"
        ```shell
        >>> Bridge.
        todo
        ```