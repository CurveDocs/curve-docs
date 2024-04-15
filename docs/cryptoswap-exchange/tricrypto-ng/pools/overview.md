---
hide:
  - toc
---

<h1>Tricrypto-NG Overview</h1>


Tricrypto-NG was designed as an **optimised version of Curve Finance's original three-coin volatile assets pools**. 


!!!deploy "Contract Source & Deployment"
    Source code is available on [Github](https://github.com/curvefi/tricrypto-ng). 
    
    A full list of all deployments can be found [here](../../references/deployed-contracts.md#tricrypto-ng).


---


**The AMM infrastructure involves the following parts:**

<div class="grid cards" markdown>

-   :octicons-code-16: **`AMM blueprint contracts`** 

    ---

    The `AMM` is a **3-coin, auto-rebalancing Cryptoswap implementation**. The contract is version 2.0.0, with several optimizations that make the contract cheaper for the end user.
    Also, unlike the older version, the **pool contract is an ERC20-compliant LP token** as well. 
    
    There are two different implementations, one with **native transfers enabled** and the other with native transfers **disabled**.

-   :octicons-code-16: **`Factory`**

    ---

    The Factory allows the permissionless deployment of liquidity pools. It can accommodate **multiple blueprints of the AMM** contract (deployed on-chain). These blueprints are specified by the user while deploying the pool. Similarly, liquidity gauges for pools can be deployed through the factory contract, utilizing the liquidity gauge blueprint contract.

-   :octicons-code-16: **`Views Contract`**

    ---

    The Views contract contains **view methods relevant for integrators** and users looking to interact with the AMMs. Unlike the older tricrypto contracts, the address of the deployed Views contract is stored in the Factory: users are advised to query the stored views contract since it is upgradeable by the Factory's admin.

-   :octicons-code-16: **`Math Contract`**

    ---

    A contract which contains different **math functions used in the AMM**.

-   :octicons-code-16: **`Liquidity Gauge blueprint contract`**

    ---

    A liquidity gauge blueprint contract which deploys a liquidiy gauge of a pool on Ethereum. Gauges on sidechains, needs to be deployed via the [RootChainGaugeFactory](./../../curve_dao/liquidity-gauge-and-minting-crv/evm-sidechains/RootChainGaugeFactory.md). 

</div>