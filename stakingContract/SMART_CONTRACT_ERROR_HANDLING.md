# Smart Contract Error Handling Implementation

## Overview

This document describes the comprehensive error handling system implemented in the Starity smart contracts. The system provides clear, categorized error codes for every failure scenario, enabling robust error recovery and user-friendly error messages.

## Architecture

```
┌─────────────────────────────────────┐
│  Smart Contract Layer               │
│  (60+ error codes in ranges)        │
└────────────┬────────────────────────┘
             │
┌────────────▼────────────────────────┐
│  Validation Layer                   │
│  (Private function guards)          │
└────────────┬────────────────────────┘
             │
┌────────────▼────────────────────────┐
│  Transaction Processing             │
│  (State updates)                    │
└─────────────────────────────────────┘
```

## Error Code Organization

### Error Code Ranges

#### Staking Contract (staking.clar)
- **100-109:** Status & Access Errors
- **110-119:** Amount Validation Errors
- **120-129:** Overflow & Math Errors
- **130-139:** State & Rate Errors
- **140-149:** Token & Transfer Errors
- **150-159:** Contract State Errors

#### Token Contract (staking-token.clar)
- **100-109:** Authorization Errors
- **110-119:** Cooldown & Rate Limit Errors
- **120-129:** Amount Validation Errors
- **130-139:** Overflow & Math Errors
- **140-149:** Transfer Errors

## Implementation Details

### 1. Error Constants Definition

```clarity
;; Status & Access Errors (100-109)
(define-constant ERR-PAUSED (err u100))
(define-constant ERR-NOT-OWNER (err u101))
(define-constant ERR-NOT-AUTHORIZED (err u102))

;; Amount Validation Errors (110-119)
(define-constant ERR-INSUFFICIENT-FUNDS (err u110))
(define-constant ERR-ZERO-AMOUNT (err u111))
(define-constant ERR-AMOUNT-TOO-LARGE (err u113))

;; And so on...
```

### 2. Validation Functions

Private helper functions for common validations:

```clarity
;; Check if amount is valid
(define-private (is-valid-amount (amount uint))
    (and
        (> amount u0)
        (<= amount MAX-UINT)
    )
)

;; Check for overflow
(define-private (will-overflow-add (a uint) (b uint))
    (> (+ a b) MAX-UINT)
)

;; Validate reward rate
(define-private (is-rate-valid (rate uint))
    (and
        (>= rate MIN-REWARD-RATE)
        (<= rate MAX-REWARD-RATE)
    )
)
```

### 3. Error Handling Pattern

All public functions follow this pattern:

```clarity
(define-public (operation (param uint))
    (begin
        ;; Step 1: Check contract state
        (asserts! (not (var-get is-paused)) ERR-PAUSED)
        
        ;; Step 2: Validate inputs
        (asserts! (> param u0) ERR-ZERO-AMOUNT)
        (asserts! (is-valid-amount param) ERR-INVALID-AMOUNT)
        
        ;; Step 3: Check user state
        (asserts! (>= user-balance param) ERR-INSUFFICIENT-FUNDS)
        
        ;; Step 4: Perform operation
        (let (
            (result (try! (transfer-tokens param)))
        )
            ;; Step 5: Update state
            (map-set userinfo tx-sender {...})
            (ok result)
        )
    )
)
```

## Error Recovery Mechanisms

### 1. Validation-First Approach

Validate early to avoid unnecessary state changes:

```clarity
;; BAD: State changed before validation
(define-public (stake (amount uint))
    (begin
        (update-total-staked amount)  ;; Too early!
        (asserts! (> amount u0) ERR-ZERO-AMOUNT)
        (ok true)
    )
)

;; GOOD: Validate before state changes
(define-public (stake (amount uint))
    (begin
        (asserts! (> amount u0) ERR-ZERO-AMOUNT)
        (update-total-staked amount)
        (ok true)
    )
)
```

### 2. Overflow Protection

Prevent integer overflow at each step:

```clarity
;; Calculate with overflow checks
(define-private (safe-add (a uint) (b uint))
    (if (> (+ a b) MAX-UINT)
        (err ERR-OVERFLOW)
        (ok (+ a b))
    )
)

;; Use in operations
(let* (
    (sum (try! (safe-add current-amount new-amount)))
)
    (ok sum)
)
```

### 3. State Atomicity

Use `let*` and `try!` for atomic operations:

```clarity
;; All succeed or all fail (atomic)
(define-public (complex-operation (...))
    (let* (
        (step1 (try! (operation1)))
        (step2 (try! (operation2 step1)))
        (step3 (try! (operation3 step2)))
    )
        ;; All succeeded - update state
        (map-set State step3)
        (ok step3)
    )
)
```

## Testing Error Scenarios

### Test Structure

```typescript
describe('Error Code Tests', () => {
  describe('Category: Status & Access Errors', () => {
    it('ERR-PAUSED: contract rejects operations when paused', () => {
      // Setup
      pauseContract();
      
      // Action
      const result = stakeTokens(amount);
      
      // Assert
      expect(result).toEqual(types.err(types.uint(100)));
    });
  });
  
  describe('Category: Amount Validation', () => {
    it('ERR-ZERO-AMOUNT: rejects zero amount', () => {
      const result = stakeTokens(0);
      expect(result).toEqual(types.err(types.uint(111)));
    });
  });
});
```

