# Error Handling Best Practices

## Frontend Error Handling

### 1. Display Error Messages to Users

Always translate error codes into user-friendly messages:

```typescript
// ❌ Bad: Shows raw error code
console.error('Operation failed:', error);

// ✅ Good: User-friendly message
const errorMessages: Record<number, string> = {
  100: 'Contract is temporarily paused. Please try again later.',
  110: 'Insufficient funds. Check your balance and try again.',
  111: 'Please enter an amount greater than zero.',
  120: 'Amount exceeds maximum. Please use a smaller amount.',
  133: 'You have no active stake. Stake tokens first.',
  134: 'No rewards available to claim yet.',
};

if (error.code in errorMessages) {
  showUserAlert(errorMessages[error.code]);
}
```

### 2. Validate Before Submitting

Check conditions client-side before spending gas:

```typescript
// ❌ Bad: Let contract handle all validation
async function stake(amount: string) {
  try {
    return await contractCall('stake', [amount]);
  } catch (e) {
    // User already spent gas
  }
}

// ✅ Good: Validate first
async function stake(amount: string) {
  // Check for zero
  if (Number(amount) <= 0) {
    throw new Error('Amount must be greater than zero');
  }
  
  // Check balance
  const balance = await getBalance();
  if (balance < Number(amount)) {
    throw new Error('Insufficient balance');
  }
  
  // Check pause status
  const isPaused = await isContractPaused();
  if (isPaused) {
    throw new Error('Contract is paused');
  }
  
  // Now submit
  return await contractCall('stake', [amount]);
}
```

### 3. Handle Loading States Properly

Differentiate between waiting and error states:

```typescript
const [state, setState] = useState<'idle' | 'loading' | 'error' | 'success'>('idle');
const [errorCode, setErrorCode] = useState<number | null>(null);

async function handleStake(amount: string) {
  setState('loading');
  try {
    await stake(amount);
    setState('success');
  } catch (error) {
    setErrorCode(error.code);
    setState('error');
  }
}

return (
  <>
    {state === 'loading' && <Spinner />}
    {state === 'error' && <ErrorAlert code={errorCode} />}
    {state === 'success' && <SuccessMessage />}
  </>
);
```

### 4. Implement Exponential Backoff for Retries

```typescript
async function callWithRetry(
  fn: () => Promise<any>,
  maxAttempts = 3,
  initialDelay = 1000
) {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Don't retry on specific errors
      if (isNonRetryableError(error.code)) {
        throw error;
      }
      
      // Wait before retry
      const delay = initialDelay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

function isNonRetryableError(code: number): boolean {
  // These errors indicate user action needed, not network issue
  return [110, 111, 112, 113, 120, 121].includes(code);
}
```

### 5. Log Errors for Debugging

```typescript
interface ErrorLog {
  code: number;
  message: string;
  function: string;
  timestamp: Date;
  userAddress?: string;
}

const errorLogs: ErrorLog[] = [];

function logError(error: any, context: string) {
  const log: ErrorLog = {
    code: error.code,
    message: error.message,
    function: context,
    timestamp: new Date(),
    userAddress: getCurrentUser().address,
  };
  
  errorLogs.push(log);
  
  // Send to analytics
  if (error.code >= 130) { // Critical errors
    sendToSentry(log);
  }
}
```

---

## Smart Contract Error Handling

### 1. Use Descriptive Error Codes

```clarity
;; ❌ Bad: Generic error codes
(define-constant ERR-INVALID (err u1))

;; ✅ Good: Specific error codes
(define-constant ERR-PAUSED (err u100))
(define-constant ERR-NOT-OWNER (err u101))
(define-constant ERR-ZERO-AMOUNT (err u111))
```

### 2. Validate Early and Often

```clarity
;; ❌ Bad: Validate late
(define-public (stake (amount uint))
  (let (...) 
    (try! (transfer ...))  ;; Fails here, gas wasted
    (asserts! (> amount u0) ERR-ZERO-AMOUNT)
  )
)

;; ✅ Good: Validate first
(define-public (stake (amount uint))
  (begin
    (asserts! (not (var-get is-paused)) ERR-PAUSED)
    (asserts! (> amount u0) ERR-ZERO-AMOUNT)
    (asserts! (<= amount MAX-UINT) ERR-AMOUNT-TOO-LARGE)
    (let (...)
      (try! (transfer ...))
      (ok true)
    )
  )
)
```

### 3. Prevent Overflow/Underflow

```clarity
;; ❌ Bad: May overflow
(define-private (safe-calc (a uint) (b uint))
  (+ a b) ;; Can overflow
)

;; ✅ Good: Check for overflow
(define-private (safe-calc (a uint) (b uint))
  (if (> (+ a b) MAX-UINT)
    (err ERR-OVERFLOW)
    (ok (+ a b))
  )
)
```

### 4. Provide Context in Errors

```clarity
;; ❌ Bad: No context
(asserts! (>= balance amount) ERR-INSUFFICIENT-FUNDS)

;; ✅ Good: Clear validation message
(asserts! (and
  (> amount u0)
  (is-valid-amount amount)
  (>= balance amount)
) ERR-INSUFFICIENT-FUNDS)
```

### 5. Document Error Recovery

```clarity
;; Error u110: ERR-INSUFFICIENT-FUNDS
;;   Cause: User balance < requested amount
;;   Recovery: Check balance with get-balance, reduce request amount
;;   Related: get-balance, get-user-info

;; Error u111: ERR-ZERO-AMOUNT  
;;   Cause: Requested amount is zero
;;   Recovery: Provide amount > 0
;;   Related: MIN-STAKE-AMOUNT constant
```

---

## Testing Error Scenarios

### 1. Test Boundary Conditions

