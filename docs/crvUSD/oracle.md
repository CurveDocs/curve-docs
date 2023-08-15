**More on oracles coming soon-ish!**

The price-oracle contract of the markets can be fetched by calling `price_oracle_contract` on the AMM contract.


The main function in terms of calculating the oracle price of the collateral is the internal function`_raw_price`.
The function computes the weighted average price of ETH from multiple liquidity pools and then adjusting it based on Chainlink oracle prices for both Ethereum (ETH) and stETH (a tokenized staked Ethereum).


stableswap pools are crvusd/usdc and crvusd/usdt
tricrypto pools are tricryptoUSDC and tricryptoUSDT

stableswap aggregator is the contract which aggregates the price of crvusd


## EMA of TVL 

`last_tvl` get updated whenever calling `price_w()` because this sets the variable to the value returned when calling `_ema_tvl()`.
only calculates ema tvl when $last_{timestamp} < block.timestamp$, otherwise it will just return `last_tvl` again as it is still the same block. 
13h exponential moving average of tvl

$$\alpha = \exp{(\frac{-(block.timestamp - last_{timestamp}) * 10^{18}}{\text{TVL_MA_TIME}})}$$

$\alpha = 1.0$ when $\delta t = 0$  
$\alpha = 0.0$ when $\delta t = \infty$

then calculates tvl of the tricrypto pools by iterating through the tricrypto pools (tricryptoUSDC and tricryptoUSDT): 


$$tvl = \frac{TS_i * VP_i}{10^{18}}$$

$$\text{last_tvl}_i = \frac{tvl * (10^{18} - \alpha) + \text{last_tvl}_i * \alpha}{10^{18}}$$

$TS_i = \text{total supply of i-th pool}$ in `TRICRYPTO[N_POOLS]`  
$VP_i = \text{virtual price of i-th pool}$ in `TRICRYPTO[N_POOLS]`  

function returns `last_tvl` for the tricrypto pools.


??? quote "`_ema_tvl`"

    ```python
    last_timestamp: public(uint256)
    last_tvl: public(uint256[N_POOLS])
    TVL_MA_TIME: public(constant(uint256)) = 50000  # s

    @internal
    @view
    def _ema_tvl() -> uint256[N_POOLS]:
        last_timestamp: uint256 = self.last_timestamp
        last_tvl: uint256[N_POOLS] = self.last_tvl

        if last_timestamp < block.timestamp:
            alpha: uint256 = self.exp(- convert((block.timestamp - last_timestamp) * 10**18 / TVL_MA_TIME, int256))
            # alpha = 1.0 when dt = 0
            # alpha = 0.0 when dt = inf
            for i in range(N_POOLS):
                tvl: uint256 = TRICRYPTO[i].totalSupply() * TRICRYPTO[i].virtual_price() / 10**18
                last_tvl[i] = (tvl * (10**18 - alpha) + last_tvl[i] * alpha) / 10**18

        return last_tvl
    ```


## RAW PRICE

input variables for this function: `tvls` which is calculated calling `_ema_tvl` and `agg_price` (which is STABLESWAP_AGGREGATOR.price()). this function iterates over `N_POOLS` again.
`price_oracle(k: uint256)` returns the oracle price of the coin at index `k` w.r.t the coin at index 0 (USDC / USDT).



$\text{p_crypto_r} = \text{price oracle of eth w.r.t usdc or usdt}$

$\text{p_stable_r} = \text{price oracle of stableswap pool}$, returns `_ma_price()` of the stableswap pool (price oracle of what coin??). if its inverse then do 10^36 / p_stable_r.

$\text{p_crypto_r} = \text{price oracle of crvusds}$

`weights` = sum of all ema_tvls of tricrypto pools

$$\text{weighted_price} = \text{weighted_price} + (\frac{\text{p_crypto_r} * \text{p_stable_agg}}{\text{p_stable_r}}) * weight$$

$\text{crv_p} = \frac{\text{weighted_price}}{\text{weights}}$


calculate stETH price:

$$\text{p_staked} = min(\text{p_staked}, 10^{18}) * WSTETH.stEthPerToken() / 10**18$$



