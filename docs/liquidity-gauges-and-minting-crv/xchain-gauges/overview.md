<h1>Curve Crosschain Gauges</h1>

Due to the x-chain gauge system, Curve allows to deploy liquidity gauges on alternate chains which are eligible for receiving CRV emissions and boosts.

In order for a sidechain gauge to receive CRV emissions, the system uses a two-gauge approach:

- A **Root Gauge**, which is deployed on Ethereum and acts as the parent gauge for a child gauge deployed on other chains. This is the gauge that can be added to the `GaugeController` and is eligible to receive voting weight and therefore CRV emissions. Once a root gauge receives some weight and therefore CRV emissions, it can mint the according CRV emissions and transmit them to the child gauge on the target chain. All this is done in a permissionless way allowing anyone to transmit the CRV emissions to the child gauge.
- A **Child Gauge** containing the standard logic of a Curve liquidity gauge on Ethereum, which is deployed on alternate chains and acts as the child gauge for the root gauge on Ethereum.



---


# **Smart Contracts**

The cross-chain gauge factory requires components to be deployed both on Ethereum and on an alternate EVM compatible network.

<div class="grid cards" markdown>

-   :logos-vyper: **RootGaugeFactory**

    ---

    This is the main contract for deploying root gauges on Ethereum. It also serves as a registry for finding deployed gauges and the bridge wrapper contracts used to bridge CRV emissions to alternate chains.

    [:octicons-arrow-right-24: `RootGaugeFactory.vy`](./RootGaugeFactory.md)

-   :logos-vyper: **ChildGaugeFactory**

    ---

    This is the main contract for deploying child gauges on alternate chains. This contract also serves as a registry for finding deployed gauges and as a psuedo CRV minter where users can claim CRV emissions they are entitled to from LPing.

    [:octicons-arrow-right-24: `ChildGaugeFactory.vy`](./ChildGaugeFactory.md)

-   :logos-vyper: **RootGauge**

    ---

    This is the implementation used for root gauges deployed on Ethereum.

    [:octicons-arrow-right-24: `RootGauge.vy`](./RootGauge.md)

-   :logos-vyper: **ChildGauge**

    ---

    This is the implementation used for child gauges deployed on alternate chains.

    [:octicons-arrow-right-24: `ChildGauge.vy`](./ChildGauge.md)

-   :logos-vyper: **Bridgers**

    ---

    These contracts are used to bridge CRV emissions across chains. Due to the increasing number of networks Curve deploys to, bridge wrappers adhere to a specific interface and allow for a modular bridging system.

    [:octicons-arrow-right-24: `Bridgers.vy`](./Bridgers.md)

-   :logos-vyper: **Updater**

    ---

    This contract is used to transmit veCRV information across chains to a `L2 VotingEscrow Oracle`.

    [:octicons-arrow-right-24: `Updater.vy`](../boosting-sidechains/Updater.md)

-   :logos-vyper: **L2 VotingEscrow Oracle**

    ---

    This contract is used to store veCRV information on child chains.

    [:octicons-arrow-right-24: `L2 VotingEscrow Oracle.vy`](../boosting-sidechains/L2VotingEscrowOracle.md)

</div>


---

# **Boosting on Sidechains**

Before reading this section, it is recommended to understand how boosting works in general.

!!!warning "Crosschain Boosts"
    This system is farily new and is not rolled out on every chain yet. Crosschain boosts only work if there is a `L2 VotingEscrow Oracle` set in the `ChildGaugeFactory` for the child chain.


Because the `VotingEscrow`, where CRV are locked and user's veCRV informations are stored, is only deployed on Ethereum, a novel system was created to make crosschain boosts possible.

The idea of the system is pretty straight forward: an `Updater` contract on Ethereum queries the veCRV information of a user from the `VotingEscrow` contract on Ethereum and transmits the information to a `L2 VotingEscrow Oracle` on the child chain. This way, boosts on sidechains can be calculated using the veCRV information from Ethereum.

