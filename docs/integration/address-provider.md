<h1>Curve Address Provider</h1>


The `CurveAddressProvider` serves as the **entry point contract for Curve's various registries** and is deployed on all chains where Curve is operational. The contract holds the most important contract addresses.

!!!deploy "Contract Source & Deployment"
    Source code is avaliable on [:material-github: GitHub](https://github.com/curvefi/metaregistry/blob/main/contracts/AddressProviderNG.vy).

    A list of all deployed `AddressProvider` can be found [here :material-arrow-up-right:](../references/deployed-contracts.md#address-provider).


!!!warning "Contract Upgradability"
    The `AddressProvider` contract is managed by an `admin` who is currently an individual at Curve, rather than the Curve DAO[^1]. This **admin has the ability to update or add new IDs** within the contract. When integrating this contract into systems or relying on it for critical components, it is essential to consider that these **IDs and their associated addresses can be modified at any time**.

    [^1]: Reasoning: Due to the nature of the contract (it does not hold any user funds or has any monetary influence), it is not considered a crucial contract. It should only be used as a pure informational source. Additionally, the Curve ecosystem changes very rapidly and therefore requires fast updates for such a contract. Always putting up a DAO vote to change IDs would not be feasible.

---


## **Reading IDs**

For the full mapping of IDs please see [`get_id_info`](#get_id_info).

*ID information is stored in a `struct`, containing an address, a detailed description, its version, and the timestamp marking its most recent modification:*

```shell
struct AddressInfo:
    addr: address
    description: String[256]
    version: uint256
    last_modified: uint256
```


### `ids`
!!! description "`AddressProvider.ids() -> DynArray[uint256, 1000]:`"

    Getter function for all the IDs of active registry items in the AddressProvider.

    Returns: active ids (`DynArray[uint256, 1000]`)

    ??? quote "Source code"

        === "CurveAddressProvider.vy"

            ```vyper 
            _ids: DynArray[uint256, 1000]

            @view
            @external
            def ids() -> DynArray[uint256, 1000]:
                """
                @notice returns IDs of active registry items in the AddressProvider.
                @returns An array of IDs.
                """
                _ids: DynArray[uint256, 1000] = []
                for _id in self._ids:
                    if self.check_id_exists[_id]:
                        _ids.append(_id)

                return _ids
            ```

    === "Example"
        ```shell
        >>> AddressProvider.ids()
        0, 1, 2, 3, 4, 5, 6, 7, 8, 11, 12, 13, 14, 15, 16, 17, 19, 21, 22, 23
        ```


### `get_id_info`
!!! description "`AddressProvider.get_id_info(arg0: uint256) -> tuple: view`"

    Getter function to retrieve informations about a specific ID.

    Returns: struct containing of the addr (`address`), description (`String[256]`), version (`uint256`) and last_modified (`uint256`). 

        Descriptions:
        0: Stableswap Custom Pool Registry
        1: PoolInfo Getters
        2: Exchange Router
        3: Stableswap Metapool Factory
        4: Fee Distributor
        5: Cryptoswap Custom Pool Registry
        6: Twocrypto Factory
        7: Metaregistry
        8: Stableswap crvUSD Factory
        9: 
        10: 
        11: TricryptoNG Factory
        12: StableswapNG Factory
        13: TwocryptoNG Factory
        14: Stableswap Calculations Contract
        15: Cryptoswap calculations Contract
        16: LLAMMA Factory crvUSD
        17: LLAMMA Factory OneWayLending
        18: Rate Provider
        19: CRV Token
        20: Gauge Factory
        21: Ownership Admin
        22: Parameter Admin
        23: Emergency Admin
        24: CurveDAO Vault
        25: crvUSD Token

    | Input      | Type      | Description                  |
    | ---------- | --------- | ---------------------------- |
    | `arg0`     | `uint256` | ID to get the informations for |

    ??? quote "Source code"

        === "CurveAddressProvider.vy"

            ```vyper 
            struct AddressInfo:
                addr: address
                description: String[256]
                version: uint256
                last_modified: uint256

            get_id_info: public(HashMap[uint256, AddressInfo])
            ```

    === "Example"
        ```shell
        >>> AddressProvider.get_id_info(0)
        '0x90E00ACe148ca3b23Ac1bC8C240C2a7Dd9c2d7f5,Stableswap Custom Pool Registry,1,1712655599'

        >>> AddressProvider.get_id_info(9)
        '0x0000000000000000000000000000000000000000,,0,0'
        ```


### `get_address`
!!! description "`AddressProvider.get_address(arg0: uint256) -> address: view`"

    Getter for the contract address of a ID.

    Returns: contract (`address`).

    | Input      | Type      | Description                           |
    | ---------- | --------- | ------------------------------------- |
    | `arg0`     | `uint256` | ID to get the contract address for    |

    ??? quote "Source code"

        === "CurveAddressProvider.vy"

            ```vyper 
            struct AddressInfo:
                addr: address
                description: String[256]
                version: uint256
                last_modified: uint256

            get_id_info: public(HashMap[uint256, AddressInfo])

            @view
            @external
            def get_address(_id: uint256) -> address:
                """
                @notice Fetch the address associated with `_id`
                @dev Returns empty(address) if `_id` has not been defined, or has been unset
                @param _id Identifier to fetch an address for
                @return Current address associated to `_id`
                """
                return self.get_id_info[_id].addr
            ```

    === "Example"
        ```shell
        >>> AddressProvider.get_address(0)
        '0x90E00ACe148ca3b23Ac1bC8C240C2a7Dd9c2d7f5'
        ```


### `check_id_exists`
!!! description "`AddressProvider.check_id_exists(arg0: uint256) -> bool: view`"

    Function to check if an ID exists.

    Returns: true or false (`bool`).

    | Input      | Type      | Description                  |
    | ---------- | --------- | ---------------------------- |
    | `arg0`     | `uint256` | ID to check                  |

    ??? quote "Source code"

        === "CurveAddressProvider.vy"

            ```vyper 
            check_id_exists: public(HashMap[uint256, bool])
            ```

    === "Example"
        ```shell
        >>> AddressProvider.check_id_exists(0)
        'true'
        >>> AddressProvider.check_id_exists(9)
        'false'
        ```


### `num_entries`
!!! description "`AddressProvider.num_entries() -> uint256: view`"

    Getter for the number of entries. The count increments by one upon calling `_add_new_id` and decreases by one upon calling `_remove_id`.

    Returns: number of entries (`uint256`).

    ??? quote "Source code"

        === "CurveAddressProvider.vy"

            ```vyper 
            num_entries: public(uint256)
            ```

    === "Example"
        ```shell
        >>> AddressProvider.num_entries()
        20
        ```


---


## **Adding, Removing and Updating IDs**

IDs can be added, removed, or adjusted by the `admin` of the contract.



### `update_id`
!!! description "`AddressProvider.update_id(_id: uint256, _new_address: address, _new_description: String[64]):`"

    !!!guard "Guarded Methods"
        This function can only be called by the `admin` of the contract.

    Function to update the address and description of an ID.

    Emits: `EntryModified`

    | Input              | Type         | Description                  |
    | ------------------ | ------------ | ---------------------------- |
    | `_id`              | `uint256`    | ID to update                 |
    | `_new_address`     | `address`    | New address                  |
    | `_new_description` | `String[64]` | New description              |

    ??? quote "Source code"

        === "CurveAddressProvider.vy"

            ```vyper 
            event EntryModified:
                id: indexed(uint256)
                version: uint256

            @external
            def update_id(
                _id: uint256,
                _new_address: address,
                _new_description: String[64],
            ):
                """
                @notice Update entries at an ID
                @param _id Address assigned to the input _id
                @param _new_address Address assigned to the _id
                @param _new_description Human-readable description of the identifier
                """
                assert msg.sender == self.admin  # dev: admin-only function
                assert self.check_id_exists[_id]  # dev: id does not exist

                # Update entry at _id:
                self.get_id_info[_id].addr = _new_address
                self.get_id_info[_id].description = _new_description

                # Update metadata (version, update time):
                self._update_entry_metadata(_id)

            @internal
            def _update_entry_metadata(_id: uint256):

                version: uint256 = self.get_id_info[_id].version + 1
                self.get_id_info[_id].version = version
                self.get_id_info[_id].last_modified = block.timestamp

                log EntryModified(_id, version)
            ```

    === "Example"
        ```shell
        >>> soon
        ```


### `update_address`
!!! description "`AddressProvider.update_address(_id: uint256, _address: address):`"

    !!!guard "Guarded Methods"
        This function can only be called by the `admin` of the contract.

    Function to update the address of an ID.

    Emits: `EntryModified`

    | Input      | Type      | Description                  |
    | ---------- | --------- | ---------------------------- |
    | `_id`      | `uint256` | ID to change the address for |
    | `_address` | `address` | New address to change it to  |

    ??? quote "Source code"

        === "CurveAddressProvider.vy"

            ```vyper 
            event EntryModified:
                id: indexed(uint256)
                version: uint256

            check_id_exists: public(HashMap[uint256, bool])
            get_id_info: public(HashMap[uint256, AddressInfo])

            @external
            def update_address(_id: uint256, _address: address):
                """
                @notice Set a new address for an existing identifier
                @param _id Identifier to set the new address for
                @param _address Address to set
                """
                assert msg.sender == self.admin  # dev: admin-only function
                assert self.check_id_exists[_id]  # dev: id does not exist

                # Update address:
                self.get_id_info[_id].addr = _address

                # Update metadata (version, update time):
                self._update_entry_metadata(_id)

            @internal
            def _update_entry_metadata(_id: uint256):

                version: uint256 = self.get_id_info[_id].version + 1
                self.get_id_info[_id].version = version
                self.get_id_info[_id].last_modified = block.timestamp

                log EntryModified(_id, version)
            ```

    === "Example"
        ```shell
        >>> soon
        ```


### `update_description`
!!! description "`AddressProvider.update_description(_id: uint256, _description: String[256]):`"

    !!!guard "Guarded Methods"
        This function can only be called by the `admin` of the contract.

    Function to update the description of an ID.

    Emits: `EntryModified`

    | Input          | Type          | Description                      |    
    | -------------- | ------------- | -------------------------------- |
    | `_id`          | `uint256`     | ID to change the description for |
    | `_description` | `String[256]` | New description                  |

    ??? quote "Source code"

        === "CurveAddressProvider.vy"

            ```vyper 
            event EntryModified:
                id: indexed(uint256)
                version: uint256

            check_id_exists: public(HashMap[uint256, bool])
            get_id_info: public(HashMap[uint256, AddressInfo])

            @external
            def update_description(_id: uint256, _description: String[256]):
                """
                @notice Update description for an existing _id
                @param _id Identifier to set the new description for
                @param _description New description to set
                """
                assert msg.sender == self.admin  # dev: admin-only function
                assert self.check_id_exists[_id]  # dev: id does not exist

                # Update description:
                self.get_id_info[_id].description = _description

                # Update metadata (version, update time):
                self._update_entry_metadata(_id)

            @internal
            def _update_entry_metadata(_id: uint256):

                version: uint256 = self.get_id_info[_id].version + 1
                self.get_id_info[_id].version = version
                self.get_id_info[_id].last_modified = block.timestamp

                log EntryModified(_id, version)
            ```

    === "Example"
        ```shell
        >>> soon
        ```


### `add_new_id`
!!! description "`AddressProvider.add_new_id(_id: uint256, _address: address, _description: String[64]):`"

    !!!guard "Guarded Methods"
        This function can only be called by the `admin` of the contract.

    Function to add a new registry item to the AddressProvider. 

    Emits: `NewEntry`

    | Input              | Type         | Description                  |
    | ------------------ | ------------ | ---------------------------- |
    | `_id`              | `uint256`    | ID to add. Reverts if ID number is already used.       |
    | `_address`         | `address`    | New address                  |
    | `_description`     | `String[64]` | New description              |

    ??? quote "Source code"

        === "CurveAddressProvider.vy"

            ```vyper 
            event NewEntry:
                id: indexed(uint256)
                addr: address
                description: String[64]

            @external
            def add_new_id(
                _id: uint256,
                _address: address,
                _description: String[64],
            ):
                """
                @notice Enter a new registry item
                @param _id ID assigned to the address
                @param _address Address assigned to the ID
                @param _description Human-readable description of the ID
                """
                assert msg.sender == self.admin  # dev: admin-only function
                
                self._add_new_id(_id, _address, _description)

            @internal
            def _add_new_id(
                _id: uint256,
                _address: address,
                _description: String[64]
            ):

                assert not self.check_id_exists[_id]  # dev: id exists

                self.check_id_exists[_id] = True
                self._ids.append(_id)

                # Add entry:
                self.get_id_info[_id] = AddressInfo(
                    {
                        addr: _address,
                        description: _description,
                        version: 1,
                        last_modified: block.timestamp,
                    }
                )
                self.num_entries += 1

                log NewEntry(_id, _address, _description)
            ```

    === "Example"
        ```shell
        >>> soon
        ```


### `add_new_ids`
!!! description "`AddressProvider.add_new_ids(_ids: DynArray[uint256, 25], _addresses: DynArray[address, 25], _descriptions: DynArray[String[64], 25]):`"

    !!!guard "Guarded Methods"
        This function can only be called by the `admin` of the contract.

    Function to add mutiple new registry items to the AddressProvider at once.

    Emits: `NewEntry`

    | Input           | Type                       | Description                  |
    | --------------- | -------------------------- | ---------------------------- |
    | `_ids`          | `DynArray[uint256, 25]`    | IDs to add. Reverts if ID number is already used. |
    | `_addresss`     | `DynArray[address, 25]`    | ID addresses                 |
    | `_descriptions` | `DynArray[String[64], 25]` | ID descriptions              |

    ??? quote "Source code"

        === "CurveAddressProvider.vy"

            ```vyper 
            event NewEntry:
                id: indexed(uint256)
                addr: address
                description: String[64]

            @external
            def add_new_ids(
                _ids: DynArray[uint256, 25],
                _addresses: DynArray[address, 25],
                _descriptions: DynArray[String[64], 25],
            ):
                """
                @notice Enter new registry items
                @param _ids IDs assigned to addresses
                @param _addresses Addresses assigned to corresponding IDs
                @param _descriptions Human-readable description of each of the IDs
                """
                assert msg.sender == self.admin  # dev: admin-only function

                # Check lengths
                assert len(_ids) == len(_addresses) 
                assert len(_addresses) == len(_descriptions)

                for i in range(len(_ids), bound=20):
                    self._add_new_id(
                        _ids[i], 
                        _addresses[i], 
                        _descriptions[i]
                    )

            @internal
            def _add_new_id(
                _id: uint256,
                _address: address,
                _description: String[64]
            ):

                assert not self.check_id_exists[_id]  # dev: id exists

                self.check_id_exists[_id] = True
                self._ids.append(_id)

                # Add entry:
                self.get_id_info[_id] = AddressInfo(
                    {
                        addr: _address,
                        description: _description,
                        version: 1,
                        last_modified: block.timestamp,
                    }
                )
                self.num_entries += 1

                log NewEntry(_id, _address, _description)
            ```

    === "Example"
        ```shell
        >>> soon
        ```


### `remove_id`
!!! description "`AddressProvider.remove_id(_id: uint256) -> bool:`"

    !!!guard "Guarded Methods"
        This function can only be called by the `admin` of the contract.

    Function to remove a registry item from the AddressProvider.

    Returns: true (`bool`).

    Emits: `EntryRemoved`

    | Input | Type      | Description   |
    | ----- | --------- | ------------- |
    | `_id` | `uint256` | ID to remove. |

    ??? quote "Source code"

        === "CurveAddressProvider.vy"

            ```vyper 
            event EntryRemoved:
                id: indexed(uint256)

            @external
            def remove_id(_id: uint256) -> bool:
                """
                @notice Unset an existing identifier
                @param _id Identifier to unset
                @return bool success
                """
                assert msg.sender == self.admin  # dev: admin-only function

                return self._remove_id(_id)

            @internal
            def _remove_id(_id: uint256) -> bool:
                
                assert self.check_id_exists[_id]  # dev: id does not exist

                # Clear ID:
                self.get_id_info[_id].addr = empty(address)
                self.get_id_info[_id].last_modified = 0
                self.get_id_info[_id].description = ''
                self.get_id_info[_id].version = 0

                self.check_id_exists[_id] = False

                # Reduce num entries:
                self.num_entries -= 1

                # Emit 0 in version to notify removal of id:
                log EntryRemoved(_id)

                return True
            ```

    === "Example"
        ```shell
        >>> soon
        ```


### `remove_ids`
!!! description "`AddressProvider.remove_ids(_ids: DynArray[uint256, 20]) -> bool:`"

    !!!guard "Guarded Methods"
        This function can only be called by the `admin` of the contract.

    Function to remove mutiple registry items from the AddressProvider at once.

    Returns: true (`bool`).

    Emits: `EntryRemoved`

    | Input  | Type                    | Description    |
    | ------ | ----------------------- | -------------- |
    | `_ids` | `DynArray[uint256, 20]` | IDs to remove. |

    ??? quote "Source code"

        === "CurveAddressProvider.vy"

            ```vyper 
            event EntryRemoved:
                id: indexed(uint256)

            @external
            def remove_ids(_ids: DynArray[uint256, 20]) -> bool:
                """
                @notice Unset existing identifiers
                @param _id DynArray of identifier to unset
                @return bool success
                """
                assert msg.sender == self.admin  # dev: admin-only function

                for _id in _ids:
                    assert self._remove_id(_id)

                return True

            @internal
            def _remove_id(_id: uint256) -> bool:
                
                assert self.check_id_exists[_id]  # dev: id does not exist

                # Clear ID:
                self.get_id_info[_id].addr = empty(address)
                self.get_id_info[_id].last_modified = 0
                self.get_id_info[_id].description = ''
                self.get_id_info[_id].version = 0

                self.check_id_exists[_id] = False

                # Reduce num entries:
                self.num_entries -= 1

                # Emit 0 in version to notify removal of id:
                log EntryRemoved(_id)

                return True
            ```

    === "Example"
        ```shell
        >>> soon
        ```
