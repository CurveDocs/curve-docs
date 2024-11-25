<h1>Bridger Wrappers</h1>

<script src="/assets/javascripts/contracts/gauges/bridgers.js"></script>
<script src="https://cdn.jsdelivr.net/npm/web3@1.5.2/dist/web3.min.js"></script>

Bridger wrappers are contracts used to transmit ERC20 tokens and especially `CRV` emissions across chains. Due to the increasing number of networks to which Curve deploys, bridge wrappers adhere to a specific interface documented below and allow for a modular bridging system.

???+ vyper "Bridgers.vy"
    The source code for the various `Bridger Wrappers` contracts can be found on [:material-github: GitHub](https://github.com/curvefi/curve-xchain-factory/tree/master/contracts/bridgers). The code varies slightly to adapt to different chain-specific implementations.

    :material-information-outline:{ title='This interactive example fetches the output directly on-chain.' } Bridgers for each specific chain can be fetched from the `RootGaugeFactory`:

    <div class="highlight">
    <pre><code>>>> Bridger.get_bridger(<input id="chainId" type="number" value="42161" min="0" 
    style="width: 50px; 
        background: transparent; 
        border: none; 
        border-bottom: 1px solid #ccc; 
        color: inherit; 
        font-family: inherit; 
        font-size: inherit; 
        -moz-appearance: textfield;" 
        oninput="fetchBridger()"/>)
    <span id="bridgerOutput"></span></code></pre>
    </div>

    <style>
    input[type=number]::-webkit-inner-spin-button, 
    input[type=number]::-webkit-outer-spin-button {
        -webkit-appearance: none;
        margin: 0;
    }
    </style>

---

!!!warning "Chain-Specific Implementations"
    The following function examples are for the :logos-arbitrum: Arbitrum bridger. Due to the varying implementations across different chains, the source code might vary slightly between different bridger implementations.

The following three functions are required for bridge wrappers contracts to be implemented to ensure compatibility with the `RootGaugeFactory` and `RootGauge` contracts.

- [`cost()`](#cost) estimates the cost of bridging.
- [`bridge()`](#bridge) bridges CRV to the child chain.
- [`check()`](#check) verifies if the bridger has been approved by the `RootGauge`.

---

## **Must-Implement Methods**

*The following three functions are required to be implemented to ensure compatibility with the `RootGaugeFactory` and `RootGauge` contracts:*

### `cost`
!!! description "`Bridger.cost() -> uint256: view`"

    Function to estimate the cost of bridging.

    Returns: the cost of bridging in ETH (`uint256`).

    ??? quote "Source code"

        This source code might vary slightly between different bridger implementations. This example is specific to the `Bridger` contract for Arbitrum.

        === "ArbitrumBridger.vy"

            ```python
            # [gas_limit uint64][gas_price uint64][max_submission_cost uint64]
            submission_data: uint256
            is_approved: public(HashMap[address, bool])

            @view
            @external
            def cost() -> uint256:
                """
                @notice Cost in ETH to bridge
                """
                data: uint256 = self.submission_data
                # gas_limit * gas_price + max_submission_cost
                return shift(data, -128) * (shift(data, -64) % 2 ** 64) + data % 2 ** 64
            ```

    === "Example"

        This example returns the cost of bridging denominated in `ETH` with a precision of 18 decimals.

        ```py
        >>> Bridger.cost()
        2000000000000000    # 0.002 ETH
        ```

### `bridge`
!!! description "`Bridger.bridge(_token: address, _to: address, _amount: uint256)`"

    Function to bridge any ERC20 token to the child chain.

    | Parameter | Type | Description |
    | --------- | ---- | ------------ |
    | `_token` | `address` | The address of the token to bridge. |
    | `_to` | `address` | The address to bridge the token to. |
    | `_amount` | `uint256` | The amount of `_token` to deposit. |

    ??? quote "Source code"

        This source code might vary slightly between different bridger implementations. This example is specific to the `Bridger` contract for Arbitrum.

        === "ArbitrumBridger.vy"

            ```python
            interface GatewayRouter:
                def getGateway(_token: address) -> address: view
                def outboundTransfer(  # emits DepositInitiated event with Inbox sequence #
                    _token: address,
                    _to: address,
                    _amount: uint256,
                    _max_gas: uint256,
                    _gas_price_bid: uint256,
                    _data: Bytes[128],  # _max_submission_cost, _extra_data
                ): payable

            CRV20: constant(address) = 0xD533a949740bb3306d119CC777fa900bA034cd52
            GATEWAY: constant(address) = 0xa3A7B6F88361F48403514059F1F16C8E78d60EeC
            GATEWAY_ROUTER: constant(address) = 0x72Ce9c846789fdB6fC1f34aC4AD25Dd9ef7031ef
            INBOX: constant(address) = 0x4Dbd4fc535Ac27206064B68FfCf827b0A60BAB3f

            # [gas_limit uint64][gas_price uint64][max_submission_cost uint64]
            submission_data: uint256
            is_approved: public(HashMap[address, bool])

            @payable
            @external
            def bridge(_token: address, _to: address, _amount: uint256):
                """
                @notice Bridge an ERC20 token using the Arbitrum standard bridge
                @param _token The address of the token to bridge
                @param _to The address to deposit token to on L2
                @param _amount The amount of `_token` to deposit
                """
                assert ERC20(_token).transferFrom(msg.sender, self, _amount)

                if _token != CRV20 and not self.is_approved[_token]:
                    assert ERC20(_token).approve(GatewayRouter(GATEWAY_ROUTER).getGateway(_token), MAX_UINT256)
                    self.is_approved[_token] = True

                data: uint256 = self.submission_data
                gas_limit: uint256 = shift(data, -128)
                gas_price: uint256 = shift(data, -64) % 2 ** 64
                max_submission_cost: uint256 = data % 2 ** 64

                # NOTE: Excess ETH fee is refunded to this bridger's address on L2.
                # After bridging, the token should arrive on Arbitrum within 10 minutes. If it
                # does not, the L2 transaction may have failed due to an insufficient amount
                # within `max_submission_cost + (gas_limit * gas_price)`
                # In this case, the transaction can be manually broadcasted on Arbitrum by calling
                # `ArbRetryableTicket(0x000000000000000000000000000000000000006e).redeem(redemption-TxID)`
                # The calldata for this manual transaction is easily obtained by finding the reverted
                # transaction in the tx history for 0x000000000000000000000000000000000000006e on Arbiscan.
                # https://developer.offchainlabs.com/docs/l1_l2_messages#retryable-transaction-lifecycle
                GatewayRouter(GATEWAY_ROUTER).outboundTransfer(
                    _token,
                    _to,
                    _amount,
                    gas_limit,
                    gas_price,
                    _abi_encode(max_submission_cost, b""),
                    value=gas_limit * gas_price + max_submission_cost
                )
            ```

    === "Example"

        This example bridges 10,000 `CRV` to the address `0x1234567890123456789012345678901234567890` on Arbitrum.

        ```py
        >>> Bridger.bridge('0xD533a949740bb3306d119CC777fa900bA034cd52', '0x1234567890123456789012345678901234567890', 10000000000000000000000)
        ```

### `check`
!!! description "`Bridger.check(_account: address) -> bool: view`"

    Function to check if the bridger contract has been approved by the `RootGauge`.

    Returns: `True` if the bridger has been approved by the `RootGauge`, `False` otherwise (`bool`).

    | Parameter | Type | Description |
    | --------- | ---- | ------------ |
    | `_account` | `address` | The address of the bridger contract to check. |

    ??? quote "Source code"

        This source code might vary slightly between different bridger implementations. This example is specific to the `Bridger` contract for Arbitrum.

        === "ArbitrumBridger.vy"

            ```python
            @pure
            @external
            def check(_account: address) -> bool:
                """
                @notice Verify if `_account` is allowed to bridge using `transmit_emissions`
                @param _account The account calling `transmit_emissions`
                """
                return True
            ```

    === "Example"

        ```py
        >>> Bridger.check('0x1234567890123456789012345678901234567890')
        True
        ```
