<h1> </h1>

# **Curve DAO: Protocol Ownership**

The Curve DAO controls admin functionality throughout the protocol. Performing calls to owner/admin-level functions is only possible via a successful DAO vote.

Ownership is handled via a series of proxy contracts. At a high level, the flow of ownership is:


``` mermaid
graph LR
  A[DAO] --> B[Aragon Agent];
  B --> C[Ownership Proxy];
  C --> D[Contract];
```


**At the ownership proxy level there are a few main contracts:**

- [*`PoolProxy:`*](https://etherscan.io/address/0xeCb456EA5365865EbAb8a2661B0c503410e9B347) PoolProxy + fee receiver of pools
- [*`GaugeProxy`*](https://etherscan.io/address/0x519AFB566c05E00cfB9af73496D00217A630e4D5) GaugeProxy for liquidity gauge
- [*`StableSwapOwnerProxy:`*](../ownership-proxy/StableSwapOwnerProxy.md) Admin functionality for StableSwap pools deployed by the MetaFactory
- [*`CryptoSwapOwnerProxy:`*](../ownership-proxy/CryptoSwapOwnerProxy.md) Admin functionality for CryptoSwap pools deployed by the CryptoSwapFactory

!!!info
    `StableSwapOwnerProxy` and `CryptoSwapOwnerProxy` are new implementations of ownership proxies. They have more of less the same functionality as the `PoolProxy` and `GaugeProxy`.


The DAO is *capable of replacing the ownership proxies via a vote*.