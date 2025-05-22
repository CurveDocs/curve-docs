document.addEventListener('DOMContentLoaded', async function() {
    const web3 = new Web3('https://eth.llamarpc.com');
    const RootGaugeFactoryAddress = '0x306A45a1478A000dC701A6e1f7a569afb8D9DCD6';
    const Multicall3Address = '0xcA11bde05977b3631167028862bE2a173976CA11';

    const RootGaugeFactoryABI = [{"name":"ChildUpdated","inputs":[{"name":"_chain_id","type":"uint256","indexed":true},{"name":"_new_bridger","type":"address","indexed":false},{"name":"_new_factory","type":"address","indexed":false},{"name":"_new_implementation","type":"address","indexed":false}],"anonymous":false,"type":"event"},{"name":"DeployedGauge","inputs":[{"name":"_implementation","type":"address","indexed":true},{"name":"_chain_id","type":"uint256","indexed":true},{"name":"_deployer","type":"address","indexed":true},{"name":"_salt","type":"bytes32","indexed":false},{"name":"_gauge","type":"address","indexed":false}],"anonymous":false,"type":"event"},{"name":"TransferOwnership","inputs":[{"name":"_old_owner","type":"address","indexed":false},{"name":"_new_owner","type":"address","indexed":false}],"anonymous":false,"type":"event"},{"name":"UpdateCallProxy","inputs":[{"name":"_old_call_proxy","type":"address","indexed":false},{"name":"_new_call_proxy","type":"address","indexed":false}],"anonymous":false,"type":"event"},{"name":"UpdateImplementation","inputs":[{"name":"_old_implementation","type":"address","indexed":false},{"name":"_new_implementation","type":"address","indexed":false}],"anonymous":false,"type":"event"},{"stateMutability":"nonpayable","type":"constructor","inputs":[{"name":"_call_proxy","type":"address"},{"name":"_owner","type":"address"}],"outputs":[]},{"stateMutability":"nonpayable","type":"function","name":"transmit_emissions","inputs":[{"name":"_gauge","type":"address"}],"outputs":[]},{"stateMutability":"payable","type":"function","name":"deploy_gauge","inputs":[{"name":"_chain_id","type":"uint256"},{"name":"_salt","type":"bytes32"}],"outputs":[{"name":"","type":"address"}]},{"stateMutability":"nonpayable","type":"function","name":"deploy_child_gauge","inputs":[{"name":"_chain_id","type":"uint256"},{"name":"_lp_token","type":"address"},{"name":"_salt","type":"bytes32"}],"outputs":[]},{"stateMutability":"nonpayable","type":"function","name":"deploy_child_gauge","inputs":[{"name":"_chain_id","type":"uint256"},{"name":"_lp_token","type":"address"},{"name":"_salt","type":"bytes32"},{"name":"_manager","type":"address"}],"outputs":[]},{"stateMutability":"nonpayable","type":"function","name":"set_child","inputs":[{"name":"_chain_id","type":"uint256"},{"name":"_bridger","type":"address"},{"name":"_child_factory","type":"address"},{"name":"_child_impl","type":"address"}],"outputs":[]},{"stateMutability":"nonpayable","type":"function","name":"set_implementation","inputs":[{"name":"_implementation","type":"address"}],"outputs":[]},{"stateMutability":"nonpayable","type":"function","name":"set_call_proxy","inputs":[{"name":"_call_proxy","type":"address"}],"outputs":[]},{"stateMutability":"nonpayable","type":"function","name":"commit_transfer_ownership","inputs":[{"name":"_future_owner","type":"address"}],"outputs":[]},{"stateMutability":"nonpayable","type":"function","name":"accept_transfer_ownership","inputs":[],"outputs":[]},{"stateMutability":"view","type":"function","name":"version","inputs":[],"outputs":[{"name":"","type":"string"}]},{"stateMutability":"view","type":"function","name":"call_proxy","inputs":[],"outputs":[{"name":"","type":"address"}]},{"stateMutability":"view","type":"function","name":"get_bridger","inputs":[{"name":"arg0","type":"uint256"}],"outputs":[{"name":"","type":"address"}]},{"stateMutability":"view","type":"function","name":"get_child_factory","inputs":[{"name":"arg0","type":"uint256"}],"outputs":[{"name":"","type":"address"}]},{"stateMutability":"view","type":"function","name":"get_child_implementation","inputs":[{"name":"arg0","type":"uint256"}],"outputs":[{"name":"","type":"address"}]},{"stateMutability":"view","type":"function","name":"get_implementation","inputs":[],"outputs":[{"name":"","type":"address"}]},{"stateMutability":"view","type":"function","name":"get_gauge","inputs":[{"name":"arg0","type":"uint256"},{"name":"arg1","type":"uint256"}],"outputs":[{"name":"","type":"address"}]},{"stateMutability":"view","type":"function","name":"get_gauge_count","inputs":[{"name":"arg0","type":"uint256"}],"outputs":[{"name":"","type":"uint256"}]},{"stateMutability":"view","type":"function","name":"is_valid_gauge","inputs":[{"name":"arg0","type":"address"}],"outputs":[{"name":"","type":"bool"}]},{"stateMutability":"view","type":"function","name":"owner","inputs":[],"outputs":[{"name":"","type":"address"}]},{"stateMutability":"view","type":"function","name":"future_owner","inputs":[],"outputs":[{"name":"","type":"address"}]}];

    const Multicall3ABI = [{"inputs":[{"components":[{"internalType":"address","name":"target","type":"address"},{"internalType":"bytes","name":"callData","type":"bytes"}],"internalType":"struct Multicall3.Call[]","name":"calls","type":"tuple[]"}],"name":"aggregate","outputs":[{"internalType":"uint256","name":"blockNumber","type":"uint256"},{"internalType":"bytes[]","name":"returnData","type":"bytes[]"}],"stateMutability":"payable","type":"function"},{"inputs":[{"components":[{"internalType":"address","name":"target","type":"address"},{"internalType":"bool","name":"allowFailure","type":"bool"},{"internalType":"bytes","name":"callData","type":"bytes"}],"internalType":"struct Multicall3.Call3[]","name":"calls","type":"tuple[]"}],"name":"aggregate3","outputs":[{"components":[{"internalType":"bool","name":"success","type":"bool"},{"internalType":"bytes","name":"returnData","type":"bytes"}],"internalType":"struct Multicall3.Result[]","name":"returnData","type":"tuple[]"}],"stateMutability":"payable","type":"function"}];

    const RootGaugeFactoryContract = new web3.eth.Contract(RootGaugeFactoryABI, RootGaugeFactoryAddress);
    const Multicall3Contract = new web3.eth.Contract(Multicall3ABI, Multicall3Address);

    async function updateValues() {
        const elementIds = ['getImplementationOutput', 'getOwnerOutput', 'getFutureOwnerOutput', 'getCallProxyOutput'];
        const calls = [
            { target: RootGaugeFactoryAddress, allowFailure: false, callData: web3.eth.abi.encodeFunctionSignature('get_implementation()') },
            { target: RootGaugeFactoryAddress, allowFailure: false, callData: web3.eth.abi.encodeFunctionSignature('owner()') },
            { target: RootGaugeFactoryAddress, allowFailure: false, callData: web3.eth.abi.encodeFunctionSignature('future_owner()') },
            { target: RootGaugeFactoryAddress, allowFailure: false, callData: web3.eth.abi.encodeFunctionSignature('call_proxy()') }
        ];

        try {
            const results = await Multicall3Contract.methods.aggregate3(calls).call();

            results.forEach((result, index) => {
                const element = document.getElementById(elementIds[index]);
                if (element) {
                    if (result.success) {
                        let decodedResult;
                        if (index === 4) { // version is a string
                            try {
                                decodedResult = web3.eth.abi.decodeParameter('string', result.returnData);
                            } catch (e) {
                                console.warn('Error decoding version:', e);
                                decodedResult = 'Error decoding version';
                            }
                        } else { // all others are addresses
                            try {
                                decodedResult = web3.eth.abi.decodeParameter('address', result.returnData);
                            } catch (e) {
                                console.warn(`Error decoding address for ${elementIds[index]}:`, e);
                                decodedResult = 'Error decoding address';
                            }
                        }
                        element.textContent = `'${decodedResult}'`;
                        element.style.color = 'green';
                    } else {
                        element.textContent = '>>> Error fetching data';
                        element.style.color = 'red';
                    }
                } else {
                    console.warn(`Element with id '${elementIds[index]}' not found.`);
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
    async function handleMultiInputQuery(inputIds, outputId, method) {
        const inputElements = inputIds.map(id => document.getElementById(id));
        const outputElement = document.getElementById(outputId);

        // Check if output element exists before proceeding
        if (!outputElement) {
            console.warn(`Output element with id '${outputId}' not found.`);
            return;
        }

        async function fetchData() {
            // Check if all input elements exist
            if (inputElements.some(el => !el)) {
                console.warn('Some input elements not found:', inputIds);
                return;
            }

            const inputs = inputElements.map(el => el.value.trim());

            if (inputs.some(input => input === '')) {
                outputElement.textContent = 'Please enter valid inputs for all fields';
                outputElement.style.color = 'red';
                return;
            }

            try {
                const result = await RootGaugeFactoryContract.methods[method](...inputs).call();
                let formattedResult;

                switch (method) {
                    case 'get_gauge':
                        formattedResult = `'${result}'`;
                        break;
                    case 'get_gauge_count':
                        formattedResult = result.toString();
                        break;
                    case 'get_bridger':
                    case 'get_child_factory':
                    case 'get_child_implementation':
                        formattedResult = `'${result}'`;
                        break;
                    case 'is_valid_gauge':
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
                el.addEventListener('input', fetchData);
            }
        });
    }

    // Set up queries for all methods
    handleMultiInputQuery(['getGaugeChainIdInput', 'getGaugeIndexInput'], 'getGaugeOutput', 'get_gauge');
    handleMultiInputQuery(['getGaugeCountInput'], 'getGaugeCountOutput', 'get_gauge_count');
    handleMultiInputQuery(['getBridgerInput'], 'getBridgerOutput', 'get_bridger');
    handleMultiInputQuery(['getChildFactoryInput'], 'getChildFactoryOutput', 'get_child_factory');
    handleMultiInputQuery(['getChildImplementationInput'], 'getChildImplementationOutput', 'get_child_implementation');
    handleMultiInputQuery(['isValidGaugeInput'], 'isValidGaugeOutput', 'is_valid_gauge');
});
