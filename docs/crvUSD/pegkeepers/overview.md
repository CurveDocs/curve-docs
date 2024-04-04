<h1>PegKeepers: Stabilizing the crvUSD Peg</h1>

!!!github "GitHub"
    Source code of all PegKeepers can be found on [GitHub](https://github.com/curvefi/curve-stablecoin/tree/master/contracts/stabilizer).


# **General Concepts**

## **Stabilization Method**

PegKeepers are specialized contracts **designed to maintain the stability of the crvUSD peg**. They hold a pre-minted supply of crvUSD tokens to be utilized for peg stabilization efforts. The operation of PegKeepers is **restricted to only two actions: depositing and withdrawing from liquidity pools**. As long as these pre-minted crvUSD tokens are not deposited anywhere, they can and should be counted as out-of-circulation.

These contracts are each associated with a specific liquidity pool that includes crvUSD and another fiat-redeemable USD stablecoin.

The basic idea of PegKeepers revolves around monitoring the price of crvUSD and the balances of the linked pools and taking corresponding actions. When the **price of crvUSD exceeds 1.0**, indicating a deviation towards the upside, PegKeepers **deposit their crvUSD** into their linked pool and, in exchange, receive LP tokens. This action increases the crvUSD balance within the pool, thus exerting downward pressure on its price and aiding in peg stabilization.

Conversely, should the crvUSD **price drop below 1.0**, signaling a downward peg deviation, PegKeepers are **permitted to burn their LP tokens and withdraw crvUSD** from the pool to reduce the balance within it and push the price back towards parity. This withdrawal mechanism is contingent on the PegKeeper having previously deposited crvUSD into the pool, as the **contract must have LP tokens to burn in the process**.

Moreover, the **`update` function** that deposits and withdraws crvUSD is **callable by any EOA or smart contract**. To foster engagement, callers are rewarded with a caller share as an incentive.


## **Impact on crvUSD Interest Rate**

PegKeepers significantly influence the interest rate of crvUSD markets. The interest rate is affected by various factors, including the DebtFraction across all PegKeepers. A higher debt accumulated by PegKeepers[^1] increases the DebtFraction, which, in turn, leads to a lower interest rate.

[^1]: PegKeeper debt is accumulated by depositing into the linked liquidity pool. If the contract deposited 100 crvUSD, debt is equal to 100.

*The DebtFraction is defined as:*

$$\text{DebtFraction} = \frac{{\text{PegKeeperDebt}}}{{\text{TotalDebt}}}$$

For a comprehensive understanding of the factors influencing the interest rate, please refer to the [MonetaryPolicy](../monetarypolicy.md#interest-rate) section.


---


# **PegKeeperV1**

The initial version of `PegKeeper.vy` encountered two significant problems:

## **Spam Attack Issue**
A notable challenge in the first version of PegKeepers was its **susceptibility to spam attacks**.  
This issue stemmed from the ability of an attacker to manipulate the price of crvUSD very close to 1, followed by executing the `update` function to make a minimal deposit (or withdrawal), before moving the price back. With a mandatory **15-minute cooldown** before the `update` function could be called again, an attacker could exploit this interval to periodically disrupt the PegKeepers' capacity for peg stabilization.  
Although executing such an attack would entail **significant costs for the attacker**, resulting in **substantial revenue for the liquidity pool**, the potential for continuous exploitation was still present. This issue highlighted the need for a refined approach to prevent such manipulative activities and ensure the effective stabilization of the peg.


## **Depegging Scenario**
A more critical issue arose when a PegKeeper engaged in a deposit, essentially taking on debt by depositing crvUSD into the pool. If the coin paired with crvUSD in the pool experienced a **significant depeg**, the PegKeeper could find itself **unable to off-load its debt by withdrawing its crvUSD**. This situation would leave a quantity of unbacked crvUSD in circulation.

*These issues were addressed in the second version of the PegKeeper.*



---


# **PegKeeperV2 and PegKeeperRegulator**

!!!github "GitHub"
    Research regarding PegKeeperV2 can be found [here](https://github.com/curvefi/curve-stablecoin-researches/tree/main/peg_keeper). Source code of `PegKeeperV2` and `PegKeeperRegulator` [here](https://github.com/curvefi/curve-stablecoin/tree/master/contracts/stabilizer).

The transition to PegKeeperV2 marks a significant refinement in the system's architecture, introducing a **clear division of duties between two specialized contracts**. The **`PegKeeperV2`** contract is now **exclusively focused on carrying out the operational tasks** essential for maintaining the peg's stability, while the **`PegKeeperRegulator`** contract assumes a **pivotal role in oversight and regulation**.

Central to this new structure is the `PegKeeperRegulator.vy` contract, which grants the PegKeepers allowance to deposit or withdraw crvUSD based on different conditions. Additionally, the contract has the option to **pause and unpause the deposit and withdrawal actions** through its admin or emergency admin.

*Additionally, this version introduces robust solutions to previously identified issues, such as susceptibility to spam attacks and challenges in managing depeg situations:*


## **Mitigating Spam Attacks with Oracle Price Verification**

To address the spam attack issue in the first version of PegKeepers, an innovative solution involving the `price_oracle` and `get_p` function from stableswap pools was implemented. This approach allows the system to verify if the current AMM market prices significantly deviate from the pool's oracle's EMA price, thereby ensuring actions to stabilize the peg are only taken when the price is within an accepted deviation.

*The solution utilizes two prices from the pools:*

- `_p0` is represented by the `price_oracle` (EMA oracle).
- `_p1` by the `get_p` function representing the current price in the AMM.

A public variable, `price_deviation`, is introduced, which checks if the price is within the accepted range by employing an absolute error. Its value is upgradable, but can only be done by the admin of the Regulator contract.

```vyper
@internal
@view
def _price_in_range(_p0: uint256, _p1: uint256) -> bool:
    """
    @notice Checks if the price is within the accepted range, employing absolute error for spam-attack protection.
    @dev The formula used is: 0 < |p1 - p0| <= deviation * 2, where deviation is a predefined tolerance.
    """
    deviation: uint256 = self.price_deviation
    return unsafe_sub(unsafe_add(deviation, _p0), _p1) < deviation << 1
```

This function effectively measures if the current price (`_p1`) is within an acceptable range of the exponential moving average price (`_p0`), thereby deterring spam attacks by requiring prices to be reasonably aligned with the oracle's for updates to proceed. This mechanism prevents the attacker from being able to call the `update` function straight after manipulating the price close to one.

Further details on setting the price_deviation parameter can be found in the Curve Finance stablecoin research documentation: [Deviation Parameter Explanation](https://github.com/curvefi/curve-stablecoin-researches/tree/main/peg_keeper#deviation).



## **Mitigating Depeg Issue using Absolute Deviation Error**

In order to mitigate potential depged risk and therefore leaving the PegKeeper with debt, a `worst_price_threshold` variable was introduced.


```vyper
price: uint256 = max_value(uint256)  # Will fail if PegKeeper is not in self.price_pairs
largest_price: uint256 = 0
debt_ratios: DynArray[uint256, MAX_LEN] = []
for info in self.peg_keepers:
    price_oracle: uint256 = self._get_price_oracle(info)
    if info.peg_keeper.address == _pk:
        price = price_oracle
        if not self._price_in_range(price, self._get_price(info)):
            return 0
        continue
    elif largest_price < price_oracle:
        largest_price = price_oracle
    debt_ratios.append(self._get_ratio(info.peg_keeper))

if largest_price < unsafe_sub(price, self.worst_price_threshold):
    return 0
```

The code adeptly updates the `largest_price` variable to reflect the highest `price_oracle` value found across all PegKeeper pools, explicitly excluding the pool which is being deposited into.

The critical operation is the **comparison between `largest_price` and the result of `unsafe_sub(price, self.worst_price_threshold)`**. This comparison essentially evaluates the highest price of coins paired against crvUSD in auxiliary pools against the adjusted price of the coin paired against crvUSD in the intended liquidity pool, **after accounting for a predefined worst price threshold (`worst_price_threshold`)**.

If `largest_price` is found to be lower than the difference, it **indicates a potential depegging scenario**. In response, the Regulator contract **proactively blocks any further deposits** of crvUSD to preemptively address the depeg risk.

This safeguard acts as a bulwark against significant price divergences between the highest observed price (`largest_price`) and the target price, with the `worst_price_threshold` serving as a key variable in this evaluation. Failure to align with this safeguard (i.e., when `largest_price` significantly undercuts the threshold) triggers a halt in operations, as indicated by a return value of 0. Such a mechanism is vital for mitigating risks tied to price volatility, thereby ensuring the system's stability and preserving the integrity of pegged relationships.
