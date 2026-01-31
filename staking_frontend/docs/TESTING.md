# Frontend Testing Guide

## Overview

This document outlines the testing infrastructure, best practices, and guidelines for the Starity staking frontend.

## Technology Stack

- **Test Runner:** [Vitest](https://vitest.dev/) — Fast unit test framework with Vite
- **Component Testing:** [@testing-library/react](https://testing-library.com/react) — User-centric testing
- **Coverage:** [@vitest/coverage-v8](https://vitest.dev/guide/coverage.html) — Code coverage reporting
- **Mocking:** Vitest's `vi` utility + manual mocks

## Project Structure

```
staking_frontend/
├── src/
│   ├── __tests__/
│   │   ├── __tests__/
│   │   │   ├── validation.test.ts
│   │   │   ├── service-layer.test.ts
│   │   │   └── ...
│   │   ├── test/
│   │   │   ├── setup.ts          # Test environment setup
│   │   │   └── test-utils.tsx    # Custom render wrapper
├── vitest.config.ts              # Vitest configuration
└── package.json                  # Test scripts
```

## Running Tests

### All Tests
```bash
npm test
```

### Watch Mode (Auto-rerun on changes)
```bash
npm run test:watch
```

### Coverage Report
```bash
npm run test:coverage
```

## Test Organization

Tests are organized by feature in `__tests__` directories alongside source code:

```
src/
├── utils/
│   ├── validation.ts
│   └── __tests__/
│       └── validation.test.ts
├── services/
│   ├── contractService.ts
│   └── __tests__/
│       ├── contractService.test.ts
│       └── service-layer.test.ts
└── components/
    ├── Header/
    │   ├── Header.tsx
    │   └── __tests__/
    │       └── Header.test.tsx
```

## Writing Tests

### 1. Unit Tests (Functions & Utilities)

Test pure functions with clear inputs and outputs:

```typescript
import { describe, it, expect } from 'vitest';
import { validateStakeAmount } from '@/utils/validation';

describe('validateStakeAmount', () => {
  it('accepts valid amounts', () => {
    const result = validateStakeAmount('100.5');
    expect(result.isValid).toBe(true);
    expect(result.data).toBe(100.5);
  });

  it('rejects negative amounts', () => {
    const result = validateStakeAmount('-10');
    expect(result.isValid).toBe(false);
  });
});
```

### 2. Component Tests

Test component rendering, user interactions, and accessibility:

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@/test/test-utils';
import Header from '@/components/Header/Header';

describe('Header', () => {
  it('renders connect button', () => {
    render(<Header />);
    const button = screen.getByRole('button', { name: /connect/i });
    expect(button).toBeInTheDocument();
  });

  it('handles click interactions', () => {
    render(<Header />);
    const button = screen.getByRole('button', { name: /connect/i });
    fireEvent.click(button);
    // Assert side effects
  });
});
```

### 3. Hook Tests

Test custom React hooks in isolation:

```typescript
import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useStakingContract } from '@/hooks/useStakingContract';

describe('useStakingContract', () => {
  it('initializes with correct API', () => {
    const { result } = renderHook(() => useStakingContract());
    
    expect(result.current.getUserInfo).toBeDefined();
    expect(result.current.getContractState).toBeDefined();
  });
});
```

### 4. Mocking External Dependencies

Mock external libraries and services:

```typescript
import { vi } from 'vitest';

// Mock @stacks/transactions
vi.mock('@stacks/transactions', () => ({
  fetchCallReadOnlyFunction: vi.fn().mockResolvedValue({ ok: true }),
  cvToValue: (v) => v,
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));
```

## Test Coverage Goals

| Category | Target |
|----------|--------|
| **Lines** | 80% |
| **Functions** | 80% |
| **Branches** | 75% |
| **Statements** | 80% |

### Current Coverage Status

Run `npm run test:coverage` to see:
- `text-summary` — Terminal output
- `html` — Detailed HTML report in `coverage/index.html`
- `lcov` — Machine-readable format for CI tools

## Best Practices

### ✅ Do

1. **Test user behavior, not implementation**
   ```typescript
   // ✅ Good: Tests what user sees
   fireEvent.click(screen.getByRole('button', { name: /stake/i }));
   expect(screen.getByText(/staking pending/i)).toBeInTheDocument();

   // ❌ Bad: Tests internal state
   expect(component.state.isStaking).toBe(true);
   ```

2. **Use semantic queries**
   ```typescript
   // ✅ Good
   screen.getByRole('button', { name: /connect/i });
   screen.getByLabelText('Amount');
   screen.getByPlaceholderText('Enter amount');

   // ❌ Bad
   screen.getByTestId('btn-connect');
   wrapper.find('.connect-button');
   ```

3. **Test error paths**
   ```typescript
   it('handles validation errors', () => {
     const result = validateStakeAmount('invalid');
     expect(result.isValid).toBe(false);
     expect(result.error).toBe(ValidationMessages.AMOUNT_INVALID);
   });
   ```

4. **Keep tests focused**
   ```typescript
   // ✅ Good: One thing per test
   it('rejects zero amount', () => { /* ... */ });
   it('rejects negative amount', () => { /* ... */ });

   // ❌ Bad: Multiple assertions per test
   it('validates amounts', () => {
     // Tests zero, negative, too large, etc.
   });
   ```

5. **Use descriptive names**
   ```typescript
   // ✅ Good
   it('shows error banner when wallet connection fails', () => {});

   // ❌ Bad
   it('works', () => {});
   ```

### ❌ Don't

1. **Don't test implementation details**
   - Test the public API, not internal state

2. **Don't skip accessibility tests**
   - Always verify ARIA attributes, keyboard support

3. **Don't use `waitFor` unnecessarily**
   - Use `findBy` queries for async elements

4. **Don't test third-party libraries**
   - Mock them instead

## Common Testing Patterns

### Testing Async Functions

```typescript
it('handles async operations', async () => {
  const mock = vi.fn().mockResolvedValueOnce({ data: 'value' });
  
  const result = await mock();
  
  expect(result.data).toBe('value');
});
```

### Testing Form Submissions

```typescript
it('submits form with validation', async () => {
  render(<StakePage />);
  
  const input = screen.getByLabelText(/amount/i);
  const submitButton = screen.getByRole('button', { name: /stake/i });
  
  fireEvent.change(input, { target: { value: '100' } });
  fireEvent.click(submitButton);
  
  await waitFor(() => {
    expect(screen.getByText(/success/i)).toBeInTheDocument();
  });
});
```

### Testing Error Boundaries

```typescript
it('catches render errors', () => {
  // Component that throws during render
  expect(() => {
    render(<BrokenComponent />);
  }).toThrow();
});
```

### Testing with Custom Hooks

```typescript
const { result, rerender } = renderHook(
  ({ value }) => useCustomHook(value),
  { initialProps: { value: 'initial' } }
);

expect(result.current).toBe('initial');

rerender({ value: 'updated' });
expect(result.current).toBe('updated');
```

## Debugging Tests

### 1. Debug Output

```typescript
import { render, screen } from '@testing-library/react';

render(<Component />);
screen.debug(); // Print DOM to console
```

### 2. Run Single Test

```bash
npx vitest -t "test name"
```

### 3. Run Single File

```bash
npx vitest src/utils/__tests__/validation.test.ts
```

### 4. Interactive UI

```bash
npx vitest --ui
```

Opens `http://localhost:51204` with interactive test runner.

## CI/CD Integration

Tests run automatically in CI/CD pipeline:

```yaml
# Example GitHub Actions workflow
- name: Run tests
  run: npm test

- name: Upload coverage
  run: npm run test:coverage
```

## Maintenance

### Adding New Tests

1. Create test file in `__tests__/` directory
2. Follow existing patterns
3. Ensure coverage > 80%
4. Run `npm run test:coverage`

### Updating Tests

- When code changes, update tests
- Keep tests focused on behavior
- Refactor tests alongside code refactors

### Test Dependencies

Keep testing dependencies in `devDependencies`:
- vitest
- @testing-library/react
- @testing-library/jest-dom
- jsdom
- etc.

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library Best Practices](https://testing-library.com/docs/dom-testing-library/api-queries)
- [Testing React Components](https://react.dev/learn/testing-overview)
- [Accessibility Testing](https://www.w3.org/WAI/test-evaluate/)

## Questions?

For testing questions or to add patterns, refer to:
- Existing test files in `__tests__/` directories
- This guide
- [Vitest docs](https://vitest.dev/)
