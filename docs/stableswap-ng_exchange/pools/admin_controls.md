stableswap pools admin controls



AMM admin functions:

### `ramp_A`
!!! description "`StableSwap.ramp_A(_future_A: uint256, _future_time: uint256):`"

    !!!guard "Guarded Method"
        This function is only callable by the `admin` of the contract.

    Function to ramp A.

    Emits: `RampA`

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_future_A` |  `uint256` | future A value |
    | `_future_time` |  `uint256` | timestamp until its ramped up |

    ??? quote "Source code"

        ```python hl_lines="2"
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
        This function is only callable by the `admin` of the contract.

    Function to immediately stop the ramping of A. Value of A (while ramping up/down) will be set as A. 

    Emits: `StopRampA`

    ??? quote "Source code"

        ```python hl_lines="1"
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
!!! description "`StableSwap.`"

    !!!guard "Guarded Method"
        This function is only callable by the `admin` of the contract.
    
    Function to ..

    Returns: 

    Emits: 

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `` |  `` |  |

    ??? quote "Source code"

        ```python hl_lines="1"
        ```

    === "Example"

        ```shell
        >>> StableSwap.get_y('todo')
        'todo'
        ```


    
### `set_ma_exp_time`
!!! description "`StableSwap.`"

    !!!guard "Guarded Method"
        This function is only callable by the `admin` of the contract.

    Function to ..

    Returns: 

    Emits: 

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `` |  `` |  |

    ??? quote "Source code"

        ```python hl_lines="1"
        ```

    === "Example"

        ```shell
        >>> StableSwap.get_y('todo')
        'todo'
        ``` 