what kind of factories are there?
stableswap, crypto, tricrypto
why crypto basepools only on other chains? why not eth mainnet?

!!! note
    After deploying a pool, you must also add initial liquidity before the pool can be used.

# Deploy Pools

## **StableSwap Factory**

StableSwap Factory: [0xB9fC157394Af804a3578134A6585C0dc9cc990d4](https://etherscan.io/address/0xB9fC157394Af804a3578134A6585C0dc9cc990d4)


### `deploy_plain_pool`

Limitations when deplyoing plain pools:

1. $4000000$ (0.04%) $\leq$ `_fee` $\leq 100000000$ (0.1%)
2. valid `_implementation_idx` (can not be `ZERO_ADDRESS`)
3. minimum of 2 coins and maximum of 4 coins
4. can not pair with a coin which is included in a basepool
5. if paired against plain eth (0xE...EeE), eth mus be first coin of the pool (`_coins[0] = plain eth`)
6. maximum of 18 decimals for the coins
7. no duplicate coins

!!!warning
    Transaction will fail when the requirements are not met.

!!! description "`Factory.deploy_plain_pool(_name: String[32], _symbol: String[10], _coins: address[4], _A: uint256, _fee: uint256, _asset_type: uint256 = 0, _implementation_idx: uint256 = 0) → address: nonpayable`"

    Function to deploy a plain pool.

    Returns: deployed pool (`address`).

    Emits event: `PlainPoolDeployed`

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_name` |  `String[32]` | Name of the new plain pool |
    | `_symbol` |  `String[10]` | Symbol for the new metapool’s LP token. This value will be concatenated with the factory symbol. |
    | `_coins` |  `address[4]` | List of addresses of the coins being used in the pool |
    | `_A` |  `uint256` | Amplification coefficient |
    | `_fee` |  `uint256` | Trade fee, given as an integer with `1e10` precision |
    | `_asset_type` |  `uint256` | Asset type of the pool as an integer. 0 = `USD`, 1 = `ETH`, 2 = `BTC`, 3 = Other. |
    | `_implementation_idx` |  `uint256` | Index of the implementation to use. All possible implementations for a pool of N_COINS can be publicly accessed via `plain_implementations(N_COINS)`. |

    ??? quote "Source code"

        ```python
        event PlainPoolDeployed:
            coins: address[MAX_PLAIN_COINS]
            A: uint256
            fee: uint256
            deployer: address

        MAX_PLAIN_COINS: constant(int128) = 4  # max coins in a plain pool

        @external
        def deploy_plain_pool(
            _name: String[32],
            _symbol: String[10],
            _coins: address[MAX_PLAIN_COINS],
            _A: uint256,
            _fee: uint256,
            _asset_type: uint256 = 0,
            _implementation_idx: uint256 = 0,
        ) -> address:
            """
            @notice Deploy a new plain pool
            @param _name Name of the new plain pool
            @param _symbol Symbol for the new plain pool - will be
                           concatenated with factory symbol
            @param _coins List of addresses of the coins being used in the pool.
            @param _A Amplification co-efficient - a lower value here means
                      less tolerance for imbalance within the pool's assets.
                      Suggested values include:
                       * Uncollateralized algorithmic stablecoins: 5-10
                       * Non-redeemable, collateralized assets: 100
                       * Redeemable assets: 200-400
            @param _fee Trade fee, given as an integer with 1e10 precision. The
                        minimum fee is 0.04% (4000000), the maximum is 1% (100000000).
                        50% of the fee is distributed to veCRV holders.
            @param _asset_type Asset type for pool, as an integer
                               0 = USD, 1 = ETH, 2 = BTC, 3 = Other
            @param _implementation_idx Index of the implementation to use. All possible
                        implementations for a pool of N_COINS can be publicly accessed
                        via `plain_implementations(N_COINS)`
            @return Address of the deployed pool
            """
            # fee must be between 0.04% and 1%
            assert _fee >= 4000000 and _fee <= 100000000, "Invalid fee"
        
            n_coins: uint256 = MAX_PLAIN_COINS
            rate_multipliers: uint256[MAX_PLAIN_COINS] = empty(uint256[MAX_PLAIN_COINS])
            decimals: uint256[MAX_PLAIN_COINS] = empty(uint256[MAX_PLAIN_COINS])
        
            for i in range(MAX_PLAIN_COINS):
                coin: address = _coins[i]
                if coin == ZERO_ADDRESS:
                    assert i > 1, "Insufficient coins"
                    n_coins = i
                    break
                assert self.base_pool_assets[coin] == False, "Invalid asset, deploy a metapool"
        
                if _coins[i] == 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE:
                    assert i == 0, "ETH must be first coin"
                    decimals[0] = 18
                else:
                    decimals[i] = ERC20(coin).decimals()
                    assert decimals[i] < 19, "Max 18 decimals for coins"
        
                rate_multipliers[i] = 10 ** (36 - decimals[i])
        
                for x in range(i, i+MAX_PLAIN_COINS):
                    if x+1 == MAX_PLAIN_COINS:
                        break
                    if _coins[x+1] == ZERO_ADDRESS:
                        break
                    assert coin != _coins[x+1], "Duplicate coins"
        
            implementation: address = self.plain_implementations[n_coins][_implementation_idx]
            assert implementation != ZERO_ADDRESS, "Invalid implementation index"
            pool: address = create_forwarder_to(implementation)
            CurvePlainPool(pool).initialize(_name, _symbol, _coins, rate_multipliers, _A, _fee)
        
            length: uint256 = self.pool_count
            self.pool_list[length] = pool
            self.pool_count = length + 1
            self.pool_data[pool].decimals = decimals
            self.pool_data[pool].n_coins = n_coins
            self.pool_data[pool].base_pool = ZERO_ADDRESS
            self.pool_data[pool].implementation = implementation
            if _asset_type != 0:
                self.pool_data[pool].asset_type = _asset_type
        
            for i in range(MAX_PLAIN_COINS):
                coin: address = _coins[i]
                if coin == ZERO_ADDRESS:
                    break
                self.pool_data[pool].coins[i] = coin
                raw_call(
                    coin,
                    concat(
                        method_id("approve(address,uint256)"),
                        convert(pool, bytes32),
                        convert(MAX_UINT256, bytes32)
                    )
                )
                for j in range(MAX_PLAIN_COINS):
                    if i < j:
                        swappable_coin: address = _coins[j]
                        key: uint256 = bitwise_xor(convert(coin, uint256), convert(swappable_coin, uint256))
                        length = self.market_counts[key]
                        self.markets[key][length] = pool
                        self.market_counts[key] = length + 1
        
            log PlainPoolDeployed(_coins, _A, _fee, msg.sender)
            return pool
        ```

    === "Example"

        ```shell
        >>> Factory.deploy_plain_pool(
            _name: "llama threepool",
            _symbol: "l3pool",
            _coins: ['0x...llama1', '0x...llama2', '0x...llama3'],
            _A: 200,
            _fee: 4000000,
            _asset_type: uint256 = 0,
            _implementation_idx: uint256 = 0,
            )    

        >>> 'returns address of deployed pool'
        ```

    !!!note
        `_asset_type` and `_implementation_idx` values are defaulted to 0 if no other inputs are given.     
        Asset types: 0 = USD, 1 = ETH, 2 = BTC, 3 = Other.  
        Implementation ID: check `plain_implementations(N_COINS)`.



### `deploy_metapool`

Limitations when deplyoing plain pools:

1. $4000000$ (0.04%) $\leq$ `_fee` $\leq 100000000$ (0.1%)
2. valid `_implementation_idx` (can not be `ZERO_ADDRESS`)
3. maximum of 18 decimals for the coins

!!! description "`Factory.deploy_metapool(_base_pool: address, _name: String[32], _symbol: String[10], _coin: address, _A: uint256, _fee: uint256, _implementation_idx: uint256 = 0) -> address:`"

    Function to deploy a metapool.

    Returns: deployed pool (`address`).

    Emits event: `MetaPoolDeployed`

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_base_pool` |  `address` | Address of the base pool to use within the new metapool |
    | `_name` |  `String[32]` | Name of the new metapool |
    | `_symbol` |  `String[10]` | Symbol for the new metapool’s LP token. This value will be concatenated with the base pool symbol. |
    | `_coin` |  `address` | Address of the coin being used in the metapool |
    | `_A` |  `uint256` | Amplification coefficient |
    | `_fee` |  `uint256` | Trade fee, given as an integer with `1e10` precision |
    | `_implementation_idx` |  `uint256` | Index of the implementation to use. All possible implementations for a pool of N_COINS can be publicly accessed via `plain_implementations(N_COINS)` |

    ??? quote "Source code"

        ```python
        event MetaPoolDeployed:
            coin: address
            base_pool: address
            A: uint256
            fee: uint256
            deployer: address

        @external
        def deploy_metapool(
            _base_pool: address,
            _name: String[32],
            _symbol: String[10],
            _coin: address,
            _A: uint256,
            _fee: uint256,
            _implementation_idx: uint256 = 0,
        ) -> address:
            """
            @notice Deploy a new metapool
            @param _base_pool Address of the base pool to use
                              within the metapool
            @param _name Name of the new metapool
            @param _symbol Symbol for the new metapool - will be
                           concatenated with the base pool symbol
            @param _coin Address of the coin being used in the metapool
            @param _A Amplification co-efficient - a higher value here means
                      less tolerance for imbalance within the pool's assets.
                      Suggested values include:
                       * Uncollateralized algorithmic stablecoins: 5-10
                       * Non-redeemable, collateralized assets: 100
                       * Redeemable assets: 200-400
            @param _fee Trade fee, given as an integer with 1e10 precision. The
                        minimum fee is 0.04% (4000000), the maximum is 1% (100000000).
                        50% of the fee is distributed to veCRV holders.
            @param _implementation_idx Index of the implementation to use. All possible
                        implementations for a BASE_POOL can be publicly accessed
                        via `metapool_implementations(BASE_POOL)`
            @return Address of the deployed pool
            """
            # fee must be between 0.04% and 1%
            assert _fee >= 4000000 and _fee <= 100000000, "Invalid fee"
        
            implementation: address = self.base_pool_data[_base_pool].implementations[_implementation_idx]
            assert implementation != ZERO_ADDRESS, "Invalid implementation index"
        
            # things break if a token has >18 decimals
            decimals: uint256 = ERC20(_coin).decimals()
            assert decimals < 19, "Max 18 decimals for coins"
        
            pool: address = create_forwarder_to(implementation)
            CurvePool(pool).initialize(_name, _symbol, _coin, 10 ** (36 - decimals), _A, _fee)
            ERC20(_coin).approve(pool, MAX_UINT256)
        
            # add pool to pool_list
            length: uint256 = self.pool_count
            self.pool_list[length] = pool
            self.pool_count = length + 1
        
            base_lp_token: address = self.base_pool_data[_base_pool].lp_token
        
            self.pool_data[pool].decimals = [decimals, 0, 0, 0]
            self.pool_data[pool].n_coins = 2
            self.pool_data[pool].base_pool = _base_pool
            self.pool_data[pool].coins[0] = _coin
            self.pool_data[pool].coins[1] = self.base_pool_data[_base_pool].lp_token
            self.pool_data[pool].implementation = implementation
        
            is_finished: bool = False
            for i in range(MAX_COINS):
                swappable_coin: address = self.base_pool_data[_base_pool].coins[i]
                if swappable_coin == ZERO_ADDRESS:
                    is_finished = True
                    swappable_coin = base_lp_token
        
                key: uint256 = bitwise_xor(convert(_coin, uint256), convert(swappable_coin, uint256))
                length = self.market_counts[key]
                self.markets[key][length] = pool
                self.market_counts[key] = length + 1
                if is_finished:
                    break
        
            log MetaPoolDeployed(_coin, _base_pool, _A, _fee, msg.sender)
            return pool
        ```

    === "Example"

        ```shell
        >>> Factory.deploy_metapool(
            _base_pool: '0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7',
            _name: "llama/3CRV",
            _symbol: "l3CRV",
            _coin: '0x...llama1',
            _A: 200,
            _fee: 4000000,
            _implementation_idx: uint256 = 0,
            )

        >>> 'returns address of the deployed pool'
        ```



## **CryptoSwap Factory**

cryptoswap pools are two-coin asset pools which include volatiles assets (not pegged to a certain value)

### `deploy_pool`

Limitations when deplyoing plain crypto pools:

1. $A_{min} - 1 < A < A_{max} + 1$
2. $gamma_{min} - 1 < gamma < gamma_{max} + 1$
3. $fee_{min} - 1 < fee_{mid} < fee_{max} - 1$
4. $fee_{out} >= fee_{mid}$ AND $fee_{out} < fee_{max} - 1$
1. `admin_fee` $< 10^{18} + 1$ 
5. $\text{allowed_extra_profit} < 10^{16} + 1$
6. $0 < gamma_{fee} < 10^{18} + 1$ 
7. $0 < \text{adjustment_step} < 10^{18} + 1$
9. $0 < \text{ma_half_time} < 604800$  |
10. $10^{6} < \text{initial_price} < 10^{30}$ |
11. no duplicate coins
12. only two coins
13. maximum of 18 decimals of a coin


*with:*

| Parameters    | Value |
|---------------|-------|
|$n_{coins}$    | $2$ |
|$A_{multiplier}$ | $10000$ |
|$A_{min}$      | $\frac{n_{coins}^{n_{coins}} * A_{multiplier}}{10} = 4000$ |
|$A_{max}$      | $n_{coins}^{n_{coins}} * A_{multiplier} * 100000 = 4000000000$|  
|$gamma_{min}$  | $10^{10} = 10000000000$|  
|$gamma_{max}$  | $2 * 10^{16} = 20000000000000000$ |
|$fee_{min}$    | $5 * 10^{5} = 500000$ |
|$fee_{max}$    | $10 * 10^{9} = 10000000000$ |

!!!warning
    Transaction will fail when the requirements are not met.

!!! description "`Factory.deploy_pool(_name: String[32], _symbol: String[10], _coins: address[2], A: uint256, gamma: uint256, mid_fee: uint256, out_fee: uint256, allowed_extra_profit: uint256, fee_gamma: uint256, adjustment_step: uint256, admin_fee: uint256, ma_half_time: uint256, initial_price: uint256) -> address:`"

    Function to deploy a plain pool.

    Returns: deployed pool (`address`).

    Emits event: `CryptoPoolDeployed`

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_name` |  `String[32]` | Name of the new plain pool |
    | `_symbol` |  `String[10]` | Symbol for the new metapool’s LP token. This value will be concatenated with the factory symbol. |
    | `_coins` |  `address[4]` | List of addresses of the coins being used in the pool |
    | `A` |  `uint256` | Amplification coefficient |
    | `gamma` |  `uint256` | Gamma |
    | `mid_fee` |  `uint256` | Mid fee |
    | `out_fee` |  `uint256` | Out fee |
    | `allowed_extra_profit` |  `uint256` | Allowed extra profit |
    | `fee_gamma` |  `uint256` | Fee Gamma |
    | `adjustment_step` |  `uint256` | Adjustment step |
    | `admin_fee` |  `uint256` | Admin fee |
    | `ma_half_time` |  `uint256` | Moving-Average half time |
    | `initial_price` |  `uint256` | Initial price |


    ??? quote "Source code"

        ```python
        event CryptoPoolDeployed:
            token: address
            coins: address[2]
            A: uint256
            gamma: uint256
            mid_fee: uint256
            out_fee: uint256
            allowed_extra_profit: uint256
            fee_gamma: uint256
            adjustment_step: uint256
            admin_fee: uint256
            ma_half_time: uint256
            initial_price: uint256
            deployer: address

        N_COINS: constant(int128) = 2
        A_MULTIPLIER: constant(uint256) = 10000

        # Limits
        MAX_ADMIN_FEE: constant(uint256) = 10 * 10 ** 9
        MIN_FEE: constant(uint256) = 5 * 10 ** 5  # 0.5 bps
        MAX_FEE: constant(uint256) = 10 * 10 ** 9

        MIN_GAMMA: constant(uint256) = 10 ** 10
        MAX_GAMMA: constant(uint256) = 2 * 10 ** 16

        MIN_A: constant(uint256) = N_COINS ** N_COINS * A_MULTIPLIER / 10
        MAX_A: constant(uint256) = N_COINS ** N_COINS * A_MULTIPLIER * 100000

        @external
        def deploy_pool(
            _name: String[32],
            _symbol: String[10],
            _coins: address[2],
            A: uint256,
            gamma: uint256,
            mid_fee: uint256,
            out_fee: uint256,
            allowed_extra_profit: uint256,
            fee_gamma: uint256,
            adjustment_step: uint256,
            admin_fee: uint256,
            ma_half_time: uint256,
            initial_price: uint256
        ) -> address:
            """
            @notice Deploy a new pool
            @param _name Name of the new plain pool
            @param _symbol Symbol for the new plain pool - will be concatenated with factory symbol
            Other parameters need some description
            @return Address of the deployed pool
            """
            # Validate parameters
            assert A > MIN_A-1
            assert A < MAX_A+1
            assert gamma > MIN_GAMMA-1
            assert gamma < MAX_GAMMA+1
            assert mid_fee > MIN_FEE-1
            assert mid_fee < MAX_FEE-1
            assert out_fee >= mid_fee
            assert out_fee < MAX_FEE-1
            assert admin_fee < 10**18+1
            assert allowed_extra_profit < 10**16+1
            assert fee_gamma < 10**18+1
            assert fee_gamma > 0
            assert adjustment_step < 10**18+1
            assert adjustment_step > 0
            assert ma_half_time < 7 * 86400
            assert ma_half_time > 0
            assert initial_price > 10**6
            assert initial_price < 10**30
            assert _coins[0] != _coins[1], "Duplicate coins"

            decimals: uint256[2] = empty(uint256[2])
            for i in range(2):
                d: uint256 = ERC20(_coins[i]).decimals()
                assert d < 19, "Max 18 decimals for coins"
                decimals[i] = d
            precisions: uint256 = (18 - decimals[0]) + shift(18 - decimals[1], 8)


            name: String[64] = concat("Curve.fi Factory Crypto Pool: ", _name)
            symbol: String[32] = concat(_symbol, "-f")

            token: address = create_forwarder_to(self.token_implementation)
            pool: address = create_forwarder_to(self.pool_implementation)

            Token(token).initialize(name, symbol, pool)
            CryptoPool(pool).initialize(
                A, gamma, mid_fee, out_fee, allowed_extra_profit, fee_gamma,
                adjustment_step, admin_fee, ma_half_time, initial_price,
                token, _coins, precisions)

            length: uint256 = self.pool_count
            self.pool_list[length] = pool
            self.pool_count = length + 1
            self.pool_data[pool].token = token
            self.pool_data[pool].decimals = shift(decimals[0], 8) + decimals[1]
            self.pool_data[pool].coins = _coins

            key: uint256 = bitwise_xor(convert(_coins[0], uint256), convert(_coins[1], uint256))
            length = self.market_counts[key]
            self.markets[key][length] = pool
            self.market_counts[key] = length + 1

            log CryptoPoolDeployed(
                token, _coins,
                A, gamma, mid_fee, out_fee, allowed_extra_profit, fee_gamma,
                adjustment_step, admin_fee, ma_half_time, initial_price,
                msg.sender)
            return pool
        ```

    === "Example"

        ```shell
        >>> CryptoFactory.deploy_pool(
            _name: crv/weth crypto pool,
            _symbol: crv/eth,
            _coins: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", "0xD533a949740bb3306d119CC777fa900bA034cd52",
            A: 20000000,
            gamma: 10000000000000000,
            mid_fee: 3000000,
            out_fee: 45000000,
            allowed_extra_profit: 10000000000,
            fee_gamma: 300000000000000000,
            adjustment_step: 5500000000000,
            admin_fee: 5000000000,
            ma_half_time: 600,
            initial_price: todo,
            ) 

        >>> 'returns address of the deployed pool'
        ```



## **Tricrypto Factory**

Tricrypto pools are volatile three-coin liquidity pools. For a better understanding please refer to: CryptoSwap

!!!note
    Tricrypto Factory: [0x0c0e5f2fF0ff18a3be9b835635039256dC4B4963](https://etherscan.io/address/0x0c0e5f2fF0ff18a3be9b835635039256dC4B4963)


1. three coins; no duplicate coins possible 
1. `implemention_id` cannot be `ZERO_ADDRESS`
1. $A_{min} - 1 < A < A_{max} + 1$ |
1. $gamma_{min} - 1 < gamma < gamma_{max} + 1$ |
1. $fee_{mid} < fee_{max} - 1$; (`mid_fee` can be 0)|
1. $fee_{out} >= fee_{mid}$ AND $fee_{out} < fee_{max} - 1$ |
1. $0 < gamma_{fee} < 10^{18} + 1$  |
1. $\text{allowed_extra_profit} < 10^{18} + 1$  |
1. $0 < \text{adjustment_step} < 10^{18} + 1$  |
1. $86 < \text{ma_exp_time} < 872542$  |
1. $10^{6} < \text{initial_prices[0] and initial_prices[1]} < 10^{30}$ |


*with:*

| Parameters    | Value |
|---------------|-------|
|$n_{coins}$ | $3$ |
|$A_{multiplier}$ | $10000$ |
|$A_{min}$      | $n_{coins}^{n_{coins}} * A_{multiplier} = 270000$ |
|$A_{max}$      | $1000 * A_{multiplier} * n_{coins}^{n_{coins}} = 270000000$|  
|$gamma_{min}$  | $10^{10} = 10000000000$|  
|$gamma_{max}$  | $5 * 10^{16} = 50000000000000000$ |
|$fee_{max}$   | $10 * 10^{9} = 10000000000$ |


### `TricryptoFactory.deploy_pool`
!!! description "`Factory.deploy_pool(_name: String[64], _symbol: String[32], _coins: address[N_COINS], _weth: address, implementation_id: uint256, A: uint256, gamma: uint256, mid_fee: uint256, out_fee: uint256, fee_gamma: uint256, allowed_extra_profit: uint256, adjustment_step: uint256, ma_exp_time: uint256, initial_prices: uint256[N_COINS-1],) -> address:`"   

    Function to deploy a tricrypto pool.

    Returns: deployed pool (`address`).

    Emits event: `TricryptoPoolDeployed`

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_name` |  `String[64]` | Pool Name |
    | `_symbol` |  `String[32]` | Pool Symbol |
    | `_coins` |  `address[N_COINS]` | Included Coins |
    | `_weth` |  `address` | WETH Address |
    | `implementation_id` |  `uint256` | Index of Pool Implementation |
    | `A` |  `uint256` | Amplification Factor |
    | `gamma` |  `uint256` | Gamma |
    | `mid_fee` |  `uint256` | Mid Fee |
    | `out_fee` |  `uint256` | Out Fee |
    | `fee_gamma` |  `uint256` | Fee Gamma |
    | `allowed_extra_profit` |  `uint256` | Allowed Extra Profit |
    | `adjustment_step` |  `uint256` | Adjustment Step |
    | `ma_exp_time` |  `uint256` | Exponention Moving Average Time |
    | `initial_prices` |  `uint256[N_COINS-1]` | Initial Prices |

    ??? quote "Source code"

        ```python hl_lines="1"
        event TricryptoPoolDeployed:
            pool: address
            name: String[64]
            symbol: String[32]
            weth: address
            coins: address[N_COINS]
            math: address
            salt: bytes32
            packed_precisions: uint256
            packed_A_gamma: uint256
            packed_fee_params: uint256
            packed_rebalancing_params: uint256
            packed_prices: uint256
            deployer: address

        N_COINS: constant(uint256) = 3
        A_MULTIPLIER: constant(uint256) = 10000

        MAX_FEE: constant(uint256) = 10 * 10 ** 9

        MIN_GAMMA: constant(uint256) = 10 ** 10
        MAX_GAMMA: constant(uint256) = 5 * 10**16

        MIN_A: constant(uint256) = N_COINS ** N_COINS * A_MULTIPLIER / 100
        MAX_A: constant(uint256) = 1000 * A_MULTIPLIER * N_COINS**N_COINS

        PRICE_SIZE: constant(uint128) = 256 / (N_COINS - 1)
        PRICE_MASK: constant(uint256) = 2**PRICE_SIZE - 1

        @external
        def deploy_pool(
            _name: String[64],
            _symbol: String[32],
            _coins: address[N_COINS],
            _weth: address,
            implementation_id: uint256,
            A: uint256,
            gamma: uint256,
            mid_fee: uint256,
            out_fee: uint256,
            fee_gamma: uint256,
            allowed_extra_profit: uint256,
            adjustment_step: uint256,
            ma_exp_time: uint256,
            initial_prices: uint256[N_COINS-1],
        ) -> address:
            """
            @notice Deploy a new pool
            @param _name Name of the new plain pool
            @param _symbol Symbol for the new plain pool - will be concatenated with factory symbol

            @return Address of the deployed pool
            """
            pool_implementation: address = self.pool_implementations[implementation_id]
            assert pool_implementation != empty(address), "Pool implementation not set"

            # Validate parameters
            assert A > MIN_A-1
            assert A < MAX_A+1

            assert gamma > MIN_GAMMA-1
            assert gamma < MAX_GAMMA+1

            assert mid_fee < MAX_FEE-1  # mid_fee can be zero
            assert out_fee >= mid_fee
            assert out_fee < MAX_FEE-1
            assert fee_gamma < 10**18+1
            assert fee_gamma > 0

            assert allowed_extra_profit < 10**18+1

            assert adjustment_step < 10**18+1
            assert adjustment_step > 0

            assert ma_exp_time < 872542  # 7 * 24 * 60 * 60 / ln(2)
            assert ma_exp_time > 86  # 60 / ln(2)

            assert min(initial_prices[0], initial_prices[1]) > 10**6
            assert max(initial_prices[0], initial_prices[1]) < 10**30

            assert _coins[0] != _coins[1] and _coins[1] != _coins[2] and _coins[0] != _coins[2], "Duplicate coins"

            decimals: uint256[N_COINS] = empty(uint256[N_COINS])
            precisions: uint256[N_COINS] = empty(uint256[N_COINS])
            for i in range(N_COINS):
                d: uint256 = ERC20(_coins[i]).decimals()
                assert d < 19, "Max 18 decimals for coins"
                decimals[i] = d
                precisions[i] = 10** (18 - d)

            # pack precisions
            packed_precisions: uint256 = self._pack(precisions)

            # pack fees
            packed_fee_params: uint256 = self._pack(
                [mid_fee, out_fee, fee_gamma]
            )

            # pack liquidity rebalancing params
            packed_rebalancing_params: uint256 = self._pack(
                [allowed_extra_profit, adjustment_step, ma_exp_time]
            )

            # pack A_gamma
            packed_A_gamma: uint256 = A << 128
            packed_A_gamma = packed_A_gamma | gamma

            # pack initial prices
            packed_prices: uint256 = 0
            for k in range(N_COINS - 1):
                packed_prices = packed_prices << PRICE_SIZE
                p: uint256 = initial_prices[N_COINS - 2 - k]
                assert p < PRICE_MASK
                packed_prices = p | packed_prices

            # pool is an ERC20 implementation
            _salt: bytes32 = block.prevhash
            _math_implementation: address = self.math_implementation
            pool: address = create_from_blueprint(
                pool_implementation,
                _name,
                _symbol,
                _coins,
                _math_implementation,
                _weth,
                _salt,
                packed_precisions,
                packed_A_gamma,
                packed_fee_params,
                packed_rebalancing_params,
                packed_prices,
                code_offset=3
            )

            # populate pool data
            length: uint256 = self.pool_count
            self.pool_list[length] = pool
            self.pool_count = length + 1
            self.pool_data[pool].decimals = decimals
            self.pool_data[pool].coins = _coins

            # add coins to market:
            self._add_coins_to_market(_coins[0], _coins[1], pool)
            self._add_coins_to_market(_coins[0], _coins[2], pool)
            self._add_coins_to_market(_coins[1], _coins[2], pool)

            log TricryptoPoolDeployed(
                pool,
                _name,
                _symbol,
                _weth,
                _coins,
                _math_implementation,
                _salt,
                packed_precisions,
                packed_A_gamma,
                packed_fee_params,
                packed_rebalancing_params,
                packed_prices,
                msg.sender,
            )

            return pool
        ```

    === "Example"

        ```shell
        >>> TricryptoFactory.deploy_pool(
            _name: crv/weth/tbtc tripool,
            _symbol: crv-weth-tbtc,
            _coins: '0xD533a949740bb3306d119CC777fa900bA034cd52', '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', '0x8dAEBADE922dF735c38C80C7eBD708Af50815fAa',
            _weth: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
            implementation_id: 0,
            A: 2700000,
            gamma: 1300000000000,
            mid_fee: 2999999,
            out_fee: 80000000,
            fee_gamma: 350000000000000,
            allowed_extra_profit: 100000000000,
            adjustment_step: 100000000000,
            ma_exp_time: 600,
            initial_prices: todo,
            )

        >>> 'returns address of the deployed pool'
        ```




## Deploy Gauge

!!!warning
    When deploying gauges, the same contract has to be used as the one that deployed the pool.

### `Factory.deploy_gauge`

!!! description "`Factory.deploy_gauge(_pool: address) -> address`"

    Deploy a liquidity gauge for a factory pool. The deployed gauge implementation is whatever the factory admin
    has set `Factory.gauge_implementation` to.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_pool` |  `address` | Factory pool address to deploy a gauge for |

    ??? quote "Source code"

        ```python
        @external
        def deploy_gauge(_pool: address) -> address:
            """
            @notice Deploy a liquidity gauge for a factory pool
            @param _pool Factory pool address to deploy a gauge for
            @return Address of the deployed gauge
            """
            assert self.pool_data[_pool].coins[0] != ZERO_ADDRESS, "Unknown pool"
            assert self.pool_data[_pool].liquidity_gauge == ZERO_ADDRESS, "Gauge already deployed"
            implementation: address = self.gauge_implementation
            assert implementation != ZERO_ADDRESS, "Gauge implementation not set"
        
            gauge: address = create_forwarder_to(implementation)
            LiquidityGauge(gauge).initialize(_pool)
            self.pool_data[_pool].liquidity_gauge = gauge
        
            log LiquidityGaugeDeployed(_pool, gauge)
            return gauge
        ```

    === "Example"

        ```shell
        >>> todo: 
        ```
