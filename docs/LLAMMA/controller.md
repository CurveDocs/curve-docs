todo


## QUERYING BASIC INFORMATION

### `factory`
!!! description "`controller.factory() -> address: view`"

    Getter of the factory contract address.

    Returns: **contract** (`address`) of the controller. 

    ??? quote "Source code"

        ```python hl_lines="1 7 17 25"
        interface Factory:
            def stablecoin() -> address: view
            def admin() -> address: view
            def fee_receiver() -> address: view
            def WETH() -> address: view

        FACTORY: immutable(Factory)

        @external
        def __init__(
                collateral_token: address,
                monetary_policy: address,
                loan_discount: uint256,
                liquidation_discount: uint256,
                amm: address):
            """
            @notice Controller constructor deployed by the factory from blueprint
            @param collateral_token Token to use for collateral
            @param monetary_policy Address of monetary policy
            @param loan_discount Discount of the maximum loan size compare to get_x_down() value
            @param liquidation_discount Discount of the maximum loan size compare to
                get_x_down() for "bad liquidation" purposes
            @param amm AMM address (Already deployed from blueprint)
            """
            FACTORY = Factory(msg.sender)
            stablecoin: ERC20 = ERC20(Factory(msg.sender).stablecoin())
            STABLECOIN = stablecoin
            assert stablecoin.decimals() == 18

            self.monetary_policy = MonetaryPolicy(monetary_policy)

            self.liquidation_discount = liquidation_discount
            self.loan_discount = loan_discount
            self._total_debt.rate_mul = 10**18

            AMM = LLAMMA(amm)
            _A: uint256 = LLAMMA(amm).A()
            A = _A
            Aminus1 = _A - 1
            LOG2_A_RATIO = self.log2(_A * 10**18 / unsafe_sub(_A, 1))

            COLLATERAL_TOKEN = ERC20(collateral_token)
            COLLATERAL_PRECISION = pow_mod256(10, 18 - ERC20(collateral_token).decimals())

            SQRT_BAND_RATIO = isqrt(unsafe_div(10**36 * _A, unsafe_sub(_A, 1)))

            stablecoin.approve(msg.sender, max_value(uint256))

            if Factory(msg.sender).WETH() == collateral_token:
                USE_ETH = True
        ```

    === "Example"
        ```shell
        >>> controller.factory()
        '0xC9332fdCB1C491Dcc683bAe86Fe3cb70360738BC
        ```

### `amm`
!!! description "`controller.amm() -> address: view`"

    Getter of the amm contract.

    Returns: **amm** (`address`) of the controller. 

    ??? quote "Source code"

        ```python hl_lines="1 9 17 30"
        AMM: immutable(LLAMMA)

        @external
        def __init__(
                collateral_token: address,
                monetary_policy: address,
                loan_discount: uint256,
                liquidation_discount: uint256,
                amm: address):
            """
            @notice Controller constructor deployed by the factory from blueprint
            @param collateral_token Token to use for collateral
            @param monetary_policy Address of monetary policy
            @param loan_discount Discount of the maximum loan size compare to get_x_down() value
            @param liquidation_discount Discount of the maximum loan size compare to
                get_x_down() for "bad liquidation" purposes
            @param amm AMM address (Already deployed from blueprint)
            """
            FACTORY = Factory(msg.sender)
            stablecoin: ERC20 = ERC20(Factory(msg.sender).stablecoin())
            STABLECOIN = stablecoin
            assert stablecoin.decimals() == 18

            self.monetary_policy = MonetaryPolicy(monetary_policy)

            self.liquidation_discount = liquidation_discount
            self.loan_discount = loan_discount
            self._total_debt.rate_mul = 10**18

            AMM = LLAMMA(amm)
            _A: uint256 = LLAMMA(amm).A()
            A = _A
            Aminus1 = _A - 1
            LOG2_A_RATIO = self.log2(_A * 10**18 / unsafe_sub(_A, 1))

            COLLATERAL_TOKEN = ERC20(collateral_token)
            COLLATERAL_PRECISION = pow_mod256(10, 18 - ERC20(collateral_token).decimals())

            SQRT_BAND_RATIO = isqrt(unsafe_div(10**36 * _A, unsafe_sub(_A, 1)))

            stablecoin.approve(msg.sender, max_value(uint256))

            if Factory(msg.sender).WETH() == collateral_token:
                USE_ETH = True
        ```

    === "Example"
        ```shell
        >>> controller.amm()
        '0x136e783846ef68C8Bd00a3369F787dF8d683a696'
        ```

