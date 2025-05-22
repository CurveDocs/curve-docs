<h1></h1>

Applying new parameters or transferring the ownership of the factory involves a **two-step model**. In the first step, changes need to be committed. The second step involves applying these changes.


## **Pool Ownership**
All pools created through the Factory are "owned" by the admin of the Factory, which is the Curve DAO. Ownership can only be changed within the factory contract via `commit_transfer_ownership` and `accept_transfer_ownership`.


---


## **Amplification Coefficient and Gamma**

More information about the parameters [here](https://nagaking.substack.com/p/deep-dive-curve-v2-parameters).

The appropriate value for `A` and `gamma` is dependent upon the type of coin being used within the pool, and is subject to optimization and pool-parameter update based on the market history of the trading pair. It is possible to modify the parameters for a pool after it has been deployed. However, it requires a vote within the Curve DAO and must reach a 15% quorum.


### `ramp_A_gamma`
!!! description "`CryptoSwap.ramp_A_gamma(future_A: uint256, future_gamma: uint256, future_time: uint256):`"

    !!!guard "Guarded Method"
        This function is only callable by the `admin` of the Factory contract.

    Function to ramp A and gamma parameter values linearly. `A` and `gamma` are packed within the same variable.

    Emits: `RampAgamma`

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `future_A` | `uint256` | future A value |
    | `future_gamma` | `uint256` | future gamma value |
    | `future_time` | `uint256` | timestamp at which the ramping will end|

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
        def ramp_A_gamma(
            future_A: uint256, future_gamma: uint256, future_time: uint256
        ):
            """
            @notice Initialise Ramping A and gamma parameter values linearly.
            @dev Only accessible by factory admin, and only
            @param future_A The future A value.
            @param future_gamma The future gamma value.
            @param future_time The timestamp at which the ramping will end.
            """
            assert msg.sender == factory.admin()  # dev: only owner
            assert block.timestamp > self.initial_A_gamma_time + (MIN_RAMP_TIME - 1)  # dev: ramp undergoing
            assert future_time > block.timestamp + MIN_RAMP_TIME - 1  # dev: insufficient time

            A_gamma: uint256[2] = self._A_gamma()
            initial_A_gamma: uint256 = A_gamma[0] << 128
            initial_A_gamma = initial_A_gamma | A_gamma[1]

            assert future_A > MIN_A - 1
            assert future_A < MAX_A + 1
            assert future_gamma > MIN_GAMMA - 1
            assert future_gamma < MAX_GAMMA + 1

            ratio: uint256 = 10**18 * future_A / A_gamma[0]
            assert ratio < 10**18 * MAX_A_CHANGE + 1
            assert ratio > 10**18 / MAX_A_CHANGE - 1

            ratio = 10**18 * future_gamma / A_gamma[1]
            assert ratio < 10**18 * MAX_A_CHANGE + 1
            assert ratio > 10**18 / MAX_A_CHANGE - 1

            self.initial_A_gamma = initial_A_gamma
            self.initial_A_gamma_time = block.timestamp

            future_A_gamma: uint256 = future_A << 128
            future_A_gamma = future_A_gamma | future_gamma
            self.future_A_gamma_time = future_time
            self.future_A_gamma = future_A_gamma

            log RampAgamma(
                A_gamma[0],
                future_A,
                A_gamma[1],
                future_gamma,
                block.timestamp,
                future_time,
            )
        ```

    === "Example"

        ```shell
        >>> CryptoSwap.ramp_A_gamma(2700000, 1300000000000, 1693674492)
        ```


### `stop_ramp_A_gamma`
!!! description "`CryptoSwap.stop_ramp_A_gamma():`"

    !!!guard "Guarded Method"
        This function is only callable by the `admin` of the Factory contract.

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
            """
            @notice Stop Ramping A and gamma parameters immediately.
            @dev Only accessible by factory admin.
            """
            assert msg.sender == factory.admin()  # dev: only owner

            A_gamma: uint256[2] = self._A_gamma()
            current_A_gamma: uint256 = A_gamma[0] << 128
            current_A_gamma = current_A_gamma | A_gamma[1]
            self.initial_A_gamma = current_A_gamma
            self.future_A_gamma = current_A_gamma
            self.initial_A_gamma_time = block.timestamp
            self.future_A_gamma_time = block.timestamp

            # ------ Now (block.timestamp < t1) is always False, so we return saved A.

            log StopRampA(A_gamma[0], A_gamma[1], block.timestamp)
        ```

    === "Example"

        ```shell
        >>> CryptoSwap.stop_ramp_A_gamma()
        ```



## **Changing Parameters**

### `commit_new_parameters`
!!! description "`CryptoSwap.commit_new_parameters(_new_mid_fee: uint256, _new_out_fee: uint256, _new_fee_gamma: uint256, _new_allowed_extra_profit: uint256, _new_adjustment_step: uint256, _new_ma_time: uint256):`"

    !!!guard "Guarded Method"
        This function is only callable by the `admin` of the Factory contract.

    Function to commit new parameters. The new parameters do not take immediate effect.

    Emits: `CommitNewParameters`

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_new_mid_fee` | `uint256` | new `mid_fee` value |
    | `_new_out_fee` | `uint256` | new `out_fee` value |
    | `_new_fee_gamma` | `uint256` | new `fee_gamma` value |
    | `_new_allowed_extra_profit` | `uint256` | new `allowed_extra_profit` value |
    | `_new_adjustment_step` | `uint256` |new `adjustment_step` value |
    | `_new_ma_time` | `uint256` | new `ma_time` value |

    ??? quote "Source code"

        ```vyper
        event CommitNewParameters:
            deadline: indexed(uint256)
            mid_fee: uint256
            out_fee: uint256
            fee_gamma: uint256
            allowed_extra_profit: uint256
            adjustment_step: uint256
            ma_time: uint256

        future_packed_rebalancing_params: uint256
        future_packed_fee_params: uint256

        ADMIN_ACTIONS_DELAY: constant(uint256) = 3 * 86400

        @external
        def commit_new_parameters(
            _new_mid_fee: uint256,
            _new_out_fee: uint256,
            _new_fee_gamma: uint256,
            _new_allowed_extra_profit: uint256,
            _new_adjustment_step: uint256,
            _new_ma_time: uint256,
        ):
            """
            @notice Commit new parameters.
            @dev Only accessible by factory admin.
            @param _new_mid_fee The new mid fee.
            @param _new_out_fee The new out fee.
            @param _new_fee_gamma The new fee gamma.
            @param _new_allowed_extra_profit The new allowed extra profit.
            @param _new_adjustment_step The new adjustment step.
            @param _new_ma_time The new ma time. ma_time is time_in_seconds/ln(2).
            """
            assert msg.sender == Factory(self.factory).admin()  # dev: only owner
            assert self.admin_actions_deadline == 0  # dev: active action

            _deadline: uint256 = block.timestamp + ADMIN_ACTIONS_DELAY
            self.admin_actions_deadline = _deadline

            # ----------------------------- Set fee params ---------------------------

            new_mid_fee: uint256 = _new_mid_fee
            new_out_fee: uint256 = _new_out_fee
            new_fee_gamma: uint256 = _new_fee_gamma

            current_fee_params: uint256[3] = self._unpack(self.packed_fee_params)

            if new_out_fee < MAX_FEE + 1:
                assert new_out_fee > MIN_FEE - 1  # dev: fee is out of range
            else:
                new_out_fee = current_fee_params[1]

            if new_mid_fee > MAX_FEE:
                new_mid_fee = current_fee_params[0]
            assert new_mid_fee <= new_out_fee  # dev: mid-fee is too high

            if new_fee_gamma < 10**18:
                assert new_fee_gamma > 0  # dev: fee_gamma out of range [1 .. 10**18]
            else:
                new_fee_gamma = current_fee_params[2]

            self.future_packed_fee_params = self._pack(
                [new_mid_fee, new_out_fee, new_fee_gamma]
            )

            # ----------------- Set liquidity rebalancing parameters -----------------

            new_allowed_extra_profit: uint256 = _new_allowed_extra_profit
            new_adjustment_step: uint256 = _new_adjustment_step
            new_ma_time: uint256 = _new_ma_time

            current_rebalancing_params: uint256[3] = self._unpack(self.packed_rebalancing_params)

            if new_allowed_extra_profit > 10**18:
                new_allowed_extra_profit = current_rebalancing_params[0]

            if new_adjustment_step > 10**18:
                new_adjustment_step = current_rebalancing_params[1]

            if new_ma_time < 872542:  # <----- Calculated as: 7 * 24 * 60 * 60 / ln(2)
                assert new_ma_time > 86  # dev: MA time should be longer than 60/ln(2)
            else:
                new_ma_time = current_rebalancing_params[2]

            self.future_packed_rebalancing_params = self._pack(
                [new_allowed_extra_profit, new_adjustment_step, new_ma_time]
            )

            # ---------------------------------- LOG ---------------------------------

            log CommitNewParameters(
                _deadline,
                new_mid_fee,
                new_out_fee,
                new_fee_gamma,
                new_allowed_extra_profit,
                new_adjustment_step,
                new_ma_time,
            )
        ```

    === "Example"

        ```shell
        >>> CryptoSwap.commit_new_parameters(20000000, 45000000, 350000000000000, 100000000000, 100000000000, 1800)
        ```


### `apply_new_parameters`
!!! description "`CryptoSwap.apply_new_parameters()`"

    Function to apply the parameters from [`commit_new_parameters`](#commit_new_parameters).

    Emits: `NewParameters`

    ??? quote "Source code"

        ```vyper
        event NewParameters:
            mid_fee: uint256
            out_fee: uint256
            fee_gamma: uint256
            allowed_extra_profit: uint256
            adjustment_step: uint256
            ma_time: uint256

        packed_rebalancing_params: public(uint256)  # <---------- Contains rebalancing
        #               parameters allowed_extra_profit, adjustment_step, and ma_time.
        future_packed_rebalancing_params: uint256

        packed_fee_params: public(uint256)  # <---- Packs mid_fee, out_fee, fee_gamma.
        future_packed_fee_params: uint256

        @external
        @nonreentrant("lock")
        def apply_new_parameters():
            """
            @notice Apply committed parameters.
            @dev Only callable after admin_actions_deadline.
            """
            assert block.timestamp >= self.admin_actions_deadline  # dev: insufficient time
            assert self.admin_actions_deadline != 0  # dev: no active action

            self.admin_actions_deadline = 0

            packed_fee_params: uint256 = self.future_packed_fee_params
            self.packed_fee_params = packed_fee_params

            packed_rebalancing_params: uint256 = self.future_packed_rebalancing_params
            self.packed_rebalancing_params = packed_rebalancing_params

            rebalancing_params: uint256[3] = self._unpack(packed_rebalancing_params)
            fee_params: uint256[3] = self._unpack(packed_fee_params)

            log NewParameters(
                fee_params[0],
                fee_params[1],
                fee_params[2],
                rebalancing_params[0],
                rebalancing_params[1],
                rebalancing_params[2],
            )
        ```

    === "Example"

        ```shell
        >>> CryptoSwap.apply_new_parameters()
        ```


### `revert_new_parameters`
!!! description "`CryptoSwap.revert_new_parameters() -> address: view`"

    !!!guard "Guarded Method"
        This function is only callable by the `admin` of the Factory contract.

    Function to revert the parameters changes.

    ??? quote "Source code"

        ```vyper
        @external
        def revert_new_parameters():
            """
            @notice Revert committed parameters
            @dev Only accessible by factory admin. Setting admin_actions_deadline to 0
                ensures a revert in apply_new_parameters.
            """
            assert msg.sender == Factory(self.factory).admin()  # dev: only owner
            self.admin_actions_deadline = 0
        ```

    === "Example"

        ```shell
        >>> CryptoSwap.revert_new_parameters()
        ```


### `admin_actions_deadline`
!!! description "`CryptoSwap.admin_actions_deadline() -> uint256: view`"

    Getter for the admin actions deadline. This is the deadline until which new parameter changes can be applied. When committing new changes, there is a three-day timespan to apply them (`ADMIN_ACTIONS_DELAY`). If called later, the call will revert.

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
!!! description "`CryptoSwap.initial_A_gamma() -> uint256: view`"

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
!!! description "`CryptoSwap.initial_A_gamma_time() -> uint256: view`"

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
!!! description "`CryptoSwap.future_A_gamma() -> uint256: view`"

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
!!! description "`CryptoSwap.future_A_gamma_time() -> uint256: view`"

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
