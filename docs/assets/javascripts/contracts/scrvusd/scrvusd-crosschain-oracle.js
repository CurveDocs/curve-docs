document.addEventListener('DOMContentLoaded', async function() {
    const web3 = new Web3('https://optimism.llamarpc.com');

    const ScrvusdOracleAddress = '0xC772063cE3e622B458B706Dd2e36309418A1aE42';
    const ScrvusdOracleABI = [{"anonymous":false,"inputs":[{"indexed":false,"name":"new_price","type":"uint256"},{"indexed":false,"name":"at","type":"uint256"}],"name":"PriceUpdate","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"prover","type":"address"}],"name":"SetProver","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"previous_owner","type":"address"},{"indexed":true,"name":"new_owner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"inputs":[{"name":"new_owner","type":"address"}],"name":"transfer_ownership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"renounce_ownership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"owner","outputs":[{"name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"pricePerShare","outputs":[{"name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"name":"ts","type":"uint256"}],"name":"pricePerShare","outputs":[{"name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"pricePerAsset","outputs":[{"name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"name":"ts","type":"uint256"}],"name":"pricePerAsset","outputs":[{"name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"price_oracle","outputs":[{"name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"name":"i","type":"uint256"}],"name":"price_oracle","outputs":[{"name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"name":"_parameters","type":"uint256[8]"}],"name":"update_price","outputs":[{"name":"","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"name":"_max_acceleration","type":"uint256"}],"name":"set_max_acceleration","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"name":"_prover","type":"address"}],"name":"set_prover","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"version","outputs":[{"name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"prover","outputs":[{"name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"price","outputs":[{"components":[{"name":"previous","type":"uint256"},{"name":"future","type":"uint256"}],"name":"","type":"tuple"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"time","outputs":[{"components":[{"name":"previous","type":"uint256"},{"name":"future","type":"uint256"}],"name":"","type":"tuple"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"max_acceleration","outputs":[{"name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"name":"_initial_price","type":"uint256"},{"name":"_max_acceleration","type":"uint256"}],"outputs":[],"stateMutability":"nonpayable","type":"constructor"}];
    
    const BlockHashOracleAddress = '0x988d1037e9608B21050A8EFba0c6C45e01A3Bce7';
    const BlockHashOracleABI = [{"name":"CommitBlockHash","inputs":[{"name":"committer","type":"address","indexed":true},{"name":"number","type":"uint256","indexed":true},{"name":"hash","type":"bytes32","indexed":false}],"anonymous":false,"type":"event"},{"name":"ApplyBlockHash","inputs":[{"name":"number","type":"uint256","indexed":true},{"name":"hash","type":"bytes32","indexed":false}],"anonymous":false,"type":"event"},{"stateMutability":"view","type":"function","name":"get_block_hash","inputs":[{"name":"_number","type":"uint256"}],"outputs":[{"name":"","type":"bytes32"}]},{"stateMutability":"nonpayable","type":"function","name":"commit","inputs":[],"outputs":[{"name":"","type":"uint256"}]},{"stateMutability":"nonpayable","type":"function","name":"apply","inputs":[],"outputs":[{"name":"","type":"uint256"}]},{"stateMutability":"view","type":"function","name":"version","inputs":[],"outputs":[{"name":"","type":"string"}]},{"stateMutability":"view","type":"function","name":"block_hash","inputs":[{"name":"arg0","type":"uint256"}],"outputs":[{"name":"","type":"bytes32"}]},{"stateMutability":"view","type":"function","name":"commitments","inputs":[{"name":"arg0","type":"address"},{"name":"arg1","type":"uint256"}],"outputs":[{"name":"","type":"bytes32"}]}];
    
    const ProverAddress = '0x47ca04Ee05f167583122833abfb0f14aC5677Ee4';
    const ProverABI = [{"inputs":[{"internalType":"address","name":"_block_hash_oracle","type":"address"},{"internalType":"address","name":"_scrvusd_oracle","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[],"name":"BLOCK_HASH_ORACLE","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"SCRVUSD_ORACLE","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes","name":"_block_header_rlp","type":"bytes"},{"internalType":"bytes","name":"_proof_rlp","type":"bytes"}],"name":"prove","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"nonpayable","type":"function"}];

    const Multicall3Address = '0xcA11bde05977b3631167028862bE2a173976CA11';
    const Multicall3ABI = [{"inputs":[{"components":[{"internalType":"address","name":"target","type":"address"},{"internalType":"bytes","name":"callData","type":"bytes"}],"internalType":"struct Multicall3.Call[]","name":"calls","type":"tuple[]"}],"name":"aggregate","outputs":[{"internalType":"uint256","name":"blockNumber","type":"uint256"},{"internalType":"bytes[]","name":"returnData","type":"bytes[]"}],"stateMutability":"payable","type":"function"},{"inputs":[{"components":[{"internalType":"address","name":"target","type":"address"},{"internalType":"bool","name":"allowFailure","type":"bool"},{"internalType":"bytes","name":"callData","type":"bytes"}],"internalType":"struct Multicall3.Call3[]","name":"calls","type":"tuple[]"}],"name":"aggregate3","outputs":[{"components":[{"internalType":"bool","name":"success","type":"bool"},{"internalType":"bytes","name":"returnData","type":"bytes"}],"internalType":"struct Multicall3.Result[]","name":"returnData","type":"tuple[]"}],"stateMutability":"payable","type":"function"}];
    
    const ScrvusdOracleContract = new web3.eth.Contract(ScrvusdOracleABI, ScrvusdOracleAddress);
    const Multicall3Contract = new web3.eth.Contract(Multicall3ABI, Multicall3Address);
    
    async function updateValues() {
        const calls = [
            { target: ScrvusdOracleAddress, allowFailure: false, callData: web3.eth.abi.encodeFunctionSignature('price()') },
            { target: ScrvusdOracleAddress, allowFailure: false, callData: web3.eth.abi.encodeFunctionSignature('time()') },
            { target: ScrvusdOracleAddress, allowFailure: false, callData: web3.eth.abi.encodeFunctionSignature('price_oracle()') },
            { target: ScrvusdOracleAddress, allowFailure: false, callData: web3.eth.abi.encodeFunctionSignature('max_acceleration()') },
            { target: ScrvusdOracleAddress, allowFailure: false, callData: web3.eth.abi.encodeFunctionSignature('prover()') },
            { target: ScrvusdOracleAddress, allowFailure: false, callData: web3.eth.abi.encodeFunctionSignature('owner()') },
            { target: ScrvusdOracleAddress, allowFailure: false, callData: web3.eth.abi.encodeFunctionSignature('version()') },
            { target: ProverAddress, allowFailure: false, callData: web3.eth.abi.encodeFunctionSignature('BLOCK_HASH_ORACLE()') },
            { target: ProverAddress, allowFailure: false, callData: web3.eth.abi.encodeFunctionSignature('SCRVUSD_ORACLE()') },
        ];

        const elementIds = ['priceOutput', 'timeOutput', 'priceOracleOutput', 'maxAccelerationOutput', 'proverOutput', 'ownerOutput', 'versionOutput', 'blockHashOracleOutput', 'scrvusdOracleOutput'];

        try {
            const results = await Multicall3Contract.methods.aggregate3(calls).call();

            results.forEach((result, index) => {
                const element = document.getElementById(elementIds[index]);
                if (element) {
                    if (result.success) {
                        let decodedResult;
                        if (index === 0) { // price is uint256
                            decodedResult = web3.eth.abi.decodeParameter('uint256', result.returnData);
                            element.textContent = decodedResult;
                        } else if (index === 1) { // time is uint256
                            decodedResult = web3.eth.abi.decodeParameter('uint256', result.returnData);
                            element.textContent = decodedResult;
                        } else if (index === 2) { // price_oracle is uint256
                            decodedResult = web3.eth.abi.decodeParameter('uint256', result.returnData);
                            element.textContent = decodedResult;
                        } else if (index === 3) { // max_acceleration is uint256
                            decodedResult = web3.eth.abi.decodeParameter('uint256', result.returnData);
                            element.textContent = decodedResult;
                        } else if (index === 4) { // prover is address
                            decodedResult = web3.eth.abi.decodeParameter('address', result.returnData);
                            element.textContent = `'${decodedResult}'`;
                        } else if (index === 5) { // owner is address
                            decodedResult = web3.eth.abi.decodeParameter('address', result.returnData);
                            element.textContent = `'${decodedResult}'`;
                        } else if (index === 6) { // version is string
                            decodedResult = web3.eth.abi.decodeParameter('string', result.returnData);
                            element.textContent = decodedResult;
                        } else if (index === 7) { // blockHashOracle is address
                            decodedResult = web3.eth.abi.decodeParameter('address', result.returnData);
                            element.textContent = `'${decodedResult}'`;
                        } else if (index === 8) { // scrvusdOracle is address
                            decodedResult = web3.eth.abi.decodeParameter('address', result.returnData);
                            element.textContent = `'${decodedResult}'`;
                        }
                        element.style.color = 'green';
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
    async function handleInputQuery(inputId, outputId, method) {
        const inputElement = document.getElementById(inputId);
        const outputElement = document.getElementById(outputId);
        
        if (!inputElement || !outputElement) {
            console.error(`Required elements not found for ${method}`);
            return;
        }
        
        async function fetchData() {
            let input = inputElement.value.trim();
            
            // Set current timestamp as default if input is empty
            if (input === '') {
                let ts = Math.floor(Date.now() / 1000);
                input = ts.toString();
                inputElement.value = input;
            }
            
            try {
                const result = await ScrvusdOracleContract.methods[method](input).call();
                outputElement.textContent = result.toString();
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
    handleInputQuery('pricePerShareTimestamp', 'pricePerShareOutput', 'pricePerShare');
    handleInputQuery('pricePerAssetTimestamp', 'pricePerAssetOutput', 'pricePerAsset');
});