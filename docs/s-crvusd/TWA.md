<h1>TWA.vy</h1>

The `TWA.vy` is a Time Weighted Average (TWA) Calculator Vyper Module. It stores snapshots of a tracked value at specific timestamps and **computes the TWA of the staked supply ratio over a defined time window**. It is ideally used to track metrics like staked supply rates, token prices, or any other value that changes over time and requires averaging over a period. In our case, the TWA is used to compute the average staked supply ratio over a week to determine the amount of crvUSD rewards to distribute to the stakers.

!!!vyper "TWA.vy"
    The source for the `TWA.vy` contract can be found [:material-github: here](https://github.com/curvefi/stcrvusd/blob/main/contracts/TWA.vy). The contract is written using [Vyper](https://github.com/vyperlang/vyper) version `~=0.4`.

    The contract is deployed on :logos-Ethereum: Ethereum at `tbd`.

    The source code was audited by [tbd].


Snapshots are stored in a dynamic array, ensuring snapshots are only added if a minimum time interval (`min_snapshot_dt_seconds`) has passed since the last snapshot. The TWA is computed using the trapezoidal rule, iterating over the stored snapshots in reverse chronological order and calculating the weighted average of the tracked value over the specified time window (`twa_window`).

as tracked value, we use the staked supply ratio, which is the ratio of the staked supply to the total supply of crvUSD.


!!! info "Info"
    The contract has two internal function for setting `min_snapshot_dt_seconds` and `twa_window` but these contracts are not exposed externally in this contract. Instead, the values of these variables are set in the `RewardsHandler` contract. See here: [RewardsHandler](./RewardsHandler.md)


---


## **Time-Weighted Average (TWA) Computation**

The logic for computing the TWA is implemented in the internal `_compute` function. It calculates the TWA by iterating over the stored snapshots in reverse chronological order and calculates the weighted average of the tracked value over the specified time window (`twa_window`).





### `compute_twa`
!!! description "`TWA.compute_twa() -> uint256: view`"

    Function to compute the time-weighted average of the ratio between staked supply and total supply of crvUSD by iterating over the stored snapshots in reverse chronological order.

    Returns: time-weighted average of the ratio between staked supply and total supply of crvUSD (`uint256`).

    ??? quote "Source code"

        === "TWA.vy"

            ```python
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

        ```shell
        >>> TWA.compute_twa()
        'tbd'
        ```


### `twa_window`
!!! description "`TWA.twa_window() -> uint256: view`"

    Getter for the time window in seconds which is applied to the TWA calculation, essentially the length of the time window over which the TWA is computed. This value can be changed using the internal `set_twa_window` function which is not exposed externally. Instead, the value is set in the `RewardsHandler` contract. See here: [`set_twa_window`](./RewardsHandler.md#set_twa_window).

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

        ```shell
        >>> TWA.twa_window()    
        'tbd'
        ```


---


## **Snapshots**

Snapshots are structs which track the ratio between staked supply and total supply of crvUSD at specific timestamps and the timestamp itself. All snapshots are stored in a dynamic array called `snapshots`.

```python
MAX_SNAPSHOTS: constant(uint256) = 10**18  # 31.7 billion years if snapshot every second

snapshots: public(DynArray[Snapshot, MAX_SNAPSHOTS])

struct Snapshot:
    tracked_value: uint256  # In 1e18 precision
    timestamp: uint256
```

Funnily enough, the maximum number of storable snapshots is set to `10^18`, which would be 31.7 billion years if snapshots are taken every second.


### `snapshots`
!!! description "`TWA.snapshots() -> DynArray[Snapshot, MAX_SNAPSHOTS]`"

    Getter for the dynamic array of snapshots of the tracked value at specific timestamps.

    Returns: `Snapshot` struct containing the tracked value (`uint256`) and the timestamp (`uint256`).

    ??? quote "Source code"

        === "TWA.vy"

            ```python
            MAX_SNAPSHOTS: constant(uint256) = 10**18  # 31.7 billion years if snapshot every second

            struct Snapshot:
                tracked_value: uint256
                timestamp: uint256

            snapshots: public(DynArray[Snapshot, MAX_SNAPSHOTS])

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

        ```shell
        >>> TWA.snapshots()
        [
            {
                tracked_value: 1000000000000000000,
                timestamp: 1717622400
            }
        ]
        ```


### `min_snapshot_dt_seconds`
!!! description "`TWA.min_snapshot_dt_seconds() -> uint256: view`"

    Getter for the minimum time between snapshots in seconds. This value can be changed using the internal `set_min_snapshot_dt_seconds` function which is not exposed externally. Instead, the value is set in the `RewardsHandler` contract. See here: [`set_min_snapshot_dt_seconds`](./RewardsHandler.md#set_min_snapshot_dt_seconds).

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

        ```shell
        >>> TWA.min_snapshot_dt_seconds()
        1
        ```


### `last_snapshot_timestamp`
!!! description "`TWA.last_snapshot_timestamp() -> uint256: view`"

    Getter for the timestamp of the last snapshot taken. This variable is newly set when the internal `_take_snapshot` function is called.

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

        ```shell
        >>> TWA.last_snapshot_timestamp()
        'tbd'
        ```


### `get_len_snapshots`
!!! description "`TWA.get_len_snapshots() -> uint256: view`"

    Getter for the total number of snapshots stored.

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

        ```shell
        >>> TWA.get_len_snapshots()
        1
        ```
