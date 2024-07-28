<h1>Price Aggregator</h1>

The `AggregateStablePrice.vy` contract is designed to **get an aggregated price of crvUSD based on multiple multiple stableswap pools weighted by their TVL**. 

!!!github "GitHub"
    There are three iterations of the `AggregateStablePrice` contract. Source code for the contracts can be found on [:material-github: GitHub](https://github.com/curvefi/curve-stablecoin/tree/master/contracts/price_oracles). Relevant contract deployments can be found [here](../references/deployed-contracts.md#curve-stablecoin).

This aggregated price of crvUSD is used in multiple different components in the system such as in [monetary policy contracts](./monetarypolicy.md), [PegKeepers](../crvUSD/pegkeepers/overview.md) or [oracles for lending markets](../lending/contracts/oracle-overview.md).


---


# **Calculations**

The `AggregateStablePrice` contract calculates the **weighted average price of crvUSD across multiple liquidity pools**, considering only those pools with sufficient liquidity (`MIN_LIQUIDITY = 100,000 * 10**18`). The calculation is based on the **exponential moving average (EMA) of the Total-Value-Locked (TVL)** for each pool, determining the liquidity considered in the price aggregation.

## **EMA TVL Calculation**

The price calculation starts with determining the EMA of the TVL from different Curve Stableswap liquidity pools using the `_ema_tvl` function. This internal function computes the EMA TVLs based on the formula below, which adjusts for the time since the last update to smooth out short-term volatility in the TVL data, providing a more stable and representative average value over the specified time window (`TVL_MA_TIME = 50000`):

$$\alpha = 
    \begin{cases} 
    1 & \text{if last_timestamp} = \text{current_timestamp}, \\
    e^{-\frac{(\text{current_timestamp} - \text{last_timestamp}) * 10^{18}}{\text{TVL_MA_TIME}}} & \text{otherwise}.
    \end{cases}
$$

$$\text{ema_tvl}_{i} = \frac{\text{new_tvl}_i * (10^{18} - \alpha) + \text{tvl}_i * \alpha}{10^{18}}$$

*The code snippet provided illustrates the implementation of the above formula in the contract.*

???quote "Source code for `_ema_tvl`"

    === "AggregateStablePrice.vy"

        ```py
        TVL_MA_TIME: public(constant(uint256)) = 50000  # s

        @internal
        @view
        def _ema_tvl() -> DynArray[uint256, MAX_PAIRS]:
            tvls: DynArray[uint256, MAX_PAIRS] = []
            last_timestamp: uint256 = self.last_timestamp
            alpha: uint256 = 10**18
            if last_timestamp < block.timestamp:
                alpha = self.exp(- convert((block.timestamp - last_timestamp) * 10**18 / TVL_MA_TIME, int256))
            n_price_pairs: uint256 = self.n_price_pairs

            for i in range(MAX_PAIRS):
                if i == n_price_pairs:
                    break
                tvl: uint256 = self.last_tvl[i]
                if alpha != 10**18:
                    # alpha = 1.0 when dt = 0
                    # alpha = 0.0 when dt = inf
                    new_tvl: uint256 = self.price_pairs[i].pool.totalSupply()  # We don't do virtual price here to save on gas
                    tvl = (new_tvl * (10**18 - alpha) + tvl * alpha) / 10**18
                tvls.append(tvl)

            return tvls
        ```

## **Aggregated crvUSD Price Calculation**

The `_price` function then uses these EMA TVLs to calculate the aggregated price of `crvUSD` by considering the liquidity of each pool. The function adjusts the price from the pool's `price_oracle` based on the coin index of `crvUSD` in the liquidity pool.

???quote "Source code for `_price`"

    ```py
    @internal
    @view
    def _price(tvls: DynArray[uint256, MAX_PAIRS]) -> uint256:
        n: uint256 = self.n_price_pairs
        prices: uint256[MAX_PAIRS] = empty(uint256[MAX_PAIRS])
        D: uint256[MAX_PAIRS] = empty(uint256[MAX_PAIRS])
        Dsum: uint256 = 0
        DPsum: uint256 = 0
        for i in range(MAX_PAIRS):
            if i == n:
                break
            price_pair: PricePair = self.price_pairs[i]
            pool_supply: uint256 = tvls[i]
            if pool_supply >= MIN_LIQUIDITY:
                p: uint256 = price_pair.pool.price_oracle()
                if price_pair.is_inverse:
                    p = 10**36 / p
                prices[i] = p
                D[i] = pool_supply
                Dsum += pool_supply
                DPsum += pool_supply * p
        if Dsum == 0:
            return 10**18  # Placeholder for no active pools
        p_avg: uint256 = DPsum / Dsum
        e: uint256[MAX_PAIRS] = empty(uint256[MAX_PAIRS])
        e_min: uint256 = max_value(uint256)
        for i in range(MAX_PAIRS):
            if i == n:
                break
            p: uint256 = prices[i]
            e[i] = (max(p, p_avg) - min(p, p_avg))**2 / (SIGMA**2 / 10**18)
            e_min = min(e[i], e_min)
        wp_sum: uint256 = 0
        w_sum: uint256 = 0
        for i in range(MAX_PAIRS):
            if i == n:
                break
            w: uint256 = D[i] * self.exp(-convert(e[i] - e_min, int256)) / 10**18
            w_sum += w
            wp_sum += w * prices[i]
        return wp_sum / w_sum
    ```

*In the calculation process, the contract iterates over all price pairs to perform the following steps:*

- Storing the price of `crvUSD` in a `prices[i]` array for each pool with enough liquidity.
- Storing each pool's TVL in `D[i]`, adding this TVL to `Dsum`, and summing up the product of the `crvUSD` price and pool supply in `DPsum`.

*Finally, the contract calculates an average price:*

$$\text{average price} = \frac{\text{DPsum}}{\text{Dsum}}$$

*Next, a variance measure `e` is computed for each pool's price relative to the average, adjusting by `SIGMA` to normalize:*

$$\text{e}_i = \frac{(\max(p, p_{\text{avg}}) - \min(p, p_{\text{avg}}))^2}{\frac{\text{SIGMA}^2}{10^{18}}}$$

$$\text{e}_{min} = \min(\text{e}_i, \text{max_value(uint256)})$$

Applying an exponential decay based on these variance measures to weigh each pool's contribution to the final average price, reducing the influence of prices far from the minimum variance. 

$$w = \frac{\text{D}_i * e^\left({\text{e}_i - e_{min}}\right)}{10^{18}}$$

Next, sum up all `w` to store it in `w_sum` and calculate the product of `w * prices[i]`, which is stored in `wp_sum`.

*Finally, the weighted average price of `crvUSD` is calculated:*

$$\text{final price} = \frac{\text{wp_sum}}{\text{w_sum}}$$


---


# **Price and TVL Methods**

### `price`
!!! description "`PriceAggregator3.price() -> uint256`"

    Getter for the aggregated price of crvUSD based on the prices of crvUSD within different `price_pairs`.
    
    Returns: aggregated crvUSD price (`uint256`).

    ??? quote "Source code"

        The following source code includes all changes up to commit hash [86cae3a](https://github.com/curvefi/curve-stablecoin/tree/86cae3a89f2138122be428b3c060cc75fa1df1b0); any changes made after this commit are not included.

        === "PriceAggregator3.vy"

            ```python
            MAX_PAIRS: constant(uint256) = 20
            MIN_LIQUIDITY: constant(uint256) = 100_000 * 10**18  # Only take into account pools with enough liquidity

            STABLECOIN: immutable(address)
            SIGMA: immutable(uint256)
            price_pairs: public(PricePair[MAX_PAIRS])
            n_price_pairs: uint256
            
            last_timestamp: public(uint256)
            last_tvl: public(uint256[MAX_PAIRS])
            TVL_MA_TIME: public(constant(uint256)) = 50000  # s
            last_price: public(uint256)

            @external
            @view
            def price() -> uint256:
                return self._price(self._ema_tvl())

            @internal
            @view
            def _price(tvls: DynArray[uint256, MAX_PAIRS]) -> uint256:
                n: uint256 = self.n_price_pairs
                prices: uint256[MAX_PAIRS] = empty(uint256[MAX_PAIRS])
                D: uint256[MAX_PAIRS] = empty(uint256[MAX_PAIRS])
                Dsum: uint256 = 0
                DPsum: uint256 = 0
                for i in range(MAX_PAIRS):
                    if i == n:
                        break
                    price_pair: PricePair = self.price_pairs[i]
                    pool_supply: uint256 = tvls[i]
                    if pool_supply >= MIN_LIQUIDITY:
                        p: uint256 = 0
                        if price_pair.include_index:
                            p = price_pair.pool.price_oracle(0)
                        else:
                            p = price_pair.pool.price_oracle()
                        if price_pair.is_inverse:
                            p = 10**36 / p
                        prices[i] = p
                        D[i] = pool_supply
                        Dsum += pool_supply
                        DPsum += pool_supply * p
                if Dsum == 0:
                    return 10**18  # Placeholder for no active pools
                p_avg: uint256 = DPsum / Dsum
                e: uint256[MAX_PAIRS] = empty(uint256[MAX_PAIRS])
                e_min: uint256 = max_value(uint256)
                for i in range(MAX_PAIRS):
                    if i == n:
                        break
                    p: uint256 = prices[i]
                    e[i] = (max(p, p_avg) - min(p, p_avg))**2 / (SIGMA**2 / 10**18)
                    e_min = min(e[i], e_min)
                wp_sum: uint256 = 0
                w_sum: uint256 = 0
                for i in range(MAX_PAIRS):
                    if i == n:
                        break
                    w: uint256 = D[i] * self.exp(-convert(e[i] - e_min, int256)) / 10**18
                    w_sum += w
                    wp_sum += w * prices[i]
                return wp_sum / w_sum

            @internal
            @view
            def _ema_tvl() -> DynArray[uint256, MAX_PAIRS]:
                tvls: DynArray[uint256, MAX_PAIRS] = []
                last_timestamp: uint256 = self.last_timestamp
                alpha: uint256 = 10**18
                if last_timestamp < block.timestamp:
                    alpha = self.exp(- convert((block.timestamp - last_timestamp) * 10**18 / TVL_MA_TIME, int256))
                n_price_pairs: uint256 = self.n_price_pairs

                for i in range(MAX_PAIRS):
                    if i == n_price_pairs:
                        break
                    tvl: uint256 = self.last_tvl[i]
                    if alpha != 10**18:
                        # alpha = 1.0 when dt = 0
                        # alpha = 0.0 when dt = inf
                        new_tvl: uint256 = self.price_pairs[i].pool.totalSupply()  # We don't do virtual price here to save on gas
                        tvl = (new_tvl * (10**18 - alpha) + tvl * alpha) / 10**18
                    tvls.append(tvl)

                return tvls
            ```

    === "Example"

        ```shell
        >>> PriceAggregator3.price()
        '996396341581883374'
        ```


### `price_w`
!!! description "`PriceAggregator3.price_w() -> uint256`"

    Function to calculate the aggregated price of crvUSD based on the prices of crvUSD within different `price_pairs`. This function writes the price on the blockchain and additionally updates `last_timestamp`, `last_tvl` and `last_price`.
    
    Returns: aggregated crvUSD price (`uint256`).

    ??? quote "Source code"

        The following source code includes all changes up to commit hash [86cae3a](https://github.com/curvefi/curve-stablecoin/tree/86cae3a89f2138122be428b3c060cc75fa1df1b0); any changes made after this commit are not included.

        === "PriceAggregator3.vy"

            ```python
            MAX_PAIRS: constant(uint256) = 20
            MIN_LIQUIDITY: constant(uint256) = 100_000 * 10**18  # Only take into account pools with enough liquidity

            STABLECOIN: immutable(address)
            SIGMA: immutable(uint256)
            price_pairs: public(PricePair[MAX_PAIRS])
            n_price_pairs: uint256
            
            last_timestamp: public(uint256)
            last_tvl: public(uint256[MAX_PAIRS])
            TVL_MA_TIME: public(constant(uint256)) = 50000  # s
            last_price: public(uint256)

            @external
            def price_w() -> uint256:
                if self.last_timestamp == block.timestamp:
                    return self.last_price
                else:
                    ema_tvl: DynArray[uint256, MAX_PAIRS] = self._ema_tvl()
                    self.last_timestamp = block.timestamp
                    for i in range(MAX_PAIRS):
                        if i == len(ema_tvl):
                            break
                        self.last_tvl[i] = ema_tvl[i]
                    p: uint256 = self._price(ema_tvl)
                    self.last_price = p
                    return p

            @internal
            @view
            def _price(tvls: DynArray[uint256, MAX_PAIRS]) -> uint256:
                n: uint256 = self.n_price_pairs
                prices: uint256[MAX_PAIRS] = empty(uint256[MAX_PAIRS])
                D: uint256[MAX_PAIRS] = empty(uint256[MAX_PAIRS])
                Dsum: uint256 = 0
                DPsum: uint256 = 0
                for i in range(MAX_PAIRS):
                    if i == n:
                        break
                    price_pair: PricePair = self.price_pairs[i]
                    pool_supply: uint256 = tvls[i]
                    if pool_supply >= MIN_LIQUIDITY:
                        p: uint256 = 0
                        if price_pair.include_index:
                            p = price_pair.pool.price_oracle(0)
                        else:
                            p = price_pair.pool.price_oracle()
                        if price_pair.is_inverse:
                            p = 10**36 / p
                        prices[i] = p
                        D[i] = pool_supply
                        Dsum += pool_supply
                        DPsum += pool_supply * p
                if Dsum == 0:
                    return 10**18  # Placeholder for no active pools
                p_avg: uint256 = DPsum / Dsum
                e: uint256[MAX_PAIRS] = empty(uint256[MAX_PAIRS])
                e_min: uint256 = max_value(uint256)
                for i in range(MAX_PAIRS):
                    if i == n:
                        break
                    p: uint256 = prices[i]
                    e[i] = (max(p, p_avg) - min(p, p_avg))**2 / (SIGMA**2 / 10**18)
                    e_min = min(e[i], e_min)
                wp_sum: uint256 = 0
                w_sum: uint256 = 0
                for i in range(MAX_PAIRS):
                    if i == n:
                        break
                    w: uint256 = D[i] * self.exp(-convert(e[i] - e_min, int256)) / 10**18
                    w_sum += w
                    wp_sum += w * prices[i]
                return wp_sum / w_sum

            @internal
            @view
            def _ema_tvl() -> DynArray[uint256, MAX_PAIRS]:
                tvls: DynArray[uint256, MAX_PAIRS] = []
                last_timestamp: uint256 = self.last_timestamp
                alpha: uint256 = 10**18
                if last_timestamp < block.timestamp:
                    alpha = self.exp(- convert((block.timestamp - last_timestamp) * 10**18 / TVL_MA_TIME, int256))
                n_price_pairs: uint256 = self.n_price_pairs

                for i in range(MAX_PAIRS):
                    if i == n_price_pairs:
                        break
                    tvl: uint256 = self.last_tvl[i]
                    if alpha != 10**18:
                        # alpha = 1.0 when dt = 0
                        # alpha = 0.0 when dt = inf
                        new_tvl: uint256 = self.price_pairs[i].pool.totalSupply()  # We don't do virtual price here to save on gas
                        tvl = (new_tvl * (10**18 - alpha) + tvl * alpha) / 10**18
                    tvls.append(tvl)

                return tvls
            ```

    === "Example"

        ```shell
        >>> PriceAggregator3.price_w()
        996396341581883374
        ```


### `last_price`
!!! description "`PriceAggregator3.last_price() -> uint256: view`"

    Getter for the last aggregated price of crvUSD. This variable was set to $10^{18}$ (1.00) when initializing the contract and is updated to the current aggreagated crvUSD price every time [`price_w`](#price_w) is called.
    
    Returns: last aggregated price of crvUSD (`uint256`). 

    ??? quote "Source code"

        The following source code includes all changes up to commit hash [86cae3a](https://github.com/curvefi/curve-stablecoin/tree/86cae3a89f2138122be428b3c060cc75fa1df1b0); any changes made after this commit are not included.

        === "PriceAggregator3.vy"

            ```python
            last_price: public(uint256)

            @external
            def __init__(stablecoin: address, sigma: uint256, admin: address):
                STABLECOIN = stablecoin
                SIGMA = sigma  # The change is so rare that we can change the whole thing altogether
                self.admin = admin
                self.last_price = 10**18
                self.last_timestamp = block.timestamp
            ```

    === "Example"

        ```shell
        >>> PriceAggregator3.last_price()
        996507976702758416
        ```


### `ema_tvl`
!!! description "`PriceAggregator3.ema_tvl() -> DynArray[uint256, MAX_PAIRS]`"

    Getter for the exponential moving-average value of TVL across all `price_pairs`.
    
    Returns: array of ema tvls (`DynArray[uint256, MAX_PAIRS]`).

    ??? quote "Source code"

        The following source code includes all changes up to commit hash [86cae3a](https://github.com/curvefi/curve-stablecoin/tree/86cae3a89f2138122be428b3c060cc75fa1df1b0); any changes made after this commit are not included.

        === "PriceAggregator3.vy"

            ```python
            MAX_PAIRS: constant(uint256) = 20
            MIN_LIQUIDITY: constant(uint256) = 100_000 * 10**18  # Only take into account pools with enough liquidity

            price_pairs: public(PricePair[MAX_PAIRS])
            n_price_pairs: uint256
            
            last_timestamp: public(uint256)
            last_tvl: public(uint256[MAX_PAIRS])
            TVL_MA_TIME: public(constant(uint256)) = 50000  # s

            @external
            @view
            def ema_tvl() -> DynArray[uint256, MAX_PAIRS]:
                return self._ema_tvl()

            @internal
            @view
            def _ema_tvl() -> DynArray[uint256, MAX_PAIRS]:
                tvls: DynArray[uint256, MAX_PAIRS] = []
                last_timestamp: uint256 = self.last_timestamp
                alpha: uint256 = 10**18
                if last_timestamp < block.timestamp:
                    alpha = self.exp(- convert((block.timestamp - last_timestamp) * 10**18 / TVL_MA_TIME, int256))
                n_price_pairs: uint256 = self.n_price_pairs

                for i in range(MAX_PAIRS):
                    if i == n_price_pairs:
                        break
                    tvl: uint256 = self.last_tvl[i]
                    if alpha != 10**18:
                        # alpha = 1.0 when dt = 0
                        # alpha = 0.0 when dt = inf
                        new_tvl: uint256 = self.price_pairs[i].pool.totalSupply()  # We don't do virtual price here to save on gas
                        tvl = (new_tvl * (10**18 - alpha) + tvl * alpha) / 10**18
                    tvls.append(tvl)

                return tvls
            ```

    === "Example"

        ```shell
        >>> PriceAggregator3.ema_tvl()
        10085178042490008379928667, 11342234393448956020187903, 1388144609005835030282562, 784009711366175597305745
        ```


### `last_tvl`
!!! description "`PriceAggregator3.last_tvl(arg0: uint256) -> uint256: view`"

    Getter for the last ema tvl value of a `price_pair`. This variable is updated to the current ema tvl of the pool every time [`price_w`](#price_w) is called. When adding a new price pair, its value is set to the `totalSupply` of the pair.
    
    Returns: last ema tvl (`uint256`).

    | Input  | Type      | Description             |
    | ------ | --------- | ----------------------- |
    | `arg0` | `uint256` | Index of the price pair |

    ??? quote "Source code"

        The following source code includes all changes up to commit hash [86cae3a](https://github.com/curvefi/curve-stablecoin/tree/86cae3a89f2138122be428b3c060cc75fa1df1b0); any changes made after this commit are not included.

        === "PriceAggregator3.vy"

            ```python
            last_tvl: public(uint256[MAX_PAIRS])
            ```

    === "Example"

        in this example todo

        ```shell
        >>> PriceAggregator3.last_tvl(0)
        10085527382061879315424954

        >>> PriceAggregator3.last_tvl(1)
        11342418534974695610766448
        ```


---


# **Contract Info Methods**

### `last_timestamp`
!!! description "`PriceAggregator3.last_timestamp() -> uint256: view`"

    Getter for the last timestamp when the aggregated price of crvUSD was updated. This variable was populated with `block.timestamp` when initializing the contract and is updated to the current timestamp every time [`price_w`](#price_w) is called. When adding a new price pair, its value is set to the `totalSupply` of the pair.
    
    Returns: timestamp of the last price write (`uint256`).

    ??? quote "Source code"

        The following source code includes all changes up to commit hash [86cae3a](https://github.com/curvefi/curve-stablecoin/tree/86cae3a89f2138122be428b3c060cc75fa1df1b0); any changes made after this commit are not included.

        === "PriceAggregator3.vy"

            ```python
            last_timestamp: public(uint256)
            ```

    === "Example"

        ```shell
        >>> PriceAggregator3.last_timestamp()
        1721751359
        ```


### `TVL_MA_TIME`
!!! description "`PriceAggregator3.TVL_MA_TIME() -> uint256: view`"

    Getter for the time periodicity used to calculate the exponential moving-average of TVL.
    
    Returns: ema periodicity (`uint256`).

    ??? quote "Source code"

        The following source code includes all changes up to commit hash [86cae3a](https://github.com/curvefi/curve-stablecoin/tree/86cae3a89f2138122be428b3c060cc75fa1df1b0); any changes made after this commit are not included.

        === "PriceAggregator3.vy"

            ```python
            TVL_MA_TIME: public(constant(uint256)) = 50000  # s
            ```

    === "Example"

        ```shell
        >>> PriceAggregator3.TVL_MA_TIME()
        50000
        ```


### `sigma`
!!! description "`PriceAggregator3.SIGMA() -> uint256: view`"

    Getter for the sigma value. SIGMA is a predefined constant that influences the adjustment of price deviations, affecting how variations in individual stablecoin prices contribute to the overall average stablecoin price. The value of `sigma` was set to `1000000000000000` when initializing the contract and the variable is immutale, meaning it can not be adjusted.
    
    Returns: sigma value (`uint256`).

    ??? quote "Source code"

        The following source code includes all changes up to commit hash [86cae3a](https://github.com/curvefi/curve-stablecoin/tree/86cae3a89f2138122be428b3c060cc75fa1df1b0); any changes made after this commit are not included.

        === "PriceAggregator3.vy"

            ```python
            SIGMA: immutable(uint256)

            @external
            def __init__(stablecoin: address, sigma: uint256, admin: address):
                STABLECOIN = stablecoin
                SIGMA = sigma  # The change is so rare that we can change the whole thing altogether
                self.admin = admin
                self.last_price = 10**18
                self.last_timestamp = block.timestamp
            ```

    === "Example"

        ```shell
        >>> PriceAggregator3.sigma()
        1000000000000000
        ```


### `stablecoin`
!!! description "`PriceAggregator3.STABLECOIN() -> uint256: view`"

    Getter for the crvUSD contract address.
    
    Returns: crvUSD contract (`address`).

    ??? quote "Source code"

        The following source code includes all changes up to commit hash [86cae3a](https://github.com/curvefi/curve-stablecoin/tree/86cae3a89f2138122be428b3c060cc75fa1df1b0); any changes made after this commit are not included.

        === "PriceAggregator3.vy"

            ```python
            STABLECOIN: immutable(address)

            @external
            def __init__(stablecoin: address, sigma: uint256, admin: address):
                STABLECOIN = stablecoin
                SIGMA = sigma  # The change is so rare that we can change the whole thing altogether
                self.admin = admin
                self.last_price = 10**18
                self.last_timestamp = block.timestamp
            ```

    === "Example"

        ```shell
        >>> PriceAggregator3.STABLECOIN()
        '0xf939E0A03FB07F59A73314E73794Be0E57ac1b4E'
        ```


---


# **Price Pairs**



### `price_pairs`
!!! description "`PriceAggregator3.price_pairs(arg0: uint256) -> PricePair`"

    Getter for the price pairs added to the `PriceAggregator` contract. New pairs can be added using the [`add_price_pair`](#add_price_pair) function.
    
    Returns: `PricePair` struct consisting of todo.

    | Input  | Type      | Description             |
    | ------ | --------- | ----------------------- |
    | `arg0` | `uint256` | Index of the price pair |

    ??? quote "Source code"

        todo

        The following source code includes all changes up to commit hash [86cae3a](https://github.com/curvefi/curve-stablecoin/tree/86cae3a89f2138122be428b3c060cc75fa1df1b0); any changes made after this commit are not included.

        === "PriceAggregator2.vy"

            ```python
            struct PricePair:
                pool: Stableswap
                is_inverse: bool

            price_pairs: public(PricePair[MAX_PAIRS])
            ```

        === "PriceAggregator3.vy"

            ```python
            struct PricePair:
                pool: Stableswap
                is_inverse: bool
                include_index: bool

            price_pairs: public(PricePair[MAX_PAIRS])
            ```

    === "Example"

        ```shell
        >>> PriceAggregator2.price_pairs(0)     # PriceAggregator on Ethereum
        '0x4DEcE678ceceb27446b35C672dC7d61F30bAD69E, false'

        >>> PriceAggregator3.price_pairs(0)     # PriceAggregator on Arbitrum
        '0xec090cf6DD891D2d014beA6edAda6e05E025D93d, true, true'
        ```


### `add_price_pair`
!!! description "`PriceAggregator3.add_price_pair(_pool: Stableswap)`"

    !!!guard "Guarded Method"
        This function is only callable by the `admin` of the contract.

    Function to add a new price pair to the `PriceAggregator`.
    
    Emits: `AddPricePair`

    | Input   | Type      | Description               |
    | ------- | --------- | ------------------------- |
    | `_pool` | `address` | Pool to add as price pair |

    ??? quote "Source code"

        The following source code includes all changes up to commit hash [86cae3a](https://github.com/curvefi/curve-stablecoin/tree/86cae3a89f2138122be428b3c060cc75fa1df1b0); any changes made after this commit are not included.

        === "PriceAggregator3.vy"

            ```python
            event AddPricePair:
                n: uint256
                pool: Stableswap
                is_inverse: bool

            price_pairs: public(PricePair[MAX_PAIRS])
            n_price_pairs: uint256

            @external
            def add_price_pair(_pool: Stableswap):
                assert msg.sender == self.admin
                price_pair: PricePair = empty(PricePair)
                price_pair.pool = _pool
                coins: address[2] = [_pool.coins(0), _pool.coins(1)]
                if coins[0] == STABLECOIN:
                    price_pair.is_inverse = True
                else:
                    assert coins[1] == STABLECOIN
                n: uint256 = self.n_price_pairs
                self.price_pairs[n] = price_pair  # Should revert if too many pairs
                self.last_tvl[n] = _pool.totalSupply()
                self.n_price_pairs = n + 1
                log AddPricePair(n, _pool, price_pair.is_inverse)
            ```

    === "Example"

        ```shell
        >>> soon
        ```


### `remove_price_pair`
!!! description "`PriceAggregator3.remove_price_pair(n: uint256)`"

    !!!guard "Guarded Method"
        This function is only callable by the `admin` of the contract.

    Function to remove the price pair at index `n` from the `PriceAggregator`.
    
    Emits: `RemovePricePair` and conditionally `MovePricePair`[^1].

    [^1]: `MovePricePair` event is emitted when the removed price pair is not the last one which was added. In this case, price pairs need to be adjusted accordingly.

    | Input | Type      | Description                       |
    | ----- | --------- | --------------------------------- |
    | `n`   | `uint256` | Index of the price pair to remove |

    ??? quote "Source code"

        The following source code includes all changes up to commit hash [86cae3a](https://github.com/curvefi/curve-stablecoin/tree/86cae3a89f2138122be428b3c060cc75fa1df1b0); any changes made after this commit are not included.

        === "PriceAggregator3.vy"

            ```python
            event RemovePricePair:
                n: uint256

            event MovePricePair:
                n_from: uint256
                n_to: uint256

            price_pairs: public(PricePair[MAX_PAIRS])
            n_price_pairs: uint256

            @external
            def remove_price_pair(n: uint256):
                assert msg.sender == self.admin
                n_max: uint256 = self.n_price_pairs - 1
                assert n <= n_max

                if n < n_max:
                    self.price_pairs[n] = self.price_pairs[n_max]
                    log MovePricePair(n_max, n)
                self.n_price_pairs = n_max
                log RemovePricePair(n)
            ```

    === "Example"

        ```shell
        >>> soon
        ```


---


# **Contract Ownership**

todo: only changable by dao; etc...

### `admin`
!!! description "`PriceAggregator3.admin() -> address: view`"

    Getter for the current admin of the contract.
    
    Returns: current admin (`address`).

    ??? quote "Source code"

        The following source code includes all changes up to commit hash [86cae3a](https://github.com/curvefi/curve-stablecoin/tree/86cae3a89f2138122be428b3c060cc75fa1df1b0); any changes made after this commit are not included.

        === "PriceAggregator3.vy"

            ```python
            admin: public(address)

            @external
            def __init__(stablecoin: address, sigma: uint256, admin: address):
                STABLECOIN = stablecoin
                SIGMA = sigma  # The change is so rare that we can change the whole thing altogether
                self.admin = admin
                self.last_price = 10**18
                self.last_timestamp = block.timestamp
            ```

    === "Example"

        ```shell
        >>> soon
        ```


### `set_admin`
!!! description "`PriceAggregator3.set_admin(_admin: address)`"

    !!!guard "Guarded Method"
        This function is only callable by the `admin` of the contract.

    Function to set a new adderss as the `admin` of the contract.
    
    Emits: `SetAdmin`

    | Input    | Type      | Description                     |
    | -------- | --------- | ------------------------------- |
    | `_admin` | `uint256` | New address to set the admin to |

    ??? quote "Source code"

        The following source code includes all changes up to commit hash [86cae3a](https://github.com/curvefi/curve-stablecoin/tree/86cae3a89f2138122be428b3c060cc75fa1df1b0); any changes made after this commit are not included.

        === "PriceAggregator3.vy"

            ```python
            event SetAdmin:
                admin: address

            admin: public(address)

            @external
            def set_admin(_admin: address):
                # We are not doing commit / apply because the owner will be a voting DAO anyway
                # which has vote delays
                assert msg.sender == self.admin
                self.admin = _admin
                log SetAdmin(_admin)
            ```

    === "Example"

        ```shell
        >>> soon
        ```






