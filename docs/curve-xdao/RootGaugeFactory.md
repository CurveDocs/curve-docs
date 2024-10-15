<h1>RootGaugeFactory</h1>

<script src="/assets/javascripts/contracts/rootgaugefactory.js"></script>
<script src="https://cdn.jsdelivr.net/npm/web3@1.5.2/dist/web3.min.js"></script>

???+ vyper "`RootGaugeFactory.vy`"
    The source code for the `RootGaugeFactory.vy` contract can be found on [:material-github: GitHub](https://github.com/curvefi/curve-xchain-factory/blob/master/contracts/RootGaugeFactory.vy). The contract is written using [Vyper](https://github.com/vyperlang/vyper) version `0.3.10` 

    The contract is deployed on :logos-ethereum: Ethereum at [`0x306A45a1478A000dC701A6e1f7a569afb8D9DCD6`](https://etherscan.io/address/0x306A45a1478A000dC701A6e1f7a569afb8D9DCD6).


---


## **Deploying Gauges**

### `deploy_gauge`
!!! description "`RootGaugeFactory.deploy_gauge(_chain_id: uint256, _salt: bytes32) -> RootGauge`"

    Function to deploy a new root gauge.

    Returns: newly deployed gauge (`RootGauge`).

    | Input       | Type      | Description |
    | ----------- | --------- | ----------- |
    | `_chain_id` | `uint256` | Chain ID of the child gauge |
    | `_salt`     | `bytes32` | Salt for the child gauge |

    ??? quote "Source code"

        === "RootGaugeFactory.vy"

            ```python
            event DeployedGauge:
                _implementation: indexed(address)
                _chain_id: indexed(uint256)
                _deployer: indexed(address)
                _salt: bytes32
                _gauge: RootGauge

            interface RootGauge:
                def bridger() -> Bridger: view
                def initialize(_bridger: Bridger, _chain_id: uint256, _child: address): nonpayable
                def transmit_emissions(): nonpayable

            call_proxy: public(CallProxy)
            get_bridger: public(HashMap[uint256, Bridger])
            get_child_factory: public(HashMap[uint256, address])
            get_child_implementation: public(HashMap[uint256, address])
            get_implementation: public(address)

            get_gauge: public(HashMap[uint256, RootGauge[max_value(uint256)]])
            get_gauge_count: public(HashMap[uint256, uint256])
            is_valid_gauge: public(HashMap[RootGauge, bool])

            @payable
            @external
            def deploy_gauge(_chain_id: uint256, _salt: bytes32) -> RootGauge:
                """
                @notice Deploy a root liquidity gauge
                @param _chain_id The chain identifier of the counterpart child gauge
                @param _salt A value to deterministically deploy a gauge
                """
                bridger: Bridger = self.get_bridger[_chain_id]
                assert bridger != empty(Bridger)  # dev: chain id not supported

                implementation: address = self.get_implementation
                salt: bytes32 = keccak256(_abi_encode(_chain_id, _salt))
                gauge: RootGauge = RootGauge(create_minimal_proxy_to(
                    implementation,
                    value=msg.value,
                    salt=salt,
                ))
                child: address = self._get_child(_chain_id, salt)

                idx: uint256 = self.get_gauge_count[_chain_id]
                self.get_gauge[_chain_id][idx] = gauge
                self.get_gauge_count[_chain_id] = idx + 1
                self.is_valid_gauge[gauge] = True

                gauge.initialize(bridger, _chain_id, child)

                log DeployedGauge(implementation, _chain_id, msg.sender, _salt, gauge)
                return gauge

            @internal
            def _get_child(_chain_id: uint256, salt: bytes32) -> address:
                """
                @dev zkSync address derivation is ignored, so need to set child address through a vote manually
                """
                child_factory: address = self.get_child_factory[_chain_id]
                child_impl: bytes20 = convert(self.get_child_implementation[_chain_id], bytes20)

                assert child_factory != empty(address)  # dev: child factory not set
                assert child_impl != empty(bytes20)  # dev: child implementation not set

                gauge_codehash: bytes32 = keccak256(
                    concat(0x602d3d8160093d39f3363d3d373d3d3d363d73, child_impl, 0x5af43d82803e903d91602b57fd5bf3))
                digest: bytes32 = keccak256(concat(0xFF, convert(child_factory, bytes20), salt, gauge_codehash))
                return convert(convert(digest, uint256) & convert(max_value(uint160), uint256), address)
            ```

    === "Example"

        ```shell
        >>> RootGaugeFactory.deploy_gauge(1, bytes32(0))
        'gauge address'
        ```


### `deploy_child_gauge`
!!! description "`RootGaugeFactory.deploy_child_gauge(_chain_id: uint256, _lp_token: address, _salt: bytes32, _manager: address = msg.sender)`"

    Function to deploy a new child gauge.

    Returns: newly deployed child gauge (`RootGauge`).

    | Input      | Type      | Description |
    | ----------- | --------- | ----------- |
    | `_chain_id` | `uint256` | Chain ID of the child gauge |
    | `_lp_token` | `address` | Address of the LP token |
    | `_salt`     | `bytes32` | Salt for the child gauge |
    | `_manager`  | `address` | Address of the manager |

    ??? quote "Source code"

        === "RootGaugeFactory.vy"

            ```python
            call_proxy: public(CallProxy)
            get_bridger: public(HashMap[uint256, Bridger])

            @external
            def deploy_child_gauge(_chain_id: uint256, _lp_token: address, _salt: bytes32, _manager: address = msg.sender):
                bridger: Bridger = self.get_bridger[_chain_id]
                assert bridger != empty(Bridger)  # dev: chain id not supported

                self.call_proxy.anyCall(
                    self,
                    _abi_encode(
                        _lp_token,
                        _salt,
                        _manager,
                        method_id=method_id("deploy_gauge(address,bytes32,address)")
                    ),
                    empty(address),
                    _chain_id
                )
            ```

    === "Example"

        ```shell
        >>> RootGaugeFactory.deploy_child_gauge(1, lp_token_address, bytes32(0), msg.sender)
        'child gauge address'
        ```


---


## **Gauge Information**

### `is_valid_gauge`
!!! description "`RootGaugeFactory.is_valid_gauge(_gauge: RootGauge) -> bool`"

    Getter to check if a gauge is valid.

    Returns: `True` if the gauge is valid, `False` otherwise (`bool`).

    | Input    | Type      | Description |
    | -------- | --------- | ----------- |
    | `_gauge` | `address` | Root gauge to check validity for |

    ??? quote "Source code"

        === "RootGaugeFactory.vy"

            ```python
            is_valid_gauge: public(HashMap[RootGauge, bool])
            ```

    === "Example"

        :material-information-outline:{ title='This interactive example fetches the output directly on-chain.' } This example returns the validity of a gauge.

        <div class="highlight">
        <pre><code>>>> RootGaugeFactory.is_valid_gauge(
        <input id="isValidGaugeInput"
        type="text" 
        value="0x1234567890123456789012345678901234567890"
        style="width: 300px; 
            background: transparent; 
            border: none; 
            border-bottom: 1px solid #ccc; 
            color: inherit; 
            font-family: inherit; 
            font-size: inherit;" 
            oninput="fetchIsValidGauge()"/>)
        <span id="isValidGaugeOutput"></span></code></pre>
        </div>


### `get_gauge`
!!! description "`RootGaugeFactory.get_gauge(_chain_id: uint256, _idx: uint256) -> RootGauge`"

    Getter to get a gauge by chain ID and index.

    Returns: gauge (`address`).

    | Input      | Type      | Description |
    | ----------- | --------- | ----------- |
    | `_chain_id` | `uint256` | Chain ID of the child gauge |
    | `_idx`      | `uint256` | Index of the gauge |

    ??? quote "Source code"

        === "RootGaugeFactory.vy"

            ```python
            get_gauge: public(HashMap[uint256, RootGauge[max_value(uint256)]])
            ```

    === "Example"

        :material-information-outline:{ title='This interactive example fetches the output directly on-chain.' } This example returns the gauge for a given chain ID and index.

        <div class="highlight">
        <pre><code>>>> RootGaugeFactory.get_gauge(
        Chain ID: <input id="getGaugeChainIdInput" 
        type="number" 
        value="42161"
        style="width: 100px; 
            background: transparent; 
            border: none; 
            border-bottom: 1px solid #ccc; 
            color: inherit; 
            font-family: inherit; 
            font-size: inherit;" 
            oninput="this.value = this.value.replace(/[^0-9]/g, '')"/>
        Index: <input id="getGaugeIndexInput" 
        type="number"
        value="0"
        style="width: 50px; 
            background: transparent; 
            border: none; 
            border-bottom: 1px solid #ccc; 
            color: inherit; 
            font-family: inherit; 
            font-size: inherit;" 
            oninput="this.value = this.value.replace(/[^0-9]/g, '')"/>)
        <span id="getGaugeOutput"></span></code></pre>
        </div>


### `get_gauge_count`
!!! description "`RootGaugeFactory.get_gauge_count(_chain_id: uint256) -> uint256`"

    Getter to get the number of gauges for a given chain ID. This value is incremented by one for each new gauge deployed.

    Returns: number of gauges (`uint256`).

    | Input      | Type      | Description |
    | ----------- | --------- | ----------- |
    | `_chain_id` | `uint256` | Chain ID of the child gauge |

    ??? quote "Source code"

        === "RootGaugeFactory.vy"

            ```python
            get_gauge_count: public(HashMap[uint256, uint256])
            ```

    === "Example"

        :material-information-outline:{ title='This interactive example fetches the output directly on-chain.' } This example returns the number of gauges for a given chain ID.

        <div class="highlight">
        <pre><code>>>> RootGaugeFactory.get_gauge_count(<input id="getGaugeCountInput" type="number" value="42161" min="0" 
        style="width: 50px; 
            background: transparent; 
            border: none; 
            border-bottom: 1px solid #ccc; 
            color: inherit; 
            font-family: inherit; 
            font-size: inherit; 
            -moz-appearance: textfield;" 
            oninput="fetchGaugeCount()"/>)
        <span id="getGaugeCountOutput"></span></code></pre>
        </div>

        <style>
        input[type=number]::-webkit-inner-spin-button, 
        input[type=number]::-webkit-outer-spin-button {
            -webkit-appearance: none;
            margin: 0;
        }
        </style>


### `get_bridger`
!!! description "`RootGaugeFactory.get_bridger(_chain_id: uint256) -> Bridger: view`"

    Getter to get the bridger for a given chain ID.

    Returns: bridger (`Bridger`).

    ??? quote "Source code"

        === "RootGaugeFactory.vy"

            ```python
            get_bridger: public(HashMap[uint256, Bridger])
            ```

    === "Example"

        :material-information-outline:{ title='This interactive example fetches the output directly on-chain.' } This example returns the bridger for a given chain ID.

        <div class="highlight">
        <pre><code>>>> RootGaugeFactory.get_bridger(<input id="getBridgerInput" type="number" value="42161" min="0" 
        style="width: 50px; 
            background: transparent; 
            border: none; 
            border-bottom: 1px solid #ccc; 
            color: inherit; 
            font-family: inherit; 
            font-size: inherit; 
            -moz-appearance: textfield;" 
            oninput="fetchBridger()"/>)
        <span id="getBridgerOutput"></span></code></pre>
        </div>

        <style>
        input[type=number]::-webkit-inner-spin-button, 
        input[type=number]::-webkit-outer-spin-button {
            -webkit-appearance: none;
            margin: 0;
        }
        </style>


### `transmit_emissions`
!!! description "`RootGaugeFactory.transmit_emissions() -> uint256`"

    Function to transmit emissions to the child gauge.

    Returns: number of receivers (`uint256`).

    ??? quote "Source code"

        === "RootGaugeFactory.vy"

            ```python
            interface Bridger:
                def check(_addr: address) -> bool: view

            interface RootGauge:
                def transmit_emissions(): nonpayable

            @external
            def transmit_emissions(_gauge: RootGauge):
                """
                @notice Call `transmit_emissions` on a root gauge
                @dev Entrypoint to request emissions for a child gauge.
                    The way that gauges work, this can also be called on the root
                    chain without a request.
                """
                # in most cases this will return True
                # for special bridges *cough cough Multichain, we can only do
                # one bridge per tx, therefore this will verify msg.sender in [tx.origin, self.call_proxy]
                assert _gauge.bridger().check(msg.sender)
                _gauge.transmit_emissions()
            ```

    === "Example"

        ```shell
        >>> RootGaugeFactory.transmit_emissions()
        ```


---


## **Child Implementations and Factories**

### `set_child`
!!! description "`RootGaugeFactory.set_child(_chain_id: uint256, _bridger: Bridger, _child_factory: address, _child_impl: address)`"

    Setter to set the bridger for a given chain ID.

    Emits: `ChildUpdated` event.

    | Input      | Type      | Description |
    | ----------- | --------- | ----------- |
    | `_chain_id` | `uint256` | Chain ID of the child gauge |
    | `_bridger`  | `Bridger` | Bridger for the child gauge |
    | `_child_factory` | `address` | Address of the child gauge factory |
    | `_child_impl` | `address` | Address of the child gauge implementation |

    ??? quote "Source code"

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

            owner: public(address)

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

        :material-information-outline:{ title='This interactive example fetches the output directly on-chain.' } In this example, the total number of receivers is returned.

        <div class="highlight">
        <pre><code>>>> FeeSplitter.n_receivers()
        <span id="nReceiversOutput"></span></code></pre>
        </div>


### `get_child_factory`
!!! description "`RootGaugeFactory.get_child_factory(_chain_id: uint256) -> address: view`"

    Getter to get the child factory for a given chain ID.

    Returns: child factory address (`address`).

    ??? quote "Source code"

        === "RootGaugeFactory.vy"

            ```python
            get_child_factory: public(HashMap[uint256, address])
            ```

    === "Example"

        :material-information-outline:{ title='This interactive example fetches the output directly on-chain.' } This example returns the child factory address for a given chain ID.

        <div class="highlight">
        <pre><code>>>> RootGaugeFactory.get_child_factory(<input id="getChildFactoryInput" type="number" value="42161" min="0" 
        style="width: 50px; 
            background: transparent; 
            border: none; 
            border-bottom: 1px solid #ccc; 
            color: inherit; 
            font-family: inherit; 
            font-size: inherit; 
            -moz-appearance: textfield;" 
            oninput="fetchChildFactory()"/>)
        <span id="getChildFactoryOutput"></span></code></pre>
        </div>

        <style>
        input[type=number]::-webkit-inner-spin-button, 
        input[type=number]::-webkit-outer-spin-button {
            -webkit-appearance: none;
            margin: 0;
        }
        </style>


### `get_child_implementation`
!!! description "`RootGaugeFactory.get_child_implementation(_chain_id: uint256) -> address: view`"

    Getter to get the child implementation for a given chain ID.

    Returns: child implementation address (`address`).

    | Input      | Type      | Description |
    | ----------- | --------- | ----------- |
    | `_chain_id` | `uint256` | Chain ID of the child gauge |

    ??? quote "Source code"

        === "RootGaugeFactory.vy"

            ```python
            get_child_implementation: public(HashMap[uint256, address])
            ```

    === "Example"

        :material-information-outline:{ title='This interactive example fetches the output directly on-chain.' } This example returns the child implementation address for a given chain ID.

        <div class="highlight">
        <pre><code>>>> RootGaugeFactory.get_child_implementation(<input id="getChildImplementationInput" type="number" value="42161" min="0" 
        style="width: 50px; 
            background: transparent; 
            border: none; 
            border-bottom: 1px solid #ccc; 
            color: inherit; 
            font-family: inherit; 
            font-size: inherit; 
            -moz-appearance: textfield;" 
            oninput="fetchChildImplementation()"/>)
        <span id="getChildImplementationOutput"></span></code></pre>
        </div>

        <style>
        input[type=number]::-webkit-inner-spin-button, 
        input[type=number]::-webkit-outer-spin-button {
            -webkit-appearance: none;
            margin: 0;
        }
        </style>


### `get_implementation`
!!! description "`RootGaugeFactory.get_implementation() -> address: view`"

    Getter to get the implementation contract of the root chain gauge factory.

    Returns: implementation address (`address`).

    ??? quote "Source code"

        === "RootGaugeFactory.vy"

            ```python
            get_implementation: public(address)
            ```

    === "Example"

        :material-information-outline:{ title='This interactive example fetches the output directly on-chain.' } This example returns the current root gauge factory implementation address.

        <div class="highlight">
        <pre><code>>>> RootGaugeFactory.get_implementation()
        <span id="implementationOutput"></span></code></pre>
        </div>


### `set_implementation`
!!! description "`RootGaugeFactory.set_implementation(_implementation: address)`"

    !!!warning
        Changing the implementation contract requires a change on all child factories.

    Function to set the implementation contract of the root chain gauge factory.

    Emits: `UpdateImplementation` event.

    | Input      | Type      | Description |
    | ----------- | --------- | ----------- |
    | `_implementation` | `address` | Address of the implementation contract |

    ??? quote "Source code"

        === "RootGaugeFactory.vy"

            ```python
            event UpdateImplementation:
                _old_implementation: address
                _new_implementation: address

            get_implementation: public(address)

            owner: public(address)

            @external
            def set_implementation(_implementation: address):
                """
                @notice Set the implementation
                @dev Changing implementation require change on all child factories
                @param _implementation The address of the implementation to use
                """
                assert msg.sender == self.owner  # dev: only owner

                log UpdateImplementation(self.get_implementation, _implementation)
                self.get_implementation = _implementation
            ```

    === "Example"

        :material-information-outline:{ title='This interactive example fetches the output directly on-chain.' } In this example, the total number of receivers is returned.

        <div class="highlight">
        <pre><code>>>> FeeSplitter.n_receivers()
        <span id="nReceiversOutput"></span></code></pre>
        </div>

---


## **Call Proxy**

### `call_proxy`
!!! description "`RootGaugeFactory.call_proxy() -> CallProxy: view`"

    Getter to get the call proxy which is initially set at initialization. This variable can be changed via the `set_call_proxy` function.

    Returns: call proxy (`CallProxy`).

    ??? quote "Source code"

        === "RootGaugeFactory.vy"

            ```python
            call_proxy: public(CallProxy)

            @external
            def __init__(_call_proxy: CallProxy, _owner: address):
                self.call_proxy = _call_proxy
                log UpdateCallProxy(empty(CallProxy), _call_proxy)

                self.owner = _owner
                log TransferOwnership(empty(address), _owner)
            ```

    === "Example"

        :material-information-outline:{ title='This interactive example fetches the output directly on-chain.' } This example returns the current call proxy address.

        <div class="highlight">
        <pre><code>>>> RootGaugeFactory.call_proxy()
        <span id="callProxyOutput"></span></code></pre>
        </div>


### `set_call_proxy`
!!! description "`RootGaugeFactory.set_call_proxy(_call_proxy: CallProxy)`"

    Function to set the call proxy.

    Emits: `UpdateCallProxy` event.

    | Input      | Type      | Description |
    | ----------- | --------- | ----------- |
    | `_call_proxy` | `CallProxy` | Call proxy to set |

    ??? quote "Source code"

        === "RootGaugeFactory.vy"

            ```python
            event UpdateCallProxy:
                _old_call_proxy: CallProxy
                _new_call_proxy: CallProxy

            call_proxy: public(CallProxy)

            @external
            def set_call_proxy(_call_proxy: CallProxy):
                """
                @notice Set CallProxy
                @param _call_proxy Contract to use for inter-chain communication
                """
                assert msg.sender == self.owner

                self.call_proxy = _call_proxy
                log UpdateCallProxy(empty(CallProxy), _call_proxy)
            ```

    === "Example"

        :material-information-outline:{ title='This interactive example fetches the output directly on-chain.' } In this example, the total number of receivers is returned.

        <div class="highlight">
        <pre><code>>>> FeeSplitter.n_receivers()
        <span id="nReceiversOutput"></span></code></pre>
        </div>


---


## **Contract Ownership**

### `owner`
### `future_owner`
### `commit_transfer_ownership`
### `accept_transfer_ownership`


---


## **Other Methods**


### `version`
!!! description "`RootGaugeFactory.version() -> String[8]`"

    Getter for the version of the gauge.

    Returns: version (`String[8]`).

    ??? quote "Source code"

        === "RootGaugeFactory.vy"

            ```python
            version: public(constant(String[8])) = "1.0.2"
            ```

    === "Example"

        :material-information-outline:{ title='This interactive example fetches the output directly on-chain.' } This example returns the current version of the gauge.

        <div class="highlight">
        <pre><code>>>> RootGaugeFactory.version()
        <span id="versionOutput"></span></code></pre>
        </div>