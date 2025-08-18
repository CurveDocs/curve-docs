!!!deploy "Source Code"
    Source code of the LiquidityGaugeV1 can be found on [Github](https://github.com/curvefi/curve-dao-contracts/blob/master/contracts/gauges/LiquidityGauge.vy).
    The following view methods and functions are using the [3pool](https://etherscan.io/address/0xbebc44782c7db0a1a60cb6fe97d0b483032ff1c7) as an example.  



# **Deposit and Withdrawals**
### `deposit`
!!! description "`LiquidityGauge.deposit(_value: uint256, addr: address = msg.sender):`"

    Function to deposit `_value` amount of LP tokens into the gauge.

    Emits: `Deposit`

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_value` |  `uint256` | Amount of tokens to deposit |
    | `addr` |  `address` | Address to deposit for. Defaults to `msg.sender` |

    !!!warning
        Prior to depositing, ensure that the gauge has been approved to transfer `amount` LP tokens on behalf of the caller (see [`set_approve_deposit`](#set_approve_deposit)).

    ??? quote "Source code"

        ```vyper hl_lines="1 10 29 31"
        event Deposit:
            provider: indexed(address)
            value: uint256

        # caller -> recipient -> can deposit?
        approved_to_deposit: public(HashMap[address, HashMap[address, bool]])

        @external
        @nonreentrant('lock')
        def deposit(_value: uint256, addr: address = msg.sender):
            """
            @notice Deposit `_value` LP tokens
            @param _value Number of tokens to deposit
            @param addr Address to deposit for
            """
            if addr != msg.sender:
                assert self.approved_to_deposit[msg.sender][addr], "Not approved"

            self._checkpoint(addr)

            if _value != 0:
                _balance: uint256 = self.balanceOf[addr] + _value
                _supply: uint256 = self.totalSupply + _value
                self.balanceOf[addr] = _balance
                self.totalSupply = _supply

                self._update_liquidity_limit(addr, _balance, _supply)

                assert ERC20(self.lp_token).transferFrom(msg.sender, self, _value)

            log Deposit(addr, _value)
        ```

    === "Example"

        ```shell
        >>> LiquidityGauge.deposit("todo"):
        todo
        ```


### `withdraw`
!!! description "`LiquidityGauge.withdraw(_value: uint256):`"

    Function to withdraw `_value` LP tokens from the gauge.

    Emits: `Withdraw`

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_value` |  `uint256` | Amount of tokens to withdraw |


    ??? quote "Source code"

        ```vyper hl_lines="1 7 23"
        event Withdraw:
            provider: indexed(address)
            value: uint256

        @external
        @nonreentrant('lock')
        def withdraw(_value: uint256):
            """
            @notice Withdraw `_value` LP tokens
            @param _value Number of tokens to withdraw
            """
            self._checkpoint(msg.sender)

            _balance: uint256 = self.balanceOf[msg.sender] - _value
            _supply: uint256 = self.totalSupply - _value
            self.balanceOf[msg.sender] = _balance
            self.totalSupply = _supply

            self._update_liquidity_limit(msg.sender, _balance, _supply)

            assert ERC20(self.lp_token).transfer(msg.sender, _value)

            log Withdraw(msg.sender, _value)
        ```

    === "Example"

        ```shell
        >>> LiquidityGauge.withdraw("todo"):
        todo
        ```


### `approved_to_deposit`
!!! description "`LiquidityGauge.approved_to_deposit(arg0: address, arg1: address) -> bool: view`"

    Getter method to check if address `arg0` is approved to deposit for address `arg1`. Can be modified by calling [`set_approve_deposit`](#set_approve_deposit).

    Returns: true or flase (`bool`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `arg0` |  `address` | Caller |
    | `arg1` |  `address` | Recipient |


    ??? quote "Source code"

        ```vyper hl_lines="2 11"
        # caller -> recipient -> can deposit?
        approved_to_deposit: public(HashMap[address, HashMap[address, bool]])

        @external
        def set_approve_deposit(addr: address, can_deposit: bool):
            """
            @notice Set whether `addr` can deposit tokens for `msg.sender`
            @param addr Address to set approval on
            @param can_deposit bool - can this account deposit for `msg.sender`?
            """
            self.approved_to_deposit[addr][msg.sender] = can_deposit

        ```

    === "Example"

        ```shell
        >>> LiquidityGauge.approved_to_deposit(todo):
        todo
        ```


### `set_approve_deposit`
!!! description "`LiquidityGauge.set_approve_deposit(addr: address, can_deposit: bool):`"

    Function to approve or revoke premission for address (`arg0`) to deposit into the gauge on behalf of the caller.

    | Input      | Type   | Description |
    | ----------- | -------| ---------|
    | `addr` |  `address` | Address to set approval for |
    | `can_deposit` |  `bool` | true or false |


    ??? quote "Source code"

        ```vyper hl_lines="2 5 11"
        # caller -> recipient -> can deposit?
        approved_to_deposit: public(HashMap[address, HashMap[address, bool]])

        @external
        def set_approve_deposit(addr: address, can_deposit: bool):
            """
            @notice Set whether `addr` can deposit tokens for `msg.sender`
            @param addr Address to set approval on
            @param can_deposit bool - can this account deposit for `msg.sender`?
            """
            self.approved_to_deposit[addr][msg.sender] = can_deposit

        ```

    === "Example"

        ```shell
        >>> LiquidityGauge.set_approve_deposit(todo):
        todo
        ```



## **Contract Info Methods**

### `minter`
!!! description "`LiquidityGauge.minter() -> address: view`"

    Getter for the minter contract address.

    Returns: minter contract (`address`).

    ??? quote "Source code"

        ```vyper hl_lines="1 6 9 20"
        interface Minter:
            def token() -> address: view
            def controller() -> address: view
            def minted(user: address, gauge: address) -> uint256: view

        minter: public(address)

        @external
        def __init__(lp_addr: address, _minter: address):
            """
            @notice Contract constructor
            @param lp_addr Liquidity Pool contract address
            @param _minter Minter contract address
            """

            assert lp_addr != ZERO_ADDRESS
            assert _minter != ZERO_ADDRESS

            self.lp_token = lp_addr
            self.minter = _minter
            crv_addr: address = Minter(_minter).token()
            self.crv_token = crv_addr
            controller_addr: address = Minter(_minter).controller()
            self.controller = controller_addr
            self.voting_escrow = Controller(controller_addr).voting_escrow()
            self.period_timestamp[0] = block.timestamp
            self.inflation_rate = CRV20(crv_addr).rate()
            self.future_epoch_time = CRV20(crv_addr).future_epoch_time_write()
        ```

    === "Example"

        ```shell
        >>> LiquidityGauge.minter():
        '0xd061D61a4d941c39E5453435B6345Dc261C2fcE0'
        ```


### `crv_token`
!!! description "`LiquidityGauge.crv_token() -> address: view`"

    Getter for the CRV token address.

    Returns: CRV token (`address`).

    ??? quote "Source code"

        ```vyper hl_lines="1 15 16"
        crv_token: public(address)

        @external
        def __init__(lp_addr: address, _minter: address):
            """
            @notice Contract constructor
            @param lp_addr Liquidity Pool contract address
            @param _minter Minter contract address
            """

            assert lp_addr != ZERO_ADDRESS
            assert _minter != ZERO_ADDRESS
            self.lp_token = lp_addr
            self.minter = _minter
            crv_addr: address = Minter(_minter).token()
            self.crv_token = crv_addr
            controller_addr: address = Minter(_minter).controller()
            self.controller = controller_addr
            self.voting_escrow = Controller(controller_addr).voting_escrow()
            self.period_timestamp[0] = block.timestamp
            self.inflation_rate = CRV20(crv_addr).rate()
            self.future_epoch_time = CRV20(crv_addr).future_epoch_time_write()
        ```

    === "Example"

        ```shell
        >>> LiquidityGauge.crv_token():
        '0xD533a949740bb3306d119CC777fa900bA034cd52'
        ```


### `lp_token`
!!! description "`LiquidityGauge.lp_token() -> address: view`"

    Getter for the lp token of the liquidity pool.

    Returns: lp token (`address`).

    ??? quote "Source code"

        ```vyper hl_lines="1 4 13"
        lp_token: public(address)

        @external
        def __init__(lp_addr: address, _minter: address):
            """
            @notice Contract constructor
            @param lp_addr Liquidity Pool contract address
            @param _minter Minter contract address
            """

            assert lp_addr != ZERO_ADDRESS
            assert _minter != ZERO_ADDRESS
            self.lp_token = lp_addr
            self.minter = _minter
            crv_addr: address = Minter(_minter).token()
            self.crv_token = crv_addr
            controller_addr: address = Minter(_minter).controller()
            self.controller = controller_addr
            self.voting_escrow = Controller(controller_addr).voting_escrow()
            self.period_timestamp[0] = block.timestamp
            self.inflation_rate = CRV20(crv_addr).rate()
            self.future_epoch_time = CRV20(crv_addr).future_epoch_time_write()
        ```

    === "Example"

        ```shell
        >>> LiquidityGauge.lp_token():
        '0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490'
        ```


### `controller`
!!! description "`LiquidityGauge.controller() -> address: view`"

    Getter for the gauge controller contract.

    Returns: gauge controller contract (`address`).

    ??? quote "Source code"

        ```vyper hl_lines="1 17 18"
        controller: public(address)

        @external
        def __init__(lp_addr: address, _minter: address):
            """
            @notice Contract constructor
            @param lp_addr Liquidity Pool contract address
            @param _minter Minter contract address
            """

            assert lp_addr != ZERO_ADDRESS
            assert _minter != ZERO_ADDRESS
            self.lp_token = lp_addr
            self.minter = _minter
            crv_addr: address = Minter(_minter).token()
            self.crv_token = crv_addr
            controller_addr: address = Minter(_minter).controller()
            self.controller = controller_addr
            self.voting_escrow = Controller(controller_addr).voting_escrow()
            self.period_timestamp[0] = block.timestamp
            self.inflation_rate = CRV20(crv_addr).rate()
            self.future_epoch_time = CRV20(crv_addr).future_epoch_time_write()
        ```

    === "Example"

        ```shell
        >>> LiquidityGauge.controller():
        '0x2F50D538606Fa9EDD2B11E2446BEb18C9D5846bB'
        ```


### `voting_escorw`
!!! description "`LiquidityGauge.voting_escrow() -> address: view`"

    Getter for the voting-escrow token.

    Returns: voting-escorw contract (`address`).

    ??? quote "Source code"

        ```vyper hl_lines="1 19"
        controller: public(address)

        @external
        def __init__(lp_addr: address, _minter: address):
            """
            @notice Contract constructor
            @param lp_addr Liquidity Pool contract address
            @param _minter Minter contract address
            """

            assert lp_addr != ZERO_ADDRESS
            assert _minter != ZERO_ADDRESS
            self.lp_token = lp_addr
            self.minter = _minter
            crv_addr: address = Minter(_minter).token()
            self.crv_token = crv_addr
            controller_addr: address = Minter(_minter).controller()
            self.controller = controller_addr
            self.voting_escrow = Controller(controller_addr).voting_escrow()
            self.period_timestamp[0] = block.timestamp
            self.inflation_rate = CRV20(crv_addr).rate()
            self.future_epoch_time = CRV20(crv_addr).future_epoch_time_write()
        ```

    === "Example"

        ```shell
        >>> LiquidityGauge.voting_escrow():
        '0x5f3b5DfEb7B28CDbD7FAba78963EE202a494e2A2'
        ```


### `totalSupply`
!!! description "`LiquidityGauge.totalSupply() -> uint256: view`"

    Getter for the total supply of the lp token.

    Returns: total lp token supply (`uint256`).

    ??? quote "Source code"

        ```vyper hl_lines="1"
        totalSupply: public(uint256)
        ```

    === "Example"

        ```shell
        >>> LiquidityGauge.totalSupply("0xbFcF63294aD7105dEa65aA58F8AE5BE2D9d0952A"):
        65985808419713952815628623
        ```


### `future_epoch_time`
!!! description "`LiquidityGauge.future_epoch_time() -> uint256: view`"

    Getter for the future epoch time.

    Returns: future epoch timestamp (`uint256`).

    ??? quote "Source code"

        === "LiquidityGauge.vy"

            ```vyper hl_lines="2 5 26"
            interface CRV20:
                def future_epoch_time_write() -> uint256: nonpayable
                def rate() -> uint256: view

            future_epoch_time: public(uint256)

            @external
            def __init__(lp_addr: address, _minter: address):
                """
                @notice Contract constructor
                @param lp_addr Liquidity Pool contract address
                @param _minter Minter contract address
                """

                assert lp_addr != ZERO_ADDRESS
                assert _minter != ZERO_ADDRESS
                self.lp_token = lp_addr
                self.minter = _minter
                crv_addr: address = Minter(_minter).token()
                self.crv_token = crv_addr
                controller_addr: address = Minter(_minter).controller()
                self.controller = controller_addr
                self.voting_escrow = Controller(controller_addr).voting_escrow()
                self.period_timestamp[0] = block.timestamp
                self.inflation_rate = CRV20(crv_addr).rate()
                self.future_epoch_time = CRV20(crv_addr).future_epoch_time_write()
            ```

        === "ERC20CRV.vy"

            ```vyper hl_lines="2 11 13"
            @external
            def future_epoch_time_write() -> uint256:
                """
                @notice Get timestamp of the next mining epoch start
                        while simultaneously updating mining parameters
                @return Timestamp of the next epoch
                """
                _start_epoch_time: uint256 = self.start_epoch_time
                if block.timestamp >= _start_epoch_time + RATE_REDUCTION_TIME:
                    self._update_mining_parameters()
                    return self.start_epoch_time + RATE_REDUCTION_TIME
                else:
                    return _start_epoch_time + RATE_REDUCTION_TIME
            ```

    === "Example"
        ```shell
        >>> LiquidityGauge.future_epoch_time():
        1691965048
        ```


### `working_supply`
!!! description "`LiquidityGauge.working_supply() -> uint256: view`"

    Getter for the working supply.

    Returns: working supply (`uint256`).

    ??? quote "Source code"

        ```vyper hl_lines="1"
        working_supply: public(uint256)
        ```

    === "Example"

        ```shell
        >>> LiquidityGauge.working_supply():
        14075488199397914414391174
        ```


### `period`
!!! description "`LiquidityGauge.period() -> int128: view`"

    Getter for the current period. This variable is updated whenever `_checkpoint` function is called.

    Returns: period (`int128`).

    ??? quote "Source code"

        ```vyper hl_lines="2 10 68 69"
        interface Controller:
            def period() -> int128: view
            def period_write() -> int128: nonpayable
            def period_timestamp(p: int128) -> uint256: view
            def gauge_relative_weight(addr: address, time: uint256) -> uint256: view
            def voting_escrow() -> address: view
            def checkpoint(): nonpayable
            def checkpoint_gauge(addr: address): nonpayable

        period: public(int128)

        @internal
        def _checkpoint(addr: address):
            """
            @notice Checkpoint for a user
            @param addr User address
            """
            _token: address = self.crv_token
            _controller: address = self.controller
            _period: int128 = self.period
            _period_time: uint256 = self.period_timestamp[_period]
            _integrate_inv_supply: uint256 = self.integrate_inv_supply[_period]
            rate: uint256 = self.inflation_rate
            new_rate: uint256 = rate
            prev_future_epoch: uint256 = self.future_epoch_time
            if prev_future_epoch >= _period_time:
                self.future_epoch_time = CRV20(_token).future_epoch_time_write()
                new_rate = CRV20(_token).rate()
                self.inflation_rate = new_rate
            Controller(_controller).checkpoint_gauge(self)

            _working_balance: uint256 = self.working_balances[addr]
            _working_supply: uint256 = self.working_supply

            # Update integral of 1/supply
            if block.timestamp > _period_time:
                prev_week_time: uint256 = _period_time
                week_time: uint256 = min((_period_time + WEEK) / WEEK * WEEK, block.timestamp)

                for i in range(500):
                    dt: uint256 = week_time - prev_week_time
                    w: uint256 = Controller(_controller).gauge_relative_weight(self, prev_week_time / WEEK * WEEK)

                    if _working_supply > 0:
                        if prev_future_epoch >= prev_week_time and prev_future_epoch < week_time:
                            # If we went across one or multiple epochs, apply the rate
                            # of the first epoch until it ends, and then the rate of
                            # the last epoch.
                            # If more than one epoch is crossed - the gauge gets less,
                            # but that'd meen it wasn't called for more than 1 year
                            _integrate_inv_supply += rate * w * (prev_future_epoch - prev_week_time) / _working_supply
                            rate = new_rate
                            _integrate_inv_supply += rate * w * (week_time - prev_future_epoch) / _working_supply
                        else:
                            _integrate_inv_supply += rate * w * dt / _working_supply
                        # On precisions of the calculation
                        # rate ~= 10e18
                        # last_weight > 0.01 * 1e18 = 1e16 (if pool weight is 1%)
                        # _working_supply ~= TVL * 1e18 ~= 1e26 ($100M for example)
                        # The largest loss is at dt = 1
                        # Loss is 1e-9 - acceptable

                    if week_time == block.timestamp:
                        break
                    prev_week_time = week_time
                    week_time = min(week_time + WEEK, block.timestamp)

            _period += 1
            self.period = _period
            self.period_timestamp[_period] = block.timestamp
            self.integrate_inv_supply[_period] = _integrate_inv_supply

            # Update user-specific integrals
            self.integrate_fraction[addr] += _working_balance * (_integrate_inv_supply - self.integrate_inv_supply_of[addr]) / 10 ** 18
            self.integrate_inv_supply_of[addr] = _integrate_inv_supply
            self.integrate_checkpoint_of[addr] = block.timestamp
        ```

    === "Example"
        ```shell
        >>> LiquidityGauge.period():
        59149
        ```


### `period_timestamp`
!!! description "`LiquidityGauge.period_timestamp(arg0: uint256) -> uint256: view`"

    Getter for timestamp of period `arg0`.

    Returns: period timestamp (`uint256`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `arg0` |  `uint256` | Period (`period`) |

    ??? quote "Source code"

        ```vyper hl_lines="1 21"
        period_timestamp: public(uint256[100000000000000000000000000000])

        @external
        def __init__(lp_addr: address, _minter: address):
            """
            @notice Contract constructor
            @param lp_addr Liquidity Pool contract address
            @param _minter Minter contract address
            """

            assert lp_addr != ZERO_ADDRESS
            assert _minter != ZERO_ADDRESS

            self.lp_token = lp_addr
            self.minter = _minter
            crv_addr: address = Minter(_minter).token()
            self.crv_token = crv_addr
            controller_addr: address = Minter(_minter).controller()
            self.controller = controller_addr
            self.voting_escrow = Controller(controller_addr).voting_escrow()
            self.period_timestamp[0] = block.timestamp
            self.inflation_rate = CRV20(crv_addr).rate()
            self.future_epoch_time = CRV20(crv_addr).future_epoch_time_write()
        ```

    === "Example"
        ```shell
        >>> LiquidityGauge.period_timestamp(59149):
        1694408003
        ```


### `inflation_rate`
!!! description "`LiquidityGauge.inflation_rate() -> uint256: view`"

    Getter for the current inflation rate.

    Returns: rate (`uint256`).

    ??? quote "Source code"

        ```vyper hl_lines="3 5 25"
        interface CRV20:
            def future_epoch_time_write() -> uint256: nonpayable
            def rate() -> uint256: view

        inflation_rate: public(uint256)

        @external
        def __init__(lp_addr: address, _minter: address):
            """
            @notice Contract constructor
            @param lp_addr Liquidity Pool contract address
            @param _minter Minter contract address
            """

            assert lp_addr != ZERO_ADDRESS
            assert _minter != ZERO_ADDRESS
            self.lp_token = lp_addr
            self.minter = _minter
            crv_addr: address = Minter(_minter).token()
            self.crv_token = crv_addr
            controller_addr: address = Minter(_minter).controller()
            self.controller = controller_addr
            self.voting_escrow = Controller(controller_addr).voting_escrow()
            self.period_timestamp[0] = block.timestamp
            self.inflation_rate = CRV20(crv_addr).rate()
            self.future_epoch_time = CRV20(crv_addr).future_epoch_time_write()
        ```

    === "Example"
        ```shell
        >>> LiquidityGauge.inflation_rate():
        5181574864521283150
        ```



# **User Info Methods**
### `balanceOf`
!!! description "`LiquidityGauge.balaceOf(arg0: address) -> uint256: view`"

    Getter method for the current amount of LP tokens that `addr` has deposited into the gauge.

    Returns: amount (`uint256`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `arg0` |  `address` | User Address |

    ??? quote "Source code"

        ```vyper hl_lines="1"
        balanceOf: public(HashMap[address, uint256])
        ```

    === "Example"

        ```shell
        >>> LiquidityGauge.balanceOf("0x989AEb4d175e16225E39E87d0D97A3360524AD80"):
        50886648043543826932228778
        ```


### `working_balances` (more on this)
!!! description "`LiquidityGauge.working_balances(arg0: address) -> uint256: view`"

    Getter for the working balance of user `arg0`. 

    Returns: working balance (`uint256`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `arg0` |  `address` | User Address |

    !!!tip
        Working balance essentially is the effective balance after the has been applied.

    ??? quote "Source code"

        ```vyper hl_lines="1"
        working_balances: public(HashMap[address, uint256])
        ```

    === "Example"

        ```shell
        >>> LiquidityGauge.working_balances("0x989AEb4d175e16225E39E87d0D97A3360524AD80"):
        50886648043543826932228778
        ```


# **Checkpoints**
### `user_checkpoint`
!!! description "`LiquidityGauge.user_checkpoint(addr: address) -> bool:`"

    Function to record a checkpoint for `addr` and therefore updating their boost.

    Returns: True (`bool`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `addr` |  `address` | Address |

    ??? quote "Source code"

        ```vyper hl_lines="2"
        @external
        def user_checkpoint(addr: address) -> bool:
            """
            @notice Record a checkpoint for `addr`
            @param addr User address
            @return bool success
            """
            assert (msg.sender == addr) or (msg.sender == self.minter)  # dev: unauthorized
            self._checkpoint(addr)
            self._update_liquidity_limit(addr, self.balanceOf[addr], self.totalSupply)
            return True
        ```

    !!!note 
        This function is only callable by `addr` or `Minter`. Checkpoint can not be triggered for another user.

    === "Example"

        ```shell
        >>> LiquidityGauge.user_checkpoint():
        `True`
        ```


### `kick`
!!! description "`LiquidityGauge.kick(addr: address):`"

    Function to kick address `addr` for abusing their boost.

    Returns: True (`bool`)

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `addr` |  `address` | Address to kick |

    ??? quote "Source code"

        ```vyper hl_lines="2"
        @external
        def kick(addr: address):
            """
            @notice Kick `addr` for abusing their boost
            @dev Only if either they had another voting event, or their voting escrow lock expired
            @param addr Address to kick
            """
            _voting_escrow: address = self.voting_escrow
            t_last: uint256 = self.integrate_checkpoint_of[addr]
            t_ve: uint256 = VotingEscrow(_voting_escrow).user_point_history__ts(
                addr, VotingEscrow(_voting_escrow).user_point_epoch(addr)
            )
            _balance: uint256 = self.balanceOf[addr]

            assert ERC20(self.voting_escrow).balanceOf(addr) == 0 or t_ve > t_last # dev: kick not allowed
            assert self.working_balances[addr] > _balance * TOKENLESS_PRODUCTION / 100  # dev: kick not needed

            self._checkpoint(addr)
            self._update_liquidity_limit(addr, self.balanceOf[addr], self.totalSupply)
            return True
        ```

    !!!warning
        This function is only callable when the current boost for `addr` is greater than it should be, due to an expired veCRV lock.

    === "Example"

        ```shell
        >>> LiquidityGauge.kick("0x989AEb4d175e16225E39E87d0D97A3360524AD80"):
        ```


### `integrate_fraction` (todo)
!!! description "`LiquidityGauge.integrate_fraction(arg0: address) -> uint256: view`"

    Getter for the integrate fraction.

    Returns: integrate fraction (`uint256`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `arg0` |  `address` | User Address |

    ??? quote "Source code"

        ```vyper hl_lines="3"
        # ∫(balance * rate(t) / totalSupply(t) dt) from 0 till checkpoint
        # Units: rate * t = already number of coins per address to issue
        integrate_fraction: public(HashMap[address, uint256])
        ```

    === "Example"

        ```shell
        >>> LiquidityGauge.integrate_fraction("0x989AEb4d175e16225E39E87d0D97A3360524AD80"):
        5072273980060388580494200
        ```


### `integrate_inv_supply` (todo)
!!! description "`LiquidityGauge.integrate_inv_supply(arg0: uint256) -> uint256: view`"

    Getter for the integrate inverse supply at period `arg0`.

    Returns: 

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `arg0` |  `address` | Address |

    ??? quote "Source code"

        ```vyper hl_lines="2"
        # 1e18 * ∫(rate(t) / totalSupply(t) dt) from 0 till checkpoint
        integrate_inv_supply: public(uint256[100000000000000000000000000000])  # bump epoch when rate() changes
        ```

    === "Example"

        ```shell
        >>> LiquidityGauge.integrate_inv_supply(59150):
        263323758930625247
        ```


### `integrate_inv_supply_of` (todo)
!!! description "`LiquidityGauge.integrate_inv_supply_of(arg0: address) -> uint256: view`"

    todo

    Returns: 

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `arg0` |  `address` | Address |

    ??? quote "Source code"

        ```vyper hl_lines="2"
        # 1e18 * ∫(rate(t) / totalSupply(t) dt) from (last_action) till checkpoint
        integrate_inv_supply_of: public(HashMap[address, uint256])
        ```

    === "Example"

        ```shell
        >>> LiquidityGauge.integrate_fraction("0x989AEb4d175e16225E39E87d0D97A3360524AD80"):
        263323758930625247
        ```


### `integrate_checkpoint_of` (todo)
!!! description "`LiquidityGauge.integrate_checkpoint_of(arg0: address) -> uint256: view`"

    todo

    Returns:

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `arg0` |  `address` | Address |

    ??? quote "Source code"

        ```vyper hl_lines="2"
        # 1e18 * ∫(rate(t) / totalSupply(t) dt) from (last_action) till checkpoint
        integrate_checkpoint_of: public(HashMap[address, uint256])
        ```

    === "Example"

        ```shell
        >>> LiquidityGauge.integrate_checkpoint_of("0x989AEb4d175e16225E39E87d0D97A3360524AD80"):
        1694408003
        ```
