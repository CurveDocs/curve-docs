## Token Methods

### `CurveToken.name`

!!! description "CurveToken.name() → string[64]: view"

    Get token name.

    ??? quote "Source code"

        ```vyper hl_lines="1 8"
        name: public(string[64])

        ...

        @public
        def __init__(_name: string[64], _symbol: string[32], _decimals: uint256, _supply: uint256):
            init_supply: uint256 = _supply * 10 ** _decimals
            self.name = _name
            self.symbol = _symbol
            self.decimals = _decimals
            self.balanceOf[msg.sender] = init_supply
            self.total_supply = init_supply
            self.minter = msg.sender
            log.Transfer(ZERO_ADDRESS, msg.sender, init_supply)
        ```

    === "Example"

        ```shell
        >>> lp_token.symbol()
        'Curve.fi yDAI/yUSDC/yUSDT/yBUSD'
        ```

### `CurveToken.symbol`

!!! description "CurveToken.symbol() → string[32]: view"

    Get token symbol.

    ??? quote "Source code"

        ```vyper hl_lines="1 9"
        symbol: public(string[32])

        ...

        @public
        def __init__(_name: string[64], _symbol: string[32], _decimals: uint256, _supply: uint256):
            init_supply: uint256 = _supply * 10 ** _decimals
            self.name = _name
            self.symbol = _symbol
            self.decimals = _decimals
            self.balanceOf[msg.sender] = init_supply
            self.total_supply = init_supply
            self.minter = msg.sender
            log.Transfer(ZERO_ADDRESS, msg.sender, init_supply)
        ```

    === "Example"

        ```shell
        >>> lp_token.symbol()
        'yDAI+yUSDC+yUSDT+yBUSD'
        ```

### `CurveToken.decimals`

!!! description "CurveToken.decimals() → uint256: view"

    Get token precision (decimals).

    ??? quote "Source code"

        ```vyper hl_lines="1 10"
        decimals: public(uint256)

        ...

        @public
        def __init__(_name: string[64], _symbol: string[32], _decimals: uint256, _supply: uint256):
            init_supply: uint256 = _supply * 10 ** _decimals
            self.name = _name
            self.symbol = _symbol
            self.decimals = _decimals
            self.balanceOf[msg.sender] = init_supply
            self.total_supply = init_supply
            self.minter = msg.sender
            log.Transfer(ZERO_ADDRESS, msg.sender, init_supply)
        ```

    === "Example"

        ```shell
        >>> lp_token.decimals()
        18
        ```

### `CurveToken.balanceOf`

!!! description "CurveToken.balanceOf(account: address) → uint256: view"

    Get token balance for an account.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `address` | `address` | Address to get the token balance for |

    ??? quote "Source code"

        ```vyper hl_lines="5 11 15"
        # NOTE: By declaring `balanceOf` as public, vyper automatically generates a 'balanceOf()' getter
        #       method to allow access to account balances.
        #       The _KeyType will become a required parameter for the getter and it will return _ValueType.
        #       See: https://vyper.readthedocs.io/en/v0.1.0-beta.8/types.html?highlight=getter#mappings
        balanceOf: public(map(address, uint256))

        ...

        @public
        def __init__(_name: string[64], _symbol: string[32], _decimals: uint256, _supply: uint256):
            init_supply: uint256 = _supply * 10 ** _decimals
            self.name = _name
            self.symbol = _symbol
            self.decimals = _decimals
            self.balanceOf[msg.sender] = init_supply
            self.total_supply = init_supply
            self.minter = msg.sender
            log.Transfer(ZERO_ADDRESS, msg.sender, init_supply)
        ```

    === "Example"

        ```shell
        >>> lp_token.balanceOf("0x69fb7c45726cfe2badee8317005d3f94be838840")
        72372801850459006740117197
        ```


### `CurveToken.totalSupply`

!!! description "CurveToken.totalSupply() → uint256: view"

    Get total token supply.

    ??? quote "Source code"

        ```vyper
        @public
        @constant
        def totalSupply() -> uint256:
            """
            @dev Total number of tokens in existence.
            """
            return self.total_supply
        ```

    === "Example"

        ```shell
        >>> lp_token.totalSupply()
        73112516629065063732935484
        ```

### `CurveToken.allowance`

