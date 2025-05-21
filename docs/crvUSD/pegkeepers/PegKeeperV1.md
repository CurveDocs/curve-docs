## **Concept of PegKeepers**

PegKeepers are contracts that help stabilize the peg of crvUSD. Each Keeper is allocated a specific amount of crvUSD to secure the peg.
The DAO decides this balance and can be **raised or lowered** by calling `set_debt_ceiling()` in the [Factory](../factory/overview.md).


The underlying actions of the PegKeepers can be divided into two actions, which get executed when calling [`update()`](#update):

- **crvUSD price > 1**: The PegKeeper mints and deposits crvUSD single-sidedly into the pool to which it is "linked", and receives LP tokens in exchange. This increases the balance of crvUSD in the pool and therefore decreases the price.
It is important to note that the LP tokens are not staked in the gauge (if there is one). Thus, the PegKeeper does not receive CRV emissions.

- **crvUSD price < 1**: If PegKeepers hold a balance of the corresponding LP token, they can single-sidedly withdraw crvUSD from the liquidity pool and burn it. This action reduces the supply of crvUSD in the pool and should subsequently increase its price.

!!!note
    PegKeepers **do not actually mint or burn crvUSD tokens**. They have a defined allocated balance of crvUSD tokens that they can use for deposits. It is important to note that **PegKeepers cannot do anything else apart from depositing and withdrawing**. Therefore, crvUSD token balances of the PegKeepers that are not deposited into a pool may not be counted as circulating supply, although technically they are.



!!!deploy "Contract Source & Deployment"
    Source code for this contract is available on [GitHub](https://github.com/curvefi/curve-stablecoin/blob/master/contracts/stabilizer/PegKeeper.vy).

    | PegKeepers                | Deployment Address  |
    | ------------------------- | ------------------- |
    |`PegKeeper for crvUSD/USDC`|[0xaA346781dDD7009caa644A4980f044C50cD2ae22](https://etherscan.io/address/0xaA346781dDD7009caa644A4980f044C50cD2ae22#code)|
    |`PegKeeper for crvUSD/USDT`|[0xE7cd2b4EB1d98CD6a4A48B6071D46401Ac7DC5C8](https://etherscan.io/address/0xE7cd2b4EB1d98CD6a4A48B6071D46401Ac7DC5C8#code)|
    |`PegKeeper for crvUSD/USDP`|[0x6B765d07cf966c745B340AdCa67749fE75B5c345](https://etherscan.io/address/0x6B765d07cf966c745B340AdCa67749fE75B5c345#code)|
    |`PegKeeper for crvUSD/TUSD`|[0x1ef89Ed0eDd93D1EC09E4c07373f69C49f4dcCae](https://etherscan.io/address/0x1ef89Ed0eDd93D1EC09E4c07373f69C49f4dcCae#code)|


## **Stabilisation Method**
The most important function in the PegKeeper contract is the `update()` function. When invoked, the PegKeeper either mints and single-sidedly deposits crvUSD into the StableSwap pool, or it withdraws crvUSD from the pool by redeeming the LP tokens received from previous deposits.

- **Deposit and Mint:** This mechanism is triggered when the *price of crvUSD > 1*. Minting and depositing into the pool will increase the crvUSD supply and decrease its price. The LP tokens that the PegKeeper receives when depositing crvUSD into the pool are not staked in the gauge (if the pool has one), which means the PegKeeper does not receive CRV inflation rewards.

- **Withdraw and Burn:** This mechanism is triggered when the *price of crvUSD < 1*. By withdrawing crvUSD from the pool, the supply of crvUSD decreases, which increases its price.

PegKeepers have unlimited approval for the liquidity pool, allowing them to deposit and withdraw crvUSD.


### `update`
!!! description "`PegKeeper.update(_beneficiary: address = msg.sender) -> uint256:`"

    Function to either **mint and deposit** or **withdraw and burn** based on the balances within the pools.
    A share (`caller_share`) of the generated profit will be awarded to the function's caller. By default, this is set to `msg.sender`, but there is also the possibility to input a `_beneficiary` address to which the rewards will be sent.

    Returns: caller profit (`uint256`).

    Emits: `Provide` or `Withdraw`

    !!!note
        There is an `ACTION_DELAY` of 15 minutes before calling the function again.

    ??? quote "Source code: **Mint and Deposit**"

        ```vyper
        event Provide:
            amount: uint256

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
        ```

    ??? quote "Source code: **Withdraw and Burn**"

        ```vyper
        event Withdraw:
            amount: uint256

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
        ```

    === "Example"

        ```shell
        >>> PegKepper.update()
        ```


### `last_change`
!!! description "`PegKeeper.last_change() -> uint256: view`"

    Function which retrieves the timestamp of when the balances of the PegKeeper were last altered. This variable is updated each time `update()` (`_provide` or `_withdraw`) is called. This variable is of importance for `update()`, as there is a mandatory delay of 15 * 60 seconds before the function can be called again.

    Returns: timestamp (`uint256`).

    ??? quote "Source code"

        ```vyper
        last_change: public(uint256)
        ```

    === "Example"

        ```shell
        >>> PegKepper.last_change()
        1688794235
        ```


## **Calculating and Withdrawing Profits**

### `calc_profit`
!!! description "`PegKeeper.calc_profit() -> uint256:`"

    Function to calculate the generated profit in LP tokens.

    Returns: generated profit (`uint256`).

    ??? quote "Source code"

        ```vyper
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
        41173451286504149038
        ```


### `estimate_caller_profit`
!!! description "`PegKeeper.estimate_caller_profit() -> uint256:`"

    Function to estimate the profit from calling `update()`. The caller of the function will receive 20% of the total profits.

    Returns: expected amount of profit going to the caller (`uint256`).

    !!! warning
        Please note that this method provides an estimate and may not reflect the precise profit. The actual profit tends to be higher due to the increasing virtual price of the LP token.

    ??? quote "Source code"

        ```vyper
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

    Getter for the caller share which is the share of the profit generated when calling the `update()` function. The share is intended to incentivize the call of the function. The precision of the variable is set to $10^5$.

    Returns: caller share (`uint256`).

    ??? quote "Source code"

        ```vyper
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

    !!!guard "Guarded Method"
        This function is only callable by the `admin` of the contract.

    Function to set the caller share to `_new_caller_share`.

    Emits: `SetNewCallerShare`

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_new_caller_share` |  `uint256` | New caller share |

    ??? quote "Source code"

        ```vyper
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
        >>> PegKepper.set_new_caller_share(30000)
        ```


### `withdraw_profit`
!!! description "`PegKeeper.withdraw_profit() -> uint256:`"

    Function to withdraw the profit generated by the PegKeeper.

    Returns: amount of LP tokens (`uint256`).

    Emits: `Profit`

    ??? quote "Source code"

        ```vyper
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
        1222209056795882453168
        ```


## **Admin and Receiver**

PegKeepers have an `admin` and a `receiver`. Both of these variables can be changed by calling the respective admin-guarded functions, but such changes must first be approved by a DAO vote.
After approval, the newly designated admin or receiver is required to apply these changes within a timeframe of `3 * 86400` seconds, which equates to a timespan of *three days*. Should there be an attempt to implement these changes after this period, the function will revert.


### `admin`
!!! description "`PegKeeper.admin() -> address: view`"

    Getter for the admin of the PegKeeper.

    Returns: admin (`address`).

    ??? quote "Source code"

        ```vyper
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
            ...

            self.admin = _admin

            ...
        ```

    === "Example"

        ```shell
        >>> PegKepper.admin()
        '0x40907540d8a6C65c637785e8f8B742ae6b0b9968'
        ```


### `future_admin`
!!! description "`PegKeeper.future_admin() -> address: view`"

    Getter for the future admin of the PegKeeper.

    Returns: future admin (`address`).

    ??? quote "Source code"

        ```vyper
        future_admin: public(address)
        ```

    === "Example"

        ```shell
        >>> PegKepper.future_admin()
        '0x0000000000000000000000000000000000000000'
        ```


### `commit_new_admin`
!!! description "`PegKeeper.commit_new_admin(_new_admin: address):`"

    !!!guard "Guarded Method"
        This function is only callable by the `admin` of the contract.

    Function to commit a new admin.

    Emits: `CommitNewAdmin`

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_new_admin` |  `address` | new admin address |

    ??? quote "Source code"

        ```vyper
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
        >>> PegKepper.commit_new_admin("0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045")
        ```


### `apply_new_admin`
!!! description "`PegKeeper.apply_new_admin():`"

    !!!guard "Guarded Method"
        This function is only callable by the `future_admin` of the contract.

    Function to apply the new admin of the PegKeeper.

    Emits: `ApplyNewAdmin`

    ??? quote "Source code"

        ```vyper
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


### `new_admin_deadline`
!!! description "`PegKeeper.new_admin_deadline() -> uint256: view`"

    Getter for the timestamp indicating the deadline by which the `future_admin` can apply the admin change. Once the deadline is over, the address will no longer be able to apply the changes. The deadline is set for a **timeperiod of three days**.

    Returns: timestamp (`uint256`).

    ??? quote "Source code"

        ```vyper
        new_admin_deadline: public(uint256)
        ```

    === "Example"

        ```shell
        >>> PegKepper.new_admin_deadline()
        0
        ```


### `receiver`
!!! description "`PegKeeper.receiver() -> address: view`"

    Getter for the receiver of the PegKeeper's profits.

    Returns: receiver (`address`).

    ??? quote "Source code"

        ```vyper
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
            @param _aggregator Price aggregator which shows the price pegged in real "dollars"
            @param _admin Admin account
            """
            ...

            assert _receiver != empty(address)
            self.receiver = _receiver

            ...
        ```

    === "Example"

        ```shell
        >>> PegKepper.receiver()
        '0xeCb456EA5365865EbAb8a2661B0c503410e9B347'
        ```


### `future_receiver`
!!! description "`PegKeeper.future_receiver() -> address: view`"

    Getter for the future receiver of the PegKeeper's profit.

    Returns: future receiver (`address`).

    ??? quote "Source code"

        ```vyper
        future_admin: public(address)
        ```

    === "Example"

        ```shell
        >>> PegKepper.future_receiver()
        '0x0000000000000000000000000000000000000000'
        ```


### `commit_new_receiver`
!!! description "`PegKeeper.commit_new_receiver(_new_receiver: address):`"

    !!!guard "Guarded Method"
        This function is only callable by the `admin` of the contract.

    Function to commit a new receiver address.

    Emits: `CommitNewReceiver`

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_new_receiver` |  `address` | new receiver address |

    ??? quote "Source code"

        ```vyper
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
        >>> PegKepper.commit_new_receiver("0x0000000000000000000000000000000000000000")
        ```


### `apply_new_receiver`
!!! description "`PegKeeper.apply_new_receiver():`"

    Function to apply the new receiver address of the PegKeeper's profit.

    Emits: `ApplyNewReceiver`

    ??? quote "Source code"

        ```vyper
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


### `new_receiver_deadline`
!!! description "`PegKeeper.new_receiver_deadline() -> uint256: view`"

    Getter for the timestamp indicating the deadline by which the `future_receiver` can apply the receiver change. Once the deadline is over, the address will no longer be able to apply the changes. The deadline is set for a **timeperiod of three days**.

    Returns: timestamp (`uint256`).

    ??? quote "Source code"

        ```vyper
        new_receiver_deadline: public(uint256)
        ```

    === "Example"

        ```shell
        >>> PegKepper.new_receiver_deadline()
        0
        ```


### `revert_new_option`
!!! description "`PegKeeper.revert_new_options():`"

    !!!guard "Guarded Method"
        This function is only callable by the `admin` of the contract.

    Function to revert admin or receiver changes. Calling this function sets the admin and receiver deadline back to 0 and emits ApplyNewAdmin and ApplyNewReceiver events to revert the changes.

    Emits: `ApplyNewAdmin` and `ApplyNewReceiver`

    ??? quote "Source code"

        ```vyper
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


## **Contract Info Methods**


### `debt`
!!! description "`PegKeeper.debt() -> uint256: view`"

    Getter for the crvUSD debt of the PegKeeper. When the PegKeeper deposits crvUSD into the pool, the debt is incremented by the deposited amount. Conversely, if the PegKeeper withdraws, the debt is reduced by the withdrawn amount. `debt` is used to calculate the DebtFraction of the PegKeepers.

    Returns: debt (`uint256`).

    ??? quote "Source code"

        ```vyper
        debt: public(uint256)
        ```

    === "Example"

        ```shell
        >>> PegKepper.debt()
        10569198033275719942044356
        ```


### `FACTORY`
!!! description "`PegKeeper.FACTORY() -> address: view`"

    Getter for the address of the factory contract.

    Returns: factory contract (`address`).

    ??? quote "Source code"

        ```vyper
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
            ...

            FACTORY = _factory

            ...
        ```

    === "Example"

        ```shell
        >>> PegKepper.FACTORY()
        '0xC9332fdCB1C491Dcc683bAe86Fe3cb70360738BC'
        ```


### `PEGGED`
!!! description "`PegKeeper.PEGGED() -> address: view`"

    Getter for the address of the pegged token (crvUSD). Pegged asset is determined by the index of the token in the corresponding `pool`. Index value is stored in `I`.

    Returns: pegged token contract (`address`).

    ??? quote "Source code"

        ```vyper
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
            ...

            PEGGED = pegged

            ...
        ```

    === "Example"

        ```shell
        >>> PegKepper.PEGGED()
        '0xf939E0A03FB07F59A73314E73794Be0E57ac1b4E'
        ```


### `POOL`
!!! description "`PegKeeper.POOL() -> address: view`"

    Getter for the pool contract address in which the PegKeeper deposits and withdraws.

    Returns: pool contract (`address`).

    ??? quote "Source code"

        ```vyper
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
            ...

            POOL = _pool

            ...
        ```

    === "Example"

        ```shell
        >>> PegKepper.POOL()
        '0x4DEcE678ceceb27446b35C672dC7d61F30bAD69E'
        ```


### `AGGREGATOR`
!!! description "`PegKeeper.AGGREGATOR() -> address: view`"

    Getter for the price aggregator contract for crvUSD. This contract is used to determine the value of crvUSD.

    Returns: price aggregator contract (`address`).

    ??? quote "Source code"

        ```vyper
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
            ...

            AGGREGATOR = _aggregator

            ...
        ```

    === "Example"

        ```shell
        >>> PegKepper.AGGREGATOR()
        '0xe5Afcf332a5457E8FafCD668BcE3dF953762Dfe7'
        ```
