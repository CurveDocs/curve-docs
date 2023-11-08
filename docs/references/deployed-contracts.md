## **Curve DAO**
Curve DAO consists of multiple smart contracts connected by [Aragon](https://github.com/aragon/aragonOS). Interaction with Aragon occurs through a [modified implementation](https://github.com/curvefi/curve-aragon-voting) of the [Aragon Voting App](https://github.com/aragon/aragon-apps/tree/master/apps/voting). Aragon’s standard one-token, one-vote method is replaced with a weighting system based on locking tokens. Curve DAO has a token (CRV) used for governance and value accrual.

View the documentation for an in-depth overview of how the Curve DAO works.

Here is a list of contract deployments that are used in the Curve DAO:

| Name      | Source   | Address |
| ----------- | -------| ----|
| `CRV Token` |  [ERC20CRV.vy](https://github.com/curvefi/curve-dao-contracts/blob/master/contracts/ERC20CRV.vy) | [0xD533a949740bb3306d119CC777fa900bA034cd52](https://etherscan.io/token/0xD533a949740bb3306d119CC777fa900bA034cd52) |
| `Fee Distributor` |  [FeeDistributor.vy](https://github.com/curvefi/curve-dao-contracts/blob/master/contracts/FeeDistributor.vy) |[0xa464e6dcda8ac41e03616f95f4bc98a13b8922dc](https://etherscan.io/address/0xa464e6dcda8ac41e03616f95f4bc98a13b8922dc) |
| `Gauge Controller` |  [GaugeController.vy](https://github.com/curvefi/curve-dao-contracts/blob/master/contracts/GaugeController.vy) | [0x2F50D538606Fa9EDD2B11E2446BEb18C9D5846bB](https://etherscan.io/address/0x2F50D538606Fa9EDD2B11E2446BEb18C9D5846bB) |
| `Minter` |  [Minter.vy](https://github.com/curvefi/curve-dao-contracts/blob/master/contracts/Minter.vy) | [0xd061D61a4d941c39E5453435B6345Dc261C2fcE0](https://etherscan.io/address/0xd061D61a4d941c39E5453435B6345Dc261C2fcE0) |
| `Voting Escrow` | [VotingEscrow.vy](https://github.com/curvefi/curve-dao-contracts/blob/master/contracts/VotingEscrow.vy) | [0x5f3b5dfeb7b28cdbd7faba78963ee202a494e2a2](https://etherscan.io/address/0x5f3b5dfeb7b28cdbd7faba78963ee202a494e2a2) |
| `Vesting Escrow` |  [VestingEscrow.vy](https://etherscan.io/address/0x575ccd8e2d300e2377b43478339e364000318e2c) | [0x575ccd8e2d300e2377b43478339e364000318e2c](https://etherscan.io/address/0x575ccd8e2d300e2377b43478339e364000318e2c) |


### **Ownership Proxies**
| Name      | Source   | Address |
| ----------- | -------| ----|
| `Gauge Owner` |  [GaugeProxy.vy](https://github.com/curvefi/curve-dao-contracts/blob/master/contracts/GaugeProxy.vy) | [0x519AFB566c05E00cfB9af73496D00217A630e4D5](https://etherscan.io/token/0x519AFB566c05E00cfB9af73496D00217A630e4D5) |
| `Pool Owner` |  [PoolProxy.vy](https://github.com/curvefi/curve-dao-contracts/blob/master/contracts/PoolProxy.vy) | [0xeCb456EA5365865EbAb8a2661B0c503410e9B347](https://etherscan.io/token/0xeCb456EA5365865EbAb8a2661B0c503410e9B347) |
| `Crypto Pool Owner` |  **in use?** | - |
| `Factory Pool Owner` |  **in use?** | - |


### **Aragon**

Main documentation: [Ownership Proxies](/docs/curve_dao/ownership-proxy/overview.md)

Aragon [Voting App](https://wiki.aragon.org/archive/dev/apps/voting/) deployments are the main entry points used to create new votes, vote, check the status of a vote, and execute a successful vote.

| Name      | Address  |
| ----------- | -------| 
| `Ownership` | [0xe478de485ad2fe566d49342cbd03e49ed7db3356](https://etherscan.io/address/0xe478de485ad2fe566d49342cbd03e49ed7db3356) |
| `Parameter` |  [0xbcff8b0b9419b9a88c44546519b1e909cf330399](https://etherscan.io/address/0xbcff8b0b9419b9a88c44546519b1e909cf330399)| 
| `Emergency` |  [0x1115c9b3168563354137cdc60efb66552dd50678](https://etherscan.io/address/0x1115c9b3168563354137cdc60efb66552dd50678)|


Aragon [Agent](https://hack.aragon.org/docs/guides-use-agent) deployments correspond to the different owner accounts within the DAO. Contract calls made due to a successful vote will be executed from these addresses. When deploying new contracts, these addresses should be given appropriate access to admin functionality.

| Name      | Address  |
| ----------- | -------| 
| `Ownership` | [0x40907540d8a6C65c637785e8f8B742ae6b0b9968](https://etherscan.io/address/0x40907540d8a6C65c637785e8f8B742ae6b0b9968) |
| `Parameter` |  [0x4EEb3bA4f221cA16ed4A0cC7254E2E32DF948c5f](https://etherscan.io/address/0x4EEb3bA4f221cA16ed4A0cC7254E2E32DF948c5f)| 
| `Emergency` |  [0x00669DF67E4827FCc0E48A1838a8d5AB79281909](https://etherscan.io/address/0x00669DF67E4827FCc0E48A1838a8d5AB79281909)|


The following token addresses are used for determining voter weights within Curve’s Aragon DAOs.

| Name      | Address  |
| ----------- | -------| 
| `Ownership / Parameter` | [0x5f3b5DfEb7B28CDbD7FAba78963EE202a494e2A2](https://etherscan.io/address/0x5f3b5DfEb7B28CDbD7FAba78963EE202a494e2A2) |
| `Emergency` |  [0x4c0947B16FB1f755A2D32EC21A0c4181f711C500](https://etherscan.io/address/0x4c0947B16FB1f755A2D32EC21A0c4181f711C500)| 


## **Pool Registry**
The pool registry acts as a central hub of information on the current status of Curve pools This means that on-chain integrators can easily retrieve the current address of a particular Curve pool and gather relevant details about it through queries.

Here is a list of all components of the pool registry currently in use:

| Contract    | Address   | 
| ----------- | -------| 
| `MetaRegistry` |  [0xF98B45FA17DE75FB1aD0e7aFD971b0ca00e379fC](https://etherscan.io/address/0xF98B45FA17DE75FB1aD0e7aFD971b0ca00e379fC#code) |
| `BasePoolRegistry` |  [0xDE3eAD9B2145bBA2EB74007e58ED07308716B725](https://etherscan.io/address/0xDE3eAD9B2145bBA2EB74007e58ED07308716B725#code) | 
| `AddressProvider` |  [0x0000000022D53366457F9d5E68Ec105046FC4383](https://etherscan.io/address/0x0000000022D53366457F9d5E68Ec105046FC4383#code) | 
| `StableRegistry` |  [0x90E00ACe148ca3b23Ac1bC8C240C2a7Dd9c2d7f5](https://etherscan.io/address/0x90E00ACe148ca3b23Ac1bC8C240C2a7Dd9c2d7f5#code)  | 
| `StableRegistryHandler` |  [0x46a8a9CF4Fc8e99EC3A14558ACABC1D93A27de68](https://etherscan.io/address/0x46a8a9CF4Fc8e99EC3A14558ACABC1D93A27de68#code)  | 
| `MetaPoolFactory` |  [0xB9fC157394Af804a3578134A6585C0dc9cc990d4](https://etherscan.io/address/0xB9fC157394Af804a3578134A6585C0dc9cc990d4#code)  |
| `MetaPoolFactoryHandler` |  [0x127db66E7F0b16470Bec194d0f496F9Fa065d0A9](https://etherscan.io/address/0x127db66E7F0b16470Bec194d0f496F9Fa065d0A9#code)  |
| `CryptoSwapRegistry` |  [0x9a32aF1A11D9c937aEa61A3790C2983257eA8Bc0](https://etherscan.io/address/0x9a32aF1A11D9c937aEa61A3790C2983257eA8Bc0#code) |
| `CryptoSwapRegistryHandler` |  [0x22ceb131d3170f9f2FeA6b4b1dE1B45fcfC86E56](https://etherscan.io/address/0x22ceb131d3170f9f2FeA6b4b1dE1B45fcfC86E56#code) |
| `CryptoFactory` |  [0xF18056Bbd320E96A48e3Fbf8bC061322531aac99](https://etherscan.io/address/0xF18056Bbd320E96A48e3Fbf8bC061322531aac99#code) |
| `CryptoFactoryHandler` |  [0xC4F389020002396143B863F6325aA6ae481D19CE](https://etherscan.io/address/0xC4F389020002396143B863F6325aA6ae481D19CE#code)  |
| `crvUSDFactory` |  [0x4F8846Ae9380B90d2E71D5e3D042dff3E7ebb40d](https://etherscan.io/address/0x4F8846Ae9380B90d2E71D5e3D042dff3E7ebb40d#code) |
| `crvUSDFactoryHandler` |  [0x538E984C2d5f821d51932dd9C570Dff192D3DF2D](https://etherscan.io/address/0x538e984c2d5f821d51932dd9c570dff192d3df2d#code) |
| `CurveTricryptoFactory` |  [0x0c0e5f2fF0ff18a3be9b835635039256dC4B4963](https://etherscan.io/address/0x0c0e5f2fF0ff18a3be9b835635039256dC4B4963#code) |
| `CurveTricryptoFactoryHandler` |  [0x9335bf643c455478f8be40fa20b5164b90215b80](https://etherscan.io/address/0x9335bf643c455478f8be40fa20b5164b90215b80#code) |



## **Fee Burner**
Burners are a crucial element of the fee payout system in Curve. They convert the collected pool fees into an asset that is later exchanged for USDC. Eventually, the USDC is deposited into the 3Pool, and the fees are distributed to veCRV holders in 3CRV. The type of burner used depends on the tokens present in the pool.

Here is a list of all burner contracts currently in use:

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


**Kava**

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



## **Curve Stablecoin**
For testing in production purposes, several contract deployments have taken place. Please ensure that you are using the correct and latest version. The latest deployment logs can be found [here](https://github.com/curvefi/curve-stablecoin/blob/master/deployment-logs/mainnet.log).

!!!deploy "Contract Source & Deployment"
    Source code available on [Github](https://github.com/curvefi/curve-stablecoin).

### **General Infrastructure** 

| Type   | Description | Address  |
| -------- | -------|-------|
|`Stablecoin`| crvUSD Token | [0xf939E0A03FB07F59A73314E73794Be0E57ac1b4E](https://etherscan.io/address/0xf939E0A03FB07F59A73314E73794Be0E57ac1b4E#code)|
|`Factory`| Factory contract for crvUSD markets | [0xC9332fdCB1C491Dcc683bAe86Fe3cb70360738BC](https://etherscan.io/address/0xC9332fdCB1C491Dcc683bAe86Fe3cb70360738BC#code)|
|`Controller Implementation`| Blueprint for Controller | [0xCdb55051fC792303DdC7c1052cC5161BaeD88e2A](https://etherscan.io/address/0xCdb55051fC792303DdC7c1052cC5161BaeD88e2A#code)|
|`AMM Implementation`| Blueprint for AMM | [0x23208cA4F2B30d8f7D54bf2D5A822D1a2F876501](https://etherscan.io/address/0x23208cA4F2B30d8f7D54bf2D5A822D1a2F876501#code)|
|`Swap factory`| Pool Factory | [0x4F8846Ae9380B90d2E71D5e3D042dff3E7ebb40d](https://etherscan.io/address/0x4F8846Ae9380B90d2E71D5e3D042dff3E7ebb40d#code)|
|`Owner proxy`| Owner of Factory and it's deployed pools | [0x855cC906dA8271Dd53879929bd226711247D5f17](https://etherscan.io/address/0x855cC906dA8271Dd53879929bd226711247D5f17#code)|
|`PriceAggregator`| Aggregator of stablecoin prices for crvUSD | [0xe5Afcf332a5457E8FafCD668BcE3dF953762Dfe7](https://etherscan.io/address/0xe5Afcf332a5457E8FafCD668BcE3dF953762Dfe7#code)|
|`PriceAggregatorV2`| Aggregator of stablecoin prices for crvUSD | [0x18672b1b0c623a30089A280Ed9256379fb0E4E62](https://etherscan.io/address/0x18672b1b0c623a30089A280Ed9256379fb0E4E62#code)|
|`PegKeeper (USDC)`| PegKepper for crvUSD/USDC | [0xaA346781dDD7009caa644A4980f044C50cD2ae22](https://etherscan.io/address/0xaA346781dDD7009caa644A4980f044C50cD2ae22#code)|
|`PegKeeper (USDT)`| PegKepper for crvUSD/USDT | [0xE7cd2b4EB1d98CD6a4A48B6071D46401Ac7DC5C8](https://etherscan.io/address/0xE7cd2b4EB1d98CD6a4A48B6071D46401Ac7DC5C8#code)|
|`PegKeeper (USDP)`| PegKepper for crvUSD/USDP | [0x6B765d07cf966c745B340AdCa67749fE75B5c345](https://etherscan.io/address/0x6B765d07cf966c745B340AdCa67749fE75B5c345#code)|
|`PegKeeper (TUSD)`| PegKepper for crvUSD/TUSD | [0x1ef89Ed0eDd93D1EC09E4c07373f69C49f4dcCae](https://etherscan.io/address/0x1ef89Ed0eDd93D1EC09E4c07373f69C49f4dcCae#code)|


### **Markets** 

**sfrxETH**
!!! description "[sfrxETH](https://crvusd.curve.fi/#/ethereum/markets/sfrxeth/create)"

    !!! success inline end "Deployment Hash"
        https://etherscan.io/tx/0x6d879b6e8a64478f3ecc5c2f918c4cf8c29ae0a3f93651159e4dc0278c5c49b5


    | Type   | Address  |
    | ------ | -------- |
    |`AMM`|[0x136e783846ef68c8bd00a3369f787df8d683a696](https://etherscan.io/address/0x136e783846ef68c8bd00a3369f787df8d683a696#code)|
    |`Controller`|[0x8472a9a7632b173c8cf3a86d3afec50c35548e76](https://etherscan.io/address/0x8472a9a7632b173c8cf3a86d3afec50c35548e76#code)|
    |`MonetaryPolicy`|[0xc684432FD6322c6D58b6bC5d28B18569aA0AD0A1](https://etherscan.io/address/0xc684432FD6322c6D58b6bC5d28B18569aA0AD0A1#code)|
    |`CollateralToken (sfrxETH)`|[0xac3e018457b222d93114458476f3e3416abbe38f](https://etherscan.io/address/0xac3e018457b222d93114458476f3e3416abbe38f)|
    |`PriceOracle`|[0x19F5B81e5325F882C9853B5585f74f751DE3896d](https://etherscan.io/address/0x19F5B81e5325F882C9853B5585f74f751DE3896d#code)|
    |`Leverage Zap`|[0xb556FA4C4752321B3154f08DfBDFCF34847f2eac](https://etherscan.io/address/0xb556FA4C4752321B3154f08DfBDFCF34847f2eac#code)|



**wstETH**
!!! description "[wstETH](https://crvusd.curve.fi/#/ethereum/markets/wsteth/create)"

    !!! success inline end "Deployment Hash"
        https://etherscan.io/tx/0xe0db5ab1e175c8dbf54765b3b2fa4e98412ae24c1d9db1bd4c2134ee72519942


    | Type   | Address  |
    | ------ | -------- |
    |`AMM`|[0x37417b2238aa52d0dd2d6252d989e728e8f706e4](https://etherscan.io/address/0x37417b2238aa52d0dd2d6252d989e728e8f706e4#code)|
    |`Controller`|[0x100daa78fc509db39ef7d04de0c1abd299f4c6ce](https://etherscan.io/address/0x100daa78fc509db39ef7d04de0c1abd299f4c6ce#code)|
    |`MonetaryPolicy`|[0x1E7d3bf98d3f8D8CE193236c3e0eC4b00e32DaaE](https://etherscan.io/address/0x1E7d3bf98d3f8D8CE193236c3e0eC4b00e32DaaE#code)|
    |`CollateralToken (wstETH)`|[0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0](https://etherscan.io/address/0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0)|
    |`PriceOracle`|[0xc1793A29609ffFF81f10139fa0A7A444c9e106Ad](https://etherscan.io/address/0xc1793A29609ffFF81f10139fa0A7A444c9e106Ad#code)
    |`Leverage Zap`|[0x293436d4e4a15FBc6cCC400c14a01735E5FC74fd](https://etherscan.io/address/0x293436d4e4a15FBc6cCC400c14a01735E5FC74fd#code)||



**wBTC**
!!! description "[wBTC](https://crvusd.curve.fi/#/ethereum/markets/wbtc/create)"

    !!! success inline end "Deployment Hash"
        https://etherscan.io/tx/0x6a4491e87f5f5beb40b91457b6709fa114f761a4ac860550d2fede67dac7b621


    | Type   | Address  |
    | ------ | -------- |
    |`AMM`|[0xe0438eb3703bf871e31ce639bd351109c88666ea](https://etherscan.io/address/0xe0438eb3703bf871e31ce639bd351109c88666ea#code)|
    |`Controller`|[0x4e59541306910ad6dc1dac0ac9dfb29bd9f15c67](https://etherscan.io/address/0x4e59541306910ad6dc1dac0ac9dfb29bd9f15c67#code)|
    |`MonetaryPolicy`|[0x1E7d3bf98d3f8D8CE193236c3e0eC4b00e32DaaE](https://etherscan.io/address/0x1E7d3bf98d3f8D8CE193236c3e0eC4b00e32DaaE#code)|
    |`CollateralToken (wBTC)`|[0x2260fac5e5542a773aa44fbcfedf7c193bc2c599](https://etherscan.io/address/0x2260fac5e5542a773aa44fbcfedf7c193bc2c599)|
    |`PriceOracle`|[0xBe83fD842DB4937C0C3d15B2aBA6AF7E854f8dcb](https://etherscan.io/address/0xBe83fD842DB4937C0C3d15B2aBA6AF7E854f8dcb#code)|
    |`Leverage Zap`|[0xA2518b71ee64E910741f5Cf480b19E8e402de4d7](https://etherscan.io/address/0xA2518b71ee64E910741f5Cf480b19E8e402de4d7#code)|



**ETH**
!!! description "[ETH](https://crvusd.curve.fi/#/ethereum/markets/eth/create)"

    !!! success inline end "Deployment Hash"
        https://etherscan.io/tx/0x7ce7143aedf5e318e3bed653b730b9456eef67224a8dbcac59fe0872c0580a3a


    | Type   | Address  |
    | ------ | -------- |
    |`AMM`|[0x1681195c176239ac5e72d9aebacf5b2492e0c4ee](https://etherscan.io/address/0x1681195c176239ac5e72d9aebacf5b2492e0c4ee#code)|
    |`Controller`|[0xa920de414ea4ab66b97da1bfe9e6eca7d4219635](https://etherscan.io/address/0xa920de414ea4ab66b97da1bfe9e6eca7d4219635#code)|
    |`MonetaryPolicy`|[0x1E7d3bf98d3f8D8CE193236c3e0eC4b00e32DaaE](https://etherscan.io/address/0x1E7d3bf98d3f8D8CE193236c3e0eC4b00e32DaaE#code)|
    |`CollateralToken (wETH)`|[0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2](https://etherscan.io/address/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2)|
    |`PriceOracle`|[0x966cBDeceFB60A289b0460F7638f4A75F432cA06](https://etherscan.io/address/0x966cBDeceFB60A289b0460F7638f4A75F432cA06#code)|
    |`Leverage Zap`|[0xd3e576B5DcDe3580420A5Ef78F3639BA9cd1B967](https://etherscan.io/address/0xd3e576B5DcDe3580420A5Ef78F3639BA9cd1B967#code)|



**sfrxeth v2**
!!! description "[sfrxETH v2](https://crvusd.curve.fi/#/ethereum/markets/sfrxeth1/create)"

    !!! success inline end "Deployment Hash"
        https://etherscan.io/tx/0x2ede10a84f28647b5636a706ea03334399ba0ec2c77267681902e3180ae2d9b3


    | Type   | Address  |
    | ------ | -------- |
    |`AMM`|[0xfa96ad0a9e64261db86950e2da362f5572c5c6fd](https://etherscan.io/address/0xfa96ad0a9e64261db86950e2da362f5572c5c6fd#code)|
    |`Controller`|[0xec0820efafc41d8943ee8de495fc9ba8495b15cf](https://etherscan.io/address/0xec0820efafc41d8943ee8de495fc9ba8495b15cf#code)|
    |`MonetaryPolicy`|[0xb8687d7dc9d8fa32fabde63e19b2dbc9bb8b2138](https://etherscan.io/address/0xb8687d7dc9d8fa32fabde63e19b2dbc9bb8b2138#code)|
    |`CollateralToken (sfrxETH)`|[0xac3e018457b222d93114458476f3e3416abbe38f](https://etherscan.io/address/0xac3e018457b222d93114458476f3e3416abbe38f)|
    |`PriceOracle`|[0x28d7880B5b67fB4a0B1c6Ed6c33c33f365113C29](https://etherscan.io/address/0x28d7880B5b67fB4a0B1c6Ed6c33c33f365113C29#code)|
    |`Leverage Zap`|[0x43eCFfe6c6C1b9F24AeB5C180E659c2a6FCe11Bc](https://etherscan.io/address/0x43eCFfe6c6C1b9F24AeB5C180E659c2a6FCe11Bc#code)|



**tBTC**
!!! description "[tBTC](https://crvusd.curve.fi/#/ethereum/markets/tbtc/create)"

    !!! success inline end "Deployment Hash"
        https://etherscan.io/tx/0x147ccfac7d243d78ac8852d43c365be7d498b7aa18f6a3b0b1ade02ff55cdacd

    | Type   | Address  |
    | ------ | -------- |
    |`AMM`|[0xf9bd9da2427a50908c4c6d1599d8e62837c2bcb0](https://etherscan.io/address/0xf9bd9da2427a50908c4c6d1599d8e62837c2bcb0#code)|
    |`Controller`|[0x1c91da0223c763d2e0173243eadaa0a2ea47e704](https://etherscan.io/address/0x1c91da0223c763d2e0173243eadaa0a2ea47e704#code)|
    |`MonetaryPolicy`|[0xb8687d7dc9d8fa32fabde63e19b2dbc9bb8b2138](https://etherscan.io/address/0xb8687d7dc9d8fa32fabde63e19b2dbc9bb8b2138#code)|
    |`CollateralToken (tBTC)`|[0x18084fba666a33d37592fa2633fd49a74dd93a88](https://etherscan.io/address/0x18084fba666a33d37592fa2633fd49a74dd93a88)|
    |`PriceOracle`|[0xbeF434E2aCF0FBaD1f0579d2376fED0d1CfC4217](https://etherscan.io/address/0xbeF434E2aCF0FBaD1f0579d2376fED0d1CfC4217#code)|
    |`Leverage Zap`|[0xD79964C70Cb06224FdA4c48387B53E9819bcB71c](https://etherscan.io/address/0xD79964C70Cb06224FdA4c48387B53E9819bcB71c#code)|



## **Stableswap-NG**

!!!deploy "Contract Source & Deployment"
    Source code available on [Github](https://github.com/curvefi/stableswap-ng).


**Ethereum Mainnet**

| Contract    | Address   | 
| ----------- | -------| 
| Math        | [0x20D1c021525C85D9617Ccc64D8f547d5f730118A](https://etherscan.io/address/0x20D1c021525C85D9617Ccc64D8f547d5f730118A#code) |
| Views       | [0x87DD13Dd25a1DBde0E1EdcF5B8Fa6cfff7eABCaD](https://etherscan.io/address/0x87DD13Dd25a1DBde0E1EdcF5B8Fa6cfff7eABCaD#code) |
| Plain AMM   | [0x3E3B5F27bbf5CC967E074b70E9f4046e31663181](https://etherscan.io/address/0x3E3B5F27bbf5CC967E074b70E9f4046e31663181#code) |
| Meta AMM    | [0x19bd1AB34d6ABB584b9C1D5519093bfAA7f6c7d2](https://etherscan.io/address/0x19bd1AB34d6ABB584b9C1D5519093bfAA7f6c7d2#code) |
| Factory     | [0x6A8cbed756804B16E05E741eDaBd5cB544AE21bf](https://etherscan.io/address/0x6A8cbed756804B16E05E741eDaBd5cB544AE21bf#code) |
| Gauge       | [0xF5617D4f7514bE35fce829a1C19AE7f6c9106979](https://etherscan.io/address/0xF5617D4f7514bE35fce829a1C19AE7f6c9106979#code) |


**Ethereum Sepolia**

| Contract    | Address   | 
| ----------- | -------| 
| Math        | [0xbc7654d2dd901aaaa3be4cb5bc0f10dea9f96443](https://sepolia.etherscan.io/address/0xbc7654d2dd901aaaa3be4cb5bc0f10dea9f96443#code) |
| Views       | [0x07920e98a66e462c2aa4c8fa6200bc68ca161ea0](https://sepolia.etherscan.io/address/0x07920e98a66e462c2aa4c8fa6200bc68ca161ea0#code) |
| Plain AMM   | [0x296d2b5c23833a70d07c8fcbb97d846c1ff90ddd](https://sepolia.etherscan.io/address/0x296d2b5c23833a70d07c8fcbb97d846c1ff90ddd#code) |
| Meta AMM    | [0xa12A87c73718a34CD8601b5022B2C6C359142585](https://sepolia.etherscan.io/address/0xa12A87c73718a34CD8601b5022B2C6C359142585#code) |
| Factory     | [0xfb37b8D939FFa77114005e61CFc2e543d6F49A81](https://sepolia.etherscan.io/address/0xfb37b8D939FFa77114005e61CFc2e543d6F49A81#code) |
| Gauge       | [0x64891ab20392a029c0f231656ff13c5ee64b730c](https://sepolia.etherscan.io/address/0x64891ab20392a029c0f231656ff13c5ee64b730c#code) |


**Arbitrum**

| Contract    | Address   | 
| ----------- | -------| 
| Math        | [0x3d6cB2F6DcF47CDd9C13E4e3beAe9af041d8796a](https://arbiscan.io/address/0x3d6cB2F6DcF47CDd9C13E4e3beAe9af041d8796a#code) |
| Views       | [0xC1b393EfEF38140662b91441C6710Aa704973228](https://arbiscan.io/address/0xC1b393EfEF38140662b91441C6710Aa704973228#code) |
| Plain AMM   | [0x76303e4fDcA0AbF28aB3ee42Ce086E6503431F1D](https://arbiscan.io/address/0x76303e4fDcA0AbF28aB3ee42Ce086E6503431F1D#code) |
| Meta AMM    | [0xd125E7a0cEddF89c6473412d85835450897be6Dc](https://arbiscan.io/address/0xd125E7a0cEddF89c6473412d85835450897be6Dc#code) |
| Factory     | [0x9AF14D26075f142eb3F292D5065EB3faa646167b](https://arbiscan.io/address/0x9AF14D26075f142eb3F292D5065EB3faa646167b#code) |


**Optimism**

| Contract    | Address   | 
| ----------- | -------| 
| Math        | [0x8b3EFBEfa6eD222077455d6f0DCdA3bF4f3F57A6](https://optimistic.etherscan.io/address/0x8b3EFBEfa6eD222077455d6f0DCdA3bF4f3F57A6#code) |
| Views       | [0x506F594ceb4E33F5161139bAe3Ee911014df9f7f](https://optimistic.etherscan.io/address/0x506F594ceb4E33F5161139bAe3Ee911014df9f7f#code) |
| Plain AMM   | [0x87FE17697D0f14A222e8bEf386a0860eCffDD617](https://optimistic.etherscan.io/address/0x87FE17697D0f14A222e8bEf386a0860eCffDD617#code) |
| Meta AMM    | [0x1764ee18e8B3ccA4787249Ceb249356192594585](https://optimistic.etherscan.io/address/0x1764ee18e8B3ccA4787249Ceb249356192594585#code) |
| Factory     | [0x5eeE3091f747E60a045a2E715a4c71e600e31F6E](https://optimistic.etherscan.io/address/0x5eeE3091f747E60a045a2E715a4c71e600e31F6E#code) |


**Base**

| Contract    | Address   | 
| ----------- | -------| 
| Math        | [0x506F594ceb4E33F5161139bAe3Ee911014df9f7f](https://basescan.org/address/0x506F594ceb4E33F5161139bAe3Ee911014df9f7f#code) |
| Views       | [0x87FE17697D0f14A222e8bEf386a0860eCffDD617](https://basescan.org/address/0x87FE17697D0f14A222e8bEf386a0860eCffDD617#code) |
| Plain AMM   | [0x1764ee18e8B3ccA4787249Ceb249356192594585](https://basescan.org/address/0x1764ee18e8B3ccA4787249Ceb249356192594585#code) |
| Meta AMM    | [0x5eee3091f747e60a045a2e715a4c71e600e31f6e](https://basescan.org/address/0x5eee3091f747e60a045a2e715a4c71e600e31f6e#code) |
| Factory     | [0xd2002373543Ce3527023C75e7518C274A51ce712](https://basescan.org/address/0xd2002373543Ce3527023C75e7518C274A51ce712#code) |


**Linea**

| Contract    | Address   | 
| ----------- | -------| 
| Math        | [0x8b3EFBEfa6eD222077455d6f0DCdA3bF4f3F57A6](https://lineascan.build/address/0x8b3EFBEfa6eD222077455d6f0DCdA3bF4f3F57A6#code) |
| Views       | [0x506F594ceb4E33F5161139bAe3Ee911014df9f7f](https://lineascan.build/address/0x506F594ceb4E33F5161139bAe3Ee911014df9f7f#code) |
| Plain AMM   | [0x87FE17697D0f14A222e8bEf386a0860eCffDD617](https://lineascan.build/address/0x87FE17697D0f14A222e8bEf386a0860eCffDD617#code) |
| Meta AMM    | [0x1764ee18e8b3cca4787249ceb249356192594585](https://lineascan.build/address/0x1764ee18e8b3cca4787249ceb249356192594585#code) |
| Factory     | [0x5eeE3091f747E60a045a2E715a4c71e600e31F6E](https://lineascan.build/address/0x5eeE3091f747E60a045a2E715a4c71e600e31F6E#code) |


**Scroll**

| Contract    | Address   | 
| ----------- | -------| 
| Math        | [0x8b3EFBEfa6eD222077455d6f0DCdA3bF4f3F57A6](https://scroll.l2scan.co/address/0x8b3EFBEfa6eD222077455d6f0DCdA3bF4f3F57A6) |
| Views       | [0x506F594ceb4E33F5161139bAe3Ee911014df9f7f](https://scroll.l2scan.co/address/0x506F594ceb4E33F5161139bAe3Ee911014df9f7f#code) |
| Plain AMM   | [0x87FE17697D0f14A222e8bEf386a0860eCffDD617](https://scroll.l2scan.co/address/0x87FE17697D0f14A222e8bEf386a0860eCffDD617#code) |
| Meta AMM    | [0x1764ee18e8B3ccA4787249Ceb249356192594585](https://scroll.l2scan.co/address/0x1764ee18e8B3ccA4787249Ceb249356192594585#code) |
| Factory     | [0x5eeE3091f747E60a045a2E715a4c71e600e31F6E](https://scroll.l2scan.co/address/0x5eeE3091f747E60a045a2E715a4c71e600e31F6E#code) |


**ZK-Sync**

| Contract    | Address   | 
| ----------- | -------| 
| Math        | []() |
| Views       | []() |
| Plain AMM   | []() |
| Meta AMM    | []() |
| Factory     | []() |



**Polygon-ZK EVM**

| Contract    | Address   | 
| ----------- | -------| 
| Math        | [0x506F594ceb4E33F5161139bAe3Ee911014df9f7f](https://zkevm.polygonscan.com/address/0x506F594ceb4E33F5161139bAe3Ee911014df9f7f#code) |
| Views       | [0x87fe17697d0f14a222e8bef386a0860ecffdd617](https://zkevm.polygonscan.com/address/0x87fe17697d0f14a222e8bef386a0860ecffdd617#code) |
| Plain AMM   | [0x1764ee18e8b3cca4787249ceb249356192594585](https://zkevm.polygonscan.com/address/0x1764ee18e8b3cca4787249ceb249356192594585#code) |
| Meta AMM    | [0x5eee3091f747e60a045a2e715a4c71e600e31f6e](https://zkevm.polygonscan.com/address/0x5eee3091f747e60a045a2e715a4c71e600e31f6e#code) |
| Factory     | [0xd2002373543Ce3527023C75e7518C274A51ce712](https://zkevm.polygonscan.com/address/0xd2002373543Ce3527023C75e7518C274A51ce712#code) |


**Gnosis**

| Contract    | Address   | 
| ----------- | -------| 
| Math        | [0x87FE17697D0f14A222e8bEf386a0860eCffDD617](https://gnosisscan.io/address/0x87FE17697D0f14A222e8bEf386a0860eCffDD617#code) |
| Views       | [0x5eeE3091f747E60a045a2E715a4c71e600e31F6E](https://gnosisscan.io/address/0x5eeE3091f747E60a045a2E715a4c71e600e31F6E#code) |
| Plain AMM   | [0xd2002373543Ce3527023C75e7518C274A51ce712](https://gnosisscan.io/address/0xd2002373543Ce3527023C75e7518C274A51ce712#code) |
| Meta AMM    | [0xd3B17f862956464ae4403cCF829CE69199856e1e](https://gnosisscan.io/address/0xd3B17f862956464ae4403cCF829CE69199856e1e#code) |
| Factory     | [0xbC0797015fcFc47d9C1856639CaE50D0e69FbEE8](https://gnosisscan.io/address/0xbC0797015fcFc47d9C1856639CaE50D0e69FbEE8#code) |


**Polygon**

| Contract    | Address   | 
| ----------- | -------| 
| Math        | [0xf3A431008396df8A8b2DF492C913706BDB0874ef](https://polygonscan.com//address/0xf3A431008396df8A8b2DF492C913706BDB0874ef#code) |
| Views       | [0x8b3EFBEfa6eD222077455d6f0DCdA3bF4f3F57A6](https://polygonscan.com/address/0x8b3EFBEfa6eD222077455d6f0DCdA3bF4f3F57A6#code) |
| Plain AMM   | [0x506F594ceb4E33F5161139bAe3Ee911014df9f7f](https://polygonscan.com/address/0x506F594ceb4E33F5161139bAe3Ee911014df9f7f#code) |
| Meta AMM    | [0x87FE17697D0f14A222e8bEf386a0860eCffDD617](https://polygonscan.com/address/0x87FE17697D0f14A222e8bEf386a0860eCffDD617#code) |
| Factory     | [0x1764ee18e8B3ccA4787249Ceb249356192594585](https://polygonscan.com/address/0x1764ee18e8B3ccA4787249Ceb249356192594585#code) |


**Avalanche**

| Contract    | Address   | 
| ----------- | -------| 
| Math        | [0xf3A431008396df8A8b2DF492C913706BDB0874ef](https://snowtrace.io/address/0xf3A431008396df8A8b2DF492C913706BDB0874ef#code) |
| Views       | [0x8b3EFBEfa6eD222077455d6f0DCdA3bF4f3F57A6](https://snowtrace.io/address/0x8b3EFBEfa6eD222077455d6f0DCdA3bF4f3F57A6#code) |
| Plain AMM   | [0x506F594ceb4E33F5161139bAe3Ee911014df9f7f](https://snowtrace.io/address/0x506F594ceb4E33F5161139bAe3Ee911014df9f7f#code) |
| Meta AMM    | [0x87FE17697D0f14A222e8bEf386a0860eCffDD617](https://snowtrace.io/address/0x87FE17697D0f14A222e8bEf386a0860eCffDD617#code) |
| Factory     | [0x1764ee18e8B3ccA4787249Ceb249356192594585](https://snowtrace.io/address/0x1764ee18e8B3ccA4787249Ceb249356192594585#code) |


**Fantom**

| Contract    | Address   | 
| ----------- | -------| 
| Math        | [0x8b3EFBEfa6eD222077455d6f0DCdA3bF4f3F57A6](https://ftmscan.com/address/0x8b3EFBEfa6eD222077455d6f0DCdA3bF4f3F57A6#code) |
| Views       | [0x5eeE3091f747E60a045a2E715a4c71e600e31F6E](https://ftmscan.com/address/0x5eeE3091f747E60a045a2E715a4c71e600e31F6E#code) |
| Plain AMM   | [0xd2002373543Ce3527023C75e7518C274A51ce712](https://ftmscan.com/address/0xd2002373543Ce3527023C75e7518C274A51ce712#code) |
| Meta AMM    | [0x686bdb3D24Bc6F3ED89ed3d3B659765c54aC78B4](https://ftmscan.com/address/0x686bdb3D24Bc6F3ED89ed3d3B659765c54aC78B4#code) |
| Factory     | [0xe61Fb97Ef6eBFBa12B36Ffd7be785c1F5A2DE66b](https://ftmscan.com/address/0xe61Fb97Ef6eBFBa12B36Ffd7be785c1F5A2DE66b#code) |


**Binance Smart Chain**

| Contract    | Address   | 
| ----------- | -------| 
| Math        | [0x506F594ceb4E33F5161139bAe3Ee911014df9f7f](https://bscscan.com/address/0x506F594ceb4E33F5161139bAe3Ee911014df9f7f#code) |
| Views       | [0x1764ee18e8B3ccA4787249Ceb249356192594585](https://bscscan.com/address/0x1764ee18e8B3ccA4787249Ceb249356192594585#code) |
| Plain AMM   | [0x604388Bb1159AFd21eB5191cE22b4DeCdEE2Ae22](https://bscscan.com/address/0x604388Bb1159AFd21eB5191cE22b4DeCdEE2Ae22#code) |
| Meta AMM    | [0x06452f9c013fc37169B57Eab8F50A7A48c9198A3](https://bscscan.com/address/0x06452f9c013fc37169B57Eab8F50A7A48c9198A3#code) |
| Factory     | [0xd7E72f3615aa65b92A4DBdC211E296a35512988B](https://bscscan.com/address/0xd7E72f3615aa65b92A4DBdC211E296a35512988B#code) |


**Celo**

| Contract    | Address   | 
| ----------- | -------| 
| Math        | [0xf3A431008396df8A8b2DF492C913706BDB0874ef](https://celoscan.io/address/0xf3A431008396df8A8b2DF492C913706BDB0874ef#code) |
| Views       | [0x8b3EFBEfa6eD222077455d6f0DCdA3bF4f3F57A6](https://celoscan.io/address/0x8b3EFBEfa6eD222077455d6f0DCdA3bF4f3F57A6#code) |
| Plain AMM   | [0x506F594ceb4E33F5161139bAe3Ee911014df9f7f](https://celoscan.io/address/0x506F594ceb4E33F5161139bAe3Ee911014df9f7f#code) |
| Meta AMM    | [0x87FE17697D0f14A222e8bEf386a0860eCffDD617](https://celoscan.io/address/0x87FE17697D0f14A222e8bEf386a0860eCffDD617#code) |
| Factory     | [0x1764ee18e8B3ccA4787249Ceb249356192594585](https://celoscan.io/address/0x1764ee18e8B3ccA4787249Ceb249356192594585#code) |


**Kava**

| Contract    | Address   | 
| ----------- | -------| 
| Math        | [0xf3A431008396df8A8b2DF492C913706BDB0874ef](https://kavascan.com/address/0xf3A431008396df8A8b2DF492C913706BDB0874ef#contracts) |
| Views       | [0x8b3EFBEfa6eD222077455d6f0DCdA3bF4f3F57A6](https://kavascan.com/address/0x8b3EFBEfa6eD222077455d6f0DCdA3bF4f3F57A6#contracts) |
| Plain AMM   | [0x506F594ceb4E33F5161139bAe3Ee911014df9f7f](https://kavascan.com/address/0x506F594ceb4E33F5161139bAe3Ee911014df9f7f#contracts) |
| Meta AMM    | [0x87FE17697D0f14A222e8bEf386a0860eCffDD617](https://kavascan.com/address/0x87FE17697D0f14A222e8bEf386a0860eCffDD617#contracts) |
| Factory     | [0x1764ee18e8B3ccA4787249Ceb249356192594585](https://kavascan.com/address/0x1764ee18e8B3ccA4787249Ceb249356192594585#contracts) |


**Aurora**

| Contract    | Address   | 
| ----------- | -------| 
| Math        | [0x8b3EFBEfa6eD222077455d6f0DCdA3bF4f3F57A6](https://explorer.aurora.dev/address/0x8b3EFBEfa6eD222077455d6f0DCdA3bF4f3F57A6/contracts) |
| Views       | [0x506F594ceb4E33F5161139bAe3Ee911014df9f7f](https://explorer.aurora.dev/address/0x506F594ceb4E33F5161139bAe3Ee911014df9f7f/contracts) |
| Plain AMM   | [0x87FE17697D0f14A222e8bEf386a0860eCffDD617](https://explorer.aurora.dev/address/0x87FE17697D0f14A222e8bEf386a0860eCffDD617/contracts) |
| Meta AMM    | [0x1764ee18e8B3ccA4787249Ceb249356192594585](https://explorer.aurora.dev/address/0x1764ee18e8B3ccA4787249Ceb249356192594585/contracts) |
| Factory     | [0x5eeE3091f747E60a045a2E715a4c71e600e31F6E](https://explorer.aurora.dev/address/0x5eeE3091f747E60a045a2E715a4c71e600e31F6E/contracts) |


**Tron**

| Contract    | Address   | 
| ----------- | -------| 
| Math        | []() |
| Views       | []() |
| Plain AMM   | []() |
| Meta AMM    | []() |
| Factory     | []() |