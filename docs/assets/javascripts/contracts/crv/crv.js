document.addEventListener('DOMContentLoaded', async function() {
    const web3 = new Web3('https://eth.llamarpc.com');
    const CRVAddress = '0xD533a949740bb3306d119CC777fa900bA034cd52';
    const Multicall3Address = '0xcA11bde05977b3631167028862bE2a173976CA11';

    const CRVABI = [{"name":"Transfer","inputs":[{"type":"address","name":"_from","indexed":true},{"type":"address","name":"_to","indexed":true},{"type":"uint256","name":"_value","indexed":false}],"anonymous":false,"type":"event"},{"name":"Approval","inputs":[{"type":"address","name":"_owner","indexed":true},{"type":"address","name":"_spender","indexed":true},{"type":"uint256","name":"_value","indexed":false}],"anonymous":false,"type":"event"},{"name":"UpdateMiningParameters","inputs":[{"type":"uint256","name":"time","indexed":false},{"type":"uint256","name":"rate","indexed":false},{"type":"uint256","name":"supply","indexed":false}],"anonymous":false,"type":"event"},{"name":"SetMinter","inputs":[{"type":"address","name":"minter","indexed":false}],"anonymous":false,"type":"event"},{"name":"SetAdmin","inputs":[{"type":"address","name":"admin","indexed":false}],"anonymous":false,"type":"event"},{"outputs":[],"inputs":[{"type":"string","name":"_name"},{"type":"string","name":"_symbol"},{"type":"uint256","name":"_decimals"}],"stateMutability":"nonpayable","type":"constructor"},{"name":"update_mining_parameters","outputs":[],"inputs":[],"stateMutability":"nonpayable","type":"function","gas":148748},{"name":"start_epoch_time_write","outputs":[{"type":"uint256","name":""}],"inputs":[],"stateMutability":"nonpayable","type":"function","gas":149603},{"name":"future_epoch_time_write","outputs":[{"type":"uint256","name":""}],"inputs":[],"stateMutability":"nonpayable","type":"function","gas":149806},{"name":"available_supply","outputs":[{"type":"uint256","name":""}],"inputs":[],"stateMutability":"view","type":"function","gas":4018},{"name":"mintable_in_timeframe","outputs":[{"type":"uint256","name":""}],"inputs":[{"type":"uint256","name":"start"},{"type":"uint256","name":"end"}],"stateMutability":"view","type":"function","gas":2216141},{"name":"set_minter","outputs":[],"inputs":[{"type":"address","name":"_minter"}],"stateMutability":"nonpayable","type":"function","gas":38698},{"name":"set_admin","outputs":[],"inputs":[{"type":"address","name":"_admin"}],"stateMutability":"nonpayable","type":"function","gas":37837},{"name":"totalSupply","outputs":[{"type":"uint256","name":""}],"inputs":[],"stateMutability":"view","type":"function","gas":1421},{"name":"allowance","outputs":[{"type":"uint256","name":""}],"inputs":[{"type":"address","name":"_owner"},{"type":"address","name":"_spender"}],"stateMutability":"view","type":"function","gas":1759},{"name":"transfer","outputs":[{"type":"bool","name":""}],"inputs":[{"type":"address","name":"_to"},{"type":"uint256","name":"_value"}],"stateMutability":"nonpayable","type":"function","gas":75139},{"name":"transferFrom","outputs":[{"type":"bool","name":""}],"inputs":[{"type":"address","name":"_from"},{"type":"address","name":"_to"},{"type":"uint256","name":"_value"}],"stateMutability":"nonpayable","type":"function","gas":111433},{"name":"approve","outputs":[{"type":"bool","name":""}],"inputs":[{"type":"address","name":"_spender"},{"type":"uint256","name":"_value"}],"stateMutability":"nonpayable","type":"function","gas":39288},{"name":"mint","outputs":[{"type":"bool","name":""}],"inputs":[{"type":"address","name":"_to"},{"type":"uint256","name":"_value"}],"stateMutability":"nonpayable","type":"function","gas":228030},{"name":"burn","outputs":[{"type":"bool","name":""}],"inputs":[{"type":"uint256","name":"_value"}],"stateMutability":"nonpayable","type":"function","gas":74999},{"name":"set_name","outputs":[],"inputs":[{"type":"string","name":"_name"},{"type":"string","name":"_symbol"}],"stateMutability":"nonpayable","type":"function","gas":178270},{"name":"name","outputs":[{"type":"string","name":""}],"inputs":[],"stateMutability":"view","type":"function","gas":8063},{"name":"symbol","outputs":[{"type":"string","name":""}],"inputs":[],"stateMutability":"view","type":"function","gas":7116},{"name":"decimals","outputs":[{"type":"uint256","name":""}],"inputs":[],"stateMutability":"view","type":"function","gas":1721},{"name":"balanceOf","outputs":[{"type":"uint256","name":""}],"inputs":[{"type":"address","name":"arg0"}],"stateMutability":"view","type":"function","gas":1905},{"name":"minter","outputs":[{"type":"address","name":""}],"inputs":[],"stateMutability":"view","type":"function","gas":1781},{"name":"admin","outputs":[{"type":"address","name":""}],"inputs":[],"stateMutability":"view","type":"function","gas":1811},{"name":"mining_epoch","outputs":[{"type":"int128","name":""}],"inputs":[],"stateMutability":"view","type":"function","gas":1841},{"name":"start_epoch_time","outputs":[{"type":"uint256","name":""}],"inputs":[],"stateMutability":"view","type":"function","gas":1871},{"name":"rate","outputs":[{"type":"uint256","name":""}],"inputs":[],"stateMutability":"view","type":"function","gas":1901}];

    const Multicall3ABI = [{"inputs":[{"components":[{"internalType":"address","name":"target","type":"address"},{"internalType":"bytes","name":"callData","type":"bytes"}],"internalType":"struct Multicall3.Call[]","name":"calls","type":"tuple[]"}],"name":"aggregate","outputs":[{"internalType":"uint256","name":"blockNumber","type":"uint256"},{"internalType":"bytes[]","name":"returnData","type":"bytes[]"}],"stateMutability":"payable","type":"function"},{"inputs":[{"components":[{"internalType":"address","name":"target","type":"address"},{"internalType":"bool","name":"allowFailure","type":"bool"},{"internalType":"bytes","name":"callData","type":"bytes"}],"internalType":"struct Multicall3.Call3[]","name":"calls","type":"tuple[]"}],"name":"aggregate3","outputs":[{"components":[{"internalType":"bool","name":"success","type":"bool"},{"internalType":"bytes","name":"returnData","type":"bytes"}],"internalType":"struct Multicall3.Result[]","name":"returnData","type":"tuple[]"}],"stateMutability":"payable","type":"function"}];

    const CRVContract = new web3.eth.Contract(CRVABI, CRVAddress);
    const Multicall3Contract = new web3.eth.Contract(Multicall3ABI, Multicall3Address);

    async function updateValues() {
        const calls = [
            { target: CRVAddress, allowFailure: false, callData: web3.eth.abi.encodeFunctionSignature('name()') },
            { target: CRVAddress, allowFailure: false, callData: web3.eth.abi.encodeFunctionSignature('symbol()') },
            { target: CRVAddress, allowFailure: false, callData: web3.eth.abi.encodeFunctionSignature('decimals()') },
            { target: CRVAddress, allowFailure: false, callData: web3.eth.abi.encodeFunctionSignature('totalSupply()') },
            { target: CRVAddress, allowFailure: false, callData: web3.eth.abi.encodeFunctionSignature('minter()') },
            { target: CRVAddress, allowFailure: false, callData: web3.eth.abi.encodeFunctionSignature('admin()') },
            { target: CRVAddress, allowFailure: false, callData: web3.eth.abi.encodeFunctionSignature('mining_epoch()') },
            { target: CRVAddress, allowFailure: false, callData: web3.eth.abi.encodeFunctionSignature('start_epoch_time()') },
            { target: CRVAddress, allowFailure: false, callData: web3.eth.abi.encodeFunctionSignature('rate()') }
        ];

        const elementIds = ['nameOutput', 'symbolOutput', 'decimalsOutput', 'totalSupplyOutput', 'minterOutput', 'adminOutput', 'miningEpochOutput', 'startEpochTimeOutput', 'rateOutput'];

        try {
            const results = await Multicall3Contract.methods.aggregate3(calls).call();

            results.forEach((result, index) => {
                const element = document.getElementById(elementIds[index]);
                if (element) {
                    if (result.success) {
                        try {
                            let decodedResult;
                            switch(index) {
                                case 0: // name
                                case 1: // symbol
                                    decodedResult = web3.eth.abi.decodeParameter('string', result.returnData);
                                    element.textContent = `'${decodedResult}'`;
                                    break;
                                case 4: // minter
                                case 5: // admin
                                    decodedResult = web3.eth.abi.decodeParameter('address', result.returnData);
                                    element.textContent = `'${decodedResult}'`;
                                    break;
                                default: // decimals, totalSupply, mining_epoch, start_epoch_time, rate
                                    decodedResult = web3.eth.abi.decodeParameter('uint256', result.returnData);
                                    element.textContent = `${decodedResult}`;
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
                    element.textContent = `>>> Error fetching data`;
                    element.style.color = 'red';
                }
            });
        }
    }

    // Call updateValues to fetch and display data
    updateValues();

    // Function to handle input-based queries
    async function handleInputQuery(inputIds, outputId, method) {
        const inputs = inputIds.map(id => document.getElementById(id));
        const outputElement = document.getElementById(outputId);

        async function fetchData() {
            const inputValues = inputs.map(input => input.value.trim());

            if (inputValues.some(value => value === '')) {
                outputElement.textContent = 'Please enter all required inputs';
                outputElement.style.color = 'red';
                return;
            }

            try {
                const result = await CRVContract.methods[method](...inputValues).call();
                let formattedResult;

                if (method === 'balanceOf' || method === 'allowance' || method === 'mintable_in_timeframe') {
                    formattedResult = `${result}`;
                } else if (typeof result === 'string' && result.startsWith('0x')) {
                    formattedResult = `"${result}"`;
                } else if (typeof result === 'string') {
                    formattedResult = `"${result}"`;
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
        fetchData();

        // Add event listeners for all inputs
        inputs.forEach(input => {
            input.addEventListener('input', fetchData);
        });
    }

    // Set up input-based queries
    handleInputQuery(['balanceOfAddress'], 'balanceOfOutput', 'balanceOf');
    handleInputQuery(['allowanceOwner', 'allowanceSpender'], 'allowanceOutput', 'allowance');
    handleInputQuery(['mintableStart', 'mintableEnd'], 'mintableOutput', 'mintable_in_timeframe');
});
