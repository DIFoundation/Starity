import { useCallback } from 'react';
import { useConnect } from '@stacks/connect-react';
import { prepareStakingCall, StakingAction } from '@/services/contractWrite';
import FRONTEND_ENV from '@/config/env';
import { getStacksNetwork } from '@/config/networks';

export interface useWalletContractCallOptions {
  onSuccess?: (txId: string) => void;
  onError?: (error: Error) => void;
}

/**
 * Hook to execute contract calls via the wallet (Connect).
 * Handles preparing, signing, and submitting transactions.
 */
export function useWalletContractCall(opts?: useWalletContractCallOptions) {
  const { doContractCall } = useConnect();
  const network = getStacksNetwork(FRONTEND_ENV.STACKS_NETWORK);

  const executeStakingCall = useCallback(
    async (action: StakingAction, amount?: string | number) => {
      try {
        const [contractAddress, contractName] = (FRONTEND_ENV.STAKING_CONTRACT_ADDRESS || '').split('.');
        const tokenContractAddress = FRONTEND_ENV.STAKING_TOKEN_CONTRACT || '';

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
    [doContractCall, network]
  );

  return {
    executeStakingCall,
  };
}
