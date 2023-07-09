monetary policy contracts are integrated into the crvusd system. every market has its policy. some are different to others. e.g. sfrxeth and wsteth have a higher rate than wbtc and eth, etc...
explain what the contract does etc.




## **Contract Info Methods** (how to call this?)
### `rate` (where is `rate` variable)
!!! description "`MonetaryPolicy.rate() -> uint256: view`"

    Getter for the rate of the monetary policy contract. rate has to be smaller or equal to `MAX_RATE` (400% APY).

    Returns: rate (`uint256`).

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
        >>> MonetaryPolicy.rate()
        232855059
        ```


### `rate0` (fix)
!!! description "`MonetaryPolicy.rate0() -> uint256: view`"

    Getter for the rate0 of the monetary policy contract. `rate0` has to be smaller or equal to `MAX_RATE` (400% APY).

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
        >>> MonetaryPolicy.rate()
        232855059
        ```


### `set_rate`
!!! description "`MonetaryPolicy.set_rate(rate: uint256):`"

    Function to set a new rate. Rate has to be smaller or equal to `MAX_RATE`.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `rate` |  `uint256` | New Rate |

    !!! warning
        This function can only be called by the `admin` of the contract.

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

    Getter for the sigma value. sigma value --> 10**14 <= sigma <=10**18

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

    Function to set a new sigma value. Need value needs to be 10**14 <= sigma <=10**18 again.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `sigma` |  `uint256` | New Sigma |

    !!! warning
        This function can only be called by the `admin` of the contract.

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

    Function to set a new target debt fraction. needs to be within --> <= MAX_TARGET_DEBT_FRACTION ()

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `target_debt_fraction` |  `uint256` | New Target Debt Fraction |

    !!! warning
        This function can only be called by the `admin` of the contract.

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



## **Ownership**
why no future_admin -> apply_future_admin approach???


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

    Returns: admin (`address`).

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



# **PegKeepers**
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

### `remove_peg_keeper`


### `rate_write`

