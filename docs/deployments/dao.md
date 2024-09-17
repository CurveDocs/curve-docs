---
search:
  exclude: true
---

<h1></h1>


# **Core Contracts**

!!!github
    The source code for the core dao-contracts can be found on [:material-github: GitHub](https://github.com/curvefi/curve-dao-contracts).

*Here is a list of contract deployments that are used in the Curve DAO:*

| Contract Type            | Contract Address |
| :----------------------: | :--------------: |
| `CRV Token`              | [0xD533a949740bb3306d119CC777fa900bA034cd52](https://etherscan.io/token/0xD533a949740bb3306d119CC777fa900bA034cd52)   |
| `CRV Circulating Supply` | [0x14139EB676342b6bC8E41E0d419969f23A49881e](https://etherscan.io/address/0x14139EB676342b6bC8E41E0d419969f23A49881e) |
| `Fee Distributor`        | [0xa464e6dcda8ac41e03616f95f4bc98a13b8922dc](https://etherscan.io/address/0xa464e6dcda8ac41e03616f95f4bc98a13b8922dc) |
| `Gauge Controller`       | [0x2F50D538606Fa9EDD2B11E2446BEb18C9D5846bB](https://etherscan.io/address/0x2F50D538606Fa9EDD2B11E2446BEb18C9D5846bB) |
| `Minter`                 | [0xd061D61a4d941c39E5453435B6345Dc261C2fcE0](https://etherscan.io/address/0xd061D61a4d941c39E5453435B6345Dc261C2fcE0) |
| `Voting Escrow`          | [0x5f3b5dfeb7b28cdbd7faba78963ee202a494e2a2](https://etherscan.io/address/0x5f3b5dfeb7b28cdbd7faba78963ee202a494e2a2) |


*Vesting contracts for the Curve DAO token:*

| Vesting Type                  | Contract Address |
| :---------------------------: | :--------------: |
| `pre-CRV Liquidity Providers` | [0x575ccd8e2d300e2377b43478339e364000318e2c](https://etherscan.io/address/0x575ccd8e2d300e2377b43478339e364000318e2c) |
| `Core Team`                   | [0xd2d43555134dc575bf7279f4ba18809645db0f1d](https://etherscan.io/address/0xd2d43555134dc575bf7279f4ba18809645db0f1d#readContract) |
| `Investors`                   | [0xf22995a3ea2c83f6764c711115b23a88411cafdd](https://etherscan.io/address/0xf22995a3ea2c83f6764c711115b23a88411cafdd) |
| `Investors`                   | [0x2a7d59e327759acd5d11a8fb652bf4072d28ac04](https://etherscan.io/address/0x2a7d59e327759acd5d11a8fb652bf4072d28ac04) |
| `Investors`                   | [0xf7dbc322d72c1788a1e37eee738e2ea9c7fa875e](https://etherscan.io/address/0xf7dbc322d72c1788a1e37eee738e2ea9c7fa875e) |
| `Employees`                   | [0x679fcb9b33fc4ae10ff4f96caef49c1ae3f8fa67](https://etherscan.io/address/0x679fcb9b33fc4ae10ff4f96caef49c1ae3f8fa67) |
| `Employees`                   | [0x41df5d28c7e801c4df0ab33421e2ed6ce52d2567](https://etherscan.io/address/0x41df5d28c7e801c4df0ab33421e2ed6ce52d2567) |
| `Community Funds`             | [0xe3997288987e6297ad550a69b31439504f513267](https://etherscan.io/address/0xe3997288987e6297ad550a69b31439504f513267) |


*Despite being launched on Ethereum, the Curve DAO Token can be bridged to various chains:*

!!!danger "MULTICHAIN WARNING"
    Multichain statement: https://twitter.com/MultichainOrg/status/1677180114227056641  
    The Multichain service stopped currently, and all bridge transactions will be stuck on the source chains. 
    There is no confirmed resume time.  
    **Please don’t use the Multichain bridging service now.**


| Chain                           | Contract Address                                                         | Bridge                                   |
| ------------------------------- | ------------------------------------------------------------------------ | ---------------------------------------- |
| :logos-arbitrum: `Arbitrum`     | [0x11cDb42B0EB46D95f990BeDD4695A6e3fA034978](https://arbiscan.io/address/0x11cDb42B0EB46D95f990BeDD4695A6e3fA034978) | [**Arbitrum Bridge**](https://bridge.arbitrum.io/)​ |
| :logos-base: `Base`             | [0x8Ee73c484A26e0A5df2Ee2a4960B789967dd0415](https://basescan.org/address/0x8Ee73c484A26e0A5df2Ee2a4960B789967dd0415) | [**Base Bridge**](https://bridge.base.org/deposit) |
| :logos-optimism: `Optimism`     | [0x0994206dfE8De6Ec6920FF4D779B0d950605Fb53](https://optimistic.etherscan.io/address/0x0994206dfe8de6ec6920ff4d779b0d950605fb53) | [**Optimism Bridge**](https://app.optimism.io/bridge) |
| :logos-polygon: `Polygon`       | [0x172370d5Cd63279eFa6d502DAB29171933a610AF](https://polygonscan.com/address/0x172370d5cd63279efa6d502dab29171933a610af) | [**Polygon Bridge**](https://wallet.polygon.technology/bridge/)​ |
| :logos-gnosis: `Gnosis`         | [0x712b3d230F3C1c19db860d80619288b1F0BDd0Bd](https://gnosisscan.io/address/0x712b3d230f3c1c19db860d80619288b1f0bdd0bd) | [**xDai Bridge**](https://bridge.xdaichain.com/)​ |
| :logos-gnosis: `Gnosis`         | [0x712b3d230F3C1c19db860d80619288b1F0BDd0Bd](https://gnosisscan.io/address/0x712b3d230f3c1c19db860d80619288b1f0bdd0bd) | [**Omni Bridge**](https://omni.xdaichain.com/bridge)​ |
| :logos-xlayer: `X-Layer` | [0x3d5320821bfca19fb0b5428f2c79d63bd5246f89](https://www.oklink.com/xlayer/address/0x3d5320821bfca19fb0b5428f2c79d63bd5246f89/contract) | [**X-Layer Bridge**](https://www.okx.com/xlayer/bridge) |
| :logos-mantle: `Mantle` | [0xE265FC71d45fd791c9ebf3EE0a53FBB220Eb8f75](https://mantlescan.xyz/address/0xE265FC71d45fd791c9ebf3EE0a53FBB220Eb8f75) |  |
| :logos-fraxtal: `Fraxtal` | [0x331b9182088e2a7d6d3fe4742aba1fb231aecc56](https://fraxscan.com/token/0x331b9182088e2a7d6d3fe4742aba1fb231aecc56) |  |
| :logos-zksync: `zk-Sync` | [0x5945932099f124194452a4c62d34bb37f16183b2](https://era.zksync.network/token/0x5945932099f124194452a4c62d34bb37f16183b2) |  |
| :logos-avalanche: `Avalanche`​ | [0x47536F17F4fF30e64A96a7555826b8f9e66ec468](https://snowscan.xyz/address/0x47536F17F4fF30e64A96a7555826b8f9e66ec468) | [**<mark style="background-color: #f31743; color: black">Multichain</mark>**](https://multichain.org/)​ |
| :logos-fantom: `Fantom`         | [0x1E4F97b9f9F913c46F1632781732927B9019C68b](https://ftmscan.com/address/0x1e4f97b9f9f913c46f1632781732927b9019c68b) | [**<mark style="background-color: #f31743; color: black">Multichain</mark>**](https://multichain.org/)​ |
| :logos-celo: `Celo`             | [0x173fd7434B8B50dF08e3298f173487ebDB35FD14](https://explorer.celo.org/mainnet/address/0x173fd7434B8B50dF08e3298f173487ebDB35FD14) | [**<mark style="background-color: #f31743; color: black">Multichain</mark>**](https://multichain.org/)​ |


---


# **Aragon**

Curve DAO consists of multiple smart contracts connected by [Aragon](https://github.com/aragon/aragonOS). Interaction with Aragon occurs through a [modified implementation](https://github.com/curvefi/curve-aragon-voting) of the [Aragon Voting App](https://github.com/aragon/aragon-apps/tree/master/apps/voting). Aragon’s standard one-token, one-vote method is replaced with a weighting system based on locking tokens. Curve DAO has a token (CRV) used for governance and value accrual.

## **Voting**

Aragon [Voting App](https://wiki.aragon.org/archive/dev/apps/voting/) deployments are the main entry points used to create new votes, vote, check the status of a vote, and execute a successful vote.

| Voting Type | Contract Address |
| :---------: | :--------------: | 
| `Ownership` | [0xe478de485ad2fe566d49342cbd03e49ed7db3356](https://etherscan.io/address/0xe478de485ad2fe566d49342cbd03e49ed7db3356) |
| `Parameter` | [0xbcff8b0b9419b9a88c44546519b1e909cf330399](https://etherscan.io/address/0xbcff8b0b9419b9a88c44546519b1e909cf330399) | 


The following token addresses are used for determining voter weights within Curve’s Aragon DAOs.

| Vote Type   | Contract Address  |
| :---------: | :---------------: | 
| `Ownership / Parameter` | [0x5f3b5DfEb7B28CDbD7FAba78963EE202a494e2A2](https://etherscan.io/address/0x5f3b5DfEb7B28CDbD7FAba78963EE202a494e2A2) |



## **Agent**

Aragon [Agent](https://hack.aragon.org/docs/guides-use-agent) deployments correspond to the different owner accounts within the DAO. Contract calls made due to a successful vote will be executed from these addresses. When deploying new contracts, these addresses should be given appropriate access to admin functionality.

| Agent Type  | Contract Address  |
| :---------: | :---------------: | 
| `Ownership` | [0x40907540d8a6C65c637785e8f8B742ae6b0b9968](https://etherscan.io/address/0x40907540d8a6C65c637785e8f8B742ae6b0b9968) |
| `Parameter` | [0x4EEb3bA4f221cA16ed4A0cC7254E2E32DF948c5f](https://etherscan.io/address/0x4EEb3bA4f221cA16ed4A0cC7254E2E32DF948c5f) |



## **Emergency DAO**

The Emergency DAO is deployed at:

| Vote Type   | Contract Address  |
| :---------: | :---------------: | 
| `eDAO` | [0x467947EE34aF926cF1DCac093870f613C96B1E0c](https://etherscan.io/address/0x467947EE34aF926cF1DCac093870f613C96B1E0c) |


---


# **Fee Receiver**

| Chain | Contract Address |
| :---------: | :-----: |
| :logos-ethereum: `Ethereum` | [0xeCb456EA5365865EbAb8a2661B0c503410e9B347](https://etherscan.io/address/0xeCb456EA5365865EbAb8a2661B0c503410e9B347) |
| :logos-ethereum: `Ethereum` | [0xa2Bcd1a4Efbd04B63cd03f5aFf2561106ebCCE00](https://etherscan.io/address/0xa2Bcd1a4Efbd04B63cd03f5aFf2561106ebCCE00) |
| :logos-arbitrum: `Arbitrum` | [0xd4F94D0aaa640BBb72b5EEc2D85F6D114D81a88E](https://arbiscan.io/address/0xd4F94D0aaa640BBb72b5EEc2D85F6D114D81a88E) |
| :logos-optimism: `Optimism` | [0xbF7E49483881C76487b0989CD7d9A8239B20CA41](https://optimistic.etherscan.io/address/0xbF7E49483881C76487b0989CD7d9A8239B20CA41) |
| :logos-base: `Base` | [0xe8269B33E47761f552E1a3070119560d5fa8bBD6](https://basescan.org/address/0xe8269B33E47761f552E1a3070119560d5fa8bBD6) |
| :logos-fraxtal: `Fraxtal` | [0x8b3EFBEfa6eD222077455d6f0DCdA3bF4f3F57A6](https://fraxscan.com/address/0x8b3EFBEfa6eD222077455d6f0DCdA3bF4f3F57A6) |
| :logos-polygon: `Polygon` | [0x774D1Dba98cfBD1F2Bc3A1F59c494125e07C48F9](https://polygonscan.com/address/0x774D1Dba98cfBD1F2Bc3A1F59c494125e07C48F9) |
| :logos-polygon: `Polygon zk-EVM`   | [0x8b3EFBEfa6eD222077455d6f0DCdA3bF4f3F57A6](https://zkevm.polygonscan.com/address/0x8b3EFBEfa6eD222077455d6f0DCdA3bF4f3F57A6) |
| :logos-gnosis: `Gnosis` | [0xB055EbbAcc8Eefc166c169e9Ce2886D0406aB49b](https://gnosisscan.io/address/0xB055EbbAcc8Eefc166c169e9Ce2886D0406aB49b) |
| :logos-gnosis: `Gnosis` | [0xBb7404F9965487a9DdE721B3A5F0F3CcfA9aa4C5](https://gnosisscan.io/address/0xBb7404F9965487a9DdE721B3A5F0F3CcfA9aa4C5) |
| :logos-avalanche: `Avalanche` | [0x06534b0BF7Ff378F162d4F348390BDA53b15fA35](https://snowscan.xyz/address/0x06534b0BF7Ff378F162d4F348390BDA53b15fA35) |
| :logos-fantom: `Fantom` | [0x2B039565B2b7a1A9192D4847fbd33B25b836B950](https://ftmscan.com/address/0x2B039565B2b7a1A9192D4847fbd33B25b836B950) |
| :logos-bsc: `Binance Smart Chain` | [0x98B4029CaBEf7Fd525A36B0BF8555EC1d42ec0B6](https://bscscan.com/address/0x98B4029CaBEf7Fd525A36B0BF8555EC1d42ec0B6) |
| :logos-linea: `Linea` | [0xf3A431008396df8A8b2DF492C913706BDB0874ef](https://lineascan.build/address/0xf3A431008396df8A8b2DF492C913706BDB0874ef) |
| :logos-scroll: `Scroll` | [0xf3A431008396df8A8b2DF492C913706BDB0874ef](https://scrollscan.com/address/0xf3A431008396df8A8b2DF492C913706BDB0874ef) |
| :logos-mantle: `Mantle` | [0xf3A431008396df8A8b2DF492C913706BDB0874ef](https://mantlescan.xyz/address/0xf3A431008396df8A8b2DF492C913706BDB0874ef) |
| :logos-celo: `Celo` | [0x56bc95Ded2BEF162131905dfd600F2b9F1B380a4](https://celoscan.io/address/0x56bc95Ded2BEF162131905dfd600F2b9F1B380a4) |
| :logos-aurora: `Aurora` | [0xf3a431008396df8a8b2df492c913706bdb0874ef](https://explorer.aurora.dev/address/0xf3a431008396df8a8b2df492c913706bdb0874ef) |
| :logos-kava: `Kava` | - |
| :logos-xlayer: `X-Layer` | [0xf3a431008396df8a8b2df492c913706bdb0874ef](https://www.oklink.com/xlayer/address/0xf3a431008396df8a8b2df492c913706bdb0874ef) |


---


# **New Curve Burner System**

!!!info "New Fee-Burning Architecture"
    Curve has developed and deployed a new fee-burning architecture. For detailed documentation, please see here: [Curve Burner Documentation](../curve_dao/fee-collection-distribution/curve-burner/overview.md).


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


# **Fee Burner**

!!!info "New Fee-Burning Architecture"
    Curve has developed and deployed a new fee-burning architecture. For detailed documentation, please see here: [Curve Burner Documentation](../curve_dao/fee-collection-distribution/curve-burner/overview.md).

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


# **Curve X-GOV**

!!!github
    The source code for the `curve-xgov` contracts can be found on [:material-github: GitHub](https://github.com/curvefi/curve-xgov).


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
| L1 Broadcaster     | [0x9D9e70CA10fE911Dee9869F21e5ebB24A9519Ade](https://etherscan.io/address/0x9D9e70CA10fE911Dee9869F21e5ebB24A9519Ade) |
| L2 Relayer         | [0x9D9e70CA10fE911Dee9869F21e5ebB24A9519Ade](https://www.oklink.com/xlayer/address/0x6628b9e7c0029cea234b382be17101648f32cd8f/contract) |
| L2 Ownership Agent | [0x6628b9e7c0029cea234b382be17101648f32cd8f](https://www.oklink.com/xlayer/address/0x6628b9e7c0029cea234b382be17101648f32cd8f/contract) |
| L2 Parameter Agent | [0xccc4864762412f3273bf7ca9264295909504ebb5](https://www.oklink.com/xlayer/address/0xccc4864762412f3273bf7ca9264295909504ebb5/contract) |
| L2 Emergency Agent | [0x9ffc6f671d88593aae56d9d34f2b40d7a56d467f](https://www.oklink.com/xlayer/address/0x9ffc6f671d88593aae56d9d34f2b40d7a56d467f/contract) |
| L2 Vault           | [0x0848F3800F04b3ad4309A5f27814be7FC4740cB9](https://www.oklink.com/xlayer/address/0x0848F3800F04b3ad4309A5f27814be7FC4740cB9/contract) |
| Agent Blueprint    | [0x0199429171bce183048dccf1d5546ca519ea9717](https://www.okx.com/web3/explorer/xlayer/address/0x0199429171bce183048dccf1d5546ca519ea9717/contract) |