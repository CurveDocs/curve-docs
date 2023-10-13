questions: 
- stored rates (stored_rates)

todo:
- add overview of pools with basic info



Stableswap-NG is a improved version of the stableswap pools.

## **Changes**

Most important changes:

- dynamic fee based on pool balances
- price oracles




## **Rebasing Tokens**

Balances of the pool are calculated via the internal `_balances()` function. It is important to note that pools behave a bit differently when pools include a rebasing token. To check wheter a pool contains a rebasing token, check the [`POOLS_IS_REBASING_IMPLEMENTATION`](../pools/plainpool.md#pool_is_rebasing_implementation) variable.

The function makes sure that **LP's keep all rebases**.

??? quote "`_balances`"

    ```python
    @view
    @internal
    def _balances() -> DynArray[uint256, MAX_COINS]:
        """
        @notice Calculates the pool's balances _excluding_ the admin's balances.
        @dev If the pool contains rebasing tokens, this method ensures LPs keep all
                rebases and admin only claims swap fees. This also means that, since
                admin's balances are stored in an array and not inferred from read balances,
                the fees in the rebasing token that the admin collects is immune to
                slashing events.
        """
        result: DynArray[uint256, MAX_COINS] = empty(DynArray[uint256, MAX_COINS])
        balances_i: uint256 = 0

        for i in range(MAX_COINS_128):

            if i == N_COINS_128:
                break

            if POOL_IS_REBASING_IMPLEMENTATION:
                balances_i = ERC20(coins[i]).balanceOf(self) - self.admin_balances[i]
            else:
                balances_i = self.stored_balances[i] - self.admin_balances[i]

            result.append(balances_i)

        return result
    ```
