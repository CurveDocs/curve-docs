Participating in Curve DAO governance requires that an account have a balance of vote-escrowed CRV (veCRV).

**veCRV is a non-standard ERC20 implementation, used within the Aragon DAO to determine each account’s voting power.**

!!!deploy "Contract Source & Deployment"
    **veCRV** is represented by the **`VotingEscrow`** contract, deployed to the Ethereum mainnet at:
    [0x5f3b5DfEb7B28CDbD7FAba78963EE202a494e2A2](https://etherscan.io/address/0x5f3b5dfeb7b28cdbd7faba78963ee202a494e2a2).  
    Source code available on [Github](https://github.com/curvefi/curve-dao-contracts/blob/master/contracts/VotingEscrow.vy). 

To calculate the veCRV output when locking, ensure to multiply the amount of CRV tokens by $\frac{locktime}{4}$.  
`locktime` is denominated in years. The maximum lock duration is four years and the minimum lock is one week.

| CRV      | veCRV  | Locktime|
| -------- | -------| --------|
| `1`      |  `1`   | 4 years |
| `1`      |  `0.75`| 3 years |
| `1`      |  `0.5` | 2 years |
| `1`      |  `0.25`| 1 year  |
| $x$      |  $x * \frac{n}{4}$| $n$  |


!!!warning "Transferability"
    veCRV cannot be transferred. The only way to obtain veCRV is by locking CRV.  


## **Implemention Details**
User voting power $w_{i}$ is linearly decreasing since the moment of lock. So does the total voting power $W$. In order to avoid periodic check-ins, every time the user deposits, or withdraws, or changes the locktime, we record user’s slope and bias for the linear function $w_{i}(t)$ in the public mapping `user_point_history`. We also change slope and bias for the total voting power $W(t)$ and record it in `point_history`. In addition, when a user’s lock is scheduled to end, we schedule change of slopes of $W(t)$ in the future in `slope_changes`. Every change involves increasing the `epoch` by 1.

This way we don’t have to iterate over all users to figure out, how much should $W(t)$ change by, neither we require users to check in periodically. However, we limit the end of user locks to times rounded off by whole weeks.

Slopes and biases change both when a user deposits and locks governance tokens, and when the locktime expires. All the possible expiration times are rounded to whole weeks to make number of reads from blockchain proportional to number of missed weeks at most, not number of users (which is potentially large).



## **Smart Wallet Whitelist**
The Smart Wallet Checker is an external contract which checks if certain contracts are whitelisted and therefore eligible to lock CRV tokens. More [here](../voting-escrow/smartwalletchecker.md).

### `smart_wallet_checker`
!!! description "`VotingEscrow.smart_wallet_checker() -> address: view`"

    Getter for the current SmartWalletChecker contract.
    
    Returns: SmartWalletChecker (`address`).

    ??? quote "Source code"

        ```python hl_lines="1"
        smart_wallet_checker: public(address)
        ```

    === "Example"
        ```shell
        >>> VotingEscrow.smart_wallet_checker()
        '0xca719728Ef172d0961768581fdF35CB116e0B7a4'
        ```


### `future_smart_wallet_checker`
!!! description "`VotingEscrow.future_smart_wallet_checker() -> address: view`"

    Getter for the future SmartWalletChecker contract.

    Returns: future SmartWalletChecker (`address`).

    ??? quote "Source code"

        ```python hl_lines="1"
        future_smart_wallet_checker: public(address)
        ```

    === "Example"
        ```shell
        >>> VotingEscrow.future:_smart_wallet_checker()
        '0xca719728Ef172d0961768581fdF35CB116e0B7a4'
        ```


## **Working with VoteLocks**

### `create_lock`
!!! description "`VotingEscrow.create_lock(_value: uint256, _unlock_time: uint256):`"

    Function to deposit `_value` CRV into the VotingEscrow and create a new lock until `_unlock_time`.

    Emits: `Deposit`, `Supply` and `Transfer`

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_value`   |  `uint256` | amount of CRV to deposit |
    | `_unlock_time` |  `uint256` | unlock time |

    ??? quote "Source code"

        ```python hl_lines="1 8 12 13 18 24 33 36 59 64 65 68"
        event Deposit:
            provider: indexed(address)
            value: uint256
            locktime: indexed(uint256)
            type: int128
            ts: uint256

        event Supply:
            prevSupply: uint256
            supply: uint256

        WEEK: constant(uint256) = 7 * 86400  # all future times are rounded by week
        MAXTIME: constant(uint256) = 4 * 365 * 86400  # 4 years
        MULTIPLIER: constant(uint256) = 10 ** 18

        @external
        @nonreentrant('lock')
        def create_lock(_value: uint256, _unlock_time: uint256):
            """
            @notice Deposit `_value` tokens for `msg.sender` and lock until `_unlock_time`
            @param _value Amount to deposit
            @param _unlock_time Epoch time when tokens unlock, rounded down to whole weeks
            """
            self.assert_not_contract(msg.sender)
            unlock_time: uint256 = (_unlock_time / WEEK) * WEEK  # Locktime is rounded down to weeks
            _locked: LockedBalance = self.locked[msg.sender]

            assert _value > 0  # dev: need non-zero value
            assert _locked.amount == 0, "Withdraw old tokens first"
            assert unlock_time > block.timestamp, "Can only lock until time in the future"
            assert unlock_time <= block.timestamp + MAXTIME, "Voting lock can be 4 years max"

            self._deposit_for(msg.sender, _value, unlock_time, _locked, CREATE_LOCK_TYPE) 

        @internal
        def _deposit_for(_addr: address, _value: uint256, unlock_time: uint256, locked_balance: LockedBalance, type: int128):
            """
            @notice Deposit and lock tokens for a user
            @param _addr User's wallet address
            @param _value Amount to deposit
            @param unlock_time New time when to unlock the tokens, or 0 if unchanged
            @param locked_balance Previous locked amount / timestamp
            """
            _locked: LockedBalance = locked_balance
            supply_before: uint256 = self.supply

            self.supply = supply_before + _value
            old_locked: LockedBalance = _locked
            # Adding to existing lock, or if a lock is expired - creating a new one
            _locked.amount += convert(_value, int128)
            if unlock_time != 0:
                _locked.end = unlock_time
            self.locked[_addr] = _locked

            # Possibilities:
            # Both old_locked.end could be current or expired (>/< block.timestamp)
            # value == 0 (extend lock) or value > 0 (add to lock or extend lock)
            # _locked.end > block.timestamp (always)
            self._checkpoint(_addr, old_locked, _locked)

            if _value != 0:
                assert ERC20(self.token).transferFrom(_addr, self, _value)

            log Deposit(_addr, _value, _locked.end, type, block.timestamp)
            log Supply(supply_before, supply_before + _value)

        @internal
        def assert_not_contract(addr: address):
            """
            @notice Check if the call is from a whitelisted smart contract, revert if not
            @param addr Address to be checked
            """
            if addr != tx.origin:
                checker: address = self.smart_wallet_checker
                if checker != ZERO_ADDRESS:
                    if SmartWalletChecker(checker).check(addr):
                        return
                raise "Smart contract depositors not allowed"
        ```

    === "Example"
        ```shell
        >>> VotingEscrow.create_lock(100000000000000000000, 1694003759):
        ```


### `increase_amount`
!!! description "`VotingEscrow.increase_amount(_value: uint256):`"

    Deposit additional `_value` CRV tokens into an existing lock.

    Emits: `Deposit`, `Supply` and `Transfer`

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_value`       |  `uint256` | amount of CRV to additionally lock |

    ??? quote "Source code"

        ```python hl_lines="3 16"
        @external
        @nonreentrant('lock')
        def increase_amount(_value: uint256):
            """
            @notice Deposit `_value` additional tokens for `msg.sender`
                    without modifying the unlock time
            @param _value Amount of tokens to deposit and add to the lock
            """
            self.assert_not_contract(msg.sender)
            _locked: LockedBalance = self.locked[msg.sender]

            assert _value > 0  # dev: need non-zero value
            assert _locked.amount > 0, "No existing lock found"
            assert _locked.end > block.timestamp, "Cannot add to expired lock. Withdraw"

            self._deposit_for(msg.sender, _value, 0, _locked, INCREASE_LOCK_AMOUNT)

        @internal
        def _deposit_for(_addr: address, _value: uint256, unlock_time: uint256, locked_balance: LockedBalance, type: int128):
            """
            @notice Deposit and lock tokens for a user
            @param _addr User's wallet address
            @param _value Amount to deposit
            @param unlock_time New time when to unlock the tokens, or 0 if unchanged
            @param locked_balance Previous locked amount / timestamp
            """
            _locked: LockedBalance = locked_balance
            supply_before: uint256 = self.supply

            self.supply = supply_before + _value
            old_locked: LockedBalance = _locked
            # Adding to existing lock, or if a lock is expired - creating a new one
            _locked.amount += convert(_value, int128)
            if unlock_time != 0:
                _locked.end = unlock_time
            self.locked[_addr] = _locked

            # Possibilities:
            # Both old_locked.end could be current or expired (>/< block.timestamp)
            # value == 0 (extend lock) or value > 0 (add to lock or extend lock)
            # _locked.end > block.timestamp (always)
            self._checkpoint(_addr, old_locked, _locked)

            if _value != 0:
                assert ERC20(self.token).transferFrom(_addr, self, _value)

            log Deposit(_addr, _value, _locked.end, type, block.timestamp)
            log Supply(supply_before, supply_before + _value)
        ```

    === "Example"
        ```shell
        >>> VotingEscrow.increase_amount(100000000000000000000):
        ```


### `increase_unlock_time`
!!! description "`VotingEscrow.increase_unlock_time(_unlock_time: uint256):`"

    Extend the unlock time on an already existing lock until `_unlock_time`.

    Emits: `Deposit`, `Supply` and `Transfer`

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_unlock_time` |  `uint256` | new epoch time for unlocking |

    ??? quote "Source code"

        ```python hl_lines="3 17"
        @external
        @nonreentrant('lock')
        def increase_unlock_time(_unlock_time: uint256):
            """
            @notice Extend the unlock time for `msg.sender` to `_unlock_time`
            @param _unlock_time New epoch time for unlocking
            """
            self.assert_not_contract(msg.sender)
            _locked: LockedBalance = self.locked[msg.sender]
            unlock_time: uint256 = (_unlock_time / WEEK) * WEEK  # Locktime is rounded down to weeks

            assert _locked.end > block.timestamp, "Lock expired"
            assert _locked.amount > 0, "Nothing is locked"
            assert unlock_time > _locked.end, "Can only increase lock duration"
            assert unlock_time <= block.timestamp + MAXTIME, "Voting lock can be 4 years max"

            self._deposit_for(msg.sender, 0, unlock_time, _locked, INCREASE_UNLOCK_TIME)

        @internal
        def _deposit_for(_addr: address, _value: uint256, unlock_time: uint256, locked_balance: LockedBalance, type: int128):
            """
            @notice Deposit and lock tokens for a user
            @param _addr User's wallet address
            @param _value Amount to deposit
            @param unlock_time New time when to unlock the tokens, or 0 if unchanged
            @param locked_balance Previous locked amount / timestamp
            """
            _locked: LockedBalance = locked_balance
            supply_before: uint256 = self.supply

            self.supply = supply_before + _value
            old_locked: LockedBalance = _locked
            # Adding to existing lock, or if a lock is expired - creating a new one
            _locked.amount += convert(_value, int128)
            if unlock_time != 0:
                _locked.end = unlock_time
            self.locked[_addr] = _locked

            # Possibilities:
            # Both old_locked.end could be current or expired (>/< block.timestamp)
            # value == 0 (extend lock) or value > 0 (add to lock or extend lock)
            # _locked.end > block.timestamp (always)
            self._checkpoint(_addr, old_locked, _locked)

            if _value != 0:
                assert ERC20(self.token).transferFrom(_addr, self, _value)

            log Deposit(_addr, _value, _locked.end, type, block.timestamp)
            log Supply(supply_before, supply_before + _value)
        ```

    === "Example"
        ```shell
        >>> VotingEscrow.increase_unlock_time(1694003759):
        ```


### `deposit_for`
!!! description "`VotingEscrow.deposit_for(_addr: address, _value: uint256):`"

    Function to deposit `_value` tokens for `_addr` and add them to the lock.

    Emits: `Deposit`, `Supply` and `Transfer`    

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_addr`       |  `address` | address to depoit for |
    | `_value_` |  `uint256` | amount of tokens to lock |

    ??? quote "Source code"

        ```python hl_lines="3 17"
        @external
        @nonreentrant('lock')
        def deposit_for(_addr: address, _value: uint256):
            """
            @notice Deposit `_value` tokens for `_addr` and add to the lock
            @dev Anyone (even a smart contract) can deposit for someone else, but
                cannot extend their locktime and deposit for a brand new user
            @param _addr User's wallet address
            @param _value Amount to add to user's lock
            """
            _locked: LockedBalance = self.locked[_addr]

            assert _value > 0  # dev: need non-zero value
            assert _locked.amount > 0, "No existing lock found"
            assert _locked.end > block.timestamp, "Cannot add to expired lock. Withdraw"

            self._deposit_for(_addr, _value, 0, self.locked[_addr], DEPOSIT_FOR_TYPE)

        @internal
        def _deposit_for(_addr: address, _value: uint256, unlock_time: uint256, locked_balance: LockedBalance, type: int128):
            """
            @notice Deposit and lock tokens for a user
            @param _addr User's wallet address
            @param _value Amount to deposit
            @param unlock_time New time when to unlock the tokens, or 0 if unchanged
            @param locked_balance Previous locked amount / timestamp
            """
            _locked: LockedBalance = locked_balance
            supply_before: uint256 = self.supply

            self.supply = supply_before + _value
            old_locked: LockedBalance = _locked
            # Adding to existing lock, or if a lock is expired - creating a new one
            _locked.amount += convert(_value, int128)
            if unlock_time != 0:
                _locked.end = unlock_time
            self.locked[_addr] = _locked

            # Possibilities:
            # Both old_locked.end could be current or expired (>/< block.timestamp)
            # value == 0 (extend lock) or value > 0 (add to lock or extend lock)
            # _locked.end > block.timestamp (always)
            self._checkpoint(_addr, old_locked, _locked)

            if _value != 0:
                assert ERC20(self.token).transferFrom(_addr, self, _value)

            log Deposit(_addr, _value, _locked.end, type, block.timestamp)
            log Supply(supply_before, supply_before + _value)
        ```

    === "Example"
        ```shell
        >>> VotingEscrow.deposit_for("todo"):
        ```


### `withdraw`
!!! description "`VotingEscrow.withdraw()`"

    Withdraw deposited CRV tokens once a lock has expired.

    Emits: `Transfer`, `Withdraw` and `Supply`

    ??? quote "Source code"

        ```python 
        @external
        @nonreentrant('lock')
        def withdraw():
            """
            @notice Withdraw all tokens for `msg.sender`
            @dev Only possible if the lock has expired
            """
            _locked: LockedBalance = self.locked[msg.sender]
            assert block.timestamp >= _locked.end, "The lock didn't expire"
            value: uint256 = convert(_locked.amount, uint256)

            old_locked: LockedBalance = _locked
            _locked.end = 0
            _locked.amount = 0
            self.locked[msg.sender] = _locked
            supply_before: uint256 = self.supply
            self.supply = supply_before - value

            # old_locked can have either expired <= timestamp or zero end
            # _locked has only 0 end
            # Both can have >= 0 amount
            self._checkpoint(msg.sender, old_locked, _locked)

            assert ERC20(self.token).transfer(msg.sender, value)

            log Withdraw(msg.sender, value, block.timestamp)
            log Supply(supply_before, supply_before - value)
        ```

    === "Example"
        ```shell
        >>> VotingEscrow.withdraw():
        ```


### `checkpoint`
!!! description "`VotingEscrow.checkpoint():`"

    Function to record global data to a checkpoint.

    ??? quote "Source code"

        ```python 
        @external
        def checkpoint():
            """
            @notice Record global data to checkpoint
            """
            self._checkpoint(ZERO_ADDRESS, empty(LockedBalance), empty(LockedBalance))

        @internal
        def _checkpoint(addr: address, old_locked: LockedBalance, new_locked: LockedBalance):
            """
            @notice Record global and per-user data to checkpoint
            @param addr User's wallet address. No user checkpoint if 0x0
            @param old_locked Pevious locked amount / end lock time for the user
            @param new_locked New locked amount / end lock time for the user
            """
            u_old: Point = empty(Point)
            u_new: Point = empty(Point)
            old_dslope: int128 = 0
            new_dslope: int128 = 0
            _epoch: uint256 = self.epoch

            if addr != ZERO_ADDRESS:
                # Calculate slopes and biases
                # Kept at zero when they have to
                if old_locked.end > block.timestamp and old_locked.amount > 0:
                    u_old.slope = old_locked.amount / MAXTIME
                    u_old.bias = u_old.slope * convert(old_locked.end - block.timestamp, int128)
                if new_locked.end > block.timestamp and new_locked.amount > 0:
                    u_new.slope = new_locked.amount / MAXTIME
                    u_new.bias = u_new.slope * convert(new_locked.end - block.timestamp, int128)

                # Read values of scheduled changes in the slope
                # old_locked.end can be in the past and in the future
                # new_locked.end can ONLY by in the FUTURE unless everything expired: than zeros
                old_dslope = self.slope_changes[old_locked.end]
                if new_locked.end != 0:
                    if new_locked.end == old_locked.end:
                        new_dslope = old_dslope
                    else:
                        new_dslope = self.slope_changes[new_locked.end]

            last_point: Point = Point({bias: 0, slope: 0, ts: block.timestamp, blk: block.number})
            if _epoch > 0:
                last_point = self.point_history[_epoch]
            last_checkpoint: uint256 = last_point.ts
            # initial_last_point is used for extrapolation to calculate block number
            # (approximately, for *At methods) and save them
            # as we cannot figure that out exactly from inside the contract
            initial_last_point: Point = last_point
            block_slope: uint256 = 0  # dblock/dt
            if block.timestamp > last_point.ts:
                block_slope = MULTIPLIER * (block.number - last_point.blk) / (block.timestamp - last_point.ts)
            # If last point is already recorded in this block, slope=0
            # But that's ok b/c we know the block in such case

            # Go over weeks to fill history and calculate what the current point is
            t_i: uint256 = (last_checkpoint / WEEK) * WEEK
            for i in range(255):
                # Hopefully it won't happen that this won't get used in 5 years!
                # If it does, users will be able to withdraw but vote weight will be broken
                t_i += WEEK
                d_slope: int128 = 0
                if t_i > block.timestamp:
                    t_i = block.timestamp
                else:
                    d_slope = self.slope_changes[t_i]
                last_point.bias -= last_point.slope * convert(t_i - last_checkpoint, int128)
                last_point.slope += d_slope
                if last_point.bias < 0:  # This can happen
                    last_point.bias = 0
                if last_point.slope < 0:  # This cannot happen - just in case
                    last_point.slope = 0
                last_checkpoint = t_i
                last_point.ts = t_i
                last_point.blk = initial_last_point.blk + block_slope * (t_i - initial_last_point.ts) / MULTIPLIER
                _epoch += 1
                if t_i == block.timestamp:
                    last_point.blk = block.number
                    break
                else:
                    self.point_history[_epoch] = last_point

            self.epoch = _epoch
            # Now point_history is filled until t=now

            if addr != ZERO_ADDRESS:
                # If last point was in this block, the slope change has been applied already
                # But in such case we have 0 slope(s)
                last_point.slope += (u_new.slope - u_old.slope)
                last_point.bias += (u_new.bias - u_old.bias)
                if last_point.slope < 0:
                    last_point.slope = 0
                if last_point.bias < 0:
                    last_point.bias = 0

            # Record the changed point into history
            self.point_history[_epoch] = last_point

            if addr != ZERO_ADDRESS:
                # Schedule the slope changes (slope is going down)
                # We subtract new_user_slope from [new_locked.end]
                # and add old_user_slope to [old_locked.end]
                if old_locked.end > block.timestamp:
                    # old_dslope was <something> - u_old.slope, so we cancel that
                    old_dslope += u_old.slope
                    if new_locked.end == old_locked.end:
                        old_dslope -= u_new.slope  # It was a new deposit, not extension
                    self.slope_changes[old_locked.end] = old_dslope

                if new_locked.end > block.timestamp:
                    if new_locked.end > old_locked.end:
                        new_dslope -= u_new.slope  # old slope disappeared at this point
                        self.slope_changes[new_locked.end] = new_dslope
                    # else: we recorded it already in old_dslope

                # Now handle user history
                user_epoch: uint256 = self.user_point_epoch[addr] + 1

                self.user_point_epoch[addr] = user_epoch
                u_new.ts = block.timestamp
                u_new.blk = block.number
                self.user_point_history[addr][user_epoch] = u_new
        ```

    === "Example"
        ```shell
        >>> VotingEscrow.checkpoint():
        ```


## **Admin Ownership**
Ownership of this contract can be transfered by the `admin` (DAO) by calling `commit_tranfer_ownership`. The changes need to be applied by calling `apply_transfer_ownership`. See [here](../VotingEscrow/admin_controls.md#commit_transfer_ownership)


### `admin`
!!! description "`VotingEscrow.admin() -> address: view`"

    Getter for the current admin of the contract.

    Returns: admin (`address`).

    ??? quote "Source code"

        ```python 
        admin: public(address)  # Can and will be a smart contract
        future_admin: public(address)

        @external
        def __init__(token_addr: address, 
                    _name: String[64], 
                    _symbol: String[32], 
                    _version: String[32]
                ):
            """
            @notice Contract constructor
            @param token_addr `ERC20CRV` token address
            @param _name Token name
            @param _symbol Token symbol
            @param _version Contract version - required for Aragon compatibility
            """
            self.admin = msg.sender
            
            ...
        ```

    === "Example"
        ```shell
        >>> VotingEscrow.admin()
        '0x40907540d8a6C65c637785e8f8B742ae6b0b9968'
        ```


### `future_admin`
!!! description "`VotingEscrow.future_admin() -> address: view`"

    Getter for the future admin of the contract. This variable is changed when calling `commit_transfer_ownership` successfully.

    Returns: future admin (`address`).

    ??? quote "Source code"

        ```python hl_lines="2 11"
        admin: public(address)  # Can and will be a smart contract
        future_admin: public(address)

        @external
        def commit_transfer_ownership(addr: address):
            """
            @notice Transfer ownership of VotingEscrow contract to `addr`
            @param addr Address to have ownership transferred to
            """
            assert msg.sender == self.admin  # dev: admin only
            self.future_admin = addr
            log CommitOwnership(addr)   
        ```

    === "Example"  
        ```shell
        >>> VotingEscrow.future_admin()
        '0x40907540d8a6C65c637785e8f8B742ae6b0b9968'
        ```



## **Contract Info Methods**

### `get_last_user_slope`
!!! description "`VotingEscrow.get_last_user_slope(addr: address) -> int128`"

    Getter for the most recent recorded rate of voting power decrease for `addr`.

    Returns: rate (`int128`)

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `addr`       |  `address` | address |

    ??? quote "Source code"

        ```python hl_lines"3"
        @external
        @view
        def get_last_user_slope(addr: address) -> int128:
            """
            @notice Get the most recently recorded rate of voting power decrease for `addr`
            @param addr Address of the user wallet
            @return Value of the slope
            """
            uepoch: uint256 = self.user_point_epoch[addr]
            return self.user_point_history[addr][uepoch].slope
        ```

    === "Example"
        ```shell
        >>> VotingEscrow.get_last_user_slope(0x7a16fF8270133F063aAb6C9977183D9e72835428)
        215557846878647453
        ```


### `user_point_history_ts`
!!! description "`VotingEscrow.user_point_history__ts(_addr: address, _idx: uint256) -> uint256`"

    Getter method for the timestamp for checkpoint number `_idx` for `_addr`.

    Returns: timestamp (`uint256`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_addr`       |  `address` | address |
    | `_idx`       |  `uint256` | epoch time of checkpoint |

    ??? quote "Source code"

        ```python hl_lines"3 10"
        @external
        @view
        def user_point_history__ts(_addr: address, _idx: uint256) -> uint256:
            """
            @notice Get the timestamp for checkpoint `_idx` for `_addr`
            @param _addr User wallet address
            @param _idx User epoch number
            @return Epoch time of the checkpoint
            """
            return self.user_point_history[_addr][_idx].ts
        ```

    === "Example"
        ```shell
        >>> VotingEscrow.user_point_history__ts(0x7a16fF8270133F063aAb6C9977183D9e72835428, 1)
        1597565455
        ```


### `locked_end`
!!! description "`VotingEscrow.locked__end(_addr: address) -> uint256:`"

    Getter for the timestamp when `_addr`'s lock finishes.

    Returns: timestamp (`uint256`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_addr`       |  `address` | timestamp |

    ??? quote "Source code"

        ```python
        locked: public(HashMap[address, LockedBalance])
        epoch: public(uint256)

        @external
        @view
        def locked__end(_addr: address) -> uint256:
            """
            @notice Get timestamp when `_addr`'s lock finishes
            @param _addr User wallet
            @return Epoch time of the lock end
            """
            return self.locked[_addr].end
        ```

    === "Example"  
        ```shell
        >>> VotingEscrow.locked_end(0x7a16fF8270133F063aAb6C9977183D9e72835428)
        1808956800
        ```


### `balanceOf`
!!! description "`VotingEscrow.balanceOf(addr: address, _t: uint256 = block.timestamp) -> uint256:`"

    Getter for the current veCRV balance (= voting power) of `addr`.

    Returns: voting power (`uint256`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `addr`       |  `address` | address |
    | `_t`       |  `uint256` | timestamp; defaults to `block.timestamp` |

    ??? quote "Source code"

        ```python hl_lines="3 13 19"
        @external
        @view
        def balanceOf(addr: address, _t: uint256 = block.timestamp) -> uint256:
            """
            @notice Get the current voting power for `msg.sender`
            @dev Adheres to the ERC20 `balanceOf` interface for Aragon compatibility
            @param addr User wallet address
            @param _t Epoch time to return voting power at
            @return User voting power
            """
            _epoch: uint256 = self.user_point_epoch[addr]
            if _epoch == 0:
                return 0
            else:
                last_point: Point = self.user_point_history[addr][_epoch]
                last_point.bias -= last_point.slope * convert(_t - last_point.ts, int128)
                if last_point.bias < 0:
                    last_point.bias = 0
                return convert(last_point.bias, uint256)

        ```

    === "Example"
        ```shell
        >>> VotingEscrow.balanceOf("0x7a16fF8270133F063aAb6C9977183D9e72835428")
        25298857242406003682652005
        ```


### `balanceOfAt`
!!! description "`VotingEscrow.balanceOfAt(addr: address, _block: uint256) -> uint256:`"

    Getter for the veCRV balance (= voting power) of `addr` at block `_t`.

    Returns: voting power (`uint256`) at a specific timestamp.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `addr`    |  `address` | address |
    | `_block`  |  `uint256` | block height  |

    ??? quote "Source code"

        ```python 
        @external
        @view
        def balanceOfAt(addr: address, _block: uint256) -> uint256:
            """
            @notice Measure voting power of `addr` at block height `_block`
            @dev Adheres to MiniMe `balanceOfAt` interface: https://github.com/Giveth/minime
            @param addr User's wallet address
            @param _block Block to calculate the voting power at
            @return Voting power
            """
            # Copying and pasting totalSupply code because Vyper cannot pass by
            # reference yet
            assert _block <= block.number

            # Binary search
            _min: uint256 = 0
            _max: uint256 = self.user_point_epoch[addr]
            for i in range(128):  # Will be always enough for 128-bit numbers
                if _min >= _max:
                    break
                _mid: uint256 = (_min + _max + 1) / 2
                if self.user_point_history[addr][_mid].blk <= _block:
                    _min = _mid
                else:
                    _max = _mid - 1

            upoint: Point = self.user_point_history[addr][_min]

            max_epoch: uint256 = self.epoch
            _epoch: uint256 = self.find_block_epoch(_block, max_epoch)
            point_0: Point = self.point_history[_epoch]
            d_block: uint256 = 0
            d_t: uint256 = 0
            if _epoch < max_epoch:
                point_1: Point = self.point_history[_epoch + 1]
                d_block = point_1.blk - point_0.blk
                d_t = point_1.ts - point_0.ts
            else:
                d_block = block.number - point_0.blk
                d_t = block.timestamp - point_0.ts
            block_time: uint256 = point_0.ts
            if d_block != 0:
                block_time += d_t * (_block - point_0.blk) / d_block

            upoint.bias -= upoint.slope * convert(block_time - upoint.ts, int128)
            if upoint.bias >= 0:
                return convert(upoint.bias, uint256)
            else:
                return 0
        ```

    === "Example"
        ```shell
        >>> VotingEscrow.balanceOfAt("0x7a16fF8270133F063aAb6C9977183D9e72835428", 18483472)
        27109584974408936745457887
        ```


### `totalSupply`
!!! description "`VotingEscrow.totalSupply(t: uint256 = block.timestamp) -> uint256:`"

    Getter for the current total supply of veCRV (= total voting power) at timestamp `t`.
    
    Returns: supply (uint256) at a specific block height.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `t`       |  `uint256` | timestamp; defaults to `block.timestamp` |

    ??? quote "Source code"

        ```python 
        @external
        @view
        def totalSupply(t: uint256 = block.timestamp) -> uint256:
            """
            @notice Calculate total voting power
            @dev Adheres to the ERC20 `totalSupply` interface for Aragon compatibility
            @return Total voting power
            """
            _epoch: uint256 = self.epoch
            last_point: Point = self.point_history[_epoch]
            return self.supply_at(last_point, t)
        ```

    === "Example"
        ```shell
        >>> VotingEscrow.totalSupply(18078089)
        627628632729421346293548458
        ```


### `totalSupplyAt`
!!! description "`VotingEscrow.totalSupplyAt(_block: uint256) -> uint256`"

    Getter for the current total supply of veCRV (= total voting power) at block `_block`.

    Returns: total supply (`uint256`) at a certain block.  

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_block`       |  `uint256` | Block |

    ??? quote "Source code"

        ```python 
        @external
        @view
        def totalSupplyAt(_block: uint256) -> uint256:
            """
            @notice Calculate total voting power at some point in the past
            @param _block Block to calculate the total voting power at
            @return Total voting power at `_block`
            """
            assert _block <= block.number
            _epoch: uint256 = self.epoch
            target_epoch: uint256 = self.find_block_epoch(_block, _epoch)

            point: Point = self.point_history[target_epoch]
            dt: uint256 = 0
            if target_epoch < _epoch:
                point_next: Point = self.point_history[target_epoch + 1]
                if point.blk != point_next.blk:
                    dt = (_block - point.blk) * (point_next.ts - point.ts) / (point_next.blk - point.blk)
            else:
                if point.blk != block.number:
                    dt = (_block - point.blk) * (block.timestamp - point.ts) / (block.number - point.blk)
            # Now dt contains info on how far are we beyond point

            return self.supply_at(point, point.ts + dt)
        ```

    === "Example"
        ```shell
        >>> VotingEscrow.totalSupplyAt(18483472)
        652219245965489504779222536
        ```


### `token`
!!! description "`VotingEscrow.token() -> address: view `"

    Getter for the veCRV token address.

    Returns: token (`address`).

    ??? quote "Source code"

        ```python hl_lines="1 4 11 17"
        token: public(address)

        @external
        def __init__(token_addr: address, 
                    _name: String[64], 
                    _symbol: String[32], 
                    _version: String[32]
                ):
            """
            @notice Contract constructor
            @param token_addr `ERC20CRV` token address
            @param _name Token name
            @param _symbol Token symbol
            @param _version Contract version - required for Aragon compatibility
            """
            self.admin = msg.sender
            self.token = token_addr

            ...
        ```

    === "Example"
        ```shell
        >>> VotingEscrow.token()
        '0xD533a949740bb3306d119CC777fa900bA034cd52'
        ```


### `supply`
!!! description "`VotingEscrow.supply() -> uint256: view`"

    Getter for the amount of CRV tokens locked into the contract.

    Returns: amount of locked CRV (`uint256`).

    ??? quote "Source code"

        ```python hl_lines="1"
        supply: public(uint256)
        ```

    === "Example"
        ```shell
        >>> VotingEscrow.supply()
        656407031422810196416981172
        ```


### `locked`
!!! description "`VotingEscrow.locked(arg0: address) -> amount: int128, end: uint256: view`"

    Method to check the unlock time of CRV for address `arg0`.

    Returns: amount (`int128`) and unlock time (`uint256`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `arg0`       |  `address` | Address |

    !!!note
        This getter returns the `LockedBalance` struct.

    ??? quote "Source code"

        ```python hl_lines="1"
        struct LockedBalance:
            amount: int128
            end: uint256

        locked: public(HashMap[address, LockedBalance])
        ```

    === "Example"
        ```shell
        >>> VotingEscrow.locked(0x7a16fF8270133F063aAb6C9977183D9e72835428)
        27191329036660104386777000, 1808956800
        ```


### `epoch`
!!! description "`VotingEscrow.epoch() -> uint256: view `"

    Getter for the current epoch.

    Returns: current epoch (`uint256`).

    ??? quote "Source code"

        ```python hl_lines="1"
        epoch: public(uint256)
        ```

    === "Example"
        ```shell
        >>> VotingEscrow.epoch()
        48610
        ```


### `point_history`
!!! description "`VotingEscrow.point_history(arg0: uint256) -> bias: int128, slope: int128, ts: uint256, blk: uint256: view`"

    Getter for the point history of point `arg0`.

    Returns: bias (`int128`), slope (`int128`), ts (`uint256`) and blk (`uint256`).

    | Input      | Type   | Description |
    | ---------- | -------| ----|
    | `arg0`     |  `uint256` | Point |

    ??? quote "Source code"

        ```python hl_lines="1 14 15"
        point_history: public(Point[100000000000000000000000000000])  # epoch -> unsigned point

        @external
        def __init__(token_addr: address, _name: String[64], _symbol: String[32], _version: String[32]):
            """
            @notice Contract constructor
            @param token_addr `ERC20CRV` token address
            @param _name Token name
            @param _symbol Token symbol
            @param _version Contract version - required for Aragon compatibility
            """
            ...

            self.point_history[0].blk = block.number
            self.point_history[0].ts = block.timestamp
            
            ...
        ```

    === "Example"
        ```shell
        >>> VotingEscrow.point_history(3)
        127357905207521710167, 4570173769659, 1597370987, 10655341
        ```


### `name`
!!! description "`VotingEscrow.name() -> String[64]: view `"

    Getter for the name of the token.

    Returns: name (`String[64]`).

    ??? quote "Source code"

        ```python hl_lines="1 5 12 27"
        name: public(String[64])

        @external
        def __init__(token_addr: address, 
                    _name: String[64], 
                    _symbol: String[32], 
                    _version: String[32]
                ):
            """
            @notice Contract constructor
            @param token_addr `ERC20CRV` token address
            @param _name Token name
            @param _symbol Token symbol
            @param _version Contract version - required for Aragon compatibility
            """
            ...

            self.name = _name

            ...
        ```

    === "Example"
        ```shell
        >>> VotingEscrow.name()
        'Vote-escrowed CRV'
        ```


### `symbol`
!!! description "`VotingEscrow.symbol() -> String[32]: view `"

    Getter for the symbol of the token.

    Returns: symbol (`String[32]`).

    ??? quote "Source code"

        ```python hl_lines="1 4 6 13 28"
        symbol: public(String[32])

        @external
        def __init__(token_addr: address, 
                    _name: String[64], 
                    _symbol: String[32], 
                    _version: String[32]
                ):
            """
            @notice Contract constructor
            @param token_addr `ERC20CRV` token address
            @param _name Token name
            @param _symbol Token symbol
            @param _version Contract version - required for Aragon compatibility
            """
            ...

            self.symbol = _symbol
            
            ...
        ```

    === "Example"
        ```shell
        >>> VotingEscrow.symbol()
        'veCRV'
        ```


### `version`
!!! description "`VotingEscrow.version() -> String[32]: view`"

    Getter for the version of the contract.

    Returns: version (`String[32]`).

    ??? quote "Source code"

        ```python hl_lines="1 7 29"
        version: public(String[32])

        @external
        def __init__(token_addr: address, 
                    _name: String[64], 
                    _symbol: String[32], 
                    _version: String[32]
                ):
            """
            @notice Contract constructor
            @param token_addr `ERC20CRV` token address
            @param _name Token name
            @param _symbol Token symbol
            @param _version Contract version - required for Aragon compatibility
            """
            ...

            self.version = _version
        ```

    === "Example"
        ```shell
        >>> VotingEscrow.version()
        'veCRV_1.0.0'
        ```


### `decimals`
!!! description "`VotingEscrow.decimals() -> uint256: view`"

    Getter for the decimals of the token.
    
    Returns: decimals (`uint256`).


    ??? quote "Source code"

        ```python hl_lines="1 15 23 24 25"
        decimals: public(uint256)

        @external
        def __init__(token_addr: address, 
                    _name: String[64], 
                    _symbol: String[32], 
                    _version: String[32]
                ):
            """
            @notice Contract constructor
            @param token_addr `ERC20CRV` token address
            @param _name Token name
            @param _symbol Token symbol
            @param _version Contract version - required for Aragon compatibility
            """
            ...

            self.decimals = _decimals

            ...
        ```

    === "Example"
        ```shell
        >>> VotingEscrow.decimals()
        18
        ```


### `controller`
!!! description "`VotingEscrow.controller() -> address: view`"

    Getter for the Controller of the contract.

    Returns: Controller (`address`).

    ??? quote "Source code"

        ```python hl_lines="1"
        controller: public(address)

        @external
        def changeController(_newController: address):
            """
            @dev Dummy method required for Aragon compatibility
            """
            assert msg.sender == self.controller
            self.controller = _newController
        ```

    === "Example"
        ```shell
        >>> VotingEscrow.controller()
        '0xc4AD0Ef33A0A4ddA3461c479ccb6c36d1e4B7Be4'
        ```


### `changeController`
!!! description "`VotingEscrow.changeController(_newController: address):`"

    Simple dummy method required for Aragon compatibility.

    ??? quote "Source code"

        ```python hl_lines="0"
        @external
        def changeController(_newController: address):
            """
            @dev Dummy method required for Aragon compatibility
            """
            assert msg.sender == self.controller
            self.controller = _newController
        ```
    


### `transfersEnabled`
!!! description "`VotingEscrow.transfersEnabled() -> boolean: view`"

    View method which is required for the compatibility with Aragon.

    ??? quote "Source code"

        ```python hl_lines="1 3 6 21"
        # Aragon's view methods for compatibility
        controller: public(address)
        transfersEnabled: public(bool)

        @external
        def __init__(token_addr: address, 
                    _name: String[64], 
                    _symbol: String[32], 
                    _version: String[32]
                ):
            """
            @notice Contract constructor
            @param token_addr `ERC20CRV` token address
            @param _name Token name
            @param _symbol Token symbol
            @param _version Contract version - required for Aragon compatibility
            """
            ...

            self.transfersEnabled = True

            ...
        ```