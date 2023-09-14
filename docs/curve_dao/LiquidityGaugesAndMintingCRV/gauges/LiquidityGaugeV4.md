!!!info
    Source code of the LiquidityGaugeV4 can be found on [Github](https://github.com/curvefi/curve-dao-contracts/blob/master/contracts/gauges/LiquidityGaugeV4.vy).


# **Permissionless Rewards**
*LiquidityGaugeV4* opens up the possibility to add permissionless rewards to a gauge by a `distributor`.  
When deploying a gauge through the [OwnershipProxy](../../ownership-proxy/overview.md), the deployer (`msg.sender`) is automatically set as the *gauge manager*. This address is able to call **`add_rewards`** within the OwnershipProxy contract to add *reward tokens* and *distributors*. 

!!!tip
    On sidechains, permissionless rewards are directly built into the gauges. Whoever deploys the gauge can call `add_rewards` on the gauge contract itself.

If the gauge was deployed through a factory there needs to be a quick [migration](../../ownership-proxy/StableSwapOwnerProxy.md#migrate_gauge_manager) first to add permissionless rewards. 


## **Deposit Rewards**

### `deposit_reward_token`
!!! description "`LiquidityGaugeV4.deposit_reward_token(_reward_token: address, _amount: uint256):`"

    Function to deposit `_amount` of `_reward_token` into the gauge.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_reward_token` |  `address` | Reward Token |
    | `_amount` |  `uint256` | Amount of Reward Token to deposit |

    !!!note
        This function can only be called by the `distributor` of the reward token.

    ??? quote "Source code"

        ```python hl_lines="3"
        @external
        @nonreentrant("lock")
        def deposit_reward_token(_reward_token: address, _amount: uint256):
            assert msg.sender == self.reward_data[_reward_token].distributor

            self._checkpoint_rewards(ZERO_ADDRESS, self.totalSupply, False, ZERO_ADDRESS)

            response: Bytes[32] = raw_call(
                _reward_token,
                concat(
                    method_id("transferFrom(address,address,uint256)"),
                    convert(msg.sender, bytes32),
                    convert(self, bytes32),
                    convert(_amount, bytes32),
                ),
                max_outsize=32,
            )
            if len(response) != 0:
                assert convert(response, bool)

            period_finish: uint256 = self.reward_data[_reward_token].period_finish
            if block.timestamp >= period_finish:
                self.reward_data[_reward_token].rate = _amount / WEEK
            else:
                remaining: uint256 = period_finish - block.timestamp
                leftover: uint256 = remaining * self.reward_data[_reward_token].rate
                self.reward_data[_reward_token].rate = (_amount + leftover) / WEEK

            self.reward_data[_reward_token].last_update = block.timestamp
            self.reward_data[_reward_token].period_finish = block.timestamp + WEEK
        ```

    === "Example"

        ```shell
        >>> LiquidityGaugeV4.deposit_reward_token(0):
        '0xD533a949740bb3306d119CC777fa900bA034cd52'
        ```


## **Query Reward Informations**

### `rewards_token`
!!! description "`LiquidityGaugeV4.rewards_token(arg0: uint256) -> address: view`"

    Getter for the reward tokens for the gauge.

    Returns: reward token (`address`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `arg0` |  `uint256` | Reward Token Index |

    ??? quote "Source code"

        ```python hl_lines="1 4 15"
        reward_tokens: public(address[MAX_REWARDS])

        @external
        def add_reward(_reward_token: address, _distributor: address):
            """
            @notice Set the active reward contract
            """
            assert msg.sender == self.admin  # dev: only owner

            reward_count: uint256 = self.reward_count
            assert reward_count < MAX_REWARDS
            assert self.reward_data[_reward_token].distributor == ZERO_ADDRESS

            self.reward_data[_reward_token].distributor = _distributor
            self.reward_tokens[reward_count] = _reward_token
            self.reward_count = reward_count + 1
        ```

    === "Example"

        ```shell
        >>> LiquidityGaugeV4.rewards_token(0):
        '0xD533a949740bb3306d119CC777fa900bA034cd52'
        ```


### `reward_count`
!!! description "`LiquidityGaugeV4.reward_count() -> uint256: view`"

    Getter for how many reward tokens have been added.

    Returns: amount (`uint256`).

    ??? quote "Source code"

        ```python hl_lines="1 16"
        reward_count: public(uint256)

        @external
        def add_reward(_reward_token: address, _distributor: address):
            """
            @notice Set the active reward contract
            """
            assert msg.sender == self.admin  # dev: only owner

            reward_count: uint256 = self.reward_count
            assert reward_count < MAX_REWARDS
            assert self.reward_data[_reward_token].distributor == ZERO_ADDRESS

            self.reward_data[_reward_token].distributor = _distributor
            self.reward_tokens[reward_count] = _reward_token
            self.reward_count = reward_count + 1
        ```

    === "Example"

        ```shell
        >>> LiquidityGaugeV4.reward_count():
        1
        ```


### `reward_data`
!!! description "`LiquidityGaugeV4.reward_data(arg0: uint256) -> token: address, distributor: address, period_finish_ uint256, rate: uint256, last_update: uint256, integral: uint256`:"

    Getter for the reward data for reward token `arg0`.

    Returns: token (`address`), distributor (`address`), period_finish_ (`uint256`), rate: (`uint256`), last_update: (`uint256`) and integral (`uint256`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `arg0` |  `uint256` | Reward Token Index |

    ??? quote "Source code"

        ```python hl_lines="1"
        reward_data: public(HashMap[address, Reward])
        ```

    === "Example"

        ```shell
        >>> LiquidityGaugeV4.reward_data("0xD533a949740bb3306d119CC777fa900bA034cd52"):
        '0x0000000000000000000000000000000000000000', '0x7a16fF8270133F063aAb6C9977183D9e72835428', 1686408827, 82671957671957671, 1686408827, 709433824539444151212
        ```

