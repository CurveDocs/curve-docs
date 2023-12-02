[//]: # (# Curve StableSwap: Pools)

A Curve pool is a smart contract that implements the StableSwap invariant and thereby allows for the exchange of two or more tokens.

More broadly, Curve pools can be split into three categories:

1. ``Plain Pools``: A pool where two or more stablecoins are paired against each other.
2. ``Lending Pools``: A pool where two or more _wrapped_ tokens (e.g. ``cDAI``) are paired against one another, while the underlying is lent out on some other protocol.
3. ``Metapools``: A pool where a stablecoin is paired against the LP token from another pool.

Source code for Curve pools may be viewed on [GitHub](https://github.com/curvefi/curve-contract/tree/master/contracts).

!!! warning

    The API for plain, lending and metapools applies to all pools that are implemented based on [pool templates](https://github.com/curvefi/curve-contract/tree/master/contracts/pool-templates). When interacting with older Curve pools, there may be differences in terms of visibility, gas efficiency and/or variable naming. Furthermore, note that older contracts use ``vyper 0.1.x...`` and that the getters generated for public arrays changed between ``0.1.x`` and ``0.2.x`` to accept ``uint256`` instead of ``int128`` in order to handle the lookups.

    Please **do not** assume for a Curve pool to implement the API outlined in this section but verify this before interacting with a pool contract.

For information on code style please refer to the official [style guide](https://vyper.readthedocs.io/en/stable/style-guide.html).







