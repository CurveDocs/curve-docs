---
hide:
  - toc
---

!!!info "Full deployment JSON"
    The full json file with all deployment across all chains can be found here: [:material-github: GitHub](https://github.com/CurveDocs/curve-docs/blob/master/docs/deployments/deployment-data.json).

    If a contract address is missing or wrong or something else is off, please feel free to create an [Issue](https://github.com/CurveDocs/curve-docs/issues).

<div class="filter-container">
          <div class="filter-group">
          <label for="chain-filter">Chain:</label>
          <div class="multi-select-container">
            <button type="button" class="multi-select-toggle" onclick="toggleMultiSelect('chain')">
              <span id="chain-display">All Chains</span>
              <span class="arrow">▼</span>
            </button>
            <div class="multi-select-dropdown" id="chain-dropdown" style="display: none;">
                          <div class="multi-select-header">
              <div class="select-all-buttons">
                <button type="button" class="select-all-btn" onclick="selectAllChains()">Tick All</button>
                <button type="button" class="select-all-btn" onclick="deselectAllChains()">Clear</button>
              </div>
            </div>
              <div class="multi-select-options" id="chain-options">
                <!-- Chain options will be populated here -->
              </div>
            </div>
          </div>
        </div>
        
        <div class="filter-group">
          <label for="deployment-filter">Deployment Type:</label>
          <div class="multi-select-container">
            <button type="button" class="multi-select-toggle" onclick="toggleMultiSelect('deployment')">
              <span id="deployment-display">All Types</span>
              <span class="arrow">▼</span>
            </button>
            <div class="multi-select-dropdown" id="deployment-dropdown" style="display: none;">
                          <div class="multi-select-header">
              <div class="select-all-buttons">
                <button type="button" class="select-all-btn" onclick="selectAllDeployments()">Tick All</button>
                <button type="button" class="select-all-btn" onclick="deselectAllDeployments()">Clear</button>
              </div>
            </div>
              <div class="multi-select-options" id="deployment-options">
                <!-- Deployment options will be populated here -->
              </div>
            </div>
          </div>
        </div>
        
        <div class="filter-group" id="sub-filter-container" style="display: none;">
          <label for="sub-filter">Sub Type:</label>
          <div class="multi-select-container">
            <button type="button" class="multi-select-toggle" onclick="toggleMultiSelect('sub')">
              <span id="sub-display">All Sub Types</span>
              <span class="arrow">▼</span>
            </button>
            <div class="multi-select-dropdown" id="sub-dropdown" style="display: none;">
                          <div class="multi-select-header">
              <div class="select-all-buttons">
                <button type="button" class="select-all-btn" onclick="selectAllSubs()">Tick All</button>
                <button type="button" class="select-all-btn" onclick="deselectAllSubs()">Clear</button>
              </div>
            </div>
              <div class="multi-select-options" id="sub-options">
                <!-- Sub options will be populated here -->
              </div>
            </div>
          </div>
        </div>
  
  <div class="filter-group">
    <label for="search-filter">Search:</label>
    <input type="text" id="search-filter" placeholder="Search addresses, contract names...">
  </div>
</div>



<div class="table-container">
  <table id="addresses-table">
    <thead>
      <tr>
        <th>Chain</th>
        <th>Deployment Type</th>
        <th id="sub-type-header" style="display: none;">Sub Type</th>
        <th>Contract</th>
        <th>Address</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody id="addresses-tbody">
    </tbody>
  </table>
</div>

<style>
.page-header {
  background: #f8f9fa;
  color: #212529;
  padding: 32px;
  border-radius: 12px;
  margin-bottom: 32px;
  border: 1px solid #e9ecef;
}

.header-content h1 {
  margin: 0 0 12px 0;
  font-size: 28px;
  font-weight: 600;
  color: #212529;
}

.header-content p {
  margin: 0;
  font-size: 16px;
  color: #6c757d;
  line-height: 1.5;
}

@media (max-width: 768px) {
  .page-header {
    padding: 24px;
  }
  
  .header-content h1 {
    font-size: 24px;
  }
  
  .header-content p {
    font-size: 14px;
  }
}
.filter-container {
  display: flex;
  gap: 24px;
  margin-bottom: 24px;
  flex-wrap: wrap;
  background: #ffffff;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  border: 1px solid #e9ecef;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
  min-width: 200px;
  position: relative;
}

.filter-group label {
  font-weight: 600;
  font-size: 13px;
  color: #495057;
  margin-bottom: 4px;
}

.filter-group select,
.filter-group input {
  padding: 12px 16px;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  font-size: 14px;
  min-width: 200px;
  background: white;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

/* Override min-width for checkboxes in multi-select */
.multi-select-option input[type="checkbox"] {
  min-width: auto !important;
  width: 14px !important;
  height: 14px !important;
  margin: 0 !important;
  padding: 0 !important;
  flex-shrink: 0 !important;
  border: 1px solid #ccc !important;
}

.filter-group select:focus,
.filter-group input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
}

/* Multi-select styles */
.multi-select-container {
  position: relative;
  min-width: 200px;
  z-index: 1000;
}

.multi-select-toggle {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  background: white;
  text-align: left;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.multi-select-toggle:hover {
  border-color: #007bff;
}

.multi-select-toggle:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
}

.arrow {
  transition: transform 0.2s ease;
}

.multi-select-toggle.active .arrow {
  transform: rotate(180deg);
}

.multi-select-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  box-shadow: 0 8px 25px rgba(0,0,0,0.15);
  z-index: 99999;
  max-height: 200px;
  overflow-y: auto;
  margin-top: 4px;
  backdrop-filter: blur(10px);
  border: 1px solid #dee2e6;
}

.multi-select-header {
  padding: 4px 6px;
  border-bottom: 1px solid #e9ecef;
  background: #f8f9fa;
  font-weight: 600;
  font-size: 11px;
}

.select-all-buttons {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.select-all-btn {
  padding: 4px 8px;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  background: white;
  color: #495057;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.select-all-btn:hover {
  background: #f8f9fa;
  border-color: #adb5bd;
}

.multi-select-options {
  max-height: 150px;
  overflow-y: auto;
}

.multi-select-option {
  padding: 4px 8px;
  cursor: pointer;
  display: block;
  border-bottom: 1px solid #f1f3f4;
}

.multi-select-option:hover {
  background: #f8f9fa;
}

.multi-select-option:last-child {
  border-bottom: none;
}

.multi-select-option label {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  margin: 0;
  width: auto;
  font-size: 12px;
  padding: 0;
}

.multi-select-option input[type="checkbox"] {
  margin: 0;
  width: 8px;
  height: 8px;
  flex-shrink: 0;
  padding: 0;
  border: 1px solid #ccc;
}

.controls {
  margin-bottom: 24px;
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  background: #ffffff;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  border: 1px solid #e9ecef;
}

.controls button {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  min-width: 120px;
}

#verify-addresses {
  background: #007bff;
  color: white;
}

#verify-addresses:hover {
  background: #0056b3;
}

