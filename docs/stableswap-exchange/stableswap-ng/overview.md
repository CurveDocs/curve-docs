---
hide:
  - toc
---


<h1>StableSwap-NG: Overview </h1>

!!!deploy "Contract Source & Deployment"

    Source code is available on [:material-github: GitHub](https://github.com/curvefi/stableswap-ng). The following documentation covers source code up until commit number [`5f582a6`](https://github.com/curvefi/stableswap-ng/commit/5f582a6b8f709d863825c5fbe026cd3b4fa2d840).

    All stableswap-ng deployments can be found in the "Deployment Addresses" section. [:material-arrow-up-right:](../../references/deployed-contracts.md#stableswap-ng)


For an in-depth understanding of the StableSwap invariant design, please refer to the official [StableSwap whitepaper](../../assets/pdf/stableswap-paper.pdf).


---


**The Stableswap-NG AMM infrastructure represents a technically enhanced iteration of the previous stableswap implementation. It comprises the following key components:**

<div class="grid cards" markdown>

-   :octicons-code-16: **AMM Blueprint Contracts**

    ---

    *Stableswap-NG has two main implementations:*

    - **Plain Pools** [:material-arrow-up-right:](./pools/plainpool.md)
    - **Metapools** [:material-arrow-up-right:](./pools/metapool.md)

    The **admin controls** for pools are documented separately. [:material-arrow-up-right:](./pools/admin_controls.md)


-   :octicons-code-16: **Pool and Gauge Factory**

    ---

    The Pool Factory is used to **permissionlessly deploy new plain and metapools**, as well as **liquidity gauges**. It also acts as a registry for finding the deployed pools and querying information about them.

    [:octicons-arrow-right-24: `CurveStableSwapFactoryNG.vy`](../../factory/stableswapNG/overview.md)

-   :octicons-code-16: **Math Contract**

    ---

    Contract which provides **mathematical utilities** for the AMM blueprint contracts.

    [:octicons-arrow-right-24: `CurveStableSwapNGMath.vy`](./utility_contracts/math.md)

-   :octicons-code-16: **Views Contract**

    ---

    Contract targeted at **integrators**. Contains **view-only external methods** for the AMMs.

    [:octicons-arrow-right-24: `CurveStableSwapNGViews.vy`](./utility_contracts/views.md)

-   :octicons-code-16: **Liquidity Gauge Blueprint Contract**

    ---

    A liquidity gauge blueprint implementation which deploys a liquidity gauge of a pool on Ethereum. Gauges on sidechains must be deployed via the [`RootChainGaugeFactory`](./../../curve_dao/liquidity-gauge-and-minting-crv/evm-sidechains/RootChainGaugeFactory.md).

    [:octicons-arrow-right-24: `LiquidityGauge.vy`](todo)


-   :octicons-code-16: **Oracles**

    ---

    Exponential moving-average oracles for the `D` invariant and for the prices of coins within the AMM.

    [:octicons-arrow-right-24: `Oracles`](./pools/oracles.md)

</div>
