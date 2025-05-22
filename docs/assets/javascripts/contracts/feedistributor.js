// logic for fetching data from the fee distributor contract

document.addEventListener('DOMContentLoaded', async function() {
    const web3 = new Web3('https://eth.llamarpc.com');
    const FeeDistributorAddress = '0xD16d5eC345Dd86Fb63C6a9C43c517210F1027914';
    const Multicall3Address = '0xca11bde05977b3631167028862be2a173976ca11';

    const FeeDistributorABI = [
        {"name":"CommitAdmin","inputs":[{"name":"admin","type":"address","indexed":false}],"anonymous":false,"type":"event"},{"name":"ApplyAdmin","inputs":[{"name":"admin","type":"address","indexed":false}],"anonymous":false,"type":"event"},{"name":"ToggleAllowCheckpointToken","inputs":[{"name":"toggle_flag","type":"bool","indexed":false}],"anonymous":false,"type":"event"},{"name":"CheckpointToken","inputs":[{"name":"time","type":"uint256","indexed":false},{"name":"tokens","type":"uint256","indexed":false}],"anonymous":false,"type":"event"},{"name":"Claimed","inputs":[{"name":"recipient","type":"address","indexed":true},{"name":"amount","type":"uint256","indexed":false},{"name":"claim_epoch","type":"uint256","indexed":false},{"name":"max_epoch","type":"uint256","indexed":false}],"anonymous":false,"type":"event"},{"stateMutability":"nonpayable","type":"constructor","inputs":[{"name":"_voting_escrow","type":"address"},{"name":"_start_time","type":"uint256"},{"name":"_token","type":"address"},{"name":"_admin","type":"address"},{"name":"_emergency_return","type":"address"}],"outputs":[]},{"stateMutability":"nonpayable","type":"function","name":"checkpoint_token","inputs":[],"outputs":[]},{"stateMutability":"nonpayable","type":"function","name":"checkpoint_total_supply","inputs":[],"outputs":[]},{"stateMutability":"view","type":"function","name":"ve_for_at","inputs":[{"name":"_user","type":"address"},{"name":"_timestamp","type":"uint256"}],"outputs":[{"name":"","type":"uint256"}]},{"stateMutability":"nonpayable","type":"function","name":"claim","inputs":[{"name":"_addr","type":"address"}],"outputs":[{"name":"","type":"uint256"}]},{"stateMutability":"nonpayable","type":"function","name":"claim_many","inputs":[{"name":"_receivers","type":"address[20]"}],"outputs":[{"name":"","type":"bool"}]},{"stateMutability":"nonpayable","type":"function","name":"burn","inputs":[{"name":"_coin","type":"address"}],"outputs":[{"name":"","type":"bool"}]},{"stateMutability":"nonpayable","type":"function","name":"commit_admin","inputs":[{"name":"_addr","type":"address"}],"outputs":[]},{"stateMutability":"nonpayable","type":"function","name":"apply_admin","inputs":[],"outputs":[]},{"stateMutability":"nonpayable","type":"function","name":"toggle_allow_checkpoint_token","inputs":[],"outputs":[]},{"stateMutability":"nonpayable","type":"function","name":"kill_me","inputs":[],"outputs":[]},{"stateMutability":"nonpayable","type":"function","name":"recover_balance","inputs":[{"name":"_coin","type":"address"}],"outputs":[{"name":"","type":"bool"}]},{"stateMutability":"view","type":"function","name":"start_time","inputs":[],"outputs":[{"name":"","type":"uint256"}]},{"stateMutability":"view","type":"function","name":"time_cursor","inputs":[],"outputs":[{"name":"","type":"uint256"}]},{"stateMutability":"view","type":"function","name":"time_cursor_of","inputs":[{"name":"arg0","type":"address"}],"outputs":[{"name":"","type":"uint256"}]},{"stateMutability":"view","type":"function","name":"user_epoch_of","inputs":[{"name":"arg0","type":"address"}],"outputs":[{"name":"","type":"uint256"}]},{"stateMutability":"view","type":"function","name":"last_token_time","inputs":[],"outputs":[{"name":"","type":"uint256"}]},{"stateMutability":"view","type":"function","name":"tokens_per_week","inputs":[{"name":"arg0","type":"uint256"}],"outputs":[{"name":"","type":"uint256"}]},{"stateMutability":"view","type":"function","name":"voting_escrow","inputs":[],"outputs":[{"name":"","type":"address"}]},{"stateMutability":"view","type":"function","name":"token","inputs":[],"outputs":[{"name":"","type":"address"}]},{"stateMutability":"view","type":"function","name":"total_received","inputs":[],"outputs":[{"name":"","type":"uint256"}]},{"stateMutability":"view","type":"function","name":"token_last_balance","inputs":[],"outputs":[{"name":"","type":"uint256"}]},{"stateMutability":"view","type":"function","name":"ve_supply","inputs":[{"name":"arg0","type":"uint256"}],"outputs":[{"name":"","type":"uint256"}]},{"stateMutability":"view","type":"function","name":"admin","inputs":[],"outputs":[{"name":"","type":"address"}]},{"stateMutability":"view","type":"function","name":"future_admin","inputs":[],"outputs":[{"name":"","type":"address"}]},{"stateMutability":"view","type":"function","name":"can_checkpoint_token","inputs":[],"outputs":[{"name":"","type":"bool"}]},{"stateMutability":"view","type":"function","name":"emergency_return","inputs":[],"outputs":[{"name":"","type":"address"}]},{"stateMutability":"view","type":"function","name":"is_killed","inputs":[],"outputs":[{"name":"","type":"bool"}]}
    ];

    const Multicall3ABI = [{"inputs":[{"components":[{"internalType":"address","name":"target","type":"address"},{"internalType":"bytes","name":"callData","type":"bytes"}],"internalType":"struct Multicall3.Call[]","name":"calls","type":"tuple[]"}],"name":"aggregate","outputs":[{"internalType":"uint256","name":"blockNumber","type":"uint256"},{"internalType":"bytes[]","name":"returnData","type":"bytes[]"}],"stateMutability":"payable","type":"function"},{"inputs":[{"components":[{"internalType":"address","name":"target","type":"address"},{"internalType":"bool","name":"allowFailure","type":"bool"},{"internalType":"bytes","name":"callData","type":"bytes"}],"internalType":"struct Multicall3.Call3[]","name":"calls","type":"tuple[]"}],"name":"aggregate3","outputs":[{"components":[{"internalType":"bool","name":"success","type":"bool"},{"internalType":"bytes","name":"returnData","type":"bytes"}],"internalType":"struct Multicall3.Result[]","name":"returnData","type":"tuple[]"}],"stateMutability":"payable","type":"function"}];

    const FeeDistributorContract = new web3.eth.Contract(FeeDistributorABI, FeeDistributorAddress);
    const Multicall3Contract = new web3.eth.Contract(Multicall3ABI, Multicall3Address);

    async function updateValues() {
        const calls = [
            { target: FeeDistributorAddress, allowFailure: false, callData: web3.eth.abi.encodeFunctionSignature('token_last_balance()') },
            { target: FeeDistributorAddress, allowFailure: false, callData: web3.eth.abi.encodeFunctionSignature('last_token_time()') },
            { target: FeeDistributorAddress, allowFailure: false, callData: web3.eth.abi.encodeFunctionSignature('time_cursor()') },
            { target: FeeDistributorAddress, allowFailure: false, callData: web3.eth.abi.encodeFunctionSignature('admin()') },
            { target: FeeDistributorAddress, allowFailure: false, callData: web3.eth.abi.encodeFunctionSignature('future_admin()') },
            { target: FeeDistributorAddress, allowFailure: false, callData: web3.eth.abi.encodeFunctionSignature('can_checkpoint_token()') },
            { target: FeeDistributorAddress, allowFailure: false, callData: web3.eth.abi.encodeFunctionSignature('voting_escrow()') },
            { target: FeeDistributorAddress, allowFailure: false, callData: web3.eth.abi.encodeFunctionSignature('token()') },
            { target: FeeDistributorAddress, allowFailure: false, callData: web3.eth.abi.encodeFunctionSignature('emergency_return()') },
            { target: FeeDistributorAddress, allowFailure: false, callData: web3.eth.abi.encodeFunctionSignature('is_killed()') },
            { target: FeeDistributorAddress, allowFailure: false, callData: web3.eth.abi.encodeFunctionSignature('start_time()') }
        ];

        try {
            const results = await Multicall3Contract.methods.aggregate3(calls).call();
            console.log('Multicall results:', results);

            const elementIds = [
                'tokenLastBalanceOutput', 'lastTokenTimeOutput', 'timeCursorOutput',
                'adminOutput', 'futureAdminOutput', 'canCheckpointTokenOutput',
                'votingEscrowOutput', 'tokenOutput', 'emergencyReturnOutput',
                'isKilledOutput', 'startTimeOutput'
            ];

            results.forEach((result, index) => {
                const element = document.getElementById(elementIds[index]);
                if (element) {
                    if (result.success) {
                        let decodedResult;
                        switch (elementIds[index]) {
                            case 'tokenLastBalanceOutput':
                            case 'lastTokenTimeOutput':
                            case 'timeCursorOutput':
                            case 'startTimeOutput':
                                decodedResult = web3.eth.abi.decodeParameter('uint256', result.returnData);
                                element.textContent = decodedResult;
                                break;
                            case 'canCheckpointTokenOutput':
                            case 'isKilledOutput':
                                decodedResult = web3.eth.abi.decodeParameter('bool', result.returnData);
                                element.textContent = decodedResult;
                                break;
                            case 'adminOutput':
                            case 'futureAdminOutput':
                            case 'votingEscrowOutput':
                            case 'tokenOutput':
                            case 'emergencyReturnOutput':
                                decodedResult = web3.eth.abi.decodeParameter('address', result.returnData);
                                element.textContent = decodedResult;
                                break;
                        }
                        console.log(`${elementIds[index]}:`, decodedResult);
                        element.style.color = 'green';
                    } else {
                        element.textContent = `Error fetching data`;
                        element.style.color = 'red';
                    }
                } else {
                    console.log(`Element with id '${elementIds[index]}' not found. This is expected if the element is not present in the current page.`);
                }
            });
        } catch (error) {
            console.error('Error fetching data:', error);
            elementIds.forEach(id => {
                const element = document.getElementById(id);
                if (element) {
                    element.textContent = `Error fetching data`;
                    element.style.color = 'red';
                }
            });
        }
    }

    // Call updateValues to fetch and display data
    updateValues();

    // Function to handle input-based queries
    async function handleQuery(inputId, outputId, method) {
        const inputElement = document.getElementById(inputId);
        const outputElement = document.getElementById(outputId);

        async function fetchData() {
            const input = inputElement.value.trim();
            if (input === '') {
                outputElement.textContent = 'Please enter a valid input';
                outputElement.style.color = 'red';
                return;
            }

            try {
                let result;
                if (method === 've_for_at') {
                    const [user, timestamp] = input.split(',').map(s => s.trim());
                    result = await FeeDistributorContract.methods[method](user, timestamp).call();
                } else if (method === 'tokens_per_week' || method === 've_supply') {
                    result = await FeeDistributorContract.methods[method](input).call();
                } else {
                    result = await FeeDistributorContract.methods[method](input).call();
                }
                outputElement.textContent = result.toString();
                outputElement.style.color = 'green';
            } catch (error) {
                console.error(`Error fetching ${method}:`, error);
                outputElement.textContent = `Error: ${error.message}`;
                outputElement.style.color = 'red';
            }
        }

        // Initial fetch
        await fetchData();

        // Add event listener for input changes
        inputElement.addEventListener('input', fetchData);
    }

    // Set up queries for all methods
    handleQuery('veForAtInput', 'veForAtOutput', 've_for_at');
    handleQuery('tokensPerWeekInput', 'tokensPerWeekOutput', 'tokens_per_week');
    handleQuery('veSupplyInput', 'veSupplyOutput', 've_supply');
    handleQuery('timeCursorOfInput', 'timeCursorOfOutput', 'time_cursor_of');
    handleQuery('userEpochOfInput', 'userEpochOfOutput', 'user_epoch_of');

    // Add more method queries as needed
});