#verify-addresses.loading {
  background: #6c757d;
  cursor: not-allowed;
}

#export-csv {
  background: #28a745;
  color: white;
}

#export-csv:hover {
  background: #1e7e34;
}

#clear-filters {
  background: #6c757d;
  color: white;
}

#clear-filters:hover {
  background: #545b62;
}

.stats {
  margin-bottom: 24px;
  font-size: 14px;
  color: #495057;
  background: #f8f9fa;
  padding: 16px 20px;
  border-radius: 8px;
  border: 1px solid #e9ecef;
  font-weight: 500;
}

.stats span {
  margin-right: 16px;
  padding: 4px 8px;
  background: #ffffff;
  border-radius: 4px;
  font-weight: 600;
  border: 1px solid #dee2e6;
}

.table-container {
  overflow-x: auto;
  width: 100%;
  max-width: 100%;
  margin: 0;
  padding: 0;
  position: relative;
  z-index: 1;
}

table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 15px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  background: white;
  table-layout: fixed;
  margin: 0;
  padding: 0;
  border: 1px solid #e9ecef;
}

th, td {
  padding: 12px 16px;
  text-align: left;
  border: 1px solid #e9ecef;
  vertical-align: middle;
}

/* Column width distribution - larger table */
th:nth-child(1), td:nth-child(1) { width: 10%; min-width: 120px; } /* Chain */
th:nth-child(2), td:nth-child(2) { width: 12%; min-width: 140px; } /* Deployment Type */
th:nth-child(3), td:nth-child(3) { width: 10%; min-width: 120px; } /* Sub Type */
th:nth-child(4), td:nth-child(4) { width: 15%; min-width: 160px; } /* Contract Name */
th:nth-child(5), td:nth-child(5) { width: 35%; min-width: 320px; } /* Address */
th:nth-child(6), td:nth-child(6) { 
  width: 10%; 
  min-width: 100px; 
  text-align: center !important;
} /* Actions */

/* Specific alignment for Actions column */
th:nth-child(6) {
  text-align: center !important;
}

td:nth-child(6) {
  text-align: center !important;
  background: transparent !important;
  background-color: transparent !important;
}

/* Fix table borders for clean appearance */
th:last-child, td:last-child {
  border-right: 1px solid #e9ecef !important;
}

th:first-child, td:first-child {
  border-left: 1px solid #e9ecef !important;
}

th {
  background: #f8f9fa;
  color: #495057;
  font-weight: 600;
  font-size: 13px;
  border-bottom: 2px solid #dee2e6;
  border-top: 1px solid #e9ecef;
  border-left: 1px solid #e9ecef;
  border-right: 1px solid #e9ecef;
}

td {
  border-bottom: 1px solid #e9ecef;
  border-left: 1px solid #e9ecef;
  border-right: 1px solid #e9ecef;
}

tr:hover {
  background: #f8f9fa;
  transition: background-color 0.2s ease;
}

tr:nth-child(even) {
  background-color: #fafbfc;
}

tr:nth-child(even):hover {
  background: #f8f9fa;
}

.address-cell {
  font-family: monospace;
  font-size: 13px;
  word-break: break-all;
  max-width: 500px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  position: relative;
}

/* Removed hover effect for addresses */



.action-buttons {
  display: flex;
  gap: 4px;
  flex-wrap: nowrap;
  justify-content: center;
  align-items: center;
  width: 100%;
  text-align: center;
  background: transparent !important;
}

.action-buttons button {
  padding: 4px 8px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 10px;
  font-weight: 500;
  transition: all 0.2s ease;
  box-shadow: 0 1px 2px rgba(0,0,0,0.1);
  min-width: 50px;
}

