Our testing stack is based on Python and the following tools:
- `pytest` as a test runner
- `xdist` for parallel test execution
- `titanoboa` for testing vyper contracts
- `hypothesis` for fuzzing or stateful testing

Make sure you familiarize yourself with the tools and the concepts before contributing to the testing suite.
Hypothesis in particular is very powerful but it can be tricky and if not used correctly can end up not testing anything at all (while having all the tests passing). See the [hypothesis](./hypothesis.md) section to learn more.


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

The reasonsing behind a strict structure for testing is to make it easier to locate tests, add new tests, maintain them without having to learn the whole codebase.
