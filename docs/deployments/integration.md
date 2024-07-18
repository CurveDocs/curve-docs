---
search:
  exclude: true
---

<h1></h1>


# **Address Provider**

Contract functionality is documented [here :material-arrow-up-right:](../integration/address-provider.md).

!!!github
    The source code for `AddressProviderNG.vy` can be found on [:material-github: GitHub](https://github.com/curvefi/metaregistry/blob/main/contracts/AddressProviderNG.vy).


| Chain                           | Contract Address |
| ------------------------------- | ---------------- |
| :logos-ethereum: `Ethereum`     | [0x5ffe7FB82894076ECB99A30D6A32e969e6e35E98](https://etherscan.io/address/0x5ffe7FB82894076ECB99A30D6A32e969e6e35E98) |
| :logos-arbitrum: `Arbitrum`     | [0x5ffe7FB82894076ECB99A30D6A32e969e6e35E98](https://arbiscan.io/address/0x5ffe7FB82894076ECB99A30D6A32e969e6e35E98) |
| :logos-optimism: `Optimism`     | [0x5ffe7FB82894076ECB99A30D6A32e969e6e35E98](https://optimistic.etherscan.io/address/0x5ffe7FB82894076ECB99A30D6A32e969e6e35E98) |
| :logos-base: `Base`             | [0x5ffe7FB82894076ECB99A30D6A32e969e6e35E98](https://basescan.org/address/0x5ffe7FB82894076ECB99A30D6A32e969e6e35E98) |
| :logos-bsc: `BinanceSmartChain` | [0x5ffe7FB82894076ECB99A30D6A32e969e6e35E98](https://bscscan.com/address/0x5ffe7FB82894076ECB99A30D6A32e969e6e35E98) |
| :logos-polygon: `Polygon`       | [0x5ffe7FB82894076ECB99A30D6A32e969e6e35E98](https://polygonscan.com/address/0x5ffe7FB82894076ECB99A30D6A32e969e6e35E98) |
| :logos-fantom: `Fantom`         | [0x5ffe7FB82894076ECB99A30D6A32e969e6e35E98](https://ftmscan.com/address/0x5ffe7FB82894076ECB99A30D6A32e969e6e35E98) |
| :logos-gnosis: `Gnosis`         | [0x5ffe7FB82894076ECB99A30D6A32e969e6e35E98](https://gnosisscan.io/address/0x5ffe7fb82894076ecb99a30d6a32e969e6e35e98) |
| :logos-aurora: `Aurora`         | [0x5ffe7FB82894076ECB99A30D6A32e969e6e35E98](https://explorer.aurora.dev/address/0x5ffe7FB82894076ECB99A30D6A32e969e6e35E98) |
| :logos-celo: `Celo`             | [0x5ffe7FB82894076ECB99A30D6A32e969e6e35E98](https://celoscan.io/address/0x5ffe7FB82894076ECB99A30D6A32e969e6e35E98) |
| :logos-mantle: `Mantle`         | [0x5ffe7FB82894076ECB99A30D6A32e969e6e35E98](https://explorer.mantle.xyz/address/0x5ffe7FB82894076ECB99A30D6A32e969e6e35E98) |
| :logos-linea: `Linea`           | [0x5ffe7FB82894076ECB99A30D6A32e969e6e35E98](https://lineascan.build/address/0x5ffe7FB82894076ECB99A30D6A32e969e6e35E98) |
| :logos-polygon: `Polygon zkEVM` | [0x5ffe7FB82894076ECB99A30D6A32e969e6e35E98](https://zkevm.polygonscan.com/address/0x5ffe7FB82894076ECB99A30D6A32e969e6e35E98) |
| :logos-scroll: `Scroll`         | [0x5ffe7FB82894076ECB99A30D6A32e969e6e35E98](https://scrollscan.com/address/0x5ffe7FB82894076ECB99A30D6A32e969e6e35E98) |
| :logos-fraxtal: `Fraxtal`       | [0x5ffe7FB82894076ECB99A30D6A32e969e6e35E98](https://fraxscan.com/address/0x5ffe7FB82894076ECB99A30D6A32e969e6e35E98) |
| :logos-avalanche: `Avalanche`   | [0x5ffe7FB82894076ECB99A30D6A32e969e6e35E98](https://snowscan.xyz/address/0x5ffe7FB82894076ECB99A30D6A32e969e6e35E98) |
| :logos-kava: `Kava`             | [0x5ffe7FB82894076ECB99A30D6A32e969e6e35E98](https://kavascan.io/search?q=0x5ffe7FB82894076ECB99A30D6A32e969e6e35E98) |
| :logos-xlayer: `X-Layer`        | [0x5ffe7fb82894076ecb99a30d6a32e969e6e35e98](https://www.okx.com/web3/explorer/xlayer/address/0x5ffe7fb82894076ecb99a30d6a32e969e6e35e98) |
| :logos-zksync: `zk-Sync`        | [0x54A5a69e17Aa6eB89d77aa3828E38C9Eb4fF263D](https://era.zksync.network/address/0x54A5a69e17Aa6eB89d77aa3828E38C9Eb4fF263D) |


---


# **Meta Registry**

Contract functionality is documented here: [`MetaRegistry`](../registry/overview.md)

!!!github
    The source code for `MetaRegistry.vy` and `MetaRegistryL2.vy` can be found on [:material-github: GitHub](https://github.com/curvefi/metaregistry/tree/main/contracts).

Each `MetaRegistry` is integrated into the chain-specific [`AddressProvider`](#address-provider) at `ID = 7`. To get the **most recent contract, users are advised to fetch it directly from the `AddressProvider` contract**. 

*For example, to query the `MetaRegistry` contract on Ethereum, one can call `get_address(7)` on the `AddressProvider`:*

```py
>>> AddressProvider.get_address(7)
'0xF98B45FA17DE75FB1aD0e7aFD971b0ca00e379fC'
```


---


# **Rate Provider**

Contract functionality is documented here: [`RateProvider`](../integration/rate-provider.md)

!!!github
    The source code for the `RateProvider.vy` can be found on [:material-github: GitHub](https://github.com/curvefi/metaregistry/blob/main/contracts/RateProvider.vy).  

Each `RateProvider` is integrated into the chain-specific [`AddressProvider`](#address-provider) at `ID = 18`.  

*For example, to query the `RateProvider` contract on Ethereum, one can call `get_address(18)` on the `AddressProvider`:*

```py
>>> AddressProvider.get_address(18)
'0xA834f3d23749233c9B61ba723588570A1cCA0Ed7'
```