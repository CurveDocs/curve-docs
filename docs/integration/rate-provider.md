<h1>CurveRateProvider.vy</h1>

The `CurveRateProvider` contract is designed to provide real-time quotes for token swaps. It fetches and returns exchange rates for specified token pairs. These quotes are only sourced from Curve AMM pools recognized by the `Metaregistry`. If, for some reason, a pool is not recognized by the `Metaregistry` contract, the `CurveRateProvider` won't include it.

!!!github "GitHub"
    The source code of the `CurveRateProvider.vy` can be found on [GitHub :material-github:](todo). The contract is currently deployed on Arbitrum at [`0xa46c7E424c749B4489f6Ac442323DC8E0583acB1`](https://arbiscan.io/address/0xa46c7E424c749B4489f6Ac442323DC8E0583acB1).


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
    - `pool_balances (DynArray[uint256, MAX_COINS])`: Token balances in the pool. This might include other tokens besides the source and destination tokens if the pool contains more than two coins.
    - `pool_type (uint8)`: Type of pool: `0 = Stableswap`, `1 = Cryptoswap`, `2 = LLAMMA`

    | Input               | Type      | Description                  |
    | ------------------- | --------- | ---------------------------- |
    | `source_token`      | `address` | Token to swap in.            |
    | `destination_token` | `address` | Token to swap out.           |
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

                pool_balances: DynArray[uint256, MAX_COINS]

                # 0 for stableswap, 1 for cryptoswap, 2 for LLAMMA.
                pool_type: uint8

            interface AddressProvider:
                def get_address(id: uint256) -> address: view

            interface Metaregistry:
                def find_pools_for_coins(source_coin: address, destination_coin: address) -> DynArray[address, 1000]: view
                def get_coin_indices(_pool: address, _from: address, _to: address) -> (int128, int128, bool): view
                def get_underlying_balances(_pool: address) -> uint256[MAX_COINS]: view
                def get_n_underlying_coins(_pool: address) -> uint256: view
                def get_underlying_decimals(_pool: address) -> uint256[MAX_COINS]: view

            ADDRESS_PROVIDER: public(immutable(AddressProvider))
            METAREGISTRY_ID: constant(uint256) = 7
            STABLESWAP_META_ABI: constant(String[64]) = "get_dy_underlying(int128,int128,uint256)"
            STABLESWA_ABI: constant(String[64]) = "get_dy(int128,int128,uint256)"
            CRYPTOSWAP_ABI: constant(String[64]) = "get_dy(uint256,uint256,uint256)"

            @external
            @view
            def get_quotes(source_token: address, destination_token: address, amount_in: uint256) -> DynArray[Quote, MAX_QUOTES]:

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

                    # if pool is too small, dont post call and skip pool:
                    if balances[i] <= amount_in:
                        continue

                    # convert to Dynamic Arrays:
                    dyn_balances: DynArray[uint256, MAX_COINS] = []
                    for bal in balances:
                        if bal > 0:
                            dyn_balances.append(bal)

                    # do a get_dy call and only save quote if call does not bork; use correct abi (in128 vs uint256)
                    success: bool = False
                    response: Bytes[32] = b""
                    if pool_type == 0 and is_underlying:
                        success, response = raw_call(
                        pool,
                        concat(
                            method_id(STABLESWAP_META_ABI),
                            convert(i, bytes32),
                            convert(j, bytes32),
                            convert(amount_in, bytes32),
                        ),
                        max_outsize=32,
                        revert_on_failure=False,
                        is_static_call=True
                    )
                    elif pool_type == 0 and not is_underlying:
                        success, response = raw_call(
                        pool,
                        concat(
                            method_id(STABLESWA_ABI),
                            convert(i, bytes32),
                            convert(j, bytes32),
                            convert(amount_in, bytes32),
                        ),
                        max_outsize=32,
                        revert_on_failure=False,
                        is_static_call=True
                    )
                    else:
                        success, response = raw_call(
                        pool,
                        concat(
                            method_id(CRYPTOSWAP_ABI),
                            convert(i, bytes32),
                            convert(j, bytes32),
                            convert(amount_in, bytes32),
                        ),
                        max_outsize=32,
                        revert_on_failure=False,
                        is_static_call=True
                    )

                    # check if get_dy works and if so, append quote to dynarray
                    if success:
                        quotes.append(
                            Quote(
                                {
                                    source_token_index: convert(i, uint256),
                                    dest_token_index: convert(j, uint256),
                                    is_underlying: is_underlying,
                                    amount_out: convert(response, uint256),
                                    pool: pool,
                                    pool_balances: dyn_balances,
                                    pool_type: pool_type
                                }
                            )
                        )
                    
                return quotes

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
        >>> CurveRateProvider.get_quotes('0x11cdb42b0eb46d95f990bedd4695a6e3fa034978', '0x75289388d50364c3013583d97bd70ced0e183e32', 10**18)
        [0, 1, false, 715266210565545458509, 0xB85246768Cfea42b0c935265Db798C9Ae457646f, 251981912908903038052460, 79868164306389315090776, 160502376869015231297140, 1]
        [0, 2, false, 720363244410635934003, 0x5C959D2c1a49B637Fb988c40d663265F8Bf6d289, 1160094807974595696565465, 1256830478323146416151673, 447584250494794848814622, 1]
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

    Getter for the address provider contract. This variable is set when initializing the contract and can not be changed after.

    Returns: contract (`address`).

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
