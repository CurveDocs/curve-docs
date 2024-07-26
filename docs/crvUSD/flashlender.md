<h1>FlashLender</h1>

The `FlashLender.vy` contract is an [`ERC-3156`](https://eips.ethereum.org/EIPS/eip-3156) contract that allows users to take out a flash loan for `crvUSD`. The flash loan must be repaid within the same transaction; otherwise, the transaction will revert.

!!!github "GitHub"
    The source code for the `FlashLender.vy` contract can be found on [GitHub :material-github:](https://github.com/curvefi/curve-stablecoin/blob/master/contracts/flashloan/FlashLender.vy). Additionally, a `DummyFlashBorrower.vy` contract showcasing a potential usage of a flash loan can also be found on [:material-github: GitHub](https://github.com/curvefi/curve-stablecoin/blob/master/contracts/testing/DummyFlashBorrower.vy).

The contract does not charge any fees on flash loans. The `fee` and `flashFee` methods are implemented to comply with the `ERC-3156` standard.

!!! warning "CONTRACT IS NOT YET OPERATIONAL: PENDING DAO VOTE"
    This contract is not yet operational. Currently, there is an [ongoing DAO vote](https://curvemonitor.com/#/dao/proposal/ownership/812) to mint 1 million `crvUSD` to the `FlashLender` using the `set_debt_ceiling` method on the `Factory` contract. If the vote passes, flash loans up to 1 million `crvUSD` will be possible.


---


### `flashLoan`
!!! description "`FlashLender.flashLoan(receiver: ERC3156FlashBorrower, token: address, amount: uint256, data: Bytes[10**5]) -> bool`"

    Function to take out a flash loan of `amount` of `token` and send them to the `receiver`. The `receiver` address must be a contract that implements the `onFlashLoan(initiator: address, token: address, amount: uint256, fee: uint256, data: Bytes[10**5])` interface. A flash loan must be repaid within the same transaction; otherwise, the transaction will revert. Additionally, the method allows passing custom `data` to the `receiver` contract.

    Returns: `True` (`bool`)

    Emits: `FlashLoan`

    | Input      | Type                   | Description                                   |
    | ---------- | ---------------------- | --------------------------------------------- |
    | `receiver` | `ERC3156FlashBorrower` | Contract to receive the flash loan            |
    | `token`    | `address`              | Address of the token to take the flash loan in|
    | `amount`   | `uint256`              | Amount of tokens to flash loan                |
    | `data`     | `Bytes[10**5]`         | Custom data to pass to the receiver contract  |

    ??? quote "Source code"

        The following source code includes all changes up to commit hash [`53b7086`](https://github.com/curvefi/curve-stablecoin/tree/53b70869af3552dd1c61a7f5e1e86c718d440953); any changes made after this commit are not included.

        === "FlashLender.vy"

            ```py
            from vyper.interfaces import ERC20

            event FlashLoan:
                caller: indexed(address)
                receiver: indexed(address)
                amount: uint256

            CRVUSD: immutable(address)
            fee: public(constant(uint256)) = 0  # 1 == 0.01 %

            @external
            @nonreentrant('lock')
            def flashLoan(receiver: ERC3156FlashBorrower, token: address, amount: uint256, data: Bytes[10**5]) -> bool:
                """
                @notice Loan `amount` tokens to `receiver`, and takes it back plus a `flashFee` after the callback
                @param receiver The contract receiving the tokens, needs to implement the
                `onFlashLoan(initiator: address, token: address, amount: uint256, fee: uint256, data: Bytes[10**5])` interface.
                @param token The loan currency.
                @param amount The amount of tokens lent.
                @param data A data parameter to be passed on to the `receiver` for any custom use.
                """
                assert token == CRVUSD, "FlashLender: Unsupported currency"
                crvusd_balance: uint256 = ERC20(CRVUSD).balanceOf(self)
                ERC20(CRVUSD).transfer(receiver.address, amount)
                receiver.onFlashLoan(msg.sender, CRVUSD, amount, 0, data)
                assert ERC20(CRVUSD).balanceOf(self) == crvusd_balance, "FlashLender: Repay failed"

                log FlashLoan(msg.sender, receiver.address, amount)

                return True
            ```

    === "Example"

        ```shell
        >>> soon
        ```


### `maxFlashLoan`
!!! description "`FlashLender.maxFlashLoan(token: address) -> uint256`"

    Getter for the maximum amount of flash-loanable tokens. This corresponds to the token balance of the contract (`token.balanceOf(FlashLender)`).

    Returns: maximum flash-loanable amount (`uint256`)

    | Input   | Type      | Description                                                  |
    | ------- | --------- | ------------------------------------------------------------ |
    | `token` | `address` | Token address to check the maximum flash-loanable amount for |

    ??? quote "Source code"

        The following source code includes all changes up to commit hash [`53b7086`](https://github.com/curvefi/curve-stablecoin/tree/53b70869af3552dd1c61a7f5e1e86c718d440953); any changes made after this commit are not included.

        === "FlashLender.vy"

            ```py
            from vyper.interfaces import ERC20

            CRVUSD: immutable(address)
            fee: public(constant(uint256)) = 0  # 1 == 0.01 %

            @external
            @view
            def maxFlashLoan(token: address) -> uint256:
                """
                @notice The amount of currency available to be lent.
                @param token The loan currency.
                @return The amount of `token` that can be borrowed.
                """
                if token == CRVUSD:
                    return ERC20(CRVUSD).balanceOf(self)
                else:
                    return 0
            ```

    === "Example"

        Calling the function with the `crvUSD` address as input will return the flash-loanable amount. Calling the function with any other token than `crvUSD` will return `0`. Currently, the function returns `0` as there is no `crvUSD` in the contract. As soon as the [ongoing governance vote](https://curvemonitor.com/dao/proposal/ownership/812) passes, the contract will be funded with 1,000,000 `crvUSD`.

        ```shell
        >>> FlashLender.maxFlashLoan('0xf939E0A03FB07F59A73314E73794Be0E57ac1b4E')
        0
        ```


### `fee`
!!! description "`FlashLender.fee() -> uint256: view`"

    Getter for the fee charged on the flash loan. This variable is a constant set to `0` and cannot be changed. The fees for the contract will always remain at `0`.

    Returns: fee (`uint256`).

    ??? quote "Source code"

        The following source code includes all changes up to commit hash [`53b7086`](https://github.com/curvefi/curve-stablecoin/tree/53b70869af3552dd1c61a7f5e1e86c718d440953); any changes made after this commit are not included.

        === "FlashLender.vy"

            ```py
            fee: public(constant(uint256)) = 0  # 1 == 0.01 %
            ```

    === "Example"

        ```shell
        >>> FlashLender.fee()
        0
        ```


### `flashFee`
!!! description "`FlashLender.flashFee(token: address, amount: uint256) -> uint256`"

    Getter for the flash fee when taking out a flash loan of `amount` of `token`. This method will always return `0`.

    Returns: total fee charged on the flashloan (`uint256`).

    | Input    | Type      | Description                               |
    | -------- | --------- | ----------------------------------------- |
    | `token`  | `address` | Address of the token for the flash loan   |
    | `amount` | `uint256` | Amount of tokens to be flash loaned       |

    ??? quote "Source code"

        The following source code includes all changes up to commit hash [`53b7086`](https://github.com/curvefi/curve-stablecoin/tree/53b70869af3552dd1c61a7f5e1e86c718d440953); any changes made after this commit are not included.

        === "FlashLender.vy"

            ```py
            CRVUSD: immutable(address)

            @external
            @view
            def flashFee(token: address, amount: uint256) -> uint256:
                """
                @notice The fee to be charged for a given loan.
                @param token The loan currency.
                @param amount The amount of tokens lent.
                @return The amount of `token` to be charged for the loan, on top of the returned principal.
                """
                assert token == CRVUSD, "FlashLender: Unsupported currency"
                return 0
            ```

    === "Example"

        This method will always return `0` for any amount of flash loaned `crvUSD` because the `fee` is `0`. If the function is called with any token other than `crvUSD`, the function will revert.

        ```shell
        >>> FlashLender.flashFee('0xf939E0A03FB07F59A73314E73794Be0E57ac1b4E', 100000 * 10**18)
        0

        >>> FlashLender.flashFee('0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', 100000 * 10**18)
        reverts: "FlashLender: Unsupported currency"
        ```


### `supportedTokens`
!!! description "`FlashLender.supportedTokens(token: address) -> bool`"

    Getter for the supported token by the `FlashLender`. The only supported token is `crvUSD`. Due to the immutability of the contract, no further supported tokens can be added.

    Returns: `True` or `False` (`bool`).

    | Input   | Type      | Description                               |
    | ------- | --------- | ----------------------------------------- |
    | `token` | `address` | Token address to check support status for |

    ??? quote "Source code"

        The following source code includes all changes up to commit hash [`53b7086`](https://github.com/curvefi/curve-stablecoin/tree/53b70869af3552dd1c61a7f5e1e86c718d440953); any changes made after this commit are not included.

        === "FlashLender.vy"

            ```py
            CRVUSD: immutable(address)

            @external
            @view
            def supportedTokens(token: address) -> bool:
                return token == CRVUSD
            ```

    === "Example"

        ```shell
        >>> FlashLender.supportedTokens('0xf939E0A03FB07F59A73314E73794Be0E57ac1b4E')
        'true'
        ```


### `version`
!!! description "`FlashLender.version() -> String[8]: view`"

    Getter for the version of the contract.

    Returns: contract version (`String[8]`).

    ??? quote "Source code"

        The following source code includes all changes up to commit hash [`53b7086`](https://github.com/curvefi/curve-stablecoin/tree/53b70869af3552dd1c61a7f5e1e86c718d440953); any changes made after this commit are not included.

        === "FlashLender.vy"

            ```py
            version: public(constant(String[8])) = "1.0.0"  # Initial
            ```

    === "Example"

        ```shell
        >>> FlashLender.version()
        "1.0.0"
        ```
