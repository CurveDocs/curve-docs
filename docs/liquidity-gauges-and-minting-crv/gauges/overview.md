<h1>Liquidity Gauges</h1>

CRV inflation is directed to users who provide liquidity within the protocol, measured by "Liquidity Gauge" contracts. Each pool has its own liquidity gauge, maintained by the Gauge Controller, which lists gauges and their types along with the weights of each. These gauges not only measure the liquidity provided by users, distributing rewards based on each user's share of liquidity and [boost](#boosting-your-lp-tokens), but can also be implemented for a variety of use cases including liquidity pools, lending vaults, and even [fundraising gauges](https://github.com/vefunder/crvfunder). For more details on implementation, see [here](../overview.md#liquidity-gauges).


!!!github "GitHub"
    There are several versions of liquidity gauge contracts in use. Source code for all the liquidity gauges can be found on [:material-github: GitHub](https://github.com/curvefi/curve-dao-contracts/tree/master/contracts/gauges).

    Easiest way to obtain the gauge address of a liquidity pool is by querying [`get_gauge`](../../integration/metaregistry.md#get_gauge) on the [MetaRegistry](../../integration/metaregistry.md).


---


*Liquidity gauges have two types of rewards:*

## **Rewards**

### CRV Emissions

Curve operates such that veCRV holders can decide where future CRV emissions are directed to. Typically, these emissions are allocated to a liquidity gauge. However, before gauges are eligible to receive CRV emissions, they must be added to the `GaugeController.vy` contract. This addition requires a successfully passed DAO vote. Once added, the gauge becomes eligible for gauge weight voting. When a gauge receives gauge weight through user votes, it starts to receive CRV emissions. Changes in weight take effect every Thursday at 00:00 UTC. 

Gauges contain logic that enables users to boost their provided liquidity up to 2.5x by locking CRV for veCRV.


### Permissionless Rewards

Besides CRV emissions, there is also the possibility to add "external (also called permissionless) rewards" to the gauge. More on this [here](../gauges/LiquidityGaugeV6.md#permissionless-rewards).

Unlike native CRV rewards, these kinds of rewards cannot be boosted.



---


## **Versions**

Over time, several improvements and enhancements were made to the liquidity gauges. This documentation will mainly cover the most recent one, `LiquidityGaugeV6`. Source code for all other gauges can be found on [:material-github: GitHub](https://github.com/curvefi/curve-dao-contracts/tree/master/contracts/gauges). 


---


## **How to Deploy a Gauge**

Liquidity gauges for liquidity pools can be deployed using the Factory contract. The Factory contract, which initially deployed the liquidity pool, utilizes the `deploy_gauge` function for this purpose.


### `deploy_gauge`
!!! description "`Factory.deploy_gauge(_pool: address) -> address`"

    Function to deploy a liquidity gauge for `_pool`.

    Returns: deployed gauge (`address`).

    ??? quote "Source code"

        === "Factory.vy"

            ```python
            event LiquidityGaugeDeployed:
                pool: address
                gauge: address

            @external
            def deploy_gauge(_pool: address) -> address:
                """
                @notice Deploy a liquidity gauge for a factory pool
                @param _pool Factory pool address to deploy a gauge for
                @return Address of the deployed gauge
                """
                assert self.pool_data[_pool].coins[0] != empty(address), "Unknown pool"
                assert self.pool_data[_pool].liquidity_gauge == empty(address), "Gauge already deployed"
                assert self.gauge_implementation != empty(address), "Gauge implementation not set"

                gauge: address = create_from_blueprint(self.gauge_implementation, _pool, code_offset=3)
                self.pool_data[_pool].liquidity_gauge = gauge

                log LiquidityGaugeDeployed(_pool, gauge)
                return gauge
            ```

    === "Example"
        ```shell
        >>> Factory.deploy_gauge("0x5f0985a8aad85e82fd592a23cc0501e4345fb18c")
        '0x2a1a064348b1ad9ca8b983016606ea84eca8c620'
        ```


---


## **Adding a Gauge to the `GaugeController`**

To make a liquidity gauge eligible to receive CRV emissions, it needs to be added to the `GaugeController.vy` contract. This is accomplished through an on-chain vote in which veCRV holders vote on.

The on-chain vote can be created using the classic Curve UI: https://classic.curve.finance/factory/create_gauge.
