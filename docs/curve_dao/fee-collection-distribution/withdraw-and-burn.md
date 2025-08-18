# **Withdrawing Admin Fees**

In order to be able to burn admin fees into the fee token, those fees have to be claimed prior. **Admin fees can be claimed by anyone.** Somethimes, the function to claim the fees is guarded and therefore only called by the proxy contract (admin or owner of the pool). If thats the case, users can just call the claim function via the proxy contract (as the function is not guarded there).

Claiming fees can differ based on which source they are claimed from:

## **StableSwap Pools**
Admin fees are stored within each exchange contract and viewable via the public getter method **`admin_balances`**. Users may call **`withdraw_admin_fees`** to claim the fees at any time.

Fees are usually claimed via the **`withdraw_many`** function of the PoolProxy. This withdraws fees from multiple pools at once, pulling them into the [PoolProxy](https://etherscan.io/address/0xeCb456EA5365865EbAb8a2661B0c503410e9B347#writeContract) contract.

!!!tip
    Admin fees can either be claimed through the corresponding PoolProxy or directly by calling the **`withdraw_admin_fees`** function on the pool contract itself (if the function is not guarded).


### `admin_balances`
!!! description "`Pool.admin_balances(i: uint256) -> uint256:`"

    Getter for the admin fees of coin `i` in a specific pool.

    Returns: admin balances (`uint256`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `i` |  `uint256` | coin index |

    ??? quote "Source code"

        ```vyper
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

    !!!info
        This function is called from the PoolProxy.

    Function to claim admin fees from `pool` into this contract. This is the first step in the fee burning process. 

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_pool` |  `address` | pool address |

    ??? quote "Source code"

        ```vyper
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
        >>> PoolProxy.withdraw_admin_fees("0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7")
        'whatever amount of admin fees sit in the contract'
        ```


### `withdraw_many`
!!! description "`PoolProxy.withdraw_many(_pools: address[20]):`"

    !!!info
        This function is called from the PoolProxy.

    Function to withdraw fees from multiple pools in a single call.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_pool` |  `address` | Pool Address |

    ??? quote "Source code"

        ```vyper
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
        >>> PoolProxy.withdraw_many("0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7", "0xA5407eAE9Ba41422680e2e00537571bcC53efBfD")
        'whatever amount of admin fees sit in the contract'
        ```



## **CryptoSwap Pools**
Fees of crypto pools are a bit different from stableswap pools. These pools have an auto-rebalancing mechanism which uses parts of the admin fees for rebalancing purposes. After taking this into consideration, fees are claimed by minting the admin's share (which essentially is the admin fee) of the pool as LP tokens.

Fees are mostly claimed directly from the pool.


### `claim_admin_fees`
!!! description "`Pool.claim_admin_fees():`"

    Function to claim admin fees from a crypto pool.

    ??? quote "Source code"

        ```vyper 
        event ClaimAdminFee:
            admin: indexed(address)
            tokens: uint256

        @external
        @nonreentrant("lock")
        def claim_admin_fees():
            """
            @notice Claim admin fees. Callable by anyone.
            """
            self._claim_admin_fees()

        @internal
        def _claim_admin_fees():
            """
            @notice Claims admin fees and sends it to fee_receiver set in the factory.
            """
            A_gamma: uint256[2] = self._A_gamma()

            xcp_profit: uint256 = self.xcp_profit  # <---------- Current pool profits.
            xcp_profit_a: uint256 = self.xcp_profit_a  # <- Profits at previous claim.
            total_supply: uint256 = self.totalSupply

            # Do not claim admin fees if:
            # 1. insufficient profits accrued since last claim, and
            # 2. there are less than 10**18 (or 1 unit of) lp tokens, else it can lead
            #    to manipulated virtual prices.
            if xcp_profit <= xcp_profit_a or total_supply < 10**18:
                return

            #      Claim tokens belonging to the admin here. This is done by 'gulping'
            #       pool tokens that have accrued as fees, but not accounted in pool's
            #         `self.balances` yet: pool balances only account for incoming and
            #                  outgoing tokens excluding fees. Following 'gulps' fees:

            for i in range(N_COINS):
                if coins[i] == WETH20:
                    self.balances[i] = self.balance
                else:
                    self.balances[i] = ERC20(coins[i]).balanceOf(self)

            #            If the pool has made no profits, `xcp_profit == xcp_profit_a`
            #                         and the pool gulps nothing in the previous step.

            vprice: uint256 = self.virtual_price

            #  Admin fees are calculated as follows.
            #      1. Calculate accrued profit since last claim. `xcp_profit`
            #         is the current profits. `xcp_profit_a` is the profits
            #         at the previous claim.
            #      2. Take out admin's share, which is hardcoded at 5 * 10**9.
            #         (50% => half of 100% => 10**10 / 2 => 5 * 10**9).
            #      3. Since half of the profits go to rebalancing the pool, we
            #         are left with half; so divide by 2.

            fees: uint256 = unsafe_div(
                unsafe_sub(xcp_profit, xcp_profit_a) * ADMIN_FEE, 2 * 10**10
            )

            # ------------------------------ Claim admin fees by minting admin's share
            #                                                of the pool in LP tokens.
            receiver: address = Factory(self.factory).fee_receiver()
            if receiver != empty(address) and fees > 0:

                frac: uint256 = vprice * 10**18 / (vprice - fees) - 10**18
                claimed: uint256 = self.mint_relative(receiver, frac)

                xcp_profit -= fees * 2

                self.xcp_profit = xcp_profit

                log ClaimAdminFee(receiver, claimed)

            # ------------------------------------------- Recalculate D b/c we gulped.
            D: uint256 = MATH.newton_D(A_gamma[0], A_gamma[1], self.xp(), 0)
            self.D = D

            # ------------------- Recalculate virtual_price following admin fee claim.
            #     In this instance we do not check if current virtual price is greater
            #               than old virtual price, since the claim process can result
            #                                     in a small decrease in pool's value.

            self.virtual_price = 10**18 * self.get_xcp(D) / self.totalSupply
            self.xcp_profit_a = xcp_profit  # <------------ Cache last claimed profit.
        ```

    === "Example"
        ```shell
        >>> Pool.claim_admin_fees()
        ```


## **Curve Stablecoin**
crvUSD fees are based on the borrow rate of the corresponding markets. Fees are accurred in crvUSD token. They can be claimed from the according Controller.

### `admin_fees`
!!! description "`Controller.admin_fees() -> uint256:`"

    Getter for the currently claimable admin fees form a Controller. These fees can be collected via the `collect_fees()` function (see below).

    ??? quote "Source code"

        ```vyper 
        @external
        @view
        def admin_fees() -> uint256:
            """
            @notice Calculate the amount of fees obtained from the interest
            """
            rate_mul: uint256 = AMM.get_rate_mul()
            loan: Loan = self._total_debt
            loan.initial_debt = loan.initial_debt * rate_mul / loan.rate_mul
            loan.initial_debt += self.redeemed
            minted: uint256 = self.minted
            return unsafe_sub(max(loan.initial_debt, minted), minted)
        ```

    === "Example"
        ```shell
        >>> Controller.admin_fees()
        14630333074120584376402
        ```


### `collect_fees`
!!! description "`Controller.collect_fees():`"

    Function to collects all fees, including borrowing-based fees (interest rate) and AMM-based fees (swap fee, if applicable).

    ??? quote "Source code"

        ```vyper 
        @external
        @nonreentrant('lock')
        def collect_fees() -> uint256:
            """
            @notice Collect the fees charged as interest
            """
            _to: address = FACTORY.fee_receiver()
            # AMM-based fees
            borrowed_fees: uint256 = AMM.admin_fees_x()
            collateral_fees: uint256 = AMM.admin_fees_y()
            if borrowed_fees > 0:
                STABLECOIN.transferFrom(AMM.address, _to, borrowed_fees)
            if collateral_fees > 0:
                assert COLLATERAL_TOKEN.transferFrom(AMM.address, _to, collateral_fees, default_return_value=True)
            AMM.reset_admin_fees()

            # Borrowing-based fees
            rate_mul: uint256 = self._rate_mul_w()
            loan: Loan = self._total_debt
            loan.initial_debt = loan.initial_debt * rate_mul / loan.rate_mul
            loan.rate_mul = rate_mul
            self._total_debt = loan

            # Amount which would have been redeemed if all the debt was repaid now
            to_be_redeemed: uint256 = loan.initial_debt + self.redeemed
            # Amount which was minted when borrowing + all previously claimed admin fees
            minted: uint256 = self.minted
            # Difference between to_be_redeemed and minted amount is exactly due to interest charged
            if to_be_redeemed > minted:
                self.minted = to_be_redeemed
                to_be_redeemed = unsafe_sub(to_be_redeemed, minted)  # Now this is the fees to charge
                STABLECOIN.transfer(_to, to_be_redeemed)
                log CollectFees(to_be_redeemed, loan.initial_debt)
                return to_be_redeemed
            else:
                log CollectFees(0, loan.initial_debt)
                return 0
        ```

    === "Example"
        ```shell
        >>> Controller.collect_fees()
        ```


# **Burning Admin Fees**

All admin fees are accumulated in the [0xECB](https://etherscan.io/address/0xeCb456EA5365865EbAb8a2661B0c503410e9B347) :material-information-outline:{ title="shhhh!! don't tell Christine Lagarde!" } contract and are burned according to the fee-burner settings designated for each specific coin.   
*These functions need to be called from the 0xECB contract.*


### `burn`
!!! description "`0xECB.burn(_coin: address):`"

    !!!guard "Guarded Method"
        This function is only callable by EOA to prevent flashloan exploits.

    Transfer the contract’s balance of `coin` into the according burner and execute the burn process.  
    
    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_coin` |  `address` | Token Address |

    ??? quote "Source code"

        ```vyper 
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
        >>> 0xECB.burn("todo")
        todo
        ```


### `burn_many`
!!! description "`0xECB.burn_many(_coins: address[20]):`"

    !!!guard "Guarded Method"
        This function is only callable by EOA to prevent flashloan exploits.

    Executes the burn process on many coins at once. 
    
    !!!note
    Burning can be very gas intensive. In some cases burning 20 coins at once is not possible due to the block gas limit.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_coins` |  `address[20]` | Token Addresses |

    ??? quote "Source code"

        ```vyper
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
        >>> 0xECB.burn_many("todo")
        todo
        ```


### `donate_admin_fees`
!!! description "`0xECB.donate_admin_fees(_pool: address):`"

    !!!warning
        **Most pools do not have this donation function implemented!**

    !!!guard "Guarded Method"
        This function is only callable by the `ownership_admin` or its prior approved wallets.

    Function donate a pool’s current admin fees to the pool LPs.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_pool` |  `address` | pool addresses |

    ??? quote "Source code"

        ```vyper
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
        >>> 0xECB.donate_admin_fees("todo")
        todo
        ```


### `donate_admin_fees`
!!! description "`0xECB.set_donate_approval(_pool: address, _caller: address, _is_approved: bool):`"

    !!!warning
        **Most pools do not have this donation function implemented!**

    !!!guard "Guarded Method"
        This function is only callable by the `ownership_admin` of the contract.

    Function to set donation approval for `_pool` to `_caller`.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_pool` |  `address` | pool address |
    | `_caller` |  `address` | address to set approval for |
    | `_is_approved` |  `bool` | approval status |

    ??? quote "Source code"

        ```vyper
        # pool -> caller -> can call `donate_admin_fees`
        donate_approval: public(HashMap[address, HashMap[address, bool]])

        @external
        def set_donate_approval(_pool: address, _caller: address, _is_approved: bool):
            """
            @notice Set approval of `_caller` to donate admin fees for `_pool`
            @param _pool Pool address
            @param _caller Adddress to set approval for
            @param _is_approved Approval status
            """
            assert msg.sender == self.ownership_admin, "Access denied"

            self.donate_approval[_pool][_caller] = _is_approved
        ```

    === "Example"
        ```shell
        >>> 0xECB.set_donate_approval("todo")
        todo
        ```