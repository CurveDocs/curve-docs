<h1>Refuel Implementation</h1>

!!!info ""
    This document covers the different implementations of the Twocrypto-NG pool, with a focus on the refuel capabilities that have been introduced.

!!!note "Terminology Note"
    This document uses **"refuel"** terminology in explanations for consistency with current branding. However, the actual contract variables and functions still use "donation" terminology (e.g., `donation_shares`, `donation_duration`) as these contracts are already deployed and cannot be changed. The functionality is identical - "refuel" and "donation" refer to the same mechanism.

The refuel mechanism in Cryptoswap pools allows external parties to contribute liquidity as a buffer that can be burned during rebalancing operations. This system addresses the core challenge of rebalancing costs by providing a liquidity reserve (`donation_shares`) that protects regular LPs from bearing the full impact of rebalancing adjustments.

## What are Refuels?

Refuels are special LP shares that are not credited to any user but instead serve as a liquidity buffer for the pool. During rebalancing, these shares can be burned to absorb impermanent loss, enabling the pool to adjust its `price_scale` while maintaining virtual price for existing LPs.

```python
# Donation shares are tracked separately from regular LP shares
donation_shares: public(uint256)
donation_shares_max_ratio: public(uint256)  # Cap on donations (e.g., 10% of total supply)
```

## How are Refuels Added?

Refuels are added through the `add_liquidity` function with the `donation=True` parameter:

```python
@external
@nonreentrant
def add_liquidity(
    amounts: uint256[N_COINS],
    min_mint_amount: uint256,
    receiver: address = msg.sender,
    donation: bool = False
) -> uint256:
```

When `donation=True`:
- LP tokens are credited to the refuel buffer instead of being minted to a receiver
- Only a minimal `NOISE_FEE` (0.1 BPS) is charged for numerical stability
- The `NOISE_FEE` is absorbed by the pool itself (not distributed to anyone) to ensure numerical precision
- The refuel is subject to the `donation_shares_max_ratio` cap
- A `Donation` event is emitted

```python
if donation:
    assert receiver == empty(address), "nonzero receiver"
    new_donation_shares: uint256 = self.donation_shares + d_token
    assert new_donation_shares * PRECISION // (token_supply + d_token) <= self.donation_shares_max_ratio, "donation above cap!"
    
    # Credit donation: we don't explicitly mint lp tokens, but increase total supply
    self.donation_shares = new_donation_shares
    self.totalSupply += d_token
    log Donation(donor=msg.sender, token_amounts=amounts_received)
```

## How are Refuels Used?

Refuels are automatically burned during pool rebalancing operations when `tweak_price` is called. This occurs after normal pool operations like swaps (`_exchange`), liquidity additions (`add_liquidity`), and imbalanced withdrawals (`remove_liquidity_one_coin` or `remove_liquidity_fixed_out`).

The key logic in `tweak_price`:

```python
# Calculate unlocked donations (time-based release + protection damping)
donation_shares: uint256 = self._donation_shares()

# During rebalancing, burn donations to maintain virtual price
donation_shares_to_burn: uint256 = 0
goal_vp: uint256 = max(threshold_vp, virtual_price)
if new_virtual_price < goal_vp:
    # Calculate how many donation shares to burn to reach goal_vp
    tweaked_supply: uint256 = 10**18 * new_xcp // goal_vp
    donation_shares_to_burn = min(
        unsafe_sub(total_supply, tweaked_supply),
        donation_shares
    )
    
if donation_shares_to_burn > 0:
    self.donation_shares -= donation_shares_to_burn
    self.totalSupply -= donation_shares_to_burn
    self.last_donation_release_ts = block.timestamp
```

## MEV Protection Measures

The refuel mechanism includes two key MEV protection measures:

### 1. Time-Based Unlocking

Refuels unlock linearly over time (default: 7 days) to prevent immediate extraction:

```python
@internal
@view
def _donation_shares(_donation_protection: bool = True) -> uint256:
    # Time-based release of donation shares
    elapsed: uint256 = block.timestamp - self.last_donation_release_ts
    unlocked_shares: uint256 = min(donation_shares, donation_shares * elapsed // self.donation_duration)
```

### 2. Add Liquidity Throttling

When users add liquidity, the protection window is extended to prevent refuel extraction via sandwich attacks:

```python
# Donation Protection & LP Spam Penalty
relative_lp_add: uint256 = d_token * PRECISION // (token_supply + d_token)
if relative_lp_add > 0 and self.donation_shares > 0:
    # Extend protection period
    protection_period: uint256 = self.donation_protection_period
    extension_seconds: uint256 = min(relative_lp_add * protection_period // self.donation_protection_lp_threshold, protection_period)
    current_expiry: uint256 = max(self.donation_protection_expiry_ts, block.timestamp)
    new_expiry: uint256 = min(current_expiry + extension_seconds, block.timestamp + protection_period)
    self.donation_protection_expiry_ts = new_expiry
```

