The crvUSD Factory enables the creation of new markets and adjustments, including setting a new fee receiver, modifying the debt ceiling of an existing market, or updating blueprint implementations.

Other than the pool factory, this factory **does not allow permissionless deployment of new markets**. Only its **`admin`**, which is the CurveOwnershipAgent, can call to add a market. Therefore, adding a new market requires a sucessfully passed DAO vote.


!!! info
    The Factory Contract is deployed to the Ethereum mainnet at: [0xC9332fdCB1C491Dcc683bAe86Fe3cb70360738BC](https://etherscan.io/address/0xC9332fdCB1C491Dcc683bAe86Fe3cb70360738BC).  
    Source code for this contract is available on [Github](https://github.com/curvefi/curve-stablecoin/blob/master/contracts/ControllerFactory.vy).


For further informations on how to deploy markets, see [here](../crvusd_factory/deployer_api.md).  
For other admin controls, see [here](../crvusd_factory/admin_controls.md).