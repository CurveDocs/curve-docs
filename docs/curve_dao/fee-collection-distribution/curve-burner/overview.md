The CoWSwapBurner and FeeCollector contracts work in tandem to manage the collection, burning, and forwarding of tokens.



ng pools, including stableswap-ng, twocrypto-ng and tricrypto-ng, mostly charge admin fees in the underlying token. But also if the LP token is collected as a fee token, this token can be burned using the CoWSwapBurner.


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


## Fee Burning Flow

Admin fees are collected in all sorts of different coins. Thats why a efficient fee burning mechanism is needed.


*The process of burning coins into the target coin contrains the following flow:*

1. Withdrawing admin fees from liquidity pools or crvUSD markets using `withdraw_many`
2. Collecting fees and calling the burn function of the burner via `collect`. This will create a conditional order for the token to burn (if there has not been one created yet). The order specifies the `FeeCollector` as the fee receiver. Therefore all target coins will be automatically transfered to the `FeeCollector`.
3. From here on, the collected target coins can be forwarded to the `FeeDistributor` using the `forward` function from where they can ultimately be claimed.

