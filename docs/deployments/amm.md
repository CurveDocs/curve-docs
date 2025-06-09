---
search:
  exclude: true
---

<h1>Automated Market Maker (AMM)</h1>


# **Stableswap-NG**

!!!github "GitHub"
    Source code for the `Stableswap-NG` contracts is available on [GitHub](https://github.com/curvefi/stableswap-ng).

!!!warning "Implementations"
    Every Factory contract has plain- and metapool implementations. The Factory on Ethereum has an additional gauge implementation. **Implementation contracts are upgradable.** They can be either replaced or additional implementation contracts can be set. Therefore, please **always make sure to check the most recent ones**.

    *To query the factory-specific implementations:*

    ```shell
    >>> Factory.pool_implementation(0)
    "0xDCc91f930b42619377C200BA05b7513f2958b202"

    >>> Factory.metapool_implementation(0)
    "0xede71F77d7c900dCA5892720E76316C6E575F0F7"

    >>> Factory.gauge_implementation() # ethereum mainnet only!
    "0x38D9BdA812da2C68dFC6aDE85A7F7a54E77F8325"
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
| `Views`     | [0x3BbA971980A721C7A33cEF62cE01c0d744F26e95](https://arbiscan.io/address/0x3BbA971980A721C7A33cEF62cE01c0d744F26e95) |
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
| `Math`      | [0x29Fc22c7fEC8748a85852E2D36728D9194DDb854](https://era.zksync.network/address/0x29Fc22c7fEC8748a85852E2D36728D9194DDb854) |
| `Views`     | [0x59557D68d46e8367Fb357F2E848D8506cBf371c9](https://era.zksync.network/address/0x59557D68d46e8367Fb357F2E848D8506cBf371c9) |
| `Factory`   | [0xFcAb5d04e8e031334D5e8D2C166B08daB0BE6CaE](https://era.zksync.network/address/0xFcAb5d04e8e031334D5e8D2C166B08daB0BE6CaE) |
| `Plain AMM` | [0x04D0095a1A4Ae881a078ae61F36945E85464e6d7](https://era.zksync.network/address/0x04D0095a1A4Ae881a078ae61F36945E85464e6d7) |
| `Meta AMM`  | [0xC5d5402481aefec461Ab86b1051AC26dF05BeE3B](https://era.zksync.network/address/0xC5d5402481aefec461Ab86b1051AC26dF05BeE3B) |


**:logos-sonic: Sonic**

| Contract Type | Contract Address |
| :---------: | :----------------: |
| `Math`      | [0xd2002373543Ce3527023C75e7518C274A51ce712](https://sonicscan.org/address/0xd2002373543Ce3527023C75e7518C274A51ce712) |
| `Views`     | [0x686bdb3D24Bc6F3ED89ed3d3B659765c54aC78B4](https://sonicscan.org/address/0x686bdb3D24Bc6F3ED89ed3d3B659765c54aC78B4) |
| `Factory`   | [0x7C2085419BE6a04f4ad88ea91bC9F5C6E6C463D8](https://sonicscan.org/address/0x7C2085419BE6a04f4ad88ea91bC9F5C6E6C463D8) |
| `Plain AMM` | [0xe61Fb97Ef6eBFBa12B36Ffd7be785c1F5A2DE66b](https://sonicscan.org/address/0xe61Fb97Ef6eBFBa12B36Ffd7be785c1F5A2DE66b) |
| `Meta AMM`  | [0xa7Ba18EeFcD9513230987eC2faB6711AF5AbD9c2](https://sonicscan.org/address/0xa7Ba18EeFcD9513230987eC2faB6711AF5AbD9c2) |


**:logos-taiko: Taiko**

| Contract Type | Contract Address |
| :---------: | :----------------: |
| `Math`      | [0x686bdb3D24Bc6F3ED89ed3d3B659765c54aC78B4](https://taikoscan.io/address/0x686bdb3D24Bc6F3ED89ed3d3B659765c54aC78B4) |
| `Views`     | [0xe61Fb97Ef6eBFBa12B36Ffd7be785c1F5A2DE66b](https://taikoscan.io/address/0xe61Fb97Ef6eBFBa12B36Ffd7be785c1F5A2DE66b) |
| `Factory`   | [0x06452f9c013fc37169B57Eab8F50A7A48c9198A3](https://taikoscan.io/address/0x06452f9c013fc37169B57Eab8F50A7A48c9198A3) |
| `Plain AMM` | [0xa7Ba18EeFcD9513230987eC2faB6711AF5AbD9c2](https://taikoscan.io/address/0xa7Ba18EeFcD9513230987eC2faB6711AF5AbD9c2) |
| `Meta AMM`  | [0x604388Bb1159AFd21eB5191cE22b4DeCdEE2Ae22](https://taikoscan.io/address/0x604388Bb1159AFd21eB5191cE22b4DeCdEE2Ae22) |


**:logos-corn: Corn**

| Contract Type | Contract Address |
| :---------: | :----------------: |
| `Math`      | [0xa7Ba18EeFcD9513230987eC2faB6711AF5AbD9c2](https://cornscan.io/address/0xa7Ba18EeFcD9513230987eC2faB6711AF5AbD9c2) |
| `Views`     | [0x7C2085419BE6a04f4ad88ea91bC9F5C6E6C463D8](https://cornscan.io/address/0x7C2085419BE6a04f4ad88ea91bC9F5C6E6C463D8) |
| `Factory`   | [0xd7E72f3615aa65b92A4DBdC211E296a35512988B](https://cornscan.io/address/0xd7E72f3615aa65b92A4DBdC211E296a35512988B) |
| `Plain AMM` | [0x604388Bb1159AFd21eB5191cE22b4DeCdEE2Ae22](https://cornscan.io/address/0x604388Bb1159AFd21eB5191cE22b4DeCdEE2Ae22) |
| `Meta AMM`  | [0x06452f9c013fc37169B57Eab8F50A7A48c9198A3](https://cornscan.io/address/0x06452f9c013fc37169B57Eab8F50A7A48c9198A3) |


**:logos-ink: Ink**

| Contract Type | Contract Address |
| :---------: | :----------------: |
| `Math`      | [0xbC0797015fcFc47d9C1856639CaE50D0e69FbEE8](https://explorer.inkonchain.com/address/0xbC0797015fcFc47d9C1856639CaE50D0e69FbEE8) |
| `Views`     | [0xe265FC390E9129b7E337Da23cD42E00C34Da2CE3](https://explorer.inkonchain.com/address/0xe265FC390E9129b7E337Da23cD42E00C34Da2CE3) |
| `Factory`   | [0x046207cB759F527b6c10C2D61DBaca45513685CC](https://explorer.inkonchain.com/address/0x046207cB759F527b6c10C2D61DBaca45513685CC) |
| `Plain AMM` | [0xa7b9d886A9a374A1C86DC52d2BA585c5CDFdac26](https://explorer.inkonchain.com/address/0xa7b9d886A9a374A1C86DC52d2BA585c5CDFdac26) |
| `Meta AMM`  | [0x5702BDB1Ec244704E3cBBaAE11a0275aE5b07499](https://explorer.inkonchain.com/address/0x5702BDB1Ec244704E3cBBaAE11a0275aE5b07499) |


**:logos-hyperliquid: Hyperliquid**

| Contract Type  | Contract Address |
| :---------: | :----------------: |
| `Math`      | [0x686bdb3D24Bc6F3ED89ed3d3B659765c54aC78B4](https://www.hyperscan.com/address/0x686bdb3D24Bc6F3ED89ed3d3B659765c54aC78B4) |
| `Views`     | [0xe61Fb97Ef6eBFBa12B36Ffd7be785c1F5A2DE66b](https://www.hyperscan.com/address/0xe61Fb97Ef6eBFBa12B36Ffd7be785c1F5A2DE66b) |
| `Factory`   | [0x604388Bb1159AFd21eB5191cE22b4DeCdEE2Ae22](https://www.hyperscan.com/address/0x604388Bb1159AFd21eB5191cE22b4DeCdEE2Ae22) |
| `Plain AMM` | [0xa7Ba18EeFcD9513230987eC2faB6711AF5AbD9c2](https://www.hyperscan.com/address/0xa7Ba18EeFcD9513230987eC2faB6711AF5AbD9c2) |
| `Meta AMM`  | [0x7C2085419BE6a04f4ad88ea91bC9F5C6E6C463D8](https://www.hyperscan.com/address/0x7C2085419BE6a04f4ad88ea91bC9F5C6E6C463D8) |


**:logos-xdc: XDC**

| Contract Type  | Contract Address |
| :---------: | :----------------: |
| `Math`      | [0xDF264E9a02E0D1C1F0b83AE067dE2Bc0031e1e7a](https://xdcscan.com/address/0xDF264E9a02E0D1C1F0b83AE067dE2Bc0031e1e7a) |
| `Views`     | [0x9bBc929C45F2C06ccb4acd2C6D9FFE577d505Dfc](https://xdcscan.com/address/0x9bBc929C45F2C06ccb4acd2C6D9FFE577d505Dfc) |
| `Factory`   | [0x5aEa9aaDd0974e8914229a23699bB6b343c97B09](https://xdcscan.com/address/0x5aEa9aaDd0974e8914229a23699bB6b343c97B09) |
| `Plain AMM` | [0xA626B239e30dF83a228e5D87daB005819267d1BA](https://xdcscan.com/address/0xA626B239e30dF83a228e5D87daB005819267d1BA) |
| `Meta AMM`  | [0x73E5a7225E22682b8Abd5aaE322Ea4ab140Ec652](https://xdcscan.com/address/0x73E5a7225E22682b8Abd5aaE322Ea4ab140Ec652) |


**:logos-plume: Plume**

| Contract Type  | Contract Address |
| :---------: | :----------------: |
| `Math`      | [0xDF264E9a02E0D1C1F0b83AE067dE2Bc0031e1e7a](https://explorer.plume.org/address/0xDF264E9a02E0D1C1F0b83AE067dE2Bc0031e1e7a) |
| `Views`     | [0x9bBc929C45F2C06ccb4acd2C6D9FFE577d505Dfc](https://explorer.plume.org/address/0x9bBc929C45F2C06ccb4acd2C6D9FFE577d505Dfc) |
| `Factory`   | [0x5aEa9aaDd0974e8914229a23699bB6b343c97B09](https://explorer.plume.org/address/0x5aEa9aaDd0974e8914229a23699bB6b343c97B09) |
| `Plain AMM` | [0xA626B239e30dF83a228e5D87daB005819267d1BA](https://explorer.plume.org/address/0xA626B239e30dF83a228e5D87daB005819267d1BA) |
| `Meta AMM`  | [0x73E5a7225E22682b8Abd5aaE322Ea4ab140Ec652](https://explorer.plume.org/address/0x73E5a7225E22682b8Abd5aaE322Ea4ab140Ec652) |


---


# **Twocrypto-NG**

!!!github "GitHub"
    Source code for the `Twocrypto-NG` contracts is available on [GitHub](https://github.com/curvefi/twocrypto-ng).


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
| `Math`      | [0x75D022039Ee9e386Ed66186950a1C57c4C33c584](https://era.zksync.network/address/0x75D022039Ee9e386Ed66186950a1C57c4C33c584) |
| `Views`     | [0x029A5c01D753eA0291157FCBA163DEB644c76a55](https://era.zksync.network/address/0x029A5c01D753eA0291157FCBA163DEB644c76a55) |
| `Factory`   | [0xf3a546AF64aFd6BB8292746BA66DB33aFAE72114](https://era.zksync.network/address/0xf3a546AF64aFd6BB8292746BA66DB33aFAE72114) |
| `AMM`       | [0x0d74e4315AC9Ea0CE299CF1238481e9311574e48](https://era.zksync.network/address/0x0d74e4315AC9Ea0CE299CF1238481e9311574e48) |


**:logos-sonic: Sonic**

| Contract Type | Contract Address |
| :---------: | :----------------: |
| `Math`      | [0x0C9D8c7e486e822C29488Ff51BFf0167B4650953](https://sonicscan.org/address/0x0C9D8c7e486e822C29488Ff51BFf0167B4650953) |
| `Views`     | [0x64379C265Fc6595065D7d835AAaa731c0584dB80](https://sonicscan.org/address/0x64379C265Fc6595065D7d835AAaa731c0584dB80) |
| `Factory`   | [0x1A83348F9cCFD3Fe1A8C0adBa580Ac4e267Fe495](https://sonicscan.org/address/0x1A83348F9cCFD3Fe1A8C0adBa580Ac4e267Fe495) |
| `AMM`       | [0xd3B17f862956464ae4403cCF829CE69199856e1e](https://sonicscan.org/address/0xd3B17f862956464ae4403cCF829CE69199856e1e) |



**:logos-taiko: Taiko**

| Contract Type | Contract Address |
| :---------: | :----------------: |
| `Math`      | [0x166c4084Ad2434E8F2425C64dabFE6875A0D45c5](https://taikoscan.io/address/0x166c4084Ad2434E8F2425C64dabFE6875A0D45c5) |
| `Views`     | [0x5Ea9DD3b6f042A34Df818C6c1324BC5A7c61427a](https://taikoscan.io/address/0x5Ea9DD3b6f042A34Df818C6c1324BC5A7c61427a) |
| `Factory`   | [0xFAbC421e3368D158d802684A217a83c083c94CeB](https://taikoscan.io/address/0xFAbC421e3368D158d802684A217a83c083c94CeB) |
| `AMM`       | [0x5a8C93EE12a8Df4455BA111647AdA41f29D5CfcC](https://taikoscan.io/address/0x5a8C93EE12a8Df4455BA111647AdA41f29D5CfcC) |


**:logos-corn: Corn**

| Contract Type | Contract Address |
| :---------: | :----------------: |
| `Math`      | [0x1A83348F9cCFD3Fe1A8C0adBa580Ac4e267Fe495](https://cornscan.io/address/0x1A83348F9cCFD3Fe1A8C0adBa580Ac4e267Fe495) |
| `Views`     | [0xc9Fe0C63Af9A39402e8a5514f9c43Af0322b665F](https://cornscan.io/address/0xc9Fe0C63Af9A39402e8a5514f9c43Af0322b665F) |
| `Factory`   | [0x5Ea9DD3b6f042A34Df818C6c1324BC5A7c61427a](https://cornscan.io/address/0x5Ea9DD3b6f042A34Df818C6c1324BC5A7c61427a) |
| `AMM` | [0x166c4084Ad2434E8F2425C64dabFE6875A0D45c5](https://cornscan.io/address/0x166c4084Ad2434E8F2425C64dabFE6875A0D45c5) |


**:logos-ink: Ink**

| Contract Type | Contract Address |
| :---------: | :----------------: |
| `Math`      | [0x0c59d36b23f809f8b6C7cb4c8C590a0AC103baEf](https://explorer.inkonchain.com/address/0x0c59d36b23f809f8b6C7cb4c8C590a0AC103baEf) |
| `Views`     | [0x3d6cB2F6DcF47CDd9C13E4e3beAe9af041d8796a](https://explorer.inkonchain.com/address/0x3d6cB2F6DcF47CDd9C13E4e3beAe9af041d8796a) |
| `Factory`   | [0xd125E7a0cEddF89c6473412d85835450897be6Dc](https://explorer.inkonchain.com/address/0xd125E7a0cEddF89c6473412d85835450897be6Dc) |
| `AMM` | [0x76303e4fDcA0AbF28aB3ee42Ce086E6503431F1D](https://explorer.inkonchain.com/address/0x76303e4fDcA0AbF28aB3ee42Ce086E6503431F1D) |


**:logos-hyperliquid: Hyperliquid**

| Contract Type | Contract Address |
| :---------: | :----------------: |
| `Math`      | [0x64379C265Fc6595065D7d835AAaa731c0584dB80](https://www.hyperscan.com/address/0x64379C265Fc6595065D7d835AAaa731c0584dB80) |
| `Views`     | [0xd3B17f862956464ae4403cCF829CE69199856e1e](https://www.hyperscan.com/address/0xd3B17f862956464ae4403cCF829CE69199856e1e) |
| `Factory`   | [0xc9Fe0C63Af9A39402e8a5514f9c43Af0322b665F](https://www.hyperscan.com/address/0xc9Fe0C63Af9A39402e8a5514f9c43Af0322b665F) |
| `AMM`       | [0x1A83348F9cCFD3Fe1A8C0adBa580Ac4e267Fe495](https://www.hyperscan.com/address/0x1A83348F9cCFD3Fe1A8C0adBa580Ac4e267Fe495) |


**:logos-xdc: XDC**

| Contract Type  | Contract Address |
| :---------: | :----------------: |
| `Math`      | [0xE8acB9bDd10E9685361a2D540e60378d26b0223f](https://xdcscan.com/address/0xE8acB9bDd10E9685361a2D540e60378d26b0223f) |
| `Views`     | [0xC1a0003b9bFB0C958DA455d12417df0bA79bBA78](https://xdcscan.com/address/0xC1a0003b9bFB0C958DA455d12417df0bA79bBA78) |
| `Factory`   | [0xa17b39BF1c2FE776Af38a999bE7Bb7bEa737a6EC](https://xdcscan.com/address/0xa17b39BF1c2FE776Af38a999bE7Bb7bEa737a6EC) |
| `AMM` | [0x2320f304651F825353124890e4BE17e826BE5841](https://xdcscan.com/address/0x2320f304651F825353124890e4BE17e826BE5841) |


**:logos-plume: Plume**

| Contract Type  | Contract Address |
| :---------: | :----------------: |
| `Math`      | [0xE8acB9bDd10E9685361a2D540e60378d26b0223f](https://explorer.plume.org/address/0xE8acB9bDd10E9685361a2D540e60378d26b0223f) |
| `Views`     | [0xC1a0003b9bFB0C958DA455d12417df0bA79bBA78](https://explorer.plume.org/address/0xC1a0003b9bFB0C958DA455d12417df0bA79bBA78) |
| `Factory`   | [0xa17b39BF1c2FE776Af38a999bE7Bb7bEa737a6EC](https://explorer.plume.org/address/0xa17b39BF1c2FE776Af38a999bE7Bb7bEa737a6EC) |
| `AMM` | [0x2320f304651F825353124890e4BE17e826BE5841](https://explorer.plume.org/address/0x2320f304651F825353124890e4BE17e826BE5841) |


---


# **Tricrypto-NG**

!!!github "GitHub"
    Source code for the `Tricrypto-NG` contracts is available on [GitHub](https://github.com/curvefi/tricrypto-ng).

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
| `Math`      | [0x493c70dd5c6A8F6D21e7742D51E3b70A3026C035](https://era.zksync.network/address/0x493c70dd5c6A8F6D21e7742D51E3b70A3026C035) |
| `Views`     | [0x9752B6a3c30502e90918534B2417Ca08123880D6](https://era.zksync.network/address/0x9752B6a3c30502e90918534B2417Ca08123880D6) |
| `Factory`   | [0x5d4174C40f1246dABe49693845442927d5929f0D](https://era.zksync.network/address/0x5d4174C40f1246dABe49693845442927d5929f0D) |
| `AMM native disable` | [0x1BD7d40CF9bBb63537746C89992f421bC35C6716](https://era.zksync.network/address/0x1BD7d40CF9bBb63537746C89992f421bC35C6716) |
| `AMM native enabled` | [0x18d01726FeDaBd91579A9368DFB2F8A24f905280](https://era.zksync.network/address/0x18d01726FeDaBd91579A9368DFB2F8A24f905280) |


**:logos-sonic: Sonic**

| Contract Type | Contract Address |
| :---------: | :----------------: |
| `Math`      | [0xe265FC390E9129b7E337Da23cD42E00C34Da2CE3](https://sonicscan.org/address/0xe265FC390E9129b7E337Da23cD42E00C34Da2CE3) |
| `Views`     | [0xa7b9d886A9a374A1C86DC52d2BA585c5CDFdac26](https://sonicscan.org/address/0xa7b9d886A9a374A1C86DC52d2BA585c5CDFdac26) |
| `Factory`   | [0x635742dCC8313DCf8c904206037d962c042EAfBd](https://sonicscan.org/address/0x635742dCC8313DCf8c904206037d962c042EAfBd) |
| `AMM native disable` | [0xf3A6aa40cf048a3960E9664847E9a7be025a390a](https://sonicscan.org/address/0xf3A6aa40cf048a3960E9664847E9a7be025a390a) |


**:logos-taiko: Taiko**

| Contract Type | Contract Address |
| :---------: | :----------------: |
| `Math`      | [0x635742dCC8313DCf8c904206037d962c042EAfBd](https://taikoscan.io/address/0x635742dCC8313DCf8c904206037d962c042EAfBd) |
| `Views`     | [0x5702BDB1Ec244704E3cBBaAE11a0275aE5b07499](https://taikoscan.io/address/0x5702BDB1Ec244704E3cBBaAE11a0275aE5b07499) |
| `Factory`   | [0x0C9D8c7e486e822C29488Ff51BFf0167B4650953](https://taikoscan.io/address/0x0C9D8c7e486e822C29488Ff51BFf0167B4650953) |
| `AMM native disable` | [0x7Ca46A636b02D4aBC66883D7FF164bDE506DC66a](https://taikoscan.io/address/0x7Ca46A636b02D4aBC66883D7FF164bDE506DC66a) |


**:logos-corn: Corn**

| Contract Type | Contract Address |
| :---------: | :----------------: |
| `Math`      | [0x635742dCC8313DCf8c904206037d962c042EAfBd](https://cornscan.io/address/0x635742dCC8313DCf8c904206037d962c042EAfBd) |
| `Views`     | [0x5702BDB1Ec244704E3cBBaAE11a0275aE5b07499](https://cornscan.io/address/0x5702BDB1Ec244704E3cBBaAE11a0275aE5b07499) |
| `Factory`   | [0x7Ca46A636b02D4aBC66883D7FF164bDE506DC66a](https://cornscan.io/address/0x7Ca46A636b02D4aBC66883D7FF164bDE506DC66a) |
| `AMM native disable` | [0x046207cB759F527b6c10C2D61DBaca45513685CC](https://cornscan.io/address/0x046207cB759F527b6c10C2D61DBaca45513685CC) |


**:logos-ink: Ink**

| Contract Type | Contract Address |
| :---------: | :----------------: |
| `Math`      | [0x1A83348F9cCFD3Fe1A8C0adBa580Ac4e267Fe495](https://explorer.inkonchain.com/address/0x1A83348F9cCFD3Fe1A8C0adBa580Ac4e267Fe495) |
| `Views`     | [0xc9Fe0C63Af9A39402e8a5514f9c43Af0322b665F](https://explorer.inkonchain.com/address/0xc9Fe0C63Af9A39402e8a5514f9c43Af0322b665F) |
| `Factory`   | [0x5Ea9DD3b6f042A34Df818C6c1324BC5A7c61427a](https://explorer.inkonchain.com/address/0x5Ea9DD3b6f042A34Df818C6c1324BC5A7c61427a) |
| `AMM native disable` | [0x166c4084Ad2434E8F2425C64dabFE6875A0D45c5](https://explorer.inkonchain.com/address/0x166c4084Ad2434E8F2425C64dabFE6875A0D45c5) |


**:logos-hyperliquid: Hyperliquid**

| Contract Type | Contract Address |
| :---------: | :----------------: |
| `Math`      | [0xa7b9d886A9a374A1C86DC52d2BA585c5CDFdac26](https://www.hyperscan.com/address/0xa7b9d886A9a374A1C86DC52d2BA585c5CDFdac26) |
| `Views`     | [0xf3A6aa40cf048a3960E9664847E9a7be025a390a](https://www.hyperscan.com/address/0xf3A6aa40cf048a3960E9664847E9a7be025a390a) |
| `Factory`   | [0x5702BDB1Ec244704E3cBBaAE11a0275aE5b07499](https://www.hyperscan.com/address/0x5702BDB1Ec244704E3cBBaAE11a0275aE5b07499) |
| `AMM native disable`       | [0x635742dCC8313DCf8c904206037d962c042EAfBd](https://www.hyperscan.com/address/0x635742dCC8313DCf8c904206037d962c042EAfBd) |


**:logos-xdc: XDC**

| Contract Type  | Contract Address |
| :---------: | :----------------: |
| `Math`      | [0xab53d6899E9c347A5DedDcE3d97D4aeA36B0f8d7](https://xdcscan.com/address/0xab53d6899E9c347A5DedDcE3d97D4aeA36B0f8d7) |
| `Views`     | [0xF1f6e500d9Ccb9F3477cF078A5ea74F75fC3fc96](https://xdcscan.com/address/0xF1f6e500d9Ccb9F3477cF078A5ea74F75fC3fc96) |
| `Factory`   | [0x729c764aE95e7a9DEA9F950B5AEdbF1A9F3D7c03](https://xdcscan.com/address/0x729c764aE95e7a9DEA9F950B5AEdbF1A9F3D7c03) |
| `AMM native disable` | [0x016a5D98dC76Fb638F2942E94Fd12b323e792219](https://xdcscan.com/address/0x016a5D98dC76Fb638F2942E94Fd12b323e792219) |


**:logos-plume: Plume**

| Contract Type  | Contract Address |
| :---------: | :----------------: |
| `Math`      | [0xab53d6899E9c347A5DedDcE3d97D4aeA36B0f8d7](https://explorer.plume.org/address/0xab53d6899E9c347A5DedDcE3d97D4aeA36B0f8d7) |
| `Views`     | [0xF1f6e500d9Ccb9F3477cF078A5ea74F75fC3fc96](https://explorer.plume.org/address/0xF1f6e500d9Ccb9F3477cF078A5ea74F75fC3fc96) |
| `Factory`   | [0x729c764aE95e7a9DEA9F950B5AEdbF1A9F3D7c03](https://explorer.plume.org/address/0x729c764aE95e7a9DEA9F950B5AEdbF1A9F3D7c03) |
| `AMM native disable` | [0x016a5D98dC76Fb638F2942E94Fd12b323e792219](https://explorer.plume.org/address/0x016a5D98dC76Fb638F2942E94Fd12b323e792219) |
