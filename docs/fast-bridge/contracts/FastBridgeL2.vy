# pragma version 0.4.3
"""
@title FastBridgeL2
@notice A contract responsible for Fast Bridge on L2
@license MIT
@author curve.fi
@custom:version 0.0.1
@custom:security security@curve.fi
"""

version: public(constant(String[8])) = "0.0.1"


from ethereum.ercs import IERC20
from snekmate.auth import ownable
from contracts.bridgers import IBridger

implements: IBridger
initializes: ownable
exports: (
    ownable.owner,
    ownable.transfer_ownership,
    ownable.renounce_ownership,
)

interface IMessenger:
    def initiate_fast_bridge(_to: address, _amount: uint256, _lz_fee_refund: address): payable
    def quote_message_fee() -> uint256: view

event SetMinAmount:
    min_amount: uint256

event SetLimit:
    limit: uint256

event SetBridger:
    bridger: IBridger

event SetMessenger:
    messenger: IMessenger


CRVUSD: public(immutable(IERC20))
VAULT: public(immutable(address))

INTERVAL: constant(uint256) = 86400  # 1 day
min_amount: public(uint256)  # Minimum amount to initiate bridge. Might be costy to claim on Ethereum
limit: public(uint256)  # Maximum amount to bridge in an INTERVAL, so there's no queue to resolve to claim on Ethereum
bridged: public(HashMap[uint256, uint256])  # Amounts of bridge coins per INTERVAL

bridger: public(IBridger)
messenger: public(IMessenger)


@deploy
def __init__(_crvusd: IERC20, _vault: address, _bridger: IBridger, _messenger: IMessenger):
    """
    @param _crvusd Address of crvUSD on L2
    @param _vault Address of Vault on mainnet
    @param _bridger Address of native bridge adapter
    @param _messenger Address of fast transport layer adapter
    """
    ownable.__init__()
    ownable._transfer_ownership(tx.origin) # for case of proxy deployment

    assert _crvusd != empty(IERC20), "Bad crvusd value"
    assert _vault != empty(address), "Bad vault value"
    CRVUSD = _crvusd
    VAULT = _vault

    assert _bridger != empty(IBridger), "Bad bridger value"
    self.bridger = _bridger
    assert extcall CRVUSD.approve(_bridger.address, max_value(uint256), default_return_value=True)
    log SetBridger(bridger=_bridger)

    assert _messenger != empty(IMessenger), "Bad messanger value"
    self.messenger = _messenger
    log SetMessenger(messenger=_messenger)

    self.min_amount = 10**18
    self.limit = 10**18
    log SetMinAmount(min_amount=self.min_amount)
    log SetLimit(limit=self.limit)


@internal
@view
def messaging_cost() -> uint256:
    """
    Messaging cost to pass message to VAULT (Fast Bridge)
    @return Native token amount needed for messenger
    """
    return staticcall self.messenger.quote_message_fee()


@internal
@view
def bridger_cost() -> uint256:
    """
    Bridger cost to bridge crvUSD to VAULT (Native Bridge)
    @return Native token amount needed for bridger
    """
    return staticcall self.bridger.cost()


@external
@view
def cost() -> uint256:
    """
    @notice Quote messaging fee in native token. This value has to be provided 
    as msg.value when calling bridge(). This is not fee in crvUSD that is paid to the vault!
    @return Native token amount needed for bridge tx
    """
    return self.messaging_cost() + self.bridger_cost()


@view
def _get_available(ts: uint256=block.timestamp) -> uint256:
    limit: uint256 = self.limit
    bridged: uint256 = self.bridged[ts // INTERVAL]
    return limit - min(bridged, limit)


@external
@payable
def bridge(_token: IERC20, _to: address, _amount: uint256, _min_amount: uint256=0) -> uint256:
    """
    @notice Bridge crvUSD
    @param _token The token to bridge (only crvUSD is supported)
    @param _to The receiver on destination chain
    @param _amount The amount of crvUSD to deposit, 2^256-1 for the whole available balance
    @param _min_amount Minimum amount to bridge
    @return Bridged amount
    """
    assert _token == CRVUSD, "Not supported"
    assert _to != empty(address), "Bad receiver"

    amount: uint256 = _amount
    if amount == max_value(uint256):
        amount = min(staticcall CRVUSD.balanceOf(msg.sender), staticcall CRVUSD.allowance(msg.sender, self))

    # Apply daily limit
    available: uint256 = self._get_available()
    amount = min(amount, available)
    assert amount >= _min_amount

    assert extcall CRVUSD.transferFrom(msg.sender, self, amount, default_return_value=True)
    self.bridged[block.timestamp // INTERVAL] += amount

    bridger_cost: uint256 = self.bridger_cost()
    messaging_cost: uint256 = self.messaging_cost()
    assert msg.value >= bridger_cost + messaging_cost, "Insufficient msg.value"
    
    # Initiate bridge transaction using native bridge
    extcall self.bridger.bridge(CRVUSD, VAULT, amount, self.min_amount, value=bridger_cost)

    # Message for VAULT to release amount while waiting
    extcall self.messenger.initiate_fast_bridge(_to, amount, msg.sender, value=messaging_cost)

    # Refund the rest of the msg.value
    if msg.value > bridger_cost + messaging_cost:
        send(msg.sender, msg.value - bridger_cost - messaging_cost)

    log IBridger.Bridge(token=_token, sender=msg.sender, receiver=_to, amount=amount)
    return amount


@external
@view
def allowed_to_bridge(_ts: uint256=block.timestamp) -> (uint256, uint256):
    """
    @notice Get interval of allowed amounts to bridge
    @param _ts Timestamp at which to check (current by default)
    @return (minimum, maximum) amounts allowed to bridge
    """
    if _ts < block.timestamp:  # outdated
        return (0, 0)

    available: uint256 = self._get_available(_ts)

    # Funds transferred to the contract are lost :(
    min_amount: uint256 = self.min_amount

    if available < min_amount:  # Not enough for bridge initiation
        return (0, 0)
    return (min_amount, available)


@external
def set_min_amount(_min_amount: uint256):
    """
    @notice Set minimum amount allowed to bridge
    @param _min_amount Minimum amount
    """
    ownable._check_owner()

    self.min_amount = _min_amount
    log SetMinAmount(min_amount=_min_amount)


@external
def set_limit(_limit: uint256):
    """
    @notice Set new limit
    @param _limit Limit on bridging per INTERVAL
    """
    ownable._check_owner()

    self.limit = _limit
    log SetLimit(limit=_limit)


@external
def set_bridger(_bridger: IBridger):
    """
    @notice Set new bridger
    @param _bridger Contract initiating actual bridge transaction
    """
    ownable._check_owner()
    assert _bridger != empty(IBridger), "Bad bridger value"

    assert extcall CRVUSD.approve(self.bridger.address, 0, default_return_value=True)
    assert extcall CRVUSD.approve(_bridger.address, max_value(uint256), default_return_value=True)
    self.bridger = _bridger
    log SetBridger(bridger=_bridger)


@external
def set_messenger(_messenger: IMessenger):
    """
    @notice Set new messenger
    @param _messenger Contract passing bridge tx fast
    """
    ownable._check_owner()
    assert _messenger != empty(IMessenger), "Bad messenger value"

    self.messenger = _messenger
    log SetMessenger(messenger=_messenger)
