# **Ethereum**

## **Curve DAO**
Curve DAO consists of multiple smart contracts connected by [Aragon](https://github.com/aragon/aragonOS). Interaction with Aragon occurs through a [modified implementation](https://github.com/curvefi/curve-aragon-voting) of the [Aragon Voting App](https://github.com/aragon/aragon-apps/tree/master/apps/voting). Aragon’s standard one token, one vote method is replaced with a weighting system based on locking tokens. Curve DAO has a token (CRV) which is used for both governance and value accrual.

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

#### **Voting App**
Aragon [Voting App](https://wiki.aragon.org/archive/dev/apps/voting/) deployments are the main entry points used to create new votes, vote, checking the status of a vote, and execute a successful vote.

| Name      | Address  |
| ----------- | -------| 
| `Ownership` | [0xe478de485ad2fe566d49342cbd03e49ed7db3356](https://etherscan.io/address/0xe478de485ad2fe566d49342cbd03e49ed7db3356) |
| `Parameter` |  [0xbcff8b0b9419b9a88c44546519b1e909cf330399](https://etherscan.io/address/0xbcff8b0b9419b9a88c44546519b1e909cf330399)| 
| `Emergency` |  [0x1115c9b3168563354137cdc60efb66552dd50678](https://etherscan.io/address/0x1115c9b3168563354137cdc60efb66552dd50678)|


#### **Agent**
Aragon [Agent](https://hack.aragon.org/docs/guides-use-agent) deployments correspond to the different owner accounts within the DAO. Contract calls made as a result of a successful vote will execute from these addresses. When deploying new contracts, these addresses should be given appropriate access to admin functionality.

| Name      | Address  |
| ----------- | -------| 
| `Ownership` | [0x40907540d8a6C65c637785e8f8B742ae6b0b9968](https://etherscan.io/address/0x40907540d8a6C65c637785e8f8B742ae6b0b9968) |
| `Parameter` |  [0x4EEb3bA4f221cA16ed4A0cC7254E2E32DF948c5f](https://etherscan.io/address/0x4EEb3bA4f221cA16ed4A0cC7254E2E32DF948c5f)| 
| `Emergency` |  [0x00669DF67E4827FCc0E48A1838a8d5AB79281909](https://etherscan.io/address/0x00669DF67E4827FCc0E48A1838a8d5AB79281909)|


#### **Tokens**
The following token addresses are used for determining voter weights within Curve’s Aragon DAOs.

| Name      | Address  |
| ----------- | -------| 
| `Ownership / Parameter` | [0x5f3b5DfEb7B28CDbD7FAba78963EE202a494e2A2](https://etherscan.io/address/0x5f3b5DfEb7B28CDbD7FAba78963EE202a494e2A2) |
| `Emergency` |  [0x4c0947B16FB1f755A2D32EC21A0c4181f711C500](https://etherscan.io/address/0x4c0947B16FB1f755A2D32EC21A0c4181f711C500)| 




### **Fee Burners**
Burners are a fundamental component of the fee payout mechanism in Curve. A burner converts collected pool fees to an asset which can be converted to USDC. Ultimately, the exchanged for USDC is deposited to the 3Pool, as fees are paid out in 3CRV to veCRV holders. Depending on which tokens a pool contains, a specific burner implementation is used.

Here is a list of all burner contracts currently in use:

| Burner Type   | Source | Address  |
| -------- | -------|-------|
|`ABurner`| [ABurner.vy](https://github.com/curvefi/curve-dao-contracts/blob/master/contracts/burners/eth/ABurner.vy) |[0x12220a63a2013133D54558C9d03c35288eAC9B34](https://etherscan.io/address/0x12220a63a2013133d54558c9d03c35288eac9b34#code)|
|`CryptoLPBurner`| [CryptoLPBurner.vy](https://github.com/curvefi/curve-dao-contracts/blob/master/contracts/burners/eth/CryptoLPBurner.vy) |[0x0B5B9210d5015fD0c97FB19B32675b19703b0453](https://etherscan.io/address/0x0B5B9210d5015fD0c97FB19B32675b19703b0453#code)|
|`CryptoSwapBurner`| todo |[0xdc237b4B882Fa1d1fd1dD5B59A08F8dB3416DbE3](https://etherscan.io/address/0xdc237b4B882Fa1d1fd1dD5B59A08F8dB3416DbE3#code)|
|`SwapStableBurner`| todo |[0x90B4508e8F91523e5c8854eA73AFD8c22d8c27b7](https://etherscan.io/address/0x90B4508e8F91523e5c8854eA73AFD8c22d8c27b7#code)|
|`CBurner`| [CBurner.vy](https://github.com/curvefi/curve-dao-contracts/blob/master/contracts/burners/eth/CBurner.vy) |[0xdd0e10857d952c73b2fa39ce86308299df8774b8](https://etherscan.io/address/0xdd0e10857d952c73b2fa39ce86308299df8774b8#code)|
|`LPBurner`| [LPBurner.vy](https://github.com/curvefi/curve-dao-contracts/blob/master/contracts/burners/eth/LPBurner.vy) |[0xaa42C0CD9645A58dfeB699cCAeFBD30f19B1ff81](https://etherscan.io/address/0xaa42C0CD9645A58dfeB699cCAeFBD30f19B1ff81#code)|
|`MetaBurner`| [MetaBurner.vy](https://github.com/curvefi/curve-dao-contracts/blob/master/contracts/burners/eth/MetaBurner.vy) |[0xE4b65889469ad896e866331f0AB5652C1EcfB3E6](https://etherscan.io/address/0xE4b65889469ad896e866331f0AB5652C1EcfB3E6#code)|
|`SynthBurner`| [SynthBurner.vy](https://github.com/curvefi/curve-dao-contracts/blob/master/contracts/burners/eth/SynthBurner.vy) |[0x67a0213310202dbc2cbe788f4349b72fba90f9fa](https://etherscan.io/address/0x67a0213310202dbc2cbe788f4349b72fba90f9fa#code)|
|`USDNBurner`| [USDNBurner.vy](https://github.com/curvefi/curve-dao-contracts/blob/master/contracts/burners/eth/USDNBurner.vy) |[0x06534b0BF7Ff378F162d4F348390BDA53b15fA35](https://etherscan.io/address/0x06534b0BF7Ff378F162d4F348390BDA53b15fA35#code)|
|`UniswapBurner`| [UniswapBurner.vy](https://github.com/curvefi/curve-dao-contracts/blob/master/contracts/burners/eth/UniswapBurner.vy) |[0xf3b64840b39121b40d8685f1576b64c157ce2e24](https://etherscan.io/address/0xf3b64840b39121b40d8685f1576b64c157ce2e24#code)|
|`YBurner`| [YBurner.vy](https://github.com/curvefi/curve-dao-contracts/blob/master/contracts/burners/eth/YBurner.vy) |[0xd16ea3e5681234da84419512eb597362135cd8c9](https://etherscan.io/address/0xd16ea3e5681234da84419512eb597362135cd8c9#code)|
|`UnderlyingBurner`| [UnderlyingBurner.vy](https://github.com/curvefi/curve-dao-contracts/blob/master/contracts/burners/eth/UnderlyingBurner.vy) |[0x786b374b5eef874279f4b7b4de16940e57301a58](https://etherscan.io/address/0x786b374b5eef874279f4b7b4de16940e57301a58#code)|



## **Pool Registry**
The pool registry serves as an on-chain information hub about the current state of Curve pools. For instance, on-chain integrators can fetch the current address of a Curve pool and query information about it.

Here is a list of all components of the pool registry currently in use:

| Registry    | Address   | 
| ----------- | -------| 
| `base_pool_registry` |  [0xDE3eAD9B2145bBA2EB74007e58ED07308716B725](https://etherscan.io/address/0xDE3eAD9B2145bBA2EB74007e58ED07308716B725#code) | 
| `crypto_registry` |  [0x9a32aF1A11D9c937aEa61A3790C2983257eA8Bc0](https://etherscan.io/address/0x9a32aF1A11D9c937aEa61A3790C2983257eA8Bc0#code) |
| `stable_registry_handler` |  [0x46a8a9CF4Fc8e99EC3A14558ACABC1D93A27de68](https://etherscan.io/address/0x46a8a9CF4Fc8e99EC3A14558ACABC1D93A27de68#code)  | 
| `stable_factory_handler` |  [0x127db66E7F0b16470Bec194d0f496F9Fa065d0A9](https://etherscan.io/address/0x127db66E7F0b16470Bec194d0f496F9Fa065d0A9#code)  |
| `crypto_registry_handler` |  [0x22ceb131d3170f9f2FeA6b4b1dE1B45fcfC86E56](https://etherscan.io/address/0x22ceb131d3170f9f2FeA6b4b1dE1B45fcfC86E56#code) |
| `crypto_factory_handler` |  [0xC4F389020002396143B863F6325aA6ae481D19CE](https://etherscan.io/address/0xC4F389020002396143B863F6325aA6ae481D19CE#code)  |
| `crvusd_pool_handler` |  [0x538E984C2d5f821d51932dd9C570Dff192D3DF2D](https://etherscan.io/address/0x538e984c2d5f821d51932dd9c570dff192d3df2d#code) |
| `CurveTricryptoFactoryHandler` |  [0x9335bf643c455478f8be40fa20b5164b90215b80](https://etherscan.io/address/0x9335bf643c455478f8be40fa20b5164b90215b80#code) |
| `MetaRegistry` |  [0xF98B45FA17DE75FB1aD0e7aFD971b0ca00e379fC](https://etherscan.io/address/0xF98B45FA17DE75FB1aD0e7aFD971b0ca00e379fC#code) |


## Factory

### Pools
| Name      | Source  | Address|
| ----------- | -------|  -------| 
| `Factory` | [todo]() | [0x4F8846Ae9380B90d2E71D5e3D042dff3E7ebb40d](https://etherscan.io/address/0x4F8846Ae9380B90d2E71D5e3D042dff3E7ebb40d#code) |
| `MetapoolFactory` | [todo]() | [0xB9fC157394Af804a3578134A6585C0dc9cc990d4](https://etherscan.io/address/0xB9fC157394Af804a3578134A6585C0dc9cc990d4#code) |
| `CurveFactory` | [todo]() | [0xF18056Bbd320E96A48e3Fbf8bC061322531aac99](https://etherscan.io/address/0xF18056Bbd320E96A48e3Fbf8bC061322531aac99#code) |
| `TricryptoFactory` | [todo]() | [0x0c0e5f2fF0ff18a3be9b835635039256dC4B4963](https://etherscan.io/address/0x0c0e5f2fF0ff18a3be9b835635039256dC4B4963#code) |   

### crvUSD
| Name      | Source  | Address|
| ----------- | -------|  -------| 
| `crvUSDFactory` | [ControllerFactory.vy](https://github.com/curvefi/curve-stablecoin/blob/master/contracts/ControllerFactory.vy) | [0xC9332fdCB1C491Dcc683bAe86Fe3cb70360738BC](https://etherscan.io/address/0xC9332fdCB1C491Dcc683bAe86Fe3cb70360738BC#code) |


# Arbitrum
## Factory
| Name      | Source  | Address|
| ----------- | -------|  -------| 
| `Factory | [todo]() | [0xb17b674d9c5cb2e441f8e196a2f048a81355d031](https://arbiscan.io/address/0xb17b674d9c5cb2e441f8e196a2f048a81355d031#code) |


# Optimism
## Factory
| Name      | Source  | Address|
| ----------- | -------|  -------| 
| `Factory` | [todo]() | [0x2db0e83599a91b508ac268a6197b8b14f5e72840](https://optimistic.etherscan.io/address/0x2db0e83599a91b508ac268a6197b8b14f5e72840#code) |


# Base
## Factory
| Name      | Source  | Address|
| ----------- | -------|  -------| 
| `Factory` | [todo]() | [0x3093f9b57a428f3eb6285a589cb35bea6e78c336](https://basescan.org/address/0x3093f9b57a428f3eb6285a589cb35bea6e78c336#code) |
| `TricryptoFactory` | [todo]() | [0xa5961898870943c68037f6848d2d866ed2016bcb](https://basescan.org/address/0xa5961898870943c68037f6848d2d866ed2016bcb#code) |


# Polygon
## Factory
| Name      | Source  | Address|
| ----------- | -------|  -------| 
| `Factory` | [todo]() | [0x722272d36ef0da72ff51c5a65db7b870e2e8d4ee](https://polygonscan.com/address/0x722272d36ef0da72ff51c5a65db7b870e2e8d4ee#code) |
| `CryptoFactory` | [todo]() | [0xe5de15a9c9bbedb4f5ec13b131e61245f2983a69](https://polygonscan.com/address/0xe5de15a9c9bbedb4f5ec13b131e61245f2983a69#code) |



# Avalanche
## Factory
| Name      | Source  | Address|
| ----------- | -------|  -------| 
| `Factory` | [todo]() | [0xb17b674d9c5cb2e441f8e196a2f048a81355d031](https://snowtrace.io/address/0xb17b674d9c5cb2e441f8e196a2f048a81355d031#code) |


# Gnosis
## Factory
| Name      | Source  | Address|
| ----------- | -------|  -------| 
| `Factory` | [todo]() | [0xd19baeadc667cf2015e395f2b08668ef120f41f5](https://gnosisscan.io/address/0xd19baeadc667cf2015e395f2b08668ef120f41f5#code) |


# Fantom
## Factory
| Name      | Source  | Address|
| ----------- | -------|  -------| 
| `Factory` | [todo]() | [0x686d67265703d1f124c45e33d47d794c566889ba](https://ftmscan.com/address/0x686d67265703d1f124c45e33d47d794c566889ba#code) |
| `CryptoFactory` | [todo]() | [0xe5de15a9c9bbedb4f5ec13b131e61245f2983a69](https://ftmscan.com/address/0xe5de15a9c9bbedb4f5ec13b131e61245f2983a69#code) |




# Kava
# Moonbeam
# Aurora
# Celo