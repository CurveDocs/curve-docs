CryptoSwap is a algorithm for automated market-making for volatile tokens. For a detailed overview of the CryptoSwap design, please read the official [CryptoSwap whitepaper](https://docs.curve.fi/references/whitepapers/cryptoswap/).

For a overview on what kind of parameters the algorithm uses, see [here](../cryptoswap_exchange/pools/overview.md).

All exchange functionality that Curve supports, as well as noteworthy implementation details, are explained in technical depth in this section. 
 

## **TwoCrypto**
*soon*

## **TriCrypto**

Two-Crypto pools consist of three volatile coins.

The AMM (automatic market maker) infrastructure involves the following parts:

- Factory
- AMM blueprint contract (includes LP-Token)
- Liquidity Gauge blueprint contract
- Maths Contract
- Views Contract