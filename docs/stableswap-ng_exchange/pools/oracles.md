QUESTIONS:
- what is the state price of an AMM?
- `last_price` and `ema_price` only returns the stored values whereas `price_oracle` and `get_p` calculates the up-to-date prices


## **Oracles**

The new generation (NG) of stableswap introduces oracles based on AMM State Prices. The Pool contract records exponential moving averages for coins 1, 2 and 3 relative to coin 0. 

Oracles are kept up when users perform a swap or liquidity is added or removed form the pool. Updating happens via the internal `upkeep_oracles()` function.

??? quote "`upkeep_oracles`"

    ```python
    @internal
    def upkeep_oracles(xp: DynArray[uint256, MAX_COINS], amp: uint256, D: uint256):
        """
        @notice Upkeeps price and D oracles.
        """
        ma_last_time_unpacked: uint256[2] = self.unpack_2(self.ma_last_time) 
        last_prices_packed_current: DynArray[uint256, MAX_COINS] = self.last_prices_packed
        last_prices_packed_new: DynArray[uint256, MAX_COINS] = last_prices_packed_current #(1)

        spot_price: DynArray[uint256, MAX_COINS] = self._get_p(xp, amp, D)  #(2)

        # -------------------------- Upkeep price oracle -------------------------
        #(3)
        for i in range(MAX_COINS):

            if i == N_COINS - 1:
                break

            if spot_price[i] != 0:

                # Upate packed prices -----------------
                last_prices_packed_new[i] = self.pack_2(
                    spot_price[i],
                    self._calc_moving_average(
                        last_prices_packed_current[i],
                        self.ma_exp_time,
                        ma_last_time_unpacked[0],  # index 0 is ma_exp_time for prices
                    )
                )

        self.last_prices_packed = last_prices_packed_new

        # ---------------------------- Upkeep D oracle ---------------------------

        last_D_packed_current: uint256 = self.last_D_packed
        self.last_D_packed = self.pack_2(
            D,
            self._calc_moving_average(
                last_D_packed_current,
                self.D_ma_time,
                ma_last_time_unpacked[1],  # index 1 is ma_exp_time for D
            )
        )

        # Housekeeping: Update ma_last_time for p and D oracles ------------------
        for i in range(2):
            if ma_last_time_unpacked[i] < block.timestamp:
                ma_last_time_unpacked[i] = block.timestamp

        self.ma_last_time = self.pack_2(ma_last_time_unpacked[0], ma_last_time_unpacked[1])
    ```

    1. unpacks `ma_last_time` and assign it to a new variable. `last_prices_packed` gets stored into a variable for *current* and *new* last prices.
    2. Calculates the spot price with the internal `_get_p()` function and stores it in `spot_price`.
    3. Iterates through the number of coins in the pool. 







