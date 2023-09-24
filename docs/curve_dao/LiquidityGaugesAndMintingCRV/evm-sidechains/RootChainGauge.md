Individual RootChainGauges are deployed from a `implementation` via the RootChainGaugeFactory. 


## Transmitting Emissions
### `transmit_emissions`
!!! description "`RootChainGauge.transmit_emissions():`"

    Function to actually mint the CRV emissions from the Minter and bridge them to the ChildGauge on the sidechain/l2 utilizing `bridger`.

    !!!note
        The ChildGauge on the sidechain/L2 has the same address as the RootGauge on ethereum. This function in only callable by the RootChainFactory.

    ??? quote "Source code"

        ```python hl_lines="2 8 14"
        @external
        def transmit_emissions():
            """
            @notice Mint any new emissions and transmit across to child gauge
            """
            assert msg.sender == self.factory  # dev: call via factory

            Minter(MINTER).mint(self)
            minted: uint256 = ERC20(CRV).balanceOf(self)

            assert minted != 0  # dev: nothing minted
            bridger: address = self.bridger

            Bridger(bridger).bridge(CRV, self, minted, value=Bridger(bridger).cost())
        ```

    === "Example"

        ```shell
        >>> RootChainGauge.transmit_emissions():
        ```


### `bridger`
!!! description "`RootChainGauge.bridger() -> address: view`"

    Getter for the bridger address.

    Returns: bridger (`address`).

    ??? quote "Source code"

        ```python hl_lines="1 4 11"
        bridger: public(address)

        @external
        def initialize(_bridger: address, _chain_id: uint256):
            """
            @notice Proxy initialization method
            """
            assert self.factory == ZERO_ADDRESS  # dev: already initialized

            self.chain_id = _chain_id
            self.bridger = _bridger
            self.factory = msg.sender

            inflation_params: InflationParams = InflationParams({
                rate: CRV20(CRV).rate(),
                finish_time: CRV20(CRV).future_epoch_time_write()
            })
            assert inflation_params.rate != 0

            self.inflation_params = inflation_params
            self.last_period = block.timestamp / WEEK

            ERC20(CRV).approve(_bridger, MAX_UINT256)
        ```

    === "Example"

        ```shell
        >>> RootChainGauge.bridger():
        '0xceda55279fe22d256c4e6a6F2174C1588e94B2BB'
        ```


### `update_bridger`
!!! description "`RootChainGauge.update_bridger():`"

    Function to update the bridger contract. Sets approval for the "old" bridger to 0 and gives max approval to the new bridger contract.

    !!!note
        The bridger contract is set within the RootGaugeFactory.

    ??? quote "Source code"

        ```python hl_lines="4 13"
        bridger: public(address)

        @external
        def update_bridger():
            """
            @notice Update the bridger used by this contract
            @dev Bridger contracts should prevent briding if ever updated
            """
            # reset approval
            bridger: address = Factory(self.factory).get_bridger(self.chain_id)
            ERC20(CRV).approve(self.bridger, 0)
            ERC20(CRV).approve(bridger, MAX_UINT256)
            self.bridger = bridger
        ```

    === "Example"

        ```shell
        >>> RootChainGauge.update_bridger():
        ```



## Checkpointing and Inizializing the Gauge

### `use_checkpoint`
!!! description "`RootChainGauge.use_checkpoint():`"

    Function to checkpoint the gauge.

    !!!note
        The ChildGauge on the sidechain/L2 has the same address as the RootGauge on ethereum. This function in only callable by the RootChainFactory.

    ??? quote "Source code"

        ```python hl_lines="8"
        WEEK: constant(uint256) = 604800
        YEAR: constant(uint256) = 86400 * 365
        RATE_DENOMINATOR: constant(uint256) = 10 ** 18
        RATE_REDUCTION_COEFFICIENT: constant(uint256) = 1189207115002721024  # 2 ** (1/4) * 1e18
        RATE_REDUCTION_TIME: constant(uint256) = YEAR

        @external
        def user_checkpoint(_user: address) -> bool:
            """
            @notice Checkpoint the gauge updating total emissions
            @param _user Vestigal parameter with no impact on the function
            """
            # the last period we calculated emissions up to (but not including)
            last_period: uint256 = self.last_period
            # our current period (which we will calculate emissions up to)
            current_period: uint256 = block.timestamp / WEEK

            # only checkpoint if the current period is greater than the last period
            # last period is always less than or equal to current period and we only calculate
            # emissions up to current period (not including it)
            if last_period != current_period:
                # checkpoint the gauge filling in any missing weight data
                GaugeController(GAUGE_CONTROLLER).checkpoint_gauge(self)

                params: InflationParams = self.inflation_params
                emissions: uint256 = 0

                # only calculate emissions for at most 256 periods since the last checkpoint
                for i in range(last_period, last_period + 256):
                    if i == current_period:
                        # don't calculate emissions for the current period
                        break
                    period_time: uint256 = i * WEEK
                    weight: uint256 = GaugeController(GAUGE_CONTROLLER).gauge_relative_weight(self, period_time)

                    if period_time <= params.finish_time and params.finish_time < period_time + WEEK:
                        # calculate with old rate
                        emissions += weight * params.rate * (params.finish_time - period_time) / 10 ** 18
                        # update rate
                        params.rate = params.rate * RATE_DENOMINATOR / RATE_REDUCTION_COEFFICIENT
                        # calculate with new rate
                        emissions += weight * params.rate * (period_time + WEEK - params.finish_time) / 10 ** 18
                        # update finish time
                        params.finish_time += RATE_REDUCTION_TIME
                        # update storage
                        self.inflation_params = params
                    else:
                        emissions += weight * params.rate * WEEK / 10 ** 18

                self.last_period = current_period
                self.total_emissions += emissions

            return True
        ```

    === "Example"

        ```shell
        >>> RootChainGauge.use_checkpoint():
        ```



