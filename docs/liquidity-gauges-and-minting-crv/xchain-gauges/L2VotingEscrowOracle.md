<h1>L2VotingEscrowOracle</h1>

The `L2VotingEscrowOracle` contract is used to fetch information from the `VotingEscrow` from Ethereum. This data can then be used to calculate boost rates for providing liquidity.

???+ vyper "`L2VotingEscrowOracle.vy`"
    The source code for the `L2VotingEscrowOracle.vy` contract can be found on [:material-github: GitHub](https://github.com/curvefi/curve-xchain-factory/blob/master/contracts/RootGaugeFactory.vy). The contract is written using [Vyper](https://github.com/vyperlang/vyper) version `0.3.10` 

    


fraxtal as example: https://fraxscan.com/address/0xc73e8d8f7A68Fc9d67e989250484E57Ae03a5Da3#readContract


---

### `update`
!!! description "`L2VotingEscrowOracle.update(_user: address = msg.sender, _gas_limit: uint32 = 0)`"

    !!!guard "Guarded Method"
        This function is only callable by the `MESSENGER`.

    Function to update

    | Parameter | Type | Description |
    | --------- | ---- | ------------ |
    | `_user` | `address` | The user to update the voting escrow information for. Defaults to the caller of the function. |
    | `_gas_limit` | `uint32` | The gas limit for the transaction. If 0, the function will attempt to retrieve the gas limit from the alternate chain. |

    ??? quote "Source code"

        === "L2VotingEscrowOracle.vy"

            ```python
            interface IMessenger:
                def xDomainMessageSender() -> address: view

            WEEK: constant(uint256) = 86400 * 7

            MESSENGER: public(immutable(IMessenger))

            epoch: public(uint256)
            point_history: public(HashMap[uint256, Point])

            user_point_epoch: public(HashMap[address, uint256])
            user_point_history: public(HashMap[address, HashMap[uint256, Point]])

            locked: public(HashMap[address, LockedBalance])
            slope_changes: public(HashMap[uint256, int128])

            @external
            def update(
                _user: address,
                _epoch: uint256,
                _point_history: Point,
                _user_point_epoch: uint256,
                _user_point_history: Point,
                _locked: LockedBalance,
                _slope_changes: int128[12]
            ):
                assert msg.sender == MESSENGER.address
                assert MESSENGER.xDomainMessageSender() == self

                start_time: uint256 = WEEK + (_point_history.ts / WEEK) * WEEK

                if self.epoch < _epoch:
                    self.epoch = _epoch

                    for i in range(12):
                        self.slope_changes[start_time + WEEK * i] = _slope_changes[i]

                self.point_history[_epoch] = _point_history

                if self.user_point_epoch[_user] < _user_point_epoch:
                    self.locked[_user] = _locked
                    self.user_point_epoch[_user] = _user_point_epoch
                
                self.user_point_history[_user][_user_point_epoch] = _user_point_history
            ```

    === "Example"

        ```python
        >>> L2VotingEscrowOracle.update()
        ```


---


### `balanceOf`
!!! description "`L2VotingEscrowOracle.update(_user: address = msg.sender, _gas_limit: uint32 = 0)`"

    todo

    | Parameter | Type | Description |
    | --------- | ---- | ------------ |
    | `_user` | `address` | The user to update the voting escrow information for. Defaults to the caller of the function. |
    | `_gas_limit` | `uint32` | The gas limit for the transaction. If 0, the function will attempt to retrieve the gas limit from the alternate chain. |

    ??? quote "Source code"

        === "L2VotingEscrowOracle.vy"

            ```python
            ```

    === "Example"

        ```python
        >>> L2VotingEscrowOracle.update()
        ```


### `totalSupply`
!!! description "`L2VotingEscrowOracle.update(_user: address = msg.sender, _gas_limit: uint32 = 0)`"

    todo

    | Parameter | Type | Description |
    | --------- | ---- | ------------ |
    | `_user` | `address` | The user to update the voting escrow information for. Defaults to the caller of the function. |
    | `_gas_limit` | `uint32` | The gas limit for the transaction. If 0, the function will attempt to retrieve the gas limit from the alternate chain. |

    ??? quote "Source code"

        === "L2VotingEscrowOracle.vy"

            ```python
            ```

    === "Example"

        ```python
        >>> L2VotingEscrowOracle.update()
        ```


### `epoch`
!!! description "`L2VotingEscrowOracle.update(_user: address = msg.sender, _gas_limit: uint32 = 0)`"

    todo

    | Parameter | Type | Description |
    | --------- | ---- | ------------ |
    | `_user` | `address` | The user to update the voting escrow information for. Defaults to the caller of the function. |
    | `_gas_limit` | `uint32` | The gas limit for the transaction. If 0, the function will attempt to retrieve the gas limit from the alternate chain. |

    ??? quote "Source code"

        === "L2VotingEscrowOracle.vy"

            ```python
            ```

    === "Example"

        ```python
        >>> L2VotingEscrowOracle.update()
        ```


### `point_history`
!!! description "`L2VotingEscrowOracle.update(_user: address = msg.sender, _gas_limit: uint32 = 0)`"

    todo

    | Parameter | Type | Description |
    | --------- | ---- | ------------ |
    | `_user` | `address` | The user to update the voting escrow information for. Defaults to the caller of the function. |
    | `_gas_limit` | `uint32` | The gas limit for the transaction. If 0, the function will attempt to retrieve the gas limit from the alternate chain. |

    ??? quote "Source code"

        === "L2VotingEscrowOracle.vy"

            ```python
            ```

    === "Example"

        ```python
        >>> L2VotingEscrowOracle.update()
        ```


### `user_point_epoch`
!!! description "`L2VotingEscrowOracle.update(_user: address = msg.sender, _gas_limit: uint32 = 0)`"

    todo

    | Parameter | Type | Description |
    | --------- | ---- | ------------ |
    | `_user` | `address` | The user to update the voting escrow information for. Defaults to the caller of the function. |
    | `_gas_limit` | `uint32` | The gas limit for the transaction. If 0, the function will attempt to retrieve the gas limit from the alternate chain. |

    ??? quote "Source code"

        === "L2VotingEscrowOracle.vy"

            ```python
            ```

    === "Example"

        ```python
        >>> L2VotingEscrowOracle.update()
        ```


### `user_point_history`
!!! description "`L2VotingEscrowOracle.update(_user: address = msg.sender, _gas_limit: uint32 = 0)`"

    todo

    | Parameter | Type | Description |
    | --------- | ---- | ------------ |
    | `_user` | `address` | The user to update the voting escrow information for. Defaults to the caller of the function. |
    | `_gas_limit` | `uint32` | The gas limit for the transaction. If 0, the function will attempt to retrieve the gas limit from the alternate chain. |

    ??? quote "Source code"

        === "L2VotingEscrowOracle.vy"

            ```python
            ```

    === "Example"

        ```python
        >>> L2VotingEscrowOracle.update()
        ```


### `locked`
!!! description "`L2VotingEscrowOracle.update(_user: address = msg.sender, _gas_limit: uint32 = 0)`"

    todo

    | Parameter | Type | Description |
    | --------- | ---- | ------------ |
    | `_user` | `address` | The user to update the voting escrow information for. Defaults to the caller of the function. |
    | `_gas_limit` | `uint32` | The gas limit for the transaction. If 0, the function will attempt to retrieve the gas limit from the alternate chain. |

    ??? quote "Source code"

        === "L2VotingEscrowOracle.vy"

            ```python
            ```

    === "Example"

        ```python
        >>> L2VotingEscrowOracle.update()
        ```


### `slope_changes`
!!! description "`L2VotingEscrowOracle.update(_user: address = msg.sender, _gas_limit: uint32 = 0)`"

    todo

    | Parameter | Type | Description |
    | --------- | ---- | ------------ |
    | `_user` | `address` | The user to update the voting escrow information for. Defaults to the caller of the function. |
    | `_gas_limit` | `uint32` | The gas limit for the transaction. If 0, the function will attempt to retrieve the gas limit from the alternate chain. |

    ??? quote "Source code"

        === "L2VotingEscrowOracle.vy"

            ```python
            ```

    === "Example"

        ```python
        >>> L2VotingEscrowOracle.update()
        ```

---


### `MESSENGER`
!!! description "`L2VotingEscrowOracle.MESSENGER() -> address: view`"

    Getter for the messenger contract address.

    Returns: messenger contract (`address`).

    ??? quote "Source code"

        === "L2VotingEscrowOracle.vy"

            ```python
            interface IMessenger:
                def xDomainMessageSender() -> address: view

            MESSENGER: public(immutable(IMessenger))

            @external
            def __init__(_messenger: IMessenger):
                MESSENGER = _messenger
            ```

    === "Example"

        This example returns the messenger contract address for the L2 voting escrow oracle on Fraxtal.

        ```python
        >>> L2VotingEscrowOracle.MESSENGER()
        '0x4200000000000000000000000000000000000007'
        ```