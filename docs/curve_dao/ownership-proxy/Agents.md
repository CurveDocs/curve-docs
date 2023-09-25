The Curve DAO has a total of three [Aragon Agent](https://legacy-docs.aragon.org/aragon/readme) ownership addresses, which are governed by two independent DAOs:

## **Community DAO** 
The Community DAO (or just “the DAO”) governs the day-to-day operation of the protocol.

Voting is based on a user’s holdings of *“Vote-Escrowed CRV”* (veCRV). veCRV is obtained by locking CRV for up to 4 years, with 1 veCRV equal to 1 CRV locked for 4 years. As the lock time decreases, an account’s veCRV balance decreases linearly as the time remaining until unlock decreases. *veCRV is non-transferrable*.

An account must have a *minimum balance of 2500 veCRV* to make a DAO vote. Each vote lasts for *one week*. Votes cannot be executed after the they successfully passed.

!!!deploy "Contract Source & Deployment"
    **CurveOwnershipAgent** contract is deployed to the Ethereum mainnet at: [0x40907540d8a6C65c637785e8f8B742ae6b0b9968](https://etherscan.io/address/0x40907540d8a6C65c637785e8f8B742ae6b0b9968).  
    **CurveParameterAgent** contract is deployed to the Ethereum mainnet at: [0x4EEb3bA4f221cA16ed4A0cC7254E2E32DF948c5f](https://etherscan.io/address/0x4EEb3bA4f221cA16ed4A0cC7254E2E32DF948c5f).

1. ### *Ownership Admin*
The ownership admin controls most functionality within the protocol. Performing an action via the ownership admin requires a 30% quorum with 51% support.


2. ### *Parameter Admin*
The parameter admin has authority to modify parameters on pools, such as adjusting the amplification co-efficient. Performing an action via the paramater admin requries a 15% quorum with 51% support.  




## **Emergency DAO**
The EmergencyDAO has limited authority to kill non-factory pools and gauges during extraordinary circumstances.

!!!deploy "Contract Source & Deployment"
    **EmergencyDAO** contract is deployed to the Ethereum mainnet at: [0x467947EE34aF926cF1DCac093870f613C96B1E0c](https://etherscan.io/address/0x467947EE34aF926cF1DCac093870f613C96B1E0c).

This DAO consists of **nine members**, comprised of a mix of the Curve team and prominent figures within the DeFi community. Each member has one vote. Any member may propose a vote.

All members of the EmergencyDAO may propose new votes. A vote *lasts for 24 hours* and can be *executed immediately once it receives 66% support*.

| Name     | Details - Telegram | Twitter  | 
| -------- | -------| ---- |
| **`banteg`**      |  `Yearn, @banteg` |  [@banteg](https://twitter.com/bantg)  |
| **`Calvin`**      |  `@calchulus` |  [@calchulus](https://twitter.com/calchulus) |
| **`C2tP`**        |  `Convex, @c2tp_eth`| [@C2tP](https://twitter.com/C2tP) |
| **`Darly Lau`**   |  `@Daryllautk` |  [@Daryllautk](https://twitter.com/Daryllautk)| 
| **`Ga3b_node`**   | `@ga3b_node` | 
| **`Naga King`**   | `@nagakingg` | [@nagakingg](https://twitter.com/nagakingg)   |
| **`Peter MM`**    | `@PeterMm` |
| **`Addison`**     | `@addisonthunderhead` | [@0xaddi](https://twitter.com/0xaddi)  |
| **`Quentin Milne`**|   `StakeDAO, @Kii_iu`|


!!!tip
    To obtain the current members' addresses, query `getOwners` within the [EmergencyDAO contract]((https://etherscan.io/address/0x467947EE34aF926cF1DCac093870f613C96B1E0c)).


### **Killing Pools**

Non-Factory liquidity pools can be killed by calling the `kill_me()` function of the pool. The function can only be called within the first 2 months after deploying the pool.

!!!guard "Guarded Method"
    This function is only callable by the `owner`/`admin` of the pools.
        
Calling `kill_me()` sets the `is_killed` variable of the pool to *True*. 
By doing this, the contract prevents users from performing actions such as `exchange`, `add_liquidity`, `remove_liquidity_imbalance` and `remove_liquidity_one_coin`. 
Users can only remove funds by calling `remove_liquidity`.

In general, a pool can be "unkilled" again by calling the function `unkill_me()`. This reverts the changes made when it was killed."

??? quote "Source code"

    ```python hl_lines="1 2 3 6 9 12 14"
    is_killed: bool
    kill_deadline: uint256
    KILL_DEADLINE_DT: constant(uint256) = 2 * 30 * 86400

    @external
    def kill_me():
        assert msg.sender == self.owner  # dev: only owner
        assert self.kill_deadline > block.timestamp  # dev: deadline has passed
        self.is_killed = True

    @external
    def unkill_me():
        assert msg.sender == self.owner  # dev: only owner
        self.is_killed = False    
    ```




### **Killing Gauges**
Gauges can be killed by calling the `set_killed()` function on the corresponding gauge, thereby setting the `is_killed` variable to *True*.  
By doing this, the rate of the gauge is set to 0, effectively stopping all the $CRV emissions.

??? quote "Source code"

    ```python hl_lines="1 4 12 31 32 33"
    is_killed: public(bool)

    @external
    def set_killed(_is_killed: bool):
        """
        @notice Set the killed status for this contract
        @dev When killed, the gauge always yields a rate of 0 and so cannot mint CRV
        @param _is_killed Killed status to set
        """
        assert msg.sender == self.admin

        self.is_killed = _is_killed

    @internal
    def _checkpoint(addr: address):
        """
        @notice Checkpoint for a user
        @param addr User address
        """
        _period: int128 = self.period
        _period_time: uint256 = self.period_timestamp[_period]
        _integrate_inv_supply: uint256 = self.integrate_inv_supply[_period]
        rate: uint256 = self.inflation_rate
        new_rate: uint256 = rate
        prev_future_epoch: uint256 = self.future_epoch_time
        if prev_future_epoch >= _period_time:
            self.future_epoch_time = CRV20(CRV).future_epoch_time_write()
            new_rate = CRV20(CRV).rate()
            self.inflation_rate = new_rate

        if self.is_killed:
            # Stop distributing inflation as soon as killed
            rate = 0

        # Update integral of 1/supply
        if block.timestamp > _period_time:
            _working_supply: uint256 = self.working_supply
            Controller(GAUGE_CONTROLLER).checkpoint_gauge(self)
            prev_week_time: uint256 = _period_time
            week_time: uint256 = min((_period_time + WEEK) / WEEK * WEEK, block.timestamp)

            for i in range(500):
                dt: uint256 = week_time - prev_week_time
                w: uint256 = Controller(GAUGE_CONTROLLER).gauge_relative_weight(self, prev_week_time / WEEK * WEEK)

                if _working_supply > 0:
                    if prev_future_epoch >= prev_week_time and prev_future_epoch < week_time:
                        # If we went across one or multiple epochs, apply the rate
                        # of the first epoch until it ends, and then the rate of
                        # the last epoch.
                        # If more than one epoch is crossed - the gauge gets less,
                        # but that'd meen it wasn't called for more than 1 year
                        _integrate_inv_supply += rate * w * (prev_future_epoch - prev_week_time) / _working_supply
                        rate = new_rate
                        _integrate_inv_supply += rate * w * (week_time - prev_future_epoch) / _working_supply
                    else:
                        _integrate_inv_supply += rate * w * dt / _working_supply
                    # On precisions of the calculation
                    # rate ~= 10e18
                    # last_weight > 0.01 * 1e18 = 1e16 (if pool weight is 1%)
                    # _working_supply ~= TVL * 1e18 ~= 1e26 ($100M for example)
                    # The largest loss is at dt = 1
                    # Loss is 1e-9 - acceptable

                if week_time == block.timestamp:
                    break
                prev_week_time = week_time
                week_time = min(week_time + WEEK, block.timestamp)

        _period += 1
        self.period = _period
        self.period_timestamp[_period] = block.timestamp
        self.integrate_inv_supply[_period] = _integrate_inv_supply

        # Update user-specific integrals
        _working_balance: uint256 = self.working_balances[addr]
        self.integrate_fraction[addr] += _working_balance * (_integrate_inv_supply - self.integrate_inv_supply_of[addr]) / 10 ** 18
        self.integrate_inv_supply_of[addr] = _integrate_inv_supply
        self.integrate_checkpoint_of[addr] = block.timestamp
    ```