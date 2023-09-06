<h1> </h1>

**Curve DAO Token (CRV)** is based on the ERC-20 token standard as defined at https://eips.ethereum.org/EIPS/eip-20.

!!! info
    **Curve DAO Token** contract is deployed to the Ethereum mainnet at: [0xD533a949740bb3306d119CC777fa900bA034cd52](https://etherscan.io/address/0xD533a949740bb3306d119CC777fa900bA034cd52#code).

    Transaction of Curve DAO Token deployment: https://etherscan.io/tx/0x5dc4a688b63cea09bf4d73a695175b77572792a2e2b3656297809ad3596d4bfe

    Source code of the Curve DAO Token contract can be found on [Github](https://github.com/curvefi/curve-dao-contracts/blob/master/contracts/ERC20CRV.vy).



| Allocation | More about the release schedule [here](https://dao.curve.fi/releaseschedule) |
| ------| --------------------------|
| `57%` |`Inflation`                | 
| `30%` |`Shareholder (team and investors)` | 
| `5%`  |`DAO-controlled reserve`   | 
| `5%`  |`Early user`               | 
| `3%`  |`Employees`                | 


## **Contract Info Methods** 

### `admin`
!!! description "`CRV.admin() -> address: view`"

    Getter for the admin of the contract.

    Returns: admin (`address`).

    ??? quote "Source code"

        ```python hl_lines="1 17"
        admin: public(address)

        @external
        def __init__(_name: String[64], _symbol: String[32], _decimals: uint256):
            """
            @notice Contract constructor
            @param _name Token full name
            @param _symbol Token symbol
            @param _decimals Number of decimals for token
            """
            init_supply: uint256 = INITIAL_SUPPLY * 10 ** _decimals
            self.name = _name
            self.symbol = _symbol
            self.decimals = _decimals
            self.balanceOf[msg.sender] = init_supply
            self.total_supply = init_supply
            self.admin = msg.sender
            log Transfer(ZERO_ADDRESS, msg.sender, init_supply)

            self.start_epoch_time = block.timestamp + INFLATION_DELAY - RATE_REDUCTION_TIME
            self.mining_epoch = -1
            self.rate = 0
            self.start_epoch_supply = init_supply
        ```

    === "Example" 
        ```shell
        >>> CRV.admin()
        '0x40907540d8a6C65c637785e8f8B742ae6b0b9968'
        ```
        

### `name`
!!! description "`CRV.name() -> String[64]`"

    Getter for the name of the token.

    Returns: token name (`String[64]`).

    !!! note
        Token name be changed by calling the `set_name()` function.

    ??? quote "Source code"

        ```python hl_lines="1 4 7 12"
        name: public(String[64])

        @external
        def __init__(_name: String[64], _symbol: String[32], _decimals: uint256):
            """
            @notice Contract constructor
            @param _name Token full name
            @param _symbol Token symbol
            @param _decimals Number of decimals for token
            """
            init_supply: uint256 = INITIAL_SUPPLY * 10 ** _decimals
            self.name = _name
            self.symbol = _symbol
            self.decimals = _decimals
            self.balanceOf[msg.sender] = init_supply
            self.total_supply = init_supply
            self.admin = msg.sender
            log Transfer(ZERO_ADDRESS, msg.sender, init_supply)

            self.start_epoch_time = block.timestamp + INFLATION_DELAY - RATE_REDUCTION_TIME
            self.mining_epoch = -1
            self.rate = 0
            self.start_epoch_supply = init_supply
        ```

    === "Example"
        ```shell
        >>> CRV.name()
        'Curve DAO Token'
        ```


### `symbol`
!!! description "`CRV.symbol() -> String[32]`"

    Getter of the token symbol.

    Returns: token symbol (`String[32]`).
    
    !!! note
        Token symbol be changed by calling the `set_name()` function.

    ??? quote "Source code"

        ```python hl_lines="1 4 8 13"
        symbol: public(String[32])

        @external
        def __init__(_name: String[64], _symbol: String[32], _decimals: uint256):
            """
            @notice Contract constructor
            @param _name Token full name
            @param _symbol Token symbol
            @param _decimals Number of decimals for token
            """
            init_supply: uint256 = INITIAL_SUPPLY * 10 ** _decimals
            self.name = _name
            self.symbol = _symbol
            self.decimals = _decimals
            self.balanceOf[msg.sender] = init_supply
            self.total_supply = init_supply
            self.admin = msg.sender
            log Transfer(ZERO_ADDRESS, msg.sender, init_supply)

            self.start_epoch_time = block.timestamp + INFLATION_DELAY - RATE_REDUCTION_TIME
            self.mining_epoch = -1
            self.rate = 0
            self.start_epoch_supply = init_supply
        ```

    === "Example"
        ```shell
        >>> CRV.symbol()
        'CRV'
        ```


### `avaliable_supply`
!!! description "`CRV.avaliably_supply() -> uint256`"

    Getter for the current number of CRV tokens in existence (claimed or unclaimed).

    Returns: number of tokens (`uint256`).

    ??? quote "Source code"

        ```python hl_lines="3 8 12"
        @internal
        @view
        def _available_supply() -> uint256:
            return self.start_epoch_supply + (block.timestamp - self.start_epoch_time) * self.rate

        @external
        @view
        def available_supply() -> uint256:
            """
            @notice Current number of tokens in existence (claimed or unclaimed)
            """
            return self._available_supply()
        ```
    === "Example"
        ```shell
        >>> CRV.avaliable_supply()
        1953676805157446496269106603
        ```

### `totalSupply`
!!! description "`CRV.totalSupply() -> uint256`"

    Getter for the total number of tokens in existence.

    Returns: total supply (`uint256`).

    ??? quote "Source code"

        ```python hl_lines="3"
        @external
        @view
        def totalSupply() -> uint256:
            """
            @notice Total number of tokens in existence.
            """
            return self.total_supply
        ```

    === "Example"
        ```shell
        >>> CRV.totalSupply()
        1950555367872773429287303134
        ```


### `allowance`
!!! description "`CRV.allowance(_owner: address, _spender: address) -> uint256`"

    Getter method to check the amount of tokens that an owner allowed to a spender.

    Returns: amount of tokens (`uint256`) the `_owner` allowed to `_spender`.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_owner` |  `address` | Owner Address |
    | `_spender` |  `address` | Spender Address  |

    ??? quote "Source code"

        ```python hl_lines="1 5"
        allowances: HashMap[address, HashMap[address, uint256]]

        @external
        @view
        def allowance(_owner : address, _spender : address) -> uint256:
            """
            @notice Check the amount of tokens that an owner allowed to a spender
            @param _owner The address which owns the funds
            @param _spender The address which will spend the funds
            @return uint256 specifying the amount of tokens still available for the spender
            """
            return self.allowances[_owner][_spender]
        ```

    === "Example"
        ```shell
        >>> CRV.allowance(0x7a16fF8270133F063aAb6C9977183D9e72835428 ,0x68BEDE1d0bc6BE6d215f8f8Ee4ee8F9faB97fE7a)
        0
        ```


### `decimals`
!!! description "`CRV.decimals() -> uint256: view`"

    Getter of the decimals of the token.

    Returns: decimals (`uint256`).    

    ??? quote "Source code"

        ```python hl_lines="1 4 9 14"
        decimals: public(uint256)

        @external
        def __init__(_name: String[64], _symbol: String[32], _decimals: uint256):
            """
            @notice Contract constructor
            @param _name Token full name
            @param _symbol Token symbol
            @param _decimals Number of decimals for token
            """
            init_supply: uint256 = INITIAL_SUPPLY * 10 ** _decimals
            self.name = _name
            self.symbol = _symbol
            self.decimals = _decimals
            self.balanceOf[msg.sender] = init_supply
            self.total_supply = init_supply
            self.admin = msg.sender
            log Transfer(ZERO_ADDRESS, msg.sender, init_supply)

            self.start_epoch_time = block.timestamp + INFLATION_DELAY - RATE_REDUCTION_TIME
            self.mining_epoch = -1
            self.rate = 0
            self.start_epoch_supply = init_supply
        ```

    === "Example"  
        ```shell
        >>> CRV.decimals()
        18
        ```


### `balanceOf`
!!! description "`CRV.balanceOf(arg0: address) -> address: view`"

    Getter for the $CRV balance of a specific address.

    Returns: $CRV balance (`uint256`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `arg0` |  `address` | Wallet to check $CRV balance for |


    ??? quote "Source code"

        ```python hl_lines="1"
        balanceOf: public(HashMap[address, uint256])
        ```

    === "Example"
        ```shell
        >>> CRV.balanceOf('0xd061D61a4d941c39E5453435B6345Dc261C2fcE0')
        2187980063734121847368
        ```


## **Minting and Burning**

### `minter`
!!! description "`CRV.minter() -> address: view`"

    Getter for the minter contract address.

    Returns: `address` of the **minter contract**.

    !!! note
        Minter contract can be changed by calling the `set_minter()` function.

    ??? quote "Source code"

        ```python hl_lines="1"
        minter: public(address)
        ```

    === "Example"
        ```shell
        >>> CRV.minter()
        '0xd061D61a4d941c39E5453435B6345Dc261C2fcE0'
        ```



### `mint`
!!! description "`CRV.mint(_to: address, _value: uint256) -> bool:`"

    Function to mint `_value (uint256)` and assign them to `_to (address)`.

    Emits: `Transfer`

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_to` |  `address` | Assigned Wallet |
    | `_value` |  `uint256` | Value To Mint  |

    ??? quote "Source code"

        ```python hl_lines="7 9"
        event Transfer:
            _from: indexed(address)
            _to: indexed(address)
            _value: uint256

        @external
        def mint(_to: address, _value: uint256) -> bool:
            """
            @notice Mint `_value` tokens and assign them to `_to`
            @dev Emits a Transfer event originating from 0x00
            @param _to The account that will receive the created tokens
            @param _value The amount that will be created
            @return bool success
            """
            assert msg.sender == self.minter  # dev: minter only
            assert _to != ZERO_ADDRESS  # dev: zero address

            if block.timestamp >= self.start_epoch_time + RATE_REDUCTION_TIME:
                self._update_mining_parameters()

            _total_supply: uint256 = self.total_supply + _value
            assert _total_supply <= self._available_supply()  # dev: exceeds allowable mint amount
            self.total_supply = _total_supply

            self.balanceOf[_to] += _value
            log Transfer(ZERO_ADDRESS, _to, _value)

            return True
        ```

    === "Example"
        ```shell
        >>> CRV.mint("0x0000000000000000000000000000000000000000", 1000000000000000000)
        False
        ```


### `burn`
!!! description "`CRV.burn(_value: uint256) -> bool`"
    
    Function to burn `_value` tokens belonging to the caller of the function.

    Retruns: True or False (`bool`)

    Emits: `Transfer`

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_value` |  `uint256` | Value To Burn |

    ??? quote "Source code"

        ```python hl_lines="2 4"
        @external
        def burn(_value: uint256) -> bool:
            """
            @notice Burn `_value` tokens belonging to `msg.sender`
            @dev Emits a Transfer event with a destination of 0x00
            @param _value The amount that will be burned
            @return bool success
            """
            self.balanceOf[msg.sender] -= _value
            self.total_supply -= _value

            log Transfer(msg.sender, ZERO_ADDRESS, _value)
            return True
        ```

    === "Example"   
        ```shell
        >>> CRV.burn(1000000000000000000)
        True
        ```

### `mintable_in_timeframe`
!!! description "`CRV.mintable_in_timeframe(start: uint256, end: uint256) -> uint256`"

    Getter for mintable supply from start timestamp till end timestamp.

    Returns: amount of mintable tokens (`uint256`) within two timestamps.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `start` |  `uint256` | Start (timestamp) |
    | `end` |  `uint256` | End (timestamp)  |

    ??? quote "Source code"

        ```python hl_lines="3"
        @external
        @view
        def mintable_in_timeframe(start: uint256, end: uint256) -> uint256:
            """
            @notice How much supply is mintable from start timestamp till end timestamp
            @param start Start of the time interval (timestamp)
            @param end End of the time interval (timestamp)
            @return Tokens mintable from `start` till `end`
            """
            assert start <= end  # dev: start > end
            to_mint: uint256 = 0
            current_epoch_time: uint256 = self.start_epoch_time
            current_rate: uint256 = self.rate

            # Special case if end is in future (not yet minted) epoch
            if end > current_epoch_time + RATE_REDUCTION_TIME:
                current_epoch_time += RATE_REDUCTION_TIME
                current_rate = current_rate * RATE_DENOMINATOR / RATE_REDUCTION_COEFFICIENT

            assert end <= current_epoch_time + RATE_REDUCTION_TIME  # dev: too far in future

            for i in range(999):  # Curve will not work in 1000 years. Darn!
                if end >= current_epoch_time:
                    current_end: uint256 = end
                    if current_end > current_epoch_time + RATE_REDUCTION_TIME:
                        current_end = current_epoch_time + RATE_REDUCTION_TIME

                    current_start: uint256 = start
                    if current_start >= current_epoch_time + RATE_REDUCTION_TIME:
                        break  # We should never get here but what if...
                    elif current_start < current_epoch_time:
                        current_start = current_epoch_time

                    to_mint += current_rate * (current_end - current_start)

                    if start >= current_epoch_time:
                        break

                current_epoch_time -= RATE_REDUCTION_TIME
                current_rate = current_rate * RATE_REDUCTION_COEFFICIENT / RATE_DENOMINATOR  # double-division with rounding made rate a bit less => good
                assert current_rate <= INITIAL_RATE  # This should never happen

            return to_mint
        ```

    === "Example"
        ```shell
        >>> CRV.mintable_in_timeframe(1682892000, 1683496800)
        3726756852824660365468800
        ```

    !!!info
        For clarification: When using timestamps with a difference of 1, the mintable CRV tokens will equal to the current `rate`.



## **$CRV Emissions**

Mining parameters are used to determine the token emissions. The emissions are based on epochs (one year). With every passing epoch, the `rate` will be reduced, thereby reducing the entire $CRV emissions.

The rate can be reduced by invoking the `update_mining_parameters()` function. While this function is accessible to anyone, an attempt to call it will be reverted if a year hasn't elapsed since the last update. When the function is successfully executed, the `mining_epoch` increments by 1, and the `start_epoch_time` is updated to the timestamp of that function call. Moreover, the `update_mining_parameters()` function will be automatically triggered if someone tries to mint CRV before the scheduled rate reduction.

$$rate_{future} = rate_{current} * \frac{\text{RATE_DENOMINATOR}}{\text{RATE_REDUCTION_COEFFICIENT}}$$

*with*:

$\text{RATE_DENOMINATOR} =  10^{18}$
$\text{RATE_REDUCTION_COEFFICIENT} = 2^{\frac{1}{4}} * 10^{18}$

*Effectively, every rate reduction decreases the $CRV inflation by around 15.9%.*


### `mining_epoch`
!!! description "`CRV.mining_epoch() -> int128: view`"

    Getter for the current mining epoch. The mining epoch is incremented by 1 every time `update_mining_parameters()` is successfully called. At deployment, `mining_epoch` was set to -1.

    Returns: mining epoch (`int128`).

    ??? quote "Source code"

        ```python hl_lines="1 21 34"
        mining_epoch: public(int128)

        @external
        def __init__(_name: String[64], _symbol: String[32], _decimals: uint256):
            """
            @notice Contract constructor
            @param _name Token full name
            @param _symbol Token symbol
            @param _decimals Number of decimals for token
            """
            init_supply: uint256 = INITIAL_SUPPLY * 10 ** _decimals
            self.name = _name
            self.symbol = _symbol
            self.decimals = _decimals
            self.balanceOf[msg.sender] = init_supply
            self.total_supply = init_supply
            self.admin = msg.sender
            log Transfer(ZERO_ADDRESS, msg.sender, init_supply)

            self.start_epoch_time = block.timestamp + INFLATION_DELAY - RATE_REDUCTION_TIME
            self.mining_epoch = -1
            self.rate = 0
            self.start_epoch_supply = init_supply

        @internal
        def _update_mining_parameters():
            """
            @dev Update mining rate and supply at the start of the epoch
                Any modifying mining call must also call this
            """
            _rate: uint256 = self.rate
            _start_epoch_supply: uint256 = self.start_epoch_supply

            self.start_epoch_time += RATE_REDUCTION_TIME
            self.mining_epoch += 1

            if _rate == 0:
                _rate = INITIAL_RATE
            else:
                _start_epoch_supply += _rate * RATE_REDUCTION_TIME
                self.start_epoch_supply = _start_epoch_supply
                _rate = _rate * RATE_DENOMINATOR / RATE_REDUCTION_COEFFICIENT

            self.rate = _rate

            log UpdateMiningParameters(block.timestamp, _rate, _start_epoch_supply)
        ```

    === "Example" 
        ```shell
        >>> CRV.mining_epoch()
        2
        ```


### `start_epoch_time`
!!! description "`CRV.start_epoch_time() -> uint256: view`"

    Getter for the start times of the current mining epoch.

    Returns: timestamp (`uint256`).

    ??? quote "Source code"

        ```python hl_lines="1 20"
        start_epoch_time: public(uint256)

        @external
        def __init__(_name: String[64], _symbol: String[32], _decimals: uint256):
            """
            @notice Contract constructor
            @param _name Token full name
            @param _symbol Token symbol
            @param _decimals Number of decimals for token
            """
            init_supply: uint256 = INITIAL_SUPPLY * 10 ** _decimals
            self.name = _name
            self.symbol = _symbol
            self.decimals = _decimals
            self.balanceOf[msg.sender] = init_supply
            self.total_supply = init_supply
            self.admin = msg.sender
            log Transfer(ZERO_ADDRESS, msg.sender, init_supply)

            self.start_epoch_time = block.timestamp + INFLATION_DELAY - RATE_REDUCTION_TIME
            self.mining_epoch = -1
            self.rate = 0
            self.start_epoch_supply = init_supply
        ```

    === "Example"
        ```shell
        >>> CRV.start_epoch_time()
        1660429048 -> 'Sat Aug 13 2022 22:17:28 GMT+0000'
        ```


### `rate`
!!! description "`CRV.rate() -> uint256: view`"

    Getter for the current rate of CRV emissions.

    Returns: current rate (`uint256`).

    !!!tip
        Rate is denominated in emissions per second.   
        Emissions per day: 6.161965695807970181 * 86400 = 532393.8361178086

    ??? quote "Source code"

        ```python hl_lines="1 22"
        rate: public(uint256)

        @external
        def __init__(_name: String[64], _symbol: String[32], _decimals: uint256):
            """
            @notice Contract constructor
            @param _name Token full name
            @param _symbol Token symbol
            @param _decimals Number of decimals for token
            """
            init_supply: uint256 = INITIAL_SUPPLY * 10 ** _decimals
            self.name = _name
            self.symbol = _symbol
            self.decimals = _decimals
            self.balanceOf[msg.sender] = init_supply
            self.total_supply = init_supply
            self.admin = msg.sender
            log Transfer(ZERO_ADDRESS, msg.sender, init_supply)

            self.start_epoch_time = block.timestamp + INFLATION_DELAY - RATE_REDUCTION_TIME
            self.mining_epoch = -1
            self.rate = 0
            self.start_epoch_supply = init_supply
        ```

    === "Example"
        ```shell
        >>> rate()
        6161965695807970181
        ```



### `update_mining_parameters` 
!!! description "`update_mining_parameters()`"

    Function to update the mining parameters for the Curve DAO Token ($CRV).  

    Emits: `UpdateMiningParameters`

    !!!note
        This function can be called by anyone. However, the call will revert if `block.timestamp` is less than or equal to `start_epoch_time` + `RATE_REDUCTION_TIME`, indicating that one year has not yet passed.


    ??? quote "Source code"

        ```python hl_lines="1 22 45"
        event UpdateMiningParameters:
            time: uint256
            rate: uint256
            supply: uint256

        # Supply parameters
        INITIAL_SUPPLY: constant(uint256) = 1_303_030_303
        INITIAL_RATE: constant(uint256) = 274_815_283 * 10 ** 18 / YEAR  # leading to 43% premine
        RATE_REDUCTION_TIME: constant(uint256) = YEAR
        RATE_REDUCTION_COEFFICIENT: constant(uint256) = 1189207115002721024  # 2 ** (1/4) * 1e18
        RATE_DENOMINATOR: constant(uint256) = 10 ** 18
        INFLATION_DELAY: constant(uint256) = 86400

        # Supply variables
        mining_epoch: public(int128)
        start_epoch_time: public(uint256)
        rate: public(uint256)

        start_epoch_supply: uint256

        @external
        def update_mining_parameters():
            """
            @notice Update mining rate and supply at the start of the epoch
            @dev Callable by any address, but only once per epoch
                Total supply becomes slightly larger if this function is called late
            """
            assert block.timestamp >= self.start_epoch_time + RATE_REDUCTION_TIME  # dev: too soon!
            self._update_mining_parameters()

        @internal
        def _update_mining_parameters():
            """
            @dev Update mining rate and supply at the start of the epoch
                Any modifying mining call must also call this
            """
            _rate: uint256 = self.rate
            _start_epoch_supply: uint256 = self.start_epoch_supply

            self.start_epoch_time += RATE_REDUCTION_TIME
            self.mining_epoch += 1

            if _rate == 0:
                _rate = INITIAL_RATE
            else:
                _start_epoch_supply += _rate * RATE_REDUCTION_TIME
                self.start_epoch_supply = _start_epoch_supply
                _rate = _rate * RATE_DENOMINATOR / RATE_REDUCTION_COEFFICIENT

            self.rate = _rate

            log UpdateMiningParameters(block.timestamp, _rate, _start_epoch_supply)
        ```

    === "Example"
        ```shell
        >>> update_mining_parameters()
        ```


### `start_epoch_time_write`
!!! description "`CRV.start_epoch_time_write() -> uint256`"

    Function to get the current mining epoch start while simultaneously updating mining parameters (if possible).

    Returns: timestamp (`uint256`).

    ??? quote "Source code"

        ```python hl_lines="4 13 15"
        start_epoch_time: public(uint256)

        @external
        def start_epoch_time_write() -> uint256:
            """
            @notice Get timestamp of the current mining epoch start
                    while simultaneously updating mining parameters
            @return Timestamp of the epoch
            """
            _start_epoch_time: uint256 = self.start_epoch_time
            if block.timestamp >= _start_epoch_time + RATE_REDUCTION_TIME:
                self._update_mining_parameters()
                return self.start_epoch_time
            else:
                return _start_epoch_time
        ```

    === "Example"
        ```shell
        >>> CRV.start_epoch_time_write()
        ```


### `future_epoch_time_write`
!!! description "`CRV.future_epoch_time_write() -> uint256`"

    Function to get the next mining epoch start while simultaneously updating mining parameters (if possible).

    Returns: timestamp (`uint256`).

    ??? quote "Source code"

        ```python hl_lines="2"
        @external
        def future_epoch_time_write() -> uint256:
            """
            @notice Get timestamp of the next mining epoch start
                    while simultaneously updating mining parameters
            @return Timestamp of the next epoch
            """
            _start_epoch_time: uint256 = self.start_epoch_time
            if block.timestamp >= _start_epoch_time + RATE_REDUCTION_TIME:
                self._update_mining_parameters()
                return self.start_epoch_time + RATE_REDUCTION_TIME
            else:
                return _start_epoch_time + RATE_REDUCTION_TIME
        ```

    === "Example"
        ```shell
        >>> CRV.future_epoch_time_write()
        ```