// Centralized environment helper for the frontend
// Reads NEXT_PUBLIC_* environment variables (exposed to the browser by Next.js)
export const FRONTEND_ENV = {
  STAKING_CONTRACT_ADDRESS: process.env.NEXT_PUBLIC_STAKING_CONTRACT_ADDRESS ?? '',
  STAKING_TOKEN_CONTRACT: process.env.NEXT_PUBLIC_STAKING_TOKEN_CONTRACT ?? '',
  STACKS_NETWORK: process.env.NEXT_PUBLIC_STACKS_NETWORK ?? 'mainnet',
  DEFAULT_SENDER: process.env.NEXT_PUBLIC_DEFAULT_SENDER ?? '',
};

export default FRONTEND_ENV;
