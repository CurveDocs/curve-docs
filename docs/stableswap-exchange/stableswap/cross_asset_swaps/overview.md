Curve integrates with Synthetix to allow large scale swaps between different asset classes with minimal 
slippage. Utilizing Synthetix’ zero-slippage synth conversions and Curve’s deep liquidity and low fees, 
we can perform fully on-chain cross asset swaps at scale with a 0.38% fee and minimal slippage.

Cross asset swaps are performed using the `SynthSwap` contract, deployed to the mainnet at
[0x58A3c68e2D3aAf316239c003779F71aCb870Ee47](https://etherscan.io/address/0x58A3c68e2D3aAf316239c003779F71aCb870Ee47).

Source code and information on the technical implementation are available on 
[Github](https://github.com/curvefi/curve-cross-asset-swaps).

## How `SynthSwap` works

As an example, suppose we have asset `A` and wish to exchange it for asset `D`. For this swap to be possible, 
`A` and `D` must meet the following requirements:

- must be of different asset classes (e.g. USD, EUR, BTC, ETH),
- must be exchangeable for a Synthetic asset within one of Curve’s pools (e.g. sUSD, sBTC).

The swap can be visualized as `A -> B -> C | C -> D`:

1. The initial asset `A` is exchanged on Curve for `B`, a synth of the same asset class.
2. `B` is converted to `C`, a synth of the same asset class as `D`.
3. A [settlement period](https://docs.synthetix.io/integrations/settlement/) passes to account for sudden price 
movements between `B` and `C`.
4. Once the [settlement period](https://docs.synthetix.io/integrations/settlement/) has passed, `C` is exchanged on 
Curve for the desired asset `D`.

For a more detailed reasoning behind the settlement period logic, refer to 
[Synthetix SIP-37](https://sips.synthetix.io/sips/sip-37/).

## Settler NFT

Swaps cannot occur atomically due to the Synthetix settlement period. Each unsettled swap is represented by an ERC721 
non-fungible token.

Each NFT has a unique token ID. Token IDs are never re-used. The NFT is minted upon initiating the swap and burned 
when the swap is completed.

The NFT, and associated right to claim, is fully transferable. It is not possible to transfer the rights to a partial 
claim. The approved operator for an NFT also has the right to complete the swap with the underlying asset.

Token IDs are not sequential. This contract does not support the enumerable ERC721 extension. This decision is based 
on gas efficiency.

## Front-running Considerations

The benefits from these swaps are most apparent when the exchange amount is greater than $1m USD equivalent. As such, 
the initiation of a swap gives a strong indicator other market participants that a 2nd post-settlement swap will be 
coming. We attempt to minimize the risks from this in several ways:

`C -> D` is not declared on-chain when performing the swap from `A -> C`.

It is possible to perform a partial swap from `C -> D`, and to swap into multiple final assets. The NFT persists until 
it has no remaining underlying balance of `C`.

There is no fixed time frame for the second swap. A user can perform it immediately or wait until market conditions 
are more favorable.

It is possible to withdraw `C` without performing a second swap.

It is possible to perform additional `A -> B -> C` swaps to increase the balance of an already existing NFT.

The range of available actions and time frames make it significantly more difficult to predict the outcome of a swap 
and trade against it.

