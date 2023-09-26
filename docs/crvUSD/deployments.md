## **General Infrastructure**

For testing in production purposes, several contract deployments have taken place. Please ensure that you are using the correct and latest version. The latest deployment logs can be found [here](https://github.com/curvefi/curve-stablecoin/blob/master/deployment-logs/mainnet.log).

| Type   | Description | Address  |
| -------- | -------|-------|
|`Stablecoin`|`crvUSD Token`|[0xf939E0A03FB07F59A73314E73794Be0E57ac1b4E](https://etherscan.io/address/0xf939E0A03FB07F59A73314E73794Be0E57ac1b4E#code)|
|`Factory`|`Factory contract for crvUSD markets`|[0xC9332fdCB1C491Dcc683bAe86Fe3cb70360738BC](https://etherscan.io/address/0xC9332fdCB1C491Dcc683bAe86Fe3cb70360738BC#code)|
|`Controller Implementation`|`Blueprint for Controller`|[0xCdb55051fC792303DdC7c1052cC5161BaeD88e2A](https://etherscan.io/address/0xCdb55051fC792303DdC7c1052cC5161BaeD88e2A#code)|
|`AMM Implementation`|`Blueprint for AMM`|[0x23208cA4F2B30d8f7D54bf2D5A822D1a2F876501](https://etherscan.io/address/0x23208cA4F2B30d8f7D54bf2D5A822D1a2F876501#code)|
|`Swap factory`|`Pool Factory`|[0x4F8846Ae9380B90d2E71D5e3D042dff3E7ebb40d](https://etherscan.io/address/0x4F8846Ae9380B90d2E71D5e3D042dff3E7ebb40d#code)|
|`Owner proxy`|`Owner of Factory and it's deployed pools`|[0x855cC906dA8271Dd53879929bd226711247D5f17](https://etherscan.io/address/0x855cC906dA8271Dd53879929bd226711247D5f17#code)|
|`PriceAggregator`|`Aggregator of stablecoin prices for crvUSD`|[0xe5Afcf332a5457E8FafCD668BcE3dF953762Dfe7](https://etherscan.io/address/0xe5Afcf332a5457E8FafCD668BcE3dF953762Dfe7#code)|
|`PriceAggregatorV2`|`Aggregator of stablecoin prices for crvUSD`|[0x18672b1b0c623a30089A280Ed9256379fb0E4E62](https://etherscan.io/address/0x18672b1b0c623a30089A280Ed9256379fb0E4E62#code)|
|`PegKeeper (USDC)`|`PegKepper for crvUSD/USDC`|[0xaA346781dDD7009caa644A4980f044C50cD2ae22](https://etherscan.io/address/0xaA346781dDD7009caa644A4980f044C50cD2ae22#code)|
|`PegKeeper (USDT)`|`PegKepper for crvUSD/USDT`|[0xE7cd2b4EB1d98CD6a4A48B6071D46401Ac7DC5C8](https://etherscan.io/address/0xE7cd2b4EB1d98CD6a4A48B6071D46401Ac7DC5C8#code)|
|`PegKeeper (USDP)`|`PegKepper for crvUSD/USDP`|[0x6B765d07cf966c745B340AdCa67749fE75B5c345](https://etherscan.io/address/0x6B765d07cf966c745B340AdCa67749fE75B5c345#code)|
|`PegKeeper (TUSD)`|`PegKepper for crvUSD/TUSD`|[0x1ef89Ed0eDd93D1EC09E4c07373f69C49f4dcCae](https://etherscan.io/address/0x1ef89Ed0eDd93D1EC09E4c07373f69C49f4dcCae#code)|



## **Markets**

### sfrxETH
!!! description "[sfrxETH](https://crvusd.curve.fi/#/ethereum/markets/sfrxeth/create)"

    !!! success inline end "Deployment Hash"
        https://etherscan.io/tx/0x6d879b6e8a64478f3ecc5c2f918c4cf8c29ae0a3f93651159e4dc0278c5c49b5


    | Type   | Address  |
    | ------ | -------- |
    |`AMM`|[0x136e783846ef68c8bd00a3369f787df8d683a696](https://etherscan.io/address/0x136e783846ef68c8bd00a3369f787df8d683a696#code)|
    |`Controller`|[0x8472a9a7632b173c8cf3a86d3afec50c35548e76](https://etherscan.io/address/0x8472a9a7632b173c8cf3a86d3afec50c35548e76#code)|
    |`MonetaryPolicy`|[0xc684432FD6322c6D58b6bC5d28B18569aA0AD0A1](https://etherscan.io/address/0xc684432FD6322c6D58b6bC5d28B18569aA0AD0A1#code)|
    |`CollateralToken (sfrxETH)`|[0xac3e018457b222d93114458476f3e3416abbe38f](https://etherscan.io/address/0xac3e018457b222d93114458476f3e3416abbe38f)|
    |`PriceOracle`|[0x19F5B81e5325F882C9853B5585f74f751DE3896d](https://etherscan.io/address/0x19F5B81e5325F882C9853B5585f74f751DE3896d#code)|
    |`Leverage Zap`|[0xb556FA4C4752321B3154f08DfBDFCF34847f2eac](https://etherscan.io/address/0xb556FA4C4752321B3154f08DfBDFCF34847f2eac#code)|



### wstETH
!!! description "[wstETH](https://crvusd.curve.fi/#/ethereum/markets/wsteth/create)"

    !!! success inline end "Deployment Hash"
        https://etherscan.io/tx/0xe0db5ab1e175c8dbf54765b3b2fa4e98412ae24c1d9db1bd4c2134ee72519942


    | Type   | Address  |
    | ------ | -------- |
    |`AMM`|[0x37417b2238aa52d0dd2d6252d989e728e8f706e4](https://etherscan.io/address/0x37417b2238aa52d0dd2d6252d989e728e8f706e4#code)|
    |`Controller`|[0x100daa78fc509db39ef7d04de0c1abd299f4c6ce](https://etherscan.io/address/0x100daa78fc509db39ef7d04de0c1abd299f4c6ce#code)|
    |`MonetaryPolicy`|[0x1E7d3bf98d3f8D8CE193236c3e0eC4b00e32DaaE](https://etherscan.io/address/0x1E7d3bf98d3f8D8CE193236c3e0eC4b00e32DaaE#code)|
    |`CollateralToken (wstETH)`|[0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0](https://etherscan.io/address/0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0)|
    |`PriceOracle`|[0xc1793A29609ffFF81f10139fa0A7A444c9e106Ad](https://etherscan.io/address/0xc1793A29609ffFF81f10139fa0A7A444c9e106Ad#code)
    |`Leverage Zap`|[0x293436d4e4a15FBc6cCC400c14a01735E5FC74fd](https://etherscan.io/address/0x293436d4e4a15FBc6cCC400c14a01735E5FC74fd#code)||



### wBTC
!!! description "[wBTC](https://crvusd.curve.fi/#/ethereum/markets/wbtc/create)"

    !!! success inline end "Deployment Hash"
        https://etherscan.io/tx/0x6a4491e87f5f5beb40b91457b6709fa114f761a4ac860550d2fede67dac7b621


    | Type   | Address  |
    | ------ | -------- |
    |`AMM`|[0xe0438eb3703bf871e31ce639bd351109c88666ea](https://etherscan.io/address/0xe0438eb3703bf871e31ce639bd351109c88666ea#code)|
    |`Controller`|[0x4e59541306910ad6dc1dac0ac9dfb29bd9f15c67](https://etherscan.io/address/0x4e59541306910ad6dc1dac0ac9dfb29bd9f15c67#code)|
    |`MonetaryPolicy`|[0x1E7d3bf98d3f8D8CE193236c3e0eC4b00e32DaaE](https://etherscan.io/address/0x1E7d3bf98d3f8D8CE193236c3e0eC4b00e32DaaE#code)|
    |`CollateralToken (wBTC)`|[0x2260fac5e5542a773aa44fbcfedf7c193bc2c599](https://etherscan.io/address/0x2260fac5e5542a773aa44fbcfedf7c193bc2c599)|
    |`PriceOracle`|[0xBe83fD842DB4937C0C3d15B2aBA6AF7E854f8dcb](https://etherscan.io/address/0xBe83fD842DB4937C0C3d15B2aBA6AF7E854f8dcb#code)|
    |`Leverage Zap`|[0xA2518b71ee64E910741f5Cf480b19E8e402de4d7](https://etherscan.io/address/0xA2518b71ee64E910741f5Cf480b19E8e402de4d7#code)|



### ETH
!!! description "[ETH](https://crvusd.curve.fi/#/ethereum/markets/eth/create)"

    !!! success inline end "Deployment Hash"
        https://etherscan.io/tx/0x7ce7143aedf5e318e3bed653b730b9456eef67224a8dbcac59fe0872c0580a3a


    | Type   | Address  |
    | ------ | -------- |
    |`AMM`|[0x1681195c176239ac5e72d9aebacf5b2492e0c4ee](https://etherscan.io/address/0x1681195c176239ac5e72d9aebacf5b2492e0c4ee#code)|
    |`Controller`|[0xa920de414ea4ab66b97da1bfe9e6eca7d4219635](https://etherscan.io/address/0xa920de414ea4ab66b97da1bfe9e6eca7d4219635#code)|
    |`MonetaryPolicy`|[0x1E7d3bf98d3f8D8CE193236c3e0eC4b00e32DaaE](https://etherscan.io/address/0x1E7d3bf98d3f8D8CE193236c3e0eC4b00e32DaaE#code)|
    |`CollateralToken (wETH)`|[0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2](https://etherscan.io/address/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2)|
    |`PriceOracle`|[0x966cBDeceFB60A289b0460F7638f4A75F432cA06](https://etherscan.io/address/0x966cBDeceFB60A289b0460F7638f4A75F432cA06#code)|
    |`Leverage Zap`|[0xd3e576B5DcDe3580420A5Ef78F3639BA9cd1B967](https://etherscan.io/address/0xd3e576B5DcDe3580420A5Ef78F3639BA9cd1B967#code)|



### sfrxeth v2
!!! description "[sfrxETH v2](https://crvusd.curve.fi/#/ethereum/markets/sfrxeth1/create)"

    !!! success inline end "Deployment Hash"
        https://etherscan.io/tx/0x2ede10a84f28647b5636a706ea03334399ba0ec2c77267681902e3180ae2d9b3


    | Type   | Address  |
    | ------ | -------- |
    |`AMM`|[0xfa96ad0a9e64261db86950e2da362f5572c5c6fd](https://etherscan.io/address/0xfa96ad0a9e64261db86950e2da362f5572c5c6fd#code)|
    |`Controller`|[0xec0820efafc41d8943ee8de495fc9ba8495b15cf](https://etherscan.io/address/0xec0820efafc41d8943ee8de495fc9ba8495b15cf#code)|
    |`MonetaryPolicy`|[0xb8687d7dc9d8fa32fabde63e19b2dbc9bb8b2138](https://etherscan.io/address/0xb8687d7dc9d8fa32fabde63e19b2dbc9bb8b2138#code)|
    |`CollateralToken (sfrxETH)`|[0xac3e018457b222d93114458476f3e3416abbe38f](https://etherscan.io/address/0xac3e018457b222d93114458476f3e3416abbe38f)|
    |`PriceOracle`|[0x28d7880B5b67fB4a0B1c6Ed6c33c33f365113C29](https://etherscan.io/address/0x28d7880B5b67fB4a0B1c6Ed6c33c33f365113C29#code)|
    |`Leverage Zap`|[0x43eCFfe6c6C1b9F24AeB5C180E659c2a6FCe11Bc](https://etherscan.io/address/0x43eCFfe6c6C1b9F24AeB5C180E659c2a6FCe11Bc#code)|



### tBTC
!!! description "[tBTC](https://crvusd.curve.fi/#/ethereum/markets/tbtc/create)"

    !!! success inline end "Deployment Hash"
        https://etherscan.io/tx/0x147ccfac7d243d78ac8852d43c365be7d498b7aa18f6a3b0b1ade02ff55cdacd


    | Type   | Address  |
    | ------ | -------- |
    |`AMM`|[0xf9bd9da2427a50908c4c6d1599d8e62837c2bcb0](https://etherscan.io/address/0xf9bd9da2427a50908c4c6d1599d8e62837c2bcb0#code)|
    |`Controller`|[0x1c91da0223c763d2e0173243eadaa0a2ea47e704](https://etherscan.io/address/0x1c91da0223c763d2e0173243eadaa0a2ea47e704#code)|
    |`MonetaryPolicy`|[0xb8687d7dc9d8fa32fabde63e19b2dbc9bb8b2138](https://etherscan.io/address/0xb8687d7dc9d8fa32fabde63e19b2dbc9bb8b2138#code)|
    |`CollateralToken (tBTC)`|[0x18084fba666a33d37592fa2633fd49a74dd93a88](https://etherscan.io/address/0x18084fba666a33d37592fa2633fd49a74dd93a88)|
    |`PriceOracle`|[0xbeF434E2aCF0FBaD1f0579d2376fED0d1CfC4217](https://etherscan.io/address/0xbeF434E2aCF0FBaD1f0579d2376fED0d1CfC4217#code)|
    |`Leverage Zap`|[0xD79964C70Cb06224FdA4c48387B53E9819bcB71c](https://etherscan.io/address/0xD79964C70Cb06224FdA4c48387B53E9819bcB71c#code)|