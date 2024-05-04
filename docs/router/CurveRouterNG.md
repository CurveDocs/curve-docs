<h1>Curve Router NG</h1>

The `CurveRouterNG` is used to perform token exchanges. It can **swap up to five tokens in a single transaction**.

Additionally, the contract provides **functions to calculate input and output amounts** with [`get_dy`](#get_dy) and [`get_dx`](#get_dx).

!!!deploy "Contract Source & Deployment"
    The `CurveRouterNG` contract has been deployed on most chains where Curve liquidity pools exist. For a full list of all deployments, see [here](../references/deployed-contracts.md#curve-router).

    Source code for the contract can be found on [:material-github: GitHub](https://github.com/curvefi/curve-router-ng/tree/master/contracts).


The contract utilizes **interfaces for all relevant Curve pools**, such as StableSwap, CryptoSwap, LLAMMA, and others, to execute swaps.

??? quote "Interfaces"

    ```vyper
    interface StablePool:
        def exchange(i: int128, j: int128, dx: uint256, min_dy: uint256): payable
        def exchange_underlying(i: int128, j: int128, dx: uint256, min_dy: uint256): payable
        def get_dy(i: int128, j: int128, amount: uint256) -> uint256: view
        def get_dy_underlying(i: int128, j: int128, amount: uint256) -> uint256: view
        def coins(i: uint256) -> address: view
        def calc_withdraw_one_coin(token_amount: uint256, i: int128) -> uint256: view
        def remove_liquidity_one_coin(token_amount: uint256, i: int128, min_amount: uint256): nonpayable

    interface CryptoPool:
        def exchange(i: uint256, j: uint256, dx: uint256, min_dy: uint256): payable
        def exchange_underlying(i: uint256, j: uint256, dx: uint256, min_dy: uint256): payable
        def get_dy(i: uint256, j: uint256, amount: uint256) -> uint256: view
        def get_dy_underlying(i: uint256, j: uint256, amount: uint256) -> uint256: view
        def calc_withdraw_one_coin(token_amount: uint256, i: uint256) -> uint256: view
        def remove_liquidity_one_coin(token_amount: uint256, i: uint256, min_amount: uint256): nonpayable

    interface CryptoPoolETH:
        def exchange(i: uint256, j: uint256, dx: uint256, min_dy: uint256, use_eth: bool): payable

    interface LendingBasePoolMetaZap:
        def exchange_underlying(pool: address, i: int128, j: int128, dx: uint256, min_dy: uint256): nonpayable

    interface CryptoMetaZap:
        def get_dy(pool: address, i: uint256, j: uint256, dx: uint256) -> uint256: view
        def exchange(pool: address, i: uint256, j: uint256, dx: uint256, min_dy: uint256, use_eth: bool): payable

    interface StablePool2Coins:
        def add_liquidity(amounts: uint256[2], min_mint_amount: uint256): payable
        def calc_token_amount(amounts: uint256[2], is_deposit: bool) -> uint256: view

    interface CryptoPool2Coins:
        def calc_token_amount(amounts: uint256[2]) -> uint256: view

    interface StablePool3Coins:
        def add_liquidity(amounts: uint256[3], min_mint_amount: uint256): payable
        def calc_token_amount(amounts: uint256[3], is_deposit: bool) -> uint256: view

    interface CryptoPool3Coins:
        def calc_token_amount(amounts: uint256[3]) -> uint256: view

    interface StablePool4Coins:
        def add_liquidity(amounts: uint256[4], min_mint_amount: uint256): payable
        def calc_token_amount(amounts: uint256[4], is_deposit: bool) -> uint256: view

    interface CryptoPool4Coins:
        def calc_token_amount(amounts: uint256[4]) -> uint256: view

    interface StablePool5Coins:
        def add_liquidity(amounts: uint256[5], min_mint_amount: uint256): payable
        def calc_token_amount(amounts: uint256[5], is_deposit: bool) -> uint256: view

    interface CryptoPool5Coins:
        def calc_token_amount(amounts: uint256[5]) -> uint256: view

    interface LendingStablePool3Coins:
        def add_liquidity(amounts: uint256[3], min_mint_amount: uint256, use_underlying: bool): payable
        def remove_liquidity_one_coin(token_amount: uint256, i: int128, min_amount: uint256, use_underlying: bool) -> uint256: nonpayable

    interface Llamma:
        def get_dx(i: uint256, j: uint256, out_amount: uint256) -> uint256: view

    interface WETH:
        def deposit(): payable
        def withdraw(_amount: uint256): nonpayable

    interface stETH:
        def submit(_refferer: address): payable

    interface frxETHMinter:
        def submit(): payable

    interface wstETH:
        def getWstETHByStETH(_stETHAmount: uint256) -> uint256: view
        def getStETHByWstETH(_wstETHAmount: uint256) -> uint256: view
        def wrap(_stETHAmount: uint256) -> uint256: nonpayable
        def unwrap(_wstETHAmount: uint256) -> uint256: nonpayable

    interface sfrxETH:
        def convertToShares(assets: uint256) -> uint256: view
        def convertToAssets(shares: uint256) -> uint256: view
        def deposit(assets: uint256, receiver: address) -> uint256: nonpayable
        def redeem(shares: uint256, receiver: address, owner: address) -> uint256: nonpayable

    interface wBETH:
        def deposit(referral: address): payable
        def exchangeRate() -> uint256: view

    # SNX
    interface SnxCoin:
        def currencyKey() -> bytes32: nonpayable

    interface Synthetix:
        def exchangeAtomically(sourceCurrencyKey: bytes32, sourceAmount: uint256, destinationCurrencyKey: bytes32, trackingCode: bytes32, minAmount: uint256) -> uint256: nonpayable

    interface SynthetixExchanger:
        def getAmountsForAtomicExchange(sourceAmount: uint256, sourceCurrencyKey: bytes32, destinationCurrencyKey: bytes32) -> AtomicAmountAndFee: view

    interface SynthetixAddressResolver:
        def getAddress(name: bytes32) -> address: view

    # Calc zaps
    interface StableCalc:
        def calc_token_amount(pool: address, token: address, amounts: uint256[10], n_coins: uint256, deposit: bool, use_underlying: bool) -> uint256: view
        def get_dx(pool: address, i: int128, j: int128, dy: uint256, n_coins: uint256) -> uint256: view
        def get_dx_underlying(pool: address, i: int128, j: int128, dy: uint256, n_coins: uint256) -> uint256: view
        def get_dx_meta(pool: address, i: int128, j: int128, dy: uint256, n_coins: uint256, base_pool: address) -> uint256: view
        def get_dx_meta_underlying(pool: address, i: int128, j: int128, dy: uint256, n_coins: uint256, base_pool: address, base_token: address) -> uint256: view

    interface CryptoCalc:
        def get_dx(pool: address, i: uint256, j: uint256, dy: uint256, n_coins: uint256) -> uint256: view
        def get_dx_meta_underlying(pool: address, i: uint256, j: uint256, dy: uint256, n_coins: uint256, base_pool: address, base_token: address) -> uint256: view


    struct AtomicAmountAndFee:
        amountReceived: uint256
        fee: uint256
        exchangeFeeRate: uint256
    ```


---


## **Route and Swap Parameters**

The two most curcial input values when using the `CurveRouter` are `_route`, which determins the route of the exchange and `_swap_params`, which includes swap parameters such as input and output token, swap type, pool type and number of coins in the pool.


### `_route`

The route input is an array of up to 11 addresses. When calling the function, the array must always include 11 addresses. Not used spots in the array need to be filled with `ZERO_ADDRESS`. The route consists of tokens and pools or zaps. The first address is always the input token, the last one always the output token. The addresses inbetween compose the route the user wants to trade.


=== "Example"

    ```py 
    [
        '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',   # initial token: wETH
        '0x7f86bf177dd4f3494b841a37e810a34dd56c829b',   # pool1: TricryptoUSDC (USDC, wBTC, wETH)
        '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',   # token in between: USDC
        '0x4dece678ceceb27446b35c672dc7d61f30bad69e',   # pool2: crvUSD/USDC
        '0xf939e0a03fb07f59a73314e73794be0e57ac1b4e',   # output token: crvUSD
        '0x0000000000000000000000000000000000000000',
        '0x0000000000000000000000000000000000000000',
        '0x0000000000000000000000000000000000000000',
        '0x0000000000000000000000000000000000000000',
        '0x0000000000000000000000000000000000000000',
        '0x0000000000000000000000000000000000000000',
    ]
    ```

*The example demonstrates a swap of [wETH](https://etherscan.io/token/0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2) for [crvUSD](https://etherscan.io/token/0xf939E0A03FB07F59A73314E73794Be0E57ac1b4E). The process involves two stages. First, wETH is swapped for [USDC](https://etherscan.io/token/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48) using the [tricryptoUSDC](https://etherscan.io/address/0x7f86bf177dd4f3494b841a37e810a34dd56c829b) pool. Subsequently, USDC is exchanged for crvUSD using the [crvUSD/USDC](https://etherscan.io/address/0x4dece678ceceb27446b35c672dc7d61f30bad69e) pool.*



---


### `_swap_params`

Swap parameters are defined in a multidimensional array which provides essential information about which tokens to swap using a specified pool.

The array structure includes the following elements: **`[i, j, swap_type, pool_type, n_coins]`**. The first array of this multidimensional setup corresponds to the initial token exchange in the swap sequence.

**`i`**: Index of the input token, fetched from `pool.coins('token address')`.

**`j`**: Index of the output token, fetched from `pool.coins('token address')`.

| `swap_type` | Description |
| :---: | ----------- |
| 1 | Standard token `exchange` |
| 2 | Underlying token `exchange_underlying` |
| 3 | Underlying exchange via zap for factory stable metapools and crypto-meta pools (`exchange_underlying` for stable, `exchange` in zap for crypto) |
| 4 | Coin to LP token "exchange" (effectively `add_liquidity`) |
| 5 | Lending pool underlying coin to LP token "exchange" (effectively `add_liquidity`) |
| 6 | LP token to coin "exchange" (effectively `remove_liquidity_one_coin`) |
| 7 | LP token to lending or fake pool underlying coin "exchange" (effectively `remove_liquidity_one_coin`) |
| 8 | Specialized swaps like ETH <-> WETH, ETH -> stETH or frxETH, and cross-liquidity between staked tokens (e.g., stETH <-> wstETH, frxETH <-> sfrxETH) |
| 9 | SNX-related swaps (e.g., sUSD, sEUR, sETH, sBTC) |

| `pool_type` | Description |
| :---------: | ----------- |
| 1 | Stable pools using the Stableswap algorithm |
| 2 | Two-coin Crypto pools using the Cryptoswap algorithm |
| 3 | Tricrypto pools with three coins using the Cryptoswap algorithm |
| 4 | Llamma pools, typically used in crvUSD and lending markets |

**`n_coins`**: Number of coins contained within the pool.


=== "Example"

    ```py
    [
        [2, 0, 1, 3, 3],    # first swap:  wETH -> USDC using tricryptoUSDC pool
        [0, 1, 1, 1, 2],    # second swap: USDC -> crvUSD using crvUSD/USDC pool
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
    ]
    ```

*Let's take a closer look at the first array, which represents the swap parameters for the first exchange (wETH -> USDC). `i = 2` because the coin index value of wETH in the tricryptoUSDC pool is 2. This can be obtained by calling `tricryptoUSDC.coins(n)`. Similarly, `j = 0` because USDC has the coin index value of 0. The swap type is a regular exchange, represented by `0`. The `pool_type` is 3, as it is a tricrypto pool (a cryptoswap algorithm consisting of three coins: USDC, wBTC, and wETH). The last value in the array represents the number of coins in the pool, which is 3.*

*The values of the second array should be set according to the crvUSD/USDC pool.*


---


## **Exchanging Tokens**

The router has a single `exchange` function, which allows up to 5 swaps in a single transaction. 

Routing and swap parameters need to be determined off-chain. The exchange functionality of the router is designed for gas efficiency over ease-of-use. A according JavaScript library can be found on [:material-github: GitHub](https://github.com/curvefi/curve-router-js).


### `exchange`
!!! description "`Router.exchange(_route: address[11], _swap_params: uint256[5][5], _amount: uint256, _expected: uint256, _pools: address[5] = empty(address[5]), _receiver: address = msg.sender) -> uint256:`"

    Function to perform a token exchange with up to 5 swaps in a single transaction.

    Returns: received amount of the final output token (`uint256`).

    | Input          | Type            | Description |
    | -------------- | --------------- | ----------- |
    | `_route`       | `address[11]`   | Route data: [see here](#_route) |
    | `_swap_params` | `uint256[5][5]` | Swap parameters: [see here](#_swap_params) |
    | `_amount`      | `uint256`       | The amount of the input token (`_route[0]`) to be sent. |
    | `_expected`    | `uint256`       | The minimum amount received after the final swap. |
    | `_pools`       | `address[5]`    | Array of pools for swaps via zap contracts. This parameter is only needed for `swap_type = 3`. |
    | `receiver`     | `address`       | Address to transfer the final output token to. Defaults to `msg.sender`. |

    ??? quote "Source code"

        ```vyper
        event Exchange:
            sender: indexed(address)
            receiver: indexed(address)
            route: address[11]
            swap_params: uint256[5][5]
            pools: address[5]
            in_amount: uint256
            out_amount: uint256

        ETH_ADDRESS: constant(address) = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE
        STETH_ADDRESS: constant(address) = 0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84
        WSTETH_ADDRESS: constant(address) = 0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0
        FRXETH_ADDRESS: constant(address) = 0x5E8422345238F34275888049021821E8E08CAa1f
        SFRXETH_ADDRESS: constant(address) = 0xac3E018457B222d93114458476f3E3416Abbe38F
        WBETH_ADDRESS: constant(address) = 0xa2E3356610840701BDf5611a53974510Ae27E2e1
        WETH_ADDRESS: immutable(address)

        # SNX
        # https://github.com/Synthetixio/synthetix-docs/blob/master/content/addresses.md
        SNX_ADDRESS_RESOLVER: constant(address) = 0x823bE81bbF96BEc0e25CA13170F5AaCb5B79ba83
        SNX_TRACKING_CODE: constant(bytes32) = 0x4355525645000000000000000000000000000000000000000000000000000000  # CURVE
        SNX_EXCHANGER_NAME: constant(bytes32) = 0x45786368616E6765720000000000000000000000000000000000000000000000  # Exchanger
        snx_currency_keys: HashMap[address, bytes32]

        @external
        @payable
        @nonreentrant('lock')
        def exchange(
            _route: address[11],
            _swap_params: uint256[5][5],
            _amount: uint256,
            _expected: uint256,
            _pools: address[5]=empty(address[5]),
            _receiver: address=msg.sender
        ) -> uint256:
            """
            @notice Performs up to 5 swaps in a single transaction.
            @dev Routing and swap params must be determined off-chain. This
                functionality is designed for gas efficiency over ease-of-use.
            @param _route Array of [initial token, pool or zap, token, pool or zap, token, ...]
                        The array is iterated until a pool address of 0x00, then the last
                        given token is transferred to `_receiver`
            @param _swap_params Multidimensional array of [i, j, swap type, pool_type, n_coins] where
                                i is the index of input token
                                j is the index of output token

                                The swap_type should be:
                                1. for `exchange`,
                                2. for `exchange_underlying`,
                                3. for underlying exchange via zap: factory stable metapools with lending base pool `exchange_underlying`
                                and factory crypto-meta pools underlying exchange (`exchange` method in zap)
                                4. for coin -> LP token "exchange" (actually `add_liquidity`),
                                5. for lending pool underlying coin -> LP token "exchange" (actually `add_liquidity`),
                                6. for LP token -> coin "exchange" (actually `remove_liquidity_one_coin`)
                                7. for LP token -> lending or fake pool underlying coin "exchange" (actually `remove_liquidity_one_coin`)
                                8. for ETH <-> WETH, ETH -> stETH or ETH -> frxETH, stETH <-> wstETH, frxETH <-> sfrxETH, ETH -> wBETH
                                9. for SNX swaps (sUSD, sEUR, sETH, sBTC)

                                pool_type: 1 - stable, 2 - crypto, 3 - tricrypto, 4 - llamma
                                n_coins is the number of coins in pool
            @param _amount The amount of input token (`_route[0]`) to be sent.
            @param _expected The minimum amount received after the final swap.
            @param _pools Array of pools for swaps via zap contracts. This parameter is only needed for swap_type = 3.
            @param _receiver Address to transfer the final output token to.
            @return Received amount of the final output token.
            """
            input_token: address = _route[0]
            output_token: address = empty(address)
            amount: uint256 = _amount

            # validate / transfer initial token
            if input_token == ETH_ADDRESS:
                assert msg.value == amount
            else:
                assert msg.value == 0
                assert ERC20(input_token).transferFrom(msg.sender, self, amount, default_return_value=True)

            for i in range(1, 6):
                # 5 rounds of iteration to perform up to 5 swaps
                swap: address = _route[i*2-1]
                pool: address = _pools[i-1] # Only for Polygon meta-factories underlying swap (swap_type == 6)
                output_token = _route[i*2]
                params: uint256[5] = _swap_params[i-1]  # i, j, swap_type, pool_type, n_coins

                if not self.is_approved[input_token][swap]:
                    assert ERC20(input_token).approve(swap, max_value(uint256), default_return_value=True, skip_contract_check=True)
                    self.is_approved[input_token][swap] = True

                eth_amount: uint256 = 0
                if input_token == ETH_ADDRESS:
                    eth_amount = amount
                # perform the swap according to the swap type
                if params[2] == 1:
                    if params[3] == 1:  # stable
                        StablePool(swap).exchange(convert(params[0], int128), convert(params[1], int128), amount, 0, value=eth_amount)
                    else:  # crypto, tricrypto or llamma
                        if input_token == ETH_ADDRESS or output_token == ETH_ADDRESS:
                            CryptoPoolETH(swap).exchange(params[0], params[1], amount, 0, True, value=eth_amount)
                        else:
                            CryptoPool(swap).exchange(params[0], params[1], amount, 0)
                elif params[2] == 2:
                    if params[3] == 1:  # stable
                        StablePool(swap).exchange_underlying(convert(params[0], int128), convert(params[1], int128), amount, 0, value=eth_amount)
                    else:  # crypto or tricrypto
                        CryptoPool(swap).exchange_underlying(params[0], params[1], amount, 0, value=eth_amount)
                elif params[2] == 3:  # SWAP IS ZAP HERE !!!
                    if params[3] == 1:  # stable
                        LendingBasePoolMetaZap(swap).exchange_underlying(pool, convert(params[0], int128), convert(params[1], int128), amount, 0)
                    else:  # crypto or tricrypto
                        use_eth: bool = input_token == ETH_ADDRESS or output_token == ETH_ADDRESS
                        CryptoMetaZap(swap).exchange(pool, params[0], params[1], amount, 0, use_eth, value=eth_amount)
                elif params[2] == 4:
                    if params[4] == 2:
                        amounts: uint256[2] = [0, 0]
                        amounts[params[0]] = amount
                        StablePool2Coins(swap).add_liquidity(amounts, 0, value=eth_amount)
                    elif params[4] == 3:
                        amounts: uint256[3] = [0, 0, 0]
                        amounts[params[0]] = amount
                        StablePool3Coins(swap).add_liquidity(amounts, 0, value=eth_amount)
                    elif params[4] == 4:
                        amounts: uint256[4] = [0, 0, 0, 0]
                        amounts[params[0]] = amount
                        StablePool4Coins(swap).add_liquidity(amounts, 0, value=eth_amount)
                    elif params[4] == 5:
                        amounts: uint256[5] = [0, 0, 0, 0, 0]
                        amounts[params[0]] = amount
                        StablePool5Coins(swap).add_liquidity(amounts, 0, value=eth_amount)
                elif params[2] == 5:
                    amounts: uint256[3] = [0, 0, 0]
                    amounts[params[0]] = amount
                    LendingStablePool3Coins(swap).add_liquidity(amounts, 0, True, value=eth_amount) # example: aave on Polygon
                elif params[2] == 6:
                    if params[3] == 1:  # stable
                        StablePool(swap).remove_liquidity_one_coin(amount, convert(params[1], int128), 0)
                    else:  # crypto or tricrypto
                        CryptoPool(swap).remove_liquidity_one_coin(amount, params[1], 0)  # example: atricrypto3 on Polygon
                elif params[2] == 7:
                    LendingStablePool3Coins(swap).remove_liquidity_one_coin(amount, convert(params[1], int128), 0, True) # example: aave on Polygon
                elif params[2] == 8:
                    if input_token == ETH_ADDRESS and output_token == WETH_ADDRESS:
                        WETH(swap).deposit(value=amount)
                    elif input_token == WETH_ADDRESS and output_token == ETH_ADDRESS:
                        WETH(swap).withdraw(amount)
                    elif input_token == ETH_ADDRESS and output_token == STETH_ADDRESS:
                        stETH(swap).submit(0x0000000000000000000000000000000000000000, value=amount)
                    elif input_token == ETH_ADDRESS and output_token == FRXETH_ADDRESS:
                        frxETHMinter(swap).submit(value=amount)
                    elif input_token == STETH_ADDRESS and output_token == WSTETH_ADDRESS:
                        wstETH(swap).wrap(amount)
                    elif input_token == WSTETH_ADDRESS and output_token == STETH_ADDRESS:
                        wstETH(swap).unwrap(amount)
                    elif input_token == FRXETH_ADDRESS and output_token == SFRXETH_ADDRESS:
                        sfrxETH(swap).deposit(amount, self)
                    elif input_token == SFRXETH_ADDRESS and output_token == FRXETH_ADDRESS:
                        sfrxETH(swap).redeem(amount, self, self)
                    elif input_token == ETH_ADDRESS and output_token == WBETH_ADDRESS:
                        wBETH(swap).deposit(0xeCb456EA5365865EbAb8a2661B0c503410e9B347, value=amount)
                    else:
                        raise "Swap type 8 is only for ETH <-> WETH, ETH -> stETH or ETH -> frxETH, stETH <-> wstETH, frxETH <-> sfrxETH, ETH -> wBETH"
                elif params[2] == 9:
                    Synthetix(swap).exchangeAtomically(self.snx_currency_keys[input_token], amount, self.snx_currency_keys[output_token], SNX_TRACKING_CODE, 0)
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
                if i == 5 or _route[i*2+1] == empty(address):
                    break
                # if there is another swap, the output token becomes the input for the next round
                input_token = output_token

            amount -= 1  # Change non-zero -> non-zero costs less gas than zero -> non-zero
            assert amount >= _expected, "Slippage"

            # transfer the final token to the receiver
            if output_token == ETH_ADDRESS:
                raw_call(_receiver, b"", value=amount)
            else:
                assert ERC20(output_token).transfer(_receiver, amount, default_return_value=True)

            log Exchange(msg.sender, _receiver, _route, _swap_params, _pools, _amount, amount)

            return amount
        ```

    === "Example"
        ```shell
        >>> Router.get_dy([
            '0x34635280737b5BFe6c7DC2FC3065D60d66e78185'    # cvxPRISMA
            '0x3b21C2868B6028CfB38Ff86127eF22E68d16d53B'    # cvxPRISMA/PRISMA pool
            '0xdA47862a83dac0c112BA89c6abC2159b95afd71C'    # PRISMA
            '0x322135Dd9cBAE8Afa84727d9aE1434b5B3EBA44B'    # PRISMA/ETH pool
            '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'    # ETH
            '0x0000000000000000000000000000000000000000'
            '0x0000000000000000000000000000000000000000'
            '0x0000000000000000000000000000000000000000'
            '0x0000000000000000000000000000000000000000'
            '0x0000000000000000000000000000000000000000'
            '0x0000000000000000000000000000000000000000'],
            [[1, 0, 1, 1, 2],   # first swap: cvxPRISMA <> PRISMA
            [1, 0, 1, 2, 2],    # second swap: PRISMA <> ETH
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0]],
            2697000000000000000000, # _amount
            0, # _expected
            [0x3b21C2868B6028CfB38Ff86127eF22E68d16d53B,    # cvxPRISMA/PRISMA pool
            0x322135Dd9cBAE8Afa84727d9aE1434b5B3EBA44B,     # PRISMA/ETH pool
            0x0000000000000000000000000000000000000000,
            0x0000000000000000000000000000000000000000,
            0x0000000000000000000000000000000000000000])

        393335776549796040  # final output
        ```


---


## **Helper Functions**

There are two function to estimate input and output token amounts:

- `get_dy` to estimate the amount of output tokens when exchanging a certain amount of input token
- `get_dx` to estimate the amount of input tokens when exchanging for a certain amount of output tokens


### `get_dy`
!!! description "`Router.get_dy(_route: address[11], _swap_params: uint256[5][5], _amount: uint256, _pools: address[5] = empty(address[5])) -> uint256:`"

    !!!notebook "Jupyter Notebook"
        An easy-to-follow Jupyter Notebook with some examples on how `get_dy` can be used can be found here: [https://try.vyperlang.org/hub/user-redirect/lab/tree/shared/mo-anon/integratooors/curve-router/get_dy.ipynb](https://try.vyperlang.org/hub/user-redirect/lab/tree/shared/mo-anon/integratooors/curve-router/get_dy.ipynb)



    Function to calculate the amount of final output tokens received when performing an exchange.

    Returns: expected amount of final output token (`uint256`).

    | Input          | Type             | Description |
    | -------------- | ---------------- | ----------- |
    | `_route`       | `address[11]`    | Route data: [see here](#_route) |
    | `_swap_params` | `uint256[5][5]`  | Swap parameters: [see here](#_swap_params) |
    | `_amount`      | `uint256`        | The amount of input token (`_route[0]`) to be sent. |
    | `_pools`       | `address[5]`     | Array of pools for swaps via zap contracts. This parameter defaults to an empty array and is only needed for `swap_type = 3`. |

    ??? quote "Source code"

        === "CurveRouterNG.vy"

            ```vyper
            event Exchange:
                sender: indexed(address)
                receiver: indexed(address)
                route: address[11]
                swap_params: uint256[5][5]
                pools: address[5]
                in_amount: uint256
                out_amount: uint256

            ETH_ADDRESS: constant(address) = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE
            STETH_ADDRESS: constant(address) = 0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84
            WSTETH_ADDRESS: constant(address) = 0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0
            FRXETH_ADDRESS: constant(address) = 0x5E8422345238F34275888049021821E8E08CAa1f
            SFRXETH_ADDRESS: constant(address) = 0xac3E018457B222d93114458476f3E3416Abbe38F
            WBETH_ADDRESS: constant(address) = 0xa2E3356610840701BDf5611a53974510Ae27E2e1
            WETH_ADDRESS: immutable(address)

            # SNX
            # https://github.com/Synthetixio/synthetix-docs/blob/master/content/addresses.md
            SNX_ADDRESS_RESOLVER: constant(address) = 0x823bE81bbF96BEc0e25CA13170F5AaCb5B79ba83
            SNX_TRACKING_CODE: constant(bytes32) = 0x4355525645000000000000000000000000000000000000000000000000000000  # CURVE
            SNX_EXCHANGER_NAME: constant(bytes32) = 0x45786368616E6765720000000000000000000000000000000000000000000000  # Exchanger
            snx_currency_keys: HashMap[address, bytes32]

            @view
            @external
            def get_dy(
                _route: address[11],
                _swap_params: uint256[5][5],
                _amount: uint256,
                _pools: address[5]=empty(address[5])
            ) -> uint256:
                """
                @notice Get amount of the final output token received in an exchange
                @dev Routing and swap params must be determined off-chain. This
                    functionality is designed for gas efficiency over ease-of-use.
                @param _route Array of [initial token, pool or zap, token, pool or zap, token, ...]
                            The array is iterated until a pool address of 0x00, then the last
                            given token is transferred to `_receiver`
                @param _swap_params Multidimensional array of [i, j, swap type, pool_type, n_coins] where
                                    i is the index of input token
                                    j is the index of output token

                                    The swap_type should be:
                                    1. for `exchange`,
                                    2. for `exchange_underlying`,
                                    3. for underlying exchange via zap: factory stable metapools with lending base pool `exchange_underlying`
                                    and factory crypto-meta pools underlying exchange (`exchange` method in zap)
                                    4. for coin -> LP token "exchange" (actually `add_liquidity`),
                                    5. for lending pool underlying coin -> LP token "exchange" (actually `add_liquidity`),
                                    6. for LP token -> coin "exchange" (actually `remove_liquidity_one_coin`)
                                    7. for LP token -> lending or fake pool underlying coin "exchange" (actually `remove_liquidity_one_coin`)
                                    8. for ETH <-> WETH, ETH -> stETH or ETH -> frxETH, stETH <-> wstETH, frxETH <-> sfrxETH, ETH -> wBETH
                                    9. for SNX swaps (sUSD, sEUR, sETH, sBTC)

                                    pool_type: 1 - stable, 2 - crypto, 3 - tricrypto, 4 - llamma
                                    n_coins is the number of coins in pool
                @param _amount The amount of input token (`_route[0]`) to be sent.
                @param _pools Array of pools for swaps via zap contracts. This parameter is needed only for swap_type = 3.
                @return Expected amount of the final output token.
                """
                input_token: address = _route[0]
                output_token: address = empty(address)
                amount: uint256 = _amount

                for i in range(1, 6):
                    # 5 rounds of iteration to perform up to 5 swaps
                    swap: address = _route[i*2-1]
                    pool: address = _pools[i-1] # Only for Polygon meta-factories underlying swap (swap_type == 4)
                    output_token = _route[i * 2]
                    params: uint256[5] = _swap_params[i-1]  # i, j, swap_type, pool_type, n_coins

                    # Calc output amount according to the swap type
                    if params[2] == 1:
                        if params[3] == 1:  # stable
                            amount = StablePool(swap).get_dy(convert(params[0], int128), convert(params[1], int128), amount)
                        else:  # crypto or llamma
                            amount = CryptoPool(swap).get_dy(params[0], params[1], amount)
                    elif params[2] == 2:
                        if params[3] == 1:  # stable
                            amount = StablePool(swap).get_dy_underlying(convert(params[0], int128), convert(params[1], int128), amount)
                        else:  # crypto
                            amount = CryptoPool(swap).get_dy_underlying(params[0], params[1], amount)
                    elif params[2] == 3:  # SWAP IS ZAP HERE !!!
                        if params[3] == 1:  # stable
                            amount = StablePool(pool).get_dy_underlying(convert(params[0], int128), convert(params[1], int128), amount)
                        else:  # crypto
                            amount = CryptoMetaZap(swap).get_dy(pool, params[0], params[1], amount)
                    elif params[2] in [4, 5]:
                        if params[3] == 1: # stable
                            amounts: uint256[10] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
                            amounts[params[0]] = amount
                            amount = STABLE_CALC.calc_token_amount(swap, output_token, amounts, params[4], True, True)
                        else:
                            # Tricrypto pools have stablepool interface for calc_token_amount
                            if params[4] == 2:
                                amounts: uint256[2] = [0, 0]
                                amounts[params[0]] = amount
                                if params[3] == 2:  # crypto
                                    amount = CryptoPool2Coins(swap).calc_token_amount(amounts)
                                else:  # tricrypto
                                    amount = StablePool2Coins(swap).calc_token_amount(amounts, True)
                            elif params[4] == 3:
                                amounts: uint256[3] = [0, 0, 0]
                                amounts[params[0]] = amount
                                if params[3] == 2:  # crypto
                                    amount = CryptoPool3Coins(swap).calc_token_amount(amounts)
                                else:  # tricrypto
                                    amount = StablePool3Coins(swap).calc_token_amount(amounts, True)
                            elif params[4] == 4:
                                amounts: uint256[4] = [0, 0, 0, 0]
                                amounts[params[0]] = amount
                                if params[3] == 2:  # crypto
                                    amount = CryptoPool4Coins(swap).calc_token_amount(amounts)
                                else:  # tricrypto
                                    amount = StablePool4Coins(swap).calc_token_amount(amounts, True)
                            elif params[4] == 5:
                                amounts: uint256[5] = [0, 0, 0, 0, 0]
                                amounts[params[0]] = amount
                                if params[3] == 2:  # crypto
                                    amount = CryptoPool5Coins(swap).calc_token_amount(amounts)
                                else:  # tricrypto
                                    amount = StablePool5Coins(swap).calc_token_amount(amounts, True)
                    elif params[2] in [6, 7]:
                        if params[3] == 1:  # stable
                            amount = StablePool(swap).calc_withdraw_one_coin(amount, convert(params[1], int128))
                        else:  # crypto
                            amount = CryptoPool(swap).calc_withdraw_one_coin(amount, params[1])
                    elif params[2] == 8:
                        if input_token == WETH_ADDRESS or output_token == WETH_ADDRESS or \
                                (input_token == ETH_ADDRESS and output_token == STETH_ADDRESS) or \
                                (input_token == ETH_ADDRESS and output_token == FRXETH_ADDRESS):
                            # ETH <--> WETH rate is 1:1
                            # ETH ---> stETH rate is 1:1
                            # ETH ---> frxETH rate is 1:1
                            pass
                        elif input_token == WSTETH_ADDRESS:
                            amount = wstETH(swap).getStETHByWstETH(amount)
                        elif output_token == WSTETH_ADDRESS:
                            amount = wstETH(swap).getWstETHByStETH(amount)
                        elif input_token == SFRXETH_ADDRESS:
                            amount = sfrxETH(swap).convertToAssets(amount)
                        elif output_token == SFRXETH_ADDRESS:
                            amount = sfrxETH(swap).convertToShares(amount)
                        elif output_token == WBETH_ADDRESS:
                            amount = amount * 10**18 / wBETH(swap).exchangeRate()
                        else:
                            raise "Swap type 8 is only for ETH <-> WETH, ETH -> stETH or ETH -> frxETH, stETH <-> wstETH, frxETH <-> sfrxETH, ETH -> wBETH"
                    elif params[2] == 9:
                        snx_exchanger: address = SynthetixAddressResolver(SNX_ADDRESS_RESOLVER).getAddress(SNX_EXCHANGER_NAME)
                        atomic_amount_and_fee: AtomicAmountAndFee = SynthetixExchanger(snx_exchanger).getAmountsForAtomicExchange(
                            amount, self.snx_currency_keys[input_token], self.snx_currency_keys[output_token]
                        )
                        amount = atomic_amount_and_fee.amountReceived
                    else:
                        raise "Bad swap type"

                    # check if this was the last swap
                    if i == 5 or _route[i*2+1] == empty(address):
                        break
                    # if there is another swap, the output token becomes the input for the next round
                    input_token = output_token

                return amount - 1
            ```

    === "Example"
        ```shell
        >>> Router.get_dy(
            ['0x34635280737b5BFe6c7DC2FC3065D60d66e78185',  # crxPRISMA
            '0x3b21C2868B6028CfB38Ff86127eF22E68d16d53B',   # cvxPRISMA/PRISMA pool
            '0xdA47862a83dac0c112BA89c6abC2159b95afd71C',   # PRISMA
            '0x322135Dd9cBAE8Afa84727d9aE1434b5B3EBA44B',   # PRISMA/ETH pool
            '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',   # ETH
            '0x0000000000000000000000000000000000000000', 
            '0x0000000000000000000000000000000000000000', 
            '0x0000000000000000000000000000000000000000', 
            '0x0000000000000000000000000000000000000000', 
            '0x0000000000000000000000000000000000000000', 
            '0x0000000000000000000000000000000000000000'],
            [[1, 0, 1, 1, 2],   # first swap: cvxPRISMA <> PRISMA
            [1, 0, 1, 2, 2],    # second swap: PRISMA <> ETH
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0]],
            100000000000000000000,  # _amount
            ['0x3b21C2868B6028CfB38Ff86127eF22E68d16d53B',  # cvxPRISMA/PRISMA pool
            '0x322135Dd9cBAE8Afa84727d9aE1434b5B3EBA44B',   # PRISMA/ETH pool
            '0x0000000000000000000000000000000000000000', 
            '0x0000000000000000000000000000000000000000', 
            '0x0000000000000000000000000000000000000000'])
        18597416260226417   # expected output
        ```


### `get_dx`
!!! description "`Router.get_dx(_route: address[11], _swap_params: uint256[5][5], _out_amount: uint256, _pools: address[5], _base_pools: address[5]=empty(address[5]), _base_tokens: address[5] = empty(address[5])) -> uint256:`"

    !!!notebook "Jupyter Notebook"
        An easy-to-follow Jupyter Notebook with some examples on how `get_dx` can be used can be found here: [https://try.vyperlang.org/hub/user-redirect/lab/tree/shared/mo-anon/integratooors/curve-router/get_dx.ipynb](https://try.vyperlang.org/hub/user-redirect/lab/tree/shared/mo-anon/integratooors/curve-router/get_dx.ipynb).

    Function to calculate the amount of input tokens required to receive the desired amount of output tokens.

    Returns: required amount of input token (`uint256`).

    | Input          | Type            | Description |
    | -------------- | --------------- | ----------- |
    | `_route`       | `address[11]`   | Route data: [see here](#_route) |
    | `_swap_params` | `uint256[5][5]` | Swap parameters: [see here](#_swap_params) |
    | `_out_amount`  | `uint256`       | The desired amount of output coin to receive. |
    | `_pools`       | `address[5]`    | Array of pools. |
    | `_base_pools`  | `address[5]`    | Array of base pools (for meta pools). Defaults to an empty array. |
    | `_base_tokens` | `address[5]`    | Array of base LP tokens (for meta pools). Should be a zap address for double meta pools. Defaults to an empty array. |

    ??? quote "Source code"

        ```vyper
        event Exchange:
            sender: indexed(address)
            receiver: indexed(address)
            route: address[11]
            swap_params: uint256[5][5]
            pools: address[5]
            in_amount: uint256
            out_amount: uint256

        ETH_ADDRESS: constant(address) = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE
        STETH_ADDRESS: constant(address) = 0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84
        WSTETH_ADDRESS: constant(address) = 0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0
        FRXETH_ADDRESS: constant(address) = 0x5E8422345238F34275888049021821E8E08CAa1f
        SFRXETH_ADDRESS: constant(address) = 0xac3E018457B222d93114458476f3E3416Abbe38F
        WBETH_ADDRESS: constant(address) = 0xa2E3356610840701BDf5611a53974510Ae27E2e1
        WETH_ADDRESS: immutable(address)

        # SNX
        # https://github.com/Synthetixio/synthetix-docs/blob/master/content/addresses.md
        SNX_ADDRESS_RESOLVER: constant(address) = 0x823bE81bbF96BEc0e25CA13170F5AaCb5B79ba83
        SNX_TRACKING_CODE: constant(bytes32) = 0x4355525645000000000000000000000000000000000000000000000000000000  # CURVE
        SNX_EXCHANGER_NAME: constant(bytes32) = 0x45786368616E6765720000000000000000000000000000000000000000000000  # Exchanger
        snx_currency_keys: HashMap[address, bytes32]

        @view
        @external
        def get_dx(
            _route: address[11],
            _swap_params: uint256[5][5],
            _out_amount: uint256,
            _pools: address[5],
            _base_pools: address[5]=empty(address[5]),
            _base_tokens: address[5]=empty(address[5]),
        ) -> uint256:
            """
            @notice Calculate the input amount required to receive the desired output amount
            @dev Routing and swap params must be determined off-chain. This
                functionality is designed for gas efficiency over ease-of-use.
            @param _route Array of [initial token, pool or zap, token, pool or zap, token, ...]
                        The array is iterated until a pool address of 0x00, then the last
                        given token is transferred to `_receiver`
            @param _swap_params Multidimensional array of [i, j, swap type, pool_type, n_coins] where
                                i is the index of input token
                                j is the index of output token

                                The swap_type should be:
                                1. for `exchange`,
                                2. for `exchange_underlying`,
                                3. for underlying exchange via zap: factory stable metapools with lending base pool `exchange_underlying`
                                and factory crypto-meta pools underlying exchange (`exchange` method in zap)
                                4. for coin -> LP token "exchange" (actually `add_liquidity`),
                                5. for lending pool underlying coin -> LP token "exchange" (actually `add_liquidity`),
                                6. for LP token -> coin "exchange" (actually `remove_liquidity_one_coin`)
                                7. for LP token -> lending or fake pool underlying coin "exchange" (actually `remove_liquidity_one_coin`)
                                8. for ETH <-> WETH, ETH -> stETH or ETH -> frxETH, stETH <-> wstETH, frxETH <-> sfrxETH, ETH -> wBETH
                                9. for SNX swaps (sUSD, sEUR, sETH, sBTC)

                                pool_type: 1 - stable, 2 - crypto, 3 - tricrypto, 4 - llamma
                                n_coins is the number of coins in pool
            @param _out_amount The desired amount of output coin to receive.
            @param _pools Array of pools.
            @param _base_pools Array of base pools (for meta pools).
            @param _base_tokens Array of base lp tokens (for meta pools). Should be a zap address for double meta pools.
            @return Required amount of input token to send.
            """
            amount: uint256 = _out_amount

            for _i in range(1, 6):
                # 5 rounds of iteration to perform up to 5 swaps
                i: uint256 = 6 - _i
                swap: address = _route[i*2-1]
                if swap == empty(address):
                    continue
                input_token: address = _route[(i - 1) * 2]
                output_token: address = _route[i * 2]
                pool: address = _pools[i-1]
                base_pool: address = _base_pools[i-1]
                base_token: address = _base_tokens[i-1]
                params: uint256[5] = _swap_params[i-1]  # i, j, swap_type, pool_type, n_coins
                n_coins: uint256 = params[4]


                # Calc a required input amount according to the swap type
                if params[2] == 1:
                    if params[3] == 1:  # stable
                        if base_pool == empty(address):  # non-meta
                            amount = STABLE_CALC.get_dx(pool, convert(params[0], int128), convert(params[1], int128), amount, n_coins)
                        else:
                            amount = STABLE_CALC.get_dx_meta(pool, convert(params[0], int128), convert(params[1], int128), amount, n_coins, base_pool)
                    elif params[3] in [2, 3]:  # crypto or tricrypto
                        amount = CRYPTO_CALC.get_dx(pool, params[0], params[1], amount, n_coins)
                    else:  # llamma
                        amount = Llamma(pool).get_dx(params[0], params[1], amount)
                elif params[2] in [2, 3]:
                    if params[3] == 1:  # stable
                        if base_pool == empty(address):  # non-meta
                            amount = STABLE_CALC.get_dx_underlying(pool, convert(params[0], int128), convert(params[1], int128), amount, n_coins)
                        else:
                            amount = STABLE_CALC.get_dx_meta_underlying(pool, convert(params[0], int128), convert(params[1], int128), amount, n_coins, base_pool, base_token)
                    else:  # crypto
                        amount = CRYPTO_CALC.get_dx_meta_underlying(pool, params[0], params[1], amount, n_coins, base_pool, base_token)
                elif params[2] in [4, 5]:
                    # This is not correct. Should be something like calc_add_one_coin. But tests say that it's precise enough.
                    if params[3] == 1:  # stable
                        amount = StablePool(swap).calc_withdraw_one_coin(amount, convert(params[0], int128))
                    else:  # crypto
                        amount = CryptoPool(swap).calc_withdraw_one_coin(amount, params[0])
                elif params[2] in [6, 7]:
                    if params[3] == 1: # stable
                        amounts: uint256[10] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
                        amounts[params[1]] = amount
                        amount = STABLE_CALC.calc_token_amount(swap, input_token, amounts, n_coins, False, True)
                    else:
                        # Tricrypto pools have stablepool interface for calc_token_amount
                        if n_coins == 2:
                            amounts: uint256[2] = [0, 0]
                            amounts[params[1]] = amount
                            if params[3] == 2:  # crypto
                                amount = CryptoPool2Coins(swap).calc_token_amount(amounts)  # This is not correct
                            else:  # tricrypto
                                amount = StablePool2Coins(swap).calc_token_amount(amounts, False)
                        elif n_coins == 3:
                            amounts: uint256[3] = [0, 0, 0]
                            amounts[params[1]] = amount
                            if params[3] == 2:  # crypto
                                amount = CryptoPool3Coins(swap).calc_token_amount(amounts)  # This is not correct
                            else:  # tricrypto
                                amount = StablePool3Coins(swap).calc_token_amount(amounts, False)
                        elif n_coins == 4:
                            amounts: uint256[4] = [0, 0, 0, 0]
                            amounts[params[1]] = amount
                            if params[3] == 2:  # crypto
                                amount = CryptoPool4Coins(swap).calc_token_amount(amounts)  # This is not correct
                            else:  # tricrypto
                                amount = StablePool4Coins(swap).calc_token_amount(amounts, False)
                        elif n_coins == 5:
                            amounts: uint256[5] = [0, 0, 0, 0, 0]
                            amounts[params[1]] = amount
                            if params[3] == 2:  # crypto
                                amount = CryptoPool5Coins(swap).calc_token_amount(amounts)  # This is not correct
                            else:  # tricrypto
                                amount = StablePool5Coins(swap).calc_token_amount(amounts, False)
                elif params[2] == 8:
                    if input_token == WETH_ADDRESS or output_token == WETH_ADDRESS or \
                            (input_token == ETH_ADDRESS and output_token == STETH_ADDRESS) or \
                            (input_token == ETH_ADDRESS and output_token == FRXETH_ADDRESS):
                        # ETH <--> WETH rate is 1:1
                        # ETH ---> stETH rate is 1:1
                        # ETH ---> frxETH rate is 1:1
                        pass
                    elif input_token == WSTETH_ADDRESS:
                        amount = wstETH(swap).getWstETHByStETH(amount)
                    elif output_token == WSTETH_ADDRESS:
                        amount = wstETH(swap).getStETHByWstETH(amount)
                    elif input_token == SFRXETH_ADDRESS:
                        amount = sfrxETH(swap).convertToShares(amount)
                    elif output_token == SFRXETH_ADDRESS:
                        amount = sfrxETH(swap).convertToAssets(amount)
                    elif output_token == WBETH_ADDRESS:
                        amount = amount * wBETH(swap).exchangeRate() / 10**18
                    else:
                        raise "Swap type 8 is only for ETH <-> WETH, ETH -> stETH or ETH -> frxETH, stETH <-> wstETH, frxETH <-> sfrxETH, ETH -> wBETH"
                elif params[2] == 9:
                    snx_exchanger: address = SynthetixAddressResolver(SNX_ADDRESS_RESOLVER).getAddress(SNX_EXCHANGER_NAME)
                    atomic_amount_and_fee: AtomicAmountAndFee = SynthetixExchanger(snx_exchanger).getAmountsForAtomicExchange(
                        10**18, self.snx_currency_keys[input_token], self.snx_currency_keys[output_token]
                    )
                    amount = amount * 10**18 / atomic_amount_and_fee.amountReceived
                else:
                    raise "Bad swap type"

            return amount
        ```

    === "Example"
        ```shell
        >>> Router.get_dx(
            ['0x34635280737b5BFe6c7DC2FC3065D60d66e78185',  # crxPRISMA
            '0x3b21C2868B6028CfB38Ff86127eF22E68d16d53B',   # cvxPRISMA/PRISMA pool
            '0xdA47862a83dac0c112BA89c6abC2159b95afd71C',   # PRISMA
            '0x322135Dd9cBAE8Afa84727d9aE1434b5B3EBA44B',   # PRISMA/ETH pool
            '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',   # ETH
            '0x0000000000000000000000000000000000000000', 
            '0x0000000000000000000000000000000000000000', 
            '0x0000000000000000000000000000000000000000', 
            '0x0000000000000000000000000000000000000000', 
            '0x0000000000000000000000000000000000000000', 
            '0x0000000000000000000000000000000000000000'], 
            [[1, 0, 1, 1, 2],   # first swap: cvxPRISMA <> PRISMA
            [1, 0, 1, 2, 2],    # second swap: PRISMA <> ETH
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0]], 
            100000000000000000000,  # _out_amount
            ['0x3b21C2868B6028CfB38Ff86127eF22E68d16d53B',  # cvxPRISMA/PRISMA pool
            '0x322135Dd9cBAE8Afa84727d9aE1434b5B3EBA44B',   # PRISMA/ETH pool
            '0x0000000000000000000000000000000000000000', 
            '0x0000000000000000000000000000000000000000', 
            '0x0000000000000000000000000000000000000000'])
        18597416260226417 # expected input
        ```