### `collateral_token`
!!! description "`controller.collateral_token() -> address: view`"

    Getter of the collateral token for crvUSD.

    Returns: **collateral token** (`address`).

    ??? quote "Source code"

        ```python hl_lines="1 5 12"
        COLLATERAL_TOKEN: immutable(ERC20)

        @external
        def __init__(
                collateral_token: address,
                monetary_policy: address,
                loan_discount: uint256,
                liquidation_discount: uint256,
                amm: address):
            """
            @notice Controller constructor deployed by the factory from blueprint
            @param collateral_token Token to use for collateral
            @param monetary_policy Address of monetary policy
            @param loan_discount Discount of the maximum loan size compare to get_x_down() value
            @param liquidation_discount Discount of the maximum loan size compare to
                get_x_down() for "bad liquidation" purposes
            @param amm AMM address (Already deployed from blueprint)
            """
            FACTORY = Factory(msg.sender)
            stablecoin: ERC20 = ERC20(Factory(msg.sender).stablecoin())
            STABLECOIN = stablecoin
            assert stablecoin.decimals() == 18

            self.monetary_policy = MonetaryPolicy(monetary_policy)

            self.liquidation_discount = liquidation_discount
            self.loan_discount = loan_discount
            self._total_debt.rate_mul = 10**18

            AMM = LLAMMA(amm)
            _A: uint256 = LLAMMA(amm).A()
            A = _A
            Aminus1 = _A - 1
            LOG2_A_RATIO = self.log2(_A * 10**18 / unsafe_sub(_A, 1))

            COLLATERAL_TOKEN = ERC20(collateral_token)
            COLLATERAL_PRECISION = pow_mod256(10, 18 - ERC20(collateral_token).decimals())

            SQRT_BAND_RATIO = isqrt(unsafe_div(10**36 * _A, unsafe_sub(_A, 1)))

            stablecoin.approve(msg.sender, max_value(uint256))

            if Factory(msg.sender).WETH() == collateral_token:
                USE_ETH = True
        ```

    === "Example"
        ```shell
        >>> controller.collateral_token()
        '0xac3E018457B222d93114458476f3E3416Abbe38F'
        ```

