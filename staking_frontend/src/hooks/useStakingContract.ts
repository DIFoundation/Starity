import { useCallback } from 'react';
import { STACKS_MAINNET, STACKS_TESTNET } from '@stacks/network';
import FRONTEND_ENV from '@/config/env';
import { fetchCallReadOnlyFunction, cvToValue, uintCV, boolCV, standardPrincipalCV } from '@stacks/transactions';
import { STAKING_CONTRACT, StakingFunction, StakingFunctionParams } from '@/utils/contracts';
import {
  validateStakingParams,
  validateUnstakingParams,
  validateClaimRewardsParams,
  convertToSmallestUnit,
  ValidationMessages,
} from '@/utils/validation';

// Choose network via centralized env helper (mainnet | testnet)
const network = (FRONTEND_ENV.STACKS_NETWORK === 'testnet') ? STACKS_TESTNET : STACKS_MAINNET;

export const useStakingContract = () => {
  // Helper function to call read-only functions
  const callReadOnly = useCallback(async (functionName: string, args: any[] = []) => {
    try {
      const senderAddress = FRONTEND_ENV.DEFAULT_SENDER || 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE';
      const contractIdentifier = FRONTEND_ENV.STAKING_CONTRACT_ADDRESS || STAKING_CONTRACT.CONTRACT_ADDRESS;
      const [contractAddress, contractName] = contractIdentifier.split('.');
      const result = await fetchCallReadOnlyFunction({
        network,
        contractAddress,
        contractName,
        functionName,
        functionArgs: args,
        senderAddress, // Default sender, can be overridden
      });
      return cvToValue(result);
    } catch (error) {
      console.error(`Error calling ${functionName}:`, error);
      throw error;
    }
  }, []);

  // Get user's staking info
  const getUserInfo = useCallback(async (userAddress: string) => {
    return callReadOnly('get-user-info', [standardPrincipalCV(userAddress)]);
  }, [callReadOnly]);

  // Get contract state
  const getContractState = useCallback(async () => {
    return {
      isPaused: await callReadOnly('get-is-paused'),
      totalStaked: await callReadOnly('get-total-staked'),
      rewardRate: await callReadOnly('get-reward-rate'),
    };
  }, [callReadOnly]);

  // Prepare transaction for write functions (with validation)
  const prepareTransaction = useCallback((functionName: string, params: StakingFunctionParams) => {
    const contractIdentifier = FRONTEND_ENV.STAKING_CONTRACT_ADDRESS || STAKING_CONTRACT.CONTRACT_ADDRESS;
    const [baseContractAddress, baseContractName] = contractIdentifier.split('.');
    const tokenAddress = params.token ?? FRONTEND_ENV.STAKING_TOKEN_CONTRACT;
    
    const baseOptions = {
      contractAddress: baseContractAddress,
      contractName: baseContractName,
      functionName,
      network,
    };

    switch (functionName) {
      case STAKING_CONTRACT.FUNCTIONS.STAKE: {
        // Validate stake parameters
        const validation = validateStakingParams(params.amount ?? 0, tokenAddress);
        if (!validation.isValid) {
          throw new Error(validation.error || ValidationMessages.GENERAL_ERROR);
        }
        
        const amount = convertToSmallestUnit(validation.data ?? 0);
        return {
          ...baseOptions,
          functionArgs: [
            standardPrincipalCV(tokenAddress!), // Token contract address
            uintCV(amount), // Amount to stake (in smallest units)
          ],
        };
      }
      case STAKING_CONTRACT.FUNCTIONS.UNSTAKE: {
        // Validate unstake parameters
        const validation = validateUnstakingParams(
          params.amount ?? 0,
          tokenAddress,
          params.stakedAmount ?? 0
        );
        if (!validation.isValid) {
          throw new Error(validation.error || ValidationMessages.GENERAL_ERROR);
        }
        
        const amount = convertToSmallestUnit(validation.data ?? 0);
        return {
          ...baseOptions,
          functionArgs: [
            standardPrincipalCV(tokenAddress!), // Token contract address
            uintCV(amount), // Amount to unstake (in smallest units)
          ],
        };
      }
      case STAKING_CONTRACT.FUNCTIONS.CLAIM_REWARDS: {
        // Validate claim rewards parameters
        const validation = validateClaimRewardsParams(tokenAddress, params.pendingRewards ?? 0);
        if (!validation.isValid) {
          throw new Error(validation.error || ValidationMessages.GENERAL_ERROR);
        }
        
        return {
          ...baseOptions,
          functionArgs: [
            standardPrincipalCV(tokenAddress!), // Token contract address
          ],
        };
      }
      case STAKING_CONTRACT.FUNCTIONS.SET_PAUSED:
        return {
          ...baseOptions,
          functionArgs: [
            boolCV(params.status!), // Pause status
          ],
        };
      default:
        throw new Error(`Unknown function: ${functionName}`);
    }
  }, []);

  return {
    // Read functions
    getUserInfo,
    getContractState,
    
    // Write functions (these need to be used with @stacks/connect or similar)
    prepareTransaction,
    
    // Constants
    CONTRACT_ADDRESS: STAKING_CONTRACT.CONTRACT_ADDRESS,
    FUNCTIONS: STAKING_CONTRACT.FUNCTIONS,
  };
};

// Example usage in a component:
/*
import { useStakingContract } from '@/hooks/useStakingContract';

function StakingComponent() {
  const { 
    getUserInfo, 
    getContractState, 
    prepareTransaction,
    CONTRACT_ADDRESS,
    FUNCTIONS 
  } = useStakingContract();
  
  // Example: Get user info
  const fetchUserInfo = async () => {
    const userData = await getUserInfo(userAddress);
    console.log('User staking info:', userData);
  };
  
  // Example: Prepare a stake transaction (uses env default token if not provided)
  const handleStake = async () => {
    const txOptions = prepareTransaction(FUNCTIONS.STAKE, {
      // `token` can be omitted to use NEXT_PUBLIC_STAKING_TOKEN_CONTRACT from env
      amount: 1000000, // Amount in the smallest unit
    });
    
    // Use with @stacks/connect or your preferred wallet connection
    // await doContractCall(txOptions);
  };
  
  // ... rest of your component
}
*/
