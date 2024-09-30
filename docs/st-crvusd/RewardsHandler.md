<h1>RewardsHandler.vy</h1>


Contract which handles the rewards distribution to crvUSD stakers. The contract is responsible for taking snapshots of the staked supply ratio of crvUSD and computing the time-weighted average of the TVL ratio to decide on the amount of rewards to ask for (`weight`) from the `FeeSplitter`.

To allow a dynamic weight, the contract requires to support the dynamic weight interface of the FeeSplitter per EIP-165.

```py hl_lines="8"
from ethereum.ercs import IERC165

implements: IERC165

_SUPPORTED_INTERFACES: constant(bytes4[3]) = [
    0x01FFC9A7,  # The ERC-165 identifier for ERC-165.
    0x7965DB0B,  # The ERC-165 identifier for `IAccessControl`.
    0xA1AAB33F,  # The ERC-165 identifier for the dynamic weight interface.
]
```


---


## **Snapshots and Weights**

The weight in the `FeeSplitter` that is allocated to st-crvUSD is essentially based on the time-weighted average of the staked supply ratio of crvUSD compared to the total supply of crvUSD in circulation.

To calculate the time-weighted average of the staked supply ratio, the `RewardsHandler` takes snapshots of the staked supply ratio and stores them in a `DynArray` of snapshots (stored in the [`TWA` contract](../utils/TWA.md)). Each snapshot contains a supply ratio value which is the staked supply ratio of crvUSD at the time of the snapshot and the timestamp of the snapshot.

```py
struct Snapshot:
    tracked_value: uint256  # In 1e18 precision
    timestamp: uint256
```

Based on these `Snapshots`, a time-weighted average of the staked supply ratio is calculated using the [`TWA`](../utils/TWA.md) module.

