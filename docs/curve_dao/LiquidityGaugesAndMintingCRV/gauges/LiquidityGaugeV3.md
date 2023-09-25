`LiquidityGaugeV3` retains a majority of `LiquidityGaugeV2’s` functionality such as tokenized deposits, and flexible onward staking with up to 8 reward tokens with some modifications.

**Outline of modified functionality:**

1. Ability to redirect claimed rewards to an alternative account.  
2. Opt-in claiming of rewards on interactions with the gauge, instead of auto-claiming.
3. Retrieving rewards from the reward contract happens at a minimum of once an hour, for reduced gas costs.
4. Expose the amount of claimed and claimable rewards for users.
5. Removal of `claim_historic_rewards` function.
6. Modify `claimable_reward` to be a slightly less accurate view function.
7. Reward tokens can no longer be removed once set, adding more tokens requires providing the array of reward_tokens with any new tokens appended.
8. `deposit(_value, _to)` and `withdraw(_value, _to)` functions have an additional optional argument `_claim_rewards`, which when set to `True` will claim any pending rewards.

As this gauge maintains a similar API to `LiquidityGaugeV2`, the documentation only covers functions that were added or modified since the previous version.


!!!deploy "Source Code"
    Source code of the LiquidityGaugeV3 can be found on [Github](https://github.com/curvefi/curve-dao-contracts/blob/master/contracts/gauges/LiquidityGaugeV3.vy).
    The following view methods and functions are using the [alUSD/3crv gauge](https://etherscan.io/address/0x9582c4adacb3bce56fea3e590f05c3ca2fb9c477) as an example.  



## Querying Reward Information

### `rewards_receiver`
!!! description "`LiquidityGaugeV3.rewards_receiver() -> address: view`"

    Getter for the reward receiver of address `arg0`.

    Returns: reward receiver (`address`).

    ??? quote "Source code"

        ```python hl_lines="1"
        rewards_receiver: public(HashMap[address, address])
        ```

    === "Example"

        ```shell
        >>> LiquidityGaugeV3.rewards_receiver('todo'):
        ''
        ```


### `set_rewards_receiver`
!!! description "`LiquidityGaugeV3.set_rewards_receiver(_receiver: address):`"

    Function to set the rewards receiver for any rewards claimed via `claim_rewards`.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_receiver` |  `address` | Reward Receiver Address |

    ??? quote "Source code"

        ```python hl_lines="1 4 10"
        rewards_receiver: public(HashMap[address, address])

        @external
        def set_rewards_receiver(_receiver: address):
            """
            @notice Set the default reward receiver for the caller.
            @dev When set to ZERO_ADDRESS, rewards are sent to the caller
            @param _receiver Receiver address for any rewards claimed via `claim_rewards`
            """
            self.rewards_receiver[msg.sender] = _receiver
        ```

    === "Example"

        ```shell
        >>> LiquidityGaugeV3.set_rewards_receiver('todo'):
        'todo'
        ```


### `last_claim`
!!! description "`LiquidityGaugeV3.last_claim() -> uint256:`"

    Getter for the timestamp of the last claim from `reward_contract`.

    Returns: timestamp (`uint256`).

    ??? quote "Source code"

        ```python hl_lines="3 8"
        @view
        @external
        def last_claim() -> uint256:
            """
            @notice Epoch timestamp of the last call to claim from `reward_contract`
            @dev Rewards are claimed at most once per hour in order to reduce gas costs
            """
            return shift(self.reward_data, -160)
        ```

    === "Example"

        ```shell
        >>> LiquidityGaugeV3.last_claim():
        1694558243
        ```


## Checking and Claiming Rewards

Unlike LiquidityGaugeV2, rewards are not automatically claimed each time a user performs an action on the gauge.


### `claim_rewards`
!!! description "`LiquidityGaugeV3.claim_rewards(_addr: address = msg.sender, _receiver: address = ZERO_ADDRESS):`"

    Function to claim all available reward tokens for `_addr`.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_addr` |  `address` | Address to claim rewards for |
    | `_receiver` |  `address` | Receiver of the rewards. Defaults to `msg.sender`. |

    ??? quote "Source code"

        ```python hl_lines="3 13 16"
        @external
        @nonreentrant('lock')
        def claim_rewards(_addr: address = msg.sender, _receiver: address = ZERO_ADDRESS):
            """
            @notice Claim available reward tokens for `_addr`
            @param _addr Address to claim for
            @param _receiver Address to transfer rewards to - if set to
                            ZERO_ADDRESS, uses the default reward receiver
                            for the caller
            """
            if _receiver != ZERO_ADDRESS:
                assert _addr == msg.sender  # dev: cannot redirect when claiming for another user
            self._checkpoint_rewards(_addr, self.totalSupply, True, _receiver)

        @internal
        def _checkpoint_rewards( _user: address, _total_supply: uint256, _claim: bool, _receiver: address):
            """
            @notice Claim pending rewards and checkpoint rewards for a user
            """
            # load reward tokens and integrals into memory
            reward_tokens: address[MAX_REWARDS] = empty(address[MAX_REWARDS])
            reward_integrals: uint256[MAX_REWARDS] = empty(uint256[MAX_REWARDS])
            for i in range(MAX_REWARDS):
                token: address = self.reward_tokens[i]
                if token == ZERO_ADDRESS:
                    break
                reward_tokens[i] = token
                reward_integrals[i] = self.reward_integral[token]

            reward_data: uint256 = self.reward_data
            if _total_supply != 0 and reward_data != 0 and block.timestamp > shift(reward_data, -160) + CLAIM_FREQUENCY:
                # track balances prior to claiming
                reward_balances: uint256[MAX_REWARDS] = empty(uint256[MAX_REWARDS])
                for i in range(MAX_REWARDS):
                    token: address = self.reward_tokens[i]
                    if token == ZERO_ADDRESS:
                        break
                    reward_balances[i] = ERC20(token).balanceOf(self)

                # claim from reward contract
                reward_contract: address = convert(reward_data % 2**160, address)
                raw_call(reward_contract, slice(self.reward_sigs, 8, 4))  # dev: bad claim sig
                self.reward_data = convert(reward_contract, uint256) + shift(block.timestamp, 160)

                # get balances after claim and calculate new reward integrals
                for i in range(MAX_REWARDS):
                    token: address = reward_tokens[i]
                    if token == ZERO_ADDRESS:
                        break
                    dI: uint256 = 10**18 * (ERC20(token).balanceOf(self) - reward_balances[i]) / _total_supply
                    if dI > 0:
                        reward_integrals[i] += dI
                        self.reward_integral[token] = reward_integrals[i]

            if _user != ZERO_ADDRESS:
                user_balance: uint256 = self.balanceOf[_user]
                receiver: address = _receiver
                if _claim and _receiver == ZERO_ADDRESS:
                    # if receiver is not explicitly declared, check if a default receiver is set
                    receiver = self.rewards_receiver[_user]
                    if receiver == ZERO_ADDRESS:
                        # if no default receiver is set, direct claims to the user
                        receiver = _user

                # calculate new user reward integral and transfer any owed rewards
                for i in range(MAX_REWARDS):
                    token: address = reward_tokens[i]
                    if token == ZERO_ADDRESS:
                        break

                    integral: uint256 = reward_integrals[i]
                    integral_for: uint256 = self.reward_integral_for[token][_user]
                    if integral_for < integral or _total_supply == 0:
                        self.reward_integral_for[token][_user] = integral
                        claim_data: uint256 = self.claim_data[_user][token]

                        new_claimable: uint256 = user_balance * (integral - integral_for) / 10**18

                        total_claimed: uint256 = claim_data % 2**128
                        total_claimable: uint256 = shift(claim_data, -128) + new_claimable

                        if _claim and total_claimable > 0:
                            response: Bytes[32] = raw_call(
                                token,
                                concat(
                                    method_id("transfer(address,uint256)"),
                                    convert(receiver, bytes32),
                                    convert(total_claimable, bytes32),
                                ),
                                max_outsize=32,
                            )
                            if len(response) != 0:
                                assert convert(response, bool)
                            self.claim_data[_user][token] = total_claimed + total_claimable
                        elif new_claimable > 0:
                            self.claim_data[_user][token] = total_claimed + shift(total_claimable, 128)
        ```

    === "Example"

        ```shell
        >>> LiquidityGaugeV3.claim_rewards('todo'):
        todo
        ```


### `claimed_reward`
!!! description "`LiquidityGaugeV3.claimed_reward(_addr: address, _token: address) -> uint256:`"

    Getter for the amount of already-claimed reward tokens `_token` for `_addr`.

    Returns: claimable reward token amount (`uint256`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_addr` |  `address` | User Address |
    | `_token` |  `address` | Reward Token Address |

    ??? quote "Source code"

        ```python hl_lines="6 13"
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
        >>> LiquidityGaugeV3.claimed_reward('todo'):
        'todo'
        ```


### `claimable_rewards`
!!! description "`LiquidityGaugeV3.claimable_reward(_addr: address, _token: address) -> uint256:`"

    Getter for the number of claimable reward tokens for a user. This getter does not include pending claimable amounts in `reward_contract`.

    Returns: claimable reward token amount (`uint256`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_addr` |  `address` | Address to claim rewards for |
    | `_token` |  `address` | Receiver of the rewards. Defaults to `msg.sender`. |

    ??? quote "Source code"

        ```python hl_lines="6 16"
        # user -> [uint128 claimable amount][uint128 claimed amount]
        claim_data: HashMap[address, HashMap[address, uint256]]

        @view
        @external
        def claimable_reward(_addr: address, _token: address) -> uint256:
            """
            @notice Get the number of claimable reward tokens for a user
            @dev This call does not consider pending claimable amount in `reward_contract`.
                Off-chain callers should instead use `claimable_rewards_write` as a
                view method.
            @param _addr Account to get reward amount for
            @param _token Token to get reward amount for
            @return uint256 Claimable reward token amount
            """
            return shift(self.claim_data[_addr][_token], -128)
        ```

    === "Example"

        ```shell
        >>> LiquidityGaugeV3.claimable_rewards('todo'):
        todo
        ```


### `claimable_reward_write`
!!! description "`LiquidityGaugeV3.claimable_reward_write(_addr: address, _token: address) -> uint256:`"

    Get the number of claimable reward tokens for a user. This function should be manually changed to “view” in the ABI. Calling it via a transaction will checkpoint a user’s rewards updating the value of `claimable_reward`. This function does not claim/distribute pending rewards for a user.

    Returns: claimable reward token (`uint256`).

    ??? quote "Source code"

        ```python hl_lines="6 17"
        # user -> [uint128 claimable amount][uint128 claimed amount]
        claim_data: HashMap[address, HashMap[address, uint256]]

        @external
        @nonreentrant('lock')
        def claimable_reward_write(_addr: address, _token: address) -> uint256:
            """
            @notice Get the number of claimable reward tokens for a user
            @dev This function should be manually changed to "view" in the ABI
                Calling it via a transaction will claim available reward tokens
            @param _addr Account to get reward amount for
            @param _token Token to get reward amount for
            @return uint256 Claimable reward token amount
            """
            if self.reward_tokens[0] != ZERO_ADDRESS:
                self._checkpoint_rewards(_addr, self.totalSupply, False, ZERO_ADDRESS)
            return shift(self.claim_data[_addr][_token], -128)
        ```

    === "Example"

        ```shell
        >>> LiquidityGaugeV3.claimable_reward_write('todo'):
        todo
        ```