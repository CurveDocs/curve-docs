# Code template:

### `Contract.method_name`

!!! description "`Contract.method_name(input: type) → output_type: scope`"

    Description of the contract method. Returns: whatever contract returns.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `input` |  `type` | Contract input |

    Emits: <mark style="background-color: #FFD580; color: black">SomeLog</mark>

    ??? quote "Source code"

        ```python
        some_python_code_here
        ```

    === "Example"

        ```shell
        >>> some shell scripts in brownie that show how the method works
        ```


    !!! note

        All notes go to the bottom of the list


!!! description "`PoolProxy.unkill_me(_pool: address):`"

    Function to unpause the pool `_pool`, re-enabling all functionality.

    !!!note 
        This function can either be called by the emergency or ownership admin.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_pool` |  `address` | Pool address |


    ??? quote "Source code"

        === "Contract Name 1"

            ```python hl_lines="4 21"
            code here
            ```

        === "Contract Name 2"

            ```python hl_lines="2"
            code here
            ```

    === "Example"
        ```shell
        >>> PoolProxy.unkill_me(_pool: address):
        todo
        ```


# **Custom Admonitions**

!!!guard "Guarded Method"
    This function is only callable by the `admin` of the contract.

!!!deploy "Contract Source & Deployment"
    **Curve DAO Token** contract is deployed to the Ethereum mainnet at: [0xD533a949740bb3306d119CC777fa900bA034cd52](https://etherscan.io/address/0xD533a949740bb3306d119CC777fa900bA034cd52#code).
    Source code available on [Github](https://github.com/curvefi/curve-dao-contracts/blob/567927551903f71ce5a73049e077be87111963cc/contracts/ERC20CRV.vy).

 

# admonitions

### `set_name`
!!! description "`CRV.set_name(_name: String[64], _symbol: String[32]):`"

    !!!guard "Guarded Methods"
        This function can only be called by the `admin` of the contract.

    Function to change token name to `_name` and token symbol to `_symbol`.

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