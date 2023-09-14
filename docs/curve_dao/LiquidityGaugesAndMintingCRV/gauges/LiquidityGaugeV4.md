# Outline of modified functionality:
- permissionless rewards


!!!info
    Source code of the LiquidityGaugeV4 can be found on [Github](https://github.com/curvefi/curve-dao-contracts/blob/master/contracts/gauges/LiquidityGaugeV4.vy).


## Permissionless Rewards

LiquidityGaugeV4 opens up the possibility to add permissionless rewards to a gauge by a `distributor`.
When deploying a gauge through the [OwnershipProxy](../../ownership-proxy/overview.md), the deployer (`msg.sender`) is automatically set as the *gauge manager*. This address is able to call `add_rewards` within the OwnershipProxy to add *reward tokens* and *distributors*. 

If the gauge was deployed through a factory there needs to be a quick [migration](../../ownership-proxy/StableSwapOwnerProxy.md#migrate_gauge_manager) first to add permissionless rewards. 

## Reward Informations

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


### `reward_data` (check this)
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
