<h1></h1>

## **Depositing and Withdrawing**

Liquidity pool (LP) tokens can be deposited into or withdrawn from a gauge at any time.

In user interfaces and documentation, the terms "staking" and "unstaking" are often used when referring to gauges. However, the terminology used in the actual source code is `deposit` and `withdraw`.

When LP tokens are deposited into a gauge, the smart contract mints an equivalent amount of "gauge tokens" to the depositor. This mechanism ensures that when tokens are withdrawn, the depositor receives the same amount of LP tokens originally deposited. LP tokens are ERC20 tokens and transferable.

!!! example "Example of Depositing and Earning Rewards"
    Alice deposits 100 crvUSD into the crvUSD/USDC liquidity pool and receives 99 LP tokens in return. Observing significant gauge weight and subsequent CRV emissions to this pool, she decides to deposit (stake) her LP tokens into the gauge. Consequently, she begins to earn CRV rewards based on her liquidity share and her boost factor within the pool. Alice can claim rewards or withdraw her LP tokens at any point in time.


### `deposit`
!!! description "`LiquidityGaugeV6.deposit(_value: uint256, _addr: address = msg.sender, _claim_rewards: bool = False)`"

    Function to deposit `_value` of LP tokens into the gauge. When depositing LP tokens into the gauge, the contract mints the equivalent amount of "gauge token" to the user.

    Emits: `Deposit` and `Transfer`

    | Input            | Type      | Description                        |
    | ---------------- | --------- | ---------------------------------- |
    | `_value`         | `uint256` | Number of LP tokens to deposit.    |
    | `_addr`          | `address` | Address to deposit the LP tokens for. Defaults to `msg.sender`. |
    | `_claim_rewards` | `bool`    | Whether to additionally claim rewards or not. |

    ??? quote "Source code"

        === "LiquidityGaugeV6.vy"

            ```python
            event Deposit:
                provider: indexed(address)
                value: uint256

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
            ```

    === "Example"
        ```shell
        >>> soon
        ```


### `withdraw`
!!! description "`LiquidityGaugeV6.withdraw(_value: uint256, _claim_rewards: bool = False)`"

    Function to withdraw `_value` of LP tokens from the gauge.

    Emits: `Withdraw` and `Transfer`

    | Input            | Type      | Description                        |
    | ---------------- | --------- | ---------------------------------- |
    | `_value`         | `uint256` | Number of LP tokens to withdraw. |
    | `_claim_rewards` | `bool`    | Whether to additionally claim rewards or not. |

    ??? quote "Source code"

        === "LiquidityGaugeV6.vy"

            ```python
            event Withdraw:
                provider: indexed(address)
                value: uint256

            event Transfer:
                _from: indexed(address)
                _to: indexed(address)
                _value: uint256

            @external
            @nonreentrant('lock')
            def withdraw(_value: uint256, _claim_rewards: bool = False):
                """
                @notice Withdraw `_value` LP tokens
                @dev Withdrawing also claims pending reward tokens
                @param _value Number of tokens to withdraw
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

                    ERC20(self.lp_token).transfer(msg.sender, _value)

                log Withdraw(msg.sender, _value)
                log Transfer(msg.sender, empty(address), _value)
            ```

    === "Example"
        ```shell
        >>> soon
        ```


---


## **Claiming Rewards**

Reward tokens can be claimed using the `claim_rewards` function. This function claims all externally added rewards from the gauge in a single transaction.