??? quote "`_raw_price`"

    ```python
    @internal
    @view
    def _raw_price(tvls: uint256[N_POOLS], agg_price: uint256) -> uint256:
        weighted_price: uint256 = 0
        weights: uint256 = 0
        for i in range(N_POOLS):
            p_crypto_r: uint256 = TRICRYPTO[i].price_oracle(TRICRYPTO_IX[i])   # d_usdt/d_eth
            p_stable_r: uint256 = STABLESWAP[i].price_oracle()                 # d_usdt/d_st
            p_stable_agg: uint256 = agg_price                                  # d_usd/d_st
            if IS_INVERSE[i]:
                p_stable_r = 10**36 / p_stable_r
            weight: uint256 = tvls[i]
            # Prices are already EMA but weights - not so much
            weights += weight
            weighted_price += p_crypto_r * p_stable_agg / p_stable_r * weight     # d_usd/d_eth
        crv_p: uint256 = weighted_price / weights

        use_chainlink: bool = self.use_chainlink

        # Limit ETH price
        if use_chainlink:
            chainlink_lrd: ChainlinkAnswer = CHAINLINK_AGGREGATOR_ETH.latestRoundData()
            if block.timestamp - min(chainlink_lrd.updated_at, block.timestamp) <= CHAINLINK_STALE_THRESHOLD:
                chainlink_p: uint256 = convert(chainlink_lrd.answer, uint256) * 10**18 / CHAINLINK_PRICE_PRECISION_ETH
                lower: uint256 = chainlink_p * (10**18 - BOUND_SIZE) / 10**18
                upper: uint256 = chainlink_p * (10**18 + BOUND_SIZE) / 10**18
                crv_p = min(max(crv_p, lower), upper)

        p_staked: uint256 = STAKEDSWAP.price_oracle()  # d_eth / d_steth

        # Limit STETH price
        if use_chainlink:
            chainlink_lrd: ChainlinkAnswer = CHAINLINK_AGGREGATOR_STETH.latestRoundData()
            if block.timestamp - min(chainlink_lrd.updated_at, block.timestamp) <= CHAINLINK_STALE_THRESHOLD:
                chainlink_p: uint256 = convert(chainlink_lrd.answer, uint256) * 10**18 / CHAINLINK_PRICE_PRECISION_STETH
                lower: uint256 = chainlink_p * (10**18 - BOUND_SIZE) / 10**18
                upper: uint256 = chainlink_p * (10**18 + BOUND_SIZE) / 10**18
                p_staked = min(max(p_staked, lower), upper)

        p_staked = min(p_staked, 10**18) * WSTETH.stEthPerToken() / 10**18  # d_eth / d_wsteth

        return p_staked * crv_p / 10**18
    ```


### `tricrypto`
!!! description "`Oracle.tricrypto() -> address: view`"

    Getter for the tricrypto contract address.
    
    Returns: tricrypto contract (`address`).

    ??? quote "Source code"

        ```python hl_lines="1 11"
        TRICRYPTO: immutable(Tricrypto)
        TRICRYPTO_IX: immutable(uint256)

        @external
        def __init__(
                tricrypto: Tricrypto, ix: uint256, stableswap: Stableswap, staked_swap: Stableswap, stable_aggregator: StableAggregator,
                chainlink_aggregator: ChainlinkAggregator,
                sfrxeth: sfrxETH,
                ma_exp_time: uint256, bound_size: uint256
            ):
            TRICRYPTO = tricrypto
            TRICRYPTO_IX = ix
            STABLESWAP_AGGREGATOR = stable_aggregator
            STABLESWAP = stableswap
            STAKEDSWAP = staked_swap
            SFRXETH = sfrxeth
            _stablecoin: address = stable_aggregator.stablecoin()
            _redeemable: address = empty(address)
            STABLECOIN = _stablecoin
            coins: address[2] = [stableswap.coins(0), stableswap.coins(1)]
            is_inverse: bool = False
            if coins[0] == _stablecoin:
                _redeemable = coins[1]
                is_inverse = True
            else:
                _redeemable = coins[0]
                assert coins[1] == _stablecoin
            IS_INVERSE = is_inverse
            REDEEMABLE = _redeemable
            assert tricrypto.coins(0) == _redeemable

            assert ma_exp_time <= MAX_MA_EXP_TIME
            assert ma_exp_time >= MIN_MA_EXP_TIME
            MA_EXP_TIME = ma_exp_time

            CHAINLINK_AGGREGATOR = chainlink_aggregator
            CHAINLINK_PRICE_PRECISION = 10**convert(chainlink_aggregator.decimals(), uint256)

            BOUND_SIZE = bound_size
        ```

    === "Example"

        ```shell
        >>> Oracle.tricrypto()
        '0xD51a44d3FaE010294C616388b506AcdA1bfAAE46'
        ```


