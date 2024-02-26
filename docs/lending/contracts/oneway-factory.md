<h1>OneWay Lending Factory</h1>


todo:
- change python back to vyper


## **Creating Lending Markets**

*There are two ways to create lending markets:*

- **`create`**: This method involves creating a vault and its accompanying contracts using an **external user-supplied price oracle**.
- **`create_from_pool`**: This method involves creating a vault and its accompanying contracts using an **existing oraclized Curve pool as a price oracle**.


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

            ```python
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
        >>> soon
        ```


### `create_from_pool`
!!! description "`OneWayLendingVaultFactory.create(borrowed_token: address, collateral_token: address, A: uint256, fee: uint256, loan_discount: uint256, liquidation_discount: uint256, price_oracle: address, name: String[64], min_borrow_rate: uint256 = 0, max_borrow_rate: uint256 = 0) -> Vault:`"

    Function to create a new vault using a existing oraclized Curve pool as a price oracle.

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

            ```python
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
                if N == 2:
                    assert Pool(pool).price_oracle() > 0, "Pool has no oracle"
                else:
                    assert Pool(pool).price_oracle(0) > 0, "Pool has no oracle"
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
        >>> soon
        ```


## **Deploying Gauges**

Vaults can have liquidity gauges. Once they are added to the GaugeController by the DAO, they are eligible to receive CRV emissions.


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

            ```python
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
        >>> soon
        ```


---


## **Implementations**

The implementations of the Factory can be governed by the DAO; they are upgradable.


### `set_implementations`
!!! description "`OneWayLendingVaultFactory.set_implementations(controller: address, amm: address, vault: address, pool_price_oracle: address, monetary_policy: address, gauge: address):`"

    !!!guard "Guarded Method"
        This function is only callable by the `admin` of the contract.

    Function to set new implementations.

    Emits: `SetImplementations`

    | Input               | Type      | Description |
    | ------------------- | --------- | ----------- |
    | `controller`        | `address` | New controller implementation. |
    | `amm`               | `address` | New amm implementation. |
    | `vault`             | `address` | New vault implementation. |
    | `pool_price_oracle` | `address` | New pool price oracle implementation. |
    | `monetary_policy`   | `address` | New monetary policy implementation. |

    ??? quote "Source code"

        === "OneWayLendingVaultFactory.vy"

            ```python
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


### `controller_impl`
!!! description "`OneWayLendingVaultFactory.controller_impl() -> address: view`"

    Getter for the controller implementation.

    Returns: controller implementation (`address`).

    ??? quote "Source code"

        === "OneWayLendingVaultFactory.vy"

            ```python
            controller_impl: public(address)
            ```

    === "Example"
        ```shell
        >>> OneWayLendingVaultFactory.controller_impl():
        '0x5473B1BcBbC45d38d8fBb50a18a73aFb8B0637A7'
        ```


### `amm_impl`
!!! description "`OneWayLendingVaultFactory.amm_impl() -> address: view`"

    Getter for the amm implementation.

    Returns: amm implementation (`address`).

    ??? quote "Source code"

        === "OneWayLendingVaultFactory.vy"

            ```python
            amm_impl: public(address)
            ```

    === "Example"
        ```shell
        >>> OneWayLendingVaultFactory.amm_impl():
        '0x4f37395BdFbE3A0dca124ad3C9DbFe6A6cbc31D6'
        ```


### `vault_imp`
!!! description "`OneWayLendingVaultFactory.vault_imp() -> address: view`"

    Getter for the vault implementation.

    Returns: vault implementation (`address`).

    ??? quote "Source code"

        === "OneWayLendingVaultFactory.vy"

            ```python
            vault_impl: public(address)
            ```

    === "Example"
        ```shell
        >>> OneWayLendingVaultFactory.vault_imp():
        '0x596F8E49acE6fC8e09B561972360DC216f1c2A1f'
        ```


### `pool_price_oracle_impl`
!!! description "`OneWayLendingVaultFactory.pool_price_oracle_impl() -> address: view`"

    Getter for the pool price oracle implementation.

    Returns: pool price oracle implementation (`address`).

    ??? quote "Source code"

        === "OneWayLendingVaultFactory.vy"

            ```python
            pool_price_oracle_impl: public(address)
            ```

    === "Example"
        ```shell
        >>> OneWayLendingVaultFactory.pool_price_oracle_impl():
        '0x9164e210d123e6566DaF113136a73684C4AB01e2'
        ```


### `monetary_policy_impl`
!!! description "`OneWayLendingVaultFactory.monetary_policy_impl() -> address: view`"

    Getter for the monetary policy implementation.

    Returns: monetary policy implementation (`address`).

    ??? quote "Source code"

        === "OneWayLendingVaultFactory.vy"

            ```python
            monetary_policy_impl: public(address)
            ```

    === "Example"
        ```shell
        >>> OneWayLendingVaultFactory.monetary_policy_impl():
        '0xa7E98815c0193E01165720C3abea43B885ae67FD'
        ```


### `gauge_impl`
!!! description "`OneWayLendingVaultFactory.gauge_impl() -> address: view`"

    Getter for the gauge implementation.

    Returns: gauge implementation (`address`).

    ??? quote "Source code"

        === "OneWayLendingVaultFactory.vy"

            ```python
            gauge_impl: public(address)
            ```

    === "Example"
        ```shell
        >>> OneWayLendingVaultFactory.gauge_impl():
        '0x00B71A425Db7C8B65a46CF39c23A188e10A2DE99'
        ```


---


## **Rates**

The Factory has a `MIN_RATE` and `MAX_RATE`. These variables are constants and can not be changed. The minimum rate is 0.1%, the maximum rate is 1000%.

Additionally, the Factory has two variables, `min_default_borrow_rate` and `max_default_borrow_rate`, which are used as default values when creating new lending markets. If no value is given when deploying a new market, the default rates are applied. Theses default rates can be changed by the `admin`. 


Rate values are given per second. To get the annualized value, do: 

$$\text{Annualized Rate} = \text{Rate per second} \times 60 \times 60 \times 24 \times 365$$


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
        >>> OneWayLendingVaultFactory.MIN_RATE():
        31709791        # 0.1%
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
        >>> OneWayLendingVaultFactory.MAX_RATE():
        317097919837    # 1000%
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
        >>> OneWayLendingVaultFactory.min_default_borrow_rate():
        158548959       # 5%
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
        >>> OneWayLendingVaultFactory.max_default_borrow_rate():
        15854895991     # 500%
        ```


