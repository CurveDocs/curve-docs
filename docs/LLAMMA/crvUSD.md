!!! info
    The crvUSD contract is deployed to the Ethereum mainnet at: [0xf939E0A03FB07F59A73314E73794Be0E57ac1b4E](https://etherscan.io/address/0xf939E0A03FB07F59A73314E73794Be0E57ac1b4E).  
    Source code for this contract is available on [Github](https://github.com/curvefi/curve-stablecoin/blob/master/contracts/Stablecoin.vy). 

!!! warning
    Due to some testing in production, there have been several deployments for the stablecoin and its components. Please always make sure you are using the latest deployment. See [here](https://github.com/curvefi/curve-stablecoin/blob/master/deployment-logs/mainnet.log).



## **Contract Info Methods**
### `decimals`
!!! description "`crvUSD.decimals() -> uint8: view`"

    Getter for the decimals of the token.

    Returns: decimals (`uint8`) of the token. 

    ??? quote "Source code"

        ```python hl_lines="1"
        decimals: public(constant(uint8)) = 18
        ```

    === "Example"
        ```shell
        >>> crvUSD.decimals()
        18
        ```


### `version`
!!! description "`crvUSD.version() -> String[8]: view`"

    Getter of the version of the contract.

    Returns: **version** (`uint256`) of the token. 

    ??? quote "Source code"

        ```python hl_lines="1"
        version: public(constant(String[8])) = "v1.0.0"
        ```

    === "Example"
        ```shell
        >>> crvUSD.version()
        'v1.0.0'
        ```


### `name`
!!! description "`crvUSD.name() -> String[64]: view`"

    Getter for the name of the token.

    Returns: name (`String[64]`) of the token.

    ??? quote "Source code"

        ```python hl_lines="1 4 5"
        name: public(immutable(String[64]))
        
        @external
        def __init__(_name: String[64], _symbol: String[32]):
            name = _name
            symbol = _symbol

            NAME_HASH = keccak256(_name)
            CACHED_CHAIN_ID = chain.id
            salt = block.prevhash
            CACHED_DOMAIN_SEPARATOR = keccak256(
                _abi_encode(
                    EIP712_TYPEHASH,
                    keccak256(_name),
                    VERSION_HASH,
                    chain.id,
                    self,
                    block.prevhash,
                )
            )

            self.minter = msg.sender
            log SetMinter(msg.sender)
        ```

    === "Example"
        ```shell
        >>> crvUSD.name()
        'Curve.Fi USD Stablecoin'
        ```


### `symbol`
!!! description "`crvUSD.symbol() -> String[32]: view`"

    Getter for the symbol of the token.

    Returns: symbol (`String[32]`) of the token.

    ??? quote "Source code"

        ```python hl_lines="1 4 6"
        symbol: public(immutable(String[32]))
        
        @external
        def __init__(_name: String[64], _symbol: String[32]):
            name = _name
            symbol = _symbol

            NAME_HASH = keccak256(_name)
            CACHED_CHAIN_ID = chain.id
            salt = block.prevhash
            CACHED_DOMAIN_SEPARATOR = keccak256(
                _abi_encode(
                    EIP712_TYPEHASH,
                    keccak256(_name),
                    VERSION_HASH,
                    chain.id,
                    self,
                    block.prevhash,
                )
            )

            self.minter = msg.sender
            log SetMinter(msg.sender)
        ```

    === "Example"
        ```shell
        >>> crvUSD.symbol()
        'crvUSD'
        ```


### `balanceOf`
!!! description "`crvUSD.balanceOf(arg0: address) -> uint256: view`"

    Getter for the balance of crvUSD for an address.

    Returns: amount (`uint256`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `arg0` |  `address` | Address to check balance for |

    ??? quote "Source code"

        ```python hl_lines="1"
        balanceOf: public(HashMap[address, uint256])
        ```

    === "Example"
        ```shell
        >>> crvUSD.balanceOf("0x844Dc85EdD8492A56228D293cfEbb823EF3E10EC")
        1002155725613742880120968
        ```


### `totalSupply`
!!! description "`crvUSD.totalSupply() -> uint256: view`"

    Getter for the total supply of crvUSD.

    Returns: total supply (`uint256`).

    ??? quote "Source code"

        ```python hl_lines="1"
        totalSupply: public(uint256)
        ```

    === "Example"
        ```shell
        >>> crvUSD.totalSupply()
        260000000000000000000000000
        ```


## **Mint and Burn**

- crvUSD can only be minted by the `minter` of the contract, which is the [Factory](/curve-docs/docs/LLAMMA/factory.md)
- crvUSD is minted in accordance with the debt_ceiling, either when **adding a new market** or when **raising its debt ceiling**
- This is accomplished by calling the `set_new_debt_ceiling` function within the Factory contract.  
- Burning crvUSD typically occurs when a lower debt ceiling is set, or if a user decides to burn their crvUSD for any reason.


### `minter`
!!! description "`crvUSD.minter() -> address: view`"

    Getter for the minter contract of crvUSD.

    Returns: minter `address`.

    ??? quote "Source code"

        ```python hl_lines="2 4"
        event SetMinter:
            minter: indexed(address)

        minter: public(address)
        ```

    === "Example"
        ```shell
        >>> crvUSD.minter()
        '0xC9332fdCB1C491Dcc683bAe86Fe3cb70360738BC'
        ```


### `mint`
!!! description "`crvUSD.mint(_to: address, _value: uint256) -> bool:`"

    Function to mint `_value` amount of tokens to `_to`.

    Returns: true or flase (`boolean`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_to` |  `address` | Address newly minted tokens are credited to |
    | `_value` |  `uint256` | Amount of tokens to mint |

    ??? quote "Source code"

        ```python hl_lines="1 7 20"
        event Transfer:
            sender: indexed(address)
            receiver: indexed(address)
            value: uint256

        @external
        def mint(_to: address, _value: uint256) -> bool:
            """
            @notice Mint `_value` amount of tokens to `_to`.
            @dev Only callable by an account with minter privileges.
            @param _to The account newly minted tokens are credited to.
            @param _value The amount of tokens to mint.
            """
            assert msg.sender == self.minter
            assert _to not in [self, empty(address)]

            self.balanceOf[_to] += _value
            self.totalSupply += _value

            log Transfer(empty(address), _to, _value)
            return True
        ```

    === "Example"
        ```shell
        >>> crvUSD.mint(todo)
        todo
        ```


### `set_minter`
!!! description "`crvUSD.set_minter(_minter: address):`"

    Function to set the minter address of the token.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_minter` |  `address` | Minter address |

    ??? quote "Source code"

        ```python hl_lines="1 4 7 10 11"
        event SetMinter:
            minter: indexed(address)

        minter: public(address)

        @external
        def set_minter(_minter: address):
            assert msg.sender == self.minter

            self.minter = _minter
            log SetMinter(_minter)
        ```

    !!!note 
        The minter address can only be set by the minter itself. For that reason the minter address was set to the deployer's address at the time of deployment and was then set to the actual minter address ([Transaction](https://etherscan.io/tx/0xf2a117bf688b7bf2d719cc7d047feadbc3e9fd8fbcb6ed397c3e9f85598b60cd#eventlog)). 

    === "Example"
        ```shell
        >>> crvUSD.set_minter(todo)
        ```


### `burn` 
!!! description "`crvUSD.burn(_value: uint256) -> bool:`"

    Function to burn `_value` amount of tokens.

    Returns: true or flase (`boolean`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_value` |  `uint256` | Amount of tokens to burn |

    ??? quote "Source code"

        ```python hl_lines="1 7 11 14"
        event Transfer:
            sender: indexed(address)
            receiver: indexed(address)
            value: uint256

        @internal
        def _burn(_from: address, _value: uint256):
            self.balanceOf[_from] -= _value
            self.totalSupply -= _value

            log Transfer(_from, empty(address), _value)

        @external
        def burn(_value: uint256) -> bool:
            """
            @notice Burn `_value` amount of tokens.
            @param _value The amount of tokens to burn.
            """
            self._burn(msg.sender, _value)
            return True
        ```

    === "Example"
        ```shell
        >>> crvUSD.burn(todo)
        todo
        ```


### `burnFrom`
!!! description "`crvUSD.burnFrom(_from: address, _value: uint256) -> bool:`"

    Function to burn `_value` amount of tokens from `_from`.

    Returns: true or false (`boolean`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_from` |  `address` | Address to burn tokens for |
    | `_value` |  `uint256` | Amount of tokens to burn |

    ??? quote "Source code"

        ```python hl_lines="1 7 11 14"
        event Transfer:
            sender: indexed(address)
            receiver: indexed(address)
            value: uint256

        @internal
        def _burn(_from: address, _value: uint256):
            self.balanceOf[_from] -= _value
            self.totalSupply -= _value

            log Transfer(_from, empty(address), _value)

        @external
        def burnFrom(_from: address, _value: uint256) -> bool:
            """
            @notice Burn `_value` amount of tokens from `_from`.
            @dev The caller must have previously been given an allowance by `_from`.
            @param _from The account to burn the tokens from.
            @param _value The amount of tokens to burn.
            """
            allowance: uint256 = self.allowance[_from][msg.sender]
            if allowance != max_value(uint256):
                self._approve(_from, msg.sender, allowance - _value)

            self._burn(_from, _value)
            return True
        ```

    !!!note
        Calling this function on behalf of another address requires [`allowance`](#allowance).

    === "Example"
        ```shell
        >>> crvUSD.burn(todo)
        todo
        ```


## **Allowances**
### `approve`
!!! description "`crvUSD.approve(_spender: address, _value: uint256) -> bool:`"

    Fucntion to allow `_spender` to transfer up to `_value` amount of tokens from the caller's amount.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_spender` |  `address` | Address permitted to spend up to `_value` amount of caller's funds |
    | `_value` |  `address` | Amount of tokens `_spender` is allowed to spend |

    ??? quote "Source code"

        ```python hl_lines="1 7 10 13 22"
        event Approval:
            owner: indexed(address)
            spender: indexed(address)
            value: uint256

        @internal
        def _approve(_owner: address, _spender: address, _value: uint256):
            self.allowance[_owner][_spender] = _value

            log Approval(_owner, _spender, _value)

        @external
        def approve(_spender: address, _value: uint256) -> bool:
            """
            @notice Allow `_spender` to transfer up to `_value` amount of tokens from the caller's account.
            @dev Non-zero to non-zero approvals are allowed, but should be used cautiously. The methods
                increaseAllowance + decreaseAllowance are available to prevent any front-running that
                may occur.
            @param _spender The account permitted to spend up to `_value` amount of caller's funds.
            @param _value The amount of tokens `_spender` is allowed to spend.
            """
            self._approve(msg.sender, _spender, _value)
            return True
        ```

    === "Example"
        ```shell
        >>> crvUSD.approve(todo)
        todo
        ```


### `allowance`
!!! description "`crvUSD.allowance(arg0: address, arg1: address) -> uint256`"

    Getter to check the allowance.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `arg0` |  `address` | todo |
    | `arg1` |  `address` | todo |

    ??? quote "Source code"

        ```python hl_lines="1 7 11"
        allowance: public(HashMap[address, HashMap[address, uint256]])
        ```

    === "Example"
        ```shell
        >>> crvUSD.set_minter(todo)
        ```


### `increaseAllowance`
!!! description "`crvUSD.increaseAllowance(_spender: address, _add_value: uint256) -> bool:`"

    Function to increase the allowance granted to `_spender`.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_spender` |  `address` | Address to increase the allowance of |
    | `_add_value` |  `uint256` | Amount to increase the allwance by |

    ??? quote "Source code"

        ```python hl_lines="2"
        @external
        def increaseAllowance(_spender: address, _add_value: uint256) -> bool:
            """
            @notice Increase the allowance granted to `_spender`.
            @dev This function will never overflow, and instead will bound
                allowance to MAX_UINT256. This has the potential to grant an
                infinite approval.
            @param _spender The account to increase the allowance of.
            @param _add_value The amount to increase the allowance by.
            """
            cached_allowance: uint256 = self.allowance[msg.sender][_spender]
            allowance: uint256 = unsafe_add(cached_allowance, _add_value)

            # check for an overflow
            if allowance < cached_allowance:
                allowance = max_value(uint256)

            if allowance != cached_allowance:
                self._approve(msg.sender, _spender, allowance)

            return True
        ```

    !!!note
        This function will never overflow, and instead will bound allowance to MAX_UINT256. This has the potential to grant an infinite approval.

    === "Example"
        ```shell
        >>> crvUSD.increaseAllowance(todo)
        ```


### `decreaseAllowance`
!!! description "`crvUSD.decreaseAllowance(_spender: address, _sub_value: uint256) -> bool:`"

    Function to decrease the allowance granted to `_spender`.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_spender` |  `address` | Address to decrease the allowance of |
    | `_sub_value` |  `uint256` | Amount to decrease the allwance by |

    ??? quote "Source code"

        ```python hl_lines="2"
        @external
        def decreaseAllowance(_spender: address, _sub_value: uint256) -> bool:
            """
            @notice Decrease the allowance granted to `_spender`.
            @dev This function will never underflow, and instead will bound
                allowance to 0.
            @param _spender The account to decrease the allowance of.
            @param _sub_value The amount to decrease the allowance by.
            """
            cached_allowance: uint256 = self.allowance[msg.sender][_spender]
            allowance: uint256 = unsafe_sub(cached_allowance, _sub_value)

            # check for an underflow
            if cached_allowance < allowance:
                allowance = 0

            if allowance != cached_allowance:
                self._approve(msg.sender, _spender, allowance)

            return True
        ```

    !!!note
        This function will never underflow, and instead will bound allowance to 0.

    === "Example"
        ```shell
        >>> crvUSD.decreaseAllowance(todo)
        ```


### `permit`
!!! description "`crvUSD.permit(_owner: address, _spender: address, _value: uint256, _deadline: uint256, _v: uint8,, _r: bytes32, _s: bytes32) -> bool:`"

    Function to permit `_spender` to spend up to `_value` amount of `_owner`'s tokens via a signature.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_owner` |  `address` | Address which generated the signature and is granting an allowance |
    | `_spender` |  `uint256` | Address which will be granted an allowance |
    | `_value` |  `uint256` | Approved amount |
    | `_deadline` |  `uint256` | Deadline by which the signature must be submitted |
    | `_v` |  `uint256` | Last byte of the ECDSA signature |
    | `_r` |  `uint256` | First 32 bytes of the ECDSA signature |
    | `_s` |  `uint256` | Second 32 bytes of the ECDSA signature |

    !!!note
        In the event of a chain fork, replay attacks are prevented as domain separator is recalculated.     
        However, this is only if the resulting chains update their chainId.

    ??? quote "Source code"

        ```python hl_lines="2"
        @external
        def permit(
            _owner: address,
            _spender: address,
            _value: uint256,
            _deadline: uint256,
            _v: uint8,
            _r: bytes32,
            _s: bytes32,
        ) -> bool:
            """
            @notice Permit `_spender` to spend up to `_value` amount of `_owner`'s tokens via a signature.
            @dev In the event of a chain fork, replay attacks are prevented as domain separator is recalculated.
                However, this is only if the resulting chains update their chainId.
            @param _owner The account which generated the signature and is granting an allowance.
            @param _spender The account which will be granted an allowance.
            @param _value The approval amount.
            @param _deadline The deadline by which the signature must be submitted.
            @param _v The last byte of the ECDSA signature.
            @param _r The first 32 bytes of the ECDSA signature.
            @param _s The second 32 bytes of the ECDSA signature.
            """
            assert _owner != empty(address) and block.timestamp <= _deadline

            nonce: uint256 = self.nonces[_owner]
            digest: bytes32 = keccak256(
                concat(
                    b"\x19\x01",
                    self._domain_separator(),
                    keccak256(_abi_encode(EIP2612_TYPEHASH, _owner, _spender, _value, nonce, _deadline)),
                )
            )

            if _owner.is_contract:
                sig: Bytes[65] = concat(_abi_encode(_r, _s), slice(convert(_v, bytes32), 31, 1))
                assert ERC1271(_owner).isValidSignature(digest, sig) == ERC1271_MAGIC_VAL
            else:
                assert ecrecover(digest, _v, _r, _s) == _owner

            self.nonces[_owner] = nonce + 1
            self._approve(_owner, _spender, _value)
            return True
        ```

    === "Example"
        ```shell
        >>> crvUSD.permit(todo)
        todo
        ```