.copy-btn {
  background: transparent !important;
  color: #495057 !important;
  border: none !important;
  font-size: 16px !important;
  cursor: pointer !important;
  padding: 0 !important;
  margin: 0 !important;
  box-shadow: none !important;
  outline: none !important;
  border-radius: 0 !important;
  min-width: auto !important;
  font-weight: normal !important;
  transition: none !important;
  display: inline !important;
  line-height: 1 !important;
  background-color: transparent !important;
  background-image: none !important;
}

.copy-btn:hover {
  color: #007bff !important;
}



.spinner {
  display: inline-block;
  width: 12px;
  height: 12px;
  border: 2px solid #ffffff;
  border-radius: 50%;
  border-top-color: transparent;
  animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.chain-icon {
  border-radius: 4px;
}

.chain-cell {
  min-width: 120px;
}

@media (max-width: 768px) {
  .filter-container {
    flex-direction: column;
  }
  
  .controls {
    flex-direction: column;
  }
  
  .table-container {
    font-size: 12px;
  }
  
  th, td {
    padding: 8px 6px;
  }
  
  .chain-cell {
    min-width: 100px;
  }
  
  .chain-icon {
    width: 16px !important;
    height: 16px !important;
  }
}
</style>

<script>
// Load deployment data from JSON file
let deploymentData = {};
let filteredData = [];
let verificationResults = {};

// Display name mappings for cleaner UI
const deploymentTypeNames = {
  'amm': 'AMM',
  'dao': 'DAO',
  'x-dao': 'x-dao',
  'x-gov': 'x-gov',
  'core': 'Core Contracts',
  'tokens': 'Ecosystem Tokens',
  'fees': 'Fees & Burners',
  'integrations': 'Integrations',
  'crvusd': 'crvUSD',
  'scrvusd': 'scrvUSD',
  'router': 'Router & Zap',
  'lending': 'Lending',
  'gauges': 'Gauges',
  'factory': 'Factory',
  'registry': 'Registry',
  'curve-block-oracle': 'curve-block-oracle',
  'vecrv': 'Crosschain veCRV',
  'llamalend': 'LlamaLend'
};

// Contract name mappings for cleaner display
const contractNameMappings = {
  'gauge-controller': 'Gauge Controller',
  'minter': 'Minter',
  'community-fund': 'Community Fund',
  'treasury': 'Treasury',
  'voting-ownership': 'Voting Ownership',
  'voting-parameter': 'Voting Parameter',
  'agent-ownership': 'Agent Ownership',
  'agent-parameter': 'Agent Parameter',
  'emergency-dao': 'Emergency DAO',
  'l1-broadcaster': 'L1 Broadcaster',
  'l2-relayer': 'L2 Relayer',
  'ownership-agent': 'Ownership Agent',
  'parameter-agent': 'Parameter Agent',
  'emergency-agent': 'Emergency Agent',
  'vault': 'Vault',
  'keepers': 'Keepers',
  'crv-bridges': 'CRV Bridges',
  'crvusd-bridges': 'crvUSD Bridges',
  'scrvusd-bridges': 'scrvUSD Bridges',
  'block-oracle': 'Block Oracle',
  'header-verifier': 'Header Verifier',
  'lz-block-relay': 'LZ Block Relay',
  'root-gauge-factory': 'Root Gauge Factory',
  'child-gauge-factory': 'Child Gauge Factory',
  'fee-receiver': 'Fee Receiver',
  'address-provider': 'Address Provider',
  'meta-registry': 'Meta Registry',
  'rate-provider': 'Rate Provider',
  'stableswap': 'Stableswap',
  'twocrypto': 'Twocrypto',
  'tricrypto': 'Tricrypto',
  'router & zap': 'Router & Zaps',
  'math': 'Math',
  'views': 'Views',
  'factory': 'Factory',
  'plain-amm-implementation': 'Plain AMM Implementation',
  'meta-amm-implementation': 'Meta AMM Implementation',
  'amm-implementation': 'AMM Implementation',
  'amm-native-disable-implementation': 'AMM Native Disable',
  'amm-native-enable-implementationd': 'AMM Native Enable',
  'router': 'Router',
  'stable-calc-zap': 'StableCalc Zap',
  'crypto-calc-zap': 'CryptoCalc Zap',
  'deposit-and-stake-zap': 'Deposit & Stake Zap',
  'meta-zap-ng': 'MetaZap NG',
  'crv': 'CRV',
  'vecrv': 'veCRV',
  'crvUSD': 'crvUSD',
  'scrvUSD': 'scrvUSD',
  'one-way-lending-factory': 'One-Way Lending Factory',
  'controller-implementation': 'Controller Implementation',
  'vault-implementation': 'Vault Implementation',
  'gauge': 'Gauge Implementation',
  'amm': 'AMM Implementation',
  'plain-amm': 'Plain AMM Implementation',
  'meta-amm': 'Meta AMM Implementation',
  'plain-amm-implementation': 'Plain AMM Implementation',
  'meta-amm-implementation': 'Meta AMM Implementation',
  'gauge-implementation': 'Gauge Implementation',
  'pool-price-oracle-implementation': 'Pool Price Oracle Implementation',
  'monetary-policy-implementation': 'Monetary Policy Implementation',
  'rewards-handler': 'Rewards Handler',
  'stablecoin-lens': 'Stablecoin Lens',
  'crv-bridge': 'CRV Bridge',
  'crvusd-bridge': 'crvUSD Bridge',
  'scrvusd-bridge': 'scrvUSD Bridge',
  'block-hash-oracle': 'Block Hash Oracle',
  'crv-minter': 'CRV Minter',
  'crvusd-minter': 'crvUSD Minter',
  'scrvusd-minter': 'scrvUSD Minter',
  'gauge-type-oracle': 'Gauge Type Oracle',
  'gauge-type-prover': 'Gauge Type Prover',
  'message-digest-prover': 'Message Digest Prover',
  'oracle': 'Oracle',
  'verifier': 'Verifier',
  'delegation-verifier': 'Delegation Verifier',
  'llamalend-leverage-zap': 'LlamaLend Leverage Zap',
  'keepers': 'Keepers',
  'crv-bridges': 'CRV Bridges',
  'crvusd-bridges': 'crvUSD Bridges',
  'scrvusd-bridges': 'scrvUSD Bridges',
  'fee-collector': 'Fee Collector',
  'hooker': 'Hooker',
  'cowswap-burner': 'CowSwap Burner',
  'fee-distributor-crvusd': 'Fee Distributor crvUSD',
  'fee-distributor-3crv': 'Fee Distributor 3CRV',
  'fee-splitter': 'Fee Splitter',
  'crv-circulating-supply': 'CRV Circulating Supply',
  'stableswap.math': 'Stableswap Math',
  'stableswap.views': 'Stableswap Views',
  'stableswap.factory': 'Stableswap Factory',
  'stableswap.plain-amm': 'Plain AMM Implementation',
  'stableswap.meta-amm': 'Meta AMM Implementation',
  'stableswap.plain-amm-implementation': 'Plain AMM Implementation',
  'stableswap.meta-amm-implementation': 'Meta AMM Implementation',
  'twocrypto.math': 'Twocrypto Math',
  'twocrypto.views': 'Twocrypto Views',
  'twocrypto.factory': 'Twocrypto Factory',
  'twocrypto.plain-amm': 'Plain AMM Implementation',
  'twocrypto.meta-amm': 'Meta AMM Implementation',
  'twocrypto.plain-amm-implementation': 'Plain AMM Implementation',
  'twocrypto.meta-amm-implementation': 'Meta AMM Implementation',
  'tricrypto.math': 'Tricrypto Math',
  'tricrypto.views': 'Tricrypto Views',
  'tricrypto.factory': 'Tricrypto Factory',
  'tricrypto.plain-amm': 'Plain AMM Implementation',
  'tricrypto.meta-amm': 'Meta AMM Implementation',
  'tricrypto.plain-amm-implementation': 'Plain AMM Implementation',
  'tricrypto.meta-amm-implementation': 'Meta AMM Implementation',
  'router & zap.router': 'Router',
  'router & zap.stable-calc-zap': 'StableCalc',
  'router & zap.crypto-calc-zap': 'CryptoCalc',
  'router & zap.deposit-and-stake-zap': 'Deposit & Stake Zap',
  'router & zap.meta-zap-ng': 'MetaZap NG'
  };
  
  // Chain display name mapping
  const chainDisplayNames = {
    ethereum: 'Ethereum',
    arbitrum: 'Arbitrum',
    optimism: 'Optimism',
    base: 'Base',
    polygon: 'Polygon',
    gnosis: 'Gnosis',
    avalanche: 'Avalanche',
    fantom: 'Fantom',
    mantle: 'Mantle',
    zksync: 'zkSync',
    sonic: 'Sonic',
    taiko: 'Taiko',
    corn: 'Corn',
    ink: 'Ink',
    xlayer: 'X-Layer',
    kava: 'Kava',
    aurora: 'Aurora',
    celo: 'Celo',
    linea: 'Linea',
    scroll: 'Scroll',
    fraxtal: 'Fraxtal',
    hyperliquid: 'Hyperliquid',
    plume: 'Plume',
    xdc: 'XDC',
    etherlink: 'Etherlink',
    moonbeam: 'Moonbeam',
    tac: 'TAC',
    bsc: 'BSC'
  };
  

  
  // Chain configuration for explorers and RPCs
const chainConfig = {
  ethereum: {
    explorer: 'https://etherscan.io/address/',
    rpc: 'https://eth.llamarpc.com'
  },
  arbitrum: {
    explorer: 'https://arbiscan.io/address/',
    rpc: 'https://arb1.arbitrum.io/rpc'
  },
  optimism: {
    explorer: 'https://optimistic.etherscan.io/address/',
    rpc: 'https://mainnet.optimism.io'
  },
  base: {
    explorer: 'https://basescan.org/address/',
    rpc: 'https://mainnet.base.org'
  },
  polygon: {
    explorer: 'https://polygonscan.com/address/',
    rpc: 'https://polygon-rpc.com'
  },
  gnosis: {
    explorer: 'https://gnosisscan.io/address/',
    rpc: 'https://rpc.gnosischain.com'
  },
  avalanche: {
    explorer: 'https://snowscan.xyz/address/',
    rpc: 'https://api.avax.network/ext/bc/C/rpc'
  },
  fantom: {
    explorer: 'https://explorer.fantom.network/address/',
    rpc: 'https://rpc.ftm.tools'
  },
  bsc: {
    explorer: 'https://bscscan.com/address/',
    rpc: 'https://bsc-dataseed.binance.org'
  },
  mantle: {
    explorer: 'https://mantlescan.xyz/address/',
    rpc: 'https://rpc.mantle.xyz'
  },
  fraxtal: {
    explorer: 'https://fraxscan.com/address/',
    rpc: 'https://rpc.frax.com'
  },
  sonic: {
    explorer: 'https://sonicscan.org/address/',
    rpc: 'https://mainnet.sonic.game'
  },
  taiko: {
    explorer: 'https://taikoscan.io/address/',
    rpc: 'https://rpc.katla.taiko.xyz'
  },
  corn: {
    explorer: 'https://cornscan.io/address/',
    rpc: 'https://rpc.corn.xyz'
  },
  ink: {
    explorer: 'https://explorer.inkonchain.com//address/',
    rpc: 'https://rpc.ink.xyz'
  },
  xlayer: {
    explorer: 'https://www.oklink.com/x-layer/address/',
    rpc: 'https://rpc.xlayer.xyz'
  }
};

// Fetch deployment data from the JSON file
async function loadDeploymentData() {
  try {
    console.log('Attempting to load deployment data...');
    const response = await fetch('./deployment-data.json');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    deploymentData = await response.json();
    console.log('Successfully loaded deployment data:', Object.keys(deploymentData).length, 'chains');
    populateFilters();
    filterData();
  } catch (error) {
    console.error('Error loading deployment data:', error);
    console.log('Attempting to load fallback data...');
    
    // Fallback: try to load from a different path
    try {
      const fallbackResponse = await fetch('../deployment-data.json');
      if (fallbackResponse.ok) {
        deploymentData = await fallbackResponse.json();
        console.log('Successfully loaded fallback deployment data');
        populateFilters();
        filterData();
      } else {
        throw new Error('Fallback also failed');
      }
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError);
      // Use empty structure as last resort
      deploymentData = {};
      populateFilters();
      filterData();
    }
  }
}