### `set_default_rates`
!!! description "`OneWayLendingVault.set_default_rates(min_rate: uint256, max_rate: uint256):`"

    !!!guard "Guarded Method"
        This function is only callable by the `admin` of the contract.

    Function to set new values for the maximum (`max_default_borrow_rate`) and minimum (`min_default_borrow_rate`) default borrow rates.

    Emits: `SetDefaultRates`

    | Input      | Type       | Description |
    | ---------- | ---------- | ----------- |
    | `min_rate` |  `uint256` | Minimum borrow rate. |
    | `max_rate` |  `uint256` | Maximum borrow rate. |


    ??? quote "Source code"

        === "OneWayLendingVault.vy"

            ```python
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
        >>> soon
        ```

---


## **AMM Exchange Methods**

The Factory contract uses interfaces to enable calling AMM exchange methods directly through this contract. 

```vyper
interface AMM:
    def get_dy(i: uint256, j: uint256, in_amount: uint256) -> uint256: view
    def get_dx(i: uint256, j: uint256, out_amount: uint256) -> uint256: view
    def get_dydx(i: uint256, j: uint256, out_amount: uint256) -> (uint256, uint256): view
    def exchange(i: uint256, j: uint256, in_amount: uint256, min_amount: uint256, _for: address) -> uint256[2]: nonpayable
    def exchange_dy(i: uint256, j: uint256, out_amount: uint256, max_amount: uint256, _for: address) -> uint256[2]: nonpayable
```


