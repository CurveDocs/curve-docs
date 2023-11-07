**Ethereum**

| Burner Type   | Description | Address  |
| -------- | -------|-------|
|`ABurner`|converts aToken lending tokens to USDC and trasfers to UnderlyingBurner|[0x12220a63a2013133D54558C9d03c35288eAC9B34](https://etherscan.io/address/0x12220a63a2013133d54558c9d03c35288eac9b34#code)|
|`CryptoSwapBurner`| performs a swap using a crypto pool with slippage protection via price oracle |[0xdc237b4B882Fa1d1fd1dD5B59A08F8dB3416DbE3](https://etherscan.io/address/0xdc237b4B882Fa1d1fd1dD5B59A08F8dB3416DbE3#code)|
|`SwapStableBurner`|swaps an asset into another asset using a stable pool and forwards to another burner|[0x90B4508e8F91523e5c8854eA73AFD8c22d8c27b7](https://etherscan.io/address/0x90B4508e8F91523e5c8854eA73AFD8c22d8c27b7#code)|
|`CBurner`|converts cTokens lending coins to USDC and transfers to UnderlyingBurner|[0xdd0e10857d952c73b2fa39ce86308299df8774b8](https://etherscan.io/address/0xdd0e10857d952c73b2fa39ce86308299df8774b8#code)|
|`LPBurner`|converts curve LP-tokens to a single asset and forwards to another burner|[0xaa42C0CD9645A58dfeB699cCAeFBD30f19B1ff81](https://etherscan.io/address/0xaa42C0CD9645A58dfeB699cCAeFBD30f19B1ff81#code)|
|`MetaBurner`|converts Metapool-paired coins to 3CRV and transfers to fee distributor|[0xE4b65889469ad896e866331f0AB5652C1EcfB3E6](https://etherscan.io/address/0xE4b65889469ad896e866331f0AB5652C1EcfB3E6#code)|
|`SynthBurner`|swaps non-USD denominated assets for synths, converts synths to sUSD and transfers to UnderlyingBurner|[0x67a0213310202dbc2cbe788f4349b72fba90f9fa](https://etherscan.io/address/0x67a0213310202dbc2cbe788f4349b72fba90f9fa#code)|
|`USDNBurner| USDN burner|[0x06534b0BF7Ff378F162d4F348390BDA53b15fA35](https://etherscan.io/address/0x06534b0BF7Ff378F162d4F348390BDA53b15fA35#code)|
|`UniswapBurner`|swaps coins to USDC using Uniswap or SushiSwap and transfers to UnderlyingBurner|[0xf3b64840b39121b40d8685f1576b64c157ce2e24](https://etherscan.io/address/0xf3b64840b39121b40d8685f1576b64c157ce2e24#code)|
|`YBurner`|converts yTokens to USDC and transfers to UnderlyingBurner|[0xd16ea3e5681234da84419512eb597362135cd8c9](https://etherscan.io/address/0xd16ea3e5681234da84419512eb597362135cd8c9#code)|
|`UnderlyingBurner`|converts underlying coins to USDC, adds liquidity to 3pool and transfers to FeeDistributor|[0x786b374b5eef874279f4b7b4de16940e57301a58](https://etherscan.io/address/0x786b374b5eef874279f4b7b4de16940e57301a58#code)|

|  Type   | Description | Address  |
| -------- | -------|-------|
|`StableSwapProxy`|proxy for pools|[0xd4F94D0aaa640BBb72b5EEc2D85F6D114D81a88E](https://etherscan.io/address/0xecb456ea5365865ebab8a2661b0c503410e9b347#code)|
|`CryptoFactory`|Curve CryptoSwap Pool Factory|[0x2db0e83599a91b508ac268a6197b8b14f5e72840](https://etherscan.io/address/0xf18056bbd320e96a48e3fbf8bc061322531aac99#code)| 
|`MetaPoolFactory`|Curve StableSwap Pool Factory|[0xB9fC157394Af804a3578134A6585C0dc9cc990d4](https://etherscan.io/address/0xB9fC157394Af804a3578134A6585C0dc9cc990d4#code)| 



**Arbitrum** 
| Burner Type   | Description | Address  |
| -------- | -------|-------|
|`LPBurner`| burns lp tokens for usdt/usdc|[0x2Ac51A7bC5E41cc35a1ce107E39847Ce00c20161](https://arbiscan.io/address/0x2Ac51A7bC5E41cc35a1ce107E39847Ce00c20161#code)|
|`MetaBurner`| meta burner |[0xE4b65889469ad896e866331f0AB5652C1EcfB3E6](https://arbiscan.io/address/0xE4b65889469ad896e866331f0AB5652C1EcfB3E6#code)|
|`UnderlyingSwapBurner`| swaps tokens to mim|[0x69F36f4486168D8eeBD472375588e88B702f5344](https://arbiscan.io/address/0x69F36f4486168D8eeBD472375588e88B702f5344#code)|
|`SwapBurner`| swaps assets using curve pools |[0x09F8D940EAD55853c51045bcbfE67341B686C071](https://arbiscan.io/address/0x09F8D940EAD55853c51045bcbfE67341B686C071#code)|
|`DepositBurner`| deposits coins into pools |[0x0094Ad026643994c8fB2136ec912D508B15fe0E5](https://arbiscan.io/address/0x0094Ad026643994c8fB2136ec912D508B15fe0E5#code)|
|`wETHBurner`| deposits or withdraws wETH |[0x5191946500e75f0A74476F146dF7d386e52961d9](https://arbiscan.io/address/0x5191946500e75f0A74476F146dF7d386e52961d9#code)|

|  Type   | Description | Address  |
| -------- | -------|-------|
|`StableSwapProxy`|pool proxy (fee receiver) |[0xd4F94D0aaa640BBb72b5EEc2D85F6D114D81a88E](https://arbiscan.io/address/0xd4F94D0aaa640BBb72b5EEc2D85F6D114D81a88E#code)|
|`BridgeContract`|bridges mim to mainnet |[0xdab30be00992487a52ebf2d3ea33f16ce32482d8](https://arbiscan.io/address/0xdab30be00992487a52ebf2d3ea33f16ce32482d8#code)|



**Optimism**
| Burner Type   | Description | Address  |
| -------- | -------|-------|
|`StableBurner`| deposits coins into 3pool |[0xE5De15A9C9bBedb4F5EC13B131E61245f2983A69](https://optimistic.etherscan.io/address/0xE5De15A9C9bBedb4F5EC13B131E61245f2983A69#code)|
|`SwapBurner`| swaps assets using curve pools |[0xe35A879E5EfB4F1Bb7F70dCF3250f2e19f096bd8](https://optimistic.etherscan.io/address/0xe35A879E5EfB4F1Bb7F70dCF3250f2e19f096bd8#code)|
|`SynthTokenBurner`| swaps synths |[0x070A5C8a99002F50C18B52B90e938BC477611b16](https://optimistic.etherscan.io/address/0x070A5C8a99002F50C18B52B90e938BC477611b16#code)|

|  Type   | Description | Address  |
| -------- | -------|-------|
|`StableSwapProxy`|proxy for pools|[0xbF7E49483881C76487b0989CD7d9A8239B20CA41](https://optimistic.etherscan.io/address/0xbf7e49483881c76487b0989cd7d9a8239b20ca41#code)|
|`BridgeContract`| bridges mim to mainnet|[0x50E09Ee7080b32aef3e92346891dD2DD389B5fAf](https://optimistic.etherscan.io/address/0x50E09Ee7080b32aef3e92346891dD2DD389B5fAf#code)|



**Polygon**
| Burner Type   | Description | Address  |
| -------- | -------|-------|
|`amToken Burner`| converts am-Tokens lending coin to usdc and transfers them to the pool proxy |[0x7b7b5f87c7357133c93dba8d61fb397f33c99a6b](https://polygonscan.com/address/0x7b7b5f87c7357133c93dba8d61fb397f33c99a6b#code)|
|`EURT Burner`| deposits EURT into EURT/am3crv pool and sends lp token to the pool proxy |[0x410364C393C7E64b6F1d0Ee03f89BFD09b49940c](https://polygonscan.com/address/0x410364C393C7E64b6F1d0Ee03f89BFD09b49940c#code)|
|`Tricrypto Burner`| converts tricrypto lp-tokens to USDC and transfers to the pool proxy |[0x43450Feccf936FbA3143e03F35D3Cc608D5fE1d2](https://polygonscan.com/address/0x43450Feccf936FbA3143e03F35D3Cc608D5fE1d2#code)|
|`Tricrypto LP Burner`| withdraws tricrypto lp tokens |[0x0094Ad026643994c8fB2136ec912D508B15fe0E5](https://polygonscan.com/address/0x0094Ad026643994c8fB2136ec912D508B15fe0E5#code)|
|`am3crv LP Burner`| burns lp tokens |[0x6a2691068C7CbdA03292Ba0f9c77A25F658bAeF5](https://polygonscan.com/address/0x6a2691068C7CbdA03292Ba0f9c77A25F658bAeF5#code)|
|`Crypto Factory LP Burner`| withdraws crypto lp tokens |[0x09F8D940EAD55853c51045bcbfE67341B686C071](https://polygonscan.com/address/0x09F8D940EAD55853c51045bcbfE67341B686C071#code)|


|  Type   | Description | Address  |
| -------- | -------|-------|
|`StableSwapProxy`| pool proxy (fee collector) |[0x774d1dba98cfbd1f2bc3a1f59c494125e07c48f9](https://polygonscan.com/address/0x774d1dba98cfbd1f2bc3a1f59c494125e07c48f9#code)| 
|`BridgeContract`|bridges usdc to mainnet|[0x28542E4AF3De534ca36dAF342febdA541c937C5a](https://polygonscan.com/address/0x28542e4af3de534ca36daf342febda541c937c5a#code)|



**Avalanche**
| Burner Type   | Description | Address  |
| -------- | -------|-------|
|`LPBurner`|burns lp-tokens for av-Tokens and sends them to the pool proxy|[0x2c2fc48c3404a70f2d33290d5820edf49cbf74a5](https://snowtrace.io/address/0x2c2fc48c3404a70f2d33290d5820edf49cbf74a5#code)|
|`LPBurner`|burns lp-tokens for av-Tokens and sends them to the pool proxy|[0x8038C01A0390a8c547446a0b2c18fc9aEFEcc10c](https://snowtrace.io/address/0x8038C01A0390a8c547446a0b2c18fc9aEFEcc10c#code)|
|`avTokenBurner`|converts avToken lending coins into USDC |[0x61E10659fe3aa93d036d099405224E4Ac24996d0](https://snowtrace.io/address/0x61E10659fe3aa93d036d099405224E4Ac24996d0#code)|
|`avTokenBurner`|swaps av-Tokens for mim|[0xcF897d9C8F9174F08f30084220683948B105D1B1](https://snowtrace.io/address/0xcF897d9C8F9174F08f30084220683948B105D1B1#code)|
|`BTC Burner`| burns BTC into av3CRV |[0xE6358f6a45B502477e83CC1CDa759f540E4459ee](https://snowtrace.io/address/0xE6358f6a45B502477e83CC1CDa759f540E4459ee#code)|
|`ETH Burner`| burns ETH into av3CRV |[0xd7d147c6Bb90A718c3De8C0568F9B560C79fa416](https://snowtrace.io/address/0xd7d147c6Bb90A718c3De8C0568F9B560C79fa416#code)|
|`Swap Burner`| swaps assets using curve pools |[0x6a2691068C7CbdA03292Ba0f9c77A25F658bAeF5](https://snowtrace.io/address/0x6a2691068C7CbdA03292Ba0f9c77A25F658bAeF5#code)|


|  Type   | Description | Address  |
| -------- | -------|-------|
|`StableSwapProxy`|proxy for pools|[0x06534b0bf7ff378f162d4f348390bda53b15fa35](https://snowtrace.io/address/0x06534b0bf7ff378f162d4f348390bda53b15fa35#code)| 
|`BridgeContract`|bridges mim to mainnet|[0xa218ed442715fc42ac96a6323b47538684a36e4b](https://snowtrace.io/address/0xa218ed442715fc42ac96a6323b47538684a36e4b#code)|



**Fantom**
| Burner Type   | Description | Address  |
| -------- | -------|-------|
|`UnderlyingBurner`|swaps usdc/dai tokens into usdt|[0x423f26eb44d4be89072eecfc81b95065ce43bf4b](https://ftmscan.com/address/0x423f26eb44d4be89072eecfc81b95065ce43bf4b#code)|
|`BTCBurner`|converts BTC lending coins into usdt and transfers it to the pool proxy|[0xFa18A0385610b560f3041C40E23fB319e24658f1](https://ftmscan.com/address/0xFa18A0385610b560f3041C40E23fB319e24658f1#code)|
|`gToken Burner`|converts g-token lending coins into usdt|[0xDE5331AC4B3630f94853Ff322B66407e0D6331E8](https://ftmscan.com/address/0xDE5331AC4B3630f94853Ff322B66407e0D6331E8#code)|
|`cToken Burner`|converts c-token lending coins into usdt|[0x11137B10C210b579405c21A07489e28F3c040AB1](https://ftmscan.com/address/0x11137B10C210b579405c21A07489e28F3c040AB1#code)|
|`Tricrypto Burner`| converts tricrypto LP into usdc |[0x337e9d5A2DeE10Fdd30E67236667E1dE5b0c085F](https://ftmscan.com/address/0x337e9d5A2DeE10Fdd30E67236667E1dE5b0c085F#code)|
|`Swap Burner`| swaps directly for USDT |[0x959c1BA175e04F7164EB749f4E88f10fe4Bac8a6](https://ftmscan.com/address/0x959c1BA175e04F7164EB749f4E88f10fe4Bac8a6#code)|

|  Type   | Description | Address  |
| -------- | -------|-------|
|`StableSwap Proxy`|pool for proxy|[0x2b039565b2b7a1a9192d4847fbd33b25b836b950](https://ftmscan.com/address/0x2b039565b2b7a1a9192d4847fbd33b25b836b950#code)| 
|`Factory`| Curve Pool Factory |[0x686d67265703d1f124c45e33d47d794c566889ba](https://ftmscan.com/address/0x686d67265703d1f124c45e33d47d794c566889ba#code)| 
|`BridgeContract`|bridges usdt to mainnet|[0x993ff6dd3851ab11af751277e419c2aa2697a288](https://ftmscan.com/address/0x993ff6dd3851ab11af751277e419c2aa2697a288#code)|




**Celo**
| Burner Type   | Description | Address  |
| -------- | -------|-------|
| - | - | - |

|  Type   | Description | Address  |
| -------- | -------|-------|
|`ProxyAdmin`| pool proxy |[0x56bc95ded2bef162131905dfd600f2b9f1b380a4](https://celoscan.io/address/0x56bc95ded2bef162131905dfd600f2b9f1b380a4#code)| 
|`Factory`|`Curve Pool Factory`|[0x5277a0226d10392295e8d383e9724d6e416d6e6c](https://celoscan.io/address/0x5277a0226d10392295e8d383e9724d6e416d6e6c#code)| 



**KAVA**
| Burner Type   | Description | Address  |
| -------- | -------|-------|
| - | - | - |

|  Type   | Description | Address  |
| -------- | -------|-------|
|`ProxyAdmin`|pool proxy|[0x56bc95ded2bef162131905dfd600f2b9f1b380a4](https://explorer.kava.io/address/0x1f0e8445Ebe0D0F60A96A7cd5BB095533cb15B58/contracts)| 
|`Factory`| Curve Pool Factory |[0x40bc62805471eF53DdD5C5cF99ed3d9e5aa81b48](https://explorer.kava.io/address/0x40bc62805471eF53DdD5C5cF99ed3d9e5aa81b48/contracts)| 


**Moonbeam**
| Burner Type   | Description | Address  |
| -------- | -------|-------|
| - | - | - |

|  Type   | Description | Address  |
| -------- | -------|-------|
|`ProxyAdmin`|pool proxy|[0x114c4042b11a2b16f58fe1bfe847589a122f678a](https://moonscan.io/address/0x114c4042b11a2b16f58fe1bfe847589a122f678a#code)| 
|`Factory`|Curve Pool Factory|[0x4244eb811d6e0ef302326675207a95113db4e1f8](https://moonscan.io/address/0x4244eb811d6e0ef302326675207a95113db4e1f8#code)| 


**Gnosis**
| Burner Type   | Description | Address  |
| -------- | -------|-------|
| - | - | - |

|  Type   | Description | Address  |
| -------- | -------|-------|
|`ProxyAdmin`|pool proxy|[0x6f8eef407b974dff82c53ff939cc1ebb699383fb](https://gnosisscan.io/address/0x6f8eef407b974dff82c53ff939cc1ebb699383fb#code)| 
|`Factory`|Curve Pool Factory|[0xd19baeadc667cf2015e395f2b08668ef120f41f5](https://gnosisscan.io/address/0xd19baeadc667cf2015e395f2b08668ef120f41f5#code)| 