<h1>Curve DAO Token: Admin Controls</h1>

The **controls within the Curve DAO Token are strictly limited**. The admin of the contract can only modify the `name`, `admin`, or `minter`. Since the [**CurveOwnershipAgent**](https://etherscan.io/address/0x40907540d8a6C65c637785e8f8B742ae6b0b9968) is the current admin of the contract, any changes to these parameters would require a successfully passed DAO vote.

## **Admin Ownership**

### `set_admin`
!!! description "`CRV.set_admin(_admin: address):`"

    !!!guard "Guarded Method"
        This function is only callable by the `admin` of the contract.

    Function to set/change the admin of the contract.

    Emits: `SetAdmin`

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_admin` |  `address` | New Admin Address |

    ??? quote "Source code"

        ```vyper
        event SetAdmin:
            admin: address
        
        admin: public(address)

        @external
        def set_admin(_admin: address):
            """
            @notice Set the new admin.
            @dev After all is set up, admin only can change the token name
            @param _admin New admin address
            """
            assert msg.sender == self.admin  # dev: admin only
            self.admin = _admin
            log SetAdmin(_admin)
        ```

    === "Example"
        ```shell
        >>> CRV.set_admin("0x0000000000000000000000000000000000000000")
        ```

## **Changing Name and Symbol**

### `set_name`
!!! description "`CRV.set_name(_name: String[64], _symbol: String[32]):`"

    !!!guard "Guarded Method"
        This function is only callable by the `admin` of the contract.

    Function to change the token name symbol.

    ??? quote "Source code"

        ```vyper
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
        >>> CRV.set_name("LLAMA TOKEN", "LT")
        ```


## **Minter**

`set_minter` is technically an admin-only function. However, there's **no actual way to change the minter** of the contract using this function, because the code checks if the current minter is set to `ZERO_ADDRESS`, which was only true when the contract was initially deployed.

### `set_minter`
!!! description "`CRV.set_minter(_minter: address):`"

    !!!guard "Guarded Method"
        This function is only callable by the `admin` of the contract.

    Function to set the minter contract for the token.

    Emits: `SetMinter`

    ??? quote "Source code"

        ```vyper
        event SetMinter:
            minter: address
        
        minter: public(address)

        @external
        def set_minter(_minter: address):
            """
            @notice Set the minter address
            @dev Only callable once, when minter has not yet been set
            @param _minter Address of the minter
            """
            assert msg.sender == self.admin  # dev: admin only
            assert self.minter == ZERO_ADDRESS  # dev: can set the minter only once, at creation
            self.minter = _minter
            log SetMinter(_minter)
        ```

    === "Example"
        ```shell
        >>> CRV.set_minter("0xd061D61a4d941c39E5453435B6345Dc261C2fcE0")
        ```