### `exchange`
!!! description "`OneWayLendingVaultFactory.exchange(vault_id: uint256, i: uint256, j: uint256, amount: uint256, min_out: uint256, receiver: address = msg.sender) -> uint256[2]::`"

    Function to perform a token exchange of an `amount` of coin `i` for coin `j` within `vault_id's` AMM. The minimum output is set via `min_out`.

    Returns: Input and output amounts (`uint256[2]`).

    Emits: `TokenExchange` and `Transfer`.

    | Input       | Type       | Description                                                                 |
    |-------------|------------|-----------------------------------------------------------------------------|
    | `vault_id`  | `uint256`  | Vault ID (AMM) to exchange within. Based on `amms(vault_id)`.               |
    | `i`         | `uint256`  | Input coin.                                                                 |
    | `j`         | `uint256`  | Output coin.                                                                |
    | `amount`    | `uint256`  | Amount of the input token to exchange.                                      |
    | `min_out`   | `uint256`  | Minimum amount of the output token to be received.                          |
    | `receiver`  | `address`  | Receiver of the token exchange. Defaults to `msg.sender`.                   |

    ??? quote "Source code"

        === "OneWayLendingVaultFactory.vy"

            ```python
            interface AMM:
                def exchange(i: uint256, j: uint256, in_amount: uint256, min_amount: uint256, _for: address) -> uint256[2]: nonpayable

            amms: public(AMM[10**18])

            @external
            @nonreentrant('lock')
            def exchange(vault_id: uint256, i: uint256, j: uint256, amount: uint256, min_out: uint256, receiver: address = msg.sender) -> uint256[2]:
                vault: Vault = self.vaults[vault_id]
                self.transfer_in(vault, i, msg.sender, amount)
                return self.amms[vault_id].exchange(i, j, amount, min_out, receiver)

            @internal
            def transfer_in(vault: Vault, i: uint256, _from: address, amount: uint256):
                token: ERC20 = empty(ERC20)
                if i == 0:
                    token = ERC20(vault.borrowed_token())
                else:
                    token = ERC20(vault.collateral_token())
                if amount > 0:
                    assert token.transferFrom(_from, self, amount, default_return_value=True)
            ```

        === "AMM.vy"

            ```python
            event TokenExchange:
                buyer: indexed(address)
                sold_id: uint256
                tokens_sold: uint256
                bought_id: uint256
                tokens_bought: uint256

            @external
            @nonreentrant('lock')
            def exchange(i: uint256, j: uint256, in_amount: uint256, min_amount: uint256, _for: address = msg.sender) -> uint256[2]:
                """
                @notice Exchanges two coins, callable by anyone
                @param i Input coin index
                @param j Output coin index
                @param in_amount Amount of input coin to swap
                @param min_amount Minimal amount to get as output
                @param _for Address to send coins to
                @return Amount of coins given in/out
                """
                return self._exchange(i, j, in_amount, min_amount, _for, True)

            @internal
            def _exchange(i: uint256, j: uint256, amount: uint256, minmax_amount: uint256, _for: address, use_in_amount: bool) -> uint256[2]:
                """
                @notice Exchanges two coins, callable by anyone
                @param i Input coin index
                @param j Output coin index
                @param amount Amount of input/output coin to swap
                @param minmax_amount Minimal/maximum amount to get as output/input
                @param _for Address to send coins to
                @param use_in_amount Whether input or output amount is specified
                @return Amount of coins given in and out
                """
                assert (i == 0 and j == 1) or (i == 1 and j == 0), "Wrong index"
                p_o: uint256[2] = self._price_oracle_w()  # Let's update the oracle even if we exchange 0
                if amount == 0:
                    return [0, 0]

                lm: LMGauge = self.liquidity_mining_callback
                collateral_shares: DynArray[uint256, MAX_TICKS_UINT] = []

                in_coin: ERC20 = BORROWED_TOKEN
                out_coin: ERC20 = COLLATERAL_TOKEN
                in_precision: uint256 = BORROWED_PRECISION
                out_precision: uint256 = COLLATERAL_PRECISION
                if i == 1:
                    in_precision = out_precision
                    in_coin = out_coin
                    out_precision = BORROWED_PRECISION
                    out_coin = BORROWED_TOKEN

                out: DetailedTrade = empty(DetailedTrade)
                if use_in_amount:
                    out = self.calc_swap_out(i == 0, amount * in_precision, p_o, in_precision, out_precision)
                else:
                    amount_to_swap: uint256 = max_value(uint256)
                    if amount < amount_to_swap:
                        amount_to_swap = amount * out_precision
                    out = self.calc_swap_in(i == 0, amount_to_swap, p_o, in_precision, out_precision)
                in_amount_done: uint256 = unsafe_div(out.in_amount, in_precision)
                out_amount_done: uint256 = unsafe_div(out.out_amount, out_precision)
                if use_in_amount:
                    assert out_amount_done >= minmax_amount, "Slippage"
                else:
                    assert in_amount_done <= minmax_amount and (out_amount_done == amount or amount == max_value(uint256)), "Slippage"
                if out_amount_done == 0 or in_amount_done == 0:
                    return [0, 0]

                out.admin_fee = unsafe_div(out.admin_fee, in_precision)
                if i == 0:
                    self.admin_fees_x += out.admin_fee
                else:
                    self.admin_fees_y += out.admin_fee

                n: int256 = min(out.n1, out.n2)
                n_start: int256 = n
                n_diff: int256 = abs(unsafe_sub(out.n2, out.n1))

                for k in range(MAX_TICKS):
                    x: uint256 = 0
                    y: uint256 = 0
                    if i == 0:
                        x = out.ticks_in[k]
                        if n == out.n2:
                            y = out.last_tick_j
                    else:
                        y = out.ticks_in[unsafe_sub(n_diff, k)]
                        if n == out.n2:
                            x = out.last_tick_j
                    self.bands_x[n] = x
                    self.bands_y[n] = y
                    if lm.address != empty(address):
                        s: uint256 = 0
                        if y > 0:
                            s = unsafe_div(y * 10**18, self.total_shares[n])
                        collateral_shares.append(s)
                    if k == n_diff:
                        break
                    n = unsafe_add(n, 1)

                self.active_band = out.n2

                log TokenExchange(_for, i, in_amount_done, j, out_amount_done)

                if lm.address != empty(address):
                    lm.callback_collateral_shares(n_start, collateral_shares)

                assert in_coin.transferFrom(msg.sender, self, in_amount_done, default_return_value=True)
                assert out_coin.transfer(_for, out_amount_done, default_return_value=True)

                return [in_amount_done, out_amount_done]
            ```

    === "Example"
        ```shell
        >>> soon
        ```


