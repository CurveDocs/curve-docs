The RootChainLiquiditiyGaugeFactory is used to deploy RootChainLiquidityGauges and ChildLiquidityGauges on sidechains/L2.
For further implemention details pelase refer to [this](../evm-sidechains/overview.md#implementation-details).

!!! info
    **`RootChainGaugeFactory`** contract is deployed on the Ethereum mainnet at: [0xabC000d88f23Bb45525E447528DBF656A9D55bf5](https://etherscan.io/address/0xabC000d88f23Bb45525E447528DBF656A9D55bf5#code).  


## Transmitting Emissions
### `transmit_emissions`
!!! description "`RootChainFactory.transmit_emissions(_gauge: address):`"

    Function to call `transmit_emissions` an RootGauge `_gauge`. Mints and transmits emissions to sidechains/L2.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_gauge` |  `address` | RootChainGauge Address |

    !!!note
        `transmit_emissions` can also be called on the RootGauge itself.

    ??? quote "Source code"

        ```python hl_lines="2"
        @external
        def transmit_emissions(_gauge: address):
            """
            @notice Call `transmit_emissions` on a root gauge
            @dev Entrypoint for anycall to request emissions for a child gauge.
                The way that gauges work, this can also be called on the root
                chain without a request.
            """
            # in most cases this will return True
            # for special bridges *cough cough Multichain, we can only do
            # one bridge per tx, therefore this will verify msg.sender in [tx.origin, self.call_proxy]
            assert Bridger(RootGauge(_gauge).bridger()).check(msg.sender)
            RootGauge(_gauge).transmit_emissions()
        ```

    === "Example"

        ```shell
        >>> RootChainFactory.transmit_emissions():        
        ```


## Implementations and Gauges

The RootChainGaugeFactory uses implementations to create ChildGauges through this implementation.


### `get_implementation`
!!! description "`RootChainFactory.get_implementation() -> address: view`"

    Getter for the RootChainLiquidityGauge implementation.

    Returns: implementation (`address`).

    ??? quote "Source code"

        ```python hl_lines="1 12"
        get_implementation: public(address)

        @external
        def set_implementation(_implementation: address):
            """
            @notice Set the implementation
            @param _implementation The address of the implementation to use
            """
            assert msg.sender == self.owner  # dev: only owner

            log UpdateImplementation(self.get_implementation, _implementation)
            self.get_implementation = _implementation
        ```

    === "Example"

        ```shell
        >>> RootChainFactory.get_implementation():
        '0x9336DA074c4f585a8B59A8C2B77a32b630cde5A1'        
        ```


### `set_implementation`
!!! description "`RootChainFactory.set_implementation(_implementation: address):`"

    Function to set the RootGauge implementation.

    Emits: `UpdateImplementation`

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_implementation` |  `address` | RootGauge Implementation |

    ??? quote "Source code"

        ```python hl_lines="1 5 8 15 16"
        event UpdateImplementation:
            _old_implementation: address
            _new_implementation: address

        get_implementation: public(address)    

        @external
        def set_implementation(_implementation: address):
            """
            @notice Set the implementation
            @param _implementation The address of the implementation to use
            """
            assert msg.sender == self.owner  # dev: only owner

            log UpdateImplementation(self.get_implementation, _implementation)
            self.get_implementation = _implementation
        ```

    === "Example"

        ```shell
        >>> RootChainFactory.set_implementation(todo):    
        ```


### `get_gauge`
!!! description "`RootChainFactory.get_gauge(arg0: uint256, arg1: uint256) -> address: view`"

    Getter for the liquidity gauge address at index `arg1` on chain `arg0` (ID).

    Returns: gauge (`address`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `arg0` |  `uint256` | Chain ID |
    | `arg0` |  `uint256` | Gauge Index |

    ??? quote "Source code"

        ```python hl_lines="1"
        get_gauge: public(HashMap[uint256, address[MAX_UINT256]])
        ```

    === "Example"

        ```shell
        >>> RootChainFactory.get_gauge(42161, 1):
        '0xCE5F24B7A95e9cBa7df4B54E911B4A3Dc8CDAf6f'
        ```


### `get_gauge_count`
!!! description "`RootChainFactory.get_gauge(arg0: uint256, arg1: uint256) -> address: view`"

    Getter for the number of gauges deployed on a specific chain.

    Returns: gauge (`address`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `arg0` |  `uint256` | Chain ID |
    | `arg1` |  `uint256` | Gauge Index |

    ??? quote "Source code"

        ```python hl_lines="1 21 23"
        get_gauge_count: public(HashMap[uint256, uint256])

        @payable
        @external
        def deploy_gauge(_chain_id: uint256, _salt: bytes32) -> address:
            """
            @notice Deploy a root liquidity gauge
            @param _chain_id The chain identifier of the counterpart child gauge
            @param _salt A value to deterministically deploy a gauge
            """
            bridger: address = self.get_bridger[_chain_id]
            assert bridger != ZERO_ADDRESS  # dev: chain id not supported

            implementation: address = self.get_implementation
            gauge: address = create_forwarder_to(
                implementation,
                value=msg.value,
                salt=keccak256(_abi_encode(_chain_id, msg.sender, _salt))
            )

            idx: uint256 = self.get_gauge_count[_chain_id]
            self.get_gauge[_chain_id][idx] = gauge
            self.get_gauge_count[_chain_id] = idx + 1
            self.is_valid_gauge[gauge] = True

            RootGauge(gauge).initialize(bridger, _chain_id)

            log DeployedGauge(implementation, _chain_id, msg.sender, _salt, gauge)
            return gauge
        ```

    === "Example"

        ```shell
        >>> RootChainFactory.get_gauge_count(42161):
        19
        ```


### `is_valid_gauge`
!!! description "`RootChainFactory.get_gauge(arg0: address) -> bool: view`"

    Getter method to check if gauge `arg0` is valid.

    Returns: gauge (`address`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `arg0` |  `uint256` | Chain ID |
    | `arg0` |  `uint256` | Gauge Index |

    ??? quote "Source code"

        ```python hl_lines="1 24 28"
        is_valid_gauge: public(HashMap[address, bool])

        @payable
        @external
        def deploy_gauge(_chain_id: uint256, _salt: bytes32) -> address:
            """
            @notice Deploy a root liquidity gauge
            @param _chain_id The chain identifier of the counterpart child gauge
            @param _salt A value to deterministically deploy a gauge
            """
            bridger: address = self.get_bridger[_chain_id]
            assert bridger != ZERO_ADDRESS  # dev: chain id not supported

            implementation: address = self.get_implementation
            gauge: address = create_forwarder_to(
                implementation,
                value=msg.value,
                salt=keccak256(_abi_encode(_chain_id, msg.sender, _salt))
            )

            idx: uint256 = self.get_gauge_count[_chain_id]
            self.get_gauge[_chain_id][idx] = gauge
            self.get_gauge_count[_chain_id] = idx + 1
            self.is_valid_gauge[gauge] = True

            RootGauge(gauge).initialize(bridger, _chain_id)

            log DeployedGauge(implementation, _chain_id, msg.sender, _salt, gauge)
            return gauge
        ```

    === "Example"

        ```shell
        >>> RootChainFactory.is_valid_gauge("0xCE5F24B7A95e9cBa7df4B54E911B4A3Dc8CDAf6f"):
        'True'
        ```


### `deploy_gauge` (todo: salt)
!!! description "`RootChainFactory.deploy_gauge(_chain_id: uint256, _salt: bytes32) -> address:`"

    Function to deploy a RootLiquidityGauge.

    Returns: gauge (`address`).

    Emits: `DeployedGauge`

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_chain_id` |  `uint256` | Chain ID |
    | `_salt` |  `bytes32` | todo |

    ??? quote "Source code"

        ```python hl_lines="1 10 23 24"
        event DeployedGauge:
            _implementation: indexed(address)
            _chain_id: indexed(uint256)
            _deployer: indexed(address)
            _salt: bytes32
            _gauge: address

        @payable
        @external
        def deploy_gauge(_chain_id: uint256, _salt: bytes32) -> address:
            """
            @notice Deploy a root liquidity gauge
            @param _chain_id The chain identifier of the counterpart child gauge
            @param _salt A value to deterministically deploy a gauge
            """
            bridger: address = self.get_bridger[_chain_id]
            assert bridger != ZERO_ADDRESS  # dev: chain id not supported

            implementation: address = self.get_implementation
            gauge: address = create_forwarder_to(
                implementation,
                value=msg.value,
                salt=keccak256(_abi_encode(_chain_id, msg.sender, _salt))
            )

            idx: uint256 = self.get_gauge_count[_chain_id]
            self.get_gauge[_chain_id][idx] = gauge
            self.get_gauge_count[_chain_id] = idx + 1
            self.is_valid_gauge[gauge] = True

            RootGauge(gauge).initialize(bridger, _chain_id)

            log DeployedGauge(implementation, _chain_id, msg.sender, _salt, gauge)
            return gauge
        ```

    === "Example"

        ```shell
        >>> RootChainFactory.deploy_gauge(todo):
        ```


### `deploy_child_gauge`
!!! description "`RootChainFactory.deploy_gauge(_chain_id: uint256, _salt: bytes32) -> address:`"

    Function to deploy a ChildGauge.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_chain_id` |  `uint256` | Chain ID |
    | `_salt` |  `bytes32` | todo |
    | `_manager` |  `bytes32` | Gauge Manager |

    ??? quote "Source code"

        ```python hl_lines="2"
        @external
        def deploy_child_gauge(_chain_id: uint256, _lp_token: address, _salt: bytes32, _manager: address = msg.sender):
            bridger: address = self.get_bridger[_chain_id]
            assert bridger != ZERO_ADDRESS  # dev: chain id not supported

            CallProxy(self.call_proxy).anyCall(
                self,
                _abi_encode(
                    _lp_token,
                    _salt,
                    _manager,
                    method_id=method_id("deploy_gauge(address,bytes32,address)")
                ),
                ZERO_ADDRESS,
                _chain_id
            )
        ```

    === "Example"

        ```shell
        >>> RootChainFactory.deploy_child_gauge(todo):
        ```





## Call Proxy and Bridgers

Different bridgers for different chains!


### `call_proxy`
!!! description "`RootChainFactory.integrate_fraction(_user: address) -> uint256:`"

    Getter for the anycall proxy.

    Returns: anycall proxy (`address`).

    ??? quote "Source code"

        ```python hl_lines="1 4 6"
        call_proxy: public(address)

        @external
        def __init__(_call_proxy: address, _owner: address):
            self.call_proxy = _call_proxy
            log UpdateCallProxy(ZERO_ADDRESS, _call_proxy)

            self.owner = _owner
            log TransferOwnership(ZERO_ADDRESS, _owner)
        ```

    === "Example"

        ```shell
        >>> RootChainFactory.call_proxy():
        '0x37414a8662bC1D25be3ee51Fb27C2686e2490A89'        
        ```


### `get_bridger`
!!! description "`RootChainFactory.get_bridger(arg0: uint256) -> address: view`"

    Getter for the bridger contract for chain id `arg0`.

    Returns: bridger contract (`address`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `arg0` |  `uint256` | Chain ID |

    ??? quote "Source code"

        ```python hl_lines="1"
        get_bridger: public(HashMap[uint256, address])
        ```

    === "Example"

        ```shell
        >>> RootChainFactory.get_bridger(42161):
        '0xceda55279fe22d256c4e6a6F2174C1588e94B2BB'        
        ```


### `set_call_proxy`
!!! description "`RootChainFactory.set_call_proxy(_new_call_proxy: address):`"

    Function to set a new call proxy contract.

    Emits: `UpdateCallProxy`

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_new_call_proxy` |  `address` | New CallProxy Contract |

    ??? quote "Source code"

        ```python hl_lines="1 6 14 15"
        event UpdateCallProxy:
            _old_call_proxy: address
            _new_call_proxy: address

        @external
        def set_call_proxy(_new_call_proxy: address):
            """
            @notice Set the address of the call proxy used
            @dev _new_call_proxy should adhere to the same interface as defined
            @param _new_call_proxy Address of the cross chain call proxy
            """
            assert msg.sender == self.owner

            log UpdateCallProxy(self.call_proxy, _new_call_proxy)
            self.call_proxy = _new_call_proxy
        ```

    === "Example"

        ```shell
        >>> RootChainFactory.set_call_proxy('todo'):        
        ```


### `set_bridger`
!!! description "`RootChainFactory.set_bridger(_chain_id: uint256, _bridger: address):`"

    Function to set new bridger contract `_bridger` for `_chain_id`.

    Emits: `BridgerUpdated`

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_chain_id` |  `uint256` | Chain ID |
    | `_bridger` |  `address` | New Bridger Contract |

    !!!note
        This function is only callable by the `owner` of the RootChainGaugeFactory.

    ??? quote "Source code"

        ```python hl_lines="1 7 15 16"
        event BridgerUpdated:
            _chain_id: indexed(uint256)
            _old_bridger: address
            _new_bridger: address

        @external
        def set_bridger(_chain_id: uint256, _bridger: address):
            """
            @notice Set the bridger for `_chain_id`
            @param _chain_id The chain identifier to set the bridger for
            @param _bridger The bridger contract to use
            """
            assert msg.sender == self.owner  # dev: only owner

            log BridgerUpdated(_chain_id, self.get_bridger[_chain_id], _bridger)
            self.get_bridger[_chain_id] = _bridger
        ```

    === "Example"

        ```shell
        >>> RootChainFactory.set_bridger('todo'):        
        ```



## Admin Ownership

### `owner`
!!! description "`RootChainFactory.owner() -> address: view`"

    Getter for the owner of the RootChainFactory.

    Returns: owner (`address`).

    ??? quote "Source code"

        ```python hl_lines="1"
        owner: public(address)
        ```

    === "Example"

        ```shell
        >>> RootChainFactory.owner():
        '0x017dB2B92233018973902858B31269Ed071E1D39'
        ```


### `future_owner`
!!! description "`RootChainFactory.future_owner() -> address: view`"

    Getter for the future owner of the RootChainFactory.

    Returns: future owner (`address`).

    ??? quote "Source code"

        ```python hl_lines="1"
        future_owner: public(address)
        ```

    === "Example"

        ```shell
        >>> RootChainFactory.future_owner():
        '0x017dB2B92233018973902858B31269Ed071E1D39'
        ```


### `commit_transfer_ownership`
!!! description "`RootChainFactory.commit_transfer_ownership(_future_owner: address):`"

    Function to commit the transfer of contract ownership to `_future_owner`.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_future_owner` |  `address` | Future Owner |

    !!!note
        This function is only callable by the `owner` of the RootChainGaugeFactory.

    ??? quote "Source code"

        ```python hl_lines="1 2 5 10 12"
        owner: public(address)
        future_owner: public(address)

        @external
        def commit_transfer_ownership(_future_owner: address):
            """
            @notice Transfer ownership to `_future_owner`
            @param _future_owner The account to commit as the future owner
            """
            assert msg.sender == self.owner  # dev: only owner

            self.future_owner = _future_owner
        ```

    === "Example"

        ```shell
        >>> RootChainFactory.commit_transfer_ownership('todo'):        
        ```


### `accept_transfer_ownership`
!!! description "`RootChainFactory.accept_transfer_ownership():`"

    Function to accept the transfer of ownership.

    Emits: `TransferOwnership`

    !!!note
        This function is only callable by the `future_owner` of the RootChainGaugeFactory.

    ??? quote "Source code"

        ```python hl_lines="1 2 5 10 12 13"
        owner: public(address)
        future_owner: public(address)

        @external
        def accept_transfer_ownership():
            """
            @notice Accept the transfer of ownership
            @dev Only the committed future owner can call this function
            """
            assert msg.sender == self.future_owner  # dev: only future owner

            log TransferOwnership(self.owner, msg.sender)
            self.owner = msg.sender
        ```

    === "Example"

        ```shell
        >>> RootChainFactory.accept_transfer_ownership():        
        ```

