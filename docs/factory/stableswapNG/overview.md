The [StableSwap-NG](../../stableswap-exchange/stableswap-ng/overview.md) Factory allows the permissionless deployment of up to eight-coin pools, aswell as gauges. **Liquidity pool and LP token share the same contract.**

!!!deploy "Contract Source & Deployment"
    **Stableswap-NG Factory** contract is deployed to the Ethereum mainnet at: [0x6A8cbed756804B16E05E741eDaBd5cB544AE21bf](https://etherscan.io/address/0x6A8cbed756804B16E05E741eDaBd5cB544AE21bf#code).  
    Source code available on [Github](https://github.com/curvefi/stableswap-ng/blob/bff1522b30819b7b240af17ccfb72b0effbf6c47/contracts/main/CurveStableSwapFactoryNG.vy). A list of all deployments can be found [here](../../references/deployed-contracts.md#stableswap-ng).


## **Asset Types**

Stableswap-NG pool can contain different [asset types](../../stableswap-exchange/stableswap-ng/pools/overview.md#supported-assets). New asset types can be added via the **`add_asset_type`** function.

### `asset_types`
!!! description "`Factory.asset_types(arg0: uint8) -> String[20]`"

    Getter for the asset types.

    Returns: asset type (`String[20]`)

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `arg0` |  `uint8` | index value of the asset type |

    ??? quote "Source code"

        ```vyper
        asset_types: public(HashMap[uint8, String[20]])
        ```

    === "Example"

        ```shell
        >>> Factory.asset_types(2)
        'Rebasing'    
        ```


### `add_asset_type`
!!! description "`Factory.add_asset_type(_id: uint8, _name: String[10])`"

    !!!guard "Guarded Method"
        This function is only callable by the `admin` of the contract.

    Function to add a new asset type.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_id` |  `uint8` | asset type id |
    | `_name` |  `String[10]` | name of the new asset type |


    ??? quote "Source code"

        ```vyper
        asset_types: public(HashMap[uint8, String[20]])

        @external
        def add_asset_type(_id: uint8, _name: String[10]):
            """
            @notice Admin only method that adds a new asset type.
            @param _id asset type id.
            @param _name Name of the asset type.
            """
            assert msg.sender == self.admin  # dev: admin only
            self.asset_types[_id] = _name
        ```

    === "Example"

        ```shell
        >>> Factory.add_asset_type(4, "whatever")
        ```


## **Base Pools**

StableSwap pools allow the deployment of metapools (asset paried against a base pool; [more here](https://resources.curve.fi/lp/pools/?h=base)). When deploying a new Factory, the already existing base pools must manually be added to the contract in order to be used for metapools.

Limitations when adding new base pools:

- Rebasing tokens are not allowed in the base pool
- Do not add base pool which contains native tokens (e.g. ETH)
- As much as possible: use standard ERC20 tokens


### `add_base_pool`
!!! description "`Factory.add_base_pool(_base_pool: address, _base_lp_token: address, _asset_types: DynArray[uint8, MAX_COINS], _n_coins: uint256):`"

    !!!guard "Guarded Method"
        This function is only callable by the `admin` of the contract.

    Function to add a new base pool.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_base_pool` |  `address` | pool address to add as a basepool |
    | `_base_lp_token` |  `address` | lp token address of the pool |
    | `_asset_types` |  `DynArray[uint8, MAX_COINS]` | array of asset types of the pool |
    | `_n_coins` |  `uint256` | number of coins in the base pool |

    ??? quote "Source code"

        ```vyper
        @external
        def add_base_pool(
            _base_pool: address,
            _base_lp_token: address,
            _asset_types: DynArray[uint8, MAX_COINS],
            _n_coins: uint256,
        ):
            """
            @notice Add a base pool to the registry, which may be used in factory metapools
            @dev 1. Only callable by admin
                2. Rebasing tokens are not allowed in the base pool.
                3. Do not add base pool which contains native tokens (e.g. ETH).
                4. As much as possible: use standard ERC20 tokens.
                Should you choose to deviate from these recommendations, audits are advised.
            @param _base_pool Pool address to add
            @param _asset_types Asset type for pool, as an integer
            """
            assert msg.sender == self.admin  # dev: admin-only function
            assert 2 not in _asset_types  # dev: rebasing tokens cannot be in base pool
            assert len(self.base_pool_data[_base_pool].coins) == 0  # dev: pool exists
            assert _n_coins < MAX_COINS  # dev: base pool can only have (MAX_COINS - 1) coins.

            # add pool to pool_list
            length: uint256 = self.base_pool_count
            self.base_pool_list[length] = _base_pool
            self.base_pool_count = length + 1
            self.base_pool_data[_base_pool].lp_token = _base_lp_token
            self.base_pool_data[_base_pool].n_coins = _n_coins
            self.base_pool_data[_base_pool].asset_types = _asset_types

            decimals: uint256 = 0
            coins: DynArray[address, MAX_COINS] = empty(DynArray[address, MAX_COINS])
            coin: address = empty(address)
            for i in range(MAX_COINS):
                if i == _n_coins:
                    break
                coin = CurvePool(_base_pool).coins(i)
                assert coin != 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE  # dev: native token is not supported
                self.base_pool_data[_base_pool].coins.append(coin)
                self.base_pool_assets[coin] = True
                decimals += (ERC20(coin).decimals() << i*8)
            self.base_pool_data[_base_pool].decimals = decimals

            log BasePoolAdded(_base_pool)
        ```

    === "Example"

        ```shell
        >>> Factory.add_base_pool("whatever")
        ```


## **Implementations**

More on [implementations](./implementations.md). 