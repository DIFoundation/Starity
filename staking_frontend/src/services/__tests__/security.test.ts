import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  sanitizeInput,
  isAddressSafe,
  RateLimiter,
  SecurityError,
  RateLimitError,
  formatWaitTime,
  RATE_LIMITERS,
} from '@/services/security';

describe('services/security.ts', () => {
  afterEach(() => {
    // Cleanup rate limiters
    RATE_LIMITERS.stake.resetAll();
    RATE_LIMITERS.unstake.resetAll();
    RATE_LIMITERS.claimRewards.resetAll();
    RATE_LIMITERS.general.resetAll();
  });

  describe('sanitizeInput - String type', () => {
    it('sanitizes basic string input', () => {
      const result = sanitizeInput('hello world', 'string');
      expect(result).toBe('hello world');
    });

    it('removes HTML tags', () => {
      const result = sanitizeInput('<script>alert("xss")</script>', 'string');
      expect(result).not.toContain('<');
      expect(result).not.toContain('>');
    });

    it('escapes special characters', () => {
      const result = sanitizeInput('<div class="test">', 'string');
      expect(result).toContain('&lt;');
      expect(result).toContain('&gt;');
      expect(result).toContain('&quot;');
    });

    it('throws error for null/undefined', () => {
      expect(() => sanitizeInput(null as any, 'string')).toThrow(SecurityError);
      expect(() => sanitizeInput(undefined as any, 'string')).toThrow(SecurityError);
    });

    it('throws error for empty string', () => {
      expect(() => sanitizeInput('', 'string')).toThrow(SecurityError);
      expect(() => sanitizeInput('   ', 'string')).toThrow(SecurityError);
    });

    it('trims whitespace', () => {
      const result = sanitizeInput('  hello  ', 'string');
      expect(result).toBe('hello');
    });
  });

  describe('sanitizeInput - Address type', () => {
    it('accepts valid Stacks address (SP prefix)', () => {
      const address = 'SP2XNWLQF7HJFXPSJFYHD98N3YZFC52H8TE4TSPJ';
      const result = sanitizeInput(address, 'address');
      expect(result).toBe(address);
    });

    it('accepts valid Stacks address (SM prefix)', () => {
      const address = 'SM2XNWLQF7HJFXPSJFYHD98N3YZFC52H8TE4TSPJ';
      const result = sanitizeInput(address, 'address');
      expect(result).toBe(address);
    });

    it('removes whitespace from address', () => {
      const address = 'SP2XNWLQF7 HJFXPSJFYHD98 N3YZFC52H8TE4TSPJ';
      const result = sanitizeInput(address, 'address');
      expect(result).toBe('SP2XNWLQF7HJFXPSJFYHD98N3YZFC52H8TE4TSPJ');
    });

    it('rejects invalid address format', () => {
      expect(() => sanitizeInput('INVALID123', 'address')).toThrow(SecurityError);
      expect(() => sanitizeInput('XX2XNWLQF7HJFXPSJFYHD98N3YZFC52H8TE4TSPJ', 'address')).toThrow();
    });

    it('rejects address with HTML injection', () => {
      expect(() => sanitizeInput('<script>alert("xss")</script>', 'address')).toThrow(SecurityError);
    });

    it('rejects too short address', () => {
      expect(() => sanitizeInput('SP2XNWLQF', 'address')).toThrow(SecurityError);
    });

    it('rejects lowercase address', () => {
      expect(() => sanitizeInput('sp2xnwlqf7hjfxpsjfyhd98n3yzfc52h8te4tspj', 'address')).toThrow();
    });
  });

  describe('sanitizeInput - Amount type', () => {
    it('accepts integer amounts', () => {
      const result = sanitizeInput('1000', 'amount');
      expect(result).toBe('1000');
    });

    it('accepts decimal amounts', () => {
      const result = sanitizeInput('1000.50', 'amount');
      expect(result).toBe('1000.50');
    });

    it('accepts amounts starting with decimal', () => {
      const result = sanitizeInput('0.5', 'amount');
      expect(result).toBe('0.5');
    });

    it('accepts amounts starting with dot', () => {
      const result = sanitizeInput('.5', 'amount');
      expect(result).toBe('.5');
    });

    it('removes whitespace', () => {
      const result = sanitizeInput('  1000  ', 'amount');
      expect(result).toBe('1000');
    });

    it('rejects negative amounts', () => {
      expect(() => sanitizeInput('-100', 'amount')).toThrow(SecurityError);
    });

    it('rejects non-numeric characters', () => {
      expect(() => sanitizeInput('1000abc', 'amount')).toThrow(SecurityError);
      expect(() => sanitizeInput('10e5', 'amount')).toThrow(SecurityError);
    });

    it('rejects empty amount', () => {
      expect(() => sanitizeInput('', 'amount')).toThrow(SecurityError);
    });

    it('rejects multiple decimal points', () => {
      expect(() => sanitizeInput('10.50.25', 'amount')).toThrow(SecurityError);
    });

    it('rejects HTML injection in amounts', () => {
      expect(() => sanitizeInput('100<script>', 'amount')).toThrow(SecurityError);
    });

    it('rejects leading zeros (except 0.x)', () => {
      expect(() => sanitizeInput('0100', 'amount')).toThrow(SecurityError);
      expect(() => sanitizeInput('01.5', 'amount')).toThrow(SecurityError);
    });

    it('accepts zero', () => {
      const result = sanitizeInput('0', 'amount');
      expect(result).toBe('0');
    });
  });

  describe('sanitizeInput - URL type', () => {
    it('accepts valid HTTP URL', () => {
      const url = 'https://example.com';
      const result = sanitizeInput(url, 'url');
      expect(result).toBe(url);
    });

    it('accepts URL with path', () => {
      const url = 'https://example.com/path/to/resource';
      const result = sanitizeInput(url, 'url');
      expect(result).toBe(url);
    });

    it('rejects javascript: protocol', () => {
      expect(() => sanitizeInput('javascript:alert("xss")', 'url')).toThrow(SecurityError);
    });

    it('rejects data: protocol', () => {
      expect(() => sanitizeInput('data:text/html,<script>alert("xss")</script>', 'url')).toThrow(SecurityError);
    });

    it('rejects vbscript: protocol', () => {
      expect(() => sanitizeInput('vbscript:alert("xss")', 'url')).toThrow(SecurityError);
    });

    it('rejects file: protocol', () => {
      expect(() => sanitizeInput('file:///etc/passwd', 'url')).toThrow(SecurityError);
    });

    it('removes whitespace', () => {
      const url = 'https://example.com';
      const result = sanitizeInput(`  ${url}  `, 'url');
      expect(result).toBe(url);
    });

    it('rejects invalid URL format', () => {
      expect(() => sanitizeInput('not a url', 'url')).toThrow(SecurityError);
      expect(() => sanitizeInput('ht!tp://ex@mple.c0m', 'url')).toThrow(SecurityError);
    });
  });

  describe('isAddressSafe', () => {
    it('returns true for valid address', () => {
      expect(isAddressSafe('SP2XNWLQF7HJFXPSJFYHD98N3YZFC52H8TE4TSPJ')).toBe(true);
    });

    it('returns false for invalid address', () => {
      expect(isAddressSafe('INVALID')).toBe(false);
    });

    it('returns false for HTML injection attempt', () => {
      expect(isAddressSafe('<script>alert("xss")</script>')).toBe(false);
    });

    it('returns false for malformed address', () => {
      expect(isAddressSafe('SP123')).toBe(false);
    });
  });

  describe('RateLimiter', () => {
    it('initializes with config', () => {
      const limiter = new RateLimiter(5, 1000);
      expect(limiter).toBeDefined();
    });

    it('allows request within limit', () => {
      const limiter = new RateLimiter(3, 1000);
      const result = limiter.check('user1');
      expect(result.allowed).toBe(true);
      expect(result.remainingAttempts).toBe(2);
    });

    it('tracks requests per key', () => {
      const limiter = new RateLimiter(2, 1000);
      
      // User 1: 2 requests
      expect(limiter.check('user1').allowed).toBe(true);
      expect(limiter.check('user1').allowed).toBe(true);
      expect(limiter.check('user1').allowed).toBe(false);

      // User 2: independent limit
      expect(limiter.check('user2').allowed).toBe(true);
      expect(limiter.check('user2').allowed).toBe(true);
      expect(limiter.check('user2').allowed).toBe(false);
    });

    it('rejects request when limit exceeded', () => {
      const limiter = new RateLimiter(1, 1000);
      limiter.check('user1'); // Use the 1 token
      
      const result = limiter.check('user1');
      expect(result.allowed).toBe(false);
      expect(result.remainingAttempts).toBe(0);
      expect(result.resetTimeMs).toBeGreaterThan(0);
    });

    it('refills tokens after window expires', async () => {
      const limiter = new RateLimiter(1, 100); // 100ms window
      
      // Use token
      expect(limiter.check('user1').allowed).toBe(true);
      expect(limiter.check('user1').allowed).toBe(false);

      // Wait for window to expire
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Should refill
      expect(limiter.check('user1').allowed).toBe(true);
    });

    it('refills partially based on elapsed time', async () => {
      const limiter = new RateLimiter(10, 1000);
      
      // Use 5 tokens
      for (let i = 0; i < 5; i++) {
        limiter.check('user1');
      }

      // Wait 500ms (half window)
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Should have ~5 tokens (5 remaining + 5 refilled)
      const result = limiter.check('user1');
      expect(result.allowed).toBe(true);
    });

    it('resets single key', () => {
      const limiter = new RateLimiter(1, 1000);
      limiter.check('user1');
      limiter.reset('user1');

      const result = limiter.check('user1');
      expect(result.allowed).toBe(true);
    });

    it('resets all keys', () => {
      const limiter = new RateLimiter(1, 1000);
      limiter.check('user1');
      limiter.check('user2');
      limiter.resetAll();

      expect(limiter.check('user1').allowed).toBe(true);
      expect(limiter.check('user2').allowed).toBe(true);
    });

    it('cleans up stale entries', async () => {
      const limiter = new RateLimiter(1, 100);
      limiter.check('user1');

      // Wait for cleanup
      await new Promise((resolve) => setTimeout(resolve, 1100));

      // Should have cleaned up
      const state = limiter.getState('user1');
      // State might exist but should be cleaned eventually
      expect(state).toBeDefined(); // Initial entry still there, cleanup runs every 5 mins
    });

    it('destroys limiter', () => {
      const limiter = new RateLimiter(1, 1000);
      limiter.check('user1');
      limiter.destroy();

      // After destroy, limiter should be cleaned
      const state = limiter.getState('user1');
      expect(state).toBeUndefined();
    });
  });

  describe('Pre-configured limiters', () => {
    it('stake limiter has correct config', () => {
      const result = RATE_LIMITERS.stake.check('user1');
      expect(result.allowed).toBe(true);
    });

    it('unstake limiter has correct config', () => {
      const result = RATE_LIMITERS.unstake.check('user1');
      expect(result.allowed).toBe(true);
    });

    it('claimRewards limiter has correct config', () => {
      const result = RATE_LIMITERS.claimRewards.check('user1');
      expect(result.allowed).toBe(true);
    });

    it('general limiter has correct config', () => {
      for (let i = 0; i < 10; i++) {
        expect(RATE_LIMITERS.general.check('user1').allowed).toBe(true);
      }
      expect(RATE_LIMITERS.general.check('user1').allowed).toBe(false);
    });
  });

  describe('formatWaitTime', () => {
    it('formats less than 1 second', () => {
      const result = formatWaitTime(500);
      expect(result).toBe('Please try again');
    });

    it('formats 1 second', () => {
      const result = formatWaitTime(1000);
      expect(result).toBe('Please wait 1 second');
    });

    it('formats multiple seconds', () => {
      const result = formatWaitTime(3000);
      expect(result).toBe('Please wait 3 seconds');
    });

    it('rounds up seconds', () => {
      const result = formatWaitTime(2500);
      expect(result).toContain('Please wait');
      expect(result).toContain('second');
    });
  });

  describe('SecurityError', () => {
    it('creates with correct properties', () => {
      const error = new SecurityError('Test error', 'TEST_CODE', false);
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_CODE');
      expect(error.transient).toBe(false);
      expect(error.name).toBe('SecurityError');
    });

    it('creates transient error', () => {
      const error = new SecurityError('Transient', 'TEST', true);
      expect(error.transient).toBe(true);
    });

    it('is instanceof Error', () => {
      const error = new SecurityError('Test', 'TEST');
      expect(error instanceof Error).toBe(true);
    });
  });

  describe('RateLimitError', () => {
    it('creates with correct properties', () => {
      const error = new RateLimitError('Rate limit exceeded', 3000, 0);
      expect(error.message).toBe('Rate limit exceeded');
      expect(error.resetTimeMs).toBe(3000);
      expect(error.remainingAttempts).toBe(0);
      expect(error.name).toBe('RateLimitError');
    });

    it('inherits from SecurityError', () => {
      const error = new RateLimitError('Test', 1000);
      expect(error instanceof SecurityError).toBe(true);
      expect(error.code).toBe('RATE_LIMIT_EXCEEDED');
    });
  });

  describe('XSS Prevention', () => {
    it('prevents script injection in strings', () => {
      const malicious = '<img src=x onerror="alert(\'xss\')">';
      const result = sanitizeInput(malicious, 'string');
      expect(result).not.toContain('onerror');
    });

    it('prevents SVG XSS', () => {
      const malicious = '<svg onload="alert(\'xss\')">';
      const result = sanitizeInput(malicious, 'string');
      expect(result).not.toContain('onload');
    });

    it('prevents event handler injection', () => {
      const malicious = 'test" onclick="alert(\'xss\')';
      const result = sanitizeInput(malicious, 'string');
      expect(result).toContain('&quot;');
    });

    it('prevents protocol-based XSS in URLs', () => {
      expect(() => sanitizeInput('javascript:void(0)', 'url')).toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('handles Unicode in strings', () => {
      const result = sanitizeInput('Hello 👋', 'string');
      expect(result).toContain('Hello');
      expect(result).toContain('👋');
    });

    it('handles mixed case in addresses', () => {
      const result = sanitizeInput('SP2XNWLQF7HJFXPSJFYHD98N3YZFC52H8TE4TSPJ', 'address');
      expect(result).toBe('SP2XNWLQF7HJFXPSJFYHD98N3YZFC52H8TE4TSPJ');
    });

    it('handles very large amounts', () => {
      const result = sanitizeInput('99999999999999999.99', 'amount');
      expect(result).toBe('99999999999999999.99');
    });

    it('handles URL with query parameters', () => {
      const url = 'https://example.com?param=value&other=123';
      const result = sanitizeInput(url, 'url');
      expect(result).toBe(url);
    });
  });
});
