## **Adding Markets**

### `add_market`
!!! description "`ControllerFactory.add_market(token: address, A: uint256, fee: uint256, admin_fee: uint256, _price_oracle_contract: address, monetary_policy: address, loan_discount: uint256, liquidation_discount: uint256, debt_ceiling: uint256) -> address[2]:`"

    Function to add a new market and automatically deploy an AMM-Contract and a Controller-Contract from the implemented blueprint contracts (see [Implementations](../crvusd_factory/factory_contract.md#implementations)). 
    When initializing, `rate_write()` from the MonetaryPolicy contract is called to check if it has a correct ABI.

    Returns: deployed contract (`address`) of AMM and Controller.

    Emits event: `AddNewMarket`

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `token` |  `address` | Collateral token address|
    | `A` |  `uint256` | Amplification coefficient. One band size is $\frac{1}{n}$ |
    | `fee` |  `uint256` | AMM fee in the market's AMM |
    | `admin_fee` |  `uint256` | AMM admin fee |
    | `_price_oracle_contract` |  `address` | Address of the price oracle contract for the market |
    | `monetary_policy` |  `address` | Monetary policy for the market |
    | `loan_discount` |  `uint256` | Loan Discount: allowed to borrow only up to `x_down * (1 - loan_discount)` |
    | `liquidation_discount` |  `uin256` | Discount which defines a bad liquidation threshold |
    | `debt_ceiling` |  `uint256` | Debt ceiling for the market |


    !!!warning
        There are some limitation values for adding new markets regarding `fee`, `A` and `liquidation_discount`.

    !!!note
        **`add_market`** can only be called by the admin of the contract. 

    ??? quote "Source code"

        === "ControllerFactory.vy"

            ```python hl_lines="12 44 51 70"
            # Limits
            MIN_A: constant(uint256) = 2
            MAX_A: constant(uint256) = 10000
            MIN_FEE: constant(uint256) = 10**6  # 1e-12, still needs to be above 0
            MAX_FEE: constant(uint256) = 10**17  # 10%
            MAX_ADMIN_FEE: constant(uint256) = 10**18  # 100%
            MAX_LOAN_DISCOUNT: constant(uint256) = 5 * 10**17
            MIN_LIQUIDATION_DISCOUNT: constant(uint256) = 10**16

            @external
            @nonreentrant('lock')
            def add_market(token: address, A: uint256, fee: uint256, admin_fee: uint256,
                        _price_oracle_contract: address,
                        monetary_policy: address, loan_discount: uint256, liquidation_discount: uint256,
                        debt_ceiling: uint256) -> address[2]:
                """
                @notice Add a new market, creating an AMM and a Controller from a blueprint
                @param token Collateral token address
                @param A Amplification coefficient; one band size is 1/A
                @param fee AMM fee in the market's AMM
                @param admin_fee AMM admin fee
                @param _price_oracle_contract Address of price oracle contract for this market
                @param monetary_policy Monetary policy for this market
                @param loan_discount Loan discount: allowed to borrow only up to x_down * (1 - loan_discount)
                @param liquidation_discount Discount which defines a bad liquidation threshold
                @param debt_ceiling Debt ceiling for this market
                @return (Controller, AMM)
                """
                assert msg.sender == self.admin, "Only admin"
                assert A >= MIN_A and A <= MAX_A, "Wrong A"
                assert fee <= MAX_FEE, "Fee too high"
                assert fee >= MIN_FEE, "Fee too low"
                assert admin_fee < MAX_ADMIN_FEE, "Admin fee too high"
                assert liquidation_discount >= MIN_LIQUIDATION_DISCOUNT, "Liquidation discount too low"
                assert loan_discount <= MAX_LOAN_DISCOUNT, "Loan discount too high"
                assert loan_discount > liquidation_discount, "need loan_discount>liquidation_discount"
                MonetaryPolicy(monetary_policy).rate_write()  # Test that MonetaryPolicy has correct ABI

                p: uint256 = PriceOracle(_price_oracle_contract).price()  # This also validates price oracle ABI
                assert p > 0
                assert PriceOracle(_price_oracle_contract).price_w() == p
                A_ratio: uint256 = 10**18 * A / (A - 1)

                amm: address = create_from_blueprint(
                    self.amm_implementation,
                    STABLECOIN.address, 10**(18 - STABLECOIN.decimals()),
                    token, 10**(18 - ERC20(token).decimals()),  # <- This validates ERC20 ABI
                    A, isqrt(A_ratio * 10**18), self.ln_int(A_ratio),
                    p, fee, admin_fee, _price_oracle_contract,
                    code_offset=3)
                controller: address = create_from_blueprint(
                    self.controller_implementation,
                    token, monetary_policy, loan_discount, liquidation_discount, amm,
                    code_offset=3)
                AMM(amm).set_admin(controller)
                self._set_debt_ceiling(controller, debt_ceiling, True)

                N: uint256 = self.n_collaterals
                self.collaterals[N] = token
                for i in range(1000):
                    if self.collaterals_index[token][i] == 0:
                        self.collaterals_index[token][i] = 2**128 + N
                        break
                    assert i != 999, "Too many controllers for same collateral"
                self.controllers[N] = controller
                self.amms[N] = amm
                self.n_collaterals = N + 1

                log AddMarket(token, controller, amm, monetary_policy, N)
                return [controller, amm]
            ```

        === "MonetaryPolicy.vy"

            ```python hl_lines="25 28"
            @internal
            @view
            def calculate_rate() -> uint256:
                sigma: int256 = self.sigma
                target_debt_fraction: uint256 = self.target_debt_fraction

                p: int256 = convert(PRICE_ORACLE.price(), int256)
                pk_debt: uint256 = 0
                for pk in self.peg_keepers:
                    if pk.address == empty(address):
                        break
                    pk_debt += pk.debt()

                power: int256 = (10**18 - p) * 10**18 / sigma  # high price -> negative pow -> low rate
                if pk_debt > 0:
                    total_debt: uint256 = CONTROLLER_FACTORY.total_debt()
                    if total_debt == 0:
                        return 0
                    else:
                        power -= convert(pk_debt * 10**18 / total_debt * 10**18 / target_debt_fraction, int256)

                return self.rate0 * min(self.exp(power), MAX_EXP) / 10**18

            @external
            def rate_write() -> uint256:
                # Not needed here but useful for more automated policies
                # which change rate0 - for example rate0 targeting some fraction pl_debt/total_debt
                return self.calculate_rate()
            ```


        === "PriceOracle.vy"

            ```python hl_lines="3"
            @external
            @view
            def price() -> uint256:
                n: uint256 = self.n_price_pairs
                prices: uint256[MAX_PAIRS] = empty(uint256[MAX_PAIRS])
                D: uint256[MAX_PAIRS] = empty(uint256[MAX_PAIRS])
                Dsum: uint256 = 0
                DPsum: uint256 = 0
                for i in range(MAX_PAIRS):
                    if i == n:
                        break
                    price_pair: PricePair = self.price_pairs[i]
                    pool_supply: uint256 = price_pair.pool.totalSupply()
                    if pool_supply >= MIN_LIQUIDITY:
                        p: uint256 = price_pair.pool.price_oracle()
                        if price_pair.is_inverse:
                            p = 10**36 / p
                        prices[i] = p
                        _D: uint256 = price_pair.pool.get_virtual_price() * pool_supply / 10**18
                        D[i] = _D
                        Dsum += _D
                        DPsum += _D * p
                if Dsum == 0:
                    return 10**18  # Placeholder for no active pools
                p_avg: uint256 = DPsum / Dsum
                e: uint256[MAX_PAIRS] = empty(uint256[MAX_PAIRS])
                e_min: uint256 = max_value(uint256)
                for i in range(MAX_PAIRS):
                    if i == n:
                        break
                    p: uint256 = prices[i]
                    e[i] = (max(p, p_avg) - min(p, p_avg))**2 / (SIGMA**2 / 10**18)
                    e_min = min(e[i], e_min)
                wp_sum: uint256 = 0
                w_sum: uint256 = 0
                for i in range(MAX_PAIRS):
                    if i == n:
                        break
                    w: uint256 = D[i] * self.exp(-convert(e[i] - e_min, int256)) / 10**18
                    w_sum += w
                    wp_sum += w * prices[i]
                return wp_sum / w_sum
            ```

        === "AMM.vy"

            ```python hl_lines="2"
            @external
            def set_admin(_admin: address):
                """
                @notice Set admin of the AMM. Typically it's a controller (unless it's tests)
                @param _admin Admin address
                """
                assert self.admin == empty(address)
                self.admin = _admin
                self.approve_max(BORROWED_TOKEN, _admin)
                self.approve_max(COLLATERAL_TOKEN, _admin)
            ```

    === "Example"
        ```shell
        >>> ControllerFactory.add_market("0xae78736cd615f374d3085123a210448e74fc6393",
                                        100, 
                                        6000000000000000,
                                        0, 
                                        "price oracle contract", 
                                        "monetary policy contract", 
                                        90000000000000000, 
                                        60000000000000000, 
                                        10000000000000000000000000):
                                        
        "returns AMM and Controller contract"
        ```