### `initialize`
!!! description "`RootChainGauge.initialize(_bridger: address, _chain_id: uint256):`"

    Proxy method to initialize the contract. This function is called when a need sidechain/L2 gauge is deployed through the RootChainFactory. Also gives max approval to the bridger contract.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_bridger` |  `address` | Bridger Contract Address |
    | `_chain_id` |  `uint256` | Chain ID |

    ??? quote "Source code"

        ```python hl_lines="2"
        @external
        def initialize(_bridger: address, _chain_id: uint256):
            """
            @notice Proxy initialization method
            """
            assert self.factory == ZERO_ADDRESS  # dev: already initialized

            self.chain_id = _chain_id
            self.bridger = _bridger
            self.factory = msg.sender

            inflation_params: InflationParams = InflationParams({
                rate: CRV20(CRV).rate(),
                finish_time: CRV20(CRV).future_epoch_time_write()
            })
            assert inflation_params.rate != 0

            self.inflation_params = inflation_params
            self.last_period = block.timestamp / WEEK

            ERC20(CRV).approve(_bridger, MAX_UINT256)
        ```

    === "Example"

        ```shell
        >>> RootChainGauge.initialize(todo)
        ```


## Killing the Gauge
### `set_killed`
!!! description "`RootChainGauge.set_killed(_is_killed: bool):`"

    Function to kill the gauge.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_is_killed` |  `bool` | True or False |

    ??? quote "Source code"

        ```python hl_lines="4 11 12"
        inflation_params: public(InflationParams)

        @external
        def set_killed(_is_killed: bool):
            """
            @notice Set the gauge kill status
            @dev Inflation params are modified accordingly to disable/enable emissions
            """
            assert msg.sender == Factory(self.factory).owner()

            if _is_killed:
                self.inflation_params.rate = 0
            else:
                self.inflation_params = InflationParams({
                    rate: CRV20(CRV).rate(),
                    finish_time: CRV20(CRV).future_epoch_time_write()
                })
                self.last_period = block.timestamp / WEEK
            self.is_killed = _is_killed
        ```

    === "Example"

        ```shell
        >>> RootChainGauge.set_killed('True'):
        ```


### `is_killed`
!!! description "`RootChainGauge.is_killed() -> bool: view`"

    Getter function to check if the gauge is killed.

    Returns: True or False (`bool`).

    ??? quote "Source code"

        ```python hl_lines="1"
        is_killed: public(bool)
        ```

    === "Example"

        ```shell
        >>> RootChainGauge.is_killed():
        'False'
        ```


## Contract Info Methods

