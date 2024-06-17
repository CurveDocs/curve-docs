<h1>CowSwapBurner.vy</h1>

commit height: https://github.com/curvefi/curve-burners/commit/0bbfeefe7ebf50e76eaf6772b939973bcf16bb6f
one contract can create multiple orders!

The CowSwapBurner is an esstial component for the fee burning architecture, designed to facilitate the efficient and automated exchange of admin fees using the CoW Swap protocol. Its primary purpose is to manage the burning of admin fee tokens that are collected in the `FeeCollector` contract.


1. **Token Registration and Approval:**
   When the FeeCollector collects tokens as fees, these tokens are transferred to the CoWSwapBurner. The burner contract registers these tokens and grants the necessary approvals to the CoW Swap Vault Relayer, allowing it to handle these tokens on behalf of the contract. This setup ensures that the tokens can be efficiently managed and exchanged.

2. **Order Creation:**
   The CoWSwapBurner generates conditional orders for the CoW Swap protocol. These orders detail the tokens to be sold and the target tokens to be acquired. The orders are designed to be flexible, allowing partial fills. This flexibility ensures that the exchange process is efficient, minimizing slippage and maximizing the value obtained from the token swaps.

3. **Order Verification:**
   Before any order is executed, the CoWSwapBurner verifies its validity. This verification process checks the availability of the tokens, the current epoch, and ensures compliance with the parameters set by the FeeCollector. This step is crucial for maintaining the integrity and security of the token exchange process.

4. **Signature Validation:**
   To ensure the security and authenticity of transactions, the CoWSwapBurner can validate signatures using the CoW Swap protocol's signature verification logic. This validation helps prevent unauthorized transactions and ensures that all orders are legitimate.

5. **Token Transfer:**
   After successfully exchanging tokens, the CoWSwapBurner can push the acquired target tokens back to the FeeCollector. This transfer ensures that no tokens are left idle in the contract and that all assets are utilized efficiently. The FeeCollector can then manage the distribution or further processing of these target tokens.

**Integration with the Overall System:**

The CoWSwapBurner contract is a vital part of the Curve Finance fee management and optimization system. It works seamlessly with the FeeCollector contract, which handles the initial collection and basic management of fees. Here's a closer look at how the CoWSwapBurner fits into the overall system:

1. **Fee Collection:**
   The FeeCollector accumulates fees from various sources. Depending on the current epoch, it determines the appropriate time to process these fees.

2. **Delegation to CoWSwapBurner:**
   During the COLLECT epoch, the FeeCollector delegates the responsibility of burning or swapping the collected tokens to the CoWSwapBurner. This delegation involves transferring the tokens to the CoWSwapBurner and initiating the process of burning or swapping them.

3. **Order Execution:**
   The CoWSwapBurner takes over by creating and verifying orders for the CoW Swap protocol. It manages all interactions with the CoW Swap protocol, including granting approvals, creating orders, and validating signatures. This process ensures that tokens are exchanged in the most efficient and secure manner possible.

4. **Result Handling:**
   Once the token exchanges are complete, the CoWSwapBurner pushes the acquired target tokens back to the FeeCollector. This step ensures that the FeeCollector can then manage the distribution or further processing of these tokens, maintaining a continuous and efficient flow of assets within the system.

**Benefits:**

The CoWSwapBurner contract offers several significant benefits:
- **Efficiency:** By automating the token exchange process, it ensures that fees are handled with minimal manual intervention.
- **Security:** Robust verification and validation mechanisms are in place to maintain the integrity and security of transactions.
- **Flexibility:** The ability to create partial fill orders and dynamically adjust to market conditions ensures optimal trading outcomes.
- **Seamless Integration:** It works in harmony with the FeeCollector contract, providing a cohesive system for managing and optimizing fee handling within the Curve Finance ecosystem.




uses conditional CoW orders! see more here: link to cow documenatation!!!

how long are orders valid?


do the coins just sit in the burner contract until the coins are actually burned?

ComposableCoW: https://etherscan.io/address/0xfdaFc9d1902f4e0b84f65F49f244b32b31013b74#code

## need header

