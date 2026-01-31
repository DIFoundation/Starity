import { useCallback } from 'react';
import FRONTEND_ENV from '@/config/env';
import { getStacksNetwork } from '@/config/networks';
import { uintCV, boolCV, standardPrincipalCV } from '@stacks/transactions';
import { callReadOnlyWithRetry } from '@/services/contractService';
import { prepareStakingCall } from '@/services/contractWrite';
import { STAKING_CONTRACT, StakingFunction, StakingFunctionParams } from '@/utils/contracts';
import {
  validateStakingParams,
  validateUnstakingParams,
  validateClaimRewardsParams,
  convertToSmallestUnit,
  ValidationMessages,
} from '@/utils/validation';

// Get network from centralized config with support for mainnet, testnet, devnet
const network = getStacksNetwork(FRONTEND_ENV.STACKS_NETWORK);

export const useStakingContract = () => {
  // Helper function to call read-only functions
  const callReadOnly = useCallback(async (functionName: string, args: any[] = []) => {
    const senderAddress = FRONTEND_ENV.DEFAULT_SENDER || 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE';
    const contractIdentifier = FRONTEND_ENV.STAKING_CONTRACT_ADDRESS || STAKING_CONTRACT.CONTRACT_ADDRESS;
    try {
      return await callReadOnlyWithRetry({
        network,
        contractIdentifier,
        functionName,
        functionArgs: args,
        senderAddress,
      });
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

  /**
   * Prepare a staking call (delegation to service layer).
   * Returns transaction options that can be used with @stacks/connect doContractCall.
   */
  const prepareStakingCallHelper = useCallback(
    (functionName: string, params: StakingFunctionParams) => {
      const contractIdentifier = FRONTEND_ENV.STAKING_CONTRACT_ADDRESS || STAKING_CONTRACT.CONTRACT_ADDRESS;
      const [contractAddress, contractName] = contractIdentifier.split('.');
      const tokenAddress = params.token ?? FRONTEND_ENV.STAKING_TOKEN_CONTRACT;

      // Map function names to staking action types
      let action: 'stake' | 'unstake' | 'claim-rewards';
      switch (functionName) {
        case STAKING_CONTRACT.FUNCTIONS.STAKE:
          action = 'stake';
          // Validate stake parameters
          const stakeValidation = validateStakingParams(params.amount ?? 0, tokenAddress);
          if (!stakeValidation.isValid) {
            throw new Error(stakeValidation.error || ValidationMessages.GENERAL_ERROR);
          }
          const stakeAmount = convertToSmallestUnit(stakeValidation.data ?? 0);
          break;

        case STAKING_CONTRACT.FUNCTIONS.UNSTAKE:
          action = 'unstake';
          // Validate unstake parameters
          const unstakeValidation = validateUnstakingParams(
            params.amount ?? 0,
            tokenAddress,
            params.stakedAmount ?? 0
          );
          if (!unstakeValidation.isValid) {
            throw new Error(unstakeValidation.error || ValidationMessages.GENERAL_ERROR);
          }
          const unstakeAmount = convertToSmallestUnit(unstakeValidation.data ?? 0);
          break;

        case STAKING_CONTRACT.FUNCTIONS.CLAIM_REWARDS:
          action = 'claim-rewards';
          // Validate claim rewards parameters
          const claimValidation = validateClaimRewardsParams(tokenAddress, params.pendingRewards ?? 0);
          if (!claimValidation.isValid) {
            throw new Error(claimValidation.error || ValidationMessages.GENERAL_ERROR);
          }
          break;

        default:
          throw new Error(`Unknown function: ${functionName}`);
      }

      // Delegate to service layer for transaction preparation
      return prepareStakingCall({
        network,
        contractAddress,
        contractName,
        tokenContractAddress: tokenAddress!,
        action,
        amount: params.amount,
      });
    },
    []
  );

  /**
   * Prepare transaction for write functions (legacy API compatibility).
   * Uses validation and delegates to prepareStakingCallHelper.
   */
  const prepareTransaction = useCallback((functionName: string, params: StakingFunctionParams) => {
    return prepareStakingCallHelper(functionName, params);
  }, [prepareStakingCallHelper]);

  return {
    // Read functions
    getUserInfo,
    getContractState,

    // Write functions (these need to be used with @stacks/connect or similar)
    prepareTransaction,
    prepareStakingCallHelper,

    // Constants
    CONTRACT_ADDRESS: STAKING_CONTRACT.CONTRACT_ADDRESS,
    FUNCTIONS: STAKING_CONTRACT.FUNCTIONS,
  };
};
