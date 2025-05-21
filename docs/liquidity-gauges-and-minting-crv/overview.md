<h1>Curve DAO: Liquidity Gauges and Minting CRV</h1>

Curve is built in a way to incentivize liquidity providers with CRV, the protocols governance token. The protocol works in a way that it directs the inflation of the CRV token to the liquidity providers based on the votes of the veCRV holders. This is done through a system of gauges, the `GaugeController` contract, and the `Minter` contract.

Users who have veCRV, Curve's voting-escrowed token, can vote on DAO-approved gauges to receive CRV emissions.

---

# **Smart Contracts**

Allocation, distribution and minting of CRV are managed via several related DAO contracts:

<div class="grid cards" markdown>

-   :logos-vyper: **GaugeController**

    ---

    Central controller that maintains a list of gauges, weights and type weights, and coordinates the rate of CRV production for each liquidity gauge

    [:octicons-arrow-right-24: `GaugeController.vy`](./gauge-controller/GaugeController.md)

-   :logos-vyper: **Minter**

    ---

    CRV minting contract, generates new CRV according to liquidity gauges

    [:octicons-arrow-right-24: `Minter.vy`](./minter/Minter.md)

-   :logos-vyper: **Liquidity Gauges**

    ---

    Measures liquidity provided by users over time, in order to distribute CRV and other rewards

    [:octicons-arrow-right-24: `LiquidityGauge.vy`](./gauges/LiquidityGaugeV6.md)

-   **Liquidity Gauges on EVM Sidechains**

    ---

    Liquidity gauges on EVM sidechains use a system of Root and Child Liquidity Gauges which allows gauges on sidechains to receive CRV emissions.

    [:octicons-arrow-right-24: `Getting started`](./xchain-gauges/overview.md)

</div>

---

# **Implementation Details**

## CRV Inflation
CRV follows a piecewise linear inflation schedule. The inflation is reduced by around 15.9% each year. Each time the inflation reduces, a new mining epoch starts.

