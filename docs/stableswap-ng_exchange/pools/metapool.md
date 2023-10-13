metapool: pool paired against a base pool.


## **Contract Info Methods** (need final cleanup and check)

### `BASE_POOL`
!!! description "`StableSwap.BASE_POOL() -> address: view`"

    Getter for the base pool.

    Returns: base pool (`address`).

    ??? quote "Source code"

        ```python
        BASE_POOL: public(immutable(address))

        @external
        def __init__(
            _name: String[32],
            _symbol: String[10],
            _A: uint256,
            _fee: uint256,
            _offpeg_fee_multiplier: uint256,
            _ma_exp_time: uint256,
            _math_implementation: address,
            _base_pool: address,
            _coins: DynArray[address, MAX_COINS],
            _base_coins: DynArray[address, MAX_COINS],
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
                                        Fees by when assets in the AMM depeg. Example: 20000000000
            @param _ma_exp_time Averaging window of oracle. Set as time_in_seconds / ln(2)
                                Example: for 10 minute EMA, _ma_exp_time is 600 / ln(2) ~= 866
            @param _math_implementation Contract containing Math methods
            @param _base_pool The underlying AMM of the LP token _coins[0] is paired against
            @param _coins List of addresses of the coins being used in the pool. For metapool this is
                        the coin (say LUSD) vs (say) 3crv as: [LUSD, 3CRV]. Length is always 2.
            @param _base_coins coins in the underlying base pool.
            @param _rate_multipliers Rate multipliers of the individual coins. For Metapools it is:
                                    [10 ** (36 - _coins[0].decimals()), 10 ** 18].
            @param _asset_types Array of uint8 representing tokens in pool
            @param _method_ids Array of first four bytes of the Keccak-256 hash of the function signatures
                            of the oracle addresses that gives rate oracles.
                            Calculated as: keccak(text=event_signature.replace(" ", ""))[:4]
            @param _oracles Array of rate oracle addresses.
            """
            assert len(_base_coins) <= 3  # dev: implementation does not support base pool with more than 3 coins

            math = Math(_math_implementation)
            BASE_POOL = _base_pool
            BASE_COINS = _base_coins
            BASE_N_COINS = len(_base_coins)
            coins = _coins  # <---------------- coins[1] is always base pool LP token.
            rate_multipliers = _rate_multipliers

            POOL_IS_REBASING_IMPLEMENTATION = 2 in _asset_types

            for i in range(MAX_COINS):
                if i < BASE_N_COINS:
                    # Approval needed for add_liquidity operation on base pool in
                    # _exchange_underlying:
                    ERC20(_base_coins[i]).approve(BASE_POOL, max_value(uint256))

            self.last_prices_packed.append(self.pack_2(10**18, 10**18))

            # ----------------- Parameters independent of pool type ------------------

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

            for i in range(N_COINS_128):

                self.oracles.append(convert(_method_ids[i], uint256) * 2**224 | convert(_oracles[i], uint256))
                self.admin_balances.append(0)  # <--- this initialises storage for admin balances
                self.stored_balances.append(0)

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
        >>> StableSwap.BASE_POOL('todo')
        'todo'
        ```


