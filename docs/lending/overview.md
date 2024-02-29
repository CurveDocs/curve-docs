<h1>Curve Lending: Overview</h1>

Curve lending allows permissionless lending/borrowing powered by [LLAMMA](../crvUSD/amm.md) for soft liquidations.

The Factory enables the **creation of permissionless lending/borrowing markets to borrow crvUSD against any token, or to borrow any token against crvUSD in an isolated mode.** Minted crvUSD is not backed by any of the collateral tokens in lending markets.

Liquidity is provided in [Vaults](./contracts/vault.md), which are [ERC4626](https://ethereum.org/developers/docs/standards/tokens/erc-4626) contracts with some additional methods for convenience.

!!!deploy "Contract Source & Deployment"
    Lending related deployments can be found [here](../references/deployed-contracts.md#curve-lending).  
    Source code for all lending-relevant contracts is available on [GitHub](https://github.com/curvefi/curve-stablecoin/tree/lending).


---


# **Smart contracts and their differences from original Curve stablecoin contracts**

Both `Controller.vy` and `AMM.vy` can be used for the stablecoin in this same form, to keep the codebase the same. A full documentation of the LLAMMA can be found [here](../crvUSD/amm.md). 


## **AMM.vy**

The core contract **`AMM.vy` remains exactly the same**. It is already precisely what we need for lending; no changes are needed.

## **Controller.vy**

The Controller has the **ability to handle not only 18-digit tokens** (like crvUSD) but also **tokens with any number of digits**. For that,
there were multiple changes to **ensure rounding always rounds up in favor of the existing borrowers**.

The **method which collects borrowing fees `collect_fees()` will not work in lending**. Admin fees are zero, and all the
interest will go to the vault depositors. Moreover, AMM admin fees cannot be charged: their claim would fail too.
This is intentional: the system will make money on fees made by crvUSD itself.

The contract which creates the Controller can have `collateral_token()` and `borrowed_token()` public methods instead of
a `stablecoin()` method. This is to keep the code clean and understandable when a stablecoin is collateral, not borrowed.
However, compatibility with the `stablecoin()` method is preserved.

**Transfers of native ETH are removed for safety**. Multiple hacks in DeFi were due to integrators mishandling ETH transfers,
and also due to errors. To keep things safer with unknown unknowns, automatic wrapping of ETH is turned off for good.

**[:octicons-arrow-right-24: More here](./contracts/controller.md)**



## **Vault.vy**

The vault is an **implementation of the ERC4626 vault which deposits into the controller** and tracks the **progress of fees earned**. The Vault is a standard factory (non-blueprint) contract that also creates the AMM and Controller using `initialize()`.

??? quote "`initialize()`"

    Function which initializes a vault and creates the corresponding Controller and AMM contract from their blueprint implementations.

    ```python
    @external
    def initialize(
            amm_impl: address,
            controller_impl: address,
            borrowed_token: ERC20,
            collateral_token: ERC20,
            A: uint256,
            fee: uint256,
            price_oracle: PriceOracle,  # Factory makes from template if needed, deploying with a from_pool()
            monetary_policy: address,  # Standard monetary policy set in factory
            loan_discount: uint256,
            liquidation_discount: uint256
        ) -> (address, address):
        """
        @notice Initializer for vaults
        @param amm_impl AMM implementation (blueprint)
        @param controller_impl Controller implementation (blueprint)
        @param borrowed_token Token which is being borrowed
        @param collateral_token Token used for collateral
        @param A Amplification coefficient: band size is ~1/A
        @param fee Fee for swaps in AMM (for ETH markets found to be 0.6%)
        @param price_oracle Already initialized price oracle
        @param monetary_policy Already initialized monetary policy
        @param loan_discount Maximum discount. LTV = sqrt(((A - 1) / A) ** 4) - loan_discount
        @param liquidation_discount Liquidation discount. LT = sqrt(((A - 1) / A) ** 4) - liquidation_discount
        """
        assert self.borrowed_token.address == empty(address)

        self.borrowed_token = borrowed_token
        self.collateral_token = collateral_token
        self.price_oracle = price_oracle

        assert A >= MIN_A and A <= MAX_A, "Wrong A"
        assert fee <= MAX_FEE, "Fee too high"
        assert fee >= MIN_FEE, "Fee too low"
        assert liquidation_discount >= MIN_LIQUIDATION_DISCOUNT, "Liquidation discount too low"
        assert loan_discount <= MAX_LOAN_DISCOUNT, "Loan discount too high"
        assert loan_discount > liquidation_discount, "need loan_discount>liquidation_discount"

        p: uint256 = price_oracle.price()  # This also validates price oracle ABI
        assert p > 0
        assert price_oracle.price_w() == p
        A_ratio: uint256 = 10**18 * A / (A - 1)

        borrowed_precision: uint256 = 10**(18 - borrowed_token.decimals())

        amm: address = create_from_blueprint(
            amm_impl,
            borrowed_token.address, borrowed_precision,
            collateral_token.address, 10**(18 - collateral_token.decimals()),
            A, isqrt(A_ratio * 10**18), self.ln_int(A_ratio),
            p, fee, ADMIN_FEE, price_oracle.address,
            code_offset=3)
        controller: address = create_from_blueprint(
            controller_impl,
            empty(address), monetary_policy, loan_discount, liquidation_discount, amm,
            code_offset=3)
        AMM(amm).set_admin(controller)

        self.amm = AMM(amm)
        self.controller = Controller(controller)
        self.factory = Factory(msg.sender)

        # ERC20 set up
        self.precision = borrowed_precision
        borrowed_symbol: String[32] = borrowed_token.symbol()
        self.name = concat(NAME_PREFIX, borrowed_symbol)
        # Symbol must be String[32], but we do String[34]. It doesn't affect contracts which read it (they will truncate)
        # However this will be changed as soon as Vyper can *properly* manipulate strings
        self.symbol = concat(SYMBOL_PREFIX, borrowed_symbol)

        # No events because it's the only market we would ever create in this contract

        return controller, amm
    ```

**[:octicons-arrow-right-24: More here](./contracts/vault.md)**


## **OneWayLendingFactory.vy**

The factory allows the **permissionless creation of borrowing/lending markets without rehypothecation**, indicating that the collateral asset cannot be lent out. A distinctive feature is its ability to generate markets from pools with a `price_oracle()` method, eliminating the need for a separate price oracle. Nonetheless, these pools must adhere to one of the following standards: 

- **[stableswap-ng](../stableswap-exchange/stableswap-ng/overview.md)** 
- **[tricrypto-ng](../cryptoswap-exchange/tricrypto-ng/overview.md)** 
- **[twocrypto-ng](../cryptoswap-exchange/twocrypto-ng/overview.md)**.

**[:octicons-arrow-right-24: More here](./contracts/oneway-factory.md)**




## **CryptoFromPool.vy**

The price oracle contract to use the `price_oracle()` method of a Curve tricrypto-ng, twocrypto-ng or stableswap-ng pool, used by the `create_from_pool()` method.

??? quote "`create_from_pool(borrowed_token: address, collateral_token: address, A: uint256, fee: uint256, loan_discount: uint256, liquidation_discount: uint256, pool: address, name: String[64], min_borrow_rate: uint256 = 0, max_borrow_rate: uint256 = 0) -> Vault:`"

    Function to create a vault using a existing oraclized Curve pool as price oracle.

    ```python
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
    ```


## **SemilogMonetaryPolicy.vy**

Lending markets uses a semi-log monetary policy for lending markets where the **borrow rate does not depend on the crvUSD peg** but just on the **utilization of
the market**.

**[:octicons-arrow-right-24: More here](./contracts/semilog-mp.md)**