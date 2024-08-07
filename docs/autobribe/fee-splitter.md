<h1>Fee Splitter</h1>

A simple contract that **collects fees from multiple crvUSD Controller contracts in a single transaction and distributes them according to some determined weights**.

!!!github "GitHub"
    The source code for the `FeeSplitter.vy`  contract can be found on [GitHub :material-github:](https://github.com/curvefi/curve-burners/pull/1).


*The flow of claimed crvUSD looks as follows:*

<figure markdown="span">
  ![](../assets/images/fee-burning/fee-splitter.svg){ width="600" }
  <figcaption></figcaption>
</figure>


---


## **Claiming and Splitting Fees**

Fees from multiple `Controllers` are collected and split up via the `claim_controller_fees` function based on `collector_weight` and `incentives_weight`. The weights can be set by the `owner` of the contract, which is the DAO itself. 


### `claim_controller_fees`
!!! description "`FeeSplitter.claim_controller_fees(controllers: DynArray[Controller, MAX_CONTROLLERS]=empty(DynArray[Controller, MAX_CONTROLLERS])) -> (uint256, uint256)`"

    The `claim_controller_fees` function allows for the collection of fees from the specified array of `controllers`. It splits the total claimed fees according to the `collector_weight` and `incentives_weight`, then transfers the respective amounts to the `collector` and `incentives_manager` addresses. Generally, it is permissible to claim fees from all controllers; however, there may be instances where new controllers are not yet authorized. In such cases, one needs to call the `update_controllers` function. This function verifies all existing controllers from the `ControllerFactory`, adds them to the `controllers` variable, and sets `allowed_controllers(controller) = True`.

    Returns: amout of crvusd transfered to the collector and the incentives manager (`uint256, uint256`).

    | Input         | Type                                    | Description                            |
    | ------------- | --------------------------------------- | -------------------------------------- |
    | `controllers` | `DynArray[Controller, MAX_CONTROLLERS]` | Controllers to claim crvUSD fees from  |

    ??? quote "Source code"

        === "FeeSplitter.vy"

            ```python
            interface Controller:
                def collect_fees() -> uint256: nonpayable

            controllers: public(DynArray[Controller, MAX_CONTROLLERS])
            allowed_controllers: public(HashMap[Controller, bool])
            collector_weight: public(uint256)
            collector: public(address)

            @nonreentrant("lock")
            @external
            def claim_controller_fees(controllers: DynArray[Controller, MAX_CONTROLLERS]=empty(DynArray[Controller, MAX_CONTROLLERS])) -> (uint256, uint256):
                """
                @notice Claim fees from all controllers and distribute them
                @param controllers The list of controllers to claim fees from (default: all)
                @dev Splits and transfers the balance according to the distribution weights
                """
                if len(controllers) == 0:
                    for c in self.controllers:
                        c.collect_fees()
                else:
                    for c in controllers:
                        if not self.allowed_controllers[c]:
                            raise "controller: not in factory"
                        c.collect_fees()

                balance: uint256 = crvusd.balanceOf(self)

                collector_amount: uint256 = balance * self.collector_weight / MAX_BPS
                incentives_amount: uint256 = balance - collector_amount

                crvusd.transfer(self.collector, collector_amount)
                crvusd.transfer(self.incentives_manager, incentives_amount)

                return collector_amount, incentives_amount
            ```

    === "Example"

        In this example, the crvUSD fees from the imaginary `controller1` and `controller2` are claimed. If the boolean value of `allowed_controller` for either of these controllers does not return `True`, the function will revert.

        ```shell
        >>> FeeSplitter.claim_controller_fees(['controller1', 'controller2'])
        (collector_amount, incentives_amount)
        ```


### `controllers`
!!! description "`FeeSplitter.controllers() -> DynArray[Controller, MAX_CONTROLLERS]: view`"

    Getter for all controllers considered by the `FeeSplitter`. The `controllers` variable is updated and populated by calling the `update_controllers` function, which retrieves controllers from the `Factory`. It is important to note that this is not the list of controllers used when collecting fees; instead, fee collection is based on the `allowed_controllers` list.

    Returns: todo

    ??? quote "Source code"

        === "FeeSplitter.vy"

            ```python
            controllers: public(DynArray[Controller, MAX_CONTROLLERS])
            ```

    === "Example"

        ```shell
        >>> FeeSplitter.controllers()
        'todo'
        ```


### `allowed_controllers`
!!! description "`FeeSplitter.allowed_controllers(arg0: address) -> bool: view`"

    Getter to check if the `FeeSplitter` is allowed to claim fees from a specific `Controller`. Generally, the contract is permitted to claim fees from all Controllers without any restrictions. However, if new Controllers are deployed, they are not automatically included in the `FeeSplitter`. To update this list so that it corresponds to the list of Controllers in the factory, one needs to call the `update_controllers` function.

    Returns: `true` or `false` (`bool`).

    | Input   | Type      | Description                                              |
    | ------- | --------- | -------------------------------------------------------- |
    | `arg0`  | `address` | Controller address to check if allowed to claim its fees |

    ??? quote "Source code"

        === "FeeSplitter.vy"

            ```python
            allowed_controllers: public(HashMap[Controller, bool])
            ```

    === "Example"

        ```shell
        >>> FeeSplitter.allowed_controllers('controller1')
        'true'
        ```


### `update_controllers`
!!! description "`FeeSplitter.update_controllers()`"

    Function to update the list of `Controllers` (`controllers` and `allowed_controllers`) to ensure they correspond to the list of `Controllers` in the factory.

    ??? quote "Source code"

        === "FeeSplitter.vy"

            ```python
            interface ControllerFactory:
                def controllers(index: uint256) -> address: nonpayable
                def n_collaterals() -> uint256: nonpayable

            controllers: public(DynArray[Controller, MAX_CONTROLLERS])
            allowed_controllers: public(HashMap[Controller, bool])

            @external
            def update_controllers():
                """
                @notice Update the list of controllers so that it corresponds to the
                    list of controllers in the factory
                """
                old_len: uint256 = len(self.controllers)
                new_len: uint256 = factory.n_collaterals()
                for i in range(new_len - old_len, bound=MAX_CONTROLLERS):
                    i_shifted: uint256 = i + old_len
                    c: Controller = Controller(factory.controllers(i_shifted))
                    self.allowed_controllers[c] = True
                    self.controllers.append(c)
            ```

    === "Example"

        ```shell
        >>> FeeSplitter.update_controllers()
        ```


### `collector_weight`
!!! description "`FeeSplitter.collector_weight() -> uint256: view`"

    Getter for the collector weight. This variable determines the portion of the total claimed crvUSD fees that is allocated to the `FeeCollector`, which is then further distributed to veCRV holders. The weights are based on `MAX_BPS = 10,000`.

    Returns: collector weight (`uint256`).

    ??? quote "Source code"

        === "FeeSplitter.vy"

            ```python
            collector_weight: public(uint256)

            @external
            def __init__(_crvusd: address, _factory: address, collector_weight: uint256, collector: address, incentives_manager: address, owner: address):
                """
                @notice Contract constructor
                @param _crvusd The address of the crvUSD token contract
                @param collector_weight The initial weight for veCRV distribution (scaled by 1e18)
                @param collector The address to receive the amount for veCRV holders
                @param incentives_manager The address to receive the incentives amount
                @param owner The address of the contract owner
                """
                ...
                assert collector_weight <= MAX_BPS, "weights: collector_weight > MAX_BPS"
                ...
                self.collector_weight = collector_weight
                ...
            ```

    === "Example"

        ```shell
        >>> FeeSplitter.collector_weight()
        5000        # 50%
        ```


### `incentives_weight`
!!! description "`FeeSplitter.incentives_weight() -> uint256: view`"

    Getter for the incentives weight, which is equal to `MAX_BPS - collector_weight`. This variable determines the portion of the total claimed crvUSD fees that is allocated to the `incentives_manager`, which is then used to post vote incentives (bribes). The weights are based on `MAX_BPS = 10,000`.

    Returns: incentives weight (`uint256`).

    ??? quote "Source code"

        === "FeeSplitter.vy"

            ```python
            @view
            @external
            def incentives_weight() -> uint256:
                """
                @notice Getter to compute the weight for incentives
                @return The weight for voting incentives
                """
                return MAX_BPS - self.collector_weight
            ```

    === "Example"

        ```shell
        >>> FeeSplitter.
        5000        # 50%
        ```


### `set_weights`
!!! description "`FeeSplitter.set_weights(collector_weight: uint256)`"

    Function to set a new weight for `collector_weight`. By changing the `collector_weight` value, the `incentives_weight` value also changes accordingly as it is based on `MAX_BPS - collector_weight`.

    Emits: `SetWeights`

    | Input              | Type      | Description                  |
    | ------------------ | --------- | ---------------------------- |
    | `collector_weight` | `uint256` | New `collector_weight` value |

    ??? quote "Source code"

        === "FeeSplitter.vy"

            ```python
            event SetWeights:
                distribution_weight: uint256

            collector_weight: public(uint256)

            @external
            def set_weights(collector_weight: uint256):
                """
                @notice Set the collector weight (and implicitly the incentives weight)
                @dev Up to 100% (MAX_BPS)
                @param collector_weight The new collector weight
                """
                assert msg.sender == self.owner, "auth: only owner"
                assert collector_weight <= MAX_BPS, "weights: collector weight > MAX_BPS"

                self.collector_weight = collector_weight

                log SetWeights(collector_weight)
            ```

    === "Example"

        For example, when setting the `collector_weight` to `7500`, 75% of all collected fees from the controllers will be transferred to the `collector`. The `incentives_weight` will be `10,000 - 7500`, which equals 25%.

        ```shell
        >>> FeeSplitter.set_weights(7500)
        
        >>> FeeSplitter.collector_weight()
        7500

        >>> FeeSplitter.incentives_weight()
        2500
        ```


---


## **Collector and Incentives Manager**

The contract has two variables, the `collector` and `incentives_manager`, which represent the contract to which the split up fees are sent. These contract can only be changed by the `owner` (the DAO) using the `set_collector` or `set_incentives_manager`.


### `collector`
!!! description "`FeeSplitter.collector() -> address: view`"

    Getter for the collector address. This contract forwards the proportionally collected crvUSD fees to the `FeeDistributor` from which they can be claimed by veCRV holders.

    Returns: collector (`address`).

    ??? quote "Source code"

        === "FeeSplitter.vy"

            ```python
            collector: public(address)

            @external
            def __init__(_crvusd: address, _factory: address, collector_weight: uint256, collector: address, incentives_manager: address, owner: address):
                """
                @notice Contract constructor
                @param _crvusd The address of the crvUSD token contract
                @param collector_weight The initial weight for veCRV distribution (scaled by 1e18)
                @param collector The address to receive the amount for veCRV holders
                @param incentives_manager The address to receive the incentives amount
                @param owner The address of the contract owner
                """
                ...
                assert collector != empty(address), "zeroaddr: collector"
                ...
                self.collector = collector
                ...
            ```

    === "Example"

        The `collector` address is set to the already existing `FeeCollector` contract.

        ```shell
        >>> FeeSplitter.collector()
        'todo'
        ```


### `incentives_manager`
!!! description "`FeeSplitter.incentives_manager() -> address: view`"

    Getter for the incentives manager address. This contract is used to post bribes.

    Returns: incentives manager (`address`).

    ??? quote "Source code"

        === "FeeSplitter.vy"

            ```python
            incentives_manager: public(address)

            @external
            def __init__(_crvusd: address, _factory: address, collector_weight: uint256, collector: address, incentives_manager: address, owner: address):
                """
                @notice Contract constructor
                @param _crvusd The address of the crvUSD token contract
                @param collector_weight The initial weight for veCRV distribution (scaled by 1e18)
                @param collector The address to receive the amount for veCRV holders
                @param incentives_manager The address to receive the incentives amount
                @param owner The address of the contract owner
                """
                ...
                assert incentives_manager != empty(address), "zeroaddr: incentives_manager"
                ...
                self.incentives_manager = incentives_manager
                ...
            ```

    === "Example"

        ```shell
        >>> FeeSplitter.incentives_manager()
        'todo'
        ```


### `set_collector`
!!! description "`FeeSplitter.set_collector(collector: address)`"

    !!!guard "Guarded Method"
        This function is only callable by the `owner` of the contract.

    Function to set a new address for `collector`.

    Emits: `SetCollector`

    | Input       | Type      | Description                    |
    | ----------- | --------- | ------------------------------ |
    | `collector` | `address` | New address set as `collector` |

    ??? quote "Source code"

        === "FeeSplitter.vy"

            ```python
            event SetCollector:
                distribution_receiver: address
                        
            collector: public(address)

            @external
            def set_collector(collector: address):
                """
                @notice Set the address that will receive crvUSD for distribution
                    to veCRV holders.
                @param collector_receiver The address that will receive crvUSD
                """
                assert msg.sender == self.owner, "auth: only owner"
                assert collector != empty(address), "zeroaddr: collector"

                self.collector = collector

                log SetCollector(collector)
            ```

    === "Example"

        ```shell
        >>> soon
        ```


### `set_incentives_manager`
!!! description "`FeeSplitter.set_incentives_manager(incentives_manager: address)`"

    !!!guard "Guarded Method"
        This function is only callable by the `owner` of the contract.

    Function to set a new address for `incentives_manager`.

    Emits: `SetIncentivesManager`

    | Input                | Type      | Description                             |
    | -------------------- | --------- | --------------------------------------- |
    | `incentives_manager` | `address` | New address set as `incentives_manager` |

    ??? quote "Source code"

        === "FeeSplitter.vy"

            ```python
            event SetIncentivesManager:
                incentives_receiver: address

            incentives_manager: public(address)

            @external
            def set_incentives_manager(incentives_manager: address):
                """
                @notice Set the address that will receive crvUSD that
                    will be used for incentives
                @param incentives_manager The address that will receive
                    crvUSD to be used for incentives
                """
                assert msg.sender == self.owner, "auth: only owner"
                assert incentives_manager != empty(address), "zeroaddr: incentives_manager"

                self.incentives_manager = incentives_manager

                log SetIncentivesManager(incentives_manager)
            ```

    === "Example"

        ```shell
        >>> soon
        ```


---

## **Contract Ownership**

### `owner`
!!! description "`FeeSplitter.owner() -> address: view`"

    Getter for the owner of the contract. The ownership of the contract can only be changed by the `owner` itself.

    Returns: current owner (`address`).

    ??? quote "Source code"

        === "FeeSplitter.vy"

            ```python
            owner: public(address)

            @external
            def __init__(_crvusd: address, _factory: address, collector_weight: uint256, collector: address, incentives_manager: address, owner: address):
                """
                @notice Contract constructor
                @param _crvusd The address of the crvUSD token contract
                @param collector_weight The initial weight for veCRV distribution (scaled by 1e18)
                @param collector The address to receive the amount for veCRV holders
                @param incentives_manager The address to receive the incentives amount
                @param owner The address of the contract owner
                """
                ...
                assert owner != empty(address), "zeroaddr: owner"
                ...
                self.owner = owner
            ```

    === "Example"

        ```shell
        >>> FeeSplitter.owner()
        'todo'
        ```


### `set_owner`
!!! description "`FeeSplitter.set_owner(new_owner: address)`"

    !!!guard "Guarded Method"
        This function is only callable by the `owner` of the contract.

    Function to change the ownership of the contract.

    Emits: `SetOwner`

    | Input   | Type      | Description       |
    | ------- | --------- | ----------------- |
    | `new_owner` | `uint256` | New address to set as owner |

    ??? quote "Source code"

        === "FeeSplitter.vy"

            ```python
            event SetOwner:
                owner: address

            owner: public(address)

            @external
            def set_owner(new_owner: address):
                """
                @notice Set owner of the contract
                @param new_owner Address of the new owner
                """
                assert msg.sender == self.owner, "auth: only owner"
                assert new_owner != empty(address), "zeroaddr: new_owner"

                self.owner = new_owner

                log SetOwner(new_owner)
            ```

    === "Example"

        ```shell
        >>> FeeSplitter.owner()
        '0x0000000000000000000000000000000000000000'

        >>> FeeSplitter.set_owner('0x40907540d8a6C65c637785e8f8B742ae6b0b9968')
        
        >>> FeeSplitter.owner()
        '0x40907540d8a6C65c637785e8f8B742ae6b0b9968'
        ```


---

## **Other Methods**

### `factory`
!!! description "`FeeSplitter.factory() -> address: view`"

    Getter for the `ControllerFactory` which is used to create new markets from which crvUSD can be minted.

    Returns: `Factory` (`address`).

    ??? quote "Source code"

        === "FeeSplitter.vy"

            ```python
            interface ControllerFactory:
                def controllers(index: uint256) -> address: nonpayable
                def n_collaterals() -> uint256: nonpayable

            factory: immutable(ControllerFactory)

            @external
            def __init__(_crvusd: address, _factory: address, collector_weight: uint256, collector: address, incentives_manager: address, owner: address):
                """
                @notice Contract constructor
                @param _crvusd The address of the crvUSD token contract
                @param collector_weight The initial weight for veCRV distribution (scaled by 1e18)
                @param collector The address to receive the amount for veCRV holders
                @param incentives_manager The address to receive the incentives amount
                @param owner The address of the contract owner
                """
                ...
                assert _factory != empty(address), "zeroaddr: factory"
                ...
                factory = ControllerFactory(_factory)
                ...
            ```

    === "Example"

        ```shell
        >>> FeeSplitter.factory()
        '0xC9332fdCB1C491Dcc683bAe86Fe3cb70360738BC'
        ```


### `crvusd`
!!! description "`FeeSplitter.crvusd() -> address: view`"

    Getter for the `crvUSD` token address.

    Returns: crvUSD token (`address`).

    ??? quote "Source code"

        === "FeeSplitter.vy"

            ```python
            crvusd: immutable(ERC20)

            from vyper.interfaces import ERC20

            @external
            def __init__(_crvusd: address, _factory: address, collector_weight: uint256, collector: address, incentives_manager: address, owner: address):
                """
                @notice Contract constructor
                @param _crvusd The address of the crvUSD token contract
                @param collector_weight The initial weight for veCRV distribution (scaled by 1e18)
                @param collector The address to receive the amount for veCRV holders
                @param incentives_manager The address to receive the incentives amount
                @param owner The address of the contract owner
                """
                assert _crvusd != empty(address), "zeroaddr: crvusd"
                ...
                crvusd = ERC20(_crvusd)
                ...
            ```

    === "Example"

        ```shell
        >>> FeeSplitter.crvusd()
        '0xf939E0A03FB07F59A73314E73794Be0E57ac1b4E'
        ```