### `exchange_dy`
!!! description "`OneWayLendingVaultFactory.exchange_dy(i: uint256, j: uint256, out_amount: uint256, max_amount: uint256, _for: address = msg.sender) -> uint256[2]::`"

    todo:

    Returns: in and out amopunt (`uint256`).

    Emits: `TokenExchange` and `Transfer`

    | Input       | Type       | Description                                                                 |
    |-------------|------------|-----------------------------------------------------------------------------|
    | `vault_id`  | `uint256`  | Vault ID (AMM) to exchange within. Based on `amms(vault_id)`.               |
    | `i`         | `uint256`  | Input coin.                                                                 |
    | `j`         | `uint256`  | Output coin.                                                                |
    | `amount`    | `uint256`  | Amount of the input token to exchange.                                      |
    | `min_out`   | `uint256`  | Minimum amount of the output token to be received.                          |
    | `receiver`  | `address`  | Receiver of the token exchange. Defaults to `msg.sender`.                   |


    ??? quote "Source code"

        === "OneWayLendingVaultFactory.vy"

            ```python
            interface AMM:
                def exchange_dy(i: uint256, j: uint256, out_amount: uint256, max_amount: uint256, _for: address) -> uint256[2]: nonpayable

            amms: public(AMM[10**18])

            @external
            @nonreentrant('lock')
            def exchange_dy(vault_id: uint256, i: uint256, j: uint256, amount: uint256, max_in: uint256, receiver: address = msg.sender) -> uint256[2]:
                vault: Vault = self.vaults[vault_id]
                self.transfer_in(vault, i, msg.sender, max_in)
                out_value: uint256[2] = self.amms[vault_id].exchange_dy(i, j, amount, max_in, receiver)
                self.transfer_out(vault, i, msg.sender)
                return out_value

            @internal
            def transfer_in(vault: Vault, i: uint256, _from: address, amount: uint256):
                token: ERC20 = empty(ERC20)
                if i == 0:
                    token = ERC20(vault.borrowed_token())
                else:
                    token = ERC20(vault.collateral_token())
                if amount > 0:
                    assert token.transferFrom(_from, self, amount, default_return_value=True)

            @internal
            def transfer_out(vault: Vault, i: uint256, _to: address):
                token: ERC20 = empty(ERC20)
                if i == 0:
                    token = ERC20(vault.borrowed_token())
                else:
                    token = ERC20(vault.collateral_token())
                amount: uint256 = token.balanceOf(self)
                if amount > 0:
                    assert token.transfer(_to, amount, default_return_value=True)
            ```

        === "AMM.vy"

            ```python
            event TokenExchange:
                buyer: indexed(address)
                sold_id: uint256
                tokens_sold: uint256
                bought_id: uint256
                tokens_bought: uint256

            @external
            @nonreentrant('lock')
            def exchange_dy(i: uint256, j: uint256, out_amount: uint256, max_amount: uint256, _for: address = msg.sender) -> uint256[2]:
                """
                @notice Exchanges two coins, callable by anyone
                @param i Input coin index
                @param j Output coin index
                @param out_amount Desired amount of output coin to receive
                @param max_amount Maximum amount to spend (revert if more)
                @param _for Address to send coins to
                @return Amount of coins given in/out
                """
                return self._exchange(i, j, out_amount, max_amount, _for, False)

            @internal
            def _exchange(i: uint256, j: uint256, amount: uint256, minmax_amount: uint256, _for: address, use_in_amount: bool) -> uint256[2]:
                """
                @notice Exchanges two coins, callable by anyone
                @param i Input coin index
                @param j Output coin index
                @param amount Amount of input/output coin to swap
                @param minmax_amount Minimal/maximum amount to get as output/input
                @param _for Address to send coins to
                @param use_in_amount Whether input or output amount is specified
                @return Amount of coins given in and out
                """
                assert (i == 0 and j == 1) or (i == 1 and j == 0), "Wrong index"
                p_o: uint256[2] = self._price_oracle_w()  # Let's update the oracle even if we exchange 0
                if amount == 0:
                    return [0, 0]

                lm: LMGauge = self.liquidity_mining_callback
                collateral_shares: DynArray[uint256, MAX_TICKS_UINT] = []

                in_coin: ERC20 = BORROWED_TOKEN
                out_coin: ERC20 = COLLATERAL_TOKEN
                in_precision: uint256 = BORROWED_PRECISION
                out_precision: uint256 = COLLATERAL_PRECISION
                if i == 1:
                    in_precision = out_precision
                    in_coin = out_coin
                    out_precision = BORROWED_PRECISION
                    out_coin = BORROWED_TOKEN

                out: DetailedTrade = empty(DetailedTrade)
                if use_in_amount:
                    out = self.calc_swap_out(i == 0, amount * in_precision, p_o, in_precision, out_precision)
                else:
                    amount_to_swap: uint256 = max_value(uint256)
                    if amount < amount_to_swap:
                        amount_to_swap = amount * out_precision
                    out = self.calc_swap_in(i == 0, amount_to_swap, p_o, in_precision, out_precision)
                in_amount_done: uint256 = unsafe_div(out.in_amount, in_precision)
                out_amount_done: uint256 = unsafe_div(out.out_amount, out_precision)
                if use_in_amount:
                    assert out_amount_done >= minmax_amount, "Slippage"
                else:
                    assert in_amount_done <= minmax_amount and (out_amount_done == amount or amount == max_value(uint256)), "Slippage"
                if out_amount_done == 0 or in_amount_done == 0:
                    return [0, 0]

                out.admin_fee = unsafe_div(out.admin_fee, in_precision)
                if i == 0:
                    self.admin_fees_x += out.admin_fee
                else:
                    self.admin_fees_y += out.admin_fee

                n: int256 = min(out.n1, out.n2)
                n_start: int256 = n
                n_diff: int256 = abs(unsafe_sub(out.n2, out.n1))

                for k in range(MAX_TICKS):
                    x: uint256 = 0
                    y: uint256 = 0
                    if i == 0:
                        x = out.ticks_in[k]
                        if n == out.n2:
                            y = out.last_tick_j
                    else:
                        y = out.ticks_in[unsafe_sub(n_diff, k)]
                        if n == out.n2:
                            x = out.last_tick_j
                    self.bands_x[n] = x
                    self.bands_y[n] = y
                    if lm.address != empty(address):
                        s: uint256 = 0
                        if y > 0:
                            s = unsafe_div(y * 10**18, self.total_shares[n])
                        collateral_shares.append(s)
                    if k == n_diff:
                        break
                    n = unsafe_add(n, 1)

                self.active_band = out.n2

                log TokenExchange(_for, i, in_amount_done, j, out_amount_done)

                if lm.address != empty(address):
                    lm.callback_collateral_shares(n_start, collateral_shares)

                assert in_coin.transferFrom(msg.sender, self, in_amount_done, default_return_value=True)
                assert out_coin.transfer(_for, out_amount_done, default_return_value=True)

                return [in_amount_done, out_amount_done]
            ```

    === "Example"
        ```shell
        >>> soon
        ```


