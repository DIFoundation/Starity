// Centralized environment helper for the frontend
// Reads NEXT_PUBLIC_* environment variables (exposed to the browser by Next.js)
import { NetworkType, isValidNetwork } from './networks';

export interface FrontendEnv {
  STAKING_CONTRACT_ADDRESS: string;
  STAKING_TOKEN_CONTRACT: string;
  STACKS_NETWORK: NetworkType;
  DEFAULT_SENDER: string;
}

/**
 * Validates and normalizes network from environment variable
 * @param network - Network string from environment
 * @returns Valid NetworkType or 'mainnet' as default
 */
function validateNetworkEnv(network: string | undefined): NetworkType {
  if (!network) return 'mainnet';
  
  const normalized = network.toLowerCase().trim();
  if (isValidNetwork(normalized)) {
    return normalized;
  }
  
  console.warn(
    `Invalid NEXT_PUBLIC_STACKS_NETWORK value: "${network}". ` +
    `Supported values: mainnet, testnet, devnet. Defaulting to mainnet.`
  );
  return 'mainnet';
}

export const FRONTEND_ENV: FrontendEnv = {
  STAKING_CONTRACT_ADDRESS: process.env.NEXT_PUBLIC_STAKING_CONTRACT_ADDRESS ?? '',
  STAKING_TOKEN_CONTRACT: process.env.NEXT_PUBLIC_STAKING_TOKEN_CONTRACT ?? '',
  STACKS_NETWORK: validateNetworkEnv(process.env.NEXT_PUBLIC_STACKS_NETWORK),
  DEFAULT_SENDER: process.env.NEXT_PUBLIC_DEFAULT_SENDER ?? '',
};

export default FRONTEND_ENV;
