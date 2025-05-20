## Overview

The following are methods that may only be called by the pool admin (``owner``).

Additionally, some admin methods require a two-phase transaction process, whereby changes are committed in a first
transaction and after a forced delay applied via a second transaction. The minimum delay after which a committed
action can be applied is given by the constant pool attribute ``admin_actions_delay``, which is set to 3 days.

## Pool Ownership Methods

### `StableSwap.commit_transfer_ownership`

!!! description "StableSwap.commit_transfer_ownership(_owner: address)"

    Initiate an ownership transfer of pool to ``_owner``.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_owner`       |  `address` | Future owner of the pool contract |

    Emits: <mark style="background-color: #FFD580; color: black">CommitNewAdmin</mark>

    ??? quote "Source code"

        ```vyper
        ADMIN_ACTIONS_DELAY: constant(uint256) = 3 * 86400

        ...

        @external
        def commit_transfer_ownership(_owner: address):
            assert msg.sender == self.owner  # dev: only owner
            assert self.transfer_ownership_deadline == 0  # dev: active transfer

            _deadline: uint256 = block.timestamp + ADMIN_ACTIONS_DELAY
            self.transfer_ownership_deadline = _deadline
            self.future_owner = _owner

            log CommitNewAdmin(_deadline, _owner)
        ```

    === "Example"

        ```shell
        >>> pool.commit_transfer_ownership()
        todo: console output
        ```

    !!! note
        The ownership can not be transferred before ``transfer_ownership_deadline``, which is the timestamp of the
        current block delayed by ``ADMIN_ACTIONS_DELAY``.

### `StableSwap.apply_transfer_ownership`

!!! description "StableSwap.apply_transfer_ownership()"

    Transfers ownership of the pool from current owner to the owner previously set via ``commit_transfer_ownership``.

    Emits: <mark style="background-color: #FFD580; color: black">NewAdmin</mark>

    ??? quote "Source code"

        ```vyper
        @external
        def apply_transfer_ownership():
            assert msg.sender == self.owner  # dev: only owner
            assert block.timestamp >= self.transfer_ownership_deadline  # dev: insufficient time
            assert self.transfer_ownership_deadline != 0  # dev: no active transfer

            self.transfer_ownership_deadline = 0
            _owner: address = self.future_owner
            self.owner = _owner

            log NewAdmin(_owner)
        ```

    === "Example"

        ```shell
        >>> pool.apply_transfer_ownership()
        todo: log output
        ```

    !!! warning

        Pool ownership can only be transferred once.

### `StableSwap.revert_transfer_ownership()`

!!! description "`StableSwap.revert_transfer_ownership()`"

    Reverts any previously committed transfer of ownership. This method resets the
    ``transfer_ownership_deadline`` to ``0``.

    ??? quote "Source code"

        ```vyper
        @external
        def revert_transfer_ownership():
            assert msg.sender == self.owner  # dev: only owner

            self.transfer_ownership_deadline = 0
        ```

    === "Example"

        ```shell
        >>> pool.revert_transfer_ownership()
        todo: log output
        ```

## Amplification Coefficient Admin Controls

The amplification coefficient ``A`` determines a pool’s tolerance for imbalance between the assets within it.
A higher value means that trades will incur slippage sooner as the assets within the pool become imbalanced.

!!! note

    Within the pools, ``A`` is in fact implemented as ``1 / A`` and therefore a higher value implies that the pool will
    be more tolerant to slippage when imbalanced.

The appropriate value for A is dependent upon the type of coin being used within the pool, and is subject to optimisation
and pool-parameter update based on the market history of the trading pair. It is possible to modify the amplification
coefficient for a pool after it has been deployed. However, it requires a vote within the Curve DAO and must reach a
15% quorum.

### `StableSwap.ramp_A`

!!! description "`StableSwap.ramp_A(_future_A: uint256, _future_time: uint256)`"

    Ramp ``A`` up or down by setting a new ``A`` to take effect at a future point in time.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_future_A`       |  `uint256` | New future value of ``A`` |
    | `_future_time`       |  `uint256` | Timestamp at which new ``A`` should take effect |

    Emits: <mark style="background-color: #FFD580; color: black">RampA</mark>

    ??? quote "Source code"

        ```vyper
        MIN_RAMP_TIME: constant(uint256) = 86400
        MAX_A_CHANGE: constant(uint256) = 10
        MAX_A: constant(uint256) = 10 ** 6

        ...

        @external
        def ramp_A(_future_A: uint256, _future_time: uint256):
            assert msg.sender == self.owner  # dev: only owner
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
        >>> pool.ramp_A()
        todo: log output
        ```

