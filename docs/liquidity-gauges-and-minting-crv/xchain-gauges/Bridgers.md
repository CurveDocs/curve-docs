<h1>Bridger Wrappers</h1>

Bridger wrappers are contracts used to transmit CRV emissions across chains. Due to the increasing number of networks Curve deploys to, bridge wrappers adhere to a specific interface and allow for a modular bridging system.


???+ vyper "Bridgers.vy" 
    The source code for the various `Bridger Wrappers` contracts can be found on [:material-github: GitHub](https://github.com/curvefi/curve-xchain-factory/tree/master/contracts/bridgers). The source code for different bridger contracts varies slightly to adapt to different chain-specific implementations.


Bridgers for each specific chain can be fetched from the `RootGaugeFactory` contract the following way:

```vyper
>>> RootGaugeFactory.get_bridger(43114)
0x46832Ee3AD01558CEA49738e816c33d5bC9f6E04      # LzXdaoBridger for Avalanche
```


The following three functions are required for bridge wrappers contracts to be implemented to ensure compatibility with the `RootGaugeFactory` and `RootGauge` contracts.

- `cost()` estimates the cost of bridging.
- `bridge()` bridges CRV to the child chain.
- `check()` verifies if the bridger has been approved by the RootGauge.


---

!!!warning "Chain Specific Implementations"
    The following function examples are for the :logos-arbitrum: Arbitrum bridger. Due to the varying implementations across different chains, the source code might vary slightly between different bridger implementations.


### `cost`
!!! description "`Bridger.cost() -> uint256: view`"

    Function to estimate the cost of bridging.

    Returns: the cost of bridging in ETH (`uint256`).

    ??? quote "Source code"

        This source code might vary slightly between different bridger implementations. This example is specific to the Arbitrum bridger.

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

        ```py
        >>> Bridger.cost()
        2000000000000000
        ```


### `bridge`
!!! description "`Bridger.bridge(_token: address, _to: address, _amount: uint256)`"

    Function to bridge CRV to the child chain.

    | Parameter | Type | Description |
    | --------- | ---- | ------------ |
    | `_token` | `address` | The address of the token to bridge. |
    | `_to` | `address` | The address to transmit the emissions to. |
    | `_amount` | `uint256` | The amount of CRV emissions to bridge. |

    ??? quote "Source code"

        This source code might vary slightly between different bridger implementations. This example is specific to the Arbitrum bridger.

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

        ```py
        >>> Bridger.bridge(CRV20, child_gauge, 1000000000000000000)
        ```


### `check`
!!! description "`Bridger.check(_account: address) -> bool: view`"

    Function to check if the bridger has been approved by the `RootGauge`.

    ??? quote "Source code"

        This source code might vary slightly between different bridger implementations. This example is specific to the Arbitrum bridger.

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
        >>> Bridger.check(child_gauge)
        True
        ```