The Minter contract in Curve Finance is responsible for the issuance and distribution of the CRV (Curve's governance token) to liquidity providers. It acts as a mechanism to reward users who provide liquidity to Curve's pools. The Minter contract calculates the amount of CRV tokens to be allocated based on various factors such as the duration and amount of liquidity provided. By incentivizing liquidity provision, the Minter contract promotes the growth and sustainability of the Curve ecosystem.

!!! info
    **`Minter`** contract is deployed to the Ethereum mainnet at: [0xd061D61a4d941c39E5453435B6345Dc261C2fcE0](https://etherscan.io/address/0xd061D61a4d941c39E5453435B6345Dc261C2fcE0#code)  
    Source code of the VotingEscrow contract can be found on [Github](https://github.com/curvefi/curve-dao-contracts/blob/master/contracts/Minter.vy).

!!!warning
    This is a fixed address. The contract cannot be swapped out or upgraded.

## **Minting CRV**

### `mint`
!!! description "`Minter.mint(gauge_addr: address)`"

    Function to mint allocated tokens for the caller based on a single gauge.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `gauge_addr` |  `address` | Gauge address to get mintable amount from |

    ??? quote "Source code"

        ```python hl_lines="1 7 18 23"
        event Minted:
            recipient: indexed(address)
            gauge: address
            minted: uint256

        @internal
        def _mint_for(gauge_addr: address, _for: address):
            assert GaugeController(self.controller).gauge_types(gauge_addr) >= 0  # dev: gauge is not added

            LiquidityGauge(gauge_addr).user_checkpoint(_for)
            total_mint: uint256 = LiquidityGauge(gauge_addr).integrate_fraction(_for)
            to_mint: uint256 = total_mint - self.minted[_for][gauge_addr]

            if to_mint != 0:
                MERC20(self.token).mint(_for, to_mint)
                self.minted[_for][gauge_addr] = total_mint

                log Minted(_for, gauge_addr, total_mint)


        @external
        @nonreentrant('lock')
        def mint(gauge_addr: address):
            """
            @notice Mint everything which belongs to `msg.sender` and send to them
            @param gauge_addr `LiquidityGauge` address to get mintable amount from
            """
            self._mint_for(gauge_addr, msg.sender)
        ```

    === "Example"
        
        ```shell
        >>> Minter.mint(todo)
        'todo'
        ```

### `mint_many`
!!! description "`Minter.mint_many(gauge_addrs: address[8])`"

    Function to mint CRV for the caller from multiple gauges.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `gauge_addrs` |  `address` | List of Gauge Addresses to mint from|

    !!!note
        If you wish to mint from less than eight gauges, leave the remaining array entries as `ZERO_ADDRESS`.

    ??? quote "Source code"

        ```python hl_lines="1 7 18 22"
        event Minted:
            recipient: indexed(address)
            gauge: address
            minted: uint256

        @internal
        def _mint_for(gauge_addr: address, _for: address):
            assert GaugeController(self.controller).gauge_types(gauge_addr) >= 0  # dev: gauge is not added

            LiquidityGauge(gauge_addr).user_checkpoint(_for)
            total_mint: uint256 = LiquidityGauge(gauge_addr).integrate_fraction(_for)
            to_mint: uint256 = total_mint - self.minted[_for][gauge_addr]

            if to_mint != 0:
                MERC20(self.token).mint(_for, to_mint)
                self.minted[_for][gauge_addr] = total_mint

                log Minted(_for, gauge_addr, total_mint)

        @external
        @nonreentrant('lock')
        def mint_many(gauge_addrs: address[8]):
            """
            @notice Mint everything which belongs to `msg.sender` across multiple gauges
            @param gauge_addrs List of `LiquidityGauge` addresses
            """
            for i in range(8):
                if gauge_addrs[i] == ZERO_ADDRESS:
                    break
                self._mint_for(gauge_addrs[i], msg.sender)
        ```

    === "Example"
        ```shell
        >>> Minter.mint_many(todo)
        'todo'
        ```


### `mint_for`
!!! description "`Minter.mint_for(gauge_addr: address, _for: address)`"

    Function to mint tokens from a different address.
    
    !!!note
        In order to call this function, the caller must have been previously approved by `for` using [`toggle_approve_mint`](#toggle_approve_mint).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `gauge_addr` |  `address` | Gauge Addresses to get mintable amount from |
    | `_for` |  `address` | Addresses to mint for |

    ??? quote "Source code"

        ```python hl_lines="1 7 18 23"
        event Minted:
            recipient: indexed(address)
            gauge: address
            minted: uint256

        @internal
        def _mint_for(gauge_addr: address, _for: address):
            assert GaugeController(self.controller).gauge_types(gauge_addr) >= 0  # dev: gauge is not added

            LiquidityGauge(gauge_addr).user_checkpoint(_for)
            total_mint: uint256 = LiquidityGauge(gauge_addr).integrate_fraction(_for)
            to_mint: uint256 = total_mint - self.minted[_for][gauge_addr]

            if to_mint != 0:
                MERC20(self.token).mint(_for, to_mint)
                self.minted[_for][gauge_addr] = total_mint

                log Minted(_for, gauge_addr, total_mint)


        @external
        @nonreentrant('lock')
        def mint_for(gauge_addr: address, _for: address):
            """
            @notice Mint tokens for `_for`
            @dev Only possible when `msg.sender` has been approved via `toggle_approve_mint`
            @param gauge_addr `LiquidityGauge` address to get mintable amount from
            @param _for Address to mint to
            """
            if self.allowed_to_mint_for[msg.sender][_for]:
                self._mint_for(gauge_addr, _for)
        ```

    === "Example"
        ```shell
        >>> Minter.mint_for(todo)
        'todo'
        ```


### `toggle_approve_mint`
!!! description "`Minter.toggle_approve_mint(minting_user: address)`"

    Function to toggle approval for `minting_user` to mint CRV on behalf of the caller.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `minting_user` |  `address` | Address to toggle permission for |

    ??? quote "Source code"

        ```python hl_lines="1 7 18 23"
        @external
        def toggle_approve_mint(minting_user: address):
            """
            @notice allow `minting_user` to mint for `msg.sender`
            @param minting_user Address to toggle permission for
            """
            self.allowed_to_mint_for[minting_user][msg.sender] = not self.allowed_to_mint_for[minting_user][msg.sender]
        ```

    === "Example"
        ```shell
        >>> Minter.toggle_approve_mint(todo)
        'what to put here'
        ```


### `allowed_to_mint_for`
!!! description "`Minter.allowed_to_mint_for(arg0: address, arg1: address) -> bool: view`"

    Getter method to check if `minter` has been approved to call [`mint_for`](#mint_for) on behalf of `for`.

    Returns: `bool`.


    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `arg0` |  `address` | Address |
    | `arg1` |  `address` | Address |

    ??? quote "Source code"

        ```python hl_lines="1 9"
        allowed_to_mint_for: public(HashMap[address, HashMap[address, bool]])

        @external
        def toggle_approve_mint(minting_user: address):
            """
            @notice allow `minting_user` to mint for `msg.sender`
            @param minting_user Address to toggle permission for
            """
            self.allowed_to_mint_for[minting_user][msg.sender] = not self.allowed_to_mint_for[minting_user][msg.sender]
        ```

    === "Example"
        ```shell
        >>> Minter.allowed_to_mint_for(0x989AEb4d175e16225E39E87d0D97A3360524AD80, 0xF147b8125d2ef93FB6965Db97D6746952a133934)
        'false'
        ```



## **Querying Basic Data**

### `token`
!!! description "`Minter.token() -> address: view`"

    Getter for the token address of Curve DAO Token.

    Returns: `address` of the **Curve DAO Token**.

    ??? quote "Source code"

        ```python hl_lines="1 4 5"
        token: public(address)

        @external
        def __init__(_token: address, _controller: address):
            self.token = _token
            self.controller = _controller
        ```

    === "Example"
        ```shell
        >>> Minter.token()
        '0xD533a949740bb3306d119CC777fa900bA034cd52'
        ```


### `controller`
!!! description "`Minter.controller() -> address: view`"

    Getter for the address of the Controller.

    Returns: `address` of the **Controller**.

    ??? quote "Source code"

        ```python hl_lines="1 4 6"
        controller: public(address)

        @external
        def __init__(_token: address, _controller: address):
            self.token = _token
            self.controller = _controller
        ```

    === "Example"
        ```shell
        >>> Minter.controller()
        '0x2F50D538606Fa9EDD2B11E2446BEb18C9D5846bB'
        ```


### `minted`
!!! description "`Minter.minted(arg0: address, arg1: address) -> uint256: view`"

    Getter for the total amount of CRV minted from a specific gauge address by an address.

    Returns: **amount of CRV minted** (`uint256`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `arg0` |  `address` | Wallet Address |
    | `arg1` |  `address` | Gauge Address |

    ??? quote "Source code"

        ```python hl_lines="1 6"
        event Minted:
            recipient: indexed(address)
            gauge: address
            minted: uint256

        minted: public(HashMap[address, HashMap[address, uint256]])
        ```

    === "Example"
        ```shell
        >>> Minter.minted(0x989AEb4d175e16225E39E87d0D97A3360524AD80, 0xe5d5aa1bbe72f68df42432813485ca1fc998de32)
        1296598989597451358023782
        ```