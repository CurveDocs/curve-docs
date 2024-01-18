<h1> Pools: Overview </h1>

**New Features Over the Regular Two-Coin CryptoSwap Implementation:**

- New fee claiming approach
- [**`exchange_received`**](#exchange_received)
- Overall gas improvements


## **Fee Claiming**

Admin fees of a Curve pool are usually claimed through an external function, callable by anyone. **Twocrypto-NG does not have any external function to directly claim fees**. Admin fees are claimed through an internal function — when liquidity is removed single-sidedly via the `_remove_liquidity_one_coin` function — and then sent to the fee receiver determined within the Factory contract.

The flow is the following:

1. Calculating admin's share of fees,
2. minting LP tokens,
3. claiming underlying tokens via `remove_liquidity`

Disable fee claiming when:
- Passed time since last claim is less than `MIN_ADMIN_FEE_CLAIM_INTERVAL` (86400).
- Pool parameters (`A`, `gamma`) are being ramped.
- Insufficient profits accrued since last claim.
- Less than 10**18 (1 unit of) LP tokens, as it can lead to manipulated virtual prices.


Admin fees are calculated as follows:

1. Calculate accrued profit since last claim. `xcp_profit` is the current profits. `xcp_profit_a` is the profits at the previous claim.
2. Take out admin's share, which is hardcoded at 5 * 10^9. (50% => half of 100% => 10^10 / 2 => 5 * 10**9).
3. Since half of the profits go to rebalancing the pool, we are left with half; so divide by 2.


fees when adding liquidity are charged in the lp token!! exchange fees are taken in coin `j`?




??? quote "`_claim_admin_fees()`"

    ```vyper
    @internal
    def _claim_admin_fees():
        """
        @notice Claims admin fees and sends it to fee_receiver set in the factory.
        @dev Functionally similar to:
            1. Calculating admin's share of fees,
            2. minting LP tokens,
            3. admin claims underlying tokens via remove_liquidity.
        """

        # --------------------- Check if fees can be claimed ---------------------

        # Disable fee claiming if:
        # 1. If time passed since last fee claim is less than
        #    MIN_ADMIN_FEE_CLAIM_INTERVAL.
        # 2. Pool parameters are being ramped.

        last_claim_time: uint256 = self.last_admin_fee_claim_timestamp
        if (
            unsafe_sub(block.timestamp, last_claim_time) < MIN_ADMIN_FEE_CLAIM_INTERVAL or
            self.future_A_gamma_time > block.timestamp
        ):
            return

        xcp_profit: uint256 = self.xcp_profit  # <---------- Current pool profits.
        xcp_profit_a: uint256 = self.xcp_profit_a  # <- Profits at previous claim.
        current_lp_token_supply: uint256 = self.totalSupply

        # Do not claim admin fees if:
        # 1. insufficient profits accrued since last claim, and
        # 2. there are less than 10**18 (or 1 unit of) lp tokens, else it can lead
        #    to manipulated virtual prices.

        if xcp_profit <= xcp_profit_a or current_lp_token_supply < 10**18:
            return

        # ---------- Conditions met to claim admin fees: compute state. ----------

        A_gamma: uint256[2] = self._A_gamma()
        D: uint256 = self.D
        vprice: uint256 = self.virtual_price
        price_scale: uint256 = self.cached_price_scale
        fee_receiver: address = factory.fee_receiver()
        balances: uint256[N_COINS] = self.balances

        #  Admin fees are calculated as follows.
        #      1. Calculate accrued profit since last claim. `xcp_profit`
        #         is the current profits. `xcp_profit_a` is the profits
        #         at the previous claim.
        #      2. Take out admin's share, which is hardcoded at 5 * 10**9.
        #         (50% => half of 100% => 10**10 / 2 => 5 * 10**9).
        #      3. Since half of the profits go to rebalancing the pool, we
        #         are left with half; so divide by 2.

        fees: uint256 = unsafe_div(
            unsafe_sub(xcp_profit, xcp_profit_a) * ADMIN_FEE, 2 * 10**10
        )

        # ------------------------------ Claim admin fees by minting admin's share
        #                                                of the pool in LP tokens.

        # This is the admin fee tokens claimed in self.add_liquidity. We add it to
        # the LP token share that the admin needs to claim:
        admin_share: uint256 = self.admin_lp_virtual_balance
        frac: uint256 = 0
        if fee_receiver != empty(address) and fees > 0:

            # -------------------------------- Calculate admin share to be minted.
            frac = vprice * 10**18 / (vprice - fees) - 10**18
            admin_share += current_lp_token_supply * frac / 10**18

            # ------ Subtract fees from profits that will be used for rebalancing.
            xcp_profit -= fees * 2

        # ------------------- Recalculate virtual_price following admin fee claim.
        total_supply_including_admin_share: uint256 = (
            current_lp_token_supply + admin_share
        )
        vprice = (
            10**18 * self.get_xcp(D, price_scale) /
            total_supply_including_admin_share
        )

        # Do not claim fees if doing so causes virtual price to drop below 10**18.
        if vprice < 10**18:
            return

        # ---------------------------- Update State ------------------------------

        # Set admin virtual LP balances to zero because we claimed:
        self.admin_lp_virtual_balance = 0

        self.xcp_profit = xcp_profit
        self.last_admin_fee_claim_timestamp = block.timestamp

        # Since we reduce balances: virtual price goes down
        self.virtual_price = vprice

        # Adjust D after admin seemingly removes liquidity
        self.D = D - unsafe_div(D * admin_share, total_supply_including_admin_share)

        if xcp_profit > xcp_profit_a:
            self.xcp_profit_a = xcp_profit  # <-------- Cache last claimed profit.

        # --------------------------- Handle Transfers ---------------------------

        admin_tokens: uint256[N_COINS] = empty(uint256[N_COINS])
        if admin_share > 0:

            for i in range(N_COINS):

                admin_tokens[i] = (
                    balances[i] * admin_share /
                    total_supply_including_admin_share
                )

                # _transfer_out tokens to admin and update self.balances. State
                # update to self.balances occurs before external contract calls:
                self._transfer_out(i, admin_tokens[i], fee_receiver)

            log ClaimAdminFee(fee_receiver, admin_tokens)
    ```


## **`exchange_received`**

This new function **allows the exchange of tokens without actually transfering tokens in**, as the exchange is based on the change of the coins balances within the pool (see code below).    
Users of this method are dex aggregators, arbitrageurs, or other users who **do not wish to grant approvals to the contract**. They can instead send tokens directly to the contract and call **`exchange_received()`**.

??? quote "Transfer logic when using `exchange_received()`"

    ```vyper
    @internal
    def _transfer_in(
        _coin_idx: uint256,
        _dx: uint256,
        sender: address,
        expect_optimistic_transfer: bool,
    ) -> uint256:
        """
        @notice Transfers `_coin` from `sender` to `self` and calls `callback_sig`
                if it is not empty.
        @params _coin_idx uint256 Index of the coin to transfer in.
        @params dx amount of `_coin` to transfer into the pool.
        @params sender address to transfer `_coin` from.
        @params expect_optimistic_transfer bool True if pool expects user to transfer.
                This is only enabled for exchange_received.
        @return The amount of tokens received.
        """
        coin_balance: uint256 = ERC20(coins[_coin_idx]).balanceOf(self)

        if expect_optimistic_transfer:  # Only enabled in exchange_received:
            # it expects the caller of exchange_received to have sent tokens to
            # the pool before calling this method.

            # If someone donates extra tokens to the contract: do not acknowledge.
            # We only want to know if there are dx amount of tokens. Anything extra,
            # we ignore. This is why we need to check if received_amounts (which
            # accounts for coin balances of the contract) is atleast dx.
            # If we checked for received_amounts == dx, an extra transfer without a
            # call to exchange_received will break the method.
            dx: uint256 = coin_balance - self.balances[_coin_idx]
            assert dx >= _dx  # dev: user didn't give us coins

            # Adjust balances
            self.balances[_coin_idx] += dx

            return dx

        # ----------------------------------------------- ERC20 transferFrom flow.

        # EXTERNAL CALL
        assert ERC20(coins[_coin_idx]).transferFrom(
            sender,
            self,
            _dx,
            default_return_value=True
        )

        dx: uint256 = ERC20(coins[_coin_idx]).balanceOf(self) - coin_balance
        self.balances[_coin_idx] += dx
        return dx
    ```

---

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
