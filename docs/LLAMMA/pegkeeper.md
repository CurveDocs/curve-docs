

**Architecture of PegKeppers**
p_s > 1: pegkeeper is allowed to mint uncollateralized stablecoin and (only!) deposit it signle-sided to the stableswap pool --> balance of crvusd in the pool goes up --> price of crvusd goes down. when depositing crvusd into the pool, pegkeeper receives lp tokens.

p_s < 1: when price of crvusd is smaller than 1 (balance of crvusd > balance of paired stablecoin), the peg keeper can withdraw crvusd and burn it. 


https://etherscan.io/address/0xaA346781dDD7009caa644A4980f044C50cD2ae22



## **Contract Info Methods**

### `factory`
!!! description "`PegKeeper.factory() -> address: view`"

    Getter for the address of the factory contract.

    Returns: factory contract (`address`).

    !!!note
        The `FACTORY` variable is **immutable**. It can not be changed.

    ??? quote "Source code"

        ```python hl_lines="1 4 5 11 35"
        FACTORY: immutable(address)

        @external
        def __init__(_pool: CurvePool, _index: uint256, _receiver: address, _caller_share: uint256, _factory: address, _aggregator: StableAggregator, _admin: address):
            """
            @notice Contract constructor
            @param _pool Contract pool address
            @param _index Index of the pegged
            @param _receiver Receiver of the profit
            @param _caller_share Caller's share of profit
            @param _factory Factory which should be able to take coins away
            @param _aggregator Price aggregator which shows the price of pegged in real "dollars"
            @param _admin Admin account
            """
            assert _index < 2
            POOL = _pool
            I = _index
            pegged: address = _pool.coins(_index)
            PEGGED = pegged
            ERC20(pegged).approve(_pool.address, max_value(uint256))
            ERC20(pegged).approve(_factory, max_value(uint256))

            PEG_MUL = 10 ** (18 - ERC20(_pool.coins(1 - _index)).decimals())

            self.admin = _admin
            assert _receiver != empty(address)
            self.receiver = _receiver
            log ApplyNewAdmin(msg.sender)
            log ApplyNewReceiver(_receiver)

            assert _caller_share <= SHARE_PRECISION  # dev: bad part value
            self.caller_share = _caller_share
            log SetNewCallerShare(_caller_share)

            FACTORY = _factory
            AGGREGATOR = _aggregator
            IS_INVERSE = (_index == 0)
        ```

    === "Example"

        ```shell
        >>> PegKepper.factory()
        '0xC9332fdCB1C491Dcc683bAe86Fe3cb70360738BC'
        ```


### `pegged`
!!! description "`PegKeeper.pegged() -> address: view`"

    Getter for the address of the pegged token (crvUSD). Pegged asset is determined by its index of the `pool`. Index value is stored in `I`. Pegkeepers only work for two-coin-pools (code checks: assert _index < 2).

    Returns: pegged token contract (`address`).

    !!!note
        The `PEGGED` variable is **immutable**. It can not be changed.

    ??? quote "Source code"

        ```python hl_lines="1 4 5 9 16 18 19 20"
        PEGGED: immutable(address)

        @external
        def __init__(_pool: CurvePool, _index: uint256, _receiver: address, _caller_share: uint256, _factory: address, _aggregator: StableAggregator, _admin: address):
            """
            @notice Contract constructor
            @param _pool Contract pool address
            @param _index Index of the pegged
            @param _receiver Receiver of the profit
            @param _caller_share Caller's share of profit
            @param _factory Factory which should be able to take coins away
            @param _aggregator Price aggregator which shows the price of pegged in real "dollars"
            @param _admin Admin account
            """
            assert _index < 2
            POOL = _pool
            I = _index
            pegged: address = _pool.coins(_index)
            PEGGED = pegged
            ERC20(pegged).approve(_pool.address, max_value(uint256))
            ERC20(pegged).approve(_factory, max_value(uint256))

            PEG_MUL = 10 ** (18 - ERC20(_pool.coins(1 - _index)).decimals())

            self.admin = _admin
            assert _receiver != empty(address)
            self.receiver = _receiver
            log ApplyNewAdmin(msg.sender)
            log ApplyNewReceiver(_receiver)

            assert _caller_share <= SHARE_PRECISION  # dev: bad part value
            self.caller_share = _caller_share
            log SetNewCallerShare(_caller_share)

            FACTORY = _factory
            AGGREGATOR = _aggregator
            IS_INVERSE = (_index == 0)
        ```

    === "Example"

        ```shell
        >>> PegKepper.pegged()
        '0xf939E0A03FB07F59A73314E73794Be0E57ac1b4E'
        ```