// Global variables for selected filters
let selectedChains = new Set();
let selectedDeployments = new Set();
let selectedSubs = new Set();

// Populate filter dropdowns
function populateFilters() {
  const chainOptions = document.getElementById('chain-options');
  const deploymentOptions = document.getElementById('deployment-options');
  
  // Clear existing options
  chainOptions.innerHTML = '';
  deploymentOptions.innerHTML = '';
  
  const chains = new Set();
  const deploymentTypes = new Set();
  
  console.log('Populating filters with deployment data:', deploymentData);
  console.log('Number of chains:', Object.keys(deploymentData).length);
  
  Object.keys(deploymentData).forEach(chain => {
    chains.add(chain);
    console.log('Processing chain:', chain);
    
    Object.keys(deploymentData[chain]).forEach(deploymentType => {
      deploymentTypes.add(deploymentType);
      console.log('Found deployment type:', deploymentType, 'for chain:', chain);
    });
  });
  
  console.log('Total unique chains found:', chains.size);
  console.log('Total unique deployment types found:', deploymentTypes.size);
  
  // Add chain options
  Array.from(chains).sort().forEach(chain => {
    const optionDiv = document.createElement('div');
    optionDiv.className = 'multi-select-option';
    
    const label = document.createElement('label');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.value = chain;
    checkbox.onchange = () => updateChainSelection(chain, checkbox.checked);
    
    label.appendChild(checkbox);
    
    const text = document.createElement('span');
    text.textContent = chainDisplayNames[chain] || chain.charAt(0).toUpperCase() + chain.slice(1);
    
    label.appendChild(text);
    optionDiv.appendChild(label);
    chainOptions.appendChild(optionDiv);
  });
  
  // Add deployment type options
  Array.from(deploymentTypes).sort().forEach(type => {
    const optionDiv = document.createElement('div');
    optionDiv.className = 'multi-select-option';
    
    const label = document.createElement('label');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.value = type;
    checkbox.onchange = () => updateDeploymentSelection(type, checkbox.checked);
    
    const text = document.createElement('span');
    text.textContent = deploymentTypeNames[type] || type.charAt(0).toUpperCase() + type.slice(1);
    
    label.appendChild(checkbox);
    label.appendChild(text);
    optionDiv.appendChild(label);
    deploymentOptions.appendChild(optionDiv);
  });
  
  console.log('Filters populated. Chain options:', chainOptions.children.length, 'Deployment type options:', deploymentOptions.children.length);
}

