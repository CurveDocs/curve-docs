<h1> </h1>

!!!deploy "Contract Source & Deployment"
    Source code available on [Github](https://github.com/curvefi/stableswap-ng).

For an in-depth understanding of the StableSwap invariant design, please refer to the official [StableSwap whitepaper](../pdf/stableswap-paper.pdf).

**The Stableswap-NG AMM infrastructure represents a technically enhanced iteration of the previous stableswap implementation. It comprises the following key components:**

- Pool Factory
- Math Contract
- Views Contract
- AMM blueprint contracts
- LiquidityGauge blueprint contract

!!!info
    The LiquidityGauge blueprint contract is only implemented on Ethereum.


## **Pool Factory and Blueprint Contracts**

The Pool Factory is the contract used to deploy new plain and meta-pools, as well as liquidity gauges. It also acts a registry for finding the deployed pools and querying information about them.
Pools and gauges are deployed via blueprints contracts ([EIP-5202](https://eips.ethereum.org/EIPS/eip-5202)). 


## **Math and View Contracts**

Math and Views are utility contracts used within the AMM. CurveStableSwapNGMath contract contains math for the pool implementation contracts, while the CurveStableSwapNGViews contract provides external view-only methods that can be gas-inefficient when called from smart contracts.