### `pool`
!!! description "`PegKeeper.pool() -> address: view`"

    Getter for the pool contract address.

    Returns: pool contract (`address`).

    !!!note
        The `POOL` variable is **immutable**. It can not be changed.

    ??? quote "Source code"

        ```python hl_lines="1 4 5 8 17"
        POOL: immutable(CurvePool)

        @external
        def __init__(_pool: CurvePool, _index: uint256, _receiver: address, _caller_share: uint256, _factory: address, _aggregator: StableAggregator, _admin: address):
            """
            @notice Contract constructor
            @param _pool Contract pool address
            @param _index Index of the pegged
            @param _receiver Receiver of the profit
            @param _caller_share Caller's share of profit
            @param _factory Factory which should be able to take coins away
            @param _aggregator Price aggregator which shows the price of pegged in real "dollars"
            @param _admin Admin account
            """
            assert _index < 2
            POOL = _pool
            I = _index
            pegged: address = _pool.coins(_index)
            PEGGED = pegged
            ERC20(pegged).approve(_pool.address, max_value(uint256))
            ERC20(pegged).approve(_factory, max_value(uint256))

            PEG_MUL = 10 ** (18 - ERC20(_pool.coins(1 - _index)).decimals())

            self.admin = _admin
            assert _receiver != empty(address)
            self.receiver = _receiver
            log ApplyNewAdmin(msg.sender)
            log ApplyNewReceiver(_receiver)

            assert _caller_share <= SHARE_PRECISION  # dev: bad part value
            self.caller_share = _caller_share
            log SetNewCallerShare(_caller_share)

            FACTORY = _factory
            AGGREGATOR = _aggregator
            IS_INVERSE = (_index == 0)
        ```

    === "Example"

        ```shell
        >>> PegKepper.pool()
        '0x4DEcE678ceceb27446b35C672dC7d61F30bAD69E'
        ```


### `aggregator`
!!! description "`PegKeeper.aggregator() -> address: view`"

    Getter for the price aggregator contract for crvUSD.

    Returns: price aggregator contract (`address`).

    !!!note
        The `AGGREGATOR` variable is **immutable**. It can not be changed.

    ??? quote "Source code"

        ```python hl_lines="1 4 5 12 36"
        AGGREGATOR: immutable(StableAggregator)

        @external
        def __init__(_pool: CurvePool, _index: uint256, _receiver: address, _caller_share: uint256, _factory: address, _aggregator: StableAggregator, _admin: address):
            """
            @notice Contract constructor
            @param _pool Contract pool address
            @param _index Index of the pegged
            @param _receiver Receiver of the profit
            @param _caller_share Caller's share of profit
            @param _factory Factory which should be able to take coins away
            @param _aggregator Price aggregator which shows the price of pegged in real "dollars"
            @param _admin Admin account
            """
            assert _index < 2
            POOL = _pool
            I = _index
            pegged: address = _pool.coins(_index)
            PEGGED = pegged
            ERC20(pegged).approve(_pool.address, max_value(uint256))
            ERC20(pegged).approve(_factory, max_value(uint256))

            PEG_MUL = 10 ** (18 - ERC20(_pool.coins(1 - _index)).decimals())

            self.admin = _admin
            assert _receiver != empty(address)
            self.receiver = _receiver
            log ApplyNewAdmin(msg.sender)
            log ApplyNewReceiver(_receiver)

            assert _caller_share <= SHARE_PRECISION  # dev: bad part value
            self.caller_share = _caller_share
            log SetNewCallerShare(_caller_share)

            FACTORY = _factory
            AGGREGATOR = _aggregator
            IS_INVERSE = (_index == 0)
        ```

    === "Example"

        ```shell
        >>> PegKepper.aggregator()
        '0xe5Afcf332a5457E8FafCD668BcE3dF953762Dfe7'
        ```



