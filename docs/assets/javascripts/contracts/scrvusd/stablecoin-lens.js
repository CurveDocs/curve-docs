document.addEventListener('DOMContentLoaded', async function() {
    const web3 = new Web3('https://eth.llamarpc.com');
    const FeeSplitterAddress = '0xe24e2db9f6bb40bbe7c1c025bc87104f5401ecd7';

    const FeeSplitterABI = [{"inputs":[],"name":"circulating_supply","outputs":[{"name":"","type":"uint256"}],"stateMutability":"view","type":"function"}];
    
    const FeeSplitterContract = new web3.eth.Contract(FeeSplitterABI, FeeSplitterAddress);
    
    async function updateValues() {
        try {
            const result = await FeeSplitterContract.methods.circulating_supply().call();
            const element = document.getElementById('circulatingSupplyOutput'); // Make sure this ID exists in your HTML
            if (element) {
                element.textContent = result.toString();
                element.style.color = 'green';
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            const element = document.getElementById('circulatingSupplyOutput');
            if (element) {
                element.textContent = `>>> Error fetching data`;
                element.style.color = 'red';
            }
        }
    }

    // Call updateValues to fetch and display data
    updateValues();
});