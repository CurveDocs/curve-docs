<h1>StablecoinLens</h1>

!!!github "GitHub"
    The source code of the `StablecoinLens.vy` contract can be found on [:material-github: GitHub](https://github.com/curvefi/stcrvusd/blob/main/contracts/StablecoinLens.vy).

This contract interacts with the crvUSD controller factory, individual controllers, monetary policy, and peg keepers to calculate the true circulating supply of crvUSD. It's designed to provide a more accurate representation of the crvUSD in circulation compared to the `totalSupply`, which includes flash-loaned amounts.


This contract calculates an accurate circulating supply of crvUSD by summing the debt of all PegKeepers and the total debt of all Controllers. Reasoning behind doing so, is that simply calling `crvUSD.totalSupply()` will return a much larger number than this contract, as it includes crvUSD in PegKeepers, unborrowed crvUSD in Controllers, and crvUSD allocated to the FlashLender or other venues.

!!!warning "Warning"
    In theory, the calculation of the true circulating supply of crvUSD can be MEV'd be e.g. taking out a flashloan of up to 1m crvUSD or by borrowing a lot of crvUSD from a Controller, then taking a snapshow via `RewardsHandler.take_snapshot()` and then repay the debt again. However, there is a lower bound defined by `minimum_weight` and an upper bound defined by the FeeSplitter cap.

    Additionally, a snapshot can be taken every second, therefore when taking a snapshow right after and inflation or deflation, it will use the correct amount. And, in the end, its still a moving average, so would take MEV'ing over multiple snapshots to work out.


---

Logic of the contract:

1. fetches a predefined controller in the ControllerFactory, in this case the WETH controller.
2. obtains the monetary policy from the WETH controller by calling the `monetary_policy()` function.
3. iterates over the peg keepers in the monetary policy and sums up the debt of all peg keepers.
4. iterates over all controllers in the factory, excluding the WETH controller, and sums up the total debt of each controller.
5. returns the sum of the debt of all peg keepers and the total debt of all controllers.


### `_circulating_supply`
!!! description "`StablecoinLens._circulating_supply() -> uint256`"

    !!!warning "Warning"
        This function is not exposed as external as it can be easily manipulated and should not be used by third party contracts.

    Function to compute the true circulating supply of crvUSD. Calling `totalSupply` will return a much larger number than this function, as it includes crvUSD in PegKeepers, unborrowed crvUSD in Controllers, and crvUSD allocated to the FlashLender contract. The total supply is calculated by summing the debt of all peg keepers and the total debt of all controllers in the factory.

    Returns: circulating supply of crvUSD (`uint256`).

    ??? quote "Source code"

        === "StablecoinLens.vy"

            ```python
            # bound from factory
            MAX_CONTROLLERS: constant(uint256) = 50000
            # bound from monetary policy
            MAX_PEG_KEEPERS: constant(uint256) = 1001
            # could have been any other controller
            WETH_CONTROLLER_IDX: constant(uint256) = 3

            # the crvusd controller factory
            factory: immutable(IControllerFactory)

            @view
            @internal
            def _circulating_supply() -> uint256:
                """
                @notice Compute the circulating supply for crvUSD, `totalSupply` is
                    incorrect since it takes into account all minted crvUSD (i.e. flashloans)
                @dev This function sacrifices some gas to fetch peg keepers from a
                    unique source of truth to avoid having to manually maintain multiple
                    lists across several contracts.
                    For this reason we read the list of peg keepers contained in
                    the monetary policy returned by a controller in the factory.
                    factory -> weth controller -> monetary policy -> peg keepers
                    This function is not exposed as external as it can be easily
                    manipulated and should not be used by third party contracts.
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

    === "Example"
        ```shell
        >>> StablecoinLens._circulating_supply()
        ```
