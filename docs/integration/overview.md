<h1>Integration Docs</h1>

---

<div class="grid cards" markdown>

-   :fontawesome-solid-address-book: **Address Provider**

    ---

    The `AddressProvider` contract acts as an entry point for Curve's various registries, deployed across all chains where Curve infrastructure is present.

    [:octicons-arrow-right-24: `CurveAddressProvider.vy`](./address-provider.md)

-   :material-page-next: **Meta Registry**

    ---

    The `MetaRegistry` serves as a Curve Finance Pool Registry Aggregator, providing an on-chain API that consolidates various properties of Curve pools by **integrating multiple registries into a single contract**.

    [:octicons-arrow-right-24: `CurveMetaRegistry.vy`](./metaregistry.md)

-   :fontawesome-solid-retweet: **Rate Provider**

    ---

    A contract that provides real-time exchange rates for token swaps using different Curve AMMs that are recognized within the `MetaRegistry`.

    [:octicons-arrow-right-24: `CurveRateProvider.vy`](./rate-provider.md)


-   :material-swap-horizontal: **AMMs**

    ---

    *soon*

-   :simple-oracle: **Oracles**

    ---

    *soon*

</div>


---


## **Guides**

*Below are some basic guides and examples.*

### **Fetching Pools** 
[:octicons-link-16:](./metaregistry.md#fetching-liquidity-pools) Discover how to check on-chain pools containing two specific assets.
