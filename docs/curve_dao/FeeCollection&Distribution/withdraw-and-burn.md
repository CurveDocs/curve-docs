## **Withdrawing Admin Fees from StableSwap Pools**
Admin fees are stored within each exchange contract and viewable via the `admin_balances` public getter method. The contract owner may call to claim the fees at any time using `withdraw_admin_fees`. Most pools also include a function to donate pending fees to liquidity providers via `donate_admin_fees`.

Fees are initially claimed via `PoolProxy.withdraw_many`. This withdraws fees from many pools at once, pulling them into the [PoolProxy](https://etherscan.io/address/0xeCb456EA5365865EbAb8a2661B0c503410e9B347#writeContract) contract.

!!!note
    Admin fees can also be claimed by calling the `withdraw_admin_fees` function on the pool contract itself.



### `admin_balances`
!!! description "`Pool.admin_balances(i: uint256) -> uint256:`"

    Getter for the admin fees of coin `i` in a specific pool.

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

    === "Example for 3pool `admin_balances`"
        ```shell
        >>> Pool.admin_balances(0)
        466943482298782278664
        ```   


### `withdraw_admin_fees`
!!! description "`PoolProxy.withdraw_admin_fees(_pool: address):`"

    Function to claim admin fees from `pool` into this contract. This is the first step in the fee burning process. 

    !!!note
        This function is unguarded - it may be called by any address.

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
    
    !!!note
        This function is unguarded - it may be called by any address.

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



## **Withdrawing Admin Fees from CryptoSwap Pools**
Claiming admin fees from CryptoSwap pools is a bit different than claiming from StableSwap pools. For these kind of pools the admin fees are not stored in `admin_balances`. When `claim_admin_fees` is called, some magic calcs happen (need fiddy's help here) and whatever is the final fee gets deposited into the pool and it mint the LP token of the pool --> gets sent to burners. 


### `claim_admin_fees`
!!! description "`CryptoSwapPool.claim_admin_fees():`"

    Function to claim admin fees from a CryptoSwap pool.

    !!!note
        This function is unguarded - it may be called by any address.
        The `admin_fee_receiver` is set when deploying the pool. Default `fee_receiver` is [0xeCb](https://etherscan.io/address/0xeCb456EA5365865EbAb8a2661B0c503410e9B347) when the pool is created via the [factory](https://etherscan.io/address/0xf18056bbd320e96a48e3fbf8bc061322531aac99#code).  
        NOTE: `fee_receiver` can be changed by the DAO.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_pool` |  `address` | Pool Address |

    ??? quote "Source code"

        ```python hl_lines="1 4 9 45"
        admin_fee_receiver: public(address)

        @external
        def set_admin_fee_receiver(_admin_fee_receiver: address):
            assert msg.sender == self.owner  # dev: only owner
            self.admin_fee_receiver = _admin_fee_receiver

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

        @external
        @nonreentrant('lock')
        def claim_admin_fees():
            self._claim_admin_fees()
        ```

    === "Example"
        ```shell
        >>> GaugeController.claim_admin_fees()
        todo
        ```



## **Burning Admin Fees**

### `burn`
!!! description "`PoolProxy.burn(_coin: address):`"

    Transfer the contract’s balance of `coin` into the preset burner and execute the burn process.  

    !!!note
        Only callable via an externally owned account; a check that tx.origin == msg.sender is performed to prevent potential flashloan exploits.
    
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

    Execute the burn process on many coins at once.  
    Note that burning can be very gas intensive. In some cases burning 20 coins at once is not possible due to the block gas limit.
    
    !!!note
        Only callable via an externally owned account; a check that tx.origin == msg.sender is performed to prevent potential flashloan exploits.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_coins` |  `address` | Token Addresses |

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
        >>> GaugeController.burn_many("todo")
        todo
        ```

        