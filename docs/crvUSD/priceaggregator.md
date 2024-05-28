The AggregatorStablePrice contract is designed to **aggregate the prices of crvUSD based on multiple Curve Stableswap pools**. This price is primarily used as an oracle for calculating the interest rate, but also for [PegKeepers](../crvUSD/pegkeepers/overview.md) to determine whether to mint and deposit or withdraw and burn.


!!!deploy "Contract Source & Deployment"
    Source code is available on [Github](https://github.com/curvefi/curve-stablecoin/blob/master/contracts/price_oracles/AggregateStablePrice2.vy). 
    Relevant contract deployments can be found [here](../references/deployed-contracts.md#curve-stablecoin).


---

# **Calculations**

The `PriceAggregator` contract calculates the weighted average price of crvUSD across multiple liquidity pools, considering only those pools with sufficient liquidity (`MIN_LIQUIDITY` = 100,000 * 10**18). This calculation is based on the exponential moving-average (EMA) of the Total Value Locked (TVL) for each pool, determining the liquidity considered in the price aggregation.

## **EMA TVL Calculation**

The price calculation begins with determining the EMA of the TVL from different Curve Stableswap liquidity pools using the `_ema_tvl` function. This internal function computes the EMA TVLs based on the following formula, which adjusts for the time since the last update to smooth out short-term volatility in the TVL data, providing a more stable and representative average value over the specified time window (`TVL_MA_TIME` set to 50,000 seconds):

$$\alpha = 
    \begin{cases} 
    1 & \text{if last_timestamp} = \text{current_timestamp}, \\
    e^{-\frac{(\text{current_timestamp} - \text{last_timestamp}) * 10^{18}}{\text{TVL_MA_TIME}}} & \text{otherwise}.
    \end{cases}
$$

$$\text{ema_tvl}_{i} = \frac{\text{new_tvl}_i * (10^{18} - \alpha) + \text{tvl}_i * \alpha}{10^{18}}$$

*The code snippet provided illustrates the implementation of the above formula in the contract.*

???quote "**`_ema_tvl`**"

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



## **Aggregated Price Calculation**

The `_price` function then uses these EMA TVLs to calculate the aggregated prices by considering the liquidity of each pool. A pool's liquidity must meet or exceed `100,000 * 10**18` to be included in the calculation. The function adjusts the price from the pool's `price_oracle` based on the position of crvUSD in the liquidity pair, ensuring consistent price representation across pools.

???quote "**`_price`**"

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


*The process involves:*

- Storing the price of `crvUSD` in a `prices[i]` array for each qualifying pool.
- Recording each qualifying pool's supply (TVL) in `D[i]`, adding this supply to `Dsum`, and accumulating the product of the `crvUSD` price and pool supply in `DPsum`.
- Iterating over all price pairs to perform the above steps.

*Finally, the contract:*

- Calculates an average price:

    $$\text{average price} = \frac{\text{DPSum}}{\text{DSum}}$$

- Computes a variance measure `e` for each pool's price relative to the average, adjusting by `SIGMA` to normalize:

    $$\text{e}_i = \frac{(\max(p, p_{\text{avg}}) - \min(p, p_{\text{avg}}))^2}{\frac{\text{SIGMA}^2}{10^{18}}}$$

    $$\text{e}_{min} = \min(\text{e}_i, \text{max_value(uint256)})$$

- Applies an exponential decay based on these variance measures to weigh each pool's contribution to the final average price, reducing the influence of prices far from the minimum variance.
  
    $$w = \frac{\text{D}_i * e^\left({\text{e}_i - e_{min}}\right)}{10^{18}}$$

- Sums up all `w` to store it in `w_sum` and calculates the product of `w * prices[i]`, which is stored in `wp_sum`.
- Finally calculates the weighted average price as `wp_sum / w_sum`, with weights adjusted for both liquidity and price variance.

    $$\text{final price} = \frac{\text{wp_sum}}{\text{w_sum}}$$

---

# **Prices**

### `price`
!!! description "`PriceAggregator.price() -> uint256:`"

    Function to calculate the weighted price of crvUSD.
    
    Returns: price (`uint256`). 


    ??? quote "Source code"

        === "PriceAggregator.vy"

            ```vyper
            MAX_PAIRS: constant(uint256) = 20
            MIN_LIQUIDITY: constant(uint256) = 100_000 * 10**18  # Only take into account pools with enough liquidity

            STABLECOIN: immutable(address)
            SIGMA: immutable(uint256)
            price_pairs: public(PricePair[MAX_PAIRS])
            n_price_pairs: uint256

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

    === "Example"

        ```shell
        >>> PriceAggregator.price()
        999964013300395878
        ```


### `last_price`
!!! description "`PriceAggregator.last_price() -> uint256: view`"

    Getter for the last price. This variable was set to $10^{18}$ (1.00) when initializing the contract and is now updated every time [`price_w`](#price_w) is called.
    
    Returns: last price of crvUSD (`uint256`).

    ??? quote "Source code"

        === "PriceAggregator.vy"

            ```vyper
            last_price: public(uint256)

            @external
            def __init__(stablecoin: address, sigma: uint256, admin: address):
                STABLECOIN = stablecoin
                SIGMA = sigma  # The change is so rare that we can change the whole thing altogether
                self.admin = admin
                self.last_price = 10**18
                self.last_timestamp = block.timestamp

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
            ```

    === "Example"

        ```shell
        >>> PriceAggregator.last_price()
        999385898759491513
        ```


### `ema_tvl`
!!! description "`PriceAggregator.ema_tvl() -> DynArray[uint256, MAX_PAIRS]`"

    Getter for the exponential moving-average of the TVL in `price_pairs`.

    Returns: array of ema tvls (`DynArray[uint256, MAX_PAIRS]`).

    ??? quote "Source code"

        === "PriceAggregator.vy"

            ```vyper
            TVL_MA_TIME: public(constant(uint256)) = 50000  # s

            last_tvl: public(uint256[MAX_PAIRS])

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
        >>> PriceAggregator.ema_tvl()
        59321570154325618129121893, 42600769394518064802429328, 8535901977675585449164114, 4775645754381802242168047
        ```


### `last_tvl`
!!! description "`PriceAggregator.last_tvl(arg0: uint256) -> uint256:`"

    Getter for the total value locked of price pair (pool).
    
    Returns: total value locked (`uint256`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `arg0` |  `uint256` | Index of the price pair |

    ??? quote "Source code"

        === "PriceAggregator.vy"

            ```vyper
            last_tvl: public(uint256[MAX_PAIRS])
            ```

    === "Example"

        ```shell
        >>> PriceAggregator.last_tvl()
        1689448067
        ```


### `price_w`
!!! description "`PriceAggregator.price_w() -> uint256:`"

    Function to calculate and write the price. If called successfully, updates `last_tvl`, `last_price` and `last_timestamp`.
    
    Returns: price (`uint256`).

    ??? quote "Source code"

        === "PriceAggregator.vy"

            ```vyper
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

    === "Example"

        ```shell
        >>> PriceAggregator.price_w()
        999385898759491513
        ```



---


# **Adding and Removing Price Pairs**

All price pairs added to the contract are considered when calculating the `price` of crvUSD. Adding or removing price pairs can only be done by the `admin` of the contract, which is the Curve DAO.


### `price_pairs`
!!! description "`PriceAggregator.price_pairs(arg0: uint256) -> tuple: view`"

    Getter for the price pair at index `arg0` and whether the price pair is inverse.
    
    Returns: price pair (`address`) and true or false (`bool`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `arg0` |  `uint256` | Index of the price pair |

    ??? quote "Source code"

        === "PriceAggregator.vy"

            ```vyper
            price_pairs: public(PricePair[MAX_PAIRS])
            ```

    === "Example"

        ```shell
        >>> PriceAggregator.price_pairs(0)
        '0x4DEcE678ceceb27446b35C672dC7d61F30bAD69E, false'
        ```


### `add_price_pair`
!!! description "`PriceAggregator.add_price_pair(_pool: Stableswap):`"

    !!!guard "Guarded Method" 
        This function is only callable by the `admin` of the contract.

    Function to add a price pair to the PriceAggregator.

    Emits: `AddPricePair`

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_pool` |  `address` | Price pair to add |

    ??? quote "Source code"

        === "PriceAggregator.vy"

            ```vyper
            event AddPricePair:
                n: uint256
                pool: Stableswap
                is_inverse: bool

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
        >>> PriceAggregator.add_price_pair("0x0cd6f267b2086bea681e922e19d40512511be538")
        ```


### `remove_price_pair`
!!! description "`PriceAggregator.remove_price_pair(n: uint256):`"

    !!!guard "Guarded Method" 
        This function is only callable by the `admin` of the contract.

    Function to remove a price pair from the contract. If a prior pool than the latest added one gets removed, the function will move the latest added price pair to the removed pair pairs index to not mess up `price_pairs`.

    Emits: `RemovePricePair` and possibly `MovePricePair`

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `n` |  `uint256` | Index of the price pair to remove |

    ??? quote "Source code"

        === "PriceAggregator.vy"

            ```vyper
            event RemovePricePair:
                n: uint256

            event MovePricePair:
                n_from: uint256
                n_to: uint256

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
        >>> PriceAggregator.remove_price_pair("0x4DEcE678ceceb27446b35C672dC7d61F30bAD69E")
        ```


---


# **Admin Ownership**


### `admin`
!!! description "`PriceAggregator.admin() -> address: view`"

    Getter for the admin of the contract, which is the Curve DAO OwnershipAgent.
    
    Returns: admin (`address`).

    ??? quote "Source code"

        === "PriceAggregator.vy"

            ```vyper
            admin: public(address)

            @external
            def __init__(stablecoin: address, sigma: uint256, admin: address):
                STABLECOIN = stablecoin
                SIGMA = sigma  # The change is so rare that we can change the whole thing altogether
                self.admin = admin
            ```

    === "Example"

        ```shell
        >>> PriceAggregator.admin()
        '0x40907540d8a6C65c637785e8f8B742ae6b0b9968'
        ```


### `set_admin`
!!! description "`PriceAggregator.set_admin(_admin: address):`"

    !!!guard "Guarded Method" 
        This function is only callable by the `admin` of the contract.

    Function to set a new admin.

    Emits: `SetAdmin`

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_admin` |  `address` | new admin address |

    ??? quote "Source code"

        === "PriceAggregator.vy"

            ```vyper
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
        >>> PriceAggregator.set_admin("0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045")
        ```


---


# **Contract Info Methods**

### `SIGMA`
!!! description "`PriceAggregator.SIGMA() -> uint256: view`"

    Getter for the sigma value. SIGMA is a predefined constant that influences the adjustment of price deviations, affecting how variations in individual stablecoin prices contribute to the overall average stablecoin price.
    
    Returns: sigma (`uint256`).

    ??? quote "Source code"

        === "PriceAggregator.vy"

            ```vyper
            SIGMA: immutable(uint256)

            @external
            @view
            def sigma() -> uint256:
                return SIGMA
            ```

    === "Example"

        ```shell
        >>> PriceAggregator.SIGMA()
        1000000000000000
        ```


### `STABLECOIN`
!!! description "`PriceAggregator.STABLECOIN() -> address: view`"

    Getter for the stablecoin contract address.
    
    Returns: crvUSD contract (`address`).

    ??? quote "Source code"

        === "PriceAggregator.vy"

            ```vyper
            STABLECOIN: immutable(address)

            @external
            @view
            def stablecoin() -> address:
                return STABLECOIN
            ```

    === "Example"

        ```shell
        >>> PriceAggregator.STABLECOIN()
        '0xf939E0A03FB07F59A73314E73794Be0E57ac1b4E'
        ```


### `last_timestamp`
!!! description "`PriceAggregator.last_timestamp() -> uint256:`"

    Getter for the latest timestamp. Variable is updated when [`price_w`](#price_w) is called.
    
    Returns: timestamp (`uint256`).

    ??? quote "Source code"

        === "PriceAggregator.vy"

            ```vyper
            last_timestamp: public(uint256)
            ```

    === "Example"

        ```shell
        >>> PriceAggregator.last_timestamp()
        1689448067
        ```


### `TVL_MA_TIME`
!!! description "`PriceAggregator.TVL_MA_TIME() -> uint256: view`"

    Getter for the time period for the calculation of the EMA prices.
    
    Returns: timestamp (`uint256`).

    ??? quote "Source code"

        === "PriceAggregator.vy"

            ```vyper
            TVL_MA_TIME: public(constant(uint256)) = 50000  # s
            ```

    === "Example"

        ```shell
        >>> PriceAggregator.TVL_MA_TIME()
        50000
        ```