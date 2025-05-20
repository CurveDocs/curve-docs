<h1>Curve-DAO Package</h1>

The `curve-dao` package is a Python tool designed to interact with CurveDAO governance, allowing users to simulate and publish on-chain proposals for DAO voting.

!!!github "GitHub"
    Source code of the `curve-dao` package can be found on [:material-github: GitHub](https://github.com/bout3fiddy/curve-dao). Contributions to develop this package are more than welcome!

---

## Overview

This package simplifies the process of creating and testing CurveDAO proposals, making it easier for veCRV holders to participate in governance actions such as:

- Managing Curve DAO gauges (creation, modification, or removal)
- Whitelisting smartwallets for veCRV locking
- Adjusting liquidity pool parameters
- Adding new gauge types
- Other DAO-governed protocol changes
- etc

---

## Installation & Basic Usage

Install the package using `pip`:

```bash
pip install curve-dao
```

---

Here's a simple example of creating and simulating a DAO proposal:

```python
import boa
import curve_dao

# Load contract and set admins
contract = boa.load("contracts/contract.vy",
    curve_dao.get_address("ownership"),
    curve_dao.get_address("param"),
    curve_dao.get_address("emergency")
)

# Define proposal actions
ACTIONS = [
    ("0xcontract", "set_something", ("values",), 70, "set"),
    (contract, "enact")
]

# Create and optionally simulate the proposal
DESCRIPTION = "Enact something"
vote_id = curve_dao.create_vote(
    "ownership",
    ACTIONS,
    DESCRIPTION,
    etherscan_api_key=os.environ["ETHERSCAN_API_KEY"],
    pinata_token=os.environ["PINATA_TOKEN"]
)

# Simulate in forked environment
if is_simulation:
    curve_dao.simulate(
        vote_id,
        "ownership",
        etherscan_api_key=os.environ["ETHERSCAN_API_KEY"]
    )
```
