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

For more technical details, please refere to [this](../LiquidityGaugesAndMintingCRV/gauges/permissionless_rewards.md).