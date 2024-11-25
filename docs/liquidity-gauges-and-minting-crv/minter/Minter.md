<h1>Minter</h1>

The `Minter` is responsible for the **issuance and distribution of CRV tokens** to liquidity providers. It acts as a mechanism to reward users who provide liquidity to Curve's pools. The contract essentially calculates the amount of CRV tokens to be allocated based on various factors such as the duration and amount of liquidity provided.


???+vyper "`Minter.vy`"
    The source code for the `Minter.vy` contract is available on  [:material-github: GitHub](https://github.com/curvefi/curve-dao-contracts/blob/master/contracts/Minter.vy). The contract is written in [Vyper](https://vyperlang.org/) version 0.2.4.

    The contract is deployed on :logos-ethereum: Ethereum at [0xe8d1e2531761406af1615a6764b0d5ff52736f56](https://etherscan.io/address/0xe8d1e2531761406af1615a6764b0d5ff52736f56#code).


---


## **Minting CRV**

CRV tokens can be minted in several ways:

- [`mint`](#mint): simple function which mints the elegible CRV tokens to `msg.sender` from a single gauge
- [`mint_many`](#mint_many): function to mint the elegible CRV for `msg.sender` for multiple gauges at once
- [`mint_for`](#mint_for): function to mint CRV for someone else and send it to them. Approval needs to be granted via [`toggle_approve_mint`](#toggle_approve_mint)


### `mint`
!!! description "`Minter.mint(gauge_addr: address)`"

    Function to mint CRV for the caller from a single gauge.

    Emits: `Minted` event.

    | Input        | Type      | Description     |
    | ------------ | --------- | --------------- |
    | `gauge_addr` | `address` | Gauge address to get mintable CRV amount from |

    ??? quote "Source code"

        === "Minter.vy"

            ```vyper
            interface LiquidityGauge:
                # Presumably, other gauges will provide the same interfaces
                def integrate_fraction(addr: address) -> uint256: view
                def user_checkpoint(addr: address) -> bool: nonpayable

            interface MERC20:
                def mint(_to: address, _value: uint256) -> bool: nonpayable

            event Minted:
                recipient: indexed(address)
                gauge: address
                minted: uint256

            # user -> gauge -> value
            minted: public(HashMap[address, HashMap[address, uint256]])

            @external
            @nonreentrant('lock')
            def mint(gauge_addr: address):
                """
                @notice Mint everything which belongs to `msg.sender` and send to them
                @param gauge_addr `LiquidityGauge` address to get mintable amount from
                """
                self._mint_for(gauge_addr, msg.sender)

            @internal
            def _mint_for(gauge_addr: address, _for: address):
                assert GaugeController(self.controller).gauge_types(gauge_addr) >= 0  # dev: gauge is not added

                LiquidityGauge(gauge_addr).user_checkpoint(_for)
                total_mint: uint256 = LiquidityGauge(gauge_addr).integrate_fraction(_for)
                to_mint: uint256 = total_mint - self.minted[_for][gauge_addr]

                if to_mint != 0:
                    MERC20(self.token).mint(_for, to_mint)
                    self.minted[_for][gauge_addr] = total_mint

                    log Minted(_for, gauge_addr, total_mint)
            ```

    === "Example"

        This example mints all CRV for the caller from `0xe5d5aa1bbe72f68df42432813485ca1fc998de32` (LDO/ETH gauge).

        ```shell
        >>> Minter.mint('0xe5d5aa1bbe72f68df42432813485ca1fc998de32')
        ```


### `mint_for`
!!! description "`Minter.mint_for(gauge_addr: address, _for: address)`"

    Function to mint CRV for a different address and transfer it to them. In order to do this, the caller must have been previously approved by `for` using [`toggle_approve_mint`](#toggle_approve_mint).
    
    Emits: `Minted` event.

    | Input        | Type      | Description     |
    | ------------ | --------- | --------------- |
    | `gauge_addr` | `address` | Gauge address to get mintable CRV amount from |
    | `_for`       | `address` | Address to mint to |

    ??? quote "Source code"

        === "Minter.vy"

            ```vyper
            interface LiquidityGauge:
                # Presumably, other gauges will provide the same interfaces
                def integrate_fraction(addr: address) -> uint256: view
                def user_checkpoint(addr: address) -> bool: nonpayable

            interface MERC20:
                def mint(_to: address, _value: uint256) -> bool: nonpayable

            event Minted:
                recipient: indexed(address)
                gauge: address
                minted: uint256

            # user -> gauge -> value
            minted: public(HashMap[address, HashMap[address, uint256]])

            # minter -> user -> can mint?
            allowed_to_mint_for: public(HashMap[address, HashMap[address, bool]])

            @external
            @nonreentrant('lock')
            def mint_for(gauge_addr: address, _for: address):
                """
                @notice Mint tokens for `_for`
                @dev Only possible when `msg.sender` has been approved via `toggle_approve_mint`
                @param gauge_addr `LiquidityGauge` address to get mintable amount from
                @param _for Address to mint to
                """
                if self.allowed_to_mint_for[msg.sender][_for]:
                    self._mint_for(gauge_addr, _for)

            @internal
            def _mint_for(gauge_addr: address, _for: address):
                assert GaugeController(self.controller).gauge_types(gauge_addr) >= 0  # dev: gauge is not added

                LiquidityGauge(gauge_addr).user_checkpoint(_for)
                total_mint: uint256 = LiquidityGauge(gauge_addr).integrate_fraction(_for)
                to_mint: uint256 = total_mint - self.minted[_for][gauge_addr]

                if to_mint != 0:
                    MERC20(self.token).mint(_for, to_mint)
                    self.minted[_for][gauge_addr] = total_mint

                    log Minted(_for, gauge_addr, total_mint)
            ```

    === "Example"

        This example mints all CRV for `0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045` from the gauge with the address `0xe5d5aa1bbe72f68df42432813485ca1fc998de32`.

        ```shell
        >>> Minter.mint_for('0xe5d5aa1bbe72f68df42432813485ca1fc998de32', '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045')
        ```


### `mint_many`
!!! description "`Minter.mint_many(gauge_addrs: address[8])`"

    Function to mint CRV for the caller from multiple gauges. This function does not allow for minting for or to different addresses. It claims for `msgs.ender` and transfers the minted tokens to them. The maximum number of gauges that can be specified is eight. For example, if only minting from one gauge, leave the remaining array entries as `ZERO_ADDRESS`.

    Emits: `Minted` event.

    | Input         | Type         | Description |
    | ------------- | ------------ | ----------- |
    | `gauge_addrs` | `address[8]` | List of gauge addresses to mint from |

    ??? quote "Source code"

        === "Minter.vy"

            ```vyper
            interface LiquidityGauge:
                # Presumably, other gauges will provide the same interfaces
                def integrate_fraction(addr: address) -> uint256: view
                def user_checkpoint(addr: address) -> bool: nonpayable

            interface MERC20:
                def mint(_to: address, _value: uint256) -> bool: nonpayable

            event Minted:
                recipient: indexed(address)
                gauge: address
                minted: uint256

            # user -> gauge -> value
            minted: public(HashMap[address, HashMap[address, uint256]])

            # minter -> user -> can mint?
            allowed_to_mint_for: public(HashMap[address, HashMap[address, bool]])

            @external
            @nonreentrant('lock')
            def mint_many(gauge_addrs: address[8]):
                """
                @notice Mint everything which belongs to `msg.sender` across multiple gauges
                @param gauge_addrs List of `LiquidityGauge` addresses
                """
                for i in range(8):
                    if gauge_addrs[i] == ZERO_ADDRESS:
                        break
                    self._mint_for(gauge_addrs[i], msg.sender)

            @internal
            def _mint_for(gauge_addr: address, _for: address):
                assert GaugeController(self.controller).gauge_types(gauge_addr) >= 0  # dev: gauge is not added

                LiquidityGauge(gauge_addr).user_checkpoint(_for)
                total_mint: uint256 = LiquidityGauge(gauge_addr).integrate_fraction(_for)
                to_mint: uint256 = total_mint - self.minted[_for][gauge_addr]

                if to_mint != 0:
                    MERC20(self.token).mint(_for, to_mint)
                    self.minted[_for][gauge_addr] = total_mint

                    log Minted(_for, gauge_addr, total_mint)
            ```

    === "Example"
    
        This example mints all CRV for the caller from three gauges at once.

        ```shell
        >>> Minter.mint_many('0xe5d5aa1bbe72f68df42432813485ca1fc998de32', '0xbfcf63294ad7105dea65aa58f8ae5be2d9d0952a' '0xb9bdcdcd7c3c1a3255402d44639cb6c7281833cf', '0x0000000000000000000000000000000000000000')
        ```


### `allowed_to_mint_for`
!!! description "`Minter.allowed_to_mint_for(arg0: address, arg1: address) -> bool: view`"

    Function to check if a specific user can mint for another user. Allowance is toggled using the [`toggle_approve_mint`](#toggle_approve_mint) function.

    Returns: true or false (`bool`).

    | Input  | Type      | Description       |
    | ------ | --------- | ----------------- |
    | `arg0` | `address` | Address of minter |
    | `arg1` | `address` | Address of user   |

    ??? quote "Source code"

        === "Minter.vy"

            ```vyper
            # minter -> user -> can mint?
            allowed_to_mint_for: public(HashMap[address, HashMap[address, bool]])
            ```

    === "Example"

        This example checks if `0x989AEb4d175e16225E39E87d0D97A3360524AD80` can mint for `0xF147b8125d2ef93FB6965Db97D6746952a133934`.

        ```shell
        >>> Minter.allowed_to_mint_for('0x989AEb4d175e16225E39E87d0D97A3360524AD80', '0xF147b8125d2ef93FB6965Db97D6746952a133934')
        False
        ```


### `toggle_approve_mint`
!!! description "`Minter.toggle_approve_mint(minting_user: address)`"

    Function to toggle approval for a user to mint CRV on behalf of the caller.

    | Input          | Type      | Description     |
    | -------------- | --------- | --------------- |
    | `minting_user` | `address` | Address to toggle permission for |

    ??? quote "Source code"

        === "Minter.vy"

            ```vyper
            # minter -> user -> can mint?
            allowed_to_mint_for: public(HashMap[address, HashMap[address, bool]])

            @external
            def toggle_approve_mint(minting_user: address):
                """
                @notice allow `minting_user` to mint for `msg.sender`
                @param minting_user Address to toggle permission for
                """
                self.allowed_to_mint_for[minting_user][msg.sender] = not self.allowed_to_mint_for[minting_user][msg.sender]
            ```

    === "Example"

        This example toggles approval for `0x989AEb4d175e16225E39E87d0D97A3360524AD80` to mint for `0xF147b8125d2ef93FB6965Db97D6746952a133934`.

        ```shell
        >>> Minter.allowed_to_mint_for('0x989AEb4d175e16225E39E87d0D97A3360524AD80', '0xF147b8125d2ef93FB6965Db97D6746952a133934')
        False

        >>> Minter.toggle_approve_mint('0x989AEb4d175e16225E39E87d0D97A3360524AD80')

        >>> Minter.allowed_to_mint_for('0x989AEb4d175e16225E39E87d0D97A3360524AD80', '0xF147b8125d2ef93FB6965Db97D6746952a133934')
        True
        ```


### `minted`
!!! description "`Minter.minted(arg0: address, arg1: address) -> uint256: view`"

    Getter for the total amount of CRV minted from a specific gauge to a specific user.

    Returns: amount of CRV minted (`uint256`).

    | Input  | Type      | Description   |
    | ------ | --------- | ------------- |
    | `arg0` | `address` | User address  |
    | `arg1` | `address` | Gauge address |

    ??? quote "Source code"

        === "Minter.vy"

            ```vyper
            # user -> gauge -> value
            minted: public(HashMap[address, HashMap[address, uint256]])
            ```

    === "Example"

        This example gets the total amount of CRV minted from `0xe5d5aa1bbe72f68df42432813485ca1fc998de32` to `0x989AEb4d175e16225E39E87d0D97A3360524AD80`.

        ```shell
        >>> Minter.minted('0x989AEb4d175e16225E39E87d0D97A3360524AD80', '0xe5d5aa1bbe72f68df42432813485ca1fc998de32')
        2464666834080877175814487
        ```


---


## **Other Methods**

### `token`
!!! description "`Minter.token() -> address: view`"

    Getter for the token address of Curve DAO Token (CRV). This varible is set at initialization and can not be changed after.

    Returns: CRV token contract (`address`).

    ??? quote "Source code"

        === "Minter.vy"

            ```vyper
            token: public(address)

            @external
            def __init__(_token: address, _controller: address):
                self.token = _token
                self.controller = _controller
            ```

    === "Example"

        This example returns the CRV token address.

        ```shell
        >>> Minter.token()
        '0xD533a949740bb3306d119CC777fa900bA034cd52'
        ```


### `controller`
!!! description "`Minter.controller() -> address: view`"

    Getter for the `GaugeController`. 

    Returns: `GaugeController` contract (`address`).

    ??? quote "Source code"

        === "Minter.vy"

            ```vyper
            controller: public(address)

            @external
            def __init__(_token: address, _controller: address):
                self.token = _token
                self.controller = _controller
            ```

    === "Example"

        This example returns the `GaugeController` contract.

        ```shell
        >>> Minter.controller()
        '0x2F50D538606Fa9EDD2B11E2446BEb18C9D5846bB'
        ```