// Toggle multi-select dropdowns
function toggleMultiSelect(type) {
  const dropdown = document.getElementById(`${type}-dropdown`);
  const toggle = document.querySelector(`[onclick="toggleMultiSelect('${type}')"]`);
  const isVisible = dropdown.style.display !== 'none';
  
  // Close all dropdowns first
  document.querySelectorAll('.multi-select-dropdown').forEach(d => d.style.display = 'none');
  document.querySelectorAll('.multi-select-toggle').forEach(t => t.classList.remove('active'));
  
  // Toggle the clicked dropdown
  if (!isVisible) {
    dropdown.style.display = 'block';
    toggle.classList.add('active');
  }
}

// Update chain selection
function updateChainSelection(chain, checked) {
  if (checked) {
    selectedChains.add(chain);
  } else {
    selectedChains.delete(chain);
  }
  updateChainDisplay();
  filterData();
}

// Update deployment selection
function updateDeploymentSelection(deployment, checked) {
  if (checked) {
    selectedDeployments.add(deployment);
  } else {
    selectedDeployments.delete(deployment);
  }
  updateDeploymentDisplay();
  updateSubFilter();
  filterData();
}

// Update sub selection
function updateSubSelection(sub, checked) {
  if (checked) {
    selectedSubs.add(sub);
  } else {
    selectedSubs.delete(sub);
  }
  updateSubDisplay();
  filterData();
}

