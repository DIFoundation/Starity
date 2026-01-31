/**
 * Security Service
 *
 * Provides utilities for:
 * - Input sanitization (remove/escape dangerous characters)
 * - Rate limiting (prevent spam and abuse)
 * - Address validation (verify Stacks addresses)
 * - XSS protection
 */

export type InputType = 'string' | 'address' | 'amount' | 'url';

export interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remainingAttempts: number;
  resetTimeMs: number;
}

export class SecurityError extends Error {
  constructor(
    message: string,
    public code: string,
    public transient: boolean = false
  ) {
    super(message);
    this.name = 'SecurityError';
  }
}

export class RateLimitError extends SecurityError {
  constructor(
    message: string,
    public resetTimeMs: number,
    public remainingAttempts: number = 0
  ) {
    super(message, 'RATE_LIMIT_EXCEEDED', false);
    this.name = 'RateLimitError';
  }
}

/**
 * Sanitize input based on type
 *
 * @param value - Input value to sanitize
 * @param type - Type of input (string, address, amount, url)
 * @returns Sanitized value
 * @throws SecurityError if input is invalid
 */
export function sanitizeInput(value: string | number, type: InputType): string {
  if (value === null || value === undefined) {
    throw new SecurityError('Input value cannot be null or undefined', 'INVALID_INPUT');
  }

  const stringValue = String(value).trim();

  if (stringValue.length === 0) {
    throw new SecurityError('Input value cannot be empty', 'EMPTY_INPUT');
  }

  // Type-specific sanitization
  switch (type) {
    case 'address':
      return sanitizeAddress(stringValue);
    case 'amount':
      return sanitizeAmount(stringValue);
    case 'url':
      return sanitizeUrl(stringValue);
    case 'string':
    default:
      return sanitizeString(stringValue);
  }
}

/**
 * Sanitize Stacks address
 * - Remove whitespace
 * - Validate format (SP* or SM*)
 * - Prevent HTML injection
 */
function sanitizeAddress(address: string): string {
  // Remove whitespace
  const clean = address.replace(/\s+/g, '');

  // Validate Stacks address format: SP or SM followed by 38-40 alphanumeric chars
  const stacksAddressRegex = /^(SP|SM)[A-Z0-9]{38,40}$/;
  if (!stacksAddressRegex.test(clean)) {
    throw new SecurityError(`Invalid Stacks address format: ${clean.substring(0, 20)}...`, 'INVALID_ADDRESS');
  }

  return clean;
}

/**
 * Sanitize amount input
 * - Remove non-numeric characters except decimal point
 * - Prevent scientific notation
 * - Validate as positive number
 */
