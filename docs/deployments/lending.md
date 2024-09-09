---
search:
  exclude: true
---

<h1>Curve Lending: Deployment Addresses</h1>

!!!github
    The source code for all lending-relevant contracts can be found on [:material-github: GitHub](https://github.com/curvefi/curve-stablecoin/tree/lending).

!!!warning "Implementations"
    **Implementation contracts are upgradable.** They can be either replaced or additional implementation contracts can be set. Therefore, please **always make sure to check the most recent ones**.


As the creation of lending markets is permissionless, listing all deployed vaults and their correpsonding contracts would exceed the scope of this section. The Factory contract has a [`market_count`](../lending/contracts/oneway-factory.md#market_count) variable which represents the total number of markets created, as well as a [`vaults(arg0: uint256)`](../lending/contracts/oneway-factory.md#vaults) which returns the vault address at a specific index.

*For more informations, please refer to the [Factory documentation](../lending/contracts/oneway-factory.md).*

---

AMM, Controller, and Price Oracle contracts and other variables of a vault can simply be queried:

```shell
>>> Vault.amm()
'0xafca625321Df8D6A068bDD8F1585d489D2acF11b'
>>> Vault.controller()
'0xEdA215b7666936DEd834f76f3fBC6F323295110A'
>>> Vault.price_oracle()
'0xE0a4C53408f5ACf3246c83b9b8bD8d36D5ee38B8'
```

*For more informations, please refer to the [Vault documentation](../lending/contracts/vault.md#contract-info-methods).*


---


### **:logos-ethereum: Ethereum**

| Contract Type                      | Contract Address                                                         |
| :--------------------------------: | :----------------------------------------------------------------------: |
| `AMM implementation`               | [0xB57A959cdB3D5e460f9a7Cc48ed05ec29dfF049a](https://etherscan.io/address/0xB57A959cdB3D5e460f9a7Cc48ed05ec29dfF049a) |
| `Controller implementation`        | [0x584B0Fd8F038fe8AEDf4057Ca3cB3D840446fBbf](https://etherscan.io/address/0x584B0Fd8F038fe8AEDf4057Ca3cB3D840446fBbf) |
| `Vault implementation`             | [0xc014F34D5Ba10B6799d76b0F5ACdEEe577805085](https://etherscan.io/address/0xc014F34D5Ba10B6799d76b0F5ACdEEe577805085) |
| `Pool price oracle implementation` | [0xC455e6c7936C2382f04306D329ABc5d36444D3F8](https://etherscan.io/address/0xC455e6c7936C2382f04306D329ABc5d36444D3F8) |
| `Monetary Policy Implementation`   | [0x4863c6dF17dD59311B7f67E694DD835ADC87f2d3](https://etherscan.io/address/0x4863c6dF17dD59311B7f67E694DD835ADC87f2d3) |
| `Gauge Implementation`             | [0x79D584d2D49eC8CE8Ea379d69364b700bd35874D](https://etherscan.io/address/0x79D584d2D49eC8CE8Ea379d69364b700bd35874D) |
| `OneWay Lending Factory`           | [0xeA6876DDE9e3467564acBeE1Ed5bac88783205E0](https://etherscan.io/address/0xeA6876DDE9e3467564acBeE1Ed5bac88783205E0) |


---


### **:logos-arbitrum: Arbitrum**

| Contract Type                      | Contract Address                                                         |
| :--------------------------------: | :----------------------------------------------------------------------: |
| `AMM implementation`               | [0xaA2377F39419F8f4CB98885076c41fE547C65a6A](https://arbiscan.io/address/0xaA2377F39419F8f4CB98885076c41fE547C65a6A) |
| `Controller implementation`        | [0x2287b7b2bF3d82c3ecC11ca176F4B4F35f920775](https://arbiscan.io/address/0x2287b7b2bF3d82c3ecC11ca176F4B4F35f920775) |
| `Vault implementation`             | [0x104e15102E4Cf33e0e2cB7C304D406B523B04d7a](https://arbiscan.io/address/0x104e15102E4Cf33e0e2cB7C304D406B523B04d7a) |
| `Pool price oracle implementation` | [0x57390a776A2312eF8BFc25e8624483303Dd8DfF8](https://arbiscan.io/address/0x57390a776A2312eF8BFc25e8624483303Dd8DfF8) |
| `Monetary Policy Implementation`   | [0x0b3536245faDABCF091778C4289caEbDc2c8f5C1](https://arbiscan.io/address/0x0b3536245faDABCF091778C4289caEbDc2c8f5C1) |
| `OneWay Lending Factory`           | [0xcaEC110C784c9DF37240a8Ce096D352A75922DeA](https://arbiscan.io/address/0xcaEC110C784c9DF37240a8Ce096D352A75922DeA) |


---


### **:logos-optimism: Optimism**

| Contract Type                      | Contract Address                                                         |
| :--------------------------------: | :----------------------------------------------------------------------: |
| `AMM implementation`               | [0x40b8c0c9186eAEaf84023d81CD2a709e81fCFbC1](https://optimistic.etherscan.io/address/0x40b8c0c9186eAEaf84023d81CD2a709e81fCFbC1) |
| `Controller implementation`        | [0xCc65F473815c97bDe543Db458358F09852eDb5B4](https://optimistic.etherscan.io/address/0xCc65F473815c97bDe543Db458358F09852eDb5B4) |
| `Vault implementation`             | [0x3B1DF11b96b2F5525aBe75eebeFb1ce0928d2411](https://optimistic.etherscan.io/address/0x3B1DF11b96b2F5525aBe75eebeFb1ce0928d2411) |
| `Pool price oracle implementation` | [0x227c9AD884e0E32a698FB38ba0511eE36fA92b7d](https://optimistic.etherscan.io/address/0x227c9AD884e0E32a698FB38ba0511eE36fA92b7d) |
| `Monetary Policy Implementation`   | [0xa2294769e9CFA9Fd029030F7be94E2602821677B](https://optimistic.etherscan.io/address/0xa2294769e9CFA9Fd029030F7be94E2602821677B) |
| `OneWay Lending Factory`           | [0x5EA8f3D674C70b020586933A0a5b250734798BeF](https://optimistic.etherscan.io/address/0x5EA8f3D674C70b020586933A0a5b250734798BeF) |


---


### **:logos-fraxtal: Fraxtal**

| Contract Type                      | Contract Address                                                         |
| :--------------------------------: | :----------------------------------------------------------------------: |
| `AMM implementation`               | [0x59CfFdC8cf8b9b71D91Da6de480c957993020E8A](https://fraxscan.com/address/0x59CfFdC8cf8b9b71D91Da6de480c957993020E8A) |
| `Controller implementation`        | [0x7002B727Ef8F5571Cb5F9D70D13DBEEb4dFAe9d1](https://fraxscan.com/address/0x7002B727Ef8F5571Cb5F9D70D13DBEEb4dFAe9d1) |
| `Vault implementation`             | [0xc1DB00a8E5Ef7bfa476395cdbcc98235477cDE4E](https://fraxscan.com/address/0xc1DB00a8E5Ef7bfa476395cdbcc98235477cDE4E) |
| `Pool price oracle implementation` | [0x0cD5A1e9E19Af1f1b910Ac3C3452A16B2B37155b](https://fraxscan.com/address/0x0cD5A1e9E19Af1f1b910Ac3C3452A16B2B37155b) |
| `Monetary Policy Implementation`   | [0x86D347cE5f1E6f7Ef4Da00FB7c8d31fBD16996F0](https://fraxscan.com/address/0x86D347cE5f1E6f7Ef4Da00FB7c8d31fBD16996F0) |
| `OneWay Lending Factory`           | [0xf3c9bdAB17B7016fBE3B77D17b1602A7db93ac66](https://fraxscan.com/address/0xf3c9bdAB17B7016fBE3B77D17b1602A7db93ac66) |