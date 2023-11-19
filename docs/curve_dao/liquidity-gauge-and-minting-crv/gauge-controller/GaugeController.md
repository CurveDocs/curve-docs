The **GaugeController** is responsible for managing and coordinating the distribution of rewards to liquidity providers in various liquidity pools. It *determines the allocation of CRV rewards based on the liquidity provided* by users. By analyzing the gauges, which are parameters that define how rewards are distributed across different pools, the GaugeController ensures a fair and balanced distribution of incentives, encouraging liquidity provision and participation in Curve's ecosystem.


!!!deploy "Contract Source & Deployment"
    **GaugeController** contract is deployed to the Ethereum mainnet at: [0x2F50D538606Fa9EDD2B11E2446BEb18C9D5846bB](https://etherscan.io/address/0x2F50D538606Fa9EDD2B11E2446BEb18C9D5846bB#code).  
    Source code available on [Github](https://github.com/curvefi/curve-dao-contracts/blob/master/contracts/GaugeController.vy).



## **Gauge Types**
More on gauge types see [here](../gauges/overview.md).

### `gauge_types`
!!! description "`GaugeController.gauge_types(_addr: address) -> int128`"

    Getter for the gauge type of gauge `_addr`. 

    Returns: gauge type (`int128`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_addr` |  `address` | gauge address |

    ??? quote "Source code"

        ```vyper
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
        ```shell
        >>> GaugeController.gauge_types("0xbFcF63294aD7105dEa65aA58F8AE5BE2D9d0952A")
        0
        ```


### `n_gauge_types`
!!! description "`GaugeController.n_gauge_types() -> int128: view`"

    Getter for the total number of gauge types.

    Returns: number of gauge types (`int128`).

    ??? quote "Source code"

        ```vyper
        n_gauge_types: public(int128)

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
        ```

    === "Example"
        ```shell
        >>> GaugeController.n_gauge_types()
        12
        ```


### `gauge_type_names`
!!! description "`GaugeController.gauge_type_names(arg0: int128) -> string: view`"

    Getter for the name of gauge type at index `arg0`.

    Returns: type name (`string`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `arg0` |  `int128` | index |

    ??? quote "Source code"

        ```vyper
        gauge_type_names: public(HashMap[int128, String[64]])

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
        ```

    === "Example"
        ```shell
        >>> GaugeController.gauge_type_names(5)
        'Liquidity (Crypto Pools)'
        ```


### `get_type_weight`
!!! description "`GaugeController.get_type_weight(type_id: int128) -> uint256`"

    Getter for the type weight of `type_id`.

    Returns: type weight (`uint256`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `type_id` |  `int128` | gauge type id |

    ??? quote "Source code"

        ```vyper
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
        ```shell
        >>> GaugeController.get_type_weight(0)
        1000000000000000000
        ```


## **Gauges Weights**


### `gauge_relative_weight`
!!! description "`GaugeController.gauge_relative_weight(addr: address, time: uint256 = block.timestamp) -> uint256`"

    Getter for the relative weight of gauge `addr` at timestamp `time`. 

    Returns: relative gauge weight (`uint256`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `addr` |  `address` | gauge address |
    | `time` |  `uint256` | timestamp; defaults to `block.timestamp` |

    !!!tip
        The value of relative weight is normalized to 1e18.

    ??? quote "Source code"

        ```vyper
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
        ```

    === "Example"
        ```shell
        >>> GaugeController.gauge_relative_weight("0x555766f3da968ecbefa690ffd49a2ac02f47aa5f")
        27557442674450559
        ```


### `get_gauge_weight`
!!! description "GaugeController.get_gauge_weight(addr: address) -> uint256`"

    Getter for the current gauge weight of gauge `addr`.

    Returns: gauge weight (`uint256`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `addr` |  `address` | gauge address |

    ??? quote "Source code"

        ```vyper
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
        ```shell
        >>> GaugeController.get_gauge_weight("0xbFcF63294aD7105dEa65aA58F8AE5BE2D9d0952A")
        1987873524145187062272000
        ```


### `get_total_weight`
!!! description "`GaugeController.get_total_weight() -> uint256`"

    Getter for the current total (type-weighted) weight.

    Returns: total weight (`uint256`).

    ??? quote "Source code"

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
        
        ```shell
        >>> GaugeController.get_total_weight()
        547873886536122498468683976000000000000000000
        ```


### `get_weights_sum_per_type`
!!! description "`GaugeController.get_weights_sum_per_type(type_id: int128) -> uint256`"

    Getter for the summed weight of gauge type `type_id`.

    Returns: summed weight (`uint256`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `type_id` |  `int128` | gauge type id |

    ??? quote "Source code"

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
        ```shell
        >>> GaugeController.get_weights_sum_per_type(0)
        357345591048932206476271176
        ```


## **Gauge Info**

### `n_gauges`
!!! description "`GaugeController.n_gauges -> int128: view`"

    Getter for the total amount of individual gauges. 

    Returns: amount of gauges (`int128`).

    ??? quote "Source code"

        ```vyper
        n_gauges: public(int128)

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
        ```shell
        >>> GaugeController.n_gauges()
        264
        ```

### `gauges`
!!! description "`GaugeController.gauges(arg0: uint256) -> address: view`"

    Getter for the gauge address at index `arg0`.

    Returns: gauge (`address`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `arg0` |  `uint256` | gauge index  |

    ??? quote "Source code"

        ```vyper
        gauges: public(address[1000000000])

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
        ```

    === "Example"
        ```shell
        >>> GaugeController.gauges(10)
        '0x18478F737d40ed7DEFe5a9d6F1560d84E283B74e'
        ```


## **Vote-Weighting**
Vote weight power is expressed as an `integer` in bps (units of 0.01%). `10000` is equivalent to a 100% vote weight.


### `vote_for_gauge_weights`
!!! description "`GaugeController.vote_for_gauge_weights(_gauge_addr: address, _user_weight: uint256):`"

    !!! warning
        A gauge weight vote may only be modified once every 10 days.

    Function to allocate `_user_weight` voting power to gauge `_gauge_addr`. Weight for a gauge is measured in bps (uints of 0.01%). Minimal weight is 0.01%.

    Emits: `VoteForGauge`

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_gauge_addr` |  `address` | gauge address |
    | `_user_weight` |  `address` | user weight |

    ??? quote "Source code"

        ```vyper
        event VoteForGauge:
            time: uint256
            user: address
            gauge_addr: address
            weight: uint256

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
        ```

    === "Example"
        ```shell
        >>> GaugeController.vote_for_gauge("0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7", 10000)
        todo
        ```


### `vote_user_power`
!!! description "`GaugeController.vote_user_power(arg0: address) -> uint256: view`"

    Getter method for the total voting power used by address `arg0`.

    Returns: used voting power (`uint256`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `arg0` |  `address` | user address |

    ??? quote "Source code"

        ```vyper
        vote_user_power: public(HashMap[address, uint256])  # Total vote power used by user
        
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
        ```

    === "Example"
        ```shell
        >>> GaugeController.vote_user_power("0x989AEb4d175e16225E39E87d0D97A3360524AD80")
        10000
        ```


### `last_user_vote`
!!! description "`GaugeController.last_user_vote(arg0: address, arg1: address) -> uint256: view`"

    Getter for the last timestamp user `arg0` voted for gauge `arg1`.

    Returns: timestamp (`uint256`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `arg0` |  `address` | user address |
    | `arg1` |  `address` | gauge address |

    ??? quote "Source code"

        ```vyper
        last_user_vote: public(HashMap[address, HashMap[address, uint256]])  # Last user vote's timestamp for each gauge address
        
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
        ```

    === "Example"
        ```shell
        >>> GaugeController.last_user_vote("0x989AEb4d175e16225E39E87d0D97A3360524AD80", "0x2932a86df44fe8d2a706d8e9c5d51c24883423f5")
        1685414927
        ```


### `vote_user_slopes`
!!! description "`GaugeController.vote_user_slopes(arg0: address, arg1: address) -> slope: uint256, power: uint256, end: uint256`"

    Getter method for informations about users's `arg0` current vote weight for gauge `arg1`.

    Returns: slope (`uint256`), allocated voting-power (`uint256`) and veCRV lock end (`uint256`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `arg0` |  `address` | user address |
    | `arg1` |  `address` | gauge address |

    ??? quote "Source code"

        ```vyper
        vote_user_slopes: public(HashMap[address, HashMap[address, VotedSlope]])  # user -> gauge_addr -> VotedSlope

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
        ```

    === "Example"
        ```shell
        >>> GaugeController.vote_user_slopes("0x989AEb4d175e16225E39E87d0D97A3360524AD80", "0x2932a86df44fe8d2a706d8e9c5d51c24883423f5")
        204492251647245423, 882, 1810771200
        ```



## **Admin Ownership** 

Admin ownership can be commited by calling [`commit_transfer_ownership`](../gauge-controller/admin-controls.md#commit_transfer_ownership). Changes then need to be [applied](../gauge-controller/admin-controls.md#apply_transfer_ownership). The current `admin` is the OwnershipAgent, which would require a DAO vote to change it.

### `admin`
!!! description "`GaugeController.admin() -> address: view`"

    Getter for the admin of the contract.

    Returns: admin (`address`).

    ??? quote "Source code"

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
        ```shell
        >>> GaugeController.admin()
        '0x40907540d8a6C65c637785e8f8B742ae6b0b9968'
        ```


### `future_admin`
!!! description "`GaugeController.future_admin() -> address: view`"

    Getter for the future admin of the contract. 

    Returns: future admin (`address`).

    ??? quote "Source code"

        ```vyper
        future_admin: public(address)  # Can and will be a smart contract
        ```

    === "Example"
        ```shell
        >>> GaugeController.future_admin()
        '0x40907540d8a6C65c637785e8f8B742ae6b0b9968'
        ```


## **Contract Info Methods**

### `token`
!!! description "`GaugeController.token() -> address: view`"

    Getter for the Curve DAO Token.

    Returns: crv token (`address`).

    ??? quote "Source code"

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
        ```shell
        >>> GaugeController.token()
        0xD533a949740bb3306d119CC777fa900bA034cd52
        ```


### `voting_escrow`
!!! description "`GaugeController.voting_escrow() -> address: view`"

    Getter for the VotingEscrow contract.

    Returns: voting escrow (`address`).

    ??? quote "Source code"

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
        ```shell
        >>> GaugeController.voting_escrow()
        0x5f3b5DfEb7B28CDbD7FAba78963EE202a494e2A2
        ```