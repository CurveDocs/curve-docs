<h1>Pool Factory: Overview</h1>


The TwoCrypto-NG Factory allows the permissionless deployment of two-coin volatile asset pools, as well as gauges. **The liquidity pool and LP token share the same contract.**

!!!deploy "Contract Source & Deployment"
    Source code for the Factory is available on [Github](https://github.com/curvefi/twocrypto-ng/blob/main/contracts/main/CurveTwocryptoFactory.vy). 
    A full list of all deployments can be found [here](../../../references/deployed-contracts.md#twocrypto-ng).

## **Implementations**

The TwoCrypto-NG Factory makes use of **blueprint contracts** ([EIP-5202](https://eips.ethereum.org/EIPS/eip-5202)) to deploy liquidity pools and gauges.

!!!warning
    **Implementation contracts are upgradable.** They can either be replaced, or additional implementation contracts can be added. Therefore, always make sure to check the most recent ones.

It utilizes four different implementations:

- **`pool_implementations`**, containing multiple blueprint contracts that are used to deploy the pools.
- **`gauge_implementation`**, containing a blueprint contract that is used when deploying gauges for pools. This is only available on Ethereum Mainnet.
- **`views_implementation`**, containing a view methods contract relevant for integrators and users looking to interact with the AMMs.
- **`math_implementation`**, containing math functions used in the AMM.

*More on the [**Math Implementation**](../../twocrypto-ng/utility_contracts/math.md) and [**Views Implementation**](../../twocrypto-ng/utility_contracts/views.md).*


## **Query Implementations**
 
### `pool_implementations`
!!! description "`Factory.pool_implementations(arg0: uint256) -> address: view`"

    Getter for the pool implementation at index `arg0`.

    Returns: Pool implementation (`address`).

    | Input  | Type      | Description                |
    | ------ | --------- | -------------------------- |
    | `arg0` | `uint256` | Index of pool implementation |

    ??? quote "Source code"

        === "CurveTwocryptoFactory.vy"

            ```vyper
            pool_implementations: public(HashMap[uint256, address])
            ```
    
    === "Example"

        ```shell
        >>> Factory.pool_implementations(0)
        '0x04Fd6beC7D45EFA99a27D29FB94b55c56dD07223'
        ```


### `gauge_implementation`
!!! description "`Factory.gauge_implementation() -> address: view`"

    Getter for the current gauge implementation. Only Ethereum mainnet has a valid gauge implementation; on other chains, the implementation is set to `ZERO_ADDRESS`, as sidechain gauges need to be deployed via the [`RootChainGaugeFactory`](../../../curve_dao/liquidity-gauge-and-minting-crv/evm-sidechains/RootChainGaugeFactory.md).

    Returns: Gauge implementation (`address`).

    ??? quote "Source code"

        === "CurveTwocryptoFactory.vy"

            ```vyper
            gauge_implementation: public(address)
            ```
    
    === "Example"

        ```shell
        >>> Factory.gauge_implementation()
        '0x38D9BdA812da2C68dFC6aDE85A7F7a54E77F8325'
        ```


### `views_implementation`
!!! description "`Factory.views_implementation() -> address: view`"

    Getter for the current views contract implementation.

    Returns: Views contract implementation (`address`).

    ??? quote "Source code"

        === "CurveTwocryptoFactory.vy"

            ```vyper
            views_implementation: public(address)
            ```
    
    === "Example"

        ```shell
        >>> Factory.views_implementation()
        '0x07CdEBF81977E111B08C126DEFA07818d0045b80'
        ```


### `math_implementation`
!!! description "`Factory.math_implementation() -> address: view`"

    Getter for the current math contract implementation.

    Returns: Math contract implementation (`address`).

    ??? quote "Source code"

        === "CurveTwocryptoFactory.vy"

            ```vyper
            math_implementation: public(address)
            ```
    
    === "Example"

        ```shell
        >>> Factory.math_implementation()
        '0x2005995a71243be9FB995DaB4742327dc76564Df'
        ```



## **Set New Implementations** 

*New implementations can be set via the following admin-only functions:*


### `set_pool_implementation`
!!! description "`Factory.set_pool_implementation(_pool_implementation: address, _implementation_index: uint256):`"

    !!!guard "Guarded Method"
        This function is only callable by the `admin` of the contract.

    Function to set a new pool implementation at a certain index. The Factory allows multiple pool implementations as some pools might require a different one.

    Emits: `UpdatePoolImplementation`

    | Input                    | Type      | Description                   |
    | ------------------------ | --------- | ----------------------------- |
    | `_pool_implementation`   | `address` | New pool implementation       |
    | `_implementation_index`  | `uint256` | Index for the implementation  |

    ??? quote "Source code"

        === "CurveTwocryptoFactory.vy"

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
        >>> Factory.set_pool_implementation("0x0000000000000000000000000000000000000000", 1)
        ```


### `set_gauge_implementation`
!!! description "`Factory.set_gauge_implementation(_gauge_implementation: address):`"

    !!!guard "Guarded Method"
        This function is only callable by the `admin` of the contract.

    Function to set a new gauge implementation (blueprint contract). This implementation is only available on Ethereum mainnet. To deploy a gauge on a sidechain, this needs to be done through the [`RootChainGaugeFactory`](../../../curve_dao/liquidity-gauge-and-minting-crv/evm-sidechains/RootChainGaugeFactory.md).

    Emits: `UpdateGaugeImplementation`

    | Input                      | Type      | Description                |
    | -------------------------- | --------- | -------------------------- |
    | `_gauge_implementation`    | `address` | New gauge implementation   |

    ??? quote "Source code"

        === "CurveTwocryptoFactory.vy"

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
        >>> Factory.set_gauge_implementation("0x0000000000000000000000000000000000000000")
        ```


### `set_views_implementation`
!!! description "`Factory.set_views_implementation(_views_implementation: address):`"

    !!!guard "Guarded Method"
        This function is only callable by the `admin` of the contract.

    Function to set a new views contract.

    Emits: `UpdateViewsImplementation`

    | Input                   | Type      | Description                            |
    | ----------------------- | --------- | -------------------------------------- |
    | `_views_implementation` | `address` | New views contract implementation      |


    ??? quote "Source code"

        === "CurveTwocryptoFactory.vy"

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
        >>> Factory.set_views_implementation("0x0000000000000000000000000000000000000000")
        ```


### `set_math_implementation`
!!! description "`Factory.set_math_implementation(_math_implementation: address):`"

    !!!guard "Guarded Method"
        This function is only callable by the `admin` of the contract.

    Function to set a new math contract.

    Emits: `UpdateMathImplementation`

    | Input                   | Type      | Description                          |
    | ----------------------- | --------- | ------------------------------------ |
    | `_math_implementation`  | `address` | New math contract implementation     |

    ??? quote "Source code"

        === "CurveTwocryptoFactory.vy"

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
        >>> Factory.set_math_implementation("0x0000000000000000000000000000000000000000")
        ```


## **Fee Receiver**

### `fee_receiver`
!!! description "`Factory.fee_receiver() -> address: view`"

    Getter for the fee receiver address of the admin fee. The fee receiver is initially set by calling the `initialize_ownership` function. It can later be changed via the `set_fee_receiver` method.

    Returns: Fee receiver (`address`).

    ??? quote "Source code"

        === "CurveTwocryptoFactory.vy"

            ```vyper
            fee_receiver: public(address)

            @external
            def initialise_ownership(_fee_receiver: address, _admin: address):

                assert msg.sender == self.deployer
                assert self.admin == empty(address)

                self.fee_receiver = _fee_receiver
                self.admin = _admin

                log UpdateFeeReceiver(empty(address), _fee_receiver)
                log TransferOwnership(empty(address), _admin)
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

    Function to set a new fee receiver address.

    Emits: `UpdateFeeReceiver`

    | Input              | Type      | Description                  |
    | ------------------ | --------- | ---------------------------- |
    | `_fee_receiver`    | `uint256` | New fee receiver address     |

    ??? quote "Source code"

        === "CurveTwocryptoFactory.vy"

            ```vyper
            event UpdateFeeReceiver:
                _old_fee_receiver: address
                _new_fee_receiver: address

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
        >>> Factory.set_fee_receiver("0x0000000000000000000000000000000000000000")
        ```


## **Contract Ownership**

Contract ownership can be transfered via the following methods:

### `admin`
!!! description "`Factory.admin() -> address: view`"

    Getter for the current admin of the Factory.

    Returns: Admin (`address`).

    ??? quote "Source code"

        === "CurveTwocryptoFactory.vy"

            ```vyper
            admin: public(address)
            ```
    
    === "Example"

        ```shell
        >>> Factory.admin()
        '0x2d12D0907A388811e3AA855A550F959501d303EE'
        ```


### `future_admin`
!!! description "`Factory.future_admin() -> address: view`"

    Getter for the future admin of the Factory. This variable is set when commiting the transfer of ownership.

    Returns: Future admin (`address`).

    ??? quote "Source code"

        === "CurveTwocryptoFactory.vy"

            ```vyper
            future_admin: public(address)
            ```
    
    === "Example"

        ```shell
        >>> Factory.future_admin()
        '0x0000000000000000000000000000000000000000'
        ```


### `commit_transfer_ownership`
!!! description "`Factory.commit_transfer_ownership(_addr: address):`"

    !!!guard "Guarded Method"
        This function is only callable by the `admin` of the contract.

    Function to commit the transfer of ownership. The function sets `future_admin` as `_addr`.

    | Input      | Type      | Description   |
    | ---------- | --------- | ------------- |
    | `_addr`    | `address` | New admin     |

    ??? quote "Source code"

        === "CurveTwocryptoFactory.vy"

            ```vyper
            admin: public(address)
            future_admin: public(address)

            @external
            def commit_transfer_ownership(_addr: address):
                """
                @notice Transfer ownership of this contract to `addr`
                @param _addr Address of the new owner
                """
                assert msg.sender == self.admin, "dev: admin only"

                self.future_admin = _addr
            ```
    
    === "Example"

        ```shell
        >>> Factory.commit_transfer_ownership("0x40907540d8a6C65c637785e8f8B742ae6b0b9968")
        ```


### `accept_transfer_ownership`
!!! description "`Factory.accept_transfer_ownership():`"

    !!!guard "Guarded Method"
        This function is only callable by the `future_admin` of the contract.

    Function to accept the ownership transfer by the future admin.

    Emits: `TransferOwnership`

    ??? quote "Source code"

        === "CurveTwocryptoFactory.vy"

            ```vyper
            event TransferOwnership:
                _old_owner: address
                _new_owner: address

            admin: public(address)
            future_admin: public(address)

            @external
            def accept_transfer_ownership():
                """
                @notice Accept a pending ownership transfer
                @dev Only callable by the new owner
                """
                assert msg.sender == self.future_admin, "dev: future admin only"

                log TransferOwnership(self.admin, msg.sender)
                self.admin = msg.sender
            ```
    
    === "Example"

        ```shell
        >>> Factory.accept_transfer_ownership()
        ```