### `stableswap_aggregator`
!!! description "`Oracle.stableswap_aggregator() -> address: view`"

    Getter for the stableswap aggregator contract address.
    
    Returns: stableswap aggregator contract (`address`).

    ??? quote "Source code"

        ```python hl_lines="1 12"
        STABLESWAP_AGGREGATOR: immutable(StableAggregator)

        @external
        def __init__(
                tricrypto: Tricrypto, ix: uint256, stableswap: Stableswap, staked_swap: Stableswap, stable_aggregator: StableAggregator,
                chainlink_aggregator: ChainlinkAggregator,
                sfrxeth: sfrxETH,
                ma_exp_time: uint256, bound_size: uint256
            ):
            TRICRYPTO = tricrypto
            TRICRYPTO_IX = ix
            STABLESWAP_AGGREGATOR = stable_aggregator
            STABLESWAP = stableswap
            STAKEDSWAP = staked_swap
            SFRXETH = sfrxeth
            _stablecoin: address = stable_aggregator.stablecoin()
            _redeemable: address = empty(address)
            STABLECOIN = _stablecoin
            coins: address[2] = [stableswap.coins(0), stableswap.coins(1)]
            is_inverse: bool = False
            if coins[0] == _stablecoin:
                _redeemable = coins[1]
                is_inverse = True
            else:
                _redeemable = coins[0]
                assert coins[1] == _stablecoin
            IS_INVERSE = is_inverse
            REDEEMABLE = _redeemable
            assert tricrypto.coins(0) == _redeemable

            assert ma_exp_time <= MAX_MA_EXP_TIME
            assert ma_exp_time >= MIN_MA_EXP_TIME
            MA_EXP_TIME = ma_exp_time

            CHAINLINK_AGGREGATOR = chainlink_aggregator
            CHAINLINK_PRICE_PRECISION = 10**convert(chainlink_aggregator.decimals(), uint256)

            BOUND_SIZE = bound_size
        ```

    === "Example"

        ```shell
        >>> Oracle.stableswap_aggregator()
        '0xe5Afcf332a5457E8FafCD668BcE3dF953762Dfe7'
        ```

### `stableswap`
!!! description "`Oracle.stableswap() -> address: view`"

    Getter for the stableswap contract address.
    
    Returns: stableswap contract (`address`).

    ??? quote "Source code"

        ```python hl_lines="1 13"
        STABLESWAP: immutable(Stableswap)

        @external
        def __init__(
                tricrypto: Tricrypto, ix: uint256, stableswap: Stableswap, staked_swap: Stableswap, stable_aggregator: StableAggregator,
                chainlink_aggregator: ChainlinkAggregator,
                sfrxeth: sfrxETH,
                ma_exp_time: uint256, bound_size: uint256
            ):
            TRICRYPTO = tricrypto
            TRICRYPTO_IX = ix
            STABLESWAP_AGGREGATOR = stable_aggregator
            STABLESWAP = stableswap
            STAKEDSWAP = staked_swap
            SFRXETH = sfrxeth
            _stablecoin: address = stable_aggregator.stablecoin()
            _redeemable: address = empty(address)
            STABLECOIN = _stablecoin
            coins: address[2] = [stableswap.coins(0), stableswap.coins(1)]
            is_inverse: bool = False
            if coins[0] == _stablecoin:
                _redeemable = coins[1]
                is_inverse = True
            else:
                _redeemable = coins[0]
                assert coins[1] == _stablecoin
            IS_INVERSE = is_inverse
            REDEEMABLE = _redeemable
            assert tricrypto.coins(0) == _redeemable

            assert ma_exp_time <= MAX_MA_EXP_TIME
            assert ma_exp_time >= MIN_MA_EXP_TIME
            MA_EXP_TIME = ma_exp_time

            CHAINLINK_AGGREGATOR = chainlink_aggregator
            CHAINLINK_PRICE_PRECISION = 10**convert(chainlink_aggregator.decimals(), uint256)

            BOUND_SIZE = bound_size
        ```

    === "Example"

        ```shell
        >>> Oracle.stableswap()
        '0x390f3595bCa2Df7d23783dFd126427CCeb997BF4'
        ```

