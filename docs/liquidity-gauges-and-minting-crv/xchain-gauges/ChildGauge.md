<h1>Child Gauge Implementation</h1>

The `ChildGauge` is the liquidity gauge contract on the sidechain. It is used to track the balance of liquidity providers and distribute CRV emissions to them. It is pretty much the same as the `Gauge` contract on Ethereum mainnet.

???+ vyper "`ChildGauge.vy`"
    The source code for the `ChildGauge.vy` contract can be found on [:material-github: GitHub](https://github.com/curvefi/curve-xchain-factory/blob/master/contracts/implementations/ChildGauge.vy). The contract is written using [Vyper](https://github.com/vyperlang/vyper) version `0.3.10` 

---

# **Initialization**

### `initialize`
!!! description "`ChildGauge.initialize(_lp_token: address, _root: address, _manager: address)`"

    Function to initialize the gauge. A child gauge is initialized directly when deploying it from the `ChildGaugeFactory` via the [`deploy_gauge`](./ChildGaugeFactory.md#deploy_gauge) function.

    | Parameter | Type | Description |
    | --------- | ---- | ------------ |
    | `_lp_token` | `address` | The LP token address |
    | `_root` | `address` | The root gauge address |
    | `_manager` | `address` | The manager address |

    ??? quote "Source code"

        === "ChildGauge.vy"

            ```python
            @external
            def initialize(_lp_token: address, _root: address, _manager: address):
                assert self.lp_token == empty(address)  # dev: already initialized

                self.lp_token = _lp_token
                self.root_gauge = _root
                self.manager = _manager

                self.voting_escrow = Factory(msg.sender).voting_escrow()

                symbol: String[32] = ERC20Extended(_lp_token).symbol()
                name: String[64] = concat("Curve.fi ", symbol, " Gauge Deposit")

                self.name = name
                self.symbol = concat(symbol, "-gauge")

                self.period_timestamp[0] = block.timestamp
                self.DOMAIN_SEPARATOR = keccak256(
                    _abi_encode(
                        EIP712_TYPEHASH,
                        keccak256(name),
                        keccak256(VERSION),
                        chain.id,
                        self
                    )
                )
            ```

    === "Example"

        ```python
        >>> ChildGauge.initialize(lp_token, root, manager)
        ```


---


# **Depositing & Withdrawing**

### `deposit`
!!! description "`ChildGauge.deposit(_value: uint256, _addr: address = msg.sender, _claim_rewards: bool = False)`"

    Function to deposit `_value` of LP tokens into the gauge. When depositing LP tokens into the gauge, the contract mints the equivalent amount of "gauge tokens" to the user which represent the user's share of liquidity in the gauge. Additionally, the function also allows for claiming any pending external rewards (not CRV emissions).

    Emits: `Deposit`, `Transfer`, `UpdateLiquidityLimit` events.

    | Parameter | Type | Description |
    | --------- | ---- | ------------ |
    | `_value` | `uint256` | The amount of liquidity to deposit |
    | `_addr` | `address` | The address to deposit for |
    | `_claim_rewards` | `bool` | Whether to claim rewards. Defaults to `False` |

    ??? quote "Source code"

        === "ChildGauge.vy"

            ```python
            event Deposit:
                provider: indexed(address)
                value: uint256

            event UpdateLiquidityLimit:
                user: indexed(address)
                original_balance: uint256
                original_supply: uint256
                working_balance: uint256
                working_supply: uint256

            event Transfer:
                _from: indexed(address)
                _to: indexed(address)
                _value: uint256

            @external
            @nonreentrant('lock')
            def deposit(_value: uint256, _addr: address = msg.sender, _claim_rewards: bool = False):
                """
                @notice Deposit `_value` LP tokens
                @dev Depositting also claims pending reward tokens
                @param _value Number of tokens to deposit
                @param _addr Address to deposit for
                """
                assert _addr != empty(address)  # dev: cannot deposit for zero address
                self._checkpoint(_addr)

                if _value != 0:
                    is_rewards: bool = self.reward_count != 0
                    total_supply: uint256 = self.totalSupply
                    if is_rewards:
                        self._checkpoint_rewards(_addr, total_supply, _claim_rewards, empty(address))

                    total_supply += _value
                    new_balance: uint256 = self.balanceOf[_addr] + _value
                    self.balanceOf[_addr] = new_balance
                    self.totalSupply = total_supply

                    self._update_liquidity_limit(_addr, new_balance, total_supply)

                    ERC20(self.lp_token).transferFrom(msg.sender, self, _value)

                    log Deposit(_addr, _value)
                    log Transfer(empty(address), _addr, _value)

            @internal
            def _checkpoint(_user: address):
                """
                @notice Checkpoint a user calculating their CRV entitlement
                @param _user User address
                """
                period: int128 = self.period
                period_time: uint256 = self.period_timestamp[period]
                integrate_inv_supply: uint256 = self.integrate_inv_supply[period]

                if block.timestamp > period_time:

                    working_supply: uint256 = self.working_supply
                    prev_week_time: uint256 = period_time
                    week_time: uint256 = min((period_time + WEEK) / WEEK * WEEK, block.timestamp)

                    for i in range(256):
                        dt: uint256 = week_time - prev_week_time

                        if working_supply != 0:
                            # we don't have to worry about crossing inflation epochs
                            # and if we miss any weeks, those weeks inflation rates will be 0 for sure
                            # but that means no one interacted with the gauge for that long
                            integrate_inv_supply += self.inflation_rate[prev_week_time / WEEK] * 10 ** 18 * dt / working_supply

                        if week_time == block.timestamp:
                            break
                        prev_week_time = week_time
                        week_time = min(week_time + WEEK, block.timestamp)

                # check CRV balance and increase weekly inflation rate by delta for the rest of the week
                crv: ERC20 = FACTORY.crv()
                if crv != empty(ERC20):
                    crv_balance: uint256 = crv.balanceOf(self)
                    if crv_balance != 0:
                        current_week: uint256 = block.timestamp / WEEK
                        self.inflation_rate[current_week] += crv_balance / ((current_week + 1) * WEEK - block.timestamp)
                        crv.transfer(FACTORY.address, crv_balance)

                period += 1
                self.period = period
                self.period_timestamp[period] = block.timestamp
                self.integrate_inv_supply[period] = integrate_inv_supply

                working_balance: uint256 = self.working_balances[_user]
                self.integrate_fraction[_user] += working_balance * (integrate_inv_supply - self.integrate_inv_supply_of[_user]) / 10 ** 18
                self.integrate_inv_supply_of[_user] = integrate_inv_supply
                self.integrate_checkpoint_of[_user] = block.timestamp

            @internal
            def _update_liquidity_limit(_user: address, _user_balance: uint256, _total_supply: uint256):
                """
                @notice Calculate working balances to apply amplification of CRV production.
                @dev https://resources.curve.finance/guides/boosting-your-crv-rewards#formula
                @param _user The user address
                @param _user_balance User's amount of liquidity (LP tokens)
                @param _total_supply Total amount of liquidity (LP tokens)
                """
                working_balance: uint256 = _user_balance * TOKENLESS_PRODUCTION / 100

                ve: address = self.voting_escrow
                if ve != empty(address):
                    ve_ts: uint256 = ERC20(ve).totalSupply()
                    if ve_ts != 0:
                        working_balance += _total_supply * ERC20(ve).balanceOf(_user) / ve_ts * (100 - TOKENLESS_PRODUCTION) / 100
                        working_balance = min(_user_balance, working_balance)

                old_working_balance: uint256 = self.working_balances[_user]
                self.working_balances[_user] = working_balance

                working_supply: uint256 = self.working_supply + working_balance - old_working_balance
                self.working_supply = working_supply

                log UpdateLiquidityLimit(_user, _user_balance, _total_supply, working_balance, working_supply)
            ```

    === "Example"

        :material-information-outline:{ title='This interactive example fetches the output directly on-chain.' } In this example, the total number of receivers is returned.

        <div class="highlight">
        <pre><code>>>> FeeSplitter.n_receivers()
        <span id="nReceiversOutput"></span></code></pre>
        </div>


### `withdraw`
!!! description "`ChildGauge.withdraw(_value: uint256, _claim_rewards: bool = False, _receiver: address = msg.sender)`"

    Function to withdraw `_value` of LP tokens from the gauge. When withdrawing LP tokens from the gauge, the contract burns the equivalent amount of "gauge tokens" from the user. Additionally, the function also allows for claiming any pending external rewards (not CRV emissions).

    Emits: `Withdraw`, `Transfer` events.

    | Parameter | Type | Description |
    | --------- | ---- | ------------ |
    | `_value` | `uint256` | The amount of liquidity to withdraw |
    | `_claim_rewards` | `bool` | Whether to claim rewards. Defaults to `False` |
    | `_receiver` | `address` | The address to transfer the withdrawn LP tokens to. Defaults to `msg.sender` |

    ??? quote "Source code"

        === "ChildGauge.vy"

            ```python
            event Withdraw:
                provider: indexed(address)
                value: uint256

            event UpdateLiquidityLimit:
                user: indexed(address)
                original_balance: uint256
                original_supply: uint256
                working_balance: uint256
                working_supply: uint256

            event Transfer:
                _from: indexed(address)
                _to: indexed(address)
                _value: uint256

            @external
            @nonreentrant('lock')
            def withdraw(_value: uint256, _claim_rewards: bool = False, _receiver: address = msg.sender):
                """
                @notice Withdraw `_value` LP tokens
                @dev Withdrawing also claims pending reward tokens
                @param _value Number of tokens to withdraw
                @param _claim_rewards Whether to claim rewards
                @param _receiver Receiver of withdrawn LP tokens
                """
                self._checkpoint(msg.sender)

                if _value != 0:
                    is_rewards: bool = self.reward_count != 0
                    total_supply: uint256 = self.totalSupply
                    if is_rewards:
                        self._checkpoint_rewards(msg.sender, total_supply, _claim_rewards, empty(address))

                    total_supply -= _value
                    new_balance: uint256 = self.balanceOf[msg.sender] - _value
                    self.balanceOf[msg.sender] = new_balance
                    self.totalSupply = total_supply

                    self._update_liquidity_limit(msg.sender, new_balance, total_supply)

                    ERC20(self.lp_token).transfer(_receiver, _value)

                log Withdraw(msg.sender, _value)
                log Transfer(msg.sender, empty(address), _value)

            @internal
            def _checkpoint(_user: address):
                """
                @notice Checkpoint a user calculating their CRV entitlement
                @param _user User address
                """
                period: int128 = self.period
                period_time: uint256 = self.period_timestamp[period]
                integrate_inv_supply: uint256 = self.integrate_inv_supply[period]

                if block.timestamp > period_time:

                    working_supply: uint256 = self.working_supply
                    prev_week_time: uint256 = period_time
                    week_time: uint256 = min((period_time + WEEK) / WEEK * WEEK, block.timestamp)

                    for i in range(256):
                        dt: uint256 = week_time - prev_week_time

                        if working_supply != 0:
                            # we don't have to worry about crossing inflation epochs
                            # and if we miss any weeks, those weeks inflation rates will be 0 for sure
                            # but that means no one interacted with the gauge for that long
                            integrate_inv_supply += self.inflation_rate[prev_week_time / WEEK] * 10 ** 18 * dt / working_supply

                        if week_time == block.timestamp:
                            break
                        prev_week_time = week_time
                        week_time = min(week_time + WEEK, block.timestamp)

                # check CRV balance and increase weekly inflation rate by delta for the rest of the week
                crv: ERC20 = FACTORY.crv()
                if crv != empty(ERC20):
                    crv_balance: uint256 = crv.balanceOf(self)
                    if crv_balance != 0:
                        current_week: uint256 = block.timestamp / WEEK
                        self.inflation_rate[current_week] += crv_balance / ((current_week + 1) * WEEK - block.timestamp)
                        crv.transfer(FACTORY.address, crv_balance)

                period += 1
                self.period = period
                self.period_timestamp[period] = block.timestamp
                self.integrate_inv_supply[period] = integrate_inv_supply

                working_balance: uint256 = self.working_balances[_user]
                self.integrate_fraction[_user] += working_balance * (integrate_inv_supply - self.integrate_inv_supply_of[_user]) / 10 ** 18
                self.integrate_inv_supply_of[_user] = integrate_inv_supply
                self.integrate_checkpoint_of[_user] = block.timestamp
            ```

    === "Example"

        :material-information-outline:{ title='This interactive example fetches the output directly on-chain.' } In this example, the total number of receivers is returned.

        <div class="highlight">
        <pre><code>>>> FeeSplitter.n_receivers()
        <span id="nReceiversOutput"></span></code></pre>
        </div>


---


# **External Rewards**

External rewards are externally added rewards (not coming from the CRV emissions) and are not boostable. They are distributed linearly over the chosen period to users based on their liquidity share of the gauge. Between 3 days and a year, week by default.

The following functions allow for claiming external rewards (not CRV emissions). CRV emissions can only be claimed directly from the `ChildGaugeFactory`.

## **Claiming Rewards**

### `claim_rewards`
!!! description "`ChildGauge.claim_rewards(_addr: address = msg.sender, _receiver: address = empty(address))`"

    Function to claim available reward tokens for a given address. Claimed rewards cannot be redirected to a different address when claiming for another user.

    | Parameter | Type | Description |
    | --------- | ---- | ------------ |
    | `_addr` | `address` | The address to claim rewards for. Defaults to `msg.sender` |
    | `_receiver` | `address` | The address to transfer rewards to. Defaults to `empty(address)` |

    ??? quote "Source code"

        === "ChildGauge.vy"

            ```python
            @external
            @nonreentrant('lock')
            def claim_rewards(_addr: address = msg.sender, _receiver: address = empty(address)):
                """
                @notice Claim available reward tokens for `_addr`
                @param _addr Address to claim for
                @param _receiver Address to transfer rewards to - if set to
                                empty(address), uses the default reward receiver
                                for the caller
                """
                if _receiver != empty(address):
                    assert _addr == msg.sender  # dev: cannot redirect when claiming for another user
                self._checkpoint_rewards(_addr, self.totalSupply, True, _receiver)

            @internal
            def _checkpoint_rewards(_user: address, _total_supply: uint256, _claim: bool, _receiver: address):
                """
                @notice Claim pending rewards and checkpoint rewards for a user
                """

                user_balance: uint256 = 0
                receiver: address = _receiver
                if _user != empty(address):
                    user_balance = self.balanceOf[_user]
                    if _claim and _receiver == empty(address):
                        # if receiver is not explicitly declared, check if a default receiver is set
                        receiver = self.rewards_receiver[_user]
                        if receiver == empty(address):
                            # if no default receiver is set, direct claims to the user
                            receiver = _user

                reward_count: uint256 = self.reward_count
                for i in range(MAX_REWARDS):
                    if i == reward_count:
                        break
                    token: address = self.reward_tokens[i]

                    integral: uint256 = self.reward_data[token].integral
                    period_finish: uint256 = self.reward_data[token].period_finish
                    last_update: uint256 = min(block.timestamp, period_finish)
                    duration: uint256 = last_update - self.reward_data[token].last_update

                    if duration != 0 and _total_supply != 0:
                        self.reward_data[token].last_update = last_update

                        rate: uint256 = self.reward_data[token].rate
                        excess: uint256 = self.reward_remaining[token] - (period_finish - last_update + duration) * rate
                        integral_change: uint256 = (duration * rate + excess) * 10**18 / _total_supply
                        integral += integral_change
                        self.reward_data[token].integral = integral
                        # There is still calculation error in user's claimable amount,
                        # but it has 18-decimal precision through LP(_total_supply) – safe
                        self.reward_remaining[token] -= integral_change * _total_supply / 10**18

                    if _user != empty(address):
                        integral_for: uint256 = self.reward_integral_for[token][_user]
                        new_claimable: uint256 = 0

                        if integral_for < integral:
                            self.reward_integral_for[token][_user] = integral
                            new_claimable = user_balance * (integral - integral_for) / 10**18

                        claim_data: uint256 = self.claim_data[_user][token]
                        total_claimable: uint256 = (claim_data >> 128) + new_claimable
                        if total_claimable > 0:
                            total_claimed: uint256 = claim_data % 2**128
                            if _claim:
                                assert ERC20(token).transfer(receiver, total_claimable, default_return_value=True)
                                self.claim_data[_user][token] = total_claimed + total_claimable
                            elif new_claimable > 0:
                                self.claim_data[_user][token] = total_claimed + (total_claimable << 128)
            ```

    === "Example"

        ```python
        >>> soon
        ```


### `claimed_reward`
!!! description "`ChildGauge.claimed_reward(_addr: address, _token: address) -> uint256`"

    Function to get the number of claimed reward tokens for a user.

    Returns: number of claimed reward tokens for a user (`uint256`).

    | Parameter | Type | Description |
    | --------- | ---- | ------------ |
    | `_addr` | `address` | The address to get the number of claimed rewards for |
    | `_token` | `address` | The token to get the number of claimed rewards for |

    ??? quote "Source code"

        === "ChildGauge.vy"

            ```python
            reward_data: public(HashMap[address, Reward])

            @view
            @external
            def claimed_reward(_addr: address, _token: address) -> uint256:
                """
                @notice Get the number of already-claimed reward tokens for a user
                @param _addr Account to get reward amount for
                @param _token Token to get reward amount for
                @return uint256 Total amount of `_token` already claimed by `_addr`
                """
                return self.claim_data[_addr][_token] % 2**128
            ```

    === "Example"

        ```python
        >>> ChildGauge.claimed_reward(todo)
        ```


### `claimable_reward`
!!! description "`ChildGauge.claimable_reward(_user: address, _reward_token: address) -> uint256`"

    Function to get the number of claimable reward tokens for a user.

    Returns: number of claimable reward tokens for a user (`uint256`).

    | Parameter | Type | Description |
    | --------- | ---- | ------------ |
    | `_user` | `address` | The address to get the number of claimable rewards for |
    | `_reward_token` | `address` | The token to get the number of claimable rewards for |

    ??? quote "Source code"

        === "ChildGauge.vy"

            ```python
            totalSupply: public(uint256)

            # For tracking external rewards
            reward_count: public(uint256)
            reward_data: public(HashMap[address, Reward])
            reward_remaining: public(HashMap[address, uint256])  # fixes bad precision

            @view
            @external
            def claimable_reward(_user: address, _reward_token: address) -> uint256:
                """
                @notice Get the number of claimable reward tokens for a user
                @param _user Account to get reward amount for
                @param _reward_token Token to get reward amount for
                @return uint256 Claimable reward token amount
                """
                integral: uint256 = self.reward_data[_reward_token].integral
                total_supply: uint256 = self.totalSupply
                if total_supply != 0:
                    last_update: uint256 = min(block.timestamp, self.reward_data[_reward_token].period_finish)
                    duration: uint256 = last_update - self.reward_data[_reward_token].last_update
                    integral += (duration * self.reward_data[_reward_token].rate * 10**18 / total_supply)

                integral_for: uint256 = self.reward_integral_for[_reward_token][_user]
                new_claimable: uint256 = self.balanceOf[_user] * (integral - integral_for) / 10**18

                return (self.claim_data[_user][_reward_token] >> 128) + new_claimable
            ```

    === "Example"

        ```python
        >>> soon
        ```


### `rewards_receiver`
!!! description "`ChildGauge.rewards_receiver(_user: address) -> address: view`"

    Getter for the reward receiver of the caller. By default, this value is set to `empty(address)`, which means the rewards will be claimed to the user. But e.g. for integrations like Convex, the `rewards_receiver` is set to another contract address, from which the rewards are further distributed.

    Returns: reward receiver for a user (`address`).

    | Parameter | Type | Description |
    | --------- | ---- | ------------ |
    | `_user` | `address` | The user to get the reward receiver for. |

    ??? quote "Source code"

        === "ChildGauge.vy"

            ```python
            # claimant -> default reward receiver
            rewards_receiver: public(HashMap[address, address])
            ```

    === "Example"

        ```python
        >>> ChildGauge.rewards_receiver('0x1234567890123456789012345678901234567890')
        '0x0000000000000000000000000000000000000000'
        ```


### `set_rewards_receiver`
!!! description "`ChildGauge.set_rewards_receiver(_receiver: address)`"

    Function to set the default reward receiver for the caller. When set to empty(address), rewards are sent to the caller.

    | Parameter | Type | Description |
    | --------- | ---- | ------------ |
    | `_receiver` | `address` | The address to set as the default reward receiver for |

    ??? quote "Source code"

        === "ChildGauge.vy"

            ```python
            # claimant -> default reward receiver
            rewards_receiver: public(HashMap[address, address])

            @external
            def set_rewards_receiver(_receiver: address):
                """
                @notice Set the default reward receiver for the caller.
                @dev When set to empty(address), rewards are sent to the caller
                @param _receiver Receiver address for any rewards claimed via `claim_rewards`
                """
                self.rewards_receiver[msg.sender] = _receiver
            ```

    === "Example"

        ```python
        >>> ChildGauge.rewards_receiver('0x1234567890123456789012345678901234567890')
        '0x0000000000000000000000000000000000000000'

        >>> ChildGauge.set_rewards_receiver('0x1234567890123456789012345678901234567890')

        >>> ChildGauge.rewards_receiver('0x1234567890123456789012345678901234567890')
        '0x1234567890123456789012345678901234567890'
        ```


---


## **Reward Data**

The following functions allow for retrieving reward data for a specific reward token.

### `reward_data`
!!! description "`ChildGauge.reward_data(_reward_token: address) -> Reward: view`"

    Getter for the reward data for a specific reward token.

    Returns: Reward struct containing the distributor (`address`), period finish (`uint256`), rate (`uint256`), last update (`uint256`), and integral (`uint256`).

    | Parameter | Type | Description |
    | --------- | ---- | ------------ |
    | `_reward_token` | `address` | The reward token to get the reward data for |

    ??? quote "Source code"

        === "ChildGauge.vy"

            ```python
            struct Reward:
                distributor: address
                period_finish: uint256
                rate: uint256
                last_update: uint256
                integral: uint256

            reward_data: public(HashMap[address, Reward])
            ```

    === "Example"

        ```py
        >>> soon
        ```


### `reward_tokens`
!!! description "`ChildGauge.reward_tokens(arg0: uint256) -> address: view`"

    Getter for the added reward token at index `arg0`. New tokens are populated to this variable when calling the `add_reward` function.

    Returns: reward token at index `arg0` (`address`).

    | Parameter | Type | Description |
    | --------- | ---- | ------------ |
    | `arg0` | `uint256` | The index of the reward token to get |

    ??? quote "Source code"

        === "ChildGauge.vy"

            ```python
            # array of reward tokens
            reward_tokens: public(address[MAX_REWARDS])
            ```

    === "Example"

        ```python
        >>> soon
        ```


### `reward_count`
!!! description "`ChildGauge.reward_count() -> uint256: view`"

    Getter for the number of reward tokens. This value is incremented by one for each new reward token added via `add_reward`.

    Returns: number of reward tokens (`uint256`).

    ??? quote "Source code"

        === "ChildGauge.vy"

            ```python
            reward_count: public(uint256)
            ```

    === "Example"

        ```python
        >>> soon
        ```


### `reward_integral_for`
!!! description "`ChildGauge.reward_integral_for(_reward_token: address, _claiming_address: address) -> uint256: view`"

    Getter for the reward integral for a specific reward token and claiming address.

    Returns: reward integral (`uint256`).

    | Parameter | Type | Description |
    | --------- | ---- | ------------ |
    | `_reward_token` | `address` | The reward token to get the reward integral for |
    | `_claiming_address` | `address` | The address to get the reward integral for |

    ??? quote "Source code"

        === "ChildGauge.vy"

            ```python
            # reward token -> claiming address -> integral
            reward_integral_for: public(HashMap[address, HashMap[address, uint256]])
            ```

    === "Example"

        ```python
        >>> soon
        ```


### `reward_remaining`
!!! description "`ChildGauge.reward_remaining(_reward_token: address) -> uint256: view`"

    Getter for the remaining reward for a specific reward token.

    Returns: the remaining reward for a specific reward token (`uint256`).

    | Parameter | Type | Description |
    | --------- | ---- | ------------ |
    | `_reward_token` | `address` | The reward token to get the remaining reward for |

    ??? quote "Source code"

        === "ChildGauge.vy"

            ```python
            reward_remaining: public(HashMap[address, uint256])  # fixes bad precision
            ```

    === "Example"

        ```python
        >>> soon
        ```


### `recover_remaining`
!!! description "`ChildGauge.integrate_checkpoint_of(_user: address) -> uint256: view`"

    Getter for the timestamp of the last checkpoint for a user.

    | Parameter | Type | Description |
    | --------- | ---- | ------------ |
    | `_user` | `address` | The user address to get the integrate checkpoint for |

    ??? quote "Source code"

        === "ChildGauge.vy"

            ```python
            # For tracking external rewards
            reward_count: public(uint256)
            reward_data: public(HashMap[address, Reward])
            reward_remaining: public(HashMap[address, uint256])  # fixes bad precision

            @external
            def recover_remaining(_reward_token: address):
                """
                @notice Recover reward token remaining after calculation errors. Helpful for small decimal tokens.
                Remaining tokens will be claimable in favor of distributor. Callable by anyone after reward distribution finished.
                @param _reward_token The reward token being recovered
                """
                self._checkpoint_rewards(empty(address), self.totalSupply, False, empty(address))

                period_finish: uint256 = self.reward_data[_reward_token].period_finish
                assert period_finish < block.timestamp
                assert self.reward_data[_reward_token].last_update >= period_finish

                assert ERC20(_reward_token).transfer(self.reward_data[_reward_token].distributor,
                    self.reward_remaining[_reward_token], default_return_value=True)
                self.reward_remaining[_reward_token] = 0

            @internal
            def _checkpoint_rewards(_user: address, _total_supply: uint256, _claim: bool, _receiver: address):
                """
                @notice Claim pending rewards and checkpoint rewards for a user
                """

                user_balance: uint256 = 0
                receiver: address = _receiver
                if _user != empty(address):
                    user_balance = self.balanceOf[_user]
                    if _claim and _receiver == empty(address):
                        # if receiver is not explicitly declared, check if a default receiver is set
                        receiver = self.rewards_receiver[_user]
                        if receiver == empty(address):
                            # if no default receiver is set, direct claims to the user
                            receiver = _user

                reward_count: uint256 = self.reward_count
                for i in range(MAX_REWARDS):
                    if i == reward_count:
                        break
                    token: address = self.reward_tokens[i]

                    integral: uint256 = self.reward_data[token].integral
                    period_finish: uint256 = self.reward_data[token].period_finish
                    last_update: uint256 = min(block.timestamp, period_finish)
                    duration: uint256 = last_update - self.reward_data[token].last_update

                    if duration != 0 and _total_supply != 0:
                        self.reward_data[token].last_update = last_update

                        rate: uint256 = self.reward_data[token].rate
                        excess: uint256 = self.reward_remaining[token] - (period_finish - last_update + duration) * rate
                        integral_change: uint256 = (duration * rate + excess) * 10**18 / _total_supply
                        integral += integral_change
                        self.reward_data[token].integral = integral
                        # There is still calculation error in user's claimable amount,
                        # but it has 18-decimal precision through LP(_total_supply) – safe
                        self.reward_remaining[token] -= integral_change * _total_supply / 10**18

                    if _user != empty(address):
                        integral_for: uint256 = self.reward_integral_for[token][_user]
                        new_claimable: uint256 = 0

                        if integral_for < integral:
                            self.reward_integral_for[token][_user] = integral
                            new_claimable = user_balance * (integral - integral_for) / 10**18

                        claim_data: uint256 = self.claim_data[_user][token]
                        total_claimable: uint256 = (claim_data >> 128) + new_claimable
                        if total_claimable > 0:
                            total_claimed: uint256 = claim_data % 2**128
                            if _claim:
                                assert ERC20(token).transfer(receiver, total_claimable, default_return_value=True)
                                self.claim_data[_user][token] = total_claimed + total_claimable
                            elif new_claimable > 0:
                                self.claim_data[_user][token] = total_claimed + (total_claimable << 128)
            ```

    === "Example"

        ```py
        >>> soon
        ```

---

## **Depositing Rewards**

The process for adding external reward tokens follows two steps:

1. **Add Reward Token** (`add_reward`)
    - Registers a new reward token in the gauge
    - Sets an authorized distributor address
    - Only callable by gauge manager or factory admin
    - Stores token data in `reward_data` mapping

2. **Deposit Rewards** (`deposit_reward_token`) 
    - Deposits reward tokens for distribution
    - Only callable by the authorized distributor
    - Distributes rewards linearly over specified period
    - Updates reward data in storage

!!!warning "External Rewards are not boostable!"
    External rewards are separate from CRV emissions and are not subject to boost multipliers.


### `add_reward`
!!! description "`ChildGauge.add_reward(_reward_token: address, _distributor: address)`"

    Function to add a reward token for distribution. When calling this function, a distributor address must be set for the reward token. Only this distributor can deposit the reward token via the `deposit_reward_token` function.

    | Parameter | Type | Description |
    | --------- | ---- | ------------ |
    | `_reward_token` | `address` | The reward token to add |
    | `_distributor` | `address` | The distributor of the reward token |

    ??? quote "Source code"

        === "ChildGauge.vy"

            ```python
            interface Factory:
                def owner() -> address: view
                def crv() -> ERC20: view

            manager: public(address)

            # For tracking external rewards
            reward_count: public(uint256)
            reward_data: public(HashMap[address, Reward])
            reward_remaining: public(HashMap[address, uint256])  # fixes bad precision

            @external
            def add_reward(_reward_token: address, _distributor: address):
                """
                @notice Add additional rewards to be distributed to stakers
                @param _reward_token The token to add as an additional reward
                @param _distributor Address permitted to fund this contract with the reward token
                """
                assert msg.sender in [self.manager, FACTORY.owner()]  # dev: only manager or factory admin
                assert _reward_token != FACTORY.crv().address  # dev: can not distinguish CRV reward from CRV emission
                assert _distributor != empty(address)  # dev: distributor cannot be zero address

                reward_count: uint256 = self.reward_count
                assert reward_count < MAX_REWARDS
                assert self.reward_data[_reward_token].distributor == empty(address)

                self.reward_data[_reward_token].distributor = _distributor
                self.reward_tokens[reward_count] = _reward_token
                self.reward_count = reward_count + 1
            ```

    === "Example"

        This example sets the distributor for the `crvUSD` reward token to `0x1234567890123456789012345678901234567890`. Only this address can deposit `crvUSD` to the gauge using the `deposit_reward_token` function.

        ```py
        >>> ChildGauge.add_reward('0x498Bf2B1e120FeD3ad3D42EA2165E9b73f99C1e5', '0x1234567890123456789012345678901234567890')
        ```


### `set_reward_distributor`
!!! description "`ChildGauge.set_reward_distributor(_reward_token: address, _distributor: address)`"

    !!!guard "Guarded Method"
        This function is only callable by the current distributor of the reward token, the `owner` of the `ChildGaugeFactory`, or the `manager`.

    Function to reassign the reward distributor for a reward token.

    | Parameter | Type | Description |
    | --------- | ---- | ------------ |
    | `_reward_token` | `address` | The reward token to reassign the distributor for |
    | `_distributor` | `address` | The address of the new distributor |

    ??? quote "Source code"

        === "ChildGauge.vy"

            ```python
            # For tracking external rewards
            reward_count: public(uint256)
            reward_data: public(HashMap[address, Reward])
            reward_remaining: public(HashMap[address, uint256])  # fixes bad precision

            @external
            def set_reward_distributor(_reward_token: address, _distributor: address):
                """
                @notice Reassign the reward distributor for a reward token
                @param _reward_token The reward token to reassign distribution rights to
                @param _distributor The address of the new distributor
                """
                current_distributor: address = self.reward_data[_reward_token].distributor

                assert msg.sender in [current_distributor, FACTORY.owner(), self.manager]
                assert current_distributor != empty(address)
                assert _distributor != empty(address)

                self.reward_data[_reward_token].distributor = _distributor
            ```

    === "Example"

        This example changes the distributor for the `crvUSD` reward token from `0x1234567890123456789012345678901234567890` to `0x9876543210987654321098765432109876543210`.

        ```py
        >>> ChildGauge.reward_data('0x498Bf2B1e120FeD3ad3D42EA2165E9b73f99C1e5')
        {
            'distributor': '0x1234567890123456789012345678901234567890',
            'rate': 0,
            'last_update': 0,
            'period_finish': 0,
            'integral': 0
        }

        >>> ChildGauge.set_reward_distributor('0x498Bf2B1e120FeD3ad3D42EA2165E9b73f99C1e5', '0x9876543210987654321098765432109876543210')

        >>> ChildGauge.reward_data('0x498Bf2B1e120FeD3ad3D42EA2165E9b73f99C1e5')
        {
            'distributor': '0x9876543210987654321098765432109876543210',
            'rate': 0,
            'last_update': 0,
            'period_finish': 0,
            'integral': 0
        }
        ```


### `deposit_reward_token`
!!! description "`ChildGauge.deposit_reward_token(_reward_token: address, _amount: uint256, _epoch: uint256 = WEEK)`"

    Function to deposit a reward token for distribution.

    | Parameter | Type | Description |
    | --------- | ---- | ------------ |
    | `_reward_token` | `address` | The reward token to deposit |
    | `_amount` | `uint256` | The amount of the reward token to deposit |
    | `_epoch` | `uint256` | The duration the rewards are distributed across. Between 3 days and a year, week by default |

    ??? quote "Source code"

        === "ChildGauge.vy"

            ```python
            # For tracking external rewards
            reward_count: public(uint256)
            reward_data: public(HashMap[address, Reward])
            reward_remaining: public(HashMap[address, uint256])  # fixes bad precision

            @external
            @nonreentrant("lock")
            def deposit_reward_token(_reward_token: address, _amount: uint256, _epoch: uint256 = WEEK):
                """
                @notice Deposit a reward token for distribution
                @param _reward_token The reward token being deposited
                @param _amount The amount of `_reward_token` being deposited
                @param _epoch The duration the rewards are distributed across. Between 3 days and a year, week by default
                """
                assert msg.sender == self.reward_data[_reward_token].distributor
                assert 3 * WEEK / 7 <= _epoch and _epoch <= WEEK * 4 * 12, "Epoch duration"

                self._checkpoint_rewards(empty(address), self.totalSupply, False, empty(address))

                # transferFrom reward token and use transferred amount henceforth:
                amount_received: uint256 = ERC20(_reward_token).balanceOf(self)
                assert ERC20(_reward_token).transferFrom(
                    msg.sender,
                    self,
                    _amount,
                    default_return_value=True
                )
                amount_received = ERC20(_reward_token).balanceOf(self) - amount_received

                total_amount: uint256 = amount_received + self.reward_remaining[_reward_token]
                self.reward_data[_reward_token].rate = total_amount / _epoch
                self.reward_remaining[_reward_token] = total_amount

                self.reward_data[_reward_token].last_update = block.timestamp
                self.reward_data[_reward_token].period_finish = block.timestamp + _epoch
            ```

    === "Example"

        This example deposits `10,000` `crvUSD` tokens as rewards over `7` days.

        ```python
        >>> ChildGauge.deposit_reward_token('0x498Bf2B1e120FeD3ad3D42EA2165E9b73f99C1e5', 10000000000000000000000, 604800)
        ```


### `manager`
!!! description "`ChildGauge.manager() -> address: view`"

    Getter for the gauge manager address. The manager address is set during initialization and can be changed by the `owner` of the factory.

    Returns: the gauge manager address (`address`).

    ??? quote "Source code"

        === "ChildGauge.vy"

            ```python
            manager: public(address)
            ```

    === "Example"

        This example returns the manager of the gauge, which is `0x1234567890123456789012345678901234567890`.

        ```py
        >>> ChildGauge.manager()
        '0x1234567890123456789012345678901234567890'
        ```


### `set_gauge_manager`
!!! description "`ChildGauge.set_gauge_manager(_gauge_manager: address)`"

    !!!guard "Guarded Method"
        This function is only callable by the `manager` of the gauge or the `owner` of the `ChildGaugeFactory`.

    Function to set the gauge manager.

    Emits: `SetGaugeManager` event.

    | Parameter | Type | Description |
    | --------- | ---- | ------------ |
    | `_gauge_manager` | `address` | The address to set as the new manager of the gauge |

    ??? quote "Source code"

        === "ChildGauge.vy"

            ```python
            interface Factory:
                def owner() -> address: view

            event SetGaugeManager:
                _gauge_manager: address

            manager: public(address)

            @external
            def set_gauge_manager(_gauge_manager: address):
                """
                @notice Change the gauge manager for a gauge
                @dev The manager of this contract, or the ownership admin can outright modify gauge
                    managership. A gauge manager can also transfer managership to a new manager via this
                    method, but only for the gauge which they are the manager of.
                @param _gauge_manager The account to set as the new manager of the gauge.
                """
                assert msg.sender in [self.manager, FACTORY.owner()]  # dev: only manager or factory admin

                self.manager = _gauge_manager
                log SetGaugeManager(_gauge_manager)
            ```

    === "Example"

        This example changes the manager of the gauge from `0x1234567890123456789012345678901234567890` to `0x9876543210987654321098765432109876543210`.

        ```py
        >>> ChildGauge.manager()
        '0x1234567890123456789012345678901234567890'

        >>> ChildGauge.set_gauge_manager('0x9876543210987654321098765432109876543210')

        >>> ChildGauge.manager()
        '0x9876543210987654321098765432109876543210'
        ```


### `set_manager`
!!! description "`ChildGauge.set_manager(_gauge_manager: address)`"

    !!!guard "Guarded Method"
        This function is only callable by the `manager` of the gauge or the `owner` of the Factory.

    Function to set the manager for the gauge. This function is a copy of the `set_gauge_manager` function for back-compatability.

    Emits: `SetGaugeManager` event.

    | Parameter | Type | Description |
    | --------- | ---- | ------------ |
    | `_gauge_manager` | `address` | The address to set as the new manager of the gauge |

    ??? quote "Source code"

        === "ChildGauge.vy"

            ```python
            event SetGaugeManager:
                _gauge_manager: address

            manager: public(address)

            @external
            def set_manager(_gauge_manager: address):
                """
                @notice Change the gauge manager for a gauge
                @dev Copy of `set_gauge_manager` for back-compatability
                @dev The manager of this contract, or the ownership admin can outright modify gauge
                    managership. A gauge manager can also transfer managership to a new manager via this
                    method, but only for the gauge which they are the manager of.
                @param _gauge_manager The account to set as the new manager of the gauge.
                """
                assert msg.sender in [self.manager, FACTORY.owner()]  # dev: only manager or factory admin

                self.manager = _gauge_manager
                log SetGaugeManager(_gauge_manager)
            ```

    === "Example"

        This example changes the manager of the gauge from `0x1234567890123456789012345678901234567890` to `0x9876543210987654321098765432109876543210`. It has the same effect as the `set_gauge_manager` function.

        ```py
        >>> ChildGauge.manager()
        '0x1234567890123456789012345678901234567890'

        >>> ChildGauge.set_manager('0x9876543210987654321098765432109876543210')

        >>> ChildGauge.manager()
        '0x9876543210987654321098765432109876543210'
        ```

---

# **Checkpoints and Boosting**

For more information on how boosting works, please refer to the [Boosting Explainer](./overview.md#boosting) page.

### `user_checkpoint`
!!! description "`ChildGauge.user_checkpoint(_user: address) -> bool`"

    Function to record a checkpoint for a user.

    Returns: `True` if the checkpoint was recorded successfully (`bool`).

    | Parameter | Type | Description |
    | --------- | ---- | ------------ |
    | `_user` | `address` | The user address to record a checkpoint for |

    ??? quote "Source code"

        === "ChildGauge.vy"

            ```python
            @external
            def user_checkpoint(addr: address) -> bool:
                """
                @notice Record a checkpoint for `addr`
                @param addr User address
                @return bool success
                """
                assert msg.sender in [addr, FACTORY.address]  # dev: unauthorized
                self._checkpoint(addr)
                self._update_liquidity_limit(addr, self.balanceOf[addr], self.totalSupply)
                return True

            @internal
            def _checkpoint(_user: address):
                """
                @notice Checkpoint a user calculating their CRV entitlement
                @param _user User address
                """
                period: int128 = self.period
                period_time: uint256 = self.period_timestamp[period]
                integrate_inv_supply: uint256 = self.integrate_inv_supply[period]

                if block.timestamp > period_time:

                    working_supply: uint256 = self.working_supply
                    prev_week_time: uint256 = period_time
                    week_time: uint256 = min((period_time + WEEK) / WEEK * WEEK, block.timestamp)

                    for i in range(256):
                        dt: uint256 = week_time - prev_week_time

                        if working_supply != 0:
                            # we don't have to worry about crossing inflation epochs
                            # and if we miss any weeks, those weeks inflation rates will be 0 for sure
                            # but that means no one interacted with the gauge for that long
                            integrate_inv_supply += self.inflation_rate[prev_week_time / WEEK] * 10 ** 18 * dt / working_supply

                        if week_time == block.timestamp:
                            break
                        prev_week_time = week_time
                        week_time = min(week_time + WEEK, block.timestamp)

                # check CRV balance and increase weekly inflation rate by delta for the rest of the week
                crv: ERC20 = FACTORY.crv()
                if crv != empty(ERC20):
                    crv_balance: uint256 = crv.balanceOf(self)
                    if crv_balance != 0:
                        current_week: uint256 = block.timestamp / WEEK
                        self.inflation_rate[current_week] += crv_balance / ((current_week + 1) * WEEK - block.timestamp)
                        crv.transfer(FACTORY.address, crv_balance)

                period += 1
                self.period = period
                self.period_timestamp[period] = block.timestamp
                self.integrate_inv_supply[period] = integrate_inv_supply

                working_balance: uint256 = self.working_balances[_user]
                self.integrate_fraction[_user] += working_balance * (integrate_inv_supply - self.integrate_inv_supply_of[_user]) / 10 ** 18
                self.integrate_inv_supply_of[_user] = integrate_inv_supply
                self.integrate_checkpoint_of[_user] = block.timestamp

            @internal
            def _update_liquidity_limit(_user: address, _user_balance: uint256, _total_supply: uint256):
                """
                @notice Calculate working balances to apply amplification of CRV production.
                @dev https://resources.curve.finance/guides/boosting-your-crv-rewards#formula
                @param _user The user address
                @param _user_balance User's amount of liquidity (LP tokens)
                @param _total_supply Total amount of liquidity (LP tokens)
                """
                working_balance: uint256 = _user_balance * TOKENLESS_PRODUCTION / 100

                ve: address = self.voting_escrow
                if ve != empty(address):
                    ve_ts: uint256 = ERC20(ve).totalSupply()
                    if ve_ts != 0:
                        working_balance += _total_supply * ERC20(ve).balanceOf(_user) / ve_ts * (100 - TOKENLESS_PRODUCTION) / 100
                        working_balance = min(_user_balance, working_balance)

                old_working_balance: uint256 = self.working_balances[_user]
                self.working_balances[_user] = working_balance

                working_supply: uint256 = self.working_supply + working_balance - old_working_balance
                self.working_supply = working_supply

                log UpdateLiquidityLimit(_user, _user_balance, _total_supply, working_balance, working_supply)
            ```

    === "Example"

        ```py
        >>> ChildGauge.user_checkpoint('0x20a440aECf78c73d484B652C46d582B4D70906A8')
        True
        ```


### `integrate_checkpoint`
!!! description "`ChildGauge.integrate_checkpoint() -> uint256: view`"

    Getter for the timestamp of the last checkpoint.

    Returns: timestamp of the last checkpoint (`uint256`).

    ??? quote "Source code"

        === "ChildGauge.vy"

            ```python
            # The goal is to be able to calculate ∫(rate * balance / totalSupply dt) from 0 till checkpoint
            # All values are kept in units of being multiplied by 1e18
            period: public(int128)

            period_timestamp: public(HashMap[int128, uint256])

            @view
            @external
            def integrate_checkpoint() -> uint256:
                """
                @notice Get the timestamp of the last checkpoint
                """
                return self.period_timestamp[self.period]
            ```

    === "Example"

        ```py
        >>> ChildGauge.integrate_checkpoint()
        1729778435
        ```


### `integrate_checkpoint_of`
!!! description "`ChildGauge.integrate_checkpoint_of(_user: address) -> uint256: view`"

    Getter for the timestamp of the last checkpoint for a user.

    Returns: timestamp of the last checkpoint (`uint256`).

    | Parameter | Type | Description |
    | --------- | ---- | ------------ |
    | `_user` | `address` | The user address to get the integrate checkpoint for |

    ??? quote "Source code"

        === "ChildGauge.vy"

            ```python
            # 1e18 * ∫(rate(t) / totalSupply(t) dt) from (last_action) till checkpoint
            integrate_inv_supply_of: public(HashMap[address, uint256])
            integrate_checkpoint_of: public(HashMap[address, uint256])
            ```

    === "Example"

        ```py
        >>> ChildGauge.integrate_checkpoint_of(todo)
        todo
        ```


### `working_balances`
!!! description "`ChildGauge.working_balances(_user: address) -> uint256: view`"

    Getter for the working balances of a user. This represents the effective liquidity of a user, which is used to calculate the CRV rewards they are entitled to. Essentially, it's the boosted balance of a user if they have some veCRV. If a user has no boost at all, their working_balance will be 40% of their LP tokens. If the position is fully boosted (2.5x), their working_balance will be equal to their LP tokens.

    *For example:*

    - 1 LP token with no boost = working_balances(user) = 0.4
    - 1 LP token with 1.5 boost = working_balances(user) = 1.5
    - 1 LP token with 2.5 boost = working_balances(user) = 2.5

    Returns: working balance of a user (`uint256`).

    | Parameter | Type | Description |
    | --------- | ---- | ------------ |
    | `_user` | `address` | The user address to get the working balance for |

    ??? quote "Source code"

        === "ChildGauge.vy"

            ```python
            working_balances: public(HashMap[address, uint256])
            ```

    === "Example"

        ```py
        >>> ChildGauge.working_balances(0x20a440aECf78c73d484B652C46d582B4D70906A8)
        106163327646490
        ```


### `working_supply`
!!! description "`ChildGauge.working_supply() -> uint256: view`"

    Getter for the working supply. This variable represents the sum of all `working_balances` of users who provided liquidity in the gauge.

    Returns: working supply (`uint256`).

    ??? quote "Source code"

        === "ChildGauge.vy"

            ```python
            working_supply: public(uint256)
            ```

    === "Example"

        The working supply in our example is equal to the working_balance of `0x20a440aECf78c73d484B652C46d582B4D70906A8` because its the only user that has provided liquidity so far.

        ```py
        >>> ChildGauge.working_supply()
        106163327646490
        ```


### `period`
!!! description "`ChildGauge.period() -> int128: view`"

    !!!info
        The goal is to be able to calculate ∫(rate * balance / totalSupply dt) from 0 till checkpoint. All values are kept in units of being multiplied by 1e18.

    Getter for the current period.

    Returns: the current period (`int128`).

    ??? quote "Source code"

        === "ChildGauge.vy"

            ```python
            # The goal is to be able to calculate ∫(rate * balance / totalSupply dt) from 0 till checkpoint
            # All values are kept in units of being multiplied by 1e18
            period: public(int128)
            ```

    === "Example"

        Period is one, because only one checkpoint has been recorded so far (when depositing liquidity).

        ```python
        >>> ChildGauge.period()
        1
        ```


### `period_timestamp`
!!! description "`ChildGauge.period_timestamp(_period: int128) -> uint256: view`"

    Getter for the period timestamp for a specific period.

    Returns: the period timestamp for a specific period (`uint256`).

    | Parameter | Type | Description |
    | --------- | ---- | ------------ |
    | `_period` | `int128` | The period to get the timestamp for |

    ??? quote "Source code"

        === "ChildGauge.vy"

            ```python
            period_timestamp: public(HashMap[int128, uint256])
            ```

    === "Example"

        This example returns the timestamp of the first period, which is the timestamp of the first checkpoint (when depositing liquidity).

        ```python
        >>> ChildGauge.period_timestamp(1)
        1729778435      # exactly the timestamp of the first checkpoint which was the deposit of liquidity
        ```


### `integrate_fraction`
!!! description "`ChildGauge.integrate_fraction(_user: address) -> uint256: view`"

    Getter for the total amount of CRV, both mintable and already minted, that has been allocated to `_user` from this gauge.

    Returns: integral of accrued rewards (`uint256`).

    | Parameter | Type | Description |
    | --------- | ---- | ------------ |
    | `_user` | `address` | The user address to get the integrate fraction for |

    ??? quote "Source code"

        === "ChildGauge.vy"

            ```python
            # ∫(balance * rate(t) / totalSupply(t) dt) from 0 till checkpoint
            # Units: rate * t = already number of coins per address to issue
            integrate_fraction: public(HashMap[address, uint256])
            ```

    === "Example"

        ```py
        >>> ChildGauge.integrate_fraction(0x20a440aECf78c73d484B652C46d582B4D70906A8)
        0
        ```


### `claimable_tokens`
!!! description "`ChildGauge.claimable_tokens(addr: address) -> uint256`"

    Function to get the number of claimable CRV emissions for a user.

    Returns: the number of claimable CRV emissions for a user (`uint256`).

    | Parameter | Type | Description |
    | --------- | ---- | ------------ |
    | `addr` | `address` | The address to get the number of claimable CRV emissions for |

    ??? quote "Source code"

        === "ChildGauge.vy"

            ```python
            # ∫(balance * rate(t) / totalSupply(t) dt) from 0 till checkpoint
            # Units: rate * t = already number of coins per address to issue
            integrate_fraction: public(HashMap[address, uint256])

            @external
            def claimable_tokens(addr: address) -> uint256:
                """
                @notice Get the number of claimable tokens per user
                @dev This function should be manually changed to "view" in the ABI
                @return uint256 number of claimable tokens per user
                """
                self._checkpoint(addr)
                return self.integrate_fraction[addr] - FACTORY.minted(addr, self)

            @internal
            def _checkpoint(_user: address):
                """
                @notice Checkpoint a user calculating their CRV entitlement
                @param _user User address
                """
                period: int128 = self.period
                period_time: uint256 = self.period_timestamp[period]
                integrate_inv_supply: uint256 = self.integrate_inv_supply[period]

                if block.timestamp > period_time:

                    working_supply: uint256 = self.working_supply
                    prev_week_time: uint256 = period_time
                    week_time: uint256 = min((period_time + WEEK) / WEEK * WEEK, block.timestamp)

                    for i in range(256):
                        dt: uint256 = week_time - prev_week_time

                        if working_supply != 0:
                            # we don't have to worry about crossing inflation epochs
                            # and if we miss any weeks, those weeks inflation rates will be 0 for sure
                            # but that means no one interacted with the gauge for that long
                            integrate_inv_supply += self.inflation_rate[prev_week_time / WEEK] * 10 ** 18 * dt / working_supply

                        if week_time == block.timestamp:
                            break
                        prev_week_time = week_time
                        week_time = min(week_time + WEEK, block.timestamp)

                # check CRV balance and increase weekly inflation rate by delta for the rest of the week
                crv: ERC20 = FACTORY.crv()
                if crv != empty(ERC20):
                    crv_balance: uint256 = crv.balanceOf(self)
                    if crv_balance != 0:
                        current_week: uint256 = block.timestamp / WEEK
                        self.inflation_rate[current_week] += crv_balance / ((current_week + 1) * WEEK - block.timestamp)
                        crv.transfer(FACTORY.address, crv_balance)

                period += 1
                self.period = period
                self.period_timestamp[period] = block.timestamp
                self.integrate_inv_supply[period] = integrate_inv_supply

                working_balance: uint256 = self.working_balances[_user]
                self.integrate_fraction[_user] += working_balance * (integrate_inv_supply - self.integrate_inv_supply_of[_user]) / 10 ** 18
                self.integrate_inv_supply_of[_user] = integrate_inv_supply
                self.integrate_checkpoint_of[_user] = block.timestamp
            ```

    === "Example"

        This example returns the number of claimable CRV emissions for `0x20a440aECf78c73d484B652C46d582B4D70906A8`, which currently is `0`.

        ```python
        >>> ChildGauge.claimable_tokens('0x20a440aECf78c73d484B652C46d582B4D70906A8')
        0
        ```


### `inflation_rate`
!!! description "`ChildGauge.inflation_rate(_period: uint256) -> uint256: view`"

    Getter for the CRV emission inflation rate for a specific week.

    | Parameter | Type | Description |
    | --------- | ---- | ------------ |
    | `_period` | `uint256` | The week to get the inflation rate for |

    ??? quote "Source code"

        === "ChildGauge.vy"

            ```python
            inflation_rate: public(HashMap[uint256, uint256])
            ```

    === "Example"

        This example returns the CRV emission inflation rate for the first week, which is `0`.

        ```python
        >>> ChildGauge.inflation_rate(1)
        0
        ```


### `integrate_inv_supply`
!!! description "`ChildGauge.integrate_inv_supply(_period: int128) -> uint256: view`"

    Getter for the inverse supply of CRV at a given period that tracks a cumulative measure of inverse supply over time in relation to the CRV emissions.

    Returns: inverse supply of CRV at a given period (`uint256`).

    | Parameter | Type | Description |
    | --------- | ---- | ------------ |
    | `_period` | `int128` | The period to get the inverse supply for |

    ??? quote "Source code"

        === "ChildGauge.vy"

            ```python
            # 1e18 * ∫(rate(t) / totalSupply(t) dt) from 0 till checkpoint
            integrate_inv_supply: public(HashMap[int128, uint256])
            ```

    === "Example"

        This example returns the inverse supply of CRV at the first period, which is `0`.

        ```py
        >>> ChildGauge.integrate_inv_supply(1)
        0
        ```


### `integrate_inv_supply_of`
!!! description "`ChildGauge.integrate_inv_supply_of(_user: address) -> uint256: view`"

    The integrate_inv_supply_of variable is a mapping (HashMap[address, uint256]) that stores a user-specific cumulative measure of inverse supply up to the last checkpoint for each user. It is used to calculate the individual CRV emissions that a user is entitled to based on their participation in the gauge.

    Returns: inverse supply of CRV at a given period for a user (`uint256`).

    | Parameter | Type | Description |
    | --------- | ---- | ------------ |
    | `_user` | `address` | The user address to get the inverse supply for |

    ??? quote "Source code"

        === "ChildGauge.vy"

            ```python
            # 1e18 * ∫(rate(t) / totalSupply(t) dt) from (last_action) till checkpoint
            integrate_inv_supply_of: public(HashMap[address, uint256])
            integrate_checkpoint_of: public(HashMap[address, uint256])
            ```

    === "Example"

        This example returns the inverse supply of CRV at the first period for `0x20a440aECf78c73d484B652C46d582B4D70906A8`, which is `0`.

        ```py
        >>> ChildGauge.integrate_inv_supply_of('0x20a440aECf78c73d484B652C46d582B4D70906A8')
        0
        ```

---

# **RootGauge and VotingEscrow**

### `root_gauge`
!!! description "`ChildGauge.root_gauge() -> address: view`"

    Getter for the root gauge address on Ethereum.

    Returns: root gauge address (`address`).

    ??? quote "Source code"

        === "ChildGauge.vy"

            ```python
            root_gauge: public(address)
            ```

    === "Example"

        ```py
        >>> ChildGauge.root_gauge()
        '0x12C3F630ec8f8A07C539b5F933e8E62F9b627396'
        ```


### `set_root_gauge`
!!! description "`ChildGauge.set_root_gauge(_root: address)`"

    Function to set the root gauge address in case something went wrong (e.g. between implementation updates).

    | Parameter | Type | Description |
    | --------- | ---- | ------------ |
    | `_root` | `address` | The root gauge address to set |

    ??? quote "Source code"

        === "ChildGauge.vy"

            ```python
            root_gauge: public(address)

            @external
            def set_root_gauge(_root: address):
                """
                @notice Set Root contract in case something went wrong (e.g. between implementation updates)
                @param _root Root gauge to set
                """
                assert msg.sender in [FACTORY.owner(), FACTORY.manager()]
                assert _root != empty(address)

                self.root_gauge = _root
            ```

    === "Example"

        ```py
        >>> ChildGauge.root_gauge()
        '0x12C3F630ec8f8A07C539b5F933e8E62F9b627396'

        >>> ChildGauge.set_root_gauge('0x12C3F630ec8f8A07C539b5F933e8E62F9b627396')

        >>> ChildGauge.root_gauge()
        '0x12C3F630ec8f8A07C539b5F933e8E62F9b627396'
        ```


### `voting_escrow`
!!! description "`ChildGauge.voting_escrow() -> address: view`"

    Getter for the voting escrow contract on the specific chain. If this variable is not set, boosting LP positions will not work. If boosting works, the `voting_escrow` variable will be set to a L2 Voting Escrow Oracle contract, which validates the user's veCRV balance from Ethereum mainnet. This value mirrors the voting escrow contract set on the `ChildGaugeFactory`. If the `ChildGaugeFactory` voting escrow contract is updated, the `ChildGauge` voting escrow contract can be updated by calling the `update_voting_escrow()` function.

    Returns: voting escrow contract (`address`).

    ??? quote "Source code"

        === "ChildGauge.vy"

            ```python
            voting_escrow: public(address)
            ```

    === "Example"

        ```py
        >>> ChildGauge.voting_escrow()
        '0x0000000000000000000000000000000000000000'
        ```


### `update_voting_escrow`
!!! description "`ChildGauge.update_voting_escrow()`"
    
    Function to update the voting escrow contract to the voting escrow contract set in the factory. This function is callable by anyone.

    ??? quote "Source code"

        === "ChildGauge.vy"

            ```python
            interface Factory:
                def voting_escrow() -> address: view

            @external
            def update_voting_escrow():
                """
                @notice Update the voting escrow contract in storage
                """
                self.voting_escrow = FACTORY.voting_escrow()
            ```

    === "Example"

        This example shows the following: The gauge has been deployed without a voting escrow contract to be set in the `ChildGaugeFactory`. Therefore, the voting escrow address is `0x0000000000000000000000000000000000000000`. After the voting escrow contract has been set in the `ChildGaugeFactory`, the `update_voting_escrow()` function is called, and the voting escrow address is set to mirror the voting escrow contract set in the `ChildGaugeFactory`.

        ```py
        >>> ChildGauge.voting_escrow()
        '0x0000000000000000000000000000000000000000'

        >>> ChildGauge.update_voting_escrow()

        >>> ChildGauge.voting_escrow()
        '0xc73e8d8f7A68Fc9d67e989250484E57Ae03a5Da3'
        ```

---

# **Killing Gauges**

### `is_killed`
!!! description "`ChildGauge.is_killed() -> bool: view`"

    Getter to check if the gauge is killed.

    Returns: killed status (`bool`).

    ??? quote "Source code"

        === "ChildGauge.vy"

            ```python
            is_killed: public(bool)
            ```

    === "Example"

        ```py
        >>> ChildGauge.is_killed()
        False
        ```


### `set_killed`
!!! description "`ChildGauge.set_killed(_is_killed: bool)`"

    !!!guard "Guarded Method"
        This function is only callable by the `owner` of the `ChildGaugeFactory`.

    Function to set the killed status for the gauge.

    | Parameter    | Type   | Description |
    | ------------ | ------ | ----------- |
    | `_is_killed` | `bool` | The killed status to set |

    ??? quote "Source code"

        === "ChildGauge.vy"

            ```python
            is_killed: public(bool)

            @external
            def set_killed(_is_killed: bool):
                """
                @notice Set the killed status for this contract
                @dev Nothing happens, just stop emissions and that's it
                @param _is_killed Killed status to set
                """
                assert msg.sender == FACTORY.owner()  # dev: only owner

                self.is_killed = _is_killed
            ```

    === "Example"

        ```py
        >>> ChildGauge.is_killed()
        False

        >>> ChildGauge.set_killed(True)

        >>> ChildGauge.is_killed()
        True
        ```


---


# **ERC20 and Other Methods**

The contract inherits the ERC20 interface and follows the standard ERC20 methods. These methods are not further documented here. Some notable methods are documented below.


### `totalSupply`
!!! description "`ChildGauge.totalSupply() -> uint256: view`"

    Getter for the total supply of the gauge.

    Returns: total supply (`uint256`).

    ??? quote "Source code"

        === "ChildGauge.vy"

            ```python
            totalSupply: public(uint256)
            ```

    === "Example"

        ```py
        >>> ChildGauge.totalSupply()
        1000000000000000000000000
        ```


### `factory`
!!! description "`ChildGauge.factory() -> address: view`"

    Getter for the `ChildGaugeFactory` contract.

    Returns: `ChildGaugeFactory` contract (`address`).

    ??? quote "Source code"

        === "ChildGauge.vy"

            ```python
            interface Factory:
                def owner() -> address: view
                def manager() -> address: view
                def voting_escrow() -> address: view
                def minted(_user: address, _gauge: address) -> uint256: view
                def crv() -> ERC20: view

            FACTORY: immutable(Factory)
            ```

    === "Example"

        ```py
        >>> ChildGauge.factory()
        '0x0B8D6B6CeFC7Aa1C2852442e518443B1b22e1C52'
        ```


### `lp_token`
!!! description "`ChildGauge.lp_token() -> address: view`"

    Getter for the LP token address.

    Returns: LP token contract (`address`).

    ??? quote "Source code"

        === "ChildGauge.vy"

            ```python
            interface ERC20Extended:
                def symbol() -> String[32]: view

            lp_token: public(address)

            @external
            def initialize(_lp_token: address, _root: address, _manager: address):
                assert self.lp_token == empty(address)  # dev: already initialized

                self.lp_token = _lp_token
                self.root_gauge = _root
                self.manager = _manager

                self.voting_escrow = Factory(msg.sender).voting_escrow()

                symbol: String[32] = ERC20Extended(_lp_token).symbol()
                name: String[64] = concat("Curve.fi ", symbol, " Gauge Deposit")

                self.name = name
                self.symbol = concat(symbol, "-gauge")

                self.period_timestamp[0] = block.timestamp
                self.DOMAIN_SEPARATOR = keccak256(
                    _abi_encode(
                        EIP712_TYPEHASH,
                        keccak256(name),
                        keccak256(VERSION),
                        chain.id,
                        self
                    )
                )
            ```

    === "Example"

        ```py
        >>> ChildGauge.lp_token()
        '0xF25E1dB1f0c7BD1a29761a1FcDaE187B8718CF18'
        ```


### `version`
!!! description "`ChildGauge.version() -> String[8]`"

    Getter for the version of the gauge contract.

    Returns: version (`String[8]`).

    ??? quote "Source code"

        === "ChildGauge.vy"

            ```python
            VERSION: constant(String[8]) = "1.0.0"

            @view
            @external
            def version() -> String[8]:
                """
                @notice Get the version of this gauge contract
                """
                return VERSION
            ```

    === "Example"

        ```py
        >>> ChildGauge.version()
        "1.0.0"
        ```