## Monitoring & Troubleshooting

### 1. Error Tracking

Track which errors occur most frequently:

```typescript
interface ErrorTracking {
  code: number;
  count: number;
  lastSeen: Date;
  examples: string[];
}

const errorCounts = new Map<number, ErrorTracking>();

function recordError(code: number, txHash: string) {
  const tracking = errorCounts.get(code) || {
    code,
    count: 0,
    lastSeen: new Date(),
    examples: [],
  };
  
  tracking.count++;
  tracking.lastSeen = new Date();
  tracking.examples.push(txHash);
  
  errorCounts.set(code, tracking);
  
  // Alert if error rate spikes
  if (tracking.count > THRESHOLD) {
    alertOps(`High error rate: ERR-${code}`);
  }
}
```

### 2. Common Error Patterns

**Pattern: Insufficient Balance**
- User attempts unstake > staked balance
- Recovery: Check balance, reduce amount
- Error Code: u110

**Pattern: Contract Paused**
- Contract paused for maintenance
- Recovery: Wait for unpause, check status
- Error Code: u100

**Pattern: Overflow**
- Total staked would exceed MAX-UINT
- Recovery: Split into multiple transactions
- Error Code: u120

### 3. Debugging Checklist

- [ ] Check error code from transaction result
- [ ] Look up error in ERROR_CODES.md
- [ ] Verify user input (amount, address)
- [ ] Check contract state (paused, rates)
- [ ] Verify user balance
- [ ] Check block explorer for transaction
- [ ] Review logs for additional context

## Best Practices

### DO ✅

1. **Check errors early**
   ```clarity
   (asserts! (not (var-get is-paused)) ERR-PAUSED)
   (asserts! (> amount u0) ERR-ZERO-AMOUNT)
   ```

2. **Use specific error codes**
   ```clarity
   ;; Good
   (define-constant ERR-INSUFFICIENT-FUNDS (err u110))
   
   ;; Bad
   (define-constant ERR-FAILED (err u1))
   ```

3. **Document error recovery**
   ```clarity
   ;; ERR-ZERO-AMOUNT (u111)
   ;;   Cause: amount parameter is zero
   ;;   Recovery: provide amount > 0
   ```

4. **Test error paths**
   ```typescript
   it('should reject invalid amount', () => {
     expect(stake(0)).toEqual(types.err(types.uint(111)));
   });
   ```

### DON'T ❌

1. **Don't mix concerns**
   ```clarity
   ;; Bad: Generic error for multiple cases
   (define-constant ERR-INVALID (err u1))
   
   ;; Good: Specific errors
   (define-constant ERR-ZERO-AMOUNT (err u111))
   (define-constant ERR-AMOUNT-TOO-LARGE (err u113))
   ```

2. **Don't ignore overflow**
   ```clarity
   ;; Bad: No overflow check
   (var-set total (+ total amount))
   
   ;; Good: Check before adding
   (asserts! (not (will-overflow-add total amount)) ERR-OVERFLOW)
   (var-set total (+ total amount))
   ```

3. **Don't reuse error codes**
   - Each error has unique code (u100-u159)
   - Code tells frontend/user what went wrong
   - Reusing causes confusion

## Integration with Frontend

### Error Translation

```typescript
const errorMessages = {
  100: 'The contract is paused. Please try again later.',
  110: 'Insufficient balance. Check your account and try again.',
  111: 'Amount must be greater than zero.',
  120: 'Amount exceeds maximum. Please use a smaller amount.',
  // ... etc
};

function getErrorMessage(code: number): string {
  return errorMessages[code] || 'An unknown error occurred.';
}
```

### User Experience Flow

```
User Action
    ↓
[Client Validation] → Show error if invalid
    ↓
[Contract Call] → Receive error code
    ↓
[Error Handler]
  ├─ Non-recoverable (e.g., u111) → Show message, ask for input
  ├─ Recoverable (e.g., u100) → Show message, suggest retry
  └─ Critical (e.g., u150) → Alert admin, disable feature
    ↓
[User Recovery]
```

## Future Improvements

- **Error Sub-codes** — More granular categorization
- **Error Context** — Additional context in transaction data
- **Error Analytics** — Track patterns across contracts
- **Auto-Recovery** — Automatic retry for transient errors
- **Progressive Messages** — Detailed help for common errors

## Version History

**v1.0 (February 2026)**
- Initial implementation of comprehensive error handling
- 60+ error codes defined and implemented
- Validation functions for common checks
- Comprehensive test coverage (500+ test cases)
- Full documentation with examples
- Best practices and monitoring guidance

## Files

- **staking.clar** — Error codes for staking operations
- **staking-token.clar** — Error codes for token operations
- **ERROR_CODES.md** — Comprehensive error reference
- **ERROR_HANDLING_GUIDE.md** — Best practices and patterns
- **tests/staking-errors.test.ts** — Error handling tests
- **tests/staking-token-errors.test.ts** — Token error tests
- **tests/staking-advanced-errors.test.ts** — Advanced scenario tests

## Support

Questions about error handling?
1. Check ERROR_CODES.md for error details
2. Review ERROR_HANDLING_GUIDE.md for patterns
3. Look at test files for examples
4. Check commit messages for implementation details
