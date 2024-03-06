---
hide:
  - toc
---

<h1>Curve Finance: Protocol Overview</h1>

Curve is a **decentralized exchange and automated market maker on Ethereum and EVM sidechains/L2s**, designed for the **efficient trading of stablecoins and other volatile assets**. 

Additionally, Curve has launched its own stablecoin, **crvUSD, featuring a unique liquidation mechanism known as LLAMMA**.

This documentation outlines the technical implementation of the core Curve protocol and related smart contracts. It may be useful for contributors to the Curve codebase, third-party integrators, or technically proficient users of the protocol.

!!!info "Resources for non-technical User"
    Non-technical users might prefer the **[Resources](https://resources.curve.fi/)** site as it offers more general insights and information.

---------

<div class="grid cards" markdown>

-   **:logos-crv: Curve DAO** 

    ---

    Core smart contracts include the Curve DAO Token, governance infrastructure governed by vote-escrowed CRV, mechanisms for fee collection and distribution, gauges, and many other components.

-   **:logos-crvusd: Curve Stablecoin (crvUSD)**

    ---

    Over-collateralized USD stablecoin powered by a unique liquidating algorithm ([LLAMMA](./crvUSD/amm.md)), which progressively converts the put-up collateral token into crvUSD when the loan health decreases to certain thresholds.

-   **:material-bank: Curve Lending**

    ---

    Permissionless lending markets to borrow or lend crvUSD against any asset with a proper oracle. Additionally, the markets are powered by Curve's unique liquidation algorithm, [LLAMMA](./crvUSD/amm.md).


-   :material-scale-balance:{ .lg .middle } **StableSwap Exchange**

    ---

    Implementation of the Stableswap algorithm, as detailed in the [whitepaper](./assets/pdf/stableswap-paper.pdf), into on-chain exchange contracts to facilitate trades between multiple relatively stable assets in comparison to each other (e.g., USDC<>USDT).

-   :material-scale-unbalanced:{ .lg .middle } **CryptoSwap Exchange**

    ---

    Implementation of the Cryptoswap algorithm, as detailed in the [whitepaper](./assets/pdf/crypto-pools-paper.pdf), into on-chain exchange contracts to facilitate trades between multiple volatile assets (e.g. CRV<>ETH).


-   :material-database-cog-outline:{ .lg .middle } **Registry**

    ---

    A standardized API and on-chain Pool Registry Aggregator offering an on-chain API for various properties of Curve pools, by consolidating multiple pool registries into a single contract.

-   :octicons-gear-16:{ .lg .middle } **Pool Factory**

    ---

    Permissionless deployment of liquidity pools, including stableswap and cryptoswap pools, along with liquidity gauges.

-   :simple-fastapi: **Curve API**

    ---

    Public Curve API intended for all those seeking to integrate Curve data onto their own projects.


-   >:material-chart-line: **Oracles**

    ---

    *__coming soon__*
</div>
