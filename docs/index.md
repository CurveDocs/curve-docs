<h1> </h1>

# **Protocol Overview**

[**Curve**](https://www.curve.fi) is an exchange liquidity pool on Ethereum. Curve is designed for extremely efficient stablecoin trading and low risk, supplemental fee income for liquidity providers, without an opportunity cost.

This documentation outlines the technical implementation of the core Curve protocol and related smart contracts. It may be useful for contributors to the Curve codebase, third party integrators or technically proficient users of the protocol.

Non-technical users may prefer the [Resources](https://resources.curve.fi/) site.



**Curve can be broadly separated into the following categories:**

- **The DAO:** Protocol governance and value accrual
- **StableSwap:** Exchange contracts for stable assets
- **CryptoSwap:** Exchange contracts for volatile assets
- **Curve Stablecoin (crvUSD):** Stablecoin using LLAMMA (lending-liquidating amm algorithm) 
- **The Registry:** Standardized API and on-chain resources to aid 3rd party integrations


!!! info "APE"
    This project relies heavily upon ``ape`` and the documentation assumes a basic familiarity with it. You may wish to view the [Ape documentation](https://docs.apeworx.io/ape/stable/index.html) if you have not used it previously.
