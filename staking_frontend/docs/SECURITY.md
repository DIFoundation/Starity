# Security Best Practices Guide

## Overview

This document outlines the security measures implemented in the Starity staking frontend to protect against common web vulnerabilities and provide a secure user experience.

## Key Security Features

### 1. Input Sanitization

All user inputs are validated and sanitized to prevent XSS attacks and malicious data injection.

#### Sanitization by Type

**String Sanitization:**
- Removes HTML tags and special characters
- Escapes characters for safe HTML display
- Prevents script injection

```typescript
import { sanitizeInput } from '@/services/security';

// Sanitize a generic string
const safe = sanitizeInput('<script>alert("xss")</script>', 'string');
// Result: "alert(&#x22;xss&#x22;)" (escaped)
```

**Address Sanitization:**
- Validates Stacks address format (SP* or SM* prefixes)
- Removes whitespace
- Ensures proper length and character set

```typescript
const address = sanitizeInput('SP2XNWLQF7HJFXPSJFYHD98N3YZFC52H8TE4TSPJ', 'address');
// Valid: "SP2XNWLQF7HJFXPSJFYHD98N3YZFC52H8TE4TSPJ"

const invalid = sanitizeInput('invalid-address', 'address');
// Throws SecurityError
```

**Amount Sanitization:**
- Validates numeric format
- Prevents negative numbers
- Removes HTML/XSS characters
- Validates decimal precision

```typescript
const amount = sanitizeInput('1000.50', 'amount');
// Valid: "1000.50"

const bad = sanitizeInput('1000<script>', 'amount');
// Throws SecurityError
```

**URL Sanitization:**
- Blocks dangerous protocols (javascript:, data:, vbscript:, file:)
- Validates URL format

```typescript
const url = sanitizeInput('https://explorer.stacks.co', 'url');
// Valid: "https://explorer.stacks.co"

const malicious = sanitizeInput('javascript:alert("xss")', 'url');
// Throws SecurityError
```

### 2. Input Validation

Validation occurs at multiple layers:

1. **Form Level** - Immediate user feedback
2. **Hook Level** - Rate limiting and sanitization
3. **Service Level** - Final validation before submission

```typescript
import { validateAddressSafely, validateAmountSafely } from '@/services/sanitization';

// Validate without throwing exceptions
const addressValidation = validateAddressSafely(userInput);
if (!addressValidation.valid) {
  console.log(addressValidation.message); // "Invalid Stacks address format"
}

const amountValidation = validateAmountSafely(userAmount);
if (!amountValidation.valid) {
  console.log(amountValidation.message); // "Amount must be a valid number"
}
```

### 3. Rate Limiting

Rate limiting prevents spam, abuse, and brute force attacks by restricting the number of requests per user per time window.

#### Pre-configured Limits

- **Stake:** 1 request per 3 seconds per contract
- **Unstake:** 1 request per 3 seconds per contract
- **Claim Rewards:** 1 request per 10 seconds per contract
- **General:** 10 requests per minute

#### Using Rate Limiting in Hooks

```typescript
import { useRateLimiter } from '@/hooks/useRateLimiter';

function StakingComponent() {
  const { check, isLimited, waitTimeFormatted } = useRateLimiter({
    maxAttempts: 1,
    windowMs: 3000,
    onRateLimited: (error) => {
      toast({
        title: 'Rate Limited',
        description: error.message,
        status: 'warning',
      });
    },
  });

  const handleStake = async () => {
    // Check rate limit for this user
    if (!check('user-stake-action')) {
      return; // Rate limited
    }

    // Proceed with stake
    await executeStakingCall('stake', amount);
  };

  return (
    <button onClick={handleStake} disabled={isLimited}>
      {isLimited ? waitTimeFormatted : 'Stake'}
    </button>
  );
}
```

#### Using Pre-built Staking Limiters

