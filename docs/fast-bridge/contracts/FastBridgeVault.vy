# pragma version 0.4.3

"""
@title FastBridgeVault
@notice Vault with crvUSD for FastBridge
@license MIT
@author curve.fi
@custom:version 0.0.1
@custom:security security@curve.fi
"""

version: public(constant(String[8])) = "0.0.1"

from ethereum.ercs import IERC20
from snekmate.auth import access_control

initializes: access_control
exports: (
    access_control.hasRole,
    access_control.getRoleAdmin,
    access_control.DEFAULT_ADMIN_ROLE,
    access_control.grantRole,
    access_control.revokeRole,
    access_control.renounceRole,
    access_control.set_role_admin
)

interface IMinter:  # ControllerFactory
    def rug_debt_ceiling(_to: address): nonpayable
    def debt_ceiling(of: address) -> uint256: view
    def debt_ceiling_residual(of: address) -> uint256: view

event Minted:
    receiver: indexed(address)
    amount: uint256

event RugScheduled:
    status: bool

event SetFee:
    fee: uint256

event SetFeeReceiver:
    fee_receiver: address

event SetKilled:
    actor: indexed(address)
    killed: bool

event Recovered:
    token: indexed(IERC20)
    receiver: address
    amount: uint256

struct RecoverInput:
    coin: IERC20
    amount: uint256

MINTER_ROLE: public(constant(bytes32)) = keccak256("MINTER")
KILLER_ROLE: public(constant(bytes32)) = keccak256("KILLER")

CRVUSD: public(constant(IERC20)) = IERC20(0xf939E0A03FB07F59A73314E73794Be0E57ac1b4E)
MINTER: public(constant(IMinter)) = IMinter(0xC9332fdCB1C491Dcc683bAe86Fe3cb70360738BC)

balanceOf: public(HashMap[address, uint256])

fee: public(uint256)  # 10^18 precision
fee_receiver: public(address)

rug_scheduled: public(bool)
is_killed: public(HashMap[address, bool])


@deploy
def __init__(_ownership: address, _emergency: address, _minters: DynArray[address, 4]):
    """
    @param _ownership Address of owner admin
    @param _emergency Address of emergency(kill operations) admin
    @param _minters Addresses of contracts able to mint tokens from vault
    """
    access_control.__init__()

    for minter: address in _minters:
        assert minter != empty(address), "Bad minter"
        access_control._grant_role(MINTER_ROLE, minter)

    assert _ownership != empty(address), "Bad owner"
    assert _emergency != empty(address), "Bad emergency"
    access_control._revoke_role(access_control.DEFAULT_ADMIN_ROLE, msg.sender)
    access_control._grant_role(access_control.DEFAULT_ADMIN_ROLE, _ownership)
    access_control._grant_role(KILLER_ROLE, _emergency)

    # Allow ControllerFactory to rug debt ceiling and burn coins
    assert extcall CRVUSD.approve(MINTER.address, max_value(uint256), default_return_value=True)

    # initially no fee
    self.fee_receiver = 0xa2Bcd1a4Efbd04B63cd03f5aFf2561106ebCCE00  # FeeCollector
    log SetFeeReceiver(fee_receiver=0xa2Bcd1a4Efbd04B63cd03f5aFf2561106ebCCE00)


@view
def _need_to_rug() -> bool:
    """
    @notice Check if there was a cut in debt ceiling
    """
    return staticcall MINTER.debt_ceiling_residual(self) > staticcall MINTER.debt_ceiling(self)


@internal
def _get_balance() -> uint256:
    """
    @notice Get balance of crvUSD after rugging debt ceiling
    @return Amount of crvUSD available to mint
    """
    if self.rug_scheduled:
        extcall MINTER.rug_debt_ceiling(self)
        if not self._need_to_rug():
            self.rug_scheduled = False
            log RugScheduled(status=False)
        else:
            return 0
    return staticcall CRVUSD.balanceOf(self)


@external
def schedule_rug() -> bool:
    """
    @notice Schedule rugging debt ceiling if necessary. Callable by anyone
    @return Boolean whether need to rug or not
    """
    rug_scheduled: bool = self._need_to_rug()
    self.rug_scheduled = rug_scheduled
    log RugScheduled(status=rug_scheduled)
    return rug_scheduled


@external
@nonreentrant
def mint(_receiver: address, _amount: uint256) -> uint256:
    """
    @notice Receive bridged crvUSD
    @param _receiver Receiver of crvUSD
    @param _amount Amount of crvUSD to mint (0 if not minter)
    @return Amount of crvUSD minted to receiver
    """
    assert not (self.is_killed[empty(address)] or self.is_killed[msg.sender])

    amount: uint256 = self.balanceOf[_receiver]
    if access_control.hasRole[MINTER_ROLE][msg.sender]:
        amount += _amount

        # Apply fee
        fee: uint256 = _amount * self.fee // 10 ** 18
        fee_receiver: address = self.fee_receiver
        if _receiver != fee_receiver:
            self.balanceOf[fee_receiver] += fee
            amount -= fee

    available: uint256 = min(self._get_balance(), amount)
    if available != 0:
        assert extcall CRVUSD.transfer(_receiver, available, default_return_value=True)
    self.balanceOf[_receiver] = amount - available

    log Minted(receiver=_receiver, amount=available)
    return available


@external
def set_killed(_status: bool, _who: address=empty(address)):
    """
    @notice Emergency method to kill minter
    @param _status Boolean whether to stop minter from working
    @param _who Minter to kill/unkill, empty address to kill all receiving
    """
    access_control._check_role(KILLER_ROLE, msg.sender)

    self.is_killed[_who] = _status
    log SetKilled(actor=_who, killed=_status)


@external
def set_fee(_new_fee: uint256):
    """
    @notice Set fee on bridge transactions
    @param _new_fee Fee with 10^18 precision
    """
    access_control._check_role(access_control.DEFAULT_ADMIN_ROLE, msg.sender)
    assert _new_fee <= 10 ** 18

    self.fee = _new_fee
    log SetFee(fee=_new_fee)


@external
def set_fee_receiver(_new_fee_receiver: address):
    """
    @notice Set new fee receiver
    @param _new_fee_receiver Fee receiver address
    """
    access_control._check_role(access_control.DEFAULT_ADMIN_ROLE, msg.sender)
    assert _new_fee_receiver != empty(address)

    self.fee_receiver = _new_fee_receiver
    log SetFeeReceiver(fee_receiver=_new_fee_receiver)


@external
def recover(_recovers: DynArray[RecoverInput, 32], _receiver: address):
    """
    @notice Recover ERC20 tokens from this contract. Needed in case of minter malfunction.
    @dev Callable only by owner
    @param _recovers (Token, amount) to recover
    @param _receiver Receiver of coins
    """
    access_control._check_role(access_control.DEFAULT_ADMIN_ROLE, msg.sender)

    for input: RecoverInput in _recovers:
        amount: uint256 = input.amount
        if amount == max_value(uint256):
            amount = staticcall input.coin.balanceOf(self)
        extcall input.coin.transfer(_receiver, amount, default_return_value=True)  # do not need safe transfer
        log Recovered(token=input.coin, receiver=_receiver, amount=amount)
