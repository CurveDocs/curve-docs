---
hide:
  - toc
---

<h1>Curve Stablecoin: Overview</h1>

Curve Stablecoin infrastructure enables users to **mint crvUSD using a selection of crypto collaterals**. Adding new collaterals is subject to DAO approval. 

`crvUSD` is designed to provide a more **capital-efficient** stablecoin mechanism and **smoother liquidations**, while maintaining a decentralized design which the Curve DAO governs.

!!!github "GitHub"
    The source code for all releveant stablecoin contract can be found on [GitHub :material-github:](https://github.com/curvefi/curve-stablecoin). Related deployments can be found [here](../references/deployed-contracts.md#curve-stablecoin).


---


# **Curve Stablecoin Infrastructure Components**

<div class="grid cards" markdown>

-   **Controller**

    ---

    The Controller is the contract the **user interacts with** to **create a loan and further manage the position**. It holds all user debt information. External liquidations are also done through it.

    [:octicons-arrow-right-24: `Controller.vy`](./controller.md)

-   **LLAMMA**

    ---

    LLAMMA is the **market-making contract that rebalances the collateral**. As the name suggests, this contract is responsible for liquidating collateral. Every market has its own AMM (created from a blueprint contract) containing the collateral asset and crvUSD.

    [:octicons-arrow-right-24: `LLAMMA.vy`](./amm.md)

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

    [:octicons-arrow-right-24: Learn more](./pegkeepers/overview.md)

-   **Price Aggregator**

    ---

    The AggregatorStablePrice contract is designed to **aggregate the price of crvUSD based on multiple Curve pools**. This price is mainly used as an oracle for calculating the interest rate, providing an aggregated and exponential moving average price.

    [:octicons-arrow-right-24: Learn more](./priceaggregator.md)

-   **Oracles**

    ---

    Oracle contract used for collaterals in the markets.

    [:octicons-arrow-right-24: Learn more](./oracle.md)

-   **Flash Loan**

    ---

    The `FlashLender.vy` contract allows users to take out a flash loan for `crvUSD`.

    [:octicons-arrow-right-24: `FlashLender.vy`](./flashlender.md)

-   **crvUSD Token**

    ---

    `crvUSD` token which is based on the [ERC-20 Token Standard](https://ethereum.org/en/developers/docs/standards/tokens/erc-20/).

    [:octicons-arrow-right-24: `crvUSD.vy`](./crvUSD.md)

</div>