```typescript
import { useStakeRateLimiter, useUnstakeRateLimiter, useClaimRateLimiter } from '@/hooks/useRateLimiter';

function StakingPage() {
  const stakeLimit = useStakeRateLimiter((error) => {
    console.log('Rate limited:', error.message);
  });

  const handleStake = () => {
    if (!stakeLimit.check('current-user')) {
      console.log('Please wait:', stakeLimit.waitTimeFormatted);
      return;
    }
    // Execute stake
  };

  return <button onClick={handleStake}>Stake</button>;
}
```

#### Rate Limiter Configuration

Create custom rate limiters with your own configuration:

```typescript
import { RateLimiter } from '@/services/security';

// Allow 5 requests per 10 seconds
const customLimiter = new RateLimiter(5, 10000);

const result = customLimiter.check('user-123');

if (result.allowed) {
  console.log(`Request allowed. ${result.remainingAttempts} attempts remaining`);
} else {
  console.log(`Rate limited. Try again in ${result.resetTimeMs}ms`);
}

// Clean up
customLimiter.destroy();
```

#### Token Bucket Algorithm

Rate limiting uses the token bucket algorithm:

1. Each key starts with `maxAttempts` tokens
2. Each request uses 1 token
3. Tokens are refilled at a constant rate within the time window
4. Requests are allowed if tokens are available
5. Excess requests are rejected with reset time

### 4. XSS Prevention

Multiple layers protect against Cross-Site Scripting (XSS):

**HTML Escaping:**
```typescript
import { escapeHtml } from '@/services/sanitization';

const userText = '<img src=x onerror="alert(\'xss\')">';
const safe = escapeHtml(userText);
// Result: "&lt;img src=x onerror=&quot;alert('xss')&quot;&gt;"
```

**Safe Address Display:**
```typescript
import { displayAddress, truncateAddress } from '@/services/sanitization';

// Safe display (with fallback for invalid)
const display = displayAddress(userProvidedAddress);

// Truncated display (e.g., for UI space constraints)
const short = truncateAddress(address, 8, 6);
// Result: "SP2XNWLQ...TE4TSPJ"
```

**Content Security Policy** (Recommended):
Add to `next.config.ts`:
```typescript
headers: async () => [
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; script-src 'self' 'wasm-unsafe-eval'",
  },
],
```

### 5. Address Validation

All Stacks addresses are validated before use:

```typescript
import { isAddressSafe } from '@/services/security';

if (isAddressSafe(userAddress)) {
  // Proceed with address
} else {
  // Invalid address - show error
}
```

## Security Best Practices for Development

### 1. Always Sanitize User Input

```typescript
// ❌ BAD - Direct use of user input
function handleTransaction(amount) {
  executeStakingCall('stake', amount);
}

// ✅ GOOD - Sanitize first
function handleTransaction(amount) {
  try {
    const sanitized = sanitizeInput(amount, 'amount');
    executeStakingCall('stake', sanitized);
  } catch (error) {
    showError(error.message);
  }
}
```

### 2. Use Type-Specific Sanitization

```typescript
// ❌ BAD - Generic sanitization
const safe = sanitizeInput(userAddress, 'string');

// ✅ GOOD - Type-specific
const safe = sanitizeInput(userAddress, 'address');
```

### 3. Implement Rate Limiting for User Actions

```typescript
// ❌ BAD - No rate limiting
async function stake(amount) {
  return await executeStakingCall('stake', amount);
}

// ✅ GOOD - With rate limiting
function StakePage() {
  const limiter = useStakeRateLimiter();

  async function stake(amount) {
    if (!limiter.check('user-stake')) {
      return; // Rate limited
    }
    return await executeStakingCall('stake', amount);
  }
}
```

### 4. Handle Errors Gracefully

```typescript
import { SecurityError, RateLimitError } from '@/services/security';

try {
  const amount = sanitizeInput(userAmount, 'amount');
} catch (error) {
  if (error instanceof RateLimitError) {
    // Handle rate limit specifically
    console.log(`Try again in ${error.resetTimeMs}ms`);
  } else if (error instanceof SecurityError) {
    // Handle other security errors
    console.log(`Invalid input: ${error.code}`);
  } else {
    throw error;
  }
}
```

