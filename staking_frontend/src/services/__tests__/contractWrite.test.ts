import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  prepareContractCall,
  prepareStakingCall,
  submitSignedTransaction,
  waitForConfirmation,
} from '@/services/contractWrite';
import { ContractServiceError } from '@/services/errors';

describe('services/contractWrite.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('prepareContractCall', () => {
    it('prepares a contract call with valid options', () => {
      const result = prepareContractCall({
        network: {} as any,
        contractAddress: 'SP123',
        contractName: 'staking',
        functionName: 'stake',
        functionArgs: ['arg1', 'arg2'],
      });

      expect(result.contractAddress).toBe('SP123');
      expect(result.contractName).toBe('staking');
      expect(result.functionName).toBe('stake');
      expect(result.functionArgs).toEqual(['arg1', 'arg2']);
    });

    it('throws error for missing contract address', () => {
      expect(() =>
        prepareContractCall({
          network: {} as any,
          contractAddress: '',
          contractName: 'staking',
          functionName: 'stake',
        })
      ).toThrow(ContractServiceError);
    });

    it('throws error for missing contract name', () => {
      expect(() =>
        prepareContractCall({
          network: {} as any,
          contractAddress: 'SP123',
          contractName: '',
          functionName: 'stake',
        })
      ).toThrow(ContractServiceError);
    });

    it('includes optional fields (fee, nonce, postConditions)', () => {
      const result = prepareContractCall({
        network: {} as any,
        contractAddress: 'SP123',
        contractName: 'staking',
        functionName: 'stake',
        fee: 1000,
        nonce: 5,
        postConditionMode: 'allow',
      });

      expect(result.fee).toBe(1000);
      expect(result.nonce).toBe(5);
      expect(result.postConditionMode).toBe('allow');
    });
  });

  describe('prepareStakingCall', () => {
    const defaultOpts = {
      network: {} as any,
      contractAddress: 'SP123',
      contractName: 'staking',
      tokenContractAddress: 'SP456.token',
    };

    it('prepares a stake call', () => {
      const result = prepareStakingCall({
        ...defaultOpts,
        action: 'stake',
        amount: '1000000',
      });

      expect(result.functionName).toBe('stake');
      expect(result.functionArgs.length).toBe(2);
    });

    it('prepares an unstake call', () => {
      const result = prepareStakingCall({
        ...defaultOpts,
        action: 'unstake',
        amount: '500000',
      });

      expect(result.functionName).toBe('unstake');
      expect(result.functionArgs.length).toBe(2);
    });

    it('prepares a claim-rewards call', () => {
      const result = prepareStakingCall({
        ...defaultOpts,
        action: 'claim-rewards',
      });

      expect(result.functionName).toBe('claim-rewards');
      expect(result.functionArgs.length).toBe(1);
    });

    it('throws error for stake without amount', () => {
      expect(() =>
        prepareStakingCall({
          ...defaultOpts,
          action: 'stake',
        })
      ).toThrow(ContractServiceError);
    });

    it('throws error for unstake without amount', () => {
      expect(() =>
        prepareStakingCall({
          ...defaultOpts,
          action: 'unstake',
        })
      ).toThrow(ContractServiceError);
    });

    it('throws error for unknown action', () => {
      expect(() =>
        prepareStakingCall({
          ...defaultOpts,
          action: 'invalid-action' as any,
        })
      ).toThrow(ContractServiceError);
    });

    it('throws error for missing contract parameters', () => {
      expect(() =>
        prepareStakingCall({
          network: {} as any,
          contractAddress: '',
          contractName: 'staking',
          tokenContractAddress: 'SP456.token',
          action: 'stake',
          amount: '1000',
        })
      ).toThrow(ContractServiceError);
    });
  });

  describe('submitSignedTransaction', () => {
    beforeEach(() => {
      vi.doMock('@stacks/transactions', () => ({
        broadcastTransaction: vi.fn(),
      }));
    });

    it('submits a signed transaction successfully', async () => {
      const mockTx = { tx_id: 'mock-tx-123', data: 'signed-hex' };
      
      // Mock fetch for the broadcast
      global.fetch = vi.fn().mockResolvedValueOnce({
        status: 200,
        json: () => Promise.resolve({ txId: 'mock-tx-123' }),
      });

      // In a real scenario, broadcastTransaction would be called
      // For this test, we verify structure
      const result = await submitSignedTransaction(mockTx, { coreApiUrl: 'http://localhost:3999' });
      
      expect(result.success).toBe(true);
    });

    it('throws error on broadcast failure', async () => {
      global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

      await expect(
        submitSignedTransaction({}, { coreApiUrl: 'http://localhost:3999' })
      ).rejects.toThrow(ContractServiceError);
    });
  });

  describe('waitForConfirmation', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('waits for transaction confirmation', async () => {
      const mockNetwork = { coreApiUrl: 'http://localhost:3999' };
      let callCount = 0;

      global.fetch = vi.fn(() => {
        callCount++;
        // First call returns 404, second returns confirmed
        if (callCount === 1) {
          return Promise.resolve({ status: 404 });
        }
        return Promise.resolve({
          status: 200,
          json: () => Promise.resolve({ tx_status: 'success' }),
        });
      });

      const promise = waitForConfirmation('tx-123', mockNetwork, 60_000, 100);
      
      vi.advanceTimersByTime(100);
      await vi.runOnlyPendingTimersAsync();
      
      vi.advanceTimersByTime(100);
      await vi.runOnlyPendingTimersAsync();

      const result = await promise;
      expect(result).toBeDefined();
      expect(result.tx_status).toBe('success');
    });

    it('throws error if confirmation times out', async () => {
      const mockNetwork = { coreApiUrl: 'http://localhost:3999' };

      global.fetch = vi.fn().mockResolvedValue({
        status: 404, // Always 404 (not found)
      });

      const promise = waitForConfirmation('tx-123', mockNetwork, 1000, 500);
      
      vi.advanceTimersByTime(1000);
      await vi.runOnlyPendingTimersAsync();

      await expect(promise).rejects.toThrow(ContractServiceError);
    });

    it('throws error if transaction failed', async () => {
      const mockNetwork = { coreApiUrl: 'http://localhost:3999' };

      global.fetch = vi.fn().mockResolvedValueOnce({
        status: 200,
        json: () => Promise.resolve({ tx_status: 'failed' }),
      });

      await expect(
        waitForConfirmation('tx-123', mockNetwork, 60_000, 100)
      ).rejects.toThrow(ContractServiceError);
    });

    it('throws error if network has no core API URL', async () => {
      const mockNetwork = {};

      await expect(
        waitForConfirmation('tx-123', mockNetwork, 60_000, 100)
      ).rejects.toThrow(ContractServiceError);
    });
  });
});
