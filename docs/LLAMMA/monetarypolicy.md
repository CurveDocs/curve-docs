Monetary policy contracts are integrated into the crvUSD system and are responsible for the interest rate of crvUSD markets. When creating a new market via the factory contract, a monetary policy contract needs to be provided.


## **Interest Rates**

Markets have a **dynamic rate**, depending on **crvUSD price**, **sigma** , **target debt fraction** and the **debt of PegKeepers**.

| variable      | description   | 
| ----------- | -------|
| `r` |  `interest rate` |
| `rate0` |  `interest rate when DebtFraction = 0 (no debt in PegKeepers) and price of crvUSD = 10^18.` |
| `price_peg` |  `price crvusd is pegged to (10^18 = 1.0000)` |
| `price_crvusd` |  `current crvusd price (fetched from the price oracle contract)` |
| `DebtFraction` |  `faction of crvusd debt from pegkeepers compared to total debt` |
| `PegKeeperDebt` |  `debt form pegkeepers (all the crvusd deposited into pools?)` |
| `TotalDebt` |  `total crvusd debt` |

$r = rate0 * e^{power}$

$power = \frac{price_{peg} - price_{crvusd}}{sigma} - \frac{DebtFraction}{TargetFraction}$

$DebtFraction = \frac{PegKeeperDebt}{TotalDebt}$

!!!note
    `rate` and `rate0` are denominated in $10^{18}$ -> ${annualRate} = \frac{rate}{10^{18}} * (86400 * 365)$