// Update display text for filters
function updateChainDisplay() {
  const display = document.getElementById('chain-display');
  if (selectedChains.size === 0) {
    display.textContent = 'All Chains';
  } else if (selectedChains.size === 1) {
    const chain = Array.from(selectedChains)[0];
    display.textContent = chain.charAt(0).toUpperCase() + chain.slice(1);
  } else {
    display.textContent = `${selectedChains.size} Chains Selected`;
  }
}

function updateDeploymentDisplay() {
  const display = document.getElementById('deployment-display');
  if (selectedDeployments.size === 0) {
    display.textContent = 'All Types';
  } else if (selectedDeployments.size === 1) {
    const deployment = Array.from(selectedDeployments)[0];
    display.textContent = deploymentTypeNames[deployment] || deployment.charAt(0).toUpperCase() + deployment.slice(1);
  } else {
    display.textContent = `${selectedDeployments.size} Types Selected`;
  }
}

function updateSubDisplay() {
  const display = document.getElementById('sub-display');
  if (selectedSubs.size === 0) {
    display.textContent = 'All Sub Types';
  } else if (selectedSubs.size === 1) {
    const sub = Array.from(selectedSubs)[0];
    display.textContent = contractNameMappings[sub] || sub.charAt(0).toUpperCase() + sub.slice(1);
  } else {
    display.textContent = `${selectedSubs.size} Sub Types Selected`;
  }
}

// Select all functions
function selectAllChains() {
  const checkboxes = document.querySelectorAll('#chain-options input[type="checkbox"]');
  checkboxes.forEach(checkbox => {
    checkbox.checked = true;
    updateChainSelection(checkbox.value, true);
  });
}

function deselectAllChains() {
  const checkboxes = document.querySelectorAll('#chain-options input[type="checkbox"]');
  checkboxes.forEach(checkbox => {
    checkbox.checked = false;
    updateChainSelection(checkbox.value, false);
  });
}

function selectAllDeployments() {
  const checkboxes = document.querySelectorAll('#deployment-options input[type="checkbox"]');
  checkboxes.forEach(checkbox => {
    checkbox.checked = true;
    updateDeploymentSelection(checkbox.value, true);
  });
}

function deselectAllDeployments() {
  const checkboxes = document.querySelectorAll('#deployment-options input[type="checkbox"]');
  checkboxes.forEach(checkbox => {
    checkbox.checked = false;
    updateDeploymentSelection(checkbox.value, false);
  });
}

function selectAllSubs() {
  const checkboxes = document.querySelectorAll('#sub-options input[type="checkbox"]');
  checkboxes.forEach(checkbox => {
    checkbox.checked = true;
    updateSubSelection(checkbox.value, true);
  });
}

function deselectAllSubs() {
  const checkboxes = document.querySelectorAll('#sub-options input[type="checkbox"]');
  checkboxes.forEach(checkbox => {
    checkbox.checked = false;
    updateSubSelection(checkbox.value, false);
  });
}

// Filter data based on current filters
function filterData() {
  const searchFilter = document.getElementById('search-filter').value.toLowerCase();
  
  filteredData = [];
  
  Object.keys(deploymentData).forEach(chain => {
    // Check chain filter
    if (selectedChains.size > 0 && !selectedChains.has(chain)) return;
    
    Object.keys(deploymentData[chain]).forEach(deploymentType => {
      // Check deployment type filter
      if (selectedDeployments.size > 0 && !selectedDeployments.has(deploymentType)) return;
      
      const processNestedObject = (obj, path = '') => {
        Object.keys(obj).forEach(key => {
          const currentPath = path ? `${path}.${key}` : key;
          const value = obj[key];
          
          // Check sub-filter for any deployment type
          if (selectedSubs.size > 0) {
            const pathParts = currentPath.split('.');
            if (pathParts.length > 0 && !selectedSubs.has(pathParts[0])) return;
          }
          
          if (typeof value === 'string' && value.startsWith('0x')) {
            if (searchFilter) {
              const searchText = `${chain} ${deploymentType} ${currentPath} ${value}`.toLowerCase();
              if (!searchText.includes(searchFilter)) return;
            }
            filteredData.push({
              chain,
              deploymentType,
              contractName: currentPath,
              address: value
            });
          } else if (typeof value === 'object' && value !== null) {
            processNestedObject(value, currentPath);
          }
        });
      };
      
      processNestedObject(deploymentData[chain][deploymentType]);
    });
  });
  
  renderTable();
}

