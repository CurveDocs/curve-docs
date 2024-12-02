document.addEventListener('DOMContentLoaded', async function() {
    const web3 = new Web3('https://eth.llamarpc.com');
    const RootGaugeFactoryAddress = '0x306A45a1478A000dC701A6e1f7a569afb8D9DCD6';
    
    const RootGaugeFactoryABI = [{"name":"get_bridger","inputs":[{"name":"arg0","type":"uint256"}],"outputs":[{"name":"","type":"address"}],"stateMutability":"view","type":"function"}];
    
    const RootGaugeFactoryContract = new web3.eth.Contract(RootGaugeFactoryABI, RootGaugeFactoryAddress);

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
                const result = await RootGaugeFactoryContract.methods[method](input).call();
                outputElement.textContent = `'${result}'`;
                outputElement.style.color = 'green';
            } catch (error) {
                console.error(`Error fetching ${method}:`, error);
                outputElement.textContent = error.message;
                outputElement.style.color = 'red';
            }
        }

        // Initial fetch
        fetchData();

        // Add event listener for input changes
        inputElement.addEventListener('input', fetchData);
    }

    // Set up input-based query
    handleInputQuery('chainId', 'bridgerOutput', 'get_bridger');
});