### `get_dy`
!!! description "`OneWayLendingVaultFactory.get_dy(vault_id: uint256, i: uint256, j: uint256, amount: uint256) -> uint256::`"

    Function to calculate the amount of output coin `j` to be received when swapping in `amount` of input coin `i` using a certain vaults AMM (`vault_id`).

    Returns: dy (`uint256`).

    | Input      | Type      | Description    |
    |------------|-----------|----------------|
    | `vault_id` | `uint256` | Vault ID to use the AMM of.|
    | `i`        | `uint256` | Input coin.    |
    | `j`        | `uint256` | Output coin.   |
    | `amount`   | `uint256` | Amount to exchange.|

    ??? quote "Source code"

        === "OneWayLendingVaultFactory.vy"

            ```python
            interface AMM:
                def get_dy(i: uint256, j: uint256, in_amount: uint256) -> uint256: view

            amms: public(AMM[10**18])

            @external
            @view
            def get_dy(vault_id: uint256, i: uint256, j: uint256, amount: uint256) -> uint256:
                return self.amms[vault_id].get_dy(i, j, amount)
            ```

        === "AMM.vy"

            ```python
            struct DetailedTrade:
                in_amount: uint256
                out_amount: uint256
                n1: int256
                n2: int256
                ticks_in: DynArray[uint256, MAX_TICKS_UINT]
                last_tick_j: uint256
                admin_fee: uint256

            @external
            @view
            @nonreentrant('lock')
            def get_dy(i: uint256, j: uint256, in_amount: uint256) -> uint256:
                """
                @notice Method to use to calculate out amount
                @param i Input coin index
                @param j Output coin index
                @param in_amount Amount of input coin to swap
                @return Amount of coin j to give out
                """
                return self._get_dxdy(i, j, in_amount, True).out_amount

            @internal
            @view
            def _get_dxdy(i: uint256, j: uint256, amount: uint256, is_in: bool) -> DetailedTrade:
                """
                @notice Method to use to calculate out amount and spent in amount
                @param i Input coin index
                @param j Output coin index
                @param amount Amount of input or output coin to swap
                @param is_in Whether IN our OUT amount is known
                @return DetailedTrade with all swap results
                """
                # i = 0: borrowable (USD) in, collateral (ETH) out; going up
                # i = 1: collateral (ETH) in, borrowable (USD) out; going down
                assert (i == 0 and j == 1) or (i == 1 and j == 0), "Wrong index"
                out: DetailedTrade = empty(DetailedTrade)
                if amount == 0:
                    return out
                in_precision: uint256 = COLLATERAL_PRECISION
                out_precision: uint256 = BORROWED_PRECISION
                if i == 0:
                    in_precision = BORROWED_PRECISION
                    out_precision = COLLATERAL_PRECISION
                p_o: uint256[2] = self._price_oracle_ro()
                if is_in:
                    out = self.calc_swap_out(i == 0, amount * in_precision, p_o, in_precision, out_precision)
                else:
                    out = self.calc_swap_in(i == 0, amount * out_precision, p_o, in_precision, out_precision)
                out.in_amount = unsafe_div(out.in_amount, in_precision)
                out.out_amount = unsafe_div(out.out_amount, out_precision)
                return out
            ```

    === "Example"
        ```shell
        >>> soon
        ```