// Render the filtered data in the table
function renderTable() {
  const tbody = document.getElementById('addresses-tbody');
  tbody.innerHTML = '';
  
  filteredData.forEach(item => {
    const row = document.createElement('tr');
    
    const chainCell = document.createElement('td');
    chainCell.className = 'chain-cell';
    chainCell.textContent = chainDisplayNames[item.chain] || item.chain.charAt(0).toUpperCase() + item.chain.slice(1);
    
    const typeCell = document.createElement('td');
    typeCell.textContent = deploymentTypeNames[item.deploymentType] || item.deploymentType.charAt(0).toUpperCase() + item.deploymentType.slice(1);
    
    // Always show sub-type header
    const subTypeHeader = document.getElementById('sub-type-header');
    if (subTypeHeader) {
      subTypeHeader.style.display = 'table-cell';
    }
    
    // Extract sub-type for all deployment types
    const subTypeCell = document.createElement('td');
    let subTypeDisplay = '';
    let displayName = '';
    
    if (item.contractName.includes('.')) {
      const parts = item.contractName.split('.');
      const category = parts[0];
      const subType = parts[1];
      
      // Remove version suffixes like "-v1", "-v2", etc.
      const cleanSubType = subType.replace(/-\w+$/, '');
      
      // Display the category as sub-type (Keepers, CRV Bridges, etc.)
      subTypeDisplay = contractNameMappings[category] || category.charAt(0).toUpperCase() + category.slice(1);
      
      // Display just the contract identifier since sub-type is shown in its own column
      displayName = cleanSubType.charAt(0).toUpperCase() + cleanSubType.slice(1);
    } else {
      // For non-nested deployments, show empty sub-type and the contract name in contract name column
      subTypeDisplay = '';
      displayName = contractNameMappings[item.contractName] || item.contractName;
    }
    
    // Always show sub-type cell
    subTypeCell.style.display = 'table-cell';
    subTypeCell.textContent = subTypeDisplay;
    
    const nameCell = document.createElement('td');
    nameCell.textContent = displayName;
    
    const addressCell = document.createElement('td');
    addressCell.className = 'address-cell';
    addressCell.textContent = item.address;
    
    const actionsCell = document.createElement('td');
    actionsCell.className = 'action-buttons';
    
    const copyBtn = document.createElement('span');
    copyBtn.textContent = '📋';
    copyBtn.onclick = () => copyAddress(item.address);
    copyBtn.style.cursor = 'pointer';
    copyBtn.style.background = 'none';
    copyBtn.style.backgroundColor = 'transparent';
    copyBtn.style.border = 'none';
    copyBtn.style.padding = '0';
    copyBtn.style.margin = '0';
    copyBtn.style.boxShadow = 'none';
    copyBtn.style.outline = 'none';
    copyBtn.style.borderRadius = '0';
    copyBtn.style.minWidth = 'auto';
    copyBtn.style.fontWeight = 'normal';
    copyBtn.style.transition = 'none';
    copyBtn.style.display = 'inline';
    copyBtn.style.lineHeight = '1';
    
    const explorerBtn = document.createElement('button');
    explorerBtn.style.backgroundColor = '#6c757d';
    explorerBtn.style.color = 'white';
    explorerBtn.textContent = 'Explorer';
    explorerBtn.onclick = () => openExplorer(item.address, item.chain);
    
    actionsCell.appendChild(copyBtn);
    actionsCell.appendChild(explorerBtn);
    
    row.appendChild(chainCell);
    row.appendChild(typeCell);
    row.appendChild(subTypeCell);
    row.appendChild(nameCell);
    row.appendChild(addressCell);
    row.appendChild(actionsCell);
    
    tbody.appendChild(row);
  });
}



// Copy address to clipboard
function copyAddress(address) {
  navigator.clipboard.writeText(address).then(() => {
    // Show feedback (you could add a toast notification here)
    console.log('Address copied to clipboard');
  }).catch(err => {
    console.error('Failed to copy address:', err);
  });
}

// Open address in explorer
function openExplorer(address, chain) {
  const config = chainConfig[chain];
  if (config && config.explorer) {
    window.open(config.explorer + address, '_blank');
  }
}

// Verify addresses on-chain
async function verifyAddresses() {
  const verifyBtn = document.getElementById('verify-addresses');
  verifyBtn.innerHTML = '<span class="spinner"></span> Verifying...';
  verifyBtn.classList.add('loading');
  
  // Only verify certain deployment types that can be checked on-chain
  const verifiableTypes = ['amm', 'crvusd', 'dao', 'router', 'integration'];
  const verifiableChains = ['ethereum', 'arbitrum', 'optimism', 'base', 'polygon', 'fraxtal', 'gnosis', 'bsc', 'mantle', 'zksync', 'sonic', 'taiko', 'corn', 'ink', 'xlayer'];
  
  const addressesToVerify = filteredData.filter(item =>
    verifiableTypes.includes(item.deploymentType) &&
    verifiableChains.includes(item.chain)
  );
  
  for (const item of addressesToVerify) {
    try {
      const isVerified = await verifyAddressOnChain(item.address, item.chain);
      verificationResults[item.address] = isVerified ? 'verified' : 'outdated';
      item.status = verificationResults[item.address];
    } catch (error) {
      console.error(`Error verifying ${item.address}:`, error);
      verificationResults[item.address] = 'unknown';
      item.status = 'unknown';
    }
  }
  
  renderTable();
  verifyBtn.innerHTML = 'Verify On-Chain';
  verifyBtn.classList.remove('loading');
}

