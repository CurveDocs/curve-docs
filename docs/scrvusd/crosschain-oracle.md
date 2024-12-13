<h1>Crosschain scrvUSD</h1>

<script src="/assets/javascripts/contracts/scrvusd/scrvusd-crosschain-oracle.js"></script>
<script src="https://cdn.jsdelivr.net/npm/web3@1.5.2/dist/web3.min.js"></script>


`scrvUSD` on Ethereum is an ERC-4626 compatible token. While the contract provides a price through various methods, such as `pricePerShare` or `pricePerAsset`, it is not treated as an ERC-4626 token when bridged to other chains. Consequently, it will lack methods to return its continuously updating price. To address this, Curve uses a system to commit to and verify the price of `scrvUSD` on other chains.


???+abstract "Smart Contracts"

    The source code for the contracts is available on [:material-github: GitHub](https://github.com/curvefi/curve-xdao):
  
    - [:logos-vyper: `scrvUSDOracle.vy`](https://github.com/curvefi/curve-xdao/blob/feat/scrvusd-oracle/contracts/oracles/scrvUSDOracle.vy) written in [Vyper](https://vyperlang.org/) version `0.4.0`
    - [:logos-vyper: `BlockHashOracle.vy`](https://github.com/curvefi/curve-xdao/blob/feat/scrvusd-oracle/contracts/oracles/BlockHashOracle.vy) written in [Vyper](https://vyperlang.org/) version `0.3.10`
    - [:logos-solidity: `ScrvusdProver.sol`](https://github.com/curvefi/curve-xdao/blob/feat/scrvusd-oracle/contracts/provers/ScrvusdProver.sol) written in [Solidity](https://soliditylang.org/) version `0.8.18`

    **NOTE: Source code and versions may vary between different chains.**

    === ":logos-optimism: Optimism"

        |Contract | Address |
        | ------------- | ---------------- |
        | `scrvUSDOracle` | [`0xC772063cE3e622B458B706Dd2e36309418A1aE42`](https://optimistic.etherscan.io/address/0xC772063cE3e622B458B706Dd2e36309418A1aE42) |
        | `Prover` | [`0x47ca04Ee05f167583122833abfb0f14aC5677Ee4`](https://optimistic.etherscan.io/address/0x47ca04Ee05f167583122833abfb0f14aC5677Ee4) |
        | `BlockHashOracle` | [`0x988d1037e9608B21050A8EFba0c6C45e01A3Bce7`](https://optimistic.etherscan.io/address/0x988d1037e9608B21050A8EFba0c6C45e01A3Bce7) |


    === ":logos-fraxtal: Fraxtal"

        | Contract | Address |
        | ------------- | ---------------- |
        | `scrvUSDOracle` | [`0x09F8D940EAD55853c51045bcbfE67341B686C071`](https://fraxscan.com/address/0x09F8D940EAD55853c51045bcbfE67341B686C071) |
        | `Prover` | [`0x0094Ad026643994c8fB2136ec912D508B15fe0E5`](https://fraxscan.com/address/0x0094Ad026643994c8fB2136ec912D508B15fe0E5) |
        | `BlockHashOracle` | [`0xbD2775B8eADaE81501898eB208715f0040E51882`](https://fraxscan.com/address/0xbD2775B8eADaE81501898eB208715f0040E51882) |



    === ":logos-base: Base"

        | Contract | Address |
        | ------------- | ---------------- |
        | `scrvUSDOracle` | [`0x3d8EADb739D1Ef95dd53D718e4810721837c69c1`](https://basescan.org/address/0x3d8EADb739D1Ef95dd53D718e4810721837c69c1) |
        | `Prover` | [`0x6a2691068C7CbdA03292Ba0f9c77A25F658bAeF5`](https://basescan.org/address/0x6a2691068C7CbdA03292Ba0f9c77A25F658bAeF5) |
        | `BlockHashOracle` | [`0x3c0a405E914337139992625D5100Ea141a9C4d11`](https://basescan.org/address/0x3c0a405E914337139992625D5100Ea141a9C4d11) |


    === ":logos-mantle: Mantle"

        | Contract | Address |
        | ------------- | ---------------- |
        | `scrvUSDOracle` | [`0xbD2775B8eADaE81501898eB208715f0040E51882`](https://mantlescan.xyz/address/0xbD2775B8eADaE81501898eB208715f0040E51882) |
        | `Prover` | [`0x09F8D940EAD55853c51045bcbfE67341B686C071`](https://mantlescan.xyz/address/0x09F8D940EAD55853c51045bcbfE67341B686C071) |
        | `BlockHashOracle` | [`0x004A476B5B76738E34c86C7144554B9d34402F13`](https://mantlescan.xyz/address/0x004A476B5B76738E34c86C7144554B9d34402F13) |


The cross-chain scrvUSD system operates through three main components working together:

1. **Block Hash Oracle**: 
    - Provides Ethereum block hash values across different chains.
    - Maintains a record of the latest known Ethereum block hashes on L2s.
    - Implemented as a separate contract to handle uncertain block timing and enable reuse.

2. **Prover**:
    - Uses verified block hashes to validate storage proofs.
    - Each block hash represents a Merkle tree containing various data, including storage slots.
    - Verifies all storage slots needed for rate replication.

3. **scrvUSD Oracle**:
    - Receives verified storage values from the Prover.
    - Calculates and stores the scrvUSD rate.
    - Implements time-weighted updates to prevent sudden changes that could enable sandwich attacks.
    - Controls the rate of change using the `max_acceleration` parameter.


---


# **scrvUSD Oracle**

Contract that contains information about the price of scrvUSD. It uses a `max_acceleration` parameter to limit the rate of price updates. The oracle includes a `price_oracle` method to ensure compatibility with other smart contracts, such as Stableswap implementations.

## **Price Methods**

### `update_price`
!!! description "`scrvUSDOracle.update_price(_parameters: uint256[ASSETS_PARAM_CNT + SUPPLY_PARAM_CNT]) -> uint256`"

    Function to update the price of the scrvUSD token.

    Returns: relative price change of final price with 10**18 precision (`uint256`).

    Emits: `PriceUpdate` event.

    | Input         | Type      | Description                  |
    | ------------- | --------- | ---------------------------- |
    | `_parameters` | `uint256[ASSETS_PARAM_CNT + SUPPLY_PARAM_CNT]` | Parameters |

    ??? quote "Source code"

        === "scrvUSDOracle.vy"

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
        >>> scrvUSDOracle.price()
        1008353536323212312

        >>> scrvUSDOracle.update_price()

        >>> scrvUSDOracle.price()
        1009393556372147140
        ```


### `price`
!!! description "`scrvUSDOracle.price() -> Interval: view`"

    Getter for the previous and future price of crvUSD.

    Returns: `Interval` struct containing `previous` and `future` prices.

    ??? quote "Source code"

        === "scrvUSDOracle.vy"

            ```python
            struct Interval:
                previous: uint256
                future: uint256

            price: public(Interval)  # price of asset per share
            ```

    === "Example"

        :material-information-outline:{ title='This interactive example fetches the output directly on-chain.' } This example returns the price of scrvUSD on Optimism.

        <div class="highlight">
        <pre><code>>>> scrvUSDOracle.price() <span id="priceOutput"></span></code></pre>
        </div>


### `time`
!!! description "`scrvUSDOracle.time() -> Interval: view`"

    Getter for the previous and future time of when the price will be updated.

    Returns: `Interval` struct containing `previous` and `future` timestamps (`uint256`).

    ??? quote "Source code"

        === "scrvUSDOracle.vy"

            ```python
            struct Interval:
                previous: uint256
                future: uint256

            time: public(Interval)
            ```

    === "Example"

        :material-information-outline:{ title='This interactive example fetches the output directly on-chain.' } This example returns the time of the previous and future price updates on Optimism.

        <div class="highlight">
        <pre><code>>>> scrvUSDOracle.time() <span id="timeOutput"></span></code></pre>
        </div>


### `pricePerShare`
!!! description "`scrvUSDOracle.pricePerShare(_ts: uint256) -> uint256: view`"

    !!!warning
        This function is not precise. The price is smoothed over time to eliminate sharp changes. Only timestamps near the future are supported.

    Getter for the price per share of the scrvUSD token. The function uses linear interpolation to calculate the price and assumes that updates are often enough for the absolute difference to be approximately equal to the relative difference.

    Returns: price per share of the scrvUSD token (`uint256`).

    | Input         | Type      | Description                  |
    | ------------- | --------- | ---------------------------- |
    | `_ts`         | `uint256` | Timestamp to get the price at |

    ??? quote "Source code"

        === "scrvUSDOracle.vy"

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
        <pre><code>>>> scrvUSDOracle.pricePerShare(<input id="pricePerShareTimestamp" type="number" 
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
!!! description "`scrvUSDOracle.pricePerAsset(_ts: uint256) -> uint256: view`"

    !!!warning
        This function is not precise. The price is smoothed over time to eliminate sharp changes. Only timestamps near the future are supported.

    Getter for the price per asset of the scrvUSD token. The function uses linear interpolation to calculate the price and assumes that updates are often enough for the absolute difference to be approximately equal to the relative difference.

    Returns: price per asset of the scrvUSD token (`uint256`).

    | Input         | Type      | Description                  |
    | ------------- | --------- | ---------------------------- |
    | `_ts`         | `uint256` | Timestamp to get the price at |

    ??? quote "Source code"

        === "scrvUSDOracle.vy"

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
        <pre><code>>>> scrvUSDOracle.pricePerAsset(<input id="pricePerAssetTimestamp" type="number" 
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
!!! description "`scrvUSDOracle.price_oracle() -> uint256: view`"

    Getter for the price of the scrvUSD token. This function is an alias for `pricePerShare` and `pricePerAsset` and is made for compatability reasons.

    Returns: price of scrvUSD (`uint256`).

    ??? quote "Source code"

        === "scrvUSDOracle.vy"

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
        <pre><code>>>> scrvUSDOracle.price_oracle() <span id="priceOracleOutput"></span></code></pre>
        </div>


---


## **Oracle Acceleration**

Because the rates are stored over time, the price can change suddenly and can lead to sandwich attacks. To prevent this, the `max_acceleration` parameter is used to limit the rate of price updates.

### `max_acceleration`
!!! description "`scrvUSDOracle.max_acceleration() -> uint256: view`"

    Getter for the maximum acceleration. The value is set at initialization and can be changed by the [`owner`](#owner) using the [`set_max_acceleration`](#set_max_acceleration) function.

    Returns: maximum acceleration (`uint256`).

    ??? quote "Source code"

        === "scrvUSDOracle.vy"

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
        <pre><code>>>> scrvUSDOracle.max_acceleration() <span id="maxAccelerationOutput"></span></code></pre>
        </div>


### `set_max_acceleration`
!!! description "`scrvUSDOracle.set_max_acceleration(_max_acceleration: uint256)`"

    !!!guard "Guarded Method by Snekmate 🐍"
        This contract makes use of a Snekmate module to manage roles and permissions. This specific function is only callable by the `owner`.

    Function to set the maximum acceleration.

    | Input         | Type      | Description                  |
    | ------------- | --------- | ---------------------------- |
    | `_max_acceleration` | `uint256` | Maximum acceleration |

    ??? quote "Source code"

        === "scrvUSDOracle.vy"

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
        >>> scrvUSDOracle.max_acceleration()
        1000000000000000000

        >>> scrvUSDOracle.set_max_acceleration(10**11)

        >>> scrvUSDOracle.max_acceleration()
        100000000000000000
        ```


---


## **Prover**

### `prover`
!!! description "`scrvUSDOracle.prover() -> address: view`"

    Getter for the prover address. The address can be changed using the [`set_prover`](#set_prover) function.

    Returns: prover contract (`address`).

    ??? quote "Source code"

        === "scrvUSDOracle.vy"

            ```python
            prover: public(address)
            ```

    === "Example"

        :material-information-outline:{ title='This interactive example fetches the output directly on-chain.' } This example returns the prover contract on Optimism.

        <div class="highlight">
        <pre><code>>>> scrvUSDOracle.prover() <span id="proverOutput"></span></code></pre>
        </div>


### `set_prover`
!!! description "`scrvUSDOracle.set_prover(_prover: address)`"

    !!!guard "Guarded Method by Snekmate 🐍"
        This contract makes use of a Snekmate module to manage roles and permissions. This specific function is only callable by the `owner`.

    Function to set the prover contract.

    | Input         | Type      | Description                  |
    | ------------- | --------- | ---------------------------- |
    | `_prover`     | `address` | Prover contract |

    ??? quote "Source code"

        === "scrvUSDOracle.vy"

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
        >>> scrvUSDOracle.prover()
        '0x0000000000000000000000000000000000000000'

        >>> scrvUSDOracle.set_prover('0x47ca04Ee05f167583122833abfb0f14aC5677Ee4')

        >>> scrvUSDOracle.prover()
        '0x47ca04Ee05f167583122833abfb0f14aC5677Ee4'
        ```


---


# **Block Hash Oracle**

The `BlockHashOracle` contract is providing Ethereum's `blockhash(block number)` values. Optimism stores some latest known blockhash, so the OP stack oracle works like simply saving latest known.

### `commit`
!!! description "`BlockHashOracle.commit(_block_number: uint256) -> uint256: view`"

    Function to commit (and apply) a block hash.

    Returns: block number (`uint256`).

    | Input | Type | Description |
    | ----- | ---- | ----------- |
    | `_block_number` | `uint256` | Block number |

    ??? quote "Source code"

        === "BlockHashOracle.vy"

            ```python
            event CommitBlockHash:
                committer: indexed(address)
                number: indexed(uint256)
                hash: bytes32

            event ApplyBlockHash:
                number: indexed(uint256)
                hash: bytes32

            L1_BLOCK: constant(IL1Block) = IL1Block(0x4200000000000000000000000000000000000015)

            block_hash: public(HashMap[uint256, bytes32])
            commitments: public(HashMap[address, HashMap[uint256, bytes32]])

            @external
            def commit() -> uint256:
                """
                @notice Commit (and apply) a block hash.
                @dev Same as `apply()` but saves committer
                """
                number: uint256 = 0
                hash: bytes32 = empty(bytes32)
                number, hash = self._update_block_hash()

                self.commitments[msg.sender][number] = hash
                log CommitBlockHash(msg.sender, number, hash)
                log ApplyBlockHash(number, hash)
                return number

            @internal
            def _update_block_hash() -> (uint256, bytes32):
                number: uint256 = convert(staticcall L1_BLOCK.number(), uint256)
                hash: bytes32 = staticcall L1_BLOCK.hash()
                self.block_hash[number] = hash

                return number, hash
            ```

    === "Example"

        ```py
        >>> BlockHashOracle.commit()
        ```


### `apply`
!!! description "`BlockHashOracle.apply() -> uint256: view`"

    Function to apply a block hash.

    Returns: block number (`uint256`).

    ??? quote "Source code"

        === "BlockHashOracle.vy"

            ```python
            event CommitBlockHash:
                committer: indexed(address)
                number: indexed(uint256)
                hash: bytes32

            event ApplyBlockHash:
                number: indexed(uint256)
                hash: bytes32

            L1_BLOCK: constant(IL1Block) = IL1Block(0x4200000000000000000000000000000000000015)

            block_hash: public(HashMap[uint256, bytes32])
            commitments: public(HashMap[address, HashMap[uint256, bytes32]])

            @external
            def apply() -> uint256:
                """
                @notice Apply a block hash.
                """
                number: uint256 = 0
                hash: bytes32 = empty(bytes32)
                number, hash = self._update_block_hash()

                log ApplyBlockHash(number, hash)
                return number

            @internal
            def _update_block_hash() -> (uint256, bytes32):
                number: uint256 = convert(staticcall L1_BLOCK.number(), uint256)
                hash: bytes32 = staticcall L1_BLOCK.hash()
                self.block_hash[number] = hash

                return number, hash
            ```

    === "Example"

        ```py
        >>> BlockHashOracle.apply()
        ```


### `get_block_hash`
!!! description "`BlockHashOracle.get_block_hash(_number: uint256) -> bytes32: view`"

    Getter for the block hash of a given block number. This function will revert if the block hash has not been set.

    Returns: block hash (`bytes32`).

    | Input | Type | Description |
    | ----- | ---- | ----------- |
    | `_number` | `uint256` | Block number |

    ??? quote "Source code"

        === "BlockHashOracle.vy"

            ```python
            block_hash: public(HashMap[uint256, bytes32])

            @view
            @external
            def get_block_hash(_number: uint256) -> bytes32:
                """
                @notice Query the block hash of a block.
                @dev Reverts for block numbers which have yet to be set.
                """
                block_hash: bytes32 = self.block_hash[_number]
                assert block_hash != empty(bytes32)

                return block_hash
            ```

    === "Example"

        This example returns the block hash for block number 21192041 (on Ethereum).

        ```py
        >>> BlockHashOracle.get_block_hash(21192041)
        '0x9db78f319e1bfde9cb0723b6e96de3dce6d378b01b341a5e45546ac4b7f7269a'

        >>> BlockHashOracle.get_block_hash(21192042)
        Error: Returned error: execution reverted
        ```


### `block_hash`
!!! description "`BlockHashOracle.block_hash(_number: uint256) -> bytes32: view`"

    Getter for the block hash of a given block number.

    Returns: block hash (`bytes32`).


    | Input | Type | Description |
    | ----- | ---- | ----------- |
    | `_number` | `uint256` | Block number |

    ??? quote "Source code"

        === "BlockHashOracle.vy"

            ```python
            block_hash: public(HashMap[uint256, bytes32])
            ```

    === "Example"

        This example returns the block hash for block number 21192041 (on Ethereum).

        ```py
        >>> BlockHashOracle.block_hash(21192041)
        '0x9db78f319e1bfde9cb0723b6e96de3dce6d378b01b341a5e45546ac4b7f7269a'

        >>> BlockHashOracle.block_hash(21192042)
        '0x0000000000000000000000000000000000000000000000000000000000000000'
        ```


### `commitments`
!!! description "`BlockHashOracle.commitments(_committer: address, _number: uint256) -> bytes32: view`"

    Getter for the block hash of a given block number.

    Returns: block hash (`bytes32`).

    | Input | Type | Description |
    | ----- | ---- | ----------- |
    | `_committer` | `address` | The committer's address. |
    | `_number` | `uint256` | The block number. |

    ??? quote "Source code"

        === "BlockHashOracle.vy"

            ```python
            commitments: public(HashMap[address, HashMap[uint256, bytes32]])
            ```

    === "Example"

        ```py
        >>> soon
        ```


---


# **scrvUSD Prover**

### `prove`
!!! description "`ScrvusdProver.prove(bytes, bytes) -> bool`"

    Function to prove parameters of scrvUSD rate.

    Returns: `bool` indicating success.

    | Input | Type | Description |
    | ----- | ---- | ----------- |
    | `_block_header_rlp` | `bytes` | The block header of any block. |
    | `_proof_rlp` | `bytes` | The state proof of the parameters. |

    ??? quote "Source code"

        === "ScrvusdProver.sol"

            ```solidity
            interface IBlockHashOracle {
                function get_block_hash(uint256 _number) external view returns (bytes32);
            }

            interface IscrvUSDOracle {
                function update_price(
                    uint256[2 + 6] memory _parameters
                ) external returns (uint256);
            }

            /// @title Scrvusd Prover
            /// @author Curve Finance
            contract ScrvusdProver {
                using RLPReader for bytes;
                using RLPReader for RLPReader.RLPItem;

                address constant SCRVUSD =
                    0x0655977FEb2f289A4aB78af67BAB0d17aAb84367;
                bytes32 constant SCRVUSD_HASH =
                    keccak256(abi.encodePacked(SCRVUSD));

                address public immutable BLOCK_HASH_ORACLE;
                address public immutable SCRVUSD_ORACLE;

                uint256 constant PARAM_CNT = 2 + 6;
                uint256 constant PROOF_CNT = PARAM_CNT - 1;  // -1 for timestamp obtained from block header

                constructor(address _block_hash_oracle, address _scrvusd_oracle) {
                    BLOCK_HASH_ORACLE = _block_hash_oracle;
                    SCRVUSD_ORACLE = _scrvusd_oracle;
                }

                /// Prove parameters of scrvUSD rate.
                /// @param _block_header_rlp The block header of any block.
                /// @param _proof_rlp The state proof of the parameters.
                function prove(
                    bytes memory _block_header_rlp,
                    bytes memory _proof_rlp
                ) external returns (uint256) {
                    Verifier.BlockHeader memory block_header = Verifier.parseBlockHeader(
                        _block_header_rlp
                    );
                    require(block_header.hash != bytes32(0)); // dev: invalid blockhash
                    require(
                        block_header.hash ==
                            IBlockHashOracle(BLOCK_HASH_ORACLE).get_block_hash(
                                block_header.number
                            )
                    ); // dev: blockhash mismatch

                    // convert _proof_rlp into a list of `RLPItem`s
                    RLPReader.RLPItem[] memory proofs = _proof_rlp.toRlpItem().toList();
                    require(proofs.length == 1 + PROOF_CNT); // dev: invalid number of proofs

                    // 0th proof is the account proof for the scrvUSD contract
                    Verifier.Account memory account = Verifier.extractAccountFromProof(
                        SCRVUSD_HASH, // position of the account is the hash of its address
                        block_header.stateRootHash,
                        proofs[0].toList()
                    );
                    require(account.exists); // dev: scrvUSD account does not exist

                    // iterate over proofs
                    uint256[PROOF_CNT] memory PARAM_SLOTS = [
                        // Assets parameters
                        uint256(21),  // total_debt
                        22,  // total_idle

                        // Supply parameters
                        20,  // totalSupply
                        38,  // full_profit_unlock_date
                        39,  // profit_unlocking_rate
                        40,  // last_profit_update
                        uint256(keccak256(abi.encode(18, SCRVUSD)))  // balance_of_self
                        // ts from block header
                    ];
                    uint256[PARAM_CNT] memory params;
                    Verifier.SlotValue memory slot;
                    uint256 i = 0;
                    for (uint256 idx = 1; idx < 1 + PROOF_CNT; idx++) {
                        slot = Verifier.extractSlotValueFromProof(
                            keccak256(abi.encode(PARAM_SLOTS[i])),
                            account.storageRoot,
                            proofs[idx].toList()
                        );
                        // Some slots may not be used => not exist, e.g. total_idle
                        // require(slot.exists);

                        params[i] = slot.value;
                        i++;
                    }
                    params[i] = block_header.timestamp;
                    return IscrvUSDOracle(SCRVUSD_ORACLE).update_price(params);
                }
            }
            ```

    === "Example"

        ```py
        >>> ScrvUSDProver.prove()
        ```


### `BLOCK_HASH_ORACLE`
!!! description "`ScrvusdProver.BLOCK_HASH_ORACLE() -> address: view`"

    Getter for the `BlockHashOracle` contract.

    Returns: `BlockHashOracle` contract (`address`).

    ??? quote "Source code"

        === "ScrvusdProver.sol"

            ```solidity
            address public immutable BLOCK_HASH_ORACLE;

            constructor(address _block_hash_oracle, address _scrvusd_oracle) {
                BLOCK_HASH_ORACLE = _block_hash_oracle;
                SCRVUSD_ORACLE = _scrvusd_oracle;
            }
            ```

    === "Example"

        :material-information-outline:{ title='This interactive example fetches the output directly on-chain.' } This example returns the `BlockHashOracle` contract on Optimism.

        <div class="highlight">
        <pre><code>>>> Prover.BLOCK_HASH_ORACLE() <span id="blockHashOracleOutput"></span></code></pre>
        </div>


### `SCRVUSD_ORACLE`
!!! description "`ScrvusdProver.SCRVUSD_ORACLE() -> address: view`"

    Getter for the `scrvUSDOracle` contract.

    Returns: `scrvUSDOracle` contract (`address`).

    ??? quote "Source code"

        === "BlockHashOracle.vy"

            ```solidity
            address public immutable SCRVUSD_ORACLE;

            constructor(address _block_hash_oracle, address _scrvusd_oracle) {
                BLOCK_HASH_ORACLE = _block_hash_oracle;
                SCRVUSD_ORACLE = _scrvusd_oracle;
            }
            ```

    === "Example"

        :material-information-outline:{ title='This interactive example fetches the output directly on-chain.' } This example returns the scrvUSD oracle contract on Optimism.

        <div class="highlight">
        <pre><code>>>> Prover.SCRVUSD_ORACLE() <span id="scrvUSDOracleOutput"></span></code></pre>
        </div>
