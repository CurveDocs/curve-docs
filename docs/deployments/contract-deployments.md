<h1>Contract Deployments</h1>

This section aims to provide a comprehensive list of all the contracts deployed by Curve. If there are any discrepancies, please don't hesitate to create an Issue on [:material-github: GitHub](https://github.com/CurveDocs/curve-docs/issues).

---

## Curve DAO

### Core Contracts

*Here is a list of core contracts used in the Curve DAO:*

| Contract Type            | Contract Address |
| :----------------------: | ---------------- |
| `CRV Token`              | [0xD533a949740bb3306d119CC777fa900bA034cd52](https://etherscan.io/token/0xD533a949740bb3306d119CC777fa900bA034cd52)   |
| `CRV Circulating Supply` | [0x14139EB676342b6bC8E41E0d419969f23A49881e](https://etherscan.io/address/0x14139EB676342b6bC8E41E0d419969f23A49881e) |
| `Fee Distributor`        | [0xa464e6dcda8ac41e03616f95f4bc98a13b8922dc](https://etherscan.io/address/0xa464e6dcda8ac41e03616f95f4bc98a13b8922dc) |
| `Gauge Controller`       | [0x2F50D538606Fa9EDD2B11E2446BEb18C9D5846bB](https://etherscan.io/address/0x2F50D538606Fa9EDD2B11E2446BEb18C9D5846bB) |
| `Minter`                 | [0xd061D61a4d941c39E5453435B6345Dc261C2fcE0](https://etherscan.io/address/0xd061D61a4d941c39E5453435B6345Dc261C2fcE0) |
| `Voting Escrow`          | [0x5f3b5dfeb7b28cdbd7faba78963ee202a494e2a2](https://etherscan.io/address/0x5f3b5dfeb7b28cdbd7faba78963ee202a494e2a2) |


*Vesting contracts for the Curve DAO token:*

| Vesting Type                  | Contract Address |
| :---------------------------: | ---------------- |
| `pre-CRV Liquidity Providers` | [0x575ccd8e2d300e2377b43478339e364000318e2c](https://etherscan.io/address/0x575ccd8e2d300e2377b43478339e364000318e2c) |
| `Core Team`                   | [0xd2d43555134dc575bf7279f4ba18809645db0f1d](https://etherscan.io/address/0xd2d43555134dc575bf7279f4ba18809645db0f1d#readContract) |
| `Investors`                   | [0xf22995a3ea2c83f6764c711115b23a88411cafdd](https://etherscan.io/address/0xf22995a3ea2c83f6764c711115b23a88411cafdd) |
| `Investors`                   | [0x2a7d59e327759acd5d11a8fb652bf4072d28ac04](https://etherscan.io/address/0x2a7d59e327759acd5d11a8fb652bf4072d28ac04) |
| `Investors`                   | [0xf7dbc322d72c1788a1e37eee738e2ea9c7fa875e](https://etherscan.io/address/0xf7dbc322d72c1788a1e37eee738e2ea9c7fa875e) |
| `Employees`                   | [0x679fcb9b33fc4ae10ff4f96caef49c1ae3f8fa67](https://etherscan.io/address/0x679fcb9b33fc4ae10ff4f96caef49c1ae3f8fa67) |
| `Employees`                   | [0x41df5d28c7e801c4df0ab33421e2ed6ce52d2567](https://etherscan.io/address/0x41df5d28c7e801c4df0ab33421e2ed6ce52d2567) |
| `Community Funds`             | [0xe3997288987e6297ad550a69b31439504f513267](https://etherscan.io/address/0xe3997288987e6297ad550a69b31439504f513267) |

---

### CRV Token Addresses

*Despite being launched on Ethereum, the Curve DAO Token can be bridged to various chains:*

!!!danger "MULTICHAIN WARNING"
    Multichain statement: https://twitter.com/MultichainOrg/status/1677180114227056641
    The Multichain service stopped currently, and all bridge transactions will be stuck on the source chains.
    There is no confirmed resume time.
    **Please don't use the Multichain bridging service now.**

| Chain | Contract Address | Bridge |
| ----- | ---------------- | ------ |
| :logos-ethereum: `Ethereum`    | [0xD533a949740bb3306d119CC777fa900bA034cd52](https://etherscan.io/token/0xD533a949740bb3306d119CC777fa900bA034cd52)   | |
| :logos-arbitrum: `Arbitrum`     | [0x11cDb42B0EB46D95f990BeDD4695A6e3fA034978](https://arbiscan.io/address/0x11cDb42B0EB46D95f990BeDD4695A6e3fA034978) | [**Arbitrum Bridge**](https://bridge.arbitrum.io/)​ |
| :logos-base: `Base`             | [0x8Ee73c484A26e0A5df2Ee2a4960B789967dd0415](https://basescan.org/address/0x8Ee73c484A26e0A5df2Ee2a4960B789967dd0415) | [**Base Bridge**](https://bridge.base.org/deposit) |
| :logos-optimism: `Optimism`     | [0x0994206dfE8De6Ec6920FF4D779B0d950605Fb53](https://optimistic.etherscan.io/address/0x0994206dfe8de6ec6920ff4d779b0d950605fb53) | [**Optimism Bridge**](https://app.optimism.io/bridge) |
| :logos-polygon: `Polygon`       | [0x172370d5Cd63279eFa6d502DAB29171933a610AF](https://polygonscan.com/address/0x172370d5cd63279efa6d502dab29171933a610af) | [**Polygon Bridge**](https://wallet.polygon.technology/bridge/)​ |
| :logos-polygon: `Polygon zk-EVM` | [0x5945932099f124194452a4c62d34bb37f16183b2](https://zkevm.polygonscan.com/address/0x3d5320821BfCa19fb0B5428F2c79d63bd5246f89) |  |
| :logos-gnosis: `Gnosis`         | [0x712b3d230F3C1c19db860d80619288b1F0BDd0Bd](https://gnosisscan.io/address/0x712b3d230f3c1c19db860d80619288b1f0bdd0bd) | [**xDai Bridge**](https://bridge.xdaichain.com/)​ |
| :logos-xlayer: `X-Layer` | [0x3d5320821bfca19fb0b5428f2c79d63bd5246f89](https://www.oklink.com/xlayer/address/0x3d5320821bfca19fb0b5428f2c79d63bd5246f89/contract) | [**X-Layer Bridge**](https://www.okx.com/xlayer/bridge) |
| :logos-mantle: `Mantle` | [0xE265FC71d45fd791c9ebf3EE0a53FBB220Eb8f75](https://mantlescan.xyz/address/0xE265FC71d45fd791c9ebf3EE0a53FBB220Eb8f75) |  |
| :logos-fraxtal: `Fraxtal` | [0x331b9182088e2a7d6d3fe4742aba1fb231aecc56](https://fraxscan.com/token/0x331b9182088e2a7d6d3fe4742aba1fb231aecc56) |  |
| :logos-zksync: `zk-Sync` | [0x5945932099f124194452a4c62d34bb37f16183b2](https://era.zksync.network/token/0x5945932099f124194452a4c62d34bb37f16183b2) |  |
| :logos-avalanche: `Avalanche`​ | [0xEEbC562d445F4bC13aC75c8caABb438DFae42A1B](https://snowscan.xyz/address/0xEEbC562d445F4bC13aC75c8caABb438DFae42A1B) | [**<mark style="background-color: #ffff00; color: black">x-dao (BETA)</mark>**](../deployments/crosschain.md#curve-x-dao)​ |
| :logos-fantom: `Fantom`         | [0xE6c259bc0FCE25b71fE95A00361D3878E16232C3](https://ftmscout.com/address/0xE6c259bc0FCE25b71fE95A00361D3878E16232C3) | [**<mark style="background-color: #ffff00; color: black">x-dao (BETA)</mark>**](../deployments/crosschain.md#curve-x-dao)​ |
| :logos-bsc: `Binance Smart Chain`         | [0x9996D0276612d23b35f90C51EE935520B3d7355B](https://bscscan.com/token/0x9996D0276612d23b35f90C51EE935520B3d7355B) | [**<mark style="background-color: #ffff00; color: black">x-dao (BETA)</mark>**](../deployments/crosschain.md#curve-x-dao)​ |
| :logos-kava: `Kava`             | [0x7736C61F00c72e868AA9904c9063e8445A1eF5DD](https://kavascan.com/address/0x7736C61F00c72e868AA9904c9063e8445A1eF5DD) | [**<mark style="background-color: #ffff00; color: black">x-dao (BETA)</mark>**](../deployments/crosschain.md#curve-x-dao)​ |
| :logos-avalanche: `Avalanche`​ | [0x47536F17F4fF30e64A96a7555826b8f9e66ec468](https://snowscan.xyz/address/0x47536F17F4fF30e64A96a7555826b8f9e66ec468) | [**<mark style="background-color: #f31743; color: black">Multichain</mark>**](https://multichain.org/)​ |
| :logos-fantom: `Fantom`         | [0x1E4F97b9f9F913c46F1632781732927B9019C68b](https://ftmscout.com/address/0x1e4f97b9f9f913c46f1632781732927b9019c68b) | [**<mark style="background-color: #f31743; color: black">Multichain</mark>**](https://multichain.org/)​ |
| :logos-celo: `Celo`             | [0x173fd7434B8B50dF08e3298f173487ebDB35FD14](https://explorer.celo.org/mainnet/address/0x173fd7434B8B50dF08e3298f173487ebDB35FD14) | [**<mark style="background-color: #f31743; color: black">Multichain</mark>**](https://multichain.org/)​ |

---

### Aragon Voting

Curve DAO consists of multiple smart contracts connected by [Aragon](https://github.com/aragon/aragonOS). Interaction with Aragon occurs through a [modified implementation](https://github.com/curvefi/curve-aragon-voting) of the [Aragon Voting App](https://github.com/aragon/aragon-apps/tree/master/apps/voting). Aragon's standard one-token, one-vote method is replaced with a weighting system based on locking tokens. Curve DAO has a token (CRV) used for governance and value accrual.

- **Voting**

    Aragon [Voting App](https://wiki.aragon.org/archive/dev/apps/voting/) deployments are the main entry points used to create new votes, vote, check the status of a vote, and execute a successful vote.

    | Voting Type | Contract Address |
    | :---------: | ---------------- |
    | `Ownership` | [0xe478de485ad2fe566d49342cbd03e49ed7db3356](https://etherscan.io/address/0xe478de485ad2fe566d49342cbd03e49ed7db3356) |
    | `Parameter` | [0xbcff8b0b9419b9a88c44546519b1e909cf330399](https://etherscan.io/address/0xbcff8b0b9419b9a88c44546519b1e909cf330399) |

    The following token addresses are used for determining voter weights within Curve's Aragon DAOs.

    | Voting Type | Contract Address  |
    | :---------: | ----------------- |
    | `Ownership / Parameter` | [0x5f3b5DfEb7B28CDbD7FAba78963EE202a494e2A2](https://etherscan.io/address/0x5f3b5DfEb7B28CDbD7FAba78963EE202a494e2A2) |

- **Agent**

    Aragon [Agent](https://hack.aragon.org/docs/guides-use-agent) deployments correspond to the different owner accounts within the DAO. Contract calls made due to a successful vote will be executed from these addresses. When deploying new contracts, these addresses should be given appropriate access to admin functionality.

    | Agent Type  | Contract Address  |
    | :---------: | ----------------- |
    | `Ownership` | [0x40907540d8a6C65c637785e8f8B742ae6b0b9968](https://etherscan.io/address/0x40907540d8a6C65c637785e8f8B742ae6b0b9968) |
    | `Parameter` | [0x4EEb3bA4f221cA16ed4A0cC7254E2E32DF948c5f](https://etherscan.io/address/0x4EEb3bA4f221cA16ed4A0cC7254E2E32DF948c5f) |

- **Emergency DAO**

    The Emergency DAO is deployed at:

    | Vote Type   | Contract Address  |
    | :---------: | ----------------- |
    | `eDAO`      | [0x467947EE34aF926cF1DCac093870f613C96B1E0c](https://etherscan.io/address/0x467947EE34aF926cF1DCac093870f613C96B1E0c) |

---

### Fee Burning

Handling fees is a crucial part of Curve's operations. There are `FeeReceiver` contracts which collect all the fees and `Burner` contracts which burn the fees into `crvUSD`.

**Fee Receiver**

| Chain       | Contract Address |
| ----------- | ---------------- |
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

**New Curve Burner System**

Curve has developed and deployed a new fee-burning architecture which is currently only available on Ethereum and Gnosis. For detailed documentation, please see here: [Curve Burner Documentation](../fees/overview.md).

**:logos-ethereum: Ethereum**

| Contract Type    | Contract Address |
| :--------------: | ---------------- |
| `FeeCollector`   | [0xa2Bcd1a4Efbd04B63cd03f5aFf2561106ebCCE00](https://etherscan.io/address/0xa2Bcd1a4Efbd04B63cd03f5aFf2561106ebCCE00) |
| `Hooker`         | [0x9A9DF35cd8E88565694CA6AD5093c236C7f6f69D](https://etherscan.io/address/0x9A9DF35cd8E88565694CA6AD5093c236C7f6f69D) |
| `CowSwapBurner`  | [0xC0fC3dDfec95ca45A0D2393F518D3EA1ccF44f8b](https://etherscan.io/address/0xC0fC3dDfec95ca45A0D2393F518D3EA1ccF44f8b) |
| `FeeDistributor` | [0xD16d5eC345Dd86Fb63C6a9C43c517210F1027914](https://etherscan.io/address/0xD16d5eC345Dd86Fb63C6a9C43c517210F1027914) |
| `FeeSplitter`    | [0x2dFd89449faff8a532790667baB21cF733C064f2](https://etherscan.io/address/0x2dFd89449faff8a532790667baB21cF733C064f2) |

**:logos-gnosis: Gnosis**

| Contract Type    | Contract Address |
| :--------------: | ---------------- |
| `FeeCollector`   | [0xBb7404F9965487a9DdE721B3A5F0F3CcfA9aa4C5](https://gnosisscan.io/address/0xBb7404F9965487a9DdE721B3A5F0F3CcfA9aa4C5) |
| `Hooker`         | [0xE898893ebAe7b75dc4cAB0fb16e24137309ff178](https://gnosisscan.io/address/0xE898893ebAe7b75dc4cAB0fb16e24137309ff178) |
| `CowSwapBurner`  | [0x566b9F24200A9B51b76792D4e81B569AF27eda83](https://gnosisscan.io/address/0x566b9F24200A9B51b76792D4e81B569AF27eda83) |
| `GnosisBridger`  | [0xc4AA2fB0A8837a06d296b1c0DE1990E401659449](https://gnosisscan.io/address/0xc4AA2fB0A8837a06d296b1c0DE1990E401659449) |

---

**Original Fee Burner System**

**:logos-ethereum: Ethereum**

| Burner Type       | Contract Address |
| :---------------: | ---------------- |
|`ABurner`          | [0x12220a63a2013133D54558C9d03c35288eAC9B34](https://etherscan.io/address/0x12220a63a2013133d54558c9d03c35288eac9b34) |
|`CryptoSwapBurner` | [0xdc237b4B882Fa1d1fd1dD5B59A08F8dB3416DbE3](https://etherscan.io/address/0xdc237b4B882Fa1d1fd1dD5B59A08F8dB3416DbE3) |
|`SwapStableBurner` | [0x90B4508e8F91523e5c8854eA73AFD8c22d8c27b7](https://etherscan.io/address/0x90B4508e8F91523e5c8854eA73AFD8c22d8c27b7) |
|`CBurner`          | [0xdd0e10857d952c73b2fa39ce86308299df8774b8](https://etherscan.io/address/0xdd0e10857d952c73b2fa39ce86308299df8774b8) |
|`LPBurner`         | [0xaa42C0CD9645A58dfeB699cCAeFBD30f19B1ff81](https://etherscan.io/address/0xaa42C0CD9645A58dfeB699cCAeFBD30f19B1ff81) |
|`MetaBurner`       | [0xE4b65889469ad896e866331f0AB5652C1EcfB3E6](https://etherscan.io/address/0xE4b65889469ad896e866331f0AB5652C1EcfB3E6) |
|`SynthBurner`      | [0x67a0213310202dbc2cbe788f4349b72fba90f9fa](https://etherscan.io/address/0x67a0213310202dbc2cbe788f4349b72fba90f9fa) |
|`USDNBurner`       | [0x06534b0BF7Ff378F162d4F348390BDA53b15fA35](https://etherscan.io/address/0x06534b0BF7Ff378F162d4F348390BDA53b15fA35) |
|`UniswapBurner`    | [0xf3b64840b39121b40d8685f1576b64c157ce2e24](https://etherscan.io/address/0xf3b64840b39121b40d8685f1576b64c157ce2e24) |
|`YBurner`          | [0xd16ea3e5681234da84419512eb597362135cd8c9](https://etherscan.io/address/0xd16ea3e5681234da84419512eb597362135cd8c9) |
|`UnderlyingBurner` | [0x786b374b5eef874279f4b7b4de16940e57301a58](https://etherscan.io/address/0x786b374b5eef874279f4b7b4de16940e57301a58) |

**:logos-arbitrum: Arbitrum**

| Burner Type       | Contract Address |
| :---------------: | ---------------- |
| `LPBurner`        | [0x2Ac51A7bC5E41cc35a1ce107E39847Ce00c20161](https://arbiscan.io/address/0x2Ac51A7bC5E41cc35a1ce107E39847Ce00c20161) |
| `MetaBurner`      | [0xE4b65889469ad896e866331f0AB5652C1EcfB3E6](https://arbiscan.io/address/0xE4b65889469ad896e866331f0AB5652C1EcfB3E6) |
| `UnderlyingSwapBurner` | [0x69F36f4486168D8eeBD472375588e88B702f5344](https://arbiscan.io/address/0x69F36f4486168D8eeBD472375588e88B702f5344) |
| `SwapBurner`      | [0x09F8D940EAD55853c51045bcbfE67341B686C071](https://arbiscan.io/address/0x09F8D940EAD55853c51045bcbfE67341B686C071) |
| `DepositBurner`   | [0x0094Ad026643994c8fB2136ec912D508B15fe0E5](https://arbiscan.io/address/0x0094Ad026643994c8fB2136ec912D508B15fe0E5) |
| `wETHBurner`      | [0x5191946500e75f0A74476F146dF7d386e52961d9](https://arbiscan.io/address/0x5191946500e75f0A74476F146dF7d386e52961d9) |

**:logos-optimism: Optimism**

| Burner Type       | Contract Address |
| :---------------: | ---------------- |
| `StableBurner`    | [0xE5De15A9C9bBedb4F5EC13B131E61245f2983A69](https://optimistic.etherscan.io/address/0xE5De15A9C9bBedb4F5EC13B131E61245f2983A69) |
| `SwapBurner`      | [0xe35A879E5EfB4F1Bb7F70dCF3250f2e19f096bd8](https://optimistic.etherscan.io/address/0xe35A879E5EfB4F1Bb7F70dCF3250f2e19f096bd8) |
| `SynthTokenBurner`| [0x070A5C8a99002F50C18B52B90e938BC477611b16](https://optimistic.etherscan.io/address/0x070A5C8a99002F50C18B52B90e938BC477611b16) |

**:logos-polygon: Polygon**

| Burner Type            | Contract Address |
| :--------------------: | ---------------- |
| `amToken Burner`       | [0x7b7b5f87c7357133c93dba8d61fb397f33c99a6b](https://polygonscan.com/address/0x7b7b5f87c7357133c93dba8d61fb397f33c99a6b) |
| `EURT Burner`          | [0x410364C393C7E64b6F1d0Ee03f89BFD09b49940c](https://polygonscan.com/address/0x410364C393C7E64b6F1d0Ee03f89BFD09b49940c) |
| `Tricrypto Burner`     | [0x43450Feccf936FbA3143e03F35D3Cc608D5fE1d2](https://polygonscan.com/address/0x43450Feccf936FbA3143e03F35D3Cc608D5fE1d2) |
| `Tricrypto LP Burner`  | [0x0094Ad026643994c8fB2136ec912D508B15fe0E5](https://polygonscan.com/address/0x0094Ad026643994c8fB2136ec912D508B15fe0E5) |
| `am3crv LP Burner`     | [0x6a2691068C7CbdA03292Ba0f9c77A25F658bAeF5](https://polygonscan.com/address/0x6a2691068C7CbdA03292Ba0f9c77A25F658bAeF5) |
| `Crypto Factory LP Burner`| [0x09F8D940EAD55853c51045bcbfE67341B686C071](https://polygonscan.com/address/0x09F8D940EAD55853c51045bcbfE67341B686C071) |
| `BridgeContract`       | [0x28542e4af3de534ca36daf342febda541c937c5a](https://polygonscan.com/address/0x28542e4af3de534ca36daf342febda541c937c5a) |

**:logos-avalanche: Avalanche**

| Burner Type       | Contract Address |
| :---------------: | ---------------- |
| `LPBurner`        | [0x2c2fc48c3404a70f2d33290d5820edf49cbf74a5](https://snowscan.xyz/address/0x2c2fc48c3404a70f2d33290d5820edf49cbf74a5) |
| `LPBurner`        | [0x8038C01A0390a8c547446a0b2c18fc9aEFEcc10c](https://snowscan.xyz/address/0x8038C01A0390a8c547446a0b2c18fc9aEFEcc10c) |
| `avTokenBurner`   | [0x61E10659fe3aa93d036d099405224E4Ac24996d0](https://snowscan.xyz/address/0x61E10659fe3aa93d036d099405224E4Ac24996d0) |
| `avTokenBurner`   | [0xcF897d9C8F9174F08f30084220683948B105D1B1](https://snowscan.xyz/address/0xcF897d9C8F9174F08f30084220683948B105D1B1) |
| `BTC Burner`      | [0xE6358f6a45B502477e83CC1CDa759f540E4459ee](https://snowscan.xyz/address/0xE6358f6a45B502477e83CC1CDa759f540E4459ee) |
| `ETH Burner`      | [0xd7d147c6Bb90A718c3De8C0568F9B560C79fa416](https://snowscan.xyz/address/0xd7d147c6Bb90A718c3De8C0568F9B560C79fa416) |
| `Swap Burner`     | [0x6a2691068C7CbdA03292Ba0f9c77A25F658bAeF5](https://snowscan.xyz/address/0x6a2691068C7CbdA03292Ba0f9c77A25F658bAeF5) |
| `BridgeContract`  | [0xa218ed442715fc42ac96a6323b47538684a36e4b](https://snowscan.xyz/address/0xa218ed442715fc42ac96a6323b47538684a36e4b) |

**:logos-fantom: Fantom**

| Burner Type         | Contract Address |
| :-----------------: | ---------------- |
| `UnderlyingBurner`  | [0x423f26eb44d4be89072eecfc81b95065ce43bf4b](https://ftmscout.com/address/0x423f26eb44d4be89072eecfc81b95065ce43bf4b#) |
| `BTCBurner`         | [0xFa18A0385610b560f3041C40E23fB319e24658f1](https://ftmscout.com/address/0xFa18A0385610b560f3041C40E23fB319e24658f1#) |
| `gToken Burner`     | [0xDE5331AC4B3630f94853Ff322B66407e0D6331E8](https://ftmscout.com/address/0xDE5331AC4B3630f94853Ff322B66407e0D6331E8) |
| `cToken Burner`     | [0x11137B10C210b579405c21A07489e28F3c040AB1](https://ftmscout.com/address/0x11137B10C210b579405c21A07489e28F3c040AB1) |
| `Tricrypto Burner`  | [0x337e9d5A2DeE10Fdd30E67236667E1dE5b0c085F](https://ftmscout.com/address/0x337e9d5A2DeE10Fdd30E67236667E1dE5b0c085F) |
| `Swap Burner`       | [0x959c1BA175e04F7164EB749f4E88f10fe4Bac8a6](https://ftmscout.com/address/0x959c1BA175e04F7164EB749f4E88f10fe4Bac8a6) |
| `BridgeContract`    | [0x993ff6dd3851ab11af751277e419c2aa2697a288](https://ftmscout.com/address/0x993ff6dd3851ab11af751277e419c2aa2697a288) |

---

## Curve X-GOV

!!!github "GitHub"
    Source code for cross-chain governance contracts is available on [:material-github: GitHub](https://github.com/curvefi/curve-xgov).

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


**:logos-gnosis: Gnosis**

| Contract Type      | Contract Address |
| :----------------: | :--------------: |
| L1 Broadcaster     | [0x22089A449ABdAd415d3B8476A501BFe70870C1a7](https://etherscan.io/address/0x22089A449ABdAd415d3B8476A501BFe70870C1a7) |
| L2 Relayer         | [0x22089A449ABdAd415d3B8476A501BFe70870C1a7](https://gnosisscan.io/address/0x22089A449ABdAd415d3B8476A501BFe70870C1a7) |
| L2 Ownership Agent | [0x383544581A70d2C4E4688d2C5C18C3941e0c8637](https://gnosisscan.io/address/0x383544581A70d2C4E4688d2C5C18C3941e0c8637) |
| L2 Parameter Agent | [0x91304259119506185Fd74e3950bdd65A7e03E15E](https://gnosisscan.io/address/0x91304259119506185Fd74e3950bdd65A7e03E15E) |
| L2 Emergency Agent | [0xEFDA01FE1dE71c9bDcFd78A58EA34d9F8f8bde90](https://gnosisscan.io/address/0xEFDA01FE1dE71c9bDcFd78A58EA34d9F8f8bde90) |
| L2 Vault           | [0x0B8c6A25904a1b8A0712Bc857390130a438c52AA](https://gnosisscan.io/address/0x0B8c6A25904a1b8A0712Bc857390130a438c52AA) |
| Agent Blueprint    | [0x61951AC5664c7a7d7aB7df9892a82a5fCd622Bb2](https://gnosisscan.io/address/0x61951AC5664c7a7d7aB7df9892a82a5fCd622Bb2) |


**:logos-fraxtal: Fraxtal**

| Contract Type      | Contract Address |
| :----------------: | :--------------: |
| L1 Broadcaster     | [0xE0fE4416214e95F0C67Dc044AAf1E63d6972e0b9](https://etherscan.io/address/0xE0fE4416214e95F0C67Dc044AAf1E63d6972e0b9) |
| L2 Relayer         | [0x7BE6BD57A319A7180f71552E58c9d32Da32b6f96](https://fraxscan.com/address/0x7BE6BD57A319A7180f71552E58c9d32Da32b6f96) |
| L2 Ownership Agent | [0x4BbdFEd5696b3a8F6B3813506b5389959C5CDC57](https://fraxscan.com/address/0x4BbdFEd5696b3a8F6B3813506b5389959C5CDC57) |
| L2 Parameter Agent | [0x61E0521A1FA8CA2f544ab6b7B7e89059e5b361FF](https://fraxscan.com/address/0x61E0521A1FA8CA2f544ab6b7B7e89059e5b361FF) |
| L2 Emergency Agent | [0xeF3D6Bc9a603AcABAEd46f43506F01e7eC4d1301](https://fraxscan.com/address/0xeF3D6Bc9a603AcABAEd46f43506F01e7eC4d1301) |
| L2 Vault           | [0x50eD95CEb917443eE0790Eea97494121CA318a6C](https://fraxscan.com/address/0x50eD95CEb917443eE0790Eea97494121CA318a6C) |
| Agent Blueprint    | [0x47fE2319e3Ea3451f87196Aca4973563CEda838b](https://fraxscan.com/address/0x47fE2319e3Ea3451f87196Aca4973563CEda838b) |


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


**:logos-polygon: Polygon zk-EVM**

| Contract Type      | Contract Address |
| :----------------: | :--------------: |
| L1 Broadcaster     | [0xB5e7fE8eA8ECbd33504485756fCabB5f5D29C051](https://etherscan.io/address/0xB5e7fE8eA8ECbd33504485756fCabB5f5D29C051) |
| L2 Relayer         | [0x5bcA7dDF1bcccB2eE8e46c56bfc9d3CDC77262bC](https://zkevm.polygonscan.com/address/0x5bcA7dDF1bcccB2eE8e46c56bfc9d3CDC77262bC) |
| L2 Ownership Agent | [0x2641ed8034CE92f57377F88852E95eB97AeFDf3a](https://zkevm.polygonscan.com/address/0x2641ed8034CE92f57377F88852E95eB97AeFDf3a) |
| L2 Parameter Agent | [0x4f172B31Da98bc3806aeB98C22525d43304bfea2](https://zkevm.polygonscan.com/address/0x4f172B31Da98bc3806aeB98C22525d43304bfea2) |
| L2 Emergency Agent | [0xb0261f64E512322EfB35E92C353301eC36b9712B](https://zkevm.polygonscan.com/address/0xb0261f64E512322EfB35E92C353301eC36b9712B) |
| L2 Vault           | [0x13DFF1809D1E9ddf9Ac901F47817B7F45220A846](https://zkevm.polygonscan.com/address/0x13DFF1809D1E9ddf9Ac901F47817B7F45220A846) |
| Agent Blueprint    | [0xe35A879E5EfB4F1Bb7F70dCF3250f2e19f096bd8](https://zkevm.polygonscan.com/address/0xe35A879E5EfB4F1Bb7F70dCF3250f2e19f096bd8) |


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

## Curve X-DAO

!!!github "GitHub"
    Source code for cross-chain structure contracts is available on [:material-github: GitHub](https://github.com/curvefi/curve-xdao).


**:logos-ethereum: Ethereum**

| Contract Type | Contract Address |
| :------------ | :--------------- |
| Bridge Owner Proxy | [`0x5a02d537fE0044E3eF506ccfA08f370425d1408C`](https://etherscan.io/address/0x5a02d537fE0044E3eF506ccfA08f370425d1408C#code) |


**CRV Bridges**

| Chain | Contract Address |
| :---- | :--------------- |
| AVAX Bridge (LayerZero) | [`0x5cc0144A511807608eF644c9e99B486124D1cFd6`](https://etherscan.io/address/0x5cc0144A511807608eF644c9e99B486124D1cFd6#code) |
| FTM Bridge (LayerZero) | [`0x7ce8aF75A9180B602445bE230860DDcb4cAc3E42`](https://etherscan.io/address/0x7ce8aF75A9180B602445bE230860DDcb4cAc3E42#code) |
| BNB Bridge (LayerZero) | [`0xC91113B4Dd89dd20FDEECDAC82477Bc99A840355`](https://etherscan.io/address/0xC91113B4Dd89dd20FDEECDAC82477Bc99A840355#code) |
| KAVA Bridge (LayerZero) | [`0x3C8D2A033131551a3f09E7b5c07DB01d547311CC`](https://etherscan.io/address/0x3C8D2A033131551a3f09E7b5c07DB01d547311CC#code) |


**crvUSD Bridges**

| Chain | Contract Address |
| :---- | :--------------- |
| AVAX Bridge (LayerZero) | [`0x26D01ce989037befd7Ff63837A86e2da32E7D7e2`](https://etherscan.io/address/0x26D01ce989037befd7Ff63837A86e2da32E7D7e2#code) |
| BNB Bridge (LayerZero) | [`0x0A92Fd5271dB1C41564BD01ef6b1a75fC1db4d4f`](https://etherscan.io/address/0x0A92Fd5271dB1C41564BD01ef6b1a75fC1db4d4f#code) |
| FTM Bridge (LayerZero) | [`0x76EAfda658C54548B460B3f190386699DE3827d8`](https://etherscan.io/address/0x76EAfda658C54548B460B3f190386699DE3827d8#code) |
| KAVA Bridge (LayerZero) | [`0x1C4e4553F95C28bc529233Cc35D550befE7B83Fc`](https://etherscan.io/address/0x1C4e4553F95C28bc529233Cc35D550befE7B83Fc#code) |


**Keepers (Block Hash Sender)**

| Chain | Contract Address |
| :---- | :--------------- |
| AVAX Keeper (LayerZero) | [`0x90fe734080403F9dBDb343478A390B901CF3922C`](https://etherscan.io/address/0x90fe734080403F9dBDb343478A390B901CF3922C#code) |
| FTM Keeper (LayerZero) | [`0x9116ED9cfA7f291C3F7c8F855Db065c7ab5723e7`](https://etherscan.io/address/0x9116ED9cfA7f291C3F7c8F855Db065c7ab5723e7#code) |
| BSC Keeper (LayerZero) | [`0x49cdecc38B4CAf6a07c13558A32820333BC2aB61`](https://etherscan.io/address/0x49cdecc38B4CAf6a07c13558A32820333BC2aB61#code) |
| KAVA Keeper (LayerZero) | [`0xbBFE8c07430a2ccc00A12874534Fe7f929914e7D`](https://etherscan.io/address/0xbBFE8c07430a2ccc00A12874534Fe7f929914e7D#code) |
| Polygon Keeper (LayerZero) | [`0x845F4E2a88B12978e50C08b46a1d5A1b0eEe28aA`](https://etherscan.io/address/0x845F4E2a88B12978e50C08b46a1d5A1b0eEe28aA#code) |
| CCIP Keeper | [`0x51a00F38CB1c055EbbBE380D3bA3D27CAE5d9e61`](https://etherscan.io/address/0x51a00F38CB1c055EbbBE380D3bA3D27CAE5d9e61#code) |


**:logos-avalanche: Avalanche**

| Contract Type | Contract Address |
| :------------ | :--------------- |
| CRV ETH Bridge (LayerZero) | [`0x5cc0144A511807608eF644c9e99B486124D1cFd6`](https://snowscan.xyz/address/0x5cc0144A511807608eF644c9e99B486124D1cFd6#code) |
| CRVUSD ETH Bridge (LayerZero) | [`0x26D01ce989037befd7Ff63837A86e2da32E7D7e2`](https://snowscan.xyz/address/0x26D01ce989037befd7Ff63837A86e2da32E7D7e2#code) |
| SCRVUSD ETH Bridge (LayerZero) | [`0x26E91B1f142b9bF0bB37e82959bA79D2Aa6b99b8`](https://snowscan.xyz/address/0x26E91B1f142b9bF0bB37e82959bA79D2Aa6b99b8#code) |
| Block Hash Oracle | [`0xD823D2a2B5AF77835e972A0D5B77f5F5A9a003A6`](https://snowscan.xyz/address/0xD823D2a2B5AF77835e972A0D5B77f5F5A9a003A6#code) |
| CRV Minter | [`0xcaf4969dAb56C20fCb89ceC041079AB02158fE3E`](https://snowscan.xyz/address/0xcaf4969dAb56C20fCb89ceC041079AB02158fE3E#code) |
| CRVUSD Minter | [`0x4765288DE2672A961cc5A9f52bE75005cAF005a5`](https://snowscan.xyz/address/0x4765288DE2672A961cc5A9f52bE75005cAF005a5#code) |
| SCRVUSD Minter | [`0x47ca04Ee05f167583122833abfb0f14aC5677Ee4`](https://snowscan.xyz/address/0x47ca04Ee05f167583122833abfb0f14aC5677Ee4#code) |
| Token (CRV20) | [`0xEEbC562d445F4bC13aC75c8caABb438DFae42A1B`](https://snowscan.xyz/address/0xEEbC562d445F4bC13aC75c8caABb438DFae42A1B#code) |
| Token (CRVUSD) | [`0xCb7c161602d04C4e8aF1832046EE08AAF96d855D`](https://snowscan.xyz/address/0xCb7c161602d04C4e8aF1832046EE08AAF96d855D#code) |
| Token (SCRVUSD) | [`0xA3ea433509F7941df3e33857D9c9f212Ad4A4e64`](https://snowscan.xyz/address/0xA3ea433509F7941df3e33857D9c9f212Ad4A4e64#code) |
| Gauge Type Oracle | [`0x01689FE734D0aA98be3A9a761aE11a20Dd968E41`](https://snowscan.xyz/address/0x01689FE734D0aA98be3A9a761aE11a20Dd968E41#code) |
| Gauge Type Prover | [`0x0B2584EfC66e9954e72d516be2Bb855EF0Defe62`](https://snowscan.xyz/address/0x0B2584EfC66e9954e72d516be2Bb855EF0Defe62#code) |
| Message Digest Prover | [`0xd5cF10C83aC5F30Ab27B6156DA9c238Aa63a63d0`](https://snowscan.xyz/address/0xd5cF10C83aC5F30Ab27B6156DA9c238Aa63a63d0#code) |


**:logos-fantom: Fantom**

| Contract Type | Contract Address |
| :------------ | :--------------- |
| CRV ETH Bridge (LayerZero) | [`0x7ce8aF75A9180B602445bE230860DDcb4cAc3E42`](https://ftmscout.com/address/0x7ce8aF75A9180B602445bE230860DDcb4cAc3E42#code) |
| CRVUSD ETH Bridge (LayerZero) | [`0x76EAfda658C54548B460B3f190386699DE3827d8`](https://ftmscout.com/address/0x76EAfda658C54548B460B3f190386699DE3827d8#code) |
| SCRVUSD ETH Bridge (LayerZero) | [`0x08132eA9b02750E118cF5F5C640B7c46A8E638E8`](https://ftmscout.com/address/0x08132eA9b02750E118cF5F5C640B7c46A8E638E8#code) |
| Block Hash Oracle | [`0xF179D410C710e3c35A17468B2624dCFCC7DB8267`](https://ftmscout.com/address/0xF179D410C710e3c35A17468B2624dCFCC7DB8267#code) |
| CRV Minter | [`0x444D6B4d7Ad9521FbFB563B4f896ace22DDB70c6`](https://ftmscout.com/address/0x444D6B4d7Ad9521FbFB563B4f896ace22DDB70c6#code) |
| CRVUSD Minter | [`0x01689FE734D0aA98be3A9a761aE11a20Dd968E41`](https://ftmscout.com/address/0x01689FE734D0aA98be3A9a761aE11a20Dd968E41#code) |
| SCRVUSD Minter | [`0xF830b9E88f994BbB069aC884d40fA2E09d050BB8`](https://ftmscout.com/address/0xF830b9E88f994BbB069aC884d40fA2E09d050BB8#code) |
| Token (CRV20) | [`0xE6c259bc0FCE25b71fE95A00361D3878E16232C3`](https://ftmscout.com/address/0xE6c259bc0FCE25b71fE95A00361D3878E16232C3#code) |
| Token (CRVUSD) | [`0xD823D2a2B5AF77835e972A0D5B77f5F5A9a003A6`](https://ftmscout.com/address/0xD823D2a2B5AF77835e972A0D5B77f5F5A9a003A6#code) |
| Token (SCRVUSD) | [`0x5191946500e75f0A74476F146dF7d386e52961d9`](https://ftmscout.com/address/0x5191946500e75f0A74476F146dF7d386e52961d9#code) |
| Gauge Type Oracle | [`0x898Cd2cCE27CE3eb7eACBDD85FEd8181379f0F46`](https://ftmscout.com/address/0x898Cd2cCE27CE3eb7eACBDD85FEd8181379f0F46#code) |
| Gauge Type Prover | [`0x7FA0a0E2820b7B12aeFb3A2A3c0C6F83aAD87054`](https://ftmscout.com/address/0x7FA0a0E2820b7B12aeFb3A2A3c0C6F83aAD87054#code) |
| Message Digest Prover | [`0xAb0ab357a10c0161002A91426912933750082A9d`](https://ftmscout.com/address/0xAb0ab357a10c0161002A91426912933750082A9d#code) |


**:logos-bsc: Binance Smart Chain**

| Contract Type | Contract Address |
| :------------ | :--------------- |
| CRV ETH Bridge (LayerZero) | [`0xC91113B4Dd89dd20FDEECDAC82477Bc99A840355`](https://bscscan.com/address/0xC91113B4Dd89dd20FDEECDAC82477Bc99A840355#code) |
| crvUSD ETH Bridge (LayerZero) | [`0x0A92Fd5271dB1C41564BD01ef6b1a75fC1db4d4f`](https://bscscan.com/address/0x0A92Fd5271dB1C41564BD01ef6b1a75fC1db4d4f#code) |
| SCRVUSD ETH Bridge (LayerZero) | [`0xAE0666C978500f2C05784242B79B08C478Dd999c`](https://bscscan.com/address/0xAE0666C978500f2C05784242B79B08C478Dd999c#code) |
| Block Hash Oracle | [`0x7cDe6Ef7e2e2FD3B6355637F1303586D7262ba37`](https://bscscan.com/address/0x7cDe6Ef7e2e2FD3B6355637F1303586D7262ba37#code) |
| CRV Minter | [`0x458599F83764aE9D0528301c1b6CB18dE63726bF`](https://bscscan.com/address/0x458599F83764aE9D0528301c1b6CB18dE63726bF#code) |
| CRVUSD Minter | [`0xc417E91098402Dd4F677782a2eC204C429CE513A`](https://bscscan.com/address/0xc417E91098402Dd4F677782a2eC204C429CE513A#code) |
| SCRVUSDMinter | [`0x4C62AC3F6088E882C9B2a315056bc298D22128bd`](https://bscscan.com/address/0x4C62AC3F6088E882C9B2a315056bc298D22128bd#code) |
| Token (CRV20) | [`0x9996D0276612d23b35f90C51EE935520B3d7355B`](https://bscscan.com/address/0x9996D0276612d23b35f90C51EE935520B3d7355B#code) |
| Token (CRVUSD) | [`0xe2fb3F127f5450DeE44afe054385d74C392BdeF4`](https://bscscan.com/address/0xe2fb3F127f5450DeE44afe054385d74C392BdeF4#code) |
| Token (SCRVUSD) | [`0x0094Ad026643994c8fB2136ec912D508B15fe0E5`](https://bscscan.com/address/0x0094Ad026643994c8fB2136ec912D508B15fe0E5#code) |
| Gauge Type Oracle | [`0x60dcc21869C6De55b50a196bE3c6D2Da189efD18`](https://bscscan.com/address/0x60dcc21869C6De55b50a196bE3c6D2Da189efD18#code) |
| Gauge Type Prover | [`0xd7454AEbf1C37661dfb5d2857F6aF7a2E09975bc`](https://bscscan.com/address/0xd7454AEbf1C37661dfb5d2857F6aF7a2E09975bc#code) |
| Message Digest Prover | [`0xbfF1f56c8e48e2F2F52941e16FEecc76C49f1825`](https://bscscan.com/address/0xbfF1f56c8e48e2F2F52941e16FEecc76C49f1825#code) |


**:logos-kava: Kava**

| Contract Type | Contract Address |
| :------------ | :--------------- |
| CRV ETH Bridge (LayerZero) | [`0x3C8D2A033131551a3f09E7b5c07DB01d547311CC`](https://kavascan.com/address/0x3C8D2A033131551a3f09E7b5c07DB01d547311CC#code) |
| crvUSD ETH Bridge (LayerZero) | [`0x1C4e4553F95C28bc529233Cc35D550befE7B83Fc`](https://kavascan.com/address/0x1C4e4553F95C28bc529233Cc35D550befE7B83Fc#code) |
| Block Hash Oracle | [`0x05d4E2Ed7216A204e5FB4e3F5187eCfaa5eF3Ef7`](https://kavascan.com/address/0x05d4E2Ed7216A204e5FB4e3F5187eCfaa5eF3Ef7#code) |
| Minter | [`0x65a0b01756E837e6670634816E4F5B3a3fF21107`](https://kavascan.com/address/0x65a0b01756E837e6670634816E4F5B3a3fF21107#code) |
| Token (CRV20) | [`0x7736C61F00c72e868AA9904c9063e8445A1eF5DD`](https://kavascan.com/address/0x7736C61F00c72e868AA9904c9063e8445A1eF5DD#code) |
| Token (CRVUSD) | [`0x98B4029CaBEf7Fd525A36B0BF8555EC1d42ec0B6`](https://kavascan.com/address/0x98B4029CaBEf7Fd525A36B0BF8555EC1d42ec0B6#code) |
| Minter (CRVUSD) | [`0xEfDE221f306152971D8e9f181bFe998447975810`](https://kavascan.com/address/0xEfDE221f306152971D8e9f181bFe998447975810#code) |
| Gauge Type Oracle | [`0x1E7B1Bd0490ddE12F6E3d09766Beb05552AFe27A`](https://kavascan.com/address/0x1E7B1Bd0490ddE12F6E3d09766Beb05552AFe27A#code) |
| Gauge Type Prover | [`0x64ed8CfF5Ad3DaEb217abE03a00Ff2D90b86456b`](https://kavascan.com/address/0x64ed8CfF5Ad3DaEb217abE03a00Ff2D90b86456b#code) |
| Message Digest Prover | [`0x5373E1B9f2781099f6796DFe5D68DE59ac2F18E3](https://kavascan.com/address/0x5373E1B9f2781099f6796DFe5D68DE59ac2F18E3#code) |


**:logos-polygon: Polygon**

| Contract Type | Contract Address |
| :------------ | :--------------- |
| Block Hash Oracle | [`0xEeE35C0d23Ac93fdF9033B54453a41e23Ca66D04`](https://polygonscan.com/address/0xEeE35C0d23Ac93fdF9033B54453a41e23Ca66D04#code) |
| Gauge Type Oracle | [`0xa5a1d8DCAf455De190902EFACcCDA551a3Caa193`](https://polygonscan.com/address/0xa5a1d8DCAf455De190902EFACcCDA551a3Caa193#code) |
| Gauge Type Prover | [`0xA092A338c97F18FF5F23EC1Ef64bcb40354eaa5A`](https://polygonscan.com/address/0xA092A338c97F18FF5F23EC1Ef64bcb40354eaa5A#code) |
| Message Digest Prover | [`0x43DaC0b0d040376335f084e058fc6212677A6043`](https://polygonscan.com/address/0x43DaC0b0d040376335f084e058fc6212677A6043#code) |

---

## EVM Sidechain Gauges

### Old Implementation

!!!warning "Deprecated"
    The old implementation of sidechain gauges is deprecated and will be removed in the future.

!!!danger "MULTICHAIN WARNING"
    At the time of writing (13.11.2023), sidechain gauges on Celo, Avalanche and Fantom are disabled due to issues with Multichain.
    The Multichain service stopped currently, and all bridge transactions will be stuck on the source chains. There is no confirmed resume time.
    Multichain statement: https://twitter.com/MultichainOrg/status/1677180114227056641

!!!github "GitHub"
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

### New Implementation

**RootGauge Factory**

| Chain ID | Chain | Address |
| :------: | ----- | ------- |
| `1` | :logos-ethereum: Ethereum | [0x306A45a1478A000dC701A6e1f7a569afb8D9DCD6](https://etherscan.io/address/0x306A45a1478A000dC701A6e1f7a569afb8D9DCD6) |

**ChildGauge Factory**

| Chain ID | Chain | Address |
| :------: | ----- | ------- |
| `100` | :logos-gnosis: Gnosis | [0x06471ED238306a427241B3eA81352244E77B004F](https://gnosisscan.io/address/0x06471ED238306a427241B3eA81352244E77B004F) |
| `137` | :logos-polygon: Polygon | [0x55a1C26CE60490A15Bdd6bD73De4F6346525e01e](https://polygonscan.com/address/0x55a1C26CE60490A15Bdd6bD73De4F6346525e01e) |
| `196` | :logos-xlayer: X-Layer | [0xD5C3e070E121488806AaA5565283A164ACEB94Df](https://www.oklink.com/xlayer/address/0xd5c3e070e121488806aaa5565283a164aceb94df) |
| `5000` | :logos-mantle: Mantle | [0x0B8D6B6CeFC7Aa1C2852442e518443B1b22e1C52](https://explorer.mantle.xyz/address/0x0B8D6B6CeFC7Aa1C2852442e518443B1b22e1C52) |
| `1101` | :logos-polygon: Polygon zkEVM | [0x3c0a405E914337139992625D5100Ea141a9C4d11](https://zkevm.polygonscan.com/address/0x3c0a405E914337139992625D5100Ea141a9C4d11) |
| `252` | :logos-fraxtal: Fraxtal | [0x0B8D6B6CeFC7Aa1C2852442e518443B1b22e1C52](https://fraxscan.com/address/0x0B8D6B6CeFC7Aa1C2852442e518443B1b22e1C52) |
| `42161` | :logos-arbitrum: Arbitrum | [0x988d1037e9608B21050A8EFba0c6C45e01A3Bce7](https://arbiscan.io/address/0x988d1037e9608B21050A8EFba0c6C45e01A3Bce7) |
| `8453` | :logos-base: Base | [0xe35A879E5EfB4F1Bb7F70dCF3250f2e19f096bd8](https://basescan.org/address/0xe35A879E5EfB4F1Bb7F70dCF3250f2e19f096bd8) |
| `10` | :logos-optimism: Optimism | [0x871fBD4E01012e2E8457346059e8C189d664DbA4](https://optimistic.etherscan.io/address/0x871fBD4E01012e2E8457346059e8C189d664DbA4) |
| `324` | :logos-zksync: zkSync Era | [0x167D9C27070Ce04b79820E6aaC0cF243d6098812](https://explorer.zksync.io/address/0x167D9C27070Ce04b79820E6aaC0cF243d6098812) |
| `1313161554` | :logos-aurora: Aurora | [0xe35A879E5EfB4F1Bb7F70dCF3250f2e19f096bd8](https://explorer.aurora.dev/address/0xe35A879E5EfB4F1Bb7F70dCF3250f2e19f096bd8) |
| `43114` | :logos-avalanche: Avalanche | [0x97aDC08FA1D849D2C48C5dcC1DaB568B169b0267](https://snowscan.xyz/address/0x97aDC08FA1D849D2C48C5dcC1DaB568B169b0267) |
| `56` | :logos-bsc: Binance Smart Chain | [0xe35A879E5EfB4F1Bb7F70dCF3250f2e19f096bd8](https://bscscan.com/address/0xe35A879E5EfB4F1Bb7F70dCF3250f2e19f096bd8) |
| `42220` | :logos-celo: Celo | [0xe35A879E5EfB4F1Bb7F70dCF3250f2e19f096bd8](https://explorer.celo.org/address/0xe35A879E5EfB4F1Bb7F70dCF3250f2e19f096bd8) |
| `250` | :logos-fantom: Fantom | [0x004A476B5B76738E34c86C7144554B9d34402F13](https://ftmscout.com/address/0x004A476B5B76738E34c86C7144554B9d34402F13) |
| `2222` | :logos-kava: Kava | [0xe35A879E5EfB4F1Bb7F70dCF3250f2e19f096bd8](https://explorer.kava.io/address/0xe35A879E5EfB4F1Bb7F70dCF3250f2e19f096bd8) |
| `1284` | Moonbeam | [0xe35A879E5EfB4F1Bb7F70dCF3250f2e19f096bd8](https://moonbeam.moonscan.io/address/0xe35A879E5EfB4F1Bb7F70dCF3250f2e19f096bd8) |
| `999` | :logos-hyperliquid: Hyperliquid | [0x8b3EFBEfa6eD222077455d6f0DCdA3bF4f3F57A6](https://www.hyperscan.com/address/0x8b3EFBEfa6eD222077455d6f0DCdA3bF4f3F57A6) |

---

## Address Provider

The full documentation for the `AddressProvider` contracts can be found [here](../integration/address-provider.md). Source code for the `AddressProvider` contracts is available on [:material-github: GitHub](https://github.com/curvefi/metaregistry/blob/main/contracts/AddressProviderNG.vy).

| Chain                           | Contract Address |
| ------------------------------- | ---------------- |
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
| :logos-xlayer: `X-Layer`        | [0x5ffe7fb82894076ecb99a30d6a32e969e6e35e98](https://www.okx.com/web3/explorer/xlayer/address/0x5ffe7fb82894076ecb99a30d6a32e969e6e35e98) |
| :logos-zksync: `zk-Sync`        | [0x960C90aE833af0fd699dBc2503468A07cC28FA4F](https://era.zksync.network/address/0x960C90aE833af0fd699dBc2503468A07cC28FA4F) |
| :logos-hyperliquid: `Hyperliquid` | [0x1764ee18e8B3ccA4787249Ceb249356192594585](https://www.hyperscan.com/address/0x1764ee18e8B3ccA4787249Ceb249356192594585) |

---

## Meta Registry

The full documentation for the `MetaRegistry` contracts can be found [here](../registry/overview.md). Source code for the `MetaRegistry` and `MetaRegistryL2` contracts is available on [:material-github: GitHub](https://github.com/curvefi/metaregistry/tree/main/contracts).

Each `MetaRegistry` is integrated into the chain-specific [`AddressProvider`](#address-provider) at `ID = 7`. To get the **most recent contract, users are advised to fetch it directly from the `AddressProvider` contract**.

*For example, to query the `MetaRegistry` contract on Ethereum, one can call `get_address(7)` on the `AddressProvider`:*

```py
>>> AddressProvider.get_address(7)
'0xF98B45FA17DE75FB1aD0e7aFD971b0ca00e379fC'
```

---

## Rate Provider

The full documentation for the `RateProvider` contracts can be found [here](../integration/rate-provider.md). Source code for the `RateProvider` contracts is available on [:material-github: GitHub](https://github.com/curvefi/metaregistry/blob/main/contracts/RateProvider.vy).

Each `RateProvider` is integrated into the chain-specific [`AddressProvider`](#address-provider) at `ID = 18`.

*For example, to query the `RateProvider` contract on Ethereum, one can call `get_address(18)` on the `AddressProvider`:*

```py
>>> AddressProvider.get_address(18)
'0xA834f3d23749233c9B61ba723588570A1cCA0Ed7'
```

---

## Decentralized Exchange (DEX)

### Stableswap-NG

The full documentation for the `Stableswap-NG` contracts can be found [here](../stableswap-exchange/stableswap-ng/overview.md). Source code for the `Stableswap-NG` contracts is available on [:material-github: GitHub](https://github.com/curvefi/stableswap-ng).

!!!warning "Implementation Contracts"
    Every `Factory` contract has different implementation contracts which are used for different purposes. For more information, please refer to the according part of the [documentation](../factory/twocrypto-ng/overview.md).
    **Implementation contracts are upgradeable.** They can either be replaced, or additional implementation contracts can be added. As a result, the deployment addresses of these implementations are not listed below. To query the implementation contracts, please fetch them directly from the respective `Factory`.

| Chain | Contract Address |
| ----- | ------- |
| :logos-ethereum: Ethereum | [0x6A8cbed756804B16E05E741eDaBd5cB544AE21bf](https://etherscan.io/address/0x6A8cbed756804B16E05E741eDaBd5cB544AE21bf) |
| :logos-ethereum: Sepolia | [0xfb37b8D939FFa77114005e61CFc2e543d6F49A81](https://sepolia.etherscan.io/address/0xfb37b8D939FFa77114005e61CFc2e543d6F49A81) |
| :logos-base: Base | [0xd2002373543Ce3527023C75e7518C274A51ce712](https://basescan.org/address/0xd2002373543Ce3527023C75e7518C274A51ce712) |
| :logos-optimism: Optimism | [0x5eeE3091f747E60a045a2E715a4c71e600e31F6E](https://optimistic.etherscan.io/address/0x5eeE3091f747E60a045a2E715a4c71e600e31F6E) |
| :logos-fraxtal: Fraxtal | [0xd2002373543Ce3527023C75e7518C274A51ce712](https://fraxscan.com/address/0xd2002373543Ce3527023C75e7518C274A51ce712) |
| :logos-arbitrum: Arbitrum | [0x9AF14D26075f142eb3F292D5065EB3faa646167b](https://arbiscan.io/address/0x9AF14D26075f142eb3F292D5065EB3faa646167b) |
| :logos-polygon: Polygon | [0x1764ee18e8B3ccA4787249Ceb249356192594585](https://polygonscan.com/address/0x1764ee18e8B3ccA4787249Ceb249356192594585) |
|:logos-polygon: Polygon zk-EVM| [0xd2002373543Ce3527023C75e7518C274A51ce712](https://zkevm.polygonscan.com/address/0xd2002373543Ce3527023C75e7518C274A51ce712) |
| :logos-gnosis: Gnosis | [0xbC0797015fcFc47d9C1856639CaE50D0e69FbEE8](https://gnosisscan.io/address/0xbC0797015fcFc47d9C1856639CaE50D0e69FbEE8) |
| :logos-avalanche: Avalanche | [0x1764ee18e8B3ccA4787249Ceb249356192594585](https://snowscan.xyz/address/0x1764ee18e8B3ccA4787249Ceb249356192594585) |
| :logos-fantom: Fantom | [0xe61Fb97Ef6eBFBa12B36Ffd7be785c1F5A2DE66b](https://ftmscout.com/address/0xe61Fb97Ef6eBFBa12B36Ffd7be785c1F5A2DE66b) |
|:logos-bsc: Binance Smart Chain| [0xd7E72f3615aa65b92A4DBdC211E296a35512988B](https://bscscan.com/address/0xd7E72f3615aa65b92A4DBdC211E296a35512988B) |
|:logos-linea: Linea| [0x5eeE3091f747E60a045a2E715a4c71e600e31F6E](https://lineascan.build/address/0x5eeE3091f747E60a045a2E715a4c71e600e31F6E) |
|:logos-scroll: Scroll| [0x5eeE3091f747E60a045a2E715a4c71e600e31F6E](https://scrollscan.com/address/0x5eeE3091f747E60a045a2E715a4c71e600e31F6E) |
|:logos-mantle: Mantle| [0x5eeE3091f747E60a045a2E715a4c71e600e31F6E](https://mantlescan.xyz/address/0x5eeE3091f747E60a045a2E715a4c71e600e31F6E) |
|:logos-celo: Celo| [0x1764ee18e8B3ccA4787249Ceb249356192594585](https://celoscan.io/address/0x1764ee18e8B3ccA4787249Ceb249356192594585) |
|:logos-kava: Kava| [0x1764ee18e8B3ccA4787249Ceb249356192594585](https://kavascan.com/address/0x1764ee18e8B3ccA4787249Ceb249356192594585) |
|:logos-aurora: Aurora| [0x5eeE3091f747E60a045a2E715a4c71e600e31F6E](https://explorer.aurora.dev/address/0x5eeE3091f747E60a045a2E715a4c71e600e31F6E) |
|:logos-xlayer: X-Layer| [0x5eeE3091f747E60a045a2E715a4c71e600e31F6E](https://www.oklink.com/xlayer/address/0x5eeE3091f747E60a045a2E715a4c71e600e31F6E) |
|:logos-zksync: zk-Sync| [0x5eeE3091f747E60a045a2E715a4c71e600e31F6E](https://explorer.zksync.io/address/0x5eeE3091f747E60a045a2E715a4c71e600e31F6E) |
|:logos-hyperliquid: Hyperliquid | [0x604388Bb1159AFd21eB5191cE22b4DeCdEE2Ae22](https://www.hyperscan.com/address/0x604388Bb1159AFd21eB5191cE22b4DeCdEE2Ae22) |

---

### Twocrypto-NG

The full documentation for the `Twocrypto-NG` contracts can be found [here](../cryptoswap-exchange/twocrypto-ng/overview.md). Source code for the `Twocrypto-NG` contracts is available on [:material-github: GitHub](https://github.com/curvefi/twocrypto-ng).

!!!warning "Implementation Contracts"
    Every `Factory` contract has different implementation contracts which are used for different purposes. For more information, please refer to the according part of the [documentation](../factory/twocrypto-ng/overview.md).
    **Implementation contracts are upgradeable.** They can either be replaced, or additional implementation contracts can be added. As a result, the deployment addresses of these implementations are not listed below. To query the implementation contracts, please fetch them directly from the respective `Factory`.

| Chain | Contract Address |
| ----- | ------- |
| :logos-ethereum: Ethereum | [0x98EE851a00abeE0d95D08cF4CA2BdCE32aeaAF7F](https://etherscan.io/address/0x98EE851a00abeE0d95D08cF4CA2BdCE32aeaAF7F) |
| :logos-ethereum: Sepolia | [0x98EE851a00abeE0d95D08cF4CA2BdCE32aeaAF7F](https://sepolia.etherscan.io/address/0x98EE851a00abeE0d95D08cF4CA2BdCE32aeaAF7F) |
| :logos-base: Base | [0xc9Fe0C63Af9A39402e8a5514f9c43Af0322b665F](https://basescan.org/address/0xc9Fe0C63Af9A39402e8a5514f9c43Af0322b665F) |
| :logos-arbitrum: Arbitrum | [0x98EE851a00abeE0d95D08cF4CA2BdCE32aeaAF7F](https://arbiscan.io/address/0x98EE851a00abeE0d95D08cF4CA2BdCE32aeaAF7F) |
| :logos-optimism: Optimism | [0x98EE851a00abeE0d95D08cF4CA2BdCE32aeaAF7F](https://optimistic.etherscan.io/address/0x98EE851a00abeE0d95D08cF4CA2BdCE32aeaAF7F) |
| :logos-fraxtal: Fraxtal | [0x98EE851a00abeE0d95D08cF4CA2BdCE32aeaAF7F](https://fraxscan.com/address/0x98EE851a00abeE0d95D08cF4CA2BdCE32aeaAF7F) |
| :logos-polygon: Polygon | [0x98EE851a00abeE0d95D08cF4CA2BdCE32aeaAF7F](https://polygonscan.com/address/0x98EE851a00abeE0d95D08cF4CA2BdCE32aeaAF7F) |
| :logos-polygon: Polygon zk-EVM | [0x98EE851a00abeE0d95D08cF4CA2BdCE32aeaAF7F](https://zkevm.polygonscan.com/address/0x98EE851a00abeE0d95D08cF4CA2BdCE32aeaAF7F) |
| :logos-gnosis: Gnosis | [0x98EE851a00abeE0d95D08cF4CA2BdCE32aeaAF7F](https://gnosisscan.io/address/0x98EE851a00abeE0d95D08cF4CA2BdCE32aeaAF7F) |
| :logos-avalanche: Avalanche | [0x98EE851a00abeE0d95D08cF4CA2BdCE32aeaAF7F](https://snowscan.xyz/address/0x98EE851a00abeE0d95D08cF4CA2BdCE32aeaAF7F) |
| :logos-fantom: Fantom | [0x98EE851a00abeE0d95D08cF4CA2BdCE32aeaAF7F](https://ftmscout.com/address/0x98EE851a00abeE0d95D08cF4CA2BdCE32aeaAF7F) |
|:logos-bsc: Binance Smart Chain| [0x98EE851a00abeE0d95D08cF4CA2BdCE32aeaAF7F](https://bscscan.com/address/0x98EE851a00abeE0d95D08cF4CA2BdCE32aeaAF7F) |
|:logos-linea: Linea| [0x98EE851a00abeE0d95D08cF4CA2BdCE32aeaAF7F](https://lineascan.build/address/0x98EE851a00abeE0d95D08cF4CA2BdCE32aeaAF7F) |
|:logos-scroll: Scroll| [0x98EE851a00abeE0d95D08cF4CA2BdCE32aeaAF7F](https://scrollscan.com/address/0x98EE851a00abeE0d95D08cF4CA2BdCE32aeaAF7F) |
|:logos-mantle: Mantle| [0x98EE851a00abeE0d95D08cF4CA2BdCE32aeaAF7F](https://mantlescan.xyz/address/0x98EE851a00abeE0d95D08cF4CA2BdCE32aeaAF7F) |
|:logos-celo: Celo| [0x98EE851a00abeE0d95D08cF4CA2BdCE32aeaAF7F](https://celoscan.io/address/0x98EE851a00abeE0d95D08cF4CA2BdCE32aeaAF7F) |
|:logos-kava: Kava| [0xd3B17f862956464ae4403cCF829CE69199856e1e](https://kavascan.com/address/0xd3B17f862956464ae4403cCF829CE69199856e1e) |
|:logos-aurora: Aurora| [0x98EE851a00abeE0d95D08cF4CA2BdCE32aeaAF7F](https://explorer.aurora.dev/address/0x98EE851a00abeE0d95D08cF4CA2BdCE32aeaAF7F) |
|:logos-xlayer: X-Layer| [0x0c59d36b23f809f8b6c7cb4c8c590a0ac103baef](https://www.oklink.com/xlayer/address/0x0c59d36b23f809f8b6c7cb4c8c590a0ac103baef) |
|:logos-zksync: zk-Sync| [0xf3a546AF64aFd6BB8292746BA66DB33aFAE72114](https://era.zksync.network/address/0xf3a546AF64aFd6BB8292746BA66DB33aFAE72114) |
|:logos-hyperliquid: Hyperliquid | [0xc9Fe0C63Af9A39402e8a5514f9c43Af0322b665F](https://www.hyperscan.com/address/0xc9Fe0C63Af9A39402e8a5514f9c43Af0322b665F) |

---

### Tricrypto-NG

The full documentation for the `Tricrypto-NG` contracts can be found [here](../cryptoswap-exchange/tricrypto-ng/overview.md). Source code for the `Tricrypto-NG` contracts is available on [:material-github: GitHub](https://github.com/curvefi/tricrypto-ng).

!!!warning "Implementation Contracts"
    Every `Factory` contract has different implementation contracts which are used for different purposes. For more information, please refer to the according part of the [documentation](../factory/tricrypto-ng/overview.md).
    **Implementation contracts are upgradeable.** They can either be replaced, or additional implementation contracts can be added. As a result, the deployment addresses of these implementations are not listed below. To query the implementation contracts, please fetch them directly from the respective `Factory`.

| Chain | Contract Address |
| ----- | ------- |
| :logos-ethereum: Ethereum | [0x0c0e5f2fF0ff18a3be9b835635039256dC4B4963](https://etherscan.io/address/0x0c0e5f2fF0ff18a3be9b835635039256dC4B4963) |
| :logos-ethereum: Sepolia | [0x4b00E8c997AeBACeEf6B8c6F89eE2bf99b2CA846](https://sepolia.etherscan.io/address/0x4b00E8c997AeBACeEf6B8c6F89eE2bf99b2CA846) |
| :logos-base: Base | [0xA5961898870943c68037F6848d2D866Ed2016bcB](https://basescan.org/address/0xA5961898870943c68037F6848d2D866Ed2016bcB) |
| :logos-arbitrum: Arbitrum | [0xbC0797015fcFc47d9C1856639CaE50D0e69FbEE8](https://arbiscan.io/address/0xbC0797015fcFc47d9C1856639CaE50D0e69FbEE8) |
| :logos-optimism: Optimism | [0xc6C09471Ee39C7E30a067952FcC89c8922f9Ab53](https://optimistic.etherscan.io/address/0xc6C09471Ee39C7E30a067952FcC89c8922f9Ab53) |
| :logos-fraxtal: Fraxtal | [0xc9Fe0C63Af9A39402e8a5514f9c43Af0322b665F](https://fraxscan.com/address/0xc9Fe0C63Af9A39402e8a5514f9c43Af0322b665F) |
| :logos-polygon: Polygon | [0xC1b393EfEF38140662b91441C6710Aa704973228](https://polygonscan.com/address/0xC1b393EfEF38140662b91441C6710Aa704973228) |
| :logos-polygon: Polygon zk-EVM | [0x76303e4fDcA0AbF28aB3ee42Ce086E6503431F1D](https://zkevm.polygonscan.com/address/0x76303e4fDcA0AbF28aB3ee42Ce086E6503431F1D) |
| :logos-gnosis: Gnosis | [0xb47988ad49dce8d909c6f9cf7b26caf04e1445c8](https://gnosisscan.io/address/0xb47988ad49dce8d909c6f9cf7b26caf04e1445c8) |
| :logos-avalanche: Avalanche | [0x3d6cB2F6DcF47CDd9C13E4e3beAe9af041d8796a](https://snowscan.xyz/address/0x3d6cB2F6DcF47CDd9C13E4e3beAe9af041d8796a) |
| :logos-fantom: Fantom | [0x9AF14D26075f142eb3F292D5065EB3faa646167b](https://ftmscout.com/address/0x9AF14D26075f142eb3F292D5065EB3faa646167b) |
|:logos-bsc: Binance Smart Chain| [0xc55837710bc500F1E3c7bb9dd1d51F7c5647E657](https://bscscan.com/address/0xc55837710bc500F1E3c7bb9dd1d51F7c5647E657) |
|:logos-linea: Linea| [0xd125E7a0cEddF89c6473412d85835450897be6Dc](https://lineascan.build/address/0xd125E7a0cEddF89c6473412d85835450897be6Dc) |
|:logos-scroll: Scroll| [0xC1b393EfEF38140662b91441C6710Aa704973228](https://scrollscan.com/address/0xC1b393EfEF38140662b91441C6710Aa704973228) |
|:logos-mantle: Mantle| [0x0C9D8c7e486e822C29488Ff51BFf0167B4650953](https://mantlescan.xyz/address/0x0C9D8c7e486e822C29488Ff51BFf0167B4650953) |
|:logos-celo: Celo| [0x3d6cB2F6DcF47CDd9C13E4e3beAe9af041d8796a](https://celoscan.io/address/0x3d6cB2F6DcF47CDd9C13E4e3beAe9af041d8796a) |
|:logos-kava: Kava| [0x3d6cB2F6DcF47CDd9C13E4e3beAe9af041d8796a](https://kavascan.com/address/0x3d6cB2F6DcF47CDd9C13E4e3beAe9af041d8796a) |
|:logos-aurora: Aurora| [0x3d6cB2F6DcF47CDd9C13E4e3beAe9af041d8796a](https://explorer.aurora.dev/address/0x3d6cB2F6DcF47CDd9C13E4e3beAe9af041d8796a) |
|:logos-xlayer: X-Layer| [0xd3b17f862956464ae4403ccf829ce69199856e1e](https://www.oklink.com/xlayer/address/0xd3b17f862956464ae4403ccf829ce69199856e1e) |
|:logos-zksync: zk-Sync| [0x5d4174C40f1246dABe49693845442927d5929f0D](https://explorer.zksync.io/address/0x5d4174C40f1246dABe49693845442927d5929f0D) |
|:logos-hyperliquid: Hyperliquid | [0x5702BDB1Ec244704E3cBBaAE11a0275aE5b07499](https://www.hyperscan.com/address/0x5702BDB1Ec244704E3cBBaAE11a0275aE5b07499) |

---

## Exchange Router

The full documentation for the `Router` contracts can be found [here](../router/CurveRouterNG.md). Source code for the `Router` contracts is available on [:material-github: GitHub](https://github.com/curvefi/curve-router-ng/tree/master/contracts).

| Chain                             | Contract Address |
| --------------------------------- | :--------------: |
| :logos-ethereum: `Ethereum v1.1`  | [0x16C6521Dff6baB339122a0FE25a9116693265353](https://etherscan.io/address/0x16C6521Dff6baB339122a0FE25a9116693265353) |
| :logos-ethereum: `Ethereum v1.2`  | [0x45312ea0eFf7E09C83CBE249fa1d7598c4C8cd4e](https://etherscan.io/address/0x45312ea0eFf7E09C83CBE249fa1d7598c4C8cd4e) |
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
| :logos-hyperliquid: `Hyperliquid`  | [0xd2002373543Ce3527023C75e7518C274A51ce712](https://www.hyperscan.com/address/0xd2002373543Ce3527023C75e7518C274A51ce712) |

---

## Zaps

**StableCalcZap**

Source code for the `StableCalcZap` contracts is available on [:material-github: GitHub](https://github.com/curvefi/curve-zaps/tree/master/contracts).

| Chain | Contract Address |
| ----- | :--------------: |
| :logos-ethereum: `Ethereum` | [0xCA8d0747B5573D69653C3aC22242e6341C36e4b4](https://etherscan.io/address/0xCA8d0747B5573D69653C3aC22242e6341C36e4b4) |
| :logos-arbitrum: `Arbitrum` | [0xCA8d0747B5573D69653C3aC22242e6341C36e4b4](https://arbiscan.io/address/0xCA8d0747B5573D69653C3aC22242e6341C36e4b4) |
| :logos-optimism: `Optimism` | [0xCA8d0747B5573D69653C3aC22242e6341C36e4b4](https://optimistic.etherscan.io/address/0xCA8d0747B5573D69653C3aC22242e6341C36e4b4) |
| :logos-base: `Base` | [0x5552b631e2aD801fAa129Aacf4B701071cC9D1f7](https://basescan.org/address/0x5552b631e2aD801fAa129Aacf4B701071cC9D1f7) |
| :logos-fraxtal: `Fraxtal` | [0xCA8d0747B5573D69653C3aC22242e6341C36e4b4](https://fraxscan.com/address/0xCA8d0747B5573D69653C3aC22242e6341C36e4b4) |
| :logos-polygon: `Polygon` | [0xCA8d0747B5573D69653C3aC22242e6341C36e4b4](https://polygonscan.com/address/0xCA8d0747B5573D69653C3aC22242e6341C36e4b4) |
| :logos-gnosis: `Gnosis` | [0xCA8d0747B5573D69653C3aC22242e6341C36e4b4](https://gnosisscan.io/address/0xCA8d0747B5573D69653C3aC22242e6341C36e4b4) |
| :logos-avalanche: `Avalanche` | [0xCA8d0747B5573D69653C3aC22242e6341C36e4b4](https://snowscan.xyz/address/0xCA8d0747B5573D69653C3aC22242e6341C36e4b4) |
| :logos-fantom: `Fantom` | [0xCA8d0747B5573D69653C3aC22242e6341C36e4b4](https://ftmscout.com/address/0xCA8d0747B5573D69653C3aC22242e6341C36e4b4) |
| :logos-bsc: `Binance Smart Chain` | [0x0fE38dCC905eC14F6099a83Ac5C93BF2601300CF](https://bscscan.com/address/0x0fE38dCC905eC14F6099a83Ac5C93BF2601300CF) |
| :logos-mantle: `Mantle` | [0x0fE38dCC905eC14F6099a83Ac5C93BF2601300CF](https://mantlescan.xyz/address/0x0fe38dcc905ec14f6099a83ac5c93bf2601300cf) |
| :logos-celo: `Celo`| [0xCA8d0747B5573D69653C3aC22242e6341C36e4b4](https://celoscan.io/address/0xCA8d0747B5573D69653C3aC22242e6341C36e4b4) |
| :logos-kava: `Kava` | [0xCA8d0747B5573D69653C3aC22242e6341C36e4b4](https://kavascan.com/address/0xCA8d0747B5573D69653C3aC22242e6341C36e4b4) |
| :logos-aurora: `Aurora` | [0xCA8d0747B5573D69653C3aC22242e6341C36e4b4](ttps://explorer.aurora.dev/address/0xCA8d0747B5573D69653C3aC22242e6341C36e4b4) |

---

**CryptoCalcZap**

Source code for the `CryptoCalcZap` contracts is available on [:material-github: GitHub](https://github.com/curvefi/curve-zaps/tree/master/contracts).

| Chain | Contract Address |
| ----- | :--------------: |
| :logos-ethereum: `Ethereum` | [0xA72C85C258A81761433B4e8da60505Fe3Dd551CC](https://etherscan.io/address/0xA72C85C258A81761433B4e8da60505Fe3Dd551CC) |
| :logos-arbitrum: `Arbitrum` | [0xA72C85C258A81761433B4e8da60505Fe3Dd551CC](https://arbiscan.io/address/0xA72C85C258A81761433B4e8da60505Fe3Dd551CC) |
| :logos-optimism: `Optimism` | [0xA72C85C258A81761433B4e8da60505Fe3Dd551CC](https://optimistic.etherscan.io/address/0xA72C85C258A81761433B4e8da60505Fe3Dd551CC) |
| :logos-base: `Base` | [0xEfadDdE5B43917CcC738AdE6962295A0B343f7CE](https://basescan.org/address/0xEfadDdE5B43917CcC738AdE6962295A0B343f7CE) |
| :logos-fraxtal: `Fraxtal` | [0x69522fb5337663d3B4dFB0030b881c1A750Adb4f](https://fraxscan.com/address/0x69522fb5337663d3B4dFB0030b881c1A750Adb4f) |
| :logos-polygon: `Polygon` | [0xA72C85C258A81761433B4e8da60505Fe3Dd551CC](https://polygonscan.com/address/0xA72C85C258A81761433B4e8da60505Fe3Dd551CC) |
| :logos-gnosis: `Gnosis` | [0xA72C85C258A81761433B4e8da60505Fe3Dd551CC](https://gnosisscan.io/address/0xA72C85C258A81761433B4e8da60505Fe3Dd551CC) |
| :logos-avalanche: `Avalanche` | [0xA72C85C258A81761433B4e8da60505Fe3Dd551CC](https://snowscan.xyz/address/0xA72C85C258A81761433B4e8da60505Fe3Dd551CC) |
| :logos-fantom: `Fantom` | [0xA72C85C258A81761433B4e8da60505Fe3Dd551CC](https://ftmscout.com/address/0xA72C85C258A81761433B4e8da60505Fe3Dd551CC) |
| :logos-bsc: `Binance Smart Chain` | [0xd6681e74eEA20d196c15038C580f721EF2aB6320](https://bscscan.com/address/0xd6681e74eEA20d196c15038C580f721EF2aB6320) |
| :logos-mantle: `Mantle` | [0xd6681e74eEA20d196c15038C580f721EF2aB6320](https://mantlescan.xyz/address/0xd6681e74eEA20d196c15038C580f721EF2aB6320) |
| :logos-celo: `Celo`| [0xA72C85C258A81761433B4e8da60505Fe3Dd551CC](https://celoscan.io/address/0xA72C85C258A81761433B4e8da60505Fe3Dd551CC) |
| :logos-kava: `Kava` | [0xA72C85C258A81761433B4e8da60505Fe3Dd551CC](https://kavascan.com/address/0xA72C85C258A81761433B4e8da60505Fe3Dd551CC) |
| :logos-aurora: `Aurora` | [0xA72C85C258A81761433B4e8da60505Fe3Dd551CC](https://explorer.aurora.dev/address/0xA72C85C258A81761433B4e8da60505Fe3Dd551CC) |

---

**DepositAndStakeZap**

Source code for the `DepositAndStakeZap` contracts is available on [:material-github: GitHub](https://github.com/curvefi/deposit-and-stake-zap/tree/master/contracts).

| Chain | Contract Address |
| ----- | :--------------: |
| :logos-ethereum: `Ethereum` | [0x56C526b0159a258887e0d79ec3a80dfb940d0cD7](https://etherscan.io/address/0x56C526b0159a258887e0d79ec3a80dfb940d0cD7) |
| :logos-arbitrum: `Arbitrum` | [0x37c5ab57AF7100Bdc9B668d766e193CCbF6614FD](https://arbiscan.io/address/0x37c5ab57AF7100Bdc9B668d766e193CCbF6614FD) |
| :logos-optimism: `Optimism` | [0x37c5ab57AF7100Bdc9B668d766e193CCbF6614FD](https://optimistic.etherscan.io/address/0x37c5ab57AF7100Bdc9B668d766e193CCbF6614FD) |
| :logos-base: `Base` | [0x69522fb5337663d3B4dFB0030b881c1A750Adb4f](https://basescan.org/address/0x69522fb5337663d3B4dFB0030b881c1A750Adb4f) |
| :logos-fraxtal: `Fraxtal` | [0xF0d4c12A5768D806021F80a262B4d39d26C58b8D](https://fraxscan.com/address/0xF0d4c12A5768D806021F80a262B4d39d26C58b8D) |
| :logos-polygon: `Polygon` | [0x37c5ab57AF7100Bdc9B668d766e193CCbF6614FD](https://polygonscan.com/address/0x37c5ab57AF7100Bdc9B668d766e193CCbF6614FD) |
| :logos-gnosis: `Gnosis` | [0x37c5ab57AF7100Bdc9B668d766e193CCbF6614FD](https://gnosisscan.io/address/0x37c5ab57AF7100Bdc9B668d766e193CCbF6614FD) |
| :logos-avalanche: `Avalanche` | [0x37c5ab57AF7100Bdc9B668d766e193CCbF6614FD](https://snowscan.xyz/address/0x37c5ab57AF7100Bdc9B668d766e193CCbF6614FD) |
| :logos-fantom: `Fantom` | [0x37c5ab57AF7100Bdc9B668d766e193CCbF6614FD](https://ftmscout.com/address/0x37c5ab57AF7100Bdc9B668d766e193CCbF6614FD) |
| :logos-bsc: `Binance Smart Chain` | [0x4f37A9d177470499A2dD084621020b023fcffc1F](https://bscscan.com/address/0x4f37A9d177470499A2dD084621020b023fcffc1F) |
| :logos-mantle: `Mantle` | [0xF0d4c12A5768D806021F80a262B4d39d26C58b8D](https://mantlescan.xyz/address/0xF0d4c12A5768D806021F80a262B4d39d26C58b8D) |
| :logos-kava: `Kava` | [0x37c5ab57AF7100Bdc9B668d766e193CCbF6614FD](https://kavascan.com/address/0x37c5ab57AF7100Bdc9B668d766e193CCbF6614FD) |
| :logos-zksync: `zk-Sync` | [0x253548e98C769aD2850da8DB3E4c2b2cE46E3839](https://era.zksync.network/address/0x253548e98C769aD2850da8DB3E4c2b2cE46E3839) |
| :logos-hyperliquid: `Hyperliquid`  | [0x5a8C93EE12a8Df4455BA111647AdA41f29D5CfcC](https://www.hyperscan.com/address/0x5a8C93EE12a8Df4455BA111647AdA41f29D5CfcC) |

---

**MetaZap-NG**

Source code for the `MetaZapNG` contracts is available on [:material-github: GitHub](https://github.com/curvefi/stableswap-ng/blob/main/contracts/main/MetaZapNG.vy).

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
| :logos-avalanche: `Avalanche` | [0xA54f3c1DFa5f7DbF2564829d14b3B74a65d26Ae2](https://snowscan.xyz/address/0xA54f3c1DFa5f7DbF2564829d14b3B74a65d26Ae2) |
| :logos-fantom: `Fantom` | [0x21688e843a99B0a47E750e7dDD2b5dAFd9269d30](https://ftmscout.com/address/0x21688e843a99B0a47E750e7dDD2b5dAFd9269d30) |
| :logos-bsc: `Binance Smart Chain` | [0x07920e98a66e462c2aa4c8fa6200bc68ca161ea0](https://bscscan.com/address/0x07920e98a66e462c2aa4c8fa6200bc68ca161ea0) |
|:logos-linea: `Linea` | [0xf2eff2Cd0d9C82b7b2f17FbBed703fA7931dB1da](https://lineascan.build/address/0xf2eff2Cd0d9C82b7b2f17FbBed703fA7931dB1da) |
| :logos-scroll: `Scroll`| [0xb47988aD49DCE8D909c6f9Cf7B26caF04e1445c8](https://scroll.l2scan.co/address/0xb47988aD49DCE8D909c6f9Cf7B26caF04e1445c8) |
| :logos-mantle: `Mantle` | [0xe548590f9fAe7a23EA6501b144B0D58b74Fc4B53](https://mantlescan.xyz/address/0xe548590f9fAe7a23EA6501b144B0D58b74Fc4B53) |
| :logos-celo: `Celo`| [0x3f445D38E820c010a7A6E33c5F80cBEBE6930f61](https://celoscan.io/address/0x3f445D38E820c010a7A6E33c5F80cBEBE6930f61) |
| :logos-kava: `Kava` | [0xf2eff2Cd0d9C82b7b2f17FbBed703fA7931dB1da](https://kavascan.com/address/0xf2eff2Cd0d9C82b7b2f17FbBed703fA7931dB1da) |
| :logos-aurora: `Aurora`| [0x9293f068912bae932843a1bA01806c54f416019D](https://explorer.aurora.dev/address/0x9293f068912bae932843a1bA01806c54f416019D) |
| :logos-xlayer: `X-Layer`| [0x604388bb1159afd21eb5191ce22b4decdee2ae22](https://www.okx.com/web3/explorer/xlayer/address/0x604388bb1159afd21eb5191ce22b4decdee2ae22) |
| :logos-zksync: `zk-Sync` | [0x4232Dcc6D31543A2431079BdE2082C69eA3A771E](https://era.zksync.network/address/0x4232Dcc6D31543A2431079BdE2082C69eA3A771E) |
| :logos-hyperliquid: `Hyperliquid`  | [0xFAbC421e3368D158d802684A217a83c083c94CeB](https://www.hyperscan.com/address/0xFAbC421e3368D158d802684A217a83c083c94CeB) |

---

## crvUSD

The full documentation for the `crvUSD` contracts can be found [here](../crvUSD/overview.md). Source code for the `crvUSD` contracts is available on [:material-github: GitHub](https://github.com/curvefi/curve-stablecoin).

### Core Contracts

| Contract Type                | Contract Address |
| :--------------------------: | ---------------- |
|  `crvUSD Token (ETH)`        | [0xf939E0A03FB07F59A73314E73794Be0E57ac1b4E](https://etherscan.io/address/0xf939E0A03FB07F59A73314E73794Be0E57ac1b4E) |
| `Controller Factory`         | [0xC9332fdCB1C491Dcc683bAe86Fe3cb70360738BC](https://etherscan.io/address/0xC9332fdCB1C491Dcc683bAe86Fe3cb70360738BC) |
| `Controller Implementation`  | [0x17C6e1DdF1ccE3D33240A53FcE8a2ee48541F4D4](https://etherscan.io/address/0x17C6e1DdF1ccE3D33240A53FcE8a2ee48541F4D4) |
| `AMM Implementation`         | [0x0ec8e0c868541df59ceD49B39CC930C3a8DbD93a](https://etherscan.io/address/0x0ec8e0c868541df59ceD49B39CC930C3a8DbD93a) |
| `PriceAggregator`            | [0xe5Afcf332a5457E8FafCD668BcE3dF953762Dfe7](https://etherscan.io/address/0xe5Afcf332a5457E8FafCD668BcE3dF953762Dfe7) |
| `PriceAggregatorV3`          | [0x18672b1b0c623a30089A280Ed9256379fb0E4E62](https://etherscan.io/address/0x18672b1b0c623a30089A280Ed9256379fb0E4E62) |
| `PriceAggregator (Arbitrum)` | [0x44a4FdFb626Ce98e36396d491833606309520330](https://arbiscan.io/address/0x44a4FdFb626Ce98e36396d491833606309520330)  |
| `FlashLender`                | [0xa7a4bb50af91f90b6feb3388e7f8286af45b299b](https://etherscan.io/address/0xa7a4bb50af91f90b6feb3388e7f8286af45b299b) |

---

### Token Addresses

| Chain                       | crvUSD Token Address |
| --------------------------- | :------------------: |
| :logos-ethereum: `Ethereum` | [0xf939E0A03FB07F59A73314E73794Be0E57ac1b4E](https://etherscan.io/token/0xf939E0A03FB07F59A73314E73794Be0E57ac1b4E) |
| :logos-arbitrum: `Arbitrum` | [0x498Bf2B1e120FeD3ad3D42EA2165E9b73f99C1e5](https://arbiscan.io/address/0x498Bf2B1e120FeD3ad3D42EA2165E9b73f99C1e5) |
| :logos-optimism: `Optimism` | [0xc52d7f23a2e460248db6ee192cb23dd12bddcbf6](https://optimistic.etherscan.io/address/0xc52d7f23a2e460248db6ee192cb23dd12bddcbf6) |
| :logos-base: `Base`         | [0x417Ac0e078398C154EdFadD9Ef675d30Be60Af93](https://basescan.org/address/0x417Ac0e078398C154EdFadD9Ef675d30Be60Af93) |
| :logos-gnosis: `Gnosis`     | [0xaBEf652195F98A91E490f047A5006B71c85f058d](https://gnosisscan.io/address/0xaBEf652195F98A91E490f047A5006B71c85f058d) |
| :logos-polygon: `Polygon`   | [0xc4Ce1D6F5D98D65eE25Cf85e9F2E9DcFEe6Cb5d6](https://polygonscan.com/address/0xc4Ce1D6F5D98D65eE25Cf85e9F2E9DcFEe6Cb5d6) |
| :logos-xlayer: `X-Layer`    | [0xda8f4eb4503acf5dec5420523637bb5b33a846f6](https://www.oklink.com/xlayer/address/0xda8f4eb4503acf5dec5420523637bb5b33a846f6) |
| :logos-fraxtal: `Fraxtal`   | [0xB102f7Efa0d5dE071A8D37B3548e1C7CB148Caf3](https://fraxscan.com/address/0xB102f7Efa0d5dE071A8D37B3548e1C7CB148Caf3) |
| :logos-bsc: `BinanceSmartChain` | [0xe2fb3F127f5450DeE44afe054385d74C392BdeF4](https://bscscan.com/address/0xe2fb3F127f5450DeE44afe054385d74C392BdeF4) |
| :logos-mantle: `Mantle`     | [0x0994206dfe8de6ec6920ff4d779b0d950605fb53](https://mantlescan.xyz/address/0x0994206dfe8de6ec6920ff4d779b0d950605fb53) |
| :logos-zksync: `zk-Sync`    | [0x43cd37cc4b9ec54833c8ac362dd55e58bfd62b86](https://era.zksync.network/address/0x43cd37cc4b9ec54833c8ac362dd55e58bfd62b86) |

---

### PegKeepers

| Contract Type        | Contract Address |
| :------------------: | ---------------- |
| `PegKeeperV1 (USDC)` | [0xaA346781dDD7009caa644A4980f044C50cD2ae22](https://etherscan.io/address/0xaA346781dDD7009caa644A4980f044C50cD2ae22) |
| `PegKeeperV1 (USDT)` | [0xE7cd2b4EB1d98CD6a4A48B6071D46401Ac7DC5C8](https://etherscan.io/address/0xE7cd2b4EB1d98CD6a4A48B6071D46401Ac7DC5C8) |
| `PegKeeperV1 (USDP)` | [0x6B765d07cf966c745B340AdCa67749fE75B5c345](https://etherscan.io/address/0x6B765d07cf966c745B340AdCa67749fE75B5c345) |
| `PegKeeperV1 (TUSD)` | [0x1ef89Ed0eDd93D1EC09E4c07373f69C49f4dcCae](https://etherscan.io/address/0x1ef89Ed0eDd93D1EC09E4c07373f69C49f4dcCae) |
| -------------------- | ---------------- |
| `PegKeeperRegulator` | [0x36a04CAffc681fa179558B2Aaba30395CDdd855f](https://etherscan.io/address/0x36a04CAffc681fa179558B2Aaba30395CDdd855f) |
| `PegKeeperV2 (USDC)` | [0x9201da0D97CaAAff53f01B2fB56767C7072dE340](https://etherscan.io/address/0x9201da0D97CaAAff53f01B2fB56767C7072dE340) |
| `PegKeeperV2 (USDT)` | [0xFb726F57d251aB5C731E5C64eD4F5F94351eF9F3](https://etherscan.io/address/0xFb726F57d251aB5C731E5C64eD4F5F94351eF9F3) |
| `PegKeeperV2 (pyUSD)`| [0x3fA20eAa107DE08B38a8734063D605d5842fe09C](https://etherscan.io/address/0x3fA20eAa107DE08B38a8734063D605d5842fe09C) |
| `PegKeeperV2 (TUSD)` | [0x0a05FF644878B908eF8EB29542aa88C07D9797D3](https://etherscan.io/address/0x0a05FF644878B908eF8EB29542aa88C07D9797D3) |
| `PegKeeperV2 (USDM)` | [0x503E1Bf274e7a6c64152395aE8eB57ec391F91F8](https://etherscan.io/address/0x503E1Bf274e7a6c64152395aE8eB57ec391F91F8) |

---

## Lending

The full documentation for the lending contracts can be found [here](../lending/overview.md). Source code for the contracts is available on [:material-github: GitHub](https://github.com/curvefi/curve-stablecoin/tree/lending).

!!!warning "Implementation contracts are upgradable"
    **Implementation contracts are upgradable.** They can be either replaced or additional implementation contracts can be set. Therefore, please **always make sure to check the most recent ones**.

As the creation of lending markets is permissionless, listing all deployed vaults and their corresponding contracts would exceed the scope of this section. The Factory contract has a [`market_count`](../lending/contracts/oneway-factory.md#market_count) variable which represents the total number of markets created, as well as a [`vaults(arg0: uint256)`](../lending/contracts/oneway-factory.md#vaults) which returns the vault address at a specific index.

*For more information, please refer to the [Factory documentation](../lending/contracts/oneway-factory.md).*

AMM, Controller, and Price Oracle contracts and other variables of a vault can simply be queried:

```shell
>>> Vault.amm()
'0xafca625321Df8D6A068bDD8F1585d489D2acF11b'

>>> Vault.controller()
'0xEdA215b7666936DEd834f76f3fBC6F323295110A'

>>> Vault.price_oracle()
'0xE0a4C53408f5ACf3246c83b9b8bD8d36D5ee38B8'
```

**:logos-ethereum: Ethereum**

| Contract Type                      | Contract Address |
| :--------------------------------: | ---------------- |
| `OneWay Lending Factory`           | [0xeA6876DDE9e3467564acBeE1Ed5bac88783205E0](https://etherscan.io/address/0xeA6876DDE9e3467564acBeE1Ed5bac88783205E0) |
| `AMM implementation`               | [0xB57A959cdB3D5e460f9a7Cc48ed05ec29dfF049a](https://etherscan.io/address/0xB57A959cdB3D5e460f9a7Cc48ed05ec29dfF049a) |
| `Controller implementation`        | [0x584B0Fd8F038fe8AEDf4057Ca3cB3D840446fBbf](https://etherscan.io/address/0x584B0Fd8F038fe8AEDf4057Ca3cB3D840446fBbf) |
| `Vault implementation`             | [0xc014F34D5Ba10B6799d76b0F5ACdEEe577805085](https://etherscan.io/address/0xc014F34D5Ba10B6799d76b0F5ACdEEe577805085) |
| `Pool price oracle implementation` | [0xC455e6c7936C2382f04306D329ABc5d36444D3F8](https://etherscan.io/address/0xC455e6c7936C2382f04306D329ABc5d36444D3F8) |
| `Monetary Policy Implementation`   | [0x4863c6dF17dD59311B7f67E694DD835ADC87f2d3](https://etherscan.io/address/0x4863c6dF17dD59311B7f67E694DD835ADC87f2d3) |
| `Gauge Implementation`             | [0x79D584d2D49eC8CE8Ea379d69364b700bd35874D](https://etherscan.io/address/0x79D584d2D49eC8CE8Ea379d69364b700bd35874D) |

**:logos-arbitrum: Arbitrum**

| Contract Type                      | Contract Address |
| :--------------------------------: | ---------------- |
| `OneWay Lending Factory`           | [0xcaEC110C784c9DF37240a8Ce096D352A75922DeA](https://arbiscan.io/address/0xcaEC110C784c9DF37240a8Ce096D352A75922DeA) |
| `AMM implementation`               | [0xaA2377F39419F8f4CB98885076c41fE547C65a6A](https://arbiscan.io/address/0xaA2377F39419F8f4CB98885076c41fE547C65a6A) |
| `Controller implementation`        | [0x2287b7b2bF3d82c3ecC11ca176F4B4F35f920775](https://arbiscan.io/address/0x2287b7b2bF3d82c3ecC11ca176F4B4F35f920775) |
| `Vault implementation`             | [0x104e15102E4Cf33e0e2cB7C304D406B523B04d7a](https://arbiscan.io/address/0x104e15102E4Cf33e0e2cB7C304D406B523B04d7a) |
| `Pool price oracle implementation` | [0x57390a776A2312eF8BFc25e8624483303Dd8DfF8](https://arbiscan.io/address/0x57390a776A2312eF8BFc25e8624483303Dd8DfF8) |
| `Monetary Policy Implementation`   | [0x0b3536245faDABCF091778C4289caEbDc2c8f5C1](https://arbiscan.io/address/0x0b3536245faDABCF091778C4289caEbDc2c8f5C1) |

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

---

## scrvUSD

The main infrastructure for `scrvUSD` is deployed on :logos-ethereum: `Ethereum`.

| Contract Type           | Contract Address |
| :---------------------: | ---------------- |
| `scrvUSD / Vault`       | [0x0655977FEb2f289A4aB78af67BAB0d17aAb84367](https://etherscan.io/address/0x0655977FEb2f289A4aB78af67BAB0d17aAb84367) |
| `RewardsHandler`        | [0xe8d1e2531761406af1615a6764b0d5ff52736f56](https://etherscan.io/address/0xe8d1e2531761406af1615a6764b0d5ff52736f56) |
| `StablecoinLens`        | [0xe24e2db9f6bb40bbe7c1c025bc87104f5401ecd7](https://etherscan.io/address/0xe24e2db9f6bb40bbe7c1c025bc87104f5401ecd7) |

*Additionally, the `scrvUSD` was bridged to the following chains:*

| Chain | crvUSD Token Address |
| ----- | -------------------- |
| :logos-arbitrum: `Arbitrum` | [0xEfB6601Df148677A338720156E2eFd3c5Ba8809d](https://arbiscan.io/address/0xEfB6601Df148677A338720156E2eFd3c5Ba8809d) |
| :logos-optimism: `Optimism` | [0x289f635106d5b822a505b39ac237a0ae9189335b](https://optimistic.etherscan.io/address/0x289f635106d5b822a505b39ac237a0ae9189335b) |
| :logos-base: `Base` | [0x646a737b9b6024e49f5908762b3ff73e65b5160c](https://basescan.org/address/0x646a737b9b6024e49f5908762b3ff73e65b5160c) |
| :logos-fraxtal: `Fraxtal` | [0xaB94C721040b33aA8b0b4D159Da9878e2a836Ed0](https://fraxscan.com/address/0xaB94C721040b33aA8b0b4D159Da9878e2a836Ed0) |
| :logos-avalanche: `Avalanche` | [0xA3ea433509F7941df3e33857D9c9f212Ad4A4e64](https://snowscan.xyz/address/0xA3ea433509F7941df3e33857D9c9f212Ad4A4e64) |
| :logos-bsc: `BinanceSmartChain` | [0xAE0666C978500f2C05784242B79B08C478Dd999c](https://bscscan.com/address/0x0094Ad026643994c8fB2136ec912D508B15fe0E5) |
| :logos-fantom: `Fantom` | [0x5191946500e75f0A74476F146dF7d386e52961d9](https://ftmscout.com/address/0x5191946500e75f0A74476F146dF7d386e52961d9) |
