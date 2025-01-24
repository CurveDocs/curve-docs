---
search:
  exclude: true
---

<h1></h1>


# **Router**

Routers that performs up to 5 swaps in a single transaction and can do estimations with `get_dy` and `get_dx`.

!!!github
    The source code for the router contracts can be found on [:material-github: GitHub](https://github.com/curvefi/curve-router-ng/tree/master/contracts).

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
| :logos-fantom: `Fantom`           | [0x0DCDED3545D565bA3B19E683431381007245d983](https://ftmscan.com/address/0x0DCDED3545D565bA3B19E683431381007245d983) |
| :logos-bsc: `Binance Smart Chain` | [0xA72C85C258A81761433B4e8da60505Fe3Dd551CC](https://bscscan.com/address/0xA72C85C258A81761433B4e8da60505Fe3Dd551CC) |
| :logos-mantle: `Mantle`           | [0x4f37A9d177470499A2dD084621020b023fcffc1F](https://mantlescan.xyz/address/0x4f37A9d177470499A2dD084621020b023fcffc1F) |
| :logos-kava: `Kava`               | [0x0DCDED3545D565bA3B19E683431381007245d983](https://kavascan.com/address/0x0DCDED3545D565bA3B19E683431381007245d983) |
| :logos-xlayer: `X-Layer`          | [0xBFab8ebc836E1c4D81837798FC076D219C9a1855](https://www.oklink.com/xlayer/address/0xBFab8ebc836E1c4D81837798FC076D219C9a1855) |
| :logos-zksync: `zk-Sync`          | [0x7C915390e109CA66934f1eB285854375D1B127FA](https://era.zksync.network/address/0x7C915390e109CA66934f1eB285854375D1B127FA) |
| :logos-sonic: `Sonic` | [0x5eeE3091f747E60a045a2E715a4c71e600e31F6E](https://sonicscan.org/address/0x5eeE3091f747E60a045a2E715a4c71e600e31F6E) |
| :logos-sonic: `Taiko` | [0xd2002373543Ce3527023C75e7518C274A51ce712](https://taikoscan.io/address/0xd2002373543Ce3527023C75e7518C274A51ce712) |
| :logos-sonic: `Corn` | [0xe61Fb97Ef6eBFBa12B36Ffd7be785c1F5A2DE66b](https://cornscan.io/address/0xe61Fb97Ef6eBFBa12B36Ffd7be785c1F5A2DE66b) |
| :logos-sonic: `Ink` | [0xd7E72f3615aa65b92A4DBdC211E296a35512988B](https://explorer.inkonchain.com/address/0xd7E72f3615aa65b92A4DBdC211E296a35512988B) |

---

# **StableCalcZap**

*Zap for stable pools to `calc_token_amount` taking fees into account and to `get_dx`.*

!!!github
    The source code for `StableCalcZaps.vy` can be found on [:material-github: GitHub](https://github.com/curvefi/curve-zaps/tree/master/contracts).

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
| :logos-mantle: `Mantle` | [0x0fE38dCC905eC14F6099a83Ac5C93BF2601300CF](https://mantlescan.xyz/address/0x0fe38dcc905ec14f6099a83ac5c93bf2601300cf#code) |
| :logos-celo: `Celo`| [0xCA8d0747B5573D69653C3aC22242e6341C36e4b4](https://celoscan.io/address/0xCA8d0747B5573D69653C3aC22242e6341C36e4b4#code) |
| :logos-kava: `Kava` | [0xCA8d0747B5573D69653C3aC22242e6341C36e4b4](https://kavascan.com/address/0xCA8d0747B5573D69653C3aC22242e6341C36e4b4#contracts) |
| :logos-aurora: `Aurora` | [0xCA8d0747B5573D69653C3aC22242e6341C36e4b4](ttps://explorer.aurora.dev/address/0xCA8d0747B5573D69653C3aC22242e6341C36e4b4/contracts) |

---

# **CryptoCalcZap**

*Zap for crypto pools to `get_dx`.*

!!!github
    The source code for `CryptoCalcZap.vy` can be found on [:material-github: GitHub](https://github.com/curvefi/curve-zaps/tree/master/contracts).


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
| :logos-mantle: `Mantle` | [0xd6681e74eEA20d196c15038C580f721EF2aB6320](https://mantlescan.xyz/address/0xd6681e74eEA20d196c15038C580f721EF2aB6320#code) |
| :logos-celo: `Celo`| [0xA72C85C258A81761433B4e8da60505Fe3Dd551CC](https://celoscan.io/address/0xA72C85C258A81761433B4e8da60505Fe3Dd551CC#code) |
| :logos-kava: `Kava` | [0xA72C85C258A81761433B4e8da60505Fe3Dd551CC](https://kavascan.com/address/0xA72C85C258A81761433B4e8da60505Fe3Dd551CC#contracts) |
| :logos-aurora: `Aurora` | [0xA72C85C258A81761433B4e8da60505Fe3Dd551CC](ttps://explorer.aurora.dev/address/0xA72C85C258A81761433B4e8da60505Fe3Dd551CC/contracts) |


---


# **DepositAndStakeZap**

*Zap to add liquidity to pool and deposit into gauge in one transaction.*

!!!github
    The source code for `DepositAndStakeZap.vy` can be found on [:material-github: GitHub](https://github.com/curvefi/deposit-and-stake-zap/tree/master/contracts).


| Chain | Contract Address |
| ----- | :--------------: |
| :logos-ethereum: `Ethereum` | [0x56C526b0159a258887e0d79ec3a80dfb940d0cD7](https://etherscan.io/address/0x56C526b0159a258887e0d79ec3a80dfb940d0cD7#code) |
| :logos-arbitrum: `Arbitrum` | [0x37c5ab57AF7100Bdc9B668d766e193CCbF6614FD](https://arbiscan.io/address/0x37c5ab57AF7100Bdc9B668d766e193CCbF6614FD#code) |
| :logos-optimism: `Optimism` | [0x37c5ab57AF7100Bdc9B668d766e193CCbF6614FD](https://optimistic.etherscan.io/address/0x37c5ab57AF7100Bdc9B668d766e193CCbF6614FD#code) |
| :logos-base: `Base` | [0x69522fb5337663d3B4dFB0030b881c1A750Adb4f](https://basescan.org/address/0x69522fb5337663d3B4dFB0030b881c1A750Adb4f#code) |
| :logos-fraxtal: `Fraxtal` | [0xF0d4c12A5768D806021F80a262B4d39d26C58b8D](https://fraxscan.com/address/0xF0d4c12A5768D806021F80a262B4d39d26C58b8D#code) |
| :logos-polygon: `Polygon` | [0x37c5ab57AF7100Bdc9B668d766e193CCbF6614FD](https://polygonscan.com/address/0x37c5ab57AF7100Bdc9B668d766e193CCbF6614FD#code) |
| :logos-gnosis: `Gnosis` | [0x37c5ab57AF7100Bdc9B668d766e193CCbF6614FD](https://gnosisscan.io/address/0x37c5ab57AF7100Bdc9B668d766e193CCbF6614FD#code) |
| :logos-avalanche: `Avalanche` | [0x37c5ab57AF7100Bdc9B668d766e193CCbF6614FD](https://snowscan.xyz/address/0x37c5ab57AF7100Bdc9B668d766e193CCbF6614FD#code) |
| :logos-fantom: `Fantom` | [0x37c5ab57AF7100Bdc9B668d766e193CCbF6614FD](https://ftmscan.com/address/0x37c5ab57AF7100Bdc9B668d766e193CCbF6614FD#code) |
| :logos-bsc: `Binance Smart Chain` | [0x4f37A9d177470499A2dD084621020b023fcffc1F](https://bscscan.com/address/0x4f37A9d177470499A2dD084621020b023fcffc1F#code) |
| :logos-mantle: `Mantle` | [0xF0d4c12A5768D806021F80a262B4d39d26C58b8D](https://mantlescan.xyz/address/0xF0d4c12A5768D806021F80a262B4d39d26C58b8D#code) |
| :logos-kava: `Kava` | [0x37c5ab57AF7100Bdc9B668d766e193CCbF6614FD](https://kavascan.com/address/0x37c5ab57AF7100Bdc9B668d766e193CCbF6614FD#contracts) |
| :logos-zksync: `zk-Sync` | [0x253548e98C769aD2850da8DB3E4c2b2cE46E3839](https://era.zksync.network/address/0x253548e98C769aD2850da8DB3E4c2b2cE46E3839#contract) |
| :logos-sonic: `Sonic` | [0x505d666E4DD174DcDD7FA090ed95554486d2Be44](https://sonicscan.org/address/0x505d666E4DD174DcDD7FA090ed95554486d2Be44) |
| :logos-sonic: `Taiko` | [0xd125E7a0cEddF89c6473412d85835450897be6Dc](https://taikoscan.io/address/0xd125E7a0cEddF89c6473412d85835450897be6Dc) |
| :logos-sonic: `Corn` | [0x0c59d36b23f809f8b6C7cb4c8C590a0AC103baEf](https://cornscan.io/address/0x0c59d36b23f809f8b6C7cb4c8C590a0AC103baEf) |
| :logos-sonic: `Ink` | [0x87DD13Dd25a1DBde0E1EdcF5B8Fa6cfff7eABCaD](https://explorer.inkonchain.com/address/0x87DD13Dd25a1DBde0E1EdcF5B8Fa6cfff7eABCaD) |

---

# **MetaZap-NG**

*Zap to add liquidity and remove liquidity into ng-metapools.*

!!!github
    The source code for `MetaZapNG.vy` can be found on [:material-github: GitHub](https://github.com/curvefi/stableswap-ng/blob/main/contracts/main/MetaZapNG.vy).

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
| :logos-fantom: `Fantom` | [0x21688e843a99B0a47E750e7dDD2b5dAFd9269d30](https://ftmscan.com/address/0x21688e843a99B0a47E750e7dDD2b5dAFd9269d30#code) |
| :logos-bsc: `Binance Smart Chain` | [0x07920e98a66e462c2aa4c8fa6200bc68ca161ea0](https://bscscan.com/address/0x07920e98a66e462c2aa4c8fa6200bc68ca161ea0#code) |
|:logos-linea: `Linea` | [0xf2eff2Cd0d9C82b7b2f17FbBed703fA7931dB1da](https://lineascan.build/address/0xf2eff2Cd0d9C82b7b2f17FbBed703fA7931dB1da) |
| :logos-scroll: `Scroll`| [0xb47988aD49DCE8D909c6f9Cf7B26caF04e1445c8](https://scroll.l2scan.co/address/0xb47988aD49DCE8D909c6f9Cf7B26caF04e1445c8) |
| :logos-mantle: `Mantle` | [0xe548590f9fAe7a23EA6501b144B0D58b74Fc4B53](https://mantlescan.xyz/address/0xe548590f9fAe7a23EA6501b144B0D58b74Fc4B53) |
| :logos-celo: `Celo`| [0x3f445D38E820c010a7A6E33c5F80cBEBE6930f61](https://celoscan.io/address/0x3f445D38E820c010a7A6E33c5F80cBEBE6930f61) |
| :logos-kava: `Kava` | [0xf2eff2Cd0d9C82b7b2f17FbBed703fA7931dB1da](https://kavascan.com/address/0xf2eff2Cd0d9C82b7b2f17FbBed703fA7931dB1da) |
| :logos-aurora: `Aurora`| [0x9293f068912bae932843a1bA01806c54f416019D](https://explorer.aurora.dev/address/0x9293f068912bae932843a1bA01806c54f416019D) |
| :logos-xlayer: `X-Layer`| [0x604388bb1159afd21eb5191ce22b4decdee2ae22](https://www.okx.com/web3/explorer/xlayer/address/0x604388bb1159afd21eb5191ce22b4decdee2ae22) |
| :logos-zksync: `zk-Sync` | [0x4232Dcc6D31543A2431079BdE2082C69eA3A771E](https://era.zksync.network/address/0x4232Dcc6D31543A2431079BdE2082C69eA3A771E) |
| :logos-sonic: `Sonic` | [0x5a8C93EE12a8Df4455BA111647AdA41f29D5CfcC](https://sonicscan.org/address/0x5a8C93EE12a8Df4455BA111647AdA41f29D5CfcC) |
| :logos-taiko: `Taiko` | [0x9AF14D26075f142eb3F292D5065EB3faa646167b](https://taikoscan.io/address/0x9AF14D26075f142eb3F292D5065EB3faa646167b) |
| :logos-corn: `Corn` | [0x3d6cB2F6DcF47CDd9C13E4e3beAe9af041d8796a](https://cornscan.io/address/0x3d6cB2F6DcF47CDd9C13E4e3beAe9af041d8796a) |
| :logos-ink: `Ink` | [0x3E3B5F27bbf5CC967E074b70E9f4046e31663181](https://explorer.inkonchain.com/address/0x3E3B5F27bbf5CC967E074b70E9f4046e31663181) |

---

# **LlamaLend LeverageZap**

*Zap to create leverage for lending markets.*

| Contract Type | Contract Address |
| ----- | :--------------: |
| `LeverageZap1inch` | [0x3294514B78Df4Bb90132567fcf8E5e99f390B687](https://etherscan.io/address/0x3294514B78Df4Bb90132567fcf8E5e99f390B687) |
| `LlamaLendOdosLeverageZap` | [0xc5898606bdb494a994578453b92e7910a90aa873](https://etherscan.io/address/0xc5898606bdb494a994578453b92e7910a90aa873) |