### `get_dx`
!!! description "`OneWayLendingVaultFactory.get_dx(vault_id: uint256, i: uint256, j: uint256, out_amount: uint256) -> uint256::`"

    Function to calculate the amount of input coin `i` to be swapped in, in order to receive `out_amount` of output coin `j` using a certain vault (`vault_id`).

    Returns: dx (`uint256`).

    | Input      | Type      | Description                      |
    |------------|-----------|----------------------------------|
    | `vault_id` | `uint256` | Vault ID to use the AMM of.      | 
    | `i`        | `uint256` | Input coin                       |
    | `j`        | `uint256` | Output coin                      |
    | `out_amount`| `uint256`| Amount of output coins to receive|


    ??? quote "Source code"

        === "OneWayLendingVaultFactory.vy"

            ```python
            interface AMM:
                def get_dx(i: uint256, j: uint256, out_amount: uint256) -> uint256: view

            amms: public(AMM[10**18])

            @external
            @view
            def get_dx(vault_id: uint256, i: uint256, j: uint256, out_amount: uint256) -> uint256:
                return self.amms[vault_id].get_dx(i, j, out_amount)
            ```

        === "AMM.vy"

            ```python
            struct DetailedTrade:
                in_amount: uint256
                out_amount: uint256
                n1: int256
                n2: int256
                ticks_in: DynArray[uint256, MAX_TICKS_UINT]
                last_tick_j: uint256
                admin_fee: uint256

            @external
            @view
            @nonreentrant('lock')
            def get_dx(i: uint256, j: uint256, out_amount: uint256) -> uint256:
                """
                @notice Method to use to calculate in amount required to receive the desired out_amount
                @param i Input coin index
                @param j Output coin index
                @param out_amount Desired amount of output coin to receive
                @return Amount of coin i to spend
                """
                # i = 0: borrowable (USD) in, collateral (ETH) out; going up
                # i = 1: collateral (ETH) in, borrowable (USD) out; going down
                trade: DetailedTrade = self._get_dxdy(i, j, out_amount, False)
                assert trade.out_amount == out_amount
                return trade.in_amount

            @internal
            @view
            def _get_dxdy(i: uint256, j: uint256, amount: uint256, is_in: bool) -> DetailedTrade:
                """
                @notice Method to use to calculate out amount and spent in amount
                @param i Input coin index
                @param j Output coin index
                @param amount Amount of input or output coin to swap
                @param is_in Whether IN our OUT amount is known
                @return DetailedTrade with all swap results
                """
                # i = 0: borrowable (USD) in, collateral (ETH) out; going up
                # i = 1: collateral (ETH) in, borrowable (USD) out; going down
                assert (i == 0 and j == 1) or (i == 1 and j == 0), "Wrong index"
                out: DetailedTrade = empty(DetailedTrade)
                if amount == 0:
                    return out
                in_precision: uint256 = COLLATERAL_PRECISION
                out_precision: uint256 = BORROWED_PRECISION
                if i == 0:
                    in_precision = BORROWED_PRECISION
                    out_precision = COLLATERAL_PRECISION
                p_o: uint256[2] = self._price_oracle_ro()
                if is_in:
                    out = self.calc_swap_out(i == 0, amount * in_precision, p_o, in_precision, out_precision)
                else:
                    out = self.calc_swap_in(i == 0, amount * out_precision, p_o, in_precision, out_precision)
                out.in_amount = unsafe_div(out.in_amount, in_precision)
                out.out_amount = unsafe_div(out.out_amount, out_precision)
                return out
            ```

    === "Example"
        ```shell
        >>> soon
        ```