??? quote "`Token Exchange Oracle`"

    ```python
    @external
    @nonreentrant('lock')
    def exchange(
        i: int128,
        j: int128,
        _dx: uint256,
        _min_dy: uint256,
        _receiver: address = msg.sender,
    ) -> uint256:
        """
        @notice Perform an exchange between two coins
        @dev Index values can be found via the `coins` public getter method
        @param i Index value for the coin to send
        @param j Index value of the coin to recieve
        @param _dx Amount of `i` being exchanged
        @param _min_dy Minimum amount of `j` to receive
        @return Actual amount of `j` received
        """
        return self._exchange(
            msg.sender,
            i,
            j,
            _dx,
            _min_dy,
            _receiver,
            False
        )


    @internal
    def _exchange(
        sender: address,
        i: int128,
        j: int128,
        _dx: uint256,
        _min_dy: uint256,
        receiver: address,
        expect_optimistic_transfer: bool
    ) -> uint256:

        assert i != j  # dev: coin index out of range
        assert _dx > 0  # dev: do not exchange 0 coins

        rates: DynArray[uint256, MAX_COINS] = self._stored_rates()
        old_balances: DynArray[uint256, MAX_COINS] = self._balances()
        xp: DynArray[uint256, MAX_COINS] = self._xp_mem(rates, old_balances)

        # --------------------------- Do Transfer in -----------------------------

        # `dx` is whatever the pool received after ERC20 transfer:
        dx: uint256 = self._transfer_in(
            i,
            _dx,
            sender,
            expect_optimistic_transfer
        )

        # ------------------------------- Exchange -------------------------------

        x: uint256 = xp[i] + dx * rates[i] / PRECISION
        dy: uint256 = self.__exchange(x, xp, rates, i, j)
        assert dy >= _min_dy, "Exchange resulted in fewer coins than expected"

        # --------------------------- Do Transfer out ----------------------------

        self._transfer_out(j, dy, receiver)

        # ------------------------------------------------------------------------

        log TokenExchange(msg.sender, i, _dx, j, dy)

        return dy


    @internal
    def __exchange(
        x: uint256,
        _xp: DynArray[uint256, MAX_COINS],
        rates: DynArray[uint256, MAX_COINS],
        i: int128,
        j: int128,
    ) -> uint256:

        amp: uint256 = self._A()
        D: uint256 = self.get_D(_xp, amp)
        y: uint256 = self.get_y(i, j, x, _xp, amp, D)

        dy: uint256 = _xp[j] - y - 1  # -1 just in case there were some rounding errors
        dy_fee: uint256 = dy * self._dynamic_fee((_xp[i] + x) / 2, (_xp[j] + y) / 2, self.fee) / FEE_DENOMINATOR

        # Convert all to real units
        dy = (dy - dy_fee) * PRECISION / rates[j]

        self.admin_balances[j] += (
            dy_fee * admin_fee / FEE_DENOMINATOR
        ) * PRECISION / rates[j]

        # Calculate and store state prices:
        xp: DynArray[uint256, MAX_COINS] = _xp
        xp[i] = x
        xp[j] = y
        # D is not changed because we did not apply a fee
        self.upkeep_oracles(xp, amp, D)

        return dy


    @pure
    @internal
    def _xp_mem(
        _rates: DynArray[uint256, MAX_COINS],
        _balances: DynArray[uint256, MAX_COINS]
    ) -> DynArray[uint256, MAX_COINS]:

        result: DynArray[uint256, MAX_COINS] = empty(DynArray[uint256, MAX_COINS])
        for i in range(MAX_COINS_128):
            if i == N_COINS_128:
                break
            result.append(_rates[i] * _balances[i] / PRECISION)
        return result


    @view
    @internal
    def _stored_rates() -> DynArray[uint256, MAX_COINS]:
        """
        @notice Gets rate multipliers for each coin.
        @dev If the coin has a rate oracle that has been properly initialised,
            this method queries that rate by static-calling an external
            contract.
        """
        rates: DynArray[uint256, MAX_COINS] = rate_multipliers
        oracles: DynArray[uint256, MAX_COINS] = self.oracles

        for i in range(MAX_COINS_128):

            if i == N_COINS_128:
                break

            if oracles[i] == 0:
                continue

            # NOTE: assumed that response is of precision 10**18
            response: Bytes[32] = raw_call(
                convert(oracles[i] % 2**160, address),
                _abi_encode(oracles[i] & ORACLE_BIT_MASK),
                max_outsize=32,
                is_static_call=True,
            )
            rates[i] = rates[i] * convert(response, uint256) / PRECISION

        return rates

    @view
    @internal
    def _balances() -> DynArray[uint256, MAX_COINS]:
        """
        @notice Calculates the pool's balances _excluding_ the admin's balances.
        @dev If the pool contains rebasing tokens, this method ensures LPs keep all
                rebases and admin only claims swap fees. This also means that, since
                admin's balances are stored in an array and not inferred from read balances,
                the fees in the rebasing token that the admin collects is immune to
                slashing events.
        """
        result: DynArray[uint256, MAX_COINS] = empty(DynArray[uint256, MAX_COINS])
        balances_i: uint256 = 0

        for i in range(MAX_COINS_128):

            if i == N_COINS_128:
                break

            if POOL_IS_REBASING_IMPLEMENTATION:
                balances_i = ERC20(coins[i]).balanceOf(self) - self.admin_balances[i]
            else:
                balances_i = self.stored_balances[i] - self.admin_balances[i]

            result.append(balances_i)

        return result
    ```