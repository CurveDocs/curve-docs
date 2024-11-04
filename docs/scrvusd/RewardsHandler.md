<h1>RewardsHandler.vy</h1>

<script src="/assets/javascripts/contracts/scrvusd/rewards-handler.js"></script>
<script src="https://cdn.jsdelivr.net/npm/web3@1.5.2/dist/web3.min.js"></script>


The `RewardsHandler` contract manages the distribution of crvUSD rewards to `Savings crvUSD (scrvUSD)`. The contract takes snapshots of the ratio of crvUSD deposited into the Vault relative to the total circulating supply of crvUSD to calculate a time-weighted average of this ratio to determine the amount of rewards to request from the `FeeSplitter`.

???+ quote "`RewardsHandler.vy`"
    The source code for the `RewardsHandler.vy` contract is available on [:material-github: GitHub](https://github.com/curvefi/scrvusd/blob/main/contracts/RewardsHandler.vy). The contract is written in [Vyper](https://github.com/vyperlang/vyper) version `~=0.4`.

    The contract is deployed on :logos-ethereum: Ethereum at [`0xe8d1e2531761406af1615a6764b0d5ff52736f56`](https://etherscan.io/address/0xe8d1e2531761406af1615a6764b0d5ff52736f56).

    The source code was audited by [:logos-chainsecurity: ChainSecurity](https://www.chainsecurity.com/). The audit report will be available soon.


---


# **General Explainer**

The weight allocated to the `RewardsHandler` in the `FeeSplitter` is determined by the time-weighted average of the ratio of crvUSD deposited into the Vault compared to the total circulating supply of crvUSD. The weight allocated to the `RewardsHandler` can be permissionlessly distributed as rewards to the `Savings Vault (scrvUSD)` by anyone calling the [`process_rewards`](#process_rewards) function.

To calculate this time-weighted average, the `RewardsHandler` uses a `TWA module` that takes snapshots of the deposited supply ratio and stores them in a `Snapshot` struct. All structs are stored in a dynamic array called `snapshots`. Each snapshot includes a ratio value and the timestamp at which it was taken.


??? quote "Source code for snapshot calculation and storage"

    === "RewardsHandler.vy"

        ```python
        from contracts.interfaces import IStablecoinLens

        @external
        def take_snapshot():
            """
            @notice Function that anyone can call to take a snapshot of the current
            deposited supply ratio in the vault. This is used to compute the time-weighted
            average of the TVL to decide on the amount of rewards to ask for (weight).

            @dev There's no point in MEVing this snapshot as the rewards distribution rate
            can always be reduced (if a malicious actor inflates the value of the snapshot)
            or the minimum amount of rewards can always be increased (if a malicious actor
            deflates the value of the snapshot).
            """
            self._take_snapshot()

        @internal
        def _take_snapshot():
            """
            @notice Internal function to take a snapshot of the current deposited supply
            ratio in the vault.
            """
            # get the circulating supply from a helper contract.
            # supply in circulation = controllers' debt + peg keppers' debt
            circulating_supply: uint256 = staticcall self.stablecoin_lens.circulating_supply()

            # obtain the supply of crvUSD contained in the vault by checking its totalAssets.
            # This will not take into account rewards that are not yet distributed.
            supply_in_vault: uint256 = staticcall vault.totalAssets()

            # here we intentionally reduce the precision of the ratio because the
            # dynamic weight interface expects a percentage in BPS.
            supply_ratio: uint256 = supply_in_vault * MAX_BPS // circulating_supply

            twa._take_snapshot(supply_ratio)
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
            @notice Compute the circulating supply for crvUSD, `totalSupply` is incorrect
            since it takes into account all minted crvUSD (i.e. flashloans)

            @dev This function sacrifices some gas to fetch peg keepers from a unique source
            of truth to avoid having to manually maintain multiple lists across several
            contracts. For this reason we read the list of peg keepers contained in the
            monetary policy returned by a controller in the factory. factory -> weth
            controller -> monetary policy -> peg keepers This function is not exposed as
            external as it can be easily manipulated and should not be used by third party
            contracts.
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
        event SnapshotTaken:
            value: uint256
            timestamp: uint256

        snapshots: public(DynArray[Snapshot, MAX_SNAPSHOTS])
        min_snapshot_dt_seconds: public(uint256)  # Minimum time between snapshots in seconds
        twa_window: public(uint256)  # Time window in seconds for TWA calculation
        last_snapshot_timestamp: public(uint256)  # Timestamp of the last snapshot

        @internal
        def _take_snapshot(_value: uint256):
            """
            @notice Stores a snapshot of the tracked value.
            @param _value The value to store.
            """
            if (len(self.snapshots) == 0) or (  # First snapshot
                self.last_snapshot_timestamp + self.min_snapshot_dt_seconds <= block.timestamp # after dt
            ):
                self.last_snapshot_timestamp = block.timestamp
                self.snapshots.append(
                    Snapshot(tracked_value=_value, timestamp=block.timestamp)
                )  # store the snapshot into the DynArray
                log SnapshotTaken(_value, block.timestamp)
        ```

---


# **Snapshots**

Snapshots are used to calculate the time-weighted average (TWA) of the ratio between crvUSD deposited into the Vault and the total circulating supply of crvUSD. Each snapshot stores the ratio of crvUSD deposited in the Vault to the circulating supply of crvUSD, along with the timestamp when the snapshot was taken. Taking a snapshot is fully permissionless—anyone can take one by calling the [`take_snapshot`](#take_snapshot) function. The snapshot values are stored in a `Snapshot` struct, and each struct is saved in a dynamic array called `snapshots`.

```vyper
MAX_SNAPSHOTS: constant(uint256) = 10**18  # 31.7 billion years if snapshot every second

snapshots: public(DynArray[Snapshot, MAX_SNAPSHOTS])

struct Snapshot:
    tracked_value: uint256
    timestamp: uint256
```

Snapshots can only be taken once a minimum time interval ([`min_snapshot_dt_seconds`](#min_snapshot_dt_seconds)) has passed since the last one. The TWA is then computed using the trapezoidal rule, iterating over the stored snapshots in reverse chronological order to calculate the weighted average of the tracked value over the specified time window ([`twa_window`](#twa_window)).

*Snapshots are taken by calling the [`take_snapshot`](#take_snapshot) function. When this function is called, the snapshot value is computed and stored as follows:*

1. **Determine the circulating supply of crvUSD.** Directly calling `crvUSD.totalSupply()` is not feasible because some crvUSD is minted to specific contracts and is not part of the circulating supply (e.g., unborrowed crvUSD held by Controllers, crvUSD allocated to PegKeepers, or crvUSD assigned to the [`FlashLender`](../crvUSD/flashlender.md)). Therefore, the [`StablecoinLens`](./StablecoinLens.md) contract is used to obtain the actual circulating supply of crvUSD.
   
2. **Obtain the amount of crvUSD held in the Vault** by calling `Vault.totalAssets()`, which excludes rewards that have not yet been distributed.

3. **Calculate the supply ratio** as follows:
   
    $$\text{SupplyRatio} = \frac{\text{SupplyInVault} \times 10^{18}}{\text{CirculatingSupply}}$$

4. **Store the calculated supply ratio** and the timestamp at which the snapshot was taken in the dynamic array.

---

### `take_snapshot`
!!! description "`RewardsHandler.take_snapshot()`"

    !!!warning "MEVing Snapshot Taking"
        There's no point in MEVing this snapshot as the rewards distribution rate can always be reduced (if a malicious actor inflates the value of the snapshot) or the minimum amount of rewards can always be increased (if a malicious actor deflates the value of the snapshot).

    Function to take a snapshot of the current deposited supply ratio in the Vault. This function is fully permissionless and can be called by anyone. Snapshots are used to compute the time-weighted average of the TVL to decide on the amount of rewards to ask for (weight). 
    
    Minimum time inbetween snapshots is defined by `min_snapshot_dt_seconds`. The maximum number of snapshots is set to `10^18`, which is equivalent to 31.7 billion years if a snapshot were to be taken every second.

    Emits: `SnapshotTaken` event.

    ??? quote "Source code"

        === "RewardsHandler.vy"

            ```python
            @external
            def take_snapshot():
                """
                @notice Function that anyone can call to take a snapshot of the current
                deposited supply ratio in the vault. This is used to compute the time-weighted
                average of the TVL to decide on the amount of rewards to ask for (weight).

                @dev There's no point in MEVing this snapshot as the rewards distribution rate
                can always be reduced (if a malicious actor inflates the value of the snapshot)
                or the minimum amount of rewards can always be increased (if a malicious actor
                deflates the value of the snapshot).
                """
                self._take_snapshot()

            @internal
            def _take_snapshot():
                """
                @notice Internal function to take a snapshot of the current deposited supply
                ratio in the vault.
                """
                # get the circulating supply from a helper contract.
                # supply in circulation = controllers' debt + peg keppers' debt
                circulating_supply: uint256 = staticcall self.stablecoin_lens.circulating_supply()

                # obtain the supply of crvUSD contained in the vault by checking its totalAssets.
                # This will not take into account rewards that are not yet distributed.
                supply_in_vault: uint256 = staticcall vault.totalAssets()

                # here we intentionally reduce the precision of the ratio because the
                # dynamic weight interface expects a percentage in BPS.
                supply_ratio: uint256 = supply_in_vault * MAX_BPS // circulating_supply

                twa._take_snapshot(supply_ratio)
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
                @notice Compute the circulating supply for crvUSD, `totalSupply` is incorrect
                since it takes into account all minted crvUSD (i.e. flashloans)

                @dev This function sacrifices some gas to fetch peg keepers from a unique source
                of truth to avoid having to manually maintain multiple lists across several
                contracts. For this reason we read the list of peg keepers contained in the
                monetary policy returned by a controller in the factory. factory -> weth
                controller -> monetary policy -> peg keepers This function is not exposed as
                external as it can be easily manipulated and should not be used by third party
                contracts.
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
            event SnapshotTaken:
                value: uint256
                timestamp: uint256

            MAX_SNAPSHOTS: constant(uint256) = 10**18  # 31.7 billion years if snapshot every second

            snapshots: public(DynArray[Snapshot, MAX_SNAPSHOTS])
            min_snapshot_dt_seconds: public(uint256)  # Minimum time between snapshots in seconds
            twa_window: public(uint256)  # Time window in seconds for TWA calculation
            last_snapshot_timestamp: public(uint256)  # Timestamp of the last snapshot

            struct Snapshot:
                tracked_value: uint256
                timestamp: uint256

            @internal
            def _take_snapshot(_value: uint256):
                """
                @notice Stores a snapshot of the tracked value.
                @param _value The value to store.
                """
                if (len(self.snapshots) == 0) or (  # First snapshot
                    self.last_snapshot_timestamp + self.min_snapshot_dt_seconds <= block.timestamp # after dt
                ):
                    self.last_snapshot_timestamp = block.timestamp
                    self.snapshots.append(
                        Snapshot(tracked_value=_value, timestamp=block.timestamp)
                    )  # store the snapshot into the DynArray
                    log SnapshotTaken(_value, block.timestamp)
            ```

    === "Example"

        ```shell
        >>> RewardsHandler.take_snapshot()
        ```


### `snapshots`
!!! description "`TWA.snapshots(arg: uint256) -> DynArray[Snapshot, MAX_SNAPSHOTS]`"

    Getter for a `Snapshot` struct at a specific index. First snapshot is at index `0`, second at index `1`, etc.

    Returns: `Snapshot` struct containing the ratio of deposited crvUSD into the Vault to the total circulating supply of crvUSD (`uint256`) and the timestamp (`uint256`).

    | Input | Type      | Description                          |
    | ----- | --------- | ------------------------------------ |
    | `arg` | `uint256` | Index of the snapshot to return       |

    ??? quote "Source code"

        === "TWA.vy"

            ```python
            event SnapshotTaken:
                value: uint256
                timestamp: uint256

            MAX_SNAPSHOTS: constant(uint256) = 10**18  # 31.7 billion years if snapshot every second

            snapshots: public(DynArray[Snapshot, MAX_SNAPSHOTS])

            struct Snapshot:
                tracked_value: uint256
                timestamp: uint256

            @internal
            def _take_snapshot(_value: uint256):
                """
                @notice Stores a snapshot of the tracked value.
                @param _value The value to store.
                """
                if self.last_snapshot_timestamp + self.min_snapshot_dt_seconds <= block.timestamp:
                    self.last_snapshot_timestamp = block.timestamp
                    self.snapshots.append(
                        Snapshot(tracked_value=_value, timestamp=block.timestamp)
                    )  # store the snapshot into the DynArray
                    log SnapshotTaken(_value, block.timestamp)
            ```

    === "Example"

        :material-information-outline:{ title='This interactive example fetches the output directly on-chain.' } In this example, the address and weight of a receiver at a specific index is returned.

        <div class="highlight">
        <pre><code>>>> RewardsHandler.snapshots(<input id="snapshotIndex" type="number" value="0" min="0" 
        style="width: 50px; 
            background: transparent; 
            border: none; 
            border-bottom: 1px solid #ccc; 
            color: inherit; 
            font-family: inherit; 
            font-size: inherit; 
            -moz-appearance: textfield;" 
            oninput="fetchSnapshot()"/>)
        <span id="snapshotOutput"></span></code></pre>
        </div>

        <style>
        input[type=number]::-webkit-inner-spin-button, 
        input[type=number]::-webkit-outer-spin-button {
            -webkit-appearance: none;
            margin: 0;
        }
        </style>


### `min_snapshot_dt_seconds`
!!! description "`TWA.min_snapshot_dt_seconds() -> uint256: view`"

    Getter for the minimum time between snapshots in seconds. This value can be changed using the [`set_twa_snapshot_dt`](#set_twa_snapshot_dt) function.

    Returns: minimum time between snapshots in seconds (`uint256`).

    ??? quote "Source code"

        === "TWA.vy"

            ```python
            min_snapshot_dt_seconds: public(uint256)  # Minimum time between snapshots in seconds

            @deploy
            def __init__(_twa_window: uint256, _min_snapshot_dt_seconds: uint256):
                self._set_twa_window(_twa_window)
                self._set_snapshot_dt(max(1, _min_snapshot_dt_seconds))
            ```

    === "Example"

        :material-information-outline:{ title='This interactive example fetches the output directly on-chain.' } This example returns the minimum time between snapshots in seconds.

        <div class="highlight">
        <pre><code>>>> RewardsHandler.min_snapshot_dt_seconds() <span id="minSnapshotDtSecondsOutput"></span></code></pre>
        </div>



### `last_snapshot_timestamp`
!!! description "`TWA.last_snapshot_timestamp() -> uint256: view`"

    Getter for the timestamp of the last snapshot taken. This variable is adjusted each time a snapshot is taken.

    Returns: timestamp of the last snapshot taken (`uint256`).

    ??? quote "Source code"

        === "TWA.vy"

            ```python
            last_snapshot_timestamp: public(uint256)  # Timestamp of the last snapshot

            @internal
            def _take_snapshot(_value: uint256):
                """
                @notice Stores a snapshot of the tracked value.
                @param _value The value to store.
                """
                if self.last_snapshot_timestamp + self.min_snapshot_dt_seconds <= block.timestamp:
                    self.last_snapshot_timestamp = block.timestamp
                    self.snapshots.append(
                        Snapshot(tracked_value=_value, timestamp=block.timestamp)
                    )  # store the snapshot into the DynArray
                    log SnapshotTaken(_value, block.timestamp)
            ```

    === "Example"

        :material-information-outline:{ title='This interactive example fetches the output directly on-chain.' } This example returns the timestamp of the last snapshot taken.

        <div class="highlight">
        <pre><code>>>> RewardsHandler.last_snapshot_timestamp() <span id="lastSnapshotTimestampOutput"></span></code></pre>
        </div>


### `get_len_snapshots`
!!! description "`TWA.get_len_snapshots() -> uint256: view`"

    Getter for the total number of snapshots taken and stored. Increments by one each time a snapshot is taken.

    Returns: total number of snapshots stored (`uint256`).

    ??? quote "Source code"

        === "TWA.vy"

            ```python
            snapshots: public(DynArray[Snapshot, MAX_SNAPSHOTS])

            @external
            @view
            def get_len_snapshots() -> uint256:
                """
                @notice Returns the number of snapshots stored.
                """
                return len(self.snapshots)
            ```

    === "Example"

        :material-information-outline:{ title='This interactive example fetches the output directly on-chain.' } This example returns the total number of snapshots stored.

        <div class="highlight">
        <pre><code>>>> RewardsHandler.get_len_snapshots() <span id="lenSnapshotsOutput"></span></code></pre>
        </div>


---


# **Weights and TWA**

The `weight` represents the percentage of the total rewards requested from the `FeeSplitter`. This value is denominated in 10000 BPS (100%). E.g. if the weight is 500, then RewardsHandler will request 5% of the total rewards from the `FeeSplitter`.

The `weight` is computed as a time-weighted average (TWA) of the ratio between deposited crvUSD in the Vault and total circulating supply of crvUSD.

Weight calculation is handled using a time-weighted average (TWA) module. While this module can be used to calculate any kind of time-weighted value, the scrvUSD system uses it to compute the time-weighted average of the deposited crvUSD in the Vault compared to the total circulating crvUSD supply.

The value is calculated over a specified time window defined by `twa_window` by iterating backwards over the snapshots stored in the `snapshots` dynamic array.


### `compute_twa`
!!! description "`TWA.compute_twa() -> uint256: view`"

    Function to compute the time-weighted average of the ratio between deposited crvUSD in the Vault and total circulating supply of crvUSD by iterating over the stored snapshots in reverse chronological order.

    Returns: time-weighted average of the ratio between deposited crvUSD and total circulating supply of crvUSD (`uint256`).

    ??? quote "Source code"

        === "TWA.vy"

            ```python
            snapshots: public(DynArray[Snapshot, MAX_SNAPSHOTS])
            min_snapshot_dt_seconds: public(uint256)  # Minimum time between snapshots in seconds
            twa_window: public(uint256)  # Time window in seconds for TWA calculation
            last_snapshot_timestamp: public(uint256)  # Timestamp of the last snapshot

            
            struct Snapshot:
                tracked_value: uint256
                timestamp: uint256

            @external
            @view
            def compute_twa() -> uint256:
                """
                @notice External endpoint for _compute() function.
                """
                return self._compute()

            @internal
            @view
            def _compute() -> uint256:
                """
                @notice Computes the TWA over the specified time window by iterating backwards over the snapshots.
                @return The TWA for tracked value over the self.twa_window.
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
                    if i != 0:  # If not the first iteration (last snapshot), get the next snapshot
                        next_snapshot = self.snapshots[i_backwards + 1]

                    # Time Axis (Increasing to the Right) --->
                    #                                        SNAPSHOT
                    # |---------|---------|---------|------------------------|---------|---------|
                    # t0   time_window_start      interval_start        interval_end      block.timestamp (Now)

                    interval_start: uint256 = current_snapshot.timestamp
                    # Adjust interval start if it is before the time window start
                    if interval_start < time_window_start:
                        interval_start = time_window_start

                    interval_end: uint256 = interval_start
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

                if total_time == 0 and len(self.snapshots) == 1:
                    # case when only snapshot is taken in the block where computation is called
                    return self.snapshots[0].tracked_value

                assert total_time > 0, "Zero total time!"
                twa: uint256 = total_weighted_tracked_value // total_time
                return twa
            ```

    === "Example"

        :material-information-outline:{ title='This interactive example fetches the output directly on-chain.' } This example returns the time-weighted average of the ratio between staked supply and total supply of crvUSD.

        <div class="highlight">
        <pre><code>>>> RewardsHandler.compute_twa() <span id="computeTWAOutput"></span></code></pre>
        </div>


### `twa_window`
!!! description "`TWA.twa_window() -> uint256: view`"

    Getter for the time window in seconds which is applied to the TWA calculation, essentially the length of the time window over which the TWA is computed. This value can be changed using the [`set_twa_window`](#set_twa_window) function.

    Returns: time window in seconds for TWA calculation (`uint256`).

    ??? quote "Source code"

        === "TWA.vy"

            ```python
            twa_window: public(uint256)  # Time window in seconds for TWA calculation

            @deploy
            def __init__(_twa_window: uint256, _min_snapshot_dt_seconds: uint256):
                self._set_twa_window(_twa_window)
                self._set_snapshot_dt(max(1, _min_snapshot_dt_seconds))
            ```

    === "Example"

        :material-information-outline:{ title='This interactive example fetches the output directly on-chain.' } This example returns the time window in seconds for TWA calculation.

        <div class="highlight">
        <pre><code>>>> RewardsHandler.twa_window() <span id="twaWindowOutput"></span></code></pre>
        </div>



### `weight`
!!! description "`RewardsHandler.weight() -> uint256: view`"

    Getter for the weight of the rewards. This is the time-weighted average of the ratio between deposited crvUSD in the Vault and total circulating supply of crvUSD. This function is part of the dynamic weight interface expected by the `FeeSplitter` to know what percentage of funds should be sent for rewards distribution. Weight value is denominated in 10000 BPS (100%). E.g. if the weight is 2000, then `RewardsHandler` will request 20% of the total rewards from the `FeeSplitter`.

    Returns: requested weight (`uint256`).

    ??? quote "Source code"

        === "RewardsHandler.vy"

            ```python
            MAX_BPS: constant(uint256) = 10**4  # 100%

            # scaling factor for the deposited token / circulating supply ratio.
            scaling_factor: public(uint256)

            # the minimum amount of rewards requested to the FeeSplitter.
            minimum_weight: public(uint256)

            @external
            @view
            def weight() -> uint256:
                """
                @notice this function is part of the dynamic weight interface expected by the
                FeeSplitter to know what percentage of funds should be sent for rewards
                distribution to scrvUSD vault depositors.
                @dev `minimum_weight` acts as a lower bound for the percentage of rewards that
                should be distributed to depositors. This is useful to bootstrapping TVL by asking
                for more at the beginning and can also be increased in the future if someone
                tries to manipulate the time-weighted average of the tvl ratio.
                """
                raw_weight: uint256 = twa._compute() * self.scaling_factor // MAX_BPS
                return max(raw_weight, self.minimum_weight)
            ```

        === "TWA.vy"

            ```python
            MAX_SNAPSHOTS: constant(uint256) = 10**18  # 31.7 billion years if snapshot every second

            snapshots: public(DynArray[Snapshot, MAX_SNAPSHOTS])
            min_snapshot_dt_seconds: public(uint256)  # Minimum time between snapshots in seconds
            twa_window: public(uint256)  # Time window in seconds for TWA calculation
            last_snapshot_timestamp: public(uint256)  # Timestamp of the last snapshot

            struct Snapshot:
                tracked_value: uint256  # In 1e18 precision
                timestamp: uint256

            @internal
            @view
            def _compute() -> uint256:
                """
                @notice Computes the TWA over the specified time window by iterating backwards over the snapshots.
                @return The TWA for tracked value over the self.twa_window.
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
                    if i != 0:  # If not the first iteration (last snapshot), get the next snapshot
                        next_snapshot = self.snapshots[i_backwards + 1]

                    # Time Axis (Increasing to the Right) --->
                    #                                        SNAPSHOT
                    # |---------|---------|---------|------------------------|---------|---------|
                    # t0   time_window_start      interval_start        interval_end      block.timestamp (Now)

                    interval_start: uint256 = current_snapshot.timestamp
                    # Adjust interval start if it is before the time window start
                    if interval_start < time_window_start:
                        interval_start = time_window_start

                    interval_end: uint256 = interval_start
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

                if total_time == 0 and len(self.snapshots) == 1:
                    # case when only snapshot is taken in the block where computation is called
                    return self.snapshots[0].tracked_value

                assert total_time > 0, "Zero total time!"
                twa: uint256 = total_weighted_tracked_value // total_time
                return twa
            ```

    === "Example"

        :material-information-outline:{ title='This interactive example fetches the output directly on-chain.' } This example returns the weight the `FeeSplitter` will request from the `RewardsHandler`.

        <div class="highlight">
        <pre><code>>>> RewardsHandler.weight() <span id="weightOutput"></span></code></pre>
        </div>


### `minimum_weight`
!!! description "`RewardsHandler.minimum_weight() -> uint256: view`"

    Getter for the minimum weight. This is the minimum weight requested from the `FeeSplitter`. Value is set at initialization and can be changed by the [`set_minimum_weight`](#set_minimum_weight) function.

    Returns: minimum weight (`uint256`).

    ??? quote "Source code"

        === "RewardsHandler.vy"

            ```python
            # the minimum amount of rewards requested to the FeeSplitter.
            minimum_weight: public(uint256)

            @deploy
            def __init__(
                _stablecoin: IERC20,
                _vault: IVault,
                minimum_weight: uint256,
                scaling_factor: uint256,
                controller_factory: lens.IControllerFactory,
                admin: address,
            ):
                ...
                self._set_minimum_weight(minimum_weight)
                ...
            ```

    === "Example"

        :material-information-outline:{ title='This interactive example fetches the output directly on-chain.' } This example returns the minimum weight the `FeeSplitter` will request from the `RewardsHandler`.

        <div class="highlight">
        <pre><code>>>> RewardsHandler.minimum_weight() <span id="minimumWeightOutput"></span></code></pre>
        </div>


### `scaling_factor`
!!! description "`RewardsHandler.scaling_factor() -> uint256: view`"

    Getter for the scaling factor for the ratio between deposited crvUSD in the Vault and total circulating supply of crvUSD.

    Returns: scaling factor (`uint256`).

    ??? quote "Source code"

        === "RewardsHandler.vy"

            ```python
            # scaling factor for the deposited token / circulating supply ratio.
            scaling_factor: public(uint256)
            ```

    === "Example"

        :material-information-outline:{ title='This interactive example fetches the output directly on-chain.' } This example returns the scaling factor for the ratio between deposited crvUSD in the Vault and total circulating supply of crvUSD.

        <div class="highlight">
        <pre><code>>>> RewardsHandler.scaling_factor() <span id="scalingFactorOutput"></span></code></pre>
        </div>


---


# **Reward Distribution**

Rewards are distributed to the Vault thought the `RewardsHandler` contract using a simple `process_rewards` function. This function permnissionlessly lets anyone distribute rewards to the Savings Vault.

### `process_rewards`
!!! description "`RewardsHandler.process_rewards()`"

    Function to process the crvUSD rewards by transferring the available balance to the Vault and then calling the `process_report` function to start streaming the rewards to scrvUSD. This function is permissionless and can be called by anyone. When calling this function, the contracts entire crvUSD balance will be transferred and used as rewards for the stakers.

    ??? quote "Source code"

        === "RewardsHandler.vy"

            ```python
            # the time over which rewards will be distributed mirror of the private
            # `profit_max_unlock_time` variable from yearn vaults.
            distribution_time: public(uint256)

            @external
            def process_rewards(take_snapshot: bool = True):
                """
                @notice Permissionless function that let anyone distribute rewards (if any) to
                the crvUSD vault.
                """
                # optional (advised) snapshot before distributing the rewards
                if take_snapshot:
                    self._take_snapshot()

                # prevent the rewards from being distributed untill the distribution rate
                # has been set
                assert (staticcall vault.profitMaxUnlockTime() != 0), "rewards should be distributed over time"

                # any crvUSD sent to this contract (usually through the fee splitter, but
                # could also come from other sources) will be used as a reward for scrvUSD
                # vault depositors.
                available_balance: uint256 = staticcall stablecoin.balanceOf(self)

                assert available_balance > 0, "no rewards to distribute"

                # we distribute funds in 2 steps:
                # 1. transfer the actual funds
                extcall stablecoin.transfer(vault.address, available_balance)
                # 2. start streaming the rewards to users
                extcall vault.process_report(vault.address)
            ```

        === "Vault.vy"

            ```python
            # The amount of time profits will unlock over.
            profit_max_unlock_time: uint256

            @view
            @external
            def profitMaxUnlockTime() -> uint256:
                """
                @notice Gets the current time profits are set to unlock over.
                @return The current profit max unlock time.
                """
                return self.profit_max_unlock_time

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

                # For Accountant fee assessment.
                total_fees: uint256 = 0
                total_refunds: uint256 = 0
                # If accountant is not set, fees and refunds remain unchanged.
                accountant: address = self.accountant
                if accountant != empty(address):
                    total_fees, total_refunds = IAccountant(accountant).report(strategy, gain, loss)

                    if total_refunds > 0:
                        # Make sure we have enough approval and enough asset to pull.
                        total_refunds = min(total_refunds, min(ERC20(_asset).balanceOf(accountant), ERC20(_asset).allowance(accountant, self)))

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
                    shares_to_burn = self._convert_to_shares(loss + total_fees, Rounding.ROUND_UP)

                    # If we have fees then get the proportional amount of shares to issue.
                    if total_fees > 0:
                        # Get the total amount shares to issue for the fees.
                        total_fees_shares = shares_to_burn * total_fees / (loss + total_fees)

                        # Get the protocol fee config for this vault.
                        protocol_fee_bps, protocol_fee_recipient = IFactory(self.factory).protocol_fee_config()

                        # If there is a protocol fee.
                        if protocol_fee_bps > 0:
                            # Get the percent of fees to go to protocol fees.
                            protocol_fees_shares = total_fees_shares * convert(protocol_fee_bps, uint256) / MAX_BPS


                # Shares to lock is any amount that would otherwise increase the vaults PPS.
                shares_to_lock: uint256 = 0
                profit_max_unlock_time: uint256 = self.profit_max_unlock_time
                # Get the amount we will lock to avoid a PPS increase.
                if gain + total_refunds > 0 and profit_max_unlock_time != 0:
                    shares_to_lock = self._convert_to_shares(gain + total_refunds, Rounding.ROUND_DOWN)

                # The total current supply including locked shares.
                total_supply: uint256 = self.total_supply
                # The total shares the vault currently owns. Both locked and unlocked.
                total_locked_shares: uint256 = self.balance_of[self]
                # Get the desired end amount of shares after all accounting.
                ending_supply: uint256 = total_supply + shares_to_lock - shares_to_burn - self._unlocked_shares()
                
                # If we will end with more shares than we have now.
                if ending_supply > total_supply:
                    # Issue the difference.
                    self._issue_shares(unsafe_sub(ending_supply, total_supply), self)

                # Else we need to burn shares.
                elif total_supply > ending_supply:
                    # Can't burn more than the vault owns.
                    to_burn: uint256 = min(unsafe_sub(total_supply, ending_supply), total_locked_shares)
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
                        # Add in any refunds since it is now idle.
                        current_debt = unsafe_add(current_debt, total_refunds)
                        self.total_idle = current_debt
                        
                # Or record any reported loss
                elif loss > 0:
                    current_debt = unsafe_sub(current_debt, loss)
                    if strategy != self:
                        self.strategies[strategy].current_debt = current_debt
                        self.total_debt -= loss
                    else:
                        # Add in any refunds since it is now idle.
                        current_debt = unsafe_add(current_debt, total_refunds)
                        self.total_idle = current_debt
                    
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
                        previously_locked_time = (total_locked_shares - shares_to_lock) * (_full_profit_unlock_date - block.timestamp)

                    # new_profit_locking_period is a weighted average between the remaining time of the previously locked shares and the profit_max_unlock_time
                    new_profit_locking_period: uint256 = (previously_locked_time + shares_to_lock * profit_max_unlock_time) / total_locked_shares
                    # Calculate how many shares unlock per second.
                    self.profit_unlocking_rate = total_locked_shares * MAX_BPS_EXTENDED / new_profit_locking_period
                    # Calculate how long until the full amount of shares is unlocked.
                    self.full_profit_unlock_date = block.timestamp + new_profit_locking_period
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
                    total_fees = self._convert_to_assets(total_fees_shares, Rounding.ROUND_DOWN)

                log StrategyReported(
                    strategy,
                    gain,
                    loss,
                    current_debt,
                    total_fees * convert(protocol_fee_bps, uint256) / MAX_BPS, # Protocol Fees
                    total_fees,
                    total_refunds
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
            @view
            @external
            def distribution_time() -> uint256:
                """
                @notice Getter for the distribution time of the rewards.
                @return uint256 The time over which vault rewards will be distributed.
                """
                return staticcall vault.profitMaxUnlockTime()
            ```

        === "Vault.vy"

            ```python
            # The amount of time profits will unlock over.
            profit_max_unlock_time: uint256

            @view
            @external
            def profitMaxUnlockTime() -> uint256:
                """
                @notice Gets the current time profits are set to unlock over.
                @return The current profit max unlock time.
                """
                return self.profit_max_unlock_time
            ```

    === "Example"

        :material-information-outline:{ title='This interactive example fetches the output directly on-chain.' } This example returns the distribution time of the rewards.

        <div class="highlight">
        <pre><code>>>> RewardsHandler.distribution_time() <span id="distributionTimeOutput"></span></code></pre>
        </div>


---


# **Admin Controls**

The contract uses the [Multi-Role-Based Access Control Module](https://github.com/pcaversaccio/snekmate/blob/main/src/snekmate/auth/access_control.vy) from [Snekmate](https://github.com/pcaversaccio/snekmate) to manage roles and permissions. This module ensures that only specific addresses assigned the `RATE_MANAGER` role can modify key parameters such as the Time-Weighted Average (TWA) window, the minimum time between snapshots, and the distribution time. Roles can only be granted or revoked by the `DEFAULT_ADMIN_ROLE` defined in the access module.

For a detailed explanation of how to use the access control module, please refer to the source code where its mechanics are explained in detail: [Snekmate access_control.vy](https://github.com/pcaversaccio/snekmate/blob/main/src/snekmate/auth/access_control.vy).


### `set_twa_window`
!!! description "`RewardsHandler.set_twa_window(_twa_window: uint256)`"

    !!!guard "Guarded Method by Snekmate 🐍"
        This contract makes use of a Snekmate module to manage roles and permissions. This specific function is restricted to the `RATE_MANAGER` role.

    Function to set a new value for the `twa_window` variable in the `TWA` module. This value represents the time window over which the time-weighted average (TWA) is calculated.

    Emits: `TWAWindowUpdated` event.

    | Input         | Type      | Description                  |
    | ------------- | --------- | ---------------------------- |
    | `_twa_window` | `uint256` | New value for the TWA window |

    ??? quote "Source code"

        === "RewardsHandler.vy"

            ```python
            from snekmate.auth import access_control

            initializes: access_control
            exports: (
                # we don't expose `supportsInterface` from access control
                access_control.grantRole,
                access_control.revokeRole,
                access_control.renounceRole,
                access_control.set_role_admin,
                access_control.DEFAULT_ADMIN_ROLE,
                access_control.hasRole,
                access_control.getRoleAdmin,
            )

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
            event TWAWindowUpdated:
                new_window: uint256

            twa_window: public(uint256)  # Time window in seconds for TWA calculation

            @internal
            def _set_twa_window(_new_window: uint256):
                """
                @notice Adjusts the TWA window.
                @param _new_window The new TWA window in seconds.
                @dev Only callable by the importing contract.
                """
                self.twa_window = _new_window
                log TWAWindowUpdated(_new_window)
            ```

    === "Example"

        This example sets the TWA window from 604800 seconds (1 week) to 302400 seconds (1/2 week).

        ```shell
        >>> RewardsHandler.set_twa_window()
        604800

        >>> RewardsHandler.set_twa_window(302400)

        >>> RewardsHandler.twa_window()
        302400
        ```


### `set_twa_snapshot_dt`
!!! description "`RewardsHandler.set_twa_snapshot_dt(_min_snapshot_dt_seconds: uint256)`"

    !!!guard "Guarded Method by Snekmate 🐍"
        This contract makes use of a Snekmate module to manage roles and permissions. This specific function is restricted to the `RATE_MANAGER` role.

    Function to set a new value for the `min_snapshot_dt_seconds` variable in the `TWA` module. This value represents the minimum time between snapshots.

    Emits: `SnapshotIntervalUpdated` event.

    | Input                      | Type      | Description                          |
    | -------------------------- | --------- | ------------------------------------ |
    | `_min_snapshot_dt_seconds` | `uint256` | New value for the minimum time between snapshots |

    ??? quote "Source code"

        === "RewardsHandler.vy"

            ```python
            from snekmate.auth import access_control

            initializes: access_control
            exports: (
                # we don't expose `supportsInterface` from access control
                access_control.grantRole,
                access_control.revokeRole,
                access_control.renounceRole,
                access_control.set_role_admin,
                access_control.DEFAULT_ADMIN_ROLE,
                access_control.hasRole,
                access_control.getRoleAdmin,
            )

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
            event SnapshotIntervalUpdated:
                new_dt_seconds: uint256

            min_snapshot_dt_seconds: public(uint256)  # Minimum time between snapshots in seconds

            @internal
            def _set_snapshot_dt(_new_dt_seconds: uint256):
                """
                @notice Adjusts the minimum snapshot time interval.
                @param _new_dt_seconds The new minimum snapshot time interval in seconds.
                @dev Only callable by the importing contract.
                """
                self.min_snapshot_dt_seconds = _new_dt_seconds
                log SnapshotIntervalUpdated(_new_dt_seconds)
            ```

    === "Example"

        This example sets the minimum time between snapshots from 3600 seconds (1 hour) to 7200 seconds (2 hours).

        ```shell
        >>> RewardsHandler.min_snapshot_dt_seconds()
        3600

        >>> RewardsHandler.set_twa_snapshot_dt(7200)

        >>> RewardsHandler.min_snapshot_dt_seconds()
        7200
        ```


### `set_distribution_time`
!!! description "`RewardsHandler.set_distribution_time(new_distribution_time: uint256)`"

    !!!guard "Guarded Method by Snekmate 🐍"
        This contract makes use of a Snekmate module to manage roles and permissions. This specific function is restricted to the `RATE_MANAGER` role.

    Function to set the distribution time for the rewards. This is the time it takes to stream the rewards. Setting this value to 0 will immediately distribute all the rewards. If the value is set to a number greater than 0, the rewards will be distributed over the specified number of seconds. 

    Emits: `UpdateProfitMaxUnlockTime` and `StrategyReported` events from the `Vault` contract.

    | Input                  | Type      | Description              |
    | ---------------------- | --------- | ------------------------ |
    | `new_distribution_time`| `uint256` | New distribution time    |

    ??? quote "Source code"

        === "RewardsHandler.vy"

            ```python
            from snekmate.auth import access_control

            initializes: access_control
            exports: (
                # we don't expose `supportsInterface` from access control
                access_control.grantRole,
                access_control.revokeRole,
                access_control.renounceRole,
                access_control.set_role_admin,
                access_control.DEFAULT_ADMIN_ROLE,
                access_control.hasRole,
                access_control.getRoleAdmin,
            )

            RATE_MANAGER: public(constant(bytes32)) = keccak256("RATE_MANAGER")

            @external
            def set_distribution_time(new_distribution_time: uint256):
                """
                @notice Admin function to correct the distribution rate of the rewards. Making
                this value lower will reduce the time it takes to stream the rewards, making it
                longer will do the opposite. Setting it to 0 will immediately distribute all the
                rewards.

                @dev This function can be used to prevent the rewards distribution from being
                manipulated (i.e. MEV twa snapshots to obtain higher APR for the vault). Setting
                this value to zero can be used to pause `process_rewards`.
                """
                access_control._check_role(RATE_MANAGER, msg.sender)

                # change the distribution time of the rewards in the vault
                extcall vault.setProfitMaxUnlockTime(new_distribution_time)

                # enact the changes
                extcall vault.process_report(vault.address)
            ```

        === "Vault.vy"

            ```python
            event StrategyReported:
                strategy: indexed(address)
                gain: uint256
                loss: uint256
                current_debt: uint256
                protocol_fees: uint256
                total_fees: uint256
                total_refunds: uint256

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
                assert new_profit_max_unlock_time <= 31_556_952, "profit unlock time too long"

                # If setting to 0 we need to reset any locked values.
                if (new_profit_max_unlock_time == 0):

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

                # For Accountant fee assessment.
                total_fees: uint256 = 0
                total_refunds: uint256 = 0
                # If accountant is not set, fees and refunds remain unchanged.
                accountant: address = self.accountant
                if accountant != empty(address):
                    total_fees, total_refunds = IAccountant(accountant).report(strategy, gain, loss)

                    if total_refunds > 0:
                        # Make sure we have enough approval and enough asset to pull.
                        total_refunds = min(total_refunds, min(ERC20(_asset).balanceOf(accountant), ERC20(_asset).allowance(accountant, self)))

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
                    shares_to_burn = self._convert_to_shares(loss + total_fees, Rounding.ROUND_UP)

                    # If we have fees then get the proportional amount of shares to issue.
                    if total_fees > 0:
                        # Get the total amount shares to issue for the fees.
                        total_fees_shares = shares_to_burn * total_fees / (loss + total_fees)

                        # Get the protocol fee config for this vault.
                        protocol_fee_bps, protocol_fee_recipient = IFactory(self.factory).protocol_fee_config()

                        # If there is a protocol fee.
                        if protocol_fee_bps > 0:
                            # Get the percent of fees to go to protocol fees.
                            protocol_fees_shares = total_fees_shares * convert(protocol_fee_bps, uint256) / MAX_BPS


                # Shares to lock is any amount that would otherwise increase the vaults PPS.
                shares_to_lock: uint256 = 0
                profit_max_unlock_time: uint256 = self.profit_max_unlock_time
                # Get the amount we will lock to avoid a PPS increase.
                if gain + total_refunds > 0 and profit_max_unlock_time != 0:
                    shares_to_lock = self._convert_to_shares(gain + total_refunds, Rounding.ROUND_DOWN)

                # The total current supply including locked shares.
                total_supply: uint256 = self.total_supply
                # The total shares the vault currently owns. Both locked and unlocked.
                total_locked_shares: uint256 = self.balance_of[self]
                # Get the desired end amount of shares after all accounting.
                ending_supply: uint256 = total_supply + shares_to_lock - shares_to_burn - self._unlocked_shares()
                
                # If we will end with more shares than we have now.
                if ending_supply > total_supply:
                    # Issue the difference.
                    self._issue_shares(unsafe_sub(ending_supply, total_supply), self)

                # Else we need to burn shares.
                elif total_supply > ending_supply:
                    # Can't burn more than the vault owns.
                    to_burn: uint256 = min(unsafe_sub(total_supply, ending_supply), total_locked_shares)
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
                        # Add in any refunds since it is now idle.
                        current_debt = unsafe_add(current_debt, total_refunds)
                        self.total_idle = current_debt
                        
                # Or record any reported loss
                elif loss > 0:
                    current_debt = unsafe_sub(current_debt, loss)
                    if strategy != self:
                        self.strategies[strategy].current_debt = current_debt
                        self.total_debt -= loss
                    else:
                        # Add in any refunds since it is now idle.
                        current_debt = unsafe_add(current_debt, total_refunds)
                        self.total_idle = current_debt
                    
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
                        previously_locked_time = (total_locked_shares - shares_to_lock) * (_full_profit_unlock_date - block.timestamp)

                    # new_profit_locking_period is a weighted average between the remaining time of the previously locked shares and the profit_max_unlock_time
                    new_profit_locking_period: uint256 = (previously_locked_time + shares_to_lock * profit_max_unlock_time) / total_locked_shares
                    # Calculate how many shares unlock per second.
                    self.profit_unlocking_rate = total_locked_shares * MAX_BPS_EXTENDED / new_profit_locking_period
                    # Calculate how long until the full amount of shares is unlocked.
                    self.full_profit_unlock_date = block.timestamp + new_profit_locking_period
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
                    total_fees = self._convert_to_assets(total_fees_shares, Rounding.ROUND_DOWN)

                log StrategyReported(
                    strategy,
                    gain,
                    loss,
                    current_debt,
                    total_fees * convert(protocol_fee_bps, uint256) / MAX_BPS, # Protocol Fees
                    total_fees,
                    total_refunds
                )

                return (gain, loss)
            ```


    === "Example"

        This example sets the distribution time from 1 week to 1/2 week.

        ```shell
        >>> RewardsHandler.distribution_time()
        604800

        >>> RewardsHandler.set_distribution_time(302400)

        >>> RewardsHandler.distribution_time()
        302400
        ```


### `set_stablecoin_lens`
!!! description "`RewardsHandler.set_stablecoin_lens(_lens: address)`"

    !!!guard "Guarded Method by Snekmate 🐍"
        This contract makes use of a Snekmate module to manage roles and permissions. This specific function is restricted to the `LENS_MANAGER` role.

    Function to set a new `stablecoin_lens` address.

    Emits: `StablecoinLensUpdated` event.

    | Input                      | Type      | Description                          |
    | -------------------------- | --------- | ------------------------------------ |
    | `_lens`                   | `address` | New `stablecoin_lens` address        |

    ??? quote "Source code"

        === "RewardsHandler.vy"

            ```python
            from snekmate.auth import access_control

            initializes: access_control
            exports: (
                # we don't expose `supportsInterface` from access control
                access_control.grantRole,
                access_control.revokeRole,
                access_control.renounceRole,
                access_control.set_role_admin,
                access_control.DEFAULT_ADMIN_ROLE,
                access_control.hasRole,
                access_control.getRoleAdmin,
            )

            LENS_MANAGER: public(constant(bytes32)) = keccak256("LENS_MANAGER")

            event StablecoinLensUpdated:
                new_stablecoin_lens: IStablecoinLens

            stablecoin_lens: public(IStablecoinLens)

            @internal
            def _set_stablecoin_lens(_lens: IStablecoinLens):
                assert _lens.address != empty(address), "no lens"
                self.stablecoin_lens = _lens

                log StablecoinLensUpdated(_lens)
            ```

    === "Example"

        This example sets the `stablecoin_lens` address to `ZERO_ADDRESS`. This is just an example but would not make sense in practice.

        ```shell
        >>> RewardsHandler.stablecoin_lens()
        '0xe24e2dB9f6Bb40bBe7c1C025bc87104F5401eCd7'

        >>> RewardsHandler.set_stablecoin_lens('0x0000000000000000000000000000000000000000')

        >>> RewardsHandler.stablecoin_lens()
        '0x0000000000000000000000000000000000000000'
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
            from snekmate.auth import access_control

            initializes: access_control
            exports: (
                # we don't expose `supportsInterface` from access control
                access_control.grantRole,
                access_control.revokeRole,
                access_control.renounceRole,
                access_control.set_role_admin,
                access_control.DEFAULT_ADMIN_ROLE,
                access_control.hasRole,
                access_control.getRoleAdmin,
            )

            event MinimumWeightUpdated:
                new_minimum_weight: uint256

            MAX_BPS: constant(uint256) = 10**4  # 100%

            @external
            def set_minimum_weight(new_minimum_weight: uint256):
                """
                @notice Update the minimum weight that the the vault will ask for.

                @dev This function can be used to prevent the rewards requested from being
                manipulated (i.e. MEV twa snapshots to obtain lower APR for the vault). Setting
                this value to zero makes the amount of rewards requested fully determined by the
                twa of the deposited supply ratio.
                """
                access_control._check_role(RATE_MANAGER, msg.sender)
                self._set_minimum_weight(new_minimum_weight)

            @internal
            def _set_minimum_weight(new_minimum_weight: uint256):
                assert new_minimum_weight <= MAX_BPS, "minimum weight should be <= 100%"
                self.minimum_weight = new_minimum_weight

                log MinimumWeightUpdated(new_minimum_weight)
            ```

    === "Example"

        This example sets the minimum weight the `RewardsHandler` will ask for from 5% to 10%.

        ```shell
        >>> RewardsHandler.minimum_weight()
        500      # 5%

        >>> RewardsHandler.set_minimum_weight(1000)

        >>> RewardsHandler.minimum_weight()
        1000     # 10%
        ```


### `set_scaling_factor`
!!! description "`RewardsHandler.weight() -> uint256: view`"

    !!!guard "Guarded Method by Snekmate 🐍"
        This contract makes use of a Snekmate module to manage roles and permissions. This specific function is restricted to the `RATE_MANAGER` role.

    Function to change the scaling factor value.

    Emits: `ScalingFactorUpdated` event.

    ??? quote "Source code"

        === "RewardsHandler.vy"

            ```python
            event ScalingFactorUpdated:
                new_scaling_factor: uint256

            # scaling factor for the deposited token / circulating supply ratio.
            scaling_factor: public(uint256)

            @external
            def set_scaling_factor(new_scaling_factor: uint256):
                """
                @notice Update the scaling factor that is used in the weight calculation.
                This factor can be used to adjust the rewards distribution rate.
                """
                access_control._check_role(RATE_MANAGER, msg.sender)
                self._set_scaling_factor(new_scaling_factor)

            @internal
            def _set_scaling_factor(new_scaling_factor: uint256):
                self.scaling_factor = new_scaling_factor

                log ScalingFactorUpdated(new_scaling_factor)
            ```

    === "Example"

        This example sets the scaling factor from 10000 to 15000.

        ```shell
        >>> RewardsHandler.scaling_factor()
        10000

        >>> RewardsHandler.set_scaling_factor(15000)

        >>> RewardsHandler.scaling_factor()
        15000
        ```


---


# **Other Methods**

### `vault`
!!! description "`RewardsHandler.vault() -> address: view`"

    Getter for the [YearnV3 Vault contract](https://github.com/yearn/yearn-vaults-v3). This contract address is at the same time also the address of the `scrvUSD` token.

    Returns: YearnV3 Vault (`address`).

    ??? quote "Source code"

        === "RewardsHandler.vy"

            ```python
            from interfaces import IVault

            vault: public(immutable(IVault))

            @deploy
            def __init__(
                _stablecoin: IERC20,
                _vault: IVault,
                minimum_weight: uint256,
                scaling_factor: uint256,
                controller_factory: lens.IControllerFactory,
                admin: address,
            ):
                ...
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


            @view
            @external
            def totalAssets() -> uint256:
                ...


            @view
            @external
            def profitMaxUnlockTime() -> uint256:
                ...
            ```

    === "Example"

        :material-information-outline:{ title='This interactive example fetches the output directly on-chain.' } This example returns the scrvUSD YearnV3 vault address.

        <div class="highlight">
        <pre><code>>>> RewardsHandler.vault() <span id="vaultOutput"></span></code></pre>
        </div>


### `stablecoin`
!!! description "`RewardsHandler.stablecoin() -> address: view`"

    Getter for the crvUSD stablecoin address.

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
                scaling_factor: uint256,
                controller_factory: lens.IControllerFactory,
                admin: address,
            ):
                ...
                stablecoin = _stablecoin
                ...
            ```

    === "Example"

        :material-information-outline:{ title='This interactive example fetches the output directly on-chain.' } This example returns the crvUSD stablecoin address.

        <div class="highlight">
        <pre><code>>>> RewardsHandler.stablecoin() <span id="stablecoinOutput"></span></code></pre>
        </div>


### `stablecoin_lens`
!!! description "`RewardsHandler.stablecoin_lens() -> IStablecoinLens: view`"

    Getter for the `stablecoin_lens` address. This value can be changed via the `set_stablecoin_lens` function.

    Returns: `stablecoin_lens` contract (`address`).

    ??? quote "Source code"

        === "RewardsHandler.vy"

            ```python
            from contracts.interfaces import IStablecoinLens

            stablecoin_lens: public(IStablecoinLens)
            ```

    === "Example"

        :material-information-outline:{ title='This interactive example fetches the output directly on-chain.' } This example returns the address of the `StablecoinLens.vy` contract.

        <div class="highlight">
        <pre><code>>>> RewardsHandler.stablecoin_lens() <span id="stablecoinLensOutput"></span></code></pre>
        </div>


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
            _SUPPORTED_INTERFACES: constant(bytes4[1]) = [
                0xA1AAB33F,  # The ERC-165 identifier for the dynamic weight interface.
            ]

            from snekmate.auth import access_control

            initializes: access_control
            exports: (
                # we don't expose `supportsInterface` from access control
                access_control.grantRole,
                access_control.revokeRole,
                access_control.renounceRole,
                access_control.set_role_admin,
                access_control.DEFAULT_ADMIN_ROLE,
                access_control.hasRole,
                access_control.getRoleAdmin,
            )

            @external
            @view
            def supportsInterface(interface_id: bytes4) -> bool:
                """
                @dev Returns `True` if this contract implements the interface defined by
                `interface_id`.
                @param interface_id The 4-byte interface identifier.
                @return bool The verification whether the contract implements the interface or
                not.
                """
                return (
                    interface_id in access_control._SUPPORTED_INTERFACES
                    or interface_id in _SUPPORTED_INTERFACES
                )
            ```

    === "Example"

        :material-information-outline:{ title='This interactive example fetches the output directly on-chain.' } In this example, the address and weight of a receiver at a specific index is returned.

        <div class="highlight">
        <pre><code>>>> RewardsHandler.supportsInterface(<input id="supportedInterface" type="text" value="0xA1AAB33F" 
        style="width: 80px; 
            background: transparent; 
            border: none; 
            border-bottom: 1px solid #ccc; 
            color: inherit; 
            font-family: inherit; 
            font-size: inherit; 
            -moz-appearance: textfield;" 
            oninput="fetchSupportedInterface()"/>)
        <span id="supportedInterfaceOutput"></span></code></pre>
        </div>

        <style>
        input[type=number]::-webkit-inner-spin-button, 
        input[type=number]::-webkit-outer-spin-button {
            -webkit-appearance: none;
            margin: 0;
        }
        </style>


### `recover_erc20`
!!! description "`RewardsHandler.recover_erc20(token: IERC20, receiver: address)`"

    !!!guard "Guarded Method by Snekmate 🐍"
        This contract makes use of a Snekmate module to manage roles and permissions. This specific function is restricted to the `RECOVERY_MANAGER` role.

    Function to recover funds accidently sent to the contract. This function can not recover `crvUSD` tokens as any `crvUSD` tokens sent to the contract are considered as donations and will be distributed to stakers.

    | Input      | Type      | Description                            |
    | ---------- | --------- | -------------------------------------- |
    | `token`    | `IERC20`  | Address of the token to recover        |
    | `receiver` | `address` | Receier address of the recovered funds |

    ??? quote "Source code"

        === "RewardsHandler.vy"

            ```python
            from ethereum.ercs import IERC20

            from snekmate.auth import access_control

            initializes: access_control
            exports: (
                # we don't expose `supportsInterface` from access control
                access_control.grantRole,
                access_control.revokeRole,
                access_control.renounceRole,
                access_control.set_role_admin,
                access_control.DEFAULT_ADMIN_ROLE,
                access_control.hasRole,
                access_control.getRoleAdmin,
            )

            RECOVERY_MANAGER: public(constant(bytes32)) = keccak256("RECOVERY_MANAGER")

            @external
            def recover_erc20(token: IERC20, receiver: address):
                """
                @notice This is a helper function to let an admin rescue funds sent by mistake
                to this contract. crvUSD cannot be recovered as it's part of the core logic of
                this contract.
                """
                access_control._check_role(RECOVERY_MANAGER, msg.sender)

                # if crvUSD was sent by accident to the contract the funds are lost and will
                # be distributed as rewards on the next `process_rewards` call.
                assert token != stablecoin, "can't recover crvusd"

                # when funds are recovered the whole balanced is sent to a trusted address.
                balance_to_recover: uint256 = staticcall token.balanceOf(self)

                assert extcall token.transfer(receiver, balance_to_recover, default_return_value=True)
            ```

    === "Example"

        In this example, all [`wETH`](https://etherscan.io/token/0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2) tokens sent to the contract are recovered and sent to [Curve Fee Collector](https://etherscan.io/address/0xa2Bcd1a4Efbd04B63cd03f5aFf2561106ebCCE00).

        ```shell
        >>> RewardsHandler.recover_erc20('0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', '0xa2Bcd1a4Efbd04B63cd03f5aFf2561106ebCCE00')
        ```


---


# **Access Control Module (Snekmate 🐍)**

Ownership in this contract is handled by the [Access Control Module](https://github.com/pcaversaccio/snekmate/blob/main/src/snekmate/auth/access_control.vy) provided by [Snekmate 🐍](https://github.com/pcaversaccio/snekmate).


### `DEFAULT_ADMIN_ROLE`
!!! description "`RewardsHandler.DEFAULT_ADMIN_ROLE() -> bytes32: view`"

    Getter for the `DEFAULT_ADMIN_ROLE` role which is the keccak256 hash of the string "DEFAULT_ADMIN_ROLE". This variable is needed for compatibility with the access control module.

    Returns: `DEFAULT_ADMIN_ROLE` (`bytes32`).

    ??? quote "Source code"

        === "RewardsHandler.vy"

            ```python
            # we use access control because we want to have multiple addresses being able
            # to adjust the rate while only the dao (which has the `DEFAULT_ADMIN_ROLE`)
            # can appoint `RATE_MANAGER`s
            from snekmate.auth import access_control

            initializes: access_control
            exports: (
                # we don't expose `supportsInterface` from access control
                access_control.grantRole,
                access_control.revokeRole,
                access_control.renounceRole,
                access_control.set_role_admin,
                access_control.DEFAULT_ADMIN_ROLE,
                access_control.hasRole,
                access_control.getRoleAdmin,
            )
            ```

        === "access_control.vy"

            ```python
            # @dev The default 32-byte admin role.
            # @notice If you declare a variable as `public`,
            # Vyper automatically generates an `external`
            # getter function for the variable.
            DEFAULT_ADMIN_ROLE: public(constant(bytes32)) = empty(bytes32)
            ```

    === "Example"

        :material-information-outline:{ title='This interactive example fetches the output directly on-chain.' } This example returns the `DEFAULT_ADMIN_ROLE` role.

        <div class="highlight">
        <pre><code>>>> RewardsHandler.DEFAULT_ADMIN_ROLE() <span id="defaultAdminRoleOutput"></span></code></pre>
        </div>


### `RATE_MANAGER`
!!! description "`RewardsHandler.RATE_MANAGER() -> bytes32: view`"

    Getter for the `RATE_MANAGER` role which is the keccak256 hash of the string "RATE_MANAGER". This variable is needed for compatibility with the access control module.

    Returns: `RATE_MANAGER` (`bytes32`).

    ??? quote "Source code"

        === "RewardsHandler.vy"

            ```python
            RATE_MANAGER: constant(bytes32) = keccak256("RATE_MANAGER")
            ```

    === "Example"

        :material-information-outline:{ title='This interactive example fetches the output directly on-chain.' } This example returns the `RATE_MANAGER` role.

        <div class="highlight">
        <pre><code>>>> RewardsHandler.RATE_MANAGER() <span id="rateManagerOutput"></span></code></pre>
        </div>


### `RECOVERY_MANAGER`
!!! description "`RewardsHandler.RECOVERY_MANAGER() -> bytes32: view`"

    Getter for the `RECOVERY_MANAGER` role which is the keccak256 hash of the string "RECOVERY_MANAGER". This variable is needed for compatibility with the access control module.

    Returns: `RECOVERY_MANAGER` (`bytes32`).

    ??? quote "Source code"

        === "RewardsHandler.vy"

            ```python
            RECOVERY_MANAGER: constant(bytes32) = keccak256("RECOVERY_MANAGER")
            ```

    === "Example"

        :material-information-outline:{ title='This interactive example fetches the output directly on-chain.' } This example returns the `RECOVERY_MANAGER` role.

        <div class="highlight">
        <pre><code>>>> RewardsHandler.RECOVERY_MANAGER() <span id="recoveryManagerOutput"></span></code></pre>
        </div>


### `LENS_MANAGER`
!!! description "`RewardsHandler.LENS_MANAGER() -> bytes32: view`"

    Getter for the `LENS_MANAGER` role which is the keccak256 hash of the string "LENS_MANAGER". This variable is needed for compatibility with the access control module.

    Returns: `LENS_MANAGER` (`bytes32`).

    ??? quote "Source code"

        === "RewardsHandler.vy"

            ```python
            LENS_MANAGER: constant(bytes32) = keccak256("LENS_MANAGER")
            ```

    === "Example"

        :material-information-outline:{ title='This interactive example fetches the output directly on-chain.' } This example returns the `LENS_MANAGER` role.

        <div class="highlight">
        <pre><code>>>> RewardsHandler.LENS_MANAGER() <span id="lensManagerOutput"></span></code></pre>
        </div>


### `hasRole`
!!! description "`RewardsHandler.hasRole(role: bytes32, account: address) -> bool: view`"

    Getter to check if an account has a specific role.

    | Input      | Type      | Description                          |
    | ---------- | --------- | ------------------------------------ |
    | `role`     | `bytes32` | Role to check                        |
    | `account`  | `address` | Account to check the role for         |

    ??? quote "Source code"

        === "RewardsHandler.vy"

            ```python
            # we use access control because we want to have multiple addresses being able
            # to adjust the rate while only the dao (which has the `DEFAULT_ADMIN_ROLE`)
            # can appoint `RATE_MANAGER`s
            from snekmate.auth import access_control

            initializes: access_control
            exports: (
                # we don't expose `supportsInterface` from access control
                access_control.grantRole,
                access_control.revokeRole,
                access_control.renounceRole,
                access_control.set_role_admin,
                access_control.DEFAULT_ADMIN_ROLE,
                access_control.hasRole,
                access_control.getRoleAdmin,
            )
            ```

        === "access_control.vy"

            ```python
            # @dev Returns `True` if `account` has been granted `role`.
            hasRole: public(HashMap[bytes32, HashMap[address, bool]])
            ```

    === "Example"

        This example checks if `0x40907540d8a6C65c637785e8f8B742ae6b0b9968` has the `DEFAULT_ADMIN_ROLE` role.

        ```shell
        >>> RewardsHandler.hasRole('0x0000000000000000000000000000000000000000000000000000000000000000', '0x40907540d8a6C65c637785e8f8B742ae6b0b9968')
        true
        ```


### `getRoleAdmin`
!!! description "`RewardsHandler.getRoleAdmin(role: bytes32) -> bytes32: view`"

    Getter to get the admin role for a specific role.

    | Input      | Type      | Description                          |
    | ---------- | --------- | ------------------------------------ |
    | `role`     | `bytes32` | Role to get the admin role for        |

    ??? quote "Source code"

        === "RewardsHandler.vy"

            ```python
            # we use access control because we want to have multiple addresses being able
            # to adjust the rate while only the dao (which has the `DEFAULT_ADMIN_ROLE`)
            # can appoint `RATE_MANAGER`s
            from snekmate.auth import access_control

            initializes: access_control
            exports: (
                # we don't expose `supportsInterface` from access control
                access_control.grantRole,
                access_control.revokeRole,
                access_control.renounceRole,
                access_control.set_role_admin,
                access_control.DEFAULT_ADMIN_ROLE,
                access_control.hasRole,
                access_control.getRoleAdmin,
            )
            ```

        === "access_control.vy"

            ```python
            # @dev Returns the admin role that controls `role`.
            getRoleAdmin: public(HashMap[bytes32, bytes32])
            ```

    === "Example"

        This example returns the admin role for the `RATE_MANAGER` role.

        ```shell
        >>> RewardsHandler.getRoleAdmin('0x2eb8ae3bf4f7ccce3124b351006550c82803b59ffcc079d490ebdc6c9946d68c')
        0x0000000000000000000000000000000000000000000000000000000000000000
        ```


### `grantRole`
!!! description "`RewardsHandler.grantRole(role: bytes32, account: address)`"

    Grants a role to an account.

    | Input      | Type      | Description                          |
    | ---------- | --------- | ------------------------------------ |
    | `role`     | `bytes32` | Role to grant                        |
    | `account`  | `address` | Account to grant the role to         |

    ??? quote "Source code"

        === "RewardsHandler.vy"

            ```python
            # we use access control because we want to have multiple addresses being able
            # to adjust the rate while only the dao (which has the `DEFAULT_ADMIN_ROLE`)
            # can appoint `RATE_MANAGER`s
            from snekmate.auth import access_control

            initializes: access_control
            exports: (
                # we don't expose `supportsInterface` from access control
                access_control.grantRole,
                access_control.revokeRole,
                access_control.renounceRole,
                access_control.set_role_admin,
                access_control.DEFAULT_ADMIN_ROLE,
                access_control.hasRole,
                access_control.getRoleAdmin,
            )
            ```

        === "access_control.vy"

            ```python
            # @dev Returns the admin role that controls `role`.
            getRoleAdmin: public(HashMap[bytes32, bytes32])

            @external
            def grantRole(role: bytes32, account: address):
                """
                @dev Grants `role` to `account`.
                @notice If `account` had not been already
                        granted `role`, emits a `RoleGranted`
                        event. Note that the caller must have
                        `role`'s admin role.
                @param role The 32-byte role definition.
                @param account The 20-byte address of the account.
                """
                self._check_role(self.getRoleAdmin[role], msg.sender)
                self._grant_role(role, account)

            @internal
            def _grant_role(role: bytes32, account: address):
                """
                @dev Grants `role` to `account`.
                @notice This is an `internal` function without
                        access restriction.
                @param role The 32-byte role definition.
                @param account The 20-byte address of the account.
                """
                if (not(self.hasRole[role][account])):
                    self.hasRole[role][account] = True
                    log IAccessControl.RoleGranted(role=role, account=account, sender=msg.sender)
            ```

    === "Example"

        This example grants the `RATE_MANAGER` role to `0x40907540d8a6C65c637785e8f8B742ae6b0b9968`.

        ```shell
        >>> RewardsHandler.grantRole('0x2eb8ae3bf4f7ccce3124b351006550c82803b59ffcc079d490ebdc6c9946d68c', '0x40907540d8a6C65c637785e8f8B742ae6b0b9968')
        ```


### `revokeRole`
!!! description "`RewardsHandler.revokeRole(role: bytes32, account: address)`"

    Revokes a role from an account.

    | Input      | Type      | Description                          |
    | ---------- | --------- | ------------------------------------ |
    | `role`     | `bytes32` | Role to revoke                       |
    | `account`  | `address` | Account to revoke the role from        |

    ??? quote "Source code"

        === "RewardsHandler.vy"

            ```python
            # we use access control because we want to have multiple addresses being able
            # to adjust the rate while only the dao (which has the `DEFAULT_ADMIN_ROLE`)
            # can appoint `RATE_MANAGER`s
            from snekmate.auth import access_control

            initializes: access_control
            exports: (
                # we don't expose `supportsInterface` from access control
                access_control.grantRole,
                access_control.revokeRole,
                access_control.renounceRole,
                access_control.set_role_admin,
                access_control.DEFAULT_ADMIN_ROLE,
                access_control.hasRole,
                access_control.getRoleAdmin,
            )
            ```

        === "access_control.vy"

            ```python
            # @dev Returns the admin role that controls `role`.
            getRoleAdmin: public(HashMap[bytes32, bytes32])

            @external
            def revokeRole(role: bytes32, account: address):
                """
                @dev Revokes `role` from `account`.
                @notice If `account` had been granted `role`,
                        emits a `RoleRevoked` event. Note that
                        the caller must have `role`'s admin role.
                @param role The 32-byte role definition.
                @param account The 20-byte address of the account.
                """
                self._check_role(self.getRoleAdmin[role], msg.sender)
                self._revoke_role(role, account)

            @internal
            def _revoke_role(role: bytes32, account: address):
                """
                @dev Revokes `role` from `account`.
                @notice This is an `internal` function without
                        access restriction.
                @param role The 32-byte role definition.
                @param account The 20-byte address of the account.
                """
                if (self.hasRole[role][account]):
                    self.hasRole[role][account] = False
                    log IAccessControl.RoleRevoked(role=role, account=account, sender=msg.sender)
            ```

    === "Example"

        This example revokes the `RATE_MANAGER` role from `0x40907540d8a6C65c637785e8f8B742ae6b0b9968`.

        ```shell
        >>> RewardsHandler.revokeRole('0x2eb8ae3bf4f7ccce3124b351006550c82803b59ffcc079d490ebdc6c9946d68c', '0x40907540d8a6C65c637785e8f8B742ae6b0b9968')
        ```


### `renounceRole`
!!! description "`RewardsHandler.renounceRole(role: bytes32, account: address)`"

    Renounces a role.

    | Input      | Type      | Description                          |
    | ---------- | --------- | ------------------------------------ |
    | `role`     | `bytes32` | Role to renounce                      |
    | `account`  | `address` | Account to renounce the role from     |

    ??? quote "Source code"

        === "RewardsHandler.vy"

            ```python
            # we use access control because we want to have multiple addresses being able
            # to adjust the rate while only the dao (which has the `DEFAULT_ADMIN_ROLE`)
            # can appoint `RATE_MANAGER`s
            from snekmate.auth import access_control

            initializes: access_control
            exports: (
                # we don't expose `supportsInterface` from access control
                access_control.grantRole,
                access_control.revokeRole,
                access_control.renounceRole,
                access_control.set_role_admin,
                access_control.DEFAULT_ADMIN_ROLE,
                access_control.hasRole,
                access_control.getRoleAdmin,
            )
            ```

        === "access_control.vy"

            ```python
            # @dev Returns the admin role that controls `role`.
            getRoleAdmin: public(HashMap[bytes32, bytes32])

            @external
            def renounceRole(role: bytes32, account: address):
                """
                @dev Revokes `role` from the calling account.
                @notice Roles are often managed via `grantRole`
                        and `revokeRole`. This function's purpose
                        is to provide a mechanism for accounts to
                        lose their privileges if they are compromised
                        (such as when a trusted device is misplaced).
                        If the calling account had been granted `role`,
                        emits a `RoleRevoked` event. Note that the
                        caller must be `account`.
                @param role The 32-byte role definition.
                @param account The 20-byte address of the account.
                """
                assert account == msg.sender, "access_control: can only renounce roles for itself"
                self._revoke_role(role, account)

            @internal
            def _revoke_role(role: bytes32, account: address):
                """
                @dev Revokes `role` from `account`.
                @notice This is an `internal` function without
                        access restriction.
                @param role The 32-byte role definition.
                @param account The 20-byte address of the account.
                """
                if (self.hasRole[role][account]):
                    self.hasRole[role][account] = False
                    log IAccessControl.RoleRevoked(role=role, account=account, sender=msg.sender)
            ```

    === "Example"

        This example renounces the `RATE_MANAGER` role from `0x40907540d8a6C65c637785e8f8B742ae6b0b9968`.

        ```shell
        >>> RewardsHandler.renounceRole('0x2eb8ae3bf4f7ccce3124b351006550c82803b59ffcc079d490ebdc6c9946d68c', '0x40907540d8a6C65c637785e8f8B742ae6b0b9968')
        ```


### `set_role_admin`
!!! description "`RewardsHandler.set_role_admin(role: bytes32, admin_role: bytes32)`"

    Sets the admin role for a role.

    | Input      | Type      | Description                          |
    | ---------- | --------- | ------------------------------------ |
    | `role`     | `bytes32` | Role to set the admin role for       |
    | `admin_role`  | `bytes32` | New admin role                    |

    ??? quote "Source code"

        === "RewardsHandler.vy"

            ```python
            # we use access control because we want to have multiple addresses being able
            # to adjust the rate while only the dao (which has the `DEFAULT_ADMIN_ROLE`)
            # can appoint `RATE_MANAGER`s
            from snekmate.auth import access_control

            initializes: access_control
            exports: (
                # we don't expose `supportsInterface` from access control
                access_control.grantRole,
                access_control.revokeRole,
                access_control.renounceRole,
                access_control.set_role_admin,
                access_control.DEFAULT_ADMIN_ROLE,
                access_control.hasRole,
                access_control.getRoleAdmin,
            )
            ```

        === "access_control.vy"

            ```python
            # @dev Returns the admin role that controls `role`.
            getRoleAdmin: public(HashMap[bytes32, bytes32])

            @external
            def set_role_admin(role: bytes32, admin_role: bytes32):
                """
                @dev Sets `admin_role` as `role`'s admin role.
                @notice Note that the caller must have `role`'s
                        admin role.
                @param role The 32-byte role definition.
                @param admin_role The new 32-byte admin role definition.
                """
                self._check_role(self.getRoleAdmin[role], msg.sender)
                self._set_role_admin(role, admin_role)

            @internal
            def _set_role_admin(role: bytes32, admin_role: bytes32):
                """
                @dev Sets `admin_role` as `role`'s admin role.
                @notice This is an `internal` function without
                        access restriction.
                @param role The 32-byte role definition.
                @param admin_role The new 32-byte admin role definition.
                """
                previous_admin_role: bytes32 = self.getRoleAdmin[role]
                self.getRoleAdmin[role] = admin_role
                log IAccessControl.RoleAdminChanged(role=role, previousAdminRole=previous_admin_role, newAdminRole=admin_role)
            ```

    === "Example"

        This example sets the admin role for the `RATE_MANAGER` role to the `DEFAULT_ADMIN_ROLE`.

        ```shell
        >>> RewardsHandler.set_role_admin('0x2eb8ae3bf4f7ccce3124b351006550c82803b59ffcc079d490ebdc6c9946d68c', '0x0000000000000000000000000000000000000000000000000000000000000000')
        ```
