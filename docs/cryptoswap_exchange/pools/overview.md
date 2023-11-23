
**The CryptoSwap market-making algorithm contains of three different classes of parameters:**

- *Bonding Curve:* **`A`** and **`gamma`**  
- *Price Scaling:* **`ma_time`**, **`allowed_extra_profit`** and **`adjustment_step`**  
- *Fees:* **`mid_fee`**, **`out_fee`** and **`fee_gamma`** 

!!!tip
    An excellent deep-dive artilce on the parameters: [https://nagaking.substack.com/p/deep-dive-curve-v2-parameters](https://nagaking.substack.com/p/deep-dive-curve-v2-parameters).


## **Bonding Curve Parameters**
Similar to many AMMs, Curve v2 employs a bonding curve to determine asset prices according to the pool's supply of each asset. To centralize liquidity around the midpoint of the bonding curve, Curve v2 adopts an invariant that falls between the StableSwap (Curve v1) approach and the constant-product method used by platforms like Uniswap and Balancer.

- **`A`**: regulates the concentration of liquidity at the core of the bonding curve
- **`gamma`**: regulates the overall breadth of the curve


## **Price Scaling**
Curve v2 pools automatically adjust liquidity to optimize depth close to the prevailing market rates, reducing slippage. This is achieved by tracking a continuous EMA (exponential moving average) of the pool's latest exchange rates (referred to as an "internal oracle") and reallocating liquidity around this EMA only when it's economically beneficial for LPs.

- **`ma_time`**: regulates the duration of the EMA price oracle
- **`allowed_extra_profit`**: excess profit required to allow price re-pegging
- **`adjustment_step`**: minimum size of price scale adjustments


## **Fees**
Fees are charged based on the balance/imbalance of the pool. Fee is low when the pool is balanced and increases the more it is imbalanced.

*There are three different kind of fees:*

- **`fee_mid`**: charged fee when pool is perfectly balanced (minimum possible fee).  
- **`out_fee`**: charged fee when pools is completely imbalanced (maximum possible fee).
- **`fee_gamma`**: determines the speed at which the fee increases when the pool becomes imbalanced. A low value leads to a more rapid fee increase, while a high value causes the fee to rise more gradually.


<figure markdown>
  ![](../../images/curveV2_fee.png){ width="400" }
  <figcaption></figcaption>
</figure>