!!! description "CurveToken.allowance(_owner: address, _spender: address) → uint256: view"

    This view method gets the allowance of an address (`_spender`) to spend on behalf of some other account `_owner`.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_spender` | `address` | Account that can spend up to the allowance |
    | `_owner`    | `address` | Account that is paying when ``_spender`` spends the allowance|

    ??? quote "Source code"

        ```vyper
        @public
        @constant
        def allowance(_owner : address, _spender : address) -> uint256:
            """
            @dev Function to check the amount of tokens that an owner allowed to a spender.
            @param _owner The address which owns the funds.
            @param _spender The address which will spend the funds.
            @return An uint256 specifying the amount of tokens still available for the spender.
            """
            return self.allowances[_owner][_spender]
        ```

### `CurveToken.transfer`

!!! description "CurveToken.transfer(_to: address, _value: uint256) → bool"

    Transfer tokens to a specified address. `_from` address is implicitly `msg.sender`. Returns ``True`` if the
    transfer succeeds.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_to` | `address` | Receiver of the tokens |
    | `_value`    | `uint256` | Amount of tokens to be transferred |

    Emits: <mark style="background-color: #FFD580; color: black">Transfer</mark>

    ??? quote "Source code"

        ```vyper
        @public
        def transfer(_to : address, _value : uint256) -> bool:
            """
            @dev Transfer token for a specified address
            @param _to The address to transfer to.
            @param _value The amount to be transferred.
            """
            # NOTE: vyper does not allow underflows
            #       so the following subtraction would revert on insufficient balance
            self.balanceOf[msg.sender] -= _value
            self.balanceOf[_to] += _value
            log.Transfer(msg.sender, _to, _value)
            return True
        ```

### `CurveToken.transferFrom`

!!! description "CurveToken.transferFrom(_from: address, _to: address, _value: uint256) → bool"

    Transfer tokens from one address to another. `msg.sender` does the transfer on behalf of the `_from` address, and
    requires sufficient spending allowance. Returns ``True`` if transfer succeeds.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_from` | `address` | Address which `msg.sender` want to send tokens from |
    | `_to` | `address` | Address which `msg.sender` want to transfer to |
    | `_value`    | `uint256` | Amount of tokens to be transferred |

    Emits: <mark style="background-color: #FFD580; color: black">Transfer</mark>

    ??? quote "Source code"

        ```vyper
        @public
        def transferFrom(_from : address, _to : address, _value : uint256) -> bool:
            """
             @dev Transfer tokens from one address to another.
                  Note that while this function emits a Transfer event, this is not required as per the specification,
                  and other compliant implementations may not emit the event.
             @param _from address The address which you want to send tokens from
             @param _to address The address which you want to transfer to
             @param _value uint256 the amount of tokens to be transferred
            """
            # NOTE: vyper does not allow underflows
            #       so the following subtraction would revert on insufficient balance
            self.balanceOf[_from] -= _value
            self.balanceOf[_to] += _value
            if msg.sender != self.minter:  # minter is allowed to transfer anything
                # NOTE: vyper does not allow underflows
                # so the following subtraction would revert on insufficient allowance
                self.allowances[_from][msg.sender] -= _value
            log.Transfer(_from, _to, _value)
            return True
        ```

    !!! note

    While this function emits a Transfer event, this is not required as per the specification, and other compliant
    implementations may not emit the event.


### `CurveToken.approve`

!!! description "CurveToken.approve(_spender: address, _value: uint256) → bool"

    Approve the passed address to spend the specified amount of tokens on behalf of ``msg.sender``. Returns ``True`` on
    successful approvals.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_spender` | `address` | Address which will spend the funds |
    | `_value`    | `uint256` | Amount of tokens to be spent |

    Emits: <mark style="background-color: #FFD580; color: black">Approval</mark>

    ??? quote "Source code"

        ```vyper
        @public
        def approve(_spender : address, _value : uint256) -> bool:
            """
            @dev Approve the passed address to spend the specified amount of tokens on behalf of msg.sender.
                 Beware that changing an allowance with this method brings the risk that someone may use both the old
                 and the new allowance by unfortunate transaction ordering. One possible solution to mitigate this
                 race condition is to first reduce the spender's allowance to 0 and set the desired value afterwards:
                 https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
            @param _spender The address which will spend the funds.
            @param _value The amount of tokens to be spent.
            """
            assert _value == 0 or self.allowances[msg.sender][_spender] == 0
            self.allowances[msg.sender][_spender] = _value
            log.Approval(msg.sender, _spender, _value)
            return True
        ```

    !!! warning

    Beware that changing an allowance with this method brings the risk that someone may use both the old and the new
    allowance by unfortunate transaction ordering. One possible solution to mitigate this race condition is
    to first reduce the spender’s allowance to 0 and set the desired value afterwards (see this
    [GitHub issue](https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729)).

    !!! warning

    For Curve LP Tokens V1 and V2, **non-zero to non-zero approvals are prohibited**. Instead, after every non-zero
    approval, the allowance for the spender must be reset to 0.


