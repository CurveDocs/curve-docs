`LiquidityGaugeV3` retains a majority of `LiquidityGaugeV2’s` functionality such as tokenized deposits, and flexible onward staking with up to 8 reward tokens with some modifications.

### Outline of modified functionality:

1.  Ability to redirect claimed rewards to an alternative account.  
2. Opt-in claiming of rewards on interactions with the gauge, instead of auto-claiming.
3. Retrieving rewards from the reward contract happens at a minimum of once an hour, for reduced gas costs.
4. Expose the amount of claimed and claimable rewards for users.
5. Removal of `claim_historic_rewards` function.
6. Modify `claimable_reward` to be a slightly less accurate view function.
7. Reward tokens can no longer be removed once set, adding more tokens requires providing the array of reward_tokens with any new tokens appended.
8. `deposit(_value, _to)` and `withdraw(_value, _to)` functions have an additional optional argument `_claim_rewards`, which when set to `True` will claim any pending rewards.

As this gauge maintains a similar API to `LiquidityGaugeV2`, the documentation only covers functions that were added or modified since the previous version.

