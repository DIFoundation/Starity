<!-- Network Implementation Guide -->
# Network Configuration Implementation Guide

This guide walks through implementing dynamic network support in the Starity staking frontend.

## Architecture Overview

The network configuration system consists of 4 main layers:

```
┌─────────────────────────────────────────────────────┐
│        Components (UI Layer)                         │
│   NetworkSwitcher, NetworkStatus, NetworkGate       │
└─────────────────────────────────────────────────────┘
                        ↑
┌─────────────────────────────────────────────────────┐
│        Hooks (State Layer)                           │
│   useNetwork, useStakingContract                     │
└─────────────────────────────────────────────────────┘
                        ↑
┌─────────────────────────────────────────────────────┐
│        Configuration (Config Layer)                  │
│   env.ts, networks.ts, network-*.ts                 │
└─────────────────────────────────────────────────────┘
                        ↑
┌─────────────────────────────────────────────────────┐
│        Environment (Base Layer)                      │
│   NEXT_PUBLIC_STACKS_NETWORK env var                │
└─────────────────────────────────────────────────────┘
```

## Implementation Steps

### Step 1: Set Environment Variable

Configure the network via `NEXT_PUBLIC_STACKS_NETWORK`:

```bash
# .env.local
NEXT_PUBLIC_STACKS_NETWORK=devnet
NEXT_PUBLIC_STAKING_CONTRACT_ADDRESS=SN2JXKMH4R3YJJ5MKBAXJ5DZX3N6Q6S59GVHWFVS7.staking
```

### Step 2: Access Current Network

In any component or hook:

```typescript
import { FRONTEND_ENV } from '@/config';

const currentNetwork = FRONTEND_ENV.STACKS_NETWORK;
// TypeScript ensures it's 'mainnet' | 'testnet' | 'devnet'
```

### Step 3: Get Network Configuration

```typescript
import { getNetworkConfig } from '@/config';

const config = getNetworkConfig(FRONTEND_ENV.STACKS_NETWORK);
console.log(config.rpcUrl); // https://api.testnet.hiro.so
```

### Step 4: Use in Contracts

```typescript
import { createNetworkAddresses, getNetworkContractAddress } from '@/config';
import { FRONTEND_ENV } from '@/config';

// Define addresses for all networks
const stakingAddresses = createNetworkAddresses(
  'SP2JXKMH...GVHWFVS7.staking',           // mainnet
  'SN2JXKMH...GVHWFVS7.staking-test',      // testnet
  'SN2JXKMH...GVHWFVS7.staking-dev'        // devnet
);

// Use current network's address
const contractAddr = getNetworkContractAddress(
  FRONTEND_ENV.STACKS_NETWORK,
  stakingAddresses
);
```

### Step 5: Add UI Network Switcher

```typescript
import { useNetwork } from '@/hooks';
import { NetworkSwitcher } from '@/components/NetworkSwitcher';

function App() {
  return (
    <div>
      {/* In header or settings */}
      <NetworkSwitcher />
    </div>
  );
}
```

### Step 6: Gate Features by Network

```typescript
import { NetworkGate } from '@/components/NetworkSwitcher';

function PremiumFeatures() {
  return (
    <NetworkGate 
      requireProduction
      fallback={<p>Only available on Mainnet</p>}
    >
      <div>Premium features...</div>
    </NetworkGate>
  );
}
```

## File Structure

```
src/config/
├── index.ts                 # Barrel export (all config)
├── env.ts                   # Environment variables
├── networks.ts              # Network definitions & utilities
├── network-utils.ts         # Detection & validation
└── network-contracts.ts     # Contract address mapping

src/hooks/
├── useNetwork.ts            # Network state management
└── useStakingContract.ts    # Contract interactions

src/components/NetworkSwitcher/
├── NetworkSwitcher.tsx      # UI components
└── index.ts                 # Export

docs/
├── NETWORKS.md              # Configuration guide
└── NETWORKS_IMPLEMENTATION.md  # This file
```

## Network Configuration Details

### Mainnet
- **Purpose**: Production deployment with real STX
- **RPC**: https://api.mainnet.hiro.so
- **Chain ID**: 0
- **Address Prefix**: SP...
- **Use Case**: Live transactions, real funds

### Testnet
- **Purpose**: Public testing and development
- **RPC**: https://api.testnet.hiro.so
- **Chain ID**: 0x80000000
- **Address Prefix**: SN...
- **Use Case**: Testing before mainnet

### Devnet
- **Purpose**: Local development with Clarity DevNet
- **RPC**: http://localhost:3999
- **Chain ID**: 0x80000000
- **Address Prefix**: SN...
- **Use Case**: Local contract development

## Type Safety

The network system is fully type-safe:

```typescript
import { NetworkType, isValidNetwork } from '@/config';

// This is type-safe
const network: NetworkType = 'testnet';

// TypeScript prevents invalid values
const invalid: NetworkType = 'invalid'; // ❌ Error

// Runtime validation
if (isValidNetwork(userInput)) {
  // Now it's safe to use
  const safe: NetworkType = userInput;
}
```