### `staked_sawp`
!!! description "`Oracle.staked_sawp() -> address: view`"

    Getter for the staked_swap (?) contract address.
    
    Returns: staked swap contract (`address`).

    ??? quote "Source code"

        ```python hl_lines="1 14"
        STAKEDSWAP: immutable(Stableswap)

        @external
        def __init__(
                tricrypto: Tricrypto, ix: uint256, stableswap: Stableswap, staked_swap: Stableswap, stable_aggregator: StableAggregator,
                chainlink_aggregator: ChainlinkAggregator,
                sfrxeth: sfrxETH,
                ma_exp_time: uint256, bound_size: uint256
            ):
            TRICRYPTO = tricrypto
            TRICRYPTO_IX = ix
            STABLESWAP_AGGREGATOR = stable_aggregator
            STABLESWAP = stableswap
            STAKEDSWAP = staked_swap
            SFRXETH = sfrxeth
            _stablecoin: address = stable_aggregator.stablecoin()
            _redeemable: address = empty(address)
            STABLECOIN = _stablecoin
            coins: address[2] = [stableswap.coins(0), stableswap.coins(1)]
            is_inverse: bool = False
            if coins[0] == _stablecoin:
                _redeemable = coins[1]
                is_inverse = True
            else:
                _redeemable = coins[0]
                assert coins[1] == _stablecoin
            IS_INVERSE = is_inverse
            REDEEMABLE = _redeemable
            assert tricrypto.coins(0) == _redeemable

            assert ma_exp_time <= MAX_MA_EXP_TIME
            assert ma_exp_time >= MIN_MA_EXP_TIME
            MA_EXP_TIME = ma_exp_time

            CHAINLINK_AGGREGATOR = chainlink_aggregator
            CHAINLINK_PRICE_PRECISION = 10**convert(chainlink_aggregator.decimals(), uint256)

            BOUND_SIZE = bound_size
        ```

    === "Example"

        ```shell
        >>> Oracle.staked_sawp()
        '0xa1F8A6807c402E4A15ef4EBa36528A3FED24E577'
        ```

### `stablecoin`
!!! description "`Oracle.stablecoin() -> address: view`"

    Getter for the stablecoin contract address.
    
    Returns: stablecoin contract (`address`).

    ??? quote "Source code"

        ```python hl_lines="1 16 18"
        STABLECOIN: immutable(address)

        @external
        def __init__(
                tricrypto: Tricrypto, ix: uint256, stableswap: Stableswap, staked_swap: Stableswap, stable_aggregator: StableAggregator,
                chainlink_aggregator: ChainlinkAggregator,
                sfrxeth: sfrxETH,
                ma_exp_time: uint256, bound_size: uint256
            ):
            TRICRYPTO = tricrypto
            TRICRYPTO_IX = ix
            STABLESWAP_AGGREGATOR = stable_aggregator
            STABLESWAP = stableswap
            STAKEDSWAP = staked_swap
            SFRXETH = sfrxeth
            _stablecoin: address = stable_aggregator.stablecoin()
            _redeemable: address = empty(address)
            STABLECOIN = _stablecoin
            coins: address[2] = [stableswap.coins(0), stableswap.coins(1)]
            is_inverse: bool = False
            if coins[0] == _stablecoin:
                _redeemable = coins[1]
                is_inverse = True
            else:
                _redeemable = coins[0]
                assert coins[1] == _stablecoin
            IS_INVERSE = is_inverse
            REDEEMABLE = _redeemable
            assert tricrypto.coins(0) == _redeemable

            assert ma_exp_time <= MAX_MA_EXP_TIME
            assert ma_exp_time >= MIN_MA_EXP_TIME
            MA_EXP_TIME = ma_exp_time

            CHAINLINK_AGGREGATOR = chainlink_aggregator
            CHAINLINK_PRICE_PRECISION = 10**convert(chainlink_aggregator.decimals(), uint256)

            BOUND_SIZE = bound_size
        ```

    === "Example"

        ```shell
        >>> Oracle.stablecoin()
        '0xf939E0A03FB07F59A73314E73794Be0E57ac1b4E'
        ```








