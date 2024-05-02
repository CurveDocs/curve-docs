<h1>Curve DAO Token (CRV)</h1>

Curve DAO Token is based on the ERC-20 token standard as defined at [EIP-20](https://eips.ethereum.org/EIPS/eip-20).

!!!deploy "Contract Source & Deployment"
    The **`Curve DAO Token`** contract is [deployed](https://etherscan.io/tx/0x5dc4a688b63cea09bf4d73a695175b77572792a2e2b3656297809ad3596d4bfe) to the Ethereum mainnet at: [0xD533a949740bb3306d119CC777fa900bA034cd52](https://etherscan.io/address/0xD533a949740bb3306d119CC777fa900bA034cd52#code).

    Source code is available on [:material-github: Github](https://github.com/curvefi/curve-dao-contracts/blob/567927551903f71ce5a73049e077be87111963cc/contracts/ERC20CRV.vy). 

For a broader understanding of the use case of the CRV token, check out [**Understanding CRV**](https://resources.curve.fi/crv-token/understanding-crv/).


---

## **Tokenomics**


<div id="highcharts-790fd468-1065-4292-97a0-953f69e6d14f"></div>  
<script>
(function(){ var files = ["https://code.highcharts.com/stock/highstock.js","https://code.highcharts.com/highcharts-more.js","https://code.highcharts.com/highcharts-3d.js","https://code.highcharts.com/modules/data.js","https://code.highcharts.com/modules/exporting.js","https://code.highcharts.com/modules/funnel.js","https://code.highcharts.com/modules/annotations.js","https://code.highcharts.com/modules/accessibility.js","https://code.highcharts.com/modules/solid-gauge.js"],loaded = 0; if (typeof window["HighchartsEditor"] === "undefined") {window.HighchartsEditor = {ondone: [cl],hasWrapped: false,hasLoaded: false};include(files[0]);} else {if (window.HighchartsEditor.hasLoaded) {cl();} else {window.HighchartsEditor.ondone.push(cl);}}function isScriptAlreadyIncluded(src){var scripts = document.getElementsByTagName("script");for (var i = 0; i < scripts.length; i++) {if (scripts[i].hasAttribute("src")) {if ((scripts[i].getAttribute("src") || "").indexOf(src) >= 0 || (scripts[i].getAttribute("src") === "http://code.highcharts.com/highcharts.js" && src === "https://code.highcharts.com/stock/highstock.js")) {return true;}}}return false;}function check() {if (loaded === files.length) {for (var i = 0; i < window.HighchartsEditor.ondone.length; i++) {try {window.HighchartsEditor.ondone[i]();} catch(e) {console.error(e);}}window.HighchartsEditor.hasLoaded = true;}}function include(script) {function next() {++loaded;if (loaded < files.length) {include(files[loaded]);}check();}if (isScriptAlreadyIncluded(script)) {return next();}var sc=document.createElement("script");sc.src = script;sc.type="text/javascript";sc.onload=function() { next(); };document.head.appendChild(sc);}function each(a, fn){if (typeof a.forEach !== "undefined"){a.forEach(fn);}else{for (var i = 0; i < a.length; i++){if (fn) {fn(a[i]);}}}}var inc = {},incl=[]; each(document.querySelectorAll("script"), function(t) {inc[t.src.substr(0, t.src.indexOf("?"))] = 1; }); function cl() {if(typeof window["Highcharts"] !== "undefined"){Highcharts.setOptions({lang:{}});var options={"title":{"text":"CRV Distribution"},"subtitle":{"text":""},"exporting":{},"chart":{"type":"pie","polar":false,"width":null,"height":null,"borderWidth":0,"borderRadius":0,"inverted":false,"style":{"fontFamily":"\"Lucida Grande\", \"Lucida Sans Unicode\", Verdana, Arial, Helvetica, sans-serif","color":"#333","fontSize":"12px","fontWeight":"normal","fontStyle":"normal"}},"plotOptions":{"pie":{"allowPointSelect":true,"cursor":true,"showInLegend":true,"dataLabels":{"enabled":false}},"series":{"animation":false,"dataLabels":{"enabled":false}}},"series":[{"lineWidth":2,"allowPointSelect":false,"crisp":true,"showCheckbox":false,"animation":false,"enableMouseTracking":true,"events":{},"point":{"events":{}},"dataLabels":{"animation":{},"align":"center","borderWidth":0,"defer":true,"formatter":"function(){let{numberFormatter:t}=this.series.chart;return\"number\"!=typeof this.y?\"\":t(this.y,-1)}","padding":5,"style":{"fontSize":"0.7em","fontWeight":"bold","color":"contrast","textOutline":"1px contrast"},"verticalAlign":"bottom","x":0,"y":0,"connectorPadding":5,"connectorShape":"crookedLine","distance":30,"enabled":false,"softConnector":true},"cropThreshold":300,"opacity":1,"pointRange":0,"softThreshold":true,"states":{"normal":{"animation":true},"hover":{"animation":{"duration":150},"lineWidthPlus":1,"marker":{},"halo":{"size":10,"opacity":0.25},"brightness":0.1},"select":{"animation":{"duration":0}},"inactive":{"animation":{"duration":150},"opacity":0.2}},"stickyTracking":true,"turboThreshold":0,"findNearestPointBy":"x","borderRadius":3,"center":[null,null],"clip":false,"colorByPoint":true,"ignoreHiddenPoint":true,"inactiveOtherPoints":true,"legendType":"point","size":null,"showInLegend":true,"slicedOffset":10,"tooltip":{"followPointer":true},"borderColor":"#ffffff","borderWidth":1,"cursor":true,"name":"Allocation in %","legendSymbol":"rectangle","threshold":0,"stacking":"normal","dataGrouping":{"groupPixelWidth":2,"dateTimeLabelFormats":{"millisecond":["%A, %e %b, %H:%M:%S.%L","%A, %e %b, %H:%M:%S.%L","-%H:%M:%S.%L"],"second":["%A, %e %b, %H:%M:%S","%A, %e %b, %H:%M:%S","-%H:%M:%S"],"minute":["%A, %e %b, %H:%M","%A, %e %b, %H:%M","-%H:%M"],"hour":["%A, %e %b, %H:%M","%A, %e %b, %H:%M","-%H:%M"],"day":["%A, %e %b %Y","%A, %e %b","-%A, %e %b %Y"],"week":["Week from %A, %e %b %Y","%A, %e %b","-%A, %e %b %Y"],"month":["%B %Y","%B","-%B %Y"],"year":["%Y","%Y","-%Y"]}},"marker":{"enabled":false,"symbol":"circle"},"type":"pie"}],"data":{"csv":"\"Column 1\";\"Allocation in %\"\n\"Community Liquidity Providers\";62\n\"Shareholders\";30\n\"Community Reserve\";5\n\"Employees\";3","googleSpreadsheetKey":false,"googleSpreadsheetWorksheet":false},"legend":{"layout":"horizontal","enabled":true,"align":"center","x":0,"verticalAlign":"bottom","floating":false},"tooltip":{"shared":false},"yAxis":[{"title":{"text":""},"labels":{}}],"colors":["#a34aa1","#688cbb","#aa4c48","#57a050"],"xAxis":[{"title":{"text":""},"labels":{}}],"lang":{},"credits":{"text":"","href":""}};/*
// Sample of extending options:
Highcharts.merge(true, options, {
    chart: {
        backgroundColor: "#bada55"
    },
    plotOptions: {
        series: {
            cursor: "pointer",
            events: {
                click: function(event) {
                    alert(this.name + " clicked\n" +
                          "Alt: " + event.altKey + "\n" +
                          "Control: " + event.ctrlKey + "\n" +
                          "Shift: " + event.shiftKey + "\n");
                }
            }
        }
    }
});
*/new Highcharts.Chart("highcharts-790fd468-1065-4292-97a0-953f69e6d14f", options);}}})();
</script>



*The total supply of 3.03 billion is distributed as follows:*

- **62% to community liquidity providers**
- **30% to shareholders (team and investors)** with a vesting period of 2-4 years
- **5% to the community reserve**
- **3% to employees** with a 2-year vesting period

*The initial supply of approximately 1.3 billion (~43%) is distributed as follows:*

- **5% to pre-CRV liquidity providers** with a 1-year vesting
- **30% to shareholders (team and investors)** with a vesting period of 2-4 years
- **3% to employees** with a 2-year vesting period
- **5% to the community reserve**


---


## **Transfer and Allowance**

### `approve`
!!! description "`CRV.approve(_spender: address, _value: uint256) -> bool:`"

    !!!warning 
        Approval may only be from `zero -> nonzero` or from `nonzero -> zero` in order to mitigate the potential race condition described here: https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729

    Function to approve `_spender` to transfer `_value` tokens on behalf of `msg.sender`.

    Returns: true (`bool`).

    Emits: `Approval`

    | Input      | Type      | Description        |
    | ---------- | --------- | ------------------ |
    | `_spender` | `address` | Spender address.   |
    | `_value`   | `uint256` | Amount to approve. |

    ??? quote "Source code"

        ```vyper 
        event Approval:
            _owner: indexed(address)
            _spender: indexed(address)
            _value: uint256

        allowances: HashMap[address, HashMap[address, uint256]]

        @external
        def approve(_spender : address, _value : uint256) -> bool:
            """
            @notice Approve `_spender` to transfer `_value` tokens on behalf of `msg.sender`
            @dev Approval may only be from zero -> nonzero or from nonzero -> zero in order
                to mitigate the potential race condition described here:
                https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
            @param _spender The address which will spend the funds
            @param _value The amount of tokens to be spent
            @return bool success
            """
            assert _value == 0 or self.allowances[msg.sender][_spender] == 0
            self.allowances[msg.sender][_spender] = _value
            log Approval(msg.sender, _spender, _value)
            return True
        ```

    === "Example"
        ```shell
        >>> soon
        ```


### `allowance`
!!! description "`CRV.allowance(_owner: address, _spender: address) -> uint256`"

    Getter method to check the amount of tokens that `_owner` has allowed `_spender` to use.

    Returns: amount of tokens (`uint256`) that `_owner` has allowed `_spender` to use.

    | Input      | Type      | Description      |
    |------------|-----------|----------------- |
    | `_owner`   | `address` | Owner address.   |
    | `_spender` | `address` | Spender address. |

    ??? quote "Source code"

        ```vyper
        allowances: HashMap[address, HashMap[address, uint256]]

        @external
        @view
        def allowance(_owner : address, _spender : address) -> uint256:
            """
            @notice Check the amount of tokens that an owner allowed to a spender
            @param _owner The address which owns the funds
            @param _spender The address which will spend the funds
            @return uint256 specifying the amount of tokens still available for the spender
            """
            return self.allowances[_owner][_spender]
        ```

    === "Example"
        ```shell
        >>> CRV.allowance(0x7a16fF8270133F063aAb6C9977183D9e72835428 ,0x68BEDE1d0bc6BE6d215f8f8Ee4ee8F9faB97fE7a)
        0
        ```


### `transfer`
!!! description "`CRV.transfer(_to: address, _value: uint256) -> bool`"

    !!!warning
        Vyper does not allow underflows; thus, any subtraction in this function will revert if there is an insufficient balance.

        Additionally, transfers to `ZERO_ADDRESS` are not allowed.

    Function to transfer `_value` tokens from `msg.sender` to `_to`. 

    Returns: true (`bool`).

    Emits: `Transfer`

    | Input    | Type      | Description                     |
    | -------- | --------- | ------------------------------- |
    | `_to`    | `address` | Receiver address of the tokens. |
    | `_value` | `uint256` | Amount of tokens to transfer.   |

    ??? quote "Source code"

        ```vyper 
        event Transfer:
            _from: indexed(address)
            _to: indexed(address)
            _value: uint256

        @external
        def transfer(_to : address, _value : uint256) -> bool:
            """
            @notice Transfer `_value` tokens from `msg.sender` to `_to`
            @dev Vyper does not allow underflows, so the subtraction in
                this function will revert on an insufficient balance
            @param _to The address to transfer to
            @param _value The amount to be transferred
            @return bool success
            """
            assert _to != ZERO_ADDRESS  # dev: transfers to 0x0 are not allowed
            self.balanceOf[msg.sender] -= _value
            self.balanceOf[_to] += _value
            log Transfer(msg.sender, _to, _value)
            return True
        ```

    === "Example"
        ```shell
        >>> CRV.transfer('0x7a16fF8270133F063aAb6C9977183D9e72835428', 1)
        'True'
        ```


### `transferFrom`
!!! description "`CRV.transferFrom(_from: address, _to: address, _value: uint256) -> bool:`"

    !!!warning
        Vyper does not allow underflows; thus, any subtraction in this function will revert if there is an insufficient balance.

        Additionally, transfers to `ZERO_ADDRESS` are not allowed.

    Function to transfer `_value` tokens from `_from_` to `_to`.

    Returns: true (`bool`).

    Emits: `Transfer`

    | Input    | Type      | Description                     |
    | -------- | --------- | ------------------------------- |
    | `_from`  | `address` | Address to send tokens from.    |
    | `_to`    | `address` | Receiver address of the tokens. |
    | `_value` | `uint256` | Amount of tokens to transfer.   |

    ??? quote "Source code"

        ```vyper 
        event Transfer:
            _from: indexed(address)
            _to: indexed(address)
            _value: uint256

        @external
        def transferFrom(_from : address, _to : address, _value : uint256) -> bool:
            """
            @notice Transfer `_value` tokens from `_from` to `_to`
            @param _from address The address which you want to send tokens from
            @param _to address The address which you want to transfer to
            @param _value uint256 the amount of tokens to be transferred
            @return bool success
            """
            assert _to != ZERO_ADDRESS  # dev: transfers to 0x0 are not allowed
            # NOTE: vyper does not allow underflows
            #       so the following subtraction would revert on insufficient balance
            self.balanceOf[_from] -= _value
            self.balanceOf[_to] += _value
            self.allowances[_from][msg.sender] -= _value
            log Transfer(_from, _to, _value)
            return True
        ```

    === "Example"
        ```shell
        >>> CRV.transferFrom('0x7a16fF8270133F063aAb6C9977183D9e72835428', '0x68BEDE1d0bc6BE6d215f8f8Ee4ee8F9faB97fE7a', 1)
        'True'
        ```


---


## **Minting and Burning**

New CRV tokens can only be minted by the `minter` contract.

### `minter`
!!! description "`CRV.minter() -> address: view`"

    Getter for the minter contract address. The minter address can only be set once (at deployment) and not altered after.

    Returns: minter contract (`address`).

    ??? quote "Source code"

        ```vyper
        minter: public(address)
        ```

    === "Example"
        ```shell
        >>> CRV.minter()
        '0xd061D61a4d941c39E5453435B6345Dc261C2fcE0'
        ```



### `mint`
!!! description "`CRV.mint(_to: address, _value: uint256) -> bool:`"

    Function to mint `_value` and assign them to `_to`.

    Returns: true (`bool`)

    Emits: `Transfer`

    | Input    | Type      | Description                    |
    | -------- | --------- | ------------------------------ |
    | `_to`    | `address` | Receiver of the minted tokens. |
    | `_value` | `uint256` | Amount to mint.                |

    ??? quote "Source code"

        ```vyper
        event Transfer:
            _from: indexed(address)
            _to: indexed(address)
            _value: uint256

        @external
        def mint(_to: address, _value: uint256) -> bool:
            """
            @notice Mint `_value` tokens and assign them to `_to`
            @dev Emits a Transfer event originating from 0x00
            @param _to The account that will receive the created tokens
            @param _value The amount that will be created
            @return bool success
            """
            assert msg.sender == self.minter  # dev: minter only
            assert _to != ZERO_ADDRESS  # dev: zero address

            if block.timestamp >= self.start_epoch_time + RATE_REDUCTION_TIME:
                self._update_mining_parameters()

            _total_supply: uint256 = self.total_supply + _value
            assert _total_supply <= self._available_supply()  # dev: exceeds allowable mint amount
            self.total_supply = _total_supply

            self.balanceOf[_to] += _value
            log Transfer(ZERO_ADDRESS, _to, _value)

            return True
        ```

    === "Example"
        ```shell
        >>> soon
        ```


### `mintable_in_timeframe`
!!! description "`CRV.mintable_in_timeframe(start: uint256, end: uint256) -> uint256`"

    Getter for the mintable supply between `start` and `end` timestamps. The value is dependent on the current emission `rate` of the token.

    Returns: mintable tokens (`uint256`).

    | Input   | Type      | Description      |
    |-------- | --------- | ---------------- |
    | `start` | `uint256` | Start timestamp. |
    | `end`   | `uint256` | End timestamp.   |

    ??? quote "Source code"

        ```vyper
        @external
        @view
        def mintable_in_timeframe(start: uint256, end: uint256) -> uint256:
            """
            @notice How much supply is mintable from start timestamp till end timestamp
            @param start Start of the time interval (timestamp)
            @param end End of the time interval (timestamp)
            @return Tokens mintable from `start` till `end`
            """
            assert start <= end  # dev: start > end
            to_mint: uint256 = 0
            current_epoch_time: uint256 = self.start_epoch_time
            current_rate: uint256 = self.rate

            # Special case if end is in future (not yet minted) epoch
            if end > current_epoch_time + RATE_REDUCTION_TIME:
                current_epoch_time += RATE_REDUCTION_TIME
                current_rate = current_rate * RATE_DENOMINATOR / RATE_REDUCTION_COEFFICIENT

            assert end <= current_epoch_time + RATE_REDUCTION_TIME  # dev: too far in future

            for i in range(999):  # Curve will not work in 1000 years. Darn!
                if end >= current_epoch_time:
                    current_end: uint256 = end
                    if current_end > current_epoch_time + RATE_REDUCTION_TIME:
                        current_end = current_epoch_time + RATE_REDUCTION_TIME

                    current_start: uint256 = start
                    if current_start >= current_epoch_time + RATE_REDUCTION_TIME:
                        break  # We should never get here but what if...
                    elif current_start < current_epoch_time:
                        current_start = current_epoch_time

                    to_mint += current_rate * (current_end - current_start)

                    if start >= current_epoch_time:
                        break

                current_epoch_time -= RATE_REDUCTION_TIME
                current_rate = current_rate * RATE_REDUCTION_COEFFICIENT / RATE_DENOMINATOR  # double-division with rounding made rate a bit less => good
                assert current_rate <= INITIAL_RATE  # This should never happen

            return to_mint
        ```

    === "Example"
        ```shell
        >>> CRV.mintable_in_timeframe(1682892000, 1683496800)
        3726756852824660365468800
        ``` 


### `burn`
!!! description "`CRV.burn(_value: uint256) -> bool`"
    
    Function to burn `_value` tokens of the function caller by sending them to [`ZERO_ADDRESS`](https://etherscan.io/address/0x0000000000000000000000000000000000000000).

    Retruns: true (`bool`).

    Emits: `Transfer`

    | Input    | Type      | Description               |
    | -------- | --------- | ------------------------- |
    | `_value` | `uint256` | Amount of tokens to burn. |

    ??? quote "Source code"

        ```vyper
        event Transfer:
            _from: indexed(address)
            _to: indexed(address)
            _value: uint256

        @external
        def burn(_value: uint256) -> bool:
            """
            @notice Burn `_value` tokens belonging to `msg.sender`
            @dev Emits a Transfer event with a destination of 0x00
            @param _value The amount that will be burned
            @return bool success
            """
            self.balanceOf[msg.sender] -= _value
            self.total_supply -= _value

            log Transfer(msg.sender, ZERO_ADDRESS, _value)
            return True
        ```

    === "Example"   
        ```shell
        >>> CRV.burn(1000000000000000000)
        'True'
        ```


---


## **CRV Emissions**

Mining parameters are used to determine token emissions, which are based on epochs (one year). With each passing epoch, the `rate` will be reduced, consequently decreasing the overall CRV emissions.

The rate can be adjusted by invoking the `update_mining_parameters()` function. Although this function is accessible to anyone, attempts to call it will be reverted if a year has not elapsed since the last update. When successfully executed, the `mining_epoch` increments by 1, and the `start_epoch_time` updates to the timestamp of the function call. Furthermore, the `update_mining_parameters()` function will automatically trigger if someone attempts to mint CRV before a scheduled rate reduction.

*The future rate is calculated as follows:*

$$\text{rate}_\text{future} = \text{rate}_\text{current} * \frac{10^{18}}{2^{\frac{1}{4}} * 10^{18}}$$

with $\text{rate}_\text{current}$ fetched from [`CRV.rate()`](#rate).

!!!info "Yearly Inflation Reduction"
    **Effectively, each rate reduction decreases CRV inflation by approximately 15.9%.**


---


### `mining_epoch`
!!! description "`CRV.mining_epoch() -> int128: view`"

    Getter for the current mining epoch. The mining epoch is incremented by 1 every time [`update_mining_parameters()`](#update_mining_parameters) is successfully called. At deployment, `mining_epoch` was set to -1.

    Returns: mining epoch (`int128`).

    ??? quote "Source code"

        ```vyper
        mining_epoch: public(int128)

        @external
        def __init__(_name: String[64], _symbol: String[32], _decimals: uint256):
            """
            @notice Contract constructor
            @param _name Token full name
            @param _symbol Token symbol
            @param _decimals Number of decimals for token
            """
            ...
            self.mining_epoch = -1
            ...

        @internal
        def _update_mining_parameters():
            """
            @dev Update mining rate and supply at the start of the epoch
                Any modifying mining call must also call this
            """
            _rate: uint256 = self.rate
            _start_epoch_supply: uint256 = self.start_epoch_supply

            self.start_epoch_time += RATE_REDUCTION_TIME
            self.mining_epoch += 1

            if _rate == 0:
                _rate = INITIAL_RATE
            else:
                _start_epoch_supply += _rate * RATE_REDUCTION_TIME
                self.start_epoch_supply = _start_epoch_supply
                _rate = _rate * RATE_DENOMINATOR / RATE_REDUCTION_COEFFICIENT

            self.rate = _rate

            log UpdateMiningParameters(block.timestamp, _rate, _start_epoch_supply)
        ```

    === "Example" 
        ```shell
        >>> CRV.mining_epoch()
        3
        ```


### `start_epoch_time`
!!! description "`CRV.start_epoch_time() -> uint256: view`"

    Getter for the start timestamp of the current mining epoch.

    Returns: timestamp (`uint256`).

    ??? quote "Source code"

        ```vyper
        start_epoch_time: public(uint256)

        @external
        def __init__(_name: String[64], _symbol: String[32], _decimals: uint256):
            """
            @notice Contract constructor
            @param _name Token full name
            @param _symbol Token symbol
            @param _decimals Number of decimals for token
            """
            ...

            self.start_epoch_time = block.timestamp + INFLATION_DELAY - RATE_REDUCTION_TIME

            ...
        ```

    === "Example"
        ```shell
        >>> CRV.start_epoch_time()
        1691965048                              # 'Sun Aug 13 2023 22:17:28 GMT+0000'
        ```


### `rate`
!!! description "`CRV.rate() -> uint256: view`"

    Getter for the current inflation rate of the CRV token emission. The rate is denominated in emissions per second and has a base of 1e18.
    
    To calculate the CRV emission per day:

    $$\text{daily_emission} = \text{rate} * 86400$$

    $$\text{weekly_emission} = \text{rate} * 86400 * 7$$
    
    $$\text{yearly_emission} = \text{rate} * 86400 * 365$$

    Returns: current inflation rate (`uint256`).

    ??? quote "Source code"

        ```vyper
        rate: public(uint256)
        ```

    === "Example"
        ```shell
        >>> CRV.rate()
        5181574864521283150     
        ```

    !!!note "Calculating Daily Emissions"
        $\text{daily_emission} = \frac{5181574864521283150}{10^{18}} * 86400 = 447688.07$


### `update_mining_parameters` 
!!! description "`update_mining_parameters()`"

    Function to update the mining parameters for the token. By updating, the newly decreased inflation rate is applied. This function is callable by anyone. However, the call will revert if `block.timestamp` is less than or equal to `start_epoch_time` + `RATE_REDUCTION_TIME`, indicating that one year has not yet passed and therefore the rate cannot be updated yet.

    Emits: `UpdateMiningParameters`

    ??? quote "Source code"

        ```vyper
        event UpdateMiningParameters:
            time: uint256
            rate: uint256
            supply: uint256

        YEAR: constant(uint256) = 86400 * 365

        # Supply parameters
        INITIAL_SUPPLY: constant(uint256) = 1_303_030_303
        INITIAL_RATE: constant(uint256) = 274_815_283 * 10 ** 18 / YEAR  # leading to 43% premine
        RATE_REDUCTION_TIME: constant(uint256) = YEAR
        RATE_REDUCTION_COEFFICIENT: constant(uint256) = 1189207115002721024  # 2 ** (1/4) * 1e18
        RATE_DENOMINATOR: constant(uint256) = 10 ** 18
        INFLATION_DELAY: constant(uint256) = 86400

        # Supply variables
        mining_epoch: public(int128)
        start_epoch_time: public(uint256)
        rate: public(uint256)

        start_epoch_supply: uint256

        @external
        def update_mining_parameters():
            """
            @notice Update mining rate and supply at the start of the epoch
            @dev Callable by any address, but only once per epoch
                Total supply becomes slightly larger if this function is called late
            """
            assert block.timestamp >= self.start_epoch_time + RATE_REDUCTION_TIME  # dev: too soon!
            self._update_mining_parameters()

        @internal
        def _update_mining_parameters():
            """
            @dev Update mining rate and supply at the start of the epoch
                Any modifying mining call must also call this
            """
            _rate: uint256 = self.rate
            _start_epoch_supply: uint256 = self.start_epoch_supply

            self.start_epoch_time += RATE_REDUCTION_TIME
            self.mining_epoch += 1

            if _rate == 0:
                _rate = INITIAL_RATE
            else:
                _start_epoch_supply += _rate * RATE_REDUCTION_TIME
                self.start_epoch_supply = _start_epoch_supply
                _rate = _rate * RATE_DENOMINATOR / RATE_REDUCTION_COEFFICIENT

            self.rate = _rate

            log UpdateMiningParameters(block.timestamp, _rate, _start_epoch_supply)
        ```

    === "Example"
        ```shell
        >>> CRV.update_mining_parameters()
        ```


### `start_epoch_time_write`
!!! description "`CRV.start_epoch_time_write() -> uint256`"

    Function to get the current mining epoch start while simultaneously updating mining parameters if possible. If updating is not possible, the function will only return the start timestamp of the current epoch.

    Returns: start timestamp of the epoch (`uint256`).

    ??? quote "Source code"

        ```vyper
        start_epoch_time: public(uint256)

        @external
        def start_epoch_time_write() -> uint256:
            """
            @notice Get timestamp of the current mining epoch start
                    while simultaneously updating mining parameters
            @return Timestamp of the epoch
            """
            _start_epoch_time: uint256 = self.start_epoch_time
            if block.timestamp >= _start_epoch_time + RATE_REDUCTION_TIME:
                self._update_mining_parameters()
                return self.start_epoch_time
            else:
                return _start_epoch_time
        ```

    === "Example"
        ```shell
        >>> CRV.start_epoch_time_write()
        ```


### `future_epoch_time_write`
!!! description "`CRV.future_epoch_time_write() -> uint256`"

    Function to get the next mining epoch start timestamp while simultaneously updating mining parameters if possible. If updating is not possible, the function will only return the start timestamp of the future epoch.

    Returns: start timestamp of the future epoch (`uint256`).

    ??? quote "Source code"

        ```vyper
        @external
        def future_epoch_time_write() -> uint256:
            """
            @notice Get timestamp of the next mining epoch start
                    while simultaneously updating mining parameters
            @return Timestamp of the next epoch
            """
            _start_epoch_time: uint256 = self.start_epoch_time
            if block.timestamp >= _start_epoch_time + RATE_REDUCTION_TIME:
                self._update_mining_parameters()
                return self.start_epoch_time + RATE_REDUCTION_TIME
            else:
                return _start_epoch_time + RATE_REDUCTION_TIME
        ```

    === "Example"
        ```shell
        >>> CRV.future_epoch_time_write()
        ```


---


## **Admin Controls**

The controls over the Curve DAO Token are strictly limited. The `admin` of the contract can only modify the `name`, `admin`, or `minter`[^1]. 

Since the [`CurveOwnershipAgent`](https://etherscan.io/address/0x40907540d8a6C65c637785e8f8B742ae6b0b9968) is the current admin of the contract, any changes to these parameters would require a successfully passed DAO vote.

[^1]: Although `set_minter` is technically an admin-guarded function, there is **no actual way to change the minter address** because the code checks if the current minter is set to `ZERO_ADDRESS`, which was only true when the contract was initially deployed.



### `admin`
!!! description "`CRV.admin() -> address: view`"

    Getter for the current admin of the contract.

    Returns: admin (`address`).

    ??? quote "Source code"

        ```vyper
        admin: public(address)

        @external
        def __init__(_name: String[64], _symbol: String[32], _decimals: uint256):
            """
            @notice Contract constructor
            @param _name Token full name
            @param _symbol Token symbol
            @param _decimals Number of decimals for token
            """
            ...
            self.admin = msg.sender
            ... 
        ```

    === "Example" 
        ```shell
        >>> CRV.admin()
        '0x40907540d8a6C65c637785e8f8B742ae6b0b9968'
        ```


### `set_admin`
!!! description "`CRV.set_admin(_admin: address)`"

    !!!guard "Guarded Method"
        This function is only callable by the `admin` of the contract.

    Function to change the admin of the contract.

    Emits: `SetAdmin`

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `_admin` |  `address` | New Admin Address |

    ??? quote "Source code"

        ```vyper
        event SetAdmin:
            admin: address
        
        admin: public(address)

        @external
        def set_admin(_admin: address):
            """
            @notice Set the new admin.
            @dev After all is set up, admin only can change the token name
            @param _admin New admin address
            """
            assert msg.sender == self.admin  # dev: admin only
            self.admin = _admin
            log SetAdmin(_admin)
        ```

    === "Example"
        ```shell
        >>> CRV.set_admin("0x0000000000000000000000000000000000000000")
        ```


### `name`
!!! description "`CRV.name() -> String[64]`"

    Getter for the name of the token. Name of the token can be changed by calling the **`set_name`** function.

    Returns: token name (`String[64]`).

    ??? quote "Source code"

        ```vyper
        name: public(String[64])

        @external
        def __init__(_name: String[64], _symbol: String[32], _decimals: uint256):
            """
            @notice Contract constructor
            @param _name Token full name
            @param _symbol Token symbol
            @param _decimals Number of decimals for token
            """
            init_supply: uint256 = INITIAL_SUPPLY * 10 ** _decimals
            self.name = _name
            
            ...
        ```

    === "Example"
        ```shell
        >>> CRV.name()
        'Curve DAO Token'
        ```


### `symbol`
!!! description "`CRV.symbol() -> String[32]`"

    Getter of the token symbol. Symbol of the token can be changed by calling the **`set_name`** function.

    Returns: token symbol (`String[32]`).
    
    ??? quote "Source code"

        ```vyper
        symbol: public(String[32])

        @external
        def __init__(_name: String[64], _symbol: String[32], _decimals: uint256):
            """
            @notice Contract constructor
            @param _name Token full name
            @param _symbol Token symbol
            @param _decimals Number of decimals for token
            """
            ... 

            self.symbol = _symbol
            
            ...
        ```

    === "Example"
        ```shell
        >>> CRV.symbol()
        'CRV'
        ```



### `set_name`
!!! description "`CRV.set_name(_name: String[64], _symbol: String[32])`"

    !!!guard "Guarded Method"
        This function is only callable by the `admin` of the contract.

    Function to change the token name and symbol.

    | Input     | Type         | Description       |
    | --------- | ------------ | ----------------- |
    | `_name`   | `String[64]` | New token name.   |
    | `_symbol` | `String[32]` | New token symbol. |

    ??? quote "Source code"

        ```vyper
        name: public(String[64])
        symbol: public(String[32])

        @external
        def set_name(_name: String[64], _symbol: String[32]):
            """
            @notice Change the token name and symbol to `_name` and `_symbol`
            @dev Only callable by the admin account
            @param _name New token name
            @param _symbol New token symbol
            """
            assert msg.sender == self.admin, "Only admin is allowed to change name"
            self.name = _name
            self.symbol = _symbol
        ```


### `set_minter`
!!! description "`CRV.set_minter(_minter: address):`"


    !!!warning "Changing the `minter` contract is not possible anymore!"
        This function was only utilized during the initial deployment of the Curve DAO Token. The code permits setting the `minter` exclusively when the current minter is `ZERO_ADDRESS`, a condition met solely at the time of deployment. Consequently, the `minter` variable could only be set once and cannot be changed thereafter.

    !!!guard "Guarded Method"
        This function is only callable by the `admin` of the contract.

    Function to set the minter contract for the token.

    Emits: `SetMinter`

    | Input     | Type      | Description             |
    | --------- | --------- | ----------------------- |
    | `_minter` | `address` | Minter contract address |

    ??? quote "Source code"

        ```vyper
        event SetMinter:
            minter: address
        
        minter: public(address)

        @external
        def set_minter(_minter: address):
            """
            @notice Set the minter address
            @dev Only callable once, when minter has not yet been set
            @param _minter Address of the minter
            """
            assert msg.sender == self.admin  # dev: admin only
            assert self.minter == ZERO_ADDRESS  # dev: can set the minter only once, at creation
            self.minter = _minter
            log SetMinter(_minter)
        ```


---


## **Contract Info Methods** 


### `avaliable_supply`
!!! description "`CRV.avaliably_supply() -> uint256`"

    Getter for the current number of CRV tokens - claimed of unclaimed - in existence.

    Returns: currently existing tokens (`uint256`).

    ??? quote "Source code"

        ```vyper
        @internal
        @view
        def _available_supply() -> uint256:
            return self.start_epoch_supply + (block.timestamp - self.start_epoch_time) * self.rate

        @external
        @view
        def available_supply() -> uint256:
            """
            @notice Current number of tokens in existence (claimed or unclaimed)
            """
            return self._available_supply()
        ```
    === "Example"
        ```shell
        >>> CRV.avaliable_supply()
        1953676805157446496269106603
        ```


### `totalSupply`
!!! description "`CRV.totalSupply() -> uint256`"

    Getter for the total number of tokens in existence.

    Returns: total supply (`uint256`).

    ??? quote "Source code"

        ```vyper
        @external
        @view
        def totalSupply() -> uint256:
            """
            @notice Total number of tokens in existence.
            """
            return self.total_supply
        ```

    === "Example"
        ```shell
        >>> CRV.totalSupply()
        1950555367872773429287303134
        ```


### `decimals`
!!! description "`CRV.decimals() -> uint256: view`"

    Getter of the decimals of the token.

    Returns: decimals (`uint256`).    

    ??? quote "Source code"

        ```vyper
        decimals: public(uint256)

        @external
        def __init__(_name: String[64], _symbol: String[32], _decimals: uint256):
            """
            @notice Contract constructor
            @param _name Token full name
            @param _symbol Token symbol
            @param _decimals Number of decimals for token
            """
            ...

            self.decimals = _decimals

            ...
        ```

    === "Example"  
        ```shell
        >>> CRV.decimals()
        18
        ```


### `balanceOf`
!!! description "`CRV.balanceOf(arg0: address) -> address: view`"

    Getter for the crv token balance of a specific address.

    Returns: balance (`uint256`).

    | Input      | Type   | Description |
    | ----------- | -------| ----|
    | `arg0` |  `address` | wallet to check CRV balance for |


    ??? quote "Source code"

        ```vyper
        balanceOf: public(HashMap[address, uint256])
        ```

    === "Example"
        ```shell
        >>> CRV.balanceOf('0xd061D61a4d941c39E5453435B6345Dc261C2fcE0')
        2187980063734121847368
        ```