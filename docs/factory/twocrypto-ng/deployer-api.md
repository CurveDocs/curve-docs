<h1>Pool Factory: Deployer API</h1>


### `deploy_pool`
!!! description "`Factory.deploy_pool(_name: String[64], _symbol: String[32], _coins: address[N_COINS], implementation_id: uint256, A: uint256, gamma: uint256, mid_fee: uint256, out_fee: uint256, fee_gamma: uint256, allowed_extra_profit: uint256, adjustment_step: uint256, ma_exp_time: uint256, initial_price: uint256) -> address:`"

    Function to deploy a Twocrypto-NG liquidity pool.

    Returns: deployed pool (`address`).

    Emits: `TwocryptoPoolDeployed`

    | Input                 | Type                | Description                                        |
    |-----------------------|---------------------|----------------------------------------------------|
    | `_name`               | `String[64]`        | Pool name                                          |
    | `_symbol`             | `String[32]`        | Pool symbol                                        |
    | `_coins`              | `address[N_COINS]`  | Coins                                              |
    | `implementation_id`   | `uint256`           | Implementation index of `Factory.poolImplementations()` |
    | `A`                   | `uint256`           | Amplification Coefficient                          |
    | `gamma`               | `uint256`           | Gamma                                              |
    | `mid_fee`             | `uint256`           | Mid Fee                                            |
    | `out_fee`             | `uint256`           | Out Fee                                            |
    | `fee_gamma`           | `uint256`           | Fee Gamma                                          |
    | `allowed_extra_profit`| `uint256`           | Allowed Extra Profit                               |
    | `adjustment_step`     | `uint256`           | Adjustment Step                                    |
    | `ma_exp_time`         | `uint256`           | Moving Average Time Period                         |
    | `initial_price`       | `uint256`           | Initial Prices                                     |


    *Limitations when deploying liquidity pools:*

    - pool and math implementation must not be empty
    - no duplicate coins
    - maximum 18 decimal coins

    | Parameter            | Limitation                                           |
    | -------------------- | ---------------------------------------------------- |
    | `mid_fee`            | mid_fee < MAX_FEE - 1; mid_fee can be 0              |
    | `out_fee`            | mid_fee <= out_fee < MAX_FEE - 1         |
    | `fee_gamma`          | 0 < fee_gamma < 10^18 + 1                            |
    | `allowed_extra_profit` | allowed_extra_profit < 10^18 + 1                  |
    | `adjustment_step`    | 0 < adjustment_step < 10^18 + 1                      |
    | `ma_exp_time`        | 86 < ma_exp_time < 872542                            |
    | `initial_prices`     | 10^6 < initial_prices[0] and initial_prices[1] < 10^30 |

    ??? quote "Source code"

        === "CurveTwocryptoFactory.vy"

            ```vyper
            event TwocryptoPoolDeployed:
                pool: address
                name: String[64]
                symbol: String[32]
                coins: address[N_COINS]
                math: address
                salt: bytes32
                precisions: uint256[N_COINS]
                packed_A_gamma: uint256
                packed_fee_params: uint256
                packed_rebalancing_params: uint256
                packed_prices: uint256
                deployer: address

            @external
            def deploy_pool(
                _name: String[64],
                _symbol: String[32],
                _coins: address[N_COINS],
                implementation_id: uint256,
                A: uint256,
                gamma: uint256,
                mid_fee: uint256,
                out_fee: uint256,
                fee_gamma: uint256,
                allowed_extra_profit: uint256,
                adjustment_step: uint256,
                ma_exp_time: uint256,
                initial_price: uint256,
            ) -> address:
                """
                @notice Deploy a new pool
                @param _name Name of the new plain pool
                @param _symbol Symbol for the new plain pool - will be concatenated with factory symbol

                @return Address of the deployed pool
                """
                pool_implementation: address = self.pool_implementations[implementation_id]
                _math_implementation: address = self.math_implementation
                assert pool_implementation != empty(address), "Pool implementation not set"
                assert _math_implementation != empty(address), "Math implementation not set"

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

                assert initial_price > 10**6 and initial_price < 10**30  # dev: initial price out of bound

                assert _coins[0] != _coins[1], "Duplicate coins"

                decimals: uint256[N_COINS] = empty(uint256[N_COINS])
                precisions: uint256[N_COINS] = empty(uint256[N_COINS])
                for i in range(N_COINS):
                    d: uint256 = ERC20(_coins[i]).decimals()
                    assert d < 19, "Max 18 decimals for coins"
                    decimals[i] = d
                    precisions[i] = 10 ** (18 - d)

                # pack precision
                packed_precisions: uint256 = self._pack_2(precisions[0], precisions[1])

                # pack fees
                packed_fee_params: uint256 = self._pack_3(
                    [mid_fee, out_fee, fee_gamma]
                )

                # pack liquidity rebalancing params
                packed_rebalancing_params: uint256 = self._pack_3(
                    [allowed_extra_profit, adjustment_step, ma_exp_time]
                )

                # pack gamma and A
                packed_gamma_A: uint256 = self._pack_2(gamma, A)

                # pool is an ERC20 implementation
                _salt: bytes32 = block.prevhash
                pool: address = create_from_blueprint(
                    pool_implementation,  # blueprint: address
                    _name,  # String[64]
                    _symbol,  # String[32]
                    _coins,  # address[N_COINS]
                    _math_implementation,  # address
                    _salt,  # bytes32
                    packed_precisions,  # uint256
                    packed_gamma_A,  # uint256
                    packed_fee_params,  # uint256
                    packed_rebalancing_params,  # uint256
                    initial_price,  # uint256
                    code_offset=3,
                )

                # populate pool data
                self.pool_list.append(pool)

                self.pool_data[pool].decimals = decimals
                self.pool_data[pool].coins = _coins
                self.pool_data[pool].implementation = pool_implementation

                # add coins to market:
                self._add_coins_to_market(_coins[0], _coins[1], pool)

                log TwocryptoPoolDeployed(
                    pool,
                    _name,
                    _symbol,
                    _coins,
                    _math_implementation,
                    _salt,
                    precisions,
                    packed_gamma_A,
                    packed_fee_params,
                    packed_rebalancing_params,
                    initial_price,
                    msg.sender,
                )

                return pool
            ```


    === "Example"

        ```shell
        >>> Factory.deploy_pool(
            _name: CRV/ETH,
            _symbol: crv-eth,
            _coins: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', '0xD533a949740bb3306d119CC777fa900bA034cd52',
            implementation_id: 0,
            A: 2700000,
            gamma: 1300000000000,
            mid_fee: 2999999,
            out_fee: 80000000,
            fee_gamma: 350000000000000,
            allowed_extra_profit: 100000000000,
            adjustment_step: 100000000000,
            ma_exp_time: 600,
            initial_prices: 0.00023684735380012821,
            )

        'returns address of the deployed pool'
        ```



