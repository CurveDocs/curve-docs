<h1>Crosschain scrvUSD</h1>

<script src="/assets/javascripts/contracts/scrvusd/scrvusd-crosschain-oracle.js"></script>
<script src="https://cdn.jsdelivr.net/npm/web3@1.5.2/dist/web3.min.js"></script>

crvUSD is a ERC-4626 contract. When bridging it to other chains, it is treated as a normal ERC-20 token and will not automatically increase its `pricePerShare` or other values. 

Due to this, Curve uses a system of a `Prover` and `BlockHashOracle` contracts which are responsible for updating the `pricePerShare` of the scrvUSD token on other chains.


???+vyper "scrvUSD Crosschain System"

    The source code for the contracts is available on [:material-github: GitHub](https://github.dev/curvefi/curve-xdao/blob/feat/scrvusd-oracle/). The contracts are written in [Vyper](https://vyperlang.org/) version `~=0.4`.

    === ":logos-optimism: Optimism"

        |Contract | Address |
        | ------------- | ---------------- |
        | `ScrvusdOracle` | [`0xC772063cE3e622B458B706Dd2e36309418A1aE42`](https://optimistic.etherscan.io/address/0xC772063cE3e622B458B706Dd2e36309418A1aE42) |
        | `Prover` | [`0x47ca04Ee05f167583122833abfb0f14aC5677Ee4`](https://optimistic.etherscan.io/address/0x47ca04Ee05f167583122833abfb0f14aC5677Ee4) |
        | `BlockHashOracle` | [`0x988d1037e9608B21050A8EFba0c6C45e01A3Bce7`](https://optimistic.etherscan.io/address/0x988d1037e9608B21050A8EFba0c6C45e01A3Bce7) |


    === ":logos-fraxtal: Fraxtal"

        | Contract | Address |
        | ------------- | ---------------- |
        | `ScrvusdOracle` | [`0x09F8D940EAD55853c51045bcbfE67341B686C071`](https://fraxscan.com/address/0x09F8D940EAD55853c51045bcbfE67341B686C071) |
        | `Prover` | [`0x0094Ad026643994c8fB2136ec912D508B15fe0E5`](https://fraxscan.com/address/0x0094Ad026643994c8fB2136ec912D508B15fe0E5) |
        | `BlockHashOracle` | [`0xbD2775B8eADaE81501898eB208715f0040E51882`](https://fraxscan.com/address/0xbD2775B8eADaE81501898eB208715f0040E51882) |



    === ":logos-base: Base"

        | Contract | Address |
        | ------------- | ---------------- |
        | `ScrvusdOracle` | [`0x3d8EADb739D1Ef95dd53D718e4810721837c69c1`](https://basescan.org/address/0x3d8EADb739D1Ef95dd53D718e4810721837c69c1) |
        | `Prover` | [`0x6a2691068C7CbdA03292Ba0f9c77A25F658bAeF5`](https://basescan.org/address/0x6a2691068C7CbdA03292Ba0f9c77A25F658bAeF5) |
        | `BlockHashOracle` | [`0x3c0a405E914337139992625D5100Ea141a9C4d11`](https://basescan.org/address/0x3c0a405E914337139992625D5100Ea141a9C4d11) |


    === ":logos-mantle: Mantle"

        | Contract | Address |
        | ------------- | ---------------- |
        | `ScrvusdOracle` | [`0xbD2775B8eADaE81501898eB208715f0040E51882`](https://mantlescan.xyz/address/0xbD2775B8eADaE81501898eB208715f0040E51882) |
        | `Prover` | [`0x09F8D940EAD55853c51045bcbfE67341B686C071`](https://mantlescan.xyz/address/0x09F8D940EAD55853c51045bcbfE67341B686C071) |
        | `BlockHashOracle` | [`0x004A476B5B76738E34c86C7144554B9d34402F13`](https://mantlescan.xyz/address/0x004A476B5B76738E34c86C7144554B9d34402F13) |


---


## **Price Methods**

### `update_price`
!!! description "`ScrvusdOracle.update_price(_parameters: uint256[ASSETS_PARAM_CNT + SUPPLY_PARAM_CNT]) -> uint256`"

    Function to update the price of the scrvUSD token.

    Returns: relative price change of final price with 10^18 precision (`uint256`).

    Emits: `PriceUpdate` event.

    | Input         | Type      | Description                  |
    | ------------- | --------- | ---------------------------- |
    | `_parameters` | `uint256[ASSETS_PARAM_CNT + SUPPLY_PARAM_CNT]` | Parameters of the scrvUSD token |

    ??? quote "Source code"

        === "ScrvusdOracle.vy"

            ```python
            event PriceUpdate:
                new_price: uint256  # price to achieve
                at: uint256  # timestamp at which price will be achieved

            struct Interval:
                previous: uint256
                future: uint256

            # scrvUSD Vault rate replication
            # 0 total_debt
            # 1 total_idle
            ASSETS_PARAM_CNT: constant(uint256) = 2
            # 0 totalSupply
            # 1 full_profit_unlock_date
            # 2 profit_unlocking_rate
            # 3 last_profit_update
            # 4 balance_of_self
            # 5 block.timestamp
            SUPPLY_PARAM_CNT: constant(uint256) = 6
            MAX_BPS_EXTENDED: constant(uint256) = 1_000_000_000_000

            @external
            def update_price(
                _parameters: uint256[ASSETS_PARAM_CNT + SUPPLY_PARAM_CNT],
            ) -> uint256:
                """
                @notice Update price using `_parameters`
                @param _parameters Parameters of
                @return Relative price change of final price with 10^18 precision
                """
                assert msg.sender == self.prover

                current_price: uint256 = self._price_per_share(block.timestamp)
                new_price: uint256 = self._total_assets(_parameters) * 10 ** 18 //\
                    self._total_supply(_parameters)

                # Price is always growing and updates are never from future,
                # hence allow only increasing updates
                future_price: uint256 = self.price.future
                if new_price > future_price:
                    self.price = Interval(previous=current_price, future=new_price)

                    rel_price_change: uint256 = (new_price - current_price) * 10 ** 18 // current_price + 1  # 1 for rounding up
                    future_ts: uint256 = block.timestamp + rel_price_change // self.max_acceleration
                    self.time = Interval(previous=block.timestamp, future=future_ts)

                    log PriceUpdate(new_price, future_ts)
                    return new_price * 10 ** 18 // future_price
                return 10 ** 18

            @view
            @internal
            def _price_per_share(ts: uint256) -> uint256:
                """
                @notice Using linear interpolation assuming updates are often enough
                    for absolute difference \approx relative difference
                """
                price: Interval = self.price
                time: Interval = self.time
                if ts >= time.future:
                    return price.future
                if ts <= time.previous:
                    return price.previous
                return (price.previous * (time.future - ts) + price.future * (ts - time.previous)) // (time.future - time.previous)

            @view
            @internal
            def _total_assets(parameters: uint256[ASSETS_PARAM_CNT + SUPPLY_PARAM_CNT]) -> uint256:
                """
                @notice Total amount of assets that are in the vault and in the strategies.
                """
                return parameters[0] + parameters[1]

            @view
            @internal
            def _total_supply(parameters: uint256[ASSETS_PARAM_CNT + SUPPLY_PARAM_CNT]) -> uint256:
                # Need to account for the shares issued to the vault that have unlocked.
                return parameters[ASSETS_PARAM_CNT + 0] -\
                    self._unlocked_shares(
                        parameters[ASSETS_PARAM_CNT + 1],  # full_profit_unlock_date
                        parameters[ASSETS_PARAM_CNT + 2],  # profit_unlocking_rate
                        parameters[ASSETS_PARAM_CNT + 3],  # last_profit_update
                        parameters[ASSETS_PARAM_CNT + 4],  # balance_of_self
                        parameters[ASSETS_PARAM_CNT + 5],  # block.timestamp
                    )
            ```

    === "Example"

        This example updates the price of the scrvUSD token.

        ```py
        >>> ScrvusdOracle.price()
        1008353536323212312

        >>> ScrvusdOracle.update_price()

        >>> ScrvusdOracle.price()
        1009393556372147140
        ```


### `price`
!!! description "`ScrvusdOracle.price() -> Interval: view`"

    Getter for the previous and future price of crvUSD.

    Returns: `Interval` struct containing `previous` and `future` prices.

    ??? quote "Source code"

        === "ScrvusdOracle.vy"

            ```python
            struct Interval:
                previous: uint256
                future: uint256

            price: public(Interval)  # price of asset per share
            ```

    === "Example"

        :material-information-outline:{ title='This interactive example fetches the output directly on-chain.' } This example returns the price of scrvUSD on Optimism.

        <div class="highlight">
        <pre><code>>>> ScrvusdOracle.price() <span id="priceOutput"></span></code></pre>
        </div>


### `time`
!!! description "`ScrvusdOracle.time() -> Interval: view`"

    Getter for the previous and future time of crvUSD the price will be updated.

    Returns: `Interval` struct containing `previous` and `future` timestamps.

    ??? quote "Source code"

        === "ScrvusdOracle.vy"

            ```python
            struct Interval:
                previous: uint256
                future: uint256

            time: public(Interval)
            ```

    === "Example"

        :material-information-outline:{ title='This interactive example fetches the output directly on-chain.' } This example returns the time of the previous and future price updates on Optimism.

        <div class="highlight">
        <pre><code>>>> ScrvusdOracle.time() <span id="timeOutput"></span></code></pre>
        </div>


### `pricePerShare`
!!! description "`ScrvusdOracle.pricePerShare(_ts: uint256) -> uint256: view`"

    !!!warning
        This function is not precise. The price is smoothed over time to eliminate sharp changes. Only timestamps near the future are supported.

    Getter for the price per share of the scrvUSD token. The function uses linear interpolation to calculate the price and assumes that updates are often enough for the absolute difference to be approximately equal to the relative difference.

    Returns: price per share of the scrvUSD token (`uint256`).

    | Input         | Type      | Description                  |
    | ------------- | --------- | ---------------------------- |
    | `_ts`         | `uint256` | Timestamp to look price at |

    ??? quote "Source code"

        === "ScrvusdOracle.vy"

            ```python
            struct Interval:
                previous: uint256
                future: uint256

            @view
            @external
            def pricePerShare(ts: uint256=block.timestamp) -> uint256:
                """
                @notice Get the price per share (pps) of the vault.
                @dev NOT precise. Price is smoothed over time to eliminate sharp changes.
                @param ts Timestamp to look price at. Only near future is supported.
                @return The price per share.
                """
                return self._price_per_share(ts)

            @view
            @internal
            def _price_per_share(ts: uint256) -> uint256:
                """
                @notice Using linear interpolation assuming updates are often enough
                    for absolute difference \approx relative difference
                """
                price: Interval = self.price
                time: Interval = self.time
                if ts >= time.future:
                    return price.future
                if ts <= time.previous:
                    return price.previous
                return (price.previous * (time.future - ts) + price.future * (ts - time.previous)) // (time.future - time.previous)
            ```

    === "Example"

        :material-information-outline:{ title='This interactive example fetches the output directly on-chain.' } This example returns the price per share of the scrvUSD token at a specific timestamp on Optimism.

        <div class="highlight">
        <pre><code>>>> ScrvusdOracle.pricePerShare(<input id="pricePerShareTimestamp" type="number" 
        style="width: 70px; 
            background: transparent; 
            border: none; 
            border-bottom: 1px solid #ccc; 
            color: inherit; 
            font-family: inherit; 
            font-size: inherit; 
            -moz-appearance: textfield;" 
            oninput="fetchPricePerShare()"/>)
        <span id="pricePerShareOutput"></span></code></pre>
        </div>

        <style>
        input[type=number]::-webkit-inner-spin-button, 
        input[type=number]::-webkit-outer-spin-button {
            -webkit-appearance: none;
            margin: 0;
        }
        </style>


### `pricePerAsset`
!!! description "`ScrvusdOracle.pricePerAsset(_ts: uint256) -> uint256: view`"

    !!!warning
        This function is not precise. The price is smoothed over time to eliminate sharp changes. Only timestamps near the future are supported.

    Getter for the price per asset of the scrvUSD token. The function uses linear interpolation to calculate the price and assumes that updates are often enough for the absolute difference to be approximately equal to the relative difference.

    Returns: price per asset of the scrvUSD token (`uint256`).

    | Input         | Type      | Description                  |
    | ------------- | --------- | ---------------------------- |
    | `_ts`         | `uint256` | Timestamp to look price at |

    ??? quote "Source code"

        === "ScrvusdOracle.vy"

            ```python
            struct Interval:
                previous: uint256
                future: uint256

            @view
            @external
            def pricePerAsset(ts: uint256=block.timestamp) -> uint256:
                """
                @notice Get the price per asset of the vault.
                @dev NOT precise. Price is smoothed over time to eliminate sharp changes.
                @param ts Timestamp to look price at. Only near future is supported.
                @return The price per share.
                """
                return 10 ** 36 // self._price_per_share(ts)

            @view
            @internal
            def _price_per_share(ts: uint256) -> uint256:
                """
                @notice Using linear interpolation assuming updates are often enough
                    for absolute difference \approx relative difference
                """
                price: Interval = self.price
                time: Interval = self.time
                if ts >= time.future:
                    return price.future
                if ts <= time.previous:
                    return price.previous
                return (price.previous * (time.future - ts) + price.future * (ts - time.previous)) // (time.future - time.previous)
            ```

    === "Example"

        :material-information-outline:{ title='This interactive example fetches the output directly on-chain.' } This example returns the price per asset of the scrvUSD token at a specific timestamp on Optimism.

        <div class="highlight">
        <pre><code>>>> ScrvusdOracle.pricePerAsset(<input id="pricePerAssetTimestamp" type="number" 
        style="width: 70px; 
            background: transparent; 
            border: none; 
            border-bottom: 1px solid #ccc; 
            color: inherit; 
            font-family: inherit; 
            font-size: inherit; 
            -moz-appearance: textfield;" 
            oninput="fetchPricePerAsset()"/>)
        <span id="pricePerAssetOutput"></span></code></pre>
        </div>

        <style>
        input[type=number]::-webkit-inner-spin-button, 
        input[type=number]::-webkit-outer-spin-button {
            -webkit-appearance: none;
            margin: 0;
        }
        </style>


### `price_oracle`
!!! description "`ScrvusdOracle.price_oracle() -> uint256: view`"

    Getter for the price of the scrvUSD token. This function is an alias for `pricePerShare` and `pricePerAsset` and is made for compatability reasons.

    Returns: price of scrvUSD (`uint256`).

    ??? quote "Source code"

        === "ScrvusdOracle.vy"

            ```python
            struct Interval:
                previous: uint256
                future: uint256

            @view
            @external
            def price_oracle(i: uint256=0) -> uint256:
                """
                @notice Alias of `pricePerShare` and `pricePerAsset` made for compatability
                @param i 0 for scrvusd per crvusd, 1 for crvusd per scrvusd
                @return Price with 10^18 precision
                """
                return self._price_per_share(block.timestamp) if i == 0 else 10 ** 36 // self._price_per_share(block.timestamp)

            @view
            @internal
            def _price_per_share(ts: uint256) -> uint256:
                """
                @notice Using linear interpolation assuming updates are often enough
                    for absolute difference \approx relative difference
                """
                price: Interval = self.price
                time: Interval = self.time
                if ts >= time.future:
                    return price.future
                if ts <= time.previous:
                    return price.previous
                return (price.previous * (time.future - ts) + price.future * (ts - time.previous)) // (time.future - time.previous)
            ```

    === "Example"

        :material-information-outline:{ title='This interactive example fetches the output directly on-chain.' } This example returns the price of scrvUSD on Optimism.

        <div class="highlight">
        <pre><code>>>> ScrvusdOracle.price_oracle() <span id="priceOracleOutput"></span></code></pre>
        </div>


---


## **Acceleration and Prover**


### `max_acceleration`
!!! description "`ScrvusdOracle.max_acceleration() -> uint256: view`"

    Getter for the maximum acceleration. The value is set at initialization and can be changed by the [`owner`](#owner) using the [`set_max_acceleration`](#set_max_acceleration) function.

    Returns: maximum acceleration (`uint256`).

    ??? quote "Source code"

        === "ScrvusdOracle.vy"

            ```python
            max_acceleration: public(uint256)  # precision 10**18

            @deploy
            def __init__(_initial_price: uint256, _max_acceleration: uint256):
                """
                @param _initial_price Initial price of asset per share (10**18)
                @param _max_acceleration Maximum acceleration (10**12)
                """
                self.price = Interval(previous=_initial_price, future=_initial_price)
                self.time = Interval(previous=block.timestamp, future=block.timestamp)

                self.max_acceleration = _max_acceleration

                ownable.__init__()
            ```

    === "Example"

        :material-information-outline:{ title='This interactive example fetches the output directly on-chain.' } This example returns the maximum acceleration of the oracleon Optimism.

        <div class="highlight">
        <pre><code>>>> ScrvusdOracle.max_acceleration() <span id="maxAccelerationOutput"></span></code></pre>
        </div>


### `set_max_acceleration`
!!! description "`ScrvusdOracle.set_max_acceleration(_max_acceleration: uint256)`"

    !!!guard "Guarded Method by Snekmate 🐍"
        This contract makes use of a Snekmate module to manage roles and permissions. This specific function is only callable by the `owner`.

    Function to set the maximum acceleration.

    | Input         | Type      | Description                  |
    | ------------- | --------- | ---------------------------- |
    | `_max_acceleration` | `uint256` | Maximum acceleration |

    ??? quote "Source code"

        === "ScrvusdOracle.vy"

            ```python
            max_acceleration: public(uint256)  # precision 10**18

            @external
            def set_max_acceleration(_max_acceleration: uint256):
                """
                @notice Set maximum acceleration of scrvUSD.
                    Must be less than StableSwap's minimum fee.
                    fee / (2 * block_time) is considered to be safe.
                @param _max_acceleration Maximum acceleration (per sec)
                """
                ownable._check_owner()

                assert 10 ** 8 <= _max_acceleration and _max_acceleration <= 10 ** 18
                self.max_acceleration = _max_acceleration
            ```

    === "Example"

        ```py
        >>> ScrvusdOracle.max_acceleration()
        1000000000000000000

        >>> ScrvusdOracle.set_max_acceleration(10**11)

        >>> ScrvusdOracle.max_acceleration()
        100000000000000000
        ```


### `prover`
!!! description "`ScrvusdOracle.prover() -> address: view`"

    Getter for the prover address. The address can be changed using the [`set_prover`](#set_prover) function.

    Returns: prover contract (`address`).

    ??? quote "Source code"

        === "ScrvusdOracle.vy"

            ```python
            prover: public(address)
            ```

    === "Example"

        :material-information-outline:{ title='This interactive example fetches the output directly on-chain.' } This example returns the prover contract on Optimism.

        <div class="highlight">
        <pre><code>>>> ScrvusdOracle.prover() <span id="proverOutput"></span></code></pre>
        </div>


### `set_prover`
!!! description "`ScrvusdOracle.set_prover(_prover: address)`"

    !!!guard "Guarded Method by Snekmate 🐍"
        This contract makes use of a Snekmate module to manage roles and permissions. This specific function is only callable by the `owner`.

    Function to set the prover contract.

    | Input         | Type      | Description                  |
    | ------------- | --------- | ---------------------------- |
    | `_prover`     | `address` | Prover contract |

    ??? quote "Source code"

        === "ScrvusdOracle.vy"

            ```python
            prover: public(address)

            @external
            def set_prover(_prover: address):
                """
                @notice Set the account with prover permissions.
                """
                ownable._check_owner()

                self.prover = _prover
                log SetProver(_prover)
            ```

    === "Example"

        This example sets the prover to the `0x47ca04Ee05f167583122833abfb0f14aC5677Ee4` contract.

        ```py
        >>> ScrvusdOracle.prover()
        '0x0000000000000000000000000000000000000000'

        >>> ScrvusdOracle.set_prover('0x47ca04Ee05f167583122833abfb0f14aC5677Ee4')

        >>> ScrvusdOracle.prover()
        '0x47ca04Ee05f167583122833abfb0f14aC5677Ee4'
        ```


---


## **Other Methods**

### `version`
!!! description "`ScrvusdOracle.version() -> String[8]: view`"

    Getter for the version of the oracle.

    Returns: version of the oracle (`String[8]`).

    ??? quote "Source code"

        === "ScrvusdOracle.vy"

            ```python
            version: public(constant(String[8])) = "0.0.1"
            ```

    === "Example"

        ```py
        >>> ScrvusdOracle.version()
        '0.0.1'
        ```
