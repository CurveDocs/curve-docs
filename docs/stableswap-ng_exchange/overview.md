<h1> </h1>

Curve achieves highly efficient stablecoin trading by implementing the StableSwap invariant. This innovative approach significantly reduces slippage in stablecoin trades compared to other widely-used invariants like the constant-product model. It's important to note that, in this context, 'stablecoins' refer to tokens representing stable values in relation to each other. This category encompasses USD-pegged stablecoins (such as DAI and USDC), as well as tokens like ETH and stETH (stakedETH), and various versions of wrapped BTC.

For an in-depth understanding of the StableSwap invariant design, please refer to the official [StableSwap whitepaper](../pdf/stableswap-paper.pdf).

All exchange functionality that Curve supports, as well as noteworthy implementation details, are explained in technical depth in this section.


**The Stableswap-NG AMM infrastructure represents a technically enhanced iteration of the previous 'stableswap' infrastructure. It comprises the following key components:**

- Pool Factory
- AMM blueprint contracts
- Liquidity Gauge blueprint contract
- Math Contract
- Views Contract


!!!deploy "Contract Source"
    This documentation is anchored to the [stableswap-ng repository](https://github.com/curvefi/stableswap-ng) repository at a specific commit hash [bff1522b30819b7b240af17ccfb72b0effbf6c47](https://github.com/curvefi/stableswap-ng/tree/bff1522b30819b7b240af17ccfb72b0effbf6c47), and it does not reflect any modifications made after this commit.


## **Pool Factory and Blueprint Contracts**

The Factory is the main contract used to deploy new plain and meta-pools, as well as liquidity gauges. It also acts a registry for finding the deployed pools and querying information about them.
New pools are deployed via blueprints ([EIP-5202](https://eips.ethereum.org/EIPS/eip-5202)). 

For further documentation about the Factory please refer to [here](../factory/pool_factory/overview.md).


## **Math and View Contracts**

Math and Views are utility contracts used within the AMM. CurveStableSwapNGMath contract contains math for the pool implementation contracts, while the CurveStableSwapNGViews contract provides external view-only methods that can be gas-inefficient when called from smart contracts.