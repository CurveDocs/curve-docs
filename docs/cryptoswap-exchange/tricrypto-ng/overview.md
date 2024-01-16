---
hide:
  - toc
---

The Tricrypto-NG contract infrastructure represents an **optimised version of Curve Finance [Tricrypto pool](https://etherscan.io/address/0xd51a44d3fae010294c616388b506acda1bfaae46)**.


!!!deploy "Contract Source & Deployment"
    Source code available on [Github](https://github.com/curvefi/tricrypto-ng).


**The AMM infrastructure involves the following parts:**

- AMM blueprint contract (includes LP-Token)
- Liquidity Gauge blueprint contract
- Maths Contract
- Views Contract
- Factory


The **`Factory`** can accommodate **multiple blueprints of the AMM** contract (deployed on-chain). These blueprints are then specified by the user while deploying the pool. Similarly, liquidity gauges can be deployed through the factory contract as well for a specific pool, through liquidity gauge blueprint contracts.

The **`AMM`** is a **3-coin, auto-rebalancing Cryptoswap implementation**. The contract is version 2.0.0, with several optimizations that make the contract cheaper for the end user. Also, unlike the older version, the pool contract is an ERC20-compliant LP token as well.

The **`Math contract`** contains the different **math functions used in the AMM**.

The **`Views contract`** contains view methods relevant for integrators and users looking to interact with the AMMs. Unlike the older tricrypto contracts, the address of the deployed Views contract is stored in the Factory: users are advised to query the stored views contract since it is upgradeable by the Factory's admin.

The Factory AMMs have a **hardcoded `ADMIN_FEE`**, set to 50% of the earned profits. Factory admins can also implement parameter changes to the AMMs, change the fee recipient, upgrade/add blueprint contract addresses stored in the factory. Unlike the original tricrypto contracts, **Factory tricrypto contracts cannot be 'killed'** by the admin.

!!!info
    In case of any issues that result in a borked AMM state, users can safely withdraw liquidity using **`remove_liquidity`** at balances proportional to the AMM balances.

