<h1> </h1>

# **Collecting and Burning Fees on Sidechains**

Fee collection on sidechains works similarly to that on the Ethereum mainnet. Collected fees are sent to a fee receiver contract and then burned. On most sidechains, tokens are burnt for [MIM](https://etherscan.io/address/0x99d8a9c45b2eca8864373a26d1459e3dff1e17f3), as it's an easy asset to bridge back to the mainnet. These proxy contracts have a `bridge()` function to bridge the tokens to the Ethereum mainnet. 

MIM is then burnt on for 3CRV on Ethereum and sent to the FeeDistributor.

!!!note
    The contract owner can bridge any token in any quantity, other accounts can only bridge approved tokens, where the balance exceeds a minimum amount defined by the owner. This prevents bridging tokens when the amount is so small that claiming on the root chain becomes economically unfeasible.

??? quote "Proxy Source Code"

    ```vyper
    @external
    def bridge(_coin: address):
        """
        @notice Transfer a coin to the root chain via the bridging contract.
        @dev The contract owner can bridge any token in any quantity,
            other accounts can only bridge approved tokens, where
            the balance exceeds a minimum amount defined by the owner.
            This prevents bridging tokens when the amount is so small
            that claiming on the root chain becomes economically unfeasible.
        @param _coin Address of the coin to be bridged.
        """
        bridging_contract: address = self.bridging_contract
        amount: uint256 = ERC20(_coin).balanceOf(self)
        if amount > 0:
            response: Bytes[32] = raw_call(
                _coin,
                _abi_encode(bridging_contract, amount, method_id=method_id("transfer(address,uint256)")),
                max_outsize=32,
            )

        if msg.sender != self.admin:
            minimum: uint256 = self.bridge_minimums[_coin]
            assert minimum != 0,  "Coin not approved for bridging"
            assert minimum <= ERC20(_coin).balanceOf(bridging_contract), "Balance below minimum bridge amount"

        Bridger(bridging_contract).bridge(_coin)
    ```





## **Bridging**


!!!warning
    The methods to burn and bridge assets *might slightly vary based on the chain*. The examples down below are taken from [Optimism](https://www.optimism.io/).

### `brigde`
!!! description "`Bridge.bridge(coin: address) -> bool:`"

    !!!guard "Guarded Method"
        This function is only callable by the `owner` of the contract. Additionally, only `TOKEN` can be bridged.

    Function to bridge the entire balance of `_coin` to the root chain. This function must be called from its proxy contract, as its the owner.
    
    Returns: true (`bool`).

    Emits: `AssetBridged`

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_coin` |  `address` | coin to bridge |

    ??? quote "Source code"

        ```vyper 
        event AssetBridged:
            token: indexed(address)
            amount: uint256

        @external
        def bridge(coin: address) -> bool:
            assert msg.sender == self.owner and coin == TOKEN

            start: uint256 = self.start
            assert block.timestamp > start + 1800

            amount: uint256 = ERC20(coin).balanceOf(self)
            if amount == 0:
                amount = ERC20(coin).balanceOf(msg.sender)
                assert ERC20(coin).transferFrom(msg.sender, self, amount)
            
            if start == 0:
                ERC20(coin).transfer(msg.sender, ERC20(coin).balanceOf(self) - amount / 100)
                amount = amount / 100
                
                self.start = block.timestamp
            
            receiver: address = self.receiver
            adapter_params: Bytes[128] = concat(
                b"\x00\x02",
                convert(100_000, bytes32),
                b"\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00",
                convert(receiver, bytes32)
            )

            fee: uint256 = ProxyOFT(PROXY_OFT).estimateSendFee(
                ETH_CHAIN_ID, convert(receiver, bytes32), amount, False, adapter_params,
            )
            assert ERC20(coin).approve(PROXY_OFT, amount)

            ProxyOFT(PROXY_OFT).sendFrom(
                self,
                ETH_CHAIN_ID,
                convert(receiver, bytes32),
                amount,
                CallParams({
                    refund: self,
                    zero_payer: empty(address),
                    adapter_params: adapter_params,
                }),
                value=fee
            )

            log AssetBridged(coin, amount)
            return True
        ```

    === "Example"
        ```shell
        >>> Bridge.bridge('0xB153FB3d196A8eB25522705560ac152eeEc57901')
        ```



## **Contract Info Methods**
### `PROXY_OFT`
!!! description "`Bridge.PROXY_OFT():`"

    Getter for the OFT bridger.

    ??? quote "Source code"

        ```vyper 
        PROXY_OFT: public(immutable(address))

        @external
        def __init__(proxy_oft: address, receiver: address, token: address):
            self.owner = msg.sender
            self.receiver = receiver

            PROXY_OFT = proxy_oft
            TOKEN = token

            log AcceptOwnership(msg.sender)
        ```

    === "Example"
        ```shell
        >>> Bridge.PROXY_OFT()
        '0x48686c24697fe9042531B64D792304e514E74339'
        ```


### `TOKEN`
!!! description "`Bridge.TOKEN():`"

    Getter for the bridge token.

    ??? quote "Source code"

        ```vyper 
        TOKEN: public(immutable(address))

        @external
        def __init__(proxy_oft: address, receiver: address, token: address):
            self.owner = msg.sender
            self.receiver = receiver

            PROXY_OFT = proxy_oft
            TOKEN = token

            log AcceptOwnership(msg.sender)
        ```

    === "Example"
        ```shell
        >>> Bridge.TOKEN()
        '0xB153FB3d196A8eB25522705560ac152eeEc57901'
        ```



## **Receiver**

Receiver of the bridged funds is the 0xECB contract on Ethereum Mainnet.

### `receiver`
!!! description "`Bridge.receiver():`"

    Getter for the receiver address of the bridged funds.

    !!!note
        Receiver is the 0xECB contract (FeeCollector/Proxy on Ethereum Mainnet).

    ??? quote "Source code"

        ```vyper 
        PROXY_OFT: public(immutable(address))

        @external
        def __init__(proxy_oft: address, receiver: address, token: address):
            self.owner = msg.sender
            self.receiver = receiver

            PROXY_OFT = proxy_oft
            TOKEN = token

            log AcceptOwnership(msg.sender)
        ```

    === "Example"
        ```shell
        >>> Bridge.receiver()
        '0xeCb456EA5365865EbAb8a2661B0c503410e9B347'
        ```


### `set_root_receiver`
!!! description "`Bridge.set_root_receiver(receiver: address):`"

    !!!guard "Guarded Method"
        This function is only callable by the `owner` of the contract.

    Function to set a new receiver address for the bridged funds.
    
    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `receiver` |  `address` | new receiver address |

    ??? quote "Source code"

        ```vyper 
        @external
        def set_root_receiver(receiver: address):
            assert msg.sender == self.owner
            assert receiver != empty(address)

            self.receiver = receiver
        ```

    === "Example"
        ```shell
        >>> Bridge.set_root_receiver('0x0000000000000000000000000000000000000000')
        ```