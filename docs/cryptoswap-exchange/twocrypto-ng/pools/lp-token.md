**LP Token and liquidity pool share the same smart contract.**


## **Contract Info Methods**

### `name`
!!! description "`TwoCrypto.name -> String[64]: view`"

    Getter for the name of the LP token.

    Returns: Name (`String[64]`).

    ??? quote "Source code"

        === "CurveTwocryptoOptimized.vy"

            ```vyper
            name: public(immutable(String[64]))

            @external
            def __init__(
                _name: String[64],
                _symbol: String[32],
                _coins: address[N_COINS],
                _math: address,
                _salt: bytes32,
                packed_precisions: uint256,
                packed_gamma_A: uint256,
                packed_fee_params: uint256,
                packed_rebalancing_params: uint256,
                initial_price: uint256,
            ):
                ...
                name = _name
                ...
            ```
    
    === "Example"

        ```shell
        >>> TwoCrypto.name()
        ```


### `symbol`
!!! description "`TwoCrypto.symbol -> String[32]: view`"

    Getter for the symbol of the LP token.

    Returns: Symbol (`String[32]`).

    ??? quote "Source code"

        === "CurveTwocryptoOptimized.vy"

            ```vyper
            symbol: public(immutable(String[32]))

            @external
            def __init__(
                _name: String[64],
                _symbol: String[32],
                _coins: address[N_COINS],
                _math: address,
                _salt: bytes32,
                packed_precisions: uint256,
                packed_gamma_A: uint256,
                packed_fee_params: uint256,
                packed_rebalancing_params: uint256,
                initial_price: uint256,
            ):
                ...
                symbol = _symbol
                ...
            ```
    
    === "Example"

        ```shell
        >>> TwoCrypto.name()
        ```


### `decimals`
!!! description "`TwoCrypto.decimals -> uint8: view`"

    Getter for the decimals of the LP token. This variable is a constant and is always set to 18.

    Returns: Decimals (`String[32]`).

    ??? quote "Source code"

        === "CurveTwocryptoOptimized.vy"

            ```vyper
            decimals: public(constant(uint8)) = 18
            ```
    
    === "Example"

        ```shell
        >>> TwoCrypto.decimals()
        18
        ```


### `version`
!!! description "`TwoCrypto.version -> String[8]: view`"

    Getter for the version of the LP token.

    Returns: Version (`String[8]`).

    ??? quote "Source code"

        === "CurveTwocryptoOptimized.vy"

            ```vyper
            version: public(constant(String[8])) = "v2.0.0"
            ```
    
    === "Example"

        ```shell
        >>> TwoCrypto.version()
        'v2.0.0'
        ```


