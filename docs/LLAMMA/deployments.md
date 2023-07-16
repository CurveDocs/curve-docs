## **General Infrastructure**

Due to testing-in-pord purposes, a few contract deployments took place, hence please ensure to utilize the correct and latest version. Latest deployment logs can be found [here](https://github.com/curvefi/curve-stablecoin/blob/master/deployment-logs/mainnet.log).

| Type   | Description | Address  |
| -------- | -------|-------|
|`Stablecoin`|`crvUSD Token`|[0xf939E0A03FB07F59A73314E73794Be0E57ac1b4E](https://etherscan.io/address/0xf939E0A03FB07F59A73314E73794Be0E57ac1b4E#code)|
|`Factory`|`Factory to create new markets`|[0xC9332fdCB1C491Dcc683bAe86Fe3cb70360738BC](https://etherscan.io/address/0xC9332fdCB1C491Dcc683bAe86Fe3cb70360738BC#code)|
|`Controller Implementation`|`Blueprint for controller`|[0xCdb55051fC792303DdC7c1052cC5161BaeD88e2A](https://etherscan.io/address/0xCdb55051fC792303DdC7c1052cC5161BaeD88e2A#code)|
|`AMM Implementation`|`Blueprint for amm`|[0x23208cA4F2B30d8f7D54bf2D5A822D1a2F876501](https://etherscan.io/address/0x23208cA4F2B30d8f7D54bf2D5A822D1a2F876501#code)|
|`Swap factory`|`Factory to deploy pools`|[0x4F8846Ae9380B90d2E71D5e3D042dff3E7ebb40d](https://etherscan.io/address/0x4F8846Ae9380B90d2E71D5e3D042dff3E7ebb40d#code)|
|`Owner proxy`|`Owner of Factory and it's deployed pools `|[0x855cC906dA8271Dd53879929bd226711247D5f17](https://etherscan.io/address/0x855cC906dA8271Dd53879929bd226711247D5f17#code)|
|`PriceAggregator`|`aggregator of stablecoin prices for crvUSD`|[0xe5Afcf332a5457E8FafCD668BcE3dF953762Dfe7](https://etherscan.io/address/0xe5Afcf332a5457E8FafCD668BcE3dF953762Dfe7#code)|
|`PriceAggregatorV2`|`aggregator of stablecoin prices for crvUSD`|[0x18672b1b0c623a30089A280Ed9256379fb0E4E62](https://etherscan.io/address/0x18672b1b0c623a30089A280Ed9256379fb0E4E62#code)|
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
    |`CollateralToken (sfrxETH)`|[0xac3e018457b222d93114458476f3e3416abbe38f](https://etherscan.io/address/0xac3e018457b222d93114458476f3e3416abbe38f#code)|
    |`PriceOracle`|[0x19F5B81e5325F882C9853B5585f74f751DE3896d](https://etherscan.io/address/0x19F5B81e5325F882C9853B5585f74f751DE3896d#code)|



### wstETH
!!! description "[wstETH](https://crvusd.curve.fi/#/ethereum/markets/wsteth/create)"

    !!! success inline end "Deployment Hash"
        https://etherscan.io/tx/0xe0db5ab1e175c8dbf54765b3b2fa4e98412ae24c1d9db1bd4c2134ee72519942


    | Type   | Address  |
    | ------ | -------- |
    |`AMM`|[0x37417b2238aa52d0dd2d6252d989e728e8f706e4](https://etherscan.io/address/0x37417b2238aa52d0dd2d6252d989e728e8f706e4#code)|
    |`Controller`|[0x100daa78fc509db39ef7d04de0c1abd299f4c6ce](https://etherscan.io/address/0x100daa78fc509db39ef7d04de0c1abd299f4c6ce#code)|
    |`MonetaryPolicy`|[0x1E7d3bf98d3f8D8CE193236c3e0eC4b00e32DaaE](https://etherscan.io/address/0x1E7d3bf98d3f8D8CE193236c3e0eC4b00e32DaaE#code)|
    |`CollateralToken (wstETH)`|[0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0](https://etherscan.io/address/0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0#code)|
    |`PriceOracle`|[0xc1793A29609ffFF81f10139fa0A7A444c9e106Ad](https://etherscan.io/address/0xc1793A29609ffFF81f10139fa0A7A444c9e106Ad#code)|



### wBTC
!!! description "[wbtc](https://crvusd.curve.fi/#/ethereum/markets/wbtc/create)"

    !!! success inline end "Deployment Hash"
        https://etherscan.io/tx/0x6a4491e87f5f5beb40b91457b6709fa114f761a4ac860550d2fede67dac7b621


    | Type   | Address  |
    | ------ | -------- |
    |`AMM`|[0xe0438eb3703bf871e31ce639bd351109c88666ea](https://etherscan.io/address/0xe0438eb3703bf871e31ce639bd351109c88666ea#code)|
    |`Controller`|[0x4e59541306910ad6dc1dac0ac9dfb29bd9f15c67](https://etherscan.io/address/0x4e59541306910ad6dc1dac0ac9dfb29bd9f15c67#code)|
    |`MonetaryPolicy`|[0x1E7d3bf98d3f8D8CE193236c3e0eC4b00e32DaaE](https://etherscan.io/address/0x1E7d3bf98d3f8D8CE193236c3e0eC4b00e32DaaE#code)|
    |`CollateralToken (wBTC)`|[0x2260fac5e5542a773aa44fbcfedf7c193bc2c599](https://etherscan.io/address/0x2260fac5e5542a773aa44fbcfedf7c193bc2c599#code)|
    |`PriceOracle`|[0xBe83fD842DB4937C0C3d15B2aBA6AF7E854f8dcb](https://etherscan.io/address/0xBe83fD842DB4937C0C3d15B2aBA6AF7E854f8dcb#code)|



### ETH
!!! description "[ETH](https://crvusd.curve.fi/#/ethereum/markets/eth/create)"

    !!! success inline end "Deployment Hash"
        https://etherscan.io/address/0x1681195c176239ac5e72d9aebacf5b2492e0c4ee


    | Type   | Address  |
    | ------ | -------- |
    |`AMM`|[0x1681195c176239ac5e72d9aebacf5b2492e0c4ee](https://etherscan.io/address/0x1681195c176239ac5e72d9aebacf5b2492e0c4ee#code)|
    |`Controller`|[0xa920de414ea4ab66b97da1bfe9e6eca7d4219635](https://etherscan.io/address/0xa920de414ea4ab66b97da1bfe9e6eca7d4219635#code)|
    |`MonetaryPolicy`|[0x1E7d3bf98d3f8D8CE193236c3e0eC4b00e32DaaE](https://etherscan.io/address/0x1E7d3bf98d3f8D8CE193236c3e0eC4b00e32DaaE#code)|
    |`CollateralToken (wETH)`|[0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2](https://etherscan.io/address/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2)|
    |`PriceOracle`|[0x966cBDeceFB60A289b0460F7638f4A75F432cA06](https://etherscan.io/address/0x966cBDeceFB60A289b0460F7638f4A75F432cA06#code)|




