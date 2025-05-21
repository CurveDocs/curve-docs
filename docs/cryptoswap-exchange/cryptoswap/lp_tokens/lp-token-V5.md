The LP token and exchange contract for two-coin Cryptoswap pools are two separate contracts from each other. Newer versions, like Tricrypto-NG, combine both the LP token and exchange contract into a single contract.

The LP token contract is created from the **`token_implementation`** using the [**`create_forwarder_to()`**](https://docs.vyperlang.org/en/stable/built-in-functions.html?highlight=create_forwarder_to#chain-interaction) function, which is a built-in function in Vyper.

After deployment, the LP token contract is then initialized through the **`initialize()`** function.


!!!info
    Newer deployments might make use of blueprint contracts ([EIP-5202](https://eips.ethereum.org/EIPS/eip-5202)), eliminating the need for an **`initialize()`** function.



*To query the currently implemented LP token contract:*

```shell
>>> Factory.token_implementation()
'0xc08550A4cc5333f40e593eCc4C4724808085D304'
```


## **LP Token Info Methods**

### `name`
!!! description "`LPTokenV5.name() -> String[64]: view`"

    Getter for the name of the LP token.

    Returns: name (`String[64]`).

    ??? quote "Source code"

        ```vyper
        name: public(String[64])

        @external
        def initialize(_name: String[64], _symbol: String[32], _pool: address):
            assert self.minter == ZERO_ADDRESS  # dev: check that we call it from factory

            self.name = _name
            self.symbol = _symbol
            self.minter = _pool

            self.DOMAIN_SEPARATOR = keccak256(
                _abi_encode(EIP712_TYPEHASH, keccak256(_name), keccak256(VERSION), chain.id, self)
            )

            # fire a transfer event so block explorers identify the contract as an ERC20
            log Transfer(ZERO_ADDRESS, msg.sender, 0)
        ```

    === "Example"

        ```shell
        >>> LPTokenV5.name()
        'Curve.fi Factory Crypto Pool: LDO/ETH'
        ```


### `symbol`
!!! description "`LPTokenV5.symbol() -> String[32]: view`"

    Getter for the symbol of the LP token.

    Returns: symbol (`String[32]`).

    ??? quote "Source code"

        ```vyper
        symbol: public(String[32])

        @external
        def initialize(_name: String[64], _symbol: String[32], _pool: address):
            assert self.minter == ZERO_ADDRESS  # dev: check that we call it from factory

            self.name = _name
            self.symbol = _symbol
            self.minter = _pool

            self.DOMAIN_SEPARATOR = keccak256(
                _abi_encode(EIP712_TYPEHASH, keccak256(_name), keccak256(VERSION), chain.id, self)
            )

            # fire a transfer event so block explorers identify the contract as an ERC20
            log Transfer(ZERO_ADDRESS, msg.sender, 0)
        ```

    === "Example"

        ```shell
        >>> LPTokenV5.symbol()
        'LDOETH-f'
        ```


### `decimals`
!!! description "`LPTokenV5.decimals() -> uint8`"

    Getter for the decimals of the LP token.

    Returns: decimals (`uint8`).

    ??? quote "Source code"

        ```vyper
        @view
        @external
        def decimals() -> uint8:
            """
            @notice Get the number of decimals for this token
            @dev Implemented as a view method to reduce gas costs
            @return uint8 decimal places
            """
            return 18
        ```

    === "Example"

        ```shell
        >>> LPTokenV5.decimals()
        18
        ```


### `version`
!!! description "`LPTokenV5.version() -> String[8]:`"

    Getter for the version of the LP token.

    Returns: version (`String[8]`).

    ??? quote "Source code"

        ```vyper
        VERSION: constant(String[8]) = "v5.0.0"

        @view
        @external
        def version() -> String[8]:
            """
            @notice Get the version of this token contract
            """
            return VERSION
        ```

    === "Example"

        ```shell
        >>> LPTokenV5.version()
        'v5.0.0'
        ```


### `balanceOf`
!!! description "`LPTokenV5.balanceOf(arg0: address) -> uint256: view`"

    Getter for the LP token balance of an address.

    Returns: token balance (`uint256`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `arg0` |  `address` | Address to get the balance for |

    ??? quote "Source code"

        ```vyper
        balanceOf: public(HashMap[address, uint256])
        ```

    === "Example"

        ```shell
        >>> LPTokenV5.balanceOf("0xe5d5Aa1Bbe72F68dF42432813485cA1Fc998DE32")
        74284034901658384235023
        ```


### `totalSupply`
!!! description "`LPTokenV5.totalSupply() -> uint256: view`"

    Getter for the total supply of the LP token.

    Returns: total supply (`uint256`).

    ??? quote "Source code"

        ```vyper
        totalSupply: public(uint256)
        ```

    === "Example"

        ```shell
        >>> LPTokenV5.totalSupply()
        74357443715423884544842
        ```


### `minter`
!!! description "`LPTokenV5.totalSupply() -> uint256: view`"

    Getter for the minter contract of the LP token. Minter contract address is the liquidity pool itself.

    Returns: minter (`address`).

    ??? quote "Source code"

        ```vyper
        minter: public(address)

        @external
        def __init__():
            self.minter = 0x0000000000000000000000000000000000000001

        @external
        def initialize(_name: String[64], _symbol: String[32], _pool: address):
            assert self.minter == ZERO_ADDRESS  # dev: check that we call it from factory

            self.name = _name
            self.symbol = _symbol
            self.minter = _pool

            self.DOMAIN_SEPARATOR = keccak256(
                _abi_encode(EIP712_TYPEHASH, keccak256(_name), keccak256(VERSION), chain.id, self)
            )

            # fire a transfer event so block explorers identify the contract as an ERC20
            log Transfer(ZERO_ADDRESS, msg.sender, 0)
        ```

    === "Example"

        ```shell
        >>> LPTokenV5.minter()
        '0x9409280DC1e6D33AB7A8C6EC03e5763FB61772B5'
        ```



## **Allowance and Transfer Methods**
### `transfer`
!!! description "`LPTokenV5.transfer(_to: address, _value: uint256) -> bool`"

    Function to transfer `_value` token from `msg.sender` to `_to`.

    Returns: True (`bool`).

    Emits: `Transfer`

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_to` |  `address` | Address to transfer to |
    | `_value` |  `uint256` | Amount to transfer |

    ??? quote "Source code"

        ```vyper
        event Transfer:
            _from: indexed(address)
            _to: indexed(address)
            _value: uint256

        @external
        def transfer(_to: address, _value: uint256) -> bool:
            """
            @dev Transfer token for a specified address
            @param _to The address to transfer to.
            @param _value The amount to be transferred.
            """
            # NOTE: vyper does not allow underflows
            #       so the following subtraction would revert on insufficient balance
            self.balanceOf[msg.sender] -= _value
            self.balanceOf[_to] += _value

            log Transfer(msg.sender, _to, _value)
            return True
        ```

    === "Example"

        ```shell
        >>> LPToken.transfer("0xbabe61887f1de2713c6f97e567623453d3C79f67", 100)
        True
        ```


### `transferFrom`
!!! description "`LPTokenV5.transfer(_to: address, _value: uin256) -> bool:`"

    Function to transfer `_value` token from `msg.sender` to `_to`. Needs [`allowance`](#allowance) to successfully transfer on behalf of someone else.

    Returns: True or False (`bool`).

    Emits: `Transfer`

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_to` |  `address` | Address to transfer to |
    | `_value` |  `uint256` | Amount to transfer |

    ??? quote "Source code"

        ```vyper
        event Transfer:
            _from: indexed(address)
            _to: indexed(address)
            _value: uint256

        @external
        def transferFrom(_from: address, _to: address, _value: uint256) -> bool:
            """
            @dev Transfer tokens from one address to another.
            @param _from address The address which you want to send tokens from
            @param _to address The address which you want to transfer to
            @param _value uint256 the amount of tokens to be transferred
            """
            self.balanceOf[_from] -= _value
            self.balanceOf[_to] += _value

            _allowance: uint256 = self.allowance[_from][msg.sender]
            if _allowance != MAX_UINT256:
                self.allowance[_from][msg.sender] = _allowance - _value

            log Transfer(_from, _to, _value)
            return True
        ```

    === "Example"

        ```shell
        >>> LPToken.transferFrom("0xbabe61887f1de2713c6f97e567623453d3C79f67", 100)
        True
        ```


### `approve`
!!! description "`LPTokenV5.approve(_spender: address, _value: uint256) -> bool:`"

    Function to approve `_spender` to transfer `_value` on behalf of msg.sender.

    Returns: True (`bool`).

    Emits: `Approval`

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_spender` |  `address` | Address approved to spend funds |
    | `_value` |  `uint256` | Amount of tokens allowed to spend |

    ??? quote "Source code"

        ```vyper
        event Approval:
            _owner: indexed(address)
            _spender: indexed(address)
            _value: uint256

        @external
        def approve(_spender: address, _value: uint256) -> bool:
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
        ```

    === "Example"

        ```shell
        >>> LPToken.approve("todo")
        "todo"
        ```


### `permit`
!!! description "`LPTokenV5.permit(_owner: address, _spender: address, _value: uint256, _deadline: uint256, _v: uint8, _r: bytes32, _s: bytes32) -> bool::`"

    Function to approve the spender by the owner's signature to expend the owner's tokens.

    Returns: True (`bool`).

    Emits: `Approval`

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_to` |  `address` | Address to transfer to |
    | `_value` |  `uint256` | Amount to transfer |

    ??? quote "Source code"

        ```vyper
        event Approval:
            _owner: indexed(address)
            _spender: indexed(address)
            _value: uint256

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
            assert _owner != ZERO_ADDRESS
            assert block.timestamp <= _deadline

            nonce: uint256 = self.nonces[_owner]
            digest: bytes32 = keccak256(
                concat(
                    b"\x19\x01",
                    self.DOMAIN_SEPARATOR,
                    keccak256(_abi_encode(PERMIT_TYPEHASH, _owner, _spender, _value, nonce, _deadline))
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
        >>> LPTokenV5.permit()
        "todo"
        ```


### `allowance`
!!! description "`LPTokenV5.allowance(arg0: address, arg1: address) -> uint256: view`"

    Getter method to check the allowance of `arg0` for funds of `arg1`.

    Returns: allowed amount (`uint256`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `arg0` |  `address` | Address of the spender |
    | `arg0` |  `address` | Address to the token owner |

    ??? quote "Source code"

        ```vyper
        allowance: public(HashMap[address, HashMap[address, uint256]])
        ```

    === "Example"

        ```shell
        >>> LPTokenV5.allowance("todo")
        "todo"
        ```


### `increaseAllowance`
!!! description "`LPTokenV5.increaseAllowance(_spender: address, _added_value: uint256) -> bool:`"

    Function to increase the allowance granted to `_spender`.

    Returns: True or False (`bool`).

    Emits: `Approval`

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_spender` |  `address` | Address to increase the allowance of  |
    | `_added_value` |  `uint256` | Amount ot increase the allowance by |

    ??? quote "Source code"

        ```vyper
        event Approval:
            _owner: indexed(address)
            _spender: indexed(address)
            _value: uint256

        allowance: public(HashMap[address, HashMap[address, uint256]])

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
        >>> LPTokenV5.increaseAllowance("todo")
        "todo"
        ```


### `decreaseAllowance`
!!! description "`LPTokenV5.decreaseAllowance(_spender: address, _subtracted_value: uint256) -> bool:`"

    Function to decrease the allowance granted to `_spender`.

    Returns: True or False (`bool`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_spender` |  `address` | Address to decrease the allowance of  |
    | `_subtracted_value` |  `uint256` | Amount ot decrease the allowance by |

    ??? quote "Source code"

        ```vyper
        event Approval:
            _owner: indexed(address)
            _spender: indexed(address)
            _value: uint256

        allowance: public(HashMap[address, HashMap[address, uint256]])

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
        >>> LPTokenV5.allowance("todo")
        "todo"
        ```


## **Minting and Burning**

LP Tokens are minted when users deposit funds into the liquidity pool. Upon calling the `add_liquidity` function on the pool, it triggers the `mint` function of the LP Token to mint the corresponding tokens.
When liquidity is withdrawn using `remove_liquidity`, the LP tokens are burned through the `burnFrom` method.

The logic for both minting and burning the tokens resides in the pool contract.


### `mint`
!!! description "`LPTokenV5.mint(_to: address, _value: uint256) -> bool:`"

    !!!guard "Guarded Method"
        This function is only callable by the `minter` of the contract, which is the liquidity pool.

    Function to mint `_value` LP Tokens and transfer them to `_to`.

    Returns: True (`bool`).

    Emits: `Transfer`

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_spender` |  `address` | Address to decrease the allowance of  |
    | `_subtracted_value` |  `uint256` | Amount ot decrease the allowance by |

    ??? quote "Source code"

        ```vyper
        event Transfer:
            _from: indexed(address)
            _to: indexed(address)
            _value: uint256

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

            self.totalSupply += _value
            self.balanceOf[_to] += _value

            log Transfer(ZERO_ADDRESS, _to, _value)
            return True
        ```

    === "Example"

        ```shell
        >>> LPTokenV5.mint("todo")
        "todo"
        ```


### `burnFrom`
!!! description "`LPTokenV5.burnFrom(_to: address, _value: uint256) -> bool:`"

    Function to burn `_value` LP Tokens from `_to` and transfer them to `ZERO_ADDRESS`.

    Returns: True (`bool`).

    Emits: `Transfer`

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_spender` |  `address` | Address to decrease the allowance of  |
    | `_subtracted_value` |  `uint256` | Amount ot decrease the allowance by |

    ??? quote "Source code"

        ```vyper
        event Transfer:
            _from: indexed(address)
            _to: indexed(address)
            _value: uint256

        @external
        def burnFrom(_to: address, _value: uint256) -> bool:
            """
            @dev Burn an amount of the token from a given account.
            @param _to The account whose tokens will be burned.
            @param _value The amount that will be burned.
            """
            assert msg.sender == self.minter

            self.totalSupply -= _value
            self.balanceOf[_to] -= _value

            log Transfer(_to, ZERO_ADDRESS, _value)
            return True
        ```

    === "Example"

        ```shell
        >>> LPTokenV5.burnFrom("todo")
        "todo"
        ```



## **Initialize Method**

### `initialize`
!!! description "`LPTokenV5.initialize(_name: String[64], _symbol: String[32], _pool: address):`"

    Function to initialize the LP Token and setting name (`_name`), symbol (`_symbol`) and the corresponding liquidity pool (`_pool`).
    This function triggers a transfer event, enabling block explorers to recognize the contract as an ERC20.

    Emits: `Transfer`

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_name` |  `String[64]` | name of the lp token  |
    | `_symbol` |  `String[32]` | symbol of the lp token |
    | `_pool` |  `address` | liquidity pool address |

    ??? quote "Source code"

        ```vyper
        event Transfer:
            _from: indexed(address)
            _to: indexed(address)
            _value: uint256

        @external
        def initialize(_name: String[64], _symbol: String[32], _pool: address):
            assert self.minter == ZERO_ADDRESS  # dev: check that we call it from factory

            self.name = _name
            self.symbol = _symbol
            self.minter = _pool

            self.DOMAIN_SEPARATOR = keccak256(
                _abi_encode(EIP712_TYPEHASH, keccak256(_name), keccak256(VERSION), chain.id, self)
            )

            # fire a transfer event so block explorers identify the contract as an ERC20
            log Transfer(ZERO_ADDRESS, msg.sender, 0)
        ```

    === "Example"

        ```shell
        >>> LPTokenV5.initialize("todo")
        ```