### `integrate_fraction`
!!! description "`RootChainGauge.integrate_fraction(_user: address) -> uint256:`"

    Getter for the total emissions the gauge `_user` is entitled to.

    Returns: total CRV emissions (`uint256`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_user` |  `address` | L2 / Sidechain Gauge Address |

    ??? quote "Source code"

        ```python hl_lines="3 9"
        @view
        @external
        def integrate_fraction(_user: address) -> uint256:
            """
            @notice Query the total emissions `_user` is entitled to
            @dev Any value of `_user` other than the gauge address will return 0
            """
            if _user == self:
                return self.total_emissions
            return 0
        ```

    === "Example"

        ```shell
        >>> RootChainGauge.integrate_fraction('0xCE5F24B7A95e9cBa7df4B54E911B4A3Dc8CDAf6f'):
        1133904991390208914401020
        ```


### `chain_id`
!!! description "`RootChainGauge.chain_id() -> uint256: view`"

    Getter for the chain ID.

    Returns: chain id (`uint256`).

    ??? quote "Source code"

        ```python hl_lines="1 4 10"
        chain_id: public(uint256)

        @external
        def initialize(_bridger: address, _chain_id: uint256):
            """
            @notice Proxy initialization method
            """
            assert self.factory == ZERO_ADDRESS  # dev: already initialized

            self.chain_id = _chain_id
            self.bridger = _bridger
            self.factory = msg.sender

            inflation_params: InflationParams = InflationParams({
                rate: CRV20(CRV).rate(),
                finish_time: CRV20(CRV).future_epoch_time_write()
            })
            assert inflation_params.rate != 0

            self.inflation_params = inflation_params
            self.last_period = block.timestamp / WEEK

            ERC20(CRV).approve(_bridger, MAX_UINT256)
        ```

    === "Example"

        ```shell
        >>> RootChainGauge.chain_id():
        42161
        ```

### `factory`
!!! description "`RootChainGauge.factory() -> address: view`"

    Getter for the bridger address.

    Returns: bridger (`address`).

    !!!note
        `factory` is set to `0x000000000000000000000000000000000000dEaD` so they contract does not initialize itself. Actual `factory` address is set when actually inizializing the contract via the `initialize` function.

    ??? quote "Source code"

        ```python hl_lines="1 5 17 21"
        factory: public(address)

        @external
        def __init__(_crv_token: address, _gauge_controller: address, _minter: address):
            self.factory = 0x000000000000000000000000000000000000dEaD

            # assign immutable variables
            CRV = _crv_token
            GAUGE_CONTROLLER = _gauge_controller
            MINTER = _minter

        @external
        def initialize(_bridger: address, _chain_id: uint256):
            """
            @notice Proxy initialization method
            """
            assert self.factory == ZERO_ADDRESS  # dev: already initialized

            self.chain_id = _chain_id
            self.bridger = _bridger
            self.factory = msg.sender

            inflation_params: InflationParams = InflationParams({
                rate: CRV20(CRV).rate(),
                finish_time: CRV20(CRV).future_epoch_time_write()
            })
            assert inflation_params.rate != 0

            self.inflation_params = inflation_params
            self.last_period = block.timestamp / WEEK

            ERC20(CRV).approve(_bridger, MAX_UINT256)
        ```

    === "Example"

        ```shell
        >>> RootChainGauge.factory():
        '0xabC000d88f23Bb45525E447528DBF656A9D55bf5'
        ```

### `inflation_params`
!!! description "`RootChainGauge.inflation_params() -> tuple: view`"

    Getter for the inflation parameters rate and finish_time for the gauge. 

    Returns: `rate` and `finish_time` (`uint256`).

    ??? quote "Source code"

        ```python hl_lines="1 5"
        struct InflationParams:
            rate: uint256
            finish_time: uint256

        inflation_params: public(InflationParams)
        ```

    === "Example"

        ```shell
        >>> RootChainGauge.inflation_params():
        5181574864521283150, 1723501048
        ```

### `last_period` (todo)
!!! description "`RootChainGauge.last_period() -> uint256: view`"

    todo

    Returns: timestamp (`uint256`).

    ??? quote "Source code"

        ```python hl_lines="1 5"
        last_period: public(uint256)


        ```

    === "Example"

        ```shell
        >>> RootChainGauge.inflation_params():
        ```


### `total_emissions`
!!! description "`RootChainGauge.total_emissions() -> uint256: view`"

    Getter for the total emissions of the gauge.

    Returns: total emissions (`uint256`).

    ??? quote "Source code"

        ```python hl_lines="1 47"
        total_emissions: public(uint256)

        @external
        def user_checkpoint(_user: address) -> bool:
            """
            @notice Checkpoint the gauge updating total emissions
            @param _user Vestigal parameter with no impact on the function
            """
            # the last period we calculated emissions up to (but not including)
            last_period: uint256 = self.last_period
            # our current period (which we will calculate emissions up to)
            current_period: uint256 = block.timestamp / WEEK

            # only checkpoint if the current period is greater than the last period
            # last period is always less than or equal to current period and we only calculate
            # emissions up to current period (not including it)
            if last_period != current_period:
                # checkpoint the gauge filling in any missing weight data
                GaugeController(GAUGE_CONTROLLER).checkpoint_gauge(self)

                params: InflationParams = self.inflation_params
                emissions: uint256 = 0

                # only calculate emissions for at most 256 periods since the last checkpoint
                for i in range(last_period, last_period + 256):
                    if i == current_period:
                        # don't calculate emissions for the current period
                        break
                    period_time: uint256 = i * WEEK
                    weight: uint256 = GaugeController(GAUGE_CONTROLLER).gauge_relative_weight(self, period_time)

                    if period_time <= params.finish_time and params.finish_time < period_time + WEEK:
                        # calculate with old rate
                        emissions += weight * params.rate * (params.finish_time - period_time) / 10 ** 18
                        # update rate
                        params.rate = params.rate * RATE_DENOMINATOR / RATE_REDUCTION_COEFFICIENT
                        # calculate with new rate
                        emissions += weight * params.rate * (period_time + WEEK - params.finish_time) / 10 ** 18
                        # update finish time
                        params.finish_time += RATE_REDUCTION_TIME
                        # update storage
                        self.inflation_params = params
                    else:
                        emissions += weight * params.rate * WEEK / 10 ** 18

                self.last_period = current_period
                self.total_emissions += emissions

            return True
        ```

    === "Example"

        ```shell
        >>> RootChainGauge.total_emissions():
        1133904991390208914401020
        ```