### `redeemable`
!!! description "`Oracle.redeemable() -> address: view`"

    Getter for the contract address of the redeemable coin.

    Returns: contract (`address`).

    ??? quote "Source code"

        ```python hl_lines="1 17 21 22 23 24 25 26 28 29"
        REDEEMABLE: immutable(address)

        @external
        def __init__(
                tricrypto: Tricrypto, ix: uint256, stableswap: Stableswap, staked_swap: Stableswap, stable_aggregator: StableAggregator,
                chainlink_aggregator: ChainlinkAggregator,
                sfrxeth: sfrxETH,
                ma_exp_time: uint256, bound_size: uint256
            ):
            TRICRYPTO = tricrypto
            TRICRYPTO_IX = ix
            STABLESWAP_AGGREGATOR = stable_aggregator
            STABLESWAP = stableswap
            STAKEDSWAP = staked_swap
            SFRXETH = sfrxeth
            _stablecoin: address = stable_aggregator.stablecoin()
            _redeemable: address = empty(address)
            STABLECOIN = _stablecoin
            coins: address[2] = [stableswap.coins(0), stableswap.coins(1)]
            is_inverse: bool = False
            if coins[0] == _stablecoin:
                _redeemable = coins[1]
                is_inverse = True
            else:
                _redeemable = coins[0]
                assert coins[1] == _stablecoin
            IS_INVERSE = is_inverse
            REDEEMABLE = _redeemable
            assert tricrypto.coins(0) == _redeemable

            assert ma_exp_time <= MAX_MA_EXP_TIME
            assert ma_exp_time >= MIN_MA_EXP_TIME
            MA_EXP_TIME = ma_exp_time

            CHAINLINK_AGGREGATOR = chainlink_aggregator
            CHAINLINK_PRICE_PRECISION = 10**convert(chainlink_aggregator.decimals(), uint256)

            BOUND_SIZE = bound_size
        ```

    === "Example"

        ```shell
        >>> Oracle.redeemable()
        '0xdAC17F958D2ee523a2206206994597C13D831ec7'
        ```


### `ma_exp_time`
!!! description "`Oracle.ma_exp_time() -> uint256: view`"

    Getter for the exponential moving average (ema) time.
    
    Returns: time in seconds (`uint256`).

    ??? quote "Source code"

        ```python hl_lines="1 2 3 33 34 35"
        MA_EXP_TIME: immutable(uint256)
        MIN_MA_EXP_TIME: constant(uint256) = 30
        MAX_MA_EXP_TIME: constant(uint256) = 365 * 86400

        @external
        def __init__(
                tricrypto: Tricrypto, ix: uint256, stableswap: Stableswap, staked_swap: Stableswap, stable_aggregator: StableAggregator,
                chainlink_aggregator: ChainlinkAggregator,
                sfrxeth: sfrxETH,
                ma_exp_time: uint256, bound_size: uint256
            ):
            TRICRYPTO = tricrypto
            TRICRYPTO_IX = ix
            STABLESWAP_AGGREGATOR = stable_aggregator
            STABLESWAP = stableswap
            STAKEDSWAP = staked_swap
            SFRXETH = sfrxeth
            _stablecoin: address = stable_aggregator.stablecoin()
            _redeemable: address = empty(address)
            STABLECOIN = _stablecoin
            coins: address[2] = [stableswap.coins(0), stableswap.coins(1)]
            is_inverse: bool = False
            if coins[0] == _stablecoin:
                _redeemable = coins[1]
                is_inverse = True
            else:
                _redeemable = coins[0]
                assert coins[1] == _stablecoin
            IS_INVERSE = is_inverse
            REDEEMABLE = _redeemable
            assert tricrypto.coins(0) == _redeemable

            assert ma_exp_time <= MAX_MA_EXP_TIME
            assert ma_exp_time >= MIN_MA_EXP_TIME
            MA_EXP_TIME = ma_exp_time

            CHAINLINK_AGGREGATOR = chainlink_aggregator
            CHAINLINK_PRICE_PRECISION = 10**convert(chainlink_aggregator.decimals(), uint256)

            BOUND_SIZE = bound_size
        ```

    === "Example"

        ```shell
        >>> Oracle.ma_exp_time()
        600
        ```

