In addition to Ethereum, Curve is active on several sidechains.

The Curve DAO is sufficiently complex that it cannot be easily bridged outside of Ethereum, however aspects of functionality (including CRV emissions) are capable on the various sidechains where pools are active.

Source code for the smart contracts used in sidechain emissions is available on [Github](https://github.com/curvefi/curve-dao-contracts/tree/master/contracts/gauges/sidechain).

!!!warning
    Each sidechain comes with it’s own set of tradeoffs between security, scalability and cost of use. The technical specifications and security considerations of each sidechain is outside the scope of this documentation, however we encourage all users to do their own research prior to transferring funds off of Ethereum and onto a sidechain.


# **Implementation Details**

At a high level, the process of CRV distribution on sidechain gauges is as follows:

1.  **On Ethereum, a `RootChainGauge` contract mints allocated CRV each week and transfers it over the bridge.**

    At the beginning of each epoch week, a call is made to the `checkpoint` function within each gauge. This function mints all of the allocated CRV for the previous week, and transfers them over the bridge to another contract deployed at the *same address on the related sidechain*.

    Checkpointing may be performed by anyone. However, for chains that use the [AnySwap bridge](https://anyswap.exchange/bridge#/router) the checkpoint must happen via the `CheckpointProxy` contract.


1.  **On the sidechain, CRV is received into a `ChildLiquidityGauge` contract and then transfered to the `ChildGaugeFactory` from  which the tokens then can be claimed.**



## **RootChainGauge**
`RootChainGauge` is a simplified liquidity gauge contract used for bridging CRV from Ethereum to a sidechain. Each root gauge is added to the gauge controller and receives gauge weight votes to determine emissions for a sidechain pool.


## **ChildChainGauge**
`ChildChainGauge` is a simple reward streaming contract. The logic is similar to that of the [Synthetix staking rewards contract](https://github.com/Synthetixio/synthetix/blob/master/contracts/StakingRewards.sol).

For each `RootChainGauge` deployed on Ethereum, a `ChildGauge` is deployed at the same address on the related sidechain.


## **RewardsOnlyGauge**
`RewardsOnlyGauge` is a simplified version of the same gauge contract used on Ethereum. The logic around CRV emissions and minting has been removed - it only deals with distribution of externally received rewards.

The API for this contract is similar to that of `LiquidityGaugeV3`.


## **RewardClaimer**
`RewardClaimer` is a minimal passthrough contract that allows claiming from multiple reward streamers. For example the am3CRV pool on Polygon utilizes this contract to receive both CRV emissions bridged across from Ethereum, as well as WMATIC rewards supplied via a `RewardStreamer` contract. The `RewardsOnlyGauge` calls the `RewardClaimer` as a way to retrieve both the CRV and WMATIC rewards.
