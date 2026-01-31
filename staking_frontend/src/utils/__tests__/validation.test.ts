import { describe, it, expect } from 'vitest';
import {
  validateStakeAmount,
  validateUnstakeAmount,
  validateStacksAddress,
  validateContractIdentifier,
  validateClaimRewardsParams,
  validateStakingParams,
  validateUnstakingParams,
  convertToSmallestUnit,
  ValidationMessages,
} from '@/utils/validation';

describe('validation.ts - Amount Validators', () => {
  describe('validateStakeAmount', () => {
    it('accepts valid stake amounts', () => {
      const result = validateStakeAmount('100.5', undefined, 1000);
      expect(result.isValid).toBe(true);
      expect(result.data).toBe(100.5);
    });

    it('rejects zero amount', () => {
      const result = validateStakeAmount('0');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe(ValidationMessages.AMOUNT_ZERO);
    });

    it('rejects negative amount', () => {
      const result = validateStakeAmount('-10');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe(ValidationMessages.AMOUNT_NEGATIVE);
    });

    it('rejects non-numeric input', () => {
      const result = validateStakeAmount('abc');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe(ValidationMessages.AMOUNT_INVALID);
    });

    it('rejects amount with too many decimals', () => {
      const result = validateStakeAmount('100.1234567');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe(ValidationMessages.AMOUNT_INSUFFICIENT_PRECISION);
    });

    it('rejects empty string', () => {
      const result = validateStakeAmount('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe(ValidationMessages.AMOUNT_REQUIRED);
    });

    it('accepts 6 decimal places', () => {
      const result = validateStakeAmount('100.123456');
      expect(result.isValid).toBe(true);
      expect(result.data).toBe(100.123456);
    });

    it('trims whitespace', () => {
      const result = validateStakeAmount('  100.5  ');
      expect(result.isValid).toBe(true);
      expect(result.data).toBe(100.5);
    });

    it('checks insufficient balance when provided', () => {
      const result = validateStakeAmount('100', undefined, 50);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe(ValidationMessages.AMOUNT_INSUFFICIENT_BALANCE);
    });

    it('rejects amount exceeding max allowed', () => {
      const result = validateStakeAmount('999999999999999999');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe(ValidationMessages.AMOUNT_TOO_LARGE);
    });
  });

  describe('validateUnstakeAmount', () => {
    it('accepts valid unstake amounts', () => {
      const result = validateUnstakeAmount('50', 100);
      expect(result.isValid).toBe(true);
      expect(result.data).toBe(50);
    });

    it('rejects unstake exceeding staked amount', () => {
      const result = validateUnstakeAmount('150', 100);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe(ValidationMessages.AMOUNT_INSUFFICIENT_BALANCE);
    });

    it('rejects zero unstake', () => {
      const result = validateUnstakeAmount('0', 100);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe(ValidationMessages.AMOUNT_ZERO);
    });

    it('rejects negative unstake', () => {
      const result = validateUnstakeAmount('-10', 100);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe(ValidationMessages.AMOUNT_NEGATIVE);
    });
  });

  describe('validateClaimRewardsParams', () => {
    it('accepts claim when rewards pending', () => {
      const result = validateClaimRewardsParams(undefined, 50);
      expect(result.isValid).toBe(true);
    });

    it('rejects claim when no rewards pending', () => {
      const result = validateClaimRewardsParams(undefined, 0);
      expect(result.isValid).toBe(false);
    });

    it('rejects claim with negative rewards', () => {
      const result = validateClaimRewardsParams(undefined, -10);
      expect(result.isValid).toBe(false);
    });
  });
});

describe('validation.ts - Address Validators', () => {
  describe('validateStacksAddress', () => {
    it('accepts valid SP principal', () => {
      const result = validateStacksAddress('SP2QEZ3SJJSPRQJ16AD2TS43NZQ6QXG1EJ61ZPRKF');
      expect(result.isValid).toBe(true);
    });

    it('accepts valid SN principal', () => {
      const result = validateStacksAddress('SN2QEZ3SJJSPRQJ16AD2TS43NZQ6QXG1EJNW6Y5C6');
      expect(result.isValid).toBe(true);
    });

    it('rejects invalid address format', () => {
      const result = validateStacksAddress('INVALID123');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe(ValidationMessages.ADDRESS_INVALID);
    });

    it('rejects empty address', () => {
      const result = validateStacksAddress('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe(ValidationMessages.ADDRESS_REQUIRED);
    });

    it('rejects address with lowercase', () => {
      const result = validateStacksAddress('sp2qez3sjjsprqj16ad2ts43nzq6qxg1ej61zprkf');
      expect(result.isValid).toBe(false);
    });

    it('trims whitespace', () => {
      const result = validateStacksAddress('  SP2QEZ3SJJSPRQJ16AD2TS43NZQ6QXG1EJ61ZPRKF  ');
      expect(result.isValid).toBe(true);
    });
  });

  describe('validateContractIdentifier', () => {
    it('accepts valid contract identifier', () => {
      const result = validateContractIdentifier('SP2QEZ3SJJSPRQJ16AD2TS43NZQ6QXG1EJ61ZPRKF.staking');
      expect(result.isValid).toBe(true);
    });

    it('rejects missing contract name', () => {
      const result = validateContractIdentifier('SP2QEZ3SJJSPRQJ16AD2TS43NZQ6QXG1EJ61ZPRKF');
      expect(result.isValid).toBe(false);
    });

    it('rejects invalid address in contract identifier', () => {
      const result = validateContractIdentifier('INVALID.staking');
      expect(result.isValid).toBe(false);
    });

    it('rejects empty contract identifier', () => {
      const result = validateContractIdentifier('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe(ValidationMessages.CONTRACT_ADDRESS_INVALID);
    });

    it('rejects invalid contract name characters', () => {
      const result = validateContractIdentifier('SP2QEZ3SJJSPRQJ16AD2TS43NZQ6QXG1EJ61ZPRKF.invalid@name');
      expect(result.isValid).toBe(false);
    });
  });
});

describe('validation.ts - Composite Validators', () => {
  describe('validateStakingParams', () => {
    it('validates complete staking params', () => {
      const result = validateStakingParams('100', 'SP2QEZ3SJJSPRQJ16AD2TS43NZQ6QXG1EJ61ZPRKF.token', 500);
      expect(result.isValid).toBe(true);
    });

    it('fails on invalid amount', () => {
      const result = validateStakingParams('-10', 'SP2QEZ3SJJSPRQJ16AD2TS43NZQ6QXG1EJ61ZPRKF.token', 500);
      expect(result.isValid).toBe(false);
    });

    it('fails on invalid token contract', () => {
      const result = validateStakingParams('100', 'INVALID', 500);
      expect(result.isValid).toBe(false);
    });
  });

  describe('validateUnstakingParams', () => {
    it('validates complete unstaking params', () => {
      const result = validateUnstakingParams('50', 'SP2QEZ3SJJSPRQJ16AD2TS43NZQ6QXG1EJ61ZPRKF.token', 100);
      expect(result.isValid).toBe(true);
    });

    it('fails when unstake exceeds staked', () => {
      const result = validateUnstakingParams('150', 'SP2QEZ3SJJSPRQJ16AD2TS43NZQ6QXG1EJ61ZPRKF.token', 100);
      expect(result.isValid).toBe(false);
    });
  });
});

describe('validation.ts - Utility Functions', () => {
  describe('convertToSmallestUnit', () => {
    it('converts to microSTX (6 decimal places)', () => {
      const result = convertToSmallestUnit(100 as any);
      expect(result).toBe('100000000');
    });

    it('handles decimal amounts', () => {
      const result = convertToSmallestUnit(0.5 as any);
      expect(result).toBe('500000');
    });

    it('handles very small amounts', () => {
      const result = convertToSmallestUnit(0.000001 as any);
      expect(result).toBe('1');
    });

    it('handles large amounts', () => {
      const result = convertToSmallestUnit(1000000 as any);
      expect(result).toBe('1000000000000');
    });
  });
});
