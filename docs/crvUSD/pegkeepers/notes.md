## notes


iterates thorugh all pegkeepers and safes their price_oracle
sets price == to the price oracle of the pegkeeper the function called

then checks a range of prices and if its true. input values are _p0 (price aka. price_oracle aka. the ema price oracle) and _p1 (current amm price). This checks if the price is in an accepted range using absolute error. returns a bool, if false, it returns 0. if true, it skips the rest of the code and continues with the next iteration. It only checks this range for the pegkeeper than is providing liquidity!

records the largest price (aka. price_oracle) of crvusd across all pools

appends all debt_ratios of the pegkeepers to a DynArray.

checks if the largest price is smaller than the difference of the price within the pool the pegkeeper adds crvusd to and the worst price threshold. if yes, it returns 0. what does this protect against?

finally, takes pegkeeper debt and total crvusd of the pegkeeper (debt + balanceOf) and calculates a maximum ratio using `_get_max_ratio`.





flow:


call update() -> check if allowed to provide or withdraw (`provide_allowed` or `withdraw_allowed`) in regulator contract.

if killed, the regulator prohibits the provision or withdrawl of crvusd to the pools. --> allowance is regulated in the `PegKeeperRegulator.vy`






highest value of `price_oracle` across all the stableswap pools, essentially the largest price.
price_oracle of what? crvusd or the other stablecoin? -> of the coin in stablecoin e.g. USDC/crvUSD


largest price accross all pools (except the one we provide for) < (`price_oracle` of the pool we add - worst_price_threshold).

`largest_price` = highest price (`price_oracle`) of the coins (NOT CRVUSD).

say, 1.02

price = 1.01
worst_price_threshold = 0.0003



The individual debt ratios of pegkeepers are stored in a `debt_ratios` list in `_provide` function hold the debt ratios of the pegkeepers calculated as followed:

$$\frac{\text{debt} * 10^{18}}{(1 + \text{debt} + \text{crvusd_balance_of_pegkeeper})}$$


*`_get_max_ratio` takes the entire `debt_ratios` list as input and calculated a maximum ratio based on the values as follows:*`

$$\text{maxRatio} = \frac{(\text{alpha} + \text{beta} * \frac{\text{rsum}}{10^{18}})^2}{10^{18}}$$
