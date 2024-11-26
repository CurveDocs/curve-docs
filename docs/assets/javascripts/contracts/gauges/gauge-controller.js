document.addEventListener('DOMContentLoaded', async function() {
    window.getCurrentUnixTimestamp = () => Math.floor(Date.now() / 1000);

    document.querySelectorAll('.timestamp-input').forEach(input => {
        input.value = window.getCurrentUnixTimestamp();
    });

    const web3 = new Web3('https://eth.llamarpc.com');
    const GaugeControllerAddress = '0x2F50D538606Fa9EDD2B11E2446BEb18C9D5846bB';
    const Multicall3Address = '0xcA11bde05977b3631167028862bE2a173976CA11';

    const GaugeControllerABI = [{"name":"CommitOwnership","inputs":[{"type":"address","name":"admin","indexed":false}],"anonymous":false,"type":"event"},{"name":"ApplyOwnership","inputs":[{"type":"address","name":"admin","indexed":false}],"anonymous":false,"type":"event"},{"name":"AddType","inputs":[{"type":"string","name":"name","indexed":false},{"type":"int128","name":"type_id","indexed":false}],"anonymous":false,"type":"event"},{"name":"NewTypeWeight","inputs":[{"type":"int128","name":"type_id","indexed":false},{"type":"uint256","name":"time","indexed":false},{"type":"uint256","name":"weight","indexed":false},{"type":"uint256","name":"total_weight","indexed":false}],"anonymous":false,"type":"event"},{"name":"NewGaugeWeight","inputs":[{"type":"address","name":"gauge_address","indexed":false},{"type":"uint256","name":"time","indexed":false},{"type":"uint256","name":"weight","indexed":false},{"type":"uint256","name":"total_weight","indexed":false}],"anonymous":false,"type":"event"},{"name":"VoteForGauge","inputs":[{"type":"uint256","name":"time","indexed":false},{"type":"address","name":"user","indexed":false},{"type":"address","name":"gauge_addr","indexed":false},{"type":"uint256","name":"weight","indexed":false}],"anonymous":false,"type":"event"},{"name":"NewGauge","inputs":[{"type":"address","name":"addr","indexed":false},{"type":"int128","name":"gauge_type","indexed":false},{"type":"uint256","name":"weight","indexed":false}],"anonymous":false,"type":"event"},{"outputs":[],"inputs":[{"type":"address","name":"_token"},{"type":"address","name":"_voting_escrow"}],"stateMutability":"nonpayable","type":"constructor"},{"name":"commit_transfer_ownership","outputs":[],"inputs":[{"type":"address","name":"addr"}],"stateMutability":"nonpayable","type":"function","gas":37597},{"name":"apply_transfer_ownership","outputs":[],"inputs":[],"stateMutability":"nonpayable","type":"function","gas":38497},{"name":"gauge_types","outputs":[{"type":"int128","name":""}],"inputs":[{"type":"address","name":"_addr"}],"stateMutability":"view","type":"function","gas":1625},{"name":"add_gauge","outputs":[],"inputs":[{"type":"address","name":"addr"},{"type":"int128","name":"gauge_type"}],"stateMutability":"nonpayable","type":"function"},{"name":"add_gauge","outputs":[],"inputs":[{"type":"address","name":"addr"},{"type":"int128","name":"gauge_type"},{"type":"uint256","name":"weight"}],"stateMutability":"nonpayable","type":"function"},{"name":"checkpoint","outputs":[],"inputs":[],"stateMutability":"nonpayable","type":"function","gas":18033784416},{"name":"checkpoint_gauge","outputs":[],"inputs":[{"type":"address","name":"addr"}],"stateMutability":"nonpayable","type":"function","gas":18087678795},{"name":"gauge_relative_weight","outputs":[{"type":"uint256","name":""}],"inputs":[{"type":"address","name":"addr"}],"stateMutability":"view","type":"function"},{"name":"gauge_relative_weight","outputs":[{"type":"uint256","name":""}],"inputs":[{"type":"address","name":"addr"},{"type":"uint256","name":"time"}],"stateMutability":"view","type":"function"},{"name":"gauge_relative_weight_write","outputs":[{"type":"uint256","name":""}],"inputs":[{"type":"address","name":"addr"}],"stateMutability":"nonpayable","type":"function"},{"name":"gauge_relative_weight_write","outputs":[{"type":"uint256","name":""}],"inputs":[{"type":"address","name":"addr"},{"type":"uint256","name":"time"}],"stateMutability":"nonpayable","type":"function"},{"name":"add_type","outputs":[],"inputs":[{"type":"string","name":"_name"}],"stateMutability":"nonpayable","type":"function"},{"name":"add_type","outputs":[],"inputs":[{"type":"string","name":"_name"},{"type":"uint256","name":"weight"}],"stateMutability":"nonpayable","type":"function"},{"name":"change_type_weight","outputs":[],"inputs":[{"type":"int128","name":"type_id"},{"type":"uint256","name":"weight"}],"stateMutability":"nonpayable","type":"function","gas":36246310050},{"name":"change_gauge_weight","outputs":[],"inputs":[{"type":"address","name":"addr"},{"type":"uint256","name":"weight"}],"stateMutability":"nonpayable","type":"function","gas":36354170809},{"name":"vote_for_gauge_weights","outputs":[],"inputs":[{"type":"address","name":"_gauge_addr"},{"type":"uint256","name":"_user_weight"}],"stateMutability":"nonpayable","type":"function","gas":18142052127},{"name":"get_gauge_weight","outputs":[{"type":"uint256","name":""}],"inputs":[{"type":"address","name":"addr"}],"stateMutability":"view","type":"function","gas":2974},{"name":"get_type_weight","outputs":[{"type":"uint256","name":""}],"inputs":[{"type":"int128","name":"type_id"}],"stateMutability":"view","type":"function","gas":2977},{"name":"get_total_weight","outputs":[{"type":"uint256","name":""}],"inputs":[],"stateMutability":"view","type":"function","gas":2693},{"name":"get_weights_sum_per_type","outputs":[{"type":"uint256","name":""}],"inputs":[{"type":"int128","name":"type_id"}],"stateMutability":"view","type":"function","gas":3109},{"name":"admin","outputs":[{"type":"address","name":""}],"inputs":[],"stateMutability":"view","type":"function","gas":1841},{"name":"future_admin","outputs":[{"type":"address","name":""}],"inputs":[],"stateMutability":"view","type":"function","gas":1871},{"name":"token","outputs":[{"type":"address","name":""}],"inputs":[],"stateMutability":"view","type":"function","gas":1901},{"name":"voting_escrow","outputs":[{"type":"address","name":""}],"inputs":[],"stateMutability":"view","type":"function","gas":1931},{"name":"n_gauge_types","outputs":[{"type":"int128","name":""}],"inputs":[],"stateMutability":"view","type":"function","gas":1961},{"name":"n_gauges","outputs":[{"type":"int128","name":""}],"inputs":[],"stateMutability":"view","type":"function","gas":1991},{"name":"gauge_type_names","outputs":[{"type":"string","name":""}],"inputs":[{"type":"int128","name":"arg0"}],"stateMutability":"view","type":"function","gas":8628},{"name":"gauges","outputs":[{"type":"address","name":""}],"inputs":[{"type":"uint256","name":"arg0"}],"stateMutability":"view","type":"function","gas":2160},{"name":"vote_user_slopes","outputs":[{"type":"uint256","name":"slope"},{"type":"uint256","name":"power"},{"type":"uint256","name":"end"}],"inputs":[{"type":"address","name":"arg0"},{"type":"address","name":"arg1"}],"stateMutability":"view","type":"function","gas":5020},{"name":"vote_user_power","outputs":[{"type":"uint256","name":""}],"inputs":[{"type":"address","name":"arg0"}],"stateMutability":"view","type":"function","gas":2265},{"name":"last_user_vote","outputs":[{"type":"uint256","name":""}],"inputs":[{"type":"address","name":"arg0"},{"type":"address","name":"arg1"}],"stateMutability":"view","type":"function","gas":2449},{"name":"points_weight","outputs":[{"type":"uint256","name":"bias"},{"type":"uint256","name":"slope"}],"inputs":[{"type":"address","name":"arg0"},{"type":"uint256","name":"arg1"}],"stateMutability":"view","type":"function","gas":3859},{"name":"time_weight","outputs":[{"type":"uint256","name":""}],"inputs":[{"type":"address","name":"arg0"}],"stateMutability":"view","type":"function","gas":2355},{"name":"points_sum","outputs":[{"type":"uint256","name":"bias"},{"type":"uint256","name":"slope"}],"inputs":[{"type":"int128","name":"arg0"},{"type":"uint256","name":"arg1"}],"stateMutability":"view","type":"function","gas":3970},{"name":"time_sum","outputs":[{"type":"uint256","name":""}],"inputs":[{"type":"uint256","name":"arg0"}],"stateMutability":"view","type":"function","gas":2370},{"name":"points_total","outputs":[{"type":"uint256","name":""}],"inputs":[{"type":"uint256","name":"arg0"}],"stateMutability":"view","type":"function","gas":2406},{"name":"time_total","outputs":[{"type":"uint256","name":""}],"inputs":[],"stateMutability":"view","type":"function","gas":2321},{"name":"points_type_weight","outputs":[{"type":"uint256","name":""}],"inputs":[{"type":"int128","name":"arg0"},{"type":"uint256","name":"arg1"}],"stateMutability":"view","type":"function","gas":2671},{"name":"time_type_weight","outputs":[{"type":"uint256","name":""}],"inputs":[{"type":"uint256","name":"arg0"}],"stateMutability":"view","type":"function","gas":2490}];

    const Multicall3ABI = [{"inputs":[{"components":[{"internalType":"address","name":"target","type":"address"},{"internalType":"bytes","name":"callData","type":"bytes"}],"internalType":"struct Multicall3.Call[]","name":"calls","type":"tuple[]"}],"name":"aggregate","outputs":[{"internalType":"uint256","name":"blockNumber","type":"uint256"},{"internalType":"bytes[]","name":"returnData","type":"bytes[]"}],"stateMutability":"payable","type":"function"},{"inputs":[{"components":[{"internalType":"address","name":"target","type":"address"},{"internalType":"bool","name":"allowFailure","type":"bool"},{"internalType":"bytes","name":"callData","type":"bytes"}],"internalType":"struct Multicall3.Call3[]","name":"calls","type":"tuple[]"}],"name":"aggregate3","outputs":[{"components":[{"internalType":"bool","name":"success","type":"bool"},{"internalType":"bytes","name":"returnData","type":"bytes"}],"internalType":"struct Multicall3.Result[]","name":"returnData","type":"tuple[]"}],"stateMutability":"payable","type":"function"}];
    
    const GaugeControllerContract = new web3.eth.Contract(GaugeControllerABI, GaugeControllerAddress);
    const Multicall3Contract = new web3.eth.Contract(Multicall3ABI, Multicall3Address);
    
    async function updateValues() {
        const calls = [
            { target: GaugeControllerAddress, allowFailure: false, callData: web3.eth.abi.encodeFunctionSignature('get_total_weight()') },
            { target: GaugeControllerAddress, allowFailure: false, callData: web3.eth.abi.encodeFunctionSignature('admin()') },
            { target: GaugeControllerAddress, allowFailure: false, callData: web3.eth.abi.encodeFunctionSignature('future_admin()') },
            { target: GaugeControllerAddress, allowFailure: false, callData: web3.eth.abi.encodeFunctionSignature('token()') },
            { target: GaugeControllerAddress, allowFailure: false, callData: web3.eth.abi.encodeFunctionSignature('voting_escrow()') },
            { target: GaugeControllerAddress, allowFailure: false, callData: web3.eth.abi.encodeFunctionSignature('n_gauge_types()') },
            { target: GaugeControllerAddress, allowFailure: false, callData: web3.eth.abi.encodeFunctionSignature('n_gauges()') },
            { target: GaugeControllerAddress, allowFailure: false, callData: web3.eth.abi.encodeFunctionSignature('time_total()') }
        ];

        const elementIds = ['getTotalWeightOutput', 'adminOutput', 'futureAdminOutput', 'tokenOutput', 
                           'votingEscrowOutput', 'nGaugeTypesOutput', 'nGaugesOutput', 'timeTotalOutput'];

        try {
            const results = await Multicall3Contract.methods.aggregate3(calls).call();

            results.forEach((result, index) => {
                const element = document.getElementById(elementIds[index]);
                if (element) {
                    if (result.success) {
                        let decodedResult;
                        try {
                            // Handle different types of results
                            if (index === 1 || index === 2 || index === 3 || index === 4) { // addresses
                                decodedResult = web3.eth.abi.decodeParameter('address', result.returnData);
                                element.textContent = decodedResult;
                            } else { // numbers - keep as string to avoid overflow
                                decodedResult = web3.eth.abi.decodeParameter('uint256', result.returnData);
                                element.textContent = decodedResult.toString();
                            }
                            element.style.color = 'green';
                        } catch (decodeError) {
                            console.error('Error decoding result:', decodeError);
                            element.textContent = '>>> Error decoding data';
                            element.style.color = 'red';
                        }
                    } else {
                        element.textContent = '>>> Error fetching data';
                        element.style.color = 'red';
                    }
                }
            });
        } catch (error) {
            console.error('Error fetching data:', error);
            elementIds.forEach(id => {
                const element = document.getElementById(id);
                if (element) {
                    element.textContent = '>>> Error fetching data';
                    element.style.color = 'red';
                }
            });
        }
    }
    // Call updateValues to fetch and display data
    updateValues();

    // Function to handle input-based queries
    async function handleInputQuery(inputId, outputId, method, inputId2 = null) {
        const inputElement = document.getElementById(inputId);
        const inputElement2 = inputId2 ? document.getElementById(inputId2) : null;
        const outputElement = document.getElementById(outputId);
        
        // Skip if elements don't exist
        if (!inputElement || !outputElement || (inputId2 && !inputElement2)) {
            console.warn(`Missing elements for ${method}`);
            return;
        }
        
        async function fetchData() {
            const input = inputElement.value.trim();
            const input2 = inputElement2 ? inputElement2.value.trim() : null;
            
            if (input === '' || (inputElement2 && input2 === '')) {
                outputElement.textContent = 'Please enter valid input(s)';
                outputElement.style.color = 'red';
                return;
            }
            
            try {
                let result;
                if (inputElement2) {
                    result = await GaugeControllerContract.methods[method](input, input2).call();
                } else {
                    result = await GaugeControllerContract.methods[method](input).call();
                }

                let formattedResult;
                if (method === 'vote_user_slopes') {
                    formattedResult = `slope: ${result.slope.toString()}, power: ${result.power.toString()}, end: ${result.end.toString()}`;
                } else if (method === 'points_weight' || method === 'points_sum') {
                    formattedResult = `bias: ${result.bias.toString()}, slope: ${result.slope.toString()}`;
                } else if (typeof result === 'object') {
                    formattedResult = Object.entries(result)
                        .map(([key, value]) => `${key}: ${value.toString()}`)
                        .join(', ');
                } else if (typeof result === 'string' && result.startsWith('0x')) {
                    formattedResult = result;
                } else {
                    formattedResult = result.toString();
                }

                outputElement.textContent = formattedResult;
                outputElement.style.color = 'green';
            } catch (error) {
                console.error(`Error fetching ${method}:`, error);
                outputElement.textContent = error.message;
                outputElement.style.color = 'red';
            }
        }

        // Initial fetch
        await fetchData();

        // Add event listeners for input changes
        inputElement.addEventListener('input', fetchData);
        if (inputElement2) {
            inputElement2.addEventListener('input', fetchData);
        }
    }

    // Set up input-based queries
    // Single input queries
    handleInputQuery('gaugeIndex', 'gaugeOutput', 'gauges');
    handleInputQuery('gaugeTypesInput', 'gaugeTypesOutput', 'gauge_types');
    handleInputQuery('voteUserPowerInput', 'voteUserPowerOutput', 'vote_user_power');
    handleInputQuery('getGaugeWeightInput', 'getGaugeWeightOutput', 'get_gauge_weight');
    handleInputQuery('getTypeWeightInput', 'getTypeWeightOutput', 'get_type_weight');
    handleInputQuery('getWeightsSumPerTypeInput', 'getWeightsSumPerTypeOutput', 'get_weights_sum_per_type');
    handleInputQuery('gaugeTypeNamesInput', 'gaugeTypeNamesOutput', 'gauge_type_names');
    handleInputQuery('timeWeightInput', 'timeWeightOutput', 'time_weight');
    handleInputQuery('timeSumInput', 'timeSumOutput', 'time_sum');
    handleInputQuery('pointsTotalInput', 'pointsTotalOutput', 'points_total');
    handleInputQuery('timeTypeWeightInput', 'timeTypeWeightOutput', 'time_type_weight');

    // Dual input queries
    handleInputQuery('lastUserVoteInput1', 'lastUserVoteOutput', 'last_user_vote', 'lastUserVoteInput2');
    handleInputQuery('voteUserSlopesInput1', 'voteUserSlopesOutput', 'vote_user_slopes', 'voteUserSlopesInput2');
    handleInputQuery('gaugeRelativeWeightInput1', 'gaugeRelativeWeightOutput', 'gauge_relative_weight', 'gaugeRelativeWeightInput2');
    handleInputQuery('pointsWeightInput1', 'pointsWeightOutput', 'points_weight', 'pointsWeightInput2');
    handleInputQuery('pointsSumInput1', 'pointsSumOutput', 'points_sum', 'pointsSumInput2');
    handleInputQuery('pointsTypeWeightInput1', 'pointsTypeWeightOutput', 'points_type_weight', 'pointsTypeWeightInput2');

});