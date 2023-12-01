Implementations are represented by **blueprint contracts** from which pools and gauges are created. For more information regarding blueprint contracts, check [ERC-5202](https://eips.ethereum.org/EIPS/eip-5202).


!!!deploy "Contract Source & Deployment"
    **TricryptoFactory** contract is deployed to the Ethereum mainnet at: [0x0c0e5f2fF0ff18a3be9b835635039256dC4B4963](https://etherscan.io/address/0x0c0e5f2fF0ff18a3be9b835635039256dC4B4963).
    Source code for this contract is available on [Github](https://github.com/curvefi/tricrypto-ng/blob/main/contracts/main/CurveTricryptoFactory.vy). 


??? quote "TricryptoFactory.deploy_pool()"

    ```vyper hl_lines="2 87 88 89 90 91 92 93 94 95 96 97 98 99 100 101 102 103 104"
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


The TricryptoFactory utilizes four different implementations:

- **`pool_implementation`** containing multiple blueprint contracts which are utilized to deploy the pools
- **`gauge_implementation`** containing a blueprint contract which is utilized when deploying gauges for pools
- **`views_implementation`** containing a view methods contract relevant for integrators and users looking to interact with the AMMs 
- **`math_implementation`** containing math functions used in the AMM

*More on the [**Math Implementation**](../utility_contracts/math.md) and [**Views Implementation**](../utility_contracts/ViewMethodContract.md).*


## **Query Implementations**

### `pool_implementation`
!!! description "`Factory.pool_implementation(arg0: uint256) -> address: view`"

    Getter for the current pool implementation contract. hashamp because two-coin and three-pool pools?

    Returns: pool blueprint contract (`address`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `arg0` |  `uint256` | index |

    ??? quote "Source code"

        ```vyper
        pool_implementations: public(HashMap[uint256, address])
        ```

    === "Example"

        ```shell
        >>> Factory.pool_implementation(0)
        '0x66442B0C5260B92cAa9c234ECf2408CBf6b19a6f'
        ```


### `gauge_implementation`
!!! description "`Factory.gauge_implementation() -> address: view`"

    Getter for the current gauge implementation contract.

    Returns: gauge blueprint contract (`address`).

    ??? quote "Source code"

        ```vyper
        gauge_implementation: public(address)
        ```

    === "Example"

        ```shell
        >>> Factory.gauge_implementation()
        '0x5fC124a161d888893529f67580ef94C2784e9233'
        ```


### `views_implementation`
!!! description "`Factory.views_implementation() -> address: view`"

    Getter for the current views implementation contract.

    Returns: views blueprint contract (`address`).

    ??? quote "Source code"

        ```vyper
        views_implementation: public(address)
        ```

    === "Example"

        ```shell
        >>> Factory.views_implementation()
        '0x064253915b8449fdEFac2c4A74aA9fdF56691a31'
        ```


### `math_implementation`
!!! description "`Factory.math_implementation() -> address: view`"

    Getter for the current pool implementation contract.

    Returns: math blueprint contract (`address`).

    ??? quote "Source code"

        ```vyper
        math_implementation: public(address)
        ```

    === "Example"

        ```shell
        >>> Factory.math_implementation()
        '0xcBFf3004a20dBfE2731543AA38599A526e0fD6eE'
        ```



## **Changing Implementations** 

These implementations can be changed by the `admin` of the contract, which is the DAO.

### `set_pool_implementation`
!!! description "`Factory.set_pool_implementation(_pool_implementation: address, _implementation_index: uint256):`"

    !!!guard "Guarded Method"
        This function is only callable by the `admin` of the contract.

    Function to set a `_pool_implementation` for `_implementation_index`. Index for the pool implementation is needed as there can be multiple different versions of pools (two-coin and three-coin).

    Emits event: `UpdatePoolImplementation`

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_pool_implementation` |  `address` | pool blueprint contract |
    | `_implementation_index` |  `uint256` | index |

    ??? quote "Source code"

        ```vyper
        event UpdatePoolImplementation:
            _implemention_id: uint256
            _old_pool_implementation: address
            _new_pool_implementation: address

        pool_implementations: public(HashMap[uint256, address])

        @external
        def set_pool_implementation(
            _pool_implementation: address, _implementation_index: uint256
        ):
            """
            @notice Set pool implementation
            @dev Set to empty(address) to prevent deployment of new pools
            @param _pool_implementation Address of the new pool implementation
            @param _implementation_index Index of the pool implementation
            """
            assert msg.sender == self.admin, "dev: admin only"

            log UpdatePoolImplementation(
                _implementation_index,
                self.pool_implementations[_implementation_index],
                _pool_implementation
            )

            self.pool_implementations[_implementation_index] = _pool_implementation
        ```

    === "Example"
        ```shell
        >>> Factory.set_pool_implementation("todo")
        'todo'
        ```


### `set_gauge_implementation`
!!! description "`Factory.set_gauge_implementation(_gauge_implementation: address):`"

    !!!guard "Guarded Method"
        This function is only callable by the `admin` of the contract.

    Function to set a new `_gauge_implementation`.

    Emits event: `UpdateGaugeImplementation`

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_gauge_implementation` |  `address` | gauge blueprint contract |

    ??? quote "Source code"

        ```vyper
        event UpdateGaugeImplementation:
            _old_gauge_implementation: address
            _new_gauge_implementation: address

        gauge_implementation: public(address)

        @external
        def set_gauge_implementation(_gauge_implementation: address):
            """
            @notice Set gauge implementation
            @dev Set to empty(address) to prevent deployment of new gauges
            @param _gauge_implementation Address of the new token implementation
            """
            assert msg.sender == self.admin, "dev: admin only"

            log UpdateGaugeImplementation(self.gauge_implementation, _gauge_implementation)
            self.gauge_implementation = _gauge_implementation
        ```

    === "Example"
        ```shell
        >>> Factory.set_gauge_implementation("todo")
        'todo'
        ```


### `set_views_implementation`
!!! description "`Factory.set_views_implementation(_views_implementation: address):`"

    !!!guard "Guarded Method"
        This function is only callable by the `admin` of the contract.

    Function to set a new `_views_implementation`.

    Emits event: `UpdateViewsImplementation`

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_views_implementation` |  `address` | views blueprint contract |

    ??? quote "Source code"

        ```vyper
        event UpdateViewsImplementation:
            _old_views_implementation: address
            _new_views_implementation: address

        views_implementation: public(address)

        @external
        def set_views_implementation(_views_implementation: address):
            """
            @notice Set views contract implementation
            @param _views_implementation Address of the new views contract
            """
            assert msg.sender == self.admin,  "dev: admin only"

            log UpdateViewsImplementation(self.views_implementation, _views_implementation)
            self.views_implementation = _views_implementation
        ```

    === "Example"
        ```shell
        >>> Factory.set_views_implementation("todo")
        'todo'
        ```


### `set_math_implementation`
!!! description "`Factory.set_math_implementation(_math_implementation: address):`"

    !!!guard "Guarded Method"
        This function is only callable by the `admin` of the contract.

    Function to set a new `_math_implementation`.

    Emits event: `UpdateMathImplementation`

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_math_implementation` |  `address` | math blueprint contract |

    ??? quote "Source code"

        ```vyper
        event UpdateMathImplementation:
            _old_math_implementation: address
            _new_math_implementation: address

        math_implementation: public(address)

        @external
        def set_math_implementation(_math_implementation: address):
            """
            @notice Set math implementation
            @param _math_implementation Address of the new math contract
            """
            assert msg.sender == self.admin, "dev: admin only"

            log UpdateMathImplementation(self.math_implementation, _math_implementation)
            self.math_implementation = _math_implementation
        ```

    === "Example"
        ```shell
        >>> Factory.set_math_implementation("todo")
        'todo'
        ```
    