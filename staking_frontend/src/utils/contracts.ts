// Staking Contract ABI and Types
import FRONTEND_ENV from '@/config/env';

// Read contract address from centralized env helper (NEXT_PUBLIC_...)
const CONTRACT_ADDRESS = FRONTEND_ENV.STAKING_CONTRACT_ADDRESS ||
  'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.your-contract-name';

export const STAKING_CONTRACT = {
  // Contract identifier (can be provided via environment)
  CONTRACT_ADDRESS: CONTRACT_ADDRESS,
  
  // Function names
  FUNCTIONS: {
    // User functions
    STAKE: 'stake',
    UNSTAKE: 'unstake',
    CLAIM_REWARDS: 'claim-rewards',
    
    // Admin functions
    SET_PAUSED: 'set-paused',
  } as const,
  
  // Function parameter types
  PARAM_TYPES: {
    STAKE: {
      token: 'trait_reference',
      amount: 'uint128'
    },
    UNSTAKE: {
      token: 'trait_reference',
      amount: 'uint128'
    },
    CLAIM_REWARDS: {
      token: 'trait_reference'
    },
    SET_PAUSED: {
      status: 'bool'
    }
  }
} as const;

// Utility to split a contract identifier into address + name
export function getContractParts(identifier = STAKING_CONTRACT.CONTRACT_ADDRESS) {
  const [address, name] = identifier.split('.');
  return { address, name };
}

// Type definitions for better TypeScript support
export type StakingFunction = keyof typeof STAKING_CONTRACT.FUNCTIONS;

export interface StakingFunctionParams {
  token?: string;  // Token contract principal
  amount?: number | string;
  status?: boolean;
}

// Helper function to get function name
// This provides type safety when calling contract functions
export function getStakingFunction(
  fn: StakingFunction
): string {
  return STAKING_CONTRACT.FUNCTIONS[fn];
}

// Example usage in a component:
/*
import { STAKING_CONTRACT, getStakingFunction } from '@/utils/contracts';

// In your component:
const functionName = getStakingFunction('STAKE'); // Returns 'stake'
const contractAddress = STAKING_CONTRACT.CONTRACT_ADDRESS;
*/

// This file provides a centralized way to manage all contract interactions
// and ensures type safety across your application.
