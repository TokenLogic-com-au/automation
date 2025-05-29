# Deposit Into Aave V3 Gelato Bot

## Overview

This script is designed to automate the process of depositing assets into Aave V3 using a Gelato bot. It checks the reserves of various tokens across multiple chains and deposits them if their value exceeds $100.

## Installation

Ensure you have the necessary environment variables set up:

1. `RELAY_API_KEY`: Your API key for the Gelato Relay service.

## How It Works

1. **Initialization**: The script initializes a Web3 function using the Gelato Network's SDK.
2. **Multi-Chain Support**: It supports multiple chains by iterating over the `AAVE_ADDRESSES` object, which contains the necessary contract addresses for each chain.
3. **Reserve Checking**: For each chain, it retrieves all reserve tokens and their prices using Aave's data provider and price oracle contracts.
4. **Deposit Condition**: It checks if the value of each token's reserve exceeds $100. If so, it encodes a deposit transaction.
5. **Transaction Proposal**: If there are any deposits to be made, the script uses the Safe protocol to propose a multicall transaction, which is then sponsored by the Gelato Relay service.

## Testing

To test the script, run the following command:

```bash
w3f-run W3FNAME --logs
```

This will execute the script and log the output, allowing you to verify its functionality.

## Deployment

To deploy the script, use the following command:

Use `npx hardhat w3f-deploy W3FNAME` command to deploy your web3 function.
