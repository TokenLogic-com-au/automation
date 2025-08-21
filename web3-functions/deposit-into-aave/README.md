# Aave V3 Deposit & Migration Gelato Bot

## Overview

This script is designed to automate the process of depositing assets into Aave V3 using a Gelato bot. It checks the reserves of various tokens across multiple chains and deposits them if their value exceeds $1000. Additionally, it performs V2 to V3 migrations for eligible assets when applicable.

## Security Considerations

This repository relies on permissions being granted via the roles reposistory that can be found (here)[https://github.com/TokenLogic-com-au/zodiac-roles].

An externally owned account (EOA) receives specific permissions (via the Zodiac module featured in SAFE) to call the `multicall()` function on behalf of the SAFE address that acts as the guardian to the PoolExposureSteward.
This permission is granted in order for the bot to be able to batch call both `depositIntoV3()` and `migrateV2toV3()` instead of doing individual calls for each deposit/migration.

### Potential Risks

A maliciious actor who got a hold of the EOA's private-key could then submit batched transactions to the PoolExposureSteward so that they could:

1. Withdraw from Aave V2 or V3
2. Deposit tokens that are not meant to be deposited via this script (GHO for example, which sometimes is needed for runway purposes)
3. Migrate between V3 pools (ie: Prime to Core or vice versa)

The mentioned issues could lead to potentially the DAO not earning yield because of assets being withdrawn from Aave, leaving streams to not be claimable because of insufficient GHO held on the collector, or migrating from one pool to the other and also affecting the yield earned. If such an EOA were compromised, there would be no other risks available to the malicious actor and the permissions to that EOA could be easily removed so that the script would no longer work and the EOA could not submit transactions on behalf of the SAFE.

A more restrictive approach if this turned out to be dangerous for the DAO would be to only grant this EOA the permissions to `depositIntoV3()` or `migrateV2toV3()` only, therefore a malicious actor could not really perform any issues.

## Installation

Ensure the following environment variables are set up as secrets in your Gelato Web3Function:

1. PRIVATE_KEY: EOA with permission to execute the role
2. SAFE_ADDRESS: The Gnosis Safe address with the Roles Modifier enabled
3. RPC*URL*<NETWORK>: JSON-RPC URLs for each supported network (e.g., RPC_URL_OPTIMISM, RPC_URL_ETHEREUM, etc.)
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
