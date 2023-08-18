# Curve Pool Factory

Good resource to understand Factory Pools: [here](https://resources.curve.fi/factory-pools/pool-factory/)

!!!tip
    Pools can be deployed via the [Curve UI](https://curve.fi/#/ethereum/create-pool). More informations on it [here](https://resources.curve.fi/factory-pools/creating-a-factory-pool/).
    In case of uncertainty regarding the pool paramters etc. please do not hesitate to contract curve members.


The factory allows for permissionless deployment of Curve pools and gauges.

- *StableSwap Factory* (stable asset pools): [0xB9fC157394Af804a3578134A6585C0dc9cc990d4](https://etherscan.io/address/0xB9fC157394Af804a3578134A6585C0dc9cc990d4)
- *CryptoSwap Factory* (two-coin volatile asset pools): [0xF18056Bbd320E96A48e3Fbf8bC061322531aac99](https://etherscan.io/address/0xF18056Bbd320E96A48e3Fbf8bC061322531aac99)
- *Tricrypto Factory* (three-coin volatile asset pools): [0x0c0e5f2fF0ff18a3be9b835635039256dC4B4963](https://etherscan.io/address/0x0c0e5f2fF0ff18a3be9b835635039256dC4B4963)

Source code for factory contracts may be viewed on [Github](https://github.com/curvefi/curve-factory).


# **Organization**

The factory has several core components:

- The **factory** is the main contract used to deploy new pools and gauges. It also acts a registry for finding the 
  deployed pools and querying information about them.
- **Pools** are deployed via a **proxy contract**. The implementation contract targetted by the proxy is determined 
  according to the base pool. This is the same technique used to create pools in Uniswap V1.
- **Deposit contracts** (“zaps”) are used for wrapping and unwrapping underlying assets when depositing into or 
  withdrawing from pools.

The `Factory` contract is used to deploy new Curve pools and gauges. It also acts as a registry, which is useful for
finding deployed curve pools and gauges. It is deployed to the mainnet at the following address:

[0xB9fC157394Af804a3578134A6585C0dc9cc990d4](https://etherscan.io/address/0xB9fC157394Af804a3578134A6585C0dc9cc990d4)

Source code for this contract is may be viewed on 
[Github](https://github.com/curvefi/curve-factory/blob/master/contracts/Factory.vy).


!!! warning "Limitations"

    Please carefully review the limitations of the factory prior to deploying a new pool. Deploying a pool using an 
    incompatible token could result in **permanent losses to liquidity providers and/or traders**. Factory pools cannot be 
    killed and tokens cannot be rescued from them!
    
    - The token within the new pool must expose a decimals method and use a maximum of 18 decimal places.
    - The token’s `transfer` and `transferFrom` methods must revert upon failure.
    - Successful token transfers must move exactly the specified number of tokens between the sender and receiver. 
      Tokens that take a fee upon a successful transfer may cause the pool to break or act in unexpected ways.
    - Pools deployed by the factory cannot be paused or killed.


The factories can be used to deploy the following:

- plain pools
- base-pools (after a successful DAO vote)
- meta-pools (paired against admin-approved base pools)
- crypto pools (two-coin pools)
- tricrypto pools (three-coin pools)
- gauges


# **Poold**

## **Base Pools**

A metapool pairs a coin against the LP token of another pool. This other pool is referred to as the “base pool”. 
By using LP tokens, metapools allow swaps against any asset within their base pool, without diluting the base pool’s 
liquidity.
Existing base pools can be obtained by querying `base_pool_list` within the [MetaRegistry API](../registry/overview.md) or the MetaPoolFactory-Contract itself.

```shell
>>> MetaRegistry.base_pool_list(0):
'0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7'
```


The factory allows deployment of metapools that use the following base pools:

| Name      | Coins   | Contract Address |
| ----------- | -------| ----|
| `3pool` |  `USDT <> USDC <> DAI` | [0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7](https://etherscan.io/address/0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7) |
| `sBTC` |  `sBTC <> wBTC <> renBTC` | [0x7fC77b5c7614E1533320Ea6DDc2Eb61fa00A9714](https://etherscan.io/address/0x7fC77b5c7614E1533320Ea6DDc2Eb61fa00A9714) |
| `renBTC` |  `renBTC <> wBTC` | [0x93054188d876f558f4a66B2EF1d97d16eDf0895B](https://etherscan.io/address/0x93054188d876f558f4a66B2EF1d97d16eDf0895B) |
| `fraxBP` |  `FRAX <> USDC` |[0xDcEF968d416a41Cdac0ED8702fAC8128A64241A2](https://etherscan.io/address/0xDcEF968d416a41Cdac0ED8702fAC8128A64241A2) |
| `sBTC2` |  `sBTC <> wBTC` | [0xf253f83AcA21aAbD2A20553AE0BF7F65C755A07F](https://etherscan.io/address/0xf253f83AcA21aAbD2A20553AE0BF7F65C755A07F) |

It is possible to enable additional base pools through a DAO vote.


## **Meta Pools** 
A metapool pairs a coin against the LP token of another pool (base-pool).

## **Plain Pools**
A plain pool pairs a minimum of 2 and a maximum of 4 coins. These coins are not paired with another pool. However, a plain pool can only pair assets that are not included in any base pool.




# **Recommended Parameters**

!!!warning
    Please understand that these are just recommendations based on date of previously deployed pools.
    For further undestanding of the parameters please refer to other parts of the documentation.

## **StableSwap Pools**

| Parameter | Recommendation |
| ----------------------------- | -------------- |
| `_A` for Uncollateralized algorithmic stablecoins  | 5 - 10   |
| `_A` for Non-redeemable, collateralized assets     | 100    | 
| `_A` for Redeemable assets                         | 200 - 400|
| `_fee`                                             | - |




## **Crypto Pools**

### *Two-Coin-Crypto Pools*

| Parameter | Recommendation |
| --------- | ---------------|
| `A`| 20000000 |
| `gamma`| 10000000000000000 |
| `mid_fee`| 3000000 |
| `out_fee`| 45000000 |
| `fee_gamma`| 300000000000000000 |
| `allowed_extra_profit`| 10000000000 |
| `adjustment_step`| 5500000000000 |
| `admin_fee`| 5000000000 |
| `ma_half_time`| 600 |
| `initial_prices`| - |


### *Three-Coin-Crypto-Pools (Tricrypto)*

| Parameter | Recommendation |
| --------- | ---------------|
| `A`| 2700000 |
| `gamma`| 1300000000000 |
| `mid_fee`| 2999999 |
| `out_fee`| 80000000 |
| `fee_gamma`| 350000000000000 |
| `allowed_extra_profit`| 100000000000 |
| `adjustment_step`| 100000000000 |
| `ma_exp_time`| 600 |
| `initial_prices`| - |
