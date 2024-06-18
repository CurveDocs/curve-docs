<h1>CowSwapBurner.vy</h1>

!!!github "GitHub"
    The source code of the `CoWSwapBurner.vy` contract can be found on [:material-github: GitHub](https://github.com/curvefi/curve-burners/blob/main/contracts/burners/CowSwapBurner.vy).

The `CowSwapBurner` is an essential component of the fee burning architecture, designed to facilitate the efficient and automated exchange of admin fees using [conditional orders](https://docs.cow.fi/cow-protocol/concepts/order-types/programmatic-orders) of the CoWSwap protocol.

This system simplifies fee burning by requiring only a single burner contract. A simple function call can create an order that sells a accrued fee token into the target token.

The old system used various kinds of burners with hardcoded routes, which often did not result in the most efficient fee burning mechanism, thereby "losing" fees that could be distributed among veCRV holders.

*To learn more about the CoW-Protocol, make sure to check out their [official documentation](https://docs.cow.fi/).*


---


## **Conditional Orders**

Conditional CowSwap orders are automatically created for each token to be burned using the `burn` function. This function is not directly externally callable by users through this contract; instead, it is called when the `collect` function within the `FeeCollector` contract is invoked. Additionally, there is a caller fee to incentivize this contract call.


```vyper
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

    Getter method to check if a conditional order for coin `arg0` has been created. If there is not an existing order, a new order will be created when the `burn` function is called.[^1]

    [^1]: The `burn` function can only be called indirectly by the `fee_receiver` via the `collect` function.

    Returns: true or false (`bool`).

    | Input  | Type      | Description               |
    | ------ | --------- | ------------------------- |
    | `arg0` | `address` | Address of coin to check. |

    ??? quote "Source code"

        === "CowSwapBurner.vy"

            ```vyper
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
        >>> CowSwapBurner.created('0xDDAfbb505ad214D7b80b1f830fcCc89B60fb7A83')
        'true'
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

            ```vyper
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
        >>> CowSwapBurner.get_current_order('0xDDAfbb505ad214D7b80b1f830fcCc89B60fb7A83')
        0xDDAfbb505ad214D7b80b1f830fcCc89B60fb7A83, 0xaBEf652195F98A91E490f047A5006B71c85f058d, 0xBb7404F9965487a9DdE721B3A5F0F3CcfA9aa4C5, 0, 1000000000000000000, 1718755200, 0x058315b749613051abcbf50cf2d605b4fa4a41554ec35d73fd058fc530da559f, 0,0xf3b277728b3fee749481eb3e0b3b48980dbbab78658fc419025cb16eee346775, true, 0x5a28e9363bb942b639270062aa6bb295f434bcdfc42c97267bf003f272060dc9, 0x5a28e9363bb942b639270062aa6bb295f434bcdfc42c97267bf003f272060dc9
        ```


### `burn`
!!! description "`CowSwapBurner.burn(_coins: DynArray[ERC20, MAX_COINS_LEN], _receiver: address)`"

    !!!guard "Guarded Method"
        This function is only callable by the `FeeCollector` contract via the `collect` function.

    Function to create a conditional CowSwap order for coins.

    | Input   | Type      | Description                    |
    | ------- | --------- | ------------------------------ |
    | `_coins` | `DynArray[ERC20, MAX_COINS_LEN]` | Coins to burn. |
    | `_receiver`   | `address` | Receiver of the keeper fee specified in when calling `collect` within the FeeCollector. |

    ??? quote "Source code"

        === "CowSwapBurner.vy"

            ```vyper
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

            ```vyper
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


### `verify`
!!! description "`CowSwapBurner.verify(_owner: address, _sender: address, _hash: bytes32, _domain_separator: bytes32, _ctx: bytes32, _static_input: Bytes[STATIC_DATA_LEN], _offchain_input: Bytes[OFFCHAIN_DATA_LEN], _order: GPv2Order_Data)`"

    Function to verify CowSwap orders to ensure that the order adheres to the conditions set by the contract and can be executed properly.

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

            ```vyper
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

    Function to verify a ERC-1271 signature for a given hash.

    Returns: `ERC1271_MAGIC_VALUE` if signature is OK (`bytes4`).

    | Input   | Type      | Description                    |
    | ------- | --------- | ------------------------------ |
    | `_hash` | `bytes32` | Hash of a signed data.     |
    | `signature`   | `Bytes[1792]` | Signature for the object. (GPv2Order.Data, PayloadStruct) in this case. |

    ??? quote "Source code"

        === "CowSwapBurner.vy"

            ```vyper
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


### `target_threshold`
!!! description "`CowSwapBurner.target_threshold() -> uint256: view`"

    Getter for the minimum amount of target token to be bought in an order. This value ensure that each executed order meets a certain minimum value. This variable can be changed by the `owner` of the `FeeCollector` using the [`set_target_threshold`](#set_target_threshold) function. Due to the gas efficiency of L2's, the value can be set much lower e.g. on Gnosis than on Ethereum.[^1]

    [^1]: The minimum target threshold value on Gnosis is `1 (1e18)`, on Ethereum `50 (50 * 1e18)`. 

    Returns: target threshold (`uint256`).

    ??? quote "Source code"

        === "CowSwapBurner.vy"

            ```vyper
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

            ```vyper
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


## **Pushing and Recovering Coins**

The `push_target` function is used to transfer an leftover target coins from the burner to the `FeeCollector`.

Additionally, there is a recover function which lets the `owner` or `emergency_owner` of the `FeeCollector` to recover ERC20 or ETH.


### `push_target`
!!! description "`CowSwapBurner.push_target() -> uint256`"

    Function to push the entire balance of the target coin to the `FeeCollector`. This function can be called externally, but is also called directly called by the `FeeCollector` before the target coins are forwarded to the hook contract using the `forward` function.

    Returns: amout of target coins pushed (`uint256`).

    ??? quote "Source code"

        === "CowSwapBurner.vy"

            ```vyper
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

            ```vyper
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


## **Valid Interface a la ERC-165**

In order for the burner contract to be fully compatible with the `FeeCollector`, a specific interface needs to hold up as per [ERC-165](https://eips.ethereum.org/EIPS/eip-165):

```vyper
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

            ```vyper
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


## **Contract Info Methods**

### `fee_collector`
!!! description "`CowSwapBurner.fee_collector() -> address: view`"

    Getter for the Fee Collector address to anochor to.

    Returns: fee collector (`address`).

    ??? quote "Source code"

        === "CowSwapBurner.vy"

            ```vyper
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

            ```vyper
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

            ```vyper
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


### `ADD_DATA`
!!! description "`CowSwapBurner.ADD_DATA() -> bytes32: view`"

    Getter for the additional data applied in the internal `_get_order` function. @roman: what is this additional data? what does it do?

    Returns: additional data (`bytes32`).

    ??? quote "Source code"

        === "CowSwapBurner.vy"

            ```vyper
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

            ```vyper
            VERSION: public(constant(String[20])) = "CowSwap"
            ```

    === "Example"
        ```shell
        >>> CowSwapBurner.VERSION()
        'CowSwap'
        ```