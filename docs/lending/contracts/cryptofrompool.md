<h1>CryptoFromPool</h1>

Oracle contract for a collateral token that **fetches its price from a single Curve pool**.

!!!github "GitHub"
    The source code of the `CryptoFromPool.vy` and all other oracle contracts can be found on [:material-github: GitHub](https://github.com/curvefi/curve-stablecoin/blob/lending/contracts/price_oracles/).

The [`OneWayLendingFactory.vy`](./oneway-factory.md) has a [`create_from_pool`](./oneway-factory.md#create_from_pool) method which deploys the full lending market infrastucture along with a price oracle using a [`stableswap-ng`](../../stableswap-exchange/stableswap-ng/pools/oracles.md), [`twocrypto-ng`](../../cryptoswap-exchange/twocrypto-ng/overview.md) or [`tricrypto-ng`](../../cryptoswap-exchange/tricrypto-ng/pools/oracles.md) pool. These pools all have a suitable exponential moving-average (EMA) oracle, which can be used in lending markets.

Additionally, the price [oracle contracts on :logos-arbitrum: Arbitrum](#arbitrum) take the status of the [sequencer](https://docs.arbitrum.io/sequencer) into consideration.


!!!example "Example: CRV long market"

    In the CRV short market, `CRV` serves as the collateral token, while `crvUSD` is the borrowable token. This lending market utilizes the price oracle sourced from the [TriCRV liquidity pool](https://etherscan.io/address/0x4ebdf703948ddcea3b11f675b4d1fba9d2414a14).

    When calling the `create_from_pool` function, the code automatically checks the index of the tokens within the liquidity pool. Subsequently, it passes these values as constructor arguments during the creation of the oracle contract from the blueprint implementation.

    ???quote "`__init__`"

        ```py
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
                if not success
                    no_argument = True
            NO_ARGUMENT = no_argument
        ```


    ```py
    # the following arguments will be passed into the `__init__` function:
    pool = '0x4ebdf703948ddcea3b11f675b4d1fba9d2414a14'
    N = 3
    borrow_ix = 0               # crvUSD
    collateral_ix = 2           # CRV
    ```


---


## **Ethereum**


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

    Function to return the price and update the state of the blockchain. This function is called whenever the `_exchange` function from the LLAMMA is called.

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

        === "LLAMMA.vy"

            ```vyper hl_lines="3 22"
            @internal
            def _price_oracle_w() -> uint256[2]:
                p: uint256[2] = self.limit_p_o(price_oracle_contract.price_w())
                self.prev_p_o_time = block.timestamp
                self.old_p_o = p[0]
                self.old_dfee = p[1]
                return p

            @internal
            def _exchange(i: uint256, j: uint256, amount: uint256, minmax_amount: uint256, _for: address, use_in_amount: bool) -> uint256[2]:
                """
                @notice Exchanges two coins, callable by anyone
                @param i Input coin index
                @param j Output coin index
                @param amount Amount of input/output coin to swap
                @param minmax_amount Minimal/maximum amount to get as output/input
                @param _for Address to send coins to
                @param use_in_amount Whether input or output amount is specified
                @return Amount of coins given in and out
                """
                assert (i == 0 and j == 1) or (i == 1 and j == 0), "Wrong index"
                p_o: uint256[2] = self._price_oracle_w()  # Let's update the oracle even if we exchange 0
                if amount == 0:
                    return [0, 0]
                ...
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

    Getter for the index of the borrowed coin in the liquidity pool from which the price oracle is taken from.

    Returns: coin index (`uint256`).

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

    Getter for the index of the collateral coin in the liquidity pool from which the price oracle is taken from.

    Returns: coin index (`uint256`).

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
        2
        ```


### `N_COINS`
!!! description "`CryptoFromPool.N_COINS() -> uint256: view`"

    Getter for the total number of coins in the liquidity pool.

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

    Getter for the `NO_ARGUMENT` storage variable. This is an additional variable to ensure the correct price oracle is fetched from a pool with more than two coins.
    The variable is set to `false` if the pool from which the price oracle is taken has only two coins.

    Returns: true or false (`bool`)

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

In addition to the aforementioned functions, oracle contracts on Arbitrum use a [Chainlink Uptime Feed Oracle](https://arbiscan.io/address/0xFdB631F5EE196F0ed6FAa767959853A9F217697D) to monitor and validate any potential downtime of the [sequencer](https://docs.arbitrum.io/sequencer).

Should the internal `_raw_price` function, responsible for fetching the price, encounter an indication from the uptime oracle that the Arbitrum sequencer is presently offline, or if it has experienced recent downtime and the `DOWNTIME_WAIT` period of 3988 seconds has not yet elapsed, it will revert.


```vyper
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