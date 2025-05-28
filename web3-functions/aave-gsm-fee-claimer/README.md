# Gelato Bot for AAVE GSM Fee Distribution

## Overview

This Gelato Web3 Function automates the process of distributing accrued fees from AAVE GSM (Gho Stability Module) contracts to the treasury. The bot cycles through a list of GSM contracts on different chains, checking if they have accumulated sufficient fees and if the cooldown period has elapsed before triggering the distribution.

## Key Features

- **Multi-chain support**: Manages GSM contracts across different blockchain networks
- **Cooldown mechanism**: Ensures distributions only occur after a specified duration
- **Minimum threshold**: Only triggers distribution when fees exceed $100 (100_000_000_000_000_000_000 wei)
- **Round-robin scheduling**: Cycles through GSM contracts in sequence
- **Gelato Relay integration**: Uses sponsored transactions for gasless execution

## Configuration

### User Arguments

The bot requires the following user arguments:

1. `gsms`: An array of strings specifying GSM contracts in format `"chainId:contractAddress"`
   - Example: `["1:0x123...abc", "137:0x456...def"]`
2. `duration`: Cooldown period in milliseconds between executions for each GSM

### Secrets

- `RELAY_API_KEY`: Gelato Relay API key for sponsored transactions

## How It Works

1. The bot maintains state tracking:

   - `nextIndex`: Points to the next GSM contract to check
   - Timestamp of last execution for each GSM

2. On each run:
   - Checks if cooldown period has elapsed for the current GSM
   - Queries the GSM contract for accrued fees
   - If fees exceed $100 and cooldown has passed:
     - Uses Gelato Relay to send a sponsored `distributeFeesToTreasury` transaction
     - Updates last execution timestamp
   - Rotates to the next GSM contract in the list

## Smart Contract Interactions

The bot interacts with GSM contracts using these functions:

- `getAccruedFees()`: View function to check current fee amount
- `distributeFeesToTreasury()`: Function to trigger fee distribution

## Setup Instructions

1. Deploy the Web3 Function on Gelato
2. Configure user arguments with your GSM contracts and desired duration
3. Set the `RELAY_API_KEY` secret
4. Fund your Gelato task to cover execution costs

## Monitoring

The bot provides clear status messages:

- "Sponsor Api Key not configured" if missing API key
- "Not claimable time" if cooldown hasn't elapsed
- "Fee is too small" if accrued fees are below threshold
- "Succeed!" after successful execution