Every FactoryContract from Curve comes with built-in functions designed to feed the [MetaRegistry](../registry/MetaRegistryAPI.md) with informations about the created pools. These functions will not be documented in this section. For more information, please read [here](../registry/overview.md).

!!! note
    The TricryptoFactory contract is deployed to the Ethereum mainnet at: [0x0c0e5f2fF0ff18a3be9b835635039256dC4B4963](https://etherscan.io/address/0x0c0e5f2fF0ff18a3be9b835635039256dC4B4963).
    Source code for this contract is available on [Github](https://github.com/curvefi/tricrypto-ng/blob/main/contracts/main/CurveTricryptoFactory.vy). 


Created pool are ERC20 implementations. Pool and Token is represented by the same contract.


## **Deploying Pools and Gauges**
Deploying pools via the factory requires the user to input certain parameters, which may have some limitations:

| Parameter   | Values   | Limitations |
| ----------- | ---------| ------------|
| `Name` |  Pool Name | no limitations |
| `Symbol` | Pool Symbol | no limitations  | 
| `Coins` |  Included Coins |  three coins; no duplicate coins possible  |
| `WETH` | WETH Address | - |
| `implementation_id` | Index of Pool Implementation | address of `implemention_id` cannot be `ZERO_ADDRESS`  |
| `A` |  Amplification Factor | $A_{min} - 1 < A < A_{max} + 1$ |
| `gamma` |  Gamma | $gamma_{min} - 1 < gamma < gamma_{max} + 1$ |
| `mid_fee` | Mid Fee | $fee_{mid} < fee_{max} - 1$; (`mid_fee` can be 0)|
| `out_fee` |  Out Fee | $fee_{out} >= fee_{mid}$ AND $fee_{out} < fee_{max} - 1$ |
| `fee_gamma` | Fee Gamma | $0 < gamma_{fee} < 10^{18} + 1$  |
| `allowed_extra_profit` | Allowed Extra Profit | $\text{allowed_extra_profit} < 10^{18} + 1$  |
| `adjustment_step` |   Adjustment Step | $0 < \text{adjustment_step} < 10^{18} + 1$  |
| `ma_exp_time` |   Exponention Moving Average Time | $86 < \text{ma_exp_time} < 872542$  |
| `initial_prices` |  Initial Prices |  $10^{6} < \text{initial_prices[0] and initial_prices[1]} < 10^{30}$ |


with: 

| Parameters    | Value |
|---------------|-------|
|$n_{coins}$ | $3$ |
|$A_{multiplier}$ | $10000$ |
|$A_{min}$      | $n_{coins}^{n_{coins}} * A_{multiplier} = 270000$ |
|$A_{max}$      | $1000 * A_{multiplier} * n_{coins}^{n_{coins}} = 270000000$|  
|$gamma_{min}$  | $10^{10} = 10000000000$|  
|$gamma_{max}$  | $5 * 10^{16} = 50000000000000000$ |
|$fee_{max}$   | $10 * 10^{9} = 10000000000$ |



### `deploy_pool`
!!! description "`Factory.deploy_pool(_name: String[64], _symbol: String[32], _coins: address[N_COINS], _weth: address, implementation_id: uint256, A: uint256, gamma: uint256, mid_fee: uint256, out_fee: uint256, fee_gamma: uint256, allowed_extra_profit: uint256, adjustment_step: uint256, ma_exp_time: uint256, initial_prices: uint256[N_COINS-1],) -> address:`"

    Function to deploy a liquidity pool.

    Returns: deplyoed pool (`address`).

    Emits event: `TricryptoPoolDeployed`

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_name` |  `String[64]` | Pool Name |
    | `_symbol` |  `String[32]` | Pool Symbol |
    | `_coins` |  `address[N_COINS]` | Included Coins |
    | `_weth` |  `address` | WETH Address |
    | `implementation_id` |  `uint256` | Index of Pool Implementation |
    | `A` |  `uint256` | Amplification Factor |
    | `gamma` |  `uint256` | Gamma |
    | `mid_fee` |  `uint256` | Mid Fee |
    | `out_fee` |  `uint256` | Out Fee |
    | `fee_gamma` |  `uint256` | Fee Gamma |
    | `allowed_extra_profit` |  `uint256` | Allowed Extra Profit |
    | `adjustment_step` |  `uint256` | Adjustment Step |
    | `ma_exp_time` |  `uint256` | Exponention Moving Average Time |
    | `initial_prices` |  `uint256[N_COINS-1]` | Initial Prices |

    ??? quote "Source code"

        ```python hl_lines="1"
        event TricryptoPoolDeployed:
            pool: address
            name: String[64]
            symbol: String[32]
            weth: address
            coins: address[N_COINS]
            math: address
            salt: bytes32
            packed_precisions: uint256
            packed_A_gamma: uint256
            packed_fee_params: uint256
            packed_rebalancing_params: uint256
            packed_prices: uint256
            deployer: address

        N_COINS: constant(uint256) = 3
        A_MULTIPLIER: constant(uint256) = 10000

        MAX_FEE: constant(uint256) = 10 * 10 ** 9

        MIN_GAMMA: constant(uint256) = 10 ** 10
        MAX_GAMMA: constant(uint256) = 5 * 10**16

        MIN_A: constant(uint256) = N_COINS ** N_COINS * A_MULTIPLIER / 100
        MAX_A: constant(uint256) = 1000 * A_MULTIPLIER * N_COINS**N_COINS

        PRICE_SIZE: constant(uint128) = 256 / (N_COINS - 1)
        PRICE_MASK: constant(uint256) = 2**PRICE_SIZE - 1

        @external
        def deploy_pool(
            _name: String[64],
            _symbol: String[32],
            _coins: address[N_COINS],
            _weth: address,
            implementation_id: uint256,
            A: uint256,
            gamma: uint256,
            mid_fee: uint256,
            out_fee: uint256,
            fee_gamma: uint256,
            allowed_extra_profit: uint256,
            adjustment_step: uint256,
            ma_exp_time: uint256,
            initial_prices: uint256[N_COINS-1],
        ) -> address:
            """
            @notice Deploy a new pool
            @param _name Name of the new plain pool
            @param _symbol Symbol for the new plain pool - will be concatenated with factory symbol

            @return Address of the deployed pool
            """
            pool_implementation: address = self.pool_implementations[implementation_id]
            assert pool_implementation != empty(address), "Pool implementation not set"

            # Validate parameters
            assert A > MIN_A-1
            assert A < MAX_A+1

            assert gamma > MIN_GAMMA-1
            assert gamma < MAX_GAMMA+1

            assert mid_fee < MAX_FEE-1  # mid_fee can be zero
            assert out_fee >= mid_fee
            assert out_fee < MAX_FEE-1
            assert fee_gamma < 10**18+1
            assert fee_gamma > 0

            assert allowed_extra_profit < 10**18+1

            assert adjustment_step < 10**18+1
            assert adjustment_step > 0

            assert ma_exp_time < 872542  # 7 * 24 * 60 * 60 / ln(2)
            assert ma_exp_time > 86  # 60 / ln(2)

            assert min(initial_prices[0], initial_prices[1]) > 10**6
            assert max(initial_prices[0], initial_prices[1]) < 10**30

            assert _coins[0] != _coins[1] and _coins[1] != _coins[2] and _coins[0] != _coins[2], "Duplicate coins"

            decimals: uint256[N_COINS] = empty(uint256[N_COINS])
            precisions: uint256[N_COINS] = empty(uint256[N_COINS])
            for i in range(N_COINS):
                d: uint256 = ERC20(_coins[i]).decimals()
                assert d < 19, "Max 18 decimals for coins"
                decimals[i] = d
                precisions[i] = 10** (18 - d)

            # pack precisions
            packed_precisions: uint256 = self._pack(precisions)

            # pack fees
            packed_fee_params: uint256 = self._pack(
                [mid_fee, out_fee, fee_gamma]
            )

            # pack liquidity rebalancing params
            packed_rebalancing_params: uint256 = self._pack(
                [allowed_extra_profit, adjustment_step, ma_exp_time]
            )

            # pack A_gamma
            packed_A_gamma: uint256 = A << 128
            packed_A_gamma = packed_A_gamma | gamma

            # pack initial prices
            packed_prices: uint256 = 0
            for k in range(N_COINS - 1):
                packed_prices = packed_prices << PRICE_SIZE
                p: uint256 = initial_prices[N_COINS - 2 - k]
                assert p < PRICE_MASK
                packed_prices = p | packed_prices

            # pool is an ERC20 implementation
            _salt: bytes32 = block.prevhash
            _math_implementation: address = self.math_implementation
            pool: address = create_from_blueprint(
                pool_implementation,
                _name,
                _symbol,
                _coins,
                _math_implementation,
                _weth,
                _salt,
                packed_precisions,
                packed_A_gamma,
                packed_fee_params,
                packed_rebalancing_params,
                packed_prices,
                code_offset=3
            )

            # populate pool data
            length: uint256 = self.pool_count
            self.pool_list[length] = pool
            self.pool_count = length + 1
            self.pool_data[pool].decimals = decimals
            self.pool_data[pool].coins = _coins

            # add coins to market:
            self._add_coins_to_market(_coins[0], _coins[1], pool)
            self._add_coins_to_market(_coins[0], _coins[2], pool)
            self._add_coins_to_market(_coins[1], _coins[2], pool)

            log TricryptoPoolDeployed(
                pool,
                _name,
                _symbol,
                _weth,
                _coins,
                _math_implementation,
                _salt,
                packed_precisions,
                packed_A_gamma,
                packed_fee_params,
                packed_rebalancing_params,
                packed_prices,
                msg.sender,
            )

            return pool
        ```

    === "Example"

        ```shell
        >>> Factory.deploy_pool("todo")
        '0x66442B0C5260B92cAa9c234ECf2408CBf6b19a6f'
        ```


### `deploy_gauge`
!!! description "`Factory.deploy_gauge(_pool: address) -> address:`"

    Function to deploy a gauge for `_pool`, which was created through this contract. This function checks if there is actually `_pool` created through this contract, if there wasn't already a gauge deployed and if the gauge implementation is actually set. Then creates a gauge from a blueprint contract (`gauge_implementation`).

    Returns: gauge (`address`).

    Emits event: `LiquidityGaugeDeployed`

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_pool` |  `address` | Pool to deploy Gauge for |

    ??? quote "Source code"

        ```python hl_lines="1"
        event LiquidityGaugeDeployed:
            pool: address
            gauge: address

        pool_data: HashMap[address, PoolArray]

        @external
        def deploy_gauge(_pool: address) -> address:
            """
            @notice Deploy a liquidity gauge for a factory pool
            @param _pool Factory pool address to deploy a gauge for
            @return Address of the deployed gauge
            """
            assert self.pool_data[_pool].coins[0] != empty(address), "Unknown pool"
            assert self.pool_data[_pool].liquidity_gauge == empty(address), "Gauge already deployed"
            assert self.gauge_implementation != empty(address), "Gauge implementation not set"

            gauge: address = create_from_blueprint(self.gauge_implementation, _pool, code_offset=3)
            self.pool_data[_pool].liquidity_gauge = gauge

            log LiquidityGaugeDeployed(_pool, gauge)
            return gauge
        ```

    === "Example"

        ```shell
        >>> Factory.deploy_gauge("todo)
        'todo'
        ```



## **Admin Controls**
The contract contains the typical admin controls. Ownership can be transferred, and fee receivers can be changed.

### `admin`
!!! description "`Factory.admin() -> address: view`"

    Getter for the `admin` of the contract.

    Returns: admin (`address`).

    ??? quote "Source code"

        ```python hl_lines"1"
        admin: public(address)

        @external
        def __init__(_fee_receiver: address, _admin: address):

            self.fee_receiver = _fee_receiver
            self.admin = _admin

            log UpdateFeeReceiver(empty(address), _fee_receiver)
            log TransferOwnership(empty(address), _admin)
        ```

    === "Example"
        ```shell
        >>> Factory.admin()
        '0x40907540d8a6C65c637785e8f8B742ae6b0b9968'
        ```


### `future_admin`
!!! description "`Factory.future_admin() -> address: view`"

    Getter for the `future_admin` of the contract.

    Returns: future admin (`address`).

    ??? quote "Source code"

        ```python hl_lines"1"
        admin: public(address)

        @external
        def __init__(_fee_receiver: address, _admin: address):

            self.fee_receiver = _fee_receiver
            self.admin = _admin

            log UpdateFeeReceiver(empty(address), _fee_receiver)
            log TransferOwnership(empty(address), _admin)
        ```

    === "Example"
        ```shell
        >>> Factory.future_admin()
        '0x40907540d8a6C65c637785e8f8B742ae6b0b9968'
        ```


### `fee_receiver`
!!! description "`Factory.fee_receiver() -> address: view`"

    Getter for the `fee_receiver` of the contract. This address is receiving the admin fees of all pools deployed through this contract when calling `claim_admin_fees()`.

    Returns: fee receiver (`address`).

    ??? quote "Source code"

        ```python hl_lines"1"
        admin: public(address)

        @external
        def __init__(_fee_receiver: address, _admin: address):

            self.fee_receiver = _fee_receiver
            self.admin = _admin

            log UpdateFeeReceiver(empty(address), _fee_receiver)
            log TransferOwnership(empty(address), _admin)
        ```

    === "Example"
        ```shell
        >>> Factory.future_admin()
        '0x40907540d8a6C65c637785e8f8B742ae6b0b9968'
        ```


### `set_fee_receiver`
!!! description "`Factory.set_fee_receiver(_fee_receiver: address):`"

    Function to set a new `fee_receiver` address.

    Emits event: `UpdateFeeReceiver`

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_fee_receiver` |  `address` | New Fee Receiver Address |

    !!!note
        This function is only callable by the `admin` of the contract.

    ??? quote "Source code"

        ```python hl_lines="1"
        event UpdateFeeReceiver:
            _old_fee_receiver: address
            _new_fee_receiver: address

        admin: public(address) 
        fee_receiver: public(address)

        @external
        def set_fee_receiver(_fee_receiver: address):
            """
            @notice Set fee receiver
            @param _fee_receiver Address that fees are sent to
            """
            assert msg.sender == self.admin, "dev: admin only"

            log UpdateFeeReceiver(self.fee_receiver, _fee_receiver)
            self.fee_receiver = _fee_receiver
        ```

    === "Example"
        ```shell
        >>> Factory.set_fee_receiver("todo")
        'todo'
        ```


### `commit_transfer_ownership`
!!! description "`Factory.commit_transfer_ownership(_addr: address):`"

    Function to commit the transfer of ownership of the contract to `_addr`. Calling this function sets `future_admin` to `_addr` which then needs to be accepted by calling `accept_transfer_ownership`.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_addr` |  `address` | Address to commit the transfer of ownership to |

    !!!note
        This function is only callable by the `admin` of the contract.

    ??? quote "Source code"

        ```python hl_lines="1"
        future_admin: public(address)    

        @external
        def commit_transfer_ownership(_addr: address):
            """
            @notice Transfer ownership of this contract to `addr`
            @param _addr Address of the new owner
            """
            assert msg.sender == self.admin, "dev: admin only"

            self.future_admin = _addr
        ```

    === "Example"
        ```shell
        >>> Factory.commit_transfer_ownership("todo")
        'todo'
        ```


### `accept_transfer_ownership`
!!! description "`Factory.accept_transfer_ownership(_addr: address):`"

    Function to accept ownership changes and set `future_admin` to `msg.sender` (which is `future_admin`).

    Emits event: `TransferOwnership`

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_fee_receiver` |  `address` | New Fee Receiver Address |

    !!!note
        This function is only callable by the `future_admin` of the contract.

    ??? quote "Source code"

        ```python hl_lines="1"
        event TransferOwnership:
            _old_owner: address
            _new_owner: address

        admin: public(address) 
        future_admin: public(address)    

        @external
        def accept_transfer_ownership():
            """
            @notice Accept a pending ownership transfer
            @dev Only callable by the new owner
            """
            assert msg.sender == self.future_admin, "dev: future admin only"

            log TransferOwnership(self.admin, msg.sender)
            self.admin = msg.sender
        ```

    === "Example"
        ```shell
        >>> Factory.accept_transfer_ownership("todo")
        'todo'
        ```
