- Use sender=... when boa.env.prank() context manager only encapsulates one line tha actually requires a prank

```vyper
with boa.env.prank(admin):
    amounts += 100
    contract.increase_amount(amounts)
```

can become

```vyper
amounts += 100
contract.increase_amounts(amounts, sender=admin)
```

as a rule of thumb it's always a good idea to remove logic that doesn't need to be in the prank context.

---

Don't rely on fixture with generic names like alice bob charlie etc. Especially when these fixtures are defined inside a conftest and not at the scope of the test file they can lead to confusion. How am I supposed to remember than in the tests for `foo` alice gets preminted 100 tokens while bob doesn't have admin right?

For access control always make fixtures for addresses that are global to the protocol (e.g. admin, treasury, manager, etc.).
For testing purposes (preminted amounts, etc.) just boa.deal the token that is specific to the test. If multiple tests need the same preminted amounts, then create a fixture specific to that test file.
