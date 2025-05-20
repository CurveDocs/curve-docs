<h1>Ownership in Curve Contracts</h1>

Smart contracts often have owner-guarded functions which only allow specific addresses to call certain functions. These are typically used for administrative operations like modifying liquidity pool parameters, updating fee receivers, or changing critical contract settings.

!!!info "Ownership Agents"

    To make ownership work along with the DAO governance, Curve makes use of `OwnershipAgents` on Ethereum, aswell as on other L1 or L2s to handle governance actions.

    The main `OwnershipAgent` is deployed at [`0x40907540d8a6C65c637785e8f8B742ae6b0b9968`](https://etherscan.io/address/0x40907540d8a6C65c637785e8f8B742ae6b0b9968) on Ethereum. Deployments on other chains can be found [here](../deployments/crosschain.md).

Curve strives to remain as decentralized as possible, with most administrative operations controlled by the DAO. However, there are some exceptions where DAO control may not be optimal:

Contracts like the `AddressProvider` or `MetaRegistry` that:

- Don't hold any user assets
- Only provide on-chain information
- Require frequent maintenance and quick updates

In these specific cases, ownership may be delegated to specialized administrative addresses.

---

# **Ownership Transfer Patterns**

Curve uses different ownership transfer patterns in its contracts. The most common ones are described below.

## `commit + accept`

??? quote "Source code"

    The implementation of the commit + accept pattern might vary slightly. Nontheless, the general idea is the same.

    ```python
    owner: public(address)
    future_owner: public(address)

    event TransferOwnership:
        _old_owner: address
        _new_owner: address

    @external
    def commit_transfer_ownership(_future_owner: address):
        """
        @notice Transfer ownership to `_future_owner`
        @param _future_owner The account to commit as the future owner
        """
        assert msg.sender == self.owner  # dev: only owner

        self.future_owner = _future_owner


    @external
    def accept_transfer_ownership():
        """
        @notice Accept the transfer of ownership
        @dev Only the committed future owner can call this function
        """
        assert msg.sender == self.future_owner  # dev: only future owner

        log TransferOwnership(self.owner, msg.sender)
        self.owner = msg.sender
    ```

The ownership transfer mechanism implements a secure two-step process that prevents accidental or malicious ownership transfers. At its core, the implementation revolves around two state variables: `owner` and `future_owner`, both public addresses that track the current and prospective contract owners respectively.

The transfer process begins when the current owner initiates a transfer by calling `commit_transfer_ownership`. This function takes a single parameter - the address of the intended new owner - and stores it in the `future_owner` state variable. Importantly, this function can only be called by the current owner, enforced through an assertion check at the start of the function.

Once the transfer is committed, the second phase of the transfer can begin. The designated `future_owner` must actively accept the ownership by calling `accept_transfer_ownership`. This function performs its own security check, ensuring that only the committed `future_owner` can call it. Upon successful execution, it updates the `owner` state variable to the new address and emits a `TransferOwnership` event that logs both the old and new owner addresses.

This two-step process provides several security benefits. First, it prevents ownership transfers due to accidental input of wrong addresses, as the intended recipient must actively accept the role. Second, it ensures that the new owner has control of their address and can actually interact with the contract before the transfer is complete. The process also leaves a clear on-chain trail through the emitted event, making ownership transfers transparent and auditable.

!!!colab "Google Colab Notebook"
    A simple Google Colab notebook that simulates the commit + accept pattern can be found here: [:simple-googlecolab: Google Colab Notebook](https://colab.research.google.com/drive/10cEFQbHxuXFyzi7CnmL3tdsXaQ4GxaeJ?usp=sharing).

---

## `commit + apply`

??? quote "Source code"

    The implementation of the commit + apply pattern might vary slightly. Nontheless, the general idea is the same.

    ```python
    event CommitOwnership:
        admin: address

    event ApplyOwnership:
        admin: address

    admin: public(address)
    future_admin: public(address)

    @external
    def commit_transfer_ownership(addr: address):
        """
        @notice Transfer ownership of GaugeController to `addr`
        @param addr Address to have ownership transferred to
        """
        assert msg.sender == self.admin  # dev: admin only
        self.future_admin = addr
        log CommitOwnership(addr)


    @external
    def apply_transfer_ownership():
        """
        @notice Apply pending ownership transfer
        """
        assert msg.sender == self.admin  # dev: admin only
        _admin: address = self.future_admin
        assert _admin != ZERO_ADDRESS  # dev: admin not set
        self.admin = _admin
        log ApplyOwnership(_admin)
    ```

This implementation presents another variation of the two-step ownership transfer pattern, commonly used in Curve's contracts, particularly in the GaugeController. Instead of requiring the future owner to accept the transfer, this pattern allows the current admin to both initiate and complete the transfer process.

The mechanism uses two state variables: `admin` (instead of owner) and `future_admin`, following the same principle of separating the current and prospective contract administrators. The process is tracked through two distinct events: `CommitOwnership` and `ApplyOwnership`, providing clear on-chain visibility of the transfer stages.

The transfer process begins with the current admin calling `commit_transfer_ownership`, specifying the address of the intended new administrator. This function sets the `future_admin` state variable and emits a `CommitOwnership` event. Unlike the accept pattern, this function includes a crucial security check ensuring that only the current admin can initiate the transfer.

The second phase involves calling `apply_transfer_ownership`, which finalizes the transfer. This function includes several important security features:
- Only the current admin can execute the transfer
- The function verifies that `future_admin` is not set to the zero address
- Upon successful execution, it updates the `admin` state and emits an `ApplyOwnership` event

This implementation differs from the accept pattern in a key aspect: the current admin maintains full control throughout the entire process, rather than requiring action from the future admin. While this provides more flexibility for the current admin, it also means extra care must be taken to ensure the new admin address is correct and capable of managing the contract.

The zero-address check in the apply function serves as an additional safety mechanism, preventing transfers to invalid addresses that could permanently lock the contract's administrative functions.

!!!colab "Google Colab Notebook"
    A simple Google Colab notebook that simulates the commit + apply pattern can be found here: [:simple-googlecolab: Google Colab Notebook](https://colab.research.google.com/drive/1KV25arJ-P4UrscHOx8wjdCaD9H4a9tHx?usp=sharing).

---

## `snekmate`

> *sneks coming soon* 🐍🐍🐍
