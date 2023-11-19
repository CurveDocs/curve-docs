<div class="grid cards" markdown>

-   :material-clock-fast:{ .lg .middle } __Set up in 5 minutes__

    ---

    go to [curve.fi](https://curve.fi/)

    [:octicons-arrow-right-24: Getting started](#)

-   :fontawesome-brands-markdown:{ .lg .middle } __It's just Markdown__

    ---

    Focus on your content and generate a responsive and searchable static site

    [:octicons-arrow-right-24: Reference](#)

-   :material-format-font:{ .lg .middle } __Made to measure__

    ---

    Change the colors, fonts, language, icons, logo and more with a few lines

    [:octicons-arrow-right-24: Customization](#)

-   :material-scale-balance:{ .lg .middle } __Open Source, MIT__

    ---

    Material for MkDocs is licensed under MIT and available on [GitHub]

    [:octicons-arrow-right-24: License](#)

</div>





!!!guard "Guarded Method"
    This function is only callable by the `admin` of the contract.


!!!deploy "Contract Source & Deployment"
    **Curve DAO Token** contract is deployed to the Ethereum mainnet at: [0xD533a949740bb3306d119CC777fa900bA034cd52](https://etherscan.io/address/0xD533a949740bb3306d119CC777fa900bA034cd52#code).
    Source code available on [Github](https://github.com/curvefi/curve-dao-contracts/blob/567927551903f71ce5a73049e077be87111963cc/contracts/ERC20CRV.vy).




## example

### `set_name`
!!! description "`CRV.set_name(_name: String[64], _symbol: String[32]):`"

    !!!guard "Guarded Methods"
        This function can only be called by the `admin` of the contract.

    Function to change token name to `_name` and token symbol to `_symbol`.

    ??? quote "Source code"

        ```vyper hl_lines="1 2 5"
        name: public(String[64])
        symbol: public(String[32])

        @external
        def set_name(_name: String[64], _symbol: String[32]):
            """
            @notice Change the token name and symbol to `_name` and `_symbol`
            @dev Only callable by the admin account
            @param _name New token name
            @param _symbol New token symbol
            """
            assert msg.sender == self.admin, "Only admin is allowed to change name"
            self.name = _name
            self.symbol = _symbol
        ```

    === "Example"
        ```shell
        >>> CRV.set_name('todo)
        'todo'
        ```