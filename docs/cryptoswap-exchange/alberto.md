---
date:
  created: 2025-07-15
---

# My Crypto Pool is stuck: DON'T PANIC!

Laying the foundations to understand Cryptoswap, Curve pools for volatile assets.
<!-- more -->

## Making sense of absent naming conventions

Sorry to start with the annoying part, but if anything 90% of the confusions can be solved if we agree on some common terminology when talking about these pools.

### Cryptoswap
Cryptoswap is family of Curve pools, that supports any asset type but works best with assets that are not pegged to each other. Currently there's two versions of this pools: `curvefi/twocrypto-ng` and `curvefi/tricrypto-ng`. TODO add links

- The ng prefixed started being adopted to differentiate old stableswap implementations from stableswap-ng ones. There's no such thing as two/tricrypto non-ng, before only cryptoswap existed.


- The whitepaper for Cryptoswap actually references them as "Crypto Pools".
- Even nowadays these pools are still referred to as: Curve V2 pools as if they were a successor of stableswap. This is incorrect as stableswap covers a very different type of assets and its current the most popular type of pool on Curve.
- **twocrypto-ng:** Cryptoswap pool for two tokens. 
- **tricrypto-ng:** Cryptoswap pool for three tokens.


    !!! note "Curve Trivia"
        **ng** stands for new generation, this comes from an old programming naming convention for CLI tools that mich happened to use, like `syslog-ng`, `zlib-ng`, `iptraf-ng`. While not very forward looking (we can't call a V3 twocrypto-ng-ng), this remained for historical reasons.


### Rebalancing liquidity

This is **not** specific to curve pools: rebalancing liquidity is the action of changing the liquidity distribution. There are virtually infinite ways of doing this, but the most common are:

- Uniswap V3 tick based approach
- Curve style bonding curve parametrization

![](../images/liq-curve-vs-uniswap.png){ width="500" }
<!-- - Rebalancing liquidity in the direction of a new price. This helps the pool offer better prices.  -->

#### Rebalancing liquidity comes at a loss

If you're here I hope you have a good understanding of impermanent loss, if you don't please come back later! TODO add resources

Every time the liquidity distribution is adjusted this comes at a loss. This comes from the infamous impermanent loss, rebalancing liquidity locks-in that loss as you don't have the possibility of getting the AMM back in its original position where you deposited liquidity. Take a few minutes to let this sink in, every time I explain it it sill bends my mind and this deserves a separate article.

## Is my Cryptoswap pool stuck?

### Understanding price scales

Cryptoswap pools track where the center of liquidity is using a variable called `price_scale`

!!! note "On accuracy"
    The rebalancing algorithm and the internal oracle determining its functioning are out of the scope of this article in the interest of simplicity. 

To keep things simple from now on I'll be talking about twocrypto-ng, so that we only have two assets in the pictures.

![](../images/price_scale.png)

If the price scale has a value of `10**18` it means that the liquidity is centered at the 1:1 exchange ratio.

!!! note "Important"
    The price scale doesn't impose where the exchange rate is, it just tells you around what price swaps will have the best prices.

The expected behavior of a cryptoswap pool is to slowly move the price scale over time somewhere closer to where the real price is, while preventing users from losing more than 50% of what they make through trading fees. In other words, if we're not making enough money we don't rebalance, as each rebalance would come at a loss and LPs would not be profitable.

As a rule of thumb the more fees (hence the more volume) pool generates, the faster it can afford to move the price scale towards the market price.

If a big market movement happens too quickly the price scale won't manage to follow along and you'll end up in the following scenario:

![alt text](image.png)

The pool now has low liquidity where most of the action is happening, this means that trades aren't getting routed through the pool and arbitrage opportunities become smaller. 

Remember what we said? Less volumes means less fees, less fees means slower rebalancing, slower rebalances means less volume, and that's how we end up stuck with a price scale that doesn't move anymore.


## How can I prevent this from happening to me?

While there is no way one can guarantee that this won't happen to a pool with 100% confidence there's a few things you can do to make it very unlikely.

### Parametrize the pool correctly

Cryptoswap has a lot of parameters you can customize, as nagaking described in this article.

Just to give a visual clue of how parameters can affect a pool, here you can find a sketch of a qualitative example:

If the right parameters are set, good arbitrage flow can increase volume and make the price scale catch up faster. But arbitrage won't save you from a bad parametrization and can in some cases make it even worse.

## Can a pool being stuck be a good thing?

Yes, directionality matters here!

Picture this: you are the asset issuer of an ETH LST (we'll call the token superETH) that doesn't yet have redemptions mechanism. 

You initialized the pool with an initial price of 1:1, which corresponds to a price scale of 10**18. However over time the spot price of superETH moved to an exchange rate of 1 ETH per 0.8 superETH. 



You hav


## I'm stuck, what should I do now?

### 

### Seed a new pool
Realistically this option is only viable if you own most the of the liquidity as POL.

If you have a gauge it needs to be killed etc

## Ramping, rebalance, ramp again

1. ramp to reduce liquidity concentration
which parameters actually reduce concentration? Reducing A, some change in gamma.
2. wait for the pool to have the price scale get closer to the market.
3. Ramp again to increase concentration **if needed**. 


### Washtrade the pool 

## Is Cryptoswap a bad algorithm?

TLDR: No, but it might not fit your needs. 

Cryptoswap is built on the assumption that LPs aren't competent enough to rebalance their positions autonomously, and it sacrifices on trade execution to protect LPs.

Cryptoswap comes from that cypherpunk vision of the original DeFi where LPing is supposed to be as easy as swapping, logic should be fully onchain and that AMMs shouldn't compete with order books on trade execution.

The market has clearly decided that this direction is not the ideal anymore and it prefers to shift the responsibility of the LP profitability to the liquidity provider itself.

There's different profile of LPs:
Usually go on uniswap or other tick/bin based AMMs like Algebra, Liquidity Book, Maverick etc.

- LPs outsmarting the market (rare but these entities exist):
- LPs (or underestimating losses) or incentives will cover the losses:
- External incentives subsidizing the losses, often by incentivizing through merkl or other platforms.

Set and forget solutions with an external oracle for rebalancing:

- Solutions like the oraclized stableswap from Balancer or Liquidity book's autopools just pray that incentives will be bigger than LP losses and advertise an attractive APY that doesn't account for ~im~permanent losses (shoutout to Bunni for being the first to show IL in their frontend).

Set and forget solutions that you can actually forget about (but returns might be disappointing):
- Cryptoswap 
- Arrakis used to do this while moving the rebalancing component offchain. They still do this but they moved from B2C to B2B