## Minter Methods

The following methods are only callable by the ``minter`` (private attribute).

!!! note

    For Curve Token V1, the ``minter`` attribute is not ``public``.

### `CurveToken.mint`

!!! description "CurveToken.mint(_to: address, _value: uint256)"

    This encapsulates the modification of balances such that the proper events are emitted.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_to` | `address` | Address that will receive the minted tokens |
    | `_value`    | `uint256` | Amount of tokens that will be minted |

    Emits: <mark style="background-color: #FFD580; color: black">Transfer</mark>

    ??? quote "Source code"

        ```vyper
        @public
        def mint(_to: address, _value: uint256):
            """
            @dev Mint an amount of the token and assigns it to an account.
                 This encapsulates the modification of balances such that the
                 proper events are emitted.
            @param _to The account that will receive the created tokens.
            @param _value The amount that will be created.
            """
            assert msg.sender == self.minter
            assert _to != ZERO_ADDRESS
            self.total_supply += _value
            self.balanceOf[_to] += _value
            log.Transfer(ZERO_ADDRESS, _to, _value)
        ```


### `CurveToken.burn`

!!! description "CurveToken.burn(_value: uint256)"

    Burn an amount of the token of ``msg.sender``.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_value`    | `uint256` | Token amount that will be burned |

    Emits: <mark style="background-color: #FFD580; color: black">Transfer</mark>

    ??? quote "Source code"

        ```vyper
        @private
        def _burn(_to: address, _value: uint256):
            """
            @dev Internal function that burns an amount of the token of a given
                 account.
            @param _to The account whose tokens will be burned.
            @param _value The amount that will be burned.
            """
            assert _to != ZERO_ADDRESS
            self.total_supply -= _value
            self.balanceOf[_to] -= _value
            log.Transfer(_to, ZERO_ADDRESS, _value)

        @public
        def burn(_value: uint256):
            """
            @dev Burn an amount of the token of msg.sender.
            @param _value The amount that will be burned.
            """
            assert msg.sender == self.minter, "Only minter is allowed to burn"
            self._burn(msg.sender, _value)
        ```


### `CurveToken.burnFrom`

!!! description "CurveToken.burnFrom(_to: address, _value: uint256)"

    Burn an amount of the token from a given account.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_to`       |  `address` | Account whose tokens will be burned|
    | `_value`    | `uint256` | Token amount that will be burned |

    Emits: <mark style="background-color: #FFD580; color: black">Transfer</mark>

    ??? quote "Source code"

        ```vyper
        @private
        def _burn(_to: address, _value: uint256):
            """
            @dev Internal function that burns an amount of the token of a given
                 account.
            @param _to The account whose tokens will be burned.
            @param _value The amount that will be burned.
            """
            assert _to != ZERO_ADDRESS
            self.total_supply -= _value
            self.balanceOf[_to] -= _value
            log.Transfer(_to, ZERO_ADDRESS, _value)

        @public
        def burnFrom(_to: address, _value: uint256):
            """
            @dev Burn an amount of the token from a given account.
            @param _to The account whose tokens will be burned.
            @param _value The amount that will be burned.
            """
            assert msg.sender == self.minter, "Only minter is allowed to burn"
            self._burn(_to, _value)
        ```

### `CurveToken.set_minter`

!!! description "CurveToken.set_minter(_minter: address)"

    Set a new minter for the token.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_minter`       |  `address` | Address of the new minter |

    ??? quote "Source code"

        ```vyper
        @public
        def set_minter(_minter: address):
            assert msg.sender == self.minter
            self.minter = _minter
        ```