<figure markdown>
  ![](https://curve.readthedocs.io/_images/inflation.svg){ width="500" }
  <figcaption></figcaption>
</figure>

The initial supply of CRV is 1.273 billion tokens, which is 42% of the eventual t -> $\infty$ supply of $\approx$ 3.03 billion tokens. All of these initial tokens are gradually vested (with every block). The initial inflation rate which supports the above inflation schedule is $r = 22.0$% (279.6 millions per year).
All of the inflation is distributed to Curve liquidity providers, according to measurements taken by the gauges. During the first year, the approximate inflow into circulating supply is 2 million CRV per day. The initial circulating supply is 0.

---

## Liquidity Gauges
Inflation is directed to users who provide liquidity within the protocol. This usage is measured via “Liquidity Gauge” contracts. Each pool has an individual liquidity gauge. The Gauge Controller maintains a list of gauges and their types, with the weights of each gauge and type.

To measure liquidity over time, the user deposits their LP tokens into the liquidity gauge. Coin rates which the gauge is getting depends on current inflation rate, gauge weight, and gauge type weights. Each user receives a share of newly minted CRV proportional to the amount of LP tokens locked. Additionally, rewards may be boosted by up to factor of 2.5 if the user vote-locks tokens for Curve governance in the Voting Escrow contract.

Suppose we have the inflation rate $r$ changing with every epoch (1 year), gauge weight $w_{g}$ and gauge type weight $w_{t}$. Then, all the gauge handles the stream of inflation with the rate $r' = w_{g}w_{t}r$ which it can update every time $w_{g}$, $w_{t}$ or mining epoch changes.

To calculate a user’s share of $r'$, we must calculate the integral:
$I_{u} = \int \frac{r'(t)b_{u}(t)}{S(t)}dt,$ where $b_{u}(t)$ is the balance supplied by the user (measured in LP tokens) and $S(t)$ is total liquidity supplied by users, depending on the time $t$; the value $I_{u}$ gives the amount of tokens which the user has to have minted to them. The user’s balance $b_{u}$ changes every time the user $u$ makes a deposit or withdrawal, and $S$ changes every time _any_ user makes a deposit or withdrawal so $S$ can change many times in between two events for the user $u''$. In the liquidity gauge contract, the value of $I_{u}$ is recorded per-user in the public `integrate_fraction` mapping.

To avoid requiring that all users to checkpoint periodically, we keep recording values of the following integral (named `integrate_inv_supply` in the contract):

$$I_{is}(t) = \int_0^t \frac{r'(t)}{S(t)}dt$$

The value of $I_{is}$ is recorded at any point any user deposits or withdraws, as well as every time the rate $r$ changes (either due to weight change or change of mining epoch).

When a user deposits or withdraws, the change in $I_{u}$ can be calculated as the current (before user’s action) value of $I_{is}$ multiplied by the pre-action user’s balance, and summed up across the user’s balances: $I_{u}(t_{k}) = \sum_{k} b_{u}(t_{k})[I_{is}(t_{k})-I_{is}(t_{k-1})]$. The per-user integral is possible to replace with this sum because $b_{u}(t)$ changed for all times between $t_{k-1}$ and $t_{k}$.

---

## Boosting
In order to incentivize users to participate in governance, and additionally create stickiness for liquidity, we implement the following mechanism. A user’s balance, counted in the liquidity gauge, gets boosted by users locking CRV tokens in Voting Escrow contract, depending on their vote weight $w_{i}:b_{u}^* = min(0.4b_{u}+0.6S\frac{w_{i}}W, b_{u})$.
The value of $w_{i}$ is taken at the time the user performs any action (deposit, withdrawal, withdrawal of minted CRV tokens) and is applied until the next action this user performs.

If no users vote-lock any CRV (or simply don’t have any), the inflation will simply be distributed proportionally to the liquidity $b_{u}$ each one of them provided. However, if a user stakes enough CRV, they are able to boost their stream of CRV by up to factor of 2.5 (reducing it slightly for all users who are not doing that).

Implementation details are such that a user gets the boost at the time of the last action or checkpoint. Since the voting power decreases with time, it is favorable for users to apply a boost and do no further actions until they vote-lock more tokens. However, once the vote-lock expires, everyone can “kick” the user by creating a checkpoint for that user and, essentially, resetting the user to no boost if they have no voting power at that point already.

Finally, the gauge is supposed to not miss a full year of inflation (e.g. if there were no interactions with the gauge for the full year). If that ever happens, the abandoned gauge gets less CRV.

---

## Gauge Weight Voting
Users can allocate their veCRV towards one or more liquidity gauges. Gauges receive a fraction of newly minted CRV tokens proportional to how much veCRV the gauge is allocated. Each user with a veCRV balance can change their preference at any time.

When a user applies a new weight vote, it gets applied at the start of the next epoch week. The weight vote for any one gauge cannot be changed more often than once in 10 days. Adding more CRV to your lock or extending the lock time increases your veCRV balance. This increase is not automatically accounted for in your current gauge weight votes. If you want to allocate all of your newly acquired voting power, make sure to re-vote.

!!!warning
    Resetting your gauge weight before re-voting means you'll need to wait 10 days to vote for the gauges whose weight you've reset. So, please ensure you simply re-vote; there is no need to reset your gauge weight votes before voting again.

---

## GaugeController
The Gauge Controller maintains a list of gauges and their types, with the weights of each gauge and type. In order to implement weight voting, `GaugeController` has to include parameters handling linear character of voting power each user has.

`GaugeController` records points (bias + slope) per gauge in `vote_points`, and *scheduled* changes in biases and slopes for those points in `vote_bias_changes` and `vote_slope_changes`. New changes are applied at the start of each epoch week.

Per-user, per-gauge slopes are stored in `vote_user_slopes`, along with the power the user has used and the time their vote-lock ends.

The totals for slopes and biases for vote weight per gauge, and sums of those per type, are scheduled / recorded for the next week, as well as the points when voting power gets to 0 at lock expiration for some of users.

When a user changes their gauge weight vote, the change is scheduled for the next epoch week, not immediately. This reduces the number of reads from storage which must to be performed by each user: it is proportional to the number of weeks since the last change rather than the number of interactions from other users.
