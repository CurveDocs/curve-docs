factory (two-coin crypto): https://etherscan.io/address/0xf18056bbd320e96a48e3fbf8bc061322531aac99#code
proxy of the factory (old): https://etherscan.io/address/0x5a8fdC979ba9b6179916404414F7BA4D8B77C8A1#code

crvusd factory: https://etherscan.io/address/0x4F8846Ae9380B90d2E71D5e3D042dff3E7ebb40d
crvusd factory proxy: https://etherscan.io/address/0x855cc906da8271dd53879929bd226711247d5f17

metapool factory: https://etherscan.io/address/0xB9fC157394Af804a3578134A6585C0dc9cc990d4
proxy stableswap (old): https://etherscan.io/address/0x201798B679859DDF129651d6B58a5C32527EA04c#code

new cryptopool proxy (two-coin): https://etherscan.io/address/0x9f99FDe2ED3997EAfE52b78E3981b349fD2Eb8C9
cryptopool factory: https://etherscan.io/address/0xF18056Bbd320E96A48e3Fbf8bC061322531aac99

metapool factory: https://etherscan.io/address/0xB9fC157394Af804a3578134A6585C0dc9cc990d4
new proxy for stableswap: https://etherscan.io/address/0x742C3cF9Af45f91B109a81EfEaf11535ECDe9571#code




**FACTORIES:**
stableswap:
    - metapool: https://etherscan.io/address/0xB9fC157394Af804a3578134A6585C0dc9cc990d4
    -

cryptopools:
    - two-coin: https://etherscan.io/address/0xF18056Bbd320E96A48e3Fbf8bC061322531aac99
    - tricrypto: https://etherscan.io/address/0x0c0e5f2ff0ff18a3be9b835635039256dc4b4963 (owner of the deployed pools is the OwnershipAgent)


**PROXIES:**
stableswap: 
    - metapool proxy: https://etherscan.io/address/0x742C3cF9Af45f91B109a81EfEaf11535ECDe9571#code
    - 
cryptoswap:
    - two-coin proxy: https://etherscan.io/address/0x9f99FDe2ED3997EAfE52b78E3981b349fD2Eb8C9



okay so there is the factory. ownership of the pools go to the cryptoswap owner proxy, rewards are added via this proxy but is only callable by the ownership admin or the gauge_manager. so we need to call it from the gauge manager: then there is a gauge manager proxy -> if the gauge is deployed via this gauge manager proxy, msg.sender will be set as the gauge manager.
no migration needed as the permissionless rewards gauge version already existed once cryptoswap pools came out?