In exchange for depositing coins into a Curve pool, liquidity providers receive pool LP (liquidity pool) tokens.
A Curve pool LP token is an ERC20 contract specific to the Curve pool. Hence, LP tokens are transferrable.
Holders of pool LP tokens may deposit and stake the token into a pool’s liquidity gauge in order to receive ``CRV`` token rewards.
Alternatively, if the LP token is supported by a metapool, the token may be deposited into the respective metapool
in exchange for the metapool’s LP token (see here).

Currently, the following versions of Curve Stableswap LP tokens exist:

- [CurveTokenV1](https://github.com/curvefi/curve-contract/blob/master/contracts/tokens/CurveTokenV1.vy): LP token targetting Vyper [^0.1.0-beta.16](https://vyper.readthedocs.io/en/stable/release-notes.html#v0-1-0-beta-16)
- [CurveTokenV2](https://github.com/curvefi/curve-contract/blob/master/contracts/tokens/CurveTokenV2.vy): LP token targetting Vyper [^0.2.0](https://vyper.readthedocs.io/en/stable/release-notes.html#v0-2-1)
- [CurveTokenV3](https://github.com/curvefi/curve-contract/blob/master/contracts/tokens/CurveTokenV3.vy): LP token targetting Vyper [^0.2.0](https://vyper.readthedocs.io/en/stable/release-notes.html#v0-2-1)

todo: add hyperlink to deployment addresses

The version of each pool’s LP token can be found in the Deployment Addresses.

!!! note

    For older Curve pools the ``token`` attribute is not always ``public`` and a getter has not been explicitly implemented.
