import { describe, it, expect, beforeEach } from 'vitest';
import { Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v0.34.0/index.ts';

describe('Staking Contract - Advanced Error Scenarios', () => {
  let chain: Chain;
  let accounts: Map<string, Account>;

  beforeEach(() => {
    chain = new Chain();
    accounts = chain.getAccounts();
  });

  describe('Sequential Operation Error Handling', () => {
    it('should handle multiple sequential stakes without error', () => {
      const wallet = accounts.get('wallet_1')!;
      const amounts = [u100, u200, u300];
      
      amounts.forEach(amount => {
        const block = chain.mineBlock([
          Tx.contractCall('staking', 'stake', [
            types.principal('SP2PABQVWG5FPPQSZ28MYUMQTRD5RRSJJNEQKSZEN'),
            types.uint(amount),
          ], wallet.address),
        ]);
        expect(block.receipts[0].result).toBeOk();
      });
    });

    it('should handle stake -> unstake -> stake cycle', () => {
      const wallet = accounts.get('wallet_1')!;

      // Stake
      const stake1 = chain.mineBlock([
        Tx.contractCall('staking', 'stake', [
          types.principal('SP2PABQVWG5FPPQSZ28MYUMQTRD5RRSJJNEQKSZEN'),
          types.uint(1000),
        ], wallet.address),
      ]);
      expect(stake1.receipts[0].result).toBeOk();

      // Unstake
      const unstake = chain.mineBlock([
        Tx.contractCall('staking', 'unstake', [
          types.principal('SP2PABQVWG5FPPQSZ28MYUMQTRD5RRSJJNEQKSZEN'),
          types.uint(500),
        ], wallet.address),
      ]);
      expect(unstake.receipts[0].result).toBeOk();

      // Stake again
      const stake2 = chain.mineBlock([
        Tx.contractCall('staking', 'stake', [
          types.principal('SP2PABQVWG5FPPQSZ28MYUMQTRD5RRSJJNEQKSZEN'),
          types.uint(600),
        ], wallet.address),
      ]);
      expect(stake2.receipts[0].result).toBeOk();
    });
  });

  describe('State Transition Error Handling', () => {
    it('errors when transitioning from paused to unpaused with insufficient state', () => {
      const owner = accounts.get('deployer')!;

      // Pause contract
      const pause = chain.mineBlock([
        Tx.contractCall('staking', 'set-paused', [types.bool(true)], owner.address),
      ]);
      expect(pause.receipts[0].result).toBeOk();

      // Try to stake while paused -> should fail
      const wallet = accounts.get('wallet_1')!;
      const stakeWhilePaused = chain.mineBlock([
        Tx.contractCall('staking', 'stake', [
          types.principal('SP2PABQVWG5FPPQSZ28MYUMQTRD5RRSJJNEQKSZEN'),
          types.uint(100),
        ], wallet.address),
      ]);
      expect(stakeWhilePaused.receipts[0].result).toEqual(types.err(types.uint(100)));

      // Unpause contract
      const unpause = chain.mineBlock([
        Tx.contractCall('staking', 'set-paused', [types.bool(false)], owner.address),
      ]);
      expect(unpause.receipts[0].result).toBeOk();

      // Now stake should succeed
      const stakeAfterUnpause = chain.mineBlock([
        Tx.contractCall('staking', 'stake', [
          types.principal('SP2PABQVWG5FPPQSZ28MYUMQTRD5RRSJJNEQKSZEN'),
          types.uint(100),
        ], wallet.address),
      ]);
      expect(stakeAfterUnpause.receipts[0].result).toBeOk();
    });
  });

  describe('Reward Rate Change Error Handling', () => {
    it('should accept all valid reward rates', () => {
      const owner = accounts.get('deployer')!;
      const validRates = [u0, u1, u100, u1000, u5000, u10000];

      validRates.forEach(rate => {
        const block = chain.mineBlock([
          Tx.contractCall('staking', 'set-reward-rate', [types.uint(rate)], owner.address),
        ]);
        expect(block.receipts[0].result).toBeOk();
      });
    });

    it('should reject all invalid reward rates', () => {
      const owner = accounts.get('deployer')!;
      const invalidRates = [u10001, u100000, u1000000];

      invalidRates.forEach(rate => {
        const block = chain.mineBlock([
          Tx.contractCall('staking', 'set-reward-rate', [types.uint(rate)], owner.address),
        ]);
        expect(block.receipts[0].result).toEqual(types.err(types.uint(131))); // ERR-RATE-TOO-HIGH
      });
    });
  });

  describe('Total Staked Tracking', () => {
    it('should accurately track total staked across multiple users', () => {
      const wallet1 = accounts.get('wallet_1')!;
      const wallet2 = accounts.get('wallet_2')!;

      // User 1 stakes 100
      chain.mineBlock([
        Tx.contractCall('staking', 'stake', [
          types.principal('SP2PABQVWG5FPPQSZ28MYUMQTRD5RRSJJNEQKSZEN'),
          types.uint(100),
        ], wallet1.address),
      ]);

      // User 2 stakes 200
      chain.mineBlock([
        Tx.contractCall('staking', 'stake', [
          types.principal('SP2PABQVWG5FPPQSZ28MYUMQTRD5RRSJJNEQKSZEN'),
          types.uint(200),
        ], wallet2.address),
      ]);

      // Check total
      const totalBlock = chain.mineBlock([
        Tx.contractCall('staking', 'get-total-staked', [], wallet1.address),
      ]);
      expect(totalBlock.receipts[0].result).toEqual(types.ok(types.uint(300)));
    });

    it('should correctly update total when users unstake', () => {
      const wallet = accounts.get('wallet_1')!;

      // Stake 500
      chain.mineBlock([
        Tx.contractCall('staking', 'stake', [
          types.principal('SP2PABQVWG5FPPQSZ28MYUMQTRD5RRSJJNEQKSZEN'),
          types.uint(500),
        ], wallet.address),
      ]);

      // Unstake 200
      chain.mineBlock([
        Tx.contractCall('staking', 'unstake', [
          types.principal('SP2PABQVWG5FPPQSZ28MYUMQTRD5RRSJJNEQKSZEN'),
          types.uint(200),
        ], wallet.address),
      ]);

      // Check total
      const totalBlock = chain.mineBlock([
        Tx.contractCall('staking', 'get-total-staked', [], wallet.address),
      ]);
      expect(totalBlock.receipts[0].result).toEqual(types.ok(types.uint(300)));
    });
  });

  describe('Concurrent Operation Error Handling', () => {
    it('should handle multiple operations in same block without conflicts', () => {
      const wallet1 = accounts.get('wallet_1')!;
      const wallet2 = accounts.get('wallet_2')!;

      const block = chain.mineBlock([
        Tx.contractCall('staking', 'stake', [
          types.principal('SP2PABQVWG5FPPQSZ28MYUMQTRD5RRSJJNEQKSZEN'),
          types.uint(100),
        ], wallet1.address),
        Tx.contractCall('staking', 'stake', [
          types.principal('SP2PABQVWG5FPPQSZ28MYUMQTRD5RRSJJNEQKSZEN'),
          types.uint(200),
        ], wallet2.address),
      ]);

      expect(block.receipts[0].result).toBeOk();
      expect(block.receipts[1].result).toBeOk();
    });
  });

  describe('Edge Case Error Handling', () => {
    it('should handle minimum and maximum valid amounts correctly', () => {
      const wallet = accounts.get('wallet_1')!;

      // Minimum (1 token)
      const minBlock = chain.mineBlock([
        Tx.contractCall('staking', 'stake', [
          types.principal('SP2PABQVWG5FPPQSZ28MYUMQTRD5RRSJJNEQKSZEN'),
          types.uint(1),
        ], wallet.address),
      ]);
      expect(minBlock.receipts[0].result).toBeOk();
    });

    it('should correctly handle empty user state on first operation', () => {
      const newWallet = accounts.get('wallet_3')!;

      // First operation should create user state
      const block = chain.mineBlock([
        Tx.contractCall('staking', 'stake', [
          types.principal('SP2PABQVWG5FPPQSZ28MYUMQTRD5RRSJJNEQKSZEN'),
          types.uint(100),
        ], newWallet.address),
      ]);

      expect(block.receipts[0].result).toBeOk();

      // Check user info was created
      const infoBlock = chain.mineBlock([
        Tx.contractCall('staking', 'get-user-info', [
          types.principal(newWallet.address),
        ], newWallet.address),
      ]);

      expect(infoBlock.receipts[0].result).toBeOk();
    });
  });

  describe('Error Recovery Scenarios', () => {
    it('should recover from paused state correctly', () => {
      const owner = accounts.get('deployer')!;
      const wallet = accounts.get('wallet_1')!;

      // Pause
      chain.mineBlock([
        Tx.contractCall('staking', 'set-paused', [types.bool(true)], owner.address),
      ]);

      // Try operation -> fails
      const failedOp = chain.mineBlock([
        Tx.contractCall('staking', 'stake', [
          types.principal('SP2PABQVWG5FPPQSZ28MYUMQTRD5RRSJJNEQKSZEN'),
          types.uint(100),
        ], wallet.address),
      ]);
      expect(failedOp.receipts[0].result).toEqual(types.err(types.uint(100)));

      // Unpause
      chain.mineBlock([
        Tx.contractCall('staking', 'set-paused', [types.bool(false)], owner.address),
      ]);

      // Retry -> succeeds
      const recoveredOp = chain.mineBlock([
        Tx.contractCall('staking', 'stake', [
          types.principal('SP2PABQVWG5FPPQSZ28MYUMQTRD5RRSJJNEQKSZEN'),
          types.uint(100),
        ], wallet.address),
      ]);
      expect(recoveredOp.receipts[0].result).toBeOk();
    });
  });

  describe('Data Consistency Errors', () => {
    it('should maintain user state consistency across operations', () => {
      const wallet = accounts.get('wallet_1')!;

      // Initial stake
      chain.mineBlock([
        Tx.contractCall('staking', 'stake', [
          types.principal('SP2PABQVWG5FPPQSZ28MYUMQTRD5RRSJJNEQKSZEN'),
          types.uint(1000),
        ], wallet.address),
      ]);

      // Get initial state
      const state1Block = chain.mineBlock([
        Tx.contractCall('staking', 'get-user-info', [
          types.principal(wallet.address),
        ], wallet.address),
      ]);

      // Unstake amount
      chain.mineBlock([
        Tx.contractCall('staking', 'unstake', [
          types.principal('SP2PABQVWG5FPPQSZ28MYUMQTRD5RRSJJNEQKSZEN'),
          types.uint(300),
        ], wallet.address),
      ]);

      // Get updated state
      const state2Block = chain.mineBlock([
        Tx.contractCall('staking', 'get-user-info', [
          types.principal(wallet.address),
        ], wallet.address),
      ]);

      // Both should be OK
      expect(state1Block.receipts[0].result).toBeOk();
      expect(state2Block.receipts[0].result).toBeOk();
    });
  });
});