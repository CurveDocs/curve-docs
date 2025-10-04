<h1>FastBridgeL2</h1>

The FastBridgeL2 contract serves as the Layer 2 coordinator for the FastBridge system, handling the initiation of both native and fast bridge transactions. This contract is deployed on each supported L2 network (Arbitrum, Optimism, Fraxtal) and manages the user-facing interface for bridging crvUSD tokens to Ethereum mainnet.

The contract implements a dual-bridge mechanism that simultaneously initiates both the slow native bridge and the fast LayerZero messaging system. It enforces daily limits, minimum amounts, and manages native token fees to ensure the system operates efficiently while maintaining security and economic sustainability.

!!!vyper "`FastBridgeL2.vy`"
    The source code for the `FastBridgeL2.vy` contract can be found on [:material-github: GitHub](https://github.com/curvefi/fast-bridge/blob/main/contracts/FastBridgeL2.vy). The contract is written using [Vyper](https://github.com/vyperlang/vyper) version `0.4.3` and utilizes a [Snekmate module](https://github.com/pcaversaccio/snekmate/blob/main/src/snekmate/auth/ownable.vy) to handle contract ownership.

    The source code was audited by [:logos-chainsecurity: ChainSecurity](https://www.chainsecurity.com/). The full audit report can be found [here](../assets/pdf/ChainSecurity_Curve_Fast_Bridge_audit.pdf).

---

## Core Functions

The FastBridgeL2 contract provides essential functions for initiating bridge transactions, checking available amounts, and calculating costs. These functions work together to provide users with a seamless bridging experience while maintaining system security and efficiency.

### `bridge`
!!! description "`FastBridgeL2.bridge(_token: IERC20, _to: address, _amount: uint256, _min_amount: uint256=0) -> uint256`"

    Function to initiate a fast bridge transaction for crvUSD tokens from L2 to mainnet. This function handles both the native bridge (slow) and fast bridge (immediate) mechanisms. Users must provide native tokens to cover bridge and messaging fees. The function enforces daily limits and minimum amounts.

    | Input      | Type      | Description |
    | ---------- | --------- | ------------ |
    | `_token` | `IERC20` | The token to bridge (only crvUSD is supported) |
    | `_to` | `address` | The receiver on destination chain |
    | `_amount` | `uint256` | The amount of crvUSD to bridge; 2^256-1 for the whole available balance |
    | `_min_amount` | `uint256` | Minimum amount to bridge; defaults to 0 |

    Returns: The actual amount of crvUSD that was bridged (`uint256`).

    ??? quote "Source code"

        === "FastBridgeL2.vy"

            ```python
            interface IMessenger:
                def initiate_fast_bridge(_to: address, _amount: uint256, _lz_fee_refund: address): payable
                def quote_message_fee() -> uint256: view

            CRVUSD: public(immutable(IERC20))
            VAULT: public(immutable(address))

            INTERVAL: constant(uint256) = 86400  # 1 day
            min_amount: public(uint256)  # Minimum amount to initiate bridge. Might be costy to claim on Ethereum
            limit: public(uint256)  # Maximum amount to bridge in an INTERVAL, so there's no queue to resolve to claim on Ethereum
            bridged: public(HashMap[uint256, uint256])  # Amounts of bridge coins per INTERVAL

            bridger: public(IBridger)
            messenger: public(IMessenger)

            @external
            @payable
            def bridge(_token: IERC20, _to: address, _amount: uint256, _min_amount: uint256=0) -> uint256:
                """
                @notice Bridge crvUSD
                @param _token The token to bridge (only crvUSD is supported)
                @param _to The receiver on destination chain
                @param _amount The amount of crvUSD to deposit, 2^256-1 for the whole available balance
                @param _min_amount Minimum amount to bridge
                @return Bridged amount
                """
                assert _token == CRVUSD, "Not supported"
                assert _to != empty(address), "Bad receiver"

                amount: uint256 = _amount
                if amount == max_value(uint256):
                    amount = min(staticcall CRVUSD.balanceOf(msg.sender), staticcall CRVUSD.allowance(msg.sender, self))

                # Apply daily limit
                available: uint256 = self._get_available()
                amount = min(amount, available)
                assert amount >= _min_amount

                assert extcall CRVUSD.transferFrom(msg.sender, self, amount, default_return_value=True)
                self.bridged[block.timestamp // INTERVAL] += amount

                bridger_cost: uint256 = self.bridger_cost()
                messaging_cost: uint256 = self.messaging_cost()
                assert msg.value >= bridger_cost + messaging_cost, "Insufficient msg.value"
                
                # Initiate bridge transaction using native bridge
                extcall self.bridger.bridge(CRVUSD, VAULT, amount, self.min_amount, value=bridger_cost)

                # Message for VAULT to release amount while waiting
                extcall self.messenger.initiate_fast_bridge(_to, amount, msg.sender, value=messaging_cost)

                # Refund the rest of the msg.value
                if msg.value > bridger_cost + messaging_cost:
                    send(msg.sender, msg.value - bridger_cost - messaging_cost)

                log IBridger.Bridge(token=_token, sender=msg.sender, receiver=_to, amount=amount)
                return amount
            ```

    === "Example"

        ```shell
        ```

### `allowed_to_bridge`
!!! description "`FastBridgeL2.allowed_to_bridge(_ts: uint256=block.timestamp) -> (uint256, uint256)`"

    Checks how much crvUSD can be bridged at a specific timestamp, considering daily limits and minimum requirements. Returns both the minimum and maximum amounts that can be bridged in the current interval.

    | Input      | Type      | Description |
    | ---------- | --------- | ------------ |
    | `_ts` | `uint256` | Timestamp at which to check (default: current block timestamp) |

    Returns: A tuple of (minimum_amount, maximum_amount) that can be bridged (`(uint256, uint256)`).

    ??? quote "Source code"

        === "FastBridgeL2.vy"

            ```python
            INTERVAL: constant(uint256) = 86400  # 1 day
            min_amount: public(uint256)  # Minimum amount to initiate bridge. Might be costly to claim on Ethereum
            limit: public(uint256)  # Maximum amount to bridge in an INTERVAL, so there's no queue to resolve to claim on Ethereum
            bridged: public(HashMap[uint256, uint256])  # Amounts of bridge coins per INTERVAL

            @external
            @view
            def allowed_to_bridge(_ts: uint256=block.timestamp) -> (uint256, uint256):
                """
                @notice Get interval of allowed amounts to bridge
                @param _ts Timestamp at which to check (current by default)
                @return (minimum, maximum) amounts allowed to bridge
                """
                if _ts < block.timestamp:  # outdated
                    return (0, 0)

                available: uint256 = self._get_available(_ts)

                # Funds transferred to the contract are lost :(
                min_amount: uint256 = self.min_amount

                if available < min_amount:  # Not enough for bridge initiation
                    return (0, 0)
                return (min_amount, available)

            @view
            def _get_available(ts: uint256=block.timestamp) -> uint256:
                limit: uint256 = self.limit
                bridged: uint256 = self.bridged[ts // INTERVAL]
                return limit - min(bridged, limit)
            ```

    === "Example"

        ```shell
        ```

### `cost`
!!! description "`FastBridgeL2.cost() -> uint256`"

    Calculates the total native token cost required for a bridge transaction. This includes both the native bridge fee and the fast messaging fee. Users must send this amount as `msg.value` when calling the `bridge()` function.

    Returns: Total native token amount needed for the bridge transaction (`uint256`).

    ??? quote "Source code"

        === "FastBridgeL2.vy"

            ```python
            implements: IBridger

            interface IMessenger:
                def initiate_fast_bridge(_to: address, _amount: uint256, _lz_fee_refund: address): payable
                def quote_message_fee() -> uint256: view

            bridger: public(IBridger)
            messenger: public(IMessenger)

            @external
            @view
            def cost() -> uint256:
                """
                @notice Quote messaging fee in native token. This value has to be provided 
                as msg.value when calling bridge(). This is not fee in crvUSD that is paid to the vault!
                @return Native token amount needed for bridge tx
                """
                return self.messaging_cost() + self.bridger_cost()

            @internal
            @view
            def messaging_cost() -> uint256:
                """
                Messaging cost to pass message to VAULT (Fast Bridge)
                @return Native token amount needed for messenger
                """
                return staticcall self.messenger.quote_message_fee()


            @internal
            @view
            def bridger_cost() -> uint256:
                """
                Bridger cost to bridge crvUSD to VAULT (Native Bridge)
                @return Native token amount needed for bridger
                """
                return staticcall self.bridger.cost()
            ```

    === "Example"

        ```shell
        ```

---

## Variables

The FastBridgeL2 contract maintains several important state variables that control its operation, track bridged amounts, manage limits, and store contract addresses. These variables work together to ensure proper functioning of the bridge system while maintaining security and economic sustainability.
### `min_amount`
!!! description "`FastBridgeL2.min_amount() -> uint256`"

    The minimum amount of crvUSD required to initiate a bridge transaction. This threshold exists because claiming small amounts on Ethereum can be expensive due to gas costs. Can be changed using the [`set_min_amount`](#set_min_amount) function.

    Returns: Minimum crvUSD amount required for bridging (`uint256`).

    ??? quote "Source code"

        === "FastBridgeL2.vy"

            ```python
            min_amount: public(uint256)  # Minimum amount to initiate bridge. Might be costly to claim on Ethereum
            ```

    === "Example"

        ```shell
        ```


### `limit`
!!! description "`FastBridgeL2.limit() -> uint256`"

    The maximum amount of crvUSD that can be bridged within a 24-hour interval. This daily limit prevents overwhelming the Ethereum claim queue and ensures smooth processing of bridge transactions. Can be changed using the [`set_limit`](#set_limit) function.

    Returns: Maximum crvUSD amount that can be bridged per day (`uint256`).

    ??? quote "Source code"

        === "FastBridgeL2.vy"

            ```python
            limit: public(uint256)  # Maximum amount to bridge in an INTERVAL, so there's no queue to resolve to claim on Ethereum
            ```

    === "Example"

        ```shell
        ```


### `bridged`
!!! description "`FastBridgeL2.bridged(arg0: uint256) -> uint256`"

    Tracks the total amount of crvUSD that has been bridged in each 24-hour interval. The key is the timestamp divided by the interval (86400 seconds), and the value is the cumulative amount bridged.

    | Input      | Type      | Description |
    | ---------- | --------- | ------------ |
    | `arg0` | `uint256` | Time interval key (timestamp // 86400) |

    Returns: Total crvUSD amount bridged in the specified time interval (`uint256`).

    ??? quote "Source code"

        === "FastBridgeL2.vy"

            ```python
            bridged: public(HashMap[uint256, uint256])  # Amounts of bridge coins per INTERVAL
            ```

    === "Example"

        ```shell
        ```

### `bridger`
!!! description "`FastBridgeL2.bridger() -> IBridger`"

    The contract responsible for handling the native bridge transaction that actually moves crvUSD from L2 to mainnet. This is the slower but reliable bridge mechanism. Can be changed using the [`set_bridger`](#set_bridger) function.

    Returns: Address of the bridger contract (`IBridger`).

    ??? quote "Source code"

        === "FastBridgeL2.vy"

            ```python
            bridger: public(IBridger)
            ```

    === "Example"

        ```shell
        ```

### `messenger`
!!! description "`FastBridgeL2.messenger() -> IMessenger`"

    The contract responsible for sending fast messages to the mainnet vault, enabling immediate access to bridged funds while the native bridge transaction is still pending. Can be changed using the [`set_messenger`](#set_messenger) function.

    Returns: Address of the messenger contract (`IMessenger`).

    ??? quote "Source code"

        === "FastBridgeL2.vy"

            ```python
            messenger: public(IMessenger)
            ```

    === "Example"

        ```shell
        ```

### `CRVUSD`
!!! description "`FastBridgeL2.CRVUSD() -> IERC20`"

    The crvUSD token contract address on the L2 network. This is the token that gets bridged from L2 to mainnet. The address is set during deployment and cannot be changed.

    Returns: crvUSD token contract address (`IERC20`).

    ??? quote "Source code"

        === "FastBridgeL2.vy"

            ```python
            CRVUSD: public(immutable(IERC20))
            ```

    === "Example"

        ```shell
        ```

### `VAULT`
!!! description "`FastBridgeL2.VAULT() -> address`"

    The mainnet vault contract address where bridged crvUSD tokens are sent. This is the destination for both the native bridge and the fast bridge mechanisms. The address is set during deployment and cannot be changed.

    Returns: Mainnet vault contract address (`address`).

    ??? quote "Source code"

        === "FastBridgeL2.vy"

            ```python
            VAULT: public(immutable(address))
            ```

    === "Example"

        ```shell
        ```

### `version`
!!! description "`FastBridgeL2.version() -> String[8]`"

    The version identifier for this contract implementation. This helps track which version of the contract is deployed and can be used for upgrade compatibility checks.

    Returns: Contract version string (`String[8]`).

    ??? quote "Source code"

        === "FastBridgeL2.vy"

            ```python
            version: public(constant(String[8])) = "0.0.1"
            ```

    === "Example"

        ```shell
        ```


## Owner Functions

The FastBridgeL2 contract includes several administrative functions that allow the contract owner to manage system parameters, update contract addresses, and configure operational settings. These functions are protected by ownership checks to ensure only authorized personnel can make critical changes to the system.
### `set_min_amount`
!!! description "`FastBridgeL2.set_min_amount(_min_amount: uint256)`"

    !!!guard "Guarded Method"
        This function is only callable by the `owner` of the contract.

    Updates the minimum amount of crvUSD required to initiate a bridge transaction. Only the contract owner can call this function. This helps prevent users from bridging amounts that would be uneconomical to claim on mainnet.

    | Input      | Type      | Description |
    | ---------- | --------- | ------------ |
    | `_min_amount` | `uint256` | New minimum amount required for bridging |

    Returns: None.

    ??? quote "Source code"

        === "FastBridgeL2.vy"

            ```python
            min_amount: public(uint256)  # Minimum amount to initiate bridge. Might be costly to claim on Ethereum

            @external
            def set_min_amount(_min_amount: uint256):
                """
                @notice Set minimum amount allowed to bridge
                @param _min_amount Minimum amount
                """
                ownable._check_owner()

                self.min_amount = _min_amount
                log SetMinAmount(min_amount=_min_amount)
            ```

    === "Example"

        ```shell
        ```

### `set_limit`
!!! description "`FastBridgeL2.set_limit(_limit: uint256)`"

    !!!guard "Guarded Method"
        This function is only callable by the `owner` of the contract.

    Updates the daily limit for crvUSD bridging. Only the contract owner can call this function. This limit prevents overwhelming the Ethereum claim queue and ensures smooth processing of bridge transactions.

    | Input      | Type      | Description |
    | ---------- | --------- | ------------ |
    | `_limit` | `uint256` | New daily limit for crvUSD bridging |

    Returns: None.

    ??? quote "Source code"

        === "FastBridgeL2.vy"

            ```python
            limit: public(uint256)  # Maximum amount to bridge in an INTERVAL, so there's no queue to resolve to claim on Ethereum

            @external
            def set_limit(_limit: uint256):
                """
                @notice Set new limit
                @param _limit Limit on bridging per INTERVAL
                """
                ownable._check_owner()

                self.limit = _limit
                log SetLimit(limit=_limit)
            ```

    === "Example"

        ```shell
        ```

### `set_bridger`
!!! description "`FastBridgeL2.set_bridger(_bridger: IBridger)`"

    !!!guard "Guarded Method"
        This function is only callable by the `owner` of the contract.

    Updates the bridger contract that handles the native bridge transaction. Only the contract owner can call this function. The function also updates the crvUSD token approval to the new bridger contract.

    | Input      | Type      | Description |
    | ---------- | --------- | ------------ |
    | `_bridger` | `IBridger` | New bridger contract address |

    Returns: None.

    ??? quote "Source code"

        === "FastBridgeL2.vy"

            ```python
            bridger: public(IBridger)

            @external
            def set_bridger(_bridger: IBridger):
                """
                @notice Set new bridger
                @param _bridger Contract initiating actual bridge transaction
                """
                ownable._check_owner()
                assert _bridger != empty(IBridger), "Bad bridger value"

                assert extcall CRVUSD.approve(self.bridger.address, 0, default_return_value=True)
                assert extcall CRVUSD.approve(_bridger.address, max_value(uint256), default_return_value=True)
                self.bridger = _bridger
                log SetBridger(bridger=_bridger)
            ```

    === "Example"

        ```shell
        ```

### `set_messenger`
!!! description "`FastBridgeL2.set_messenger(_messenger: IMessenger)`"

    !!!guard "Guarded Method"
        This function is only callable by the `owner` of the contract.

    Updates the messenger contract that handles fast message delivery to the mainnet vault. Only the contract owner can call this function. This allows for upgrading the fast bridge mechanism without changing the main contract.

    | Input      | Type      | Description |
    | ---------- | --------- | ------------ |
    | `_messenger` | `IMessenger` | New messenger contract address |

    Returns: None.

    ??? quote "Source code"

        === "FastBridgeL2.vy"

            ```python
            messenger: public(IMessenger)

            @external
            def set_messenger(_messenger: IMessenger):
                """
                @notice Set new messenger
                @param _messenger Contract passing bridge tx fast
                """
                ownable._check_owner()
                assert _messenger != empty(IMessenger), "Bad messenger value"

                self.messenger = _messenger
                log SetMessenger(messenger=_messenger)
            ```

    === "Example"

        ```shell
        ```
