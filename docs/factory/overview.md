<h1>Pool Factory Overview</h1>

A Pool Factory enables the permissionless deployment of liquidity pools, gauges, and LP tokens.

!!!deploy "Contract Source & Deployment"
    Factories are deployed on the Ethereum Mainnet, as well as on sidechains and Layer-2 networks. Note that some pool types may not yet be supported on these networks. A comprehensive list of all deployed contracts is available [here](../deployments/amm.md).
    The source code for each specific Factory contract can be found on GitHub in the respective section.


Each Factory contract includes **built-in functions designed to populate the [MetaRegistry](../registry/MetaRegistryAPI.md)** with details about the created pools. These functions are not documented in this section. For more information, please refer to the [MetaRegistry documentation](../registry/overview.md).


*Note: The methods described below may vary slightly depending on the specific Factory contract. Any anomalies or noteworthy features will be detailed as accurately as possible in the relevant section.*


---


## **Available Factories**

Curve Factories facilitate the deployment of pools containing almost any combination of assets, whether they are stable or volatile, rebasing or not. Note that some variations (e.g., Cryptoswap pool) might not yet be supported on sidechains or Layer 2 networks.

*For a straightforward, non-technical explanation of pool variations, visit: https://resources.curve.finance/pools/overview/*

<div class="grid cards" markdown>

-   **Stableswap-NG**

    ---

    Factory for deploying new-generation plain- and metapools for pegged assets (e.g., `crvUSD <> USDC`).

    [:octicons-arrow-right-24: `CurveStableswapFactoryNG.vy`](./stableswap-ng/overview.md)

-   **Twocrypto-NG**

    ---

    Factory for deploying two-coin volatile asset pools (e.g., `CRV <> ETH`).

    [:octicons-arrow-right-24: `CurveTwocryptoFactory.vy`](./twocrypto-ng/overview.md)

-   **Tricrypto-NG**
    ---

    Factory for deploying three-coin volatile asset pools (e.g., `crvUSD <> ETH <> BTC`).

    [:octicons-arrow-right-24: `CurveTricryptoFactory.vy`](./tricrypto-ng/overview.md)

