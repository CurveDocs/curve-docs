<h1></h1>

## **Debt Ceilings**
### `debt_ceiling`
!!! description "`ControllerFactory.debt_ceiling(agr0: address) -> uint256: view`"

    Getter for the current debt ceiling of a market.

    Returns: debt ceiling (`uint256`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `arg0` |  `address` | Address of the controller |

    ??? quote "Source code"

        ```vyper hl_lines="1"
        debt_ceiling: public(HashMap[address, uint256])
        ```

    === "Example"
        ```shell
        >>> ControllerFactory.debt_ceiling("0x8472A9A7632b173c8Cf3a86D3afec50c35548e76")
        10000000000000000000000000
        ```


### `debt_ceiling_residual`
!!! description "`ControllerFactory.debt_ceiling_residual(arg0: address) -> uint256: view`"

    Getter for the residual debt ceiling for a market.

    Returns: debt ceiling residual (`uint256`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `arg0` |  `address` | Address of the controller |

    ??? quote "Source code"

        ```vyper hl_lines="1"
        debt_ceiling: public(HashMap[address, uint256])
        ```

    === "Example"
        ```shell
        >>> ControllerFactory.debt_ceiling("0x8472A9A7632b173c8Cf3a86D3afec50c35548e76")
        10000000000000000000000000
        ```

### `rug_debt_ceiling`
!!! description "`ControllerFactory.rug_debt_ceiling(_to: address):`"

    Function to remove stablecoins above the debt seiling from a controller and burn them.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_to` |  `address` | Address of the controller to remove stablecoins from |

    ??? quote "Source code"

        ```vyper hl_lines="3"
        @external
        @nonreentrant('lock')
        def rug_debt_ceiling(_to: address):
            """
            @notice Remove stablecoins above the debt ceiling from the address and burn them
            @param _to Address to remove stablecoins from
            """
            self._set_debt_ceiling(_to, self.debt_ceiling[_to], False)
        ```

    === "Example"
        ```shell
        >>> ControllerFactory.rug_debt_ceiling("todo")
        'todo'
        ```



## **Fee Receiver**
The fee receiver is the address that receives the claimed fees when calling `collect_fees()` on the Controller.
A new receiver can be set by the `admin` of the contract (which is the DAO).

### `fee_receiver`
!!! description "`ControllerFactory.fee_receiver() -> address: view`"

    Getter for the fee receiver address.

    Returns: `address` of fee receiver.

    ??? quote "Source code"

        ```vyper hl_lines="1 6 17"
        fee_receiver: public(address)

        @external
        def __init__(stablecoin: ERC20,
                    admin: address,
                    fee_receiver: address,
                    weth: address):
            """
            @notice Factory which creates both controllers and AMMs from blueprints
            @param stablecoin Stablecoin address
            @param admin Admin of the factory (ideally DAO)
            @param fee_receiver Receiver of interest and admin fees
            @param weth Address of WETH contract address
            """
            STABLECOIN = stablecoin
            self.admin = admin
            self.fee_receiver = fee_receiver
            WETH = weth
        ```

    === "Example"
        ```shell
        >>> ControllerFactory.fee_receiver()
        '0xeCb456EA5365865EbAb8a2661B0c503410e9B347'
        ```


## **Implementations**

### `controller_implementation`
!!! description "`ControllerFactory.controller_implementation() -> address: view`"

    Getter for controller implementation address.

    Returns: `address` of the controller implementation.

    ??? quote "Source code"

        ```vyper hl_lines="1"
        collaterals: public(address[MAX_CONTROLLERS])
        ```

    === "Example"
        ```shell
        >>> ControllerFactory.controller_implementation()
        '0x9DFbf2b2aF574cA8Ba6dD3fD397287944269f720'
        ```


### `amm_implementation`
!!! description "`ControllerFactory.amm_implementation() -> address: view`"

    Getter for amm implementation address.

    Returns: `address` of the amm implementation.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `arg0` |  `uint256` | Index |

    ??? quote "Source code"

        ```vyper hl_lines="1"
        amm_implementation: public(address)
        ```

    === "Example"
        ```shell
        >>> ControllerFactory.amm_implementation()
        '0x23208cA4F2B30d8f7D54bf2D5A822D1a2F876501'
        ```




## **Contract Info Methods**

### `stablecoin`
!!! description "`ControllerFactory.stablecoin() -> address: view`"

    Getter for the stablecoin address.

    Returns: stablecoin (`address`). 

    ??? quote "Source code"

        ```vyper hl_lines="1 4 15"
        STABLECOIN: immutable(ERC20)

        @external
        def __init__(stablecoin: ERC20,
                    admin: address,
                    fee_receiver: address,
                    weth: address):
            """
            @notice Factory which creates both controllers and AMMs from blueprints
            @param stablecoin Stablecoin address
            @param admin Admin of the factory (ideally DAO)
            @param fee_receiver Receiver of interest and admin fees
            @param weth Address of WETH contract address
            """
            STABLECOIN = stablecoin
            self.admin = admin
            self.fee_receiver = fee_receiver
            WETH = weth
        ```

    === "Example"
        ```shell
        >>> ControllerFactory.stablecoin()
        '0xf939E0A03FB07F59A73314E73794Be0E57ac1b4E'
        ```


### `total_debt`
!!! description "`ControllerFactory.total_debt() -> uint256: view`"

    Getter for the sum of all debts across the controllers.

    Returns: total amount of debt (`uint256`). 

    ??? quote "Source code"

        ```vyper hl_lines="3"
        @external
        @view
        def total_debt() -> uint256:
            """
            @notice Sum of all debts across controllers
            """
            total: uint256 = 0
            n_collaterals: uint256 = self.n_collaterals
            for i in range(MAX_CONTROLLERS):
                if i == n_collaterals:
                    break
                total += Controller(self.controllers[i]).total_debt()
            return total
        ```

    === "Example"
        ```shell
        >>> ControllerFactory.total_debt()
        37565735180665889485176526
        ```


### `get_controller`
!!! description "`ControllerFactory.get_controller(collateral: address, i: uint256 = 0) -> address:`"

    Getter for the controller address for `collateral`.

    Returns: controller `address`. 

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `collateral` |  `address` | Address of collateral token |
    | `i` |  `uint256` | Index to iterate over several controller for the same collateral if needed |


    ??? quote "Source code"

        ```vyper hl_lines="3"
        @external
        @view
        def get_controller(collateral: address, i: uint256 = 0) -> address:
            """
            @notice Get controller address for collateral
            @param collateral Address of collateral token
            @param i Iterate over several controllers for collateral if needed
            """
            return self.controllers[self.collaterals_index[collateral][i] - 2**128]
        ```

    === "Example"
        ```shell
        >>> ControllerFactory.get_controller("0xac3E018457B222d93114458476f3E3416Abbe38F", 0)
        '0x8472A9A7632b173c8Cf3a86D3afec50c35548e76'
        ```


### `get_amm`
!!! description "`ControllerFactory.get_amm(collateral: address, i: uint256 = 0) -> address:`"

    Getter for the amm address for `collateral`.

    Returns: amm `address`. 

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `collateral` |  `address` | Address of collateral token |
    | `i` |  `uint256` | Index to iterate over several amms for the same collateral if needed |


    ??? quote "Source code"

        ```vyper hl_lines="3"
        @external
        @view
        def get_amm(collateral: address, i: uint256 = 0) -> address:
            """
            @notice Get AMM address for collateral
            @param collateral Address of collateral token
            @param i Iterate over several AMMs for collateral if needed
            """
            return self.amms[self.collaterals_index[collateral][i] - 2**128]
        ```

    === "Example"
        ```shell
        >>> ControllerFactory.get_amm("0xac3E018457B222d93114458476f3E3416Abbe38F", 0)
        '0x136e783846ef68C8Bd00a3369F787dF8d683a696'
        ```


### `controllers`
!!! description "`ControllerFactory.controllers(arg0: uint256) -> address:`"

    Getter for the controller address at index `arg0`.

    Returns: controller `address` at specific index. 

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `arg0` |  `uint256` | Index |


    ??? quote "Source code"

        ```vyper hl_lines="2"
        MAX_CONTROLLERS: constant(uint256) = 50000
        controllers: public(address[MAX_CONTROLLERS])
        ```

    === "Example"
        ```shell
        >>> ControllerFactory.controllers(0)
        '0x8472A9A7632b173c8Cf3a86D3afec50c35548e76'
        ```


### `amms`
!!! description "`ControllerFactory.amms(arg0: uint256) -> address:`"

    Getter for the amm address at index `arg0`.

    Returns: AMM `address` at specific index. 

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `arg0` |  `uint256` | Index |


    ??? quote "Source code"

        ```vyper hl_lines="1"
        amms: public(address[MAX_CONTROLLERS])
        ```

    === "Example"
        ```shell
        >>> ControllerFactory.amms(0)
        '0x136e783846ef68C8Bd00a3369F787dF8d683a696'
        ```

### `n_collaterals`
!!! description "`ControllerFactory.n_collaterals() -> uint256: view`"

    Getter for the number of collaterals.

    Returns: number of collaterals (`uint256`).

    ??? quote "Source code"

        ```vyper hl_lines="1"
        n_collaterals: public(uint256)
        ```

    === "Example"
        ```shell
        >>> ControllerFactory.n_collaterals()
        2
        ```


### `collaterals`
!!! description "`ControllerFactory.collaterals(arg0: uint256) -> address: view`"

    Getter for the collateral addresses at index `arg0`.

    Returns: `address` of collateral.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `arg0` |  `uint256` | Index |

    ??? quote "Source code"

        ```vyper hl_lines="1"
        collaterals: public(address[MAX_CONTROLLERS])
        ```

    === "Example"
        ```shell
        >>> ControllerFactory.collaterals(0)
        '0xac3E018457B222d93114458476f3E3416Abbe38F'
        ```


### `collaterals_index`
!!! description "`ControllerFactory.collaterals(arg0: address, arg1: uint256) -> uint256: view`"

    Getter for the index of a controller for `arg0`.

    Returns: index (`uint256`).

    !!!note
        The returned value is $2^{128}$ + index.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `arg0` |  `address` | Address of collateral |
    | `arg0` |  `uint256` | Index |

    ??? quote "Source code"

        ```vyper hl_lines="1"
        collaterals_index: public(HashMap[address, uint256[1000]])
        ```

    === "Example"
        ```shell
        >>> ControllerFactory.collaterals(0xac3E018457B222d93114458476f3E3416Abbe38F, 0)
        340282366920938463463374607431768211456
        ```

### `WETH`
!!! description "`ControllerFactory.WETH() -> address: view`"

    Getter for WETH address.

    Returns: `address` of WETH.

    ??? quote "Source code"

        ```vyper hl_lines="1 7 18"
        WETH: public(immutable(address))

        @external
        def __init__(stablecoin: ERC20,
                    admin: address,
                    fee_receiver: address,
                    weth: address):
            """
            @notice Factory which creates both controllers and AMMs from blueprints
            @param stablecoin Stablecoin address
            @param admin Admin of the factory (ideally DAO)
            @param fee_receiver Receiver of interest and admin fees
            @param weth Address of WETH contract address
            """
            STABLECOIN = stablecoin
            self.admin = admin
            self.fee_receiver = fee_receiver
            WETH = weth
        ```

    === "Example"
        ```shell
        >>> ControllerFactory.WETH()
        '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
        ```