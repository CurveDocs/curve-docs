
<h1>L2 Agents</h1>

The Agent contract act as some sort of proxy for the agents on Ethereum mainnet. Relayed votes are directly executed from the Relayer contract itself. 


*There are three different agent contracts:*

- **`Ownership Agent`**, which manages the ownership of contracts.
- **`Parameter Agent`**, which manages contract parameters
- **`Emergency Agent`**, which handles emergency actions.


---


### `RELAYER`
!!! description "`Agent.RELAYER() -> address: view`"

    Getter for the relayer contract, which relays the messages to the according agent.

    Returns: relayer contract (`address`).

    ??? quote "Source code"

        === "Agent.vy"

            ```vyper
            RELAYER: public(immutable(address))

            @external
            def __init__():
                RELAYER = msg.sender
            ```

    === "Example"
        ```shell
        >>> Agent.RELAYER()     # arbitrum
        >>> '0xb7b0FF38E0A01D798B5cd395BbA6Ddb56A323830'

        >>> Agent.RELAYER()     # optimism
        >>> '0x8e1e5001C7B8920196c7E3EdF2BCf47B2B6153ff'
        ```

        
### `execute`
!!! description "`Agent.execute(_messages: DynArray[Message, MAX_MESSAGES]):`"

    !!!guard "Guarded Methods"
        This function can only be called by the `RELAYER` of the contract.

    Function to execute a relayed message. Calling this function directly from the Agent contract will result in a reverted transaction, as it can only be called directly from the `Relayer` contract. Everyone can relay messages from there

    | Input       | Type                               | Description  |
    | ----------- | ---------------------------------- | ------------ |
    | `_messages` |  `DynArray[Message, MAX_MESSAGES]` | Message to execute. |

    ??? quote "Source code"

        === "Agent.vy"

            ```vyper
            struct Message:
                target: address
                data: Bytes[MAX_BYTES]


            MAX_BYTES: constant(uint256) = 1024
            MAX_MESSAGES: constant(uint256) = 8


            RELAYER: public(immutable(address))

            @external
            def execute(_messages: DynArray[Message, MAX_MESSAGES]):
                """
                @notice Execute a sequence of messages.
                @param _messages An array of messages to be executed.
                """
                assert msg.sender == RELAYER

                for message in _messages:
                    raw_call(message.target, message.data)
            ```

    === "Example"
        ```shell
        >>> soon
        ```
