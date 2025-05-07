# Contribution Guidelines

Curve Smart Contracts are fully open source, hosted on [GitHub](https://github.com/curvefi), and written in [Vyper](https://github.com/vyperlang/vyper).

## Writing Vyper contracts

The grand majority of the codebase is written in Vyper. We try to follow the Vyper style guide, available [here](https://vyper.readthedocs.io/en/stable/style-guide.html).

### Why Vyper?

Vyper is an EVM-compatible language that is designed to be simple and easy to understand. It closely resembles Python, which makes it easier to write and read math heavy code. Furthermore Vyper has less issues than Solidity when it comes to large contracts (e.g. no stack too deep errors, better optimizer allows to fit more code in a single contract and many other features).

The Vyper community has supported Curve from day one, and from the origin of the protocol working alongside Vyper has allowed both Curve and Vyper to grow an thrive together.

## Writing unit tests

At Curve we have quite a unique setup when it comes to writing tests. You can read more about it in the [testing](./testing/overview.md) section.

## Documentation

Our documentation is hosted on Github at [CurveDocs/curve-docs](https://github.com/CurveDocs/curve-docs) while our user resources are hosted on [CurveDocs/curve-resources](https://github.com/CurveDocs/curve-resources) and they both use [mkdocs](https://www.mkdocs.org/) in combination with [Material for MkDocs](https://squidfunk.github.io/mkdocs-material/) to display the beautiful documentation you see today.

## Important Repositories

- [curvefi/curve-stablecoin](https://github.com/curvefi/curve-stablecoin) contains all the logic for crvUSD (CDP) and Llamalend (Money Market).
- [curvefi/stableswap-ng](https://github.com/curvefi/stableswap-ng) contains the logic for all stableswap pools, including metapools.
- [curvefi/twocrypto-ng](https://github.com/curvefi/twocrypto-ng) contains the logic for all twocrypto pools (Cryptoswap for two assets).
- [curvefi/tricrypto-ng](https://github.com/curvefi/tricrypto-ng) contains the logic for all tricrypto pools (Cryptoswap for three assets).
- [curvefi/scrvusd](https://github.com/curvefi/scrvusd) contains the logic for the Savings crvUSD vault. Based on [Yearn V3 vaults](https://github.com/yearn/yearn-vaults-v3).