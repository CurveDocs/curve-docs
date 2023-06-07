todo



## QUERYING INFORMATIONS

### `DOMAIN_SEPERATOR`


### `decimals`
!!! description "`crvUSD.decimals() -> uint8: view`"

    Getter of the decimals of the token.

    Returns: **decimals** (`uint8`) of the token. 

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

    Returns: **name** (`String[64]`) of the token.

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

    Returns: **symbol** (`String[32]`) of the token.

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


### `salt` wtf is this???
!!! description "`crvUSD.salt() -> bytes32: view`"

    Getter for the salt of the token. 

    Returns: **salt** (`bytes32`) of the token.

    ??? quote "Source code"

        ```python hl_lines="1 10"
        salt: public(immutable(bytes32))
        
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
        >>> crvUSD.salt()
        '0xb99ba1c24ff7f96081ccd1ad26ffc380e2cc4c73b87f99e7a0165fa980b3b977'
        ```



### `allowance`
!!! description "`crvUSD.mintable_in_timeframe(start: uint256, end: uint256) -> uint256`"

    Getter for mintable supply from start timestamp till end timestamp.

    Returns: **amount of mintable tokens** (`uint256`) within two timestamps.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `start` |  `uint256` | Start (timestamp) |
    | `end` |  `uint256` | End (timestamp)  |

    ??? quote "Source code"

        ```python hl_lines="0"

        ```

    === "Example"
        ```shell
        >>> CRV.mintable_in_timeframe(1682892000, 1683496800)
        3726756852824660365468800
        ```

    !!! note
        For clarification: When using timestamps with a difference of 1, the mintable CRV tokens will equal to the current `rate`.


### `balanceOf`
### `totalSupply`
### `nonces`
### `minter`


## WRITING FUNCTIONS

### ``
### ``
### ``
### ``
### ``
### ``
### ``