import { describe, it, expect, beforeEach } from 'vitest';
import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v0.34.0/index.ts';

describe('Staking Contract - Error Handling Tests', () => {
  let chain: Chain;
  let accounts: Map<string, Account>;

  beforeEach(() => {
    chain = new Chain();
    accounts = chain.getAccounts();
  });

  describe('Amount Validation Errors', () => {
    it('ERR-ZERO-AMOUNT: should reject stake with zero amount', () => {
      const wallet = accounts.get('wallet_1')!;
      const block = chain.mineBlock([
        Tx.contractCall('staking', 'stake', [
          types.principal('SP2PABQVWG5FPPQSZ28MYUMQTRD5RRSJJNEQKSZEN'),
          types.uint(0),
        ], wallet.address),
      ]);

      expect(block.receipts[0].result).toEqual(types.err(types.uint(111))); // ERR-ZERO-AMOUNT
    });

    it('ERR-ZERO-AMOUNT: should reject unstake with zero amount', () => {
      const wallet = accounts.get('wallet_1')!;
      const block = chain.mineBlock([
        Tx.contractCall('staking', 'unstake', [
          types.principal('SP2PABQVWG5FPPQSZ28MYUMQTRD5RRSJJNEQKSZEN'),
          types.uint(0),
        ], wallet.address),
      ]);

      expect(block.receipts[0].result).toEqual(types.err(types.uint(111))); // ERR-ZERO-AMOUNT
    });
  });

  describe('Overflow Protection Tests', () => {
    it('ERR-OVERFLOW: should reject stake amount larger than MAX-UINT', () => {
      const wallet = accounts.get('wallet_1')!;
      const maxUint = new Uint8Array([0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff]);
      
      const block = chain.mineBlock([
        Tx.contractCall('staking', 'stake', [
          types.principal('SP2PABQVWG5FPPQSZ28MYUMQTRD5RRSJJNEQKSZEN'),
          types.uint(BigInt('0xffffffffffffffffffffffffffffffff')),
        ], wallet.address),
      ]);

      expect(block.receipts[0].result).toEqual(types.err(types.uint(113))); // ERR-AMOUNT-TOO-LARGE
    });
  });

  describe('Authorization & State Errors', () => {
    it('ERR-PAUSED: should reject stake when contract is paused', () => {
      const owner = accounts.get('deployer')!;
      const wallet = accounts.get('wallet_1')!;

      const pause_block = chain.mineBlock([
        Tx.contractCall('staking', 'set-paused', [types.bool(true)], owner.address),
      ]);

      const stake_block = chain.mineBlock([
        Tx.contractCall('staking', 'stake', [
          types.principal('SP2PABQVWG5FPPQSZ28MYUMQTRD5RRSJJNEQKSZEN'),
          types.uint(1000),
        ], wallet.address),
      ]);

      expect(stake_block.receipts[0].result).toEqual(types.err(types.uint(100))); // ERR-PAUSED
    });

    it('ERR-NOT-OWNER: should reject set-paused from non-owner', () => {
      const wallet = accounts.get('wallet_1')!;

      const block = chain.mineBlock([
        Tx.contractCall('staking', 'set-paused', [types.bool(true)], wallet.address),
      ]);

      expect(block.receipts[0].result).toEqual(types.err(types.uint(101))); // ERR-NOT-OWNER
    });

    it('ERR-NOT-OWNER: should reject set-reward-rate from non-owner', () => {
      const wallet = accounts.get('wallet_1')!;

      const block = chain.mineBlock([
        Tx.contractCall('staking', 'set-reward-rate', [types.uint(50)], wallet.address),
      ]);

      expect(block.receipts[0].result).toEqual(types.err(types.uint(101))); // ERR-NOT-OWNER
    });
  });

  describe('Rate Validation Errors', () => {
    it('ERR-RATE-TOO-HIGH: should reject reward rate exceeding limit', () => {
      const owner = accounts.get('deployer')!;

      const block = chain.mineBlock([
        Tx.contractCall('staking', 'set-reward-rate', [
          types.uint(10001), // Max is 10000
        ], owner.address),
      ]);

      expect(block.receipts[0].result).toEqual(types.err(types.uint(131))); // ERR-RATE-TOO-HIGH
    });

    it('should accept valid reward rate at max limit', () => {
      const owner = accounts.get('deployer')!;

      const block = chain.mineBlock([
        Tx.contractCall('staking', 'set-reward-rate', [
          types.uint(10000), // Max allowed
        ], owner.address),
      ]);

      expect(block.receipts[0].result).toEqual(types.ok(types.bool(true)));
    });
  });

  describe('Stake/Unstake Errors', () => {
    it('ERR-NO-STAKE: should reject unstake when user has no stake', () => {
      const wallet = accounts.get('wallet_1')!;

      const block = chain.mineBlock([
        Tx.contractCall('staking', 'unstake', [
          types.principal('SP2PABQVWG5FPPQSZ28MYUMQTRD5RRSJJNEQKSZEN'),
          types.uint(100),
        ], wallet.address),
      ]);

      expect(block.receipts[0].result).toEqual(types.err(types.uint(133))); // ERR-NO-STAKE
    });

    it('ERR-INSUFFICIENT-FUNDS: should reject unstake exceeding stake', () => {
      const wallet = accounts.get('wallet_1')!;

      // First stake some amount
      const stake_block = chain.mineBlock([
        Tx.contractCall('staking', 'stake', [
          types.principal('SP2PABQVWG5FPPQSZ28MYUMQTRD5RRSJJNEQKSZEN'),
          types.uint(100),
        ], wallet.address),
      ]);

      // Try to unstake more than staked
      const unstake_block = chain.mineBlock([
        Tx.contractCall('staking', 'unstake', [
          types.principal('SP2PABQVWG5FPPQSZ28MYUMQTRD5RRSJJNEQKSZEN'),
          types.uint(200),
        ], wallet.address),
      ]);

      expect(unstake_block.receipts[0].result).toEqual(types.err(types.uint(110))); // ERR-INSUFFICIENT-FUNDS
    });
  });

  describe('Reward Claim Errors', () => {
    it('ERR-ZERO-REWARDS: should reject claim with no rewards pending', () => {
      const wallet = accounts.get('wallet_1')!;

      const block = chain.mineBlock([
        Tx.contractCall('staking', 'claim-rewards', [
          types.principal('SP2PABQVWG5FPPQSZ28MYUMQTRD5RRSJJNEQKSZEN'),
        ], wallet.address),
      ]);

      expect(block.receipts[0].result).toEqual(
        types.err(types.uint(134)) // ERR-ZERO-REWARDS
      );
    });

    it('ERR-NO-STAKE: should reject claim when user has no stake', () => {
      const wallet = accounts.get('wallet_1')!;

      const block = chain.mineBlock([
        Tx.contractCall('staking', 'claim-rewards', [
          types.principal('SP2PABQVWG5FPPQSZ28MYUMQTRD5RRSJJNEQKSZEN'),
        ], wallet.address),
      ]);

      expect(block.receipts[0].result).toEqual(types.err(types.uint(133))); // ERR-NO-STAKE
    });
  });

  describe('Read-only Functions', () => {
    it('should retrieve user stake information', () => {
      const wallet = accounts.get('wallet_1')!;

      const block = chain.mineBlock([
        Tx.contractCall('staking', 'get-user-info', [
          types.principal(wallet.address),
        ], wallet.address),
      ]);

      expect(block.receipts[0].result).toBeOk();
    });

    it('should retrieve total staked amount', () => {
      const wallet = accounts.get('wallet_1')!;

      const block = chain.mineBlock([
        Tx.contractCall('staking', 'get-total-staked', [], wallet.address),
      ]);

      expect(block.receipts[0].result).toEqual(types.ok(types.uint(0)));
    });

    it('should retrieve current reward rate', () => {
      const wallet = accounts.get('wallet_1')!;

      const block = chain.mineBlock([
        Tx.contractCall('staking', 'get-reward-rate', [], wallet.address),
      ]);

      expect(block.receipts[0].result).toEqual(types.ok(types.uint(20))); // Default is 20
    });

    it('should check if contract is paused', () => {
      const wallet = accounts.get('wallet_1')!;

      const block = chain.mineBlock([
        Tx.contractCall('staking', 'is-contract-paused', [], wallet.address),
      ]);

      expect(block.receipts[0].result).toEqual(types.ok(types.bool(false))); // Not paused
    });
  });
});
