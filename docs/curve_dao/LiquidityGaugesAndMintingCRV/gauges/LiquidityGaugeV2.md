The v2 liquidity gauge adds a full [ERC20](https://eips.ethereum.org/EIPS/eip-20) interface to the gauge, tokenizing deposits so they can be directly transferred between accounts without having to withdraw and redeposit. It also improves flexibility for onward staking, allowing staking to be enabled or disabled at any time and handling up to eight reward tokens at once.


!!!info
    The following view methods and functions are using the [AAVE liquidity gauge](https://etherscan.io/address/0xdebf20617708857ebe4f679508e7b7863a8a8eee#readContract).  
    Source code of the LiquidityGaugeV2 can be found on [Github](https://github.com/curvefi/curve-dao-contracts/blob/master/contracts/gauges/LiquidityGaugeV2.vy).



## **Admin Ownership**
Liquidity Gauge V2 also added admin ownership. `admin` is able to kill a gauge and add a reward contract.


### `admin`
!!! description "`LiquidityGaugeV2.admin() -> address: view`"

    Getter for the admin of the gauge contract.

    Returns: admin (`address`).

    !!!note
         Admin can be changed by calling [`commit_transfer_ownership`](#commit_transfer_ownership).

    ??? quote "Source code"

        ```python hl_lines="1 9 21 35 38"
        admin: public(address)

        @external
        def __init__(_lp_token: address, _minter: address, _admin: address):
            """
            @notice Contract constructor
            @param _lp_token Liquidity Pool contract address
            @param _minter Minter contract address
            @param _admin Admin who can kill the gauge
            """

            symbol: String[26] = ERC20Extended(_lp_token).symbol()
            self.name = concat("Curve.fi ", symbol, " Gauge Deposit")
            self.symbol = concat(symbol, "-gauge")

            crv_token: address = Minter(_minter).token()
            controller: address = Minter(_minter).controller()

            self.lp_token = _lp_token
            self.minter = _minter
            self.admin = _admin
            self.crv_token = crv_token
            self.controller = controller
            self.voting_escrow = Controller(controller).voting_escrow()

            self.period_timestamp[0] = block.timestamp
            self.inflation_rate = CRV20(crv_token).rate()
            self.future_epoch_time = CRV20(crv_token).future_epoch_time_write()

        @external
        def accept_transfer_ownership():
            """
            @notice Accept a pending ownership transfer
            """
            _admin: address = self.future_admin
            assert msg.sender == _admin  # dev: future admin only

            self.admin = _admin
            log ApplyOwnership(_admin)
        ```

    === "Example"

        ```shell
        >>> LiquidityGaugeV2.admin():
        '0x519AFB566c05E00cfB9af73496D00217A630e4D5'
        ```


### `future_admin`
!!! description "`LiquidityGaugeV2.future_admin() -> address: view`"

    Getter for the future admin of the gauge contract.

    Returns: future admin (`address`).

    !!!note
        Future admin is set by calling [`commit_transfer_ownership`](#commit_transfer_ownership). New admin ownership then needs to be applied via [`accept_transfer_ownership`](#accept_transfer_ownership).


    ??? quote "Source code"

        ```python hl_lines="1 11 20"
        future_admin: public(address)  # Can and will be a smart contract

        @external
        def commit_transfer_ownership(addr: address):
            """
            @notice Transfer ownership of GaugeController to `addr`
            @param addr Address to have ownership transferred to
            """
            assert msg.sender == self.admin  # dev: admin only

            self.future_admin = addr
            log CommitOwnership(addr)

        @external
        def accept_transfer_ownership():
            """
            @notice Accept a pending ownership transfer
            """
            _admin: address = self.future_admin
            assert msg.sender == _admin  # dev: future admin only

            self.admin = _admin
            log ApplyOwnership(_admin)
        ```

    === "Example"

        ```shell
        >>> LiquidityGaugeV2.future_admin():
        '0x519AFB566c05E00cfB9af73496D00217A630e4D5'
        ```


### `commit_transfer_ownership`
!!! description "`LiquidityGaugeV2.commit_transfer_ownership(addr: address):`"

    Function to commit transfer ownership.

    Emits: `CommitOwnership`

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `addr` |  `address` | Address to transfer ownership to |

    ??? quote "Source code"

        ```python hl_lines="1 5 8 13 15 16"
        event CommitOwnership:
            admin: address

        admin: public(address)
        future_admin: public(address)  # Can and will be a smart contract

        @external
        def commit_transfer_ownership(addr: address):
            """
            @notice Transfer ownership of GaugeController to `addr`
            @param addr Address to have ownership transferred to
            """
            assert msg.sender == self.admin  # dev: admin only

            self.future_admin = addr
            log CommitOwnership(addr)
        ```

        !!!note
            Only callable by `admin`.

    === "Example"

        ```shell
        >>> LiquidityGaugeV2.commit_transfer_ownership():
        'todo'
        ```


### `accept_transfer_ownership`
!!! description "`LiquidityGaugeV2.accept_transfer_ownership(addr: address):`"

    Function to apply the admin changes.

    Emits: `ApplyOwnership`

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `addr` |  `address` | Address to accept the admin changes |

    !!!note
        This function can only be called by `future_admin`.

    ??? quote "Source code"

        ```python hl_lines="1 8 12 16"
        event ApplyOwnership:
            admin: address

        admin: public(address)
        future_admin: public(address)  # Can and will be a smart contract

        @external
        def accept_transfer_ownership():
            """
            @notice Accept a pending ownership transfer
            """
            _admin: address = self.future_admin
            assert msg.sender == _admin  # dev: future admin only

            self.admin = _admin
            log ApplyOwnership(_admin)
        ```

    === "Example"

        ```shell
        >>> LiquidityGaugeV2.accept_transfer_ownership():
        ```


## **Checking and Claiming Rewards**
!!!note
    Rewards are claimed automatically each time a user deposits or withdraws from the gauge, and on gauge token transfers.

### `claimable_rewards`
!!! description "`LiquidityGaugeV2.claimable_reward(_addr: address, _token: address) -> uint256:`"

    Getter for the number of claimable reward token `_token` for user `addr`.

    Returns: claimable reward amount (`uint256`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_addr` |  `address` | Address to get reward amount for |
    | `_token` |  `address` | Token to get reward amount for |

    !!!warning
        This function determines the claimable reward by actually claiming and then returning the received amount. As such, it is state changing and only of use to off-chain integrators. The [mutability](https://docs.vyperlang.org/en/stable/control-structures.html#mutability) should be manually changed to `view` within the ABI.


    ??? quote "Source code"

        ```python hl_lines="3"
        @external
        @nonreentrant('lock')
        def claimable_reward(_addr: address, _token: address) -> uint256:
            """
            @notice Get the number of claimable reward tokens for a user
            @dev This function should be manually changed to "view" in the ABI
                Calling it via a transaction will claim available reward tokens
            @param _addr Account to get reward amount for
            @param _token Token to get reward amount for
            @return uint256 Claimable reward token amount
            """
            claimable: uint256 = ERC20(_token).balanceOf(_addr)
            if self.reward_contract != ZERO_ADDRESS:
                self._checkpoint_rewards(_addr, self.totalSupply)
            claimable = ERC20(_token).balanceOf(_addr) - claimable

            integral: uint256 = self.reward_integral[_token]
            integral_for: uint256 = self.reward_integral_for[_token][_addr]

            if integral_for < integral:
                claimable += self.balanceOf[_addr] * (integral - integral_for) / 10**18

            return claimable
        ```

    === "Example"

        ```shell
        >>> LiquidityGaugeV2.claimable_rewards("todo"):
        'todo'
        ```


### `claim_rewards`
!!! description "`LiquidityGaugeV2.claim_rewards(_addr: address = msg.sender):`"

    Function to claim reward tokens for `addr`.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_addr` |  `address` | Address to claim for (defaulted to `msg.sender` (caller) if no input) |

    ??? quote "Source code"

        ```python hl_lines="3"
        @external
        @nonreentrant('lock')
        def claim_rewards(_addr: address = msg.sender):
            """
            @notice Claim available reward tokens for `_addr`
            @param _addr Address to claim for
            """
            self._checkpoint_rewards(_addr, self.totalSupply)
        ```

    === "Example"

        ```shell
        >>> LiquidityGaugeV2.claim_rewards("todo"):
        'todo'
        ```


### `claim_historic_rewards`
!!! description "`LiquidityGaugeV2.claim_historic_rewards(_reward_tokens: address[MAX_REWARDS], _addr: address = msg.sender):`"

    Function to claim reward tokens available from a previously-set staking contract.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_reward_tokens` |  `address` | Array of reward token addresses to claim |
    | `_addr` |  `address` | Address to claim for (defaulted to `msg.sender` (caller) if no input) |

    ??? quote "Source code"

        ```python hl_lines="9"
        # reward token -> integral
        reward_integral: public(HashMap[address, uint256])

        # reward token -> claiming address -> integral
        reward_integral_for: public(HashMap[address, HashMap[address, uint256]])

        @external
        @nonreentrant('lock')
        def claim_historic_rewards(_reward_tokens: address[MAX_REWARDS], _addr: address = msg.sender):
            """
            @notice Claim reward tokens available from a previously-set staking contract
            @param _reward_tokens Array of reward token addresses to claim
            @param _addr Address to claim for
            """
            for token in _reward_tokens:
                if token == ZERO_ADDRESS:
                    break
                integral: uint256 = self.reward_integral[token]
                integral_for: uint256 = self.reward_integral_for[token][_addr]

                if integral_for < integral:
                    claimable: uint256 = self.balanceOf[_addr] * (integral - integral_for) / 10**18
                    self.reward_integral_for[token][_addr] = integral
                    response: Bytes[32] = raw_call(
                        token,
                        concat(
                            method_id("transfer(address,uint256)"),
                            convert(_addr, bytes32),
                            convert(claimable, bytes32),
                        ),
                        max_outsize=32,
                    )
                    if len(response) != 0:
                        assert convert(response, bool)
        ```

    === "Example"

        ```shell
        >>> LiquidityGaugeV2.claim_historic_rewards("todo"):
        'todo'
        ```


## **Setting the Rewards Contract**

### `set_rewards`
!!! description "`LiquidityGaugeV2.set_rewards(_reward_tokens: address[MAX_REWARDS], _addr: address = msg.sender):`"

    Function to set the active reward contract.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_reward_contract` |  `address` | Address of staking contract. Set to `ZERO_ADDRESS` if staking rewards are being removed |
    | `_sigs` |  `bytes32` | A concatenation of three four-byte function signatures: `stake`, `withdraw` and `getReward`. The signatures are then right padded with empty bytes. |
    | `_reward_tokens` |  `address` | Array of reward tokens received from the staking contract |

    !!!note
        This action is only possible via the contract admin. It cannot be called when the gauge has no deposits. As a safety precaution, this call validates all the signatures with the following sequence of actions:  
            1.  LP tokens are deposited into the new staking contract, verifying that the deposit signature is correct.  
            2.  `balanceOf` is called on the LP token to confirm that the gauge’s token balance is not zero.  
            3.  The LP tokens are withdrawn, verifying that the withdraw function signature is correct.  
            4.  `balanceOf` is called on the LP token again, to confirm that the gauge has successfully withdrawn it’s entire balance.  
            5.  A call to claim rewards is made to confirm that it does not revert. 
    

    These checks are required to protect against an incorrectly designed staking contract or incorrectly structured input arguments.

    !!!note
        It is also possible to claim from a reward contract that does not require onward staking. In this case, use `00000000` for the function selectors for both staking and withdrawing.

    ??? quote "Source code"

        ```python hl_lines="3"
        @external
        @nonreentrant('lock')
        def set_rewards(_reward_contract: address, _sigs: bytes32, _reward_tokens: address[MAX_REWARDS]):
            """
            @notice Set the active reward contract
            @dev A reward contract cannot be set while this contract has no deposits
            @param _reward_contract Reward contract address. Set to ZERO_ADDRESS to
                                    disable staking.
            @param _sigs Four byte selectors for staking, withdrawing and claiming,
                        right padded with zero bytes. If the reward contract can
                        be claimed from but does not require staking, the staking
                        and withdraw selectors should be set to 0x00
            @param _reward_tokens List of claimable tokens for this reward contract
            """
            assert msg.sender == self.admin

            lp_token: address = self.lp_token
            current_reward_contract: address = self.reward_contract
            total_supply: uint256 = self.totalSupply
            if current_reward_contract != ZERO_ADDRESS:
                self._checkpoint_rewards(ZERO_ADDRESS, total_supply)
                withdraw_sig: Bytes[4] = slice(self.reward_sigs, 4, 4)
                if convert(withdraw_sig, uint256) != 0:
                    if total_supply != 0:
                        raw_call(
                            current_reward_contract,
                            concat(withdraw_sig, convert(total_supply, bytes32))
                        )
                    ERC20(lp_token).approve(current_reward_contract, 0)

            if _reward_contract != ZERO_ADDRESS:
                assert _reward_contract.is_contract  # dev: not a contract
                sigs: bytes32 = _sigs
                deposit_sig: Bytes[4] = slice(sigs, 0, 4)
                withdraw_sig: Bytes[4] = slice(sigs, 4, 4)

                if convert(deposit_sig, uint256) != 0:
                    # need a non-zero total supply to verify the sigs
                    assert total_supply != 0  # dev: zero total supply
                    ERC20(lp_token).approve(_reward_contract, MAX_UINT256)

                    # it would be Very Bad if we get the signatures wrong here, so
                    # we do a test deposit and withdrawal prior to setting them
                    raw_call(
                        _reward_contract,
                        concat(deposit_sig, convert(total_supply, bytes32))
                    )  # dev: failed deposit
                    assert ERC20(lp_token).balanceOf(self) == 0
                    raw_call(
                        _reward_contract,
                        concat(withdraw_sig, convert(total_supply, bytes32))
                    )  # dev: failed withdraw
                    assert ERC20(lp_token).balanceOf(self) == total_supply

                    # deposit and withdraw are good, time to make the actual deposit
                    raw_call(
                        _reward_contract,
                        concat(deposit_sig, convert(total_supply, bytes32))
                    )
                else:
                    assert convert(withdraw_sig, uint256) == 0  # dev: withdraw without deposit

            self.reward_contract = _reward_contract
            self.reward_sigs = _sigs
            for i in range(MAX_REWARDS):
                if _reward_tokens[i] != ZERO_ADDRESS:
                    self.reward_tokens[i] = _reward_tokens[i]
                elif self.reward_tokens[i] != ZERO_ADDRESS:
                    self.reward_tokens[i] = ZERO_ADDRESS
                else:
                    assert i != 0  # dev: no reward token
                    break

            if _reward_contract != ZERO_ADDRESS:
                # do an initial checkpoint to verify that claims are working
                self._checkpoint_rewards(ZERO_ADDRESS, total_supply)
        ```

    === "Example"

        ```shell
        >>> LiquidityGaugeV2.claim_historic_rewards("todo"):
        'todo'
        ```


### `reward_contract`
!!! description "`LiquidityGaugeV2.reward_contract() -> address: view`"

    Getter for the reward contract.

    Returns: reward contract (`address`).

    ??? quote "Source code"

        ```python hl_lines="1"
        reward_contract: public(address)
        ```

    === "Example"

        ```shell
        >>> LiquidityGaugeV2.reward_contract():
        '0x96D7BC17912e4F320c4894194564CF8425cfe8d9'
        ```


### `reward_tokens`
!!! description "`LiquidityGaugeV2.reward_tokens(arg0: uint256) -> address: view`"

    Getter for the reward contract.

    Returns: reward contract (`address`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `arg0` |  `uint256` | Index of reward token |

    ??? quote "Source code"

        ```python hl_lines="1"
        reward_tokens: public(address[MAX_REWARDS])
        ```

    === "Example"

        ```shell
        >>> LiquidityGaugeV2.reward_tokens(0):
        '0x4da27a545c0c5B758a6BA100e3a049001de870f5'
        ```



## **Killing Gauges**
V2 Liquidity Gauges introduced the possibility to kill gauges. Killing a gauge sets the `rate` in [`_checkpoint`](/docs/curve_dao/LiquidityGaugesAndMinting/LiquidityGaugeV1#checkpoints) to 0 and therefore stopping inflation.

### `is_killed`
!!! description "`LiquidityGaugeV2.is_killed(addr: address):`"

    Getter for the killed status for the gauge.

    Returns: true of false (`bool`).

    ??? quote "Source code"

        ```python hl_lines="1 12"
        is_killed: public(bool)

        @external
        def set_killed(_is_killed: bool):
            """
            @notice Set the killed status for this contract
            @dev When killed, the gauge always yields a rate of 0 and so cannot mint CRV
            @param _is_killed Killed status to set
            """
            assert msg.sender == self.admin

            self.is_killed = _is_killed
        ```

    === "Example"

        ```shell
        >>> LiquidityGaugeV2.is_killed():
        'false'
        ```

### `set_killed`
!!! description "`LiquidityGaugeV2.set_killed(_is_killed: bool):`"

    Function to set the killed status of a gauge.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_is_killed` |  `bool` | true of flase|

    ??? quote "Source code"

        ```python hl_lines="4"
        is_killed: public(bool)

        @external
        def set_killed(_is_killed: bool):
            """
            @notice Set the killed status for this contract
            @dev When killed, the gauge always yields a rate of 0 and so cannot mint CRV
            @param _is_killed Killed status to set
            """
            assert msg.sender == self.admin

            self.is_killed = _is_killed
        ```

    !!!note
        Only callable by `admin`.

    === "Example"

        ```shell
        >>> LiquidityGaugeV2.set_killed("todo"):
        'todo'
        ```


## **Querying Gauge Information**

### `decimals`
!!! description "`LiquidityGaugeV2.decimals() -> uint256:`"

    Getter for the decimals of the liquidity gauge token.

    Returns: decimals (`uint256`).

    ??? quote "Source code"

        ```python hl_lines="3"
        @view
        @external
        def decimals() -> uint256:
            """
            @notice Get the number of decimals for this token
            @dev Implemented as a view method to reduce gas costs
            @return uint256 decimal places
            """
            return 18
        ```

    === "Example"

        ```shell
        >>> LiquidityGaugeV2.decimals():
        18
        ```



### `name`
!!! description "`LiquidityGaugeV2.name() -> String[64]: view`"

    Getter for the name of the lp gauge token.

    Returns: token name (`String[64]`).

    ??? quote "Source code"

        ```python hl_lines="1 13"
        name: public(String[64])

        @external
        def __init__(_lp_token: address, _minter: address, _admin: address):
            """
            @notice Contract constructor
            @param _lp_token Liquidity Pool contract address
            @param _minter Minter contract address
            @param _admin Admin who can kill the gauge
            """

            symbol: String[26] = ERC20Extended(_lp_token).symbol()
            self.name = concat("Curve.fi ", symbol, " Gauge Deposit")
            self.symbol = concat(symbol, "-gauge")

            crv_token: address = Minter(_minter).token()
            controller: address = Minter(_minter).controller()

            self.lp_token = _lp_token
            self.minter = _minter
            self.admin = _admin
            self.crv_token = crv_token
            self.controller = controller
            self.voting_escrow = Controller(controller).voting_escrow()

            self.period_timestamp[0] = block.timestamp
            self.inflation_rate = CRV20(crv_token).rate()
            self.future_epoch_time = CRV20(crv_token).future_epoch_time_write()
        ```

    === "Example"

        ```shell
        >>> LiquidityGaugeV2.name():
        'Curve.fi a3CRV Gauge Deposit'
        ```


### `symbol`
!!! description "`LiquidityGaugeV2.symbol() -> String[32]: view`"

    Getter for the symbol of the lp gauge token.

    Returns: symbol (`String[32]`).

    ??? quote "Source code"

        ```python hl_lines="1 12 14"
        symbol: public(String[32])
        
        @external
        def __init__(_lp_token: address, _minter: address, _admin: address):
            """
            @notice Contract constructor
            @param _lp_token Liquidity Pool contract address
            @param _minter Minter contract address
            @param _admin Admin who can kill the gauge
            """

            symbol: String[26] = ERC20Extended(_lp_token).symbol()
            self.name = concat("Curve.fi ", symbol, " Gauge Deposit")
            self.symbol = concat(symbol, "-gauge")

            crv_token: address = Minter(_minter).token()
            controller: address = Minter(_minter).controller()

            self.lp_token = _lp_token
            self.minter = _minter
            self.admin = _admin
            self.crv_token = crv_token
            self.controller = controller
            self.voting_escrow = Controller(controller).voting_escrow()

            self.period_timestamp[0] = block.timestamp
            self.inflation_rate = CRV20(crv_token).rate()
            self.future_epoch_time = CRV20(crv_token).future_epoch_time_write()
        ```

    === "Example"

        ```shell
        >>> LiquidityGaugeV2.symbol():
        'a3CRV-gauge'
        ```


### `reward_integral`
!!! description "`LiquidityGaugeV2.reward_integral(arg0: uint256) -> uint256: view`"

    Getter for the reward integral.

    Returns: reward integral (`uint256`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `arg0` |  `uint256` | Index of reward token |

    ??? quote "Source code"

        ```python hl_lines="2"
        # reward token -> integral
        reward_integral: public(HashMap[address, uint256])
        ```

    === "Example"

        ```shell
        >>> LiquidityGaugeV2.reward_integral(todo):
        'todo'
        ```

### `reward_integral_for` (todo)
!!! description "`LiquidityGaugeV2.reward_integral_for(arg0: uint256, arg1: uint256) -> uint256: view`"

    todo

    Returns: todo

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `arg0` |  `uint256` | todo |
    | `arg1` |  `uint256` | todo |

    ??? quote "Source code"

        ```python hl_lines="2"
        # reward token -> integral
        reward_integral: public(HashMap[address, uint256])
        ```

    === "Example"

        ```shell
        >>> LiquidityGaugeV2.reward_integral(todo):
        'todo'
        ```