The protection applies a damping factor to unlocked donations:

```python
# Donation protection damping factor
protection_factor: uint256 = 0
expiry: uint256 = self.donation_protection_expiry_ts
if expiry > block.timestamp:
    protection_factor = min((expiry - block.timestamp) * PRECISION // self.donation_protection_period, PRECISION)

return unlocked_shares * (PRECISION - protection_factor) // PRECISION
```

This dual protection system ensures that refuels cannot be easily extracted by MEV bots while still providing the intended liquidity buffer benefits to the pool.

---

## Contract Functions and Variables

### `add_liquidity`
!!! description "`FXSwap.add_liquidity(amounts: uint256[N_COINS], min_mint_amount: uint256, receiver: address = msg.sender, donation: bool = False) -> uint256:`"

    Function to add liquidity to the pool. Can be used for regular liquidity addition or donations when `donation=True`. When `donation=True`, the LP tokens are credited to the donation buffer instead of being minted to a receiver.

    **Returns:** Amount of LP tokens minted (to receiver or donation buffer) (`uint256`)

    **Emits:** `Donation` or `AddLiquidity `event.

    | Input             | Type               | Description                                      |
    | ----------------- | ------------------ | ------------------------------------------------ |
    | `amounts`         | `uint256[N_COINS]` | Amounts of each coin to add. |
    | `min_mint_amount` | `uint256`          | Minimum amount of LP tokens to mint to `receiver`. |
    | `receiver`        | `address`          | Receiver address of the minted LP tokens; defaults to `msg.sender`. Ignored when `donation=True`. |
    | `donation`        | `bool`             | Whether the liquidity is a donation; defaults to `False`. |

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
        >>> FXSwap.donation_shares()
        0

        >>> FXSwap.add_liquidity([10000000000000000000, 0], 0, empty(address), True)        # adding 10 USDC as donation to the pool

        >>> FXSwap.donation_shares()
        11635899407127730908
        ```


### `donation_shares`
!!! description "`FXSwap.donation_shares() -> uint256: view`"

    Getter for the current donation shares. Donation shares are the total shares donated to the contract including both "locked" (time-based release) and "throttled" (add_liquidity protection) shares.

    **Returns:** Current donation shares (`uint256`)

    ??? quote "Source code"

        === "FXSwap.vy"

            ```py
            # Donation shares balance
            donation_shares: public(uint256)
            ```

    === "Example"

        === "Adding Donations"

            This example shows how `donation_shares` are added.

            ```shell
            >>> FXSwap.donation_shares()
            0

            >>> FXSwap.add_liquidity([10000000000000000000, 0], 0, empty(address), True)        # adding 10 USDC as donation to the pool

            >>> FXSwap.donation_shares()
            11635899407127730908
            ```

        === "`donation_shares` behaviour"

            This example shows how `donation_shares` behave when users interact with a function which calls `tweak_price`. `donation_shares` are decrease as they are used to rebalance the pool.

            ```shell
            >>> FXSwap.donation_shares()
            11635899407127730908

            >>> FXSwap.exchange(0, 1, 10000000000000000000, 0, user)

            >>> FXSwap.donation_shares()
            11588763240547931073
            ```


### `donation_shares_max_ratio`
!!! description "`FXSwap.donation_shares_max_ratio() -> uint256: view`"

    Getter for the maximum ratio of donation shares allowed in the pool. This parameter prevents the pool from being overwhelmed by donations, ensuring that regular LPs maintain a minimum share of the pool.

    **Returns:** Maximum donation shares ratio (`uint256`)

    ??? quote "Source code"

        === "FXSwap.vy"

            ```py
            donation_shares_max_ratio: public(uint256)
            ```

    === "Example"

        ```shell
        >>> FXSwap.donation_shares_max_ratio()
        100000000000000000          # 10%
        ```


### `donation_duration`
!!! description "`FXSwap.donation_duration() -> uint256: view`"

    Getter for the duration required for donations to fully release from locked state. Donations are linearly unlocked over this time period, preventing immediate extraction and ensuring gradual distribution to LPs.

    **Returns:** Donation duration in seconds (`uint256`)

    ??? quote "Source code"

        === "FXSwap.vy"

            ```py
            donation_duration: public(uint256)
            ```

    === "Example"

        ```shell
        >>> FXSwap.donation_duration()
        604800
        ```


### `last_donation_release_ts`
!!! description "`FXSwap.last_donation_release_ts() -> uint256: view`"

    Getter for the timestamp of the last donation release. This timestamp is used to calculate how much of the donation shares have been unlocked based on the elapsed time since the last donation was made.

    **Returns:** Last donation release timestamp (`uint256`)

    ??? quote "Source code"

        === "FXSwap.vy"

            ```py
            last_donation_release_ts: public(uint256)
            ```

    === "Example"

        ```shell
        >>> FXSwap.last_donation_release()
        1756389447
        ```


### `donation_protection_expiry_ts`
!!! description "`FXSwap.donation_protection_expiry_ts() -> uint256: view`"

    Getter for the timestamp when donation protection expires. This protection mechanism extends the donation lock period when large amounts of liquidity are added, preventing donation extraction via sandwich attacks.

    **Returns:** Donation protection expiry timestamp (`uint256`)

    ??? quote "Source code"

        === "FXSwap.vy"

            ```py
            donation_protection_expiry_ts: public(uint256)
            ```

    === "Example"

        ```shell
        >>> FXSwap.donation_protection_expiry_ts()
        0
        ```


### `donation_protection_period`
!!! description "`FXSwap.donation_protection_period() -> uint256: view`"

    Getter for the donation protection period in seconds. This is the maximum duration that donation protection can be extended when large liquidity additions occur, providing a cap on the protection mechanism.

    **Returns:** Donation protection period in seconds (`uint256`)

    ??? quote "Source code"

        === "FXSwap.vy"

            ```py
            donation_protection_period: public(uint256)
            ```

    === "Example"

        ```shell
        >>> FXSwap.donation_protection_period()
        600
        ```


### `donation_protection_lp_threshold`
!!! description "`FXSwap.donation_protection_lp_threshold() -> uint256: view`"

    Getter for the LP threshold that triggers donation protection extension. When the relative amount of LP tokens added exceeds this threshold, the donation protection period is extended proportionally to prevent donation extraction attacks.

    **Returns:** Donation protection LP threshold (`uint256`)

    ??? quote "Source code"

        === "FXSwap.vy"

            ```py
            donation_protection_lp_threshold: public(uint256)
            ```

    === "Example"

        ```shell
        >>> FXSwap.donation_protection_lp_threshold()
        200000000000000000          # 20%
        ```


### `set_donation_duration`
!!! description "`FXSwap.set_donation_duration(duration: uint256)`"

    !!!guard "Guarded Method"
        This function is only callable by the `admin` of the Factory from where the pool was deployed.

    Admin function to set the donation duration. This controls how long it takes for donations to fully unlock.

    | Input      | Type      | Description                    |
    | ---------- | --------- | ------------------------------ |
    | `duration` | `uint256` | New donation duration in seconds |

    ??? quote "Source code"

        === "FXSwap.vy"

            ```py
            @external
            def set_donation_duration(duration: uint256):
                """
                @notice Set the donation duration.
                @param duration The new donation duration.
                @dev The time required for donations to fully release from locked state.
                """
                self._check_admin()
                assert duration > 0, "duration must be positive"
                self.donation_duration = duration
                log SetDonationDuration(duration=duration)
            ```

    === "Example"

        ```shell
        >>> FXSwap.set_donation_duration(86400)  # Set to 1 day
        ```


### `set_donation_protection_params`
!!! description "`FXSwap.set_donation_protection_params(_period: uint256, _threshold: uint256, _max_shares_ratio: uint256)`"

    !!!guard "Guarded Method"
        This function is only callable by the `admin` of the Factory from where the pool was deployed.

    Admin function to set donation protection parameters. These parameters control the MEV protection mechanism for donations.

    | Input              | Type      | Description                                    |
    | ------------------ | --------- | ---------------------------------------------- |
    | `_period`          | `uint256` | New donation protection period in seconds      |
    | `_threshold`       | `uint256` | New LP threshold for protection (with 10^18 precision) |
    | `_max_shares_ratio`| `uint256` | New maximum donation shares ratio (with 10^18 precision) |

    ??? quote "Source code"

        === "FXSwap.vy"

            ```py
            @external
            def set_donation_protection_params(
                _period: uint256,
                _threshold: uint256,
                _max_shares_ratio: uint256,
            ):
                """
                @notice Set donation protection parameters.
                @param _period The new donation protection period in seconds.
                @param _threshold The new donation protection threshold with 10**18 precision.
                @param _max_shares_ratio The new maximum number of shares.
                @dev _threshold = 30 * 10**18//100 means 30%
                @dev _max_shares_ratio = 10 * 10**18//100 means 10%
                """

                self._check_admin()
                assert _period > 0, "period must be positive"
                assert _threshold > 0, "threshold must be positive"
                assert _max_shares_ratio > 0, "max_shares must be positive"
                self.donation_protection_period = _period
                self.donation_protection_lp_threshold = _threshold
                self.donation_shares_max_ratio = _max_shares_ratio
                log SetDonationProtection(
                    donation_protection_period=_period,
                    donation_protection_lp_threshold=_threshold,
                    donation_shares_max_ratio=_max_shares_ratio
                    )
            ```

    === "Example"

        ```shell
        >>> FXSwap.set_donation_protection_params(600, 200000000000000000, 100000000000000000)
        # Set period to 10 minutes, threshold to 20%, max ratio to 10%
        ```
