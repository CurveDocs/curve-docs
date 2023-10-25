**Pool and LP tokens are the same smart contract.**

When coins are deposited into a Curve pool, the depositor receives pool LP (liquidity provider) tokens in return. Each Curve pool has its unique ERC20 contract representing these LP tokens, making them transferable. Holding these LP tokens allows for their deposit and staking in the pool's liquidity gauge, earning CRV token rewards.Additionally, if a metapool supports the LP token, it can be deposited there to receive the metapool's distinct LP tokens.


## **Transfer Methods**

### `transfer`
!!! description "`LPToken.transfer(_to : address, _value : uint256) -> bool:`"

    Function to transfer `_value` tokens to `_to`.

    Returns: true (`bool`).

    Emits: `Transfer`

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_to` |  `address` | address to transfer token to |
    | `_value` |  `uint256` | amount of tokens to transfer |

    ??? quote "Source code"

        ```python
        event Transfer:
            sender: indexed(address)
            receiver: indexed(address)
            value: uint256

        @external
        def transfer(_to : address, _value : uint256) -> bool:
            """
            @dev Transfer token for a specified address
            @param _to The address to transfer to.
            @param _value The amount to be transferred.
            """
            self._transfer(msg.sender, _to, _value)
            return True

        @internal
        def _transfer(_from: address, _to: address, _value: uint256):
            # # NOTE: vyper does not allow underflows
            # #       so the following subtraction would revert on insufficient balance
            self.balanceOf[_from] -= _value
            self.balanceOf[_to] += _value

            log Transfer(_from, _to, _value)
        ```

    === "Example"

        ```shell
        >>> LPToken.transfer('todo')
        'todo'
        ```


### `transferFrom`
!!! description "`LPToken.transferFrom(_from : address, _to : address, _value : uint256) -> bool:`"

    Function to transfer `_value` tokens from `_from` to `_to`.

    Returns: true (`bool`).

    Emits: `Transfer`

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_from` |  `address` | address to transfer token from |
    | `_to` |  `address` | address to transfer token to |
    | `_value` |  `uint256` | amount of tokens to transfer |

    ??? quote "Source code"

        ```python
        event Transfer:
            sender: indexed(address)
            receiver: indexed(address)
            value: uint256

        @external
        def transferFrom(_from : address, _to : address, _value : uint256) -> bool:
            """
            @dev Transfer tokens from one address to another.
            @param _from address The address which you want to send tokens from
            @param _to address The address which you want to transfer to
            @param _value uint256 the amount of tokens to be transferred
            """
            self._transfer(_from, _to, _value)

            _allowance: uint256 = self.allowance[_from][msg.sender]
            if _allowance != max_value(uint256):
                self.allowance[_from][msg.sender] = _allowance - _value

            return True

        @internal
        def _transfer(_from: address, _to: address, _value: uint256):
            # # NOTE: vyper does not allow underflows
            # #       so the following subtraction would revert on insufficient balance
            self.balanceOf[_from] -= _value
            self.balanceOf[_to] += _value

            log Transfer(_from, _to, _value)
        ```

    === "Example"

        ```shell
        >>> LPToken.transferFrom('todo')
        'todo'
        ```

## **Allowance Methods**

