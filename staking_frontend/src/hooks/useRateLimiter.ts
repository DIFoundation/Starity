import { useCallback, useRef, useState } from 'react';
import { RateLimitError, RateLimiter, formatWaitTime } from '@/services/security';

export interface UseRateLimiterOptions {
  maxAttempts?: number;
  windowMs?: number;
  onRateLimited?: (error: RateLimitError) => void;
}

export interface UseRateLimiterResult {
  check: (key?: string) => boolean;
  isLimited: boolean;
  waitTimeMs: number;
  waitTimeFormatted: string;
  reset: (key?: string) => void;
  resetAll: () => void;
}

/**
 * Hook for rate limiting in React components
 *
 * Usage:
 * ```tsx
 * const { check, isLimited, waitTimeFormatted } = useRateLimiter({
 *   maxAttempts: 1,
 *   windowMs: 3000,
 *   onRateLimited: (error) => {
 *     showMessage(error.message);
 *   },
 * });
 *
 * const handleStake = () => {
 *   if (!check('user-stake')) {
 *     return; // Rate limited
 *   }
 *   // Proceed with stake
 * };
 * ```
 */
export function useRateLimiter(options: UseRateLimiterOptions = {}): UseRateLimiterResult {
  const maxAttempts = options.maxAttempts ?? 1;
  const windowMs = options.windowMs ?? 3000;

  const limiterRef = useRef(new RateLimiter(maxAttempts, windowMs));
  const [isLimited, setIsLimited] = useState(false);
  const [waitTimeMs, setWaitTimeMs] = useState(0);

  const check = useCallback(
    (key: string = 'default') => {
      const result = limiterRef.current.check(key);

      if (!result.allowed) {
        setIsLimited(true);
        setWaitTimeMs(result.resetTimeMs);

        const error = new RateLimitError(
          formatWaitTime(result.resetTimeMs),
          result.resetTimeMs,
          result.remainingAttempts
        );

        if (options.onRateLimited) {
          options.onRateLimited(error);
        }

        // Auto-clear rate limit status after reset time
        setTimeout(() => {
          setIsLimited(false);
          setWaitTimeMs(0);
        }, result.resetTimeMs);

        return false;
      }

      setIsLimited(false);
      setWaitTimeMs(0);
      return true;
    },
    [options]
  );

  const reset = useCallback((key: string = 'default') => {
    limiterRef.current.reset(key);
    setIsLimited(false);
    setWaitTimeMs(0);
  }, []);

  const resetAll = useCallback(() => {
    limiterRef.current.resetAll();
    setIsLimited(false);
    setWaitTimeMs(0);
  }, []);

  return {
    check,
    isLimited,
    waitTimeMs,
    waitTimeFormatted: formatWaitTime(waitTimeMs),
    reset,
    resetAll,
  };
}

/**
 * Pre-built hooks for common staking operations
 */

export function useStakeRateLimiter(onRateLimited?: (error: RateLimitError) => void) {
  return useRateLimiter({
    maxAttempts: 1,
    windowMs: 3000,
    onRateLimited,
  });
}

export function useUnstakeRateLimiter(onRateLimited?: (error: RateLimitError) => void) {
  return useRateLimiter({
    maxAttempts: 1,
    windowMs: 3000,
    onRateLimited,
  });
}

export function useClaimRateLimiter(onRateLimited?: (error: RateLimitError) => void) {
  return useRateLimiter({
    maxAttempts: 1,
    windowMs: 10000,
    onRateLimited,
  });
}
