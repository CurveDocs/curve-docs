<h1>Pool Factory: Overview</h1>

The TriCrypto-NG Factory allows the permissionless deployment of two-coin volatile asset pools, as well as gauges. **The liquidity pool and LP token share the same contract.**

Additionally, the Factory contract is the direct admin and fee receiver of all pools. In turn, the Factory is controlled by the CurveDAO. 

!!!deploy "Contract Source & Deployment"
    Source code for this contract is available on [Github](https://github.com/curvefi/tricrypto-ng/blob/main/contracts/main/CurveTricryptoFactory.vy).  
    A list of all deployed contracts can be found [here](../../references/deployed-contracts.md#pool-factory).




---


## **Implementations**
 
**The Tricrypto-NG Factory makes use of blueprint contracts to deploy its contracts from the implementations.**

!!!warning
    **Implementation contracts are upgradable.** They can either be replaced, or additional implementation contracts can be added. Therefore, please always make sure to check the most recent ones.

It utilizes four different implementations:

- `pool_implementations`, containing multiple blueprint contracts that are used to deploy the pools.
- `gauge_implementation`, containing a blueprint contract that is used when deploying gauges for pools.
- `views_implementation`, containing a view methods contract relevant for integrators and users looking to interact with the AMMs.
- `math_implementation`, containing math functions used in the AMM.

*More on the [**Math Implementation**](../../cryptoswap-exchange/tricrypto-ng/utility-contracts/math.md) and [**Views Implementation**](../../cryptoswap-exchange/tricrypto-ng/utility-contracts/views.md).* 


## **Query Implementations**

### `pool_implementation`
!!! description "`Factory.pool_implementations(arg0: uint256) -> address: view`"

    Getter for the current pool implementation contract. This accounts for variations such as two-coin and three-pool pools.

    Returns: Pool blueprint contract (`address`).

    | Input   | Type      | Description   |
    | ------- | --------- | ------------- |
    | `arg0`  | `uint256` | Index         |


    ??? quote "Source code"

        ```vyper
        pool_implementations: public(HashMap[uint256, address])
        ```

    === "Example"

        ```shell
        >>> Factory.pool_implementation(0)
        '0x66442B0C5260B92cAa9c234ECf2408CBf6b19a6f'
        ```


### `gauge_implementation`
!!! description "`Factory.gauge_implementation() -> address: view`"

    Getter for the current gauge implementation contract.

    Returns: Gauge blueprint contract (`address`).

    ??? quote "Source code"

        ```vyper
        gauge_implementation: public(address)
        ```

    === "Example"

        ```shell
        >>> Factory.gauge_implementation()
        '0x5fC124a161d888893529f67580ef94C2784e9233'
        ```


### `views_implementation`
!!! description "`Factory.views_implementation() -> address: view`"

    Getter for the current views implementation contract.

    Returns: Views blueprint contract (`address`).

    ??? quote "Source code"

        ```vyper
        views_implementation: public(address)
        ```

    === "Example"

        ```shell
        >>> Factory.views_implementation()
        '0x064253915b8449fdEFac2c4A74aA9fdF56691a31'
        ```


### `math_implementation`
!!! description "`Factory.math_implementation() -> address: view`"

    Getter for the current pool implementation contract.

    Returns: Math blueprint contract (`address`).

    ??? quote "Source code"

        ```vyper
        math_implementation: public(address)
        ```

    === "Example"

        ```shell
        >>> Factory.math_implementation()
        '0xcBFf3004a20dBfE2731543AA38599A526e0fD6eE'
        ```



## **Set New Implementations** 

*New implementations can be set via these admin-only functions:*

### `set_pool_implementation`
!!! description "`Factory.set_pool_implementation(_pool_implementation: address, _implementation_index: uint256):`"

    !!!guard "Guarded Method"
        This function is only callable by the `admin` of the contract.

    Function to set a `_pool_implementation` for `_implementation_index`. 

    Emits event: `UpdatePoolImplementation`

    | Input                   | Type      | Description               |
    | ----------------------- | --------- | ------------------------- |
    | `_pool_implementation`  | `address` | New pool implementation   |
    | `_implementation_index` | `uint256` | Index                     |


    ??? quote "Source code"

        ```vyper
        event UpdatePoolImplementation:
            _implemention_id: uint256
            _old_pool_implementation: address
            _new_pool_implementation: address

        pool_implementations: public(HashMap[uint256, address])

        @external
        def set_pool_implementation(
            _pool_implementation: address, _implementation_index: uint256
        ):
            """
            @notice Set pool implementation
            @dev Set to empty(address) to prevent deployment of new pools
            @param _pool_implementation Address of the new pool implementation
            @param _implementation_index Index of the pool implementation
            """
            assert msg.sender == self.admin, "dev: admin only"

            log UpdatePoolImplementation(
                _implementation_index,
                self.pool_implementations[_implementation_index],
                _pool_implementation
            )

            self.pool_implementations[_implementation_index] = _pool_implementation
        ```

    === "Example"
        ```shell
        >>> Factory.set_pool_implementation("todo")
        'todo'
        ```


### `set_gauge_implementation`
!!! description "`Factory.set_gauge_implementation(_gauge_implementation: address):`"

    !!!guard "Guarded Method"
        This function is only callable by the `admin` of the contract.

    Function to set a new `_gauge_implementation`.

    Emits event: `UpdateGaugeImplementation`

    | Input                    | Type      | Description               |
    | ------------------------ | --------- | ------------------------- |
    | `_gauge_implementation`  | `address` | Gauge blueprint contract  |

    ??? quote "Source code"

        ```vyper
        event UpdateGaugeImplementation:
            _old_gauge_implementation: address
            _new_gauge_implementation: address

        gauge_implementation: public(address)

        @external
        def set_gauge_implementation(_gauge_implementation: address):
            """
            @notice Set gauge implementation
            @dev Set to empty(address) to prevent deployment of new gauges
            @param _gauge_implementation Address of the new token implementation
            """
            assert msg.sender == self.admin, "dev: admin only"

            log UpdateGaugeImplementation(self.gauge_implementation, _gauge_implementation)
            self.gauge_implementation = _gauge_implementation
        ```

    === "Example"
        ```shell
        >>> Factory.set_gauge_implementation("todo")
        'todo'
        ```


### `set_views_implementation`
!!! description "`Factory.set_views_implementation(_views_implementation: address):`"

    !!!guard "Guarded Method"
        This function is only callable by the `admin` of the contract.

    Function to set a new `_views_implementation`.

    Emits event: `UpdateViewsImplementation`

    | Input                     | Type      | Description              |
    | ------------------------- | --------- | ------------------------ |
    | `_views_implementation`   | `address` | Views blueprint contract |

    ??? quote "Source code"

        ```vyper
        event UpdateViewsImplementation:
            _old_views_implementation: address
            _new_views_implementation: address

        views_implementation: public(address)

        @external
        def set_views_implementation(_views_implementation: address):
            """
            @notice Set views contract implementation
            @param _views_implementation Address of the new views contract
            """
            assert msg.sender == self.admin,  "dev: admin only"

            log UpdateViewsImplementation(self.views_implementation, _views_implementation)
            self.views_implementation = _views_implementation
        ```

    === "Example"
        ```shell
        >>> Factory.set_views_implementation("todo")
        'todo'
        ```


### `set_math_implementation`
!!! description "`Factory.set_math_implementation(_math_implementation: address):`"

    !!!guard "Guarded Method"
        This function is only callable by the `admin` of the contract.

    Function to set a new `_math_implementation`.

    Emits event: `UpdateMathImplementation`

    | Input                    | Type      | Description              |
    | ------------------------ | --------- | ------------------------ |
    | `_math_implementation`   | `address` | Math blueprint contract  |

    ??? quote "Source code"

        ```vyper
        event UpdateMathImplementation:
            _old_math_implementation: address
            _new_math_implementation: address

        math_implementation: public(address)

        @external
        def set_math_implementation(_math_implementation: address):
            """
            @notice Set math implementation
            @param _math_implementation Address of the new math contract
            """
            assert msg.sender == self.admin, "dev: admin only"

            log UpdateMathImplementation(self.math_implementation, _math_implementation)
            self.math_implementation = _math_implementation
        ```

    === "Example"
        ```shell
        >>> Factory.set_math_implementation("todo")
        'todo'
        ```
    

---


## **Fee Receiver**


### `fee_receiver`
!!! description "`Factory.fee_receiver() -> address: view`"

    Getter for the fee receiver.

    Returns: fee receiver (`address`).

    ??? quote "Source code"

        === "CurveTwocryptoFactory.vy"

            ```vyper
            fee_receiver: public(address)
            ```
    
    === "Example"

        ```shell
        >>> Factory.fee_receiver()
        '0xeCb456EA5365865EbAb8a2661B0c503410e9B347'
        ```


### `set_fee_receiver`
!!! description "`Factory.set_fee_receiver(_fee_receiver: address):`"

    !!!guard "Guarded Method"
        This function is only callable by the `admin` of the contract.

    Function to set a new `fee_receiver` address.

    Emits event: `UpdateFeeReceiver`

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_fee_receiver` |  `address` | new fee receiver address |

    ??? quote "Source code"

        ```vyper
        event UpdateFeeReceiver:
            _old_fee_receiver: address
            _new_fee_receiver: address

        admin: public(address) 
        fee_receiver: public(address)

        @external
        def set_fee_receiver(_fee_receiver: address):
            """
            @notice Set fee receiver
            @param _fee_receiver Address that fees are sent to
            """
            assert msg.sender == self.admin, "dev: admin only"

            log UpdateFeeReceiver(self.fee_receiver, _fee_receiver)
            self.fee_receiver = _fee_receiver
        ```

    === "Example"
        ```shell
        >>> Factory.set_fee_receiver("todo")
        'todo'
        ```