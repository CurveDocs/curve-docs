---
search:
  exclude: true
---

<h1>Curve DAO: Fee Collection and Distribution</h1>

!!!danger "PARTLY OUTDATED: New Fee Collection, Burn, and Distribution System"
    In June 2024, Curve deployed a new system to collect, burn, and distribute fees in a much more efficient manner. For full documentation of this system, please read here: [Fee Collection & Distribution](./curve-burner/overview.md).


Curve exchange contracts have the capability to charge an **admin fee**, claimable by the contract owner. The admin fee is represented as a percentage of the total fee collected on a swap.

**There are multiple ways on how fees are obtained:**

- For **stableswap exchanges** the **fee is taken in the output token** of the swap and calculated against the final amount received. For example, if swapping from USDT to USDC, the fee is taken in USDC.  
- For **cryptoswap exchanges** the **fee is taken in the LP token of the pool**. For these kind of pools additional mechanisms like auto-rebalancing parameters need to be taken into consideration.  
- **Curve Stablecoin** borrow **fee is taken in crvUSD**. 100% of crvUSD borrow rate fees are "admin fees".

Liquidity providers also incur fees when adding or removing liquidity. The fee is applied such that, for example, a swap between USDC and USDT would pay roughly the same amount of fees as depositing USDC into the pool and then withdrawing USDT. The only case where a fee is not applied on withdrawal is when removing liquidity, as this does not change the imbalance of the pool in any way.

Exchange contracts are indirectly owned by the Curve DAO via a proxy ownership contract. This contract includes functionality to withdraw the fees, convert them to 3CRV, and forward them into the fee distributor contract. Collectively, this process is referred to as “burning”.


!!! info
    The burn process involves multiple transactions and is very gas intensive. Anyone can execute any step of the burn process at any time and there is no hard requirement that it happens in the correct order. However, running the steps out of order can be highly inefficient. If you wish to burn, it is recommended that you review all of the following information so you understand exactly what is happening.

