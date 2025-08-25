<h1>Donation Implementation</h1>

Cryptoswap pools automatically concentrate liquidity around the current market price. When market prices move significantly, the pool must rebalance its liquidity distribution, which locks in impermanent loss (IL) for existing liquidity providers (LPs). To protect LPs from excessive IL, rebalancing only occurs under specific conditions that ensure the move is profitable for the pool.

The donation mechanism in Curve's cryptoswap pools allows users to donate liquidity to pools for strategic rebalancing and improved market efficiency. Donations provide a solution by allowing external parties to contribute liquidity specifically for rebalancing purposes, reducing the IL burden on regular LPs.


## What are Donations?

Donations are a supply buffer that the AMM can strategically burn to support pool rebalancing and permanently boost LP token values. Unlike regular liquidity additions, donations don't mint LP tokens to users but instead create `donation_shares` that:

- Increase the pool's `totalSupply`
- Are not credited to any address (nobody can withdraw them)
- Unlock gradually over time and can be burned during rebalancing operations

During rebalancing, the pool burns unlocked donation shares to:
- **Enable band shifts**: Allow the pool to re-center its liquidity band around the current market price
- **Maintain virtual price**: Prevent unacceptable drops in virtual price during rebalancing operations
- **Improve future trading**: Reduce slippage for subsequent trades by keeping the pool aligned with market prices

---

## Adding Donations

