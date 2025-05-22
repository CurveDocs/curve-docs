<h1> </h1>

**The following functions are admin-only functions.**

Pools created through the Factory are 'owned' by the factory **`admin`** (DAO). Ownership can be transferred only within the Factory contract, and this is done through the use of the **`commit_transfer_ownership()`** and **`accept_transfer_ownership()`** functions.



## **Parameter Controls**

More information about the parameters [here](../../overview.md).

The appropriate value for `A` and `gamma` is dependent upon the type of coin being used within the pool, and is subject to optimization and pool-parameter update based on the market history of the trading pair. It is possible to modify the parameters for a pool after it has been deployed. However, it requires a vote within the Curve DAO and must reach a 15% quorum.


### `ramp_A_gamma`
!!! description "`CryptoSwap.ramp_A_gamma(future_A: uint256, future_gamma: uint256, future_time: uint256):`"

    !!!guard "Guarded Method"
        This function is only callable by the `admin` of the factory contract.

    Function to ramp A and gamma parameter values linearly.

    Emits: `RampAgamma`

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `future_A` | `uint256` | future A value |
    | `future_gamma` | `uint256` | future gamma value |
    | `future_time` | `uint256` | timestamp at which the parameters are fully ramped |

    ??? quote "Source code"

        ```vyper
        event RampAgamma:
            initial_A: uint256
            future_A: uint256
            initial_gamma: uint256
            future_gamma: uint256
            initial_time: uint256
            future_time: uint256

        @external
        def ramp_A_gamma(future_A: uint256, future_gamma: uint256, future_time: uint256):
            assert msg.sender == Factory(self.factory).admin()  # dev: only owner
            assert block.timestamp > self.initial_A_gamma_time + (MIN_RAMP_TIME-1)
            assert future_time > block.timestamp + (MIN_RAMP_TIME-1)  # dev: insufficient time

            A_gamma: uint256[2] = self._A_gamma()
            initial_A_gamma: uint256 = shift(A_gamma[0], 128)
            initial_A_gamma = bitwise_or(initial_A_gamma, A_gamma[1])

            assert future_A > MIN_A-1
            assert future_A < MAX_A+1
            assert future_gamma > MIN_GAMMA-1
            assert future_gamma < MAX_GAMMA+1

            ratio: uint256 = 10**18 * future_A / A_gamma[0]
            assert ratio < 10**18 * MAX_A_CHANGE + 1
            assert ratio > 10**18 / MAX_A_CHANGE - 1

            ratio = 10**18 * future_gamma / A_gamma[1]
            assert ratio < 10**18 * MAX_A_CHANGE + 1
            assert ratio > 10**18 / MAX_A_CHANGE - 1

            self.initial_A_gamma = initial_A_gamma
            self.initial_A_gamma_time = block.timestamp

            future_A_gamma: uint256 = shift(future_A, 128)
            future_A_gamma = bitwise_or(future_A_gamma, future_gamma)
            self.future_A_gamma_time = future_time
            self.future_A_gamma = future_A_gamma

            log RampAgamma(A_gamma[0], future_A, A_gamma[1], future_gamma, block.timestamp, future_time)
        ```

    === "Example"

        ```shell
        >>> CryptoSwap.ramp_A_gamma(2700000, 1300000000000, 1693674492)
        ```


### `stop_ramp_A_gamma`
!!! description "`CryptoSwap.stop_ramp_A_gamma():`"

    !!!guard "Guarded Method"
        This function is only callable by the `admin` of the factory contract.

    Function to immediately stop ramping A and gamma parameters and set them to the current value.

    Emits: `StopRampA`

    ??? quote "Source code"

        ```vyper
        event StopRampA:
            current_A: uint256
            current_gamma: uint256
            time: uint256

        @external
        def stop_ramp_A_gamma():
            assert msg.sender == Factory(self.factory).admin()  # dev: only owner

            A_gamma: uint256[2] = self._A_gamma()
            current_A_gamma: uint256 = shift(A_gamma[0], 128)
            current_A_gamma = bitwise_or(current_A_gamma, A_gamma[1])
            self.initial_A_gamma = current_A_gamma
            self.future_A_gamma = current_A_gamma
            self.initial_A_gamma_time = block.timestamp
            self.future_A_gamma_time = block.timestamp
            # now (block.timestamp < t1) is always False, so we return saved A

            log StopRampA(A_gamma[0], A_gamma[1], block.timestamp)
        ```

    === "Example"

        ```shell
        >>> CryptoSwap.stop_ramp_A_gamma()
        ```


