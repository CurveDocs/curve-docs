Each pool has a unique liquidity gauge.

!!!info
    There are several versions of liquidity gauge contracts in use. Source code for these contracts is available on [Github](https://github.com/curvefi/curve-dao-contracts/tree/master/contracts/gauges).

Easiest way to obtain the gauge address of a liquidity pool is by querying `get_gauge` on the [MetaRegistry](/docs/registry/MetaRegistryAPI.md).


## **Gauge Types**

Each liquidity gauge is assigned a type within the gauge controller. Grouping gauges by type allows the DAO to adjust the emissions according to type, making it possible to e.g. end all emissions for a single type.

| Gauge Type   | Description | 
| -------- | -------|
| `0`      |  `Ethereum (stableswap pools)`   | 
| `1`      |  `Fantom`| 
| `2`      |  `Polygon (Matic)` | 
| `4`      |  `xDai`|
| `5`      |  `Ethereum (crypto pools)`|
| `7`      |  `Arbitrum`|
| `8`      |  `Avalance`|
| `9`      |  `Harmony`|
| `10`      |  `Fundraising`|
| `11`      |  `Optimism`|


!!!note
    Types 3 and 6 have been deprecated.