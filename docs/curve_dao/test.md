!!!guard "Guarded Method"
    This function is only callable by the `admin` of the contract.

!!!guard1 "Guarded Method"
    This function is only callable by the `admin` of the contract.

!!!guard2 "Guarded Method"
    This function is only callable by the `admin` of the contract.

!!!guard3 "Guarded Method"
    This function is only callable by the `admin` of the contract.

!!!warning "Guarded Method"
    This function is only callable by the `admin` of the contract.






## example

### `set_name`
!!! description "`CRV.set_name(_name: String[64], _symbol: String[32]):`"

    Function to change token name to `_name` and token symbol to `_symbol`.

    !!!guard3 "Guarded Methods"
        This function can only be called by the `admin` of the contract.

    ??? quote "Source code"

        ```python hl_lines="1 2 5"
        name: public(String[64])
        symbol: public(String[32])

        @external
        def set_name(_name: String[64], _symbol: String[32]):
            """
            @notice Change the token name and symbol to `_name` and `_symbol`
            @dev Only callable by the admin account
            @param _name New token name
            @param _symbol New token symbol
            """
            assert msg.sender == self.admin, "Only admin is allowed to change name"
            self.name = _name
            self.symbol = _symbol
        ```

    === "Example"
        ```shell
        >>> CRV.set_name('todo)
        'todo'
        ```