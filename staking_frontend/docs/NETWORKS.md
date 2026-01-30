<!-- Networks Configuration Guide -->
# Network Configuration Guide

This guide explains how to configure and use different Stacks networks (Mainnet, Testnet, Devnet) in the staking frontend.

## Overview

The staking frontend supports three Stacks networks:

- **Mainnet** - Production network (real STX)
- **Testnet** - Public testnet for testing
- **Devnet** - Local development network (Clarity DevNet)

## Supported Networks

### Mainnet (Production)
- **RPC Endpoint**: https://api.mainnet.hiro.so
- **Chain ID**: 0
- **Use Case**: Production deployments with real STX
- **Status**: 🟢 Production ready

### Testnet (Public Testing)
- **RPC Endpoint**: https://api.testnet.hiro.so
- **Chain ID**: 0x80000000 (testnet identifier)
- **Use Case**: Testing and development
- **Status**: 🟡 Testing network

### Devnet (Local Development)
- **RPC Endpoint**: http://localhost:3999
- **Chain ID**: 0x80000000 (testnet identifier)
- **Use Case**: Local Clarity contract development
- **Status**: 🔴 Requires local setup

## Configuration

### Environment Variables

Set `NEXT_PUBLIC_STACKS_NETWORK` to select the network:

```bash
# Mainnet (default)
NEXT_PUBLIC_STACKS_NETWORK=mainnet

# Testnet
NEXT_PUBLIC_STACKS_NETWORK=testnet

# Devnet (local)
NEXT_PUBLIC_STACKS_NETWORK=devnet
```

### Network-Specific Environment Files

Create separate `.env` files for each network:

**.env.local** (Development)
```bash
NEXT_PUBLIC_STACKS_NETWORK=devnet
NEXT_PUBLIC_STAKING_CONTRACT_ADDRESS=SN2JXKMH4R3YJJ5MKBAXJ5DZX3N6Q6S59GVHWFVS7.staking-dev
NEXT_PUBLIC_STAKING_TOKEN_CONTRACT=SN2JXKMH4R3YJJ5MKBAXJ5DZX3N6Q6S59GVHWFVS7.token-dev
```

**.env.testnet**
```bash
NEXT_PUBLIC_STACKS_NETWORK=testnet
NEXT_PUBLIC_STAKING_CONTRACT_ADDRESS=SN2JXKMH4R3YJJ5MKBAXJ5DZX3N6Q6S59GVHWFVS7.staking-test
NEXT_PUBLIC_STAKING_TOKEN_CONTRACT=SN2JXKMH4R3YJJ5MKBAXJ5DZX3N6Q6S59GVHWFVS7.token-test
```

**.env.mainnet** (Production)
```bash
NEXT_PUBLIC_STACKS_NETWORK=mainnet
NEXT_PUBLIC_STAKING_CONTRACT_ADDRESS=SP2JXKMH4R3YJJ5MKBAXJ5DZX3N6Q6S59GVHWFVS7.staking
NEXT_PUBLIC_STAKING_TOKEN_CONTRACT=SP2JXKMH4R3YJJ5MKBAXJ5DZX3N6Q6S59GVHWFVS7.token
```

### Loading Environment Files

Use the appropriate env file when running:

```bash
# Development (Devnet)
cp .env.local.example .env.local
npm run dev

# Testnet
cp .env.testnet .env.local
npm run dev

# Mainnet
cp .env.mainnet .env.local
npm run build
npm start
```

## Using Networks in Code

### Get Current Network

```typescript
import { FRONTEND_ENV } from '@/config';

// Current network from environment
const network = FRONTEND_ENV.STACKS_NETWORK;
console.log(network); // 'mainnet' | 'testnet' | 'devnet'
```

### Get Network Configuration

```typescript
import { getNetworkConfig, getNetworkDescription } from '@/config';

const config = getNetworkConfig('testnet');
console.log(config.displayName);      // "Testnet"
console.log(config.rpcUrl);           // "https://api.testnet.hiro.so"
console.log(config.isProduction);     // false
console.log(config.isTestnet);        // true
```

### Detect Current Network

```typescript
import { detectNetwork, logNetworkInfo } from '@/config';

const network = detectNetwork();
logNetworkInfo(network);
```

### Validate Network Configuration

```typescript
import { validateNetworkConfig } from '@/config';

const validation = validateNetworkConfig('devnet');
if (!validation.isValid) {
  console.error('Errors:', validation.errors);
}
if (validation.warnings.length > 0) {
  console.warn('Warnings:', validation.warnings);
}
```

### Check Network Requirements

```typescript
import { checkNetworkCompatibility } from '@/config';

// Check if network is production-only
const compat = checkNetworkCompatibility('testnet', true, false);
if (!compat.isCompatible) {
  console.error(compat.message);
  console.log('Recommended:', compat.recommendedNetworks);
}
```

## Using Networks in Components

### useNetwork Hook

```typescript
import { useNetwork } from '@/hooks';

function NetworkDisplay() {
  const { 
    currentNetwork, 
    networkDescription,
    isProduction,
    isTestnet,
    networks,
    changeNetwork,
    isLoading,
    error
  } = useNetwork();

  return (
    <div>
      <p>Current: {networkDescription}</p>
      
      {error && <div className="error">{error}</div>}
      
      <select 
        onChange={(e) => changeNetwork(e.target.value)}
        disabled={isLoading}
      >
        {networks.map(net => (
          <option key={net.name} value={net.name}>
            {net.displayName}
          </option>
        ))}
      </select>

      {isProduction && <span>⚠️ Production Network</span>}
      {isTestnet && <span>🧪 Testnet</span>}
    </div>
  );
}
```

