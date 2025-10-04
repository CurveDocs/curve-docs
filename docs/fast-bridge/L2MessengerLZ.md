<h1>L2MessengerLZ</h1>

The L2MessengerLZ contract serves as the LayerZero messaging component for the FastBridge system, handling the fast message delivery from L2 networks to the Ethereum mainnet vault. This contract is deployed on each supported L2 network (Arbitrum, Optimism, Fraxtal) and manages the LayerZero cross-chain messaging that enables immediate access to bridged funds.

The contract implements LayerZero's OApp (Omnichain Application) standard to provide secure and efficient cross-chain communication. It works in conjunction with the FastBridgeL2 contract to send fast bridge messages that trigger immediate crvUSD minting on the mainnet vault while the native bridge transaction is still pending.

!!!vyper "`L2MessengerLZ.vy`"
    The source code for the `L2MessengerLZ.vy` contract can be found on [:material-github: GitHub](https://github.com/curvefi/fast-bridge/blob/main/contracts/L2MessengerLZ.vy). The contract is written using [Vyper](https://github.com/vyperlang/vyper) version `0.4.3` and utilizes [LayerZero OApp](https://docs.layerzero.network/v2/concepts/applications/oapp-standard) modules for cross-chain messaging.

    The source code was audited by [:logos-chainsecurity: ChainSecurity](https://www.chainsecurity.com/). The full audit report can be found [here](../assets/pdf/ChainSecurity_Curve_Fast_Bridge_audit.pdf).

---

## Core Functions

The L2MessengerLZ contract provides essential functions for initiating fast bridge messages, quoting message fees, and managing LayerZero messaging parameters. These functions work together to provide secure and efficient cross-chain communication for the fast bridge mechanism.

### `initiate_fast_bridge`
!!! description "`L2MessengerLZ.initiate_fast_bridge(_to: address, _amount: uint256, _lz_fee_refund: address)`"

    !!!guard "Guarded Method"
        This function is only callable by the `FastBridgeL2.vy` contract.

    Initiates a fast bridge by sending a message to the peer contract on the main chain. This function is only callable by the FastBridgeL2 contract and triggers immediate crvUSD minting on the mainnet vault while the native bridge transaction is still pending.

    | Input      | Type      | Description |
    | ---------- | --------- | ------------ |
    | `_to` | `address` | Address to mint crvUSD to on mainnet |
    | `_amount` | `uint256` | Amount of crvUSD to mint |
    | `_lz_fee_refund` | `address` | Address to receive excess LayerZero fees |

    Returns: None.

    Emits: `Initiated` event.

    ??? quote "Source code"

        === "L2MessengerLZ.vy"

            ```python
            event Initiated:
                to: address
                amount: uint256
                lz_fee_refund: address

            @external
            @payable
            def initiate_fast_bridge(_to: address, _amount: uint256, _lz_fee_refund: address):
                """
                @notice Initiate fast bridge by sending (to, amount) to peer on main chain
                Only callable by FastBridgeL2
                @param _to Address to mint to
                @param _amount Amount to mint
                @param _lz_fee_refund Address to deposit excess fees from transaction
                """
                assert msg.sender == self.fast_bridge_l2, "Only FastBridgeL2!"
                
                # step 1: convert message to bytes
                encoded_message: Bytes[OApp.MAX_MESSAGE_SIZE] = abi_encode(_to, _amount)

                # step 2: create options using OptionsBuilder module
                options: Bytes[OptionsBuilder.MAX_OPTIONS_TOTAL_SIZE] = OptionsBuilder.newOptions()
                options = OptionsBuilder.addExecutorLzReceiveOption(options, self.gas_limit, 0)

                # step 3: send message
                fees: OApp.MessagingFee = OApp.MessagingFee(nativeFee=msg.value, lzTokenFee=0)
                OApp._lzSend(self.vault_eid, encoded_message, options, fees, _lz_fee_refund)
                log Initiated(to=_to, amount=_amount, lz_fee_refund=_lz_fee_refund)
            ```

    === "Example"

        ```shell
        ```

### `quote_message_fee`
!!! description "`L2MessengerLZ.quote_message_fee() -> uint256`"

    Quotes the LayerZero message fee in native tokens required to send a fast bridge message to the mainnet vault. This function helps users and the FastBridgeL2 contract calculate the exact amount of native tokens needed for the messaging operation.

    Returns: Native token amount needed for the LayerZero message (`uint256`).

    ??? quote "Source code"

        === "L2MessengerLZ.vy"

            ```python
            @external
            @view
            def quote_message_fee() -> uint256:
                """
                @notice Quote message fee in native token
                @return Native token amount needed for message
                """
                # step 1: mock message 
                encoded_message: Bytes[OApp.MAX_MESSAGE_SIZE] = abi_encode(self, empty(uint256))

                # step 2: mock options
                options: Bytes[OptionsBuilder.MAX_OPTIONS_TOTAL_SIZE] = OptionsBuilder.newOptions()
                options = OptionsBuilder.addExecutorLzReceiveOption(options, self.gas_limit, 0)

                # step 3: quote fee
                return OApp._quote(self.vault_eid, encoded_message, options, False).nativeFee
            ```

    === "Example"

        ```shell
        >>> L2MessengerLZ.quote_message_fee()
        0.001 ETH  # Example fee amount
        ```

---

## Variables

The L2MessengerLZ contract maintains several important state variables that control its operation, store contract addresses, and manage LayerZero messaging parameters. These variables work together to ensure proper functioning of the cross-chain messaging system while maintaining security and efficiency.

### `vault_eid`
!!! description "`L2MessengerLZ.vault_eid() -> uint32`"

    The LayerZero endpoint ID (EID) of the mainnet vault contract. This identifies the destination chain and contract for fast bridge messages. Can be changed using the [`set_vault_eid`](#set_vault_eid) function.

    Returns: Vault chain endpoint ID (`uint32`).

    ??? quote "Source code"

        === "L2MessengerLZ.vy"

            ```python
            vault_eid: public(uint32)
            ```

    === "Example"

        ```shell
        >>> L2MessengerLZ.vault_eid()
        ```

### `fast_bridge_l2`
!!! description "`L2MessengerLZ.fast_bridge_l2() -> address`"

    The address of the FastBridgeL2 contract that is authorized to call the `initiate_fast_bridge` function. This ensures only the legitimate bridge contract can send fast bridge messages. Can be changed using the [`set_fast_bridge_l2`](#set_fast_bridge_l2) function.

    Returns: FastBridgeL2 contract address (`address`).

    ??? quote "Source code"

        === "L2MessengerLZ.vy"

            ```python
            fast_bridge_l2: public(address)
            ```

    === "Example"

        ```shell
        >>> L2MessengerLZ.fast_bridge_l2()
        ```

### `gas_limit`
!!! description "`L2MessengerLZ.gas_limit() -> uint128`"

    The gas limit for LayerZero message execution on the destination chain. This parameter ensures sufficient gas is provided for the message processing on mainnet. Can be changed using the [`set_gas_limit`](#set_gas_limit) function.

    Returns: Gas limit for destination chain execution (`uint128`).

    ??? quote "Source code"

        === "L2MessengerLZ.vy"

            ```python
            gas_limit: public(uint128)
            ```

    === "Example"

        ```shell
        >>> L2MessengerLZ.gas_limit()
        ```

---

## Owner Functions

The L2MessengerLZ contract includes several administrative functions that allow the contract owner to manage system parameters, update contract addresses, and configure LayerZero messaging settings. These functions are protected by ownership checks to ensure only authorized personnel can make critical changes to the system.

### `set_fast_bridge_l2`
!!! description "`L2MessengerLZ.set_fast_bridge_l2(_fast_bridge_l2: address)`"

    !!!guard "Guarded Method"
        This function is only callable by the `owner` of the contract.

    Updates the address of the FastBridgeL2 contract that is authorized to initiate fast bridge messages. Only the contract owner can call this function. This allows for updating the authorized caller if the FastBridgeL2 contract is upgraded or replaced.

    | Input      | Type      | Description |
    | ---------- | --------- | ------------ |
    | `_fast_bridge_l2` | `address` | New FastBridgeL2 contract address |

    Returns: None.

    ??? quote "Source code"

        === "L2MessengerLZ.vy"

            ```python
            @external
            def set_fast_bridge_l2(_fast_bridge_l2: address):
                """
                @notice Set fast bridge l2 address
                @param _fast_bridge_l2 FastBridgeL2 address
                """
                ownable._check_owner()
                assert _fast_bridge_l2 != empty(address), "Bad value"

                self.fast_bridge_l2 = _fast_bridge_l2
                log SetFastBridgeL2(fast_bridge_l2=_fast_bridge_l2)
            ```

    === "Example"

        ```shell
        ```

### `set_vault_eid`
!!! description "`L2MessengerLZ.set_vault_eid(_vault_eid: uint32)`"

    !!!guard "Guarded Method"
        This function is only callable by the `owner` of the contract.

    Updates the LayerZero endpoint ID of the mainnet vault contract. Only the contract owner can call this function. This allows for updating the destination chain and contract if the vault is moved or the endpoint ID changes.

    | Input      | Type      | Description |
    | ---------- | --------- | ------------ |
    | `_vault_eid` | `uint32` | New vault endpoint ID |

    Returns: None.

    ??? quote "Source code"

        === "L2MessengerLZ.vy"

            ```python
            @external
            def set_vault_eid(_vault_eid: uint32):
                """
                @notice Set vault EID
                @param _vault_eid Vault EID
                """
                ownable._check_owner()
                assert _vault_eid != empty(uint32), "Bad eid"

                self.vault_eid = _vault_eid
                log SetVaultEid(vault_eid=_vault_eid)
            ```

    === "Example"

        ```shell
        ```

### `set_gas_limit`
!!! description "`L2MessengerLZ.set_gas_limit(_gas_limit: uint128)`"

    !!!guard "Guarded Method"
        This function is only callable by the `owner` of the contract.

    Updates the gas limit for LayerZero message execution on the destination chain. Only the contract owner can call this function. This allows for optimizing gas usage based on network conditions and contract requirements.

    | Input      | Type      | Description |
    | ---------- | --------- | ------------ |
    | `_gas_limit` | `uint128` | New gas limit for destination chain execution |

    Returns: None.

    ??? quote "Source code"

        === "L2MessengerLZ.vy"

            ```python
            @external
            def set_gas_limit(_gas_limit: uint128):
                """
                @notice Set gas limit for LZ message on destination chain
                @param _gas_limit Gas limit
                """
                ownable._check_owner()

                self.gas_limit = _gas_limit
                log SetGasLimit(gas_limit=_gas_limit)
            ```

    === "Example"

        ```shell
        ```

