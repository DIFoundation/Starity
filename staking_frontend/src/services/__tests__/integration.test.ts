import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  prepareContractCall,
  prepareStakingCall,
  submitSignedTransaction,
  waitForConfirmation,
} from '@/services/contractWrite';
import { STACKS_MAINNET } from '@stacks/network';
import { principalCV, uintCV } from '@stacks/transactions';

/**
 * Integration tests for complete staking workflows.
 * 
 * These tests validate end-to-end flows:
 * - Prepare → Submit → Wait for confirmation
 * - Error recovery and retry logic
 * - Concurrent transaction handling
 */

const MOCK_CONTRACT = 'SP123456789ABCDEF123456789ABCDEF.staking';
const MOCK_TOKEN = 'SP987654321FEDCBA987654321FEDCBA.token';
const MOCK_USER = 'SPUSER123456789ABCDEF123456789ABCDEF';
const MOCK_TX_ID = 'mock-tx-id-abc123def456';

// Mock network with coreApiUrl for confirmation polling
const mockNetwork = {
  ...STACKS_MAINNET,
  coreApiUrl: 'http://localhost:3999',
};

describe('Contract Write Service - Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Complete Stake Flow', () => {
    it('prepares, submits, and confirms a stake transaction', async () => {
      // Step 1: Prepare call
      const stakeCall = prepareStakingCall({
        network: mockNetwork,
        contractAddress: MOCK_CONTRACT,
        contractName: 'staking',
        tokenContractAddress: MOCK_TOKEN,
        action: 'stake',
        amount: '1000000',
        userAddress: MOCK_USER,
      });

      expect(stakeCall.functionName).toBe('stake');
      expect(stakeCall.functionArgs).toHaveLength(2);

      // Step 2: Mock wallet signing (normally done by Connect wallet)
      const mockSignedTx = 'signed-hex-string-abc123';

      // Step 3: Mock submission response
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ txid: MOCK_TX_ID }),
      });

      const submitResult = await submitSignedTransaction(mockSignedTx, mockNetwork);

      expect(submitResult.success).toBe(true);
      expect(submitResult.txId).toBe(MOCK_TX_ID);

      // Step 4: Mock confirmation polling
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          txid: MOCK_TX_ID,
          tx_status: 'success',
          block_height: 12345,
        }),
      });

      const confirmed = await waitForConfirmation(MOCK_TX_ID, mockNetwork, 5000);

      expect(confirmed.tx_status).toBe('success');
      expect(confirmed.block_height).toBeGreaterThan(0);
    });

    it('handles stake transaction failure gracefully', async () => {
      // Prepare and submit succeed
      const stakeCall = prepareStakingCall({
        network: mockNetwork,
        contractAddress: MOCK_CONTRACT,
        contractName: 'staking',
        tokenContractAddress: MOCK_TOKEN,
        action: 'stake',
        amount: '1000000',
      });

      expect(stakeCall.functionArgs).toHaveLength(2);

      // Mock failed transaction
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          txid: MOCK_TX_ID,
          tx_status: 'failed',
          tx_result: 'err u1',
        }),
      });

      // Attempting to wait for confirmation should fail
      await expect(
        waitForConfirmation(MOCK_TX_ID, mockNetwork, 5000)
      ).rejects.toThrow('failed');
    });
  });

  describe('Complete Unstake Flow', () => {
    it('prepares and submits unstake with proper arguments', async () => {
      const unstakeCall = prepareStakingCall({
        network: mockNetwork,
        contractAddress: MOCK_CONTRACT,
        contractName: 'staking',
        tokenContractAddress: MOCK_TOKEN,
        action: 'unstake',
        amount: '500000',
      });

      expect(unstakeCall.functionName).toBe('unstake');
      expect(unstakeCall.functionArgs).toHaveLength(2);

      // Mock submission
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ txid: MOCK_TX_ID }),
      });

      const result = await submitSignedTransaction('signed-tx', mockNetwork);
      expect(result.success).toBe(true);
    });
  });

  describe('Complete Claim Rewards Flow', () => {
    it('prepares and submits claim-rewards without amount', async () => {
      const claimCall = prepareStakingCall({
        network: mockNetwork,
        contractAddress: MOCK_CONTRACT,
        contractName: 'staking',
        tokenContractAddress: MOCK_TOKEN,
        action: 'claim-rewards',
      });

      expect(claimCall.functionName).toBe('claim-rewards');
      // Claim should have only 1 arg (user principal), no amount
      expect(claimCall.functionArgs).toHaveLength(1);

      // Mock submission
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ txid: MOCK_TX_ID }),
      });

      const result = await submitSignedTransaction('signed-tx', mockNetwork);
      expect(result.success).toBe(true);
    });
  });

  describe('Network Error Handling', () => {
    it('retries on transient network errors during submission', async () => {
      const mockSignedTx = 'signed-tx';
      let attemptCount = 0;

      global.fetch = vi.fn(async () => {
        attemptCount++;
        if (attemptCount === 1) {
          throw new Error('Network timeout');
        }
        return {
          ok: true,
          json: async () => ({ txid: MOCK_TX_ID }),
        };
      });

      // Should succeed on retry
      const result = await submitSignedTransaction(mockSignedTx, mockNetwork);
      expect(result.success).toBe(true);
      expect(attemptCount).toBeGreaterThan(1);
    });

    it('respects timeout during confirmation polling', async () => {
      // Mock confirmation API to always timeout
      global.fetch = vi.fn(async () => {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              ok: true,
              json: async () => ({ txid: MOCK_TX_ID, tx_status: 'pending' }),
            });
          }, 10000); // Very long delay
        });
      });

      const timeoutMs = 1000; // 1 second timeout
      const startTime = Date.now();

      await expect(
        waitForConfirmation(MOCK_TX_ID, mockNetwork, timeoutMs)
      ).rejects.toThrow();

      const elapsed = Date.now() - startTime;
      // Should timeout around the specified time (allow 500ms buffer)
      expect(elapsed).toBeGreaterThanOrEqual(timeoutMs - 500);
    });
  });

  describe('Concurrent Transaction Handling', () => {
    it('handles multiple stake transactions concurrently', async () => {
      // Prepare three concurrent stake calls
      const calls = [
        prepareStakingCall({
          network: mockNetwork,
          contractAddress: MOCK_CONTRACT,
          contractName: 'staking',
          tokenContractAddress: MOCK_TOKEN,
          action: 'stake',
          amount: '1000000',
        }),
        prepareStakingCall({
          network: mockNetwork,
          contractAddress: MOCK_CONTRACT,
          contractName: 'staking',
          tokenContractAddress: MOCK_TOKEN,
          action: 'stake',
          amount: '2000000',
        }),
        prepareStakingCall({
          network: mockNetwork,
          contractAddress: MOCK_CONTRACT,
          contractName: 'staking',
          tokenContractAddress: MOCK_TOKEN,
          action: 'stake',
          amount: '3000000',
        }),
      ];

      expect(calls).toHaveLength(3);
      expect(calls[0].functionArgs[1]).not.toEqual(calls[1].functionArgs[1]);
      expect(calls[1].functionArgs[1]).not.toEqual(calls[2].functionArgs[1]);
    });

    it('tracks multiple transaction confirmations independently', async () => {
      const txIds = ['tx-1', 'tx-2', 'tx-3'];
      let pollCount = 0;

      global.fetch = vi.fn(async () => {
        pollCount++;
        return {
          ok: true,
          json: async () => ({
            tx_status: 'success',
            block_height: 12345,
          }),
        };
      });

      // Poll all three concurrently
      const confirmations = await Promise.all(
        txIds.map((txId) => waitForConfirmation(txId, mockNetwork, 5000))
      );

      expect(confirmations).toHaveLength(3);
      confirmations.forEach((conf) => {
        expect(conf.tx_status).toBe('success');
      });
    });
  });

  describe('Parameter Validation', () => {
    it('validates required parameters for generic prepare call', () => {
      expect(() => {
        prepareContractCall({
          network: mockNetwork,
          contractAddress: '', // Empty address should fail
          contractName: 'staking',
          functionName: 'test',
        });
      }).toThrow();
    });

    it('validates action type for prepareStakingCall', () => {
      expect(() => {
        prepareStakingCall({
          network: mockNetwork,
          contractAddress: MOCK_CONTRACT,
          contractName: 'staking',
          tokenContractAddress: MOCK_TOKEN,
          action: 'invalid-action' as any,
        });
      }).toThrow('Unknown action');
    });

    it('requires amount for stake/unstake but not for claim', () => {
      // Stake without amount should fail
      expect(() => {
        prepareStakingCall({
          network: mockNetwork,
          contractAddress: MOCK_CONTRACT,
          contractName: 'staking',
          tokenContractAddress: MOCK_TOKEN,
          action: 'stake',
          // No amount
        });
      }).toThrow('Amount required');

      // Claim without amount should succeed
      const claimCall = prepareStakingCall({
        network: mockNetwork,
        contractAddress: MOCK_CONTRACT,
        contractName: 'staking',
        tokenContractAddress: MOCK_TOKEN,
        action: 'claim-rewards',
      });

      expect(claimCall.functionArgs).toHaveLength(1);
    });
  });

  describe('Transaction Result Mapping', () => {
    it('correctly maps API response to SubmitResult', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ txid: MOCK_TX_ID }),
      });

      const result = await submitSignedTransaction('signed-tx', mockNetwork);

      expect(result).toEqual({
        success: true,
        txId: MOCK_TX_ID,
        error: undefined,
      });
    });

    it('correctly maps error responses', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
      });

      const result = await submitSignedTransaction('signed-tx', mockNetwork);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Type Compatibility', () => {
    it('prepareStakingCall result is compatible with doContractCall signature', () => {
      const result = prepareStakingCall({
        network: mockNetwork,
        contractAddress: MOCK_CONTRACT,
        contractName: 'staking',
        tokenContractAddress: MOCK_TOKEN,
        action: 'stake',
        amount: '1000000',
      });

      // Should have properties required by doContractCall
      expect(result).toHaveProperty('contractName');
      expect(result).toHaveProperty('contractAddress');
      expect(result).toHaveProperty('functionName');
      expect(result).toHaveProperty('functionArgs');
      expect(result).toHaveProperty('network');
    });

    it('submitSignedTransaction result type is correct', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ txid: MOCK_TX_ID }),
      });

      const result = await submitSignedTransaction('signed-tx', mockNetwork);

      // Type checks
      expect(typeof result.success).toBe('boolean');
      if (result.txId) {
        expect(typeof result.txId).toBe('string');
      }
      if (result.error) {
        expect(result.error).toBeInstanceOf(Error);
      }
    });
  });
});
