Newer LiquidityGauges open up the possibility to add permissionless rewards to a gauge by a `distributor`. When deploying a gauge directly through the [OwnershipProxy](../../ownership-proxy/overview.md), the deployer is automatically set as the *gauge manager*. This address is able to call **`add_rewards`** within the OwnershipProxy contract to add *reward tokens* and *distributors*, which can then be deposited into the gauge.   

If the gauge wasn't deployed through the OwnershipProxy, a [migration](#migrate_gauge_manager) is required first before adding permissionless rewards. For CryptoSwap pool gauges no migration is required.

!!!tip
    On sidechains, permissionless rewards are directly built into the gauges. Whoever deploys the gauge can call `add_rewards` on the gauge contract itself (no need to migrate or do it via proxy).


- GaugeManagerProxy for StableSwap pools: [0x742C3cF9Af45f91B109a81EfEaf11535ECDe9571](https://etherscan.io/address/0x742C3cF9Af45f91B109a81EfEaf11535ECDe9571)  
- GaugeManagerProxy for two-coin CryptoSwap pools: [0x9f99FDe2ED3997EAfE52b78E3981b349fD2Eb8C9](https://etherscan.io/address/0x9f99FDe2ED3997EAfE52b78E3981b349fD2Eb8C9)



## **Setting Reward Token and Distributor**

If the admin is the [old proxy](https://etherscan.io/address/0x201798B679859DDF129651d6B58a5C32527EA04c), there needs to be a migration to the new OwnerProxy by calling [`migrate_gauge_manager`](#migrate_gauge_manager). 

Before depositing rewards, both the reward token and the distributor need to be set using the `add_rewards` function via the OwnershipProxy.

!!!warning
    `add_reward` and `migrate_gauge_manager` function needs to be called from the OwnershipProxy, as these function are only callable by the admin, which is the OwnershipAgent. `set_reward_distributor` can aswell be either called from the OwnershipProxy or straight from the gauge itself.

### `add_reward`
!!! description "`OwnerProxy.add_reward(_reward_token: address, _distributor: address):`"

    Function to add reward token `_reward_token` and distributor contract `_distributor`.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_reward_token` |  `address` | Reward Token |
    | `_distributor` |  `address` | Distributor Contract |

    ??? quote "Source code"

        === "OwnerProxy.vy"

            ```python hl_lines="5 7"
            ownership_admin: public(address)
            gauge_manager: public(HashMap[address, address])

            @external
            def add_reward(_gauge: address, _reward_token: address, _distributor: address):
                assert msg.sender in [self.ownership_admin, self.gauge_manager[_gauge]]
                Gauge(_gauge).add_reward(_reward_token, _distributor)
            ```
        
        === "GaugeV4.vy"

            ```python hl_lines="6 10"
            MAX_REWARDS: constant(uint256) = 8

            admin: public(address)

            @external
            def add_reward(_reward_token: address, _distributor: address):
                """
                @notice Set the active reward contract
                """
                assert msg.sender == self.admin  # dev: only owne

                reward_count: uint256 = self.reward_count
                assert reward_count < MAX_REWARDS
                assert self.reward_data[_reward_token].distributor == ZERO_ADDRESS

                self.reward_data[_reward_token].distributor = _distributor
                self.reward_tokens[reward_count] = _reward_token
                self.reward_count = reward_count + 1
            ```

    === "Example"

        ```shell
        >>> OwnerProxy.add_reward("todo"):
        'todo'
        ```


### `set_reward_distributor`
!!! description "`OwnerProxy.set_reward_distributor(_reward_token: address, _distributor: address):`"

    Function to reassign the reward distributor of reward token `_reward_token` to `_distributor`.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_reward_token` |  `address` | Reward Token |
    | `_distributor` |  `address` | New Distributor Address |

    ??? quote "Source code"

        === "OwnerProxy.vy"

            ```python hl_lines="1"
            ownership_admin: public(address)
            gauge_manager: public(HashMap[address, address])

            @external
            def set_reward_distributor(_gauge: address, _reward_token: address, _distributor: address):
                assert msg.sender in [self.ownership_admin, self.gauge_manager[_gauge]]
                Gauge(_gauge).set_reward_distributor(_reward_token, _distributor) 
            ```
        
        === "GaugeV4.vy"

            ```python hl_lines="3"
            admin: public(address)

            @external
            def set_reward_distributor(_reward_token: address, _distributor: address):
                current_distributor: address = self.reward_data[_reward_token].distributor

                assert msg.sender == current_distributor or msg.sender == self.admin
                assert current_distributor != ZERO_ADDRESS
                assert _distributor != ZERO_ADDRESS

                self.reward_data[_reward_token].distributor = _distributor
            ```

    === "Example"

        ```shell
        >>> OwnerProxy.set_reward_distributor('todo')
        
        ```


### `migrate_gauge_manager`
!!! description "`OwnerProxy.migrate_gauge_manager(_gauge: address):`"

    Function to migrate the gauge manager from  `_gauge` to this one.

    !!!note
        This migration must be completed before gaining the capability to add permissionless rewards.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_gauge` |  `address` | Gauge to migrate |

    ??? quote "Source code"

        ```python hl_lines="1"
        @external
        def migrate_gauge_manager(_gauge: address):
            manager: address = ManagerProxy(OLD_MANAGER_PROXY).gauge_manager(_gauge)
            if manager != empty(address) and self.gauge_manager[_gauge] == empty(address):
                self.gauge_manager[_gauge] = manager
        ```

    === "Example"

        ```shell
        >>> OwnerProxy.migrate_gauge_manager('todo'):
        todo
        ```


### `OLD_MANAGER_PROXY`
!!! description "`OwnerProxy.OLD_MANAGER_PROXY() -> address: view`"

    Getter for the old manager proxy. 

    Returns: old proxy (`address`).

    ??? quote "Source code"

        ```python hl_lines="1 4 9 12"
        OLD_MANAGER_PROXY: public(immutable(address))

        @external
        def __init__(
            _ownership_admin: address,
            _parameter_admin: address,
            _emergency_admin: address,
            _factory: address,
            _old_manager_proxy: address,
        ):
            FACTORY = _factory
            OLD_MANAGER_PROXY = _old_manager_proxy

            self.ownership_admin = _ownership_admin
            self.parameter_admin = _parameter_admin
            self.emergency_admin = _emergency_admin
        ```

    === "Example"

        ```shell
        >>> OwnerProxy.OLD_MANAGER_PROXY():
        '0x201798B679859DDF129651d6B58a5C32527EA04c'
        ```


## **Deposit Rewards**

!!!note
    These methods are queried directly from the individual gauge contracts.

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

