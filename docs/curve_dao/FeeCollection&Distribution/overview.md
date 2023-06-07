# **Curve DAO: Fee Collection and Distribution**

Curve exchange contracts have the capability to charge an **admin fee**, claimable by the contract owner. The admin fee is represented as a percentage of the total fee collected on a swap.

For exchanges the fee is taken in the output currency and calculated against the final amount received. For example, if swapping from USDT to USDC, the fee is taken in USDC.

Liquidity providers also incur fees when adding or removing liquidity. The fee is applied such that, for example, a swap between USDC and USDT would pay roughly the same amount of fees as depositing USDC into the pool and then withdrawing USDT. The only case where a fee is not applied on withdrawal is when removing liquidity via `remove_liquidity`, as this method does not change the imbalance of the pool in any way.

Exchange contracts are indirectly owned by the Curve DAO via a proxy ownership contract. This contract includes functionality to withdraw the fees, convert them to 3CRV, and forward them into the fee distributor contract. Collectively, this process is referred to as “burning”.


!!!note
    The burn process involves multiple transactions and is very gas intensive. Anyone can execute any step of the burn process at any time and there is no hard requirement that it happens in the correct order. However, running the steps out of order can be highly inefficient. If you wish to burn, it is recommended that you review all of the following information so you understand exactly what is happening.

