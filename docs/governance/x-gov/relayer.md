<h1>L2 Relayer</h1>

The `Relayer` contract acts as a middleman, receiving messages from the `Broadcaster` and relaying them to the according `Agent` (`ownership`, `parameter`, or `emergency`).

!!!vyper "`Relayer.vy`"
    The source code for the `Relayer.vy` contract slightly differ depending on the chain its deployed to.

    - [:material-github: `ArbitrumRelayer.vy`](https://github.com/curvefi/curve-xgov/blob/master/contracts/arbitrum/ArbitrumRelayer.vy) for Arbitrum
    - [:material-github: `OptimismRelayer.vy`](https://github.com/curvefi/curve-xgov/blob/master/contracts/optimism/OptimismRelayer.vy) for Optimism and Optimistic Rollups
    - [:material-github: `XYZRelayer.vy`](https://github.com/curvefi/curve-xgov/blob/master/contracts/xyz/XYZRelayer.vy) for all other chains

    A comprehensive list of all deployed contracts is available [here :material-arrow-up-right:](../../../references/deployed-contracts.md#curve-x-gov).

The `Relayer` receives the broadcasted message and forwards the message to the appropriate agent. The `Agents` are then responsible for executing the `calldata` of the message.

!!!warning "Upgradability of Agents"
    A Relayer's agent addresses cannot be altered. Once choosen, there is no way back. In the case of any issues, a new `Relayer` contract has to be deployed.

---

## Relaying Messages

The actual structure of the `relay` function may vary slightly depending on the chain-specific `Relayer` used. However, the general concept remains consistent:

A message is broadcast through the `Broadcaster` contract from Ethereum to the L2, where the `Relayer` relays the message and executes it via the corresponding `Agent`.

### `relay`
!!! description "`Relayer.relay(_agent: Agent, _messages: DynArray[Message, MAX_MESSAGES]):`"

    Function to receive a message from the `Broadcaster` and relay the message to the according agent. This function is automatically called by the `MESSENGER` contract of the according chain. There is no need to manually call this function, which would actually revert as it is a guarded function.

    | Input       | Type       | Description                  |
    | ----------- | ---------- | ---------------------------- |
    | `_agent`    | `address` | Token to transfer            |
    | `_messages` | `address` | Destination of the asset     |

    ??? quote "Source code"

        === "ArbitrumRelayer.vy"

            ```vyper
            @external
            def relay(_agent: Agent, _messages: DynArray[Message, MAX_MESSAGES]):
                """
                @notice Receive messages for an agent and relay them.
                @param _agent The agent to relay messages to.
                @param _messages The sequence of messages to relay.
                """
                assert IArbSys(ARBSYS).wasMyCallersAddressAliased()
                assert IArbSys(ARBSYS).myCallersAddressWithoutAliasing() == self

                IAgent(self.agent[_agent]).execute(_messages)
            ```

        === "OptimismRelayer.vy"

            ```vyper
            @external
            def relay(_agent: Agent, _messages: DynArray[Message, MAX_MESSAGES]):
                """
                @notice Receive messages for an agent and relay them.
                @param _agent The agent to relay messages to.
                @param _messages The sequence of messages to relay.
                """
                assert msg.sender == MESSENGER
                assert IMessenger(MESSENGER).xDomainMessageSender() == self

                IAgent(self.agent[_agent]).execute(_messages)
            ```

        === "XYZRelayer.vy"

            ```vyper
            @external
            def relay(_agent: Agent, _messages: DynArray[Message, MAX_MESSAGES]):
                """
                @notice Receive messages for an agent and relay them.
                @param _agent The agent to relay messages to.
                @param _messages The sequence of messages to relay.
                """
                assert msg.sender == self.messenger

                IAgent(self.agent[_agent]).execute(_messages)
            ```

---

## Agents

The contract contains the addresses of the `Agents` that are responsible for executing the messages.

### `OWNERSHIP_AGENT`
!!! description "`Relayer.OWNERSHIP_AGENT() -> address: view`"

    Getter for the ownership agent.

    Returns: ownership agent (`address`).

    ??? quote "Source code"

        === "Relayer.vy"

            ```vyper
            OWNERSHIP_AGENT: public(immutable(address))
            ```

    === "Example"

        This examples returns the ownership agents for the Arbitrum and Optimism chains.

        ```shell
        >>> ArbitrumRelayer.OWNERSHIP_AGENT()
        '0x452030a5D962d37D97A9D65487663cD5fd9C2B32'    # arbitrum

        >>> OptimismRelayer.OWNERSHIP_AGENT()
        '0x28c4A1Fa47EEE9226F8dE7D6AF0a41C62Ca98267'    # optimism
        ```

### `PARAMETER_AGENT`
!!! description "`Relayer.PARAMETER_AGENT() -> address: view`"

    Getter for the parameter agent.

    Returns: parameter agent (`address`).

    ??? quote "Source code"

        === "Relayer.vy"

            ```vyper
            PARAMETER_AGENT: public(immutable(address))
            ```

    === "Example"

        This examples returns the parameter agents for the Arbitrum and Optimism chains.

        ```shell
        >>> ArbitrumRelayer.PARAMETER_AGENT()
        '0x5ccbB27FB594c5cF6aC0670bbcb360c0072F6839'    # arbitrum

        >>> OptimismRelayer.PARAMETER_AGENT()
        '0xE7F2B72E94d1c2497150c24EA8D65aFFf1027b9b'    # optimism
        ```

### `EMERGENCY_AGENT`
!!! description "`Relayer.EMERGENCY_AGENT() -> address: view`"

    Getter for the emergency agent.

    Returns: emergency agent (`address`).

    ??? quote "Source code"

        === "Relayer.vy"

            ```vyper
            EMERGENCY_AGENT: public(immutable(address))
            ```

    === "Example"

        This examples returns the emergency agents for the Arbitrum and Optimism chains.

        ```shell
        >>> ArbitrumRelayer.EMERGENCY_AGENT()
        '0x2CB6E1Adf22Af1A38d7C3370441743a123991EC3'    # arbitrum

        >>> OptimismRelayer.EMERGENCY_AGENT()
        '0x9fF1ddE4BE9BbD891836863d227248047B3D881b'    # optimism
        ```
