The MetaRegistry is a Curve Finance Pool Registry Aggregator that consolidates different registries used at Curve Finance for a single chain into a single contract.

The current version of the MetaRegistry aggregates the following six child registries:

## **Mainnet:**
1. **`Curve Stable Registry`**: A registry of custom pool implementations deployed by Curve Core.  
2. **`Curve Stable Factory`**: A permissionless StableSwap pool factory, also acts as a registry for pools its users create.  
3. **`Curve Crypto Registry`**: A registry of custom CryptoSwap pool implementations deployed by Curve Core.  
4. **`Curve Crypto Factory`**: A permissionless CryptoSwap pool factory, also acts as a registry for pools its users create.  
5. **`Curve Tricrypto Factory`**: A permissionless Tricrypto pool factory, which also acts as a registry for pools its users create.
6. **`Curve Stable Factory`**: A permissionless Tricrypto pool factory, also acts as a registry for pools its users create.


Each of the child registries are accompanied by a RegistryHandler, which is a contract that wraps around the child registry and enforces the abi implemented in the MetaRegistry. These registry handlers are then added to the MetaRegistry using the `MetaRegistry.add_registry_handler` method.

### **Contract Deployments**
| Description    | Contract Address   |
| ----------- | -------| 
| `MetaRegistry` |  [0xF98B45FA17DE75FB1aD0e7aFD971b0ca00e379fC](https://etherscan.io/address/0xF98B45FA17DE75FB1aD0e7aFD971b0ca00e379fC#code) |
| `BasePoolRegistry` |  [0xDE3eAD9B2145bBA2EB74007e58ED07308716B725](https://etherscan.io/address/0xDE3eAD9B2145bBA2EB74007e58ED07308716B725#code) | 
| `AddressProvider` |  [0x0000000022D53366457F9d5E68Ec105046FC4383](https://etherscan.io/address/0x0000000022D53366457F9d5E68Ec105046FC4383#code) | 
| `StableRegistry` |  [0x90E00ACe148ca3b23Ac1bC8C240C2a7Dd9c2d7f5](https://etherscan.io/address/0x90E00ACe148ca3b23Ac1bC8C240C2a7Dd9c2d7f5#code)  | 
| `StableRegistryHandler` |  [0x46a8a9CF4Fc8e99EC3A14558ACABC1D93A27de68](https://etherscan.io/address/0x46a8a9CF4Fc8e99EC3A14558ACABC1D93A27de68#code)  | 
| `MetaPoolFactory` |  [0xB9fC157394Af804a3578134A6585C0dc9cc990d4](https://etherscan.io/address/0xB9fC157394Af804a3578134A6585C0dc9cc990d4#code)  |
| `MetaPoolFactoryHandler` |  [0x127db66E7F0b16470Bec194d0f496F9Fa065d0A9](https://etherscan.io/address/0x127db66E7F0b16470Bec194d0f496F9Fa065d0A9#code)  |
| `CryptoSwapRegistry` |  [0x9a32aF1A11D9c937aEa61A3790C2983257eA8Bc0](https://etherscan.io/address/0x9a32aF1A11D9c937aEa61A3790C2983257eA8Bc0#code) |
| `CryptoSwapRegistryHandler` |  [0x22ceb131d3170f9f2FeA6b4b1dE1B45fcfC86E56](https://etherscan.io/address/0x22ceb131d3170f9f2FeA6b4b1dE1B45fcfC86E56#code) |
| `CryptoFactory` |  [0xF18056Bbd320E96A48e3Fbf8bC061322531aac99](https://etherscan.io/address/0xF18056Bbd320E96A48e3Fbf8bC061322531aac99#code) |
| `CryptoFactoryHandler` |  [0xC4F389020002396143B863F6325aA6ae481D19CE](https://etherscan.io/address/0xC4F389020002396143B863F6325aA6ae481D19CE#code)  |
| `CurveFactory` |  [0x4F8846Ae9380B90d2E71D5e3D042dff3E7ebb40d](https://etherscan.io/address/0x4F8846Ae9380B90d2E71D5e3D042dff3E7ebb40d#code) |
| `CurveFactoryHandler` |  [0x538E984C2d5f821d51932dd9C570Dff192D3DF2D](https://etherscan.io/address/0x538e984c2d5f821d51932dd9c570dff192d3df2d#code) |
| `CurveTricryptoFactory` |  [0x0c0e5f2fF0ff18a3be9b835635039256dC4B4963](https://etherscan.io/address/0x0c0e5f2fF0ff18a3be9b835635039256dC4B4963#code) |
| `CurveTricryptoFactoryHandler` |  [0x30a4249C42be05215b6063691949710592859697](https://etherscan.io/address/0x30a4249C42be05215b6063691949710592859697#code) |

A child registry does not need a registry handler wrapper if it already conforms to the MetaRegistry's ABI standards. However, a wrapper around the child registries can be used to hotfix bugs detected in production when such fixes cannot be introduced to the child registry without significant breaking changes.


## **Who should use the MetaRegistry?**
Integrators find it quite challenging to integrate a protocol into their dapp if multiple on-chain registries are stored in separate contracts: They do not have intrinsic knowledge at the protocol level to accommodate edge cases and onboard multiple registries. A single source of information that aggregates all registries makes integrations trivial. If you are an integrator looking to integrate Curve, the MetaRegistry is your best friend.


## **Setup**
Set up the Python environment using the following steps: Please visit [Github](https://github.com/curvefi/metaregistry) for more details.

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

To install these, please follow the instructions in their respective Github repositories (by clicking on the links above).

Note: If you choose to run tests using `Alchemy` as the upstream provider, please set up an Alchemy API key into an environment variable labeled `WEB3_ALCHEMY_PROJECT_ID` or `WEB3_ALCHEMY_API_KEY`. If you use a local node (`geth` or `erigon`), please change the hardhat upstream provider for mainnet-fork to `geth` in [ape-config.yaml](https://github.com/curvefi/metaregistry/blob/main/ape-config.yaml):

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
First, set up your account in Ape. If you're using an EOA that is a cold wallet, do:
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
