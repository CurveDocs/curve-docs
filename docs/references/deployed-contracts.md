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


## **Curve Stablecoin**

### **General Infrastructure** 

For testing in production purposes, several contract deployments have taken place. Please ensure that you are using the correct and latest version. The latest deployment logs can be found [here](https://github.com/curvefi/curve-stablecoin/blob/master/deployment-logs/mainnet.log).

!!!deploy "Contract Source & Deployment"
    Source code available on [Github](https://github.com/curvefi/curve-stablecoin).

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