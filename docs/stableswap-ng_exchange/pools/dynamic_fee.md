dynamic fee


??? quote "`upkeep_oracles`"

    ```python
    @view
    @internal
    def _dynamic_fee(xpi: uint256, xpj: uint256, _fee: uint256) -> uint256:

        _offpeg_fee_multiplier: uint256 = self.offpeg_fee_multiplier
        if _offpeg_fee_multiplier <= FEE_DENOMINATOR:
            return _fee

        xps2: uint256 = (xpi + xpj) ** 2
        return (
            (_offpeg_fee_multiplier * _fee) /
            ((_offpeg_fee_multiplier - FEE_DENOMINATOR) * 4 * xpi * xpj / xps2 + FEE_DENOMINATOR)
        )

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








    @view
    @external
    def dynamic_fee(i: int128, j: int128) -> uint256:
        """
        @notice Return the fee for swapping between `i` and `j`
        @param i Index value for the coin to send
        @param j Index value of the coin to recieve
        @return Swap fee expressed as an integer with 1e10 precision
        """
        return StableSwapViews(factory.views_implementation()).dynamic_fee(i, j, self)



    ### ----- VIEWS CONTRACT ----- ###
    @view
    @external
    def dynamic_fee(i: int128, j: int128, pool:address) -> uint256:
        """
        @notice Return the fee for swapping between `i` and `j`
        @param i Index value for the coin to send
        @param j Index value of the coin to recieve
        @return Swap fee expressed as an integer with 1e10 precision
        """
        N_COINS: uint256 = StableSwapNG(pool).N_COINS()
        fee: uint256 = StableSwapNG(pool).fee()
        fee_multiplier: uint256 = StableSwapNG(pool).offpeg_fee_multiplier()

        rates: DynArray[uint256, MAX_COINS] = empty(DynArray[uint256, MAX_COINS])
        balances: DynArray[uint256, MAX_COINS] = empty(DynArray[uint256, MAX_COINS])
        xp: DynArray[uint256, MAX_COINS] = empty(DynArray[uint256, MAX_COINS])
        rates, balances, xp = self._get_rates_balances_xp(pool, N_COINS)

        return self._dynamic_fee(xp[i], xp[j], fee, fee_multiplier)

    @view
    @internal
    def _dynamic_fee(xpi: uint256, xpj: uint256, _fee: uint256, _fee_multiplier: uint256) -> uint256:

        if _fee_multiplier <= FEE_DENOMINATOR:
            return _fee

        xps2: uint256 = (xpi + xpj) ** 2
        return (
            (_fee_multiplier * _fee) /
            ((_fee_multiplier - FEE_DENOMINATOR) * 4 * xpi * xpj / xps2 + FEE_DENOMINATOR)
        )

    @view
    @internal
    def _get_rates_balances_xp(pool: address, N_COINS: uint256) -> (
        DynArray[uint256, MAX_COINS],
        DynArray[uint256, MAX_COINS],
        DynArray[uint256, MAX_COINS],
    ):

        rates: DynArray[uint256, MAX_COINS] = StableSwapNG(pool).stored_rates()
        balances: DynArray[uint256, MAX_COINS] = StableSwapNG(pool).get_balances()
        xp: DynArray[uint256, MAX_COINS] = empty(DynArray[uint256, MAX_COINS])
        for idx in range(MAX_COINS):
            if idx == N_COINS:
                break
            xp.append(rates[idx] * balances[idx] / PRECISION)

        return rates, balances, xp
    ```