### `BASE_N_COINS`
!!! description "`StableSwap.BASE_N_COINS() -> uint256: view`"

    Getter for the number of coins within the base pool.

    Returns: number of coins (`uint256`).

    ??? quote "Source code"

        ```python
        MAX_COINS: constant(uint256) = 8  # max coins is 8 in the factory

        BASE_N_COINS: public(immutable(uint256))


        @external
        def __init__(
            _name: String[32],
            _symbol: String[10],
            _A: uint256,
            _fee: uint256,
            _offpeg_fee_multiplier: uint256,
            _ma_exp_time: uint256,
            _math_implementation: address,
            _base_pool: address,
            _coins: DynArray[address, MAX_COINS],
            _base_coins: DynArray[address, MAX_COINS],
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
                                        Fees by when assets in the AMM depeg. Example: 20000000000
            @param _ma_exp_time Averaging window of oracle. Set as time_in_seconds / ln(2)
                                Example: for 10 minute EMA, _ma_exp_time is 600 / ln(2) ~= 866
            @param _math_implementation Contract containing Math methods
            @param _base_pool The underlying AMM of the LP token _coins[0] is paired against
            @param _coins List of addresses of the coins being used in the pool. For metapool this is
                        the coin (say LUSD) vs (say) 3crv as: [LUSD, 3CRV]. Length is always 2.
            @param _base_coins coins in the underlying base pool.
            @param _rate_multipliers Rate multipliers of the individual coins. For Metapools it is:
                                    [10 ** (36 - _coins[0].decimals()), 10 ** 18].
            @param _asset_types Array of uint8 representing tokens in pool
            @param _method_ids Array of first four bytes of the Keccak-256 hash of the function signatures
                            of the oracle addresses that gives rate oracles.
                            Calculated as: keccak(text=event_signature.replace(" ", ""))[:4]
            @param _oracles Array of rate oracle addresses.
            """
            assert len(_base_coins) <= 3  # dev: implementation does not support base pool with more than 3 coins

            math = Math(_math_implementation)
            BASE_POOL = _base_pool
            BASE_COINS = _base_coins
            BASE_N_COINS = len(_base_coins)
            coins = _coins  # <---------------- coins[1] is always base pool LP token.
            rate_multipliers = _rate_multipliers

            POOL_IS_REBASING_IMPLEMENTATION = 2 in _asset_types

            for i in range(MAX_COINS):
                if i < BASE_N_COINS:
                    # Approval needed for add_liquidity operation on base pool in
                    # _exchange_underlying:
                    ERC20(_base_coins[i]).approve(BASE_POOL, max_value(uint256))

            self.last_prices_packed.append(self.pack_2(10**18, 10**18))

            # ----------------- Parameters independent of pool type ------------------

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

            for i in range(N_COINS_128):

                self.oracles.append(convert(_method_ids[i], uint256) * 2**224 | convert(_oracles[i], uint256))
                self.admin_balances.append(0)  # <--- this initialises storage for admin balances
                self.stored_balances.append(0)

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
        >>> StableSwap.BASE_N_COINS()
        'todo'
        ```


