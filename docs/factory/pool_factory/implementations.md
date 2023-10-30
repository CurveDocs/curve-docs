


TODO:

- fix spelling and grammar


Factories utilize implementation contracts to create the pools.

This is a try to document all avaliable implementations:




## Metapool Factory 


### Metapool Implementations


Metapool can have different implementations depending on the paired token and base pool.

| Basepool | Implementation Address  | Description |
| ----- | ----------------------- | ----------- |
| 0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7 | [0x213be373FDff327658139C7df330817DAD2d5bBE](https://etherscan.io/address/0x213be373FDff327658139C7df330817DAD2d5bBE) | standard  |
|  | [0x55Aa9BF126bCABF0bDC17Fa9E39Ec9239e1ce7A9](https://etherscan.io/address/0x55Aa9BF126bCABF0bDC17Fa9E39Ec9239e1ce7A9) | support for positive-rebasing and fee-on-transfer tokens |
| 0x7fC77b5c7614E1533320Ea6DDc2Eb61fa00A9714 | [0xC6A8466d128Fbfd34AdA64a9FFFce325D57C9a52](https://etherscan.io/address/0xC6A8466d128Fbfd34AdA64a9FFFce325D57C9a52) | standard |
|  | [0xc4C78b08fA0c3d0a312605634461A88184Ecd630](https://etherscan.io/address/0xc4C78b08fA0c3d0a312605634461A88184Ecd630) | support for positive-rebasing and fee-on-transfer tokens |
| 0x93054188d876f558f4a66B2EF1d97d16eDf0895B | [0xECAaecd9d2193900b424774133B1f51ae0F29d9E](https://etherscan.io/address/0xECAaecd9d2193900b424774133B1f51ae0F29d9E) | standard |
|  | [0x40fD58D44cFE63E8517c9Bb3ac98676838Ea56A8](https://etherscan.io/address/0x40fD58D44cFE63E8517c9Bb3ac98676838Ea56A8) | support for positive-rebasing and fee-on-transfer tokens |
| 0xDcEF968d416a41Cdac0ED8702fAC8128A64241A2 | [0x33bB0e62d5e8C688E645Dd46DFb48Cd613250067](https://etherscan.io/address/0x33bB0e62d5e8C688E645Dd46DFb48Cd613250067) | standard |
|  | [0x2EB24483Ef551dA247ab87Cf18e1Cc980073032D](https://etherscan.io/address/0x2EB24483Ef551dA247ab87Cf18e1Cc980073032D) | support for positive-rebasing and fee-on-transfer tokens |
| 0xf253f83AcA21aAbD2A20553AE0BF7F65C755A07F | [0x008CFa89df5B0c780cA3462fc2602D7F8c7Ac315](https://etherscan.io/address/0x008CFa89df5B0c780cA3462fc2602D7F8c7Ac315) | standard |
|  | [0xAbc533EbCDdeD41215C46ee078C5818B5b0A252F](https://etherscan.io/address/0xAbc533EbCDdeD41215C46ee078C5818B5b0A252F) | support for positive-rebasing and fee-on-transfer tokens |



### `metapool_implementations`
!!! description "`Factory.metapool_implementations(_base_pool: address) -> address[10]:`"

    Getter for the pool implementations of `_base_pool`.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_base_pool` |  `uint256` | basepool to query its implementations |

    ??? quote "Source code"

        ```python hl_lines="1 5 12"
        base_pool_data: HashMap[address, BasePoolArray]

        @view
        @external
        def metapool_implementations(_base_pool: address) -> address[10]:
            """
            @notice Get a list of implementation contracts for metapools targetting the given base pool
            @dev A base pool is the pool for the LP token contained within the metapool
            @param _base_pool Address of the base pool
            @return List of implementation contract addresses
            """
            return self.base_pool_data[_base_pool].implementations
        ```

    === "Example"

        ```shell
        >>> Factory.metapool_implementations("0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7"):
        [[0x213be373FDff327658139C7df330817DAD2d5bBE]
        [0x55Aa9BF126bCABF0bDC17Fa9E39Ec9239e1ce7A9]
        [0x0000000000000000000000000000000000000000]
        [0x0000000000000000000000000000000000000000]
        [0x0000000000000000000000000000000000000000]
        [0x0000000000000000000000000000000000000000]
        [0x0000000000000000000000000000000000000000]
        [0x0000000000000000000000000000000000000000]
        [0x0000000000000000000000000000000000000000]
        [0x0000000000000000000000000000000000000000]]
        ```


### `set_metapool_implementations`
!!! description "`Factory.set_metapool_implementations(_base_pool: address, _implementations: address[10]):`"

    !!!guard "Guarded Method"
        This function is only callable by the `admin` of the contract.

    Function to set a new implementations for `_base_pool`. Up to 10 implementations can be set.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_base_pool` |  `address` | basepool to add implementations for |
    | `_implementations` |  `address[10]` | implementations |

    ??? quote "Source code"

        ```python hl_lines="2"
        @external
        def set_metapool_implementations(
            _base_pool: address,
            _implementations: address[10],
        ):
            """
            @notice Set implementation contracts for a metapool
            @dev Only callable by admin
            @param _base_pool Pool address to add
            @param _implementations Implementation address to use when deploying metapools
            """
            assert msg.sender == self.admin  # dev: admin-only function
            assert self.base_pool_data[_base_pool].coins[0] != ZERO_ADDRESS  # dev: base pool does not exist

            for i in range(10):
                new_imp: address = _implementations[i]
                current_imp: address = self.base_pool_data[_base_pool].implementations[i]
                if new_imp == current_imp:
                    if new_imp == ZERO_ADDRESS:
                        break
                else:
                    self.base_pool_data[_base_pool].implementations[i] = new_imp
        ```

    === "Example"

        ```shell
        >>> Factory.set_metapool_implementations(_base_pool: address, _implementations: address[10]):
        ```




### Plainpool Implementations

Plain pool implementations:

| n coins | implementation index | Implementation Address  | Description |
| ------- | -------------------- | ----------------------- | ----------- |
| 2 | 0 |[0x6523Ac15EC152Cb70a334230F6c5d62C5Bd963f1](https://etherscan.io/address/0x6523Ac15EC152Cb70a334230F6c5d62C5Bd963f1) | |
| - | 1 |[0x24D937143d3F5cF04c72bA112735151A8CAE2262](https://etherscan.io/address/0x24D937143d3F5cF04c72bA112735151A8CAE2262) | |
| - | 2 |[0x6326DEbBAa15bCFE603d831e7D75f4fc10d9B43E](https://etherscan.io/address/0x6326DEbBAa15bCFE603d831e7D75f4fc10d9B43E) | |
| - | 3 |[0x4A4d7868390EF5CaC51cDA262888f34bD3025C3F](https://etherscan.io/address/0x4A4d7868390EF5CaC51cDA262888f34bD3025C3F) | |
| - | 4 |[0xc629a01eC23AB04E1050500A3717A2a5c0701497](https://etherscan.io/address/0xc629a01eC23AB04E1050500A3717A2a5c0701497) | |
| - | 5 |[0x847ee1227A9900B73aEeb3a47fAc92c52FD54ed9](https://etherscan.io/address/0x847ee1227A9900B73aEeb3a47fAc92c52FD54ed9) | |

| n coins | implementation index | Implementation Address  | Description |
| ------- | -------------------- | ----------------------- | ----------- |
| 3 | 0 |[0x9B52F13DF69D79Ec5aAB6D1aCe3157d29B409cC3](https://etherscan.io/address/0x9B52F13DF69D79Ec5aAB6D1aCe3157d29B409cC3) | |
| - | 1 |[0x50b085f2e5958C4A87baf93A8AB79F6bec068494](https://etherscan.io/address/0x50b085f2e5958C4A87baf93A8AB79F6bec068494) | |
| - | 2 |[0x8c1aB78601c259E1B43F19816923609dC7d7de9B](https://etherscan.io/address/0x8c1aB78601c259E1B43F19816923609dC7d7de9B) | |
| - | 3 |[0xE5F4b89E0A16578B3e0e7581327BDb4C712E44De](https://etherscan.io/address/0xE5F4b89E0A16578B3e0e7581327BDb4C712E44De) | |

| n coins | implementation index | Implementation Address  | Description |
| ------- | -------------------- | ----------------------- | ----------- |
| 4 | 0 |[0x5Bd47eA4494e0F8DE6e3Ca10F1c05F55b72466B8](https://etherscan.io/address/0x5Bd47eA4494e0F8DE6e3Ca10F1c05F55b72466B8) | |
| - | 1 |[0xd35B58386705CE75CE6d09842E38E9BE9CDe5bF6](https://etherscan.io/address/0xd35B58386705CE75CE6d09842E38E9BE9CDe5bF6) | |
| - | 2 |[0x88855cdF2b0A8413D470B86952E726684de915be](https://etherscan.io/address/0x88855cdF2b0A8413D470B86952E726684de915be) | |
| - | 3 |[0xaD4753D045D3Aed5C1a6606dFb6a7D7AD67C1Ad7](https://etherscan.io/address/0xaD4753D045D3Aed5C1a6606dFb6a7D7AD67C1Ad7) | |





### `set_plain_implementations`
!!! description "`Factory.set_plain_implementations(_n_coins: uint256,_implementations: address[10]):`"

    !!!guard "Guarded Method"
        This function is only callable by the `admin` of the contract.

    Function to set new plain implementations for `_n_coins`.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_n_coins` |  `uint256` | number of coins in the pool |
    | `_implementations` |  `address[10]` | implementations  |

    ??? quote "Source code"

        ```python hl_lines="2"
        @external
        def set_plain_implementations(
            _n_coins: uint256,
            _implementations: address[10],
        ):
            assert msg.sender == self.admin  # dev: admin-only function

            for i in range(10):
                new_imp: address = _implementations[i]
                current_imp: address = self.plain_implementations[_n_coins][i]
                if new_imp == current_imp:
                    if new_imp == ZERO_ADDRESS:
                        break
                else:
                    self.plain_implementations[_n_coins][i] = new_imp
        ```

    === "Example"

        ```shell
        >>> Factory.set_plain_implementations(_n_coins: uint256, _implementations: address[10]):

        ```


## crvUSD pool Facotry




## Cryptoswap Factory

| Index | Implementation Address  | Description |
| ----- | ----------------------- | ----------- |
| - | [0xa85461AFc2DEEC01bDA23b5cd267d51F765fba10](https://etherscan.io/address/0xa85461AFc2DEEC01bDA23b5cd267d51F765fba10) | standart cryptoswap implementation |




## Tricrypto Factory

| Index | Implementation Address  | Description |
| ----- | ----------------------- | ----------- |
| 0 | [0x66442B0C5260B92cAa9c234ECf2408CBf6b19a6f](https://etherscan.io/address/0x66442B0C5260B92cAa9c234ECf2408CBf6b19a6f) | standart tricrypto implementation |
