import { describe, it, expect, beforeEach } from 'vitest';
import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v0.34.0/index.ts';

describe('Staking Token - Error Handling Tests', () => {
  let chain: Chain;
  let accounts: Map<string, Account>;

  beforeEach(() => {
    chain = new Chain();
    accounts = chain.getAccounts();
  });

  describe('Authorization Errors', () => {
    it('ERR-OWNER-ONLY: should reject set-minter from non-owner', () => {
      const wallet = accounts.get('wallet_1')!;
      const newMinter = accounts.get('wallet_2')!;

      const block = chain.mineBlock([
        Tx.contractCall('staking-token', 'set-minter', [
          types.principal(newMinter.address),
        ], wallet.address),
      ]);

      expect(block.receipts[0].result).toEqual(types.err(types.uint(100))); // ERR-OWNER-ONLY
    });

    it('ERR-NOT-AUTHORIZED: should reject mint-for-protocol from non-minter', () => {
      const wallet = accounts.get('wallet_1')!;

      const block = chain.mineBlock([
        Tx.contractCall('staking-token', 'mint-for-protocol', [
          types.uint(1000),
          types.principal(wallet.address),
        ], wallet.address),
      ]);

      expect(block.receipts[0].result).toEqual(types.err(types.uint(102))); // ERR-NOT-AUTHORIZED
    });

    it('ERR-NOT-TOKEN-OWNER: should reject burn from non-owner', () => {
      const wallet1 = accounts.get('wallet_1')!;
      const wallet2 = accounts.get('wallet_2')!;

      // Mint tokens to wallet1
      const owner = accounts.get('deployer')!;
      const mint_block = chain.mineBlock([
        Tx.contractCall('staking-token', 'set-minter', [
          types.principal(owner.address),
        ], owner.address),
      ]);

      // Try to burn from wallet2 (not owner)
      const burn_block = chain.mineBlock([
        Tx.contractCall('staking-token', 'burn', [
          types.uint(100),
          types.principal(wallet1.address),
        ], wallet2.address),
      ]);

      expect(burn_block.receipts[0].result).toEqual(types.err(types.uint(101))); // ERR-NOT-TOKEN-OWNER
    });

    it('ERR-NOT-TOKEN-OWNER: should reject transfer from non-owner', () => {
      const wallet1 = accounts.get('wallet_1')!;
      const wallet2 = accounts.get('wallet_2')!;

      const block = chain.mineBlock([
        Tx.contractCall('staking-token', 'transfer', [
          types.uint(100),
          types.principal(wallet1.address),
          types.principal(wallet2.address),
          types.none(),
        ], wallet2.address),
      ]);

      expect(block.receipts[0].result).toEqual(types.err(types.uint(101))); // ERR-NOT-TOKEN-OWNER
    });
  });

  describe('Amount Validation Errors', () => {
    it('ERR-ZERO-AMOUNT: should reject mint with zero amount', () => {
      const wallet = accounts.get('wallet_1')!;

      const block = chain.mineBlock([
        Tx.contractCall('staking-token', 'mint-for-protocol', [
          types.uint(0),
          types.principal(wallet.address),
        ], wallet.address),
      ]);

      expect(block.receipts[0].result).toEqual(types.err(types.uint(120))); // ERR-ZERO-AMOUNT
    });

    it('ERR-ZERO-AMOUNT: should reject burn with zero amount', () => {
      const wallet = accounts.get('wallet_1')!;

      const block = chain.mineBlock([
        Tx.contractCall('staking-token', 'burn', [
          types.uint(0),
          types.principal(wallet.address),
        ], wallet.address),
      ]);

      expect(block.receipts[0].result).toEqual(types.err(types.uint(120))); // ERR-ZERO-AMOUNT
    });

    it('ERR-ZERO-AMOUNT: should reject transfer with zero amount', () => {
      const wallet1 = accounts.get('wallet_1')!;
      const wallet2 = accounts.get('wallet_2')!;

      const block = chain.mineBlock([
        Tx.contractCall('staking-token', 'transfer', [
          types.uint(0),
          types.principal(wallet1.address),
          types.principal(wallet2.address),
          types.none(),
        ], wallet1.address),
      ]);

      expect(block.receipts[0].result).toEqual(types.err(types.uint(120))); // ERR-ZERO-AMOUNT
    });
  });

  describe('Cooldown Errors', () => {
    it('ERR-MINT-COOLDOWN-ACTIVE: should reject second mint within 24 hours', () => {
      const wallet = accounts.get('wallet_1')!;

      // First mint
      const mint1 = chain.mineBlock([
        Tx.contractCall('staking-token', 'mint', [], wallet.address),
      ]);
      expect(mint1.receipts[0].result).toBeOk();

      // Try to mint again immediately
      const mint2 = chain.mineBlock([
        Tx.contractCall('staking-token', 'mint', [], wallet.address),
      ]);

      expect(mint2.receipts[0].result).toEqual(types.err(types.uint(111))); // ERR-MINT-COOLDOWN-ACTIVE
    });
  });

  describe('Balance & Supply Errors', () => {
    it('ERR-INSUFFICIENT-BALANCE: should reject burn exceeding balance', () => {
      const owner = accounts.get('deployer')!;
      const wallet = accounts.get('wallet_1')!;

      // Set owner as minter
      const set_minter = chain.mineBlock([
        Tx.contractCall('staking-token', 'set-minter', [
          types.principal(owner.address),
        ], owner.address),
      ]);

      // Mint tokens to wallet
      const mint_block = chain.mineBlock([
        Tx.contractCall('staking-token', 'mint-for-protocol', [
          types.uint(100),
          types.principal(wallet.address),
        ], owner.address),
      ]);

      // Try to burn more than balance
      const burn_block = chain.mineBlock([
        Tx.contractCall('staking-token', 'burn', [
          types.uint(200),
          types.principal(wallet.address),
        ], wallet.address),
      ]);

      expect(burn_block.receipts[0].result).toEqual(types.err(types.uint(121))); // ERR-INSUFFICIENT-BALANCE
    });

    it('ERR-SUPPLY-EXCEEDED: should reject mint exceeding max supply', () => {
      const owner = accounts.get('deployer')!;
      const wallet = accounts.get('wallet_1')!;

      // Set owner as minter
      const set_minter = chain.mineBlock([
        Tx.contractCall('staking-token', 'set-minter', [
          types.principal(owner.address),
        ], owner.address),
      ]);

      // Try to mint amount exceeding max supply
      const mint_block = chain.mineBlock([
        Tx.contractCall('staking-token', 'mint-for-protocol', [
          types.uint(BigInt('0xffffffffffffffffffffffffffffffff')), // Very large amount
          types.principal(wallet.address),
        ], owner.address),
      ]);

      expect(mint_block.receipts[0].result).toEqual(types.err(types.uint(132))); // ERR-SUPPLY-EXCEEDED
    });
  });

  describe('Recipient Validation Errors', () => {
    it('ERR-INVALID-RECIPIENT: should reject transfer to self', () => {
      const owner = accounts.get('deployer')!;
      const wallet = accounts.get('wallet_1')!;

      // Set up: mint some tokens
      const set_minter = chain.mineBlock([
        Tx.contractCall('staking-token', 'set-minter', [
          types.principal(owner.address),
        ], owner.address),
      ]);

      const mint_block = chain.mineBlock([
        Tx.contractCall('staking-token', 'mint-for-protocol', [
          types.uint(1000),
          types.principal(wallet.address),
        ], owner.address),
      ]);

      // Try to transfer to self
      const transfer_block = chain.mineBlock([
        Tx.contractCall('staking-token', 'transfer', [
          types.uint(100),
          types.principal(wallet.address),
          types.principal(wallet.address), // Same as sender
          types.none(),
        ], wallet.address),
      ]);

      expect(transfer_block.receipts[0].result).toEqual(types.err(types.uint(143))); // ERR-INVALID-RECIPIENT
    });
  });

  describe('Read-only Functions', () => {
    it('should get balance of account', () => {
      const wallet = accounts.get('wallet_1')!;

      const block = chain.mineBlock([
        Tx.contractCall('staking-token', 'get-balance', [
          types.principal(wallet.address),
        ], wallet.address),
      ]);

      expect(block.receipts[0].result).toBeOk();
    });

    it('should get total supply', () => {
      const wallet = accounts.get('wallet_1')!;

      const block = chain.mineBlock([
        Tx.contractCall('staking-token', 'get-total-supply', [], wallet.address),
      ]);

      expect(block.receipts[0].result).toBeOk();
    });

    it('should get token name', () => {
      const wallet = accounts.get('wallet_1')!;

      const block = chain.mineBlock([
        Tx.contractCall('staking-token', 'get-name', [], wallet.address),
      ]);

      expect(block.receipts[0].result).toEqual(types.ok(types.ascii('Staking Token')));
    });

    it('should get token symbol', () => {
      const wallet = accounts.get('wallet_1')!;

      const block = chain.mineBlock([
        Tx.contractCall('staking-token', 'get-symbol', [], wallet.address),
      ]);

      expect(block.receipts[0].result).toEqual(types.ok(types.ascii('STK')));
    });

    it('should get token decimals', () => {
      const wallet = accounts.get('wallet_1')!;

      const block = chain.mineBlock([
        Tx.contractCall('staking-token', 'get-decimals', [], wallet.address),
      ]);

      expect(block.receipts[0].result).toEqual(types.ok(types.uint(18)));
    });

    it('should get token URI', () => {
      const wallet = accounts.get('wallet_1')!;

      const block = chain.mineBlock([
        Tx.contractCall('staking-token', 'get-token-uri', [], wallet.address),
      ]);

      expect(block.receipts[0].result).toEqual(types.ok(types.none()));
    });
  });
});
