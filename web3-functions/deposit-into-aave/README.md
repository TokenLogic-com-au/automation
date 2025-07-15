# Aave V3 Deposit & Migration Gelato Bot

## Overview

This script is designed to automate the process of depositing assets into Aave V3 using a Gelato bot. It checks the reserves of various tokens across multiple chains and deposits them if their value exceeds $1000. Additionally, it performs V2 to V3 migrations for eligible assets when applicable.

## Installation

Ensure the following environment variables are set up as secrets in your Gelato Web3Function:
1. PRIVATE_KEY: EOA with permission to execute the role
2. SAFE_ADDRESS: The Gnosis Safe address with the Roles Modifier enabled
3. RPC_URL_<NETWORK>: JSON-RPC URLs for each supported network (e.g., RPC_URL_OPTIMISM, RPC_URL_ETHEREUM, etc.)
4. DEPOSITCALL_MIN_USD_THRESHOLD: Minimum USD threshold for chain calls/deposits (in wei format)
5. MIGRATION_MIN_USD_THRESHOLD: Minimum USD threshold for migration operations (in wei format)
6. MAX_BPS: Maximum basis points for calculations (e.g., 10000 for 100%)
7. MIGRATION_BPS: Basis points for migration operations (e.g., 9000 for 90%)

## How It Works

1. **Initialization**: The Web3Function is triggered and fetches secrets (private key, RPC URLs, Safe address).
2. **Multi-Chain Support**: It loops through all supported chains defined in AAVE_ADDRESSES.
3. **Reserve Evaluation**: For each chain, it retrieves reserves and prices via Aave’s Data Provider and Price Oracle.
4. **Threshold Check**: If any token's reserve value exceeds $1000, the bot prepares a `depositV3` transaction.
5. **V2 to V3 Migration**: For assets still held in Aave V2 with a V3 counterpart, the script checks if they surpass the migration threshold. If so, it prepares a `migrateV2toV3` transaction.
6. **Role-Based Execution**: All encoded transactions (`depositV3` and `migrateV2toV3`) are executed via the RolesModifier contract, leveraging the EOA’s assigned permissions to perform batched, permissioned calls.

## Testing

To test the script, run the following command:

```bash
npx hardhat w3f-run web3-functions/deposit-into-aave/index.ts --logs
```

This will execute the script and log the output, allowing you to verify its functionality.

## Unit testing

To run unit tests, use the following command:

```bash
yarn jest
```

This will execute all the unit tests and display the results in the terminal, allowing you to verify the correctness of the script's functionality.

## Deployment

To deploy the script, use the following command:

Use `npx hardhat w3f-deploy W3FNAME` command to deploy your web3 function.