!!! tip
    Useful tool by [0xreviews](https://twitter.com/0xreviews_xyz) to play around with rates: https://crvusd-rate.0xreviews.xyz/



### `rate`
!!! description "`MonetaryPolicy.rate() -> uint256: view`"

    Getter for the rate of the monetary policy contract. This is the current interest rate paid per second.
    
    Returns: rate (`uint256`).

    ??? quote "Source code"

        ```python hl_lines="3 22 26"
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

        @view
        @external
        def rate() -> uint256:
            return self.calculate_rate()
        ```

    === "Example"

        ```shell
        >>> MonetaryPolicy.rate()
        232855059
        ```


### `rate0`
!!! description "`MonetaryPolicy.rate0() -> uint256: view`"

    Getter for the rate0 of the monetary policy contract. `rate0` has to be less then or equal to `MAX_RATE` (400% APY).
    rate0 is the base rate per second when price == 1 and debt_fraction == 0 (no PegKeeper debt).

    Returns: rate0 (`uint256`).

    ??? quote "Source code"

        ```python hl_lines="1 2 9 23 24"
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
            self.admin = admin
            PRICE_ORACLE = price_oracle
            CONTROLLER_FACTORY = controller_factory
            for i in range(5):
                if peg_keepers[i].address == empty(address):
                    break
                self.peg_keepers[i] = peg_keepers[i]

            assert sigma >= MIN_SIGMA
            assert sigma <= MAX_SIGMA
            assert target_debt_fraction <= MAX_TARGET_DEBT_FRACTION
            assert rate <= MAX_RATE
            self.rate0 = rate
            self.sigma = convert(sigma, int256)
            self.target_debt_fraction = target_debt_fraction
        ```

    === "Example"

        ```shell
        >>> MonetaryPolicy.rate0()
        3022265993
        ```


### `set_rate`
!!! description "`MonetaryPolicy.set_rate(rate: uint256):`"

    Function to set a new rate0. New rate0 has to be less than or equal to `MAX_RATE (=43959106799)`.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `rate` |  `uint256` | New Rate |

    !!! warning
        This function can only be called by the `admin` of the contract, which is the CurveOwnershipAgent. Therefor it requires a DAO vote to change this parameter.

    ??? quote "Source code"

        ```python hl_lines="1 4 8 12"
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
        >>> MonetaryPolicy.set_rate("todo")
        'todo'
        ```


### `sigma`
!!! description "`MonetaryPolicy.sigma() -> int256: view`"

    Getter for the sigma value: $10^{14} <= sigma <= 10^{18}$.

    Returns: sigma (`int256`).

    ??? quote "Source code"

        ```python hl_lines="1 3 4 12 22 23 27"
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
            self.admin = admin
            PRICE_ORACLE = price_oracle
            CONTROLLER_FACTORY = controller_factory
            for i in range(5):
                if peg_keepers[i].address == empty(address):
                    break
                self.peg_keepers[i] = peg_keepers[i]

            assert sigma >= MIN_SIGMA
            assert sigma <= MAX_SIGMA
            assert target_debt_fraction <= MAX_TARGET_DEBT_FRACTION
            assert rate <= MAX_RATE
            self.rate0 = rate
            self.sigma = convert(sigma, int256)
            self.target_debt_fraction = target_debt_fraction
        ```

    === "Example"

        ```shell
        >>> MonetaryPolicy.sigma()
        20000000000000000
        ```



### `set_sigma`
!!! description "`MonetaryPolicy.set_sigma(sigma: uint256):`"

    Function to set a new sigma value.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `sigma` |  `uint256` | New Sigma |

    !!! warning
        This function can only be called by the `admin` of the contract, which is the CurveOwnershipAgent. Therefor it requires a DAO vote to change this parameter.

    ??? quote "Source code"

        ```python hl_lines="1 4 6 7 10 16"
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
        >>> MonetaryPolicy.set_sigma("todo")
        'todo'
        ```


### `target_debt_fraction`
!!! description "`MonetaryPolicy.target_debt_fraction() -> uint256: view`"

    Getter for the target debt fraction --> <= MAX_TARGET_DEBT_FRACTION ()

    ??? quote "Source code"

        ```python hl_lines="1 3 12 23 27"
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
            self.admin = admin
            PRICE_ORACLE = price_oracle
            CONTROLLER_FACTORY = controller_factory
            for i in range(5):
                if peg_keepers[i].address == empty(address):
                    break
                self.peg_keepers[i] = peg_keepers[i]

            assert sigma >= MIN_SIGMA
            assert sigma <= MAX_SIGMA
            assert target_debt_fraction <= MAX_TARGET_DEBT_FRACTION
            assert rate <= MAX_RATE
            self.rate0 = rate
            self.sigma = convert(sigma, int256)
            self.target_debt_fraction = target_debt_fraction
        ```

    === "Example"

        ```shell
        >>> MonetaryPolicy.target_debt_fraction()
        100000000000000000
        ```


### `set_target_debt_fraction`
!!! description "`MonetaryPolicy.set_target_debt_fraction(target_debt_fraction: uint256):`"

    Function to set a new target debt fraction. New value needs to be less than or equal to `MAX_TARGET_DEBT_FRACTION`.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `target_debt_fraction` |  `uint256` | New Target Debt Fraction |

    !!! warning
        This function can only be called by the `admin` of the contract, which is the CurveOwnershipAgent. Therefor it requires a DAO vote to change this parameter.

    ??? quote "Source code"

        ```python hl_lines="1 9 14"
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
        >>> MonetaryPolicy.set_target_debt_fraction("todo")
        'todo'
        ```


## **PegKeepers**
PegKeepers need to be added to the monetary policy contract in order to calculate the rate as it is depending on the DebtFraction. They can be added by calling `add_peg_keeper` and removed with `remove_peg_keeper`.

### `peg_keepers`
!!! description "`MonetaryPolicy.peg_keepers(arg0: uint256) -> address: view`"

    Getter for the PegKeeper contract at index `arg0`.

    Returns: PegKeeper contracts (`address`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `arg0` |  `uint256` | Index of the PegKeeper |

    ??? quote "Source code"

        ```python hl_lines="1 4 10 17 18 19 20"
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
            self.admin = admin
            PRICE_ORACLE = price_oracle
            CONTROLLER_FACTORY = controller_factory
            for i in range(5):
                if peg_keepers[i].address == empty(address):
                    break
                self.peg_keepers[i] = peg_keepers[i]

            assert sigma >= MIN_SIGMA
            assert sigma <= MAX_SIGMA
            assert target_debt_fraction <= MAX_TARGET_DEBT_FRACTION
            assert rate <= MAX_RATE
            self.rate0 = rate
            self.sigma = convert(sigma, int256)
            self.target_debt_fraction = target_debt_fraction
        ```

    === "Example"

        ```shell
        >>> MonetaryPolicy.peg_keepers(0)
        '0xaA346781dDD7009caa644A4980f044C50cD2ae22'
        ```


### `add_peg_keeper`
!!! description "`MonetaryPolicy.add_peg_keeper(pk: PegKeeper):`"

    Function to add a new PegKeeper.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `pk` |  `PegKeeper` | Add New PegKeeper |

    !!! warning
        This function can only be called by the `admin` of the contract.

    ??? quote "Source code"

        ```python hl_lines="1 4"
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
        >>> MonetaryPolicy.add_peg_keepers("todo")
        'todo'
        ```


### `remove_peg_keeper`
!!! description "`MonetaryPolicy.remove_peg_keeper(pk: PegKeeper):`"

    Function to remove a PegKeeper.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `pk` |  `PegKeeper` | Remove PegKeeper |

    !!! warning
        This function can only be called by the `admin` of the contract.

    ??? quote "Source code"

        ```python hl_lines="1 4"
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
        >>> MonetaryPolicy.remove_peg_keeper("todo"):
        'todo'
        ```



## **Admin Ownership**

### `admin`
!!! description "`MonetaryPolicy.admin() -> address: view`"

    Getter for the admin of the contract. ownership agent is the admin (cruvedao).

    Returns: admin (`address`).

    ??? quote "Source code"

        ```python hl_lines="1 4 11"
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
            PRICE_ORACLE = price_oracle
            CONTROLLER_FACTORY = controller_factory
            for i in range(5):
                if peg_keepers[i].address == empty(address):
                    break
                self.peg_keepers[i] = peg_keepers[i]

            assert sigma >= MIN_SIGMA
            assert sigma <= MAX_SIGMA
            assert target_debt_fraction <= MAX_TARGET_DEBT_FRACTION
            assert rate <= MAX_RATE
            self.rate0 = rate
            self.sigma = convert(sigma, int256)
            self.target_debt_fraction = target_debt_fraction
        ```

    === "Example"

        ```shell
        >>> MonetaryPolicy.admin()
        '0x40907540d8a6C65c637785e8f8B742ae6b0b9968'
        ```


### `set_admin`
!!! description "`MonetaryPolicy.set_admin(admin: address):`"

    Getter for the admin of the contract. ownership agent is the admin (cruvedao).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `admin` |  `address` | New Admin |

    ??? quote "Source code"

        ```python hl_lines="1 4 7 10"
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
        >>> MonetaryPolicy.set_admin("todo")
        'todo'
        ```


## **Contract Info Methods**

### `PRICE_ORACLE`
!!! description "`MonetaryPolicy.PRICE_ORACLE() -> address: view`"

    Getter for the price oracle contract. immutable variable (check format of how i documented other immutable variables)

    Returns: price oracle contract (`address`).

    ??? quote "Source code"

        ```python hl_lines="1 5 12"
        PRICE_ORACLE: public(immutable(PriceOracle))

        @external
        def __init__(admin: address,
                    price_oracle: PriceOracle,
                    controller_factory: ControllerFactory,
                    peg_keepers: PegKeeper[5],
                    rate: uint256,
                    sigma: uint256,
                    target_debt_fraction: uint256):
            self.admin = admin
            PRICE_ORACLE = price_oracle
            CONTROLLER_FACTORY = controller_factory
            for i in range(5):
                if peg_keepers[i].address == empty(address):
                    break
                self.peg_keepers[i] = peg_keepers[i]

            assert sigma >= MIN_SIGMA
            assert sigma <= MAX_SIGMA
            assert target_debt_fraction <= MAX_TARGET_DEBT_FRACTION
            assert rate <= MAX_RATE
            self.rate0 = rate
            self.sigma = convert(sigma, int256)
            self.target_debt_fraction = target_debt_fraction
        ```

    === "Example"

        ```shell
        >>> MonetaryPolicy.PRICE_ORACLE()
        '0xe5Afcf332a5457E8FafCD668BcE3dF953762Dfe7'
        ```


### `CONTROLLER_FACOTRY`
!!! description "`MonetaryPolicy.CONTROLLER_FACOTRY() -> address: view`"

    Getter for the controller factory contract. immutable variable!

    Returns: controller factory contract (`address`).

    ??? quote "Source code"

        ```python hl_lines="1 6 13"
        CONTROLLER_FACTORY: public(immutable(ControllerFactory))

        @external
        def __init__(admin: address,
                    price_oracle: PriceOracle,
                    controller_factory: ControllerFactory,
                    peg_keepers: PegKeeper[5],
                    rate: uint256,
                    sigma: uint256,
                    target_debt_fraction: uint256):
            self.admin = admin
            PRICE_ORACLE = price_oracle
            CONTROLLER_FACTORY = controller_factory
            for i in range(5):
                if peg_keepers[i].address == empty(address):
                    break
                self.peg_keepers[i] = peg_keepers[i]

            assert sigma >= MIN_SIGMA
            assert sigma <= MAX_SIGMA
            assert target_debt_fraction <= MAX_TARGET_DEBT_FRACTION
            assert rate <= MAX_RATE
            self.rate0 = rate
            self.sigma = convert(sigma, int256)
            self.target_debt_fraction = target_debt_fraction
        ```

    === "Example"

        ```shell
        >>> MonetaryPolicy.CONTROLLER_FACOTRY()
        '0xC9332fdCB1C491Dcc683bAe86Fe3cb70360738BC'
        ```


### `rate_write`
!!! description "`MonetaryPolicy.rate_write() -> uint256:`"

    When adding a new market via the factory contract, it calls this function to check if the MonetaryPolicy has correct ABI.

    ??? quote "Source code"

        ```python hl_lines="3 22 25 28"
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

    === "Example"

        ```shell
        >>> MonetaryPolicy.rate_write():
        'todo'
        ```