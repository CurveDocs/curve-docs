This section of the documentation is dedicated to offering a comprehensive overview of all deployed contracts. We strive to maintain the accuracy and completeness of these addresses, but **please be aware that there may be instances where the information becomes outdated**.


## **Curve DAO**
Curve DAO consists of multiple smart contracts connected by [Aragon](https://github.com/aragon/aragonOS). Interaction with Aragon occurs through a [modified implementation](https://github.com/curvefi/curve-aragon-voting) of the [Aragon Voting App](https://github.com/aragon/aragon-apps/tree/master/apps/voting). Aragon’s standard one-token, one-vote method is replaced with a weighting system based on locking tokens. Curve DAO has a token (CRV) used for governance and value accrual.

!!!deploy "Source Code"
    Source code of the core contracts is available on [GitHub](https://github.com/curvefi/curve-dao-contracts).


*Here is a list of contract deployments that are used in the Curve DAO:*

| Contract Type             | Contract Address |
| :-----------------------: | :--------------: |
| `CRV Token`               | [0xD533a949740bb3306d119CC777fa900bA034cd52](https://etherscan.io/token/0xD533a949740bb3306d119CC777fa900bA034cd52) |
| `CRV Circulating Supply`  | [0x14139EB676342b6bC8E41E0d419969f23A49881e](https://etherscan.io/address/0x14139EB676342b6bC8E41E0d419969f23A49881e) |
| `Fee Distributor`         | [0xa464e6dcda8ac41e03616f95f4bc98a13b8922dc](https://etherscan.io/address/0xa464e6dcda8ac41e03616f95f4bc98a13b8922dc) |
| `Gauge Controller`        | [0x2F50D538606Fa9EDD2B11E2446BEb18C9D5846bB](https://etherscan.io/address/0x2F50D538606Fa9EDD2B11E2446BEb18C9D5846bB) |
| `Minter`                  | [0xd061D61a4d941c39E5453435B6345Dc261C2fcE0](https://etherscan.io/address/0xd061D61a4d941c39E5453435B6345Dc261C2fcE0) |
| `Voting Escrow`           | [0x5f3b5dfeb7b28cdbd7faba78963ee202a494e2a2](https://etherscan.io/address/0x5f3b5dfeb7b28cdbd7faba78963ee202a494e2a2) |
| `Vesting Escrow`          | [0x575ccd8e2d300e2377b43478339e364000318e2c](https://etherscan.io/address/0x575ccd8e2d300e2377b43478339e364000318e2c) |


*Despite being launched on Ethereum, the Curve DAO Token can be bridged to various chains:*

!!!danger "MULTICHAIN WARNING"
    Multichain statement: https://twitter.com/MultichainOrg/status/1677180114227056641  
    The Multichain service stopped currently, and all bridge transactions will be stuck on the source chains. 
    There is no confirmed resume time.  
    **Please don’t use the Multichain bridging service now.**


| Chain                             | Contract Address                                                         | Bridge                                   |
| --------------------------------- | ------------------------------------------------------------------------ | ---------------------------------------- |
| :logos-arbitrum: **Arbitrum**     | [0x11cDb42B0EB46D95f990BeDD4695A6e3fA034978](https://arbiscan.io/address/0x11cDb42B0EB46D95f990BeDD4695A6e3fA034978) | [**Arbitrum Bridge**](https://bridge.arbitrum.io/)​ |
| :logos-base: **Base**             | [0x8Ee73c484A26e0A5df2Ee2a4960B789967dd0415](https://basescan.org/address/0x8Ee73c484A26e0A5df2Ee2a4960B789967dd0415) | [**Base Bridge**](https://bridge.base.org/deposit) |
| :logos-optimism: **Optimism**     | [0x0994206dfE8De6Ec6920FF4D779B0d950605Fb53](https://optimistic.etherscan.io/address/0x0994206dfe8de6ec6920ff4d779b0d950605fb53) | [**Optimism Bridge**](https://app.optimism.io/bridge) |
| :logos-polygon: **Polygon**       | [0x172370d5Cd63279eFa6d502DAB29171933a610AF](https://polygonscan.com/address/0x172370d5cd63279efa6d502dab29171933a610af) | [**Polygon Bridge**](https://wallet.polygon.technology/bridge/)​ |
| :logos-gnosis: **Gnosis**         | [0x712b3d230F3C1c19db860d80619288b1F0BDd0Bd](https://gnosisscan.io/address/0x712b3d230f3c1c19db860d80619288b1f0bdd0bd) | [**xDai Bridge**](https://bridge.xdaichain.com/)​ |
| :logos-gnosis: **Gnosis**         | [0x712b3d230F3C1c19db860d80619288b1F0BDd0Bd](https://gnosisscan.io/address/0x712b3d230f3c1c19db860d80619288b1f0bdd0bd) | [**Omni Bridge**](https://omni.xdaichain.com/bridge)​ |
| :logos-xlayer: **X-Layer** | [0x3d5320821bfca19fb0b5428f2c79d63bd5246f89](https://www.oklink.com/xlayer/address/0x3d5320821bfca19fb0b5428f2c79d63bd5246f89/contract) | [**X-Layer Bridge**](https://www.okx.com/xlayer/bridge) |
| :logos-avalanche: **Avalanche**​   | [0x47536F17F4fF30e64A96a7555826b8f9e66ec468](https://snowscan.xyz/address/0x47536F17F4fF30e64A96a7555826b8f9e66ec468) | [**<mark style="background-color: #f31743; color: black">Multichain</mark>**](https://multichain.org/)​ |
| :logos-fantom: **Fantom**​         | [0x1E4F97b9f9F913c46F1632781732927B9019C68b](https://ftmscan.com/address/0x1e4f97b9f9f913c46f1632781732927b9019c68b) | [**<mark style="background-color: #f31743; color: black">Multichain</mark>**](https://multichain.org/)​ |
| :logos-celo: **Celo**​             | [0x173fd7434B8B50dF08e3298f173487ebDB35FD14](https://explorer.celo.org/mainnet/address/0x173fd7434B8B50dF08e3298f173487ebDB35FD14) | [**<mark style="background-color: #f31743; color: black">Multichain</mark>**](https://multichain.org/)​ |


**Aragon**

Aragon [Voting App](https://wiki.aragon.org/archive/dev/apps/voting/) deployments are the main entry points used to create new votes, vote, check the status of a vote, and execute a successful vote.

| Voting Type | Contract Address |
| :---------: | :--------------: | 
| `Ownership` | [0xe478de485ad2fe566d49342cbd03e49ed7db3356](https://etherscan.io/address/0xe478de485ad2fe566d49342cbd03e49ed7db3356) |
| `Parameter` | [0xbcff8b0b9419b9a88c44546519b1e909cf330399](https://etherscan.io/address/0xbcff8b0b9419b9a88c44546519b1e909cf330399) | 


Aragon [Agent](https://hack.aragon.org/docs/guides-use-agent) deployments correspond to the different owner accounts within the DAO. Contract calls made due to a successful vote will be executed from these addresses. When deploying new contracts, these addresses should be given appropriate access to admin functionality.

| Agent Type  | Contract Address  |
| :---------: | :---------------: | 
| `Ownership` | [0x40907540d8a6C65c637785e8f8B742ae6b0b9968](https://etherscan.io/address/0x40907540d8a6C65c637785e8f8B742ae6b0b9968) |
| `Parameter` | [0x4EEb3bA4f221cA16ed4A0cC7254E2E32DF948c5f](https://etherscan.io/address/0x4EEb3bA4f221cA16ed4A0cC7254E2E32DF948c5f) |


The following token addresses are used for determining voter weights within Curve’s Aragon DAOs.

| Vote Type   | Contract Address  |
| :---------: | :---------------: | 
| `Ownership / Parameter` | [0x5f3b5DfEb7B28CDbD7FAba78963EE202a494e2A2](https://etherscan.io/address/0x5f3b5DfEb7B28CDbD7FAba78963EE202a494e2A2) |


The Emergency DAO is deployed at:

| Vote Type   | Contract Address  |
| :---------: | :---------------: | 
| `eDAO` | [0x467947EE34aF926cF1DCac093870f613C96B1E0c](https://etherscan.io/address/0x467947EE34aF926cF1DCac093870f613C96B1E0c) |



---


## **Pool Registry**
The pool registry acts as a central hub of information on the current status of Curve pools This means that on-chain integrators can easily retrieve the current address of a particular Curve pool and gather relevant details about it through queries.

Here is a list of all components of the pool registry currently in use:

| Contract Type                     | Contract Address  | 
| :-------------------------------: | :---------------: | 
| `MetaRegistry`                    |  [0xF98B45FA17DE75FB1aD0e7aFD971b0ca00e379fC](https://etherscan.io/address/0xF98B45FA17DE75FB1aD0e7aFD971b0ca00e379fC#code) |
| `BasePoolRegistry`                |  [0xDE3eAD9B2145bBA2EB74007e58ED07308716B725](https://etherscan.io/address/0xDE3eAD9B2145bBA2EB74007e58ED07308716B725#code) | 
| `AddressProvider`                 |  [0x0000000022D53366457F9d5E68Ec105046FC4383](https://etherscan.io/address/0x0000000022D53366457F9d5E68Ec105046FC4383#code) | 
| `StableRegistry`                  |  [0x90E00ACe148ca3b23Ac1bC8C240C2a7Dd9c2d7f5](https://etherscan.io/address/0x90E00ACe148ca3b23Ac1bC8C240C2a7Dd9c2d7f5#code) | 
| `StableRegistryHandler`           |  [0x46a8a9CF4Fc8e99EC3A14558ACABC1D93A27de68](https://etherscan.io/address/0x46a8a9CF4Fc8e99EC3A14558ACABC1D93A27de68#code) | 
| `MetaPoolFactory`                 |  [0xB9fC157394Af804a3578134A6585C0dc9cc990d4](https://etherscan.io/address/0xB9fC157394Af804a3578134A6585C0dc9cc990d4#code) |
| `MetaPoolFactoryHandler`          |  [0x127db66E7F0b16470Bec194d0f496F9Fa065d0A9](https://etherscan.io/address/0x127db66E7F0b16470Bec194d0f496F9Fa065d0A9#code) |
| `CryptoSwapRegistry`              |  [0x9a32aF1A11D9c937aEa61A3790C2983257eA8Bc0](https://etherscan.io/address/0x9a32aF1A11D9c937aEa61A3790C2983257eA8Bc0#code) |
| `CryptoSwapRegistryHandler`       |  [0x22ceb131d3170f9f2FeA6b4b1dE1B45fcfC86E56](https://etherscan.io/address/0x22ceb131d3170f9f2FeA6b4b1dE1B45fcfC86E56#code) |
| `CryptoFactory`                   |  [0xF18056Bbd320E96A48e3Fbf8bC061322531aac99](https://etherscan.io/address/0xF18056Bbd320E96A48e3Fbf8bC061322531aac99#code) |
| `CryptoFactoryHandler`            |  [0xC4F389020002396143B863F6325aA6ae481D19CE](https://etherscan.io/address/0xC4F389020002396143B863F6325aA6ae481D19CE#code) |
| `crvUSDFactory`                   |  [0x4F8846Ae9380B90d2E71D5e3D042dff3E7ebb40d](https://etherscan.io/address/0x4F8846Ae9380B90d2E71D5e3D042dff3E7ebb40d#code) |
| `crvUSDFactoryHandler`            |  [0x538E984C2d5f821d51932dd9C570Dff192D3DF2D](https://etherscan.io/address/0x538e984c2d5f821d51932dd9c570dff192d3df2d#code) |
| `CurveTricryptoFactory`           |  [0x0c0e5f2fF0ff18a3be9b835635039256dC4B4963](https://etherscan.io/address/0x0c0e5f2fF0ff18a3be9b835635039256dC4B4963#code) |
| `CurveTricryptoFactoryHandler`    |  [0x9335bf643c455478f8be40fa20b5164b90215b80](https://etherscan.io/address/0x9335bf643c455478f8be40fa20b5164b90215b80#code) |


---


## **Fee Burner**
Burners are a crucial element of the fee payout system in Curve. They convert the collected pool fees into an asset that is later exchanged for USDC. Eventually, the USDC is deposited into the 3Pool, and the fees are distributed to veCRV holders in 3CRV. The type of burner used depends on the tokens present in the pool.

*Here is a list of burner contracts currently in use:*

**:logos-ethereum: Ethereum** 

| Burner Type       | Contract Address |
| :---------------: | :--------------: |
|`ABurner`          | [0x12220a63a2013133D54558C9d03c35288eAC9B34](https://etherscan.io/address/0x12220a63a2013133d54558c9d03c35288eac9b34#code) |
|`CryptoSwapBurner` | [0xdc237b4B882Fa1d1fd1dD5B59A08F8dB3416DbE3](https://etherscan.io/address/0xdc237b4B882Fa1d1fd1dD5B59A08F8dB3416DbE3#code) |
|`SwapStableBurner` | [0x90B4508e8F91523e5c8854eA73AFD8c22d8c27b7](https://etherscan.io/address/0x90B4508e8F91523e5c8854eA73AFD8c22d8c27b7#code) |
|`CBurner`          | [0xdd0e10857d952c73b2fa39ce86308299df8774b8](https://etherscan.io/address/0xdd0e10857d952c73b2fa39ce86308299df8774b8#code) |
|`LPBurner`         | [0xaa42C0CD9645A58dfeB699cCAeFBD30f19B1ff81](https://etherscan.io/address/0xaa42C0CD9645A58dfeB699cCAeFBD30f19B1ff81#code) |
|`MetaBurner`       | [0xE4b65889469ad896e866331f0AB5652C1EcfB3E6](https://etherscan.io/address/0xE4b65889469ad896e866331f0AB5652C1EcfB3E6#code) |
|`SynthBurner`      | [0x67a0213310202dbc2cbe788f4349b72fba90f9fa](https://etherscan.io/address/0x67a0213310202dbc2cbe788f4349b72fba90f9fa#code) |
|`USDNBurner`       | [0x06534b0BF7Ff378F162d4F348390BDA53b15fA35](https://etherscan.io/address/0x06534b0BF7Ff378F162d4F348390BDA53b15fA35#code) |
|`UniswapBurner`    | [0xf3b64840b39121b40d8685f1576b64c157ce2e24](https://etherscan.io/address/0xf3b64840b39121b40d8685f1576b64c157ce2e24#code) |
|`YBurner`          | [0xd16ea3e5681234da84419512eb597362135cd8c9](https://etherscan.io/address/0xd16ea3e5681234da84419512eb597362135cd8c9#code) |
|`UnderlyingBurner` | [0x786b374b5eef874279f4b7b4de16940e57301a58](https://etherscan.io/address/0x786b374b5eef874279f4b7b4de16940e57301a58#code) |



**:logos-arbitrum: Arbitrum** 

| Burner Type       | Contract Address                                       |
| :---------------: | :----------------------------------------------------: |
| `LPBurner`        | [0x2Ac51A7bC5E41cc35a1ce107E39847Ce00c20161](https://arbiscan.io/address/0x2Ac51A7bC5E41cc35a1ce107E39847Ce00c20161#code) |
| `MetaBurner`      | [0xE4b65889469ad896e866331f0AB5652C1EcfB3E6](https://arbiscan.io/address/0xE4b65889469ad896e866331f0AB5652C1EcfB3E6#code) |
| `UnderlyingSwapBurner` | [0x69F36f4486168D8eeBD472375588e88B702f5344](https://arbiscan.io/address/0x69F36f4486168D8eeBD472375588e88B702f5344#code) |
| `SwapBurner`      | [0x09F8D940EAD55853c51045bcbfE67341B686C071](https://arbiscan.io/address/0x09F8D940EAD55853c51045bcbfE67341B686C071#code) |
| `DepositBurner`   | [0x0094Ad026643994c8fB2136ec912D508B15fe0E5](https://arbiscan.io/address/0x0094Ad026643994c8fB2136ec912D508B15fe0E5#code) |
| `wETHBurner`      | [0x5191946500e75f0A74476F146dF7d386e52961d9](https://arbiscan.io/address/0x5191946500e75f0A74476F146dF7d386e52961d9#code) |



**:logos-optimism: Optimism**

| Burner Type       | Contract Address                                       |
| :---------------: | :----------------------------------------------------: |
| `StableBurner`    | [0xE5De15A9C9bBedb4F5EC13B131E61245f2983A69](https://optimistic.etherscan.io/address/0xE5De15A9C9bBedb4F5EC13B131E61245f2983A69#code) |
| `SwapBurner`      | [0xe35A879E5EfB4F1Bb7F70dCF3250f2e19f096bd8](https://optimistic.etherscan.io/address/0xe35A879E5EfB4F1Bb7F70dCF3250f2e19f096bd8#code) |
| `SynthTokenBurner`| [0x070A5C8a99002F50C18B52B90e938BC477611b16](https://optimistic.etherscan.io/address/0x070A5C8a99002F50C18B52B90e938BC477611b16#code) |



**:logos-polygon: Polygon**

| Burner Type            | Contract Address                                       |
| :--------------------: | :----------------------------------------------------: |
| `amToken Burner`       | [0x7b7b5f87c7357133c93dba8d61fb397f33c99a6b](https://polygonscan.com/address/0x7b7b5f87c7357133c93dba8d61fb397f33c99a6b#code) |
| `EURT Burner`          | [0x410364C393C7E64b6F1d0Ee03f89BFD09b49940c](https://polygonscan.com/address/0x410364C393C7E64b6F1d0Ee03f89BFD09b49940c#code) |
| `Tricrypto Burner`     | [0x43450Feccf936FbA3143e03F35D3Cc608D5fE1d2](https://polygonscan.com/address/0x43450Feccf936FbA3143e03F35D3Cc608D5fE1d2#code) |
| `Tricrypto LP Burner`  | [0x0094Ad026643994c8fB2136ec912D508B15fe0E5](https://polygonscan.com/address/0x0094Ad026643994c8fB2136ec912D508B15fe0E5#code) |
| `am3crv LP Burner`     | [0x6a2691068C7CbdA03292Ba0f9c77A25F658bAeF5](https://polygonscan.com/address/0x6a2691068C7CbdA03292Ba0f9c77A25F658bAeF5#code) |
| `Crypto Factory LP Burner`| [0x09F8D940EAD55853c51045bcbfE67341B686C071](https://polygonscan.com/address/0x09F8D940EAD55853c51045bcbfE67341B686C071#code) |
| `BridgeContract`        | [0x28542E4AF3De534ca36dAF342febdA541c937C5a](https://polygonscan.com/address/0x28542e4af3de534ca36daf342febda541c937c5a#code) |



**:logos-avalanche: Avalanche**

| Burner Type       | Contract Address                                       |
| :---------------: | :----------------------------------------------------: |
| `LPBurner`        | [0x2c2fc48c3404a70f2d33290d5820edf49cbf74a5](https://snowscan.xyz/address/0x2c2fc48c3404a70f2d33290d5820edf49cbf74a5#code) |
| `LPBurner`        | [0x8038C01A0390a8c547446a0b2c18fc9aEFEcc10c](https://snowscan.xyz/address/0x8038C01A0390a8c547446a0b2c18fc9aEFEcc10c#code) |
| `avTokenBurner`   | [0x61E10659fe3aa93d036d099405224E4Ac24996d0](https://snowscan.xyz/address/0x61E10659fe3aa93d036d099405224E4Ac24996d0#code) |
| `avTokenBurner`   | [0xcF897d9C8F9174F08f30084220683948B105D1B1](https://snowscan.xyz/address/0xcF897d9C8F9174F08f30084220683948B105D1B1#code) |
| `BTC Burner`      | [0xE6358f6a45B502477e83CC1CDa759f540E4459ee](https://snowscan.xyz/address/0xE6358f6a45B502477e83CC1CDa759f540E4459ee#code) |
| `ETH Burner`      | [0xd7d147c6Bb90A718c3De8C0568F9B560C79fa416](https://snowscan.xyz/address/0xd7d147c6Bb90A718c3De8C0568F9B560C79fa416#code) |
| `Swap Burner`     | [0x6a2691068C7CbdA03292Ba0f9c77A25F658bAeF5](https://snowscan.xyz/address/0x6a2691068C7CbdA03292Ba0f9c77A25F658bAeF5#code) |
| `BridgeContract`  | [0xa218ed442715fc42ac96a6323b47538684a36e4b](https://snowscan.xyz/address/0xa218ed442715fc42ac96a6323b47538684a36e4b#code) |




**:logos-fantom: Fantom**

| Burner Type         | Contract Address                                       |
| :-----------------: | :----------------------------------------------------: |
| `UnderlyingBurner`  | [0x423f26eb44d4be89072eecfc81b95065ce43bf4b](https://ftmscan.com/address/0x423f26eb44d4be89072eecfc81b95065ce43bf4b#code) |
| `BTCBurner`         | [0xFa18A0385610b560f3041C40E23fB319e24658f1](https://ftmscan.com/address/0xFa18A0385610b560f3041C40E23fB319e24658f1#code) |
| `gToken Burner`     | [0xDE5331AC4B3630f94853Ff322B66407e0D6331E8](https://ftmscan.com/address/0xDE5331AC4B3630f94853Ff322B66407e0D6331E8#code) |
| `cToken Burner`     | [0x11137B10C210b579405c21A07489e28F3c040AB1](https://ftmscan.com/address/0x11137B10C210b579405c21A07489e28F3c040AB1#code) |
| `Tricrypto Burner`  | [0x337e9d5A2DeE10Fdd30E67236667E1dE5b0c085F](https://ftmscan.com/address/0x337e9d5A2DeE10Fdd30E67236667E1dE5b0c085F#code) |
| `Swap Burner`       | [0x959c1BA175e04F7164EB749f4E88f10fe4Bac8a6](https://ftmscan.com/address/0x959c1BA175e04F7164EB749f4E88f10fe4Bac8a6#code) |
| `BridgeContract`    | [0x993ff6dd3851ab11af751277e419c2aa2697a288](https://ftmscan.com/address/0x993ff6dd3851ab11af751277e419c2aa2697a288#code) |


---


## **New Curve Burner System**

**:logos-ethereum: Ethereum**

| Contract Type    | Contract Address |
| :--------------: | :--------------: |
| `FeeCollector`   | [0xa2Bcd1a4Efbd04B63cd03f5aFf2561106ebCCE00](https://etherscan.io/address/0xa2Bcd1a4Efbd04B63cd03f5aFf2561106ebCCE00) |
| `Hooker`         | [0x9A9DF35cd8E88565694CA6AD5093c236C7f6f69D](https://etherscan.io/address/0x9A9DF35cd8E88565694CA6AD5093c236C7f6f69D) |
| `CowSwapBurner`  | [0xC0fC3dDfec95ca45A0D2393F518D3EA1ccF44f8b](https://etherscan.io/address/0xC0fC3dDfec95ca45A0D2393F518D3EA1ccF44f8b) |
| `FeeDistributor` | [0xD16d5eC345Dd86Fb63C6a9C43c517210F1027914](https://etherscan.io/address/0xD16d5eC345Dd86Fb63C6a9C43c517210F1027914) |


**:logos-gnosis: Gnosis**

| Contract Type    | Contract Address |
| :--------------: | :--------------: |
| `FeeCollector`   | [0xBb7404F9965487a9DdE721B3A5F0F3CcfA9aa4C5](https://gnosisscan.io/address/0xBb7404F9965487a9DdE721B3A5F0F3CcfA9aa4C5) |
| `Hooker`         | [0xE898893ebAe7b75dc4cAB0fb16e24137309ff178](https://gnosisscan.io/address/0xE898893ebAe7b75dc4cAB0fb16e24137309ff178) |
| `CowSwapBurner`  | [0x566b9F24200A9B51b76792D4e81B569AF27eda83](https://gnosisscan.io/address/0x566b9F24200A9B51b76792D4e81B569AF27eda83) |
| `GnosisBridger`  | [0xc4AA2fB0A8837a06d296b1c0DE1990E401659449](https://gnosisscan.io/address/0xc4AA2fB0A8837a06d296b1c0DE1990E401659449) |


---


## **Curve Router**

Routers that performs up to 5 swaps in a single transaction and can do estimations with `get_dy` and `get_dx`.

!!!deploy "Source Code"
    Source code is available on [GitHub](https://github.com/curvefi/curve-router-ng/tree/master/contracts).

| Chain | Contract Address |
| ----------- | :-----: |
| :logos-ethereum: `Ethereum` | [0xF0d4c12A5768D806021F80a262B4d39d26C58b8D](https://etherscan.io/address/0xF0d4c12A5768D806021F80a262B4d39d26C58b8D#code) |
| :logos-arbitrum: `Arbitrum` | [0xF0d4c12A5768D806021F80a262B4d39d26C58b8D](https://arbiscan.io/address/0xF0d4c12A5768D806021F80a262B4d39d26C58b8D#code) |
| :logos-optimism: `Optimism` | [0xF0d4c12A5768D806021F80a262B4d39d26C58b8D](https://optimistic.etherscan.io/address/0xF0d4c12A5768D806021F80a262B4d39d26C58b8D#code) |
| :logos-base: `Base` | [0xd6681e74eEA20d196c15038C580f721EF2aB6320](https://basescan.org/address/0xd6681e74eEA20d196c15038C580f721EF2aB6320#code) |
| :logos-fraxtal: `Fraxtal` | [0x4f37A9d177470499A2dD084621020b023fcffc1F](https://fraxscan.com/address/0x4f37A9d177470499A2dD084621020b023fcffc1F#code) |
| :logos-polygon: `Polygon` | [0xF0d4c12A5768D806021F80a262B4d39d26C58b8D](https://polygonscan.com/address/0xF0d4c12A5768D806021F80a262B4d39d26C58b8D#code) |
| :logos-gnosis: `Gnosis (xDAI)` | [0xF0d4c12A5768D806021F80a262B4d39d26C58b8D](https://gnosisscan.io/address/0xF0d4c12A5768D806021F80a262B4d39d26C58b8D#code) |
| :logos-avalanche: `Avalanche` | [0xF0d4c12A5768D806021F80a262B4d39d26C58b8D](https://snowscan.xyz/address/0xF0d4c12A5768D806021F80a262B4d39d26C58b8D#code) |
| :logos-fantom: `Fantom` | [0xF0d4c12A5768D806021F80a262B4d39d26C58b8D](https://ftmscan.com/address/0xF0d4c12A5768D806021F80a262B4d39d26C58b8D#code) |
| :logos-bsc: `Binance Smart Chain` | [0x69522fb5337663d3B4dFB0030b881c1A750Adb4f](https://bscscan.com/address/0x69522fb5337663d3B4dFB0030b881c1A750Adb4f#code) |
| :logos-kava: `Kava` | [0xF0d4c12A5768D806021F80a262B4d39d26C58b8D](https://kavascan.com/address/0xF0d4c12A5768D806021F80a262B4d39d26C58b8D/contracts#address-tabs) |
| :logos-xlayer: `X-Layer` | [0x4f37A9d177470499A2dD084621020b023fcffc1F](https://www.oklink.com/xlayer/address/0x4f37A9d177470499A2dD084621020b023fcffc1F/contract) |


---


## **EVM Sidechain Gauges**

!!!danger "MULTICHAIN WARNING"
    At the time of writing (13.11.2023), sidechain gauges on Celo, Avalanche and Fantom are disabled due to issues with Multichain.    
    The Multichain service stopped currently, and all bridge transactions will be stuck on the source chains. There is no confirmed resume time.  
    Multichain statement: https://twitter.com/MultichainOrg/status/1677180114227056641

!!!deploy "Source Code"
    Source code is available on [GitHub](https://github.com/curvefi/curve-dao-contracts/tree/master/contracts/gauges/sidechain).

The `RootLiquidityGaugeFactory` contract on Ethereum is utilized across a majority of sidechains, with the exception of Fraxtal, Binance Smart Chain, Avalanche, and Fantom. Each of these networks hosts its own version of the `RootLiquidityGaugeFactory` contract. While the functionality across these contracts remains consistent, they differ in their contract addresses.

| Type | Chain | Contract Address |
| ---- | ----- | ------- |
| `RootLiquidityGaugeFactory` | :logos-ethereum: Ethereum | [0xabc000d88f23bb45525e447528dbf656a9d55bf5](https://etherscan.io/address/0xabC000d88f23Bb45525E447528DBF656A9D55bf5) |
| `ChildLiquidityGaugeFactory` | :logos-arbitrum: Arbitrum | [0xabc000d88f23bb45525e447528dbf656a9d55bf5](https://arbiscan.io/address/0xabc000d88f23bb45525e447528dbf656a9d55bf5#code) |
| `veBoost - Boost Delegation V2` | :logos-arbitrum: Arbitrum | [0x98c80fa823759b642c3e02f40533c164f40727ae](https://arbiscan.io/address/0x98c80fa823759b642c3e02f40533c164f40727ae#code) |
| `ChildLiquidityGaugeFactory` | :logos-optimism: Optimism | [0xabc000d88f23bb45525e447528dbf656a9d55bf5](https://optimistic.etherscan.io/address/0xabC000d88f23Bb45525E447528DBF656A9D55bf5#code) |
| `veBoost - Boost Delegation V2` | :logos-optimism: Optimism | [0x65a0b01756E837e6670634816E4F5B3a3fF21107](https://optimistic.etherscan.io/address/0x65a0b01756E837e6670634816E4F5B3a3fF21107#code) |
| `ChildLiquidityGaugeFactory` | :logos-polygon: Polygon | [0xabc000d88f23bb45525e447528dbf656a9d55bf5](https://polygonscan.com/address/0xabC000d88f23Bb45525E447528DBF656A9D55bf5) |
| `veBoost - Boost Delegation V2` | :logos-polygon: Polygon | [0xb5ACC710AEDE048600E10eEDcefDf98d4aBf4B1E](https://polygonscan.com/address/0xb5ACC710AEDE048600E10eEDcefDf98d4aBf4B1E) |
| `ChildLiquidityGaugeFactory` | :logos-base: Base | [0xabc000d88f23bb45525e447528dbf656a9d55bf5](https://basescan.org/address/0xabC000d88f23Bb45525E447528DBF656A9D55bf5) |
| `veBoost - Boost Delegation V2` | :logos-base: Base | :material-close: |
| :logos-fraxtal: `RootLiquidityGaugeFactory` | :logos-ethereum: Ethereum | [0xeF672bD94913CB6f1d2812a6e18c1fFdEd8eFf5c](https://etherscan.io/address/0xeF672bD94913CB6f1d2812a6e18c1fFdEd8eFf5c) |
| `ChildLiquidityGaugeFactory` | :logos-fraxtal: Fraxtal | [0xeF672bD94913CB6f1d2812a6e18c1fFdEd8eFf5c](https://fraxscan.com/address/0xeF672bD94913CB6f1d2812a6e18c1fFdEd8eFf5c) |
| `veBoost - Boost Delegation V2` | :logos-fraxtal: Fraxtal | :material-close: |
| :logos-bsc: `RootLiquidityGaugeFactory` | :logos-ethereum: Ethereum | [0xDb205f215f568ADf21b9573b62566f6d9a40bed6](https://etherscan.io/address/0xDb205f215f568ADf21b9573b62566f6d9a40bed6) |
| `ChildLiquidityGaugeFactory` | :logos-bsc: BinanceSmartChain | [0xDb205f215f568ADf21b9573b62566f6d9a40bed6](https://bscscan.com/address/0xDb205f215f568ADf21b9573b62566f6d9a40bed6) |
| `veBoost - Boost Delegation V2` | :logos-bsc: BinanceSmartChain | :material-close: |
| `ChildLiquidityGaugeFactory` | :logos-gnosis: Gnosis | [0xabc000d88f23bb45525e447528dbf656a9d55bf5](https://gnosisscan.io/address/0xabc000d88f23bb45525e447528dbf656a9d55bf5) |
| `veBoost - Boost Delegation V2` | :logos-gnosis: Gnosis | [0xefde221f306152971d8e9f181bfe998447975810](https://gnosisscan.io/address/0xefde221f306152971d8e9f181bfe998447975810) |
| `ChildLiquidityGaugeFactory` | :logos-celo: Celo | [0xabc000d88f23bb45525e447528dbf656a9d55bf5](https://celoscan.io/address/0xabc000d88f23bb45525e447528dbf656a9d55bf5) |
| `veBoost - Boost Delegation V2` | :logos-celo: Celo | :material-close: |
| `ChildLiquidityGaugeFactory` | :logos-avalanche: Avalanche | [0xabc000d88f23bb45525e447528dbf656a9d55bf5](https://snowscan.xyz/address/0xabc000d88f23bb45525e447528dbf656a9d55bf5) |
| `veBoost - Boost Delegation V2` | :logos-avalanche: Avalanche | [0xc55837710bc500f1e3c7bb9dd1d51f7c5647e657](https://snowscan.xyz/address/0xc55837710bc500f1e3c7bb9dd1d51f7c5647e657) |
| `ChildLiquidityGaugeFactory` | :logos-fantom: Fantom | [0xabc000d88f23bb45525e447528dbf656a9d55bf5](https://ftmscan.com/address/0xabC000d88f23Bb45525E447528DBF656A9D55bf5) |
| `veBoost - Boost Delegation V2` | :logos-fantom: Fantom | [0xb75dca485E21A77E1B433eCAcb74475FC67e259c](https://ftmscan.com/address/0xb75dca485E21A77E1B433eCAcb74475FC67e259c) |
| `ChildLiquidityGaugeFactory` | :logos-xlayer: X-Layer | [0xef672bd94913cb6f1d2812a6e18c1ffded8eff5c](https://www.oklink.com/xlayer/address/0xef672bd94913cb6f1d2812a6e18c1ffded8eff5c/contract) |
| `veBoost - Boost Delegation V2` | :logos-xlayer: X-Layer | :material-close: |


---


## **Pool Factory**

Pool factory addresses are referenced within the according sections, e.g., stableswap-ng factories can be found in the [stableswap-ng section](#stableswap-ng).

**Ethereum Mainnet**

*The following are "old" factories on Ethereum Mainnet:*

|  Factory              | Contract Address |
| :-------------------: | :--------------: |
| MetaPool Factory      | [0xB9fC157394Af804a3578134A6585C0dc9cc990d4](https://etherscan.io/address/0xB9fC157394Af804a3578134A6585C0dc9cc990d4) | 
| StableSwap-NG Factory | [0x6A8cbed756804B16E05E741eDaBd5cB544AE21bf](https://etherscan.io/address/0x6A8cbed756804B16E05E741eDaBd5cB544AE21bf) | 
| crvUSD Pool Factory   | [0x4F8846Ae9380B90d2E71D5e3D042dff3E7ebb40d](https://etherscan.io/address/0x4F8846Ae9380B90d2E71D5e3D042dff3E7ebb40d) | 
| CryptoSwap Factory    | [0xF18056Bbd320E96A48e3Fbf8bC061322531aac99](https://etherscan.io/address/0xF18056Bbd320E96A48e3Fbf8bC061322531aac99) | 
| Tricrypto Factory     | [0x0c0e5f2fF0ff18a3be9b835635039256dC4B4963](https://etherscan.io/address/0x0c0e5f2fF0ff18a3be9b835635039256dC4B4963) |


---


## **Curve X-GOV**

!!!deploy "Source Code"
    Source code is available on [GitHub](https://github.com/curvefi/curve-xgov).

**:logos-arbitrum: Arbitrum**

| Contract Type      | Contract Address |
| :----------------: | :--------------: |
| L1 Broadcaster     | [0xb7b0FF38E0A01D798B5cd395BbA6Ddb56A323830](https://etherscan.io/address/0xb7b0FF38E0A01D798B5cd395BbA6Ddb56A323830) |
| L2 Relayer         | [0xb7b0FF38E0A01D798B5cd395BbA6Ddb56A323830](https://arbiscan.io/address/0xb7b0FF38E0A01D798B5cd395BbA6Ddb56A323830) |
| L2 Ownership Agent | [0x452030a5D962d37D97A9D65487663cD5fd9C2B32](https://arbiscan.io/address/0x452030a5D962d37D97A9D65487663cD5fd9C2B32) |
| L2 Parameter Agent | [0x5ccbB27FB594c5cF6aC0670bbcb360c0072F6839](https://arbiscan.io/address/0x5ccbB27FB594c5cF6aC0670bbcb360c0072F6839) |
| L2 Emergency Agent | [0x2CB6E1Adf22Af1A38d7C3370441743a123991EC3](https://arbiscan.io/address/0x2CB6E1Adf22Af1A38d7C3370441743a123991EC3) |
| L2 Vault           | [0x25877b9413Cc7832A6d142891b50bd53935feF82](https://arbiscan.io/address/0x25877b9413Cc7832A6d142891b50bd53935feF82) |
| Agent Blueprint    | [0x187FE3505e56f4dA67b06564F03575cC15bE2B4d](https://arbiscan.io/address/0x187FE3505e56f4dA67b06564F03575cC15bE2B4d) |


**:logos-optimism: Optimism**

| Contract Type      | Contract Address |
| :----------------: | :--------------: |
| L1 Broadcaster     | [0x8e1e5001c7b8920196c7e3edf2bcf47b2b6153ff](https://etherscan.io/address/0x8e1e5001c7b8920196c7e3edf2bcf47b2b6153ff) |
| L2 Relayer         | [0x8e1e5001C7B8920196c7E3EdF2BCf47B2B6153ff](https://optimistic.etherscan.io/address/0x8e1e5001C7B8920196c7E3EdF2BCf47B2B6153ff) |
| L2 Ownership Agent | [0x28c4A1Fa47EEE9226F8dE7D6AF0a41C62Ca98267](https://optimistic.etherscan.io/address/0x28c4A1Fa47EEE9226F8dE7D6AF0a41C62Ca98267) |
| L2 Parameter Agent | [0xE7F2B72E94d1c2497150c24EA8D65aFFf1027b9b](https://optimistic.etherscan.io/address/0xE7F2B72E94d1c2497150c24EA8D65aFFf1027b9b) |
| L2 Emergency Agent | [0x9fF1ddE4BE9BbD891836863d227248047B3D881b](https://optimistic.etherscan.io/address/0x9fF1ddE4BE9BbD891836863d227248047B3D881b) |
| L2 Vault           | [0xD166EEdf272B860E991d331B71041799379185D5](https://optimistic.etherscan.io/address/0xD166EEdf272B860E991d331B71041799379185D5) |
| Agent Blueprint    | [0xC5fd5D3b06a8ef50b911972CA313E4d327F7c0aC](https://optimistic.etherscan.io/address/0xC5fd5D3b06a8ef50b911972CA313E4d327F7c0aC) |


**:logos-base: Base**

| Contract Type      | Contract Address |
| :----------------: | :--------------: |
| L1 Broadcaster     | [0xcb843280c5037acfa67b8d4adc71484ced7c48c9](https://etherscan.io/address/0xcb843280c5037acfa67b8d4adc71484ced7c48c9) |
| L2 Relayer         | [0xCb843280C5037ACfA67b8D4aDC71484ceD7C48C9](https://basescan.org/address/0xCb843280C5037ACfA67b8D4aDC71484ceD7C48C9) |
| L2 Ownership Agent | [0x2c163fe0f079d138b9c04f780d735289344C8B80](https://basescan.org/address/0x2c163fe0f079d138b9c04f780d735289344C8B80) |
| L2 Parameter Agent | [0x7Ea4B72f04D8B02994F4EdB171Ce5F56eEdF457F](https://basescan.org/address/0x7Ea4B72f04D8B02994F4EdB171Ce5F56eEdF457F) |
| L2 Emergency Agent | [0x95F0f720CAdDED982E6998b3390E6D3788c2CE5C](https://basescan.org/address/0x95F0f720CAdDED982E6998b3390E6D3788c2CE5C) |
| L2 Vault           | [0xA4c0eA0fb8eb652e11C8123E589197E18Ca78AA8](https://basescan.org/address/0xA4c0eA0fb8eb652e11C8123E589197E18Ca78AA8) |
| Agent Blueprint    | [0xF3BC9E5fA891977DCa765ff52E8f22A1F7d49c1f](https://basescan.org/address/0xF3BC9E5fA891977DCa765ff52E8f22A1F7d49c1f) |


**:logos-mantle: Mantle**

| Contract Type      | Contract Address |
| :----------------: | :--------------: |
| L1 Broadcaster     | [0xb50b9a0d8a4ed8115fe174f300465ea4686d86df](https://etherscan.io/address/0xb50b9a0d8a4ed8115fe174f300465ea4686d86df) |
| L2 Relayer         | [0xB50B9a0D8A4ED8115Fe174F300465Ea4686d86Df](https://explorer.mantle.xyz/address/0xB50B9a0D8A4ED8115Fe174F300465Ea4686d86Df) |
| L2 Ownership Agent | [0xfe87a6cdca1eeb90987c6a196a1c5f5c76f5f2b0](https://explorer.mantle.xyz/address/0xfe87a6cdca1eeb90987c6a196a1c5f5c76f5f2b0) |
| L2 Parameter Agent | [0x024d362f7aa162d8591304016fd60a209efc527e](https://explorer.mantle.xyz/address/0x024d362f7aa162d8591304016fd60a209efc527e) |
| L2 Emergency Agent | [0x4339b53cf7f6eec1a997ceea81165e45c1244429](https://explorer.mantle.xyz/address/0x4339b53cf7f6eec1a997ceea81165e45c1244429) |
| L2 Vault           | [0x77A214bd4ee3650e5608339BBbE04b09f5546ECF](https://explorer.mantle.xyz/address/0x77A214bd4ee3650e5608339BBbE04b09f5546ECF) |
| Agent Blueprint    | [0x5EF72230578b3e399E6C6F4F6360edF95e83BBfd](https://explorer.mantle.xyz/address/0x5EF72230578b3e399E6C6F4F6360edF95e83BBfd) |


**:logos-avalanche: Avalanche**

| Contract Type      | Contract Address |
| :----------------: | :--------------: |
| L1 Broadcaster     | [0x5786696bB5bE7fCDb9997E7f89355d9e97FF8d89](https://etherscan.io/address/0x5786696bB5bE7fCDb9997E7f89355d9e97FF8d89) |
| L2 Relayer         | [0x3895064FD74a86542206C4c39eb1bf14BB9aF9a6](https://snowscan.xyz/address/0x3895064FD74a86542206C4c39eb1bf14BB9aF9a6) |
| L2 Ownership Agent | [0xeD953C2849785A8AEd7bC2ee8cf5fdE776E1Dc07](https://snowscan.xyz/address/0xeD953C2849785A8AEd7bC2ee8cf5fdE776E1Dc07) |
| L2 Parameter Agent | [0x33F9A2F3B85e7D4Ff4f9286a9a8525060100D855](https://snowscan.xyz/address/0x33F9A2F3B85e7D4Ff4f9286a9a8525060100D855) |
| L2 Emergency Agent | [0x1309DB123020F0533aFAfaF11D26286d5871bEB0](https://snowscan.xyz/address/0x1309DB123020F0533aFAfaF11D26286d5871bEB0) |
| L2 Vault           | [0xad422855ac8010f82F08696CA7750EfE061aa6D6](https://snowscan.xyz/address/0xad422855ac8010f82F08696CA7750EfE061aa6D6) |
| Agent Blueprint    | [0x31d13B6e3e287F506D21bBED9eA4b169971DF3fe](https://snowscan.xyz/address/0x31d13B6e3e287F506D21bBED9eA4b169971DF3fe) |


**:logos-fantom: Fantom**

| Contract Type      | Contract Address |
| :----------------: | :--------------: |
| L1 Broadcaster     | [0x5786696bB5bE7fCDb9997E7f89355d9e97FF8d89](https://etherscan.io/address/0x5786696bB5bE7fCDb9997E7f89355d9e97FF8d89) |
| L2 Relayer         | [0x002599c7D4299A268b332B3240d60308f93C99eC](https://ftmscan.com/address/0x002599c7D4299A268b332B3240d60308f93C99eC) |
| L2 Ownership Agent | [0xd62Ade30F740de7ef766008258B4b2F574A084F7](https://ftmscan.com/address/0xd62Ade30F740de7ef766008258B4b2F574A084F7) |
| L2 Parameter Agent | [0x837814ba42c6f3B39f0A5060168F7027695DDAb1](https://ftmscan.com/address/0x837814ba42c6f3B39f0A5060168F7027695DDAb1) |
| L2 Emergency Agent | [0x42113C6818ACb87ca3CaFDbBc6a6ae396f1548E6](https://ftmscan.com/address/0x42113C6818ACb87ca3CaFDbBc6a6ae396f1548E6) |
| L2 Vault           | [0x49C8De2D10C9A56DD9A59ab5Ca1216111276394C](https://ftmscan.com/address/0x49C8De2D10C9A56DD9A59ab5Ca1216111276394C) |
| Agent Blueprint    | [0x0732539C8aD556594FDa6A50fA8E976cA6D514B9](https://ftmscan.com/address/0x0732539C8aD556594FDa6A50fA8E976cA6D514B9) |


**:logos-bsc: BinanceSmartChain**

| Contract Type      | Contract Address |
| :----------------: | :--------------: |
| L1 Broadcaster     | [0x5786696bB5bE7fCDb9997E7f89355d9e97FF8d89](https://etherscan.io/address/0x5786696bB5bE7fCDb9997E7f89355d9e97FF8d89) |
| L2 Relayer         | [0x37b6d6d425438a9f8e40C8B4c06c10560967b678](https://bscscan.com/address/0x37b6d6d425438a9f8e40C8B4c06c10560967b678) |
| L2 Ownership Agent | [0xC97E2328c5701572C0DFB199b9f860d6ccD74199](https://bscscan.com/address/0xC97E2328c5701572C0DFB199b9f860d6ccD74199) |
| L2 Parameter Agent | [0x618a38a556B66FdDdcB5495Be412Df911D18eA1d](https://bscscan.com/address/0x618a38a556B66FdDdcB5495Be412Df911D18eA1d) |
| L2 Emergency Agent | [0xC940CE179f1F1bdC1EA1c02A2d0481bfD84C3280](https://bscscan.com/address/0xC940CE179f1F1bdC1EA1c02A2d0481bfD84C3280) |
| L2 Vault           | [0x44C927BacD65da570cB1F0A2F625367049525022](https://bscscan.com/address/0x44C927BacD65da570cB1F0A2F625367049525022) |
| Agent Blueprint    | [0x3D09c5D6AE6e45d01C560342E11ef355C2763F01](https://bscscan.com/address/0x3D09c5D6AE6e45d01C560342E11ef355C2763F01) |


**:logos-kava: Kava**

| Contract Type      | Contract Address |
| :----------------: | :--------------: |
| L1 Broadcaster     | [0x5786696bB5bE7fCDb9997E7f89355d9e97FF8d89](https://etherscan.io/address/0x5786696bB5bE7fCDb9997E7f89355d9e97FF8d89) |
| L2 Relayer         | [0xA5961898870943c68037F6848d2D866Ed2016bcB](https://kavascan.com/address/0xA5961898870943c68037F6848d2D866Ed2016bcB) |
| L2 Ownership Agent | [0xeC6a886148B38C233B07cc6732142dccaBF1051D](https://kavascan.com/address/0xeC6a886148B38C233B07cc6732142dccaBF1051D) |
| L2 Parameter Agent | [0x6e53131F68a034873b6bFA15502aF094Ef0c5854](https://kavascan.com/address/0x6e53131F68a034873b6bFA15502aF094Ef0c5854) |
| L2 Emergency Agent | [0xA177D2bd2BD723878bD95982c0855291953f74C9](https://kavascan.com/address/0xA177D2bd2BD723878bD95982c0855291953f74C9) |
| L2 Vault           | - |
| Agent Blueprint    | [0xC0AE3B85060530384647E9F3D63C9e1F53231f68](https://kavascan.com/address/0xC0AE3B85060530384647E9F3D63C9e1F53231f68) |


**:logos-polygon: Polygon**

| Contract Type      | Contract Address |
| :----------------: | :--------------: |
| L1 Broadcaster     | [0x91e95f16f7F1b988391A869771Ffb50Df4ceBDF7](https://etherscan.io/address/0x91e95f16f7F1b988391A869771Ffb50Df4ceBDF7) |
| L2 Relayer         | [0x91e95f16f7F1b988391A869771Ffb50Df4ceBDF7](https://polygonscan.com/address/0x91e95f16f7F1b988391A869771Ffb50Df4ceBDF7) |
| L2 Ownership Agent | [0x8cB05bFEd65b522a7cF98d590F1711A9Db43af71](https://polygonscan.com/address/0x8cB05bFEd65b522a7cF98d590F1711A9Db43af71) |
| L2 Parameter Agent | [0x3CF7c393519ea55D1E1F2c55a6395be63b1A9F9C](https://polygonscan.com/address/0x3CF7c393519ea55D1E1F2c55a6395be63b1A9F9C) |
| L2 Emergency Agent | [0x9FD6E204e08867170ddE54a8374083fF592eBD3E](https://polygonscan.com/address/0x9FD6E204e08867170ddE54a8374083fF592eBD3E) |
| L2 Vault           | - |
| Agent Blueprint    | [0x1fE46Da288A55aAf32facc6D182fB1933B22c2E9](https://polygonscan.com/address/0x1fE46Da288A55aAf32facc6D182fB1933B22c2E9) |


**:logos-xlayer: X-Layer**

| Contract Type      | Contract Address |
| :----------------: | :--------------: |
| L1 Broadcaster     | - |
| L2 Relayer         | - |
| L2 Ownership Agent | [0x6628b9e7c0029cea234b382be17101648f32cd8f](https://www.oklink.com/xlayer/address/0x6628b9e7c0029cea234b382be17101648f32cd8f/contract) |
| L2 Parameter Agent | [0xccc4864762412f3273bf7ca9264295909504ebb5](https://www.oklink.com/xlayer/address/0xccc4864762412f3273bf7ca9264295909504ebb5/contract) |
| L2 Emergency Agent | [0x9ffc6f671d88593aae56d9d34f2b40d7a56d467f](https://www.oklink.com/xlayer/address/0x9ffc6f671d88593aae56d9d34f2b40d7a56d467f/contract) |
| L2 Vault           | [0x0848F3800F04b3ad4309A5f27814be7FC4740cB9](https://www.oklink.com/xlayer/address/0x0848F3800F04b3ad4309A5f27814be7FC4740cB9/contract) |
| Agent Blueprint    | - |


---


## **Address Provider**

Contract functionality is documented [here :material-arrow-up-right:](../integration/address-provider.md).

!!!github
    The source code for `AddressProviderNG.vy` can be found on [:material-github: GitHub](https://github.com/curvefi/metaregistry/blob/main/contracts/AddressProviderNG.vy).


| Chain                         | Contract Address |
| ----------------------------- | ---------------- |
| :logos-ethereum: Ethereum     | [0x5ffe7FB82894076ECB99A30D6A32e969e6e35E98](https://etherscan.io/address/0x5ffe7FB82894076ECB99A30D6A32e969e6e35E98) |
| :logos-arbitrum: Arbitrum     | [0x5ffe7FB82894076ECB99A30D6A32e969e6e35E98](https://arbiscan.io/address/0x5ffe7FB82894076ECB99A30D6A32e969e6e35E98) |
| :logos-optimism: Optimism     | [0x5ffe7FB82894076ECB99A30D6A32e969e6e35E98](https://optimistic.etherscan.io/address/0x5ffe7FB82894076ECB99A30D6A32e969e6e35E98) |
| :logos-base: Base             | [0x5ffe7FB82894076ECB99A30D6A32e969e6e35E98](https://basescan.org/address/0x5ffe7FB82894076ECB99A30D6A32e969e6e35E98) |
| :logos-bsc: BinanceSmartChain | [0x5ffe7FB82894076ECB99A30D6A32e969e6e35E98](https://bscscan.com/address/0x5ffe7FB82894076ECB99A30D6A32e969e6e35E98) |
| :logos-polygon: Polygon       | [0x5ffe7FB82894076ECB99A30D6A32e969e6e35E98](https://polygonscan.com/address/0x5ffe7FB82894076ECB99A30D6A32e969e6e35E98) |
| :logos-fantom: Fantom         | [0x5ffe7FB82894076ECB99A30D6A32e969e6e35E98](https://ftmscan.com/address/0x5ffe7FB82894076ECB99A30D6A32e969e6e35E98) |
| :logos-gnosis: Gnosis         | [0x5ffe7FB82894076ECB99A30D6A32e969e6e35E98](https://gnosisscan.io/address/0x5ffe7fb82894076ecb99a30d6a32e969e6e35e98) |
| :logos-aurora: Aurora         | [0x5ffe7FB82894076ECB99A30D6A32e969e6e35E98](https://explorer.aurora.dev/address/0x5ffe7FB82894076ECB99A30D6A32e969e6e35E98) |
| :logos-celo: Celo             | [0x5ffe7FB82894076ECB99A30D6A32e969e6e35E98](https://celoscan.io/address/0x5ffe7FB82894076ECB99A30D6A32e969e6e35E98) |
| :logos-mantle: Mantle         | [0x5ffe7FB82894076ECB99A30D6A32e969e6e35E98](https://explorer.mantle.xyz/address/0x5ffe7FB82894076ECB99A30D6A32e969e6e35E98) |
| :logos-linea: Linea           | [0x5ffe7FB82894076ECB99A30D6A32e969e6e35E98](https://lineascan.build/address/0x5ffe7FB82894076ECB99A30D6A32e969e6e35E98) |
| :logos-polygon: Polygon zkEVM | [0x5ffe7FB82894076ECB99A30D6A32e969e6e35E98](https://zkevm.polygonscan.com/address/0x5ffe7FB82894076ECB99A30D6A32e969e6e35E98) |
| :logos-scroll: Scroll         | [0x5ffe7FB82894076ECB99A30D6A32e969e6e35E98](https://scrollscan.com/address/0x5ffe7FB82894076ECB99A30D6A32e969e6e35E98) |
| :logos-fraxtal: Fraxtal       | [0x5ffe7FB82894076ECB99A30D6A32e969e6e35E98](https://fraxscan.com/address/0x5ffe7FB82894076ECB99A30D6A32e969e6e35E98) |
| :logos-avalanche: Avalanche   | [0x5ffe7FB82894076ECB99A30D6A32e969e6e35E98](https://snowscan.xyz/address/0x5ffe7FB82894076ECB99A30D6A32e969e6e35E98) |
| :logos-kava: Kava             | [0x5ffe7FB82894076ECB99A30D6A32e969e6e35E98](https://kavascan.io/search?q=0x5ffe7FB82894076ECB99A30D6A32e969e6e35E98) |


---

## **Meta Registry**

Contract functionality is documented [here :material-arrow-up-right:](../integration/metaregistry.md).

!!!github
    The source code for `MetaRegistry.vy` and `MetaRegistryL2.vy` can be found on [:material-github: GitHub](https://github.com/curvefi/metaregistry/tree/main/contracts).


The contract address of the Meta Registry is also embedded into the [`AddressProvider`](#address-provider) and can be fetched by calling `get_address(7)`.

| Chain                         | Contract Address |
| ----------------------------- | ---------------- |
| :logos-ethereum: Ethereum     | [0xF98B45FA17DE75FB1aD0e7aFD971b0ca00e379fC](https://etherscan.io/address/0xF98B45FA17DE75FB1aD0e7aFD971b0ca00e379fC) |
| :logos-arbitrum: Arbitrum     | [0xE12374F193f91f71CE40D53E0db102eBaA9098D5](https://arbiscan.io/address/0xE12374F193f91f71CE40D53E0db102eBaA9098D5) |
| :logos-optimism: Optimism     | [0xB6845b562F01eB02ef20CBB63553d2a768e5a1Cb](https://optimistic.etherscan.io/address/0xB6845b562F01eB02ef20CBB63553d2a768e5a1Cb) |
| :logos-base: Base             | [0x87DD13Dd25a1DBde0E1EdcF5B8Fa6cfff7eABCaD](https://basescan.org/address/0x87DD13Dd25a1DBde0E1EdcF5B8Fa6cfff7eABCaD) |
| :logos-bsc: BinanceSmartChain | [0x4C7A5A5D57F98D362f1c00D7135F0dA5B6f82227](https://bscscan.com/address/0x4C7A5A5D57F98D362f1c00D7135F0dA5B6f82227) |
| :logos-polygon: Polygon       | [0x1FE2a06c8bd81AE65FD1C5036451890b37976369](https://polygonscan.com/address/0x1FE2a06c8bd81AE65FD1C5036451890b37976369) |
| :logos-fantom: Fantom         | [0xF5617D4f7514bE35fce829a1C19AE7f6c9106979](https://ftmscan.com/address/0xF5617D4f7514bE35fce829a1C19AE7f6c9106979) |
| :logos-gnosis: Gnosis         | [0xeEcCd039d7228530D5F0c3ce7291Dd9677CCFFb1](https://gnosisscan.io/address/0xeEcCd039d7228530D5F0c3ce7291Dd9677CCFFb1) |
| :logos-aurora: Aurora         | *not deployed yet* |
| :logos-celo: Celo             | [0x19bd1AB34d6ABB584b9C1D5519093bfAA7f6c7d2](https://celoscan.io/address/0x19bd1AB34d6ABB584b9C1D5519093bfAA7f6c7d2) |
| :logos-mantle: Mantle         | [0x0c59d36b23f809f8b6C7cb4c8C590a0AC103baEf](https://explorer.mantle.xyz/address/0x0c59d36b23f809f8b6C7cb4c8C590a0AC103baEf) |
| :logos-linea: Linea           | [0x0458ea5F4CD00E873264Be2031Ceb8f9d9b3116c](https://lineascan.build/address/0x0458ea5F4CD00E873264Be2031Ceb8f9d9b3116c) |
| :logos-polygon: Polygon zkEVM | [0x0458ea5F4CD00E873264Be2031Ceb8f9d9b3116c](https://zkevm.polygonscan.com/address/0x0458ea5F4CD00E873264Be2031Ceb8f9d9b3116c) |
| :logos-scroll: Scroll         | [0x6A8cbed756804B16E05E741eDaBd5cB544AE21bf](https://scrollscan.com/address/0x6A8cbed756804B16E05E741eDaBd5cB544AE21bf) |
| :logos-fraxtal: Fraxtal       | [0xd125E7a0cEddF89c6473412d85835450897be6Dc](https://fraxscan.com/address/0xd125E7a0cEddF89c6473412d85835450897be6Dc) |
| :logos-avalanche: Avalanche   | [0x6A8cbed756804B16E05E741eDaBd5cB544AE21bf](https://snowscan.xyz/address/0x6A8cbed756804B16E05E741eDaBd5cB544AE21bf) |
| :logos-kava: Kava             | *needs verification* |



---


## **Stableswap-NG**

!!!deploy "Source Code"
    Source code is available on [GitHub](https://github.com/curvefi/stableswap-ng).

!!!warning "Implementations"
    Every Factory contract has plain- and metapool implementations. The Factory on Ethereum has an additional gauge implementation. **Implementation contracts are upgradable.** They can be either replaced or additional implementation contracts can be set. Therefore, please **always make sure to check the most recent ones**.

    *To query the factory-specific implementations:*

    ```shell
    >>> Factory.pool_implementation(0)
    '0xDCc91f930b42619377C200BA05b7513f2958b202'
    >>> Factory.metapool_implementation(0)
    '0xede71F77d7c900dCA5892720E76316C6E575F0F7'
    >>> Factory.gauge_implementation() # ethereum mainnet only! 
    '0x38D9BdA812da2C68dFC6aDE85A7F7a54E77F8325'
    ```


**:logos-ethereum: Ethereum Mainnet**

| Contract Type | Contract Address |
| :---------: | :----------------: | 
| `Math`      | [0xc9CBC565A9F4120a2740ec6f64CC24AeB2bB3E5E](https://etherscan.io/address/0xc9CBC565A9F4120a2740ec6f64CC24AeB2bB3E5E#code) |
| `Views`     | [0x13526206545e2DC7CcfBaF28dC88F440ce7AD3e0](https://etherscan.io/address/0x13526206545e2DC7CcfBaF28dC88F440ce7AD3e0#code) |
| `Factory`   | [0x6A8cbed756804B16E05E741eDaBd5cB544AE21bf](https://etherscan.io/address/0x6A8cbed756804B16E05E741eDaBd5cB544AE21bf#code) |
| `Gauge`     | [0x38D9BdA812da2C68dFC6aDE85A7F7a54E77F8325](https://etherscan.io/address/0x38D9BdA812da2C68dFC6aDE85A7F7a54E77F8325#code) |
| `Plain AMM` | [0xDCc91f930b42619377C200BA05b7513f2958b202](https://etherscan.io/address/0xDCc91f930b42619377C200BA05b7513f2958b202#code) |
| `Meta AMM`  | [0xede71F77d7c900dCA5892720E76316C6E575F0F7](https://etherscan.io/address/0xede71F77d7c900dCA5892720E76316C6E575F0F7#code) |


**:logos-ethereum: Ethereum Sepolia**

| Contract Type | Contract Address |
| :---------: | :----------------: | 
| `Math`      | [0x2cad7b3e78e10bcbf2cc443ddd69ca8bcc09a758](https://sepolia.etherscan.io/address/0x2cad7b3e78e10bcbf2cc443ddd69ca8bcc09a758#code) |
| `Views`     | [0x9d3975070768580f755D405527862ee126d0eA08](https://sepolia.etherscan.io/address/0x9d3975070768580f755D405527862ee126d0eA08#code) |
| `Factory`   | [0xfb37b8D939FFa77114005e61CFc2e543d6F49A81](https://sepolia.etherscan.io/address/0xfb37b8D939FFa77114005e61CFc2e543d6F49A81#code) |
| `Plain AMM` | [0xE12374F193f91f71CE40D53E0db102eBaA9098D5](https://sepolia.etherscan.io/address/0xE12374F193f91f71CE40D53E0db102eBaA9098D5#code) |
| `Meta AMM`  | [0xB00E89EaBD59cD3254c88E390103Cf17E914f678](https://sepolia.etherscan.io/address/0xB00E89EaBD59cD3254c88E390103Cf17E914f678#code) |


**:logos-arbitrum: Arbitrum**

| Contract Type | Contract Address |
| :---------: | :----------------: | 
| `Math`      | [0xD4a8bd4d59d65869E99f20b642023a5015619B34](https://arbiscan.io/address/0xD4a8bd4d59d65869E99f20b642023a5015619B34#code) |
| `Views`     | [0xDD7EBB1C49780519dD9755B8B1A23a6f42CE099E](https://arbiscan.io/address/0xDD7EBB1C49780519dD9755B8B1A23a6f42CE099E#code) |
| `Factory`   | [0x9AF14D26075f142eb3F292D5065EB3faa646167b](https://arbiscan.io/address/0x9AF14D26075f142eb3F292D5065EB3faa646167b#code) |
| `Plain AMM` | [0xf6841C27fe35ED7069189aFD5b81513578AFD7FF](https://arbiscan.io/address/0xf6841C27fe35ED7069189aFD5b81513578AFD7FF#code) |
| `Meta AMM`  | [0xFf02cBD91F57A778Bab7218DA562594a680B8B61](https://arbiscan.io/address/0xFf02cBD91F57A778Bab7218DA562594a680B8B61#code) |


**:logos-optimism: Optimism**

| Contract Type | Contract Address |
| :---------: | :----------------: | 
| `Math`      | [0xa7b9d886A9a374A1C86DC52d2BA585c5CDFdac26](https://optimistic.etherscan.io/address/0xa7b9d886A9a374A1C86DC52d2BA585c5CDFdac26#code) |
| `Views`     | [0xf6841C27fe35ED7069189aFD5b81513578AFD7FF](https://optimistic.etherscan.io/address/0xf6841C27fe35ED7069189aFD5b81513578AFD7FF#code) |
| `Factory`   | [0x5eeE3091f747E60a045a2E715a4c71e600e31F6E](https://optimistic.etherscan.io/address/0x5eeE3091f747E60a045a2E715a4c71e600e31F6E#code) |
| `Plain AMM` | [0x635742dCC8313DCf8c904206037d962c042EAfBd](https://optimistic.etherscan.io/address/0x635742dCC8313DCf8c904206037d962c042EAfBd#code) |
| `Meta AMM`  | [0x5702BDB1Ec244704E3cBBaAE11a0275aE5b07499](https://optimistic.etherscan.io/address/0x5702BDB1Ec244704E3cBBaAE11a0275aE5b07499#code) |


**:logos-base: Base**

| Contract Type | Contract Address |
| :---------: | :----------------: |  
| `Math`      | [0xe265FC390E9129b7E337Da23cD42E00C34Da2CE3](https://basescan.org/address/0xe265FC390E9129b7E337Da23cD42E00C34Da2CE3#code) |
| `Views`     | [0xC1b393EfEF38140662b91441C6710Aa704973228](https://basescan.org/address/0xC1b393EfEF38140662b91441C6710Aa704973228#code) |
| `Factory`   | [0xd2002373543Ce3527023C75e7518C274A51ce712](https://basescan.org/address/0xd2002373543Ce3527023C75e7518C274A51ce712#code) |
| `Plain AMM` | [0xf3A6aa40cf048a3960E9664847E9a7be025a390a](https://basescan.org/address/0xf3A6aa40cf048a3960E9664847E9a7be025a390a#code) |
| `Meta AMM`  | [0x635742dCC8313DCf8c904206037d962c042EAfBd](https://basescan.org/address/0x635742dCC8313DCf8c904206037d962c042EAfBd#code) |


**:logos-fraxtal: Fraxtal**

| Contract Type | Contract Address |
| :---------: | :----------------: |  
| `Math`      | [0x506F594ceb4E33F5161139bAe3Ee911014df9f7f](https://fraxscan.com/address/0x506F594ceb4E33F5161139bAe3Ee911014df9f7f#code) |
| `Views`     | [0xFAbC421e3368D158d802684A217a83c083c94CeB](https://fraxscan.com/address/0xFAbC421e3368D158d802684A217a83c083c94CeB#code) |
| `Factory`   | [0xd2002373543Ce3527023C75e7518C274A51ce712](https://fraxscan.com/address/0xd2002373543Ce3527023C75e7518C274A51ce712#code) |
| `Plain AMM` | [0x1764ee18e8B3ccA4787249Ceb249356192594585](https://fraxscan.com/address/0x1764ee18e8B3ccA4787249Ceb249356192594585#code) |
| `Meta AMM`  | [0x5eeE3091f747E60a045a2E715a4c71e600e31F6E](https://fraxscan.com/address/0x5eeE3091f747E60a045a2E715a4c71e600e31F6E#code) |
| `Zaps`      | [0xe61Fb97Ef6eBFBa12B36Ffd7be785c1F5A2DE66b](https://fraxscan.com/address/0xe61Fb97Ef6eBFBa12B36Ffd7be785c1F5A2DE66b#code) |


**:logos-polygon: Polygon**

| Contract Type | Contract Address |
| :---------: | :----------------: | 
| `Math`      | [0xd7E72f3615aa65b92A4DBdC211E296a35512988B](https://polygonscan.com//address/0xd7E72f3615aa65b92A4DBdC211E296a35512988B#code) |
| `Views`     | [0x20D1c021525C85D9617Ccc64D8f547d5f730118A](https://polygonscan.com/address/0x20D1c021525C85D9617Ccc64D8f547d5f730118A#code) |
| `Factory`   | [0x1764ee18e8B3ccA4787249Ceb249356192594585](https://polygonscan.com/address/0x1764ee18e8B3ccA4787249Ceb249356192594585#code) |
| `Plain AMM` | [0xe265FC390E9129b7E337Da23cD42E00C34Da2CE3](https://polygonscan.com/address/0xe265FC390E9129b7E337Da23cD42E00C34Da2CE3#code) |
| `Meta AMM`  | [0xa7b9d886A9a374A1C86DC52d2BA585c5CDFdac26](https://polygonscan.com/address/0xa7b9d886A9a374A1C86DC52d2BA585c5CDFdac26#code) |


**:logos-polygon: Polygon zk-EVM**

| Contract Type | Contract Address |
| :---------: | :----------------: | 
| `Math`      | [0xe265FC390E9129b7E337Da23cD42E00C34Da2CE3](https://zkevm.polygonscan.com/address/0xe265FC390E9129b7E337Da23cD42E00C34Da2CE3#code) |
| `Views`     | [0xa7b9d886A9a374A1C86DC52d2BA585c5CDFdac26](https://zkevm.polygonscan.com/address/0xa7b9d886A9a374A1C86DC52d2BA585c5CDFdac26#code) |
| `Factory`   | [0xd2002373543Ce3527023C75e7518C274A51ce712](https://zkevm.polygonscan.com/address/0xd2002373543Ce3527023C75e7518C274A51ce712#code) |
| `Plain AMM` | [0xf3A6aa40cf048a3960E9664847E9a7be025a390a](https://zkevm.polygonscan.com/address/0xf3A6aa40cf048a3960E9664847E9a7be025a390a#code) |
| `Meta AMM`  | [0x635742dCC8313DCf8c904206037d962c042EAfBd](https://zkevm.polygonscan.com/address/0x635742dCC8313DCf8c904206037d962c042EAfBd#code) |


**:logos-gnosis: Gnosis**

| Contract Type | Contract Address |
| :---------: | :----------------: | 
| `Math`      | [0xFAbC421e3368D158d802684A217a83c083c94CeB](https://gnosisscan.io/address/0xFAbC421e3368D158d802684A217a83c083c94CeB#code) |
| `Views`     | [0x33e72383472f77B0C6d8F791D1613C75aE2C5915](https://gnosisscan.io/address/0x33e72383472f77B0C6d8F791D1613C75aE2C5915#code) |
| `Factory`   | [0xbC0797015fcFc47d9C1856639CaE50D0e69FbEE8](https://gnosisscan.io/address/0xbC0797015fcFc47d9C1856639CaE50D0e69FbEE8#code) |
| `Plain AMM` | [0x3d6cb2f6dcf47cdd9c13e4e3beae9af041d8796a](https://gnosisscan.io/address/0x3d6cb2f6dcf47cdd9c13e4e3beae9af041d8796a#code) |
| `Meta AMM`  | [0xC1b393EfEF38140662b91441C6710Aa704973228](https://gnosisscan.io/address/0xC1b393EfEF38140662b91441C6710Aa704973228#code) |


**:logos-avalanche: Avalanche**

| Contract Type | Contract Address |
| :---------: | :----------------: | 
| `Math`      | [0xd7E72f3615aa65b92A4DBdC211E296a35512988B](https://snowscan.xyz/address/0xd7E72f3615aa65b92A4DBdC211E296a35512988B#code) |
| `Views`     | [0x8F7632122125699da7E22d465fa16EdE4f687Fa4](https://snowscan.xyz/address/0x8F7632122125699da7E22d465fa16EdE4f687Fa4#code) |
| `Factory`   | [0x1764ee18e8B3ccA4787249Ceb249356192594585](https://snowscan.xyz/address/0x1764ee18e8B3ccA4787249Ceb249356192594585#code) |
| `Plain AMM` | [0xe265FC390E9129b7E337Da23cD42E00C34Da2CE3](https://snowscan.xyz/address/0xe265FC390E9129b7E337Da23cD42E00C34Da2CE3#code) |
| `Meta AMM`  | [0xa7b9d886A9a374A1C86DC52d2BA585c5CDFdac26](https://snowscan.xyz/address/0xa7b9d886A9a374A1C86DC52d2BA585c5CDFdac26#code) |


**:logos-fantom: Fantom**

| Contract Type | Contract Address |
| :---------: | :----------------: | 
| `Math`      | [0xf3A6aa40cf048a3960E9664847E9a7be025a390a](https://ftmscan.com/address/0xf3A6aa40cf048a3960E9664847E9a7be025a390a#code) |
| `Views`     | [0x6A8cbed756804B16E05E741eDaBd5cB544AE21bf](https://ftmscan.com/address/0x6A8cbed756804B16E05E741eDaBd5cB544AE21bf#code) |
| `Factory`   | [0xe61Fb97Ef6eBFBa12B36Ffd7be785c1F5A2DE66b](https://ftmscan.com/address/0xe61Fb97Ef6eBFBa12B36Ffd7be785c1F5A2DE66b#code) |
| `Plain AMM` | [0x5702BDB1Ec244704E3cBBaAE11a0275aE5b07499](https://ftmscan.com/address/0x5702BDB1Ec244704E3cBBaAE11a0275aE5b07499#code) |
| `Meta AMM`  | [0x046207cB759F527b6c10C2D61DBaca45513685CC](https://ftmscan.com/address/0x046207cB759F527b6c10C2D61DBaca45513685CC#code) |


**:logos-bsc: Binance Smart Chain**

| Contract Type | Contract Address |
| :---------: | :----------------: | 
| `Math`      | [0x166c4084Ad2434E8F2425C64dabFE6875A0D45c5](https://bscscan.com/address/0x166c4084Ad2434E8F2425C64dabFE6875A0D45c5#code) |
| `Views`     | [0xFf02cBD91F57A778Bab7218DA562594a680B8B61](https://bscscan.com/address/0xFf02cBD91F57A778Bab7218DA562594a680B8B61#code) |
| `Factory`   | [0xd7E72f3615aa65b92A4DBdC211E296a35512988B](https://bscscan.com/address/0xd7E72f3615aa65b92A4DBdC211E296a35512988B#code) |
| `Plain AMM` | [0x505d666E4DD174DcDD7FA090ed95554486d2Be44](https://bscscan.com/address/0x505d666E4DD174DcDD7FA090ed95554486d2Be44#code) |
| `Meta AMM`  | [0x5a8C93EE12a8Df4455BA111647AdA41f29D5CfcC](https://bscscan.com/address/0x5a8C93EE12a8Df4455BA111647AdA41f29D5CfcC#code) |


**Linea**

| Contract Type | Contract Address |
| :---------: | :----------------: | 
| `Math`      | [0xbC0797015fcFc47d9C1856639CaE50D0e69FbEE8](https://lineascan.build/address/0xbC0797015fcFc47d9C1856639CaE50D0e69FbEE8#code) |
| `Views`     | [0x3E3B5F27bbf5CC967E074b70E9f4046e31663181](https://lineascan.build/address/0x3E3B5F27bbf5CC967E074b70E9f4046e31663181#code) |
| `Factory`   | [0x5eeE3091f747E60a045a2E715a4c71e600e31F6E](https://lineascan.build/address/0x5eeE3091f747E60a045a2E715a4c71e600e31F6E#code) |
| `Plain AMM` | [0xa7b9d886a9a374a1c86dc52d2ba585c5cdfdac26](https://lineascan.build/address/0xa7b9d886a9a374a1c86dc52d2ba585c5cdfdac26#code) |
| `Meta AMM`  | [0xf3a6aa40cf048a3960e9664847e9a7be025a390a](https://lineascan.build/address/0xf3a6aa40cf048a3960e9664847e9a7be025a390a#code) |


**:logos-scroll: Scroll**

| Contract Type | Contract Address |
| :---------: | :----------------: | 
| `Math`      | [0xbC0797015fcFc47d9C1856639CaE50D0e69FbEE8](https://scroll.l2scan.co/address/0xbC0797015fcFc47d9C1856639CaE50D0e69FbEE8) |
| `Views`     | [0x20D1c021525C85D9617Ccc64D8f547d5f730118A](https://scroll.l2scan.co/address/0x20D1c021525C85D9617Ccc64D8f547d5f730118A#code) |
| `Factory`   | [0x5eeE3091f747E60a045a2E715a4c71e600e31F6E](https://scroll.l2scan.co/address/0x5eeE3091f747E60a045a2E715a4c71e600e31F6E#code) |
| `Plain AMM`   | [0xa7b9d886A9a374A1C86DC52d2BA585c5CDFdac26](https://scroll.l2scan.co/address/0xa7b9d886A9a374A1C86DC52d2BA585c5CDFdac26#code) |
| `Meta AMM`   | [0xf3A6aa40cf048a3960E9664847E9a7be025a390a](https://scroll.l2scan.co/address/0xf3A6aa40cf048a3960E9664847E9a7be025a390a#code) |


**:logos-mantle: Mantle**

| Contract Type | Contract Address |
| :---------: | :----------------: | 
| `Math`      | [0x8b3EFBEfa6eD222077455d6f0DCdA3bF4f3F57A6](https://mantlescan.info/address/0x8b3EFBEfa6eD222077455d6f0DCdA3bF4f3F57A6#code-5000) |
| `Views`     | [0x166c4084Ad2434E8F2425C64dabFE6875A0D45c5](https://mantlescan.info/address/0x166c4084Ad2434E8F2425C64dabFE6875A0D45c5#code-5000) |
| `Factory`   | [0x5eeE3091f747E60a045a2E715a4c71e600e31F6E](https://mantlescan.info/address/0x5eeE3091f747E60a045a2E715a4c71e600e31F6E) |
| `Plain AMM` | [0x87FE17697D0f14A222e8bEf386a0860eCffDD617](https://mantlescan.info/address/0x87FE17697D0f14A222e8bEf386a0860eCffDD617) |
| `Meta AMM`  | [0x1764ee18e8B3ccA4787249Ceb249356192594585](https://mantlescan.info/address/0x1764ee18e8B3ccA4787249Ceb249356192594585) |


**:logos-celo: Celo**

| Contract Type | Contract Address |
| :---------: | :----------------: | 
| `Math`      | [0xd7E72f3615aa65b92A4DBdC211E296a35512988B](https://celoscan.io/address/0xd7E72f3615aa65b92A4DBdC211E296a35512988B#code) |
| `Views`     | [0x8F7632122125699da7E22d465fa16EdE4f687Fa4](https://celoscan.io/address/0x8F7632122125699da7E22d465fa16EdE4f687Fa4#code) |
| `Factory`   | [0x1764ee18e8B3ccA4787249Ceb249356192594585](https://celoscan.io/address/0x1764ee18e8B3ccA4787249Ceb249356192594585#code) |
| `Plain AMM`   | [0xe265FC390E9129b7E337Da23cD42E00C34Da2CE3](https://celoscan.io/address/0xe265FC390E9129b7E337Da23cD42E00C34Da2CE3#code) |
| `Meta AMM`   | [0xa7b9d886A9a374A1C86DC52d2BA585c5CDFdac26](https://celoscan.io/address/0xa7b9d886A9a374A1C86DC52d2BA585c5CDFdac26#code) |


**:logos-kava: Kava**

| Contract Type | Contract Address |
| :---------: | :----------------: | 
| `Math`      | [0xd7E72f3615aa65b92A4DBdC211E296a35512988B](https://kavascan.com/address/0xd7E72f3615aa65b92A4DBdC211E296a35512988B#contracts) |
| `Views`     | [0x20D1c021525C85D9617Ccc64D8f547d5f730118A](https://kavascan.com/address/0x20D1c021525C85D9617Ccc64D8f547d5f730118A#contracts) |
| `Factory`   | [0x1764ee18e8B3ccA4787249Ceb249356192594585](https://kavascan.com/address/0x1764ee18e8B3ccA4787249Ceb249356192594585#contracts) |
| `Plain AMM` | [0xe265FC390E9129b7E337Da23cD42E00C34Da2CE3](https://kavascan.com/address/0xe265FC390E9129b7E337Da23cD42E00C34Da2CE3#contracts) |
| `Meta AMM`  | [0xa7b9d886A9a374A1C86DC52d2BA585c5CDFdac26](https://kavascan.com/address/0xa7b9d886A9a374A1C86DC52d2BA585c5CDFdac26#contracts) |


**:logos-aurora: Aurora**

| Contract Type | Contract Address |
| :---------: | :----------------: | 
| `Math`      | [0xbC0797015fcFc47d9C1856639CaE50D0e69FbEE8](https://explorer.aurora.dev/address/0xbC0797015fcFc47d9C1856639CaE50D0e69FbEE8/contracts) |
| `Views`     | [0x20D1c021525C85D9617Ccc64D8f547d5f730118A](https://explorer.aurora.dev/address/0x20D1c021525C85D9617Ccc64D8f547d5f730118A/contracts) |
| `Factory`   | [0x5eeE3091f747E60a045a2E715a4c71e600e31F6E](https://explorer.aurora.dev/address/0x5eeE3091f747E60a045a2E715a4c71e600e31F6E/contracts) |
| `Plain AMM` | [0xa7b9d886A9a374A1C86DC52d2BA585c5CDFdac26](https://explorer.aurora.dev/address/0xa7b9d886A9a374A1C86DC52d2BA585c5CDFdac26/contracts) |
| `Meta AMM`  | [0xf3A6aa40cf048a3960E9664847E9a7be025a390a](https://explorer.aurora.dev/address/0xf3A6aa40cf048a3960E9664847E9a7be025a390a/contracts) |


**:logos-xlayer: X-Layer**

| Contract Type | Contract Address |
| :---------: | :----------------: | 
| `Math`      | [0x8b3efbefa6ed222077455d6f0dcda3bf4f3f57a6](https://www.oklink.com/xlayer/address/0x8b3efbefa6ed222077455d6f0dcda3bf4f3f57a6/contract) |
| `Views`     | [0x506f594ceb4e33f5161139bae3ee911014df9f7f](https://www.oklink.com/xlayer/address/0x506f594ceb4e33f5161139bae3ee911014df9f7f/contract) |
| `Factory`   | [0x5eee3091f747e60a045a2e715a4c71e600e31f6e](https://www.oklink.com/xlayer/address/0x5eee3091f747e60a045a2e715a4c71e600e31f6e/contract) |
| `Plain AMM` | [0x87fe17697d0f14a222e8bef386a0860ecffdd617](https://www.oklink.com/xlayer/address/0x87fe17697d0f14a222e8bef386a0860ecffdd617/contract) |
| `Meta AMM`  | [0x1764ee18e8b3cca4787249ceb249356192594585](https://www.oklink.com/xlayer/address/0x1764ee18e8b3cca4787249ceb249356192594585/contract) |


**:logos-zksync: zk-Sync**

| Contract Type | Contract Address |
| :---------: | :----------------: | 
| `Math`      | *soon*             |
| `Views`     | *soon*             |
| `Factory`   | *soon*             |
| `Plain AMM` | *soon*             |
| `Meta AMM`  | *soon*             |


**:logos-tron: Tron**

| Contract Type | Contract Address |
| :---------: | :----------------: | 
| `Math`      | *soon*             |
| `Views`     | *soon*             |
| `Factory`   | *soon*             |
| `Plain AMM` | *soon*             |
| `Meta AMM`  | *soon*             |


---


## **TwoCrypto-NG**

!!!deploy "Source Code"
    Source code available on [GitHub](https://github.com/curvefi/twocrypto-ng).

!!!warning "Implementations"
    Every Factory contract has pool implementations. The Factory on Ethereum has an additional gauge implementation. **Implementation contracts are upgradable.** They can be either replaced or additional implementation contracts can be set. Therefore, please **always make sure to check the most recent ones**.

    *To query the factory-specific implementations:*

    ```shell
    >>> Factory.pool_implementation(0)
    '0x04Fd6beC7D45EFA99a27D29FB94b55c56dD07223'
    >>> Factory.gauge_implementation() # ethereum mainnet only! 
    '0x38D9BdA812da2C68dFC6aDE85A7F7a54E77F8325'
    ```


**:logos-ethereum: Ethereum Mainnet**

| Contract Type | Contract Address |
| :---------: | :----------------: |  
| `Math`      | [0x2005995a71243be9FB995DaB4742327dc76564Df](https://etherscan.io/address/0x2005995a71243be9FB995DaB4742327dc76564Df#code) |
| `Views`     | [0x07CdEBF81977E111B08C126DEFA07818d0045b80](https://etherscan.io/address/0x07CdEBF81977E111B08C126DEFA07818d0045b80#code) |
| `Factory`   | [0x98EE851a00abeE0d95D08cF4CA2BdCE32aeaAF7F](https://etherscan.io/address/0x98EE851a00abeE0d95D08cF4CA2BdCE32aeaAF7F#code) |
| `Gauge`     | [0x38D9BdA812da2C68dFC6aDE85A7F7a54E77F8325](https://etherscan.io/address/0x38D9BdA812da2C68dFC6aDE85A7F7a54E77F8325#code) |
| `AMM`       | [0x04Fd6beC7D45EFA99a27D29FB94b55c56dD07223](https://etherscan.io/address/0x04Fd6beC7D45EFA99a27D29FB94b55c56dD07223#code) |


**:logos-ethereum: Ethereum Sepolia**

| Contract Type | Contract Address |
| :---------: | :----------------: |  
| `Math`      | [0x2005995a71243be9FB995DaB4742327dc76564Df](https://sepolia.etherscan.io/address/0x2005995a71243be9FB995DaB4742327dc76564Df#code) |
| `Views`     | [0x07CdEBF81977E111B08C126DEFA07818d0045b80](https://sepolia.etherscan.io/address/0x07CdEBF81977E111B08C126DEFA07818d0045b80#code) |
| `Factory`   | [0x98EE851a00abeE0d95D08cF4CA2BdCE32aeaAF7F](https://sepolia.etherscan.io/address/0x98EE851a00abeE0d95D08cF4CA2BdCE32aeaAF7F#code) |
| `AMM`       | [0x04Fd6beC7D45EFA99a27D29FB94b55c56dD07223](https://sepolia.etherscan.io/address/0x04Fd6beC7D45EFA99a27D29FB94b55c56dD07223#code) |


**:logos-arbitrum: Arbitrum**

| Contract Type | Contract Address |
| :---------: | :----------------: |  
| `Math`      | [0x2005995a71243be9FB995DaB4742327dc76564Df](https://arbiscan.io/address/0x2005995a71243be9FB995DaB4742327dc76564Df#code) |
| `Views`     | [0x07CdEBF81977E111B08C126DEFA07818d0045b80](https://arbiscan.io/address/0x07CdEBF81977E111B08C126DEFA07818d0045b80#code) |
| `Factory`   | [0x98EE851a00abeE0d95D08cF4CA2BdCE32aeaAF7F](https://arbiscan.io/address/0x98EE851a00abeE0d95D08cF4CA2BdCE32aeaAF7F#code) |
| `AMM`       | [0x04Fd6beC7D45EFA99a27D29FB94b55c56dD07223](https://arbiscan.io/address/0x04Fd6beC7D45EFA99a27D29FB94b55c56dD07223#code) |


**:logos-optimism: Optimism**

| Contract Type | Contract Address |
| :---------: | :----------------: |  
| `Math`      | [0x2005995a71243be9FB995DaB4742327dc76564Df](https://optimistic.etherscan.io/address/0x2005995a71243be9FB995DaB4742327dc76564Df#code) |
| `Views`     | [0x07CdEBF81977E111B08C126DEFA07818d0045b80](https://optimistic.etherscan.io/address/0x07CdEBF81977E111B08C126DEFA07818d0045b80#code) |
| `Factory`   | [0x98EE851a00abeE0d95D08cF4CA2BdCE32aeaAF7F](https://optimistic.etherscan.io/address/0x98EE851a00abeE0d95D08cF4CA2BdCE32aeaAF7F#code) |
| `AMM`       | [0x04Fd6beC7D45EFA99a27D29FB94b55c56dD07223](https://optimistic.etherscan.io/address/0x04Fd6beC7D45EFA99a27D29FB94b55c56dD07223#code) |


**:logos-base: Base**

| Contract Type | Contract Address |
| :---------: | :----------------: |  
| `Math`      | [0x64379C265Fc6595065D7d835AAaa731c0584dB80](https://basescan.org/address/0x64379C265Fc6595065D7d835AAaa731c0584dB80#code) |
| `Views`     | [0xd3B17f862956464ae4403cCF829CE69199856e1e](https://basescan.org/address/0xd3B17f862956464ae4403cCF829CE69199856e1e#code) |
| `Factory`   | [0xc9Fe0C63Af9A39402e8a5514f9c43Af0322b665F](https://basescan.org/address/0xc9Fe0C63Af9A39402e8a5514f9c43Af0322b665F#code) |
| `AMM`       | [0x1A83348F9cCFD3Fe1A8C0adBa580Ac4e267Fe495](https://basescan.org/address/0x1A83348F9cCFD3Fe1A8C0adBa580Ac4e267Fe495#code) |


**:logos-fraxtal: Fraxtal**

| Contract Type | Contract Address |
| :---------: | :----------------: |  
| `Math`      | [0x2005995a71243be9FB995DaB4742327dc76564Df](https://fraxscan.com/address/0x2005995a71243be9FB995DaB4742327dc76564Df#code) |
| `Views`     | [0x07CdEBF81977E111B08C126DEFA07818d0045b80](https://fraxscan.com/address/0x07CdEBF81977E111B08C126DEFA07818d0045b80#code) |
| `Factory`   | [0x98EE851a00abeE0d95D08cF4CA2BdCE32aeaAF7F](https://fraxscan.com/address/0x98EE851a00abeE0d95D08cF4CA2BdCE32aeaAF7F#code) |
| `AMM`       | [0x04Fd6beC7D45EFA99a27D29FB94b55c56dD07223](https://fraxscan.com/address/0x04Fd6beC7D45EFA99a27D29FB94b55c56dD07223#code) |


**:logos-polygon: Polygon**

| Contract Type | Contract Address |
| :---------: | :----------------: |  
| `Math`      | [0x2005995a71243be9FB995DaB4742327dc76564Df](https://polygonscan.com//address/0x2005995a71243be9FB995DaB4742327dc76564Df#code) |
| `Views`     | [0x07CdEBF81977E111B08C126DEFA07818d0045b80](https://polygonscan.com/address/0x07CdEBF81977E111B08C126DEFA07818d0045b80#code) |
| `Factory`   | [0x98EE851a00abeE0d95D08cF4CA2BdCE32aeaAF7F](https://polygonscan.com/address/0x98EE851a00abeE0d95D08cF4CA2BdCE32aeaAF7F#code) |
| `AMM`       | [0x04Fd6beC7D45EFA99a27D29FB94b55c56dD07223](https://polygonscan.com/address/0x04Fd6beC7D45EFA99a27D29FB94b55c56dD07223#code) |


**:logos-polygon: Polygon zk-EVM**

| Contract Type | Contract Address |
| :---------: | :----------------: |  
| `Math`      | [0x2005995a71243be9FB995DaB4742327dc76564Df](https://zkevm.polygonscan.com/address/0x2005995a71243be9FB995DaB4742327dc76564Df#code) |
| `Views`     | [0x07CdEBF81977E111B08C126DEFA07818d0045b80](https://zkevm.polygonscan.com/address/0x07CdEBF81977E111B08C126DEFA07818d0045b80#code) |
| `Factory`   | [0x98EE851a00abeE0d95D08cF4CA2BdCE32aeaAF7F](https://zkevm.polygonscan.com/address/0x98EE851a00abeE0d95D08cF4CA2BdCE32aeaAF7F#code) |
| `AMM`       | [0x04Fd6beC7D45EFA99a27D29FB94b55c56dD07223](https://zkevm.polygonscan.com/address/0x04Fd6beC7D45EFA99a27D29FB94b55c56dD07223#code) |


**:logos-gnosis: Gnosis**

| Contract Type | Contract Address |
| :---------: | :----------------: |  
| `Math`      | [0x2005995a71243be9FB995DaB4742327dc76564Df](https://gnosisscan.io/address/0x2005995a71243be9FB995DaB4742327dc76564Df#code) |
| `Views`     | [0x07CdEBF81977E111B08C126DEFA07818d0045b80](https://gnosisscan.io/address/0x07CdEBF81977E111B08C126DEFA07818d0045b80#code) |
| `Factory`   | [0x98EE851a00abeE0d95D08cF4CA2BdCE32aeaAF7F](https://gnosisscan.io/address/0x98EE851a00abeE0d95D08cF4CA2BdCE32aeaAF7F#code) |
| `AMM`       | [0x04Fd6beC7D45EFA99a27D29FB94b55c56dD07223](https://gnosisscan.io/address/0x04Fd6beC7D45EFA99a27D29FB94b55c56dD07223#code) |


**:logos-avalanche: Avalanche**

| Contract Type | Contract Address |
| :---------: | :----------------: |  
| `Math`      | [0x2005995a71243be9FB995DaB4742327dc76564Df](https://snowscan.xyz/address/0x2005995a71243be9FB995DaB4742327dc76564Df#code) |
| `Views`     | [0x07CdEBF81977E111B08C126DEFA07818d0045b80](https://snowscan.xyz/address/0x07CdEBF81977E111B08C126DEFA07818d0045b80#code) |
| `Factory`   | [0x98EE851a00abeE0d95D08cF4CA2BdCE32aeaAF7F](https://snowscan.xyz/address/0x98EE851a00abeE0d95D08cF4CA2BdCE32aeaAF7F#code) |
| `AMM`       | [0x04Fd6beC7D45EFA99a27D29FB94b55c56dD07223](https://snowscan.xyz/address/0x04Fd6beC7D45EFA99a27D29FB94b55c56dD07223#code) |


**:logos-fantom: Fantom**

| Contract Type | Contract Address |
| :---------: | :----------------: |  
| `Math`      | [0x2005995a71243be9FB995DaB4742327dc76564Df](https://ftmscan.com/address/0x2005995a71243be9FB995DaB4742327dc76564Df#code) |
| `Views`     | [0x07CdEBF81977E111B08C126DEFA07818d0045b80](https://ftmscan.com/address/0x07CdEBF81977E111B08C126DEFA07818d0045b80#code) |
| `Factory`   | [0x98EE851a00abeE0d95D08cF4CA2BdCE32aeaAF7F](https://ftmscan.com/address/0x98EE851a00abeE0d95D08cF4CA2BdCE32aeaAF7F#code) |
| `AMM`       | [0x04Fd6beC7D45EFA99a27D29FB94b55c56dD07223](https://ftmscan.com/address/0x04Fd6beC7D45EFA99a27D29FB94b55c56dD07223#code) |


**:logos-bsc: Binance Smart Chain**

| Contract Type | Contract Address |
| :---------: | :----------------: |  
| `Math`      | [0x2005995a71243be9FB995DaB4742327dc76564Df](https://bscscan.com/address/0x2005995a71243be9FB995DaB4742327dc76564Df#code) |
| `Views`     | [0x07CdEBF81977E111B08C126DEFA07818d0045b80](https://bscscan.com/address/0x07CdEBF81977E111B08C126DEFA07818d0045b80#code) |
| `Factory`   | [0x98EE851a00abeE0d95D08cF4CA2BdCE32aeaAF7F](https://bscscan.com/address/0x98EE851a00abeE0d95D08cF4CA2BdCE32aeaAF7F#code) |
| `AMM`       | [0x04Fd6beC7D45EFA99a27D29FB94b55c56dD07223](https://bscscan.com/address/0x04Fd6beC7D45EFA99a27D29FB94b55c56dD07223#code) |



**Linea**

| Contract Type | Contract Address |
| :---------: | :----------------: |  
| `Math`      | [0x2005995a71243be9FB995DaB4742327dc76564Df](https://lineascan.build/address/0x2005995a71243be9FB995DaB4742327dc76564Df#code) |
| `Views`     | [0x07CdEBF81977E111B08C126DEFA07818d0045b80](https://lineascan.build/address/0x07CdEBF81977E111B08C126DEFA07818d0045b80#code) |
| `Factory`   | [0x98EE851a00abeE0d95D08cF4CA2BdCE32aeaAF7F](https://lineascan.build/address/0x98EE851a00abeE0d95D08cF4CA2BdCE32aeaAF7F#code) |
| `AMM`       | [0x04Fd6beC7D45EFA99a27D29FB94b55c56dD07223](https://lineascan.build/address/0x04Fd6beC7D45EFA99a27D29FB94b55c56dD07223#code) |


**:logos-scroll: Scroll**

| Contract Type | Contract Address |
| :---------: | :----------------: |  
| `Math`      | [0x2005995a71243be9FB995DaB4742327dc76564Df](https://scroll.l2scan.co/address/0x2005995a71243be9FB995DaB4742327dc76564Df) |
| `Views`     | [0x07CdEBF81977E111B08C126DEFA07818d0045b80](https://scroll.l2scan.co/address/0x07CdEBF81977E111B08C126DEFA07818d0045b80#code) |
| `Factory`   | [0x98EE851a00abeE0d95D08cF4CA2BdCE32aeaAF7F](https://scroll.l2scan.co/address/0x98EE851a00abeE0d95D08cF4CA2BdCE32aeaAF7F#code) |
| `AMM`       | [0x04Fd6beC7D45EFA99a27D29FB94b55c56dD07223](https://scroll.l2scan.co/address/0x04Fd6beC7D45EFA99a27D29FB94b55c56dD07223#code) |


**:logos-mantle: Mantle**

| Contract Type | Contract Address |
| :---------: | :----------------: |  
| `Math`      | [0x2005995a71243be9FB995DaB4742327dc76564Df](https://mantlescan.info/address/0x2005995a71243be9FB995DaB4742327dc76564Df) |
| `Views`     | [0x07CdEBF81977E111B08C126DEFA07818d0045b80](https://mantlescan.info/address/0x07CdEBF81977E111B08C126DEFA07818d0045b80) |
| `Factory`   | [0x98EE851a00abeE0d95D08cF4CA2BdCE32aeaAF7F](https://mantlescan.info/address/0x98EE851a00abeE0d95D08cF4CA2BdCE32aeaAF7F) |
| `AMM`       | [0x04Fd6beC7D45EFA99a27D29FB94b55c56dD07223](https://mantlescan.info/address/0x04Fd6beC7D45EFA99a27D29FB94b55c56dD07223) |


**:logos-celo: Celo**

| Contract Type | Contract Address |
| :---------: | :----------------: |  
| `Math`      | [0x2005995a71243be9FB995DaB4742327dc76564Df](https://celoscan.io/address/0x2005995a71243be9FB995DaB4742327dc76564Df#code) |
| `Views`     | [0x07CdEBF81977E111B08C126DEFA07818d0045b80](https://celoscan.io/address/0x07CdEBF81977E111B08C126DEFA07818d0045b80#code) |
| `Factory`   | [0x98EE851a00abeE0d95D08cF4CA2BdCE32aeaAF7F](https://celoscan.io/address/0x98EE851a00abeE0d95D08cF4CA2BdCE32aeaAF7F#code) |
| `AMM`       | [0x04Fd6beC7D45EFA99a27D29FB94b55c56dD07223](https://celoscan.io/address/0x04Fd6beC7D45EFA99a27D29FB94b55c56dD07223#code) |


**:logos-kava: Kava**

| Contract Type | Contract Address |
| :---------: | :----------------: |  
| `Math`      | [0x7Ca46A636b02D4aBC66883D7FF164bDE506DC66a](https://kavascan.com/address/0x7Ca46A636b02D4aBC66883D7FF164bDE506DC66a#contracts) |
| `Views`     | [0x0C9D8c7e486e822C29488Ff51BFf0167B4650953](https://kavascan.com/address/0x0C9D8c7e486e822C29488Ff51BFf0167B4650953#contracts) |
| `Factory`   | [0xd3B17f862956464ae4403cCF829CE69199856e1e](https://kavascan.com/address/0xd3B17f862956464ae4403cCF829CE69199856e1e#contracts) |
| `AMM`       | [0x64379C265Fc6595065D7d835AAaa731c0584dB80](https://kavascan.com/address/0x64379C265Fc6595065D7d835AAaa731c0584dB80#contracts) |


**:logos-aurora: Aurora**

| Contract Type | Contract Address |
| :---------: | :----------------: |  
| `Math`      | [0x2005995a71243be9FB995DaB4742327dc76564Df](https://explorer.aurora.dev/address/0x2005995a71243be9FB995DaB4742327dc76564Df/contracts) |
| `Views`     | [0x07CdEBF81977E111B08C126DEFA07818d0045b80](https://explorer.aurora.dev/address/0x07CdEBF81977E111B08C126DEFA07818d0045b80/contracts) |
| `Factory`   | [0x98EE851a00abeE0d95D08cF4CA2BdCE32aeaAF7F](https://explorer.aurora.dev/address/0x98EE851a00abeE0d95D08cF4CA2BdCE32aeaAF7F/contracts) |
| `AMM`       | [0x04Fd6beC7D45EFA99a27D29FB94b55c56dD07223](https://explorer.aurora.dev/address/0x04Fd6beC7D45EFA99a27D29FB94b55c56dD07223/contracts) |


**:logos-xlayer: X-Layer**

| Contract Type | Contract Address |
| :---------: | :----------------: | 
| `Math`      | [0x505d666e4dd174dcdd7fa090ed95554486d2be44](https://www.oklink.com/xlayer/address/0x505d666e4dd174dcdd7fa090ed95554486d2be44/contract) |
| `Views`     | [0x5a8c93ee12a8df4455ba111647ada41f29d5cfcc](https://www.oklink.com/xlayer/address/0x5a8c93ee12a8df4455ba111647ada41f29d5cfcc/contract) |
| `Factory`   | [0x0c59d36b23f809f8b6c7cb4c8c590a0ac103baef](https://www.oklink.com/xlayer/address/0x0c59d36b23f809f8b6c7cb4c8c590a0ac103baef/contract) |
| `AMM` | [0xfabc421e3368d158d802684a217a83c083c94ceb](https://www.oklink.com/xlayer/address/0xfabc421e3368d158d802684a217a83c083c94ceb/contract) |


**:logos-zksync: zk-Sync**

| Contract Type | Contract Address |
| :---------: | :----------------: |  
| `Math`      | *soon*             |
| `Views`     | *soon*             |
| `Factory`   | *soon*             |
| `AMM`       | *soon*             |


**:logos-tron: Tron**

| Contract Type | Contract Address |
| :---------: | :----------------: |  
| `Math`      | *soon*             |
| `Views`     | *soon*             |
| `Factory`   | *soon*             |
| `AMM`       | *soon*             |


---


## **Tricrypto-NG**

!!!deploy "Source Code"
    Source code is available on [GitHub](https://github.com/curvefi/tricrypto-ng).

!!!warning "Implementations"
    Every Factory contract has pool, math and views implementations. The Factory on Ethereum has an additional gauge implementation. **Implementation contracts are upgradable.** They can be either replaced or additional implementation contracts can be set. Therefore, please **always make sure to check the most recent ones**.

    Additionally, there are implementations that have **native transfers enabled/disabled**. When disabled, it's not possible to use native ETH. Instead, wrapped ETH (wETH) must be used.

    *To query the factory-specific implementations:*

    ```shell
    >>> Factory.pool_implementation(0)
    '0x66442B0C5260B92cAa9c234ECf2408CBf6b19a6f'
    >>> Factory.views_implementation()
    '0x064253915b8449fdEFac2c4A74aA9fdF56691a31'
    >>> Factory.math_implementation()
    '0xcBFf3004a20dBfE2731543AA38599A526e0fD6eE'
    >>> Factory.gauge_implementation() # ethereum mainnet only! 
    '0x5fC124a161d888893529f67580ef94C2784e9233'
    ```

**:logos-ethereum: Ethereum Mainnet**

| Contract Type | Contract Address |
| :---------: | :----------------: | 
| `Math`      | [0xcBFf3004a20dBfE2731543AA38599A526e0fD6eE](https://etherscan.io/address/0xcBFf3004a20dBfE2731543AA38599A526e0fD6eE) |
| `Views`     | [0x064253915b8449fdEFac2c4A74aA9fdF56691a31](https://etherscan.io/address/0x064253915b8449fdEFac2c4A74aA9fdF56691a31) |
| `Factory`   | [0x0c0e5f2fF0ff18a3be9b835635039256dC4B4963](https://etherscan.io/address/0x0c0e5f2fF0ff18a3be9b835635039256dC4B4963) |
| `Gauge`     | [0x5fC124a161d888893529f67580ef94C2784e9233](https://etherscan.io/address/0x5fC124a161d888893529f67580ef94C2784e9233) |
| `AMM native enabled` | [0x66442B0C5260B92cAa9c234ECf2408CBf6b19a6f](https://etherscan.io/address/0x66442B0C5260B92cAa9c234ECf2408CBf6b19a6f) |


**:logos-ethereum: Ethereum Sepolia**

| Contract Type | Contract Address |
| :---------: | :----------------: | 
| `Math`      | [0x550574E33b81C45D3D69250b46Ae30c7bC40d330](https://sepolia.etherscan.io/address/0x550574E33b81C45D3D69250b46Ae30c7bC40d330#code) |
| `Views`     | [0x59AfCD3e931018dc493AA1d833B11bb5A0744906](https://sepolia.etherscan.io/address/0x59AfCD3e931018dc493AA1d833B11bb5A0744906#code) |
| `Factory`   | [0x4b00E8c997AeBACeEf6B8c6F89eE2bf99b2CA846](https://sepolia.etherscan.io/address/0x4b00E8c997AeBACeEf6B8c6F89eE2bf99b2CA846#code) |
| `AMM native disable` | [0x3BbA971980A721C7A33cEF62cE01c0d744F26e95](https://sepolia.etherscan.io/address/0x3BbA971980A721C7A33cEF62cE01c0d744F26e95#code) |
| `AMM native enabled` | [0xc9621394A73A071d8084CB9a15b04F182a7C9634](https://sepolia.etherscan.io/address/0xc9621394A73A071d8084CB9a15b04F182a7C9634#code) |


**:logos-arbitrum: Arbitrum**

| Contract Type | Contract Address |
| :---------: | :----------------: | 
| `Math`      | [0x604388Bb1159AFd21eB5191cE22b4DeCdEE2Ae22](https://arbiscan.io/address/0x604388Bb1159AFd21eB5191cE22b4DeCdEE2Ae22) |
| `Views`     | [0x06452f9c013fc37169B57Eab8F50A7A48c9198A3](https://arbiscan.io/address/0x06452f9c013fc37169B57Eab8F50A7A48c9198A3) |
| `Factory`   | [0xbC0797015fcFc47d9C1856639CaE50D0e69FbEE8](https://arbiscan.io/address/0xbC0797015fcFc47d9C1856639CaE50D0e69FbEE8) |
| `AMM native disable` | [0x1f7C86AffE5bCF7a1D74a8c8E2ef9E03BF31c1BD](https://arbiscan.io/address/0x1f7C86AffE5bCF7a1D74a8c8E2ef9E03BF31c1BD) |
| `AMM native enabled` | [0xd7E72f3615aa65b92A4DBdC211E296a35512988B](https://arbiscan.io/address/0xd7E72f3615aa65b92A4DBdC211E296a35512988B) |


**:logos-optimism: Optimism**

| Contract Type | Contract Address |
| :---------: | :----------------: | 
| `Math`      | [0x19bd1AB34d6ABB584b9C1D5519093bfAA7f6c7d2](https://optimistic.etherscan.io/address/0x19bd1AB34d6ABB584b9C1D5519093bfAA7f6c7d2#code) |
| `Views`     | [0x6A8cbed756804B16E05E741eDaBd5cB544AE21bf](https://optimistic.etherscan.io/address/0x6A8cbed756804B16E05E741eDaBd5cB544AE21bf#code) |
| `Factory`   | [0xc6C09471Ee39C7E30a067952FcC89c8922f9Ab53](https://optimistic.etherscan.io/address/0xc6C09471Ee39C7E30a067952FcC89c8922f9Ab53#code) |
| `AMM native disable` | [0x0458ea5F4CD00E873264Be2031Ceb8f9d9b3116c](https://optimistic.etherscan.io/address/0x0458ea5F4CD00E873264Be2031Ceb8f9d9b3116c#code) |
| `AMM native enabled` | [0x1FE2a06c8bd81AE65FD1C5036451890b37976369](https://optimistic.etherscan.io/address/0x1FE2a06c8bd81AE65FD1C5036451890b37976369#code) |



**:logos-base: Base**

| Contract Type | Contract Address |
| :---------: | :----------------: | 
| `Math`      | [0x5373E1B9f2781099f6796DFe5D68DE59ac2F18E3](https://basescan.org/address/0x5373E1B9f2781099f6796DFe5D68DE59ac2F18E3#code) |
| `Views`     | [0x05d4E2Ed7216A204e5FB4e3F5187eCfaa5eF3Ef7](https://basescan.org/address/0x05d4E2Ed7216A204e5FB4e3F5187eCfaa5eF3Ef7#code) |
| `Factory`   | [0xA5961898870943c68037F6848d2D866Ed2016bcB](https://basescan.org/address/0xA5961898870943c68037F6848d2D866Ed2016bcB#code) |
| `AMM native disable` | [0x0c59d36b23f809f8b6C7cb4c8C590a0AC103baEf](https://basescan.org/address/0x0c59d36b23f809f8b6C7cb4c8C590a0AC103baEf#code) |
| `AMM native enabled` | [0xa274c88e09fDF1798a7517096557e6c1bEa1f65A](https://basescan.org/address/0xa274c88e09fDF1798a7517096557e6c1bEa1f65A#code) |


**:logos-fraxtal: Fraxtal**

| Contract Type | Contract Address |
| :---------: | :----------------: | 
| `Math`      | [0x0C9D8c7e486e822C29488Ff51BFf0167B4650953](https://fraxscan.com/address/0x0C9D8c7e486e822C29488Ff51BFf0167B4650953#code) |
| `Views`     | [0x64379C265Fc6595065D7d835AAaa731c0584dB80](https://fraxscan.com/address/0x64379C265Fc6595065D7d835AAaa731c0584dB80#code) |
| `Factory`   | [0xc9Fe0C63Af9A39402e8a5514f9c43Af0322b665F](https://fraxscan.com/address/0xc9Fe0C63Af9A39402e8a5514f9c43Af0322b665F#code) |
| `AMM native disable` | [0x1A83348F9cCFD3Fe1A8C0adBa580Ac4e267Fe495](https://fraxscan.com/address/0x1A83348F9cCFD3Fe1A8C0adBa580Ac4e267Fe495#code) |
| `AMM native enabled` | [0xd3b17f862956464ae4403ccf829ce69199856e1e](https://fraxscan.com/address/0xd3b17f862956464ae4403ccf829ce69199856e1e#code) |


**:logos-polygon: Polygon**

| Contract Type | Contract Address |
| :---------: | :----------------: | 
| `Math`      | [0x5a8C93EE12a8Df4455BA111647AdA41f29D5CfcC](https://polygonscan.com//address/0x5a8C93EE12a8Df4455BA111647AdA41f29D5CfcC#code) |
| `Views`     | [0xFAbC421e3368D158d802684A217a83c083c94CeB](https://polygonscan.com/address/0xFAbC421e3368D158d802684A217a83c083c94CeB#code) |
| `Factory`   | [0xC1b393EfEF38140662b91441C6710Aa704973228](https://polygonscan.com/address/0xC1b393EfEF38140662b91441C6710Aa704973228#code) |
| `AMM native disable` | [0x3d6cB2F6DcF47CDd9C13E4e3beAe9af041d8796a](https://polygonscan.com/address/0x3d6cB2F6DcF47CDd9C13E4e3beAe9af041d8796a#code) |
| `AMM native enabled` | [0x0c59d36b23f809f8b6C7cb4c8C590a0AC103baEf](https://polygonscan.com/address/0x0c59d36b23f809f8b6C7cb4c8C590a0AC103baEf#code) |


**:logos-polygon: Polygon zk-EVM**

| Contract Type | Contract Address |
| :---------: | :----------------: | 
| `Math`      | [0xFAbC421e3368D158d802684A217a83c083c94CeB](https://zkevm.polygonscan.com/address/0xFAbC421e3368D158d802684A217a83c083c94CeB#code) |
| `Views`     | [0x0c59d36b23f809f8b6C7cb4c8C590a0AC103baEf](https://zkevm.polygonscan.com/address/0x0c59d36b23f809f8b6C7cb4c8C590a0AC103baEf#code) |
| `Factory`   | [0x76303e4fDcA0AbF28aB3ee42Ce086E6503431F1D](https://zkevm.polygonscan.com/address/0x76303e4fDcA0AbF28aB3ee42Ce086E6503431F1D#code) |
| `AMM native disable` | [0xC1b393EfEF38140662b91441C6710Aa704973228](https://zkevm.polygonscan.com/address/0xC1b393EfEF38140662b91441C6710Aa704973228#code) |
| `AMM native enabled` | [0x3d6cB2F6DcF47CDd9C13E4e3beAe9af041d8796a](https://zkevm.polygonscan.com/address/0x3d6cB2F6DcF47CDd9C13E4e3beAe9af041d8796a#code) |


**:logos-gnosis: Gnosis**

| Contract Type | Contract Address |
| :---------: | :----------------: | 
| `Math`      | [0xff02cbd91f57a778bab7218da562594a680b8b61](https://gnosisscan.io/address/0xff02cbd91f57a778bab7218da562594a680b8b61#code) |
| `Views`     | [0xe548590f9fAe7a23EA6501b144B0D58b74Fc4B53](https://gnosisscan.io/address/0xe548590f9fAe7a23EA6501b144B0D58b74Fc4B53#code) |
| `Factory`   | [0xb47988ad49dce8d909c6f9cf7b26caf04e1445c8](https://gnosisscan.io/address/0xb47988ad49dce8d909c6f9cf7b26caf04e1445c8#code) |
| `AMM native disable` | [0x3f445D38E820c010a7A6E33c5F80cBEBE6930f61](https://gnosisscan.io/address/0x3f445D38E820c010a7A6E33c5F80cBEBE6930f61#code) |
| `AMM native enabled` | [0xa54f3c1dfa5f7dbf2564829d14b3b74a65d26ae2](https://gnosisscan.io/address/0xa54f3c1dfa5f7dbf2564829d14b3b74a65d26ae2#code) |


**:logos-avalanche: Avalanche**

| Contract Type | Contract Address |
| :---------: | :----------------: |  
| `Math`      | [0x505d666E4DD174DcDD7FA090ed95554486d2Be44](https://snowscan.xyz/address/0x505d666E4DD174DcDD7FA090ed95554486d2Be44#code) |
| `Views`     | [0x5a8C93EE12a8Df4455BA111647AdA41f29D5CfcC](https://snowscan.xyz/address/0x5a8C93EE12a8Df4455BA111647AdA41f29D5CfcC#code) |
| `Factory`   | [0x3d6cB2F6DcF47CDd9C13E4e3beAe9af041d8796a](https://snowscan.xyz/address/0x3d6cB2F6DcF47CDd9C13E4e3beAe9af041d8796a#code) |
| `AMM native disable` | [0x0c59d36b23f809f8b6C7cb4c8C590a0AC103baEf](https://snowscan.xyz/address/0x0c59d36b23f809f8b6C7cb4c8C590a0AC103baEf#code) |
| `AMM native enabled` | [0xFAbC421e3368D158d802684A217a83c083c94CeB](https://snowscan.xyz/address/0xFAbC421e3368D158d802684A217a83c083c94CeB#code) |


**:logos-fantom: Fantom**

| Contract Type | Contract Address |
| :---------: | :----------------: | 
| `Math`      | [0x3d6cB2F6DcF47CDd9C13E4e3beAe9af041d8796a](https://ftmscan.com/address/0x3d6cB2F6DcF47CDd9C13E4e3beAe9af041d8796a#code) |
| `Views`     | [0xC1b393EfEF38140662b91441C6710Aa704973228](https://ftmscan.com/address/0xC1b393EfEF38140662b91441C6710Aa704973228#code) |
| `Factory`   | [0x9AF14D26075f142eb3F292D5065EB3faa646167b](https://ftmscan.com/address/0x9AF14D26075f142eb3F292D5065EB3faa646167b#code) |
| `AMM native disable` | [0xd125E7a0cEddF89c6473412d85835450897be6Dc](https://ftmscan.com/address/0xd125E7a0cEddF89c6473412d85835450897be6Dc#code) |
| `AMM native enabled` | [0x76303e4fDcA0AbF28aB3ee42Ce086E6503431F1D](https://ftmscan.com/address/0x76303e4fDcA0AbF28aB3ee42Ce086E6503431F1D#code) |



**:logos-bsc: Binance Smart Chain**

| Contract Type | Contract Address |
| :---------: | :----------------: | 
| `Math`      | [0x0cE651Df1418a1fBA98517483102E042533Ade05](https://bscscan.com/address/0x0cE651Df1418a1fBA98517483102E042533Ade05#code) |
| `Views`     | [0x645E12f3cf5504C8a08e01706e79d3D0f32EcE15](https://bscscan.com/address/0x645E12f3cf5504C8a08e01706e79d3D0f32EcE15#code) |
| `Factory`   | [0xc55837710bc500F1E3c7bb9dd1d51F7c5647E657](https://bscscan.com/address/0xc55837710bc500F1E3c7bb9dd1d51F7c5647E657#code) |
| `AMM native disable` | [0x6A8cbed756804B16E05E741eDaBd5cB544AE21bf](https://bscscan.com/address/0x6A8cbed756804B16E05E741eDaBd5cB544AE21bf#code) |
| `AMM native enabled` | [0xBff334F8D5912AC5c4f2c590A2396d1C5d990123](https://bscscan.com/address/0xBff334F8D5912AC5c4f2c590A2396d1C5d990123#code) |


**Linea**

| Contract Type | Contract Address |
| :---------: | :----------------: | 
| `Math`      | [0x0C9D8c7e486e822C29488Ff51BFf0167B4650953](https://lineascan.build/address/0x0C9D8c7e486e822C29488Ff51BFf0167B4650953#code) |
| `Views`     | [0x64379c265fc6595065d7d835aaaa731c0584db80](https://lineascan.build/address/0x64379c265fc6595065d7d835aaaa731c0584db80#code) |
| `Factory`   | [0xd125E7a0cEddF89c6473412d85835450897be6Dc](https://lineascan.build/address/0xd125E7a0cEddF89c6473412d85835450897be6Dc#code) |
| `AMM native disable` | [0x76303e4fDcA0AbF28aB3ee42Ce086E6503431F1D](https://lineascan.build/address/0x76303e4fDcA0AbF28aB3ee42Ce086E6503431F1D#code) |
| `AMM native enabled` | [0xC1b393EfEF38140662b91441C6710Aa704973228](https://lineascan.build/address/0xC1b393EfEF38140662b91441C6710Aa704973228#code) |


**:logos-scroll: Scroll**

| Contract Type | Contract Address |
| :---------: | :----------------: | 
| `Math`      | [0x5a8C93EE12a8Df4455BA111647AdA41f29D5CfcC](https://scroll.l2scan.co/address/0x5a8C93EE12a8Df4455BA111647AdA41f29D5CfcC) |
| `Views`     | [0xFAbC421e3368D158d802684A217a83c083c94CeB](https://scroll.l2scan.co/address/0xFAbC421e3368D158d802684A217a83c083c94CeB    #code) |
| `Factory`   | [0xC1b393EfEF38140662b91441C6710Aa704973228](https://scroll.l2scan.co/address/0xC1b393EfEF38140662b91441C6710Aa704973228#code) |
| `AMM native disable` | [0x3d6cB2F6DcF47CDd9C13E4e3beAe9af041d8796a](https://scroll.l2scan.co/address/0x3d6cB2F6DcF47CDd9C13E4e3beAe9af041d8796a#code) |
| `AMM native enabled` | [0x0c59d36b23f809f8b6C7cb4c8C590a0AC103baEf](https://scroll.l2scan.co/address/0x0c59d36b23f809f8b6C7cb4c8C590a0AC103baEf#code) |


**:logos-mantle: Mantle**

| Contract Type | Contract Address |
| :---------: | :----------------: | 
| `Math`      | [0x635742dCC8313DCf8c904206037d962c042EAfBd](https://mantlescan.info/address/0x635742dCC8313DCf8c904206037d962c042EAfBd) |
| `Views`     | [0x5702BDB1Ec244704E3cBBaAE11a0275aE5b07499](https://mantlescan.info/address/0x5702BDB1Ec244704E3cBBaAE11a0275aE5b07499) |
| `Factory`   | [0x0C9D8c7e486e822C29488Ff51BFf0167B4650953](https://mantlescan.info/address/0x0C9D8c7e486e822C29488Ff51BFf0167B4650953) |
| `AMM native disable` | [0x7Ca46A636b02D4aBC66883D7FF164bDE506DC66a](https://mantlescan.info/address/0x7Ca46A636b02D4aBC66883D7FF164bDE506DC66a) |
| `AMM native enable`  | [0x046207cB759F527b6c10C2D61DBaca45513685CC](https://mantlescan.info/address/0x046207cB759F527b6c10C2D61DBaca45513685CC) |


**:logos-celo: Celo**

| Contract Type | Contract Address |
| :---------: | :----------------: | 
| `Math`      | [0x505d666E4DD174DcDD7FA090ed95554486d2Be44](https://celoscan.io/address/0x505d666E4DD174DcDD7FA090ed95554486d2Be44#code) |
| `Views`     | [0x5a8C93EE12a8Df4455BA111647AdA41f29D5CfcC](https://celoscan.io/address/0x5a8C93EE12a8Df4455BA111647AdA41f29D5CfcC#code) |
| `Factory`   | [0x3d6cB2F6DcF47CDd9C13E4e3beAe9af041d8796a](https://celoscan.io/address/0x3d6cB2F6DcF47CDd9C13E4e3beAe9af041d8796a#code) |
| `AMM native disable` | [0x0c59d36b23f809f8b6C7cb4c8C590a0AC103baEf](https://celoscan.io/address/0x0c59d36b23f809f8b6C7cb4c8C590a0AC103baEf#code) |
| `AMM native enabled` | [0xFAbC421e3368D158d802684A217a83c083c94CeB](https://celoscan.io/address/0xFAbC421e3368D158d802684A217a83c083c94CeB#code) |


**:logos-kava: Kava**

| Contract Type | Contract Address |
| :---------: | :----------------: | 
| `Math`      | [0x505d666E4DD174DcDD7FA090ed95554486d2Be44](https://kavascan.com/address/0x505d666E4DD174DcDD7FA090ed95554486d2Be44#contracts) |
| `Views`     | [0x5a8C93EE12a8Df4455BA111647AdA41f29D5CfcC](https://kavascan.com/address/0x5a8C93EE12a8Df4455BA111647AdA41f29D5CfcC#contracts) |
| `Factory`   | [0x3d6cB2F6DcF47CDd9C13E4e3beAe9af041d8796a](https://kavascan.com/address/0x3d6cB2F6DcF47CDd9C13E4e3beAe9af041d8796a#contracts) |
| `AMM native disable` | [0x0c59d36b23f809f8b6C7cb4c8C590a0AC103baEf](https://kavascan.com/address/0x0c59d36b23f809f8b6C7cb4c8C590a0AC103baEf#contracts) |
| `AMM native enabled` | [0xFAbC421e3368D158d802684A217a83c083c94CeB](https://kavascan.com/address/0xFAbC421e3368D158d802684A217a83c083c94CeB#contracts) |


**:logos-aurora: Aurora**

| Contract Type | Contract Address |
| :---------: | :----------------: | 
| `Math`      | [0x5a8C93EE12a8Df4455BA111647AdA41f29D5CfcC](https://explorer.aurora.dev/address/0x5a8C93EE12a8Df4455BA111647AdA41f29D5CfcC/contracts) |
| `Views`     | [0xFAbC421e3368D158d802684A217a83c083c94CeB](https://explorer.aurora.dev/address/0xFAbC421e3368D158d802684A217a83c083c94CeB/contracts) |
| `Factory`   | [0xC1b393EfEF38140662b91441C6710Aa704973228](https://explorer.aurora.dev/address/0xC1b393EfEF38140662b91441C6710Aa704973228/contracts) |
| `AMM native disable` | [0x3d6cB2F6DcF47CDd9C13E4e3beAe9af041d8796a](https://explorer.aurora.dev/address/0x3d6cB2F6DcF47CDd9C13E4e3beAe9af041d8796a/contracts) |
| `AMM native enabled` | [0x0c59d36b23f809f8b6C7cb4c8C590a0AC103baEf](https://explorer.aurora.dev/address/0x0c59d36b23f809f8b6C7cb4c8C590a0AC103baEf/contracts) |


**:logos-xlayer: X-Layer**

| Contract Type | Contract Address |
| :---------: | :----------------: | 
| `Math`      | [0x046207cb759f527b6c10c2d61dbaca45513685cc](https://www.oklink.com/xlayer/address/0x046207cb759f527b6c10c2d61dbaca45513685cc/contract) |
| `Views`     | [0x7ca46a636b02d4abc66883d7ff164bde506dc66a](https://www.oklink.com/xlayer/address/0x7ca46a636b02d4abc66883d7ff164bde506dc66a/contract) |
| `Factory`   | [0xd3b17f862956464ae4403ccf829ce69199856e1e](https://www.oklink.com/xlayer/address/0xd3b17f862956464ae4403ccf829ce69199856e1e/contract) |
| `AMM native disable` | [0x0c9d8c7e486e822c29488ff51bff0167b4650953](https://www.oklink.com/xlayer/address/0x0c9d8c7e486e822c29488ff51bff0167b4650953/contract) |
| `AMM native enable` | [0x64379c265fc6595065d7d835aaaa731c0584db80](https://www.oklink.com/xlayer/address/0x64379c265fc6595065d7d835aaaa731c0584db80/contract) |


**:logos-zksync: zk-Sync**

| Contract Type | Contract Address |
| :---------: | :----------------: | 
| `Math`      | *soon*             |
| `Views`     | *soon*             |
| `Factory`   | *soon*             |
| `AMM native disable` | *soon*    |
| `AMM native enabled` | *soon*    |


**:logos-tron: Tron**

| Contract Type | Contract Address |
| :---------: | :----------------: | 
| `Math`      | *soon*             |
| `Views`     | *soon*             |
| `Factory`   | *soon*             |
| `AMM native disable` | *soon*    |
| `AMM native enabled` | *soon*    |


---


## **Zaps**

!!!deploy "Source Code"
    **StableCalcZaps** and **CryptoCalcZaps** source code is available [here](https://github.com/curvefi/curve-zaps), and the **DepositAndStake Zaps** source code can be found [here](https://github.com/curvefi/deposit-and-stake-zap). 


### **StableCalcZap**

*Zap for stable pools to `calc_token_amount` taking fees into account and to `get_dx`.*


| Chain | Contract Address |
| ----- | :--------------: |
| :logos-ethereum: `Ethereum` | [0xCA8d0747B5573D69653C3aC22242e6341C36e4b4](https://etherscan.io/address/0xCA8d0747B5573D69653C3aC22242e6341C36e4b4#code) |
| :logos-arbitrum: `Arbitrum` | [0xCA8d0747B5573D69653C3aC22242e6341C36e4b4](https://arbiscan.io/address/0xCA8d0747B5573D69653C3aC22242e6341C36e4b4#code) |
| :logos-optimism: `Optimism` | [0xCA8d0747B5573D69653C3aC22242e6341C36e4b4](https://optimistic.etherscan.io/address/0xCA8d0747B5573D69653C3aC22242e6341C36e4b4#code) |
| :logos-base: `Base` | [0x5552b631e2aD801fAa129Aacf4B701071cC9D1f7](https://basescan.org/address/0x5552b631e2aD801fAa129Aacf4B701071cC9D1f7#code) |
| :logos-fraxtal: `Fraxtal` | [0xCA8d0747B5573D69653C3aC22242e6341C36e4b4](https://fraxscan.com/address/0xCA8d0747B5573D69653C3aC22242e6341C36e4b4#code) |
| :logos-polygon: `Polygon` | [0xCA8d0747B5573D69653C3aC22242e6341C36e4b4](https://polygonscan.com/address/0xCA8d0747B5573D69653C3aC22242e6341C36e4b4#code) |
| :logos-gnosis: `Gnosis` | [0xCA8d0747B5573D69653C3aC22242e6341C36e4b4](https://gnosisscan.io/address/0xCA8d0747B5573D69653C3aC22242e6341C36e4b4#code) |
| :logos-avalanche: `Avalanche` | [0xCA8d0747B5573D69653C3aC22242e6341C36e4b4](https://snowscan.xyz/address/0xCA8d0747B5573D69653C3aC22242e6341C36e4b4#code) |
| :logos-fantom: `Fantom` | [0xCA8d0747B5573D69653C3aC22242e6341C36e4b4](https://ftmscan.com/address/0xCA8d0747B5573D69653C3aC22242e6341C36e4b4#code) |
| :logos-bsc: `Binance Smart Chain` | [0x0fE38dCC905eC14F6099a83Ac5C93BF2601300CF](https://bscscan.com/address/0x0fE38dCC905eC14F6099a83Ac5C93BF2601300CF#code) |
| :logos-celo: `Celo`| [0xCA8d0747B5573D69653C3aC22242e6341C36e4b4](https://celoscan.io/address/0xCA8d0747B5573D69653C3aC22242e6341C36e4b4#code) |
| :logos-kava: `Kava` | [0xCA8d0747B5573D69653C3aC22242e6341C36e4b4](https://kavascan.com/address/0xCA8d0747B5573D69653C3aC22242e6341C36e4b4#contracts) |
| :logos-aurora: `Aurora` | [0xCA8d0747B5573D69653C3aC22242e6341C36e4b4](ttps://explorer.aurora.dev/address/0xCA8d0747B5573D69653C3aC22242e6341C36e4b4/contracts) |



### **CryptoCalcZap**

*Zap for crypto pools to `get_dx`.*

| Chain | Contract Address |
| ----- | :--------------: |
| :logos-ethereum: `Ethereum` | [0xA72C85C258A81761433B4e8da60505Fe3Dd551CC](https://etherscan.io/address/0xA72C85C258A81761433B4e8da60505Fe3Dd551CC#code) |
| :logos-arbitrum: `Arbitrum` | [0xA72C85C258A81761433B4e8da60505Fe3Dd551CC](https://arbiscan.io/address/0xA72C85C258A81761433B4e8da60505Fe3Dd551CC#code) |
| :logos-optimism: `Optimism` | [0xA72C85C258A81761433B4e8da60505Fe3Dd551CC](https://optimistic.etherscan.io/address/0xA72C85C258A81761433B4e8da60505Fe3Dd551CC#code) |
| :logos-base: `Base` | [0xEfadDdE5B43917CcC738AdE6962295A0B343f7CE](https://basescan.org/address/0xEfadDdE5B43917CcC738AdE6962295A0B343f7CE#code) |
| :logos-fraxtal: `Fraxtal` | [0x69522fb5337663d3B4dFB0030b881c1A750Adb4f](https://fraxscan.com/address/0x69522fb5337663d3B4dFB0030b881c1A750Adb4f#code) |
| :logos-polygon: `Polygon` | [0xA72C85C258A81761433B4e8da60505Fe3Dd551CC](https://polygonscan.com/address/0xA72C85C258A81761433B4e8da60505Fe3Dd551CC#code) |
| :logos-gnosis: `Gnosis` | [0xA72C85C258A81761433B4e8da60505Fe3Dd551CC](https://gnosisscan.io/address/0xA72C85C258A81761433B4e8da60505Fe3Dd551CC#code) |
| :logos-avalanche: `Avalanche` | [0xA72C85C258A81761433B4e8da60505Fe3Dd551CC](https://snowscan.xyz/address/0xA72C85C258A81761433B4e8da60505Fe3Dd551CC#code) |
| :logos-fantom: `Fantom` | [0xA72C85C258A81761433B4e8da60505Fe3Dd551CC](https://ftmscan.com/address/0xA72C85C258A81761433B4e8da60505Fe3Dd551CC#code) |
| :logos-bsc: `Binance Smart Chain` | [0xd6681e74eEA20d196c15038C580f721EF2aB6320](https://bscscan.com/address/0xd6681e74eEA20d196c15038C580f721EF2aB6320#code) |
| :logos-celo: `Celo`| [0xA72C85C258A81761433B4e8da60505Fe3Dd551CC](https://celoscan.io/address/0xA72C85C258A81761433B4e8da60505Fe3Dd551CC#code) |
| :logos-kava: `Kava` | [0xA72C85C258A81761433B4e8da60505Fe3Dd551CC](https://kavascan.com/address/0xA72C85C258A81761433B4e8da60505Fe3Dd551CC#contracts) |
| :logos-aurora: `Aurora` | [0xA72C85C258A81761433B4e8da60505Fe3Dd551CC](ttps://explorer.aurora.dev/address/0xA72C85C258A81761433B4e8da60505Fe3Dd551CC/contracts) |



### **DepositAndStake Zap**

*Zap to add liquidity to pool and deposit into gauge in one transaction.*

| Chain | Contract Address |
| ----- | :--------------: |
| :logos-ethereum: `Ethereum` | [0x56C526b0159a258887e0d79ec3a80dfb940d0cD7](https://etherscan.io/address/0x56C526b0159a258887e0d79ec3a80dfb940d0cD7#code) |
| :logos-arbitrum: `Arbitrum` | [0x37c5ab57AF7100Bdc9B668d766e193CCbF6614FD](https://arbiscan.io/address/0x37c5ab57AF7100Bdc9B668d766e193CCbF6614FD#code) |
| :logos-optimism: `Optimism` | [0x37c5ab57AF7100Bdc9B668d766e193CCbF6614FD](https://optimistic.etherscan.io/address/0x37c5ab57AF7100Bdc9B668d766e193CCbF6614FD#code) |
| :logos-base: `Base` | [0x69522fb5337663d3B4dFB0030b881c1A750Adb4f](https://basescan.org/address/0x69522fb5337663d3B4dFB0030b881c1A750Adb4f#code) |
| :logos-fraxtal: `Fraxtal` | [0x0fE38dCC905eC14F6099a83Ac5C93BF2601300CF](https://fraxscan.com/address/0x0fE38dCC905eC14F6099a83Ac5C93BF2601300CF#code) |
| :logos-polygon: `Polygon` | [0x37c5ab57AF7100Bdc9B668d766e193CCbF6614FD](https://polygonscan.com/address/0x37c5ab57AF7100Bdc9B668d766e193CCbF6614FD#code) |
| :logos-gnosis: `Gnosis` | [0x37c5ab57AF7100Bdc9B668d766e193CCbF6614FD](https://gnosisscan.io/address/0x37c5ab57AF7100Bdc9B668d766e193CCbF6614FD#code) |
| :logos-avalanche: `Avalanche` | [0x37c5ab57AF7100Bdc9B668d766e193CCbF6614FD](https://snowscan.xyz/address/0x37c5ab57AF7100Bdc9B668d766e193CCbF6614FD#code) |
| :logos-fantom: `Fantom` | [0x37c5ab57AF7100Bdc9B668d766e193CCbF6614FD](https://ftmscan.com/address/0x37c5ab57AF7100Bdc9B668d766e193CCbF6614FD#code) |
| :logos-bsc: `Binance Smart Chain` | [0x4f37A9d177470499A2dD084621020b023fcffc1F](https://bscscan.com/address/0x4f37A9d177470499A2dD084621020b023fcffc1F#code) |
| :logos-kava: `Kava` | [0x37c5ab57AF7100Bdc9B668d766e193CCbF6614FD](https://kavascan.com/address/0x37c5ab57AF7100Bdc9B668d766e193CCbF6614FD#contracts) |


---


## **Curve Stablecoin**
For testing in production purposes, several contract deployments have taken place. Please ensure that you are using the correct and latest version. The latest deployment logs can be found [here](https://github.com/curvefi/curve-stablecoin/blob/master/deployment-logs/mainnet.log).

!!!github "GitHub"
    Source code is available on [:material-github: GitHub](https://github.com/curvefi/curve-stablecoin).

!!!warning "Implementations"
    **Implementation contracts are upgradable.** They can be either replaced or additional implementation contracts can be set. Therefore, please **always make sure to check the most recent ones**.


### **Core Contracts**

| Contract Type           | Contract Address                                                         |
| :---------------------: | :----------------------------------------------------------------------: |
| `Stablecoin`            | [0xf939E0A03FB07F59A73314E73794Be0E57ac1b4E](https://etherscan.io/address/0xf939E0A03FB07F59A73314E73794Be0E57ac1b4E#code) |
| `Controller Factory`               | [0xC9332fdCB1C491Dcc683bAe86Fe3cb70360738BC](https://etherscan.io/address/0xC9332fdCB1C491Dcc683bAe86Fe3cb70360738BC#code) |
| `Controller Implementation` | [0x6340678b2bab22a37d781Cd8da958a3cD1d97cdD](https://etherscan.io/address/0x6340678b2bab22a37d781Cd8da958a3cD1d97cdD#code) |
| `AMM Implementation`    | [0x3da7fF6C15C0c97D9C2dF4AF82a9910384b372FD](https://etherscan.io/address/0x3da7fF6C15C0c97D9C2dF4AF82a9910384b372FD#code) |
| `PriceAggregator`       | [0xe5Afcf332a5457E8FafCD668BcE3dF953762Dfe7](https://etherscan.io/address/0xe5Afcf332a5457E8FafCD668BcE3dF953762Dfe7#code) |
| `PriceAggregatorV2`     | [0x18672b1b0c623a30089A280Ed9256379fb0E4E62](https://etherscan.io/address/0x18672b1b0c623a30089A280Ed9256379fb0E4E62#code) |


### **PegKeepers**

| Contract Type           | Contract Address                                                         |
| :---------------------: | :----------------------------------------------------------------------: |
| `PegKeeperV1 (USDC)`      | [0xaA346781dDD7009caa644A4980f044C50cD2ae22](https://etherscan.io/address/0xaA346781dDD7009caa644A4980f044C50cD2ae22#code) |
| `PegKeeperV1 (USDT)`      | [0xE7cd2b4EB1d98CD6a4A48B6071D46401Ac7DC5C8](https://etherscan.io/address/0xE7cd2b4EB1d98CD6a4A48B6071D46401Ac7DC5C8#code) |
| `PegKeeperV1 (USDP)`      | [0x6B765d07cf966c745B340AdCa67749fE75B5c345](https://etherscan.io/address/0x6B765d07cf966c745B340AdCa67749fE75B5c345#code) |
| `PegKeeperV1 (TUSD)`      | [0x1ef89Ed0eDd93D1EC09E4c07373f69C49f4dcCae](https://etherscan.io/address/0x1ef89Ed0eDd93D1EC09E4c07373f69C49f4dcCae#code) |
| `PegKeeperRegulator`      | [0x36a04CAffc681fa179558B2Aaba30395CDdd855f](https://etherscan.io/address/0x36a04CAffc681fa179558B2Aaba30395CDdd855f#code) |
| `PegKeeperV2 (USDC)`      | [0x5B49b9adD1ecfe53E19cc2cFc8a33127cD6bA4C6](https://etherscan.io/address/0x5B49b9adD1ecfe53E19cc2cFc8a33127cD6bA4C6#code) |
| `PegKeeperV2 (USDT)`      | [0xFF78468340EE322ed63C432BF74D817742b392Bf](https://etherscan.io/address/0xFF78468340EE322ed63C432BF74D817742b392Bf#code) |
| `PegKeeperV2 (pyUSD)`      | [0x68e31e1eDD641B13cAEAb1Ac1BE661B19CC021ca](https://etherscan.io/address/0x68e31e1eDD641B13cAEAb1Ac1BE661B19CC021ca#code) |
| `PegKeeperV2 (TUSD)`      | [0x0B502e48E950095d93E8b739aD146C72b4f6C820](https://etherscan.io/address/0x0B502e48E950095d93E8b739aD146C72b4f6C820#code) |



### **crvUSD CrossChain**

*Despite being launched on Ethereum, crvUSD can be bridged to various chains:*

| Chain                         | crvUSD Token Address | Official Bridge |
| ----------------------------- | :------------------: | :-------------: |
| :logos-ethereum: **Ethereum** | [0xf939E0A03FB07F59A73314E73794Be0E57ac1b4E](https://etherscan.io/token/0xf939E0A03FB07F59A73314E73794Be0E57ac1b4E) | --- |
| :logos-arbitrum: **Arbitrum** | [0x498Bf2B1e120FeD3ad3D42EA2165E9b73f99C1e5](https://arbiscan.io/address/0x498Bf2B1e120FeD3ad3D42EA2165E9b73f99C1e5) | [Arbitrum Bridge](https://bridge.arbitrum.io/?destinationChain=arbitrum-one&sourceChain=ethereum) |
| :logos-optimism: **Optimism** | [0xc52d7f23a2e460248db6ee192cb23dd12bddcbf6](https://optimistic.etherscan.io/address/0xc52d7f23a2e460248db6ee192cb23dd12bddcbf6) | [Optimism Bridge](https://app.optimism.io/bridge/deposit) |
| :logos-base: **Base**         | [0x417Ac0e078398C154EdFadD9Ef675d30Be60Af93](https://basescan.org/address/0x417Ac0e078398C154EdFadD9Ef675d30Be60Af93) | [Base Bridge](https://bridge.base.org/deposit) |
| :logos-gnosis: **Gnosis**     | [0xaBEf652195F98A91E490f047A5006B71c85f058d](https://gnosisscan.io/address/0xaBEf652195F98A91E490f047A5006B71c85f058d) | [Gnosis Bridge](https://bridge.gnosischain.com/) |
| :logos-polygon: **Polygon**     | [0xc4Ce1D6F5D98D65eE25Cf85e9F2E9DcFEe6Cb5d6](https://polygonscan.com/address/0xc4Ce1D6F5D98D65eE25Cf85e9F2E9DcFEe6Cb5d6) | [Polygon Bridge](https://wallet.polygon.technology/) |
| :logos-xlayer: **X-Layer**     | [0xda8f4eb4503acf5dec5420523637bb5b33a846f6](https://www.oklink.com/xlayer/address/0xda8f4eb4503acf5dec5420523637bb5b33a846f6) | [X-Layer Bridge](https://www.okx.com/xlayer/bridge) |


### **Markets**

**:logos-sfrxeth: sfrxETH**

| Contract Type | Contract Address |
| :---------: | :----------------: | 
|`AMM`|[0x136e783846ef68c8bd00a3369f787df8d683a696](https://etherscan.io/address/0x136e783846ef68c8bd00a3369f787df8d683a696#code)|
|`Controller`|[0x8472a9a7632b173c8cf3a86d3afec50c35548e76](https://etherscan.io/address/0x8472a9a7632b173c8cf3a86d3afec50c35548e76#code)|
|`MonetaryPolicy`|[0xc684432FD6322c6D58b6bC5d28B18569aA0AD0A1](https://etherscan.io/address/0xc684432FD6322c6D58b6bC5d28B18569aA0AD0A1#code)|
|`CollateralToken (sfrxETH)`|[0xac3e018457b222d93114458476f3e3416abbe38f](https://etherscan.io/address/0xac3e018457b222d93114458476f3e3416abbe38f)|
|`PriceOracle`|[0x19F5B81e5325F882C9853B5585f74f751DE3896d](https://etherscan.io/address/0x19F5B81e5325F882C9853B5585f74f751DE3896d#code)|
|`Leverage Zap`|[0xb556FA4C4752321B3154f08DfBDFCF34847f2eac](https://etherscan.io/address/0xb556FA4C4752321B3154f08DfBDFCF34847f2eac#code)|


**:logos-wsteth: wstETH**

| Contract Type | Contract Address |
| :---------: | :----------------: | 
|`AMM`|[0x37417b2238aa52d0dd2d6252d989e728e8f706e4](https://etherscan.io/address/0x37417b2238aa52d0dd2d6252d989e728e8f706e4#code)|
|`Controller`|[0x100daa78fc509db39ef7d04de0c1abd299f4c6ce](https://etherscan.io/address/0x100daa78fc509db39ef7d04de0c1abd299f4c6ce#code)|
|`MonetaryPolicy`|[0x1E7d3bf98d3f8D8CE193236c3e0eC4b00e32DaaE](https://etherscan.io/address/0x1E7d3bf98d3f8D8CE193236c3e0eC4b00e32DaaE#code)|
|`CollateralToken (wstETH)`|[0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0](https://etherscan.io/address/0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0)|
|`PriceOracle`|[0xc1793A29609ffFF81f10139fa0A7A444c9e106Ad](https://etherscan.io/address/0xc1793A29609ffFF81f10139fa0A7A444c9e106Ad#code) |
|`Leverage Zap`|[0x293436d4e4a15FBc6cCC400c14a01735E5FC74fd](https://etherscan.io/address/0x293436d4e4a15FBc6cCC400c14a01735E5FC74fd#code)|



**:logos-wbtc: wBTC**

| Contract Type | Contract Address |
| :---------: | :----------------: | 
|`AMM`|[0xe0438eb3703bf871e31ce639bd351109c88666ea](https://etherscan.io/address/0xe0438eb3703bf871e31ce639bd351109c88666ea#code)|
|`Controller`|[0x4e59541306910ad6dc1dac0ac9dfb29bd9f15c67](https://etherscan.io/address/0x4e59541306910ad6dc1dac0ac9dfb29bd9f15c67#code)|
|`MonetaryPolicy`|[0x1E7d3bf98d3f8D8CE193236c3e0eC4b00e32DaaE](https://etherscan.io/address/0x1E7d3bf98d3f8D8CE193236c3e0eC4b00e32DaaE#code)|
|`CollateralToken (wBTC)`|[0x2260fac5e5542a773aa44fbcfedf7c193bc2c599](https://etherscan.io/address/0x2260fac5e5542a773aa44fbcfedf7c193bc2c599)|
|`PriceOracle`|[0xBe83fD842DB4937C0C3d15B2aBA6AF7E854f8dcb](https://etherscan.io/address/0xBe83fD842DB4937C0C3d15B2aBA6AF7E854f8dcb#code)|
|`Leverage Zap`|[0xA2518b71ee64E910741f5Cf480b19E8e402de4d7](https://etherscan.io/address/0xA2518b71ee64E910741f5Cf480b19E8e402de4d7#code)|



**:logos-eth: ETH**

| Contract Type | Contract Address |
| :---------: | :----------------: | 
|`AMM`|[0x1681195c176239ac5e72d9aebacf5b2492e0c4ee](https://etherscan.io/address/0x1681195c176239ac5e72d9aebacf5b2492e0c4ee#code)|
|`Controller`|[0xa920de414ea4ab66b97da1bfe9e6eca7d4219635](https://etherscan.io/address/0xa920de414ea4ab66b97da1bfe9e6eca7d4219635#code)|
|`MonetaryPolicy`|[0x1E7d3bf98d3f8D8CE193236c3e0eC4b00e32DaaE](https://etherscan.io/address/0x1E7d3bf98d3f8D8CE193236c3e0eC4b00e32DaaE#code)|
|`CollateralToken (wETH)`|[0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2](https://etherscan.io/address/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2)|
|`PriceOracle`|[0x966cBDeceFB60A289b0460F7638f4A75F432cA06](https://etherscan.io/address/0x966cBDeceFB60A289b0460F7638f4A75F432cA06#code)|
|`Leverage Zap`|[0xd3e576B5DcDe3580420A5Ef78F3639BA9cd1B967](https://etherscan.io/address/0xd3e576B5DcDe3580420A5Ef78F3639BA9cd1B967#code)|



**:logos-sfrxeth: sfrxeth v2**

| Contract Type | Contract Address |
| :---------: | :----------------: | 
|`AMM`|[0xfa96ad0a9e64261db86950e2da362f5572c5c6fd](https://etherscan.io/address/0xfa96ad0a9e64261db86950e2da362f5572c5c6fd#code)|
|`Controller`|[0xec0820efafc41d8943ee8de495fc9ba8495b15cf](https://etherscan.io/address/0xec0820efafc41d8943ee8de495fc9ba8495b15cf#code)|
|`MonetaryPolicy`|[0xb8687d7dc9d8fa32fabde63e19b2dbc9bb8b2138](https://etherscan.io/address/0xb8687d7dc9d8fa32fabde63e19b2dbc9bb8b2138#code)|
|`CollateralToken (sfrxETH)`|[0xac3e018457b222d93114458476f3e3416abbe38f](https://etherscan.io/address/0xac3e018457b222d93114458476f3e3416abbe38f)|
|`PriceOracle`|[0x28d7880B5b67fB4a0B1c6Ed6c33c33f365113C29](https://etherscan.io/address/0x28d7880B5b67fB4a0B1c6Ed6c33c33f365113C29#code)|
|`Leverage Zap`|[0x43eCFfe6c6C1b9F24AeB5C180E659c2a6FCe11Bc](https://etherscan.io/address/0x43eCFfe6c6C1b9F24AeB5C180E659c2a6FCe11Bc#code)|



**tBTC**

| Contract Type | Contract Address |
| :---------: | :----------------: | 
|`AMM`|[0xf9bd9da2427a50908c4c6d1599d8e62837c2bcb0](https://etherscan.io/address/0xf9bd9da2427a50908c4c6d1599d8e62837c2bcb0#code)|
|`Controller`|[0x1c91da0223c763d2e0173243eadaa0a2ea47e704](https://etherscan.io/address/0x1c91da0223c763d2e0173243eadaa0a2ea47e704#code)|
|`MonetaryPolicy`|[0xb8687d7dc9d8fa32fabde63e19b2dbc9bb8b2138](https://etherscan.io/address/0xb8687d7dc9d8fa32fabde63e19b2dbc9bb8b2138#code)|
|`CollateralToken (tBTC)`|[0x18084fba666a33d37592fa2633fd49a74dd93a88](https://etherscan.io/address/0x18084fba666a33d37592fa2633fd49a74dd93a88)|
|`PriceOracle`|[0xbeF434E2aCF0FBaD1f0579d2376fED0d1CfC4217](https://etherscan.io/address/0xbeF434E2aCF0FBaD1f0579d2376fED0d1CfC4217#code)|
|`Leverage Zap`|[0xD79964C70Cb06224FdA4c48387B53E9819bcB71c](https://etherscan.io/address/0xD79964C70Cb06224FdA4c48387B53E9819bcB71c#code)|


---


## **Curve Lending**

!!!deploy "Source Code"
    Source code for all lending-relevant contracts is available on [GitHub](https://github.com/curvefi/curve-stablecoin/tree/lending).

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


**:logos-ethereum: Ethereum**

| Contract Type                      | Contract Address                                                         |
| :--------------------------------: | :----------------------------------------------------------------------: |
| `AMM implementation`               | [0xB57A959cdB3D5e460f9a7Cc48ed05ec29dfF049a](https://etherscan.io/address/0xB57A959cdB3D5e460f9a7Cc48ed05ec29dfF049a) |
| `Controller implementation`        | [0x584B0Fd8F038fe8AEDf4057Ca3cB3D840446fBbf](https://etherscan.io/address/0x584B0Fd8F038fe8AEDf4057Ca3cB3D840446fBbf) |
| `Vault implementation`             | [0xc014F34D5Ba10B6799d76b0F5ACdEEe577805085](https://etherscan.io/address/0xc014F34D5Ba10B6799d76b0F5ACdEEe577805085) |
| `Pool price oracle implementation` | [0xC455e6c7936C2382f04306D329ABc5d36444D3F8](https://etherscan.io/address/0xC455e6c7936C2382f04306D329ABc5d36444D3F8) |
| `Monetary Policy Implementation`   | [0x4863c6dF17dD59311B7f67E694DD835ADC87f2d3](https://etherscan.io/address/0x4863c6dF17dD59311B7f67E694DD835ADC87f2d3) |
| `Gauge Implementation`             | [0x79D584d2D49eC8CE8Ea379d69364b700bd35874D](https://etherscan.io/address/0x79D584d2D49eC8CE8Ea379d69364b700bd35874D) |
| `OneWay Lending Factory`           | [0xeA6876DDE9e3467564acBeE1Ed5bac88783205E0](https://etherscan.io/address/0xeA6876DDE9e3467564acBeE1Ed5bac88783205E0) |


**:logos-arbitrum: Arbitrum**

| Contract Type                      | Contract Address                                                         |
| :--------------------------------: | :----------------------------------------------------------------------: |
| `AMM implementation`               | [0xaA2377F39419F8f4CB98885076c41fE547C65a6A](https://arbiscan.io/address/0xaA2377F39419F8f4CB98885076c41fE547C65a6A) |
| `Controller implementation`        | [0xd5DCcBf65f0BC66934e1B2a7e515A35535f91B97](https://arbiscan.io/address/0xd5DCcBf65f0BC66934e1B2a7e515A35535f91B97) |
| `Vault implementation`             | [0x104e15102E4Cf33e0e2cB7C304D406B523B04d7a](https://arbiscan.io/address/0x104e15102E4Cf33e0e2cB7C304D406B523B04d7a) |
| `Pool price oracle implementation` | [0x57390a776A2312eF8BFc25e8624483303Dd8DfF8](https://arbiscan.io/address/0x57390a776A2312eF8BFc25e8624483303Dd8DfF8) |
| `Monetary Policy Implementation`   | [0x0b3536245faDABCF091778C4289caEbDc2c8f5C1](https://arbiscan.io/address/0x0b3536245faDABCF091778C4289caEbDc2c8f5C1) |
| `OneWay Lending Factory`           | [0xcaEC110C784c9DF37240a8Ce096D352A75922DeA](https://arbiscan.io/address/0xcaEC110C784c9DF37240a8Ce096D352A75922DeA) |
