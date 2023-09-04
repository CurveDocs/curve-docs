The following are methods that may only be called by the owner of the contract.


## **Adjusting Debt Ceilings**

### `set_debt_ceiling`
!!! description "`ControllerFactory.set_debt_ceiling(_to: address, debt_ceiling: uint256):`"

    Function to set the debt ceiling of a market and mint the token amount given for it.

    Returns: debt ceiling (`uint256`).

    Emits event: `MintForMarket` or `RemoveFromMarket` or `SetDebtCeiling`

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_to` |  `address` | Address to set debt ceiling for |
    | `debt_ceiling` |  `uint256` | Maximum to be allowed to mint |

    !!!note 
        **`set_debt_ceiling`** can only be called by the `admin` of the contract.

    ??? quote "Source code"

        === "ControllerFactory.vy"

            ```python hl_lines="1 5 9 14 23 25 26 27 29 31 32 33 35 36 37 41"
            event SetDebtCeiling:
                addr: indexed(address)
                debt_ceiling: uint256

            event MintForMarket:
                addr: indexed(address)
                amount: uint256

            event RemoveFromMarket:
                addr: indexed(address)
                amount: uint256

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

            @external
            @nonreentrant('lock')
            def set_debt_ceiling(_to: address, debt_ceiling: uint256):
                """
                @notice Set debt ceiling of the address - mint the token amount given for it
                @param _to Address to allow borrowing for
                @param debt_ceiling Maximum allowed to be allowed to mint for it
                """
                assert msg.sender == self.admin
                self._set_debt_ceiling(_to, debt_ceiling, True)
            ```

        === "Stablecoin.vy"

            ```python hl_lines="2 19"
            @external
            def mint(_to: address, _value: uint256) -> bool:
                """
                @notice Mint `_value` amount of tokens to `_to`.
                @dev Only callable by an account with minter privileges.
                @param _to The account newly minted tokens are credited to.
                @param _value The amount of tokens to mint.
                """
                assert msg.sender == self.minter
                assert _to not in [self, empty(address)]

                self.balanceOf[_to] += _value
                self.totalSupply += _value

                log Transfer(empty(address), _to, _value)
                return True

            @external
            def burn(_value: uint256) -> bool:
                """
                @notice Burn `_value` amount of tokens.
                @param _value The amount of tokens to burn.
                """
                self._burn(msg.sender, _value)
                return True
            ```

    === "Example"
        ```shell
        >>> ControllerFactory.set_debt_ceiling(20000000000000000000000000)
        ```



## **Fee Receiver**

### `set_fee_receiver`
!!! description "`ControllerFactory.set_fee_receiver(fee_receiver: address):`"

    Function to set the fee receiver address.

    Emits: `SetFeeReceiver`

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `fee_receiver` |  `address` | Address of the receiver |

    !!!note 
        **`set_fee_receiver`** can only be called by the `admin` of the contract.  

    ??? quote "Source code"

        ```python hl_lines="1 8 16"
        event SetFeeReceiver:
            fee_receiver: address

        fee_receiver: public(address)

        @external
        @nonreentrant('lock')
        def set_fee_receiver(fee_receiver: address):
            """
            @notice Set fee receiver who earns interest (DAO)
            @param fee_receiver Address of the receiver
            """
            assert msg.sender == self.admin
            assert fee_receiver != empty(address)
            self.fee_receiver = fee_receiver
            log SetFeeReceiver(fee_receiver)
        ```

    === "Example"
        ```shell
        >>> ControllerFactory.set_fee_receiver("0xeCb456EA5365865EbAb8a2661B0c503410e9B347")
        ```


### `collect_fees_above_ceiling`
!!! description "`ControllerFactory.collect_fees_above_ceiling(_to: address):`"

    Function to claim fees above the ceiling. This function will automatically increase the debt ceiling if it's not enough to claim admin fees.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_to` |  `address` | Address of the controller |

    !!!note 
        **`collect_fees_above_ceiling`** can only be called by the `admin` of the contract.  

    ??? quote "Source code"

        ```python hl_lines="1 7 18"
        @external
        @nonreentrant('lock')
        def collect_fees_above_ceiling(_to: address):
            """
            @notice If the receiver is the controller - increase the debt ceiling if it's not enough to claim admin fees
                    and claim them
            @param _to Address of the controller
            """
            assert msg.sender == self.admin
            old_debt_residual: uint256 = self.debt_ceiling_residual[_to]
            assert self.debt_ceiling[_to] > 0 or old_debt_residual > 0

            admin_fees: uint256 = Controller(_to).total_debt() + Controller(_to).redeemed() - Controller(_to).minted()
            b: uint256 = STABLECOIN.balanceOf(_to)
            if admin_fees > b:
                to_mint: uint256 = admin_fees - b
                STABLECOIN.mint(_to, to_mint)
                self.debt_ceiling_residual[_to] = old_debt_residual + to_mint
            Controller(_to).collect_fees()
        ```

    === "Example"
        ```shell
        >>> ControllerFactory.collect_fees_above_ceiling("0x100dAa78fC509Db39Ef7D04DE0c1ABD299f4C6CE")
        ```



## **Implementations (Blueprint Contracts)**

### `set_implementations`
!!! description "`ControllerFactory.set_implementations(controller: address, amm: address):`"

    Function to set new implementations (blueprints) for controller and amm. 

    Emits event: `SetImplementations`

    !!!note 
        **`set_implementations`** can only be called by the `admin` of the contract.  
        Setting new implementations for Controller and AMM does not affect the existing ones.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `controller` |  `Address` | Address of the controller blueprint |
    | `amm` |  `Address` | Address of the amm blueprint |

    ??? quote "Source code"

        ```python hl_lines="1 5 6 10"
        event SetImplementations:
            amm: address
            controller: address

        controller_implementation: public(address)
        amm_implementation: public(address)

        @external
        @nonreentrant('lock')
        def set_implementations(controller: address, amm: address):
            """
            @notice Set new implementations (blueprints) for controller and amm. Doesn't change existing ones
            @param controller Address of the controller blueprint
            @param amm Address of the AMM blueprint
            """
            assert msg.sender == self.admin
            assert controller != empty(address)
            assert amm != empty(address)
            self.controller_implementation = controller
            self.amm_implementation = amm
            log SetImplementations(amm, controller)
        ```

    === "Example"
        ```shell
        >>> ControllerFactory.set_implementation("new controller implementation, new amm implementation")
        ``` 


## **Admin Ownership**
### `admin`
!!! description "`ControllerFactory.admin() -> address: view`"

    Getter for the admin of the contract.

    Returns: admin `address`.

    ??? quote "Source code"

        ```python hl_lines="1 5 16"
        admin: public(address)

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
        >>> ControllerFactory.admin()
        '0x40907540d8a6C65c637785e8f8B742ae6b0b9968'
        ```


### `set_admin`
!!! description "`ControllerFactory.set_admin(admin: address):`"

    Function to set the admin of the contract.

    Emits event: `SetAdmin`

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `admin` |  `address` | Address of the admin |

    !!!note 
        **`set_admin`** can only be called by the `admin` of the contract.  

    ??? quote "Source code"

        ```python hl_lines="1 8"
        event SetAdmin:
            admin: address

        admin: public(address)

        @external
        @nonreentrant('lock')
        def set_admin(admin: address):
            """
            @notice Set admin of the factory (should end up with DAO)
            @param admin Address of the admin
            """
            assert msg.sender == self.admin
            self.admin = admin
            log SetAdmin(admin)
        ```

    === "Example"
        ```shell
        >>> ControllerFactory.set_admin("0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045")
        ```