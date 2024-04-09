<h1>L2 Relayer</h1>



!!!github "GitHub"
    The source code for the `Relayers` slightly differ depending on the chain its deployed to.

    - `ArbitrumRelayer.vy` for Arbitrum: https://github.com/curvefi/curve-xgov/blob/master/contracts/arbitrum/ArbitrumRelayer.vy
    - `OptimismRelayer.vy` for Optimism and Optimistic Rollups: https://github.com/curvefi/curve-xgov/blob/master/contracts/optimism/OptimismRelayer.vy
    - `XYZRelayer.vy`for all other chains: https://github.com/curvefi/curve-xgov/blob/master/contracts/xyz/XYZRelayer.vy


The L2 Relayer contract acts as a middleman, receiving messages and relaying them to the specific agent (`ownership`, `parameter`, or `emergency`).

The Relayer receives the broadcasted message and, using the `relay` function, forwards this message to the appropriate agent. The agents defined in the L2 Relayer contract (`OWNERSHIP_AGENT`, `PARAMETER_AGENT`, `EMERGENCY_AGENT`) are responsible for executing the instructions contained in the message.




The contract utilizes `Messenger` contacts:


| Chain                         | Description               | Messenger Contract |
| ----------------------------- | :-----------------------: | :--------------: |
| :logos-arbitrum: Arbitrum     | ArbSys    | [0x0000000000000000000000000000000000000064](https://arbiscan.io/address/0x0000000000000000000000000000000000000064) |
| :logos-optimism: Optimism     | L2 Cross Chain Domain Messenger | [0x4200000000000000000000000000000000000007](https://optimistic.etherscan.io/address/0x4200000000000000000000000000000000000007) |
| :logos-base: Base             | L2 Cross Chain Domain Messenger | [0x4200000000000000000000000000000000000007](https://basescan.org/address/0x4200000000000000000000000000000000000007) |
| :logos-mantle: Mantle         | L2 Cross Chain Domain Messenger | [0x4200000000000000000000000000000000000007](https://explorer.mantle.xyz/address/0x4200000000000000000000000000000000000007) |
| :logos-bsc: BinanceSmartChain | MessageDigestProver | [0xbfF1f56c8e48e2F2F52941e16FEecc76C49f1825](https://bscscan.com/address/0xbfF1f56c8e48e2F2F52941e16FEecc76C49f1825) |
| :logos-fantom: Fantom         | MessageDigestProver | [0xAb0ab357a10c0161002A91426912933750082A9d](https://ftmscan.com/address/0xAb0ab357a10c0161002A91426912933750082A9d) |
| :logos-avalanche: Avalanche   | not verified | []() |
| :logos-kava: Kava             | not verified | []() |
| :logos-polygon: Polygon       | not verified | []() |


!!!warning
    A Relayer's agent addresses cannot be altered. Once choosen, there is no way back.


---


## **Relaying Messages**

The source code of the relay function might differ slightly depending on the kind of relayer used. The general idea of it although stays the same:

A message is broadcasted through the `Broadcaster` contract from L1 to L2, where the `Relayer` relays the message and executes it throught the according agent.


### `relay`
!!! description "`Relayer.relay(_agent: Agent, _messages: DynArray[Message, MAX_MESSAGES]):`"

    !!!guard "Guarded Method"
        This function can only be called by the `MESSENGER` of the contract.

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

    === "Example"
        ```shell
        >>> Relayer.relay()
        ```


---


## **Agents**

<todo>

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

        ```shell
        >>> Relayer.OWNERSHIP_AGENT()
        '0x452030a5D962d37D97A9D65487663cD5fd9C2B32'    # arbitrum
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
        ```shell
        >>> Relayer.PARAMETER_AGENT()
        '0x5ccbB27FB594c5cF6aC0670bbcb360c0072F6839'    # arbitrum
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
        ```shell
        >>> Relayer.EMERGENCY_AGENT()
        '0x2CB6E1Adf22Af1A38d7C3370441743a123991EC3'    # arbitrum
        '0x9fF1ddE4BE9BbD891836863d227248047B3D881b'    # optimism
        ```
