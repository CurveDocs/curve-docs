The crvUSD Factory enables the **creation of new markets** and adjustments, including **setting a new fee receiver**, **modifying the debt ceiling** of an existing market, or **updating blueprint implementations**.

Other than the pool factory, this factory **does not allow permissionless deployment of new markets**. Only its **`admin`**, the CurveOwnershipAgent, can call to add a market. Therefore, adding a new market requires a successfully passed DAO vote.

!!!deploy "Contract Source & Deployment"
    **crvUSD Market Factory** contract is deployed to the Ethereum mainnet at: [0xC9332fdCB1C491Dcc683bAe86Fe3cb70360738BC](https://etherscan.io/address/0xC9332fdCB1C491Dcc683bAe86Fe3cb70360738BC#code).
    Source code available on [GitHub](https://github.com/curvefi/curve-stablecoin/blob/master/contracts/ControllerFactory.vy).


## **Debt Ceilings**

### `debt_ceiling`
!!! description "`ControllerFactory.debt_ceiling(agr0: address) -> uint256: view`"

    Getter for the current debt ceiling of a market.

    Returns: debt ceiling (`uint256`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `arg0` |  `address` | Address of the controller |

    ??? quote "Source code"

        ```vyper
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

        ```vyper
        debt_ceiling: public(HashMap[address, uint256])
        ```

    === "Example"
        ```shell
        >>> ControllerFactory.debt_ceiling("0x8472A9A7632b173c8Cf3a86D3afec50c35548e76")
        10000000000000000000000000
        ```


### `rug_debt_ceiling`
!!! description "`ControllerFactory.rug_debt_ceiling(_to: address):`"

    Function to remove stablecoins above the debt seiling from a controller and burn them. This function is used to burn residual crvUSD when the debt ceiling was lowered.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_to` |  `address` | Address of the controller to remove stablecoins from |

    ??? quote "Source code"

        ```vyper
        @external
        @nonreentrant('lock')
        def rug_debt_ceiling(_to: address):
            """
            @notice Remove stablecoins above the debt ceiling from the address and burn them
            @param _to Address to remove stablecoins from
            """
            self._set_debt_ceiling(_to, self.debt_ceiling[_to], False)

        @internal
        def _set_debt_ceiling(addr: address, debt_ceiling: uint256, update: bool):
            """
            @notice Set debt ceiling for a market
            @param addr Controller address
            @param debt_ceiling Value for stablecoin debt ceiling
            @param update Whether to actually update the debt ceiling (False is used for burning the residuals)
            """
            old_debt_residual: uint256 = self.debt_ceiling_residual[addr]

            if debt_ceiling > old_debt_residual:
                to_mint: uint256 = debt_ceiling - old_debt_residual
                STABLECOIN.mint(addr, to_mint)
                self.debt_ceiling_residual[addr] = debt_ceiling
                log MintForMarket(addr, to_mint)

            if debt_ceiling < old_debt_residual:
                diff: uint256 = min(old_debt_residual - debt_ceiling, STABLECOIN.balanceOf(addr))
                STABLECOIN.burnFrom(addr, diff)
                self.debt_ceiling_residual[addr] = old_debt_residual - diff
                log RemoveFromMarket(addr, diff)

            if update:
                self.debt_ceiling[addr] = debt_ceiling
                log SetDebtCeiling(addr, debt_ceiling)
        ```

    === "Example"
        ```shell
        >>> ControllerFactory.rug_debt_ceiling("controller address")
        ```



## **Fee Receiver**
The fee receiver is the address that receives the claimed fees when calling `collect_fees()` on the Controller.
A new receiver can be set by the `admin` of the contract, which is the CurveOwnershipAgent.

### `fee_receiver`
!!! description "`ControllerFactory.fee_receiver() -> address: view`"

    Getter for the fee receiver address.

    Returns: `address` of fee receiver.

    ??? quote "Source code"

        ```vyper
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

Implementations are blueprint contracts used to deploy new markets. When calling `add_market`, Controller and AMM are created from the current implementations.


### `controller_implementation`
!!! description "`ControllerFactory.controller_implementation() -> address: view`"

    Getter for controller implementation address.

    Returns: implementation (`address`).

    ??? quote "Source code"

        ```vyper
        collaterals: public(address[MAX_CONTROLLERS])
        ```

    === "Example"
        ```shell
        >>> ControllerFactory.controller_implementation()
        '0x6340678b2bab22a37d781Cd8da958a3cD1d97cdD'
        ```


### `amm_implementation`
!!! description "`ControllerFactory.amm_implementation() -> address: view`"

    Getter for amm implementation address.

    Returns: implementation (`address`).

    ??? quote "Source code"

        ```vyper
        amm_implementation: public(address)
        ```

    === "Example"
        ```shell
        >>> ControllerFactory.amm_implementation()
        '0x3da7fF6C15C0c97D9C2dF4AF82a9910384b372FD'
        ```



## **Contract Info Methods**

### `stablecoin`
!!! description "`ControllerFactory.stablecoin() -> address: view`"

    Getter for the stablecoin address.

    Returns: stablecoin (`address`).

    ??? quote "Source code"

        ```vyper
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

        ```vyper
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

        ```vyper
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

        ```vyper
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

        ```vyper
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

        ```vyper
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

        ```vyper
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

        ```vyper
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

        ```vyper
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

        ```vyper
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