### `last_change` (!!)
!!! description "`PegKeeper.last_change() -> uint256: view`"

    Getter for the timestamp of the last chage of debt?? Gets updated when calling `update` (`_provide` or `_withdraw`).  
    Also relevant for the function to calculate the profit, as there is a required delay of 15 * 60, before calling it again.

    Returns: timestamp (`uint256`).

    ??? quote "Source code"

        ```python hl_lines="1 4 5 12 36"
        last_change: public(uint256)
        ```

    === "Example"

        ```shell
        >>> PegKepper.last_change()
        1688794235
        ```


### `debt`
!!! description "`PegKeeper.debt() -> uint256: view`"

    Getter for the stablecoin debt of the PegKeeper.

    Returns: debt (`uint256`).

    ??? quote "Source code"

        ```python hl_lines="1"
        debt: public(uint256)
        ```

    === "Example"

        ```shell
        >>> PegKepper.last_change()
        10569198033275719942044356
        ```


## **Calculating PegKeeper Profits and setting caller share**

### `calc_profit` (fix)
!!! description "`PegKeeper.calc_profit() -> uint256:`"

    Function to calculate the generated profit in LP tokens. There is a profit threshold of 10 LP tokens, correct and if yes, why?

    Returns: generated profit (`uint256`).

    ??? quote "Source code"

        ```python hl_lines="3 16 21"
        PRECISION: constant(uint256) = 10 ** 18
        # Calculation error for profit
        PROFIT_THRESHOLD: constant(uint256) = 10 ** 18

        @internal
        @view
        def _calc_profit() -> uint256:
            lp_balance: uint256 = POOL.balanceOf(self)

            virtual_price: uint256 = POOL.get_virtual_price()
            lp_debt: uint256 = self.debt * PRECISION / virtual_price + PROFIT_THRESHOLD

            if lp_balance <= lp_debt:
                return 0
            else:
                return lp_balance - lp_debt

        @external
        @view
        def calc_profit() -> uint256:
            """
            @notice Calculate generated profit in LP tokens
            @return Amount of generated profit
            """
            return self._calc_profit()
        ```

    === "Example"

        ```shell
        >>> PegKepper.calc_profit()
        0
        ```


