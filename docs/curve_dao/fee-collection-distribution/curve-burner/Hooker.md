<h1>Hooker.vy</h1>

!!!github "GitHub"
    The source code of the `CoWSwapBurner.vy` contract can be found on [:material-github: GitHub](https://github.com/curvefi/curve-burners/blob/main/contracts/hooks/Hooker.vy).


The `Hooker` contract is a versatile and essential component within the Curve Finance ecosystem, designed to support and manage hooks that interact with the `FeeCollector` contract. This contract enables the execution of predefined actions (hooks) that can be triggered under specific conditions, such as during the fee collection process. It handles the calculation and distribution of compensations, ensuring that hooks are executed correctly and at the appropriate times.

*The contract has the following key features:*

- **Hook Management**: Hooks can be added to the contract via the `set_hooks` function. These hooks define actions to be executed, including target addresses, method data, and compensation strategies.
- **Compensation Calculation**: The contract includes a comprehensive system for calculating compensation for executing hooks, based on predefined strategies. This ensures that those who execute hooks are fairly rewarded.
- **Execution Control**: The `duty_act` function ensures that mandatory hooks (duty hooks) are executed as part of the fee collection process, while the `act` function allows for general hook execution by anyone.
- **Cooldown Management**: Compensation strategies include cooldown periods to prevent abuse and ensure fair distribution of rewards. The `duty_counter` helps manage these cooldown periods by tracking the epochs in which compensations are made.
- **Security and Access Control**: Certain functions, like `set_hooks` and `one_time_hooks`, are restricted to the contract owner to maintain security and control over the contract's behavior.

Hooks need to be added to the contract via the [`set_hooks`](#set_hooks) function. Once added, these hooks can be executed by anyone using the [`act`](#act) function. Mandatory hooks, marked with the duty flag, are executed during the fee collection process using the [`duty_act`](#duty_act) function.


---


## **Compensation Strategy**

Each `hook` includes a `compensation_strategy` that defines how and when the executor of the hook will be compensated. This ensures that there is an incentive to call hooks according to predefined rules.

The `CompensationStrategy` consists of the following values:

```vyper
struct CompensationStrategy:
    amount: uint256  # In case of Dutch auction max amount
    cooldown: CompensationCooldown
    start: uint256
    end: uint256
    dutch: bool

struct CompensationCooldown:
    duty_counter: uint64  # last compensation epoch
    used: uint64
    limit: uint64  # Maximum number of compensations between duty acts (week)
```

- **`amount`**: The maximum amount of compensation available for executing the hook.
- **`CompensationCooldown`**: Contains details about the cooldown period between compensations, consisting of:
    - `duty_counter`: Keeps track of the last epoch in which a compensation was made.
    - `used`: Indicates the number of compensations made within the current cooldown period.
    - `limit`: Represents the maximum number of compensations allowed within the cooldown period.
- **`start`**: Defines the starting time of the compensation period within a week.
- **`end`**: Defines the ending time of the compensation period within a week.
- **`dutch`**: A boolean indicating if the compensation uses a Dutch auction mechanism. If `true`, the compensation amount decreases linearly over time from the `start` to the `end`. This encourages earlier execution of the hook to receive a higher reward.


---


## **Hooks**

Before hooks can be executed, they need to be added via `set_hooks`. These hooks can then be externally executed by anyone.


### `hooks`
!!! description "`Hooker.hooks(arg0: uint256) -> Hook: view`"

    Getter for the hooks recorded in the contract.

    Returns: `Hook` struct consisting of the target address (`address`), a byte array containing the method identifier and additional data (`Bytes[1024]`), compensation strategy (`CompensationStrategy`) and if the hook is a duty hook or not (`bool`).

    | Input   | Type      | Description        |
    | ------- | --------- | ------------------ |
    | `arg0`  | `uint256` | Index of the hook. |

    ??? quote "Source code"

        === "Hooker.vy"

            ```vyper
            struct Hook:
                to: address
                foreplay: Bytes[1024]  # including method_id
                compensation_strategy: CompensationStrategy
                duty: bool  # Hooks mandatory to act after fee_collector transfer

            hooks: public(DynArray[Hook, MAX_HOOKS_LEN])
            ```

    === "Example"
        ```shell
        >>> Hooker.hooks(0)
        '0xD16d5eC345Dd86Fb63C6a9C43c517210F1027914, 0x89afcb44000000000000000000000000f939e0a03fb07f59a73314e73794be0e57ac1b4e, 0, 0, 0, 0, 0, 0, false, true'
        ```


### `set_hooks`
!!! description "`Hooker.set_hooks(_new_hooks: DynArray[Hook, MAX_HOOKS_LEN])`"

    !!!guard "Guarded Method"
        This function is only callable by the `admin` of the contract.

    Function to set new hooks.

    | Input   | Type      | Description                    |
    | ------- | --------- | ------------------------------ |
    | `_new_hooks` | `DynArray[Hook, MAX_HOOKS_LEN]` | Array of `Hook` structs.     |

    *Each `Hook` struct contains:*

    - `to`: The target address for the hook action.
    - `foreplay`: A byte array containing the method identifier and additional data.
    - `compensation`: The strategy for compensating the hook executor.
    - `duty`: A flag bool if the hook is mandatory or not.

    ??? quote "Source code"

        === "Hooker.vy"

            ```vyper
            struct Hook:
                to: address
                foreplay: Bytes[1024]  # including method_id
                compensation_strategy: CompensationStrategy
                duty: bool  # Hooks mandatory to act after fee_collector transfer

            @external
            def set_hooks(_new_hooks: DynArray[Hook, MAX_HOOKS_LEN]):
                """
                @notice Set new hooks
                @dev Callable only by owner
                @param _new_hooks New list of hooks
                """
                assert msg.sender == fee_collector.owner(), "Only owner"

                self._set_hooks(_new_hooks)

            @internal
            def _set_hooks(new_hooks: DynArray[Hook, MAX_HOOKS_LEN]):
                self.hooks = new_hooks

                buffer_amount: uint256 = 0
                mask: uint256 = 0
                for i in range(len(new_hooks), bound=MAX_HOOKS_LEN):
                    assert new_hooks[i].compensation_strategy.start < WEEK
                    assert new_hooks[i].compensation_strategy.end < WEEK

                    buffer_amount += new_hooks[i].compensation_strategy.amount *\
                                        convert(new_hooks[i].compensation_strategy.cooldown.limit, uint256)
                    if new_hooks[i].duty:
                        mask |= 1 << i
                self.buffer_amount = buffer_amount
                self.duties_checklist = mask
            ```

    === "Example"
        ```shell
        >>> soon
        ```


---


## **Executing Hooks**

There are two functions to execute hooks: `duty_act` and `act`.

The `duty_act` method is designed to be called by the `FeeCollector` contract during the `FORWARD` epoch. This function is called when coins are forwarded from the `FeeCollector` using the `forward` function.

The `act` function is a more general function to execute hooks and compensate the caller, callable by anyone.


**Compensation for executing hooks**

The compensation strategy in the Hooker contract determines how and when callers (keepers) are compensated for executing hooks. This strategy includes parameters for managing compensation amounts, cooldowns, and execution limits, ensuring fair and controlled distribution of rewards.


*The compensation strategy is defined within the `CompensationStrategy` struct, which includes several fields:*

```vyper
struct CompensationStrategy:
    amount: uint256  # In case of Dutch auction max amount
    cooldown: CompensationCooldown
    start: uint256
    end: uint256
    dutch: bool
```

- `amount`: The maximum compensation amount. For Dutch auction strategies, this represents the starting maximum amount.
- `cooldown`: A nested struct (CompensationCooldown) that manages the cooldown period and usage limits for compensations.
- `start`: The start time (within a week) for the compensation period.
- `end`: The end time (within a week) for the compensation period.
- `dutch`: A boolean indicating whether the compensation follows a Dutch auction strategy, where the compensation decreases over time.


*The `CompensationCooldown` struct includes fields to manage the number of compensations within a duty cycle and track the duty counter:*

```vyper
struct CompensationCooldown:
    duty_counter: uint64  # last compensation epoch
    used: uint64
    limit: uint64  # Maximum number of compensations between duty acts (week)
```

- `duty_counter`: Tracks the last duty cycle in which compensation was provided.
- `used`: The number of compensations already provided in the current cycle.
- `limit`: The maximum number of compensations allowed within a single duty cycle


*To see the actual value of compensation, see [`calc_compensation`](#calc_compensation).*



### `duty_act`
!!! description "`Hooker.duty_act(_hook_inputs: DynArray[HookInput, MAX_HOOKS_LEN], _receiver: address=msg.sender) -> uint256`"

    Function which executes hooks as part of the fee collection process. It ensures all mandatory hooks, which are marked with the `duty` flag, are executed and handles the distribution of any associated compensation. The function checks that all mandatory duty hooks are included in the `_hook_inputs`.

    Returns: received compensation (`uint256`).

    Emits: `DutyAct`, `HookShot` and `Act`

    | Input          | Type                                      | Description                                            |
    | -------------- | ----------------------------------------- | ------------------------------------------------------ |
    | `_hook_inputs` | `DynArray[HookInput, MAX_HOOKS_LEN]`      | Array of `HookInput` structs representing the hooks to be executed. |
    | `_receiver`    | `address`                                  | Receiver of the compensation. Defaults to `msg.sender`. |

    *Each `HookInput` struct contains:*

    - `hook_id:` `uint8` - The identifier for the hook to be executed.
    - `value:` `uint256` - The amount of raw ETH to be sent with the hook execution.
    - `data:` `Bytes[8192]` - The data payload for the hook, including the method identifier and parameters.

    ??? quote "Source code"

        === "Hooker.vy"

            ```vyper
            event DutyAct:
                pass

            event Act:
                receiver: indexed(address)
                compensation: uint256

            event HookShot:
                hook_id: indexed(uint8)
                compensation: uint256

            # Property: no future changes in FeeCollector
            struct HookInput:
                hook_id: uint8
                value: uint256
                data: Bytes[8192]

            hooks: public(DynArray[Hook, MAX_HOOKS_LEN])
            duties_checklist: uint256  # mask of hooks with `duty` flag
            buffer_amount: public(uint256)

            duty_counter: public(uint64)

            @external
            @payable
            def duty_act(_hook_inputs: DynArray[HookInput, MAX_HOOKS_LEN], _receiver: address=msg.sender) -> uint256:
                """
                @notice Entry point to run hooks for FeeCollector
                @param _hook_inputs Inputs assembled by keepers
                @param _receiver Receiver of compensation (sender by default)
                @return Compensation received
                """
                if msg.sender == fee_collector.address:
                    self.duty_counter = convert((block.timestamp - START_TIME) / WEEK, uint64)  # assuming time frames are divided weekly

                hook_mask: uint256 = 0
                for solicitation in _hook_inputs:
                    hook_mask |= 1 << solicitation.hook_id
                duties_checklist: uint256 = self.duties_checklist
                assert hook_mask & duties_checklist == duties_checklist, "Not all duties"

                log DutyAct()

                return self._act(_hook_inputs, _receiver)

            @internal
            def _act(_hook_inputs: DynArray[HookInput, MAX_HOOKS_LEN], _receiver: address) -> uint256:
                current_duty_counter: uint64 = self.duty_counter

                compensation: uint256 = 0
                prev_idx: uint8 = 0
                for solicitation in _hook_inputs:
                    hook: Hook = self.hooks[solicitation.hook_id]
                    self._shot(hook, solicitation)

                    if hook.compensation_strategy.cooldown.duty_counter < current_duty_counter:
                        hook.compensation_strategy.cooldown.used = 0
                        hook.compensation_strategy.cooldown.duty_counter = current_duty_counter
                    hook_compensation: uint256 = self._compensate(hook)

                    if hook_compensation > 0:
                        compensation += hook_compensation
                        hook.compensation_strategy.cooldown.used += 1
                        self.hooks[solicitation.hook_id].compensation_strategy.cooldown = hook.compensation_strategy.cooldown

                    if prev_idx > solicitation.hook_id:
                        raise "Hooks not sorted"
                    prev_idx = solicitation.hook_id
                    log HookShot(prev_idx, hook_compensation)

                log Act(_receiver, compensation)

            @internal
            def _shot(hook: Hook, hook_input: HookInput):
                """
                @notice Hook run implementation
                """
                raw_call(
                    hook.to,
                    concat(hook.foreplay, hook_input.data),
                    value=hook_input.value,
                )
            ```

    === "Example"
        ```shell
        >>> soon
        ```


### `duty_counter`
!!! description "`Hooker.duty_counter() -> uint64: view`"

    Getter for the duty counter value. This varaible is used to record the current week number and is used to manage and reset the cooldown periods for hook compensations, ensuring that hooks do not exceed their compensation limits within a given week.

    Returns: duty counter (`uint64`).

    ??? quote "Source code"

        === "Hooker.vy"

            ```vyper
            duty_counter: public(uint64)


            ```

    === "Example"
        ```shell
        >>> Hooker.duty_counter()
        0
        ```


### `act`
!!! description "`Hooker.act(_hook_inputs: DynArray[HookInput, MAX_HOOKS_LEN], _receiver: address=msg.sender) -> uint256`"

    Function to execute hooks. Unlike, `duty_act` (which is specifically for the fee distribution process), this function allows the execuction of more general hooks.

    Returns: received compensation (`uint256`).

    Emits: `HookShot` and `Act`

    | Input          | Type                                      | Description                                            |
    | -------------- | ----------------------------------------- | ------------------------------------------------------ |
    | `_hook_inputs` | `DynArray[HookInput, MAX_HOOKS_LEN]`      | Array of `HookInput` structs representing the hooks to be executed. |
    | `_receiver`    | `address`                                  | Receiver of the compensation. Defaults to `msg.sender`. |

    *Each `HookInput` struct contains:*

    - `hook_id:` `uint8` - The identifier for the hook to be executed.
    - `value:` `uint256` - The amount of raw ETH to be sent with the hook execution.
    - `data:` `Bytes[8192]` - The data payload for the hook, including the method identifier and parameters.

    ??? quote "Source code"

        === "Hooker.vy"

            ```vyper
            event Act:
                receiver: indexed(address)
                compensation: uint256

            event HookShot:
                hook_id: indexed(uint8)
                compensation: uint256

            struct CompensationCooldown:
                duty_counter: uint64  # last compensation epoch
                used: uint64
                limit: uint64  # Maximum number of compensations between duty acts (week)

            struct CompensationStrategy:
                amount: uint256  # In case of Dutch auction max amount
                cooldown: CompensationCooldown
                start: uint256
                end: uint256
                dutch: bool

            @external
            @payable
            def act(_hook_inputs: DynArray[HookInput, MAX_HOOKS_LEN], _receiver: address=msg.sender) -> uint256:
                """
                @notice Entry point to run hooks and receive compensation
                @param _hook_inputs Inputs assembled by keepers
                @param _receiver Receiver of compensation (sender by default)
                @return Compensation received
                """
                return self._act(_hook_inputs, _receiver)

            @internal
            def _act(_hook_inputs: DynArray[HookInput, MAX_HOOKS_LEN], _receiver: address) -> uint256:
                current_duty_counter: uint64 = self.duty_counter

                compensation: uint256 = 0
                prev_idx: uint8 = 0
                for solicitation in _hook_inputs:
                    hook: Hook = self.hooks[solicitation.hook_id]
                    self._shot(hook, solicitation)

                    if hook.compensation_strategy.cooldown.duty_counter < current_duty_counter:
                        hook.compensation_strategy.cooldown.used = 0
                        hook.compensation_strategy.cooldown.duty_counter = current_duty_counter
                    hook_compensation: uint256 = self._compensate(hook)

                    if hook_compensation > 0:
                        compensation += hook_compensation
                        hook.compensation_strategy.cooldown.used += 1
                        self.hooks[solicitation.hook_id].compensation_strategy.cooldown = hook.compensation_strategy.cooldown

                    if prev_idx > solicitation.hook_id:
                        raise "Hooks not sorted"
                    prev_idx = solicitation.hook_id
                    log HookShot(prev_idx, hook_compensation)

                log Act(_receiver, compensation)

            @internal
            def _shot(hook: Hook, hook_input: HookInput):
                """
                @notice Hook run implementation
                """
                raw_call(
                    hook.to,
                    concat(hook.foreplay, hook_input.data),
                    value=hook_input.value,
                )
            ```

    === "Example"
        ```shell
        >>> soon
        ```


### `calc_compensation`
!!! description "`Hooker.calc_compensation(_hook_inputs: DynArray[HookInput, MAX_HOOKS_LEN], _duty: bool=False, _ts: uint256=block.timestamp) -> uint256`"

    Function to calculate the compensation for executing specific hooks.

    Returns: amount of target coins to receive as compensation (`uint256`).

    | Input   | Type      | Description                    |
    | ------- | --------- | ------------------------------ |
    | `_hook_inputs` | `DynArray[HookInput, MAX_HOOKS_LEN]` | Array of `HookInput` structs representing the hooks to be executed. |
    | `_duty`   | `bool` | Wether the act is performed by the FeeCollector. Defaults to `False`. |
    | `_ts`   | `address` | timestamp at which to calculate the compensation for. Defaults to `block.timestamp` |

    *Each `HookInput` struct contains:*

    - `hook_id:` `uint8` - The identifier for the hook to be executed.
    - `value:` `uint256` - The amount of raw ETH to be sent with the hook execution.
    - `data:` `Bytes[8192]` - The data payload for the hook, including the method identifier and parameters.

    ??? quote "Source code"

        === "Hooker.vy"

            ```vyper
            struct HookInput:
                hook_id: uint8
                value: uint256
                data: Bytes[8192]

            @view
            @external
            def calc_compensation(_hook_inputs: DynArray[HookInput, MAX_HOOKS_LEN],
                                _duty: bool=False, _ts: uint256=block.timestamp) -> uint256:
                """
                @notice Calculate compensation for acting hooks. Checks input according to execution rules.
                    Older timestamps might work incorrectly.
                @param _hook_inputs HookInput of hooks to act, only ids are used
                @param _duty Bool whether act is through fee_collector (False by default).
                    If True, assuming calling from fee_collector if possible
                @param _ts Timestamp at which to calculate compensations (current by default)
                @return Amount of target coin to receive as compensation
                """
                current_duty_counter: uint64 = self.duty_counter
                if _duty:
                    hook_mask: uint256 = 0
                    for solicitation in _hook_inputs:
                        hook_mask |= 1 << solicitation.hook_id
                    duties_checklist: uint256 = self.duties_checklist
                    assert hook_mask & duties_checklist == duties_checklist, "Not all duties"

                    time_frame: (uint256, uint256) = fee_collector.epoch_time_frame(Epoch.FORWARD, _ts)
                    if time_frame[0] <= _ts and _ts < time_frame[1]:
                        current_duty_counter = convert((_ts - START_TIME) / WEEK, uint64)

                compensation: uint256 = 0
                prev_idx: uint8 = 0
                num: uint64 = 0
                for solicitation in _hook_inputs:
                    if prev_idx > solicitation.hook_id:
                        raise "Hooks not sorted"
                    else:
                        num = num + 1 if prev_idx == solicitation.hook_id else 1

                    hook: Hook = self.hooks[solicitation.hook_id]
                    if hook.compensation_strategy.cooldown.duty_counter < current_duty_counter:
                        hook.compensation_strategy.cooldown.used = 0
                    compensation += self._compensate(hook, _ts, num)
                    prev_idx = solicitation.hook_id

                return compensation
            ```

    === "Example"
        ```shell
        >>> soon
        ```


### `one_time_hooks`
!!! description "`Hooker.one_time_hooks(_hooks: DynArray[Hook, MAX_HOOKS_LEN], _inputs: DynArray[HookInput, MAX_HOOKS_LEN])`"

    !!!guard "Guarded Method"
        This function is only callable by the `owner` of the `FeeCollector` contract.

    Function to execute one-time-hooks. These are hooks that only need to be executed once, like coin approvals.

    | Input   | Type      | Description                    |
    | ------- | --------- | ------------------------------ |
    | `_hooks` | `DynArray[Hook, MAX_HOOKS_LEN]` | Array of `Hook` structs.     |
    | `_inputs`   | `DynArray[HookInput, MAX_HOOKS_LEN]` | Array of `HookInput` structs representing the hooks to be executed. |

    *Each `Hook` struct contains:*

    - `to`: The target address for the hook action.
    - `foreplay`: A byte array containing the method identifier and additional data.
    - `compensation`: The strategy for compensating the hook executor.
    - `duty`: A flag bool if the hook is mandatory or not.

    *Each `HookInput` struct contains:*

    - `hook_id:` `uint8` - The identifier for the hook to be executed.
    - `value:` `uint256` - The amount of raw ETH to be sent with the hook execution.
    - `data:` `Bytes[8192]` - The data payload for the hook, including the method identifier and parameters.

    ??? quote "Source code"

        === "Hooker.vy"

            ```vyper
            struct Hook:
                to: address
                foreplay: Bytes[1024]  # including method_id
                compensation_strategy: CompensationStrategy
                duty: bool  # Hooks mandatory to act after fee_collector transfer


            # Property: no future changes in FeeCollector
            struct HookInput:
                hook_id: uint8
                value: uint256
                data: Bytes[8192]

            @external
            @payable
            def one_time_hooks(_hooks: DynArray[Hook, MAX_HOOKS_LEN], _inputs: DynArray[HookInput, MAX_HOOKS_LEN]):
                """
                @notice Coin approvals, any settings that need to be executed once
                @dev Callable only by owner
                @param _hooks Hook input
                @param _inputs May be used to include native coin
                """
                assert msg.sender == fee_collector.owner(), "Only owner"

                self._one_time_hooks(_hooks, _inputs)

            @internal
            def _one_time_hooks(hooks: DynArray[Hook, MAX_HOOKS_LEN], inputs: DynArray[HookInput, MAX_HOOKS_LEN]):
                for i in range(len(hooks), bound=MAX_HOOKS_LEN):
                    self._shot(hooks[i], inputs[i])

            @internal
            def _shot(hook: Hook, hook_input: HookInput):
                """
                @notice Hook run implementation
                """
                raw_call(
                    hook.to,
                    concat(hook.foreplay, hook_input.data),
                    value=hook_input.value,
                )
            ```

    === "Example"
        ```shell
        >>> soon
        ```


### `buffer_amount`
!!! description "`Hooker.buffer_amount() -> uint256: view`"

    Getter for the buffer amount which represents the total potential compensation amount that might be required to execute all the hooks under their respective compensation strategies. 

    Returns: buffer amount (`uint256`).

    ??? quote "Source code"

        === "Hooker.vy"

            ```vyper
            buffer_amount: public(uint256)
            ```

    === "Example"
        ```shell
        >>> Hooker.buffer_amount()
        0
        ```


---


## **Valid Interface a la ERC-165**

In order for the Burner contract to be fully compatible with the `FeeCollector`, a specific interface needs to hold up as per [ERC-165](https://eips.ethereum.org/EIPS/eip-165):

```vyper
SUPPORTED_INTERFACES: constant(bytes4[2]) = [
    # ERC165: method_id("supportsInterface(bytes4)") == 0x01ffc9a7
    0x01ffc9a7,
    # Hooker:
    #   method_id("duty_act((uint8,uint256,bytes)[],address)") == 0x8c88eb86
    #   method_id("buffer_amount()") == 0x69e15fcb
    0xe569b44d,
]
```


### `supportsInterface`
!!! description "`Hooker.supportsInterface(_interface_id: bytes4) -> bool`"

    Function to check if the burner supports the correct interface, as specified by the [ERC-165](https://eips.ethereum.org/EIPS/eip-165) standard. This method makes sure the contract is compatible with the `FeeCollector` contract.

    Returns: true or false (`bool`)

    | Input   | Type      | Description                    |
    | ------- | --------- | ------------------------------ |
    | `_interface_id` | `bytes4` | ID of the interface.     |

    ??? quote "Source code"

        === "Hooker.vy"

            ```vyper
            SUPPORTED_INTERFACES: constant(bytes4[2]) = [
                # ERC165: method_id("supportsInterface(bytes4)") == 0x01ffc9a7
                0x01ffc9a7,
                # Hooker:
                #   method_id("duty_act((uint8,uint256,bytes)[],address)") == 0x8c88eb86
                #   method_id("buffer_amount()") == 0x69e15fcb
                0xe569b44d,
            ]

            @pure
            @external
            def supportsInterface(_interface_id: bytes4) -> bool:
                """
                @dev Interface identification is specified in ERC-165.
                @param _interface_id Id of the interface
                """
                return _interface_id in SUPPORTED_INTERFACES
            ```

    === "Example"
        ```shell
        >>> soon
        ```



---



## **Recovering ERC-20 Tokens and ETH**

### `recover`
!!! description "`Hooker.recover(_coins: DynArray[ERC20, MAX_LEN])`"

    !!!guard "Guarded Method"
        This function is only callable by the `owner` or `emergency_owner` of the `FeeCollector`.

    Function to recover ERC20 tokens or ETH from the contract by transferring them to the `FeeCollector`.

    | Input       | Type                                   | Description                              |
    |-------------|----------------------------------------|------------------------------------------|
    | `_coins` | `DynArray[ERC20, MAX_LEN]`      | Array of coin addresses to recover.      |

    ??? quote "Source code"

        === "Hooker.vy"

            ```vyper
            @external
            def recover(_coins: DynArray[ERC20, MAX_LEN]):
                """
                @notice Recover ERC20 tokens or Ether from this contract
                @dev Callable only by owner and emergency owner
                @param _coins Token addresses
                """
                assert msg.sender in [fee_collector.owner(), fee_collector.emergency_owner()], "Only owner"

                for coin in _coins:
                    if coin.address == ETH_ADDRESS:
                        raw_call(fee_collector.address, b"", value=self.balance)
                    else:
                        coin.transfer(fee_collector.address, coin.balanceOf(self))  # do not need safe transfer
            ```

    === "Example"
        ```shell
        >>> soon
        ```


### `fee_collector`
!!! description "`Hooker.fee_collector() -> address: view`"

    Getter for the `FeeCollector` contract.

    Returns: fee collector (`address`).

    ??? quote "Source code"

        === "Hooker.vy"

            ```vyper
            fee_collector: public(immutable(FeeCollector))

            @external
            def __init__(_fee_collector: FeeCollector,
                        _initial_oth: DynArray[Hook, MAX_HOOKS_LEN], _initial_oth_inputs: DynArray[HookInput, MAX_HOOKS_LEN],
                        _initial_hooks: DynArray[Hook, MAX_HOOKS_LEN]):
                """
                @notice Contract constructor
                @param _fee_collector Hooker is _hooked_ to fee_collector contract with no update possibility
                @param _initial_oth One time hooks at initialization
                @param _initial_oth_inputs One time hooks input at initialization
                @param _initial_hooks Hooks to set at initialization
                """
                fee_collector = _fee_collector

                self._one_time_hooks(_initial_oth, _initial_oth_inputs)
                self._set_hooks(_initial_hooks)
            ```

    === "Example"
        ```shell
        >>> Hooker.fee_collector()
        '0xa2Bcd1a4Efbd04B63cd03f5aFf2561106ebCCE00'
        ```