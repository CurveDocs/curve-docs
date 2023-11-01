## **ETHEREUM**

| Burner Type   | Description | Address  |
| -------- | -------|-------|
|`ABurner`|`converts aToken lending tokens to USDC and trasfers to UnderlyingBurner`|[0x12220a63a2013133D54558C9d03c35288eAC9B34](https://etherscan.io/address/0x12220a63a2013133d54558c9d03c35288eac9b34#code)|
|`CryptoLPBurner`|**deprecated**|[0x0B5B9210d5015fD0c97FB19B32675b19703b0453](https://etherscan.io/address/0x0B5B9210d5015fD0c97FB19B32675b19703b0453#code)|
|`CryptoSwapBurner`|`performs a swap using a crypto pool with slippage protection via price oracle`|[0xdc237b4B882Fa1d1fd1dD5B59A08F8dB3416DbE3](https://etherscan.io/address/0xdc237b4B882Fa1d1fd1dD5B59A08F8dB3416DbE3#code)|
|`SwapStableBurner`|`swaps an asset into another asset using a stable pool and forwards to another burner`|[0x90B4508e8F91523e5c8854eA73AFD8c22d8c27b7](https://etherscan.io/address/0x90B4508e8F91523e5c8854eA73AFD8c22d8c27b7#code)|
|`CBurner`|`converts cTokens lending coins to USDC and transfers to UnderlyingBurner`|[0xdd0e10857d952c73b2fa39ce86308299df8774b8](https://etherscan.io/address/0xdd0e10857d952c73b2fa39ce86308299df8774b8#code)|
|`LPBurner`|`converts curve LP-tokens to a single asset and forwards to another burner`|[0xaa42C0CD9645A58dfeB699cCAeFBD30f19B1ff81](https://etherscan.io/address/0xaa42C0CD9645A58dfeB699cCAeFBD30f19B1ff81#code)|
|`MetaBurner`|`converts Metapool-paired coins to 3CRV and transfers to fee distributor`|[0xE4b65889469ad896e866331f0AB5652C1EcfB3E6](https://etherscan.io/address/0xE4b65889469ad896e866331f0AB5652C1EcfB3E6#code)|
|`SynthBurner`|`swaps non-USD denominated assets for synths, converts synths to sUSD and transfers to UnderlyingBurner`|[0x67a0213310202dbc2cbe788f4349b72fba90f9fa](https://etherscan.io/address/0x67a0213310202dbc2cbe788f4349b72fba90f9fa#code)|
|`USDNBurner`|**deprecated?**|[0x06534b0BF7Ff378F162d4F348390BDA53b15fA35](https://etherscan.io/address/0x06534b0BF7Ff378F162d4F348390BDA53b15fA35#code)|
|`UniswapBurner`|`swaps coins to USDC using Uniswap or SushiSwap and transfers to UnderlyingBurner`|[0xf3b64840b39121b40d8685f1576b64c157ce2e24](https://etherscan.io/address/0xf3b64840b39121b40d8685f1576b64c157ce2e24#code)|
|`YBurner`|`converts yTokens to USDC and transfers to UnderlyingBurner`|[0xd16ea3e5681234da84419512eb597362135cd8c9](https://etherscan.io/address/0xd16ea3e5681234da84419512eb597362135cd8c9#code)|
|`UnderlyingBurner`|`converts underlying coins to USDC, adds liquidity to 3pool and transfers to FeeDistributor`|[0x786b374b5eef874279f4b7b4de16940e57301a58](https://etherscan.io/address/0x786b374b5eef874279f4b7b4de16940e57301a58#code)|

|  Type   | Description | Address  |
| -------- | -------|-------|
|`StableSwapProxy`|`proxy for pools`|[0xd4F94D0aaa640BBb72b5EEc2D85F6D114D81a88E](https://etherscan.io/address/0xecb456ea5365865ebab8a2661b0c503410e9b347#code)|
|`CryptoFactory`|`Curve CryptoSwap Pool Factory`|[0x2db0e83599a91b508ac268a6197b8b14f5e72840](https://etherscan.io/address/0xf18056bbd320e96a48e3fbf8bc061322531aac99#code)| 
|`MetaPoolFactory`|`Curve StableSwap Pool Factory`|[0xB9fC157394Af804a3578134A6585C0dc9cc990d4](https://etherscan.io/address/0xB9fC157394Af804a3578134A6585C0dc9cc990d4#code)| 



## **ARBIRUM** 
| Burner Type   | Description | Address  |
| -------- | -------|-------|
|`LPBurner`|`burns lp tokens for usdt/usdc`|[0x2Ac51A7bC5E41cc35a1ce107E39847Ce00c20161](https://arbiscan.io/address/0x2Ac51A7bC5E41cc35a1ce107E39847Ce00c20161#code)|
|`MetaBurner`|`todo`**not verified**|[0xE4b65889469ad896e866331f0AB5652C1EcfB3E6](https://arbiscan.io/address/0xE4b65889469ad896e866331f0AB5652C1EcfB3E6#code)|
|`UnderlyingSwapBurner`|`swaps tokens to mim`|[0x69F36f4486168D8eeBD472375588e88B702f5344](https://arbiscan.io/address/0x69F36f4486168D8eeBD472375588e88B702f5344#code)|

|  Type   | Description | Address  |
| -------- | -------|-------|
|`StableSwapProxy`|`proxy for pools`|[0xd4F94D0aaa640BBb72b5EEc2D85F6D114D81a88E](https://arbiscan.io/address/0xd4F94D0aaa640BBb72b5EEc2D85F6D114D81a88E#code)|
|`StableSwapFactory`|`Curve Pool Factory`|[0xb17b674D9c5CB2e441F8e196a2f048A81355d031](https://arbiscan.io/address/0xb17b674D9c5CB2e441F8e196a2f048A81355d031#code)|
|`BridgeContract`|`bridges mim to mainnet`|[0xecb456ea5365865ebab8a2661b0c503410e9b347](https://arbiscan.io/address/0xecb456ea5365865ebab8a2661b0c503410e9b347#code)|
|`CurveRegistryExchangeContract`|`Curve Exchange Router`|[0x4c2Af2Df2a7E567B5155879720619EA06C5BB15D](https://arbiscan.io/address/0x4c2Af2Df2a7E567B5155879720619EA06C5BB15D#code)|



## **OPTIMISM**
| Burner Type   | Description | Address  |
| -------- | -------|-------|
|`Stable Burner`|`deposits coins into 3pool`|[0xE5De15A9C9bBedb4F5EC13B131E61245f2983A69](https://optimistic.etherscan.io/address/0xE5De15A9C9bBedb4F5EC13B131E61245f2983A69#code)|
|`Swap Burner`|`swaps assets into another asset using a curve pool`|[0xe35A879E5EfB4F1Bb7F70dCF3250f2e19f096bd8](https://optimistic.etherscan.io/address/0xe35A879E5EfB4F1Bb7F70dCF3250f2e19f096bd8#code)|


|  Type   | Description | Address  |
| -------- | -------|-------|
|`StableSwapProxy`|`proxy for pools`|[0xbF7E49483881C76487b0989CD7d9A8239B20CA41](https://optimistic.etherscan.io/address/0xbf7e49483881c76487b0989cd7d9a8239b20ca41#code)|
|`ProxyAdmin`|`admin of the proxy contract`|[0xB055EbbAcc8Eefc166c169e9Ce2886D0406aB49b](https://optimistic.etherscan.io/address/0xB055EbbAcc8Eefc166c169e9Ce2886D0406aB49b#code)|
|`Factory`|`Curve Pool Factory`|[0x2db0e83599a91b508ac268a6197b8b14f5e72840](https://optimistic.etherscan.io/address/0x2db0e83599a91b508ac268a6197b8b14f5e72840#code)| 
|`BridgeContract`|`bridges mim to mainnet`|[0x3c0a405e914337139992625d5100ea141a9c4d11](https://optimistic.etherscan.io/address/0x3c0a405e914337139992625d5100ea141a9c4d11#code)|



## **POLYGON**
| Burner Type   | Description | Address  |
| -------- | -------|-------|
|`amToken Burner`|`converts am-Tokens lending coin to usdc and transfers them to the pool proxy`|[0x7b7b5f87c7357133c93dba8d61fb397f33c99a6b](https://polygonscan.com/address/0x7b7b5f87c7357133c93dba8d61fb397f33c99a6b#code)|
|`EURT Burner`|`deposits EURT into EURT/am3crv pool and sends lp token to the pool proxy`|[0x410364C393C7E64b6F1d0Ee03f89BFD09b49940c](https://polygonscan.com/address/0x410364C393C7E64b6F1d0Ee03f89BFD09b49940c#code)|
|`Tricrypto Burner`|`converts tricrypto lp-tokens to USDC and transfers to the pool proxy`|[0x43450Feccf936FbA3143e03F35D3Cc608D5fE1d2](https://polygonscan.com/address/0x43450Feccf936FbA3143e03F35D3Cc608D5fE1d2#code)|


|  Type   | Description | Address  |
| -------- | -------|-------|
|`StableSwapProxy (=ChildBurner)`|`proxy for pools`|[0x774d1dba98cfbd1f2bc3a1f59c494125e07c48f9](https://polygonscan.com/address/0x774d1dba98cfbd1f2bc3a1f59c494125e07c48f9#code)| 
|`Factory`|`Curve Pool Factory`|[0xe5de15a9c9bbedb4f5ec13b131e61245f2983a69](https://polygonscan.com/address/0xe5de15a9c9bbedb4f5ec13b131e61245f2983a69#code)| 
|`BridgeContract`|`bridges usdc to mainnet`|[0x28542E4AF3De534ca36dAF342febdA541c937C5a](https://polygonscan.com/address/0x28542e4af3de534ca36daf342febda541c937c5a#code)|
|`Curve Registry Exchange Contract`|`Curve Exchange Router`|[0x2a426b3Bb4fa87488387545f15D01d81352732F9](https://polygonscan.com/address/0x2a426b3Bb4fa87488387545f15D01d81352732F9#code)|



## **AVALANCHE**
| Burner Type   | Description | Address  |
| -------- | -------|-------|
|`LPBurner`|`burns lp-tokens for av-Tokens and sends them to the pool proxy`|[0x2c2fc48c3404a70f2d33290d5820edf49cbf74a5](https://snowtrace.io/address/0x2c2fc48c3404a70f2d33290d5820edf49cbf74a5#code)|
|`avTokenBurner`|`swaps av-Tokens for mim`|[0xcF897d9C8F9174F08f30084220683948B105D1B1](https://snowtrace.io/address/0xcF897d9C8F9174F08f30084220683948B105D1B1#code)|


|  Type   | Description | Address  |
| -------- | -------|-------|
|`StableSwapProxy`|`proxy for pools`|[0x06534b0bf7ff378f162d4f348390bda53b15fa35](https://snowtrace.io/address/0x06534b0bf7ff378f162d4f348390bda53b15fa35#code)| 
|`Factory`|`Curve Pool Factory`|[0xb17b674d9c5cb2e441f8e196a2f048a81355d031](https://snowtrace.io/address/0xb17b674d9c5cb2e441f8e196a2f048a81355d031#code)| 
|`BridgeContract`|`bridges mim to mainnet`|[0xc4b1b4d9a7ef38263b34ac1e20fe9819f06e7e11](https://snowtrace.io/address/0xc4b1b4d9a7ef38263b34ac1e20fe9819f06e7e11#code)|



## **FANTOM**
| Burner Type   | Description | Address  |
| -------- | -------|-------|
|`UnderlyingBurner`|`swaps usdc/dai tokens into usdt`|[0x423f26eb44d4be89072eecfc81b95065ce43bf4b](https://ftmscan.com/address/0x423f26eb44d4be89072eecfc81b95065ce43bf4b#code)|
|`BTCBurner`|`converts BTC lending coins into usdt and transfers it to the pool proxy`|[0xFa18A0385610b560f3041C40E23fB319e24658f1](https://ftmscan.com/address/0xFa18A0385610b560f3041C40E23fB319e24658f1#code)|
|`gToken Burner`|`converts g-token lending coins into usdt`|[0xDE5331AC4B3630f94853Ff322B66407e0D6331E8](https://ftmscan.com/address/0xDE5331AC4B3630f94853Ff322B66407e0D6331E8#code)|
|`cToken Burner`|`converts c-token lending coins into usdt`|[0x11137B10C210b579405c21A07489e28F3c040AB1](https://ftmscan.com/address/0x11137B10C210b579405c21A07489e28F3c040AB1#code)|


|  Type   | Description | Address  |
| -------- | -------|-------|
|`StableSwap Proxy`|`pool for proxy`|[0x2b039565b2b7a1a9192d4847fbd33b25b836b950](https://ftmscan.com/address/0x2b039565b2b7a1a9192d4847fbd33b25b836b950#code)| 
|`Factory`|`Curve Pool Factory`|[0x686d67265703d1f124c45e33d47d794c566889ba](https://ftmscan.com/address/0x686d67265703d1f124c45e33d47d794c566889ba#code)| 
|`BridgeContract`|`bridges usdt to mainnet`|[0x993ff6dd3851ab11af751277e419c2aa2697a288](https://ftmscan.com/address/0x993ff6dd3851ab11af751277e419c2aa2697a288#code)|


## **CELO**
| Burner Type   | Description | Address  |
| -------- | -------|-------|
| - | - | - |

|  Type   | Description | Address  |
| -------- | -------|-------|
|`ProxyAdmin`|`proxy for pools`|[0x56bc95ded2bef162131905dfd600f2b9f1b380a4](https://celoscan.io/address/0x56bc95ded2bef162131905dfd600f2b9f1b380a4#code)| 
|`Factory`|`Curve Pool Factory`|[0x5277a0226d10392295e8d383e9724d6e416d6e6c](https://celoscan.io/address/0x5277a0226d10392295e8d383e9724d6e416d6e6c#code)| 



## **KAVA**
| Burner Type   | Description | Address  |
| -------- | -------|-------|
| - | - | - |

|  Type   | Description | Address  |
| -------- | -------|-------|
|`ProxyAdmin`|`proxy for pools`**not verified**|[0x56bc95ded2bef162131905dfd600f2b9f1b380a4](https://explorer.kava.io/address/0x1f0e8445Ebe0D0F60A96A7cd5BB095533cb15B58/contracts)| 
|`Factory`|`Curve Pool Factory`|[0x40bc62805471eF53DdD5C5cF99ed3d9e5aa81b48](https://explorer.kava.io/address/0x40bc62805471eF53DdD5C5cF99ed3d9e5aa81b48/contracts)| 


## **MOONBEAM**
| Burner Type   | Description | Address  |
| -------- | -------|-------|
| - | - | - |

|  Type   | Description | Address  |
| -------- | -------|-------|
|`ProxyAdmin`|`proxy for pools`|[0x114c4042b11a2b16f58fe1bfe847589a122f678a](https://moonscan.io/address/0x114c4042b11a2b16f58fe1bfe847589a122f678a#code)| 
|`Factory`|`Curve Pool Factory`|[0x4244eb811d6e0ef302326675207a95113db4e1f8](https://moonscan.io/address/0x4244eb811d6e0ef302326675207a95113db4e1f8#code)| 


## **GNOSIS**
| Burner Type   | Description | Address  |
| -------- | -------|-------|
| - | - | - |

|  Type   | Description | Address  |
| -------- | -------|-------|
|`ProxyAdmin`|`proxy for pools`|[0x6f8eef407b974dff82c53ff939cc1ebb699383fb](https://gnosisscan.io/address/0x6f8eef407b974dff82c53ff939cc1ebb699383fb#code)| 
|`Factory`|`Curve Pool Factory`|[0xd19baeadc667cf2015e395f2b08668ef120f41f5](https://gnosisscan.io/address/0xd19baeadc667cf2015e395f2b08668ef120f41f5#code)| 


## **AURORA**
| Burner Type   | Description | Address  |
| -------- | -------|-------|
| - | - | - |

|  Type   | Description | Address  |
| -------- | -------|-------|
| - | - | - |