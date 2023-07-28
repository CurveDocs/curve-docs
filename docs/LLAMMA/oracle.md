price oracles for crvusd markets

https://etherscan.io/address/0x19F5B81e5325F882C9853B5585f74f751DE3896d#readContract



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