### `commit_new_parameters`
!!! description "`CryptoSwap.commit_new_parameters(_new_mid_fee: uint256, _new_out_fee: uint256, _new_fee_gamma: uint256, _new_allowed_extra_profit: uint256, _new_adjustment_step: uint256, _new_ma_time: uint256):`"

    !!!guard "Guarded Method"
        This function is only callable by the `admin` of the factory contract.

    Function to commit new parameters. The new parameters do not take immediate effect, they need to be applied first.

    Emits: `CommitNewParameters`

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_new_mid_fee` | `uint256` | new mid fee value |
    | `_new_out_fee` | `uint256` | new out fee value |
    | `_new_admin_fee` | `uint256` | new admin fee value |
    | `_new_fee_gamma` | `uint256` | new  fee-gamma value |
    | `_new_allowed_extra_profit` | `uint256` | new allowed_extra_profit value |
    | `_new_adjustment_step` | `uint256` |new adjustment_step value |
    | `_new_ma_time` | `uint256` | new ma_time value |

    ??? quote "Source code"

        ```vyper
        event CommitNewParameters:
            deadline: indexed(uint256)
            admin_fee: uint256
            mid_fee: uint256
            out_fee: uint256
            fee_gamma: uint256
            allowed_extra_profit: uint256
            adjustment_step: uint256
            ma_half_time: uint256

        @external
        def commit_new_parameters(
            _new_mid_fee: uint256,
            _new_out_fee: uint256,
            _new_admin_fee: uint256,
            _new_fee_gamma: uint256,
            _new_allowed_extra_profit: uint256,
            _new_adjustment_step: uint256,
            _new_ma_half_time: uint256,
            ):
            assert msg.sender == Factory(self.factory).admin()  # dev: only owner
            assert self.admin_actions_deadline == 0  # dev: active action

            new_mid_fee: uint256 = _new_mid_fee
            new_out_fee: uint256 = _new_out_fee
            new_admin_fee: uint256 = _new_admin_fee
            new_fee_gamma: uint256 = _new_fee_gamma
            new_allowed_extra_profit: uint256 = _new_allowed_extra_profit
            new_adjustment_step: uint256 = _new_adjustment_step
            new_ma_half_time: uint256 = _new_ma_half_time

            # Fees
            if new_out_fee < MAX_FEE+1:
                assert new_out_fee > MIN_FEE-1  # dev: fee is out of range
            else:
                new_out_fee = self.out_fee
            if new_mid_fee > MAX_FEE:
                new_mid_fee = self.mid_fee
            assert new_mid_fee <= new_out_fee  # dev: mid-fee is too high
            if new_admin_fee > MAX_ADMIN_FEE:
                new_admin_fee = self.admin_fee

            # AMM parameters
            if new_fee_gamma < 10**18:
                assert new_fee_gamma > 0  # dev: fee_gamma out of range [1 .. 10**18]
            else:
                new_fee_gamma = self.fee_gamma
            if new_allowed_extra_profit > 10**18:
                new_allowed_extra_profit = self.allowed_extra_profit
            if new_adjustment_step > 10**18:
                new_adjustment_step = self.adjustment_step

            # MA
            if new_ma_half_time < 7*86400:
                assert new_ma_half_time > 0  # dev: MA time should be longer than 1 second
            else:
                new_ma_half_time = self.ma_half_time

            _deadline: uint256 = block.timestamp + ADMIN_ACTIONS_DELAY
            self.admin_actions_deadline = _deadline

            self.future_admin_fee = new_admin_fee
            self.future_mid_fee = new_mid_fee
            self.future_out_fee = new_out_fee
            self.future_fee_gamma = new_fee_gamma
            self.future_allowed_extra_profit = new_allowed_extra_profit
            self.future_adjustment_step = new_adjustment_step
            self.future_ma_half_time = new_ma_half_time

            log CommitNewParameters(_deadline, new_admin_fee, new_mid_fee, new_out_fee,
                                    new_fee_gamma,
                                    new_allowed_extra_profit, new_adjustment_step,
                                    new_ma_half_time)
        ```

    === "Example"

        ```shell
        >>> CryptoSwap.commit_new_parameters(20000000, 45000000, 50000000, 350000000000000, 100000000000, 100000000000, 1800)
        ```


### `apply_new_parameters`
!!! description "`CryptoSwap.apply_new_parameters()`"

    !!!guard "Guarded Method"
        This function is only callable by the `admin` of the factory contract.

    Function to apply the parameters from [`commit_new_parameters`](#commit_new_parameters).

    Emits: `NewParameters`

    ??? quote "Source code"

        ```vyper
        event NewParameters:
            admin_fee: uint256
            mid_fee: uint256
            out_fee: uint256
            fee_gamma: uint256
            allowed_extra_profit: uint256
            adjustment_step: uint256
            ma_half_time: uint256

        @external
        @nonreentrant('lock')
        def apply_new_parameters():
            assert msg.sender == Factory(self.factory).admin()  # dev: only owner
            assert block.timestamp >= self.admin_actions_deadline  # dev: insufficient time
            assert self.admin_actions_deadline != 0  # dev: no active action

            self.admin_actions_deadline = 0

            admin_fee: uint256 = self.future_admin_fee
            if self.admin_fee != admin_fee:
                self._claim_admin_fees()
                self.admin_fee = admin_fee

            mid_fee: uint256 = self.future_mid_fee
            self.mid_fee = mid_fee
            out_fee: uint256 = self.future_out_fee
            self.out_fee = out_fee
            fee_gamma: uint256 = self.future_fee_gamma
            self.fee_gamma = fee_gamma
            allowed_extra_profit: uint256 = self.future_allowed_extra_profit
            self.allowed_extra_profit = allowed_extra_profit
            adjustment_step: uint256 = self.future_adjustment_step
            self.adjustment_step = adjustment_step
            ma_half_time: uint256 = self.future_ma_half_time
            self.ma_half_time = ma_half_time

            log NewParameters(admin_fee, mid_fee, out_fee,
                            fee_gamma,
                            allowed_extra_profit, adjustment_step,
                            ma_half_time)
        ```

    === "Example"

        ```shell
        >>> CryptoSwap.apply_new_parameters()
        ```


### `revert_new_parameters`
!!! description "`CryptoSwap.revert_new_parameters() -> address: view`"

    !!!guard "Guarded Method"
        This function is only callable by the `admin` of the factory contract.

    Function to revert the parameters changes.

    ??? quote "Source code"

        ```vyper
        @external
        def revert_new_parameters():
            assert msg.sender == Factory(self.factory).admin()  # dev: only owner

            self.admin_actions_deadline = 0
        ```

    === "Example"

        ```shell
        >>> CryptoSwap.revert_new_parameters()
        ```



## **Admin Control Info Methods**

### `admin_actions_deadline`
!!! description "`CryptoSwap.admin_actions_deadline() -> uint256: view`"

    Getter for the admin actions deadline. This is the deadline after which new parameter changes can be applied. When committing new changes, there is a three-day timespan after being able to apply them (`ADMIN_ACTIONS_DELAY`), otherwise the call will revert.

    Returns: timestamp (`uint256`).

    ??? quote "Source code"

        ```vyper
        admin_actions_deadline: public(uint256)

        ADMIN_ACTIONS_DELAY: constant(uint256) = 3 * 86400
        ```

    === "Example"

        ```shell
        >>> CryptoSwap.admin_actions_deadline()
        0
        ```


### `initial_A_gamma`
!!! description "`CryptoSwap.initial_A_gamma() -> uint256:`"

    Getter for the initial A/gamma.

    Returns: A/gamma (`uint256`).

    ??? quote "Source code"

        ```vyper
        initial_A_gamma: public(uint256)
        ```

    === "Example"

        ```shell
        >>> CryptoSwap.initial_A_gamma()
        581076037942835227425498917514114728328226821
        ```


### `initial_A_gamma_time`
!!! description "`CryptoSwap.initial_A_gamma_time() -> uint256:`"

    Getter for the initial A/gamma time.

    Returns: A/gamma time (`uint256`).

    ??? quote "Source code"

        ```vyper
        initial_A_gamma_time: public(uint256)
        ```

    === "Example"

        ```shell
        >>> CryptoSwap.initial_A_gamma_time()
        0
        ```


### `future_A_gamma`
!!! description "`CryptoSwap.future_A_gamma() -> uint256:`"

    Getter for the future A/gamma.

    Returns: future A/gamma (`uint256`).

    ??? quote "Source code"

        ```vyper
        future_A_gamma: public(uint256)
        ```

    === "Example"

        ```shell
        >>> CryptoSwap.future_A_gamma()
        581076037942835227425498917514114728328226821
        ```

### `future_A_gamma_time`
!!! description "`CryptoSwap.future_A_gamma_time() -> uint256:`"

    Getter for the future A/gamma time.

    Returns: future A/gamma time (`uint256`).

    ??? quote "Source code"

        ```vyper
        future_A_gamma_time: public(uint256)
        ```

    === "Example"

        ```shell
        >>> CryptoSwap.future_A_gamma_time()
        0
        ```


### `future_allowed_extra_profit`
!!! description "`CryptoSwap.future_allowed_extra_profit() -> uint256:`"

    Getter for the future allowed extra profit.

    Returns: future allowed extra profit (`uint256`).

    ??? quote "Source code"

        ```vyper
        future_allowed_extra_profit: public(uint256)
        ```

    === "Example"

        ```shell
        >>> CryptoSwap.future_allowed_extra_profit()
        0
        ```


### `future_adjustment_step`
!!! description "`CryptoSwap.future_adjustment_step() -> uint256:`"

    Getter for the future adjustment step.

    Returns: future adjustment step (`uint256`).

    ??? quote "Source code"

        ```vyper
        future_adjustment_step: public(uint256)
        ```

    === "Example"

        ```shell
        >>> CryptoSwap.future_adjustment_step()
        0
        ```
