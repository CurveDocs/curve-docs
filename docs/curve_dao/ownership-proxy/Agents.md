The Curve DAO has a total of three [Aragon Agent](https://legacy-docs.aragon.org/aragon/readme) ownership addresses, which are governed by two independent DAOs:

## **Community DAO** 
The Community DAO (or just “the DAO”) governs the day-to-day operation of the protocol.

Voting is based on a user’s holdings of *“Vote-Escrowed CRV”* (veCRV). veCRV is obtained by locking CRV for up to 4 years, with 1 veCRV equal to 1 CRV locked for 4 years. As the lock time decreases, an account’s veCRV balance decreases linearly as the time remaining until unlock decreases. *veCRV is non-transferrable*.

An account must have a *minimum balance of 2500 veCRV* to make a DAO vote. Each vote lasts for *one week*. Votes cannot be executed before it successfully passed.

!!!deploy "Contract Source & Deployment"
    **CurveOwnershipAgent** contract is deployed to the Ethereum mainnet at: [0x40907540d8a6C65c637785e8f8B742ae6b0b9968](https://etherscan.io/address/0x40907540d8a6C65c637785e8f8B742ae6b0b9968).  
    **CurveParameterAgent** contract is deployed to the Ethereum mainnet at: [0x4EEb3bA4f221cA16ed4A0cC7254E2E32DF948c5f](https://etherscan.io/address/0x4EEb3bA4f221cA16ed4A0cC7254E2E32DF948c5f).



**The DAO has ownership of two admin accounts:**

- ### **`Ownership Admin`**
The ownership admin controls most functionality within the protocol. Performing an action via the ownership admin requires a 30% quorum with 51% support.


- ### **`Parameter Admin`**    
The parameter admin has authority to modify parameters on pools, such as adjusting the amplification coefficient and fees. Performing an action via the paramater admin requries a 15% quorum with 51% support.




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
    To obtain the current addresses of all members, query `getOwners` within the [EmergencyDAO contract]((https://etherscan.io/address/0x467947EE34aF926cF1DCac093870f613C96B1E0c)).


### **Killing Pools**

Non-Factory liquidity pools can be killed by calling the `kill_me()` function of the pool. The function can only be called within the first 2 months after deploying the pool.

!!!guard "Guarded Method"
    This function is only callable by the `owner`/`admin` of the pools.
        
Killing pools results in the contract preventing users to perform actions such as `exchange`, `add_liquidity`, `remove_liquidity_imbalance` and `remove_liquidity_one_coin`.   
**Users can only remove funds by calling `remove_liquidity`.**

A pool can be unkilled by calling the function `unkill_me()`.

??? quote "kill_me()"

    ```vyper
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
A killed gauge has a rate of 0, effectively stopping all CRV emissions.

??? quote "set_killed(_is_killed: bool)"
  
    ```vyper
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

        ...
    ```