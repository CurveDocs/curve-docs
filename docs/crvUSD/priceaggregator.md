The AggregatorStablePrice contract is designed to **aggregate the prices of crvUSD based on multiple Curve Stableswap pools**. This price is primarily used as an oracle for calculating the interest rate, but also for [PegKeepers](../crvUSD/pegkeeper.md) to determine whether to mint and deposit or withdraw and burn.


!!!deploy "Contract Source & Deployment"
    **AggregatorStablePrice** contract is deployed to the Ethereum mainnet at: [0x18672b1b0c623a30089A280Ed9256379fb0E4E62](https://etherscan.io/address/0x18672b1b0c623a30089A280Ed9256379fb0E4E62#code).
    Source code available on [Github](https://github.com/curvefi/curve-stablecoin/blob/master/contracts/price_oracles/AggregateStablePrice2.vy). 



## **Calculating Prices**

### **Exponential Moving Average of TVL**

**`_ema_tvl()`** calculates the Exponential Moving Average (EMA) of the Total Value Locked (TVL) for multiple Curve StableSwap pools. There is a maximum of 20 pairs to consider, and each price pair (pool) must have at least 100k TVL. 
New pairs can be added via [`add_price_pair`](#add_price_pair).

??? quote "Source code"

    ```python
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


#### `ema_tvl`
!!! description "`PriceAggregator.ema_tvl() -> DynArray[uint256, MAX_PAIRS]`"

    Getter for the exponential moving average (EMA) of the total value locked (TVL) in `price_pairs`.

    Returns: array of ema tvls (`DynArray[uint256, MAX_PAIRS]`).

    ??? quote "Source code"

        ```python
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


#### `price`
!!! description "`PriceAggregator.price() -> uint256:`"

    Function to calculate the weighted price of crvUSD.
    
    Returns: price (`uint256`). 

    ??? quote "Source code"

        ```python
        interface Stableswap:
            def price_oracle() -> uint256: view
            def coins(i: uint256) -> address: view
            def get_virtual_price() -> uint256: view
            def totalSupply() -> uint256: view

        MAX_PAIRS: constant(uint256) = 20
        MIN_LIQUIDITY: constant(uint256) = 100_000 * 10**18  # Only take into account pools with enough liquidity

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


## **Adding and Removing Price Pairs**
### `price_pairs`
!!! description "`PriceAggregator.price_pairs(arg0: uint256) -> tuple: view`"

    Getter for the price pair at index `arg0` and whether the price pair is inverse.
    
    Returns: price pair (`address`) and true or false (`bool`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `arg0` |  `uint256` | index |

    ??? quote "Source code"

        ```python
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

    Function to add a price pair to the contract.

    Emits: `AddPricePair`

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_pool` |  `address` | price pair to add |

    ??? quote "Source code"

        ```python
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
    | `n` |  `uint256` | index of the price pair to remove |

    ??? quote "Source code"

        ```python
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


## **Admin Ownership**
### `admin`
!!! description "`PriceAggregator.admin() -> address: view`"

    Getter for the admin of the contract.
    
    Returns: admin (`address`).

    ??? quote "Source code"

        ```python
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
        >>> PriceAggregator.set_admin("0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045")
        ```



## **Contract Info Methods**

### `SIGMA`
!!! description "`PriceAggregator.SIGMA() -> uint256: view`"

    Getter for the sigma value.
    
    Returns: sigma (`uint256`).

    ??? quote "Source code"

        ```python
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

    Getter for the stablecoin contract.
    
    Returns: crvUSD contract (`address`).

    ??? quote "Source code"

        ```python
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

        ```python
        last_timestamp: public(uint256)
        ```

    === "Example"

        ```shell
        >>> PriceAggregator.last_timestamp()
        1689448067
        ```


### `last_tvl`
!!! description "`PriceAggregator.last_tvl(arg0: uint256) -> uint256:`"

    Getter for the total value locked in a liquidity pool.
    
    Returns: total value locked (`uint256`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `arg0` |  `uint256` | index of the pool |

    ??? quote "Source code"

        ```python
        last_tvl: public(uint256[MAX_PAIRS])
        ```

    === "Example"

        ```shell
        >>> PriceAggregator.last_tvl()
        1689448067
        ```


### `TVL_MA_TIME`
!!! description "`PriceAggregator.TVL_MA_TIME() -> uint256: view`"

    Getter for the time period for the calculation of the EMA prices.
    
    Returns: timestamp (`uint256`).

    ??? quote "Source code"

        ```python
        TVL_MA_TIME: public(constant(uint256)) = 50000  # s
        ```

    === "Example"

        ```shell
        >>> PriceAggregator.TVL_MA_TIME()
        50000
        ```


### `last_price`
!!! description "`PriceAggregator.last_price() -> uint256: view`"

    Getter for the last price. This variable was set to $10^{18}$ (1.00) when initializing the contract and is now updated every time calling [`price_w`](#price_w).
    
    Returns: last price (`uint256`).

    ??? quote "Source code"

        ```python
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


### `price_w`
!!! description "`PriceAggregator.price_w() -> uint256:`"

    Function to calculate and write the price. If called successfully, updates `last_tvl`, `last_price` and `last_timestamp`.
    
    Returns: price (`uint256`).

    ??? quote "Source code"

        ```python
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
