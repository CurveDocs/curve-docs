---
hide:
  - toc
---

<h1>Tricrypto-NG Overview</h1>

!!!deploy "Contract Source & Deployment"
    Source code is available on [:material-github: GitHub](https://github.com/curvefi/tricrypto-ng). The following documentation covers source code up until commit number [`33707fc`](https://github.com/curvefi/tricrypto-ng/commit/33707fc8b84e08786acf184fcfdb744eb4657a99).
    
    All stableswap-ng deployments can be found in the "Deployment Addresses" section. [:material-arrow-up-right:](../../references/deployed-contracts.md#tricrypto-ng).


For an in-depth understanding of the Cryptoswap invariant design, please refer to the official [Cryptoswap whitepaper](../../assets/pdf/crypto-pools-paper.pdf).

---


**The Tricrypto-NG AMM infrastructure represents a technically enhanced iteration of the previous cryptoswap implementations. It comprises the following key components:**

<div class="grid cards" markdown>

-   :octicons-code-16: **AMM blueprint contracts** 

    ---

    The `AMM` is a **3-coin, auto-rebalancing Cryptoswap implementation**. The contract is version 2.0.0, with several optimizations that make the contract cheaper for the end user.
    Also, unlike the older version, the **pool contract is an ERC20-compliant LP token** as well. 
    
    There are two different implementations, one with **native transfers enabled** and the other with native transfers **disabled**.

    [:octicons-arrow-right-24: `CurveTricryptoOptimized.vy`](./pools/tricrypto.md)

-   :octicons-code-16: **Pool and Gauge Factory**

    ---

    The Factory allows the permissionless deployment of liquidity pools. It can accommodate **multiple blueprints of the AMM** contract (deployed on-chain). These blueprints are specified by the user while deploying the pool. Similarly, liquidity gauges for pools can be deployed through the factory contract, utilizing the liquidity gauge blueprint contract.

    [:octicons-arrow-right-24: `CurveTricryptoFactory.vy`](./utility-contracts/math.md)

-   :octicons-code-16: **Math Contract**

    ---

    A contract which contains different **math utility functions** used in the AMM.

    [:octicons-arrow-right-24: `CurveCryptoMathOptimized3.vy`](./utility-contracts/math.md)

-   :octicons-code-16: **Views Contract**

    ---

    The Views contract contains **view methods relevant for integrators** and users looking to interact with the AMMs. Unlike the older tricrypto contracts, the address of the deployed Views contract is stored in the Factory: users are advised to query the stored views contract since it is upgradeable by the Factory's admin.

    [:octicons-arrow-right-24: `CurveCryptoViews3Optimized.vy`](./utility-contracts/views.md)

-   :octicons-code-16: **Liquidity Gauge blueprint contract**

    ---

    A liquidity gauge blueprint implementation which deploys a liquidity gauge of a pool on Ethereum. Gauges on sidechains must be deployed via the [RootChainGaugeFactory](./../../curve_dao/liquidity-gauge-and-minting-crv/evm-sidechains/RootChainGaugeFactory.md).

    `LiquidityGauge.vy` :octicons-arrow-right-24: soon

-   :octicons-code-16: **Price Oracles**

    ---

    A liquidity gauge blueprint implementation which deploys a liquidity gauge of a pool on Ethereum. Gauges on sidechains must be deployed via the [RootChainGaugeFactory](./../../curve_dao/liquidity-gauge-and-minting-crv/evm-sidechains/RootChainGaugeFactory.md).

    [:octicons-arrow-right-24: `Price Oracles`](./pools/oracles.md)

</div>