### `balanceOf`
!!! description "`TwoCrypto.balanceOf(arg: address) -> uint256: view`"

    Getter for the LP token balance of an address.

    Returns: Token balance (`uint256`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `arg0` |  `address` | Address to get the balance of |

    ??? quote "Source code"

        === "CurveTwocryptoOptimized.vy"

            ```vyper
            balanceOf: public(HashMap[address, uint256])
            ```
    
    === "Example"

        ```shell
        >>> TwoCrypto.balanceOf()
        'v2.0.0'
        ```


### `totalSupply`
!!! description "`TwoCrypto.totalSupply() -> uint256: view`"

    Getter for the total supply of the LP token.

    Returns: Total supply (`uint256`).

    ??? quote "Source code"

        === "CurveTwocryptoOptimized.vy"

            ```vyper
            totalSupply: public(uint256)
            ```
    
    === "Example"

        ```shell
        >>> TwoCrypto.totalSupply()
        'v2.0.0'
        ```

## **Allowance and Transfer Methods**

### `transfer`
!!! description "`TwoCrypto.transfer(_to: address, _value: uint256) -> bool:`"

    Function to transfer `_value` token from `msg.sender` to `_to`.

    Returns: True (`bool`).

    Emits: `Transfer`

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_to` |  `address` | Address to transfer to |
    | `_value` |  `uint256` | Amount to transfer |

    ??? quote "Source code"

        === "CurveTwocryptoOptimized.vy"

            ```vyper
            event Transfer:
                sender: indexed(address)
                receiver: indexed(address)
                value: uint256

            @external
            def transfer(_to: address, _value: uint256) -> bool:
                """
                @dev Transfer token for a specified address
                @param _to The address to transfer to.
                @param _value The amount to be transferred.
                @return bool True on successful transfer. Reverts otherwise.
                """
                self._transfer(msg.sender, _to, _value)
                return True

            @internal
            def _transfer(_from: address, _to: address, _value: uint256):
                assert _to not in [self, empty(address)]

                self.balanceOf[_from] -= _value
                self.balanceOf[_to] += _value

                log Transfer(_from, _to, _value)
            ```
    
    === "Example"

        ```shell
        >>> TwoCrypto.transfer(todo)
        ```


### `transferFrom`
!!! description "`TwoCrypto.transferFrom(_from: address, _to: address, _value: uint256) -> bool:`"

    Function to transfer `_value` token from `msg.sender` to `_to`. Needs [`allowance`](#allowance) to successfully transfer on behalf of someone else.

    Returns: True (`bool`).

    Emits: `Transfer`

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_from` |  `address` | Address to transfer from |
    | `_to` |  `address` | Address to transfer to |
    | `_value` |  `uint256` | Amount of tokens to transfer |

    ??? quote "Source code"

        === "CurveTwocryptoOptimized.vy"

            ```vyper
            event Transfer:
                sender: indexed(address)
                receiver: indexed(address)
                value: uint256
            
            @external
            def transferFrom(_from: address, _to: address, _value: uint256) -> bool:
                """
                @dev Transfer tokens from one address to another.
                @param _from address The address which you want to send tokens from
                @param _to address The address which you want to transfer to
                @param _value uint256 the amount of tokens to be transferred
                @return bool True on successul transfer. Reverts otherwise.
                """
                _allowance: uint256 = self.allowance[_from][msg.sender]
                if _allowance != max_value(uint256):
                    self._approve(_from, msg.sender, _allowance - _value)

                self._transfer(_from, _to, _value)
                return True

            @internal
            def _transfer(_from: address, _to: address, _value: uint256):
                assert _to not in [self, empty(address)]

                self.balanceOf[_from] -= _value
                self.balanceOf[_to] += _value

                log Transfer(_from, _to, _value)
            ```
    
    === "Example"

        ```shell
        >>> TwoCrypto.totalSupply()
        'v2.0.0'
        ```


### `approve`
!!! description "`TwoCrypto.approve(_spender: address, _value: uint256) -> bool:`"

    Function to approve `_to` to transfer `_value` on behalf of msg.sender.

    Returns: True (`bool`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_spender` |  `address` | Address approved to spend funds |
    | `_value` |  `uint256` | Amount of tokens allowed to spend |

    ??? quote "Source code"

        === "CurveTwocryptoOptimized.vy"

            ```vyper
            event Approval:
                owner: indexed(address)
                spender: indexed(address)
                value: uint256

            @external
            def approve(_spender: address, _value: uint256) -> bool:
                """
                @notice Allow `_spender` to transfer up to `_value` amount
                        of tokens from the caller's account.
                @param _spender The account permitted to spend up to `_value` amount of
                                caller's funds.
                @param _value The amount of tokens `_spender` is allowed to spend.
                @return bool Success
                """
                self._approve(msg.sender, _spender, _value)
                return True

            @internal
            def _approve(_owner: address, _spender: address, _value: uint256):
                self.allowance[_owner][_spender] = _value

                log Approval(_owner, _spender, _value)
            ```
    
    === "Example"

        ```shell
        >>> TwoCrypto.approve()
        ```


### `allowance`
!!! description "`TwoCrypto.allowance(arg0: address, arg1: address) -> uint256: view`"

    Getter method to check the allowance of `arg0` for funds of `arg1`.

    Returns: Amount allowed to spend (`uint256`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `arg0` |  `address` | Address of the spender |
    | `arg1` |  `address` | Address to the token owner |

    ??? quote "Source code"

        === "CurveTwocryptoOptimized.vy"

            ```vyper
            allowance: public(HashMap[address, HashMap[address, uint256]])
            ```
    
    === "Example"

        ```shell
        >>> TwoCrypto.allowance()
        ```


### `permit`
!!! description "`TwoCrypto.`"

    Function to permit `spender` to spend up to `_value` amount of `_owner`'s tokens via a signature.

    Returns: True (`bool`).

    Emits: `Approval`

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_owner` |  `address` | Account which generated the signature and is granting an allowance  |
    | `_spender` |  `address` | Account which will be granted an allowance  |
    | `_value` |  `uint256` | Amount to approve |
    | `_deadline` |  `uint256` | Deadline by which signature must be submitted |
    | `_v` |  `uint8` | The last byte of the ECDSA signature |
    | `_r` |  `bytes32` | The first 32 bytes of the ECDSA signature |
    | `_s` |  `bytes32` | The second 32 bytes of the ECDSA signature |

    ??? quote "Source code"

        === "CurveTwocryptoOptimized.vy"

            ```vyper
            event Approval:
                owner: indexed(address)
                spender: indexed(address)
                value: uint256

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
                @notice Permit `_spender` to spend up to `_value` amount of `_owner`'s
                        tokens via a signature.
                @dev In the event of a chain fork, replay attacks are prevented as
                    domain separator is recalculated. However, this is only if the
                    resulting chains update their chainId.
                @param _owner The account which generated the signature and is granting an
                            allowance.
                @param _spender The account which will be granted an allowance.
                @param _value The approval amount.
                @param _deadline The deadline by which the signature must be submitted.
                @param _v The last byte of the ECDSA signature.
                @param _r The first 32 bytes of the ECDSA signature.
                @param _s The second 32 bytes of the ECDSA signature.
                @return bool Success.
                """
                assert _owner != empty(address)  # dev: invalid owner
                assert block.timestamp <= _deadline  # dev: permit expired

                nonce: uint256 = self.nonces[_owner]
                digest: bytes32 = keccak256(
                    concat(
                        b"\x19\x01",
                        self._domain_separator(),
                        keccak256(
                            _abi_encode(
                                EIP2612_TYPEHASH, _owner, _spender, _value, nonce, _deadline
                            )
                        ),
                    )
                )
                assert ecrecover(digest, _v, _r, _s) == _owner  # dev: invalid signature

                self.nonces[_owner] = unsafe_add(nonce, 1)  # <-- Unsafe add is safe here.
                self._approve(_owner, _spender, _value)
                return True

            @internal
            def _approve(_owner: address, _spender: address, _value: uint256):
                self.allowance[_owner][_spender] = _value

                log Approval(_owner, _spender, _value)
            ```
    
    === "Example"

        ```shell
        >>> TwoCrypto.permit
        ```


### `nonces`
!!! description "`TwoCrypto.nonces(arg0: address) -> uint256: view`"

    Getter for the nonces.

    Returns: nonces (`uint256`).

    ??? quote "Source code"

        === "CurveTwocryptoOptimized.vy"

            ```vyper
            nonces: public(HashMap[address, uint256])
            ```
    
    === "Example"

        ```shell
        >>> TwoCrypto.
        ```



### `salt`
!!! description "`TwoCrypto.salt -> bytes32`"

    Getter for the salt.

    Returns: salt (`bytes32`).

    Emits ``

    | Input      | Type      | Description |
    | ---------- | --------- | ----------- |
    | `future_A` | `uint256` | future A value |

    ??? quote "Source code"

        === "CurveTwocryptoOptimized.vy"

            ```vyper
            salt: public(immutable(bytes32))
            ```
    
    === "Example"

        ```shell
        >>> TwoCrypto.salt()
        '0x767a041fed80912408771cda7c58c87d48a3b88d374afabe93cdd456b60eaaf7'
        ```


### `DOMAIN_SEPERATOR`
!!! description "`TwoCrypto.DOMAIN_SEPERATOR -> bytes32: view`"

    Getter for the domain seperator.

    Returns: 

    | Input      | Type      | Description |
    | ---------- | --------- | ----------- |
    | `future_A` | `uint256` | future A value |

    ??? quote "Source code"

        === "CurveTwocryptoOptimized.vy"

            ```vyper
            CACHED_DOMAIN_SEPARATOR: immutable(bytes32)

            @view
            @external
            def DOMAIN_SEPARATOR() -> bytes32:
                """
                @notice EIP712 domain separator.
                @return bytes32 Domain Separator set for the current chain.
                """
                return self._domain_separator()

            @view
            @internal
            def _domain_separator() -> bytes32:
                if chain.id != CACHED_CHAIN_ID:
                    return keccak256(
                        _abi_encode(
                            EIP712_TYPEHASH,
                            NAME_HASH,
                            VERSION_HASH,
                            chain.id,
                            self,
                            salt,
                        )
                    )
                return CACHED_DOMAIN_SEPARATOR
            ```
    
    === "Example"

        ```shell
        >>> TwoCrypto.DOMAIN_SEPERATOR()
        '0xe7d0dfd044288a48770d5e29b857628b360a96e3f5301a2ba585201e1668768a'
        ```