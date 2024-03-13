<h1>Vault</h1>

The vault is an **implementation of a [ERC-4626](https://ethereum.org/developers/docs/standards/tokens/erc-4626)** vault which **deposits the underlying asset into the controller** and **tracks the progress of the fees earned**. It is a standard (non-blueprint) contract which also creates AMM and Controller using `initialize()`.

??? quote "`initialize()`"

    Function which initializes a vault and creates the corresponding Controller and AMM from their blueprint implementations.

    ```vyper
    @external
    def initialize(
            amm_impl: address,
            controller_impl: address,
            borrowed_token: ERC20,
            collateral_token: ERC20,
            A: uint256,
            fee: uint256,
            price_oracle: PriceOracle,  # Factory makes from template if needed, deploying with a from_pool()
            monetary_policy: address,  # Standard monetary policy set in factory
            loan_discount: uint256,
            liquidation_discount: uint256
        ) -> (address, address):
        """
        @notice Initializer for vaults
        @param amm_impl AMM implementation (blueprint)
        @param controller_impl Controller implementation (blueprint)
        @param borrowed_token Token which is being borrowed
        @param collateral_token Token used for collateral
        @param A Amplification coefficient: band size is ~1/A
        @param fee Fee for swaps in AMM (for ETH markets found to be 0.6%)
        @param price_oracle Already initialized price oracle
        @param monetary_policy Already initialized monetary policy
        @param loan_discount Maximum discount. LTV = sqrt(((A - 1) / A) ** 4) - loan_discount
        @param liquidation_discount Liquidation discount. LT = sqrt(((A - 1) / A) ** 4) - liquidation_discount
        """
        assert self.borrowed_token.address == empty(address)

        self.borrowed_token = borrowed_token
        self.collateral_token = collateral_token
        self.price_oracle = price_oracle

        assert A >= MIN_A and A <= MAX_A, "Wrong A"
        assert fee <= MAX_FEE, "Fee too high"
        assert fee >= MIN_FEE, "Fee too low"
        assert liquidation_discount >= MIN_LIQUIDATION_DISCOUNT, "Liquidation discount too low"
        assert loan_discount <= MAX_LOAN_DISCOUNT, "Loan discount too high"
        assert loan_discount > liquidation_discount, "need loan_discount>liquidation_discount"

        p: uint256 = price_oracle.price()  # This also validates price oracle ABI
        assert p > 0
        assert price_oracle.price_w() == p
        A_ratio: uint256 = 10**18 * A / (A - 1)

        borrowed_precision: uint256 = 10**(18 - borrowed_token.decimals())

        amm: address = create_from_blueprint(
            amm_impl,
            borrowed_token.address, borrowed_precision,
            collateral_token.address, 10**(18 - collateral_token.decimals()),
            A, isqrt(A_ratio * 10**18), self.ln_int(A_ratio),
            p, fee, ADMIN_FEE, price_oracle.address,
            code_offset=3)
        controller: address = create_from_blueprint(
            controller_impl,
            empty(address), monetary_policy, loan_discount, liquidation_discount, amm,
            code_offset=3)
        AMM(amm).set_admin(controller)

        self.amm = AMM(amm)
        self.controller = Controller(controller)
        self.factory = Factory(msg.sender)

        # ERC20 set up
        self.precision = borrowed_precision
        borrowed_symbol: String[32] = borrowed_token.symbol()
        self.name = concat(NAME_PREFIX, borrowed_symbol)
        # Symbol must be String[32], but we do String[34]. It doesn't affect contracts which read it (they will truncate)
        # However this will be changed as soon as Vyper can *properly* manipulate strings
        self.symbol = concat(SYMBOL_PREFIX, borrowed_symbol)

        # No events because it's the only market we would ever create in this contract

        return controller, amm
    ```

The Vault itself does not hold any tokens, as the deposited tokens are forwarded to the Controller contract where it can be borrowed from.

*Unlike standard ERC4626 methods, it also has:*

- `borrow_apr()`
- `lend_apr()`
- `pricePerShare()`

Additionally, methods like `mint()`, `deposit()`, `redeem()`, and `withdraw()` can have the receiver address not specified. In such cases, the receiver address defaults to `msg.sender`.


---


## **Depositing Assets and Minting Shares**

*Two methods for acquiring shares in an ERC4626 Vault:*

- **Deposit**: A lender deposits a specified amount of the underlying (borrowable) token into the vault. In exchange, the user receives an equivalent number of shares.
- **Mint**: A lender specifies the desired number of shares to receive and deposits the required amount of the underlying (borrowable) asset to mint these shares. This method allows a user to obtain a precise number of shares.


### `deposit`
!!! description "`Vault.deposit(assets: uint256, receiver: address = msg.sender) -> uint256:`"

    Function to deposit a specified number of assets of the underlying token (`borrowed_token`) into the vault and mint the corresponding amount of shares to `receiver`.

    Returns: minted shares (`uint256`).

    Emits: `Deposit`, `Transfer` and `SetRate`

    | Input       | Type      | Description                                                           |
    |-------------|-----------|-----------------------------------------------------------------------|
    | `assets`    | `uint256` | Number of assets to deposit.                                          |
    | `receiver`  | `address` | Receiver of the minted shares. Defaults to `msg.sender`.              |

    ??? quote "Source code"

        === "Vault.vy"

            ```vyper
            event Transfer:
                sender: indexed(address)
                receiver: indexed(address)
                value: uint256

            event Deposit:
                sender: indexed(address)
                owner: indexed(address)
                assets: uint256
                shares: uint256

            @external
            @nonreentrant('lock')
            def deposit(assets: uint256, receiver: address = msg.sender) -> uint256:
                """
                @notice Deposit assets in return for whatever number of shares corresponds to the current conditions
                @param assets Amount of assets to deposit
                @param receiver Receiver of the shares who is optional. If not specified - receiver is the sender
                """
                controller: Controller = self.controller
                total_assets: uint256 = self._total_assets()
                assert total_assets + assets >= MIN_ASSETS, "Need more assets"
                to_mint: uint256 = self._convert_to_shares(assets, True, total_assets)
                assert self.borrowed_token.transferFrom(msg.sender, controller.address, assets, default_return_value=True)
                self._mint(receiver, to_mint)
                controller.save_rate()
                log Deposit(msg.sender, receiver, assets, to_mint)
                return to_mint

            @internal
            def _mint(_to: address, _value: uint256):
                self.balanceOf[_to] += _value
                self.totalSupply += _value

                log Transfer(empty(address), _to, _value)

            @internal
            @view
            def _total_assets() -> uint256:
                # admin fee should be accounted for here when enabled
                self.controller.check_lock()
                return self.borrowed_token.balanceOf(self.controller.address) + self.controller.total_debt()

            @internal
            @view
            def _convert_to_shares(assets: uint256, is_floor: bool = True,
                                _total_assets: uint256 = max_value(uint256)) -> uint256:
                total_assets: uint256 = _total_assets
                if total_assets == max_value(uint256):
                    total_assets = self._total_assets()
                precision: uint256 = self.precision
                numerator: uint256 = (self.totalSupply + DEAD_SHARES) * assets * precision
                denominator: uint256 = (total_assets * precision + 1)
                if is_floor:
                    return numerator / denominator
                else:
                    return (numerator + denominator - 1) / denominator
            ```

        === "Controller.vy"

            ```vyper
            interface MonetaryPolicy:
                def rate_write() -> uint256: nonpayable

            monetary_policy: public(MonetaryPolicy)

            @external
            @nonreentrant('lock')
            def save_rate():
                """
                @notice Save current rate
                """
                self._save_rate()

            @internal
            def _save_rate():
                """
                @notice Save current rate
                """
                rate: uint256 = min(self.monetary_policy.rate_write(), MAX_RATE)
                AMM.set_rate(rate)
            ```

        === "MonetaryPolicy.vy"

            ```vyper
            log_min_rate: public(int256)
            log_max_rate: public(int256)

            @external
            def rate_write(_for: address = msg.sender) -> uint256:
                return self.calculate_rate(_for, 0, 0)

            @internal
            @view
            def calculate_rate(_for: address, d_reserves: int256, d_debt: int256) -> uint256:
                total_debt: int256 = convert(Controller(_for).total_debt(), int256)
                total_reserves: int256 = convert(BORROWED_TOKEN.balanceOf(_for), int256) + total_debt + d_reserves
                total_debt += d_debt
                assert total_debt >= 0, "Negative debt"
                assert total_reserves >= total_debt, "Reserves too small"
                if total_debt == 0:
                    return self.min_rate
                else:
                    log_min_rate: int256 = self.
                    log_max_rate: int256 = self.log_max_rate
                    return self.exp(total_debt * (log_max_rate - log_min_rate) / total_reserves + log_min_rate)
            ```
            
        === "AMM.vy"

            ```vyper
            event SetRate:
                rate: uint256
                rate_mul: uint256
                time: uint256

            @external
            @nonreentrant('lock')
            def set_rate(rate: uint256) -> uint256:
                """
                @notice Set interest rate. That affects the dependence of AMM base price over time
                @param rate New rate in units of int(fraction * 1e18) per second
                @return rate_mul multiplier (e.g. 1.0 + integral(rate, dt))
                """
                assert msg.sender == self.admin
                rate_mul: uint256 = self._rate_mul()
                self.rate_mul = rate_mul
                self.rate_time = block.timestamp
                self.rate = rate
                log SetRate(rate, rate_mul, block.timestamp)
                return rate_mul

            @internal
            @view
            def _rate_mul() -> uint256:
                """
                @notice Rate multiplier which is 1.0 + integral(rate, dt)
                @return Rate multiplier in units where 1.0 == 1e18
                """
                return unsafe_div(self.rate_mul * (10**18 + self.rate * (block.timestamp - self.rate_time)), 10**18)
            ```

    === "Example"
        ```shell
        In  [1]:  Vault.balanceOf(trader)
        Out [1]:  0

        In  [2]:  Vault.deposit(1000000000000000000)

        In  [3]:  Vault.balanceOf(trader)
        Out [3]:  997552662404145514069
        ```


### `maxDeposit`
!!! description "`Vault.maxDeposit(receiver: address) -> uint256:`"

    Getter for the maximum amount of assets `receiver` can deposit. Essentially equals to `max_value(uint256)`.

    Returns: maximum depositable assets (`uint256`).

    | Input       | Type      | Description          |
    |-------------|-----------|----------------------|
    | `receiver`  | `address` | Address of the user. |

    ??? quote "Source code"

        === "Vault.vy"

            ```vyper
            balanceOf: public(HashMap[address, uint256])

            @external
            @view
            def maxDeposit(receiver: address) -> uint256:
                """
                @notice Maximum amount of assets which a given user can deposit (inf)
                """
                return self.borrowed_token.balanceOf(receiver)
            ```

    === "Example"
        ```shell
        >>> Vault.maxDeposit("0x7a16fF8270133F063aAb6C9977183D9e72835428"):
        should return borrowed_token.balanceOf("0x7a16fF8270133F063aAb6C9977183D9e72835428")
        ```


### `previewDeposit`
!!! description "`Vault.previewDeposit(assets: uint256) -> uint256:`"

    Function to simulate the effects of depositing `assets` into the vault based on the current state.

    Returns: amount of shares to be received (`uint256`).

    | Input     | Type      | Description            |
    |-----------|-----------|------------------------|
    | `assets`  | `uint256` | Number of assets to deposit. |

    ??? quote "Source code"

        === "Vault.vy"

            ```vyper
            @external
            @view
            @nonreentrant('lock')
            def previewDeposit(assets: uint256) -> uint256:
                """
                @notice Returns the amount of shares which can be obtained upon depositing assets
                """
                return self._convert_to_shares(assets)

            @internal
            @view
            def _convert_to_shares(assets: uint256, is_floor: bool = True,
                                _total_assets: uint256 = max_value(uint256)) -> uint256:
                total_assets: uint256 = _total_assets
                if total_assets == max_value(uint256):
                    total_assets = self._total_assets()
                precision: uint256 = self.precision
                numerator: uint256 = (self.totalSupply + DEAD_SHARES) * assets * precision
                denominator: uint256 = (total_assets * precision + 1)
                if is_floor:
                    return numerator / denominator
                else:
                    return (numerator + denominator - 1) / denominator
            ```

    === "Example"
        ```shell
        >>> Vault.previewDeposit(1000000000000000000):      # depositing 1 crvusd 
        998709265069121019738                               # shares to receive
        ```


### `mint`
!!! description "`Vault.mint(shares: uint256, receiver: address = msg.sender) -> uint256:`"

    Function to mint a specific amount of shares (`shares`) to `receiver` by depositing the necessary number of assets into the vault.

    Returns: number of assets deposited (`uint256`).

    Emits: `Deposit`, `Transfer` and `SetRate`

    | Input       | Type      | Description                                                      |
    |-------------|-----------|------------------------------------------------------------------|
    | `shares`    | `uint256` | Number of shares to be minted.                                   |
    | `receiver`  | `address` | Receiver of the minted shares. Defaults to `msg.sender`.         |

    ??? quote "Source code"

        === "Vault.vy"

            ```vyper
            event Transfer:
                sender: indexed(address)
                receiver: indexed(address)
                value: uint256

            event Deposit:
                sender: indexed(address)
                owner: indexed(address)
                assets: uint256
                shares: uint256

            @external
            @nonreentrant('lock')
            def mint(shares: uint256, receiver: address = msg.sender) -> uint256:
                """
                @notice Mint given amount of shares taking whatever number of assets it requires
                @param shares Number of sharess to mint
                @param receiver Optional receiver for the shares. If not specified - it's the sender
                """
                controller: Controller = self.controller
                total_assets: uint256 = self._total_assets()
                assets: uint256 = self._convert_to_assets(shares, False, total_assets)
                assert total_assets + assets >= MIN_ASSETS, "Need more assets"
                assert self.borrowed_token.transferFrom(msg.sender, controller.address, assets, default_return_value=True)
                self._mint(receiver, shares)
                controller.save_rate()
                log Deposit(msg.sender, receiver, assets, shares)
                return assets

            @internal
            def _mint(_to: address, _value: uint256):
                self.balanceOf[_to] += _value
                self.totalSupply += _value

                log Transfer(empty(address), _to, _value)

            @internal
            @view
            def _total_assets() -> uint256:
                # admin fee should be accounted for here when enabled
                self.controller.check_lock()
                return self.borrowed_token.balanceOf(self.controller.address) + self.controller.total_debt()

            @internal
            @view
            def _convert_to_assets(shares: uint256, is_floor: bool = True,
                                _total_assets: uint256 = max_value(uint256)) -> uint256:
                total_assets: uint256 = _total_assets
                if total_assets == max_value(uint256):
                    total_assets = self._total_assets()
                precision: uint256 = self.precision
                numerator: uint256 = shares * (total_assets * precision + 1)
                denominator: uint256 = (self.totalSupply + DEAD_SHARES) * precision
                if is_floor:
                    return numerator / denominator
                else:
                    return (numerator + denominator - 1) / denominator
            ```

        === "Controller.vy"

            ```vyper
            interface MonetaryPolicy:
                def rate_write() -> uint256: nonpayable

            monetary_policy: public(MonetaryPolicy)

            @external
            @nonreentrant('lock')
            def save_rate():
                """
                @notice Save current rate
                """
                self._save_rate()

            @internal
            def _save_rate():
                """
                @notice Save current rate
                """
                rate: uint256 = min(self.monetary_policy.rate_write(), MAX_RATE)
                AMM.set_rate(rate)
            ```

        === "MonetaryPolicy.vy"

            ```vyper
            log_min_rate: public(int256)
            log_max_rate: public(int256)

            @external
            def rate_write(_for: address = msg.sender) -> uint256:
                return self.calculate_rate(_for, 0, 0)

            @internal
            @view
            def calculate_rate(_for: address, d_reserves: int256, d_debt: int256) -> uint256:
                total_debt: int256 = convert(Controller(_for).total_debt(), int256)
                total_reserves: int256 = convert(BORROWED_TOKEN.balanceOf(_for), int256) + total_debt + d_reserves
                total_debt += d_debt
                assert total_debt >= 0, "Negative debt"
                assert total_reserves >= total_debt, "Reserves too small"
                if total_debt == 0:
                    return self.min_rate
                else:
                    log_min_rate: int256 = self.log_min_rate
                    log_max_rate: int256 = self.log_max_rate
                    return self.exp(total_debt * (log_max_rate - log_min_rate) / total_reserves + log_min_rate)
            ```
            
        === "AMM.vy"

            ```vyper
            event SetRate:
                rate: uint256
                rate_mul: uint256
                time: uint256

            @external
            @nonreentrant('lock')
            def set_rate(rate: uint256) -> uint256:
                """
                @notice Set interest rate. That affects the dependence of AMM base price over time
                @param rate New rate in units of int(fraction * 1e18) per second
                @return rate_mul multiplier (e.g. 1.0 + integral(rate, dt))
                """
                assert msg.sender == self.admin
                rate_mul: uint256 = self._rate_mul()
                self.rate_mul = rate_mul
                self.rate_time = block.timestamp
                self.rate = rate
                log SetRate(rate, rate_mul, block.timestamp)
                return rate_mul

            @internal
            @view
            def _rate_mul() -> uint256:
                """
                @notice Rate multiplier which is 1.0 + integral(rate, dt)
                @return Rate multiplier in units where 1.0 == 1e18
                """
                return unsafe_div(self.rate_mul * (10**18 + self.rate * (block.timestamp - self.rate_time)), 10**18)
            ```

    === "Example"
        ```shell
        In  [1]:  Vault.balanceOf(trader)
        Out [1]:  997552662404145514069

        In  [2]:  Vault.deposit(100000000000000000000)

        In  [3]:  Vault.balanceOf(trader)
        Out [3]:  1097552662404145514069
        ```


### `maxMint`
!!! description "`Vault.maxMint(receiver: address) -> uint256:`"

    Getter for the maximum amount of shares a user can mint. Essentially equals to `max_value(uint256)`.

    Returns: maximum mintable shares (`uint256`).

    | Input      | Type      | Description       |
    |------------|-----------|-------------------|
    | `receiver` | `address` | Address of the user. |

    ??? quote "Source code"

        === "Vault.vy"

            ```vyper
            @external
            @view
            def maxMint(receiver: address) -> uint256:
                """
                @notice Return maximum amount of shares which a given user can mint (inf)
                """
                return max_value(uint256)

            @internal
            @view
            def _convert_to_shares(assets: uint256, is_floor: bool = True,
                                _total_assets: uint256 = max_value(uint256)) -> uint256:
                total_assets: uint256 = _total_assets
                if total_assets == max_value(uint256):
                    total_assets = self._total_assets()
                precision: uint256 = self.precision
                numerator: uint256 = (self.totalSupply + DEAD_SHARES) * assets * precision
                denominator: uint256 = (total_assets * precision + 1)
                if is_floor:
                    return numerator / denominator
                else:
                    return (numerator + denominator - 1) / denominator

            ```

    === "Example"
        ```shell
        >>> Vault.maxMint("0x7a16fF8270133F063aAb6C9977183D9e72835428"):    
        119831204184300884951118160092
        ```


### `previewMint`
!!! description "`Vault.previewMint(shares: uint256) -> uint256:`"

    Function to simulate the number of assets required to mint a specified amount of shares (`shares`) given the current state of the vault.

    Returns: Number of assets required (`uint256`).

    | Input     | Type      | Description             |
    |-----------|-----------|-------------------------|
    | `shares`  | `uint256` | Number of shares to mint. |


    ??? quote "Source code"

        === "Vault.vy"

            ```vyper
            @external
            @view
            @nonreentrant('lock')
            def previewMint(shares: uint256) -> uint256:
                """
                @notice Calculate the amount of assets which is needed to exactly mint the given amount of shares
                """
                return self._convert_to_assets(shares, False)

            @internal
            @view
            def _convert_to_assets(shares: uint256, is_floor: bool = True,
                                _total_assets: uint256 = max_value(uint256)) -> uint256:
                total_assets: uint256 = _total_assets
                if total_assets == max_value(uint256):
                    total_assets = self._total_assets()
                precision: uint256 = self.precision
                numerator: uint256 = shares * (total_assets * precision + 1)
                denominator: uint256 = (self.totalSupply + DEAD_SHARES) * precision
                if is_floor:
                    return numerator / denominator
                else:
                    return (numerator + denominator - 1) / denominator
            ```

    === "Example"
        ```shell
        >>> Vault.previewMint(1000000000000000000):     # mint 1 share
        1001291061639566                                # assets needed deposit to mint 1 share
        ```

### `convertToShares`
!!! description "`Vault.convertToShares(assets: uint256) -> uint256:`"

    Function to calculate the amount of shares received for a given amount of `assets` provided.

    Returns: amount of shares received (`uint256`).

    | Input    | Type      | Description                   |
    |----------|-----------|-------------------------------|
    | `assets` | `uint256` | Amount of assets to convert.  |


    ??? quote "Source code"

        === "Vault.vy"

            ```vyper
            @external
            @view
            @nonreentrant('lock')
            def convertToShares(assets: uint256) -> uint256:
                """
                @notice Returns the amount of shares which the Vault would exchange for the given amount of shares provided
                """
                return self._convert_to_shares(assets)

            @internal
            @view
            def _convert_to_shares(assets: uint256, is_floor: bool = True,
                                _total_assets: uint256 = max_value(uint256)) -> uint256:
                total_assets: uint256 = _total_assets
                if total_assets == max_value(uint256):
                    total_assets = self._total_assets()
                precision: uint256 = self.precision
                numerator: uint256 = (self.totalSupply + DEAD_SHARES) * assets * precision
                denominator: uint256 = (total_assets * precision + 1)
                if is_floor:
                    return numerator / denominator
                else:
                    return (numerator + denominator - 1) / denominator
            ```

    === "Example"
        ```shell
        >>> Vault.convertToShares(1000000000000000000):
        998709265069121019738
        ```


---


## **Withdrawing Assets and Redeeming Shares**

*Two ways to retrieve the underlying asset from an ERC4626 Vault:*

- **Withdraw**: A user withdraws a predefined number of the underlying asset and burns the corresponding amount of shares. This action reduces the user's shares in exchange for the underlying asset.
- **Redeem**: A user redeems (and burns) a predefined number of shares to receive the corresponding amount of the underlying assets. This process decreases the shares owned by the user while increasing their holding of the underlying asset.


### `withdraw`
!!! description "`Vault.withdraw(assets: uint256, receiver: address = msg.sender, owner: address = msg.sender) -> uint256:`"

    Function to withdraw `assets` from `owner` to the `receiver` and burn the corresponding amount of shares.

    Returns: shares withdrawn (`uint256`).

    Emits: `Withdraw`, `Transfer` and `SetRate`

    | Input      | Type     | Description                                        |
    | ---------- | -------- | -------------------------------------------------- |
    | `assets`   | `uint256` | Amount of assets to withdraw.                     |
    | `receiver` | `address` | Receiver of the shares. Defaults to `msg.sender`. |
    | `owner`    | `address` | Address of whose shares to burn. Defaults to `msg.sender`. |

    ??? quote "Source code"

        === "Vault.vy"

            ```vyper
            event Transfer:
                sender: indexed(address)
                receiver: indexed(address)
                value: uint256

            event Withdraw:
                sender: indexed(address)
                receiver: indexed(address)
                owner: indexed(address)
                assets: uint256
                shares: uint256

            @external
            @nonreentrant('lock')
            def withdraw(assets: uint256, receiver: address = msg.sender, owner: address = msg.sender) -> uint256:
                """
                @notice Withdraw given amount of asset and burn the corresponding amount of vault shares
                @param assets Amount of assets to withdraw
                @param receiver Receiver of the assets (optional, sender if not specified)
                @param owner Owner who's shares the caller takes. Only can take those if owner gave the approval to the sender. Optional
                """
                total_assets: uint256 = self._total_assets()
                assert total_assets - assets >= MIN_ASSETS or total_assets == assets, "Need more assets"
                shares: uint256 = self._convert_to_shares(assets, False, total_assets)
                if owner != msg.sender:
                    allowance: uint256 = self.allowance[owner][msg.sender]
                    if allowance != max_value(uint256):
                        self._approve(owner, msg.sender, allowance - shares)

                controller: Controller = self.controller
                self._burn(owner, shares)
                assert self.borrowed_token.transferFrom(controller.address, receiver, assets, default_return_value=True)
                controller.save_rate()
                log Withdraw(msg.sender, receiver, owner, assets, shares)
                return shares

            @internal
            def _burn(_from: address, _value: uint256):
                self.balanceOf[_from] -= _value
                self.totalSupply -= _value

                log Transfer(_from, empty(address), _value)

            @internal
            @view
            def _total_assets() -> uint256:
                # admin fee should be accounted for here when enabled
                self.controller.check_lock()
                return self.borrowed_token.balanceOf(self.controller.address) + self.controller.total_debt()

            @internal
            @view
            def _convert_to_shares(assets: uint256, is_floor: bool = True,
                                _total_assets: uint256 = max_value(uint256)) -> uint256:
                total_assets: uint256 = _total_assets
                if total_assets == max_value(uint256):
                    total_assets = self._total_assets()
                precision: uint256 = self.precision
                numerator: uint256 = (self.totalSupply + DEAD_SHARES) * assets * precision
                denominator: uint256 = (total_assets * precision + 1)
                if is_floor:
                    return numerator / denominator
                else:
                    return (numerator + denominator - 1) / denominator
            ```

        === "Controller.vy"

            ```vyper
            interface MonetaryPolicy:
                def rate_write() -> uint256: nonpayable

            monetary_policy: public(MonetaryPolicy)

            @external
            @nonreentrant('lock')
            def save_rate():
                """
                @notice Save current rate
                """
                self._save_rate()

            @internal
            def _save_rate():
                """
                @notice Save current rate
                """
                rate: uint256 = min(self.monetary_policy.rate_write(), MAX_RATE)
                AMM.set_rate(rate)
            ```

        === "MonetaryPolicy.vy"

            ```vyper
            log_min_rate: public(int256)
            log_max_rate: public(int256)

            @external
            def rate_write(_for: address = msg.sender) -> uint256:
                return self.calculate_rate(_for, 0, 0)

            @internal
            @view
            def calculate_rate(_for: address, d_reserves: int256, d_debt: int256) -> uint256:
                total_debt: int256 = convert(Controller(_for).total_debt(), int256)
                total_reserves: int256 = convert(BORROWED_TOKEN.balanceOf(_for), int256) + total_debt + d_reserves
                total_debt += d_debt
                assert total_debt >= 0, "Negative debt"
                assert total_reserves >= total_debt, "Reserves too small"
                if total_debt == 0:
                    return self.min_rate
                else:
                    log_min_rate: int256 = self.log_min_rate
                    log_max_rate: int256 = self.log_max_rate
                    return self.exp(total_debt * (log_max_rate - log_min_rate) / total_reserves + log_min_rate)
            ```
            
        === "AMM.vy"

            ```vyper
            event SetRate:
                rate: uint256
                rate_mul: uint256
                time: uint256

            @external
            @nonreentrant('lock')
            def set_rate(rate: uint256) -> uint256:
                """
                @notice Set interest rate. That affects the dependence of AMM base price over time
                @param rate New rate in units of int(fraction * 1e18) per second
                @return rate_mul multiplier (e.g. 1.0 + integral(rate, dt))
                """
                assert msg.sender == self.admin
                rate_mul: uint256 = self._rate_mul()
                self.rate_mul = rate_mul
                self.rate_time = block.timestamp
                self.rate = rate
                log SetRate(rate, rate_mul, block.timestamp)
                return rate_mul

            @internal
            @view
            def _rate_mul() -> uint256:
                """
                @notice Rate multiplier which is 1.0 + integral(rate, dt)
                @return Rate multiplier in units where 1.0 == 1e18
                """
                return unsafe_div(self.rate_mul * (10**18 + self.rate * (block.timestamp - self.rate_time)), 10**18)
            ```

    === "Example"
        ```shell
        In  [1]:  Vault.balanceOf(trader)
        Out [1]:  1097552662404145514069

        In  [2]:  crvusd.balanceOf(trader)
        Out [2]:  999998899754665824864192

        In  [3]:  Vault.withdraw(1000000000000000000)

        In  [4]:  Vault.balanceOf(trader)
        Out [4]:  99999999999999999999

        In  [5]:  crvusd.balanceOf(trader)
        Out [5]:  999999899754665824864192
        ```


### `maxWithdraw`
!!! description "`Vault.maxWithdraw(owner: address) -> uint256:`"

    Getter for the maximum amount of assets withdrawable by `owner`.

    Returns: withdrawable assets (`uint256`).

    | Input   | Type     | Description                        |
    |---------|----------|------------------------------------|
    | `owner` | `address` | Address of the user to withdraw from. |

    ??? quote "Source code"

        === "Vault.vy"

            ```vyper
            @external
            @view
            @nonreentrant('lock')
            def maxWithdraw(owner: address) -> uint256:
                """
                @notice Maximum amount of assets which a given user can withdraw. Aware of both user's balance and available liquidity
                """
                return min(
                    self._convert_to_assets(self.balanceOf[owner]),
                    self.borrowed_token.balanceOf(self.controller.address))

            @internal
            @view
            def _convert_to_assets(shares: uint256, is_floor: bool = True,
                                _total_assets: uint256 = max_value(uint256)) -> uint256:
                total_assets: uint256 = _total_assets
                if total_assets == max_value(uint256):
                    total_assets = self._total_assets()
                precision: uint256 = self.precision
                numerator: uint256 = shares * (total_assets * precision + 1)
                denominator: uint256 = (self.totalSupply + DEAD_SHARES) * precision
                if is_floor:
                    return numerator / denominator
                else:
                    return (numerator + denominator - 1) / denominator
            ```

    === "Example"
        ```shell
        >>> Vault.maxWithdraw("0x7a16fF8270133F063aAb6C9977183D9e72835428")
        45917295006116605730466
        ```


### `previewWithdraw`
!!! description "`Vault.previewWithdraw(assets: uint256) -> uint256:`"

    Function to simulate the amount of shares getting burned when withdrawing `assets`.

    Returns: number of shares burned (`uint256`).

    | Input   | Type      | Description                      |
    |---------|-----------|----------------------------------|
    | `asset` | `address` | Number of assets to withdraw. |

    ??? quote "Source code"

        === "Vault.vy"

            ```vyper
            @external
            @view
            @nonreentrant('lock')
            def previewWithdraw(assets: uint256) -> uint256:
                """
                @notice Calculate number of shares which gets burned when withdrawing given amount of asset
                """
                assert assets <= self.borrowed_token.balanceOf(self.controller.address)
                return self._convert_to_shares(assets, False)

            @internal
            @view
            def _convert_to_shares(assets: uint256, is_floor: bool = True,
                                _total_assets: uint256 = max_value(uint256)) -> uint256:
                total_assets: uint256 = _total_assets
                if total_assets == max_value(uint256):
                    total_assets = self._total_assets()
                precision: uint256 = self.precision
                numerator: uint256 = (self.totalSupply + DEAD_SHARES) * assets * precision
                denominator: uint256 = (total_assets * precision + 1)
                if is_floor:
                    return numerator / denominator
                else:
                    return (numerator + denominator - 1) / denominator
            ```

    === "Example"
        ```shell
        >>> Vault.previewWithdraw(1000000000000000000):     # withdrawing 1 crvusd
        998540201056049850914                               # shares to burn (approx. 988)
        ```


### `redeem`
!!! description "`Vault.redeem(shares: uint256, receiver: address = msg.sender, owner: address = msg.sender) -> uint256:`"

    Function to redeem (and burn) `shares` from `owner` and send the received assets to `receiver`. Shares are burned when they are redeemed.

    Returns: assets received (`uint256`).

    Emits: `Withdraw`, `Transfer` and `SetRate`

    | Input     | Type      | Description                                        |
    |-----------|-----------|----------------------------------------------------|
    | `assets`  | `uint256` | Amount of shares to redeem.                        |
    | `receiver`| `address` | Receiver of the shares. Defaults to `msg.sender`. |
    | `owner`   | `address` | Address of whose shares to burn. Defaults to `msg.sender`. |

    ??? quote "Source code"

        === "Vault.vy"

            ```vyper
            event Transfer:
                sender: indexed(address)
                receiver: indexed(address)
                value: uint256

            event Withdraw:
                sender: indexed(address)
                receiver: indexed(address)
                owner: indexed(address)
                assets: uint256
                shares: uint256

            @external
            @nonreentrant('lock')
            def redeem(shares: uint256, receiver: address = msg.sender, owner: address = msg.sender) -> uint256:
                """
                @notice Burn given amount of shares and give corresponding assets to the user
                @param shares Amount of shares to burn
                @param receiver Optional receiver of the assets
                @param owner Optional owner of the shares. Can only redeem if owner gave approval to the sender
                """
                if owner != msg.sender:
                    allowance: uint256 = self.allowance[owner][msg.sender]
                    if allowance != max_value(uint256):
                        self._approve(owner, msg.sender, allowance - shares)

                total_assets: uint256 = self._total_assets()
                assets_to_redeem: uint256 = self._convert_to_assets(shares, True, total_assets)
                if total_assets - assets_to_redeem < MIN_ASSETS:
                    if shares == self.totalSupply:
                        # This is the last withdrawal, so we can take everything
                        assets_to_redeem = total_assets
                    else:
                        raise "Need more assets"
                self._burn(owner, shares)
                controller: Controller = self.controller
                assert self.borrowed_token.transferFrom(controller.address, receiver, assets_to_redeem, default_return_value=True)
                controller.save_rate()
                log Withdraw(msg.sender, receiver, owner, assets_to_redeem, shares)
                return assets_to_redeem

            @internal
            def _burn(_from: address, _value: uint256):
                self.balanceOf[_from] -= _value
                self.totalSupply -= _value

                log Transfer(_from, empty(address), _value)

            @internal
            @view
            def _total_assets() -> uint256:
                # admin fee should be accounted for here when enabled
                self.controller.check_lock()
                return self.borrowed_token.balanceOf(self.controller.address) + self.controller.total_debt()

            @internal
            @view
            def _convert_to_shares(assets: uint256, is_floor: bool = True,
                                _total_assets: uint256 = max_value(uint256)) -> uint256:
                total_assets: uint256 = _total_assets
                if total_assets == max_value(uint256):
                    total_assets = self._total_assets()
                precision: uint256 = self.precision
                numerator: uint256 = (self.totalSupply + DEAD_SHARES) * assets * precision
                denominator: uint256 = (total_assets * precision + 1)
                if is_floor:
                    return numerator / denominator
                else:
                    return (numerator + denominator - 1) / denominator
            ```

        === "Controller.vy"

            ```vyper
            interface MonetaryPolicy:
                def rate_write() -> uint256: nonpayable

            monetary_policy: public(MonetaryPolicy)

            @external
            @nonreentrant('lock')
            def save_rate():
                """
                @notice Save current rate
                """
                self._save_rate()

            @internal
            def _save_rate():
                """
                @notice Save current rate
                """
                rate: uint256 = min(self.monetary_policy.rate_write(), MAX_RATE)
                AMM.set_rate(rate)
            ```

        === "MonetaryPolicy.vy"

            ```vyper
            log_min_rate: public(int256)
            log_max_rate: public(int256)

            @external
            def rate_write(_for: address = msg.sender) -> uint256:
                return self.calculate_rate(_for, 0, 0)

            @internal
            @view
            def calculate_rate(_for: address, d_reserves: int256, d_debt: int256) -> uint256:
                total_debt: int256 = convert(Controller(_for).total_debt(), int256)
                total_reserves: int256 = convert(BORROWED_TOKEN.balanceOf(_for), int256) + total_debt + d_reserves
                total_debt += d_debt
                assert total_debt >= 0, "Negative debt"
                assert total_reserves >= total_debt, "Reserves too small"
                if total_debt == 0:
                    return self.min_rate
                else:
                    log_min_rate: int256 = self.log_min_rate
                    log_max_rate: int256 = self.log_max_rate
                    return self.exp(total_debt * (log_max_rate - log_min_rate) / total_reserves + log_min_rate)
            ```

        === "AMM.vy"

            ```vyper
            event SetRate:
                rate: uint256
                rate_mul: uint256
                time: uint256

            @external
            @nonreentrant('lock')
            def set_rate(rate: uint256) -> uint256:
                """
                @notice Set interest rate. That affects the dependence of AMM base price over time
                @param rate New rate in units of int(fraction * 1e18) per second
                @return rate_mul multiplier (e.g. 1.0 + integral(rate, dt))
                """
                assert msg.sender == self.admin
                rate_mul: uint256 = self._rate_mul()
                self.rate_mul = rate_mul
                self.rate_time = block.timestamp
                self.rate = rate
                log SetRate(rate, rate_mul, block.timestamp)
                return rate_mul

            @internal
            @view
            def _rate_mul() -> uint256:
                """
                @notice Rate multiplier which is 1.0 + integral(rate, dt)
                @return Rate multiplier in units where 1.0 == 1e18
                """
                return unsafe_div(self.rate_mul * (10**18 + self.rate * (block.timestamp - self.rate_time)), 10**18)
            ```

    === "Example"
        ```shell
        In  [1]:  Vault.balanceOf(trader)
        Out [1]:  99999999999999999999

        In  [2]:  crvusd.balanceOf(trader)
        Out [2]:  999999899754665824864192

        In  [3]:  Vault.redeem(99999999999999999999)

        In  [4]:  Vault.balanceOf(trader)
        Out [4]:  0

        In  [5]:  crvusd.balanceOf(trader)
        Out [5]:  999999999999999999999998
        ```


### `maxRedeem`
!!! description "`Vault.maxRedeem(owner: address) -> uint256:`"

    Getter for the maximum redeemable shares from `owner`.

    Returns: maximum redeemable shares (`uint256`).

    | Input   | Type      | Description                           |
    |---------|-----------|---------------------------------------|
    | `owner` | `address` | Address of the user to redeem shares from.   |

    ??? quote "Source code"

        === "Vault.vy"

            ```vyper
            @external   
            @view
            @nonreentrant('lock')
            def maxRedeem(owner: address) -> uint256:
                """
                @notice Calculate maximum amount of shares which a given user can redeem
                """
                return min(
                    self._convert_to_shares(self.borrowed_token.balanceOf(self.controller.address), False),
                    self.balanceOf[owner])

            @internal
            @view
            def _convert_to_shares(assets: uint256, is_floor: bool = True,
                                _total_assets: uint256 = max_value(uint256)) -> uint256:
                total_assets: uint256 = _total_assets
                if total_assets == max_value(uint256):
                    total_assets = self._total_assets()
                precision: uint256 = self.precision
                numerator: uint256 = (self.totalSupply + DEAD_SHARES) * assets * precision
                denominator: uint256 = (total_assets * precision + 1)
                if is_floor:
                    return numerator / denominator
                else:
                    return (numerator + denominator - 1) / denominator
            ```

    === "Example"
        ```shell
        >>> Vault.maxRedeem("0x7a16fF8270133F063aAb6C9977183D9e72835428")
        45836614069469292514157944
        ```


### `previewRedeem`
!!! description "`Vault.previewRedeem(shares: uint256) -> uint256:`"

    Function to simulate the number of assets received when redeeming (burning) `shares`.

    Returns: obtainable assets (`uint256`).

    | Input    | Type      | Description                      |
    |----------|-----------|----------------------------------|
    | `shares` | `uint256` | Number of shares to redeem.      |

    ??? quote "Source code"

        === "Vault.vy"

            ```vyper
            @external
            @view
            @nonreentrant('lock')
            def previewRedeem(shares: uint256) -> uint256:
                """
                @notice Calculate the amount of assets which can be obtained by redeeming the given amount of shares
                """
                if self.totalSupply == 0:
                    assert shares == 0
                    return 0

                else:
                    assets_to_redeem: uint256 = self._convert_to_assets(shares)
                    assert assets_to_redeem <= self.borrowed_token.balanceOf(self.controller.address)
                    return assets_to_redeem

            @internal
            @view
            def _convert_to_assets(shares: uint256, is_floor: bool = True,
                                _total_assets: uint256 = max_value(uint256)) -> uint256:
                total_assets: uint256 = _total_assets
                if total_assets == max_value(uint256):
                    total_assets = self._total_assets()
                precision: uint256 = self.precision
                numerator: uint256 = shares * (total_assets * precision + 1)
                denominator: uint256 = (self.totalSupply + DEAD_SHARES) * precision
                if is_floor:
                    return numerator / denominator
                else:
                    return (numerator + denominator - 1) / denominator
            ```

    === "Example"
        ```shell
        >>> Vault.previewRedeem(1000000000000000000):
        1001293138709678
        ```


### `convertToAssets`
!!! description "`Vault.convertToAssets(shares: uint256) -> uint256:`"

    Function to calculate the amount of assets received when converting `shares` to assets.

    Returns: amount of assets received (`uint256`).

    | Input    | Type      | Description                          |
    |----------|-----------|--------------------------------------|
    | `shares` | `uint256` | Amount of shares to convert to assets. |


    ??? quote "Source code"

        === "Vault.vy"

            ```vyper
            @external
            @view
            @nonreentrant('lock')
            def convertToAssets(shares: uint256) -> uint256:
                """
                @notice Returns the amount of assets that the Vault would exchange for the amount of shares provided
                """
                return self._convert_to_assets(shares)

            @internal
            @view
            def _convert_to_assets(shares: uint256, is_floor: bool = True,
                                _total_assets: uint256 = max_value(uint256)) -> uint256:
                total_assets: uint256 = _total_assets
                if total_assets == max_value(uint256):
                    total_assets = self._total_assets()
                precision: uint256 = self.precision
                numerator: uint256 = shares * (total_assets * precision + 1)
                denominator: uint256 = (self.totalSupply + DEAD_SHARES) * precision
                if is_floor:
                    return numerator / denominator
                else:
                    return (numerator + denominator - 1) / denominator
            ```

    === "Example"
        ```shell
        >>> Vault.convertToAssets(1000000000000000000):
        1001293138709678
        ```


---


## **Interest Rates**

Borrowing and lending rates are dependent on the `rate` within the AMM. This value is adjusted whenever `_save_rate()` is called. Initially, the rate is calculated in the [MonetaryPolicy](./semilog-mp.md) contract and then set within the AMM.

??? quote "Source Code"

    === "Controller.vy"

        ```vyper
        @internal
        def _save_rate():
            """
            @notice Save current rate
            """
            rate: uint256 = min(self.monetary_policy.rate_write(), MAX_RATE)
            AMM.set_rate(rate)
        ```

    === "MonetaryPolicy.vy"

        ```vyper
        log_min_rate: public(int256)
        log_max_rate: public(int256)

        @internal
        @external
        def rate_write(_for: address = msg.sender) -> uint256:
            return self.calculate_rate(_for, 0, 0)

        @internal
        @view
        def calculate_rate(_for: address, d_reserves: int256, d_debt: int256) -> uint256:
            total_debt: int256 = convert(Controller(_for).total_debt(), int256)
            total_reserves: int256 = convert(BORROWED_TOKEN.balanceOf(_for), int256) + total_debt + d_reserves
            total_debt += d_debt
            assert total_debt >= 0, "Negative debt"
            assert total_reserves >= total_debt, "Reserves too small"
            if total_debt == 0:
                return self.min_rate
            else:
                log_min_rate: int256 = self.log_min_rate
                log_max_rate: int256 = self.log_max_rate
                return self.exp(total_debt * (log_max_rate - log_min_rate) / total_reserves + log_min_rate)
        ```

    === "AMM.vy"

        ```vyper
        @external
        @nonreentrant('lock')
        def set_rate(rate: uint256) -> uint256:
            """
            @notice Set interest rate. That affects the dependence of AMM base price over time
            @param rate New rate in units of int(fraction * 1e18) per second
            @return rate_mul multiplier (e.g. 1.0 + integral(rate, dt))
            """
            assert msg.sender == self.admin
            rate_mul: uint256 = self._rate_mul()
            self.rate_mul = rate_mul
            self.rate_time = block.timestamp
            self.rate = rate
            log SetRate(rate, rate_mul, block.timestamp)
            return rate_mul
        ```

Interest rates values are **annualized and based on 1e18**.


### `borrow_apr`
!!! description "`Vault.borrow_apr() -> uint256`"

    Getter for the annualized borrow APR. The user pays this rate on the assets borrowed.

    Returns: borrow rate (`uint256`).

    ??? quote "Source code"

        === "Vault.vy"

            ```vyper
            interface AMM:
                def set_admin(_admin: address): nonpayable
                def rate() -> uint256: view

            amm: public(AMM)

            @external
            @view
            @nonreentrant('lock')
            def borrow_apr() -> uint256:
                """
                @notice Borrow APR (annualized and 1e18-based)
                """
                return self.amm.rate() * (365 * 86400)
            ```

        === "AMM.vy"

            ```vyper
            rate: public(uint256)
            ```

    === "Example"
        ```shell
        >>> Vault.borrow_apr():
        152933173055280000          # 15.29%
        ```


### `lend_apr`
!!! description "`Vault.lend_apr() -> uint256:`"

    Getter for the annualized lending APR. The value is based on the utilization is awarded to the user for supplying underlying asset (`borrowed_token`) to the vault.

    Returns: lending rate (`uint256`).


    ??? quote "Source code"

        === "Vault.vy"

            ```vyper
            interface AMM:
                def set_admin(_admin: address): nonpayable
                def rate() -> uint256: view

            amm: public(AMM)

            @external
            @view
            @nonreentrant('lock')
            def lend_apr() -> uint256:
                """
                @notice Lending APR (annualized and 1e18-based)
                """
                debt: uint256 = self.controller.total_debt()
                if debt == 0:
                    return 0
                else:
                    return self.amm.rate() * (365 * 86400) * debt / self._total_assets()

            @internal
            @view
            def _total_assets() -> uint256:
                # admin fee should be accounted for here when enabled
                self.controller.check_lock()
                return self.borrowed_token.balanceOf(self.controller.address) + self.controller.total_debt()
            ```

        === "AMM.vy"

            ```vyper
            rate: public(uint256)
            ```

    === "Example"
        ```shell
        >>> Vault.lend_apr():
        113600673360849488          # 11.36%
        ```


---


## **Contract Info Methods**

### `asset`
!!! description "`Vault.asset() -> ERC20:`"

    Getter for the underlying asset used by the vault, which is the `borrowed_token`.

    Returns: underlying asset (`address`).

    ??? quote "Source code"

        === "Vault.vy"

            ```vyper
            @external
            @view
            def asset() -> ERC20:
                """
                @notice Asset which is the same as borrowed_token
                """
                return self.borrowed_token
            ```

    === "Example"
        ```shell
        >>> Vault.asset():
        '0xf939E0A03FB07F59A73314E73794Be0E57ac1b4E'
        ```


### `totalAssets`
!!! description "`Vault.totalAssets() -> uint256:`"

    Getter for the total amount of the underlying asset (`borrowed_token`) held by the vault. These are the total assets that can be lent out.

    Returns: total assets in the vault (`uint256`).

    ??? quote "Source code"

        === "Vault.vy"

            ```vyper
            @external
            @view
            @nonreentrant('lock')
            def totalAssets() -> uint256:
                """
                @notice Total assets which can be lent out or be in reserve
                """
                return self._total_assets()

            @internal
            @view
            def _total_assets() -> uint256:
                # admin fee should be accounted for here when enabled
                self.controller.check_lock()
                return self.borrowed_token.balanceOf(self.controller.address) + self.controller.total_debt()
            ```

    === "Example"
        ```shell
        >>> Vault.totalAssets():
        181046847949654671685165
        ```


### `pricePerShare`
!!! description "`Vault.pricePerShare(is_floor: bool = True) -> uint256:`"

    Getter for the price of one share in asset tokens.

    Returns: asset price per share (`uint256`).

    | Input      | Type   | Description |
    |------------|--------|-------------|
    | `is_floor` | `bool` | - |

    ??? quote "Source code"

        === "Vault.vy"

            ```vyper
            @external
            @view
            @nonreentrant('lock')
            def pricePerShare(is_floor: bool = True) -> uint256:
                """
                @notice Method which shows how much one pool share costs in asset tokens if they are normalized to 18 decimals
                """
                supply: uint256 = self.totalSupply
                if supply == 0:
                    return 10**18 / DEAD_SHARES
                else:
                    precision: uint256 = self.precision
                    numerator: uint256 = 10**18 * (self._total_assets() * precision + 1)
                    denominator: uint256 = (supply + DEAD_SHARES)
                    pps: uint256 = 0
                    if is_floor:
                        pps = numerator / denominator
                    else:
                        pps = (numerator + denominator - 1) / denominator
                    assert pps > 0
                    return pps

            @internal
            @view
            def _total_assets() -> uint256:
                # admin fee should be accounted for here when enabled
                self.controller.check_lock()
                return self.borrowed_token.balanceOf(self.controller.address) + self.controller.total_debt()
            ```

    === "Example"
        ```shell
        >>> Vault.pricePerShare(true):
        1001291278001035
        >>> Vault.pricePerShare(false):
        1001292100174622
        ```


### `admin`
!!! description "`Vault.admin() -> address: view`"

    Getter for the admin of the vault.

    Returns: admin (`address`).

    ??? quote "Source code"

        === "Vault.vy"

            ```vyper
            interface Factory:
                def admin() -> address: view

            @external
            @view
            def admin() -> address:
                return self.factory.admin()
            ```

        === "LendingFactory.vy"

            ```vyper
            admin: public(address)
            ```

    === "Example"
        ```shell
        >>> Vault.admin():
        '0x40907540d8a6C65c637785e8f8B742ae6b0b9968'
        ```


### `borrowed_token`
!!! description "`Vault.borrowed_token() -> address: view`"

    Getter for the borrowable token in the vault.

    Returns: borrowable token (`address`).

    ??? quote "Source code"

        === "Vault.vy"

            ```vyper
            borrowed_token: public(ERC20)
            ```

    === "Example"
        ```shell
        >>> Vault.borrowed_token():
        '0xf939E0A03FB07F59A73314E73794Be0E57ac1b4E'
        ```


### `collateral_token`
!!! description "`Vault.collateral_token() -> address: view`"

    Getter for the collateral token of the lending market which is deposited into the AMM.

    Returns: collateral token (`address`).

    ??? quote "Source code"

        === "Vault.vy"

            ```vyper
            collateral_token: public(ERC20)
            ```

    === "Example"
        ```shell
        >>> Vault.collateral_token():
        '0xD533a949740bb3306d119CC777fa900bA034cd52'
        ```


### `price_oracle`
!!! description "`Vault.price_oracle() -> address: view`"

    Getter for the price oracle contract used in the vault.

    Returns: oracle (`address`).

    ??? quote "Source code"

        === "Vault.vy"

            ```vyper
            price_oracle: public(PriceOracle)
            ```

    === "Example"
        ```shell
        >>> Vault.price_oracle():
        '0xc17B0451E6d8C0f71297d0f174590632BE81163c'
        ```


### `amm`
!!! description "`Vault.amm() -> address: view`"

    Getter for the AMM of the vault.

    Returns: AMM (`address`).

    ??? quote "Source code"

        === "Vault.vy"

            ```vyper
            amm: public(AMM)
            ```

    === "Example"
        ```shell
        >>> Vault.amm():
        '0xafC1ab86045Cb2a07C23399dbE64b56D1B8B3239'
        ```


### `controller`
!!! description "`Vault.controller() -> address: view`"

    Getter for the Controller of the vault.

    Returns: Controller (`address`).

    ??? quote "Source code"

        === "Vault.vy"

            ```vyper
            controller: public(Controller)
            ```

    === "Example"
        ```shell
        >>> Vault.controller():
        '0x7443944962D04720f8c220C0D25f56F869d6EfD4'        
        ```


### `factory`
!!! description "`Vault.factory() -> address: view`"

    Getter for the Factory of the vault.

    Returns: Factory (`address`).

    ??? quote "Source code"

        === "Vault.vy"

            ```vyper
            factory: public(Factory)
            ```

    === "Example"
        ```shell
        >>> Vault.factory():
        '0xc67a44D958eeF0ff316C3a7c9E14FB96f6DedAA3'
        ```
