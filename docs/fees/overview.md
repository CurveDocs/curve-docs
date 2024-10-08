<h1>Fee Collection, Burning, and Distribution</h1>

The Curve ecosystem generates revenue from various sources, primarily through trading fees from liquidity pools and interest from crvUSD markets. This page explains how these fees are collected, converted, and distributed to veCRV holders, detailing the contracts and processes involved.



# **System Overview**

The state of the system can be roughly summarized as follows:

<figure markdown="span">
  ![Fee Structure Overview](../../../assets/images/fees/fee_structure_light.svg){ width="1100" }
  <figcaption>Overview of Curve's fee collection, burning, and distribution system</figcaption>
</figure>

*The collected admin fees can accrue in any type of tokens, whether they are LP or "regular" tokens. For simplicity, the `Hooker.vy` contract, which is essentially responsible for transferring the reward tokens from the `FeeCollector` to the `FeeDistributor`, was omitted from the graph. This infrastructure functions exactly the same on chains where the CowSwap Protocol is deployed (Gnosis and soon Arbitrum). The only difference is that instead of transferring the reward tokens to a `FeeDistributor` contract, they are bridged to the `FeeCollector` on the Ethereum mainnet.*


---


# **Key Contracts**

The fee collection, burning, and distribution system of Curve involves the following main contracts:

<div class="grid cards" markdown>

- **:fontawesome-solid-piggy-bank: Fee Collector**

    ---
    Contract which acts as the entry point for the fee burning system. All admin fees in various kinds of tokens are collected here.
    
    [:octicons-arrow-right-24: `FeeCollector.vy`](FeeCollector.md)

- **:logos-cowswap: CowSwap Burner**

    ---
    Contract which burns the collected admin fees into a unified token. The current system utilizes CowSwap's conditional orders to burn the accumulated fees into a specific target token.

    [:octicons-arrow-right-24: `CowSwapBurner.vy`](CowSwapBurner.md)

- **:material-hook: Hooker**

    ---
    Contract that allows users to execute certain hooks like forwarding crvUSD from the `FeeCollector` to the `FeeDistributor`.

    [:octicons-arrow-right-24: `Hooker.vy`](Hooker.md)

- **:fontawesome-solid-money-bill-transfer: Fee Distributor**

    ---
    The `FeeDistributor` is the contract which distributes the fee token to veCRV holders. This contract is only deployed on Ethereum mainnet. There are actually two `FeeDistributors` deployed, as rewards were distributed in `3CRV` tokens, before a DAO vote changed the reward token to `crvUSD`.

    [:octicons-arrow-right-24: `FeeDistributor.vy`](FeeDistributor.md)

- **:material-call-split: Fee Splitter**

    ---
    Contract that collects accumulated crvUSD fees from crvUSD Controllers and distributes them to other contracts according to predetermined weights in a single transaction.

    [:octicons-arrow-right-24: `FeeSplitter.vy`](FeeSplitter.md)

</div>


---


# **Fee Burning**

The process of burning coins into the target coin involves the following flow:

1. **Collecting Fees:** Admin fees are collected in various token types in the `FeeCollector`.
2. **Burning Admin Fees:** The burn process is initiated via the `collect` function, creating conditional orders for tokens to be burned.
3. **Forwarding Fees:** Collected target coins are forwarded to the `FeeDistributor` using the `forward` function.
4. **Claiming Fees:** Accrued fees can be claimed from the `FeeDistributor` using the `claim` function.
5. **Splitting crvUSD Fees:** The `FeeSplitter` handles the collection and distribution of crvUSD fees from crvUSD markets.

This system ensures efficient fee collection, conversion, and distribution across the Curve ecosystem, rewarding veCRV holders and supporting the ongoing development and maintenance of the protocol.

*Curve has implemented different fee burning architectures over time to optimize the process:*

<div class="grid cards" markdown>

-   :logos-cowswap: **CowSwap Architecture**

    ---

    A more efficient system using contracts like FeeCollector, CowSwapBurner, and FeeSplitter. This architecture is currently available on Ethereum and Gnosis Chain, with plans to deploy on Arbitrum.

    [:octicons-arrow-right-24: CowSwap Fee System](#cowswap-fee-system)

-   :fontawesome-solid-piggy-bank: **Original Architecture**

    ---

    An older system using multiple burner contracts with manually added and hardcoded exchange routes. This architecture is still in use on some sidechains where the CowSwap system hasn't been implemented yet.

    [:octicons-arrow-right-24: Original Architecture](./old-architecture/overview.md)

</div>

The choice of architecture depends on the blockchain and available infrastructure. For chains where the CowSwap system isn't deployed, admin fees are burned using the original architecture and then transferred to Ethereum via bridging contracts.

This page will primarily focus on the CowSwap fee system while also providing information on the original architecture for context and comparison.

---

## **CowSwap Fee System**

The current fee system utilizes a set of contracts to efficiently collect, convert, and distribute fees:

1. **FeeCollector**: Acts as the entry point for fee collection from various sources.
2. **FeeSplitter**: Handles the distribution of crvUSD fees from crvUSD markets.
3. **CowSwapBurner**: Converts collected fees into a unified token using CowSwap's conditional orders.
4. **Hooker**: Facilitates the execution of specific actions, such as forwarding fees.
5. **FeeDistributor**: Distributes the converted fees to veCRV holders.

This system ensures that all types of fees can be efficiently processed **without the need to manually add coins to burners or hardcode exchange routes.**

!!!warning "Current Limitation"
    It's important to note that this new fee system is currently only available on Ethereum and Gnosis Chain, with plans to deploy on Arbitrum soon. Other chains where Curve is deployed still use the previous fee burning architecture.

    For chains not yet using this new system, admin fees are burned using the [original architecture](./old-architecture/sidechains.md) and then transferred via a bridging contract to Ethereum.


## **Previous Architecture**

Prior to this system, Curve used multiple different kinds of burners where the **exchange routes for the to-be-burned coins had to be manually added**. Additionally, exchange routes were hardcoded, which often led to semi-efficient fee burning. If coins were not manually added to the burners, they could not be burned, which resulted in unburned (but obviously not lost) fees. The old burner contracts required lots of maintenance and dev resources.

The new system can and is deployed on other chains besides Ethereum but is **partly dependent on, e.g., CoWSwap deployments** if the `CowSwapBurner` is used. **If the CowSwap protocol is deployed on a sidechain, fees can be burned there. For chains where this is not the case, the admin fees are still being burned using the [original architecture](./old-architecture.md) and then transfered via a bridging contract to Ethereum.**

---

# **Further Reading**

- [Old Fee Burning Architecture](./old-architecture.md)
- [CowSwap Protocol Documentation](https://docs.cow.fi/)
- [veCRV Documentation](../vecrv)