### 5. Display User-Friendly Error Messages

```typescript
import { displayAddress } from '@/services/sanitization';

// Safe to display even if malicious
const safeAddress = displayAddress(potentiallyMaliciousAddress);
console.log(`Staking from ${safeAddress}`);
```

## Common Vulnerabilities Prevented

| Vulnerability | Prevention | Example |
|---|---|---|
| **XSS (Cross-Site Scripting)** | HTML escaping, input sanitization | `<script>alert('xss')</script>` → escaped |
| **Injection Attacks** | Input validation and sanitization | `; DROP TABLE users;` → invalid |
| **Spam/DoS** | Rate limiting, token bucket | 10+ requests/sec → blocked |
| **Address Spoofing** | Address format validation | `invalid-address` → rejected |
| **Amount Manipulation** | Numeric validation | `-1000` or `999999999999x` → rejected |
| **Malicious URLs** | Protocol validation | `javascript:alert()` → blocked |

## Configuration

### Environment Variables

```bash
# Maximum requests per action (stake, unstake, claim)
NEXT_PUBLIC_MAX_STAKE_ATTEMPTS=1
NEXT_PUBLIC_STAKE_WINDOW_MS=3000

NEXT_PUBLIC_MAX_UNSTAKE_ATTEMPTS=1
NEXT_PUBLIC_UNSTAKE_WINDOW_MS=3000

NEXT_PUBLIC_MAX_CLAIM_ATTEMPTS=1
NEXT_PUBLIC_CLAIM_WINDOW_MS=10000
```

### Customizing Rate Limits

Modify `src/services/security.ts`:
```typescript
export const RATE_LIMITERS = {
  stake: new RateLimiter(1, 3000), // 1 per 3s
  unstake: new RateLimiter(1, 3000), // 1 per 3s
  claimRewards: new RateLimiter(1, 10000), // 1 per 10s
  general: new RateLimiter(10, 60000), // 10 per 60s
};
```

## Monitoring & Logging

### Security Events to Log

```typescript
import { logEvent } from '@/services/logger'; // If using structured logging

// Rate limit hit
logEvent('security:rate_limit_exceeded', {
  action: 'stake',
  resetTimeMs: 3000,
  timestamp: new Date().toISOString(),
});

// Invalid input detected
logEvent('security:invalid_input', {
  type: 'address',
  reason: 'Invalid format',
  timestamp: new Date().toISOString(),
});

// Suspicious activity
logEvent('security:suspicious_activity', {
  pattern: 'rapid_requests',
  count: 50,
  timeWindow: '1m',
});
```

## Testing Security

### Unit Tests

```typescript
import { sanitizeInput, isAddressSafe } from '@/services/security';

describe('Security', () => {
  it('prevents XSS in strings', () => {
    const result = sanitizeInput('<script>alert("xss")</script>', 'string');
    expect(result).not.toContain('<script>');
  });

  it('validates addresses', () => {
    expect(isAddressSafe('SP2XNWLQF7HJFXPSJFYHD98N3YZFC52H8TE4TSPJ')).toBe(true);
    expect(isAddressSafe('invalid')).toBe(false);
  });
});
```

### Security Audit Checklist

- [ ] All user inputs sanitized before use
- [ ] All forms validate inputs before submission
- [ ] Rate limiting applied to sensitive actions
- [ ] Error messages don't expose sensitive info
- [ ] No sensitive data in URLs or logs
- [ ] HTTPS enforced in production
- [ ] No XSS vectors in rendered content
- [ ] API keys not committed to repository
- [ ] CORS properly configured
- [ ] Regular security updates applied

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [Stacks Security Docs](https://docs.stacks.co/build-apps/security)

## Support

For security issues:
1. **Do not** create public GitHub issues
2. Report to: security@starity.dev (or your security email)
3. Include detailed reproduction steps
4. Allow 48 hours for response

---

**Last Updated:** January 31, 2026  
**Version:** 1.0.0
