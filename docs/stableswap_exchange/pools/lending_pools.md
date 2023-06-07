## Overview

Curve pools may contain lending functionality, whereby the underlying tokens are lent out on other protocols 
(e.g., Compound or Yearn). Hence, the main difference to a plain pool is that a lending pool does not hold 
the underlying token itself, but a **wrapped** representation of it.

Currently, Curve supports the following lending pools:

``aave``: [Aave pool](https://www.curve.fi/aave), with lending on [Aave](https://www.aave.com)

``busd``: [BUSD](https://www.curve.fi/busd) pool, with lending on [yearn.finance](https://www.yearn.finance)

``compound``: [Compound](https://www.curve.fi/compound) pool, with lending on [Compound](https://compound.finance/)

``ib``: [Iron Bank pool](https://curve.fi/ib), with lending on [Cream](https://v1.yearn.finance/lending)

``pax``: [PAX](https://curve.fi/pax) pool, with lending on [yearn.finance](https://www.yearn.finance)

``usdt``: [USDT pool](https://curve.fi/usdt), with lending on [Compound](https://www.curve.fi/compound)

``y``: [Y pool](https://curve.fi/y), with lending on [yearn.finance](https://www.yearn.finance)

An example of a Curve lending pool is 
[Compound Pool](https://github.com/curvefi/curve-contract/tree/master/contracts/pools/compound), 
which contains the wrapped tokens ``cDAI`` and ``cUSDC``, while the underlying tokens ``DAI`` and ``USDC`` are lent out 
on Compound. Liquidity providers of the Compound Pool therefore receive interest generated on Compound in addition to 
fees from token swaps in the pool.

Implementation of lending pools may differ with respect to how wrapped tokens accrue interest. There are two main types 
of wrapped tokens that are used by lending pools:

``cToken-style tokens``: These are tokens, such as interest-bearing cTokens on Compound (e.g., ``cDAI``) or on yTokens 
                         on Yearn, where interest accrues as the rate of the token increases.

``aToken-style tokens``: These are tokens, such as aTokens on AAVE (e.g., ``aDAI``), where interest accrues as the 
balance of the token increases.

The template source code for lending pools may be viewed on GitHub.

!!! Note

    Lending pools also implement the ABI from plain pools. Refer to the plan pools documentation for overlapping methods.

## Pool Info Methods

### `StableSwap.underlying_coins`

!!! description "`StableSwap.underlying_coins(i: uint256) → address: view`"

    Getter for the array of underlying coins within the pool.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `i`       |  `uint128` | Index of coin to swap from |

    ??? quote "Source code"

        ```python hl_lines="1 9 19 25 26 27 29 30 31 32 33 34 35 36 37 38 39 40 43"
        underlying_coins: public(address[N_COINS])

        ...

        @external
        def __init__(
            _owner: address,
            _coins: address[N_COINS],
            _underlying_coins: address[N_COINS],
            _pool_token: address,
            _A: uint256,
            _fee: uint256,
            _admin_fee: uint256
        ):
            """
            @notice Contract constructor
            @param _owner Contract owner address
            @param _coins Addresses of ERC20 contracts of wrapped coins
            @param _underlying_coins Addresses of ERC20 contracts of underlying coins
            @param _pool_token Address of the token representing LP share
            @param _A Amplification coefficient multiplied by n * (n - 1)
            @param _fee Fee to charge for exchanges
            @param _admin_fee Admin fee
            """
            for i in range(N_COINS):
                assert _coins[i] != ZERO_ADDRESS
                assert _underlying_coins[i] != ZERO_ADDRESS
        
                # approve underlying coins for infinite transfers
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
        
            self.coins = _coins
            self.underlying_coins = _underlying_coins
            self.initial_A = _A * A_PRECISION
            self.future_A = _A * A_PRECISION
            self.fee = _fee
            self.admin_fee = _admin_fee
            self.owner = _owner
            self.kill_deadline = block.timestamp + KILL_DEADLINE_DT
            self.lp_token = _pool_token
        ```
        
    === "Example"
    
        ```shell
        >>> lending_pool.coins(0)
        '0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643'
        >>> lending_pool.coins(1)
        '0x39AA39c021dfbaE8faC545936693aC917d5E7563'
        ```

## Exchange Methods

Like plain pools, lending pools have the ``exchange`` method. However, in the case of lending pools, calling ``exchange`` 
performs a swap between two wrapped tokens in the pool.

For example, calling ``exchange`` on the Compound Pool, would result in a swap between the wrapped tokens ``cDAI`` and ``cUSDC``.

### `StableSwap.exchange_underlying`

!!! description "`StableSwap.exchange_underlying(i: int128, j: int128, dx: uint256, min_dy: uint256) → uint256`"

    Perform an exchange between two underlying tokens. Index values can be found via the ``underlying_coins`` public 
    getter method. Returns the actual amount of coin ``j`` received.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `i`       |  `int128` | Index value for the underlying coin to send |
    | `j`       |  `int128` | Index value of the underlying coin to receive |
    | `_dx`       |  `uint256` | Amount of ``i`` being exchanged |
    | `_min_dy`       |  `uint256` | Minimum amount of ``j`` to receive |

    Emits: <mark style="background-color: #FFD580; color: black">TokenExchangeUnderlying</mark>

    ??? quote "Source code"

        ```python
        @external
        @nonreentrant('lock')
        def exchange_underlying(i: int128, j: int128, dx: uint256, min_dy: uint256) -> uint256:
            """
            @notice Perform an exchange between two underlying coins
            @dev Index values can be found via the `underlying_coins` public getter method
            @param i Index value for the underlying coin to send
            @param j Index valie of the underlying coin to recieve
            @param dx Amount of `i` being exchanged
            @param min_dy Minimum amount of `j` to receive
            @return Actual amount of `j` received
            """
            dy: uint256 = self._exchange(i, j, dx)
            assert dy >= min_dy, "Exchange resulted in fewer coins than expected"
        
            u_coin_i: address = self.underlying_coins[i]
            lending_pool: address = self.aave_lending_pool
        
            # transfer underlying coin from msg.sender to self
            _response: Bytes[32] = raw_call(
                u_coin_i,
                concat(
                    method_id("transferFrom(address,address,uint256)"),
                    convert(msg.sender, bytes32),
                    convert(self, bytes32),
                    convert(dx, bytes32)
                ),
                max_outsize=32
            )
            if len(_response) != 0:
                assert convert(_response, bool)
        
            # deposit to aave lending pool
            raw_call(
                lending_pool,
                concat(
                    method_id("deposit(address,uint256,address,uint16)"),
                    convert(u_coin_i, bytes32),
                    convert(dx, bytes32),
                    convert(self, bytes32),
                    convert(self.aave_referral, bytes32),
                )
            )
            # withdraw `j` underlying from lending pool and transfer to caller
            LendingPool(lending_pool).withdraw(self.underlying_coins[j], dy, msg.sender)
        
            log TokenExchangeUnderlying(msg.sender, i, dx, j, dy)
        
            return dy
        ```

    === "Example"
    
        ```shell
        >>> lending_pool.exchange_underlying()
        todo: console output
        ```

    !!! note

        Older Curve lending pools may not implement the same signature for ``exchange_underlying``. For instance, Compound 
        pool does not return anything for ``exchange_underlying`` and therefore costs more in terms of gas.

## Add/Remove Liquidity Methods

The function signatures for adding and removing liquidity to a lending pool are mostly the same as for a plain pool. 
However, for lending pools, liquidity is added and removed in the wrapped token, not the underlying.

In order to be able to add and remove liquidity in the underlying token (e.g., remove DAI from Compound Pool instead of 
``cDAI``) there exists a ``Deposit<POOL>.vy`` contract (e.g., ([DepositCompound.vy](https://github.com/curvefi/curve-contract/blob/master/contracts/pools/compound/DepositCompound.vy)).

!!! warning

    Older Curve lending pools (e.g., Compound Pool) do not implement all plain pool methods for adding and removing 
    liquidity. For instance, ``remove_liquidity_one_coin`` is not implemented by Compound Pool).

Some newer pools (e.g., [IB](https://github.com/curvefi/curve-contract/blob/master/contracts/pools/ib/StableSwapIB.vy)) 
have a modified signature for ``add_liquidity`` and allow the caller to specify whether the deposited liquidity is in 
the wrapped or underlying token.

### `StableSwap.add_liquidity`

!!! description "`StableSwap.add_liquidity(_amounts: uint256[N_COINS], _min_mint_amount: uint256, _use_underlying: bool = False) → uint256`"

    Perform an exchange between two underlying tokens. Index values can be found via the ``underlying_coins`` public 
    getter method. Returns amount of LP tokens received in exchange for the deposited tokens.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_amounts`       |  `uint256[N_COINS]` | List of amounts of coins to deposit |
    | `_min_mint_amount`       |  `uint256` | Minimum amount of LP tokens to mint from the deposit |
    | `_use_underlying`       |  `bool` | If ``True``, deposit underlying assets instead of wrapped assets |

    Emits: <mark style="background-color: #FFD580; color: black">AddLiquidity</mark>
    
    ??? quote "Source code"

        ```python
        @external
        @nonreentrant('lock')
        def add_liquidity(_amounts: uint256[N_COINS], _min_mint_amount: uint256, _use_underlying: bool = False) -> uint256:
            """
            @notice Deposit coins into the pool
            @param _amounts List of amounts of coins to deposit
            @param _min_mint_amount Minimum amount of LP tokens to mint from the deposit
            @param _use_underlying If True, deposit underlying assets instead of aTokens
            @return Amount of LP tokens received by depositing
            """
        
            assert not self.is_killed  # dev: is killed
        
            # Initial invariant
            amp: uint256 = self._A()
            old_balances: uint256[N_COINS] = self._balances()
            lp_token: address = self.lp_token
            token_supply: uint256 = ERC20(lp_token).totalSupply()
            D0: uint256 = 0
            if token_supply != 0:
                D0 = self.get_D_precisions(old_balances, amp)
        
            new_balances: uint256[N_COINS] = old_balances
            for i in range(N_COINS):
                if token_supply == 0:
                    assert _amounts[i] != 0  # dev: initial deposit requires all coins
                new_balances[i] += _amounts[i]
        
            # Invariant after change
            D1: uint256 = self.get_D_precisions(new_balances, amp)
            assert D1 > D0
        
            # We need to recalculate the invariant accounting for fees
            # to calculate fair user's share
            fees: uint256[N_COINS] = empty(uint256[N_COINS])
            mint_amount: uint256 = 0
            if token_supply != 0:
                # Only account for fees if we are not the first to deposit
                ys: uint256 = (D0 + D1) / N_COINS
                _fee: uint256 = self.fee * N_COINS / (4 * (N_COINS - 1))
                _feemul: uint256 = self.offpeg_fee_multiplier
                _admin_fee: uint256 = self.admin_fee
                difference: uint256 = 0
                for i in range(N_COINS):
                    ideal_balance: uint256 = D1 * old_balances[i] / D0
                    new_balance: uint256 = new_balances[i]
                    if ideal_balance > new_balance:
                        difference = ideal_balance - new_balance
                    else:
                        difference = new_balance - ideal_balance
                    xs: uint256 = old_balances[i] + new_balance
                    fees[i] = self._dynamic_fee(xs, ys, _fee, _feemul) * difference / FEE_DENOMINATOR
                    if _admin_fee != 0:
                        self.admin_balances[i] += fees[i] * _admin_fee / FEE_DENOMINATOR
                    new_balances[i] = new_balance - fees[i]
                D2: uint256 = self.get_D_precisions(new_balances, amp)
                mint_amount = token_supply * (D2 - D0) / D0
            else:
                mint_amount = D1  # Take the dust if there was any
        
            assert mint_amount >= _min_mint_amount, "Slippage screwed you"
        
            # Take coins from the sender
            if _use_underlying:
                lending_pool: address = self.aave_lending_pool
                aave_referral: bytes32 = convert(self.aave_referral, bytes32)
        
                # Take coins from the sender
                for i in range(N_COINS):
                    amount: uint256 = _amounts[i]
                    if amount != 0:
                        coin: address = self.underlying_coins[i]
                        # transfer underlying coin from msg.sender to self
                        _response: Bytes[32] = raw_call(
                            coin,
                            concat(
                                method_id("transferFrom(address,address,uint256)"),
                                convert(msg.sender, bytes32),
                                convert(self, bytes32),
                                convert(amount, bytes32)
                            ),
                            max_outsize=32
                        )
                        if len(_response) != 0:
                            assert convert(_response, bool)
        
                        # deposit to aave lending pool
                        raw_call(
                            lending_pool,
                            concat(
                                method_id("deposit(address,uint256,address,uint16)"),
                                convert(coin, bytes32),
                                convert(amount, bytes32),
                                convert(self, bytes32),
                                aave_referral,
                            )
                        )
            else:
                for i in range(N_COINS):
                    amount: uint256 = _amounts[i]
                    if amount != 0:
                        assert ERC20(self.coins[i]).transferFrom(msg.sender, self, amount) # dev: failed transfer
        
            # Mint pool tokens
            CurveToken(lp_token).mint(msg.sender, mint_amount)
        
            log AddLiquidity(msg.sender, _amounts, fees, D1, token_supply + mint_amount)
        
            return mint_amount
        ```
        
    === "Example"
    
        ```shell
        >>> lending_pool.add_liquidity()
        todo: console output
        ```