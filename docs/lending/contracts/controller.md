<h1>Curve Lending: Controller</h1>

The idea is to only have one Controller implementation - no matter if it is a lending market or an actual market to mint crvUSD. Due to that, **some changes have been made within the Controller.vy contract**:

- Allows tokens with **arbitrary decimals** rather than just tokens with 18 decimals.
- Multiple changes to ensure rounding **always rounds up in favor of the borrower**.
- `collect_fees` will revert because there is no `fee_receiver` in the Lending Factories. This is okay as there are no admin fees, all fees go to lenders.
- Now has `collateral_token` and `borrowed_token`, instead of only `collateral_token` and `STABLECOIN`, as it is also possible to borrow tokens other than crvUSD.
- **Native ETH transfers have been disabled**.

---

**Conclusion:** There have been some under-the-hood changes to the Controller.vy implementation to make sure it works both for lending and minting markets. **For a user, functions for e.g. creating loans, adding collateral, or repaying work the same as in all the other Controllers.**

For now, **for full documentation of those functions**, please refer [**here**](../../crvUSD/controller.md) or check out the **source code on [GitHub](https://github.com/curvefi/curve-stablecoin/blob/lending/contracts/Controller.vy)**.