function sanitizeAmount(amount: string): string {
  // Remove whitespace
  let clean = amount.replace(/\s+/g, '');

  // Remove HTML/XML characters
  clean = clean.replace(/[<>\"'`]/g, '');

  // Allow only digits and single decimal point
  if (!/^(\d+\.?\d*|\.\d+)$/.test(clean)) {
    throw new SecurityError('Amount must be a valid number', 'INVALID_AMOUNT');
  }

  // Prevent leading zeros (except "0" or "0.xxx")
  if (/^0\d/.test(clean) && !clean.startsWith('0.')) {
    throw new SecurityError('Invalid number format', 'INVALID_AMOUNT');
  }

  // Validate it's a positive number
  const num = parseFloat(clean);
  if (isNaN(num) || num < 0) {
    throw new SecurityError('Amount must be a positive number', 'INVALID_AMOUNT');
  }

  return clean;
}

/**
 * Sanitize URL
 * - Remove dangerous protocols (javascript:, data:, vbscript:)
 * - Validate URL format
 */
function sanitizeUrl(url: string): string {
  // Remove whitespace
  const clean = url.replace(/\s+/g, '');

  // Check for dangerous protocols
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
  const lowerUrl = clean.toLowerCase();
  for (const protocol of dangerousProtocols) {
    if (lowerUrl.startsWith(protocol)) {
      throw new SecurityError('URL contains dangerous protocol', 'INVALID_URL');
    }
  }

  // Basic URL validation
  try {
    new URL(clean);
    return clean;
  } catch {
    throw new SecurityError('Invalid URL format', 'INVALID_URL');
  }
}

/**
 * Sanitize generic string
 * - Remove HTML/XML tags
 * - Escape special characters for safe display
 */
function sanitizeString(str: string): string {
  // Remove potentially dangerous HTML tags
  let clean = str.replace(/<[^>]*>/g, '');

  // Escape special characters for HTML context
  clean = clean
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');

  return clean;
}

/**
 * Verify address is safe
 * - Check format
 * - Check against blacklist (if any)
 */
export function isAddressSafe(address: string): boolean {
  try {
    sanitizeAddress(address);
    return true;
  } catch {
    return false;
  }
}

/**
 * Rate Limiter using Token Bucket algorithm
 *
 * Maintains per-key rate limit tracking with automatic cleanup.
 * Tokens are replenished at a constant rate within the time window.
 */
export class RateLimiter {
  private buckets: Map<string, { tokens: number; lastRefill: number }> = new Map();
  private cleanupInterval: NodeJS.Timer | null = null;

  constructor(
    private maxAttempts: number,
    private windowMs: number
  ) {
    // Cleanup stale entries every 5 minutes
    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  /**
   * Check if request is allowed
   *
   * @param key - Unique identifier (e.g., user address, IP)
   * @returns Rate limit result
   */
  check(key: string): RateLimitResult {
    const now = Date.now();
    let bucket = this.buckets.get(key);

    // Initialize bucket if not exists
    if (!bucket) {
      bucket = { tokens: this.maxAttempts, lastRefill: now };
      this.buckets.set(key, bucket);
    }

    // Refill tokens based on time elapsed
    const elapsedMs = now - bucket.lastRefill;
    const tokensToAdd = (elapsedMs / this.windowMs) * this.maxAttempts;
    bucket.tokens = Math.min(this.maxAttempts, bucket.tokens + tokensToAdd);
    bucket.lastRefill = now;

    // Check if request is allowed
    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      return {
        allowed: true,
        remainingAttempts: Math.floor(bucket.tokens),
        resetTimeMs: this.windowMs,
      };
    }

    // Calculate time until next token is available
    const timeUntilRefill = this.windowMs - (tokensToAdd * this.windowMs);
    return {
      allowed: false,
      remainingAttempts: 0,
      resetTimeMs: Math.ceil(timeUntilRefill),
    };
  }

  /**
   * Reset rate limit for a key
   */
  reset(key: string): void {
    this.buckets.delete(key);
  }

  /**
   * Reset all rate limits
   */
  resetAll(): void {
    this.buckets.clear();
  }

  /**
   * Get current state (for testing)
   */
  getState(key: string) {
    return this.buckets.get(key);
  }

  /**
   * Clean up stale entries
   */
  private cleanup(): void {
    const now = Date.now();
    const expireMs = this.windowMs * 10; // Keep entries for 10 windows

    for (const [key, bucket] of this.buckets.entries()) {
      if (now - bucket.lastRefill > expireMs) {
        this.buckets.delete(key);
      }
    }
  }

  /**
   * Destroy limiter (cleanup resources)
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.buckets.clear();
  }
}

/**
 * Pre-configured rate limiters for staking operations
 */
export const RATE_LIMITERS = {
  stake: new RateLimiter(1, 3000), // 1 request per 3 seconds
  unstake: new RateLimiter(1, 3000), // 1 request per 3 seconds
  claimRewards: new RateLimiter(1, 10000), // 1 request per 10 seconds
  general: new RateLimiter(10, 60000), // 10 requests per minute
};

/**
 * Format remaining wait time for user display
 */
export function formatWaitTime(resetTimeMs: number): string {
  const seconds = Math.ceil(resetTimeMs / 1000);
  if (seconds < 1) return 'Please try again';
  if (seconds === 1) return 'Please wait 1 second';
  return `Please wait ${seconds} seconds`;
}
