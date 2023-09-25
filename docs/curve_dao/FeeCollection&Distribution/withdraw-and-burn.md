# *Withdrawing Admin Fees*

## **StableSwap Pools**
Admin fees are stored within each exchange contract and viewable via the `admin_balances` public getter method. The contract owner may call to claim the fees at any time using `withdraw_admin_fees`.

Fees are initially claimed via `PoolProxy.withdraw_many`. This withdraws fees from many pools at once, pulling them into the [PoolProxy](https://etherscan.io/address/0xeCb456EA5365865EbAb8a2661B0c503410e9B347#writeContract) contract.

!!!tip
    Admin fees can either be claimed through the corresponding PoolProxy or directly by calling the `withdraw_admin_fees` function on the pool contract itself.


### `admin_balances`
!!! description "`Pool.admin_balances(i: uint256) -> uint256:`"

    Getter for the admin fees of coin `i` in a specific pool.

    Returns: admin balances (`uint256`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `i` |  `uint256` | Coin Index |

    ??? quote "Source code"

        ```python hl_lines="3"    
        @view
        @external
        def admin_balances(i: uint256) -> uint256:
            return ERC20(self.coins[i]).balanceOf(self) - self.balances[i]
        ```

    === "Example"
        ```shell
        >>> Pool.admin_balances(0)
        466943482298782278664
        ```   


### `withdraw_admin_fees`
!!! description "`PoolProxy.withdraw_admin_fees(_pool: address):`"

    Function to claim admin fees from `pool` into this contract. This is the first step in the fee burning process. 

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_pool` |  `address` | Pool Address |

    ??? quote "Source code"

        ```python hl_lines="2 6"
        interface Curve:
            def withdraw_admin_fees(): nonpayable

        @external
        @nonreentrant('lock')
        def withdraw_admin_fees(_pool: address):
            """
            @notice Withdraw admin fees from `_pool`
            @param _pool Pool address to withdraw admin fees from
            """
            Curve(_pool).withdraw_admin_fees()
        ```

    === "Example"
        ```shell
        >>> GaugeController.withdraw_admin_fees("0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7")
        'whatever amount of admin fees sit in the contract'
        ```


### `withdraw_many`
!!! description "`PoolProxy.withdraw_many(_pools: address[20]):`"

    Withdraw fees from multiple pools in a single call.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_pool` |  `address` | Pool Address |

    ??? quote "Source code"

        ```python hl_lines="2 6"
        interface Curve:
            def withdraw_admin_fees(): nonpayable

        @external
        @nonreentrant('lock')
        def withdraw_many(_pools: address[20]):
            """
            @notice Withdraw admin fees from multiple pools
            @param _pools List of pool address to withdraw admin fees from
            """
            for pool in _pools:
                if pool == ZERO_ADDRESS:
                    break
                Curve(pool).withdraw_admin_fees()
        ```

    === "Example"
        ```shell
        >>> GaugeController.withdraw_many("0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7", "0xA5407eAE9Ba41422680e2e00537571bcC53efBfD")
        'whatever amount of admin fees sit in the contract'
        ```



## **CryptoSwap Pools**

### `claim_admin_fees`
!!! description "`CryptoSwapPool.claim_admin_fees():`"

    Function to claim admin fees from a CryptoSwap pool.

    ??? quote "Source code"

        ```python hl_lines="5 6 9"
        admin_fee_receiver: public(address)

        @external
        @nonreentrant('lock')
        def claim_admin_fees():
            self._claim_admin_fees()

        @internal
        def _claim_admin_fees():
            A_gamma: uint256[2] = self._A_gamma()

            xcp_profit: uint256 = self.xcp_profit
            xcp_profit_a: uint256 = self.xcp_profit_a

            # Gulp here
            _coins: address[N_COINS] = coins
            for i in range(N_COINS):
                self.balances[i] = ERC20(_coins[i]).balanceOf(self)

            vprice: uint256 = self.virtual_price

            if xcp_profit > xcp_profit_a:
                fees: uint256 = (xcp_profit - xcp_profit_a) * self.admin_fee / (2 * 10**10)
                if fees > 0:
                    receiver: address = self.admin_fee_receiver
                    frac: uint256 = vprice * 10**18 / (vprice - fees) - 10**18
                    claimed: uint256 = CurveToken(token).mint_relative(receiver, frac)
                    xcp_profit -= fees*2
                    self.xcp_profit = xcp_profit
                    log ClaimAdminFee(receiver, claimed)

            total_supply: uint256 = CurveToken(token).totalSupply()

            # Recalculate D b/c we gulped
            D: uint256 = Math(math).newton_D(A_gamma[0], A_gamma[1], self.xp())
            self.D = D

            self.virtual_price = 10**18 * self.get_xcp(D) / total_supply

            if xcp_profit > xcp_profit_a:
                self.xcp_profit_a = xcp_profit
        ```

    === "Example"
        ```shell
        >>> GaugeController.claim_admin_fees()
        todo
        ```



## **Burning Admin Fees**

### `burn`
!!! description "`PoolProxy.burn(_coin: address):`"

    !!!guard "Guarded Method"
        This function is only callable by EOA to prevent flashloan exploits.

    Transfer the contract’s balance of `coin` into the preset burner and execute the burn process.  
    
    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_coin` |  `address` | Token Address |

    ??? quote "Source code"

        ```python hl_lines="2 6"
        interface Burner:
            def burn(_coin: address) -> bool: payable

        @external
        @nonreentrant('burn')
        def burn(_coin: address):
            """
            @notice Burn accrued `_coin` via a preset burner
            @dev Only callable by an EOA to prevent flashloan exploits
            @param _coin Coin address
            """
            assert tx.origin == msg.sender
            assert not self.burner_kill

            _value: uint256 = 0
            if _coin == 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE:
                _value = self.balance

            Burner(self.burners[_coin]).burn(_coin, value=_value)  # dev: should implement burn()
        ```

    === "Example"
        ```shell
        >>> GaugeController.burn("todo")
        todo
        ```


### `burn_many`
!!! description "`PoolProxy.burn_many(_coins: address[20]):`"

    !!!guard "Guarded Method"
        This function is only callable by EOA to prevent flashloan exploits.

    Executes the burn process on many coins at once. Note that burning can be very gas intensive. In some cases burning 20 coins at once is not possible due to the block gas limit.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_coins` |  `address[20]` | Token Addresses |

    ??? quote "Source code"

        ```python hl_lines="3"
        @external
        @nonreentrant('burn')
        def burn_many(_coins: address[20]):
            """
            @notice Burn accrued admin fees from multiple coins
            @dev Only callable by an EOA to prevent flashloan exploits
            @param _coins List of coin addresses
            """
            assert tx.origin == msg.sender
            assert not self.burner_kill

            for coin in _coins:
                if coin == ZERO_ADDRESS:
                    break

                _value: uint256 = 0
                if coin == 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE:
                    _value = self.balance

                Burner(self.burners[coin]).burn(coin, value=_value)  # dev: should implement burn()
        ```

    === "Example"
        ```shell
        >>> GaugeController.burn_many("todo")
        todo
        ```


### `donate_admin_fees`
!!! description "`PoolProxy.donate_admin_fees(_pool: address):`"

    !!!guard "Guarded Method"
        This function is only callable by the `ownership_admin` of the contract.

    Donate a pool’s current admin fees to the pool LPs.
    
    !!!note
        Callable by the ownership admin, or any address given explicit permission to do so via `set_donate_approval`.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_pool` |  `address` | Pool Addresses |

    ??? quote "Source code"

        ```python hl_lines="2 6"
        interface Curve:
        def donate_admin_fees(): nonpayable
        
        @external
        @nonreentrant('lock')
        def donate_admin_fees(_pool: address):
            """
            @notice Donate admin fees of `_pool` pool
            @param _pool Pool address
            """
            if msg.sender != self.ownership_admin:
                assert self.donate_approval[_pool][msg.sender], "Access denied"

            Curve(_pool).donate_admin_fees()  # dev: if implemented by the pool
        ```

    === "Example"
        ```shell
        >>> GaugeController.donate_admin_fees("todo")
        todo
        ```

        