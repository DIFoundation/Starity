// Staking Contract ABI and Types
export const STAKING_CONTRACT = {
  // Contract identifier (update this with your actual contract address and name)
  CONTRACT_ADDRESS: 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.your-contract-name',
  
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
