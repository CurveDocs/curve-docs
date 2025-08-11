We use [`uv`](https://docs.astral.sh/uv/getting-started/installation/) as our package manager.

`uv` saves its dependencies in the `pyproject.toml` file, we **do not** use `requirements.txt` files.

We differentiate between `dev-dependencies` and `dependencies`. 

- `dependencies` are needed to compile the code (i.e. vyper, snekmate and other vyper libraries). 
- `dev-dependencies` are only needed for development purposes (i.e. testing, linting, formatting).

Note that compilation `dependencies` is compliant with [PEP-621](https://peps.python.org/pep-0621/#dependencies-optional-dependencies). And hence can be installed by pip for users that want to use our code as a dependency without using uv. However `dev-dependencies` are `uv` specific.

Example `pyproject.toml` compilation dependencies:
```toml
[project]
dependencies = [
    "vyper==0.4.1",
    "snekmate==0.1.0",
]
```

Compilation dependecies version should **ALWAYS** be pinned to a specific version. This allows us to fix the dependencies to an audited version.

Example `pyproject.toml` development dependencies:
```toml
[tool.uv]
dev-dependencies = [
    "pytest-xdist==3.6.1",
    "pytest==8.2.2",
    "hypothesis==6.124.2",
]
```

Note that `dev-dependencies` might not be installed by default when using `uv sync`, but can be switched on using the `--extra=dev` flag.

It is recommended to pin testing dependencies to a specific version, although it's not required.

#

