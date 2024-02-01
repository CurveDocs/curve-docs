---
hide:
  - toc
---

<h1>Curve Stablecoin: Overview</h1>

Curve Stablecoin (crvUSD) infrastructure enables users to **mint crvUSD using a selection of crypto collaterals** (adding new ones is subject to DAO approval). 

crvUSD is designed to provide a more **capital-efficient** stablecoin mechanism and **smoother liquidations**, while maintaining a decentralized design which the Curve DAO governs.

!!!deploy "Contract Source & Deployment"
    crvUSD related deployments can be found [here](../references/deployed-contracts.md#curve-stablecoin). Source code available on [Github](https://github.com/curvefi/curve-stablecoin). This documentation covers the contracts on GitHub up to the **`479d833`** commit hash.



# **Curve Stablecoin Infrastructure Components**

<div class="grid cards" markdown>

-   **Controller**

    ---

    The Controller is the contract the **user interacts with** to **create a loan and further manage the position**. It holds all user debt information. External liquidations are also done through it.

    [:octicons-arrow-right-24: Learn more](./controller.md)

-   **LLAMMA**

    ---

    LLAMMA is the **market-making contract that rebalances the collateral**. As the name suggests, this contract is responsible for liquidating collateral. Every market has its own AMM (created from a blueprint contract) containing the collateral asset and crvUSD.

    [:octicons-arrow-right-24: Learn more](./amm.md)

-   **Factory**

    ---

    The Factory is used to **add new markets**, **raise or lower debt ceilings** of already existing markets, **set blueprint contracts for AMM and Controller**, and **set fee receiver**.

    [:octicons-arrow-right-24: Learn more](./factory/overview.md)

-   **Monetary Policy**

    ---

    Monetary policy contracts are integrated into the crvUSD system and are **responsible for the interest rate** of crvUSD markets.

    [:octicons-arrow-right-24: Learn more](./monetarypolicy.md)

-   **PegKeepers**

    ---

    PegKeepers are contracts that help **stabilize the peg of crvUSD**. They are allocated a specific amount of crvUSD to secure the peg. 

    [:octicons-arrow-right-24: Learn more](./pegkeeper.md)

-   **Price Aggregator**

    ---

    The AggregatorStablePrice contract is designed to **aggregate the price of crvUSD based on multiple Curve Stableswap pools**. This price is mainly used as an oracle for calculating the interest rate, providing an aggregated and exponential moving average price.

    [:octicons-arrow-right-24: Learn more](./priceaggregator.md)

-   **Oracles**

    ---

    Internal crvUSD market oracles.

    [:octicons-arrow-right-24: Learn more](./oracle.md)

-   **crvUSD Token**

    ---

    crvUSD token.

    [:octicons-arrow-right-24: Learn more](./crvUSD.md)

</div>
