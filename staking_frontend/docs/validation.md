# Input Validation Utility

## Overview

The validation utility (`src/utils/validation.ts`) provides comprehensive, centralized validation for all staking operations. It ensures type safety, security, and user-friendly error messages throughout the application.

## Core Concepts

### ValidationResult Interface

All validator functions return a `ValidationResult<T>` object:

```typescript
interface ValidationResult<T = void> {
  isValid: boolean;
  error?: string;
  data?: T;
}
```

- `isValid`: Boolean indicating if validation passed
- `error`: Human-readable error message (if validation failed)
- `data`: Validated and processed data (if successful)

### Error Messages

All error messages are centralized in the `ValidationMessages` constant:

```typescript
{
  AMOUNT_REQUIRED: 'Amount is required',
  AMOUNT_INVALID: 'Amount must be a valid number',
  AMOUNT_NEGATIVE: 'Amount must be positive',
  AMOUNT_ZERO: 'Amount must be greater than zero',
  AMOUNT_TOO_LARGE: 'Amount exceeds maximum allowed',
  // ... more messages
}
```

## Validator Functions

### Amount Validators

#### validateStakeAmount(amount, maxAmount?, userBalance?)

Validates an amount to stake.

**Parameters:**
- `amount`: string | number - Amount to stake
- `maxAmount?`: number - Maximum allowed amount (u128 max by default)
- `userBalance?`: number - User's available balance

**Returns:** `ValidationResult<number>` with validated amount

**Checks:**
- Amount is provided and not empty
- Amount is a valid number
- Amount is not negative
- Amount is greater than zero
- Amount has ≤6 decimal places (microSTX precision)
- Amount doesn't exceed maximum (u128 max: 2^128 - 1)
- Amount doesn't exceed maxAmount if provided
- Amount doesn't exceed userBalance if provided

**Example:**
```typescript
const result = validateStakeAmount(
  '100.5',
  undefined,
  userBalance // e.g., 1000
);

if (result.isValid) {
  const validatedAmount = result.data; // 100.5
  // Proceed with transaction
} else {
  console.error(result.error); // Error message for UI
}
```

#### validateUnstakeAmount(amount, stakedAmount)

Validates an amount to unstake (stricter than stake validation).

**Parameters:**
- `amount`: string | number - Amount to unstake
- `stakedAmount`: number - User's current staked amount

**Returns:** `ValidationResult<number>` with validated amount

**Checks:**
- All stake validation checks
- Amount doesn't exceed user's stakedAmount

**Example:**
```typescript
const result = validateUnstakeAmount('50', userInfo.stakedAmount);
if (result.isValid) {
  const validatedAmount = result.data; // 50
}
```

### Address Validators

#### validateStacksAddress(address)

Validates a Stacks principal address (SP... or SN... format).

**Parameters:**
- `address`: string - The address to validate

**Returns:** `ValidationResult`

**Checks:**
- Address is provided (not empty)
- Address matches Stacks principal format (SP/SN followed by alphanumeric characters)

**Example:**
```typescript
const result = validateStacksAddress('SP2JXKMXPRSVZ7CJXF44JKCJQFJXAW8KWY2H2INRT');
if (result.isValid) {
  // Address is valid
}
```

#### validateContractIdentifier(identifier)

Validates a contract identifier (SP...contract-name format).

**Parameters:**
- `identifier`: string - Contract identifier (e.g., SP...staking-token)

**Returns:** `ValidationResult`

**Checks:**
- Identifier is provided
- Identifier matches contract format (principal.contract-name)

**Example:**
```typescript
const result = validateContractIdentifier('SP2JXKMXPRSVZ7CJXF44JKCJQFJXAW8KWY2H2INRT.staking-token');
if (result.isValid) {
  // Contract address is valid
}
```

#### validateTokenAddress(tokenAddress)

Validates that a token contract address is provided and valid.

**Parameters:**
- `tokenAddress`: string | undefined - Token contract address

**Returns:** `ValidationResult`

**Checks:**
- Address is provided (not undefined/empty)
- Address is a valid contract identifier

**Example:**
```typescript
const result = validateTokenAddress(tokenContractAddress);
if (result.isValid) {
  // Token address is valid
}
```

### Composite Validators

#### validateStakingParams(amount, tokenAddress, userBalance?)

Validates all parameters for a staking operation.

**Parameters:**
- `amount`: string | number - Amount to stake
- `tokenAddress`: string | undefined - Token contract address
- `userBalance?`: number - User's available balance

**Returns:** `ValidationResult`

**Checks:**
- validateStakeAmount passes
- validateTokenAddress passes

**Example:**
```typescript
const result = validateStakingParams(
  stakeAmount,
  tokenAddress,
  userBalance
);
if (result.isValid) {
  // All staking parameters are valid
  prepareTransaction(FUNCTIONS.STAKE, { amount: stakeAmount, token: tokenAddress });
}
```

#### validateUnstakingParams(amount, tokenAddress, stakedAmount)

Validates all parameters for an unstaking operation.

**Parameters:**
- `amount`: string | number - Amount to unstake
- `tokenAddress`: string | undefined - Token contract address
- `stakedAmount`: number - User's current staked amount

**Returns:** `ValidationResult`

#### validateClaimRewardsParams(tokenAddress, pendingRewards)

Validates all parameters for a claim rewards operation.

