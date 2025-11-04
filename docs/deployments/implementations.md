<h1>Curve Pool Implementations</h1>

Curve uses [ERC-5202](https://eips.ethereum.org/EIPS/eip-5202) blueprint contracts to deploy liquidity pools or lending vaults from. Each `Factory` can usually hold multiple different blueprint implementation contracts.

!!!warning ""
    The implementation contracts with IDs of `0` are the basic and most commonly used implementations and are consistent across all chains (but contract addresses can differ depending on the chain).

    This section only documents IDs other than 0.

---

## **Stableswap-NG**

- :logos-sonic: `CurveStableswapFactoryNG`: [`0x7C2085419BE6a04f4ad88ea91bC9F5C6E6C463D8`](https://sonicscan.org/address/0x7C2085419BE6a04f4ad88ea91bC9F5C6E6C463D8)

| Chain | Implementation Index | Address | Description |
| ----- | -------------------- | ------- | ----------- |
| :logos-sonic: Sonic | `710420` | [`0x8663426e8713922D81e44d73295759e74Afc230F`](https://sonicscan.org/address/0x8663426e8713922D81e44d73295759e74Afc230F) | arbitrary assignment of an `admin` and `admin_fee` via DAO vote; more information [here](../stableswap-exchange/stableswap-ng/implementations/custom1.md) |
| :logos-sonic: Sonic | `710420` | [`0xA7c2DD4356168153792EF05D27922064b3c71A26`](https://sonicscan.org/address/0xA7c2DD4356168153792EF05D27922064b3c71A26) | arbitrary assignment of an `admin` and `admin_fee` via DAO vote; more information [here](../stableswap-exchange/stableswap-ng/implementations/custom1.md) |


---

## **Cryptoswap-NG**

### **Twocrypto-NG**

- :logos-ethereum: `CurveTwocryptoFactory`: [`0x98EE851a00abeE0d95D08cF4CA2BdCE32aeaAF7F`](https://etherscan.io/address/0x98EE851a00abeE0d95D08cF4CA2BdCE32aeaAF7F)
- :logos-bsc: `CurveTwocryptoFactory`: [`0x98EE851a00abeE0d95D08cF4CA2BdCE32aeaAF7F`](https://bscscan.com/address/0x98EE851a00abeE0d95D08cF4CA2BdCE32aeaAF7F)
- :logos-base: `CurveTwocryptoFactory`: [`0xc9fe0c63af9a39402e8a5514f9c43af0322b665f`](https://basescan.org/address/0xc9fe0c63af9a39402e8a5514f9c43af0322b665f)


| Chain | Implementation Index | Address | Description |
| ----- | -------------------- | ------- | ----------- |
| :logos-ethereum: Ethereum | `110827960954786879070795645317684308345156454977361180728234664032152099907574` | [`0x82c251317ede0514302EEE1aD48f838a7A6EcE2F`](https://etherscan.io/address/0x82c251317ede0514302EEE1aD48f838a7A6EcE2F) | TwoCrypto (0% DAO fee) — for yb pools |
| :logos-ethereum: Ethereum | `13710427451595223911029771732871636196811780523916976014878790826087297352222` | [`0x3B0df55A2c64Ac7A3ada784eEA0898F0FD3cF17e`](https://etherscan.io/address/0x3B0df55A2c64Ac7A3ada784eEA0898F0FD3cF17e) | TwoCrypto (25% DAO fee) — for FX where the asset issuer will be the main source of LP and donations |
| :logos-ethereum: Ethereum | `110205523814837221872401067839670671012439480455633721548677383351514213591649` | [`0xD1FAeCA80d6FDd1DF4CBcCe4b2551b6Ee63Ae3D6`](https://etherscan.io/address/0xD1FAeCA80d6FDd1DF4CBcCe4b2551b6Ee63Ae3D6) | TwoCrypto (50% DAO fee) — for FX / regular pairs (where donations may stream from within Curve protocol) |
| :logos-ethereum: Ethereum | `6789` | [`0xeC1045809e383811Cc74B3D25219e1607A5f32dC`](https://etherscan.io/address/0xeC1045809e383811Cc74B3D25219e1607A5f32dC) | alternative implementation with settable admin fee for two/tricrypto (deafult admin fee remains at 50%) |
| :logos-base: Base | `110205523814837221872401067839670671012439480455633721548677383351514213591649` | [`0x56545B4640E5f0937E56843ad8f0A3Cd44fc0785`](https://basescan.org/address/0x56545B4640E5f0937E56843ad8f0A3Cd44fc0785) | TwoCrypto (50% DAO fee) — for FX / regular pairs (where donations may stream from within Curve protocol) |
| :logos-bsc: BSC | `110205523814837221872401067839670671012439480455633721548677383351514213591649` | [`0xbe365a090321E0E012f448B42feDfB74A7Ea4d9D`](https://bscscan.com/address/0xbe365a090321E0E012f448B42feDfB74A7Ea4d9D) | TwoCrypto (50% DAO fee) — for FX / regular pairs (where donations may stream from within Curve protocol) |


### **Tricrypto-NG Factory**

`CurveTricryptoFactory`: [`0x0c0e5f2fF0ff18a3be9b835635039256dC4B4963`](https://etherscan.io/address/0x0c0e5f2fF0ff18a3be9b835635039256dC4B4963)

| Chain | Implementation Index | Address | Description |
| ----- | -------------------- | ------- | ----------- |
| :logos-ethereum: Ethereum  | `6789` | [`0x1601f9c6640FE06E5928bB4451f99a015630FAF0`](https://etherscan.io/address/0x1601f9c6640FE06E5928bB4451f99a015630FAF0) | alternative implementation with settable admin fee for two/tricrypto (default admin fee remains at 50%) |
