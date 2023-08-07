The use for the factory contract is to add new markets, raise or lower debt ceilings of already existing markets, set blueprint contracts for AMM and Controller, and set fee receivers.


!!! info
    The Factory Contract is deployed to the Ethereum mainnet at: [0xC9332fdCB1C491Dcc683bAe86Fe3cb70360738BC](https://etherscan.io/address/0xC9332fdCB1C491Dcc683bAe86Fe3cb70360738BC).  
    Source code for this contract is available on [Github](https://github.com/curvefi/curve-stablecoin/blob/master/contracts/ControllerFactory.vy).


## **Adding Markets and Adjusting Debt Ceilings**

### `add_market`
!!! description "`ControllerFactory.add_market(token: address, A: uint256, fee: uint256, admin_fee: uint256, _price_oracle_contract: address, monetary_policy: address, loan_discount: uint256, liquidation_discount: uint256, debt_ceiling: uint256) -> address[2]:`"

    Function to add a new market and automatically deploy an AMM-Contract and a Controller-Contract from the implemented blueprint contracts (see [Implementations](#implementations-blueprint-contracts)). Calls `rate_write()` from the used MonetaryPolicy to check if it has a correct ABI. There are some limitation values for adding new markets in regard to `fee`, `A` and `liquidation_discount`.

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

    Returns: `address` of Controller and AMM.

    Emits event: `AddNewMarket`

    !!!note
        `add_market` can only be called by the admin of the contract. 

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
        >>> ControllerFactory.add_market("todo")
        todo
        ```


### `debt_ceiling`
!!! description "`ControllerFactory.debt_ceiling(agr0: address) -> uint256: view`"

    Getter for the current debt ceiling of a market.

    Returns: debt ceiling (`uint256`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `arg0` |  `address` | Address of the controller |

    ??? quote "Source code"

        ```python hl_lines="1"
        debt_ceiling: public(HashMap[address, uint256])
        ```

    === "Example"
        ```shell
        >>> ControllerFactory.debt_ceiling("0x8472A9A7632b173c8Cf3a86D3afec50c35548e76")
        10000000000000000000000000
        ```


### `debt_ceiling_residual`
!!! description "`ControllerFactory.debt_ceiling_residual(arg0: address) -> uint256: view`"

    Getter for the residual debt ceiling for a market.

    Returns: debt ceiling residual (`uint256`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `arg0` |  `address` | Address of the controller |

    ??? quote "Source code"

        ```python hl_lines="1"
        debt_ceiling: public(HashMap[address, uint256])
        ```

    === "Example"
        ```shell
        >>> ControllerFactory.debt_ceiling("0x8472A9A7632b173c8Cf3a86D3afec50c35548e76")
        10000000000000000000000000
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
        `set_debt_ceiling` can only be called by the `admin` of the contract.

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
        >>> ControllerFactory.set_debt_ceiling("todo")
        'todo'
        ```


### `rug_debt_ceiling`
!!! description "`ControllerFactory.rug_debt_ceiling(_to: address):`"

    Function to remove stablecoins above the debt seiling from a controller and burn them.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_to` |  `address` | Address of the controller to remove stablecoins from |

    ??? quote "Source code"

        ```python hl_lines="3"
        @external
        @nonreentrant('lock')
        def rug_debt_ceiling(_to: address):
            """
            @notice Remove stablecoins above the debt ceiling from the address and burn them
            @param _to Address to remove stablecoins from
            """
            self._set_debt_ceiling(_to, self.debt_ceiling[_to], False)
        ```

    === "Example"
        ```shell
        >>> ControllerFactory.rug_debt_ceiling("todo")
        'todo'
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
        `set_admin` can only be called by the `admin` of the contract.  
        At the time of deplyment, admin was set to the deployer of the contract. Ownership has been [trasferred](https://etherscan.io/tx/0xdd2b7a5eba5c2890b94804332825a94d37cb161ceb2a25cf985e0fdc94a55b31) to the DAO right after setting up the implementation contracts and the first market.

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
        >>> ControllerFactory.set_admin("todo")
        'todo'
        ```


## **Fee Receiver**
The fee receiver is the address that receives the claimed fees when calling `collect_fees()` on the Controller.
A new receiver can be set by the `admin` of the contract (which is the DAO).

### `fee_receiver`
!!! description "`ControllerFactory.fee_receiver() -> address: view`"

    Getter for the fee receiver address.

    Returns: `address` of fee receiver.

    ??? quote "Source code"

        ```python hl_lines="1 6 17"
        fee_receiver: public(address)

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
        >>> ControllerFactory.fee_receiver()
        '0xeCb456EA5365865EbAb8a2661B0c503410e9B347'
        ```


### `set_fee_receiver`
!!! description "`ControllerFactory.set_fee_receiver(fee_receiver: address):`"

    Function to set the fee receiver address.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `fee_receiver` |  `address` | Address of the receiver |

    !!!note 
        `set_fee_receiver` can only be called by the `admin` of the contract.  

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
        >>> ControllerFactory.set_fee_receiver("todo")
        'todo'
        ```

### `collect_fees_above_ceiling`
!!! description "`ControllerFactory.collect_fees_above_ceiling(_to: address):`"

    Function to claim fees above the ceiling. This function will automatically increase the debt ceiling if it's not enough to claim admin fees.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_to` |  `address` | Address of the controller |

    !!!note 
        `collect_fees_above_ceiling` can only be called by the `admin` of the contract.  

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
        >>> ControllerFactory.collect_fees_above_ceiling()
        '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
        ```



## **Implementations (Blueprint Contracts)**
Implementations are blueprint contracts. When adding a new market by calling `add_market()` a AMM and a Controller contract are created in the form of these implementations. New implementation contracts can be set by the `admin` of the factory (which is the DAO).

### `controller_implementation`
!!! description "`ControllerFactory.controller_implementation() -> address: view`"

    Getter for controller implementation address.

    Returns: `address` of the controller implementation.

    ??? quote "Source code"

        ```python hl_lines="1"
        collaterals: public(address[MAX_CONTROLLERS])
        ```

    === "Example"
        ```shell
        >>> ControllerFactory.controller_implementation()
        '0x9DFbf2b2aF574cA8Ba6dD3fD397287944269f720'
        ```


### `amm_implementation`
!!! description "`ControllerFactory.amm_implementation() -> address: view`"

    Getter for amm implementation address.

    Returns: `address` of the amm implementation.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `arg0` |  `uint256` | Index |

    ??? quote "Source code"

        ```python hl_lines="1"
        amm_implementation: public(address)
        ```

    === "Example"
        ```shell
        >>> ControllerFactory.amm_implementation()
        '0x23208cA4F2B30d8f7D54bf2D5A822D1a2F876501'
        ```

### `set_implementations`
    !!! description "`ControllerFactory.set_implementations(controller: address, amm: address):`"

    Function to set new implementations (blueprints) for controller and amm. 

    Emits event: `SetImplementations`

    !!!note 
        `set_implementations` can only be called by the `admin` of the contract.  
        Setting new implementations for controller and amm does not affect the existing ones.

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
        >>> ControllerFactory.set_implementation("todo")
        'todo'
        ``` 


## **Contract Info Methods**
### `stablecoin`
!!! description "`ControllerFactory.stablecoin() -> address: view`"

    Getter for the stablecoin address.

    Returns: stablecoin (`address`). 

    ??? quote "Source code"

        ```python hl_lines="1 4 15"
        STABLECOIN: immutable(ERC20)

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
        >>> ControllerFactory.stablecoin()
        '0xf939E0A03FB07F59A73314E73794Be0E57ac1b4E'
        ```


### `total_debt`
!!! description "`ControllerFactory.total_debt() -> uint256: view`"

    Getter for the sum of all debts across the controllers.

    Returns: total amount of debt (`uint256`). 

    ??? quote "Source code"

        ```python hl_lines="3"
        @external
        @view
        def total_debt() -> uint256:
            """
            @notice Sum of all debts across controllers
            """
            total: uint256 = 0
            n_collaterals: uint256 = self.n_collaterals
            for i in range(MAX_CONTROLLERS):
                if i == n_collaterals:
                    break
                total += Controller(self.controllers[i]).total_debt()
            return total
        ```

    === "Example"
        ```shell
        >>> ControllerFactory.total_debt()
        37565735180665889485176526
        ```


### `get_controller`
!!! description "`ControllerFactory.get_controller(collateral: address, i: uint256 = 0) -> address:`"

    Getter for the controller address for `collateral`.

    Returns: controller `address`. 

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `collateral` |  `address` | Address of collateral token |
    | `i` |  `uint256` | Index to iterate over several controller for the same collateral if needed |


    ??? quote "Source code"

        ```python hl_lines="3"
        @external
        @view
        def get_controller(collateral: address, i: uint256 = 0) -> address:
            """
            @notice Get controller address for collateral
            @param collateral Address of collateral token
            @param i Iterate over several controllers for collateral if needed
            """
            return self.controllers[self.collaterals_index[collateral][i] - 2**128]
        ```

    === "Example"
        ```shell
        >>> ControllerFactory.get_controller("0xac3E018457B222d93114458476f3E3416Abbe38F", 0)
        '0x8472A9A7632b173c8Cf3a86D3afec50c35548e76'
        ```


### `get_amm`
!!! description "`ControllerFactory.get_amm(collateral: address, i: uint256 = 0) -> address:`"

    Getter for the amm address for `collateral`.

    Returns: amm `address`. 

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `collateral` |  `address` | Address of collateral token |
    | `i` |  `uint256` | Index to iterate over several amms for the same collateral if needed |


    ??? quote "Source code"

        ```python hl_lines="3"
        @external
        @view
        def get_amm(collateral: address, i: uint256 = 0) -> address:
            """
            @notice Get AMM address for collateral
            @param collateral Address of collateral token
            @param i Iterate over several amms for collateral if needed
            """
            return self.amms[self.collaterals_index[collateral][i] - 2**128]
        ```

    === "Example"
        ```shell
        >>> ControllerFactory.get_amm("0xac3E018457B222d93114458476f3E3416Abbe38F", 0)
        '0x136e783846ef68C8Bd00a3369F787dF8d683a696'
        ```


### `controllers`
!!! description "`ControllerFactory.controllers(arg0: uint256) -> address:`"

    Getter for the controller address at index `arg0`.

    Returns: controller `address` at specific index. 

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `arg0` |  `uint256` | Index |


    ??? quote "Source code"

        ```python hl_lines="2"
        MAX_CONTROLLERS: constant(uint256) = 50000
        controllers: public(address[MAX_CONTROLLERS])
        ```

    === "Example"
        ```shell
        >>> ControllerFactory.controllers(0)
        '0x8472A9A7632b173c8Cf3a86D3afec50c35548e76'
        ```


### `amms`
!!! description "`ControllerFactory.amms(arg0: uint256) -> address:`"

    Getter for the amm address at index `arg0`.

    Returns: amm `address` at specific index. 

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `arg0` |  `uint256` | Index |


    ??? quote "Source code"

        ```python hl_lines="1"
        amms: public(address[MAX_CONTROLLERS])
        ```

    === "Example"
        ```shell
        >>> ControllerFactory.amms(0)
        '0x136e783846ef68C8Bd00a3369F787dF8d683a696'
        ```

### `n_collaterals`
!!! description "`ControllerFactory.n_collaterals() -> uint256: view`"

    Getter for the number of collaterals.

    Returns: number of collaterals (`uint256`).

    ??? quote "Source code"

        ```python hl_lines="1"
        n_collaterals: public(uint256)
        ```

    === "Example"
        ```shell
        >>> ControllerFactory.n_collaterals()
        2
        ```


### `collaterals`
!!! description "`ControllerFactory.collaterals(arg0: uint256) -> address: view`"

    Getter for the collateral addresses at index `arg0`.

    Returns: `address` of collateral.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `arg0` |  `uint256` | Index |

    ??? quote "Source code"

        ```python hl_lines="1"
        collaterals: public(address[MAX_CONTROLLERS])
        ```

    === "Example"
        ```shell
        >>> ControllerFactory.collaterals(0)
        '0xac3E018457B222d93114458476f3E3416Abbe38F'
        ```


### `collaterals_index` (todo)
!!! description "`ControllerFactory.collaterals(arg0: address, arg1: uint256) -> uint256: view`"

    Getter for the collateral index.

    Returns: number of collaterals (`uint256`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `arg0` |  `address` | Address of collateral |
    | `arg0` |  `uint256` | Index |

    ??? quote "Source code"

        ```python hl_lines="1"
        collaterals_index: public(HashMap[address, uint256[1000]])
        ```

    === "Example"
        ```shell
        >>> ControllerFactory.collaterals(0xac3E018457B222d93114458476f3E3416Abbe38F, 0)
        340282366920938463463374607431768211456
        ```

### `WETH`
!!! description "`ControllerFactory.WETH() -> address: view`"

    Getter for WETH address.

    Returns: `address` of WETH.

    ??? quote "Source code"

        ```python hl_lines="1 7 18"
        WETH: public(immutable(address))

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
        >>> ControllerFactory.WETH()
        '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
        ```