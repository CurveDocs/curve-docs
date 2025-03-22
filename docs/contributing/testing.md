Our testing stack is based on Python and the following tools:
- `pytest` as a test runner
- `xdist` for parallel test execution
- `titanoboa` for testing vyper contracts
- `hypothesis` for fuzzing or stateful testing


# Test Directory Structure

```
tests/
├── unitary/
├── fork/
├── fuzzing/
├── stateful/
├── utils/
├── conftest.py
```

## `utils` directory

This directory contains:
- `strategies.py` to be used as strategies for `hypothesis` both in `fuzzing` and `stateful` tests.
- `deployers.py` to be used as a way to access vyper source code and deploy contracts.
- `constants.py` to be used as a way to access constants in the contracts.

### `strategies.py`

This file contains strategies for `hypothesis` both in `fuzzing` and `stateful` tests.

You can read more about strategies in the [hypothesis documentation](https://hypothesis.readthedocs.io/en/latest/data.html#strategies).

They idea is that they work very simliary to `pytest` fixtures, but they randomize the input data for the tests and they support shrinking (the process of reducing the input data to the minimal set of data that still triggers the same failure), very powerful for finding edge cases.

### `deployers.py`

This file contains deployers for the contracts. A deployer is a VyperDeployer object returned using `boa.load_partial("/path/to/contract.vy")`. Centralizing the deployers offers the advantage of easily addressing changes to the contract path or enabling specific compiler flags.

Here's an example of how the file looks like:
```python
import boa

# Easy to change compiler flags from here
compiler_args = {"experimental_codegen": True}

# Easy to change the path from here
BASE_CONTRACT_PATH = "contracts/"
MOCK_CONTRACT_PATH = "tests/mock_contracts/"


POOL_DEPLOYER = boa.load_partial(BASE_CONTRACT_PATH + "Pool.vy", compiler_args=compiler_args)
VIEW_CONTRACT = boa.load_partial(BASE_CONTRACT_PATH + "View.vy", compiler_args=compiler_args)
MOCK_POOL_DEPLOYER = boa.load_partial(MOCK_CONTRACT_PATH + "MockPool.vy", compiler_args=compiler_args)
```

### `constants.py`

This file contains constants for the tests.

If the constant does not come from a smart contract, it should be defined here.

```python
# This is a constant that does not come from a smart contract.
LOW_A_FACTOR = 100
HIGH_A_FACTOR = 1000
```

If it comes from a smart contract, it should be accessed using the deployers in the `deployers.py` file.


Here's an example of how the file looks like:
```python
from deployers import POOL_DEPLOYER

# This helps keeping the tests up to date with contract changes.
N_COINS = POOL_DEPLOYER._constants.N_COINS
```

## Global `conftest.py`

This file contains global settings and fixtures used across all tests.

### Global settings
Hypothesis profiles can be stored here. One example of when this is useful is when you want to skip the shrinking process to have the test fail faster.

```python
TODO example
```

This profile can then be enabled from the cli using the flag `--hypothesis-profile=no-shrink`.
