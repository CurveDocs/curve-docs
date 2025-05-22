<h1>CryptoFromPoolsRate</h1>

This oracle contract **chains together two oracles from two different Curve liquidity pools and optionally applies `stored_rates` to tokens with an existing rate oracle**. By chaining oracles together, it facilitates the creation of lending oracle contracts without requiring the collateral asset to be paired directly against crvUSD. The first oracle contracts were deployed without considering the [aggregated price of crvUSD](../../crvUSD/priceaggregator.md), but experience has shown that it makes sense to include this value in the calculation. The respective differences are documented in the relevant sections.

These kinds of oracle contracts **need to be deployed manually**, as there is currently no `Factory` to do so.


!!!github "GitHub"
    The source code of the following price oracle contracts can be found on :material-github: GitHub:

    - [`CryptoFromPoolsRate.vy`](https://github.com/curvefi/curve-stablecoin/blob/master/contracts/price_oracles/CryptoFromPoolsRate.vy)
    - [`CryptoFromPoolsRateWAgg.vy`](https://github.com/curvefi/curve-stablecoin/blob/master/contracts/price_oracles/CryptoFromPoolsRateWAgg.vy)


!!!danger "Oracle Immutability"
    The oracle contracts are fully immutable. Once deployed, they cannot change any parameters, stop the price updates, or alter the pools used to calculate the prices. All relevant data required for the oracle to function is passed into the `__init__` function during the deployment of the contract.

    ???quote "`__init__`"

        === "CryptoFromPoolsRate.vy"

            ```python
            @external
            def __init__(
                    pools: DynArray[Pool, MAX_POOLS],
                    borrowed_ixs: DynArray[uint256, MAX_POOLS],
                    collateral_ixs: DynArray[uint256, MAX_POOLS]
                ):
                POOLS = pools
                pool_count: uint256 = 0
                no_arguments: DynArray[bool, MAX_POOLS] = empty(DynArray[bool, MAX_POOLS])
                use_rates: DynArray[bool, MAX_POOLS] = empty(DynArray[bool, MAX_POOLS])

                for i in range(MAX_POOLS):
                    if i == len(pools):
                        assert i != 0, "Wrong pool counts"
                        pool_count = i
                        break

                    # Find N
                    N: uint256 = 0
                    for j in range(MAX_COINS + 1):
                        success: bool = False
                        res: Bytes[32] = empty(Bytes[32])
                        success, res = raw_call(
                            pools[i].address,
                            _abi_encode(j, method_id=method_id("coins(uint256)")),
                            max_outsize=32, is_static_call=True, revert_on_failure=False)
                        if not success:
                            assert j != 0, "No coins(0)"
                            N = j
                            break

                    assert borrowed_ixs[i] != collateral_ixs[i]
                    assert borrowed_ixs[i] < N
                    assert collateral_ixs[i] < N

                    # Init variables for raw call
                    success: bool = False

                    # Check and record if pool requires coin id in argument or no
                    if N == 2:
                        res: Bytes[32] = empty(Bytes[32])
                        success, res = raw_call(
                            pools[i].address,
                            _abi_encode(empty(uint256), method_id=method_id("price_oracle(uint256)")),
                            max_outsize=32, is_static_call=True, revert_on_failure=False)
                        if not success:
                            no_arguments.append(True)
                        else:
                            no_arguments.append(False)
                    else:
                        no_arguments.append(False)

                    res: Bytes[1024] = empty(Bytes[1024])
                    success, res = raw_call(pools[i].address, method_id("stored_rates()"), max_outsize=1024, is_static_call=True, revert_on_failure=False)
                    stored_rates: DynArray[uint256, MAX_COINS] = empty(DynArray[uint256, MAX_COINS])
                    if success and len(res) > 0:
                        stored_rates = _abi_decode(res, DynArray[uint256, MAX_COINS])

                    u: bool = False
                    for r in stored_rates:
                        if r != 10**18:
                            u = True
                    use_rates.append(u)
            ```

        === "CryptoFromPoolsRateWAgg.vy"

            ```python
            @external
            def __init__(
                    pools: DynArray[Pool, MAX_POOLS],
                    borrowed_ixs: DynArray[uint256, MAX_POOLS],
                    collateral_ixs: DynArray[uint256, MAX_POOLS],
                    agg: StableAggregator
                ):
                POOLS = pools
                pool_count: uint256 = 0
                no_arguments: DynArray[bool, MAX_POOLS] = empty(DynArray[bool, MAX_POOLS])
                use_rates: DynArray[bool, MAX_POOLS] = empty(DynArray[bool, MAX_POOLS])
                AGG = agg

                for i in range(MAX_POOLS):
                    if i == len(pools):
                        assert i != 0, "Wrong pool counts"
                        pool_count = i
                        break

                    # Find N
                    N: uint256 = 0
                    for j in range(MAX_COINS + 1):
                        success: bool = False
                        res: Bytes[32] = empty(Bytes[32])
                        success, res = raw_call(
                            pools[i].address,
                            _abi_encode(j, method_id=method_id("coins(uint256)")),
                            max_outsize=32, is_static_call=True, revert_on_failure=False)
                        if not success:
                            assert j != 0, "No coins(0)"
                            N = j
                            break

                    assert borrowed_ixs[i] != collateral_ixs[i]
                    assert borrowed_ixs[i] < N
                    assert collateral_ixs[i] < N

                    # Init variables for raw call
                    success: bool = False

                    # Check and record if pool requires coin id in argument or no
                    if N == 2:
                        res: Bytes[32] = empty(Bytes[32])
                        success, res = raw_call(
                            pools[i].address,
                            _abi_encode(empty(uint256), method_id=method_id("price_oracle(uint256)")),
                            max_outsize=32, is_static_call=True, revert_on_failure=False)
                        if not success:
                            no_arguments.append(True)
                        else:
                            no_arguments.append(False)
                    else:
                        no_arguments.append(False)

                    res: Bytes[1024] = empty(Bytes[1024])
                    success, res = raw_call(pools[i].address, method_id("stored_rates()"), max_outsize=1024, is_static_call=True, revert_on_failure=False)
                    stored_rates: DynArray[uint256, MAX_COINS] = empty(DynArray[uint256, MAX_COINS])
                    if success and len(res) > 0:
                        stored_rates = _abi_decode(res, DynArray[uint256, MAX_COINS])

                    u: bool = False
                    for r in stored_rates:
                        if r != 10**18:
                            u = True
                    use_rates.append(u)

                NO_ARGUMENT = no_arguments
                BORROWED_IX = borrowed_ixs
                COLLATERAL_IX = collateral_ixs
                if pool_count == 0:
                    pool_count = MAX_POOLS
                POOL_COUNT = pool_count
                USE_RATES = use_rates
            ```


---


## **Oracle Price**


The price is determined by combining two different oracle prices. When necessary, `stored_rates` are used to adjust the final computed price from these combined oracles.

!!!example "Example"
    For example, suppose the oracle price of Token/ETH is 0.05, and the oracle price of ETH/crvUSD is 1000. The computed price of Token/crvUSD would then be calculated as follows:

    $\text{price} = 0.05 \times 1000 = 50$

    This calculation indicates that one Token is equivalent to 50 crvUSD.



### `price`
!!! description "`CryptoFromPoolsRate.price() -> uint256`"

    Getter for the price of the collateral denominated against the borrowed token. E.g. a market with pufETH as collateral and crvUSD borrowable, the price will return the pufETH price with regard to crvUSD.

    Returns: oracle price (`uint256`).

    ??? quote "Source code"

        The `CryptoFromPoolsRate.vy` oracle contract does not take the aggregated price of crvUSD from the [`PriceAggregator.vy` contract](../../crvUSD/priceaggregator.md) into account. Experience has shown that it makes sense to include this value in the oracle calculations. This is implemented in the `CryptoFromPoolsRateWAgg.vy` oracle contract.

        The following source code includes all changes up to commit hash [86cae3a](https://github.com/curvefi/curve-stablecoin/tree/86cae3a89f2138122be428b3c060cc75fa1df1b0); any changes made after this commit are not included.

        === "CryptoFromPoolsRate.vy"

            ```python
            @external
            @view
            def price() -> uint256:
                return self._unscaled_price() * self._stored_rate()[0] / 10**18

            @internal
            @view
            def _unscaled_price() -> uint256:
                _price: uint256 = 10**18
                for i in range(MAX_POOLS):
                    if i >= POOL_COUNT:
                        break
                    p_borrowed: uint256 = 10**18
                    p_collateral: uint256 = 10**18

                    if NO_ARGUMENT[i]:
                        p: uint256 = POOLS[i].price_oracle()
                        if COLLATERAL_IX[i] > 0:
                            p_collateral = p
                        else:
                            p_borrowed = p

                    else:
                        if BORROWED_IX[i] > 0:
                            p_borrowed = POOLS[i].price_oracle(unsafe_sub(BORROWED_IX[i], 1))
                        if COLLATERAL_IX[i] > 0:
                            p_collateral = POOLS[i].price_oracle(unsafe_sub(COLLATERAL_IX[i], 1))
                    _price = _price * p_collateral / p_borrowed
                return _price

            @internal
            @view
            def _stored_rate() -> (uint256, bool):
                use_rates: bool = False
                rate: uint256 = 0
                rate, use_rates = self._raw_stored_rate()
                if not use_rates:
                    return rate, use_rates

                cached_rate: uint256 = self.cached_rate

                if cached_rate == 0 or cached_rate == rate:
                    return rate, use_rates

                if rate > cached_rate:
                    return min(rate, cached_rate * (10**18 + RATE_MAX_SPEED * (block.timestamp - self.cached_timestamp)) / 10**18), use_rates

                else:
                    return max(rate, cached_rate * (10**18 - min(RATE_MAX_SPEED * (block.timestamp - self.cached_timestamp), 10**18)) / 10**18), use_rates

            @internal
            @view
            def _raw_stored_rate() -> (uint256, bool):
                rate: uint256 = 10**18
                use_rates: bool = False

                for i in range(MAX_POOLS):
                    if i == POOL_COUNT:
                        break
                    if USE_RATES[i]:
                        use_rates = True
                        rates: DynArray[uint256, MAX_COINS] = POOLS[i].stored_rates()
                        rate = rate * rates[COLLATERAL_IX[i]] / rates[BORROWED_IX[i]]

                return rate, use_rates
            ```

        === "CryptoFromPoolsRateWAgg.vy"

            ```python
            interface StableAggregator:
                def price() -> uint256: view
                def price_w() -> uint256: nonpayable
                def stablecoin() -> address: view

            AGG: public(immutable(StableAggregator))

            @external
            @view
            def price() -> uint256:
                return self._unscaled_price() * self._stored_rate()[0] / 10**18 * AGG.price() / 10**18

            @internal
            @view
            def _unscaled_price() -> uint256:
                _price: uint256 = 10**18
                for i in range(MAX_POOLS):
                    if i >= POOL_COUNT:
                        break
                    p_borrowed: uint256 = 10**18
                    p_collateral: uint256 = 10**18

                    if NO_ARGUMENT[i]:
                        p: uint256 = POOLS[i].price_oracle()
                        if COLLATERAL_IX[i] > 0:
                            p_collateral = p
                        else:
                            p_borrowed = p

                    else:
                        if BORROWED_IX[i] > 0:
                            p_borrowed = POOLS[i].price_oracle(unsafe_sub(BORROWED_IX[i], 1))
                        if COLLATERAL_IX[i] > 0:
                            p_collateral = POOLS[i].price_oracle(unsafe_sub(COLLATERAL_IX[i], 1))
                    _price = _price * p_collateral / p_borrowed
                return _price

            @internal
            @view
            def _stored_rate() -> (uint256, bool):
                use_rates: bool = False
                rate: uint256 = 0
                rate, use_rates = self._raw_stored_rate()
                if not use_rates:
                    return rate, use_rates

                cached_rate: uint256 = self.cached_rate

                if cached_rate == 0 or cached_rate == rate:
                    return rate, use_rates

                if rate > cached_rate:
                    return min(rate, cached_rate * (10**18 + RATE_MAX_SPEED * (block.timestamp - self.cached_timestamp)) / 10**18), use_rates

                else:
                    return max(rate, cached_rate * (10**18 - min(RATE_MAX_SPEED * (block.timestamp - self.cached_timestamp), 10**18)) / 10**18), use_rates

            @internal
            @view
            def _raw_stored_rate() -> (uint256, bool):
                rate: uint256 = 10**18
                use_rates: bool = False

                for i in range(MAX_POOLS):
                    if i == POOL_COUNT:
                        break
                    if USE_RATES[i]:
                        use_rates = True
                        rates: DynArray[uint256, MAX_COINS] = POOLS[i].stored_rates()
                        rate = rate * rates[COLLATERAL_IX[i]] / rates[BORROWED_IX[i]]

                return rate, use_rates
            ```

    === "Example"
        ```shell
        >>> CryptoFromPoolsRate.price()
        3110715001971074513929
        ```


### `price_w`
!!! description "`CryptoFromPoolsRate.price_w() -> uint256`"

    This function calculates and writes the price while updating `cached_rate` and `cached_timestamp`. It is invoked whenever the `_exchange` function is called within the AMM contract of the lending market.

    Returns: oracle price (`uint256`).

    ??? quote "Source code"

        The `CryptoFromPoolsRate.vy` oracle contract does not take the aggregated price of crvUSD from the [`PriceAggregator.vy` contract](../../crvUSD/priceaggregator.md) into account. Experience has shown that it makes sense to include this value in the oracle calculations. This is implemented in the `CryptoFromPoolsRateWAgg.vy` oracle contract.

        The following source code includes all changes up to commit hash [86cae3a](https://github.com/curvefi/curve-stablecoin/tree/86cae3a89f2138122be428b3c060cc75fa1df1b0); any changes made after this commit are not included.

        === "CryptoFromPoolsRate.vy"

            ```python
            @external
            def price_w() -> uint256:
                return self._unscaled_price() * self._stored_rate_w() / 10**18

            @internal
            @view
            def _unscaled_price() -> uint256:
                _price: uint256 = 10**18
                for i in range(MAX_POOLS):
                    if i >= POOL_COUNT:
                        break
                    p_borrowed: uint256 = 10**18
                    p_collateral: uint256 = 10**18

                    if NO_ARGUMENT[i]:
                        p: uint256 = POOLS[i].price_oracle()
                        if COLLATERAL_IX[i] > 0:
                            p_collateral = p
                        else:
                            p_borrowed = p

                    else:
                        if BORROWED_IX[i] > 0:
                            p_borrowed = POOLS[i].price_oracle(unsafe_sub(BORROWED_IX[i], 1))
                        if COLLATERAL_IX[i] > 0:
                            p_collateral = POOLS[i].price_oracle(unsafe_sub(COLLATERAL_IX[i], 1))
                    _price = _price * p_collateral / p_borrowed
                return _price

            @internal
            def _stored_rate_w() -> uint256:
                rate: uint256 = 0
                use_rates: bool = False
                rate, use_rates = self._stored_rate()
                if use_rates:
                    self.cached_rate = rate
                    self.cached_timestamp = block.timestamp
                return rate

            @internal
            @view
            def _stored_rate() -> (uint256, bool):
                use_rates: bool = False
                rate: uint256 = 0
                rate, use_rates = self._raw_stored_rate()
                if not use_rates:
                    return rate, use_rates

                cached_rate: uint256 = self.cached_rate

                if cached_rate == 0 or cached_rate == rate:
                    return rate, use_rates

                if rate > cached_rate:
                    return min(rate, cached_rate * (10**18 + RATE_MAX_SPEED * (block.timestamp - self.cached_timestamp)) / 10**18), use_rates

                else:
                    return max(rate, cached_rate * (10**18 - min(RATE_MAX_SPEED * (block.timestamp - self.cached_timestamp), 10**18)) / 10**18), use_rates
            ```

        === "CryptoFromPoolsRateWAgg.vy"

            ```python
            interface StableAggregator:
                def price() -> uint256: view
                def price_w() -> uint256: nonpayable
                def stablecoin() -> address: view

            AGG: public(immutable(StableAggregator))

            @external
            def price_w() -> uint256:
                return self._unscaled_price() * self._stored_rate_w() / 10**18 * AGG.price_w() / 10**18

            @internal
            @view
            def _unscaled_price() -> uint256:
                _price: uint256 = 10**18
                for i in range(MAX_POOLS):
                    if i >= POOL_COUNT:
                        break
                    p_borrowed: uint256 = 10**18
                    p_collateral: uint256 = 10**18

                    if NO_ARGUMENT[i]:
                        p: uint256 = POOLS[i].price_oracle()
                        if COLLATERAL_IX[i] > 0:
                            p_collateral = p
                        else:
                            p_borrowed = p

                    else:
                        if BORROWED_IX[i] > 0:
                            p_borrowed = POOLS[i].price_oracle(unsafe_sub(BORROWED_IX[i], 1))
                        if COLLATERAL_IX[i] > 0:
                            p_collateral = POOLS[i].price_oracle(unsafe_sub(COLLATERAL_IX[i], 1))
                    _price = _price * p_collateral / p_borrowed
                return _price

            @internal
            def _stored_rate_w() -> uint256:
                rate: uint256 = 0
                use_rates: bool = False
                rate, use_rates = self._stored_rate()
                if use_rates:
                    self.cached_rate = rate
                    self.cached_timestamp = block.timestamp
                return rate

            @internal
            @view
            def _stored_rate() -> (uint256, bool):
                use_rates: bool = False
                rate: uint256 = 0
                rate, use_rates = self._raw_stored_rate()
                if not use_rates:
                    return rate, use_rates

                cached_rate: uint256 = self.cached_rate

                if cached_rate == 0 or cached_rate == rate:
                    return rate, use_rates

                if rate > cached_rate:
                    return min(rate, cached_rate * (10**18 + RATE_MAX_SPEED * (block.timestamp - self.cached_timestamp)) / 10**18), use_rates

                else:
                    return max(rate, cached_rate * (10**18 - min(RATE_MAX_SPEED * (block.timestamp - self.cached_timestamp), 10**18)) / 10**18), use_rates
            ```

    === "Example"
        ```shell
        >>> CryptoFromPoolsRate.price_w()
        3110715001971074513929
        ```



---


## **Rates**

The oracle contract utilizes the `stored_rates` from a Stableswap pool and considers these rates accordingly. The application of these rates is governed by the `USE_RATES` variable. If set to `true`, the rates are applied; if set to `false`, they are not.

???quote "Source code"

    ```py
    RATE_MAX_SPEED: constant(uint256) = 10**16 / 60  # Max speed of Rate change

    @internal
    @view
    def _stored_rate() -> (uint256, bool):
        use_rates: bool = False
        rate: uint256 = 0
        rate, use_rates = self._raw_stored_rate()
        if not use_rates:
            return rate, use_rates
        cached_rate: uint256 = self.cached_rate

        if cached_rate == 0 or cached_rate == rate:
            return rate, use_rates

        if rate > cached_rate:
            return min(rate, cached_rate * (10**18 + RATE_MAX_SPEED * (block.timestamp - self.cached_timestamp)) / 10**18), use_rates

        else:
            return max(rate, cached_rate * (10**18 - min(RATE_MAX_SPEED * (block.timestamp - self.cached_timestamp), 10**18)) / 10**18), use_rates
    ```

Based on the values of `rate` and `cached_rate`, specific calculations are required to account for changes in rates:

- **If the `cached_rate` is 0** (indicating that no rates need to be applied) **or equal to the actual `rate`** (meaning no rate changes have occurred since the last update), there is no need to do additional calculations to obtain the `rate` value.

- **If `rate > cached_rate`**, the rate is calculated as follows:
    $\text{rate} = \min\left(\text{rate}, \frac{\text{cached_rate} \times \left(10^{18} + \text{RATE_MAX_SPEED} \times (\text{block.timestamp} - \text{cached_timestamp})\right)}{10^{18}}\right)$
    This calculation aims to smoothly increase the rate, capping it at a calculated maximum based on the `RATE_MAX_SPEED` and the time elapsed since the last cache update.

- **In all other cases**, where the rate has decreased, it is calculated as follows:
    $\text{rate} = \max\left(\text{rate}, \frac{\text{cached_rate} \times \left(10^{18} - \min\left(\text{RATE_MAX_SPEED} \times (\text{block.timestamp} - \text{cached_timestamp}), 10^{18}\right)\right)}{10^{18}}\right)$
    This formula ensures that the rate does not decrease too rapidly, with the reduction bounded by a minimum that considers the `RATE_MAX_SPEED` and the elapsed time.



### `stored_rate`
!!! description "`CryptoFromPoolsRate.stored_rate() -> uint256`"

    Getter for the stored rates fetched from a Stableswap pool.

    The `stored_rate` is calculated the following:

    $$\text{rate} = 10^{18} * \frac{\text{stored_rates[collateral_ix]}}{\text{stored_rates[borrowed_ix]}}$$

    Returns: stored rate (`uint256`).

    ??? quote "Source code"

        The following source code includes all changes up to commit hash [86cae3a](https://github.com/curvefi/curve-stablecoin/tree/86cae3a89f2138122be428b3c060cc75fa1df1b0); any changes made after this commit are not included.

        === "CryptoFromPoolsRate.vy"

            ```python
            @external
            @view
            def stored_rate() -> uint256:
                return self._stored_rate()[0]

            @internal
            @view
            def _stored_rate() -> (uint256, bool):
                use_rates: bool = False
                rate: uint256 = 0
                rate, use_rates = self._raw_stored_rate()
                if not use_rates:
                    return rate, use_rates

                cached_rate: uint256 = self.cached_rate

                if cached_rate == 0 or cached_rate == rate:
                    return rate, use_rates

                if rate > cached_rate:
                    return min(rate, cached_rate * (10**18 + RATE_MAX_SPEED * (block.timestamp - self.cached_timestamp)) / 10**18), use_rates

                else:
                    return max(rate, cached_rate * (10**18 - min(RATE_MAX_SPEED * (block.timestamp - self.cached_timestamp), 10**18)) / 10**18), use_rates

            @internal
            @view
            def _raw_stored_rate() -> (uint256, bool):
                rate: uint256 = 10**18
                use_rates: bool = False

                for i in range(MAX_POOLS):
                    if i == POOL_COUNT:
                        break
                    if USE_RATES[i]:
                        use_rates = True
                        rates: DynArray[uint256, MAX_COINS] = POOLS[i].stored_rates()
                        rate = rate * rates[COLLATERAL_IX[i]] / rates[BORROWED_IX[i]]

                return rate, use_rates
            ```

    === "Example"
        ```shell
        >>> StableSwap.stored_rates()
        1009207839112594800, 1166115485922357109

        >>> CryptoFromPoolsRate.stored_rate()
        865444161659808698              # calculated via: 1009207839112594800 / 1166115485922357109
        ```


### `cached_rate`
!!! description "`CryptoFromPoolsRate.cached_rate() -> uint256: view`"

    Getter for the cached rate. This value is updated whenever the `price_w` method is called.

    Returns: cached rate (`uint256`).

    ??? quote "Source code"

        The following source code includes all changes up to commit hash [86cae3a](https://github.com/curvefi/curve-stablecoin/tree/86cae3a89f2138122be428b3c060cc75fa1df1b0); any changes made after this commit are not included.

        === "CryptoFromPoolsRate.vy"

            ```python
            cached_rate: public(uint256)

            @external
            def price_w() -> uint256:
                return self._unscaled_price() * self._stored_rate_w() / 10**18

            @internal
            def _stored_rate_w() -> uint256:
                rate: uint256 = 0
                use_rates: bool = False
                rate, use_rates = self._stored_rate()
                if use_rates:
                    self.cached_rate = rate
                    self.cached_timestamp = block.timestamp
                return rate
            ```

    === "Example"
        ```shell
        >>> CryptoFromPoolsRate.cached_rate()
        865388487987562874
        ```


### `cached_timestamp`
!!! description "`CryptoFromPoolsRate.cached_timestamp() -> uint256: view`"

    Getter for the cached timestamp. This value is updated whenever the `price_w` method is called.

    Returns: cached timestamp (`uint256`)

    ??? quote "Source code"

        The following source code includes all changes up to commit hash [86cae3a](https://github.com/curvefi/curve-stablecoin/tree/86cae3a89f2138122be428b3c060cc75fa1df1b0); any changes made after this commit are not included.

        === "CryptoFromPoolsRate.vy"

            ```python
            cached_timestamp: public(uint256)

            @external
            def price_w() -> uint256:
                return self._unscaled_price() * self._stored_rate_w() / 10**18

            @internal
            def _stored_rate_w() -> uint256:
                rate: uint256 = 0
                use_rates: bool = False
                rate, use_rates = self._stored_rate()
                if use_rates:
                    self.cached_rate = rate
                    self.cached_timestamp = block.timestamp
                return rate
            ```

    === "Example"
        ```shell
        >>> CryptoFromPoolsRate.cached_timestamp()
        1714877987
        ```


### `USE_RATES`
!!! description "`CryptoFromPoolsRate.USE_RATES(arg0: uint256) -> bool: view`"

    Getter method to check wether the pool at index `arg0` uses rates or not. Pool indices are fetched via [`POOLS`](#pools).

    Returns: whether to apply rates or not (`bool`).

    | Input  | Type      | Description |
    | ------ | --------- | ----------- |
    | `arg0` | `uint256` | Pool index. |

    ??? quote "Source code"

        The following source code includes all changes up to commit hash [86cae3a](https://github.com/curvefi/curve-stablecoin/tree/86cae3a89f2138122be428b3c060cc75fa1df1b0); any changes made after this commit are not included.

        === "CryptoFromPoolsRate.vy"

            ```python
            USE_RATES: public(immutable(DynArray[bool, MAX_POOLS]))
            ```

    === "Example"
        ```shell
        >>> CryptoFromPoolsRate.USE_RATES(0)    # checks for pufETH/wETH pool
        'true'                                  # true, because the `stored_rates` of this pool are used

        >>> CryptoFromPoolsRate.USE_RATES(0)    # checks for tryLSD pool
        'false'                                 # false, because no rates are used
        ```


---


## **Contract Info Methods**

### `POOLS`
!!! description "`CryptoFromPoolsRate.POOLS(arg0: uint256) -> address: view`"

    Getter for the liquidity pools used in the oracle contract.

    Returns: pool contract (`address`).

    | Input  | Type      | Description |
    | ------ | --------- | ----------- |
    | `arg0` | `uint256` | Pool index. |

    ??? quote "Source code"

        The following source code includes all changes up to commit hash [86cae3a](https://github.com/curvefi/curve-stablecoin/tree/86cae3a89f2138122be428b3c060cc75fa1df1b0); any changes made after this commit are not included.

        === "CryptoFromPoolsRate.vy"

            ```python
            POOLS: public(immutable(DynArray[Pool, MAX_POOLS]))
            ```

    === "Example"
        ```shell
        >>> CryptoFromPoolsRate.POOLS(0)
        '0xEEda34A377dD0ca676b9511EE1324974fA8d980D'

        >>> CryptoFromPoolsRate.POOLS(1)
        '0x2889302a794dA87fBF1D6Db415C1492194663D13'
        ```


### `POOL_COUNT`
!!! description "`CryptoFromPoolsRate.POOL_COUNT() -> uint256: view`"

    Getter for the total amount of pools used in the oracle contract.

    Returns: amount of pools (`uint256`).

    ??? quote "Source code"

        The following source code includes all changes up to commit hash [86cae3a](https://github.com/curvefi/curve-stablecoin/tree/86cae3a89f2138122be428b3c060cc75fa1df1b0); any changes made after this commit are not included.

        === "CryptoFromPoolsRate.vy"

            ```python
            POOL_COUNT: public(immutable(uint256))
            ```

    === "Example"
        ```shell
        >>> CryptoFromPoolsRate.POOL_COUNT()
        2
        ```


### `BORROWED_IX`
!!! description "`CryptoFromPoolsRate.BORROWED_IX(arg0: uint256) -> uint256: view`"

    Getter for the index of the borrowed token in the chain together pools. If the oracle contract is for an asset that has a rate, this method will return the coin indices of the "base asset". E.g., for pufETH, this method will return the index of wstETH in the pools and later, when calculating the price of pufETH, the rates are applied.

    Returns: coin index (`uint256`).

    | Input  | Type      | Description |
    | ------ | --------- | ----------- |
    | `arg0` | `uint256` | Pool index to check `BORROWED_IX` for. |

    ??? quote "Source code"

        The following source code includes all changes up to commit hash [86cae3a](https://github.com/curvefi/curve-stablecoin/tree/86cae3a89f2138122be428b3c060cc75fa1df1b0); any changes made after this commit are not included.

        === "CryptoFromPoolsRate.vy"

            ```python
            BORROWED_IX: public(immutable(DynArray[uint256, MAX_POOLS]))
            ```

    === "Example"
        ```shell
        >>> CryptoFromPoolsRate.BORROWED_IX(0)
        1                   # wstETH

        >>> CryptoFromPoolsRate.BORROWED_IX(1)
        0                   # wstETH
        ```


### `COLLATERAL_IX`
!!! description "`CryptoFromPoolsRate.COLLATERAL_IX(arg0: uint256) -> uint256: view`"

    Getter for the index of the collateral token within the pool.

    Returns: coin index (`uint256`).

    | Input | Type      | Description                               |
    |-------|-----------|-------------------------------------------|
    | `arg0` | `uint256` | Pool index to check `COLLATERAL_IX` for. |

    ??? quote "Source code"

        The following source code includes all changes up to commit hash [86cae3a](https://github.com/curvefi/curve-stablecoin/tree/86cae3a89f2138122be428b3c060cc75fa1df1b0); any changes made after this commit are not included.

        === "CryptoFromPoolsRate.vy"

            ```python
            COLLATERAL_IX: public(immutable(DynArray[uint256, MAX_POOLS]))
            ```

    === "Example"
        ```shell
        >>> CryptoFromPoolsRate.COLLATERAL_IX(0)
        0                   # pufETH

        >>> CryptoFromPoolsRate.COLLATERAL_IX(1)
        2                   # wstETH
        ```


### `NO_ARGUMENT`
!!! description "`CryptoFromPoolsRate.NO_ARGUMENT(arg0: uin256) -> bool: view`"

    Getter for the `NO_ARGUMENT` storage variable. This is an additional variable to ensure the correct price oracle is fetched from a pool.

    Returns: true or false (bool)

    | Input  | Type      | Description |
    | ------ | --------- | ----------- |
    | `arg0` | `uint256` | Pool index. |

    ??? quote "Source code"

        The following source code includes all changes up to commit hash [86cae3a](https://github.com/curvefi/curve-stablecoin/tree/86cae3a89f2138122be428b3c060cc75fa1df1b0); any changes made after this commit are not included.

        === "CryptoFromPoolsRate.vy"

            ```python
            NO_ARGUMENT: public(immutable(DynArray[bool, MAX_POOLS]))
            ```

    === "Example"
        ```shell
        >>> CryptoFromPoolsRate.NO_ARGUMENT(0)
        'false'

        >>> CryptoFromPoolsRate.NO_ARGUMENT(1)
        'false'
        ```


### `AGG`
!!! description "`CryptoFromPoolsRate.AGG() -> address: view`"

    !!!info
        This `AGG` storage variable is only used within the `CryptoFromPoolsRateWAgg` contracts.

    Getter for the crvUSD `PriceAggregator` contract. This value is immutable and set at contract initialization.

    Returns: `PriceAggregator` (`address`).

    ??? quote "Source code"

        The following source code includes all changes up to commit hash [86cae3a](https://github.com/curvefi/curve-stablecoin/tree/86cae3a89f2138122be428b3c060cc75fa1df1b0); any changes made after this commit are not included.

        === "CryptoFromPoolsRate.vy"

            ```python
            interface StableAggregator:
                def price() -> uint256: view
                def price_w() -> uint256: nonpayable
                def stablecoin() -> address: view

            AGG: public(immutable(StableAggregator))
            ```

    === "Example"

        ```shell
        >>> CryptoFromPoolsRate.AGG()
        '0x18672b1b0c623a30089A280Ed9256379fb0E4E62'
        ```
