A Curve pool is essentially a smart contract that implements the StableSwap invariant, housing the logic for exchanging stable tokens. While all Curve pools share this core implementation, they come in various pool flavors.

In its simplest form, a Curve pool is an implementation of the StableSwap invariant involving two or more tokens, often referred to as a 'plain pool.' Alternatively, Curve offers more complex pool variants, including pools with rebasing tokens and metapools. Metapools, for instance, facilitate the exchange of one or more tokens with those from one or more underlying base pools.


New features: 

- price oracles based on the AMM State Price
- TVL oracle based on `D`
- dynamic fees
- [`exchange_received`](../pools/plainpool.md#exchange_received)
- [`get_dx`](../pools/plainpool.md#get_dx)


## **Supported Assets**

Stableswap-NG pools support three different asset types.

| Asset Type  | Description            |
| ----------- | ---------------------- |
| `0`         | **standard ERC20** token with no additional features |
| `1`         | **oracle** - token with rate oracle (e.g. wstETH) |
| `2`         | **rebasing** - token with rebase (e.g. stETH) |


*Consequently, supported tokens include:*

- ERC20 support for return True/revert, return True/False, return None
- ERC20 tokens can have arbitrary decimals (<=18)
- ERC20 tokens that rebase (either positive or fee on transfer)
- ERC20 tokens that have a rate oracle (e.g. wstETH, cbETH, sDAI, etc.) Oracle precision *must* be 10**18.



### **Rebasing Tokens**

Implementation for pools containing rebasing tokens.

!!!warning "Rebasing Tokens"
    Pools including rebasing tokens work a bit differently compared to others. 
    The internal `_balance()` function - which is used to calculate the coin balances within the pool - makes sure that **LP's keep all rebases**.

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


## **Dynamic Fees**

Stableswap-NG introduces dynamic fees based on the balances of the pools. This dynamic fee system ensures that fees are not static but adjust based on the relative balances of the tokens in the pool.

The internal `_dynamic_fee()` function calculates a fee based on the average balances of the tokens being exchanged. If the balances of the tokens being exchanged are highly imbalanced or significantly differ from an expected "peg," the fee may be adjusted using the `offpeg_fee_multiplier`.

The use of the `offpeg_fee_multiplier` allows the system to dynamically adjust fees based on the pool's state. For example, if the pool is off-peg, the fees are adjusted to incentivize or disincentivize certain trades. This mechanism helps maintain pool stability.


??? quote "`_dynamic_fee()`"

    ```python
    FEE_DENOMINATOR: constant(uint256) = 10 ** 10
    fee: public(uint256)  # fee * 1e10
    offpeg_fee_multiplier: public(uint256)  # * 1e10

    @view
    @internal
    def _dynamic_fee(xpi: uint256, xpj: uint256, _fee: uint256) -> uint256:

        _offpeg_fee_multiplier: uint256 = self.offpeg_fee_multiplier
        if _offpeg_fee_multiplier <= FEE_DENOMINATOR:
            return _fee

        xps2: uint256 = (xpi + xpj) ** 2
        return (
            (_offpeg_fee_multiplier * _fee) /
            ((_offpeg_fee_multiplier - FEE_DENOMINATOR) * 4 * xpi * xpj / xps2 + FEE_DENOMINATOR)
        )
    ```


## **Oracles**

The new generation (NG) of stableswap introduces oracles based on AMM State Prices. The Pool contract records exponential moving averages for coins 1, 2 and 3 relative to coin 0. 

Oracles are kept up when users perform a swap or liquidity is added or removed form the pool. Updating happens via the internal `upkeep_oracles()` function.

??? quote "`upkeep_oracles`"

    ```python
    @internal
    def upkeep_oracles(xp: DynArray[uint256, MAX_COINS], amp: uint256, D: uint256):
        """
        @notice Upkeeps price and D oracles.
        """
        ma_last_time_unpacked: uint256[2] = self.unpack_2(self.ma_last_time)
        last_prices_packed_current: DynArray[uint256, MAX_COINS] = self.last_prices_packed
        last_prices_packed_new: DynArray[uint256, MAX_COINS] = last_prices_packed_current

        spot_price: DynArray[uint256, MAX_COINS] = self._get_p(xp, amp, D)

        # -------------------------- Upkeep price oracle -------------------------

        for i in range(MAX_COINS):

            if i == N_COINS - 1:
                break

            if spot_price[i] != 0:

                # Upate packed prices -----------------
                last_prices_packed_new[i] = self.pack_2(
                    spot_price[i],
                    self._calc_moving_average(
                        last_prices_packed_current[i],
                        self.ma_exp_time,
                        ma_last_time_unpacked[0],  # index 0 is ma_exp_time for prices
                    )
                )

        self.last_prices_packed = last_prices_packed_new

        # ---------------------------- Upkeep D oracle ---------------------------

        last_D_packed_current: uint256 = self.last_D_packed
        self.last_D_packed = self.pack_2(
            D,
            self._calc_moving_average(
                last_D_packed_current,
                self.D_ma_time,
                ma_last_time_unpacked[1],  # index 1 is ma_exp_time for D
            )
        )

        # Housekeeping: Update ma_last_time for p and D oracles ------------------
        for i in range(2):
            if ma_last_time_unpacked[i] < block.timestamp:
                ma_last_time_unpacked[i] = block.timestamp

        self.ma_last_time = self.pack_2(ma_last_time_unpacked[0], ma_last_time_unpacked[1])
    ```