**Parameters:**
- `tokenAddress`: string | undefined - Token contract address
- `pendingRewards`: number - User's pending rewards

**Returns:** `ValidationResult`

**Checks:**
- pendingRewards > 0
- validateTokenAddress passes

### Utility Functions

#### sanitizeInput(input)

Removes potentially dangerous characters from user input.

**Returns:** Sanitized string

**Example:**
```typescript
const safe = sanitizeInput('<script>alert("xss")</script>');
// Returns: 'scriptalertxssscript'
```

#### convertToSmallestUnit(amount)

Converts token amount to smallest unit (microSTX, 6 decimal places).

**Parameters:**
- `amount`: number - Amount in tokens

**Returns:** string - Amount in smallest units as string (for Clarity uint128)

**Example:**
```typescript
const smallestUnit = convertToSmallestUnit(100.5);
// Returns: '100500000' (100.5 * 1,000,000)
```

#### convertFromSmallestUnit(smallestUnit)

Converts smallest unit back to tokens.

**Parameters:**
- `smallestUnit`: number | string - Amount in smallest units

**Returns:** number - Amount in tokens

**Example:**
```typescript
const tokens = convertFromSmallestUnit(100500000);
// Returns: 100.5
```

## Integration Examples

### In a React Component

```typescript
import { useState } from 'react';
import {
  validateStakeAmount,
  ValidationMessages,
} from '@/utils/validation';
import { useStakingContract } from '@/hooks/useStakingContract';

function StakingForm() {
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const { prepareTransaction, FUNCTIONS } = useStakingContract();

  const handleStake = () => {
    setError('');
    
    const validation = validateStakeAmount(amount, undefined, userBalance);
    if (!validation.isValid) {
      setError(validation.error || ValidationMessages.GENERAL_ERROR);
      return;
    }

    try {
      // prepareTransaction validates internally and throws on error
      const txOptions = prepareTransaction(FUNCTIONS.STAKE, {
        amount: validation.data,
      });
      // Submit transaction...
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <input value={amount} onChange={(e) => setAmount(e.target.value)} />
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <button onClick={handleStake}>Stake</button>
    </div>
  );
}
```

### In the useStakingContract Hook

The hook's `prepareTransaction` function automatically validates parameters:

```typescript
// Validation happens automatically in prepareTransaction
const txOptions = prepareTransaction(FUNCTIONS.STAKE, {
  amount: 100,
  token: tokenAddress,
  stakedAmount: userStaked,
});

// If validation fails, an error is thrown with a descriptive message
// "Amount exceeds maximum allowed"
```

## Best Practices

1. **Always Check Validation Result**
   ```typescript
   const result = validateStakeAmount(amount);
   if (!result.isValid) {
     // Show error to user
     displayError(result.error);
     return;
   }
   // Use validated data
   const validAmount = result.data;
   ```

2. **Use Composite Validators When Possible**
   ```typescript
   // Bad: Multiple calls
   if (!validateStakeAmount(...).isValid) return;
   if (!validateTokenAddress(...).isValid) return;

   // Good: Single call
   if (!validateStakingParams(...).isValid) return;
   ```

3. **Clear Errors on New Input**
   ```typescript
   const handleAmountChange = (value) => {
     setAmount(value);
     setError(''); // Clear previous error
   };
   ```

4. **Display User-Friendly Messages**
   ```typescript
   // Always use error message from validation result
   setError(validation.error || 'Validation failed');
   ```

5. **Convert Before Blockchain Submission**
   ```typescript
   const validAmount = validation.data; // 100.5
   const blockchainAmount = convertToSmallestUnit(validAmount);
   // Now submit blockchainAmount as uint128
   ```

## Constants Reference

### Validation Limits

- **MIN_AMOUNT**: 0 (exclusive, must be > 0)
- **MAX_SAFE_AMOUNT**: 2^128 - 1 (340,282,366,920,938,463,463,374,607,431,768,211,455)
- **DECIMAL_PLACES_MAX**: 6 (microSTX precision)
- **STACKS_PRINCIPAL_REGEX**: `/^(SP|SN)[A-Z0-9]{39,41}$/`
- **CONTRACT_IDENTIFIER_REGEX**: `/^(SP|SN)[A-Z0-9]{39,41}\.[a-z0-9\-]+$/i`

## Testing Validation

Example test cases:

```typescript
import { validateStakeAmount } from '@/utils/validation';

// Valid amounts
validateStakeAmount('100'); // ✓ Valid
validateStakeAmount('100.5'); // ✓ Valid
validateStakeAmount(100.5); // ✓ Valid

// Invalid amounts
validateStakeAmount(''); // ✗ AMOUNT_REQUIRED
validateStakeAmount('abc'); // ✗ AMOUNT_INVALID
validateStakeAmount('-10'); // ✗ AMOUNT_NEGATIVE
validateStakeAmount('0'); // ✗ AMOUNT_ZERO
validateStakeAmount('100.123456789'); // ✗ AMOUNT_INSUFFICIENT_PRECISION
validateStakeAmount('100', undefined, 50); // ✗ AMOUNT_INSUFFICIENT_BALANCE
```

## Error Handling Strategy

The validation module follows a **fail-fast** strategy:

1. Validators check constraints in order of importance
2. Return immediately on first failed check
3. Provide specific error message for debugging
4. Allow graceful error recovery in UI

This ensures users get actionable feedback on what needs to be fixed.