Donations are added to pools using the [`add_liquidity(..., donation=True)`](#add_liquidity) function, which triggers a `Donation(donor, token_amounts)` event. Similar to regular liquidity additions, the contract calculates the `d_token` amount from the invariant.

### Donation Fees and Caps

A minimal `NOISE_FEE` of 0.1 basis points is charged on donations for numeric stability (no standard add-liquidity fee applies).

The contract enforces a cap on outstanding donations (`donation_shares_max_ratio`) to maintain pool health:

```py
new_donation_shares * PRECISION // (token_supply + d_token) <= donation_shares_max_ratio
```

Donation-specific variables are set during contract initialization and can be modified after deployment using the `set_donation_duration` or `set_donation_protection_params` functions.

When users donate before a prior donation is fully released (over seven days), the contract preserves the already-unlocked fraction by adjusting `last_donation_release_ts`. This creates the effect of a single, larger virtual donation made in the past:

```py
new_elapsed = self._donation_shares(False) * self.donation_duration // new_donation_shares
self.last_donation_release_ts = block.timestamp - new_elapsed
```

!!!warning "Empty pool donations"
    ⚠️ **Important**: If the pool is empty (`old_D == 0`), `donation=True` has no effect; the pool is initialized and LP is minted to receiver. Do not pass `receiver=empty(address)` here, or you will mint LP to the zero address (irretrievable).

---

## Releasing Donations

Available donation amounts unlock over time, but release can be damped for a short window to prevent MEV. See [Protection Window & Anti-MEV Measures](#protection-window--anti-mev-mesures) for more details.

The total outstanding donation supply can be checked via `donation_shares`. Unlocked donations are calculated linearly: `unlocked = min(donation_shares, donation_shares * elapsed / donation_duration)`.

If called with protection enabled (default), it applies a throttling factor when a protection window is active:

```py
protection_factor = min((expiry - now) / donation_protection_period, 1)
return unlocked * (1 - protection_factor)
```

Donations are automatically burned during pool rebalancing operations when `tweak_price` is called. This occurs after normal pool operations like swaps (`_exchange`), liquidity additions (`add_liquidity`), and imbalanced withdrawals (`remove_liquidity_one_coin` or `remove_liquidity_fixed_out`). The pool strategically uses unlocked donation shares to enable price band shifts and maintain virtual price during rebalancing.

!!!info "Important Note"
    Donations do not absorb the impact of trades that have already occurred. Instead, they enable the pool to re-center its liquidity band around the current market price, which reduces slippage for **future** trades.

---

## Protection Window & Anti-MEV Measures

To prevent "sandwich attacks" where someone quickly adds liquidity to capture donations, the pool implements a donation protection mechanism. When regular LP tokens are added while donations exist, the pool extends a protection window (`donation_protection_period`) to shield against donation extraction.

The protection mechanism calculates the relative amount of LP tokens being added compared to the total supply (`totalSupply`). The `relative_lp_add` represents the proportion of new LP tokens relative to the total supply. For example, when adding 10 LP tokens to a pool with 90 existing LP tokens:

```py
# --- Donation Protection & LP Spam Penalty ---
# Extend protection to shield against donation extraction via sandwich attacks.
# A penalty is applied for extending the protection to disincentivize spamming.
relative_lp_add: uint256 = d_token * PRECISION // (token_supply + d_token)
```

???example "Calculation `relative_lp_add`"

    ```py
    PRECISION = 1e18

    d_token = 10                                                    # deposit amount
    token_supply = 90                                               # existing LP tokens

    relative_lp_add = d_token * PRECISION / (token_supply + d_token)
                    = 10 * 1e18 / 100
                    = 0.10 * 1e18
                    = 1e17                                          # 0.1 (10%)
    ```


    Based on `relative_lp_add`, a new `donation_protection_expiry_ts` is calculated:

    ```py
    if relative_lp_add > 0 and self.donation_shares > 0:  # sub-precision additions are expensive to stack
        # Extend protection period
        protection_period: uint256 = self.donation_protection_period
        extension_seconds: uint256 = min(relative_lp_add * protection_period // self.donation_protection_lp_threshold, protection_period)
        current_expiry: uint256 = max(self.donation_protection_expiry_ts, block.timestamp)
        new_expiry: uint256 = min(current_expiry + extension_seconds, block.timestamp + protection_period)
        self.donation_protection_expiry_ts = new_expiry
    ```

    Calculating new `donation_protection_expiry_ts

    ```py
    PRECISION = 1e18
    protection_period = 10 * 60                                     # 600s (10 minutes)
    donation_protection_lp_threshold = 20 * PRECISION // 100        # 2e17 (20%)

    relative_lp_add = 1e17

    extension_seconds = min(relative_lp_add * protection_period / donation_protection_lp_threshold, protection_period)
                    = min( (1e17 * 600) / 2e17, 600 )
                    = min( 300, 600 )
                    = 300 seconds  (5 minutes)

    current_expiry = max(previous_expiry, now)                      # current protection window
    new_expiry = min(current_expiry + 300, now + 600)               # this is the new donation_protection_expiry_ts
    ```


The protection window doesn't block donations entirely but **throttles** the amount that can be used for rebalancing to prevent MEV attacks. The new `donation_protection_expiry_ts` (calculated when regular liquidity is added) is used to compute a `protection_factor` that limits how much of the unlocked shares can actually be used for pool rebalancing.

The protection factor acts as a **"throttle"** on donation usage:

- **Protection factor = 0**: No protection active, 100% of unlocked donations can be used
- **Protection factor = 0.5**: Half protection active, only 50% of unlocked donations can be used
- **Protection factor = 1**: Full protection active, 0% of unlocked donations can be used

!!!example 
    For example, if there are 1000 unlocked donation shares and the protection factor is 0.3 (30%), then only 700 shares (1000 × 0.7) can be used for rebalancing. The remaining 300 shares remain locked until the protection period expires.

The eligible donation amount is calculated as:

```
eligible_donation = unlocked_donation × (1 - protection_factor)
```

Where `protection_factor = (expiry - now) / protection_period` ranges from 0 to 1.

??? quote "Source Code: `_donation_shares`"

    ```py
    @internal
    @view
    def _donation_shares(_donation_protection: bool = True) -> uint256:
        """
        @notice Calculates the amount of donation shares that are unlocked and not under protection.
        @dev This function accounts for both time-based release and add_liquidity-based protection.
        """
        donation_shares: uint256 = self.donation_shares
        if donation_shares == 0:
            return 0

        # --- Time-based release of donation shares ---
        elapsed: uint256 = block.timestamp - self.last_donation_release_ts
        unlocked_shares: uint256 = min(donation_shares, donation_shares * elapsed // self.donation_duration)

        if not _donation_protection:
            # if donation protection is disabled, return the total amount of unlocked donation shares
            # this is needed to calculate new timestamp for overlapping donations in add_liquidity
            # otherwise must always be called with donation_protection=True
            return unlocked_shares

        # --- Donation protection damping factor ---
        protection_factor: uint256 = 0
        expiry: uint256 = self.donation_protection_expiry_ts
        if expiry > block.timestamp:
            protection_factor = min((expiry - block.timestamp) * PRECISION // self.donation_protection_period, PRECISION)

        return unlocked_shares * (PRECISION - protection_factor) // PRECISION
    ```


---


# Contract Methods

## Donation Shares and Adding Donations

Functions and variables related to adding liquidity as donations and tracking donation shares in the pool.

### `add_liquidity`
!!! description "`FXSwap.add_liquidity(amounts: uint256[N_COINS], min_mint_amount: uint256, receiver: address = msg.sender, donation: bool = False) -> uint256:`"

    Function to add liquidity to the pool. Can be used for regular liquidity addition or donations when `donation=True`. When `donation=True`, the LP tokens are credited to the donation buffer instead of being minted to a receiver.

    Returns: Amount of LP tokens issued (to receiver or donation buffer) (`uint256`)

    Emits: `Donation` event if `donation=True` and always a `AddLiquidity` event.

    | Input             | Type               | Description                                      |
    | ----------------- | ------------------ | ------------------------------------------------ |
    | `amounts`         | `uint256[N_COINS]` | Amounts of each coin to add. |
    | `min_mint_amount` | `uint256`          | Minimum amount of LP tokens to mint to `receiver`. |
    | `receiver`        | `address`          | Receiver address of the minted LP tokens; defaults to `msg.sender` |
    | `donation`        | `bool`             | Whether the liquidity is a donation; defaults to `False` |

    ??? quote "Source code"

        === "FXSwap.vy"

            ```py
            event AddLiquidity:
                receiver: indexed(address)
                token_amounts: uint256[N_COINS]
                fee: uint256
                token_supply: uint256
                price_scale: uint256

            event Donation:
                donor: indexed(address)
                token_amounts: uint256[N_COINS]

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


### `donation_shares`
!!! description "`FXSwap.donation_shares() -> uint256: view`"

    Getter for the **total outstanding donation LP shares** credited via `add_liquidity(..., donation=True)` (includes both time-locked and currently ineligible portions (throttled); not the “usable now” amount).

    todo: how to calculate the currently usable shares

    Returns: total donation shares (`uint256`)

    ??? quote "Source code"

        === "FXSwap.vy"

            ```py
            donation_shares: public(uint256)
            ```

    === "Example"

        ```shell
        >>> soon
        ```


### `donation_shares_max_ratio`
!!! description "`FXSwap.donation_shares_max_ratio() -> uint256: view`"

    Getter for the **cap on donations as a fraction of total LP supply**, in 1e18 precision (e.g., `0.10e18` = 10%). New donations are only accepted if `(donation_shares / totalSupply) ≤ donation_shares_max_ratio` after credit. Value is set at deployment and can be changed by the `admin` of the factory from which the contract was deployed via the `set_donation_protection_params` function.

    Returns: max donation ratio (`uint256`, 1e18 = 100%)

    ??? quote "Source code"

        === "FXSwap.vy"

            ```py
            donation_shares_max_ratio: public(uint256)

            @deploy
            def __init__(
                _name: String[64],
                _symbol: String[32],
                _coins: address[N_COINS],
                _math: address,
                _salt: bytes32, # not used, left for compatibility with legacy factory
                packed_precisions: uint256,
                packed_gamma_A: uint256,
                packed_fee_params: uint256,
                packed_rebalancing_params: uint256,
                initial_price: uint256,
            ):

                ...
                self.donation_shares_max_ratio = 10 * PRECISION // 100  # 10%
                ...
            ```

    === "Example"

        ```shell
        >>> FXSwap.donation_shares_max_ratio()
        100000000000000000
        ```


## Donations release parameters

Variables that control the time-based unlocking mechanism for donation shares.

### `donation_duration`
!!! description "`FXSwap.donation_duration() -> uint256: view`"

    Getter for the **linear unlock duration** (in seconds) over which donation shares become time-unlocked. Acts as the ramp length for `unlocked_shares = donation_shares * elapsed / donation_duration`. *(Default in code: 7 days).* Can be changed by the `admin` via the `set_donation_duration` function.

    Returns: unlock duration in seconds (`uint256`)

    ??? quote "Source code"

        === "FXSwap.vy"

            ```py
            donation_duration: public(uint256)

            @deploy
            def __init__(
                _name: String[64],
                _symbol: String[32],
                _coins: address[N_COINS],
                _math: address,
                _salt: bytes32, # not used, left for compatibility with legacy factory
                packed_precisions: uint256,
                packed_gamma_A: uint256,
                packed_fee_params: uint256,
                packed_rebalancing_params: uint256,
                initial_price: uint256,
            ):
                ...
                self.donation_duration = 7 * 86400
                ...
                #                                       0x0 to self for indexers to catch.
            ```

    === "Example"

        ```shell
        >>> FXSwap.donation_duration()
        604800
        ```


### `last_donation_release_ts`
!!! description "`FXSwap.last_donation_release_ts() -> uint256: view`"

    Getter for the **timestamp anchor** used to compute time-unlocked donations. Updated when a new donation is added (to merge schedules) and when donations are burned during rebalances. This timestamp is used to calculate the elapsed time for linear unlocking of donation shares.

    Returns: UNIX timestamp (`uint256`)

    ??? quote "Source code"

        === "FXSwap.vy"

            ```py
            last_donation_release_ts: public(uint256)
            ```

    === "Example"

        ```shell
        >>> FXSwap.last_donation_release_ts()
        0
        ```


## Donation protection

Variables that control the anti-MEV protection mechanism, which throttles donation usage when regular liquidity is added to prevent sandwich attacks.

### `donation_protection_expiry_ts`
!!! description "`FXSwap.donation_protection_expiry_ts`"

    Getter for the **end timestamp of the current donation protection window**. While `now < expiry`, a throttling factor reduces how much of the time-unlocked donation can be *used*. This timestamp is extended when regular liquidity is added to the pool (to protect against donation extraction via sandwich attacks) and reset to 0 when the pool is emptied.

    Returns: UNIX timestamp (`uint256`)

    ??? quote "Source code"

        === "FXSwap.vy"

            ```py
            donation_protection_expiry_ts: public(uint256)

            @deploy
            def __init__(
                _name: String[64],
                _symbol: String[32],
                _coins: address[N_COINS],
                _math: address,
                _salt: bytes32, # not used, left for compatibility with legacy factory
                packed_precisions: uint256,
                packed_gamma_A: uint256,
                packed_fee_params: uint256,
                packed_rebalancing_params: uint256,
                initial_price: uint256,
            ):
                ...
                self.donation_protection_expiry_ts = 0
                ...
            ```

    === "Example"

        ```shell
        >>> soon
        ```


### `donation_protection_period`
!!! description "`FXSwap.donation_protection_period`"

    Getter for the **normalization/cap period** (in seconds) for donation protection. It defines both the maximum window length and the scale used in `protection_factor = (expiry − now) / donation_protection_period`. *(Default in code: 10 minutes).* 

    Value is set at deployment and can be changed by the `admin` of the factory from which the contract was deployed via the `set_donation_protection_params` function.

    Returns: period in seconds (`uint256`)

    ??? quote "Source code"

        === "FXSwap.vy"

            ```py
            donation_protection_period: public(uint256)

            @deploy
            def __init__(
                _name: String[64],
                _symbol: String[32],
                _coins: address[N_COINS],
                _math: address,
                _salt: bytes32, # not used, left for compatibility with legacy factory
                packed_precisions: uint256,
                packed_gamma_A: uint256,
                packed_fee_params: uint256,
                packed_rebalancing_params: uint256,
                initial_price: uint256,
            ):
                ...
                self.donation_protection_period = 10 * 60   # 10 minutes
                ...
            ```

    === "Example"

        ```shell
        >>> FXSwap.donation_protection_period()
        600
        ```


### `donation_protection_lp_threshold`
!!! description "`FXSwap.donation_protection_lp_threshold() -> uint256: view`"

    Getter for the **LP add threshold** (in 1e18 precision) used when extending the protection window. A regular LP add with relative size `≥ threshold` grants a full `donation_protection_period` extension; smaller adds extend proportionally. *(Default in code: 20% = `0.20e18`).* 

    Value is set at deployment and can be changed by the `admin` of the factory from which the contract was deployed via the `set_donation_protection_params` function.

    Returns: relative LP threshold (`uint256`, 1e18 = 100%)

    ??? quote "Source code"

        === "FXSwap.vy"

            ```py
            donation_protection_lp_threshold: public(uint256)

            @deploy
            def __init__(
                _name: String[64],
                _symbol: String[32],
                _coins: address[N_COINS],
                _math: address,
                _salt: bytes32, # not used, left for compatibility with legacy factory
                packed_precisions: uint256,
                packed_gamma_A: uint256,
                packed_fee_params: uint256,
                packed_rebalancing_params: uint256,
                initial_price: uint256,
            ):
                ...
                self.donation_protection_lp_threshold = 20 * PRECISION // 100  # 20%
                ...
            ```

    === "Example"

        ```shell
        >>> FXSwap.donation_protection_lp_threshold()
        200000000000000000
        ```

## Admin Functions

Functions that allow the pool admin to modify donation-related parameters after deployment.

### `set_donation_duration`
!!! description "`FXSwap.set_donation_duration(duration: uint256):`"

    !!!guard "Guarded Method"
        This function is only callable by the `admin` of the factory from which the pool has been deployed.

    Function to set the `donation_duration`. Can be any value > 0.

    | Input      | Type      | Description                    |
    | ---------- | --------- | ------------------------------ |
    | `duration` | `uint256` | New donation duration in seconds |

    ??? quote "Source code"

        === "FXSwap.vy"

            ```py
            # Donations release parameters:
            donation_duration: public(uint256)

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

            @internal
            @view
            def _check_admin():
                assert msg.sender == staticcall factory.admin(), "only owner"
            ```

    === "Example"

        ```shell
        >>> FXSwap.donation_duration()
        604800                                      # 7 days

        >>> FXSwap.set_donation_duration(302400)    # 3.5 days

        >>> FXSwap.donation_duration()
        302400                                      # 3.5 days
        ```

### `set_donation_protection_params`
!!! description "`FXSwap.set_donation_protection_params(_period: uint256, _threshold: uint256, _max_shares_ratio: uint256):`"

    !!!guard "Guarded Method"
        This function is only callable by the `admin` of the factory from which the pool has been deployed.

    Function to set donation protection parameters. These parameters control the anti-MEV protection mechanism and can be set to any value > 0.

    | Input              | Type      | Description                                                                 |
    | ------------------ | --------- | --------------------------------------------------------------------------- |
    | `_period`          | `uint256` | New donation protection period in seconds                                  |
    | `_threshold`       | `uint256` | New donation protection threshold with 10**18 precision (e.g., 30% = 30 * 10**18//100) |
    | `_max_shares_ratio`| `uint256` | New maximum donation shares ratio with 10**18 precision (e.g., 10% = 10 * 10**18//100) |

    ??? quote "Source code"

        === "FXSwap.vy"

            ```py
            # Donation protection
            donation_protection_expiry_ts: public(uint256)
            donation_protection_period: public(uint256)
            donation_protection_lp_threshold: public(uint256)

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

            @internal
            @view
            def _check_admin():
                assert msg.sender == staticcall factory.admin(), "only owner"
            ```

    === "Example"

        ```shell
        >>> FXSwap.donation_protection_period()
        600                                         # 10 minutes

        >>> FXSwap.donation_protection_lp_threshold()
        200000000000000000                          # 20%

        >>> FXSwap.donation_shares_max_ratio()
        100000000000000000                          # 10%

        >>> FXSwap.set_donation_protection_params(300, 150000000000000000, 50000000000000000)
        # Sets: period=5min, threshold=15%, max_ratio=5%

        >>> FXSwap.donation_protection_period()
        300                                         # 5 minutes
        ```

---

## Withdrawing Donations

Donated shares to the pool can usually not be withdrawn. The only condition when donations can be withdrawn is if the donation shares are the only LP tokens in the pool and all other "natural" LPs have withdrawn their funds. To prevent donations being stuck, the contract automatically withdraws all `donation_shares` when the pool is emptied. The withdrawn donations are sent to the `fee_receiver` set in the factory, or to the admin if no fee receiver is configured.

!!!info "Triggered by LP Withdrawals"
    This withdrawal process is **triggered automatically** when someone calls `remove_liquidity` or `_remove_liquidity_fixed_out` and the pool becomes empty (only donation shares remain). It cannot be called directly, but requires an LP withdrawal to trigger it.

??? quote "Source Code"
    ```py
    @internal
    def _withdraw_leftover_donations():
        """
        @notice Withdraws leftover donations from the pool.
        This is called when the pool has no other liquidity than donation shares,
        and must be emptied.
        @dev donations go to the factory fees receiver, if not set, to the admin.
        """

        if self.donation_shares != self.totalSupply:
            return

        # Pool has no other LP than donation shares, must be emptied
        receiver: address = staticcall factory.fee_receiver()
        if receiver == empty(address):
            receiver = staticcall factory.admin()

        # empty the pool
        withdraw_amounts: uint256[N_COINS] = self.balances

        for i: uint256 in range(N_COINS):
            # updates self.balances here
            self._transfer_out(i, withdraw_amounts[i], receiver)

        # Update state
        self.donation_shares = 0
        self.totalSupply = 0
        self.D = 0
        self.donation_protection_expiry_ts = 0
        log RemoveLiquidity(provider=receiver, token_amounts=withdraw_amounts, token_supply=0)
    ```

    === "Example"

        ```shell
        >>> FXSwap.donation_shares()
        1000000000000000000                          # 1 LP token in donations

        >>> FXSwap.totalSupply()
        1000000000000000000                          # Only donations remain

        # When someone calls remove_liquidity and empties the pool, 
        # _withdraw_leftover_donations() is triggered automatically
        # All donation shares are sent to fee_receiver or admin
        # Pool state is reset: donation_shares=0, totalSupply=0, D=0

        >>> FXSwap.donation_shares()
        0                                           # Donations have been withdrawn

        >>> FXSwap.totalSupply()
        0                                           # Pool is now empty
        ```
