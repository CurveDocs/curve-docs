<h1>Rate Provider</h1>

The `RateProvider` contract is designed to provide rates for token swaps.

!!!github "GitHub"
    The source code of the `RateProvider.vy` contract can be found on [:material-github: GitHub](https://github.com/curvefi/metaregistry/blob/main/contracts/RateProvider.vy).  
    
    Additionally, each `RateProvider` contract is **integrated into the chain-specific [`AddressProvider`](./address-provider.md) at `ID = 18`**. To get the **most recent contract, users are advised to fetch it directly from the `AddressProvider`**. 

    *For example, to query the `RateProvider` contract on Ethereum:*

    ```py
    >>> AddressProvider.get_address(18)
    '0xA834f3d23749233c9B61ba723588570A1cCA0Ed7'
    ```


The contract has a [`get_quotes`](#get_quotes) method which fetches and returns exchange rates for specified token pairs. These quotes are only sourced from Curve AMM pools. The contract strictly relies on the `Metaregistry` contract as it fetches rates only from pools picked up by it[^1]. Additionally, there is a [`get_aggregated_rate`](#get_aggregated_rate) method which returns a weighted aggregated rate.

The logic of the contract is to identify the pool type used to facilitate the desired swap and then use the corresponding ABI, which essentially calls the `get_dy` or `get_dy_underlying` function to fetch the rates.

[^1]: All old liquidity pools are integrated into the `Metaregistry`. Newly deployed ones are automatically picked up. Therefore, all pools *should* be included.

=== "ABI"

    ```py
    STABLESWAP_META_ABI: constant(String[64]) = "get_dy_underlying(int128,int128,uint256)"
    STABLESWAP_ABI: constant(String[64]) = "get_dy(int128,int128,uint256)"
    CRYPTOSWAP_ABI: constant(String[64]) = "get_dy(uint256,uint256,uint256)"
    ```


---


### `get_quotes`
!!! description "`CurveRateProvider.get_quotes(source_token: address, destination_token: address, amount_in: uint256) -> DynArray[Quote, MAX_QUOTES]`"

    Getter method which returns quotes for a specified `source_token` compared to a `destination_token` based on the input ampount `amount_in`.

    Returns: A dynamic array of `Quote` structs containing the following data:

    - `source_token_index (uint256)`: Index of the input token in the pool.
    - `dest_token_index (uint256)`: Index of the output token in the pool.
    - `is_underlying (bool)`: Indicates if a metapool is involved.
    - `amount_out (uint256)`: Amount of the destination token to be received.
    - `pool (address)`: Liquidity pool address from which the rate is provided.
    - `source_token_pool_balance (`uint256`)`: Source token balance within the pool.
    - `dest_token_pool_balance (`uint256`)`: Destination token balance within the pool.
    - `pool_type (uint8)`: Type of pool: `0 = Stableswap`, `1 = Cryptoswap`, `2 = LLAMMA`

    | Input               | Type      | Description                  |
    | ------------------- | --------- | ---------------------------- |
    | `source_token`      | `address` | Source token.                |
    | `destination_token` | `address` | Destination token.           |
    | `amount_in`         | `uint256` | Amount of tokens the provided rate is based on. |

    ??? quote "Source code"

        === "CurveRateProvider.vy"

            ```py
            struct Quote:
                source_token_index: uint256
                dest_token_index: uint256
                is_underlying: bool
                amount_out: uint256
                pool: address
                source_token_pool_balance: uint256
                dest_token_pool_balance: uint256
                pool_type: uint8  # 0 for stableswap, 1 for cryptoswap, 2 for LLAMMA.

            interface AddressProvider:
                def get_address(id: uint256) -> address: view

            interface Metaregistry:
                def find_pools_for_coins(source_coin: address, destination_coin: address) -> DynArray[address, 1000]: view
                def get_coin_indices(_pool: address, _from: address, _to: address) -> (int128, int128, bool): view
                def get_underlying_balances(_pool: address) -> uint256[MAX_COINS]: view

            ADDRESS_PROVIDER: public(immutable(AddressProvider))
            METAREGISTRY_ID: constant(uint256) = 7
            STABLESWAP_META_ABI: constant(String[64]) = "get_dy_underlying(int128,int128,uint256)"
            STABLESWAP_ABI: constant(String[64]) = "get_dy(int128,int128,uint256)"
            CRYPTOSWAP_ABI: constant(String[64]) = "get_dy(uint256,uint256,uint256)"

            @external
            @view
            def get_quotes(source_token: address, destination_token: address, amount_in: uint256) -> DynArray[Quote, MAX_QUOTES]:
                return self._get_quotes(source_token, destination_token, amount_in)

            @internal
            @view
            def _get_quotes(source_token: address, destination_token: address, amount_in: uint256) -> DynArray[Quote, MAX_QUOTES]:

                quotes: DynArray[Quote, MAX_QUOTES] = []
                metaregistry: Metaregistry = Metaregistry(ADDRESS_PROVIDER.get_address(METAREGISTRY_ID))
                pools: DynArray[address, 1000] = metaregistry.find_pools_for_coins(source_token, destination_token)

                if len(pools) == 0:
                    return quotes

                # get  pool types for each pool
                for pool in pools:

                    # is it a stableswap pool? are the coin pairs part of a metapool?
                    pool_type: uint8 = self._get_pool_type(pool, metaregistry)

                    # get coin indices
                    i: int128 = 0
                    j: int128 = 0
                    is_underlying: bool = False
                    (i, j, is_underlying) = metaregistry.get_coin_indices(pool, source_token, destination_token)

                    # get balances
                    balances: uint256[MAX_COINS] = metaregistry.get_underlying_balances(pool)
                    dyn_balances: DynArray[uint256, MAX_COINS] = []
                    for bal in balances:
                        if bal > 0:
                            dyn_balances.append(bal)

                    # skip if pool is too small
                    if 0 in dyn_balances:
                        continue

                    # do a get_dy call and only save quote if call does not bork; use correct abi (in128 vs uint256)
                    quote: uint256 = self._get_pool_quote(i, j, amount_in, pool, pool_type, is_underlying)

                    # check if get_dy works and if so, append quote to dynarray
                    if quote > 0 and len(quotes) < MAX_QUOTES:
                        quotes.append(
                            Quote(
                                {
                                    source_token_index: convert(i, uint256),
                                    dest_token_index: convert(j, uint256),
                                    is_underlying: is_underlying,
                                    amount_out: quote,
                                    pool: pool,
                                    source_token_pool_balance: balances[i],
                                    dest_token_pool_balance: balances[j],
                                    pool_type: pool_type
                                }
                            )
                        )

                return quotes

            @internal
            @view
            def _get_pool_quote(
                i: int128,
                j: int128, 
                amount_in: uint256, 
                pool: address, 
                pool_type: uint8, 
                is_underlying: bool
            ) -> uint256:

                success: bool = False
                response: Bytes[32] = b""
                method_abi: Bytes[4] = b""

                # choose the right abi:
                if pool_type == 0 and is_underlying:
                    method_abi = method_id(STABLESWAP_META_ABI)
                elif pool_type == 0 and not is_underlying:
                    method_abi = method_id(STABLESWAP_ABI)
                else:
                    method_abi = method_id(CRYPTOSWAP_ABI)

                success, response = raw_call(
                    pool,
                    concat(
                        method_abi,
                        convert(i, bytes32),
                        convert(j, bytes32),
                        convert(amount_in, bytes32),
                    ),
                    max_outsize=32,
                    revert_on_failure=False,
                    is_static_call=True
                )

                if success:
                    return convert(response, uint256)

                return 0

            @internal
            @view
            def _get_pool_type(pool: address, metaregistry: Metaregistry) -> uint8:
                
                # 0 for stableswap, 1 for cryptoswap, 2 for LLAMMA.

                success: bool = False
                response: Bytes[32] = b""

                # check if cryptoswap
                success, response = raw_call(
                    pool,
                    method_id("allowed_extra_profit()"),
                    max_outsize=32,
                    revert_on_failure=False,
                    is_static_call=True
                )
                if success:
                    return 1

                # check if llamma
                success, response = raw_call(
                    pool,
                    method_id("get_rate_mul()"),
                    max_outsize=32,
                    revert_on_failure=False,
                    is_static_call=True
                )
                if success:
                    return 2

                return 0
            ```

    === "Example"

        This example shows the quotes when swapping 1000 `CRV` for `asdCRV`. The `get_quotes` method returns two `Quote` structs because there are two pools that can facilitate the trade:

        ```shell
        >>> CurveRateProvider.get_quotes('0x11cdb42b0eb46d95f990bedd4695a6e3fa034978', '0x75289388d50364c3013583d97bd70ced0e183e32', 10**21)
        [0, 1, false, 714858885217291769395, 0xB85246768Cfea42b0c935265Db798C9Ae457646f, 252287097613511084984749, 79868164306389315090776, 1]
        [0, 2, false, 720123483984082032033, 0x5C959D2c1a49B637Fb988c40d663265F8Bf6d289, 1172262450081282857543531, 447584250494794848814622, 1]
        ```


### `get_aggregated_rate`
!!! description "`CurveRateProvider.get_aggregated_rate(source_token: address, destination_token: address) -> uint256`"

    Getter for the weighted aggregated rate of all quotes from the `source_token` to the `destination_token`. The calculations are based on an input amount of 1 unit of the source token. The aggregated rate is calculated as follows:

      1. For each quote, the balances of the source and destination tokens in the pool are normalized to a scale of 18 decimals.
      2. The total balance is computed by summing the normalized balances of the source and destination tokens across all pools.
      3. The weight for each quote is determined by the proportion of its normalized pool balance to the total balance. The weighted average is then computed by summing the product of each quote's output amount and its weight.

    Returns: aggregated rate (`uint256`).

    | Input               | Type      | Description                  |
    | ------------------- | --------- | ---------------------------- |
    | `source_token`      | `address` | Source token.                |
    | `destination_token` | `address` | Destination token.           |

    ??? quote "Source code"

        === "CurveRateProvider.vy"

            ```py
            @external
            @view
            def get_aggregated_rate(source_token: address, destination_token: address) -> uint256:

                amount_in: uint256 = 10**convert(ERC20Detailed(source_token).decimals(), uint256)
                quotes: DynArray[Quote, MAX_QUOTES] = self._get_quotes(source_token, destination_token, amount_in)

                return self.weighted_average_quote(
                    convert(ERC20Detailed(source_token).decimals(), uint256), 
                    convert(ERC20Detailed(destination_token).decimals(), uint256),
                    quotes, 
                )

            @internal
            @pure
            def weighted_average_quote(
                source_token_decimals: uint256, 
                dest_token_decimals: uint256, 
                quotes: DynArray[Quote, MAX_QUOTES]
            ) -> uint256:
                
                num_quotes: uint256 = len(quotes)

                # Calculate total balance with normalization
                total_balance: uint256 = 0
                for i in range(num_quotes, bound=MAX_QUOTES):
                    source_balance_normalized: uint256 = quotes[i].source_token_pool_balance * 10**(18 - source_token_decimals)
                    dest_balance_normalized: uint256 = quotes[i].dest_token_pool_balance * 10**(18 - dest_token_decimals)
                    total_balance += source_balance_normalized + dest_balance_normalized


                # Calculate weighted sum with normalization
                weighted_avg: uint256 = 0
                for i in range(num_quotes, bound=MAX_QUOTES):
                    source_balance_normalized: uint256 = quotes[i].source_token_pool_balance * 10**(18 - source_token_decimals)
                    dest_balance_normalized: uint256 = quotes[i].dest_token_pool_balance * 10**(18 - dest_token_decimals)
                    pool_balance_normalized: uint256 = source_balance_normalized + dest_balance_normalized
                    weight: uint256 = (pool_balance_normalized * 10**18) / total_balance  # Use 18 decimal places for precision
                    weighted_avg += weight * quotes[i].amount_out / 10**18

                return weighted_avg
            ```

    === "Example"

        ```shell
        >>> CurveRateProvider.get_aggregated_rate('0x11cdb42b0eb46d95f990bedd4695a6e3fa034978', '0x75289388d50364c3013583d97bd70ced0e183e32')
        719612081529229719
        ```


### `version`
!!! description "`CurveRateProvider.version() -> String[8]: view`"

    Getter for the version of the rate provider contract.

    Returns: contract version (`String[8]`).

    ??? quote "Source code"

        === "CurveRateProvider.vy"

            ```vyper
            version: public(constant(String[8])) = "1.1.0"
            ```

    === "Example"

        ```shell
        >>> CurveRateProvider.version()
        '1.1.0'
        ```


### `ADDRESS_PROVIDER`
!!! description "`CurveRateProvider.ADDRESS_PROVIDER() -> address: view`"

    Getter for the address provider contract. This variable is set when initializing the contract and cannot be changed afterward. Documentation for the address provider can be found [here](../integration/address-provider.md).

    Returns: address provider contract (`address`).

    ??? quote "Source code"

        === "CurveRateProvider.vy"

            ```vyper
            interface AddressProvider:
                def get_address(id: uint256) -> address: view

            ADDRESS_PROVIDER: public(immutable(AddressProvider))

            @external
            def __init__(address_provider: address):
                ADDRESS_PROVIDER = AddressProvider(address_provider)
            ```

    === "Example"

        ```shell
        >>> CurveRateProvider.ADDRESS_PROVIDER()
        '0x5ffe7FB82894076ECB99A30D6A32e969e6e35E98'
        ```
