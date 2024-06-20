---
hide:
  - toc
---

<h1>Overview</h1>

!!!github "GitHub"
    The source code of the new fee collection, burning, and distribution system can be found on [GitHub :material-github:](https://github.com/curvefi/curve-burners).

The Curve ecosystem has various sources of revenue. In order to distribute these fees, they need to be burned into a unified token.

**Prior to this new system**, Curve used a system of multiple different kinds of burners (e.g., one for LP tokens, one for underlying tokens, etc.) where the **exchange routes for the to-be-burned coins had to be manually added**. Additionally, exchange routes were hardcoded, which often led to semi-efficient fee burning. If coins were not manually added to the burners, they could not be burned, which resulted in unburned (but obviously not lost) fees. All in all, the old burner contracts required lots of maintenance and dev resources.

The new system utilizes **[CowSwap's conditional orders](https://blog.cow.fi/introducing-the-programmatic-order-framework-from-cow-protocol-088a14cb0375)** to burn the tokens. Sell orders, which burn the admin fees, can simply be created by calling a function on the `FeeCollector`. This ensures all coins can be burned **without the need to manually add coins to burners or hardcode exchange routes.**

This system can and is deployed on other chains besides Ethereum but is **partly dependent on, e.g., CoWSwap deployments** if the `CowSwapBurner` is used. **If the CowSwap protocol is deployed on a sidechain, fees can be burned there. For chains where this is not the case, the admin fees are still being burned with the original architecture.**


---


*The new fee collection, burning, and distribution system of Curve involves the following four main contracts:*

<div class="grid cards" markdown>

- **:moneybag: Fee Collector**

    ---
    Contract which acts as the entry point for the fee burning system. All admin fees in various kinds of tokens are collected here.
    
    [:octicons-arrow-right-24: `FeeCollector.vy`](FeeCollector.md)

- **:logos-cow: Burner**

    ---
    Contract which burns the collected admin fees into a unified token. The current system utilizes CowSwap's conditional orders to burn the accumulated fees into a specific target token. In theory, the burner can be any kind of contract that exchanges tokens.

    [:octicons-arrow-right-24: `CowSwapBurner.vy`](CowSwapBurner.md)

- **Hooker**

    ---
    Contract that allows users to execute certain hooks like forwarding crvUSD to the `FeeDistributor`.

    [:octicons-arrow-right-24: `Hooker.vy`](Hooker.md)

- **Fee Distributor**

    ---
    The `FeeDistributor` is the contract which distributes the fee token to veCRV holders. This contract is only deployed on Ethereum mainnet. There are actually two `FeeDistributors` deployed, as rewards were distributed in `3CRV` tokens, before a DAO vote changed the reward token to `crvUSD`.

    [:octicons-arrow-right-24: `FeeDistributor.vy`](FeeDistributor.md)

</div>


---


## **Fee Burning Flow**

Admin fees are collected in various tokens, necessitating an efficient fee-burning mechanism.

The pools, including stableswap-ng, twocrypto-ng, and tricrypto-ng, primarily charge admin fees in the underlying token. Nonetheless, if the LP token is collected as an admin fee, this token can also be burned using the `CoWSwapBurner`. Additionally, admin fees from these newer pools are periodically claimed when users remove liquidity.

*The process of burning coins into the target coin involves the following flow:*

1. Withdrawing admin fees from liquidity pools or crvUSD markets using `withdraw_many`.
2. Collecting fees and calling the burn function of the burner via `collect`. This will create a conditional order for the token to burn (if one has not been created yet). The order specifies the `FeeCollector` as the fee receiver, ensuring all target coins are automatically transferred to the `FeeCollector`.
3. The collected target coins can then be forwarded to the `FeeDistributor` using the `forward` function, from where they can ultimately be claimed.