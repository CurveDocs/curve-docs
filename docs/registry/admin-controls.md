<h1>MetaRegistry: Admin Controls </h1>

The following methods are guarded and may only be called by the [**`owner`**](./MetaRegistryAPI.md#owner) of the MetaRegistry.

### `add_registry_handler`
!!! description "`MetaRegistry.add_registry_handler(_registry_handler: address):`"
 
    !!!guard "Guarded Method"
        This function is only callable by the `owner` of the contract.

    Function to add a registry handler to the MetaRegistry.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_registry_handler` |  `address` | RegistryHandler address to add |

    ??? quote "Source code"

        ```vyper
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

    !!!guard "Guarded Method"
        This function is only callable by the `owner` of the contract.

    Function to update the registry handler for a registry.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_index` |  `uint256` | index of registry according to `get_registry` |
    | `registry_handler` |  `address` | address of the new handler contract |

    ??? quote "Source code"

        ```vyper
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