!!! warning "Which rewards does `claim_rewards` claim?"
    The `claim_rewards` function only claims ["permissionless rewards"](#permissionless-rewards), not CRV emissions directed to the gauge. If there are multiple reward tokens, calling the function will result in a claim of all reward tokens at once.

    CRV emissions directed to the gauge are claimable from the [`Minter.vy`](../minter.md) contract using the [`mint`](../minter.md#mint) function.

The liquidity gauge records checkpoints to determine how much external rewards each user is entitled to claim. 

???quote "`_checkpoint_rewards`"

    ```py
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
            last_update: uint256 = min(block.timestamp, self.reward_data[token].period_finish)
            duration: uint256 = last_update - self.reward_data[token].last_update

            if duration != 0 and _total_supply != 0:
                self.reward_data[token].last_update = last_update
                integral += duration * self.reward_data[token].rate * 10**18 / _total_supply
                self.reward_data[token].integral = integral

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


*These checkpoints occur:*

- When a reward token is deposited (this does not record a checkpoint for an individual user but creates a general checkpoint).
- When transferring LP tokens (records a checkpoint for both the sender and the receiver).
- When depositing (staking) LP tokens into the gauge.
- When withdrawing (unstaking) LP tokens from the gauge.
- When rewards (excluding CRV emission rewards, which are claimed via the `Minter.vy` contract) are claimed.


### `claim_rewards`
!!! description "`LiquidityGaugeV6.claim_rewards(_addr: address = msg.sender, _receiver: address = empty(address))`"

    !!!warning "Claiming for another user"
        When claiming for another user, the rewards can not be redirected to another wallet.
    
    Function to claim rewards from the gauge.

    | Input       | Type      | Description                        |
    | ----------- | --------- | ---------------------------------- |
    | `_addr`     | `address` | Address to claim the rewards for. Defaults to `msg.sender`. |
    | `_receiver` | `address` | Receiver of the rewards. |

    ??? quote "Source code"

        === "LiquidityGaugeV6.vy"

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
                    last_update: uint256 = min(block.timestamp, self.reward_data[token].period_finish)
                    duration: uint256 = last_update - self.reward_data[token].last_update

                    if duration != 0 and _total_supply != 0:
                        self.reward_data[token].last_update = last_update
                        integral += duration * self.reward_data[token].rate * 10**18 / _total_supply
                        self.reward_data[token].integral = integral

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
        ```shell
        >>> soon
        ```


### `claimed_reward`
!!! description "`LiquidityGaugeV6.claimed_reward(_addr: address, _token: address) -> uint256:`"

    Getter for the total amount of `_token` claimed by `_addr`.

    Returns: claimed tokens (`uint256`).

    | Input    | Type      | Description                |
    | -------- | --------- | -------------------------- |
    | `_addr`  | `address` | User address to check for. |
    | `_token` | `address` | Reward token to check for. |

    ??? quote "Source code"

        === "LiquidityGaugeV6.vy"

            ```python
            # user -> [uint128 claimable amount][uint128 claimed amount]
            claim_data: HashMap[address, HashMap[address, uint256]]

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
        ```shell
        >>> LiquidityGaugeV6.claimed_reward('0x989AEb4d175e16225E39E87d0D97A3360524AD80', '0xfe18aE03741a5b84e39C295Ac9C856eD7991C38e')
        30563368675260319
        ```


### `claimable_reward`
!!! description "`LiquidityGaugeV6.claimable_reward(_user: address, _reward_token: address) -> uint256`"

    Function to check the claimable amount of `_reward_token` for `_user`. 

    Returns: claimable tokens (`uint256`).

    | Input           | Type      | Description                |
    | --------------- | --------- | -------------------------- |
    | `_user`         | `address` | User address to check for. |
    | `_reward_token` | `address` | Reward token to check for. |

    ??? quote "Source code"

        === "LiquidityGaugeV6.vy"

            ```python
            reward_integral_for: public(HashMap[address, HashMap[address, uint256]])

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
        ```shell
        >>> LiquidityGaugeV6.claimable_reward('0x989AEb4d175e16225E39E87d0D97A3360524AD80', '0xfe18aE03741a5b84e39C295Ac9C856eD7991C38e')
        121423107585280954
        ```


### `rewards_receiver`
!!! description "`LiquidityGaugeV6.rewards_receiver(arg0: address) -> address: view`"

    Getter for the reward receiver of the caller. By default, this value is set to `empty(address)`, which means the rewards will be claimed to the user. But e.g. for integrations like Convex, the `rewards_receiver` is set to another contract address, from which the rewards are further distributed.

    Returns: reward receiver (`address`).

    | Input  | Type      | Description                        |
    | ------ | --------- | ---------------------------------- |
    | `arg0` | `address` | Receiver of the rewards.           |

    ??? quote "Source code"

        === "LiquidityGaugeV6.vy"

            ```python
            rewards_receiver: public(HashMap[address, address])
            ```

    === "Example"
        ```shell
        >>> LiquidityGaugeV6.rewards_receiver('0x2618F4c64805526a3092d41f25597CcfE4Dd8216')     # random user
        '0x0000000000000000000000000000000000000000'

        >>> LiquidityGaugeV6.rewards_receiver('0x989AEb4d175e16225E39E87d0D97A3360524AD80')     # convex
        '0xF681fd1C9118085c3aCB0Eec9d57e25A6e99208f'
        ```


### `set_rewards_receiver`
!!! description "`LiquidityGaugeV6.set_rewards_receiver(_receiver: address)`"

    Function to set the default reward receiver for the caller. When set to `empty(address)`, rewards are sent to the caller.

    | Input       | Type      | Description                        |
    | ----------- | --------- | ---------------------------------- |
    | `_receiver` | `address` | Receiver address for any rewards claimed. |

    ??? quote "Source code"

        === "LiquidityGaugeV6.vy"

            ```python
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
        ```shell
        >>> soon
        ```



---



## **Permissionless Rewards**

Newer liquidity gauges (from `LiquidityGaugeV3.vy` and upwards) introduce the possibility to add what are termed "permissionless rewards." However, the term "permissionless" might be misleading as only a `distributor` address, set by the gauge's `manager`, can add these rewards. The `manager` address is set to [`tx.origin`](https://docs.vyperlang.org/en/stable/constants-and-vars.html?highlight=tx.origin#block-and-transaction-properties) at the time of contract deployment.

To add rewards to a gauge, a reward token and a distributor must be set by calling the `set_reward_distributor` function. This action can only be performed by the `manager` or the `admin` of the Factory contract, wich deployed the pool. Each reward token can have only one distributor. The "right to add a reward token" can be transfered. Tokens are added as rewards to the gauge via the `add_reward` method.

!!!warning "NOT BOOSTABLE: Distribution of Externally Added Rewards"
    Externally added rewards are not boostable and are distributed purely based on the user's unboosted share of liquidity in the gauge.

    For example, if Alice holds 10% of the LP tokens staked in the gauge, she will receive 10% of the externally added rewards, assuming there are no changes in her liquidity share or the amount of rewards.



### `reward_data`
!!! description "`LiquidityGaugeV6.reward_data(arg0: address) -> tuple: view`"

    Getter for the data of a specific reward token.

    Returns: token (`address`), distributor (`address`), finish_period (`uint256`), rate (`uint256`), last_update (`uint256`) and integral (`uint256`).

    | Input  | Type      | Description                        |
    | ------ | --------- | ---------------------------------- |
    | `arg0` | `address` | Address of the reward token.       |

    ??? quote "Source code"

        === "LiquidityGaugeV6.vy"

            ```python
            struct Reward:
                token: address
                distributor: address
                period_finish: uint256
                rate: uint256
                last_update: uint256
                integral: uint256

            reward_data: public(HashMap[address, Reward])
            ```

    === "Example"
        ```shell
        >>> LiquidityGaugeV6.reward_data('0xfe18aE03741a5b84e39C295Ac9C856eD7991C38e')
        '0x0000000000000000000000000000000000000000', '0xC56706334afE5a1638845ED9168E2ca3b3dbCCe7', 1715673839, 1186851500823, 1713351359, 16346318221475032
        ```


### `reward_tokens`
!!! description "`LiquidityGaugeV6.reward_tokens(arg0: uint256) -> address: view`"

    Getter for the added reward token at index `arg0`. New tokens are populated to this variable when calling the `add_reward` function.

    Returns: reward token (`address`).

    | Input  | Type      | Description                        |
    | ------ | --------- | ---------------------------------- |
    | `arg0` | `uint256` | Index. |

    ??? quote "Source code"

        === "LiquidityGaugeV6.vy"

            ```python
            MAX_REWARDS: constant(uint256) = 8

            # array of reward tokens
            reward_tokens: public(address[MAX_REWARDS])

            ```

    === "Example"
        ```shell
        >>> LiquidityGaugeV6.reward_tokens(0)
        '0xfe18aE03741a5b84e39C295Ac9C856eD7991C38e'

        >>> LiquidityGaugeV6.reward_tokens(1)
        '0x0000000000000000000000000000000000000000'
        ```


### `reward_count`
!!! description "`LiquidityGaugeV6.reward_count() -> uint256: view`"

    Getter for the count of added reward tokens. This variable is incremented by one each time `add_rewards` is called.

    Returns: number of reward tokens added (`uint256`).

    ??? quote "Source code"

        === "LiquidityGaugeV6.vy"

            ```python
            reward_count: public(uint256)
            ```

    === "Example"
        ```shell
        >>> LiquidityGaugeV6.reward_count()
        1
        ```


### `manager`
!!! description "`LiquidityGaugeV6.manager() -> address: view`"

    Getter for the gauge manager. This address can add new reward tokens or set distributors for those tokens. The variable is populated when initializing the contract and is set to `tx.origin`, meaning the signer of the transaction which deploys the gauge is assigned as the gauge manager. The gauge manager is upgradable. It can be changed via the `set_gauge_manager` function.

    Returns: gauge manager (`address`).

    ??? quote "Source code"

        === "LiquidityGaugeV6.vy"

            ```python
            manager: public(address)

            @external
            def __init__(_lp_token: address):
                """
                @notice Contract constructor
                @param _lp_token Liquidity Pool contract address
                """
                self.lp_token = _lp_token
                self.factory = msg.sender
                self.manager = tx.origin

                ...
            ```

    === "Example"
        ```shell
        >>> LiquidityGaugeV6.manager()
        '0xC56706334afE5a1638845ED9168E2ca3b3dbCCe7'
        ```


### `add_reward`
!!! description "`LiquidityGaugeV6.add_reward(_reward_token: address, _distributor: address):`"

    !!!guard "Guarded Methods"
        This function can only be called by the `manager` of the gauge or the `admin` of the Factory.

    Function to add specify a reward token and distributor for the gauge. Once a reward tokens is added, it can not be removed anymore.

    | Input           | Type      | Description                        |
    | --------------- | --------- | ---------------------------------- |
    | `_reward_token` | `address` | Reward token address to add.       |
    | `_distributor`  | `address` | Address which can deposit the reward token. |

    ??? quote "Source code"

        === "LiquidityGaugeV6.vy"

            ```python
            @external
            def add_reward(_reward_token: address, _distributor: address):
                """
                @notice Add additional rewards to be distributed to stakers
                @param _reward_token The token to add as an additional reward
                @param _distributor Address permitted to fund this contract with the reward token
                """
                assert msg.sender in [self.manager, Factory(self.factory).admin()]  # dev: only manager or factory admin
                assert _distributor != empty(address)  # dev: distributor cannot be zero address

                reward_count: uint256 = self.reward_count
                assert reward_count < MAX_REWARDS
                assert self.reward_data[_reward_token].distributor == empty(address)

                self.reward_data[_reward_token].distributor = _distributor
                self.reward_tokens[reward_count] = _reward_token
                self.reward_count = reward_count + 1
            ```

    === "Example"
        ```shell
        >>> soon
        ```


### `set_gauge_manager`
!!! description "`LiquidityGaugeV6.set_gauge_manager(_gauge_manager: address)`"

    !!!guard "Guarded Methods"
        This function can only be called by the `manager` of the gauge or the `admin` of the Factory.

    Function to set a new gauge manager.

    Emits: `SetGaugeManager`

    | Input               | Type      | Description                        |
    | ------------------- | --------- | ---------------------------------- |
    | `set_gauge_manager` | `address` | New gauge manager address.         |

    ??? quote "Source code"

        === "LiquidityGaugeV6.vy"

            ```python
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
                assert msg.sender in [self.manager, Factory(self.factory).admin()]  # dev: only manager or factory admin

                self.manager = _gauge_manager
                log SetGaugeManager(_gauge_manager)
            ```

    === "Example"
        ```shell
        >>> soon
        ```


### `set_reward_distributor`
!!! description "`LiquidityGaugeV6.set_reward_distributor(_reward_token: address, _distributor: address)`"

    !!!guard "Guarded Methods"
        This function can only be called by the `manager` of the gauge or the `admin` of the Factory.

    Function to reassign the reward distributor for a reward token.

    | Input           | Type      | Description                        |
    | --------------- | --------- | ---------------------------------- |
    | `_reward_token` | `address` | Reward token to reassign the distribution rights for. |
    | `_distributor`  | `address` | New reward distributor. |

    ??? quote "Source code"

        === "LiquidityGaugeV6.vy"

            ```python
            reward_data: public(HashMap[address, Reward])

            @external
            def set_reward_distributor(_reward_token: address, _distributor: address):
                """
                @notice Reassign the reward distributor for a reward token
                @param _reward_token The reward token to reassign distribution rights to
                @param _distributor The address of the new distributor
                """
                current_distributor: address = self.reward_data[_reward_token].distributor

                assert msg.sender in [current_distributor, Factory(self.factory).admin(), self.manager]
                assert current_distributor != empty(address)
                assert _distributor != empty(address)

                self.reward_data[_reward_token].distributor = _distributor
            ```

    === "Example"
        ```shell
        >>> soon
        ```


### `deposit_reward_token`
!!! description "`LiquidityGaugeV6.deposit_reward_token(_reward_token: address, _amount: uint256, _epoch: uint256 = WEEK)`"

    !!!guard "Guarded Methods"
        This function can only be called by the `manager` of the gauge or the `admin` of the Factory.

    Function to deposit a specific amount of reward tokens for a specified duration. If additional amounts of the same reward tokens are added, the leftover from the current distribution will be rolled over into the next distribution.

    !!!example "Example"
        The gauge manager deposits 70 tokens right at the beginning of the week. Distribution payoff is the following:

        $\frac{70}{604800} = 0.00011574074$ tokens per second, which equals to 10 tokens per day for the next 7 days.

        After six days, the gauge manager decides to add 70 additional tokens, again for a duration of 7 days. The leftover 10 tokens which have not yet been distributed are rolled into the next "distribution phase":

        $\frac{10 + 70}{604800} = 0.00013227513$ tokens per second, which equals to around 11.43 tokens per day for the next 7 days.

    | Input           | Type      | Description                                           |
    | --------------- | --------- | ----------------------------------------------------- |
    | `_reward_token` | `address` | Reward token to deposit.                              |
    | `_amount`       | `uint256` | Amount of reward tokens to deposit.                   |
    | `_epoch`        | `uint256` | Duration the rewards are distributed across, denominated in seconds. Defaults to a week (604800s). |


    ??? quote "Source code"

        === "LiquidityGaugeV6.vy"

            ```python
            WEEK: constant(uint256) = 604800

            @external
            @nonreentrant("lock")
            def deposit_reward_token(_reward_token: address, _amount: uint256, _epoch: uint256 = WEEK):
                """
                @notice Deposit a reward token for distribution
                @param _reward_token The reward token being deposited
                @param _amount The amount of `_reward_token` being deposited
                @param _epoch The duration the rewards are distributed across.
                """
                assert msg.sender == self.reward_data[_reward_token].distributor

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

                period_finish: uint256 = self.reward_data[_reward_token].period_finish
                assert amount_received > _epoch  # dev: rate will tend to zero!

                if block.timestamp >= period_finish:
                    self.reward_data[_reward_token].rate = amount_received / _epoch
                else:
                    remaining: uint256 = period_finish - block.timestamp
                    leftover: uint256 = remaining * self.reward_data[_reward_token].rate
                    self.reward_data[_reward_token].rate = (amount_received + leftover) / _epoch

                self.reward_data[_reward_token].last_update = block.timestamp
                self.reward_data[_reward_token].period_finish = block.timestamp + _epoch
            ```

    === "Example"
        ```shell
        >>> soon
        ```


---


## **Boosting Your LP Tokens**

Provided liquidity is boosted by the veCRV balance of the user, allowing for boosts up to 2.5 times. Gauges measure liquidity with respect to the user's boost in the `working_balances` variable. The total liquidity deposited in the gauge is represented by the `working_supply` method.

The [`working_balances`](#working_balances) of a user and the total [`working_supply`](#working_supply) are adjusted via the internal `_update_liquidity_limit` function when the following actions occur:

- **Transferring Tokens**: `working_balances` are adjusted for both the sender and the receiver of the LP tokens.
- **Depositing LP Tokens into the Gauge**: Adjusts the balance to reflect the new total.
- **Withdrawing LP Tokens from the Gauge**: Reduces the balance according to the amount withdrawn.
- **Performing a Manual Checkpoint**: Using the `user_checkpoint` function.
- **When a User is 'Kicked' for Abusing Their Boost**: For more information on what constitutes abuse and the repercussions, see [here](#kick).


???quote "`_update_liquidity_limit`"

    ```py
    TOKENLESS_PRODUCTION: constant(uint256) = 40

    @internal
    def _update_liquidity_limit(addr: address, l: uint256, L: uint256):
        """
        @notice Calculate limits which depend on the amount of CRV token per-user.
                Effectively it calculates working balances to apply amplification
                of CRV production by CRV
        @param addr User address
        @param l User's amount of liquidity (LP tokens)
        @param L Total amount of liquidity (LP tokens)
        """
        # To be called after totalSupply is updated
        voting_balance: uint256 = VotingEscrowBoost(VEBOOST_PROXY).adjusted_balance_of(addr)
        voting_total: uint256 = ERC20(VOTING_ESCROW).totalSupply()

        lim: uint256 = l * TOKENLESS_PRODUCTION / 100
        if voting_total > 0:
            lim += L * voting_balance / voting_total * (100 - TOKENLESS_PRODUCTION) / 100

        lim = min(l, lim)
        old_bal: uint256 = self.working_balances[addr]
        self.working_balances[addr] = lim
        _working_supply: uint256 = self.working_supply + lim - old_bal
        self.working_supply = _working_supply

        log UpdateLiquidityLimit(addr, l, L, lim, _working_supply)
    ```

*General formula for calculating the boost:*

$$\text{lim}  = l \times 0.4$$

$$\text{lim} = \text{lim} + L \times \frac{\text{voting_balance}}{\text{voting_total}} \times 0.6$$

$$\text{lim} = \min(l, \text{lim})$$

$$\text{boost factor} = \frac{lim}{l}$$

*with:*

| Variable                | Description                                  |
| :---------------------: | -------------------------------------------- |
| $l$                     | User LP tokens deposited into the gauge.[^1] |
| $L$                     | Total LP tokens deposited into the gauge.    |
| $\text{voting_balance}$ | Users veCRV balance.                         |
| $\text{voting_total}$   | Total veCRV balance.                         |


[^1]: A user does not neccessarily need to deposit the LP into the gauge himself. Someone else can deposit for him or the "staked LP token" can be transfered to him.

---


Let's examine two different users. Both are providing the same amount of LP tokens (same liquidity), but the first user does not receive a boost because he does not have any veCRV. The second user has a veCRV balance of 500. The total veCRV balance is assumed to be 10,000.


```shell
l = 1000                                    # users LP tokens in gauge
L = 50000                                   # total LP tokens in gauge

voting_balance_user1 = 0                    # veCRV balance user1
voting_balance_user2 = 500                  # veCRV balance user2
voting_total = 10000                        # total veCRV balance
```

---

**NO BOOST**

*Lets calculate the LP position of a user that has a vecrv balance of 0:*

$\text{lim} = 1000 * 0.4 = 400$

$\text{lim} = 400 + 50000 * \frac{0}{10000} * 0.6 = 400$

$\text{lim} = \min(1000, 400)$

*The working supply of this user is 400 LP tokens. The boost is calculated by:*

$\text{boost factor} = \frac{400}{400} = 1$


---


**BOOST**

*Lets calculate the LP position of a user that has a vecrv balance of 500 and therefore receives a boost on his provided liquidity:*

$\text{lim} = 1000 * 0.4 = 400$

$\text{lim} = 400 + 50000 * \frac{500}{10000} * 0.6 = 1900$

$\text{lim} = \min(1000, 1900)$

*The working supply of this user is 1000 LP tokens. The boost is calculated by:*

$\text{boost factor} = \frac{1000}{400} = 2.5$


---


### `working_balances`
!!! description "`LiquidityGaugeV6.working_balances(arg0: address) -> uint256: view`"

    Getter for the working balances of a user. This represents the effective liquidity of a user, which is used to calculate the CRV rewards they are entitled to. Essentially, it's the boosted balance of a user if they have some veCRV. If a user has no boost at all, their `working_balance` will be 40% of their LP tokens. If the position is fully boosted (2.5x), their `working_balance` will be equal to their LP tokens.

    *For example:*

    - 1 LP token with no boost = `working_balances(user) = 0.4`
    - 1 LP token with 1.5 boost = `working_balances(user) = 1.5`
    - 1 LP token with 2.5 boost = `working_balances(user) = 2.5`

    Returns: working balance (`uint256`).

    | Input  | Type      | Description                               |
    | ------ | --------- | ----------------------------------------- |
    | `arg0` | `address` | Address to check the working balance for. |

    ??? quote "Source code"

        === "LiquidityGaugeV6.vy"

            ```python
            TOKENLESS_PRODUCTION: constant(uint256) = 40

            working_balances: public(HashMap[address, uint256])

            @internal
            def _update_liquidity_limit(addr: address, l: uint256, L: uint256):
                """
                @notice Calculate limits which depend on the amount of CRV token per-user.
                        Effectively it calculates working balances to apply amplification
                        of CRV production by CRV
                @param addr User address
                @param l User's amount of liquidity (LP tokens)
                @param L Total amount of liquidity (LP tokens)
                """
                # To be called after totalSupply is updated
                voting_balance: uint256 = VotingEscrowBoost(VEBOOST_PROXY).adjusted_balance_of(addr)
                voting_total: uint256 = ERC20(VOTING_ESCROW).totalSupply()

                lim: uint256 = l * TOKENLESS_PRODUCTION / 100
                if voting_total > 0:
                    lim += L * voting_balance / voting_total * (100 - TOKENLESS_PRODUCTION) / 100

                lim = min(l, lim)
                old_bal: uint256 = self.working_balances[addr]
                self.working_balances[addr] = lim
                _working_supply: uint256 = self.working_supply + lim - old_bal
                self.working_supply = _working_supply

                log UpdateLiquidityLimit(addr, l, L, lim, _working_supply)
            ```

    === "Example"
        ```shell
        >>> LiquidityGaugeV6.working_balances('0x989AEb4d175e16225E39E87d0D97A3360524AD80')
        11470659994458155726
        ```


### `working_supply`
!!! description "`LiquidityGaugeV6.working_supply() -> uint256: view`"

    Getter for the working supply. This variale represents the sum of all `working_balances` of users who provided liquidity in the gauge.

    Returns: working supply (`uint256`).

    ??? quote "Source code"

        === "LiquidityGaugeV6.vy"

            ```python
            working_supply: public(uint256) 

            @internal
            def _update_liquidity_limit(addr: address, l: uint256, L: uint256):
                """
                @notice Calculate limits which depend on the amount of CRV token per-user.
                        Effectively it calculates working balances to apply amplification
                        of CRV production by CRV
                @param addr User address
                @param l User's amount of liquidity (LP tokens)
                @param L Total amount of liquidity (LP tokens)
                """
                # To be called after totalSupply is updated
                voting_balance: uint256 = VotingEscrowBoost(VEBOOST_PROXY).adjusted_balance_of(addr)
                voting_total: uint256 = ERC20(VOTING_ESCROW).totalSupply()

                lim: uint256 = l * TOKENLESS_PRODUCTION / 100
                if voting_total > 0:
                    lim += L * voting_balance / voting_total * (100 - TOKENLESS_PRODUCTION) / 100

                lim = min(l, lim)
                old_bal: uint256 = self.working_balances[addr]
                self.working_balances[addr] = lim
                _working_supply: uint256 = self.working_supply + lim - old_bal
                self.working_supply = _working_supply

                log UpdateLiquidityLimit(addr, l, L, lim, _working_supply)
            ```

    === "Example"
        ```shell
        >>> LiquidityGaugeV6.working_supply()
        12665099687428791483
        ```



---



## **Checkpoints**


### `user_checkpoint`
!!! description "`LiquidityGaugeV6.user_checkpoint(addr: address) -> bool`"

    !!!guard "Guarded Methods"
        This function can only be called by the `addr` himself or the `Minter.vy` contract.

    Function to record a checkpoint for `addr`.

    Returns: True (`bool`).

    | Input  | Type      | Description                            |
    | ------ | --------- | -------------------------------------- |
    | `addr` | `address` | Address who's checkpoint is recoreded. |

    ??? quote "Source code"

        === "LiquidityGaugeV6.vy"

            ```python
            @external
            def user_checkpoint(addr: address) -> bool:
                """
                @notice Record a checkpoint for `addr`
                @param addr User address
                @return bool success
                """
                assert msg.sender in [addr, MINTER]  # dev: unauthorized
                self._checkpoint(addr)
                self._update_liquidity_limit(addr, self.balanceOf[addr], self.totalSupply)
                return True

            @internal
            def _checkpoint(addr: address):
                """
                @notice Checkpoint for a user
                @dev Updates the CRV emissions a user is entitled to receive
                @param addr User address
                """
                _period: int128 = self.period
                _period_time: uint256 = self.period_timestamp[_period]
                _integrate_inv_supply: uint256 = self.integrate_inv_supply[_period]

                inflation_params: uint256 = self.inflation_params
                prev_future_epoch: uint256 = inflation_params >> 216
                gauge_is_killed: bool = self.is_killed

                rate: uint256 = inflation_params % 2 ** 216
                new_rate: uint256 = rate
                if gauge_is_killed:
                    rate = 0
                    new_rate = 0

                if prev_future_epoch >= _period_time:
                    future_epoch_time_write: uint256 = CRV20(CRV).future_epoch_time_write()
                    if not gauge_is_killed:
                        new_rate = CRV20(CRV).rate()
                    self.inflation_params = (future_epoch_time_write << 216) + new_rate

                # Update integral of 1/supply
                if block.timestamp > _period_time:
                    _working_supply: uint256 = self.working_supply
                    Controller(GAUGE_CONTROLLER).checkpoint_gauge(self)
                    prev_week_time: uint256 = _period_time
                    week_time: uint256 = min((_period_time + WEEK) / WEEK * WEEK, block.timestamp)

                    for i in range(500):
                        dt: uint256 = week_time - prev_week_time
                        w: uint256 = Controller(GAUGE_CONTROLLER).gauge_relative_weight(self, prev_week_time)

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
                _working_balance: uint256 = self.working_balances[addr]
                self.integrate_fraction[addr] += _working_balance * (_integrate_inv_supply - self.integrate_inv_supply_of[addr]) / 10 ** 18
                self.integrate_inv_supply_of[addr] = _integrate_inv_supply
                self.integrate_checkpoint_of[addr] = block.timestamp

            @internal
            def _update_liquidity_limit(addr: address, l: uint256, L: uint256):
                """
                @notice Calculate limits which depend on the amount of CRV token per-user.
                        Effectively it calculates working balances to apply amplification
                        of CRV production by CRV
                @param addr User address
                @param l User's amount of liquidity (LP tokens)
                @param L Total amount of liquidity (LP tokens)
                """
                # To be called after totalSupply is updated
                voting_balance: uint256 = VotingEscrowBoost(VEBOOST_PROXY).adjusted_balance_of(addr)
                voting_total: uint256 = ERC20(VOTING_ESCROW).totalSupply()

                lim: uint256 = l * TOKENLESS_PRODUCTION / 100
                if voting_total > 0:
                    lim += L * voting_balance / voting_total * (100 - TOKENLESS_PRODUCTION) / 100

                lim = min(l, lim)
                old_bal: uint256 = self.working_balances[addr]
                self.working_balances[addr] = lim
                _working_supply: uint256 = self.working_supply + lim - old_bal
                self.working_supply = _working_supply

                log UpdateLiquidityLimit(addr, l, L, lim, _working_supply)
            ```

    === "Example"
        ```shell
        >>> soon
        ```


### `kick`
!!! description "`LiquidityGaugeV6.kick(addr: address)`"

    Function to trigger a checkpoint for `addr` and therefore updating their boost. A user can only be kicked if they either had another voting event or their voting escrow lock expired. This function ensures no abusive usage of a boost.

    Emits: `UpdateLiquidityLimit`

    | Input  | Type      | Description                        |
    | ------ | --------- | ---------------------------------- |
    | `addr` | `address` | Address to kick.                   |

    ??? quote "Source code"

        === "LiquidityGaugeV6.vy"

            ```python
            event UpdateLiquidityLimit:
                user: indexed(address)
                original_balance: uint256
                original_supply: uint256
                working_balance: uint256
                working_supply: uint256

            @external
            def kick(addr: address):
                """
                @notice Kick `addr` for abusing their boost
                @dev Only if either they had another voting event, or their voting escrow lock expired
                @param addr Address to kick
                """
                t_last: uint256 = self.integrate_checkpoint_of[addr]
                t_ve: uint256 = VotingEscrow(VOTING_ESCROW).user_point_history__ts(
                    addr, VotingEscrow(VOTING_ESCROW).user_point_epoch(addr)
                )
                _balance: uint256 = self.balanceOf[addr]

                assert ERC20(VOTING_ESCROW).balanceOf(addr) == 0 or t_ve > t_last # dev: kick not allowed
                assert self.working_balances[addr] > _balance * TOKENLESS_PRODUCTION / 100  # dev: kick not needed

                self._checkpoint(addr)
                self._update_liquidity_limit(addr, self.balanceOf[addr], self.totalSupply)

            @internal
            def _checkpoint(addr: address):
                """
                @notice Checkpoint for a user
                @dev Updates the CRV emissions a user is entitled to receive
                @param addr User address
                """
                _period: int128 = self.period
                _period_time: uint256 = self.period_timestamp[_period]
                _integrate_inv_supply: uint256 = self.integrate_inv_supply[_period]

                inflation_params: uint256 = self.inflation_params
                prev_future_epoch: uint256 = inflation_params >> 216
                gauge_is_killed: bool = self.is_killed

                rate: uint256 = inflation_params % 2 ** 216
                new_rate: uint256 = rate
                if gauge_is_killed:
                    rate = 0
                    new_rate = 0

                if prev_future_epoch >= _period_time:
                    future_epoch_time_write: uint256 = CRV20(CRV).future_epoch_time_write()
                    if not gauge_is_killed:
                        new_rate = CRV20(CRV).rate()
                    self.inflation_params = (future_epoch_time_write << 216) + new_rate

                # Update integral of 1/supply
                if block.timestamp > _period_time:
                    _working_supply: uint256 = self.working_supply
                    Controller(GAUGE_CONTROLLER).checkpoint_gauge(self)
                    prev_week_time: uint256 = _period_time
                    week_time: uint256 = min((_period_time + WEEK) / WEEK * WEEK, block.timestamp)

                    for i in range(500):
                        dt: uint256 = week_time - prev_week_time
                        w: uint256 = Controller(GAUGE_CONTROLLER).gauge_relative_weight(self, prev_week_time)

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
                _working_balance: uint256 = self.working_balances[addr]
                self.integrate_fraction[addr] += _working_balance * (_integrate_inv_supply - self.integrate_inv_supply_of[addr]) / 10 ** 18
                self.integrate_inv_supply_of[addr] = _integrate_inv_supply
                self.integrate_checkpoint_of[addr] = block.timestamp

            @internal
            def _update_liquidity_limit(addr: address, l: uint256, L: uint256):
                """
                @notice Calculate limits which depend on the amount of CRV token per-user.
                        Effectively it calculates working balances to apply amplification
                        of CRV production by CRV
                @param addr User address
                @param l User's amount of liquidity (LP tokens)
                @param L Total amount of liquidity (LP tokens)
                """
                # To be called after totalSupply is updated
                voting_balance: uint256 = VotingEscrowBoost(VEBOOST_PROXY).adjusted_balance_of(addr)
                voting_total: uint256 = ERC20(VOTING_ESCROW).totalSupply()

                lim: uint256 = l * TOKENLESS_PRODUCTION / 100
                if voting_total > 0:
                    lim += L * voting_balance / voting_total * (100 - TOKENLESS_PRODUCTION) / 100

                lim = min(l, lim)
                old_bal: uint256 = self.working_balances[addr]
                self.working_balances[addr] = lim
                _working_supply: uint256 = self.working_supply + lim - old_bal
                self.working_supply = _working_supply

                log UpdateLiquidityLimit(addr, l, L, lim, _working_supply)
            ```

    === "Example"
        ```shell
        >>> soon
        ```


---

## **Killing Gauges**

Liquidity gauges have a "killed status" stored in the `is_killed` variable. This status can be set by the `admin` of the Factory, which was used to initially deploy the gauge, using the `set_killed` function. If the status is set to `True`, the gauges' `rate` and `future_rate` will be set to zero, and it will not be eligible to receive any more CRV emissions.

"Killing a gauge" can be undone by simply setting the `is_killed` status back to `false` using the `set_killed` function again.

!!!warning "Effect of Killing Gauges on Rewards"
    "Killing a gauge" affects only CRV emissions; externally added rewards will still be distributed.


### `is_killed`
!!! description "`LiquidityGaugeV6.is_killed() -> bool: view`"

    Getter function to check if the gauge is killed. If `ture`, the inflation rate for the gauge will be set to zero.

    Returns: killed status (`bool`).

    ??? quote "Source code"

        === "LiquidityGaugeV6.vy"

            ```python
            is_killed: public(bool)

            @internal
            def _checkpoint(addr: address):
                """
                @notice Checkpoint for a user
                @dev Updates the CRV emissions a user is entitled to receive
                @param addr User address
                """
                _period: int128 = self.period
                _period_time: uint256 = self.period_timestamp[_period]
                _integrate_inv_supply: uint256 = self.integrate_inv_supply[_period]

                inflation_params: uint256 = self.inflation_params
                prev_future_epoch: uint256 = inflation_params >> 216
                gauge_is_killed: bool = self.is_killed

                rate: uint256 = inflation_params % 2 ** 216
                new_rate: uint256 = rate
                if gauge_is_killed:
                    rate = 0
                    new_rate = 0
                ...
            ```

    === "Example"
        ```shell
        >>> LiquidityGaugeV6.is_killed()
        'False'
        ```


### `set_killed`
!!! description "`LiquidityGaugeV6.set_killed(_is_killed: bool)`"

    !!!guard "Guarded Methods"
        This function can only be called by the `admin` of the Factory.

    Function to kill a gauge.

    | Input        | Type   | Description                        |
    | ------------ | ------ | ---------------------------------- |
    | `_is_killed` | `bool` | Status to set the killed status to.  |

    ??? quote "Source code"

        === "LiquidityGaugeV6.vy"

            ```python
            is_killed: public(bool)

            @external
            def set_killed(_is_killed: bool):
                """
                @notice Set the killed status for this contract
                @dev When killed, the gauge always yields a rate of 0 and so cannot mint CRV
                @param _is_killed Killed status to set
                """
                assert msg.sender == Factory(self.factory).admin()  # dev: only owner

                self.is_killed = _is_killed
            ```

    === "Example"
        ```shell
        >>> soon
        ```


---


## **Contract Info Methods**

*Basic contract informations:*

### `integrate_fraction`
!!! description "`LiquidityGaugeV6.integrate_fraction(arg0: address) -> uint256: view`"

    Getter for the total amount of CRV, both mintable and already minted, that has been allocated to `arg0` from this gauge.

    Returns: integral of accrued rewards (`uint256`).

    | Input  | Type      | Description                        |
    | ------ | --------- | ---------------------------------- |
    | `arg0` | `address` | Address to check for.              |

    ??? quote "Source code"

        === "LiquidityGaugeV6.vy"

            ```python
            integrate_fraction: public(HashMap[address, uint256])
            ```

    === "Example"
        ```shell
        >>> LiquidityGaugeV6.integrate_fraction('0x989AEb4d175e16225E39E87d0D97A3360524AD80')
        1662908936954145
        ```


### `period`
!!! description "`LiquidityGaugeV6.period() -> int128: view`"

    Getter for the period of the gauge. This variable is incremented by one each time a checkpoint was made.

    Returns: current period (`int128`).

    ??? quote "Source code"

        === "LiquidityGaugeV6.vy"

            ```python
            period: public(int128)
            ```

    === "Example"
        ```shell
        >>> LiquidityGaugeV6.period()
        6
        ```


### `period_timestamp`
!!! description "`LiquidityGaugeV6.period_timestamp(arg0: uint256) -> uint256: view`"

    Getter for the timestamp of a period.

    Returns: timestamp

    | Input  | Type      | Description                        |
    | ------ | --------- | ---------------------------------- |
    | `arg0`    | `uint256` | Period to get the timestamp for.   |

    ??? quote "Source code"

        === "LiquidityGaugeV6.vy"

            ```python
            period_timestamp: public(uint256[100000000000000000000000000000])
            ```

    === "Example"
        ```shell
        >>> LiquidityGaugeV6.period_timestamp(7)
        1713351359
        ```


### `inflation_rate`
!!! description "`LiquidityGaugeV6.inflation_rate() -> uint256: view`"

    Getter for the current inflation rate per second of CRV. This getter retrieves the lower 216 bits of `inflation_params`, which stores the inflation rate and the future epoch time.

    Returns: CRV inflation rate (`uint256`).

    ??? quote "Source code"

        === "LiquidityGaugeV6.vy"

            ```python
            inflation_params: uint256

            @view
            @external
            def inflation_rate() -> uint256:
                """
                @notice Get the locally stored CRV inflation rate
                """
                return self.inflation_params % 2 ** 216
            ```

    === "Example"
        ```shell
        >>> LiquidityGaugeV6.inflation_rate()
        5181574864521283150             # 5.18157486452 CRV per second    
        ```


### `future_epoch_time`
!!! description "`LiquidityGaugeV6.future_epoch_time() -> uint256: view`"

    Getter for the future epoch time. This getter retrieves the upper 216 bits of `inflation_params`, which stores the inflation rate and the future epoch time.

    Returns: future epoch time (`uint256`).

    ??? quote "Source code"

        === "LiquidityGaugeV6.vy"

            ```python
            inflation_params: uint256

            @view
            @external
            def future_epoch_time() -> uint256:
                """
                @notice Get the locally stored CRV future epoch start time
                """
                return self.inflation_params >> 216
            ```

    === "Example"
        ```shell
        >>> LiquidityGaugeV6.future_epoch_time()
        1723501048
        ```


### `factory`
!!! description "`LiquidityGaugeV6.factory() -> address: view`"

    Getter for the factory which deployed the gauge.

    Returns: factory (`address`).

    ??? quote "Source code"

        === "LiquidityGaugeV6.vy"

            ```python
            factory: public(address)

            @external
            def __init__(_lp_token: address):
                """
                @notice Contract constructor
                @param _lp_token Liquidity Pool contract address
                """
                self.lp_token = _lp_token
                self.factory = msg.sender
                self.manager = tx.origin
                ...
            ```

    === "Example"
        ```shell
        >>> LiquidityGaugeV6.factory()
        '0x98EE851a00abeE0d95D08cF4CA2BdCE32aeaAF7F'
        ```


### `lp_token`
!!! description "`LiquidityGaugeV6.lp_token() -> address: view`"

    Getter for the LP token which is deposited into of withdrawn from the gauge.

    Returns: LP token (`address`).

    ??? quote "Source code"

        === "LiquidityGaugeV6.vy"

            ```python
            lp_token: public(address)

            @external
            def __init__(_lp_token: address):
                """
                @notice Contract constructor
                @param _lp_token Liquidity Pool contract address
                """
                self.lp_token = _lp_token
                self.factory = msg.sender
                self.manager = tx.origin
                ...
            ```

    === "Example"
        ```shell
        >>> LiquidityGaugeV6.lp_token()
        '0x86EA1191a219989d2dA3a85c949a12A92f8ED3Db'
        ```
    