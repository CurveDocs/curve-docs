!!!note
    **`GaugeController`** contract is deployed on the Ethereum mainnet at: [0x2F50D538606Fa9EDD2B11E2446BEb18C9D5846bB](https://etherscan.io/address/0x2F50D538606Fa9EDD2B11E2446BEb18C9D5846bB#code)   
    Source code of the VotingEscrow contract can be found on [Github](https://github.com/curvefi/curve-dao-contracts/blob/master/contracts/GaugeController.vy).


## **Adding New Gauges and Types**
All of the following methods are only be callable by the DAO [ownership admin](/docs/curve_dao/ownership-proxy/Agents.md) as the result of a successful [vote](add link here).

### `add_gauge`
!!! description "`GaugeController.add_gauge(addr: address, gauge_type: int128, weight: uint256 = 0):`"

    Function to add a gauge `addr` of type `gauge_type` with weight `weight`.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `addr` |  `address` | Gauge Address |
    | `gauge_type` |  `int128` | Gauge Type |
    | `weight` |  `uint256` | Gauge weight | 

    ??? quote "Source code"

        ```python hl_lines="1 7 41"
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
        
        ```shell
        >>> GaugeController.add_gauge(todo)
        todo
        ```
    !!!warning
        Once a gauge has been added it cannot be removed. New gauges should be very carefully verified prior to adding them to the gauge controller.


### `add_type`
!!! description "`GaugeController.add_type(_name: String[64], weight: uint256 = 0):`"

    Function to add type with name `name` and weight `weight`.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `addr` |  `address` | Gauge Address |
    | `gauge_type` |  `int128` | Gauge Type |
    | `weight` |  `uint256` | Gauge weight | 

    ??? quote "Source code"

        ```python hl_lines="1 6 18"
        event AddType:
            name: String[64]
            type_id: int128

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
        >>> GaugeController.add_type(todo):
        todo
        ```


## **Admin Ownership**

### `admin`
!!! description "`GaugeController.admin() -> address: view`"

    Getter for the admin of the contract.

    Returns: `address` of the admin of the contract.

    ??? quote "Source code"

        ```python hl_lines="1 13"
        admin: public(address)  # Can and will be a smart contract

        @external
        def __init__(_token: address, _voting_escrow: address):
            """
            @notice Contract constructor
            @param _token `ERC20CRV` contract address
            @param _voting_escrow `VotingEscrow` contract address
            """
            assert _token != ZERO_ADDRESS
            assert _voting_escrow != ZERO_ADDRESS

            self.admin = msg.sender
            self.token = _token
            self.voting_escrow = _voting_escrow
            self.time_total = block.timestamp / WEEK * WEEK
        ```

    === "Example"
        ```shell
        >>> GaugeController.admin()
        '0x40907540d8a6C65c637785e8f8B742ae6b0b9968'
        ```


### `future_admin`
!!! description "`GaugeController.future_admin() -> address: view`"

    Getter for the future admin of the contract.

    Returns: `address` of the admin of the contract.

    ??? quote "Source code"

        ```python hl_lines="1 10"
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
        ```shell
        >>> GaugeController.future_admin()
        '0x40907540d8a6C65c637785e8f8B742ae6b0b9968'
        ```


### `commit_transfer_ownership`
!!! description "`GaugeController.commit_transfer_ownership(addr: address)`"

    Function to transfer ownership of GaugeController to `addr`.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `addr` |  `address` | New Admin Address |

    ??? quote "Source code"

        ```python hl_lines="1 10"
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
        
        ```shell
        >>> GaugeController.commit_transfer_ownership(todo)
        todo
        ```


### `apply_transfer_ownership`

!!! description "`GaugeController.apply_transfer_ownership() -> address: view`"

    Funtion to apply the pending ownership transfer.

    ??? quote "Source code"

        ```python hl_lines="1 5"
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
        
        ```shell
        >>> GaugeController.apply_transfer_ownership()
        ```













## **Querying Basic Data**

### `gauge_types`
!!! description "`GaugeController.gauge_types(_addr: address) -> int128`"

    Getter of the gauge type(LINK TO GAUGE TYPE PAGE HERE) of a gauge address.  

    Returns: **gauge type** (`int128`) of a gauge address.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_addr` |  `address` | Gauge Addresses |

    ??? quote "Source code"

        ```python hl_lines="1 5"
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
        >>> GaugeController.gauge_types(0xbFcF63294aD7105dEa65aA58F8AE5BE2D9d0952A)
        0
        ```


### `gauge_relative_weight`
!!! description "`GaugeController.gauge_relative_weight(addr: address, time: uint256 = block.timestamp) -> uint256`"

    Getter for the relative weight of a specific gauge. 

    Returns: **relative weight** (`uint256`) of a gauge.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `addr` |  `address` | Gauge Addresses |
    | `time` |  `uint256` | Timestamp |

    ??? quote "Source code"

        ```python hl_lines="3 27"
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
        >>> GaugeController.gauge_relative_weight(0x555766f3da968ecbefa690ffd49a2ac02f47aa5f)
        27557442674450559
        ```
    !!! note
        Function can also be called without the `time` input -> will return the **current** relative gauge weight.  
        The value of relative weight is normalized to 1e18.


### `get_gauge_weight`
!!! description "GaugeController.get_gauge_weight(addr: address) -> uint256`"

    Getter for the current gauge weight of an address.

    Returns: **gauge weight** (`uint256`) of an address.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `addr` |  `address` | Gauge Addresses |

    ??? quote "Source code"

        ```python hl_lines="3"
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
        >>> GaugeController.get_gauge_weight(0xbFcF63294aD7105dEa65aA58F8AE5BE2D9d0952A)
        1987873524145187062272000
        ```


### `get_type_weight`
!!! description "`GaugeController.get_type_weight(type_id: int128) -> uint256`"

    Getter for the type weight of a gauge type.

    Returns: **type weight** (`uint256`) of a gauge.


    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `type_id` |  `int128` | Gauge Type |

    ??? quote "Source code"

        ```python hl_lines="0"
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


        @external
        @view
        def get_type_weight(type_id: int128) -> uint256:
            """
            @notice Get current type weight
            @param type_id Type id
            @return Type weight
            """
            return self.points_type_weight[type_id][self.time_type_weight[type_id]]
        ```

    === "Example"
        ```shell
        >>> GaugeController.get_type_weight(0)
        1000000000000000000
        ```


### `get_total_weight`
!!! description "`GaugeController.get_total_weight() -> uint256`"

    Getter for the current total (type-weighted) weight.

    Returns: **total weight** (`uint256`).

    ??? quote "Source code"

        ```python hl_lines="1 5"
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

    Getter for the sum of gauge weights per type.

    Returns: **sum of weight per type** (`uint256`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `type_id` |  `int128` | Gauge Type |

    ??? quote "Source code"

        ```python hl_lines=5"
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

### `token`
!!! description "`GaugeController.token() -> address: view`"

    Getter for the token address of the Curve DAO Token.

    Returns: `address` of the **Curve DAO Token**

    ??? quote "Source code"

        ```python hl_lines="1 4 7 10 14"
        token: public(address)  # CRV token

        @external
        def __init__(_token: address, _voting_escrow: address):
            """
            @notice Contract constructor
            @param _token `ERC20CRV` contract address
            @param _voting_escrow `VotingEscrow` contract address
            """
            assert _token != ZERO_ADDRESS
            assert _voting_escrow != ZERO_ADDRESS

            self.admin = msg.sender
            self.token = _token
            self.voting_escrow = _voting_escrow
            self.time_total = block.timestamp / WEEK * WEEK
        ```

    === "Example"
        ```shell
        >>> GaugeController.token()
        0xD533a949740bb3306d119CC777fa900bA034cd52
        ```


### `voting_escrow`
!!! description "`GaugeController.voting_escrow() -> address: view`"

    Getter for the token address of the VotingEscrow.

    Returns: `address` of the **VotingEscrow**

    ??? quote "Source code"

        ```python hl_lines="1 4 8 11 15"
        voting_escrow: public(address)  # Voting escrow

        @external
        def __init__(_token: address, _voting_escrow: address):
            """
            @notice Contract constructor
            @param _token `ERC20CRV` contract address
            @param _voting_escrow `VotingEscrow` contract address
            """
            assert _token != ZERO_ADDRESS
            assert _voting_escrow != ZERO_ADDRESS

            self.admin = msg.sender
            self.token = _token
            self.voting_escrow = _voting_escrow
            self.time_total = block.timestamp / WEEK * WEEK
        ```

    === "Example"
        ```shell
        >>> GaugeController.voting_escrow()
        0x5f3b5DfEb7B28CDbD7FAba78963EE202a494e2A2
        ```


### `n_gauge_types`
!!! description "`GaugeController.n_gauge_types() -> int128: view`"

    Getter for the total amount of gauge types.

    Returns: amount of **gauge types** (`int128`).

    ??? quote "Source code"

        ```python hl_lines="1 13"
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


### `n_gauges`
!!! description "`GaugeController.n_gauges -> int128: view`"

    Getter for the total amount of gauges. 

    Returns: **amount of gauges** (`int128`).

    ??? quote "Source code"

        ```python hl_lines="1 16"
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


### `gauge_type_names`
!!! description "`GaugeController.gauge_type_names(arg0: int128) -> string: view`"

    Getter for the name of a gauge type.

    Returns: **name** (`string`) of a gauge type.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `arg0` |  `int128` | Gauge Type Name |

    ??? quote "Source code"

        ```python hl_lines="1 4 7 12"
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


### `gauges`
!!! description "`GaugeController.gauges(arg0: uint256) -> address: view`"

    Getter for the address of a gauge regarding to it's index id.

    Returns: `address` of a gauge.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `arg0` |  `uint256` | Gauge Index  |

    ??? quote "Source code"

        ```python hl_lines="1 17"
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







add somwhere:
### `vote_user_slopes (x)`
!!! description "`GaugeController.vote_user_slopes(arg0: address, arg1: address) -> slope: uint256, power: uint256, end: uint256`"

    todo

    Returns: todo

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `arg0` |  `address` | todo |
    | `arg1` |  `address` | todo |

    ??? quote "Source code"

        ```python hl_lines="1 22 67"
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
        >>> GaugeController.vote_user_slopes(todo)
        todo
        ```


INCOMPLETE FROM HERE ON



### `vote_user_power (x)`
!!! description "`GaugeController.vote_user_power(arg0: address) -> uint256: view`"

    Returns the total vote power used by a user.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `arg0` |  `address` | todo |

    ??? quote "Source code"

        ```python hl_lines="1 36 38"
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
        >>> GaugeController.vote_user_power(todo)
        todo
        ```


### `last_user_vote (x)`
!!! description "`GaugeController.last_user_vote(arg0: address, arg1: address) -> uint256: view`"

    Returns the total vote power used by a user.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `arg0` |  `address` | todo |
    | `arg1` |  `address` | todo |

    ??? quote "Source code"

        ```python hl_lines="1 17 70"
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
        >>> GaugeController.last_user_vote(todo)
        todo
        ```


### `points_weight (wtf is this)`
!!! description "`GaugeController.last_user_vote(arg0: address, arg1: uint256) -> bias: uint256, slope: uint256`"

    todo

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `arg0` |  `address` | todo |
    | `arg1` |  `uint256` | todo |

    ??? quote "Source code"

        ```python hl_lines="1 13 26"
        points_weight: public(HashMap[address, HashMap[uint256, Point]])  # gauge_addr -> time -> Point
        ```

    === "Example"
        ```shell
        >>> GaugeController.points_weight(todo)
        todo
        ```


### `time_weight`
### `points_sum`
### `time_sum`
### `points_total`
### `time_total`
### `points_type_weight`
### `time_type_weight`
### `change_type_weight`
### `gauge_relative_weight (not appropriate here? maybe further up)`

