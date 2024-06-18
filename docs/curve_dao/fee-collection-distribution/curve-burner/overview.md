<h1>Fee Collection & Distribution</h1>


*The new fee collection and distribution system of Curve involves the following three main contracts:*

<div class="grid cards" markdown>

-   **Fee Collector**

    ---

    Contract which collects all admin fees in various tokens.

    [:octicons-arrow-right-24: `FeeCollector.vy`](FeeCollector.md)

-   **Cow Swap Burner**

    ---

    Burner contract that utilizes CowSwap's conditional orders to burn the accumulated fees into a specific target token.

    [:octicons-arrow-right-24: `CowSwapBurner.vy`](CowSwapBurner.md)

-   **Hooker**

    ---

    Contract that allows users to execute certain hooks.

    [:octicons-arrow-right-24: `Hooker.vy`](Hooker.md)

</div>


---


## **Fee Burning Flow**

Admin fees are collected in various tokens, necessitating an efficient fee-burning mechanism.

The pools, including stableswap-ng, twocrypto-ng, and tricrypto-ng, primarily charge admin fees in the underlying token. Nonetheless, if the LP token is collected as an admin fee, this token can also be burned using the `CoWSwapBurner`. Additionally, admin fees from these newer pools are periodically claimed when users remove liquidity.

*The process of burning coins into the target coin involves the following flow:*

1. Withdrawing admin fees from liquidity pools or crvUSD markets using `withdraw_many`.
2. Collecting fees and calling the burn function of the burner via `collect`. This will create a conditional order for the token to burn (if one has not been created yet). The order specifies the `FeeCollector` as the fee receiver, ensuring all target coins are automatically transferred to the `FeeCollector`.
3. The collected target coins can then be forwarded to the `FeeDistributor` using the `forward` function, from where they can ultimately be claimed.