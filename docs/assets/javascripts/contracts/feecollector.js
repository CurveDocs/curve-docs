// Add this variable at the top of your script
let isInitialMaxFeeLoad = true;

document.addEventListener('DOMContentLoaded', async function() {
    const web3 = new Web3('https://eth.llamarpc.com');
    const FeeCollectorAddress = '0xa2Bcd1a4Efbd04B63cd03f5aFf2561106ebCCE00';
    const Multicall3Address = '0xcA11bde05977b3631167028862bE2a173976CA11';

    const FeeCollectorABI = [{"name":"SetMaxFee","inputs":[{"name":"epoch","type":"uint256","indexed":true},{"name":"max_fee","type":"uint256","indexed":false}],"anonymous":false,"type":"event"},{"name":"SetBurner","inputs":[{"name":"burner","type":"address","indexed":true}],"anonymous":false,"type":"event"},{"name":"SetHooker","inputs":[{"name":"hooker","type":"address","indexed":true}],"anonymous":false,"type":"event"},{"name":"SetTarget","inputs":[{"name":"target","type":"address","indexed":true}],"anonymous":false,"type":"event"},{"name":"SetKilled","inputs":[{"name":"coin","type":"address","indexed":true},{"name":"epoch_mask","type":"uint256","indexed":false}],"anonymous":false,"type":"event"},{"name":"SetOwner","inputs":[{"name":"owner","type":"address","indexed":true}],"anonymous":false,"type":"event"},{"name":"SetEmergencyOwner","inputs":[{"name":"emergency_owner","type":"address","indexed":true}],"anonymous":false,"type":"event"},{"stateMutability":"nonpayable","type":"constructor","inputs":[{"name":"_target_coin","type":"address"},{"name":"_weth","type":"address"},{"name":"_owner","type":"address"},{"name":"_emergency_owner","type":"address"}],"outputs":[]},{"stateMutability":"payable","type":"fallback"},{"stateMutability":"nonpayable","type":"function","name":"withdraw_many","inputs":[{"name":"_pools","type":"address[]"}],"outputs":[]},{"stateMutability":"payable","type":"function","name":"burn","inputs":[{"name":"_coin","type":"address"}],"outputs":[{"name":"","type":"bool"}]},{"stateMutability":"view","type":"function","name":"epoch","inputs":[],"outputs":[{"name":"","type":"uint256"}]},{"stateMutability":"view","type":"function","name":"epoch","inputs":[{"name":"ts","type":"uint256"}],"outputs":[{"name":"","type":"uint256"}]},{"stateMutability":"view","type":"function","name":"epoch_time_frame","inputs":[{"name":"_epoch","type":"uint256"}],"outputs":[{"name":"","type":"uint256"},{"name":"","type":"uint256"}]},{"stateMutability":"view","type":"function","name":"epoch_time_frame","inputs":[{"name":"_epoch","type":"uint256"},{"name":"_ts","type":"uint256"}],"outputs":[{"name":"","type":"uint256"},{"name":"","type":"uint256"}]},{"stateMutability":"view","type":"function","name":"fee","inputs":[],"outputs":[{"name":"","type":"uint256"}]},{"stateMutability":"view","type":"function","name":"fee","inputs":[{"name":"_epoch","type":"uint256"}],"outputs":[{"name":"","type":"uint256"}]},{"stateMutability":"view","type":"function","name":"fee","inputs":[{"name":"_epoch","type":"uint256"},{"name":"_ts","type":"uint256"}],"outputs":[{"name":"","type":"uint256"}]},{"stateMutability":"nonpayable","type":"function","name":"transfer","inputs":[{"name":"_transfers","type":"tuple[]","components":[{"name":"coin","type":"address"},{"name":"to","type":"address"},{"name":"amount","type":"uint256"}]}],"outputs":[]},{"stateMutability":"nonpayable","type":"function","name":"collect","inputs":[{"name":"_coins","type":"address[]"}],"outputs":[]},{"stateMutability":"nonpayable","type":"function","name":"collect","inputs":[{"name":"_coins","type":"address[]"},{"name":"_receiver","type":"address"}],"outputs":[]},{"stateMutability":"view","type":"function","name":"can_exchange","inputs":[{"name":"_coins","type":"address[]"}],"outputs":[{"name":"","type":"bool"}]},{"stateMutability":"payable","type":"function","name":"forward","inputs":[{"name":"_hook_inputs","type":"tuple[]","components":[{"name":"hook_id","type":"uint8"},{"name":"value","type":"uint256"},{"name":"data","type":"bytes"}]}],"outputs":[{"name":"","type":"uint256"}]},{"stateMutability":"payable","type":"function","name":"forward","inputs":[{"name":"_hook_inputs","type":"tuple[]","components":[{"name":"hook_id","type":"uint8"},{"name":"value","type":"uint256"},{"name":"data","type":"bytes"}]},{"name":"_receiver","type":"address"}],"outputs":[{"name":"","type":"uint256"}]},{"stateMutability":"nonpayable","type":"function","name":"recover","inputs":[{"name":"_recovers","type":"tuple[]","components":[{"name":"coin","type":"address"},{"name":"amount","type":"uint256"}]}],"outputs":[]},{"stateMutability":"nonpayable","type":"function","name":"set_max_fee","inputs":[{"name":"_epoch","type":"uint256"},{"name":"_max_fee","type":"uint256"}],"outputs":[]},{"stateMutability":"nonpayable","type":"function","name":"set_burner","inputs":[{"name":"_new_burner","type":"address"}],"outputs":[]},{"stateMutability":"nonpayable","type":"function","name":"set_hooker","inputs":[{"name":"_new_hooker","type":"address"}],"outputs":[]},{"stateMutability":"nonpayable","type":"function","name":"set_target","inputs":[{"name":"_new_target","type":"address"}],"outputs":[]},{"stateMutability":"nonpayable","type":"function","name":"set_killed","inputs":[{"name":"_input","type":"tuple[]","components":[{"name":"coin","type":"address"},{"name":"killed","type":"uint256"}]}],"outputs":[]},{"stateMutability":"nonpayable","type":"function","name":"set_owner","inputs":[{"name":"_new_owner","type":"address"}],"outputs":[]},{"stateMutability":"nonpayable","type":"function","name":"set_emergency_owner","inputs":[{"name":"_new_owner","type":"address"}],"outputs":[]},{"stateMutability":"view","type":"function","name":"target","inputs":[],"outputs":[{"name":"","type":"address"}]},{"stateMutability":"view","type":"function","name":"max_fee","inputs":[{"name":"arg0","type":"uint256"}],"outputs":[{"name":"","type":"uint256"}]},{"stateMutability":"view","type":"function","name":"burner","inputs":[],"outputs":[{"name":"","type":"address"}]},{"stateMutability":"view","type":"function","name":"hooker","inputs":[],"outputs":[{"name":"","type":"address"}]},{"stateMutability":"view","type":"function","name":"is_killed","inputs":[{"name":"arg0","type":"address"}],"outputs":[{"name":"","type":"uint256"}]},{"stateMutability":"view","type":"function","name":"owner","inputs":[],"outputs":[{"name":"","type":"address"}]},{"stateMutability":"view","type":"function","name":"emergency_owner","inputs":[],"outputs":[{"name":"","type":"address"}]}];

    const Multicall3ABI = [{"inputs":[{"components":[{"internalType":"address","name":"target","type":"address"},{"internalType":"bytes","name":"callData","type":"bytes"}],"internalType":"struct Multicall3.Call[]","name":"calls","type":"tuple[]"}],"name":"aggregate","outputs":[{"internalType":"uint256","name":"blockNumber","type":"uint256"},{"internalType":"bytes[]","name":"returnData","type":"bytes[]"}],"stateMutability":"payable","type":"function"},{"inputs":[{"components":[{"internalType":"address","name":"target","type":"address"},{"internalType":"bool","name":"allowFailure","type":"bool"},{"internalType":"bytes","name":"callData","type":"bytes"}],"internalType":"struct Multicall3.Call3[]","name":"calls","type":"tuple[]"}],"name":"aggregate3","outputs":[{"components":[{"internalType":"bool","name":"success","type":"bool"},{"internalType":"bytes","name":"returnData","type":"bytes"}],"internalType":"struct Multicall3.Result[]","name":"returnData","type":"tuple[]"}],"stateMutability":"payable","type":"function"}];

    const FeeCollectorContract = new web3.eth.Contract(FeeCollectorABI, FeeCollectorAddress);
    const Multicall3Contract = new web3.eth.Contract(Multicall3ABI, Multicall3Address);

    async function updateValues() {
        const calls = [
            { target: FeeCollectorAddress, allowFailure: false, callData: web3.eth.abi.encodeFunctionSignature('target()') },
            { target: FeeCollectorAddress, allowFailure: false, callData: web3.eth.abi.encodeFunctionSignature('burner()') },
            { target: FeeCollectorAddress, allowFailure: false, callData: web3.eth.abi.encodeFunctionSignature('hooker()') },
            { target: FeeCollectorAddress, allowFailure: false, callData: web3.eth.abi.encodeFunctionSignature('owner()') },
            { target: FeeCollectorAddress, allowFailure: false, callData: web3.eth.abi.encodeFunctionSignature('emergency_owner()') }
        ];

        try {
            const results = await Multicall3Contract.methods.aggregate3(calls).call();
            console.log('Multicall results:', results);

            const elementIds = [
                'targetOutput', 'burnerOutput', 'hookerOutput',
                'ownerOutput', 'emergencyOwnerOutput'
            ];

            results.forEach((result, index) => {
                const element = document.getElementById(elementIds[index]);
                if (element) {
                    if (result.success) {
                        let decodedResult;
                        switch (elementIds[index]) {
                            case 'placeholder':
                                decodedResult = web3.eth.abi.decodeParameter('uint256', result.returnData);
                                break;
                            case 'isKilledOutput':
                                decodedResult = web3.eth.abi.decodeParameter('bool', result.returnData);
                                break;
                            case 'emergencyOwnerOutput':
                            case 'ownerOutput':
                            case 'burnerOutput':
                            case 'hookerOutput':
                            case 'targetOutput':
                                decodedResult = web3.eth.abi.decodeParameter('address', result.returnData);
                                break;
                        }
                        console.log(`${elementIds[index]}:`, decodedResult);
                        element.textContent = JSON.stringify(decodedResult);
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
    async function handleMultiInputQuery(inputIds, outputId, method) {
        const inputElements = inputIds.map(id => document.getElementById(id));
        const outputElement = document.getElementById(outputId);

        async function fetchData() {
            const inputs = inputElements.map(el => el ? el.value.trim() : '');

            // Handle default values (e.g., current timestamp for epoch)
            if (method === 'epoch' && inputs[0] === '') {
                inputs[0] = Math.floor(Date.now() / 1000).toString();
                inputElements[0].value = inputs[0];
            }

            // Remove timestamp-related logic for can_exchange
            if (method === 'can_exchange' || method === 'is_killed') {

                if (method === 'can_exchange') {
                    // Convert single address to array for can_exchange method
                    inputs[0] = [inputs[0]];
                }
                // For is_killed, we keep the input as a single address, not an array
            }

            if (method === 'epoch_time_frame' && inputs[0] === '' && inputs[1] === '') {
                let ts = Math.floor(Date.now() / 1000);
                try {
                    let epoch = await FeeCollectorContract.methods.epoch(ts).call();
                    inputElements[0].value = epoch;
                    inputs[0] = epoch;
                    inputs[1] = ts.toString();
                    inputElements[1].value = inputs[1];
                } catch (error) {
                    console.error('Error fetching epoch:', error);
                    outputElement.textContent = `Error: ${error.message}`;
                    outputElement.style.color = 'red';
                    return;
                }
            }

            if (method === 'fee' && inputs[0] === '' && inputs[1] === '') {
                let ts = Math.floor(Date.now() / 1000);
                try {
                    let epoch = await FeeCollectorContract.methods.epoch(ts).call();
                    inputElements[0].value = epoch;
                    inputs[0] = epoch;
                    inputs[1] = ts.toString();
                    inputElements[1].value = inputs[1];
                } catch (error) {
                    console.error('Error fetching fee:', error);
                    outputElement.textContent = `Error: ${error.message}`;
                    outputElement.style.color = 'red';
                    return;
                }
            }

            if (method === 'max_fee' && isInitialMaxFeeLoad && inputs[0] === '') {
                let ts = Math.floor(Date.now() / 1000);
                try {
                    let epoch = await FeeCollectorContract.methods.epoch(ts).call();
                    inputElements[0].value = epoch;
                    inputs[0] = epoch;
                } catch (error) {
                    console.error('Error fetching epoch:', error);
                    outputElement.textContent = `Error: ${error.message}`;
                    outputElement.style.color = 'red';
                    return;
                }
                isInitialMaxFeeLoad = false;
            }

            // Add this function to check for valid epoch values
            function isValidEpoch(epoch) {
                return [1, 2, 4, 8].includes(Number(epoch));
            }

            if (method === 'max_fee') {
                if (!isValidEpoch(inputs[0])) {
                    outputElement.textContent = 'Warning: Epoch should be 1, 2, 4, or 8';
                    outputElement.style.color = 'orange';
                    return;
                }
            }

            if (inputs.some(input => input === '')) {
                outputElement.textContent = 'Please enter valid inputs for all fields';
                outputElement.style.color = 'red';
                return;
            }

            if (inputs.some(input => input === '')) {
                outputElement.textContent = 'Please enter valid inputs for all fields';
                outputElement.style.color = 'red';
                return;
            }

            try {
                const result = await FeeCollectorContract.methods[method](...inputs).call();
                let formattedResult;

                switch (method) {
                    case 'epoch':
                    case 'fee':
                    case 'max_fee':
                        formattedResult = result.toString();
                        break;
                    case 'epoch_time_frame':
                        formattedResult = `Start: ${result[0]}, End: ${result[1]}`;
                        break;
                    case 'can_exchange':
                    case 'is_killed':
                        formattedResult = result.toString();
                        break;
                    default:
                        formattedResult = JSON.stringify(result);
                }

                outputElement.textContent = formattedResult;
                outputElement.style.color = 'green';
            } catch (error) {
                console.error(`Error fetching ${method}:`, error);
                outputElement.textContent = `Error: ${error.message}`;
                outputElement.style.color = 'red';
            }
        }

        // Initial fetch
        await fetchData();

        // Add event listeners for input changes
        inputElements.forEach(el => {
            if (el) {
                el.addEventListener('input', () => {
                    if (outputElement) {
                        outputElement.textContent = '';
                        outputElement.style.color = '';
                        fetchData();
                    }
                });
            }
        });
    }

    // Set up queries for all methods
    handleMultiInputQuery(['epochInput'], 'epochOutput', 'epoch');
    handleMultiInputQuery(['epochTimeFrameEpochInput', 'epochTimeFrameTsInput'], 'epochTimeFrameOutput', 'epoch_time_frame');
    handleMultiInputQuery(['feeEpochInput', 'feeTsInput'], 'feeOutput', 'fee');
    handleMultiInputQuery(['maxFeeEpochInput'], 'maxFeeOutput', 'max_fee');
    handleMultiInputQuery(['canExchangeCoinsInput'], 'canExchangeOutput', 'can_exchange');
    handleMultiInputQuery(['isKilledCoinInput'], 'isKilledOutput', 'is_killed');

    // Add more method queries as needed
    // handleMultiInputQuery(['inputId1', 'inputId2'], 'outputId', 'methodName');
});
