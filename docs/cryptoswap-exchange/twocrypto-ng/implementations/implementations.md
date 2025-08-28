
This document covers the different implementations of the Twocrypto-NG pool, with a focus on the donation/refuel capabilities that have been introduced to both implementations.

## Overview

The Twocrypto-NG protocol has evolved to include donation/refuel mechanisms in both implementations. These mechanisms aim to combine high liquidity concentration with profitability for Liquidity Providers (LPs) through an innovative approach to pool subsidization.


### YB Implementation (With Donations, No Admin Fee)
- **Address**: `0x986fAfB173801D9F82a01d9FfD71f1e1c080D2c2`
- **Implementation Index**: `110827960954786879070795645317684308345156454977361180728234664032152099907574`
- **Admin Fee**: `0` (no admin fees)
- **Donation Feature**: ✅ Enabled

### FX Implementation (With Donations, 50% Admin Fee)
- **Address**: `0xbab4CA419DF4e9ED96435823990C64deAD976a9F`
- **Implementation Index**: `68423147332349631967171811681720779771785633574467151653404049221485440227559`
- **Admin Fee**: `5000000000` (50% admin fee)
- **Donation Feature**: ✅ Enabled
- **Vote**: [Curve DAO Proposal #1178](https://www.curve.finance/dao/ethereum/proposals/1178-ownership)

## Key Differences

Both implementations share the same donation/refuel functionality, with the only difference being the admin fee structure:

- **YB Implementation**: No admin fees, all profits go to LPs
- **FX Implementation**: 50% admin fee, allowing for revenue sharing with protocol administrators

This difference allows for different economic models depending on the use case:
- **YB**: Suitable for community-driven pools where all value accrues to LPs
- **FX**: Suitable for pools where protocol administrators need to capture value for sustainability

## Donation/Refuel Mechanism

### Concept

Both implementations introduce a **donation/refuel** system that allows external parties to subsidize pool losses that occur from combining an active rebalancing algorithm with high concentration invariants. The core bet is that better price execution and increased trading fees will compensate for rebalancing costs.

### Key Benefits


### How Refueling Works

Refuels (donations) slowly drip into the pool over a **one-week period** and are used to offset rebalance losses. This mechanism is superior to traditional token incentives because:

1. **Losses are subsidized** rather than just giving free money to LPs
2. **Liquidity density is improved**, making the asset more attractive
3. **Eliminates the middleman** of temporary token-based incentives

!!!warning
    The refueling method is still in its infancy and requires historical data on performance. Simulations are showing promising results for efficiency improvements.


### `add_liquidity`
!!! description "`FXSwap.add_liquidity(amounts: uint256[N_COINS], min_mint_amount: uint256, receiver: address = msg.sender, donation: bool = False) -> uint256:`"

    Function to add liquidity to 

    Returns: 

    | Input             | Type               | Description                                      |
    | ----------------- | ------------------ | ------------------------------------------------ |
    | `amounts`         | `uint256[N_COINS]` | Amounts of each coin to add. |
    | `min_mint_amount` | `uint256`          | Minimum amount of LP tokens to mint to `receiver`. |
    | `receiver`        | `address`          | Receiver address of the minted LP tokens; defaults to `msg.sender` |
    | `donation`        | `bool`             | Wether the liquidity is a donation; defaults to `False` |

    ??? quote "Source code"

        === "FXSwap.vy"

            ```py
            cached_price_scale: uint256  # <------------------------ Internal price scale.
            cached_price_oracle: uint256  # <------- Price target given by moving average.

            balances: public(uint256[N_COINS])

            @external
            @nonreentrant
            def add_liquidity(
                amounts: uint256[N_COINS],
                min_mint_amount: uint256,
                receiver: address = msg.sender,
                donation: bool = False
            ) -> uint256:
                """
                @notice Adds liquidity into the pool.
                @param amounts Amounts of each coin to add.
                @param min_mint_amount Minimum amount of LP to mint.
                @param receiver Address to send the LP tokens to. Default is msg.sender
                @param donation Whether the liquidity is a donation, if True receiver is ignored.
                @return uint256 Amount of LP tokens issued (to receiver or donation buffer).
                """


                assert amounts[0] + amounts[1] > 0, "no coins to add"

                # --------------------- Get prices, balances -----------------------------

                old_balances: uint256[N_COINS] = self.balances

                ########################## TRANSFER IN <-------

                amounts_received: uint256[N_COINS] = empty(uint256[N_COINS])
                # This variable will contain the old balances + the amounts received.
                balances: uint256[N_COINS] = self.balances
                for i: uint256 in range(N_COINS):
                    if amounts[i] > 0:
                        # Updates self.balances here:
                        amounts_received[i] = self._transfer_in(
                            i,
                            amounts[i],
                            msg.sender,
                            False,  # <--------------------- Disable optimistic transfers.
                        )
                        balances[i] += amounts_received[i]

                price_scale: uint256 = self.cached_price_scale
                xp: uint256[N_COINS] = self._xp(balances, price_scale)
                old_xp: uint256[N_COINS] = self._xp(old_balances, price_scale)

                # --------------------Finalize ramping of empty pool
                if self.D == 0:
                    self.future_A_gamma_time = block.timestamp

                # -------------------- Calculate LP tokens to mint -----------------------

                A_gamma: uint256[2] = self._A_gamma()
                old_D: uint256 = self._get_D(A_gamma, old_xp)

                D: uint256 = staticcall self.MATH.newton_D(A_gamma[0], A_gamma[1], xp, 0)

                token_supply: uint256 = self.totalSupply
                d_token: uint256 = 0
                if old_D > 0:
                    d_token = token_supply * D // old_D - token_supply
                else:
                    d_token = self._xcp(D, price_scale)  # <----- Making initial virtual price equal to 1.

                assert d_token > 0, "nothing minted"


                d_token_fee: uint256 = 0
                if old_D > 0:
                    d_token_fee = (
                        self._calc_token_fee(amounts_received, xp, donation, True) * d_token // 10**10 + 1
                    ) # for donations - we only take NOISE_FEE (check _calc_token_fee)
                    d_token -= d_token_fee

                    if donation:
                        assert receiver == empty(address), "nonzero receiver"
                        new_donation_shares: uint256 = self.donation_shares + d_token
                        assert new_donation_shares * PRECISION // (token_supply + d_token) <= self.donation_shares_max_ratio, "donation above cap!"

                        # When adding donation, if the previous one hasn't been fully released we preserve
                        # the currently unlocked donation [given by `self._donation_shares()`] by updating
                        # `self.last_donation_release_ts` as if a single virtual donation of size `new_donation_shares`
                        # was made in past and linearly unlocked reaching `self._donation_shares()` at the current time.

                        # We want the following equality to hold:
                        # self._donation_shares() = new_donation_shares * (new_elapsed / self.donation_duration)
                        # We can rearrange this to find the new elapsed time (imitating one large virtual donation):
                        # => new_elapsed = self._donation_shares() * self.donation_duration / new_donation_shares
                        # edge case: if self.donation_shares = 0, then self._donation_shares() is 0
                        # and new_elapsed = 0, thus initializing last_donation_release_ts = block.timestamp
                        new_elapsed: uint256 = self._donation_shares(False) * self.donation_duration // new_donation_shares

                        # Additional observations:
                        # new_elapsed = (old_pool * old_elapsed / D) * D / new_pool = old_elapsed * (old_pool / new_pool)
                        # => new_elapsed is always smaller than old_elapsed
                        # and self.last_donation_release_ts is carried forward propotionally to new donation size.
                        self.last_donation_release_ts = block.timestamp - new_elapsed

                        # Credit donation: we don't explicitly mint lp tokens, but increase total supply
                        self.donation_shares = new_donation_shares
                        self.totalSupply += d_token
                        log Donation(donor=msg.sender, token_amounts=amounts_received)
                    else:
                        # --- Donation Protection & LP Spam Penalty ---
                        # Extend protection to shield against donation extraction via sandwich attacks.
                        # A penalty is applied for extending the protection to disincentivize spamming.
                        relative_lp_add: uint256 = d_token * PRECISION // (token_supply + d_token)
                        if relative_lp_add > 0 and self.donation_shares > 0:  # sub-precision additions are expensive to stack
                            # Extend protection period
                            protection_period: uint256 = self.donation_protection_period
                            extension_seconds: uint256 = min(relative_lp_add * protection_period // self.donation_protection_lp_threshold, protection_period)
                            current_expiry: uint256 = max(self.donation_protection_expiry_ts, block.timestamp)
                            new_expiry: uint256 = min(current_expiry + extension_seconds, block.timestamp + protection_period)
                            self.donation_protection_expiry_ts = new_expiry

                        # Regular liquidity addition
                        self.mint(receiver, d_token)

                    price_scale = self.tweak_price(A_gamma, xp, D)

                else:

                    # (re)instatiating an empty pool:

                    self.D = D
                    self.virtual_price = 10**18
                    self.xcp_profit = 10**18
                    self.xcp_profit_a = 10**18

                    self.mint(receiver, d_token)
                assert d_token >= min_mint_amount, "slippage"

                # ---------------------------------------------- Log and claim admin fees.

                log AddLiquidity(
                    receiver=receiver,
                    token_amounts=amounts_received,
                    fee=d_token_fee,
                    token_supply=token_supply+d_token,
                    price_scale=price_scale
                )

                return d_token

            @internal
            @view
            def _xp(
                balances: uint256[N_COINS],
                price_scale: uint256,
            ) -> uint256[N_COINS]:
                return [
                    balances[0] * PRECISIONS[0],
                    unsafe_div(balances[1] * PRECISIONS[1] * price_scale, PRECISION)
                ]
            ```

        === "MATH.vy"

            ```py
            @external
            @pure
            def newton_D(_amp: uint256,
                gamma: uint256, # unused, present for compatibility with twocrypto
                _xp: uint256[N_COINS],
                K0_prev: uint256 = 0 # unused, present for compatibility with twocrypto
            ) -> uint256:
                """
                Find D for given x[i] and A.
                """
                # gamma and K0_prev are ignored
                # _amp is already multiplied by a A_MULTIPLIER and N_COINS

                S: uint256 = 0
                for x: uint256 in _xp:
                    S += x
                if S == 0:
                    return 0

                D: uint256 = S
                Ann: uint256 = _amp * N_COINS

                for i: uint256 in range(255):

                    D_P: uint256 = D
                    for x: uint256 in _xp:
                        D_P = D_P * D // x
                    D_P //= N_COINS**N_COINS
                    Dprev: uint256 = D

                    # (Ann * S / A_PRECISION + D_P * N_COINS) * D / ((Ann - A_PRECISION) * D / A_PRECISION + (N_COINS + 1) * D_P)
                    D = (
                        (unsafe_div(Ann * S, A_MULTIPLIER) + D_P * N_COINS) * D
                        //
                        (
                            unsafe_div((Ann - A_MULTIPLIER) * D, A_MULTIPLIER) +
                            unsafe_add(N_COINS, 1) * D_P
                        )
                    )

                    # Equality with the precision of 1
                    if D > Dprev:
                        if D - Dprev <= 1:
                            return D
                    else:
                        if Dprev - D <= 1:
                            return D
                # convergence typically occurs in 4 rounds or less, this should be unreachable!
                # if it does happen the pool is borked and LPs can withdraw via `remove_liquidity`
                raise "Did not converge"
            ```

    === "Example"

        ```shell
        >>> soon
        ```


