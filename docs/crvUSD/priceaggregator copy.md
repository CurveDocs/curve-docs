The **AggregatorStablePrice** contract is designed to aggregate the prices of crvUSD based on multiple Curve Stableswap pools. This price is mainly used as an oracle for calculating the interest rate, providing an aggregated (`price`) and an exponential moving average (ema) price.

!!! info
    The AggregatorStablePrice contract is deployed to the Ethereum mainnet at: [0xe5Afcf332a5457E8FafCD668BcE3dF953762Dfe7](https://etherscan.io/address/0xe5Afcf332a5457E8FafCD668BcE3dF953762Dfe7).  
    Source code for this contract is available on [Github](https://github.com/curvefi/curve-stablecoin/blob/master/contracts/price_oracles/AggregateStablePrice2.vy). 



## **Calculating Prices**

### **Exponential Moving Average of TVL**

**`_ema_tvl()`**: This function is later on used to compute the aggregated price for crvUSD.  
This function calculates the Exponential Moving Average (EMA) of the Total Value Locked (TVL) for multiple Curve StableSwap pools. The function returns a dynamic array of the EMA of the TVL for each price pair. It iterates through all price pairs, which were added by calling `add_price_pair`. There is a maximum of 20 pairs to consider, and each price pair (pool) must have at least 100k TVL.

| Variables for calculations | Type | Description |
| ----------- | -------| ----|
| `tvls` |  `DynArray[uint256, MAX_PAIRS]` | dynamic array of ema of the tvl for each price pair |
| `last_timestamp` |  `uint256` | last timestamp |
| `block.timestamp`|  `uint256` | current timestamp |
| `TVL_MA_TIME` |  `uint256` | 50000 seconds |
| `new_tvl` |  `uint256` | totalSupply of the pool (we don't do virtual price here to save on gas) |
| `alpha` |  `uint256` | todo |

!!!tip
    If `last_timestamp` equals `block.timestamp`, the alpha value defaults to $10^{18}$. Otherwise, alpha is recalculated every time, as described below. alpha is 1 when dt equals 0 and alpha is 0.0 when dt approaches infinity.

??? quote "Source code"

    ```vyper hl_lines="5 10 16 21"
    last_tvl: public(uint256[MAX_PAIRS])

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

$$\text{alpha} = e^{ -\left(\frac{{(\text{block.timestamp} - \text{last_timestamp}) \cdot 10^{18}}}{{\text{TVL_MA_TIME}}}\right)}$$

$$\text{tvl} = \frac{(\text{new_tvl} * (10^{18} - \text{alpha}) + \text{tvl} * \text{alpha})}{10^{18}}$$





### **Price of crvUSD**

**`_price()`**
Calculates the weighted price, taking into account all price pairs.


| Variables for calculations | Type | Description |
| ----------- | -------| ----|
| `n` |  `uint256` | Number of price pairs |
| `prices` |  `uint256[MAX_PAIRS]` | Array with prices of the price_pairs |
| `D[i]` |  `uint256[MAX_PAIRS]` | Array with the pool tvls (these variables are added by calling `_ema_tvl()`)|


??? quote "Source code"

    ```vyper hl_lines="3"
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
            w: uint256 = D[i] * self.exp(- convert(e[i] - e_min, int256)) / 10**18
            w_sum += w
            wp_sum += w * prices[i]
        return wp_sum / w_sum
    ```

This function iterates through all the price pairs added to this contract.


1. The function iterates over all price pairs and stops when `n_price_pairs` is reached. It collects data such as **pool_supply** (the `_ema_tvl` for a price pair) and **p** (price from the price pair's oracle). It stores the pool_supply of the price pairs in **D** and also computes **Dsum** (the sum of D for all price pairs) and **DPsum** (the sum of **$\text{pool_supply * p}$** for all price pairs). If Dsum equals 0, then $10^{18}$ is used as a placeholder.

    | Variables | Type | Description |
    | ----------- | -------| ----|
    | `n` |  `uint256` | number of price pairs |
    | `prices` |  `uint256` | array which contains all the prices for the price pairs (= price_oracle from the pool)|
    | `D` |  `uint256[MAX_PAIRS]` | array which contains the tvl's of the price pairs (is calculated via `_ema_tvl()`) |
    | `Dsum` |  `uint256` | Sum of tvls (D[i]) for all price pairs |
    | `DPsum` |  `uint256` | Sum of all tvl's multiplied by its corresponding pool price oracle |


    ??? quote "Source code"

        ```vyper
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
        ```


2. This piece of code calculates an error metric **e** for each price pair, which represents the squared difference between its **price p** and the **average price p_avg**, normalized by a constant `SIGMA`. The minimum error **e_min** across all price pairs is also tracked.

    | Variables | Type | Description |
    | ----------- | -------| ----|
    | `p_avg` | `uint256` | average price: $\frac{DPsum}{Dsum}$  |
    | `e` | `uint256[MAX_PAIRS]` | TODO |
    | `e_min` | `uint256` | max value of uint256 |

    ??? quote "Source code"

        ```vyper 
        p_avg: uint256 = DPsum / Dsum
        e: uint256[MAX_PAIRS] = empty(uint256[MAX_PAIRS])
        e_min: uint256 = max_value(uint256)
        for i in range(MAX_PAIRS):
            if i == n:
                break
            p: uint256 = prices[i]
            e[i] = (max(p, p_avg) - min(p, p_avg))**2 / (SIGMA**2 / 10**18)
            e_min = min(e[i], e_min)
        ```

    $$\text{p_avg} = \frac{\text{DPsum}}{\text{Dsum}}$$

    $$\text{e[i]} = \frac{max(\text{p, p_{avg}}) - min(\text{p, p_{avg}})}{\frac{sigma^2}{10^{18}}}$$

    $$\text{e_min} = min(\text{e[i], e_min})$$


3. In the last step, **w**, **w_sum**, and **wp_sum** are calculated, from which the final price can be derived.

    | Variables | Type | Description |
    | ----------- | -------| ----|
    | `w_sum` |  `uint256` | sum of w for all price pairs |
    | `wp_sum` |  `uint256` | sum of w*p for all price pairs |
    | `price` |  `uint256` | aggregated final price |

    ??? quote "Source code"

        ```vyper 
        wp_sum: uint256 = 0
        w_sum: uint256 = 0
        for i in range(MAX_PAIRS):
            if i == n:
                break
            w: uint256 = D[i] * self.exp(- convert(e[i] - e_min, int256)) / 10**18
            w_sum += w
            wp_sum += w * prices[i]
        return wp_sum / w_sum
        ```

    $$\text{w} = \frac{{\text{D[i]} \cdot e^{-1 \cdot (e_i - e_{\text{{min}}})}}}{10^{18}}$$

    $$\text{price} = \frac{wp_{sum}}{w_{sum}}$$



### **Price Contract Methods**

#### `price`
!!! description "`PriceAggregator.price() -> uint256:`"

    Getter for the price of crvUSD. For calculations see above.
    
    Returns: price (`uint256`). 

    ??? quote "Source code"

        ```vyper hl_lines="1"
        interface Stableswap:
            def price_oracle() -> uint256: view
            def coins(i: uint256) -> address: view
            def get_virtual_price() -> uint256: view
            def totalSupply() -> uint256: view

        MAX_PAIRS: constant(uint256) = 20
        MIN_LIQUIDITY: constant(uint256) = 100_000 * 10**18  # Only take into account pools with enough liquidity

        price_pairs: public(PricePair[MAX_PAIRS])
        n_price_pairs: uint256

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

        @external
        @view
        def price() -> uint256:
            return self._price(self._ema_tvl())
        ```

    === "Example"

        ```shell
        >>> PriceAggregator.price()
        999964013300395878
        ```

#### `ema_tvl`
!!! description "`PriceAggregator.ema_tvl() -> uint256:`"

    Getter for the exponential moving average (EMA) of the total value locked in each pool which was added with `add_price_pair`. Time for the moving average is 50000 seconds.

    Returns: exponential moving average of the total value locked (`uint256`).

    ??? quote "Source code"

        ```vyper hl_lines="1"
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


        @external
        @view
        def ema_tvl() -> DynArray[uint256, MAX_PAIRS]:
            return self._ema_tvl()
        ```

    === "Example"

        ```shell
        >>> PriceAggregator.ema_tvl()
        59321570154325618129121893, 42600769394518064802429328, 8535901977675585449164114, 4775645754381802242168047
        ```


#### `last_timestamp` (x)
!!! description "`PriceAggregator.last_timestamp() -> uint256:`"

    Getter for the latest timestamp when `price_w` was called.
    
    Returns: timestamp (`uint256`).

    ??? quote "Source code"

        ```vyper hl_lines="1"
        last_timestamp: public(uint256)
        ```

    === "Example"

        ```shell
        >>> PriceAggregator.last_timestamp()
        1689448067
        ```


#### `last_tvl` (fix)
!!! description "`PriceAggregator.last_tvl(arg0: uint256) -> uint256:`"

    Getter for the total value locked in a liquidity pool. why is this not the same as calling totalSupply on the pool conraxct?
    
    Returns: total value locked (`uint256`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `arg0` |  `uint256` | Index of the pool |

    ??? quote "Source code"

        ```vyper hl_lines="1"
        last_tvl: public(uint256[MAX_PAIRS])
        ```

    === "Example"

        ```shell
        >>> PriceAggregator.last_tvl()
        1689448067
        ```


#### `TVL_MA_TIME`
!!! description "`PriceAggregator.TVL_MA_TIME() -> uint256:`"

    Getter for the time period for the calculation of the EMA prices.
    
    Returns: timestamp (`uint256`).

    ??? quote "Source code"

        ```vyper hl_lines="1"
        TVL_MA_TIME: public(constant(uint256)) = 50000  # s
        ```

    === "Example"

        ```shell
        >>> PriceAggregator.TVL_MA_TIME()
        50000
        ```

    !!!tip
        50000 seconds is equal to roughly 13.9 hours.


#### `last_price`
!!! description "`PriceAggregator.last_price() -> uint256:`"

    Getter for the last price. This variable was set to $10^18$ (1.00) when initializing the contract and is now updated every time calling `[price_w](#price_w)`.
    
    Returns: last price (`uint256`).

    ??? quote "Source code"

        ```vyper hl_lines="1 8 23"
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


#### `price_w` (todo)
!!! description "`PriceAggregator.price_w() -> uint256:`"

    Function to calculate the price.
    
    Returns: timestamp (`uint256`).

    ??? quote "Source code"

        ```vyper hl_lines="2 13 14"
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
        >>> PriceAggregator.price_w()
        todo        
        ```


## **Adding and Removing Price Pairs**
### `price_pairs`
!!! description "`PriceAggregator.price_pairs(arg0: uint256) -> tuple: view`"

    Getter for the price pairs relevant for this contract. can be added and removed with functions
    
    Returns: address and bool (`address`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `arg0` |  `uint256` | Index |

    ??? quote "Source code"

        ```vyper hl_lines="1"
        price_pairs: public(PricePair[MAX_PAIRS])
        ```

    === "Example"

        ```shell
        >>> PriceAggregator.price_pairs(0)
        '0x4DEcE678ceceb27446b35C672dC7d61F30bAD69E, false'
        ```


### `add_price_pair`
!!! description "`PriceAggregator.add_price_pair(_pool: Stableswap):`"

    Function to add price pairs to the contract. can only be called by the admin of the contract.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_pool` |  `address` | Stableswap pool to add |

    ??? quote "Source code"

        ```vyper hl_lines="1 7 20"
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
        >>> PriceAggregator.add_price_pair("todo")
        'todo'
        ```


### `remove_price_pair`
!!! description "`PriceAggregator.remove_price_pair(n: uint256):`"

    Function to remove price pairs from the contract. can only be called by the admin of the contract. checks if the pool is the last pool added, if yes and that one gets removed we can just remove it like that (no need to move other pricepairs up). if it's not then the most recently added price pair (pricepair(n_max)) will get moved to the index of the price pair that has just been removed, this ensures that there are no empty indexes.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `n` |  `uint256` | Index of the pool to remove |

    ??? quote "Source code"

        ```vyper hl_lines="1 4 9 16 18"
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
        >>> PriceAggregator.remove_price_pair("todo")
        'todo'
        ```


## **Admin Ownership**
### `admin`
!!! description "`PriceAggregator.admin() -> address:`"

    Getter for the admin of the contract. can be changed by calling `set_admin`. admin is the ownership agent (controlled by curvedao).
    
    Returns: admin (`tuple????`).

    ??? quote "Source code"

        ```vyper hl_lines="1 4 6"
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

    Function to set a new admin.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_admin` |  `address` | New Admin |

    ??? quote "Source code"

        ```vyper hl_lines="1 4 7 12"
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
        >>> PriceAggregator.set_admin("todo")
        'todo'
        ```



## **Contract Info Methods**
### `sigma`
!!! description "`PriceAggregator.sigma() -> uint256:`"

    Getter for the sigma value of the contract. value was set when initializing the contract. immutable variable, cant be changed.
    
    Returns: sigma (`uint256`).

    ??? quote "Source code"

        ```vyper hl_lines="1 4 6 11"
        SIGMA: immutable(uint256)

        @external
        def __init__(stablecoin: address, sigma: uint256, admin: address):
            STABLECOIN = stablecoin
            SIGMA = sigma  # The change is so rare that we can change the whole thing altogether
            self.admin = admin

        @external
        @view
        def sigma() -> uint256:
            return SIGMA
        ```

    === "Example"

        ```shell
        >>> PriceAggregator.sigma()
        1000000000000000
        ```


### `stablecoin`
!!! description "`PriceAggregator.stablecoin() -> address:`"

    Getter for the stablecoin contract. value was set when initializing the contract. immutable variable, cant be changed.
    
    Returns: crvUSD contract (`address`).

    ??? quote "Source code"

        ```vyper hl_lines="1 4 5 11"
        STABLECOIN: immutable(address)

        @external
        def __init__(stablecoin: address, sigma: uint256, admin: address):
            STABLECOIN = stablecoin
            SIGMA = sigma  # The change is so rare that we can change the whole thing altogether
            self.admin = admin

        @external
        @view
        def stablecoin() -> address:
            return STABLECOIN
        ```

    === "Example"

        ```shell
        >>> PriceAggregator.stablecoin()
        '0xf939E0A03FB07F59A73314E73794Be0E57ac1b4E'
        ```    