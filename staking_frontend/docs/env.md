# Environment Variables (Frontend)

This file documents the environment variables used by the frontend.

- `NEXT_PUBLIC_STAKING_CONTRACT_ADDRESS` — The staking contract principal (format `SP... .contract-name`).
- `NEXT_PUBLIC_STAKING_TOKEN_CONTRACT` — The token contract principal used for staking operations.
- `NEXT_PUBLIC_STACKS_NETWORK` — `mainnet` or `testnet` (defaults to `mainnet`).
- `NEXT_PUBLIC_DEFAULT_SENDER` — Optional default sender principal used for read-only calls.

Usage:

1. Copy the example file:

```bash
cp staking_frontend/.env.local.example staking_frontend/.env.local
```

2. Edit `staking_frontend/.env.local` and set the values appropriate for your deployment.

3. Start the frontend:

```bash
cd staking_frontend
pnpm dev # or npm run dev
```
