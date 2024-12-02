document.addEventListener('DOMContentLoaded', async function() {
    const web3 = new Web3('https://eth.llamarpc.com');
    const MinterAddress = '0xd061D61a4d941c39E5453435B6345Dc261C2fcE0';
    const Multicall3Address = '0xcA11bde05977b3631167028862bE2a173976CA11';

    const MinterABI = [{"name":"Minted","inputs":[{"type":"address","name":"recipient","indexed":true},{"type":"address","name":"gauge","indexed":false},{"type":"uint256","name":"minted","indexed":false}],"anonymous":false,"type":"event"},{"outputs":[],"inputs":[{"type":"address","name":"_token"},{"type":"address","name":"_controller"}],"stateMutability":"nonpayable","type":"constructor"},{"name":"mint","outputs":[],"inputs":[{"type":"address","name":"gauge_addr"}],"stateMutability":"nonpayable","type":"function","gas":100038},{"name":"mint_many","outputs":[],"inputs":[{"type":"address[8]","name":"gauge_addrs"}],"stateMutability":"nonpayable","type":"function","gas":408502},{"name":"mint_for","outputs":[],"inputs":[{"type":"address","name":"gauge_addr"},{"type":"address","name":"_for"}],"stateMutability":"nonpayable","type":"function","gas":101219},{"name":"toggle_approve_mint","outputs":[],"inputs":[{"type":"address","name":"minting_user"}],"stateMutability":"nonpayable","type":"function","gas":36726},{"name":"token","outputs":[{"type":"address","name":""}],"inputs":[],"stateMutability":"view","type":"function","gas":1301},{"name":"controller","outputs":[{"type":"address","name":""}],"inputs":[],"stateMutability":"view","type":"function","gas":1331},{"name":"minted","outputs":[{"type":"uint256","name":""}],"inputs":[{"type":"address","name":"arg0"},{"type":"address","name":"arg1"}],"stateMutability":"view","type":"function","gas":1669},{"name":"allowed_to_mint_for","outputs":[{"type":"bool","name":""}],"inputs":[{"type":"address","name":"arg0"},{"type":"address","name":"arg1"}],"stateMutability":"view","type":"function","gas":1699}];

    const Multicall3ABI = [{"inputs":[{"components":[{"internalType":"address","name":"target","type":"address"},{"internalType":"bytes","name":"callData","type":"bytes"}],"internalType":"struct Multicall3.Call[]","name":"calls","type":"tuple[]"}],"name":"aggregate","outputs":[{"internalType":"uint256","name":"blockNumber","type":"uint256"},{"internalType":"bytes[]","name":"returnData","type":"bytes[]"}],"stateMutability":"payable","type":"function"},{"inputs":[{"components":[{"internalType":"address","name":"target","type":"address"},{"internalType":"bool","name":"allowFailure","type":"bool"},{"internalType":"bytes","name":"callData","type":"bytes"}],"internalType":"struct Multicall3.Call3[]","name":"calls","type":"tuple[]"}],"name":"aggregate3","outputs":[{"components":[{"internalType":"bool","name":"success","type":"bool"},{"internalType":"bytes","name":"returnData","type":"bytes"}],"internalType":"struct Multicall3.Result[]","name":"returnData","type":"tuple[]"}],"stateMutability":"payable","type":"function"}];
    
    const MinterContract = new web3.eth.Contract(MinterABI, MinterAddress);
    const Multicall3Contract = new web3.eth.Contract(Multicall3ABI, Multicall3Address);
    
    async function updateValues() {
        const calls = [
            { target: MinterAddress, allowFailure: false, callData: web3.eth.abi.encodeFunctionSignature('token()') },
            { target: MinterAddress, allowFailure: false, callData: web3.eth.abi.encodeFunctionSignature('controller()') },
        ];

        const elementIds = ['tokenOutput', 'controllerOutput'];

        try {
            const results = await Multicall3Contract.methods.aggregate3(calls).call();

            results.forEach((result, index) => {
                const element = document.getElementById(elementIds[index]);
                if (element) {
                    if (result.success) {
                        let decodedResult;
                        try {
                            // Handle different types of results
                            if (index === 0 || index === 1) { // addresses
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
                    result = await MinterContract.methods[method](input, input2).call();
                } else {
                    result = await MinterContract.methods[method](input).call();
                }

                let formattedResult;
                if (typeof result === 'object') {
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
    handleInputQuery('mintedInput1', 'mintedOutput', 'minted', 'mintedInput2');
    handleInputQuery('allowedToMintForInput1', 'allowedToMintForOutput', 'allowed_to_mint_for', 'allowedToMintForInput2');
});
