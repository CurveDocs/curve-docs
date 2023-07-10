AggregatorStablePrice - aggregator of stablecoin prices for crvUSD

https://etherscan.io/address/0xe5Afcf332a5457E8FafCD668BcE3dF953762Dfe7#code


### `sigma`
!!! description "`PriceAggregator.sigma() -> uint256:`"

    Getter for the sigma value of the contract. value was set when initializing the contract. immutable variable, cant be changed.
    
    Returns: sigma (`uint256`).

    ??? quote "Source code"

        ```python hl_lines="1 4 6 11"
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

        ```python hl_lines="1 4 5 11"
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



## **price stuff**
### `price` (more)
!!! description "`PriceAggregator.price() -> uint256:`"

    Getter for the current price of crvUSD aggregated from multiple oarcles.
    
    Returns: price (`uint256`).

    ??? quote "Source code"

        ```python hl_lines="1"
        interface Stableswap:
            def price_oracle() -> uint256: view
            def coins(i: uint256) -> address: view
            def get_virtual_price() -> uint256: view
            def totalSupply() -> uint256: view

        MIN_LIQUIDITY: constant(uint256) = 100_000 * 10**18  # Only take into account pools with enough liquidity

        price_pairs: public(PricePair[MAX_PAIRS])
        n_price_pairs: uint256

        @external
        @view
        def price() -> uint256:
            n: uint256 = self.n_price_pairs
            prices: uint256[MAX_PAIRS] = empty(uint256[MAX_PAIRS])
            D: uint256[MAX_PAIRS] = empty(uint256[MAX_PAIRS])
            Dsum: uint256 = 0
            DPsum: uint256 = 0
            for i in range(MAX_PAIRS):
                if i == n:
                    break
                price_pair: PricePair = self.price_pairs[i]
                pool_supply: uint256 = price_pair.pool.totalSupply()
                if pool_supply >= MIN_LIQUIDITY:
                    p: uint256 = price_pair.pool.price_oracle()
                    if price_pair.is_inverse:
                        p = 10**36 / p
                    prices[i] = p
                    _D: uint256 = price_pair.pool.get_virtual_price() * pool_supply / 10**18
                    D[i] = _D
                    Dsum += _D
                    DPsum += _D * p
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


### `price_pairs`
!!! description "`PriceAggregator.price_pairs(arg0: uint256) -> tuple: view`"

    Getter for the price pairs relevant for this contract. can be added and removed with functions
    
    Returns: address and bool (`address`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `arg0` |  `uint256` | Index |

    ??? quote "Source code"

        ```python hl_lines="1"
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

        ```python hl_lines="1 7"
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

    Function to remove price pairs from the contract. can only be called by the admin of the contract. checks if the pool is the last pool added, if yes and that one gets removed we can just remove it like that (no need to move other pricepairs up). if its not then the most recently added price pair (pricepair(n_max)) will get moved to the index of the price pair that has just been removed, this ensures that there are no empty indexes.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `n` |  `uint256` | Index of the pool to remove |

    ??? quote "Source code"

        ```python hl_lines="1 4 9 16 18"
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


## **Ownership**
### `admin`
!!! description "`PriceAggregator.admin() -> address:`"

    Getter for the admin of the contract. can be changed by calling `set_admin`. admin is the ownership agent (controlled by curvedao).
    
    Returns: admin (`tuple????`).

    ??? quote "Source code"

        ```python hl_lines="1 4 6"
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

        ```python hl_lines="1 4 7 12"
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