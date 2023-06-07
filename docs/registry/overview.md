The metaregistry is a [Curve Finance](https://curve.fi/) Pool Registry Aggregator that consolidates different registries used at Curve Finance for a single chain into a single contract.

The current version of the MetaRegistry aggregates of the following four child registries:

## **Mainnet:**
1. **`Curve Stable Registry`**: A registry of custom pool implementations deployed by Curve Core.  
2. **`Curve Stable Factory`**: A permissionless StableSwap pool factory, which also acts as a registry for pools that its users create.  
3. **`Curve Crypto Registry`**: A registry of custom CryptoSwap pool implementaions deployed by Curve Core.  
4. **`Curve Crypto Factory`**: A permissionless CryptoSwap pool factory, which also acts as a registry for pools that its users create.  

Each of the child registries are accompanied by a RegistryHandler, which is a contract that wraps around the child registry and enforces the abi implemented in the MetaRegistry. These registry handlers are then added to the MetaRegistry using the `MetaRegistry.add_registry_handler` method.

#### **Contract Deployments**
| Registry    | Address   | Chain |
| ----------- | -------| ----|
| `base_pool_registry` |  [0xDE3eAD9B2145bBA2EB74007e58ED07308716B725](https://etherscan.io/address/0xDE3eAD9B2145bBA2EB74007e58ED07308716B725#code) | ETH Mainnet |
| `crypto_registry` |  [0x9a32aF1A11D9c937aEa61A3790C2983257eA8Bc0](https://etherscan.io/address/0x9a32aF1A11D9c937aEa61A3790C2983257eA8Bc0#code) | ETH Mainnet |
| `stable_registry_handler` |  [0x46a8a9CF4Fc8e99EC3A14558ACABC1D93A27de68](https://etherscan.io/address/0x46a8a9CF4Fc8e99EC3A14558ACABC1D93A27de68#code)  | ETH Mainnet |
| `stable_factory_handler` |  [0x127db66E7F0b16470Bec194d0f496F9Fa065d0A9](https://etherscan.io/address/0x127db66E7F0b16470Bec194d0f496F9Fa065d0A9#code)  | ETH Mainnet |
| `crypto_registry_handler` |  [0x22ceb131d3170f9f2FeA6b4b1dE1B45fcfC86E56](https://etherscan.io/address/0x22ceb131d3170f9f2FeA6b4b1dE1B45fcfC86E56#code) | ETH Mainnet |
| `crypto_factory_handler` |  [0xC4F389020002396143B863F6325aA6ae481D19CE](https://etherscan.io/address/0xC4F389020002396143B863F6325aA6ae481D19CE#code)  | ETH Mainnet |
| `crvusd_pool_handler` |  [0x538E984C2d5f821d51932dd9C570Dff192D3DF2D](https://etherscan.io/address/0x538e984c2d5f821d51932dd9c570dff192d3df2d#code) | ETH Mainnet |
| `CurveTricryptoFactoryHandler` |  [0x9335bf643c455478f8be40fa20b5164b90215b80](https://etherscan.io/address/0x9335bf643c455478f8be40fa20b5164b90215b80#code) | ETH Mainnet |
| `MetaRegistry` |  [0xF98B45FA17DE75FB1aD0e7aFD971b0ca00e379fC](https://etherscan.io/address/0xF98B45FA17DE75FB1aD0e7aFD971b0ca00e379fC#code) | ETH Mainnet |

In principle, a child registry does not need a registry handler wrapper, if it already conforms to the MetaRegistry's abi standards. However, a wrapper around the child registries can be used to hotfix bugs detected in production when such fixes cannot be introduced to the child registry without significant breaking changes.


## **Who should use the MetaRegistry?**
Integrators find it quite challenging to integrate a protocol into their dapp if there are multiple on-chain registry stored in separate contracts: They do not have intrinsic knowledge in the protocol level to accommodate edge cases and onboard multiple registries. A single source of information that aggregates all registries makes integrations trivial. If you are an integrator looking to integrate Curve, the MetaRegistry is your best friend.


## **Setup**
Set up the python environment using the following steps: For more details please visit [Github](https://github.com/curvefi/metaregistry).

```shell
> python -m venv venv
> source ./venv/bin/active
> pip install --upgrade pip
> pip install -r ./requirements.txt
```

This project uses `eth-ape >= 0.4.0` developed at [Apeworx](https://apeworx.io/). The various plugins used are:  
1. `ape-vyper`  
2. `ape-hardhat`  
3. `ape-alchemy`  
4. `ape-ledger`  
5. `ape-etherscan`  

To install these, please follow instructions laid out in their respective Github repositories (by clicking on the links above).

Note: If you choose to run tests using `Alchemy` as the upstream provider, please set up an alchemy api key into an environment variable labelled `WEB3_ALCHEMY_PROJECT_ID` or `WEB3_ALCHEMY_API_KEY`. If you choose to use a local node (`geth` or `erigon`) please change the hardhat upstream provider for mainnet-fork to `geth` in [ape-config.yaml](https://github.com/curvefi/metaregistry/blob/main/ape-config.yaml):

```shell
hardhat:
    port: auto
    fork:
        ethereum:
            mainnet:
                upstream_provider: geth
                # upstream_provider: alchemy
```

## **Testing**
To run tests in interactive mode, please do the following:  

```shell
> ape test -I -s
```

## **Deployment**
First, set up your account in Ape. If you're using an EOA that is a cold wallet, please do:
```shell
> ape accounts import <alias>
```

This will prompt you for a private key. If your account is a ledger account, then follow:
```shell
> ape ledger add <alias>
```

To deploy, please use the following command (example deployment in mainnet-fork):
```shell
> ape run scripts/deploy.py main --network ethereum:mainnet-fork --account <your_account>
```

## **Adding Registries**
The following command simulates metaregistry setup. For Prod transactions, set network to anything that is not `ethereum:mainnet-fork` (so: `ethereum:mainnet:geth` or `ethereum:mainnet:alchemy` is fine.)
```shell
> ape run scripts/setup_metaregistry.py main --network ethereum:mainnet-fork --account <your_account>
```