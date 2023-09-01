The following functions are **Admin-Only functions** and therefore can only be called by the `admin` of the contract, which is the CurveOwnershipAgent.


## **Adding Markets and Adjusting Debt Ceilings**

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
        >>> ControllerFactory.add_market("0xae78736cd615f374d3085123a210448e74fc6393", 100, 6000000000000000, 0, "price oracle contract", "monetary policy contract", 90000000000000000, 60000000000000000, 10000000000000000000000000):
        "returns AMM and Controller contract"
        ```


### `set_debt_ceiling`
!!! description "`ControllerFactory.set_debt_ceiling(_to: address, debt_ceiling: uint256):`"

    Function to set the debt ceiling of a market and mint the token amount given for it.

    Returns: debt ceiling (`uint256`).

    Emits event: `MintForMarket` or `RemoveFromMarket` or `SetDebtCeiling`

    There are two possibilities on how to set the debt ceiling: 

    1. When raising the debt ceiling, the difference between `debt_ceiling` and `debt_ceiling_residual` will be minted to the controller. 
    2. When reducing the debt ceiling, the minimum value of either the difference between `debt_ceiling_residual` and `debt_ceiling` or the crvUSD balance of the controller itself will get burnt.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_to` |  `address` | Address to set debt ceiling for |
    | `debt_ceiling` |  `uint256` | Maximum to be allowed to mint |

    !!!note 
        **`set_debt_ceiling`** can only be called by the `admin` of the contract.

    ??? quote "Source code"

        === "ControllerFactory.vy"

            ```python hl_lines="1 5 9 14 23 25 26 27 29 31 32 33 35 36 37 41"
            event SetDebtCeiling:
                addr: indexed(address)
                debt_ceiling: uint256

            event MintForMarket:
                addr: indexed(address)
                amount: uint256

            event RemoveFromMarket:
                addr: indexed(address)
                amount: uint256

            @internal
            def _set_debt_ceiling(addr: address, debt_ceiling: uint256, update: bool):
                """
                @notice Set debt ceiling for a market
                @param addr Controller address
                @param debt_ceiling Value for stablecoin debt ceiling
                @param update Whether to actually update the debt ceiling (False is used for burning the residuals)
                """
                old_debt_residual: uint256 = self.debt_ceiling_residual[addr]

                if debt_ceiling > old_debt_residual:
                    to_mint: uint256 = debt_ceiling - old_debt_residual
                    STABLECOIN.mint(addr, to_mint)
                    self.debt_ceiling_residual[addr] = debt_ceiling
                    log MintForMarket(addr, to_mint)

                if debt_ceiling < old_debt_residual:
                    diff: uint256 = min(old_debt_residual - debt_ceiling, STABLECOIN.balanceOf(addr))
                    STABLECOIN.burnFrom(addr, diff)
                    self.debt_ceiling_residual[addr] = old_debt_residual - diff
                    log RemoveFromMarket(addr, diff)

                if update:
                    self.debt_ceiling[addr] = debt_ceiling
                    log SetDebtCeiling(addr, debt_ceiling)

            @external
            @nonreentrant('lock')
            def set_debt_ceiling(_to: address, debt_ceiling: uint256):
                """
                @notice Set debt ceiling of the address - mint the token amount given for it
                @param _to Address to allow borrowing for
                @param debt_ceiling Maximum allowed to be allowed to mint for it
                """
                assert msg.sender == self.admin
                self._set_debt_ceiling(_to, debt_ceiling, True)
            ```

        === "Stablecoin.vy"

            ```python hl_lines="2 19"
            @external
            def mint(_to: address, _value: uint256) -> bool:
                """
                @notice Mint `_value` amount of tokens to `_to`.
                @dev Only callable by an account with minter privileges.
                @param _to The account newly minted tokens are credited to.
                @param _value The amount of tokens to mint.
                """
                assert msg.sender == self.minter
                assert _to not in [self, empty(address)]

                self.balanceOf[_to] += _value
                self.totalSupply += _value

                log Transfer(empty(address), _to, _value)
                return True

            @external
            def burn(_value: uint256) -> bool:
                """
                @notice Burn `_value` amount of tokens.
                @param _value The amount of tokens to burn.
                """
                self._burn(msg.sender, _value)
                return True
            ```

    === "Example"
        ```shell
        >>> ControllerFactory.set_debt_ceiling(20000000000000000000000000)
        ```



## **Fee Receiver**

