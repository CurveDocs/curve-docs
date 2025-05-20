<h1>GaugeController</h1>

<script src="/assets/javascripts/contracts/gauges/gauge-controller.js"></script>
<script src="https://cdn.jsdelivr.net/npm/web3@1.5.2/dist/web3.min.js"></script>

The `GaugeController` contract is responsible for managing and coordinating the distribution of rewards to liquidity providers in various liquidity pools. It **determines the allocation of CRV emissions based on the liquidity provided** by users. By analyzing the gauges, which are parameters that define how rewards are distributed across different pools, the GaugeController ensures a fair and balanced distribution of incentives, encouraging liquidity provision and participation in Curve's ecosystem.


???+ vyper "`GaugeController.vy`"
    The source code for the `GaugeController.vy` contract can be found on [:material-github: GitHub](https://github.com/curvefi/curve-dao-contracts/blob/master/contracts/GaugeController.vy). The contract is written using [Vyper](https://github.com/vyperlang/vyper) version `0.2.4`

    The contract is deployed on :logos-ethereum: Ethereum at [`0x2F50D538606Fa9EDD2B11E2446BEb18C9D5846bB`](https://etherscan.io/address/0x2F50D538606Fa9EDD2B11E2446BEb18C9D5846bB).

The contract also **acts as a registry for the gauges**, storing information such as the gauge data, minted amounts, and more.

---

## **Adding Gauges and Gauge Data**

After a liquidity gauge was deployed, it can be added to the `GaugeController` for it to be elegible to recieve CRV emissions. Adding a gauge requires a successfully passed DAO vote.

!!!info "Check if a Gauge has been added to the GaugeController"

    The contract does not have a public getter to check whether a gauge has been added. Alternatively, one can try to query the `gauge_types` of the gauge.

    ```shell
    >>> GaugeController.gauge_types('0xbfcf63294ad7105dea65aa58f8ae5be2d9d0952a')
    0

    >>> GaugeController.gauge_types('0xc840e5ed7a1b6a9c1a6bf1ecaca6ddb151b2fd6e')
    Error: Returned error: execution reverted
    ```

    If the gauge returns an `int128`, this means the gauge has been added. The returned value represents the [gauge type](#gauge_types). If the query call reverts, this means the gauge has not been added.

### `add_gauge`
!!! description "`GaugeController.add_gauge(addr: address, gauge_type: int128, weight: uint256 = 0)`"

    !!!guard "Guarded Method"
        This function is only callable by the `admin` of the contract. The `admin` in this case is the Curve DAO. So, adding a gauge to the `GaugeController` is in the hands of the DAO.

    !!!warning
        Once a gauge has been added, it cannot be removed. Therefore, new gauges should undergo thorough verification by the community before being added to the `GaugeController`. However, it is possible to 'kill' a gauge, which sets its emission rate to zero. As a result, a 'killed' gauge becomes ineligible for any CRV emissions.

    Function to add a new gauge to the `GaugeController`. Doing this makes the gauge eligible to receive CRV emissions.

    Emits: `NewGauge` event.

    | Input      | Type       | Description |
    | ----------- | --------- | ----------- |
    | `addr`      | `address` | Gauge address |
    | `gauge_type`| `int128`  | Gauge type |
    | `weight`    | `uint256` | Gauge weight; defaults to 0 |

    ??? quote "Source code"

        === "GaugeController.vy"

            ```py
            event NewGauge:
                addr: address
                gauge_type: int128
                weight: uint256

            @external
            def add_gauge(addr: address, gauge_type: int128, weight: uint256 = 0):
                """
                @notice Add gauge `addr` of type `gauge_type` with weight `weight`
                @param addr Gauge address
                @param gauge_type Gauge type
                @param weight Gauge weight
                """
                assert msg.sender == self.admin
                assert (gauge_type >= 0) and (gauge_type < self.n_gauge_types)
                assert self.gauge_types_[addr] == 0  # dev: cannot add the same gauge twice

                n: int128 = self.n_gauges
                self.n_gauges = n + 1
                self.gauges[n] = addr

                self.gauge_types_[addr] = gauge_type + 1
                next_time: uint256 = (block.timestamp + WEEK) / WEEK * WEEK

                if weight > 0:
                    _type_weight: uint256 = self._get_type_weight(gauge_type)
                    _old_sum: uint256 = self._get_sum(gauge_type)
                    _old_total: uint256 = self._get_total()

                    self.points_sum[gauge_type][next_time].bias = weight + _old_sum
                    self.time_sum[gauge_type] = next_time
                    self.points_total[next_time] = _old_total + _type_weight * weight
                    self.time_total = next_time

                    self.points_weight[addr][next_time].bias = weight

                if self.time_sum[gauge_type] == 0:
                    self.time_sum[gauge_type] = next_time
                self.time_weight[addr] = next_time

                log NewGauge(addr, gauge_type, weight)
            ```

    === "Example"

        This example adds the gauge at address `0x41af8cC0811DD07F167752B821CF5B11DBa7Ca85` to the `GaugeController`.

        ```shell
        >>> GaugeController.add_gauge('0x41af8cC0811DD07F167752B821CF5B11DBa7Ca85')
        ```

### `gauges`
!!! description "`GaugeController.gauges(arg0: uint256) -> address: view`"

    Getter for the gauge address at a specific index. Every time a new gauge is added, the variable is populated with the new gauge address. Index 0 equals to the first gauge added.

    Returns: gauge (`address`).

    | Input  | Type      | Description |
    | ------ | --------- | ----------- |
    | `arg0` | `uint256` | Gauge index |

    ??? quote "Source code"

        === "GaugeController.vy"

            ```python
            # Needed for enumeration
            gauges: public(address[1000000000])
            ```

    === "Example"

        :material-information-outline:{ title='This interactive example fetches the output directly on-chain.' } In this example, the address of a gauge at a specific index is returned.

        <div class="highlight">
        <pre><code>>>> GaugeController.gauges(<input id="gaugeIndex" type="number" value="0" min="0"
        style="width: 50px;
            background: transparent;
            border: none;
            border-bottom: 1px solid #ccc;
            color: inherit;
            font-family: inherit;
            font-size: inherit;
            -moz-appearance: textfield;"
            oninput="fetchGauge()"/>)
        <span id="gaugeOutput"></span></code></pre>
        </div>

        <style>
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button {
            -webkit-appearance: none;
            margin: 0;
        }
        </style>


### `n_gauges`
!!! description "`GaugeController.n_gauges -> int128: view`"

    Getter for the total number of gauges added to the `GaugeController`. This variable is incremented by one each time a new gauge is added via the `add_gauge` function.

    Returns: total number of gauges (`int128`).

    ??? quote "Source code"

        === "GaugeController.vy"

            ```python
            n_gauges: public(int128)
            ```

    === "Example"

        :material-information-outline:{ title='This interactive example fetches the output directly on-chain.' } This example returns the total number of gauges added to the `GaugeController`.

        <div class="highlight">
        <pre><code>>>> GaugeController.n_gauges()
        <span id="nGaugesOutput"></span></code></pre>
        </div>



---

## **Vote-Weighting and Gauge Weights**

Users who have a positive veCRV balance can use their voting power to vote for specific gauges. Only gauges who have been added to the `GaugeController` by the DAO can be voted for. These gauge weights define how much CRV emissions a gauge receives.

Users do not need to allocate 100% of their voting power to a single gauge. They can distribute their voting power across multiple gauges.

Gauge weights are updated every Thursday at 00:00 UTC. At this timestamp, the CRV emissions for one week are based on the gauge weights. The current weights remain the same until someone votes. If there are no votes for several weeks in a row, the gauge weights and CRV emissions will stay the same for all subsequent weeks.

!!!example "Example: CRV emissions and Gauge Weights"

    If a gauge receives 10% of the total weight, it will receive 10% of the emissions for the current week.

    At the time of writing, the inflation rate per second of CRV is `5181574864521283150 (CRV.rate())`, which equals 5.18157486452128315 CRV per second.
    The gauge will, therefore, receive approximately 313,381.65 CRV tokens as emissions for the current week, calculated as 5.18157486452128315 CRV per second * 10% * (7 * 86400 seconds).

### `vote_for_gauge_weights`
!!! description "`GaugeController.vote_for_gauge_weights(_gauge_addr: address, _user_weight: uint256):`"

    !!! warning "`WEIGHT_VOTE_DELAY`"
        Gauge weight votes may only be modified once every 10 days.

    Function to allocate a specific amount of voting power to a gauge. The voting power is expressed and measured in bps (units of 0.01%). Minimal weight is 0.01%.

    Emits: `VoteForGauge` event.

    | Input          | Type       | Description   |
    | -------------- | ---------- | ------------- |
    | `_gauge_addr`  |  `address` | Gauge address to allocate weight to |
    | `_user_weight` |  `uint256` | Weight to allocate |

    ??? quote "Source code"

        === "GaugeController.vy"

            ```python
            event VoteForGauge:
                time: uint256
                user: address
                gauge_addr: address
                weight: uint256

            # Cannot change weight votes more often than once in 10 days
            WEIGHT_VOTE_DELAY: constant(uint256) = 10 * 86400

            vote_user_slopes: public(HashMap[address, HashMap[address, VotedSlope]])  # user -> gauge_addr -> VotedSlope
            vote_user_power: public(HashMap[address, uint256])  # Total vote power used by user
            last_user_vote: public(HashMap[address, HashMap[address, uint256]])  # Last user vote's timestamp for each gauge address

            # Past and scheduled points for gauge weight, sum of weights per type, total weight
            # Point is for bias+slope
            # changes_* are for changes in slope
            # time_* are for the last change timestamp
            # timestamps are rounded to whole weeks

            points_weight: public(HashMap[address, HashMap[uint256, Point]])  # gauge_addr -> time -> Point
            changes_weight: HashMap[address, HashMap[uint256, uint256]]  # gauge_addr -> time -> slope
            time_weight: public(HashMap[address, uint256])  # gauge_addr -> last scheduled time (next week)

            points_sum: public(HashMap[int128, HashMap[uint256, Point]])  # type_id -> time -> Point
            changes_sum: HashMap[int128, HashMap[uint256, uint256]]  # type_id -> time -> slope
            time_sum: public(uint256[1000000000])  # type_id -> last scheduled time (next week)

            points_total: public(HashMap[uint256, uint256])  # time -> total weight
            time_total: public(uint256)  # last scheduled time

            points_type_weight: public(HashMap[int128, HashMap[uint256, uint256]])  # type_id -> time -> type weight
            time_type_weight: public(uint256[1000000000])  # type_id -> last scheduled time (next week)

            @external
            def vote_for_gauge_weights(_gauge_addr: address, _user_weight: uint256):
                """
                @notice Allocate voting power for changing pool weights
                @param _gauge_addr Gauge which `msg.sender` votes for
                @param _user_weight Weight for a gauge in bps (units of 0.01%). Minimal is 0.01%. Ignored if 0
                """
                escrow: address = self.voting_escrow
                slope: uint256 = convert(VotingEscrow(escrow).get_last_user_slope(msg.sender), uint256)
                lock_end: uint256 = VotingEscrow(escrow).locked__end(msg.sender)
                _n_gauges: int128 = self.n_gauges
                next_time: uint256 = (block.timestamp + WEEK) / WEEK * WEEK
                assert lock_end > next_time, "Your token lock expires too soon"
                assert (_user_weight >= 0) and (_user_weight <= 10000), "You used all your voting power"
                assert block.timestamp >= self.last_user_vote[msg.sender][_gauge_addr] + WEIGHT_VOTE_DELAY, "Cannot vote so often"

                gauge_type: int128 = self.gauge_types_[_gauge_addr] - 1
                assert gauge_type >= 0, "Gauge not added"
                # Prepare slopes and biases in memory
                old_slope: VotedSlope = self.vote_user_slopes[msg.sender][_gauge_addr]
                old_dt: uint256 = 0
                if old_slope.end > next_time:
                    old_dt = old_slope.end - next_time
                old_bias: uint256 = old_slope.slope * old_dt
                new_slope: VotedSlope = VotedSlope({
                    slope: slope * _user_weight / 10000,
                    end: lock_end,
                    power: _user_weight
                })
                new_dt: uint256 = lock_end - next_time  # dev: raises when expired
                new_bias: uint256 = new_slope.slope * new_dt

                # Check and update powers (weights) used
                power_used: uint256 = self.vote_user_power[msg.sender]
                power_used = power_used + new_slope.power - old_slope.power
                self.vote_user_power[msg.sender] = power_used
                assert (power_used >= 0) and (power_used <= 10000), 'Used too much power'

                ## Remove old and schedule new slope changes
                # Remove slope changes for old slopes
                # Schedule recording of initial slope for next_time
                old_weight_bias: uint256 = self._get_weight(_gauge_addr)
                old_weight_slope: uint256 = self.points_weight[_gauge_addr][next_time].slope
                old_sum_bias: uint256 = self._get_sum(gauge_type)
                old_sum_slope: uint256 = self.points_sum[gauge_type][next_time].slope

                self.points_weight[_gauge_addr][next_time].bias = max(old_weight_bias + new_bias, old_bias) - old_bias
                self.points_sum[gauge_type][next_time].bias = max(old_sum_bias + new_bias, old_bias) - old_bias
                if old_slope.end > next_time:
                    self.points_weight[_gauge_addr][next_time].slope = max(old_weight_slope + new_slope.slope, old_slope.slope) - old_slope.slope
                    self.points_sum[gauge_type][next_time].slope = max(old_sum_slope + new_slope.slope, old_slope.slope) - old_slope.slope
                else:
                    self.points_weight[_gauge_addr][next_time].slope += new_slope.slope
                    self.points_sum[gauge_type][next_time].slope += new_slope.slope
                if old_slope.end > block.timestamp:
                    # Cancel old slope changes if they still didn't happen
                    self.changes_weight[_gauge_addr][old_slope.end] -= old_slope.slope
                    self.changes_sum[gauge_type][old_slope.end] -= old_slope.slope
                # Add slope changes for new slopes
                self.changes_weight[_gauge_addr][new_slope.end] += new_slope.slope
                self.changes_sum[gauge_type][new_slope.end] += new_slope.slope

                self._get_total()

                self.vote_user_slopes[msg.sender][_gauge_addr] = new_slope

                # Record last action time
                self.last_user_vote[msg.sender][_gauge_addr] = block.timestamp

                log VoteForGauge(block.timestamp, msg.sender, _gauge_addr, _user_weight)

            @internal
            def _get_total() -> uint256:
                """
                @notice Fill historic total weights week-over-week for missed checkins
                        and return the total for the future week
                @return Total weight
                """
                t: uint256 = self.time_total
                _n_gauge_types: int128 = self.n_gauge_types
                if t > block.timestamp:
                    # If we have already checkpointed - still need to change the value
                    t -= WEEK
                pt: uint256 = self.points_total[t]

                for gauge_type in range(100):
                    if gauge_type == _n_gauge_types:
                        break
                    self._get_sum(gauge_type)
                    self._get_type_weight(gauge_type)

                for i in range(500):
                    if t > block.timestamp:
                        break
                    t += WEEK
                    pt = 0
                    # Scales as n_types * n_unchecked_weeks (hopefully 1 at most)
                    for gauge_type in range(100):
                        if gauge_type == _n_gauge_types:
                            break
                        type_sum: uint256 = self.points_sum[gauge_type][t].bias
                        type_weight: uint256 = self.points_type_weight[gauge_type][t]
                        pt += type_sum * type_weight
                    self.points_total[t] = pt

                    if t > block.timestamp:
                        self.time_total = t
                return pt
            ```

    === "Example"

        This example allocates 100% of the voting power to `0x4e6bb6b7447b7b2aa268c16ab87f4bb48bf57939`.

        ```shell
        >>> GaugeController.vote_for_gauge_weights('0x4e6bb6b7447b7b2aa268c16ab87f4bb48bf57939', 10000)
        ```

### `vote_user_power`
!!! description "`GaugeController.vote_user_power(arg0: address) -> uint256: view`"

    Getter method for the total allocated voting power by a specific user. If a user has a veCRV balance but has not yet voted, this function will return 0.

    Returns: used voting power (`uint256`).

    | Input  | Type      | Description  |
    | ------ | --------- | ------------ |
    | `arg0` | `address` | User address |

    ??? quote "Source code"

        === "GaugeController.vy"

            ```python
            vote_user_power: public(HashMap[address, uint256])  # Total vote power used by user
            ```

    === "Example"

        :material-information-outline:{ title='This interactive example fetches the output directly on-chain.' } This example returns the total allocated voting power by a specific user.

        <div class="highlight">
        <pre><code>>>> GaugeController.vote_user_power(<input id="voteUserPowerInput" type="text" value="0x989AEb4d175e16225E39E87d0D97A3360524AD80"
        style="width: 350px;
            background: transparent;
            border: none;
            border-bottom: 1px solid #ccc;
            color: inherit;
            font-family: inherit;
            font-size: inherit;
            -moz-appearance: textfield;"
            oninput="fetchVoteUserPower()"/>)
        <span id="voteUserPowerOutput"></span></code></pre>
        </div>

        <style>
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button {
            -webkit-appearance: none;
            margin: 0;
        }
        </style>

### `last_user_vote`
!!! description "`GaugeController.last_user_vote(arg0: address, arg1: address) -> uint256: view`"

    Getter for the last timestamp a specific user voted for a specific gauge.

    Returns: timestamp (`uint256`).

    | Input  | Type      | Description   |
    |--------|-----------|---------------|
    | `arg0` | `address` | User address  |
    | `arg1` | `address` | Gauge address |

    ??? quote "Source code"

        === "GaugeController.vy"

            ```python
            last_user_vote: public(HashMap[address, HashMap[address, uint256]])  # Last user vote's timestamp for each gauge address
            ```

    === "Example"

        :material-information-outline:{ title='This interactive example fetches the output directly on-chain.' } This example returns the last time a user voted for a specific gauge.

        <div class="highlight">
        <pre><code>>>> GaugeController.last_user_vote(
        User: <input id="lastUserVoteInput1"
        type="text"
        value="0x989AEb4d175e16225E39E87d0D97A3360524AD80"
        style="width: 350px;
            background: transparent;
            border: none;
            border-bottom: 1px solid #ccc;
            color: inherit;
            font-family: inherit;
            font-size: inherit;"/>
        Gauge: <input id="lastUserVoteInput2"
        type="text"
        value="0x4e6bb6b7447b7b2aa268c16ab87f4bb48bf57939"
        style="width: 350px;
            background: transparent;
            border: none;
            border-bottom: 1px solid #ccc;
            color: inherit;
            font-family: inherit;
            font-size: inherit;"/>)
        <span id="lastUserVoteOutput"></span></code></pre>
        </div>

### `vote_user_slopes`
!!! description "`GaugeController.vote_user_slopes(arg0: address, arg1: address) -> slope: uint256, power: uint256, end: uint256`"

    Getter method for informations about the current vote weight of a specific user for a specific gauge. In this variable, informations are stored at the time of voting.

    Returns: slope (`uint256`), allocated voting-power (`uint256`) and veCRV lock end (`uint256`).

    | Input | Type     | Description   |
    |-------|----------|---------------|
    | `arg0`| `address`| User address  |
    | `arg1`| `address`| Gauge address |

    ??? quote "Source code"

        === "GaugeController.vy"

            ```python
            vote_user_slopes: public(HashMap[address, HashMap[address, VotedSlope]])  # user -> gauge_addr -> VotedSlope
            ```

    === "Example"

        :material-information-outline:{ title='This interactive example fetches the output directly on-chain.' } This example returns the slope, allocated voting-power and veCRV lock end for a specific user and gauge.

        <div class="highlight">
        <pre><code>>>> GaugeController.vote_user_slopes(
        User: <input id="voteUserSlopesInput1"
        type="text"
        value="0x989AEb4d175e16225E39E87d0D97A3360524AD80"
        style="width: 350px;
            background: transparent;
            border: none;
            border-bottom: 1px solid #ccc;
            color: inherit;
            font-family: inherit;
            font-size: inherit;"/>
        Gauge: <input id="voteUserSlopesInput2"
        type="text"
        value="0x4e6bb6b7447b7b2aa268c16ab87f4bb48bf57939"
        style="width: 350px;
            background: transparent;
            border: none;
            border-bottom: 1px solid #ccc;
            color: inherit;
            font-family: inherit;
            font-size: inherit;"/>)
        <span id="voteUserSlopesOutput"></span></code></pre>
        </div>

### `gauge_relative_weight`
!!! description "`GaugeController.gauge_relative_weight(addr: address, time: uint256 = block.timestamp) -> uint256: view`"

    Getter for the relative weight of specific gauge at a specific time.

    Returns: relative gauge weight normalized to 1e18 (`uint256`).

    | Input  | Type       | Description |
    | ------ | ---------- | ----------- |
    | `addr` |  `address` | Gauge address |
    | `time` |  `uint256` | Timestamp to check the weight at; Defaults to `block.timestamp` |

    ??? quote "Source code"

        === "GaugeController.vy"

            ```vyper
            @external
            @view
            def gauge_relative_weight(addr: address, time: uint256 = block.timestamp) -> uint256:
                """
                @notice Get Gauge relative weight (not more than 1.0) normalized to 1e18
                        (e.g. 1.0 == 1e18). Inflation which will be received by it is
                        inflation_rate * relative_weight / 1e18
                @param addr Gauge address
                @param time Relative weight at the specified timestamp in the past or present
                @return Value of relative weight normalized to 1e18
                """
                return self._gauge_relative_weight(addr, time)

            @internal
            @view
            def _gauge_relative_weight(addr: address, time: uint256) -> uint256:
                """
                @notice Get Gauge relative weight (not more than 1.0) normalized to 1e18
                        (e.g. 1.0 == 1e18). Inflation which will be received by it is
                        inflation_rate * relative_weight / 1e18
                @param addr Gauge address
                @param time Relative weight at the specified timestamp in the past or present
                @return Value of relative weight normalized to 1e18
                """
                t: uint256 = time / WEEK * WEEK
                _total_weight: uint256 = self.points_total[t]

                if _total_weight > 0:
                    gauge_type: int128 = self.gauge_types_[addr] - 1
                    _type_weight: uint256 = self.points_type_weight[gauge_type][t]
                    _gauge_weight: uint256 = self.points_weight[addr][t].bias
                    return MULTIPLIER * _type_weight * _gauge_weight / _total_weight

                else:
                    return 0
            ```

    === "Example"

        :material-information-outline:{ title='This interactive example fetches the output directly on-chain.' } This example returns the relative weight of a specific gauge at a specific time.

        <div class="highlight">
        <pre><code>>>> GaugeController.gauge_relative_weight(
        Gauge: <input id="gaugeRelativeWeightInput1"
        type="text"
        value="0x4e6bb6b7447b7b2aa268c16ab87f4bb48bf57939"
        style="width: 350px;
            background: transparent;
            border: none;
            border-bottom: 1px solid #ccc;
            color: inherit;
            font-family: inherit;
            font-size: inherit;"/>
        Time: <input id="gaugeRelativeWeightInput2"
        class="timestamp-input"
        type="number"
        style="width: 350px;
            background: transparent;
            border: none;
            border-bottom: 1px solid #ccc;
            color: inherit;
            font-family: inherit;
            font-size: inherit;"/>)
        <span id="gaugeRelativeWeightOutput"></span></code></pre>
        </div>

### `get_gauge_weight`
!!! description "`GaugeController.get_gauge_weight(addr: address) -> uint256: view`"

    Getter for the current gauge weight of gauge `addr`.

    Returns: gauge weight normalized to 1e18 (`uint256`).

    | Input  | Type      | Description |
    | ------ | --------- | ----------- |
    | `addr` | `address` | Gauge address |

    ??? quote "Source code"

        === "GaugeController.vy"

            ```vyper
            points_weight: public(HashMap[address, HashMap[uint256, Point]])  # gauge_addr -> time -> Point

            @external
            @view
            def get_gauge_weight(addr: address) -> uint256:
                """
                @notice Get current gauge weight
                @param addr Gauge address
                @return Gauge weight
                """
                return self.points_weight[addr][self.time_weight[addr]].bias
            ```

    === "Example"

        :material-information-outline:{ title='This interactive example fetches the output directly on-chain.' } This example returns the current gauge weight of a specific gauge.

        <div class="highlight">
        <pre><code>>>> GaugeController.get_gauge_weight(<input id="getGaugeWeightInput" type="text" value="0x4e6bb6b7447b7b2aa268c16ab87f4bb48bf57939"
        style="width: 50px;
            background: transparent;
            border: none;
            border-bottom: 1px solid #ccc;
            color: inherit;
            font-family: inherit;
            font-size: inherit;
            -moz-appearance: textfield;"
            oninput="fetchGetGaugeWeight()"/>)
        <span id="getGaugeWeightOutput"></span></code></pre>
        </div>

        <style>
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button {
            -webkit-appearance: none;
            margin: 0;
        }
        </style>

### `get_total_weight`
!!! description "`GaugeController.get_total_weight() -> uint256: view`"

    Getter for the current total weight.

    Returns: total weight (`uint256`).

    ??? quote "Source code"

        === "GaugeController.vy"

            ```vyper
            points_total: public(HashMap[uint256, uint256])  # time -> total weight

            @external
            @view
            def get_total_weight() -> uint256:
                """
                @notice Get current total (type-weighted) weight
                @return Total weight
                """
                return self.points_total[self.time_total]
            ```

    === "Example"

        :material-information-outline:{ title='This interactive example fetches the output directly on-chain.' } This example returns the current total weight.

        <div class="highlight">
        <pre><code>>>> GaugeController.get_total_weight()
        <span id="getTotalWeightOutput"></span></code></pre>
        </div>

### `get_weights_sum_per_type`
!!! description "`GaugeController.get_weights_sum_per_type(type_id: int128) -> uint256: view`"

    Getter for the summed weight of gauge type `type_id`.

    Returns: summed weight (`uint256`).

    | Input     | Type     | Description   |
    | --------- | -------- | ------------- |
    | `type_id` | `int128` | Gauge type ID |

    ??? quote "Source code"

        === "GaugeController.vy"

            ```vyper
            points_sum: public(HashMap[int128, HashMap[uint256, Point]])  # type_id -> time -> Point

            @external
            @view
            def get_weights_sum_per_type(type_id: int128) -> uint256:
                """
                @notice Get sum of gauge weights per type
                @param type_id Type id
                @return Sum of gauge weights
                """
                return self.points_sum[type_id][self.time_sum[type_id]].bias
            ```

    === "Example"

        :material-information-outline:{ title='This interactive example fetches the output directly on-chain.' } This example returns the summed weight of a specific gauge type.

        <div class="highlight">
        <pre><code>>>> GaugeController.get_weights_sum_per_type(<input id="getWeightsSumPerTypeInput" type="number" value="0" min="0"
        style="width: 50px;
            background: transparent;
            border: none;
            border-bottom: 1px solid #ccc;
            color: inherit;
            font-family: inherit;
            font-size: inherit;
            -moz-appearance: textfield;"
            oninput="fetchGetWeightsSumPerType()"/>)
        <span id="getWeightsSumPerTypeOutput"></span></code></pre>
        </div>

        <style>
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button {
            -webkit-appearance: none;
            margin: 0;
        }
        </style>

---

## **Points**

GaugeController records points (bias + slope) per gauge in `vote_points`, and scheduled changes in biases and slopes for those points in `vote_bias_changes` and `vote_slope_changes`. New changes are applied at the start of each epoch week.

*A `Point` is composed of a `bias` and a `slope`:*

```vyper
struct Point:
    bias: uint256
    slope: uint256
```

### `points_weight`
!!! description "`GaugeController.points_weight(arg0: address, arg1: uint256)`"

    Getter for the `Point` information of a user `arg0`.

    Returns: bias (`uint256`) and slope (`uint256`).

    | Input  | Type      | Description   |
    | ------ | --------- | ------------- |
    | `arg0` | `address` | User address  |
    | `arg1` | `uint256` | Point |

    ??? quote "Source code"

        === "GaugeController.vy"

            ```python
            points_weight: public(HashMap[address, HashMap[uint256, Point]])  # gauge_addr -> time -> Point
            ```

    === "Example"

        :material-information-outline:{ title='This interactive example fetches the output directly on-chain.' } This example returns the bias and slope for a specific user and point.

        <div class="highlight">
        <pre><code>>>> GaugeController.points_weight(
        User: <input id="pointsWeightInput1"
        type="text"
        value="0x989AEb4d175e16225E39E87d0D97A3360524AD80"
        style="width: 350px;
            background: transparent;
            border: none;
            border-bottom: 1px solid #ccc;
            color: inherit;
            font-family: inherit;
            font-size: inherit;"/>
        Point: <input id="pointsWeightInput2"
        type="number"
        value="0"
        style="width: 350px;
            background: transparent;
            border: none;
            border-bottom: 1px solid #ccc;
            color: inherit;
            font-family: inherit;
            font-size: inherit;"/>)
        <span id="pointsWeightOutput"></span></code></pre>
        </div>

### `time_weight`
!!! description "`GaugeController.time_weight(arg0: address) -> uint256: view`"

    Getter for the last scheduled time the gauge weight of gauge `arg0` updates. This should always be the coming Thursday at 00:00 UTC and is updated when a gauge weight is updated.

    Returns: timestamp (`uint256`).

    | Input  | Type      | Description   |
    | ------ | --------- | ------------- |
    | `arg0` | `address` | Gauge address |

    ??? quote "Source code"

        === "GaugeController.vy"

            ```vyper
            time_weight: public(HashMap[address, uint256])  # gauge_addr -> last scheduled time (next week)
            ```

    === "Example"

        :material-information-outline:{ title='This interactive example fetches the output directly on-chain.' } This example returns the last scheduled time the gauge weight of a specific gauge updates.

        <div class="highlight">
        <pre><code>>>> GaugeController.time_weight(<input id="timeWeightInput" type="text" value="0x4e6bb6b7447b7b2aa268c16ab87f4bb48bf57939"
        style="width: 350px;
            background: transparent;
            border: none;
            border-bottom: 1px solid #ccc;
            color: inherit;
            font-family: inherit;
            font-size: inherit;
            -moz-appearance: textfield;"
            oninput="fetchTimeWeight()"/>)
        <span id="timeWeightOutput"></span></code></pre>
        </div>

        <style>
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button {
            -webkit-appearance: none;
            margin: 0;
        }
        </style>


### `points_sum`
!!! description "`GaugeController.points_sum(arg0: int128, arg1: uint256) -> bias: uint256, slope: uint256: view`"

    Getter for informations from `Point` struct.

    Returns: bias (`uint256`) and slope (`uint256`).

    | Input  | Type      | Description   |
    | ------ | --------- | ------------- |
    | `arg0` | `int128`  | Gauge type ID |
    | `arg0` | `address` | Timestamp     |

    ??? quote "Source code"

        === "GaugeController.vy"

            ```vyper
            points_sum: public(HashMap[int128, HashMap[uint256, Point]])  # type_id -> time -> Point
            ```

    === "Example"

        :material-information-outline:{ title='This interactive example fetches the output directly on-chain.' } This example returns the bias and slope for a specific gauge type and point.

        <div class="highlight">
        <pre><code>>>> GaugeController.points_sum(
        Type: <input id="pointsSumInput1"
        type="number"
        value="0"
        style="width: 50px;
            background: transparent;
            border: none;
            border-bottom: 1px solid #ccc;
            color: inherit;
            font-family: inherit;
            font-size: inherit;"/>
        Time: <input id="pointsSumInput2"
        class="timestamp-input"
        type="number"
        value="1708560000"
        style="width: 350px;
            background: transparent;
            border: none;
            border-bottom: 1px solid #ccc;
            color: inherit;
            font-family: inherit;
            font-size: inherit;"/>)
        <span id="pointsSumOutput"></span></code></pre>
        </div>

### `time_sum`
!!! description "`GaugeController.time_sum(arg0: uint256) -> uint256: view`"

    Getter for the last scheduled time (next week).

    Returns: timestamp (`uin256`).

    | Input  | Type      | Description   |
    | ------ | --------- | ------------- |
    | `arg0` | `uint256` | Gauge type ID |

    ??? quote "Source code"

        === "GaugeController.vy"

            ```vyper
            time_sum: public(uint256[1000000000])  # type_id -> last scheduled time (next week)
            ```

    === "Example"

        :material-information-outline:{ title='This interactive example fetches the output directly on-chain.' } This example returns the last scheduled time the gauge weights of a specific gauge type update.

        <div class="highlight">
        <pre><code>>>> GaugeController.time_sum(<input id="timeSumInput" type="number" value="0" min="0"
        style="width: 50px;
            background: transparent;
            border: none;
            border-bottom: 1px solid #ccc;
            color: inherit;
            font-family: inherit;
            font-size: inherit;
            -moz-appearance: textfield;"
            oninput="fetchTimeSum()"/>)
        <span id="timeSumOutput"></span></code></pre>
        </div>

        <style>
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button {
            -webkit-appearance: none;
            margin: 0;
        }
        </style>


### `points_total`
!!! description "`GaugeController.points_total(arg0: uint256) -> uint256: view`"

    Getter for the currennt future total weight at timestamp `arg0`.

    Returns: total points (`uin256`).

    | Input  | Type      | Description   |
    | ------ | --------- | ------------- |
    | `arg0` | `uint256` | Timestamp of the next gauge weight update |

    ??? quote "Source code"

        === "GaugeController.vy"

            ```vyper
            points_total: public(HashMap[uint256, uint256])  # time -> total weight
            ```

    === "Example"

        :material-information-outline:{ title='This interactive example fetches the output directly on-chain.' } This example returns the current future total weight at a specific timestamp.

        <div class="highlight">
        <pre><code>>>> GaugeController.points_total(<input id="pointsTotalInput" type="number" value="1732752000" min="0"
        style="width: 100px;
            background: transparent;
            border: none;
            border-bottom: 1px solid #ccc;
            color: inherit;
            font-family: inherit;
            font-size: inherit;
            -moz-appearance: textfield;"
            oninput="fetchPointsTotal()"/>)
        <span id="pointsTotalOutput"></span></code></pre>
        </div>

        <style>
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button {
            -webkit-appearance: none;
            margin: 0;
        }
        </style>


### `time_total`
!!! description "`GaugeController.time_total() -> uint256: view`"

    Getter for the last scheduled time when the gauge weights will update.

    Returns: timestamp (`uin256`).

    ??? quote "Source code"

        === "GaugeController.vy"

            ```vyper
            time_total: public(uint256)  # last scheduled time
            ```

    === "Example"

        :material-information-outline:{ title='This interactive example fetches the output directly on-chain.' } This example returns the last scheduled time when the gauge weights will update.

        <div class="highlight">
        <pre><code>>>> GaugeController.time_total()
        <span id="timeTotalOutput"></span></code></pre>
        </div>


### `points_type_weight`
!!! description "`GaugeController.points_type_weight(arg0: int128, arg1: uint256) -> uint256: view`"

    Getter for the weight for gauge type `arg0` at the next update, which is at timestamp `arg1`.

    Returns: type weigt (`uint256`).

    | Input  | Type      | Description   |
    | ------ | --------- | ------------- |
    | `arg0` | `int128`  | Gauge type ID |
    | `arg1` | `uint256` | Timestamp     |

    ??? quote "Source code"

        === "GaugeController.vy"

            ```vyper
            points_type_weight: public(HashMap[int128, HashMap[uint256, uint256]])  # type_id -> time -> type weight
            ```

    === "Example"

        :material-information-outline:{ title='This interactive example fetches the output directly on-chain.' } This example returns the weight for a specific gauge type at a specific timestamp.

        <div class="highlight">
        <pre><code>>>> GaugeController.points_type_weight(
        Type: <input id="pointsTypeWeightInput1"
        type="number"
        value="0"
        style="width: 50px;
            background: transparent;
            border: none;
            border-bottom: 1px solid #ccc;
            color: inherit;
            font-family: inherit;
            font-size: inherit;"/>
        Time: <input id="pointsTypeWeightInput2"
        class="timestamp-input"
        type="number"
        style="width: 350px;
            background: transparent;
            border: none;
            border-bottom: 1px solid #ccc;
            color: inherit;
            font-family: inherit;
            font-size: inherit;"/>)
        <span id="pointsTypeWeightOutput"></span></code></pre>
        </div>

### `time_type_weight`
!!! description "`GaugeController.time_type_weight(arg0: uint256) -> uint256: view`"

    Getter for the last scheduled time, when the type weights update.

    Returns: timestamp (`uint256`).

    | Input  | Type      | Description   |
    | ------ | --------- | ------------- |
    | `arg0` | `uint256` | Type ID |

    ??? quote "Source code"

        === "GaugeController.vy"

            ```vyper
            time_type_weight: public(uint256[1000000000])  # type_id -> last scheduled time (next week)
            ```

    === "Example"

        :material-information-outline:{ title='This interactive example fetches the output directly on-chain.' } This example returns the last scheduled time when the gauge weights of a specific gauge type update.

        <div class="highlight">
        <pre><code>>>> GaugeController.time_type_weight(<input id="timeTypeWeightInput" type="number" value="0" min="0"
        style="width: 50px;
            background: transparent;
            border: none;
            border-bottom: 1px solid #ccc;
            color: inherit;
            font-family: inherit;
            font-size: inherit;
            -moz-appearance: textfield;"
            oninput="fetchTimeTypeWeight()"/>)
        <span id="timeTypeWeightOutput"></span></code></pre>
        </div>

        <style>
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button {
            -webkit-appearance: none;
            margin: 0;
        }
        </style>

---

## **Gauge Types**

Each liquidity gauge is assigned a type within the `GaugeController`. Grouping gauges by type allows the DAO to adjust the emissions according to type, making it possible to e.g. end all emissions for a single type.

| Description                                | Gauge Type |
| ------------------------------------------ | :--------: |
| :logos-ethereum: `Ethereum (stable pools)` |     `0`    |
|        :logos-fantom: `Fantom`             |     `1`    |
|       :logos-polygon: `Polygon`            |     `2`    |
| :no_entry_sign: `deprecated`               |     `3`    |
|        :logos-gnosis: `Gnosis`             |     `4`    |
| :logos-ethereum: `Ethereum (crypto pools)` |     `5`    |
| :no_entry_sign: `deprecated`               |     `6`    |
|        :logos-arbitrum: `Arbitrum`         |     `7`    |
|       :logos-avalanche: `Avalance`         |     `8`    |
|         :logos-harmony: `Harmony`          |     `9`    |
|               :moneybag: `Fundraising`     |    `10`    |
|       :logos-optimism: `Optimism`          |    `11`    |
|  :logos-bsc: `BinanceSmartChain`           |    `12`    |

### `gauge_types`
!!! description "`GaugeController.gauge_types(_addr: address) -> int128: view`"

    Getter for the gauge type of a specific gauge.

    Returns: gauge type (`int128`).

    | Input   | Type      | Description   |
    | ------- | --------- | ------------- |
    | `_addr` | `address` | Gauge address |

    ??? quote "Source code"

        === "GaugeController.vy"

            ```python
            gauge_types_: HashMap[address, int128]

            @external
            @view
            def gauge_types(_addr: address) -> int128:
                """
                @notice Get gauge type for address
                @param _addr Gauge address
                @return Gauge type id
                """
                gauge_type: int128 = self.gauge_types_[_addr]
                assert gauge_type != 0

                return gauge_type - 1
            ```

    === "Example"

        :material-information-outline:{ title='This interactive example fetches the output directly on-chain.' } This example returns the gauge type of a specific gauge.

        <div class="highlight">
        <pre><code>>>> GaugeController.gauge_types(<input id="gaugeTypesInput" type="text" value="0x4e6bb6b7447b7b2aa268c16ab87f4bb48bf57939"
        style="width: 350px;
            background: transparent;
            border: none;
            border-bottom: 1px solid #ccc;
            color: inherit;
            font-family: inherit;
            font-size: inherit;
            -moz-appearance: textfield;"
            oninput="fetchGaugeTypes()"/>)
        <span id="gaugeTypesOutput"></span></code></pre>
        </div>

        <style>
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button {
            -webkit-appearance: none;
            margin: 0;
        }
        </style>

### `n_gauge_types`
!!! description "`GaugeController.n_gauge_types() -> int128: view`"

    Getter for the total number of gauge types. New gauge types can be added via the [`add_type`](#add_type) function.

    Returns: total number of types (`int128`).

    ??? quote "Source code"

        === "GaugeController.vy"

            ```python
            n_gauge_types: public(int128)
            ```

    === "Example"

        :material-information-outline:{ title='This interactive example fetches the output directly on-chain.' } This example returns the total number of gauge types.

        <div class="highlight">
        <pre><code>>>> GaugeController.n_gauge_types()
        <span id="nGaugeTypesOutput"></span></code></pre>
        </div>

### `gauge_type_names`
!!! description "`GaugeController.gauge_type_names(arg0: int128) -> String[64]: view`"

    Getter for the name of a specific gauge type.

    Returns: type name (`string`).

    | Input   | Type      | Description   |
    | ------- | --------- | ------------- |
    | `arg0`  | `int128`  | Gauge type index |

    ??? quote "Source code"

        === "GaugeController.vy"

            ```python
            gauge_type_names: public(HashMap[int128, String[64]])
            ```

    === "Example"

        :material-information-outline:{ title='This interactive example fetches the output directly on-chain.' } This example returns the name of a specific gauge type.

        <div class="highlight">
        <pre><code>>>> GaugeController.gauge_type_names(<input id="gaugeTypeNamesInput" type="number" value="0" min="0"
        style="width: 50px;
            background: transparent;
            border: none;
            border-bottom: 1px solid #ccc;
            color: inherit;
            font-family: inherit;
            font-size: inherit;"/>)
        <span id="gaugeTypeNamesOutput"></span></code></pre>
        </div>

        <style>
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button {
            -webkit-appearance: none;
            margin: 0;
        }
        </style>

### `get_type_weight`
!!! description "`GaugeController.get_type_weight(type_id: int128) -> uint256: view`"

    Getter for the type weight of a specific gauge type.

    Returns: type weight (`uint256`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `type_id` |  `int128` | Gauge type ID |

    ??? quote "Source code"

        === "GaugeController.vy"

            ```python
            @external
            @view
            def get_type_weight(type_id: int128) -> uint256:
                """
                @notice Get current type weight
                @param type_id Type id
                @return Type weight
                """
                return self.points_type_weight[type_id][self.time_type_weight[type_id]]

            @internal
            def _get_type_weight(gauge_type: int128) -> uint256:
                """
                @notice Fill historic type weights week-over-week for missed checkins
                        and return the type weight for the future week
                @param gauge_type Gauge type id
                @return Type weight
                """
                t: uint256 = self.time_type_weight[gauge_type]
                if t > 0:
                    w: uint256 = self.points_type_weight[gauge_type][t]
                    for i in range(500):
                        if t > block.timestamp:
                            break
                        t += WEEK
                        self.points_type_weight[gauge_type][t] = w
                        if t > block.timestamp:
                            self.time_type_weight[gauge_type] = t
                    return w
                else:
                    return 0
            ```

    === "Example"

        :material-information-outline:{ title='This interactive example fetches the output directly on-chain.' } This example returns the type weight of a specific gauge type.

        <div class="highlight">
        <pre><code>>>> GaugeController.get_type_weight(<input id="getTypeWeightInput" type="number" value="0" min="0"
        style="width: 50px;
            background: transparent;
            border: none;
            border-bottom: 1px solid #ccc;
            color: inherit;
            font-family: inherit;
            font-size: inherit;
            -moz-appearance: textfield;"
            oninput="fetchGetTypeWeight()"/>)
        <span id="getTypeWeightOutput"></span></code></pre>
        </div>

        <style>
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button {
            -webkit-appearance: none;
            margin: 0;
        }
        </style>

### `add_type`
!!! description "`GaugeController.add_type(_name: String[64], weight: uint256 = 0):`"

    !!!guard "Guarded Method"
        This function is only callable by the `admin` of the contract.

    Function to add a new gauge type.

    Emits: `AddType` event.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_name` |  `String[64]` | Gauge type name |
    | `weight` |  `uint256` | Gauge weight. Defaults to 0 |

    ??? quote "Source code"

        === "GaugeController.vy"

            ```python
            event AddType:
                name: String[64]
                type_id: int128

            # Gauge parameters
            # All numbers are "fixed point" on the basis of 1e18
            n_gauge_types: public(int128)
            n_gauges: public(int128)
            gauge_type_names: public(HashMap[int128, String[64]])

            points_weight: public(HashMap[address, HashMap[uint256, Point]])  # gauge_addr -> time -> Point
            changes_weight: HashMap[address, HashMap[uint256, uint256]]  # gauge_addr -> time -> slope
            time_weight: public(HashMap[address, uint256])  # gauge_addr -> last scheduled time (next week)

            points_sum: public(HashMap[int128, HashMap[uint256, Point]])  # type_id -> time -> Point
            changes_sum: HashMap[int128, HashMap[uint256, uint256]]  # type_id -> time -> slope
            time_sum: public(uint256[1000000000])  # type_id -> last scheduled time (next week)

            points_total: public(HashMap[uint256, uint256])  # time -> total weight
            time_total: public(uint256)  # last scheduled time

            points_type_weight: public(HashMap[int128, HashMap[uint256, uint256]])  # type_id -> time -> type weight
            time_type_weight: public(uint256[1000000000])  # type_id -> last scheduled time (next week)

            @external
            def add_type(_name: String[64], weight: uint256 = 0):
                """
                @notice Add gauge type with name `_name` and weight `weight`
                @param _name Name of gauge type
                @param weight Weight of gauge type
                """
                assert msg.sender == self.admin
                type_id: int128 = self.n_gauge_types
                self.gauge_type_names[type_id] = _name
                self.n_gauge_types = type_id + 1
                if weight != 0:
                    self._change_type_weight(type_id, weight)
                    log AddType(_name, type_id)

            @internal
            def _change_type_weight(type_id: int128, weight: uint256):
                """
                @notice Change type weight
                @param type_id Type id
                @param weight New type weight
                """
                old_weight: uint256 = self._get_type_weight(type_id)
                old_sum: uint256 = self._get_sum(type_id)
                _total_weight: uint256 = self._get_total()
                next_time: uint256 = (block.timestamp + WEEK) / WEEK * WEEK

                _total_weight = _total_weight + old_sum * weight - old_sum * old_weight
                self.points_total[next_time] = _total_weight
                self.points_type_weight[type_id][next_time] = weight
                self.time_total = next_time
                self.time_type_weight[type_id] = next_time

                log NewTypeWeight(type_id, next_time, weight, _total_weight)
            ```

    === "Example"

        This example adds a new gauge type with the name `New Test GaugeType` and a weight of `0`. Adding a new gauge type increases the `n_gauge_types` by `1`. Consequently, the new gauge type will have an ID of `14` (as there are already `13` gauge types before this new addition).

        ```shell
        >>> GaugeController.n_gauge_types()
        13

        >>> GaugeController.add_type('New Test GaugeType', 0)

        >>> GaugeController.n_gauge_types()
        14
        ```

### `change_type_weight`
!!! description "`GaugeController.change_type_weight(type_id: int128, weight: uint256):`"

    !!!guard "Guarded Method"
        This function is only callable by the `admin` of the contract.

    Function to change the weight for a specific gauge type.

    Emits: `NewTypeWeight` event.

    | Input     | Type      | Description   |
    | --------- | --------- | ------------- |
    | `type_id` | `int128`  | Gauge type ID |
    | `weight`  | `uint256` | New gauge type weight |

    ??? quote "Source code"

        === "GaugeController.vy"

            ```python
            event NewTypeWeight:
                type_id: int128
                time: uint256
                weight: uint256
                total_weight: uint256

            points_weight: public(HashMap[address, HashMap[uint256, Point]])  # gauge_addr -> time -> Point
            changes_weight: HashMap[address, HashMap[uint256, uint256]]  # gauge_addr -> time -> slope
            time_weight: public(HashMap[address, uint256])  # gauge_addr -> last scheduled time (next week)

            points_sum: public(HashMap[int128, HashMap[uint256, Point]])  # type_id -> time -> Point
            changes_sum: HashMap[int128, HashMap[uint256, uint256]]  # type_id -> time -> slope
            time_sum: public(uint256[1000000000])  # type_id -> last scheduled time (next week)

            points_total: public(HashMap[uint256, uint256])  # time -> total weight
            time_total: public(uint256)  # last scheduled time

            points_type_weight: public(HashMap[int128, HashMap[uint256, uint256]])  # type_id -> time -> type weight
            time_type_weight: public(uint256[1000000000])  # type_id -> last scheduled time (next week)

            @external
            def change_type_weight(type_id: int128, weight: uint256):
                """
                @notice Change gauge type `type_id` weight to `weight`
                @param type_id Gauge type id
                @param weight New Gauge weight
                """
                assert msg.sender == self.admin
                self._change_type_weight(type_id, weight)

            @internal
            def _change_type_weight(type_id: int128, weight: uint256):
                """
                @notice Change type weight
                @param type_id Type id
                @param weight New type weight
                """
                old_weight: uint256 = self._get_type_weight(type_id)
                old_sum: uint256 = self._get_sum(type_id)
                _total_weight: uint256 = self._get_total()
                next_time: uint256 = (block.timestamp + WEEK) / WEEK * WEEK

                _total_weight = _total_weight + old_sum * weight - old_sum * old_weight
                self.points_total[next_time] = _total_weight
                self.points_type_weight[type_id][next_time] = weight
                self.time_total = next_time
                self.time_type_weight[type_id] = next_time

                log NewTypeWeight(type_id, next_time, weight, _total_weight)
            ```

    === "Example"

        This example changes the weight of a gauge type with ID `14` to `1000000000000000000`.

        ```shell
        >>> GaugeController.get_type_weight(14)
        0

        >>> GaugeController.change_type_weight(14, 1000000000000000000)

        >>> GaugeController.get_type_weight(14)
        1000000000000000000
        ```

---

## **Contract Info Methods**

### `token`
!!! description "`GaugeController.token() -> address: view`"

    Getter for the Curve DAO Token. This variable can not be changed.

    Returns: crv token (`address`).

    ??? quote "Source code"

        === "GaugeController.vy"

            ```vyper
            token: public(address)  # CRV token

            @external
            def __init__(_token: address, _voting_escrow: address):
                """
                @notice Contract constructor
                @param _token `ERC20CRV` contract address
                @param _voting_escrow `VotingEscrow` contract address
                """
                assert _token != ZERO_ADDRESS
                ...
                self.token = _token
                ...
            ```

    === "Example"

        :material-information-outline:{ title='This interactive example fetches the output directly on-chain.' } This example returns the `CRV` token address.

        <div class="highlight">
        <pre><code>>>> GaugeController.token()
        <span id="tokenOutput"></span></code></pre>
        </div>

### `voting_escrow`
!!! description "`GaugeController.voting_escrow() -> address: view`"

    Getter for the VotingEscrow contract.

    Returns: voting escrow (`address`).

    ??? quote "Source code"

        === "GaugeController.vy"

            ```vyper
            voting_escrow: public(address)  # Voting escrow

            @external
            def __init__(_token: address, _voting_escrow: address):
                """
                @notice Contract constructor
                @param _token `ERC20CRV` contract address
                @param _voting_escrow `VotingEscrow` contract address
                """
                ...
                assert _voting_escrow != ZERO_ADDRESS
                ...
                self.voting_escrow = _voting_escrow
            ```

    === "Example"

        :material-information-outline:{ title='This interactive example fetches the output directly on-chain.' } This example returns the `VotingEscrow (veCRV)` address.

        <div class="highlight">
        <pre><code>>>> GaugeController.voting_escrow()
        <span id="votingEscrowOutput"></span></code></pre>
        </div>

---

## **Contract Ownership**

Admin ownership can be commited by calling `commit_transfer_ownership`. Changes then need to be applied. The current `admin` is the OwnershipAgent, which would require a DAO vote to change it.

### `admin`
!!! description "`GaugeController.admin() -> address: view`"

    Getter for the admin of the contract.

    Returns: admin (`address`).

    ??? quote "Source code"

        === "GaugeController.vy"

            ```vyper
            admin: public(address)  # Can and will be a smart contract

            @external
            def __init__(_token: address, _voting_escrow: address):
                """
                @notice Contract constructor
                @param _token `ERC20CRV` contract address
                @param _voting_escrow `VotingEscrow` contract address
                """
                ...

                self.admin = msg.sender

                ...
            ```

    === "Example"

        :material-information-outline:{ title='This interactive example fetches the output directly on-chain.' } This example returns the current `admin` of the contract.

        <div class="highlight">
        <pre><code>>>> GaugeController.admin()
        <span id="adminOutput"></span></code></pre>
        </div>

### `future_admin`
!!! description "`GaugeController.future_admin() -> address: view`"

    Getter for the future admin of the contract.

    Returns: future admin (`address`).

    ??? quote "Source code"

        === "GaugeController.vy"

            ```vyper
            future_admin: public(address)  # Can and will be a smart contract
            ```

    === "Example"

        :material-information-outline:{ title='This interactive example fetches the output directly on-chain.' } This example returns the current `future_admin` of the contract.

        <div class="highlight">
        <pre><code>>>> GaugeController.future_admin()
        <span id="futureAdminOutput"></span></code></pre>
        </div>

### `commit_transfer_ownership`
!!! description "`GaugeController.commit_transfer_ownership(addr: address)`"

    !!!guard "Guarded Method"
        This function is only callable by the `admin` of the contract.

    Function to commit the ownership of the contract to `addr`.

    Emits: `CommitOwnership` event.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `addr` |  `address` | new admin address |

    ??? quote "Source code"

        === "GaugeController.vy"

            ```vyper
            event CommitOwnership:
                admin: address

            future_admin: public(address)  # Can and will be a smart contract

            @external
            def commit_transfer_ownership(addr: address):
                """
                @notice Transfer ownership of GaugeController to `addr`
                @param addr Address to have ownership transferred to
                """
                assert msg.sender == self.admin  # dev: admin only
                self.future_admin = addr
                log CommitOwnership(addr)
            ```

    === "Example"

        This example commits the ownership of the contract to `0xd8da6bf26964af9d7eed9e03e53415d37aa96045`.

        ```shell
        >>> GaugeController.admin()
        '0x40907540d8a6C65c637785e8f8B742ae6b0b9968'

        >>> GaugeController.commit_transfer_ownership("0xd8da6bf26964af9d7eed9e03e53415d37aa96045")

        >>> GaugeController.future_admin()
        '0xd8da6bf26964af9d7eed9e03e53415d37aa96045'
        ```

### `apply_transfer_ownership`
!!! description "`GaugeController.apply_transfer_ownership() -> address: view`"

    !!!guard "Guarded Method"
        This function is only callable by the `admin` of the contract.

    Function to apply the new ownership.

    Emits: `ApplyOwnership` event.

    ??? quote "Source code"

        === "GaugeController.vy"

            ```vyper
            event ApplyOwnership:
            admin: address

            @external
            def apply_transfer_ownership():
                """
                @notice Apply pending ownership transfer
                """
                assert msg.sender == self.admin  # dev: admin only
                _admin: address = self.future_admin
                assert _admin != ZERO_ADDRESS  # dev: admin not set
                self.admin = _admin
                log ApplyOwnership(_admin)
            ```

    === "Example"

        This example applies the new ownership of the contract to `0xd8da6bf26964af9d7eed9e03e53415d37aa96045` (see the example above).

        ```shell
        >>> GaugeController.admin()
        '0x40907540d8a6C65c637785e8f8B742ae6b0b9968'

        >>> GaugeController.apply_transfer_ownership()

        >>> GaugeController.admin()
        '0xd8da6bf26964af9d7eed9e03e53415d37aa96045'
        ```
