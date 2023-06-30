# **Curve DAO: Protocol Ownership**

The Curve DAO controls admin functionality throughout the protocol. Performing calls to owner/admin-level functions is only possible via a successful DAO vote.

Ownership is handled via a series of proxy contracts. At a high level, the flow of ownership is:

`DAO -> Aragon Agent -> Ownership Proxy -> Contracts`

At the ownership proxy level there are two main contracts:

[`PoolProxy:`](/docs/curve_dao/ownership-proxy/PoolProxy.md) Admin functionality for exchange contracts  
[`GaugeProxy:`](/docs/curve_dao/ownership-proxy/GaugeProxy.md) Admin functionality for liquidity gauges 

The DAO is capable of replacing the ownership proxies via a vote. Deployment addresses for the current contracts can be found in the addresses reference section of the documentation.  

