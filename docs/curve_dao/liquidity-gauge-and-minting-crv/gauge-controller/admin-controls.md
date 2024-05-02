<h1>GaugeController: Admin Controls</h1>

These functions are guarded, meaning they can only be executed by the contract's **`admin`**.

---

## **Adding New Gauges and Types**

In order for a liquidity gauge to be elegible to receive CRV emission, its address needs to be added to the GaugeController.

### `add_gauge`
!!! description "`GaugeController.add_gauge(addr: address, gauge_type: int128, weight: uint256 = 0):`"

    !!!guard "Guarded Method"
        This function is only callable by the `admin` of the contract.

    !!!warning
        Once a gauge has been added, it cannot be removed. Therefore, new gauges should undergo thorough verification by the community before being added to the GaugeController. It is possible, however, to 'kill' a gauge, which sets its emission rate to zero. As a result, a 'killed' gauge becomes ineligible for any CRV emissions.

    Function to add a new gauge to the GaugeController.

    Emits: `NewGauge` 

    | Input      | Type   | Description |
    | ----------- | -------| ---------- |
    | `addr` |  `address` | gauge address |
    | `gauge_type` |  `int128` | gauge type |
    | `weight` |  `uint256` | gauge weight; defaults to 0 | 

    ??? quote "Source code"

        ```vyper
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


### `add_type`
!!! description "`GaugeController.add_type(_name: String[64], weight: uint256 = 0):`"

    !!!guard "Guarded Method"
        This function is only callable by the `admin` of the contract.

    Function to add a new gauge type.

    Emits: `AddType`

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_name` |  `String[64]` | gauge type name |
    | `weight` |  `uint256` | gauge weight; defaults to 0 |

    ??? quote "Source code"

        ```vyper
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


### `change_type_weight`
!!! description "`GaugeController.change_type_weight(type_id: int128, weight: uint256):`"

    !!!guard "Guarded Method"
        This function is only callable by the `admin` of the contract.

    Function to change the weight for a give gauge.

    Emits: `NewTypeWeight` 

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `type_id` |  `int128` | gauge type id |
    | `weight` |  `uint256` | new gauge type weight |

    ??? quote "Source code"

        ```vyper
        event NewTypeWeight:
            type_id: int128
            time: uint256
            weight: uint256
            total_weight: uint256

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
        
        ```shell
        >>> GaugeController.change_type_weight(todo)
        todo
        ```


---


## **Contract Ownership** 

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

### `commit_transfer_ownership`
!!! description "`GaugeController.commit_transfer_ownership(addr: address)`"

    !!!guard "Guarded Method"
        This function is only callable by the `admin` of the contract.

    Function to commit the ownership of the contract to `addr`.

    Emits: `CommitOwnership`

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `addr` |  `address` | new admin address |

    ??? quote "Source code"

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
        
        ```shell
        >>> GaugeController.commit_transfer_ownership("0xd8da6bf26964af9d7eed9e03e53415d37aa96045")
        ```


### `apply_transfer_ownership`
!!! description "`GaugeController.apply_transfer_ownership() -> address: view`"

    !!!guard "Guarded Method"
        This function is only callable by the `admin` of the contract.

    Function to apply the new ownership.

    Emits: `ApplyOwnership`

    ??? quote "Source code"

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
        
        ```shell
        >>> GaugeController.apply_transfer_ownership()
        ```