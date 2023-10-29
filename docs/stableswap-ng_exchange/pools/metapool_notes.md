metapool notes:





`exchange` does work very similar to plain pool echange function as it only swap between two tokens (metapool token and basepool token)




exchanging metapool token for underlying token:
`exchange_underlying` -> `_exchange_underlying` -> `__exchange`

possibilities:
swap metapool token to underlying basepool token

input:
i, j, _dx, _min_dy, _receiver

-- fetching data and setting variables -- 
_exchange_underlying():
get rates -> self._stored_rates()
gets old balances -> self._balances()
gets xp -> self._xp_mem(rates, balances)

declaring the following variables and setting them to 0:
dy, base_i, base_j, meta_i, meta_j, x, output_coin



-- determine coin indices --
base_i and base_j is the index value of the coins within the basepool


meta_i and base_j is the index calue of the coins within the metapool itself, meaining 0 = metapool token and 1 = basepool lp token


    example: if i == 3 and j == 0: (e.g. want to swap usdt to lusd)
        meta_i = 1 (because input coin is a underlying token from the basepool)
        base_i = i - MAX_METAPOOL_COIN_INDEX, meaning 3 - 1 = 2 (index 2 in the basepool)


    example: i == 0 and j == 3
        meta_i = 0
        base_i = 0
        meta_j = 1
        base_j = j - MAX_METAPOOL_COIN_INDEX, meaning 3 - 1 = 2
        output_coin = BASE_COINS[base_j]

        now when transfering in the tokens (i > 0 and j > 0), _transfer_in checks this. in our second example this is false, and therefor it will add liquitity to the basepool. this makes sense as


COIN INDICES EXAMPLES

    dy: uint256 = 0
    base_i: int128 = 0
    base_j: int128 = 0
    meta_i: int128 = 0
    meta_j: int128 = 0
    x: uint256 = 0
    output_coin: address = empty(address)  


    example1: i == 1 & j == 0:      --> swapping DAI for LUSD
        base_i = i - MAX_METAPOOL_COIN_INDEX = 1 - 1 = 0
        meta_i = 1
        (base_j = 0) what are these needed for?
        (meta_j = 0) what are these needed for?
        output_coin = coins[0] (which is the metapool token)

        _transfer_in(meta_i, base_i, dx, sender, expect_optimistic_transfer, (i > 0 and j > 0))

            meta_i = coin_metapool_idx = 1
            base_i = coin_basepool_idx = 0

            _input_coin: ERC20 = ERC20(coins[coin_metapool_idx])
            _stored_balance: uint256 = self.stored_balances[coin_metapool_idx]
            _input_coin_is_in_base_pool: bool = False

            if coin_basepool_idx >= 0 and coin_metapool_idx == 1: -> this is true in our case
                _input_coin = ERC20(BASE_COINS[coin_basepool_idx]), meaning input coin is DAI
                _input_coin_is_in_base_pool = True

            then gets _dx = _input_coin.balanceOf(self), gets balanceOf DAI in the pool before transfer

            --- Handle Transfers ---
            neglect optimistic transfers for now
            assert dx > 0: makes sure that more than 0 is transfered
            
            then transfers dx amount from sender to the pool and checks the again the balanceOf DAI in the pool after the transfer in (_dx).

            Then checks if liquidity needs to be added somewhere. adds dai to the basepool and _dx is the returned amount of lp tokens. stored_balances[coin_metapool_idx] are then updated with _dx.

    -------------------------------
    WHAT DID WE DO SO FAR?
    we want to swap DAI for LUSD, so when transfering in, DAI first needs to be added to the basepool so we obtain 3crv lp tokens which can now be swapped for LUSD. The logic for this is in the `exchange_underlying` again.
    -------------------------------

            now checks if i or j is 0, if yes we have a regular metapool swap. this is the case with our DAI<>LUSD swap. 
            calculates some stuff and gets x. 

            then calculates dy with __exchange(x, xp, rates, meta_i, meta_j) and adjust stored balances of meta-level tokens.

            if j>0, we need to remove_liquidity_one_coin, because we actually swapped for a basepool token.


            If i and j is not 0, we have a base pool swap.
            this just swaps the two tokens within the base pool, as it is much more gas efficient.

            then dy tokens are transfered out of the pool to the receiver.

            log events and return dy












    example2: i == 0 & j == 1:      --> swapping LUSD for DAI
        base_j = j - MAX_METAPOOL_COIN_INDEX = 0 (index value of the output coin within the basepool)
        meta_j = 1
        output_coin = BASE_COINS[base_j]

    example3: i == 1 & j == 2:      --> swapping DAI to USDC
        base_i = i - MAX_METAPOOL_COIN_INDEX = 1 - 1 = 0
        meta_i = 1
        base_j = j - MAX_METAPOOL_COIN_INDEX = 2 - 1 = 1
        meta_j = 1
        output_coin = BASE_COINS[base_j]



meta_i = coin_metapool_idx
base_i = coin_basepool_idx





    -- input coin indices --
if input coin index value is > 0, meaning it is not the metapool token but rather a token from the basepool:
    base_i = i - MAX_METAPOOL_COIN_INDEX and
    meta_i = 1

    -- output coin indices --
if j == 0, meaning output token is the metapool token, then output_coin = coins[0]
else, base_j = j - MAX_METAPOOL_COIN_INDEX, meta_j = i and output_coin = BASE_COIN[base_j]



-- transfer tokens in --
if the incoming coin is supposed to go to the base pool, then _transfer_in method will add_liquitiy in the basepool and return dx_w_fee LP tokoen (number of lp tokens including fees).
the final input of the transfer function needs a bool, funnily the statment can directly put into the input value as (i>0 and j>0, meaning this is a pure basepool swap so there is no need to add liquitity). if this is true, then the function DOES NOT need to add liquidity to the basepool!



-- exchange --
if i or j is 0 --> metapool swap.

    if i is 0: (metapool coin is the input coin and one of basepool tokems is output coin (or the basepool lp token?))
        some calcs to define x

    else: (when j is 0; output token is the metapool token)
        if this is the case, the _transfer_in added liquitiy to the basepool before
        some calcs to define x again
        
    then we can calculate dy by calling __exchange(x, xp, rates, meta_i, meta_j) and update stored_balances;

    if j > 0, meaning output token is a underlying token of the basepool
        withdraws liquidity from the basepool

else: (it is a basepool swap as i or j IS NOT 0.)
    this function will just use the exchange function within the basepool

-- coins are transfered out --











