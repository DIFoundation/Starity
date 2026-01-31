import { useCallback } from 'react';
import { useConnect } from '@stacks/connect-react';
import { prepareStakingCall, StakingAction } from '@/services/contractWrite';
import { RATE_LIMITERS, RateLimitError, formatWaitTime } from '@/services/security';
import { sanitizeInput } from '@/services/security';
import FRONTEND_ENV from '@/config/env';
import { getStacksNetwork } from '@/config/networks';

export interface useWalletContractCallOptions {
  onSuccess?: (txId: string) => void;
  onError?: (error: Error) => void;
  onRateLimited?: (error: RateLimitError, waitTime: string) => void;
  disableRateLimiting?: boolean;
}

/**
 * Hook to execute contract calls via the wallet (Connect).
 * Handles preparing, signing, and submitting transactions with built-in rate limiting.
 */
export function useWalletContractCall(opts?: useWalletContractCallOptions) {
  const { doContractCall } = useConnect();
  const network = getStacksNetwork(FRONTEND_ENV.STACKS_NETWORK);

  const executeStakingCall = useCallback(
    async (action: StakingAction, amount?: string | number) => {
      try {
        const [contractAddress, contractName] = (FRONTEND_ENV.STAKING_CONTRACT_ADDRESS || '').split('.');
        const tokenContractAddress = FRONTEND_ENV.STAKING_TOKEN_CONTRACT || '';

        // Check rate limit unless disabled
        if (!opts?.disableRateLimiting) {
          let limiter = null;
          if (action === 'stake') {
            limiter = RATE_LIMITERS.stake;
          } else if (action === 'unstake') {
            limiter = RATE_LIMITERS.unstake;
          } else if (action === 'claim-rewards') {
            limiter = RATE_LIMITERS.claimRewards;
          }

          if (limiter) {
            // Use contract address as the rate limit key
            const rateLimitKey = `${action}:${contractAddress}`;
            const result = limiter.check(rateLimitKey);

            if (!result.allowed) {
              const error = new RateLimitError(
                `${action} rate limit exceeded`,
                result.resetTimeMs,
                result.remainingAttempts
              );
              const waitTime = formatWaitTime(result.resetTimeMs);
              opts?.onRateLimited?.(error, waitTime);
              throw error;
            }
          }
        }

        // Sanitize inputs
        if (amount !== undefined) {
          amount = sanitizeInput(String(amount), 'amount');
        }

        // Prepare the call options
        const callOptions = prepareStakingCall({
          network,
          contractAddress,
          contractName,
          tokenContractAddress,
          action,
          amount,
        });

        // Call via Connect wallet - returns transaction result
        const result = await doContractCall({
          ...callOptions,
          userSession: undefined, // Will use current user from context
          onFinish: (data: any) => {
            const txId = data?.txId || data?.tx_id;
            opts?.onSuccess?.(txId);
          },
          onCancel: () => {
            opts?.onError?.(new Error('User cancelled transaction'));
          },
        });

        return result;
      } catch (error) {
        opts?.onError?.(error as Error);
        throw error;
      }
    },
    [doContractCall, network, opts]
  );

  return {
    executeStakingCall,
  };
}
