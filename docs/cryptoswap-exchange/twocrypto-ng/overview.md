---
hide:
  - toc
---

The **Twocrypto-NG contract infrastructure** represents an **optimized version of Curve Finance Crypto pools**.

!!!deploy "Contract Source & Deployment"
    Source code is available on [GitHub](https://github.com/curvefi/twocrypto-ng).


---


**The AMM infrastructure involves the following parts:**

<div class="grid cards" markdown>

-   :octicons-code-16: **`AMM blueprint contracts`**

    ---

    The **`AMM`** is a **2-coin, auto-rebalancing Cryptoswap implementation**. The contract is version 2.0.0, with several optimizations that make the contract more cost-effective for the end user. Additionally, unlike the older version, the pool contract is an ERC20-compliant LP token.

    Also, unlike the older version, the **pool contract is an ERC20-compliant LP token** as well.

    The AMMs have a hardcoded `ADMIN_FEE`, set to 50% of the earned profits.

-   :octicons-code-16: **`Factory`**

    ---

    The Factory allows the permissionless deployment of liquidity pools. It can accommodate **multiple blueprints of the AMM** contract (deployed on-chain). These blueprints are specified by the user while deploying the pool. Similarly, liquidity gauges for pools can be deployed through the factory contract, utilizing the liquidity gauge blueprint contract.

    The admin of the contract can also implement parameter changes to the AMMs, change the fee recipient, and upgrade or add blueprint implementations stored in the Factory.

-   :octicons-code-16: **`Views Contract`**

    ---

    The Views contract contains **view methods relevant for integrators** and users looking to interact with the AMMs. Unlike the older Tricrypto contracts, the address of the deployed Views contract is stored in the Factory: users are advised to query the stored views contract since it is upgradeable by the Factory's admin.

-   :octicons-code-16: **`Math Contract`**

    ---

    A contract which contains different **math functions used in the AMM**.

-   :octicons-code-16: **`Liquidity Gauge blueprint contract`**

    ---

    A liquidity gauge blueprint contract which deploys a liquidity gauge of a pool on Ethereum.

    Even though Factories on sidechains and L2s also have a gauge blueprint implementation variable, this one is set to `ZERO_ADDRESS` as those gauges work a bit differently than the gauge on the Ethereum mainnet. On sidechains, gauges need to be deployed via the [`RootChainGaugeFactory`](../../liquidity-gauges-and-minting-crv/xchain-gauges/RootGaugeFactory.md).

</div>
