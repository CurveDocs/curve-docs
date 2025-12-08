<h1>Curve Voting Library</h1>

The `curve-voting-lib` package is a Python toolkit designed to interact with CurveDAO governance, allowing users to simulate and publish on-chain proposals for DAO voting.

!!!github "GitHub"
    Source code of the `curve-voting-lib` package can be found on [:material-github: GitHub](https://github.com/curvefi/curve-voting-lib).

---

## Overview

This package simplifies the process of creating and testing CurveDAO proposals, making it easier for veCRV holders to participate in governance actions.

The package uses:

- **Context Manager Voting:** Use the `vote()` context manager to automatically capture contract interactions within a defined scope
- **Simulation & Live Voting:** Fork mainnet for testing or create actual governance proposals
- **IPFS Integration:** Automatic vote description pinning via Pinata

---

## Installation

The package uses `uv` for dependency management. Clone the repository and install:

```bash
git clone https://github.com/curvefi/curve-voting-lib
cd curve-voting-lib
uv sync
uv run python -m pip install -e .
```

---

## Configuration

Set the following environment variables:

```bash
RPC_URL=your_rpc_url
PINATA_JWT=your_pinata_jwt_token
```

---

## How It Works

### Titanoboa

The package uses **Titanoboa** (imported as `boa`), a Python framework for Vyper smart contract development and testing. Titanoboa provides:

- **Mainnet Forking:** Test contracts against real mainnet state without deploying
- **Automatic Context Management:** Network environments are properly configured and reverted
- **Pretty Tracebacks:** Enhanced debugging capabilities for Vyper contracts
- **Direct Contract Interaction:** Load and interact with contracts using their addresses or ABIs

### Context Manager

The `vote()` context manager automatically captures all contract interactions within its scope. This design pattern:

- **Records Actions:** All contract method calls are automatically recorded as proposal actions
- **Ensures Atomicity:** All interactions are grouped together as a single governance proposal
- **Simplifies Code:** No need to manually construct action arrays or encode calldata

When you exit the context manager, the captured interactions are automatically formatted into a valid CurveDAO proposal.

---

## Usage

### Basic Example

Here's a simple example of creating a DAO proposal using the context manager:

```python
import os
import boa
from voting import vote, abi, OWNERSHIP
from eth_utils import keccak

RPC_URL = os.getenv("RPC_URL")
boa.fork(RPC_URL)

# Load a contract using its ABI
factory = abi.twocrypto_ng_mainnet_factory.at("0x98EE851a00abeE0d95D08cF4CA2BdCE32aeaAF7F")

# Use the vote() context manager to capture interactions
with vote(
    OWNERSHIP,
    "[twocrypto] Add implementations for donations-enabled pools (yb, fx, etc)",
):
    # All contract calls within this block are captured as proposal actions
    factory.set_pool_implementation(
        donations_pool:="0xbab4CA419DF4e9ED96435823990C64deAD976a9F",
        donations_hash:=int.from_bytes(keccak(b'donations'), 'big')
    )
    
    # You can add assertions to verify the proposal will work
    assert factory.pool_implementations(donations_hash) == donations_pool
```

### Live Environment Options

The `vote()` context manager accepts an optional `live` parameter that determines how the proposal is executed. There are three options:

#### 1. Simulation Mode

When `live` is `None` or omitted, the vote is simulated in a forked environment:

```python
import boa
from voting import vote, OWNERSHIP

RPC_URL = os.getenv("RPC_URL")
boa.fork(RPC_URL)  # Fork mainnet for testing

# No live parameter = simulation mode
with vote(OWNERSHIP, "Test proposal description"):
    # Your contract interactions here
    # This will only simulate, not create a real proposal
    pass
```

This mode is ideal for testing and verifying proposal logic before creating an actual on-chain vote.

#### 2. Browser Environment

Use `BrowserEnv()` to connect to a browser wallet (like MetaMask or Rabby). This is the recommended option when running scripts in Google Colab:

```python
from voting import vote, OWNERSHIP, BrowserEnv

with vote(
    OWNERSHIP,
    "Live proposal description",
    live=BrowserEnv(),  # Connects to browser wallet
):
    # Your contract interactions here
    # This will create an actual on-chain proposal
    pass
```

The `BrowserEnv()` enables connection to browser wallets for creating real proposals on-chain. This is particularly useful in Google Colab environments where you can connect your wallet through the browser.

!!!colab "Google Colab Example"
    For a complete working example using `BrowserEnv()` in Google Colab, see this [example notebook](https://colab.research.google.com/drive/1KXVf-hBq8je50rnCSB7XV9Of7FDHWYQ4?usp=sharing).

#### 3. Custom Environment

Use `CustomEnv` to specify a custom RPC URL and Ethereum account:

```python
from voting import vote, OWNERSHIP, CustomEnv
from eth_account import Account

# Set up custom environment with RPC URL and account
account = Account.from_key("your_private_key")
custom_env = CustomEnv(
    rpc_url="https://eth-mainnet.g.alchemy.com/v2/your-api-key",
    account=account
)

with vote(
    OWNERSHIP,
    "Live proposal description",
    live=custom_env,
):
    # Your contract interactions here
    # This will create an actual on-chain proposal
    pass
```

This option gives you full control over the RPC endpoint and account used for creating proposals.
