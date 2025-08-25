evm gauges on sidechains


arbitrum 2pool:


child liquidity gauge: 0xce5f24b7a95e9cba7df4b54e911b4a3dc8cdaf6f
users deposit and withdraw liquidity in there; LP token which represents the share of the liquidity in the gauge

crv emissions bridged into the gauge: https://arbiscan.io/tx/0xf731f641cd5083e6174d4eae512b0395ca8c41dd269e5a371031338dd37d65c0

next interaction with the gauge (deposit or withdraw), this happens: https://arbiscan.io/tx/0x03044db56af24807678104c817411661b079191897f9f411714d1b0244bcc8a4
-> CRV are transfered to the child liquidity gauge factory, from which the rewards can be claimed.

_checkpoint function triggers the transfer of CRV. `_checkpoint` is triggered whenever someone interacts with the gauge e.g. deposit or transfer.


    # check CRV balance and increase weekly inflation rate by delta for the rest of the week
    crv_balance: uint256 = ERC20(CRV).balanceOf(self)
    if crv_balance != 0:
        current_week: uint256 = block.timestamp / WEEK
        self.inflation_rate[current_week] += crv_balance / ((current_week + 1) * WEEK - block.timestamp)
        ERC20(CRV).transfer(FACTORY, crv_balance)




crv gauge weight happens

1. Root Liquidity Gauge Implementation
    mints the allocated crv emissions and bridges over to sidechain when calling `transmit_emissions`.

2. crv emissions bridged into the gauge: https://arbiscan.io/tx/0xf731f641cd5083e6174d4eae512b0395ca8c41dd269e5a371031338dd37d65c0
    emissions are bridged directly into the liquidity gauge on the sidechain. on the next interaction with the gauge (actually whenever it triggers `_checkpoint()`) crv emissions are transfered tot the child liquidity gauge factory.

3. emissions can be claimed from that gauge factory.
