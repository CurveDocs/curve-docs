<h1> </h1>

!!!deploy "Contract Source"
    This documentation is anchored to the [stableswap-ng repository](https://github.com/curvefi/stableswap-ng) repository at a specific commit hash [bff1522b30819b7b240af17ccfb72b0effbf6c47](https://github.com/curvefi/stableswap-ng/tree/bff1522b30819b7b240af17ccfb72b0effbf6c47), and it does not reflect any modifications made after this commit.

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