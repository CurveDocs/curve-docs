document.addEventListener('DOMContentLoaded', async function() {
    const web3 = new Web3('https://eth.llamarpc.com');
    const FeeSplitterAddress = '0x22556558419EeD2d0A1Af2e7Fd60E63f3199aca3';
    const Multicall3Address = '0xcA11bde05977b3631167028862bE2a173976CA11';

    const FeeSplitterABI = [
        {"inputs":[],"name":"version","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},
        {"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},
        {"inputs":[],"name":"n_controllers","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
        {"inputs":[],"name":"excess_receiver","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},
        {"inputs":[],"name":"n_receivers","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
        {"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"receivers","outputs":[{"internalType":"address","name":"addr","type":"address"},{"internalType":"uint256","name":"weight","type":"uint256"}],"stateMutability":"view","type":"function"},
        {"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"controllers","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},
        {"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"allowed_controllers","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"}
    ];

    const Multicall3ABI = [{"inputs":[{"components":[{"internalType":"address","name":"target","type":"address"},{"internalType":"bytes","name":"callData","type":"bytes"}],"internalType":"struct Multicall3.Call[]","name":"calls","type":"tuple[]"}],"name":"aggregate","outputs":[{"internalType":"uint256","name":"blockNumber","type":"uint256"},{"internalType":"bytes[]","name":"returnData","type":"bytes[]"}],"stateMutability":"payable","type":"function"},{"inputs":[{"components":[{"internalType":"address","name":"target","type":"address"},{"internalType":"bool","name":"allowFailure","type":"bool"},{"internalType":"bytes","name":"callData","type":"bytes"}],"internalType":"struct Multicall3.Call3[]","name":"calls","type":"tuple[]"}],"name":"aggregate3","outputs":[{"components":[{"internalType":"bool","name":"success","type":"bool"},{"internalType":"bytes","name":"returnData","type":"bytes"}],"internalType":"struct Multicall3.Result[]","name":"returnData","type":"tuple[]"}],"stateMutability":"payable","type":"function"}];
    
    const FeeSplitterContract = new web3.eth.Contract(FeeSplitterABI, FeeSplitterAddress);
    const Multicall3Contract = new web3.eth.Contract(Multicall3ABI, Multicall3Address);
    
    async function updateValues() {
        const calls = [
            {
                target: FeeSplitterAddress,
                allowFailure: false,
                callData: web3.eth.abi.encodeFunctionSignature('version()')
            },
            {
                target: FeeSplitterAddress,
                allowFailure: false,
                callData: web3.eth.abi.encodeFunctionSignature('owner()')
            },
            {
                target: FeeSplitterAddress,
                allowFailure: false,
                callData: web3.eth.abi.encodeFunctionSignature('n_controllers()')
            },
            {
                target: FeeSplitterAddress,
                allowFailure: false,
                callData: web3.eth.abi.encodeFunctionSignature('excess_receiver()')
            },
            {
                target: FeeSplitterAddress,
                allowFailure: false,
                callData: web3.eth.abi.encodeFunctionSignature('n_receivers()')
            }
        ];

        try {
            const results = await Multicall3Contract.methods.aggregate3(calls).call();
            const elementIds = ['versionOutput', 'ownerOutput', 'nControllersOutput', 'excessReceiverOutput', 'nReceiversOutput'];

            results.forEach((result, index) => {
                const element = document.getElementById(elementIds[index]);
                if (element) {
                    if (result.success) {
                        let decodedResult;
                        if (index === 0) { // version is a string
                            decodedResult = web3.eth.abi.decodeParameter('string', result.returnData);
                        } else if (index === 1 || index === 3) { // owner and excess_receiver are addresses
                            decodedResult = web3.eth.abi.decodeParameter('address', result.returnData);
                        } else { // n_controllers and n_receivers are uint256
                            decodedResult = web3.eth.abi.decodeParameter('uint256', result.returnData);
                        }
                        element.textContent = decodedResult;
                        element.style.color = 'green';
                    } else {
                        element.textContent = `>>> Error fetching data`;
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
                    element.textContent = `>>> Error fetching data`;
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
        
        if (!inputElement || !outputElement) {
            console.warn(`Input or output element not found for ${method}`);
            return;
        }

        async function fetchData() {
            const input = inputElement.value.trim();
            
            if (input === '') {
                outputElement.textContent = 'Please enter a valid input';
                outputElement.style.color = 'red';
                return;
            }
            
            try {
                const result = await FeeSplitterContract.methods[method](input).call();
                if (method === 'receivers') {
                    // For receivers, only display address and weight
                    outputElement.textContent = JSON.stringify({
                        addr: result.addr,
                        weight: result.weight
                    });
                } else {
                    // For other methods, display the full result
                    outputElement.textContent = JSON.stringify(result);
                }
                outputElement.style.color = 'green';
            } catch (error) {
                console.error(`Error fetching ${method}:`, error);
                outputElement.textContent = `${error.message}`;
                outputElement.style.color = 'red';
            }
        }

        // Initial fetch
        fetchData();

        // Add event listener for input changes
        inputElement.addEventListener('input', fetchData);
    }

    // Set up input-based queries
    handleInputQuery('receiverIndex', 'receiverOutput', 'receivers');
    handleInputQuery('controllerIndex', 'controllerOutput', 'controllers');
    handleInputQuery('allowedControllerAddress', 'allowedControllerOutput', 'allowed_controllers');
});