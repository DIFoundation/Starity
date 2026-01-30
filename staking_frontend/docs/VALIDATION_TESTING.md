# Validation Testing Guide

This guide provides comprehensive test cases and patterns for the validation utility module.

## Table of Contents

- [Unit Test Examples](#unit-test-examples)
- [Edge Cases](#edge-cases)
- [Integration Test Patterns](#integration-test-patterns)
- [Performance Testing](#performance-testing)
- [Test Utilities](#test-utilities)

## Unit Test Examples

### Testing validateStakeAmount

```typescript
import { validateStakeAmount, ValidationMessages } from '@/utils/validation';

describe('validateStakeAmount', () => {
  it('should validate positive amounts', () => {
    const result = validateStakeAmount('100.5');
    expect(result.isValid).toBe(true);
    expect(result.data).toBe(100.5);
  });

  it('should reject empty amounts', () => {
    const result = validateStakeAmount('');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe(ValidationMessages.AMOUNT_REQUIRED);
  });

  it('should reject invalid numbers', () => {
    const result = validateStakeAmount('abc');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe(ValidationMessages.AMOUNT_INVALID);
  });

  it('should reject negative amounts', () => {
    const result = validateStakeAmount('-50');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe(ValidationMessages.AMOUNT_NEGATIVE);
  });

  it('should reject zero', () => {
    const result = validateStakeAmount('0');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe(ValidationMessages.AMOUNT_ZERO);
  });

  it('should reject amounts with too many decimals', () => {
    const result = validateStakeAmount('100.1234567');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe(ValidationMessages.AMOUNT_INSUFFICIENT_PRECISION);
  });

  it('should validate amounts with correct decimal places', () => {
    const result = validateStakeAmount('100.123456');
    expect(result.isValid).toBe(true);
    expect(result.data).toBe(100.123456);
  });

  it('should respect max amount', () => {
    const result = validateStakeAmount('1000', 500);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe(ValidationMessages.AMOUNT_TOO_LARGE);
  });

  it('should respect user balance', () => {
    const result = validateStakeAmount('1000', undefined, 500);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe(ValidationMessages.AMOUNT_INSUFFICIENT_BALANCE);
  });

  it('should accept amounts as numbers', () => {
    const result = validateStakeAmount(100.5);
    expect(result.isValid).toBe(true);
    expect(result.data).toBe(100.5);
  });

  it('should handle very large numbers', () => {
    const result = validateStakeAmount('999999999999999999999');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe(ValidationMessages.AMOUNT_TOO_LARGE);
  });

  it('should handle scientific notation', () => {
    const result = validateStakeAmount('1e2');
    expect(result.isValid).toBe(true);
    expect(result.data).toBe(100);
  });
});
```

### Testing validateUnstakeAmount

```typescript
describe('validateUnstakeAmount', () => {
  const stakedAmount = 500;

  it('should validate amount less than staked', () => {
    const result = validateUnstakeAmount('200', stakedAmount);
    expect(result.isValid).toBe(true);
    expect(result.data).toBe(200);
  });

  it('should reject amount greater than staked', () => {
    const result = validateUnstakeAmount('600', stakedAmount);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe(ValidationMessages.AMOUNT_INSUFFICIENT_BALANCE);
  });

  it('should accept amount equal to staked', () => {
    const result = validateUnstakeAmount('500', stakedAmount);
    expect(result.isValid).toBe(true);
    expect(result.data).toBe(500);
  });

  it('should reject zero staked amount', () => {
    const result = validateUnstakeAmount('100', 0);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe(ValidationMessages.AMOUNT_INSUFFICIENT_BALANCE);
  });

  it('should validate with decimal amounts', () => {
    const result = validateUnstakeAmount('250.5', stakedAmount);
    expect(result.isValid).toBe(true);
  });
});
```

### Testing validateStacksAddress

```typescript
describe('validateStacksAddress', () => {
  it('should accept valid SP address', () => {
    const result = validateStacksAddress('SP2JXKMH4R3YJJ5MKBAXJ5DZX3N6Q6S59GVHWFVS7');
    expect(result.isValid).toBe(true);
  });

  it('should accept valid SN address', () => {
    const result = validateStacksAddress('SN2JXKMH4R3YJJ5MKBAXJ5DZX3N6Q6S59GVHWFVS7');
    expect(result.isValid).toBe(true);
  });

  it('should reject invalid prefix', () => {
    const result = validateStacksAddress('ST2JXKMH4R3YJJ5MKBAXJ5DZX3N6Q6S59GVHWFVS7');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe(ValidationMessages.ADDRESS_INVALID_PRINCIPAL);
  });

  it('should reject too short address', () => {
    const result = validateStacksAddress('SP2JXKMH');
    expect(result.isValid).toBe(false);
  });

  it('should reject lowercase address', () => {
    const result = validateStacksAddress('sp2jxkmh4r3yjj5mkbaxj5dzx3n6q6s59gvhwfvs7');
    expect(result.isValid).toBe(false);
  });

  it('should reject empty address', () => {
    const result = validateStacksAddress('');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe(ValidationMessages.ADDRESS_REQUIRED);
  });

  it('should handle whitespace', () => {
    const result = validateStacksAddress('  SP2JXKMH4R3YJJ5MKBAXJ5DZX3N6Q6S59GVHWFVS7  ');
    expect(result.isValid).toBe(true);
  });

  it('should reject invalid characters', () => {
    const result = validateStacksAddress('SP2JXKMH4R3YJJ5MKBAXJ5DZX3N6Q6S59GVHWFVS@');
    expect(result.isValid).toBe(false);
  });
});
```

### Testing validateContractIdentifier

```typescript
describe('validateContractIdentifier', () => {
  it('should accept valid contract identifier', () => {
    const result = validateContractIdentifier('SP2JXKMH4R3YJJ5MKBAXJ5DZX3N6Q6S59GVHWFVS7.staking-token');
    expect(result.isValid).toBe(true);
  });

  it('should accept contract with hyphens', () => {
    const result = validateContractIdentifier('SP2JXKMH4R3YJJ5MKBAXJ5DZX3N6Q6S59GVHWFVS7.my-staking-contract');
    expect(result.isValid).toBe(true);
  });

  it('should accept contract with numbers', () => {
    const result = validateContractIdentifier('SP2JXKMH4R3YJJ5MKBAXJ5DZX3N6Q6S59GVHWFVS7.token-v2');
    expect(result.isValid).toBe(true);
  });

  it('should reject missing dot', () => {
    const result = validateContractIdentifier('SP2JXKMH4R3YJJ5MKBAXJ5DZX3N6Q6S59GVHWFVS7-staking');
    expect(result.isValid).toBe(false);
  });

  it('should reject missing contract name', () => {
    const result = validateContractIdentifier('SP2JXKMH4R3YJJ5MKBAXJ5DZX3N6Q6S59GVHWFVS7.');
    expect(result.isValid).toBe(false);
  });

  it('should reject invalid address part', () => {
    const result = validateContractIdentifier('INVALID.staking-token');
    expect(result.isValid).toBe(false);
  });

  it('should reject uppercase contract name', () => {
    const result = validateContractIdentifier('SP2JXKMH4R3YJJ5MKBAXJ5DZX3N6Q6S59GVHWFVS7.STAKING');
    expect(result.isValid).toBe(false);
  });
});
```

## Edge Cases

### Amount Edge Cases

```typescript
// Maximum safe integer
validateStakeAmount((Math.pow(2, 128) - 1).toString());

// Minimum positive amount
validateStakeAmount('0.000001');

// Scientific notation
validateStakeAmount('1e10');

// String with spaces
validateStakeAmount('  100.5  ');

// Floating point precision edge case
validateStakeAmount('0.1 + 0.2'); // Should fail - invalid format

// Very small decimal
validateStakeAmount('0.0000001'); // Should fail - too many decimals

// Infinity and NaN
validateStakeAmount('Infinity'); // Should fail
validateStakeAmount('NaN'); // Should fail
```

### Address Edge Cases

```typescript
// Mixed case should fail
validateStacksAddress('Sp2JXKMH4R3YJJ5MKBAXJ5DZX3N6Q6S59GVHWFVS7');

// Address with special characters
validateStacksAddress('SP2JXKMH4R3YJJ5MKBAXJ5DZX3N6Q6S59GVHWFVS7!');

// Address with extra length
validateStacksAddress('SP2JXKMH4R3YJJ5MKBAXJ5DZX3N6Q6S59GVHWFVS7EXTRA');

// Address with checksum variant (if applicable)
// Depending on Stacks implementation

// Unicode characters
validateStacksAddress('SP2JXKMH4R3YJJ5MKBAXJ5DZX3N6Q6S59GVHWFVS7🚀');
```

## Integration Test Patterns

### Testing Page Handler Integration

```typescript
describe('Page Handler Integration', () => {
  it('should handle stake with validation', async () => {
    const { container } = render(<StakingPage />);
    
    // Enter valid amount
    const input = container.querySelector('input[type="number"]');
    fireEvent.change(input, { target: { value: '100.5' } });
    
    // Click stake button
    const stakeButton = screen.getByRole('button', { name: /stake/i });
    fireEvent.click(stakeButton);
    
    // Should not show error
    expect(screen.queryByText(/insufficient balance/i)).not.toBeInTheDocument();
  });

  it('should display validation error for insufficient balance', async () => {
    const { container } = render(
      <StakingPage userBalance={50} />
    );
    
    // Enter amount greater than balance
    const input = container.querySelector('input[type="number"]');
    fireEvent.change(input, { target: { value: '100' } });
    
    // Click stake button
    const stakeButton = screen.getByRole('button', { name: /stake/i });
    fireEvent.click(stakeButton);
    
    // Should show error
    expect(screen.getByText(/insufficient balance/i)).toBeInTheDocument();
  });

  it('should prevent submission with invalid amount', async () => {
    const mockSubmit = jest.fn();
    const { container } = render(
      <StakingPage onSubmit={mockSubmit} />
    );
    
    // Try to submit with invalid amount
    const input = container.querySelector('input[type="number"]');
    fireEvent.change(input, { target: { value: 'invalid' } });
    
    const button = screen.getByRole('button', { name: /stake/i });
    fireEvent.click(button);
    
    // Should not call submit
    expect(mockSubmit).not.toHaveBeenCalled();
  });
});
```

### Testing Hook Integration

```typescript
describe('useStakingContract Hook', () => {
  it('should validate stake parameters before creating transaction', () => {
    const { result } = renderHook(() => useStakingContract());
    
    expect(() => {
      result.current.prepareTransaction('stake', {
        amount: 'invalid',
        token: 'SP2JXKMH4R3YJJ5MKBAXJ5DZX3N6Q6S59GVHWFVS7.token',
      });
    }).toThrow();
  });

  it('should validate token address', () => {
    const { result } = renderHook(() => useStakingContract());
    
    expect(() => {
      result.current.prepareTransaction('stake', {
        amount: 100,
        token: 'INVALID-TOKEN',
      });
    }).toThrow();
  });

  it('should convert amount to smallest units', () => {
    const { result } = renderHook(() => useStakingContract());
    
    const tx = result.current.prepareTransaction('stake', {
      amount: 100.5,
      token: 'SP2JXKMH4R3YJJ5MKBAXJ5DZX3N6Q6S59GVHWFVS7.token',
    });
    
    // Should convert 100.5 to 100500000 (microSTX)
    expect(tx.functionArgs[1]).toEqual(uintCV('100500000'));
  });
});
```

## Performance Testing

### Benchmark Examples

```typescript
import { performance } from 'perf_hooks';

describe('Validation Performance', () => {
  it('should validate amount quickly', () => {
    const start = performance.now();
    
    for (let i = 0; i < 10000; i++) {
      validateStakeAmount('100.5');
    }
    
    const duration = performance.now() - start;
    
    // Should complete 10k validations in < 100ms
    expect(duration).toBeLessThan(100);
  });

  it('should validate address quickly', () => {
    const start = performance.now();
    
    for (let i = 0; i < 10000; i++) {
      validateStacksAddress('SP2JXKMH4R3YJJ5MKBAXJ5DZX3N6Q6S59GVHWFVS7');
    }
    
    const duration = performance.now() - start;
    
    // Should complete 10k validations in < 100ms
    expect(duration).toBeLessThan(100);
  });

  it('should handle burst validation load', () => {
    const addresses = Array(1000).fill('SP2JXKMH4R3YJJ5MKBAXJ5DZX3N6Q6S59GVHWFVS7');
    
    const start = performance.now();
    addresses.forEach(addr => validateStacksAddress(addr));
    const duration = performance.now() - start;
    
    // Should handle 1k validations in < 50ms
    expect(duration).toBeLessThan(50);
  });
});
```

## Test Utilities

### Helper Functions for Testing

```typescript
// Create test amounts with various formats
export const testAmounts = {
  valid: ['100', '100.5', '0.000001', '999999.123456'],
  invalid: ['', 'abc', '-50', '0', '100.1234567'],
  boundary: [
    '0',
    '0.000001',
    (Math.pow(2, 128) - 1).toString(),
    (Math.pow(2, 128)).toString(),
  ],
};

// Create test addresses
export const testAddresses = {
  valid: [
    'SP2JXKMH4R3YJJ5MKBAXJ5DZX3N6Q6S59GVHWFVS7',
    'SN2JXKMH4R3YJJ5MKBAXJ5DZX3N6Q6S59GVHWFVS7',
  ],
  invalid: [
    '',
    'ST2JXKMH4R3YJJ5MKBAXJ5DZX3N6Q6S59GVHWFVS7',
    'SP2JXKMH',
    'sp2jxkmh4r3yjj5mkbaxj5dzx3n6q6s59gvhwfvs7',
  ],
};

// Create test contracts
export const testContracts = {
  valid: [
    'SP2JXKMH4R3YJJ5MKBAXJ5DZX3N6Q6S59GVHWFVS7.staking-token',
    'SP2JXKMH4R3YJJ5MKBAXJ5DZX3N6Q6S59GVHWFVS7.token-v2',
  ],
  invalid: [
    'SP2JXKMH4R3YJJ5MKBAXJ5DZX3N6Q6S59GVHWFVS7.',
    'SP2JXKMH4R3YJJ5MKBAXJ5DZX3N6Q6S59GVHWFVS7-staking',
  ],
};

// Batch test helper
export function testValidator(validator: Function, testCases: TestCase[]) {
  testCases.forEach(({ input, expected, description }) => {
    it(description, () => {
      const result = validator(input);
      expect(result.isValid).toBe(expected.isValid);
      if (!expected.isValid) {
        expect(result.error).toBe(expected.error);
      }
    });
  });
}
```

### Running the Tests

```bash
# Run all validation tests
npm test -- validation

# Run with coverage
npm test -- validation --coverage

# Run specific test file
npm test -- validateStakeAmount

# Run in watch mode
npm test -- validation --watch

# Run performance tests
npm test -- validation.perf
```

## Best Practices for Validation Testing

1. **Test Happy Path**: Always test the success case first
2. **Test Error Cases**: Test each error condition separately
3. **Test Boundaries**: Test at limits (min, max, zero)
4. **Test Type Handling**: Test with different input types (string, number, etc.)
5. **Test Integration**: Test validators in the actual context (hooks, components)
6. **Performance**: Ensure validators are fast (< 1ms per call)
7. **Error Messages**: Verify error messages are helpful and accurate
8. **Edge Cases**: Test unusual but valid inputs (scientific notation, etc.)

## Common Testing Mistakes to Avoid

❌ **Don't** assume amounts are always numbers
```typescript
// Bad
const amount = input as number;
```

✅ **Do** validate input types
```typescript
// Good
const validation = validateStakeAmount(input);
if (!validation.isValid) {
  // Handle error
}
```

❌ **Don't** skip balance validation tests
```typescript
// Bad
validateStakeAmount('100'); // No balance check
```

✅ **Do** test with realistic balance scenarios
```typescript
// Good
validateStakeAmount('100', undefined, 50); // Tests against user balance
```

❌ **Don't** rely on manual error message checking
```typescript
// Bad
if (error.includes('insufficient')) { }
```

✅ **Do** use the ValidationMessages constant
```typescript
// Good
if (error === ValidationMessages.AMOUNT_INSUFFICIENT_BALANCE) { }
```
