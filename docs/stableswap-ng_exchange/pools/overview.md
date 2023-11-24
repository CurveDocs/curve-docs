A Curve pool is essentially a smart contract that implements the StableSwap invariant, housing the logic for exchanging stable tokens. While all Curve pools share this core implementation, they come in various pool flavors.

In its simplest form, a Curve pool is an implementation of the StableSwap invariant involving two or more tokens, often referred to as a 'plain pool.' Alternatively, Curve offers more complex pool variants, including pools with rebasing tokens and metapools. Metapools facilitate the exchange of one or more tokens with those from one or more underlying tokens.


**New features:**   

- price and D oracles
- dynamic fees
- [`exchange_received`](../pools/plainpool.md#exchange_received)
- [`get_dx`](../pools/plainpool.md#get_dx)


## **Supported Assets**

Stableswap-NG pools supports the following asset types:

| Asset Type  | Description            |
| ----------- | ---------------------- |
| `0`         | **Standard ERC20** token with no additional features |
| `1`         | **Oracle** - token with rate oracle (e.g. wstETH) |
| `2`         | **Rebasing** - token with rebase (e.g. stETH) |
| `3`         | **ERC4626** - token with *`convertToAssets`* method (e.g. sDAI) |


*Consequently, supported tokens include:*

- ERC20 support for return True/revert, return True/False, return None  
- ERC20 tokens can have arbitrary decimals (<=18)  
- ERC20 tokens that rebase (either positive or fee on transfer)  
- ERC20 tokens that have a rate oracle (e.g. wstETH, cbETH, sDAI, etc.) Oracle precision *must* be 10^18  
- ERC4626 tokens with arbitrary percision (<=18) of Vault token and underlying asset


### **Rebasing Tokens**

!!!warning "Rebasing Tokens"
    Pools including rebasing tokens work a bit differently compared to others. 
    The internal `**_balance()**` function - which is used to calculate the coin balances within the pool - makes sure that **LP's keep all rebases**.

??? quote "`_balances`"

    ```vyper
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

            if 2 in asset_types:
                balances_i = ERC20(coins[i]).balanceOf(self) - self.admin_balances[i]
            else:
                balances_i = self.stored_balances[i] - self.admin_balances[i]

            result.append(balances_i)

        return result
    ```


## **Dynamic Fees**

Stableswap-NG introduces dynamic fees. The use of the **`offpeg_fee_multiplier`** allows the system to dynamically adjust fees based on the pool's state. 

The internal **`_dynamic_fee()`** function calculates the fee **based on the balances and rates** of the tokens being exchanged. If the balances of the tokens being exchanged are highly imbalanced or significantly differ from its peg, the fee is adjusted using the **`offpeg_fee_multiplier`**.


### **Dynamic Fee Formula**

!!!bug
    If the formulas below do not render, please make sure to refresh the site. A solution is being worked on.

*Let's define some terms and variables for clarity:*

- Let $fee$ represent the fee, as retrieved by the method **`StableSwap.fee()`**
- Let $fee_m$ denote the off-peg fee multiplier, sourced from **`StableSwap.offpeg_fee_multiplier()`**
- **`FEE_DENOMINATOR`** is a constant with a value of $10^{10}$, representing the precision of the fee
- The terms $rate_{i}$ and $balance{i}$ refer to the specific rate and balance for coin $i$, respectively, and similarly, $rate_j$ and $balance_j$ for coin $j$ 
- $PRECISION_{i}$ and $PRECISION_{j}$ are the precision constants for the respective coins

*Given these, we define:*

$xp_{i} = \frac{{rate_{i} \times balance_{i}}}{{PRECISION_{i}}}$

$xp_{j} = \frac{{rate_{j} \times balance_{j}}}{{PRECISION_{j}}}$

*And we also have:*

$xps2 = (xp_{i} + xp_{j})^2$

**The dynamic fee is calculated by the following formula:**

$$\text{dynamic fee} = \frac{{fee_{m} \times fee}}{\frac{(fee_{m} - 10^{10}) \times 4 \times xp_{i} \times xp_{j}}{xps2}+ 10^{10}}$$


??? quote "`Dynamic Fee`"

    ```vyper
    A_PRECISION: constant(uint256) = 100
    MAX_COINS: constant(uint256) = 8
    PRECISION: constant(uint256) = 10 ** 18
    FEE_DENOMINATOR: constant(uint256) = 10 ** 10

    @view
    @external
    def dynamic_fee(i: int128, j: int128, pool:address) -> uint256:
        """
        @notice Return the fee for swapping between `i` and `j`
        @param i Index value for the coin to send
        @param j Index value of the coin to recieve
        @return Swap fee expressed as an integer with 1e10 precision
        """
        N_COINS: uint256 = StableSwapNG(pool).N_COINS()
        fee: uint256 = StableSwapNG(pool).fee()
        fee_multiplier: uint256 = StableSwapNG(pool).offpeg_fee_multiplier()

        rates: DynArray[uint256, MAX_COINS] = empty(DynArray[uint256, MAX_COINS])
        balances: DynArray[uint256, MAX_COINS] = empty(DynArray[uint256, MAX_COINS])
        xp: DynArray[uint256, MAX_COINS] = empty(DynArray[uint256, MAX_COINS])
        rates, balances, xp = self._get_rates_balances_xp(pool, N_COINS)

        return self._dynamic_fee(xp[i], xp[j], fee, fee_multiplier)

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

    @view
    @internal
    def _get_rates_balances_xp(pool: address, N_COINS: uint256) -> (
        DynArray[uint256, MAX_COINS],
        DynArray[uint256, MAX_COINS],
        DynArray[uint256, MAX_COINS],
    ):

        rates: DynArray[uint256, MAX_COINS] = StableSwapNG(pool).stored_rates()
        balances: DynArray[uint256, MAX_COINS] = StableSwapNG(pool).get_balances()
        xp: DynArray[uint256, MAX_COINS] = empty(DynArray[uint256, MAX_COINS])
        for idx in range(MAX_COINS):
            if idx == N_COINS:
                break
            xp.append(rates[idx] * balances[idx] / PRECISION)

        return rates, balances, xp
    ```

### **Interactive Graph**

The embedded graph has limited features, such as the inability to modify the axis. However, by clicking the *"edit graph on desmos"* button at the bottom right, one is redirected to the main Desmos site. There, a wider range of functionalities is available, allowing for further adjustments and detailed exploration of the graph.

<div style="text-align: center;">
    <iframe src="https://www.desmos.com/calculator/bzxmwlxpfy?embed" width="500" height="500" style="border: 3px solid #ccc; display: inline-block;" frameborder=0></iframe>
</div>



## **Oracles**

The new generation (NG) of stableswap introduces oracles based on AMM State Prices and the invariant D.

- **price oracle** (spot and ema price)
- moving average **D oracle**

Oracles are updated when users perform a swap or when liquidity is added or removed from the pool. Most updates are carried out by the internal **`upkeep_oracles()`** function, which is called in those instances. In some cases, such as when removing liquidity in a balanced ratio, the **`D`** oracle is updated directly within the **`remove_liquidity()`** function, as there is no need to update the price oracles (removing balanced does not have a price impact).

!!!danger "Oracle Manipulation"
    The spot price cannot immediately be used for the calculation of the moving average, as this would allow for single block oracle manipulation. Consequently, **`_calc_moving_average`** uses **`last_prices_packed`**, which retains prices from previous actions.

??? quote "`upkeep_oracles`"

    ```vyper
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

        @internal
        @view
        def _calc_moving_average(
            packed_value: uint256,
            averaging_window: uint256,
            ma_last_time: uint256
        ) -> uint256:

            last_spot_value: uint256 = packed_value & (2**128 - 1)
            last_ema_value: uint256 = (packed_value >> 128)

            if ma_last_time < block.timestamp:  # calculate new_ema_value and return that.
                alpha: uint256 = self.exp(
                    -convert(
                        (block.timestamp - ma_last_time) * 10**18 / averaging_window, int256
                    )
                )
                return (last_spot_value * (10**18 - alpha) + last_ema_value * alpha) / 10**18

            return last_ema_value
    ```


## **`exchange_received`**

This new function **allows the exchange of tokens without actually transfering tokens in**, as the exchange is based on the change of the coins balances within the pool (see code below).    
Users of this method are dex aggregators, arbitrageurs, or other users who **do not wish to grant approvals to the contract**. They can instead send tokens directly to the contract and call **`exchange_received()`**.

!!!warning
    This function will revert if called on pools that contain rebasing tokens.

??? quote "Transfer logic when using `exchange_received()`"

    ```vyper
    @internal
    def _transfer_in(
        coin_idx: int128,
        dx: uint256,
        sender: address,
        expect_optimistic_transfer: bool,
    ) -> uint256:
        """
        @notice Contains all logic to handle ERC20 token transfers.
        @param coin_idx Index of the coin to transfer in.
        @param dx amount of `_coin` to transfer into the pool.
        @param dy amount of `_coin` to transfer out of the pool.
        @param sender address to transfer `_coin` from.
        @param receiver address to transfer `_coin` to.
        @param expect_optimistic_transfer True if contract expects an optimistic coin transfer
        """
        _dx: uint256 = ERC20(coins[coin_idx]).balanceOf(self)

        # ------------------------- Handle Transfers -----------------------------

        if expect_optimistic_transfer:

            _dx = _dx - self.stored_balances[coin_idx]
            assert _dx >= dx

        else:

            assert dx > 0  # dev : do not transferFrom 0 tokens into the pool
            assert ERC20(coins[coin_idx]).transferFrom(
                sender, self, dx, default_return_value=True
            )

            _dx = ERC20(coins[coin_idx]).balanceOf(self) - _dx

        # --------------------------- Store transferred in amount ---------------------------

        self.stored_balances[coin_idx] += _dx

        return _dx
    ```


### **Example** 

!!!example
    Lets say a user wants to swap **`GOV-TOKEN<>USDC`** through an aggregator. For simplicity we assume, **`GOV-TOKEN<>USDT`** exchange is done via a uniswap pool, **`USDT<>USDC`** via a Curve pool.

``` mermaid
graph LR
    u([USER]) --- p1[(UNISWAP)]
    p1 -->|"3. transfer out/in"| p2[(CURVE)]
    u -..-> |1. approve and transfer| a([AGGREGATOR])
    a ==> |"2. exchange"| p1
    a -.-|"4. exchange_received"| p2
    p2 --> |5. transfer dy out| u
    linkStyle 0 stroke-width:0, fill:none;
```

1. User gives approval the `AGGREGATOR`, which then transfers tokens into the aggregator contract
2. Aggregator exchanges `GOV-TOKEN` for `USDT` using Uniswap  
3. Transfers the `USDT` directly from Uniswap into the Curve pool
4. Perform a swap on the Curve pool (`USDT<>USDC`) via **`exchange_received`**
5. Transfer `USDC` to the user


!!!info 
    This method saves aggregators one redundant ERC-20 transfer and eliminates the need to grant approval to a curve pool. Without this function, the aggregator would have to conduct an additional transaction, transferring USDT from the Uniswap pool to their aggregator contract after the exchange, and then sending it to the Curve pool for another exchange (USDT<>USDC).
    However, with this method in place, the aggregator can transfer the output tokens directly into the next pool and perform an exchange.