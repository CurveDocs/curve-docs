`GaugeProxy` is used for indirect ownership of [liquidity gauges](../LiquidityGaugesAndMintingCRV/overview.md).

!!!deploy "Contract Source & Deployment"
    For a overview of all actively used proxies, see [here](../../references/deployed-contracts.md#proxies).  
    Source code available on [Github](https://github.com/curvefi/curve-dao-contracts/blob/master/contracts/GaugeProxy.vy).


# **Deploying Gauges**
Gauges can be directly deployed through the Factory contract. However, deploying a gauge via this contract offers the benefit of automatically adding a gauge manager for the gauge. Without this, an easy [migration](#migrate_gauge_manager) is necessary.

# **Permissionless Rewards**
LiquidityGauges V4 and later versions introduce the capability for a `distributor` address to *add permissionless rewards* to a gauge. When a gauge is deployed via the Factory, the deployer (`msg.sender`) is automatically set as the *gauge manager*. This address can call the `add_rewards` function within the OwnerProxy to add both `reward tokens` and `distributors`.

To deposit reward tokens, the `distributor` must call the `deposit_reward_token` function within the specific gauge.

For more technical details, please refer to [this](../LiquidityGaugesAndMintingCRV/gauges/PermissionlessRewards.md).
