<h1>VaultV3.vy</h1>

*"Yearn's v3 yVaults are a decentralized suite of yield-generating products built to fit any need. They are designed to be un-opinionated and customizable infrastructure for the world to build on, making yield generation as safe, efficient, and easy as possible for all parties.*

*Version 3 of yVaults iterates on Version 2 by increasing its robustness and developing Yearn’s path towards further decentralization, while keeping the same proven product (yield-bearing tokens). Version 3 has all the same functionality as Version 2, but with many more added benefits and improvements to continue to grow the Yearn ecosystem.*

*V3 also sees the introduction of "Tokenized Strategies". Strategies are now capable of being standalone 4626 vaults themselves. These single-strategy vaults can be used as stand-alone vaults or easily added as a strategy to a Multi-Strategy Vault."*[^1]

[^1]: [Yearn Documentation](https://docs.yearn.fi/getting-started/products/yvaults/v3)


???+ quote "VaultV3.vy"
    The source code for the Yearn `VaultV3.vy` contract is available on [:material-github: GitHub](https://github.com/yearn/yearn-vaults-v3/blob/104a2b233bc6d43ba40720d68355b04d2dc31795/contracts/VaultV3.vy). The contract is written in [Vyper](https://github.com/vyperlang/vyper) version `0.3.7`. Full technical documentation is available in the [Yearn Dev Docs](https://docs.yearn.fi/developers/v3/overview).

    **The `Vault` and the `scrvUSD` vault token share the same address.** The contract is deployed on :logos-ethereum: Ethereum at [`0x0655977FEb2f289A4aB78af67BAB0d17aAb84367`](https://etherscan.io/address/0x0655977FEb2f289A4aB78af67BAB0d17aAb84367).

    The source code was audited by [:logos-chainsecurity: ChainSecurity](https://www.chainsecurity.com/). The audit report will be available soon.
