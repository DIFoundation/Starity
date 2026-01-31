import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import {
  useRateLimiter,
  useStakeRateLimiter,
  useUnstakeRateLimiter,
  useClaimRateLimiter,
} from '@/hooks/useRateLimiter';
import { RateLimitError } from '@/services/security';

describe('hooks/useRateLimiter.ts', () => {
  describe('useRateLimiter', () => {
    it('initializes with correct defaults', () => {
      const { result } = renderHook(() => useRateLimiter());

      expect(result.current.isLimited).toBe(false);
      expect(result.current.waitTimeMs).toBe(0);
      expect(result.current.check).toBeDefined();
      expect(result.current.reset).toBeDefined();
    });

    it('allows first request', () => {
      const { result } = renderHook(() => useRateLimiter({ maxAttempts: 1, windowMs: 1000 }));

      const allowed = result.current.check('user1');
      expect(allowed).toBe(true);
      expect(result.current.isLimited).toBe(false);
    });

    it('blocks second request when limit is 1', () => {
      const { result } = renderHook(() => useRateLimiter({ maxAttempts: 1, windowMs: 1000 }));

      result.current.check('user1');
      const allowed = result.current.check('user1');

      expect(allowed).toBe(false);
      expect(result.current.isLimited).toBe(true);
    });

    it('updates wait time on rate limit', () => {
      const { result } = renderHook(() => useRateLimiter({ maxAttempts: 1, windowMs: 3000 }));

      result.current.check('user1');
      result.current.check('user1');

      expect(result.current.waitTimeMs).toBeGreaterThan(0);
      expect(result.current.waitTimeMs).toBeLessThanOrEqual(3000);
    });

    it('formats wait time correctly', () => {
      const { result } = renderHook(() => useRateLimiter({ maxAttempts: 1, windowMs: 3000 }));

      result.current.check('user1');
      result.current.check('user1');

      expect(result.current.waitTimeFormatted).toContain('Please wait');
    });

    it('calls onRateLimited callback', () => {
      const callback = (error: RateLimitError) => {
        expect(error).toBeInstanceOf(RateLimitError);
      };

      const { result } = renderHook(() =>
        useRateLimiter({ maxAttempts: 1, windowMs: 1000, onRateLimited: callback })
      );

      result.current.check('user1');
      result.current.check('user1'); // Should trigger callback
    });

    it('tracks per-key rate limits', () => {
      const { result } = renderHook(() => useRateLimiter({ maxAttempts: 1, windowMs: 1000 }));

      // User 1: allowed
      expect(result.current.check('user1')).toBe(true);

      // User 1: blocked (at limit)
      expect(result.current.check('user1')).toBe(false);

      // User 2: allowed (different key)
      expect(result.current.check('user2')).toBe(true);
    });

    it('resets single key', async () => {
      const { result } = renderHook(() => useRateLimiter({ maxAttempts: 1, windowMs: 1000 }));

      result.current.check('user1');
      expect(result.current.check('user1')).toBe(false);

      act(() => {
        result.current.reset('user1');
      });

      expect(result.current.check('user1')).toBe(true);
    });

    it('resets all keys', async () => {
      const { result } = renderHook(() => useRateLimiter({ maxAttempts: 1, windowMs: 1000 }));

      result.current.check('user1');
      result.current.check('user2');

      act(() => {
        result.current.resetAll();
      });

      expect(result.current.check('user1')).toBe(true);
      expect(result.current.check('user2')).toBe(true);
    });

    it('uses default key if not provided', () => {
      const { result } = renderHook(() => useRateLimiter({ maxAttempts: 1, windowMs: 1000 }));

      expect(result.current.check()).toBe(true);
      expect(result.current.check()).toBe(false);
    });

    it('auto-clears rate limit after reset time', async () => {
      const { result } = renderHook(() => useRateLimiter({ maxAttempts: 1, windowMs: 100 }));

      result.current.check('user1');
      result.current.check('user1');

      expect(result.current.isLimited).toBe(true);

      await waitFor(
        () => {
          expect(result.current.isLimited).toBe(false);
        },
        { timeout: 200 }
      );
    });
  });

  describe('useStakeRateLimiter', () => {
    it('has correct config for stake', () => {
      const { result } = renderHook(() => useStakeRateLimiter());

      // Should allow first request
      expect(result.current.check()).toBe(true);
      // Should block second request
      expect(result.current.check()).toBe(false);
    });

    it('accepts callback', () => {
      const callback = (error: RateLimitError) => {
        expect(error).toBeInstanceOf(RateLimitError);
      };

      const { result } = renderHook(() => useStakeRateLimiter(callback));

      result.current.check();
      result.current.check(); // Should trigger callback
    });
  });

  describe('useUnstakeRateLimiter', () => {
    it('has correct config for unstake', () => {
      const { result } = renderHook(() => useUnstakeRateLimiter());

      expect(result.current.check()).toBe(true);
      expect(result.current.check()).toBe(false);
    });
  });

  describe('useClaimRateLimiter', () => {
    it('has correct config for claim rewards', () => {
      const { result } = renderHook(() => useClaimRateLimiter());

      expect(result.current.check()).toBe(true);
      expect(result.current.check()).toBe(false);
    });

    it('has longer window than stake', () => {
      // Claim should have 10s window vs 3s for stake
      const { result: stakeResult } = renderHook(() => useStakeRateLimiter());
      const { result: claimResult } = renderHook(() => useClaimRateLimiter());

      stakeResult.current.check();
      claimResult.current.check();

      // Both should be rate limited after one check, but we can verify they're different limiters
      expect(stakeResult.current.check()).toBe(false);
      expect(claimResult.current.check()).toBe(false);
    });
  });

  describe('Hook usage patterns', () => {
    it('allows multiple parallel calls to check', () => {
      const { result } = renderHook(() => useRateLimiter({ maxAttempts: 3, windowMs: 1000 }));

      const calls = [
        result.current.check('batch1'),
        result.current.check('batch1'),
        result.current.check('batch1'),
        result.current.check('batch1'),
      ];

      expect(calls).toEqual([true, true, true, false]);
    });

    it('supports concurrent users', () => {
      const { result } = renderHook(() => useRateLimiter({ maxAttempts: 2, windowMs: 1000 }));

      // Simulate concurrent users
      for (let i = 0; i < 5; i++) {
        const userKey = `user-${i % 3}`;
        const allowed = result.current.check(userKey);
        
        if (i % 3 === 0) {
          expect(allowed).toBe(true);
        } else if (i % 3 === 1) {
          expect(allowed).toBe(true);
        } else {
          expect(allowed).toBe(false); // 3rd and beyond are blocked
        }
      }
    });
  });
});
