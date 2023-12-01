The MetaRegistry is a Curve Finance **Pool Registry Aggregator** that consolidates different registries used at Curve Finance for a single chain into a single contract.

!!!deploy "Contract Source & Deployment"
    Currently, a MetaRegistry does not exist on other chains. Source code available on [Github](https://github.com/curvefi/metaregistry/blob/main/contracts/mainnet/MetaRegistry.vy).  
    The **MetaRegistry** contract is deployed to the Ethereum mainnet at: [0xF98B45FA17DE75FB1aD0e7aFD971b0ca00e379fC](https://etherscan.io/address/0xF98B45FA17DE75FB1aD0e7aFD971b0ca00e379fC#code).

The current MetaRegistry version consolidates multiple ChildRegistries, each accompanied by a RegistryHandler. The handler acts as a wrapper around its respective ChildRegistry, ensuring compatibility with the MetaRegistry's ABI standards.  
If a ChildRegistry already meets these standards, it doesn't require a handler. Nonetheless, wrappers can be used for hotfixing bugs in production, especially when direct modifications to the ChildRegistry would lead to significant breaking changes.


| Description | Registry Handler | Base Registry | 
| :---------: | :--------------: | :-----------: |
| `Curve Registry for v1` | [0x46a8a9CF4Fc8e99EC3A14558ACABC1D93A27de68](https://etherscan.io/address/0x46a8a9CF4Fc8e99EC3A14558ACABC1D93A27de68#code) | [0x90E00ACe148ca3b23Ac1bC8C240C2a7Dd9c2d7f5](https://etherscan.io/address/0x90E00ACe148ca3b23Ac1bC8C240C2a7Dd9c2d7f5#code) |
| `Curve Registry for v1 (latest)` | [0x127db66E7F0b16470Bec194d0f496F9Fa065d0A9](https://etherscan.io/address/0x127db66E7F0b16470Bec194d0f496F9Fa065d0A9#code) | [0xB9fC157394Af804a3578134A6585C0dc9cc990d4](https://etherscan.io/address/0xB9fC157394Af804a3578134A6585C0dc9cc990d4#code) |
| `Curve Registry for v2 Crypto` | [0x5f493fEE8D67D3AE3bA730827B34126CFcA0ae94](https://etherscan.io/address/0x5f493fEE8D67D3AE3bA730827B34126CFcA0ae94#code) | [0x9a32aF1A11D9c937aEa61A3790C2983257eA8Bc0](https://etherscan.io/address/0x9a32aF1A11D9c937aEa61A3790C2983257eA8Bc0#code) |
| `Curve Registry for v2 Factory` | [0xC4F389020002396143B863F6325aA6ae481D19CE](https://etherscan.io/address/0xC4F389020002396143B863F6325aA6ae481D19CE#code) |  [0xF18056Bbd320E96A48e3Fbf8bC061322531aac99](https://etherscan.io/address/0xF18056Bbd320E96A48e3Fbf8bC061322531aac99#code) |
| `crvUSD Pool Registry ` | [0x538E984C2d5f821d51932dd9C570Dff192D3DF2D](https://etherscan.io/address/0x538E984C2d5f821d51932dd9C570Dff192D3DF2D#code) |  [0x4F8846Ae9380B90d2E71D5e3D042dff3E7ebb40d](https://etherscan.io/address/0x4F8846Ae9380B90d2E71D5e3D042dff3E7ebb40d#code) |
| `Curve Tricrypto Factory` | [0x30a4249C42be05215b6063691949710592859697](https://etherscan.io/address/0x30a4249C42be05215b6063691949710592859697#code) | [0x0c0e5f2fF0ff18a3be9b835635039256dC4B4963](https://etherscan.io/address/0x0c0e5f2fF0ff18a3be9b835635039256dC4B4963#code) |
| `Curve BasePool Registry` |  | [0xDE3eAD9B2145bBA2EB74007e58ED07308716B725](https://etherscan.io/address/0xDE3eAD9B2145bBA2EB74007e58ED07308716B725#code) |

*These registry handlers are then added to the MetaRegistry using the **`add_registry_handler`** function, see [here](../registry/admin-controls.md#add_registry_handler).*


## **Who should use the MetaRegistry?**

Integrators often find it challenging to incorporate a protocol into their dapp when multiple on-chain registries are stored in separate contracts. They lack intrinsic, protocol-level knowledge to handle edge cases and onboard various registries. A single source that aggregates all registries can simplify integrations significantly.  

*If you're an integrator looking to integrate Curve, the MetaRegistry is an invaluable resource.*


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
