<h1>LLAMMA Explainer</h1>

!!!info "Disclaimer: Examples"
    Examples used in this section refer to an `ETH <> crvUSD` market, where `ETH` is the collateral and `crvUSD` is the borrowed token. Additionally, the examples in this section are simplified in terms of numbers and other details. In reality, it is more complex, but for the sake of explaining the system, simplified examples are sufficient.

LLAMMA (Lending Liquidating Automated Market Maker Algorithm) is a market-making algorithm that rebalances the collateral of a loan using an AMM. The AMM contract creates opportunities for liquidating and de-liquidating collateral via arbitrage by offering better prices within the AMM compared to external markets. These collateral rebalances smoothly swap - dependant on asset prices - the collateral asset and the borrowed asset accordingly to keep the position sufficiently collateralized while recovering the collateral when the collateral price goes back up.

Unlike other liquidation mechanisms that have a single liquidation price at which the loan is liquidated once reached, **LLAMMA has a liquidation range in which collateral is continuously being rebalanced**. In short, when the price of the collateral asset goes down, the AMM starts converting `ETH` for `crvUSD`. If the price eventually recovers, the AMM converts the `crvUSD` back into `ETH`. More on the liquidation mechanism here: [Liquidation](#liquidation).

Each individual market has its own AMM containing the collateral and borrowable asset, such as the `ETH <> crvUSD` AMM consisting of `ETH` and `crvUSD`.

Before explaining the heart of the system, the liquidation process, in more detail, it is crucial to understand how the general structure of the AMM works. The AMM is similar to a **Uniswap V3-style AMM** using bands/ticks. Liquidity can be deposited into these bands, which have upper and lower price ranges. When opening a loan and adding collateral, this collateral is deposited into these bands. Users can choose the number of bands at loan creation, ranging from a **minimum of `4`** to a **maximum of `50`**. The liquidity sits idle in these bands and is only accessible for trading when the collateral price falls within the price range of a band.


---


## **Bands**

Bands in LLAMMA function similarly to Uniswap V3, concentrating liquidity between two prices. A band is a range of prices into which liquidity is deposited. LLAMMA consists of multiple bands forming a fixed price grid, and when creating a loan, liquidity is equally distributed across the number of bands (`N`) chosen when opening the loan. The minimum number is `4`, and the maximum is `50`. These bands where liquidity is deposited define the total liquidation range of the loan.[^1]

[^1]: For now, do not worry about how liquidation works. This mechanism will be explained in a section further down below. For now, just think of liquidation as changing the token composition that is backing your loan.

<figure markdown="span">
  ![](../assets/images/llamma/deposit_range.svg){ width="600" }
  <figcaption></figcaption>
</figure>

The graph shows how liquidity is distributed equally across the chosen number of bands (in this example, `N = 4`). While each single band has its own range, combining all bands with deposited liquidity forms the total liquidation range of the loan. In our example, the total liquidation range would be from `$1000` to `$600`. When the price of the collateral falls within this range, the collateral of the loan is being liquidated.



---

## **Liquidation**

The liquidation aspect of LLAMMA is very different from other lending protocols. LLAMMA has a liquidation range, whereas most other lending protocols have a single liquidation price, and their loan can be liquidated when that price is crossed.

!!!tip "Liquidation only happens when prices are within the users liquidation range"
    This liquidation mechanism only occurs if the price of the collateral is within the user's liquidation range. If not, there is no need to liquidate any assets backing the loan.

In LLAMMA, your collateral is continuously being rebalanced if the price of the collateral asset is within the users liquidation range. Liquidated in this case does not refer to a "hard-liquidation" where your loan is immediately closed, but rather a "partial liquidation" which rebalances the assets backing your loan. So, what does this exactly mean? In short, if the price of the collateral goes down, the LLAMMA starts selling the collateral asset for the borrowed asset (in our example selling ETH for crvUSD). Now the loan is backed by ETH and crvUSD. This process is called [**soft-Liquidation**](#soft-liquidation). When the price of the collateral eventually goes up again, LLAMMA starts converting the previously bought crvUSD back into ETH. This is called [**de-Liquidation**](#de-liquidation).

Liquidation is not done on a user basis but rather on a band basis, making the liquidation mechanism scalable. Not individual users are soft- or de-liquidated, but rather bands in which multiple users have deposited liquidity.

*For simplicity purposes, let's ignore [hard-liquidation](#hard-liquidation) and how the AMM actually liquidates the collateral for now.*


---

!!!info "`ETH <> crvUSD` market as Example"
    *Let's look at the different states of liquidation, using a fictive example of a loan backed by 2 ETH (ETH price = $1000) and a total debt of 1750 crvUSD. The loan uses 4 bands. In the following examples, whenever stating that price goes down, its meant that the collateral asset price goes down. But e.g. if there is a market with a stable asset as collateral such as crvUSD, then soft-liquidation would happen when the borrowed asset goes up.*


### **Soft-Liquidation**

Soft-liquidation is the process which sells the collateral asset (`ETH`) for the borrowable (`crvUSD`) asset because the asset price of the collateral is going down. This reduces the overall exposure to the volatile asset (ETH) of the loan. But keep in mind, as long as the price is above the liquidation range, there is no need to liquidate anything; all the bands are 100% in ETH.

Now let's assume the price of the collateral falls into the liquidation range within the first band. Now, the LLAMMA starts selling off ETH into crvUSD. The further down the price of the collateral goes, the more ETH will be sold for crvUSD. For example, if 0.5 ETH is deposited in this first band (because 2 ETH is evenly spread across 4 bands) and the price of the collateral is approximately in the middle of this band, then 0.25 ETH will be converted into crvUSD. If the price goes further down, say exactly to the bottom range of the first band (which at the same time is also the top range of the band below), then a total of 0.5 (the entire band) will be soft-liquidated into crvUSD. At this point, LLAMMA sold 0.5 ETH for, let's say, 490 crvUSD[^2]. If the price goes further down, it enters the second band and does exactly the same.

This can lead to the following: It is possible that the price of the collateral goes down through the entire liquidation range (essentially below the lower liquidation range of $800). At this point, the entire collateral will be soft-liquidated for crvUSD, and now the loan is fully backed by crvUSD. NOTE: This is only possible if the health of the loan is still above 0% (more on this in the hard-liquidation section).

[^2]: You might wonder why the LLAMMA did not convert 0.5 ETH into 500 crvUSD as the price of ETH is $1000. The explanation is that losses occur during this soft-liquidation.

*Summary: If the price goes down, LLAMMA starts selling the collateral asset for the borrow asset.*


### **De-Liquidation**

De-liquidation is essentially exactly the same as soft-liquidation, but the other way around when the price of the collateral asset rises again. De-liquidation means converting the crvUSD backing the loan obtained through earlier soft-liquidation back into the collateral token (ETH) again. Logically, for a de-liquidation to happen, the loan first needs to be soft-liquidated. Otherwise, there is no crvUSD to convert to ETH.

De-liquidation can happen until all the assets backing the loan are converted back into the original asset (ETH).

*Summary: If the price of the collateral rises, LLAMMA starts buying back the collateral for the borrow asset.*

### **Hard-Liquidation**

Hard-liquidation is the process where other users can repay the debt of a user and in exchange receive their collateral. A loan is only eligible for hard-liquidation when the health of the loan is below 0%. It is very important to understand that the liquidation range does not reflect prices where a loan is hard-liquidated. It really only depends on the health of the loan.

!!!tip
    Losses through soft- and de-liquidation only occur when the loan is in liquidation mode. If the price of the collateral is outside the liquidation range and there is no need to liquidate the position, no losses occur because the collaterals are not traded. On the other hand, losses accrued through interest rates happen regardless of whether the loan is being liquidated or not.

*There are two factors that decrease the health of the loan:*

- **Interest rate**: A user borrowing assets needs to pay an interest rate. This constantly (per block) increases the debt of the position and therefore reduces its health.
- **More importantly: Losses when the position is soft- or de-liquidated**. When converting the collateral back and forth, losses occur. It is very hard to quantify the gravity of losses as it depends on various factors. Observations so far lead to the following conclusions:

    - The more bands used for a loan, the fewer the losses through soft- and de-liquidation.
    - The more liquidity, the fewer the losses.
    - The more efficient the arbitrage, the fewer the losses.

To counter the losses from liquidation and the interest rate, there is a swap fee in the AMM. Arbitrage traders pay this fee when exchanging tokens within the AMM. The earned swap fees are given to the liquidity providers, who are the users that took out a loan and deposited collateral into bands in the AMM.

A loan's health can be read directly from the `Controller.vy` contract of the corresponding market using the [`health`](controller.md#health) method:

```vyper
>>> Controller.health('0xc92D575eB77C8AAe8e841bF5040346E34ad12d

37', true)
372983744062357570             # ≈37.3%
```


## **Possible Scenarios of Band Compositions**

*Now that we know how the liquidation mechanism of LLAMMA works, we can define three possible scenarios for bands regarding their asset composition:*

1. **Band contains both collateral and borrowable token:** Indicates continuous liquidation mode. The band in which the collateral price is currently located is defined as the [`active_band`](./amm.md#active_band).

    <figure markdown="span">
    ![](../assets/images/llamma/one_band_final.svg){ width="260" }
    <figcaption></figcaption>
    </figure>

2. **Band contains only the collateral token:** This band has not been soft-liquidated. The collateral price is higher than the upper price of the band and is therefore outside the band. These are the bands above the [`active_band`](./amm.md#active_band).

    <figure markdown="span">
    ![](../assets/images/llamma/two_bands_eth_final.svg){ width="400" }
    <figcaption></figcaption>
    </figure>

3. **Band contains only the borrowable token:** This band has already been soft-liquidated. The collateral price is below the band, and arbitrage trades have exchanged all the ETH for crvUSD in the band. These are the bands below the [`active_band`](./amm.md#active_band).

    <figure markdown="span">
    ![](../assets/images/llamma/two_bands_crvusd_final.svg){ width="400" }
    <figcaption></figcaption>
    </figure>

*A full set of bands can look like the following:*

<figure markdown="span">
  ![](../assets/images/llamma/three_bands_final.svg){ width="700" }
  <figcaption></figcaption>
</figure>


---


## **How does LLAMMA liquidate the Collateral?**

Liquidation happens on a band basis, not on an individual user basis. This means that if multiple users have liquidity deposited into the same band that is currently being soft- or de-liquidated, the liquidation happens for all users together and not just for a single user.

Soft- and de-liquidation is not automatically triggered by the smart contract. Instead, the AMM creates an arbitrage opportunity by utilizing the following two prices:

- **`price_oracle`**: The collateral price fetched from a price oracle contract.
- **`get_p`**: The oracle price of the AMM itself.

When the price oracle fetched from an external price source (using oracles of Curve liquidity pools), the AMM's "internal price `get_p`" is adjusted to be more sensitive, creating arbitrage opportunities. Arbitrage traders are incentivized to maintain `get_p = price_oracle` within the LLAMMA. When `price_oracle` equals `get_p`, the external oracle price and the AMM price are identical, indicating no need and possibility for arbitrage.

<figure markdown="span">
  ![](../assets/images/llamma/ramp-cubic.svg){ width="700" }
  <figcaption></figcaption>
</figure>


### **Oracle Price Decrease (Soft-Liquidation)**

When the `price_oracle` starts to fall, `get_p` falls faster than `price_oracle`. For example, if `get_p` is 830 and `price_oracle` is 850, arbitrage traders can buy ETH for 830 in the LLAMMA and sell it for 850 elsewhere. This process decreases ETH in the bands (because it’s bought) and increases crvUSD (because it’s being sold).

### **Price Oracle Increase (De-Liquidation)**

When the `price_oracle` rises, `get_p` increases faster than `price_oracle`. For example, if `get_p` is 860 and `price_oracle` is 850, arbitrage traders can buy ETH outside of the AMM for 850 and sell it in the AMM for 860. This results in ETH being deposited into the AMM and crvUSD being removed.


### **How is it arbitraged?**

The arbitrage opportunity lies within the difference between `get_p` and `price_oracle`. As long as `get_p ≠ price_oracle`, there is an arbitrage opportunity. The static exchange fee can be adjusted by governance using the `set_fee` function.

- **`get_p < price_oracle`**: The ETH price in the AMM is lower, making it favorable to buy ETH from the AMM and sell it elsewhere. This removes ETH from the bands and adds crvUSD, leading to soft-liquidation.
- **`get_p > price_oracle`**: The ETH price in the AMM is higher, making it favorable to buy ETH elsewhere and sell it to the AMM. This adds ETH to the AMM and removes crvUSD, leading to de-liquidation.
- **`get_p = price_oracle`**: There is no arbitrage opportunity.

Arbitrage traders should observe `get_p` and `price_oracle` inside the AMM. The `get_amount_for_price` function helps check how much of the assets need to be exchanged to reach a certain price. This function returns a `uint256` value representing the amount to sell/buy and a boolean indicating whether to pump or dump the collateral.


---


# **Loan Parameters**

## **Maximum LTV**

The loan-to-value (LTV) ratio depends on the number of bands (`N`) and the band width factor (`A`). The higher the number of bands, the lower the LTV. The maximum LTV can be approximated using the following function:

$$LTV = \text{100%} - \text{loan_discount} - 100 * \frac{N}{2*A}$$

The loan discount is the percentage used to discount the collateral for calculating the maximum borrowable amount when creating a loan.


=== "Example"

    *Two examples approximating the maximum LTV using 4 and 50 bands with a loan discount of 9% and an A value of 100:*

    $\text{LTV (4 bands)} = 1 - 0.09 - 1 \times \frac{4}{2 \times 100} = 0.89 ≈ \text{89%}$

    $\text{LTV (50 bands)} = 1 - 0.09 - 1 \times \frac{50}{2 \times 100} = 0.66 ≈ \text{66%}$



## **Liquidation Range**

The start of the liquidation range is also determined by the LTV:

$$\text{starting_price} = \frac{debt}{collateral * LTV}$$

To obtain the actual starting price value in dollars, multiply the value by the `price_oracle` at the time of creating the loan.


---


# **Resources and Further Reading**

For a basic understanding of how LLAMMAs work, consider the following articles:

- [Introduction to the Principles and Architecture of Curve Stablecoin](https://mirror.xyz/albertlin.eth/H0m3nyq65anotTWhTdWDIWEfMPOofNPy-0qyARYXNF4) by Albert Lin
- [crvUSD - Curve's StableCoin](https://mirror.xyz/0x290101596c9f85eB7194f6090a8c94fF5AAa32ca/esqF1zwoaZ4ZSIjt-faZZiuKwLLw34nD0SGlqD2fZ6Q) by GeekRunner
- [crvUSD: Just What the User Needs to Know](https://github.com/chanhosuh/curvefi-math/blob/master/LLAMMA.ipynb) by Chanho Suh
- [From Uniswap v3 to crvUSD LLAMMA](https://www.curve.wiki/post/from-uniswap-v3-to-crvusd-llamma-%E8%8B%B1%E6%96%87%E7%89%88)

For more articles and resources on LLAMMA, see [Useful Resources](../references/useful.md#curve-stablecoin-crvusd).
