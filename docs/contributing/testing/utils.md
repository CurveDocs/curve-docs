# `utils` Directory

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

### `god_mode.py`

God Mode is just a wrapper class that can be used to test a contract while minimizing the amount of boilerplate code.

#### Understanding the problem

Let's say we want to test a liquidity pool implementation. 

A common pattern when testing is creating a new user, giving them some amount of tokens so that it can interact with the pool. The problem is that often these users have generic names like `alice` or `bob`, `big_depositor` or `small_depositor` or even worse `user_1`, `user_2`, `user_3`. Often these users are shared across multiple tests and it becomes a pain to keep track of them, who has what amount of tokens, who is allowed to do what, etc. On top of this the ERC20 token standard adds some extra overhead because we need to manage approvals for each user.

#### The solution

```python
class GodMode
```


## Global `conftest.py`

This file contains global settings and fixtures used across all tests.

### Global settings
Hypothesis profiles can be stored here. One example of when this is useful is when you want to skip the shrinking process to have the test fail faster.

```python
TODO example
```

This profile can then be enabled from the cli using the flag `--hypothesis-profile=no-shrink`.

Furthermore this section can contain global fixtures that are shared across unitary and fork tests.

## FAQ
- Why does this folder not contain a `fixtures.py` file to store global fixtures? 

    If we were to create a `fixtures.py` file, it would quickly become unwieldy as the number of fixtures grows.autocomplet However some IDEs like PyCharm do not support this and will not be able to resolve the fixtures.conftest.py file`` anyways by adding `pytest_plugins = ["tests.utils.fixtures"]` in the `conftest.py` fileneed to connect this towe