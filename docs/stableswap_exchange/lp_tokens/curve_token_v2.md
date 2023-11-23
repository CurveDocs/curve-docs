Compared to Curve Token v1, the following changes have been made to the API:

- `minter` attribute is public and therefore a `minter` getter has been generated
- `name` and `symbol` attributes can be set via `set_name`
- `mint` method returns `bool`
- `burnFrom` method returns `bool`
- `burn` method has been removed


!!!deploy "Contract Source & Deployment"
    Source code available on [Github](https://github.com/curvefi/curve-contract/blob/master/contracts/tokens/CurveTokenV2.vy).

!!! warning
    For Curve LP Tokens V1 and V2, non-zero to non-zero approvals are prohibited. Instead, after every non-zero approval, the allowance for the spender must be reset to `0`.



### `minter`
!!! description "`CurveTokenV2.minter() → address: view`"

    Getter for the address of the `minter` of the token.

    Returns: minter (`address`).

    ??? quote "Source code"

<<<<<<< HEAD
        ```python
=======
        ```vyper hl_lines="1 11"
>>>>>>> a27909d5f421a1329ee4ba7044091ebfd75305e3
        minter: public(address)

        @external
        def __init__(_name: String[64], _symbol: String[32], _decimals: uint256, _supply: uint256):
            init_supply: uint256 = _supply * 10 ** _decimals
            self.name = _name
            self.symbol = _symbol
            self.decimals = _decimals
            self.balanceOf[msg.sender] = init_supply
            self.total_supply = init_supply
            self.minter = msg.sender
            log Transfer(ZERO_ADDRESS, msg.sender, init_supply)
        ```
        
    === "Example"
    
        ```shell
        >>> CurveTokenV2.minter()
        '0xd061D61a4d941c39E5453435B6345Dc261C2fcE0'
        ```


### `set_name`
!!! description "`CurveTokenV2.set_name(_name: String[64], _symbol: String[32])`"

    Set the name and symbol of the token. This method can only be called by minter.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `name` | `String[64]` | new name of token |
    | `symbol` | `String[32]` | new symbol of token |

    ??? quote "Source code"

<<<<<<< HEAD
        ```python
=======
        ```vyper hl_lines="1 11"
>>>>>>> a27909d5f421a1329ee4ba7044091ebfd75305e3
        @external
        def set_name(_name: String[64], _symbol: String[32]):
            assert Curve(self.minter).owner() == msg.sender
            self.name = _name
            self.symbol = _symbol
        ```
        
    === "Example"
    
        ```shell
        >>> CurveTokenV2.minter()
        todo: ""
        ```


### `mint`
!!! description "`CurveTokenV2.mint(_to: address, _value: uint256) → bool`"

    Mint an amount of the token and assign it to an account. This encapsulates the modification of balances such that the proper events are emitted.

    Returns: `true` (`bool`) if not reverted.

    Emits: `Transfer`

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_to` | `address` | receiver of minted tokens |
    | `_value` | `uint256` | amount of tokens minted |

    ??? quote "Source code"

<<<<<<< HEAD
        ```python
        event Transfer:
            _from: indexed(address)
            _to: indexed(address)
            _value: uint256

=======
        ```vyper
>>>>>>> a27909d5f421a1329ee4ba7044091ebfd75305e3
        @external
        def mint(_to: address, _value: uint256) -> bool:
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
            log Transfer(ZERO_ADDRESS, _to, _value)
            return True
        ```
        
    === "Example"
    
        ```shell
        >>> CurveTokenV2.mint()
        todo: ""
        ```


### `burnFrom`
!!! description "`CurveTokenV2.burnFrom(_to: address, _value: uint256) → bool`"

    Burn an amount of the token from a given account. 
    
    Returns: `true` (`bool`) if not reverted.

    Emits: `Transfer`

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_to` | `address` | Account whose tokens will be burned |
    | `_value` | `uint256` | Amount that will be burned |

    ??? quote "Source code"

<<<<<<< HEAD
        ```python
        event Transfer:
            _from: indexed(address)
            _to: indexed(address)
            _value: uint256

=======
        ```vyper
>>>>>>> a27909d5f421a1329ee4ba7044091ebfd75305e3
        @external
        def burnFrom(_to: address, _value: uint256) -> bool:
            """
            @dev Burn an amount of the token from a given account.
            @param _to The account whose tokens will be burned.
            @param _value The amount that will be burned.
            """
            assert msg.sender == self.minter
            assert _to != ZERO_ADDRESS
        
            self.total_supply -= _value
            self.balanceOf[_to] -= _value
            log Transfer(_to, ZERO_ADDRESS, _value)
        
            return True
        ```
        
    === "Example"
    
        ```shell
        >>> CurveTokenV2.burnFrom()
        todo: ""
        ```