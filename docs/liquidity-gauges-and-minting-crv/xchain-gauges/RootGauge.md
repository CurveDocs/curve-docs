<h1>Root Gauge Implementation</h1>

The `RootGauge` is a simplified liquidity gauge contract on Ethereum used for bridging CRV from Ethereum to a sidechain. This gauge can be, just like any other liquidity gauge, be added to the `GaugeController` and is then eligible to receive voting weight. If that is the case, it can [mint any new emissions and transmit](#checkpointing-emissions) them to the child gauge on another chain using a [bridger contract](#bridger).


???+ vyper "`RootGauge.vy`"
    The source code for the `RootGauge.vy` contract can be found on [:material-github: GitHub](https://github.com/curvefi/curve-xchain-factory/blob/master/contracts/implementations/RootGauge.vy). The contract is written using [Vyper](https://github.com/vyperlang/vyper) version `0.3.10`.

    The contract is deployed on :logos-ethereum: Ethereum at [`0x96720942F9fF22eFd8611F696E5333Fe3671717a`](https://etherscan.io/address/0x96720942F9fF22eFd8611F696E5333Fe3671717a).


Root gauges are deployed from the `RootGaugeFactory` and makes use of Vyper's built-in [create_minimal_proxy_to](https://docs.vyperlang.org/en/stable/built-in-functions.html#create_minimal_proxy_to) function to create a EIP1167-compliant "minimal proxy contract" that duplicates the logic of the contract at target.

---

# **Initialization**

Because the root gauges are deployed using a proxy pattern, they are automatically initialized directly after deployment.

### `initialize`
!!! description "`RootGauge.initialize(_bridger: Bridger, _chain_id: uint256, _child: address)`"

    Function to initialize the root gauge. Initializes the child gauge address, chain ID, bridger contract, and factory, as well as sets the `inflation_params` and `last_period`. The function also sets the CRV token approval of the bridger contract to `max_value(uint256)`.

    | Parameter | Type | Description |
    | --------- | ---- | ----------- |
    | `_bridger` | `Bridger` | The bridger contract |
    | `_chain_id` | `uint256` | The chain ID |
    | `_child` | `address` | The child gauge address |

    ??? quote "Source code"

        === "RootGauge.vy"

            ```python
            @external
            def initialize(_bridger: Bridger, _chain_id: uint256, _child: address):
                """
                @notice Proxy initialization method
                """
                assert self.factory == empty(Factory)  # dev: already initialized

                self.child_gauge = _child
                self.chain_id = _chain_id
                self.bridger = _bridger
                self.factory = Factory(msg.sender)

                inflation_params: InflationParams = InflationParams({
                    rate: CRV.rate(),
                    finish_time: CRV.future_epoch_time_write()
                })
                assert inflation_params.rate != 0

                self.inflation_params = inflation_params
                self.last_period = block.timestamp / WEEK

                CRV.approve(_bridger.address, max_value(uint256))

            ```

    === "Example"

        This example initializes a root gauge with a bridger contract on Arbitrum.

        ```py
        >>> RootGauge.initialize('0xceda55279fe22d256c4e6a6F2174C1588e94B2BB', 42161, '0x1234567890123456789012345678901234567896')
        ```

---

# **Checkpointing & CRV Emissions**

### `user_checkpoint`
!!! description "`RootGauge.user_checkpoint(_user: address) -> bool`"

    Function to checkpoint a gauge and update the total emissions.

    | Parameter | Type | Description |
    | --------- | ---- | ----------- |
    | `_user` | `address` | The user address. This parameter is vestigial and has no impact on the function |

    ??? quote "Source code"

        === "RootGauge.vy"

            ```python
            interface GaugeController:
                def checkpoint_gauge(addr: address): nonpayable
                def gauge_relative_weight(addr: address, time: uint256) -> uint256: view

            last_period: public(uint256)
            total_emissions: public(uint256)

            @external
            def user_checkpoint(_user: address) -> bool:
                """
                @notice Checkpoint the gauge updating total emissions
                @param _user Vestigial parameter with no impact on the function
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
                    GAUGE_CONTROLLER.checkpoint_gauge(self)

                    params: InflationParams = self.inflation_params
                    emissions: uint256 = 0

                    # only calculate emissions for at most 256 periods since the last checkpoint
                    for i in range(last_period, last_period + 256):
                        if i == current_period:
                            # don't calculate emissions for the current period
                            break
                        period_time: uint256 = i * WEEK
                        weight: uint256 = GAUGE_CONTROLLER.gauge_relative_weight(self, period_time)

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

        ```py
        >>> RootGauge.user_checkpoint('0x1234567890123456789012345678901234567896')
        ```

### `transmit_emissions`
!!! description "`RootGauge.transmit_emissions()`"

    !!!guard "Guarded Method"
        This function is only callable by the `RootGaugeFactory`.

    Function to mint any new emissions and transmit them to the child gauge on another chain. Calling this function directly on the root gauge will not revert. The function to bridge emissions can only be called via the `RootGaugeFactory` using its `transmit_emissions(gauge)` function. The contract uses the `bridger` contract to bridge the emissions.

    ??? quote "Source code"

        This source code example makes use of the Arbitrum Bridger Wrapper. The function to bridge to other chains can vary depending on the bridger contract used.

        === "RootGauge.vy"

            ```python
            interface Bridger:
                def cost() -> uint256: view
                def bridge(_token: CRV20, _destination: address, _amount: uint256): payable

            CRV: immutable(CRV20)
            GAUGE_CONTROLLER: immutable(GaugeController)
            MINTER: immutable(Minter)

            @external
            def transmit_emissions():
                """
                @notice Mint any new emissions and transmit across to child gauge
                """
                assert msg.sender == self.factory.address  # dev: call via factory

                MINTER.mint(self)
                minted: uint256 = CRV.balanceOf(self)

                assert minted != 0  # dev: nothing minted
                bridger: Bridger = self.bridger

                bridger.bridge(CRV, self.child_gauge, minted, value=bridger.cost())
            ```

        === "Bridger.vy"

            ```python
            @payable
            @external
            def bridge(_token: address, _to: address, _amount: uint256):
                """
                @notice Bridge an ERC20 token using the Arbitrum standard bridge
                @param _token The address of the token to bridge
                @param _to The address to deposit token to on L2
                @param _amount The amount of `_token` to deposit
                """
                assert ERC20(_token).transferFrom(msg.sender, self, _amount)

                if _token != CRV20 and not self.is_approved[_token]:
                    assert ERC20(_token).approve(GatewayRouter(GATEWAY_ROUTER).getGateway(_token), MAX_UINT256)
                    self.is_approved[_token] = True

                data: uint256 = self.submission_data
                gas_limit: uint256 = shift(data, -128)
                gas_price: uint256 = shift(data, -64) % 2 ** 64
                max_submission_cost: uint256 = data % 2 ** 64

                # NOTE: Excess ETH fee is refunded to this bridger's address on L2.
                # After bridging, the token should arrive on Arbitrum within 10 minutes. If it
                # does not, the L2 transaction may have failed due to an insufficient amount
                # within `max_submission_cost + (gas_limit * gas_price)`
                # In this case, the transaction can be manually broadcasted on Arbitrum by calling
                # `ArbRetryableTicket(0x000000000000000000000000000000000000006e).redeem(redemption-TxID)`
                # The calldata for this manual transaction is easily obtained by finding the reverted
                # transaction in the tx history for 0x000000000000000000000000000000000000006e on Arbiscan.
                # https://developer.offchainlabs.com/docs/l1_l2_messages#retryable-transaction-lifecycle
                GatewayRouter(GATEWAY_ROUTER).outboundTransfer(
                    _token,
                    _to,
                    _amount,
                    gas_limit,
                    gas_price,
                    _abi_encode(max_submission_cost, b""),
                    value=gas_limit * gas_price + max_submission_cost
                )
            ```

    === "Example"

        ```py
        >>> RootGauge.transmit_emissions()
        ```

### `integrate_fraction`
!!! description "`RootGauge.integrate_fraction(_user: address) -> uint256`"

    Function to query the total emissions a user is entitled to. Any value of `_user` other than the gauge address will return 0  (only the gauge itself if entitled to emissions as it is the one who mints and bridges them).

    Returns: The total emissions the user is entitled to (`uint256`).

    | Parameter | Type      | Description |
    | --------- | --------- | ------------ |
    | `_user`   | `address` | Address of the user |

    ??? quote "Source code"

        === "RootGauge.vy"

            ```python
            total_emissions: public(uint256)

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

        ```py
        >>> RootGauge.integrate_fraction('0x1234567890123456789012345678901234567896')
        0
        ```

### `inflation_params`
!!! description "`RootGauge.inflation_params() -> InflationParams: view`"

    Getter for the inflation parameters.

    Returns: `InflationParams` struct containing the CRV emission [`rate`](../../curve_dao/crv-token.md#rate) and [`future_epoch_time_write()`](../../curve_dao/crv-token.md#future_epoch_time_write).

    ??? quote "Source code"

        === "RootGauge.vy"

            ```python
            struct InflationParams:
                rate: uint256
                finish_time: uint256

            inflation_params: public(InflationParams)
            ```

    === "Example"

        ```py
        >>> RootGauge.inflation_params()
        {'rate': 1000000000000000000, 'finish_time': 1735689600}
        ```

### `last_period`
!!! description "`RootGauge.last_period() -> uint256: view`"

    Getter for the last period.

    Returns: last period (`uint256`).

    ??? quote "Source code"

        === "RootGauge.vy"

            ```python
            last_period: public(uint256)
            ```

    === "Example"

        ```py
        >>> RootGauge.last_period()
        1735689600
        ```

### `total_emissions`
!!! description "`RootGauge.total_emissions() -> uint256: view`"

    Getter for the total emissions of the gauge. This value increases each time the gauge is checkpointed.

    Returns: total emissions (`uint256`).

    ??? quote "Source code"

        === "RootGauge.vy"

            ```python
            total_emissions: public(uint256)
            ```

    === "Example"

        ```py
        >>> RootGauge.total_emissions()
        0
        ```

---

# **Bridger Contracts**

The contract makes use of wrapper contracts around different bridging architectures to bridge CRV emissions to child gauges on other chains. These contracts are granted max approval when initialized in order for being able to transmit CRV tokens. The bridger contract used depends on the chain the child gauge is on. The `RootGaugeFactory` holds different bridger implementations for each chain.

If a bridger contract needs to be updated for whatever reason, this can only be done within the `RootGaugeFactory` using the `set_child` function. After the bridger has been updated, the `update_bridger()` function needs to be called on the specific gauge to update the bridger contract used by the gauge. This sets the CRV token approval of the "old" bridger to 0 and the new bridger to `max_value(uint256)`.

???quote "`RootGaugeFactory.set_child(_chain_id: uint256, _bridger: Bridger, _child_factory: address, _child_impl: address)`"

    Source code for the `set_child` function, which is used to set the bridger for a specific chain ID.

    ```python
    event ChildUpdated:
        _chain_id: indexed(uint256)
        _new_bridger: Bridger
        _new_factory: address
        _new_implementation: address

    get_bridger: public(HashMap[uint256, Bridger])
    get_child_factory: public(HashMap[uint256, address])
    get_child_implementation: public(HashMap[uint256, address])

    @external
    def set_child(_chain_id: uint256, _bridger: Bridger, _child_factory: address, _child_impl: address):
        """
        @notice Set the bridger for `_chain_id`
        @param _chain_id The chain identifier to set the bridger for
        @param _bridger The bridger contract to use
        @param _child_factory Address of factory on L2 (needed in price derivation)
        @param _child_impl Address of gauge implementation on L2 (needed in price derivation)
        """
        assert msg.sender == self.owner  # dev: only owner

        log ChildUpdated(_chain_id, _bridger, _child_factory, _child_impl)
        self.get_bridger[_chain_id] = _bridger
        self.get_child_factory[_chain_id] = _child_factory
        self.get_child_implementation[_chain_id] = _child_impl
    ```

### `bridger`
!!! description "`RootGauge.bridger() -> Bridger: view`"

    Getter for the bridger contract used by the gauge to bridge CRV emissions to the child gauge on another chain. The bridger contract is set during initialization and can only be updated within the `RootGaugeFactory`.

    Returns: bridger contract (`address`).

    ??? quote "Source code"

        === "RootGauge.vy"

            ```python
            interface Bridger:
                def cost() -> uint256: view
                def bridge(_token: CRV20, _destination: address, _amount: uint256): payable

            bridger: public(Bridger)
            ```

    === "Example"

        This example returns the bridger contract for transmitting CRV emissions from Ethereum to Arbitrum.

        ```py
        >>> RootGauge.bridger(42161)
        '0xceda55279fe22d256c4e6a6F2174C1588e94B2BB'
        ```

### `update_bridger`
!!! description "`RootGauge.update_bridger()`"

    Function to update the bridger used by this contract. This function call will only have effect if the bridger implementation of the chain is updated. Bridger contracts should prevent bridging if ever updated, therefore the approval of the old bridger is set to 0 and the new bridger is set to `max_value(uint256)`. Function call is permissionless, anyone can call it.

    ??? quote "Source code"

        === "RootGauge.vy"

            ```python
            interface CRV20:
                def approve(_account: address, _value: uint256): nonpayable

            bridger: public(Bridger)

            @external
            def update_bridger():
                """
                @notice Update the bridger used by this contract
                @dev Bridger contracts should prevent bridging if ever updated
                """
                # reset approval
                bridger: Bridger = self.factory.get_bridger(self.chain_id)
                CRV.approve(self.bridger.address, 0)
                CRV.approve(bridger.address, max_value(uint256))
                self.bridger = bridger
            ```

        === "RootGaugeFactory.vy"

            ```python
            event ChildUpdated:
                _chain_id: indexed(uint256)
                _new_bridger: Bridger
                _new_factory: address
                _new_implementation: address

            get_bridger: public(HashMap[uint256, Bridger])
            get_child_factory: public(HashMap[uint256, address])
            get_child_implementation: public(HashMap[uint256, address])

            @external
            def set_child(_chain_id: uint256, _bridger: Bridger, _child_factory: address, _child_impl: address):
                """
                @notice Set the bridger for `_chain_id`
                @param _chain_id The chain identifier to set the bridger for
                @param _bridger The bridger contract to use
                @param _child_factory Address of factory on L2 (needed in price derivation)
                @param _child_impl Address of gauge implementation on L2 (needed in price derivation)
                """
                assert msg.sender == self.owner  # dev: only owner

                log ChildUpdated(_chain_id, _bridger, _child_factory, _child_impl)
                self.get_bridger[_chain_id] = _bridger
                self.get_child_factory[_chain_id] = _child_factory
                self.get_child_implementation[_chain_id] = _child_impl
            ```

    === "Example"

        This function updates the `bridger` contract. Updating this variable is only possible when the bridger contract implementation within the `RootGaugeFactory` is updated.

        ```py
        >>> RootGauge.bridger()
        '0xceda55279fe22d256c4e6a6F2174C1588e94B2BB'

        >>> RootGaugeFactory.set_child(42161, '0x1234567890123456789012345678901234567896', '0x1234567890123456789012345678901234567896', '0x1234567890123456789012345678901234567896')

        >>> RootGauge.update_bridger()

        >>> RootGauge.bridger()
        '0x1234567890123456789012345678901234567896'
        ```

---

# **Child Gauge**

If a according child gauge is deployed with the same salt as the root gauge, the `child_gauge` variable will hold the address of the child gauge. Additionally, there is a function to set the child gauge in case something went wrong (e.g. between implementation updates or zkSync).

### `child_gauge`
!!! description "`RootGauge.child_gauge() -> address: view`"

    Getter for the corresponding child gauge on another chain.

    Returns: child gauge contract (`address`).

    ??? quote "Source code"

        === "RootGauge.vy"

            ```python
            child_gauge: public(address)
            ```

    === "Example"

        ```py
        >>> RootGauge.child_gauge()
        '0xcde3Cdf332E35653A7595bA555c9fDBA3c78Ec04'
        ```

### `set_child_gauge`
!!! description "`RootGauge.set_child_gauge(_child: address)`"

    !!!guard "Guarded Method"
        This function is only callable by the `owner` of the `RootGaugeFactory`.

    Function to set the child gauge in case something went wrong (e.g. between implementation updates or zkSync).

    | Parameter | Type | Description |
    | --------- | ---- | ------------ |
    | `_child` | `address` | The child gauge address |

    ??? quote "Source code"

        === "RootGauge.vy"

            ```python
            interface Factory:
                def owner() -> address: view

            child_gauge: public(address)

            @external
            def set_child_gauge(_child: address):
                """
                @notice Set Child contract in case something went wrong (e.g. between implementation updates or zkSync)
                @param _child Child gauge to set
                """
                assert msg.sender == self.factory.owner()
                assert _child != empty(address)

                self.child_gauge = _child
            ```

    === "Example"

        ```py
        >>> RootGauge.child_gauge()
        '0xcde3Cdf332E35653A7595bA555c9fDBA3c78Ec04'

        >>> RootGauge.set_child_gauge('0x1234567890123456789012345678901234567890')

        >>> RootGauge.child_gauge()
        '0x1234567890123456789012345678901234567890'
        ```

### `chain_id`
!!! description "`RootGauge.chain_id() -> uint256: view`"

    Getter for the chain ID of the child gauge.

    Returns: chain ID (`uint256`).

    ??? quote "Source code"

        === "RootGauge.vy"

            ```python
            chain_id: public(uint256)
            ```

    === "Example"

        This example returns the chain ID on which the corresponding child gauge is deployed.

        ```py
        >>> RootGauge.chain_id()
        42161
        ```

---

# **Killing Root Gauges**

Root gauges can be killed by the `owner` of the `RootGaugeFactory` to disable emissions of the specific gauge. Killed gauges will have their inflation rate be set to 0 and therefor restrict any minting of CRV emissions.

### `is_killed`
!!! description "`RootGauge.is_killed() -> bool: view`"

    Getter for the kill status of the gauge.

    Returns: kill status (`bool`).

    ??? quote "Source code"

        === "RootGauge.vy"

            ```python
            is_killed: public(bool)
            ```

    === "Example"

        ```py
        >>> RootGauge.is_killed()
        False
        ```

### `set_killed`
!!! description "`RootGauge.set_killed(_is_killed: bool)`"

    !!!guard "Guarded Method"
        This function is only callable by the `owner` of the `RootGaugeFactory`.

    Function to set the kill status of the gauge. If a gauge is killed, inflation params are modified accordingly to disable emissions. A gauge can be "unkilled" by setting the kill status to `False`, which restores the inflation params to their actual values.

    | Parameter | Type | Description |
    | --------- | ---- | ------------ |
    | `_is_killed` | `bool` | The kill status |

    ??? quote "Source code"

        === "RootGauge.vy"

            ```python
            interface Factory:
                def owner() -> address: view

            interface CRV20:
                def rate() -> uint256: view
                def future_epoch_time_write() -> uint256: nonpayable

            struct InflationParams:
                rate: uint256
                finish_time: uint256

            last_period: public(uint256)

            is_killed: public(bool)

            @external
            def set_killed(_is_killed: bool):
                """
                @notice Set the gauge kill status
                @dev Inflation params are modified accordingly to disable/enable emissions
                """
                assert msg.sender == self.factory.owner()

                if _is_killed:
                    self.inflation_params.rate = 0
                else:
                    self.inflation_params = InflationParams({
                        rate: CRV.rate(),
                        finish_time: CRV.future_epoch_time_write()
                    })
                    self.last_period = block.timestamp / WEEK
                self.is_killed = _is_killed
            ```

    === "Example"

        ```py
        >>> RootGauge.set_killed(True)

        >>> RootGauge.is_killed()
        True

        >>> RootGauge.inflation_params()
        {'rate': 0, 'finish_time': 0}
        ```

---

# **Other Methods**

### `factory`
!!! description "`RootGauge.factory() -> Factory: view`"

    Getter for the `RootGaugeFactory` contract.

    Returns: root gauge factory (`address`).

    ??? quote "Source code"

        === "RootGauge.vy"

            ```python
            factory: public(Factory)
            ```

    === "Example"

        ```py
        >>> RootGauge.factory()
        '0x306A45a1478A000dC701A6e1f7a569afb8D9DCD6'
        ```
