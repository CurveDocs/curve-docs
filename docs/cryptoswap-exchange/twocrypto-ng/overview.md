The **TwoCrypto-NG contract infrastructure** represents an **optimized version of Curve Finance Crypto pools**.

!!!deploy "Contract Source & Deployment"
    Source code is available on [GitHub](https://github.com/curvefi/twocrypto-ng).
    A full list of all deployments can be found [here](../../references/deployed-contracts.md#twocrypto-ng).
 
**The AMM infrastructure involves the following parts:**

- AMM blueprint contract (including LP-Token methods)
- Liquidity Gauge blueprint contract
- Math Contract
- Views Contract
- Pool Factory

!!!info "Gauges on Ethereum and Sidechains"
    Even though Factories on sidechains and L2s also have a gauge blueprint implementation variable, this one is set to `ZERO_ADDRESS` as those gauges work a bit differently than the gauge on the Ethereum mainnet. On sidechains, gauges need to be deployed via the [`RootChainGaugeFactory`](../../curve_dao/liquidity-gauge-and-minting-crv/evm-sidechains/RootChainGaugeFactory.md).

The **`Pool Factory`** can accommodate **multiple blueprints of the AMM** contract (deployed on-chain). The appropriate blueprint implementation is chosen by the user when deploying a liquidity pool. Similarly, liquidity gauges for pools can be deployed through the Factory via the liquidity gauge blueprint implementation.

The **`AMM`** is a **2-coin, auto-rebalancing Cryptoswap implementation**. The contract is version 2.0.0, with several optimizations that make the contract more cost-effective for the end user. Additionally, unlike the older version, the pool contract is an ERC20-compliant LP token.

The **`Math contract`** contains various **math functions used in the AMM**.

The **`Views contract`** contains view methods relevant for integrators and users looking to interact with the AMMs.

The Factory AMMs have a **hardcoded `ADMIN_FEE`**, set to 50% of the earned profits. Factory admins can also implement parameter changes to the AMMs, change the fee recipient, and upgrade/add blueprint contract addresses stored in the factory. **Factory pools cannot be 'terminated'** by an admin.

