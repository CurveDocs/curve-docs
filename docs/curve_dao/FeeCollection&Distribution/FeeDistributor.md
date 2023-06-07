Fees are distributed to veCRV holders via the `FeeDistributor` contract. 

Fees are distributed weekly. The porportional amount of fees that each user is to receive is calculated based on their veCRV balance relative to the total veCRV supply.    
This amount is calculated at the start of the week. The actual distribution occurs at the end of the week based on the fees that were collected. As such, a user that creates a new vote-lock should expect to receive their first fee payout at the end of the following epoch week.

!!! Etherscan
    The contract is deployed to the Ethereum mainnet at: [0xA464e6DCda8AC41e03616F95f4BC98a13b8922Dc](https://etherscan.io/address/0xa464e6dcda8ac41e03616f95f4bc98a13b8922dc).  
    Source code for this contract is available on [Github](https://github.com/curvefi/curve-dao-contracts/blob/master/contracts/FeeDistributor.vy).  

The available 3CRV balance to distribute is tracked via the “**token checkpoint**”. This is updated at minimum every 24 hours. Fees that are received between the last checkpoint of the previous week and first checkpoint of the new week will be split evenly between the weeks.


## Claiming Fees

### `checkpoint_token`
!!! description "`FeeDistributor.checkpoint_token()`"

    Updates the token checkpoint.

    The token checkpoint tracks the balance of 3CRV within the distributor to determine the amount of fees to distribute in the given week. The checkpoint can be updated at most once every 24 hours. Fees that are received between the last checkpoint of the previous week and first checkpoint of the new week will be split evenly between the weeks.

    To ensure full distribution of fees in the current week, the burn process must be completed prior to the last checkpoint within the week.

    A token checkpoint is automatically taken during any `claim` action, if the last checkpoint is more than 24 hours old. 

    ??? quote "Source code"

        ```python hl_lines="1 8 35 38"
        event CheckpointToken:
            time: uint256
            tokens: uint256

        can_checkpoint_token: public(bool)

        @internal
        def _checkpoint_token():
            token_balance: uint256 = ERC20(self.token).balanceOf(self)
            to_distribute: uint256 = token_balance - self.token_last_balance
            self.token_last_balance = token_balance

            t: uint256 = self.last_token_time
            since_last: uint256 = block.timestamp - t
            self.last_token_time = block.timestamp
            this_week: uint256 = t / WEEK * WEEK
            next_week: uint256 = 0

            for i in range(20):
                next_week = this_week + WEEK
                if block.timestamp < next_week:
                    if since_last == 0 and block.timestamp == t:
                        self.tokens_per_week[this_week] += to_distribute
                    else:
                        self.tokens_per_week[this_week] += to_distribute * (block.timestamp - t) / since_last
                    break
                else:
                    if since_last == 0 and next_week == t:
                        self.tokens_per_week[this_week] += to_distribute
                    else:
                        self.tokens_per_week[this_week] += to_distribute * (next_week - t) / since_last
                t = next_week
                this_week = next_week

            log CheckpointToken(block.timestamp, to_distribute)

        @external
        def checkpoint_token():
            """
            @notice Update the token checkpoint
            @dev Calculates the total number of tokens to be distributed in a given week.
                During setup for the initial distribution this function is only callable
                by the contract owner. Beyond initial distro, it can be enabled for anyone
                to call.
            """
            assert (msg.sender == self.admin) or\
                (self.can_checkpoint_token and (block.timestamp > self.last_token_time + TOKEN_CHECKPOINT_DEADLINE))
            self._checkpoint_token()
        ```

    === "Example"
        ```shell
        >>> GaugeController.checkpoint_token()
        todo
        ```

### `claim`
!!! description "`FeeDistributor.claim(_addr: address = msg.sender) -> uint256:`"

    Claims fees for an account.  

    Returns the amount of 3CRV received in the claim. For off-chain integrators, this function can be called as though it were a view method in order to check the claimable amount.


    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_addr` |  `address` | Address to claim fees for |

    ??? quote "Source code"

        ```python hl_lines="1 8 71 77"
        event Claimed:
            recipient: indexed(address)
            amount: uint256
            claim_epoch: uint256
            max_epoch: uint256

        @internal
        def _claim(addr: address, ve: address, _last_token_time: uint256) -> uint256:
            # Minimal user_epoch is 0 (if user had no point)
            user_epoch: uint256 = 0
            to_distribute: uint256 = 0

            max_user_epoch: uint256 = VotingEscrow(ve).user_point_epoch(addr)
            _start_time: uint256 = self.start_time

            if max_user_epoch == 0:
                # No lock = no fees
                return 0

            week_cursor: uint256 = self.time_cursor_of[addr]
            if week_cursor == 0:
                # Need to do the initial binary search
                user_epoch = self._find_timestamp_user_epoch(ve, addr, _start_time, max_user_epoch)
            else:
                user_epoch = self.user_epoch_of[addr]

            if user_epoch == 0:
                user_epoch = 1

            user_point: Point = VotingEscrow(ve).user_point_history(addr, user_epoch)

            if week_cursor == 0:
                week_cursor = (user_point.ts + WEEK - 1) / WEEK * WEEK

            if week_cursor >= _last_token_time:
                return 0

            if week_cursor < _start_time:
                week_cursor = _start_time
            old_user_point: Point = empty(Point)

            # Iterate over weeks
            for i in range(50):
                if week_cursor >= _last_token_time:
                    break

                if week_cursor >= user_point.ts and user_epoch <= max_user_epoch:
                    user_epoch += 1
                    old_user_point = user_point
                    if user_epoch > max_user_epoch:
                        user_point = empty(Point)
                    else:
                        user_point = VotingEscrow(ve).user_point_history(addr, user_epoch)

                else:
                    # Calc
                    # + i * 2 is for rounding errors
                    dt: int128 = convert(week_cursor - old_user_point.ts, int128)
                    balance_of: uint256 = convert(max(old_user_point.bias - dt * old_user_point.slope, 0), uint256)
                    if balance_of == 0 and user_epoch > max_user_epoch:
                        break
                    if balance_of > 0:
                        to_distribute += balance_of * self.tokens_per_week[week_cursor] / self.ve_supply[week_cursor]

                    week_cursor += WEEK

            user_epoch = min(max_user_epoch, user_epoch - 1)
            self.user_epoch_of[addr] = user_epoch
            self.time_cursor_of[addr] = week_cursor

            log Claimed(addr, to_distribute, user_epoch, max_user_epoch)

            return to_distribute

        @external
        @nonreentrant('lock')
        def claim(_addr: address = msg.sender) -> uint256:
            """
            @notice Claim fees for `_addr`
            @dev Each call to claim look at a maximum of 50 user veCRV points.
                For accounts with many veCRV related actions, this function
                may need to be called more than once to claim all available
                fees. In the `Claimed` event that fires, if `claim_epoch` is
                less than `max_epoch`, the account may claim again.
            @param _addr Address to claim fees for
            @return uint256 Amount of fees claimed in the call
            """
            assert not self.is_killed

            if block.timestamp >= self.time_cursor:
                self._checkpoint_total_supply()

            last_token_time: uint256 = self.last_token_time

            if self.can_checkpoint_token and (block.timestamp > last_token_time + TOKEN_CHECKPOINT_DEADLINE):
                self._checkpoint_token()
                last_token_time = block.timestamp

            last_token_time = last_token_time / WEEK * WEEK

            amount: uint256 = self._claim(_addr, self.voting_escrow, last_token_time)
            if amount != 0:
                token: address = self.token
                assert ERC20(token).transfer(_addr, amount)
                self.token_last_balance -= amount

            return amount
        ```

    === "Example"
        ```shell
        >>> GaugeController.claim()
        todo
        ```


### `claim_many`
!!! description "`FeeDistributor.claim_many(_receivers: address[20]) -> bool:`"

    This is useful to claim for multiple accounts at once, or for making many claims against the same account if that account has performed more than 50 veCRV related actions.

    Returns: true (`boolean`).


    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_recievers` |  `address` | Addresss to claim for |

    ??? quote "Source code"

        ```python hl_lines="1 8 71 77"
        event Claimed:
            recipient: indexed(address)
            amount: uint256
            claim_epoch: uint256
            max_epoch: uint256

        @internal
        def _claim(addr: address, ve: address, _last_token_time: uint256) -> uint256:
            # Minimal user_epoch is 0 (if user had no point)
            user_epoch: uint256 = 0
            to_distribute: uint256 = 0

            max_user_epoch: uint256 = VotingEscrow(ve).user_point_epoch(addr)
            _start_time: uint256 = self.start_time

            if max_user_epoch == 0:
                # No lock = no fees
                return 0

            week_cursor: uint256 = self.time_cursor_of[addr]
            if week_cursor == 0:
                # Need to do the initial binary search
                user_epoch = self._find_timestamp_user_epoch(ve, addr, _start_time, max_user_epoch)
            else:
                user_epoch = self.user_epoch_of[addr]

            if user_epoch == 0:
                user_epoch = 1

            user_point: Point = VotingEscrow(ve).user_point_history(addr, user_epoch)

            if week_cursor == 0:
                week_cursor = (user_point.ts + WEEK - 1) / WEEK * WEEK

            if week_cursor >= _last_token_time:
                return 0

            if week_cursor < _start_time:
                week_cursor = _start_time
            old_user_point: Point = empty(Point)

            # Iterate over weeks
            for i in range(50):
                if week_cursor >= _last_token_time:
                    break

                if week_cursor >= user_point.ts and user_epoch <= max_user_epoch:
                    user_epoch += 1
                    old_user_point = user_point
                    if user_epoch > max_user_epoch:
                        user_point = empty(Point)
                    else:
                        user_point = VotingEscrow(ve).user_point_history(addr, user_epoch)

                else:
                    # Calc
                    # + i * 2 is for rounding errors
                    dt: int128 = convert(week_cursor - old_user_point.ts, int128)
                    balance_of: uint256 = convert(max(old_user_point.bias - dt * old_user_point.slope, 0), uint256)
                    if balance_of == 0 and user_epoch > max_user_epoch:
                        break
                    if balance_of > 0:
                        to_distribute += balance_of * self.tokens_per_week[week_cursor] / self.ve_supply[week_cursor]

                    week_cursor += WEEK

            user_epoch = min(max_user_epoch, user_epoch - 1)
            self.user_epoch_of[addr] = user_epoch
            self.time_cursor_of[addr] = week_cursor

            log Claimed(addr, to_distribute, user_epoch, max_user_epoch)

            return to_distribute

        @external
        @nonreentrant('lock')
        def claim_many(_receivers: address[20]) -> bool:
            """
            @notice Make multiple fee claims in a single call
            @dev Used to claim for many accounts at once, or to make
                multiple claims for the same address when that address
                has significant veCRV history
            @param _receivers List of addresses to claim for. Claiming
                            terminates at the first `ZERO_ADDRESS`.
            @return bool success
            """
            assert not self.is_killed

            if block.timestamp >= self.time_cursor:
                self._checkpoint_total_supply()

            last_token_time: uint256 = self.last_token_time

            if self.can_checkpoint_token and (block.timestamp > last_token_time + TOKEN_CHECKPOINT_DEADLINE):
                self._checkpoint_token()
                last_token_time = block.timestamp

            last_token_time = last_token_time / WEEK * WEEK
            voting_escrow: address = self.voting_escrow
            token: address = self.token
            total: uint256 = 0

            for addr in _receivers:
                if addr == ZERO_ADDRESS:
                    break

                amount: uint256 = self._claim(addr, voting_escrow, last_token_time)
                if amount != 0:
                    assert ERC20(token).transfer(addr, amount)
                    total += amount

            if total != 0:
                self.token_last_balance -= total

            return True
        ```

    === "Example"
        ```shell
        >>> GaugeController.claim_many()
        'True'
        ```

## Killing The Fee Distributor

### `is_killed`
!!! description "`FeeDistributor.is_killed() -> bool: view`"

    Getter method to check if the fee distributor contract is killed. Consequences for killing the contract: [here](#kill_me).

    Returns: true or flase (`bool`).

    ??? quote "Source code"

        ```python hl_lines="1"
        is_killed: public(bool)
        ```

    === "Example"
        ```shell
        >>> GaugeController.is_killed()
        'false'
        ```


### `kill_me`
!!! description "`FeeDistributor.kill_me() -> bool: view`"

    Function to kill the fee distributor contract.

    Returns: true or flase (`bool`).

    <mark style="background-color: #FFD580; color: black">Killing transfers the entire 3CRV balance to the [emergency return address](#emergency_return) and blocks the ability to claim or burn.   
    The contract cannot be unkilled.</mark>


    ??? quote "Source code"

        ```python hl_lines="4"
        is_killed: public(bool)

        @external
        def kill_me():
            """
            @notice Kill the contract
            @dev Killing transfers the entire 3CRV balance to the emergency return address
                and blocks the ability to claim or burn. The contract cannot be unkilled.
            """
            assert msg.sender == self.admin

            self.is_killed = True

            token: address = self.token
            assert ERC20(token).transfer(self.emergency_return, ERC20(token).balanceOf(self))
        ```

    === "Example"
        ```shell
        >>> GaugeController.kill_me()
        ```



### `emergency_return`
!!! description "`FeeDistributor.kill_me() -> bool: view`"

    Getter for the [emergency return address](https://etherscan.io/address/0x00669DF67E4827FCc0E48A1838a8d5AB79281909). See more [here](../ownership-proxy/Agents.md).

    Returns: emergency return (`address`).

    ??? quote "Source code"

        ```python hl_lines="1"
        emergency_return: public(address)
        ```

    === "Example"
        ```shell
        >>> GaugeController.emergency_return()
        '0x00669DF67E4827FCc0E48A1838a8d5AB79281909'
        ```


### `recover_balance`
!!! description "`FeeDistributor.recover_balance(_coin: address) -> bool:`"

    Function to return ERC20 tokens from this contract. `_coin` is sent to the [emergency return address](#emergency_return).


    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_coin` |  `address` | Coin Address to recover |

    ??? quote "Source code"

        ```python hl_lines="2"
        @external
        def recover_balance(_coin: address) -> bool:
            """
            @notice Recover ERC20 tokens from this contract
            @dev Tokens are sent to the emergency return address.
            @param _coin Token address
            @return bool success
            """
            assert msg.sender == self.admin
            assert _coin != self.token

            amount: uint256 = ERC20(_coin).balanceOf(self)
            response: Bytes[32] = raw_call(
                _coin,
                concat(
                    method_id("transfer(address,uint256)"),
                    convert(self.emergency_return, bytes32),
                    convert(amount, bytes32),
                ),
                max_outsize=32,
            )
            if len(response) != 0:
                assert convert(response, bool)

            return True
        ```

    === "Example"
        ```shell
        >>> GaugeController.recover_balance("0xd533a949740bb3306d119cc777fa900ba034cd52")
        'todo'
        ```



## **Admin Ownership**

### `admin`
!!! description "`FeeDistributor.admin() -> address: view`"

    Getter for the admin of the contract.

    Returns: `address` of the admin of the contract.

    ??? quote "Source code"

        ```python hl_lines="1"
        admin: public(address)
        ```

    === "Example"
        ```shell
        >>> GaugeController.admin()
        '0x40907540d8a6C65c637785e8f8B742ae6b0b9968'
        ```

    !!!note
        Admin address can be changed by the current admin by calling [commit_admin](#commit_admin) and [apply_admin](#apply_admin).


### `future_admin`
!!! description "`FeeDistributor.future_admin() -> address: view`"

    Getter for the future admin of the contract.

    Returns: `address` of the admin of the contract.

    ??? quote "Source code"

        ```python hl_lines="1"
        future_admin: public(address)
        ```

    === "Example"
        ```shell
        >>> GaugeController.future_admin()
        '0x0000000000000000000000000000000000000000'
        ```


### `commit_admin`
!!! description "`FeeDistributor.commit_admin(_addr: address):`"

    Function to commit transfer of the ownership.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_addr` |  `address` | Address to transfer ownership to |

    ??? quote "Source code"

        ```python hl_lines="1 8"
        event CommitAdmin:
            admin: address

        admin: public(address)
        future_admin: public(address)

        @external
        def commit_admin(_addr: address):
            """
            @notice Commit transfer of ownership
            @param _addr New admin address
            """
            assert msg.sender == self.admin  # dev: access denied
            self.future_admin = _addr
            log CommitAdmin(_addr)
        ```

    === "Example"
        ```shell
        >>> GaugeController.commit_admin("todo")
        'todo'
        ```


### `apply_admin`
!!! description "`FeeDistributor.apply_admin():`"

    Function to apply transfer of the ownership.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_addr` |  `address` | Address to transfer ownership to |

    ??? quote "Source code"

        ```python hl_lines="1 8"
        event ApplyAdmin:
            admin: address

        admin: public(address)
        future_admin: public(address)

        @external
        def apply_admin():
            """
            @notice Apply transfer of ownership
            """
            assert msg.sender == self.admin
            assert self.future_admin != ZERO_ADDRESS
            future_admin: address = self.future_admin
            self.admin = future_admin
            log ApplyAdmin(future_admin)
        ```

    === "Example"
        ```shell
        >>> GaugeController.apply_admin()
        'todo'
        ```












## **Query Contract Informations**

### `ve_for_at`
!!! description "`FeeDistributor.ve_for_at(_user: address, _timestamp: uint256) -> uint256:`"

    Getter for the veCRV balance for `_user` at `_timestamp`.

    Returns: veCRV balance (`uint256`).


    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_user` |  `address` | Address to query balance for|
    | `_timestamp` |  `uint256` | Epoch time |

    ??? quote "Source code"

        ```python hl_lines="0"
        @view
        @external
        def ve_for_at(_user: address, _timestamp: uint256) -> uint256:
            """
            @notice Get the veCRV balance for `_user` at `_timestamp`
            @param _user Address to query balance for
            @param _timestamp Epoch time
            @return uint256 veCRV balance
            """
            ve: address = self.voting_escrow
            max_user_epoch: uint256 = VotingEscrow(ve).user_point_epoch(_user)
            epoch: uint256 = self._find_timestamp_user_epoch(ve, _user, _timestamp, max_user_epoch)
            pt: Point = VotingEscrow(ve).user_point_history(_user, epoch)
            return convert(max(pt.bias - pt.slope * convert(_timestamp - pt.ts, int128), 0), uint256)
        ```

    === "Example"
        ```shell
        >>> GaugeController.ve_for_at("0x989AEb4d175e16225E39E87d0D97A3360524AD80", 1685972555)
        290896146145001156884162140
        ```

### `start_time`
!!! description "`FeeDistributor.start_time() -> uint256: view`"

    Getter for the epoch time for fee distribution to start.

    Returns: epoch time (`uint256`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_user` |  `address` | Address to query balance for|
    | `_timestamp` |  `uint256` | Epoch time |

    ??? quote "Source code"

        ```python hl_lines="1 6 14 20 21"
        start_time: public(uint256)

        @external
        def __init__(
            _voting_escrow: address,
            _start_time: uint256,
            _token: address,
            _admin: address,
            _emergency_return: address
        ):
            """
            @notice Contract constructor
            @param _voting_escrow VotingEscrow contract address
            @param _start_time Epoch time for fee distribution to start
            @param _token Fee token address (3CRV)
            @param _admin Admin address
            @param _emergency_return Address to transfer `_token` balance to
                                    if this contract is killed
            """
            t: uint256 = _start_time / WEEK * WEEK
            self.start_time = t
            self.last_token_time = t
            self.time_cursor = t
            self.token = _token
            self.voting_escrow = _voting_escrow
            self.admin = _admin
            self.emergency_return = _emergency_return
        ```

    === "Example"
        ```shell
        >>> GaugeController.start_time()
        1600300800
        ```

### `time_cursor (WHAT IS THIS)`
### `time_cursor_of (what is this)`

### `user_epoch_of`
!!! description "`FeeDistributor.user_epoch_of(arg0: address) -> uint256: view`"

    todo

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `arg0` |  `address` | Address |

    ??? quote "Source code"

        ```python hl_lines="1"
        user_epoch_of: public(HashMap[address, uint256])
        ```

    === "Example"
        ```shell
        >>> GaugeController.user_epoch_of("0x989AEb4d175e16225E39E87d0D97A3360524AD80")
        7739
        ```


### `voting_escrow`
!!! description "`FeeDistributor.voting_escrow() -> address: view`"

    Getter for fee token address.

    Returns: voting-escrow (`address`).

    ??? quote "Source code"

        ```python hl_lines="1 5 13 25"
        voting_escrow: public(address)

        @external
        def __init__(
            _voting_escrow: address,
            _start_time: uint256,
            _token: address,
            _admin: address,
            _emergency_return: address
        ):
            """
            @notice Contract constructor
            @param _voting_escrow VotingEscrow contract address
            @param _start_time Epoch time for fee distribution to start
            @param _token Fee token address (3CRV)
            @param _admin Admin address
            @param _emergency_return Address to transfer `_token` balance to
                                    if this contract is killed
            """
            t: uint256 = _start_time / WEEK * WEEK
            self.start_time = t
            self.last_token_time = t
            self.time_cursor = t
            self.token = _token
            self.voting_escrow = _voting_escrow
            self.admin = _admin
            self.emergency_return = _emergency_return
        ```

    === "Example"
        ```shell
        >>> GaugeController.voting_escrow()
        '0x5f3b5DfEb7B28CDbD7FAba78963EE202a494e2A2'
        ```

### `token`
!!! description "`FeeDistributor.token() -> address: view`"

    Getter for fee token address.

    Returns: fee token (`address`).

    ??? quote "Source code"

        ```python hl_lines="1 7 15 24"
        token: public(address)

        @external
        def __init__(
            _voting_escrow: address,
            _start_time: uint256,
            _token: address,
            _admin: address,
            _emergency_return: address
        ):
            """
            @notice Contract constructor
            @param _voting_escrow VotingEscrow contract address
            @param _start_time Epoch time for fee distribution to start
            @param _token Fee token address (3CRV)
            @param _admin Admin address
            @param _emergency_return Address to transfer `_token` balance to
                                    if this contract is killed
            """
            t: uint256 = _start_time / WEEK * WEEK
            self.start_time = t
            self.last_token_time = t
            self.time_cursor = t
            self.token = _token
            self.voting_escrow = _voting_escrow
            self.admin = _admin
            self.emergency_return = _emergency_return
        ```

    === "Example"
        ```shell
        >>> GaugeController.token()
        '0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490'
        ```

### `ve_supply`
### `can_checkpoint_token`
### `token_last_balance`
### `total_recieved (why is this variable in the contract? does nothing?)`
### `last_token_time (what is this)`
### `tokens_per_week` (what is this)


## **WRITE FUNCTIONS (HOW TO CALL THIS)**

### `checkpoint_token`
### `checkpoint_total_supply`
### `burn`
### `toggle_allow_checkpoint_token`