## Error Handling

### Validation Example

```typescript
import { validateNetworkConfig } from '@/config';

const validation = validateNetworkConfig(network);

if (!validation.isValid) {
  validation.errors.forEach(err => console.error(err));
}

if (validation.warnings.length > 0) {
  validation.warnings.forEach(warn => console.warn(warn));
}
```

### Network Compatibility

```typescript
import { checkNetworkCompatibility } from '@/config';

// Check if network is production
const compat = checkNetworkCompatibility('testnet', true, false);
if (!compat.isCompatible) {
  console.error(compat.message);
  // Recommended: mainnet
}
```

## Testing Networks

### Local Testing (Devnet)

```bash
# Terminal 1: Start Devnet
cd stakingContract
clarinet integrate

# Terminal 2: Start frontend
NEXT_PUBLIC_STACKS_NETWORK=devnet npm run dev
# Open http://localhost:3000
```

### Public Testnet

```bash
# Get testnet STX from faucet
# https://testnet.blocksurvey.io/

# Configure frontend
NEXT_PUBLIC_STACKS_NETWORK=testnet npm run dev
```

### Mainnet (Production)

```bash
# Only after thorough testing
NEXT_PUBLIC_STACKS_NETWORK=mainnet npm run build
```

## Common Patterns

### Network-Aware Initialization

```typescript
import { detectNetwork, logNetworkInfo } from '@/config';

export function initializeApp() {
  const network = detectNetwork();
  logNetworkInfo(network);
  
  if (network === 'devnet') {
    console.log('Running in development mode');
  } else if (network === 'mainnet') {
    console.warn('Running on Mainnet - be careful!');
  }
}
```

### Feature Flags by Network

```typescript
import { FRONTEND_ENV } from '@/config';

export const FEATURE_FLAGS = {
  enableBetaFeatures: FRONTEND_ENV.STACKS_NETWORK !== 'mainnet',
  enableTestAccounts: FRONTEND_ENV.STACKS_NETWORK === 'devnet',
  enableAnalytics: FRONTEND_ENV.STACKS_NETWORK === 'mainnet',
};
```

### Network-Specific Logging

```typescript
import { getNetworkDescription } from '@/config';

function log(message: string, data?: any) {
  const prefix = `[${getNetworkDescription(FRONTEND_ENV.STACKS_NETWORK)}]`;
  console.log(`${prefix} ${message}`, data);
}

log('Transaction submitted', { txId: '...' });
// Output: [Testnet (Testing) - https://api.testnet.hiro.so] Transaction submitted
```

## Troubleshooting

### Issue: Invalid network warning

**Solution**: Check environment variable
```bash
echo $NEXT_PUBLIC_STACKS_NETWORK
# Should output: mainnet, testnet, or devnet
```

### Issue: Contract not found on network

**Solution**: Verify contract address for network
```typescript
import { logNetworkAddresses } from '@/config';

logNetworkAddresses('StakingContract', addresses);
// Check if address is correct for current network
```

### Issue: Devnet RPC not responding

**Solution**: Start Devnet
```bash
cd stakingContract
clarinet integrate
# Check: curl http://localhost:3999/healthz
```

## Migration Guide

### From Hardcoded Network

**Before** (Old approach):
```typescript
import { STACKS_MAINNET } from '@stacks/network';

const network = STACKS_MAINNET; // Always mainnet!
```

**After** (New approach):
```typescript
import { getStacksNetwork } from '@/config';
import { FRONTEND_ENV } from '@/config';

const network = getStacksNetwork(FRONTEND_ENV.STACKS_NETWORK);
// Supports mainnet, testnet, devnet
```

### From Manual Network Selection

**Before**:
```typescript
const network = (FRONTEND_ENV.STACKS_NETWORK === 'testnet')
  ? STACKS_TESTNET
  : STACKS_MAINNET;
// Only 2 networks, no devnet support
```

**After**:
```typescript
const network = getStacksNetwork(FRONTEND_ENV.STACKS_NETWORK);
// 3 networks, fully typed, validated
```

## Best Practices

✅ **Do's:**
- Use `FRONTEND_ENV.STACKS_NETWORK` for current network
- Use `getNetworkConfig()` for RPC endpoints
- Use `NetworkGate` to gate production features
- Validate network with `validateNetworkConfig()`
- Log network info on app startup

❌ **Don'ts:**
- Hardcode RPC endpoints
- Use magic strings for networks
- Trust user-provided network values
- Skip devnet support
- Forget to update contract addresses for new networks

## Resources

- [Stacks Network Docs](https://docs.stacks.co)
- [Clarity DevNet Guide](https://docs.stacks.co/build-apps/clarinet)
- [Network Configuration](./NETWORKS.md)
- [Environment Setup](./env.md)
