<h1>Incentives Manager</h1>

The `IncentivesManager.vy` contract is mainly used to post voting incentives aka. bribes for specific gauges. The contract receives `crvUSD` tokens form the `FeeSplitter.vy` which are then spent on voting incentives. Voting incentives are used to incentivise veCRV holders to allocate their voting power to specific gauges.

!!!github "GitHub"
    The source code for the `IncentivesManager.vy`  contract can be found on [GitHub :material-github:](tbd).

The contract uses a [snekmate module](https://github.com/pcaversaccio/snekmate/blob/main/src/snekmate/auth/access_control.vy) to handle role-based access control. The roles are strictly sperated from each other and each one has its own scope. This documentation will not cover the access control module in much detail as it is very well documented GitHub itself: [:snake: Snakemate](https://github.com/pcaversaccio/snekmate)


---


## **Voting Incentives (Bribes)**

Voting incentives are posted for individual gauges and follow a specific `bribe_logic`. New bribes can only be posted by a designated role defined in `BRIBE_POSTER`.

All individual gauges have `gauge_caps`, which limit the amount of incentives that can be added in a single `post_bribe` function call. Each cap is set to `0` by default. Therefore, before any incentives can be added, the cap must be raised by the `BRIBE_MANAGER` using the `set_gauge_cap` function. The gauge cap cannot exceed `MAX_INCENTIVES_PER_GAUGE`, which is set to 100,000 tokens.

However, this cap applies only to a single `post_bribe` call and does not act as a total cap on incentives. It serves primarily to prevent accidentally posting excessively large amounts. The gauge cap can easily be exceeded by posting multiple bribes for the same gauge. 


### `post_bribe`
!!! description "`IncentivesManager.post_bribe(gauge: address, amount: uint256, data: Bytes[1024])`"

    !!!guard "Guarded Method"
        The `post_bribe` function is only callable by the `BRIBE_POSTER` role. 
        
        *The contract uses the snekmate access control module to check the roles:*

        ???quote "Snekmate: Access Control Module"
            
            ```py
            # @dev Returns `True` if `account` has been granted `role`.
            hasRole: public(HashMap[bytes32, HashMap[address, bool]])

            @internal
            @view
            def _check_role(role: bytes32, account: address):
                """
                @dev Reverts with a standard message if `account`
                    is missing `role`.
                @param role The 32-byte role definition.
                @param account The 20-byte address of the account.
                """
                assert self.hasRole[role][account], "access_control: account is missing role"
            ```

    Function to post a bribe for `gauge` using `amount` of incentives with additional `data`. The maximum amount of incentives per `post_bribe` call is set to `gauge_cap`. Nontheless, the `gauge_cap` does not really cap the total amount of incentives per gauge, it rather is used as a prevention for fatfingering big amounts. The `post_bribe` function can be called multiple times on a single gauge to exceed the `gauge_cap`.

    | Input    | Type          | Description                            |
    | -------- | ------------- | -------------------------------------- |
    | `gauge`  | `address`     | Gauge address to post a bribe for      |
    | `amount` | `uint256`     | Amount of incentives to be allocated   |
    | `data`   | `Bytes[1024]` | Additional data relevant for the bribe |

    ??? quote "Source code"

        === "IncentivesManager.vy"

            ```python
            managed_asset: IERC20
            bribe_logic: public(IBribeLogic)
            gauge_caps: public(HashMap[address, uint256])

            @external
            def post_bribe(gauge: address, amount: uint256, data: Bytes[1024]):
                """
                @notice post a bribe using the `bribe_logic` contract.
                @dev This function temporarily approves the specified
                amount of token to be spent by the bribe logic contract.
                @param amount The amount of incentives to be allocated for this bribe
                @param gauge The gauge for which the bounty is being posted.
                @param data Additional data that are relevant for the bounty.
                """
                access_control._check_role(BRIBE_POSTER, msg.sender)

                assert amount <= self.gauge_caps[gauge], "manager: bribe exceeds cap"

                extcall self.managed_asset.transfer(self.bribe_logic.address, amount)
                extcall self.bribe_logic.bribe(gauge, amount, data)

                assert staticcall self.managed_asset.balanceOf(self.bribe_logic.address) == 0, "manager: bribe not fully spent"
            ```

    === "Example"

        ```shell
        >>> soon
        ```


### `bribe_logic`
!!! description "`IncentivesManager.bribe_logic() -> address: view`"

    Getter for the contract containing the actual bribe logic to post bribes in the preferred protocol.

    Returns: bribe logic contract (`address`).

    ??? quote "Source code"

        === "IncentivesManager.vy"

            ```python
            import IBribeLogic

            bribe_logic: public(IBribeLogic)
            ```

        === "IBribeLogic.vyi"

            todo

            ```python
            MAX_BRIBE_PAYLOAD_SIZE: constant(uint256) = 1024

            @external
            def bribe(gauge: address, amount: uint256, data: Bytes[MAX_BRIBE_PAYLOAD_SIZE]):
                ...
            ```

    === "Example"

        ```shell
        >>> IncentivesManager.bribe_logic()
        'todo'
        ```


### `gauge_caps`
!!! description "`IncentivesManager.gauge_caps(arg0: address) -> uint256: view`"

    Getter for the gauge cap per inidvidual incentive add for a single gauge. These are no absolute gauge caps for incentives, but rather gauge caps per single bribe. Main usecause of this cap is to prevent fatfinger too much incentives. The cap for a single gauge can be exceeded by calling the `post_bribe` function for the same gauge multiple time. The `gauge_caps` variable can be set by the `BRIBE_MANAGER` using the `set_gauge_cap` function.

    Returns: gauge cap (`uint256`).

    | Input  | Type      | Description                        |
    | ------ | --------- | ---------------------------------- |
    | `arg0` | `address` | Gauge address to check the cap for |

    ??? quote "Source code"

        === "IncentivesManager.vy"

            ```python
            gauge_caps: public(HashMap[address, uint256])
            ```

    === "Example"

        ```shell
        >>> IncentivesManager.gauge_cap('todo')
        ''
        ```


### `managed_asset`
!!! description "`IncentivesManager.managed_asset() -> address: view`"

    Getter for the managed asset. This is the asset used for posting bribes.

    Returns: managed asset (`address`).

    ??? quote "Source code"

        === "IncentivesManager.vy"

            ```python
            managed_asset: IERC20

            @deploy
            def __init__(managed_asset: address, bribe_manager: address, bribe_poster: address, token_rescuer: address, emergency_admin: address):
                """
                @dev After this function is called ownership of the contract is
                    renounced making it impossible.
                @param bribe_poster The entity in charge of posting bribes
                @param bribe_manager The entity in charge of whitelisting gauges and
                    updating the bribe logic (in case the voting market has to be changed)
                @param token_rescuer The entity in charge of rescuing unmanaged funds
                    if necessary
                @param emergency_admin The entity in charge of moving the funds elsewhere in
                case of emergency.
                """
                assert managed_asset != empty(address), "zeroaddr: managed_asset"
                ...
                self.managed_asset = IERC20(managed_asset)
                ...
            ```

    === "Example"

        ```shell
        >>> IncentivesManager.managed_asset()
        '0xf939E0A03FB07F59A73314E73794Be0E57ac1b4E'
        ```


### `MAX_INCENTIVES_PER_GAUGE`
!!! description "`IncentivesManager.MAX_INCENTIVES_PER_GAUGE() -> uint256: view`"

    Getter for the maximum amount of incentives to be posted in a single bribe. This threshold is in place to avoid fatfingering to big amounts of incentives or posting bribes to a wrong gauge. It can be exceeded by posting multiple bribes for the same gauge. todo

    Returns: maximum incentives per gauge (`uint256`).

    ??? quote "Source code"

        === "IncentivesManager.vy"

            ```python
            MAX_INCENTIVES_PER_GAUGE: public(constant(uint256)) = 10**23 # 100.000 tokens (crvUSD)
            ```

    === "Example"

        ```shell
        >>> IncentivesManager.MAX_INCENTIVES_PER_GAUGE()
        100000000000000000000000            # 100,000 tokens (crvUSD)
        ```


### `set_gauge_cap`
!!! description "`IncentivesManager.set_gauge_cap(gauge: address, cap: uint256)`"

    !!!guard "Guarded Method"
        The `set_gauge_cap` function is only callable by the `BRIBE_MANAGER` role. 
        
        *The contract uses the snekmate access control module to check the roles:*

        ???quote "Snekmate: Access Control Module"

            todo
            
            ```py
            # @dev Returns `True` if `account` has been granted `role`.
            hasRole: public(HashMap[bytes32, HashMap[address, bool]])

            @internal
            @view
            def _check_role(role: bytes32, account: address):
                """
                @dev Reverts with a standard message if `account`
                    is missing `role`.
                @param role The 32-byte role definition.
                @param account The 20-byte address of the account.
                """
                assert self.hasRole[role][account], "access_control: account is missing role"
            ```

    Function to set or change the maximum amount of voting incentives that can be allowed in a single bribe. This function is used to prevent fatfingering too large amounts or posting the incentives to a wrong gauge. The value for gauges is set to zero by default to prevent incentives from being posted before the `gauge_cap` was updated. Additionally, the gauge cap for a singel gauge can not exceed `MAX_INCENTIVES_PER_GAUGE`, which is set to `10**23` or 100,000 crvUSD tokens.

    Emits: `SetGaugeCap`

    | Input   | Type      | Description                                                 |
    | ------- | --------- | ----------------------------------------------------------- |
    | `gauge` | `address` | Gauge address to set the gauge cap for                      |
    | `cap`   | `uint256` | Maximum amount of incentives that can be allocated at once  |

    ??? quote "Source code"

        === "IncentivesManager.vy"

            ```python
            event SetGaugeCap:
                gauge: address
                cap: uint256

            gauge_caps: public(HashMap[address, uint256])

            @external
            def set_gauge_cap(gauge: address, cap: uint256):
                """
                @notice Setter to change the maximum amount of voting incentives
                    that can be allocated in a single bounty.
                @dev This function is a safeguard to prevent fatfingering large
                    amounts or bribing the wrong gauge. This **does not**
                    prevent spending more than `MAX_INCENTIVES_PER_GAUGE`
                    since one can create multiple bouties for the same gauge
                @param gauge Targeted gauge for the udpate of the caps
                @param cap Maximum amount of incentives that can be allocated
                    at once. Set to zero to prevent incentives from being
                    posted.
                """
                access_control._check_role(BRIBE_MANAGER, msg.sender)

                assert cap <= MAX_INCENTIVES_PER_GAUGE, "manager: new bribe cap too big"

                self.gauge_caps[gauge] = cap

                log SetGaugeCap(gauge, cap)
            ```

    === "Example"

        ```shell
        >>> IncentivesManager.gauge_caps('gauge')
        0

        >>> IncentivesManager.set_gauge_cap(10000000000000000000000)
        
        >>> IncentivesManager.gauge_caps('gauge')
        10000000000000000000000
        ```


### `set_bribe_logic`
!!! description "`IncentivesManager.set_bribe_logic(bribe_logic: address)`"

    !!!guard "Guarded Method"
        The `set_bribe_logic` function is only callable by the `BRIBE_MANAGER` role. 
        
        *The contract uses the snekmate access control module to check the roles:*

        ???quote "Snekmate: Access Control Module"

            todo
            
            ```py
            # @dev Returns `True` if `account` has been granted `role`.
            hasRole: public(HashMap[bytes32, HashMap[address, bool]])

            @internal
            @view
            def _check_role(role: bytes32, account: address):
                """
                @dev Reverts with a standard message if `account`
                    is missing `role`.
                @param role The 32-byte role definition.
                @param account The 20-byte address of the account.
                """
                assert self.hasRole[role][account], "access_control: account is missing role"
            ```

    !!!warning
        The new contract should carefully be vetted before calling this function to make sure it can't steal funds/do something it's not supposed to with them.

    Function to set the pointer to the contract with the logic to post bribes. Since multiple protocols offer bribe services this function avoids vendor lock-in.

    Emits: `SetBribeLogic`

    | Input         | Type      | Description                                                 |
    | ------------- | --------- | ----------------------------------------------------------- |
    | `bribe_logic` | `address` | Contract address that contains the logic for posting bribes |

    ??? quote "Source code"

        === "IncentivesManager.vy"

            ```python
            import IBribeLogic

            event SetBribeLogic:
                bribe_logic: address

            bribe_logic: public(IBribeLogic)

            @external
            def set_bribe_logic(bribe_logic: address):
                """
                @notice Change the pointer to the contract with the logic to post
                    bribes. Since multiple protocols offer bribe services this
                    function avoids vendor lock-in.
                @dev The new contract should carefully be vetted before calling this
                    function to make sure it can't steal funds/do something it's not
                    supposed to with them.
                @param bribe_logic The new contract that contains the actaul logic
                    to post bribes in the preferred protocol.
                """
                access_control._check_role(BRIBE_MANAGER, msg.sender)

                self.bribe_logic = IBribeLogic(bribe_logic)

                log SetBribeLogic(bribe_logic)
            ```

    === "Example"

        ```shell
        >>> IncentivesManager.bribe_logic()
        'todo'

        >>> IncentivesManager.set_bribe_logic('todo')
        
        >>> IncentivesManager.bribe_logic()
        'todo'
        ```


---


## **Roles**

!!!snekmate "Snekmate"
    The contract uses Multi-Role-Based Access Control Functions from the `access_control.vy` Snekmate module. These functions can be used to implement role-based access control mechanisms. Roles are referred to by their `bytes32` identifier.

    Source code for the Snekmate modules can be found on [:material-github: GitHub](https://github.com/pcaversaccio/snekmate).


### `BRIBE_POSTER`
!!! description "`IncentivesManager.BRIBE_POSTER() -> bytes32: view`"

    Getter for the role allowed to post birbes using the `post_bribe` function.

    Returns: bribe poster role (`bytes32`).

    ??? quote "Source code"

        === "IncentivesManager.vy"

            ```python
            BRIBE_POSTER: public(constant(bytes32)) = keccak256("BRIBE_POSTER")

            @deploy
            def __init__(managed_asset: address, bribe_manager: address, bribe_poster: address, token_rescuer: address, emergency_admin: address):
                """
                @dev After this function is called ownership of the contract is
                    renounced making it impossible.
                @param bribe_poster The entity in charge of posting bribes
                @param bribe_manager The entity in charge of whitelisting gauges and
                    updating the bribe logic (in case the voting market has to be changed)
                @param token_rescuer The entity in charge of rescuing unmanaged funds
                    if necessary
                @param emergency_admin The entity in charge of moving the funds elsewhere in
                case of emergency.
                """
                ...
                assert bribe_poster != empty(address), "zeroaddr: bribe_poster"
                ...
                access_control._grant_role(BRIBE_POSTER, bribe_poster)
                ...
            ```

    === "Example"

        ```shell
        >>> IncentivesManager.BRIBE_POSTER()
        'todo'
        ```


### `BRIBE_MANAGER`
!!! description "`IncentivesManager.BRIBE_MANAGER() -> bytes32: view`"

    Getter for the role allowed to change the `bribe_logic` via `set_bribe_logic` and `gauge_caps` via `set_gauge_cap`.

    Returns: bribe manager role (`bytes32`).

    ??? quote "Source code"

        === "IncentivesManager.vy"

            ```python
            BRIBE_MANAGER: public(constant(bytes32)) = keccak256("BRIBE_MANAGER")

            @deploy
            def __init__(managed_asset: address, bribe_manager: address, bribe_poster: address, token_rescuer: address, emergency_admin: address):
                """
                @dev After this function is called ownership of the contract is
                    renounced making it impossible.
                @param bribe_poster The entity in charge of posting bribes
                @param bribe_manager The entity in charge of whitelisting gauges and
                    updating the bribe logic (in case the voting market has to be changed)
                @param token_rescuer The entity in charge of rescuing unmanaged funds
                    if necessary
                @param emergency_admin The entity in charge of moving the funds elsewhere in
                case of emergency.
                """
                ...
                assert bribe_manager != empty(address), "zeroaddr: bribe_manager"
                ...
                access_control._grant_role(BRIBE_MANAGER, bribe_manager)
                ...
            ```

    === "Example"

        ```shell
        >>> IncentivesManager.BRIBE_MANAGER()
        'todo'
        ```


### `TOKEN_RESCUER`
!!! description "`IncentivesManager.TOKEN_RESCUER() -> bytes32: view`"

    Getter for the role allowed to recover any non-crvusd ERC-20 tokens via the `recover_erc20` function from the contract by transfering the token balance to a determined receiver address.

    Returns: token rescure role (`bytes32`).

    ??? quote "Source code"

        === "IncentivesManager.vy"

            ```python
            TOKEN_RESCUER: public(constant(bytes32)) = keccak256("TOKEN_RESCUER")

            @deploy
            def __init__(managed_asset: address, bribe_manager: address, bribe_poster: address, token_rescuer: address, emergency_admin: address):
                """
                @dev After this function is called ownership of the contract is
                    renounced making it impossible.
                @param bribe_poster The entity in charge of posting bribes
                @param bribe_manager The entity in charge of whitelisting gauges and
                    updating the bribe logic (in case the voting market has to be changed)
                @param token_rescuer The entity in charge of rescuing unmanaged funds
                    if necessary
                @param emergency_admin The entity in charge of moving the funds elsewhere in
                case of emergency.
                """
                ...
                assert token_rescuer != empty(address), "zeroaddr: token_rescuer"
                ...
                access_control._grant_role(TOKEN_RESCUER, token_rescuer)
                ...
            ```

    === "Example"

        ```shell
        >>> IncentivesManager.TOKEN_RESCUER()
        'todo'
        ```


### `EMERGENCY_ADMIN`
!!! description "`IncentivesManager.EMERGENCY_ADMIN() -> bytes32: view`"

    Getter for the role allowed to migrate or recover `managed_asset` tokens via the `emergency_migration` function from the contract by transfering all tokens to a determined receiver address.

    Returns: emergency admin role (`bytes32`).

    ??? quote "Source code"

        === "IncentivesManager.vy"

            ```python
            EMERGENCY_ADMIN: public(constant(bytes32)) = keccak256("EMERGENCY_ADMIN")

            @deploy
            def __init__(managed_asset: address, bribe_manager: address, bribe_poster: address, token_rescuer: address, emergency_admin: address):
                """
                @dev After this function is called ownership of the contract is
                    renounced making it impossible.
                @param bribe_poster The entity in charge of posting bribes
                @param bribe_manager The entity in charge of whitelisting gauges and
                    updating the bribe logic (in case the voting market has to be changed)
                @param token_rescuer The entity in charge of rescuing unmanaged funds
                    if necessary
                @param emergency_admin The entity in charge of moving the funds elsewhere in
                case of emergency.
                """
                ...
                assert emergency_admin != empty(address), "zeroaddr: emergency_admin"
                ...
                access_control._grant_role(EMERGENCY_ADMIN, emergency_admin)
                ...
            ```

    === "Example"

        ```shell
        >>> IncentivesManager.EMERGENCY_ADMIN()
        'todo'
        ```


---


## **Recovering Tokens**

*There are two functions to recover or migrate tokens from the contract to an external address:*

- Recover any ERC-20 token (except the managed one) using [`recover_erc20`](#recover_erc20).
- Migrate the managed asset (crvUSD) using [`emergency_migration`](#emergency_migration).


### `recover_erc20`
!!! description "`IncentivesManager.recover_erc20(token: address, receiver: address)`"

    !!!guard "Guarded Method"
        The `recover_erc20` function is only callable by the `TOKEN_RESCUER` role. 
        
        *The contract uses the snekmate access control module to check the roles:*

        ???quote "Snekmate: Access Control Module"
            
            ```py
            # @dev Returns `True` if `account` has been granted `role`.
            hasRole: public(HashMap[bytes32, HashMap[address, bool]])

            @internal
            @view
            def _check_role(role: bytes32, account: address):
                """
                @dev Reverts with a standard message if `account`
                    is missing `role`.
                @param role The 32-byte role definition.
                @param account The 20-byte address of the account.
                """
                assert self.hasRole[role][account], "access_control: account is missing role"
            ```

    Function to recover `token` from the contract and sent them to the `receiver`. This function does not allow the recovery of `managed_asset`, which is recoverable via the [`emergency_migration`](#emergency_migration) function.

    | Input      | Type      | Description                              |
    | ---------- | --------- | ---------------------------------------- |
    | `token`    | `address` | Token to recover                         |
    | `receiver` | `address` | Receiver address of the recovered token  |

    ??? quote "Source code"

        === "IncentivesManager.vy"

            ```python
            from ethereum.ercs import IERC20

            managed_asset: IERC20

            @external
            def recover_erc20(token: address, receiver: address):
                """
                @notice Recover any ERC20 token (except the managed one) erroneously
                sent to this contract.
                @param token The token to be recovered
                @param receiver The address to which the tokens will be sent
                """
                access_control._check_role(TOKEN_RESCUER, msg.sender)

                if token == self.managed_asset.address:
                    raise "manager: cannot recover managed asset"

                balance: uint256 = staticcall IERC20(token).balanceOf(self)
                assert extcall IERC20(token).transfer(receiver, balance, default_return_value=True)
            ```

    === "Example"

        ```shell
        >>> soon
        ```


### `emergency_migration`
!!! description "`IncentivesManager.emergency_migration(receiver: address)`"

    !!!guard "Guarded Method"
        The `emergency_migration` function is only callable by the `EMERGENCY_ADMIN` role. 
        
        *The contract uses the snekmate access control module to check the roles:*

        ???quote "Snekmate: Access Control Module"
            
            ```py
            # @dev Returns `True` if `account` has been granted `role`.
            hasRole: public(HashMap[bytes32, HashMap[address, bool]])

            @internal
            @view
            def _check_role(role: bytes32, account: address):
                """
                @dev Reverts with a standard message if `account`
                    is missing `role`.
                @param role The 32-byte role definition.
                @param account The 20-byte address of the account.
                """
                assert self.hasRole[role][account], "access_control: account is missing role"
            ```

    Function to migrate the total balance of `managed_asset` to `receiver`.

    | Input      | Type      | Description                                       |
    | ---------- | --------- | ------------------------------------------------- |
    | `receiver` | `address` | Receiver address to migrate the managed assets to |

    ??? quote "Source code"

        === "IncentivesManager.vy"

            ```python
            from ethereum.ercs import IERC20

            managed_asset: IERC20

            @external
            def emergency_migration(receiver: address):
                """
                @notice Migration function in case the funds need to be moved to
                another address.
                @param receiver The address to which the funds will be sent
                """
                access_control._check_role(EMERGENCY_ADMIN, msg.sender)

                balance: uint256 = staticcall self.managed_asset.balanceOf(self)
                extcall self.managed_asset.transfer(receiver, balance)
            ```

    === "Example"

        ```shell
        >>> soon
        ```


---


## **Other Methods**

### `version`
!!! description "`IncentivesManager.version() -> String[8]: view`"

    Getter for the contract version.

    Returns: version (`String[8]`).

    ??? quote "Source code"

        === "IncentivesManager.vy"

            ```python
            version: public(constant(String[8])) = "0.1.0" # (no guarantees on ABI stability)
            ```

    === "Example"

        ```shell
        >>> IncentivesManager.version()
        '0.1.0'
        ```
