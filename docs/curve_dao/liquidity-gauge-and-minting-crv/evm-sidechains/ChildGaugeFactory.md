The `ChildGaugeFactory` is used to claim CRV emissions from. The `RootChainGaugeFactory` on Ethereum and `ChildGaugeFactory` on the according chain share the same contract address.

!!!deploy "Contract Source & Deployment"
    All contract deployments can be found [here](../../../references/deployed-contracts.md#evm-sidechain-gauges).  
    Source code available on [Github](https://github.com/curvefi/curve-dao-contracts/tree/master/contracts/gauges/sidechain). 


## **Contract Info Methods**

### `is_valid_gauge`
!!! description "`ChildGaugeFactory.is_valid_gauge(_gauge: address) -> bool:`"

    Getter method to check if `_gauge` is a valid gauge. A gauge is valid if 

    Returns: true or flase (`bool`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_gauge` |  `address` | gauge address |

    ??? quote "Source code"

        ```python
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
        'true'
        ```


### `is_mirrored`
!!! description "`ChildGaugeFactory.is_mirrored(_gauge: address) -> bool:`"

    Getter method to check if the gauge is mirrored on Ethereum. If true, a RootGauge with the same contract address as the ChildGauge exists on Ethereum. 

    Returns: true or false (`bool`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_gauge` |  `address` | gauge address |

    ??? quote "Source code"

        ```python
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
        'true'
        ```


### `set_mirrored`
!!! description "`ChildGaugeFactory.set_mirrored(_gauge: address, _mirrored: bool):`"

    !!!guard "Guarded Method"
        This function is only callable by the `admin` of the contract. 

    Function to set the mirrored bit of the gauge data for `_gauge`

    Emits: `UpdateMirrored`

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_gauge` |  `address` | gauge address |
    | `_mirrored` |  `bool` | bool determin whether to set the mirrored but to True/False |

    ??? quote "Source code"

        ```python
        event UpdateMirrored:
            _gauge: indexed(address)
            _mirrored: bool

        # [last_request][has_counterpart][is_valid_gauge]
        gauge_data: public(HashMap[address, uint256])

        @external
        def set_mirrored(_gauge: address, _mirrored: bool):
            """
            @notice Set the mirrored bit of the gauge data for `_gauge`
            @param _gauge The gauge of interest
            @param _mirrored Boolean deteremining whether to set the mirrored bit to True/False
            """
            gauge_data: uint256 = self.gauge_data[_gauge]
            assert gauge_data != 0  # dev: invalid gauge
            assert msg.sender == self.owner  # dev: only owner

            gauge_data = shift(shift(gauge_data, -2), 2) + 1  # set is_valid_gauge = True
            if _mirrored:
                gauge_data += 2  # set is_mirrored = True

            self.gauge_data[_gauge] = gauge_data
            log UpdateMirrored(_gauge, _mirrored)
        ```

    === "Example"

        ```shell
        >>> ChildGaugeFactory.set_mirrored('todo'):
        ```


### `last_request`
!!! description "`ChildGaugeFactory.last_request(_gauge: address) -> bool:`"

    Getter for the last timestamp of the last cross chain request for emissions.

    Returns: timestamp (`uint256`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_gauge` |  `address` | gauge address |

    ??? quote "Source code"

        ```python
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


### `gauge_data`
!!! description "`ChildGaugeFactory.gauge_data() -> address: view`"

    todo

    Returns: todo

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_gauge` |  `address` | gauge address |

    ??? quote "Source code"

        ```python
        gauge_data: public(HashMap[address, uint256])
        ```

    === "Example"

        ```shell
        >>> ChildGaugeFactory.gauge_data('0xCE5F24B7A95e9cBa7df4B54E911B4A3Dc8CDAf6f'):
        6778598407
        ```


### `get_gauge_from_lp_token`
!!! description "`ChildGaugeFactory.minted(arg0: address) -> address: view`"

    Getter for the gauge of LP token `arg0`.

    Returns: gauge (`address`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `arg0` |  `address` | lp token |

    ??? quote "Source code"

        ```python
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

        ```shell
        >>> ChildGaugeFactory.get_gauge_from_lp_token('0x7f90122bf0700f9e7e1f688fe926940e8839f353'):
        '0xCE5F24B7A95e9cBa7df4B54E911B4A3Dc8CDAf6f'
        ```


### `get_gauge_count`
!!! description "`ChildGaugeFactory.get_gauge_count() -> uint256: view`"

    Getter for the number of gauges deployed. Increments by one when deploying a new gauge.

    Returns: total number of gauges deployed (`uint256`).

    ??? quote "Source code"

        ```python
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

        ```shell
        >>> ChildGaugeFactory.get_gauge_count():
        19
        ```


### `get_gauge`
!!! description "`ChildGaugeFactory.get_gauge(arg0: address) -> address: view`"

    Getter for the gauge at index `arg0`.

    Returns: gauge (`address`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `arg0` |  `address` | user address |

    ??? quote "Source code"

        ```python
        get_gauge: public(address[MAX_INT128])
        ```

    === "Example"

        ```shell
        >>> ChildGaugeFactory.get_gauge(1):
        '0xCE5F24B7A95e9cBa7df4B54E911B4A3Dc8CDAf6f'
        ```


## **Mint Emissions**

### `mint`
!!! description "`ChildGaugeFactory.mint(_gauge: address):`"

    Function to mint CRV emission rewards for `msg.sender` and transfer it to them.

    Emits: `Minted`

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_gauge` |  `address` | gauge address to mint from |

    ??? quote "Source code"

        ```python
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

        ```shell
        >>> ChildGaugeFactory.mint('todo'):
        ```


### `mint_many`
!!! description "`ChildGaugeFactory.mint(_gauge: address[32]):`"

    Function to mint CRV emission rewards from multiple gauges for `msg.sender` and transfer it to them. This function supports claim of up to 32 gauges in one transcations.

    Emits: `Minted`

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_gauge` |  `address[32]` | gauge addresses to mint from |

    ??? quote "Source code"

        ```python
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

        ```shell
        >>> ChildGaugeFactory.mint_many('todo'):
        ```


### `minted`
!!! description "`ChildGaugeFactory.minted(arg0: address, arg1: address) -> uint256: view`"

    Getter for the total minted CRV of address `arg0` from gauge `arg1`.

    Returns: total minted CRV (`uint256`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `arg0` |  `address` | user address |
    | `arg1` |  `address` | gauge address |

    ??? quote "Source code"

        ```python
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

        ```shell
        >>> ChildGaugeFactory.minted('0xbac512b0be66194e1912d76bb929e19a84adfa07', '0xCE5F24B7A95e9cBa7df4B54E911B4A3Dc8CDAf6f'):
        1782570157728607
        ```


## **Deploying Gauges**

### `deploy_gauge`
!!! description "`ChildGaugeFactory.deploy_gauge(_lp_token: address, _salt: bytes32, _manager: address = msg.sender) -> address:`"

    Function to deploy a ChildLiquidityGauge and initialize it.

    Returns: gauge (`address`).

    Emits: `DeployedGauge` and possibly `UpdateMirrored`

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_lp_token` |  `address` | lp token to deploy the gauge for |
    | `_salt` |  `bytes32` | salt  |
    | `_manager` |  `address` | gauge manager address; defaults to `msg.sender` |

    ??? quote "Source code"

        ```python
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

        ```shell
        >>> ChildGaugeFactory.mint_many('todo'):
        ```




## **Voting-Escrow and Implementation**

### `voting_escrow`
!!! description "`ChildGaugeFactory.voting_escrow() -> address: view`"

    Getter for the Voting-Escrow contract on Arbitrum. This contract is needed to apply user boosts for gauges.

    Returns: voting escrow (`address`).

    ??? quote "Source code"

        ```python
        voting_escrow: public(address)
        ```

    === "Example"

        ```shell
        >>> ChildGaugeFactory.voting_escrow():
        '0x98c80fa823759b642c3e02f40533c164f40727ae'
        ```


### `set_voting_escrow`
!!! description "`ChildGaugeFactory.set_voting_escrow(_voting_escrow: address):`"

    !!!guard "Guarded Method"
        This function is only callable by the `owner` of the contract. 

    Function to set the voting escrow contract.

    Emits: `UpdateVotingEscrow`

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_voting_escrow` |  `address` | voting escorw oracle contract |

    ??? quote "Source code"

        ```python
        event UpdateVotingEscrow:
            _old_voting_escrow: address
            _new_voting_escrow: address

        voting_escrow: public(address)

        @external
        def set_voting_escrow(_voting_escrow: address):
            """
            @notice Update the voting escrow contract
            @param _voting_escrow Contract to use as the voting escrow oracle
            """
            assert msg.sender == self.owner  # dev: only owner

            log UpdateVotingEscrow(self.voting_escrow, _voting_escrow)
            self.voting_escrow = _voting_escrow
        ```

    === "Example"

        ```shell
        >>> ChildGaugeFactory.set_voting_escrow('todo'):        
        ```


### `get_implementation`
!!! description "`ChildGaugeFactory.is_mirrored(_gauge: address) -> bool:`"

    Getter for the ChildLiquidityGauge implementation from which the ChildGauges are created from.

    Returns: implementation contract (`address`).

    ??? quote "Source code"

        ```python
        get_implementation: public(address)
        ```

    === "Example"

        ```shell
        >>> ChildGaugeFactory.get_implementation():
        '0x9336da074c4f585a8b59a8c2b77a32b630cde5a1'
        ```


### `set_implementation`
!!! description "`ChildGaugeFactory.set_implementation(_implementation: address):`"

    !!!guard "Guarded Method"
        This function is only callable by the `owner` of the contract. 

    Function to set the gauge implementation contract.

    Emits: `UpdateImplementation`

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_implementation` |  `address` | implementation contract |

    ??? quote "Source code"

        ```python
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
        >>> ChildGaugeFactory.set_voting_escrow('todo'):        
        ```


## **Admin Ownership**

### `owner`
!!! description "`ChildGaugeFactory.owner() -> address: view`"

    Getter for the owner of the ChildGaugeFactory contract.

    Returns: owner (`address`).

    ??? quote "Source code"

        ```python
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

        ```python
        future_owner: public(address)
        ```

    === "Example"

        ```shell
        >>> ChildGaugeFactory.future_owner():
        '0xd754492dc12fdea93c49e88c0437ace2e7cd1c14'
        ```


### `commit_transfer_ownership`
!!! description "`ChildGaugeFactory.commit_transfer_ownership(_future_owner: address):`"

    !!!guard "Guarded Method"
        This function is only callable by the `owner` of the contract.

    Function to commit the transfer of contract ownership to `_future_owner`.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_future_owner` |  `address` | future owner |

    ??? quote "Source code"

        ```python
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
        >>> ChildGaugeFactory.commit_transfer_ownership('todo'):        
        ```


### `accept_transfer_ownership`
!!! description "`ChildGaugeFactory.accept_transfer_ownership():`"

    !!!guard "Guarded Method"
        This function is only callable by the `future_owner` of the contract.

    Function to accept the transfer of ownership.

    Emits: `TransferOwnership`

    ??? quote "Source code"

        ```python
        event TransferOwnership:
            _old_owner: address
            _new_owner: address

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
        >>> ChildGaugeFactory.accept_transfer_ownership():        
        ```