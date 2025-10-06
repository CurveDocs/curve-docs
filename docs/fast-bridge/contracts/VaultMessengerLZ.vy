# pragma version 0.4.3

# Import ownership management
from snekmate.auth import ownable

initializes: ownable
exports: (
    ownable.owner,
    ownable.transfer_ownership,
    ownable.renounce_ownership,
)

# LayerZero module
from ..modules.oapp_vyper.src import OApp

initializes: OApp[ownable := ownable]
exports: (
    OApp.endpoint,
    OApp.peers,
    OApp.setPeer,
    OApp.setDelegate,
    OApp.isComposeMsgSender,
    OApp.allowInitializePath,
    OApp.nextNonce,
)

interface IVault:
    def mint(_receiver: address, _amount: uint256) -> uint256: nonpayable

event Receive:
    origin: OApp.Origin
    guid: bytes32
    message: Bytes[OApp.MAX_MESSAGE_SIZE]

event SetVault:
    vault: IVault

vault: public(IVault)

@deploy
def __init__(_endpoint: address):
    """
    @notice Initialize messenger with LZ endpoint and default gas settings
    @param _endpoint LayerZero endpoint address
    """
    ownable.__init__()
    ownable._transfer_ownership(tx.origin)

    OApp.__init__(_endpoint, tx.origin)


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
