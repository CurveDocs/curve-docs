The crvUSD Factory allows the deployment of new markets.

Other than the pool factory, this factory prohibits permissionless deployment of new markets. Only its `admin`, which is the CurveOwnershipAgent, can call to add a market. Therefore, adding a new market requires a sucessfully passed DAO vote.

!!! info
    The Factory Contract is deployed to the Ethereum mainnet at: [0xC9332fdCB1C491Dcc683bAe86Fe3cb70360738BC](https://etherscan.io/address/0xC9332fdCB1C491Dcc683bAe86Fe3cb70360738BC).  
    Source code for this contract is available on [Github](https://github.com/curvefi/curve-stablecoin/blob/master/contracts/ControllerFactory.vy).
