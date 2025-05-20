MonetaryPolicy contracts are integrated into the crvUSD ecosystem, where they play a pivotal role in determining the interest rates for crvUSD markets.

!!!deploy "Contract Source & Deployment"
    Source code is available on [Github](https://github.com/curvefi/curve-stablecoin/tree/master/contracts/mpolicies).
    Relevant contract deployments can be found [here](../references/deployed-contracts.md#curve-stablecoin).

## **Interest Rate Mechanics**

The interest rates in crvUSD markets are not static but fluctuate based on a set of factors, including:

- The price of crvUSD, which is determined through an aggregated oracle price from multiple Curve Stableswap pools ([details here](../crvUSD/priceaggregator.md)).
- The variables `sigma`, `rate0`, `TargetFraction`, and the `DebtFraction` specific to PegKeepers.

!!! tip
    A useful tool to explore and understand how the rate is affected by [0xreviews](https://twitter.com/0xreviews_xyz) is avaliable at: https://crvusd-rate.0xreviews.xyz/

The formula for calculating the interest rate (`r`) is as follows:

$$r = rate0 \cdot e^{\text{power}}$$

Where:

$$\text{power} = \frac{price_{peg} - price_{crvusd}}{sigma} - \frac{DebtFraction}{TargetFraction}$$

And the DebtFraction is defined by:

$$DebtFraction = \frac{PegKeeperDebt}{TotalDebt}$$

Key variables in this calculation include:

- `r`: the interest rate
- `rate0`: the baseline rate, applicable when PegKeepers are debt-free and the crvUSD price equals 1
- `price_peg`: the target crvUSD price, set at 1.00
- `price_crvusd`: the actual crvUSD price, aggregated from `PRICE_ORACLE.price()`
- `DebtFraction`: the portion of PegKeeper debt relative to the total outstanding debt
- `TargetFraction`: the designated target fraction
- `PegKeeperDebt`: the cumulative debt of all PegKeepers
- `TotalDebt`: the aggregate crvUSD debt

For accuracy and consistency, both `rate` and `rate0` are expressed in terms of $10^{18}$ to denote precision and are calculated per second.

The annualized interest rate can be computed as:

$$\text{annualRate} = (1 + \frac{rate}{10^{18}})^{365 \times 24 \times 60 \times 60} - 1$$


---

### `rate`
!!! description "`MonetaryPolicy.rate() -> uint256: view`"

    Getter for the rate of the monetary policy contract. This is the current interest rate paid per second.

    Returns: rate (`uint256`).

    ??? quote "Source code"

        === "MonetaryPolicy.vy"

            ```vyper
            @view
            @external
            def rate() -> uint256:
                return self.calculate_rate()

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
            ```

    === "Example"

        ```shell
        >>> MonetaryPolicy.rate()
        2130219534
        ```


### `rate0`
!!! description "`MonetaryPolicy.rate0() -> uint256: view`"

    Getter for the `rate0` of the monetary policy contract. `rate0` has to be less than or equal to `MAX_RATE` (400% APY).

    Returns: rate0 (`uint256`).

    ??? quote "Source code"

        === "MonetaryPolicy.vy"

            ```vyper
            MAX_RATE: constant(uint256) = 43959106799  # 400% APY
            rate0: public(uint256)

            @external
            def __init__(admin: address,
                        price_oracle: PriceOracle,
                        controller_factory: ControllerFactory,
                        peg_keepers: PegKeeper[5],
                        rate: uint256,
                        sigma: uint256,
                        target_debt_fraction: uint256):
                ...

                assert rate <= MAX_RATE
                self.rate0 = rate

                ...
            ```

    === "Example"

        ```shell
        >>> MonetaryPolicy.rate0()
        3488077118
        ```


### `set_rate`
!!! description "`MonetaryPolicy.set_rate(rate: uint256):`"

    !!!guard "Guarded Method"
        This function is only callable by the `admin` of the contract, which is the CurveOwnershipAgent.

    Function to set a new rate0. New `rate0` has to be less than or equal to `MAX_RATE (=43959106799)`.

    Emits: `SetRate`

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `rate` |  `uint256` | New rate0 value |

    ??? quote "Source code"

        === "MonetaryPolicy.vy"

            ```vyper
            event SetRate:
                rate: uint256

            MAX_RATE: constant(uint256) = 43959106799  # 400% APY
            rate0: public(uint256)

            @external
            def set_rate(rate: uint256):
                assert msg.sender == self.admin
                assert rate <= MAX_RATE
                self.rate0 = rate
                log SetRate(rate)
            ```

    === "Example"

        ```shell
        >>> MonetaryPolicy.set_rate(3488077118)
        ```


### `sigma`
!!! description "`MonetaryPolicy.sigma() -> uint256: view`"

    Getter for the sigma value. The following needs to hold: $10^{14} <= sigma <= 10^{18}$.

    Returns: sigma (`uint256`).

    ??? quote "Source code"

        === "MonetaryPolicy.vy"

            ```vyper
            sigma: public(int256)  # 2 * 10**16 for example

            MAX_SIGMA: constant(uint256) = 10**18
            MIN_SIGMA: constant(uint256) = 10**14

            @external
            def __init__(admin: address,
                        price_oracle: PriceOracle,
                        controller_factory: ControllerFactory,
                        peg_keepers: PegKeeper[5],
                        rate: uint256,
                        sigma: uint256,
                        target_debt_fraction: uint256):
                ...

                assert sigma >= MIN_SIGMA
                assert sigma <= MAX_SIGMA

                ...
            ```

    === "Example"

        ```shell
        >>> MonetaryPolicy.sigma()
        20000000000000000
        ```


### `set_sigma`
!!! description "`MonetaryPolicy.set_sigma(sigma: uint256):`"

    !!!guard "Guarded Method"
        This function is only callable by the `admin` of the contract, which is the CurveOwnershipAgent.

    Function to set a new sigma value. New value must be inbetween `MIN_SIGMA` and `MAX_SIGMA`.

    Emits: `SetSigma`

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `sigma` |  `uint256` | New sigma value |

    ??? quote "Source code"

        === "MonetaryPolicy.vy"

            ```vyper
            event SetSigma:
                sigma: uint256

            sigma: public(int256)  # 2 * 10**16 for example

            MAX_SIGMA: constant(uint256) = 10**18
            MIN_SIGMA: constant(uint256) = 10**14

            @external
            def set_sigma(sigma: uint256):
                assert msg.sender == self.admin
                assert sigma >= MIN_SIGMA
                assert sigma <= MAX_SIGMA

                self.sigma = convert(sigma, int256)
                log SetSigma(sigma)
            ```

    === "Example"

        ```shell
        >>> MonetaryPolicy.set_sigma(30000000000000000)
        ```


### `target_debt_fraction`
!!! description "`MonetaryPolicy.target_debt_fraction() -> uint256: view`"

    Getter for the debt fraction target.

    Returns: target debt fraction (`uint256`).

    ??? quote "Source code"

        === "MonetaryPolicy.vy"

            ```vyper
            MAX_TARGET_DEBT_FRACTION: constant(uint256) = 10**18

            target_debt_fraction: public(uint256)

            @external
            def __init__(admin: address,
                        price_oracle: PriceOracle,
                        controller_factory: ControllerFactory,
                        peg_keepers: PegKeeper[5],
                        rate: uint256,
                        sigma: uint256,
                        target_debt_fraction: uint256):
                ...

                self.target_debt_fraction = target_debt_fraction
            ```

    === "Example"

        ```shell
        >>> MonetaryPolicy.target_debt_fraction()
        100000000000000000              # 10%
        ```


### `set_target_debt_fraction`
!!! description "`MonetaryPolicy.set_target_debt_fraction(target_debt_fraction: uint256):`"

    !!!guard "Guarded Method"
        This function is only callable by the `admin` of the contract, which is the CurveOwnershipAgent.

    Function to set a new value for the debt fraction target. New value needs to be less than or equal to `MAX_TARGET_DEBT_FRACTION`.

    Emits: `SetTargetDebtFraction`

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `target_debt_fraction` |  `uint256` | New debt fraction target value |

    ??? quote "Source code"

        === "MonetaryPolicy.vy"

            ```vyper
            event SetTargetDebtFraction:
                target_debt_fraction: uint256

            MAX_TARGET_DEBT_FRACTION: constant(uint256) = 10**18

            target_debt_fraction: public(uint256)

            @external
            def set_target_debt_fraction(target_debt_fraction: uint256):
                assert msg.sender == self.admin
                assert target_debt_fraction <= MAX_TARGET_DEBT_FRACTION

                self.target_debt_fraction = target_debt_fraction
                log SetTargetDebtFraction(target_debt_fraction)
            ```

    === "Example"

        ```shell
        >>> MonetaryPolicy.set_target_debt_fraction(200000000000000000)
        ```



## **PegKeepers**
PegKeepers must be added to the MonetaryPolicy contract to calculate the rate as it depends on the *DebtFraction*. They can be added by calling `add_peg_keeper` and removed via `remove_peg_keeper`.


### `peg_keepers`
!!! description "`MonetaryPolicy.peg_keepers(arg0: uint256) -> address: view`"

    Getter for the PegKeeper contract at index `arg0`.

    Returns: PegKeeper contracts (`address`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `arg0` |  `uint256` | Index of the PegKeeper |

    ??? quote "Source code"

        === "MonetaryPolicy.vy"

            ```vyper
            interface PegKeeper:
                def debt() -> uint256: view

            peg_keepers: public(PegKeeper[1001])

            @external
            def __init__(admin: address,
                        price_oracle: PriceOracle,
                        controller_factory: ControllerFactory,
                        peg_keepers: PegKeeper[5],
                        rate: uint256,
                        sigma: uint256,
                        target_debt_fraction: uint256):
                ...

                for i in range(5):
                    if peg_keepers[i].address == empty(address):
                        break
                    self.peg_keepers[i] = peg_keepers[i]

                ...
            ```

    === "Example"

        ```shell
        >>> MonetaryPolicy.peg_keepers(0)
        '0xaA346781dDD7009caa644A4980f044C50cD2ae22'
        ```


### `add_peg_keeper`
!!! description "`MonetaryPolicy.add_peg_keeper(pk: PegKeeper):`"

    !!!guard "Guarded Method"
        This function is only callable by the `admin` of the contract.

    Function to add an existing PegKeeper to the monetary policy contract.

    Emits: `AddPegKeeper`

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `pk` |  `PegKeeper` | PegKeeper address to add |

    ??? quote "Source code"

        === "MonetaryPolicy.vy"

            ```vyper
            event AddPegKeeper:
                peg_keeper: indexed(address)

            peg_keepers: public(PegKeeper[1001])

            @external
            def add_peg_keeper(pk: PegKeeper):
                assert msg.sender == self.admin
                assert pk.address != empty(address)
                for i in range(1000):
                    _pk: PegKeeper = self.peg_keepers[i]
                    assert _pk != pk, "Already added"
                    if _pk.address == empty(address):
                        self.peg_keepers[i] = pk
                        log AddPegKeeper(pk.address)
                        break
            ```

    === "Example"

        ```shell
        >>> MonetaryPolicy.add_peg_keeper("PegKeeper address")
        ```


### `remove_peg_keeper`
!!! description "`MonetaryPolicy.remove_peg_keeper(pk: PegKeeper):`"

    !!!guard "Guarded Method"
        This function is only callable by the `admin` of the contract.

    Function to remove an existing PegKeeper from the monetary policy contract.

    Emits: `RemovePegKeeper`

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `pk` |  `PegKeeper` | PegKeeper address to remove |

    ??? quote "Source code"

        === "MonetaryPolicy.vy"

            ```vyper
            event RemovePegKeeper:
                peg_keeper: indexed(address)

            peg_keepers: public(PegKeeper[1001])

            @external
            def remove_peg_keeper(pk: PegKeeper):
                assert msg.sender == self.admin
                replaced_peg_keeper: uint256 = 10000
                for i in range(1001):  # 1001th element is always 0x0
                    _pk: PegKeeper = self.peg_keepers[i]
                    if _pk == pk:
                        replaced_peg_keeper = i
                        log RemovePegKeeper(pk.address)
                    if _pk.address == empty(address):
                        if replaced_peg_keeper < i:
                            if replaced_peg_keeper < i - 1:
                                self.peg_keepers[replaced_peg_keeper] = self.peg_keepers[i - 1]
                            self.peg_keepers[i - 1] = PegKeeper(empty(address))
                        break
            ```

    === "Example"

        ```shell
        >>> MonetaryPolicy.remove_peg_keeper("PegKeeper address"):
        ```



## **Admin Ownership**

### `admin`
!!! description "`MonetaryPolicy.admin() -> address: view`"

    Getter for the admin of the contract, which is the CurveOwnershipAgent.

    Returns: admin (`address`).

    ??? quote "Source code"

        === "MonetaryPolicy.vy"

            ```vyper
            admin: public(address)

            @external
            def __init__(admin: address,
                        price_oracle: PriceOracle,
                        controller_factory: ControllerFactory,
                        peg_keepers: PegKeeper[5],
                        rate: uint256,
                        sigma: uint256,
                        target_debt_fraction: uint256):
                self.admin = admin

                ...
            ```

    === "Example"

        ```shell
        >>> MonetaryPolicy.admin()
        '0x40907540d8a6C65c637785e8f8B742ae6b0b9968'
        ```


### `set_admin`
!!! description "`MonetaryPolicy.set_admin(admin: address):`"

    !!!guard "Guarded Method"
        This function is only callable by the `admin` of the contract, which is the CurveOwnershipAgent.

    Function to set a new admin.

    Emits: `SetAdmin`

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `admin` |  `address` | New admin address |

    ??? quote "Source code"

        === "MonetaryPolicy.vy"

            ```vyper
            event SetAdmin:
                admin: address

            admin: public(address)

            @external
            def set_admin(admin: address):
                assert msg.sender == self.admin
                self.admin = admin
                log SetAdmin(admin)
            ```

    === "Example"

        ```shell
        >>> MonetaryPolicy.set_admin("0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045")
        ```



## **Contract Info Methods**

### `PRICE_ORACLE`
!!! description "`MonetaryPolicy.PRICE_ORACLE() -> address: view`"

    Getter for the price oracle contract.

    Returns: price oracle contract (`address`).

    ??? quote "Source code"

        === "MonetaryPolicy.vy"

            ```vyper
            PRICE_ORACLE: public(immutable(PriceOracle))

            @external
            def __init__(admin: address,
                        price_oracle: PriceOracle,
                        controller_factory: ControllerFactory,
                        peg_keepers: PegKeeper[5],
                        rate: uint256,
                        sigma: uint256,
                        target_debt_fraction: uint256):
                ...

                PRICE_ORACLE = price_oracle

                ...
            ```

    === "Example"

        ```shell
        >>> MonetaryPolicy.PRICE_ORACLE()
        '0x18672b1b0c623a30089A280Ed9256379fb0E4E62'
        ```


### `CONTROLLER_FACOTRY`
!!! description "`MonetaryPolicy.CONTROLLER_FACOTRY() -> address: view`"

    Getter for the controller factory contract. immutable variable!

    Returns: controller factory contract (`address`).

    ??? quote "Source code"

        === "MonetaryPolicy.vy"

            ```vyper
            CONTROLLER_FACTORY: public(immutable(ControllerFactory))

            @external
            def __init__(admin: address,
                        price_oracle: PriceOracle,
                        controller_factory: ControllerFactory,
                        peg_keepers: PegKeeper[5],
                        rate: uint256,
                        sigma: uint256,
                        target_debt_fraction: uint256):
                ...

                CONTROLLER_FACTORY = controller_factory

                ...
            ```

    === "Example"

        ```shell
        >>> MonetaryPolicy.CONTROLLER_FACOTRY()
        '0xC9332fdCB1C491Dcc683bAe86Fe3cb70360738BC'
        ```


### `rate_write`
!!! description "`MonetaryPolicy.rate_write() -> uint256:`"

    When adding a new market via the factory contract, `rate_write` is called to check if the MonetaryPolicy contract has the correct ABI.

    ??? quote "Source code"

        === "MonetaryPolicy.vy"

            ```vyper
            @external
            def rate_write() -> uint256:
                # Not needed here but useful for more automated policies
                # which change rate0 - for example rate0 targeting some fraction pl_debt/total_debt
                return self.calculate_rate()

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
            ```

    === "Example"

        ```shell
        >>> MonetaryPolicy.rate_write()
        ```
