<h1>LeverageZap.vy</h1>

This Zap contract is specifically designed to **create leveraged loans** using **predetermined routes that only utilize Curve pools**.

!!!github "GitHub"
    The source code for `LeverageZap.vy` is available on [:material-github: GitHub](https://github.com/curvefi/curve-stablecoin/blob/master/contracts/zaps/LeverageZap.vy).

    JavaScript library for Curve Lending can be found here: [:material-github: GitHub](https://github.com/curvefi/curve-lending-js?tab=readme-ov-file#leverage-createloan-borrowmore-repay)


???+ vyper "`LeverageZap.vy`"
    The source code for the `LeverageZap.vy` contract can be found on [:material-github: GitHub](https://github.com/curvefi/curve-stablecoin/blob/lending/contracts/zaps/LeverageZap.vy). The contract is written using [Vyper](https://github.com/vyperlang/vyper) version `0.3.10`.

    An accompanying JavaScript library for Curve Lending can be found here: [:material-github: GitHub](https://github.com/curvefi/curve-lending-js).

---

## **Callback**

This leverage zap allows up to five values to be passed for `callback_args`, but only the first two are needed:

- `callback_args[0]` represents the route used for leveraging.
- `callback_args[1]` is the minimum amount of collateral tokens to receive.

!!!notebook "Jupyter Notebook"
    A simple Jupyter notebook on how to create a leveraged position using this zap contract can be found here: [https://try.vyperlang.org/hub/user-redirect/lab/tree/shared/mo-anon/curve%20lending/loans/create_loan_extended.ipynb](https://try.vyperlang.org/hub/user-redirect/lab/tree/shared/mo-anon/curve%20lending/loans/create_loan_extended.ipynb)

### `callback_deposit`
!!! description "`LeverageZap.callback_deposit(user: address, stablecoins: uint256, collateral: uint256, debt: uint256, callback_args: DynArray[uint256, 5]) -> uint256[2]`"

    !!!guard "Guarded Method"
        This function is only callable by the `Controller` which is used to create the leveraged position.

    Function to perform a callback method to create a leveraged position. The functions input arguments are passed from the `Controller` contract.

    Returns: [0 and leveraged collateral] (`uint256[2]`), which is the amount of collateral received as a result of leveraging up.

    | Input           | Type                   | Description  |
    | --------------- | ---------------------- | ------------ |
    | `user`          | `address`              | User address to create a leveraged position. |
    | `stablecoins`   | `uint256`              | Amount of stablecoins. Always 0 when calling this method. |
    | `collateral`    | `uint256`              | Amount of collateral tokens provided by the user. |
    | `debt`          | `uint256`              | Amount of be borrowed. |
    | `callback_args` | `DynArray[uint256, 5]` | Array of callback arguments consisting of `[route_idx, min_recv]` |

    ??? quote "Source code"

        === "LeverageZap.vy"

            ```python
            @external
            @nonreentrant('lock')
            def callback_deposit(user: address, stablecoins: uint256, collateral: uint256, debt: uint256, callback_args: DynArray[uint256, 5]) -> uint256[2]:
                """
                @notice Callback method which should be called by controller to create leveraged position
                @param user Address of the user
                @param stablecoins Amount of stablecoin (always = 0)
                @param collateral Amount of collateral given by user
                @param debt Borrowed amount
                @param callback_args [route_idx, min_recv]
                return [0, leverage_collateral], leverage_collateral is the amount of collateral got as a result of selling borrowed stablecoin
                """
                assert msg.sender == CONTROLLER

                route_idx: uint256 = callback_args[0]
                min_recv: uint256 = callback_args[1]
                leverage_collateral: uint256 = ROUTER.exchange_multiple(self.routes[route_idx], self.route_params[route_idx], debt, min_recv, self.route_pools[route_idx])

                return [0, leverage_collateral]
            ```

        === "CurveRouter.vy"

            ```py
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

---

## **Helper Functions**

*The contract indludes various helper functions:*

### `get_collateral`
!!! description "`LeverageZap.get_collateral(stablecoin: uint256, route_idx: uint256) -> uint256`"

    Function to calculate the expected amount of collateral tokens for 'exchanging' a given amount of stablecoins using a specific route.

    Returns: expected amount of collateral (`uint256`).

    | Input        | Type      | Description                        |
    | ------------ | --------- | ---------------------------------- |
    | `stablecoin` | `uint256` | Amount of stablecoins to exchange. |
    | `route_idx`  | `uint256` | Index of the route to use.         |

    ??? quote "Source code"

        === "LeverageZap.vy"

            ```python
            interface Router:
                def exchange_multiple(_route: address[9], _swap_params: uint256[3][4], _amount: uint256, _expected: uint256, _pools: address[4]) -> uint256: payable
                def get_exchange_multiple_amount(_route: address[9], _swap_params: uint256[3][4], _amount: uint256, _pools: address[4]) -> uint256: view

            @view
            @external
            @nonreentrant('lock')
            def get_collateral(stablecoin: uint256, route_idx: uint256) -> uint256:
                """
                @notice Calculate the expected amount of collateral by given stablecoin amount
                @param stablecoin Amount of stablecoin
                @param route_idx Index of the route to use
                @return Amount of collateral
                """
                return self._get_collateral(stablecoin, route_idx)

            @view
            @internal
            def _get_collateral(stablecoin: uint256, route_idx: uint256) -> uint256:
                return ROUTER.get_exchange_multiple_amount(self.routes[route_idx], self.route_params[route_idx], stablecoin, self.route_pools[route_idx])
            ```

        === "CurveRegistryExchangeContract.vy"

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
        >>> LeverageZap.get_collateral(100000000000000000000000, 0)        # 100,000 crvUSD using route 0
        154124094                                                          # 1.54 wBTC

        >>> LeverageZap.get_collateral(100000000000000000000000, 1)        # 100,000 crvUSD using route 1
        155160443                                                          # 1.55 wBTC
        ```

### `get_collateral_underlying`
!!! description "`LeverageZap.get_collateral_underlying(stablecoin: uint256, route_idx: uint256) -> uint256`"

    Function to calculate the expected amount of collateral for a given amount of `stablecoin`. This is exactly the same function as `get_collateral` but is needed to make the ABI the same as the ABI for sfrxETH and wstETH.

    Returns: amount of collateral (`uint256`).

    | Input        | Type      | Description                        |
    | ------------ | --------- | ---------------------------------- |
    | `stablecoin` | `uint256` | Amount of stablecoins to exchange. |
    | `route_idx`  | `uint256` | Index of the route to use.         |

    ??? quote "Source code"

        === "LeverageZap.vy"

            ```python
            interface Router:
                def exchange_multiple(_route: address[9], _swap_params: uint256[3][4], _amount: uint256, _expected: uint256, _pools: address[4]) -> uint256: payable
                def get_exchange_multiple_amount(_route: address[9], _swap_params: uint256[3][4], _amount: uint256, _pools: address[4]) -> uint256: view

            @view
            @external
            @nonreentrant('lock')
            def get_collateral_underlying(stablecoin: uint256, route_idx: uint256) -> uint256:
                """
                @notice This method is needed just to make ABI the same as ABI for sfrxETH and wstETH
                """
                return self._get_collateral(stablecoin, route_idx)

            @view
            @internal
            def _get_collateral(stablecoin: uint256, route_idx: uint256) -> uint256:
                return ROUTER.get_exchange_multiple_amount(self.routes[route_idx], self.route_params[route_idx], stablecoin, self.route_pools[route_idx])
            ```

        === "CurveRegistryExchangeContract.vy"

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

        This function is used for markets like sfrxETH or wstETH to fetch the amount of underlying ETH. For markets that do not use "underlying" tokens, the function will return the same value as `get_collateral`.

        ```shell

        # wstETH market:
        >>> LeverageZap.get_collateral(100000000000000000000000, 0)                 # 100,000 crvUSD using route 0
        27065166978322615717                                                        # 27.07 wstETH

        >>> LeverageZap.get_collateral_underlying(100000000000000000000000, 0)      # 100,000 crvUSD using route 0
        31551027792084938361                                                        # 31.55 ETH
        ```

### `max_borrowable`
!!! description "`LeverageZap.max_borrowable(collateral: uint256, N: uint256, route_idx: uint256) -> uint256`"

    !!!warning
        `max_borrowable` will return different values based on the route chosen.

    Function to calculate the maximum amount of crvUSD to be borrowed using leverage.

    Returns: maximum borrowable amount (`uint256`).

    | Input        | Type      | Description                                         |
    | ------------ | --------- | --------------------------------------------------- |
    | `collateral` | `uint256` | Amount of collateral (at its native precision).     |
    | `N`          | `uint256` | Number of bands to deposit into.                    |
    | `route_idx`  | `uint256` | Index of the route to be used for exchanging stablecoin to collateral. |

    ??? quote "Source code"

        === "LeverageZap.vy"

            ```python
            @external
            @view
            def max_borrowable(collateral: uint256, N: uint256, route_idx: uint256) -> uint256:
                """
                @notice Calculation of maximum which can be borrowed with leverage
                @param collateral Amount of collateral (at its native precision)
                @param N Number of bands to deposit into
                @param route_idx Index of the route which should be use for exchange stablecoin to collateral
                @return Maximum amount of stablecoin to borrow with leverage
                """
                return self._max_borrowable(collateral, N ,route_idx)

            @internal
            @view
            def _max_borrowable(collateral: uint256, N: uint256, route_idx: uint256) -> uint256:
                """
                @notice Calculation of maximum which can be borrowed with leverage
                @param collateral Amount of collateral (at its native precision)
                @param N Number of bands to deposit into
                @param route_idx Index of the route which should be use for exchange stablecoin to collateral
                @return Maximum amount of stablecoin to borrow with leverage
                """
                # max_borrowable = collateral / (1 / (k_effective * max_p_base) - 1 / p_avg)
                user_collateral: uint256 = collateral * COLLATERAL_PRECISION
                leverage_collateral: uint256 = 0
                k_effective: uint256 = self._get_k_effective(user_collateral + leverage_collateral, N)
                max_p_base: uint256 = self._max_p_base()
                p_avg: uint256 = AMM.price_oracle()
                max_borrowable_prev: uint256 = 0
                max_borrowable: uint256 = 0
                for i in range(10):
                    max_borrowable_prev = max_borrowable
                    max_borrowable = user_collateral * 10**18 / (10**36 / k_effective * 10**18 / max_p_base - 10**36 / p_avg)
                    if max_borrowable > max_borrowable_prev:
                        if max_borrowable - max_borrowable_prev <= 1:
                            return max_borrowable
                    else:
                        if max_borrowable_prev - max_borrowable <= 1:
                            return max_borrowable
                    res: uint256[2] = self._get_collateral_and_avg_price(max_borrowable, route_idx)
                    leverage_collateral = res[0]
                    p_avg = res[1]
                    k_effective = self._get_k_effective(user_collateral + leverage_collateral, N)

                return min(max_borrowable * 999 / 1000, ERC20(CRVUSD).balanceOf(CONTROLLER)) # Cannot borrow beyond the amount of coins Controller has
            ```

    === "Example"

        ```shell
        >>> LeverageZap.max_borrowable(100000000, 4, 0)     # 1 wBTC with 4 bands using route id 0
        361562517762983346937868                            # 361562.52 crvUSD max borrowable

        >>> LeverageZap.max_borrowable(100000000, 4, 1)     # 1 wBTC with 4 bands using route id 1
        368244180550171738607454                            # 368244.18 crvUSD max borrowable

        >>> LeverageZap.max_borrowable(100000000, 4, 2)     # 1 wBTC with 4 bands using route id 2
        72242814877726777613187                             # 72242.81 crvUSD max borrowable
        ```

### `max_collateral`
!!! description "`LeverageZap.max_collateral(collateral: uint256, N: uint256, route_idx: uint256) -> uint256`"

    !!!warning
        `max_collateral` will return different values based on the route chosen.

    Function to calculate the maximum collateral position that can be created using leverage.

    Returns: total amount of collateral, i.e., user_collateral + max_leverage collateral (`uint256`).

    | Input        | Type      | Description                                         |
    | ------------ | --------- | --------------------------------------------------- |
    | `collateral` | `uint256` | Amount of collateral (at its native precision).     |
    | `N`          | `uint256` | Number of bands to deposit into.                    |
    | `route_idx`  | `uint256` | Index of the route to be used for exchanging stablecoin to collateral. |

    ??? quote "Source code"

        === "LeverageZap.vy"

            ```python
            @external
            @view
            def max_collateral(collateral: uint256, N: uint256, route_idx: uint256) -> uint256:
                """
                @notice Calculation of maximum collateral position which can be created with leverage
                @param collateral Amount of collateral (at its native precision)
                @param N Number of bands to deposit into
                @param route_idx Index of the route which should be use for exchange stablecoin to collateral
                @return user_collateral + max_leverage_collateral
                """
                max_borrowable: uint256 = self._max_borrowable(collateral, N, route_idx)
                max_leverage_collateral: uint256 = self._get_collateral(max_borrowable, route_idx)
                return collateral + max_leverage_collateral

            @internal
            @view
            def _max_borrowable(collateral: uint256, N: uint256, route_idx: uint256) -> uint256:
                """
                @notice Calculation of maximum which can be borrowed with leverage
                @param collateral Amount of collateral (at its native precision)
                @param N Number of bands to deposit into
                @param route_idx Index of the route which should be use for exchange stablecoin to collateral
                @return Maximum amount of stablecoin to borrow with leverage
                """
                # max_borrowable = collateral / (1 / (k_effective * max_p_base) - 1 / p_avg)
                user_collateral: uint256 = collateral * COLLATERAL_PRECISION
                leverage_collateral: uint256 = 0
                k_effective: uint256 = self._get_k_effective(user_collateral + leverage_collateral, N)
                max_p_base: uint256 = self._max_p_base()
                p_avg: uint256 = AMM.price_oracle()
                max_borrowable_prev: uint256 = 0
                max_borrowable: uint256 = 0
                for i in range(10):
                    max_borrowable_prev = max_borrowable
                    max_borrowable = user_collateral * 10**18 / (10**36 / k_effective * 10**18 / max_p_base - 10**36 / p_avg)
                    if max_borrowable > max_borrowable_prev:
                        if max_borrowable - max_borrowable_prev <= 1:
                            return max_borrowable
                    else:
                        if max_borrowable_prev - max_borrowable <= 1:
                            return max_borrowable
                    res: uint256[2] = self._get_collateral_and_avg_price(max_borrowable, route_idx)
                    leverage_collateral = res[0]
                    p_avg = res[1]
                    k_effective = self._get_k_effective(user_collateral + leverage_collateral, N)

                return min(max_borrowable * 999 / 1000, ERC20(CRVUSD).balanceOf(CONTROLLER)) # Cannot borrow beyond the amount of coins Controller has

            @view
            @internal
            def _get_collateral(stablecoin: uint256, route_idx: uint256) -> uint256:
                return ROUTER.get_exchange_multiple_amount(self.routes[route_idx], self.route_params[route_idx], stablecoin, self.route_pools[route_idx])
            ```

        === "CurveRouter.vy"

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
        >>> LeverageZap.max_collateral(100000000, 4, 0)     # 1 wBTC with 4 bands using route id 0
        645147830                                           # 6.45 wBTC as max collateral

        >>> LeverageZap.max_collateral(100000000, 20, 0)    # 1 wBTC with 20 bands using route id 0
        472496460                                           # 4.72 wBTC as max collateral

        >>> LeverageZap.max_collateral(100000000, 50, 0)    # 1 wBTC with 50 bands using route id 0
        322177677                                           # 3.22 wBTC as max collateral
        ```

### `max_borrowable_and_collateral`
!!! description "`LeverageZap.max_borrowable_and_collateral(collateral: uint256, N: uint256, route_idx: uint256) -> uint256[2]`"

    !!!warning
        `max_borrowable` and `max_collateral` will return different values based on the route chosen.

    Function to calculate the maximum amount of crvUSD to be borrowed and the maximum amount of collateral for the position when using leverage. This function combines `max_borrowable` and `max_collateral` into one.

    Returns: maximum borrowable crvUSD and maximum collateral for the position.

    | Input        | Type      | Description                                         |
    | ------------ | --------- | --------------------------------------------------- |
    | `collateral` | `uint256` | Amount of collateral (at its native precision).     |
    | `N`          | `uint256` | Number of bands to deposit into.                    |
    | `route_idx`  | `uint256` | Index of the route to be used for exchanging stablecoin to collateral. |

    ??? quote "Source code"

        === "LeverageZap.vy"

            ```python
            @external
            @view
            def max_borrowable_and_collateral(collateral: uint256, N: uint256, route_idx: uint256) -> uint256[2]:
                """
                @notice Calculation of maximum which can be borrowed with leverage and maximum collateral position which can be created then
                @param collateral Amount of collateral (at its native precision)
                @param N Number of bands to deposit into
                @param route_idx Index of the route which should be use for exchange stablecoin to collateral
                @return [max_borrowable, user_collateral + max_leverage_collateral]
                """
                max_borrowable: uint256 = self._max_borrowable(collateral, N, route_idx)
                max_leverage_collateral: uint256 = self._get_collateral(max_borrowable, route_idx)
                return [max_borrowable, collateral + max_leverage_collateral]
            ```

    === "Example"
        ```shell
        >>> LeverageZap.max_borrowable_and_collateral(100000000, 4, 0)
        360350604468393712411123, 642982517

        >>> LeverageZap.max_borrowable_and_collateral(100000000, 20, 0)
        244175455173940727227428, 471426060

        >>> LeverageZap.max_borrowable_and_collateral(100000000, 50, 0)
        144607094555240096128757, 321798242
        ```

### `calculate_debt_n1`
!!! description "`LeverageZap.calculate_debt_n1(collateral: uint256, debt: uint256, N: uint256, route_idx: uint256) -> int256`"

    Function to calculate the upper band number for the deposit to sit in, to support the given debt with full leverage. This essentially means that all borrowed stablecoin is converted to the collateral token and deposited in addition to the collateral provided by the user. The method reverts if the requested debt is too high.

    Returns: upper band to deposit into (`int256`).

    | Input        | Type      | Description                                  |
    | ------------ | --------- | -------------------------------------------- |
    | `collateral` | `address` | Address of the collateral token.             |
    | `debt`       | `uint256` | Amount of requested debt.                    |
    | `N`          | `uint256` | Number of bands to deposit into.             |
    | `route_idx`  | `uint256` | Index of the route to be used for conversion.|


    ??? quote "Source code"

        === "LeverageZap.vy"

            ```python
            @external
            @view
            def calculate_debt_n1(collateral: uint256, debt: uint256, N: uint256, route_idx: uint256) -> int256:
                """
                @notice Calculate the upper band number for the deposit to sit in to support
                        the given debt with full leverage, which means that all borrowed
                        stablecoin is converted to collateral coin and deposited in addition
                        to collateral provided by user. Reverts if requested debt is too high.
                @param collateral Amount of collateral (at its native precision)
                @param debt Amount of requested debt
                @param N Number of bands to deposit into
                @param route_idx Index of the route which should be use for exchange stablecoin to collateral
                @return Upper band n1 (n1 <= n2) to deposit into. Signed integer
                """
                leverage_collateral: uint256 = self._get_collateral(debt, route_idx)
                return Controller(CONTROLLER).calculate_debt_n1(collateral + leverage_collateral, debt, N)
            ```

        === "Controller.vy"

            ```py
            @external
            @view
            @nonreentrant('lock')
            def calculate_debt_n1(collateral: uint256, debt: uint256, N: uint256) -> int256:
                """
                @notice Calculate the upper band number for the deposit to sit in to support
                        the given debt. Reverts if requested debt is too high.
                @param collateral Amount of collateral (at its native precision)
                @param debt Amount of requested debt
                @param N Number of bands to deposit into
                @return Upper band n1 (n1 <= n2) to deposit into. Signed integer
                """
                return self._calculate_debt_n1(collateral, debt, N)

            @internal
            @view
            def _calculate_debt_n1(collateral: uint256, debt: uint256, N: uint256) -> int256:
                """
                @notice Calculate the upper band number for the deposit to sit in to support
                        the given debt. Reverts if requested debt is too high.
                @param collateral Amount of collateral (at its native precision)
                @param debt Amount of requested debt
                @param N Number of bands to deposit into
                @return Upper band n1 (n1 <= n2) to deposit into. Signed integer
                """
                assert debt > 0, "No loan"
                n0: int256 = AMM.active_band()
                p_base: uint256 = AMM.p_oracle_up(n0)

                # x_effective = y / N * p_oracle_up(n1) * sqrt((A - 1) / A) * sum_{0..N-1}(((A-1) / A)**k)
                # === d_y_effective * p_oracle_up(n1) * sum(...) === y_effective * p_oracle_up(n1)
                # d_y_effective = y / N / sqrt(A / (A - 1))
                y_effective: uint256 = self.get_y_effective(collateral * COLLATERAL_PRECISION, N, self.loan_discount)
                # p_oracle_up(n1) = base_price * ((A - 1) / A)**n1

                # We borrow up until min band touches p_oracle,
                # or it touches non-empty bands which cannot be skipped.
                # We calculate required n1 for given (collateral, debt),
                # and if n1 corresponds to price_oracle being too high, or unreachable band
                # - we revert.

                # n1 is band number based on adiabatic trading, e.g. when p_oracle ~ p
                y_effective = y_effective * p_base / (debt + 1)  # Now it's a ratio

                # n1 = floor(log2(y_effective) / self.logAratio)
                # EVM semantics is not doing floor unlike Python, so we do this
                assert y_effective > 0, "Amount too low"
                n1: int256 = self.log2(y_effective)  # <- switch to faster ln() XXX?
                if n1 < 0:
                    n1 -= LOG2_A_RATIO - 1  # This is to deal with vyper's rounding of negative numbers
                n1 /= LOG2_A_RATIO

                n1 = min(n1, 1024 - convert(N, int256)) + n0
                if n1 <= n0:
                    assert AMM.can_skip_bands(n1 - 1), "Debt too high"

                # Let's not rely on active_band corresponding to price_oracle:
                # this will be not correct if we are in the area of empty bands
                assert AMM.p_oracle_up(n1) < AMM.price_oracle(), "Debt too high"

                return n1
            ```

    === "Example"
        ```shell
        >>> LeverageZap.calculate_debt_n1(100000000, 300000000000000000000000. 4, 0)
        -60
        ```

---

## **Routes**

Routes are predetermined paths for token exchanges. These routes are added when initializing the contract. Additional routes cannot be added after the contract's deployment.

### `routes`
!!! description "`LeverageZap.routes(arg0: uint256, arg1: uint256) -> address: view`"

    Getter for the specific route of a route index. The route consists of alternating tokens and pools, formatted as `token -> pool -> token -> pool`, etc.

    Returns: address of the pool or coin (`address`).

    | Input  | Type      | Description                          |
    | ------ | --------- | ------------------------------------ |
    | `arg0` | `uint256` | Index of the route.                  |
    | `arg1` | `uint256` | Position in the route to retrieve the pool or coin. |

    ??? quote "Source code"

        === "LeverageZap.vy"

            ```python
            routes: public(HashMap[uint256, address[9]])

            @external
            def __init__(
                    _controller: address,
                    _collateral: address,
                    _router: address,
                    _routes: DynArray[address[9], 20],
                    _route_params: DynArray[uint256[3][4], 20],
                    _route_pools: DynArray[address[4], 20],
                    _route_names: DynArray[String[64], 20],
            ):
                CONTROLLER = _controller
                ROUTER = Router(_router)

                amm: address = Controller(_controller).amm()
                AMM = LLAMMA(amm)
                _A: uint256 = LLAMMA(amm).A()
                A = _A
                Aminus1 = _A - 1
                LOG2_A_RATIO = self.log2(_A * 10 ** 18 / unsafe_sub(_A, 1))
                SQRT_BAND_RATIO = isqrt(unsafe_div(10 ** 36 * _A, unsafe_sub(_A, 1)))
                COLLATERAL_PRECISION = pow_mod256(10, 18 - ERC20(_collateral).decimals())

                for i in range(20):
                    if i >= len(_routes):
                        break
                    self.routes[i] = _routes[i]
                    self.route_params[i] = _route_params[i]
                    self.route_pools[i] = _route_pools[i]
                    self.route_names[i] = _route_names[i]
                self.routes_count = len(_routes)

                ERC20(CRVUSD).approve(_router, max_value(uint256), default_return_value=True)
                ERC20(_collateral).approve(_controller, max_value(uint256), default_return_value=True)
            ```

    === "Example"

        *This example shows the route for the route at index 0 `'crvUSD/USDC --> 3pool --> tricrypto2'`.*

        ```shell
        >>> LeverageZap.route_name(0)
        'crvUSD/USDC --> 3pool --> tricrypto2'

        >>> LeverageZap.routes(0, 0)
        '0xf939E0A03FB07F59A73314E73794Be0E57ac1b4E'    # crvUSD

        >>> LeverageZap.routes(0, 1)
        '0x4DEcE678ceceb27446b35C672dC7d61F30bAD69E'    # crvUSD/USDC pool

        >>> LeverageZap.routes(0, 2)
        '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'    # USDC

        >>> LeverageZap.routes(0, 3)
        '0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7'    # threpool (DAI<>USDC<>USDT) pool

        >>> LeverageZap.routes(0, 4)
        '0xdAC17F958D2ee523a2206206994597C13D831ec7'    # USDT

        >>> LeverageZap.routes(0, 5)
        '0xD51a44d3FaE010294C616388b506AcdA1bfAAE46'    # tricrypto2 (USDT, wETH, wBTC) pool

        >>> LeverageZap.routes(0, 6)
        '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599'    # wBTC
        ```

### `route_params`
!!! description "`LeverageZap.route_params(arg0: uint256, arg1: uint256, arg2: uint256) -> uint256: view`"

    Getter for the route parameters.

    Returns: route parameter (`uint256`).

    | Input  | Type      | Description                                          |
    | ------ | --------- | ---------------------------------------------------- |
    | `arg0` | `uint256` | Index of the route.                                  |
    | `arg1` | `uint256` | Exchange index within the route. The first exchange is indexed as 0, the second as 1, etc. |
    | `arg2` | `uint256` | Route parameter value. `0` for input token, `1` for output token, `2` for swap type. |

    ??? quote "Source code"

        === "LeverageZap.vy"

            ```python
            route_params: public(HashMap[uint256, uint256[3][4]])

            @external
            def __init__(
                    _controller: address,
                    _collateral: address,
                    _router: address,
                    _routes: DynArray[address[9], 20],
                    _route_params: DynArray[uint256[3][4], 20],
                    _route_pools: DynArray[address[4], 20],
                    _route_names: DynArray[String[64], 20],
            ):
                CONTROLLER = _controller
                ROUTER = Router(_router)

                amm: address = Controller(_controller).amm()
                AMM = LLAMMA(amm)
                _A: uint256 = LLAMMA(amm).A()
                A = _A
                Aminus1 = _A - 1
                LOG2_A_RATIO = self.log2(_A * 10 ** 18 / unsafe_sub(_A, 1))
                SQRT_BAND_RATIO = isqrt(unsafe_div(10 ** 36 * _A, unsafe_sub(_A, 1)))
                COLLATERAL_PRECISION = pow_mod256(10, 18 - ERC20(_collateral).decimals())

                for i in range(20):
                    if i >= len(_routes):
                        break
                    self.routes[i] = _routes[i]
                    self.route_params[i] = _route_params[i]
                    self.route_pools[i] = _route_pools[i]
                    self.route_names[i] = _route_names[i]
                self.routes_count = len(_routes)

                ERC20(CRVUSD).approve(_router, max_value(uint256), default_return_value=True)
                ERC20(_collateral).approve(_controller, max_value(uint256), default_return_value=True)
            ```

    === "Example"

        ```shell
        # first exchange: exchanging crvUSD for USDC using crvUSD/USDC pool
        >>> LeverageZap.route_params(0, 0, 0)   # route 0, first exchange (index 0), fist parameter value (index 0)
        1                                       # i = crvUSD
        >>> LeverageZap.route_params(0, 0, 1)   # route 0, first exchange (index 0), second parameter value (index 1)
        0                                       # j = USDC
        >>> LeverageZap.route_params(0, 0, 2)   # route 0, first exchange (index 0), third parameter value (index 2)
        1                                       # swap type 1 = stableswap exchange


        # second exchange: exchanging USDC for USDT using threepool
        >>> LeverageZap.route_params(0, 1, 0)   # route 0, second exchange (index 1), fist parameter value (index 0)
        1                                       # i = USDC
        >>> LeverageZap.route_params(0, 1, 1)   # route 0, second exchange (index 1), second parameter value (index 1)
        2                                       # j = USDT
        >>> LeverageZap.route_params(0, 1, 2)   # route 0, second exchange (index 1), third parameter value (index 2)
        1                                       # swap type 1 = stableswap exchange


        # third exchange: exchanging USDT for BTC using tricrypto2 pool
        >>> LeverageZap.route_params(0, 2, 0)   # route 0, third exchange (index 2), fist parameter value (index 0)
        0                                       # i = USDT
        >>> LeverageZap.route_params(0, 2, 1)   # route 0, third exchange (index 2), second parameter value (index 1)
        1                                       # j = wBTC
        >>> LeverageZap.route_params(0, 2, 2)   # route 0, third exchange (index 2), third parameter value (index 2)
        3                                       # swap type 3 = cryptoswap exchange

        ```

### `route_pools`
!!! description "`LeverageZap.route_pools(arg0: uint256, arg1: uint256) -> address: view`"

    Getter for the zap contracts used for a specific exchange in a route, if there are any.

    Returns: zap contract (`address`).

    | Input  | Type      | Description                                         |
    | ------ | --------- | --------------------------------------------------- |
    | `arg0` | `uint256` | Index of the route.                                 |
    | `arg1` | `uint256` | Index of the exchange. The first exchange is index 0, the second exchange is index 1, etc. |

    ??? quote "Source code"

        === "LeverageZap.vy"

            ```python
            route_pools: public(HashMap[uint256, address[4]])

            @external
            def __init__(
                    _controller: address,
                    _collateral: address,
                    _router: address,
                    _routes: DynArray[address[9], 20],
                    _route_params: DynArray[uint256[3][4], 20],
                    _route_pools: DynArray[address[4], 20],
                    _route_names: DynArray[String[64], 20],
            ):
                CONTROLLER = _controller
                ROUTER = Router(_router)

                amm: address = Controller(_controller).amm()
                AMM = LLAMMA(amm)
                _A: uint256 = LLAMMA(amm).A()
                A = _A
                Aminus1 = _A - 1
                LOG2_A_RATIO = self.log2(_A * 10 ** 18 / unsafe_sub(_A, 1))
                SQRT_BAND_RATIO = isqrt(unsafe_div(10 ** 36 * _A, unsafe_sub(_A, 1)))
                COLLATERAL_PRECISION = pow_mod256(10, 18 - ERC20(_collateral).decimals())

                for i in range(20):
                    if i >= len(_routes):
                        break
                    self.routes[i] = _routes[i]
                    self.route_params[i] = _route_params[i]
                    self.route_pools[i] = _route_pools[i]
                    self.route_names[i] = _route_names[i]
                self.routes_count = len(_routes)

                ERC20(CRVUSD).approve(_router, max_value(uint256), default_return_value=True)
                ERC20(_collateral).approve(_controller, max_value(uint256), default_return_value=True)
            ```

    === "Example"
        ```shell
        >>> LeverageZap.route_pools(0, 0)
        '0x0000000000000000000000000000000000000000'

        >>> LeverageZap.route_pools(0, 1)
        '0x0000000000000000000000000000000000000000'
        ```

### `route_names`
!!! description "`LeverageZap.route_names(arg0: uint256) -> String[64]: view`"

    Getter for the route name of a route.

    Returns: route name (`String[64]`).

    | Input | Type      | Description          |
    | ------| --------- | -------------------- |
    | `arg0`| `uint256` | Index of the route.  |

    ??? quote "Source code"

        === "LeverageZap.vy"

            ```python
            route_names: public(HashMap[uint256, String[64]])

            @external
            def __init__(
                    _controller: address,
                    _collateral: address,
                    _router: address,
                    _routes: DynArray[address[9], 20],
                    _route_params: DynArray[uint256[3][4], 20],
                    _route_pools: DynArray[address[4], 20],
                    _route_names: DynArray[String[64], 20],
            ):
                ...
                for i in range(20):
                    if i >= len(_routes):
                        break
                    self.routes[i] = _routes[i]
                    self.route_params[i] = _route_params[i]
                    self.route_pools[i] = _route_pools[i]
                    self.route_names[i] = _route_names[i]
                self.routes_count = len(_routes)
                ...
            ```

    === "Example"
        ```shell
        >>> LeverageZap.route_names(0)
        'crvUSD/USDC --> 3pool --> tricrypto2'

        >>> LeverageZap.route_names(1)
        'crvUSD/USDT --> tricrypto2'
        ```

### `route_count`
!!! description "`LeverageZap.route_count() -> uint256: view`"

    Getter for the total amount of routes included.

    Returns: amount of routes (`uint256`).

    ??? quote "Source code"

        === "LeverageZap.vy"

            ```python
            routes_count: public(uint256)

            @external
            def __init__(
                    _controller: address,
                    _collateral: address,
                    _router: address,
                    _routes: DynArray[address[9], 20],
                    _route_params: DynArray[uint256[3][4], 20],
                    _route_pools: DynArray[address[4], 20],
                    _route_names: DynArray[String[64], 20],
            ):
                ...
                for i in range(20):
                    if i >= len(_routes):
                        break
                    self.routes[i] = _routes[i]
                    self.route_params[i] = _route_params[i]
                    self.route_pools[i] = _route_pools[i]
                    self.route_names[i] = _route_names[i]
                self.routes_count = len(_routes)
                ...
            ```

    === "Example"
        ```shell
        >>> LeverageZap.route_count()
        5
        ```
