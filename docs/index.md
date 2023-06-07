[Curve](https://www.curve.fi) is an exchange liquidity pool on Ethereum. Curve is designed for extremely 
efficient stablecoin trading and low risk, supplemental fee income for liquidity providers, without an 
opportunity cost.

This documentation outlines the technical implementation of the core Curve protocol and related smart contracts. 
It may be useful for contributors to the Curve codebase, third party integrators or technically proficient users 
of the protocol.

Non-technical users may prefer the [Resources](https://resources.curve.fi/) site.

!!! note

    All code starting with ``$`` is meant to be run on your terminal. Code starting with ``>>>`` is meant to run 
    inside the Brownie console.

!!! note
    
    This project relies heavily upon ``brownie`` and the documentation assumes a basic familiarity with it. You may 
    wish to view the [Brownie documentation](https://eth-brownie.readthedocs.io/en/stable/>) if you have not used 
    it previously.


# Protocol Overview

Curve can be broadly separated into the following categories:

1. StableSwap: Exchange contracts for stable assets
2. CryptoSwap: Exchange contracts for volatile assets
3. LLAMMA: 
4. The DAO: Protocol governance and value accrual
5. The Registry: Standardized API and on-chain resources to aid 3rd party integrations
