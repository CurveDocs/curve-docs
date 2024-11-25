<h1>ChildGaugeFactory</h1>

The `ChildGaugeFactory` contract is used to deploy liquidity gauges on the child chains. It serves as some sort of registry for the child gauges by storing information such as the gauge data, minted amounts, and more. It is also the contract where CRV emissions are claimed from.


???+ vyper "`ChildGaugeFactory.vy`"
    The source code for the `ChildGaugeFactory.vy` contract can be found on [:material-github: GitHub](https://github.com/curvefi/curve-xchain-factory/blob/master/contracts/ChildGaugeFactory.vy). The contract is written using [Vyper](https://github.com/vyperlang/vyper) version `0.3.10` 

    A full list of all deployed `ChildGaugeFactory` contracts can be found [here](../deployments/crosschain.md#childgaugefactory).


---


## **Deploy Child Gauge**

Child gauges can either be deployed from the `RootChainFactory` or directly from the according `ChildGaugeFactory`.

### `deploy_gauge`
!!! description "`ChildGaugeFactory.deploy_gauge(_lp_token: address, _salt: bytes32, _manager: address = msg.sender) -> address`"

    Function to deploy a new gauge.

    Returns: newly deployed gauge (`address`).

    Emits: `DeployedGauge` event.

    | Input    | Type      | Description |
    | -------- | --------- | ----------- |
    | `_lp_token` | `address` | LP token to deploy gauge for |
    | `_salt` | `bytes32` | Salt to deterministically deploy gauge |
    | `_manager` | `address` | Address to set as manager of the gauge; defaults to `msg.sender` |

    ??? quote "Source code"

        === "ChildGaugeFactory.vy"

            ```python
            interface ChildGauge:
                def initialize(_lp_token: address, _root: address, _manager: address): nonpayable

            event DeployedGauge:
                _implementation: indexed(address)
                _lp_token: indexed(address)
                _deployer: indexed(address)
                _salt: bytes32
                _gauge: address

            owner: public(address)
            future_owner: public(address)
            manager: public(address)

            root_factory: public(address)
            root_implementation: public(address)
            call_proxy: public(address)
            # [last_request][has_counterpart][is_valid_gauge]
            gauge_data: public(HashMap[address, uint256])
            # user -> gauge -> value
            minted: public(HashMap[address, HashMap[address, uint256]])

            get_gauge_from_lp_token: public(HashMap[address, address])
            get_gauge_count: public(uint256)
            get_gauge: public(address[max_value(int128)])

            @external
            def deploy_gauge(_lp_token: address, _salt: bytes32, _manager: address = msg.sender) -> address:
                """
                @notice Deploy a liquidity gauge
                @param _lp_token The token to deposit in the gauge
                @param _salt A value to deterministically deploy a gauge
                @param _manager The address to set as manager of the gauge
                """
                if self.get_gauge_from_lp_token[_lp_token] != empty(address):
                    # overwriting lp_token -> gauge mapping requires
                    assert msg.sender == self.owner  # dev: only owner

                gauge_data: uint256 = 1  # set is_valid_gauge = True
                implementation: address = self.get_implementation
                salt: bytes32 = keccak256(_abi_encode(chain.id, _salt))
                gauge: address = create_minimal_proxy_to(
                    implementation, salt=salt
                )

                if msg.sender == self.call_proxy:
                    gauge_data += 2  # set mirrored = True
                    log UpdateMirrored(gauge, True)
                    # issue a call to the root chain to deploy a root gauge
                    CallProxy(self.call_proxy).anyCall(
                        self,
                        _abi_encode(chain.id, _salt, method_id=method_id("deploy_gauge(uint256,bytes32)")),
                        empty(address),
                        1
                    )

                self.gauge_data[gauge] = gauge_data

                idx: uint256 = self.get_gauge_count
                self.get_gauge[idx] = gauge
                self.get_gauge_count = idx + 1
                self.get_gauge_from_lp_token[_lp_token] = gauge

                # derive root gauge address
                gauge_codehash: bytes32 = keccak256(
                    concat(
                        0x602d3d8160093d39f3363d3d373d3d3d363d73,
                        convert(self.root_implementation, bytes20),
                        0x5af43d82803e903d91602b57fd5bf3,
                    )
                )
                digest: bytes32 = keccak256(concat(0xFF, convert(self.root_factory, bytes20), salt, gauge_codehash))
                root: address = convert(convert(digest, uint256) & convert(max_value(uint160), uint256), address)

                # If root is uninitialized, self.owner can always set the root gauge manually
                # on the gauge contract itself via set_root_gauge method
                ChildGauge(gauge).initialize(_lp_token, root, _manager)

                log DeployedGauge(implementation, _lp_token, msg.sender, _salt, gauge)
                return gauge
            ```

    === "Example"

        ```shell
        >>> soon
        ```


---


## **Minting Emissions**

CRV emissions are minted directly from the child gauge and can be claimed by the user. They can not be claimed from the `ChildGauge` contract itself.

When claiming emissions via `claim` or `claim_many`, and `is_mirrored` is set to `True` and `last_request` is not the current week, a call to the root chain is made to transmit the emissions to the child gauge.

### `mint`
!!! description "`ChildGaugeFactory.mint(_gauge: address)`"

    Function to mint all CRV emissions belonging to `msg.sender` from a given gauge.

    Emits: `Minted`

    | Input    | Type      | Description |
    | -------- | --------- | ----------- |
    | `_gauge` | `address` | Gauge to mint CRV emissions from |

    ??? quote "Source code"

        === "ChildGaugeFactory.vy"

            ```python
            event Minted:
                _user: indexed(address)
                _gauge: indexed(address)
                _new_total: uint256

            WEEK: constant(uint256) = 86400 * 7

            crv: public(ERC20)

            root_factory: public(address)
            root_implementation: public(address)
            call_proxy: public(address)
            # [last_request][has_counterpart][is_valid_gauge]
            gauge_data: public(HashMap[address, uint256])
            # user -> gauge -> value
            minted: public(HashMap[address, HashMap[address, uint256]])

            get_gauge_from_lp_token: public(HashMap[address, address])
            get_gauge_count: public(uint256)
            get_gauge: public(address[max_value(int128)])

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
                if gauge_data & 2 != 0 and (gauge_data >> 2) / WEEK != block.timestamp / WEEK:
                    CallProxy(self.call_proxy).anyCall(
                        self,
                        _abi_encode(_gauge, method_id=method_id("transmit_emissions(address)")),
                        empty(address),
                        1,
                    )
                    # update last request time
                    self.gauge_data[_gauge] = block.timestamp << 2 + 3

                assert ChildGauge(_gauge).user_checkpoint(_user)
                total_mint: uint256 = ChildGauge(_gauge).integrate_fraction(_user)
                to_mint: uint256 = total_mint - self.minted[_user][_gauge]

                if to_mint != 0 and self.crv != empty(ERC20):
                    assert self.crv.transfer(_user, to_mint, default_return_value=True)
                    self.minted[_user][_gauge] = total_mint

                    log Minted(_user, _gauge, total_mint)
            ```

    === "Example"

        ```shell
        >>> soon
        ```


### `mint_many`
!!! description "`ChildGaugeFactory.mint_many(_gauges: address[32]) -> bool`"

    Function to mint all CRV emissions belonging to `msg.sender` from multiple gauges.

    Emits: `Minted`

    | Input    | Type      | Description |
    | -------- | --------- | ----------- |
    | `_gauges` | `address[32]` | Array of gauges to mint CRV emissions from |

    ??? quote "Source code"

        === "ChildGaugeFactory.vy"

            ```python
            event Minted:
                _user: indexed(address)
                _gauge: indexed(address)
                _new_total: uint256

            WEEK: constant(uint256) = 86400 * 7
            
            crv: public(ERC20)

            root_factory: public(address)
            root_implementation: public(address)
            call_proxy: public(address)
            # [last_request][has_counterpart][is_valid_gauge]
            gauge_data: public(HashMap[address, uint256])
            # user -> gauge -> value
            minted: public(HashMap[address, HashMap[address, uint256]])

            get_gauge_from_lp_token: public(HashMap[address, address])
            get_gauge_count: public(uint256)
            get_gauge: public(address[max_value(int128)])

            @external
            @nonreentrant("lock")
            def mint_many(_gauges: address[32]):
                """
                @notice Mint everything which belongs to `msg.sender` across multiple gauges
                @param _gauges List of `LiquidityGauge` addresses
                """
                for i in range(32):
                    if _gauges[i] == empty(address):
                        pass
                    self._psuedo_mint(_gauges[i], msg.sender)

            @internal
            def _psuedo_mint(_gauge: address, _user: address):
                gauge_data: uint256 = self.gauge_data[_gauge]
                assert gauge_data != 0  # dev: invalid gauge

                # if is_mirrored and last_request != this week
                if gauge_data & 2 != 0 and (gauge_data >> 2) / WEEK != block.timestamp / WEEK:
                    CallProxy(self.call_proxy).anyCall(
                        self,
                        _abi_encode(_gauge, method_id=method_id("transmit_emissions(address)")),
                        empty(address),
                        1,
                    )
                    # update last request time
                    self.gauge_data[_gauge] = block.timestamp << 2 + 3

                assert ChildGauge(_gauge).user_checkpoint(_user)
                total_mint: uint256 = ChildGauge(_gauge).integrate_fraction(_user)
                to_mint: uint256 = total_mint - self.minted[_user][_gauge]

                if to_mint != 0 and self.crv != empty(ERC20):
                    assert self.crv.transfer(_user, to_mint, default_return_value=True)
                    self.minted[_user][_gauge] = total_mint

                    log Minted(_user, _gauge, total_mint)
            ```

    === "Example"

        ```shell
        >>> soon
        ```


### `minted`
!!! description "`ChildGaugeFactory.minted(_user: address, _gauge: address) -> uint256`"

    Getter to check the amount of CRV emissions minted for a user from a given gauge.

    Returns: Amount of CRV emissions minted (`uint256`).

    | Input    | Type      | Description |
    | -------- | --------- | ----------- |
    | `_user` | `address` | User to check minted amount for |
    | `_gauge` | `address` | Gauge to check minted amount for |

    ??? quote "Source code"

        === "ChildGaugeFactory.vy"

            ```python
            minted: public(HashMap[address, HashMap[address, uint256]])
            ```

    === "Example"

        ```shell
        >>> soon
        ```


---


## **Gauge Data**

The `ChildGaugeFactory` contract stores different gauge data for all the child gauges deployed via the factory.

### `gauge_data`
!!! description "`ChildGaugeFactory.gauge_data(_gauge: address) -> uint256`"

    Getter to check gauge data. The variable stores a `uint256` value where the bits are stored as follows:

    - `[0:2]`: `is_valid_gauge`
    - `[2:3]`: `has_counterpart`
    - `[3:256]`: `last_request`

    Returns: gauge data (`uint256`).

    | Input    | Type      | Description |
    | -------- | --------- | ----------- |
    | `_gauge` | `address` | Gauge to check data for |

    ??? quote "Source code"

        === "ChildGaugeFactory.vy"

            ```python
            # [last_request][has_counterpart][is_valid_gauge]
            gauge_data: public(HashMap[address, uint256])
            ```

    === "Example"

        ```shell
        >>> soon
        ```


### `is_valid_gauge`
!!! description "`ChildGaugeFactory.is_valid_gauge(_gauge: address) -> bool`"

    Getter to check if a gauge is valid.

    Returns: `True` if the gauge is valid, `False` otherwise (`bool`).

    | Input    | Type      | Description |
    | -------- | --------- | ----------- |
    | `_gauge` | `address` | Gauge to check validity for |

    ??? quote "Source code"

        === "ChildGaugeFactory.vy"

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
        >>> soon
        ```


### `get_gauge_from_lp_token`
!!! description "`ChildGaugeFactory.get_gauge_from_lp_token(_lp_token: address) -> address`"

    Getter for gauge associated with a given LP token.

    Returns: gauge (`address`).

    | Input    | Type      | Description |
    | -------- | --------- | ----------- |
    | `_lp_token` | `address` | LP token to check gauge for |

    ??? quote "Source code"

        === "ChildGaugeFactory.vy"

            ```python
            get_gauge_from_lp_token: public(HashMap[address, address])
            ```

    === "Example"

        ```shell
        >>> soon
        ```


### `get_gauge_count`
!!! description "`ChildGaugeFactory.get_gauge_count() -> uint256`"

    Getter for the number of gauges deployed.

    Returns: number of gauges deployed (`uint256`).

    ??? quote "Source code"

        === "ChildGaugeFactory.vy"

            ```python
            get_gauge_count: public(uint256)
            ```

    === "Example"

        ```shell
        >>> ChildGaugeFactory.get_gauge_count()
        3
        ```


### `get_gauge`
!!! description "`ChildGaugeFactory.get_gauge(_idx: uint256) -> address`"

    Getter for the gauge address at a given index. First gauge has index `0`, second has index `1`, etc.

    Returns: gauge (`address`).

    | Input    | Type      | Description |
    | -------- | --------- | ----------- |
    | `_idx` | `uint256` | Index to check gauge for |

    ??? quote "Source code"

        === "ChildGaugeFactory.vy"

            ```python
            get_gauge: public(address[max_value(int128)])
            ```

    === "Example"

        This example returns the first two child gauges deployed via the `ChildGaugeFactory` on Fraxtal.

        ```shell
        >>> ChildGaugeFactory.get_gauge(0)
        '0x0092782EF5d4dFBB2949c2C147020E7aC644D870'

        >>> ChildGaugeFactory.get_gauge(1)
        '0xcde3Cdf332E35653A7595bA555c9fDBA3c78Ec04'
        ```


### `last_request`
!!! description "`ChildGaugeFactory.last_request(_gauge: address) -> uint256`"

    Getter for the last request timestamp for a gauge. This variable updates whenever CRV emissions were minted from the according gauge.

    Returns: last request timestamp (`uint256`).

    | Input    | Type      | Description |
    | -------- | --------- | ----------- |
    | `_gauge` | `address` | Gauge to check last request timestamp for |

    ??? quote "Source code"

        === "ChildGaugeFactory.vy"

            ```python
            # [last_request][has_counterpart][is_valid_gauge]
            gauge_data: public(HashMap[address, uint256])

            @view
            @external
            def last_request(_gauge: address) -> uint256:
                """
                @notice Query the timestamp of the last cross chain request for emissions
                @param _gauge The address of the gauge of interest
                """
                return self.gauge_data[_gauge] >> 2
            ```

    === "Example"

        ```shell
        >>> soon
        ```


### `is_mirrored`
!!! description "`ChildGaugeFactory.is_mirrored(_gauge: address) -> bool`"

    Getter to check if a gauge is mirrored.

    Returns: `True` if the gauge is mirrored, `False` otherwise (`bool`).

    | Input    | Type      | Description |
    | -------- | --------- | ----------- |
    | `_gauge` | `address` | Gauge to check mirrored status for |

    ??? quote "Source code"

        === "ChildGaugeFactory.vy"

            ```python
            # [last_request][has_counterpart][is_valid_gauge]
            gauge_data: public(HashMap[address, uint256])

            @view
            @external
            def is_mirrored(_gauge: address) -> bool:
                """
                @notice Query whether the gauge is mirrored on Ethereum mainnet
                @param _gauge The address of the gauge of interest
                """
                return (self.gauge_data[_gauge] & 2) != 0
            ```

    === "Example"

        ```shell
        >>> ChildGaugeFactory.is_mirrored('0xcde3Cdf332E35653A7595bA555c9fDBA3c78Ec04')
        False
        ```


### `set_mirrored`
!!! description "`ChildGaugeFactory.set_mirrored(_gauge: address, _is_mirrored: bool)`"

    !!!guard "Guarded Method"
        This function is only callable by the `owner` of the contract.

    Function to set the mirrored status of a gauge.

    Returns: `True` if the gauge is mirrored, `False` otherwise (`bool`).

    Emits: `UpdateMirrored` event.

    | Input      | Type      | Description |
    | ---------- | --------- | ----------- |
    | `_gauge` | `address` | Gauge to set mirrored status for |
    | `_is_mirrored` | `bool` | New mirrored status |

    ??? quote "Source code"

        === "ChildGaugeFactory.vy"

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

                gauge_data = gauge_data | 1  # set is_valid_gauge = True
                if _mirrored:
                    gauge_data += 2  # set is_mirrored = True

                self.gauge_data[_gauge] = gauge_data
                log UpdateMirrored(_gauge, _mirrored)
            ```

    === "Example"

        ```shell
        >>> soon
        ```


---


## **Child Gauge Implementation**

### `get_implementation`
!!! description "`ChildGaugeFactory.get_implementation() -> address: view`"

    Getter for the child gauge implementation address.

    Returns: `ChildGauge` implementation contract (`address`).

    ??? quote "Source code"

        === "ChildGaugeFactory.vy"

            ```python
            get_implementation: public(address)
            ```

    === "Example"

        This example returns the `ChildGauge` implementation contract for the `ChildGaugeFactory` on Fraxtal.

        ```shell
        >>> ChildGaugeFactory.get_implementation()
        '0x6A611215540555A7feBCB64CB0Ed11Ac90F165Af'
        ```


### `set_implementation`
!!! description "`ChildGaugeFactory.set_implementation(_implementation: address)`"

    !!!guard "Guarded Method"
        This function is only callable by the `owner` of the contract.

    Function to set the implementation address.

    Emits: `UpdateImplementation` event.

    | Input      | Type      | Description |
    | ---------- | --------- | ----------- |
    | `_implementation` | `address` | New implementation address |

    ??? quote "Source code"

        === "ChildGaugeFactory.vy"

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
        >>> ChildGaugeFactory.get_implementation()
        '0x6A611215540555A7feBCB64CB0Ed11Ac90F165Af'

        >>> ChildGaugeFactory.set_implementation('0x1234567890123456789012345678901234567892')

        >>> ChildGaugeFactory.get_implementation()
        '0x1234567890123456789012345678901234567892'
        ```


---


## **Root Factory and Implementation**

The `root_factory` and `root_implementation` variables store the addresses of the root factory and implementation, respectively. They are only used as helper variables within this contract. Both variables can be updated by the `owner` or `manager` of the contract via the `set_root` function.

### `root_factory`
!!! description "`ChildGaugeFactory.root_factory() -> address: view`"

    Getter for the root factory address.

    Returns: `RootGaugeFactory` contract on Ethereum (`address`).

    ??? quote "Source code"

        === "ChildGaugeFactory.vy"

            ```python
            event UpdateRoot:
                _factory: address
                _implementation: address

            root_factory: public(address)

            @external
            def __init__(_call_proxy: address, _root_factory: address, _root_impl: address, _crv: address, _owner: address):
                """
                @param _call_proxy Contract for
                @param _root_factory Root factory to anchor to
                @param _root_impl Address of root gauge implementation to calculate mirror (can be updated)
                @param _crv Bridged CRV token address (might be zero if not known yet)
                @param _owner Owner of factory (xgov)
                """
                ...
                assert _root_factory != empty(address)
                assert _root_impl != empty(address)
                self.root_factory = _root_factory
                self.root_implementation = _root_impl
                log UpdateRoot(_root_factory, _root_impl)
                ...
            ```

    === "Example"

        This example returns the `RootGaugeFactory` contract on Ethereum.

        ```shell
        >>> ChildGaugeFactory.root_factory()
        '0x306A45a1478A000dC701A6e1f7a569afb8D9DCD6'
        ```


### `root_implementation`
!!! description "`ChildGaugeFactory.root_implementation() -> address: view`"

    Getter for the root implementation address.

    Returns: `RootGauge` implementation contract on Ethereum (`address`).
    
    ??? quote "Source code"

        === "ChildGaugeFactory.vy"

            ```python
            root_implementation: public(address)

            @external
            def __init__(_call_proxy: address, _root_factory: address, _root_impl: address, _crv: address, _owner: address):
                """
                @param _call_proxy Contract for
                @param _root_factory Root factory to anchor to
                @param _root_impl Address of root gauge implementation to calculate mirror (can be updated)
                @param _crv Bridged CRV token address (might be zero if not known yet)
                @param _owner Owner of factory (xgov)
                """
                ...
                assert _root_factory != empty(address)
                assert _root_impl != empty(address)
                self.root_factory = _root_factory
                self.root_implementation = _root_impl
                log UpdateRoot(_root_factory, _root_impl)
                ...
            ```

    === "Example"

        This example returns the `RootGauge` implementation contract on Ethereum.

        ```shell
        >>> ChildGaugeFactory.root_implementation()
        '0x96720942F9fF22eFd8611F696E5333Fe3671717a'
        ```


### `set_root`
!!! description "`ChildGaugeFactory.set_root(_factory: address, _implementation: address)`"

    !!!guard "Guarded Method"
        This function is only callable by the `owner` or `manager` of the contract.

    Function to set the `root_factory` and `root_implementation` addresses.

    Emits: `UpdateRoot` event.

    | Input      | Type      | Description |
    | ---------- | --------- | ----------- |
    | `_factory` | `address` | New `RootGaugeFactory` address |
    | `_implementation` | `address` | New `RootGauge` implementation address |

    ??? quote "Source code"

        === "ChildGaugeFactory.vy"

            ```python
            root_factory: public(address)
            root_implementation: public(address)

            @external
            def set_root(_factory: address, _implementation: address):
                """
                @notice Update root addresses
                @dev Addresses are used only as helper methods
                @param _factory Root gauge factory
                @param _implementation Root gauge
                """
                assert msg.sender in [self.owner, self.manager]  # dev: access denied

                self.root_factory = _factory
                self.root_implementation = _implementation
                log UpdateRoot(_factory, _implementation)
            ```

    === "Example"

        ```shell
        >>> ChildGaugeFactory.set_root('0x1234567890123456789012345678901234567890', '0x1234567890123456789012345678901234567891')
        ```


---


## **CRV Token and Voting Escrow**

The `crv` and `voting_escrow` variables store the addresses of the CRV token and `VotingEscrow` contract, respectively. `crv` represents a bridged version of the CRV token, whereas `voting_escrow` represents a `L2 VotingEscrow Oracle` contract. This oracle is responsible for providing data from the `VotingEscrow` contract on Ethereum to the child chain in order to make boosts on sidechains work. If there is no `L2 VotingEscrow Oracle` set, the boosts on the child chain will not work.


### `crv`
!!! description "`ChildGaugeFactory.crv() -> address: view`"

    Getter for the CRV token address of the child chain.

    Returns: CRV token on the child chain (`address`).

    ??? quote "Source code"

        === "ChildGaugeFactory.vy"

            ```python
            crv: public(ERC20)

            @external
            def __init__(_call_proxy: address, _root_factory: address, _root_impl: address, _crv: address, _owner: address):
                """
                @param _call_proxy Contract for
                @param _root_factory Root factory to anchor to
                @param _root_impl Address of root gauge implementation to calculate mirror (can be updated)
                @param _crv Bridged CRV token address (might be zero if not known yet)
                @param _owner Owner of factory (xgov)
                """
                self.crv = ERC20(_crv)
                ...
            ```

    === "Example"

        This example returns the token address of bridged CRV on Fraxtal.

        ```shell
        >>> ChildGaugeFactory.crv()
        '0x331B9182088e2A7d6D3Fe4742AbA1fB231aEcc56'
        ```


### `set_crv`
!!! description "`ChildGaugeFactory.set_crv(_crv: address)`"

    !!!guard "Guarded Method"
        This function is only callable by the `owner` of the contract.

    Function to set the CRV token address.

    Emits: `UpdateCRV` event.

    | Input      | Type      | Description |
    | ---------- | --------- | ----------- |
    | `_crv` | `address` | New CRV token address |

    ??? quote "Source code"

        === "ChildGaugeFactory.vy"

            ```python
            crv: public(ERC20)

            @external
            def set_crv(_crv: ERC20):
                """
                @notice Sets CRV token address
                @dev Child gauges reference the factory to fetch CRV address
                    If empty, the gauges do not mint any CRV tokens.
                @param _crv address of CRV token on child chain
                """
                assert msg.sender == self.owner
                assert _crv != empty(ERC20)

                self.crv = _crv
            ```

    === "Example"

        ```shell
        >>> ChildGaugeFactory.crv()
        '0x331B9182088e2A7d6D3Fe4742AbA1fB231aEcc56'

        >>> ChildGaugeFactory.set_crv('0x1234567890123456789012345678901234567892')

        >>> ChildGaugeFactory.crv()
        '0x1234567890123456789012345678901234567892'
        ```


### `voting_escrow`
!!! description "`ChildGaugeFactory.voting_escrow() -> address: view`"

    Getter for the `VotingEscrow` contract.

    Returns: `VotingEscrow` contract (`address`).

    ??? quote "Source code"

        === "ChildGaugeFactory.vy"

            ```python
            voting_escrow: public(address)
            ```

    === "Example"

        ```shell
        >>> ChildGaugeFactory.voting_escrow()
        '0xc73e8d8f7A68Fc9d67e989250484E57Ae03a5Da3'
        ```


### `set_voting_escrow`
!!! description "`ChildGaugeFactory.set_voting_escrow(_voting_escrow: address)`"

    !!!guard "Guarded Method"
        This function is only callable by the `owner` of the contract.

    Function to set the `VotingEscrow` contract.

    Emits: `UpdateVotingEscrow` event.

    | Input      | Type      | Description |
    | ---------- | --------- | ----------- |
    | `_voting_escrow` | `address` | New voting escrow address |

    ??? quote "Source code"

        === "ChildGaugeFactory.vy"

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
        >>> ChildGaugeFactory.voting_escrow()
        '0xc73e8d8f7A68Fc9d67e989250484E57Ae03a5Da3'

        >>> ChildGaugeFactory.set_voting_escrow('0x1234567890123456789012345678901234567893')

        >>> ChildGaugeFactory.voting_escrow()
        '0x1234567890123456789012345678901234567893'
        ```


---

## **Manager**

### `manager`
!!! description "`ChildGaugeFactory.manager() -> address: view`"

    Getter for the manager address. This variable is set at initialization and can be changed via the `set_manager` function.

    Returns: manager (`address`).

    ??? quote "Source code"

        === "ChildGaugeFactory.vy"

            ```python
            event UpdateManager:
                _manager: address

            manager: public(address)

            @external
            def __init__(_call_proxy: address, _root_factory: address, _root_impl: address, _crv: address, _owner: address):
                """
                @param _call_proxy Contract for
                @param _root_factory Root factory to anchor to
                @param _root_impl Address of root gauge implementation to calculate mirror (can be updated)
                @param _crv Bridged CRV token address (might be zero if not known yet)
                @param _owner Owner of factory (xgov)
                """
                ...
                self.manager = msg.sender
                log UpdateManager(msg.sender)
            ```

    === "Example"

        ```shell
        >>> ChildGaugeFactory.manager()
        '0xaE50429025B59C9D62Ae9c3A52a657BC7AB64036'
        ```


### `set_manager`
!!! description "`ChildGaugeFactory.set_manager(_new_manager: address)`"

    !!!guard "Guarded Method"
        This function is only callable by the `owner` or `manager` of the contract.

    Function to change the manager address.

    Emits: `UpdateManager` event.

    | Input      | Type      | Description |
    | ---------- | --------- | ----------- |
    | `_new_manager` | `address` | New manager address |

    ??? quote "Source code"

        === "ChildGaugeFactory.vy"

            ```python
            event UpdateManager:
                _manager: address

            manager: public(address)

            @external
            def set_manager(_new_manager: address):
                assert msg.sender in [self.owner, self.manager]  # dev: access denied

                self.manager = _new_manager
                log UpdateManager(_new_manager)
            ```

    === "Example"

        ```shell
        >>> ChildGaugeFactory.manager()
        '0x71F718D3e4d1449D1502A6A7595eb84eBcCB1683'

        >>> ChildGaugeFactory.set_manager('0x1234567890123456789012345678901234567895')

        >>> ChildGaugeFactory.manager()
        '0x1234567890123456789012345678901234567895'
        ```


---


## **Ownership**

### `owner`
!!! description "`ChildGaugeFactory.owner() -> address: view`"

    Getter for the owner address.

    Returns: owner (`address`).

    ??? quote "Source code"

        === "ChildGaugeFactory.vy"

            ```python
            owner: public(address)
            ```

    === "Example"

        ```shell
        >>> ChildGaugeFactory.owner()
        '0xaE50429025B59C9D62Ae9c3A52a657BC7AB64036'
        ```


### `future_owner`
!!! description "`ChildGaugeFactory.future_owner() -> address: view`"

    Getter for the future owner address.

    Returns: future owner (`address`).

    ??? quote "Source code"

        === "ChildGaugeFactory.vy"

            ```python
            future_owner: public(address)
            ```

    === "Example"

        ```shell
        >>> ChildGaugeFactory.future_owner()
        '0x0000000000000000000000000000000000000000'
        ```


### `commit_transfer_ownership`
!!! description "`ChildGaugeFactory.commit_transfer_ownership(_future_owner: address)`"

    Function to commit the transfer of ownership to a new address.

    Emits: `CommitOwnership` event.

    | Input    | Type      | Description |
    | ---------- | --------- | ----------- |
    | `_future_owner` | `address` | New owner address |

    ??? quote "Source code"

        === "ChildGaugeFactory.vy"

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
        >>> ChildGaugeFactory.commit_transfer_ownership('0x1234567890123456789012345678901234567896')

        >>> ChildGaugeFactory.future_owner()
        '0x1234567890123456789012345678901234567896'
        ```


### `accept_transfer_ownership`
!!! description "`ChildGaugeFactory.accept_transfer_ownership()`"

    Function to accept the transfer of ownership.

    Emits: `TransferOwnership` event.

    ??? quote "Source code"

        === "ChildGaugeFactory.vy"

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
        >>> ChildGaugeFactory.accept_transfer_ownership()

        >>> ChildGaugeFactory.owner()
        '0x1234567890123456789012345678901234567896'
        ```


---


## **Other Methods**


### `call_proxy`
!!! description "`ChildGaugeFactory.call_proxy() -> address: view`"

    Getter for the call proxy contract. This contract acts as an intermediary to facilitate cross-chain calls.

    Returns: call proxy address (`address`).

    Emits: `UpdateCallProxy` event at initialization.

    ??? quote "Source code"

        === "ChildGaugeFactory.vy"

            ```python
            event UpdateCallProxy:
                _old_call_proxy: address
                _new_call_proxy: address

            call_proxy: public(address)

            @external
            def __init__(_call_proxy: address, _root_factory: address, _root_impl: address, _crv: address, _owner: address):
                """
                @param _call_proxy Contract for
                @param _root_factory Root factory to anchor to
                @param _root_impl Address of root gauge implementation to calculate mirror (can be updated)
                @param _crv Bridged CRV token address (might be zero if not known yet)
                @param _owner Owner of factory (xgov)
                """
                ...
                self.call_proxy = _call_proxy
                log UpdateCallProxy(empty(address), _call_proxy)
                ...
            ```

    === "Example"

        ```shell
        >>> ChildGaugeFactory.call_proxy()
        '0x0000000000000000000000000000000000000000'
        ```


### `set_call_proxy`
!!! description "`ChildGaugeFactory.set_call_proxy(_new_call_proxy: address)`"

    !!!guard "Guarded Method"
        This function is only callable by the `owner` of the contract.

    Function to set or update the call proxy address.

    Emits: `UpdateCallProxy` event.

    | Input      | Type      | Description |
    | ---------- | --------- | ----------- |
    | `_new_call_proxy` | `address` | New call proxy address |

    ??? quote "Source code"

        === "ChildGaugeFactory.vy"

            ```python
            event UpdateCallProxy:
                _old_call_proxy: address
                _new_call_proxy: address

            call_proxy: public(address)

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
        >>> ChildGaugeFactory.call_proxy()
        '0x0000000000000000000000000000000000000000'

        >>> ChildGaugeFactory.set_call_proxy('0x1234567890123456789012345678901234567894')  

        >>> ChildGaugeFactory.call_proxy()
        '0x1234567890123456789012345678901234567894'
        ```


### `version`
!!! description "`ChildGaugeFactory.version() -> string[8]: view`"

    Getter for the version of the `ChildGaugeFactory` contract.

    Returns: version (`string[8]`).

    ??? quote "Source code"

        === "ChildGaugeFactory.vy"

            ```python
            version: public(constant(String[8])) = "2.0.0"
            ```

    === "Example"

        ```shell
        >>> ChildGaugeFactory.version()
        '2.0.0'
        ```