### `set_fee_receiver`
!!! description "`ControllerFactory.set_fee_receiver(fee_receiver: address):`"

    Function to set the fee receiver address.

    Emits: `SetFeeReceiver`

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `fee_receiver` |  `address` | Address of the receiver |

    !!!note 
        **`set_fee_receiver`** can only be called by the `admin` of the contract.  

    ??? quote "Source code"

        ```python hl_lines="1 8 16"
        event SetFeeReceiver:
            fee_receiver: address

        fee_receiver: public(address)

        @external
        @nonreentrant('lock')
        def set_fee_receiver(fee_receiver: address):
            """
            @notice Set fee receiver who earns interest (DAO)
            @param fee_receiver Address of the receiver
            """
            assert msg.sender == self.admin
            assert fee_receiver != empty(address)
            self.fee_receiver = fee_receiver
            log SetFeeReceiver(fee_receiver)
        ```

    === "Example"
        ```shell
        >>> ControllerFactory.set_fee_receiver("0xeCb456EA5365865EbAb8a2661B0c503410e9B347")
        ```


### `collect_fees_above_ceiling`
!!! description "`ControllerFactory.collect_fees_above_ceiling(_to: address):`"

    Function to claim fees above the ceiling. This function will automatically increase the debt ceiling if it's not enough to claim admin fees.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_to` |  `address` | Address of the controller |

    !!!note 
        **`collect_fees_above_ceiling`** can only be called by the `admin` of the contract.  

    ??? quote "Source code"

        ```python hl_lines="1 7 18"
        @external
        @nonreentrant('lock')
        def collect_fees_above_ceiling(_to: address):
            """
            @notice If the receiver is the controller - increase the debt ceiling if it's not enough to claim admin fees
                    and claim them
            @param _to Address of the controller
            """
            assert msg.sender == self.admin
            old_debt_residual: uint256 = self.debt_ceiling_residual[_to]
            assert self.debt_ceiling[_to] > 0 or old_debt_residual > 0

            admin_fees: uint256 = Controller(_to).total_debt() + Controller(_to).redeemed() - Controller(_to).minted()
            b: uint256 = STABLECOIN.balanceOf(_to)
            if admin_fees > b:
                to_mint: uint256 = admin_fees - b
                STABLECOIN.mint(_to, to_mint)
                self.debt_ceiling_residual[_to] = old_debt_residual + to_mint
            Controller(_to).collect_fees()
        ```

    === "Example"
        ```shell
        >>> ControllerFactory.collect_fees_above_ceiling("0x100dAa78fC509Db39Ef7D04DE0c1ABD299f4C6CE")
        ```



## **Implementations (Blueprint Contracts)**

### `set_implementations`
!!! description "`ControllerFactory.set_implementations(controller: address, amm: address):`"

    Function to set new implementations (blueprints) for controller and amm. 

    Emits event: `SetImplementations`

    !!!note 
        **`set_implementations`** can only be called by the `admin` of the contract.  
        Setting new implementations for Controller and AMM does not affect the existing ones.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `controller` |  `Address` | Address of the controller blueprint |
    | `amm` |  `Address` | Address of the amm blueprint |

    ??? quote "Source code"

        ```python hl_lines="1 5 6 10"
        event SetImplementations:
            amm: address
            controller: address

        controller_implementation: public(address)
        amm_implementation: public(address)

        @external
        @nonreentrant('lock')
        def set_implementations(controller: address, amm: address):
            """
            @notice Set new implementations (blueprints) for controller and amm. Doesn't change existing ones
            @param controller Address of the controller blueprint
            @param amm Address of the AMM blueprint
            """
            assert msg.sender == self.admin
            assert controller != empty(address)
            assert amm != empty(address)
            self.controller_implementation = controller
            self.amm_implementation = amm
            log SetImplementations(amm, controller)
        ```

    === "Example"
        ```shell
        >>> ControllerFactory.set_implementation("new controller implementation, new amm implementation")
        ``` 


## **Admin Ownership**
### `admin`
!!! description "`ControllerFactory.admin() -> address: view`"

    Getter for the admin of the contract.

    Returns: admin `address`.

    ??? quote "Source code"

        ```python hl_lines="1 5 16"
        admin: public(address)

        @external
        def __init__(stablecoin: ERC20,
                    admin: address,
                    fee_receiver: address,
                    weth: address):
            """
            @notice Factory which creates both controllers and AMMs from blueprints
            @param stablecoin Stablecoin address
            @param admin Admin of the factory (ideally DAO)
            @param fee_receiver Receiver of interest and admin fees
            @param weth Address of WETH contract address
            """
            STABLECOIN = stablecoin
            self.admin = admin
            self.fee_receiver = fee_receiver
            WETH = weth
        ```

    === "Example"
        ```shell
        >>> ControllerFactory.admin()
        '0x40907540d8a6C65c637785e8f8B742ae6b0b9968'
        ```


### `set_admin`
!!! description "`ControllerFactory.set_admin(admin: address):`"

    Function to set the admin of the contract.

    Emits event: `SetAdmin`

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `admin` |  `address` | Address of the admin |

    !!!note 
        **`set_admin`** can only be called by the `admin` of the contract.  

    ??? quote "Source code"

        ```python hl_lines="1 8"
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
        >>> ControllerFactory.set_admin("0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045")
        ```