### `debt`
!!! description "`controller.debt(user: address) -> uint256:`"

    Getter for the value of debt of an address.

    Returns: **debt** (`uint256`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `user` |  `address` | Address |

    ??? quote "Source code"

        ```python hl_lines="19"
        @internal
        @view
        def _debt_ro(user: address) -> uint256:
            """
            @notice Get the value of debt without changing the state
            @param user User address
            @return Value of debt
            """
            rate_mul: uint256 = AMM.get_rate_mul()
            loan: Loan = self.loan[user]
            if loan.initial_debt == 0:
                return 0
            else:
                return loan.initial_debt * rate_mul / loan.rate_mul

        @external
        @view
        @nonreentrant('lock')
        def debt(user: address) -> uint256:
            """
            @notice Get the value of debt without changing the state
            @param user User address
            @return Value of debt
            """
            return self._debt_ro(user)

        ```

    === "Example"
        ```shell
        >>> controller.debt("0x7a16fF8270133F063aAb6C9977183D9e72835428")
        1552311414080668514314009
        ```

### `loan_exists`
!!! description "`controller.loan_exists(user: address) -> bool:`"

    Getter method to check whether there is a loan of `user` in existence.

    Returns: **true or false** (`bool`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `user` |  `address` | Address |

    ??? quote "Source code"

        ```python hl_lines="4"
        @external
        @view
        @nonreentrant('lock')
        def loan_exists(user: address) -> bool:
            """
            @notice Check whether there is a loan of `user` in existence
            """
            return self.loan[user].initial_debt > 0
        ```

    === "Example"
        ```shell
        >>> controller.loan_exists("0x7a16fF8270133F063aAb6C9977183D9e72835428")
        'true'
        ```


### `total_debt`
!!! description "`controller.total_debt() -> uint256:`"

    Getter for the total debt of this controller.

    Returns: **total debt** (`uint256`).

    ??? quote "Source code"

        ```python hl_lines="3"
        @external
        @view
        def total_debt() -> uint256:
            """
            @notice Total debt of this controller
            """
            rate_mul: uint256 = AMM.get_rate_mul()
            loan: Loan = self._total_debt
            return loan.initial_debt * rate_mul / loan.rate_mul
        ```

    === "Example"
        ```shell
        >>> controller.total_debt()
        9045646634477681048071827
        ```

### `max_borrowable`
!!! description "`controller.max_borrowable(collateral: uint256, N: uint256) -> uint256:`"

    Getter method to calculate the maximum which can be borrowed.

    Returns: **maximum borrowable amount** (`uint256`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `collateral` |  `uint256` | Collateral amount |
    | `N` |  `uint256` | Number of bands |

    ??? quote "Source code"

        ```python hl_lines="4"
        @external
        @view
        @nonreentrant('lock')
        def max_borrowable(collateral: uint256, N: uint256) -> uint256:
            """
            @notice Calculation of maximum which can be borrowed (details in comments)
            @param collateral Collateral amount against which to borrow
            @param N number of bands to have the deposit into
            @return Maximum amount of stablecoin to borrow
            """
            # Calculation of maximum which can be borrowed.
            # It corresponds to a minimum between the amount corresponding to price_oracle
            # and the one given by the min reachable band.
            #
            # Given by p_oracle (perhaps needs to be multiplied by (A - 1) / A to account for mid-band effects)
            # x_max ~= y_effective * p_oracle
            #
            # Given by band number:
            # if n1 is the lowest empty band in the AMM
            # xmax ~= y_effective * amm.p_oracle_up(n1)
            #
            # When n1 -= 1:
            # p_oracle_up *= A / (A - 1)

            y_effective: uint256 = self.get_y_effective(collateral * COLLATERAL_PRECISION, N, self.loan_discount)

            x: uint256 = unsafe_sub(max(unsafe_div(y_effective * self.max_p_base(), 10**18), 1), 1)
            x = unsafe_div(x * (10**18 - 10**14), 10**18)  # Make it a bit smaller
            return min(x, STABLECOIN.balanceOf(self))  # Cannot borrow beyond the amount of coins Controller has
        ```

    === "Example"
        ```shell
        >>> controller.max_borrowable(1000000000000000000, 20)
        1609245276829365771473
        ```


### `min_collateral`
!!! description "`controller.min_collateral(debt: uint256, N: uint256) -> uint256:`"

    Getter method for the minimal amount of collateral required to support the debt.

    Returns: **minimal collateral amount** (`uint256`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `debt` |  `uint256` |  Debt |
    | `N` |  `uint256` | Number of bands |

    ??? quote "Source code"

        ```python hl_lines="4"
        @external
        @view
        @nonreentrant('lock')
        def min_collateral(debt: uint256, N: uint256) -> uint256:
            """
            @notice Minimal amount of collateral required to support debt
            @param debt The debt to support
            @param N Number of bands to deposit into
            @return Minimal collateral required
            """
            # Add N**2 to account for precision loss in multiple bands, e.g. N * 1 / (y/N) = N**2 / y
            return unsafe_div(unsafe_div(debt * 10**18 / self.max_p_base() * 10**18 / self.get_y_effective(10**18, N, self.loan_discount) + N * (N + 2 * DEAD_SHARES), COLLATERAL_PRECISION) * 10**18, 10**18 - 10**14)
        ```

    === "Example"
        ```shell
        >>> controller.min_collateral(1609245276829365771473, 20)
        999999846411950179
        ```


### `calculate_debt_n1`
### ``
### ``
