# Gelato Bot for Aave ParaSwap Fee Claimer

## Overview

This Gelato Web3 Function automates the process of claiming accumulated protocol fees from Aave markets across multiple chains using ParaSwap's fee claimer contract. The bot cycles through supported networks, checks for claimable fees above a threshold ($100), and executes claims either individually or in batches.

## Key Features

- **Multi-chain support**: Works across 8+ EVM networks where Aave is deployed
- **Smart batching**: Claims fees either individually or in batches based on asset count
- **Dynamic decimal handling**: Caches token decimals to minimize RPC calls
- **Value threshold**: Only claims assets worth ≥ $100 to optimize gas costs
- **Gelato Relay integration**: Uses sponsored transactions for gasless execution
- **Round-robin scheduling**: Cycles through chains in sequence

## Supported Networks

The bot currently supports these chains:

- Ethereum Mainnet (1)
- Arbitrum (42161)
- Avalanche (43114)
- Base (8453)
- BSC (56)
- Optimism (10)
- Polygon (137)
- Polygon zkEVM (1101)

## Configuration

### User Arguments

The bot requires these configuration parameters:

1. `chainIds`: Array of chain IDs to monitor (e.g., `[1, 137, 42161]`)
2. `duration`: Cooldown period in milliseconds between executions per chain

### Secrets

- `RELAY_API_KEY`: Gelato Relay API key for sponsored transactions

## How It Works

1. **Initialization**:

   - Loads cached token decimals from storage
   - Checks if cooldown period has elapsed for current chain

2. **Fee Checking**:

   - Fetches all reserve assets from Aave Data Provider
   - Gets claimable amounts and current prices for each asset
   - Calculates USD value of claimable fees

3. **Claim Execution**:

   - For assets worth ≥ $100:
     - Single asset: Calls `claimToCollector`
     - Multiple assets: Calls `batchClaimToCollector`
   - Uses Gelato Relay for sponsored transaction execution

4. **State Update**:
   - Updates last execution timestamp
   - Rotates to next chain in sequence
   - Caches new decimal values discovered

## Smart Contract Interactions

The bot interacts with these contracts:

1. **ParaSwap Fee Claimer**:

   - `batchGetClaimable()`: Checks claimable amounts
   - `claimToCollector()`: Claims single asset fees
   - `batchClaimToCollector()`: Claims multiple assets at once

2. **Aave Data Provider**:

   - `getAllReservesTokens()`: Lists all market assets
   - `getReserveConfigurationData()`: Gets asset decimals and config

3. **Aave Price Oracle**:
   - `getAssetsPrices()`: Gets current asset prices in USD

## Setup Instructions

1. Deploy the Web3 Function on Gelato
2. Configure `chainIds` with your desired networks
3. Set `duration` (recommended: 2592000000 for 30 days intervals)
4. Add `RELAY_API_KEY` secret
5. Fund your Gelato task

## Monitoring

The bot provides clear status messages:

- "Sponsor Api Key not configured" if missing API key
- "Not claimable time" if cooldown hasn't elapsed
- Logs chain ID, asset address and USD value for claimable assets
- "Succeed!" after successful execution

## Optimization Notes

- The bot limits RPC calls to 5 per execution to stay within Gelato limits
- Token decimals are cached in storage to minimize future RPC calls
- Only assets with ≥ $100 in claimable fees are processed