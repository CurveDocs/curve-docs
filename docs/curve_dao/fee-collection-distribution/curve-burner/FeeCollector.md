<h1>FeeCollector.vy</h1>

The `FeeCollector.vy` contract is the core contract when handling admin fees. This contract collects all the fees, while burner contracts handle the burning of the coins. The contract has a [`target`](#target) variable, which represents the coin for which all the various fee tokens are burnt into.

The contract operates in different [epochs](#epochs) (phases) in which certain actions are possible.


!!!github "GitHub"
    The source code of the `FeeCollector.vy` contract can be found on [:material-github: GitHub](https://github.com/curvefi/curve-burners/blob/main/contracts/FeeCollector.vy).


---


## **Epochs**

The `epoch` function and its related internal functions are used to determine the current operational phase of the contract based on the timestamp. The contract operates in different phases (epochs) that dictate what actions can be performed at any given time. This helps in organizing the contract's workflow and ensuring that certain operations only occur during specific periods.

```py
enum Epoch:
    SLEEP  # 1
    COLLECT  # 2
    EXCHANGE  # 4
    FORWARD  # 8
```

*Each epoch represents a different state of the contract:*

- `SLEEP`: The contract is idle.
- `COLLECT`: The contract is in a state where it collects fees.
- `EXCHANGE`: The contract "burns" (exchanges) collected fees into the target coin.
- `FORWARD`: The contract forwards the accumulated target coin to the `FeeDistributor`.

*The `EPOCH_TIMESTAMPS` constant defines the start times for each epoch within a week:*

```py
START_TIME: constant(uint256) = 1600300800  # ts of distribution start
WEEK: constant(uint256) = 7 * 24 * 3600
EPOCH_TIMESTAMPS: constant(uint256[17]) = [
    0, 0,  # 1
    4 * 24 * 3600,  # 2
    0, 5 * 24 * 3600,   # 4
    0, 0, 0, 6 * 24 * 3600,  # 8
    0, 0, 0, 0, 0, 0, 0, WEEK,  # 16, next period
]
```


!!!info "Start and Duration of Epochs"
    The `SLEEP` epoch lasts for a total of four days, followed by one day of `COLLECT`, one day of `EXCHANGE`, and one day of `FORWARD`.

    Epoch start is not on Monday. The first fee distribution started on `Thu Sep 17 2020 00:00:00 GMT+0000` (1600300800)`. Therefore, day 0 of each new epoch starts on Thursday at 00:00:00 GMT.


### `epoch`
!!! description "`FeeCollector.epoch(ts: uint256=block.timestamp) -> Epoch`"

    Getter for the current epoch based on a given timestamp.

    Returns: current epoch (`uint256`). The returned value corresponds to the `Epoch` enum.

    | Input   | Type      | Description                    |
    | ---- | --------- | ------------------------------ |
    | `ts` | `uint256` | Timestamp. Deafaults to `msg.sesnder` |

    ??? quote "Source code"

        === "FeeCollector.vy"

            ```python
            enum Epoch:
                SLEEP  # 1
                COLLECT  # 2
                EXCHANGE  # 4
                FORWARD  # 8

            @external
            @view
            def epoch(ts: uint256=block.timestamp) -> Epoch:
                """
                @notice Get epoch at certain timestamp
                @param ts Timestamp. Current by default
                @return Epoch
                """
                return self._epoch_ts(ts)

            @internal
            @pure
            def _epoch_ts(ts: uint256) -> Epoch:
                ts = (ts - START_TIME) % WEEK
                for epoch in [Epoch.SLEEP, Epoch.COLLECT, Epoch.EXCHANGE, Epoch.FORWARD]:
                    if ts < EPOCH_TIMESTAMPS[2 * convert(epoch, uint256)]:
                        return epoch
                raise UNREACHABLE
            ```

    === "Example"
        ```shell
        >>> FeeCollector.epoch()
        2
        ```


### `epoch_time_frame`
!!! description "`FeeCollector.epoch_time_frame(_epoch: Epoch, _ts: uint256=block.timestamp) -> (uint256, uint256)`"

    Getter for the time frame for a specific epoch and timstamp.

    Returns: start and end of the epoch (`uint256`).

    | Input   | Type      | Description                    |
    | ------- | --------- | ------------------------------ |
    | `_epoch` | `uint256` | Index of the Epoch enum for which to check start and end for.     |
    | `_ts` | `uint256` | Timestamp to anoch to. Defaults to the current one (`block.timestamp`).     |

    ??? quote "Source code"

        === "FeeCollector.vy"

            ```python
            @external
            @view
            def epoch_time_frame(_epoch: Epoch, _ts: uint256=block.timestamp) -> (uint256, uint256):
                """
                @notice Get time frame of certain epoch
                @param _epoch Epoch
                @param _ts Timestamp to anchor to. Current by default
                @return [start, end) time frame boundaries
                """
                return self._epoch_time_frame(_epoch, _ts)

            @internal
            @pure
            def _epoch_time_frame(epoch: Epoch, ts: uint256) -> (uint256, uint256):
                subset: uint256 = convert(epoch, uint256)
                assert subset & (subset - 1) == 0, "Bad Epoch"

                ts = ts - (ts - START_TIME) % WEEK
                return (ts + EPOCH_TIMESTAMPS[convert(epoch, uint256)], ts + EPOCH_TIMESTAMPS[2 * convert(epoch, uint256)])
            ```

    === "Example"
        ```shell
        >>> FeeCollector.epoch_time_frame(1)        # SLEEP
        (1718236800, 1718582400)

        >>> FeeCollector.epoch_time_frame(2)        # COLLECT
        (1718582400, 1718668800)

        >>> FeeCollector.epoch_time_frame(4)        # EXCHANGE
        (1718668800, 1718755200)

        >>> FeeCollector.epoch_time_frame(8)        # FORWARD
        (1718755200, 1718841600)
        ```


---


## **Keeper's Fee**

The `FeeCollector` contract has a keeper's fee, which incentivizes external users or bots to perform specific actions at the appropriate times within the different epochs. The fee mechanism ensures that these operations are carried out reliably and efficiently by rewarding the entities that execute them.


### `fee`
!!! description "`FeeCollector.fee(_epoch: Epoch=empty(Epoch), _ts: uint256=block.timestamp) -> uint256`"

    Getter for the caller fee based on an epoch and timestamp. If no input is given, it returns the caller fee of the current epoch. The fee is depending on the current epoch.

    Returns: fee of the epoch (`uint256`).

    | Input    | Type      | Description                                  |
    |----------|-----------|----------------------------------------------|
    | `_epoch` | `uint256` | Index of the epoch. Defaults to the current epoch. |
    | `_ts`    | `uint256` | Timestamp. Defaults to `block.timestamp`     |

    ??? quote "Source code"

        === "FeeCollector.vy"

            ```python
            @external
            @view
            def fee(_epoch: Epoch=empty(Epoch), _ts: uint256=block.timestamp) -> uint256:
                """
                @notice Calculate keeper's fee
                @param _epoch Epoch to count fee for
                @param _ts Timestamp of collection
                @return Fee with base 10^18
                """
                if _epoch == empty(Epoch):
                    return self._fee(self._epoch_ts(_ts), _ts)
                return self._fee(_epoch, _ts)

            @internal
            @view
            def _fee(epoch: Epoch, ts: uint256) -> uint256:
                start: uint256 = 0
                end: uint256 = 0
                start, end = self._epoch_time_frame(epoch, ts)
                if ts >= end:
                    return 0
                return self.max_fee[convert(epoch, uint256)] * (ts + 1 - start) / (end - start)

            @internal
            @pure
            def _epoch_ts(ts: uint256) -> Epoch:
                ts = (ts - START_TIME) % WEEK
                for epoch in [Epoch.SLEEP, Epoch.COLLECT, Epoch.EXCHANGE, Epoch.FORWARD]:
                    if ts < EPOCH_TIMESTAMPS[2 * convert(epoch, uint256)]:
                        return epoch
                raise UNREACHABLE
            ```

    === "Example"
        ```shell
        >>> FeeCollector.fee()
        8375000000000000
        ```


### `max_fee`
!!! description "`FeeCollector.max_fee(arg0: uint256) -> uint256: view`"

    Getter for the maximum fee of an epoch. Maximum fee is set to 1% for the `COLLECT` and `FORWARD` epochs. This value can later on be changed by the `owner` of the contract using the [`set_max_fee`](#set_max_fee) function.

    Returns: maximum fee (`uint256`).

    Emits: `SetMaxFee` at contract initialization

    | Input    | Type      | Description                                              |
    |----------|-----------|----------------------------------------------------------|
    | `_epoch` | `uint256` | Index of the Epoch enum for which to check the maximum fee. |

    ??? quote "Source code"

        === "FeeCollector.vy"

            ```python
            event SetMaxFee:
                epoch: indexed(Epoch)
                max_fee: uint256

            enum Epoch:
                SLEEP  # 1
                COLLECT  # 2
                EXCHANGE  # 4
                FORWARD  # 8

            max_fee: public(uint256[9])  # max_fee[Epoch]

            @external
            def __init__(_target_coin: ERC20, _weth: wETH, _owner: address, _emergency_owner: address):
                """
                @notice Contract constructor
                @param _target_coin Coin to swap to
                @param _weth Wrapped ETH(native coin) address
                @param _owner Owner address
                @param _emergency_owner Emergency owner address. Can kill the contract
                """
                ...
                self.max_fee[convert(Epoch.COLLECT, uint256)] = ONE / 100  # 1%
                self.max_fee[convert(Epoch.FORWARD, uint256)] = ONE / 100  # 1%
                ...
                log SetMaxFee(Epoch.COLLECT, ONE / 100)
                log SetMaxFee(Epoch.FORWARD, ONE / 100)
                ...
            ```

    === "Example"
        ```shell
        >>> FeeCollector.max_fee(1)         # SLEEP
        0

        >>> FeeCollector.max_fee(2)         # COLLECT
        10000000000000000
        ```


### `set_max_fee`
!!! description "`FeeCollector.set_max_fee(_epoch: uin256, _max_fee: uint256)`"

    !!!guard "Guarded Method"
        This function is only callable by the `owner` of the contract.

    Function to set `max_fee` for a specific epoch. The maximum fee cannot be greater than 1 (100%).

    Emits: `SetMaxFee`

    | Input    | Type      | Description                                              |
    |----------|-----------|----------------------------------------------------------|
    | `_epoch` | `uint256` | Index of the Epoch enum for which to set the maximum fee. |
    | `_max_fee` | `uint256` | Maximum fee.                                            |

    ??? quote "Source code"

        === "FeeCollector.vy"

            ```python
            event SetMaxFee:
                epoch: indexed(Epoch)
                max_fee: uint256

            @external
            def set_max_fee(_epoch: Epoch, _max_fee: uint256):
                """
                @notice Set keeper's max fee
                @dev Callable only by owner
                @param _epoch Epoch to set fee for
                @param _max_fee Maximum fee to set
                """
                assert msg.sender == self.owner, "Only owner"
                subset: uint256 = convert(_epoch, uint256)
                assert subset & (subset - 1) == 0, "Bad Epoch"
                assert _max_fee <= ONE, "Bad max_fee"
                self.max_fee[convert(_epoch, uint256)] = _max_fee

                log SetMaxFee(_epoch, _max_fee)
            ```

    === "Example"
        ```shell
        >>> soon
        ```


---


## **Burn Process**

The `FeeCollector` contract has a [`target`](#target) variable, which represents the coin into which all the collected fees are "burnt" into. This variable can be changed by the [`owner`](#owner) of the contract using the [`set_target`](#set_target) function. As the owner of the contract is the Curve DAO, a on-chain proposal needs to be successfully passed to make any changes.

*The general flow of the fee burning process is the following:*

1. Admin fees are collected from pools or other revenue sources using the `withdraw_many` function. While fees of older pools need to claimed manually, the accrrued fees from newer pools (mostly NG pools) are periodically claimed when removing liquidity from the pool.
2. The accrrued tokens can be burned calling the `collect` function. This creates, if there isn't already one, a conditional order on CowSwap which automatically exchanges the fee tokens into the `target` coin.
3. After burning the tokens, they can be forwarded to the `FeeDistributor` using the `forward` function.


### `target`
!!! description "`FeeCollector.target() -> address: view`"

    Getter for the target coin to which the fees are converted to. This is essentially the reward token that is being distributed to veCRV holders.

    Returns: target coin (`address`).

    Emits: `SetTarget` at contract initialization

    ??? quote "Source code"

        === "FeeCollector.vy"

            ```python
            event SetTarget:
                target: indexed(ERC20)

            target: public(ERC20)  # coin swapped into

            @external
            def __init__(_target_coin: ERC20, _weth: wETH, _owner: address, _emergency_owner: address):
                """
                @notice Contract constructor
                @param _target_coin Coin to swap to
                @param _weth Wrapped ETH(native coin) address
                @param _owner Owner address
                @param _emergency_owner Emergency owner address. Can kill the contract
                """
                self.target = _target_coin
                ...
                log SetTarget(_target_coin)
                ...
            ```

    === "Example"
        ```shell
        >>> FeeCollector.target()
        '0xf939E0A03FB07F59A73314E73794Be0E57ac1b4E'
        ```


### `set_target`
!!! description "`FeeCollector.set_target(_new_target: ERC20)`"

    !!!guard "Guarded Method"
        This function is only callable by the `owner` of the contract.

    Function to change the target coin of the contract.

    Emits: `SetTarget`

    | Input   | Type      | Description                    |
    | ------- | --------- | ------------------------------ |
    | `_new_target` | `address` | Token address of the new target coin. |

    ??? quote "Source code"

        === "FeeCollector.vy"

            ```python
            event SetTarget:
                target: indexed(ERC20)

            target: public(ERC20)  # coin swapped into

            @external
            def set_target(_new_target: ERC20):
                """
                @notice Set new coin for fees accumulation
                @dev Callable only by owner
                @param _new_target Address of the new target coin
                """
                assert msg.sender == self.owner, "Only owner"

                target: ERC20 = self.target
                self.is_killed[target] = empty(Epoch)  # allow to collect and exchange
                log SetKilled(target, empty(Epoch))

                self.target = _new_target
                self.is_killed[_new_target] = Epoch.COLLECT | Epoch.EXCHANGE  # Keep target coin in contract
                log SetTarget(_new_target)
                log SetKilled(_new_target, Epoch.COLLECT | Epoch.EXCHANGE)
            ```

    === "Example"
        ```shell
        >>> soon
        ```


### `withdraw_many`
!!! description "`FeeCollector.withdraw_many(_pools: DynArray[address, MAX_LEN])`"

    Function to withdraw admin fees from multiple Curve pools. Maximum amount of pools to withdraw from within a single function call is 64. This function can be called by anyone and at any time. While the fee claiming of new-generation (NG) pools is partly automated, the fees of older pools or crvUSD market need to claimed manually. This function only works on contracts with a `withdraw_admin_fees` function. E.g. accurred fees from crvUSD markets are collected via a `collect_fees` function, therefore this function can not be used to claim those fees into this contract.

    | Input   | Type      | Description                    |
    | ------- | --------- | ------------------------------ |
    | `_pools` | `DynArray[address, MAX_LEN]` | Dynamic array containing the pool addresses to claim the admin fees from.     |

    ??? quote "Source code"

        === "FeeCollector.vy"

            ```python
            MAX_LEN: constant(uint256) = 64

            interface Curve:
                def withdraw_admin_fees(): nonpayable

            @external
            def withdraw_many(_pools: DynArray[address, MAX_LEN]):
                """
                @notice Withdraw admin fees from multiple pools
                @param _pools List of pool address to withdraw admin fees from
                """
                for pool in _pools:
                    Curve(pool).withdraw_admin_fees()
            ```

    === "Example"
        ```shell
        >>> soon
        ```


### `collect` 
!!! description "`FeeCollector.collect(_coins: DynArray[ERC20, MAX_LEN], _receiver: address=msg.sender)`"

    Function that is the primary mechanism for burning coins and can only be called during the `COLLECT` epoch. It calls the `burn` function of the burner contract, which creates a [conditional order](https://github.com/cowprotocol/composable-cow) on CowSwap if one has not already been created. This process effectively "burns" the collected coins by swapping them into the target coin. Additionally, the caller is awarded a [keeper fee](#keepers-fee) for their role in the process.

    | Input   | Type      | Description                    |
    | ------- | --------- | ------------------------------ |
    | `_coins` | `DynArray[ERC20, MAX_LEN]` | Dynamic array of coin addresses sorted in ascending order.     |
    | `_receiver` | `address` | Receiver of keeper fee. |

    ??? quote "Source code"

        === "FeeCollector.vy"

            ```python
            MAX_LEN: constant(uint256) = 64

            @external
            @nonreentrant("collect")
            def collect(_coins: DynArray[ERC20, MAX_LEN], _receiver: address=msg.sender):
                """
                @notice Collect earned fees. Collection should happen under callback to earn caller fees.
                @param _coins Coins to collect sorted in ascending order
                @param _receiver Receiver of caller `collect_fee`s
                """
                assert self._epoch_ts(block.timestamp) == Epoch.COLLECT, "Wrong epoch"
                assert not self.is_killed[ALL_COINS] in Epoch.COLLECT, "Killed epoch"

                for i in range(len(_coins), bound=MAX_LEN):
                    assert not self.is_killed[_coins[i]] in Epoch.COLLECT, "Killed coin"
                    # Eliminate case of repeated coins
                    if i > 0:
                        assert convert(_coins[i].address, uint160) > convert(_coins[i - 1].address, uint160), "Coins not sorted"

                self.burner.burn(_coins, _receiver)
            ```

        === "CowSwapBurner.vy"

            ```python
            interface FeeCollector:
                def fee(_epoch: Epoch=empty(Epoch), _ts: uint256=block.timestamp) -> uint256: view
                def target() -> ERC20: view
                def owner() -> address: view
                def emergency_owner() -> address: view
                def epoch_time_frame(epoch: Epoch, ts: uint256=block.timestamp) -> (uint256, uint256): view
                def can_exchange(_coins: DynArray[ERC20, MAX_COINS_LEN]) -> bool: view
                def transfer(_transfers: DynArray[Transfer, MAX_COINS_LEN]): nonpayable

            struct ConditionalOrderParams:
                # The contract implementing the conditional order logic
                handler: address  # self
                # Allows for multiple conditional orders of the same type and data
                salt: bytes32  # Not used for now
                # Data available to ALL discrete orders created by the conditional order
                staticData: Bytes[STATIC_DATA_LEN]  # Using coin address

            interface ComposableCow:
                def create(params: ConditionalOrderParams, dispatch: bool): nonpayable
                def domainSeparator() -> bytes32: view
                def isValidSafeSignature(
                    safe: address, sender: address, _hash: bytes32, _domainSeparator: bytes32, typeHash: bytes32,
                    encodeData: Bytes[15 * 32],
                    payload: Bytes[(32 + 3 + 1 + 8) * 32],
                ) -> bytes4: view

            @external
            def burn(_coins: DynArray[ERC20, MAX_COINS_LEN], _receiver: address):
                """
                @notice Post hook after collect to register coins for burn
                @dev Registers new orders in ComposableCow
                @param _coins Which coins to burn
                @param _receiver Receiver of profit
                """
                assert msg.sender == fee_collector.address, "Only FeeCollector"

                fee: uint256 = fee_collector.fee(Epoch.COLLECT)
                fee_payouts: DynArray[Transfer, MAX_COINS_LEN] = []
                self_transfers: DynArray[Transfer, MAX_COINS_LEN] = []
                for coin in _coins:
                    if not self.created[coin]:
                        composable_cow.create(ConditionalOrderParams({
                            handler: self,
                            salt: empty(bytes32),
                            staticData: concat(b"", convert(coin.address, bytes20)),
                        }), True)
                        coin.approve(vault_relayer, max_value(uint256))
                        self.created[coin] = True
                    amount: uint256 = coin.balanceOf(fee_collector.address) * fee / ONE
                    fee_payouts.append(Transfer({coin: coin, to: _receiver, amount: amount}))
                    self_transfers.append(Transfer({coin: coin, to: self, amount: max_value(uint256)}))

                fee_collector.transfer(fee_payouts)
                fee_collector.transfer(self_transfers)
            ```

    === "Example"
        ```shell
        >>> soon
        ```


### `can_exchange`
!!! description "`FeeCollector.can_exchange(_coins: DynArray[ERC20, MAX_LEN]) -> bool`"

    Function to check whether specified coins are allowed to be exchanged at the current timestamp. It verifies that the current epoch is `EXCHANGE` and that the coins to be exchanged are not marked as killed.

    Returns: true or false (`bool`).

    | Input   | Type      | Description                    |
    | ------- | --------- | ------------------------------ |
    | `can_exchange` | `DynArray[ERC20, MAX_LEN]` | Dynamic array of ERC20 token addresses to check for exchange eligibility. |

    ??? quote "Source code"

        === "FeeCollector.vy"

            ```python
            MAX_LEN: constant(uint256) = 64

            @external
            @view
            def can_exchange(_coins: DynArray[ERC20, MAX_LEN]) -> bool:
                """
                @notice Check whether coins are allowed to be exchanged
                @param _coins Coins to exchange
                @return Boolean value if coins are allowed to be exchanged
                """
                if self._epoch_ts(block.timestamp) != Epoch.EXCHANGE or\
                    self.is_killed[ALL_COINS] in Epoch.EXCHANGE:
                    return False
                for coin in _coins:
                    if self.is_killed[coin] in Epoch.EXCHANGE:
                        return False
                return True
            ```

    === "Example"
        ```shell
        >>> FeeCollector.can_exchange(['0xf939E0A03FB07F59A73314E73794Be0E57ac1b4E'])
        'false'
        ```


### `transfer`
!!! description "`FeeCollector.transfer(_transfers: DynArray[Transfer, MAX_LEN])`"

    !!!guard "Guarded Method"
        This function is only callable by the `burner` contract.

    Function to transfer coins. This function can only be called during the `COLLECT` or `EXCHANGE` epochs and is used to transfer the different admin fee tokens to the burner contract when calling the `collect` function.

    | Input   | Type      | Description                    |
    | ------- | --------- | ------------------------------ |
    | `_transfers` | `DynArray[Transfer, MAX_LEN]` | Dynamic array of `Transfer` structs. |

    *Each `Transfer` struct contains:*

    - `coin:` `address` - The ERC20 token address that is being transferred.
    - `to:` `address` - The address to which the tokens will be transferred.
    - `amount`: `uint256` - The amount of tokens to transfer. If set to 2^256-1, it transfers the entire balance.

    ??? quote "Source code"

        === "FeeCollector.vy"

            ```python
            struct Transfer:
                coin: ERC20
                to: address
                amount: uint256  # 2^256-1 for the whole balance

            MAX_LEN: constant(uint256) = 64

            @external
            @nonreentrant("transfer")
            def transfer(_transfers: DynArray[Transfer, MAX_LEN]):
                """
                @dev No approvals so can change burner easily
                @param _transfers Transfers to apply
                """
                assert msg.sender == self.burner.address, "Only Burner"
                epoch: Epoch = self._epoch_ts(block.timestamp)
                assert epoch in Epoch.COLLECT | Epoch.EXCHANGE, "Wrong Epoch"

                for transfer in _transfers:
                    assert not self.is_killed[transfer.coin] in epoch, "Killed coin"

                    amount: uint256 = transfer.amount
                    if amount == max_value(uint256):
                        amount = transfer.coin.balanceOf(self)
                    assert transfer.coin.transfer(transfer.to, amount, default_return_value=True)
            ```

        === "CowSwapBurner.vy"

            ```python
            interface FeeCollector:
                def fee(_epoch: Epoch=empty(Epoch), _ts: uint256=block.timestamp) -> uint256: view
                def target() -> ERC20: view
                def owner() -> address: view
                def emergency_owner() -> address: view
                def epoch_time_frame(epoch: Epoch, ts: uint256=block.timestamp) -> (uint256, uint256): view
                def can_exchange(_coins: DynArray[ERC20, MAX_COINS_LEN]) -> bool: view
                def transfer(_transfers: DynArray[Transfer, MAX_COINS_LEN]): nonpayable

            @external
            def burn(_coins: DynArray[ERC20, MAX_COINS_LEN], _receiver: address):
                """
                @notice Post hook after collect to register coins for burn
                @dev Registers new orders in ComposableCow
                @param _coins Which coins to burn
                @param _receiver Receiver of profit
                """
                assert msg.sender == fee_collector.address, "Only FeeCollector"

                fee: uint256 = fee_collector.fee(Epoch.COLLECT)
                fee_payouts: DynArray[Transfer, MAX_COINS_LEN] = []
                self_transfers: DynArray[Transfer, MAX_COINS_LEN] = []
                for coin in _coins:
                    if not self.created[coin]:
                        composable_cow.create(ConditionalOrderParams({
                            handler: self,
                            salt: empty(bytes32),
                            staticData: concat(b"", convert(coin.address, bytes20)),
                        }), True)
                        coin.approve(vault_relayer, max_value(uint256))
                        self.created[coin] = True
                    amount: uint256 = coin.balanceOf(fee_collector.address) * fee / ONE
                    fee_payouts.append(Transfer({coin: coin, to: _receiver, amount: amount}))
                    self_transfers.append(Transfer({coin: coin, to: self, amount: max_value(uint256)}))

                fee_collector.transfer(fee_payouts)
                fee_collector.transfer(self_transfers)
            ```


    === "Example"
        ```shell
        >>> soon
        ```


### `forward`
!!! description "`FeeCollector.forward(_hook_inputs: DynArray[HookInput, MAX_HOOK_LEN], _receiver: address=msg.sender) -> uint256`"

    Function to transfer the target coin to the hooker address. This function can only be called during the `FORWARD` epoch. It charges a keeper fee on the entire balance of the forwarded coins and awards it to the caller. The function also calls the `push_target` function of the burner contract to transfer any remaining target coins back into the `FeeCollector` contract before forwarding the total balance to the hooker. Additionally, the function calls the `duty_act` method of the hooker contract, applying any specified hooks and adjusting the fee accordingly.

    Returns: received keeper fee (`uint256`)

    | Input   | Type      | Description                    |
    | ------- | --------- | ------------------------------ |
    | `_hook_inputs` | `DynArray[HookInput, MAX_HOOK_LEN]` | Dynamic array of `HookInput` structs.     |
    | `_receiver` | `address` | Receiver of keeper fee. |

    *Each `HookInput` struct contains:*

    - `hook_id`: `uint8` - ID of the hook to execute. This ID determines which specific hook logic to apply during the `duty_act` call.
    - `value`: `uint256` - Value associated with the hook, which can represent the amount or specific parameter needed by the hook logic.
    - `data`: `Bytes[8192]` - Additional data required by the hook, encoded as bytes. This can include various parameters or instructions specific to the hook's functionality.

    ??? quote "Source code"

        === "FeeCollector.vy"

            ```python
            struct HookInput:
                hook_id: uint8
                value: uint256
                data: Bytes[8192]

            @external
            @payable
            @nonreentrant("forward")
            def forward(_hook_inputs: DynArray[HookInput, MAX_HOOK_LEN], _receiver: address=msg.sender) -> uint256:
                """
                @notice Transfer target coin forward
                @param _hook_inputs Input parameters for forward hooks
                @param _receiver Receiver of caller `forward_fee`
                @return Amount of received fee
                """
                assert self._epoch_ts(block.timestamp) == Epoch.FORWARD, "Wrong epoch"
                target: ERC20 = self.target
                assert not (self.is_killed[ALL_COINS] | self.is_killed[target]) in Epoch.FORWARD, "Killed"

                self.burner.push_target()
                amount: uint256 = target.balanceOf(self)

                # Account buffer
                hooker: Hooker = self.hooker
                hooker_buffer: uint256 = hooker.buffer_amount()
                amount -= min(hooker_buffer, amount)

                fee: uint256 = self._fee(Epoch.FORWARD, block.timestamp) * amount / ONE
                target.transfer(_receiver, fee)

                target.transfer(hooker.address, amount - fee)
                if self.last_hooker_approve < (block.timestamp - START_TIME) / WEEK:  # First time this week
                    target.approve(hooker.address, hooker_buffer)
                    self.last_hooker_approve = (block.timestamp - START_TIME) / WEEK
                fee += hooker.duty_act(_hook_inputs, _receiver, value=msg.value)

                return fee
            ```

        === "CowSwapBurner.vy"

            ```python
            @external
            def push_target() -> uint256:
                """
                @notice In case target coin is left in contract can be pushed to forward
                @return Amount of coin pushed further
                """
                target: ERC20 = fee_collector.target()
                amount: uint256 = target.balanceOf(self)
                if amount > 0:
                    target.transfer(fee_collector.address, amount)
                return amount
            ```

        === "Hooker.vy"

            ```python
            event DutyAct:
                pass

            event Act:
                receiver: indexed(address)
                compensation: uint256

            @external
            @payable
            def duty_act(_hook_inputs: DynArray[HookInput, MAX_HOOKS_LEN], _receiver: address=msg.sender) -> uint256:
                """
                @notice Entry point to run hooks for FeeCollector
                @param _hook_inputs Inputs assembled by keepers
                @param _receiver Receiver of compensation (sender by default)
                @return Compensation received
                """
                if msg.sender == fee_collector.address:
                    self.duty_counter = convert((block.timestamp - START_TIME) / WEEK, uint64)  # assuming time frames are divided weekly

                hook_mask: uint256 = 0
                for solicitation in _hook_inputs:
                    hook_mask |= 1 << solicitation.hook_id
                duties_checklist: uint256 = self.duties_checklist
                assert hook_mask & duties_checklist == duties_checklist, "Not all duties"

                log DutyAct()

                return self._act(_hook_inputs, _receiver)

            @internal
            def _act(_hook_inputs: DynArray[HookInput, MAX_HOOKS_LEN], _receiver: address) -> uint256:
                current_duty_counter: uint64 = self.duty_counter

                compensation: uint256 = 0
                prev_idx: uint8 = 0
                for solicitation in _hook_inputs:
                    hook: Hook = self.hooks[solicitation.hook_id]
                    self._shot(hook, solicitation)

                    if hook.compensation_strategy.cooldown.duty_counter < current_duty_counter:
                        hook.compensation_strategy.cooldown.used = 0
                        hook.compensation_strategy.cooldown.duty_counter = current_duty_counter
                    hook_compensation: uint256 = self._compensate(hook)

                    if hook_compensation > 0:
                        compensation += hook_compensation
                        hook.compensation_strategy.cooldown.used += 1
                        self.hooks[solicitation.hook_id].compensation_strategy.cooldown = hook.compensation_strategy.cooldown

                    if prev_idx > solicitation.hook_id:
                        raise "Hooks not sorted"
                    prev_idx = solicitation.hook_id
                    log HookShot(prev_idx, hook_compensation)

                log Act(_receiver, compensation)

                # happy ending
                if compensation > 0:
                    coin: ERC20 = fee_collector.target()
                    coin.transferFrom(fee_collector.address, _receiver, compensation)
                return compensation
            ```

    === "Example"
        ```shell
        >>> soon
        ```


### `burn`
!!! description "`FeeCollector.burn(_coin: address)`"

    !!!guard "Guarded Method"
        This function is only callable by the `owner` of the contract.

    Function to transfer a coins from the contract with approval. This function is needed for back compatability along with dealing with raw ETH.

    | Input   | Type      | Description                    |
    | ------- | --------- | ------------------------------ |
    | `_coin` | `address` | Token address of the new target coin. |

    ??? quote "Source code"

        === "FeeCollector.vy"

            ```python
            @external
            @payable
            def burn(_coin: address) -> bool:
                """
                @notice Transfer coin from contract with approval
                @dev Needed for back compatability along with dealing raw ETH
                @param _coin Coin to transfer
                @return True if did not fail, back compatability
                """
                if _coin == ETH_ADDRESS:  # Deposit
                    WETH.deposit(value=self.balance)
                else:
                    amount: uint256 = ERC20(_coin).balanceOf(msg.sender)
                    ERC20(_coin).transferFrom(msg.sender, self, amount)
                return True
            ```

    === "Example"
        ```shell
        >>> soon
        ```


### `recover`
!!! description "`FeeCollector.recover(_recovers: DynArray[RecoverInput, MAX_LEN], _receiver: address):`"

    !!!guard "Guarded Method"
        This function is only callable by the `owner` or `emergency_owner` of the contract.

    Function to recover ERC20 tokens or ETH from the contract by transfering them to `_receiver`.

    | Input   | Type      | Description                    |
    | ------- | --------- | ------------------------------ |
    | `_recovers` | `DynArray[RecoverInput, MAX_LEN]` | Dynamic array of `RecoverInput` structs.    |
    | `_receiver` | `address` | Receiver of the recovered coins.     |

    *Each `RecoverInput` struct contains:*

    - `coin`: `address` - The address of the ERC20 token to recover.
    - `amount`: `uint256` - The amount of the token to recover. Use `2^256-1` to recover the entire balance.

    ??? quote "Source code"

        === "FeeCollector.vy"

            ```python
            struct RecoverInput:
                coin: ERC20
                amount: uint256

            @external
            def recover(_recovers: DynArray[RecoverInput, MAX_LEN], _receiver: address):
                """
                @notice Recover ERC20 tokens or Ether from this contract
                @dev Callable only by owner and emergency owner
                @param _recovers (Token, amount) to recover
                @param _receiver Receiver of coins
                """
                assert msg.sender in [self.owner, self.emergency_owner], "Only owner"

                for input in _recovers:
                    amount: uint256 = input.amount
                    if input.coin.address == ETH_ADDRESS:
                        if amount == max_value(uint256):
                            amount = self.balance
                        raw_call(_receiver, b"", value=amount)
                    else:
                        if amount == max_value(uint256):
                            amount = input.coin.balanceOf(self)
                        input.coin.transfer(_receiver, amount)  # do not need safe transfer
            ```

    === "Example"
        ```shell
        >>> soon
        ```


---


## **Burner and Hooker Contracts**

Burner contracts are used to convert collected coins into the target coins. Hooker contracts facilitate the execution of predefined actions (hooks) through the `Hooker` contract.

When setting up a burner or hooker, they need to support a specific interface structure to comply with the functions used in the FeeCollector contract. Each `burner` and `hooker` contract must implement a `supportsInterface(_interface_id: bytes4)` method, which identifies the interface according to [ERC-165](https://eips.ethereum.org/EIPS/eip-165). This method ensures the contract is compatible with the FeeCollector.


### `burner`
!!! description "`FeeCollector.burner() -> address: view`"

    Getter for the burner contract. The burner can be set and changed via [`set_burner`](#set_burner).

    Returns: burner contract (`address`).

    ??? quote "Source code"

        === "FeeCollector.vy"

            ```python
            interface Burner:
                def burn(_coins: DynArray[ERC20, MAX_LEN], _receiver: address): nonpayable
                def push_target() -> uint256: nonpayable
                def supportsInterface(_interface_id: bytes4) -> bool: view

            burner: public(Burner)

            @external
            def set_burner(_new_burner: Burner):
                """
                @notice Set burner for exchanging coins
                @dev Callable only by owner
                """
                assert msg.sender == self.owner, "Only owner"
                assert _new_burner.supportsInterface(BURNER_INTERFACE_ID)
                self.burner = _new_burner
            ```

    === "Example"
        ```shell
        >>> FeeCollector.burner()
        '0xC0fC3dDfec95ca45A0D2393F518D3EA1ccF44f8b'
        ```


### `hooker`
!!! description "`FeeCollector.hooker() -> address: view`"

    Getter for the hooker contract. The hooker can be set and changed via [`set_hooker`](#set_hooker).

    Returns: hooker contract (`address`).

    ??? quote "Source code"

        === "FeeCollector.vy"

            ```python
            interface Hooker:
                def duty_act(_hook_inputs: DynArray[HookInput, MAX_HOOK_LEN], _receiver: address=msg.sender) -> uint256: payable
                def buffer_amount() -> uint256: view
                def supportsInterface(_interface_id: bytes4) -> bool: view

            HOOKER_INTERFACE_ID: constant(bytes4) = 0xe569b44d

            hooker: public(Hooker)
            ```

    === "Example"
        ```shell
        >>> FeeCollector.hooker()
        '0x9A9DF35cd8E88565694CA6AD5093c236C7f6f69D'
        ```


### `set_burner`
!!! description "`FeeCollector.set_burner(_new_burner: Burner)`"

    !!!guard "Guarded Method"
        This function is only callable by the `owner` of the contract.

    Function to set a new burner contract. When setting, the contract checks if the new burner supports a certain `BURNER_INTERFACE_ID`.

    Emits: `SetBurner`

    | Input   | Type      | Description                    |
    | ------- | --------- | ------------------------------ |
    | `_new_burner` | `address` | Contract address of the new burner.     |

    ??? quote "Source code"

        === "FeeCollector.vy"

            ```python
            interface Burner:
                def burn(_coins: DynArray[ERC20, MAX_LEN], _receiver: address): nonpayable
                def push_target() -> uint256: nonpayable
                def supportsInterface(_interface_id: bytes4) -> bool: view

            event SetBurner:
                burner: indexed(Burner)

            BURNER_INTERFACE_ID: constant(bytes4) = 0xa3b5e311

            burner: public(Burner)

            @external
            def set_burner(_new_burner: Burner):
                """
                @notice Set burner for exchanging coins, must implement BURNER_INTERFACE
                @dev Callable only by owner
                @param _new_burner Address of the new contract
                """
                assert msg.sender == self.owner, "Only owner"
                assert _new_burner.supportsInterface(BURNER_INTERFACE_ID)
                self.burner = _new_burner

                log SetBurner(_new_burner)
            ```

    === "Example"
        ```shell
        >>> soon
        ```


### `set_hooker`
!!! description "`FeeCollector.set_hooker(_new_hooker: Hooker)`"

    !!!guard "Guarded Method"
        This function is only callable by the `owner` of the contract.

    Function to set a new hooker contract. When setting, the contract checks if the new hooker supports a certain `HOOKER_INTERFACE_ID: constant(bytes4) = 0xe569b44d`.

    Emits: `SetHooker`

    | Input   | Type      | Description                    |
    | ------- | --------- | ------------------------------ |
    | `_new_hooker` | `address` | Address of hooker contract to set.     |

    ??? quote "Source code"

        === "FeeCollector.vy"

            ```python
            interface Hooker:
                def duty_act(_hook_inputs: DynArray[HookInput, MAX_HOOK_LEN], _receiver: address=msg.sender) -> uint256: payable
                def buffer_amount() -> uint256: view
                def supportsInterface(_interface_id: bytes4) -> bool: view

            event SetHooker:
                hooker: indexed(Hooker)

            HOOKER_INTERFACE_ID: constant(bytes4) = 0xe569b44d

            hooker: public(Hooker)

            @external
            def set_hooker(_new_hooker: Hooker):
                """
                @notice Set contract for hooks, must implement HOOKER_INTERFACE
                @dev Callable only by owner
                @param _new_hooker Address of the new contract
                """
                assert msg.sender == self.owner, "Only owner"
                assert _new_hooker.supportsInterface(HOOKER_INTERFACE_ID)

                if self.hooker != empty(Hooker):
                    self.target.approve(self.hooker.address, 0)
                self.hooker = _new_hooker

                log SetHooker(_new_hooker)
            ```

    === "Example"
        ```shell
        >>> soon
        ```


---


## **Ownership and Killing Coins**

The `FeeCollector` contract features a dual ownership structure, consisting of a regular `owner` and an `emergency_owner`.

The contract includes a mechanism to "kill" certain coins across specific epochs. When a coin is killed, certain functions related to that coin will no longer be callable. This capability is crucial for managing and mitigating risks associated with specific tokens.


*The `owner`[^1] is able to call the following functions:*

[^1]: Owner of the contract is the Curve DAO. To make any changes, a successful on-chain vote needs to pass.

- `recover`: Recover ERC20 tokens or ETH from the contract.
- `set_max_fee`: Set the maximum fee for a specified epoch.
- `set_burner`: Set the burner contract for exchanging coins.
- `set_hooker`: Set the hooker contract.
- `set_target`: Set a new target coin for fee accumulation. 
- `set_killed`: Mark certain coins as killed to prevent them from being burnt.
- `set_owner`: Assign a new owner to the contract.
- `set_emergency_owner`: Assign a new emergency owner to the contract.


*The `emergency_owner`[^2] has limited power, intended for emergency situations. He can call:*

[^2]: The `emergency_owner` is a [5 of 9 multisig](https://resources.curve.fi/governance/understanding-governance/?h=multis#emergency-dao).

- `recover`: Recover ERC20 tokens or ETH from the contract.
- `set_killed`: Mark certain coins as killed to prevent them from being burnt.



### `is_killed`
!!! description "`FeeCollector.is_killed(arg0: address) -> uint256: view`"

    Function to check if a coin is killed for a certain epoch. Depending on the epoch the coin is killed for, the contract restricts function calls. For example, if a coin is killed for the `COLLECT` epoch, the `collect` function cannot be called for that coin.

    Returns: sum of the epoch indices in the enum (`uint256`).

    | Input   | Type      | Description                    |
    | ------- | --------- | ------------------------------ |
    | `arg0`  | `address` | Address of the coin to check.  |

    ??? quote "Source code"

        === "FeeCollector.vy"

            ```python
            struct KilledInput:
                coin: ERC20
                killed: Epoch  # True where killed
            ```

    === "Example"

        If a coin is not killed, the method will return 0. The method returns the sum of the indices within the Epoch enum. Therefore, after we have killed wETH for the epochs `COLLECT` and `EXCHANGE`, the call now returns 6 (indices of `COLLECT` and `EXCHANGE` are 2 and 4, which sum up to six).

        ```shell
        >>> FeeCollector.is_killed("0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2")
        0

        >>> FeeCollector.set_killed([("0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", 2 | 4)])
        # kills wETH for epochs COLLECT and EXCHANGE

        >>> FeeCollector.is_killed("0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2")
        6
        ```


### `set_killed`
!!! description "`FeeCollector.set_killed(_input: DynArray[KilledInput, MAX_LEN])`"

    !!!guard "Guarded Method"
        This function is only callable by the `owner` or `emergency_owner` of the contract.

    Function to kill a coin for a specific epoch.

    Emits: `SetKilled`

    | Input   | Type                                 | Description                                      |
    |---------|--------------------------------------|--------------------------------------------------|
    | `_input`| `DynArray[KilledInput, MAX_LEN]`     | Array of `KilledInput` structs.                  |

    *Each `KilledInput` struct contains:*

    - `coin`: `ERC20` - The address of the ERC20 token to be killed.
    - `killed`: `Epoch` - The sum of the epoch indices during which the coin is killed.

    ??? quote "Source code"

        === "FeeCollector.vy"

            ```python
            event SetKilled:
                coin: indexed(ERC20)
                epoch_mask: Epoch

            struct KilledInput:
                coin: ERC20
                killed: Epoch  # True where killed

            is_killed: public(HashMap[ERC20, Epoch])

            @external
            def set_killed(_input: DynArray[KilledInput, MAX_LEN]):
                """
                @notice Stop a contract or specific coin to be burnt
                @dev Callable only by owner or emergency owner
                @param _input Array of (coin address, killed phases enum)
                """
                assert msg.sender in [self.owner, self.emergency_owner], "Only owner"

                for input in _input:
                    self.is_killed[input.coin] = input.killed
                    log SetKilled(input.coin, input.killed)
            ```

    === "Example"
        ```shell
        >>> FeeCollector.set_killed([("0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", 1)])
        # kills wETH for epoch SLEEP

        >>> FeeCollector.set_killed([("0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", 2 | 4)])
        # kills wETH for epochs COLLECT and EXCHANGE
        ```



### `owner`
!!! description "`FeeCollector.owner() -> address: view`"

    Getter for the current owner of the contract.

    Returns: owner (`address`).

    Emits: `SetOwner` at contract initialization

    ??? quote "Source code"

        === "FeeCollector.vy"

            ```python
            event SetOwner:
                owner: indexed(address)

            owner: public(address)

            @external
            def __init__(_target_coin: ERC20, _weth: wETH, _owner: address, _emergency_owner: address):
                """
                @notice Contract constructor
                @param _target_coin Coin to swap to
                @param _weth Wrapped ETH(native coin) address
                @param _owner Owner address
                @param _emergency_owner Emergency owner address. Can kill the contract
                """
                ...
                self.owner = _owner
                ...
                log SetOwner(_owner)
                ...
            ```

    === "Example"
        ```shell
        >>> FeeCollector.owner()
        '0x40907540d8a6C65c637785e8f8B742ae6b0b9968'
        ```


### `emergency_owner`
!!! description "`FeeCollector.emergency_owner() -> address: view`"

    Getter for the current emergency owner of the contract.

    Returns: emergency owner (`address`).

    Emits: `SetEmergencyOwner` at contract initialization

    ??? quote "Source code"

        === "FeeCollector.vy"

            ```python
            event SetEmergencyOwner:
                emergency_owner: indexed(address)

            emergency_owner: public(address)

            @external
            def __init__(_target_coin: ERC20, _weth: wETH, _owner: address, _emergency_owner: address):
                """
                @notice Contract constructor
                @param _target_coin Coin to swap to
                @param _weth Wrapped ETH(native coin) address
                @param _owner Owner address
                @param _emergency_owner Emergency owner address. Can kill the contract
                """
                ...
                self.emergency_owner = _emergency_owner
                ...
                log SetEmergencyOwner(_emergency_owner)
                ...
            ```

    === "Example"
        ```shell
        >>> FeeCollector.emergency_owner()
        '0x467947EE34aF926cF1DCac093870f613C96B1E0c'
        ```


### `set_owner`
!!! description "`FeeCollector.set_owner(_new_owner: address)`"

    !!!guard "Guarded Method"
        This function is only callable by the `owner` of the contract.

    Function to set a new owner.

    Emits: `SetOwner`

    | Input   | Type      | Description                    |
    | ------- | --------- | ------------------------------ |
    | `_new_owner` | `address` | Address of the new owner. |

    ??? quote "Source code"

        === "FeeCollector.vy"

            ```python
            event SetOwner:
                owner: indexed(address)

            owner: public(address)

            @external
            def set_owner(_new_owner: address):
                """
                @notice Set owner of the contract
                @dev Callable only by current owner
                @param _new_owner Address of the new owner
                """
                assert msg.sender == self.owner, "Only owner"
                assert _new_owner != empty(address)
                self.owner = _new_owner
                log SetOwner(_new_owner)
            ```

    === "Example"
        ```shell
        >>> soon
        ```


### `set_emergency_owner`
!!! description "`FeeCollector.set_emergency_owner(_new_owner: address)`"

    !!!guard "Guarded Method"
        This function is only callable by the `owner` of the contract.

    Function to a new emergency owner.

    Emits: `SetEmergencyOwner`

    | Input   | Type      | Description                    |
    | ------- | --------- | ------------------------------ |
    | `_new_owner` | `address` | Address of the new emergency owner.     |

    ??? quote "Source code"

        === "FeeCollector.vy"

            ```python
            event SetEmergencyOwner:
                emergency_owner: indexed(address)

            emergency_owner: public(address)

            @external
            def set_emergency_owner(_new_owner: address):
                """
                @notice Set emergency owner of the contract
                @dev Callable only by current owner
                @param _new_owner Address of the new emergency owner
                """
                assert msg.sender == self.owner, "Only owner"
                assert _new_owner != empty(address)
                self.emergency_owner = _new_owner
                log SetEmergencyOwner(_new_owner)
            ```

    === "Example"
        ```shell
        >>> soon
        ```