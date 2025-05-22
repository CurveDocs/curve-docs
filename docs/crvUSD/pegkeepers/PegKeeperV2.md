<h1>PegKeeperV2</h1>


!!!github "GitHub"
    Source code for the `PegKeeperV2.vy` contract is available on [:material-github: GitHub](https://github.com/curvefi/curve-stablecoin/blob/master/contracts/stabilizer/PegKeeperV2.vy).

## **Stabilization Method Enhancement in PegKeeperV2**

The `PegKeeperV2` retains the overarching stabilization approach of its predecessor, `PegKeeperV1`, through the `update` function. This function adapts its operations based on varying conditions to take appropriate measures for maintaining stability.

A significant evolution from `PegKeeperV1` is the integration with the `PegKeeperRegulator` contract. This new contract plays a crucial role in granting allowance to the PegKeepers to deposit into or withdraw from the liquidity pool. Depositing increases the debt of a PegKeeper, while withdrawing reduces it.

For a detailed overview on the additional checks implemented, please see: [Providing](./PegKeeperRegulator.md#providing)[^1] and [Withdrawing](./PegKeeperRegulator.md#withdrawing).

[^1]: In this context, "providing" is the terminology adopted by the new PegKeeper to describe the act of depositing crvUSD into a liquidity pool, marking a shift from the conventional term "depositing."


### `update`
!!! description "`PegKeeperV2.update(_beneficiary: address = msg.sender) -> uint256`"

    Function to provide or withdraw coins from the pool to stabilize it. The `_beneficiary` address is awarded a share of the profits for calling the function. There is a delay determined by the `action_delay` variable before the function can be called again. If it is called prior to that, the function will return 0. The maximum amount to provide is to get the pool to a 50/50 balance. Obviously, the PegKeeper is ultimately limited by its own balance of crvUSD. It can't deposit more than it has.
    If a PegKeeper is ultimately allowed to deposit or withdraw is determined by the [`PegKeeperRegulator`](./PegKeeperRegulator.md).

    Returns: amount of profit received by the beneficiary (`uint256`).

    Emits: `Provide` or `Withdraw`

    | Input          | Type      | Description |
    | -------------- | --------- | ----------- |
    | `_beneficiary` | `address` | Address to receive the caller profit. Defaults to `msg.sender` |

    ??? quote "Source code for providing crvUSD to the pool"

        === "PegKeeperV2.vy"

            ```vyper
            event Provide:
                amount: uint256

            action_delay: uint256

            POOL: immutable(CurvePool)
            I: immutable(uint256)  # index of pegged in pool

            @external
            @nonpayable
            def update(_beneficiary: address = msg.sender) -> uint256:
                """
                @notice Provide or withdraw coins from the pool to stabilize it
                @param _beneficiary Beneficiary address
                @return Amount of profit received by beneficiary
                """
                if self.last_change + self.action_delay > block.timestamp:
                    return 0

                balance_pegged: uint256 = POOL.balances(I)
                balance_peg: uint256 = POOL.balances(1 - I) * PEG_MUL

                initial_profit: uint256 = self._calc_profit()

                if balance_peg > balance_pegged:
                    allowed: uint256 = self.regulator.provide_allowed()
                    assert allowed > 0, "Regulator ban"
                    self._provide(min(unsafe_sub(balance_peg, balance_pegged) / 5, allowed))  # this dumps stablecoin

                else:
                    allowed: uint256 = self.regulator.withdraw_allowed()
                    assert allowed > 0, "Regulator ban"
                    self._withdraw(min(unsafe_sub(balance_pegged, balance_peg) / 5, allowed))  # this pumps stablecoin

                # Send generated profit
                new_profit: uint256 = self._calc_profit()
                assert new_profit > initial_profit, "peg unprofitable"
                lp_amount: uint256 = new_profit - initial_profit
                caller_profit: uint256 = lp_amount * self.caller_share / SHARE_PRECISION
                if caller_profit > 0:
                    POOL.transfer(_beneficiary, caller_profit)

                return caller_profit

            @internal
            def _provide(_amount: uint256):
                """
                @notice Implementation of provide
                @dev Coins should be already in the contract
                """
                if _amount == 0:
                    return

                amount: uint256 = min(_amount, PEGGED.balanceOf(self))

                if IS_NG:
                    amounts: DynArray[uint256, 2] = [0, 0]
                    amounts[I] = amount
                    CurvePoolNG(POOL.address).add_liquidity(amounts, 0)
                else:
                    amounts: uint256[2] = empty(uint256[2])
                    amounts[I] = amount
                    CurvePoolOld(POOL.address).add_liquidity(amounts, 0)

                self.last_change = block.timestamp
                self.debt += amount
                log Provide(amount)

            @internal
            @view
            def _calc_profit() -> uint256:
                """
                @notice Calculate PegKeeper's profit using current values
                """
                return self._calc_profit_from(POOL.balanceOf(self), POOL.get_virtual_price(), self.debt)

            @internal
            @pure
            def _calc_profit_from(lp_balance: uint256, virtual_price: uint256, debt: uint256) -> uint256:
                """
                @notice PegKeeper's profit calculation formula
                """
                lp_debt: uint256 = debt * PRECISION / virtual_price

                if lp_balance <= lp_debt:
                    return 0
                else:
                    return lp_balance - lp_debt
            ```

        === "PegKeeperRegulator.vy"

            ```vyper
            @external
            @view
            def provide_allowed(_pk: address=msg.sender) -> uint256:
                """
                @notice Allow PegKeeper to provide stablecoin into the pool
                @dev Can return more amount than available
                @dev Checks
                    1) current price in range of oracle in case of spam-attack
                    2) current price location among other pools in case of contrary coin depeg
                    3) stablecoin price is above 1
                @return Amount of stablecoin allowed to provide
                """
                if self.is_killed in Killed.Provide:
                    return 0

                if self.aggregator.price() < ONE:
                    return 0

                price: uint256 = max_value(uint256)  # Will fail if PegKeeper is not in self.price_pairs
                largest_price: uint256 = 0
                debt_ratios: DynArray[uint256, MAX_LEN] = []
                for info in self.peg_keepers:
                    price_oracle: uint256 = self._get_price_oracle(info)
                    if info.peg_keeper.address == _pk:
                        price = price_oracle
                        if not self._price_in_range(price, self._get_price(info)):
                            return 0
                        continue
                    elif largest_price < price_oracle:
                        largest_price = price_oracle
                    debt_ratios.append(self._get_ratio(info.peg_keeper))

                if largest_price < unsafe_sub(price, self.worst_price_threshold):
                    return 0

                debt: uint256 = PegKeeper(_pk).debt()
                total: uint256 = debt + STABLECOIN.balanceOf(_pk)
                return self._get_max_ratio(debt_ratios) * total / ONE - debt
            ```



    ??? quote "Source code for withdrawing crvUSD from the pool"

        === "PegKeeperV2.vy"

            ```vyper
            event Withdraw:
                amount: uint256

            action_delay: uint256

            @external
            @nonpayable
            def update(_beneficiary: address = msg.sender) -> uint256:
                """
                @notice Provide or withdraw coins from the pool to stabilize it
                @param _beneficiary Beneficiary address
                @return Amount of profit received by beneficiary
                """
                if self.last_change + self.action_delay > block.timestamp:
                    return 0

                balance_pegged: uint256 = POOL.balances(I)
                balance_peg: uint256 = POOL.balances(1 - I) * PEG_MUL

                initial_profit: uint256 = self._calc_profit()

                if balance_peg > balance_pegged:
                    allowed: uint256 = self.regulator.provide_allowed()
                    assert allowed > 0, "Regulator ban"
                    self._provide(min(unsafe_sub(balance_peg, balance_pegged) / 5, allowed))  # this dumps stablecoin

                else:
                    allowed: uint256 = self.regulator.withdraw_allowed()
                    assert allowed > 0, "Regulator ban"
                    self._withdraw(min(unsafe_sub(balance_pegged, balance_peg) / 5, allowed))  # this pumps stablecoin

                # Send generated profit
                new_profit: uint256 = self._calc_profit()
                assert new_profit > initial_profit, "peg unprofitable"
                lp_amount: uint256 = new_profit - initial_profit
                caller_profit: uint256 = lp_amount * self.caller_share / SHARE_PRECISION
                if caller_profit > 0:
                    POOL.transfer(_beneficiary, caller_profit)

                return caller_profit

            @internal
            def _withdraw(_amount: uint256):
                """
                @notice Implementation of withdraw
                """
                if _amount == 0:
                    return

                debt: uint256 = self.debt
                amount: uint256 = min(_amount, debt)

                if IS_NG:
                    amounts: DynArray[uint256, 2] = [0, 0]
                    amounts[I] = amount
                    CurvePoolNG(POOL.address).remove_liquidity_imbalance(amounts, max_value(uint256))
                else:
                    amounts: uint256[2] = empty(uint256[2])
                    amounts[I] = amount
                    CurvePoolOld(POOL.address).remove_liquidity_imbalance(amounts, max_value(uint256))

                self.last_change = block.timestamp
                self.debt = debt - amount

                log Withdraw(amount)

            @internal
            @view
            def _calc_profit() -> uint256:
                """
                @notice Calculate PegKeeper's profit using current values
                """
                return self._calc_profit_from(POOL.balanceOf(self), POOL.get_virtual_price(), self.debt)

            @internal
            @pure
            def _calc_profit_from(lp_balance: uint256, virtual_price: uint256, debt: uint256) -> uint256:
                """
                @notice PegKeeper's profit calculation formula
                """
                lp_debt: uint256 = debt * PRECISION / virtual_price

                if lp_balance <= lp_debt:
                    return 0
                else:
                    return lp_balance - lp_debt
            ```

        === "PegKeeperRegulator.vy"

            ```vyper
            @external
            @view
            def withdraw_allowed(_pk: address=msg.sender) -> uint256:
                """
                @notice Allow Peg Keeper to withdraw stablecoin from the pool
                @dev Can return more amount than available
                @dev Checks
                    1) current price in range of oracle in case of spam-attack
                    2) stablecoin price is below 1
                @return Amount of stablecoin allowed to withdraw
                """
                if self.is_killed in Killed.Withdraw:
                    return 0

                if self.aggregator.price() > ONE:
                    return 0

                i: uint256 = self.peg_keeper_i[PegKeeper(_pk)]
                if i > 0:
                    info: PegKeeperInfo = self.peg_keepers[i - 1]
                    if self._price_in_range(self._get_price(info), self._get_price_oracle(info)):
                        return max_value(uint256)
                return 0
            ```

    === "Example"
        ```shell
        >>> soon
        ```


### `last_change`
!!! description "`PegKeeperV2.last_change() -> uint256: view`"

    Getter for the last time a change in debt occurred. This variable is set to `block.timestamp` whenever the PegKeeper provides or withdraws crvUSD by calling [`update`](#update).

    Returns: timestamp (`uint256`).

    ??? quote "Source code"

        === "PegKeeperV2.vy"

            ```vyper
            last_change: public(uint256)
            ```

    === "Example"
        ```shell
        >>> PegKeeperV2.last_change()
        1722174559
        ```


---


## **Calculating and Withdrawing Profits**

By providing and withdrawing assets through liquidity pools, the PegKeeper generates profit.

The PegKeeper has a caller share mechanism, which incentivizes external users to call the `update` function. This mechanism ensures that the PegKeeper operates efficiently and maintains the peg by distributing a portion of the profit to the caller.

The profit generated by the PegKeeper is denominated in LP tokens. When profit is withdrawn using the [`withdraw_profit`](#withdraw_profit) function, it is transferred to the universal fee receiver specified in the [`PegKeeperRegulator`](./PegKeeperRegulator.md#fee_receiver) contract.


### `calc_profit`
!!! description "`PegKeeperV2.calc_profit() -> uint256`"

    Function to calculate the generated profit in LP tokens. This profit calculation does not include already withdrawn profit; it represents the full profit accumulated so far. The profit is calculated using the following formula:

    $$\text{profit} = \max(0, B_{LP} - \frac{\text{debt} \times 10^{18}}{VP_{LP}})$$

    with:

    - $B_{LP}$ is the LP token balance of the PegKeeper.
    - $VP_{LP}$ is the virtual price of the LP token.
    - $\text{debt}$ is the current debt of the PegKeeper (denominated in crvUSD).

    Returns: calculated profit in LP tokens (`uint256`).

    ??? quote "Source code"

        === "PegKeeperV2.vy"

            ```vyper
            @external
            @view
            def calc_profit() -> uint256:
                """
                @notice Calculate generated profit in LP tokens. Does NOT include already withdrawn profit
                @return Amount of generated profit
                """
                return self._calc_profit()

            @internal
            @view
            def _calc_profit() -> uint256:
                """
                @notice Calculate PegKeeper's profit using current values
                """
                return self._calc_profit_from(POOL.balanceOf(self), POOL.get_virtual_price(), self.debt)

            @internal
            @pure
            def _calc_profit_from(lp_balance: uint256, virtual_price: uint256, debt: uint256) -> uint256:
                """
                @notice PegKeeper's profit calculation formula
                """
                lp_debt: uint256 = debt * PRECISION / virtual_price

                if lp_balance <= lp_debt:
                    return 0
                else:
                    return lp_balance - lp_debt
            ```

    === "Example"
        ```shell
        >>> PegKeeperV2.calc_profit()
        0
        ```


### `estimate_caller_profit`
!!! description "`PegKeeperV2.estimate_caller_profit() -> uint256`"

    !!!warning
        This estimation is not precise and tends to be conservative, as the actual profit might be higher due to the increasing virtual price over time.

    Function to estimate the profit that a caller would receive from calling the `update()` function.

    Returns: estimated caller profit (`uint256`).

    ??? quote "Source code"

        === "PegKeeperV2.vy"

            ```vyper
            I: immutable(uint256)  # index of pegged in pool

            PEG_MUL: immutable(uint256)

            @external
            @view
            def estimate_caller_profit() -> uint256:
                """
                @notice Estimate profit from calling update()
                @dev This method is not precise, real profit is always more because of increasing virtual price
                @return Expected amount of profit going to beneficiary
                """
                if self.last_change + self.action_delay > block.timestamp:
                    return 0

                balance_pegged: uint256 = POOL.balances(I)
                balance_peg: uint256 = POOL.balances(1 - I) * PEG_MUL

                call_profit: uint256 = 0
                if balance_peg > balance_pegged:
                    allowed: uint256 = self.regulator.provide_allowed()
                    call_profit = self._calc_call_profit(min((balance_peg - balance_pegged) / 5, allowed), True)  # this dumps stablecoin

                else:
                    allowed: uint256 = self.regulator.withdraw_allowed()
                    call_profit = self._calc_call_profit(min((balance_pegged - balance_peg) / 5, allowed), False)  # this pumps stablecoin

                return call_profit * self.caller_share / SHARE_PRECISION

            @internal
            @view
            def _calc_call_profit(_amount: uint256, _is_deposit: bool) -> uint256:
                """
                @notice Calculate overall profit from calling update()
                """
                lp_balance: uint256 = POOL.balanceOf(self)
                virtual_price: uint256 = POOL.get_virtual_price()
                debt: uint256 = self.debt
                initial_profit: uint256 = self._calc_profit_from(lp_balance, virtual_price, debt)

                amount: uint256 = _amount
                if _is_deposit:
                    amount = min(_amount, PEGGED.balanceOf(self))
                else:
                    amount = min(_amount, debt)

                amounts: uint256[2] = empty(uint256[2])
                amounts[I] = amount
                lp_balance_diff: uint256 = POOL.calc_token_amount(amounts, _is_deposit)

                if _is_deposit:
                    lp_balance += lp_balance_diff
                    debt += amount
                else:
                    lp_balance -= lp_balance_diff
                    debt -= amount

                new_profit: uint256 = self._calc_profit_from(lp_balance, virtual_price, debt)
                if new_profit <= initial_profit:
                    return 0
                return new_profit - initial_profit

            @internal
            @pure
            def _calc_profit_from(lp_balance: uint256, virtual_price: uint256, debt: uint256) -> uint256:
                """
                @notice PegKeeper's profit calculation formula
                """
                lp_debt: uint256 = debt * PRECISION / virtual_price

                if lp_balance <= lp_debt:
                    return 0
                else:
                    return lp_balance - lp_debt
            ```

    === "Example"
        ```shell
        >>> PegKeeperV2.estimate_caller_profit()
        0
        ```


### `caller_share`
!!! description "`PegKeeperV2.caller_share() -> uint256: view`"

    Getter for the caller share, which represents the share of the profit generated when the `update()` function is called. This share is designed to incentivize users to call the function. SHARE_PRECISION is set to $10^5$.

    Returns: caller share (`uint256`)

    ??? quote "Source code"

        === "PegKeeperV2.vy"

            ```vyper
            event SetNewCallerShare:
                caller_share: uint256

            caller_share: public(uint256)

            @external
            def __init__(
                _pool: CurvePool, _caller_share: uint256,
                _factory: address, _regulator: Regulator, _admin: address,
            ):
                """
                @notice Contract constructor
                @param _pool Contract pool address
                @param _caller_share Caller's share of profit
                @param _factory Factory which should be able to take coins away
                @param _regulator Peg Keeper Regulator
                @param _admin Admin account
                """
                ...
                assert _caller_share <= SHARE_PRECISION  # dev: bad part value
                self.caller_share = _caller_share
                log SetNewCallerShare(_caller_share)
                ...
            ```

    === "Example"
        ```shell
        >>> PegKeeperV2.caller_share()
        20000
        ```


### `set_new_caller_share`
!!! description "`PegKeeperV2.set_new_caller_share(_new_caller_share: uint256)`"

    !!!guard "Guarded Methods"
        This function can only be called by the `admin` of the contract.

    Function to set a new caller share. New share need to be smaller or equal than `SHARE_PRECISION`, which is $10^5$.

    Emits: `SetNewCallerShare`

    | Input               | Type      | Description      |
    |---------------------|-----------|------------------|
    | `_new_caller_share` | `uint256` | New caller share |

    ??? quote "Source code"

        === "PegKeeperV2.vy"

            ```vyper
            event SetNewCallerShare:
                caller_share: uint256

            SHARE_PRECISION: constant(uint256) = 10 ** 5
            caller_share: public(uint256)

            admin: public(address)

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
        >>> soon
        ```


### `withdraw_profit`
!!! description "`PegKeeperV2.withdraw_profit() -> uint256`"

    Function to withdraw the profit generated by the PegKeeper. The profit is denominated in LP tokens and is transferred to the [`fee_receiver`](./PegKeeperRegulator.md#fee_receiver) specified in the `PegKeeperRegulator` contract.

    Returns: LP tokens withdrawn (`uint256`).

    ??? quote "Source code"

        === "PegKeeperV2.vy"

            ```vyper
            interface Regulator:
                def stablecoin() -> address: view
                def provide_allowed(_pk: address=msg.sender) -> uint256: view
                def withdraw_allowed(_pk: address=msg.sender) -> uint256: view
                def fee_receiver() -> address: view

            @external
            @nonpayable
            def withdraw_profit() -> uint256:
                """
                @notice Withdraw profit generated by Peg Keeper
                @return Amount of LP Token received
                """
                lp_amount: uint256 = self._calc_profit()
                POOL.transfer(self.regulator.fee_receiver(), lp_amount)

                log Profit(lp_amount)

                return lp_amount

            @internal
            @view
            def _calc_profit() -> uint256:
                """
                @notice Calculate PegKeeper's profit using current values
                """
                return self._calc_profit_from(POOL.balanceOf(self), POOL.get_virtual_price(), self.debt)

            @internal
            @pure
            def _calc_profit_from(lp_balance: uint256, virtual_price: uint256, debt: uint256) -> uint256:
                """
                @notice PegKeeper's profit calculation formula
                """
                lp_debt: uint256 = debt * PRECISION / virtual_price

                if lp_balance <= lp_debt:
                    return 0
                else:
                    return lp_balance - lp_debt
            ```

    === "Example"
        ```shell
        >>> soon
        ```


---


## **Action Delay**

The `action_delay` variable determines the time delay that needs to pass before the PegKeeper can provide or withdraw liquidity again via the `update` function.

### `action_delay`
!!! description "`PegKeeperV2.action_delay() -> uint256`"

    !!! warning
        Due to the missed declaration as a public variable, the `action_delay` does not have a public getter method that returns its value. Nonetheless, this does not impact the workings of the smart contract. Although there is no public getter, a new event is emitted when the variable is changed using the `set_new_action_delay` function.

        The `action_delay` was set to 12 seconds at contract initialization and an according `SetNewActionDelay` [was emitted](https://etherscan.io/tx/0xeb9d586749fe7b3ebf4e92134b088e667e3c7a882b969aab4d6429ce5022acee#eventlog#323).

    ??? quote "Source code"

        === "PegKeeperV2.vy"

            ```py
            @external
            def __init__(
                _pool: CurvePool, _caller_share: uint256,
                _factory: address, _regulator: Regulator, _admin: address,
            ):
                """
                @notice Contract constructor
                @param _pool Contract pool address
                @param _caller_share Caller's share of profit
                @param _factory Factory which should be able to take coins away
                @param _regulator Peg Keeper Regulator
                @param _admin Admin account
                """
                ...
                self.action_delay = 12  # 1 block
                log SetNewActionDelay(12)
                ...

            # Time between providing/withdrawing coins
            action_delay: uint256
            ```



### `set_new_action_delay`
!!! description "`PegKeeperV2.set_new_action_delay(_new_action_delay: uint256)`"

    !!!guard "Guarded Method"
        This function is only callable by the `admin` of the contract.

    Function to set a new `action_delay` value.

    Emits: `SetNewActionDelay`

    | Input               | Type      | Description            |
    | ------------------- | --------- | ---------------------- |
    | `_new_action_delay` | `uint256` | New action delay value |

    ??? quote "Source code"

        === "PegKeeperV2.vy"

            ```py
            event SetNewActionDelay:
                action_delay: uint256

            # Time between providing/withdrawing coins
            action_delay: uint256

            @external
            @nonpayable
            def set_new_action_delay(_new_action_delay: uint256):
                """
                @notice Set new action delay
                @param _new_action_delay Action delay in seconds
                """
                assert msg.sender == self.admin  # dev: only admin

                self.action_delay = _new_action_delay

                log SetNewActionDelay(_new_action_delay)
            ```

    === "Example"
        ```shell
        >>> soon
        ```


---


## **PegKeeperRegulator Contract**

The main use case of the `PegKeeperRegulator` contract is to supervise prices and other parameters, and to inform the PegKeeper whether it is allowed to provide or withdraw crvUSD. All PegKeepers share the same universal Regulator contract. More details on the `PegKeeperRegulator` contract can be found [here](./PegKeeperRegulator.md).


### `regulator`
!!! description "`PegKeeperV2.regulator() -> address: view`"

    Getter for the `PegKeeperRegulator` contract. This contract can be changed by the `admin` via the `set_new_regulator` function.

    Returns: regulator contract (`address`).

    Emits: `SetNewRegulator` at contract initialization

    ??? quote "Source code"

        === "PegKeeperV2.vy"

            ```vyper
            event SetNewRegulator:
                regulator: address

            regulator: public(Regulator)

            @external
            def __init__(
                _pool: CurvePool, _caller_share: uint256,
                _factory: address, _regulator: Regulator, _admin: address,
            ):
                """
                @notice Contract constructor
                @param _pool Contract pool address
                @param _caller_share Caller's share of profit
                @param _factory Factory which should be able to take coins away
                @param _regulator Peg Keeper Regulator
                @param _admin Admin account
                """
                ...
                self.regulator = _regulator
                log SetNewRegulator(_regulator.address)
                ...
            ```

    === "Example"
        ```shell
        >>> PegKeeperV2.regulator()
        '0x36a04CAffc681fa179558B2Aaba30395CDdd855f'
        ```


### `set_new_regulator`
!!! description "`PegKeeperV2.set_new_regulator(_new_regulator: Regulator)`"

    !!!guard "Guarded Methods"
        This function can only be called by the `admin` of the contract.

    Function to set a new regulator contract.

    Emits: `SetNewRegulator`

    | Input            | Type      | Description  |
    | ---------------- | --------- | ------------ |
    | `_new_regulator` | `address` | New regulator contract |

    ??? quote "Source code"

        === "PegKeeperV2.vy"

            ```vyper
            event SetNewRegulator:
                regulator: address

            regulator: public(Regulator)

            @external
            @nonpayable
            def set_new_regulator(_new_regulator: Regulator):
                """
                @notice Set new peg keeper regulator
                """
                assert msg.sender == self.admin  # dev: only admin
                assert _new_regulator.address != empty(address)  # dev: bad regulator

                self.regulator = _new_regulator
                log SetNewRegulator(_new_regulator.address)
            ```

    === "Example"
        ```shell
        >>> soon
        ```


---


## **Contract Ownership**

Ownership of the PegKeepers adheres to the standard procedure. The transition of ownership can only be done by the `admin`. Following this commit, the designated `future_admin`, specified at the time of commitment, is required to apply the changes to complete the change of ownership.


### `admin`
!!! description "`PegKeeperV2.admin() -> address: view`"

    Getter for the current admin of the PegKeeper. The admin can only be changed by the admin by via the [`commit_new_admin`](#commit_new_admin) function.

    Returns: current admin (`address`).

    Emits: `ApplyNewAdmin` at contract initialization

    ??? quote "Source code"

        === "PegKeeperV2.vy"

            ```vyper
            event ApplyNewAdmin:
                admin: address

            admin: public(address)

            @external
            def __init__(
                _pool: CurvePool, _caller_share: uint256,
                _factory: address, _regulator: Regulator, _admin: address,
            ):
                """
                @notice Contract constructor
                @param _pool Contract pool address
                @param _caller_share Caller's share of profit
                @param _factory Factory which should be able to take coins away
                @param _regulator Peg Keeper Regulator
                @param _admin Admin account
                """
                ...
                self.admin = _admin
                log ApplyNewAdmin(msg.sender)
                ...
            ```

    === "Example"
        ```shell
        >>> PegKeeperV2.admin()
        '0x40907540d8a6C65c637785e8f8B742ae6b0b9968'
        ```


### `future_admin`
!!! description "`PegKeeperV2.future_admin() -> address: view`"

    Getter for the future admin of the PegKeeper. This variable is set when committing a new admin.

    Returns: future admin (`address`).

    ??? quote "Source code"

        === "PegKeeperV2.vy"

            ```vyper
            future_admin: public(address)
            ```

    === "Example"
        ```shell
        >>> PegKeeperV2.future_admin()
        '0x0000000000000000000000000000000000000000'
        ```


### `commit_new_admin`
!!! description "`PegKeeperV2.commit_new_admin(_new_admin: address)`"

    !!!guard "Guarded Method"
        This function is only callable by the `admin` of the contract.

    Function to commit `_new_admin` as the new admin of the PegKeeper. For the admin to change, the future admin need to apply the changes via `apply_new_admin`.

    Emits: `CommitNewAdmin`

    | Input        | Type      | Description |
    | ------------ | --------- | ----------- |
    | `_new_admin` | `address` | New admin   |

    ??? quote "Source code"

        === "PegKeeperV2.vy"

            ```vyper
            event CommitNewAdmin:
                admin: address

            admin: public(address)
            future_admin: public(address)

            @external
            @nonpayable
            def commit_new_admin(_new_admin: address):
                """
                @notice Commit new admin of the Peg Keeper
                @dev In order to revert, commit_new_admin(current_admin) may be called
                @param _new_admin Address of the new admin
                """
                assert msg.sender == self.admin  # dev: only admin
                assert _new_admin != empty(address)  # dev: bad admin

                self.new_admin_deadline = block.timestamp + ADMIN_ACTIONS_DELAY
                self.future_admin = _new_admin

                log CommitNewAdmin(_new_admin)
            ```

    === "Example"
        ```shell
        >>> soon
        ```


### `apply_new_admin`
!!! description "`PegKeeperV2.apply_new_admin()`"

    !!!guard "Guarded Method"
        This function is only callable by the `future_admin` of the contract.

    Function to apply the new admin. This method sets the `future_admin` set in `commit_new_admin` as the new `admin`. Additionally, there is a delay of three days (`ADMIN_ACTIONS_DELAY`) starting with the `commit_new_admin` call. Only after the delay has passed can the new admin be applied.

    Emits: `ApplyNewAdmin`

    ??? quote "Source code"

        === "PegKeeperV2.vy"

            ```vyper
            event ApplyNewAdmin:
                admin: address

            ADMIN_ACTIONS_DELAY: constant(uint256) = 3 * 86400

            admin: public(address)
            future_admin: public(address)

            @external
            @nonpayable
            def apply_new_admin():
                """
                @notice Apply new admin of the Peg Keeper
                @dev Should be executed from new admin
                """
                new_admin: address = self.future_admin
                new_admin_deadline: uint256 = self.new_admin_deadline
                assert msg.sender == new_admin  # dev: only new admin
                assert block.timestamp >= new_admin_deadline  # dev: insufficient time
                assert new_admin_deadline != 0  # dev: no active action

                self.admin = new_admin
                self.new_admin_deadline = 0

                log ApplyNewAdmin(new_admin)
            ```

    === "Example"
        ```shell
        >>> soon
        ```


### `new_admin_deadline`
!!! description "`PegKeeperV2.new_admin_deadline() -> uint256: view`"

    Getter for the admin deadline. When committing a new admin, there is a delay of three days (`ADMIN_ACTIONS_DELAY`) before the change of ownership can be applied. Otherwise the call will revert.

    Returns: timestamp after which the new admin can be applied (`uint256`)

    ??? quote "Source code"

        === "PegKeeperV2.vy"

            ```vyper
            new_admin_deadline: public(uint256)
            ```

    === "Example"
        ```shell
        >>> PegKeeperV2.new_admin_deadline()
        0
        ```


---


## **Contract Info Methods**

### `debt`
!!! description "`PegKeeperV2.debt() -> uint256: view`"

    Getter for the current debt of the PegKeeper. Debt increases when crvUSD is provided to the liquidity pool and decreases when crvUSD is withdrawn again. The debt is denominated in crvUSD tokens.

    Returns: current debt (`uint256`).

    ??? quote "Source code"

        === "PegKeeperV2.vy"

            ```vyper
            debt: public(uint256)
            ```

    === "Example"
        ```shell
        >>> PegKeeperV2.debt()
        0
        ```


### `pool`
!!! description "`PegKeeperV2.pool() -> address: view`"

    Getter for the pool that the PegKeeper provides to or withdraws from.

    Returns: liquidity pool (`address`).

    ??? quote "Source code"

        === "PegKeeperV2.vy"

            ```vyper
            POOL: immutable(CurvePool)

            @pure
            @external
            def pool() -> CurvePool:
                """
                @return StableSwap pool being used
                """
                return POOL

            @external
            def __init__(
                _pool: CurvePool, _receiver: address, _caller_share: uint256,
                _factory: address, _regulator: Regulator, _admin: address,
            ):
                """
                @notice Contract constructor
                @param _pool Contract pool address
                @param _receiver Receiver of the profit
                @param _caller_share Caller's share of profit
                @param _factory Factory which should be able to take coins away
                @param _regulator Peg Keeper Regulator
                @param _admin Admin account
                """
                POOL = _pool
                ...
            ```

    === "Example"
        ```shell
        >>> PegKeeperV2.pool()
        '0x4DEcE678ceceb27446b35C672dC7d61F30bAD69E'
        ```


### `FACTORY`
!!! description "`PegKeeperV2.FACTORY() -> address: view`"

    Getter for the Factory contract. This address is able to take coins away in the case of reducing the debt limit of a PegKeeper. Due to this, maximum approval is granted to this address when initializing the contract.

    Returns: Factory (`address`).

    ??? quote "Source code"

        === "PegKeeperV2.vy"

            ```vyper
            FACTORY: immutable(address)

            @external
            def __init__(
                _pool: CurvePool, _receiver: address, _caller_share: uint256,
                _factory: address, _regulator: Regulator, _admin: address,
            ):
                """
                @notice Contract constructor
                @param _pool Contract pool address
                @param _receiver Receiver of the profit
                @param _caller_share Caller's share of profit
                @param _factory Factory which should be able to take coins away
                @param _regulator Peg Keeper Regulator
                @param _admin Admin account
                """
                ...
                pegged.approve(_factory, max_value(uint256))
                ...
                FACTORY = _factory
            ```

    === "Example"
        ```shell
        >>> PegKeeperV2.FACTORY()
        '0xC9332fdCB1C491Dcc683bAe86Fe3cb70360738BC'
        ```


### `pegged`
!!! description "`PegKeeperV2.pegged() -> address: view`"

    Getter for the pegged coin, which is crvUSD.

    Returns: pegged coin (`address`).

    ??? quote "Source code"

        === "PegKeeperV2.vy"

            ```vyper
            PEGGED: immutable(ERC20)

            @external
            def __init__(
                _pool: CurvePool, _receiver: address, _caller_share: uint256,
                _factory: address, _regulator: Regulator, _admin: address,
            ):
                """
                @notice Contract constructor
                @param _pool Contract pool address
                @param _receiver Receiver of the profit
                @param _caller_share Caller's share of profit
                @param _factory Factory which should be able to take coins away
                @param _regulator Peg Keeper Regulator
                @param _admin Admin account
                """
                ...
                pegged: ERC20 = ERC20(_regulator.stablecoin())
                PEGGED = pegged
                pegged.approve(_pool.address, max_value(uint256))
                pegged.approve(_factory, max_value(uint256))
                ...
            ```

    === "Example"
        ```shell
        >>> PegKeeperV2.pegged()
        '0xf939E0A03FB07F59A73314E73794Be0E57ac1b4E'
        ```


### `IS_INVERSE`
!!! description "`PegKeeperV2.IS_INVERSE() -> bool: view`"

    Getter to check if crvUSD token index in the pool is inverse. This variable is set when initializing the contract. If crvUSD is coin[0] in the liquidity pool, `IS_INVERSE` will be set to `true`. This variable is not directly relevant in the PegKeeper contract, but it is of great importance in the `PegKeeperRegulator` regarding calculations with oracles.

    Returns: true or false (`bool`).

    ??? quote "Source code"

        === "PegKeeperV2.vy"

            ```vyper
            IS_INVERSE: public(immutable(bool))

            @external
            def __init__(
                _pool: CurvePool, _receiver: address, _caller_share: uint256,
                _factory: address, _regulator: Regulator, _admin: address,
            ):
                """
                @notice Contract constructor
                @param _pool Contract pool address
                @param _receiver Receiver of the profit
                @param _caller_share Caller's share of profit
                @param _factory Factory which should be able to take coins away
                @param _regulator Peg Keeper Regulator
                @param _admin Admin account
                """
                ...
                for i in range(2):
                    if coins[i] == pegged:
                        I = i
                        IS_INVERSE = (i == 0)
                    else:
                        PEG_MUL = 10 ** (18 - coins[i].decimals())
            ```

    === "Example"
        ```shell
        >>> PegKeeperV2.IS_INVERSE()
        'False'
        ```


### `IS_NG`
!!! description "`PegKeeperV2.IS_NG() -> bool: view`"

    Getter to check if the pool associated with the PegKeeper is a new generation (NG) pool. This is important when adding and removing liquidity, as the interface of NG pools is slightly different from the prior ones.

    Returns: true or false (`bool`).

    ??? quote "Source code"

        === "PegKeeperV2.vy"

            ```vyper
            IS_NG: public(immutable(bool))  # Interface for CurveStableSwapNG

            @external
            def __init__(
                _pool: CurvePool, _caller_share: uint256,
                _factory: address, _regulator: Regulator, _admin: address,
            ):
                """
                @notice Contract constructor
                @param _pool Contract pool address
                @param _caller_share Caller's share of profit
                @param _factory Factory which should be able to take coins away
                @param _regulator Peg Keeper Regulator
                @param _admin Admin account
                """
                ...

                IS_NG = raw_call(
                    _pool.address, _abi_encode(convert(0, uint256), method_id=method_id("price_oracle(uint256)")),
                    revert_on_failure=False
                )

                ...
            ```

    === "Example"
        ```shell
        >>> PegKeeperV2.IS_NG()
        'False'
        ```
