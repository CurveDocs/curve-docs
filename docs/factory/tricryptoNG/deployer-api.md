## **Liquidity Pools**

!!!warning
    The transaction will revert if the following requirements are not met.

### `deploy_pool`

The pool **deployment is permissionless**, but it must adhere to certain parameter limitations:

| Parameter            | Limitation                                           |
| -------------------- | ---------------------------------------------------- |
| `A`                  | A_min - 1 < A < A_max + 1                            |
| `gamma`              | gamma_min - 1 < gamma < gamma_max + 1                |
| `mid_fee`            | mid_fee < fee_max - 1; (mid_fee can be 0)            |
| `out_fee`            | out_fee >= mid_fee AND out_fee < fee_max - 1         |
| `fee_gamma`          | 0 < fee_gamma < 10^18 + 1                            |
| `allowed_extra_profit` | allowed_extra_profit < 10^18 + 1                  |
| `adjustment_step`    | 0 < adjustment_step < 10^18 + 1                      |
| `ma_exp_time`        | 86 < ma_exp_time < 872542                            |
| `initial_prices`     | 10^6 < initial_prices[0] and initial_prices[1] < 10^30 |

- Three coins; no duplicate coins possible.
- **`implementation_id`** cannot be **`ZERO_ADDRESS`**.

*With:*

| Parameters       | Value                                    |
| ---------------- | ---------------------------------------- |
| n_coins          | 3                                        |
| A_multiplier     | 10000                                    |
| A_min            | n_coins^n_coins * A_multiplier = 270000  |
| A_max            | 1000 * A_multiplier * n_coins^n_coins = 270000000 |
| gamma_min        | 10^10 = 10000000000                      |
| gamma_max        | 5 * 10^16 = 50000000000000000            |
| fee_max          | 10 * 10^9 = 10000000000                  |

!!! description "`Factory.deploy_pool(_name: String[64], _symbol: String[32], _coins: address[N_COINS], _weth: address, implementation_id: uint256, A: uint256, gamma: uint256, mid_fee: uint256, out_fee: uint256, fee_gamma: uint256, allowed_extra_profit: uint256, adjustment_step: uint256, ma_exp_time: uint256, initial_prices: uint256[N_COINS-1],) -> address:`"   

    Function to deploy a tricrypto pool.

    Returns: Deployed pool (`address`).

    Emits event: `TricryptoPoolDeployed`

    | Input               | Type                  | Description |
    | ------------------- | --------------------- | ----------- |
    | `_name`             | `String[64]`          | Pool Name |
    | `_symbol`           | `String[32]`          | Pool Symbol |
    | `_coins`            | `address[N_COINS]`    | Included Coins |
    | `_weth`             | `address`             | WETH Address |
    | `implementation_id` | `uint256`             | Index of Pool Implementation |
    | `A`                 | `uint256`             | Amplification Factor |
    | `gamma`             | `uint256`             | Gamma |
    | `mid_fee`           | `uint256`             | Mid Fee |
    | `out_fee`           | `uint256`             | Out Fee |
    | `fee_gamma`         | `uint256`             | Fee Gamma |
    | `allowed_extra_profit` | `uint256`          | Allowed Extra Profit |
    | `adjustment_step`   | `uint256`             | Adjustment Step |
    | `ma_exp_time`       | `uint256`             | Exponential Moving Average Time |
    | `initial_prices`    | `uint256[N_COINS-1]`  | Initial Prices |


    ??? quote "Source code"

        ```vyper hl_lines="1"
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

        'returns address of the deployed pool'
        ```


## **Liquidity Gauge**

!!!info
    Liquidity gauges can only be successfully deployed from the same contract from which the pool was deployed!

### `deploy_gauge`

!!! description "`deploy_gauge(_pool: address) -> address`"

    Deploy a liquidity gauge for a factory pool. The deployed gauge implementation is based on what the factory admin has set for `gauge_implementation`.

    | Input    | Type      | Description                          |
    | -------- | --------- | ------------------------------------ |
    | `_pool`  | `address` | Pool address to deploy a gauge for   |


    ??? quote "Source code"

        ```vyper
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
        >>> Factory.deploy_gauge('0x...')

        'returns address of the deployed gauge' 
        ```