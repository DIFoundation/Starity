import { useCallback } from 'react';
import { StacksTestnet } from '@stacks/network';
import { callReadOnlyFunction, cvToValue, uintCV, boolCV, standardPrincipalCV } from '@stacks/transactions';
import { STAKING_CONTRACT, StakingFunction, StakingFunctionParams } from '@/utils/contracts';

// Update this with your Stacks network configuration
const network = new StacksTestnet({
  url: 'https://stacks-testnet.regtest.constantine2.blockscout.com',
});

export const useStakingContract = () => {
  // Helper function to call read-only functions
  const callReadOnly = useCallback(async (functionName: string, args: any[] = []) => {
    try {
      const result = await callReadOnlyFunction({
        network,
        contractAddress: STAKING_CONTRACT.CONTRACT_ADDRESS.split('.')[0],
        contractName: STAKING_CONTRACT.CONTRACT_ADDRESS.split('.')[1],
        functionName,
        functionArgs: args,
        senderAddress: 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE', // Default sender, can be overridden
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

  // Prepare transaction for write functions
  const prepareTransaction = useCallback((functionName: string, params: StakingFunctionParams) => {
    const baseOptions = {
      contractAddress: STAKING_CONTRACT.CONTRACT_ADDRESS.split('.')[0],
      contractName: STAKING_CONTRACT.CONTRACT_ADDRESS.split('.')[1],
      functionName,
      network,
    };

    switch (functionName) {
      case STAKING_CONTRACT.FUNCTIONS.STAKE:
      case STAKING_CONTRACT.FUNCTIONS.UNSTAKE:
        return {
          ...baseOptions,
          functionArgs: [
            standardPrincipalCV(params.token!), // Token contract address
            uintCV(params.amount!), // Amount to stake/unstake
          ],
        };
      case STAKING_CONTRACT.FUNCTIONS.CLAIM_REWARDS:
        return {
          ...baseOptions,
          functionArgs: [
            standardPrincipalCV(params.token!), // Token contract address
          ],
        };
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
  
  // Example: Prepare a stake transaction
  const handleStake = async () => {
    const txOptions = prepareTransaction(FUNCTIONS.STAKE, {
      token: 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.your-token-contract',
      amount: 1000000, // Amount in the smallest unit
    });
    
    // Use with @stacks/connect or your preferred wallet connection
    // await doContractCall(txOptions);
  };
  
  // ... rest of your component
}
*/
