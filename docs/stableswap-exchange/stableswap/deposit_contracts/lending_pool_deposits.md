While Curve lending pools support swaps in both the wrapped _and_ underlying coins, not all lending pools allow
liquidity providers to deposit or withdraw the underlying coin.

For example, the `Compound` Pool allows swaps between `cDai` and `cUSDC` (wrapped coins), as well as swaps between
`DAI` and `USDC` (underlying coins). However, liquidity providers are not able to deposit `DAI` or `USDC` to the
pool directly. The main reason for why this is not supported by all Curve lending pools lies in the
[size limit of contracts](https://github.com/ethereum/EIPs/blob/master/EIPS/eip-170.md). Lending pools may differ in
complexity and can end up being very close to the
contract byte code size limit. In order to overcome this restriction, liquidity can be added and
removed to and from a lending pool in the underlying coins via a different contract, called a
deposit zap, tailored to lending pools.

For an overview of the Curve lending pool implementation, please refer to the Lending Pool section.

The template source code for a lending pool deposit zap may be viewed on
[GitHub](https://github.com/curvefi/curve-contract/blob/master/contracts/pool-templates/y/DepositTemplateY.vy).

!!! note

    Lending pool deposit zaps may differ in their API. Older pools do not implement the
    [newer API template](https://github.com/curvefi/curve-contract/blob/master/contracts/pool-templates/y/DepositTemplateY.vy).

# Deposit Zap (Old)

Older Curve lending pool deposit zaps do not implement the
[template API](https://github.com/curvefi/curve-contract/blob/master/contracts/pool-templates/y/DepositTemplateY.vy).
The deposit zaps which employ an older API are:

- `DepositBUSD`: [BUSD pool deposit zap](https://etherscan.io/address/0xb6c057591e073249f2d9d88ba59a46cfc9b59edb#code)

- `DepositCompound`: [Compound pool deposit zap](https://etherscan.io/address/0xeb21209ae4c2c9ff2a86aca31e123764a3b6bc06#code)

- `DepositPAX`: [PAX pool deposit zap](https://etherscan.io/address/0xa50ccc70b6a011cffddf45057e39679379187287#code)

- `DepositUSDT`: [USDT pool deposit zap](https://etherscan.io/address/0xac795d2c97e60df6a99ff1c814727302fd747a80#code)

- `DepositY`: [Y pool deposit zap](https://etherscan.io/address/0xbbc81d23ea2c3ec7e56d39296f0cbb648873a5d3#code)

While not a lending pool, note that the following contract also implements the newer deposit zap API:

- `DepositSUSD`: [SUSD pool deposit zap](https://etherscan.io/address/0xfcba3e75865d2d561be8d220616520c171f12851#code)

!!! note

    Getters generated for public arrays changed between Vyper `0.1.x` and `0.2.x` to accept `uint256`
    instead of `int128` in order to handle the lookups. Older deposit zap contracts (v1) use
    vyper `0.1.x...`, while newer zaps (v2) use vyper `0.2.x...`.

The following Brownie console interaction examples are using the
[Compound Pool Deposit Zap](https://etherscan.io/address/0xeb21209ae4c2c9ff2a86aca31e123764a3b6bc06).

## Get Deposit Zap Information

### `DepositZap.curve`

!!! description "`DepositZap.curve() → address: view`"

    Getter for the pool associated with this deposit contract.

    ??? quote "Source code"

        ```vyper hl_lines="3 13"
        coins: public(address[N_COINS])
        underlying_coins: public(address[N_COINS])
        curve: public(address)
        token: public(address)

        ...

        @public
        def __init__(_coins: address[N_COINS], _underlying_coins: address[N_COINS],
                     _curve: address, _token: address):
            self.coins = _coins
            self.underlying_coins = _underlying_coins
            self.curve = _curve
            self.token = _token
        ```

    === "Example"

        ```shell
        >>> zap.curve()
        '0xA2B47E3D5c44877cca798226B7B8118F9BFb7A56'
        ```

### `DepositZap.underlying_coins`

!!! description "`DepositZap.underlying_coins(i: int128) → address: view`"

    Getter for the array of underlying coins within the associated pool.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `i`       |  `int128` | Index of the underlying coin for which to get the address|

    ??? quote "Source code"

        ```vyper hl_lines="6 16"
        N_COINS: constant(int128) = 4

        ...

        coins: public(address[N_COINS])
        underlying_coins: public(address[N_COINS])
        curve: public(address)
        token: public(address)

        ...

        @public
        def __init__(_coins: address[N_COINS], _underlying_coins: address[N_COINS],
                     _curve: address, _token: address):
            self.coins = _coins
            self.underlying_coins = _underlying_coins
            self.curve = _curve
            self.token = _token
        ```

    === "Example"

        ```shell
        >>> zap.underlying_coins(0)
        '0x6B175474E89094C44Da98b954EedeAC495271d0F'
        >>> zap.underlying_coins(1)
        '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
        ```

### `DepositZap.coins`

!!! description "`DepositZap.coins(i: int128) → address: view`"

    Getter for the array of wrapped coins within the associated pool.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `i`       |  `int128` | Index of the coin for which to get the address |

    ??? quote "Source code"

        ```vyper hl_lines="5 15"
        N_COINS: constant(int128) = 4

        ...

        coins: public(address[N_COINS])
        underlying_coins: public(address[N_COINS])
        curve: public(address)
        token: public(address)

        ...

        @public
        def __init__(_coins: address[N_COINS], _underlying_coins: address[N_COINS],
                     _curve: address, _token: address):
            self.coins = _coins
            self.underlying_coins = _underlying_coins
            self.curve = _curve
            self.token = _token
        ```

    === "Example"

        ```shell
        >>> zap.coins(0)
        '0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643'
        >>> zap.coins(1)
        '0x39AA39c021dfbaE8faC545936693aC917d5E7563'
        ```

### `DepositZap.token`

!!! description "`DepositZap.token() → address: view`"

    Getter for the LP token of the associated pool.

    ??? quote "Source code"

        ```vyper hl_lines="4 14"
        coins: public(address[N_COINS])
        underlying_coins: public(address[N_COINS])
        curve: public(address)
        token: public(address)

        ...

        @public
        def __init__(_coins: address[N_COINS], _underlying_coins: address[N_COINS],
                     _curve: address, _token: address):
            self.coins = _coins
            self.underlying_coins = _underlying_coins
            self.curve = _curve
            self.token = _token
        ```

    === "Example"

        ```shell
        >>> zap.coins(0)
        '0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643'
        >>> zap.coins(1)
        '0x39AA39c021dfbaE8faC545936693aC917d5E7563'
        ```

## Add/Remove Liquidity

### `DepositZap.add_liquidity`

!!! description "`DepositZap.add_liquidity(uamounts: uint256[N_COINS], min_mint_amount: uint256)`"

    Wrap underlying coins and deposit them in the pool.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `uamounts` |  `uint256[N_COINS]` | List of amounts of underlying coins to deposit |
    | `min_mint_amount` | `uint256` | Minimum amount of LP token to mint from the deposit |

    Emits: <mark style="background-color: #FFD580; color: black">AddLiquidity</mark>
    <mark style="background-color: #FFD580; color: black">Transfer</mark>

    ??? quote "Source code"

        === "Zap Contract Methods"

            ```vyper
            USE_LENDING: constant(bool[N_COINS]) = [True, True]

            ...

            @public
            @nonreentrant('lock')
            def add_liquidity(uamounts: uint256[N_COINS], min_mint_amount: uint256):
                use_lending: bool[N_COINS] = USE_LENDING
                tethered: bool[N_COINS] = TETHERED
                amounts: uint256[N_COINS] = ZEROS

                for i in range(N_COINS):
                    uamount: uint256 = uamounts[i]

                    if uamount > 0:
                        # Transfer the underlying coin from owner
                        if tethered[i]:
                            USDT(self.underlying_coins[i]).transferFrom(
                                msg.sender, self, uamount)
                        else:
                            assert_modifiable(ERC20(self.underlying_coins[i])\
                                .transferFrom(msg.sender, self, uamount))

                        # Mint if needed
                        if use_lending[i]:
                            ERC20(self.underlying_coins[i]).approve(self.coins[i], uamount)
                            ok: uint256 = cERC20(self.coins[i]).mint(uamount)
                            if ok > 0:
                                raise "Could not mint coin"
                            amounts[i] = cERC20(self.coins[i]).balanceOf(self)
                            ERC20(self.coins[i]).approve(self.curve, amounts[i])
                        else:
                            amounts[i] = uamount
                            ERC20(self.underlying_coins[i]).approve(self.curve, uamount)

                Curve(self.curve).add_liquidity(amounts, min_mint_amount)

                tokens: uint256 = ERC20(self.token).balanceOf(self)
                assert_modifiable(ERC20(self.token).transfer(msg.sender, tokens))
            ```

        === "Pool Methods"

            ```vyper
            @public
            @nonreentrant('lock')
            def add_liquidity(amounts: uint256[N_COINS], min_mint_amount: uint256):
                # Amounts is amounts of c-tokens
                assert not self.is_killed

                tethered: bool[N_COINS] = TETHERED
                use_lending: bool[N_COINS] = USE_LENDING
                fees: uint256[N_COINS] = ZEROS
                _fee: uint256 = self.fee * N_COINS / (4 * (N_COINS - 1))
                _admin_fee: uint256 = self.admin_fee

                token_supply: uint256 = self.token.totalSupply()
                rates: uint256[N_COINS] = self._current_rates()
                # Initial invariant
                D0: uint256 = 0
                old_balances: uint256[N_COINS] = self.balances
                if token_supply > 0:
                    D0 = self.get_D_mem(rates, old_balances)
                new_balances: uint256[N_COINS] = old_balances

                for i in range(N_COINS):
                    if token_supply == 0:
                        assert amounts[i] > 0
                    # balances store amounts of c-tokens
                    new_balances[i] = old_balances[i] + amounts[i]

                # Invariant after change
                D1: uint256 = self.get_D_mem(rates, new_balances)
                assert D1 > D0

                # We need to recalculate the invariant accounting for fees
                # to calculate fair user's share
                D2: uint256 = D1
                if token_supply > 0:
                    # Only account for fees if we are not the first to deposit
                    for i in range(N_COINS):
                        ideal_balance: uint256 = D1 * old_balances[i] / D0
                        difference: uint256 = 0
                        if ideal_balance > new_balances[i]:
                            difference = ideal_balance - new_balances[i]
                        else:
                            difference = new_balances[i] - ideal_balance
                        fees[i] = _fee * difference / FEE_DENOMINATOR
                        self.balances[i] = new_balances[i] - (fees[i] * _admin_fee / FEE_DENOMINATOR)
                        new_balances[i] -= fees[i]
                    D2 = self.get_D_mem(rates, new_balances)
                else:
                    self.balances = new_balances

                # Calculate, how much pool tokens to mint
                mint_amount: uint256 = 0
                if token_supply == 0:
                    mint_amount = D1  # Take the dust if there was any
                else:
                    mint_amount = token_supply * (D2 - D0) / D0

                assert mint_amount >= min_mint_amount, "Slippage screwed you"

                # Take coins from the sender
                for i in range(N_COINS):
                    if tethered[i] and not use_lending[i]:
                        USDT(self.coins[i]).transferFrom(msg.sender, self, amounts[i])
                    else:
                        assert_modifiable(
                            cERC20(self.coins[i]).transferFrom(msg.sender, self, amounts[i]))

                # Mint pool tokens
                self.token.mint(msg.sender, mint_amount)

                log.AddLiquidity(msg.sender, amounts, fees, D1, token_supply + mint_amount)
            ```

        === "Pool Token Methods"

            ```vyper
            @public
            def mint(_to: address, _value: uint256):
                """
                @dev Mint an amount of the token and assigns it to an account.
                     This encapsulates the modification of balances such that the
                     proper events are emitted.
                @param _to The account that will receive the created tokens.
                @param _value The amount that will be created.
                """
                assert msg.sender == self.minter
                assert _to != ZERO_ADDRESS
                self.total_supply += _value
                self.balanceOf[_to] += _value
                log.Transfer(ZERO_ADDRESS, _to, _value)
            ```

    === "Example"

        ```shell
        >>> todo:
        ```

### `DepositZap.remove_liquidity`

!!! description "`DepositZap.remove_liquidity(_amount: uint256, min_uamounts: uint256[N_COINS])`"

    Withdraw and unwrap coins from the pool.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_amount`       |  `uint256` | Quantity of LP tokens to burn in the withdrawal |
    | `min_uamounts` | `uint256[N_COINS]` | Minimum amounts of underlying coins to receive |

    Emits: <mark style="background-color: #FFD580; color: black">Transfer</mark>
    <mark style="background-color: #FFD580; color: black">RemoveLiquidity</mark>

    ??? quote "Source code"

        === "Zap Contract Methods"

            ```vyper
            @private
            def _send_all(_addr: address, min_uamounts: uint256[N_COINS], one: int128):
                use_lending: bool[N_COINS] = USE_LENDING
                tethered: bool[N_COINS] = TETHERED

                for i in range(N_COINS):
                    if (one < 0) or (i == one):
                        if use_lending[i]:
                            _coin: address = self.coins[i]
                            _balance: uint256 = cERC20(_coin).balanceOf(self)
                            if _balance == 0:  # Do nothing if there are 0 coins
                                continue
                            ok: uint256 = cERC20(_coin).redeem(_balance)
                            if ok > 0:
                                raise "Could not redeem coin"

                        _ucoin: address = self.underlying_coins[i]
                        _uamount: uint256 = ERC20(_ucoin).balanceOf(self)
                        assert _uamount >= min_uamounts[i], "Not enough coins withdrawn"

                        # Send only if we have something to send
                        if _uamount >= 0:
                            if tethered[i]:
                                USDT(_ucoin).transfer(_addr, _uamount)
                            else:
                                assert_modifiable(ERC20(_ucoin).transfer(_addr, _uamount))


            @public
            @nonreentrant('lock')
            def remove_liquidity(_amount: uint256, min_uamounts: uint256[N_COINS]):
                zeros: uint256[N_COINS] = ZEROS

                assert_modifiable(ERC20(self.token).transferFrom(msg.sender, self, _amount))
                Curve(self.curve).remove_liquidity(_amount, zeros)

                self._send_all(msg.sender, min_uamounts, -1)
            ```

        === "Pool Methods"

            ```vyper
            @public
            @nonreentrant('lock')
            def remove_liquidity(_amount: uint256, min_amounts: uint256[N_COINS]):
                total_supply: uint256 = self.token.totalSupply()
                amounts: uint256[N_COINS] = ZEROS
                fees: uint256[N_COINS] = ZEROS
                tethered: bool[N_COINS] = TETHERED
                use_lending: bool[N_COINS] = USE_LENDING

                for i in range(N_COINS):
                    value: uint256 = self.balances[i] * _amount / total_supply
                    assert value >= min_amounts[i], "Withdrawal resulted in fewer coins than expected"
                    self.balances[i] -= value
                    amounts[i] = value
                    if tethered[i] and not use_lending[i]:
                        USDT(self.coins[i]).transfer(msg.sender, value)
                    else:
                        assert_modifiable(cERC20(self.coins[i]).transfer(
                            msg.sender, value))

                self.token.burnFrom(msg.sender, _amount)  # Will raise if not enough

                log.RemoveLiquidity(msg.sender, amounts, fees, total_supply - _amount)
            ```

        === "Pool Token Methods"

            ```vyper
            @private
            def _burn(_to: address, _value: uint256):
                """
                @dev Internal function that burns an amount of the token of a given
                     account.
                @param _to The account whose tokens will be burned.
                @param _value The amount that will be burned.
                """
                assert _to != ZERO_ADDRESS
                self.total_supply -= _value
                self.balanceOf[_to] -= _value
                log.Transfer(_to, ZERO_ADDRESS, _value)

            ...

            @public
            def burnFrom(_to: address, _value: uint256):
                """
                @dev Burn an amount of the token from a given account.
                @param _to The account whose tokens will be burned.
                @param _value The amount that will be burned.
                """
                assert msg.sender == self.minter, "Only minter is allowed to burn"
                self._burn(_to, _value)
            ```

    === "Example"

        ```shell
        >>> todo:
        ```

### `DepositZap.remove_liquidity_imbalance`

!!! description "`DepositZap.remove_liquidity_imbalance(uamounts: uint256[N_COINS], max_burn_amount: uint256)`"

    Withdraw and unwrap coins from the pool in an imbalanced amount.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `uamounts`       |  `uint256[N_COINS]` | List of amounts of underlying coins to withdraw |
    | `max_burn_amount` | `uint256` | Maximum amount of LP token to burn in the withdrawal |

    Emits: <mark style="background-color: #FFD580; color: black">Transfer</mark>
    <mark style="background-color: #FFD580; color: black">RemoveLiquidityImbalance</mark>

    ??? quote "Source code"

        === "Zap Contract Methods"

            ```vyper
            @private
            def _send_all(_addr: address, min_uamounts: uint256[N_COINS], one: int128):
                use_lending: bool[N_COINS] = USE_LENDING
                tethered: bool[N_COINS] = TETHERED

                for i in range(N_COINS):
                    if (one < 0) or (i == one):
                        if use_lending[i]:
                            _coin: address = self.coins[i]
                            _balance: uint256 = cERC20(_coin).balanceOf(self)
                            if _balance == 0:  # Do nothing if there are 0 coins
                                continue
                            ok: uint256 = cERC20(_coin).redeem(_balance)
                            if ok > 0:
                                raise "Could not redeem coin"

                        _ucoin: address = self.underlying_coins[i]
                        _uamount: uint256 = ERC20(_ucoin).balanceOf(self)
                        assert _uamount >= min_uamounts[i], "Not enough coins withdrawn"

                        # Send only if we have something to send
                        if _uamount >= 0:
                            if tethered[i]:
                                USDT(_ucoin).transfer(_addr, _uamount)
                            else:
                                assert_modifiable(ERC20(_ucoin).transfer(_addr, _uamount))


            @public
            @nonreentrant('lock')
            def remove_liquidity_imbalance(uamounts: uint256[N_COINS], max_burn_amount: uint256):
                """
                Get max_burn_amount in, remove requested liquidity and transfer back what is left
                """
                use_lending: bool[N_COINS] = USE_LENDING
                tethered: bool[N_COINS] = TETHERED
                _token: address = self.token

                amounts: uint256[N_COINS] = uamounts
                for i in range(N_COINS):
                    if use_lending[i] and amounts[i] > 0:
                        rate: uint256 = cERC20(self.coins[i]).exchangeRateCurrent()
                        amounts[i] = amounts[i] * LENDING_PRECISION / rate
                    # if not use_lending - all good already

                # Transfrer max tokens in
                _tokens: uint256 = ERC20(_token).balanceOf(msg.sender)
                if _tokens > max_burn_amount:
                    _tokens = max_burn_amount
                assert_modifiable(ERC20(_token).transferFrom(msg.sender, self, _tokens))

                Curve(self.curve).remove_liquidity_imbalance(amounts, max_burn_amount)

                # Transfer unused tokens back
                _tokens = ERC20(_token).balanceOf(self)
                assert_modifiable(ERC20(_token).transfer(msg.sender, _tokens))

                # Unwrap and transfer all the coins we've got
                self._send_all(msg.sender, ZEROS, -1)
            ```

        === "Pool Methods"

            ```vyper
            @public
            @nonreentrant('lock')
            def remove_liquidity_imbalance(amounts: uint256[N_COINS], max_burn_amount: uint256):
                assert not self.is_killed
                tethered: bool[N_COINS] = TETHERED
                use_lending: bool[N_COINS] = USE_LENDING

                token_supply: uint256 = self.token.totalSupply()
                assert token_supply > 0
                _fee: uint256 = self.fee * N_COINS / (4 * (N_COINS - 1))
                _admin_fee: uint256 = self.admin_fee
                rates: uint256[N_COINS] = self._current_rates()

                old_balances: uint256[N_COINS] = self.balances
                new_balances: uint256[N_COINS] = old_balances
                D0: uint256 = self.get_D_mem(rates, old_balances)
                for i in range(N_COINS):
                    new_balances[i] -= amounts[i]
                D1: uint256 = self.get_D_mem(rates, new_balances)
                fees: uint256[N_COINS] = ZEROS
                for i in range(N_COINS):
                    ideal_balance: uint256 = D1 * old_balances[i] / D0
                    difference: uint256 = 0
                    if ideal_balance > new_balances[i]:
                        difference = ideal_balance - new_balances[i]
                    else:
                        difference = new_balances[i] - ideal_balance
                    fees[i] = _fee * difference / FEE_DENOMINATOR
                    self.balances[i] = new_balances[i] - (fees[i] * _admin_fee / FEE_DENOMINATOR)
                    new_balances[i] -= fees[i]
                D2: uint256 = self.get_D_mem(rates, new_balances)

                token_amount: uint256 = (D0 - D2) * token_supply / D0
                assert token_amount > 0
                assert token_amount <= max_burn_amount, "Slippage screwed you"

                for i in range(N_COINS):
                    if tethered[i] and not use_lending[i]:
                        USDT(self.coins[i]).transfer(msg.sender, amounts[i])
                    else:
                        assert_modifiable(cERC20(self.coins[i]).transfer(msg.sender, amounts[i]))
                self.token.burnFrom(msg.sender, token_amount)  # Will raise if not enough

                log.RemoveLiquidityImbalance(msg.sender, amounts, fees, D1, token_supply - token_amount)
            ```

        === "Pool Token Methods"

            ```vyper
            @private
            def _burn(_to: address, _value: uint256):
                """
                @dev Internal function that burns an amount of the token of a given
                     account.
                @param _to The account whose tokens will be burned.
                @param _value The amount that will be burned.
                """
                assert _to != ZERO_ADDRESS
                self.total_supply -= _value
                self.balanceOf[_to] -= _value
                log.Transfer(_to, ZERO_ADDRESS, _value)

            ...

            @public
            def burnFrom(_to: address, _value: uint256):
                """
                @dev Burn an amount of the token from a given account.
                @param _to The account whose tokens will be burned.
                @param _value The amount that will be burned.
                """
                assert msg.sender == self.minter, "Only minter is allowed to burn"
                self._burn(_to, _value)
            ```

    === "Example"

        ```shell
        >>> todo:
        ```

### `DepositZap.remove_liquidity_one_coin`

!!! description "`DepositZap.remove_liquidity_one_coin(_token_amount: uint256, i: int128, min_uamount: uint256, donate_dust: bool = False)`"

    Withdraw and unwrap a single coin from the pool.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_token_amount`       |  `uint256` | Amount of LP tokens to burn in the withdrawal |
    | `i` | `int128` | Index value of the coin to withdraw |
    | `min_uamount` | `uint256` | Minimum amount of underlying coin to receive |
    | `donate_dust` | `bool` | Donates collected dust liquidity to `msg.sender` |

    Emits: <mark style="background-color: #FFD580; color: black">Transfer</mark>
    <mark style="background-color: #FFD580; color: black">RemoveLiquidityImbalance</mark>

    ??? quote "Source code"

        === "Zap Contract Methods"

            ```vyper
            @public
            @nonreentrant('lock')
            def remove_liquidity_one_coin(_token_amount: uint256, i: int128, min_uamount: uint256, donate_dust: bool = False):
                """
                Remove _amount of liquidity all in a form of coin i
                """
                use_lending: bool[N_COINS] = USE_LENDING
                rates: uint256[N_COINS] = ZEROS
                _token: address = self.token

                for j in range(N_COINS):
                    if use_lending[j]:
                        rates[j] = cERC20(self.coins[j]).exchangeRateCurrent()
                    else:
                        rates[j] = LENDING_PRECISION

                dy: uint256 = self._calc_withdraw_one_coin(_token_amount, i, rates)
                assert dy >= min_uamount, "Not enough coins removed"

                assert_modifiable(
                    ERC20(self.token).transferFrom(msg.sender, self, _token_amount))

                amounts: uint256[N_COINS] = ZEROS
                amounts[i] = dy * LENDING_PRECISION / rates[i]
                token_amount_before: uint256 = ERC20(_token).balanceOf(self)
                Curve(self.curve).remove_liquidity_imbalance(amounts, _token_amount)

                # Unwrap and transfer all the coins we've got
                self._send_all(msg.sender, ZEROS, i)

                if not donate_dust:
                    # Transfer unused tokens back
                    token_amount_after: uint256 = ERC20(_token).balanceOf(self)
                    if token_amount_after > token_amount_before:
                        assert_modifiable(ERC20(_token).transfer(
                            msg.sender, token_amount_after - token_amount_before)
                        )
            ```

        === "Pool Methods"

            ```vyper
            @public
            @nonreentrant('lock')
            def remove_liquidity_imbalance(amounts: uint256[N_COINS], max_burn_amount: uint256):
                assert not self.is_killed
                tethered: bool[N_COINS] = TETHERED
                use_lending: bool[N_COINS] = USE_LENDING

                token_supply: uint256 = self.token.totalSupply()
                assert token_supply > 0
                _fee: uint256 = self.fee * N_COINS / (4 * (N_COINS - 1))
                _admin_fee: uint256 = self.admin_fee
                rates: uint256[N_COINS] = self._current_rates()

                old_balances: uint256[N_COINS] = self.balances
                new_balances: uint256[N_COINS] = old_balances
                D0: uint256 = self.get_D_mem(rates, old_balances)
                for i in range(N_COINS):
                    new_balances[i] -= amounts[i]
                D1: uint256 = self.get_D_mem(rates, new_balances)
                fees: uint256[N_COINS] = ZEROS
                for i in range(N_COINS):
                    ideal_balance: uint256 = D1 * old_balances[i] / D0
                    difference: uint256 = 0
                    if ideal_balance > new_balances[i]:
                        difference = ideal_balance - new_balances[i]
                    else:
                        difference = new_balances[i] - ideal_balance
                    fees[i] = _fee * difference / FEE_DENOMINATOR
                    self.balances[i] = new_balances[i] - (fees[i] * _admin_fee / FEE_DENOMINATOR)
                    new_balances[i] -= fees[i]
                D2: uint256 = self.get_D_mem(rates, new_balances)

                token_amount: uint256 = (D0 - D2) * token_supply / D0
                assert token_amount > 0
                assert token_amount <= max_burn_amount, "Slippage screwed you"

                for i in range(N_COINS):
                    if tethered[i] and not use_lending[i]:
                        USDT(self.coins[i]).transfer(msg.sender, amounts[i])
                    else:
                        assert_modifiable(cERC20(self.coins[i]).transfer(msg.sender, amounts[i]))
                self.token.burnFrom(msg.sender, token_amount)  # Will raise if not enough

                log.RemoveLiquidityImbalance(msg.sender, amounts, fees, D1, token_supply - token_amount)
            ```

        === "Pool Token Methods"

            ```vyper
            @private
            def _burn(_to: address, _value: uint256):
                """
                @dev Internal function that burns an amount of the token of a given
                     account.
                @param _to The account whose tokens will be burned.
                @param _value The amount that will be burned.
                """
                assert _to != ZERO_ADDRESS
                self.total_supply -= _value
                self.balanceOf[_to] -= _value
                log.Transfer(_to, ZERO_ADDRESS, _value)

            ...

            @public
            def burnFrom(_to: address, _value: uint256):
                """
                @dev Burn an amount of the token from a given account.
                @param _to The account whose tokens will be burned.
                @param _value The amount that will be burned.
                """
                assert msg.sender == self.minter, "Only minter is allowed to burn"
                self._burn(_to, _value)
            ```

    !!! note

        The underlying pool method called when the older DepositZap contract's `remove_liquidity_one_coin` is called
        emits <mark style="background-color: #FFD580; color: black">RemoveLiquidityImbalance</mark> whereas the newer
        contract emits <mark style="background-color: #FFD580; color: black">RemoveLiquidityOne</mark>. This is because
        the older contracts do not have the `remove_liquidity_one_coin`, and instead use `remove_liquidity_imbalance`.

    === "Example"

        ```shell
        >>> todo:
        ```

### `DepositZap.calc_withdraw_one_coin`

!!! description "`DepositZap.calc_withdraw_one_coin(_token_amount: uint256, i: int128) → uint256`"

    Calculate the amount received when withdrawing a single underlying coin.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_token_amount`       |  `uint256` | Amount of LP tokens to burn in the withdrawal |
    | `i` | `int128` | Index value of the coin to withdraw |

    ??? quote "Source code"

        ```vyper
        @private
        @constant
        def _calc_withdraw_one_coin(_token_amount: uint256, i: int128, rates: uint256[N_COINS]) -> uint256:
            # First, need to calculate
            # * Get current D
            # * Solve Eqn against y_i for D - _token_amount
            use_lending: bool[N_COINS] = USE_LENDING
            # tethered: bool[N_COINS] = TETHERED
            crv: address = self.curve
            A: uint256 = Curve(crv).A()
            fee: uint256 = Curve(crv).fee() * N_COINS / (4 * (N_COINS - 1))
            fee += fee * FEE_IMPRECISION / FEE_DENOMINATOR  # Overcharge to account for imprecision
            precisions: uint256[N_COINS] = PRECISION_MUL
            total_supply: uint256 = ERC20(self.token).totalSupply()

            xp: uint256[N_COINS] = PRECISION_MUL
            S: uint256 = 0
            for j in range(N_COINS):
                xp[j] *= Curve(crv).balances(j)
                if use_lending[j]:
                    # Use stored rate b/c we have imprecision anyway
                    xp[j] = xp[j] * rates[j] / LENDING_PRECISION
                S += xp[j]
                # if not use_lending - all good already

            D0: uint256 = self.get_D(A, xp)
            D1: uint256 = D0 - _token_amount * D0 / total_supply
            xp_reduced: uint256[N_COINS] = xp

            # xp = xp - fee * | xp * D1 / D0 - (xp - S * dD / D0 * (0, ... 1, ..0))|
            for j in range(N_COINS):
                dx_expected: uint256 = 0
                b_ideal: uint256 = xp[j] * D1 / D0
                b_expected: uint256 = xp[j]
                if j == i:
                    b_expected -= S * (D0 - D1) / D0
                if b_ideal >= b_expected:
                    dx_expected = (b_ideal - b_expected)
                else:
                    dx_expected = (b_expected - b_ideal)
                xp_reduced[j] -= fee * dx_expected / FEE_DENOMINATOR

            dy: uint256 = xp_reduced[i] - self.get_y(A, i, xp_reduced, D1)
            dy = dy / precisions[i]

            return dy


        @public
        @constant
        def calc_withdraw_one_coin(_token_amount: uint256, i: int128) -> uint256:
            rates: uint256[N_COINS] = ZEROS
            use_lending: bool[N_COINS] = USE_LENDING

            for j in range(N_COINS):
                if use_lending[j]:
                    rates[j] = cERC20(self.coins[j]).exchangeRateStored()
                else:
                    rates[j] = 10 ** 18

            return self._calc_withdraw_one_coin(_token_amount, i, rates)
        ```

    === "Example"

        ```shell
        >>> todo:
        ```

### `DepositZap.withdraw_donated_dust`

!!! description "`DepositZap.withdraw_donated_dust()`"

    Donates any LP tokens of the associated pool held by this contract to the contract owner.

    ??? quote "Source code"

        ```vyper
        @public
        @nonreentrant('lock')
        def withdraw_donated_dust():
            owner: address = Curve(self.curve).owner()
            assert msg.sender == owner

            _token: address = self.token
            assert_modifiable(
                ERC20(_token).transfer(owner, ERC20(_token).balanceOf(self)))
        ```

    === "Example"

        ```shell
        >>> todo:
        ```

# Deposit Zap (New)

Compared to the older deposit zaps, the newer zaps mainly optimize for gas efficiency. The API is only modified
in part, specifically with regards to `return` values and variable naming.

## Get Deposit Zap Information

### `DepositZap.curve`

!!! description "`DepositZap.curve() → address: view`"

    Getter for the pool associated with this deposit contract.

    ??? quote "Source code"

        ```vyper hl_lines="5 14 47"
        @external
        def __init__(
            _coins: address[N_COINS],
            _underlying_coins: address[N_COINS],
            _curve: address,
            _token: address
        ):
            """
            @notice Contract constructor
            @dev Where a token does not use wrapping, use the same address
                 for `_coins` and `_underlying_coins`
            @param _coins List of wrapped coin addresses
            @param _underlying_coins List of underlying coin addresses
            @param _curve Pool address
            @param _token Pool LP token address
            """
            for i in range(N_COINS):
                assert _coins[i] != ZERO_ADDRESS
                assert _underlying_coins[i] != ZERO_ADDRESS

                # approve underlying and wrapped coins for infinite transfers
                _response: Bytes[32] = raw_call(
                    _underlying_coins[i],
                    concat(
                        method_id("approve(address,uint256)"),
                        convert(_coins[i], bytes32),
                        convert(MAX_UINT256, bytes32),
                    ),
                    max_outsize=32,
                )
                if len(_response) > 0:
                    assert convert(_response, bool)
                _response = raw_call(
                    _coins[i],
                    concat(
                        method_id("approve(address,uint256)"),
                        convert(_curve, bytes32),
                        convert(MAX_UINT256, bytes32),
                    ),
                    max_outsize=32,
                )
                if len(_response) > 0:
                    assert convert(_response, bool)

            self.coins = _coins
            self.underlying_coins = _underlying_coins
            self.curve = _curve
            self.lp_token = _token
        ```

    === "Example"

        ```shell
        >>> zap.curve()
        '0xA2B47E3D5c44877cca798226B7B8118F9BFb7A56'
        ```

### `DepositZap.underlying_coins`

!!! description "`DepositZap.underlying_coins(i: int128) → address: view`"

    Getter for the array of underlying coins within the associated pool.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `i`       |  `int128` | Index of the underlying coin for which to get the address|

    ??? quote "Source code"

        ```vyper hl_lines="1 8 17 23 27 50"
        underlying_coins: public(address[N_COINS])

        ...

        @external
        def __init__(
            _coins: address[N_COINS],
            _underlying_coins: address[N_COINS],
            _curve: address,
            _token: address
        ):
            """
            @notice Contract constructor
            @dev Where a token does not use wrapping, use the same address
                 for `_coins` and `_underlying_coins`
            @param _coins List of wrapped coin addresses
            @param _underlying_coins List of underlying coin addresses
            @param _curve Pool address
            @param _token Pool LP token address
            """
            for i in range(N_COINS):
                assert _coins[i] != ZERO_ADDRESS
                assert _underlying_coins[i] != ZERO_ADDRESS

                # approve underlying and wrapped coins for infinite transfers
                _response: Bytes[32] = raw_call(
                    _underlying_coins[i],
                    concat(
                        method_id("approve(address,uint256)"),
                        convert(_coins[i], bytes32),
                        convert(MAX_UINT256, bytes32),
                    ),
                    max_outsize=32,
                )
                if len(_response) > 0:
                    assert convert(_response, bool)
                _response = raw_call(
                    _coins[i],
                    concat(
                        method_id("approve(address,uint256)"),
                        convert(_curve, bytes32),
                        convert(MAX_UINT256, bytes32),
                    ),
                    max_outsize=32,
                )
                if len(_response) > 0:
                    assert convert(_response, bool)

            self.coins = _coins
            self.underlying_coins = _underlying_coins
            self.curve = _curve
            self.lp_token = _token
        ```

    === "Example"

        ```shell
        >>> zap.underlying_coins(0)
        '0x6B175474E89094C44Da98b954EedeAC495271d0F'
        >>> zap.underlying_coins(1)
        '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
        ```

### `DepositZap.coins`

!!! description "`DepositZap.coins(i: int128) → address: view`"

    Getter for the array of wrapped coins within the associated pool.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `i`       |  `int128` | Index of the coin for which to get the address |

    ??? quote "Source code"

        ```vyper hl_lines="1 7 16 22 30 38 49"
        coins: public(address[N_COINS])

        ...

        @external
        def __init__(
            _coins: address[N_COINS],
            _underlying_coins: address[N_COINS],
            _curve: address,
            _token: address
        ):
            """
            @notice Contract constructor
            @dev Where a token does not use wrapping, use the same address
                 for `_coins` and `_underlying_coins`
            @param _coins List of wrapped coin addresses
            @param _underlying_coins List of underlying coin addresses
            @param _curve Pool address
            @param _token Pool LP token address
            """
            for i in range(N_COINS):
                assert _coins[i] != ZERO_ADDRESS
                assert _underlying_coins[i] != ZERO_ADDRESS

                # approve underlying and wrapped coins for infinite transfers
                _response: Bytes[32] = raw_call(
                    _underlying_coins[i],
                    concat(
                        method_id("approve(address,uint256)"),
                        convert(_coins[i], bytes32),
                        convert(MAX_UINT256, bytes32),
                    ),
                    max_outsize=32,
                )
                if len(_response) > 0:
                    assert convert(_response, bool)
                _response = raw_call(
                    _coins[i],
                    concat(
                        method_id("approve(address,uint256)"),
                        convert(_curve, bytes32),
                        convert(MAX_UINT256, bytes32),
                    ),
                    max_outsize=32,
                )
                if len(_response) > 0:
                    assert convert(_response, bool)

            self.coins = _coins
            self.underlying_coins = _underlying_coins
            self.curve = _curve
            self.lp_token = _token
        ```

    === "Example"

        ```shell
        >>> zap.coins(0)
        '0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643'
        >>> zap.coins(1)
        '0x39AA39c021dfbaE8faC545936693aC917d5E7563'
        ```

### `DepositZap.token`

!!! description "`DepositZap.token() → address: view`"

    Getter for the LP token of the associated pool.

    ??? quote "Source code"

        ```vyper hl_lines="1 10 19 52"
        lp_token: public(address)

        ...

        @external
        def __init__(
            _coins: address[N_COINS],
            _underlying_coins: address[N_COINS],
            _curve: address,
            _token: address
        ):
            """
            @notice Contract constructor
            @dev Where a token does not use wrapping, use the same address
                 for `_coins` and `_underlying_coins`
            @param _coins List of wrapped coin addresses
            @param _underlying_coins List of underlying coin addresses
            @param _curve Pool address
            @param _token Pool LP token address
            """
            for i in range(N_COINS):
                assert _coins[i] != ZERO_ADDRESS
                assert _underlying_coins[i] != ZERO_ADDRESS

                # approve underlying and wrapped coins for infinite transfers
                _response: Bytes[32] = raw_call(
                    _underlying_coins[i],
                    concat(
                        method_id("approve(address,uint256)"),
                        convert(_coins[i], bytes32),
                        convert(MAX_UINT256, bytes32),
                    ),
                    max_outsize=32,
                )
                if len(_response) > 0:
                    assert convert(_response, bool)
                _response = raw_call(
                    _coins[i],
                    concat(
                        method_id("approve(address,uint256)"),
                        convert(_curve, bytes32),
                        convert(MAX_UINT256, bytes32),
                    ),
                    max_outsize=32,
                )
                if len(_response) > 0:
                    assert convert(_response, bool)

            self.coins = _coins
            self.underlying_coins = _underlying_coins
            self.curve = _curve
            self.lp_token = _token
        ```

    === "Example"

        ```shell
        >>> zap.coins(0)
        '0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643'
        >>> zap.coins(1)
        '0x39AA39c021dfbaE8faC545936693aC917d5E7563'
        ```

## Add/Remove Liquidity

### `DepositZap.add_liquidity`

!!! description "`DepositZap.add_liquidity(_underlying_amounts: uint256[N_COINS], _min_mint_amount: uint256) -> uint256`"

    Wrap underlying coins and deposit them in the pool. Returns the amount of LP token received in exchange for the
    deposited amounts.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_underlying_amounts`       |  `uint256[N_COINS]` | List of amounts of underlying coins to deposit |
    | `_min_mint_amount` | `uint256` | Minimum amount of LP token to mint from the deposit |

    Emits: <mark style="background-color: #FFD580; color: black">Transfer</mark>
    <mark style="background-color: #FFD580; color: black">AddLiquidity</mark>

    ??? quote "Source code"

        === "Zap Contract Methods"

            ```vyper
            @public
            @nonreentrant('lock')
            def add_liquidity(uamounts: uint256[N_COINS], min_mint_amount: uint256):
                tethered: bool[N_COINS] = TETHERED
                amounts: uint256[N_COINS] = ZEROS

                for i in range(N_COINS):
                    uamount: uint256 = uamounts[i]

                    if uamount > 0:
                        # Transfer the underlying coin from owner
                        if tethered[i]:
                            USDT(self.underlying_coins[i]).transferFrom(
                                msg.sender, self, uamount)
                        else:
                            assert_modifiable(ERC20(self.underlying_coins[i])\
                                .transferFrom(msg.sender, self, uamount))

                        # Mint if needed
                        ERC20(self.underlying_coins[i]).approve(self.coins[i], uamount)
                        yERC20(self.coins[i]).deposit(uamount)
                        amounts[i] = yERC20(self.coins[i]).balanceOf(self)
                        ERC20(self.coins[i]).approve(self.curve, amounts[i])

                Curve(self.curve).add_liquidity(amounts, min_mint_amount)

                tokens: uint256 = ERC20(self.token).balanceOf(self)
                assert_modifiable(ERC20(self.token).transfer(msg.sender, tokens))
            ```
        === "Pool Methods"

            ```vyper
            @external
            @nonreentrant('lock')
            def add_liquidity(amounts: uint256[N_COINS], min_mint_amount: uint256) -> uint256:
                """
                @notice Deposit coins into the pool
                @param amounts List of amounts of coins to deposit
                @param min_mint_amount Minimum amount of LP tokens to mint from the deposit
                @return Amount of LP tokens received by depositing
                """
                assert not self.is_killed  # dev: is killed

                amp: uint256 = self._A()

                _lp_token: address = self.lp_token
                token_supply: uint256 = ERC20(_lp_token).totalSupply()
                # Initial invariant
                D0: uint256 = 0
                old_balances: uint256[N_COINS] = self.balances
                if token_supply > 0:
                    D0 = self.get_D_mem(old_balances, amp)
                new_balances: uint256[N_COINS] = old_balances

                for i in range(N_COINS):
                    if token_supply == 0:
                        assert amounts[i] > 0  # dev: initial deposit requires all coins
                    # balances store amounts of c-tokens
                    new_balances[i] = old_balances[i] + amounts[i]

                # Invariant after change
                D1: uint256 = self.get_D_mem(new_balances, amp)
                assert D1 > D0

                # We need to recalculate the invariant accounting for fees
                # to calculate fair user's share
                D2: uint256 = D1
                fees: uint256[N_COINS] = empty(uint256[N_COINS])

                if token_supply > 0:
                    # Only account for fees if we are not the first to deposit
                    _fee: uint256 = self.fee * N_COINS / (4 * (N_COINS - 1))
                    _admin_fee: uint256 = self.admin_fee
                    for i in range(N_COINS):
                        ideal_balance: uint256 = D1 * old_balances[i] / D0
                        difference: uint256 = 0
                        if ideal_balance > new_balances[i]:
                            difference = ideal_balance - new_balances[i]
                        else:
                            difference = new_balances[i] - ideal_balance
                        fees[i] = _fee * difference / FEE_DENOMINATOR
                        self.balances[i] = new_balances[i] - (fees[i] * _admin_fee / FEE_DENOMINATOR)
                        new_balances[i] -= fees[i]
                    D2 = self.get_D_mem(new_balances, amp)
                else:
                    self.balances = new_balances

                # Calculate, how much pool tokens to mint
                mint_amount: uint256 = 0
                if token_supply == 0:
                    mint_amount = D1  # Take the dust if there was any
                else:
                    mint_amount = token_supply * (D2 - D0) / D0

                assert mint_amount >= min_mint_amount, "Slippage screwed you"

                # Take coins from the sender
                for i in range(N_COINS):
                    if amounts[i] > 0:
                        # "safeTransferFrom" which works for ERC20s which return bool or not
                        _response: Bytes[32] = raw_call(
                            self.coins[i],
                            concat(
                                method_id("transferFrom(address,address,uint256)"),
                                convert(msg.sender, bytes32),
                                convert(self, bytes32),
                                convert(amounts[i], bytes32),
                            ),
                            max_outsize=32,
                        )  # dev: failed transfer
                        if len(_response) > 0:
                            assert convert(_response, bool)

                # Mint pool tokens
                CurveToken(_lp_token).mint(msg.sender, mint_amount)

                log AddLiquidity(msg.sender, amounts, fees, D1, token_supply + mint_amount)

                return mint_amount
            ```

    === "Example"

        ```shell
        >>> todo:
        ```

### `DepositZap.remove_liquidity`

!!! description "`DepositZap.remove_liquidity(_amount: uint256, _min_underlying_amounts: uint256[N_COINS]) -> uint256[N_COINS]`"

    Withdraw and unwrap coins from the pool. Returns list of amounts of underlying coins that were withdrawn.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_amount`       |  `uint256` | Quantity of LP tokens to burn in the withdrawal |
    | `_min_underlying_amounts` | `uint256[N_COINS]` | Minimum amounts of underlying coins to receive |

    Emits: <mark style="background-color: #FFD580; color: black">Transfer</mark>
    <mark style="background-color: #FFD580; color: black">RemoveLiquidity</mark>

    ??? quote "Source code"

        === "Zap Contract Methods"

            ```vyper
            @internal
            def _unwrap_and_transfer(_addr: address, _min_amounts: uint256[N_COINS]) -> uint256[N_COINS]:
                # unwrap coins and transfer them to the sender
                use_lending: bool[N_COINS] = USE_LENDING
                _amounts: uint256[N_COINS] = empty(uint256[N_COINS])

                for i in range(N_COINS):
                    if use_lending[i]:
                        _coin: address = self.coins[i]
                        _balance: uint256 = ERC20(_coin).balanceOf(self)
                        if _balance == 0:  # Do nothing if there are 0 coins
                            continue
                        yERC20(_coin).withdraw(_balance)

                    _ucoin: address = self.underlying_coins[i]
                    _uamount: uint256 = ERC20(_ucoin).balanceOf(self)
                    assert _uamount >= _min_amounts[i], "Not enough coins withdrawn"

                    # Send only if we have something to send
                    if _uamount != 0:
                        _response: Bytes[32] = raw_call(
                            _ucoin,
                            concat(
                                method_id("transfer(address,uint256)"),
                                convert(_addr, bytes32),
                                convert(_uamount, bytes32)
                            ),
                            max_outsize=32
                        )
                        if len(_response) > 0:
                            assert convert(_response, bool)
                        _amounts[i] = _uamount

                return _amounts

            @external
            @nonreentrant('lock')
            def remove_liquidity(
                _amount: uint256,
                _min_underlying_amounts: uint256[N_COINS]
            ) -> uint256[N_COINS]:
                """
                @notice Withdraw and unwrap coins from the pool
                @dev Withdrawal amounts are based on current deposit ratios
                @param _amount Quantity of LP tokens to burn in the withdrawal
                @param _min_underlying_amounts Minimum amounts of underlying coins to receive
                @return List of amounts of underlying coins that were withdrawn
                """
                assert ERC20(self.lp_token).transferFrom(msg.sender, self, _amount)
                Curve(self.curve).remove_liquidity(_amount, empty(uint256[N_COINS]))

                return self._unwrap_and_transfer(msg.sender, _min_underlying_amounts)
            ```

        === "Pool Methods"

            ```vyper
            @external
            @nonreentrant('lock')
            def remove_liquidity(_amount: uint256, min_amounts: uint256[N_COINS]) -> uint256[N_COINS]:
                """
                @notice Withdraw coins from the pool
                @dev Withdrawal amounts are based on current deposit ratios
                @param _amount Quantity of LP tokens to burn in the withdrawal
                @param min_amounts Minimum amounts of underlying coins to receive
                @return List of amounts of coins that were withdrawn
                """
                _lp_token: address = self.lp_token
                total_supply: uint256 = ERC20(_lp_token).totalSupply()
                amounts: uint256[N_COINS] = empty(uint256[N_COINS])
                fees: uint256[N_COINS] = empty(uint256[N_COINS])  # Fees are unused but we've got them historically in event

                for i in range(N_COINS):
                    value: uint256 = self.balances[i] * _amount / total_supply
                    assert value >= min_amounts[i], "Withdrawal resulted in fewer coins than expected"
                    self.balances[i] -= value
                    amounts[i] = value
                    _response: Bytes[32] = raw_call(
                        self.coins[i],
                        concat(
                            method_id("transfer(address,uint256)"),
                            convert(msg.sender, bytes32),
                            convert(value, bytes32),
                        ),
                        max_outsize=32,
                    )  # dev: failed transfer
                    if len(_response) > 0:
                        assert convert(_response, bool)

                CurveToken(_lp_token).burnFrom(msg.sender, _amount)  # dev: insufficient funds

                log RemoveLiquidity(msg.sender, amounts, fees, total_supply - _amount)

                return amounts
            ```

    === "Example"

        ```shell
        >>> todo:
        ```

### `DepositZap.remove_liquidity_imbalance`

!!! description "`DepositZap.remove_liquidity_imbalance(_underlying_amounts: uint256[N_COINS], _max_burn_amount: uint256)`"

    Withdraw and unwrap coins from the pool in an imbalanced amount.
    Amounts in `_underlying_amounts` correspond to withdrawn amounts before any fees charge for unwrapping
    Returns list of amounts of underlying coins that were withdrawn.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_underlying_amounts`       |  `uint256[N_COINS]` | List of amounts of underlying coins to withdraw |
    | `_max_burn_amount` | `uint256` | Maximum amount of LP token to burn in the withdrawal |

    Emits: <mark style="background-color: #FFD580; color: black">Transfer</mark>
    <mark style="background-color: #FFD580; color: black">RemoveLiquidityImbalance</mark>

    ??? quote "Source code"

        === "Zap Contract Methods"

            ```vyper
            @internal
            def _unwrap_and_transfer(_addr: address, _min_amounts: uint256[N_COINS]) -> uint256[N_COINS]:
                # unwrap coins and transfer them to the sender
                use_lending: bool[N_COINS] = USE_LENDING
                _amounts: uint256[N_COINS] = empty(uint256[N_COINS])

                for i in range(N_COINS):
                    if use_lending[i]:
                        _coin: address = self.coins[i]
                        _balance: uint256 = ERC20(_coin).balanceOf(self)
                        if _balance == 0:  # Do nothing if there are 0 coins
                            continue
                        yERC20(_coin).withdraw(_balance)

                    _ucoin: address = self.underlying_coins[i]
                    _uamount: uint256 = ERC20(_ucoin).balanceOf(self)
                    assert _uamount >= _min_amounts[i], "Not enough coins withdrawn"

                    # Send only if we have something to send
                    if _uamount != 0:
                        _response: Bytes[32] = raw_call(
                            _ucoin,
                            concat(
                                method_id("transfer(address,uint256)"),
                                convert(_addr, bytes32),
                                convert(_uamount, bytes32)
                            ),
                            max_outsize=32
                        )
                        if len(_response) > 0:
                            assert convert(_response, bool)
                        _amounts[i] = _uamount

                return _amounts

            @external
            @nonreentrant('lock')
            def remove_liquidity_imbalance(
                _underlying_amounts: uint256[N_COINS],
                _max_burn_amount: uint256
            ) -> uint256[N_COINS]:
                """
                @notice Withdraw and unwrap coins from the pool in an imbalanced amount
                @dev Amounts in `_underlying_amounts` correspond to withdrawn amounts
                     before any fees charge for unwrapping.
                @param _underlying_amounts List of amounts of underlying coins to withdraw
                @param _max_burn_amount Maximum amount of LP token to burn in the withdrawal
                @return List of amounts of underlying coins that were withdrawn
                """
                use_lending: bool[N_COINS] = USE_LENDING
                lp_token: address = self.lp_token

                amounts: uint256[N_COINS] = _underlying_amounts
                for i in range(N_COINS):
                    _amount: uint256 = amounts[i]
                    if use_lending[i] and _amount > 0:
                        rate: uint256 = yERC20(self.coins[i]).getPricePerFullShare()
                        amounts[i] = _amount * LENDING_PRECISION / rate
                    # if not use_lending - all good already

                # Transfer max tokens in
                _lp_amount: uint256 = ERC20(lp_token).balanceOf(msg.sender)
                if _lp_amount > _max_burn_amount:
                    _lp_amount = _max_burn_amount
                assert ERC20(lp_token).transferFrom(msg.sender, self, _lp_amount)

                Curve(self.curve).remove_liquidity_imbalance(amounts, _max_burn_amount)

                # Transfer unused LP tokens back
                _lp_amount = ERC20(lp_token).balanceOf(self)
                if _lp_amount != 0:
                    assert ERC20(lp_token).transfer(msg.sender, _lp_amount)

                # Unwrap and transfer all the coins we've got
                return self._unwrap_and_transfer(msg.sender, empty(uint256[N_COINS]))
            ```

        === "Pool Methods"

            ```vyper
            @external
            @nonreentrant('lock')
            def remove_liquidity_imbalance(amounts: uint256[N_COINS], max_burn_amount: uint256) -> uint256:
                """
                @notice Withdraw coins from the pool in an imbalanced amount
                @param amounts List of amounts of underlying coins to withdraw
                @param max_burn_amount Maximum amount of LP token to burn in the withdrawal
                @return Actual amount of the LP token burned in the withdrawal
                """
                assert not self.is_killed  # dev: is killed

                amp: uint256 = self._A()

                old_balances: uint256[N_COINS] = self.balances
                new_balances: uint256[N_COINS] = old_balances
                D0: uint256 = self.get_D_mem(old_balances, amp)
                for i in range(N_COINS):
                    new_balances[i] -= amounts[i]
                D1: uint256 = self.get_D_mem(new_balances, amp)

                _lp_token: address = self.lp_token
                token_supply: uint256 = ERC20(_lp_token).totalSupply()
                assert token_supply != 0  # dev: zero total supply

                _fee: uint256 = self.fee * N_COINS / (4 * (N_COINS - 1))
                _admin_fee: uint256 = self.admin_fee
                fees: uint256[N_COINS] = empty(uint256[N_COINS])
                for i in range(N_COINS):
                    ideal_balance: uint256 = D1 * old_balances[i] / D0
                    difference: uint256 = 0
                    if ideal_balance > new_balances[i]:
                        difference = ideal_balance - new_balances[i]
                    else:
                        difference = new_balances[i] - ideal_balance
                    fees[i] = _fee * difference / FEE_DENOMINATOR
                    self.balances[i] = new_balances[i] - (fees[i] * _admin_fee / FEE_DENOMINATOR)
                    new_balances[i] -= fees[i]
                D2: uint256 = self.get_D_mem(new_balances, amp)

                token_amount: uint256 = (D0 - D2) * token_supply / D0
                assert token_amount != 0  # dev: zero tokens burned
                token_amount += 1  # In case of rounding errors - make it unfavorable for the "attacker"
                assert token_amount <= max_burn_amount, "Slippage screwed you"

                CurveToken(_lp_token).burnFrom(msg.sender, token_amount)  # dev: insufficient funds
                for i in range(N_COINS):
                    if amounts[i] != 0:
                        _response: Bytes[32] = raw_call(
                            self.coins[i],
                            concat(
                                method_id("transfer(address,uint256)"),
                                convert(msg.sender, bytes32),
                                convert(amounts[i], bytes32),
                            ),
                            max_outsize=32,
                        )  # dev: failed transfer
                        if len(_response) > 0:
                            assert convert(_response, bool)


                log RemoveLiquidityImbalance(msg.sender, amounts, fees, D1, token_supply - token_amount)

                return token_amount
            ```

    === "Example"

        ```shell
        >>> todo:
        ```

### `DepositZap.remove_liquidity_one_coin`

!!! description "`DepositZap.remove_liquidity_one_coin(_token_amount: uint256, i: int128, min_uamount: uint256, donate_dust: bool = False)`"

    Withdraw and unwrap a single coin from the pool. Returns amount of underlying coin received.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_amount`       |  `uint256` | Amount of LP tokens to burn in the withdrawal |
    | `i` | `int128` | Index value of the coin to withdraw |
    | `_min_underlying_amount` | `uint256` | Minimum amount of underlying coin to receive |

    Emits: <mark style="background-color: #FFD580; color: black">Transfer</mark>
    <mark style="background-color: #FFD580; color: black">RemoveLiquidityOne</mark>

    ??? quote "Source code"

        === "Zap Contract Methods"

            ```vyper
            @external
            @nonreentrant('lock')
            def remove_liquidity_one_coin(
                _amount: uint256,
                i: int128,
                _min_underlying_amount: uint256
            ) -> uint256:
                """
                @notice Withdraw and unwrap a single coin from the pool
                @param _amount Amount of LP tokens to burn in the withdrawal
                @param i Index value of the coin to withdraw
                @param _min_underlying_amount Minimum amount of underlying coin to receive
                @return Amount of underlying coin received
                """
                assert ERC20(self.lp_token).transferFrom(msg.sender, self, _amount)

                Curve(self.curve).remove_liquidity_one_coin(_amount, i, 0)

                use_lending: bool[N_COINS] = USE_LENDING
                if use_lending[i]:
                    coin: address = self.coins[i]
                    _balance: uint256 = ERC20(coin).balanceOf(self)
                    yERC20(coin).withdraw(_balance)

                coin: address = self.underlying_coins[i]
                _balance: uint256 = ERC20(coin).balanceOf(self)
                assert _balance >= _min_underlying_amount, "Not enough coins removed"

                _response: Bytes[32] = raw_call(
                    coin,
                    concat(
                        method_id("transfer(address,uint256)"),
                        convert(msg.sender, bytes32),
                        convert(_balance, bytes32),
                    ),
                    max_outsize=32,
                )
                if len(_response) > 0:
                    assert convert(_response, bool)

                return _balance
            ```

        === "Pool Methods"

            ```vyper
            @external
            @nonreentrant('lock')
            def remove_liquidity_one_coin(_token_amount: uint256, i: int128, _min_amount: uint256) -> uint256:
                """
                @notice Withdraw a single coin from the pool
                @param _token_amount Amount of LP tokens to burn in the withdrawal
                @param i Index value of the coin to withdraw
                @param _min_amount Minimum amount of coin to receive
                @return Amount of coin received
                """
                assert not self.is_killed  # dev: is killed

                dy: uint256 = 0
                dy_fee: uint256 = 0
                total_supply: uint256 = 0
                dy, dy_fee, total_supply = self._calc_withdraw_one_coin(_token_amount, i)
                assert dy >= _min_amount, "Not enough coins removed"

                self.balances[i] -= (dy + dy_fee * self.admin_fee / FEE_DENOMINATOR)
                CurveToken(self.lp_token).burnFrom(msg.sender, _token_amount)  # dev: insufficient funds


                _response: Bytes[32] = raw_call(
                    self.coins[i],
                    concat(
                        method_id("transfer(address,uint256)"),
                        convert(msg.sender, bytes32),
                        convert(dy, bytes32),
                    ),
                    max_outsize=32,
                )  # dev: failed transfer
                if len(_response) > 0:
                    assert convert(_response, bool)

                log RemoveLiquidityOne(msg.sender, _token_amount, dy, total_supply - _token_amount)

                return dy
            ```

    === "Example"

        ```shell
        >>> todo:
        ```
