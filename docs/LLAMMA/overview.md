Curve Stablecoin ([crvUSD](../LLAMMA/crvUSD.md)) infrastructure enables users to mint crvUSD using a selection of crypto-tokenized collaterals (adding new ones are subject to DAO approval). 

crvUSD is designed to provide a more capital-efficient stablecoin mechanism and smoother liquidations, while maintaining a decentralized design which is governed by the Curve DAO.

<figure markdown>
  ![](../images/figure1_crvusdx.png){ width="300" }
  <figcaption></figcaption>
</figure>


# **Components of the Curve Stablecoin Infrastructure**

## *[Controller](../LLAMMA/controller.md)*
The Controller is the contract the user interacts with to create a loan and further mangage the position. It holds all user debt information. External liquidations are also done through it.

## *[LLAMMA](../LLAMMA/amm.md)*
LLAMMA is the market-making contract that rebalances the collateral. As the name already suggests, this contract is responsible for lending and liquidating collateral. Every market has its own AMM (created from a blueprint contract), which contains the collateral asset and crvUSD.

## *[Factory](../LLAMMA/factory.md)*
The use for the factory contract is to add new markets, raise or lower debt ceilings of already existing markets, set blueprint contracts for AMM and Controller, and set fee receivers.

## *[MonetaryPolicy](../LLAMMA/monetarypolicy.md)*
Monetary policy contracts are integrated into the crvUSD system and are responsible for the interest rate of crvUSD markets.

## *[PegKeepers](../LLAMMA/pegkeeper.md)*
PegKeepers are contracts that help stabilize the peg of crvUSD. They are allocated a specific amount of crvUSD to use in securing the peg. 

## *[PriceAggregator](../LLAMMA/priceaggregator.md)*
The AggregatorStablePrice contract is designed to aggregate the prices of crvUSD based on multiple Curve Stableswap pools. This price is mainly used as an oracle for the calculation of the interest rate, providing an aggregated and an exponential moving average price.

## *[Oracles](../LLAMMA/oracle.md)*
coming soon...