### `BASE_COINS`
!!! description "`StableSwap.BASE_COINS(arg0: uint256) -> address: view`"

    Getter for the coins at index value `arg0` within the base pool.

    Returns: coin (`address`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `arg0` |  `uint256` | index value of coin |

    ??? quote "Source code"

        ```python
        MAX_COINS: constant(uint256) = 8  # max coins is 8 in the factory

        BASE_COINS: public(immutable(DynArray[address, MAX_COINS]))


        @external
        def __init__(
            _name: String[32],
            _symbol: String[10],
            _A: uint256,
            _fee: uint256,
            _offpeg_fee_multiplier: uint256,
            _ma_exp_time: uint256,
            _math_implementation: address,
            _base_pool: address,
            _coins: DynArray[address, MAX_COINS],
            _base_coins: DynArray[address, MAX_COINS],
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
                                        Fees by when assets in the AMM depeg. Example: 20000000000
            @param _ma_exp_time Averaging window of oracle. Set as time_in_seconds / ln(2)
                                Example: for 10 minute EMA, _ma_exp_time is 600 / ln(2) ~= 866
            @param _math_implementation Contract containing Math methods
            @param _base_pool The underlying AMM of the LP token _coins[0] is paired against
            @param _coins List of addresses of the coins being used in the pool. For metapool this is
                        the coin (say LUSD) vs (say) 3crv as: [LUSD, 3CRV]. Length is always 2.
            @param _base_coins coins in the underlying base pool.
            @param _rate_multipliers Rate multipliers of the individual coins. For Metapools it is:
                                    [10 ** (36 - _coins[0].decimals()), 10 ** 18].
            @param _asset_types Array of uint8 representing tokens in pool
            @param _method_ids Array of first four bytes of the Keccak-256 hash of the function signatures
                            of the oracle addresses that gives rate oracles.
                            Calculated as: keccak(text=event_signature.replace(" ", ""))[:4]
            @param _oracles Array of rate oracle addresses.
            """
            assert len(_base_coins) <= 3  # dev: implementation does not support base pool with more than 3 coins

            math = Math(_math_implementation)
            BASE_POOL = _base_pool
            BASE_COINS = _base_coins
            BASE_N_COINS = len(_base_coins)
            coins = _coins  # <---------------- coins[1] is always base pool LP token.
            rate_multipliers = _rate_multipliers

            POOL_IS_REBASING_IMPLEMENTATION = 2 in _asset_types

            for i in range(MAX_COINS):
                if i < BASE_N_COINS:
                    # Approval needed for add_liquidity operation on base pool in
                    # _exchange_underlying:
                    ERC20(_base_coins[i]).approve(BASE_POOL, max_value(uint256))

            self.last_prices_packed.append(self.pack_2(10**18, 10**18))

            # ----------------- Parameters independent of pool type ------------------

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

            for i in range(N_COINS_128):

                self.oracles.append(convert(_method_ids[i], uint256) * 2**224 | convert(_oracles[i], uint256))
                self.admin_balances.append(0)  # <--- this initialises storage for admin balances
                self.stored_balances.append(0)

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
        >>> StableSwap.BASE_COINS('todo')
        'todo'
        ```


## **Exchange Methods** (need final cleanup and check)

### `exchange_underlying`
!!! description "`StableSwap.exchange_underlying(i: int128, j: int128, _dx: uint256, _min_dy: uint256, _receiver: address = msg.sender) -> uint256:`"

    Function to exchange `_dx` amount of the the underlying coin `i` for the underlying coin `j` and receive a minimum amount of `_min_dy`.

    Returns: amount of output coin received (`uint256`).

    Emits: `TokenExchangeUnderlying`

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `i` |  `in128` | index value of underlying input coin |
    | `j` |  `in128` | index value of underlying output coin |
    | `_dx` |  `uint256` | amount of coin `i` being exchanged |
    | `_min_dy` |  `uint256` | minumum amount of coin `j` to receive |
    | `receiver` |  `address` | receiver of the output tokens; defaults to msg.sender |

    ??? quote "Source code"

        ```python
        event TokenExchangeUnderlying:
            buyer: indexed(address)
            sold_id: int128
            tokens_sold: uint256
            bought_id: int128
            tokens_bought: uint256

        @external
        @nonreentrant('lock')
        def exchange_underlying(
            i: int128,
            j: int128,
            _dx: uint256,
            _min_dy: uint256,
            _receiver: address = msg.sender,
        ) -> uint256:
            """
            @notice Perform an exchange between two underlying coins
            @param i Index value for the underlying coin to send
            @param j Index value of the underlying coin to receive
            @param _dx Amount of `i` being exchanged
            @param _min_dy Minimum amount of `j` to receive
            @param _receiver Address that receives `j`
            @return Actual amount of `j` received
            """
            return self._exchange_underlying(
                msg.sender,
                i,
                j,
                _dx,
                _min_dy,
                _receiver,
                False
            )

        @internal
        def _exchange_underlying(
            sender: address,
            i: int128,
            j: int128,
            _dx: uint256,
            _min_dy: uint256,
            receiver: address,
            expect_optimistic_transfer: bool = False
        ) -> uint256:

            rates: DynArray[uint256, MAX_COINS] = self._stored_rates()
            old_balances: DynArray[uint256, MAX_COINS] = self._balances()
            xp: DynArray[uint256, MAX_COINS]  = self._xp_mem(rates, old_balances)

            dy: uint256 = 0
            base_i: int128 = 0
            base_j: int128 = 0
            meta_i: int128 = 0
            meta_j: int128 = 0
            x: uint256 = 0
            output_coin: address = empty(address)

            # ------------------------ Determine coin indices ------------------------

            # Get input coin indices:
            if i > 0:
                base_i = i - MAX_METAPOOL_COIN_INDEX
                meta_i = 1

            # Get output coin and indices:
            if j == 0:
                output_coin = coins[0]
            else:
                base_j = j - MAX_METAPOOL_COIN_INDEX
                meta_j = 1
                output_coin = BASE_COINS[base_j]

            # --------------------------- Do Transfer in -----------------------------

            # If incoming coin is supposed to go to the base pool, the _transfer_in
            # method will add_liquidity in the base pool and return dx_w_fee LP tokens
            dx_w_fee: uint256 =  self._transfer_in(
                meta_i,
                base_i,
                _dx,
                sender,
                expect_optimistic_transfer,
                (i > 0 and j > 0),  # <--- if True: do not add liquidity to base pool.
            )

            # ------------------------------- Exchange -------------------------------

            if i == 0 or j == 0:  # meta swap

                if i == 0:

                    # xp[i] + dx_w_fee * rates[i] / PRECISION
                    x = xp[i] + unsafe_div(dx_w_fee * rates[i], PRECISION)

                else:

                    # dx_w_fee is the number of base_pool LP tokens minted after
                    # base_pool.add_liquidity in self._transfer_in

                    # dx_w_fee * rates[MAX_METAPOOL_COIN_INDEX] / PRECISION
                    x = unsafe_div(dx_w_fee * rates[MAX_METAPOOL_COIN_INDEX], PRECISION)
                    x += xp[MAX_METAPOOL_COIN_INDEX]

                dy = self.__exchange(x, xp, rates, meta_i, meta_j)

                # Adjust stored balances of meta-level tokens:
                self.stored_balances[meta_j] -= dy

                # Withdraw from the base pool if needed
                if j > 0:
                    out_amount: uint256 = ERC20(output_coin).balanceOf(self)
                    StableSwap(BASE_POOL).remove_liquidity_one_coin(dy, base_j, 0)
                    dy = ERC20(output_coin).balanceOf(self) - out_amount

                assert dy >= _min_dy

            else:  # base pool swap (user should swap at base pool for better gas)

                dy = ERC20(output_coin).balanceOf(self)
                StableSwap(BASE_POOL).exchange(base_i, base_j, dx_w_fee, _min_dy)
                dy = ERC20(output_coin).balanceOf(self) - dy

            # --------------------------- Do Transfer out ----------------------------

            assert ERC20(output_coin).transfer(receiver, dy, default_return_value=True)

            # ------------------------------------------------------------------------

            log TokenExchangeUnderlying(sender, i, _dx, j, dy)

            return dy
        ```

    === "Example"

        ```shell
        >>> StableSwap.exchange_underlying('todo')
        'todo'
        ```


### `exchange_underlying_received`
!!! description "`StableSwap.exchange_underlying_received(i: int128, j: int128, _dx: uint256, _min_dy: uint256, _receiver: address) -> uint256:`"

    !!!warning
        `exchange_received` is only possible for exchanging non-rebasing tokens.

    Function to exchange `_dx` amount of the the underlying coin `i` for the underlying coin `j` and receive a minimum amount of `_min_dy`. This is done **without actually transferring the coins into the pool**. The exchange is based on the change in the balance of coin `i`, eliminating the need to grant approval to the contract.

    Returns: amount of output coin received (`uint256`).

    Emits: `TokenExchangeUnderlying`

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `i` |  `in128` | index value of underlying input coin |
    | `j` |  `in128` | index value of underlying output coin |
    | `_dx` |  `uint256` | amount of coin `i` being exchanged |
    | `_min_dy` |  `uint256` | minumum amount of coin `j` to receive |
    | `receiver` |  `address` | receiver of the output tokens; defaults to msg.sender |

    ??? quote "Source code"

        ```python
        event TokenExchangeUnderlying:
            buyer: indexed(address)
            sold_id: int128
            tokens_sold: uint256
            bought_id: int128
            tokens_bought: uint256

        @external
        @nonreentrant('lock')
        def exchange_underlying_received(
            i: int128,
            j: int128,
            _dx: uint256,
            _min_dy: uint256,
            _receiver: address,
        ) -> uint256:
            """
            @notice Perform an exchange between two underlying coins
            @dev This is disabled if pool contains rebasing tokens.
            @param i Index value for the underlying coin to send
            @param j Index value of the underlying coin to receive
            @param _dx Amount of `i` being exchanged
            @param _min_dy Minimum amount of `j` to receive
            @param _receiver Address that receives `j`
            @return Actual amount of `j` received
            """
            assert not POOL_IS_REBASING_IMPLEMENTATION  # dev: exchange_received not supported if pool contains rebasing tokens
            return self._exchange_underlying(
                msg.sender,
                i,
                j,
                _dx,
                _min_dy,
                _receiver,
                True
            )

        @internal
        def _exchange_underlying(
            sender: address,
            i: int128,
            j: int128,
            _dx: uint256,
            _min_dy: uint256,
            receiver: address,
            expect_optimistic_transfer: bool = False
        ) -> uint256:

            rates: DynArray[uint256, MAX_COINS] = self._stored_rates()
            old_balances: DynArray[uint256, MAX_COINS] = self._balances()
            xp: DynArray[uint256, MAX_COINS]  = self._xp_mem(rates, old_balances)

            dy: uint256 = 0
            base_i: int128 = 0
            base_j: int128 = 0
            meta_i: int128 = 0
            meta_j: int128 = 0
            x: uint256 = 0
            output_coin: address = empty(address)

            # ------------------------ Determine coin indices ------------------------

            # Get input coin indices:
            if i > 0:
                base_i = i - MAX_METAPOOL_COIN_INDEX
                meta_i = 1

            # Get output coin and indices:
            if j == 0:
                output_coin = coins[0]
            else:
                base_j = j - MAX_METAPOOL_COIN_INDEX
                meta_j = 1
                output_coin = BASE_COINS[base_j]

            # --------------------------- Do Transfer in -----------------------------

            # If incoming coin is supposed to go to the base pool, the _transfer_in
            # method will add_liquidity in the base pool and return dx_w_fee LP tokens
            dx_w_fee: uint256 =  self._transfer_in(
                meta_i,
                base_i,
                _dx,
                sender,
                expect_optimistic_transfer,
                (i > 0 and j > 0),  # <--- if True: do not add liquidity to base pool.
            )

            # ------------------------------- Exchange -------------------------------

            if i == 0 or j == 0:  # meta swap

                if i == 0:

                    # xp[i] + dx_w_fee * rates[i] / PRECISION
                    x = xp[i] + unsafe_div(dx_w_fee * rates[i], PRECISION)

                else:

                    # dx_w_fee is the number of base_pool LP tokens minted after
                    # base_pool.add_liquidity in self._transfer_in

                    # dx_w_fee * rates[MAX_METAPOOL_COIN_INDEX] / PRECISION
                    x = unsafe_div(dx_w_fee * rates[MAX_METAPOOL_COIN_INDEX], PRECISION)
                    x += xp[MAX_METAPOOL_COIN_INDEX]

                dy = self.__exchange(x, xp, rates, meta_i, meta_j)

                # Adjust stored balances of meta-level tokens:
                self.stored_balances[meta_j] -= dy

                # Withdraw from the base pool if needed
                if j > 0:
                    out_amount: uint256 = ERC20(output_coin).balanceOf(self)
                    StableSwap(BASE_POOL).remove_liquidity_one_coin(dy, base_j, 0)
                    dy = ERC20(output_coin).balanceOf(self) - out_amount

                assert dy >= _min_dy

            else:  # base pool swap (user should swap at base pool for better gas)

                dy = ERC20(output_coin).balanceOf(self)
                StableSwap(BASE_POOL).exchange(base_i, base_j, dx_w_fee, _min_dy)
                dy = ERC20(output_coin).balanceOf(self) - dy

            # --------------------------- Do Transfer out ----------------------------

            assert ERC20(output_coin).transfer(receiver, dy, default_return_value=True)

            # ------------------------------------------------------------------------

            log TokenExchangeUnderlying(sender, i, _dx, j, dy)

            return dy
        ```

    === "Example"

        ```shell
        >>> StableSwap.exchange_underlying_received('todo')
        'todo'
        ```







 