### `StableSwap.stop_ramp_A`

!!! description "StableSwap.stop_ramp_A()"

    Stop ramping ``A`` up or down and sets ``A`` to current ``A``.

    Emits: <mark style="background-color: #FFD580; color: black">StopRampA</mark>

    ??? quote "Source code"

        ```vyper
        @external
        def stop_ramp_A():
            assert msg.sender == self.owner  # dev: only owner

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
        >>> pool.stop_ramp_A()
        todo: log output
        ```

## Swap Fees Admin Controls

todo: hyperlink to fee collection and distribution
Curve pools charge fees on token swaps, where the fee may differ between pools. An admin fee is charged on the pool fee.
For an overview of how fees are distributed, please refer to Fee Collection and Distribution.


### `StableSwap.commit_new_fee`
!!! description "`StableSwap.commit_new_fee(_new_fee: uint256, _new_admin_fee: uint256)`"

    The method commits new fee params: these fees do not take immediate effect.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_new_fee`       |  `uint256` | New pool fee |
    | `_new_admin_fee`       |  `uint256` | New admin fee (expressed as a percentage of the pool fee) |

    Emits: <mark style="background-color: #FFD580; color: black">CommitNewFee</mark>

    ??? quote "Source code"

        ```vyper
        MAX_ADMIN_FEE: constant(uint256) = 10 * 10 ** 9
        MAX_FEE: constant(uint256) = 5 * 10 ** 9
        ADMIN_ACTIONS_DELAY: constant(uint256) = 3 * 86400

        @external
        def commit_new_fee(new_fee: uint256, new_admin_fee: uint256):
            assert msg.sender == self.owner  # dev: only owner
            assert self.admin_actions_deadline == 0  # dev: active action
            assert new_fee <= MAX_FEE  # dev: fee exceeds maximum
            assert new_admin_fee <= MAX_ADMIN_FEE  # dev: admin fee exceeds maximum

            _deadline: uint256 = block.timestamp + ADMIN_ACTIONS_DELAY
            self.admin_actions_deadline = _deadline
            self.future_fee = new_fee
            self.future_admin_fee = new_admin_fee

            log CommitNewFee(_deadline, new_fee, new_admin_fee)
        ```

    === "Example"

        ```shell
        >>> pool.commit_new_fee()
        todo: log output
        ```

    !!! note

        Both the pool ``fee`` and the ``admin_fee`` are capped by the constants ``MAX_FEE`` and ``MAX_ADMIN_FEE``,
        respectively. By default ``MAX_FEE`` is set at 50% and ``MAX_ADMIN_FEE`` at 100% (which is charged on the
        ``MAX_FEE`` amount).


### `StableSwap.apply_new_fee`

!!! description "StableSwap.apply_new_fee()"

    Apply the previously committed new pool and admin fees for the pool.

    Emits: <mark style="background-color: #FFD580; color: black">NewFee</mark>

    ??? quote "Source code"

        ```vyper
        @external
        def apply_new_fee():
            assert msg.sender == self.owner  # dev: only owner
            assert block.timestamp >= self.admin_actions_deadline  # dev: insufficient time
            assert self.admin_actions_deadline != 0  # dev: no active action

            self.admin_actions_deadline = 0
            _fee: uint256 = self.future_fee
            _admin_fee: uint256 = self.future_admin_fee
            self.fee = _fee
            self.admin_fee = _admin_fee

            log NewFee(_fee, _admin_fee)
        ```

    === "Example"

        ```shell
        >>> pool.commit_new_fee()
        todo: log output
        ```

    !!! note

        Unlike ownership transfers, pool and admin fees may be set more than once.

### `StableSwap.revert_new_parameters`

!!! description "`StableSwap.revert_new_parameters()`"

    Resets any previously committed new fees.

    ??? quote "Source code"

        ```vyper
        @external
        def revert_new_parameters():
            assert msg.sender == self.owner  # dev: only owner

            self.admin_actions_deadline = 0
        ```

    === "Example"

        ```shell
        >>> pool.revert_new_parameters()
        todo: log output
        ```

### `StableSwap.admin_balances`

!!! description "`StableSwap.admin_balances(i: uint256) → uint256`"

    Get the admin balance for a single coin in the pool.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `i`       |  `uint256` | Index of the coin to get admin balance for |

    ??? quote "Source code"

        ```vyper
        @view
        @external
        def admin_balances(i: uint256) -> uint256:
            return ERC20(self.coins[i]).balanceOf(self) - self.balances[i]
        ```

    === "Example"

        ```shell
        >>> pool.admin_balances()
        todo: log output
        ```

### `StableSwap.withdraw_admin_fees`

!!! description "`StableSwap.withdraw_admin_fees()`"

    Withdraws and transfers admin fees of the pool to the pool owner.

    ```vyper
    @external
    def withdraw_admin_fees():
        assert msg.sender == self.owner  # dev: only owner

        for i in range(N_COINS):
            c: address = self.coins[i]
            value: uint256 = ERC20(c).balanceOf(self) - self.balances[i]
            if value > 0:
                assert ERC20(c).transfer(msg.sender, value)
    ```

    === "Example"

        ```shell
        >>> pool.withdraw_admin_fees()
        todo: log output
        ```

### `StableSwap.donate_admin_fees`

!!! description "`StableSwap.donate_admin_fees()`"

    Donate all admin fees to the pool’s liquidity providers.

    ??? quote "Source code"

        ```vyper
        @external
        def donate_admin_fees():
            assert msg.sender == self.owner  # dev: only owner
            for i in range(N_COINS):
                self.balances[i] = ERC20(self.coins[i]).balanceOf(self)
        ```

    === "Example"

        ```shell
        >>> pool.donate_admin_fees()
        todo: log output
        ```

    !!! note

        Older Curve pools do not implement this method.

## Kill a Pool

### `StableSwap.kill_me`

!!! description "`StableSwap.kill_me()`"

    Pause a pool by setting the ``is_killed`` boolean flag to ``True``.

    This disables the following pool functionality:

        - add_liquidity
        - exchange
        - remove_liquidity_imbalance
        - remove_liquidity_one_coin

    It is only possible for existing LPs to remove liquidity via ``remove_liquidity`` from a paused pool.

    ??? quote "Source code"

        ```vyper hl_lines="10 26 39 53 61"
        @external
        @nonreentrant('lock')
        def add_liquidity(amounts: uint256[N_COINS], min_mint_amount: uint256) -> uint256:
            """
            @notice Deposit coins into the pool
            @param amounts List of amounts of coins to deposit
            @param min_mint_amount Minimum amount of LP tokens to mint from the deposit
            @return Amount of LP tokens received by depositing
            """
            assert not self.is_killed  # dev: is killed

        ...

        @external
        @nonreentrant('lock')
        def exchange(i: int128, j: int128, dx: uint256, min_dy: uint256) -> uint256:
            """
            @notice Perform an exchange between two coins
            @dev Index values can be found via the `coins` public getter method
            @param i Index value for the coin to send
            @param j Index valie of the coin to recieve
            @param dx Amount of `i` being exchanged
            @param min_dy Minimum amount of `j` to receive
            @return Actual amount of `j` received
            """
            assert not self.is_killed  # dev: is killed

        ...

        @external
        @nonreentrant('lock')
        def remove_liquidity_imbalance(amounts: uint256[N_COINS], max_burn_amount: uint256) -> uint256:
            """
            @notice Withdraw coins from the pool in an imbalanced amount
            @param amounts List of amounts of underlying coins to withdraw
            @param max_burn_amount Maximum amount of LP token to burn in the withdrawal
            @return Actual amount of the LP token burned in the withdrawal
            """
            assert not self.is_killed  # dev: is killed

        ...

        @external
        @nonreentrant('lock')
        def remove_liquidity_one_coin(_token_amount: uint256, i: int128, _min_amount: uint256) -> uint256:
            """
            @notice Withdraw a single coin from the pool
            @param _token_amount Amount of LP tokens to burn in the withdrawal
            @param i Index value of the coin to withdraw
            @param _min_amount Minimum amount of coin to receive
            @return Amount of coin received
            """
            assert not self.is_killed  # dev: is killed

        ...

        @external
        def kill_me():
            assert msg.sender == self.owner  # dev: only owner
            assert self.kill_deadline > block.timestamp  # dev: deadline has passed
            self.is_killed = True
        ```

    === "Example"

        ```shell
        todo: add example
        ```

    !!! note

        Pools can only be killed within the first 30 days after deployment.

### `StableSwap.unkill_me`

!!! description "StableSwap.unkill_me"

    Unpause a pool that was previously paused, re-enabling exchanges.

    ??? quote "Source code"

        ```vyper
        @external
        def unkill_me():
            assert msg.sender == self.owner  # dev: only owner
            self.is_killed = False
        ```

    === "Example"

        ```shell
        todo: add example
        ```
