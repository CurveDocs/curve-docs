The MetaRegistry is a Curve Finance Pool Registry Aggregator that consolidates different registries used at Curve Finance for a single chain into a single contract.

!!!deploy "Contract Source & Deployment"
    **MetaRegistry** contract is deployed to the Ethereum mainnet at: [0xF98B45FA17DE75FB1aD0e7aFD971b0ca00e379fC](https://etherscan.io/address/0xF98B45FA17DE75FB1aD0e7aFD971b0ca00e379fC#code).  
    Source code available on [Github](https://github.com/curvefi/metaregistry/blob/main/contracts/mainnet/MetaRegistry.vy).

The current version of the MetaRegistry aggregates multiple **`ChildRegistries`**. Each of the child registries is accompanied by a **`RegistryHandler`**, a contract that wraps around the child registry and enforces the ABI implemented in the MetaRegistry.  
A ChildRegistry does not need a registry handler wrapper if it already conforms to the ABI standards of the MetaRegistry. However, a wrapper around the registries can be used to hotfix bugs detected in production when such fixes cannot be introduced to the child registry without significant breaking changes.


| Description | Registry Handler | Base Registry | 
| ----------- | ---------------- | ------------- |
| `Curve Registry Handler for v1 Registry` | [0x46a8a9CF4Fc8e99EC3A14558ACABC1D93A27de68](https://etherscan.io/address/0x46a8a9CF4Fc8e99EC3A14558ACABC1D93A27de68#code) | [0x90E00ACe148ca3b23Ac1bC8C240C2a7Dd9c2d7f5](https://etherscan.io/address/0x90E00ACe148ca3b23Ac1bC8C240C2a7Dd9c2d7f5#code) |
| `Curve Registry Handler for v1 Registry (latest)` | [0x127db66E7F0b16470Bec194d0f496F9Fa065d0A9](https://etherscan.io/address/0x127db66E7F0b16470Bec194d0f496F9Fa065d0A9#code) | [0xB9fC157394Af804a3578134A6585C0dc9cc990d4](https://etherscan.io/address/0xB9fC157394Af804a3578134A6585C0dc9cc990d4#code) |
| `Curve Registry Handler for v2 Crypto Registry` | [0x5f493fEE8D67D3AE3bA730827B34126CFcA0ae94](https://etherscan.io/address/0x5f493fEE8D67D3AE3bA730827B34126CFcA0ae94#code) | [0x9a32aF1A11D9c937aEa61A3790C2983257eA8Bc0](https://etherscan.io/address/0x9a32aF1A11D9c937aEa61A3790C2983257eA8Bc0#code) |
| `Curve Registry Handler for v2 Factory` | [0xC4F389020002396143B863F6325aA6ae481D19CE](https://etherscan.io/address/0xC4F389020002396143B863F6325aA6ae481D19CE#code) |  [0xF18056Bbd320E96A48e3Fbf8bC061322531aac99](https://etherscan.io/address/0xF18056Bbd320E96A48e3Fbf8bC061322531aac99#code) |
| `crvUSD Pool Registry ` | [0x538E984C2d5f821d51932dd9C570Dff192D3DF2D](https://etherscan.io/address/0x538E984C2d5f821d51932dd9C570Dff192D3DF2D#code) |  [0x4F8846Ae9380B90d2E71D5e3D042dff3E7ebb40d](https://etherscan.io/address/0x4F8846Ae9380B90d2E71D5e3D042dff3E7ebb40d#code) |
| `Curve TricryptoFactory Handler` | [0x30a4249C42be05215b6063691949710592859697](https://etherscan.io/address/0x30a4249C42be05215b6063691949710592859697#code) | [0x0c0e5f2fF0ff18a3be9b835635039256dC4B4963](https://etherscan.io/address/0x0c0e5f2fF0ff18a3be9b835635039256dC4B4963#code) |
| `Curve BasePool Registry` |  | [0xDE3eAD9B2145bBA2EB74007e58ED07308716B725](https://etherscan.io/address/0xDE3eAD9B2145bBA2EB74007e58ED07308716B725#code) |

*These registry handlers are then added to the MetaRegistry using the **`MetaRegistry.add_registry_handler`** method, see [here](../registry/admin_controls.md#add_registry_handler).*


## **Who should use the MetaRegistry?**

Integrators find it quite challenging to integrate a protocol into their dapp if there are multiple on-chain registry stored in separate contracts: They do not have intrinsic knowledge in the protocol level to accommodate edge cases and onboard multiple registries. A single source of information that aggregates all registries makes integrations trivial. If you are an integrator looking to integrate Curve, the MetaRegistry is your best friend.


## **Setup**
Set up the python environment using the following steps: Please visit [Github](https://github.com/curvefi/metaregistry) for more details.

```shell
> python -m venv venv
> source ./venv/bin/active
> pip install --upgrade pip
> pip install -r ./requirements.txt
```

This project uses **`eth-ape >= 0.5.2`** developed at [Apeworx](https://apeworx.io/). The various plugins used are:

- **`ape-vyper`**  
- **`ape-hardhat`**  
- **`ape-alchemy`**  
- **`ape-ledger`**  
- **`ape-etherscan`**  

To install these, please follow the instructions in their respective Github repositories.

!!!note
    If you choose to run tests using [**`Alchemy`**](https://www.alchemy.com/) as the upstream provider, please set up an Alchemy API key into an environment variable labeled **`WEB3_ALCHEMY_PROJECT_ID`** or **`WEB3_ALCHEMY_API_KEY`**. If you use a local node (**`geth`** or **`erigon`**), please change the hardhat upstream provider for mainnet-fork to **`geth`** in [ape-config.yaml](https://github.com/curvefi/metaregistry/blob/main/ape-config.yaml):

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
