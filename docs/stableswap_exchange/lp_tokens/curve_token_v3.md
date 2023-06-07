The Curve Token V3 is more gas efficient than versions 1 and 2. The implementation for a Curve Token V3 may be viewed on 
[GitHub](https://github.com/curvefi/curve-contract/blob/master/contracts/tokens/CurveTokenV3.vy).

!!! note

    Compared to the Curve Token V2 API, there have been the following changes:

    `increaseAllowance` and `decreaseAllowance` methods added to mitigate race conditions.

### `CurveToken.increaseAllowance`

!!! description "`CurveToken.increaseAllowance(_spender: address, _added_value: uint256) → bool`"

    Increase the allowance granted to `_spender` by the `msg.sender`.

    This is alternative to `approve` that can be used as a mitigation for the potential race condition. Returns `True` 
    if success.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_spender` | `address` | Account whose tokens will be burned |
    | `_value` | `uint256` | Amount that will be burned |

    Emits: <mark style="background-color: #FFD580; color: black">Approval</mark>

    ??? quote "Source code"

        ```python
        @external
        def approve(_spender : address, _value : uint256) -> bool:
            """
            @notice Approve the passed address to transfer the specified amount of
                    tokens on behalf of msg.sender
            @dev Beware that changing an allowance via this method brings the risk
                 that someone may use both the old and new allowance by unfortunate
                 transaction ordering. This may be mitigated with the use of
                 {increaseAllowance} and {decreaseAllowance}.
                 https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
            @param _spender The address which will transfer the funds
            @param _value The amount of tokens that may be transferred
            @return bool success
            """
            self.allowance[msg.sender][_spender] = _value
        
            log Approval(msg.sender, _spender, _value)
            return True
        
        
        @external
        def increaseAllowance(_spender: address, _added_value: uint256) -> bool:
            """
            @notice Increase the allowance granted to `_spender` by the caller
            @dev This is alternative to {approve} that can be used as a mitigation for
                 the potential race condition
            @param _spender The address which will transfer the funds
            @param _added_value The amount of to increase the allowance
            @return bool success
            """
            allowance: uint256 = self.allowance[msg.sender][_spender] + _added_value
            self.allowance[msg.sender][_spender] = allowance
        
            log Approval(msg.sender, _spender, allowance)
            return True
        ```
        
    === "Example"
    
        ```shell
        >>> lp_token.increaseAllowance()
        todo: ""
        ```

### `CurveToken.decreaseAllowance`

!!! description "`CurveToken.decreaseAllowance(_spender: address, _subtracted_value: uint256) → bool`"

    Decrease the allowance granted to `_spender` by the `msg.sender`.

    This is alternative to `approve` that can be used as a mitigation for the potential race condition. Returns `True` 
    if success.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_spender` | `address` | Account whose tokens will be burned |
    | `_added_value` | `uint256` | Amount that will be burned |

    Emits: <mark style="background-color: #FFD580; color: black">Approval</mark>

    ??? quote "Source code"

        ```python
        @external
        def approve(_spender : address, _value : uint256) -> bool:
            """
            @notice Approve the passed address to transfer the specified amount of
                    tokens on behalf of msg.sender
            @dev Beware that changing an allowance via this method brings the risk
                 that someone may use both the old and new allowance by unfortunate
                 transaction ordering. This may be mitigated with the use of
                 {increaseAllowance} and {decreaseAllowance}.
                 https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
            @param _spender The address which will transfer the funds
            @param _value The amount of tokens that may be transferred
            @return bool success
            """
            self.allowance[msg.sender][_spender] = _value
        
            log Approval(msg.sender, _spender, _value)
            return True
        
        
        @external
        def decreaseAllowance(_spender: address, _subtracted_value: uint256) -> bool:
            """
            @notice Decrease the allowance granted to `_spender` by the caller
            @dev This is alternative to {approve} that can be used as a mitigation for
                 the potential race condition
            @param _spender The address which will transfer the funds
            @param _subtracted_value The amount of to decrease the allowance
            @return bool success
            """
            allowance: uint256 = self.allowance[msg.sender][_spender] - _subtracted_value
            self.allowance[msg.sender][_spender] = allowance
        
            log Approval(msg.sender, _spender, allowance)
            return True
        ```
        
    === "Example"
    
        ```shell
        >>> lp_token.decreaseAllowance()
        todo: ""
        ```