!!!tip "L2 VotingEscrow Oracle Example for Fraxtal"
    The [`Updater`](https://etherscan.io/address/0xc73e8d8f7A68Fc9d67e989250484E57Ae03a5Da3) contract on Ethereum makes use of the `update` function to query and transmit the veCRV information of a user from the [`VotingEscrow`](https://etherscan.io/address/0x5f3b5DfEb7B28CDbD7FAba78963EE202a494e2A2) on Ethereum to the [`L2 VotingEscrow Oracle`](https://fraxscan.com/address/0xc73e8d8f7A68Fc9d67e989250484E57Ae03a5Da3) on Fraxtal. For messaging, the [`Fraxtal: L1 Cross Domain Messenger Proxy`](https://etherscan.io/address/0x126bcc31bc076b3d515f60fbc81fdde0b0d542ed) is used to send the message. To relay the message, the [`Fraxtal: Cross Domain Messenger`](https://fraxscan.com/address/0x4200000000000000000000000000000000000007) is used.

    ???quote ":logos-vyper: `Updater.vy`"

        ```vyper
        # @version 0.3.10
        """
        @title Updater
        """

        interface OVMMessenger:
            def sendMessage(_target: address, _data: Bytes[1024], _gas_limit: uint32): nonpayable

        interface OVMChain:
            def enqueueL2GasPrepaid() -> uint32: view

        interface VotingEscrow:
            def epoch() -> uint256: view
            def point_history(_idx: uint256) -> Point: view
            def user_point_epoch(_user: address) -> uint256: view
            def user_point_history(_user: address, _idx: uint256) -> Point: view
            def locked(_user: address) -> LockedBalance: view
            def slope_changes(_ts: uint256) -> int128: view


        struct LockedBalance:
            amount: int128
            end: uint256

        struct Point:
            bias: int128
            slope: int128
            ts: uint256
            blk: uint256


        WEEK: constant(uint256) = 86400 * 7
        VOTING_ESCROW: public(constant(address)) = 0x5f3b5DfEb7B28CDbD7FAba78963EE202a494e2A2


        ovm_chain: public(address)  # CanonicalTransactionChain
        ovm_messenger: public(address)  # CrossDomainMessenger


        @external
        def __init__(_ovm_chain: address, _ovm_messenger: address):
            self.ovm_chain = _ovm_chain
            self.ovm_messenger = _ovm_messenger


        @external
        def update(_user: address = msg.sender, _gas_limit: uint32 = 0):
            # https://community.optimism.io/docs/developers/bridge/messaging/#for-l1-%E2%87%92-l2-transactions
            gas_limit: uint32 = _gas_limit
            if gas_limit == 0:
                gas_limit = OVMChain(self.ovm_chain).enqueueL2GasPrepaid()

            epoch: uint256 = VotingEscrow(VOTING_ESCROW).epoch()
            point_history: Point = VotingEscrow(VOTING_ESCROW).point_history(epoch)

            user_point_epoch: uint256 = VotingEscrow(VOTING_ESCROW).user_point_epoch(_user)
            user_point_history: Point = VotingEscrow(VOTING_ESCROW).user_point_history(_user, user_point_epoch)
            locked: LockedBalance = VotingEscrow(VOTING_ESCROW).locked(_user)

            start_time: uint256 = WEEK + (point_history.ts / WEEK) * WEEK
            slope_changes: int128[12] = empty(int128[12])

            for i in range(12):
                slope_changes[i] = VotingEscrow(VOTING_ESCROW).slope_changes(start_time + WEEK * i)

            OVMMessenger(self.ovm_messenger).sendMessage(
                self,
                _abi_encode(
                    _user,
                    epoch,
                    point_history,
                    user_point_epoch,
                    user_point_history,
                    locked,
                    slope_changes,
                    method_id=method_id("update(address,uint256,(int128,int128,uint256,uint256),uint256,(int128,int128,uint256,uint256),(int128,uint256),int128[12])")
                ),
                gas_limit
            )
        ```

---

# **Deploying a Sidechain Gauge**

A sidechain gauge can be deployed by calling the `deploy_gauge` function of the `ChildGaugeFactory` on the respective chain. This creates a minimal proxy using Vyper’s built-in [`create_from_minimal_proxy`](https://docs.vyperlang.org/en/stable/built-in-functions.html#create_minimal_proxy_to) function, which points to the `ChildGauge` implementation and initializes the `ChildGauge` with the provided parameters, such as LP token, salt, and manager.

!!!info "Deploying a RootGauge AFTER deploying a ChildGauge"

    There is no specific order in which root and child gauges must be deployed, and deploying a root gauge is optional. It is perfectly fine to deploy only child gauges. In this case, the child gauge will not be linked to any root gauge and therefore will not be eligible to receive any CRV emissions (if the root gauge is added to the `GaugeController`).

    It does not matter if a root gauge is deployed before or after the child gauge. However, to link the root gauge to the child gauge, the root gauge must be deployed using the same `salt` as the child gauge.

Additionally, a sidechain gauge can also be deployed directly from the `RootGaugeFactory` on Ethereum. This is achieved using a `call_proxy`, which acts as an intermediary contract to facilitate cross-chain calls. **Currently, this feature is not enabled, and the `call_proxy` contract has not been set.**


---


# **Killing Sidechain Gauges**

Killing a gauge essentially means cutting off all CRV emissions to the gauge by setting the inflation rate to 0.

Although each sidechain gauge has an `is_killed` variable and a `set_killed` function to modify its killed status, these do not affect the gauge directly. To kill sidechain gauges, the root gauge must be killed. This is done by setting the `is_killed` variable to `True` by calling the `set_killed` function. Only the `owner`, which is controlled by the CurveDAO and the EmergencyDAO of the `RootGaugeFactory`, can call this function.[^1]

[^1]: The `owner` of the `RootGaugeFactory` is set to a proxy contract controlled by the CurveDAO and EmergencyDAO.
