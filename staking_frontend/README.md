This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Environment variables

Create a local copy of the example env file and update values before running the frontend:

```bash
cp .env.local.example .env.local
# then edit .env.local and set NEXT_PUBLIC_STAKING_CONTRACT_ADDRESS and NEXT_PUBLIC_STAKING_TOKEN_CONTRACT
```

You can also run the included npm script to copy the example file:

```bash
npm run env:setup
# or pnpm env:setup
```

Important variables:

- `NEXT_PUBLIC_STAKING_CONTRACT_ADDRESS` — Stacks contract principal (e.g. `SP... .contract-name`)
- `NEXT_PUBLIC_STAKING_TOKEN_CONTRACT` — Token contract principal for the staking token
- `NEXT_PUBLIC_STACKS_NETWORK` — `mainnet` or `testnet` (defaults to `mainnet`)
- `NEXT_PUBLIC_DEFAULT_SENDER` — optional default sender principal used for read-only calls

Files to update: `.env.local` in the `staking_frontend` folder. Do NOT commit `.env.local` to version control.

## Input Validation

The application includes comprehensive input validation via the `src/utils/validation.ts` module. All staking operations (stake, unstake, claim rewards) are validated before transaction submission.

### Quick Start with Validation

```typescript
import { validateStakeAmount, ValidationMessages } from '@/utils';

// In your component
const [error, setError] = useState('');

const handleStake = () => {
  const validation = validateStakeAmount(amount, undefined, userBalance);
  
  if (!validation.isValid) {
    setError(validation.error || ValidationMessages.GENERAL_ERROR);
    return;
  }
  
  // Proceed with validated amount
  const validAmount = validation.data;
  // Submit transaction...
};
```

### Validators Available

- **Amount Validators**: `validateStakeAmount`, `validateUnstakeAmount`
- **Address Validators**: `validateStacksAddress`, `validateContractIdentifier`, `validateTokenAddress`
- **Composite Validators**: `validateStakingParams`, `validateUnstakingParams`, `validateClaimRewardsParams`
- **Utilities**: `sanitizeInput`, `convertToSmallestUnit`, `convertFromSmallestUnit`

### Features

- ✅ Type-safe validation results
- ✅ User-friendly error messages
- ✅ Precision validation (6 decimal places for microSTX)
- ✅ Balance checking
- ✅ Address format validation
- ✅ Amount range validation

For detailed documentation, see [docs/validation.md](./docs/validation.md)

## Network Configuration

The staking frontend supports multiple Stacks networks: **Mainnet**, **Testnet**, and **Devnet** (local development).

### Quick Network Setup

```bash
# Development (Devnet)
NEXT_PUBLIC_STACKS_NETWORK=devnet npm run dev

# Testnet
NEXT_PUBLIC_STACKS_NETWORK=testnet npm run dev

# Mainnet (production)
NEXT_PUBLIC_STACKS_NETWORK=mainnet npm run build
```

### Supported Networks

| Network | RPC Endpoint | Use Case | Status |
|---------|---|---|---|
| **Mainnet** | https://api.mainnet.hiro.so | Production (Real STX) | 🟢 Ready |
| **Testnet** | https://api.testnet.hiro.so | Testing & Development | 🟡 Testing |
| **Devnet** | http://localhost:3999 | Local Development | 🔴 Local only |

### Network-Aware Contract Addresses

Configure contract addresses for each network:

```bash
# Mainnet
NEXT_PUBLIC_STAKING_CONTRACT_ADDRESS=SP2JXKMH4R3YJJ5MKBAXJ5DZX3N6Q6S59GVHWFVS7.staking

# Testnet
NEXT_PUBLIC_STAKING_CONTRACT_ADDRESS=SN2JXKMH4R3YJJ5MKBAXJ5DZX3N6Q6S59GVHWFVS7.staking-test

# Devnet
NEXT_PUBLIC_STAKING_CONTRACT_ADDRESS=SN2JXKMH4R3YJJ5MKBAXJ5DZX3N6Q6S59GVHWFVS7.staking-dev
```

### Runtime Network Selection

Switch networks dynamically using the `useNetwork` hook:

```typescript
import { useNetwork } from '@/hooks';

function NetworkSwitcher() {
  const { currentNetwork, networks, changeNetwork } = useNetwork();
  
  return (
    <select value={currentNetwork} onChange={(e) => changeNetwork(e.target.value)}>
      {networks.map(net => (
        <option key={net.name} value={net.name}>
          {net.displayName}
        </option>
      ))}
    </select>
  );
}
```

### Devnet Setup

To develop locally with Devnet:

1. Install Clarity DevNet:
   ```bash
   npm install -g @stacks/clarinet
   ```

2. Start Devnet:
   ```bash
   cd ../stakingContract
   clarinet integrate
   ```

3. Configure frontend:
   ```bash
   NEXT_PUBLIC_STACKS_NETWORK=devnet npm run dev
   ```

For detailed network configuration, see [docs/NETWORKS.md](./docs/NETWORKS.md).

## Header Loading and Error States

The application header now handles wallet authentication states more robustly:

- Clicking "Connect Wallet" shows a loading state (`Connecting…`) on the button while the auth flow is in progress.
- If the auth flow fails or is cancelled an inline error banner appears with `Retry` and `Dismiss` actions.
- Toast notifications surface connection success, cancellation, and errors.

This improves discoverability and helps users recover from connection failures quickly.
