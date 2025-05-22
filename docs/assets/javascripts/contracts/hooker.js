// logic for fetching CowSwapBurner contract data

document.addEventListener('DOMContentLoaded', async function() {
    const web3 = new Web3('https://eth.llamarpc.com');
    const HookerAddress = '0x9A9DF35cd8E88565694CA6AD5093c236C7f6f69D';
    const Multicall3Address = '0xcA11bde05977b3631167028862bE2a173976CA11';

    const HookerABI = [{"name":"DutyAct","inputs":[],"anonymous":false,"type":"event"},{"name":"Act","inputs":[{"name":"receiver","type":"address","indexed":true},{"name":"compensation","type":"uint256","indexed":false}],"anonymous":false,"type":"event"},{"name":"HookShot","inputs":[{"name":"hook_id","type":"uint8","indexed":true},{"name":"compensation","type":"uint256","indexed":false}],"anonymous":false,"type":"event"},{"stateMutability":"nonpayable","type":"constructor","inputs":[{"name":"_fee_collector","type":"address"},{"name":"_initial_oth","type":"tuple[]","components":[{"name":"to","type":"address"},{"name":"foreplay","type":"bytes"},{"name":"compensation_strategy","type":"tuple","components":[{"name":"amount","type":"uint256"},{"name":"cooldown","type":"tuple","components":[{"name":"duty_counter","type":"uint64"},{"name":"used","type":"uint64"},{"name":"limit","type":"uint64"}]},{"name":"start","type":"uint256"},{"name":"end","type":"uint256"},{"name":"dutch","type":"bool"}]},{"name":"duty","type":"bool"}]},{"name":"_initial_oth_inputs","type":"tuple[]","components":[{"name":"hook_id","type":"uint8"},{"name":"value","type":"uint256"},{"name":"data","type":"bytes"}]},{"name":"_initial_hooks","type":"tuple[]","components":[{"name":"to","type":"address"},{"name":"foreplay","type":"bytes"},{"name":"compensation_strategy","type":"tuple","components":[{"name":"amount","type":"uint256"},{"name":"cooldown","type":"tuple","components":[{"name":"duty_counter","type":"uint64"},{"name":"used","type":"uint64"},{"name":"limit","type":"uint64"}]},{"name":"start","type":"uint256"},{"name":"end","type":"uint256"},{"name":"dutch","type":"bool"}]},{"name":"duty","type":"bool"}]}],"outputs":[]},{"stateMutability":"view","type":"function","name":"calc_compensation","inputs":[{"name":"_hook_inputs","type":"tuple[]","components":[{"name":"hook_id","type":"uint8"},{"name":"value","type":"uint256"},{"name":"data","type":"bytes"}]}],"outputs":[{"name":"","type":"uint256"}]},{"stateMutability":"view","type":"function","name":"calc_compensation","inputs":[{"name":"_hook_inputs","type":"tuple[]","components":[{"name":"hook_id","type":"uint8"},{"name":"value","type":"uint256"},{"name":"data","type":"bytes"}]},{"name":"_duty","type":"bool"}],"outputs":[{"name":"","type":"uint256"}]},{"stateMutability":"view","type":"function","name":"calc_compensation","inputs":[{"name":"_hook_inputs","type":"tuple[]","components":[{"name":"hook_id","type":"uint8"},{"name":"value","type":"uint256"},{"name":"data","type":"bytes"}]},{"name":"_duty","type":"bool"},{"name":"_ts","type":"uint256"}],"outputs":[{"name":"","type":"uint256"}]},{"stateMutability":"payable","type":"function","name":"duty_act","inputs":[{"name":"_hook_inputs","type":"tuple[]","components":[{"name":"hook_id","type":"uint8"},{"name":"value","type":"uint256"},{"name":"data","type":"bytes"}]}],"outputs":[{"name":"","type":"uint256"}]},{"stateMutability":"payable","type":"function","name":"duty_act","inputs":[{"name":"_hook_inputs","type":"tuple[]","components":[{"name":"hook_id","type":"uint8"},{"name":"value","type":"uint256"},{"name":"data","type":"bytes"}]},{"name":"_receiver","type":"address"}],"outputs":[{"name":"","type":"uint256"}]},{"stateMutability":"payable","type":"function","name":"act","inputs":[{"name":"_hook_inputs","type":"tuple[]","components":[{"name":"hook_id","type":"uint8"},{"name":"value","type":"uint256"},{"name":"data","type":"bytes"}]}],"outputs":[{"name":"","type":"uint256"}]},{"stateMutability":"payable","type":"function","name":"act","inputs":[{"name":"_hook_inputs","type":"tuple[]","components":[{"name":"hook_id","type":"uint8"},{"name":"value","type":"uint256"},{"name":"data","type":"bytes"}]},{"name":"_receiver","type":"address"}],"outputs":[{"name":"","type":"uint256"}]},{"stateMutability":"payable","type":"function","name":"one_time_hooks","inputs":[{"name":"_hooks","type":"tuple[]","components":[{"name":"to","type":"address"},{"name":"foreplay","type":"bytes"},{"name":"compensation_strategy","type":"tuple","components":[{"name":"amount","type":"uint256"},{"name":"cooldown","type":"tuple","components":[{"name":"duty_counter","type":"uint64"},{"name":"used","type":"uint64"},{"name":"limit","type":"uint64"}]},{"name":"start","type":"uint256"},{"name":"end","type":"uint256"},{"name":"dutch","type":"bool"}]},{"name":"duty","type":"bool"}]},{"name":"_inputs","type":"tuple[]","components":[{"name":"hook_id","type":"uint8"},{"name":"value","type":"uint256"},{"name":"data","type":"bytes"}]}],"outputs":[]},{"stateMutability":"nonpayable","type":"function","name":"set_hooks","inputs":[{"name":"_new_hooks","type":"tuple[]","components":[{"name":"to","type":"address"},{"name":"foreplay","type":"bytes"},{"name":"compensation_strategy","type":"tuple","components":[{"name":"amount","type":"uint256"},{"name":"cooldown","type":"tuple","components":[{"name":"duty_counter","type":"uint64"},{"name":"used","type":"uint64"},{"name":"limit","type":"uint64"}]},{"name":"start","type":"uint256"},{"name":"end","type":"uint256"},{"name":"dutch","type":"bool"}]},{"name":"duty","type":"bool"}]}],"outputs":[]},{"stateMutability":"pure","type":"function","name":"supportsInterface","inputs":[{"name":"_interface_id","type":"bytes4"}],"outputs":[{"name":"","type":"bool"}]},{"stateMutability":"nonpayable","type":"function","name":"recover","inputs":[{"name":"_coins","type":"address[]"}],"outputs":[]},{"stateMutability":"view","type":"function","name":"fee_collector","inputs":[],"outputs":[{"name":"","type":"address"}]},{"stateMutability":"view","type":"function","name":"hooks","inputs":[{"name":"arg0","type":"uint256"}],"outputs":[{"name":"","type":"tuple","components":[{"name":"to","type":"address"},{"name":"foreplay","type":"bytes"},{"name":"compensation_strategy","type":"tuple","components":[{"name":"amount","type":"uint256"},{"name":"cooldown","type":"tuple","components":[{"name":"duty_counter","type":"uint64"},{"name":"used","type":"uint64"},{"name":"limit","type":"uint64"}]},{"name":"start","type":"uint256"},{"name":"end","type":"uint256"},{"name":"dutch","type":"bool"}]},{"name":"duty","type":"bool"}]}]},{"stateMutability":"view","type":"function","name":"buffer_amount","inputs":[],"outputs":[{"name":"","type":"uint256"}]},{"stateMutability":"view","type":"function","name":"duty_counter","inputs":[],"outputs":[{"name":"","type":"uint64"}]}];

    const Multicall3ABI = [{"inputs":[{"components":[{"internalType":"address","name":"target","type":"address"},{"internalType":"bytes","name":"callData","type":"bytes"}],"internalType":"struct Multicall3.Call[]","name":"calls","type":"tuple[]"}],"name":"aggregate","outputs":[{"internalType":"uint256","name":"blockNumber","type":"uint256"},{"internalType":"bytes[]","name":"returnData","type":"bytes[]"}],"stateMutability":"payable","type":"function"},{"inputs":[{"components":[{"internalType":"address","name":"target","type":"address"},{"internalType":"bool","name":"allowFailure","type":"bool"},{"internalType":"bytes","name":"callData","type":"bytes"}],"internalType":"struct Multicall3.Call3[]","name":"calls","type":"tuple[]"}],"name":"aggregate3","outputs":[{"components":[{"internalType":"bool","name":"success","type":"bool"},{"internalType":"bytes","name":"returnData","type":"bytes"}],"internalType":"struct Multicall3.Result[]","name":"returnData","type":"tuple[]"}],"stateMutability":"payable","type":"function"}];

    const HookerContract = new web3.eth.Contract(HookerABI, HookerAddress);
    const Multicall3Contract = new web3.eth.Contract(Multicall3ABI, Multicall3Address);

    async function updateValues() {
        const calls = [
            { target: HookerAddress, allowFailure: false, callData: web3.eth.abi.encodeFunctionSignature('duty_counter()') },
            { target: HookerAddress, allowFailure: false, callData: web3.eth.abi.encodeFunctionSignature('buffer_amount()') },
            { target: HookerAddress, allowFailure: false, callData: web3.eth.abi.encodeFunctionSignature('fee_collector()') }
        ];

        try {
            const results = await Multicall3Contract.methods.aggregate3(calls).call();
            const elementIds = ['duty_counterOutput', 'buffer_amountOutput', 'fee_collectorOutput'];

            results.forEach((result, index) => {
                const element = document.getElementById(elementIds[index]);
                if (element) {
                    if (result.success) {
                        let decodedResult;
                        switch (elementIds[index]) {
                            case 'duty_counterOutput':
                            case 'buffer_amountOutput':
                                decodedResult = web3.eth.abi.decodeParameter('uint256', result.returnData);
                                break;
                            case 'fee_collectorOutput':
                                decodedResult = `"${web3.eth.abi.decodeParameter('address', result.returnData)}"`;
                                break;
                        }
                        element.textContent = decodedResult;
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
    async function handleInputQuery(inputId, outputId, method) {
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
                const result = await HookerContract.methods[method](input).call();
                let formattedResult;

                if (method === 'hooks') {
                    formattedResult = `{ addr: "${result.to}", foreplay: "${result.foreplay}", compensation_strategy: ${JSON.stringify(result.compensation_strategy)}, duty: ${result.duty} }`;
                } else if (typeof result === 'string' && result.startsWith('0x')) {
                    formattedResult = `"${result}"`;
                } else if (typeof result === 'string') {
                    formattedResult = `"${result}"`;
                } else if (typeof result === 'object') {
                    formattedResult = JSON.stringify(result, null, 2);
                } else {
                    formattedResult = result.toString();
                }

                outputElement.textContent = formattedResult;
                outputElement.style.color = 'green';
            } catch (error) {
                console.error(`Error fetching ${method}:`, error);
                outputElement.textContent = `${error.message}`;
                outputElement.style.color = 'red';
            }
        }
        // Initial fetch
        fetchData();

        inputElement.addEventListener('input', fetchData);
    }

    // Set up input-based query for hooks
    handleInputQuery('hookIndex', 'hooksOutput', 'hooks');
    handleInputQuery('interfaceId', 'interfaceIdOutput', 'supportsInterface');
});
