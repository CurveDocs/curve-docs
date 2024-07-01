# **Code Template**

!!! description "`LiquidityGaugeV6.`"

    Function to

    Returns:

    Emits: 

    ??? quote "Source code"

        === "LiquidityGaugeV6.vy"

            ```python
            ```

    === "Example"
        ```shell
        >>> LiquidityGaugeV6.
        ''
        ```


---


# **Custom Admonitions**

!!!guard "Guarded Method"
    This function is only callable by the `admin` of the contract.


!!!deploy "Contract Source & Deployment"
    **Curve DAO Token** contract is deployed to the Ethereum mainnet at: [0xD533a949740bb3306d119CC777fa900bA034cd52](https://etherscan.io/address/0xD533a949740bb3306d119CC777fa900bA034cd52#code).
    Source code available on [Github](https://github.com/curvefi/curve-dao-contracts/blob/567927551903f71ce5a73049e077be87111963cc/contracts/ERC20CRV.vy).


!!!github "GitHub"
    The source code of the `CryptoFromPool.vy` and all other oracle contracts can be found on [GitHub :material-github:](https://github.com/curvefi/curve-stablecoin/blob/lending/contracts/price_oracles/).


!!!colab "Google Colab Notebook"
    Unfortunately, there is **no external method to directly check the claimable rewards for an address**. The claimable rewards can **either be checked in the [Curve UI](https://curve.fi/#/ethereum/dashboard) or by simulating a claim transaction** and comparing the reward token balances before and after the claim. A Google Colab notebook that simulates such a transaction can be found here: [:simple-googlecolab: Google Colab Notebook](https://colab.research.google.com/drive/198uCIg10fT56q5nhMwlgVV13bmHOwNMm?usp=sharing).