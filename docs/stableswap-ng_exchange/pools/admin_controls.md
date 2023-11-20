The following methods are guarded and may only be called by the **`admin`** of the Stableswap-NG Factory.


### `ramp_A`
!!! description "`StableSwap.ramp_A(_future_A: uint256, _future_time: uint256):`"

    !!!guard "Guarded Method"
        This function is only callable by the `admin` of the Factory.

    Function to ramp amplification coefficient A. Minimum ramp time is 86400 (24h).

    *Limitations when ramping A:*

    - `block.timestamp` >= `initial_A_time` + `MIN_RAMP_TIME`  
    - `_future_time` >= `block.timestamp` + `MIN_RAMP_TIME`   
    - `future_A` > 0  
    - `future_A` < `MAX_A (1000000)`

    Emits: `RampA`

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_future_A` |  `uint256` | future A value |
    | `_future_time` |  `uint256` | timestamp until ramping should occur; needs to be at least 24h (`MIN_RAMP_TIME`) |

    ??? quote "Source code"

        ```vyper 
        A_PRECISION: constant(uint256) = 100
        MAX_A: constant(uint256) = 10 ** 6
        MAX_A_CHANGE: constant(uint256) = 10

        MIN_RAMP_TIME: constant(uint256) = 86400

        event RampA:
            old_A: uint256
            new_A: uint256
            initial_time: uint256
            future_time: uint256

        @external
        def ramp_A(_future_A: uint256, _future_time: uint256):
            assert msg.sender == factory.admin()  # dev: only owner
            assert block.timestamp >= self.initial_A_time + MIN_RAMP_TIME
            assert _future_time >= block.timestamp + MIN_RAMP_TIME  # dev: insufficient time

            _initial_A: uint256 = self._A()
            _future_A_p: uint256 = _future_A * A_PRECISION

            assert _future_A > 0 and _future_A < MAX_A
            if _future_A_p < _initial_A:
                assert _future_A_p * MAX_A_CHANGE >= _initial_A
            else:
                assert _future_A_p <= _initial_A * MAX_A_CHANGE

            self.initial_A = _initial_A
            self.future_A = _future_A_p
            self.initial_A_time = block.timestamp
            self.future_A_time = _future_time

            log RampA(_initial_A, _future_A_p, block.timestamp, _future_time)
        ```

    === "Example"

        ```shell
        >>> StableSwap.ramp_A('todo')
        'todo'
        ```


### `stop_ramp_A`
!!! description "`StableSwap.stop_ramp_A():`"

    !!!guard "Guarded Method"
        This function is only callable by the `admin` of the Factory.

    Function to immediately stop the ramping A. The current value during the ramping process will be finalized as `A`.

    Emits: `StopRampA`

    ??? quote "Source code"

        ```vyper hl_lines="1"
        event StopRampA:
            A: uint256
            t: uint256

        @external
        def stop_ramp_A():
            assert msg.sender == factory.admin()  # dev: only owner

            current_A: uint256 = self._A()
            self.initial_A = current_A
            self.future_A = current_A
            self.initial_A_time = block.timestamp
            self.future_A_time = block.timestamp
            # now (block.timestamp < t1) is always False, so we return saved A

            log StopRampA(current_A, block.timestamp)
        ```

    === "Example"

        ```shell
        >>> StableSwap.stop_ramp_A()
        ```


### `set_new_fee`
!!! description "`StableSwap.set_new_fee(_new_fee: uint256, _new_offpeg_fee_multiplier: uint256):`"

    !!!guard "Guarded Method"
        This function is only callable by the `admin` of the Factory.
    
    Function to set new values for `fee` and `offpeg_fee_multiplier`.

    *Limitations when setting new parameters:*  

    - `_new_fee` <= `MAX_FEE` (5000000000)  
    - `_new_offpeg_fee_multiplier` * `_new_fee` <= `MAX_FEE` * `FEE_DENOMINATOR`  

    Emits: `ApplyNewFee`

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_new_fee` |  `uint256` | new fee |
    | `_new_offpeg_fee_multiplier` |  `uint256` | new off-peg fee multiplier |

    ??? quote "Source code"

        ```vyper 
        MAX_FEE: constant(uint256) = 5 * 10 ** 9
        FEE_DENOMINATOR: constant(uint256) = 10 ** 10

        event ApplyNewFee:
            fee: uint256
            offpeg_fee_multiplier: uint256

        @external
        def set_new_fee(_new_fee: uint256, _new_offpeg_fee_multiplier: uint256):

            assert msg.sender == factory.admin()

            # set new fee:
            assert _new_fee <= MAX_FEE
            self.fee = _new_fee

            # set new offpeg_fee_multiplier:
            assert _new_offpeg_fee_multiplier * _new_fee <= MAX_FEE * FEE_DENOMINATOR  # dev: offpeg multiplier exceeds maximum
            self.offpeg_fee_multiplier = _new_offpeg_fee_multiplier

            log ApplyNewFee(_new_fee, _new_offpeg_fee_multiplier)
        ```

    === "Example"

        ```shell
        >>> StableSwap.set_new_fee('todo')
        'todo'
        ```


### `set_ma_exp_time`
!!! description "`StableSwap.set_ma_exp_time(_ma_exp_time: uint256, _D_ma_time: uint256):`"

    !!!guard "Guarded Method"
        This function is only callable by the `admin` of the Factory.

    Function to set the moving average window for `ma_exp_time` and `D_ma_time`.

    *Limitations when setting new fee parameters:*  

    - `_ma_exp_time` and `_D_ma_time` > 0

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_ma_exp_time` |  `uint256` | new ma exp time |
    | `_D_ma_time` |  `uint256` | new D ma time |

    ??? quote "Source code"

        ```vyper 
        @external
        def set_ma_exp_time(_ma_exp_time: uint256, _D_ma_time: uint256):
            """
            @notice Set the moving average window of the price oracles.
            @param _ma_exp_time Moving average window. It is time_in_seconds / ln(2)
            """
            assert msg.sender == factory.admin()  # dev: only owner
            assert 0 not in [_ma_exp_time, _D_ma_time]

            self.ma_exp_time = _ma_exp_time
            self.D_ma_time = _D_ma_time
        ```

    === "Example"

        ```shell
        >>> StableSwap.set_ma_exp_time('todo')
        'todo'
        ``` 