### `fee_collector`
!!! description "`CowSwapBurner.fee_collector() -> address: view`"

    Getter for the Fee Collector address to anochor to.

    Returns: fee collector (`address`).

    ??? quote "Source code"

        === "CowSwapBurner.vy"

            ```python
            interface FeeCollector:
                def fee(_epoch: Epoch=empty(Epoch), _ts: uint256=block.timestamp) -> uint256: view
                def target() -> ERC20: view
                def owner() -> address: view
                def emergency_owner() -> address: view
                def epoch_time_frame(epoch: Epoch, ts: uint256=block.timestamp) -> (uint256, uint256): view
                def can_exchange(_coins: DynArray[ERC20, MAX_COINS_LEN]) -> bool: view
                def transfer(_transfers: DynArray[Transfer, MAX_COINS_LEN]): nonpayable

            fee_collector: public(immutable(FeeCollector))

            @external
            def __init__(_fee_collector: FeeCollector,
                _composable_cow: ComposableCow, _vault_relayer: address, _target_threshold: uint256):
                """
                @notice Contract constructor
                @param _fee_collector FeeCollector to anchor to
                @param _composable_cow Address of ComposableCow contract
                @param _vault_relayer CowSwap's VaultRelayer contract address, all approves go there
                @param _target_threshold Minimum amount of target to buy per order
                """
                fee_collector = _fee_collector
                ...
            ```

    === "Example"
        ```shell
        >>> CowSwapBurner.fee_collector()
        '0xa2Bcd1a4Efbd04B63cd03f5aFf2561106ebCCE00'
        ```


