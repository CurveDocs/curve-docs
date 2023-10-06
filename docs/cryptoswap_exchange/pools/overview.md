
**The CryptoSwap market-making algorithm contains of three different classes of parameters:**

- *Bonding Curve:* `A` and `gamma`  
- *Price Scaling:* `ma_time`, `allowed_extra_profit` and `adjustment_step`  
- *Fees:* `mid_fee`, `out_fee` and `fee_gamma` 

!!!tip
    Price Scaling and Fee parameters are bundled and stored as a single unsigned integer. This consolidation reduces storage read and write operations, leading to more cost-efficient calls. When these parameters are accessed, they are subsequently unpacked.


    ??? quote "_pack()"

        ```python hl_lines="1 3 8 13"
        @internal
        @view
        def _pack(x: uint256[3]) -> uint256:
            """
            @notice Packs 3 integers with values <= 10**18 into a uint256
            @param x The uint256[3] to pack
            @return uint256 Integer with packed values
            """
            return (x[0] << 128) | (x[1] << 64) | x[2]
        ```


    ??? quote "_unpack()"

        ```python hl_lines="1 3 8 13"
        @internal
        @view
        def _unpack(_packed: uint256) -> uint256[3]:
            """
            @notice Unpacks a uint256 into 3 integers (values must be <= 10**18)
            @param val The uint256 to unpack
            @return uint256[3] A list of length 3 with unpacked integers
            """
            return [
                (_packed >> 128) & 18446744073709551615,
                (_packed >> 64) & 18446744073709551615,
                _packed & 18446744073709551615,
            ]
        ```


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
  ![](../images/curveV2_fee.png){ width="400" }
  <figcaption></figcaption>
</figure>