-   **Other Pool Factories**

    ---

    Factories for older Stableswap, Twocrypto, or Tricrypto pools.

    [:octicons-arrow-right-24: `soon`](#)

</div>


---


## **Implementations**

Liquidity pools, gauges, and LP token contracts are created based on their respective implementation contracts within the Factory. Newer implementations (NG pools) integrate both the liquidity pool and LP token, while older implementations require separate contracts.

!!!warning "Upgradable Implementations"
    **Implementation contracts are upgradable.** They can be replaced or supplemented with additional implementation contracts. Due to this, always ensure to check the most recent versions when working with these contracts.

*There are two main methods for deploying contracts:*

- **`create_forwarder_to`**

    Traditional Factories such as the regular [Stableswap](./stableswap/deployer-api.md) or [Cryptoswap](./cryptoswap/deployer-api.md) utilize Vyper's [`create_forwarder_to`](https://docs.vyperlang.org/en/stable/built-in-functions.html?highlight=create_forwarder_to#chain-interaction) function (renamed to `create_minimal_proxy_to` in Vyper version 0.3.4) to deploy liquidity pools, LP tokens, and gauges.

- **`Blueprint Contracts`**

    Newer factories utilize blueprint contracts as outlined in [EIP-5202](https://eips.ethereum.org/EIPS/eip-5202). The corresponding contracts are directly created from their blueprint implementations, which has become the preferred method for all newly deployed factories.


---


## **Fee Receiver**

Users interacting with liquidity pools, such as for exchanging tokens, are required to pay fees. Each factory contains a universal `fee_receiver` variable, where all fees from pools deployed through that factory are collected. This address can usually be changed by the `owner` of the factory via a `set_fee_receiver` function, which is typically the Curve DAO. Therefore, to change the fee receiver address, an approved on-chain vote must pass.


### `fee_receiver`
!!! description "`PoolFactory.fee_receiver() -> address: view`"

    Getter for the address where the accrued admin fees are collected.

    Returns: fee receiver (`address`).

    ??? quote "Source code"

        ```vyper
        # fee receiver for all pools
        fee_receiver: public(address)
        ```

    === "Example"

        ```shell
        >>> PoolFactory.fee_receiver()
        '0xa2Bcd1a4Efbd04B63cd03f5aFf2561106ebCCE00'
        ```


### `set_fee_receiver`
!!! description "`PoolFactory.set_fee_receiver(_fee_receiver: address)`"

    !!!guard "Guarded Method"
        This function is only callable by the `admin` of the contract.

    Function to set a new fee receiver address.

    | Input           | Type      | Description |
    | --------------- | --------- | ----------- |
    | `_fee_receiver` | `address` | Address set as the new fee receiver. |

    ??? quote "Source code"

        ```vyper
        # fee receiver for all pools:
        fee_receiver: public(address)

        @external
        def set_fee_receiver(_fee_receiver: address):
            """
            @notice Set fee receiver
            @param _fee_receiver Address that fees are sent to
            """
            assert msg.sender == self.admin, "dev: admin only"

            log UpdateFeeReceiver(self.fee_receiver, _fee_receiver)
            self.fee_receiver = _fee_receiver
        ```


---


## **Contract Ownership**

Each Factory is controlled by an `admin`, which is typically set to the DAO; thus, any changes to the contract require approval by the Curve DAO.

The contracts utilize the classic two-step ownership model found within Curve contracts. Ownership can be transferred by first committing to the transfer of ownership via `commit_transfer_ownership`. This transfer must then be accepted by the `future_admin` through the `accept_transfer_ownership` function.

Some Factory contracts are indirectly owned by the DAO through a proxy contract.


### `admin`
!!! description "`PoolFactory.admin() -> address: view`"

    Getter for the current admin of the Factory.

    Returns: admin (`address`).

    ??? quote "Source code"

        ```vyper
        admin: public(address)
        ```

    === "Example"

        ```shell
        >>> Factory.admin()
        '0x40907540d8a6C65c637785e8f8B742ae6b0b9968'
        ```


### `future_admin`
!!! description "`PoolFactory.future_admin() -> address: view`"

    Getter for the future admin of the Factory.

    Returns: future admin (`address`).

    ??? quote "Source code"

        ```vyper
        future_admin: public(address)
        ```

    === "Example"

        ```shell
        >>> PoolFactory.future_admin()
        '0x0000000000000000000000000000000000000000'
        ```


### `commit_transfer_ownership`
!!! description "`PoolFactory.commit_transfer_ownership(_addr: address)`"

    !!!guard "Guarded Method"
        This function is only callable by the `admin` of the contract.

    This function commits a transfer of ownership by setting `_addr` as the `future_admin` of the contract. These changes must then be applied by the `future_admin` itself through the `accept_transfer_ownership` function.

    | Input    | Type      | Description                         |
    | -------- | --------- | ----------------------------------- |
    | `_addr`  | `address` | Address to transfer ownership to.   |

    ??? quote "Source code"

        ```vyper
        admin: public(address)
        future_admin: public(address)

        @external
        def commit_transfer_ownership(_addr: address):
            """
            @notice Transfer ownership of this contract to `addr`
            @param _addr Address of the new owner
            """
            assert msg.sender == self.admin, "dev: admin only"

            self.future_admin = _addr
        ```


### `accept_transfer_ownership`
!!! description "`PoolFactory.accept_transfer_ownership():`"

    !!!guard "Guarded Method"
        This function is only callable by the `future_admin` of the contract.

    Function to accept the ownership transfer.

    Emits: `TransferOwnership`

    ??? quote "Source code"

        ```vyper
        event TransferOwnership:
            _old_owner: address
            _new_owner: address

        admin: public(address)
        future_admin: public(address)

        @external
        def accept_transfer_ownership():
            """
            @notice Accept a pending ownership transfer
            @dev Only callable by the new owner
            """
            assert msg.sender == self.future_admin, "dev: future admin only"

            log TransferOwnership(self.admin, msg.sender)
            self.admin = msg.sender
        ```