The `RewardsHandler` contract is the only contract that can add new snapshots to the `TWA` module. Taking snapshots is fully permissionless and can be done by calling the [`take_snapshot`](#take_snapshot) function.


!!!warning "MEVing Snapshot Taking"
    There's no point in MEVing this snapshot as the rewards distribution rate can always be reduced (if a malicious actor inflates the value of the snapshot) or the minimum amount of rewards can always be increased (if a malicious actor deflates the value of the snapshot).


*Calling the [`take_snapshot`](#take_snapshot) function will compute and store the supply ratio snapshot the following way:*

1. Get the circulating supply of crvUSD in circulation. Simply calling `crvUSD.totalSupply()` is not possible as there are crvUSD minted to several contracts which are not circulating e.g. unborrowed crvUSD from Controllers, allocated crvUSD for PegKeepers or crvUSD allocated to the [`FlashLender`](../crvusd/FlashLender.md).
2. Get the supply of crvUSD in the vault by simply calling `crvUSD.balanceOf(vault)`. This will also take into account rewards that are not yet distributed.
3. Compute the supply ratio as:
   
    $$\text{SupplyRatio} = \frac{\text{SupplyInVault} \times 10^{18}}{\text{CirculatingSupply}}$$

4. The supply ratio is then stored in a `DynArray` of snapshots using the [`_store_snapshot`](#_store_snapshot) function via the [`TWA`](../utils/TWA.md) contract.


??? quote "Source code for snapshot calculation and storage"

    === "RewardsHandler.vy"

        ```python
        @external
        def take_snapshot():
            """
            @notice Function that anyone can call to take a snapshot of the current
            staked supply ratio in the vault. This is used to compute the time-weighted
            average of the TVL to decide on the amount of rewards to ask for (weight).
            @dev There's no point in MEVing this snapshot as the rewards distribution
            rate can always be reduced (if a malicious actor inflates the value of the
            snapshot) or the minimum amount of rewards can always be increased (if a
            malicious actor deflates the value of the snapshot).
            """

            # get the circulating supply from a helper function.
            # supply in circulation = controllers' debt + peg keppers' debt
            circulating_supply: uint256 = lens._circulating_supply()

            # obtain the supply of crvUSD contained in the vault by simply checking its
            # balance since it's an ERC4626 vault. This will also take into account
            # rewards that are not yet distributed.
            supply_in_vault: uint256 = staticcall stablecoin.balanceOf(vault.address)

            supply_ratio: uint256 = supply_in_vault * 10**18 // circulating_supply

            # TODO rename to _take_snapshot
            twa._store_snapshot(supply_ratio)
        ```

    === "StablecoinLens.vy"

        ```python
        # bound from factory
        MAX_CONTROLLERS: constant(uint256) = 50000
        # bound from monetary policy
        MAX_PEG_KEEPERS: constant(uint256) = 1001
        # could have been any other controller
        WETH_CONTROLLER_IDX: constant(uint256) = 3

        # the crvusd controller factory
        factory: immutable(IControllerFactory)

        @view
        @internal
        def _circulating_supply() -> uint256:
            """
            @notice Compute the circulating supply for crvUSD, `totalSupply` is
                incorrect since it takes into account all minted crvUSD (i.e. flashloans)
            @dev This function sacrifices some gas to fetch peg keepers from a
                unique source of truth to avoid having to manually maintain multiple
                lists across several contracts.
                For this reason we read the list of peg keepers contained in
                the monetary policy returned by a controller in the factory.
                factory -> weth controller -> monetary policy -> peg keepers
                This function is not exposed as external as it can be easily
                manipulated and should not be used by third party contracts.
            """

            circulating_supply: uint256 = 0

            # Fetch the weth controller (index 3) under the assumption that
            # weth will always be a valid collateral for crvUSD, therefore its
            # monetary policy should always be up to date.
            controller: IController = staticcall factory.controllers(WETH_CONTROLLER_IDX)

            # We obtain the address of the current monetary policy used by the
            # weth controller because it contains a list of all the peg keepers.
            monetary_policy: IMonetaryPolicy = staticcall controller.monetary_policy()

            # Iterate over the peg keepers (since it's a fixed size array we
            # wait for a zero address to stop iterating).
            for i: uint256 in range(MAX_PEG_KEEPERS):
                pk: IPegKeeper = staticcall monetary_policy.peg_keepers(i)

                if pk.address == empty(address):
                    # end of array
                    break

                circulating_supply += staticcall pk.debt()

            n_controllers: uint256 = staticcall factory.n_collaterals()

            for i: uint256 in range(n_controllers, bound=MAX_CONTROLLERS):
                controller = staticcall factory.controllers(i)

                # add crvUSD minted by controller
                circulating_supply += staticcall controller.total_debt()

            return circulating_supply
        ```

    === "TWA.vy"

        ```python
        @internal
        def _store_snapshot(_value: uint256):
            """
            @notice Stores a snapshot of the tracked value.
            @param _value The value to store.
            """
            if self.last_snapshot_timestamp + self.min_snapshot_dt_seconds <= block.timestamp:
                self.last_snapshot_timestamp = block.timestamp
                self.snapshots.append(
                    Snapshot(tracked_value=_value, timestamp=block.timestamp)
                )  # store the snapshot into the DynArray
        ```


For a detailed explaination on how the final weight is computed, see the [TWA Computation](#twa-computation) section of the [TWA Calculator Module](../utils/TWA.md).


---


### `take_snapshot`
!!! description "`RewardsHandler.take_snapshot()`"

    Function to take a snapshot of the current staked supply ratio in the vault. This function is fully permissionless and can be called by anyone. Snapshots are used to compute the time-weighted average of the TVL to decide on the amount of rewards to ask for (weight). 
    
    Minimum time between snapshots is defined in the `TWA` module via the `min_snapshot_dt_seconds` variable, which is changable by the `RATE_MANAGER` role using the [`set_min_snapshot_dt`](#set_min_snapshot_dt) function. The maximum number of snapshots is set to `10^18`, which is equivalent to 31.7 billion years if a snapshot is taken every second. (1)
    { .annotate }

    1. Unfortunatly we are doomed in 31.7 billion years.

    ??? quote "Source code"

        === "RewardsHandler.vy"

            ```python
            @external
            def take_snapshot():
                """
                @notice Function that anyone can call to take a snapshot of the current
                staked supply ratio in the vault. This is used to compute the time-weighted
                average of the TVL to decide on the amount of rewards to ask for (weight).
                @dev There's no point in MEVing this snapshot as the rewards distribution
                rate can always be reduced (if a malicious actor inflates the value of the
                snapshot) or the minimum amount of rewards can always be increased (if a
                malicious actor deflates the value of the snapshot).
                """

                # get the circulating supply from a helper function.
                # supply in circulation = controllers' debt + peg keppers' debt
                circulating_supply: uint256 = lens._circulating_supply()

                # obtain the supply of crvUSD contained in the vault by simply checking its
                # balance since it's an ERC4626 vault. This will also take into account
                # rewards that are not yet distributed.
                supply_in_vault: uint256 = staticcall stablecoin.balanceOf(vault.address)

                supply_ratio: uint256 = supply_in_vault * 10**18 // circulating_supply

                # TODO rename to _take_snapshot
                twa._store_snapshot(supply_ratio)
            ```

        === "StablecoinLens.vy"

            ```python
            # bound from factory
            MAX_CONTROLLERS: constant(uint256) = 50000
            # bound from monetary policy
            MAX_PEG_KEEPERS: constant(uint256) = 1001
            # could have been any other controller
            WETH_CONTROLLER_IDX: constant(uint256) = 3

            # the crvusd controller factory
            factory: immutable(IControllerFactory)

            @view
            @internal
            def _circulating_supply() -> uint256:
                """
                @notice Compute the circulating supply for crvUSD, `totalSupply` is
                    incorrect since it takes into account all minted crvUSD (i.e. flashloans)
                @dev This function sacrifices some gas to fetch peg keepers from a
                    unique source of truth to avoid having to manually maintain multiple
                    lists across several contracts.
                    For this reason we read the list of peg keepers contained in
                    the monetary policy returned by a controller in the factory.
                    factory -> weth controller -> monetary policy -> peg keepers
                    This function is not exposed as external as it can be easily
                    manipulated and should not be used by third party contracts.
                """

                circulating_supply: uint256 = 0

                # Fetch the weth controller (index 3) under the assumption that
                # weth will always be a valid collateral for crvUSD, therefore its
                # monetary policy should always be up to date.
                controller: IController = staticcall factory.controllers(WETH_CONTROLLER_IDX)

                # We obtain the address of the current monetary policy used by the
                # weth controller because it contains a list of all the peg keepers.
                monetary_policy: IMonetaryPolicy = staticcall controller.monetary_policy()

                # Iterate over the peg keepers (since it's a fixed size array we
                # wait for a zero address to stop iterating).
                for i: uint256 in range(MAX_PEG_KEEPERS):
                    pk: IPegKeeper = staticcall monetary_policy.peg_keepers(i)

                    if pk.address == empty(address):
                        # end of array
                        break

                    circulating_supply += staticcall pk.debt()

                n_controllers: uint256 = staticcall factory.n_collaterals()

                for i: uint256 in range(n_controllers, bound=MAX_CONTROLLERS):
                    controller = staticcall factory.controllers(i)

                    # add crvUSD minted by controller
                    circulating_supply += staticcall controller.total_debt()

                return circulating_supply
            ```

        === "TWA.vy"

            ```python
            MAX_SNAPSHOTS: constant(uint256) = 10**18  # 31.7 billion years if snapshot every second

            snapshots: public(DynArray[Snapshot, MAX_SNAPSHOTS])

            @internal
            def _store_snapshot(_value: uint256):
                """
                @notice Stores a snapshot of the tracked value.
                @param _value The value to store.
                """
                if self.last_snapshot_timestamp + self.min_snapshot_dt_seconds <= block.timestamp:
                    self.last_snapshot_timestamp = block.timestamp
                    self.snapshots.append(
                        Snapshot(tracked_value=_value, timestamp=block.timestamp)
                    )  # store the snapshot into the DynArray
            ```

    === "Example"

        ```shell
        >>> RewardsHandler.take_snapshot()
        ''
        ```


### `weight`
!!! description "`RewardsHandler.weight()`"

    Getter for the weight of the rewards. This is the time-weighted average of the tvl ratio. This function is part of the dynamic weight interface expected by the `FeeSplitter` to know what percentage of funds should be sent for rewards distribution to crvUSD stakers.

    Returns: current weight (`uint256`).

    ??? quote "Source code"

        === "RewardsHandler.vy"

            ```python
            # the minimum amount of rewards requested to the FeeSplitter.
            minimum_weight: public(uint256)

            @external
            @view
            def weight() -> uint256:
                """
                @notice this function is part of the dynamic weight interface expected by
                the FeeSplitter to know what percentage of funds should be sent for
                rewards distribution to crvUSD stakerks.
                @dev `minimum_weight` acts as a lower bound for the percentage of rewards
                that should be distributed to stakers. This is useful to bootstrapping TVL
                by asking for more at the beginning and can also be increased in the future
                if someone tries to manipulate the time-weighted average of the tvl ratio.
                """
                return max(twa._compute(), self.minimum_weight)
            ```

        === "TWA.vy"

            ```python
            MAX_SNAPSHOTS: constant(uint256) = 10**18  # 31.7 billion years if snapshot every second

            snapshots: public(DynArray[Snapshot, MAX_SNAPSHOTS])
            min_snapshot_dt_seconds: public(uint256)  # Minimum time between snapshots in seconds
            twa_window: public(uint256)  # Time window in seconds for TWA calculation
            last_snapshot_timestamp: public(uint256)  # Timestamp of the last snapshot (assigned in RewardsHandler)

            struct Snapshot:
                tracked_value: uint256  # In 1e18 precision
                timestamp: uint256

            @internal
            @view
            def _compute() -> uint256:
                """
                @notice Computes the TWA over the specified time window by iterating backwards over the snapshots.
                @return The TWA for tracked value over the self.twa_window (10**18 decimals precision).
                """
                num_snapshots: uint256 = len(self.snapshots)
                if num_snapshots == 0:
                    return 0

                time_window_start: uint256 = block.timestamp - self.twa_window

                total_weighted_tracked_value: uint256 = 0
                total_time: uint256 = 0

                # Iterate backwards over all snapshots
                index_array_end: uint256 = num_snapshots - 1
                for i: uint256 in range(0, num_snapshots, bound=MAX_SNAPSHOTS):  # i from 0 to (num_snapshots-1)
                    i_backwards: uint256 = index_array_end - i
                    current_snapshot: Snapshot = self.snapshots[i_backwards]
                    next_snapshot: Snapshot = current_snapshot
                    if i != 0:  # If not the first iteration, get the next snapshot
                        next_snapshot = self.snapshots[i_backwards + 1]

                    interval_start: uint256 = current_snapshot.timestamp
                    # Adjust interval start if it is before the time window start
                    if interval_start < time_window_start:
                        interval_start = time_window_start

                    interval_end: uint256 = 0
                    if i == 0:  # First iteration - we are on the last snapshot (i_backwards = num_snapshots - 1)
                        # For the last snapshot, interval end is block.timestamp
                        interval_end = block.timestamp
                    else:
                        # For other snapshots, interval end is the timestamp of the next snapshot
                        interval_end = next_snapshot.timestamp

                    if interval_end <= time_window_start:
                        break

                    time_delta: uint256 = interval_end - interval_start

                    # Interpolation using the trapezoidal rule
                    averaged_tracked_value: uint256 = (current_snapshot.tracked_value + next_snapshot.tracked_value) // 2

                    # Accumulate weighted rate and time
                    total_weighted_tracked_value += averaged_tracked_value * time_delta
                    total_time += time_delta

                assert total_time > 0, "Zero total time!"
                twa: uint256 = total_weighted_tracked_value // total_time

                return twa
            ```

    === "Example"

        ```shell
        >>> RewardsHandler.weight()
        '1000000000000000000'   # 1e18
        ```


### `minimum_weight`
!!! description "`RewardsHandler.minimum_weight() -> uint256: view`"

    Getter for the minimum weight. This is the minimum amount of rewards requested from the FeeSplitter. This value can be changed by the [`set_minimum_weight`](#set_minimum_weight) function.

    Returns: minimum weight (`uint256`).

    ??? quote "Source code"

        === "RewardsHandler.vy"

            ```python
            # the minimum amount of rewards requested to the FeeSplitter.
            minimum_weight: public(uint256)
            ```

    === "Example"

        ```shell
        >>> RewardsHandler.minimum_weight()
        '1000000000000000000'   # 1e18
        ```


### `set_minimum_weight`
!!! description "`RewardsHandler.set_minimum_weight(new_minimum_weight: uint256)`"

    Function to set the minimum weight that the vault will ask for.

    | Input                  | Type      | Description              |
    | ---------------------- | --------- | ------------------------ |
    | `new_minimum_weight`   | `uint256` | New minimum weight       |

    ??? quote "Source code"

        === "RewardsHandler.vy"

            ```python
            MAX_BPS: constant(uint256) = 10**4  # 100%

            @external
            def set_minimum_weight(new_minimum_weight: uint256):
                """
                @notice Update the minimum weight that the the vault will ask for.
                @dev This function can be used to prevent the rewards requested from being
                manipulated (i.e. MEV twa snapshots to obtain lower APR for the vault).
                Setting this value to zero makes the amount of rewards requested fully
                determined by the twa of the staked supply ratio.
                """
                access_control._check_role(RATE_MANAGER, msg.sender)
                self._set_minimum_weight(new_minimum_weight)

            @internal
            def _set_minimum_weight(new_minimum_weight: uint256):
                assert new_minimum_weight <= MAX_BPS, "minimum weight should be <= 100%"
                self.minimum_weight = new_minimum_weight
            ```

    === "Example"

        ```shell
        >>> RewardsHandler.set_minimum_weight(todo)
        ''
        ```


---


## **Distribution**

todo.

processing reports means comparing the debt that the strategy has taken with the current amount of funds it is reporting. If the strategy owes less than it currently has, it means it has had a profit, else (assets < debt) it has had a loss.

The `RewardsHandler` acts as a strategy in the Yearn V3 vault.

st-crvusd does not really use strategies. sending rewards to the vault and calling proess_report will essentially just 



### `process_rewards`
!!! description "`RewardsHandler.process_rewards()`"

    Function to process the crvUSD rewards by transferring the available balance to the vault and then calling the `process_report` function to start streaming the rewards to the stakers. This function is permissionless and can be called by anyone. When calling this function, the contracts entire crvUSD balance will be transferred to the vault and used as rewards for the stakers.

    This function reverts if the `distribution_time` is not set. This variable detemins the duration over which rewards will be distributed to the stakers.

    ??? quote "Source code"

        === "RewardsHandler.vy"

            ```python
            # the time over which rewards will be distributed mirror of the private
            # `profit_max_unlock_time` variable from yearn vaults.
            distribution_time: public(uint256)

            @external
            def process_rewards():
                """
                @notice Permissionless function that let anyone distribute rewards (if any)
                to the crvUSD vault.
                """

                # prevent the rewards from being distributed untill the distribution rate
                # has been set
                assert (
                    self.distribution_time != 0
                ), "rewards should be distributed over time"


                # any crvUSD sent to this contract (usually through the fee splitter, but
                # could also come from other sources) will be used as a reward for crvUSD
                # stakers in the vault.
                available_balance: uint256 = staticcall stablecoin.balanceOf(self)

                # we distribute funds in 2 steps:
                # 1. transfer the actual funds
                extcall stablecoin.transfer(vault.address, available_balance)
                # 2. start streaming the rewards to users
                extcall vault.process_report(vault.address)
            ```

        === "Vault.vy"

            ```python
            @external
            @nonreentrant("lock")
            def process_report(strategy: address) -> (uint256, uint256):
                """
                @notice Process the report of a strategy.
                @param strategy The strategy to process the report for.
                @return The gain and loss of the strategy.
                """
                self._enforce_role(msg.sender, Roles.REPORTING_MANAGER)
                return self._process_report(strategy)

            @internal
            def _process_report(strategy: address) -> (uint256, uint256):
                """
                Processing a report means comparing the debt that the strategy has taken
                with the current amount of funds it is reporting. If the strategy owes
                less than it currently has, it means it has had a profit, else (assets < debt)
                it has had a loss.

                Different strategies might choose different reporting strategies: pessimistic,
                only realised P&L, ... The best way to report depends on the strategy.

                The profit will be distributed following a smooth curve over the vaults
                profit_max_unlock_time seconds. Losses will be taken immediately, first from the
                profit buffer (avoiding an impact in pps), then will reduce pps.

                Any applicable fees are charged and distributed during the report as well
                to the specified recipients.

                Can update the vaults `totalIdle` to account for any airdropped tokens by
                passing the vaults address in as the parameter.
                """
                # Cache `asset` for repeated use.
                _asset: address = self.asset

                total_assets: uint256 = 0
                current_debt: uint256 = 0

                if strategy != self:
                    # Make sure we have a valid strategy.
                    assert self.strategies[strategy].activation != 0, "inactive strategy"

                    # Vault assesses profits using 4626 compliant interface.
                    # NOTE: It is important that a strategies `convertToAssets` implementation
                    # cannot be manipulated or else the vault could report incorrect gains/losses.
                    strategy_shares: uint256 = IStrategy(strategy).balanceOf(self)
                    # How much the vaults position is worth.
                    total_assets = IStrategy(strategy).convertToAssets(strategy_shares)
                    # How much the vault had deposited to the strategy.
                    current_debt = self.strategies[strategy].current_debt
                else:
                    # Accrue any airdropped `asset` into `total_idle`
                    total_assets = ERC20(_asset).balanceOf(self)
                    current_debt = self.total_idle

                gain: uint256 = 0
                loss: uint256 = 0

                ### Asses Gain or Loss ###

                # Compare reported assets vs. the current debt.
                if total_assets > current_debt:
                    # We have a gain.
                    gain = unsafe_sub(total_assets, current_debt)
                else:
                    # We have a loss.
                    loss = unsafe_sub(current_debt, total_assets)


                ### Asses Fees and Refunds ###
                total_fees: uint256 = 0
                total_refunds: uint256 = 0
                # If accountant is not set, fees and refunds remain unchanged.
                accountant: address = self.accountant
                if accountant != empty(address):
                    total_fees, total_refunds = IAccountant(accountant).report(
                        strategy, gain, loss
                    )

                    if total_refunds > 0:
                        # Make sure we have enough approval and enough asset to pull.
                        total_refunds = min(
                            total_refunds,
                            min(
                                ERC20(_asset).balanceOf(accountant),
                                ERC20(_asset).allowance(accountant, self),
                            ),
                        )

                # Total fees to charge in shares.
                total_fees_shares: uint256 = 0
                # For Protocol fee assessment.
                protocol_fee_bps: uint16 = 0
                protocol_fees_shares: uint256 = 0
                protocol_fee_recipient: address = empty(address)
                # `shares_to_burn` is derived from amounts that would reduce the vaults PPS.
                # NOTE: this needs to be done before any pps changes
                shares_to_burn: uint256 = 0
                # Only need to burn shares if there is a loss or fees.
                if loss + total_fees > 0:
                    # The amount of shares we will want to burn to offset losses and fees.
                    shares_to_burn = self._convert_to_shares(
                        loss + total_fees, Rounding.ROUND_UP
                    )

                    # If we have fees then get the proportional amount of shares to issue.
                    if total_fees > 0:
                        # Get the total amount shares to issue for the fees.
                        total_fees_shares = (
                            shares_to_burn * total_fees / (loss + total_fees)
                        )

                        # Get the protocol fee config for this vault.
                        protocol_fee_bps, protocol_fee_recipient = IFactory(
                            self.factory
                        ).protocol_fee_config()

                        # If there is a protocol fee.
                        if protocol_fee_bps > 0:
                            # Get the percent of fees to go to protocol fees.
                            protocol_fees_shares = (
                                total_fees_shares
                                * convert(protocol_fee_bps, uint256)
                                / MAX_BPS
                            )


                # Shares to lock is any amount that would otherwise increase the vaults PPS.
                shares_to_lock: uint256 = 0
                profit_max_unlock_time: uint256 = self.profit_max_unlock_time
                # Get the amount we will lock to avoid a PPS increase.
                if gain + total_refunds > 0 and profit_max_unlock_time != 0:
                    shares_to_lock = self._convert_to_shares(
                        gain + total_refunds, Rounding.ROUND_DOWN
                    )


                # The total current supply including locked shares.
                total_supply: uint256 = self.total_supply
                # The total shares the vault currently owns. Both locked and unlocked.
                total_locked_shares: uint256 = self.balance_of[self]
                # Get the desired end amount of shares after all accounting.
                ending_supply: uint256 = (
                    total_supply + shares_to_lock - shares_to_burn - self._unlocked_shares()
                )

                # If we will end with more shares than we have now.
                if ending_supply > total_supply:
                    # Issue the difference.
                    self._issue_shares(unsafe_sub(ending_supply, total_supply), self)


                # Else we need to burn shares.
                elif total_supply > ending_supply:
                    # Can't burn more than the vault owns.
                    to_burn: uint256 = min(
                        unsafe_sub(total_supply, ending_supply), total_locked_shares
                    )
                    self._burn_shares(to_burn, self)


                # Adjust the amount to lock for this period.
                if shares_to_lock > shares_to_burn:
                    # Don't lock fees or losses.
                    shares_to_lock = unsafe_sub(shares_to_lock, shares_to_burn)
                else:
                    shares_to_lock = 0


                # Pull refunds
                if total_refunds > 0:
                    # Transfer the refunded amount of asset to the vault.
                    self._erc20_safe_transfer_from(_asset, accountant, self, total_refunds)
                    # Update storage to increase total assets.
                    self.total_idle += total_refunds


                # Record any reported gains.
                if gain > 0:
                    # NOTE: this will increase total_assets
                    current_debt = unsafe_add(current_debt, gain)
                    if strategy != self:
                        self.strategies[strategy].current_debt = current_debt
                        self.total_debt += gain
                    else:
                        self.total_idle += gain

                # Or record any reported loss
                elif loss > 0:
                    current_debt = unsafe_sub(current_debt, loss)
                    if strategy != self:
                        self.strategies[strategy].current_debt = current_debt
                        self.total_debt -= loss
                    else:
                        self.total_idle -= loss

                # Issue shares for fees that were calculated above if applicable.
                if total_fees_shares > 0:
                    # Accountant fees are (total_fees - protocol_fees).
                    self._issue_shares(total_fees_shares - protocol_fees_shares, accountant)

                    # If we also have protocol fees.
                    if protocol_fees_shares > 0:
                        self._issue_shares(protocol_fees_shares, protocol_fee_recipient)

                # Update unlocking rate and time to fully unlocked.
                total_locked_shares = self.balance_of[self]
                if total_locked_shares > 0:
                    previously_locked_time: uint256 = 0
                    _full_profit_unlock_date: uint256 = self.full_profit_unlock_date
                    # Check if we need to account for shares still unlocking.
                    if _full_profit_unlock_date > block.timestamp:
                        # There will only be previously locked shares if time remains.
                        # We calculate this here since it will not occur every time we lock shares.
                        previously_locked_time = (total_locked_shares - shares_to_lock) * (
                            _full_profit_unlock_date - block.timestamp
                        )


                    # new_profit_locking_period is a weighted average between the remaining time of the previously locked shares and the profit_max_unlock_time
                    new_profit_locking_period: uint256 = (
                        previously_locked_time + shares_to_lock * profit_max_unlock_time
                    ) / total_locked_shares
                    # Calculate how many shares unlock per second.
                    self.profit_unlocking_rate = (
                        total_locked_shares * MAX_BPS_EXTENDED / new_profit_locking_period
                    )
                    # Calculate how long until the full amount of shares is unlocked.
                    self.full_profit_unlock_date = (
                        block.timestamp + new_profit_locking_period
                    )
                    # Update the last profitable report timestamp.
                    self.last_profit_update = block.timestamp
                else:
                    # NOTE: only setting this to the 0 will turn in the desired effect,
                    # no need to update profit_unlocking_rate
                    self.full_profit_unlock_date = 0


                # Record the report of profit timestamp.
                self.strategies[strategy].last_report = block.timestamp

                # We have to recalculate the fees paid for cases with an overall loss or no profit locking
                if loss + total_fees > gain + total_refunds or profit_max_unlock_time == 0:
                    total_fees = self._convert_to_assets(
                        total_fees_shares, Rounding.ROUND_DOWN
                    )

                log StrategyReported(
                    strategy,
                    gain,
                    loss,
                    current_debt,
                    total_fees
                    * convert(protocol_fee_bps, uint256)
                    / MAX_BPS,  # Protocol Fees
                    total_fees,
                    total_refunds,
                )

                return (gain, loss)
            ```

    === "Example"

        ```shell
        >>> RewardsHandler.process_rewards()
        ''
        ```


### `distribution_time`
!!! description "`RewardsHandler.distribution_time() -> uint256: view`"

    Getter for the distribution time. This is the time it takes to stream the rewards. This method mirrors the private `profit_max_unlock_time` variable from yearn vaults. This value can be changed by the [`set_distribution_time`](#set_distribution_time) function.

    Returns: distribution time (`uint256`).

    ??? quote "Source code"

        === "RewardsHandler.vy"

            ```python
            # the time over which rewards will be distributed mirror of the private
            # `profit_max_unlock_time` variable from yearn vaults.
            distribution_time: public(uint256)
            ```

    === "Example"

        ```shell
        >>> RewardsHandler.distribution_time()
        '1000000000000000000'   # 1e18
        ```

---


## **Admin Controls**

The contract uses the [Multi-Role-Based Access Control Module](https://github.com/pcaversaccio/snekmate/blob/main/src/snekmate/auth/access_control.vy) from [Snekmate](https://github.com/pcaversaccio/snekmate) to manage roles and permissions. This module ensures that only specific addresses assigned the `RATE_MANAGER` role can modify key parameters such as the Time-Weighted Average (TWA) window, the minimum time between snapshots, and the distribution time. Roles can only be granted or revoked by the `DEFAULT_ADMIN_ROLE` defined in the access module.

For a detailed explanation of how to use the access control module, please refer to the source code where its mechanics are explained in detail: [Snekmate access_control.vy](https://github.com/pcaversaccio/snekmate/blob/main/src/snekmate/auth/access_control.vy).



### `RATE_MANAGER`
!!! description "`RewardsHandler.RATE_MANAGER()`"

    Getter for the `RATE_MANAGER` role which is the keccak256 hash of the string "RATE_MANAGER". This variable is needed for compatibility with the access control module.

    Returns: `RATE_MANAGER` (`bytes32`).

    ??? quote "Source code"

        === "RewardsHandler.vy"

            ```python
            RATE_MANAGER: constant(bytes32) = keccak256("RATE_MANAGER")
            ```

    === "Example"

        ```shell
        >>> RewardsHandler.RATE_MANAGER()
        '0x4456736574657265645f726174655f6d616e6167657200000000000000000000'
        ```


### `set_twa_window`
!!! description "`RewardsHandler.set_twa_window(_twa_window: uint256)`"

    !!!guard "Guarded Method by Snekmate 🐍"
        This contract makes use of a Snekmate module to manage roles and permissions. This specific function is restricted to the `RATE_MANAGER` role.

    Function to set a new value for the `twa_window` variable in the `TWA` module. This value represents the time window over which the time-weighted average (TWA) is calculated.

    | Input         | Type      | Description                  |
    | ------------- | --------- | ---------------------------- |
    | `_twa_window` | `uint256` | New value for the TWA window |

    ??? quote "Source code"

        === "RewardsHandler.vy"

            ```python
            RATE_MANAGER: public(constant(bytes32)) = keccak256("RATE_MANAGER")

            @external
            def set_twa_window(_twa_window: uint256):
                """
                @notice Setter for the time-weighted average window
                @param _twa_window The time window used to compute the TWA value of the
                balance/supply ratio.
                """
                access_control._check_role(RATE_MANAGER, msg.sender)
                twa._set_twa_window(_twa_window)
            ```

        === "TWA.vy"

            ```python
            twa_window: public(uint256)  # Time window in seconds for TWA calculation

            @internal
            def _set_twa_window(_new_window: uint256):
                """
                @notice Adjusts the TWA window.
                @param _new_window The new TWA window in seconds.
                @dev Only callable by the importing contract.
                """
                self.twa_window = _new_window
            ```

    === "Example"

        ```shell
        >>> RewardsHandler.set_twa_window(todo)
        soon
        ```


### `set_twa_snapshot_dt`
!!! description "`RewardsHandler.set_twa_snapshot_dt(_min_snapshot_dt_seconds: uint256)`"

    !!!guard "Guarded Method by Snekmate 🐍"
        This contract makes use of a Snekmate module to manage roles and permissions. This specific function is restricted to the `RATE_MANAGER` role.

    Function to set a new value for the `min_snapshot_dt_seconds` variable in the `TWA` module. This value represents the minimum time between snapshots.

    | Input                      | Type      | Description                          |
    | -------------------------- | --------- | ------------------------------------ |
    | `_min_snapshot_dt_seconds` | `uint256` | New value for the minimum time between snapshots |

    ??? quote "Source code"

        === "RewardsHandler.vy"

            ```python
            RATE_MANAGER: public(constant(bytes32)) = keccak256("RATE_MANAGER")

            @external
            def set_twa_snapshot_dt(_min_snapshot_dt_seconds: uint256):
                """
                @notice Setter for the time-weighted average minimal frequency.
                @param _min_snapshot_dt_seconds The minimum amount of time that should pass
                between two snapshots.
                """
                access_control._check_role(RATE_MANAGER, msg.sender)
                twa._set_snapshot_dt(_min_snapshot_dt_seconds)
            ```

        === "TWA.vy"

            ```python
            min_snapshot_dt_seconds: public(uint256)  # Minimum time between snapshots in seconds

            @internal
            def _set_snapshot_dt(_new_dt_seconds: uint256):
                """
                @notice Adjusts the minimum snapshot time interval.
                @param _new_dt_seconds The new minimum snapshot time interval in seconds.
                @dev Only callable by the importing contract.
                """
                self.min_snapshot_dt_seconds = _new_dt_seconds
            ```

    === "Example"

        ```shell
        >>> RewardsHandler.set_twa_snapshot_dt(todo)
        soon
        ```

### `set_distribution_time`
!!! description "`RewardsHandler.set_distribution_time(new_distribution_time: uint256)`"

    !!!guard "Guarded Method by Snekmate 🐍"
        This contract makes use of a Snekmate module to manage roles and permissions. This specific function is restricted to the `RATE_MANAGER` role.

    Function to set the distribution time for the rewards. This is the time it takes to stream the rewards. Setting this value to 0 will immediately distribute all the rewards. If the value is set to a number greater than 0, the rewards will be distributed over the specified number of seconds. 

    Emits: `UpdateProfitMaxUnlockTime` from the Vault contract.

    | Input                  | Type      | Description              |
    | ---------------------- | --------- | ------------------------ |
    | `new_distribution_time`| `uint256` | New distribution time    |

    ??? quote "Source code"

        === "RewardsHandler.vy"

            ```python
            RATE_MANAGER: public(constant(bytes32)) = keccak256("RATE_MANAGER")

            distribution_time: public(uint256)

            @external
            def set_distribution_time(new_distribution_time: uint256):
                """
                @notice Admin function to correct the distribution rate of the rewards.
                Making this value lower will reduce the time it takes to stream the
                rewards, making it longer will do the opposite. Setting it to 0 will
                immediately distribute all the rewards.
                @dev This function can be used to prevent the rewards distribution from
                being manipulated (i.e. MEV twa snapshots to obtain higher APR for the
                vault). Setting this value to zero can be used to pause `process_rewards`.
                """
                access_control._check_role(RATE_MANAGER, msg.sender)

                # we mirror the value of new_profit_max_unlock_time from the yearn vault
                # since it's not exposed publicly.
                self.distribution_time = new_distribution_time

                # change the distribution time of the rewards in the vault
                extcall vault.setProfitMaxUnlockTime(new_distribution_time)

                # enact the changes
                extcall vault.process_report(vault.address)
            ```

        === "Vault.vy"

            ```python
            event UpdateProfitMaxUnlockTime:
                profit_max_unlock_time: uint256

            @external
            def setProfitMaxUnlockTime(new_profit_max_unlock_time: uint256):
                """
                @notice Set the new profit max unlock time.
                @dev The time is denominated in seconds and must be less than 1 year.
                    We only need to update locking period if setting to 0,
                    since the current period will use the old rate and on the next
                    report it will be reset with the new unlocking time.

                    Setting to 0 will cause any currently locked profit to instantly
                    unlock and an immediate increase in the vaults Price Per Share.

                @param new_profit_max_unlock_time The new profit max unlock time.
                """
                self._enforce_role(msg.sender, Roles.PROFIT_UNLOCK_MANAGER)
                # Must be less than one year for report cycles
                assert (
                    new_profit_max_unlock_time <= 31_556_952
                ), "profit unlock time too long"

                # If setting to 0 we need to reset any locked values.
                if new_profit_max_unlock_time == 0:
                    share_balance: uint256 = self.balance_of[self]
                    if share_balance > 0:
                        # Burn any shares the vault still has.
                        self._burn_shares(share_balance, self)


                    # Reset unlocking variables to 0.
                    self.profit_unlocking_rate = 0
                    self.full_profit_unlock_date = 0

                self.profit_max_unlock_time = new_profit_max_unlock_time

                log UpdateProfitMaxUnlockTime(new_profit_max_unlock_time)

            @external
            @nonreentrant("lock")
            def process_report(strategy: address) -> (uint256, uint256):
                """
                @notice Process the report of a strategy.
                @param strategy The strategy to process the report for.
                @return The gain and loss of the strategy.
                """
                self._enforce_role(msg.sender, Roles.REPORTING_MANAGER)
                return self._process_report(strategy)

            @internal
            def _process_report(strategy: address) -> (uint256, uint256):
                """
                Processing a report means comparing the debt that the strategy has taken
                with the current amount of funds it is reporting. If the strategy owes
                less than it currently has, it means it has had a profit, else (assets < debt)
                it has had a loss.

                Different strategies might choose different reporting strategies: pessimistic,
                only realised P&L, ... The best way to report depends on the strategy.

                The profit will be distributed following a smooth curve over the vaults
                profit_max_unlock_time seconds. Losses will be taken immediately, first from the
                profit buffer (avoiding an impact in pps), then will reduce pps.

                Any applicable fees are charged and distributed during the report as well
                to the specified recipients.

                Can update the vaults `totalIdle` to account for any airdropped tokens by
                passing the vaults address in as the parameter.
                """
                # Cache `asset` for repeated use.
                _asset: address = self.asset

                total_assets: uint256 = 0
                current_debt: uint256 = 0

                if strategy != self:
                    # Make sure we have a valid strategy.
                    assert self.strategies[strategy].activation != 0, "inactive strategy"

                    # Vault assesses profits using 4626 compliant interface.
                    # NOTE: It is important that a strategies `convertToAssets` implementation
                    # cannot be manipulated or else the vault could report incorrect gains/losses.
                    strategy_shares: uint256 = IStrategy(strategy).balanceOf(self)
                    # How much the vaults position is worth.
                    total_assets = IStrategy(strategy).convertToAssets(strategy_shares)
                    # How much the vault had deposited to the strategy.
                    current_debt = self.strategies[strategy].current_debt
                else:
                    # Accrue any airdropped `asset` into `total_idle`
                    total_assets = ERC20(_asset).balanceOf(self)
                    current_debt = self.total_idle

                gain: uint256 = 0
                loss: uint256 = 0

                ### Asses Gain or Loss ###

                # Compare reported assets vs. the current debt.
                if total_assets > current_debt:
                    # We have a gain.
                    gain = unsafe_sub(total_assets, current_debt)
                else:
                    # We have a loss.
                    loss = unsafe_sub(current_debt, total_assets)


                ### Asses Fees and Refunds ###
                total_fees: uint256 = 0
                total_refunds: uint256 = 0
                # If accountant is not set, fees and refunds remain unchanged.
                accountant: address = self.accountant
                if accountant != empty(address):
                    total_fees, total_refunds = IAccountant(accountant).report(
                        strategy, gain, loss
                    )

                    if total_refunds > 0:
                        # Make sure we have enough approval and enough asset to pull.
                        total_refunds = min(
                            total_refunds,
                            min(
                                ERC20(_asset).balanceOf(accountant),
                                ERC20(_asset).allowance(accountant, self),
                            ),
                        )

                # Total fees to charge in shares.
                total_fees_shares: uint256 = 0
                # For Protocol fee assessment.
                protocol_fee_bps: uint16 = 0
                protocol_fees_shares: uint256 = 0
                protocol_fee_recipient: address = empty(address)
                # `shares_to_burn` is derived from amounts that would reduce the vaults PPS.
                # NOTE: this needs to be done before any pps changes
                shares_to_burn: uint256 = 0
                # Only need to burn shares if there is a loss or fees.
                if loss + total_fees > 0:
                    # The amount of shares we will want to burn to offset losses and fees.
                    shares_to_burn = self._convert_to_shares(
                        loss + total_fees, Rounding.ROUND_UP
                    )

                    # If we have fees then get the proportional amount of shares to issue.
                    if total_fees > 0:
                        # Get the total amount shares to issue for the fees.
                        total_fees_shares = (
                            shares_to_burn * total_fees / (loss + total_fees)
                        )

                        # Get the protocol fee config for this vault.
                        protocol_fee_bps, protocol_fee_recipient = IFactory(
                            self.factory
                        ).protocol_fee_config()

                        # If there is a protocol fee.
                        if protocol_fee_bps > 0:
                            # Get the percent of fees to go to protocol fees.
                            protocol_fees_shares = (
                                total_fees_shares
                                * convert(protocol_fee_bps, uint256)
                                / MAX_BPS
                            )


                # Shares to lock is any amount that would otherwise increase the vaults PPS.
                shares_to_lock: uint256 = 0
                profit_max_unlock_time: uint256 = self.profit_max_unlock_time
                # Get the amount we will lock to avoid a PPS increase.
                if gain + total_refunds > 0 and profit_max_unlock_time != 0:
                    shares_to_lock = self._convert_to_shares(
                        gain + total_refunds, Rounding.ROUND_DOWN
                    )


                # The total current supply including locked shares.
                total_supply: uint256 = self.total_supply
                # The total shares the vault currently owns. Both locked and unlocked.
                total_locked_shares: uint256 = self.balance_of[self]
                # Get the desired end amount of shares after all accounting.
                ending_supply: uint256 = (
                    total_supply + shares_to_lock - shares_to_burn - self._unlocked_shares()
                )

                # If we will end with more shares than we have now.
                if ending_supply > total_supply:
                    # Issue the difference.
                    self._issue_shares(unsafe_sub(ending_supply, total_supply), self)


                # Else we need to burn shares.
                elif total_supply > ending_supply:
                    # Can't burn more than the vault owns.
                    to_burn: uint256 = min(
                        unsafe_sub(total_supply, ending_supply), total_locked_shares
                    )
                    self._burn_shares(to_burn, self)


                # Adjust the amount to lock for this period.
                if shares_to_lock > shares_to_burn:
                    # Don't lock fees or losses.
                    shares_to_lock = unsafe_sub(shares_to_lock, shares_to_burn)
                else:
                    shares_to_lock = 0


                # Pull refunds
                if total_refunds > 0:
                    # Transfer the refunded amount of asset to the vault.
                    self._erc20_safe_transfer_from(_asset, accountant, self, total_refunds)
                    # Update storage to increase total assets.
                    self.total_idle += total_refunds


                # Record any reported gains.
                if gain > 0:
                    # NOTE: this will increase total_assets
                    current_debt = unsafe_add(current_debt, gain)
                    if strategy != self:
                        self.strategies[strategy].current_debt = current_debt
                        self.total_debt += gain
                    else:
                        self.total_idle += gain

                # Or record any reported loss
                elif loss > 0:
                    current_debt = unsafe_sub(current_debt, loss)
                    if strategy != self:
                        self.strategies[strategy].current_debt = current_debt
                        self.total_debt -= loss
                    else:
                        self.total_idle -= loss

                # Issue shares for fees that were calculated above if applicable.
                if total_fees_shares > 0:
                    # Accountant fees are (total_fees - protocol_fees).
                    self._issue_shares(total_fees_shares - protocol_fees_shares, accountant)

                    # If we also have protocol fees.
                    if protocol_fees_shares > 0:
                        self._issue_shares(protocol_fees_shares, protocol_fee_recipient)

                # Update unlocking rate and time to fully unlocked.
                total_locked_shares = self.balance_of[self]
                if total_locked_shares > 0:
                    previously_locked_time: uint256 = 0
                    _full_profit_unlock_date: uint256 = self.full_profit_unlock_date
                    # Check if we need to account for shares still unlocking.
                    if _full_profit_unlock_date > block.timestamp:
                        # There will only be previously locked shares if time remains.
                        # We calculate this here since it will not occur every time we lock shares.
                        previously_locked_time = (total_locked_shares - shares_to_lock) * (
                            _full_profit_unlock_date - block.timestamp
                        )


                    # new_profit_locking_period is a weighted average between the remaining time of the previously locked shares and the profit_max_unlock_time
                    new_profit_locking_period: uint256 = (
                        previously_locked_time + shares_to_lock * profit_max_unlock_time
                    ) / total_locked_shares
                    # Calculate how many shares unlock per second.
                    self.profit_unlocking_rate = (
                        total_locked_shares * MAX_BPS_EXTENDED / new_profit_locking_period
                    )
                    # Calculate how long until the full amount of shares is unlocked.
                    self.full_profit_unlock_date = (
                        block.timestamp + new_profit_locking_period
                    )
                    # Update the last profitable report timestamp.
                    self.last_profit_update = block.timestamp
                else:
                    # NOTE: only setting this to the 0 will turn in the desired effect,
                    # no need to update profit_unlocking_rate
                    self.full_profit_unlock_date = 0


                # Record the report of profit timestamp.
                self.strategies[strategy].last_report = block.timestamp

                # We have to recalculate the fees paid for cases with an overall loss or no profit locking
                if loss + total_fees > gain + total_refunds or profit_max_unlock_time == 0:
                    total_fees = self._convert_to_assets(
                        total_fees_shares, Rounding.ROUND_DOWN
                    )

                log StrategyReported(
                    strategy,
                    gain,
                    loss,
                    current_debt,
                    total_fees
                    * convert(protocol_fee_bps, uint256)
                    / MAX_BPS,  # Protocol Fees
                    total_fees,
                    total_refunds,
                )

                return (gain, loss)
            ```


    === "Example"

        ```shell
        >>> RewardsHandler.process_report(todo)
        ''
        ```


---


## **Other Methods**

### `vault`
!!! description "`RewardsHandler.vault() -> address: view`"

    Getter for the [YearnV3 vault contract](https://github.com/yearn/yearn-vaults-v3). This value is set at initialization of the contract and cannot be changed.

    Returns: YearnV3 vault (`address`).

    ??? quote "Source code"

        === "RewardsHandler.vy"

            ```python
            # yearn vault's interface
            from interfaces import IVault

            vault: public(immutable(IVault))

            @deploy
            def __init__(
                _stablecoin: IERC20,
                _vault: IVault,
                minimum_weight: uint256,
                controller_factory: lens.IControllerFactory,
                admin: address,
            ):
                lens.__init__(controller_factory)

                # initialize access control
                access_control.__init__()
                # admin (most likely the dao) controls who can be a rate manager
                access_control._grant_role(access_control.DEFAULT_ADMIN_ROLE, admin)
                # admin itself is a RATE_ADMIN
                access_control._grant_role(RATE_MANAGER, admin)
                # deployer does not control this contract
                access_control._revoke_role(access_control.DEFAULT_ADMIN_ROLE, msg.sender)

                twa.__init__(
                    WEEK,  # twa_window = 1 week
                    1,  #  min_snapshot_dt_seconds = 1 second (if 0, then spam is possible)
                )

                self._set_minimum_weight(minimum_weight)

                stablecoin = _stablecoin
                vault = _vault
            ```

        === "IVault.vy"

            ```python
            # pragma version ~=0.4


            @external
            def setProfitMaxUnlockTime(new_profit_max_unlock_time: uint256):
                ...


            @external
            def process_report(strategy: address) -> (uint256, uint256):
                ...
            ```

    === "Example"

        ```shell
        >>> RewardsHandler.vault()
        'tbd'
        ```


### `stablecoin`
!!! description "`RewardsHandler.stablecoin() -> address: view`"

    Getter for the crvUSD stablecoin address. This value is set at initialization of the contract and cannot be changed.

    Returns: crvUSD stablecoin (`address`).

    ??? quote "Source code"

        === "RewardsHandler.vy"

            ```python
            stablecoin: immutable(IERC20)

            @deploy
            def __init__(
                _stablecoin: IERC20,
                _vault: IVault,
                minimum_weight: uint256,
                controller_factory: lens.IControllerFactory,
                admin: address,
            ):
                lens.__init__(controller_factory)

                # initialize access control
                access_control.__init__()
                # admin (most likely the dao) controls who can be a rate manager
                access_control._grant_role(access_control.DEFAULT_ADMIN_ROLE, admin)
                # admin itself is a RATE_ADMIN
                access_control._grant_role(RATE_MANAGER, admin)
                # deployer does not control this contract
                access_control._revoke_role(access_control.DEFAULT_ADMIN_ROLE, msg.sender)

                twa.__init__(
                    WEEK,  # twa_window = 1 week
                    1,  #  min_snapshot_dt_seconds = 1 second (if 0, then spam is possible)
                )

                self._set_minimum_weight(minimum_weight)

                stablecoin = _stablecoin
                vault = _vault
            ```

    === "Example"

        ```shell
        >>> RewardsHandler.stablecoin()
        '0xf939E0A03FB07F59A73314E73794Be0E57ac1b4E'
        ```


### `supportsInterface`
!!! description "`RewardsHandler.supportsInterface(_interfaceId: bytes32) -> bool: view`"

    Function to check if the contract implements a specific interface.

    Returns: `True` if the contract implements the interface, `False` otherwise.

    | Input          | Type     | Description           |
    | -------------- | -------- | --------------------- |
    | `interface_id` | `bytes4` | Interface ID to check |

    ??? quote "Source code"

        === "RewardsHandler.vy"

            ```python
            _SUPPORTED_INTERFACES: constant(bytes4[3]) = [
                0x01FFC9A7,  # The ERC-165 identifier for ERC-165.
                0x7965DB0B,  # The ERC-165 identifier for `IAccessControl`.
                0xA1AAB33F,  # The ERC-165 identifier for the dynamic weight interface.
            ]

            @external
            @view
            def supportsInterface(interface_id: bytes4) -> bool:
                """
                @dev Returns `True` if this contract implements the interface defined by
                `interface_id`.
                @param interface_id The 4-byte interface identifier.
                @return bool The verification whether the contract implements the
                interface or not.
                """
                return interface_id in _SUPPORTED_INTERFACES
            ```

    === "Example"

        This example checks if the `RewardsHandler` contract implements the dynamic weight interface from the `FeeSplitter` contract.

        ```shell
        >>> RewardsHandler.supportsInterface('0xA1AAB33F')
        'True'
        ```


### `recover_erc20`
!!! description "`RewardsHandler.recover_erc20(token: IERC20, receiver: address)`"

    !!!guard "Guarded Method by Snekmate 🐍"
        This contract makes use of a Snekmate module to manage roles and permissions. This specific function is restricted to the `RATE_MANAGER` role.

    Function to recover funds accidently sent to the contract. This function can not recover `crvUSD` tokens as any `crvUSD` tokens sent to the contract are considered as donations and will be distributed to stakers.

    | Input      | Type      | Description                            |
    | ---------- | --------- | -------------------------------------- |
    | `token`    | `IERC20`  | Address of the token to recover        |
    | `receiver` | `address` | Receier address of the recovered funds |

    ??? quote "Source code"

        === "RewardsHandler.vy"

            ```python
            from ethereum.ercs import IERC20

            RATE_MANAGER: constant(bytes32) = keccak256("RATE_MANAGER")

            @external
            def recover_erc20(token: IERC20, receiver: address):
                """
                @notice This is a helper function to let an admin rescue funds sent by
                mistake to this contract. crvUSD cannot be recovered as it's part of the
                core logic of this contract.
                """
                access_control._check_role(RATE_MANAGER, msg.sender)

                # if crvUSD was sent by accident to the contract the funds are lost and
                # will be distributed as staking rewards on the next `process_rewards`
                # call.
                assert token != stablecoin, "can't recover crvusd"

                # when funds are recovered the whole balanced is sent to a trusted address.
                balance_to_recover: uint256 = staticcall token.balanceOf(self)

                assert extcall token.transfer(
                    receiver, balance_to_recover, default_return_value=True
                )
            ```

    === "Example"

        In this example, all [`wETH`](https://etherscan.io/token/0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2) tokens sent to the contract are recovered and sent to [Curve Fee Collector](https://etherscan.io/address/0xa2Bcd1a4Efbd04B63cd03f5aFf2561106ebCCE00).

        ```shell
        >>> RewardsHandler.recover_erc20('0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', '0xa2Bcd1a4Efbd04B63cd03f5aFf2561106ebCCE00')
        ```
