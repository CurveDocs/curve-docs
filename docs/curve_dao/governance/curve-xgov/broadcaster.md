<h1>L1 Broadcaster</h1>

Once the governance vote on Ethereum Mainnet is concluded, a according **sequence of messages need to be communicated to the Layer 2**. This is done via the Broadcaster's `broadcast` function.

!!!github "GitHub"

    Because L2's provide different infrastructures to broadcast messages, there are three slighlty different version for the `Broadcaster.vy` contract:

    - [:material-github: `ArbitrumBroadcaster.vy`](https://github.com/curvefi/curve-xgov/blob/master/contracts/arbitrum/ArbitrumBroadcaster.vy) for Arbitrum:
    - [:material-github: `OptimismBroadcaster.vy`](https://github.com/curvefi/curve-xgov/blob/master/contracts/optimism/OptimismBroadcaster.vy) for Optimism and Optimistic Rollups
    - [:material-github: `XYZBroadcaster.vy`](https://github.com/curvefi/curve-xgov/blob/master/contracts/xyz/XYZBroadcaster.vy) for all other chains

    A comprehensive list of all deployed contracts is available [here :material-arrow-up-right:](../../references/deployed-contracts.md#curve-x-gov).


---


## **Arbitrum**

More on how L1 to L2 messaging on Arbitrum works can be found on the [official Arbitrum documentation](https://docs.arbitrum.io/arbos/l1-to-l2-messaging).


### `broadcast`
!!! description "`Broadcaster.broadcast(_messages: DynArray[Message, MAX_MESSAGES], _gas_limit: uint256, _max_fee_per_gas: uint256):`"

    !!!guard "Guarded Method"
        This function is only callable by one of the agents (`ownership`, `parameter` or `emergency`).

    Function to broadcast a sequence of messages to the `Relayer` contract on a L2.

    | Input              | Type                              | Description                                   |
    | ------------------ | --------------------------------- | --------------------------------------------- |
    | `_messages`        | `DynArray[Message, MAX_MESSAGES]` | Sequence of messages to broadcast             |
    | `_gas_limit`       | `uint256`                         | Gas limit for execution on L2                 |
    | `_max_fee_per_gas` | `uint256`                         | maximum gas price bid for the execution on L2 |

    ??? quote "Source code"

        === "ArbitrumBroadcaster.vy"

            ```py
            agent: HashMap[address, Agent]

            arb_inbox: public(address)
            arb_refund: public(address)

            @external
            def broadcast(_messages: DynArray[Message, MAX_MESSAGES], _gas_limit: uint256, _max_fee_per_gas: uint256):
                """
                @notice Broadcast a sequence of messeages.
                @param _messages The sequence of messages to broadcast.
                @param _gas_limit The gas limit for the execution on L2.
                @param _max_fee_per_gas The maximum gas price bid for the execution on L2.
                """
                agent: Agent = self.agent[msg.sender]
                assert agent != empty(Agent)

                # define all variables here before expanding memory enormously
                arb_inbox: address = self.arb_inbox
                arb_refund: address = self.arb_refund
                submission_cost: uint256 = 0

                data: Bytes[MAXSIZE] = _abi_encode(
                    agent,
                    _messages,
                    method_id=method_id("relay(uint256,(address,bytes)[])"),
                )
                submission_cost = IArbInbox(arb_inbox).calculateRetryableSubmissionFee(len(data), block.basefee)

                # NOTE: using `unsafeCreateRetryableTicket` so that refund address is not aliased
                raw_call(
                    arb_inbox,
                    _abi_encode(
                        self,  # to
                        empty(uint256),  # l2CallValue
                        submission_cost,  # maxSubmissionCost
                        arb_refund,  # excessFeeRefundAddress
                        arb_refund,  # callValueRefundAddress
                        _gas_limit,
                        _max_fee_per_gas,
                        data,
                        method_id=method_id("unsafeCreateRetryableTicket(address,uint256,uint256,address,address,uint256,uint256,bytes)"),
                    ),
                    value=submission_cost + _gas_limit * _max_fee_per_gas,
                )
            ```

    === "Example"
        ```shell
        >>> soon
        ```


### `arb_inbox`
!!! description "`Broadcaster.arb_inbox() -> address: view`"

    Getter for the Arbitrum Delayed Inbox contract.

    ??? quote "Source code"

        === "ArbitrumBroadcaster.vy"

            ```vyper
            arb_inbox: public(address)
            ```

    === "Example"
        ```shell
        >>> Broadcaster.arb_inbox()
        '0x4Dbd4fc535Ac27206064B68FfCf827b0A60BAB3f'
        ```


### `arb_refund`
!!! description "`Broadcaster.arb_refund() -> address: view`"

    Getter for the refund address, which is the L2 Vault.

    ??? quote "Source code"

        === "ArbitrumBroadcaster.vy"

            ```vyper
            arb_refund: public(address)
            ```

    === "Example"
        ```shell
        >>> Broadcaster.arb_refund()
        '0x25877b9413Cc7832A6d142891b50bd53935feF82'
        ```


### `set_arb_inbox`
!!! description "`Broadcaster.set_arb_inbox(_arb_inbox: address):`"

    !!!guard "Guarded Method"
        This function is only callable by the `ownership admin`.

    Function to set a new Arbitrum Inbox contract.

    Emits: `SetArbInbox`

    | Input        | Type      | Description                  |
    | ------------ | --------- | ---------------------------- |
    | `_arb_inbox` | `address` | New Arbitrum inbox address   |

    ??? quote "Source code"

        === "ArbitrumBroadcaster.vy"

            ```vyper
            event SetArbInbox:
                arb_inbox: address

            @external
            def set_arb_inbox(_arb_inbox: address):
                assert msg.sender == self.admins.ownership

                self.arb_inbox = _arb_inbox
                log SetArbInbox(_arb_inbox)
            ```

    === "Example"
        ```shell
        >>> soon
        ```


### `set_arb_refund`
!!! description "`Broadcaster.set_arb_refund(_arb_refund: address):`"

    !!!guard "Guarded Method"
        This function is only callable by the `ownership admin`.

    Function to set a new refund address.

    Emits: `SetArbRefund`

    | Input            | Type      | Description                  |
    | ---------------- | --------  | ---------------------------- |
    | `set_arb_refund` | `address` | New refund address           |

    ??? quote "Source code"

        === "ArbitrumBroadcaster.vy"

            ```vyper
            event SetArbRefund:
                arb_refund: address

            @external
            def set_arb_refund(_arb_refund: address):
                assert msg.sender == self.admins.ownership

                self.arb_refund = _arb_refund
                log SetArbRefund(_arb_refund)
            ```

    === "Example"
        ```shell
        >>> soon
        ```


---


## **Optimism and Optimistic Rollups**

[**`Base`**](https://base.org/) and [**`Mantle`**](https://www.mantle.xyz/) conduct messaging the same way as Optimism, as they are Optimistic Rollups.


More on how L1 to L2 messaging on Arbitrum works can be found in the [official Optimism documentation](https://docs.optimism.io/builders/app-developers/bridging/messaging).


### `broadcast`
!!! description "`OptimismBroadcaster.broadcast(_messages: DynArray[Message, MAX_MESSAGES], _gas_limit: uint32 = 0):`"

    !!!guard "Guarded Method"
        This function is only callable by one of the agents (`ownership`, `parameter` or `emergency`).

    Function to broadcast a sequence of messages to the `Relayer` contract on a L2.

    | Input        | Type                              | Description                       |
    | ------------ | --------------------------------- | --------------------------------- |
    | `_messages`  | `DynArray[Message, MAX_MESSAGES]` | Sequence of messages to broadcast |
    | `_gas_limit` | `uint256`                         | Gas limit for execution on L2     |

    ??? quote "Source code"

        === "OptimismBroadcaster.vy"

            ```vyper
            @external
            def broadcast(_messages: DynArray[Message, MAX_MESSAGES], _gas_limit: uint32 = 0):
                """
                @notice Broadcast a sequence of messeages.
                @param _messages The sequence of messages to broadcast.
                @param _gas_limit The L2 gas limit required to execute the sequence of messages.
                """
                agent: Agent = self.agent[msg.sender]
                assert agent != empty(Agent)

                # https://community.optimism.io/docs/developers/bridge/messaging/#for-l1-%E2%87%92-l2-transactions
                gas_limit: uint32 = _gas_limit
                if gas_limit == 0:
                    gas_limit = OVMChain(self.ovm_chain).enqueueL2GasPrepaid()

                raw_call(
                    self.ovm_messenger,
                    _abi_encode(  # sendMessage(address,bytes,uint32)
                        self,
                        _abi_encode(  # relay(uint256,(address,bytes)[])
                            agent,
                            _messages,
                            method_id=method_id("relay(uint256,(address,bytes)[])"),
                        ),
                        gas_limit,
                        method_id=method_id("sendMessage(address,bytes,uint32)"),
                    ),
                )
            ```

    === "Example"
        ```shell
        >>> soon
        ```


### `ovm_chain`
!!! description "`OptimismBroadcaster.ovm_chain(): view`"

    Getter for the Optimism CanonicalTransactionChain.

    ??? quote "Source code"

        === "OptimismBroadcaster.vy"

            ```vyper
            ovm_chain: public(address)  # CanonicalTransactionChain
            ```

    === "Example"
        ```shell
        >>> OptimismBroadcaster.ovm_chain()
        '0x5E4e65926BA27467555EB562121fac00D24E9dD2'
        ```


### `ovm_messenger`
!!! description "`OptimismBroadcaster.ovm_messenger(): view`"

    Getter for the Optimism Proxy OVM L1 Cross Domain Messenger.

    ??? quote "Source code"

        === "OptimismBroadcaster.vy"

            ```vyper
            ovm_messenger: public(address)  # CrossDomainMessenger
            ```

    === "Example"
        ```shell
        >>> OptimismBroadcaster.ovm_messenger()
        '0x25ace71c97B33Cc4729CF772ae268934F7ab5fA1'
        ```


### `set_ovm_chain`
!!! description "`OptimismBroadcaster.set_ovm_chain(_ovm_chain: address):`"

    !!!guard "Guarded Method"
        This function can only be called by the `ownership admin`.

    Function to set a new OVM Canonical Transaction Chain contract.

    Emits: `SetOVMChain`

    | Input        | Type      | Description                  |
    | ------------ | --------- | ---------------------------- |
    | `_ovm_chain` | `address` | New ovm chain address        |

    ??? quote "Source code"

        === "OptimismBroadcaster.vy"

            ```vyper
            event SetOVMChain:
                ovm_chain: address

            @external
            def set_ovm_chain(_ovm_chain: address):
                """
                @notice Set the OVM Canonical Transaction Chain storage variable.
                """
                assert msg.sender == self.admins.ownership

                self.ovm_chain = _ovm_chain
                log SetOVMChain(_ovm_chain)
            ```

    === "Example"
        ```shell
        >>> soon
        ```


### `set_ovm_messenger`
!!! description "`OptimismBroadcaster.set_ovm_messenger):`"

    !!!guard "Guarded Method"
        This function can only be called by the `ownership admin`.

    Function to set a new OVM Cross Domain messenger contract.

    Emits: `SetOVMMessenger`

    | Input            | Type      | Description                  |
    | ---------------- | --------- | ---------------------------- |
    | `_ovm_messenger` | `address` | New ovm messenger address    |

    ??? quote "Source code"

        === "OptimismBroadcaster.vy"

            ```vyper
            event SetOVMMessenger:
                ovm_messenger: address

            @external
            def set_ovm_messenger(_ovm_messenger: address):
                """
                @notice Set the OVM Cross Domain Messenger storage variable.
                """
                assert msg.sender == self.admins.ownership

                self.ovm_messenger = _ovm_messenger
                log SetOVMMessenger(_ovm_messenger)
            ```

    === "Example"
        ```shell
        >>> soon
        ```


---


## **Other Chains**

Outside of Arbitrum, Optimism, and Optimistic Rollups, Curves cross-chain infrastructure uses a single [`XYZBroadcaster.vy`](https://github.com/curvefi/curve-xgov/blob/master/contracts/xyz/XYZBroadcaster.vy) contract deployed at [`0x5786696bB5bE7fCDb9997E7f89355d9e97FF8d89`](https://etherscan.io/address/0x5786696bB5bE7fCDb9997E7f89355d9e97FF8d89).

This contract is responsible for broadcasting messages across several blockchains including [**`Avalanche`**](https://www.avax.network/), [**`Fantom`**](https://fantom.foundation/), [**`BinanceSmartChain`**](https://www.bnbchain.org/en/bnb-smart-chain), [**`Kava`**](https://www.kava.io/), and [**`Polygon`**](https://polygon.technology/).


### `broadcast`
!!! description "`XYZBroadcaster.broadcast(_chain_id: uint256, _messages: DynArray[Message, MAX_MESSAGES])`"

    !!!guard "Guarded Method"
        This function is only callable by one of the agents (`ownership`, `parameter` or `emergency`).

    Function to broadcast a sequence of messages to the `Relayer` contract on a L2.

    | Input        | Type                              | Description                  |
    | ------------ | --------------------------------- | ---------------------------- |
    | `_chain_id`  | `uint256`                         | Chain ID to broadcast to     |
    | `_messages`  | `DynArray[Message, MAX_MESSAGES]` | Sequence of messages to broadcast |

    ??? quote "Source code"

        === "XYZBroadcaster.vy"

            ```vyper
            event Broadcast:
                agent: Agent
                chain_id: uint256
                nonce: uint256
                digest: bytes32

            enum Agent:
                OWNERSHIP
                PARAMETER
                EMERGENCY

            admins: public(AdminSet)
            future_admins: public(AdminSet)

            agent: HashMap[address, Agent]

            nonce: public(HashMap[Agent, HashMap[uint256, uint256]])  # agent -> chainId -> nonce
            digest: public(HashMap[Agent, HashMap[uint256, HashMap[uint256, bytes32]]])  # agent -> chainId -> nonce -> messageDigest

            @external
            def broadcast(_chain_id: uint256, _messages: DynArray[Message, MAX_MESSAGES]):
                """
                @notice Broadcast a sequence of messeages.
                @param _chain_id The chain id to have messages executed on.
                @param _messages The sequence of messages to broadcast.
                """
                agent: Agent = self.agent[msg.sender]
                assert agent != empty(Agent)

                digest: bytes32 = keccak256(_abi_encode(_messages))
                nonce: uint256 = self.nonce[agent][_chain_id]

                self.digest[agent][_chain_id][nonce] = digest
                self.nonce[agent][_chain_id] = nonce + 1

                log Broadcast(agent, _chain_id, nonce, digest)
            ```

    === "Example"
        ```shell
        >>> XYZBroadcaster.broadcast
        'todo'
        ```


---



## **Contract Ownership**

The `Broadcaster` contracts are managed by three admins, defined as follows:

- **Ownership Admin**: [`0x40907540d8a6C65c637785e8f8B742ae6b0b9968`](https://etherscan.io/address/0x40907540d8a6C65c637785e8f8B742ae6b0b9968) - Responsible for overall ownership and high-level changes.
- **Parameter Admin**: [`0x4EEb3bA4f221cA16ed4A0cC7254E2E32DF948c5f`](https://etherscan.io/address/0x4EEb3bA4f221cA16ed4A0cC7254E2E32DF948c5f) - Manages contract parameters and operational settings.
- **Emergency Admin**: [`0x467947EE34aF926cF1DCac093870f613C96B1E0c`](https://etherscan.io/address/0x467947EE34aF926cF1DCac093870f613C96B1E0c) - Handles emergency actions and immediate response requirements.


!!!warning "Upgradable Ownership"
    The admins are upgradable. Changes follow a two-step process: First, new admins must be committed using the `commit_admins` function. Then, these changes are applied by calling `apply_admins`. Only the current Ownership Admin, represented by the Curve DAO, can initiate these changes.


!!!notebook "Jupyter Notebook"
    For a practical demonstration on how to change the ownership of such contracts, refer to this notebook: https://try.vyperlang.org/hub/user-redirect/lab/tree/shared/mo-anon/basic/ownership.ipynb.

