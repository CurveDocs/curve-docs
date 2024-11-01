<h1>StablecoinLens</h1>

<script src="/assets/javascripts/contracts/scrvusd/stablecoin-lens.js"></script>
<script src="https://cdn.jsdelivr.net/npm/web3@1.5.2/dist/web3.min.js"></script>


The `StablecoinLens` contract calculates the accurate circulating supply of crvUSD by summing the debt of all `PegKeepers` and the total debt of all `Controllers`. This approach is necessary because simply calling `crvUSD.totalSupply()` returns an inflated number, as it includes idle crvUSD in `PegKeepers`, unborrowed crvUSD in `Controllers`, and crvUSD allocated to the `FlashLender` or other venues.

???+ vyper "`StablecoinLens.vy`"
    The source code for the `StablecoinLens.vy` contract is available on [:material-github: GitHub](https://github.com/curvefi/scrvusd/blob/main/contracts/StablecoinLens.vy). The contract is written using [Vyper](https://github.com/vyperlang/vyper) version `~=0.4`.

    The contract is deployed on :logos-ethereum: Ethereum at [`0xe24e2db9f6bb40bbe7c1c025bc87104f5401ecd7`](https://etherscan.io/address/0xe24e2db9f6bb40bbe7c1c025bc87104f5401ecd7).

    The source code was audited by [:logos-chainsecurity: ChainSecurity](https://www.chainsecurity.com/). The full audit report can be found [tbd]().


!!!danger "Warning: Usage of `StablecoinLens.vy` contract"
    In theory, the calculation of the true circulating supply of crvUSD could be manipulated using MEV techniques. For example, one could take a flash loan of up to 1 million crvUSD or borrow a significant amount of crvUSD from a Controller, then take a snapshot via `RewardsHandler.take_snapshot()`, and subsequently repay the debt. However, there is a lower bound defined by `minimum_weight` and an upper bound defined by the `FeeSplitter` cap.

    Ultimately, as this calculation is a moving average, successful manipulation would require repeated MEV actions over multiple snapshots to have a substantial impact. 


---

### `circulating_supply`
!!! description "`StablecoinLens.circulating_supply() -> uint256`"

    Function to compute the true circulating supply of crvUSD. Calling `totalSupply` directly returns an inflated figure, as it includes idle crvUSD in `PegKeepers`, unborrowed crvUSD in `Controllers`, and crvUSD allocated to the `FlashLender` contract. The true circulating supply is calculated by summing the debt of all `PegKeepers` and the total debt of each `Controller` in the factory.

    *Calculation logic:*

    1. Fetches a predefined crvUSD `Controller` from the `ControllerFactory`, in this case the WETH `Controller`. This is hardcoded and can not be changed.
    2. Fetches the `MonetaryPolicy` from the WETH `Controller` by calling the `monetary_policy()` function.
    3. Iterates over the `PegKeepers` in the `MonetaryPolicy`, summing the debt of all `PegKeepers`. Idle sitting crvUSD in `PegKeepers` are not included in the calculation as they are not circulating.
    4. Iterates over all crvUSD `Controllers` and sums the total debt of each `Controller`.
    5. Returns the combined sum of the debt of all `PegKeepers` and the total debt of all `Controllers`.

    Returns: true circulating supply of crvUSD (`uint256`).

    ??? quote "Source code"

        === "StablecoinLens.vy"

            ```python
            # pragma version ~=0.4

            from interfaces import IPegKeeper
            from interfaces import IController
            from interfaces import IControllerFactory
            from interfaces import IMonetaryPolicy

            # bound from factory
            MAX_CONTROLLERS: constant(uint256) = 50000
            # bound from monetary policy
            MAX_PEG_KEEPERS: constant(uint256) = 1001
            # could have been any other controller
            WETH_CONTROLLER_IDX: constant(uint256) = 3

            # the crvusd controller factory
            factory: immutable(IControllerFactory)


            @deploy
            def __init__(_factory: IControllerFactory):
                factory = _factory


            @view
            @external
            def circulating_supply() -> uint256:
                return self._circulating_supply()


            @view
            @internal
            def _circulating_supply() -> uint256:
                """
                @notice Compute the circulating supply for crvUSD, `totalSupply` is incorrect
                since it takes into account all minted crvUSD (i.e. flashloans)

                @dev This function sacrifices some gas to fetch peg keepers from a unique source
                of truth to avoid having to manually maintain multiple lists across several
                contracts. For this reason we read the list of peg keepers contained in the
                monetary policy returned by a controller in the factory. factory -> weth
                controller -> monetary policy -> peg keepers This function is not exposed as
                external as it can be easily manipulated and should not be used by third party
                contracts.
                """

                circulating_supply: uint256 = 0

                # Fetch the weth controller (index 3) under the assumption that
                # weth will always be a valid collateral for crvUSD, therefore its
                # monetary policy should always be up to date.
                controller: IController = staticcall factory.controllers(WETH_CONTROLLER_IDX)

                # We obtain the address of the current monetary policy used by the
                # weth controller because it contains a list of all the peg keepers.
                monetary_policy: IMonetaryPolicy = staticcall controller.monetary_policy()

                # Iterate over the peg keepers (since it's a fixed size array we
                # wait for a zero address to stop iterating).
                for i: uint256 in range(MAX_PEG_KEEPERS):
                    pk: IPegKeeper = staticcall monetary_policy.peg_keepers(i)

                    if pk.address == empty(address):
                        # end of array
                        break

                    circulating_supply += staticcall pk.debt()

                n_controllers: uint256 = staticcall factory.n_collaterals()

                for i: uint256 in range(n_controllers, bound=MAX_CONTROLLERS):
                    controller = staticcall factory.controllers(i)

                    # add crvUSD minted by controller
                    circulating_supply += staticcall controller.total_debt()

                return circulating_supply
            ```

        === "IPegKeeper.vy"

            ```python
            # pragma version ~=0.4.0


            @view
            @external
            def debt() -> uint256:
                ...
            ```


        === "IController.vy"

            ```python
            # pragma version ~=0.4.0

            import IMonetaryPolicy


            @view
            @external
            def total_debt() -> uint256:
                ...


            @view
            @external
            def monetary_policy() -> IMonetaryPolicy:
                ...
            ```

        === "IControllerFactory.vy"

            ```python
            # pragma version ~=0.4.0

            import IController


            @external
            @view
            def controllers(i: uint256) -> IController:
                ...


            @external
            @view
            def n_collaterals() -> uint256:
                ...
            ```

        === "IMonetaryPolicy.vy"

            ```python
            # pragma version ~=0.4.0

            import IPegKeeper


            @view
            @external
            def peg_keepers(i: uint256) -> IPegKeeper:
                ...
            ```


    === "Example"

        :material-information-outline:{ title='This interactive example fetches the output directly on-chain.' } This example returns the true circulating supply of crvUSD.

        <div class="highlight">
        <pre><code>>>> StablecoinLens.circulating_supply() <span id="circulatingSupplyOutput"></span></code></pre>
        </div>
