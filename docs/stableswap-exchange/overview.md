<h1> Curve Stableswap Exchange: Overview </h1>

The Stableswap algorithm integrates features of both the constant sum and constant product formulas, adjusting between these models based on the balance of assets in the pool. For a detailed overview of the Stableswap invariant design, please read the official [Whitepaper](../assets/pdf/whitepaper_stableswap.pdf).

The Curve Stableswap exchange utilizes a specific algorithm known as the **Stableswap invariant to facilitate the trading of stablecoins and other stable assets**. This method is designed to offer lower slippage in stablecoin transactions compared to other common algorithms like the constant-product invariant. In this context, "stablecoins" refer to digital assets that aim to maintain a stable value relative to another asset, including fiat-pegged stablecoins (e.g., DAI, USDC), synthetic versions of cryptocurrencies (e.g., synthetic ETH), or various forms of wrapped BTC.

A Curve pool, at its core, is a smart contract that implements the Stableswap invariant, enabling the exchange of tokens. While all Curve pools are based on this invariant, they can differ in structure. The simplest form of a Curve pool involves two or more tokens, known as a **"plain pool"**. Additionally, Curve offers **"metapools"**, which are designed to **facilitate exchanges between a token and the underlying pools of the LP token it is paired against.**

For technical implementations, the **Stableswap algorithm combines a constant sum invariant with a constant product invariant**, represented mathematically in the form of equations that account for the total amount of tokens in a pool at equilibrium. This model adjusts as the pool's balance shifts, moving towards a constant product model when significant imbalances occur.

---

## **Implementations**

!!!github "GitHub"

    The source code for the Curve Finance Stableswap contracts is openly accessible on GitHub:

    - Genesis Contracts: The initial set of smart contracts for Curve pools can be found at [Curve's contracts repository](https://github.com/curvefi/curve-contract/tree/master/contracts/pools).
    - Stableswap-NG: An updated version of the Stableswap algorithm, known as Stableswap-NG (next generation), is available at [Curve's Stableswap-NG repository](https://github.com/curvefi/stableswap-ng).


*There have been two major on-chain implementations of the Stableswap invariant across various chains:*


### Original Stableswap

The original Stableswap was the first on-chain implementation of the Stableswap invariant.



### Stableswap-NG

The Stableswap-NG AMM infrastructure marks a sophisticated evolution from its original implementation, delivering enhanced technical capabilities. This upgraded framework allows for the inclusion of up to eight tokens in standard pools and two in metapools. It extends support to a variety of token types, including rate-oracle tokens like wstETH, ERC4626 tokens such as sDAI, and rebasing tokens like stETH.

However, native tokens like ETH are not directly supported within this implementation. For transactions involving ETH, its wrapped version, wETH, must be utilized. This decision is rooted in ensuring higher security standards.

Additionally, pools now have built-in [moving-average oracles](./stableswap-ng/pools/oracles.md).

For an in-depth exploration of the new features introduced by Stableswap-NG, please refer to the  [Stableswap-NG Pool Overview](./stableswap-ng/pools/overview.md).
