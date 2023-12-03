## **Liquidity Pools**

!!!warning
    The transaction will revert if the following requirements are not met.

### `deploy_pool`

The pool **deployment is permissionless**, but it must adhere to certain parameter limitations:

| Parameter            | Limitation                                           |
| -------------------- | ---------------------------------------------------- |
| `A`                  | A_min - 1 < A < A_max + 1                            |
| `gamma`              | gamma_min - 1 < gamma < gamma_max + 1                |
| `mid_fee`            | fee_min - 1 < mid_fee < fee_max - 1                  |
| `out_fee`            | out_fee >= mid_fee AND out_fee < fee_max - 1         |
| `admin_fee`          | < 10^18 + 1                                          |
| `allowed_extra_profit` | allowed_extra_profit < 10^16 + 1                   |
| `fee_gamma`          | 0 < fee_gamma < 10^18 + 1                            |
| `adjustment_step`    | 0 < adjustment_step < 10^18 + 1                      |
| `ma_half_time`       | 0 < ma_half_time < 604800                            |
| `initial_price`      | 10^6 < initial_price < 10^30                         |

- No duplicate coins.
- Only two coins.
- Maximum of 18 decimals of a coin.

*With:*

| Parameters        | Value                                   |
| ----------------- | --------------------------------------- |
| n_coins           | 2                                       |
| A_multiplier      | 10000                                   |
| A_min             | (n_coins^n_coins * A_multiplier) / 10 = 4000 |
| A_max             | n_coins^n_coins * A_multiplier * 100000 = 4000000000 |
| gamma_min         | 10^10 = 10000000000                     |
| gamma_max         | 2 * 10^16 = 20000000000000000           |
| fee_min           | 5 * 10^5 = 500000                       |
| fee_max           | 10 * 10^9 = 10000000000                 |

!!! description "`Factory.deploy_pool(_name: String[32], _symbol: String[10], _coins: address[2], A: uint256, gamma: uint256, mid_fee: uint256, out_fee: uint256, allowed_extra_profit: uint256, fee_gamma: uint256, adjustment_step: uint256, admin_fee: uint256, ma_half_time: uint256, initial_price: uint256) -> address:`"

    Function to deploy a cryptoswap pool form the `pool_implementations`. This function will also deploy the according LP token from the `token_implementation`.

    Returns: Deployed pool (`address`).

    Emits: `CryptoPoolDeployed`

    | Input                  | Type          | Description |
    | ---------------------- | ------------- | ----------- |
    | `_name`                | `String[32]`  | Name of the new plain pool |
    | `_symbol`              | `String[10]`  | Symbol for the new metapool’s LP token. This value will be concatenated with the factory symbol. |
    | `_coins`               | `address[2]`  | List of addresses of the coins being used in the pool |
    | `A`                    | `uint256`     | Amplification coefficient |
    | `gamma`                | `uint256`     | Gamma |
    | `mid_fee`              | `uint256`     | Mid fee |
    | `out_fee`              | `uint256`     | Out fee |
    | `allowed_extra_profit` | `uint256`     | Allowed extra profit |
    | `fee_gamma`            | `uint256`     | Fee Gamma |
    | `adjustment_step`      | `uint256`     | Adjustment step |
    | `admin_fee`            | `uint256`     | Admin fee |
    | `ma_half_time`         | `uint256`     | Moving-Average half time |
    | `initial_price`        | `uint256`     | Initial price |

    ??? quote "Source code"

        ```vyper
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

        'returns address of the deployed pool'
        ```


## **Liquidity Gauge**

!!!info
    Liquidity gauges can only be successfully deployed from the same contract from which the pool was deployed!

### `deploy_gauge`

!!! description "`deploy_gauge(_pool: address) -> address`"

    Function to deploy a liquidity gauge for a factory pool. The deployed gauge is created from the `gauge_implementation`.

    Emits: `LiquidityGaugeDeployed`

    | Input      | Type      | Description                                   |
    | -----------| --------- | --------------------------------------------- |
    | `_pool`    | `address` | Factory pool address to deploy a gauge for    |

    ??? quote "Source code"

        ```vyper
        event LiquidityGaugeDeployed:
            pool: address
            token: address
            gauge: address

        @external
        def deploy_gauge(_pool: address) -> address:
            """
            @notice Deploy a liquidity gauge for a factory pool
            @param _pool Factory pool address to deploy a gauge for
            @return Address of the deployed gauge
            """
            assert self.pool_data[_pool].coins[0] != ZERO_ADDRESS, "Unknown pool"
            assert self.pool_data[_pool].liquidity_gauge == ZERO_ADDRESS, "Gauge already deployed"

            gauge: address = create_forwarder_to(self.gauge_implementation)
            token: address = self.pool_data[_pool].token
            LiquidityGauge(gauge).initialize(token)
            self.pool_data[_pool].liquidity_gauge = gauge

            log LiquidityGaugeDeployed(_pool, token, gauge)
            return gauge
        ```

    === "Example"

        ```shell
        Factory.deploy_gauge('0x...')

        'returns address of the deployed gauge' 
        ```