### Network-Aware Contracts

```typescript
import { 
  createNetworkAddresses, 
  getNetworkContractAddress 
} from '@/config';
import { FRONTEND_ENV } from '@/config';

// Define addresses for all networks
const stakingAddresses = createNetworkAddresses(
  'SP2JXKMH4R3YJJ5MKBAXJ5DZX3N6Q6S59GVHWFVS7.staking',           // mainnet
  'SN2JXKMH4R3YJJ5MKBAXJ5DZX3N6Q6S59GVHWFVS7.staking-test',      // testnet
  'SN2JXKMH4R3YJJ5MKBAXJ5DZX3N6Q6S59GVHWFVS7.staking-dev'        // devnet
);

// Get address for current network
const contractAddress = getNetworkContractAddress(
  FRONTEND_ENV.STACKS_NETWORK,
  stakingAddresses
);

console.log(`Using contract: ${contractAddress}`);
```

## Local Devnet Setup

### Prerequisites

Install Clarity DevNet:
```bash
npm install -g @stacks/clarinet
```

### Start Local Devnet

```bash
# From the staking contract directory
cd stakingContract
clarinet run

# Or with full devnet
clarinet integrate
```

### Configure Frontend for Devnet

Update `.env.local`:
```bash
NEXT_PUBLIC_STACKS_NETWORK=devnet
NEXT_PUBLIC_STAKING_CONTRACT_ADDRESS=SN2JXKMH4R3YJJ5MKBAXJ5DZX3N6Q6S59GVHWFVS7.staking
```

The frontend will automatically use `http://localhost:3999` as the RPC endpoint.

## Network Selection at Runtime

### Automatic Detection

The frontend automatically detects the network:

1. **Environment Variable**: Reads `NEXT_PUBLIC_STACKS_NETWORK`
2. **Localhost Detection**: Auto-selects devnet on localhost
3. **Default**: Falls back to mainnet

### Manual Selection

```typescript
import { useNetwork } from '@/hooks';

function App() {
  const { changeNetwork } = useNetwork();

  const switchToTestnet = async () => {
    const success = await changeNetwork('testnet');
    if (success) {
      console.log('Switched to testnet');
    }
  };

  return <button onClick={switchToTestnet}>Switch to Testnet</button>;
}
```

## Contract Addresses by Network

Ensure you have contract addresses configured for each network:

| Network | Address Format | Example |
|---------|---|---|
| Mainnet | `SP...` | `SP2JXKMH4R3YJJ5MKBAXJ5DZX3N6Q6S59GVHWFVS7.staking` |
| Testnet | `SN...` | `SN2JXKMH4R3YJJ5MKBAXJ5DZX3N6Q6S59GVHWFVS7.staking-test` |
| Devnet | `SN...` | `SN2JXKMH4R3YJJ5MKBAXJ5DZX3N6Q6S59GVHWFVS7.staking-dev` |

## Best Practices

### Development Workflow

```bash
# 1. Start with devnet locally
NEXT_PUBLIC_STACKS_NETWORK=devnet npm run dev

# 2. Test with testnet
NEXT_PUBLIC_STACKS_NETWORK=testnet npm run dev

# 3. Deploy to production
NEXT_PUBLIC_STACKS_NETWORK=mainnet npm run build
```

### Environment Safety

1. ✅ Always use `NEXT_PUBLIC_` prefix for browser-accessible vars
2. ✅ Validate network from environment variable
3. ✅ Warn users when using non-production networks
4. ✅ Never hardcode contract addresses
5. ✅ Use type-safe network selection

### Error Handling

```typescript
import { validateNetworkConfig } from '@/config';
import { FRONTEND_ENV } from '@/config';

const validation = validateNetworkConfig(FRONTEND_ENV.STACKS_NETWORK);

if (validation.warnings.length > 0) {
  console.warn('Network warnings:');
  validation.warnings.forEach(w => console.warn(`  - ${w}`));
}

if (!validation.isValid) {
  throw new Error('Invalid network configuration');
}
```

## Troubleshooting

### "Invalid network: devnet"

**Solution**: Ensure `NEXT_PUBLIC_STACKS_NETWORK` is set correctly:
```bash
echo $NEXT_PUBLIC_STACKS_NETWORK  # Should output: devnet
```

### Devnet connection errors

**Solution**: Verify local Clarity DevNet is running:
```bash
curl http://localhost:3999/healthz
```

If not running:
```bash
cd stakingContract
clarinet integrate
```

### Wrong contract address for network

**Solution**: Verify environment variables:
```bash
echo $NEXT_PUBLIC_STAKING_CONTRACT_ADDRESS
```

And check it's correct for the selected network.

## Related Documentation

- [Stacks Network Overview](https://docs.stacks.co)
- [Clarity DevNet](https://docs.stacks.co/build-apps/clarinet)
- [Stacks.js Network Configuration](https://github.com/stacks-network/stacks.js)
- [Environment Configuration Guide](./env.md)
