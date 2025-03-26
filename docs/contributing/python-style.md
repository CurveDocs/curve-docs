# Python Style

We use [`ruff`](https://docs.astral.sh/ruff/) to check our Python code style, this tool has to be configured to match our style guidelines, available in [this repo](TODO).

[`ruff`](https://docs.astral.sh/ruff/) is a modern alternative to `flake8` and `black`, achieving feature parity with both tools. It can be used as a drop-in replacement in older repos where `flake8` and `black` are still in use.

## Import style and ordering

- Prefer absolute imports over relative imports. (i.e. `from tests.utils.constants import N_COINS` instead of `from ..utils.constants import N_COINS`)
- Do not use wildcard imports (i.e. `from typing import *`).
- Rely on `ruff` ordering for imports.


