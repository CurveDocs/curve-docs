**LP Token and liquidity pool is the same smart contract.**

!!!deploy "Contract Source"
    Source code available on [Github](https://github.com/curvefi/tricrypto-ng/blob/main/contracts/main/CurveTricryptoOptimizedWETH.vy).


## **LP Token Info Methods**

### `name`
!!! description "`LPToken.name() -> String[64]: view`"

    Getter for the name of the LP token.

    Returns: name (`String[64]`).

    ??? quote "Source code"

        ```python hl_lines="1 4 5 23"
        name: public(immutable(String[64]))

        @external
        def __init__(
            _name: String[64],
            _symbol: String[32],
            _coins: address[N_COINS],
            _math: address,
            _weth: address,
            _salt: bytes32,
            packed_precisions: uint256,
            packed_A_gamma: uint256,
            packed_fee_params: uint256,
            packed_rebalancing_params: uint256,
            packed_prices: uint256,
        ):

            WETH20 = _weth
            MATH = Math(_math)

            self.factory = msg.sender

            name = _name
            symbol = _symbol
            coins = _coins

            self.packed_precisions = packed_precisions  # <------- Precisions of coins
            #                            are calculated as 10**(18 - coin.decimals()).

            self.initial_A_gamma = packed_A_gamma  # <------------------- A and gamma.
            self.future_A_gamma = packed_A_gamma

            self.packed_rebalancing_params = packed_rebalancing_params  # <-- Contains
            #               rebalancing params: allowed_extra_profit, adjustment_step,
            #                                                         and ma_exp_time.

            self.packed_fee_params = packed_fee_params  # <-------------- Contains Fee
            #                                  params: mid_fee, out_fee and fee_gamma.

            self.price_scale_packed = packed_prices
            self.price_oracle_packed = packed_prices
            self.last_prices_packed = packed_prices
            self.last_prices_timestamp = block.timestamp
            self.xcp_profit_a = 10**18

            #         Cache DOMAIN_SEPARATOR. If chain.id is not CACHED_CHAIN_ID, then
            #     DOMAIN_SEPARATOR will be re-calculated each time `permit` is called.
            #                   Otherwise, it will always use CACHED_DOMAIN_SEPARATOR.
            #                       see: `_domain_separator()` for its implementation.
            NAME_HASH = keccak256(name)
            salt = _salt
            CACHED_CHAIN_ID = chain.id
            CACHED_DOMAIN_SEPARATOR = keccak256(
                _abi_encode(
                    EIP712_TYPEHASH,
                    NAME_HASH,
                    VERSION_HASH,
                    chain.id,
                    self,
                    salt,
                )
            )

            log Transfer(empty(address), self, 0)  # <------- Fire empty transfer from
            #                                       0x0 to self for indexers to catch.
        ```

    === "Example"

        ```shell
        >>> LPToken.name()
        'TricryptoUSDT'
        ```


### `symbol`
!!! description "`LPToken.symbol() -> String[32]: view`"

    Getter for the symbol of the LP token.

    Returns: symbol (`String[32]`).

    ??? quote "Source code"

        ```python hl_lines="1 4 6 24"
        symbol: public(immutable(String[32]))

        @external
        def __init__(
            _name: String[64],
            _symbol: String[32],
            _coins: address[N_COINS],
            _math: address,
            _weth: address,
            _salt: bytes32,
            packed_precisions: uint256,
            packed_A_gamma: uint256,
            packed_fee_params: uint256,
            packed_rebalancing_params: uint256,
            packed_prices: uint256,
        ):

            WETH20 = _weth
            MATH = Math(_math)

            self.factory = msg.sender

            name = _name
            symbol = _symbol
            coins = _coins

            self.packed_precisions = packed_precisions  # <------- Precisions of coins
            #                            are calculated as 10**(18 - coin.decimals()).

            self.initial_A_gamma = packed_A_gamma  # <------------------- A and gamma.
            self.future_A_gamma = packed_A_gamma

            self.packed_rebalancing_params = packed_rebalancing_params  # <-- Contains
            #               rebalancing params: allowed_extra_profit, adjustment_step,
            #                                                         and ma_exp_time.

            self.packed_fee_params = packed_fee_params  # <-------------- Contains Fee
            #                                  params: mid_fee, out_fee and fee_gamma.

            self.price_scale_packed = packed_prices
            self.price_oracle_packed = packed_prices
            self.last_prices_packed = packed_prices
            self.last_prices_timestamp = block.timestamp
            self.xcp_profit_a = 10**18

            #         Cache DOMAIN_SEPARATOR. If chain.id is not CACHED_CHAIN_ID, then
            #     DOMAIN_SEPARATOR will be re-calculated each time `permit` is called.
            #                   Otherwise, it will always use CACHED_DOMAIN_SEPARATOR.
            #                       see: `_domain_separator()` for its implementation.
            NAME_HASH = keccak256(name)
            salt = _salt
            CACHED_CHAIN_ID = chain.id
            CACHED_DOMAIN_SEPARATOR = keccak256(
                _abi_encode(
                    EIP712_TYPEHASH,
                    NAME_HASH,
                    VERSION_HASH,
                    chain.id,
                    self,
                    salt,
                )
            )

            log Transfer(empty(address), self, 0)  # <------- Fire empty transfer from
            #                                       0x0 to self for indexers to catch.
        ```

    === "Example"

        ```shell
        >>> LPToken.symbol()
        'crvUSDTWBTCWETH'
        ```


### `decimals`
!!! description "`LPToken.name() -> uint8: view`"

    Getter for the decimals of the LP token.

    Returns: decimals (`uint8`).

    !!!note
        `decimals` is a constant variable which is set to 18.

    ??? quote "Source code"

        ```python hl_lines="1"
        decimals: public(constant(uint8)) = 18
        ```

    === "Example"

        ```shell
        >>> LPToken.decimals()
        18
        ```


### `version`
!!! description "`LPToken.version() -> String[8]: view`"

    Getter for the version of the LP token.

    Returns: version (`String[8]`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `input` |  `type` | Contract input |

    ??? quote "Source code"

        ```python hl_lines="1"
        version: public(constant(String[8])) = "v2.0.0"
        ```

    === "Example"

        ```shell
        >>> LPToken.version()
        'v2.0.0'
        ```


### `balanceOf`
!!! description "`LPToken.balanceOf(arg0: address) -> uint256: view`"

    Getter for the LP token balance of an address.

    Returns: token balance (`uint256`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `arg0` |  `address` | Address to get the balance of |

    ??? quote "Source code"

        ```python hl_lines="1"
        balanceOf: public(HashMap[address, uint256])
        ```

    === "Example"

        ```shell
        >>> LPToken.balanceOf("0xF29FfF074f5cF755b55FbB3eb10A29203ac91EA2")
        41484337213621873816739
        ```


### `totalSupply`
!!! description "`LPToken.totalSupply() -> uint256: view`"

    Getter for the total supply of the LP token.

    Returns: total supply (`uint256`).

    ??? quote "Source code"

        ```python hl_lines="1"
        totalSupply: public(uint256)
        ```

    === "Example"

        ```shell
        >>> LPToken.totalSupply()
        41488167470081184162704
        ```


## Allowance and Transfer Methods

### `transfer`
!!! description "`LPToken.transfer(_to: address, _value: uin256) -> bool:`"

    Function to transfer `_value` token from `msg.sender` to `_to`.

    Returns: True or False (`bool`).

    Emits: `Transfer`

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_to` |  `address` | Address to transfer to |
    | `_value` |  `uint256` | Amount to transfer |

    ??? quote "Source code"

        ```python hl_lines="1 7 15 18 24"
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
        >>> LPToken.transfer("0xbabe61887f1de2713c6f97e567623453d3C79f67", 100)
        True
        ```

        
### `transferFrom`
!!! description "`LPToken.transferFrom(_from: address, _to: address, _value: uint256) -> bool:`"

    Function to transfer `_value` token from `msg.sender` to `_to`. Needs [`allowance`](#allowance) to successfully transfer on behalf of someone else.

    Returns: True or False (`bool`).

    Emits: `Transfer`

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_from` |  `address` | Address to transfer from |
    | `_to` |  `address` | Address to transfer to |
    | `_value` |  `uint256` | Amount of tokens to transfer |

    ??? quote "Source code"

        ```python hl_lines="1 7 19 20 23 29"
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
        >>> LPToken.transferFrom("0x7a16ff8270133f063aab6c9977183d9e72835428", "0xbabe61887f1de2713c6f97e567623453d3C79f67", 100)
        True
        ```


### `approve`
!!! description "`LPToken.approve(_spender: address, _value: uint256) -> bool:`"

    Function to approve `_to` to transfer `_value` on behalf of msg.sender.

    Returns: True (`bool`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_spender` |  `address` | Address approved to spend funds |
    | `_value` |  `uint256` | Amount of tokens allowed to spend |

    ??? quote "Source code"

        ```python hl_lines="1 7 19 20 23 26"
        event Approval:
            owner: indexed(address)
            spender: indexed(address)
            value: uint256

        @external
        def approve(_spender: address, _value: uint256) -> bool:
            """
            @notice Allow `_spender` to transfer up to `_value` amount
                    of tokens from the caller's account.
            @dev Non-zero to non-zero approvals are allowed, but should
                be used cautiously. The methods increaseAllowance + decreaseAllowance
                are available to prevent any front-running that may occur.
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
        >>> LPToken.approve("0x7a16ff8270133f063aab6c9977183d9e72835428", 100)
        True
        ```

### `allowance`
!!! description "`LPToken.allowance(arg0: address, arg1: address) -> uint256: view`"

    Getter method to check the allowance of `arg0` for funds of `arg1`.

    Returns: allowed amount (`uint256`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `arg0` |  `address` | Address of the spender |
    | `arg1` |  `address` | Address to the token owner |


    ??? quote "Source code"

        ```python hl_lines="1"
        allowance: public(HashMap[address, HashMap[address, uint256]])
        ```

    === "Example"

        ```shell
        >>> LPToken.allowance("0x7a16ff8270133f063aab6c9977183d9e72835428", "0xF29FfF074f5cF755b55FbB3eb10A29203ac91EA2")
        115792089237316195423570985008687907853269984665640564039457584007913129639935
        ```


### `increaseAllowance`
!!! description "`LPToken.increaseAllowance(_spender: address, _add_value: uint256) -> bool:`"

    Function to increase the allowance granted to `_spender`.

    Returns: True or False (`bool`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_spender` |  `address` | Address to increase the allowance of  |
    | `_add_value` |  `uint256` | Amount ot increase the allowance by |

    ??? quote "Source code"

        ```python hl_lines="1 4 20 22"
        allowance: public(HashMap[address, HashMap[address, uint256]])

        @external
        def increaseAllowance(_spender: address, _add_value: uint256) -> bool:
            """
            @notice Increase the allowance granted to `_spender`.
            @dev This function will never overflow, and instead will bound
                allowance to max_value(uint256). This has the potential to grant an
                infinite approval.
            @param _spender The account to increase the allowance of.
            @param _add_value The amount to increase the allowance by.
            @return bool Success
            """
            cached_allowance: uint256 = self.allowance[msg.sender][_spender]
            allowance: uint256 = unsafe_add(cached_allowance, _add_value)

            if allowance < cached_allowance:  # <-------------- Check for an overflow.
                allowance = max_value(uint256)

            if allowance != cached_allowance:
                self._approve(msg.sender, _spender, allowance)

            return True    
        ```

    === "Example"

        ```shell
        >>> LPToken.increaseAllowance("0x7a16ff8270133f063aab6c9977183d9e72835428", 100)
        True
        ```


### `decreaseAllowance`
!!! description "`LPToken.decreaseAllowance(_spender: address, _sub_value: uint256) -> bool`"

    Function to decrease the allowance granted to `_spender`.

    Returns: True or False (`bool`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_spender` |  `address` | Address to decrease the allowance of  |
    | `_sub_value` |  `uint256` | Amount ot decrease the allowance by |

    ??? quote "Source code"

        ```python hl_lines="1 4 20 22"
        allowance: public(HashMap[address, HashMap[address, uint256]])

        @external
        def decreaseAllowance(_spender: address, _sub_value: uint256) -> bool:
            """
            @notice Decrease the allowance granted to `_spender`.
            @dev This function will never underflow, and instead will bound
                allowance to 0.
            @param _spender The account to decrease the allowance of.
            @param _sub_value The amount to decrease the allowance by.
            @return bool Success.
            """
            cached_allowance: uint256 = self.allowance[msg.sender][_spender]
            allowance: uint256 = unsafe_sub(cached_allowance, _sub_value)

            if cached_allowance < allowance:  # <------------- Check for an underflow.
                allowance = 0

            if allowance != cached_allowance:
                self._approve(msg.sender, _spender, allowance)

            return True    
        ```

    === "Example"

        ```shell
        >>> LPToken.decreaseAllowance("0x7a16ff8270133f063aab6c9977183d9e72835428", 100)
        True
        ```


### `permit`
!!! description "`LPToken.permit( _owner: address, _spender: address, _value: uint256, _deadline: uint256, _v: uint8, _r: bytes32, _s: bytes32) -> bool:`"

    Function to permit `spender` to spend up to `_value` amount of `_owner`'s tokens via a signature.

    Returns: True (`bool`).

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

        ```python hl_lines="2 45 46"
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
        ```

    === "Example"

        ```shell
        >>> LPToken.permit(todo)
        todo
        ```