---
hide:
  - toc
---

<h1>Lending Oracles: Overview</h1>

*There are two main contracts for lending oracles:*

<div class="grid cards" markdown>

-   **Oracle from a single Curve pool**

    ---

    EMA oracle for collateral tokens using **a single Curve pool to fetch the price oracle from**. The `OneWayLendingFactory` can automatically deploy this kind of oracle when deploying a new market.

    [:octicons-arrow-right-24: `CryptoFromPool`](./cryptofrompool.md)

-   **Oracle from multiple chained Curve pools**

    ---

    EMA oracle for collateral tokens using **multiple different Curve pool oracles chained together**. This oracle contract can also make use of `stored_rates` from `stableswap-ng` pools.

    [:octicons-arrow-right-24: `CryptoFromPoolsRate`](./cryptofrompoolsrate.md)

-   **Oracle from a Curve Pool + Vault**

    ---

    EMA oracle for collateral tokens using **a single Curve pool to fetch the price oracle, which is then adjusted by the redemption rate of a vault**.

    [:octicons-arrow-right-24: `CryptoFromPoolVault`](./cryptofrompoolvault.md)

</div>


---


# **Oracle Examples**

This sections aims to give examples on the various oracle contract combinations, focusing on [`CryptoFromPool.vy`](../contracts/cryptofrompool.md) and [`CryptoFromPoolsRate.vy`](../contracts/cryptofrompoolsrate.md).


## **Single Curve-Pool Oracle (e.g. CRV)**

The [oracle contract](https://etherscan.io/address/0xE0a4C53408f5ACf3246c83b9b8bD8d36D5ee38B8) for the CRV market fetches the price oracle from a single Curve pool, the [triCRV pool](https://etherscan.io/address/0x4eBdF703948ddCEA3B11f675B4D1Fba9d2414A14) consisting of crvUSD, wETH and wBTC. This oracle can even be deployed automatically using the [`create_from_pool`](../contracts/oneway-factory.md#create_from_pool) method on the [`OneWayLendingFactory`](../contracts/oneway-factory.md).

*The `CryptoFromPool.vy` contract is specifically designed for these types of oracles. Full documentation is available [here](../contracts/cryptofrompool.md).*


## **Chained Oracles without Rates (FXN)**

This [oracle contract](https://arbiscan.io/address/0xbB82bf9a0C6739c0bacFdFFbcE3D2Ec4AA97970E) utilizes two Curve pool oracles to derive the price of the [FXN token](https://arbiscan.io/address/0x179F38f78346F5942E95C5C59CB1da7F55Cf7CAd) relative to the crvUSD token. Importantly, this oracle does not apply any conversion rates; it strictly uses the raw prices provided by the oracles.
 
*The `CryptoFromPoolsRate.vy` contract is specifically designed for these types of oracles. Full documentation is available [here](../contracts/cryptofrompoolsrate.md).*

*To obtain the FXN token price, we use the following two Curve pool oracles:*

1. [`FXN/ETH pool`](https://arbiscan.io/address/0x5f0985A8aAd85e82fD592a23Cc0501e4345fb18c), which consists of `ETH` and `FXN`.
2. [`tricrypto-crvUSD pool`](https://arbiscan.io/address/0x82670f35306253222F8a165869B28c64739ac62e), which consists of `crvUSD`, `wBTC`, and `wETH`.

The price oracle from the first pool determines the price of FXN relative to ETH. The oracle from the second pool computes the price of wETH in terms of crvUSD. By combining these two prices, we can calculate the final price of FXN relative to crvUSD.[^1]

[^1]: The `price_oracle` method in each pool always returns prices relative to the token at index 0 within the pool. For example, in the tricrypto-crvUSD pool, crvUSD is at index 0, wBTC at index 1, and wETH at index 2. Thus, `price_oracle(0)` returns the price of wBTC with respect to crvUSD, and `price_oracle(1)` returns the price of wETH with respect to crvUSD. More on oracles can be found [here](../../cryptoswap-exchange/tricrypto-ng/pools/oracles.md).

*Let's consider some actual values:*

- `price_oracle` of FXN/ETH = 43130436331749331
- `price_oracle` of ETH/crvUSD = 3011786169374663706441

*Calculating the final price:*

$$\text{price} = \frac{\text{FXN/ETH} \times \text{ETH/crvUSD}}{10^{18}}$$ 

$$\text{price} = \frac{43130436331749331 \times 3011786169374663706441}{10^{18}} = 129899651623057139817$$

*This final value represents the price of FXN in terms of crvUSD by chaining together two oracles. All values are based on a scale of 1e18; hence, 129899651623057139817 would approximate to 129.71 crvUSD per FXN token.*


## **Chained Oracles with Rates (pufETH)**

The [oracle contract](https://etherscan.io/address/0xb08eB288C57a37bC82238168ad96e15975602cd9) for the pufETH lending market integrates two Curve pool oracles and applies the `stored_rates` from the [pufETH/wstETH pool](https://etherscan.io/address/0xeeda34a377dd0ca676b9511ee1324974fa8d980d) due to the nature of the tokens.

*The `CryptoFromPoolsRate.vy` contract is specifically designed for these types of oracles. Full documentation is available [here](../contracts/cryptofrompoolsrate.md).*

The pufETH/wstETH exchange rate is nearly 1:1. We take this exchange rate and multiply it by the wstETH/crvUSD rate obtained from the tryLSD pool. This calculation provides the price of pufETH in terms of crvUSD. **Note:** This is not the actual price of pufETH due to the operational mechanics of stableswap-ng pools. To ascertain the accurate and final price of pufETH, we must apply the `stored_rates`.

*The final price of pufETH is calculated as follows:*

1. Retrieve the pufETH/wstETH exchange rate (e.g., 0.99, where 1 pufETH is equivalent to 0.99 wstETH).
2. Obtain the wstETH price with respect to crvUSD from the tryLSD pool.
3. Multiply these values to calculate the oracle price of pufETH in terms of crvUSD.
4. To derive the complete price, apply the `stored_rates` from the stableswap pool, as provided by the oracle contract.


!!!info "`stored_rates`"

    Specific tokens have a rate which is denominated against another asset. For example, wstETH has a rate against stETH as the token can always be redeemed for a certain amount of stETH based on the rate. At origin, wstETH and stETH were 1:1, but as time passed and wstETH earned yield, the underlying amount of stETH increased. So, for example, after 1 year, 1 wstETH would be worth 1.1 stETH. Therefore, the rate would be 1.1 and is stored in the `stored_rates` variable in the stableswap pool.

    The same applies to ERC4626 tokens like pufETH with a `convertToAssets` method. This kind of rate is also stored in the `stored_rates` variable.

    The stableswap pool uses these rates to ensure accurate calculations when, for example, exchanging tokens or adding liquidity.