### `composable_cow`
!!! description "`CowSwapBurner.composable_cow() -> address: view`"

    Getter for the ComposableCow contract. ComposableCow is a framework for smoothing developer experience when building conditional orders on the CoW Protocol. For the official documentation, see [here](https://docs.cow.fi/cow-protocol/reference/contracts/periphery/composable-cow).

    Returns: ComposableCow contract (`address`).

    ??? quote "Source code"

        === "CowSwapBurner.vy"

            ```python
            interface ComposableCow:
                def create(params: ConditionalOrderParams, dispatch: bool): nonpayable
                def domainSeparator() -> bytes32: view
                def isValidSafeSignature(
                    safe: address, sender: address, _hash: bytes32, _domainSeparator: bytes32, typeHash: bytes32,
                    encodeData: Bytes[15 * 32],
                    payload: Bytes[(32 + 3 + 1 + 8) * 32],
                ) -> bytes4: view

            composable_cow: public(immutable(ComposableCow))

            @external
            def __init__(_fee_collector: FeeCollector,
                _composable_cow: ComposableCow, _vault_relayer: address, _target_threshold: uint256):
                """
                @notice Contract constructor
                @param _fee_collector FeeCollector to anchor to
                @param _composable_cow Address of ComposableCow contract
                @param _vault_relayer CowSwap's VaultRelayer contract address, all approves go there
                @param _target_threshold Minimum amount of target to buy per order
                """
                ...
                composable_cow = _composable_cow
                ...
            ```

    === "Example"
        ```shell
        >>> CowSwapBurner.composable_cow()
        '0xfdaFc9d1902f4e0b84f65F49f244b32b31013b74'
        ```


### `vault_relayer`
!!! description "`CowSwapBurner.vault_relayer() -> address: view`"

    Getter for CoW Protocols Vault Relayer contract. This is the contract where all approvals go to. For the official documentation, see [here](https://docs.cow.fi/cow-protocol/reference/contracts/core/vault-relayer).

    Returns: Vault Relayer (`address`).

    ??? quote "Source code"

        === "CowSwapBurner.vy"

            ```python
            vault_relayer: public(immutable(address))

            @external
            def __init__(_fee_collector: FeeCollector,
                _composable_cow: ComposableCow, _vault_relayer: address, _target_threshold: uint256):
                """
                @notice Contract constructor
                @param _fee_collector FeeCollector to anchor to
                @param _composable_cow Address of ComposableCow contract
                @param _vault_relayer CowSwap's VaultRelayer contract address, all approves go there
                @param _target_threshold Minimum amount of target to buy per order
                """
                ...
                vault_relayer = _vault_relayer
                ...
            ```

    === "Example"
        ```shell
        >>> CowSwapBurner.vault_relayer()
        '0xC92E8bdf79f0507f65a392b0ab4667716BFE0110'
        ```


---


## **Orders**

Orders are created using the `burn` function. The function is not directly externally callable by users through this contract, instead it is called when the `collect` function within the `FeeCollector` contract is called. Additionally, there is a caller fee to incentivise the contract call.

```shell
struct ConditionalOrderParams:
    # The contract implementing the conditional order logic
    handler: address  # self
    # Allows for multiple conditional orders of the same type and data
    salt: bytes32  # Not used for now
    # Data available to ALL discrete orders created by the conditional order
    staticData: Bytes[STATIC_DATA_LEN]  # Using coin address

composable_cow.create(ConditionalOrderParams({
                            handler: self,
                            salt: empty(bytes32),
                            staticData: concat(b"", convert(coin.address, bytes20)),
                        }), True)
```


### `created`
!!! description "`CowSwapBurner.created(arg0: address) -> bool: view`"

    Getter method to check if a conditional order for coin `arg0` has been created. Orders are created the first time when calling the `burn` function.

    Returns: true or false (`bool`).

    | Input  | Type      | Description               |
    | ------ | --------- | ------------------------- |
    | `arg0` | `address` | Address of coin to check. |

    ??? quote "Source code"

        === "CowSwapBurner.vy"

            ```python
            created: public(HashMap[ERC20, bool])

            @external
            def burn(_coins: DynArray[ERC20, MAX_COINS_LEN], _receiver: address):
                """
                @notice Post hook after collect to register coins for burn
                @dev Registers new orders in ComposableCow
                @param _coins Which coins to burn
                @param _receiver Receiver of profit
                """
                assert msg.sender == fee_collector.address, "Only FeeCollector"

                fee: uint256 = fee_collector.fee(Epoch.COLLECT)
                fee_payouts: DynArray[Transfer, MAX_COINS_LEN] = []
                self_transfers: DynArray[Transfer, MAX_COINS_LEN] = []
                for coin in _coins:
                    if not self.created[coin]:
                        composable_cow.create(ConditionalOrderParams({
                            handler: self,
                            salt: empty(bytes32),
                            staticData: concat(b"", convert(coin.address, bytes20)),
                        }), True)
                        coin.approve(vault_relayer, max_value(uint256))
                        self.created[coin] = True
                    amount: uint256 = coin.balanceOf(fee_collector.address) * fee / ONE
                    fee_payouts.append(Transfer({coin: coin, to: _receiver, amount: amount}))
                    self_transfers.append(Transfer({coin: coin, to: self, amount: max_value(uint256)}))

                fee_collector.transfer(fee_payouts)
                fee_collector.transfer(self_transfers)
            ```

    === "Example"
        ```shell
        >>> CowSwapBurner.created('0xD533a949740bb3306d119CC777fa900bA034cd52')
        'false'
        ```


### `burn`
!!! description "`CowSwapBurner.burn(_coins: DynArray[ERC20, MAX_COINS_LEN], _receiver: address)`"

    !!!guard "Guarded Method"
        This function is only callable by the `FeeCollector` contract.

    Function to create a conditional order for coins.

    | Input   | Type      | Description                    |
    | ------- | --------- | ------------------------------ |
    | `_coins` | `DynArray[ERC20, MAX_COINS_LEN]` | Coins to burn. |
    | `_receiver`   | `address` | Receiver of the caller fee specified in when calling `collect` within the FeeCollector. |

    ??? quote "Source code"

        === "CowSwapBurner.vy"

            ```python
            interface FeeCollector:
                def fee(_epoch: Epoch=empty(Epoch), _ts: uint256=block.timestamp) -> uint256: view
                def target() -> ERC20: view
                def owner() -> address: view
                def emergency_owner() -> address: view
                def epoch_time_frame(epoch: Epoch, ts: uint256=block.timestamp) -> (uint256, uint256): view
                def can_exchange(_coins: DynArray[ERC20, MAX_COINS_LEN]) -> bool: view
                def transfer(_transfers: DynArray[Transfer, MAX_COINS_LEN]): nonpayable

            struct ConditionalOrderParams:
                # The contract implementing the conditional order logic
                handler: address  # self
                # Allows for multiple conditional orders of the same type and data
                salt: bytes32  # Not used for now
                # Data available to ALL discrete orders created by the conditional order
                staticData: Bytes[STATIC_DATA_LEN]  # Using coin address

            interface ComposableCow:
                def create(params: ConditionalOrderParams, dispatch: bool): nonpayable
                def domainSeparator() -> bytes32: view
                def isValidSafeSignature(
                    safe: address, sender: address, _hash: bytes32, _domainSeparator: bytes32, typeHash: bytes32,
                    encodeData: Bytes[15 * 32],
                    payload: Bytes[(32 + 3 + 1 + 8) * 32],
                ) -> bytes4: view

            @external
            def burn(_coins: DynArray[ERC20, MAX_COINS_LEN], _receiver: address):
                """
                @notice Post hook after collect to register coins for burn
                @dev Registers new orders in ComposableCow
                @param _coins Which coins to burn
                @param _receiver Receiver of profit
                """
                assert msg.sender == fee_collector.address, "Only FeeCollector"

                fee: uint256 = fee_collector.fee(Epoch.COLLECT)
                fee_payouts: DynArray[Transfer, MAX_COINS_LEN] = []
                self_transfers: DynArray[Transfer, MAX_COINS_LEN] = []
                for coin in _coins:
                    if not self.created[coin]:
                        composable_cow.create(ConditionalOrderParams({
                            handler: self,
                            salt: empty(bytes32),
                            staticData: concat(b"", convert(coin.address, bytes20)),
                        }), True)
                        coin.approve(vault_relayer, max_value(uint256))
                        self.created[coin] = True
                    amount: uint256 = coin.balanceOf(fee_collector.address) * fee / ONE
                    fee_payouts.append(Transfer({coin: coin, to: _receiver, amount: amount}))
                    self_transfers.append(Transfer({coin: coin, to: self, amount: max_value(uint256)}))

                fee_collector.transfer(fee_payouts)
                fee_collector.transfer(self_transfers)
            ```

    === "Example"
        ```shell
        >>> soon
        ```


### `getTradableOrder`
!!! description "`CowSwapBurner.getTradeableOrder(_owner: address, _sender: address, _ctx: bytes32, _static_input: Bytes[STATIC_DATA_LEN], _offchain_input: Bytes[OFFCHAIN_DATA_LEN]) -> GPv2Order_Data`"

    Function to generate a order for the WatchTower.

    Returns: order parameters (`GPv2Order_Data`).

    | Input             | Type                       | Description                    |
    | ----------------- | -------------------------- | ------------------------------ |
    | `_owner`          | `address`                  | Owner of the order.            |
    | `_sender`         | `address`                  | `msg.sender` context calling `isValidSignature` |
    | `_ctx`            | `bytes32`                  | Execution context.             |
    | `_static_input`   | `Bytes[STATIC_DATA_LEN]`   | `sellToken` encoded as bytes(Bytes[20]). |
    | `_offchain_input` | `Bxtes[OFFCHAIN_DATA_LEN]` | Not used, zero-length bytes.   |

    ??? quote "Source code"

        === "CowSwapBurner.vy"

            ```python
            struct GPv2Order_Data:
                sellToken: ERC20  # token to sell
                buyToken: ERC20  # token to buy
                receiver: address  # receiver of the token to buy
                sellAmount: uint256
                buyAmount: uint256
                validTo: uint32  # timestamp until order is valid
                appData: bytes32  # extra info about the order
                feeAmount: uint256  # amount of fees in sellToken
                kind: bytes32  # buy or sell
                partiallyFillable: bool  # partially fillable (True) or fill-or-kill (False)
                sellTokenBalance: bytes32  # From where the sellToken balance is withdrawn
                buyTokenBalance: bytes32  # Where the buyToken is deposited

            STATIC_DATA_LEN: constant(uint256) = 20
            OFFCHAIN_DATA_LEN: constant(uint256) = 1

            @view
            @external
            def getTradeableOrder(_owner: address, _sender: address, _ctx: bytes32, _static_input: Bytes[STATIC_DATA_LEN], _offchain_input: Bytes[OFFCHAIN_DATA_LEN]) -> GPv2Order_Data:
                """
                @notice Generate order for WatchTower
                @dev _owner, _sender, _ctx, _offchain_input are ignored
                @param _owner Owner of order (self)
                @param _sender `msg.sender` context calling `isValidSignature`
                @param _ctx Execution context
                @param _static_input sellToken encoded as bytes(Bytes[20])
                @param _offchain_input Not used, zero-length bytes
                @return Order parameters
                """
                sell_token: ERC20 = ERC20(convert(convert(_static_input, bytes20), address))
                order: GPv2Order_Data = self._get_order(sell_token)
                order.sellAmount = sell_token.balanceOf(self)

                if order.sellAmount == 0 or not fee_collector.can_exchange([sell_token]):
                    start: uint256 = 0
                    end: uint256 = 0
                    start, end = fee_collector.epoch_time_frame(Epoch.EXCHANGE)
                    if block.timestamp >= start:
                        start, end = fee_collector.epoch_time_frame(Epoch.EXCHANGE, block.timestamp + 7 * 24 * 3600)
                    reason: String[11] = "ZeroBalance"
                    if order.sellAmount != 0:  # FeeCollector reject
                        reason = "NotAllowed"
                    raw_revert(_abi_encode(start, reason, method_id=method_id("PollTryAtEpoch(uint256,string)")))

                return order

            @view
            @internal
            def _get_order(sell_token: ERC20) -> GPv2Order_Data:
                buy_token: ERC20 = fee_collector.target()
                return GPv2Order_Data({
                    sellToken: sell_token,  # token to sell
                    buyToken: buy_token,  # token to buy
                    receiver: fee_collector.address,  # receiver of the token to buy
                    sellAmount: 0,  # Set later
                    buyAmount: self.target_threshold,
                    validTo: convert(fee_collector.epoch_time_frame(Epoch.EXCHANGE)[1], uint32),  # timestamp until order is valid
                    appData: ADD_DATA,  # extra info about the order
                    feeAmount: 0,  # amount of fees in sellToken
                    kind: SELL_KIND,  # buy or sell
                    partiallyFillable: True,  # partially fillable (True) or fill-or-kill (False)
                    sellTokenBalance: TOKEN_BALANCE,  # From where the sellToken balance is withdrawn
                    buyTokenBalance: TOKEN_BALANCE,  # Where the buyToken is deposited
                })
            ```

    === "Example"
        ```shell
        >>> CowSwapBurner.
        ''
        ```


### `get_current_order`
!!! description "`CowSwapBurner.get_current_order(sell_token: address=empty(address)) -> GPv2Order_Data`"

    Getter for the current order parameters of a token.

    Returns: GPv2Order_Data consisting of:
    
    - sellToken: `ERC20` 
    - buyToken: `ERC20`
    - receiver: `address`
    - sellAmount: `uint256`
    - buyAmount: `uint256`
    - validTo: `uint32`
    - appData: `bytes32`
    - feeAmount: `uint256`
    - kind: `bytes32`
    - partiallyFillable: `bool`
    - sellTokenBalance: `bytes32`
    - buyTokenBalance: `bytes32`

    | Input        | Type      | Description                            |
    | ------------ | --------- | -------------------------------------- |
    | `sell_token` | `address` | Token address to check parameters for. |

    ??? quote "Source code"

        === "CowSwapBurner.vy"

            ```python
            @view
            @external
            def get_current_order(sell_token: address=empty(address)) -> GPv2Order_Data:
                """
                @notice Get current order parameters
                @param sell_token Address of possible sell token
                @return Order parameters
                """
                return self._get_order(ERC20(sell_token))

            @view
            @internal
            def _get_order(sell_token: ERC20) -> GPv2Order_Data:
                buy_token: ERC20 = fee_collector.target()
                return GPv2Order_Data({
                    sellToken: sell_token,  # token to sell
                    buyToken: buy_token,  # token to buy
                    receiver: fee_collector.address,  # receiver of the token to buy
                    sellAmount: 0,  # Set later
                    buyAmount: self.target_threshold,
                    validTo: convert(fee_collector.epoch_time_frame(Epoch.EXCHANGE)[1], uint32),  # timestamp until order is valid
                    appData: ADD_DATA,  # extra info about the order
                    feeAmount: 0,  # amount of fees in sellToken
                    kind: SELL_KIND,  # buy or sell
                    partiallyFillable: True,  # partially fillable (True) or fill-or-kill (False)
                    sellTokenBalance: TOKEN_BALANCE,  # From where the sellToken balance is withdrawn
                    buyTokenBalance: TOKEN_BALANCE,  # Where the buyToken is deposited
                })
            ```

    === "Example"
        ```shell
        >>> CowSwapBurner.get_current_order()
        0x0000000000000000000000000000000000000000, 0xf939E0A03FB07F59A73314E73794Be0E57ac1b4E, 0xa2Bcd1a4Efbd04B63cd03f5aFf2561106ebCCE00, 0, 50000000000000000000, 1718150400, 0x058315b749613051abcbf50cf2d605b4fa4a41554ec35d73fd058fc530da559f, 0, 0xf3b277728b3fee749481eb3e0b3b48980dbbab78658fc419025cb16eee346775, true, 0x5a28e9363bb942b639270062aa6bb295f434bcdfc42c97267bf003f272060dc9, 0x5a28e9363bb942b639270062aa6bb295f434bcdfc42c97267bf003f272060dc9
        ```


### `verify`
!!! description "`CowSwapBurner.verify(_owner: address, _sender: address, _hash: bytes32, _domain_separator: bytes32, _ctx: bytes32, _static_input: Bytes[STATIC_DATA_LEN], _offchain_input: Bytes[OFFCHAIN_DATA_LEN], _order: GPv2Order_Data)`"

    Function to verify CowSwap orders. @roman: what does this do?

    | Input   | Type      | Description                    |
    | ------- | --------- | ------------------------------ |
    | `_owner` | `address` | Owner of conditional order (self). |
    | `_sender` | `address` |  `msg.sender` context calling `isValidSignature`.  |
    | `_hash` | `bytes32` |  `EIP-712` order digest.  |
    | `_domain_seperator` | `bytes32` |  `EIP-712` domain separator.  |
    | `_ctx` | `bytes32` |  Execution context.  |
    | `_static_input` | `Bytes[STATIC_DATA_LEN]` | ConditionalOrder's staticData (coin address).   |
    | `_offchain_input` | `Bytes[OFFCHAIN_DATA_LEN]` |  Conditional order type-specific data NOT known at time of creation for a specifi discrete order (or zero-length bytes if not applicable).  |
    | `_order` | `GPv2Order_Data` |  The proposed discrete order's `GPv2Order.Data` struct.  |

    ??? quote "Source code"

        === "CowSwapBurner.vy"

            ```python
            struct GPv2Order_Data:
                sellToken: ERC20  # token to sell
                buyToken: ERC20  # token to buy
                receiver: address  # receiver of the token to buy
                sellAmount: uint256
                buyAmount: uint256
                validTo: uint32  # timestamp until order is valid
                appData: bytes32  # extra info about the order
                feeAmount: uint256  # amount of fees in sellToken
                kind: bytes32  # buy or sell
                partiallyFillable: bool  # partially fillable (True) or fill-or-kill (False)
                sellTokenBalance: bytes32  # From where the sellToken balance is withdrawn
                buyTokenBalance: bytes32  # Where the buyToken is deposited

            @view
            @external
            def verify(
                _owner: address,
                _sender: address,
                _hash: bytes32,
                _domain_separator: bytes32,
                _ctx: bytes32,
                _static_input: Bytes[STATIC_DATA_LEN],
                _offchain_input: Bytes[OFFCHAIN_DATA_LEN],
                _order: GPv2Order_Data,
            ):
                """
                @notice Verify order
                @dev Called from ComposableCow. _owner, _sender, _hash, _domain_separator, _ctx are ignored.
                @param _owner Owner of conditional order (self)
                @param _sender `msg.sender` context calling `isValidSignature`
                @param _hash `EIP-712` order digest
                @param _domain_separator `EIP-712` domain separator
                @param _ctx Execution context
                @param _static_input ConditionalOrder's staticData (coin address)
                @param _offchain_input Conditional order type-specific data NOT known at time of creation for a specific discrete order (or zero-length bytes if not applicable)
                @param _order The proposed discrete order's `GPv2Order.Data` struct
                """
                sell_token: ERC20 = ERC20(convert(convert(_static_input, bytes20), address))
                if not fee_collector.can_exchange([sell_token]):
                    raw_revert(_abi_encode("NotAllowed", method_id=method_id("OrderNotValid(string)")))
                if _offchain_input != b"":
                    raw_revert(_abi_encode("NonZeroOffchainInput", method_id=method_id("OrderNotValid(string)")))
                order: GPv2Order_Data = self._get_order(sell_token)
                order.sellAmount = _order.sellAmount  # Any amount allowed
                order.buyAmount = max(_order.buyAmount, order.buyAmount)  # Price is discovered within CowSwap competition
                if _abi_encode(order) != _abi_encode(_order):
                    raw_revert(_abi_encode("BadOrder", method_id=method_id("OrderNotValid(string)")))
            ```

    === "Example"
        ```shell
        >>> soon
        ```


### `isValidSignature`
!!! description "`CowSwapBurner.isValidSignature(_hash: bytes32, signature: Bytes[1792]) -> bytes4`"

    Method to verify a ERC-1271 signature.

    Returns: `ERC1271_MAGIC_VALUE` if signature is OK (`bytes4`).

    | Input   | Type      | Description                    |
    | ------- | --------- | ------------------------------ |
    | `_hash` | `bytes32` | Hash of a singed object.     |
    | `signature`   | `Bytes[1792]` | Signature for the object. (GPv2Order.Data, PayloadStruct) in this case. |

    ??? quote "Source code"

        === "CowSwapBurner.vy"

            ```python
            ERC1271_MAGIC_VALUE: constant(bytes4) = 0x1626ba7e

            @view
            @external
            def isValidSignature(_hash: bytes32, signature: Bytes[1792]) -> bytes4:
                """
                @notice ERC1271 signature verifier method
                @dev Forwards query to ComposableCow
                @param _hash Hash of signed object. Ignored here
                @param signature Signature for the object. (GPv2Order.Data, PayloadStruct) here
                @return `ERC1271_MAGIC_VALUE` if signature is OK
                """
                order: GPv2Order_Data = empty(GPv2Order_Data)
                payload: PayloadStruct = empty(PayloadStruct)
                order, payload = _abi_decode(signature, (GPv2Order_Data, PayloadStruct))

                return composable_cow.isValidSafeSignature(self, msg.sender, _hash, composable_cow.domainSeparator(), empty(bytes32),
                    _abi_encode(order),
                    _abi_encode(payload),
                )
            ```

    === "Example"
        ```shell
        >>> soon
        ```


---


## **Valid Interface a la ERC-165**

In order for the Burner contract to be fully compatible with the `FeeCollector`, a specific interface needs to hold up as per [ERC-165](https://eips.ethereum.org/EIPS/eip-165):

```py
SUPPORTED_INTERFACES: constant(bytes4[4]) = [
    # ERC165: method_id("supportsInterface(bytes4)") == 0x01ffc9a7
    0x01ffc9a7,
    # Burner:
    #   method_id("burn(address[],address)") == 0x72a436a8
    #   method_id("push_target()") == 0x2eb078cd
    #   method_id("VERSION()") == 0xffa1ad74
    0xa3b5e311,
    # Interface corresponding to IConditionalOrderGenerator:
    #   method_id("getTradeableOrder(address,address,bytes32,bytes,bytes)") == 0xb8296fc4
    0xb8296fc4,
    # ERC1271 interface:
    #   method_id("isValidSignature(bytes32,bytes)") == 0x1626ba7e
    ERC1271_MAGIC_VALUE,
]
```


### `supportsInterface`
!!! description "`CowSwapBurner.supportsInterface(_interface_id: bytes4) -> bool`"

    Function to check if the burner supports the correct interface, as specified by the [ERC-165](https://eips.ethereum.org/EIPS/eip-165) standard. This method makes sure the contract is compatible with the `FeeCollector` contract.

    Returns: true or false (`bool`)

    | Input   | Type      | Description                    |
    | ------- | --------- | ------------------------------ |
    | `_interface_id` | `bytes4` | ID of the interface.     |

    ??? quote "Source code"

        === "CowSwapBurner.vy"

            ```python
            SIGNATURE_VERIFIER_MUXER_INTERFACE: constant(bytes4) = 0x62af8dc2
            ERC1271_MAGIC_VALUE: constant(bytes4) = 0x1626ba7e
            SUPPORTED_INTERFACES: constant(bytes4[4]) = [
                # ERC165: method_id("supportsInterface(bytes4)") == 0x01ffc9a7
                0x01ffc9a7,
                # Burner:
                #   method_id("burn(address[],address)") == 0x72a436a8
                #   method_id("push_target()") == 0x2eb078cd
                #   method_id("VERSION()") == 0xffa1ad74
                0xa3b5e311,
                # Interface corresponding to IConditionalOrderGenerator:
                #   method_id("getTradeableOrder(address,address,bytes32,bytes,bytes)") == 0xb8296fc4
                0xb8296fc4,
                # ERC1271 interface:
                #   method_id("isValidSignature(bytes32,bytes)") == 0x1626ba7e
                ERC1271_MAGIC_VALUE,
            ]

            @pure
            @external
            def supportsInterface(_interface_id: bytes4) -> bool:
                """
                @dev Interface identification is specified in ERC-165.
                Fails on SignatureVerifierMuxer for compatability with ComposableCow.
                @param _interface_id Id of the interface
                """
                assert _interface_id != SIGNATURE_VERIFIER_MUXER_INTERFACE
                return _interface_id in SUPPORTED_INTERFACES
            ```

    === "Example"
        ```shell
        >>> soon
        ```


---


## **Pushing and Recovering Coins**

The `push_target` function is used to transfer an leftover target coins from the burner to the `FeeCollector`.

Additionally, there is a recover function which lets the `owner` or `emergency_owner` of the `FeeCollector` to recover ERC20 or ETH.


### `push_target`
!!! description "`CowSwapBurner.push_target() -> uint256`"

    Function to push the entire balance of the target coin to the `FeeCollector`. This function can be called externally, but is also called directly called by the `FeeCollector` before the target coins are forwarded to the hook contract using the `forward` function.

    Returns: amout of target coins pushed (`uint256`).

    ??? quote "Source code"

        === "CowSwapBurner.vy"

            ```python
            @external
            def push_target() -> uint256:
                """
                @notice In case target coin is left in contract can be pushed to forward
                @return Amount of coin pushed further
                """
                target: ERC20 = fee_collector.target()
                amount: uint256 = target.balanceOf(self)
                if amount > 0:
                    target.transfer(fee_collector.address, amount)
                return amount
            ```

    === "Example"
        ```shell
        >>> soon
        ```


### `recover`
!!! description "`CowSwapBurner.recover(_coins: DynArray[ERC20, MAX_COINS_LEN])`"

    !!!guard "Guarded Method"
        This function is only callable by the `owner` or `emergency_owner` of the `FeeCollector.vy` contract.

    Function to recover ERC20 tokens or ETH from this contract. Calling this function will transfer `_coins` to the `FeeCollector`.

    | Input    | Type                             | Description                           |
    | -------- | -------------------------------- | ------------------------------------- |
    | `_coins` | `DynArray[ERC20, MAX_COINS_LEN]` | Dynamic array of the token addresses to recover. |

    ??? quote "Source code"

        === "CowSwapBurner.vy"

            ```python
            @external
            def recover(_coins: DynArray[ERC20, MAX_COINS_LEN]):
                """
                @notice Recover ERC20 tokens or Ether from this contract
                @dev Callable only by owner and emergency owner
                @param _coins Token addresses
                """
                assert msg.sender in [fee_collector.owner(), fee_collector.emergency_owner()], "Only owner"

                for coin in _coins:
                    if coin.address == ETH_ADDRESS:
                        raw_call(fee_collector.address, b"", value=self.balance)
                    else:
                        coin.transfer(fee_collector.address, coin.balanceOf(self))  # do not need safe transfer
            ```

    === "Example"
        ```shell
        >>> soon
        ```


---

## target threshold

this value represents the minimum amount of target tokens to be exchanged to. This prevent spamming very small orders.


### `target_threshold`
!!! description "`CowSwapBurner.target_threshold() -> uint256: view`"

    Getter for the minimum amount of tokens to exchange. This value can be changed by the owner using the `set_target_threshold` function.

    Returns: target threshold (`uint256`).

    ??? quote "Source code"

        === "CowSwapBurner.vy"

            ```python
            target_threshold: public(uint256)  # min amount to exchange

            @external
            def __init__(_fee_collector: FeeCollector,
                _composable_cow: ComposableCow, _vault_relayer: address, _target_threshold: uint256):
                """
                @notice Contract constructor
                @param _fee_collector FeeCollector to anchor to
                @param _composable_cow Address of ComposableCow contract
                @param _vault_relayer CowSwap's VaultRelayer contract address, all approves go there
                @param _target_threshold Minimum amount of target to buy per order
                """
                ...
                assert _target_threshold > 0, "Bad target threshold"
                self.target_threshold = _target_threshold
            ```

    === "Example"
        ```shell
        >>> CowSwapBurner.target_threshold()
        50000000000000000000
        ```

### `set_target_threshold`
!!! description "`CowSwapBurner.set_target_threshold(_target_threshold: uint256)`"

    !!!guard "Guarded Method"
        This function is only callable by the `owner` of the `FeeCollector` contract.

    Function to set the a new `target_threshold` value.

    | Input    | Type                             | Description                           |
    | -------- | -------------------------------- | ------------------------------------- |
    | `_target_threshold` | `uint256` | New target threshold value. |

    ??? quote "Source code"

        === "CowSwapBurner.vy"

            ```python
            target_threshold: public(uint256)  # min amount to exchange

            @external
            def set_target_threshold(_target_threshold: uint256):
                """
                @dev Callable only by owner
                @param _target_threshold Minimum amount of target to receive, with base=10**18
                """
                assert msg.sender == fee_collector.owner(), "Only owner"
                assert _target_threshold > 0, "Bad target threshold"

                self.target_threshold = _target_threshold
            ```

    === "Example"
        ```shell
        >>> soon
        ```



---


## todo

### `ADD_DATA`
!!! description "`CowSwapBurner.ADD_DATA() -> bytes32: view`"

    Getter for the additional data applied in the internal `_get_order` function. @roman: what is this additional data? what does it do?

    Returns: additional data (`bytes32`).

    ??? quote "Source code"

        === "CowSwapBurner.vy"

            ```python
            ADD_DATA: public(constant(bytes32)) = 0x058315b749613051abcbf50cf2d605b4fa4a41554ec35d73fd058fc530da559f
            ```

    === "Example"
        ```shell
        >>> CowSwapBurner.ADD_DATA()
        '0x058315b749613051abcbf50cf2d605b4fa4a41554ec35d73fd058fc530da559f'
        ```


### `VERSION`
!!! description "`CowSwapBurner.VERSION() -> String[20]: view`"

    Getter for the burner version. 

    Returns: version (`String[20]`)

    ??? quote "Source code"

        === "CowSwapBurner.vy"

            ```python
            VERSION: public(constant(String[20])) = "CowSwap"
            ```

    === "Example"
        ```shell
        >>> CowSwapBurner.VERSION()
        'CowSwap'
        ```
