# Curve Factory

The factory allows for permissionless deployment of Curve pools and gauges. Source code for factory contracts may be 
viewed on [Github](https://github.com/curvefi/curve-factory).

# Organization

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
    - The token’s transfer and transferFrom methods must revert upon failure.
    - Successful token transfers must move exactly the specified number of tokens between the sender and receiver. 
      Tokens that take a fee upon a successful transfer may cause the pool to break or act in unexpected ways.
    - Pools deployed by the factory cannot be paused or killed.
    - Pools deployed by the factory are not eligible for CRV rewards.

The factory can be used to deploy the following:

- plain pools
- metapools (paired against admin-approved base pools)
- gauges

# Base Pools

A metapool pairs a coin against the LP token of another pool. This other pool is referred to as the “base pool”. 
By using LP tokens, metapools allow swaps against any asset within their base pool, without diluting the base pool’s 
liquidity.

The factory allows deployment of metapools that use the following base pools:

- 3pool (USD denominated assets): [0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7](https://etherscan.io/address/0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7)
- sBTC (BTC denominated assets): [0x7fC77b5c7614E1533320Ea6DDc2Eb61fa00A9714](https://etherscan.io/address/0x7fC77b5c7614E1533320Ea6DDc2Eb61fa00A9714)

It is possible to enable additional base pools through a DAO vote.

# Choosing an Amplification Coefficient

The amplification coefficient (“A”) determines a pool’s tolerance for imbalance between the assets within it. 
A higher value means that trades will incur slippage sooner as the assets within the pool become imbalanced.

The appropriate value for A is dependent upon the type of coin being used within the pool. We recommend the following 
values:

- Uncollateralized algorithmic stablecoins: `5-10`
- Non-redeemable, collateralized assets: `100`
- Redeemable assets: `200-400`

It is possible to modify the amplification coefficient for a pool after it has been deployed. However, it requires a 
vote within the Curve DAO and must reach a 15% quorum.

# Trade Fees

Curve pools charge a fee for token exchanges and when adding or removing liquidity in an imbalanced manner. 
50% of the fees are given to liquidity providers, 50% are distributed to veCRV holders.

For factory pools, the size of the fee is set at deployment. The minimum fee is 0.04% (represented as `4000000`). 
The maximum fee is 1% (`100000000`). The fee cannot be changed after a pool has been deployed.