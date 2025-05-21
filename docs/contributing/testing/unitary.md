# Unitary Testing

Unitary tests rely solely on `pytest` fixtures to test the Vyper source code.

They do not fork the state of the blockchain but only test on an empty chain through `titanoboa`.

## Folder Structure

Each contract should have its own folder inside the `unitary` folder. The naming convention for the folder is to use the `snake_case` version of the contract file name without the `.vy` extension.

i.e. `contracts/Twocrypto.vy` should have its own folder inside `tests/unitary/twocrypto/`.

For each contract method, there should be a corresponding test file:
- The test file should be named `test_<method_name>.py` for external methods.
- The test file should be named `test_internal_<method_name>.py` for internal methods.

For the sake of the example, let's say we have the following contracts to test, layed out as specified in the [contracts folder structure](TODO):

```
contracts/
├── Twocrypto.vy
└── TwocryptoFactory.vy
```

Let's say that the `Twocrypto` contract has the following methods:

```vyper
@external
def swap(amount: uint256):
    assert amount > 0
    self.calc_amount()

@external
def add_liquidity():
    pass

@internal
def calc_amount():
    pass
```

and the `TwocryptoFactory` contract has the following methods:

```vyper
@external
def create_pool():
    pass
```

The test folder should be structured as follows:

```
tests/
├── unitary/
│   ├── twocrypto/
│   │   ├── test_swap.py
│   │   ├── test_add_liquidity.py
│   │   └── test_internal_calc_amount.py
│   ├── twocrypto_factory/
│   │   └── test_create_pool.py
│   └── conftest.py
```

## Test File Structure

Since we have one test file per contract method, we can have multiple test functions per file.

What we usually want to test is:
- The happy path (`default_behavior`), i.e. the normal flow of the function, covering all the possible branches.
- All the edge cases, explicitely checking that we hit the correct revert messages.

Let's continue with our example and write the test file for the `swap` method.

## `unitary/conftest.py` and fixtures

The `conftest.py` file is used to define the fixtures that are used in the test files.

This file should contain only fixtures that are specific to unitary tests (i.e. fixtures that are not used in fork tests). If the fixture is required by both unitary and fork tests it should be definited in `tests/conftest.py`.

Let's add the fixtures that we need for our tests.

```python
from pytest import fixture

from tests.utils.

@fixture
def twocrypto_factory():
```
