<h1>CryptoFromPoolVault</h1>

This oracle contract takes the **price oracle from a Curve liquidity pool and applies the price per share of a vault to it**. This is often used when having ERC-4626 Vault tokens with `pricePerShare`, `convertToAsset`, or other similar functions which essentially return the price of one vault token compared to the underlying assets. The first oracle contracts were deployed without considering the [aggregated price of crvUSD](../../crvUSD/priceaggregator.md), but experience has shown that it makes sense to include this value in the calculation. The respective differences are documented in the relevant sections.

These kinds of oracle contracts **need to be deployed manually**, as there is currently no `Factory` to do so.

!!!github "GitHub"
    The source code for the following price oracle contracts can be found on :material-github: GitHub:

    - [`CryptoFromPoolVault.vy`](https://github.com/curvefi/curve-stablecoin/blob/master/contracts/price_oracles/CryptoFromPoolVault.vy)
    - [`CryptoFromPoolVaultWAgg.vy`](https://github.com/curvefi/curve-stablecoin/blob/master/contracts/price_oracles/CryptoFromPoolVaultWAgg.vy)


!!!warning "Oracle Immutability"
    The oracle contracts are fully immutable. Once deployed, they cannot change any parameters, stop the price updates, or alter the pools used to calculate the prices. However, because the contract relies on other pools, it's important to keep in mind that changing parameters in the pool, such as the periodicity of the oracle, can influence these oracle contracts. All relevant data required for the oracle to function is passed into the `__init__` function during the deployment of the contract.

    ???quote "`__init__`"
        
        === "CryptoFromPoolVault.vy"

            ```python
            @external
            def __init__(
                    pool: Pool,
                    N: uint256,
                    borrowed_ix: uint256,
                    collateral_ix: uint256,
                    vault: Vault
                ):
                assert borrowed_ix != collateral_ix
                assert borrowed_ix < N
                assert collateral_ix < N

                POOL = pool
                N_COINS = N
                BORROWED_IX = borrowed_ix
                COLLATERAL_IX = collateral_ix
                VAULT = vault

                no_argument: bool = False
                if N == 2:
                    success: bool = False
                    res: Bytes[32] = empty(Bytes[32])
                    success, res = raw_call(
                        pool.address,
                        _abi_encode(empty(uint256), method_id=method_id("price_oracle(uint256)")),
                        max_outsize=32, is_static_call=True, revert_on_failure=False)
                    if not success:
                        no_argument = True
                NO_ARGUMENT = no_argument

                self.cached_price_per_share = VAULT.pricePerShare()
                self.cached_timestamp = block.timestamp
            ```

        === "CryptoFromPoolVaultWAgg.vy"

            ```python
            @external
            def __init__(
                    pool: Pool,
                    N: uint256,
                    borrowed_ix: uint256,
                    collateral_ix: uint256,
                    vault: Vault,
                    agg: StableAggregator
                ):
                assert borrowed_ix != collateral_ix
                assert borrowed_ix < N
                assert collateral_ix < N
                POOL = pool
                N_COINS = N
                BORROWED_IX = borrowed_ix
                COLLATERAL_IX = collateral_ix
                VAULT = vault
                AGG = agg

                no_argument: bool = False
                if N == 2:
                    success: bool = False
                    res: Bytes[32] = empty(Bytes[32])
                    success, res = raw_call(
                        pool.address,
                        _abi_encode(empty(uint256), method_id=method_id("price_oracle(uint256)")),
                        max_outsize=32, is_static_call=True, revert_on_failure=False)
                    if not success:
                        no_argument = True
                NO_ARGUMENT = no_argument
            ```


---


## **Oracle Price**

The oracle price is calculated by taking the `price_oracle` of a Curve pool and then adjusting it by the rate of a vault, using methods such as `convertToAssets`, `pricePerShare` or really any other equvalent function which returns the "exchange rate" of the vault token and the underlying asset.

!!!example "Example"
    Let's take a look at the [sDOLA/crvUSD lending market](https://lend.curve.fi/#/ethereum/markets/one-way-market-17/create), which uses the `CryptoFromPoolVaultWAgg.vy` code. 

    The [oracle contract](https://etherscan.io/address/0x002688C4296A2C4d800F271fe6F01741111B09Be) fetches the `price_oracle` of the [DOLA <> crvUSD stableswap-ng pool](https://etherscan.io/address/0x8272E1A3dBef607C04AA6e5BD3a1A134c8ac063B#readContract#F9) and then adjusts this value by the rate obtained from the [`convertToAssets`](https://etherscan.io/address/0xb45ad160634c528Cc3D2926d9807104FA3157305#readContract#F7) method of the [sDOLA vault](https://etherscan.io/address/0xb45ad160634c528Cc3D2926d9807104FA3157305).

Additionally, the `CryptoFromPoolVault.vy` contract has a **built-in mechanism that considers a certain maximum speed of price change within the vault** when calculating the oracle price. This feature is not included in the `CryptoFromPoolVaultWAgg.vy` oracle contract.

??? quote "Source Code"

    *The formula to calculate the applied rate is the following:*

    $$\min \left( \text{pricePerShare}, \frac{\text{cached_price_per_share} \times (10^{18} + \text{PPS_MAX_SPEED} \times (\text{block.timestamp} - \text{cached_timestamp}))}{10^{18}} \right)$$

    In this example, `pricePerShare` is used, but it can really be any equivalent method that returns the rate of the vault token with respect to its underlying token.

    `cached_price_per_share` and `cached_timestamp` are internal variables that are updated whenever the `price_w` function is called. The first value is set to the current rate within the vault at the block when the function is called, and the second value to the current timestamp (`block.timestamp`).

    === "CryptoFromPoolVaul.vy"

        ```py
        PPS_MAX_SPEED: constant(uint256) = 10**16 / 60  # Max speed of pricePerShare change

        cached_price_per_share: public(uint256)
        cached_timestamp: public(uint256)

        @internal
        @view
        def _pps() -> uint256:
            return min(VAULT.pricePerShare(), self.cached_price_per_share * (10**18 + PPS_MAX_SPEED * (block.timestamp - self.cached_timestamp)) / 10**18)


        @internal
        def _pps_w() -> uint256:
            pps: uint256 = min(VAULT.pricePerShare(), self.cached_price_per_share * (10**18 + PPS_MAX_SPEED * (block.timestamp - self.cached_timestamp)) / 10**18)
            self.cached_price_per_share = pps
            self.cached_timestamp = block.timestamp
            return pps
        ```


### `price`
!!! description "`CryptoFromPoolVault.price() -> uint256`"

    Getter for the price of the collateral asset denominated against the borrowed token and applying the conversion rate form a vault.

    Returns: oracle price (`uint256`).

    ??? quote "Source code"

        The `CryptoFromPoolVault.vy` oracle contract does not take the aggregated price of crvUSD from the [`PriceAggregator.vy` contract](../../crvUSD/priceaggregator.md) into account. Experience has shown that it makes sense to include this value in the oracle calculations. This is implemented in the `CryptoFromPoolVaultWAgg.vy` oracle contract.

        The following source code includes all changes up to commit hash [86cae3a](https://github.com/curvefi/curve-stablecoin/tree/86cae3a89f2138122be428b3c060cc75fa1df1b0); any changes made after this commit are not included.

        === "CryptoFromPoolVault.vy"

            ```python
            interface Pool:
                def price_oracle(i: uint256 = 0) -> uint256: view  # Universal method!

            interface StableAggregator:
                def price() -> uint256: view
                def price_w() -> uint256: nonpayable
                def stablecoin() -> address: view

            interface Vault:
                def convertToAssets(shares: uint256) -> uint256: view

            POOL: public(immutable(Pool))
            BORROWED_IX: public(immutable(uint256))
            COLLATERAL_IX: public(immutable(uint256))
            N_COINS: public(immutable(uint256))
            NO_ARGUMENT: public(immutable(bool))
            VAULT: public(immutable(Vault))
            AGG: public(immutable(StableAggregator))

            PPS_MAX_SPEED: constant(uint256) = 10**16 / 60  # Max speed of pricePerShare change

            cached_price_per_share: public(uint256)
            cached_timestamp: public(uint256)

            @external
            @view
            def price() -> uint256:
                return self._raw_price(self._pps())

            @internal
            @view
            def _raw_price(pps: uint256) -> uint256:
                p_borrowed: uint256 = 10**18
                p_collateral: uint256 = 10**18

                if NO_ARGUMENT:
                    p: uint256 = POOL.price_oracle()
                    if COLLATERAL_IX > 0:
                        p_collateral = p
                    else:
                        p_borrowed = p

                else:
                    if BORROWED_IX > 0:
                        p_borrowed = POOL.price_oracle(BORROWED_IX - 1)
                    if COLLATERAL_IX > 0:
                        p_collateral = POOL.price_oracle(COLLATERAL_IX - 1)

                return p_collateral * pps / p_borrowed

            @internal
            @view
            def _pps() -> uint256:
                return min(VAULT.pricePerShare(), self.cached_price_per_share * (10**18 + PPS_MAX_SPEED * (block.timestamp - self.cached_timestamp)) / 10**18)
            ```

        === "CryptoFromPoolVaultWAgg.vy"

            ```python
            interface Pool:
                def price_oracle(i: uint256 = 0) -> uint256: view  # Universal method!

            interface StableAggregator:
                def price() -> uint256: view
                def price_w() -> uint256: nonpayable
                def stablecoin() -> address: view

            interface Vault:
                def convertToAssets(shares: uint256) -> uint256: view

            POOL: public(immutable(Pool))
            BORROWED_IX: public(immutable(uint256))
            COLLATERAL_IX: public(immutable(uint256))
            N_COINS: public(immutable(uint256))
            NO_ARGUMENT: public(immutable(bool))
            VAULT: public(immutable(Vault))
            AGG: public(immutable(StableAggregator))

            @external
            @view
            def price() -> uint256:
                return self._raw_price() * AGG.price() / 10**18

            @internal
            @view
            def _raw_price() -> uint256:
                p_borrowed: uint256 = 10**18
                p_collateral: uint256 = 10**18

                if NO_ARGUMENT:
                    p: uint256 = POOL.price_oracle()
                    if COLLATERAL_IX > 0:
                        p_collateral = p
                    else:
                        p_borrowed = p

                else:
                    if BORROWED_IX > 0:
                        p_borrowed = POOL.price_oracle(BORROWED_IX - 1)
                    if COLLATERAL_IX > 0:
                        p_collateral = POOL.price_oracle(COLLATERAL_IX - 1)

                return p_collateral * VAULT.convertToAssets(10**18) / p_borrowed
            ```

    === "Example"
        ```shell
        >>> CryptoFromPoolVault.price()
        1046959880335267532
        ```


### `price_w`
!!! description "`CryptoFromPoolVault.price_w() -> uint256`"

    This function calculates and writes the price while updating `cached_rate` and `cached_timestamp`. It method is called whenever the `_exchange` function is called within the AMM contract of the lending market.

    Returns: oracle price (`uint256`).

    ??? quote "Source code"

        The `CryptoFromPoolVault.vy` oracle contract does not take the aggregated price of crvUSD from the [`PriceAggregator.vy` contract](../../crvUSD/priceaggregator.md) into account. Experience has shown that it makes sense to include this value in the oracle calculations. This is implemented in the `CryptoFromPoolVaultWAgg.vy` oracle contract.

        The following source code includes all changes up to commit hash [86cae3a](https://github.com/curvefi/curve-stablecoin/tree/86cae3a89f2138122be428b3c060cc75fa1df1b0); any changes made after this commit are not included.

        === "CryptoFromPoolVault.vy"

            ```python
            interface Pool:
                def price_oracle(i: uint256 = 0) -> uint256: view  # Universal method!

            interface StableAggregator:
                def price() -> uint256: view
                def price_w() -> uint256: nonpayable
                def stablecoin() -> address: view

            interface Vault:
                def convertToAssets(shares: uint256) -> uint256: view

            POOL: public(immutable(Pool))
            BORROWED_IX: public(immutable(uint256))
            COLLATERAL_IX: public(immutable(uint256))
            N_COINS: public(immutable(uint256))
            NO_ARGUMENT: public(immutable(bool))
            VAULT: public(immutable(Vault))
            AGG: public(immutable(StableAggregator))

            PPS_MAX_SPEED: constant(uint256) = 10**16 / 60  # Max speed of pricePerShare change

            cached_price_per_share: public(uint256)
            cached_timestamp: public(uint256)

            @external
            def price_w() -> uint256:
                return self._raw_price(self._pps_w())

            @internal
            @view
            def _raw_price(pps: uint256) -> uint256:
                p_borrowed: uint256 = 10**18
                p_collateral: uint256 = 10**18

                if NO_ARGUMENT:
                    p: uint256 = POOL.price_oracle()
                    if COLLATERAL_IX > 0:
                        p_collateral = p
                    else:
                        p_borrowed = p

                else:
                    if BORROWED_IX > 0:
                        p_borrowed = POOL.price_oracle(BORROWED_IX - 1)
                    if COLLATERAL_IX > 0:
                        p_collateral = POOL.price_oracle(COLLATERAL_IX - 1)

                return p_collateral * pps / p_borrowed

            @internal
            def _pps_w() -> uint256:
                pps: uint256 = min(VAULT.pricePerShare(), self.cached_price_per_share * (10**18 + PPS_MAX_SPEED * (block.timestamp - self.cached_timestamp)) / 10**18)
                self.cached_price_per_share = pps
                self.cached_timestamp = block.timestamp
                return pps
            ```

        === "CryptoFromPoolVaultWAgg.vy"

            ```python
            interface Pool:
                def price_oracle(i: uint256 = 0) -> uint256: view  # Universal method!

            interface StableAggregator:
                def price() -> uint256: view
                def price_w() -> uint256: nonpayable
                def stablecoin() -> address: view

            interface Vault:
                def convertToAssets(shares: uint256) -> uint256: view

            POOL: public(immutable(Pool))
            BORROWED_IX: public(immutable(uint256))
            COLLATERAL_IX: public(immutable(uint256))
            N_COINS: public(immutable(uint256))
            NO_ARGUMENT: public(immutable(bool))
            VAULT: public(immutable(Vault))
            AGG: public(immutable(StableAggregator))

            @external
            def price_w() -> uint256:
                return self._raw_price() * AGG.price_w() / 10**18

            @internal
            @view
            def _raw_price() -> uint256:
                p_borrowed: uint256 = 10**18
                p_collateral: uint256 = 10**18

                if NO_ARGUMENT:
                    p: uint256 = POOL.price_oracle()
                    if COLLATERAL_IX > 0:
                        p_collateral = p
                    else:
                        p_borrowed = p

                else:
                    if BORROWED_IX > 0:
                        p_borrowed = POOL.price_oracle(BORROWED_IX - 1)
                    if COLLATERAL_IX > 0:
                        p_collateral = POOL.price_oracle(COLLATERAL_IX - 1)

                return p_collateral * VAULT.convertToAssets(10**18) / p_borrowed
            ```

    === "Example"
        ```shell
        >>> CryptoFromPoolVault.price_w()
        1046959880335267532
        ```


---



## **Contract Info Methods**


### `VAULT`
!!! description "`CryptoFromPoolVault.VAULT() -> address: view`"

    Getter for the vault contract from which the rate (`convertToAssets` or similar functions) is fetched. This value is immutable and set at contract initialization.

    Returns: vault contract (`address`).

    ??? quote "Source code"

        The following source code includes all changes up to commit hash [86cae3a](https://github.com/curvefi/curve-stablecoin/tree/86cae3a89f2138122be428b3c060cc75fa1df1b0); any changes made after this commit are not included.

        === "CryptoFromPoolVault.vy"

            ```python
            VAULT: public(immutable(Vault))
            ```

        === "CryptoFromPoolVaultWAGG.vy"

            ```python
            VAULT: public(immutable(Vault))
            ```

    === "Example"

        ```shell
        >>> CryptoFromPoolVault.VAULT()
        '0xb45ad160634c528Cc3D2926d9807104FA3157305'
        ```


### `POOL`
!!! description "`CryptoFromPoolVault.POOL() -> address: view`"

    Getter for the liquidity pool used to fetch the `price_oracle`.

    Returns: pool contract (`address`).

    ??? quote "Source code"

        The following source code includes all changes up to commit hash [86cae3a](https://github.com/curvefi/curve-stablecoin/tree/86cae3a89f2138122be428b3c060cc75fa1df1b0); any changes made after this commit are not included.

        === "CryptoFromPoolVault.vy"

            ```python
            POOL: public(immutable(Pool))
            ```

        === "CryptoFromPoolVaultWAgg.vy"

            ```python
            POOL: public(immutable(Pool))
            ```

    === "Example"

        ```shell
        >>> CryptoFromPoolVault.POOL()
        '0x8272E1A3dBef607C04AA6e5BD3a1A134c8ac063B'
        ```


### `BORROWED_IX`
!!! description "`CryptoFromPoolVault.BORROWED_IX() -> uint256: view`"

    Getter for the coin index of the borrowed token within the pool from which `price_oracle` is fetched. This value is immutable and set at contract initialization.

    Returns: coin index (`uint256`).

    ??? quote "Source code"

        The following source code includes all changes up to commit hash [86cae3a](https://github.com/curvefi/curve-stablecoin/tree/86cae3a89f2138122be428b3c060cc75fa1df1b0); any changes made after this commit are not included.

        === "CryptoFromPoolVault.vy"

            ```python
            BORROWED_IX: public(immutable(uint256))
            ```

        === "CryptoFromPoolVaultWAgg.vy"

            ```python
            BORROWED_IX: public(immutable(uint256))
            ```

    === "Example"

        `BORROWED_IX` of `1` means the borrowed token in the pool, from which the price oracle value is fetched, is at coin index `1` (`Pool.coins(1)`).

        ```shell
        >>> CryptoFromPoolVaultWAgg.BORROWED_IX()
        1
        ```


### `COLLATERAL_IX`
!!! description "`CryptoFromPoolVault.COLLATERAL_IX() -> uint256: view`"

    Getter for the coin index of the collateral token within the pool from which `price_oracle` is fetched. This value is immutable and set at contract initialization.

    Returns: coin index (`uint256`).

    ??? quote "Source code"

        The following source code includes all changes up to commit hash [86cae3a](https://github.com/curvefi/curve-stablecoin/tree/86cae3a89f2138122be428b3c060cc75fa1df1b0); any changes made after this commit are not included.

        === "CryptoFromPoolVault.vy"

            ```python
            COLLATERAL_IX: public(immutable(uint256))
            ```

        === "CryptoFromPoolVaultWAgg.vy"

            ```python
            COLLATERAL_IX: public(immutable(uint256))
            ```

    === "Example"

        `COLLATERAL_IX` of `0` means the borrowed token in the pool, from which the price oracle value is fetched, is at coin index `0` (`Pool.coins(0)`).

        ```shell
        >>> CryptoFromPoolVaultWAgg.COLLATERAL_IX()
        0
        ```


### `N_COINS`
!!! description "`CryptoFromPoolVault.N_COINS() -> uint256: view`"

    Getter for the number of coins in `POOL`.

    Returns: number of coins (`uint256`).

    ??? quote "Source code"

        The following source code includes all changes up to commit hash [86cae3a](https://github.com/curvefi/curve-stablecoin/tree/86cae3a89f2138122be428b3c060cc75fa1df1b0); any changes made after this commit are not included.

        === "CryptoFromPoolVault.vy"

            ```python
            N_COINS: public(immutable(uint256))
            ```

        === "CryptoFromPoolVaultWAgg.vy"

            ```python
            N_COINS: public(immutable(uint256))
            ```

    === "Example"

        ```shell
        >>> CryptoFromPoolVault.N_COINS()
        2
        ```


### `NO_ARGUMENT`
!!! description "`CryptoFromPoolVault.NO_ARGUMENT() -> bool: view`"

    Getter for the `NO_ARGUMENT` storage variable. This is an additional variable to ensure the correct price oracle is fetched from a `POOL`. This value is immutable and set at contract initialization.

    Returns: true or false (`bool`).

    ??? quote "Source code"

        The following source code includes all changes up to commit hash [86cae3a](https://github.com/curvefi/curve-stablecoin/tree/86cae3a89f2138122be428b3c060cc75fa1df1b0); any changes made after this commit are not included.

        === "CryptoFromPoolVault.vy"

            ```python
            NO_ARGUMENT: public(immutable(bool))
            ```

    === "Example"

        ```shell
        >>> CryptoFromPoolVault.NO_ARGUMENT()
        'True'
        ```


### `AGG`
!!! description "`CryptoFromPoolVaultWAgg.AGG() -> address: view`"

    !!!info
        This `AGG` storage variable is only used within the `CryptoFromPoolVaultWAgg` contracts.

    Getter for the crvUSD `PriceAggregator` contract. This value is immutable and set at contract initialization.

    Returns: `PriceAggregator` (`address`).

    ??? quote "Source code"

        The following source code includes all changes up to commit hash [86cae3a](https://github.com/curvefi/curve-stablecoin/tree/86cae3a89f2138122be428b3c060cc75fa1df1b0); any changes made after this commit are not included.

        === "CryptoFromPoolVaultWAgg.vy"

            ```python
            interface StableAggregator:
                def price() -> uint256: view
                def price_w() -> uint256: nonpayable
                def stablecoin() -> address: view

            AGG: public(immutable(StableAggregator))
            ```

    === "Example"

        ```shell
        >>> CryptoFromPoolVaultWAgg.AGG()
        '0x18672b1b0c623a30089A280Ed9256379fb0E4E62'
        ```
