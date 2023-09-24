`PoolProxy` is used for indirect ownership of exchange contracts or their factories.

As these proxies are the indirect admins of the exchange contracts, they are used to call admin-only functions. These admin functions vary primarily based on the type of liquidity pool, whether it's a StableSwap or a CryptoSwap pool. For a clearer overview, please refer to the *admin-control section of StableSwap or CryptoSwap pools*.

There are multiple deployed **`PoolProxy`** contracts.
For a overview of all actively used proxies, see [here](../ownership-proxy/overview.md).


# Deploying Pools 
Pool deployment is permissionless, with the exception of base pools. Thus, the `deploy_pool` function can be directly called on the Factory contract. For more information about Factory contracts and their usage, see [here](../../factory/overview.md).


# Parameter Changes
Parameter changes need to be done through the proxy, as those relevant functions can only be called by the parameter admin.
For more information on parameter changes see [here](../../stableswap_exchange/pools/admin_pool_settings.md).


# Killing Pools

### `kill_me`
!!! description "`PoolProxy.kill_me(_pool: address):`"

    Function to pause the liquidity pool `_pool`.

    !!!warning
        This function can only be called by the emergency admin.  
        While the pool is killed, only `remove_liquidity` is callable.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_pool` |  `address` | Pool address |

    ??? quote "Source code"

        === "PoolProxy.vy"

            ```python hl_lines="3 21"
            interface Curve:
                def withdraw_admin_fees(): nonpayable
                def kill_me(): nonpayable
                def unkill_me(): nonpayable
                def commit_transfer_ownership(new_owner: address): nonpayable
                def apply_transfer_ownership(): nonpayable
                def accept_transfer_ownership(): nonpayable
                def revert_transfer_ownership(): nonpayable
                def commit_new_parameters(amplification: uint256, new_fee: uint256, new_admin_fee: uint256): nonpayable
                def apply_new_parameters(): nonpayable
                def revert_new_parameters(): nonpayable
                def commit_new_fee(new_fee: uint256, new_admin_fee: uint256): nonpayable
                def apply_new_fee(): nonpayable
                def ramp_A(_future_A: uint256, _future_time: uint256): nonpayable
                def stop_ramp_A(): nonpayable
                def set_aave_referral(referral_code: uint256): nonpayable
                def donate_admin_fees(): nonpayable

            @external
            @nonreentrant('lock')
            def kill_me(_pool: address):
                """
                @notice Pause the pool `_pool` - only remove_liquidity will be callable
                @param _pool Pool address to pause
                """
                assert msg.sender == self.emergency_admin, "Access denied"
                Curve(_pool).kill_me()
            ```

        === "Pool.vy"

            ```python hl_lines="1 4"
            is_killed: bool

            @external
            def kill_me():
                assert msg.sender == self.owner  # dev: only owner
                assert self.kill_deadline > block.timestamp  # dev: deadline has passed
                self.is_killed = True
            ```

    === "Example"
        ```shell
        >>> PoolProxy.kill_me(todo):
        todo
        ```


# PoolProxy

There is an old pool proxy which was the owner of early deployed curve liquitity pools before pool factories were created. That proxy was also used as the `fee_receiver` of admin fees and to send those to burners and the FeeDistributor.

# Burners
For configuration of burners please refer to [Burner](/docs/curve_dao/FeeCollection%26Distribution/burner.md).


# **Admin Fees**
For withdrawing and burning admin fees please refer to [Withdrawing and Burning Admin Fees](/docs/curve_dao/FeeCollection%26Distribution/withdraw-and-burn.md).