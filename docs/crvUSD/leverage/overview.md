---
hide:
  - toc
---

<h1>Leverage Overview</h1>

When using leverage, a user uses their borrowed assets (debt) to buy more of the collateral assets. To do this, Curve employs `LeverageZap` contracts, which automatically loop the position. Currently, there are two different ones:

!!!warning "Zap Integrations"
    Leverage zaps only function properly if the Controller's features are synchronized with the zap contracts. While the regular `LeverageZap.vy` is compatible with all crvUSD and lending markets so far, the `LeverageZap1inch.vy` only works with newer lending markets using the [latest controller blueprint implementation](https://etherscan.io/address/0x4c5d4F542765B66154B2E789abd8E69ed4504112). This requirement is due to the 1inch contract needing specific byte data to build leverage. 

    The new controller implementation, which facilitates leveraging through the 1inch router, was [added to the `OneWayLendingFactory`](https://etherscan.io/tx/0x7a17babdfe5d171abf8bbbe6a00a82f1b19cdbcd2e71b93ccbe93cd1002635fe) on May 03, 2024, at 06:31:11 AM UTC. Any market deployed using this implementation can utilize both the regular and the 1inch leverage zap.

<div class="grid cards" markdown>

-   :logos-crv: **Leveraging only using Curve pools**

    ---

    First integration of leverage for crvUSD markets. This zap contract uses predefined routes on Curve pools to exchange debt for collateral token.

    [:octicons-arrow-right-24: `LeverageZap.vy`](./LeverageZap.md)

-   :logos-1inch: **Leveraging using 1inch**

    ---

    This zap makes use of the 1inch router and works for crvUSD and lending markets. This allows users to tap into liquidity sources beyond just Curve pools.

    [:octicons-arrow-right-24: `LeverageZap1inch.vy`](./LeverageZap1inch.md)

-   :logos-odos: **Leveraging using Odos**

    ---

    This zap makes use of the Odos router and works for crvUSD and lending markets. This allows users to tap into liquidity sources beyond just Curve pools.

    [:octicons-arrow-right-24: `LlamaLendOdosLeverageZap.vy`](./LlamaLendOdosLeverageZap.md)

</div>

---

## **How Leverage is Built**

Leverage is built through a process known as "looping." The concept is straightforward: A user puts up some collateral (e.g., ETH) and takes on debt against it, let's say crvUSD. Because they want to use leverage and increase their exposure to ETH, they loop their position by selling crvUSD for more ETH and adding it as collateral to their loan. They then borrow more crvUSD again, sell it for ETH, and add it again. This process can be repeated as often as they wish.

1. Supply ETH as collateral and borrow crvUSD against it.
2. Exchange crvUSD for more ETH.
3. Add the newly acquired ETH as collateral again and borrow more crvUSD.
4. Exchange the new crvUSD for more ETH and add it as collateral.
5. Repeat the process.