### `get_dydx`
!!! description "`OneWayLendingVaultFactory.get_dydx(vault_id: uint256, i: uint256, j: uint256, out_amount: uint256) -> (uint256, uint256):`"

    Function to calculate the out amount and spent in amount.

    Returns: in and out amount (`uint256`, `uint256`)

    | Input      | Type      | Description                      |
    |------------|-----------|----------------------------------|
    | `vault_id` | `uint256` | Vault ID to use the AMM of.      |
    | `i`        | `uint256` | Input coin                       |
    | `j`        | `uint256` | Output coin                      |
    | `out_amount`| `uint256`| Amount of output coins to receive|


    ??? quote "Source code"

        === "OneWayLendingVaultFactory.vy"

            ```python
            interface AMM:
                def get_dydx(i: uint256, j: uint256, out_amount: uint256) -> (uint256, uint256): view

            amms: public(AMM[10**18])

            @external
            @view
            def get_dydx(vault_id: uint256, i: uint256, j: uint256, out_amount: uint256) -> (uint256, uint256):
                return self.amms[vault_id].get_dydx(i, j, out_amount)
            ```

        === "AMM.vy"

            ```python
            struct DetailedTrade:
                in_amount: uint256
                out_amount: uint256
                n1: int256
                n2: int256
                ticks_in: DynArray[uint256, MAX_TICKS_UINT]
                last_tick_j: uint256
                admin_fee: uint256

            @external
            @view
            @nonreentrant('lock')
            def get_dydx(i: uint256, j: uint256, out_amount: uint256) -> (uint256, uint256):
                """
                @notice Method to use to calculate in amount required and out amount received
                @param i Input coin index
                @param j Output coin index
                @param out_amount Desired amount of output coin to receive
                @return A tuple with out_amount received and in_amount returned
                """
                # i = 0: borrowable (USD) in, collateral (ETH) out; going up
                # i = 1: collateral (ETH) in, borrowable (USD) out; going down
                out: DetailedTrade = self._get_dxdy(i, j, out_amount, False)
                return (out.out_amount, out.in_amount)

            @internal
            @view
            def _get_dxdy(i: uint256, j: uint256, amount: uint256, is_in: bool) -> DetailedTrade:
                """
                @notice Method to use to calculate out amount and spent in amount
                @param i Input coin index
                @param j Output coin index
                @param amount Amount of input or output coin to swap
                @param is_in Whether IN our OUT amount is known
                @return DetailedTrade with all swap results
                """
                # i = 0: borrowable (USD) in, collateral (ETH) out; going up
                # i = 1: collateral (ETH) in, borrowable (USD) out; going down
                assert (i == 0 and j == 1) or (i == 1 and j == 0), "Wrong index"
                out: DetailedTrade = empty(DetailedTrade)
                if amount == 0:
                    return out
                in_precision: uint256 = COLLATERAL_PRECISION
                out_precision: uint256 = BORROWED_PRECISION
                if i == 0:
                    in_precision = BORROWED_PRECISION
                    out_precision = COLLATERAL_PRECISION
                p_o: uint256[2] = self._price_oracle_ro()
                if is_in:
                    out = self.calc_swap_out(i == 0, amount * in_precision, p_o, in_precision, out_precision)
                else:
                    out = self.calc_swap_in(i == 0, amount * out_precision, p_o, in_precision, out_precision)
                out.in_amount = unsafe_div(out.in_amount, in_precision)
                out.out_amount = unsafe_div(out.out_amount, out_precision)
                return out
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

            ```python
            admin: public(address)
            ```

    === "Example"
        ```shell
        >>> OneWayLendingVaultFactory.admin():
        '0x40907540d8a6C65c637785e8f8B742ae6b0b9968'
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

            ```python
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
        >>> OneWayLendingVaultFactory.set_admin(todo):
        ```



---



## **Contract Info Methods**

Information is queried from the Factory mostly using vault indices. The first deployed vault is index 0, the second one is index 1, and so on.

