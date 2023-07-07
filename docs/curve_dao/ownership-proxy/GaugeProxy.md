`GaugeProxy` is used for indirect ownership of [liquidity gauges](/docs/curve_dao/liq-gauges%26minting-crv/overview.md).

!!! info
    **`GaugeProxy`** contract is deployed on the Ethereum mainnet at: [0x519AFB566c05E00cfB9af73496D00217A630e4D5](https://etherscan.io/address/0x519AFB566c05E00cfB9af73496D00217A630e4D5#code).  
    Source code for this contract is available on [Github](https://github.com/curvefi/curve-dao-contracts/blob/master/contracts/GaugeProxy.vy).


## **Admin Ownership**

### `ownership_admin`
!!! description "`GaugeProxy.ownership_admin() -> address: view`"

    Getter for the ownership admin of the contract.

    Retuns: ownership admin (`address`).

    ??? quote "Source code"

        ```python hl_lines="1 4 5"
        ownership_admin: public(address)

        @external
        def __init__(_ownership_admin: address, _emergency_admin: address):
            self.ownership_admin = _ownership_admin
            self.emergency_admin = _emergency_admin
        ```

    === "Example"
        ```shell
        >>> GaugeProxy.ownership_admin()
        '0x40907540d8a6C65c637785e8f8B742ae6b0b9968'
        ```


### `future_ownership_admin`
!!! description "`GaugeProxy.future_ownership_admin() -> address: view`"

    Getter for the **future** ownership admin of the contract. This variable can be changed by calling [`commit_set_admins`](#commit_set_admins).

    Retuns: future ownership admin (`address`).

    ??? quote "Source code"

        ```python hl_lines="1 12"
        future_ownership_admin: public(address)

        @external
        def commit_set_admins(_o_admin: address, _e_admin: address):
            """
            @notice Set ownership admin to `_o_admin` and emergency admin to `_e_admin`
            @param _o_admin Ownership admin
            @param _e_admin Emergency admin
            """
            assert msg.sender == self.ownership_admin, "Access denied"

            self.future_ownership_admin = _o_admin
            self.future_emergency_admin = _e_admin

            log CommitAdmins(_o_admin, _e_admin)
        ```

    === "Example"
        ```shell
        >>> GaugeProxy.future_ownership_admin()
        '0x40907540d8a6C65c637785e8f8B742ae6b0b9968'
        ```

### `emergency_admin`
!!! description "`GaugeProxy.emergency_admin() -> address: view`"

    Getter for the emergency admin of the contract.

    Retuns: emgergency admin (`address`).

    ??? quote "Source code"

        ```python hl_lines="1 4 6"
        emergency_admin: public(address)

        @external
        def __init__(_ownership_admin: address, _emergency_admin: address):
            self.ownership_admin = _ownership_admin
            self.emergency_admin = _emergency_admin
        ```

    === "Example"
        ```shell
        >>> GaugeProxy.emergency_admin()
        '0x467947EE34aF926cF1DCac093870f613C96B1E0c'
        ```


### `future_emergency_admin`
!!! description "`GaugeProxy.future_emergency_admin() -> address: view`"

    Getter for the **future** ownership admin of the contract. This variable can be changed by calling [`commit_set_admins`](#commit_set_admins).

    Retuns: future emergency admin (`address`).

    ??? quote "Source code"

        ```python hl_lines="1 13"
        future_emergency_admin: public(address)

        @external
        def commit_set_admins(_o_admin: address, _e_admin: address):
            """
            @notice Set ownership admin to `_o_admin` and emergency admin to `_e_admin`
            @param _o_admin Ownership admin
            @param _e_admin Emergency admin
            """
            assert msg.sender == self.ownership_admin, "Access denied"

            self.future_ownership_admin = _o_admin
            self.future_emergency_admin = _e_admin

            log CommitAdmins(_o_admin, _e_admin)
        ```

    === "Example"
        ```shell
        >>> GaugeProxy.future_emergency_admin()
        '0x467947EE34aF926cF1DCac093870f613C96B1E0c'
        ```


### `commit_set_admins`
!!! description "`GaugeProxy.commit_set_admins(_o_admin: address, _e_admin: address):`"

    Function to set ownership admin to `_o_admin` and emergency admin to `_e_admin`.

    !!!note
        This function is only callable by the **current** `ownership_admin`.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_o_admin` |  `address` | New Ownership Admin Address |
    | `_e_admin` |  `address` | New Emergency Admin Address |

    ??? quote "Source code"

        ```python hl_lines="1 8 9 12"
        event CommitAdmins:
            ownership_admin: address
            emergency_admin: address

        ownership_admin: public(address)
        emergency_admin: public(address)

        future_ownership_admin: public(address)
        future_emergency_admin: public(address)

        @external
        def commit_set_admins(_o_admin: address, _e_admin: address):
            """
            @notice Set ownership admin to `_o_admin` and emergency admin to `_e_admin`
            @param _o_admin Ownership admin
            @param _e_admin Emergency admin
            """
            assert msg.sender == self.ownership_admin, "Access denied"

            self.future_ownership_admin = _o_admin
            self.future_emergency_admin = _e_admin

            log CommitAdmins(_o_admin, _e_admin)
        ```

    === "Example"
        ```shell
        >>> GaugeProxy.commit_set_admins('todo):
        todo
        ```


### `accept_set_admins`
!!! description "`GaugeProxy.accept_set_admins():`"

    Function to apply the effect of `commit_set_admins`.

    !!!note
        This function is only callable by the **new** admin (=`future_ownership_admin`).

    ??? quote "Source code"

        ```python hl_lines="1 8 9 12"
        event CommitAdmins:
            ownership_admin: address
            emergency_admin: address

        ownership_admin: public(address)
        emergency_admin: public(address)

        future_ownership_admin: public(address)
        future_emergency_admin: public(address)

        @external
        def accept_set_admins():
            """
            @notice Apply the effects of `commit_set_admins`
            @dev Only callable by the new owner admin
            """
            assert msg.sender == self.future_ownership_admin, "Access denied"

            e_admin: address = self.future_emergency_admin
            self.ownership_admin = msg.sender
            self.emergency_admin = e_admin

            log ApplyAdmins(msg.sender, e_admin)
        ```

    === "Example"
        ```shell
        >>> GaugeProxy.accept_set_admins():
        todo
        ```



## **Gauge Ownership**

### `commit_transfer_ownership`
!!! description "`GaugeProxy.commit_transfer_ownership(_gauge: address, new_owner: address):`"

    Function to transfer ownership for liquidity gauge `_gauge` to `new_owner`.

    !!!note
        This function is only callable by the **current** `ownership_admin`.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_gauge` |  `address` | Gauge address which ownership is to be transferred |
    | `new_owner` |  `address` | New gauge owner address |

    ??? quote "Source code"

        ```python hl_lines="4 9"
        interface LiquidityGauge:
            def set_rewards(_reward_contract: address, _sigs: bytes32, _reward_tokens: address[8]): nonpayable
            def set_killed(_is_killed: bool): nonpayable
            def commit_transfer_ownership(addr: address): nonpayable
            def accept_transfer_ownership(): nonpayable

        @external
        @nonreentrant('lock')
        def commit_transfer_ownership(_gauge: address, new_owner: address):
            """
            @notice Transfer ownership for liquidity gauge `_gauge` to `new_owner`
            @param _gauge Gauge which ownership is to be transferred
            @param new_owner New gauge owner address
            """
            assert msg.sender == self.ownership_admin, "Access denied"
            LiquidityGauge(_gauge).commit_transfer_ownership(new_owner)
        ```

    === "Example"
        ```shell
        >>> GaugeProxy.commit_transfer_ownership(_gauge: address, new_owner: address):
        todo
        ```


### `accept_transfer_ownership`
!!! description "`GaugeProxy.accept_transfer_ownership(_gauge: address):`"

    Function to apply the ownership transfer of `_gauge`.

    !!!note
        Why can this be called by anyone?

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_gauge` |  `address` | Gauge address which ownership is to be applied |

    ??? quote "Source code"

        ```python hl_lines="5 9"
        interface LiquidityGauge:
            def set_rewards(_reward_contract: address, _sigs: bytes32, _reward_tokens: address[8]): nonpayable
            def set_killed(_is_killed: bool): nonpayable
            def commit_transfer_ownership(addr: address): nonpayable
            def accept_transfer_ownership(): nonpayable

        @external
        @nonreentrant('lock')
        def accept_transfer_ownership(_gauge: address):
            """
            @notice Apply transferring ownership of `_gauge`
            @param _gauge Gauge address
            """
            LiquidityGauge(_gauge).accept_transfer_ownership()
        ```

    === "Example"
        ```shell
        >>> GaugeProxy.accept_transfer_ownership():
        todo
        ```


### `set_killed`
!!! description "`GaugeProxy.set_killed(_gauge: address, _is_killed: bool):`"

    Function to set the killed status for `gauge`.

    !!!warning
        Can only be called by the ownership or emergency admin.
        Once killed, a gauge always yields at a rate of 0 and so cannot mint CRV. Any vote-weight give to a killed gauge effectively burns CRV.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_gauge` |  `address` | Gauge address to set the killed status |
    | `_is_killed` |  `bool` | Killed status to set |

    ??? quote "Source code"

        ```python hl_lines="3 9 18"
        interface LiquidityGauge:
            def set_rewards(_reward_contract: address, _sigs: bytes32, _reward_tokens: address[8]): nonpayable
            def set_killed(_is_killed: bool): nonpayable
            def commit_transfer_ownership(addr: address): nonpayable
            def accept_transfer_ownership(): nonpayable

        @external
        @nonreentrant('lock')
        def set_killed(_gauge: address, _is_killed: bool):
            """
            @notice Set the killed status for `_gauge`
            @dev When killed, the gauge always yields a rate of 0 and so cannot mint CRV
            @param _gauge Gauge address
            @param _is_killed Killed status to set
            """
            assert msg.sender in [self.ownership_admin, self.emergency_admin], "Access denied"

            LiquidityGauge(_gauge).set_killed(_is_killed)
        ```

    === "Example"
        ```shell
        >>> GaugeProxy.set_killed("gauge", true or flase):
        todo
        ```

### `set_rewards`
!!! description "`GaugeProxy.set_rewards(_gauge: address, _reward_contract: address, _sigs: bytes32, _reward_tokens: address[8]):`"

    Function to set the active reward contract for a LiquidityGaugeV2 deployment.

    !!!note
        This function can only callable by the ownership admin.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_gauge` |  `address` | Gauge address |
    | `_reward_contract` |  `address` | Address of the staking contract. Set to `ZERO_ADDRESS` if staking rewards are being removed|
    | `_sigs` |  `bytes32` | A concatenation of three four-byte function signatures: `stake`, `withdraw` and `getReward`. The signatures are then right padded with empty bytes|
    | `_reward_tokens` |  `address[8]` | Array of rewards tokens received from the staking contract |

    ??? quote "Source code"

        ```python hl_lines="2 9 23"
        interface LiquidityGauge:
            def set_rewards(_reward_contract: address, _sigs: bytes32, _reward_tokens: address[8]): nonpayable
            def set_killed(_is_killed: bool): nonpayable
            def commit_transfer_ownership(addr: address): nonpayable
            def accept_transfer_ownership(): nonpayable

        @external
        @nonreentrant('lock')
        def set_rewards(_gauge: address, _reward_contract: address, _sigs: bytes32, _reward_tokens: address[8]):
            """
            @notice Set the active reward contract for `_gauge`
            @param _gauge Gauge address
            @param _reward_contract Reward contract address. Set to ZERO_ADDRESS to
                                    disable staking.
            @param _sigs Four byte selectors for staking, withdrawing and claiming,
                        right padded with zero bytes. If the reward contract can
                        be claimed from but does not require staking, the staking
                        and withdraw selectors should be set to 0x00
            @param _reward_tokens List of claimable tokens for this reward contract
            """
            assert msg.sender == self.ownership_admin, "Access denied"

            LiquidityGauge(_gauge).set_rewards(_reward_contract, _sigs, _reward_tokens)
        ```

    === "Example"
        ```shell
        >>> GaugeProxy.set_killed("gauge", true or flase):
        todo
        ```