<h1>Curve Lending: Oracles</h1>

!!!github ""GitHub
    The source code of the `CryptoFromPool.vy` oracle contract can be found on [GitHub :material-github:](https://github.com/curvefi/curve-stablecoin/blob/lending/contracts/price_oracles/CryptoFromPool.vy).

The [`OneWayLendingFactory.vy`](./oneway-factory.md) has a `create_from_pool` method which deploys the full lending market infrastucture alsong with a price oracle using a `stableswap-ng`, `twocrypto-ng` or `tricrypto-ng` pool. These pools all have a suitable exponential moving-average (EMA) oracle, which can be used in lending markets.

Additionally, the price [oracle contracts on Arbitrum](#arbitrum) take the status of the sequencer into consideration.



## **Ethereum**


???quote "Source code: `create_from_pool`"

    ```py hl_lines="50 51"
    @external
    @nonreentrant('lock')
    def create_from_pool(
            borrowed_token: address,
            collateral_token: address,
            A: uint256,
            fee: uint256,
            loan_discount: uint256,
            liquidation_discount: uint256,
            pool: address,
            name: String[64],
            min_borrow_rate: uint256 = 0,
            max_borrow_rate: uint256 = 0
        ) -> Vault:
        """
        @notice Creation of the vault using existing oraclized Curve pool as a price oracle
        @param borrowed_token Token which is being borrowed
        @param collateral_token Token used for collateral
        @param A Amplification coefficient: band size is ~1/A
        @param fee Fee for swaps in AMM (for ETH markets found to be 0.6%)
        @param loan_discount Maximum discount. LTV = sqrt(((A - 1) / A) ** 4) - loan_discount
        @param liquidation_discount Liquidation discount. LT = sqrt(((A - 1) / A) ** 4) - liquidation_discount
        @param pool Curve tricrypto-ng, twocrypto-ng or stableswap-ng pool which has non-manipulatable price_oracle().
                    Must contain both collateral_token and borrowed_token.
        @param name Human-readable market name
        @param min_borrow_rate Custom minimum borrow rate (otherwise min_default_borrow_rate)
        @param max_borrow_rate Custom maximum borrow rate (otherwise max_default_borrow_rate)
        """
        # Find coins in the pool
        borrowed_ix: uint256 = 100
        collateral_ix: uint256 = 100
        N: uint256 = 0
        for i in range(10):
            success: bool = False
            res: Bytes[32] = empty(Bytes[32])
            success, res = raw_call(
                pool,
                _abi_encode(i, method_id=method_id("coins(uint256)")),
                max_outsize=32, is_static_call=True, revert_on_failure=False)
            coin: address = convert(res, address)
            if not success or coin == empty(address):
                break
            N += 1
            if coin == borrowed_token:
                borrowed_ix = i
            elif coin == collateral_token:
                collateral_ix = i
        if collateral_ix == 100 or borrowed_ix == 100:
            raise "Tokens not in pool"
        price_oracle: address = create_from_blueprint(
            self.pool_price_oracle_impl, pool, N, borrowed_ix, collateral_ix, code_offset=3)

        return self._create(borrowed_token, collateral_token, A, fee, loan_discount, liquidation_discount,
                            price_oracle, name, min_borrow_rate, max_borrow_rate)
    ```



### `price`
!!! description "`CryptoFromPool.price() -> uint256`"

    Getter function for the price. For example, in a lending market using `CRV` as collateral and `crvUSD` as the borrowable token, it returns the price of `CRV` relative to `crvUSD`. Conversely, in the inverse market scenario, it returns the price of `crvUSD` relative to `CRV`. This function is view-only and does not modify the state.

    Returns: price (`uint256`).

    ??? quote "Source code"

        === "CryptoFromPool.vy"

            ```py
            @external
            @view
            def price() -> uint256:
                return self._raw_price()

            @internal
            @view
            def _raw_price() -> uint256:
                p_borrowed: uint256 = 10**18
                p_collateral: uint256 = 10**18

                if NO_ARGUMENT:
                    p: uint256 = POOL.price_oracle()
                    if COLLATERAL_IX > 0:
                        p_collateral = p
                    else:
                        p_borrowed = p

                else:
                    if BORROWED_IX > 0:
                        p_borrowed = POOL.price_oracle(BORROWED_IX - 1)
                    if COLLATERAL_IX > 0:
                        p_collateral = POOL.price_oracle(COLLATERAL_IX - 1)

                return p_collateral * 10**18 / p_borrowed
            ```

    === "Example"
        ```shell
        >>> CryptoFromPool.price()
        458009543343504151
        ```


### `price_w`
!!! description "`CryptoFromPool.price_w() -> uint256:`"

    Function to return the price and update the state of the blockchain.

    Returns: price (`uint256`).

    ??? quote "Source code"

        === "CryptoFromPool.vy"

            ```vyper
            @external
            def price_w() -> uint256:
                return self._raw_price()

            @internal
            @view
            def _raw_price() -> uint256:
                p_borrowed: uint256 = 10**18
                p_collateral: uint256 = 10**18

                if NO_ARGUMENT:
                    p: uint256 = POOL.price_oracle()
                    if COLLATERAL_IX > 0:
                        p_collateral = p
                    else:
                        p_borrowed = p

                else:
                    if BORROWED_IX > 0:
                        p_borrowed = POOL.price_oracle(BORROWED_IX - 1)
                    if COLLATERAL_IX > 0:
                        p_collateral = POOL.price_oracle(COLLATERAL_IX - 1)

                return p_collateral * 10**18 / p_borrowed
            ```

    === "Example"
        ```shell
        >>> CryptoFromPool.price_w()
        458009543343504151
        ```


### `POOL`
!!! description "`CryptoFromPool.POOL() -> address: view`"

    Getter for the liquidity pool the from where the oracle is used.

    Returns: liquidity pool (`address`).

    ??? quote "Source code"

        === "CryptoFromPool.vy"

            ```vyper
            POOL: public(immutable(Pool))

            @external
            def __init__(
                    pool: Pool,
                    N: uint256,
                    borrowed_ix: uint256,
                    collateral_ix: uint256
                ):
                assert borrowed_ix != collateral_ix
                assert borrowed_ix < N
                assert collateral_ix < N
                POOL = pool
                N_COINS = N
                BORROWED_IX = borrowed_ix
                COLLATERAL_IX = collateral_ix

                no_argument: bool = False
                if N == 2:
                    success: bool = False
                    res: Bytes[32] = empty(Bytes[32])
                    success, res = raw_call(
                        pool.address,
                        _abi_encode(empty(uint256), method_id=method_id("price_oracle(uint256)")),
                        max_outsize=32, is_static_call=True, revert_on_failure=False)
                    if not success:
                        no_argument = True
                NO_ARGUMENT = no_argument
            ```

    === "Example"
        ```shell
        >>> CryptoFromPool.POOL()
        '0x4eBdF703948ddCEA3B11f675B4D1Fba9d2414A14'
        ```


### `BORROWED_IX`
!!! description "`CryptoFromPool.BORROWED_IX() -> uint256: view`"

    Getter for the index of the borrowed coin in `POOL`.

    Returns: coin index in the pool (`uint256`).

    ??? quote "Source code"

        === "CryptoFromPool.vy"

            ```vyper
            BORROWED_IX: public(immutable(uint256))

            @external
            def __init__(
                    pool: Pool,
                    N: uint256,
                    borrowed_ix: uint256,
                    collateral_ix: uint256
                ):
                assert borrowed_ix != collateral_ix
                assert borrowed_ix < N
                assert collateral_ix < N
                POOL = pool
                N_COINS = N
                BORROWED_IX = borrowed_ix
                COLLATERAL_IX = collateral_ix

                no_argument: bool = False
                if N == 2:
                    success: bool = False
                    res: Bytes[32] = empty(Bytes[32])
                    success, res = raw_call(
                        pool.address,
                        _abi_encode(empty(uint256), method_id=method_id("price_oracle(uint256)")),
                        max_outsize=32, is_static_call=True, revert_on_failure=False)
                    if not success:
                        no_argument = True
                NO_ARGUMENT = no_argument
            ```

    === "Example"
        ```shell
        >>> CryptoFromPool.BORROWED_IX()
        0
        ```


### `COLLATERAL_IX`
!!! description "`CryptoFromPool.COLLATERAL_IX() -> uint256: view`"

    Getter for the index of the collateral coin in `POOL`.

    Returns: coin index in the pool (`uint256`).

    ??? quote "Source code"

        === "CryptoFromPool.vy"

            ```vyper
            COLLATERAL_IX: public(immutable(uint256))

            @external
            def __init__(
                    pool: Pool,
                    N: uint256,
                    borrowed_ix: uint256,
                    collateral_ix: uint256
                ):
                assert borrowed_ix != collateral_ix
                assert borrowed_ix < N
                assert collateral_ix < N
                POOL = pool
                N_COINS = N
                BORROWED_IX = borrowed_ix
                COLLATERAL_IX = collateral_ix

                no_argument: bool = False
                if N == 2:
                    success: bool = False
                    res: Bytes[32] = empty(Bytes[32])
                    success, res = raw_call(
                        pool.address,
                        _abi_encode(empty(uint256), method_id=method_id("price_oracle(uint256)")),
                        max_outsize=32, is_static_call=True, revert_on_failure=False)
                    if not success:
                        no_argument = True
                NO_ARGUMENT = no_argument
            ```

    === "Example"
        ```shell
        >>> CryptoFromPool.COLLATERAL_IX()
        1
        ```


### `N_COINS`
!!! description "`CryptoFromPool.N_COINS() -> uint256: view`"

    Getter for the total number of coin in the liquidity pool.

    Returns: coins count (`uint256`).

    ??? quote "Source code"

        === "CryptoFromPool.vy"

            ```vyper
            N_COINS: public(immutable(uint256))

            @external
            def __init__(
                    pool: Pool,
                    N: uint256,
                    borrowed_ix: uint256,
                    collateral_ix: uint256
                ):
                assert borrowed_ix != collateral_ix
                assert borrowed_ix < N
                assert collateral_ix < N
                POOL = pool
                N_COINS = N
                BORROWED_IX = borrowed_ix
                COLLATERAL_IX = collateral_ix

                no_argument: bool = False
                if N == 2:
                    success: bool = False
                    res: Bytes[32] = empty(Bytes[32])
                    success, res = raw_call(
                        pool.address,
                        _abi_encode(empty(uint256), method_id=method_id("price_oracle(uint256)")),
                        max_outsize=32, is_static_call=True, revert_on_failure=False)
                    if not success:
                        no_argument = True
                NO_ARGUMENT = no_argument
            ```

    === "Example"
        ```shell
        >>> CryptoFromPool.N_COINS()
        3
        ```


### `NO_ARGUMENT`
!!! description "`CryptoFromPool.NO_ARGUMENT() -> bool: view`"

    Fucntion to...
    Is `false` when the liquidity pool from with the price oracle is taken only has two coins. Else


    Returns: 

    Emits:

    ??? quote "Source code"

        === "CryptoFromPool.vy"

            ```vyper
            NO_ARGUMENT: public(immutable(bool))

            @external
            def __init__(
                    pool: Pool,
                    N: uint256,
                    borrowed_ix: uint256,
                    collateral_ix: uint256
                ):
                assert borrowed_ix != collateral_ix
                assert borrowed_ix < N
                assert collateral_ix < N
                POOL = pool
                N_COINS = N
                BORROWED_IX = borrowed_ix
                COLLATERAL_IX = collateral_ix

                no_argument: bool = False
                if N == 2:
                    success: bool = False
                    res: Bytes[32] = empty(Bytes[32])
                    success, res = raw_call(
                        pool.address,
                        _abi_encode(empty(uint256), method_id=method_id("price_oracle(uint256)")),
                        max_outsize=32, is_static_call=True, revert_on_failure=False)
                    if not success:
                        no_argument = True
                NO_ARGUMENT = no_argument
            ```

    === "Example"
        ```shell
        >>> CryptoFromPool.NO_ARGUMENT()
        'False'
        ```


---


## **Arbitrum**

Additionally, the oracles on Arbitrum utilize a [Chainlink](https://chain.link/) oracle to monitor and verify any potential downtime of the sequencer. 

```py
interface ChainlinkOracle:
    def latestRoundData() -> ChainlinkAnswer: view

struct ChainlinkAnswer:
    roundID: uint80
    answer: int256
    startedAt: uint256
    updatedAt: uint256
    answeredInRound: uint80

@internal
@view
def _raw_price() -> uint256:
    # Check that we had no downtime
    cl_answer: ChainlinkAnswer = ChainlinkOracle(CHAINLINK_UPTIME_FEED).latestRoundData()
    assert cl_answer.answer == 0, "Sequencer is down"
    assert block.timestamp >= cl_answer.startedAt + DOWNTIME_WAIT, "Wait after downtime"
    ...
```

The `price_w` function will revert if the [Chainlink Uptime Feed](https://etherscan.io/address/0xFdB631F5EE196F0ed6FAa767959853A9F217697D) answer indicates that the Arbitrum sequencer is currently down, or if it was recently offline and the `DOWNTIME_WAIT` period of 3988 seconds has not yet passed.



### `CHAINLINK_UPTIME_FEED`
!!! description "`CryptoFromPool.CHAINLINK_UPTIME_FEED() -> address: view`"

    Getter for the `ChainlinkUptimeFeed` contract.

    Returns: uptime feed contract (`address`).

    ??? quote "Source code"

        === "CryptoFromPool.vy"

            ```vyper
            CHAINLINK_UPTIME_FEED: public(constant(address)) = 0xFdB631F5EE196F0ed6FAa767959853A9F217697D
            ```

    === "Example"
        ```shell
        >>> CryptoFromPool.CHAINLINK_UPTIME_FEED()
        '0xFdB631F5EE196F0ed6FAa767959853A9F217697D'
        ```


### `DOWNTIME_WAIT`
!!! description "`CryptoFromPool.DOWNTIME_WAIT() -> uint256: view`"

    Getter for the required time to wait after the sequencer was down.

    Returns: time to wait (`uint256`).

    ??? quote "Source code"

        === "CryptoFromPool.vy"

            ```vyper
            DOWNTIME_WAIT: public(constant(uint256)) = 3988  # 866 * log(100) s
            ```

    === "Example"
        ```shell
        >>> CryptoFromPool.DOWNTIME_WAIT()
        3988
        ```