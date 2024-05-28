<h1>Curve Meta Registry</h1>

The MetaRegistry functions as a Curve Finance Pool Registry Aggregator and offers an on-chain API for various properties of Curve pools by **consolidating different registries into a single contract**.

For complete and detailed documentation on the MetaRegistry contract, please see [here :material-arrow-up-right:](../registry/overview.md).

For a list of all deployments, see [here](../references/deployed-contracts.md#meta-registry).

!!!warning "Requirements & Implementations"
    The MetaRegistry requires that all Factory contracts, which deploy pools and gauges, are added to the MetaRegistry. Without this, the MetaRegistry cannot retrieve specific information. To see which handlers and registries are added, see [Handlers and Registries](#handlers-and-registries).

    The newly deployed MetaRegistries on sidechains currently only pick up new-generation (NG) pools. Although earlier pools will be added as soon as possible, this requires some time as it involves quite a bit of manual work.


---


## **Handlers and Registries**

The MetaRegistry introduces `Handlers`, which are essentially wrappers around other contracts (mostly Pool Factories) to ensure ABI compatibility with the MetaRegistry itself.

New handlers can be added or existing ones can be updated by the `owner` of the contract.

*Helpful Functions in the `Curve Meta Registry`:*

- `get_registry_length`: Returns the total number of registries added.
- `get_registry`: Fetches single registries.
- `get_base_registry`: Returns the "base registry" of a handler.
- `get_registry_handlers_from_pool`: Fetches the handler from pools.


!!!colab "Google Colab Notebook"
    A Google Colab notebook showcasing how to query registries or add/update them can be found [here :material-arrow-up-right:](https://colab.research.google.com/drive/1wFvIeNKpKhy58xkGSfKw0XzEPnwn9Zym?usp=sharing).


*Currently integrated Base Registries and Handlers:*

| `Base Registry`                              | `Handler`                                     | `Description`                              |
| :------------------------------------------: | :-------------------------------------------: | :----------------------------------------: |
| [`0x90E00ACe148ca3b23Ac1bC8C240C2a7Dd9c2d7f5`](https://etherscan.io/address/0x90E00ACe148ca3b23Ac1bC8C240C2a7Dd9c2d7f5) | [`0x46a8a9CF4Fc8e99EC3A14558ACABC1D93A27de68`](https://etherscan.io/address/0x46a8a9CF4Fc8e99EC3A14558ACABC1D93A27de68)  | Oldschool Curve Registry                   |
| [`0xB9fC157394Af804a3578134A6585C0dc9cc990d4`](https://etherscan.io/address/0xB9fC157394Af804a3578134A6585C0dc9cc990d4) | [`0x127db66E7F0b16470Bec194d0f496F9Fa065d0A9`](https://etherscan.io/address/0x127db66E7F0b16470Bec194d0f496F9Fa065d0A9)  | Oldschool Curve Factory (Metapool Factory) |
| [`0x9a32aF1A11D9c937aEa61A3790C2983257eA8Bc0`](https://etherscan.io/address/0x9a32aF1A11D9c937aEa61A3790C2983257eA8Bc0) | [`0x5f493fEE8D67D3AE3bA730827B34126CFcA0ae94`](https://etherscan.io/address/0x5f493fEE8D67D3AE3bA730827B34126CFcA0ae94)  | Curve Cryptoswap Registry                  |
| [`0xF18056Bbd320E96A48e3Fbf8bC061322531aac99`](https://etherscan.io/address/0xF18056Bbd320E96A48e3Fbf8bC061322531aac99) | [`0xC4F389020002396143B863F6325aAa6ae481D19CE`](https://etherscan.io/address/0xC4F389020002396143B863F6325aAa6ae481D19CE) | Curve Factory (CryptoSwap)                 |
| [`0x4F8846Ae9380B90d2E71D5e3D042dff3E7ebb40d`](https://etherscan.io/address/0x4F8846Ae9380B90d2E71D5e3D042dff3E7ebb40d) | [`0x538E984C2d5f821d51932dd9C570Dff192D3DF2D`](https://etherscan.io/address/0x538E984C2d5f821d51932dd9C570Dff192D3DF2D)  | Curve Factory                              |
| [`0x0c0e5f2fF0ff18a3be9b835635039256dC4B4963`](https://etherscan.io/address/0x0c0e5f2fF0ff18a3be9b835635039256dC4B4963) | [`0x30a4249C42be05215b6063691949710592859697`](https://etherscan.io/address/0x30a4249C42be05215b6063691949710592859697)  | CurveTricryptoFactory                      |


---


## **Fetching Liquidity Pools**

Deployment of Curve pools is permissionless, leading to a significant number of pools being deployed. Managing this vast array of pools can be challenging, and relying solely on a UI may not be the most effective approach. The `Curve Meta Registry` serves as an ideal tool for querying specific pools directly from the blockchain.

!!!info "Understanding Base- and Metapool Logic"
    The `Meta Registry` considers metapools as well[^1]. For example, the [mkUSD/3CRV pool](https://etherscan.io/address/0x0CFe5C777A7438C9Dd8Add53ed671cEc7A5FAeE5) pairs mkUSD with the 3CRV LP Token, which consists of USDT, USDC, and DAI. The contract identifies this logic and returns this pool when querying for `find_pools_for_coins(mkUSD, USDC)`, because mkUSD and USDC can be exchanged through this pool.
    [^1]: Metapools are liquidity pools that pair a token against the LP token of another pool.


*Key Methods for Querying Pools:*

- `find_pools_for_coins`: This method returns a list of all pools containing two specific tokens, e.g. pools that include both `crvUSD` and `USDC`.
- `find_pool_for_coins`: Returns a single pool according to the input index from the list returned by `find_pools_for_coins`.


!!!colab "Google Colab Notebook"
    A Jupyter notebook showcasing how to fetch pools directly from the blockchain, which contain two specific assets, can be found [:logos-googlecolab: here](https://colab.research.google.com/drive/1QsxqxQu7Um8gYPda30304W8ZcYbnbr1b?usp=sharing).