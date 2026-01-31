import { describe, it, expect } from 'vitest';
import {
  sanitizeStakingForm,
  validateAddressSafely,
  validateAmountSafely,
  escapeHtml,
  displayAddress,
  truncateAddress,
} from '@/services/sanitization';
import { SecurityError } from '@/services/security';

describe('services/sanitization.ts', () => {
  describe('sanitizeStakingForm', () => {
    it('sanitizes valid form data', () => {
      const result = sanitizeStakingForm({
        amount: '1000.50',
        userAddress: 'SP2XNWLQF7HJFXPSJFYHD98N3YZFC52H8TE4TSPJ',
      });

      expect(result.success).toBe(true);
      expect(result.data?.amount).toBe('1000.50');
      expect(result.data?.userAddress).toBe('SP2XNWLQF7HJFXPSJFYHD98N3YZFC52H8TE4TSPJ');
    });

    it('returns error for invalid amount', () => {
      const result = sanitizeStakingForm({
        amount: 'invalid',
        userAddress: 'SP2XNWLQF7HJFXPSJFYHD98N3YZFC52H8TE4TSPJ',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(SecurityError);
    });

    it('returns error for invalid address', () => {
      const result = sanitizeStakingForm({
        amount: '1000',
        userAddress: 'invalid-address',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(SecurityError);
    });

    it('handles missing fields', () => {
      const result = sanitizeStakingForm({});

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('sanitizes whitespace in inputs', () => {
      const result = sanitizeStakingForm({
        amount: '  1000  ',
        userAddress: '  SP2XNWLQF7HJFXPSJFYHD98N3YZFC52H8TE4TSPJ  ',
      });

      expect(result.success).toBe(true);
      expect(result.data?.amount).toBe('1000');
      expect(result.data?.userAddress).toBe('SP2XNWLQF7HJFXPSJFYHD98N3YZFC52H8TE4TSPJ');
    });
  });

  describe('validateAddressSafely', () => {
    it('validates correct address', () => {
      const result = validateAddressSafely('SP2XNWLQF7HJFXPSJFYHD98N3YZFC52H8TE4TSPJ');
      expect(result.valid).toBe(true);
      expect(result.message).toBeUndefined();
    });

    it('returns error for empty address', () => {
      const result = validateAddressSafely('');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('required');
    });

    it('returns error for invalid address', () => {
      const result = validateAddressSafely('invalid');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('Invalid');
    });

    it('returns error for HTML injection attempt', () => {
      const result = validateAddressSafely('<script>alert("xss")</script>');
      expect(result.valid).toBe(false);
    });
  });

  describe('validateAmountSafely', () => {
    it('validates valid amount', () => {
      const result = validateAmountSafely('1000.50');
      expect(result.valid).toBe(true);
      expect(result.message).toBeUndefined();
    });

    it('validates zero amount', () => {
      const result = validateAmountSafely('0');
      expect(result.valid).toBe(true);
    });

    it('validates numeric type', () => {
      const result = validateAmountSafely(1000);
      expect(result.valid).toBe(true);
    });

    it('returns error for invalid amount', () => {
      const result = validateAmountSafely('invalid');
      expect(result.valid).toBe(false);
      expect(result.message).toBeDefined();
    });

    it('returns error for negative amount', () => {
      const result = validateAmountSafely('-100');
      expect(result.valid).toBe(false);
    });

    it('returns error for empty string', () => {
      const result = validateAmountSafely('');
      expect(result.valid).toBe(false);
    });
  });

  describe('escapeHtml', () => {
    it('escapes HTML tags', () => {
      const result = escapeHtml('<script>alert("xss")</script>');
      expect(result).toContain('&lt;');
      expect(result).toContain('&gt;');
    });

    it('escapes quotes', () => {
      const result = escapeHtml('Hello "World"');
      expect(result).toContain('&quot;');
    });

    it('preserves regular text', () => {
      const result = escapeHtml('Hello World');
      expect(result).toBe('Hello World');
    });

    it('handles mixed content', () => {
      const result = escapeHtml('Click <a href="#">here</a>');
      expect(result).toContain('&lt;');
      expect(result).toContain('&gt;');
    });
  });

  describe('displayAddress', () => {
    it('displays valid address', () => {
      const address = 'SP2XNWLQF7HJFXPSJFYHD98N3YZFC52H8TE4TSPJ';
      const result = displayAddress(address);
      expect(result).toBe(address);
    });

    it('returns fallback for invalid address', () => {
      const result = displayAddress('invalid');
      expect(result).toBe('[Invalid Address]');
    });

    it('sanitizes address', () => {
      const address = '  SP2XNWLQF7HJFXPSJFYHD98N3YZFC52H8TE4TSPJ  ';
      const result = displayAddress(address);
      expect(result).toBe('SP2XNWLQF7HJFXPSJFYHD98N3YZFC52H8TE4TSPJ');
    });

    it('rejects HTML injection attempt', () => {
      const result = displayAddress('<script>alert("xss")</script>');
      expect(result).toBe('[Invalid Address]');
    });
  });

  describe('truncateAddress', () => {
    it('truncates long address', () => {
      const address = 'SP2XNWLQF7HJFXPSJFYHD98N3YZFC52H8TE4TSPJ';
      const result = truncateAddress(address);
      expect(result).toContain('...');
      expect(result).toContain('SP2XNWLQ');
      expect(result).toContain('4TSPJ');
    });

    it('does not truncate short address', () => {
      const address = 'SP2XNW';
      const result = truncateAddress(address);
      expect(result).not.toContain('...');
    });

    it('respects custom start length', () => {
      const address = 'SP2XNWLQF7HJFXPSJFYHD98N3YZFC52H8TE4TSPJ';
      const result = truncateAddress(address, 4, 4);
      expect(result.substring(0, 4)).toBe('SP2X');
    });

    it('respects custom end length', () => {
      const address = 'SP2XNWLQF7HJFXPSJFYHD98N3YZFC52H8TE4TSPJ';
      const result = truncateAddress(address, 8, 8);
      expect(result).toContain('TE4TSPJ');
    });

    it('handles invalid address gracefully', () => {
      const result = truncateAddress('invalid');
      expect(result).toBe('[Invalid Address]');
    });

    it('uses default lengths by default', () => {
      const address = 'SP2XNWLQF7HJFXPSJFYHD98N3YZFC52H8TE4TSPJ';
      const result = truncateAddress(address);
      expect(result.substring(0, 8)).toBe('SP2XNWLQ');
    });
  });
});
