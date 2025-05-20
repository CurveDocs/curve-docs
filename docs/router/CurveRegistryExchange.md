<h1>Curve Registry Exchange Contract</h1>

The `CurveRegistryExchange` contract serves as a router for Curve liquidity pools. Users can utilize this contract to find pools, query exchange rates, and execute swaps directly.

!!!danger "Outdated: Does not consider all liquidity pools"
    The `CurveRegistryExchange` contract was deployed in December 2022 at [`0x99a58482bd75cbab83b27ec03ca68ff489b5788f`](https://etherscan.io/address/0x99a58482bd75cbab83b27ec03ca68ff489b5788f#code) on the Ethereum Mainnet. This contract does not support all pools due to newer versions of exchange contracts.

    A new and updated version is available here: [`CurveRouterNG`](./CurveRouterNG.md).



---


## **Exchanging Tokens**

!!!warning
    This contract only considers liquidity sources that have been added to it. These sources are primarily the liquidity pools registered in `factory_registry` and `crypto_registry`.

*The contract offers three distinct functions to facilitate token exchanges:*

- [`exchange`](#exchange_multiple): Conducts a regular exchange using a specified pool.
- [`exchange_with_best_rate`](#exchange_with_best_rate): Executes a token exchange using the pool that offers the best rate.
- [`exchange_multiple`](#exchange_multiple): Allows up to four token exchanges in a single transaction.

Additionally, there are helper functions available to retrieve essential data, such as [`get_exchange_amount`](#get_exchange_amount), [`get_best_rate`](#get_best_rate), or [`get_exchange_multiple_amount`](#get_exchange_multiple_amount).


### `exchange`
!!! description "`CurveRegistryExchange.exchange(_pool: address, _from: address, _to: address, _amount: uint256, _expected: uint256, _receiver: address = msg.sender) -> uint256`"

    Function to perform a token exchange using a specific pool. Prior to calling this function, the caller must approve this contract to transfer `_amount` of coins from `_from`.

    Returns: amount received (`uint256`)

    Emits: `TokenExchange`

    | Input        | Type      | Description                                         |
    |--------------|-----------|-----------------------------------------------------|
    | `_pool`      | `address` | Address of the pool to use for the token exchange.  |
    | `_from`      | `address` | Address of the coin being sent.                     |
    | `_to`        | `address` | Address of the coin being received.                 |
    | `_amount`    | `uint256` | Amount of coins to exchange.                        |
    | `_expected`  | `uint256` | Minimum amount of coins to receive.                 |
    | `_receiver`  | `address` | Receiver of the tokens. Defaults to `msg.sender`.   |

    ??? quote "Source code"

        === "CurveRegistryExchange.vy"

            ```python
            event TokenExchange:
                buyer: indexed(address)
                receiver: indexed(address)
                pool: indexed(address)
                token_sold: address
                token_bought: address
                amount_sold: uint256
                amount_bought: uint256

            @payable
            @external
            @nonreentrant("lock")
            def exchange(
                _pool: address,
                _from: address,
                _to: address,
                _amount: uint256,
                _expected: uint256,
                _receiver: address = msg.sender,
            ) -> uint256:
                """
                @notice Perform an exchange using a specific pool
                @dev Prior to calling this function, the caller must approve
                    this contract to transfer `_amount` coins from `_from`
                    Works for both regular and factory-deployed pools
                @param _pool Address of the pool to use for the swap
                @param _from Address of coin being sent
                @param _to Address of coin being received
                @param _amount Quantity of `_from` being sent
                @param _expected Minimum quantity of `_from` received
                    in order for the transaction to succeed
                @param _receiver Address to transfer the received tokens to
                @return uint256 Amount received
                """
                if _from == ETH_ADDRESS:
                    assert _amount == msg.value, "Incorrect ETH amount"
                else:
                    assert msg.value == 0, "Incorrect ETH amount"

                if Registry(self.crypto_registry).get_lp_token(_pool) != ZERO_ADDRESS:
                    return self._crypto_exchange(_pool, _from, _to, _amount, _expected, msg.sender, _receiver)

                registry: address = self.registry
                if Registry(registry).get_lp_token(_pool) == ZERO_ADDRESS:
                    registry = self.factory_registry
                return self._exchange(registry, _pool, _from, _to, _amount, _expected, msg.sender, _receiver)

            @internal
            def _crypto_exchange(
                _pool: address,
                _from: address,
                _to: address,
                _amount: uint256,
                _expected: uint256,
                _sender: address,
                _receiver: address,
            ) -> uint256:

                assert not self.is_killed

                initial: address = _from
                target: address = _to

                if _from == ETH_ADDRESS:
                    initial = WETH_ADDRESS
                if _to == ETH_ADDRESS:
                    target = WETH_ADDRESS

                eth_amount: uint256 = 0
                received_amount: uint256 = 0

                i: uint256 = 0
                j: uint256 = 0
                i, j = CryptoRegistry(self.crypto_registry).get_coin_indices(_pool, initial, target)  # dev: no market

                # perform / verify input transfer
                if _from == ETH_ADDRESS:
                    eth_amount = _amount
                else:
                    response: Bytes[32] = raw_call(
                        _from,
                        _abi_encode(
                            _sender,
                            self,
                            _amount,
                            method_id=method_id("transferFrom(address,address,uint256)"),
                        ),
                        max_outsize=32,
                    )
                    if len(response) != 0:
                        assert convert(response, bool)

                # approve input token
                if not self.is_approved[_from][_pool]:
                    response: Bytes[32] = raw_call(
                        _from,
                        _abi_encode(
                            _pool,
                            MAX_UINT256,
                            method_id=method_id("approve(address,uint256)"),
                        ),
                        max_outsize=32,
                    )
                    if len(response) != 0:
                        assert convert(response, bool)
                    self.is_approved[_from][_pool] = True

                # perform coin exchange
                if ETH_ADDRESS in [_from, _to]:
                    CryptoPoolETH(_pool).exchange(i, j, _amount, _expected, True, value=eth_amount)
                else:
                    CryptoPool(_pool).exchange(i, j, _amount, _expected)

                # perform output transfer
                if _to == ETH_ADDRESS:
                    received_amount = self.balance
                    raw_call(_receiver, b"", value=self.balance)
                else:
                    received_amount = ERC20(_to).balanceOf(self)
                    response: Bytes[32] = raw_call(
                        _to,
                        _abi_encode(
                            _receiver,
                            received_amount,
                            method_id=method_id("transfer(address,uint256)"),
                        ),
                        max_outsize=32,
                    )
                    if len(response) != 0:
                        assert convert(response, bool)

                log TokenExchange(_sender, _receiver, _pool, _from, _to, _amount, received_amount)

                return received_amount

            @internal
            def _exchange(
                _registry: address,
                _pool: address,
                _from: address,
                _to: address,
                _amount: uint256,
                _expected: uint256,
                _sender: address,
                _receiver: address,
            ) -> uint256:

                assert not self.is_killed

                eth_amount: uint256 = 0
                received_amount: uint256 = 0

                i: int128 = 0
                j: int128 = 0
                is_underlying: bool = False
                i, j, is_underlying = Registry(_registry).get_coin_indices(_pool, _from, _to)  # dev: no market
                if is_underlying and _registry == self.factory_registry:
                    if Registry(_registry).is_meta(_pool):
                        base_coins: address[2] = self.base_coins[_pool]
                        if base_coins[0] == empty(address) and base_coins[1] == empty(address):
                            base_coins = [CurvePool(_pool).coins(0), CurvePool(_pool).coins(1)]
                            self.base_coins[_pool] = base_coins

                        # we only need to use exchange underlying if the input or output is not in the base coins
                        is_underlying = _from not in base_coins or _to not in base_coins
                    else:
                        # not a metapool so no underlying exchange method
                        is_underlying = False

                # perform / verify input transfer
                if _from == ETH_ADDRESS:
                    eth_amount = _amount
                else:
                    response: Bytes[32] = raw_call(
                        _from,
                        _abi_encode(
                            _sender,
                            self,
                            _amount,
                            method_id=method_id("transferFrom(address,address,uint256)"),
                        ),
                        max_outsize=32,
                    )
                    if len(response) != 0:
                        assert convert(response, bool)

                # approve input token
                if _from != ETH_ADDRESS and not self.is_approved[_from][_pool]:
                    response: Bytes[32] = raw_call(
                        _from,
                        _abi_encode(
                            _pool,
                            MAX_UINT256,
                            method_id=method_id("approve(address,uint256)"),
                        ),
                        max_outsize=32,
                    )
                    if len(response) != 0:
                        assert convert(response, bool)
                    self.is_approved[_from][_pool] = True

                # perform coin exchange
                if is_underlying:
                    CurvePool(_pool).exchange_underlying(i, j, _amount, _expected, value=eth_amount)
                else:
                    CurvePool(_pool).exchange(i, j, _amount, _expected, value=eth_amount)

                # perform output transfer
                if _to == ETH_ADDRESS:
                    received_amount = self.balance
                    raw_call(_receiver, b"", value=self.balance)
                else:
                    received_amount = ERC20(_to).balanceOf(self)
                    response: Bytes[32] = raw_call(
                        _to,
                        _abi_encode(
                            _receiver,
                            received_amount,
                            method_id=method_id("transfer(address,uint256)"),
                        ),
                        max_outsize=32,
                    )
                    if len(response) != 0:
                        assert convert(response, bool)

                log TokenExchange(_sender, _receiver, _pool, _from, _to, _amount, received_amount)

                return received_amount
            ```


### `exchange_with_best_rate`
!!! description "`CurveRegistryExchange.exchange_with_best_rate(_from: address, _to: address, _amount: uint256, _expected: uint256, _receiver: address = msg.sender) -> uint256`"

    !!!warning
        This method does not check rates in factory-deployed pools.

    Function to perform a token exchange using the pool that offers the best rate. Prior to calling this function, the caller must approve this contract to transfer `_amount` of coins from `_from`.

    Returns: received amount of the output token (`uint256`).

    Emits: `TokenExchange`

    | Input       | Type      | Description                                         |
    |-------------|-----------|-----------------------------------------------------|
    | `_from`     | `address` | Address of the coin being sent.                     |
    | `_to`       | `address` | Address of the coin being received.                 |
    | `_amount`   | `uint256` | Amount of coins to exchange.                        |
    | `_expected` | `uint256` | Minimum amount of coins to receive.                 |
    | `_receiver` | `address` | Receiver of the tokens. Defaults to `msg.sender`.   |

    ??? quote "Source code"

        === "CurveRegistryExchange.vy"

            ```python
            event TokenExchange:
                buyer: indexed(address)
                receiver: indexed(address)
                pool: indexed(address)
                token_sold: address
                token_bought: address
                amount_sold: uint256
                amount_bought: uint256

            @payable
            @external
            @nonreentrant("lock")
            def exchange_with_best_rate(
                _from: address,
                _to: address,
                _amount: uint256,
                _expected: uint256,
                _receiver: address = msg.sender,
            ) -> uint256:
                """
                @notice Perform an exchange using the pool that offers the best rate
                @dev Prior to calling this function, the caller must approve
                    this contract to transfer `_amount` coins from `_from`
                    Does NOT check rates in factory-deployed pools
                @param _from Address of coin being sent
                @param _to Address of coin being received
                @param _amount Quantity of `_from` being sent
                @param _expected Minimum quantity of `_from` received
                    in order for the transaction to succeed
                @param _receiver Address to transfer the received tokens to
                @return uint256 Amount received
                """
                if _from == ETH_ADDRESS:
                    assert _amount == msg.value, "Incorrect ETH amount"
                else:
                    assert msg.value == 0, "Incorrect ETH amount"

                registry: address = self.registry
                best_pool: address = ZERO_ADDRESS
                max_dy: uint256 = 0
                for i in range(65536):
                    pool: address = Registry(registry).find_pool_for_coins(_from, _to, i)
                    if pool == ZERO_ADDRESS:
                        break
                    dy: uint256 = self._get_exchange_amount(registry, pool, _from, _to, _amount)
                    if dy > max_dy:
                        best_pool = pool
                        max_dy = dy

                return self._exchange(registry, best_pool, _from, _to, _amount, _expected, msg.sender, _receiver)

            @view
            @internal
            def _get_exchange_amount(
                _registry: address,
                _pool: address,
                _from: address,
                _to: address,
                _amount: uint256
            ) -> uint256:
                """
                @notice Get the current number of coins received in an exchange
                @param _registry Registry address
                @param _pool Pool address
                @param _from Address of coin to be sent
                @param _to Address of coin to be received
                @param _amount Quantity of `_from` to be sent
                @return Quantity of `_to` to be received
                """
                i: int128 = 0
                j: int128 = 0
                is_underlying: bool = False
                i, j, is_underlying = Registry(_registry).get_coin_indices(_pool, _from, _to) # dev: no market

                if is_underlying and (_registry == self.registry or Registry(_registry).is_meta(_pool)):
                    return CurvePool(_pool).get_dy_underlying(i, j, _amount)

                return CurvePool(_pool).get_dy(i, j, _amount)

            @internal
            def _exchange(
                _registry: address,
                _pool: address,
                _from: address,
                _to: address,
                _amount: uint256,
                _expected: uint256,
                _sender: address,
                _receiver: address,
            ) -> uint256:

                assert not self.is_killed

                eth_amount: uint256 = 0
                received_amount: uint256 = 0

                i: int128 = 0
                j: int128 = 0
                is_underlying: bool = False
                i, j, is_underlying = Registry(_registry).get_coin_indices(_pool, _from, _to)  # dev: no market
                if is_underlying and _registry == self.factory_registry:
                    if Registry(_registry).is_meta(_pool):
                        base_coins: address[2] = self.base_coins[_pool]
                        if base_coins[0] == empty(address) and base_coins[1] == empty(address):
                            base_coins = [CurvePool(_pool).coins(0), CurvePool(_pool).coins(1)]
                            self.base_coins[_pool] = base_coins

                        # we only need to use exchange underlying if the input or output is not in the base coins
                        is_underlying = _from not in base_coins or _to not in base_coins
                    else:
                        # not a metapool so no underlying exchange method
                        is_underlying = False

                # perform / verify input transfer
                if _from == ETH_ADDRESS:
                    eth_amount = _amount
                else:
                    response: Bytes[32] = raw_call(
                        _from,
                        _abi_encode(
                            _sender,
                            self,
                            _amount,
                            method_id=method_id("transferFrom(address,address,uint256)"),
                        ),
                        max_outsize=32,
                    )
                    if len(response) != 0:
                        assert convert(response, bool)

                # approve input token
                if _from != ETH_ADDRESS and not self.is_approved[_from][_pool]:
                    response: Bytes[32] = raw_call(
                        _from,
                        _abi_encode(
                            _pool,
                            MAX_UINT256,
                            method_id=method_id("approve(address,uint256)"),
                        ),
                        max_outsize=32,
                    )
                    if len(response) != 0:
                        assert convert(response, bool)
                    self.is_approved[_from][_pool] = True

                # perform coin exchange
                if is_underlying:
                    CurvePool(_pool).exchange_underlying(i, j, _amount, _expected, value=eth_amount)
                else:
                    CurvePool(_pool).exchange(i, j, _amount, _expected, value=eth_amount)

                # perform output transfer
                if _to == ETH_ADDRESS:
                    received_amount = self.balance
                    raw_call(_receiver, b"", value=self.balance)
                else:
                    received_amount = ERC20(_to).balanceOf(self)
                    response: Bytes[32] = raw_call(
                        _to,
                        _abi_encode(
                            _receiver,
                            received_amount,
                            method_id=method_id("transfer(address,uint256)"),
                        ),
                        max_outsize=32,
                    )
                    if len(response) != 0:
                        assert convert(response, bool)

                log TokenExchange(_sender, _receiver, _pool, _from, _to, _amount, received_amount)

                return received_amount
            ```


### `exchange_multiple`
!!! description "`CurveRegistryExchange.exchange_multiple(_route: address[9], _swap_params: uint256[3][4], _amount: uint256, _expected: uint256, _pools: address[4]=[ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS], _receiver: address=msg.sender) -> uint256`"

    Function to perform up to four token exchanges in a single transaction. Prior to calling this function, the caller must approve this contract to transfer `_amount` coins from `_from`.

    Returns: expected amount of the final output token (`uint256`).

    Emits: `ExchangeMultiple`

    | Swap Type | Description |
    | :-------: | ----------- |
    | `1`       | Stableswap `exchange` |
    | `2`       | Stableswap `exchange_underlying` |
    | `3`       | Cryptoswap `exchange` |
    | `4`       | Cryptoswap `exchange_underlying` |
    | `5`       | Factory metapools with lending base pool: `exchange_underlying` |
    | `6`       | Factory crypto-meta pools underlying exchange (`exchange` method in zap) |
    | `7 - 11`  | For wrapped coin (underlying for lending pool) -> LP token "exchange" (actually `add_liquidity`) |
    | `12 - 14` | For LP token -> wrapped coin (underlying for lending or fake pool) "exchange" (actually `remove_liquidity_one_coin`) |
    | `15`      | For WETH -> ETH "exchange" (actually deposit/withdraw) |

    | Input          | Type            | Description  |
    | -------------- | --------------- | ------------ |
    | `_route`       | `address[9]`    | Array of the route consisting of [initial token, pool, token, pool, token, ...]. |
    | `_swap_params` | `uint256[3][4]` | Multidimensional array of `[i, j, swap_type]` where `i` and `j` are the correct values for the n'th pool in `_route`. |
    | `_amount`      | `uint256`       | Amount of initial tokens (`_route[0]`) to be exchanged. |
    | `_expected`    | `uint256`       | Minimum amount of coins to receive. |
    | `_pools`       | `address[4]`    | Array of pools for swaps via zap contracts. This parameter is only needed for Polygon meta-factories underlying swaps. |
    | `_receiver`    | `address`       | Receiver of the tokens. Defaults to `msg.sender`. |

    ??? quote "Source code"

        === "CurveRegistryExchange.vy"

            ```python
            event ExchangeMultiple:
                buyer: indexed(address)
                receiver: indexed(address)
                route: address[9]
                swap_params: uint256[3][4]
                pools: address[4]
                amount_sold: uint256
                amount_bought: uint256

            @external
            @payable
            def exchange_multiple(
                _route: address[9],
                _swap_params: uint256[3][4],
                _amount: uint256,
                _expected: uint256,
                _pools: address[4]=[ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS],
                _receiver: address=msg.sender
            ) -> uint256:
                """
                @notice Perform up to four swaps in a single transaction
                @dev Routing and swap params must be determined off-chain. This
                    functionality is designed for gas efficiency over ease-of-use.
                @param _route Array of [initial token, pool, token, pool, token, ...]
                            The array is iterated until a pool address of 0x00, then the last
                            given token is transferred to `_receiver`
                @param _swap_params Multidimensional array of [i, j, swap type] where i and j are the correct
                                    values for the n'th pool in `_route`. The swap type should be
                                    1 for a stableswap `exchange`,
                                    2 for stableswap `exchange_underlying`,
                                    3 for a cryptoswap `exchange`,
                                    4 for a cryptoswap `exchange_underlying`,
                                    5 for factory metapools with lending base pool `exchange_underlying`,
                                    6 for factory crypto-meta pools underlying exchange (`exchange` method in zap),
                                    7-11 for wrapped coin (underlying for lending or fake pool) -> LP token "exchange" (actually `add_liquidity`),
                                    12-14 for LP token -> wrapped coin (underlying for lending pool) "exchange" (actually `remove_liquidity_one_coin`)
                                    15 for WETH -> ETH "exchange" (actually deposit/withdraw)
                @param _amount The amount of `_route[0]` token being sent.
                @param _expected The minimum amount received after the final swap.
                @param _pools Array of pools for swaps via zap contracts. This parameter is only needed for
                            Polygon meta-factories underlying swaps.
                @param _receiver Address to transfer the final output token to.
                @return Received amount of the final output token
                """
                input_token: address = _route[0]
                amount: uint256 = _amount
                output_token: address = ZERO_ADDRESS

                # validate / transfer initial token
                if input_token == ETH_ADDRESS:
                    assert msg.value == amount
                else:
                    assert msg.value == 0
                    response: Bytes[32] = raw_call(
                        input_token,
                        _abi_encode(
                            msg.sender,
                            self,
                            amount,
                            method_id=method_id("transferFrom(address,address,uint256)"),
                        ),
                        max_outsize=32,
                    )
                    if len(response) != 0:
                        assert convert(response, bool)

                for i in range(1,5):
                    # 4 rounds of iteration to perform up to 4 swaps
                    swap: address = _route[i*2-1]
                    pool: address = _pools[i-1] # Only for Polygon meta-factories underlying swap (swap_type == 4)
                    output_token = _route[i*2]
                    params: uint256[3] = _swap_params[i-1]  # i, j, swap type

                    if not self.is_approved[input_token][swap]:
                        # approve the pool to transfer the input token
                        response: Bytes[32] = raw_call(
                            input_token,
                            _abi_encode(
                                swap,
                                MAX_UINT256,
                                method_id=method_id("approve(address,uint256)"),
                            ),
                            max_outsize=32,
                        )
                        if len(response) != 0:
                            assert convert(response, bool)
                        self.is_approved[input_token][swap] = True

                    eth_amount: uint256 = 0
                    if input_token == ETH_ADDRESS:
                        eth_amount = amount
                    # perform the swap according to the swap type
                    if params[2] == 1:
                        CurvePool(swap).exchange(convert(params[0], int128), convert(params[1], int128), amount, 0, value=eth_amount)
                    elif params[2] == 2:
                        CurvePool(swap).exchange_underlying(convert(params[0], int128), convert(params[1], int128), amount, 0, value=eth_amount)
                    elif params[2] == 3:
                        if input_token == ETH_ADDRESS or output_token == ETH_ADDRESS:
                            CryptoPoolETH(swap).exchange(params[0], params[1], amount, 0, True, value=eth_amount)
                        else:
                            CryptoPool(swap).exchange(params[0], params[1], amount, 0)
                    elif params[2] == 4:
                        CryptoPool(swap).exchange_underlying(params[0], params[1], amount, 0, value=eth_amount)
                    elif params[2] == 5:
                        LendingBasePoolMetaZap(swap).exchange_underlying(pool, convert(params[0], int128), convert(params[1], int128), amount, 0)
                    elif params[2] == 6:
                        use_eth: bool = input_token == ETH_ADDRESS or output_token == ETH_ADDRESS
                        CryptoMetaZap(swap).exchange(pool, params[0], params[1], amount, 0, use_eth)
                    elif params[2] == 7:
                        _amounts: uint256[2] = [0, 0]
                        _amounts[params[0]] = amount
                        BasePool2Coins(swap).add_liquidity(_amounts, 0)
                    elif params[2] == 8:
                        _amounts: uint256[3] = [0, 0, 0]
                        _amounts[params[0]] = amount
                        BasePool3Coins(swap).add_liquidity(_amounts, 0)
                    elif params[2] == 9:
                        _amounts: uint256[3] = [0, 0, 0]
                        _amounts[params[0]] = amount
                        LendingBasePool3Coins(swap).add_liquidity(_amounts, 0, True) # example: aave on Polygon
                    elif params[2] == 10:
                        _amounts: uint256[4] = [0, 0, 0, 0]
                        _amounts[params[0]] = amount
                        BasePool4Coins(swap).add_liquidity(_amounts, 0)
                    elif params[2] == 11:
                        _amounts: uint256[5] = [0, 0, 0, 0, 0]
                        _amounts[params[0]] = amount
                        BasePool5Coins(swap).add_liquidity(_amounts, 0)
                    elif params[2] == 12:
                        # The number of coins doesn't matter here
                        BasePool3Coins(swap).remove_liquidity_one_coin(amount, convert(params[1], int128), 0)
                    elif params[2] == 13:
                        # The number of coins doesn't matter here
                        LendingBasePool3Coins(swap).remove_liquidity_one_coin(amount, convert(params[1], int128), 0, True) # example: aave on Polygon
                    elif params[2] == 14:
                        # The number of coins doesn't matter here
                        CryptoBasePool3Coins(swap).remove_liquidity_one_coin(amount, params[1], 0) # example: atricrypto3 on Polygon
                    elif params[2] == 15:
                        if input_token == ETH_ADDRESS:
                            wETH(swap).deposit(value=amount)
                        elif output_token == ETH_ADDRESS:
                            wETH(swap).withdraw(amount)
                        else:
                            raise "One of the coins must be ETH for swap type 15"
                    else:
                        raise "Bad swap type"

                    # update the amount received
                    if output_token == ETH_ADDRESS:
                        amount = self.balance
                    else:
                        amount = ERC20(output_token).balanceOf(self)

                    # sanity check, if the routing data is incorrect we will have a 0 balance and that is bad
                    assert amount != 0, "Received nothing"

                    # check if this was the last swap
                    if i == 4 or _route[i*2+1] == ZERO_ADDRESS:
                        break
                    # if there is another swap, the output token becomes the input for the next round
                    input_token = output_token

                # validate the final amount received
                assert amount >= _expected

                # transfer the final token to the receiver
                if output_token == ETH_ADDRESS:
                    raw_call(_receiver, b"", value=amount)
                else:
                    response: Bytes[32] = raw_call(
                        output_token,
                        _abi_encode(
                            _receiver,
                            amount,
                            method_id=method_id("transfer(address,uint256)"),
                        ),
                        max_outsize=32,
                    )
                    if len(response) != 0:
                        assert convert(response, bool)

                log ExchangeMultiple(msg.sender, _receiver, _route, _swap_params, _pools, _amount, amount)

                return amount
            ```


### `get_exchange_amount`
!!! description "`CurveRegistryExchange.get_exchange_amount(_pool: address, _from: address, _to: address, _amount: uint256) -> uint256`"

    Getter for the current number of coins received in an exchange.

    Returns: amount of tokens received (`uint256`).

    | Input     | Type      | Description                      |
    |-----------|-----------|----------------------------------|
    | `_pool`   | `address` | Pool address.                    |
    | `_from`   | `address` | Address of the coin being sent.  |
    | `_to`     | `address` | Address of the coin being received. |
    | `_amount` | `uint256` | Amount of coins to exchange.     |

    ??? quote "Source code"

        === "CurveRegistryExchange.vy"

            ```python
            @view
            @external
            def get_exchange_amount(_pool: address, _from: address, _to: address, _amount: uint256) -> uint256:
                """
                @notice Get the current number of coins received in an exchange
                @dev Works for both regular and factory-deployed pools
                @param _pool Pool address
                @param _from Address of coin to be sent
                @param _to Address of coin to be received
                @param _amount Quantity of `_from` to be sent
                @return Quantity of `_to` to be received
                """

                registry: address = self.crypto_registry
                if Registry(registry).get_lp_token(_pool) != ZERO_ADDRESS:
                    initial: address = _from
                    target: address = _to
                    if _from == ETH_ADDRESS:
                        initial = WETH_ADDRESS
                    if _to == ETH_ADDRESS:
                        target = WETH_ADDRESS
                    return self._get_crypto_exchange_amount(registry, _pool, initial, target, _amount)

                registry = self.registry
                if Registry(registry).get_lp_token(_pool) == ZERO_ADDRESS:
                    registry = self.factory_registry
                return self._get_exchange_amount(registry, _pool, _from, _to, _amount)

            @view
            @internal
            def _get_exchange_amount(
                _registry: address,
                _pool: address,
                _from: address,
                _to: address,
                _amount: uint256
            ) -> uint256:
                """
                @notice Get the current number of coins received in an exchange
                @param _registry Registry address
                @param _pool Pool address
                @param _from Address of coin to be sent
                @param _to Address of coin to be received
                @param _amount Quantity of `_from` to be sent
                @return Quantity of `_to` to be received
                """
                i: int128 = 0
                j: int128 = 0
                is_underlying: bool = False
                i, j, is_underlying = Registry(_registry).get_coin_indices(_pool, _from, _to) # dev: no market

                if is_underlying and (_registry == self.registry or Registry(_registry).is_meta(_pool)):
                    return CurvePool(_pool).get_dy_underlying(i, j, _amount)

                return CurvePool(_pool).get_dy(i, j, _amount)

            @view
            @internal
            def _get_crypto_exchange_amount(
                _registry: address,
                _pool: address,
                _from: address,
                _to: address,
                _amount: uint256
            ) -> uint256:
                """
                @notice Get the current number of coins received in an exchange
                @param _registry Registry address
                @param _pool Pool address
                @param _from Address of coin to be sent
                @param _to Address of coin to be received
                @param _amount Quantity of `_from` to be sent
                @return Quantity of `_to` to be received
                """
                i: uint256 = 0
                j: uint256 = 0
                i, j = CryptoRegistry(_registry).get_coin_indices(_pool, _from, _to) # dev: no market

                return CryptoPool(_pool).get_dy(i, j, _amount)
            ```

    === "Example"
        ```shell
        >>> CurveRegistryExchange.get_exchange_amount('0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7', '0x6b175474e89094c44da98b954eedeac495271d0f', '0xdac17f958d2ee523a2206206994597c13d831ec7', 1000000000000000000000000)
        1000242275074               # swapping DAI for USDT using threepool

        >>> CurveRegistryExchange.get_exchange_amount('0xd51a44d3fae010294c616388b506acda1bfaae46', '0xdac17f958d2ee523a2206206994597c13d831ec7', '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', 10000000000)
        3315937652359468906         # swapping USDT for ETH using tricrypto2
        ```


### `get_best_rate`
!!! description "`CurveRegistryExchange.get_best_rate(_from: address, _to: address, _amount: uint256, _exclude_pools: address[8] = EMPTY_POOL_LIST) -> (address, uint256)`"

    !!!info
        This method checks for regular and factory pools.

    Function to find the pool offering the best rate for a given swap.

    Returns: pool address and amount received (`address`, `uint256`).

    | Input            | Type         | Description                                          |
    | ---------------- | ------------ | ---------------------------------------------------- |
    | `_from`          | `address`    | Address of the coin being sent.                      |
    | `_to`            | `address`    | Address of the coin being received.                  |
    | `_amount`        | `uint256`    | Amount of coins to send.                             |
    | `_exclude_pools` | `address[8]` | List of up to 8 pools which should not be returned.  |

    ??? quote "Source code"

        === "CurveRegistryExchange.vy"

            ```python
            @view
            @external
            def get_best_rate(
                _from: address, _to: address, _amount: uint256, _exclude_pools: address[8] = EMPTY_POOL_LIST
            ) -> (address, uint256):
                """
                @notice Find the pool offering the best rate for a given swap.
                @dev Checks rates for regular and factory pools
                @param _from Address of coin being sent
                @param _to Address of coin being received
                @param _amount Quantity of `_from` being sent
                @param _exclude_pools A list of up to 8 addresses which shouldn't be returned
                @return Pool address, amount received
                """
                best_pool: address = ZERO_ADDRESS
                max_dy: uint256 = 0

                initial: address = _from
                target: address = _to
                if _from == ETH_ADDRESS:
                    initial = WETH_ADDRESS
                if _to == ETH_ADDRESS:
                    target = WETH_ADDRESS

                registry: address = self.crypto_registry
                for i in range(65536):
                    pool: address = Registry(registry).find_pool_for_coins(initial, target, i)
                    if pool == ZERO_ADDRESS:
                        if i == 0:
                            # we only check for stableswap pools if we did not find any crypto pools
                            break
                        return best_pool, max_dy
                    elif pool in _exclude_pools:
                        continue
                    dy: uint256 = self._get_crypto_exchange_amount(registry, pool, initial, target, _amount)
                    if dy > max_dy:
                        best_pool = pool
                        max_dy = dy

                registry = self.registry
                for i in range(65536):
                    pool: address = Registry(registry).find_pool_for_coins(_from, _to, i)
                    if pool == ZERO_ADDRESS:
                        break
                    elif pool in _exclude_pools:
                        continue
                    dy: uint256 = self._get_exchange_amount(registry, pool, _from, _to, _amount)
                    if dy > max_dy:
                        best_pool = pool
                        max_dy = dy

                registry = self.factory_registry
                for i in range(65536):
                    pool: address = Registry(registry).find_pool_for_coins(_from, _to, i)
                    if pool == ZERO_ADDRESS:
                        break
                    elif pool in _exclude_pools:
                        continue
                    if ERC20(pool).totalSupply() == 0:
                        # ignore pools without TVL as the call to `get_dy` will revert
                        continue
                    dy: uint256 = self._get_exchange_amount(registry, pool, _from, _to, _amount)
                    if dy > max_dy:
                        best_pool = pool
                        max_dy = dy

                return best_pool, max_dy

            @view
            @internal
            def _get_exchange_amount(
                _registry: address,
                _pool: address,
                _from: address,
                _to: address,
                _amount: uint256
            ) -> uint256:
                """
                @notice Get the current number of coins received in an exchange
                @param _registry Registry address
                @param _pool Pool address
                @param _from Address of coin to be sent
                @param _to Address of coin to be received
                @param _amount Quantity of `_from` to be sent
                @return Quantity of `_to` to be received
                """
                i: int128 = 0
                j: int128 = 0
                is_underlying: bool = False
                i, j, is_underlying = Registry(_registry).get_coin_indices(_pool, _from, _to) # dev: no market

                if is_underlying and (_registry == self.registry or Registry(_registry).is_meta(_pool)):
                    return CurvePool(_pool).get_dy_underlying(i, j, _amount)

                return CurvePool(_pool).get_dy(i, j, _amount)

            @view
            @internal
            def _get_crypto_exchange_amount(
                _registry: address,
                _pool: address,
                _from: address,
                _to: address,
                _amount: uint256
            ) -> uint256:
                """
                @notice Get the current number of coins received in an exchange
                @param _registry Registry address
                @param _pool Pool address
                @param _from Address of coin to be sent
                @param _to Address of coin to be received
                @param _amount Quantity of `_from` to be sent
                @return Quantity of `_to` to be received
                """
                i: uint256 = 0
                j: uint256 = 0
                i, j = CryptoRegistry(_registry).get_coin_indices(_pool, _from, _to) # dev: no market

                return CryptoPool(_pool).get_dy(i, j, _amount)
            ```

    === "Example"
        ```shell
        >>> CurveRegistryExchange.get_best_rate('0x6b175474e89094c44da98b954eedeac495271d0f', '0xdac17f958d2ee523a2206206994597c13d831ec7', 1000000000000000000000000)
        '0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7', 1000242275724
        ```


### `get_exchange_multiple_amount`
!!! description "`CurveRegistryExchange.get_exchange_multiple_amount(_route: address[9], _swap_params: uint256[3][4], _amount: uint256, _pools: address[4]=[ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS]) -> uint256`"

    Getter for the amount of output tokens when performing a swap with multiple steps. The function iterates over the route addresses and, once the `ZERO_ADDRESS` is reached, the last given token is transferred to `_receiver`.

    | Swap Type | Description |
    | :-------: | ----------- |
    | `1`       | Stableswap `exchange` |
    | `2`       | Stableswap `exchange_underlying` |
    | `3`       | Cryptoswap: `exchange` |
    | `4`       | Cryptoswap: `exchange_underlying` |
    | `5`       | Factory metapools with lending base pool: `exchange_underlying` |
    | `6`       | Factory crypto-meta pools underlying exchange (`exchange` method in zap) |
    | `7 - 11`  | For wrapped coin (underlying for lending pool) -> LP token "exchange" (actually `add_liquidity`) |
    | `12 - 14` | For LP token -> wrapped coin (underlying for lending or fake pool) "exchange" (actually `remove_liquidity_one_coin`) |
    | `15`      | For WETH -> ETH "exchange" (actually deposit/withdraw) |

    Returns: expected amount of the final output token (`uint256`).

    | Input          | Type            | Description  |
    | -------------- | --------------- | ------------ |
    | `_route`       | `address[9]`    | Array of the route consisting of [initial token, pool, token, pool, token, ...]. |
    | `_swap_params` | `uint256[3][4]` | Multidimensional array of `[i, j, swap_type]` where `i` and `j` are the correct values for the n'th pool in `_route`. |
    | `_amount`      | `uint256`       | Amount of initial tokens (`_route[0]`) to exchange. |
    | `_pools`       | `address[4]`    | Array of pools for swaps via zap contracts. This parameter is only needed for Polygon meta-factories underlying swaps. |

    ??? quote "Source code"

        === "CurveRegistryExchange.vy"

            ```python
            @view
            @external
            def get_exchange_multiple_amount(
                _route: address[9],
                _swap_params: uint256[3][4],
                _amount: uint256,
                _pools: address[4]=[ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS]
            ) -> uint256:
                """
                @notice Get the current number the final output tokens received in an exchange
                @dev Routing and swap params must be determined off-chain. This
                    functionality is designed for gas efficiency over ease-of-use.
                @param _route Array of [initial token, pool, token, pool, token, ...]
                            The array is iterated until a pool address of 0x00, then the last
                            given token is transferred to `_receiver`
                @param _swap_params Multidimensional array of [i, j, swap type] where i and j are the correct
                                    values for the n'th pool in `_route`. The swap type should be
                                    1 for a stableswap `exchange`,
                                    2 for stableswap `exchange_underlying`,
                                    3 for a cryptoswap `exchange`,
                                    4 for a cryptoswap `exchange_underlying`,
                                    5 for factory metapools with lending base pool `exchange_underlying`,
                                    6 for factory crypto-meta pools underlying exchange (`exchange` method in zap),
                                    7-11 for wrapped coin (underlying for lending pool) -> LP token "exchange" (actually `add_liquidity`),
                                    12-14 for LP token -> wrapped coin (underlying for lending or fake pool) "exchange" (actually `remove_liquidity_one_coin`)
                                    15 for WETH -> ETH "exchange" (actually deposit/withdraw)
                @param _amount The amount of `_route[0]` token to be sent.
                @param _pools Array of pools for swaps via zap contracts. This parameter is only needed for
                            Polygon meta-factories underlying swaps.
                @return Expected amount of the final output token
                """
                amount: uint256 = _amount

                for i in range(1,5):
                    # 4 rounds of iteration to perform up to 4 swaps
                    swap: address = _route[i*2-1]
                    pool: address = _pools[i-1] # Only for Polygon meta-factories underlying swap (swap_type == 4)
                    params: uint256[3] = _swap_params[i-1]  # i, j, swap type

                    # Calc output amount according to the swap type
                    if params[2] == 1:
                        amount = CurvePool(swap).get_dy(convert(params[0], int128), convert(params[1], int128), amount)
                    elif params[2] == 2:
                        amount = CurvePool(swap).get_dy_underlying(convert(params[0], int128), convert(params[1], int128), amount)
                    elif params[2] == 3:
                        amount = CryptoPool(swap).get_dy(params[0], params[1], amount)
                    elif params[2] == 4:
                        amount = CryptoPool(swap).get_dy_underlying(params[0], params[1], amount)
                    elif params[2] == 5:
                        amount = CurvePool(pool).get_dy_underlying(convert(params[0], int128), convert(params[1], int128), amount)
                    elif params[2] == 6:
                        amount = CryptoMetaZap(swap).get_dy(pool, params[0], params[1], amount)
                    elif params[2] == 7:
                        _amounts: uint256[2] = [0, 0]
                        _amounts[params[0]] = amount
                        amount = BasePool2Coins(swap).calc_token_amount(_amounts, True)
                    elif params[2] in [8, 9]:
                        _amounts: uint256[3] = [0, 0, 0]
                        _amounts[params[0]] = amount
                        amount = BasePool3Coins(swap).calc_token_amount(_amounts, True)
                    elif params[2] == 10:
                        _amounts: uint256[4] = [0, 0, 0, 0]
                        _amounts[params[0]] = amount
                        amount = BasePool4Coins(swap).calc_token_amount(_amounts, True)
                    elif params[2] == 11:
                        _amounts: uint256[5] = [0, 0, 0, 0, 0]
                        _amounts[params[0]] = amount
                        amount = BasePool5Coins(swap).calc_token_amount(_amounts, True)
                    elif params[2] in [12, 13]:
                        # The number of coins doesn't matter here
                        amount = BasePool3Coins(swap).calc_withdraw_one_coin(amount, convert(params[1], int128))
                    elif params[2] == 14:
                        # The number of coins doesn't matter here
                        amount = CryptoBasePool3Coins(swap).calc_withdraw_one_coin(amount, params[1])
                    elif params[2] == 15:
                        # ETH <--> WETH rate is 1:1
                        pass
                    else:
                        raise "Bad swap type"

                    # check if this was the last swap
                    if i == 4 or _route[i*2+1] == ZERO_ADDRESS:
                        break

                return amount
            ```

    === "Example"
        ```shell
        >>> todo
        ```


---


## **Registry Contracts**

!!!warning "Outdated"
    The contract retrieves pool data from various registries sourced from the [`AddressProvider`](https://etherscan.io/address/0x0000000022d53366457f9d5e68ec105046fc4383). Since its deployment, a [new `AddressProvider`](../integration/address-provider.md) along with additional registries have been deployed.


### `registry`
!!! description "`CurveRegistryExchange.registry() -> address: view`"

    Getter for the registry contract.

    Returns: registry (`address`).

    ??? quote "Source code"

        === "CurveRegistryExchange.vy"

            ```python
            registry: public(address)

            @external
            def __init__(_address_provider: address, _calculator: address, _weth: address):
                """
                @notice Constructor function
                """
                self.address_provider = AddressProvider(_address_provider)
                self.registry = AddressProvider(_address_provider).get_registry()
                self.factory_registry = AddressProvider(_address_provider).get_address(3)
                self.crypto_registry = AddressProvider(_address_provider).get_address(5)
                self.default_calculator = _calculator

                WETH_ADDRESS = _weth
            ```

    === "Example"
        ```shell
        >>> CurveRegistryExchange.registry()
        '0x90E00ACe148ca3b23Ac1bC8C240C2a7Dd9c2d7f5'
        ```


### `factory_registry`
!!! description "`CurveRegistryExchange.factory_registry() -> address: view`"

    Getter for the factory regstiry contract.

    Returns: factory registry (`address`).

    ??? quote "Source code"

        === "CurveRegistryExchange.vy"

            ```python
            factory_registry: public(address)

            @external
            def __init__(_address_provider: address, _calculator: address, _weth: address):
                """
                @notice Constructor function
                """
                self.address_provider = AddressProvider(_address_provider)
                self.registry = AddressProvider(_address_provider).get_registry()
                self.factory_registry = AddressProvider(_address_provider).get_address(3)
                self.crypto_registry = AddressProvider(_address_provider).get_address(5)
                self.default_calculator = _calculator

                WETH_ADDRESS = _weth
            ```

    === "Example"
        ```shell
        >>> CurveRegistryExchange.factory_registry()
        '0xB9fC157394Af804a3578134A6585C0dc9cc990d4'
        ```


### `crypto_registry`
!!! description "`CurveRegistryExchange.crypto_registry() -> address: view`"

    Getter for the crypto registry contract.

    Returns: crypto registry (`address`).

    ??? quote "Source code"

        === "CurveRegistryExchange.vy"

            ```python
            crypto_registry: public(address)

            @external
            def __init__(_address_provider: address, _calculator: address, _weth: address):
                """
                @notice Constructor function
                """
                self.address_provider = AddressProvider(_address_provider)
                self.registry = AddressProvider(_address_provider).get_registry()
                self.factory_registry = AddressProvider(_address_provider).get_address(3)
                self.crypto_registry = AddressProvider(_address_provider).get_address(5)
                self.default_calculator = _calculator

                WETH_ADDRESS = _weth
            ```

    === "Example"
        ```shell
        >>> CurveRegistryExchange.crypto_registry()
        '0x8F942C20D02bEfc377D41445793068908E2250D0'
        ```


### `update_registry_address`
!!! description "`CurveRegistryExchange.update_registry_address() -> bool`"

    Function to update `registry`, `factory_registry` and `crypto_registry`. This function is callable by anyone and sets the variables to the current vaules in the `AddressProvider` contract.

    Returns: True (`bool`).

    ??? quote "Source code"

        === "CurveRegistryExchange.vy"

            ```python
            address_provider: AddressProvider
            registry: public(address)
            factory_registry: public(address)
            crypto_registry: public(address)

            @external
            def update_registry_address() -> bool:
                """
                @notice Update registry address
                @dev The registry address is kept in storage to reduce gas costs.
                    If a new registry is deployed this function should be called
                    to update the local address from the address provider.
                @return bool success
                """
                address_provider: address = self.address_provider.address
                self.registry = AddressProvider(address_provider).get_registry()
                self.factory_registry = AddressProvider(address_provider).get_address(3)
                self.crypto_registry = AddressProvider(address_provider).get_address(5)

                return True
            ```

    === "Example"
        ```shell
        >>> soon
        ```


---


## **Calculator Contract**

The contract is designed to set a calculator contract that can perform various tasks. However, this has not been configured.


### `default_calculator`
!!! description "`CurveRegistryExchange.default_calculator() -> address: view`"

    Getter for the default calculator. The default calculator can be set by the `admin` of the `AddressProvider` contract using the `set_default_calculator` function.

    Returns: calculator contract (`address`).

    ??? quote "Source code"

        === "CurveRegistryExchange.vy"

            ```python
            default_calculator: public(address)

            @external
            def __init__(_address_provider: address, _calculator: address, _weth: address):
                """
                @notice Constructor function
                """
                self.address_provider = AddressProvider(_address_provider)
                self.registry = AddressProvider(_address_provider).get_registry()
                self.factory_registry = AddressProvider(_address_provider).get_address(3)
                self.crypto_registry = AddressProvider(_address_provider).get_address(5)
                self.default_calculator = _calculator

                WETH_ADDRESS = _weth
            ```

    === "Example"
        ```shell
        >>> CurveRegistryExchange.default_calculator()
        '0x0000000000000000000000000000000000000000'
        ```


### `get_calculator`
!!! description "`CurveRegistryExchange.get_calculator(_pool: address) -> address: view`"

    Getter for the calculator contract of `_pool`. The calculator of pool can be set by the `admin` of the `AddressProvider` contract using the `set_calculator` function.

    Returns: calculator contract (`address`).

    | Input   | Type      | Description  |
    | ------- | --------- | ------------ |
    | `_pool` | `address` | Liquidity pool address. |

    ??? quote "Source code"

        === "CurveRegistryExchange.vy"

            ```python
            @view
            @external
            def get_calculator(_pool: address) -> address:
                """
                @notice Set calculator contract
                @dev Used to calculate `get_dy` for a pool
                @param _pool Pool address
                @return `CurveCalc` address
                """
                calculator: address = self.pool_calculator[_pool]
                if calculator == ZERO_ADDRESS:
                    return self.default_calculator
                else:
                    return calculator
            ```

    === "Example"
        ```shell
        >>> CurveRegistryExchange.get_calculator('0xbebc44782c7db0a1a60cb6fe97d0b483032ff1c7')
        '0x0000000000000000000000000000000000000000'
        ```


### `set_calculator`
!!! description "`CurveRegistryExchange.set_calculator(_pool: address, _calculator: address) -> bool`"

    !!!guard "Guarded Method"
        This function is only callable by the `admin` of the `AddressProvider` contract.

    Function to set a calculator contract for a pool.

    Returns: True (`bool`).

    | Input   | Type      | Description  |
    | ------- | --------- | ------------ |
    | `_pool` | `address` | Liquidity pool to set the calculator for. |
    | `_calculator` | `address` | Calculator contract. |

    ??? quote "Source code"

        === "CurveRegistryExchange.vy"

            ```python
            pool_calculator: HashMap[address, address]

            @external
            def set_calculator(_pool: address, _calculator: address) -> bool:
                """
                @notice Set calculator contract
                @dev Used to calculate `get_dy` for a pool
                @param _pool Pool address
                @param _calculator `CurveCalc` address
                @return bool success
                """
                assert msg.sender == self.address_provider.admin()  # dev: admin-only function

                self.pool_calculator[_pool] = _calculator

                return True
            ```


### `set_default_calculator`
!!! description "`CurveRegistryExchange.set_default_calculator(_calculator: address) -> bool`"

    !!!guard "Guarded Method"
        This function is only callable by the `admin` of the `AddressProvider` contract.

    Function to set the default calculator contract.

    Returns: True (`bool`).

    | Input   | Type      | Description  |
    | ------- | --------- | ------------ |
    | `_calculator` | `address` | Calculator address. |

    ??? quote "Source code"

        === "CurveRegistryExchange.vy"

            ```python
            default_calculator: public(address)

            @external
            def set_default_calculator(_calculator: address) -> bool:
                """
                @notice Set default calculator contract
                @dev Used to calculate `get_dy` for a pool
                @param _calculator `CurveCalc` address
                @return bool success
                """
                assert msg.sender == self.address_provider.admin()  # dev: admin-only function

                self.default_calculator = _calculator

                return True
            ```


---


## **Killing the Router**

The `admin` of the `AddressProvider` contract has the ability to set the `is_killed` status of the `CurveRegistryExchange` contract via the `set_killed` function. Setting this status to `true` disables all exchanges in the contract. The status can be reversed, or "unkilled," to allow token exchanges to resume.


### `is_killed`
!!! description "`CurveRegistryExchange.is_killed() -> boool: view`"

    !!!warning
        If the `is_killed` status is set to `true`, the contract will not allow any token exchanges and will revert when trying to exchange tokens.

    Getter for the `is_killed` status of the contract. The status can be set by the `admin` of the `AddressProvider` contract via the `set_killed` function.

    Returns: true or false (`bool`).

    ??? quote "Source code"

        === "CurveRegistryExchange.vy"

            ```python
            is_killed: public(bool)
            ```

    === "Example"
        ```shell
        >>> CurveRegistryExchange.is_killed()
        'false'
        ```


### `set_killed`
!!! description "`CurveRegistryExchange.set_killed(_is_killed: bool) -> bool`"

    !!!guard "Guarded Method"
        This function is only callable by the `admin` of the `AddressProvider` contract.

    Function to set the `is_killed` status for the contract.

    Returns: True (`bool`).

    | Input        | Type   | Description  |
    | ------------ | ------ | ------------ |
    | `_is_killed` | `bool` | `true` or `false`. |

    ??? quote "Source code"

        === "CurveRegistryExchange.vy"

            ```python
            @external
            def set_killed(_is_killed: bool) -> bool:
                """
                @notice Kill or unkill the contract
                @param _is_killed Killed status of the contract
                @return bool success
                """
                assert msg.sender == self.address_provider.admin()  # dev: admin-only function
                self.is_killed = _is_killed

                return True
            ```


---


## **Transfering Funds**

In the event that the contract holds an ERC20 or ETH balance, these tokens can be claimed by the `admin` of the `AddressProvider` contract. Although this should not occur at all, a possible scenario in which this could happen is when users mistakenly send their tokens directly to the contract address.


### `claim_balance`
!!! description "`CurveRegistryExchange.claim_balance(_token: address) -> bool`"

    !!!guard "Guarded Method"
        This function is only callable by the `admin` of the `AddressProvider` contract.

    Function to transfer an ERC20 or ETH balance held by this contract. When calling this function, the entire balance is transfered to the `admin` of the `AddressProvider`. This method can be used when tokens are mistakenly sent to the contract. Other than that, the contract does not hold any user assets.

    Returns: True (`bool`).

    | Input   | Type      | Description  |
    | ------- | --------- | ------------ |
    | `_token` | `address` | Token to transfer. |

    ??? quote "Source code"

        === "CurveRegistryExchange.vy"

            ```python
            @external
            def claim_balance(_token: address) -> bool:
                """
                @notice Transfer an ERC20 or ETH balance held by this contract
                @dev The entire balance is transferred to the owner
                @param _token Token address
                @return bool success
                """
                assert msg.sender == self.address_provider.admin()  # dev: admin-only function

                if _token == ETH_ADDRESS:
                    raw_call(msg.sender, b"", value=self.balance)
                else:
                    amount: uint256 = ERC20(_token).balanceOf(self)
                    response: Bytes[32] = raw_call(
                        _token,
                        concat(
                            method_id("transfer(address,uint256)"),
                            convert(msg.sender, bytes32),
                            convert(amount, bytes32),
                        ),
                        max_outsize=32,
                    )
                    if len(response) != 0:
                        assert convert(response, bool)

                return True
            ```
