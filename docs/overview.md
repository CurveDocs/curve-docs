---
hide:
  - toc
---

<h1>Curve Finance: Protocol Overview</h1>

Curve is a **decentralized exchange and automated market maker on Ethereum and EVM sidechains/L2s**, designed for the efficient **trading of stablecoins and other assets**. 

The platform is distinguished by its low-risk, supplemental fee income opportunities for liquidity providers, without an opportunity cost. Additionally, Curve has launched its own stablecoin, **crvUSD, featuring a unique liquidation mechanism known as LLAMMA**.

This documentation outlines the technical implementation of the core Curve protocol and related smart contracts. It may be useful for contributors to the Curve codebase, third-party integrators, or technically proficient users of the protocol.

For non-technical users, the **[Resources](https://resources.curve.fi/)** site offers more general insights and information.



**Curve can be broadly separated into the following categories:**

<div class="grid cards" markdown>

-   ![Curve DAO Logo](./images/curve_logo.svg){: style="width: 22px; height: auto; vertical-align: middle;" } **Curve DAO** 

    ---

    Protocol governance and value accrual

-   ![Curve Stablecoin (crvUSD) Logo](./images/crvUSD.svg){: style="width: 24px; height: auto; vertical-align: middle;" } **Curve Stablecoin (crvUSD)**

    ---

    Stablecoin using LLAMMA (Lending-Liquidating AMM Algorithm) 

-   :material-scale-balance:{ .lg .middle } **StableSwap Exchange**

    ---

    Exchange contracts for stable assets

-   :material-scale-unbalanced:{ .lg .middle } **CryptoSwap Exchange**

    ---

    Exchange contracts for volatile assets

-   :material-database-cog-outline:{ .lg .middle } **Registry**

    ---

    Standardized API and on-chain resources to aid 3rd party integrations

-   :octicons-gear-16:{ .lg .middle } **Pool Factory**

    ---

    Permissionless deployment of liquidity pools and gauges

-   >:material-link: **API**
    ---

    *[coming soon](./images/lama/lama_bus.png)*

-   >:material-chart-line: **Oracles**
    ---

    *[coming soon](./images/lama/lama_bus.png)*
</div>



!!!info "Ape Framework"
    This project relies heavily upon **`ape`** and the documentation assumes a basic familiarity with it. You may wish to view the [**Ape documentation**](https://docs.apeworx.io/ape/stable/index.html) if you have not used it previously.