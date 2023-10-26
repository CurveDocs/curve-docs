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




### **Fee Burners**
Burners are a crucial element of the fee payout system in Curve. They convert the collected pool fees into an asset that is later exchanged for USDC. Eventually, the USDC is deposited into the 3Pool, and the fees are distributed to veCRV holders in 3CRV. The type of burner used depends on the tokens present in the pool.

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





## **Stableswap-NG**

!!!deploy "Contract Source & Deployment"
    Source code available on [Github](https://github.com/curvefi/stableswap-ng).


Ethereum Mainnet:
| Contract    | Address   | 
| ----------- | -------| 
| Math        | [0x20D1c021525C85D9617Ccc64D8f547d5f730118A](https://etherscan.io/address/0x20D1c021525C85D9617Ccc64D8f547d5f730118A#code) |
| Views       | [0x87DD13Dd25a1DBde0E1EdcF5B8Fa6cfff7eABCaD](https://etherscan.io/address/0x87DD13Dd25a1DBde0E1EdcF5B8Fa6cfff7eABCaD#code) |
| Plain AMM   | [0x3E3B5F27bbf5CC967E074b70E9f4046e31663181](https://etherscan.io/address/0x3E3B5F27bbf5CC967E074b70E9f4046e31663181#code) |
| Meta AMM    | [0x19bd1AB34d6ABB584b9C1D5519093bfAA7f6c7d2](https://etherscan.io/address/0x19bd1AB34d6ABB584b9C1D5519093bfAA7f6c7d2#code) |
| Factory     | [0x6A8cbed756804B16E05E741eDaBd5cB544AE21bf](https://etherscan.io/address/0x6A8cbed756804B16E05E741eDaBd5cB544AE21bf#code) |
| Gauge       | [0xF5617D4f7514bE35fce829a1C19AE7f6c9106979](https://etherscan.io/address/0xF5617D4f7514bE35fce829a1C19AE7f6c9106979#code) |


Ethereum Sepolia:
| Contract    | Address   | 
| ----------- | -------| 
| Math        | [0xbc7654d2dd901aaaa3be4cb5bc0f10dea9f96443](https://sepolia.etherscan.io/address/0xbc7654d2dd901aaaa3be4cb5bc0f10dea9f96443#code) |
| Views       | [0x07920e98a66e462c2aa4c8fa6200bc68ca161ea0](https://sepolia.etherscan.io/address/0x07920e98a66e462c2aa4c8fa6200bc68ca161ea0#code) |
| Plain AMM   | [0x296d2b5c23833a70d07c8fcbb97d846c1ff90ddd](https://sepolia.etherscan.io/address/0x296d2b5c23833a70d07c8fcbb97d846c1ff90ddd#code) |
| Meta AMM    | [0xa12A87c73718a34CD8601b5022B2C6C359142585](https://sepolia.etherscan.io/address/0xa12A87c73718a34CD8601b5022B2C6C359142585#code) |
| Factory     | [0xfb37b8D939FFa77114005e61CFc2e543d6F49A81](https://sepolia.etherscan.io/address/0xfb37b8D939FFa77114005e61CFc2e543d6F49A81#code) |
| Gauge       | [0x64891ab20392a029c0f231656ff13c5ee64b730c](https://sepolia.etherscan.io/address/0x64891ab20392a029c0f231656ff13c5ee64b730c#code) |


Arbitrum:
| Contract    | Address   | 
| ----------- | -------| 
| Math        | [0x3d6cB2F6DcF47CDd9C13E4e3beAe9af041d8796a](https://arbiscan.io/address/0x3d6cB2F6DcF47CDd9C13E4e3beAe9af041d8796a#code) |
| Views       | [0xC1b393EfEF38140662b91441C6710Aa704973228](https://arbiscan.io/address/0xC1b393EfEF38140662b91441C6710Aa704973228#code) |
| Plain AMM   | [0x76303e4fDcA0AbF28aB3ee42Ce086E6503431F1D](https://arbiscan.io/address/0x76303e4fDcA0AbF28aB3ee42Ce086E6503431F1D#code) |
| Meta AMM    | [0xd125E7a0cEddF89c6473412d85835450897be6Dc](https://arbiscan.io/address/0xd125E7a0cEddF89c6473412d85835450897be6Dc#code) |
| Factory     | [0x9AF14D26075f142eb3F292D5065EB3faa646167b](https://arbiscan.io/address/0x9AF14D26075f142eb3F292D5065EB3faa646167b#code) |


Optimism:
| Contract    | Address   | 
| ----------- | -------| 
| Math        | [0x8b3EFBEfa6eD222077455d6f0DCdA3bF4f3F57A6](https://optimistic.etherscan.io/address/0x8b3EFBEfa6eD222077455d6f0DCdA3bF4f3F57A6#code) |
| Views       | [0x506F594ceb4E33F5161139bAe3Ee911014df9f7f](https://optimistic.etherscan.io/address/0x506F594ceb4E33F5161139bAe3Ee911014df9f7f#code) |
| Plain AMM   | [0x87FE17697D0f14A222e8bEf386a0860eCffDD617](https://optimistic.etherscan.io/address/0x87FE17697D0f14A222e8bEf386a0860eCffDD617#code) |
| Meta AMM    | [0x1764ee18e8B3ccA4787249Ceb249356192594585](https://optimistic.etherscan.io/address/0x1764ee18e8B3ccA4787249Ceb249356192594585#code) |
| Factory     | [0x5eeE3091f747E60a045a2E715a4c71e600e31F6E](https://optimistic.etherscan.io/address/0x5eeE3091f747E60a045a2E715a4c71e600e31F6E#code) |


Base:
| Contract    | Address   | 
| ----------- | -------| 
| Math        | [0x506F594ceb4E33F5161139bAe3Ee911014df9f7f](https://basescan.org/address/0x506F594ceb4E33F5161139bAe3Ee911014df9f7f#code) |
| Views       | [0x87FE17697D0f14A222e8bEf386a0860eCffDD617](https://basescan.org/address/0x87FE17697D0f14A222e8bEf386a0860eCffDD617#code) |
| Plain AMM   | [0x1764ee18e8B3ccA4787249Ceb249356192594585](https://basescan.org/address/0x1764ee18e8B3ccA4787249Ceb249356192594585#code) |
| Meta AMM    | [0x5eee3091f747e60a045a2e715a4c71e600e31f6e](https://basescan.org/address/0x5eee3091f747e60a045a2e715a4c71e600e31f6e#code) |
| Factory     | [0xd2002373543Ce3527023C75e7518C274A51ce712](https://basescan.org/address/0xd2002373543Ce3527023C75e7518C274A51ce712#code) |


Linea:
| Contract    | Address   | 
| ----------- | -------| 
| Math        | [0x8b3EFBEfa6eD222077455d6f0DCdA3bF4f3F57A6](https://lineascan.build/address/0x8b3EFBEfa6eD222077455d6f0DCdA3bF4f3F57A6#code) |
| Views       | [0x506F594ceb4E33F5161139bAe3Ee911014df9f7f](https://lineascan.build/address/0x506F594ceb4E33F5161139bAe3Ee911014df9f7f#code) |
| Plain AMM   | [0x87FE17697D0f14A222e8bEf386a0860eCffDD617](https://lineascan.build/address/0x87FE17697D0f14A222e8bEf386a0860eCffDD617#code) |
| Meta AMM    | [0x1764ee18e8b3cca4787249ceb249356192594585](https://lineascan.build/address/0x1764ee18e8b3cca4787249ceb249356192594585#code) |
| Factory     | [0x5eeE3091f747E60a045a2E715a4c71e600e31F6E](https://lineascan.build/address/0x5eeE3091f747E60a045a2E715a4c71e600e31F6E#code) |


Scroll:
| Contract    | Address   | 
| ----------- | -------| 
| Math        | [0x8b3EFBEfa6eD222077455d6f0DCdA3bF4f3F57A6](https://scroll.l2scan.co/address/0x8b3EFBEfa6eD222077455d6f0DCdA3bF4f3F57A6) |
| Views       | [0x506F594ceb4E33F5161139bAe3Ee911014df9f7f](https://scroll.l2scan.co/address/0x506F594ceb4E33F5161139bAe3Ee911014df9f7f#code) |
| Plain AMM   | [0x87FE17697D0f14A222e8bEf386a0860eCffDD617](https://scroll.l2scan.co/address/0x87FE17697D0f14A222e8bEf386a0860eCffDD617#code) |
| Meta AMM    | [0x1764ee18e8B3ccA4787249Ceb249356192594585](https://scroll.l2scan.co/address/0x1764ee18e8B3ccA4787249Ceb249356192594585#code) |
| Factory     | [0x5eeE3091f747E60a045a2E715a4c71e600e31F6E](https://scroll.l2scan.co/address/0x5eeE3091f747E60a045a2E715a4c71e600e31F6E#code) |


ZK-Sync:
| Contract    | Address   | 
| ----------- | -------| 
| Math        | []() |
| Views       | []() |
| Plain AMM   | []() |
| Meta AMM    | []() |
| Factory     | []() |



Polygon-ZK EVM:
| Contract    | Address   | 
| ----------- | -------| 
| Math        | [0x506F594ceb4E33F5161139bAe3Ee911014df9f7f](https://zkevm.polygonscan.com/address/0x506F594ceb4E33F5161139bAe3Ee911014df9f7f#code) |
| Views       | [0x87fe17697d0f14a222e8bef386a0860ecffdd617](https://zkevm.polygonscan.com/address/0x87fe17697d0f14a222e8bef386a0860ecffdd617#code) |
| Plain AMM   | [0x1764ee18e8b3cca4787249ceb249356192594585](https://zkevm.polygonscan.com/address/0x1764ee18e8b3cca4787249ceb249356192594585#code) |
| Meta AMM    | [0x5eee3091f747e60a045a2e715a4c71e600e31f6e](https://zkevm.polygonscan.com/address/0x5eee3091f747e60a045a2e715a4c71e600e31f6e#code) |
| Factory     | [0xd2002373543Ce3527023C75e7518C274A51ce712](https://zkevm.polygonscan.com/address/0xd2002373543Ce3527023C75e7518C274A51ce712#code) |


Gnosis:
| Contract    | Address   | 
| ----------- | -------| 
| Math        | [0x87FE17697D0f14A222e8bEf386a0860eCffDD617](https://gnosisscan.io/address/0x87FE17697D0f14A222e8bEf386a0860eCffDD617#code) |
| Views       | [0x5eeE3091f747E60a045a2E715a4c71e600e31F6E](https://gnosisscan.io/address/0x5eeE3091f747E60a045a2E715a4c71e600e31F6E#code) |
| Plain AMM   | [0xd2002373543Ce3527023C75e7518C274A51ce712](https://gnosisscan.io/address/0xd2002373543Ce3527023C75e7518C274A51ce712#code) |
| Meta AMM    | [0xd3B17f862956464ae4403cCF829CE69199856e1e](https://gnosisscan.io/address/0xd3B17f862956464ae4403cCF829CE69199856e1e#code) |
| Factory     | [0xbC0797015fcFc47d9C1856639CaE50D0e69FbEE8](https://gnosisscan.io/address/0xbC0797015fcFc47d9C1856639CaE50D0e69FbEE8#code) |


Polygon:
| Contract    | Address   | 
| ----------- | -------| 
| Math        | [0xf3A431008396df8A8b2DF492C913706BDB0874ef](https://polygonscan.com//address/0xf3A431008396df8A8b2DF492C913706BDB0874ef#code) |
| Views       | [0x8b3EFBEfa6eD222077455d6f0DCdA3bF4f3F57A6](https://polygonscan.com/address/0x8b3EFBEfa6eD222077455d6f0DCdA3bF4f3F57A6#code) |
| Plain AMM   | [0x506F594ceb4E33F5161139bAe3Ee911014df9f7f](https://polygonscan.com/address/0x506F594ceb4E33F5161139bAe3Ee911014df9f7f#code) |
| Meta AMM    | [0x87FE17697D0f14A222e8bEf386a0860eCffDD617](https://polygonscan.com/address/0x87FE17697D0f14A222e8bEf386a0860eCffDD617#code) |
| Factory     | [0x1764ee18e8B3ccA4787249Ceb249356192594585](https://polygonscan.com/address/0x1764ee18e8B3ccA4787249Ceb249356192594585#code) |


Avalanche:
| Contract    | Address   | 
| ----------- | -------| 
| Math        | [0xf3A431008396df8A8b2DF492C913706BDB0874ef](https://snowtrace.io/address/0xf3A431008396df8A8b2DF492C913706BDB0874ef#code) |
| Views       | [0x8b3EFBEfa6eD222077455d6f0DCdA3bF4f3F57A6](https://snowtrace.io/address/0x8b3EFBEfa6eD222077455d6f0DCdA3bF4f3F57A6#code) |
| Plain AMM   | [0x506F594ceb4E33F5161139bAe3Ee911014df9f7f](https://snowtrace.io/address/0x506F594ceb4E33F5161139bAe3Ee911014df9f7f#code) |
| Meta AMM    | [0x87FE17697D0f14A222e8bEf386a0860eCffDD617](https://snowtrace.io/address/0x87FE17697D0f14A222e8bEf386a0860eCffDD617#code) |
| Factory     | [0x1764ee18e8B3ccA4787249Ceb249356192594585](https://snowtrace.io/address/0x1764ee18e8B3ccA4787249Ceb249356192594585#code) |


Fantom:
| Contract    | Address   | 
| ----------- | -------| 
| Math        | [0x8b3EFBEfa6eD222077455d6f0DCdA3bF4f3F57A6](https://ftmscan.com/address/0x8b3EFBEfa6eD222077455d6f0DCdA3bF4f3F57A6#code) |
| Views       | [0x5eeE3091f747E60a045a2E715a4c71e600e31F6E](https://ftmscan.com/address/0x5eeE3091f747E60a045a2E715a4c71e600e31F6E#code) |
| Plain AMM   | [0xd2002373543Ce3527023C75e7518C274A51ce712](https://ftmscan.com/address/0xd2002373543Ce3527023C75e7518C274A51ce712#code) |
| Meta AMM    | [0x686bdb3D24Bc6F3ED89ed3d3B659765c54aC78B4](https://ftmscan.com/address/0x686bdb3D24Bc6F3ED89ed3d3B659765c54aC78B4#code) |
| Factory     | [0xe61Fb97Ef6eBFBa12B36Ffd7be785c1F5A2DE66b](https://ftmscan.com/address/0xe61Fb97Ef6eBFBa12B36Ffd7be785c1F5A2DE66b#code) |


Binance Smart Chain:
| Contract    | Address   | 
| ----------- | -------| 
| Math        | [0x506F594ceb4E33F5161139bAe3Ee911014df9f7f](https://bscscan.com/address/0x506F594ceb4E33F5161139bAe3Ee911014df9f7f#code) |
| Views       | [0x1764ee18e8B3ccA4787249Ceb249356192594585](https://bscscan.com/address/0x1764ee18e8B3ccA4787249Ceb249356192594585#code) |
| Plain AMM   | [0x604388Bb1159AFd21eB5191cE22b4DeCdEE2Ae22](https://bscscan.com/address/0x604388Bb1159AFd21eB5191cE22b4DeCdEE2Ae22#code) |
| Meta AMM    | [0x06452f9c013fc37169B57Eab8F50A7A48c9198A3](https://bscscan.com/address/0x06452f9c013fc37169B57Eab8F50A7A48c9198A3#code) |
| Factory     | [0xd7E72f3615aa65b92A4DBdC211E296a35512988B](https://bscscan.com/address/0xd7E72f3615aa65b92A4DBdC211E296a35512988B#code) |


Celo:
| Contract    | Address   | 
| ----------- | -------| 
| Math        | [0xf3A431008396df8A8b2DF492C913706BDB0874ef](https://celoscan.io/address/0xf3A431008396df8A8b2DF492C913706BDB0874ef#code) |
| Views       | [0x8b3EFBEfa6eD222077455d6f0DCdA3bF4f3F57A6](https://celoscan.io/address/0x8b3EFBEfa6eD222077455d6f0DCdA3bF4f3F57A6#code) |
| Plain AMM   | [0x506F594ceb4E33F5161139bAe3Ee911014df9f7f](https://celoscan.io/address/0x506F594ceb4E33F5161139bAe3Ee911014df9f7f#code) |
| Meta AMM    | [0x87FE17697D0f14A222e8bEf386a0860eCffDD617](https://celoscan.io/address/0x87FE17697D0f14A222e8bEf386a0860eCffDD617#code) |
| Factory     | [0x1764ee18e8B3ccA4787249Ceb249356192594585](https://celoscan.io/address/0x1764ee18e8B3ccA4787249Ceb249356192594585#code) |


Kava:
| Contract    | Address   | 
| ----------- | -------| 
| Math        | [0xf3A431008396df8A8b2DF492C913706BDB0874ef](https://kavascan.com/address/0xf3A431008396df8A8b2DF492C913706BDB0874ef#contracts) |
| Views       | [0x8b3EFBEfa6eD222077455d6f0DCdA3bF4f3F57A6](https://kavascan.com/address/0x8b3EFBEfa6eD222077455d6f0DCdA3bF4f3F57A6#contracts) |
| Plain AMM   | [0x506F594ceb4E33F5161139bAe3Ee911014df9f7f](https://kavascan.com/address/0x506F594ceb4E33F5161139bAe3Ee911014df9f7f#contracts) |
| Meta AMM    | [0x87FE17697D0f14A222e8bEf386a0860eCffDD617](https://kavascan.com/address/0x87FE17697D0f14A222e8bEf386a0860eCffDD617#contracts) |
| Factory     | [0x1764ee18e8B3ccA4787249Ceb249356192594585](https://kavascan.com/address/0x1764ee18e8B3ccA4787249Ceb249356192594585#contracts) |


Aurora:
| Contract    | Address   | 
| ----------- | -------| 
| Math        | [0x8b3EFBEfa6eD222077455d6f0DCdA3bF4f3F57A6](https://explorer.aurora.dev/address/0x8b3EFBEfa6eD222077455d6f0DCdA3bF4f3F57A6/contracts) |
| Views       | [0x506F594ceb4E33F5161139bAe3Ee911014df9f7f](https://explorer.aurora.dev/address/0x506F594ceb4E33F5161139bAe3Ee911014df9f7f/contracts) |
| Plain AMM   | [0x87FE17697D0f14A222e8bEf386a0860eCffDD617](https://explorer.aurora.dev/address/0x87FE17697D0f14A222e8bEf386a0860eCffDD617/contracts) |
| Meta AMM    | [0x1764ee18e8B3ccA4787249Ceb249356192594585](https://explorer.aurora.dev/address/0x1764ee18e8B3ccA4787249Ceb249356192594585/contracts) |
| Factory     | [0x5eeE3091f747E60a045a2E715a4c71e600e31F6E](https://explorer.aurora.dev/address/0x5eeE3091f747E60a045a2E715a4c71e600e31F6E/contracts) |


Tron:
| Contract    | Address   | 
| ----------- | -------| 
| Math        | []() |
| Views       | []() |
| Plain AMM   | []() |
| Meta AMM    | []() |
| Factory     | []() |