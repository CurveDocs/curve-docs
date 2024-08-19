<h1>Fee Splitter</h1>

The `FeeSplitter.vy` contract is a simple contract that **collects accumulated crvUSD fees from crvUSD controllers and distributes them to other contracts according to predetermined weights** in a single transaction.

![](../assets/images/fee-splitter/feesplitter.svg)

!!!github "GitHub"
    The source code for the `FeeSplitter.vy`  contract can be found on [:material-github: GitHub](https://github.com/curvefi/curve-burners/pull/1).


---


## **Dispatching Fees**

The `dispatch_fees` function is responsible for both collecting crvUSD fees from the `Controllers` and distributing them according to a predetermined set of weights. The contract utilizes a "helper contract" called `ControllerMulticlaim.vy`, which tracks all `Controllers` and provides an interface for claiming fees from them. By default, the `dispatch_fees` function claims fees from all `Controllers` added to `ControllerMulticlaim.vy`, but it also allows for specifying particular Controllers if one wants to claim fees from only those.

!!!info "Documentation for the `ControllerMulticlaim.vy` contract"

    The `ControllerMulticlaim.vy` contract uses a simple `update_controller` function, callable by anyone, to update the list of controllers from which the fees are claimed. This is necessary because newly deployed controllers are not directly picked up by the contract. This contract is not documented separately but rather is covered on this page in the relevant section. The full source code for the contract can be found below.

    ??? quote "Source Code"

        todo: add commit hash

        === "`ControllerMulticlaim.vy`"

            ```python
            # pragma version ~=0.4.0

            import ControllerFactory
            import Controller

            factory: immutable(ControllerFactory)

            allowed_controllers: public(HashMap[Controller, bool])
            controllers: public(DynArray[Controller, MAX_CONTROLLERS])

            # maximum number of claims in a single transaction
            MAX_CONTROLLERS: constant(uint256) = 100

            @deploy
            def __init__(_factory: ControllerFactory):
                assert _factory.address != empty(address), "zeroaddr: factory"

                factory = _factory

            def claim_controller_fees(controllers: DynArray[Controller, MAX_CONTROLLERS]):
                if len(controllers) == 0:
                    for c: Controller in self.controllers:
                        extcall c.collect_fees()
                else:
                    for c: Controller in controllers:
                        if not self.allowed_controllers[c]:
                            raise "controller: not in factory"
                        extcall c.collect_fees()

            @nonreentrant
            @external
            def update_controllers():
                """
                @notice Update the list of controllers so that it corresponds to the
                    list of controllers in the factory
                """
                old_len: uint256 = len(self.controllers)
                new_len: uint256 = staticcall factory.n_collaterals()
                for i: uint256 in range(new_len - old_len, bound=MAX_CONTROLLERS):
                    i_shifted: uint256 = i + old_len
                    c: Controller = Controller(staticcall factory.controllers(i_shifted))
                    self.allowed_controllers[c] = True
                    self.controllers.append(c)
            ```

All receiving addresses are stored in a `Receiver` struct, which includes the address and its corresponding weight:

```py
struct Receiver:
    addr: address
    weight: uint256
```


The weights assigned to different components receiving `crvUSD` are determined when a receiver address is added using the `set_receivers` function. Additionally, the contract supports dynamic weights based on different conditions. If a weight is dynamic, the `weight` value in the struct serves as a cap. If the dynamic weight is less than the defined weight in the struct, the unused portion is added to the weight of the last receiver. In effect, any unused weight is rolled over to the last receiver address in the `receivers` storage variable.

!!!tip "Weight Example"
    Let's assume the following weights are stored in the `Receiver` struct:

    ```shell
    weight_receiver1 = 10%
    weight_receiver2 = 10%
    weight_receiver3 = 80%
    ```

    Now, due to the nature of the dynamic weights for `receiver1` and `receiver2`, let's assume the actual weight for `receiver1` is 8%, and the weight for `receiver2` is 12%. Therefore, 2% of the weight from `receiver1` is rolled over to the last receiver (`receiver3`). Although the dynamic weight of `receiver2` is 12%, it is capped at its struct value of 10%. The final weights are:

    ```shell
    final_weight_receiver1 = 8%
    final_weight_receiver2 = 10%
    final_weight_receiver3 = 82%        # 2% rolled over from receiver1
    ```


---


### `dispatch_fees`
!!! description "`FeeSplitter.dispatch_fees(controllers: DynArray[multiclaim.Controller, multiclaim.MAX_CONTROLLERS]=[])`"

    Function to claim crvUSD fees from all controllers and distribute them according to their weights. This function is callable by anyone.

    | Input         | Type                                                          | Description |
    | ------------- | ------------------------------------------------------------- | ----------- |
    | `controllers` | `DynArray[multiclaim.Controller, multiclaim.MAX_CONTROLLERS]` | todo; defaults to claiming from all controllers  |

    ??? quote "Source code"

        === "`FeeSplitter.vy`"

            todo: add commit hash

            ```python
            struct Receiver:
                addr: address
                weight: uint256

            # maximum number of splits
            MAX_RECEIVERS: constant(uint256) = 100
            # maximum basis points (100%)
            MAX_BPS: constant(uint256) = 10_000

            # receiver logic
            receivers: public(DynArray[Receiver, MAX_RECEIVERS])

            @nonreentrant
            @external
            def dispatch_fees(controllers: DynArray[multiclaim.Controller, multiclaim.MAX_CONTROLLERS]=[]):
                """
                @notice Claim fees from all controllers and distribute them
                @param controllers The list of controllers to claim fees from (default: all)
                @dev Splits and transfers the balance according to the receivers weights
                """

                multiclaim.claim_controller_fees(controllers)

                balance: uint256 = staticcall crvusd.balanceOf(self)

                excess: uint256 = 0

                # by iterating over the receivers, rather than the indices,
                # we avoid an oob check at every iteration.
                i: uint256 = 0
                for r: Receiver in self.receivers:
                    weight: uint256 = r.weight

                    if self._is_dynamic(r.addr):
                        dynamic_weight: uint256 = staticcall DynamicWeight(r.addr).weight()

                        # weight acts as a cap to the dynamic weight
                        if dynamic_weight < weight:
                            excess += weight - dynamic_weight
                            weight = dynamic_weight

                    if i == len(self.receivers) - 1:
                        weight += excess

                    extcall crvusd.transfer(r.addr, balance * weight // MAX_BPS)
                    i += 1
            ```

        === "`ControllerMulticlaim.vy`"

            todo: add commit hash

            ```python
            import ControllerFactory
            import Controller

            factory: immutable(ControllerFactory)

            allowed_controllers: public(HashMap[Controller, bool])
            controllers: public(DynArray[Controller, MAX_CONTROLLERS])

            # maximum number of claims in a single transaction
            MAX_CONTROLLERS: constant(uint256) = 100

            @deploy
            def __init__(_factory: ControllerFactory):
                assert _factory.address != empty(address), "zeroaddr: factory"

                factory = _factory

            def claim_controller_fees(controllers: DynArray[Controller, MAX_CONTROLLERS]):
                if len(controllers) == 0:
                    for c: Controller in self.controllers:
                        extcall c.collect_fees()
                else:
                    for c: Controller in controllers:
                        if not self.allowed_controllers[c]:
                            raise "controller: not in factory"
                        extcall c.collect_fees()

            @nonreentrant
            @external
            def update_controllers():
                """
                @notice Update the list of controllers so that it corresponds to the
                    list of controllers in the factory
                """
                old_len: uint256 = len(self.controllers)
                new_len: uint256 = staticcall factory.n_collaterals()
                for i: uint256 in range(new_len - old_len, bound=MAX_CONTROLLERS):
                    i_shifted: uint256 = i + old_len
                    c: Controller = Controller(staticcall factory.controllers(i_shifted))
                    self.allowed_controllers[c] = True
                    self.controllers.append(c)
            ```

        === "`DynamicWeight.vyi`"

            ```python
            @view
            @external
            def supportsInterface(interface_id: bytes4) -> bool:
                ...

            @view
            @external
            def weight() -> uint256:
                ...
            ```

    === "Example"

        ```shell
        >>> soon
        ```


### `receivers`
!!! description "`FeeSplitter.receivers(arg0: uint256) -> Receiver: view`"

    Getter for the receiver at 

    Returns: `Receiver` struct consisting of `address` and `weight`.

    | Input  | Type      | Description                             |
    | ------ | --------- | --------------------------------------- |
    | `arg0` | `uint256` | index of the added receiver |

    ??? quote "Source code"

        === "`FeeSplitter.vy`"

            todo: add commit hash

            ```python
            struct Receiver:
                addr: address
                weight: uint256

            receivers: public(DynArray[Receiver, MAX_RECEIVERS])
            ```

    === "Example"

        ```shell
        >>> FeeSplitter.receivers(todo)
        ```


### `n_receivers`
!!! description "`FeeSplitter.n_receivers() -> uint256`"

    Getter for the total number of receivers.

    Returns: number of receivers added (`uint256`)

    ??? quote "Source code"

        === "`FeeSplitter.vy`"

            todo: add commit hash

            ```python
            receivers: public(DynArray[Receiver, MAX_RECEIVERS])

            @view
            @external
            def n_receivers() -> uint256:
                """
                @notice Get the number of receivers
                @return The number of receivers
                """
                return len(self.receivers)
            ```

    === "Example"

        ```shell
        >>> soon
        ```


### `set_receivers`
!!! description "`FeeSplitter.set_receivers(receivers: DynArray[Receiver, MAX_RECEIVERS])`"

    !!!guard "Guarded Method"
        This function is only callable by the `owner` of the contract. todo: add snekmate

    Function to set receivers of the collected crvusd fees. when just adding a new receiver, need to include the olds ones in `receivers` aswell. can not just simply add one because of the weight logic. reverts if address is ZERO_ADDRESS, weight is 0 or greater or than `MAX_BPS`. sum of the weight of all receivers needs to be equal to `MAX_BPS`, which is 100%; otherwise the function call reverts. When adding receivers with dynamics weight, the require to support the `DYNAMIC_WEIGHT_EIP165_ID` a la EIP-165.

    Emits: `SetReceivers`

    | Input       | Type      | Description           |
    | ----------- | --------- | --------------------- |
    | `receivers` | `DynArray[Receiver, MAX_RECEIVERS]` | |

    ??? quote "Source code"

        === "`FeeSplitter.vy`"

            todo: add commit hash

            ```python
            from snekmate.auth import ownable

            initializes: ownable
            exports: (ownable.__interface__, multiclaim.__interface__)

            event SetReceivers: pass

            # maximum number of splits
            MAX_RECEIVERS: constant(uint256) = 100

            DYNAMIC_WEIGHT_EIP165_ID: constant(bytes4) = 0x12431234

            # receiver logic
            receivers: public(DynArray[Receiver, MAX_RECEIVERS])

            struct Receiver:
                addr: address
                weight: uint256

            @external
            def set_receivers(receivers: DynArray[Receiver, MAX_RECEIVERS]):
                """
                @notice Set the receivers
                @param receivers The new receivers
                """
                ownable._check_owner()

                self._set_receivers(receivers)

            def _set_receivers(receivers: DynArray[Receiver, MAX_RECEIVERS]):
                assert len(receivers) > 0, "receivers: empty"
                total_weight: uint256 = 0
                for r: Receiver in receivers:
                    assert r.addr != empty(address), "zeroaddr: receivers"
                    assert r.weight > 0 and r.weight <= MAX_BPS, "receivers: invalid weight"
                    total_weight += r.weight
                assert total_weight == MAX_BPS, "receivers: total weight != MAX_BPS"

                self.receivers = receivers

                log SetReceivers()

            def _is_dynamic(addr: address) -> bool:
                """
                @notice Check if the address supports the dynamic weight interface
                @param addr The address to check
                @return True if the address supports the dynamic weight interface
                """
                success: bool = False
                response: Bytes[32] = b""
                success, response = raw_call(
                    addr,
                    abi_encode(DYNAMIC_WEIGHT_EIP165_ID, method_id=method_id("supportsInterface(bytes4)")),
                    max_outsize=32,
                    is_static_call=True,
                    revert_on_failure=False
                )
                return success and convert(response, bool) or len(response) > 32
            ```

        === "Snekmate"

            todo: add snekmate module

            ```py
            
            ```


    === "Example"

        ```shell
        >>> soon
        ```


### `version`
!!! description "`FeeSplitter.version() -> String[8]: view`"

    Getter for the version of the contract.

    Returns: contract version (`String[8]`). 

    ??? quote "Source code"

        === "`FeeSplitter.vy`"

            todo: add commit hash

            ```python
            version: public(constant(String[8])) = "0.1.0" # no guarantees on abi stability
            ```

    === "Example"

        ```shell
        >>> FeeSplitter.version()
        '0.1.0'
        ```