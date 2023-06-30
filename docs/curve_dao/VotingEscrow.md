Participating in Curve DAO governance requires that an account have a balance of vote-escrowed CRV (veCRV). veCRV is a non-standard ERC20 implementation, used within the Aragon DAO to determine each account’s voting power.

!!! info
    **veCRV** is represented by the **`VotingEscrow`** contract, deployed to the Ethereum mainnet at:
    [0x5f3b5DfEb7B28CDbD7FAba78963EE202a494e2A2](https://etherscan.io/address/0x5f3b5dfeb7b28cdbd7faba78963ee202a494e2a2)  

    Source code of the **`VotingEscrow`** contract can be found on [Github](https://github.com/curvefi/curve-dao-contracts/blob/master/contracts/VotingEscrow.vy).

!!!warning
    veCRV cannot be transferred. The only way to obtain veCRV is by locking CRV.  
    The maximum lock time is four years and the minimum lock is one week.

    To calculate the obtained vecrv after locking make sure to multiply by $\frac{locktime}{4}$, with `locktime` denominated in years. 

| CRV      | veCRV  | Locktime|
| -------- | -------| --------|
| `1`      |  `1`   | 4 years |
| `1`      |  `0.75`| 3 years |
| `1`      |  `0.5` | 2 years |
| `1`      |  `0.25`| 1 year  |


## **Implemention Details**
User voting power $w_{i}$ is linearly decreasing since the moment of lock. So does the total voting power $W$. In order to avoid periodic check-ins, every time the user deposits, or withdraws, or changes the locktime, we record user’s slope and bias for the linear function $w_{i}(t)$ in the public mapping `user_point_history`. We also change slope and bias for the total voting power $W(t)$ and record it in `point_history`. In addition, when a user’s lock is scheduled to end, we schedule change of slopes of $W(t)$ in the future in `slope_changes`. Every change involves increasing the `epoch` by 1.

This way we don’t have to iterate over all users to figure out, how much should $W(t)$ change by, neither we require users to check in periodically. However, we limit the end of user locks to times rounded off by whole weeks.

Slopes and biases change both when a user deposits and locks governance tokens, and when the locktime expires. All the possible expiration times are rounded to whole weeks to make number of reads from blockchain proportional to number of missed weeks at most, not number of users (which is potentially large).



## **Smart Wallet Whitelist**
The Smart Wallet Checker is an external contract which checks if certain contracts are whitelisted. If yes, the contract will be able to lock CRV into the VotingEscrow.
If a contract is not whitelisted it will not be able to lock Curve DAO Tokens.

!!! info
    The current SmartWalletChecker address is [0xca719728Ef172d0961768581fdF35CB116e0B7a4](https://etherscan.io/address/0xca719728Ef172d0961768581fdF35CB116e0B7a4).  
    This address can be changed by a DAO vote. Please make sure you are using the current SmartWalletWhitelist.


### `check`
!!! description "`SmartWalletChecker.check(_wallet: address) -> bool: view`"

    Getter method to check if `_wallet` is whitelisted.

    !!!note
        Make sure to query `check` on the SmartWalletChecker contract and not on the VotingEscrow contract!

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_wallet`   |  `address` | Address to check whitelist for |

    ??? quote "Source code"

        ```python hl_lines="5"
        contract SmartWalletWhitelist {
    
            mapping(address => bool) public wallets;
            address public dao;
            address public checker;
            address public future_checker;
        ```

    === "Example"
        ```shell
        >>> SmartWalletWhitelist.check("0x989AEb4d175e16225E39E87d0D97A3360524AD80")
        'true'
        ```


### `smart_wallet_checker`
!!! description "`vecrv.smart_wallet_checker() -> address: view`"

    Getter for the current smart wallet checker contract.
    
    Returns: **smart wallet checker contract** (`address`).

    ??? quote "Source code"

        ```python hl_lines="1"
        smart_wallet_checker: public(address)
        ```

    === "Example"
        ```shell
        >>> vecrv.smart_wallet_checker()
        '0xca719728Ef172d0961768581fdF35CB116e0B7a4'
        ```


### `future_smart_wallet_checker`
!!! description "`vecrv.future_smart_wallet_checker() -> address: view`"

    Getter for the future smart wallet checker contract.

    Returns: **future smart wallet checker contract** (`address`).

    ??? quote "Source code"

        ```python hl_lines="1"
        future_smart_wallet_checker: public(address)
        ```

    === "Example"
        ```shell
        >>> vecrv.future:_smart_wallet_checker()
        '0xca719728Ef172d0961768581fdF35CB116e0B7a4'
        ```


### `commit_smart_wallet_checker`
!!! description "`vecrv.commit_smart_wallet_checker(addr: address):`"

    Function to commit the the smart wallet checker contract address to `addr`. In order to apply the new contract address, [`apply_smart_contract_wallet`](#apply_smart_wallet_checker) need to be called.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `addr`     |  `address` | New SmartWalletChecker Contract Address |

    ??? quote "Source code"

        ```python hl_lines="2"
        @external
        def commit_smart_wallet_checker(addr: address):
            """
            @notice Set an external contract to check for approved smart contract wallets
            @param addr Address of Smart contract checker
            """
            assert msg.sender == self.admin
            self.future_smart_wallet_checker = addr  
        ```

    !!! permission 
        This function can only be called by the `admin`.

    === "Example"
        ```shell
        >>> vecrv.commit_smart_wallet_checker(addr: address):
        'new contract address'
        ```


### `apply_smart_wallet_checker`
!!! description "`vecrv.apply_smart_wallet_checker():`"

    Function to apply the new SmartWalletChecker address.

    ??? quote "Source code"

        ```python hl_lines="2"
        @external
        def apply_smart_wallet_checker():
            """
            @notice Apply setting external contract to check approved smart contract wallets
            """
            assert msg.sender == self.admin
            self.smart_wallet_checker = self.future_smart_wallet_checker
        ```

    !!! permissions 
        This function can only be called by the `admin`.

    === "Example"
        ```shell
        >>> vecrv.apply_smart_wallet_checker():
        'todo'
        ```



## **Admin Ownership**
Ownership of this contract can be transfered by the `admin` (DAO) by calling `commit_tranfer_ownership`. Calling this function sets the new address as `future_admin`. These changes need to be applied by calling `apply_transfer_ownership`. 

!!! info
    The [`commit_transfer_ownership`](#commit_transfer_ownership) and [`apply_transfer_ownership`](#apply_transfer_ownership) function can only be called by the admin of the contract, which is the DA itself.


### `admin`
!!! description "`vecrv.admin() -> address: view`"

    Getter for the current admin of the contract.

    Returns: **admin** (`address`).

    ??? quote "Source code"

        ```python hl_lines="1 17"
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
            self.token = token_addr
            self.point_history[0].blk = block.number
            self.point_history[0].ts = block.timestamp
            self.controller = msg.sender
            self.transfersEnabled = True

            _decimals: uint256 = ERC20(token_addr).decimals()
            assert _decimals <= 255
            self.decimals = _decimals

            self.name = _name
            self.symbol = _symbol
            self.version = _version
        ```

    === "Example"
        ```shell
        >>> vecrv.admin()
        '0x40907540d8a6C65c637785e8f8B742ae6b0b9968'
        ```


### `future_admin`
!!! description "`vecrv.future_admin() -> address: view`"

    Getter for the future admin of the contract. This variable is changed when calling `commit_transfer_ownership` successfully.

    Returns: **future admin** (`address`).

    ??? quote "Source code"

        ```python hl_lines="2 40"
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
            self.token = token_addr
            self.point_history[0].blk = block.number
            self.point_history[0].ts = block.timestamp
            self.controller = msg.sender
            self.transfersEnabled = True

            _decimals: uint256 = ERC20(token_addr).decimals()
            assert _decimals <= 255
            self.decimals = _decimals

            self.name = _name
            self.symbol = _symbol
            self.version = _version
        

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
        >>> vecrv.future_admin()
        '0x40907540d8a6C65c637785e8f8B742ae6b0b9968'
        ```


### `commit_transfer_ownership`
!!! description "`vecrv.commit_transfer_ownership(addr: address):`"

    Function to commit the ownership of the contract to `addr`.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `addr`       |  `address` | Address |

    ??? quote "Source code"

        ```python hl_lines="1 8 15"
        event CommitOwnership:
            admin: address

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

    !!! permissions
        This function can only be called by the `admin` of the contract.

    === "Example"
        ```shell
        >>> vecrv.commit_transfer_ownership(todo):
        'todo'
        ```


### `apply_transfer_ownership`
!!! description "`vecrv.apply_transfer_ownership():`"

    Function to apply the new ownership.

    ??? quote "Source code"

        ```python hl_lines="1 8 10 16"
        event ApplyOwnership:
            admin: address

        admin: public(address)  # Can and will be a smart contract
        future_admin: public(address)

        @external
        def apply_transfer_ownership():
            """
            @notice Apply ownership transfer
            """
            assert msg.sender == self.admin  # dev: admin only
            _admin: address = self.future_admin
            assert _admin != ZERO_ADDRESS  # dev: admin not set
            self.admin = _admin
            log ApplyOwnership(_admin)  
        ```
    
    !!! permissions
        This function can only be called by the `admin` of the contract.

    === "Example"
        ```shell
        >>> vecrv.apply_transfer_ownership():
        'todo'
        ```


## **Working with VoteLocks**

### `create_lock`
!!! description "`vecrv.create_lock(_value: uint256, _unlock_time: uint256):`"

    Function to deposit CRV into the contract and create a new lock.
     
    Prior to calling this function, the contract must be approved to transfer at least `_value` CRV. A new lock cannot be created when an existing lock already exists. 

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_value`   |  `uint256` | Amount of CRV to deposit |
    | `_unlock_time` |  `uint256` | Epoch when tokens unlock |

    !!!note
        Epochs are rounded down to whole weeks.

    ??? quote "Source code"

        ```python hl_lines="3"
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
        ```

    === "Example"
        ```shell
        >>> vecrv.apply_transfer_ownership():
        ```

### `increase_amount`
!!! description "`vecrv.increase_amount(_value: uint256):`"

    Deposit additional CRV into an existing lock.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_value`       |  `uint256` | Amount of CRV to deposit |

    ??? quote "Source code"

        ```python hl_lines="3"
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
        ```

    === "Example"
        ```shell
        >>> vecrv.increase_amount(todo):
        'todo'
        ```


### `increase_unlock_time`
!!! description "`vecrv.increase_unlock_time(_unlock_time: uint256):`"

    Extend the unlock time on a lock that already exists.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_unlock_time` |  `uint256` | New epoch time for unlocking |

    ??? quote "Source code"

        ```python hl_lines="3"
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
        ```

    === "Example"
        ```shell
        >>> vecrv.increase_unlock_time(todo):
        ```


### `withdraw`
!!! description "`vecrv.withdraw()`"

    Withdraw deposited CRV tokens once a lock has expired.

    ??? quote "Source code"

        ```python hl_lines="3"
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
        >>> vecrv.withdraw():
        'todo'
        ```


### `deposit_for`
!!! description "`vecrv.deposit_for(_addr: address, _value: uint256):`"

    todo! anyone can lock for another wallet?? i remember people said this is a bug and is fixed somehow. but how? 

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_addr`       |  `address` | todo |
    | `_value_` |  `uint256` | todo |

    ??? quote "Source code"

        ```python hl_lines="0"
        
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
        ```

    === "Example"
        ```shell
        >>> vecrv.apply_transfer_ownership():
        'todo'
        ```


### `checkpoint`
!!! description "`vecrv.changeController(_newController: address):`"

    Simple dummy method required for Aragon compatibility.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_newController` |  `address` | New Controller Address |

    ??? quote "Source code"

        ```python hl_lines="2"
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
        >>> vecrv.checkpoint():
        'todo'
        ```


### `change_controller`
!!! description "`vecrv.changeController(_newController: address):`"

    Simple dummy method required for Aragon compatibility.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_newController` |  `address` | New Controller Address |

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

    === "Example"
        ```shell
        >>> vecrv.changeController(todo):
        'todo'
        ```
    


## **Contract Info Methods**

### `get_last_user_slope`
!!! description "`vecrv.get_last_user_slope(addr: address) -> int128`"

    Getter for the most recent recorded rate of voting power decrease for `addr`.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `addr`       |  `address` | Address |

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
        >>> vecrv.get_last_user_slope(0x7a16fF8270133F063aAb6C9977183D9e72835428)
        215557846878647453
        ```


### `user_point_history_ts`
!!! description "`vecrv.user_point_history__ts(_addr: address, _idx: uint256) -> uint256`"

    Returns the timestamp for checkpoint `_idx` for `_addr`.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_idx`       |  `uint256` | Checkpoint |
    | `_addr`       |  `address` | Address |

    ??? quote "Source code"

        ```python hl_lines"3"
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
        >>> vecrv.user_point_history__ts(0x7a16fF8270133F063aAb6C9977183D9e72835428, 1)
        1597565455
        ```


### `locked_end`
!!! description "`vecrv.locked_end(_addr: address) -> uint256:`"

    Returns a epoch (`uint256`) when '_addr's lock finishes

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_addr`       |  `address` | Timestamp |

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
        >>> vecrv.locked_end(0x7a16fF8270133F063aAb6C9977183D9e72835428)
        1808956800
        ```

### `balanceOf`
!!! description "`vecrv.balanceOf(addr: address, _t: uint256 = block.timestamp) -> uint256:`"

    Returns the voting power (`uint256`) of an address at a certain timestamp.

    !!!note
        This function can be called without setting a timestamp. It will automatically use the most recent one.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_addr`       |  `address` | Address |
    | `_t`       |  `uint256` | Timestamp |

    ??? quote "Source code"

        ```python

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
        >>> vecrv.balanceOf(0x7a16fF8270133F063aAb6C9977183D9e72835428, 1683742945)
        26990828983175164776061315
        ```


### `balanceOfAt`
!!! description "`vecrv.balanceOf(addr: address, _t: uint256 = block.timestamp) -> uint256:`"

    Measure the voting power of an address at a historic block height.

    This function is taken from the [Minime](https://github.com/Giveth/minime) ERC20 implementation and is required for compatibility with Aragon.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_addr`    |  `address` | Address |
    | `_t`       |  `uint256` | Block |

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
        >>> vecrv.balanceOfAt(todo)
        'todo'
        ```

### `totalSupply`
!!! description "`vecrv.totalSupply(t: uint256 = block.timestamp) -> uint256:`"

    Returns the total supply (`uint256`) of vecrv at a certain timestamp.  
    
    !!!note
        This function can be called without setting a timestamp. It will automatically use the most recent one.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `t`       |  `uint256` | Timestamp |

    ??? quote "Source code"

        ```python hl_lines="5"

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
        >>> vecrv.totalSupply(1683742945)
        586046376093059723137909505
        ```


### `totalSupplyAt`
!!! description "`vecrv.totalSupplyAt(_block: uint256) -> uint256:`"

    Returns the total supply (`uint256`) of vecrv at a certain block.  

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
        >>> vecrv.totalSupply(1683742945)
        586046376093059723137909505
        ```




### `token`
!!! description "`vecrv.token() -> address: view `"

    Getter for the token address of the contract.

    Returns: **token address** (`address`) of the vecrv token.


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
            self.point_history[0].blk = block.number
            self.point_history[0].ts = block.timestamp
            self.controller = msg.sender
            self.transfersEnabled = True

            _decimals: uint256 = ERC20(token_addr).decimals()
            assert _decimals <= 255
            self.decimals = _decimals

            self.name = _name
            self.symbol = _symbol
            self.version = _version
        ```

    === "Example"
        ```shell
        >>> vecrv.token()
        '0xD533a949740bb3306d119CC777fa900bA034cd52'
        ```


### `supply`
!!! description "`vecrv.supply() -> uint256`"

    Getter for the supply of crv tokens locked into the contract.

    Returns: amount (`uint256`) of crv tokens locked.

    ??? quote "Source code"

        ```python hl_lines="1 5"
        event Supply:
            prevSupply: uint256
            supply: uint256

        supply: public(uint256)
        ```

    === "Example"
        ```shell
        >>> vecrv.supply()
        656407031422810196416981172
        ```


### `locked`
!!! description "`vecrv.locked(arg0: address) -> amount: int128, end: uint256`"

    Method to check the unlock time of crv for an address.

    Returns: amount (`int128`) and end of lock (`uint256`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `arg0`       |  `address` | Address |

    ??? quote "Source code"

        ```python hl_lines="1"
        locked: public(HashMap[address, LockedBalance])
        ```

    === "Example"
        ```shell
        >>> vecrv.locked(0x7a16fF8270133F063aAb6C9977183D9e72835428)
        27191329036660104386777000, 1808956800
        ```


### `epoch`
!!! description "`vecrv.epoch() -> String[64]: view `"

    Getter for the current epoch.

    Returns: current epoch (`String[64]`).

    ??? quote "Source code"

        ```python hl_lines="1"
        epoch: public(uint256)
        ```

    === "Example"
        ```shell
        >>> vecrv.epoch()
        48610
        ```


### `point_history`
!!! description "`vecrv.point_history(arg0: uint256) -> bias: int128, slope: int128, ts: uint256, blk: uint256   `"

    todo


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
            self.admin = msg.sender
            self.token = token_addr
            self.point_history[0].blk = block.number
            self.point_history[0].ts = block.timestamp
            self.controller = msg.sender
            self.transfersEnabled = True

            _decimals: uint256 = ERC20(token_addr).decimals()
            assert _decimals <= 255
            self.decimals = _decimals

            self.name = _name
            self.symbol = _symbol
            self.version = _version
        ```

    === "Example"
        ```shell
        >>> vecrv.point_history()
        'todo'
        ```

### `controller`
!!! description "`vecrv.controller():`"

    Getter for the controller address of the contract.

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
        >>> vecrv.controller()
        '0xc4AD0Ef33A0A4ddA3461c479ccb6c36d1e4B7Be4'
        ```


### `change_controller`
!!! description "`vecrv.changeController(_newController: address):`"

    Function to change the controller address.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_newController` |  `address` | New Controller Address |

    ??? quote "Source code"

        ```python hl_lines="1 4"
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
        >>> vecrv.changeController(todo)
        todo
        ```

### `transfersEnabled`
!!! description "`vecrv.transfersEnabled() -> boolean: view`"

    Getter method to check the transfership of vecrv token. Is needed for compatibility with Aragon's view methods.

    ??? quote "Source code"

        ```python hl_lines="1 3 21"
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
            self.admin = msg.sender
            self.token = token_addr
            self.point_history[0].blk = block.number
            self.point_history[0].ts = block.timestamp
            self.controller = msg.sender
            self.transfersEnabled = True

            _decimals: uint256 = ERC20(token_addr).decimals()
            assert _decimals <= 255
            self.decimals = _decimals

            self.name = _name
            self.symbol = _symbol
            self.version = _version

        ```

    === "Example"
        ```shell
        >>> vecrv.transfersEnabeled()
        'True'
        ```


### `name`
!!! description "`vecrv.name() -> String[64]: view `"

    Getter for the name of the VotingEscrow Token.

    Returns: **name** (`String[64]`).

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
            self.admin = msg.sender
            self.token = token_addr
            self.point_history[0].blk = block.number
            self.point_history[0].ts = block.timestamp
            self.controller = msg.sender
            self.transfersEnabled = True

            _decimals: uint256 = ERC20(token_addr).decimals()
            assert _decimals <= 255
            self.decimals = _decimals

            self.name = _name
            self.symbol = _symbol
            self.version = _version
        ```

    === "Example"
        ```shell
        >>> vecrv.name()
        'Vote-escrowed CRV'
        ```

### `symbol`
!!! description "`vecrv.symbol() -> String[32]: view `"

    Getter for the symbol of the VotingEscrow token.

    Returns: symbol (`String[32]`) of the token.

    ??? quote "Source code"

        ```python hl_lines="1 6 13 28"
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
            self.admin = msg.sender
            self.token = token_addr
            self.point_history[0].blk = block.number
            self.point_history[0].ts = block.timestamp
            self.controller = msg.sender
            self.transfersEnabled = True

            _decimals: uint256 = ERC20(token_addr).decimals()
            assert _decimals <= 255
            self.decimals = _decimals

            self.name = _name
            self.symbol = _symbol
            self.version = _version
        ```

    === "Example"
        ```shell
        >>> vecrv.symbol()
        'veCRV'
        ```

### `version`
!!! description "`vecrv.version() -> String[32]: view`"

    enabels transfership of vecrv token. is needed for compatibility with Aragon's view methods.

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
            self.admin = msg.sender
            self.token = token_addr
            self.point_history[0].blk = block.number
            self.point_history[0].ts = block.timestamp
            self.controller = msg.sender
            self.transfersEnabled = True

            _decimals: uint256 = ERC20(token_addr).decimals()
            assert _decimals <= 255
            self.decimals = _decimals

            self.name = _name
            self.symbol = _symbol
            self.version = _version

        ```

    === "Example"
        ```shell
        >>> vecrv.version()
        'veCRV_1.0.0'
        ```

    !!! note
        `transfersEnabled` is set to `true` and can't be changed!


### `decimals`
!!! description "`vecrv.decimals() -> uint256: view`"

    Returns the total supply (`uint256`) of vecrv (= total voting power) at a certain block.  


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
            self.admin = msg.sender
            self.token = token_addr
            self.point_history[0].blk = block.number
            self.point_history[0].ts = block.timestamp
            self.controller = msg.sender
            self.transfersEnabled = True

            _decimals: uint256 = ERC20(token_addr).decimals()
            assert _decimals <= 255
            self.decimals = _decimals

            self.name = _name
            self.symbol = _symbol
            self.version = _version
        ```

    === "Example"
        ```shell
        >>> vecrv.decimals()
        18
        ```

