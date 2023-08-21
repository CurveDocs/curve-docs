The price oracle contract of the markets can be fetched by calling `price_oracle_contract` on the AMM contract.

The main function in terms of calculating the oracle price of the collateral is the internal function`_raw_price()` and `_ema_tvl()`.

not much functions to call. what can be changed? lots of immutable variables



- Stableswap pools: crvUSD/USDC and crvUSD/USDT
- Tricrypto pools: tricryptoUSDC and tricryptoUSDT
- Stableswap aggregator is the contract that aggregates the price of crvUSD

when is price oracle updated? every exchange in AMM which is when internal function `_price_oracle_w()` is called.

!!!note
    The formulas above use slightly different terminologies than in the code itself to make it easier to read.  
    For abreviations see [here](#terminology-used-in-code).

## **EMA of TVL**
`_ema_tvl()` calculates the exponential moving average of the total value locked of `TRICRYPTO[i]`. 
This value is later on used in the internal function `_raw_price()` to further compute the weighted price of the collateral.

This function returns `last_tvl[i]`, which represents the ema tvl of the pool. This variable is updated everytime when calling `price_w()` and $last_{timestamp} < block.timestamp$.

The function only re-calculates the ema tvl when $last_{timestamp} < block.timestamp$, otherwise it will just return `last_tvl` again as it is still the same timestamp. 

??? quote "`_ema_tvl() -> uint256[N_POOLS]:`"

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


### *Calculate Smoothing Factor (α)*
When calculating the smoothing factor $\alpha$, the formula is converted to an int256 because `exp()` requires an int256 as input.


$$\alpha = \exp{-\frac{(block.timestamp - \text{last_timestamp}) * 10^{18}}{\text{TVL_MA_TIME}}}$$

*with:*

$\alpha = \text{smoothing factor}$  
$\text{block.timestamp} = \text{current timestamp}$  
$\text{last_timestamp} = \text{last timestamp when}$ `price_w()` $\text{was called}$  
$\text{TVL_MA_TIME} =$ `TVL_MA_TIME`  

!!!info
    alpha values can range between 1 and 0:     
    $\alpha = 1.0$ when $\delta t = 0$    
    $\alpha = 0.0$ when $\delta t = \infty$

-----------------------------

### *Calculate TVLs*

After computing $\alpha$, the function calculates the `tvl` of the Tricrypto pools. It does this by iterating through all the pools stored in `TRICRYPTO` (currently tricryptoUSDC and tricryptoUSDT), fetching the `totalSupply`, and multiplying it by the `virtual_price`.
It essentially computes the `weight`, which is later on user in `_raw_prices()` to obtain the final price.

$$tvl_{i} = \frac{TS_i * VP_i}{10^{18}}$$

*with:*

$tvl_i = \text{total value locked of i-th pool}$ in `TRICRYPTO[N_POOLS]`  
$TS_i = \text{total supply of i-th pool}$ in `TRICRYPTO[N_POOLS]`  
$VP_i = \text{virtual price of i-th pool}$ in `TRICRYPTO[N_POOLS]` 

-----------------------------


In the last step `tvl` get smoothend out with $\alpha$ and `last_tvl` is obtained.

$$\text{last_tvl}_i = \frac{tvl_i * (10^{18} - \alpha) + \text{last_tvl}_i * \alpha}{10^{18}}$$

*with:*

$\text{last_tvl}_i = \text{total value locked of i-th pool}$ in `TRICRYPTO[N_POOLS]` 


### `ema_tvl`
!!! description "`Oracle.ema_tvl() -> uint256[N_POOLS]:`"

    Function to calculate the Total-Value-Locked (TVL) Exponential-Moving-Average (EMA) of the `TRICRYPTO` pools. 

    Returns: `last_tvl` (`uint256[N_POOLS]`).

    ??? quote "Source code"

        ```python hl_lines="3"
        @external
        @view
        def ema_tvl() -> uint256[N_POOLS]:
            return self._ema_tvl()
        ```

    === "Example"

        ```shell
        >>> Oracle.ema_tvl()
        38652775551183170655949, 40849321168337010409906
        ```


### `last_tvl`
!!! description "`Oracle.last_tvl(arg0: uint256) -> uint256:`"

    Getter for the `last_tvl` of the tricrypto pool at index `arg0`.

    Returns: `last_tvl` (`uint256[N_POOLS]`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `arg0` |  `uint256` | Index |

    ??? quote "Source code"

        ```python hl_lines="3"
        last_tvl: public(uint256[N_POOLS])
        ```

    === "Example"

        ```shell
        >>> Oracle.last_tvl(0)
        38650114241563018578505
        ```


## **Calculate Raw Price**

This function requires `tvl´ (which was calculated in the step above) and `agg_price` ((which essential is `STABLESWAP_AGGREGATOR.price()`) as input to calculate the raw price of the collateral.

??? quote "`_raw_price(tvls: uint256[N_POOLS], agg_price: uint256) -> uint256:`"

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

-----------------------------

The function iterates over `N_POOLS` and obtains the following values:

- $\text{p_crypto_r} =$ price oracle of eth in the tricrypto pools w.r.t usdc/usdt  
- $\text{p_stable_r} =$ price oracle of stableswap pool  
- $\text{p_crypto_r} =$ price oracle of crvusd   

$$\text{eth_weighted_price} = \text{eth_weighted_price} + (\frac{\text{p_crypto_r} * \text{p_stable_agg}}{\text{p_stable_r}}) * weight$$

While looping through the pools, the variables `weighted_price` and `weights` are summed up of the individual pool's values, which means they represent the sum across all `N_POOLS`.

The **total weighted price of ETH** is then obtained by dividing `weighted_price` by `weights`.

$$\text{total_ETH_weighted_price} = \frac{\text{weighted_price}}{\text{weights}}$$

*with:*

$\text{weighted_price} =$ sum of the weighted prices  
$\text{weights} =$ sum of all _ema_tvl's of tricrypto pools  

------------------------

Now, the **price of stETH w.r.t ETH** is obtained by calling the `price_oracle()` function on the stETH/ETH pool:

$\text{p_staked} =$ `STAKEDSWAP.price_oracle()`

limit the stETH price: minimum of steth price and 1 eth, because 1 steth can always be redeemed for 1 eth, so we assume 10^18 is the minimum price. then we multiply whatever value is smaller by WSTETH.stEthPerToken() to calculate how much steth it really is, as we provide wsteth (is worth more than steth because its rebasing).

Next, the price of stETH is limited. It takes the minimum value of either the price of steth in the curve pool or 1. This is done because if stETH price in the pool is > 1, there is an arb opportunity to exchange eth for steth 1:1 and then sell it in the pool, which should drive exchange rate back down to 1.

------------------------

This limited value is then multiplied by `WSTETH.stEthPerToken()` which is the ratio of wsteth and steth.

$$\text{p_staked} = min(\text{p_staked}, 10^{18}) * \frac{WSTETH.stEthPerToken()}{10**{18}}$$

Final step: the limited value of p_staked is then multiplied by the price of eth calculated above and then divided by the number of decimals ($10^{18}$).


### `raw_price`
!!! description "`Oracle.raw_price() -> uint256: view`"

    Function to calculate the raw price.
    
    Returns: raw price (`uint256`).

    ??? quote "Source code"

        ```python hl_lines="1 16 18"
        @external
        @view
        def raw_price() -> uint256:
            return self._raw_price()

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

    === "Example"

        ```shell
        >>> Oracle.raw_price()
        1970446024043370547236
        ```

## **Chainlink Limits**
The oracle contracts have the possibility to make use of chainlink prices which act as saftey limits. When toggled on, these limitations essentially hit when the chainlink price deviates more than 1.5% (`BOUND_SIZE`) from the internal price oracles.

Chainlink limits can be turned on and off by calling `set_use_chainlink(do_it: bool)`, which can only be done by the admin of the factory contract.

<figure markdown>
  ![](../images/chainlink_oracle.png){ width="400" }
  <figcaption>Chainlink vs Internal Orcale</figcaption>
</figure>



### **ETH Limit**

??? quote "ETH Price Limit"

    ```python
    # Limit ETH price
    if use_chainlink:
        chainlink_lrd: ChainlinkAnswer = CHAINLINK_AGGREGATOR_ETH.latestRoundData()
        if block.timestamp - min(chainlink_lrd.updated_at, block.timestamp) <= CHAINLINK_STALE_THRESHOLD:
            chainlink_p: uint256 = convert(chainlink_lrd.answer, uint256) * 10**18 / CHAINLINK_PRICE_PRECISION_ETH
            lower: uint256 = chainlink_p * (10**18 - BOUND_SIZE) / 10**18
            upper: uint256 = chainlink_p * (10**18 + BOUND_SIZE) / 10**18
            crv_p = min(max(crv_p, lower), upper)
    ```



### **stETH Limit**

??? quote "stETH Price Limit"

    ```python
    # Limit STETH price
    if use_chainlink:
        chainlink_lrd: ChainlinkAnswer = CHAINLINK_AGGREGATOR_STETH.latestRoundData()
        if block.timestamp - min(chainlink_lrd.updated_at, block.timestamp) <= CHAINLINK_STALE_THRESHOLD:
            chainlink_p: uint256 = convert(chainlink_lrd.answer, uint256) * 10**18 / CHAINLINK_PRICE_PRECISION_STETH
            lower: uint256 = chainlink_p * (10**18 - BOUND_SIZE) / 10**18
            upper: uint256 = chainlink_p * (10**18 + BOUND_SIZE) / 10**18
            p_staked = min(max(p_staked, lower), upper)
    ```


### `use_chainlink`
!!! description "`Oracle.use_chainlink() -> bool:`"

    Getter method to check if chainlink oracles are turned on or off.

    Returns: True or False (`bool`).

    ??? quote "Source code"

        ```python hl_lines="1"
        use_chainlink: public(bool)
        ```

    === "Example"

        ```shell
        >>> Oracle.use_chainlink()
        'True'
        ```


### `set_use_chainlink`
!!! description "`Oracle.set_use_chainlink(do_it: bool):`"

    Function to toggle the usage of chainlink limits. 

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `do_it` |  `bool` | Bool to toggle the usage of chainlink oracles |

    !!!note 
        This function can only be called by the `admin` of the factory contract. 

    ??? quote "Source code"

        ```python hl_lines="1 4 6"
        use_chainlink: public(bool)

        @external
        def set_use_chainlink(do_it: bool):
            assert msg.sender == FACTORY.admin()
            self.use_chainlink = do_it
        ```

    === "Example"

        ```shell
        >>> Oracle.set_use_chainlink('False')
        ```



## **Terminology used in Code**

| terminology used in code | |
|-----------|----------------|
| $\alpha$ | `alpha` |
| $\exp$  | `exp(power: int256) -> uint256:` |
| $TS_i$ | `TRICRYPTO[i].totalSupply()`
| $VP_i$ | `TRICRYPTO[i].virtual_price()` |
| $total_ETH_weighted_price$ | `crv_p` |




## **Contract Info Methods**

### `N_POOLS`
!!! description "`Oracle.N_POOLS() -> uint256:`"

    Getter for number of external pools used by the oracle.

    Returns: number of pools (`uint256`).

    ??? quote "Source code"

        ```python hl_lines="3"
        N_POOLS: public(constant(uint256)) = 2
        ```

    === "Example"

        ```shell
        >>> Oracle.N_POOLS()
        2
        ```


### `TRICRYPTO`
!!! description "`Oracle.TRICRYPTO(arg0: uint256) -> uint256:`"

    Getter for the tricrypto pool at index `arg0`.

    Returns: `last_tvl` (`uint256[N_POOLS]`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `arg0` |  `uint256` | Index |

    ??? quote "Source code"

        ```python hl_lines="1"
        TRICRYPTO: public(immutable(Tricrypto[N_POOLS]))
        ```

    === "Example"

        ```shell
        >>> Oracle.TRICRYPTO(0)
        '0x7F86Bf177Dd4F3494b841a37e810A34dD56c829B'
        ```

### `TRICRYPTO_IX`
!!! description "`Oracle.TRICRYPTO_IX(arg0: uint256) -> uint256:`"

    Getter for the index of ETH in the tricrypto pool w.r.t the coin at index 0.

    Returns: Index of ETH price oracle in the tricrypto pool (`uint256`).

    !!!tip
        Returns 1, as ETH price oracle index in the tricrypto pool is 1. If the same index would be 0, it would return the price oracle of ETH. There prices are all w.r.t the coin at index 0 (USDC or USDT).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `arg0` |  `uint256` | Index of `TRICRYPTO` |

    ??? quote "Source code"

        ```python hl_lines="1"
        TRICRYPTO_IX: public(immutable(uint256[N_POOLS]))
        ```

    === "Example"

        ```shell
        >>> Oracle.TRICRYPTO_IX(0)
        1
        ```


### `STABLESWAP_AGGREGATOR`
!!! description "`Oracle.STABLESWAP_AGGREGATOR() -> address:`"

    Getter for contract of the crvusd price aggregator.

    Returns: contract (`address`).

    ??? quote "Source code"

        ```python hl_lines="1"
        STABLESWAP_AGGREGATOR: public(immutable(StableAggregator))
        ```

    === "Example"

        ```shell
        >>> Oracle.STABLESWAP_AGGREGATOR()
        '0x18672b1b0c623a30089A280Ed9256379fb0E4E62'
        ```


### `STABLESWAP`
!!! description "`Oracle.STABLESWAP(arg0: uint256) -> address:`"

    Getter for the stableswap pool at index `arg0`., 

    Returns: stableswap pool (`address`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `arg0` |  `uint256` | Index of `STABLESWAP` |

    ??? quote "Source code"

        ```python hl_lines="1"
        STABLESWAP: public(immutable(Stableswap[N_POOLS]))
        ```

    === "Example"

        ```shell
        >>> Oracle.STABLESWAP(0)
        '0x4DEcE678ceceb27446b35C672dC7d61F30bAD69E'
        ```


### `STABLECOIN`
!!! description "`Oracle.STABLECOIN() -> address:`"

    Getter for the contract address of crvUSD.

    Returns: crvUSD contract (`address`).

    ??? quote "Source code"

        ```python hl_lines="1"
        STABLECOIN: public(immutable(address))
        ```

    === "Example"

        ```shell
        >>> Oracle.STABLECOIN()
        '0xf939E0A03FB07F59A73314E73794Be0E57ac1b4E'
        ```
        

### `FACTORY`
!!! description "`Oracle.FACTORY() -> address:`"

    Getter for the contract address of the Factory.

    Returns: factory contract (`address`).

    ??? quote "Source code"

        ```python hl_lines="1"
        FACTORY: public(immutable(ControllerFactory))
        ```

    === "Example"

        ```shell
        >>> Oracle.FACTORY()
        '0xC9332fdCB1C491Dcc683bAe86Fe3cb70360738BC'
        ```


### `BOUND_SIZE`
!!! description "`Oracle.BOUND_SIZE() -> uint256:`"

    Getter for the bound size of the chainlink oracle limits. This essentially is the size of the safety limits.

    Returns: bound size (`uint256`).

    ??? quote "Source code"

        ```python hl_lines="1"
        BOUND_SIZE: public(immutable(uint256))
        ```

    === "Example"

        ```shell
        >>> Oracle.BOUND_SIZE()
        15000000000000000
        ```


### `STAKEDSWAP`
!!! description "`Oracle.STAKEDSWAP() -> address:`"

    Getter for the stETH/ETH stableswap pool.

    Returns: pool contract (`address`).

    ??? quote "Source code"

        ```python hl_lines="1"
        STAKEDSWAP: public(immutable(Stableswap))
        ```

    === "Example"

        ```shell
        >>> Oracle.STAKEDSWAP()
        '0x21E27a5E5513D6e65C4f830167390997aA84843a'
        ```


### `WSTETH`
!!! description "`Oracle.WSTETH() -> address:`"

    Getter for the wstETH contract address.

    Returns: wstETH contract (`address`).

    ??? quote "Source code"

        ```python hl_lines="1"
        WSTETH: public(immutable(wstETH))
        ```

    === "Example"

        ```shell
        >>> Oracle.WSTETH()
        '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0'
        ```


### `last_timestamp`
!!! description "`Oracle.last_timestamp() -> uint256:`"

    Getter for the last timestamp when `price_w()` was called.

    Returns: timestamp (`uint256`).

    ??? quote "Source code"

        ```python hl_lines="1"
        last_timestamp: public(uint256)
        ```

    === "Example"

        ```shell
        >>> Oracle.last_timestamp()
        1692613703
        ```


### `TVL_MA_TIME`
!!! description "`Oracle.TVL_MA_TIME() -> uint256:`"

    Getter for the Exponential-Moving-Average time.

    Returns: ema time (`uint256`).

    ??? quote "Source code"

        ```python hl_lines="1"
        TVL_MA_TIME: public(constant(uint256)) = 50000  # s
        ```

    === "Example"

        ```shell
        >>> Oracle.TVL_MA_TIME()
        50000
        ```


### `price`
!!! description "`Oracle.price() -> uint256: view`"

    Function to calculate the raw price.
    
    Returns: raw price (`uint256`).

    ??? quote "Source code"

        ```python hl_lines="1 16 18"
        @external
        @view
        def raw_price() -> uint256:
            return self._raw_price()

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

    === "Example"

        ```shell
        >>> Oracle.price()
        1970446024043370547236
        ```


### `price_w` 
description "`Oracle.price_w() -> uint256:`"

    Function to obtain the oracle price and update `last_tvl` and `last_timestamp`. This function is used in the AMM.

    Returns: oracle price (`uint256[N_POOLS]`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `arg0` |  `uint256` | `last_tvl` of tricrypto pool at index `arg0` |

    ??? quote "Source code"

        ```python hl_lines="2 7"
        @external
        def price_w() -> uint256:
            tvls: uint256[N_POOLS] = self._ema_tvl()
            if self.last_timestamp < block.timestamp:
                self.last_timestamp = block.timestamp
                self.last_tvl = tvls
            return self._raw_price(tvls, STABLESWAP_AGGREGATOR.price_w())
        ```

    === "Example"

        ```shell
        >>> Oracle.price_w()
        ```