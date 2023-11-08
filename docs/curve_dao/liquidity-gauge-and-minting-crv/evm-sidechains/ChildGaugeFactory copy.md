child gauge factory.

this contract has the same address as the root liquidity gauge factory!!!!


so flow is pretty much this: voting for the gauges in on L1 --> rootliquititygauge factory mints and transmits the emissions to --> childgaugefactory --> users can claim from this contract.


if child gauge `is_mirrored` is true, the root gauge of the gauge has the same address on eth mainnet as the child gauge on the sidechain!



vote-escrowed boost: https://arbiscan.io/address/0x98c80fa823759b642c3e02f40533c164f40727ae#code

examples of the shell are from the arbitrum childgaugefactory.



!!!deploy "Contract Source & Deployment"
    **`ChildGaugeFactory`** contract is deployed on the Arbitrum mainnet at: [0xabC000d88f23Bb45525E447528DBF656A9D55bf5](https://arbiscan.io/address/0xabc000d88f23bb45525e447528dbf656a9d55bf5#code).  



### `is_valid_gauge`
!!! description "`ChildGaugeFactory.is_valid_gauge(_gauge: address) -> bool:`"

    Getter method to check if `_gauge` is valid gauge.

    Returns: True or False (`bool`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_gauge` |  `address` | Gauge Address |

    ??? quote "Source code"

        ```python hl_lines="1 5 10"
        gauge_data: public(HashMap[address, uint256])

        @view
        @external
        def is_valid_gauge(_gauge: address) -> bool:
            """
            @notice Query whether the gauge is a valid one deployed via the factory
            @param _gauge The address of the gauge of interest
            """
            return self.gauge_data[_gauge] != 0
        ```

    === "Example"

        ```shell
        >>> ChildGaugeFactory.is_valid_gauge('0xCE5F24B7A95e9cBa7df4B54E911B4A3Dc8CDAf6f'):        
        'True'
        ```


### `is_mirrored`
!!! description "`ChildGaugeFactory.is_mirrored(_gauge: address) -> bool:`"

    Getter method to check if the gauge is mirrored on ethereum mainnet. If true, the RootGauge on ethereum mainnet has the same contract address as the ChildGauge on the sidechain/L2.

    Returns: True or False (`bool`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_gauge` |  `address` | Gauge Address |

    ??? quote "Source code"

        ```python hl_lines="1 5 10"
        gauge_data: public(HashMap[address, uint256])

        @view
        @external
        def is_mirrored(_gauge: address) -> bool:
            """
            @notice Query whether the gauge is mirrored on Ethereum mainnet
            @param _gauge The address of the gauge of interest
            """
            return bitwise_and(self.gauge_data[_gauge], 2) != 0
        ```

    === "Example"

        ```shell
        >>> ChildGaugeFactory.is_mirrored('0xCE5F24B7A95e9cBa7df4B54E911B4A3Dc8CDAf6f'):
        'True'
        ```



### `last_request`
!!! description "`ChildGaugeFactory.last_request(_gauge: address) -> bool:`"

    Getter for the last timestamp of the last cross chain request for emissions.

    Returns: timestamp (`uint256`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_gauge` |  `address` | Gauge Address |

    ??? quote "Source code"

        ```python hl_lines="1 5 10"
        gauge_data: public(HashMap[address, uint256])

        @view
        @external
        def last_request(_gauge: address) -> uint256:
            """
            @notice Query the timestamp of the last cross chain request for emissions
            @param _gauge The address of the gauge of interest
            """
            return shift(self.gauge_data[_gauge], -2)
        ```

    === "Example"

        ```shell
        >>> ChildGaugeFactory.last_request('0xCE5F24B7A95e9cBa7df4B54E911B4A3Dc8CDAf6f'):
        1694649601
        ```


### `get_implementation`
!!! description "`ChildGaugeFactory.is_mirrored(_gauge: address) -> bool:`"

    Getter for the ChildLiquidityGauge implementation.

    Returns: implementation (`address`).

    ??? quote "Source code"

        ```python hl_lines="1 5 10"
        get_implementation: public(address)
        ```

    === "Example"

        ```shell
        >>> ChildGaugeFactory.get_implementation('0xCE5F24B7A95e9cBa7df4B54E911B4A3Dc8CDAf6f'):
        'True'
        ```


### `voting_escrow` what is this needed for?
!!! description "`ChildGaugeFactory.voting_escrow() -> address: view`"

    Getter for the voting-escrow contract on arbitrum.

    Returns: voting escrow (`address`).

    ??? quote "Source code"

        ```python hl_lines="1"
        voting_escrow: public(address)
        ```

    === "Example"

        ```shell
        >>> ChildGaugeFactory.voting_escrow():
        '0x98c80fa823759b642c3e02f40533c164f40727ae'
        ```


### `call_proxy`
!!! description "`ChildGaugeFactory.call_proxy() -> address: view`"

    Getter for the anycall proxy contract.

    Returns: anycall proxy (`address`).

    ??? quote "Source code"

        ```python hl_lines="1"
        call_proxy: public(address)
        ```

    === "Example"

        ```shell
        >>> ChildGaugeFactory.call_proxy():
        '0x37414a8662bc1d25be3ee51fb27c2686e2490a89'
        ```


### `gauge_data` what does this number portrait
!!! description "`ChildGaugeFactory.gauge_data() -> address: view`"

    todo

    Returns: todo

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_gauge` |  `address` | Gauge Address |

    ??? quote "Source code"

        ```python hl_lines="1"
        gauge_data: public(HashMap[address, uint256])
        ```

    === "Example"

        ```shell''
        >>> ChildGaugeFactory.gauge_data('0xCE5F24B7A95e9cBa7df4B54E911B4A3Dc8CDAf6f'):
        6778598407
        ```


### `minted`
!!! description "`ChildGaugeFactory.minted(arg0: address, arg1: address) -> uint256: view`"

    Getter for the total minted CRV of address `arg0` from gauge `arg1`.

    Returns: total minted CRV (`uint256`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `arg0` |  `address` | User Address |
    | `arg1` |  `address` | Gauge Address |

    ??? quote "Source code"

        ```python hl_lines="2 42"
        # user -> gauge -> value
        minted: public(HashMap[address, HashMap[address, uint256]])

        @external
        @nonreentrant("lock")
        def mint(_gauge: address):
            """
            @notice Mint everything which belongs to `msg.sender` and send to them
            @param _gauge `LiquidityGauge` address to get mintable amount from
            """
            self._psuedo_mint(_gauge, msg.sender)

        @internal
        def _psuedo_mint(_gauge: address, _user: address):
            gauge_data: uint256 = self.gauge_data[_gauge]
            assert gauge_data != 0  # dev: invalid gauge

            # if is_mirrored and last_request != this week
            if bitwise_and(gauge_data, 2) != 0 and shift(gauge_data, -2) / WEEK != block.timestamp / WEEK:
                CallProxy(self.call_proxy).anyCall(
                    self,
                    _abi_encode(_gauge, method_id=method_id("transmit_emissions(address)")),
                    ZERO_ADDRESS,
                    1,
                )
                # update last request time
                self.gauge_data[_gauge] = shift(block.timestamp, 2) + 3

            assert ChildGauge(_gauge).user_checkpoint(_user)
            total_mint: uint256 = ChildGauge(_gauge).integrate_fraction(_user)
            to_mint: uint256 = total_mint - self.minted[_user][_gauge]

            if to_mint != 0:
                # transfer tokens to user
                response: Bytes[32] = raw_call(
                    CRV,
                    _abi_encode(_user, to_mint, method_id=method_id("transfer(address,uint256)")),
                    max_outsize=32,
                )
                if len(response) != 0:
                    assert convert(response, bool)
                self.minted[_user][_gauge] = total_mint

                log Minted(_user, _gauge, total_mint)
        ```

    === "Example"

        ```shell''
        >>> ChildGaugeFactory.minted('0xbac512b0be66194e1912d76bb929e19a84adfa07', '0xCE5F24B7A95e9cBa7df4B54E911B4A3Dc8CDAf6f'):
        1782570157728607
        ```


### `get_gauge_from_lp_token`
!!! description "`ChildGaugeFactory.minted(arg0: address) -> address: view`"

    Getter for the gauge of lp token `arg0`.

    Returns: gauge (`address`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `arg0` |  `address` | LP Token |

    ??? quote "Source code"

        ```python hl_lines="1 37"
        get_gauge_from_lp_token: public(HashMap[address, address])

        @external
        def deploy_gauge(_lp_token: address, _salt: bytes32, _manager: address = msg.sender) -> address:
            """
            @notice Deploy a liquidity gauge
            @param _lp_token The token to deposit in the gauge
            @param _manager The address to set as manager of the gauge
            @param _salt A value to deterministically deploy a gauge
            """
            if self.get_gauge_from_lp_token[_lp_token] != ZERO_ADDRESS:
                # overwriting lp_token -> gauge mapping requires
                assert msg.sender == self.owner  # dev: only owner

            gauge_data: uint256 = 1  # set is_valid_gauge = True
            implementation: address = self.get_implementation
            gauge: address = create_forwarder_to(
                implementation, salt=keccak256(_abi_encode(chain.id, msg.sender, _salt))
            )

            if msg.sender == self.call_proxy:
                gauge_data += 2  # set mirrored = True
                log UpdateMirrored(gauge, True)
                # issue a call to the root chain to deploy a root gauge
                CallProxy(self.call_proxy).anyCall(
                    self,
                    _abi_encode(chain.id, _salt, method_id=method_id("deploy_gauge(uint256,bytes32)")),
                    ZERO_ADDRESS,
                    1
                )

            self.gauge_data[gauge] = gauge_data

            idx: uint256 = self.get_gauge_count
            self.get_gauge[idx] = gauge
            self.get_gauge_count = idx + 1
            self.get_gauge_from_lp_token[_lp_token] = gauge

            ChildGauge(gauge).initialize(_lp_token, _manager)

            log DeployedGauge(implementation, _lp_token, msg.sender, _salt, gauge)
            return gauge
        ```

    === "Example"

        ```shell''
        >>> ChildGaugeFactory.get_gauge_from_lp_token('0x7f90122bf0700f9e7e1f688fe926940e8839f353'):
        '0xCE5F24B7A95e9cBa7df4B54E911B4A3Dc8CDAf6f'
        ```


### `get_gauge_count`
!!! description "`ChildGaugeFactory.get_gauge_count() -> uint256: view`"

    Getter for the gauge of lp token `arg0`.

    Returns: total amount of gauges (`address`).

    ??? quote "Source code"

        ```python hl_lines="1 34 36"
        get_gauge_count: public(uint256)

        @external
        def deploy_gauge(_lp_token: address, _salt: bytes32, _manager: address = msg.sender) -> address:
            """
            @notice Deploy a liquidity gauge
            @param _lp_token The token to deposit in the gauge
            @param _manager The address to set as manager of the gauge
            @param _salt A value to deterministically deploy a gauge
            """
            if self.get_gauge_from_lp_token[_lp_token] != ZERO_ADDRESS:
                # overwriting lp_token -> gauge mapping requires
                assert msg.sender == self.owner  # dev: only owner

            gauge_data: uint256 = 1  # set is_valid_gauge = True
            implementation: address = self.get_implementation
            gauge: address = create_forwarder_to(
                implementation, salt=keccak256(_abi_encode(chain.id, msg.sender, _salt))
            )

            if msg.sender == self.call_proxy:
                gauge_data += 2  # set mirrored = True
                log UpdateMirrored(gauge, True)
                # issue a call to the root chain to deploy a root gauge
                CallProxy(self.call_proxy).anyCall(
                    self,
                    _abi_encode(chain.id, _salt, method_id=method_id("deploy_gauge(uint256,bytes32)")),
                    ZERO_ADDRESS,
                    1
                )

            self.gauge_data[gauge] = gauge_data

            idx: uint256 = self.get_gauge_count
            self.get_gauge[idx] = gauge
            self.get_gauge_count = idx + 1
            self.get_gauge_from_lp_token[_lp_token] = gauge

            ChildGauge(gauge).initialize(_lp_token, _manager)

            log DeployedGauge(implementation, _lp_token, msg.sender, _salt, gauge)
            return gauge
        ```

    === "Example"

        ```shell''
        >>> ChildGaugeFactory.get_gauge_count():
        19
        ```


### `get_gauge`
!!! description "`ChildGaugeFactory.get_gauge(arg0: address) -> address: view`"

    Getter for the gauge at index `arg0`.

    Returns: gauge (`address`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `arg0` |  `address` | User Address |

    ??? quote "Source code"

        ```python hl_lines="1"
        get_gauge: public(address[MAX_INT128])
        ```

    === "Example"

        ```shell''
        >>> ChildGaugeFactory.get_gauge(1):
        '0xCE5F24B7A95e9cBa7df4B54E911B4A3Dc8CDAf6f'
        ```



### `mint`
!!! description "`ChildGaugeFactory.mint(_gauge: address):`"

    Function to mint CRV emission rewards for `msg.sender` and transfer it to them.

    Emits: `Minted`

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_gauge` |  `address` | Gauge Address to mint from |

    ??? quote "Source code"

        ```python hl_lines="1 8 13 16 46"
        event Minted:
            _user: indexed(address)
            _gauge: indexed(address)
            _new_total: uint256

        @external
        @nonreentrant("lock")
        def mint(_gauge: address):
            """
            @notice Mint everything which belongs to `msg.sender` and send to them
            @param _gauge `LiquidityGauge` address to get mintable amount from
            """
            self._psuedo_mint(_gauge, msg.sender)

        @internal
        def _psuedo_mint(_gauge: address, _user: address):
            gauge_data: uint256 = self.gauge_data[_gauge]
            assert gauge_data != 0  # dev: invalid gauge

            # if is_mirrored and last_request != this week
            if bitwise_and(gauge_data, 2) != 0 and shift(gauge_data, -2) / WEEK != block.timestamp / WEEK:
                CallProxy(self.call_proxy).anyCall(
                    self,
                    _abi_encode(_gauge, method_id=method_id("transmit_emissions(address)")),
                    ZERO_ADDRESS,
                    1,
                )
                # update last request time
                self.gauge_data[_gauge] = shift(block.timestamp, 2) + 3

            assert ChildGauge(_gauge).user_checkpoint(_user)
            total_mint: uint256 = ChildGauge(_gauge).integrate_fraction(_user)
            to_mint: uint256 = total_mint - self.minted[_user][_gauge]

            if to_mint != 0:
                # transfer tokens to user
                response: Bytes[32] = raw_call(
                    CRV,
                    _abi_encode(_user, to_mint, method_id=method_id("transfer(address,uint256)")),
                    max_outsize=32,
                )
                if len(response) != 0:
                    assert convert(response, bool)
                self.minted[_user][_gauge] = total_mint

                log Minted(_user, _gauge, total_mint)
        ```

    === "Example"

        ```shell''
        >>> ChildGaugeFactory.mint('todo'):

        ```


### `mint_many`
!!! description "`ChildGaugeFactory.mint(_gauge: address[32]):`"

    Function to mint CRV emission rewards for `msg.sender` and transfer it to them.

    Emits: `Minted`

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_gauge` |  `address[32]` | Gauge Addresses to mint from |

    ??? quote "Source code"

        ```python hl_lines="1 8 16 19 49"
        event Minted:
            _user: indexed(address)
            _gauge: indexed(address)
            _new_total: uint256

        @external
        @nonreentrant("lock")
        def mint_many(_gauges: address[32]):
            """
            @notice Mint everything which belongs to `msg.sender` across multiple gauges
            @param _gauges List of `LiquidityGauge` addresses
            """
            for i in range(32):
                if _gauges[i] == ZERO_ADDRESS:
                    pass
                self._psuedo_mint(_gauges[i], msg.sender)

        @internal
        def _psuedo_mint(_gauge: address, _user: address):
            gauge_data: uint256 = self.gauge_data[_gauge]
            assert gauge_data != 0  # dev: invalid gauge

            # if is_mirrored and last_request != this week
            if bitwise_and(gauge_data, 2) != 0 and shift(gauge_data, -2) / WEEK != block.timestamp / WEEK:
                CallProxy(self.call_proxy).anyCall(
                    self,
                    _abi_encode(_gauge, method_id=method_id("transmit_emissions(address)")),
                    ZERO_ADDRESS,
                    1,
                )
                # update last request time
                self.gauge_data[_gauge] = shift(block.timestamp, 2) + 3

            assert ChildGauge(_gauge).user_checkpoint(_user)
            total_mint: uint256 = ChildGauge(_gauge).integrate_fraction(_user)
            to_mint: uint256 = total_mint - self.minted[_user][_gauge]

            if to_mint != 0:
                # transfer tokens to user
                response: Bytes[32] = raw_call(
                    CRV,
                    _abi_encode(_user, to_mint, method_id=method_id("transfer(address,uint256)")),
                    max_outsize=32,
                )
                if len(response) != 0:
                    assert convert(response, bool)
                self.minted[_user][_gauge] = total_mint

                log Minted(_user, _gauge, total_mint)
        ```

    === "Example"

        ```shell''
        >>> ChildGaugeFactory.mint_many('todo'):
        ```


### `deploy_gauge`
!!! description "`ChildGaugeFactory.deploy_gauge(_lp_token: address, _salt: bytes32, _manager: address = msg.sender) -> address:`"

    Function to deploy a ChildLiquidityGauge and initialize it.

    Returns: gauge (`address`).

    Emits: `DeployedGauge`

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_lp_token` |  `address` | LP Token Address |
    | `_salt` |  `bytes32` | todo |
    | `_manager` |  `address` | Manager Address; Defaults to `msg.sender` |

    ??? quote "Source code"

        ```python hl_lines="1 13"
        event DeployedGauge:
            _implementation: indexed(address)
            _lp_token: indexed(address)
            _deployer: indexed(address)
            _salt: bytes32
            _gauge: address

        event UpdateMirrored:
            _gauge: indexed(address)
            _mirrored: bool

        @external
        def deploy_gauge(_lp_token: address, _salt: bytes32, _manager: address = msg.sender) -> address:
            """
            @notice Deploy a liquidity gauge
            @param _lp_token The token to deposit in the gauge
            @param _manager The address to set as manager of the gauge
            @param _salt A value to deterministically deploy a gauge
            """
            if self.get_gauge_from_lp_token[_lp_token] != ZERO_ADDRESS:
                # overwriting lp_token -> gauge mapping requires
                assert msg.sender == self.owner  # dev: only owner

            gauge_data: uint256 = 1  # set is_valid_gauge = True
            implementation: address = self.get_implementation
            gauge: address = create_forwarder_to(
                implementation, salt=keccak256(_abi_encode(chain.id, msg.sender, _salt))
            )

            if msg.sender == self.call_proxy:
                gauge_data += 2  # set mirrored = True
                log UpdateMirrored(gauge, True)
                # issue a call to the root chain to deploy a root gauge
                CallProxy(self.call_proxy).anyCall(
                    self,
                    _abi_encode(chain.id, _salt, method_id=method_id("deploy_gauge(uint256,bytes32)")),
                    ZERO_ADDRESS,
                    1
                )

            self.gauge_data[gauge] = gauge_data

            idx: uint256 = self.get_gauge_count
            self.get_gauge[idx] = gauge
            self.get_gauge_count = idx + 1
            self.get_gauge_from_lp_token[_lp_token] = gauge

            ChildGauge(gauge).initialize(_lp_token, _manager)

            log DeployedGauge(implementation, _lp_token, msg.sender, _salt, gauge)
            return gauge
        ```

    === "Example"

        ```shell''
        >>> ChildGaugeFactory.mint_many('todo'):
        ```


### `set_voting_escrow`
### `set_implementation`
### `set_mirrored`
### `set_call_proxy`






## Admin Ownership
### `owner`
!!! description "`ChildGaugeFactory.owner() -> address: view`"

    Getter for the owner of the ChildGaugeFactory contract.

    Returns: owner (`address`).

    ??? quote "Source code"

        ```python hl_lines="1"
        owner: public(address)
        ```

    === "Example"

        ```shell
        >>> ChildGaugeFactory.owner():
        '0xd754492dc12fdea93c49e88c0437ace2e7cd1c14'
        ```


### `future_owner`
!!! description "`ChildGaugeFactory.future_owner() -> address: view`"

    Getter for the owner of the ChildGaugeFactory contract.

    Returns: owner (`address`).

    ??? quote "Source code"

        ```python hl_lines="1"
        future_owner: public(address)
        ```

    === "Example"

        ```shell
        >>> ChildGaugeFactory.future_owner():
        '0xd754492dc12fdea93c49e88c0437ace2e7cd1c14'
        ```

### `commit_transfer_ownership`
### `accept_transfer_ownership`