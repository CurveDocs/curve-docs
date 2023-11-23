## **Overview**

The simplest Curve pool is a plain pool, which is an implementation of the StableSwap invariant for two or more tokens. 
The key characteristic of a plain pool is that the pool contract holds all deposited assets at **all** times.

An example of a Curve plain pool is [3Pool](https://github.com/curvefi/curve-contract/tree/master/contracts/pools/3pool), 
which contains the tokens `DAI`, `USDC` and `USDT`.

!!! note
    The API of plain pools is also implemented by lending and metapools.

The following Brownie console interaction examples are using 
[EURS](https://etherscan.io/address/0x0Ce6a5fF5217e38315f87032CF90686C96627CAA) Pool. The template source code for plain
pools may be viewed on 
[GitHub](https://github.com/curvefi/curve-contract/blob/master/contracts/pool-templates/base/SwapTemplateBase.vy).

## **Pool Info Methods**

### `coins`

!!! description "`StableSwap.coins(i: uint256) → address: view`"

    Getter for the array of swappable coins within the pool.

    Returns: coin address (`address`) for coin index `i`.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `i`       |  `uint256` | coin index |

    ??? quote "Source code"

<<<<<<< HEAD
        ```python
=======
        ```vyper hl_lines="1 8 17 23 24 25"
>>>>>>> a27909d5f421a1329ee4ba7044091ebfd75305e3
        coins: public(address[N_COINS])

        ...

        @external
        def __init__(
            _owner: address,
            _coins: address[N_COINS],
            _pool_token: address,
            _A: uint256,
            _fee: uint256,
            _admin_fee: uint256
        ):
            """
            @notice Contract constructor
            @param _owner Contract owner address
            @param _coins Addresses of ERC20 contracts of coins
            @param _pool_token Address of the token representing LP share
            @param _A Amplification coefficient multiplied by n * (n - 1)
            @param _fee Fee to charge for exchanges
            @param _admin_fee Admin fee
            """
            for i in range(N_COINS):
                assert _coins[i] != ZERO_ADDRESS
            self.coins = _coins
            ...
        ```

    === "Example"
        
        ```shell
        >>> StableSwap.coin(0)
        '0xdB25f211AB05b1c97D595516F45794528a807ad8'
        ```


### `balances`
!!! description "`StableSwap.balances(i: uint256) → uint256: view`"

    Getter for the pool balances array.

    Returns: Balance of coin (`uint256`) at index `i`.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `i`       |  `uint256` | Coin index |
        
    === "Example"
    
        ```shell
        >>> StableSwap.balances(0)
        2918187395
        ```


### `owner`
!!! description "`StableSwap.owner() → address: view`"

    Getter for the admin/owner of the pool contract.

    Returns: `address` of the admin of the pool contract.

    ??? quote "Source code"
<<<<<<< HEAD
=======
    
        ```vyper hl_lines="1 7 16 30"
        owner: public(address)
>>>>>>> a27909d5f421a1329ee4ba7044091ebfd75305e3

        ```python
        owner: public(address)

        @external
        def __init__(
            _owner: address,
            _coins: address[N_COINS],
            _pool_token: address,
            _A: uint256,
            _fee: uint256,
            _admin_fee: uint256
        ):
            """
            @notice Contract constructor
            @param _owner Contract owner address
            @param _coins Addresses of ERC20 contracts of coins
            @param _pool_token Address of the token representing LP share
            @param _A Amplification coefficient multiplied by n * (n - 1)
            @param _fee Fee to charge for exchanges
            @param _admin_fee Admin fee
            """
            ...
            self.owner = _owner
            ...
        ```
        
    === "Example"
    
        ```shell
        >>> StableSwap.owner()
        '0xeCb456EA5365865EbAb8a2661B0c503410e9B347'
        ```


### `lp_token`
!!! description "`StableSwap.lp_token() → address: view`"

    Getter for the LP token of the pool.

    Returns: lp token (`address`).
        
    !!! note
        In older Curve pools ``lp_token`` may not be ``public`` and thus not visible.

    === "Example"
    
        ```shell
        >>> pool.lp_token()
        '0x194eBd173F6cDacE046C53eACcE9B953F28411d1'
        ```



### `A`
!!! description "`StableSwap.A() → uint256: view`"

    Getter for the amplification coefficient of the pool.

    Returns: A (`uint256`).

    !!! note
        The amplification coefficient is scaled by ``A_PRECISION`` (``=100``)

    ??? quote "Source code"

        ```vyper
        A_PRECISION: constant(uint256) = 100

        @view
        @external
        def A() -> uint256:
            return self._A() / A_PRECISION
        ```
        
    === "Example"
    
        ```shell
        >>> pool.A()
        100
        ```



### `A_precise`
!!! description "`StableSwap.A_precise() → uint256: view`"

    Getter for the unscaled amplification coefficient of the pool.

    ??? quote "Source code"

        ```vyper
        @view
        @external
        def A_precise() -> uint256:
            return self._A()
        ```
        
    === "Example"
    
        ```shell
        >>> pool.A_precise()
        10000
        ```


### `get_virtual_price`
!!! description "`StableSwap.get_virtual_price() → uint256: view`"

    Current virtual price of the pool LP token relative to the underlying pool assets.

    Returns: virutal price of the lp token (`uint256`).

    !!! note
        - The method returns `virtual_price` as an integer with `1e18` precision.
        - `virtual_price` returns a price relative to the underlying. You can get the absolute price by multiplying it with the price of the underlying assets.

    ??? quote "Source code"

        ```vyper
        @view
        @external
        def get_virtual_price() -> uint256:
            """
            @notice The current virtual price of the pool LP token
            @dev Useful for calculating profits
            @return LP token virtual price normalized to 1e18
            """
            D: uint256 = self.get_D(self._xp(), self._A())
            # D is in the units similar to DAI (e.g. converted to precision 1e18)
            # When balanced, D = n * x_u - total virtual value of the portfolio
            token_supply: uint256 = ERC20(self.lp_token).totalSupply()
            return D * PRECISION / token_supply
        ```

    === "Example"
    
        ```shell
        >>> pool.get_virtual_price()
        1001692838188850782
        ```


### `fee`
!!! description "`StableSwap.fee() → uint256: view`"

    Getter for the swap fee.

    Returns: fee (`uint256`).

    !!! note
        The method returns `fee` as an integer with `1e10` precision.

    ??? quote "Source code"

<<<<<<< HEAD
        ```python 
=======
        ```vyper hl_lines="1 11 20 28"
>>>>>>> a27909d5f421a1329ee4ba7044091ebfd75305e3
        fee: public(uint256)  # fee * 1e10
    
        @external
        def __init__(
            _owner: address,
            _coins: address[N_COINS],
            _pool_token: address,
            _A: uint256,
            _fee: uint256,
            _admin_fee: uint256
        ):
            """
            @notice Contract constructor
            @param _owner Contract owner address
            @param _coins Addresses of ERC20 conracts of coins
            @param _pool_token Address of the token representing LP share
            @param _A Amplification coefficient multiplied by n * (n - 1)
            @param _fee Fee to charge for exchanges
            @param _admin_fee Admin fee
            """
            ...
            self.fee = _fee
            ...
        ```
        
    === "Example"
    
        ```shell
        >>> pool.fee()
        4000000
        ```


### `admin_fee`
!!! description "`StableSwap.admin_fee() → uint256: view`"

    Getter for the admin fee, which represents the percentage of the swap fee that is taken and distributed to veCRV holder.

    Returns: admin fee (`uint256`).

    !!! note
        - The method returns an integer with with `1e10` precision.
        - Admin fee is set at 50% (`5000000000`) and is paid out to veCRV holders.

    ??? quote "Source code"

<<<<<<< HEAD
        ```python
=======
        ```vyper hl_lines="1 12 21 29"
>>>>>>> a27909d5f421a1329ee4ba7044091ebfd75305e3
        admin_fee: public(uint256)  # admin_fee * 1e10
    
        @external
        def __init__(
            _owner: address,
            _coins: address[N_COINS],
            _pool_token: address,
            _A: uint256,
            _fee: uint256,
            _admin_fee: uint256
        ):
            """
            @notice Contract constructor
            @param _owner Contract owner address
            @param _coins Addresses of ERC20 conracts of coins
            @param _pool_token Address of the token representing LP share
            @param _A Amplification coefficient multiplied by n * (n - 1)
            @param _fee Fee to charge for exchanges
            @param _admin_fee Admin fee
            """
            ...
            self.admin_fee = _admin_fee
            ...
        ```
        
    === "Example"
    
        ```shell
        >>> pool.admin_fee()
        5000000000
        ```


## **Exchange Methods**

### `get_dy`
!!! description "`StableSwap.get_dy(i: int128, j: int128, _dx: uint256) → uint256: view`"

    Get the amount of coin `j` one would receive for swapping `dx` of coin `i`.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `i`       |  `uint128` | index of coin to swap from |
    | `j`       |  `uint128` | index of coin to swap to |
    | `dx`       |  `uint256` | amount of coin `i` to swap |

    ??? quote "Source code"

        ```vyper
        @view
        @external
        def get_dy(i: int128, j: int128, dx: uint256) -> uint256:
            xp: uint256[N_COINS] = self._xp()
            rates: uint256[N_COINS] = RATES
        
            x: uint256 = xp[i] + (dx * rates[i] / PRECISION)
            y: uint256 = self.get_y(i, j, x, xp)
            dy: uint256 = (xp[j] - y - 1)
            _fee: uint256 = self.fee * dy / FEE_DENOMINATOR
            return (dy - _fee) * PRECISION / rates[j]
        ```
 
    === "Example"
    
        ```shell
        >>> pool.get_dy(0, 1, 100)
        996307731416690125
        ```


### `exchange`
!!! description "`StableSwap.exchange(i: int128, j: int128, dx: uint256, min_dy: uint256) → uint256`"

    Function to perform an exchange between two coins.

    Returns: actual amount of `j` received (`uint256`).

    Emits: `TokenExchange`

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `i`       |  `uint128` | index of coin to swap from |
    | `j`       |  `uint128` | index of coin to swap to |
    | `dx`       |  `uint256` | amount of coin `i` to swap |
    | `min_dy`       |  `uint256` | minimum amount of `j` to receive |

    ??? quote "Source code"

<<<<<<< HEAD
        ```python
        event TokenExchange:
            buyer: indexed(address)
            sold_id: int128
            tokens_sold: uint256
            bought_id: int128
            tokens_bought: uint256

=======
        ```vyper
>>>>>>> a27909d5f421a1329ee4ba7044091ebfd75305e3
        @external
        @nonreentrant('lock')
        def exchange(i: int128, j: int128, dx: uint256, min_dy: uint256) -> uint256:
            """
            @notice Perform an exchange between two coins
            @dev Index values can be found via the `coins` public getter method
            @param i Index value for the coin to send
            @param j Index valie of the coin to recieve
            @param dx Amount of `i` being exchanged
            @param min_dy Minimum amount of `j` to receive
            @return Actual amount of `j` received
            """
            assert not self.is_killed  # dev: is killed
        
            old_balances: uint256[N_COINS] = self.balances
            xp: uint256[N_COINS] = self._xp_mem(old_balances)
        
            rates: uint256[N_COINS] = RATES
            x: uint256 = xp[i] + dx * rates[i] / PRECISION
            y: uint256 = self.get_y(i, j, x, xp)
        
            dy: uint256 = xp[j] - y - 1  # -1 just in case there were some rounding errors
            dy_fee: uint256 = dy * self.fee / FEE_DENOMINATOR
        
            # Convert all to real units
            dy = (dy - dy_fee) * PRECISION / rates[j]
            assert dy >= min_dy, "Exchange resulted in fewer coins than expected"
        
            dy_admin_fee: uint256 = dy_fee * self.admin_fee / FEE_DENOMINATOR
            dy_admin_fee = dy_admin_fee * PRECISION / rates[j]
        
            # Change balances exactly in same way as we change actual ERC20 coin amounts
            self.balances[i] = old_balances[i] + dx
            # When rounding errors happen, we undercharge admin fee in favor of LP
            self.balances[j] = old_balances[j] - dy - dy_admin_fee
        
            # "safeTransferFrom" which works for ERC20s which return bool or not
            _response: Bytes[32] = raw_call(
                self.coins[i],
                concat(
                    method_id("transferFrom(address,address,uint256)"),
                    convert(msg.sender, bytes32),
                    convert(self, bytes32),
                    convert(dx, bytes32),
                ),
                max_outsize=32,
            )  # dev: failed transfer
            if len(_response) > 0:
                assert convert(_response, bool)
        
            _response = raw_call(
                self.coins[j],
                concat(
                    method_id("transfer(address,uint256)"),
                    convert(msg.sender, bytes32),
                    convert(dy, bytes32),
                ),
                max_outsize=32,
            )  # dev: failed transfer
            if len(_response) > 0:
                assert convert(_response, bool)
        
            log TokenExchange(msg.sender, i, dx, j, dy)
        
            return dy
        ```

    === "Example"
    
        ```shell
        >>> expected = pool.get_dy(0, 1, 10**2) * 0.99
        >>> pool.exchange(0, 1, 10**2, expected, {"from": alice})
        ```

## **Add/Remove Liquidity Methods**

### `calc_token_amount`
!!! description "`StableSwap.calc_token_amount(_amounts: uint256[N_COINS], _: bool) → uint256: view`"

    Function to calculate addition or reduction in token supply from a deposit or withdrawal. 
    
    Returns: expected amount of LP tokens received (`uint256`). 
    
    !!!note
        This calculation accounts for slippage, but not fees.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `amounts`       |  `uint256[N_COINS]` | amount of each coin being deposited |
    | `is_deposit`       |  `bool` | set `True` for deposits, `False` for withdrawals |

    ??? quote "Source code"

        ```vyper
        @view
        @external
        def calc_token_amount(amounts: uint256[N_COINS], is_deposit: bool) -> uint256:
            """
            @notice Calculate addition or reduction in token supply from a deposit or withdrawal
            @dev This calculation accounts for slippage, but not fees.
                 Needed to prevent front-running, not for precise calculations!
            @param amounts Amount of each coin being deposited
            @param is_deposit set True for deposits, False for withdrawals
            @return Expected amount of LP tokens received
            """
            amp: uint256 = self._A()
            _balances: uint256[N_COINS] = self.balances
            D0: uint256 = self.get_D_mem(_balances, amp)
            for i in range(N_COINS):
                if is_deposit:
                    _balances[i] += amounts[i]
                else:
                    _balances[i] -= amounts[i]
            D1: uint256 = self.get_D_mem(_balances, amp)
            token_amount: uint256 = ERC20(self.lp_token).totalSupply()
            diff: uint256 = 0
            if is_deposit:
                diff = D1 - D0
            else:
                diff = D0 - D1
            return diff * token_amount / D0
        ```

    === "Example"
    
        ```shell
        >>> pool.calc_token_amount([10**2, 10**18], True)
        1996887509167925969
        ```


### `add_liquidity`
!!! description "`StableSwap.add_liquidity(amounts: uint256[N_COINS], min_mint_amount: uint256) → uint256`"

    Function to deposit coins into the pool.

    Returns: amount of LP tokens received (`uint256`).

    Emits: `AddLiquidity`

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `amounts`       |  `uint256[N_COINS]` | amount of each coin being deposited |
    | `min_mint_amount`       |  `uint256` | minimum amount of LP tokens to mint from the deposit |

    ??? quote "Source code"

<<<<<<< HEAD
        ```python
        event AddLiquidity:
            provider: indexed(address)
            token_amounts: uint256[N_COINS]
            fees: uint256[N_COINS]
            invariant: uint256
            token_supply: uint256
    
=======
        ```vyper
>>>>>>> a27909d5f421a1329ee4ba7044091ebfd75305e3
        @external
        @nonreentrant('lock')
        def add_liquidity(amounts: uint256[N_COINS], min_mint_amount: uint256) -> uint256:
            """
            @notice Deposit coins into the pool
            @param amounts List of amounts of coins to deposit
            @param min_mint_amount Minimum amount of LP tokens to mint from the deposit
            @return Amount of LP tokens received by depositing
            """
            assert not self.is_killed  # dev: is killed
        
            amp: uint256 = self._A()
        
            _lp_token: address = self.lp_token
            token_supply: uint256 = ERC20(_lp_token).totalSupply()
            # Initial invariant
            D0: uint256 = 0
            old_balances: uint256[N_COINS] = self.balances
            if token_supply > 0:
                D0 = self.get_D_mem(old_balances, amp)
            new_balances: uint256[N_COINS] = old_balances
        
            for i in range(N_COINS):
                if token_supply == 0:
                    assert amounts[i] > 0  # dev: initial deposit requires all coins
                # balances store amounts of c-tokens
                new_balances[i] = old_balances[i] + amounts[i]
        
            # Invariant after change
            D1: uint256 = self.get_D_mem(new_balances, amp)
            assert D1 > D0
        
            # We need to recalculate the invariant accounting for fees
            # to calculate fair user's share
            D2: uint256 = D1
            fees: uint256[N_COINS] = empty(uint256[N_COINS])
        
            if token_supply > 0:
                # Only account for fees if we are not the first to deposit
                _fee: uint256 = self.fee * N_COINS / (4 * (N_COINS - 1))
                _admin_fee: uint256 = self.admin_fee
                for i in range(N_COINS):
                    ideal_balance: uint256 = D1 * old_balances[i] / D0
                    difference: uint256 = 0
                    if ideal_balance > new_balances[i]:
                        difference = ideal_balance - new_balances[i]
                    else:
                        difference = new_balances[i] - ideal_balance
                    fees[i] = _fee * difference / FEE_DENOMINATOR
                    self.balances[i] = new_balances[i] - (fees[i] * _admin_fee / FEE_DENOMINATOR)
                    new_balances[i] -= fees[i]
                D2 = self.get_D_mem(new_balances, amp)
            else:
                self.balances = new_balances
        
            # Calculate, how much pool tokens to mint
            mint_amount: uint256 = 0
            if token_supply == 0:
                mint_amount = D1  # Take the dust if there was any
            else:
                mint_amount = token_supply * (D2 - D0) / D0
        
            assert mint_amount >= min_mint_amount, "Slippage screwed you"
        
            # Take coins from the sender
            for i in range(N_COINS):
                if amounts[i] > 0:
                    # "safeTransferFrom" which works for ERC20s which return bool or not
                    _response: Bytes[32] = raw_call(
                        self.coins[i],
                        concat(
                            method_id("transferFrom(address,address,uint256)"),
                            convert(msg.sender, bytes32),
                            convert(self, bytes32),
                            convert(amounts[i], bytes32),
                        ),
                        max_outsize=32,
                    )  # dev: failed transfer
                    if len(_response) > 0:
                        assert convert(_response, bool)
        
            # Mint pool tokens
            CurveToken(_lp_token).mint(msg.sender, mint_amount)
        
            log AddLiquidity(msg.sender, amounts, fees, D1, token_supply + mint_amount)
        
            return mint_amount
        ```
        
    === "Example"
    
        ```shell
        >>> todo: add_liquidity console output example
        ```


### `remove_liquidity`
!!! description "`StableSwap.remove_liquidity(_amount: uint256, min_amounts: uint256[N_COINS]) → uint256[N_COINS]`"

    Withdraw coins from the pool. Returns a list of the amounts for each coin that was withdrawn.

    Emits: `RemoveLiquidity`

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_amount`       |  `uint256` | quantity of LP tokens to burn in the withdrawal |
    | `min_amounts`       |  `uint256[N_COINS]`` | minimum amounts of underlying coins to receive |

    ??? quote "Source code"

<<<<<<< HEAD
        ```python
        event RemoveLiquidity:
            provider: indexed(address)
            token_amounts: uint256[N_COINS]
            fees: uint256[N_COINS]
            token_supply: uint256

=======
        ```vyper
>>>>>>> a27909d5f421a1329ee4ba7044091ebfd75305e3
        @external
        @nonreentrant('lock')
        def remove_liquidity(_amount: uint256, min_amounts: uint256[N_COINS]) -> uint256[N_COINS]:
            """
            @notice Withdraw coins from the pool
            @dev Withdrawal amounts are based on current deposit ratios
            @param _amount Quantity of LP tokens to burn in the withdrawal
            @param min_amounts Minimum amounts of underlying coins to receive
            @return List of amounts of coins that were withdrawn
            """
            _lp_token: address = self.lp_token
            total_supply: uint256 = ERC20(_lp_token).totalSupply()
            amounts: uint256[N_COINS] = empty(uint256[N_COINS])
            fees: uint256[N_COINS] = empty(uint256[N_COINS])  # Fees are unused but we've got them historically in event
        
            for i in range(N_COINS):
                value: uint256 = self.balances[i] * _amount / total_supply
                assert value >= min_amounts[i], "Withdrawal resulted in fewer coins than expected"
                self.balances[i] -= value
                amounts[i] = value
                _response: Bytes[32] = raw_call(
                    self.coins[i],
                    concat(
                        method_id("transfer(address,uint256)"),
                        convert(msg.sender, bytes32),
                        convert(value, bytes32),
                    ),
                    max_outsize=32,
                )  # dev: failed transfer
                if len(_response) > 0:
                    assert convert(_response, bool)
        
            CurveToken(_lp_token).burnFrom(msg.sender, _amount)  # dev: insufficient funds
        
            log RemoveLiquidity(msg.sender, amounts, fees, total_supply - _amount)
        
            return amounts
        ```

    === "Example"
    
        ```shell
        >>> todo: remove_liquidity console output example
        ```


### `remove_liquidity_imbalance`
!!! description "`StableSwap.remove_liquidity_imbalance(amounts: uint256[N_COINS], max_burn_amount: uint256) → uint256`"

    Function to withdraw coins from the pool in an imbalanced amount. 
    
    Returns: list of the amounts for each coin that was withdrawn (`uint256`).

    Emits: `RemoveLiquidityImbalance`

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `amounts`       |  `uint256[N_COINS]` | list of amounts of underlying coins to withdraw |
    | `max_burn_amount`       |  `uint256` | maximum amount of LP token to burn in the withdrawal |

    ??? quote "Source code"

<<<<<<< HEAD
        ```python
        event RemoveLiquidityImbalance:
            provider: indexed(address)
            token_amounts: uint256[N_COINS]
            fees: uint256[N_COINS]
            invariant: uint256
            token_supply: uint256

=======
        ```vyper
>>>>>>> a27909d5f421a1329ee4ba7044091ebfd75305e3
        @external
        @nonreentrant('lock')
        def remove_liquidity_imbalance(amounts: uint256[N_COINS], max_burn_amount: uint256) -> uint256:
            """
            @notice Withdraw coins from the pool in an imbalanced amount
            @param amounts List of amounts of underlying coins to withdraw
            @param max_burn_amount Maximum amount of LP token to burn in the withdrawal
            @return Actual amount of the LP token burned in the withdrawal
            """
            assert not self.is_killed  # dev: is killed
        
            amp: uint256 = self._A()
        
            old_balances: uint256[N_COINS] = self.balances
            new_balances: uint256[N_COINS] = old_balances
            D0: uint256 = self.get_D_mem(old_balances, amp)
            for i in range(N_COINS):
                new_balances[i] -= amounts[i]
            D1: uint256 = self.get_D_mem(new_balances, amp)
        
            _lp_token: address = self.lp_token
            token_supply: uint256 = ERC20(_lp_token).totalSupply()
            assert token_supply != 0  # dev: zero total supply
        
            _fee: uint256 = self.fee * N_COINS / (4 * (N_COINS - 1))
            _admin_fee: uint256 = self.admin_fee
            fees: uint256[N_COINS] = empty(uint256[N_COINS])
            for i in range(N_COINS):
                ideal_balance: uint256 = D1 * old_balances[i] / D0
                difference: uint256 = 0
                if ideal_balance > new_balances[i]:
                    difference = ideal_balance - new_balances[i]
                else:
                    difference = new_balances[i] - ideal_balance
                fees[i] = _fee * difference / FEE_DENOMINATOR
                self.balances[i] = new_balances[i] - (fees[i] * _admin_fee / FEE_DENOMINATOR)
                new_balances[i] -= fees[i]
            D2: uint256 = self.get_D_mem(new_balances, amp)
        
            token_amount: uint256 = (D0 - D2) * token_supply / D0
            assert token_amount != 0  # dev: zero tokens burned
            token_amount += 1  # In case of rounding errors - make it unfavorable for the "attacker"
            assert token_amount <= max_burn_amount, "Slippage screwed you"
        
            CurveToken(_lp_token).burnFrom(msg.sender, token_amount)  # dev: insufficient funds
            for i in range(N_COINS):
                if amounts[i] != 0:
                    _response: Bytes[32] = raw_call(
                        self.coins[i],
                        concat(
                            method_id("transfer(address,uint256)"),
                            convert(msg.sender, bytes32),
                            convert(amounts[i], bytes32),
                        ),
                        max_outsize=32,
                    )  # dev: failed transfer
                    if len(_response) > 0:
                        assert convert(_response, bool)
        
        
            log RemoveLiquidityImbalance(msg.sender, amounts, fees, D1, token_supply - token_amount)
        
            return token_amount
        ```
        
    === "Example"
    
        ```shell
        >>> todo: remove_liquidity_imbalance console output example
        ```


### `calc_withdraw_one_coin`
!!! description "`StableSwap.calc_withdraw_one_coin(_token_amount: uint256, i: int128) → uint256`"

    Function to calculate the amount received when withdrawing a single coin.

    Returns: expected amount of tokens received (`uint256`)

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_token_amount` | `uint256` | Amount of LP tokens to burn in the withdrawal |
    | `i` | `int128` | Index value of the coin to withdraw |

    ??? quote "Source code"
<<<<<<< HEAD

        ```python
=======
        
        ```vyper
>>>>>>> a27909d5f421a1329ee4ba7044091ebfd75305e3
        @view
        @external
        def calc_withdraw_one_coin(_token_amount: uint256, i: int128) -> uint256:
            """
            @notice Calculate the amount received when withdrawing a single coin
            @param _token_amount Amount of LP tokens to burn in the withdrawal
            @param i Index value of the coin to withdraw
            @return Amount of coin received
            """
            return self._calc_withdraw_one_coin(_token_amount, i)[0]

        @view
        @internal
        def _calc_withdraw_one_coin(_token_amount: uint256, i: int128) -> (uint256, uint256, uint256):
            # First, need to calculate
            # * Get current D
            # * Solve Eqn against y_i for D - _token_amount
            amp: uint256 = self._A()
            xp: uint256[N_COINS] = self._xp()
            D0: uint256 = self.get_D(xp, amp)
        
            total_supply: uint256 = ERC20(self.lp_token).totalSupply()
            D1: uint256 = D0 - _token_amount * D0 / total_supply
            new_y: uint256 = self.get_y_D(amp, i, xp, D1)
            xp_reduced: uint256[N_COINS] = xp
        
            _fee: uint256 = self.fee * N_COINS / (4 * (N_COINS - 1))
            for j in range(N_COINS):
                dx_expected: uint256 = 0
                if j == i:
                    dx_expected = xp[j] * D1 / D0 - new_y
                else:
                    dx_expected = xp[j] - xp[j] * D1 / D0
                xp_reduced[j] -= _fee * dx_expected / FEE_DENOMINATOR
        
            dy: uint256 = xp_reduced[i] - self.get_y_D(amp, i, xp_reduced, D1)
            precisions: uint256[N_COINS] = PRECISION_MUL
            dy = (dy - 1) / precisions[i]  # Withdraw less to account for rounding errors
            dy_0: uint256 = (xp[i] - new_y) / precisions[i]  # w/o fees
        
            return dy, dy_0 - dy, total_supply
        ```
        
    === "Example"
    
        ```shell
        >>> todo: calculate_withdraw_one_coin console output example
        ```


### `remove_liquidity_one_coin`
!!! description "`StableSwap.remove_liquidity_one_coin(_token_amount: uint256, i: int128, _min_amount: uint256) → uint256`"

    Withdraw a single coin from the pool. Returns the amount of coin `i` received.

    Returns: amount of coin received (`uint256`).

    Emits: `RemoveLiquidityOne`

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_token_amount` | `uint256` | amount of LP tokens to burn in the withdrawal |
    | `i` | `int128` | index value of the coin to withdraw |
    | `_min_amount` | `uint256` | minimum amount of coin to receive |

    ??? quote "Source code"

        ```vyper
        @external
        @nonreentrant('lock')
        def remove_liquidity_one_coin(_token_amount: uint256, i: int128, _min_amount: uint256) -> uint256:
            """
            @notice Withdraw a single coin from the pool
            @param _token_amount Amount of LP tokens to burn in the withdrawal
            @param i Index value of the coin to withdraw
            @param _min_amount Minimum amount of coin to receive
            @return Amount of coin received
            """
            assert not self.is_killed  # dev: is killed
        
            dy: uint256 = 0
            dy_fee: uint256 = 0
            total_supply: uint256 = 0
            dy, dy_fee, total_supply = self._calc_withdraw_one_coin(_token_amount, i)
            assert dy >= _min_amount, "Not enough coins removed"
        
            self.balances[i] -= (dy + dy_fee * self.admin_fee / FEE_DENOMINATOR)
            CurveToken(self.lp_token).burnFrom(msg.sender, _token_amount)  # dev: insufficient funds
        
        
            _response: Bytes[32] = raw_call(
                self.coins[i],
                concat(
                    method_id("transfer(address,uint256)"),
                    convert(msg.sender, bytes32),
                    convert(dy, bytes32),
                ),
                max_outsize=32,
            )  # dev: failed transfer
            if len(_response) > 0:
                assert convert(_response, bool)
        
            log RemoveLiquidityOne(msg.sender, _token_amount, dy, total_supply - _token_amount)
        
            return dy
        ```
        
    === "Example"
    
        ```shell
        >>> todo: remove_liquidity_one_coin console output example
        ```