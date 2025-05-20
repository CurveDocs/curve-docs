<h1>LeverageZapOdos</h1>

This Zap contract is specifically designed to **create or repay leveraged loans** using the [**Odos router**](https://odos.xyz/).

???+ vyper "`LeverageZapOdos.vy`"
    The source code for the `LlamaLendOdosLeverageZap.vy` contract can be found on [:material-github: GitHub](https://github.com/curvefi/curve-stablecoin/blob/lending/contracts/zaps/LeverageZapOdos.vy). The contract is written using [Vyper](https://github.com/vyperlang/vyper) version `0.3.10`.

    The contract is deployed on :logos-ethereum: Ethereum at [`0xc5898606bdb494a994578453b92e7910a90aa873`](https://etherscan.io/address/0xc5898606bdb494a994578453b92e7910a90aa873).

    An accompanying JavaScript library for Curve Lending can be found here: [:material-github: GitHub](https://github.com/curvefi/curve-lending-js).

Previously, building leverage for crvUSD markets relied solely on predefined routes using only Curve pools. Leveraging large positions often led to significant price impact due to the exclusive use of Curve liquidity pools. This new Zap contract allows users to leverage loans for crvUSD and lending markets using the Odos router, which considers liquidity sources across DeFi.[^1]

[^1]: The premise is that these liquidity sources are integrated within the Odos router.

---

Leverage is built using a **callback method**. The function to execute callbacks is located in the `Controller.vy` contract:

???quote "`execute_callback`"

    !!!bug
        `callback_sig` is the `method_id` of the function from the `LlamaLendOdosLeverageZap.vy` contract which needs to be called. While this value is obtained by using Vyper's built-in [`method_id`](https://docs.vyperlang.org/en/stable/built-in-functions.html?highlight=raw_call#method_id) function for the `callback_deposit` function, it does not work for the `callback_repay` function due to a bug. The reason for the bug is a `0` at the beginning of the method_id. That's why the method ID for `CALLBACK_REPAY_WITH_BYTES` is hardcoded to `0x008ae188`.


    === "Controller.vy"

        ```py
        struct CallbackData:
            active_band: int256
            stablecoins: uint256
            collateral: uint256

        CALLBACK_DEPOSIT: constant(bytes4) = method_id("callback_deposit(address,uint256,uint256,uint256,uint256[])", output_type=bytes4)
        CALLBACK_REPAY: constant(bytes4) = method_id("callback_repay(address,uint256,uint256,uint256,uint256[])", output_type=bytes4)
        CALLBACK_LIQUIDATE: constant(bytes4) = method_id("callback_liquidate(address,uint256,uint256,uint256,uint256[])", output_type=bytes4)

        CALLBACK_DEPOSIT_WITH_BYTES: constant(bytes4) = method_id("callback_deposit(address,uint256,uint256,uint256,uint256[],bytes)", output_type=bytes4)
        # CALLBACK_REPAY_WITH_BYTES: constant(bytes4) = method_id("callback_repay(address,uint256,uint256,uint256,uint256[],bytes)", output_type=bytes4) <-- BUG! The reason is 0 at the beginning of method_id
        CALLBACK_REPAY_WITH_BYTES: constant(bytes4) = 0x008ae188
        CALLBACK_LIQUIDATE_WITH_BYTES: constant(bytes4) = method_id("callback_liquidate(address,uint256,uint256,uint256,uint256[],bytes)", output_type=bytes4)

        @internal
        def execute_callback(callbacker: address, callback_sig: bytes4,
                            user: address, stablecoins: uint256, collateral: uint256, debt: uint256,
                            callback_args: DynArray[uint256, 5], callback_bytes: Bytes[10**4]) -> CallbackData:
            assert callbacker != COLLATERAL_TOKEN.address

            data: CallbackData = empty(CallbackData)
            data.active_band = AMM.active_band()
            band_x: uint256 = AMM.bands_x(data.active_band)
            band_y: uint256 = AMM.bands_y(data.active_band)

            # Callback
            response: Bytes[64] = raw_call(
                callbacker,
                concat(callback_sig, _abi_encode(user, stablecoins, collateral, debt, callback_args, callback_bytes)),
                max_outsize=64
            )
            data.stablecoins = convert(slice(response, 0, 32), uint256)
            data.collateral = convert(slice(response, 32, 32), uint256)

            # Checks after callback
            assert data.active_band == AMM.active_band()
            assert band_x == AMM.bands_x(data.active_band)
            assert band_y == AMM.bands_y(data.active_band)

            return data
        ```

!!!info "Required Changes to `Controller.vy`"
    This zap only works for crvUSD and lending markets which were deployed using the blueprint implementation at [`0x4c5d4F542765B66154B2E789abd8E69ed4504112`](https://etherscan.io/address/0x4c5d4F542765B66154B2E789abd8E69ed4504112). Markets deployed prior to that can only make use of the regular [`LeverageZap.vy`](./LeverageZap.md).

    To enable the functionality of such Zap contracts, minor modifications were necessary in the `Controller.vy` contract. Functions such as `create_loan_extended`, `borrow_more_extended`, `repay_extended`, `_liquidity`, and `liquidate_extended` were enhanced with an additional constructor argument `callback_bytes: Bytes[10**4]`. This allows users to pass bytes to the Zap contract. Additionally, the internal `execute_callback` function, which manages the callbacks, was also updated.

---

## **Building Leverage**

To build up leverage, the `LlamaLendOdosLeverageZap.vy` contract uses the `callback_deposit` function. Additionally, there is a `max_borrowable` function that calculates the maximum borrowable amount when using leverage.

*Flow of building leverage:*

1. User calls [`create_loan_extended`](../controller.md#create_loan_extended) or [`borrow_more_extended`](../controller.md#borrow_more_extended) and passes `collateral`, `debt`, `N`, `callbacker`, `callback_args`, and `callback_bytes` into the function.[^2]
2. The debt which is taken on by the user is then transferred to the `callbacker`, in our case the `LlamaLendOdosLeverageZap.vy` contract.
3. After the transfer, the callback is executed using the internal `execute_callback` in the `Controller.vy` contract. This step builds up the leverage.

    ???quote "`execute_callback`"

        === "Controller.vy"

            ```py
            struct CallbackData:
                active_band: int256
                stablecoins: uint256
                collateral: uint256

            CALLBACK_DEPOSIT: constant(bytes4) = method_id("callback_deposit(address,uint256,uint256,uint256,uint256[])", output_type=bytes4)
            CALLBACK_REPAY: constant(bytes4) = method_id("callback_repay(address,uint256,uint256,uint256,uint256[])", output_type=bytes4)
            CALLBACK_LIQUIDATE: constant(bytes4) = method_id("callback_liquidate(address,uint256,uint256,uint256,uint256[])", output_type=bytes4)

            CALLBACK_DEPOSIT_WITH_BYTES: constant(bytes4) = method_id("callback_deposit(address,uint256,uint256,uint256,uint256[],bytes)", output_type=bytes4)
            # CALLBACK_REPAY_WITH_BYTES: constant(bytes4) = method_id("callback_repay(address,uint256,uint256,uint256,uint256[],bytes)", output_type=bytes4) <-- BUG! The reason is 0 at the beginning of method_id
            CALLBACK_REPAY_WITH_BYTES: constant(bytes4) = 0x008ae188
            CALLBACK_LIQUIDATE_WITH_BYTES: constant(bytes4) = method_id("callback_liquidate(address,uint256,uint256,uint256,uint256[],bytes)", output_type=bytes4)

            @internal
            def execute_callback(callbacker: address, callback_sig: bytes4,
                                user: address, stablecoins: uint256, collateral: uint256, debt: uint256,
                                callback_args: DynArray[uint256, 5], callback_bytes: Bytes[10**4]) -> CallbackData:
                assert callbacker != COLLATERAL_TOKEN.address

                data: CallbackData = empty(CallbackData)
                data.active_band = AMM.active_band()
                band_x: uint256 = AMM.bands_x(data.active_band)
                band_y: uint256 = AMM.bands_y(data.active_band)

                # Callback
                response: Bytes[64] = raw_call(
                    callbacker,
                    concat(callback_sig, _abi_encode(user, stablecoins, collateral, debt, callback_args, callback_bytes)),
                    max_outsize=64
                )
                data.stablecoins = convert(slice(response, 0, 32), uint256)
                data.collateral = convert(slice(response, 32, 32), uint256)

                # Checks after callback
                assert data.active_band == AMM.active_band()
                assert band_x == AMM.bands_x(data.active_band)
                assert band_y == AMM.bands_y(data.active_band)

                return data
            ```

    The function uses Vyper's built-in [`raw_call`](https://docs.vyperlang.org/en/stable/built-in-functions.html?highlight=raw_call#raw_call) function to call the desired method (in this case `callback_deposit`) with the according `callback_bytes`.

4. After executing the callback, the Controller either creates a new loan or adds the additional collateral borrowed to the already existing loan and deposits the collateral into the AMM.

[^2]: `collateral` is the amount of collateral tokens used, `debt` is the amount of debt to take on, `N` represents the number of bands, `callbacker` is the callback contract, `callback_args` are some extra arguments passed to the callbacker, and `callback_bytes`.

### `callback_deposit`
!!! description "`LlamaLendOdosLeverageZap.callback_deposit(user: address, stablecoins: uint256, user_collateral: uint256, d_debt: uint256, callback_args: DynArray[uint256, 10], callback_bytes: Bytes[10**4] = b"") -> uint256[2]`"

    !!!guard "Guarded Method"
        This function is only callable by the `Controller` from where tokens are borrowed from.

    Function to create a leveraged loan using a callback.

    The following callback arguments need to be passed to this function via `create_loan_extended` or `borrow_more_extended`:

    - `callback_args[0] = factory_id`: depending on which factory (crvusd or lending).
    - `callback_args[1] = controller_id`: index of the controller in the factory contract fetched from `Factory.controllers(controller_id)`.
    - `callback_args[2] = user_borrowed`: amount of borrowed token provided by the user (which is exchanged for the collateral token).

    Returns: 0 and additional collateral (`uint256[2]`).

    Emits: `Deposit`

    | Input             | Type                    | Description  |
    | ----------------- | ----------------------- | ------------ |
    | `user`            | `address`               | User address to create a leveraged position for. |
    | `stablecoins`     | `uint256`               | Always 0. |
    | `user_collateral` | `uint256`               | Amount of collateral token provided by the user. |
    | `d_debt`          | `uint256`               | Amount to be borrowed (in addition to what has already been borrowed). |
    | `callback_args`   | `DynArray[uint256, 10]` | Callback arguments. |
    | `callback_bytes`  | `Bytes[10**4] = b""`    | Callback bytes. |

    ??? quote "Source code"

        === "LlamaLendOdosLeverageZap.vy"

            ```python
            event Deposit:
                user: indexed(address)
                user_collateral: uint256
                user_borrowed: uint256
                user_collateral_from_borrowed: uint256
                debt: uint256
                leverage_collateral: uint256

            @external
            @nonreentrant('lock')
            def callback_deposit(user: address, stablecoins: uint256, user_collateral: uint256, d_debt: uint256,
                                callback_args: DynArray[uint256, 10], callback_bytes: Bytes[10**4] = b"") -> uint256[2]:
                """
                @notice Callback method which should be called by controller to create leveraged position
                @param user Address of the user
                @param stablecoins Always 0
                @param user_collateral The amount of collateral token provided by user
                @param d_debt The amount to be borrowed (in addition to what has already been borrowed)
                @param callback_args [factory_id, controller_id, user_borrowed]
                                    0-1. factory_id, controller_id are needed to check that msg.sender is the one of our controllers
                                    2. user_borrowed - the amount of borrowed token provided by user (needs to be exchanged for collateral)
                return [0, user_collateral_from_borrowed + leverage_collateral]
                """
                controller: address = Factory(self.FACTORIES[callback_args[0]]).controllers(callback_args[1])
                assert msg.sender == controller, "wrong controller"
                amm: LLAMMA = LLAMMA(Controller(controller).amm())
                borrowed_token: address = amm.coins(0)
                collateral_token: address = amm.coins(1)

                self._approve(borrowed_token, ROUTER)
                self._approve(collateral_token, controller)

                user_borrowed: uint256 = callback_args[2]
                self._transferFrom(borrowed_token, user, self, user_borrowed)
                raw_call(ROUTER, callback_bytes)  # buys leverage_collateral for user_borrowed + dDebt
                additional_collateral: uint256 = ERC20(collateral_token).balanceOf(self)
                leverage_collateral: uint256 = d_debt * 10**18 / (d_debt + user_borrowed) * additional_collateral / 10**18
                user_collateral_from_borrowed: uint256 = additional_collateral - leverage_collateral

                log Deposit(user, user_collateral, user_borrowed, user_collateral_from_borrowed, d_debt, leverage_collateral)

                return [0, additional_collateral]

            @internal
            def _transferFrom(token: address, _from: address, _to: address, amount: uint256):
                if amount > 0:
                    assert ERC20(token).transferFrom(_from, _to, amount, default_return_value=True)


            @internal
            def _approve(coin: address, spender: address):
                if ERC20(coin).allowance(self, spender) == 0:
                    assert ERC20(coin).approve(spender, max_value(uint256), default_return_value=True)
            ```

        === "Controller.vy"

            ```python
            @external
            @nonreentrant('lock')
            def create_loan_extended(collateral: uint256, debt: uint256, N: uint256, callbacker: address, callback_args: DynArray[uint256,5], callback_bytes: Bytes[10**4] = b""):
                """
                @notice Create loan but pass stablecoin to a callback first so that it can build leverage
                @param collateral Amount of collateral to use
                @param debt Stablecoin debt to take
                @param N Number of bands to deposit into (to do autoliquidation-deliquidation),
                    can be from MIN_TICKS to MAX_TICKS
                @param callbacker Address of the callback contract
                @param callback_args Extra arguments for the callback (up to 5) such as min_amount etc
                """
                # Before callback
                self.transfer(BORROWED_TOKEN, callbacker, debt)

                # For compatibility
                callback_sig: bytes4 = CALLBACK_DEPOSIT_WITH_BYTES
                if callback_bytes == b"":
                    callback_sig = CALLBACK_DEPOSIT
                # Callback
                # If there is any unused debt, callbacker can send it to the user
                more_collateral: uint256 = self.execute_callback(
                    callbacker, callback_sig, msg.sender, 0, collateral, debt, callback_args, callback_bytes).collateral

                # After callback
                self._create_loan(collateral + more_collateral, debt, N, False)
                self.transferFrom(COLLATERAL_TOKEN, msg.sender, AMM.address, collateral)
                self.transferFrom(COLLATERAL_TOKEN, callbacker, AMM.address, more_collateral)

            @internal
            def execute_callback(callbacker: address, callback_sig: bytes4,
                                user: address, stablecoins: uint256, collateral: uint256, debt: uint256,
                                callback_args: DynArray[uint256, 5], callback_bytes: Bytes[10**4]) -> CallbackData:
                assert callbacker != COLLATERAL_TOKEN.address

                data: CallbackData = empty(CallbackData)
                data.active_band = AMM.active_band()
                band_x: uint256 = AMM.bands_x(data.active_band)
                band_y: uint256 = AMM.bands_y(data.active_band)

                # Callback
                response: Bytes[64] = raw_call(
                    callbacker,
                    concat(callback_sig, _abi_encode(user, stablecoins, collateral, debt, callback_args, callback_bytes)),
                    max_outsize=64
                )
                data.stablecoins = convert(slice(response, 0, 32), uint256)
                data.collateral = convert(slice(response, 32, 32), uint256)

                # Checks after callback
                assert data.active_band == AMM.active_band()
                assert band_x == AMM.bands_x(data.active_band)
                assert band_y == AMM.bands_y(data.active_band)

                return data
            ```

### `max_borrowable`
!!! description "`LlamaLendOdosLeverageZap.max_borrowable(controller: address, _user_collateral: uint256, _leverage_collateral: uint256, N: uint256, p_avg: uint256) -> uint256`"

    Function to calculate the maximum borrowable using leverage. The maximum borrowable amount essentially comes down to:

    $$\text{max_borrowable} = \frac{\text{collateral}}{\frac{1}{\text{k_effective} \times \text{max_p_base}} - \frac{1}{\text{p_avg}}}$$

    with $\text{k_effective}$ and $\text{max_p_base}$ being calculated with the internal `_get_k_effective` and `_max_p_base` methods. $\text{p_avg}$ is the average price of the collateral.

    Returns: maximum amount to borrow (`uint256`). The maximum value to return is either the maximum a user can borrow and is ultimately limited by the amount of coins the Controller has.

    | Input                  | Type      | Description  |
    | ---------------------- | --------- | ------------ |
    | `controller`           | `address` | Controller of the market to borrow from. |
    | `_user_collateral`     | `uint256` | Amount of collateral at its native precision. |
    | `_leverage_collateral` | `uint256` | Additional collateral to use for leveraging. |
    | `N`                    | `uint256` | Number of bands to deposit into. |
    | `p_avg`                | `uint256` | Average price of the collateral. |


    ??? quote "Source code"

        === "LlamaLendOdosLeverageZap.vy"

            ```python
            DEAD_SHARES: constant(uint256) = 1000
            MAX_TICKS_UINT: constant(uint256) = 50
            MAX_P_BASE_BANDS: constant(int256) = 5
            MAX_SKIP_TICKS: constant(uint256) = 1024

            @external
            @view
            def max_borrowable(controller: address, _user_collateral: uint256, _leverage_collateral: uint256, N: uint256, p_avg: uint256) -> uint256:
                """
                @notice Calculation of maximum which can be borrowed with leverage
                """
                # max_borrowable = collateral / (1 / (k_effective * max_p_base) - 1 / p_avg)
                AMM: LLAMMA = LLAMMA(Controller(controller).amm())
                BORROWED_TOKEN: address = AMM.coins(0)
                COLLATERAL_TOKEN: address = AMM.coins(1)
                COLLATERAL_PRECISION: uint256 = pow_mod256(10, 18 - ERC20(COLLATERAL_TOKEN).decimals())

                user_collateral: uint256 = _user_collateral * COLLATERAL_PRECISION
                leverage_collateral: uint256 = _leverage_collateral * COLLATERAL_PRECISION
                k_effective: uint256 = self._get_k_effective(controller, user_collateral + leverage_collateral, N)
                max_p_base: uint256 = self._max_p_base(controller)
                max_borrowable: uint256 = user_collateral * 10**18 / (10**36 / k_effective * 10**18 / max_p_base - 10**36 / p_avg)

                return min(max_borrowable * 999 / 1000, ERC20(BORROWED_TOKEN).balanceOf(controller)) # Cannot borrow beyond the amount of coins Controller has

            @internal
            @view
            def _get_k_effective(controller: address, collateral: uint256, N: uint256) -> uint256:
                """
                @notice Intermediary method which calculates k_effective defined as x_effective / p_base / y,
                        however discounted by loan_discount.
                        x_effective is an amount which can be obtained from collateral when liquidating
                @param N Number of bands the deposit is made into
                @return k_effective
                """
                # x_effective = sum_{i=0..N-1}(y / N * p(n_{n1+i})) =
                # = y / N * p_oracle_up(n1) * sqrt((A - 1) / A) * sum_{0..N-1}(((A-1) / A)**k)
                # === d_y_effective * p_oracle_up(n1) * sum(...) === y * k_effective * p_oracle_up(n1)
                # d_k_effective = 1 / N / sqrt(A / (A - 1))
                # d_k_effective: uint256 = 10**18 * unsafe_sub(10**18, discount) / (SQRT_BAND_RATIO * N)
                # Make some extra discount to always deposit lower when we have DEAD_SHARES rounding
                CONTROLLER: Controller = Controller(controller)
                A: uint256 = LLAMMA(CONTROLLER.amm()).A()
                SQRT_BAND_RATIO: uint256 = isqrt(unsafe_div(10 ** 36 * A, unsafe_sub(A, 1)))

                discount: uint256 = CONTROLLER.loan_discount()
                d_k_effective: uint256 = 10**18 * unsafe_sub(
                    10**18, min(discount + (DEAD_SHARES * 10**18) / max(collateral / N, DEAD_SHARES), 10**18)
                ) / (SQRT_BAND_RATIO * N)
                k_effective: uint256 = d_k_effective
                for i in range(1, MAX_TICKS_UINT):
                    if i == N:
                        break
                    d_k_effective = unsafe_div(d_k_effective * (A - 1), A)
                    k_effective = unsafe_add(k_effective, d_k_effective)
                return k_effective

            @internal
            @view
            def _max_p_base(controller: address) -> uint256:
                """
                @notice Calculate max base price including skipping bands
                """
                AMM: LLAMMA = LLAMMA(Controller(controller).amm())
                A: uint256 = AMM.A()
                LOGN_A_RATIO: int256 = self.wad_ln(A * 10**18 / (A - 1))

                p_oracle: uint256 = AMM.price_oracle()
                # Should be correct unless price changes suddenly by MAX_P_BASE_BANDS+ bands
                n1: int256 = self.wad_ln(AMM.get_base_price() * 10**18 / p_oracle)
                if n1 < 0:
                    n1 -= LOGN_A_RATIO - 1  # This is to deal with vyper's rounding of negative numbers
                n1 = unsafe_div(n1, LOGN_A_RATIO) + MAX_P_BASE_BANDS
                n_min: int256 = AMM.active_band_with_skip()
                n1 = max(n1, n_min + 1)
                p_base: uint256 = AMM.p_oracle_up(n1)

                for i in range(MAX_SKIP_TICKS + 1):
                    n1 -= 1
                    if n1 <= n_min:
                        break
                    p_base_prev: uint256 = p_base
                    p_base = unsafe_div(p_base * A, A - 1)
                    if p_base > p_oracle:
                        return p_base_prev

                return p_base
            ```

---

## **Unwinding Leverage**

To deleverage loans, the `LlamaLendOdosLeverageZap.vy` contract uses the `callback_repay` function.

*Flow of deleveraging:*

1. User calls `repay_extended` and passes `callbacker`, `callback_args`, and `callback_bytes` into the function.
2. The Controller withdraws 100% of the collateral from the AMM and transfers all of it to the `callbacker` contract.
3. After the transfer, the callback is executed using the internal `execute_callback` in the `Controller.vy` contract. This function unwinds the leverage.

    ???quote "`execute_callback`"

        === "Controller.vy"

            ```py
            struct CallbackData:
                active_band: int256
                stablecoins: uint256
                collateral: uint256

            CALLBACK_DEPOSIT: constant(bytes4) = method_id("callback_deposit(address,uint256,uint256,uint256,uint256[])", output_type=bytes4)
            CALLBACK_REPAY: constant(bytes4) = method_id("callback_repay(address,uint256,uint256,uint256,uint256[])", output_type=bytes4)
            CALLBACK_LIQUIDATE: constant(bytes4) = method_id("callback_liquidate(address,uint256,uint256,uint256,uint256[])", output_type=bytes4)

            CALLBACK_DEPOSIT_WITH_BYTES: constant(bytes4) = method_id("callback_deposit(address,uint256,uint256,uint256,uint256[],bytes)", output_type=bytes4)
            # CALLBACK_REPAY_WITH_BYTES: constant(bytes4) = method_id("callback_repay(address,uint256,uint256,uint256,uint256[],bytes)", output_type=bytes4) <-- BUG! The reason is 0 at the beginning of method_id
            CALLBACK_REPAY_WITH_BYTES: constant(bytes4) = 0x008ae188
            CALLBACK_LIQUIDATE_WITH_BYTES: constant(bytes4) = method_id("callback_liquidate(address,uint256,uint256,uint256,uint256[],bytes)", output_type=bytes4)

            @internal
            def execute_callback(callbacker: address, callback_sig: bytes4,
                                user: address, stablecoins: uint256, collateral: uint256, debt: uint256,
                                callback_args: DynArray[uint256, 5], callback_bytes: Bytes[10**4]) -> CallbackData:
                assert callbacker != COLLATERAL_TOKEN.address

                data: CallbackData = empty(CallbackData)
                data.active_band = AMM.active_band()
                band_x: uint256 = AMM.bands_x(data.active_band)
                band_y: uint256 = AMM.bands_y(data.active_band)

                # Callback
                response: Bytes[64] = raw_call(
                    callbacker,
                    concat(callback_sig, _abi_encode(user, stablecoins, collateral, debt, callback_args, callback_bytes)),
                    max_outsize=64
                )
                data.stablecoins = convert(slice(response, 0, 32), uint256)
                data.collateral = convert(slice(response, 32, 32), uint256)

                # Checks after callback
                assert data.active_band == AMM.active_band()
                assert band_x == AMM.bands_x(data.active_band)
                assert band_y == AMM.bands_y(data.active_band)

                return data
            ```

    The function uses Vyper's built-in [`raw_call`](https://docs.vyperlang.org/en/stable/built-in-functions.html?highlight=raw_call#raw_call) function to call the desired method (in this case `callback_repay`) with the according `callback_bytes`.

4. After executing the callback, the Controller checks and does a full repayment and closes the position when possible. Else, it does a partial repayment (deleverage).

### `callback_repay`
!!! description "`LlamaLendOdosLeverageZap.callback_repay(user: address, stablecoins: uint256, collateral: uint256, debt: uint256, callback_args: DynArray[uint256,10], callback_bytes: Bytes[10 ** 4] = b"") -> uint256[2]`"

    !!!guard "Guarded Method"
        This function is only callable by the `Controller` from where tokens were borrowed from.

    Function to de-leverage a loan using a callback.

    The following `callback_args` need to be passed to this function via `repay_extended`:

    - `callback_args[0] = factory_id`: depending on which factory (crvusd or lending).
    - `callback_args[1] = controller_id`: index of the controller in the factory contract fetched from `Factory.controllers(controller_id)`.
    - `callback_args[2] = user_collateral`: amount of collateral token provided by the user (which is exchanged for the borrowed token).
    - `callback_args[3] = user_borrowed`: amount of borrowed tokens to repay.

    Returns: borrowed_from_state_collateral + borrowed_from_user_collateral + user_borrowed and remaining_collateral (`uint256[2]`).

    Emits: `Repay`

    | Input             | Type                    | Description  |
    | ----------------- | ----------------------- | ------------ |
    | `user`            | `address`               | User address to unwind a leveraged position for. |
    | `stablecoins`     | `uint256`               | Value returned from `user_state`. |
    | `user_collateral` | `uint256`               | Value returned from `user_state`. |
    | `d_debt`          | `uint256`               | Value returned from `user_state`. |
    | `callback_args`   | `DynArray[uint256, 10]` | Callback arguments. |
    | `callback_bytes`  | `Bytes[10**4] = b""`    | Callback bytes. |

    ??? quote "Source code"

        === "LlamaLendOdosLeverageZap.vy"

            ```python
            event Repay:
                user: indexed(address)
                state_collateral_used: uint256
                borrowed_from_state_collateral: uint256
                user_collateral: uint256
                user_collateral_used: uint256
                borrowed_from_user_collateral: uint256
                user_borrowed: uint256

            @external
            @nonreentrant('lock')
            def callback_repay(user: address, stablecoins: uint256, collateral: uint256, debt: uint256,
                            callback_args: DynArray[uint256,10], callback_bytes: Bytes[10 ** 4] = b"") -> uint256[2]:
                """
                @notice Callback method which should be called by controller to create leveraged position
                @param user Address of the user
                @param stablecoins The value from user_state
                @param collateral The value from user_state
                @param debt The value from user_state
                @param callback_args [factory_id, controller_id, user_collateral, user_borrowed]
                                    0-1. factory_id, controller_id are needed to check that msg.sender is the one of our controllers
                                    2. user_collateral - the amount of collateral token provided by user (needs to be exchanged for borrowed)
                                    3. user_borrowed - the amount of borrowed token to repay from user's wallet
                return [user_borrowed + borrowed_from_collateral, remaining_collateral]
                """
                controller: address = Factory(self.FACTORIES[callback_args[0]]).controllers(callback_args[1])
                assert msg.sender == controller, "wrong controller"
                amm: LLAMMA = LLAMMA(Controller(controller).amm())
                borrowed_token: address = amm.coins(0)
                collateral_token: address = amm.coins(1)

                self._approve(collateral_token, ROUTER)
                self._approve(borrowed_token, controller)
                self._approve(collateral_token, controller)

                initial_collateral: uint256 = ERC20(collateral_token).balanceOf(self)
                user_collateral: uint256 = callback_args[2]
                if callback_bytes != b"":
                    self._transferFrom(collateral_token, user, self, user_collateral)
                    # Buys borrowed token for collateral from user's position + from user's wallet.
                    # The amount to be spent is specified inside callback_bytes.
                    raw_call(ROUTER, callback_bytes)
                else:
                    assert user_collateral == 0
                remaining_collateral: uint256 = ERC20(collateral_token).balanceOf(self)
                state_collateral_used: uint256 = 0
                borrowed_from_state_collateral: uint256 = 0
                user_collateral_used: uint256 = user_collateral
                borrowed_from_user_collateral: uint256 = ERC20(borrowed_token).balanceOf(self)  # here it's total borrowed_from_collateral
                if remaining_collateral < initial_collateral:
                    state_collateral_used = initial_collateral - remaining_collateral
                    borrowed_from_state_collateral = state_collateral_used * 10**18 / (state_collateral_used + user_collateral_used) * borrowed_from_user_collateral / 10**18
                    borrowed_from_user_collateral = borrowed_from_user_collateral - borrowed_from_state_collateral
                else:
                    user_collateral_used = user_collateral - (remaining_collateral - initial_collateral)

                user_borrowed: uint256 = callback_args[3]
                self._transferFrom(borrowed_token, user, self, user_borrowed)

                log Repay(user, state_collateral_used, borrowed_from_state_collateral, user_collateral, user_collateral_used, borrowed_from_user_collateral, user_borrowed)

                return [borrowed_from_state_collateral + borrowed_from_user_collateral + user_borrowed, remaining_collateral]

            @internal
            def _transferFrom(token: address, _from: address, _to: address, amount: uint256):
                if amount > 0:
                    assert ERC20(token).transferFrom(_from, _to, amount, default_return_value=True)


            @internal
            def _approve(coin: address, spender: address):
                if ERC20(coin).allowance(self, spender) == 0:
                    assert ERC20(coin).approve(spender, max_value(uint256), default_return_value=True)
            ```

---

## **Contract Info Methods**

The contract has two public getters, one for the [Odos Router](https://docs.odos.xyz/build/quickstart/sor) contract and one for the two factory contracts for crvUSD and lending markets.

### `ROUTER`
!!! description "`LlamaLendOdosLeverageZap.ROUTER() -> address: view`"

    Getter method for the [Odos Router](https://docs.odos.xyz/build/quickstart/sor) contract. This variable is immutable, set at initialization and can not be changed.

    Returns: Odos Router (`address`).

    ??? quote "Source code"

        === "LlamaLendOdosLeverageZap.vy"

            ```python
            ROUTER: public(immutable(address))

            @external
            def __init__(_router: address, _factories: DynArray[address, 2]):
                ROUTER = _router
                self.FACTORIES = _factories
            ```

    === "Example"

        This example returns the contract address of the Odos Router.

        ```shell
        >>> LlamaLendOdosLeverageZap.ROUTER()
        '0xCf5540fFFCdC3d510B18bFcA6d2b9987b0772559'
        ```


### `FACTORIES`
!!! description "`LlamaLendOdosLeverageZap.FACTORIES(arg0: uint256) -> address: view`"

    Getter method for the `Factory` contract at index `arg0`.

    Returns: Factory contract (`address`).

    | Input  | Type      | Description          |
    | ------ | --------- | -------------------- |
    | `arg0` | `uint256` | Index of the Factory contract to use. |

    ??? quote "Source code"

        === "LlamaLendOdosLeverageZap.vy"

            ```python
            FACTORIES: public(DynArray[address, 2])

            @external
            def __init__(_router: address, _factories: DynArray[address, 2]):
                ROUTER = _router
                self.FACTORIES = _factories
            ```

    === "Example"

        This example returns the contract address of the `Factory` contract at a specific index.

        ```shell
        >>> LlamaLendOdosLeverageZap.FACTORIES(0)
        '0xeA6876DDE9e3467564acBeE1Ed5bac88783205E0'

        >>> LlamaLendOdosLeverageZap.FACTORIES(1)
        '0xC9332fdCB1C491Dcc683bAe86Fe3cb70360738BC'
        ```