### `deploy_gauge`
!!! description "`Factory.deploy_gauge(_pool: address) -> address:`"

    !!!warning
        Deploying a liquidity gauge through the Factory is only possible on Ethereum Mainnet. Gauge deployments on sidechains must be done via the [`RootChainGaugeFactory`](../../liquidity-gauges-and-minting-crv/xchain-gauges/RootGaugeFactory.md).

    Function to deploy a liquidity gauge on Ethereum mainnet. This function can only be used on pools deployed from this Factory contract.

    Returns: deployed gauge (`address`).

    Emits: `LiquidityGaugeDeployed`

    | Input      | Type      | Description |
    | ---------- | --------- | ----------- |
    | `_pool`    | `address` | Pool to deploy a gauge for |

    ??? quote "Source code"

        === "CurveTwocryptoFactory.vy"

            ```vyper
            event LiquidityGaugeDeployed:
                pool: address
                gauge: address

            @external
            def deploy_gauge(_pool: address) -> address:
                """
                @notice Deploy a liquidity gauge for a factory pool
                @param _pool Factory pool address to deploy a gauge for
                @return Address of the deployed gauge
                """
                assert self.pool_data[_pool].coins[0] != empty(address), "Unknown pool"
                assert self.pool_data[_pool].liquidity_gauge == empty(address), "Gauge already deployed"
                assert self.gauge_implementation != empty(address), "Gauge implementation not set"

                gauge: address = create_from_blueprint(self.gauge_implementation, _pool, code_offset=3)
                self.pool_data[_pool].liquidity_gauge = gauge

                log LiquidityGaugeDeployed(_pool, gauge)
                return gauge
            ```

    === "Example"

        ```shell
        >>> Factory.deploy_gauge('pool address')

        'returns address of the deployed gauge'
        ```
