**The StableSwap Factory utilizes the `create_forwarder_to` function to deploy its contracts from the implementations.**

!!!warning
    **Implementation contracts are upgradable.** They can either be replaced, or additional implementation contracts can be added. Therefore, please always make sure to check the most recent ones.

It utilizes three different implementations: 

- **`metapool_implementations`**, containing multiple contracts that are used to deploy metapools.
- **`plain_implementations`**, containing multiple contracts that are used to deploy plain pools.
- **`gauge_implementation`**, containing a contract which is used when deploying liquidity gauges for pools.


## **Query Implementations**

### `metapool_implementations`
!!! description "`Factory.metapool_implementations(_base_pool: address) -> address[10]:`"

    Getter for a list of implementation contracts for metapools targetting `_base_pool`.

    Returns: metapool implementation contracts (`address[10]`).

    | Input        | Type      | Description |
    | ------------ | --------- | ----------- |
    | `_base_pool` | `address` | Base pool   |


    ??? quote "Source code"

        ```vyper
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
        >>> Factory.metapool_implementation('0xbebc44782c7db0a1a60cb6fe97d0b483032ff1c7')
        '[[0x213be373FDff327658139C7df330817DAD2d5bBE]
        [0x55Aa9BF126bCABF0bDC17Fa9E39Ec9239e1ce7A9]
        [0x0000000000000000000000000000000000000000]
        [0x0000000000000000000000000000000000000000]
        [0x0000000000000000000000000000000000000000]
        [0x0000000000000000000000000000000000000000]
        [0x0000000000000000000000000000000000000000]
        [0x0000000000000000000000000000000000000000]
        [0x0000000000000000000000000000000000000000]
        [0x0000000000000000000000000000000000000000]]'
        ```


### `plain_implementations`
!!! description "`Factory.plain_implementations(arg0: uint256, arg1: uint256) -> address: view`"

    Getter for the plain implementations index `arg1` for a plain pool with a number of `arg0` coins.

    Returns: Plain implementation (`address`).

    | Input    | Type      | Description                |
    | -------- | --------- | -------------------------- |
    | `arg0`   | `uint256` | Number of coins in pool    |
    | `arg1`   | `uint256` | Index of implementation    |


    ??? quote "Source code"

        ```vyper
        # number of coins -> implementation addresses
        # for "plain pools" (as opposed to metapools), implementation contracts
        # are organized according to the number of coins in the pool
        plain_implementations: public(HashMap[uint256, address[10]])
        ```

    === "Example"

        ```shell
        >>> Factory.plain_implementations(2, 0)
        '0x6523Ac15EC152Cb70a334230F6c5d62C5Bd963f1'
        ```


### `gauge_implementation`
!!! description "`Factory.gauge_implementations() -> address: view`"

    Getter for the gauge implementation of the Factory.

    Returns: gauge implementation (`address`).

    ??? quote "Source code"

        ```vyper
        gauge_implementation: public(address)
        ```

    === "Example"

        ```shell
        >>> Factory.gauge_implementation()
        '0x5aE854b098727a9f1603A1E21c50D52DC834D846'
        ```


### `get_implementation_address`
!!! description "`Factory.get_implementation_address(_pool: address) -> address:`"

    Getter for the address of the implementation contract used for a factory pool.

    Returns: Implementation (`address`).

    | Input    | Type      | Description              |
    | -------- | --------- | ------------------------ |
    | `_pool`  | `address` | Factory pool address     |


    ??? quote "Source code"

        ```vyper
        @view
        @external
        def get_implementation_address(_pool: address) -> address:
            """
            @notice Get the address of the implementation contract used for a factory pool
            @param _pool Pool address
            @return Implementation contract address
            """
            return self.pool_data[_pool].implementation
        ```

    === "Example"

        ```shell
        >>> Factory.gauge_implementation()
        '0x5aE854b098727a9f1603A1E21c50D52DC834D846'
        ```


## **Set New Implementation**

*New implementations can be set via these admin-only functions:*

### `set_metapool_implementation`
!!! description "`Factory.set_metapool_implementations(_base_pool: address, _implementations: address[10]):`"

    !!!guard "Guarded Method"
        This function is only callable by the `admin` of the contract.

    Function to set new metapool implementations.

    | Input               | Type            | Description                          |
    | ------------------- | --------------- | ------------------------------------ |
    | `_base_pool`        | `address`       | Base pool to add implementations for |
    | `_implementations`  | `address[10]`   | New metapool implementations         |


    ??? quote "Source code"

        ```vyper
        base_pool_data: HashMap[address, BasePoolArray]

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
        >>> Factory.set_metapool_implementation("todo")
        'todo'
        ```


### `set_plain_implementation`
!!! description "`Factory.set_plain_implementations(_n_coins: uint256, _implementations: address[10]):`"

    !!!guard "Guarded Method"
        This function is only callable by the `admin` of the contract.

    Function to set new plain pool implementations.

    | Input                  | Type       | Description                                   |
    | ---------------------- | ---------- | --------------------------------------------- |
    | `_n_coins`             | `uint256`  | Number of coins in pool to set implementations for |
    | `_pool_implementation` | `address`  | New plain pool implementations                |

    ??? quote "Source code"

        ```vyper
        # number of coins -> implementation addresses
        # for "plain pools" (as opposed to metapools), implementation contracts
        # are organized according to the number of coins in the pool
        plain_implementations: public(HashMap[uint256, address[10]])

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
        >>> Factory.set_plain_implementation("todo")
        'todo'
        ```


### `set_gauge_implementation`
!!! description "`Factory.set_gauge_implementation(_gauge_implementation: address):`"

    !!!guard "Guarded Method"
        This function is only callable by the `admin` of the contract.

    Function to set a new gauge implementation contract.

    | Input                   | Type      | Description                |
    | ----------------------- | --------- | -------------------------- |
    | `_gauge_implementation` | `address` | New gauge implementation   |

    ??? quote "Source code"

        ```vyper
        gauge_implementation: public(address)

        @external
        def set_gauge_implementation(_gauge_implementation: address):
            assert msg.sender == self.admin  # dev: admin-only function

            self.gauge_implementation = _gauge_implementation
        ```

    === "Example"
        ```shell
        >>> Factory.set_gauge_implementation("todo")
        'todo'
        ```