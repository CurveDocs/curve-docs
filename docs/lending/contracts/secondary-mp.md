<h1>Secondary Monetary Policy</h1>

The `SecondaryMonetaryPolicy` contract calculates borrow rates based on the utilization in a lending market. It uses parameters derived from the target utilization and ratios at 0% and 100% utilization to define a hyperbolic dependency. The rate is dynamically adjusted based on the current utilization and the rate from the AMM (Automated Market Maker), which mints crvUSD.

This design ensures that when the target utilization is met, the borrow rate in the lending market matches the borrow rate of the minting market. At 0% utilization, the rate is defined as \(\alpha \times \text{rate}_{\text{AMM}}\) and at 100% utilization as \(\beta \times \text{rate}_{\text{AMM}}\).

!!!github "GitHub"
    The source code of the `SecondaryMonetaryPolicy.vy` contract can be found on [:material-github: GitHub](https://github.com/curvefi/curve-stablecoin/blob/master/contracts/mpolicies/SecondaryMonetaryPolicy.vy).

---

## **Calculations**

!!!colab "Google Colab Notebook"
    An interactive Google Colab notebook that plots the interest rate depending on utilization can be found here: [https://colab.research.google.com/drive/1lU0SWtvQoJHNe7pLiKD33nYBKacljhck?usp=sharing](https://colab.research.google.com/drive/1lU0SWtvQoJHNe7pLiKD33nYBKacljhck?usp=sharing).


### **Borrow Rate**

The formula for calculating the borrow rate is as follows:

$$\text{rate} = \text{rate}_{\text{AMM}} \left( r_{\text{minf}} + \frac{A}{u_{\text{inf}} - \text{utilization}} \right) + \text{shift}$$

$\text{shift}$ is an additional value which shifts the entire rate curve up or down by a specified amount.[^1]

[^1]: This kind of rate shift is rarely used but is applied, for example, in the wstETH lending market. The `SecondaryMonetaryPolicy` of that market does not follow the wstETH mint market but follows the wETH mint market instead, with a +4% shift applied to the rate. This is done because the "more fair" interest rate is the wETH rate plus the staking rate (which is approximately 4%).


### **Parameters**

Depending on **target utilization ( \(u_0\) )**, **rate ratio at 0% utilization ( \(\alpha\) )**, and **rate ratio at 100% utilization ( \(\beta\) )**, the coefficients for the hyperbolic dependency are calculated as follows:

$$u_{\text{inf}} = \frac{(\beta - 1) \times u_0}{(\beta - 1) \times u_0 - (1 - u_0) \times (1 - \alpha)}$$

$$A = (1 - \alpha) \times (u_{\text{inf}} - u_0) \times \frac{u_{\text{inf}}}{u_0}$$

$$r_{\text{minf}} = \alpha - \frac{A}{u_{\text{inf}}}$$


*Where:*

- \(u_0 = \text{target utilization}\)
- \(\alpha = \text{low ratio}\)
- \(\beta = \text{high ratio}\)

Alpha ($\alpha$) and Beta ($\beta$) essentially determine how the borrow rate scales with utilization. For example:

- Alpha ($\alpha$): This is the ratio of the borrowing rate to the AMM rate at 0% utilization. If you set $\alpha$ to 1%, it means that when the utilization is 0%, the borrowing rate will be 1% of the rate provided by the AMM.
- Beta ($\beta$): This is the ratio of the borrowing rate to the AMM rate at 100% utilization. If you set $\beta$ to 50%, it means that when the utilization is 100%, the borrowing rate will be 50% of the rate provided by the AMM.
 

!!!info "Setting Parameters"
    `target_utilization`, `low_ratio`, and `high_ratio` are set when deploying the contract. The values can later only be changed by the `admin` of the contract. For more, see here: [`set_parameters`](#set_parameters).

    Also, the `A` parameter has nothing to do with the amplification coefficient used in Curve AMMs.


---


## **Rates**

**The rate values are based on 1e18 and NOT annualized.** 

*To calculate the Borrow APR (annualized):*

$$\text{borrowAPR} = \frac{\text{rate} * 365 * 86400}{10^{18}}$$

Rate calculations occur within the MonetaryPolicy contract. The rate is regularly updated by the internal `_save_rate` method in the Controller. This happens whenever a new loan is initiated (`_create_loan`), collateral is either added (`add_collateral`) or removed (`remove_collateral`), additional debt is incurred (`borrow_more` and `borrow_more_extended`), debt is repaid (`repay`, `repay_extended`), or a loan undergoes liquidation (`_liquidate`).

??? quote "Source Code"

    === "Controller.vy"

        ```vyper
        @internal
        def _save_rate():
            """
            @notice Save current rate
            """
            rate: uint256 = min(self.monetary_policy.rate_write(), MAX_RATE)
            AMM.set_rate(rate)
        ```

    === "MonetaryPolicy.vy"

        ```vyper
        struct Parameters:
            u_inf: uint256
            A: uint256
            r_minf: uint256

        parameters: public(Parameters)

        @external
        def rate_write(_for: address = msg.sender) -> uint256:
            return self.calculate_rate(_for, 0, 0)  

        @internal
        @view
        def calculate_rate(_for: address, d_reserves: int256, d_debt: int256) -> uint256:
            p: Parameters = self.parameters
            total_debt: int256 = convert(Controller(_for).total_debt(), int256)
            total_reserves: int256 = convert(BORROWED_TOKEN.balanceOf(_for), int256) + total_debt + d_reserves
            total_debt += d_debt
            assert total_debt >= 0, "Negative debt"
            assert total_reserves >= total_debt, "Reserves too small"

            u: uint256 = 0
            if total_reserves > 0:
                u = convert(total_debt * 10**18  / total_reserves, uint256)
            r0: uint256 = AMM.rate()

            return r0 * p.r_minf / 10**18 + p.A * r0 / (p.u_inf - u) + p.shift
        ```

    === "AMM.vy"

        ```vyper
        @external
        @nonreentrant('lock')
        def set_rate(rate: uint256) -> uint256:
            """
            @notice Set interest rate. That affects the dependence of AMM base price over time
            @param rate New rate in units of int(fraction * 1e18) per second
            @return rate_mul multiplier (e.g. 1.0 + integral(rate, dt))
            """
            assert msg.sender == self.admin
            rate_mul: uint256 = self._rate_mul()
            self.rate_mul = rate_mul
            self.rate_time = block.timestamp
            self.rate = rate
            log SetRate(rate, rate_mul, block.timestamp)
            return rate_mul
        ```


### `rate`
!!! description "`MonetaryPolicy.rate(_for: address = msg.sender) -> uint256`"

    Getter for the borrow rate for a specific lending market.

    Returns: rate (`uint256`).

    | Input   | Type      | Description                                                                                          |
    | ------- | --------- | ---------------------------------------------------------------------------------------------------- |
    | `_for`  | `address` | Contract to calculate the rate for. Defaults to `msg.sender`, as the caller of the function is usually the Controller. |

    ??? quote "Source code"

        === "MonetaryPolicy.vy"

            ```python
            @view
            @external
            def rate(_for: address = msg.sender) -> uint256:
                return self.calculate_rate(_for, 0, 0)

            @internal
            @view
            def calculate_rate(_for: address, d_reserves: int256, d_debt: int256) -> uint256:
                p: Parameters = self.parameters
                total_debt: int256 = convert(Controller(_for).total_debt(), int256)
                total_reserves: int256 = convert(BORROWED_TOKEN.balanceOf(_for), int256) + total_debt + d_reserves
                total_debt += d_debt
                assert total_debt >= 0, "Negative debt"
                assert total_reserves >= total_debt, "Reserves too small"

                u: uint256 = 0
                if total_reserves > 0:
                    u = convert(total_debt * 10**18  / total_reserves, uint256)
                r0: uint256 = AMM.rate()

                return r0 * p.r_minf / 10**18 + p.A * r0 / (p.u_inf - u) + p.shift
            ```

    === "Example"
        ```shell
        >>> soon
        ```


### `future_rate`
!!! description "`MonetaryPolicy.future_rate(_for: address, d_reserves: int256, d_debt: int256) -> uint256`"

    Function to calculate the future borrow rate for a lending market given a specific change in reserves and debt.

    Returns: future borrow rate (`uint256`).

    | Input        | Type      | Description              |
    | ------------ | --------- | ------------------------ |
    | `_for`       | `address` | Controller contract to calculate the future rate for.      |
    | `d_reserves` | `int256`  | Change in reserve assets.|
    | `d_debt`     | `int256`  | Change in debt.          |

    ??? quote "Source code"

        === "MonetaryPolicy.vy"

            ```python
            @view
            @external
            def future_rate(_for: address, d_reserves: int256, d_debt: int256) -> uint256:
                return self.calculate_rate(_for, d_reserves, d_debt)

            @internal
            @view
            def calculate_rate(_for: address, d_reserves: int256, d_debt: int256) -> uint256:
                p: Parameters = self.parameters
                total_debt: int256 = convert(Controller(_for).total_debt(), int256)
                total_reserves: int256 = convert(BORROWED_TOKEN.balanceOf(_for), int256) + total_debt + d_reserves
                total_debt += d_debt
                assert total_debt >= 0, "Negative debt"
                assert total_reserves >= total_debt, "Reserves too small"

                u: uint256 = 0
                if total_reserves > 0:
                    u = convert(total_debt * 10**18  / total_reserves, uint256)
                r0: uint256 = AMM.rate()

                return r0 * p.r_minf / 10**18 + p.A * r0 / (p.u_inf - u) + p.shift
            ```

    === "Example"
        ```shell
        >>> soon
        ```


### `rate_write`
!!! description "`MonetaryPolicy.rate_write(_for: address = msg.sender) -> uint256:`"

    Function to calculate the rate of a lending market, similar to the `rate` method. However, the key difference is that this function updates the rate and therefore changes the state of the blockchain. This method is usually called by the Controller.

    Returns: updated rate (`uint256`).

    | Input   | Type      | Description                                                                                          |
    | ------- | --------- | ---------------------------------------------------------------------------------------------------- |
    | `_for`  | `address` | Contract to calculate the rate for. Defaults to `msg.sender`, as the caller of the function is usually the Controller. |

    ??? quote "Source code"

        === "MonetaryPolicy.vy"

            ```python
            @external
            def rate_write(_for: address = msg.sender) -> uint256:
                return self.calculate_rate(_for, 0, 0)

            @internal
            @view
            def calculate_rate(_for: address, d_reserves: int256, d_debt: int256) -> uint256:
                p: Parameters = self.parameters
                total_debt: int256 = convert(Controller(_for).total_debt(), int256)
                total_reserves: int256 = convert(BORROWED_TOKEN.balanceOf(_for), int256) + total_debt + d_reserves
                total_debt += d_debt
                assert total_debt >= 0, "Negative debt"
                assert total_reserves >= total_debt, "Reserves too small"

                u: uint256 = 0
                if total_reserves > 0:
                    u = convert(total_debt * 10**18  / total_reserves, uint256)
                r0: uint256 = AMM.rate()

                return r0 * p.r_minf / 10**18 + p.A * r0 / (p.u_inf - u) + p.shift
            ```

    === "Example"
        ```shell
        >>> soon
        ```


---


## **Parameters**

The contract includes a `Parameters` struct that holds values essential for the hyperbolic dependency model used in borrow rate calculations. This struct consists of `u_inf`, `A`, `r_minf`, and `shift`, which are derived from the **target utilization ($u_0$)**, the rate ratio at **0% utilization ($\alpha$)**, and the rate ratio at **maximum utilization ($\beta$)**. These parameters are initially computed using the internal `get_params` function during contract initialization and are recalculated whenever new parameter values are set through the [`set_parameters`](#set_parameters) method. This struct and the associated calculations ensure the borrow rates adjust dynamically based on fund utilization.



```python
struct Parameters:
    u_inf: uint256
    A: uint256
    r_minf: uint256
    shift: uint256

@internal
def get_params(u_0: uint256, alpha: uint256, beta: uint256, rate_shift: uint256) -> Parameters:
    p: Parameters = empty(Parameters)
    p.u_inf = (beta - 10**18) * u_0 / (((beta - 10**18) * u_0 - (10**18 - u_0) * (10**18 - alpha)) / 10**18)
    p.A = (10**18 - alpha) * p.u_inf / 10**18 * (p.u_inf - u_0) / u_0
    p.r_minf = alpha - p.A * 10**18 / p.u_inf
    p.shift = rate_shift
    return p
```

For parameter calculations see [here](#parameters).


---


### `parameters`
!!! description "`MonetaryPolicy.parameters() -> tuple: view`"

    Getter for the parameters of the monetary policy. These parameters can be changed by the admin of the contract using the `set_parameters` function. This function does NOT return the `target_rate` ($u_0$), `low_ratio` ($\alpha$), or `high_ratio` ($\beta$), but rather the derived parameters based on those values.

    Returns: u_inf (`uint256`), A (`uint256`), r_minf (`uint256`) and shift (`uint256`).

    ??? quote "Source code"

        === "MonetaryPolicy.vy"

            ```python
            struct Parameters:
                u_inf: uint256
                A: uint256
                r_minf: uint256
                shift: uint256

            parameters: public(Parameters)
            ```

    === "Example"
        ```shell
        >>> MonetaryPolicy.parameters()         # mp for BTC lending market (follows wBTC mint market)
        1046153846153846153, 120710059171597632, 384615384615384617, 0

        >>> MonetaryPolicy.parameters()         # mp for wstETH lending market (follows wETH mint market)
        1046153846153846153, 120710059171597632, 384615384615384617, 1268391679
        ```

    !!!note "Added shift in wstETH Lending Market"
        The `SecondaryMonetaryPolicy` for the wstETH market includes a shift of 1268391679, because this policy follows the ETH mint market and adds this additional shift to the interest rate curve as it is more fair to use the ETH rate + staking rate:

        $shift = \frac{1268391679 \times 365 \times 86400}{10^{18}} = 0.04$



### `set_parameters`
!!! description "`MonetaryPolicy.set_parameters(target_utilization: uint256, low_ratio: uint256, high_ratio: uint256, rate_shift: uint256)`"

    !!!guard "Guarded Method"
        This function is only callable by the `admin` of the contract.

    Function to update the rate of a lending market.

    Emits: `SetParameters`

    | Input                | Type      | Description                                                                           |
    | -------------------- | --------- | ------------------------------------------------------------------------------------- |
    | `target_utilization` | `uint256` | Target ratio of the market utilization. Needs to be between 1% and 99%, usually set to 80%. |
    | `low_ratio`          | `uint256` | Low ratio. Needs to be higher than 1%.                                                |
    | `high_ratio`         | `uint256` | High ratio. Needs to be lower than 100%.                                              |
    | `rate_shift`         | `uint256` | Value by which the rate curve is shifted.                                                |

    ??? quote "Source code"

        === "MonetaryPolicy.vy"

            ```python
            event SetParameters:
                u_inf: uint256
                A: uint256
                r_minf: uint256
                shift: uint256

            struct Parameters:
                u_inf: uint256
                A: uint256
                r_minf: uint256
                shift: uint256

            MIN_UTIL: constant(uint256) = 10**16
            MAX_UTIL: constant(uint256)  = 99 * 10**16
            MIN_LOW_RATIO: constant(uint256)  = 10**16
            MAX_HIGH_RATIO: constant(uint256) = 100 * 10**18
            MAX_RATE_SHIFT: constant(uint256) = 100 * 10**18

            parameters: public(Parameters)

            @external
            def set_parameters(target_utilization: uint256, low_ratio: uint256, high_ratio: uint256, rate_shift: uint256):
                """
                @param target_utilization Utilization at which borrow rate is the same as in AMM
                @param low_ratio Ratio rate/target_rate at 0% utilization
                @param high_ratio Ratio rate/target_rate at 100% utilization
                @param rate_shift Shift all the rate curve by this rate
                """
                assert msg.sender == FACTORY.admin()

                assert target_utilization >= MIN_UTIL
                assert target_utilization <= MAX_UTIL
                assert low_ratio >= MIN_LOW_RATIO
                assert high_ratio <= MAX_HIGH_RATIO
                assert low_ratio < high_ratio
                assert rate_shift <= MAX_RATE_SHIFT

                p: Parameters = self.get_params(target_utilization, low_ratio, high_ratio, rate_shift)
                self.parameters = p
                log SetParameters(p.u_inf, p.A, p.r_minf, p.shift)

            @internal
            def get_params(u_0: uint256, alpha: uint256, beta: uint256, rate_shift: uint256) -> Parameters:
                p: Parameters = empty(Parameters)
                p.u_inf = (beta - 10**18) * u_0 / (((beta - 10**18) * u_0 - (10**18 - u_0) * (10**18 - alpha)) / 10**18)
                p.A = (10**18 - alpha) * p.u_inf / 10**18 * (p.u_inf - u_0) / u_0
                p.r_minf = alpha - p.A * 10**18 / p.u_inf
                p.shift = rate_shift
                return p
            ```

    === "Example"
        ```shell
        >>> soon
        ```


---


## **Contract Info Methods**

### `AMM`
!!! description "`MonetaryPolicy.parameters() -> tuple: view`"

    Getter for the AMM contract (used for minting crvUSD), which is used for rate comparison.

    Returns: AMM contract (`address`).

    ??? quote "Source code"

        === "MonetaryPolicy.vy"

            ```python
            AMM: public(immutable(IAMM))

            @external
            def __init__(factory: Factory, amm: IAMM, borrowed_token: ERC20,
                        target_utilization: uint256, low_ratio: uint256, high_ratio: uint256, rate_shift: uint256):
                """
                @param factory Factory contract
                @param amm AMM to take borrow rate from as a basis
                @param borrowed_token Borrowed token in the market (e.g. crvUSD)
                @param target_utilization Utilization at which borrow rate is the same as in AMM
                @param low_ratio Ratio rate/target_rate at 0% utilization
                @param high_ratio Ratio rate/target_rate at 100% utilization
                @param rate_shift Shift all the rate curve by this rate
                """
                assert target_utilization >= MIN_UTIL
                assert target_utilization <= MAX_UTIL
                assert low_ratio >= MIN_LOW_RATIO
                assert high_ratio <= MAX_HIGH_RATIO
                assert low_ratio < high_ratio
                assert rate_shift <= MAX_RATE_SHIFT

                FACTORY = factory
                AMM = amm
                BORROWED_TOKEN = borrowed_token
                p: Parameters = self.get_params(target_utilization, low_ratio, high_ratio, rate_shift)
                self.parameters = p
                log SetParameters(p.u_inf, p.A, p.r_minf, p.shift)
            ```

    === "Example"
        ```shell
        >>> MonetaryPolicy.AMM()
        '0xE0438Eb3703bF871E31Ce639bd351109c88666ea'
        ```


### `BORROWED_TOKEN`
!!! description "`MonetaryPolicy.parameters() -> tuple: view`"

    Getter for the token borrowed from the lending market.

    Returns: token contract (`address`).

    ??? quote "Source code"

        === "MonetaryPolicy.vy"

            ```python
            BORROWED_TOKEN: public(immutable(ERC20))

            @external
            def __init__(factory: Factory, amm: IAMM, borrowed_token: ERC20,
                        target_utilization: uint256, low_ratio: uint256, high_ratio: uint256, rate_shift: uint256):
                """
                @param factory Factory contract
                @param amm AMM to take borrow rate from as a basis
                @param borrowed_token Borrowed token in the market (e.g. crvUSD)
                @param target_utilization Utilization at which borrow rate is the same as in AMM
                @param low_ratio Ratio rate/target_rate at 0% utilization
                @param high_ratio Ratio rate/target_rate at 100% utilization
                @param rate_shift Shift all the rate curve by this rate
                """
                assert target_utilization >= MIN_UTIL
                assert target_utilization <= MAX_UTIL
                assert low_ratio >= MIN_LOW_RATIO
                assert high_ratio <= MAX_HIGH_RATIO
                assert low_ratio < high_ratio
                assert rate_shift <= MAX_RATE_SHIFT

                FACTORY = factory
                AMM = amm
                BORROWED_TOKEN = borrowed_token
                p: Parameters = self.get_params(target_utilization, low_ratio, high_ratio, rate_shift)
                self.parameters = p
                log SetParameters(p.u_inf, p.A, p.r_minf, p.shift)
            ```

    === "Example"
        ```shell
        >>> MonetaryPolicy.BORROWED_TOKEN()
        '0xf939E0A03FB07F59A73314E73794Be0E57ac1b4E'
        ```


### `FACTORY`
!!! description "`MonetaryPolicy.parameters() -> tuple: view`"

    Getter for the lending factory contract.

    Returns: factory contract (`address`).

    ??? quote "Source code"

        === "MonetaryPolicy.vy"

            ```python
            FACTORY: public(immutable(Factory))

            @external
            def __init__(factory: Factory, amm: IAMM, borrowed_token: ERC20,
                        target_utilization: uint256, low_ratio: uint256, high_ratio: uint256, rate_shift: uint256):
                """
                @param factory Factory contract
                @param amm AMM to take borrow rate from as a basis
                @param borrowed_token Borrowed token in the market (e.g. crvUSD)
                @param target_utilization Utilization at which borrow rate is the same as in AMM
                @param low_ratio Ratio rate/target_rate at 0% utilization
                @param high_ratio Ratio rate/target_rate at 100% utilization
                @param rate_shift Shift all the rate curve by this rate
                """
                assert target_utilization >= MIN_UTIL
                assert target_utilization <= MAX_UTIL
                assert low_ratio >= MIN_LOW_RATIO
                assert high_ratio <= MAX_HIGH_RATIO
                assert low_ratio < high_ratio
                assert rate_shift <= MAX_RATE_SHIFT

                FACTORY = factory
                AMM = amm
                BORROWED_TOKEN = borrowed_token
                p: Parameters = self.get_params(target_utilization, low_ratio, high_ratio, rate_shift)
                self.parameters = p
                log SetParameters(p.u_inf, p.A, p.r_minf, p.shift)
            ```

    === "Example"
        ```shell
        >>> MonetaryPolicy.FACTORY()
        '0xeA6876DDE9e3467564acBeE1Ed5bac88783205E0'
        ```