### `raw_price` (x)
!!! description "`Oracle.raw_price() -> uint256: view`"

    Function to calculate the raw price. explain calculations here:!!
    
    Returns: raw price (`uint256`).

    ??? quote "Source code"

        ```python hl_lines="1 16 18"
        @internal
        @view
        def _raw_price() -> uint256:
            p_crypto_r: uint256 = TRICRYPTO.price_oracle(TRICRYPTO_IX)  # d_usdt/d_eth
            p_stable_r: uint256 = STABLESWAP.price_oracle()             # d_usdt/d_st
            p_stable_agg: uint256 = STABLESWAP_AGGREGATOR.price()       # d_usd/d_st
            if IS_INVERSE:
                p_stable_r = 10**36 / p_stable_r
            crv_p: uint256 = p_crypto_r * p_stable_agg / p_stable_r     # d_usd/d_eth
            price_per_share: uint256 = SFRXETH.pricePerShare()
            p_staked: uint256 = min(STAKEDSWAP.price_oracle(), 10**18) * price_per_share / 10**18  # d_eth / d_sfrxeth

            chainlink_lrd: (uint80, int256, uint256, uint256, uint80) = CHAINLINK_AGGREGATOR.latestRoundData()
            chainlink_p: uint256 = convert(chainlink_lrd[1], uint256) * 10**18 / CHAINLINK_PRICE_PRECISION

            lower: uint256 = chainlink_p * (100 - BOUND_SIZE) / 100
            upper: uint256 = chainlink_p * (100 + BOUND_SIZE) / 100
            crv_p = min(max(crv_p, lower), upper)

            crv_p = p_staked * crv_p / 10**18

            uni_price: uint256 = self._uni_price()
            uni_price = min(uni_price * (100 - UNI_DEVIATION) / 100, chainlink_p) * price_per_share / 10**18
            crv_p = max(crv_p, uni_price)

            return crv_p


        @external
        @view
        def raw_price() -> uint256:
            return self._raw_price()
        ```

    === "Example"

        ```shell
        >>> Oracle.raw_price()
        1970446024043370547236
        ```


### `price`
!!! description "`Oracle.price() -> uint256: view`"

    Function to calculate the price. explain calculations here:!!
    
    Returns: price (`uint256`).

    ??? quote "Source code"

        ```python hl_lines="3 20 21"
        @internal
        @view
        def ema_price() -> uint256:
            last_timestamp: uint256 = self.last_timestamp
            last_price: uint256 = self.last_price

            if last_timestamp == 0:
                return self._raw_price()

            if last_timestamp < block.timestamp:
                current_price: uint256 = self._raw_price()
                alpha: uint256 = self.exp(- convert((block.timestamp - last_timestamp) * 10**18 / MA_EXP_TIME, int256))
                return (current_price * (10**18 - alpha) + last_price * alpha) / 10**18

            else:
                return last_price

        @external
        @view
        def price() -> uint256:
            return self.ema_price()
        ```

    === "Example"

        ```shell
        >>> Oracle.price()
        1970446177124987128352
        ```



### `last_price` (x)
!!! description "`Oracle.last_price() -> uint256: view`"

    Getter for the last price. when does this update?
    
    Returns: last price (`uint256`).


    ??? quote "Source code"

        ```python hl_lines="1"
        last_price: public(uint256)
        ```

    === "Example"

        ```shell
        >>> Oracle.last_price()
        1973685659023186605028
        ```


### `last_timestamp`
!!! description "`Oracle.last_timestamp() -> uint256: view`"

    Getter for the last timestamp. when does this update?
    
    Returns: timestamp (`uint256`).

    ??? quote "Source code"

        ```python hl_lines="1"
        last_timestamp: public(uint256)
        ```

    === "Example"

        ```shell
        >>> Oracle.last_timestamp()
        1690558451
        ```



# what is this used for?
### `price_w`
!!! description "`Oracle.price_w() -> uint256: view`"

    todo
    
    Returns: price (`ema_price`) (`uint256`).

    ??? quote "Source code"

        ```python hl_lines="1"
        @external
        def price_w() -> uint256:
            p: uint256 = self.ema_price()
            if self.last_timestamp < block.timestamp:
                self.last_price = p
                self.last_timestamp = block.timestamp
            return p
        ```

    === "Example"

        ```shell
        >>> Oracle.price_w()
        'todo'
        ```
