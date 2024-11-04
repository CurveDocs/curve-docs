document.addEventListener('DOMContentLoaded', async function() {
    const web3 = new Web3('https://eth.llamarpc.com');
    const RewardsHandlerAddress = '0xe8d1e2531761406af1615a6764b0d5ff52736f56';
    const Multicall3Address = '0xcA11bde05977b3631167028862bE2a173976CA11';
 
    const RewardsHandlerABI = [{"anonymous":false,"inputs":[{"indexed":false,"name":"new_minimum_weight","type":"uint256"}],"name":"MinimumWeightUpdated","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"new_scaling_factor","type":"uint256"}],"name":"ScalingFactorUpdated","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"new_stablecoin_lens","type":"address"}],"name":"StablecoinLensUpdated","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"role","type":"bytes32"},{"indexed":true,"name":"account","type":"address"},{"indexed":true,"name":"sender","type":"address"}],"name":"RoleGranted","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"role","type":"bytes32"},{"indexed":true,"name":"account","type":"address"},{"indexed":true,"name":"sender","type":"address"}],"name":"RoleRevoked","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"new_window","type":"uint256"}],"name":"TWAWindowUpdated","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"new_dt_seconds","type":"uint256"}],"name":"SnapshotIntervalUpdated","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"role","type":"bytes32"},{"indexed":true,"name":"previousAdminRole","type":"bytes32"},{"indexed":true,"name":"newAdminRole","type":"bytes32"}],"name":"RoleAdminChanged","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"value","type":"uint256"},{"indexed":false,"name":"timestamp","type":"uint256"}],"name":"SnapshotTaken","type":"event"},{"inputs":[{"name":"role","type":"bytes32"},{"name":"account","type":"address"}],"name":"grantRole","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"name":"role","type":"bytes32"},{"name":"account","type":"address"}],"name":"revokeRole","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"name":"role","type":"bytes32"},{"name":"account","type":"address"}],"name":"renounceRole","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"name":"role","type":"bytes32"},{"name":"admin_role","type":"bytes32"}],"name":"set_role_admin","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"DEFAULT_ADMIN_ROLE","outputs":[{"name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[{"name":"arg0","type":"bytes32"},{"name":"arg1","type":"address"}],"name":"hasRole","outputs":[{"name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"name":"arg0","type":"bytes32"}],"name":"getRoleAdmin","outputs":[{"name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"compute_twa","outputs":[{"name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"name":"arg0","type":"uint256"}],"name":"snapshots","outputs":[{"components":[{"name":"tracked_value","type":"uint256"},{"name":"timestamp","type":"uint256"}],"name":"","type":"tuple"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"get_len_snapshots","outputs":[{"name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"twa_window","outputs":[{"name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"min_snapshot_dt_seconds","outputs":[{"name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"last_snapshot_timestamp","outputs":[{"name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"take_snapshot","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"process_rewards","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"name":"take_snapshot","type":"bool"}],"name":"process_rewards","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"name":"interface_id","type":"bytes4"}],"name":"supportsInterface","outputs":[{"name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"weight","outputs":[{"name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"name":"_min_snapshot_dt_seconds","type":"uint256"}],"name":"set_twa_snapshot_dt","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"name":"_twa_window","type":"uint256"}],"name":"set_twa_window","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"name":"new_distribution_time","type":"uint256"}],"name":"set_distribution_time","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"distribution_time","outputs":[{"name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"name":"new_minimum_weight","type":"uint256"}],"name":"set_minimum_weight","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"name":"new_scaling_factor","type":"uint256"}],"name":"set_scaling_factor","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"name":"_lens","type":"address"}],"name":"set_stablecoin_lens","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"name":"token","type":"address"},{"name":"receiver","type":"address"}],"name":"recover_erc20","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"RATE_MANAGER","outputs":[{"name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"RECOVERY_MANAGER","outputs":[{"name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"LENS_MANAGER","outputs":[{"name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"vault","outputs":[{"name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"stablecoin_lens","outputs":[{"name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"scaling_factor","outputs":[{"name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"minimum_weight","outputs":[{"name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"name":"_stablecoin","type":"address"},{"name":"_vault","type":"address"},{"name":"_lens","type":"address"},{"name":"minimum_weight","type":"uint256"},{"name":"scaling_factor","type":"uint256"},{"name":"admin","type":"address"}],"outputs":[],"stateMutability":"nonpayable","type":"constructor"}];

    const Multicall3ABI = [{"inputs":[{"components":[{"internalType":"address","name":"target","type":"address"},{"internalType":"bytes","name":"callData","type":"bytes"}],"internalType":"struct Multicall3.Call[]","name":"calls","type":"tuple[]"}],"name":"aggregate","outputs":[{"internalType":"uint256","name":"blockNumber","type":"uint256"},{"internalType":"bytes[]","name":"returnData","type":"bytes[]"}],"stateMutability":"payable","type":"function"},{"inputs":[{"components":[{"internalType":"address","name":"target","type":"address"},{"internalType":"bool","name":"allowFailure","type":"bool"},{"internalType":"bytes","name":"callData","type":"bytes"}],"internalType":"struct Multicall3.Call3[]","name":"calls","type":"tuple[]"}],"name":"aggregate3","outputs":[{"components":[{"internalType":"bool","name":"success","type":"bool"},{"internalType":"bytes","name":"returnData","type":"bytes"}],"internalType":"struct Multicall3.Result[]","name":"returnData","type":"tuple[]"}],"stateMutability":"payable","type":"function"}];
    
    const RewardsHandlerContract = new web3.eth.Contract(RewardsHandlerABI, RewardsHandlerAddress);
    const Multicall3Contract = new web3.eth.Contract(Multicall3ABI, Multicall3Address);
    
    async function updateValues() {
        const calls = [
            { target: RewardsHandlerAddress, allowFailure: false, callData: web3.eth.abi.encodeFunctionSignature('min_snapshot_dt_seconds()') },
            { target: RewardsHandlerAddress, allowFailure: false, callData: web3.eth.abi.encodeFunctionSignature('last_snapshot_timestamp()') },
            { target: RewardsHandlerAddress, allowFailure: false, callData: web3.eth.abi.encodeFunctionSignature('get_len_snapshots()') },
            { target: RewardsHandlerAddress, allowFailure: false, callData: web3.eth.abi.encodeFunctionSignature('compute_twa()') },
            { target: RewardsHandlerAddress, allowFailure: false, callData: web3.eth.abi.encodeFunctionSignature('twa_window()') },
            { target: RewardsHandlerAddress, allowFailure: false, callData: web3.eth.abi.encodeFunctionSignature('weight()') },
            { target: RewardsHandlerAddress, allowFailure: false, callData: web3.eth.abi.encodeFunctionSignature('minimum_weight()') },
            { target: RewardsHandlerAddress, allowFailure: false, callData: web3.eth.abi.encodeFunctionSignature('scaling_factor()') },
            { target: RewardsHandlerAddress, allowFailure: false, callData: web3.eth.abi.encodeFunctionSignature('distribution_time()') },
            { target: RewardsHandlerAddress, allowFailure: false, callData: web3.eth.abi.encodeFunctionSignature('vault()') },
            { target: RewardsHandlerAddress, allowFailure: false, callData: web3.eth.abi.encodeFunctionSignature('stablecoin_lens()') },
            { target: RewardsHandlerAddress, allowFailure: false, callData: web3.eth.abi.encodeFunctionSignature('DEFAULT_ADMIN_ROLE()') },
            { target: RewardsHandlerAddress, allowFailure: false, callData: web3.eth.abi.encodeFunctionSignature('RATE_MANAGER()') },
            { target: RewardsHandlerAddress, allowFailure: false, callData: web3.eth.abi.encodeFunctionSignature('RECOVERY_MANAGER()') },
            { target: RewardsHandlerAddress, allowFailure: false, callData: web3.eth.abi.encodeFunctionSignature('LENS_MANAGER()') }
        ];

        const elementIds = ['minSnapshotDtSecondsOutput', 'lastSnapshotTimestampOutput', 'lenSnapshotsOutput', 'computeTWAOutput', 
                           'twaWindowOutput', 'weightOutput', 'minimumWeightOutput', 'scalingFactorOutput', 'distributionTimeOutput', 
                           'vaultOutput', 'stablecoinLensOutput', 'defaultAdminRoleOutput', 'rateManagerOutput', 'recoveryManagerOutput', 
                           'lensManagerOutput'];

        try {
            const results = await Multicall3Contract.methods.aggregate3(calls).call();

            results.forEach((result, index) => {
                const element = document.getElementById(elementIds[index]);
                if (element) {
                    if (result.success) {
                        let decodedResult;
                        if (index === 9 || index === 10) { // vault and stablecoin_lens are addresses
                            decodedResult = web3.eth.abi.decodeParameter('address', result.returnData);
                            element.textContent = `'${decodedResult}'`;
                        } else if (index >= 11) { // role hashes are bytes32
                            decodedResult = web3.eth.abi.decodeParameter('bytes32', result.returnData);
                            element.textContent = `'${decodedResult}'`;
                        } else { // everything else is uint256
                            decodedResult = web3.eth.abi.decodeParameter('uint256', result.returnData);
                            element.textContent = decodedResult;
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
        
        // Check if both input elements exist before proceeding
        if (!inputElement || !outputElement) {
            console.error(`Required elements not found for ${method}`);
            return;
        }

        // For hasRole, we need a second input for the address
        const roleAddressInput = method === 'hasRole' ? document.getElementById('roleAddress') : null;
        if (method === 'hasRole' && !roleAddressInput) {
            console.error('Role address input element not found');
            outputElement.textContent = 'Configuration error: missing address input';
            outputElement.style.color = 'red';
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
                let result;
                if (method === 'hasRole') {
                    const roleAddress = roleAddressInput.value.trim();
                    if (!roleAddress) {
                        outputElement.textContent = 'Please enter a valid address';
                        outputElement.style.color = 'red';
                        return;
                    }
                    result = await RewardsHandlerContract.methods[method](input, roleAddress).call();
                } else {
                    result = await RewardsHandlerContract.methods[method](input).call();
                }
                
                let formattedResult;

                if (method === 'snapshots') {
                    formattedResult = `tracked_value: ${result.tracked_value}, timestamp: ${result.timestamp}`;
                    outputElement.style.color = 'green';
                } else if (method === 'supportsInterface') {
                    formattedResult = result.toString();
                    outputElement.style.color = result === true ? 'green' : 'red';
                } else {
                    formattedResult = result.toString();
                    outputElement.style.color = 'green';
                }

                outputElement.textContent = formattedResult;
            } catch (error) {
                console.error(`Error fetching ${method}:`, error);
                outputElement.textContent = `${error.message}`;
                outputElement.style.color = 'red';
            }
        }

        // Initial fetch
        fetchData();

        // Add event listeners for input changes
        inputElement.addEventListener('input', fetchData);
        if (method === 'hasRole' && roleAddressInput) {
            roleAddressInput.addEventListener('input', fetchData);
        }
    }

    // Set up input-based queries
    handleInputQuery('snapshotIndex', 'snapshotOutput', 'snapshots');
    handleInputQuery('supportedInterface', 'supportedInterfaceOutput', 'supportsInterface');
    handleInputQuery('role', 'roleOutput', 'hasRole');
    handleInputQuery('getRoleAdmin', 'getRoleAdminOutput', 'getRoleAdmin');
});