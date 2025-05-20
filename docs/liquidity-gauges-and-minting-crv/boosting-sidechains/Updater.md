<h1>Updater</h1>

The `Updater` contract is deployed on Ethereum mainnet and is used to transmit veCRV information across chains to a `L2 VotingEscrow Oracle`.

---


### `VOTING_ESCROW`
!!! description "`Updater.VOTING_ESCROW() -> address: view`"

    Getter for the address of the voting escrow contract. This variable is constant and points to the voting escrow contract on Ethereum mainnet and can not be changed.

    Returns: `VotingEscrow` contract (`address`).

    ??? quote "Source code"

        === "Updater.vy"

            ```python
            interface VotingEscrow:
                def epoch() -> uint256: view
                def point_history(_idx: uint256) -> Point: view
                def user_point_epoch(_user: address) -> uint256: view
                def user_point_history(_user: address, _idx: uint256) -> Point: view
                def locked(_user: address) -> LockedBalance: view
                def slope_changes(_ts: uint256) -> int128: view

            VOTING_ESCROW: public(constant(address)) = 0x5f3b5DfEb7B28CDbD7FAba78963EE202a494e2A2
            ```

    === "Example"

        ```python
        >>> Updater.VOTING_ESCROW()
        '0x5f3b5DfEb7B28CDbD7FAba78963EE202a494e2A2'
        ```


### `ovm_chain`
!!! description "`Updater.ovm_chain() -> address: view`"

    Getter for the chain id of the alternate chain.

    Returns: Chain id of the alternate chain (`address`).

    ??? quote "Source code"

        === "Updater.vy"

            ```python
            ovm_chain: public(address)  # CanonicalTransactionChain
            ovm_messenger: public(address)  # CrossDomainMessenger

            @external
            def __init__(_ovm_chain: address, _ovm_messenger: address):
                self.ovm_chain = _ovm_chain
                self.ovm_messenger = _ovm_messenger
            ```

    === "Example"

        ```python
        >>> Updater.ovm_chain()
        '0x0000000000000000000000000000000000000000'
        ```


### `ovm_messenger`
!!! description "`Updater.ovm_messenger() -> address: view`"

    Getter for the address of the `CrossDomainMessenger` contract on the alternate chain.

    Returns: `CrossDomainMessenger` contract (`address`).

    ??? quote "Source code"

        === "Updater.vy"

            ```python
            ovm_chain: public(address)  # CanonicalTransactionChain
            ovm_messenger: public(address)  # CrossDomainMessenger

            @external
            def __init__(_ovm_chain: address, _ovm_messenger: address):
                self.ovm_chain = _ovm_chain
                self.ovm_messenger = _ovm_messenger
            ```

    === "Example"

        ```python
        >>> Updater.ovm_messenger()
        '0x126bcc31Bc076B3d515f60FBC81FddE0B0d542Ed'  # Fraxtal L1 Cross Domain Messenger Proxy
        ```



### `update`
!!! description "`Updater.update(_user: address = msg.sender, _gas_limit: uint32 = 0)`"

    Function to update the voting escrow information on the alternate chain. This call transmits the following information: current `epoch`, `point_history` of the current epoch, `user_point_epoch` of the user, `user_point_history` of the user at their `user_point_epoch`, `locked` balance, and `slope_changes` for the past 12 weeks.

    | Parameter | Type | Description |
    | --------- | ---- | ------------ |
    | `_user` | `address` | The user to update the voting escrow information for. Defaults to the caller of the function. |
    | `_gas_limit` | `uint32` | The gas limit for the transaction. If 0, the function will attempt to retrieve the gas limit from the alternate chain. |

    ??? quote "Source code"

        === "Updater.vy"

            ```python
            interface OVMMessenger:
                def sendMessage(_target: address, _data: Bytes[1024], _gas_limit: uint32): nonpayable

            interface OVMChain:
                def enqueueL2GasPrepaid() -> uint32: view

            interface VotingEscrow:
                def epoch() -> uint256: view
                def point_history(_idx: uint256) -> Point: view
                def user_point_epoch(_user: address) -> uint256: view
                def user_point_history(_user: address, _idx: uint256) -> Point: view
                def locked(_user: address) -> LockedBalance: view
                def slope_changes(_ts: uint256) -> int128: view

            struct LockedBalance:
                amount: int128
                end: uint256

            struct Point:
                bias: int128
                slope: int128
                ts: uint256
                blk: uint256

            WEEK: constant(uint256) = 86400 * 7
            VOTING_ESCROW: public(constant(address)) = 0x5f3b5DfEb7B28CDbD7FAba78963EE202a494e2A2

            ovm_chain: public(address)  # CanonicalTransactionChain
            ovm_messenger: public(address)  # CrossDomainMessenger

            @external
            def __init__(_ovm_chain: address, _ovm_messenger: address):
                self.ovm_chain = _ovm_chain
                self.ovm_messenger = _ovm_messenger

            @external
            def update(_user: address = msg.sender, _gas_limit: uint32 = 0):
                # https://community.optimism.io/docs/developers/bridge/messaging/#for-l1-%E2%87%92-l2-transactions
                gas_limit: uint32 = _gas_limit
                if gas_limit == 0:
                    gas_limit = OVMChain(self.ovm_chain).enqueueL2GasPrepaid()

                epoch: uint256 = VotingEscrow(VOTING_ESCROW).epoch()
                point_history: Point = VotingEscrow(VOTING_ESCROW).point_history(epoch)

                user_point_epoch: uint256 = VotingEscrow(VOTING_ESCROW).user_point_epoch(_user)
                user_point_history: Point = VotingEscrow(VOTING_ESCROW).user_point_history(_user, user_point_epoch)
                locked: LockedBalance = VotingEscrow(VOTING_ESCROW).locked(_user)

                start_time: uint256 = WEEK + (point_history.ts / WEEK) * WEEK
                slope_changes: int128[12] = empty(int128[12])

                for i in range(12):
                    slope_changes[i] = VotingEscrow(VOTING_ESCROW).slope_changes(start_time + WEEK * i)

                OVMMessenger(self.ovm_messenger).sendMessage(
                    self,
                    _abi_encode(
                        _user,
                        epoch,
                        point_history,
                        user_point_epoch,
                        user_point_history,
                        locked,
                        slope_changes,
                        method_id=method_id("update(address,uint256,(int128,int128,uint256,uint256),uint256,(int128,int128,uint256,uint256),(int128,uint256),int128[12])")
                    ),
                    gas_limit
                )
            ```

    === "Example"

        ```python
        >>> Updater.update()
        ```
