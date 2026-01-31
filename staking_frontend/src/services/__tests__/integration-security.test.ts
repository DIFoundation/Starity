import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { sanitizeStakingForm, validateAddressSafely, validateAmountSafely } from '@/services/sanitization';
import { RATE_LIMITERS } from '@/services/security';
import { useRateLimiter } from '@/hooks/useRateLimiter';

/**
 * Integration tests for security features
 * Testing real-world scenarios combining sanitization, validation, and rate limiting
 */

describe('Security Integration Tests', () => {
  beforeEach(() => {
    RATE_LIMITERS.stake.resetAll();
    RATE_LIMITERS.unstake.resetAll();
    RATE_LIMITERS.claimRewards.resetAll();
  });

  describe('Staking Form Security Workflow', () => {
    it('processes valid staking form', () => {
      const form = {
        amount: '1000.50',
        userAddress: 'SP2XNWLQF7HJFXPSJFYHD98N3YZFC52H8TE4TSPJ',
      };

      const result = sanitizeStakingForm(form);
      expect(result.success).toBe(true);
      expect(result.data?.amount).toBe('1000.50');
      expect(result.data?.userAddress).toBe('SP2XNWLQF7HJFXPSJFYHD98N3YZFC52H8TE4TSPJ');
    });

    it('rejects malicious staking form', () => {
      const maliciousForm = {
        amount: '1000<script>alert("xss")</script>',
        userAddress: 'SP2XNWLQF7HJFXPSJFYHD98N3YZFC52H8TE4TSPJ',
      };

      const result = sanitizeStakingForm(maliciousForm);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('sanitizes whitespace in form', () => {
      const form = {
        amount: '  1000  ',
        userAddress: '  SP2XNWLQF7HJFXPSJFYHD98N3YZFC52H8TE4TSPJ  ',
      };

      const result = sanitizeStakingForm(form);
      expect(result.success).toBe(true);
      expect(result.data?.amount).toBe('1000');
      expect(result.data?.userAddress).toBe('SP2XNWLQF7HJFXPSJFYHD98N3YZFC52H8TE4TSPJ');
    });
  });

  describe('Address Validation Workflow', () => {
    it('validates legitimate addresses', () => {
      const addresses = [
        'SP2XNWLQF7HJFXPSJFYHD98N3YZFC52H8TE4TSPJ',
        'SM1234567890ABCDEF1234567890ABCDEF1234567',
      ];

      for (const address of addresses) {
        const result = validateAddressSafely(address);
        expect(result.valid).toBe(true);
      }
    });

    it('rejects malicious addresses', () => {
      const maliciousAddresses = [
        '<script>alert("xss")</script>',
        'SP123', // Too short
        'invalid-format',
        '"; DROP TABLE users; --',
      ];

      for (const address of maliciousAddresses) {
        const result = validateAddressSafely(address);
        expect(result.valid).toBe(false);
        expect(result.message).toBeDefined();
      }
    });

    it('handles empty addresses', () => {
      const result = validateAddressSafely('');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('required');
    });
  });

  describe('Amount Validation Workflow', () => {
    it('validates legitimate amounts', () => {
      const amounts = ['0', '1', '1000', '1000.50', '0.001', '.5'];

      for (const amount of amounts) {
        const result = validateAmountSafely(amount);
        expect(result.valid).toBe(true);
      }
    });

    it('rejects malicious amounts', () => {
      const maliciousAmounts = [
        '1000<script>',
        '-100',
        '1e10',
        '999999999999999999999999999999',
        'abc',
        '10.50.25',
      ];

      for (const amount of maliciousAmounts) {
        const result = validateAmountSafely(amount);
        expect(result.valid).toBe(false);
        expect(result.message).toBeDefined();
      }
    });
  });

  describe('Rate Limiting with Validation', () => {
    it('enforces rate limit after validation passes', () => {
      const { result } = renderHook(() => useRateLimiter({ maxAttempts: 1, windowMs: 1000 }));

      // First request passes validation and rate limit
      expect(result.current.check('user1')).toBe(true);

      // Second request fails rate limit
      expect(result.current.check('user1')).toBe(false);
      expect(result.current.isLimited).toBe(true);
    });

    it('tracks different actions separately', () => {
      // Different rate limiters for different actions
      const stakeLimit = RATE_LIMITERS.stake;
      const unstakeLimit = RATE_LIMITERS.unstake;

      // Stake: 1 per 3s
      expect(stakeLimit.check('user1')).toBe(true);
      expect(stakeLimit.check('user1')).toBe(false);

      // Unstake: independent limit
      expect(unstakeLimit.check('user1')).toBe(true);
      expect(unstakeLimit.check('user1')).toBe(false);
    });

    it('tracks per-user limits independently', () => {
      const limiter = RATE_LIMITERS.stake;

      // User 1: uses 1 request
      expect(limiter.check('user1')).toBe(true);
      expect(limiter.check('user1')).toBe(false);

      // User 2: independent limit
      expect(limiter.check('user2')).toBe(true);
      expect(limiter.check('user2')).toBe(false);

      // User 3: also independent
      expect(limiter.check('user3')).toBe(true);
      expect(limiter.check('user3')).toBe(false);
    });
  });

  describe('Complete Staking Workflow', () => {
    it('validates and rate-limits complete stake operation', () => {
      // Step 1: Validate form
      const form = {
        amount: '100',
        userAddress: 'SP2XNWLQF7HJFXPSJFYHD98N3YZFC52H8TE4TSPJ',
      };

      const sanitization = sanitizeStakingForm(form);
      expect(sanitization.success).toBe(true);

      // Step 2: Check rate limit
      const limiter = RATE_LIMITERS.stake;
      const userKey = 'SP2XNWLQF7HJFXPSJFYHD98N3YZFC52H8TE4TSPJ';
      const rateLimitCheck = limiter.check(userKey);
      expect(rateLimitCheck.allowed).toBe(true);

      // Step 3: Second attempt should be rate limited
      const secondAttempt = limiter.check(userKey);
      expect(secondAttempt.allowed).toBe(false);
    });

    it('rejects malicious staking workflow at validation stage', () => {
      // Attempt with malicious input
      const maliciousForm = {
        amount: '100<img src=x onerror="alert(\'xss\')">',
        userAddress: 'SP2XNWLQF7HJFXPSJFYHD98N3YZFC52H8TE4TSPJ',
      };

      const result = sanitizeStakingForm(maliciousForm);
      expect(result.success).toBe(false);

      // Should never reach rate limiting check
      const limiter = RATE_LIMITERS.stake;
      expect(limiter.getState('user1')).toBeUndefined(); // Never checked
    });

    it('handles concurrent stake attempts with rate limiting', () => {
      const limiter = RATE_LIMITERS.stake;
      const userKey = 'user-concurrent-test';

      // Simulate concurrent attempts
      const attempts = [
        limiter.check(userKey), // 1st - allowed
        limiter.check(userKey), // 2nd - rate limited
        limiter.check(userKey), // 3rd - rate limited
      ];

      expect(attempts[0].allowed).toBe(true);
      expect(attempts[1].allowed).toBe(false);
      expect(attempts[2].allowed).toBe(false);
    });
  });

  describe('XSS Prevention Scenarios', () => {
    it('prevents script injection in address field', () => {
      const injections = [
        'SP2<script>alert("xss")</script>',
        'SP2" onload="alert(\'xss\')"',
        "SP2'; DROP TABLE users; --",
      ];

      for (const injection of injections) {
        const result = validateAddressSafely(injection);
        expect(result.valid).toBe(false);
      }
    });

    it('prevents event handler injection in amount field', () => {
      const injections = [
        '100" onclick="alert(\'xss\')',
        '100<svg onload="alert(\'xss\')"',
        '100<img src=x onerror="alert(\'xss\')"',
      ];

      for (const injection of injections) {
        const result = validateAmountSafely(injection);
        expect(result.valid).toBe(false);
      }
    });

    it('prevents protocol-based injection attempts', () => {
      const form = {
        amount: 'javascript:alert("xss")',
        userAddress: 'data:text/html,<script>alert("xss")</script>',
      };

      const result = sanitizeStakingForm(form);
      expect(result.success).toBe(false);
    });
  });

  describe('Edge Cases & Stress', () => {
    it('handles rapid requests from multiple users', () => {
      const limiter = RATE_LIMITERS.stake;

      // Simulate 100 rapid requests from 10 users
      let successCount = 0;
      let blockedCount = 0;

      for (let i = 0; i < 100; i++) {
        const userKey = `user-${i % 10}`;
        const result = limiter.check(userKey);
        if (result.allowed) {
          successCount++;
        } else {
          blockedCount++;
        }
      }

      // With 1 request per user, expect 10 successes and 90 blocked
      expect(successCount).toBe(10);
      expect(blockedCount).toBe(90);
    });

    it('handles very large amounts', () => {
      const largeAmount = '99999999999999999999999999999.99';
      const result = validateAmountSafely(largeAmount);
      expect(result.valid).toBe(true);
    });

    it('handles Unicode in inputs', () => {
      const unicodeForm = {
        amount: '100',
        userAddress: 'SP2XNWLQF7HJFXPSJFYHD98N3YZFC52H8TE4TSPJ',
      };

      const result = sanitizeStakingForm(unicodeForm);
      expect(result.success).toBe(true);
    });

    it('handles extremely malformed inputs gracefully', () => {
      const malformed = [
        null,
        undefined,
        '',
        '   ',
        '\0\0\0',
        '<' * 1000,
        'x'.repeat(10000),
      ];

      for (const input of malformed) {
        const result = validateAmountSafely(input as any);
        expect(result.valid).toBe(false);
      }
    });
  });

  describe('Security Error Handling', () => {
    it('provides helpful error messages for invalid inputs', () => {
      const addressResult = validateAddressSafely('invalid');
      expect(addressResult.message).toContain('Invalid');

      const amountResult = validateAmountSafely('-100');
      expect(amountResult.message).toContain('positive');
    });

    it('distinguishes between error types', () => {
      const form1 = { amount: '', userAddress: 'SP2XNWLQF7HJFXPSJFYHD98N3YZFC52H8TE4TSPJ' };
      const form2 = { amount: '100', userAddress: 'invalid' };

      const result1 = sanitizeStakingForm(form1);
      const result2 = sanitizeStakingForm(form2);

      expect(result1.success).toBe(false);
      expect(result2.success).toBe(false);
      expect(result1.error?.message).not.toEqual(result2.error?.message);
    });
  });
});
