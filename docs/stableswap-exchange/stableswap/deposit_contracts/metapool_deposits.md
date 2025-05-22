While Curve metapools support swaps between base pool coins, the base pool LP token and metapool coins,
they do not allow liquidity providers to deposit and/or withdraw base pool coins.

For example, the `GUSD` metapool is a pool consisting of `GUSD` and `3CRV` (the LP token of the `3Pool`) and allows
for swaps between `GUSD`, `DAI`, `USDC`, `USDT` and `3CRV`. However, liquidity providers are not able to deposit
`DAI`, `USDC` or `USDT` to the pool directly. The main reason why this is not possible lies in the maximum byte
code size of contracts. Metapools are complex and can therefore end up being very close to the contract
byte code size limit. In order to overcome this restriction, liquidity can be added and removed to and
from a metapool in the base pool’s coins through a metapool deposit zap.

The template source code for a metapool deposit “zap” may be viewed on
[GitHub](https://github.com/curvefi/curve-contract/blob/master/contracts/pool-templates/meta/DepositTemplateMeta.vy).

!!! note

    Metapool deposit zaps contain the following private and hardcoded constants:

    - `N_COINS`: Number of coins in the metapool (excluding base pool coins)
    - `BASE_N_COINS`: Number of coins in the base pool
    - `N_ALL_COINS`: All coins in the metapool, excluding the base pool LP token (`N_COINS + BASE_N_COINS - 1`)

## Get Deposit Zap Information

### `DepositZap.pool`

!!! description "`DepositZap.pool() → address: view`"

    Getter for the metapool associated with this deposit contract.

    ??? quote "Source code"

        ```vyper hl_lines="1 12"
        pool: public(address)

        ...

        @external
        def __init__(_pool: address, _token: address):
            """
            @notice Contract constructor
            @param _pool Metapool address
            @param _token Pool LP token address
            """
            self.pool = _pool

        ...
        ```

    === "Example"

        ```shell
        >>> todo:
        ```

### `DepositZap.base_pool`

!!! description "`DepositZap.base_pool() → address: view`"

    Getter for the base pool of the metapool associated with this deposit contract.

    ??? quote "Source code"

        ```vyper hl_lines="1 15"
        base_pool: public(address)

        ...

        @external
        def __init__(_pool: address, _token: address):
            """
            @notice Contract constructor
            @param _pool Metapool address
            @param _token Pool LP token address
            """
            self.pool = _pool
            self.token = _token
            base_pool: address = CurveMeta(_pool).base_pool()
            self.base_pool = base_pool

        ...
        ```

    === "Example"

        ```shell
        >>> todo:
        ```

### `DepositZap.base_coins`

!!! description "`DepositZap.base_coins(i: uint256) → address: view`"

    Getter for the array of the coins of the metapool’s base pool.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `i`       |  `int128` | Index of the coin for which to get the address |

    ??? quote "Source code"

        ```vyper hl_lines="1 35"
        base_coins: public(address[BASE_N_COINS])

        ...

        @external
        def __init__(_pool: address, _token: address):
            """
            @notice Contract constructor
            @param _pool Metapool address
            @param _token Pool LP token address
            """
            self.pool = _pool
            self.token = _token
            base_pool: address = CurveMeta(_pool).base_pool()
            self.base_pool = base_pool

            for i in range(N_COINS):
                coin: address = CurveMeta(_pool).coins(i)
                self.coins[i] = coin
                # approve coins for infinite transfers
                _response: Bytes[32] = raw_call(
                    coin,
                    concat(
                        method_id("approve(address,uint256)"),
                        convert(_pool, bytes32),
                        convert(MAX_UINT256, bytes32),
                    ),
                    max_outsize=32,
                )
                if len(_response) > 0:
                    assert convert(_response, bool)

            for i in range(BASE_N_COINS):
                coin: address = CurveBase(base_pool).coins(i)
                self.base_coins[i] = coin
                # approve underlying coins for infinite transfers
                _response: Bytes[32] = raw_call(
                    coin,
                    concat(
                        method_id("approve(address,uint256)"),
                        convert(base_pool, bytes32),
                        convert(MAX_UINT256, bytes32),
                    ),
                    max_outsize=32,
                )
                if len(_response) > 0:
                    assert convert(_response, bool)
        ...
        ```

    === "Example"

        ```shell
        >>> todo:
        ```

### `DepositZap.token`

!!! description "`DepositZap.token() → address: view`"

    Getter for the LP token of the associated metapool.

    ??? quote "Source code"

        ```vyper hl_lines="1 13"
        token: public(address)

        ...

        @external
        def __init__(_pool: address, _token: address):
            """
            @notice Contract constructor
            @param _pool Metapool address
            @param _token Pool LP token address
            """
            self.pool = _pool
            self.token = _token

        ...
        ```

    === "Example"

        ```shell
        >>> todo:
        ```

## Add/Remove Liquidity

!!! note

    For methods taking the index argument `i`, a number in the range from `0` to `N_ALL_COINS - 1` is valid.
    This refers to all coins apart from the base pool LP token.

### `DepositZap.add_liquidity`

!!! description "`DepositZap.add_liquidity(_amounts: uint256[N_ALL_COINS], _min_mint_amount: uint256) → uint256`"

    Wrap underlying coins and deposit them in the pool. Returns the amount of LP token received in exchange for
    depositing.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_amounts`       |  `uint256[N_ALL_COINS]` | List of amounts of underlying coins to deposit |
    | `_min_mint_amount`       |  `uint256` | Minimum amount of LP tokens to mint from the deposit |

    Emits: <mark style="background-color: #FFD580; color: black">AddLiquidity</mark>
    <mark style="background-color: #FFD580; color: black">Transfer</mark>

    ??? quote "Source code"

        ```vyper
        @external
        def add_liquidity(_amounts: uint256[N_ALL_COINS], _min_mint_amount: uint256) -> uint256:
            """
            @notice Wrap underlying coins and deposit them in the pool
            @param _amounts List of amounts of underlying coins to deposit
            @param _min_mint_amount Minimum amount of LP tokens to mint from the deposit
            @return Amount of LP tokens received by depositing
            """
            meta_amounts: uint256[N_COINS] = empty(uint256[N_COINS])
            base_amounts: uint256[BASE_N_COINS] = empty(uint256[BASE_N_COINS])
            deposit_base: bool = False

            # Transfer all coins in
            for i in range(N_ALL_COINS):
                amount: uint256 = _amounts[i]
                if amount == 0:
                    continue
                coin: address = ZERO_ADDRESS
                if i < MAX_COIN:
                    coin = self.coins[i]
                    meta_amounts[i] = amount
                else:
                    x: int128 = i - MAX_COIN
                    coin = self.base_coins[x]
                    base_amounts[x] = amount
                    deposit_base = True
                # "safeTransferFrom" which works for ERC20s which return bool or not
                _response: Bytes[32] = raw_call(
                    coin,
                    concat(
                        method_id("transferFrom(address,address,uint256)"),
                        convert(msg.sender, bytes32),
                        convert(self, bytes32),
                        convert(amount, bytes32),
                    ),
                    max_outsize=32,
                )  # dev: failed transfer
                if len(_response) > 0:
                    assert convert(_response, bool)  # dev: failed transfer
                # end "safeTransferFrom"
                # Handle potential Tether fees
                if coin == FEE_ASSET:
                    amount = ERC20(FEE_ASSET).balanceOf(self)
                    if i < MAX_COIN:
                        meta_amounts[i] = amount
                    else:
                        base_amounts[i - MAX_COIN] = amount

            # Deposit to the base pool
            if deposit_base:
                CurveBase(self.base_pool).add_liquidity(base_amounts, 0)
                meta_amounts[MAX_COIN] = ERC20(self.coins[MAX_COIN]).balanceOf(self)

            # Deposit to the meta pool
            CurveMeta(self.pool).add_liquidity(meta_amounts, _min_mint_amount)

            # Transfer meta token back
            lp_token: address = self.token
            lp_amount: uint256 = ERC20(lp_token).balanceOf(self)
            assert ERC20(lp_token).transfer(msg.sender, lp_amount)

            return lp_amount
        ```

    === "Example"

        ```shell

        ```

### `DepositZap.remove_liquidity`

!!! description "`DepositZap.remove_liquidity(_amount: uint256, _min_amounts: uint256[N_ALL_COINS]) → uint256[N_ALL_COINS]`"

    Withdraw and unwrap coins from the pool. Returns a list of amounts (`uint256[N_ALL_COINS]`) of underlying coins
    that were withdrawn.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_amount`       |  `uint256` | Quantity of LP tokens to burn in the withdrawal |
    | `_min_amounts`       |  `uint256[N_ALL_COINS]` | Minimum amounts of underlying coins to receive |

    Emits: <mark style="background-color: #FFD580; color: black">RemoveLiquidity</mark>
    <mark style="background-color: #FFD580; color: black">Transfer</mark>

    ??? quote "Source code"

        ```vyper
        @external
        def remove_liquidity(_amount: uint256, _min_amounts: uint256[N_ALL_COINS]) -> uint256[N_ALL_COINS]:
            """
            @notice Withdraw and unwrap coins from the pool
            @dev Withdrawal amounts are based on current deposit ratios
            @param _amount Quantity of LP tokens to burn in the withdrawal
            @param _min_amounts Minimum amounts of underlying coins to receive
            @return List of amounts of underlying coins that were withdrawn
            """
            _token: address = self.token
            assert ERC20(_token).transferFrom(msg.sender, self, _amount)

            min_amounts_meta: uint256[N_COINS] = empty(uint256[N_COINS])
            min_amounts_base: uint256[BASE_N_COINS] = empty(uint256[BASE_N_COINS])
            amounts: uint256[N_ALL_COINS] = empty(uint256[N_ALL_COINS])

            # Withdraw from meta
            for i in range(MAX_COIN):
                min_amounts_meta[i] = _min_amounts[i]
            CurveMeta(self.pool).remove_liquidity(_amount, min_amounts_meta)

            # Withdraw from base
            _base_amount: uint256 = ERC20(self.coins[MAX_COIN]).balanceOf(self)
            for i in range(BASE_N_COINS):
                min_amounts_base[i] = _min_amounts[MAX_COIN+i]
            CurveBase(self.base_pool).remove_liquidity(_base_amount, min_amounts_base)

            # Transfer all coins out
            for i in range(N_ALL_COINS):
                coin: address = ZERO_ADDRESS
                if i < MAX_COIN:
                    coin = self.coins[i]
                else:
                    coin = self.base_coins[i - MAX_COIN]
                amounts[i] = ERC20(coin).balanceOf(self)
                # "safeTransfer" which works for ERC20s which return bool or not
                _response: Bytes[32] = raw_call(
                    coin,
                    concat(
                        method_id("transfer(address,uint256)"),
                        convert(msg.sender, bytes32),
                        convert(amounts[i], bytes32),
                    ),
                    max_outsize=32,
                )  # dev: failed transfer
                if len(_response) > 0:
                    assert convert(_response, bool)  # dev: failed transfer
                # end "safeTransfer"

            return amounts
        ```

    === "Example"

        ```shell
        >>> todo:
        ```

### `DepositZap.remove_liquidity_one_coin`

!!! description "`DepositZap.remove_liquidity_one_coin(_token_amount: uint256, i: int128, _min_amount: uint256) → uint256`"

    Withdraw and unwrap a single coin from the metapool. Returns the amount of the underlying coin received.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_token_amount`       |  `uint256` | Amount of LP tokens to burn in the withdrawal |
    | `i`       |  `int128` | Index value of the coin to withdraw |
    | `_min_amount`       |  `uint256` | Minimum amount of underlying coin to receive |

    Emits: <mark style="background-color: #FFD580; color: black">RemoveLiquidityOne</mark>
    <mark style="background-color: #FFD580; color: black">Transfer</mark>

    ??? quote "Source code"

        ```vyper
        @external
        def remove_liquidity_one_coin(_token_amount: uint256, i: int128, _min_amount: uint256) -> uint256:
            """
            @notice Withdraw and unwrap a single coin from the pool
            @param _token_amount Amount of LP tokens to burn in the withdrawal
            @param i Index value of the coin to withdraw
            @param _min_amount Minimum amount of underlying coin to receive
            @return Amount of underlying coin received
            """
            assert ERC20(self.token).transferFrom(msg.sender, self, _token_amount)

            coin: address = ZERO_ADDRESS
            if i < MAX_COIN:
                coin = self.coins[i]
                # Withdraw a metapool coin
                CurveMeta(self.pool).remove_liquidity_one_coin(_token_amount, i, _min_amount)
            else:
                coin = self.base_coins[i - MAX_COIN]
                # Withdraw a base pool coin
                CurveMeta(self.pool).remove_liquidity_one_coin(_token_amount, MAX_COIN, 0)
                CurveBase(self.base_pool).remove_liquidity_one_coin(
                    ERC20(self.coins[MAX_COIN]).balanceOf(self), i-MAX_COIN, _min_amount
                )

            # Transfer the coin out
            coin_amount: uint256 = ERC20(coin).balanceOf(self)
            # "safeTransfer" which works for ERC20s which return bool or not
            _response: Bytes[32] = raw_call(
                coin,
                concat(
                    method_id("transfer(address,uint256)"),
                    convert(msg.sender, bytes32),
                    convert(coin_amount, bytes32),
                ),
                max_outsize=32,
            )  # dev: failed transfer
            if len(_response) > 0:
                assert convert(_response, bool)  # dev: failed transfer
            # end "safeTransfer"

            return coin_amount
        ```

    === "Example"

        ```shell
        >>> todo:
        ```

### `DepositZap.remove_liquidity_imbalance`

!!! description "`DepositZap.remove_liquidity_imbalance(_amounts: uint256[N_ALL_COINS], _max_burn_amount: uint256) → uint256`"

    Withdraw coins from the pool in an imbalanced amount. Returns the actual amount of the LP token burned in the
    withdrawal.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_amounts`       |  `uint256[N_ALL_COINS]` | List of amounts of underlying coins to withdraw |
    | `_max_burn_amount`       |  `uint256` | Maximum amount of LP token to burn in the withdrawal |

    Emits: <mark style="background-color: #FFD580; color: black">RemoveLiquidityImbalance</mark>
    <mark style="background-color: #FFD580; color: black">Transfer</mark>

    ??? quote "Source code"

        ```vyper
        @external
        def remove_liquidity_imbalance(_amounts: uint256[N_ALL_COINS], _max_burn_amount: uint256) -> uint256:
            """
            @notice Withdraw coins from the pool in an imbalanced amount
            @param _amounts List of amounts of underlying coins to withdraw
            @param _max_burn_amount Maximum amount of LP token to burn in the withdrawal
            @return Actual amount of the LP token burned in the withdrawal
            """
            base_pool: address = self.base_pool
            meta_pool: address = self.pool
            base_coins: address[BASE_N_COINS] = self.base_coins
            meta_coins: address[N_COINS] = self.coins
            lp_token: address = self.token

            fee: uint256 = CurveBase(base_pool).fee() * BASE_N_COINS / (4 * (BASE_N_COINS - 1))
            fee += fee * FEE_IMPRECISION / FEE_DENOMINATOR  # Overcharge to account for imprecision

            # Transfer the LP token in
            assert ERC20(lp_token).transferFrom(msg.sender, self, _max_burn_amount)

            withdraw_base: bool = False
            amounts_base: uint256[BASE_N_COINS] = empty(uint256[BASE_N_COINS])
            amounts_meta: uint256[N_COINS] = empty(uint256[N_COINS])
            leftover_amounts: uint256[N_COINS] = empty(uint256[N_COINS])

            # Prepare quantities
            for i in range(MAX_COIN):
                amounts_meta[i] = _amounts[i]

            for i in range(BASE_N_COINS):
                amount: uint256 = _amounts[MAX_COIN + i]
                if amount != 0:
                    amounts_base[i] = amount
                    withdraw_base = True

            if withdraw_base:
                amounts_meta[MAX_COIN] = CurveBase(self.base_pool).calc_token_amount(amounts_base, False)
                amounts_meta[MAX_COIN] += amounts_meta[MAX_COIN] * fee / FEE_DENOMINATOR + 1

            # Remove liquidity and deposit leftovers back
            CurveMeta(meta_pool).remove_liquidity_imbalance(amounts_meta, _max_burn_amount)
            if withdraw_base:
                CurveBase(base_pool).remove_liquidity_imbalance(amounts_base, amounts_meta[MAX_COIN])
                leftover_amounts[MAX_COIN] = ERC20(meta_coins[MAX_COIN]).balanceOf(self)
                if leftover_amounts[MAX_COIN] > 0:
                    CurveMeta(meta_pool).add_liquidity(leftover_amounts, 0)

            # Transfer all coins out
            for i in range(N_ALL_COINS):
                coin: address = ZERO_ADDRESS
                amount: uint256 = 0
                if i < MAX_COIN:
                    coin = meta_coins[i]
                    amount = amounts_meta[i]
                else:
                    coin = base_coins[i - MAX_COIN]
                    amount = amounts_base[i - MAX_COIN]
                # "safeTransfer" which works for ERC20s which return bool or not
                if amount > 0:
                    _response: Bytes[32] = raw_call(
                        coin,
                        concat(
                            method_id("transfer(address,uint256)"),
                            convert(msg.sender, bytes32),
                            convert(amount, bytes32),
                        ),
                        max_outsize=32,
                    )  # dev: failed transfer
                    if len(_response) > 0:
                        assert convert(_response, bool)  # dev: failed transfer
                    # end "safeTransfer"

            # Transfer the leftover LP token out
            leftover: uint256 = ERC20(lp_token).balanceOf(self)
            if leftover > 0:
                assert ERC20(lp_token).transfer(msg.sender, leftover)

            return _max_burn_amount - leftover
        ```

    === "Example"

        ```shell
        >>> todo:
        ```

### `DepositZap.calc_withdraw_one_coin`

!!! description "`DepositZap.calc_withdraw_one_coin(_token_amount: uint256, i: int128) → uint256`"

    Calculate the amount received when withdrawing and unwrapping a single coin. Returns the amount of coin `i` received.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_token_amount`       |  `uint256` | Amount of LP tokens to burn in the withdrawal |
    | `i`       |  `int128` | Index value of the coin to withdraw (`i` should be in the range from `0` to `N_ALL_COINS - 1`, where the LP token of the base pool is removed). |

    ??? quote "Source code"

        ```vyper
        @view
        @external
        def calc_withdraw_one_coin(_token_amount: uint256, i: int128) -> uint256:
            """
            @notice Calculate the amount received when withdrawing and unwrapping a single coin
            @param _token_amount Amount of LP tokens to burn in the withdrawal
            @param i Index value of the underlying coin to withdraw
            @return Amount of coin received
            """
            if i < MAX_COIN:
                return CurveMeta(self.pool).calc_withdraw_one_coin(_token_amount, i)
            else:
                base_tokens: uint256 = CurveMeta(self.pool).calc_withdraw_one_coin(_token_amount, MAX_COIN)
                return CurveBase(self.base_pool).calc_withdraw_one_coin(base_tokens, i-MAX_COIN)
        ```

    === "Example"

        ```shell
        >>> todo:
        ```

### `DepositZap.calc_token_amount`

!!! description "`DepositZap.calc_token_amount(_amounts: uint256[N_ALL_COINS], _is_deposit: bool) → uint256`"

    Calculate addition or reduction in token supply from a deposit or withdrawal.
    Returns the expected amount of LP tokens received.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_amounts`       |  `uint256[N_ALL_COINS]` | Amount of each underlying coin being deposited |
    | `_is_deposit`       |  `bool` | Set `True` for deposits, `False` for withdrawals |

    ??? quote "Source code"

        ```vyper
        @view
        @external
        def calc_token_amount(_amounts: uint256[N_ALL_COINS], _is_deposit: bool) -> uint256:
            """
            @notice Calculate addition or reduction in token supply from a deposit or withdrawal
            @dev This calculation accounts for slippage, but not fees.
                 Needed to prevent front-running, not for precise calculations!
            @param _amounts Amount of each underlying coin being deposited
            @param _is_deposit set True for deposits, False for withdrawals
            @return Expected amount of LP tokens received
            """
            meta_amounts: uint256[N_COINS] = empty(uint256[N_COINS])
            base_amounts: uint256[BASE_N_COINS] = empty(uint256[BASE_N_COINS])

            for i in range(MAX_COIN):
                meta_amounts[i] = _amounts[i]

            for i in range(BASE_N_COINS):
                base_amounts[i] = _amounts[i + MAX_COIN]

            base_tokens: uint256 = CurveBase(self.base_pool).calc_token_amount(base_amounts, _is_deposit)
            meta_amounts[MAX_COIN] = base_tokens

            return CurveMeta(self.pool).calc_token_amount(meta_amounts, _is_deposit)
        ```

    === "Example"

        ```shell
        >>> todo:
        ```