```typescript
describe('stake function', () => {
  // Test boundaries
  it('rejects zero amount', () => { /*...*/ });
  it('accepts minimum amount', () => { /*...*/ });
  it('rejects maximum amount', () => { /*...*/ });
  it('accepts maximum safe amount', () => { /*...*/ });
  
  // Test state
  it('rejects when paused', () => { /*...*/ });
  it('accepts when not paused', () => { /*...*/ });
  
  // Test user state
  it('rejects insufficient balance', () => { /*...*/ });
  it('accepts with sufficient balance', () => { /*...*/ });
});
```

### 2. Test Error Recovery

```typescript
it('should retry failed transaction', async () => {
  const result = await callWithRetry(
    () => stake(amount),
    3  // max attempts
  );
  
  expect(result).toBeSuccess();
});

it('should not retry non-recoverable errors', async () => {
  const result = await callWithRetry(
    () => stake(0), // Invalid amount
    3
  );
  
  expect(result).toEqual(types.err(types.uint(111))); // Fails immediately
});
```

---

## Monitoring & Alerting

### 1. Track Error Frequency

```typescript
interface ErrorMetrics {
  code: number;
  count: number;
  lastOccurrence: Date;
  affectedUsers: Set<string>;
}

const errorMetrics = new Map<number, ErrorMetrics>();

function trackError(code: number, user: string) {
  if (!errorMetrics.has(code)) {
    errorMetrics.set(code, {
      code,
      count: 0,
      lastOccurrence: new Date(),
      affectedUsers: new Set(),
    });
  }
  
  const metric = errorMetrics.get(code)!;
  metric.count++;
  metric.lastOccurrence = new Date();
  metric.affectedUsers.add(user);
  
  // Alert if spike
  if (metric.count > 100) {
    alertOps(`High error rate: ${code}`);
  }
}
```

### 2. Create Error Dashboards

Monitor these key metrics:
- **Error frequency** - How often each code occurs
- **Error distribution** - Which error codes are most common
- **User impact** - How many users affected
- **Temporal patterns** - When errors spike
- **Recovery time** - How long until user can retry successfully

### 3. Set Up Alerts

```typescript
const alertThresholds = {
  [100]: { threshold: 50, window: '1h' },   // ERR-PAUSED
  [101]: { threshold: 10, window: '1h' },   // ERR-NOT-OWNER
  [110]: { threshold: 100, window: '1h' },  // ERR-INSUFFICIENT-FUNDS
  [120]: { threshold: 20, window: '1h' },   // ERR-OVERFLOW
  [150]: { threshold: 1, immediate: true }, // ERR-TOTAL-STAKED-MISMATCH (Critical!)
};
```

---

## Common Pitfalls to Avoid

### ❌ Pitfall 1: Swallowing Errors

```typescript
// Bad: Error is lost
try {
  await stake(amount);
} catch (e) {
  console.log('Failed');
}

// Good: Handle error properly
try {
  await stake(amount);
} catch (e) {
  logError(e, 'stake');
  showUserAlert(getErrorMessage(e.code));
}
```

### ❌ Pitfall 2: Trusting User Input

```clarity
;; Bad: No validation
(define-public (stake (amount uint))
  (contract-call? transfer amount ...)
)

;; Good: Validate everything
(define-public (stake (amount uint))
  (begin
    (asserts! (> amount u0) ERR-ZERO-AMOUNT)
    (asserts! (is-valid-amount amount) ERR-INVALID-AMOUNT)
    (contract-call? transfer amount ...)
  )
)
```

### ❌ Pitfall 3: Ignoring State Checks

```typescript
// Bad: Don't check state first
async function stake(amount: string) {
  return await contractCall('stake', [amount]);
}

// Good: Check before submitting
async function stake(amount: string) {
  const isPaused = await isContractPaused();
  if (isPaused) throw new Error('Contract paused');
  
  return await contractCall('stake', [amount]);
}
```

### ❌ Pitfall 4: Poor Error Messages

```typescript
// Bad: Confusing message
showError('Operation failed: u110');

// Good: Clear explanation
const message = getErrorMessage(110);
// "You don't have enough STK tokens. Please check your balance.";
showError(message);
```

---

## Checklist for Error Handling

### Smart Contract Development
- [ ] All functions have error handling
- [ ] Error codes are descriptive (u100+)
- [ ] Validation happens before state changes
- [ ] Overflow/underflow protected
- [ ] Tests cover error cases
- [ ] Error codes documented
- [ ] Recovery paths documented

### Frontend Development
- [ ] Errors are caught and handled
- [ ] User messages are friendly
- [ ] Client-side validation before submit
- [ ] Network errors retried with backoff
- [ ] Error codes logged for debugging
- [ ] Error states reflected in UI
- [ ] Users can recover from errors

### Operations & Monitoring
- [ ] Error rates monitored
- [ ] Alerts configured for critical errors
- [ ] Error logs collected
- [ ] Trends analyzed monthly
- [ ] Documentation kept current
- [ ] Recovery procedures documented

---

## Quick Reference: Error Categories

| Category | Codes | Impact | Action |
|----------|-------|--------|--------|
| **User Error** | 111-114, 123 | Medium | Show helpful message |
| **Authorization** | 101-103 | High | Check permissions |
| **Balance** | 110, 121 | Medium | Check balance |
| **Paused** | 100 | Medium | Wait for unpause |
| **Rate Limits** | 111, 112, 131 | Low | Adjust parameters |
| **Critical** | 122, 150, 151 | Critical | Halt & alert ops |

---

## Further Reading

- [ERROR_CODES.md](./ERROR_CODES.md) - Complete error reference
- [Security Best Practices](./docs/SECURITY.md)
- [Testing Guide](./docs/TESTING.md)