### `estimate_caller_profit` (fix: why the delay?)
!!! description "`PegKeeper.estimate_caller_profit() -> uint256:`"

    Function to estimate profit from calling [update()](#update). There is a required delay of 15 minutes in between calling this function. If the function is called before the 15 minutes passed, it will return 0. Caller up `update` will receiver 20% of the profits.
    balance_pegged = crvusd  
    balance_peg = other coin  
    PEG_MUL = decimals of other coin
    --> does some calc to have both coins with the save decimals.

    Returns: expected amount of profit going to the caller (`uint256`).

    !!! warning
        This method is not precise. The real profit is always higher because of the increasing virtual price of the LP token.

    ??? quote "Source code"

        ```python hl_lines="1 5"
        ACTION_DELAY: constant(uint256) = 15 * 60

        @external
        @view
        def estimate_caller_profit() -> uint256:
            """
            @notice Estimate profit from calling update()
            @dev This method is not precise, real profit is always more because of increasing virtual price
            @return Expected amount of profit going to beneficiary
            """
            if self.last_change + ACTION_DELAY > block.timestamp:
                return 0

            balance_pegged: uint256 = POOL.balances(I)
            balance_peg: uint256 = POOL.balances(1 - I) * PEG_MUL

            initial_profit: uint256 = self._calc_profit()

            p_agg: uint256 = AGGREGATOR.price()  # Current USD per stablecoin

            # Checking the balance will ensure no-loss of the stabilizer, but to ensure stabilization
            # we need to exclude "bad" p_agg, so we add an extra check for it

            new_profit: uint256 = 0
            if balance_peg > balance_pegged:
                if p_agg < 10**18:
                    return 0
                new_profit = self._calc_future_profit((balance_peg - balance_pegged) / 5, True)  # this dumps stablecoin

            else:
                if p_agg > 10**18:
                    return 0
                new_profit = self._calc_future_profit((balance_pegged - balance_peg) / 5, False)  # this pumps stablecoin

            if new_profit < initial_profit:
                return 0
            lp_amount: uint256 = new_profit - initial_profit

            return lp_amount * self.caller_share / SHARE_PRECISION
        ```

    === "Example"

        ```shell
        >>> PegKepper.estimate_caller_profit()
        0
        ```


### `caller_share`
!!! description "`PegKeeper.caller_share() -> uint256: view`"

    Getter for the caller share of the generated profit when calling `update`. Share precision is set to 10^5.

    Returns: pool contract (`address`).

    !!!note
        The `POOL` variable is **immutable**. It can not be changed.

    ??? quote "Source code"

        ```python hl_lines="1 5 6 12 33 34 35"
        SHARE_PRECISION: constant(uint256) = 10 ** 5
        caller_share: public(uint256)

        @external
        def __init__(_pool: CurvePool, _index: uint256, _receiver: address, _caller_share: uint256, _factory: address, _aggregator: StableAggregator, _admin: address):
            """
            @notice Contract constructor
            @param _pool Contract pool address
            @param _index Index of the pegged
            @param _receiver Receiver of the profit
            @param _caller_share Caller's share of profit
            @param _factory Factory which should be able to take coins away
            @param _aggregator Price aggregator which shows the price of pegged in real "dollars"
            @param _admin Admin account
            """
            assert _index < 2
            POOL = _pool
            I = _index
            pegged: address = _pool.coins(_index)
            PEGGED = pegged
            ERC20(pegged).approve(_pool.address, max_value(uint256))
            ERC20(pegged).approve(_factory, max_value(uint256))

            PEG_MUL = 10 ** (18 - ERC20(_pool.coins(1 - _index)).decimals())

            self.admin = _admin
            assert _receiver != empty(address)
            self.receiver = _receiver
            log ApplyNewAdmin(msg.sender)
            log ApplyNewReceiver(_receiver)

            assert _caller_share <= SHARE_PRECISION  # dev: bad part value
            self.caller_share = _caller_share
            log SetNewCallerShare(_caller_share)

            FACTORY = _factory
            AGGREGATOR = _aggregator
            IS_INVERSE = (_index == 0)
        ```

    === "Example"

        ```shell
        >>> PegKepper.caller_share()
        20000
        ```


### `set_new_caller_share`
!!! description "`PegKeeper.set_new_caller_share(_new_caller_share: uint256):`"

    Function to update the caller share. Caller share exists to incentivise users to call the `update` function.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_new_caller_share` |  `uint256` | New caller share |

    !!!note
        This function can only be called by the `admin` of the PegKepper, which is the ownership agent (CurveDAO). Changing the caller share therefore requires a dao vote. Caller share is denominated in 10^5, meaning 10% would be 10000.

    ??? quote "Source code"

        ```python hl_lines="1 5 9 17 19"
        event SetNewCallerShare:
            caller_share: uint256

        SHARE_PRECISION: constant(uint256) = 10 ** 5
        caller_share: public(uint256)

        @external
        @nonpayable
        def set_new_caller_share(_new_caller_share: uint256):
            """
            @notice Set new update caller's part
            @param _new_caller_share Part with SHARE_PRECISION
            """
            assert msg.sender == self.admin  # dev: only admin
            assert _new_caller_share <= SHARE_PRECISION  # dev: bad part value

            self.caller_share = _new_caller_share

            log SetNewCallerShare(_new_caller_share)

        ```

    === "Example"

        ```shell
        >>> PegKepper.set_new_caller_share("todo")
        'todo'
        ```


### `withdraw_profit`
!!! description "`PegKeeper.withdraw_profit() -> uint256:`"

    Function to withdraw the profit generated by the PegKeeper.

    Returns: amount of LP tokens received (`uint256`).

    ??? quote "Source code"

        ```python hl_lines="1 6 14 17"
        event Profit:
            lp_amount: uint256

        @external
        @nonpayable
        def withdraw_profit() -> uint256:
            """
            @notice Withdraw profit generated by Peg Keeper
            @return Amount of LP Token received
            """
            lp_amount: uint256 = self._calc_profit()
            POOL.transfer(self.receiver, lp_amount)

            log Profit(lp_amount)

            return lp_amount
        ```

    === "Example"

        ```shell
        >>> PegKepper.withdraw_profit():
        todo
        ```

        



## **Admin and Receiver**
admin and reciever follow the usual curve way on how to handle ownership etc. What stands out on these function is that there is a `ADMIN_ACTIONs_DELAY` which is set to 3 * 86400 -> three days. why use a delay? `future_admin` and `future_receiver` need to call apply the changes by calling `apply_new_admin` or `apply_new_receiver`.  
When commiting new admins or receivers, the function always checks if `new_admin_deadline` or `new_receiver_deadline` is 0. If not, then there is still the possibility of another address to apply changes. commit function can only be called by the admin of the contract.



### `admin`
!!! description "`PegKeeper.admin() -> address: view`"

    Getter for the admin of the PegKeeper. admin is ownership agent (curveDAO).

    Returns: admin (`address`).

    ??? quote "Source code"

        ```python hl_lines="1 4 5 13 25 28"
        admin: public(address)

        @external
        def __init__(_pool: CurvePool, _index: uint256, _receiver: address, _caller_share: uint256, _factory: address, _aggregator: StableAggregator, _admin: address):
            """
            @notice Contract constructor
            @param _pool Contract pool address
            @param _index Index of the pegged
            @param _receiver Receiver of the profit
            @param _caller_share Caller's share of profit
            @param _factory Factory which should be able to take coins away
            @param _aggregator Price aggregator which shows the price of pegged in real "dollars"
            @param _admin Admin account
            """
            assert _index < 2
            POOL = _pool
            I = _index
            pegged: address = _pool.coins(_index)
            PEGGED = pegged
            ERC20(pegged).approve(_pool.address, max_value(uint256))
            ERC20(pegged).approve(_factory, max_value(uint256))

            PEG_MUL = 10 ** (18 - ERC20(_pool.coins(1 - _index)).decimals())

            self.admin = _admin
            assert _receiver != empty(address)
            self.receiver = _receiver
            log ApplyNewAdmin(msg.sender)
            log ApplyNewReceiver(_receiver)

            assert _caller_share <= SHARE_PRECISION  # dev: bad part value
            self.caller_share = _caller_share
            log SetNewCallerShare(_caller_share)

            FACTORY = _factory
            AGGREGATOR = _aggregator
            IS_INVERSE = (_index == 0)
        ```

    === "Example"

        ```shell
        >>> PegKepper.admin()
        '0x40907540d8a6C65c637785e8f8B742ae6b0b9968'
        ```


### `future_admin`
!!! description "`PegKeeper.future_admin() -> address: view`"

    Getter for the future admin of the PegKeeper. This variable is set when calling [`commit_new_admin`](#commit_new_admin). Changes need to be applied by calling [`apply_new_admin`](#apply_new_admin).

    Returns: future admin (`address`).

    ??? quote "Source code"

        ```python hl_lines="1"
        future_admin: public(address)
        ```

    === "Example"

        ```shell
        >>> PegKepper.future_admin()
        '0x0000000000000000000000000000000000000000'
        ```



### `receiver`
!!! description "`PegKeeper.receiver() -> address: view`"

    Getter for the receiver of the profit from the peg keeper.

    Returns: receiver (`address`).

    ??? quote "Source code"

        ```python hl_lines="1 4 5 10 26 27 29"
        receiver: public(address)

        @external
        def __init__(_pool: CurvePool, _index: uint256, _receiver: address, _caller_share: uint256, _factory: address, _aggregator: StableAggregator, _admin: address):
            """
            @notice Contract constructor
            @param _pool Contract pool address
            @param _index Index of the pegged
            @param _receiver Receiver of the profit
            @param _caller_share Caller's share of profit
            @param _factory Factory which should be able to take coins away
            @param _aggregator Price aggregator which shows the price of pegged in real "dollars"
            @param _admin Admin account
            """
            assert _index < 2
            POOL = _pool
            I = _index
            pegged: address = _pool.coins(_index)
            PEGGED = pegged
            ERC20(pegged).approve(_pool.address, max_value(uint256))
            ERC20(pegged).approve(_factory, max_value(uint256))

            PEG_MUL = 10 ** (18 - ERC20(_pool.coins(1 - _index)).decimals())

            self.admin = _admin
            assert _receiver != empty(address)
            self.receiver = _receiver
            log ApplyNewAdmin(msg.sender)
            log ApplyNewReceiver(_receiver)

            assert _caller_share <= SHARE_PRECISION  # dev: bad part value
            self.caller_share = _caller_share
            log SetNewCallerShare(_caller_share)

            FACTORY = _factory
            AGGREGATOR = _aggregator
            IS_INVERSE = (_index == 0)
        ```

    === "Example"

        ```shell
        >>> PegKepper.receiver()
        '0xeCb456EA5365865EbAb8a2661B0c503410e9B347'
        ```


### `future_receiver`
!!! description "`PegKeeper.future_receiver() -> address: view`"

    Getter for the future receiver of the PegKeeper's profit. This variable is set when calling [`commit_new_receiver`](#commit_new_receiver). Changes need to be applied by calling [`apply_new_receiver`](#apply_new_receiver).

    Returns: future receiver (`address`).

    ??? quote "Source code"

        ```python hl_lines="1"
        future_admin: public(address)
        ```

    === "Example"

        ```shell
        >>> PegKepper.future_receiver()
        '0x0000000000000000000000000000000000000000'
        ```



### `new_admin_deadline`
!!! description "`PegKeeper.new_admin_deadline() -> uint256: view`"

    Getter for the timestamp until `future_admin` can apply the change of the admin. After the deadline is over, the address will not be able to apply the changes anymore. deadline is a timeperiod of three days.

    Returns: deadline (`uint256`).

    ??? quote "Source code"

        ```python hl_lines="1"
        new_admin_deadline: public(uint256)
        ```

    === "Example"

        ```shell
        >>> PegKepper.new_admin_deadline()
        0
        ```


### `new_receiver_deadline`
!!! description "`PegKeeper.new_receiver_deadline() -> uint256: view`"

    Getter for the timestamp until `future_receiver` can apply the change of the receiver. After the deadline is over, the address will not be able to apply the changes anymore. deadline is a timeperiod of three days.

    Returns: deadline (`uint256`).

    ??? quote "Source code"

        ```python hl_lines="1"
        new_receiver_deadline: public(uint256)
        ```

    === "Example"

        ```shell
        >>> PegKepper.new_receiver_deadline()
        0
        ```


### `commit_new_admin`
!!! description "`PegKeeper.commit_new_admin(_new_admin: address):`"

    Function to commit a new admin. This function is only callable by the admin of the contract. When calling the function successfully, the `future_admin` variable will be set to `_new_admin`. Deadline will start when calling this function.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_new_admin` |  `address` | New Admin |

    ??? quote "Source code"

        ```python hl_lines="1 6 18"
        event CommitNewAdmin:
            admin: address

        @external
        @nonpayable
        def commit_new_admin(_new_admin: address):
            """
            @notice Commit new admin of the Peg Keeper
            @param _new_admin Address of the new admin
            """
            assert msg.sender == self.admin  # dev: only admin
            assert self.new_admin_deadline == 0 # dev: active action

            deadline: uint256 = block.timestamp + ADMIN_ACTIONS_DELAY
            self.new_admin_deadline = deadline
            self.future_admin = _new_admin

            log CommitNewAdmin(_new_admin)
        ```

    === "Example"

        ```shell
        >>> PegKepper.commit_new_admin("todo")
        'todo'
        ```


### `apply_new_admin`
!!! description "`PegKeeper.apply_new_admin():`"

    Function to apply the new admin of the PegKeeper. This function can only be called by `future_admin` and only if the deadline is not over.

    ??? quote "Source code"

        ```python hl_lines="1 6 19"
        event ApplyNewAdmin:
            admin: address

        @external
        @nonpayable
        def apply_new_admin():
            """
            @notice Apply new admin of the Peg Keeper
            @dev Should be executed from new admin
            """
            new_admin: address = self.future_admin
            assert msg.sender == new_admin  # dev: only new admin
            assert block.timestamp >= self.new_admin_deadline  # dev: insufficient time
            assert self.new_admin_deadline != 0  # dev: no active action

            self.admin = new_admin
            self.new_admin_deadline = 0

            log ApplyNewAdmin(new_admin)
        ```

    === "Example"

        ```shell
        >>> PegKepper.apply_new_admin()
        ```


### `commit_new_receiver`
!!! description "`PegKeeper.commit_new_receiver(_new_receiver: address):`"

    Function to commit a new receiver for the profit. This function is only callable by the admin of the contract. When calling the function successfully, the `future_receiver` variable will be set to `_new_receiver`. Deadline will start when calling this function.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_new_receiver` |  `address` | New Receiver Address |

    ??? quote "Source code"

        ```python hl_lines="1 6 18"
        event CommitNewReceiver:
            receiver: address

        @external
        @nonpayable
        def commit_new_receiver(_new_receiver: address):
            """
            @notice Commit new receiver of profit
            @param _new_receiver Address of the new receiver
            """
            assert msg.sender == self.admin  # dev: only admin
            assert self.new_receiver_deadline == 0 # dev: active action

            deadline: uint256 = block.timestamp + ADMIN_ACTIONS_DELAY
            self.new_receiver_deadline = deadline
            self.future_receiver = _new_receiver

            log CommitNewReceiver(_new_receiver)
        ```

    === "Example"

        ```shell
        >>> PegKepper.commit_new_receiver("todo")
        'todo'
        ```


### `apply_new_receiver`
!!! description "`PegKeeper.apply_new_receiver():`"

    Function to apply the new receiver of the PegKeeper's profit. This function can only be called by `future_receiver` and only if the deadline is not over.

    ??? quote "Source code"

        ```python hl_lines="1 6 17"
        event ApplyNewReceiver:
            receiver: address

        @external
        @nonpayable
        def apply_new_receiver():
            """
            @notice Apply new receiver of profit
            """
            assert block.timestamp >= self.new_receiver_deadline  # dev: insufficient time
            assert self.new_receiver_deadline != 0  # dev: no active action

            new_receiver: address = self.future_receiver
            self.receiver = new_receiver
            self.new_receiver_deadline = 0

            log ApplyNewReceiver(new_receiver)
        ```

    === "Example"

        ```shell
        >>> PegKepper.apply_new_receiver():
        ```



### `revert_new_option` (why not emergency dao?)
!!! description "`PegKeeper.revert_new_options():`"

    Function to revert new admin or new receiver of the PegKepper. This function can only be called by the admin. Calling this function sets the admin and receiver deadline to 0 and emits ApplyNewAdmin and ApplyNewReceiver events to revert the changes.

    ??? quote "Source code"

        ```python hl_lines="1 4 8 18 19"
        event ApplyNewReceiver:
            receiver: address

        event ApplyNewAdmin:
            admin: address

        @external
        @nonpayable
        def revert_new_options():
            """
            @notice Revert new admin of the Peg Keeper or new receiver
            @dev Should be executed from admin
            """
            assert msg.sender == self.admin  # dev: only admin

            self.new_admin_deadline = 0
            self.new_receiver_deadline = 0

            log ApplyNewAdmin(self.admin)
            log ApplyNewReceiver(self.receiver)
        ```

    === "Example"

        ```shell
        >>> PegKepper.revert_new_options():
        ```



## **heart of pegkeeper**
Heart of the PegKeeper is the [`update()`](#update) function. When calling it, the PegKeeper either mints and (only!) deposits crvUSD into the corresponding pool ([`pool`](#pool)) or withdraws and burns crvUSD.  

Mint and Deposit: This happens when the price of the stablecoin is > 1. Minting and depositing into the pool will increase the balance of crvusd and therefore decrease its price.

Withdraw and Burn: This mechanism happens when the price of the stablecoin is < 1. Withdrawing crvusd from the pool will decrease its balance and therefore increase the price.



### `update`
!!! description "`PegKeeper.revert_new_options():`"

    Function to either mint and deposit or withdraw and burn.

    Returns: caller's profit (`uint256`).

    ??? quote "Source code (mint and deposit)"

        ```python hl_lines="1 5 13 17 21 56"
        event Provide:
            amount: uint256

        @internal
        def _provide(_amount: uint256):
            # We already have all reserves here
            # ERC20(PEGGED).mint(self, _amount)
            if _amount == 0:
                return

            amounts: uint256[2] = empty(uint256[2])
            amounts[I] = _amount
            POOL.add_liquidity(amounts, 0)

            self.last_change = block.timestamp
            self.debt += _amount
            log Provide(_amount)

        @external
        @nonpayable
        def update(_beneficiary: address = msg.sender) -> uint256:
            """
            @notice Provide or withdraw coins from the pool to stabilize it
            @param _beneficiary Beneficiary address
            @return Amount of profit received by beneficiary
            """
            if self.last_change + ACTION_DELAY > block.timestamp:
                return 0

            balance_pegged: uint256 = POOL.balances(I)
            balance_peg: uint256 = POOL.balances(1 - I) * PEG_MUL

            initial_profit: uint256 = self._calc_profit()

            p_agg: uint256 = AGGREGATOR.price()  # Current USD per stablecoin

            # Checking the balance will ensure no-loss of the stabilizer, but to ensure stabilization
            # we need to exclude "bad" p_agg, so we add an extra check for it

            if balance_peg > balance_pegged:
                assert p_agg >= 10**18
                self._provide((balance_peg - balance_pegged) / 5)  # this dumps stablecoin

            else:
                assert p_agg <= 10**18
                self._withdraw((balance_pegged - balance_peg) / 5)  # this pumps stablecoin

            # Send generated profit
            new_profit: uint256 = self._calc_profit()
            assert new_profit >= initial_profit, "peg unprofitable"
            lp_amount: uint256 = new_profit - initial_profit
            caller_profit: uint256 = lp_amount * self.caller_share / SHARE_PRECISION
            if caller_profit > 0:
                POOL.transfer(_beneficiary, caller_profit)

            return caller_profit
        ```

    ??? quote "Source code (withdraw and burn)"

        ```python hl_lines="1 5 14 19 23 58"
        event Withdraw:
            amount: uint256
        
        @internal
        def _withdraw(_amount: uint256):
            if _amount == 0:
                return

            debt: uint256 = self.debt
            amount: uint256 = min(_amount, debt)

            amounts: uint256[2] = empty(uint256[2])
            amounts[I] = amount
            POOL.remove_liquidity_imbalance(amounts, max_value(uint256))

            self.last_change = block.timestamp
            self.debt -= amount

            log Withdraw(amount)

        @external
        @nonpayable
        def update(_beneficiary: address = msg.sender) -> uint256:
            """
            @notice Provide or withdraw coins from the pool to stabilize it
            @param _beneficiary Beneficiary address
            @return Amount of profit received by beneficiary
            """
            if self.last_change + ACTION_DELAY > block.timestamp:
                return 0

            balance_pegged: uint256 = POOL.balances(I)
            balance_peg: uint256 = POOL.balances(1 - I) * PEG_MUL

            initial_profit: uint256 = self._calc_profit()

            p_agg: uint256 = AGGREGATOR.price()  # Current USD per stablecoin

            # Checking the balance will ensure no-loss of the stabilizer, but to ensure stabilization
            # we need to exclude "bad" p_agg, so we add an extra check for it

            if balance_peg > balance_pegged:
                assert p_agg >= 10**18
                self._provide((balance_peg - balance_pegged) / 5)  # this dumps stablecoin

            else:
                assert p_agg <= 10**18
                self._withdraw((balance_pegged - balance_peg) / 5)  # this pumps stablecoin

            # Send generated profit
            new_profit: uint256 = self._calc_profit()
            assert new_profit >= initial_profit, "peg unprofitable"
            lp_amount: uint256 = new_profit - initial_profit
            caller_profit: uint256 = lp_amount * self.caller_share / SHARE_PRECISION
            if caller_profit > 0:
                POOL.transfer(_beneficiary, caller_profit)

            return caller_profit
        ```

    === "Example"

        ```shell
        >>> PegKepper.update():
        ```

