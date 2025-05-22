<h1>Notebooks</h1>

Notebooks are easy-to-use notebooks written in Python aiming to showcase the usage of smart contracts and their functionalities. They can be interactively designed and directly run in the browser to make the user experience as easy and smooth as possible.

!!!github "GitHub"
    All hosted Jupyter notebooks can also be found in the [:material-github: `curve-notebooks`](https://github.com/CurveDocs/curve-notebook) repository. A full list of all hosted notebooks can be found [here](#notebook-list).


---

## **Google Colab and JupyterHub**

The first notebooks were hosted on a JupyterHub server maintained by the Vyper team. As that service is now deprecated, hosting was switched to [Google Colab](https://colab.google/).

---

## **Vyper and Titanoboa**

All Curve Smart Contracts are written in [Vyper](https://github.com/vyperlang).

For notebooks, mostly [Titanoboa](https://github.com/vyperlang/titanoboa) is used. Titanoboa is a Vyper interpreter with pretty tracebacks, forking, debugging features, and more! Titanoboa's goal is to provide a modern, advanced, and integrated development experience for Vyper users.

!!!colab "Notebook: Titanoboa Guide"
    A very simple notebook on the basic usage of Titanoboa and how it's used throughout all the notebooks can be found here: [https://colab.research.google.com/drive/1zHMuvNVZP8oB-Q1dA8NqgGLFpLI2JGni?usp=sharing](https://colab.research.google.com/drive/1zHMuvNVZP8oB-Q1dA8NqgGLFpLI2JGni).

---

## **How to run Notebooks**

For notebooks hosted on Google Colab, a user only needs to set up two "Secrets." For consistency, all notebooks use a secret named `RPC_ETHEREUM` for HTTP API keys (e.g., from [Alchemy](https://www.alchemy.com/)) and a `ETHERSCAN_API_KEY` secret holding a valid [Etherscan API key](https://docs.etherscan.io/getting-started/viewing-api-usage-statistics).

After setting up these two secrets, the notebook can successfully be run directly in the browser.

---

## **Notebook List**

### **Curve Lending**

| Contract | Description | Link    |
| :-------: | ----------- | :-----: |
| [`Vault`](../lending/contracts/vault.md) | Obtaining Vault Shares: `deposit` and `mint` | [:logos-googlecolab: here](https://colab.research.google.com/drive/1Qj9nOk5TYXp6j6go3VIh6--r5VILnoo9?usp=sharing)  |
| [`Vault`](../lending/contracts/vault.md) | Withdrawing Assets: `withdraw` and `redeem`  | [:logos-googlecolab: here](https://colab.research.google.com/drive/1Ta69fsIc7zmtjFlQ94a8MDYYLeo4GJJI?usp=sharing)  |
| [`OneWayLendingFactory`](../lending/contracts/oneway-factory.md) | Changing default borrow rates: `set_default_rates`  | [:logos-googlecolab: here](https://colab.research.google.com/drive/1mQV5yDyBqZrVSIOweP2g1Qu3WWjsgZtv?usp=sharing)  |
| [`OneWayLendingFactory`](../lending/contracts/oneway-factory.md) | Changing implementations: `set_implementations`  | [:logos-googlecolab: here](https://colab.research.google.com/drive/1r3Vhb28Wy8iX_YRBNpfnwjzS4dKuMADf?usp=sharing)  |
| [`Controller`](../crvUSD/controller.md) | Creating a simple loan: `create_loan` | [:logos-googlecolab: here](https://colab.research.google.com/drive/1MTtpbdeTDVB3LxzGhFc4vwLsDM_xJWKz?usp=sharing)  |