// Verify single address
async function verifySingleAddress(address, chain) {
  // Only verify if it's a verifiable type and chain
  const verifiableTypes = ['amm', 'crvusd', 'dao', 'router', 'integration'];
  const verifiableChains = ['ethereum', 'arbitrum', 'optimism', 'base', 'polygon', 'fraxtal', 'gnosis', 'bsc', 'mantle', 'zksync', 'sonic', 'taiko', 'corn', 'ink', 'xlayer'];
  
  const item = filteredData.find(item => item.address === address);
  if (!item || !verifiableTypes.includes(item.deploymentType) || !verifiableChains.includes(chain)) {
    console.log(`Address ${address} is not verifiable on-chain`);
    return;
  }
  
  try {
    const isVerified = await verifyAddressOnChain(address, chain);
    verificationResults[address] = isVerified ? 'verified' : 'outdated';
    item.status = verificationResults[address];
    renderTable();
  } catch (error) {
    console.error(`Error verifying ${address}:`, error);
    verificationResults[address] = 'unknown';
    item.status = 'unknown';
    renderTable();
  }
}

// Placeholder for on-chain verification
async function verifyAddressOnChain(address, chain) {
  // This is a placeholder implementation
  // In a real implementation, you would:
  // 1. Connect to the chain's RPC
  // 2. Check if the contract exists at the address
  // 3. Verify the contract code matches expected patterns
  // 4. Return true if verified, false if not
  
  console.log(`Verifying ${address} on ${chain}...`);
  
  // Simulate verification (replace with actual implementation)
  return new Promise(resolve => {
    setTimeout(() => {
      // Random result for demo purposes
      resolve(Math.random() > 0.5);
    }, 100);
  });
}

// Export filtered data to CSV
function exportToCSV() {
  if (filteredData.length === 0) {
    alert('No data to export');
    return;
  }
  
  const headers = ['Chain', 'Deployment Type', 'Contract Name', 'Address', 'Status'];
  const csvContent = [
    headers.join(','),
    ...filteredData.map(item => [
      item.chain,
      item.deploymentType,
      item.contractName,
      item.address,
      item.status
    ].join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'curve-deployments.csv';
  a.click();
  window.URL.revokeObjectURL(url);
}

// Clear all filters
function clearFilters() {
  document.getElementById('chain-filter').value = '';
  document.getElementById('deployment-filter').value = '';
  document.getElementById('search-filter').value = '';
  filterData();
}

// Update sub-filter options based on selected deployment type
function updateSubFilter() {
  const subFilterContainer = document.getElementById('sub-filter-container');
  const subOptions = document.getElementById('sub-options');
  
  // Define sub-types for different deployment types
  const subTypeConfig = {
    'amm': ['stableswap', 'twocrypto', 'tricrypto', 'router & zap'],
    'x-dao': ['keepers', 'crv-bridges', 'crvusd-bridges', 'scrvusd-bridges'],
    'x-gov': ['l1-broadcaster', 'l2-relayer', 'ownership-agent', 'parameter-agent', 'emergency-agent', 'vault'],
    'core': ['gauge-controller', 'minter', 'community-fund', 'treasury'],
    'tokens': ['crv', 'vecrv', 'crvUSD', 'scrvUSD'],
    'fees': ['fee-receiver', 'fee-collector', 'hooker', 'cowswap-burner', 'fee-distributor-crvusd', 'fee-distributor-3crv', 'fee-splitter'],
    'integrations': ['address-provider', 'meta-registry', 'rate-provider', 'crv-circulating-supply']
  };
  
  // Check if any selected deployment type has sub-types
  const hasSubTypes = selectedDeployments.size > 0 && 
    Array.from(selectedDeployments).some(type => subTypeConfig[type]);
  
  if (hasSubTypes) {
    subFilterContainer.style.display = 'block';
    subOptions.innerHTML = '';
    selectedSubs.clear();
    
    // Get all sub-types for selected deployment types
    const allSubTypes = [];
    selectedDeployments.forEach(deploymentType => {
      if (subTypeConfig[deploymentType]) {
        allSubTypes.push(...subTypeConfig[deploymentType]);
      }
    });
    
    // Remove duplicates and sort
    const uniqueSubTypes = [...new Set(allSubTypes)].sort();
    
    uniqueSubTypes.forEach(subType => {
      const optionDiv = document.createElement('div');
      optionDiv.className = 'multi-select-option';
      
      const label = document.createElement('label');
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.value = subType;
      checkbox.onchange = () => updateSubSelection(subType, checkbox.checked);
      
      const text = document.createElement('span');
      text.textContent = contractNameMappings[subType] || subType.charAt(0).toUpperCase() + subType.slice(1);
      
      label.appendChild(checkbox);
      label.appendChild(text);
      optionDiv.appendChild(label);
      subOptions.appendChild(optionDiv);
    });
    
    updateSubDisplay();
  } else {
    subFilterContainer.style.display = 'none';
    selectedSubs.clear();
    updateSubDisplay();
  }
}

// Close dropdowns when clicking outside
document.addEventListener('click', function(event) {
  if (!event.target.closest('.multi-select-container')) {
    document.querySelectorAll('.multi-select-dropdown').forEach(d => d.style.display = 'none');
    document.querySelectorAll('.multi-select-toggle').forEach(t => t.classList.remove('active'));
  }
});

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
  loadDeploymentData();
  
  document.getElementById('search-filter').addEventListener('input', filterData);
});
</script> 