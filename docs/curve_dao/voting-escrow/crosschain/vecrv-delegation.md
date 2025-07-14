<h1>L2 veCRV Delegation</h1>

The `L2veCRVDelegation` contract enables users to delegate their veCRV voting power to different addresses on other networks (Layer 2s or sidechains). This is essential for veCRV-utility activities like veCRV boosting on chains where their original address may not be available or convenient. The contract supports both user-initiated delegation and DAO-administered delegation for special cases (e.g., lost keys or non-reachable addresses). The contract also includes mechanisms to allow or revoke delegation to an address and to prevent frontrunning attacks.


???+ vyper "`L2veCRVDelegation.vy`"
    The source code for the `L2veCRVDelegation.vy` contract is available on [:material-github: GitHub](https://github.com/curvefi/storage-proofs/blob/main/contracts/vecrv/VecrvDelegate.vy). The contract is written in [Vyper](https://vyperlang.org/) version `0.4.0`.

    The `VotingEscrow` on :logos-ethereum: Ethereum is deployed at [`0xde1e6A7E8297076f070E857130E593107A0E0cF5`](https://etherscan.io/address/0xde1e6A7E8297076f070E857130E593107A0E0cF5) and contract version is `0.0.1`.

    ??? abi "Contract ABI"

        ```json
        [{"anonymous":false,"inputs":[{"indexed":true,"name":"_chain_id","type":"uint256"},{"indexed":true,"name":"_to","type":"address"}],"name":"AllowDelegation","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"_chain_id","type":"uint256"},{"indexed":true,"name":"_from","type":"address"},{"indexed":false,"name":"_to","type":"address"}],"name":"Delegate","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"previous_owner","type":"address"},{"indexed":true,"name":"new_owner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"inputs":[{"name":"new_owner","type":"address"}],"name":"transfer_ownership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"owner","outputs":[{"name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"name":"_chain_id","type":"uint256"},{"name":"_from","type":"address"}],"name":"delegated","outputs":[{"name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"name":"_chain_id","type":"uint256"},{"name":"_to","type":"address"}],"name":"delegator","outputs":[{"name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"name":"_chain_id","type":"uint256"},{"name":"_to","type":"address"}],"name":"delegation_allowed","outputs":[{"name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"name":"_chain_id","type":"uint256"},{"name":"_to","type":"address"}],"name":"delegate","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"name":"_chain_id","type":"uint256"}],"name":"allow_delegation","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"name":"_chain_id","type":"uint256"},{"name":"_allow","type":"bool"}],"name":"allow_delegation","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"name":"_chain_id","type":"uint256"},{"name":"_from","type":"address"},{"name":"_to","type":"address"}],"name":"delegate_from","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"version","outputs":[{"name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[{"name":"_owner","type":"address"}],"outputs":[],"stateMutability":"nonpayable","type":"constructor"}]
        ```

---

## **Delegation**

The delegation system in `L2veCRVDelegation` is designed to be flexible and secure. Users can delegate their veCRV voting power to another address on a specific chain, revoke delegation, or allow others to delegate to them. The contract also provides DAO-level controls for exceptional cases, ensuring that delegation can be managed even if a user is unable to interact directly. The following functions describe the available delegation mechanisms and their intended use cases.


### `delegate`
!!! description "`L2veCRVDelegation.delegate(_chain_id: uint256, _to: address)`"

    Function to delegate veCRV to another address on a specific chain. Only addresses that have explicitly allowed delegation (via `allow_delegation`) can be delegated to. To revoke delegation, delegate to your own address.

    Emits: `Delegate` event.

    | Input       | Type      | Description                          |
    | ----------- | --------- | ------------------------------------ |
    | `_chain_id` | `uint256` | Chain ID where to set the delegation |
    | `_to`       | `address` | Address to delegate to               |

    ??? quote "Source code"

        === "L2veCRVDelegation.vy"

            ```python
            event Delegate:
                _chain_id: indexed(uint256)
                _from: indexed(address)
                _to: address

            # [chain id][address from][address to]
            delegation_from: HashMap[uint256, HashMap[address, address]]
            delegation_to: HashMap[uint256, HashMap[address, address]]

            @external
            def delegate(_chain_id: uint256, _to: address):
                """
                @notice Delegate veCRV balance to another address
                @dev To revoke delegation set delegation to yourself
                @param _chain_id Chain ID where to set
                @param _to Address to delegate to
                """
                assert self.delegation_to[_chain_id][_to] == self, "Not allowed"
                self._delegate(_chain_id, msg.sender, _to)

            def _delegate(_chain_id: uint256, _from: address, _to: address):
                # Clean previous delegation
                prev_to: address = self.delegation_from[_chain_id][_from]
                if prev_to not in [empty(address), self]:
                    self.delegation_to[_chain_id][prev_to] = empty(address)

                self.delegation_from[_chain_id][_from] = _to
                self.delegation_to[_chain_id][_to] = _from
                log Delegate(_chain_id, _from, _to)

            ```

    === "Example"

        This example delegates their veCRV balance to `0x71F718D3e4d1449D1502A6A7595eb84eBcCB1683` on chain `146`

        ```shell
        >>> L2veCRVDelegation.delegate(146, '0x71F718D3e4d1449D1502A6A7595eb84eBcCB1683')
        ```


### `delegate_from`
!!! description "`L2veCRVDelegation.delegate_from(_chain_id: uint256, _from: address, _to: address)`"

    DAO-only function to set delegation for addresses that cannot interact directly (e.g., lost keys or non-reachable addresses). Only callable by the contract owner.

    Emits: `Delegate` event.

    | Input       | Type      | Description                          |
    | ----------- | --------- | ------------------------------------ |
    | `_chain_id` | `uint256` | Chain ID where to set the delegation |
    | `_from`     | `address` | Address that delegates               |
    | `_to`       | `address` | Address balance being delegated to   |

    ??? quote "Source code"

        === "L2veCRVDelegation.vy"

            ```python
            from snekmate.auth import ownable

            event Delegate:
                _chain_id: indexed(uint256)
                _from: indexed(address)
                _to: address

            # [chain id][address from][address to]
            delegation_from: HashMap[uint256, HashMap[address, address]]
            delegation_to: HashMap[uint256, HashMap[address, address]]

            @external
            def delegate_from(_chain_id: uint256, _from: address, _to: address):
                """
                @notice DAO-owned method to set delegation for non-reachable addresses
                @param _chain_id Chain ID where to set
                @param _from Address that delegates
                @param _to Address balance being delegated to
                """
                ownable._check_owner()

                self._delegate(_chain_id, _from, _to)

            def _delegate(_chain_id: uint256, _from: address, _to: address):
                # Clean previous delegation
                prev_to: address = self.delegation_from[_chain_id][_from]
                if prev_to not in [empty(address), self]:
                    self.delegation_to[_chain_id][prev_to] = empty(address)

                self.delegation_from[_chain_id][_from] = _to
                self.delegation_to[_chain_id][_to] = _from
                log Delegate(_chain_id, _from, _to)
            ```

    === "Example"

        In this example, the DAO delegates the veCRV balance from `0x5802ad5D5B1c63b3FC7DE97B55e6db19e5d36462` to `0x71F718D3e4d1449D1502A6A7595eb84eBcCB1683` on chain `146`.

        ```shell
        # DAO sets delegation for a non-reachable address
        >>> L2veCRVDelegation.delegate_from(146, '0x5802ad5D5B1c63b3FC7DE97B55e6db19e5d36462', '0x71F718D3e4d1449D1502A6A7595eb84eBcCB1683')
        ```

### `allow_delegation`
!!! description "`L2veCRVDelegation.allow_delegation(_chain_id: uint256, _allow: bool = True)`"

    Allows or revokes permission for others to delegate veCRV to your address on a specific chain. This must be called before anyone can delegate to you, and is required to prevent frontrunning attacks.

    Emits: `AllowDelegation` or `Delegate` event.

    | Input       | Type      | Description                                                       |
    | ----------- | --------- | ----------------------------------------------------------------- |
    | `_chain_id` | `uint256` | Chain ID                                                          |
    | `_allow`    | `bool`    | `true` to allow delegation, `false` to remove; defaults to `true` |

    ??? quote "Source code"

        === "L2veCRVDelegation.vy"

            ```python
            event AllowDelegation:
                _chain_id: indexed(uint256)
                _to: indexed(address)

            event Delegate:
                _chain_id: indexed(uint256)
                _from: indexed(address)
                _to: address

            # [chain id][address from][address to]
            delegation_from: HashMap[uint256, HashMap[address, address]]
            delegation_to: HashMap[uint256, HashMap[address, address]]

            @external
            def allow_delegation(_chain_id: uint256, _allow: bool = True):
                """
                @notice Allow delegation to your address
                @dev Needed to deal with frontrun
                @param _chain_id Chaind ID to allow for
                @param _allow True(default) if allow, and False to remove delegation
                """
                # Clean current delegation
                _from: address = self.delegation_to[_chain_id][msg.sender]
                if _from not in [empty(address), self]:
                    self.delegation_from[_chain_id][_from] = empty(address)
                    log Delegate(_chain_id, _from, empty(address))

                if _allow:
                    self.delegation_to[_chain_id][msg.sender] = self
                    log AllowDelegation(_chain_id, msg.sender)
                else:
                    self.delegation_to[_chain_id][msg.sender] = empty(address)
            ```

    === "Example"

        This example shows how to allow and revoke delegation.

        ```shell
        >>> L2veCRVDelegation.allow_delegation(146, True)       # Allow delegation to your address on chain 146

        >>> L2veCRVDelegation.allow_delegation(146, False)      # Revoke delegation
        ```


### `delegation_allowed`
!!! description "`L2veCRVDelegation.delegation_allowed(_chain_id: uint256, _to: address) -> bool`"

    Getter method to check whether delegation to a given address is currently allowed on a specific chain.

    Returns: `true` if delegation is allowed, `false` otherwise.

    | Input       | Type      | Description          |
    | ----------- | --------- | -------------------- |
    | `_chain_id` | `uint256` | Chain ID             |
    | `_to`       | `address` | Address to check for |

    ??? quote "Source code"

        === "L2veCRVDelegation.vy"

            ```python
            delegation_to: HashMap[uint256, HashMap[address, address]]

            @external
            @view
            def delegation_allowed(_chain_id: uint256, _to: address) -> bool:
                """
                @notice Check whether delegation to this address is allowed
                @param _chain_id Chain ID to check for
                @param _to Address to check for
                @return True if allowed to delegate
                """
                return self.delegation_to[_chain_id][_to] == self
            ```

    === "Example"

        This example checks if delegation for `0x71F718D3e4d1449D1502A6A7595eb84eBcCB1683` is allowed on chain `146`.

        ```shell
        >>> L2veCRVDelegation.delegation_allowed(146, '0x71F718D3e4d1449D1502A6A7595eb84eBcCB1683')
        True
        ```


### `delegated`
!!! description "`L2veCRVDelegation.delegated(_chain_id: uint256, _from: address) -> address`"

    Returns the address to which a given user's veCRV balance is delegated on a specific chain. If no delegation is set, returns the original address.

    | Input       | Type      | Description |
    | ----------- | --------- | ----------- |
    | `_chain_id` | `uint256` | Chain ID    |
    | `_from`     | `address` | Delegator   |

    ??? quote "Source code"

        === "L2veCRVDelegation.vy"

            ```python
            delegation_from: HashMap[uint256, HashMap[address, address]]

            @external
            @view
            def delegated(_chain_id: uint256, _from: address) -> address:
                """
                @notice Get contract balance being delegated to
                @param _chain_id Chain ID to check for
                @param _from Address of delegator
                @return Destination address of delegation
                """
                addr: address = self.delegation_from[_chain_id][_from]
                if addr == empty(address):
                    addr = _from
                return addr
            ```

    === "Example"

        In this example, address `0x5802ad5D5B1c63b3FC7DE97B55e6db19e5d36462` delegated his veCRV balance on chain `146` to `0x71F718D3e4d1449D1502A6A7595eb84eBcCB1683`.

        ```shell
        >>> L2veCRVDelegation.delegated(146, '0x5802ad5D5B1c63b3FC7DE97B55e6db19e5d36462')
        '0x71F718D3e4d1449D1502A6A7595eb84eBcCB1683'
        ```


### `delegator`
!!! description "`L2veCRVDelegation.delegator(_chain_id: uint256, _to: address) -> address`"

    Getter for the address that delegated their veCRV balance to a given address on a specific chain. If no delegator is set, returns the `_to` address itself.

    Returns: delegator (`address`).

    | Input       | Type      | Description                          |
    | ----------- | --------- | ------------------------------------ |
    | `_chain_id` | `uint256` | Chain ID where to set the delegation |
    | `_to`       | `address` | Delegatee                            |

    ??? quote "Source code"

        === "L2veCRVDelegation.vy"

            ```python
            delegation_to: HashMap[uint256, HashMap[address, address]]

            @external
            @view
            def delegator(_chain_id: uint256, _to: address) -> address:
                """
                @notice Get contract delegating balance to `_to`
                @param _chain_id Chain ID to check for
                @param _to Address of delegated to
                @return Address of delegator
                """
                addr: address = self.delegation_to[_chain_id][_to]
                if addr in [empty(address), self]:
                    return _to
                return addr
            ```

    === "Example"

        This example returns the address which delegated their veCRV balance on chain `146` to `0x71F718D3e4d1449D1502A6A7595eb84eBcCB1683`, essentially the delegator.

        ```shell
        >>> L2veCRVDelegation.delegator(146, '0x71F718D3e4d1449D1502A6A7595eb84eBcCB1683')
        '0x5802ad5D5B1c63b3FC7DE97B55e6db19e5d36462'
        ```

---

## **Contract Ownership**

Contract ownership is handled via the snekmate `ownable` module. The `owner` of the contract is the DAO, and ownership can be transferred using the `transfer_ownership()` function.
