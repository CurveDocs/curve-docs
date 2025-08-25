Inflation is directed to users who provide liquidity within the protocol. This usage is measured via “Liquidity Gauge” contracts. Each pool has an individual liquidity gauge. The Gauge Controller maintains a list of gauges and their types, with the weights of each gauge and type. For implementation details see [here](../overview.md#liquidity-gauges).

!!!deploy "Contract Source & Deployment"
    There are several versions of liquidity gauge contracts in use. Source code for these contracts is available on [Github](https://github.com/curvefi/curve-dao-contracts/tree/master/contracts/gauges).

Easiest way to obtain the gauge address of a liquidity pool is by querying `get_gauge` on the [MetaRegistry](../../../registry/MetaRegistryAPI.md#get_gauge).
