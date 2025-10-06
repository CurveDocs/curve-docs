<h1>FastBridgeVault</h1>

The FastBridgeVault is the Ethereum mainnet component of the FastBridge system, responsible for managing pre-minted crvUSD tokens and handling the fast bridge mechanism. This contract serves as the central vault that holds crvUSD tokens that can be immediately released to users while their native bridge transactions are still pending.

The vault operates as a secure intermediary that bridges the gap between the slow but reliable native bridge mechanism and the immediate access requirements of users. It implements sophisticated risk management through debt ceilings, fee collection, and emergency controls to ensure system stability and user fund safety.

!!!vyper "`FastBridgeVault.vy`"
    The source code for the `FastBridgeVault.vy` contract can be found on [:material-github: GitHub](https://github.com/curvefi/fast-bridge/blob/main/contracts/FastBridgeVault.vy). The contract is written using [Vyper](https://github.com/vyperlang/vyper) version `0.4.3` and utilizes a [Snekmate module](https://github.com/pcaversaccio/snekmate/blob/main/src/snekmate/auth/access_control.vy) to handle contract ownership.

    The source code was audited by [:logos-chainsecurity: ChainSecurity](https://www.chainsecurity.com/). The full audit report can be found [here](../assets/pdf/ChainSecurity_Curve_Fast_Bridge_audit.pdf).

---

## Core Functions

The FastBridgeVault provides essential functions for managing the fast bridge process, including token minting, fee collection, and emergency controls. These functions 
work together to provide immediate access to bridged funds while maintaining the security and economic sustainability of the system.

### `mint`
!!! description "`FastBridgeVault.mint(_receiver: address, _amount: uint256) -> uint256`"

    Releases pre-minted crvUSD from the vault's balance to the receiver. For callers with `MINTER_ROLE`, the function can additionally increase the receiver's claimable balance by `_amount`. The operation applies fees and respects kill switches for emergency situations. The vault's fast releases are economically backed by the incoming native-bridge transfers and debt-ceiling rug mechanism; it does not increase total crvUSD supply beyond what is backed by the slow bridge path.

    | Input      | Type      | Description |
    | ---------- | --------- | ------------ |
    | `_receiver` | `address` | Receiver of crvUSD tokens |
    | `_amount` | `uint256` | Amount of crvUSD to mint (0 if not minter) |

    Returns: Amount of crvUSD actually minted to the receiver (`uint256`).

    ??? quote "Source code"

        === "FastBridgeVault.vy"

            ```python
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
            ```

    === "Example"

        ```shell
        ```

### `schedule_rug`
!!! description "`FastBridgeVault.schedule_rug() -> bool`"

    Checks if the vault needs to rug (reduce) its debt ceiling due to changes in the minter's debt ceiling. This function can be called by anyone and schedules the rugging process if necessary.

    Returns: Boolean indicating whether rugging is needed (`bool`).

    ??? quote "Source code"

        === "FastBridgeVault.vy"

            ```python
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
            ```

    === "Example"

        ```shell
        ```

## Variables

The FastBridgeVault contract maintains several important state variables that control its operation, track balances, manage fees, and implement security mechanisms. These variables work together to ensure proper functioning of the fast bridge system while maintaining security and economic sustainability.
### `balanceOf`
!!! description "`FastBridgeVault.balanceOf(address) -> uint256`"

    Tracks the pending crvUSD balance for each address. This represents tokens that have been bridged but not yet claimed by the recipient.

    | Input      | Type      | Description |
    | ---------- | --------- | ------------ |
    | `address` | `address` | Address to check pending balance for |

    Returns: Pending crvUSD balance for the given address (`uint256`).

    ??? quote "Source code"

        === "FastBridgeVault.vy"

            ```python
            balanceOf: public(HashMap[address, uint256])
            ```

    === "Example"

        ```shell
        ```

### `fee`
!!! description "`FastBridgeVault.fee() -> uint256`"

    The fee rate applied to bridge transactions, expressed with 10^18 precision (e.g., 1% = 10^16).

    Returns: Fee rate with 10^18 precision (`uint256`).

    ??? quote "Source code"

        === "FastBridgeVault.vy"

            ```python
            fee: public(uint256)  # 10^18 precision
            ```

    === "Example"

        ```shell
        ```

### `fee_receiver`
!!! description "`FastBridgeVault.fee_receiver() -> address`"

    The address that receives the fees collected from bridge transactions.

    Returns: Fee receiver address (`address`).

    ??? quote "Source code"

        === "FastBridgeVault.vy"

            ```python
            fee_receiver: public(address)
            ```

    === "Example"

        ```shell
        ```

### `rug_scheduled`
!!! description "`FastBridgeVault.rug_scheduled() -> bool`"

    Indicates whether a debt ceiling rugging operation has been scheduled. This happens when the minter's debt ceiling has been reduced.

    Returns: Boolean indicating if rugging is scheduled (`bool`).

    ??? quote "Source code"

        === "FastBridgeVault.vy"

            ```python
            rug_scheduled: public(bool)
            ```

    === "Example"

        ```shell
        ```

### `is_killed`
!!! description "`FastBridgeVault.is_killed(address) -> bool`"

    Emergency kill switch that can disable specific minters or all minting operations. When killed, the specified address cannot mint tokens.

    | Input      | Type      | Description |
    | ---------- | --------- | ------------ |
    | `address` | `address` | Address to check kill status for |

    Returns: Boolean indicating if the address is killed (`bool`).

    ??? quote "Source code"

        === "FastBridgeVault.vy"

            ```python
            is_killed: public(HashMap[address, bool])
            ```

    === "Example"

        ```shell
        ```

### `version`
!!! description "`FastBridgeVault.version() -> String[8]`"

    The version identifier for this contract implementation.

    Returns: Contract version string (`String[8]`).

    ??? quote "Source code"

        === "FastBridgeVault.vy"

            ```python
            version: public(constant(String[8])) = "0.0.1"
            ```

    === "Example"

        ```shell
        ```

### `MINTER_ROLE`
!!! description "`FastBridgeVault.MINTER_ROLE() -> bytes32`"

    The role identifier for addresses that can mint crvUSD from the vault.

    Returns: Role identifier for minters (`bytes32`).

    ??? quote "Source code"

        === "FastBridgeVault.vy"

            ```python
            MINTER_ROLE: public(constant(bytes32)) = keccak256("MINTER")
            ```

    === "Example"

        ```shell
        ```

### `KILLER_ROLE`
!!! description "`FastBridgeVault.KILLER_ROLE() -> bytes32`"

    The role identifier for addresses that can kill/unkill minters in emergency situations.

    Returns: Role identifier for emergency operators (`bytes32`).

    ??? quote "Source code"

        === "FastBridgeVault.vy"

            ```python
            KILLER_ROLE: public(constant(bytes32)) = keccak256("KILLER")
            ```

    === "Example"

        ```shell
        ```

### `CRVUSD`
!!! description "`FastBridgeVault.CRVUSD() -> IERC20`"

    The crvUSD token contract address on mainnet. This is the token that gets minted from the vault.

    Returns: crvUSD token contract address (`IERC20`).

    ??? quote "Source code"

        === "FastBridgeVault.vy"

            ```python
            CRVUSD: public(constant(IERC20)) = IERC20(0xf939E0A03FB07F59A73314E73794Be0E57ac1b4E)
            ```

    === "Example"

        ```shell
        ```

### `MINTER`
!!! description "`FastBridgeVault.MINTER() -> IMinter`"

    The minter contract (ControllerFactory) that manages debt ceilings and can rug debt when necessary.

    Returns: Minter contract address (`IMinter`).

    ??? quote "Source code"

        === "FastBridgeVault.vy"

            ```python
            MINTER: public(constant(IMinter)) = IMinter(0xC9332fdCB1C491Dcc683bAe86Fe3cb70360738BC)
            ```

    === "Example"

        ```shell
        ```

---

## Admin Functions

The FastBridgeVault includes several administrative functions that allow authorized parties to manage the system's operation, configure parameters, and respond to emergency situations. These functions are protected by role-based access control to ensure only authorized personnel can make critical changes to the system.
### `set_killed`
!!! description "`FastBridgeVault.set_killed(_status: bool, _who: address=empty(address))`"

    !!!guard "Guarded Method by [Snekmate 🐍](https://github.com/pcaversaccio/snekmate)"
        This contract makes use of a Snekmate module to manage roles and permissions. This specific function can only be called by the `KILLER_ROLE` role.

    Emergency function to kill or unkill specific minters or all minting operations. Only addresses with KILLER_ROLE can call this function.

    | Input      | Type      | Description |
    | ---------- | --------- | ------------ |
    | `_status` | `bool` | Boolean whether to stop minter from working |
    | `_who` | `address` | Minter to kill/unkill, empty address to kill all receiving (default: empty address) |

    Returns: None.

    ??? quote "Source code"

        === "FastBridgeVault.vy"

            ```python
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
            ```

    === "Example"

        ```shell
        ```

### `set_fee`
!!! description "`FastBridgeVault.set_fee(_new_fee: uint256)`"

    !!!guard "Guarded Method by [Snekmate 🐍](https://github.com/pcaversaccio/snekmate)"
        This contract makes use of a Snekmate module to manage roles and permissions. This specific function can only be called by the `DEFAULT_ADMIN_ROLE` role.

    Updates the fee rate applied to bridge transactions. Only the admin can call this function. The fee cannot exceed 100% (10^18).

    | Input      | Type      | Description |
    | ---------- | --------- | ------------ |
    | `_new_fee` | `uint256` | New fee rate with 10^18 precision (max: 10^18) |

    Returns: None.

    ??? quote "Source code"

        === "FastBridgeVault.vy"

            ```python
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
            ```

    === "Example"

        ```shell
        ```

### `set_fee_receiver`
!!! description "`FastBridgeVault.set_fee_receiver(_new_fee_receiver: address)`"

    !!!guard "Guarded Method by [Snekmate 🐍](https://github.com/pcaversaccio/snekmate)"
        This contract makes use of a Snekmate module to manage roles and permissions. This specific function can only be called by the `DEFAULT_ADMIN_ROLE` role.

    Updates the address that receives fees from bridge transactions. Only the admin can call this function.

    | Input      | Type      | Description |
    | ---------- | --------- | ------------ |
    | `_new_fee_receiver` | `address` | New fee receiver address |

    Returns: None.

    ??? quote "Source code"

        === "FastBridgeVault.vy"

            ```python
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
            ```

    === "Example"

        ```shell
        ```

### `recover`
!!! description "`FastBridgeVault.recover(_recovers: DynArray[RecoverInput, 32], _receiver: address)`"

    !!!guard "Guarded Method by [Snekmate 🐍](https://github.com/pcaversaccio/snekmate)"
        This contract makes use of a Snekmate module to manage roles and permissions. This specific function can only be called by the `DEFAULT_ADMIN_ROLE` role.

    Emergency function to recover ERC20 tokens from the contract. This is needed in case of minter malfunction or other emergencies. Only the admin can call this function.

    | Input      | Type      | Description |
    | ---------- | --------- | ------------ |
    | `_recovers` | `DynArray[RecoverInput, 32]` | Array of (token, amount) pairs to recover |
    | `_receiver` | `address` | Address to receive the recovered tokens |

    Returns: None.

    ??? quote "Source code"

        === "FastBridgeVault.vy"

            ```python
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
            ```

    === "Example"

        ```shell
        ```

