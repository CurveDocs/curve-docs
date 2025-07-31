#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Function to extract addresses from markdown tables
function extractAddressesFromMarkdown(content) {
  const deployments = {};
  
  // Match chain headers (e.g., "**:logos-ethereum: Ethereum Mainnet**")
  const chainHeaders = content.match(/\*\*:logos-([^:]+):\s*([^*]+)\*\*/g);
  
  if (!chainHeaders) return deployments;
  
  chainHeaders.forEach(header => {
    const chainMatch = header.match(/\*\*:logos-([^:]+):\s*([^*]+)\*\*/);
    if (!chainMatch) return;
    
    const chainKey = chainMatch[1];
    const chainName = chainMatch[2].trim();
    
    // Find the table that follows this header
    const tableStart = content.indexOf(header) + header.length;
    const nextHeader = content.substring(tableStart).match(/\*\*:logos-([^:]+):\s*([^*]+)\*\*/);
    const tableEnd = nextHeader ? content.indexOf(nextHeader[0], tableStart) : content.length;
    const tableContent = content.substring(tableStart, tableEnd);
    
    // Extract table rows
    const rows = tableContent.match(/\|[^|]+\|[^|]+\|/g);
    if (!rows) return;
    
    deployments[chainKey] = {};
    
    rows.forEach(row => {
      const cells = row.split('|').map(cell => cell.trim()).filter(cell => cell);
      if (cells.length >= 2) {
        const contractName = cells[0].replace(/`/g, '').trim();
        const addressMatch = cells[1].match(/\[([^\]]+)\]\(([^)]+)\)/);
        if (addressMatch) {
          const address = addressMatch[1];
          deployments[chainKey][contractName] = address;
        }
      }
    });
  });
  
  return deployments;
}

// Function to determine deployment type from file content
function getDeploymentType(content) {
  if (content.includes('Automated Market Maker') || content.includes('Stableswap-NG')) {
    return 'amm';
  } else if (content.includes('crvUSD') || content.includes('curve-stablecoin')) {
    return 'crvusd';
  } else if (content.includes('lending') || content.includes('Lending')) {
    return 'lending';
  } else if (content.includes('DAO') || content.includes('dao')) {
    return 'dao';
  } else if (content.includes('Router') || content.includes('router')) {
    return 'router';
  } else if (content.includes('Integration') || content.includes('integration')) {
    return 'integration';
  } else if (content.includes('CrossChain') || content.includes('crosschain')) {
    return 'crosschain';
  }
  return 'other';
}

// Main extraction function
function extractAllDeployments() {
  const deploymentsDir = path.join(__dirname, '../docs/deployments');
  const deploymentData = {};
  
  const files = fs.readdirSync(deploymentsDir).filter(file => file.endsWith('.md'));
  
  files.forEach(file => {
    const filePath = path.join(deploymentsDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    
    const deploymentType = getDeploymentType(content);
    if (deploymentType === 'other') return;
    
    const addresses = extractAddressesFromMarkdown(content);
    
    if (!deploymentData[deploymentType]) {
      deploymentData[deploymentType] = {};
    }
    
    Object.assign(deploymentData[deploymentType], addresses);
  });
  
  return deploymentData;
}

// Generate the JavaScript data structure
function generateJavaScriptData(deploymentData) {
  let jsCode = 'const deploymentData = {\n';
  
  Object.keys(deploymentData).forEach(deploymentType => {
    jsCode += `  ${deploymentType}: {\n`;
    
    Object.keys(deploymentData[deploymentType]).forEach(chain => {
      jsCode += `    ${chain}: {\n`;
      
      Object.keys(deploymentData[deploymentType][chain]).forEach(contractName => {
        const address = deploymentData[deploymentType][chain][contractName];
        jsCode += `      "${contractName}": "${address}",\n`;
      });
      
      jsCode += '    },\n';
    });
    
    jsCode += '  },\n';
  });
  
  jsCode += '};\n';
  
  return jsCode;
}

// Main execution
if (require.main === module) {
  try {
    console.log('Extracting deployment addresses...');
    const deploymentData = extractAllDeployments();
    
    console.log('\nExtracted deployment data:');
    console.log(JSON.stringify(deploymentData, null, 2));
    
    console.log('\nGenerated JavaScript code:');
    console.log(generateJavaScriptData(deploymentData));
    
    // Save to a file
    const outputPath = path.join(__dirname, '../docs/deployments/deployment-data.json');
    fs.writeFileSync(outputPath, JSON.stringify(deploymentData, null, 2));
    console.log(`\nSaved deployment data to: ${outputPath}`);
    
  } catch (error) {
    console.error('Error extracting deployments:', error);
    process.exit(1);
  }
}

module.exports = {
  extractAddressesFromMarkdown,
  getDeploymentType,
  extractAllDeployments,
  generateJavaScriptData
}; 