The following are methods that may only be called by the owner of the contract.

### `add_registry_handler`
!!! description "`MetaRegistry.add_registry_handler(_registry_handler: address):`"

    Function to add a registry handler.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_registry_handler` |  `address` | Registry Handler Address |

    ??? quote "Source code"

        ```python hl_lines="2 9 12"
        @external
        def add_registry_handler(_registry_handler: address):
            """
            @notice Adds a registry from the address provider entry
            @param _registry_handler Address of the handler contract
            """
            assert msg.sender == self.owner  # dev: only owner

            self._update_single_registry(self.registry_length, _registry_handler)

        @internal
        def _update_single_registry(_index: uint256, _registry_handler: address):
            assert _index <= self.registry_length

            if _index == self.registry_length:
                self.registry_length += 1

            self.get_registry[_index] = _registry_handler
        ```

    === "Example"
        ```shell
        >>> MetaRegistry.add_registry_handler("registry handler address")
        ```


### `update_registry_handler`
!!! description "`MetaRegistry.update_registry_handler(_index: uint256, _registry_handler: address):`"

    Function to update the registry handler for a registry.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_index` |  `uint256` | Index of Registry according to `get_registry` |
    | `registry_handler` |  `address` | Address of the new handler contract |

    ??? quote "Source code"

        ```python hl_lines="3"
        @external
        def update_registry_handler(_index: uint256, _registry_handler: address):
            """
            @notice Updates the contract used to handle a registry
            @param _index The index of the registry in get_registry
            @param _registry_handler Address of the new handler contract
            """
            assert msg.sender == self.owner  # dev: only owner
            assert _index < self.registry_length

            self._update_single_registry(_index, _registry_handler)

        @internal
        def _update_single_registry(_index: uint256, _registry_handler: address):
            assert _index <= self.registry_length

            if _index == self.registry_length:
                self.registry_length += 1

            self.get_registry[_index] = _registry_handler
        ```

    === "Example"
        ```shell
        >>> MetaRegistry.update_registry_handler(0, "new handler contract")
        ```


### `owner`
!!! description "`MetaRegistry.owner() -> address:`"

    Getter for the owner of the contract.

    Returns: owner (`address`).

    ??? quote "Source code"

        ```python hl_lines="1 6"
        owner: public(address)

        @external
        def __init__(_address_provider: address):
            self.address_provider = AddressProvider(_address_provider)
            self.owner = AddressProvider(_address_provider).admin()
        ```

    === "Example"
        ```shell
        >>> MetaRegistry.owner()
        '0xEdf2C58E16Cc606Da1977e79E1e69e79C54fe242'
        ```