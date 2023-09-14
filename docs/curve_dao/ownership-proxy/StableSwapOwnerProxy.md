The *StableSwapOwnerProxy* allows DAO ownership of the [`MetapoolFactory`](https://etherscan.io/address/0xB9fC157394Af804a3578134A6585C0dc9cc990d4) and its deployed pools. All admin-only actions, as well as non-admin actions such as deploying pools or gauges, can be performed as this contract is their owner.


!!!info
    StableSwapOwnerProxy contract is deployed at: [0x742C3cF9Af45f91B109a81EfEaf11535ECDe9571](https://etherscan.io/address/0x742C3cF9Af45f91B109a81EfEaf11535ECDe9571)


# Deploying Pools
Pool deployment is permissionless, with the exception of base pools. Thus, the `deploy_pool` function can be directly called on the Factory contract. For more information about Factory contracts and their usage, see [here](../../factory/overview.md).


# Deploying Gauges
Gauges can be directly deployed through the Factory contract. However, deploying a gauge via this contract offers the benefit of automatically adding a gauge manager for the gauge. Without this, an easy [migration](#migrate_gauge_manager) is necessary.


# Parameter Changes
Pool parameters can only be modified by the admin/owner of the pools. In most instances, this is an OwnerProxy contract. While this proxy is the owner for some pools, the *StableSwapOwnerProxy* should serve as the owner for all factory-created stableswap pools (for cryptoswap pools see [CryptoSwapOwnerProxy](../ownership-proxy/CryptoSwapOwnerProxy.md)).
For more information on parameter changes see [here](../../stableswap_exchange/pools/admin_pool_settings.md).


# Permissionless Rewards 
LiquidityGauges V4 and later versions introduce the capability for a `distributor` address to *add permissionless rewards* to a gauge. When a gauge is deployed via the Factory, the deployer (`msg.sender`) is automatically set as the *gauge manager*. This address can call the `add_rewards` function within the OwnerProxy to add both `reward tokens` and `distributors`.

To deposit reward tokens, the `distributor` must call the `deposit_reward_token` function within the specific gauge.


## Setting Reward Token and Distributor

If the admin is the [old proxy](https://etherscan.io/address/0x201798B679859DDF129651d6B58a5C32527EA04c), there needs to be a migration to the new OwnerProxy by calling [`migrate_gauge_manager`](#migrate_gauge_manager). 

### `add_reward`
!!! description "`OwnerProxy.add_reward(_reward_token: address, _distributor: address):`"

    Function to add reward token `_reward_token` and distributor contract `_distributor`.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_reward_token` |  `address` | Reward Token |
    | `_distributor` |  `address` | Distributor Contract |

    !!!warning
        `add_rewards` can only be called either by the `ownership_admin` or the `gauge_manger` (deployer of the gauge) within the OwnerProxy contract.

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