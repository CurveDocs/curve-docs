This section discusses the different methods in the Curve 
[SynthSwap](https://etherscan.io/address/0x58A3c68e2D3aAf316239c003779F71aCb870Ee47) contract.

## **Adding and Finding Swappable Assets**

In general, any asset that is within a Curve pool also containing a Synth may be used in a cross asset swap. 

### `add_synth`
!!! description "`SynthSwap.add_synth(_synth: address, _pool: address)`"

    Add a new swappable synth. This method is callable by anyone, however `_pool` must exist within the Curve
    pool registry and `_synth` must be a valid synth that is swappable within the pool.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_synth`       |  `address` | address of the synth |
    | `_pool`       |  `address` | address of Curve pool containing the synth |

    Emits: <mark style="background-color: #FFD580; color: black">NewSynth</mark>

    ??? quote "Source code"

        ```python
        @external
        def add_synth(_synth: address, _pool: address):
            """
            @notice Add a new swappable synth
            @dev Callable by anyone, however `_pool` must exist within the Curve
                 pool registry and `_synth` must be a valid synth that is swappable
                 within the pool
            @param _synth Address of the synth to add
            @param _pool Address of the Curve pool where `_synth` is swappable
            """
            assert self.synth_pools[_synth] == ZERO_ADDRESS  # dev: already added
        
            # this will revert if `_synth` is not actually a synth
            self.currency_keys[_synth] = Synth(_synth).currencyKey()
        
            registry: address = AddressProvider(ADDRESS_PROVIDER).get_registry()
            pool_coins: address[8] = Registry(registry).get_coins(_pool)
        
            has_synth: bool = False
            for coin in pool_coins:
                if coin == ZERO_ADDRESS:
                    assert has_synth  # dev: synth not in pool
                    break
                if coin == _synth:
                    self.synth_pools[_synth] = _pool
                    has_synth = True
                self.swappable_synth[coin] = _synth
        
            log NewSynth(_synth, _pool)
        ```

    === "Example"

        ```shell
        >>> todo:
        ```


### `synth_pools`
!!! description "`SynthSwap.synth_pools(_synth: address) → address: view`"

    Get the address of the Curve pool used to swap a synthetic asset. If this function returns `ZERO_ADDRESS`, 
    the given synth cannot be used within cross-asset swaps.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_synth`       |  `address` | Address of the synth |

    ??? quote "Source code"

        ```python
        # synth -> curve pool where it can be traded
        synth_pools: public(HashMap[address, address])

        ...
        ```

    === "Example"

        ```shell
        >>> todo:
        ```


### `swappable_synth`
!!! description "`SynthSwap.swappable_synth(_token: address) → address: view`"

    Get the address of the synthetic asset that `_token` may be directly swapped for. If this function returns 
    `ZERO_ADDRESS`, `_token` cannot be used within a cross-asset swap.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_token`       |  `address` | Address of the synth |

    ??? quote "Source code"

        ```python
        # synth -> curve pool where it can be traded
        synth_pools: public(HashMap[address, address])

        ...
        ```

    === "Example"

        ```shell
        >>> todo:
        ```


## **Estimate Swap Amounts**

### `SynthSwap.get_swap_into_synth_amount`
!!! description "`SynthSwap.get_swap_into_synth_amount(_from: address, _synth: address, _amount: uint256) → uint256: view`"

    Returns the expected amount of `_synth` received in the swap.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_from`       |  `address` | Address of the initial asset being exchanged |
    | `_synth`       |  `address` | Address of the synth being swapped into |
    | `_amount`       |  `uint256` | Amount of _from to swap |

    ??? quote "Source code"

        ```python
        @view
        @internal
        def _get_swap_into(_from: address, _synth: address, _amount: uint256) -> uint256:
            registry: address = AddressProvider(ADDRESS_PROVIDER).get_registry()
        
            intermediate_synth: address = self.swappable_synth[_from]
            pool: address = self.synth_pools[intermediate_synth]
        
            synth_amount: uint256 = _amount
            if _from != intermediate_synth:
                i: int128 = 0
                j: int128 = 0
                i, j = Registry(registry).get_coin_indices(pool, _from, intermediate_synth)
        
                synth_amount = Curve(pool).get_dy(i, j, _amount)
        
            return self.exchanger.getAmountsForExchange(
                synth_amount,
                self.currency_keys[intermediate_synth],
                self.currency_keys[_synth],
            )[0]
        
        
        @view
        @external
        def get_swap_into_synth_amount(_from: address, _synth: address, _amount: uint256) -> uint256:
            """
            @notice Return the amount received when performing a cross-asset swap
            @dev Used to calculate `_expected` when calling `swap_into_synth`. Be sure to
                 reduce the value slightly to account for market movement prior to the
                 transaction confirmation.
            @param _from Address of the initial asset being exchanged
            @param _synth Address of the synth being swapped into
            @param _amount Amount of `_from` to swap
            @return uint256 Expected amount of `_synth` received
            """
            return self._get_swap_into(_from, _synth, _amount)
        ```

    === "Example"

        ```shell
        >>> synth_swap = Contract('0x58A3c68e2D3aAf316239c003779F71aCb870Ee47')
        >>> dai = Contract('0x6b175474e89094c44da98b954eedeac495271d0f')
        >>> sbtc = Contract('0xfe18be6b3bd88a2d2a7f928d00292e7a9963cfc6')
        
        >>> synthswap.get_swap_into_synth_amount(dai, sbtc, 100000 * 1e18)
        2720559215249173192
        ```

    !!! note

        This method is used to calculate `_expected` when calling `swap_into_synth`. You should reduce the value 
        slightly to account for market movement prior to the transaction confirming.


### `get_swap_from_synth_amount`
!!! description "`SynthSwap.get_swap_from_synth_amount(_synth: address, _to: address, _amount: uint256) → uint256: view`"

    Returns the expected amount of `_to` received in the swap.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_synth`       |  `address` | Address of the synth being swapped out of |
    | `_to`       |  `address` | Address of the asset to swap into |
    | `_amount`       |  `uint256` | Amount of `_synth` to swap |

    ??? quote "Source code"

        ```python
        @view
        @internal
        def _get_swap_from(_synth: address, _to: address, _amount: uint256) -> uint256:
            registry: address = AddressProvider(ADDRESS_PROVIDER).get_registry()
            pool: address = self.synth_pools[_synth]
        
            i: int128 = 0
            j: int128 = 0
            i, j = Registry(registry).get_coin_indices(pool, _synth, _to)
        
            return Curve(pool).get_dy(i, j, _amount)
        
        
        @view
        @external
        def get_swap_from_synth_amount(_synth: address, _to: address, _amount: uint256) -> uint256:
            """
            @notice Return the amount received when swapping out of a settled synth
            @dev Used to calculate `_expected` when calling `swap_from_synth`. Be sure to
                 reduce the value slightly to account for market movement prior to the
                 transaction confirmation.
            @param _synth Address of the synth being swapped out of
            @param _to Address of the asset to swap into
            @param _amount Amount of `_synth` being exchanged
            @return uint256 Expected amount of `_to` received
            """
            return self._get_swap_from(_synth, _to, _amount)
        ```

    === "Example"

        ```shell
        >>> synth_swap = Contract('0x58A3c68e2D3aAf316239c003779F71aCb870Ee47')
        >>> sbtc = Contract('0xfe18be6b3bd88a2d2a7f928d00292e7a9963cfc6')
        >>> wbtc = Contract('0x2260fac5e5542a773aa44fbcfedf7c193bc2c599')
        
        >>> synthswap.get_swap_from_synth_amount(sbtc, wbtc, 2720559215249173192)
        273663013
        ```


### `get_estimated_swap_amount`
!!! description "`SynthSwap.get_estimated_swap_amount(_from: address, _to: address, _amount: uint256) → uint256: view`"

    Estimate the final amount of `_to` received when swapping between `_from` and `_to`.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_from`       |  `address` | Address of the initial asset being exchanged |
    | `_to`       |  `address` | Address of the asset to swap into |
    | `_amount`       |  `uint256` | Amount of `_from` to swap |

    ??? quote "Source code"

        ```python
        @view
        @internal
        def _get_swap_into(_from: address, _synth: address, _amount: uint256) -> uint256:
            registry: address = AddressProvider(ADDRESS_PROVIDER).get_registry()
        
            intermediate_synth: address = self.swappable_synth[_from]
            pool: address = self.synth_pools[intermediate_synth]
        
            synth_amount: uint256 = _amount
            if _from != intermediate_synth:
                i: int128 = 0
                j: int128 = 0
                i, j = Registry(registry).get_coin_indices(pool, _from, intermediate_synth)
        
                synth_amount = Curve(pool).get_dy(i, j, _amount)
        
            return self.exchanger.getAmountsForExchange(
                synth_amount,
                self.currency_keys[intermediate_synth],
                self.currency_keys[_synth],
            )[0]

        ...

        @view
        @internal
        def _get_swap_from(_synth: address, _to: address, _amount: uint256) -> uint256:
            registry: address = AddressProvider(ADDRESS_PROVIDER).get_registry()
            pool: address = self.synth_pools[_synth]
        
            i: int128 = 0
            j: int128 = 0
            i, j = Registry(registry).get_coin_indices(pool, _synth, _to)
        
            return Curve(pool).get_dy(i, j, _amount)

        ...

        @view
        @external
        def get_estimated_swap_amount(_from: address, _to: address, _amount: uint256) -> uint256:
            """
            @notice Estimate the final amount received when swapping between `_from` and `_to`
            @dev Actual received amount may be different if synth rates change during settlement
            @param _from Address of the initial asset being exchanged
            @param _to Address of the asset to swap into
            @param _amount Amount of `_from` being exchanged
            @return uint256 Estimated amount of `_to` received
            """
            synth: address = self.swappable_synth[_to]
            synth_amount: uint256 = self._get_swap_into(_from, synth, _amount)
            return self._get_swap_from(synth, _to, synth_amount)
        ```

    === "Example"

        ```shell
        >>> synth_swap = Contract('0x58A3c68e2D3aAf316239c003779F71aCb870Ee47')
        >>> dai = Contract('0x6b175474e89094c44da98b954eedeac495271d0f')
        >>> wbtc = Contract('0x2260fac5e5542a773aa44fbcfedf7c193bc2c599')
        
        >>> synthswap.get_estimated_swap_amount(dai, wbtc, 100000 * 1e18)
        273663013
        ```

    !!! note

        This method is for estimating the received amount from a complete swap over two transactions. If `_to` is a 
        Synth, you should use `get_swap_into_synth_amount` instead.

    !!! note

        As swaps take a settlement period into account, the actual received amount may be different due to rate changes 
        during the settlement period.



## **Initiate a Swap**

### `swap_into_synth`

!!! description "`SynthSwap.swap_into_synth(_from: address, _synth: address, _amount: uint256, _expected: uint256, _receiver: address = msg.sender, _existing_token_id: uint256 = 0) → uint256: payable`"

    Perform a cross-asset swap between `_from` and `_synth`. Returns the `uint256` token ID of the NFT representing 
    the unsettled swap. The token ID is also available from the emitted `TokenUpdate` event.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_from`       |  `address` | Address of the initial asset being exchanged. For Ether swaps, use `0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE`. |
    | `_synth`       |  `address` | Address of the synth to swap into |
    | `_amount`       |  `uint256` |  Amount of `_from` to swap. If you are swapping from Ether, you must also send exactly this much Ether with the transaction. If you are swapping any other asset, you must have given approval to the swap contract to transfer at least this amount. |
    | `_expected`       |  `uint256` | Minimum amount of `_synth` to receive |
    | `_receiver`       |  `address` | Address of the recipient of `_synth`. Defaults to the `msg.sender`. |
    | `_existing_token_id`       |  `uint256` | Token ID to deposit `_synth` into. If not given, a new NFT is minted for the generated synth. When set as non-zero, the token ID must be owned by the caller and must already represent the same synth as is being swapped into. |

    Emits: <mark style="background-color: #FFD580; color: black">NewSettler</mark> 
    <mark style="background-color: #FFD580; color: black">Transfer</mark> 
    <mark style="background-color: #FFD580; color: black">TokenUpdate</mark>

    ??? quote "Source code"

        ```python
        @payable
        @external
        def swap_into_synth(
            _from: address,
            _synth: address,
            _amount: uint256,
            _expected: uint256,
            _receiver: address = msg.sender,
            _existing_token_id: uint256 = 0,
        ) -> uint256:
            """
            @notice Perform a cross-asset swap between `_from` and `_synth`
            @dev Synth swaps require a settlement time to complete and so the newly
                 generated synth cannot immediately be transferred onward. Calling
                 this function mints an NFT which represents ownership of the generated
                 synth. Once the settlement time has passed, the owner may claim the
                 synth by calling to `swap_from_synth` or `withdraw`.
            @param _from Address of the initial asset being exchanged
            @param _synth Address of the synth being swapped into
            @param _amount Amount of `_from` to swap
            @param _expected Minimum amount of `_synth` to receive
            @param _receiver Address of the recipient of `_synth`, if not given
                               defaults to `msg.sender`
            @param _existing_token_id Token ID to deposit `_synth` into. If left as 0, a new NFT
                               is minted for the generated synth. If non-zero, the token ID
                               must be owned by `msg.sender` and must represent the same
                               synth as is being swapped into.
            @return uint256 NFT token ID
            """
            settler: address = ZERO_ADDRESS
            token_id: uint256 = 0
        
            if _existing_token_id == 0:
                # if no token ID is given we are initiating a new swap
                count: uint256 = self.id_count
                if count == 0:
                    # if there are no availale settler contracts we must deploy a new one
                    settler = create_forwarder_to(self.settler_implementation)
                    Settler(settler).initialize()
                    token_id = convert(settler, uint256)
                    log NewSettler(settler)
                else:
                    count -= 1
                    token_id = self.available_token_ids[count]
                    settler = convert(token_id % (2**160), address)
                    self.id_count = count
            else:
                # if a token ID is given we are adding to the balance of an existing swap
                # so must check to make sure this is a permitted action
                settler = convert(_existing_token_id % (2**160), address)
                token_id = _existing_token_id
                owner: address = self.id_to_owner[_existing_token_id]
                if msg.sender != owner:
                    assert owner != ZERO_ADDRESS, "Unknown Token ID"
                    assert (
                        self.owner_to_operators[owner][msg.sender] or
                        msg.sender == self.id_to_approval[_existing_token_id]
                    ), "Caller is not owner or operator"
                assert owner == _receiver, "Receiver is not owner"
                assert Settler(settler).synth() == _synth, "Incorrect synth for Token ID"
        
            registry_swap: address = AddressProvider(ADDRESS_PROVIDER).get_address(2)
            intermediate_synth: address = self.swappable_synth[_from]
            synth_amount: uint256 = 0
        
            if intermediate_synth == _from:
                # if `_from` is already a synth, no initial curve exchange is required
                assert ERC20(_from).transferFrom(msg.sender, settler, _amount)
                synth_amount = _amount
            else:
                if _from != 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE:
                    # Vyper equivalent of SafeERC20Transfer, handles most ERC20 return values
                    response: Bytes[32] = raw_call(
                        _from,
                        concat(
                            method_id("transferFrom(address,address,uint256)"),
                            convert(msg.sender, bytes32),
                            convert(self, bytes32),
                            convert(_amount, bytes32),
                        ),
                        max_outsize=32,
                    )
                    if len(response) != 0:
                        assert convert(response, bool)
                    if not self.is_approved[_from][registry_swap]:
                        response = raw_call(
                            _from,
                            concat(
                                method_id("approve(address,uint256)"),
                                convert(registry_swap, bytes32),
                                convert(MAX_UINT256, bytes32),
                            ),
                            max_outsize=32,
                        )
                        if len(response) != 0:
                            assert convert(response, bool)
                        self.is_approved[_from][registry_swap] = True
        
                # use Curve to exchange for initial synth, which is sent to the settler
                synth_amount = RegistrySwap(registry_swap).exchange(
                    self.synth_pools[intermediate_synth],
                    _from,
                    intermediate_synth,
                    _amount,
                    0,
                    settler,
                    value=msg.value
                )
        
            # use Synthetix to convert initial synth into the target synth
            initial_balance: uint256 = ERC20(_synth).balanceOf(settler)
            Settler(settler).convert_synth(
                _synth,
                synth_amount,
                self.currency_keys[intermediate_synth],
                self.currency_keys[_synth]
            )
            final_balance: uint256 = ERC20(_synth).balanceOf(settler)
            assert final_balance - initial_balance >= _expected, "Rekt by slippage"
        
            # if this is a new swap, mint an NFT to represent the unsettled conversion
            if _existing_token_id == 0:
                self.id_to_owner[token_id] = _receiver
                self.owner_to_token_count[_receiver] += 1
                log Transfer(ZERO_ADDRESS, _receiver, token_id)
        
            log TokenUpdate(token_id, _receiver, _synth, final_balance)
        
            return token_id
        ```

    === "Example"

        ```shell
        >>> alice = accounts[0]
        
        >>> synth_swap = Contract('0x58A3c68e2D3aAf316239c003779F71aCb870Ee47')
        >>> dai = Contract('0x6b175474e89094c44da98b954eedeac495271d0f')
        >>> sbtc = Contract('0xfe18be6b3bd88a2d2a7f928d00292e7a9963cfc6')
        
        >>> expected = synth_swap.get_swap_into_synth_amount(dai, sbtc, dai.balanceOf(alice)) * 0.99
        
        >>> tx = synth_swap.swap_into_synth(dai, sbtc, expected, {'from': alice})
        Transaction sent: 0x83b311af19be08b8ec6241c3e834ccdf3b22586971de82a76a641e43bdf2b3ee
          Gas price: 20 gwei   Gas limit: 1200000   Nonce: 5
        
        >>> tx.events['TokenUpdate']['token_id']
        2423994707895209386239865227163451060473904619065
        ```

    !!! note

        Synth swaps require a settlement time to complete and so the newly generated synth cannot immediately be 
        transferred onward. Calling this function mints an NFT representing ownership of the unsettled synth.



## **Get Info about an Unsettled Swap**

### `token_info`
!!! description "`SynthSwap.token_info(_token_id: uint256) → address, address, uint256, uint256: view`"

    Get information about the underlying synth represented by an NFT.
 
    Returns:

    - the `address` of the owner of the NFT
    - the `address` of the underlying synth
    - the balance (`uint256`) of the underlying synth
    - the current maximum number of seconds until the synth may be settled (`uint256`)

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_token_id`       |  `uint256` | NFT token ID to query info about. Reverts if the token ID does not exist. |

    ??? quote "Source code"

        ```python
        @view
        @external
        def token_info(_token_id: uint256) -> TokenInfo:
            """
            @notice Get information about the synth represented by an NFT
            @param _token_id NFT token ID to query info about
            @return NFT owner
                    Address of synth within the NFT
                    Balance of the synth
                    Max settlement time in seconds
            """
            info: TokenInfo = empty(TokenInfo)
            info.owner = self.id_to_owner[_token_id]
            assert info.owner != ZERO_ADDRESS
        
            settler: address = convert(_token_id % (2**160), address)
            info.synth = Settler(settler).synth()
            info.underlying_balance = ERC20(info.synth).balanceOf(settler)
        
            if not self.is_settled[_token_id]:
                currency_key: bytes32 = self.currency_keys[info.synth]
                reclaim: uint256 = 0
                rebate: uint256 = 0
                reclaim, rebate = self.exchanger.settlementOwing(settler, currency_key)
                info.underlying_balance = info.underlying_balance - reclaim + rebate
                info.time_to_settle = self.exchanger.maxSecsLeftInWaitingPeriod(settler, currency_key)
        
            return info
        ```
    
    === "Example"

        ```shell
        >>> synth_swap = Contract('0x58A3c68e2D3aAf316239c003779F71aCb870Ee47')
        >>> synthswap.token_info(2423994707895209386239865227163451060473904619065).dict()
        {
            'owner': "0xEF422dBBF46120dE627fFb913C9AFaD44c735618",
            'synth': "0x57Ab1ec28D129707052df4dF418D58a2D46d5f51",
            'time_to_settle': 0,
            'underlying_balance': 1155647333395694644849
        }
        ```

## **Complete a Swap**

### `swap_from_synth`
!!! description "`SynthSwap.swap_from_synth(_token_id: uint256, _to: address, _amount: uint256, _expected: uint256, _receiver: address = msg.sender) → uint256: nonpayable`"

    Swap the underlying synth represented by an NFT into another asset. Callable by the owner or operator of 
    `_token_id` after the synth settlement period has passed. If `_amount` is equal to the total remaining balance of 
    the synth represented by the NFT, the NFT is burned. 

    Returns the remaining balance of the underlying synth within the active NFT.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_token_id` |  `uint256` | The identifier for an NFT |
    | `_to`       |  `address` | Address of the asset to swap into |
    | `_amount`   |  `uint256` | Amount of the underlying synth to swap |
    | `_expected` |  `uint256` | Minimum amount of `_to` to receive |
    | `_receiver` |  `address` | Address to send the final received asset to. Defaults to `msg.sender`. |

    Emits: <mark style="background-color: #FFD580; color: black">Transfer</mark> 
    <mark style="background-color: #FFD580; color: black">TokenUpdate</mark>

    ??? quote "Source code"

        ```python
        @external
        def swap_from_synth(
            _token_id: uint256,
            _to: address,
            _amount: uint256,
            _expected: uint256,
            _receiver: address = msg.sender,
        ) -> uint256:
            """
            @notice Swap the synth represented by an NFT into another asset.
            @dev Callable by the owner or operator of `_token_id` after the synth settlement
                 period has passed. If `_amount` is equal to the entire balance within
                 the NFT, the NFT is burned.
            @param _token_id The identifier for an NFT
            @param _to Address of the asset to swap into
            @param _amount Amount of the synth to swap
            @param _expected Minimum amount of `_to` to receive
            @param _receiver Address of the recipient of the synth,
                             if not given defaults to `msg.sender`
            @return uint256 Synth balance remaining in `_token_id`
            """
            owner: address = self.id_to_owner[_token_id]
            if msg.sender != self.id_to_owner[_token_id]:
                assert owner != ZERO_ADDRESS, "Unknown Token ID"
                assert (
                    self.owner_to_operators[owner][msg.sender] or
                    msg.sender == self.id_to_approval[_token_id]
                ), "Caller is not owner or operator"
        
            settler: address = convert(_token_id % (2**160), address)
            synth: address = self.swappable_synth[_to]
            pool: address = self.synth_pools[synth]
        
            # ensure the synth is settled prior to swapping
            if not self.is_settled[_token_id]:
                currency_key: bytes32 = self.currency_keys[synth]
                self.exchanger.settle(settler, currency_key)
                self.is_settled[_token_id] = True
        
            # use Curve to exchange the synth for another asset which is sent to the receiver
            remaining: uint256 = Settler(settler).exchange(_to, pool, _amount, _expected, _receiver)
        
            # if the balance of the synth within the NFT is now zero, burn the NFT
            if remaining == 0:
                self.id_to_owner[_token_id] = ZERO_ADDRESS
                self.id_to_approval[_token_id] = ZERO_ADDRESS
                self.is_settled[_token_id] = False
                self.owner_to_token_count[msg.sender] -= 1
        
                count: uint256 = self.id_count
                # add 2**160 to increment the nonce for next time this settler is used
                self.available_token_ids[count] = _token_id + 2**160
                self.id_count = count + 1
        
                owner = ZERO_ADDRESS
                synth = ZERO_ADDRESS
                log Transfer(msg.sender, ZERO_ADDRESS, _token_id)
        
            log TokenUpdate(_token_id, owner, synth, remaining)
        
            return remaining
        ```

    === "Example"

        ```shell
        >>> wbtc = Contract('0x2260fac5e5542a773aa44fbcfedf7c193bc2c599')

        >>> amount = synth_swap.token_info(token_id)['underlying_balance']
        >>> expected = swynth_swap.get_swap_from_synth_amount(sbtc, wbtc, amount) * 0.99
        
        >>> synth_swap.swap_from_synth(token_id, wbtc, amount, expected, {'from': alice})
        Transaction sent: 0x83b311af19be08b8ec6241c3e834ccdf3b22586971de82a76a641e43bdf2b3ee
          Gas price: 20 gwei   Gas limit: 800000   Nonce: 6
        ```


### `withdraw`
!!! description "`StableSwap.withdraw(_token_id: uint256, _amount: uint256, _receiver: address = msg.sender) → uint256: nonpayable`"

    Withdraw the underlying synth represented by an NFT. Callable by the owner or operator of `_token_id` 
    after the synth settlement period has passed. If `_amount` is equal to the total remaining balance of the 
    synth represented by the NFT, the NFT is burned.

    Returns the remaining balance of the underlying synth within the active NFT.

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_token_id` |  `uint256` | The identifier for an NFT |
    | `_amount`   |  `uint256` | Amount of the underlying synth to swap |
    | `_receiver` |  `address` | Address of the recipient of the withdrawn synth. Defaults to the `msg.sender`. |

    Emits: <mark style="background-color: #FFD580; color: black">Transfer</mark> 
    <mark style="background-color: #FFD580; color: black">TokenUpdate</mark>

    ??? quote "Source code"

        ```python
        @external
        def withdraw(_token_id: uint256, _amount: uint256, _receiver: address = msg.sender) -> uint256:
            """
            @notice Withdraw the synth represented by an NFT.
            @dev Callable by the owner or operator of `_token_id` after the synth settlement
                 period has passed. If `_amount` is equal to the entire balance within
                 the NFT, the NFT is burned.
            @param _token_id The identifier for an NFT
            @param _amount Amount of the synth to withdraw
            @param _receiver Address of the recipient of the synth,
                             if not given defaults to `msg.sender`
            @return uint256 Synth balance remaining in `_token_id`
            """
            owner: address = self.id_to_owner[_token_id]
            if msg.sender != self.id_to_owner[_token_id]:
                assert owner != ZERO_ADDRESS, "Unknown Token ID"
                assert (
                    self.owner_to_operators[owner][msg.sender] or
                    msg.sender == self.id_to_approval[_token_id]
                ), "Caller is not owner or operator"
        
            settler: address = convert(_token_id % (2**160), address)
            synth: address = Settler(settler).synth()
        
            # ensure the synth is settled prior to withdrawal
            if not self.is_settled[_token_id]:
                currency_key: bytes32 = self.currency_keys[synth]
                self.exchanger.settle(settler, currency_key)
                self.is_settled[_token_id] = True
        
            remaining: uint256 = Settler(settler).withdraw(_receiver, _amount)
        
            # if the balance of the synth within the NFT is now zero, burn the NFT
            if remaining == 0:
                self.id_to_owner[_token_id] = ZERO_ADDRESS
                self.id_to_approval[_token_id] = ZERO_ADDRESS
                self.is_settled[_token_id] = False
                self.owner_to_token_count[msg.sender] -= 1
        
                count: uint256 = self.id_count
                # add 2**160 to increment the nonce for next time this settler is used
                self.available_token_ids[count] = _token_id + 2**160
                self.id_count = count + 1
        
                owner = ZERO_ADDRESS
                synth = ZERO_ADDRESS
                log Transfer(msg.sender, ZERO_ADDRESS, _token_id)
        
        
            log TokenUpdate(_token_id, owner, synth, remaining)
        
            return remaining
        ```

    === "Example"

        ```shell
        >>> amount = synth_swap.token_info(token_id)['underlying_balance']
        
        >>> synth_swap.withdraw(token_id, amount, {'from': alice})
        Transaction sent: 0x83b311af19be08b8ec6241c3e834ccdf3b22586971de82a76a641e43bdf2b3ee
          Gas price: 20 gwei   Gas limit: 800000   Nonce: 6
        ```


### `settle`
!!! description "`StableSwap.settle(_token_id: uint256) → bool: nonpayable`"

    Settle the synth represented in an NFT. Note that settlement is performed when swapping or withdrawing, 
    there is no requirement to call this function separately. 
    
    Returns: true (`bool`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_token_id` |  `uint256` | The identifier for an NFT |
    
    ??? quote "Source code"

        ```python
        @external
        def settle(_token_id: uint256) -> bool:
            """
            @notice Settle the synth represented in an NFT.
            @dev Settlement is performed when swapping or withdrawing, there
                 is no requirement to call this function separately.
            @param _token_id The identifier for an NFT
            @return bool Success
            """
            if not self.is_settled[_token_id]:
                assert self.id_to_owner[_token_id] != ZERO_ADDRESS, "Unknown Token ID"
        
                settler: address = convert(_token_id % (2**160), address)
                synth: address = Settler(settler).synth()
                currency_key: bytes32 = self.currency_keys[synth]
                self.exchanger.settle(settler, currency_key)  # dev: settlement failed
                self.is_settled[_token_id] = True
        
            return True
        ```

