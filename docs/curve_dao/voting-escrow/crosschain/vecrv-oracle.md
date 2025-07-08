<h1>L2 VotingEscrow Oracle</h1>

The `L2VotingEscrowOracle` contract is used to fetch information from the `VotingEscrow` from Ethereum. This data can then be used to calculate boost rates for providing liquidity.


???+ vyper "`L2VotingEscrowOracle.vy`"
    The source code for the `L2VotingEscrowOracle.vy` contract is available on [:material-github: GitHub](https://github.com/curvefi/storage-proofs/blob/main/contracts/vecrv/VecrvOracle.vy). The contract is written in [Vyper](https://vyperlang.org/) version `0.4.0`.

    The `VotingEscrow` on :logos-ethereum: Ethereum is deployed at [`0x5f3b5DfEb7B28CDbD7FAba78963EE202a494e2A2`](https://etherscan.io/address/0x5f3b5DfEb7B28CDbD7FAba78963EE202a494e2A2).

    The `L2VotingEscrowOracle` contract is deployed at the following addresses and is version `1.0.0`:

    - :logos-optimism: Optimism: [`0xf1946d4879646e0fcd8f5bb32a5636ed8055176d`](https://optimistic.etherscan.io/address/0xf1946d4879646e0fcd8f5bb32a5636ed8055176d)
    - :logos-fraxtal: Fraxtal: [`0xF3daD3Ca2eF135b248128Ab1Ed984FB6F2185CBf`](https://fraxscan.com/address/0xF3daD3Ca2eF135b248128Ab1Ed984FB6F2185CBf)
    - :logos-sonic: Sonic: [`0x361aa6D20fbf6185490eB2ddf1DD1D3F301C201d`](https://sonicscan.org/address/0x361aa6D20fbf6185490eB2ddf1DD1D3F301C201d)
    - :logos-mantle: Mantle: [`0x852F32c22C5035EA12566EDFB4415625776D75d5`](https://mantlescan.xyz/address/0x852F32c22C5035EA12566EDFB4415625776D75d5)
    - :logos-base: Base: [`0xeB896fB7D1AaE921d586B0E5a037496aFd3E2412`](https://basescan.org/address/0xeB896fB7D1AaE921d586B0E5a037496aFd3E2412)
    - :logos-taiko: Taiko: [`0x5C57BdcFF69B4F1D894EA70c0470D39C8FA0ee30`](https://taikoscan.io/address/0x5C57BdcFF69B4F1D894EA70c0470D39C8FA0ee30)

    ??? abi "Contract ABI"

        ```json
        [{"anonymous":false,"inputs":[{"indexed":false,"name":"_epoch","type":"uint256"}],"name":"UpdateTotal","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"_user","type":"address"},{"indexed":false,"name":"_user_point_epoch","type":"uint256"}],"name":"UpdateBalance","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"_from","type":"address"},{"indexed":false,"name":"_to","type":"address"}],"name":"Delegate","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"role","type":"bytes32"},{"indexed":true,"name":"account","type":"address"},{"indexed":true,"name":"sender","type":"address"}],"name":"RoleGranted","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"role","type":"bytes32"},{"indexed":true,"name":"previousAdminRole","type":"bytes32"},{"indexed":true,"name":"newAdminRole","type":"bytes32"}],"name":"RoleAdminChanged","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"role","type":"bytes32"},{"indexed":true,"name":"account","type":"address"},{"indexed":true,"name":"sender","type":"address"}],"name":"RoleRevoked","type":"event"},{"inputs":[{"name":"interface_id","type":"bytes4"}],"name":"supportsInterface","outputs":[{"name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"name":"arg0","type":"bytes32"},{"name":"arg1","type":"address"}],"name":"hasRole","outputs":[{"name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"DEFAULT_ADMIN_ROLE","outputs":[{"name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[{"name":"role","type":"bytes32"},{"name":"account","type":"address"}],"name":"grantRole","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"name":"role","type":"bytes32"},{"name":"account","type":"address"}],"name":"revokeRole","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"name":"_from","type":"address"}],"name":"delegated","outputs":[{"name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"name":"_to","type":"address"}],"name":"delegator","outputs":[{"name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"name":"_user","type":"address"}],"name":"balanceOf","outputs":[{"name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"name":"_user","type":"address"},{"name":"_timestamp","type":"uint256"}],"name":"balanceOf","outputs":[{"name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"totalSupply","outputs":[{"name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"name":"_timestamp","type":"uint256"}],"name":"totalSupply","outputs":[{"name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"name":"_addr","type":"address"}],"name":"get_last_user_slope","outputs":[{"name":"","type":"int128"}],"stateMutability":"view","type":"function"},{"inputs":[{"name":"_addr","type":"address"}],"name":"locked__end","outputs":[{"name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"name":"_user","type":"address"},{"name":"_user_point_epoch","type":"uint256"},{"components":[{"name":"bias","type":"int128"},{"name":"slope","type":"int128"},{"name":"ts","type":"uint256"},{"name":"blk","type":"uint256"}],"name":"_user_point_history","type":"tuple"},{"components":[{"name":"amount","type":"int128"},{"name":"end","type":"uint256"}],"name":"_locked","type":"tuple"},{"name":"_block_number","type":"uint256"}],"name":"update_balance","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"name":"_epoch","type":"uint256"},{"components":[{"name":"bias","type":"int128"},{"name":"slope","type":"int128"},{"name":"ts","type":"uint256"},{"name":"blk","type":"uint256"}],"name":"_point_history","type":"tuple"},{"name":"_slope_changes","type":"int128[]"},{"name":"_block_number","type":"uint256"}],"name":"update_total","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"name":"_from","type":"address"},{"name":"_to","type":"address"},{"name":"_block_number","type":"uint256"}],"name":"update_delegation","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"BALANCE_VERIFIER","outputs":[{"name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"TOTAL_VERIFIER","outputs":[{"name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"DELEGATION_VERIFIER","outputs":[{"name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"epoch","outputs":[{"name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"name":"arg0","type":"uint256"}],"name":"point_history","outputs":[{"components":[{"name":"bias","type":"int128"},{"name":"slope","type":"int128"},{"name":"ts","type":"uint256"},{"name":"blk","type":"uint256"}],"name":"","type":"tuple"}],"stateMutability":"view","type":"function"},{"inputs":[{"name":"arg0","type":"address"}],"name":"user_point_epoch","outputs":[{"name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"name":"arg0","type":"address"},{"name":"arg1","type":"uint256"}],"name":"user_point_history","outputs":[{"components":[{"name":"bias","type":"int128"},{"name":"slope","type":"int128"},{"name":"ts","type":"uint256"},{"name":"blk","type":"uint256"}],"name":"","type":"tuple"}],"stateMutability":"view","type":"function"},{"inputs":[{"name":"arg0","type":"address"}],"name":"locked","outputs":[{"components":[{"name":"amount","type":"int128"},{"name":"end","type":"uint256"}],"name":"","type":"tuple"}],"stateMutability":"view","type":"function"},{"inputs":[{"name":"arg0","type":"uint256"}],"name":"slope_changes","outputs":[{"name":"","type":"int128"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"last_block_number","outputs":[{"name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"name","outputs":[{"name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"symbol","outputs":[{"name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"decimals","outputs":[{"name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"version","outputs":[{"name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"outputs":[],"stateMutability":"nonpayable","type":"constructor"}]
        ```


---


## **Updating the Oracle**

The "Updating the Oracle" section describes the privileged functions that allow authorized verifiers to update the state of the L2VotingEscrowOracle contract. These include updating individual user veCRV balances (`update_balance`) and the global voting power state (`update_total`). Each function is protected by role-based access control, ensuring only designated accounts (with roles like `BALANCE_VERIFIER` or `TOTAL_VERIFIER`) can perform updates. Updates are linearized using a block number check to prevent outdated data from overwriting newer state. This mechanism ensures the oracle remains synchronized with the canonical VotingEscrow contract on Ethereum, providing accurate and secure off-chain voting power data for L2 environments.


### `update_balance`
!!! description "`L2VotingEscrowOracle.update_balance(_user: address, _user_point_epoch: uint256, _user_point_history: Point, _locked: LockedBalance, _block_number: uint256):`"

    !!!guard "Guarded Method by Snekmate 🐍"
        This contract makes use of a Snekmate module to manage roles and permissions. Calling the `update_balance()` function can only be done by the address holding the `BALANCE_VERIFIER` role.

    Function to update the user's veCRV balance.

    Emits: `UpdateBalance`

    | Input   | Type      | Description |
    | ------- | --------- | ----------- |
    | `_user` | `address` | Address of the user to update the balance. |
    | `_user_point_epoch` | `uint256` | Last `_user`s checkpointed epoch  |
    | `_user_point_history` | `Point` | Last `_user`s point history |
    | `_locked` | `LockedBalance` | _user`s locked balance |
    | `_block_number` | `uint256` | block number |

    ??? quote "Source code"

        === "L2VotingEscrowOracle.vy"

            ```python
            event UpdateBalance:
                _user: address
                _user_point_epoch: uint256

            user_point_epoch: public(HashMap[address, uint256])
            user_point_history: public(HashMap[address, HashMap[uint256, Point]])

            locked: public(HashMap[address, LockedBalance])

            @external
            def update_balance(
                _user: address,
                _user_point_epoch: uint256,
                _user_point_history: Point,
                _locked: LockedBalance,
                _block_number: uint256,
            ):
                """
                @notice Update user balance
                @param _user Address of the user to verify for
                @param _user_point_epoch Last `_user`s checkpointed epoch
                @param _user_point_history Last `_user`s point history
                @param _locked `_user`s locked balance
                """
                access_control._check_role(BALANCE_VERIFIER, msg.sender)
                assert self.last_block_number <= _block_number, "Outdated update"
                #    assert (
                #        self.user_point_epoch[_user] <= _user_point_epoch
                #        and self.user_point_history[_user][_user_point_epoch].ts <= _user_point_history.ts
                #    ), "Outdated update"

                self.user_point_epoch[_user] = _user_point_epoch
                self.user_point_history[_user][_user_point_epoch] = _user_point_history
                self.locked[_user] = _locked
                log UpdateBalance(_user, _user_point_epoch)

                self.last_block_number = _block_number
            ```

    === "Example"

        ```shell
        >>> soon
        ```


### `balanceOf`
!!! description "`L2VotingEscrowOracle.balanceOf(_user: address, _timestamp: uint256 = block.timestamp) -> uint256: view`"

    Returns the veCRV balance of a user at a given timestamp, accounting for delegation.

    Returns: veCRV balance of the user at a specific timestamp (`uint256`).

    | Input      | Type      | Description                                 |
    | ---------- | --------- | ------------------------------------------- |
    | `_user`    | `address` | Address of the user                        |
    | `_timestamp` | `uint256` | Timestamp for balance check; defaults to current ts |

    ??? quote "Source code"

        === "L2VotingEscrowOracle.vy"

            ```python
            epoch: public(uint256)
            point_history: public(HashMap[uint256, Point])

            @view
            @external
            def balanceOf(_user: address, _timestamp: uint256 = block.timestamp) -> uint256:
                """
                @notice Get veCRV balance of user
                @param _user Address of the user
                @param _timestamp Timestamp for the balance check
                @return Balance of user
                """
                user: address = self._get_user_after_delegation(_user)
                if user == empty(address):
                    return 0
                return self._balanceOf(user, _timestamp)

            @view
            def _balanceOf(user: address, timestamp: uint256) -> uint256:
                epoch: uint256 = self.user_point_epoch[user]
                if epoch == 0:
                    return 0

                last_point: Point = self.user_point_history[user][epoch]
                last_point.bias -= last_point.slope * convert(timestamp - last_point.ts, int128)
                if last_point.bias < 0:
                    return 0

                return convert(last_point.bias, uint256)
            ```

    === "Example"

        This example returns the veCRV balance of `0x71F718D3e4d1449D1502A6A7595eb84eBcCB1683` on Optimism.

        ```shell
        >>> L2VotingEscrowOracle.balanceOf("0x71F718D3e4d1449D1502A6A7595eb84eBcCB1683")
        2036475234652423013212
        ```


### `update_total`
!!! description "`L2VotingEscrowOracle.update_total(_epoch: uint256, _point_history: Point, _slope_changes: DynArray[int128, SLOPE_CHANGES_CNT], _block_number: uint256):`"

    !!!guard "Guarded Method by Snekmate 🐍"
        This contract makes use of a Snekmate module to manage roles and permissions. Calling the `update_total()` function can only be done by the address holding the `TOTAL_VERIFIER` role.

    Updates the global `VotingEscrow` values, including epoch, point history, and slope changes.

    Emits: `UpdateTotal`

    | Input           | Type                                 | Description                                 |
    | --------------- | ------------------------------------ | ------------------------------------------- |
    | `_epoch`        | `uint256`                            | Current epoch in VotingEscrow contract      |
    | `_point_history`| `Point`                              | Last epoch point history                    |
    | `_slope_changes`| `DynArray[int128, SLOPE_CHANGES_CNT]`| Slope changes for upcoming epochs           |
    | `_block_number` | `uint256`                            | Block number for update linearization       |

    ??? quote "Source code"

        === "L2VotingEscrowOracle.vy"

            ```python
            event UpdateTotal:
                _epoch: uint256

            epoch: public(uint256)
            point_history: public(HashMap[uint256, Point])

            @external
            def update_total(
                _epoch: uint256,
                _point_history: Point,
                _slope_changes: DynArray[int128, SLOPE_CHANGES_CNT],
                _block_number: uint256,
            ):
                """
                @notice Update VotingEscrow global values
                @param _epoch Current epoch in VotingEscrow contract
                @param _point_history Last epoch point history
                @param _slope_changes Slope changes for upcoming epochs
                """
                access_control._check_role(TOTAL_VERIFIER, msg.sender)
                assert self.last_block_number <= _block_number, "Outdated update"
                #    assert (
                #        self.epoch <= _epoch and self.point_history[_epoch].ts <= _point_history.ts
                #    ), "Outdated update"

                self.epoch = _epoch
                self.point_history[_epoch] = _point_history

                start_time: uint256 = WEEK + (_point_history.ts // WEEK) * WEEK
                for i: uint256 in range(len(_slope_changes), bound=SLOPE_CHANGES_CNT):
                    self.slope_changes[start_time + WEEK * i] = _slope_changes[i]

                log UpdateTotal(_epoch)

                self.last_block_number = _block_number
            ```

    === "Example"

        ```shell
        >>> soon
        ```


### `totalSupply`
!!! description "`L2VotingEscrowOracle.totalSupply(_timestamp: uint256 = block.timestamp) -> uint256`"

    Getter for the total veCRV voting power at a given timestamp.

    Returns: total veCRV supply at a specific timestamp (`uint256`).

    | Input      | Type      | Description                                 |
    | ---------- | --------- | ------------------------------------------- |
    | `_timestamp` | `uint256` | Timestamp for total supply check; defaults to current ts |

    ??? quote "Source code"

        === "L2VotingEscrowOracle.vy"

            ```python
            point_history: public(HashMap[uint256, Point])

            slope_changes: public(HashMap[uint256, int128])

            @view
            @external
            def totalSupply(_timestamp: uint256 = block.timestamp) -> uint256:
                """
                @notice Calculate total voting power
                @param _timestamp Timestamp at which to check totalSupply
                @return Total supply
                """
                last_point: Point = self.point_history[self.epoch]
                t_i: uint256 = (last_point.ts // WEEK) * WEEK
                for i: uint256 in range(256):
                    t_i += WEEK

                    d_slope: int128 = 0
                    if t_i > _timestamp:
                        t_i = _timestamp
                    else:
                        d_slope = self.slope_changes[t_i]
                    last_point.bias -= last_point.slope * convert(t_i - last_point.ts, int128)
                    if t_i == _timestamp or d_slope == 0:
                        break

                    last_point.slope += d_slope
                    last_point.ts = t_i

                if last_point.bias < 0:
                    return 0

                return convert(last_point.bias, uint256)
            ```

    === "Example"

        This example returns the total veCRV supply on a specific Layer 2 network.

        ```shell
        >>> L2VotingEscrowOracle.totalSupply(1751872783)
        799701502604227430381519403
        ```

---

## Delegations

The `L2VotingEscrowOracle` contract supports delegation of veCRV balances, allowing one address to delegate its voting power to another. This is managed through the `delegated` and `delegator` view functions, which let users query the current delegation relationships. When a user delegates, their veCRV balance is effectively counted towards the delegatee, enabling boosting strategies. Delegation updates are controlled by the `DELEGATION_VERIFIER` role, ensuring only authorized entities can modify delegation mappings.


### `delegated`
!!! description "`L2VotingEscrowOracle.delegated(_from: address) -> address`"

    Getter for the address to which the veCRV balance of `_from` is delegated. If not delegated, returns `_from` itself.

    Returns: address receiving the delegation (`address`).

    | Input      | Type      | Description              |
    | ---------- | --------- | ------------------------ |
    | `_from`    | `address` | Address of the delegator |

    ??? quote "Source code"

        === "L2VotingEscrowOracle.vy"

            ```python
            # [address from][address to]
            delegation_from: HashMap[address, address]

            @external
            @view
            def delegated(_from: address) -> address:
                """
                @notice Get contract balance being delegated to
                @param _from Address of delegator
                @return Destination address of delegation
                """
                addr: address = self.delegation_from[_from]
                if addr == empty(address):
                    addr = _from
                return addr
            ```

    === "Example"

        This example shows the delegation of `0x5802ad5D5B1c63b3FC7DE97B55e6db19e5d36462` to `0x71F718D3e4d1449D1502A6A7595eb84eBcCB1683`.

        ```shell
        >>> L2VotingEscrowOracle.delegated("0x5802ad5D5B1c63b3FC7DE97B55e6db19e5d36462")
        "0x71F718D3e4d1449D1502A6A7595eb84eBcCB1683"
        ```


### `delegator`
!!! description "`L2VotingEscrowOracle.delegator(_to: address) -> address`"

    Getter for the address that delegated its veCRV balance to `_to`. If not delegated, returns `_to` itself.

    Returns: address of the delegator (`address`).

    | Input      | Type      | Description                                 |
    | ---------- | --------- | ------------------------------------------- |
    | `_to`      | `address` | Address of the delegatee                   |

    ??? quote "Source code"

        === "L2VotingEscrowOracle.vy"

            ```python
            delegation_to: HashMap[address, address]

            @external
            @view
            def delegator(_to: address) -> address:
                """
                @notice Get contract delegating balance to `_to`
                @param _to Address of delegated to
                @return Address of delegator
                """
                addr: address = self.delegation_to[_to]
                if addr == empty(address):
                    addr = _to
                return addr
            ```

    === "Example"

        This example returns the delegator of `0x71F718D3e4d1449D1502A6A7595eb84eBcCB1683`.

        ```shell
        >>> L2VotingEscrowOracle.delegator("0x71F718D3e4d1449D1502A6A7595eb84eBcCB1683")
        "0x5802ad5D5B1c63b3FC7DE97B55e6db19e5d36462"            # no delegation
        ```


### `update_delegation`
!!! description "`L2VotingEscrowOracle.update_delegation(_from: address, _to: address, _block_number: uint256):`"

    !!!guard
        DELEGATION_VERIFIER; Only callable by an account with the `DELEGATION_VERIFIER` role.

    Function to update the delegation of veCRV balance from `_from` to `_to`. 

    | Input         | Type      | Description                                 |
    | ------------- | --------- | ------------------------------------------- |
    | `_from`       | `address` | Address being delegated                     |
    | `_to`         | `address` | Address delegated to                        |
    | `_block_number`| `uint256`| Block number at which delegation holds true       |

    ??? quote "Source code"

        === "L2VotingEscrowOracle.vy"

            ```python
            # [address from][address to]
            delegation_from: HashMap[address, address]
            delegation_to: HashMap[address, address]
            last_delegation: HashMap[address, uint256]

            last_block_number: public(uint256)

            @external
            def update_delegation(_from: address, _to: address, _block_number: uint256):
                """
                @notice Update veCRV balance delegation
                @dev Block number is used to linearize updates
                @param _from Address being delegated
                @param _to Address delegated to
                @param _block_number Block number at which delegation holds true
                """
                access_control._check_role(DELEGATION_VERIFIER, msg.sender)
                assert self.last_block_number <= _block_number, "Outdated update"

                delegated: address = self.delegation_from[_from]
                if delegated != empty(address):  # revoke delegation
                    self.delegation_to[delegated] = empty(address)
                self.delegation_from[_from] = _to
                if _to != empty(address):
                    self.delegation_to[_to] = _from
                log Delegate(_from, _to)

                self.last_block_number = _block_number
            ```

    === "Example"

        ```shell
        >>> soon
        ```

---

## **Roles and Ownership Management**

The `L2VotingEscrowOracle` contract uses a role-based access control system, implemented via the Snekmate `access_control` module, to manage permissions for sensitive operations. Roles such as `BALANCE_VERIFIER`, `TOTAL_VERIFIER`, and `DELEGATION_VERIFIER` restrict who can update user balances, total supply, and delegation mappings, respectively. The `DEFAULT_ADMIN_ROLE` acts as the admin for all roles, and only accounts with the appropriate admin role can grant or revoke roles. This structure ensures that only authorized entities can perform privileged actions, providing robust security and flexibility for contract management.


### `BALANCE_VERIFIER`
!!! description "`L2VotingEscrowOracle.BALANCE_VERIFIER() -> bytes32: view`"

    The role identifier for accounts allowed to update user balances.

    Returns: role hash (`bytes32`)

    ??? quote "Source code"

        === "L2VotingEscrowOracle.vy"

            ```python
            BALANCE_VERIFIER: public(constant(bytes32)) = keccak256("BALANCE_VERIFIER")

            @deploy
            def __init__():
                access_control.__init__()
                access_control._set_role_admin(BALANCE_VERIFIER, access_control.DEFAULT_ADMIN_ROLE)
                access_control._set_role_admin(TOTAL_VERIFIER, access_control.DEFAULT_ADMIN_ROLE)
                access_control._set_role_admin(DELEGATION_VERIFIER, access_control.DEFAULT_ADMIN_ROLE)
            ```

    === "Example"

        This example returns the `BALANCE_VERIFIER` role as `bytes32` of the veCRV Oracle on Optimism.

        ```shell
        >>> L2VotingEscrowOracle.BALANCE_VERIFIER()
        '0x91ecbab409000ca436e362529d6a0ee19bfacafc306d0b7328e4b31a37513d1c'
        ```


### `TOTAL_VERIFIER`
!!! description "`L2VotingEscrowOracle.TOTAL_VERIFIER() -> bytes32: view`"

    The role identifier for accounts allowed to update total supply.

    Returns: role hash (`bytes32`)

    ??? quote "Source code"

        === "L2VotingEscrowOracle.vy"

            ```python
            TOTAL_VERIFIER: public(constant(bytes32)) = keccak256("TOTAL_VERIFIER")

            @deploy
            def __init__():
                access_control.__init__()
                access_control._set_role_admin(BALANCE_VERIFIER, access_control.DEFAULT_ADMIN_ROLE)
                access_control._set_role_admin(TOTAL_VERIFIER, access_control.DEFAULT_ADMIN_ROLE)
                access_control._set_role_admin(DELEGATION_VERIFIER, access_control.DEFAULT_ADMIN_ROLE)
            ```

    === "Example"

        This example returns the `TOTAL_VERIFIER` role as `bytes32` of the veCRV Oracle on Optimism.

        ```shell
        >>> L2VotingEscrowOracle.TOTAL_VERIFIER()
        '0x91bab4a1f219aaf3591b80c219b7a6eda6e5ddcadf2001c395591dcc40ecfbb7'
        ```


### `DELEGATION_VERIFIER`
!!! description "`L2VotingEscrowOracle.DELEGATION_VERIFIER() -> bytes32: view`"

    The role identifier for accounts allowed to update delegation.

    Returns: role hash (`bytes32`)

    ??? quote "Source code"

        === "L2VotingEscrowOracle.vy"

            ```python
            DELEGATION_VERIFIER: public(constant(bytes32)) = keccak256("DELEGATION_VERIFIER")

            @deploy
            def __init__():
                access_control.__init__()
                access_control._set_role_admin(BALANCE_VERIFIER, access_control.DEFAULT_ADMIN_ROLE)
                access_control._set_role_admin(TOTAL_VERIFIER, access_control.DEFAULT_ADMIN_ROLE)
                access_control._set_role_admin(DELEGATION_VERIFIER, access_control.DEFAULT_ADMIN_ROLE)
            ```

    === "Example"

        This example returns the `DELEGATION_VERIFIER` role as `bytes32` of the veCRV Oracle on Optimism.

        ```shell
        >>> L2VotingEscrowOracle.DELEGATION_VERIFIER()
        '0xe887cc0717dab2ad628f68695129fefff34ee397bdd39e44a259e2cae80f49b7'
        ```


### `DEFAULT_ADMIN_ROLE`
!!! description "`L2VotingEscrowOracle.DEFAULT_ADMIN_ROLE() -> bytes32: view`"

    Getter for the default admin role.

    Returns: default admin (`bytes32`).

    ??? quote "Source code"

        === "L2VotingEscrowOracle.vy"

            ```python
            from snekmate.auth import access_control

            initializes: access_control
            exports: (
                access_control.supportsInterface,
                access_control.hasRole,
                access_control.DEFAULT_ADMIN_ROLE,
                access_control.grantRole,
                access_control.revokeRole,
            )
            ```

    === "Example"

        This example returns the `DEFAULT_ADMIN_ROLE` role as `bytes32` of the veCRV Oracle on Optimism.

        ```shell
        >>> L2VotingEscrowOracle.DEFAULT_ADMIN_ROLE()
        '0x0000000000000000000000000000000000000000000000000000000000000000'
        ```


### `grantRole`
!!! description "`L2VotingEscrowOracle.grantRole(role: bytes32, account: address):`"

    !!!guard "Guarded Method by Snekmate 🐍"
        This contract makes use of a Snekmate module to manage roles and permissions. Granting a new address to a role is only callable by an account with the admin role for the given role.

    Function to grant a role to an account.

    | Input      | Type      | Description                                 |
    | ---------- | --------- | ------------------------------------------- |
    | `role`     | `bytes32` | Role identifier                             |
    | `account`  | `address` | Address to grant the role to                |

    ??? quote "Source code"

        === "L2VotingEscrowOracle.vy"

            ```python
            from snekmate.auth import access_control

            initializes: access_control
            exports: (
                access_control.supportsInterface,
                access_control.hasRole,
                access_control.DEFAULT_ADMIN_ROLE,
                access_control.grantRole,
                access_control.revokeRole,
            )
            ```


### `revokeRole`
!!! description "`L2VotingEscrowOracle.revokeRole(role: bytes32, account: address):`"


    !!!guard "Guarded Method by Snekmate 🐍"
        This contract makes use of a Snekmate module to manage roles and permissions. Granting a new address to a role is only callable by an account with the admin role for the given role.

    Function to revoke a role from an account.

    | Input      | Type      | Description                                 |
    | ---------- | --------- | ------------------------------------------- |
    | `role`     | `bytes32` | Role identifier                             |
    | `account`  | `address` | Address to revoke the role from             |

    ??? quote "Source code"

        === "L2VotingEscrowOracle.vy"

            ```python
            from snekmate.auth import access_control

            initializes: access_control
            exports: (
                access_control.supportsInterface,
                access_control.hasRole,
                access_control.DEFAULT_ADMIN_ROLE,
                access_control.grantRole,
                access_control.revokeRole,
            )
            ```


### `supportsInterface`
!!! description "`L2VotingEscrowOracle.supportsInterface(interfaceId: bytes4):`"

    Getter to check if the contract implements a specific interface ID.

    Returns: true or false (`bool`).

    | Input         | Type      | Description                                 |
    | ------------- | --------- | ------------------------------------------- |
    | `interfaceId` | `bytes4`  | Interface identifier                        |

    ??? quote "Source code"

        === "L2VotingEscrowOracle.vy"

            ```python
            from snekmate.auth import access_control

            initializes: access_control
            exports: (
                access_control.supportsInterface,
                access_control.hasRole,
                access_control.DEFAULT_ADMIN_ROLE,
                access_control.grantRole,
                access_control.revokeRole,
            )
            ```

    === "Example"

        ```shell
        >>> L2VotingEscrowOracle.supportsInterface("0x01FFC9A7")
        'true'
        ```


### `hasRole`
!!! description "`L2VotingEscrowOracle.hasRole(arg0: bytes32, arg1: address) -> bool: view`"

    Getter to check if an address has a specified role.

    Returns: true or false (`bool`).

    | Input      | Type      | Description                                 |
    | ---------- | --------- | ------------------------------------------- |
    | `role`     | `bytes32` | Role identifier                             |
    | `account`  | `address` | Address to check                            |

    ??? quote "Source code"

        === "L2VotingEscrowOracle.vy"

            ```python
            from snekmate.auth import access_control

            initializes: access_control
            exports: (
                access_control.supportsInterface,
                access_control.hasRole,
                access_control.DEFAULT_ADMIN_ROLE,
                access_control.grantRole,
                access_control.revokeRole,
            )
            ```

    === "Example"

        ```shell
        >>> L2VotingEscrowOracle.hasRole('0xe887cc0717dab2ad628f68695129fefff34ee397bdd39e44a259e2cae80f49b7', '0x1d04Fcb6293690D75E9262A89Ac3B816772E6841')
        'true'
        ```

---

## **User Info**

The contract provides getter functions that allow querying detailed information about user voting power, lock status, and historical checkpoints in the `L2VotingEscrowOracle` contract. These functions enable users and integrators to track veCRV balances, lock expirations, voting power decay (slope), and historical states for any address.

- If a user address is not found or has no history, functions like `balanceOf`, `locked__end`, and `get_last_user_slope` will return `0`
- If a delegation is not set, `delegated(_from)` and `delegator(_to)` will return the address itself
- If a user delegates out but is not delegated to, some getters may return `0` to indicate no effective balance


### `get_last_user_slope`
!!! description "`L2VotingEscrowOracle.get_last_user_slope(_addr: address) -> int128`"

    Returns the most recently recorded rate of voting power decrease (slope) for a user.

    Returns: last user slope (`int128`).

    | Input      | Type      | Description                                 |
    | ---------- | --------- | ------------------------------------------- |
    | `_addr`    | `address` | Address of the user                        |

    ??? quote "Source code"

        === "L2VotingEscrowOracle.vy"

            ```python
            user_point_epoch: public(HashMap[address, uint256])
            user_point_history: public(HashMap[address, HashMap[uint256, Point]])

            # [address from][address to]
            delegation_from: HashMap[address, address]
            delegation_to: HashMap[address, address]

            @external
            @view
            def get_last_user_slope(_addr: address) -> int128:
                """
                @notice Get the most recently recorded rate of voting power decrease for `addr`
                @param _addr Address of the user wallet
                @return Value of the slope
                """
                user: address = self._get_user_after_delegation(_addr)
                if user == empty(address):
                    return 0
                uepoch: uint256 = self.user_point_epoch[user]
                return self.user_point_history[user][uepoch].slope

            @view
            def _get_user_after_delegation(_user: address) -> address:
                user: address = self.delegation_to[_user]
                if user == empty(address):
                    if self.delegation_from[_user] not in [empty(address), _user]:  # only delegation out
                        return empty(address)
                    user = _user
                return user
            ```

    === "Example"

        ```shell
        >>> L2VotingEscrowOracle.get_last_user_slope("0x71F718D3e4d1449D1502A6A7595eb84eBcCB1683")
        31709791983764
        ```


### `locked__end`
!!! description "`L2VotingEscrowOracle.locked__end(_addr: address) -> uint256`"

    Getter for the timestamp when a user's lock finishes.

    Returns: ts when the lock ends (`uint256`).

    | Input      | Type      | Description                                 |
    | ---------- | --------- | ------------------------------------------- |
    | `_addr`    | `address` | Address of the user                        |

    ??? quote "Source code"

        === "L2VotingEscrowOracle.vy"

            ```python
            locked: public(HashMap[address, LockedBalance])

            # [address from][address to]
            delegation_from: HashMap[address, address]
            delegation_to: HashMap[address, address]

            @external
            @view
            def locked__end(_addr: address) -> uint256:
                """
                @notice Get timestamp when `_addr`'s lock finishes
                @param _addr User wallet
                @return Epoch time of the lock end
                """
                user: address = self._get_user_after_delegation(_addr)
                if user == empty(address):
                    return 0
                return self.locked[user].end

            @view
            def _get_user_after_delegation(_user: address) -> address:
                user: address = self.delegation_to[_user]
                if user == empty(address):
                    if self.delegation_from[_user] not in [empty(address), _user]:  # only delegation out
                        return empty(address)
                    user = _user
                return user
            ```

    === "Example"

        This example returns the timestamp when the user's veCRV lock ends.

        ```shell
        >>> L2VotingEscrowOracle.locked__end("0x71F718D3e4d1449D1502A6A7595eb84eBcCB1683")
        1816214400
        ```


### `epoch`
!!! description "`L2VotingEscrowOracle.epoch() -> uint256: view`"

    The current epoch of the `VotingEscrow` contract.

    Returns: current epoch (`uint256`).

    ??? quote "Source code"

        === "L2VotingEscrowOracle.vy"

            ```python
            epoch: public(uint256)
            ```

    === "Example"

        ```shell
        >>> L2VotingEscrowOracle.epoch()
        58959
        ```


### `point_history`
!!! description "`L2VotingEscrowOracle.point_history(arg0: uint256) -> bias: int128, slope: int128, ts: uint256, blk: uint256: view`"

    Getter for the point history of point `arg0`.

    Returns: bias (`int128`), slope (`int128`), ts (`uint256`) and blk (`uint256`).

    | Input  | Type      | Description |
    | ------ | --------- | ----------- |
    | `arg0` | `uint256` | value of the point to check |

    ??? quote "Source code"

        === "L2VotingEscrowOracle.vy"

            ```python
            struct Point:
                bias: int128
                slope: int128
                ts: uint256
                blk: uint256

            point_history: public(HashMap[uint256, Point])
            ```

    === "Example"

        This example returns the point history of an epoch.

        ```shell
        >>> L2VotingEscrowOracle.point_history(58959)
        800073125242408678972029063, 6788868070537972059, 1751818043, 22861249
        ```


### `user_point_epoch`
!!! description "`L2VotingEscrowOracle.user_point_epoch(_addr: address) -> uint256: view`"

    Getter for the last checkpointed epoch for a user.

    Returns: last checkpointed epoch (`uint256`).

    | Input      | Type      | Description           |
    | ---------- | --------- | --------------------- |
    | `_addr`    | `address` | Address of the user   |

    ??? quote "Source code"

        === "L2VotingEscrowOracle.vy"

            ```python
            struct Point:
                bias: int128
                slope: int128
                ts: uint256
                blk: uint256

            user_point_history: public(HashMap[address, HashMap[uint256, Point]])
            ```

    === "Example"

        This example returns the user point epoch of an address.

        ```shell
        >>> L2VotingEscrowOracle.user_point_epoch("0x71F718D3e4d1449D1502A6A7595eb84eBcCB1683")
        5
        ```


### `user_point_history`
!!! description "`L2VotingEscrowOracle.user_point_history(_addr: address, epoch: uint256):`"

    Getter for the point history for a user at a given index.

    Returns: `Point` struct containing bias (`int128`), slope (`int128`), ts (`uint256`) and blk (`uint256`).

    | Input      | Type      | Description           |
    | ---------- | --------- | --------------------- |
    | `_addr`    | `address` | Address of the user   |
    | `epoch`    | `uint256` | Epoch index           |

    ??? quote "Source code"

        === "L2VotingEscrowOracle.vy"

            ```python
            struct Point:
                bias: int128
                slope: int128
                ts: uint256
                blk: uint256

            user_point_history: public(HashMap[address, HashMap[uint256, Point]])
            ```

    === "Example"

        This example returns the user point history of the address `0x71F718D3e4d1449D1502A6A7595eb84eBcCB1683` at epoch `5`.

        ```shell
        >>> L2VotingEscrowOracle.user_point_history("0x71F718D3e4d1449D1502A6A7595eb84eBcCB1683", 5)
        3740249651192218998932, 1709791983764, 1712172287, 19577313
        ```


### `locked`
!!! description "`L2VotingEscrowOracle.locked(arg0: address) -> amount: int128, end: uint256`"

    Returns the locked balance struct for a user.

    Returns: `LockedBalance` struct containing amount (`int128`) and end timestamp (`uint256`) of locked CRV.

    | Input      | Type      | Description                                 |
    | ---------- | --------- | ------------------------------------------- |
    | `arg0`    | `address` | Address of the user                        |

    ??? quote "Source code"

        === "L2VotingEscrowOracle.vy"

            ```python
            struct LockedBalance:
                amount: int128
                end: uint256

            locked: public(HashMap[address, LockedBalance])
            ```

    === "Example"

        This example returns the total amount of CRV tokens locked, along with the timestamp when the lock ends.

        ```shell
        >>> L2VotingEscrowOracle.locked("0x71F718D3e4d1449D1502A6A7595eb84eBcCB1683")
        4000000000000000000000, 1830124800
        ```


### `slope_changes`
!!! description "`L2VotingEscrowOracle.slope_changes(arg0: uint256) -> int128`"

    Getter for the slope change at a given future timestamp.

    Returns: slope change (`uint256`).

    | Input      | Type      | Description                                 |
    | ---------- | --------- | ------------------------------------------- |
    | `timestamp`| `uint256` | Timestamp                                   |

    ??? quote "Source code"

        === "L2VotingEscrowOracle.vy"

            ```python
            slope_changes: public(HashMap[uint256, int128])
            ```

    === "Example"

        ```shell
        >>> L2VotingEscrowOracle.slope_changes(1760971290)
        0
        ```


### `last_block_number`
!!! description "`L2VotingEscrowOracle.last_block_number() -> uint256: view`"

    Getter for the last ETH block number at which an update was made.

    Returns: block number (`uint256`)

    ??? quote "Source code"

        === "L2VotingEscrowOracle.vy"

            ```python
            last_block_number: public(uint256)
            ```

    === "Example"

        This example returns the last Ethereum mainnet block at which an update to either the total supply or a user's veCRV balance was made.

        ```shell
        >>> L2VotingEscrowOracle.last_block_number()
        22861295
        ```
