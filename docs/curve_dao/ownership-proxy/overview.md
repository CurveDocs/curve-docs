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

- [*`PoolProxy:`*](https://etherscan.io/address/0xeCb456EA5365865EbAb8a2661B0c503410e9B347) old PoolProxy; is proxy for quite some old pools and mostly serves as admin fee receiver!
- [*`GaugeProxy`*](https://etherscan.io/address/0x519AFB566c05E00cfB9af73496D00217A630e4D5) GaugeProxy for early liquidity gauges.
- [*`StableSwapOwnerProxy:`*](../ownership-proxy/StableSwapOwnerProxy.md) Admin functionality for StableSwap pools deployed by the [*MetaFactory*](https://etherscan.io/address/0xb9fc157394af804a3578134a6585c0dc9cc990d4)
- [*`old GaugeManagerProxy`*](https://etherscan.io/address/0x201798B679859DDF129651d6B58a5C32527EA04c) Old ManagerProxy for StableSwap pools to migrate from via `migrate_gauge_manager`; migrates to StableSwapOwnerProxy
- [*`CurveCryptoSwapOwnerProxy`*](https://etherscan.io/address/0x5a8fdC979ba9b6179916404414F7BA4D8B77C8A1) Admin functionality for two-coin Cryptoswap pools deployed by the [*CryptoSwapFactory*](https://etherscan.io/address/0xF18056Bbd320E96A48e3Fbf8bC061322531aac99)
- [*`GaugeManagerProxy (two-coin crypto pools)`*](https://etherscan.io/address/0x9f99FDe2ED3997EAfE52b78E3981b349fD2Eb8C9#code) Gauge manager to add permissionless rewards


todo: there are gauge proxies and pool proxies; 


The DAO is *capable of replacing the ownership proxies via a vote*.