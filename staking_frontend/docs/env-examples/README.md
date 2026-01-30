# Network Environment Examples

This directory contains example `.env` files for different network configurations.

## Quick Start

Copy the appropriate `.env.*.example` file based on your target network:

```bash
# For Devnet (local testing)
cp .env.devnet.example .env.local

# For Testnet (public testing)
cp .env.testnet.example .env.local

# For Mainnet (production - be careful!)
cp .env.mainnet.example .env.local
```

## File Contents

- **`.env.devnet.example`** - Local Clarity DevNet configuration
- **`.env.testnet.example`** - Stacks Testnet configuration
- **`.env.mainnet.example`** - Stacks Mainnet configuration (production)

## Environment Variables

Each network requires:

| Variable | Purpose | Example |
|----------|---------|---------|
| `NEXT_PUBLIC_STACKS_NETWORK` | Target network | `testnet`, `mainnet`, `devnet` |
| `NEXT_PUBLIC_STAKING_CONTRACT_ADDRESS` | Staking contract address | `SN2JXK...` (testnet) |
| `NEXT_PUBLIC_STAKING_TOKEN_ADDRESS` | Token contract address | `SN2JXK...` (testnet) |

## Contract Address Format

- **Mainnet addresses** start with `SP...` (Principal)
- **Testnet/Devnet addresses** start with `SN...` (Testnet Principal)

Example:
```bash
# Mainnet (production)
SP2JXKMH4R3YJJ5MKBAXJ5DZX3N6Q6S59GVHWFVS7.staking

# Testnet (testing)
SN2JXKMH4R3YJJ5MKBAXJ5DZX3N6Q6S59GVHWFVS7.staking-test

# Devnet (local)
SN2JXKMH4R3YJJ5MKBAXJ5DZX3N6Q6S59GVHWFVS7.staking-dev
```

## Network Selection

The frontend automatically:
1. Reads `NEXT_PUBLIC_STACKS_NETWORK` environment variable
2. Validates it against allowed networks (mainnet, testnet, devnet)
3. Loads the appropriate RPC endpoint
4. Uses the correct contract addresses

No manual network configuration in code needed!

## Validation

Environment is automatically validated on app startup:

```typescript
import { FRONTEND_ENV } from '@/config';

// TypeScript ensures STACKS_NETWORK is valid
const network = FRONTEND_ENV.STACKS_NETWORK;
// Type: 'mainnet' | 'testnet' | 'devnet'
```

Invalid values in `.env.local` will:
- Log a warning to console
- Default to `mainnet` (safe fallback)
- Suggest valid values

## Testing Each Network

### Devnet (Local)

```bash
# Terminal 1: Start Devnet
cd stakingContract
clarinet integrate

# Terminal 2: Start frontend
cp staking_frontend/docs/env-examples/.env.devnet.example staking_frontend/.env.local
cd staking_frontend
npm run dev
```

### Testnet (Public)

```bash
# Get testnet STX from faucet
# https://testnet.blocksurvey.io/

# Configure frontend
cp staking_frontend/docs/env-examples/.env.testnet.example staking_frontend/.env.local
cd staking_frontend
npm run dev
```

### Mainnet (Production)

```bash
# Only after testing on testnet
cp staking_frontend/docs/env-examples/.env.mainnet.example staking_frontend/.env.local
cd staking_frontend
npm run build
npm start
```

## Security Notes

- Never commit `.env.local` to version control
- Mainnet contracts require real STX - double-check addresses!
- Use `.env.*.example` as templates only
- Always test on testnet before mainnet deployment
- Keep contract addresses updated per network
