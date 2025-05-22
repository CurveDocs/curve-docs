---
search:
  exclude: true
---

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


*Vesting contracts for the Curve DAO token:*

| Vesting Type | Contract Address |
| :----------: | :--------------: |
| `pre-CRV Liquidity Providers` | [0x575ccd8e2d300e2377b43478339e364000318e2c](https://etherscan.io/address/0x575ccd8e2d300e2377b43478339e364000318e2c) |
| `Core Team` | [0xd2d43555134dc575bf7279f4ba18809645db0f1d](https://etherscan.io/address/0xd2d43555134dc575bf7279f4ba18809645db0f1d#readContract) |
| `Investors` | [0xf22995a3ea2c83f6764c711115b23a88411cafdd](https://etherscan.io/address/0xf22995a3ea2c83f6764c711115b23a88411cafdd) |
| `Investors` | [0x2a7d59e327759acd5d11a8fb652bf4072d28ac04](https://etherscan.io/address/0x2a7d59e327759acd5d11a8fb652bf4072d28ac04) |
| `Investors` | [0xf7dbc322d72c1788a1e37eee738e2ea9c7fa875e](https://etherscan.io/address/0xf7dbc322d72c1788a1e37eee738e2ea9c7fa875e) |
| `Employees` | [0x679fcb9b33fc4ae10ff4f96caef49c1ae3f8fa67](https://etherscan.io/address/0x679fcb9b33fc4ae10ff4f96caef49c1ae3f8fa67) |
| `Employees` | [0x41df5d28c7e801c4df0ab33421e2ed6ce52d2567](https://etherscan.io/address/0x41df5d28c7e801c4df0ab33421e2ed6ce52d2567) |
| `Community Funds` | [0xe3997288987e6297ad550a69b31439504f513267](https://etherscan.io/address/0xe3997288987e6297ad550a69b31439504f513267) |


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
| :logos-gnosis: **Gnosis**         | [0x712b3d230F3C1c19db860d80619288b1F0BDd0Bd](https://gnosisscan.io/address/0x712b3d230f3c1c19db860d80619288b1f0bdd0bd) | [**Gnosis Bridge**](https://bridge.gnosischain.com/)​ |
| :logos-xlayer: **X-Layer** | [0x3d5320821bfca19fb0b5428f2c79d63bd5246f89](https://www.oklink.com/xlayer/address/0x3d5320821bfca19fb0b5428f2c79d63bd5246f89/contract) | [**X-Layer Bridge**](https://www.okx.com/xlayer/bridge) |
| :logos-avalanche: **Avalanche**​   | [0x47536F17F4fF30e64A96a7555826b8f9e66ec468](https://snowscan.xyz/address/0x47536F17F4fF30e64A96a7555826b8f9e66ec468) | [**<mark style="background-color: #f31743; color: black">Multichain</mark>**](https://multichain.org/)​ |
| :logos-fantom: **Fantom**​         | [0x1E4F97b9f9F913c46F1632781732927B9019C68b](https://ftmscout.com/address/0x1e4f97b9f9f913c46f1632781732927b9019c68b) | [**<mark style="background-color: #f31743; color: black">Multichain</mark>**](https://multichain.org/)​ |
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


## **Fee Receiver**

| Chain | Contract Address |
| ----------- | :-----: |
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
| :logos-fantom: `Fantom` | [0x2B039565B2b7a1A9192D4847fbd33B25b836B950](https://ftmscout.com/address/0x2B039565B2b7a1A9192D4847fbd33B25b836B950) |
| :logos-bsc: `Binance Smart Chain` | [0x98B4029CaBEf7Fd525A36B0BF8555EC1d42ec0B6](https://bscscan.com/address/0x98B4029CaBEf7Fd525A36B0BF8555EC1d42ec0B6) |
| :logos-linea: `Linea` | [0xf3A431008396df8A8b2DF492C913706BDB0874ef](https://lineascan.build/address/0xf3A431008396df8A8b2DF492C913706BDB0874ef) |
| :logos-scroll: `Scroll` | [0xf3A431008396df8A8b2DF492C913706BDB0874ef](https://scrollscan.com/address/0xf3A431008396df8A8b2DF492C913706BDB0874ef) |
| :logos-mantle: `Mantle` | [0xf3A431008396df8A8b2DF492C913706BDB0874ef](https://mantlescan.xyz/address/0xf3A431008396df8A8b2DF492C913706BDB0874ef) |
| :logos-celo: `Celo` | [0x56bc95Ded2BEF162131905dfd600F2b9F1B380a4](https://celoscan.io/address/0x56bc95Ded2BEF162131905dfd600F2b9F1B380a4) |
| :logos-aurora: `Aurora` | [0xf3a431008396df8a8b2df492c913706bdb0874ef](https://explorer.aurora.dev/address/0xf3a431008396df8a8b2df492c913706bdb0874ef) |
| :logos-kava: `Kava` | - |
| :logos-xlayer: `X-Layer` | [0xf3a431008396df8a8b2df492c913706bdb0874ef](https://www.oklink.com/xlayer/address/0xf3a431008396df8a8b2df492c913706bdb0874ef) |


---


## **Fee Burner**

!!!info "New Fee-Burning Architecture"
    Curve has developed and deployed a new fee-burning architecture. For detailed documentation, please see here: [Curve Burner Documentation](../fees/original-architecture/overview.md).


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
| `UnderlyingBurner`  | [0x423f26eb44d4be89072eecfc81b95065ce43bf4b](https://ftmscout.com/address/0x423f26eb44d4be89072eecfc81b95065ce43bf4b#code) |
| `BTCBurner`         | [0xFa18A0385610b560f3041C40E23fB319e24658f1](https://ftmscout.com/address/0xFa18A0385610b560f3041C40E23fB319e24658f1#code) |
| `gToken Burner`     | [0xDE5331AC4B3630f94853Ff322B66407e0D6331E8](https://ftmscout.com/address/0xDE5331AC4B3630f94853Ff322B66407e0D6331E8#code) |
| `cToken Burner`     | [0x11137B10C210b579405c21A07489e28F3c040AB1](https://ftmscout.com/address/0x11137B10C210b579405c21A07489e28F3c040AB1#code) |
| `Tricrypto Burner`  | [0x337e9d5A2DeE10Fdd30E67236667E1dE5b0c085F](https://ftmscout.com/address/0x337e9d5A2DeE10Fdd30E67236667E1dE5b0c085F#code) |
| `Swap Burner`       | [0x959c1BA175e04F7164EB749f4E88f10fe4Bac8a6](https://ftmscout.com/address/0x959c1BA175e04F7164EB749f4E88f10fe4Bac8a6#code) |
| `BridgeContract`    | [0x993ff6dd3851ab11af751277e419c2aa2697a288](https://ftmscout.com/address/0x993ff6dd3851ab11af751277e419c2aa2697a288#code) |


---


## **New Curve Burner System**

!!!info "New Fee-Burning Architecture"
    Curve has developed and deployed a new fee-burning architecture. For detailed documentation, please see here: [Curve Burner Documentation](../fees/overview.md).

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

| Chain                             | Contract Address |
| --------------------------------- | :--------------: |
| :logos-ethereum: `Ethereum`       | [0x16C6521Dff6baB339122a0FE25a9116693265353](https://etherscan.io/address/0x16C6521Dff6baB339122a0FE25a9116693265353) |
| :logos-arbitrum: `Arbitrum`       | [0x2191718CD32d02B8E60BAdFFeA33E4B5DD9A0A0D](https://arbiscan.io/address/0x2191718CD32d02B8E60BAdFFeA33E4B5DD9A0A0D) |
| :logos-optimism: `Optimism`       | [0x0DCDED3545D565bA3B19E683431381007245d983](https://optimistic.etherscan.io/address/0x0DCDED3545D565bA3B19E683431381007245d983) |
| :logos-base: `Base`               | [0x4f37A9d177470499A2dD084621020b023fcffc1F](https://basescan.org/address/0x4f37A9d177470499A2dD084621020b023fcffc1F) |
| :logos-fraxtal: `Fraxtal`         | [0x9f2Fa7709B30c75047980a0d70A106728f0Ef2db](https://fraxscan.com/address/0x9f2Fa7709B30c75047980a0d70A106728f0Ef2db) |
| :logos-polygon: `Polygon`         | [0x0DCDED3545D565bA3B19E683431381007245d983](https://polygonscan.com/address/0x0DCDED3545D565bA3B19E683431381007245d983) |
| :logos-gnosis: `Gnosis (xDAI)`    | [0x0DCDED3545D565bA3B19E683431381007245d983](https://gnosisscan.io/address/0x0DCDED3545D565bA3B19E683431381007245d983) |
| :logos-avalanche: `Avalanche`     | [0x0DCDED3545D565bA3B19E683431381007245d983](https://snowscan.xyz/address/0x0DCDED3545D565bA3B19E683431381007245d983) |
| :logos-fantom: `Fantom`           | [0x0DCDED3545D565bA3B19E683431381007245d983](https://ftmscout.com/address/0x0DCDED3545D565bA3B19E683431381007245d983) |
| :logos-bsc: `Binance Smart Chain` | [0xA72C85C258A81761433B4e8da60505Fe3Dd551CC](https://bscscan.com/address/0xA72C85C258A81761433B4e8da60505Fe3Dd551CC) |
| :logos-mantle: `Mantle`           | [0x4f37A9d177470499A2dD084621020b023fcffc1F](https://mantlescan.xyz/address/0x4f37A9d177470499A2dD084621020b023fcffc1F) |
| :logos-kava: `Kava`               | [0x0DCDED3545D565bA3B19E683431381007245d983](https://kavascan.com/address/0x0DCDED3545D565bA3B19E683431381007245d983) |
| :logos-xlayer: `X-Layer`          | [0xBFab8ebc836E1c4D81837798FC076D219C9a1855](https://www.oklink.com/xlayer/address/0xBFab8ebc836E1c4D81837798FC076D219C9a1855) |
| :logos-zksync: `zk-Sync`          | [0x7C915390e109CA66934f1eB285854375D1B127FA](https://era.zksync.network/address/0x7C915390e109CA66934f1eB285854375D1B127FA) |


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
| `ChildLiquidityGaugeFactory` | :logos-optimism: Optimism | [0xabc000d88f23bb45525e447528dbf656a9d55bf5](https://optimistic.etherscan.io/address/0xabC000d88f23Bb45525E447528DBF656A9D55bf5#code) |
| `ChildLiquidityGaugeFactory` | :logos-polygon: Polygon | [0xabc000d88f23bb45525e447528dbf656a9d55bf5](https://polygonscan.com/address/0xabC000d88f23Bb45525E447528DBF656A9D55bf5) |
| `ChildLiquidityGaugeFactory` | :logos-base: Base | [0xabc000d88f23bb45525e447528dbf656a9d55bf5](https://basescan.org/address/0xabC000d88f23Bb45525E447528DBF656A9D55bf5) |
| :logos-fraxtal: `RootLiquidityGaugeFactory` | :logos-ethereum: Ethereum | [0xeF672bD94913CB6f1d2812a6e18c1fFdEd8eFf5c](https://etherscan.io/address/0xeF672bD94913CB6f1d2812a6e18c1fFdEd8eFf5c) |
| `ChildLiquidityGaugeFactory` | :logos-fraxtal: Fraxtal | [0xeF672bD94913CB6f1d2812a6e18c1fFdEd8eFf5c](https://fraxscan.com/address/0xeF672bD94913CB6f1d2812a6e18c1fFdEd8eFf5c) |
| `ChildLiquidityGaugeFactory` | :logos-gnosis: Gnosis | [0xabc000d88f23bb45525e447528dbf656a9d55bf5](https://gnosisscan.io/address/0xabc000d88f23bb45525e447528dbf656a9d55bf5) |
| `ChildLiquidityGaugeFactory` | :logos-celo: Celo | :material-close: |
| `ChildLiquidityGaugeFactory` | :logos-avalanche: Avalanche | :material-close: |
| `ChildLiquidityGaugeFactory` | :logos-fantom: Fantom | :material-close: |
| :logos-mantle: `RootLiquidityGaugeFactory` | :logos-ethereum: Ethereum | [0xeF672bD94913CB6f1d2812a6e18c1fFdEd8eFf5c](https://etherscan.io/address/0xeF672bD94913CB6f1d2812a6e18c1fFdEd8eFf5c) |
| `ChildLiquidityGaugeFactory` | :logos-mantle: Mantle | [0xeF672bD94913CB6f1d2812a6e18c1fFdEd8eFf5c](https://mantlescan.xyz/address/0xeF672bD94913CB6f1d2812a6e18c1fFdEd8eFf5c) |
| :logos-xlayer: `RootLiquidityGaugeFactory` | :logos-ethereum: Ethereum | [0xeF672bD94913CB6f1d2812a6e18c1fFdEd8eFf5c](https://etherscan.io/address/0xeF672bD94913CB6f1d2812a6e18c1fFdEd8eFf5c) |
| `ChildLiquidityGaugeFactory` | :logos-xlayer: X-Layer | [0xef672bd94913cb6f1d2812a6e18c1ffded8eff5c](https://www.oklink.com/xlayer/address/0xef672bd94913cb6f1d2812a6e18c1ffded8eff5c/contract) |


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
| L2 Relayer         | [0x002599c7D4299A268b332B3240d60308f93C99eC](https://ftmscout.com/address/0x002599c7D4299A268b332B3240d60308f93C99eC) |
| L2 Ownership Agent | [0xd62Ade30F740de7ef766008258B4b2F574A084F7](https://ftmscout.com/address/0xd62Ade30F740de7ef766008258B4b2F574A084F7) |
| L2 Parameter Agent | [0x837814ba42c6f3B39f0A5060168F7027695DDAb1](https://ftmscout.com/address/0x837814ba42c6f3B39f0A5060168F7027695DDAb1) |
| L2 Emergency Agent | [0x42113C6818ACb87ca3CaFDbBc6a6ae396f1548E6](https://ftmscout.com/address/0x42113C6818ACb87ca3CaFDbBc6a6ae396f1548E6) |
| L2 Vault           | [0x49C8De2D10C9A56DD9A59ab5Ca1216111276394C](https://ftmscout.com/address/0x49C8De2D10C9A56DD9A59ab5Ca1216111276394C) |
| Agent Blueprint    | [0x0732539C8aD556594FDa6A50fA8E976cA6D514B9](https://ftmscout.com/address/0x0732539C8aD556594FDa6A50fA8E976cA6D514B9) |


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


---


## **Address Provider**

Contract functionality is documented [here :material-arrow-up-right:](../integration/address-provider.md).

!!!github
    The source code for `AddressProviderNG.vy` can be found on [:material-github: GitHub](https://github.com/curvefi/metaregistry/blob/main/contracts/AddressProviderNG.vy).


| Chain                         | Contract Address |
| ----------------------------- | ---------------- |
| :logos-ethereum: `Ethereum`     | [0x5ffe7FB82894076ECB99A30D6A32e969e6e35E98](https://etherscan.io/address/0x5ffe7FB82894076ECB99A30D6A32e969e6e35E98) |
| :logos-arbitrum: `Arbitrum`     | [0x5ffe7FB82894076ECB99A30D6A32e969e6e35E98](https://arbiscan.io/address/0x5ffe7FB82894076ECB99A30D6A32e969e6e35E98) |
| :logos-optimism: `Optimism`     | [0x5ffe7FB82894076ECB99A30D6A32e969e6e35E98](https://optimistic.etherscan.io/address/0x5ffe7FB82894076ECB99A30D6A32e969e6e35E98) |
| :logos-base: `Base`             | [0x5ffe7FB82894076ECB99A30D6A32e969e6e35E98](https://basescan.org/address/0x5ffe7FB82894076ECB99A30D6A32e969e6e35E98) |
| :logos-bsc: `BinanceSmartChain` | [0x5ffe7FB82894076ECB99A30D6A32e969e6e35E98](https://bscscan.com/address/0x5ffe7FB82894076ECB99A30D6A32e969e6e35E98) |
| :logos-polygon: `Polygon`       | [0x5ffe7FB82894076ECB99A30D6A32e969e6e35E98](https://polygonscan.com/address/0x5ffe7FB82894076ECB99A30D6A32e969e6e35E98) |
| :logos-fantom: `Fantom`         | [0x5ffe7FB82894076ECB99A30D6A32e969e6e35E98](https://ftmscout.com/address/0x5ffe7FB82894076ECB99A30D6A32e969e6e35E98) |
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
| :logos-xlayer: `X-Layer`        | [0x5ffe7fb82894076ecb99a30d6a32e969e6e35e98](https://www.okx.com/web3/explorer/xlayer/address/0x5ffe7fb82894076ecb99a30d6a32e969e6e35e98/) |
| :logos-zksync: `zk-Sync`        | [0x54A5a69e17Aa6eB89d77aa3828E38C9Eb4fF263D](https://era.zksync.network/address/0x54A5a69e17Aa6eB89d77aa3828E38C9Eb4fF263D) |


---


## **Meta Registry**

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


## **Rate Provider**

Contract functionality is documented here: [`RateProvider`](../integration/rate-provider.md)

!!!github
    The source code for the `RateProvider.vy` can be found on [:material-github: GitHub](https://github.com/curvefi/metaregistry/blob/main/contracts/RateProvider.vy).

Each `RateProvider` is integrated into the chain-specific [`AddressProvider`](#address-provider) at `ID = 18`.

*For example, to query the `RateProvider` contract on Ethereum, one can call `get_address(18)` on the `AddressProvider`:*

```py
>>> AddressProvider.get_address(18)
'0xA834f3d23749233c9B61ba723588570A1cCA0Ed7'
```


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
| `Math`      | [0xc9CBC565A9F4120a2740ec6f64CC24AeB2bB3E5E](https://etherscan.io/address/0xc9CBC565A9F4120a2740ec6f64CC24AeB2bB3E5E) |
| `Views`     | [0xFF53042865dF617de4bB871bD0988E7B93439cCF](https://etherscan.io/address/0xFF53042865dF617de4bB871bD0988E7B93439cCF) |
| `Factory`   | [0x6A8cbed756804B16E05E741eDaBd5cB544AE21bf](https://etherscan.io/address/0x6A8cbed756804B16E05E741eDaBd5cB544AE21bf) |
| `Gauge`     | [0x38D9BdA812da2C68dFC6aDE85A7F7a54E77F8325](https://etherscan.io/address/0x38D9BdA812da2C68dFC6aDE85A7F7a54E77F8325) |
| `Plain AMM` | [0xDCc91f930b42619377C200BA05b7513f2958b202](https://etherscan.io/address/0xDCc91f930b42619377C200BA05b7513f2958b202) |
| `Meta AMM`  | [0xede71F77d7c900dCA5892720E76316C6E575F0F7](https://etherscan.io/address/0xede71F77d7c900dCA5892720E76316C6E575F0F7) |


**:logos-ethereum: Ethereum Sepolia**

| Contract Type | Contract Address |
| :---------: | :----------------: |
| `Math`      | [0x2cad7b3e78e10bcbf2cc443ddd69ca8bcc09a758](https://sepolia.etherscan.io/address/0x2cad7b3e78e10bcbf2cc443ddd69ca8bcc09a758) |
| `Views`     | - |
| `Factory`   | [0xfb37b8D939FFa77114005e61CFc2e543d6F49A81](https://sepolia.etherscan.io/address/0xfb37b8D939FFa77114005e61CFc2e543d6F49A81) |
| `Plain AMM` | [0xE12374F193f91f71CE40D53E0db102eBaA9098D5](https://sepolia.etherscan.io/address/0xE12374F193f91f71CE40D53E0db102eBaA9098D5) |
| `Meta AMM`  | [0xB00E89EaBD59cD3254c88E390103Cf17E914f678](https://sepolia.etherscan.io/address/0xB00E89EaBD59cD3254c88E390103Cf17E914f678) |


**:logos-arbitrum: Arbitrum**

| Contract Type | Contract Address |
| :---------: | :----------------: |
| `Math`      | [0xD4a8bd4d59d65869E99f20b642023a5015619B34](https://arbiscan.io/address/0xD4a8bd4d59d65869E99f20b642023a5015619B34) |
| `Views`     | [0xDD7EBB1C49780519dD9755B8B1A23a6f42CE099E](https://arbiscan.io/address/0xDD7EBB1C49780519dD9755B8B1A23a6f42CE099E) |
| `Factory`   | [0x9AF14D26075f142eb3F292D5065EB3faa646167b](https://arbiscan.io/address/0x9AF14D26075f142eb3F292D5065EB3faa646167b) |
| `Plain AMM` | [0xf6841C27fe35ED7069189aFD5b81513578AFD7FF](https://arbiscan.io/address/0xf6841C27fe35ED7069189aFD5b81513578AFD7FF) |
| `Meta AMM`  | [0xFf02cBD91F57A778Bab7218DA562594a680B8B61](https://arbiscan.io/address/0xFf02cBD91F57A778Bab7218DA562594a680B8B61) |


**:logos-optimism: Optimism**

| Contract Type | Contract Address |
| :---------: | :----------------: |
| `Math`      | [0xa7b9d886A9a374A1C86DC52d2BA585c5CDFdac26](https://optimistic.etherscan.io/address/0xa7b9d886A9a374A1C86DC52d2BA585c5CDFdac26) |
| `Views`     | [0xbC7654d2DD901AaAa3BE4Cb5Bc0f10dEA9f96443](https://optimistic.etherscan.io/address/0xbC7654d2DD901AaAa3BE4Cb5Bc0f10dEA9f96443) |
| `Factory`   | [0x5eeE3091f747E60a045a2E715a4c71e600e31F6E](https://optimistic.etherscan.io/address/0x5eeE3091f747E60a045a2E715a4c71e600e31F6E) |
| `Plain AMM` | [0x635742dCC8313DCf8c904206037d962c042EAfBd](https://optimistic.etherscan.io/address/0x635742dCC8313DCf8c904206037d962c042EAfBd) |
| `Meta AMM`  | [0x5702BDB1Ec244704E3cBBaAE11a0275aE5b07499](https://optimistic.etherscan.io/address/0x5702BDB1Ec244704E3cBBaAE11a0275aE5b07499) |


**:logos-base: Base**

| Contract Type | Contract Address |
| :---------: | :----------------: |
| `Math`      | [0xe265FC390E9129b7E337Da23cD42E00C34Da2CE3](https://basescan.org/address/0xe265FC390E9129b7E337Da23cD42E00C34Da2CE3) |
| `Views`     | [0xA54f3c1DFa5f7DbF2564829d14b3B74a65d26Ae2](https://basescan.org/address/0xA54f3c1DFa5f7DbF2564829d14b3B74a65d26Ae2) |
| `Factory`   | [0xd2002373543Ce3527023C75e7518C274A51ce712](https://basescan.org/address/0xd2002373543Ce3527023C75e7518C274A51ce712) |
| `Plain AMM` | [0xf3A6aa40cf048a3960E9664847E9a7be025a390a](https://basescan.org/address/0xf3A6aa40cf048a3960E9664847E9a7be025a390a) |
| `Meta AMM`  | [0x635742dCC8313DCf8c904206037d962c042EAfBd](https://basescan.org/address/0x635742dCC8313DCf8c904206037d962c042EAfBd) |


**:logos-fraxtal: Fraxtal**

| Contract Type | Contract Address |
| :---------: | :----------------: |
| `Math`      | [0x506F594ceb4E33F5161139bAe3Ee911014df9f7f](https://fraxscan.com/address/0x506F594ceb4E33F5161139bAe3Ee911014df9f7f) |
| `Views`     | [0xeEcCd039d7228530D5F0c3ce7291Dd9677CCFFb1](https://fraxscan.com/address/0xeEcCd039d7228530D5F0c3ce7291Dd9677CCFFb1) |
| `Factory`   | [0xd2002373543Ce3527023C75e7518C274A51ce712](https://fraxscan.com/address/0xd2002373543Ce3527023C75e7518C274A51ce712) |
| `Plain AMM` | [0x1764ee18e8B3ccA4787249Ceb249356192594585](https://fraxscan.com/address/0x1764ee18e8B3ccA4787249Ceb249356192594585) |
| `Meta AMM`  | [0x5eeE3091f747E60a045a2E715a4c71e600e31F6E](https://fraxscan.com/address/0x5eeE3091f747E60a045a2E715a4c71e600e31F6E) |


**:logos-polygon: Polygon**

| Contract Type | Contract Address |
| :---------: | :----------------: |
| `Math`      | [0xd7E72f3615aa65b92A4DBdC211E296a35512988B](https://polygonscan.com/address/0xd7E72f3615aa65b92A4DBdC211E296a35512988B) |
| `Views`     | [0xf2eff2Cd0d9C82b7b2f17FbBed703fA7931dB1da](https://polygonscan.com/address/0xf2eff2Cd0d9C82b7b2f17FbBed703fA7931dB1da) |
| `Factory`   | [0x1764ee18e8B3ccA4787249Ceb249356192594585](https://polygonscan.com/address/0x1764ee18e8B3ccA4787249Ceb249356192594585) |
| `Plain AMM` | [0xe265FC390E9129b7E337Da23cD42E00C34Da2CE3](https://polygonscan.com/address/0xe265FC390E9129b7E337Da23cD42E00C34Da2CE3) |
| `Meta AMM`  | [0xa7b9d886A9a374A1C86DC52d2BA585c5CDFdac26](https://polygonscan.com/address/0xa7b9d886A9a374A1C86DC52d2BA585c5CDFdac26) |


**:logos-polygon: Polygon zk-EVM**

| Contract Type | Contract Address |
| :---------: | :----------------: |
| `Math`      | [0xe265FC390E9129b7E337Da23cD42E00C34Da2CE3](https://zkevm.polygonscan.com/address/0xe265FC390E9129b7E337Da23cD42E00C34Da2CE3) |
| `Views`     | [0xB6845b562F01eB02ef20CBB63553d2a768e5a1Cb](https://zkevm.polygonscan.com/address/0xB6845b562F01eB02ef20CBB63553d2a768e5a1Cb) |
| `Factory`   | [0xd2002373543Ce3527023C75e7518C274A51ce712](https://zkevm.polygonscan.com/address/0xd2002373543Ce3527023C75e7518C274A51ce712) |
| `Plain AMM` | [0xf3A6aa40cf048a3960E9664847E9a7be025a390a](https://zkevm.polygonscan.com/address/0xf3A6aa40cf048a3960E9664847E9a7be025a390a) |
| `Meta AMM`  | [0x635742dCC8313DCf8c904206037d962c042EAfBd](https://zkevm.polygonscan.com/address/0x635742dCC8313DCf8c904206037d962c042EAfBd) |


**:logos-gnosis: Gnosis**

| Contract Type | Contract Address |
| :---------: | :----------------: |
| `Math`      | [0xFAbC421e3368D158d802684A217a83c083c94CeB](https://gnosisscan.io/address/0xFAbC421e3368D158d802684A217a83c083c94CeB) |
| `Views`     | [0xa0EC67a3C483674f77915893346A8CA3AbE2b785](https://gnosisscan.io/address/0xa0EC67a3C483674f77915893346A8CA3AbE2b785) |
| `Factory`   | [0xbC0797015fcFc47d9C1856639CaE50D0e69FbEE8](https://gnosisscan.io/address/0xbC0797015fcFc47d9C1856639CaE50D0e69FbEE8) |
| `Plain AMM` | [0x3d6cb2f6dcf47cdd9c13e4e3beae9af041d8796a](https://gnosisscan.io/address/0x3d6cb2f6dcf47cdd9c13e4e3beae9af041d8796a) |
| `Meta AMM`  | [0xC1b393EfEF38140662b91441C6710Aa704973228](https://gnosisscan.io/address/0xC1b393EfEF38140662b91441C6710Aa704973228) |


**:logos-avalanche: Avalanche**

| Contract Type | Contract Address |
| :---------: | :----------------: |
| `Math`      | [0xd7E72f3615aa65b92A4DBdC211E296a35512988B](https://snowscan.xyz/address/0xd7E72f3615aa65b92A4DBdC211E296a35512988B) |
| `Views`     | [0xe548590f9fAe7a23EA6501b144B0D58b74Fc4B53](https://snowscan.xyz/address/0xe548590f9fAe7a23EA6501b144B0D58b74Fc4B53) |
| `Factory`   | [0x1764ee18e8B3ccA4787249Ceb249356192594585](https://snowscan.xyz/address/0x1764ee18e8B3ccA4787249Ceb249356192594585) |
| `Plain AMM` | [0xe265FC390E9129b7E337Da23cD42E00C34Da2CE3](https://snowscan.xyz/address/0xe265FC390E9129b7E337Da23cD42E00C34Da2CE3) |
| `Meta AMM`  | [0xa7b9d886A9a374A1C86DC52d2BA585c5CDFdac26](https://snowscan.xyz/address/0xa7b9d886A9a374A1C86DC52d2BA585c5CDFdac26) |


**:logos-fantom: Fantom**

| Contract Type | Contract Address |
| :---------: | :----------------: |
| `Math`      | [0xf3A6aa40cf048a3960E9664847E9a7be025a390a](https://ftmscout.com/address/0xf3A6aa40cf048a3960E9664847E9a7be025a390a) |
| `Views`     | [0x33e72383472f77B0C6d8F791D1613C75aE2C5915](https://ftmscout.com/address/0x33e72383472f77B0C6d8F791D1613C75aE2C5915) |
| `Factory`   | [0xe61Fb97Ef6eBFBa12B36Ffd7be785c1F5A2DE66b](https://ftmscout.com/address/0xe61Fb97Ef6eBFBa12B36Ffd7be785c1F5A2DE66b) |
| `Plain AMM` | [0x5702BDB1Ec244704E3cBBaAE11a0275aE5b07499](https://ftmscout.com/address/0x5702BDB1Ec244704E3cBBaAE11a0275aE5b07499) |
| `Meta AMM`  | [0x046207cB759F527b6c10C2D61DBaca45513685CC](https://ftmscout.com/address/0x046207cB759F527b6c10C2D61DBaca45513685CC) |


**:logos-bsc: Binance Smart Chain**

| Contract Type | Contract Address |
| :---------: | :----------------: |
| `Math`      | [0x166c4084Ad2434E8F2425C64dabFE6875A0D45c5](https://bscscan.com/address/0x166c4084Ad2434E8F2425C64dabFE6875A0D45c5) |
| `Views`     | [0xbC7654d2DD901AaAa3BE4Cb5Bc0f10dEA9f96443](https://bscscan.com/address/0xbC7654d2DD901AaAa3BE4Cb5Bc0f10dEA9f96443) |
| `Factory`   | [0xd7E72f3615aa65b92A4DBdC211E296a35512988B](https://bscscan.com/address/0xd7E72f3615aa65b92A4DBdC211E296a35512988B) |
| `Plain AMM` | [0x505d666E4DD174DcDD7FA090ed95554486d2Be44](https://bscscan.com/address/0x505d666E4DD174DcDD7FA090ed95554486d2Be44) |
| `Meta AMM`  | [0x5a8C93EE12a8Df4455BA111647AdA41f29D5CfcC](https://bscscan.com/address/0x5a8C93EE12a8Df4455BA111647AdA41f29D5CfcC) |


**:logos-linea: Linea**

| Contract Type | Contract Address |
| :---------: | :----------------: |
| `Math`      | [0xbC0797015fcFc47d9C1856639CaE50D0e69FbEE8](https://lineascan.build/address/0xbC0797015fcFc47d9C1856639CaE50D0e69FbEE8) |
| `Views`     | [0xB6845b562F01eB02ef20CBB63553d2a768e5a1Cb](https://lineascan.build/address/0xB6845b562F01eB02ef20CBB63553d2a768e5a1Cb) |
| `Factory`   | [0x5eeE3091f747E60a045a2E715a4c71e600e31F6E](https://lineascan.build/address/0x5eeE3091f747E60a045a2E715a4c71e600e31F6E) |
| `Plain AMM` | [0xa7b9d886a9a374a1c86dc52d2ba585c5cdfdac26](https://lineascan.build/address/0xa7b9d886a9a374a1c86dc52d2ba585c5cdfdac26) |
| `Meta AMM`  | [0xf3a6aa40cf048a3960e9664847e9a7be025a390a](https://lineascan.build/address/0xf3a6aa40cf048a3960e9664847e9a7be025a390a) |


**:logos-scroll: Scroll**

| Contract Type | Contract Address |
| :---------: | :----------------: |
| `Math`      | [0xbC0797015fcFc47d9C1856639CaE50D0e69FbEE8](https://scrollscan.com/address/0xbC0797015fcFc47d9C1856639CaE50D0e69FbEE8) |
| `Views`     | [0x3f445D38E820c010a7A6E33c5F80cBEBE6930f61](https://scrollscan.com/address/0x3f445D38E820c010a7A6E33c5F80cBEBE6930f61) |
| `Factory`   | [0x5eeE3091f747E60a045a2E715a4c71e600e31F6E](https://scrollscan.com/address/0x5eeE3091f747E60a045a2E715a4c71e600e31F6E) |
| `Plain AMM`   | [0xa7b9d886A9a374A1C86DC52d2BA585c5CDFdac26](https://scrollscan.com/address/0xa7b9d886A9a374A1C86DC52d2BA585c5CDFdac26) |
| `Meta AMM`   | [0xf3A6aa40cf048a3960E9664847E9a7be025a390a](https://scrollscan.com/address/0xf3A6aa40cf048a3960E9664847E9a7be025a390a) |


**:logos-mantle: Mantle**

| Contract Type | Contract Address |
| :---------: | :----------------: |
| `Math`      | [0x8b3EFBEfa6eD222077455d6f0DCdA3bF4f3F57A6](https://mantlescan.xyz/address/0x8b3EFBEfa6eD222077455d6f0DCdA3bF4f3F57A6) |
| `Views`     | [0xFf02cBD91F57A778Bab7218DA562594a680B8B61](https://mantlescan.xyz/address/0xFf02cBD91F57A778Bab7218DA562594a680B8B61) |
| `Factory`   | [0x5eeE3091f747E60a045a2E715a4c71e600e31F6E](https://mantlescan.xyz/address/0x5eeE3091f747E60a045a2E715a4c71e600e31F6E) |
| `Plain AMM` | [0x87FE17697D0f14A222e8bEf386a0860eCffDD617](https://mantlescan.xyz/address/0x87FE17697D0f14A222e8bEf386a0860eCffDD617) |
| `Meta AMM`  | [0x1764ee18e8B3ccA4787249Ceb249356192594585](https://mantlescan.xyz/address/0x1764ee18e8B3ccA4787249Ceb249356192594585) |


**:logos-celo: Celo**

| Contract Type | Contract Address |
| :---------: | :----------------: |
| `Math`      | [0xd7E72f3615aa65b92A4DBdC211E296a35512988B](https://celoscan.io/address/0xd7E72f3615aa65b92A4DBdC211E296a35512988B) |
| `Views`     | [0xA54f3c1DFa5f7DbF2564829d14b3B74a65d26Ae2](https://celoscan.io/address/0xA54f3c1DFa5f7DbF2564829d14b3B74a65d26Ae2) |
| `Factory`   | [0x1764ee18e8B3ccA4787249Ceb249356192594585](https://celoscan.io/address/0x1764ee18e8B3ccA4787249Ceb249356192594585) |
| `Plain AMM` | [0xe265FC390E9129b7E337Da23cD42E00C34Da2CE3](https://celoscan.io/address/0xe265FC390E9129b7E337Da23cD42E00C34Da2CE3) |
| `Meta AMM`  | [0xa7b9d886A9a374A1C86DC52d2BA585c5CDFdac26](https://celoscan.io/address/0xa7b9d886A9a374A1C86DC52d2BA585c5CDFdac26) |


**:logos-kava: Kava**

| Contract Type | Contract Address |
| :---------: | :----------------: |
| `Math`      | [0xd7E72f3615aa65b92A4DBdC211E296a35512988B](https://kavascan.com/address/0xd7E72f3615aa65b92A4DBdC211E296a35512988B) |
| `Views`     | [0xB6845b562F01eB02ef20CBB63553d2a768e5a1Cb](https://kavascan.com/address/0xB6845b562F01eB02ef20CBB63553d2a768e5a1Cb) |
| `Factory`   | [0x1764ee18e8B3ccA4787249Ceb249356192594585](https://kavascan.com/address/0x1764ee18e8B3ccA4787249Ceb249356192594585) |
| `Plain AMM` | [0xe265FC390E9129b7E337Da23cD42E00C34Da2CE3](https://kavascan.com/address/0xe265FC390E9129b7E337Da23cD42E00C34Da2CE3) |
| `Meta AMM`  | [0xa7b9d886A9a374A1C86DC52d2BA585c5CDFdac26](https://kavascan.com/address/0xa7b9d886A9a374A1C86DC52d2BA585c5CDFdac26) |


**:logos-aurora: Aurora**

| Contract Type | Contract Address |
| :---------: | :----------------: |
| `Math`      | [0xbC0797015fcFc47d9C1856639CaE50D0e69FbEE8](https://explorer.aurora.dev/address/0xbC0797015fcFc47d9C1856639CaE50D0e69FbEE8) |
| `Views`     | [0xD4a8bd4d59d65869E99f20b642023a5015619B34](https://explorer.aurora.dev/address/0xD4a8bd4d59d65869E99f20b642023a5015619B34) |
| `Factory`   | [0x5eeE3091f747E60a045a2E715a4c71e600e31F6E](https://explorer.aurora.dev/address/0x5eeE3091f747E60a045a2E715a4c71e600e31F6E) |
| `Plain AMM` | [0xa7b9d886A9a374A1C86DC52d2BA585c5CDFdac26](https://explorer.aurora.dev/address/0xa7b9d886A9a374A1C86DC52d2BA585c5CDFdac26) |
| `Meta AMM`  | [0xf3A6aa40cf048a3960E9664847E9a7be025a390a](https://explorer.aurora.dev/address/0xf3A6aa40cf048a3960E9664847E9a7be025a390a) |


**:logos-xlayer: X-Layer**

| Contract Type | Contract Address |
| :---------: | :----------------: |
| `Math`      | [0x8b3efbefa6ed222077455d6f0dcda3bf4f3f57a6](https://www.oklink.com/xlayer/address/0x8b3efbefa6ed222077455d6f0dcda3bf4f3f57a6) |
| `Views`     | [0xb47988aD49DCE8D909c6f9Cf7B26caF04e1445c8](https://www.oklink.com/xlayer/address/0xb47988aD49DCE8D909c6f9Cf7B26caF04e1445c8) |
| `Factory`   | [0x5eeE3091f747E60a045a2E715a4c71e600e31F6E](https://www.oklink.com/xlayer/address/0x5eeE3091f747E60a045a2E715a4c71e600e31F6E) |
| `Plain AMM` | [0x87fe17697d0f14a222e8bef386a0860ecffdd617](https://www.oklink.com/xlayer/address/0x87fe17697d0f14a222e8bef386a0860ecffdd617) |
| `Meta AMM`  | [0x1764ee18e8b3cca4787249ceb249356192594585](https://www.oklink.com/xlayer/address/0x1764ee18e8b3cca4787249ceb249356192594585) |


**:logos-zksync: zk-Sync**

| Contract Type | Contract Address |
| :---------: | :----------------: |
| `Math`      | [0xcf19236e85000901dE2Fad3199aA4A1F74a78B6C](https://era.zksync.network/address/0xcf19236e85000901dE2Fad3199aA4A1F74a78B6C) |
| `Views`     | [0xeF62cD5CBa8B040827B648dBc6a755ddeeb84E65](https://era.zksync.network/address/0xeF62cD5CBa8B040827B648dBc6a755ddeeb84E65) |
| `Factory`   | [0x375444aeDEb6C3db897f293E1DBa85D7422A6859](https://era.zksync.network/address/0x375444aeDEb6C3db897f293E1DBa85D7422A6859) |
| `Plain AMM` | [0x3ce3009F8ad07161BA9d02d7A0173180d0281cA4](https://era.zksync.network/address/0x3ce3009F8ad07161BA9d02d7A0173180d0281cA4) |
| `Meta AMM`  | [0x1E9A82C2a3DF2E0793a2B828aA652Db192f3C8F3](https://era.zksync.network/address/0x1E9A82C2a3DF2E0793a2B828aA652Db192f3C8F3) |


**:logos-tron: Tron**

| Contract Type | Contract Address |
| :---------: | :----------------: |
| `Math`      | *soon*             |
| `Views`     | *soon*             |
| `Factory`   | *soon*             |
| `Plain AMM` | *soon*             |
| `Meta AMM`  | *soon*             |


---


## **Twocrypto-NG**

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
| `Math`      | [0x1Fd8Af16DC4BEBd950521308D55d0543b6cDF4A1](https://etherscan.io/address/0x1Fd8Af16DC4BEBd950521308D55d0543b6cDF4A1#code) |
| `Views`     | [0x07CdEBF81977E111B08C126DEFA07818d0045b80](https://etherscan.io/address/0x07CdEBF81977E111B08C126DEFA07818d0045b80#code) |
| `Factory`   | [0x98EE851a00abeE0d95D08cF4CA2BdCE32aeaAF7F](https://etherscan.io/address/0x98EE851a00abeE0d95D08cF4CA2BdCE32aeaAF7F#code) |
| `Gauge`     | [0x38D9BdA812da2C68dFC6aDE85A7F7a54E77F8325](https://etherscan.io/address/0x38D9BdA812da2C68dFC6aDE85A7F7a54E77F8325#code) |
| `AMM`       | [0x934791f7F391727db92BFF94cd789c4623d14c52](https://etherscan.io/address/0x934791f7F391727db92BFF94cd789c4623d14c52#code) |


**:logos-ethereum: Ethereum Sepolia**

| Contract Type | Contract Address |
| :---------: | :----------------: |
| `Math`      | [0x2005995a71243be9FB995DaB4742327dc76564Df](https://sepolia.etherscan.io/address/0x2005995a71243be9FB995DaB4742327dc76564Df) |
| `Views`     | [0x07CdEBF81977E111B08C126DEFA07818d0045b80](https://sepolia.etherscan.io/address/0x07CdEBF81977E111B08C126DEFA07818d0045b80) |
| `Factory`   | [0x98EE851a00abeE0d95D08cF4CA2BdCE32aeaAF7F](https://sepolia.etherscan.io/address/0x98EE851a00abeE0d95D08cF4CA2BdCE32aeaAF7F) |
| `AMM`       | [0x04Fd6beC7D45EFA99a27D29FB94b55c56dD07223](https://sepolia.etherscan.io/address/0x04Fd6beC7D45EFA99a27D29FB94b55c56dD07223) |


**:logos-arbitrum: Arbitrum**

| Contract Type | Contract Address |
| :---------: | :----------------: |
| `Math`      | [0x1Fd8Af16DC4BEBd950521308D55d0543b6cDF4A1](https://arbiscan.io/address/0x1Fd8Af16DC4BEBd950521308D55d0543b6cDF4A1) |
| `Views`     | [0x07CdEBF81977E111B08C126DEFA07818d0045b80](https://arbiscan.io/address/0x07CdEBF81977E111B08C126DEFA07818d0045b80) |
| `Factory`   | [0x98EE851a00abeE0d95D08cF4CA2BdCE32aeaAF7F](https://arbiscan.io/address/0x98EE851a00abeE0d95D08cF4CA2BdCE32aeaAF7F) |
| `AMM`       | [0x934791f7F391727db92BFF94cd789c4623d14c52](https://arbiscan.io/address/0x934791f7F391727db92BFF94cd789c4623d14c52) |


**:logos-optimism: Optimism**

| Contract Type | Contract Address |
| :---------: | :----------------: |
| `Math`      | [0x1Fd8Af16DC4BEBd950521308D55d0543b6cDF4A1](https://optimistic.etherscan.io/address/0x1Fd8Af16DC4BEBd950521308D55d0543b6cDF4A1) |
| `Views`     | [0x07CdEBF81977E111B08C126DEFA07818d0045b80](https://optimistic.etherscan.io/address/0x07CdEBF81977E111B08C126DEFA07818d0045b80) |
| `Factory`   | [0x98EE851a00abeE0d95D08cF4CA2BdCE32aeaAF7F](https://optimistic.etherscan.io/address/0x98EE851a00abeE0d95D08cF4CA2BdCE32aeaAF7F) |
| `AMM`       | [0x934791f7F391727db92BFF94cd789c4623d14c52](https://optimistic.etherscan.io/address/0x934791f7F391727db92BFF94cd789c4623d14c52) |


**:logos-base: Base**

| Contract Type | Contract Address |
| :---------: | :----------------: |
| `Math`      | [0x1Fd8Af16DC4BEBd950521308D55d0543b6cDF4A1](https://basescan.org/address/0x1Fd8Af16DC4BEBd950521308D55d0543b6cDF4A1) |
| `Views`     | [0xd3B17f862956464ae4403cCF829CE69199856e1e](https://basescan.org/address/0xd3B17f862956464ae4403cCF829CE69199856e1e) |
| `Factory`   | [0xc9Fe0C63Af9A39402e8a5514f9c43Af0322b665F](https://basescan.org/address/0xc9Fe0C63Af9A39402e8a5514f9c43Af0322b665F) |
| `AMM`       | [0x934791f7F391727db92BFF94cd789c4623d14c52](https://basescan.org/address/0x934791f7F391727db92BFF94cd789c4623d14c52) |


**:logos-fraxtal: Fraxtal**

| Contract Type | Contract Address |
| :---------: | :----------------: |
| `Math`      | [0x1Fd8Af16DC4BEBd950521308D55d0543b6cDF4A1](https://fraxscan.com/address/0x1Fd8Af16DC4BEBd950521308D55d0543b6cDF4A1) |
| `Views`     | [0x07CdEBF81977E111B08C126DEFA07818d0045b80](https://fraxscan.com/address/0x07CdEBF81977E111B08C126DEFA07818d0045b80) |
| `Factory`   | [0x98EE851a00abeE0d95D08cF4CA2BdCE32aeaAF7F](https://fraxscan.com/address/0x98EE851a00abeE0d95D08cF4CA2BdCE32aeaAF7F) |
| `AMM`       | [0x934791f7F391727db92BFF94cd789c4623d14c52](https://fraxscan.com/address/0x934791f7F391727db92BFF94cd789c4623d14c52) |


**:logos-polygon: Polygon**

| Contract Type | Contract Address |
| :---------: | :----------------: |
| `Math`      | [0x1Fd8Af16DC4BEBd950521308D55d0543b6cDF4A1](https://polygonscan.com//address/0x1Fd8Af16DC4BEBd950521308D55d0543b6cDF4A1) |
| `Views`     | [0x07CdEBF81977E111B08C126DEFA07818d0045b80](https://polygonscan.com/address/0x07CdEBF81977E111B08C126DEFA07818d0045b80) |
| `Factory`   | [0x98EE851a00abeE0d95D08cF4CA2BdCE32aeaAF7F](https://polygonscan.com/address/0x98EE851a00abeE0d95D08cF4CA2BdCE32aeaAF7F) |
| `AMM`       | [0x934791f7F391727db92BFF94cd789c4623d14c52](https://polygonscan.com/address/0x934791f7F391727db92BFF94cd789c4623d14c52) |


**:logos-polygon: Polygon zk-EVM**

| Contract Type | Contract Address |
| :---------: | :----------------: |
| `Math`      | [0x1Fd8Af16DC4BEBd950521308D55d0543b6cDF4A1](https://zkevm.polygonscan.com/address/0x1Fd8Af16DC4BEBd950521308D55d0543b6cDF4A1) |
| `Views`     | [0x07CdEBF81977E111B08C126DEFA07818d0045b80](https://zkevm.polygonscan.com/address/0x07CdEBF81977E111B08C126DEFA07818d0045b80) |
| `Factory`   | [0x98EE851a00abeE0d95D08cF4CA2BdCE32aeaAF7F](https://zkevm.polygonscan.com/address/0x98EE851a00abeE0d95D08cF4CA2BdCE32aeaAF7F) |
| `AMM`       | [0x934791f7F391727db92BFF94cd789c4623d14c52](https://zkevm.polygonscan.com/address/0x934791f7F391727db92BFF94cd789c4623d14c52) |


**:logos-gnosis: Gnosis**

| Contract Type | Contract Address |
| :---------: | :----------------: |
| `Math`      | [0x1Fd8Af16DC4BEBd950521308D55d0543b6cDF4A1](https://gnosisscan.io/address/0x1Fd8Af16DC4BEBd950521308D55d0543b6cDF4A1) |
| `Views`     | [0x07CdEBF81977E111B08C126DEFA07818d0045b80](https://gnosisscan.io/address/0x07CdEBF81977E111B08C126DEFA07818d0045b80) |
| `Factory`   | [0x98EE851a00abeE0d95D08cF4CA2BdCE32aeaAF7F](https://gnosisscan.io/address/0x98EE851a00abeE0d95D08cF4CA2BdCE32aeaAF7F) |
| `AMM`       | [0x934791f7F391727db92BFF94cd789c4623d14c52](https://gnosisscan.io/address/0x934791f7F391727db92BFF94cd789c4623d14c52) |


**:logos-avalanche: Avalanche**

| Contract Type | Contract Address |
| :---------: | :----------------: |
| `Math`      | [0x1Fd8Af16DC4BEBd950521308D55d0543b6cDF4A1](https://snowscan.xyz/address/0x1Fd8Af16DC4BEBd950521308D55d0543b6cDF4A1) |
| `Views`     | [0x07CdEBF81977E111B08C126DEFA07818d0045b80](https://snowscan.xyz/address/0x07CdEBF81977E111B08C126DEFA07818d0045b80) |
| `Factory`   | [0x98EE851a00abeE0d95D08cF4CA2BdCE32aeaAF7F](https://snowscan.xyz/address/0x98EE851a00abeE0d95D08cF4CA2BdCE32aeaAF7F) |
| `AMM`       | [0x934791f7F391727db92BFF94cd789c4623d14c52](https://snowscan.xyz/address/0x934791f7F391727db92BFF94cd789c4623d14c52) |


**:logos-fantom: Fantom**

| Contract Type | Contract Address |
| :---------: | :----------------: |
| `Math`      | [0x1Fd8Af16DC4BEBd950521308D55d0543b6cDF4A1](https://ftmscout.com/address/0x1Fd8Af16DC4BEBd950521308D55d0543b6cDF4A1) |
| `Views`     | [0x07CdEBF81977E111B08C126DEFA07818d0045b80](https://ftmscout.com/address/0x07CdEBF81977E111B08C126DEFA07818d0045b80) |
| `Factory`   | [0x98EE851a00abeE0d95D08cF4CA2BdCE32aeaAF7F](https://ftmscout.com/address/0x98EE851a00abeE0d95D08cF4CA2BdCE32aeaAF7F) |
| `AMM`       | [0x934791f7F391727db92BFF94cd789c4623d14c52](https://ftmscout.com/address/0x934791f7F391727db92BFF94cd789c4623d14c52) |


**:logos-bsc: Binance Smart Chain**

| Contract Type | Contract Address |
| :---------: | :----------------: |
| `Math`      | [0x1Fd8Af16DC4BEBd950521308D55d0543b6cDF4A1](https://bscscan.com/address/0x1Fd8Af16DC4BEBd950521308D55d0543b6cDF4A1) |
| `Views`     | [0x07CdEBF81977E111B08C126DEFA07818d0045b80](https://bscscan.com/address/0x07CdEBF81977E111B08C126DEFA07818d0045b80) |
| `Factory`   | [0x98EE851a00abeE0d95D08cF4CA2BdCE32aeaAF7F](https://bscscan.com/address/0x98EE851a00abeE0d95D08cF4CA2BdCE32aeaAF7F) |
| `AMM`       | [0x934791f7F391727db92BFF94cd789c4623d14c52](https://bscscan.com/address/0x934791f7F391727db92BFF94cd789c4623d14c52) |



**:logos-linea: Linea**

| Contract Type | Contract Address |
| :---------: | :----------------: |
| `Math`      | [0x1Fd8Af16DC4BEBd950521308D55d0543b6cDF4A1](https://lineascan.build/address/0x1Fd8Af16DC4BEBd950521308D55d0543b6cDF4A1) |
| `Views`     | [0x07CdEBF81977E111B08C126DEFA07818d0045b80](https://lineascan.build/address/0x07CdEBF81977E111B08C126DEFA07818d0045b80) |
| `Factory`   | [0x98EE851a00abeE0d95D08cF4CA2BdCE32aeaAF7F](https://lineascan.build/address/0x98EE851a00abeE0d95D08cF4CA2BdCE32aeaAF7F) |
| `AMM`       | [0x934791f7F391727db92BFF94cd789c4623d14c52](https://lineascan.build/address/0x934791f7F391727db92BFF94cd789c4623d14c52) |


**:logos-scroll: Scroll**

| Contract Type | Contract Address |
| :---------: | :----------------: |
| `Math`      | [0x1Fd8Af16DC4BEBd950521308D55d0543b6cDF4A1](https://scrollscan.com/address/0x1Fd8Af16DC4BEBd950521308D55d0543b6cDF4A1) |
| `Views`     | [0x07CdEBF81977E111B08C126DEFA07818d0045b80](https://scrollscan.com/address/0x07CdEBF81977E111B08C126DEFA07818d0045b80) |
| `Factory`   | [0x98EE851a00abeE0d95D08cF4CA2BdCE32aeaAF7F](https://scrollscan.com/address/0x98EE851a00abeE0d95D08cF4CA2BdCE32aeaAF7F) |
| `AMM`       | [0x934791f7F391727db92BFF94cd789c4623d14c52](https://scrollscan.com/address/0x934791f7F391727db92BFF94cd789c4623d14c52) |


**:logos-mantle: Mantle**

| Contract Type | Contract Address |
| :---------: | :----------------: |
| `Math`      | [0x1Fd8Af16DC4BEBd950521308D55d0543b6cDF4A1](https://mantlescan.xyz/address/0x1Fd8Af16DC4BEBd950521308D55d0543b6cDF4A1) |
| `Views`     | [0x07CdEBF81977E111B08C126DEFA07818d0045b80](https://mantlescan.xyz/address/0x07CdEBF81977E111B08C126DEFA07818d0045b80) |
| `Factory`   | [0x98EE851a00abeE0d95D08cF4CA2BdCE32aeaAF7F](https://mantlescan.xyz/address/0x98EE851a00abeE0d95D08cF4CA2BdCE32aeaAF7F) |
| `AMM`       | [0x934791f7F391727db92BFF94cd789c4623d14c52](https://mantlescan.xyz/address/0x934791f7F391727db92BFF94cd789c4623d14c52) |


**:logos-celo: Celo**

| Contract Type | Contract Address |
| :---------: | :----------------: |
| `Math`      | [0x1Fd8Af16DC4BEBd950521308D55d0543b6cDF4A1](https://celoscan.io/address/0x1Fd8Af16DC4BEBd950521308D55d0543b6cDF4A1) |
| `Views`     | [0x07CdEBF81977E111B08C126DEFA07818d0045b80](https://celoscan.io/address/0x07CdEBF81977E111B08C126DEFA07818d0045b80) |
| `Factory`   | [0x98EE851a00abeE0d95D08cF4CA2BdCE32aeaAF7F](https://celoscan.io/address/0x98EE851a00abeE0d95D08cF4CA2BdCE32aeaAF7F) |
| `AMM`       | [0x934791f7F391727db92BFF94cd789c4623d14c52](https://celoscan.io/address/0x934791f7F391727db92BFF94cd789c4623d14c52) |


**:logos-kava: Kava**

| Contract Type | Contract Address |
| :---------: | :----------------: |
| `Math`      | [0x1Fd8Af16DC4BEBd950521308D55d0543b6cDF4A1](https://kavascan.com/address/0x1Fd8Af16DC4BEBd950521308D55d0543b6cDF4A1) |
| `Views`     | [0x0C9D8c7e486e822C29488Ff51BFf0167B4650953](https://kavascan.com/address/0x0C9D8c7e486e822C29488Ff51BFf0167B4650953) |
| `Factory`   | [0xd3B17f862956464ae4403cCF829CE69199856e1e](https://kavascan.com/address/0xd3B17f862956464ae4403cCF829CE69199856e1e) |
| `AMM`       | [0x934791f7F391727db92BFF94cd789c4623d14c52](https://kavascan.com/address/0x934791f7F391727db92BFF94cd789c4623d14c52) |


**:logos-aurora: Aurora**

| Contract Type | Contract Address |
| :---------: | :----------------: |
| `Math`      | [0x1Fd8Af16DC4BEBd950521308D55d0543b6cDF4A1](https://explorer.aurora.dev/address/0x1Fd8Af16DC4BEBd950521308D55d0543b6cDF4A1) |
| `Views`     | [0x07CdEBF81977E111B08C126DEFA07818d0045b80](https://explorer.aurora.dev/address/0x07CdEBF81977E111B08C126DEFA07818d0045b80) |
| `Factory`   | [0x98EE851a00abeE0d95D08cF4CA2BdCE32aeaAF7F](https://explorer.aurora.dev/address/0x98EE851a00abeE0d95D08cF4CA2BdCE32aeaAF7F) |
| `AMM`       | [0x934791f7F391727db92BFF94cd789c4623d14c52](https://explorer.aurora.dev/address/0x934791f7F391727db92BFF94cd789c4623d14c52) |


**:logos-xlayer: X-Layer**

| Contract Type | Contract Address |
| :---------: | :----------------: |
| `Math`      | [0x1Fd8Af16DC4BEBd950521308D55d0543b6cDF4A1](https://www.oklink.com/xlayer/address/0x1Fd8Af16DC4BEBd950521308D55d0543b6cDF4A1) |
| `Views`     | [0x5a8c93ee12a8df4455ba111647ada41f29d5cfcc](https://www.oklink.com/xlayer/address/0x5a8c93ee12a8df4455ba111647ada41f29d5cfcc) |
| `Factory`   | [0x0c59d36b23f809f8b6c7cb4c8c590a0ac103baef](https://www.oklink.com/xlayer/address/0x0c59d36b23f809f8b6c7cb4c8c590a0ac103baef) |
| `AMM`       | [0x934791f7F391727db92BFF94cd789c4623d14c52](https://www.oklink.com/xlayer/address/0x934791f7F391727db92BFF94cd789c4623d14c52) |


**:logos-zksync: zk-Sync**

| Contract Type | Contract Address |
| :---------: | :----------------: |
| `Math`      | [0x5AF4Fa25F76491F949C648AC439b1953df78f594](https://era.zksync.network/address/0x5AF4Fa25F76491F949C648AC439b1953df78f594) |
| `Views`     | [0xfe30c516c23504B6CF740de513390DC6943888d8](https://era.zksync.network/address/0xfe30c516c23504B6CF740de513390DC6943888d8) |
| `Factory`   | [0x24992A09E2257AF325102Cefa1F09E80E9062d49](https://era.zksync.network/address/0x24992A09E2257AF325102Cefa1F09E80E9062d49) |
| `AMM`       | [0x69949489645190D5C4e57a5B9e57705C57033EBb](https://era.zksync.network/address/0x69949489645190D5C4e57a5B9e57705C57033EBb) |


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
| `Math`      | [0x550574E33b81C45D3D69250b46Ae30c7bC40d330](https://sepolia.etherscan.io/address/0x550574E33b81C45D3D69250b46Ae30c7bC40d330) |
| `Views`     | [0x59AfCD3e931018dc493AA1d833B11bb5A0744906](https://sepolia.etherscan.io/address/0x59AfCD3e931018dc493AA1d833B11bb5A0744906) |
| `Factory`   | [0x4b00E8c997AeBACeEf6B8c6F89eE2bf99b2CA846](https://sepolia.etherscan.io/address/0x4b00E8c997AeBACeEf6B8c6F89eE2bf99b2CA846) |
| `AMM native disable` | [0x3BbA971980A721C7A33cEF62cE01c0d744F26e95](https://sepolia.etherscan.io/address/0x3BbA971980A721C7A33cEF62cE01c0d744F26e95) |
| `AMM native enabled` | [0xc9621394A73A071d8084CB9a15b04F182a7C9634](https://sepolia.etherscan.io/address/0xc9621394A73A071d8084CB9a15b04F182a7C9634) |


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
| `Math`      | [0x19bd1AB34d6ABB584b9C1D5519093bfAA7f6c7d2](https://optimistic.etherscan.io/address/0x19bd1AB34d6ABB584b9C1D5519093bfAA7f6c7d2) |
| `Views`     | [0x6A8cbed756804B16E05E741eDaBd5cB544AE21bf](https://optimistic.etherscan.io/address/0x6A8cbed756804B16E05E741eDaBd5cB544AE21bf) |
| `Factory`   | [0xc6C09471Ee39C7E30a067952FcC89c8922f9Ab53](https://optimistic.etherscan.io/address/0xc6C09471Ee39C7E30a067952FcC89c8922f9Ab53) |
| `AMM native disable` | [0x0458ea5F4CD00E873264Be2031Ceb8f9d9b3116c](https://optimistic.etherscan.io/address/0x0458ea5F4CD00E873264Be2031Ceb8f9d9b3116c) |
| `AMM native enabled` | [0x1FE2a06c8bd81AE65FD1C5036451890b37976369](https://optimistic.etherscan.io/address/0x1FE2a06c8bd81AE65FD1C5036451890b37976369) |



**:logos-base: Base**

| Contract Type | Contract Address |
| :---------: | :----------------: |
| `Math`      | [0x5373E1B9f2781099f6796DFe5D68DE59ac2F18E3](https://basescan.org/address/0x5373E1B9f2781099f6796DFe5D68DE59ac2F18E3) |
| `Views`     | [0x05d4E2Ed7216A204e5FB4e3F5187eCfaa5eF3Ef7](https://basescan.org/address/0x05d4E2Ed7216A204e5FB4e3F5187eCfaa5eF3Ef7) |
| `Factory`   | [0xA5961898870943c68037F6848d2D866Ed2016bcB](https://basescan.org/address/0xA5961898870943c68037F6848d2D866Ed2016bcB) |
| `AMM native disable` | [0x0c59d36b23f809f8b6C7cb4c8C590a0AC103baEf](https://basescan.org/address/0x0c59d36b23f809f8b6C7cb4c8C590a0AC103baEf) |
| `AMM native enabled` | [0xa274c88e09fDF1798a7517096557e6c1bEa1f65A](https://basescan.org/address/0xa274c88e09fDF1798a7517096557e6c1bEa1f65A) |


**:logos-fraxtal: Fraxtal**

| Contract Type | Contract Address |
| :---------: | :----------------: |
| `Math`      | [0x0C9D8c7e486e822C29488Ff51BFf0167B4650953](https://fraxscan.com/address/0x0C9D8c7e486e822C29488Ff51BFf0167B4650953) |
| `Views`     | [0x64379C265Fc6595065D7d835AAaa731c0584dB80](https://fraxscan.com/address/0x64379C265Fc6595065D7d835AAaa731c0584dB80) |
| `Factory`   | [0xc9Fe0C63Af9A39402e8a5514f9c43Af0322b665F](https://fraxscan.com/address/0xc9Fe0C63Af9A39402e8a5514f9c43Af0322b665F) |
| `AMM native disable` | [0x1A83348F9cCFD3Fe1A8C0adBa580Ac4e267Fe495](https://fraxscan.com/address/0x1A83348F9cCFD3Fe1A8C0adBa580Ac4e267Fe495) |
| `AMM native enabled` | [0xd3b17f862956464ae4403ccf829ce69199856e1e](https://fraxscan.com/address/0xd3b17f862956464ae4403ccf829ce69199856e1e) |


**:logos-polygon: Polygon**

| Contract Type | Contract Address |
| :---------: | :----------------: |
| `Math`      | [0x5a8C93EE12a8Df4455BA111647AdA41f29D5CfcC](https://polygonscan.com//address/0x5a8C93EE12a8Df4455BA111647AdA41f29D5CfcC) |
| `Views`     | [0xFAbC421e3368D158d802684A217a83c083c94CeB](https://polygonscan.com/address/0xFAbC421e3368D158d802684A217a83c083c94CeB) |
| `Factory`   | [0xC1b393EfEF38140662b91441C6710Aa704973228](https://polygonscan.com/address/0xC1b393EfEF38140662b91441C6710Aa704973228) |
| `AMM native disable` | [0x3d6cB2F6DcF47CDd9C13E4e3beAe9af041d8796a](https://polygonscan.com/address/0x3d6cB2F6DcF47CDd9C13E4e3beAe9af041d8796a) |
| `AMM native enabled` | [0x0c59d36b23f809f8b6C7cb4c8C590a0AC103baEf](https://polygonscan.com/address/0x0c59d36b23f809f8b6C7cb4c8C590a0AC103baEf) |


**:logos-polygon: Polygon zk-EVM**

| Contract Type | Contract Address |
| :---------: | :----------------: |
| `Math`      | [0xFAbC421e3368D158d802684A217a83c083c94CeB](https://zkevm.polygonscan.com/address/0xFAbC421e3368D158d802684A217a83c083c94CeB) |
| `Views`     | [0x0c59d36b23f809f8b6C7cb4c8C590a0AC103baEf](https://zkevm.polygonscan.com/address/0x0c59d36b23f809f8b6C7cb4c8C590a0AC103baEf) |
| `Factory`   | [0x76303e4fDcA0AbF28aB3ee42Ce086E6503431F1D](https://zkevm.polygonscan.com/address/0x76303e4fDcA0AbF28aB3ee42Ce086E6503431F1D) |
| `AMM native disable` | [0xC1b393EfEF38140662b91441C6710Aa704973228](https://zkevm.polygonscan.com/address/0xC1b393EfEF38140662b91441C6710Aa704973228) |
| `AMM native enabled` | [0x3d6cB2F6DcF47CDd9C13E4e3beAe9af041d8796a](https://zkevm.polygonscan.com/address/0x3d6cB2F6DcF47CDd9C13E4e3beAe9af041d8796a) |


**:logos-gnosis: Gnosis**

| Contract Type | Contract Address |
| :---------: | :----------------: |
| `Math`      | [0xff02cbd91f57a778bab7218da562594a680b8b61](https://gnosisscan.io/address/0xff02cbd91f57a778bab7218da562594a680b8b61) |
| `Views`     | [0xe548590f9fAe7a23EA6501b144B0D58b74Fc4B53](https://gnosisscan.io/address/0xe548590f9fAe7a23EA6501b144B0D58b74Fc4B53) |
| `Factory`   | [0xb47988ad49dce8d909c6f9cf7b26caf04e1445c8](https://gnosisscan.io/address/0xb47988ad49dce8d909c6f9cf7b26caf04e1445c8) |
| `AMM native disable` | [0x3f445D38E820c010a7A6E33c5F80cBEBE6930f61](https://gnosisscan.io/address/0x3f445D38E820c010a7A6E33c5F80cBEBE6930f61) |
| `AMM native enabled` | [0xa54f3c1dfa5f7dbf2564829d14b3b74a65d26ae2](https://gnosisscan.io/address/0xa54f3c1dfa5f7dbf2564829d14b3b74a65d26ae2) |


**:logos-avalanche: Avalanche**

| Contract Type | Contract Address |
| :---------: | :----------------: |
| `Math`      | [0x505d666E4DD174DcDD7FA090ed95554486d2Be44](https://snowscan.xyz/address/0x505d666E4DD174DcDD7FA090ed95554486d2Be44) |
| `Views`     | [0x5a8C93EE12a8Df4455BA111647AdA41f29D5CfcC](https://snowscan.xyz/address/0x5a8C93EE12a8Df4455BA111647AdA41f29D5CfcC) |
| `Factory`   | [0x3d6cB2F6DcF47CDd9C13E4e3beAe9af041d8796a](https://snowscan.xyz/address/0x3d6cB2F6DcF47CDd9C13E4e3beAe9af041d8796a) |
| `AMM native disable` | [0x0c59d36b23f809f8b6C7cb4c8C590a0AC103baEf](https://snowscan.xyz/address/0x0c59d36b23f809f8b6C7cb4c8C590a0AC103baEf) |
| `AMM native enabled` | [0xFAbC421e3368D158d802684A217a83c083c94CeB](https://snowscan.xyz/address/0xFAbC421e3368D158d802684A217a83c083c94CeB) |


**:logos-fantom: Fantom**

| Contract Type | Contract Address |
| :---------: | :----------------: |
| `Math`      | [0x3d6cB2F6DcF47CDd9C13E4e3beAe9af041d8796a](https://ftmscout.com/address/0x3d6cB2F6DcF47CDd9C13E4e3beAe9af041d8796a) |
| `Views`     | [0xC1b393EfEF38140662b91441C6710Aa704973228](https://ftmscout.com/address/0xC1b393EfEF38140662b91441C6710Aa704973228) |
| `Factory`   | [0x9AF14D26075f142eb3F292D5065EB3faa646167b](https://ftmscout.com/address/0x9AF14D26075f142eb3F292D5065EB3faa646167b) |
| `AMM native disable` | [0xd125E7a0cEddF89c6473412d85835450897be6Dc](https://ftmscout.com/address/0xd125E7a0cEddF89c6473412d85835450897be6Dc) |
| `AMM native enabled` | [0x76303e4fDcA0AbF28aB3ee42Ce086E6503431F1D](https://ftmscout.com/address/0x76303e4fDcA0AbF28aB3ee42Ce086E6503431F1D) |



**:logos-bsc: Binance Smart Chain**

| Contract Type | Contract Address |
| :---------: | :----------------: |
| `Math`      | [0x0cE651Df1418a1fBA98517483102E042533Ade05](https://bscscan.com/address/0x0cE651Df1418a1fBA98517483102E042533Ade05) |
| `Views`     | [0x645E12f3cf5504C8a08e01706e79d3D0f32EcE15](https://bscscan.com/address/0x645E12f3cf5504C8a08e01706e79d3D0f32EcE15) |
| `Factory`   | [0xc55837710bc500F1E3c7bb9dd1d51F7c5647E657](https://bscscan.com/address/0xc55837710bc500F1E3c7bb9dd1d51F7c5647E657) |
| `AMM native disable` | [0x6A8cbed756804B16E05E741eDaBd5cB544AE21bf](https://bscscan.com/address/0x6A8cbed756804B16E05E741eDaBd5cB544AE21bf) |
| `AMM native enabled` | [0xBff334F8D5912AC5c4f2c590A2396d1C5d990123](https://bscscan.com/address/0xBff334F8D5912AC5c4f2c590A2396d1C5d990123) |


**:logos-linea: Linea**

| Contract Type | Contract Address |
| :---------: | :----------------: |
| `Math`      | [0x0C9D8c7e486e822C29488Ff51BFf0167B4650953](https://lineascan.build/address/0x0C9D8c7e486e822C29488Ff51BFf0167B4650953) |
| `Views`     | [0x64379c265fc6595065d7d835aaaa731c0584db80](https://lineascan.build/address/0x64379c265fc6595065d7d835aaaa731c0584db80) |
| `Factory`   | [0xd125E7a0cEddF89c6473412d85835450897be6Dc](https://lineascan.build/address/0xd125E7a0cEddF89c6473412d85835450897be6Dc) |
| `AMM native disable` | [0x76303e4fDcA0AbF28aB3ee42Ce086E6503431F1D](https://lineascan.build/address/0x76303e4fDcA0AbF28aB3ee42Ce086E6503431F1D) |
| `AMM native enabled` | [0xC1b393EfEF38140662b91441C6710Aa704973228](https://lineascan.build/address/0xC1b393EfEF38140662b91441C6710Aa704973228) |


**:logos-scroll: Scroll**

| Contract Type | Contract Address |
| :---------: | :----------------: |
| `Math`      | [0x5a8C93EE12a8Df4455BA111647AdA41f29D5CfcC](https://scrollscan.com/address/0x5a8C93EE12a8Df4455BA111647AdA41f29D5CfcC) |
| `Views`     | [0xFAbC421e3368D158d802684A217a83c083c94CeB](https://scrollscan.com/address/0xFAbC421e3368D158d802684A217a83c083c94CeB) |
| `Factory`   | [0xC1b393EfEF38140662b91441C6710Aa704973228](https://scrollscan.com/address/0xC1b393EfEF38140662b91441C6710Aa704973228) |
| `AMM native disable` | [0x3d6cB2F6DcF47CDd9C13E4e3beAe9af041d8796a](https://scrollscan.com/address/0x3d6cB2F6DcF47CDd9C13E4e3beAe9af041d8796a) |
| `AMM native enabled` | [0x0c59d36b23f809f8b6C7cb4c8C590a0AC103baEf](https://scrollscan.com/address/0x0c59d36b23f809f8b6C7cb4c8C590a0AC103baEf) |


**:logos-mantle: Mantle**

| Contract Type | Contract Address |
| :---------: | :----------------: |
| `Math`      | [0x635742dCC8313DCf8c904206037d962c042EAfBd](https://mantlescan.xyz/address/0x635742dCC8313DCf8c904206037d962c042EAfBd) |
| `Views`     | [0x5702BDB1Ec244704E3cBBaAE11a0275aE5b07499](https://mantlescan.xyz/address/0x5702BDB1Ec244704E3cBBaAE11a0275aE5b07499) |
| `Factory`   | [0x0C9D8c7e486e822C29488Ff51BFf0167B4650953](https://mantlescan.xyz/address/0x0C9D8c7e486e822C29488Ff51BFf0167B4650953) |
| `AMM native disable` | [0x7Ca46A636b02D4aBC66883D7FF164bDE506DC66a](https://mantlescan.xyz/address/0x7Ca46A636b02D4aBC66883D7FF164bDE506DC66a) |
| `AMM native enable`  | [0x046207cB759F527b6c10C2D61DBaca45513685CC](https://mantlescan.xyz/address/0x046207cB759F527b6c10C2D61DBaca45513685CC) |


**:logos-celo: Celo**

| Contract Type | Contract Address |
| :---------: | :----------------: |
| `Math`      | [0x505d666E4DD174DcDD7FA090ed95554486d2Be44](https://celoscan.io/address/0x505d666E4DD174DcDD7FA090ed95554486d2Be44) |
| `Views`     | [0x5a8C93EE12a8Df4455BA111647AdA41f29D5CfcC](https://celoscan.io/address/0x5a8C93EE12a8Df4455BA111647AdA41f29D5CfcC) |
| `Factory`   | [0x3d6cB2F6DcF47CDd9C13E4e3beAe9af041d8796a](https://celoscan.io/address/0x3d6cB2F6DcF47CDd9C13E4e3beAe9af041d8796a) |
| `AMM native disable` | [0x0c59d36b23f809f8b6C7cb4c8C590a0AC103baEf](https://celoscan.io/address/0x0c59d36b23f809f8b6C7cb4c8C590a0AC103baEf) |
| `AMM native enabled` | [0xFAbC421e3368D158d802684A217a83c083c94CeB](https://celoscan.io/address/0xFAbC421e3368D158d802684A217a83c083c94CeB) |


**:logos-kava: Kava**

| Contract Type | Contract Address |
| :---------: | :----------------: |
| `Math`      | [0x505d666E4DD174DcDD7FA090ed95554486d2Be44](https://kavascan.com/address/0x505d666E4DD174DcDD7FA090ed95554486d2Be44) |
| `Views`     | [0x5a8C93EE12a8Df4455BA111647AdA41f29D5CfcC](https://kavascan.com/address/0x5a8C93EE12a8Df4455BA111647AdA41f29D5CfcC) |
| `Factory`   | [0x3d6cB2F6DcF47CDd9C13E4e3beAe9af041d8796a](https://kavascan.com/address/0x3d6cB2F6DcF47CDd9C13E4e3beAe9af041d8796a) |
| `AMM native disable` | [0x0c59d36b23f809f8b6C7cb4c8C590a0AC103baEf](https://kavascan.com/address/0x0c59d36b23f809f8b6C7cb4c8C590a0AC103baEf) |
| `AMM native enabled` | [0xFAbC421e3368D158d802684A217a83c083c94CeB](https://kavascan.com/address/0xFAbC421e3368D158d802684A217a83c083c94CeB) |


**:logos-aurora: Aurora**

| Contract Type | Contract Address |
| :---------: | :----------------: |
| `Math`      | [0x5a8C93EE12a8Df4455BA111647AdA41f29D5CfcC](https://explorer.aurora.dev/address/0x5a8C93EE12a8Df4455BA111647AdA41f29D5CfcC) |
| `Views`     | [0xFAbC421e3368D158d802684A217a83c083c94CeB](https://explorer.aurora.dev/address/0xFAbC421e3368D158d802684A217a83c083c94CeB) |
| `Factory`   | [0xC1b393EfEF38140662b91441C6710Aa704973228](https://explorer.aurora.dev/address/0xC1b393EfEF38140662b91441C6710Aa704973228) |
| `AMM native disable` | [0x3d6cB2F6DcF47CDd9C13E4e3beAe9af041d8796a](https://explorer.aurora.dev/address/0x3d6cB2F6DcF47CDd9C13E4e3beAe9af041d8796a) |
| `AMM native enabled` | [0x0c59d36b23f809f8b6C7cb4c8C590a0AC103baEf](https://explorer.aurora.dev/address/0x0c59d36b23f809f8b6C7cb4c8C590a0AC103baEf) |


**:logos-xlayer: X-Layer**

| Contract Type | Contract Address |
| :---------: | :----------------: |
| `Math`      | [0x046207cb759f527b6c10c2d61dbaca45513685cc](https://www.oklink.com/xlayer/address/0x046207cb759f527b6c10c2d61dbaca45513685cc) |
| `Views`     | [0x7ca46a636b02d4abc66883d7ff164bde506dc66a](https://www.oklink.com/xlayer/address/0x7ca46a636b02d4abc66883d7ff164bde506dc66a) |
| `Factory`   | [0xd3b17f862956464ae4403ccf829ce69199856e1e](https://www.oklink.com/xlayer/address/0xd3b17f862956464ae4403ccf829ce69199856e1e) |
| `AMM native disable` | [0x0c9d8c7e486e822c29488ff51bff0167b4650953](https://www.oklink.com/xlayer/address/0x0c9d8c7e486e822c29488ff51bff0167b4650953) |
| `AMM native enable` | [0x64379c265fc6595065d7d835aaaa731c0584db80](https://www.oklink.com/xlayer/address/0x64379c265fc6595065d7d835aaaa731c0584db80) |


**:logos-zksync: zk-Sync**

| Contract Type | Contract Address |
| :---------: | :----------------: |
| `Math`      | [0x07a1684378324825F67D92d944a713E2b8666DEb](https://era.zksync.network/address/0x07a1684378324825F67D92d944a713E2b8666DEb) |
| `Views`     | [0x30E9b9b8449056d17B33D5F42e1fdd5600A2397F](https://era.zksync.network/address/0x30E9b9b8449056d17B33D5F42e1fdd5600A2397F) |
| `Factory`   | [0x5044112fDf6c8DCc788a669c17345cfDB06549fa](https://era.zksync.network/address/0x5044112fDf6c8DCc788a669c17345cfDB06549fa) |
| `AMM native disable` | [0x46e1530c07D5BF2A5654C8cAAA60525D1a3f807A](https://era.zksync.network/address/0x46e1530c07D5BF2A5654C8cAAA60525D1a3f807A) |
| `AMM native enabled` | [0xe1D19a2036BB6F78605cc6B0ac858C83196cAd22](https://era.zksync.network/address/0xe1D19a2036BB6F78605cc6B0ac858C83196cAd22) |


**:logos-tron: Tron**

| Contract Type | Contract Address |
| :---------: | :----------------: |
| `Math`      | *soon*             |
| `Views`     | *soon*             |
| `Factory`   | *soon*             |
| `AMM native disable` | *soon*    |
| `AMM native enabled` | *soon*    |


---


## **StableCalcZap**

*Zap for stable pools to `calc_token_amount` taking fees into account and to `get_dx`.*

!!!github
    `StableCalcZaps` source code is available on [:material-github: GitHub](https://github.com/curvefi/curve-zaps).


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
| :logos-fantom: `Fantom` | [0xCA8d0747B5573D69653C3aC22242e6341C36e4b4](https://ftmscout.com/address/0xCA8d0747B5573D69653C3aC22242e6341C36e4b4#code) |
| :logos-bsc: `Binance Smart Chain` | [0x0fE38dCC905eC14F6099a83Ac5C93BF2601300CF](https://bscscan.com/address/0x0fE38dCC905eC14F6099a83Ac5C93BF2601300CF#code) |
| :logos-mantle: `Mantle` | [0x0fE38dCC905eC14F6099a83Ac5C93BF2601300CF](https://mantlescan.xyz/address/0x0fe38dcc905ec14f6099a83ac5c93bf2601300cf#code) |
| :logos-celo: `Celo`| [0xCA8d0747B5573D69653C3aC22242e6341C36e4b4](https://celoscan.io/address/0xCA8d0747B5573D69653C3aC22242e6341C36e4b4#code) |
| :logos-kava: `Kava` | [0xCA8d0747B5573D69653C3aC22242e6341C36e4b4](https://kavascan.com/address/0xCA8d0747B5573D69653C3aC22242e6341C36e4b4#contracts) |
| :logos-aurora: `Aurora` | [0xCA8d0747B5573D69653C3aC22242e6341C36e4b4](ttps://explorer.aurora.dev/address/0xCA8d0747B5573D69653C3aC22242e6341C36e4b4/contracts) |


---


## **CryptoCalcZap**

*Zap for crypto pools to `get_dx`.*

!!!github
    `DepositAndStakeZaps` source code is available on [:material-github: GitHub](https://github.com/curvefi/deposit-and-stake-zap).


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
| :logos-fantom: `Fantom` | [0xA72C85C258A81761433B4e8da60505Fe3Dd551CC](https://ftmscout.com/address/0xA72C85C258A81761433B4e8da60505Fe3Dd551CC#code) |
| :logos-bsc: `Binance Smart Chain` | [0xd6681e74eEA20d196c15038C580f721EF2aB6320](https://bscscan.com/address/0xd6681e74eEA20d196c15038C580f721EF2aB6320#code) |
| :logos-mantle: `Mantle` | [0xd6681e74eEA20d196c15038C580f721EF2aB6320](https://mantlescan.xyz/address/0xd6681e74eEA20d196c15038C580f721EF2aB6320#code) |
| :logos-celo: `Celo`| [0xA72C85C258A81761433B4e8da60505Fe3Dd551CC](https://celoscan.io/address/0xA72C85C258A81761433B4e8da60505Fe3Dd551CC#code) |
| :logos-kava: `Kava` | [0xA72C85C258A81761433B4e8da60505Fe3Dd551CC](https://kavascan.com/address/0xA72C85C258A81761433B4e8da60505Fe3Dd551CC#contracts) |
| :logos-aurora: `Aurora` | [0xA72C85C258A81761433B4e8da60505Fe3Dd551CC](ttps://explorer.aurora.dev/address/0xA72C85C258A81761433B4e8da60505Fe3Dd551CC/contracts) |


---


## **DepositAndStake Zap**

*Zap to add liquidity to pool and deposit into gauge in one transaction.*

!!!github
    `StableCalcZaps` source code is available on [:material-github: GitHub](https://github.com/curvefi/curve-zaps).

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
| :logos-fantom: `Fantom` | [0x37c5ab57AF7100Bdc9B668d766e193CCbF6614FD](https://ftmscout.com/address/0x37c5ab57AF7100Bdc9B668d766e193CCbF6614FD#code) |
| :logos-bsc: `Binance Smart Chain` | [0x4f37A9d177470499A2dD084621020b023fcffc1F](https://bscscan.com/address/0x4f37A9d177470499A2dD084621020b023fcffc1F#code) |
| :logos-mantle: `Mantle` | [0x5552b631e2ad801faa129aacf4b701071cc9d1f7](https://mantlescan.xyz/address/0x5552b631e2ad801faa129aacf4b701071cc9d1f7#code) |
| :logos-kava: `Kava` | [0x37c5ab57AF7100Bdc9B668d766e193CCbF6614FD](https://kavascan.com/address/0x37c5ab57AF7100Bdc9B668d766e193CCbF6614FD#contracts) |
| :logos-zksync: `zk-Sync` | [0x253548e98C769aD2850da8DB3E4c2b2cE46E3839](https://era.zksync.network/address/0x253548e98C769aD2850da8DB3E4c2b2cE46E3839#contract) |


---


## **MetaZap-NG**

*Zap to add liquidity and remove liquidity into ng-metapools.*

!!!github
    `MetaZapNG` source code is available on [:material-github: GitHub](https://github.com/curvefi/stableswap-ng/blob/main/contracts/main/MetaZapNG.vy).


| Chain | Contract Address |
| ----- | :--------------: |
| :logos-ethereum: `Ethereum` | [0xDfeF1725Ab767f165171709C6d1E1A6247425fE0](https://etherscan.io/address/0xDfeF1725Ab767f165171709C6d1E1A6247425fE0) |
| :logos-arbitrum: `Arbitrum` | [0x59AfCD3e931018dc493AA1d833B11bb5A0744906](https://arbiscan.io/address/0x59AfCD3e931018dc493AA1d833B11bb5A0744906) |
| :logos-optimism: `Optimism` | [0x07920E98a66e462C2Aa4c8fa6200bc68CA161ea0](https://optimistic.etherscan.io/address/0x07920E98a66e462C2Aa4c8fa6200bc68CA161ea0) |
| :logos-base: `Base` | [0x3f445D38E820c010a7A6E33c5F80cBEBE6930f61](https://basescan.org/address/0x3f445D38E820c010a7A6E33c5F80cBEBE6930f61) |
| :logos-fraxtal: `Fraxtal` | [0xe61Fb97Ef6eBFBa12B36Ffd7be785c1F5A2DE66b](https://fraxscan.com/address/0xe61Fb97Ef6eBFBa12B36Ffd7be785c1F5A2DE66b) |
| :logos-polygon: `Polygon` | [0x4c7a5a5d57f98d362f1c00d7135f0da5b6f82227](https://polygonscan.com/address/0x4c7a5a5d57f98d362f1c00d7135f0da5b6f82227) |
| :logos-polygon: `Polygon zk-EVM`| [0xf2eff2Cd0d9C82b7b2f17FbBed703fA7931dB1da](https://zkevm.polygonscan.com/address/0xf2eff2Cd0d9C82b7b2f17FbBed703fA7931dB1da) |
| :logos-gnosis: `Gnosis` | [0x08390C76DFDaB74249754C8e71cC2747351bd388](https://gnosisscan.io/address/0x08390C76DFDaB74249754C8e71cC2747351bd388) |
| :logos-avalanche: `Avalanche` | [0xA54f3c1DFa5f7DbF2564829d14b3B74a65d26Ae2](https://snowscan.xyz/address/0xA54f3c1DFa5f7DbF2564829d14b3B74a65d26Ae2#code) |
| :logos-fantom: `Fantom` | [0x21688e843a99B0a47E750e7dDD2b5dAFd9269d30](https://ftmscout.com/address/0x21688e843a99B0a47E750e7dDD2b5dAFd9269d30#code) |
| :logos-bsc: `Binance Smart Chain` | [0x07920e98a66e462c2aa4c8fa6200bc68ca161ea0](https://bscscan.com/address/0x07920e98a66e462c2aa4c8fa6200bc68ca161ea0#code) |
|:logos-linea: `Linea` | [0xf2eff2Cd0d9C82b7b2f17FbBed703fA7931dB1da](https://lineascan.build/address/0xf2eff2Cd0d9C82b7b2f17FbBed703fA7931dB1da) |
| :logos-scroll: `Scroll`| [0xb47988aD49DCE8D909c6f9Cf7B26caF04e1445c8](https://scroll.l2scan.co/address/0xb47988aD49DCE8D909c6f9Cf7B26caF04e1445c8) |
| :logos-mantle: `Mantle` | [0xe548590f9fAe7a23EA6501b144B0D58b74Fc4B53](https://mantlescan.xyz/address/0xe548590f9fAe7a23EA6501b144B0D58b74Fc4B53) |
| :logos-celo: `Celo`| [0x3f445D38E820c010a7A6E33c5F80cBEBE6930f61](https://celoscan.io/address/0x3f445D38E820c010a7A6E33c5F80cBEBE6930f61) |
| :logos-kava: `Kava` | [0xf2eff2Cd0d9C82b7b2f17FbBed703fA7931dB1da](https://kavascan.com/address/0xf2eff2Cd0d9C82b7b2f17FbBed703fA7931dB1da) |
| :logos-aurora: `Aurora`| [0x9293f068912bae932843a1bA01806c54f416019D](https://explorer.aurora.dev/address/0x9293f068912bae932843a1bA01806c54f416019D) |
| :logos-xlayer: `X-Layer`| [0x604388bb1159afd21eb5191ce22b4decdee2ae22](https://www.okx.com/web3/explorer/xlayer/address/0x604388bb1159afd21eb5191ce22b4decdee2ae22) |
| :logos-zksync: `zk-Sync` | [0x4232Dcc6D31543A2431079BdE2082C69eA3A771E](https://era.zksync.network/address/0x4232Dcc6D31543A2431079BdE2082C69eA3A771E) |


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
| `FlashLender` | [0xa7a4bb50af91f90b6feb3388e7f8286af45b299b](https://etherscan.io/address/0xa7a4bb50af91f90b6feb3388e7f8286af45b299b) |


### **PegKeepers**

| Contract Type           | Contract Address                                                         |
| :---------------------: | :----------------------------------------------------------------------: |
| `PegKeeperV1 (USDC)`      | [0xaA346781dDD7009caa644A4980f044C50cD2ae22](https://etherscan.io/address/0xaA346781dDD7009caa644A4980f044C50cD2ae22#code) |
| `PegKeeperV1 (USDT)`      | [0xE7cd2b4EB1d98CD6a4A48B6071D46401Ac7DC5C8](https://etherscan.io/address/0xE7cd2b4EB1d98CD6a4A48B6071D46401Ac7DC5C8#code) |
| `PegKeeperV1 (USDP)`      | [0x6B765d07cf966c745B340AdCa67749fE75B5c345](https://etherscan.io/address/0x6B765d07cf966c745B340AdCa67749fE75B5c345#code) |
| `PegKeeperV1 (TUSD)`      | [0x1ef89Ed0eDd93D1EC09E4c07373f69C49f4dcCae](https://etherscan.io/address/0x1ef89Ed0eDd93D1EC09E4c07373f69C49f4dcCae#code) |
| `PegKeeperRegulator`      | [0x36a04CAffc681fa179558B2Aaba30395CDdd855f](https://etherscan.io/address/0x36a04CAffc681fa179558B2Aaba30395CDdd855f#code) |
| `PegKeeperV2 (USDC)`      | [0x9201da0D97CaAAff53f01B2fB56767C7072dE340](https://etherscan.io/address/0x9201da0D97CaAAff53f01B2fB56767C7072dE340#code) |
| `PegKeeperV2 (USDT)`      | [0xFb726F57d251aB5C731E5C64eD4F5F94351eF9F3](https://etherscan.io/address/0xFb726F57d251aB5C731E5C64eD4F5F94351eF9F3#code) |
| `PegKeeperV2 (pyUSD)`     | [0x3fA20eAa107DE08B38a8734063D605d5842fe09C](https://etherscan.io/address/0x3fA20eAa107DE08B38a8734063D605d5842fe09C#code) |
| `PegKeeperV2 (TUSD)`      | [0x0a05FF644878B908eF8EB29542aa88C07D9797D3](https://etherscan.io/address/0x0a05FF644878B908eF8EB29542aa88C07D9797D3#code) |



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
|`MonetaryPolicy`|[0xd8f49c747aed8d394f6f1841546e2b83e09a357d](https://etherscan.io/address/0xd8f49c747aed8d394f6f1841546e2b83e09a357d#code)|
|`CollateralToken (sfrxETH)`|[0xac3e018457b222d93114458476f3e3416abbe38f](https://etherscan.io/address/0xac3e018457b222d93114458476f3e3416abbe38f)|
|`PriceOracle`|[0x19F5B81e5325F882C9853B5585f74f751DE3896d](https://etherscan.io/address/0x19F5B81e5325F882C9853B5585f74f751DE3896d#code)|
|`Leverage Zap`|[0xb556FA4C4752321B3154f08DfBDFCF34847f2eac](https://etherscan.io/address/0xb556FA4C4752321B3154f08DfBDFCF34847f2eac#code)|


**:logos-wsteth: wstETH**

| Contract Type | Contract Address |
| :---------: | :----------------: |
|`AMM`|[0x37417b2238aa52d0dd2d6252d989e728e8f706e4](https://etherscan.io/address/0x37417b2238aa52d0dd2d6252d989e728e8f706e4#code)|
|`Controller`|[0x100daa78fc509db39ef7d04de0c1abd299f4c6ce](https://etherscan.io/address/0x100daa78fc509db39ef7d04de0c1abd299f4c6ce#code)|
|`MonetaryPolicy`|[0xD8F49c747AED8D394F6f1841546E2B83E09A357D](https://etherscan.io/address/0xD8F49c747AED8D394F6f1841546E2B83E09A357D#code)|
|`CollateralToken (wstETH)`|[0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0](https://etherscan.io/address/0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0)|
|`PriceOracle`|[0xc1793A29609ffFF81f10139fa0A7A444c9e106Ad](https://etherscan.io/address/0xc1793A29609ffFF81f10139fa0A7A444c9e106Ad#code) |
|`Leverage Zap`|[0x293436d4e4a15FBc6cCC400c14a01735E5FC74fd](https://etherscan.io/address/0x293436d4e4a15FBc6cCC400c14a01735E5FC74fd#code)|



**:logos-wbtc: wBTC**

| Contract Type | Contract Address |
| :---------: | :----------------: |
|`AMM`|[0xe0438eb3703bf871e31ce639bd351109c88666ea](https://etherscan.io/address/0xe0438eb3703bf871e31ce639bd351109c88666ea#code)|
|`Controller`|[0x4e59541306910ad6dc1dac0ac9dfb29bd9f15c67](https://etherscan.io/address/0x4e59541306910ad6dc1dac0ac9dfb29bd9f15c67#code)|
|`MonetaryPolicy`|[0x8c5a7f011f733fbb0a6c969c058716d5ce9bc933](https://etherscan.io/address/0x8c5a7f011f733fbb0a6c969c058716d5ce9bc933#code)|
|`CollateralToken (wBTC)`|[0x2260fac5e5542a773aa44fbcfedf7c193bc2c599](https://etherscan.io/address/0x2260fac5e5542a773aa44fbcfedf7c193bc2c599)|
|`PriceOracle`|[0xBe83fD842DB4937C0C3d15B2aBA6AF7E854f8dcb](https://etherscan.io/address/0xBe83fD842DB4937C0C3d15B2aBA6AF7E854f8dcb#code)|
|`Leverage Zap`|[0xA2518b71ee64E910741f5Cf480b19E8e402de4d7](https://etherscan.io/address/0xA2518b71ee64E910741f5Cf480b19E8e402de4d7#code)|



**:logos-eth: ETH**

| Contract Type | Contract Address |
| :---------: | :----------------: |
|`AMM`|[0x1681195c176239ac5e72d9aebacf5b2492e0c4ee](https://etherscan.io/address/0x1681195c176239ac5e72d9aebacf5b2492e0c4ee#code)|
|`Controller`|[0xa920de414ea4ab66b97da1bfe9e6eca7d4219635](https://etherscan.io/address/0xa920de414ea4ab66b97da1bfe9e6eca7d4219635#code)|
|`MonetaryPolicy`|[0x8c5a7f011f733fbb0a6c969c058716d5ce9bc933](https://etherscan.io/address/0x8c5a7f011f733fbb0a6c969c058716d5ce9bc933#code)|
|`CollateralToken (wETH)`|[0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2](https://etherscan.io/address/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2)|
|`PriceOracle`|[0x966cBDeceFB60A289b0460F7638f4A75F432cA06](https://etherscan.io/address/0x966cBDeceFB60A289b0460F7638f4A75F432cA06#code)|
|`Leverage Zap`|[0xd3e576B5DcDe3580420A5Ef78F3639BA9cd1B967](https://etherscan.io/address/0xd3e576B5DcDe3580420A5Ef78F3639BA9cd1B967#code)|



**:logos-sfrxeth: sfrxETH v2**

| Contract Type | Contract Address |
| :---------: | :----------------: |
|`AMM`|[0xfa96ad0a9e64261db86950e2da362f5572c5c6fd](https://etherscan.io/address/0xfa96ad0a9e64261db86950e2da362f5572c5c6fd#code)|
|`Controller`|[0xec0820efafc41d8943ee8de495fc9ba8495b15cf](https://etherscan.io/address/0xec0820efafc41d8943ee8de495fc9ba8495b15cf#code)|
|`MonetaryPolicy`|[0xd8f49c747aed8d394f6f1841546e2b83e09a357d](https://etherscan.io/address/0xd8f49c747aed8d394f6f1841546e2b83e09a357d#code)|
|`CollateralToken (sfrxETH)`|[0xac3e018457b222d93114458476f3e3416abbe38f](https://etherscan.io/address/0xac3e018457b222d93114458476f3e3416abbe38f)|
|`PriceOracle`|[0x28d7880B5b67fB4a0B1c6Ed6c33c33f365113C29](https://etherscan.io/address/0x28d7880B5b67fB4a0B1c6Ed6c33c33f365113C29#code)|
|`Leverage Zap`|[0x43eCFfe6c6C1b9F24AeB5C180E659c2a6FCe11Bc](https://etherscan.io/address/0x43eCFfe6c6C1b9F24AeB5C180E659c2a6FCe11Bc#code)|



**tBTC**

| Contract Type | Contract Address |
| :---------: | :----------------: |
|`AMM`|[0xf9bd9da2427a50908c4c6d1599d8e62837c2bcb0](https://etherscan.io/address/0xf9bd9da2427a50908c4c6d1599d8e62837c2bcb0#code)|
|`Controller`|[0x1c91da0223c763d2e0173243eadaa0a2ea47e704](https://etherscan.io/address/0x1c91da0223c763d2e0173243eadaa0a2ea47e704#code)|
|`MonetaryPolicy`|[0x8c5a7f011f733fbb0a6c969c058716d5ce9bc933](https://etherscan.io/address/0x8c5a7f011f733fbb0a6c969c058716d5ce9bc933#code)|
|`CollateralToken (tBTC)`|[0x18084fba666a33d37592fa2633fd49a74dd93a88](https://etherscan.io/address/0x18084fba666a33d37592fa2633fd49a74dd93a88)|
|`PriceOracle`|[0xbeF434E2aCF0FBaD1f0579d2376fED0d1CfC4217](https://etherscan.io/address/0xbeF434E2aCF0FBaD1f0579d2376fED0d1CfC4217#code)|
|`Leverage Zap`|[0xD79964C70Cb06224FdA4c48387B53E9819bcB71c](https://etherscan.io/address/0xD79964C70Cb06224FdA4c48387B53E9819bcB71c#code)|


---


## **Curve Lending**

!!!deploy "Source Code"
    Source code for all lending-relevant contracts is available on [GitHub](https://github.com/curvefi/curve-stablecoin/tree/lending).

!!!warning "Implementations"
    **Implementation contracts are upgradable.** They can be either replaced or additional implementation contracts can be set. Therefore, please **always make sure to check the most recent ones**.


As the creation of lending markets is permissionless, listing all deployed vaults and their corresponding contracts would exceed the scope of this section. The Factory contract has a [`market_count`](../lending/contracts/oneway-factory.md#market_count) variable which represents the total number of markets created, as well as a [`vaults(arg0: uint256)`](../lending/contracts/oneway-factory.md#vaults) which returns the vault address at a specific index.

*For more information, please refer to the [Factory documentation](../lending/contracts/oneway-factory.md).*

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

*For more information, please refer to the [Vault documentation](../lending/contracts/vault.md#contract-info-methods).*


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
| `Controller implementation`        | [0x2287b7b2bF3d82c3ecC11ca176F4B4F35f920775](https://arbiscan.io/address/0x2287b7b2bF3d82c3ecC11ca176F4B4F35f920775) |
| `Vault implementation`             | [0x104e15102E4Cf33e0e2cB7C304D406B523B04d7a](https://arbiscan.io/address/0x104e15102E4Cf33e0e2cB7C304D406B523B04d7a) |
| `Pool price oracle implementation` | [0x57390a776A2312eF8BFc25e8624483303Dd8DfF8](https://arbiscan.io/address/0x57390a776A2312eF8BFc25e8624483303Dd8DfF8) |
| `Monetary Policy Implementation`   | [0x0b3536245faDABCF091778C4289caEbDc2c8f5C1](https://arbiscan.io/address/0x0b3536245faDABCF091778C4289caEbDc2c8f5C1) |
| `OneWay Lending Factory`           | [0xcaEC110C784c9DF37240a8Ce096D352A75922DeA](https://arbiscan.io/address/0xcaEC110C784c9DF37240a8Ce096D352A75922DeA) |


**:logos-optimism: Optimism**

The deployments on Optimism were done using a new implementation of the `Controller.vy` contract and a slightly modified `Vault.vy` contract. Commit [`b0240d8`](https://github.com/curvefi/curve-stablecoin/tree/b0240d844c9e60fdab78b481a556a187ceee3721) contains the changes.

| Contract Type                      | Contract Address  |
| :--------------------------------: | ----------------- |
| `OneWay Lending Factory`           | [0x5EA8f3D674C70b020586933A0a5b250734798BeF](https://optimistic.etherscan.io/address/0x5EA8f3D674C70b020586933A0a5b250734798BeF) |
| `AMM implementation`               | [0x40b8c0c9186eAEaf84023d81CD2a709e81fCFbC1](https://optimistic.etherscan.io/address/0x40b8c0c9186eAEaf84023d81CD2a709e81fCFbC1) |
| `Controller implementation`        | [0xCc65F473815c97bDe543Db458358F09852eDb5B4](https://optimistic.etherscan.io/address/0xCc65F473815c97bDe543Db458358F09852eDb5B4) |
| `Vault implementation`             | [0x3B1DF11b96b2F5525aBe75eebeFb1ce0928d2411](https://optimistic.etherscan.io/address/0x3B1DF11b96b2F5525aBe75eebeFb1ce0928d2411) |
| `Pool price oracle implementation` | [0x227c9AD884e0E32a698FB38ba0511eE36fA92b7d](https://optimistic.etherscan.io/address/0x227c9AD884e0E32a698FB38ba0511eE36fA92b7d) |
| `Monetary Policy Implementation`   | [0xa2294769e9CFA9Fd029030F7be94E2602821677B](https://optimistic.etherscan.io/address/0xa2294769e9CFA9Fd029030F7be94E2602821677B) |

**:logos-fraxtal: Fraxtal**

The deployments on Fraxtal were done using a new implementation of the `Controller.vy` contract and a slightly modified `Vault.vy` contract. Commit [`b0240d8`](https://github.com/curvefi/curve-stablecoin/tree/b0240d844c9e60fdab78b481a556a187ceee3721) contains the changes.

| Contract Type                      | Contract Address |
| :--------------------------------: | ---------------- |
| `OneWay Lending Factory`           | [0xf3c9bdAB17B7016fBE3B77D17b1602A7db93ac66](https://fraxscan.com/address/0xf3c9bdAB17B7016fBE3B77D17b1602A7db93ac66) |
| `AMM implementation`               | [0x59CfFdC8cf8b9b71D91Da6de480c957993020E8A](https://fraxscan.com/address/0x59CfFdC8cf8b9b71D91Da6de480c957993020E8A) |
| `Controller implementation`        | [0x7002B727Ef8F5571Cb5F9D70D13DBEEb4dFAe9d1](https://fraxscan.com/address/0x7002B727Ef8F5571Cb5F9D70D13DBEEb4dFAe9d1) |
| `Vault implementation`             | [0xc1DB00a8E5Ef7bfa476395cdbcc98235477cDE4E](https://fraxscan.com/address/0xc1DB00a8E5Ef7bfa476395cdbcc98235477cDE4E) |
| `Pool price oracle implementation` | [0x0cD5A1e9E19Af1f1b910Ac3C3452A16B2B37155b](https://fraxscan.com/address/0x0cD5A1e9E19Af1f1b910Ac3C3452A16B2B37155b) |
| `Monetary Policy Implementation`   | [0x86D347cE5f1E6f7Ef4Da00FB7c8d31fBD16996F0](https://fraxscan.com/address/0x86D347cE5f1E6f7Ef4Da00FB7c8d31fBD16996F0) |

**:logos-sonic: Sonic**

The deployments on Sonic were done using a new implementation of the `Controller.vy` contract and a slightly modified `Vault.vy` contract. Commit [`b0240d8`](https://github.com/curvefi/curve-stablecoin/tree/b0240d844c9e60fdab78b481a556a187ceee3721) contains the changes.

| Contract Type                      | Contract Address |
| :--------------------------------: | ---------------- |
| `OneWay Lending Factory`           | [0x30D1859DaD5A52aE03B6e259d1b48c4b12933993](https://sonicscan.org/address/0x30D1859DaD5A52aE03B6e259d1b48c4b12933993) |
| `AMM implementation`               | [0x98C391EC9D4b8e6a25A6F375d316e82506efBcF7](https://sonicscan.org/address/0x98C391EC9D4b8e6a25A6F375d316e82506efBcF7) |
| `Controller implementation`        | [0x97223D110fbBa277155E0eF869900DeBb7FE1B6e](https://sonicscan.org/address/0x97223D110fbBa277155E0eF869900DeBb7FE1B6e) |
| `Vault implementation`             | [0x837fD0c38792620aC871055B2f43D3F61809e0f2](https://sonicscan.org/address/0x837fD0c38792620aC871055B2f43D3F61809e0f2) |
| `Pool price oracle implementation` | [0x271eA597a95aF4f20FA61B0D77cB38E2fBBe8Ed9](https://sonicscan.org/address/0x271eA597a95aF4f20FA61B0D77cB38E2fBBe8Ed9) |
| `Monetary Policy Implementation`   | [0xDa39894132ADC64E7d3B5Ca20B85C9bfb2b494db](https://sonicscan.org/address/0xDa39894132ADC64E7d3B5Ca20B85C9bfb2b494db) |
