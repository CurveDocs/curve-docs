<h1>Pool: Admin Controls</h1>


!!!notebook
    A Jupyter Notebook regarding the admin-guarded functions of the pool can be found on [GitHub](https://github.com/CurveDocs/curve-notebook/blob/main/notebooks/scripts/cryptoswap-ng/admin_controls.ipynb).
    
    **Note:** In the future, these notebooks will be made more interactive and will be hosted for quick and easy usage.



# **Pool Ownership**
Pools created through the Factory are "owned" by the factory **`admin`**. Ownership can therefore only be changed within the factory contract via **`commit_transfer_ownership`** and **`accept_transfer_ownership`**. 

[Factory Contract Ownership](../../../factory/overview.md#factory-contract-ownership)

# **Parameter Changes**

More informations about the parameters: [https://nagaking.substack.com/p/deep-dive-curve-v2-parameters](https://nagaking.substack.com/p/deep-dive-curve-v2-parameters).

The appropriate value for **`A`** and **`gamma`** is dependent upon the type of coin being used within the pool, and is subject to optimisation and pool-parameter update based on the market history of the trading pair. It is possible to modify the parameters for a pool after it has been deployed. However, it requires a vote within the Curve DAO and must reach a 15% quorum.


## **Amplification Coefficient / Gamma**

### `ramp_A_gamma`
!!! description "`TwoCrypto.ramp_A_gamma(future_A: uint256, future_gamma: uint256, future_time: uint256):`"

    !!!guard "Guarded Method" 
        This function can only be called by the `admin` of the Factory contract.

    Function to linearly ramp the values of `A` and `gamma`. Both `A` and `gamma` are packed within the same variable.

    Emits: `RampAgamma`

    | Input          | Type      | Description           |
    | -------------- | --------- | --------------------- |
    | `future_A`     | `uint256` | Future value of `A`   |
    | `future_gamma` | `uint256` | Future value of `gamma` |
    | `future_time`  | `uint256` | Timestamp at which the ramping will end |

    ??? quote "Source code"

        === "CurveTwocryptoOptimized.vy"

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
        >>> TwoCrypto.ramp_A_gamma(todo)
        ```


### `stop_ramp_A_gamma`
!!! description "`TwoCrypto.stop_ramp_A_gamma():`"

    !!!guard "Guarded Method"
        This function can only be called by the `admin` of the Factory contract.

    Function to immediately stop the ramping of A and gamma parameters and set them to their current values.

    Emits: `StopRampA`

    ??? quote "Source code"

        === "CurveTwocryptoOptimized.vy"

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
        >>> TwoCrypto.stop_ramp_A_gamma(todo)
        ```


## **Other Parameters**

Other parameters, besides `A` and `gamma` can be modified via the `apply_new_parameters` function:

### `apply_new_parameters`
!!! description "`TwoCrypto.apply_new_parameters(_new_mid_fee: uint256, _new_out_fee: uint256, _new_fee_gamma: uint256, _new_allowed_extra_profit: uint256, _new_adjustment_step: uint256, _new_ma_time: uint256, _new_xcp_ma_time: uint256):`"

    !!!guard "Guarded Method"
        This function can only be called by the `admin` of the Factory contract.

    Function to commit new parameters. The new parameters are applied immediately.

    Emits: `NewParameters`

    | Input                   | Type      | Description                                         |
    | ----------------------- | --------- | --------------------------------------------------- |
    | `_new_mid_fee`          | `uint256` | New `mid_fee` value.                                |
    | `_new_out_fee`          | `uint256` | New `out_fee` value.                                |
    | `_new_fee_gamma`        | `uint256` | New `fee_gamma` value.                              |
    | `_new_allowed_extra_profit` | `uint256` | New `allowed_extra_profit` value.               |
    | `_new_adjustment_step`  | `uint256` | New `adjustment_step` value.                        |
    | `_new_ma_time`          | `uint256` | New `ma_time` value, which is time_in_seconds/ln(2).|
    | `_new_xcp_ma_time`      | `uint256` | New ma time for xcp oracles.                       |

    ??? quote "Source code"

        === "CurveTwocryptoOptimized.vy"

            ```vyper
            event NewParameters:
                mid_fee: uint256
                out_fee: uint256
                fee_gamma: uint256
                allowed_extra_profit: uint256
                adjustment_step: uint256
                ma_time: uint256
                xcp_ma_time: uint256

            @external
            @nonreentrant('lock')
            def apply_new_parameters(
                _new_mid_fee: uint256,
                _new_out_fee: uint256,
                _new_fee_gamma: uint256,
                _new_allowed_extra_profit: uint256,
                _new_adjustment_step: uint256,
                _new_ma_time: uint256,
                _new_xcp_ma_time: uint256,
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
                @param _new_xcp_ma_time The new ma time for xcp oracle.
                """
                assert msg.sender == factory.admin()  # dev: only owner

                # ----------------------------- Set fee params ---------------------------

                new_mid_fee: uint256 = _new_mid_fee
                new_out_fee: uint256 = _new_out_fee
                new_fee_gamma: uint256 = _new_fee_gamma

                current_fee_params: uint256[3] = self._unpack_3(self.packed_fee_params)

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

                self.packed_fee_params = self._pack_3([new_mid_fee, new_out_fee, new_fee_gamma])

                # ----------------- Set liquidity rebalancing parameters -----------------

                new_allowed_extra_profit: uint256 = _new_allowed_extra_profit
                new_adjustment_step: uint256 = _new_adjustment_step
                new_ma_time: uint256 = _new_ma_time

                current_rebalancing_params: uint256[3] = self._unpack_3(self.packed_rebalancing_params)

                if new_allowed_extra_profit > 10**18:
                    new_allowed_extra_profit = current_rebalancing_params[0]

                if new_adjustment_step > 10**18:
                    new_adjustment_step = current_rebalancing_params[1]

                if new_ma_time < 872542:  # <----- Calculated as: 7 * 24 * 60 * 60 / ln(2)
                    assert new_ma_time > 86  # dev: MA time should be longer than 60/ln(2)
                else:
                    new_ma_time = current_rebalancing_params[2]

                self.packed_rebalancing_params = self._pack_3(
                    [new_allowed_extra_profit, new_adjustment_step, new_ma_time]
                )

                # Set xcp oracle moving average window time:
                new_xcp_ma_time: uint256 = _new_xcp_ma_time
                if new_xcp_ma_time < 872542:
                    assert new_xcp_ma_time > 86  # dev: xcp MA time should be longer than 60/ln(2)
                else:
                    new_xcp_ma_time = self.xcp_ma_time
                self.xcp_ma_time = new_xcp_ma_time

                # ---------------------------------- LOG ---------------------------------

                log NewParameters(
                    new_mid_fee,
                    new_out_fee,
                    new_fee_gamma,
                    new_allowed_extra_profit,
                    new_adjustment_step,
                    new_ma_time,
                    _new_xcp_ma_time,
                )
            ```
    
    === "Example"

        ```shell
        >>> TwoCrypto.apply_new_parameters(todo)
        ```


# **Contract Info Methods**

### `initial_A_gamma`
!!! description "`TwoCrypto.initial_A_gamma -> uint256: view`"

    Getter for the initial A/gamma.

    Returns: A/gamma (`uint256`).

    ??? quote "Source code"

        === "CurveTwocryptoOptimized.vy"

            ```vyper
            initial_A_gamma: public(uint256)
            ```
    
    === "Example"

        ```shell
        >>> TwoCrypto.initial_A_gamma(todo)
        ```


### `initial_A_gamma_time`
!!! description "`TwoCrypto.initial_A_gamma_time -> uint256: view`"

    Getter for the initial A/gamma time.

    Returns: A/gamma time (`uint256`).

    ??? quote "Source code"

        === "CurveTwocryptoOptimized.vy"

            ```vyper
            initial_A_gamma_time: public(uint256)
            ```
    
    === "Example"

        ```shell
        >>> TwoCrypto.initial_A_gamma_time(todo)
        ```


### `future_A_gamma`
!!! description "`TwoCrypto.future_A_gamma -> uint256: view`"

    Getter for the future A/gamma.

    Returns: future A/gamma (`uint256`).

    ??? quote "Source code"

        === "CurveTwocryptoOptimized.vy"

            ```vyper
            future_A_gamma: public(uint256)
            ```
    
    === "Example"

        ```shell
        >>> TwoCrypto.future_A_gamma(todo)
        ```


### `future_A_gamma_time`
!!! description "`TwoCrypto.future_A_gamma_time -> uint256: view`"

    !!!info
        This value is initially set to 0 (default) when the pool is first deployed. It only gets populated by `block.timestamp + future_time` in the `ramp_A_gamma` function when the ramping process is initiated. After ramping is finished (i.e., `self.future_A_gamma_time < block.timestamp`), the variable is left as is and not set to 0.

    Getter for the future A/gamma time. This is the timestamp when the ramping process is finished.

    Returns: future A/gamma time (`uint256`).

    ??? quote "Source code"

        === "CurveTwocryptoOptimized.vy"

            ```vyper
            future_A_gamma_time: public(uint256)  # <------ Time when ramping is finished.
            #         This value is 0 (default) when pool is first deployed, and only gets
            #        populated by block.timestamp + future_time in `ramp_A_gamma` when the
            #                      ramping process is initiated. After ramping is finished
            #      (i.e. self.future_A_gamma_time < block.timestamp), the variable is left
            #                                                            and not set to 0.            
            ```
    
    === "Example"

        ```shell
        >>> TwoCrypto.future_A_gamma_time(todo)
        ```