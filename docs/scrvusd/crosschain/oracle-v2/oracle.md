<h1>scrvUSD Cross-chain Oracle</h1>

???+ vyper "`ScrvusdOracleV2.vy`"
    The source code for the `ScrvusdOracleV2` contract is available on [:material-github: GitHub](https://github.com/curvefi/storage-proofs/blob/main/contracts/scrvusd/oracles/ScrvusdOracleV2.vy). The contract is written in [Vyper](https://vyperlang.org/) version `0.4.0`.

    The oracle contracts are deployed on various chains at: *soon*


---


## **Price Methods**

The contract has three different functions for the scrvUSD share price (or its inverse when setting `_i = 1`) using different approximations:

- [`price_v0`](#price_v0) provides a lower-bound estimate of the scrvUSD share price (or its inverse when _i is 1) by combining a historically smoothed price with a raw price derived from previous vault parameters.
- [`price_v1`](#price_v1) returns an approximate share price (or its inverse when _i is 1) by calculating a raw price based on current timestamp data and stored parameters, assuming no external interactions have altered it.
- [`price_v2`](#price_v2) offers an alternative approximation (or its inverse when _i is 1) that factors in expected rewards accrual by using current block timestamps for both the price and parameter calculations.


### `update_price`
!!! description "`ScrvusdOracleV2.update_price(_parameters: uint256[ALL_PARAM_CNT], _ts: uint256, _block_number: uint256) -> uint256`"

    !!!guard "Guarded Method by [Snekmate 🐍](https://github.com/pcaversaccio/snekmate)"
        This contract makes use of a Snekmate module to manage roles and permissions. This specific function can only be called by the `PRICE_PARAMETERS_VERIFIER` role.

    Function to update the price using scrvUSD vault parameters.

    Returns: absolute relative price change of the final price with 10^18 precision.

    Emits: `PriceUpdate` event.

    | Input           | Type      | Description                  |
    | --------------- | --------- | ---------------------------- |
    | `_parameters`   | `uint256[ALL_PARAM_CNT]` | Parameters of the Yearn Vault |
    | `_ts`           | `uint256` | Timestamp at which the parameters are true |
    | `_block_number` | `uint256` | Block number of parameters to linearize updates |

    ??? quote "Source code"

        === "ScrvusdOracleV2.vy"

            ```python
            event PriceUpdate:
                new_price: uint256  # price to achieve
                price_params_ts: uint256  # timestamp at which price is recorded
                block_number: uint256

            # scrvUSD Vault rate replication
            ALL_PARAM_CNT: constant(uint256) = 2 + 5
            MAX_BPS_EXTENDED: constant(uint256) = 1_000_000_000_000

            last_block_number: public(uint256)  # Warning: used both for price parameters and unlock_time
            # smoothening
            last_prices: uint256[3]
            last_update: uint256
            # scrvUSD replication parameters
            profit_max_unlock_time: public(uint256)
            price_params: PriceParams
            price_params_ts: uint256

            @external
            def update_price(
                _parameters: uint256[ALL_PARAM_CNT], _ts: uint256, _block_number: uint256
            ) -> uint256:
                """
                @notice Update price using `_parameters`
                @param _parameters Parameters of Yearn Vault to calculate scrvUSD price
                @param _ts Timestamp at which these parameters are true
                @param _block_number Block number of parameters to linearize updates
                @return Absolute relative price change of final price with 10^18 precision
                """
                access_control._check_role(PRICE_PARAMETERS_VERIFIER, msg.sender)
                # Allowing same block updates for fixing bad blockhash provided (if possible)
                assert self.last_block_number <= _block_number, "Outdated"
                self.last_block_number = _block_number

                self.last_prices = [self._price_v0(), self._price_v1(), self._price_v2()]
                self.last_update = block.timestamp

                ts: uint256 = self.price_params_ts
                current_price: uint256 = self._raw_price(ts, ts)
                self.price_params = PriceParams(
                    total_debt=_parameters[0],
                    total_idle=_parameters[1],
                    total_supply=_parameters[2],
                    full_profit_unlock_date=_parameters[3],
                    profit_unlocking_rate=_parameters[4],
                    last_profit_update=_parameters[5],
                    balance_of_self=_parameters[6],
                )
                self.price_params_ts = _ts

                new_price: uint256 = self._raw_price(_ts, _ts)
                log PriceUpdate(new_price, _ts, _block_number)
                if new_price > current_price:
                    return (new_price - current_price) * 10**18 // current_price
                return (current_price - new_price) * 10**18 // current_price

            @view
            def _price_v0() -> uint256:
                return self._smoothed_price(
                    self.last_prices[0],
                    self._raw_price(self.price_params_ts, self.price_params.last_profit_update),
                )

            @view
            def _price_v1() -> uint256:
                return self._smoothed_price(
                    self.last_prices[1], self._raw_price(block.timestamp, self.price_params_ts)
                )

            @view
            def _price_v2() -> uint256:
                return self._smoothed_price(
                    self.last_prices[2], self._raw_price(block.timestamp, block.timestamp)
                )

            @view
            def _smoothed_price(last_price: uint256, raw_price: uint256) -> uint256:
                # Ideally should be (max_price_increment / 10**18) ** (block.timestamp - self.last_update)
                # Using linear approximation to simplify calculations
                max_change: uint256 = (
                    self.max_price_increment * (block.timestamp - self.last_update) * last_price // 10**18
                )
                # -max_change <= (raw_price - last_price) <= max_change
                if unsafe_sub(raw_price + max_change, last_price) > 2 * max_change:
                    return last_price + max_change if raw_price > last_price else last_price - max_change
                return raw_price

            @view
            def _raw_price(ts: uint256, parameters_ts: uint256) -> uint256:
                """
                @notice Price replication from scrvUSD vault
                """
                parameters: PriceParams = self._obtain_price_params(parameters_ts)
                return self._total_assets(parameters) * 10**18 // self._total_supply(parameters, ts)
            ```

    === "Example"

        This example updates the price of scrvUSD.

        ```py
        >>> ScrvusdOracleV2.update_price()
        ```


### `raw_price`
!!! description "`ScrvusdOracleV2.raw_price(_i: uint256 = 0, _ts: uint256 = block.timestamp, _parameters_ts: uint256 = block.timestamp) -> uint256`"

    Function to compute the raw approximated share or asset price without smoothening out.

    Returns: raw `pricePerShare()` or `pricePerAsset()`.

    | Input         | Type      | Description                  |
    | ------------- | --------- | ---------------------------- |
    | `_i` | `uint256` | 0 for `pricePerShare()` and 1 for `pricePerAsset()`; defaults to 0  |
    | `_ts` | `uint256` | Timestamp at which to see the price (only near period is supported) |
    | `_parameters_ts` | `uint256` | Timestamp for the price parameters |

    ??? quote "Source code"

        === "ScrvusdOracleV2.vy"

            ```python
            @view
            @external
            def raw_price(
                _i: uint256 = 0, _ts: uint256 = block.timestamp, _parameters_ts: uint256 = block.timestamp
            ) -> uint256:
                """
                @notice Get approximate `scrvUSD.pricePerShare()` without smoothening
                @param _i 0 (default) for `pricePerShare()` and 1 for `pricePerAsset()`
                @param _ts Timestamp at which to see price (only near period is supported)
                """
                p: uint256 = self._raw_price(_ts, _parameters_ts)
                return p if _i == 0 else 10**36 // p

            @view
            def _raw_price(ts: uint256, parameters_ts: uint256) -> uint256:
                """
                @notice Price replication from scrvUSD vault
                """
                parameters: PriceParams = self._obtain_price_params(parameters_ts)
                return self._total_assets(parameters) * 10**18 // self._total_supply(parameters, ts)

            @view
            def _obtain_price_params(parameters_ts: uint256) -> PriceParams:
                """
                @notice Obtain Price parameters true or assumed to be true at `parameters_ts`.
                    Assumes constant gain(in crvUSD rewards) through distribution periods.
                @param parameters_ts Timestamp to obtain parameters for
                @return Assumed `PriceParams`
                """
                params: PriceParams = self.price_params
                period: uint256 = self.profit_max_unlock_time
                if params.last_profit_update + period >= parameters_ts:
                    return params

                number_of_periods: uint256 = min(
                    (parameters_ts - params.last_profit_update) // period,
                    self.max_v2_duration,
                )

                # locked shares at moment params.last_profit_update
                gain: uint256 = (
                    params.balance_of_self * (params.total_idle + params.total_debt) // params.total_supply
                )
                params.total_idle += gain * number_of_periods

                # functions are reduced from `VaultV3._process_report()` given assumptions with constant gain
                for _: uint256 in range(number_of_periods, bound=MAX_V2_DURATION):
                    new_balance_of_self: uint256 = (
                        params.balance_of_self
                        * (params.total_supply - params.balance_of_self) // params.total_supply
                    )
                    params.total_supply -= (
                        params.balance_of_self * params.balance_of_self // params.total_supply
                    )
                    params.balance_of_self = new_balance_of_self

                if params.full_profit_unlock_date > params.last_profit_update:
                    # copy from `VaultV3._process_report()`
                    params.profit_unlocking_rate = params.balance_of_self * MAX_BPS_EXTENDED // (
                        params.full_profit_unlock_date - params.last_profit_update
                    )
                else:
                    params.profit_unlocking_rate = 0

                params.full_profit_unlock_date += number_of_periods * period
                params.last_profit_update += number_of_periods * period

                return params

            @view
            def _total_assets(p: PriceParams) -> uint256:
                """
                @notice Total amount of assets that are in the vault and in the strategies.
                """
                return p.total_idle + p.total_debt

            @view
            def _total_supply(p: PriceParams, ts: uint256) -> uint256:
                # Need to account for the shares issued to the vault that have unlocked.
                return p.total_supply - self._unlocked_shares(
                    p.full_profit_unlock_date,
                    p.profit_unlocking_rate,
                    p.last_profit_update,
                    p.balance_of_self,
                    ts,  # block.timestamp
                )
            ```

    === "Example"

        This example returns the raw share or asset price of scrvUSD.

        ```py
        ScrvusdOracleV2.raw_price(0)
        # returns pricePerShare()

        ScrvusdOracleV2.raw_price(1)
        # returns pricePerAsset()
        ```


### `price_v0`
!!! description "`ScrvusdOracleV2.price_v0(_i: uint256 = 0) -> uint256`"

    Getter for the lower bound of the share or asset price.

    Returns: lower bound of `pricePerShare()`.

    | Input         | Type      | Description                  |
    | ------------- | --------- | ---------------------------- |
    | `_i` | `uint256` | 0 for `pricePerShare()` and 1 for `pricePerAsset()` |

    ??? quote "Source code"

        === "ScrvusdOracleV2.vy"

            ```python
            struct PriceParams:
                # assets
                total_debt: uint256
                total_idle: uint256
                # supply
                total_supply: uint256
                full_profit_unlock_date: uint256
                profit_unlocking_rate: uint256
                last_profit_update: uint256
                balance_of_self: uint256

            last_block_number: public(uint256)  # Warning: used both for price parameters and unlock_time
            # smoothening
            last_prices: uint256[3]
            last_update: uint256
            # scrvUSD replication parameters
            profit_max_unlock_time: public(uint256)
            price_params: PriceParams
            price_params_ts: uint256

            max_price_increment: public(uint256)  # precision 10**18
            max_v2_duration: public(uint256)  # number of periods(weeks)

            @view
            @external
            def price_v0(_i: uint256 = 0) -> uint256:
                """
                @notice Get lower bound of `scrvUSD.pricePerShare()`
                @dev Price is updated in steps, need to verify every % changed
                @param _i 0 (default) for `pricePerShare()` and 1 for `pricePerAsset()`
                """
                return self._price_v0() if _i == 0 else 10**36 // self._price_v0()

            @view
            def _price_v0() -> uint256:
                return self._smoothed_price(
                    self.last_prices[0],
                    self._raw_price(self.price_params_ts, self.price_params.last_profit_update),
                )

            @view
            def _smoothed_price(last_price: uint256, raw_price: uint256) -> uint256:
                # Ideally should be (max_price_increment / 10**18) ** (block.timestamp - self.last_update)
                # Using linear approximation to simplify calculations
                max_change: uint256 = (
                    self.max_price_increment * (block.timestamp - self.last_update) * last_price // 10**18
                )
                # -max_change <= (raw_price - last_price) <= max_change
                if unsafe_sub(raw_price + max_change, last_price) > 2 * max_change:
                    return last_price + max_change if raw_price > last_price else last_price - max_change
                return raw_price

            @view
            @external
            def raw_price(
                _i: uint256 = 0, _ts: uint256 = block.timestamp, _parameters_ts: uint256 = block.timestamp
            ) -> uint256:
                """
                @notice Get approximate `scrvUSD.pricePerShare()` without smoothening
                @param _i 0 (default) for `pricePerShare()` and 1 for `pricePerAsset()`
                @param _ts Timestamp at which to see price (only near period is supported)
                """
                p: uint256 = self._raw_price(_ts, _parameters_ts)
                return p if _i == 0 else 10**36 // p
            ```

    === "Example"

        This example returns the lower bound of `pricePerShare()` or `pricePerAsset()`.

        ```py
        ScrvusdOracleV2.price_v0(0)
        # returns pricePerShare()

        ScrvusdOracleV2.price_v0(1)
        # returns pricePerAsset()
        ```


### `price_v1`
!!! description "`ScrvusdOracleV2.price_v1(_i: uint256 = 0) -> uint256`"

    Getter for the approximate share or asset price assuming no new interactions.

    Returns: approximate `pricePerShare()`.

    | Input         | Type      | Description                  |
    | ------------- | --------- | ---------------------------- |
    | `_i` | `uint256` | 0 for `pricePerShare()` and 1 for `pricePerAsset()` |

    ??? quote "Source code"

        === "ScrvusdOracleV2.vy"

            ```python
            struct PriceParams:
                # assets
                total_debt: uint256
                total_idle: uint256
                # supply
                total_supply: uint256
                full_profit_unlock_date: uint256
                profit_unlocking_rate: uint256
                last_profit_update: uint256
                balance_of_self: uint256

            last_block_number: public(uint256)  # Warning: used both for price parameters and unlock_time
            # smoothening
            last_prices: uint256[3]
            last_update: uint256
            # scrvUSD replication parameters
            profit_max_unlock_time: public(uint256)
            price_params: PriceParams
            price_params_ts: uint256

            max_price_increment: public(uint256)  # precision 10**18
            max_v2_duration: public(uint256)  # number of periods(weeks)

            @view
            @external
            def price_v1(_i: uint256 = 0) -> uint256:
                """
                @notice Get approximate `scrvUSD.pricePerShare()`
                @dev Price is simulated as if no one interacted to change `scrvUSD.pricePerShare()`,
                    need to adjust rate when too off.
                @param _i 0 (default) for `pricePerShare()` and 1 for `pricePerAsset()`
                """
                return self._price_v1() if _i == 0 else 10**36 // self._price_v1()

            @view
            def _price_v1() -> uint256:
                return self._smoothed_price(
                    self.last_prices[1], self._raw_price(block.timestamp, self.price_params_ts)
                )

            @view
            def _smoothed_price(last_price: uint256, raw_price: uint256) -> uint256:
                # Ideally should be (max_price_increment / 10**18) ** (block.timestamp - self.last_update)
                # Using linear approximation to simplify calculations
                max_change: uint256 = (
                    self.max_price_increment * (block.timestamp - self.last_update) * last_price // 10**18
                )
                # -max_change <= (raw_price - last_price) <= max_change
                if unsafe_sub(raw_price + max_change, last_price) > 2 * max_change:
                    return last_price + max_change if raw_price > last_price else last_price - max_change
                return raw_price

            @view
            @external
            def raw_price(
                _i: uint256 = 0, _ts: uint256 = block.timestamp, _parameters_ts: uint256 = block.timestamp
            ) -> uint256:
                """
                @notice Get approximate `scrvUSD.pricePerShare()` without smoothening
                @param _i 0 (default) for `pricePerShare()` and 1 for `pricePerAsset()`
                @param _ts Timestamp at which to see price (only near period is supported)
                """
                p: uint256 = self._raw_price(_ts, _parameters_ts)
                return p if _i == 0 else 10**36 // p
            ```

    === "Example"

        This example returns the approximate `pricePerShare()` or `pricePerAsset()`.

        ```py
        ScrvusdOracleV2.price_v1(0)
        # returns pricePerShare()

        ScrvusdOracleV2.price_v1(1)
        # returns pricePerAsset()
        ```


### `price_v2`
!!! description "`ScrvusdOracleV2.price_v2(_i: uint256 = 0) -> uint256`"

    Getter for the approximate share or asset price assuming constant rewards over time.

    Returns: approximate `pricePerShare()`.

    | Input         | Type      | Description                  |
    | ------------- | --------- | ---------------------------- |
    | `_i` | `uint256` | 0 for `pricePerShare()` and 1 for `pricePerAsset()` |

    ??? quote "Source code"

        === "ScrvusdOracleV2.vy"

            ```python
            struct PriceParams:
                # assets
                total_debt: uint256
                total_idle: uint256
                # supply
                total_supply: uint256
                full_profit_unlock_date: uint256
                profit_unlocking_rate: uint256
                last_profit_update: uint256
                balance_of_self: uint256

            last_block_number: public(uint256)  # Warning: used both for price parameters and unlock_time
            # smoothening
            last_prices: uint256[3]
            last_update: uint256
            # scrvUSD replication parameters
            profit_max_unlock_time: public(uint256)
            price_params: PriceParams
            price_params_ts: uint256

            max_price_increment: public(uint256)  # precision 10**18
            max_v2_duration: public(uint256)  # number of periods(weeks)

            @view
            @external
            def price_v2(_i: uint256 = 0) -> uint256:
                """
                @notice Get approximate `scrvUSD.pricePerShare()`
                @dev Uses assumption that crvUSD gains same rewards.
                @param _i 0 (default) for `pricePerShare()` and 1 for `pricePerAsset()`
                """
                return self._price_v2() if _i == 0 else 10**36 // self._price_v2()

            @view
            def _price_v2() -> uint256:
                return self._smoothed_price(
                    self.last_prices[2], self._raw_price(block.timestamp, block.timestamp)
                )

            @view
            def _smoothed_price(last_price: uint256, raw_price: uint256) -> uint256:
                # Ideally should be (max_price_increment / 10**18) ** (block.timestamp - self.last_update)
                # Using linear approximation to simplify calculations
                max_change: uint256 = (
                    self.max_price_increment * (block.timestamp - self.last_update) * last_price // 10**18
                )
                # -max_change <= (raw_price - last_price) <= max_change
                if unsafe_sub(raw_price + max_change, last_price) > 2 * max_change:
                    return last_price + max_change if raw_price > last_price else last_price - max_change
                return raw_price

            @view
            @external
            def raw_price(
                _i: uint256 = 0, _ts: uint256 = block.timestamp, _parameters_ts: uint256 = block.timestamp
            ) -> uint256:
                """
                @notice Get approximate `scrvUSD.pricePerShare()` without smoothening
                @param _i 0 (default) for `pricePerShare()` and 1 for `pricePerAsset()`
                @param _ts Timestamp at which to see price (only near period is supported)
                """
                p: uint256 = self._raw_price(_ts, _parameters_ts)
                return p if _i == 0 else 10**36 // p
            ```

    === "Example"

        This example returns the approximate `pricePerShare()` or `pricePerAsset()` using the assumption that crvUSD gains same rewards.

        ```py
        ScrvusdOracleV2.price_v2(0)
        # returns pricePerShare()

        ScrvusdOracleV2.price_v2(1)
        # returns pricePerAsset()
        ```


### `last_block_number`
!!! description "`ScrvusdOracleV2.last_block_number() -> uint256`"

    Getter for the block number corresponding to the most recent update applied to the oracle (either for the price or `profit_max_unlock_time`). This value is updated during calls to the `update_price()` function to ensure that only updates from the same or a later block are accepted to prevent outdated information from being used.

    Returns: the last block number the oracle was updated?.

    ??? quote "Source code"

        === "ScrvusdOracleV2.vy"

            ```python
            last_block_number: public(uint256)  # Warning: used both for price parameters and unlock_time
            ```

    === "Example"

        This example returns the block number of the most recent update.

        ```py
        >>> ScrvusdOracleV2.last_block_number()
        17153668
        ```


---


## **Adjustable Parameters**

The oracle has the following adjustable parameters:

- [`profit_max_unlock_time`](#profit_max_unlock_time): period over which accrued profits are gradually unlocked to smooth the share price transition.
- [`max_price_increment`](#max_price_increment): caps the maximum rate at which the share price can change per second to prevent abrupt price fluctuations.
- [`max_v2_duration`](#max_v2_duration): limits the number of periods used in the v2 price approximation, restricting how far future reward accrual is projected.

To guard the respective functions which can change the parameters, the contract uses a Snekmate module with different roles.

### `profit_max_unlock_time`
!!! description "`ScrvusdOracleV2.profit_max_unlock_time() -> uint256: view`"

    Getter for the duration in seconds over which rewards are gradually unlocked, thereby smoothing out share price adjustments. It is initially set to one week (7 * 86400 seconds) to align with the current Yearn Vault setting and can only be updated by the `VERIFIER` role using the [`update_profit_max_unlock_time`](#update_profit_max_unlock_time) function.

    Returns: `profit_max_unlock_time`.

    ??? quote "Source code"

        === "ScrvusdOracleV2.vy"

            ```python
            profit_max_unlock_time: public(uint256)

            @deploy
            def __init__(_initial_price: uint256):
                """
                @param _initial_price Initial price of asset per share (10**18)
                """
                ...
                self.profit_max_unlock_time = 7 * 86400  # Week by default
                ...
            ```

    === "Example"

        This example returns the current `profit_max_unlock_time`.

        ```py
        >>> ScrvusdOracleV2.profit_max_unlock_time()
        604800
        ```


### `update_profit_max_unlock_time`
!!! description "`ScrvusdOracleV2.update_profit_max_unlock_time(_profit_max_unlock_time: uint256, _block_number: uint256) -> bool`"

    !!!guard "Guarded Method by [Snekmate 🐍](https://github.com/pcaversaccio/snekmate)"
        This contract makes use of a Snekmate module to manage roles and permissions. This specific function can only be called by the `UNLOCK_TIME_VERIFIER` role.

    Function to set a new value for `profit_max_unlock_time`. This happens within the [`ScrvUSDVerifierV2`](../crosschain/verifier.md#scrvusd-verifier-v2) contract when a period is verified using a block hash ([`verifyPeriodByBlockHash()`](../crosschain/verifier.md#verifyperiodbyblockhash)).

    Returns: boolean wether the value changed.

    | Input         | Type      | Description                  |
    | ------------- | --------- | ---------------------------- |
    | `_profit_max_unlock_time` | `uin256` | New `profit_max_unlock_time` value |
    | `_block_number` | `uin256` | Block number of parameters to linearize updates |

    ??? quote "Source code"

        === "ScrvusdOracleV2.vy"

            ```python
            from snekmate.auth import access_control

            initializes: access_control
            exports: (
                access_control.supportsInterface,
                access_control.hasRole,
                access_control.DEFAULT_ADMIN_ROLE,
                access_control.grantRole,
                access_control.revokeRole,
            )

            UNLOCK_TIME_VERIFIER: public(constant(bytes32)) = keccak256("UNLOCK_TIME_VERIFIER")

            last_block_number: public(uint256)  # Warning: used both for price parameters and unlock_time
            profit_max_unlock_time: public(uint256)

            @external
            def update_profit_max_unlock_time(_profit_max_unlock_time: uint256, _block_number: uint256) -> bool:
                """
                @notice Update price using `_parameters`
                @param _profit_max_unlock_time New `profit_max_unlock_time` value
                @param _block_number Block number of parameters to linearize updates
                @return Boolean whether value changed
                """
                access_control._check_role(UNLOCK_TIME_VERIFIER, msg.sender)
                # Allowing same block updates for fixing bad blockhash provided (if possible)
                assert self.last_block_number <= _block_number, "Outdated"
                self.last_block_number = _block_number

                prev_value: uint256 = self.profit_max_unlock_time
                self.profit_max_unlock_time = _profit_max_unlock_time
                return prev_value != _profit_max_unlock_time
            ```

    === "Example"

        This example updates the `profit_max_unlock_time` value.

        ```py
        >>> ScrvusdOracleV2.profit_max_unlock_time()
        604800

        >>> ScrvusdOracleV2.update_profit_max_unlock_time(302400, todo)

        >>> ScrvusdOracleV2.profit_max_unlock_time()
        302400
        ```


### `max_price_increment`
!!! description "`ScrvusdOracleV2.max_price_increment() -> uint256: view`"

    Getter for the maximum allowed price increment per second for scrvusd, measured with a precision of $10^{18}$. It is initially set to `2 * 1012` — corresponding to 0.02 bps per second (or approximately 0.24 bps per block on Ethereum) and linearly approximated to a maximum of 63% APY — and can be updated via the [`set_max_price_increment`](#set_max_price_increment) function.

    Returns: `max_price_increment`.

    ??? quote "Source code"

        === "ScrvusdOracleV2.vy"

            ```python
            max_price_increment: public(uint256)  # precision 10**18

            @deploy
            def __init__(_initial_price: uint256):
                """
                @param _initial_price Initial price of asset per share (10**18)
                """
                ...
                # 2 * 10 ** 12 is equivalent to
                #   1) 0.02 bps per second or 0.24 bps per block on Ethereum
                #   2) linearly approximated to max 63% APY
                self.max_price_increment = 2 * 10**12
                ....
            ```

    === "Example"

        This example returns the maximum price increment per second of scrvusd.

        ```py
        >>> ScrvusdOracleV2.max_price_increment()
        2000000000000
        ```


### `set_max_price_increment`
!!! description "`ScrvusdOracleV2.set_max_price_increment(_max_price_increment: uint256)`"

    !!!guard "Guarded Method by [Snekmate 🐍](https://github.com/pcaversaccio/snekmate)"
        This contract makes use of a Snekmate module to manage roles and permissions. This specific function can only be called by the `DEFAULT_ADMIN_ROLE` role.

    Function to set a new value for `max_price_increment`. The new value must be less than the Stableswap's minimum fee.
    $\frac{fee}{2 * \text{block_time}}$ is considered to be safe.

    Emits: `SetMaxPriceIncrement` event.

    | Input         | Type      | Description                  |
    | ------------- | --------- | ---------------------------- |
    | `_max_price_increment` | `uint256` | New `max_price_increment` value |

    ??? quote "Source code"

        === "ScrvusdOracleV2.vy"

            ```python
            from snekmate.auth import access_control

            initializes: access_control
            exports: (
                access_control.supportsInterface,
                access_control.hasRole,
                access_control.DEFAULT_ADMIN_ROLE,
                access_control.grantRole,
                access_control.revokeRole,
            )

            event SetMaxPriceIncrement:
                max_acceleration: uint256

            max_price_increment: public(uint256)  # precision 10**18

            @external
            def set_max_price_increment(_max_price_increment: uint256):
                """
                @notice Set maximum price increment of scrvUSD.
                    Must be less than StableSwap's minimum fee.
                    fee / (2 * block_time) is considered to be safe.
                @param _max_price_increment Maximum acceleration (per sec)
                """
                access_control._check_role(access_control.DEFAULT_ADMIN_ROLE, msg.sender)

                assert 10**8 <= _max_price_increment and _max_price_increment <= 10**18
                self.max_price_increment = _max_price_increment

                log SetMaxPriceIncrement(_max_price_increment)
            ```

    === "Example"

        This example updates the `max_price_increment` value.

        ```py
        >>> ScrvusdOracleV2.max_price_increment()
        2000000000000

        >>> ScrvusdOracleV2.set_max_price_increment(3000000000000)

        >>> ScrvusdOracleV2.max_price_increment()
        3000000000000
        ```


### `max_v2_duration`
!!! description "`ScrvusdOracleV2.max_v2_duration() -> uint256: view`"

    Getter for the maximum duration for which the price_v2 approximation can be applied before capping further growth. It is initially set to 24 weeks and can be updated via the [`set_max_v2_duration`](#set_max_v2_duration) function.

    Returns: `max_v2_duration`.

    ??? quote "Source code"

        === "ScrvusdOracleV2.vy"

            ```python
            max_v2_duration: public(uint256)  # number of periods(weeks)

            @deploy
            def __init__(_initial_price: uint256):
                """
                @param _initial_price Initial price of asset per share (10**18)
                """
                ...
                self.max_v2_duration = 4 * 6  # half a year
                ...
            ```

    === "Example"

        This example returns the `max_v2_duration` value.

        ```py
        >>> ScrvusdOracleV2.max_v2_duration()
        24
        ```


### `set_max_v2_duration`
!!! description "`ScrvusdOracleV2.set_max_v2_duration(_max_v2_duration: uint256)`"

    !!!guard "Guarded Method by [Snekmate 🐍](https://github.com/pcaversaccio/snekmate)"
        This contract makes use of a Snekmate module to manage roles and permissions. This specific function can only be called by the `DEFAULT_ADMIN_ROLE` role.

    Function to set a new value for `max_v2_duration`. The new value must be less than `MAX_V2_DURATION` (4 years).

    Emits: `SetMaxV2Duration` event.

    | Input         | Type      | Description                  |
    | ------------- | --------- | ---------------------------- |
    | `_max_v2_duration` | `uint256` | Maximum v2 approximation duration (in weeks) |

    ??? quote "Source code"

        === "ScrvusdOracleV2.vy"

            ```python
            from snekmate.auth import access_control

            initializes: access_control
            exports: (
                access_control.supportsInterface,
                access_control.hasRole,
                access_control.DEFAULT_ADMIN_ROLE,
                access_control.grantRole,
                access_control.revokeRole,
            )

            event SetMaxV2Duration:
                max_v2_duration: uint256

            MAX_V2_DURATION: constant(uint256) = 4 * 12 * 4  # 4 years

            max_v2_duration: public(uint256)  # number of periods(weeks)

            @external
            def set_max_v2_duration(_max_v2_duration: uint256):
                """
                @notice Set maximum v2 approximation duration after which growth will be stopped.
                @param _max_v2_duration Maximum v2 approximation duration (in number of periods)
                """
                access_control._check_role(access_control.DEFAULT_ADMIN_ROLE, msg.sender)

                assert _max_v2_duration <= MAX_V2_DURATION
                self.max_v2_duration = _max_v2_duration

                log SetMaxV2Duration(_max_v2_duration)
            ```

    === "Example"

        This example updates the `max_v2_duration` value.

        ```py
        >>> ScrvusdOracleV2.max_v2_duration()
        24

        >>> ScrvusdOracleV2.set_max_v2_duration(26)

        >>> ScrvusdOracleV2.max_v2_duration()
        26
        ```

---


## **Snekmate Access Control**

The contract makes use of the `access_control.vy` module for access control. More [here](https://github.com/pcaversaccio/snekmate/blob/main/src/snekmate/auth/access_control.vy).
