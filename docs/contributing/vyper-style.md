# Vyper Code Style
When writing Vyper code we follow these conventions:

## Compiler Version
We use `vyper==0.4.x` as our compiler version, where `x` is any valid patch version. Old repos should be updated to the latest version when possible.

Always declare the version explicitly because not doing so will lead to using compiler version is available in the virtual environment leading to unexpected behavior changes.

Use `pragma version x.y.z` to specify which which version to use, do not use `@version x.y.z` as this is not consistent with other `pragma` directive we might use.

Always pin a specific version of the compiler, do not use ranges (i.e. `>=0.4.0`).


## Naming Conventions

### Storage Variables

- Storage variables should be named in `snake_case`.

### Import Conventions

#### Module Imports
- Import modules using `as` keyword to convert names to `snake_case` if necessary
  ```vyper
  # Example:
  # ownable is already in snake_case
  from snekmate.auth import ownable 

  # multiclaim_controller is not in snake_case
  from contracts import MulticlaimController as multiclaim_controller

#### Interface Imports
- Import interfaces directly without aliases
  ```vyper
  # Example:
  from ethereum.ercs import IERC20
  from contracts.interfaces import IFactoryController
  ```

### Code Organization

#### Module Ordering
1. Interfaces
   - ERC standards
   - User-defined interfaces
2. Modules
   - Library modules
   - User-defined modules

```vyper
# Example:
from ethereum.ercs import IERC20, IERC165
from snekmate.auth import ownable
import ControllerMulticlaim as multiclaim

#### Interface Declaration Order
1. ERC standard interfaces
2. User-defined interfaces

#### Module Usage Pattern
1. Import module declarations
   ```vyper
   # Example:
   import ControllerMulticlaim as multiclaim
   ```
2. Module initialization/usage
   ```vyper
   # Example:
   initializes: multiclaim
   ```
3. Explicit method exports
   ```vyper
   # Example:
   exports: (
       multiclaim.update_controllers,
       multiclaim.n_controllers,
       multiclaim.allowed_controllers,
       multiclaim.controllers
   )
   ```

### Error Handling
- Always prefer on-chain errors
  ```vyper
  # Example:
  assert owner != address, "null owner"
  ```
- Dev reasons should only be used when contract size limits are the problem, but always avoided when [EIP-170](https://eips.ethereum.org/EIPS/eip-170) is not an issue.
  ```vyper
  # Example:
  assert owner != address # dev: null owner
  ```
  Although boa is compatible with dev reasons, often integrators will not be able to use them as other tooling may not support them (i.e. Foundry). This increases the workload on the Curve Team to help them debug issues.