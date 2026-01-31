import { useCallback } from 'react';
import FRONTEND_ENV from '@/config/env';
import { getStacksNetwork } from '@/config/networks';
import { uintCV, boolCV, standardPrincipalCV } from '@stacks/transactions';
import { callReadOnlyWithRetry } from '@/services/contractService';
import { prepareStakingCall } from '@/services/contractWrite';
import { RATE_LIMITERS, RateLimitError } from '@/services/security';
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

export interface UseStakingContractOptions {
  disableRateLimiting?: boolean;
  onRateLimited?: (error: RateLimitError, action: string) => void;
}

export const useStakingContract = (opts?: UseStakingContractOptions) => {
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
   * Includes built-in rate limiting to prevent spam.
   */
  const prepareStakingCallHelper = useCallback(
    (functionName: string, params: StakingFunctionParams) => {
      const contractIdentifier = FRONTEND_ENV.STAKING_CONTRACT_ADDRESS || STAKING_CONTRACT.CONTRACT_ADDRESS;
      const [contractAddress, contractName] = contractIdentifier.split('.');
      const tokenAddress = params.token ?? FRONTEND_ENV.STAKING_TOKEN_CONTRACT;

      // Map function names to staking action types
      let action: 'stake' | 'unstake' | 'claim-rewards';
      let limiter = null;

      switch (functionName) {
        case STAKING_CONTRACT.FUNCTIONS.STAKE:
          action = 'stake';
          limiter = RATE_LIMITERS.stake;
          // Validate stake parameters
          const stakeValidation = validateStakingParams(params.amount ?? 0, tokenAddress);
          if (!stakeValidation.isValid) {
            throw new Error(stakeValidation.error || ValidationMessages.GENERAL_ERROR);
          }
          const stakeAmount = convertToSmallestUnit(stakeValidation.data ?? 0);
          break;

        case STAKING_CONTRACT.FUNCTIONS.UNSTAKE:
          action = 'unstake';
          limiter = RATE_LIMITERS.unstake;
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
          limiter = RATE_LIMITERS.claimRewards;
          // Validate claim rewards parameters
          const claimValidation = validateClaimRewardsParams(tokenAddress, params.pendingRewards ?? 0);
          if (!claimValidation.isValid) {
            throw new Error(claimValidation.error || ValidationMessages.GENERAL_ERROR);
          }
          break;

        default:
          throw new Error(`Unknown function: ${functionName}`);
      }

      // Check rate limit unless disabled
      if (!opts?.disableRateLimiting && limiter) {
        const rateLimitKey = `${action}:${contractAddress}`;
        const result = limiter.check(rateLimitKey);

        if (!result.allowed) {
          const error = new RateLimitError(
            `${action} rate limit exceeded`,
            result.resetTimeMs,
            result.remainingAttempts
          );
          opts?.onRateLimited?.(error, action);
          throw error;
        }
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
    [opts]
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