### `vaults_index`
!!! description "`OneWayLendingVaultFactory.vaults_index(vault: Vault) -> uint256:`"

    Getter for the vault index within the factory by using the vault address.

    Returns: vault index (`uint256`)

    | Input      | Type   | Description |
    | ---------- | ------ | ----------- |
    | `vault` |  `address` | Vault address to get the index for.  |

    ??? quote "Source code"

        === "OneWayLendingVaultFactory.vy"

            ```python
            _vaults_index: HashMap[Vault, uint256]

            @view
            @external
            def vaults_index(vault: Vault) -> uint256:
                return self._vaults_index[vault] - 2**128
            ```

    === "Example"
        ```shell
        >>> OneWayLendingVaultFactory.vaults_index("0x67A18c18709C09D48000B321c6E1cb09F7181211"):
        1
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

            ```python
            vaults: public(Vault[10**18])
            ```

    === "Example"
        ```shell
        >>> OneWayLendingVaultFactory.vaults(0):
        '0xE21C518a09b26Bf65B16767B97249385f12780d9'
        >>> OneWayLendingVaultFactory.vaults(0):
        '0x67A18c18709C09D48000B321c6E1cb09F7181211'
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

            ```python
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
        >>> OneWayLendingVaultFactory.controllers(0):
        '0x5E657c5227A596a860621C5551c9735d8f4A8BE3'
        >>> OneWayLendingVaultFactory.controllers(0):
        '0x7443944962D04720f8c220C0D25f56F869d6EfD4'
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

            ```python
            amms: public(AMM[10**18])
            ```

    === "Example"
        ```shell
        >>> OneWayLendingVaultFactory.amms(0):
        '0x0167B8a9A3959E698A3e3BCaFe829878FfB709e3'
        >>> OneWayLendingVaultFactory.amms(1):
        '0xafC1ab86045Cb2a07C23399dbE64b56D1B8B3239'
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

            ```python
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
        >>> OneWayLendingVaultFactory.borrowed_tokens(0):
        '0xf939E0A03FB07F59A73314E73794Be0E57ac1b4E'
        >>> OneWayLendingVaultFactory.borrowed_tokens(2):
        '0xD533a949740bb3306d119CC777fa900bA034cd52'
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

            ```python
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
        >>> OneWayLendingVaultFactory.collateral_tokens(0):
        '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0'
        >>> OneWayLendingVaultFactory.collateral_tokens(1):
        '0xD533a949740bb3306d119CC777fa900bA034cd52'
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

            ```python
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
        >>> OneWayLendingVaultFactory.price_oracles(0):
        '0xDf1B41413EafcCfC6E98BB905feaeB271d307aF3'
        >>> OneWayLendingVaultFactory.price_oracles(1):
        '0xc17B0451E6d8C0f71297d0f174590632BE81163c'
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

            ```python
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
        >>> OneWayLendingVaultFactory.monetary_policies(0):  
        '0xfd8eF79883815D6771FC986D43E3Dce60ea33726'      
        >>> OneWayLendingVaultFactory.monetary_policies(1):
        '0x5c79C4cFE9D77B3d2385E119fADb4F8ff8c08294'
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

            ```python
            _vaults_index: HashMap[Vault, uint256]

            gauges: public(address[10**18])

            @view
            @external
            def gauge_for_vault(_vault: Vault) -> address:
                return self.gauges[self._vaults_index[_vault] - 2**128]
            ```

    === "Example"
        ```shell
        >>> OneWayLendingVaultFactory.gauge_for_vault("0x67A18c18709C09D48000B321c6E1cb09F7181211"):
        '0xAA90BE8bd52aeA49314dFc6e385e21A4e9c4ea0c'
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

            ```python
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
        >>> OneWayLendingVaultFactory.coins(0):
        [[0xf939E0A03FB07F59A73314E73794Be0E57ac1b4E]
        [0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0]]
        ```


### `STABLECOIN`
!!! description "`OneWayLendingVaultFactory.STABLECOIN() -> address: view:`"

    Getter for the crvUSD token. Only crvUSD-containing lending vaults are possible.

    Returns: crvUSD (`address`).

    ??? quote "Source code"

        === "OneWayLendingVaultFactory.vy"

            ```python
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
        >>> OneWayLendingVaultFactory.STABLECOIN():
        '0xf939E0A03FB07F59A73314E73794Be0E57ac1b4E'
        ```


### `market_count`
!!! description "`OneWayLendingVaultFactory.():`"

    Getter for the total market count. This value represents the total number of lending vaults created through this factory. This value is incremented by 1 whenever the internal `_create` function is called.

    Returns: market count (`uint256`).

    ??? quote "Source code"

        === "OneWayLendingVaultFactory.vy"

            ```python
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
        >>> OneWayLendingVaultFactory.market_count():
        3
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

            ```python
            token_to_vaults: public(HashMap[address, Vault[10**18]])
            ```

    === "Example"
        ```shell
        >>> OneWayLendingVaultFactory.token_to_vaults("0xD533a949740bb3306d119CC777fa900bA034cd52", 0):
        '0x67A18c18709C09D48000B321c6E1cb09F7181211'
        >>> OneWayLendingVaultFactory.token_to_vaults("0xD533a949740bb3306d119CC777fa900bA034cd52", 1):
        '0x044aC5160e5A04E09EBAE06D786fc151F2BA5ceD'
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

            ```python
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
        >>> OneWayLendingVaultFactory.token_market_count("0xD533a949740bb3306d119CC777fa900bA034cd52"):
        2
        >>> OneWayLendingVaultFactory.token_market_count("0xf939E0A03FB07F59A73314E73794Be0E57ac1b4E"):
        0           # market count of crvusd will always return 0, because the token is included in every vault (market)
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

            ```python
            gauges: public(address[10**18])
            ```

    === "Example"
        ```shell
        >>> OneWayLendingVaultFactory.gauges(0):
        '0x3742aCa9ad8655d2d3eab5569eF1BdB4C5d52e5D'
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

            ```python
            names: public(HashMap[uint256, String[64]])
            ```

    === "Example"
        ```shell
        >>> OneWayLendingVaultFactory.names(0):
        'wstETH-long'
        >>> OneWayLendingVaultFactory.names(1):    
        'CRV-long'    
        ```
