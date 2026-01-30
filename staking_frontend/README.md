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
