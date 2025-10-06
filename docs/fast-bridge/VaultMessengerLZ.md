<h1>VaultMessengerLZ</h1>

The VaultMessengerLZ contract serves as the Ethereum mainnet receiver for LayerZero messages in the FastBridge system. This contract receives fast bridge messages from L2 networks and triggers immediate crvUSD minting in the FastBridgeVault, enabling users to access their bridged funds instantly while the native bridge transaction is still pending.

The contract implements LayerZero's OApp (Omnichain Application) standard to provide secure and efficient cross-chain communication. It works in conjunction with the L2MessengerLZ contracts on L2 networks to complete the fast bridge message flow and enable immediate access to bridged funds.

!!!vyper "`VaultMessengerLZ.vy`"
    The source code for the `VaultMessengerLZ.vy` contract can be found on [:material-github: GitHub](https://github.com/curvefi/fast-bridge/blob/main/contracts/VaultMessengerLZ.vy). The contract is written using [Vyper](https://github.com/vyperlang/vyper) version `0.4.3` and utilizes [LayerZero OApp](https://docs.layerzero.network/v2/concepts/applications/oapp-standard) modules for cross-chain messaging.

    The source code was audited by [:logos-chainsecurity: ChainSecurity](https://www.chainsecurity.com/). The full audit report can be found [here](../assets/pdf/ChainSecurity_Curve_Fast_Bridge_audit.pdf).

---

## Core Functions

The VaultMessengerLZ contract provides essential functions for receiving LayerZero messages, decoding bridge requests, and triggering crvUSD minting in the vault. These functions work together to complete the fast bridge mechanism and provide immediate access to bridged funds.

### `lzReceive`
!!! description "`VaultMessengerLZ.lzReceive(_origin: OApp.Origin, _guid: bytes32, _message: Bytes[OApp.MAX_MESSAGE_SIZE], _executor: address, _extraData: Bytes[OApp.MAX_EXTRA_DATA_SIZE])`"

    Receives LayerZero messages originating from L2 networks and processes fast bridge requests. This function decodes the message payload and triggers crvUSD minting in the FastBridgeVault, providing immediate access to bridged funds.

    | Input      | Type      | Description |
    | ---------- | --------- | ------------ |
    | `_origin` | `OApp.Origin` | Origin information containing srcEid, sender, and nonce |
    | `_guid` | `bytes32` | Global unique identifier for the message |
    | `_message` | `Bytes[OApp.MAX_MESSAGE_SIZE]` | The encoded message payload containing to and amount |
    | `_executor` | `address` | Address of the executor for the message |
    | `_extraData` | `Bytes[OApp.MAX_EXTRA_DATA_SIZE]` | Additional data passed by the executor |

    Returns: None.

    Emits: `Receive` event.

    ??? quote "Source code"

        === "VaultMessengerLZ.vy"

            ```python
            interface IVault:
                def mint(_receiver: address, _amount: uint256) -> uint256: nonpayable

            event Receive:
                origin: OApp.Origin
                guid: bytes32
                message: Bytes[OApp.MAX_MESSAGE_SIZE]

            vault: public(IVault)

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
                @notice Receive message from main chain
                @param _origin Origin information containing srcEid, sender, and nonce
                @param _guid Global unique identifier for the message
                @param _message The encoded message payload containing to and amount
                @param _executor Address of the executor for the message
                @param _extraData Additional data passed by the executor
                """
                # Verify message source
                OApp._lzReceive(_origin, _guid, _message, _executor, _extraData)

                # Decode message
                to: address = empty(address)
                amount: uint256 = empty(uint256)
                to, amount = abi_decode(_message, (address, uint256))

                # Pass mint command to vault
                extcall self.vault.mint(to, amount)
                log Receive(origin=_origin, guid=_guid, message=_message)
            ```

    === "Example"

        ```shell
        ```

---

## Variables

The VaultMessengerLZ contract maintains important state variables that control its operation and store contract addresses. These variables work together to ensure proper functioning of the cross-chain messaging system while maintaining security and efficiency.

### `vault`
!!! description "`VaultMessengerLZ.vault() -> IVault`"

    The address of the FastBridgeVault contract that receives mint commands. This contract holds pre-minted crvUSD tokens and can immediately release them to users upon receiving fast bridge messages.

    Returns: FastBridgeVault contract address (`IVault`).

    ??? quote "Source code"

        === "VaultMessengerLZ.vy"

            ```python
            vault: public(IVault)
            ```

    === "Example"

        ```shell
        >>> VaultMessengerLZ.vault()
        0x...
        ```

---

## Owner Functions

The VaultMessengerLZ contract includes administrative functions that allow the contract owner to manage system parameters and update contract addresses. These functions are protected by ownership checks to ensure only authorized personnel can make critical changes to the system.

### `set_vault`
!!! description "`VaultMessengerLZ.set_vault(_vault: IVault)`"

    !!!guard "Guarded Method"
        This function is only callable by the `owner` of the contract.

    Updates the address of the FastBridgeVault contract that receives mint commands. Only the contract owner can call this function. This allows for updating the vault address if the vault contract is upgraded or replaced.

    | Input      | Type      | Description |
    | ---------- | --------- | ------------ |
    | `_vault` | `IVault` | New FastBridgeVault contract address |

    Returns: None.

    ??? quote "Source code"

        === "VaultMessengerLZ.vy"

            ```python
            @external
            def set_vault(_vault: IVault):
                """
                @notice Set vault address
                @param _vault new vault address
                """
                ownable._check_owner()
                assert _vault != empty(IVault), "Bad vault"

                self.vault = _vault
                log SetVault(vault=_vault)
            ```

    === "Example"

        ```shell
        ```
