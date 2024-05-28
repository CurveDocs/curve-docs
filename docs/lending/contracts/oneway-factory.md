<h1>OneWay Lending Factory</h1>

A one-way lending market is a **non-rehypothecating** market where one token is considered the collateral token and another token is the borrow token. This means the **deposited collateral cannot be lent out** but can only be used as collateral. 

!!!github "GitHub"
    The source code of the `OneWayLendingFactory.vy` contract can be found on [:material-github: GitHub](https://github.com/curvefi/curve-stablecoin/blob/lending/contracts/lending/OneWayLendingFactory.vy).

*Later on, two-way lending markets will be established, allowing the collateral provided to be lent out and used as liquidity to borrow.*


---


## **Creating Lending Markets**

A lending market **must always include crvUSD, either as collateral or as the borrowable token**.

*There are two ways to create lending markets:*

- **`create`**: This method involves creating a vault and its accompanying contracts using an **external user-supplied price oracle**.
- **`create_from_pool`**: This method involves creating a vault and its accompanying contracts using an **existing oraclized Curve pool as a price oracle**.

!!!info "Finding Optimal Parameters"
    To find optimal values for the parameters, check out: https://github.com/curvefi/llamma-simulator.

    *Regarding rates:* Minimum and maximum borrow rates for lending markets default to `min_default_borrow_rate` and `max_default_borrow_rate` if input values for `min_borrow_rate` and `max_borrow_rate` are set to zero. If custom values are used, they need to be within the range of `MIN_RATE` and `MAX_RATE`.


### `create`
!!! description "`OneWayLendingVaultFactory.create(borrowed_token: address, collateral_token: address, A: uint256, fee: uint256, loan_discount: uint256, liquidation_discount: uint256, price_oracle: address, name: String[64], min_borrow_rate: uint256 = 0, max_borrow_rate: uint256 = 0) -> Vault:`"

    Function to create a new vault using a user-supplied price oracle contract. 

    Returns: vault (`address`).

    Emits: `NewVault`

    | Input                  | Type          | Description |
    |------------------------|---------------|-------------|
    | `borrowed_token`       | `address`     | Token which is being borrowed. |
    | `collateral_token`     | `address`     | Token used as collateral. |
    | `A`                    | `uint256`     | Amplification coefficient. Band size is ~1/A. |
    | `fee`                  | `uint256`     | Fee for swaps in the AMM. |
    | `loan_discount`        | `uint256`     | Maximum discount. LTV = sqrt(((A - 1) / A) ** 4) - loan_discount. |
    | `liquidation_discount` | `uint256`     | Liquidation discount. LT = sqrt(((A - 1) / A) ** 4) - liquidation_discount |
    | `price_oracle`         | `address`     | Custom price oracle contract. |
    | `name`                 | `String[64]`  | Name of the vault. |
    | `min_borrow_rate`      | `uint256`     | Custom minimum borrow rate; if not set will default to `min_default_borrow_rate` |
    | `max_borrow_rate`      | `uint256`     | Custom maximum borrow rate; if not set will default to `max_default_borrow_rate` |

    ??? quote "Source code"

        === "OneWayLendingVaultFactory.vy"

            ```vyper
            event NewVault:
                id: indexed(uint256)
                collateral_token: indexed(address)
                borrowed_token: indexed(address)
                vault: address
                controller: address
                amm: address
                price_oracle: address
                monetary_policy: address

            @external
            @nonreentrant('lock')
            def create(
                    borrowed_token: address,
                    collateral_token: address,
                    A: uint256,
                    fee: uint256,
                    loan_discount: uint256,
                    liquidation_discount: uint256,
                    price_oracle: address,
                    name: String[64],
                    min_borrow_rate: uint256 = 0,
                    max_borrow_rate: uint256 = 0
                ) -> Vault:
                """
                @notice Creation of the vault using user-supplied price oracle contract
                @param borrowed_token Token which is being borrowed
                @param collateral_token Token used for collateral
                @param A Amplification coefficient: band size is ~1/A
                @param fee Fee for swaps in AMM (for ETH markets found to be 0.6%)
                @param loan_discount Maximum discount. LTV = sqrt(((A - 1) / A) ** 4) - loan_discount
                @param liquidation_discount Liquidation discount. LT = sqrt(((A - 1) / A) ** 4) - liquidation_discount
                @param price_oracle Custom price oracle contract
                @param name Human-readable market name
                @param min_borrow_rate Custom minimum borrow rate (otherwise min_default_borrow_rate)
                @param max_borrow_rate Custom maximum borrow rate (otherwise max_default_borrow_rate)
                """
                return self._create(borrowed_token, collateral_token, A, fee, loan_discount, liquidation_discount,
                                    price_oracle, name, min_borrow_rate, max_borrow_rate)

            @internal
            def _create(
                    borrowed_token: address,
                    collateral_token: address,
                    A: uint256,
                    fee: uint256,
                    loan_discount: uint256,
                    liquidation_discount: uint256,
                    price_oracle: address,
                    name: String[64],
                    min_borrow_rate: uint256,
                    max_borrow_rate: uint256
                ) -> Vault:
                """
                @notice Internal method for creation of the vault
                """
                assert borrowed_token != collateral_token, "Same token"
                assert borrowed_token == STABLECOIN or collateral_token == STABLECOIN
                vault: Vault = Vault(create_minimal_proxy_to(self.vault_impl))

                min_rate: uint256 = self.min_default_borrow_rate
                max_rate: uint256 = self.max_default_borrow_rate
                if min_borrow_rate > 0:
                    min_rate = min_borrow_rate
                if max_borrow_rate > 0:
                    max_rate = max_borrow_rate
                assert min_rate >= MIN_RATE and max_rate <= MAX_RATE and min_rate <= max_rate, "Wrong rates"
                monetary_policy: address = create_from_blueprint(
                    self.monetary_policy_impl, borrowed_token, min_rate, max_rate, code_offset=3)

                controller: address = empty(address)
                amm: address = empty(address)
                controller, amm = vault.initialize(
                    self.amm_impl, self.controller_impl,
                    borrowed_token, collateral_token,
                    A, fee,
                    price_oracle,
                    monetary_policy,
                    loan_discount, liquidation_discount
                )

                market_count: uint256 = self.market_count
                log NewVault(market_count, collateral_token, borrowed_token, vault.address, controller, amm, price_oracle, monetary_policy)
                self.vaults[market_count] = vault
                self.amms[market_count] = AMM(amm)
                self._vaults_index[vault] = market_count + 2**128
                self.names[market_count] = name

                self.market_count = market_count + 1

                token: address = borrowed_token
                if borrowed_token == STABLECOIN:
                    token = collateral_token
                market_count = self.token_market_count[token]
                self.token_to_vaults[token][market_count] = vault
                self.token_market_count[token] = market_count + 1

                ERC20(borrowed_token).approve(amm, max_value(uint256))
                ERC20(collateral_token).approve(amm, max_value(uint256))

                return vault
            ```

    === "Example"
        ```shell
        >>> OneWayLendingVaultFactory.create(
                "0xf939e0a03fb07f59a73314e73794be0e57ac1b4e",       # borrowed_token
                "0x8f22779662ad253844013d8e99eccb4d80e31417",       # collateral_token
                50,                                                 # A
                6000000000000000,                                   # fee
                140000000000000016,                                 # loan_discount
                110000000000000000,                                 # liquidation_discount
                external price oracle,                              # price_oracle
                "bobrCRV-long",                                     # name
                0,                                                  # min_borrow_rate
                1)                                                  # max_borrow_rate

        '0xE16D806c4198955534d4EB10E4861Ea94557602E'                # returns address of the created vault
        ```


### `create_from_pool`
!!! description "`OneWayLendingVaultFactory.create(borrowed_token: address, collateral_token: address, A: uint256, fee: uint256, loan_discount: uint256, liquidation_discount: uint256, price_oracle: address, name: String[64], min_borrow_rate: uint256 = 0, max_borrow_rate: uint256 = 0) -> Vault:`"

    !!!warning "Valid Pool Oracles"
        Only oracles from stableswap-ng, twocrypto-ng, and tricrypto-ng pools are valid. Oracles from other pools may not be manipulation resistant and therefore should not be used.

    Function to create a new vault using a existing oraclized Curve pool as the price oracle. 

    Returns: vault (`address`).

    Emits: `NewVault`

    | Input                  | Type          | Description |
    |------------------------|---------------|-------------|
    | `borrowed_token`       | `address`     | Token which is being borrowed. |
    | `collateral_token`     | `address`     | Token used as collateral. |
    | `A`                    | `uint256`     | Amplification coefficient. Band size is ~1/A. |
    | `fee`                  | `uint256`     | Fee for swaps in the AMM. |
    | `loan_discount`        | `uint256`     | Maximum discount. LTV = sqrt(((A - 1) / A) ** 4) - loan_discount. |
    | `liquidation_discount` | `uint256`     | Liquidation discount. LT = sqrt(((A - 1) / A) ** 4) - liquidation_discount |
    | `pool`                 | `address`     | Curve tricrypto-ng, twocrypto-ng or stableswap-ng pool which has non-manipulatable `price_oracle()`. Must contain both collateral_token and borrowed_token. |
    | `name`                 | `String[64]`  | Name of the vault. |
    | `min_borrow_rate`      | `uint256`     | Custom minimum borrow rate; if not set will default to `min_default_borrow_rate` |
    | `max_borrow_rate`      | `uint256`     | Custom maximum borrow rate; if not set will default to `max_default_borrow_rate` |

    ??? quote "Source code"

        === "OneWayLendingVaultFactory.vy"

            ```vyper
            event NewVault:
                id: indexed(uint256)
                collateral_token: indexed(address)
                borrowed_token: indexed(address)
                vault: address
                controller: address
                amm: address
                price_oracle: address
                monetary_policy: address

            @external
            @nonreentrant('lock')
            def create_from_pool(
                    borrowed_token: address,
                    collateral_token: address,
                    A: uint256,
                    fee: uint256,
                    loan_discount: uint256,
                    liquidation_discount: uint256,
                    pool: address,
                    name: String[64],
                    min_borrow_rate: uint256 = 0,
                    max_borrow_rate: uint256 = 0
                ) -> Vault:
                """
                @notice Creation of the vault using existing oraclized Curve pool as a price oracle
                @param borrowed_token Token which is being borrowed
                @param collateral_token Token used for collateral
                @param A Amplification coefficient: band size is ~1/A
                @param fee Fee for swaps in AMM (for ETH markets found to be 0.6%)
                @param loan_discount Maximum discount. LTV = sqrt(((A - 1) / A) ** 4) - loan_discount
                @param liquidation_discount Liquidation discount. LT = sqrt(((A - 1) / A) ** 4) - liquidation_discount
                @param pool Curve tricrypto-ng, twocrypto-ng or stableswap-ng pool which has non-manipulatable price_oracle().
                            Must contain both collateral_token and borrowed_token.
                @param name Human-readable market name
                @param min_borrow_rate Custom minimum borrow rate (otherwise min_default_borrow_rate)
                @param max_borrow_rate Custom maximum borrow rate (otherwise max_default_borrow_rate)
                """
                # Find coins in the pool
                borrowed_ix: uint256 = 100
                collateral_ix: uint256 = 100
                N: uint256 = 0
                for i in range(10):
                    success: bool = False
                    res: Bytes[32] = empty(Bytes[32])
                    success, res = raw_call(
                        pool,
                        _abi_encode(i, method_id=method_id("coins(uint256)")),
                        max_outsize=32, is_static_call=True, revert_on_failure=False)
                    coin: address = convert(res, address)
                    if not success or coin == empty(address):
                        break
                    N += 1
                    if coin == borrowed_token:
                        borrowed_ix = i
                    elif coin == collateral_token:
                        collateral_ix = i
                if collateral_ix == 100 or borrowed_ix == 100:
                    raise "Tokens not in pool"
                price_oracle: address = create_from_blueprint(
                    self.pool_price_oracle_impl, pool, N, borrowed_ix, collateral_ix, code_offset=3)

                return self._create(borrowed_token, collateral_token, A, fee, loan_discount, liquidation_discount,
                                    price_oracle, name, min_borrow_rate, max_borrow_rate)

            @internal
            def _create(
                    borrowed_token: address,
                    collateral_token: address,
                    A: uint256,
                    fee: uint256,
                    loan_discount: uint256,
                    liquidation_discount: uint256,
                    price_oracle: address,
                    name: String[64],
                    min_borrow_rate: uint256,
                    max_borrow_rate: uint256
                ) -> Vault:
                """
                @notice Internal method for creation of the vault
                """
                assert borrowed_token != collateral_token, "Same token"
                assert borrowed_token == STABLECOIN or collateral_token == STABLECOIN
                vault: Vault = Vault(create_minimal_proxy_to(self.vault_impl))

                min_rate: uint256 = self.min_default_borrow_rate
                max_rate: uint256 = self.max_default_borrow_rate
                if min_borrow_rate > 0:
                    min_rate = min_borrow_rate
                if max_borrow_rate > 0:
                    max_rate = max_borrow_rate
                assert min_rate >= MIN_RATE and max_rate <= MAX_RATE and min_rate <= max_rate, "Wrong rates"
                monetary_policy: address = create_from_blueprint(
                    self.monetary_policy_impl, borrowed_token, min_rate, max_rate, code_offset=3)

                controller: address = empty(address)
                amm: address = empty(address)
                controller, amm = vault.initialize(
                    self.amm_impl, self.controller_impl,
                    borrowed_token, collateral_token,
                    A, fee,
                    price_oracle,
                    monetary_policy,
                    loan_discount, liquidation_discount
                )

                market_count: uint256 = self.market_count
                log NewVault(market_count, collateral_token, borrowed_token, vault.address, controller, amm, price_oracle, monetary_policy)
                self.vaults[market_count] = vault
                self.amms[market_count] = AMM(amm)
                self._vaults_index[vault] = market_count + 2**128
                self.names[market_count] = name

                self.market_count = market_count + 1

                token: address = borrowed_token
                if borrowed_token == STABLECOIN:
                    token = collateral_token
                market_count = self.token_market_count[token]
                self.token_to_vaults[token][market_count] = vault
                self.token_market_count[token] = market_count + 1

                ERC20(borrowed_token).approve(amm, max_value(uint256))
                ERC20(collateral_token).approve(amm, max_value(uint256))

                return vault
            ```

    === "Example"
        ```shell
        >>> OneWayLendingVaultFactory.create_from_pool(
                "0xf939e0a03fb07f59a73314e73794be0e57ac1b4e",       # borrowed_token
                "0x8f22779662ad253844013d8e99eccb4d80e31417",       # collateral_token
                50,                                                 # A
                6000000000000000,                                   # fee
                140000000000000016,                                 # loan_discount
                110000000000000000,                                 # liquidation_discount
                "0x9fee65d5a627e73212989c8bbedc5fa5cae3821f",       # pool to use oracle from
                "bobrCRV-long",                                     # name
                0,                                                  # min_borrow_rate
                1)                                                  # max_borrow_rate

        '0xE16D806c4198955534d4EB10E4861Ea94557602E'                # returns address of the created vault
        ```



## **Deploying Gauges**

Just like pools, vaults can have liquidity gauges. Once they are added to the `GaugeController` by the DAO, they are eligible to receive CRV emissions.


### `deploy_gauge`
!!! description "`OneWayLendingVaultFactory.deploy_gauge(_vault: Vault) -> address:`"

    Function to deploy a liquidity gauge for a vault.

    Returns: gauge (`address`).

    Emits: `LiquidityGaugeDeployed`

    | Input    | Type      | Description                           |
    |----------|-----------|---------------------------------------|
    | `_vault` | `address` | Vault address to deploy the gauge for.|


    ??? quote "Source code"

        === "OneWayLendingVaultFactory.vy"

            ```vyper
            event LiquidityGaugeDeployed:
                vault: address
                gauge: address

            @external
            def deploy_gauge(_vault: Vault) -> address:
                """
                @notice Deploy a liquidity gauge for a vault
                @param _vault Vault address to deploy a gauge for
                @return Address of the deployed gauge
                """
                ix: uint256 = self._vaults_index[_vault]
                assert ix != 0, "Unknown vault"
                ix -= 2**128
                assert self.gauges[ix] == empty(address), "Gauge already deployed"
                implementation: address = self.gauge_impl
                assert implementation != empty(address), "Gauge implementation not set"

                gauge: address = create_from_blueprint(implementation, _vault, code_offset=3)
                self.gauges[ix] = gauge

                log LiquidityGaugeDeployed(_vault.address, gauge)
                return gauge
            ```

    === "Example"
        ```shell
        In  [1]: OneWayLendingVaultFactory.deploy_gauge("0xE16D806c4198955534d4EB10E4861Ea94557602E")
        Out [1]: '0xACEBA186aDF691245dfb20365B48DB87DEA7b98F'                # returns address of deployed gauge
        ``` 


---


## **Rates**

The Factory has a `MIN_RATE` and `MAX_RATE`. These variables are constants and can not be changed. The minimum rate is 0.1%, the maximum rate is 1000%.

Additionally, the Factory has two variables, `min_default_borrow_rate` and `max_default_borrow_rate`, which are used as default values when creating new lending markets.  
If no value is given when deploying a new market, the default rates are applied. Default rates can be changed by the `admin` via the `set_default_rates` method. 

**Rates are denominated in seconds and have a base unit of 1e18**. 

*To get the annualized value, do:*

$$\text{Annualized Rate} = \text{rate} \times 86400 \times  365$$

!!!colab "Google Colab Notebook"
    A notebook on how to change default borrow rates and how to calculate annualized rates can be found here: [https://colab.research.google.com/drive/1mQV5yDyBqZrVSIOweP2g1Qu3WWjsgZtv?usp=sharing](https://colab.research.google.com/drive/1mQV5yDyBqZrVSIOweP2g1Qu3WWjsgZtv?usp=sharing).


### `MIN_RATE`
!!! description "`OneWayLendingVaultFactory.MIN_RATE() -> uint256: view`"

    Getter for the minimum rate a one-way lending vault can have. This variable is a constant and can therefore not be changed.

    Returns: minimum rate (`uint256`).

    ??? quote "Source code"

        === "OneWayLendingVaultFactory.vy"

            ```vyper
            MIN_RATE: public(constant(uint256)) = 10**15 / (365 * 86400)  # 0.1%
            ```

    === "Example"
        ```shell
        In  [1]:  OneWayLendingVaultFactory.MIN_RATE()
        Out [1]:  31709791        # 0.1%
        ```


### `MAX_RATE`
!!! description "`OneWayLendingVaultFactory.MAX_RATE() -> uint256: view`"

    Getter for the maximum rate a one-way lending vault can have. This variable is a constant and can therefore not be changed.

    Returns: maximum rate (`uint256`).

    ??? quote "Source code"

        === "OneWayLendingVaultFactory.vy"

            ```vyper
            MAX_RATE: public(constant(uint256)) = 10**19 / (365 * 86400)  # 1000%
            ```

    === "Example"
        ```shell
        In  [1]:  OneWayLendingVaultFactory.MAX_RATE()
        Out [1]:  317097919837    # 1000%
        ```


### `min_default_borrow_rate`
!!! description "`OneWayLendingVaultFactory.min_default_borrow_rate() -> uint256: view`"

    Getter for the minimum default borrow rate which is used when creating a new vault. The minimum borrow rate is charged when the utilization is 0. This parameter can be changed via the `set_default_rates` function.

    Returns: minimum default borrow rate (`uint256`).

    ??? quote "Source code"

        === "OneWayLendingVaultFactory.vy"

            ```vyper
            min_default_borrow_rate: public(uint256)

            @external
            @nonreentrant('lock')
            def set_default_rates(min_rate: uint256, max_rate: uint256):
                """
                @notice Change min and max default borrow rates for creating new markets
                @param min_rate Minimal borrow rate (0 utilization)
                @param max_rate Maxumum borrow rate (100% utilization)
                """
                assert msg.sender == self.admin

                assert min_rate >= MIN_RATE
                assert max_rate <= MAX_RATE
                assert max_rate >= min_rate

                self.min_default_borrow_rate = min_rate
                self.max_default_borrow_rate = max_rate

                log SetDefaultRates(min_rate, max_rate)
            ```

    === "Example"
        ```shell
        In  [1]:  OneWayLendingVaultFactory.min_default_borrow_rate()
        Out [1]:  158548959       # 0.5%
        ```


### `max_default_borrow_rate`
!!! description "`OneWayLendingVaultFactory.max_default_borrow_rate() -> uint256: view`"

    Getter for the maximum default borrow rate which is used when creating a new vault. The maximum borrow rate is charged when the utilization is 100%. This parameter can be changed via the `set_default_rates` function.

    Returns: maximum default borrow rate (`uint256`).

    ??? quote "Source code"

        === "OneWayLendingVaultFactory.vy"

            ```vyper
            max_default_borrow_rate: public(uint256)

            @external
            @nonreentrant('lock')
            def set_default_rates(min_rate: uint256, max_rate: uint256):
                """
                @notice Change min and max default borrow rates for creating new markets
                @param min_rate Minimal borrow rate (0 utilization)
                @param max_rate Maxumum borrow rate (100% utilization)
                """
                assert msg.sender == self.admin

                assert min_rate >= MIN_RATE
                assert max_rate <= MAX_RATE
                assert max_rate >= min_rate

                self.min_default_borrow_rate = min_rate
                self.max_default_borrow_rate = max_rate

                log SetDefaultRates(min_rate, max_rate)
            ```

    === "Example"
        ```shell
        In  [1]:  OneWayLendingVaultFactory.max_default_borrow_rate()
        Out [1]:  15854895991     # 50%
        ```


### `set_default_rates`
!!! description "`OneWayLendingVaultFactory.set_default_rates(min_rate: uint256, max_rate: uint256):`"

    !!!guard "Guarded Method"
        This function is only callable by the `admin` of the contract.

    Function to set new values for the maximum (`max_default_borrow_rate`) and minimum (`min_default_borrow_rate`) default borrow rates.

    Emits: `SetDefaultRates`

    | Input      | Type       | Description                      |
    | ---------- | ---------- | -------------------------------- |
    | `min_rate` |  `uint256` | New minimum default borrow rate. |
    | `max_rate` |  `uint256` | New maximum default borrow rate. |

    ??? quote "Source code"

        === "OneWayLendingVaultFactory.vy"

            ```vyper
            event SetDefaultRates:
                min_rate: uint256
                max_rate: uint256

            min_default_borrow_rate: public(uint256)
            max_default_borrow_rate: public(uint256)

            @external
            @nonreentrant('lock')
            def set_default_rates(min_rate: uint256, max_rate: uint256):
                """
                @notice Change min and max default borrow rates for creating new markets
                @param min_rate Minimal borrow rate (0 utilization)
                @param max_rate Maxumum borrow rate (100% utilization)
                """
                assert msg.sender == self.admin

                assert min_rate >= MIN_RATE
                assert max_rate <= MAX_RATE
                assert max_rate >= min_rate

                self.min_default_borrow_rate = min_rate
                self.max_default_borrow_rate = max_rate

                log SetDefaultRates(min_rate, max_rate)
            ```

    === "Example"
        ```shell
        In  [1]:  OneWayLendingVaultFactory.min_default_borrow_rate()
        Out [1]:  158548959
        
        In  [2]:  OneWayLendingVaultFactory.max_default_borrow_rate()
        Out [2]:  15854895991

        In  [3]:  OneWayLendingVaultFactory.set_default_rates(168548959, 16854895991)

        In  [4]:  OneWayLendingVaultFactory.min_default_borrow_rate()
        Out [4]:  168548959

        In  [5]:  OneWayLendingVaultFactory.max_default_borrow_rate()
        Out [5]:  16854895991
        ```


---


## **Implementations**

The implementations of the Factory can be upgraded by the `admin`, which is the Curve DAO. 

!!!colab "Google Colab Notebook"
    A notebook on how to change implementations using the `set_implementations` function can be found here: [https://colab.research.google.com/drive/1r3Vhb28Wy8iX_YRBNpfnwjzS4dKuMADf?usp=sharing](https://colab.research.google.com/drive/1r3Vhb28Wy8iX_YRBNpfnwjzS4dKuMADf?usp=sharing)


### `controller_impl`
!!! description "`OneWayLendingVaultFactory.controller_impl() -> address: view`"

    Getter for the controller implementation.

    Returns: controller implementation (`address`).

    ??? quote "Source code"

        === "OneWayLendingVaultFactory.vy"

            ```vyper
            controller_impl: public(address)
            ```

    === "Example"
        ```shell
        In  [1]:  OneWayLendingVaultFactory.controller_impl()
        Out [1]:  '0x5473B1BcBbC45d38d8fBb50a18a73aFb8B0637A7'
        ```


### `amm_impl`
!!! description "`OneWayLendingVaultFactory.amm_impl() -> address: view`"

    Getter for the amm implementation.

    Returns: amm implementation (`address`).

    ??? quote "Source code"

        === "OneWayLendingVaultFactory.vy"

            ```vyper
            amm_impl: public(address)
            ```

    === "Example"
        ```shell
        In  [1]:  OneWayLendingVaultFactory.amm_impl()
        Out [1]:  '0x4f37395BdFbE3A0dca124ad3C9DbFe6A6cbc31D6'
        ```


### `vault_imp`
!!! description "`OneWayLendingVaultFactory.vault_imp() -> address: view`"

    Getter for the vault implementation.

    Returns: vault implementation (`address`).

    ??? quote "Source code"

        === "OneWayLendingVaultFactory.vy"

            ```vyper
            vault_impl: public(address)
            ```

    === "Example"
        ```shell
        In  [1]:  OneWayLendingVaultFactory.vault_imp()
        Out [1]:  '0x596F8E49acE6fC8e09B561972360DC216f1c2A1f'
        ```


### `pool_price_oracle_impl`
!!! description "`OneWayLendingVaultFactory.pool_price_oracle_impl() -> address: view`"

    Getter for the price oracle implementation when creating lending markets from pools.

    Returns: pool price oracle implementation (`address`).

    ??? quote "Source code"

        === "OneWayLendingVaultFactory.vy"

            ```vyper
            pool_price_oracle_impl: public(address)
            ```

    === "Example"
        ```shell
        In  [1]:  OneWayLendingVaultFactory.pool_price_oracle_impl()
        Out [1]:  '0x9164e210d123e6566DaF113136a73684C4AB01e2'
        ```


### `monetary_policy_impl`
!!! description "`OneWayLendingVaultFactory.monetary_policy_impl() -> address: view`"

    Getter for the monetary policy implementation.

    Returns: monetary policy implementation (`address`).

    ??? quote "Source code"

        === "OneWayLendingVaultFactory.vy"

            ```vyper
            monetary_policy_impl: public(address)
            ```

    === "Example"
        ```shell
        In  [1]:  OneWayLendingVaultFactory.monetary_policy_impl()
        Out [1]:  '0xa7E98815c0193E01165720C3abea43B885ae67FD'
        ```


### `gauge_impl`
!!! description "`OneWayLendingVaultFactory.gauge_impl() -> address: view`"

    Getter for the gauge implementation.

    Returns: gauge implementation (`address`).

    ??? quote "Source code"

        === "OneWayLendingVaultFactory.vy"

            ```vyper
            gauge_impl: public(address)
            ```

    === "Example"
        ```shell
        In  [1]:  OneWayLendingVaultFactory.gauge_impl()
        Out [1]:  '0x00B71A425Db7C8B65a46CF39c23A188e10A2DE99'
        ```


### `set_implementations`
!!! description "`OneWayLendingVaultFactory.set_implementations(controller: address, amm: address, vault: address, pool_price_oracle: address, monetary_policy: address, gauge: address):`"

    !!!guard "Guarded Method"
        This function is only callable by the `admin` of the contract.

    Function to set new implementations. If a certain implementation should not be changed, `ZER0_ADDRESS` can be used as a placeholder.

    Emits: `SetImplementations`

    | Input               | Type      | Description |
    | ------------------- | --------- | ----------- |
    | `controller`        | `address` | New controller implementation. |
    | `amm`               | `address` | New amm implementation. |
    | `vault`             | `address` | New vault implementation. |
    | `pool_price_oracle` | `address` | New pool price oracle implementation. |
    | `monetary_policy`   | `address` | New monetary policy implementation. |
    | `gauge`             | `address` | New gauge implementation. |

    ??? quote "Source code"

        === "OneWayLendingVaultFactory.vy"

            ```vyper
            event SetImplementations:
                amm: address
                controller: address
                vault: address
                price_oracle: address
                monetary_policy: address
                gauge: address

            # Implementations which can be changed by governance
            amm_impl: public(address)
            controller_impl: public(address)
            vault_impl: public(address)
            pool_price_oracle_impl: public(address)
            monetary_policy_impl: public(address)
            gauge_impl: public(address)

            @external
            @nonreentrant('lock')
            def set_implementations(controller: address, amm: address, vault: address,
                                    pool_price_oracle: address, monetary_policy: address, gauge: address):
                """
                @notice Set new implementations (blueprints) for controller, amm, vault, pool price oracle and monetary polcy.
                        Doesn't change existing ones
                @param controller Address of the controller blueprint
                @param amm Address of the AMM blueprint
                @param vault Address of the Vault template
                @param pool_price_oracle Address of the pool price oracle blueprint
                @param monetary_policy Address of the monetary policy blueprint
                @param gauge Address for gauge implementation blueprint
                """
                assert msg.sender == self.admin

                if controller != empty(address):
                    self.controller_impl = controller
                if amm != empty(address):
                    self.amm_impl = amm
                if vault != empty(address):
                    self.vault_impl = vault
                if pool_price_oracle != empty(address):
                    self.pool_price_oracle_impl = pool_price_oracle
                if monetary_policy != empty(address):
                    self.monetary_policy_impl = monetary_policy
                if gauge != empty(address):
                    self.gauge_impl = gauge

                log SetImplementations(amm, controller, vault, pool_price_oracle, monetary_policy, gauge)
            ```

    === "Example"
        ```shell
        >>> soon
        ```


---



## **Contract Ownership**

The Factory contract is owned by the DAO ([CurveOwnershipAdmin](https://etherscan.io/address/0x40907540d8a6C65c637785e8f8B742ae6b0b9968)). Ownership can be transferred using the `set_admin` function.


### `admin`
!!! description "`OneWayLendingVaultFactory.admin -> address: view`"

    Getter for the admin of the Factory.

    Returns: admin (`address`).

    ??? quote "Source code"

        === "OneWayLendingVaultFactory.vy"

            ```vyper
            admin: public(address)
            ```

    === "Example"
        ```shell
        In  [1]:  OneWayLendingVaultFactory.admin()
        Out [1]:  '0x40907540d8a6C65c637785e8f8B742ae6b0b9968'
        ```


### `set_admin`
!!! description "`OneWayLendingVaultFactory.set_admin(admin: address):`"

    !!!guard "Guarded Method"
        This function is only callable by the `admin` of the contract.

    Function to change the contract ownership by setting a new admin.

    Emits: `SetAdmin`

    | Input      | Type   | Description |
    | ---------- | ------ | ----------- |
    | `admin` |  `address` | New admin address.   |

    ??? quote "Source code"

        === "OneWayLendingVaultFactory.vy"

            ```vyper
            event SetAdmin:
                admin: address

            admin: public(address)

            @external
            @nonreentrant('lock')
            def set_admin(admin: address):
                """
                @notice Set admin of the factory (should end up with DAO)
                @param admin Address of the admin
                """
                assert msg.sender == self.admin
                self.admin = admin
                log SetAdmin(admin)
            ```

    === "Example"
        ```shell
        In  [1]:  OneWayLendingVaultFactory.admin()
        Out [1]:  '0x40907540d8a6C65c637785e8f8B742ae6b0b9968'

        In  [2]:  OneWayLendingVaultFactory.set_admin("0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045")

        In  [3]:  OneWayLendingVaultFactory.admin()
        Out [3]:  '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'
        ```



---



## **Contract Info Methods**

Most informations are queried based on vault indices. The first deployed vault is vault index 0, second one index 1, etc.

*To get the index of a certain vault:*

```shell
>>> OneWayLendingVaultFactory.vaults_index("0x67A18c18709C09D48000B321c6E1cb09F7181211")
1
```

### `vaults_index`
!!! description "`OneWayLendingVaultFactory.vaults_index(vault: Vault) -> uint256:`"

    Getter for the vault index within the factory by using the vault address.

    Returns: vault index (`uint256`)

    | Input      | Type   | Description |
    | ---------- | ------ | ----------- |
    | `vault` |  `address` | Vault address to get the index for.  |

    ??? quote "Source code"

        === "OneWayLendingVaultFactory.vy"

            ```vyper
            _vaults_index: HashMap[Vault, uint256]

            @view
            @external
            def vaults_index(vault: Vault) -> uint256:
                return self._vaults_index[vault] - 2**128
            ```

    === "Example"
        ```shell
        In  [1]:  OneWayLendingVaultFactory.vaults_index('0x67A18c18709C09D48000B321c6E1cb09F7181211')
        Out [1]:  1
        ```


### `vaults`
!!! description "`OneWayLendingVaultFactory.vaults(arg0: uint256): view`"

    Getter for the vault at index `arg0`.

    Returns: vault (`address`).

    | Input | Type     | Description    |
    |-------|----------|----------------|
    | `n`   | `uint256` | Vault index. |

    ??? quote "Source code"

        === "OneWayLendingVaultFactory.vy"

            ```vyper
            vaults: public(Vault[10**18])
            ```

    === "Example"
        ```shell
        In  [1]:  OneWayLendingVaultFactory.vaults(0)
        Out [1]:  '0xE21C518a09b26Bf65B16767B97249385f12780d9'

        In  [2]:  OneWayLendingVaultFactory.vaults(0)
        Out [2]:  '0x67A18c18709C09D48000B321c6E1cb09F7181211'
        ```


### `controllers`
!!! description "`OneWayLendingVaultFactory.controllers(n: uint256) -> address: view`"

    Getter for the controller of the vault at index `n`. This variable holds all controllers of vaults deployed through this factory.

    Returns: controller (`address`).

    | Input | Type     | Description   |
    |-------|----------|---------------|
    | `n`   | `uint256` | Vault index. |

    ??? quote "Source code"

        === "OneWayLendingVaultFactory.vy"

            ```vyper
            interface Vault:
                def amm() -> address: view

            vaults: public(Vault[10**18])

            @view
            @external
            def controllers(n: uint256) -> address:
                return self.vaults[n].controller()
            ```

    === "Example"
        ```shell
        In  [1]:  OneWayLendingVaultFactory.controllers(0)
        Out [1]:  '0x5E657c5227A596a860621C5551c9735d8f4A8BE3'

        In  [2]:  OneWayLendingVaultFactory.controllers(1)
        Out [2]:  '0x7443944962D04720f8c220C0D25f56F869d6EfD4'
        ```


### `amms`
!!! description "`OneWayLendingVaultFactory.amms(n: uint256) -> address: view`"

    Getter for the AMM of the vault at index `n`. This variable holds all AMMs of vaults deployed through this factory.

    Returns: AMM (`address`).

    | Input | Type     | Description   |
    |-------|----------|---------------|
    | `n`   | `uint256` | Vault index. |

    ??? quote "Source code"

        === "OneWayLendingVaultFactory.vy"

            ```vyper
            amms: public(AMM[10**18])
            ```

    === "Example"
        ```shell
        In  [1]:  OneWayLendingVaultFactory.amms(0)
        Out [1]:  '0x0167B8a9A3959E698A3e3BCaFe829878FfB709e3'

        In  [2]:  OneWayLendingVaultFactory.amms(1)
        Out [2]:  '0xafC1ab86045Cb2a07C23399dbE64b56D1B8B3239'
        ```



### `borrowed_tokens`
!!! description "`OneWayLendingVaultFactory.borrowed_tokens(n: uint256) -> address::`"

    Getter for the borrow token for the vault at index `n`. This variable holds all borrowable tokens of vaults deployed through this factory.

    Returns: borrowable token (`address`).

    | Input | Type     | Description   |
    |-------|----------|---------------|
    | `n`   | `uint256` | Vault index. |

    ??? quote "Source code"

        === "OneWayLendingVaultFactory.vy"

            ```vyper
            interface Vault:
                def borrowed_token() -> address: view

            vaults: public(Vault[10**18])

            @view
            @external
            def borrowed_tokens(n: uint256) -> address:
                return self.vaults[n].borrowed_token()
            ```

    === "Example"
        ```shell
        In  [1]:  OneWayLendingVaultFactory.borrowed_tokens(0)
        Out [1]:  '0xf939E0A03FB07F59A73314E73794Be0E57ac1b4E'

        In  [2]:  OneWayLendingVaultFactory.borrowed_tokens(2)
        Out [2]:  '0xD533a949740bb3306d119CC777fa900bA034cd52'
        ```


### `collateral_tokens`
!!! description "`OneWayLendingVaultFactory.collateral_tokens(n: uint256) -> address::`"

    Getter for the collateral token for the vault at index `n`. This variable holds all collateral tokens of vaults deployed through this factory.

    Returns: borrowable token (`address`).

    | Input | Type     | Description   |
    |-------|----------|---------------|
    | `n`   | `uint256` | Vault index. |

    ??? quote "Source code"

        === "OneWayLendingVaultFactory.vy"

            ```vyper
            interface Vault:
                def collateral_token() -> address: view

            vaults: public(Vault[10**18])

            @view
            @external
            def collateral_tokens(n: uint256) -> address:
                return self.vaults[n].collateral_token()
            ```

    === "Example"
        ```shell
        In  [1]:  OneWayLendingVaultFactory.collateral_tokens(0)
        Out [1]:  '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0'

        In  [2]:  OneWayLendingVaultFactory.collateral_tokens(1)
        Out [2]:  '0xD533a949740bb3306d119CC777fa900bA034cd52'
        ```


### `price_oracles`
!!! description "`OneWayLendingVaultFactory.price_oracles(n: uint256) -> address::`"

    Getter for the price oracle contracts for the vault at index `n`. This variable holds all price oracles of vaults deployed through this factory.

    Returns: price oracle (`address`).

    | Input | Type     | Description   |
    |-------|----------|---------------|
    | `n`   | `uint256` | Vault index. |


    ??? quote "Source code"

        === "OneWayLendingVaultFactory.vy"

            ```vyper
            interface Vault:
                def price_oracle() -> address: view

            vaults: public(Vault[10**18])

            @view
            @external
            def price_oracles(n: uint256) -> address:
                return self.vaults[n].price_oracle()
            ```

    === "Example"
        ```shell
        In  [1]:  OneWayLendingVaultFactory.price_oracles(0)
        Out [1]:  '0xDf1B41413EafcCfC6E98BB905feaeB271d307aF3'

        In  [2]:  OneWayLendingVaultFactory.price_oracles(1)
        Out [2]:  '0xc17B0451E6d8C0f71297d0f174590632BE81163c'
        ```


### `monetary_policies`
!!! description "`OneWayLendingVaultFactory.monetary_policies(n: uint256) -> address::`"

    Getter for the monetary policy contracts for the vault at index `n`. This variable holds all monetary policies of vaults deployed through this factory.

    Returns: monetary policy (`address`).

    | Input | Type     | Description   |
    |-------|----------|---------------|
    | `n`   | `uint256` | Vault index. |

    ??? quote "Source code"

        === "OneWayLendingVaultFactory.vy"

            ```vyper
            interface Vault:
                def controller() -> address: view

            interface Controller:
                def monetary_policy() -> address: view

            vaults: public(Vault[10**18])

            @view
            @external
            def monetary_policies(n: uint256) -> address:
                return Controller(self.vaults[n].controller()).monetary_policy()
            ```

    === "Example"
        ```shell
        In  [1]:  OneWayLendingVaultFactory.monetary_policies(0)
        Out [1]:  '0xfd8eF79883815D6771FC986D43E3Dce60ea33726'

        In  [2]:  OneWayLendingVaultFactory.monetary_policies(1)
        Out [2]:  '0x5c79C4cFE9D77B3d2385E119fADb4F8ff8c08294'
        ```


### `gauge_for_vault`
!!! description "`OneWayLendingVaultFactory.gauge_for_vault(_vault: Vault) -> address:`"

    Getter for the liquidity gauge of `vault`.

    Returns: gauge (`address`).

    | Input    | Type      | Description                           |
    |----------|-----------|---------------------------------------|
    | `_vault` | `address` | Vault address to get the gauge for. |


    ??? quote "Source code"

        === "OneWayLendingVaultFactory.vy"

            ```vyper
            _vaults_index: HashMap[Vault, uint256]

            gauges: public(address[10**18])

            @view
            @external
            def gauge_for_vault(_vault: Vault) -> address:
                return self.gauges[self._vaults_index[_vault] - 2**128]
            ```

    === "Example"
        ```shell
        In  [1]:  OneWayLendingVaultFactory.gauge_for_vault("0x67A18c18709C09D48000B321c6E1cb09F7181211")
        Out [1]:  '0xAA90BE8bd52aeA49314dFc6e385e21A4e9c4ea0c'
        ```


### `coins`
!!! description "`OneWayLendingVaultFactory.coins(vault_id: uint256) -> address[2]: view`"

    Getter for the borrow and collateral token of `vault_id`.

    Returns: borrow and collateral token (`address[2]`).

    | Input | Type     | Description   |
    |-------|----------|---------------|
    | `vault_id`   | `uint256` | Vault index. |

    ??? quote "Source code"

        === "OneWayLendingVaultFactory.vy"

            ```vyper
            interface Vault:
                def borrowed_token() -> address: view
                def collateral_token() -> address: view

            vaults: public(Vault[10**18])

            @external
            @view
            def coins(vault_id: uint256) -> address[2]:
                vault: Vault = self.vaults[vault_id]
                return [vault.borrowed_token(), vault.collateral_token()]
            ```

    === "Example"
        ```shell
        In  [1]:  OneWayLendingVaultFactory.coins(1)
        Out [1]:  [Address('0xf939E0A03FB07F59A73314E73794Be0E57ac1b4E'),
                   Address('0xD533a949740bb3306d119CC777fa900bA034cd52')]
        ```


### `STABLECOIN`
!!! description "`OneWayLendingVaultFactory.STABLECOIN() -> address: view:`"

    Getter for the crvUSD token. Only crvUSD-containing lending vaults are possible.

    Returns: crvUSD (`address`).

    ??? quote "Source code"

        === "OneWayLendingVaultFactory.vy"

            ```vyper
            STABLECOIN: public(immutable(address))

            @external
            def __init__(
                    stablecoin: address,
                    amm: address,
                    controller: address,
                    vault: address,
                    pool_price_oracle: address,
                    monetary_policy: address,
                    gauge: address,
                    admin: address):
                """
                @notice Factory which creates one-way lending vaults (e.g. collateral is non-borrowable)
                @param stablecoin Address of crvUSD. Only crvUSD-containing markets are allowed
                @param amm Address of AMM implementation
                @param controller Address of Controller implementation
                @param pool_price_oracle Address of implementation for price oracle factory (prices from pools)
                @param monetary_policy Address for implementation of monetary policy
                @param gauge Address for gauge implementation
                @param admin Admin address (DAO)
                """
                STABLECOIN = stablecoin
                ...
            ```

    === "Example"
        ```shell
        In  [1]:  OneWayLendingVaultFactory.STABLECOIN()
        Out [1]:  '0xf939E0A03FB07F59A73314E73794Be0E57ac1b4E'
        ```


### `market_count`
!!! description "`OneWayLendingVaultFactory.():`"

    Getter for the total market count. This value represents the total number of lending vaults created through this factory. This value is incremented by 1 whenever the internal `_create` function is called.

    Returns: market count (`uint256`).

    ??? quote "Source code"

        === "OneWayLendingVaultFactory.vy"

            ```vyper
            market_count: public(uint256)

            @internal
            def _create(
                    borrowed_token: address,
                    collateral_token: address,
                    A: uint256,
                    fee: uint256,
                    loan_discount: uint256,
                    liquidation_discount: uint256,
                    price_oracle: address,
                    name: String[64],
                    min_borrow_rate: uint256,
                    max_borrow_rate: uint256
                ) -> Vault:
                """
                @notice Internal method for creation of the vault
                """
                ...
                market_count: uint256 = self.market_count
                self.market_count = market_count + 1
                ...
            ```

    === "Example"
        ```shell
        In  [1]:  OneWayLendingVaultFactory.market_count()
        Out [1]:  3
        ```


### `token_to_vaults`
!!! description "`OneWayLendingVaultFactory.token_to_vaults(arg0: address, arg1: uint256) -> address: view`"

    Getter for the vault at index `arg1` which includes coin `arg0`.

    Returns: vault (`address`).

    | Input | Type     | Description   |
    |-------|----------|---------------|
    | `arg0`| `address` | Token address.|
    | `arg1`| `uint256` | Vault index.  |

    ??? quote "Source code"

        === "OneWayLendingVaultFactory.vy"

            ```vyper
            token_to_vaults: public(HashMap[address, Vault[10**18]])
            ```

    === "Example"
        ```shell
        In  [1]:  OneWayLendingVaultFactory.token_to_vaults("0xD533a949740bb3306d119CC777fa900bA034cd52", 0)
        Out [1]:  '0x67A18c18709C09D48000B321c6E1cb09F7181211'

        In  [2]:  OneWayLendingVaultFactory.token_to_vaults("0xD533a949740bb3306d119CC777fa900bA034cd52", 1)
        Out [2]:  '0x044aC5160e5A04E09EBAE06D786fc151F2BA5ceD'
        ```


### `token_market_count`
!!! description "`OneWayLendingVaultFactory.token_market_count(arg0: address) -> uint256: view`"

    Getter for the amount of markets coin `arg0` is in.

    Returns: number of markets (`uint256`).

    | Input | Type     | Description   |
    |-------|----------|---------------|
    | `arg0`| `address` | Token address.|

    ??? quote "Source code"

        === "OneWayLendingVaultFactory.vy"

            ```vyper
            token_market_count: public(HashMap[address, uint256])

            @internal
            def _create(
                    borrowed_token: address,
                    collateral_token: address,
                    A: uint256,
                    fee: uint256,
                    loan_discount: uint256,
                    liquidation_discount: uint256,
                    price_oracle: address,
                    name: String[64],
                    min_borrow_rate: uint256,
                    max_borrow_rate: uint256
                ) -> Vault:
                """
                @notice Internal method for creation of the vault
                """
                ...
                token: address = borrowed_token
                if borrowed_token == STABLECOIN:
                    token = collateral_token
                market_count = self.token_market_count[token]
                self.token_to_vaults[token][market_count] = vault
                self.token_market_count[token] = market_count + 1
                ...
            ```

    === "Example"
        ```shell
        In  [1]:  OneWayLendingVaultFactory.token_market_count("0xD533a949740bb3306d119CC777fa900bA034cd52")
        Out [1]:  2

        In  [2]:  OneWayLendingVaultFactory.token_market_count("0xf939E0A03FB07F59A73314E73794Be0E57ac1b4E")
        Out [2]:  0     # market count of crvusd will always return 0, because the token is included in every vault (market)
        ```


### `gauges`
!!! description "`OneWayLendingVaultFactory.gauges(arg0: uint256) -> address: view`"

    Getter for the gauge of the vault at index `arg0`.

    Returns: gauge (`address`).

    | Input | Type     | Description  |
    |-------|----------|--------------|
    | `arg0`| `uint256` | Vault index. |

    ??? quote "Source code"

        === "OneWayLendingVaultFactory.vy"

            ```vyper
            gauges: public(address[10**18])
            ```

    === "Example"
        ```shell
        In  [1]:  OneWayLendingVaultFactory.gauges(0)
        Out [1]:  '0x3742aCa9ad8655d2d3eab5569eF1BdB4C5d52e5D'
        ```


### `names`
!!! description "`OneWayLendingVaultFactory.names(arg0: uint256) -> String[64]: view`"

    Getter for the name of the vault at index `arg0`.

    Returns: name (`String[64]`).

    | Input | Type     | Description  |
    |-------|----------|--------------|
    | `arg0`| `uint256` | Vault index. |

    ??? quote "Source code"

        === "OneWayLendingVaultFactory.vy"

            ```vyper
            names: public(HashMap[uint256, String[64]])
            ```

    === "Example"
        ```shell
        In  [1]:  OneWayLendingVaultFactory.names(0)
        Out [1]:  'wstETH-long'

        In  [2]:  OneWayLendingVaultFactory.names(1)
        Out [2]:  'CRV-long'
        ```