### `allowance`
!!! description "`LPToken.allowance(arg0: address, arg1: address) -> uint256: view`"

    Getter method to check the allowance of `arg0` for funds of `arg1`.

    Returns: allowed amount (`uint256`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `arg0` |  `address` | Address of the spender |
    | `arg1` |  `address` | Address of the token owner |

    ??? quote "Source code"

        ```python
        allowance: public(HashMap[address, HashMap[address, uint256]])
        ```

    === "Example"

        ```shell
        >>> LPToken.allowance('todo')
        'todo'
        ```


### `approve`
!!! description "`LPToken.approve(_spender : address, _value : uint256) -> bool:`"

    Function to approve `_spender` to transfer `_value` of tokens on behalf of `msg.sender`

    Returns: true (`bool`).

    Emits: `Approval`

    | Input       | Type      | Description                     |
    |-------------|-----------|---------------------------------|
    | `_spender`  | `address` | Address of the approved spender |
    | `_value`    | `uint256` | Amount of tokens to approve     |


    ??? quote "Source code"

        ```python
        event Approval:
            owner: indexed(address)
            spender: indexed(address)
            value: uint256

        @external
        def approve(_spender : address, _value : uint256) -> bool:
            """
            @notice Approve the passed address to transfer the specified amount of
                    tokens on behalf of msg.sender
            @dev Beware that changing an allowance via this method brings the risk that
                someone may use both the old and new allowance by unfortunate transaction
                ordering: https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
            @param _spender The address which will transfer the funds
            @param _value The amount of tokens that may be transferred
            @return bool success
            """
            self.allowance[msg.sender][_spender] = _value

            log Approval(msg.sender, _spender, _value)
            return True
        ```

    === "Example"

        ```shell
        >>> LPToken.approve('todo')
        'todo'
        ```


### `permit`
!!! description "`LPToken.permit(_owner: address, _spender: address, _value: uint256, _deadline: uint256, _v: uint8, _r: bytes32, _s: bytes32) -> bool:`"

    Function to permit `spender` to spend up to `_value` amount of `_owner`'s tokens via a signature.

    Returns: true (`bool`).

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

        ```python
        @external
        def permit(
            _owner: address,
            _spender: address,
            _value: uint256,
            _deadline: uint256,
            _v: uint8,
            _r: bytes32,
            _s: bytes32
        ) -> bool:
            """
            @notice Approves spender by owner's signature to expend owner's tokens.
                See https://eips.ethereum.org/EIPS/eip-2612.
            @dev Inspired by https://github.com/yearn/yearn-vaults/blob/main/contracts/Vault.vy#L753-L793
            @dev Supports smart contract wallets which implement ERC1271
                https://eips.ethereum.org/EIPS/eip-1271
            @param _owner The address which is a source of funds and has signed the Permit.
            @param _spender The address which is allowed to spend the funds.
            @param _value The amount of tokens to be spent.
            @param _deadline The timestamp after which the Permit is no longer valid.
            @param _v The bytes[64] of the valid secp256k1 signature of permit by owner
            @param _r The bytes[0:32] of the valid secp256k1 signature of permit by owner
            @param _s The bytes[32:64] of the valid secp256k1 signature of permit by owner
            @return True, if transaction completes successfully
            """
            assert _owner != empty(address)
            assert block.timestamp <= _deadline

            nonce: uint256 = self.nonces[_owner]
            digest: bytes32 = keccak256(
                concat(
                    b"\x19\x01",
                    self._domain_separator(),
                    keccak256(_abi_encode(EIP2612_TYPEHASH, _owner, _spender, _value, nonce, _deadline))
                )
            )

            if _owner.is_contract:
                sig: Bytes[65] = concat(_abi_encode(_r, _s), slice(convert(_v, bytes32), 31, 1))
                # reentrancy not a concern since this is a staticcall
                assert ERC1271(_owner).isValidSignature(digest, sig) == ERC1271_MAGIC_VAL
            else:
                assert ecrecover(digest, convert(_v, uint256), convert(_r, uint256), convert(_s, uint256)) == _owner

            self.allowance[_owner][_spender] = _value
            self.nonces[_owner] = nonce + 1

            log Approval(_owner, _spender, _value)
            return True
        ```

    === "Example"

        ```shell
        >>> LPToken.('todo')
        'todo'
        ```


## **Contract Info Methods**
### `name`
!!! description "`LPToken.name() -> String[64]: view`"

    Getter for the name of the LP token.

    Returns: name (`String[64]`).

    ??? quote "Source code"

        ```python
        name: public(immutable(String[64]))

        @external
        def __init__(
            _name: String[32],
            _symbol: String[10],
            _A: uint256,
            _fee: uint256,
            _offpeg_fee_multiplier: uint256,
            _ma_exp_time: uint256,
            _coins: DynArray[address, MAX_COINS],
            _rate_multipliers: DynArray[uint256, MAX_COINS],
            _asset_types: DynArray[uint8, MAX_COINS],
            _method_ids: DynArray[bytes4, MAX_COINS],
            _oracles: DynArray[address, MAX_COINS],
        ):
            """
            @notice Initialize the pool contract
            @param _name Name of the new plain pool.
            @param _symbol Symbol for the new plain pool.
            @param _A Amplification co-efficient - a lower value here means
                    less tolerance for imbalance within the pool's assets.
                    Suggested values include:
                    * Uncollateralized algorithmic stablecoins: 5-10
                    * Non-redeemable, collateralized assets: 100
                    * Redeemable assets: 200-400
            @param _fee Trade fee, given as an integer with 1e10 precision. The
                        the maximum is 1% (100000000).
                        50% of the fee is distributed to veCRV holders.
            @param _offpeg_fee_multiplier A multiplier that determines how much to increase
                                        Fees by when assets in the AMM depeg. Example value: 20000000000
            @param _ma_exp_time Averaging window of oracle. Set as time_in_seconds / ln(2)
                                Example: for 10 minute EMA, _ma_exp_time is 600 / ln(2) ~= 866
            @param _coins List of addresses of the coins being used in the pool.
            @param _rate_multipliers An array of: [10 ** (36 - _coins[n].decimals()), ... for n in range(N_COINS)]
            @param _asset_types Array of uint8 representing tokens in pool
            @param _method_ids Array of first four bytes of the Keccak-256 hash of the function signatures
                            of the oracle addresses that gives rate oracles.
                            Calculated as: keccak(text=event_signature.replace(" ", ""))[:4]
            @param _oracles Array of rate oracle addresses.
            """

            coins = _coins
            __n_coins: uint256 = len(_coins)
            N_COINS = __n_coins
            N_COINS_128 = convert(__n_coins, int128)

            for i in range(MAX_COINS):
                if i == __n_coins - 1:
                    break
                self.last_prices_packed.append(self.pack_2(10**18, 10**18))

            rate_multipliers = _rate_multipliers
            POOL_IS_REBASING_IMPLEMENTATION = 2 in _asset_types

            factory = Factory(msg.sender)

            A: uint256 = _A * A_PRECISION
            self.initial_A = A
            self.future_A = A
            self.fee = _fee
            self.offpeg_fee_multiplier = _offpeg_fee_multiplier

            assert _ma_exp_time != 0
            self.ma_exp_time = _ma_exp_time
            self.D_ma_time = 62324  # <--------- 12 hours default on contract start.
            self.ma_last_time = self.pack_2(block.timestamp, block.timestamp)

            for i in range(MAX_COINS_128):

                if i == N_COINS_128:
                    break

                self.oracles.append(convert(_method_ids[i], uint256) * 2**224 | convert(_oracles[i], uint256))

                #  --------------------------- initialize storage ---------------------------
                self.stored_balances.append(0)
                self.admin_balances.append(0)

            # --------------------------- ERC20 stuff ----------------------------

            name = _name
            symbol = _symbol

            # EIP712 related params -----------------
            NAME_HASH = keccak256(name)
            salt = block.prevhash
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

            # ------------------------ Fire a transfer event -------------------------

            log Transfer(empty(address), msg.sender, 0)
        ```

    === "Example"

        ```shell
        >>> LPToken.name()
        'todo'
        ```


### `symbol`
!!! description "`LPToken.symbol() -> String[32]: view`"

    Getter for the symbol of the LP token.

    Returns: symbol (`String[32]`).

    ??? quote "Source code"

        ```python
        symbol: public(immutable(String[32]))

        @external
        def __init__(
            _name: String[32],
            _symbol: String[10],
            _A: uint256,
            _fee: uint256,
            _offpeg_fee_multiplier: uint256,
            _ma_exp_time: uint256,
            _coins: DynArray[address, MAX_COINS],
            _rate_multipliers: DynArray[uint256, MAX_COINS],
            _asset_types: DynArray[uint8, MAX_COINS],
            _method_ids: DynArray[bytes4, MAX_COINS],
            _oracles: DynArray[address, MAX_COINS],
        ):
            """
            @notice Initialize the pool contract
            @param _name Name of the new plain pool.
            @param _symbol Symbol for the new plain pool.
            @param _A Amplification co-efficient - a lower value here means
                    less tolerance for imbalance within the pool's assets.
                    Suggested values include:
                    * Uncollateralized algorithmic stablecoins: 5-10
                    * Non-redeemable, collateralized assets: 100
                    * Redeemable assets: 200-400
            @param _fee Trade fee, given as an integer with 1e10 precision. The
                        the maximum is 1% (100000000).
                        50% of the fee is distributed to veCRV holders.
            @param _offpeg_fee_multiplier A multiplier that determines how much to increase
                                        Fees by when assets in the AMM depeg. Example value: 20000000000
            @param _ma_exp_time Averaging window of oracle. Set as time_in_seconds / ln(2)
                                Example: for 10 minute EMA, _ma_exp_time is 600 / ln(2) ~= 866
            @param _coins List of addresses of the coins being used in the pool.
            @param _rate_multipliers An array of: [10 ** (36 - _coins[n].decimals()), ... for n in range(N_COINS)]
            @param _asset_types Array of uint8 representing tokens in pool
            @param _method_ids Array of first four bytes of the Keccak-256 hash of the function signatures
                            of the oracle addresses that gives rate oracles.
                            Calculated as: keccak(text=event_signature.replace(" ", ""))[:4]
            @param _oracles Array of rate oracle addresses.
            """

            coins = _coins
            __n_coins: uint256 = len(_coins)
            N_COINS = __n_coins
            N_COINS_128 = convert(__n_coins, int128)

            for i in range(MAX_COINS):
                if i == __n_coins - 1:
                    break
                self.last_prices_packed.append(self.pack_2(10**18, 10**18))

            rate_multipliers = _rate_multipliers
            POOL_IS_REBASING_IMPLEMENTATION = 2 in _asset_types

            factory = Factory(msg.sender)

            A: uint256 = _A * A_PRECISION
            self.initial_A = A
            self.future_A = A
            self.fee = _fee
            self.offpeg_fee_multiplier = _offpeg_fee_multiplier

            assert _ma_exp_time != 0
            self.ma_exp_time = _ma_exp_time
            self.D_ma_time = 62324  # <--------- 12 hours default on contract start.
            self.ma_last_time = self.pack_2(block.timestamp, block.timestamp)

            for i in range(MAX_COINS_128):

                if i == N_COINS_128:
                    break

                self.oracles.append(convert(_method_ids[i], uint256) * 2**224 | convert(_oracles[i], uint256))

                #  --------------------------- initialize storage ---------------------------
                self.stored_balances.append(0)
                self.admin_balances.append(0)

            # --------------------------- ERC20 stuff ----------------------------

            name = _name
            symbol = _symbol

            # EIP712 related params -----------------
            NAME_HASH = keccak256(name)
            salt = block.prevhash
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

            # ------------------------ Fire a transfer event -------------------------

            log Transfer(empty(address), msg.sender, 0)
        ```

    === "Example"

        ```shell
        >>> LPToken.symbol('todo')
        'todo'
        ```


### `decimals`
!!! description "`LPToken.decimals() -> uint8: view`"

    Getter for the decimals of the LP token.

    Returns: decimals (uint8).

    ??? quote "Source code"

        ```python
        decimals: public(constant(uint8)) = 18

        @external
        def __init__(
            _name: String[32],
            _symbol: String[10],
            _A: uint256,
            _fee: uint256,
            _offpeg_fee_multiplier: uint256,
            _ma_exp_time: uint256,
            _coins: DynArray[address, MAX_COINS],
            _rate_multipliers: DynArray[uint256, MAX_COINS],
            _asset_types: DynArray[uint8, MAX_COINS],
            _method_ids: DynArray[bytes4, MAX_COINS],
            _oracles: DynArray[address, MAX_COINS],
        ):
            """
            @notice Initialize the pool contract
            @param _name Name of the new plain pool.
            @param _symbol Symbol for the new plain pool.
            @param _A Amplification co-efficient - a lower value here means
                    less tolerance for imbalance within the pool's assets.
                    Suggested values include:
                    * Uncollateralized algorithmic stablecoins: 5-10
                    * Non-redeemable, collateralized assets: 100
                    * Redeemable assets: 200-400
            @param _fee Trade fee, given as an integer with 1e10 precision. The
                        the maximum is 1% (100000000).
                        50% of the fee is distributed to veCRV holders.
            @param _offpeg_fee_multiplier A multiplier that determines how much to increase
                                        Fees by when assets in the AMM depeg. Example value: 20000000000
            @param _ma_exp_time Averaging window of oracle. Set as time_in_seconds / ln(2)
                                Example: for 10 minute EMA, _ma_exp_time is 600 / ln(2) ~= 866
            @param _coins List of addresses of the coins being used in the pool.
            @param _rate_multipliers An array of: [10 ** (36 - _coins[n].decimals()), ... for n in range(N_COINS)]
            @param _asset_types Array of uint8 representing tokens in pool
            @param _method_ids Array of first four bytes of the Keccak-256 hash of the function signatures
                            of the oracle addresses that gives rate oracles.
                            Calculated as: keccak(text=event_signature.replace(" ", ""))[:4]
            @param _oracles Array of rate oracle addresses.
            """

            coins = _coins
            __n_coins: uint256 = len(_coins)
            N_COINS = __n_coins
            N_COINS_128 = convert(__n_coins, int128)

            for i in range(MAX_COINS):
                if i == __n_coins - 1:
                    break
                self.last_prices_packed.append(self.pack_2(10**18, 10**18))

            rate_multipliers = _rate_multipliers
            POOL_IS_REBASING_IMPLEMENTATION = 2 in _asset_types

            factory = Factory(msg.sender)

            A: uint256 = _A * A_PRECISION
            self.initial_A = A
            self.future_A = A
            self.fee = _fee
            self.offpeg_fee_multiplier = _offpeg_fee_multiplier

            assert _ma_exp_time != 0
            self.ma_exp_time = _ma_exp_time
            self.D_ma_time = 62324  # <--------- 12 hours default on contract start.
            self.ma_last_time = self.pack_2(block.timestamp, block.timestamp)

            for i in range(MAX_COINS_128):

                if i == N_COINS_128:
                    break

                self.oracles.append(convert(_method_ids[i], uint256) * 2**224 | convert(_oracles[i], uint256))

                #  --------------------------- initialize storage ---------------------------
                self.stored_balances.append(0)
                self.admin_balances.append(0)

            # --------------------------- ERC20 stuff ----------------------------

            name = _name
            symbol = _symbol

            # EIP712 related params -----------------
            NAME_HASH = keccak256(name)
            salt = block.prevhash
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

            # ------------------------ Fire a transfer event -------------------------

            log Transfer(empty(address), msg.sender, 0)
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

    ??? quote "Source code"

        ```python
        version: public(constant(String[8])) = "v7.0.0"
        ```

    === "Example"

        ```shell
        >>> LPToken.version()
        "v7.0.0"
        ```


### `balanceOf`
!!! description "`LPToken.balanceOf(arg0: address) -> uint256: view`"

    Getter for the LP token balance of `arg0`.

    Returns: token balance (`uint256`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `arg0` |  `address` | address to check the balance of |

    ??? quote "Source code"

        ```python
        balanceOf: public(HashMap[address, uint256])
        ```

    === "Example"

        ```shell
        >>> LPToken.balanceOf('todo')
        'todo'
        ```


### `nonces`
!!! description "`LPToken.nonces(arg0: address) -> uint256: view`"

    Getter for the nonce.

    Returns: nonces (`uint256`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `arg0` |  `address` | address |

    ??? quote "Source code"

        ```python
        nonces: public(HashMap[address, uint256])
        ```

    === "Example"

        ```shell
        >>> LPToken.nonces('todo')
        'todo'
        ```


### `salt`
!!! description "`LPToken.salt() -> bytes32: view`"

    Getter for the salt of the LP token.

    Returns: salt (`bytes32`).

    ??? quote "Source code"

        ```python
        salt: public(immutable(bytes32))

        @external
        def __init__(
            _name: String[32],
            _symbol: String[10],
            _A: uint256,
            _fee: uint256,
            _offpeg_fee_multiplier: uint256,
            _ma_exp_time: uint256,
            _coins: DynArray[address, MAX_COINS],
            _rate_multipliers: DynArray[uint256, MAX_COINS],
            _asset_types: DynArray[uint8, MAX_COINS],
            _method_ids: DynArray[bytes4, MAX_COINS],
            _oracles: DynArray[address, MAX_COINS],
        ):
            """
            @notice Initialize the pool contract
            @param _name Name of the new plain pool.
            @param _symbol Symbol for the new plain pool.
            @param _A Amplification co-efficient - a lower value here means
                    less tolerance for imbalance within the pool's assets.
                    Suggested values include:
                    * Uncollateralized algorithmic stablecoins: 5-10
                    * Non-redeemable, collateralized assets: 100
                    * Redeemable assets: 200-400
            @param _fee Trade fee, given as an integer with 1e10 precision. The
                        the maximum is 1% (100000000).
                        50% of the fee is distributed to veCRV holders.
            @param _offpeg_fee_multiplier A multiplier that determines how much to increase
                                        Fees by when assets in the AMM depeg. Example value: 20000000000
            @param _ma_exp_time Averaging window of oracle. Set as time_in_seconds / ln(2)
                                Example: for 10 minute EMA, _ma_exp_time is 600 / ln(2) ~= 866
            @param _coins List of addresses of the coins being used in the pool.
            @param _rate_multipliers An array of: [10 ** (36 - _coins[n].decimals()), ... for n in range(N_COINS)]
            @param _asset_types Array of uint8 representing tokens in pool
            @param _method_ids Array of first four bytes of the Keccak-256 hash of the function signatures
                            of the oracle addresses that gives rate oracles.
                            Calculated as: keccak(text=event_signature.replace(" ", ""))[:4]
            @param _oracles Array of rate oracle addresses.
            """

            coins = _coins
            __n_coins: uint256 = len(_coins)
            N_COINS = __n_coins
            N_COINS_128 = convert(__n_coins, int128)

            for i in range(MAX_COINS):
                if i == __n_coins - 1:
                    break
                self.last_prices_packed.append(self.pack_2(10**18, 10**18))

            rate_multipliers = _rate_multipliers
            POOL_IS_REBASING_IMPLEMENTATION = 2 in _asset_types

            factory = Factory(msg.sender)

            A: uint256 = _A * A_PRECISION
            self.initial_A = A
            self.future_A = A
            self.fee = _fee
            self.offpeg_fee_multiplier = _offpeg_fee_multiplier

            assert _ma_exp_time != 0
            self.ma_exp_time = _ma_exp_time
            self.D_ma_time = 62324  # <--------- 12 hours default on contract start.
            self.ma_last_time = self.pack_2(block.timestamp, block.timestamp)

            for i in range(MAX_COINS_128):

                if i == N_COINS_128:
                    break

                self.oracles.append(convert(_method_ids[i], uint256) * 2**224 | convert(_oracles[i], uint256))

                #  --------------------------- initialize storage ---------------------------
                self.stored_balances.append(0)
                self.admin_balances.append(0)

            # --------------------------- ERC20 stuff ----------------------------

            name = _name
            symbol = _symbol

            # EIP712 related params -----------------
            NAME_HASH = keccak256(name)
            salt = block.prevhash
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

            # ------------------------ Fire a transfer event -------------------------

            log Transfer(empty(address), msg.sender, 0)
        ```

    === "Example"

        ```shell
        >>> LPToken.salt('todo')
        'todo'
        ```


### `DOMAIN_SEPERATOR`
!!! description "`LPToken.DOMAIN_SEPERATOR() -> bytes32: view`"

    Getter for the domain seperator.

    Returns: domain seperator (`bytes32`).

    ??? quote "Source code"

        ```python
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
        >>> LPToken.DOMAIN_SEPERATOR('todo')
        'todo'
        ```