# Error Handling Guide

## Overview

The Starity staking frontend implements a comprehensive error handling strategy using React Error Boundaries, typed error codes, and structured logging for debugging and analytics.

## Core Components

### 1. ErrorBoundary Component

The `ErrorBoundary` component catches React render errors and displays a user-friendly fallback UI.

**Location:** `src/components/ErrorBoundary/ErrorBoundary.tsx`

**Features:**
- ✅ Catches unhandled React render errors
- ✅ Classifies errors automatically (CONTRACT, NETWORK, WALLET, AUTH, RENDER)
- ✅ Displays user-friendly error messages
- ✅ Shows detailed stack traces in development mode only
- ✅ Provides reset and hard reload options
- ✅ Integrates with analytics/logging services
- ✅ Supports custom fallback UIs
- ✅ Supports automatic reset via `resetKeys` prop

### 2. Error Codes

The system defines specific error codes for different failure scenarios:

```typescript
type ErrorCode =
  | 'RENDER_ERROR'    // React component rendering failed
  | 'CONTRACT_ERROR'  // Smart contract interaction failed
  | 'NETWORK_ERROR'   // Network/RPC connectivity failed
  | 'AUTH_ERROR'      // Wallet authentication/session failed
  | 'WALLET_ERROR'    // Wallet operation rejected
  | 'UNKNOWN_ERROR';  // Unclassified error
```

Each error code has:
- A user-facing message
- A detailed description
- Automatic classification based on error message content

## Usage

### Basic Setup

Wrap your application content with `ErrorBoundary`:

```tsx
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function RootLayout({ children }) {
  return (
    <ChakraProvider>
      <ErrorBoundary>
        <Header />
        <main>{children}</main>
      </ErrorBoundary>
    </ChakraProvider>
  );
}
```

### With Error Handler Callback

Log errors to your analytics service:

```tsx
<ErrorBoundary
  onError={(error, errorInfo) => {
    // Log to Sentry, LogRocket, etc.
    logErrorToService(error, errorInfo);
  }}
>
  <YourComponent />
</ErrorBoundary>
```

### With Auto-Reset Keys

Automatically reset error boundary when dependencies change:

```tsx
<ErrorBoundary resetKeys={[walletAddress, stakeAmount]}>
  <StakingForm />
</ErrorBoundary>
```

### Custom Fallback UI

Provide a custom error display:

```tsx
const customFallback = (
  <Box p={8} textAlign="center">
    <Heading>Oops! Something went wrong</Heading>
    <Button mt={4} onClick={() => window.location.reload()}>
      Refresh
    </Button>
  </Box>
);

<ErrorBoundary fallback={customFallback}>
  <YourComponent />
</ErrorBoundary>
```

## Error Classification

The ErrorBoundary automatically classifies errors based on message content:

### CONTRACT_ERROR
**When:** Error message contains "contract"
**Typical Causes:**
- Contract execution failed
- Invalid contract parameters
- Insufficient contract balance
- Contract not deployed

**User Message:** "Failed to interact with the smart contract."

**Example Error:**
```
Error: Contract execution failed: insufficient balance
```

### WALLET_ERROR
**When:** Error message contains "wallet" or "signer"
**Typical Causes:**
- Wallet rejected transaction
- Wallet not properly initialized
- Signer not available

**User Message:** "A wallet operation failed."

**Example Error:**
```
Error: Wallet signer rejected the transaction
```

### NETWORK_ERROR
**When:** Error message contains "network", "fetch", or "timeout"
**Typical Causes:**
- Network connectivity issues
- RPC endpoint unavailable
- Request timeout
- DNS resolution failure

**User Message:** "A network error occurred. Please check your connection."

**Example Error:**
```
Error: Network timeout after 30s
```

### AUTH_ERROR
**When:** Error message contains "auth" or "unauthorized"
**Typical Causes:**
- Wallet session expired
- Unauthorized operation
- Authentication failed

**User Message:** "Authentication failed. Please reconnect your wallet."

**Example Error:**
```
Error: Authentication failed: wallet disconnected
```

### RENDER_ERROR
**Default classificationfor errors that don't match above categories**
**Typical Causes:**
- Invalid component props
- Broken component lifecycle
- Missing dependencies

**User Message:** "A rendering error occurred in the application."

## Error Recovery

### User Actions

Users have two recovery options in the fallback UI:

1. **Try Again** — Resets the error boundary and retries rendering
2. **Reload Page** — Performs a full page reload (hard reload)

### Programmatic Reset

Reset the error boundary programmatically:

```tsx
import { useRef } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export function MyComponent() {
  const errorBoundaryRef = useRef<ErrorBoundary>(null);

  const handleRetry = () => {
    // Note: Error boundaries don't expose reset via ref
    // Use resetKeys prop instead for automatic reset
  };

  return (
    <ErrorBoundary resetKeys={[someDepValue]}>
      <Content />
    </ErrorBoundary>
  );
}
```

## Development vs Production

### Development Mode
- Shows full error messages
- Displays React component stack trace
- Shows error classification details
- Useful for debugging during development

### Production Mode
- Hides detailed error information
- Shows only user-friendly messages
- Prevents exposing internal implementation
- Better user experience

## Integration with Logging Services

### Sentry Integration Example

```tsx
import * as Sentry from '@sentry/nextjs';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function RootLayout({ children }) {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        Sentry.captureException(error, {
          contexts: {
            react: {
              componentStack: errorInfo.componentStack,
            },
          },
        });
      }}
    >
      {children}
    </ErrorBoundary>
  );
}
```

### LogRocket Integration Example

```tsx
import LogRocket from 'logrocket';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function RootLayout({ children }) {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        LogRocket.captureException(error, {
          extra: {
            componentStack: errorInfo.componentStack,
          },
        });
      }}
    >
      {children}
    </ErrorBoundary>
  );
}
```

### Custom Logger Integration

If using a custom logger (set on `window.__logger`):

```tsx
// Initialize in app startup
window.__logger = {
  logError: (error, context) => {
    // Send to custom backend
    fetch('/api/logs', {
      method: 'POST',
      body: JSON.stringify({ error: error.message, context }),
    });
  },
};
```

The ErrorBoundary will automatically call `window.__logger.logError()` if available.

## Common Error Scenarios

### Scenario 1: Contract Call Fails

**Error:** `Contract execution failed: insufficient balance`

**User Sees:** "Failed to interact with the smart contract."

**Resolution:**
1. User clicks "Try Again" to retry
2. If persistent, user checks wallet balance
3. User reloads page for full reset

**Code Example:**
```tsx
try {
  await contractWrite({
    contractAddress: CONTRACT_ADDR,
    functionName: 'stake',
    functionArgs: [amount],
  });
} catch (error) {
  // ErrorBoundary catches and classifies as CONTRACT_ERROR
  throw error;
}
```

### Scenario 2: Network Timeout

**Error:** `fetch timeout after 30000ms`

**User Sees:** "A network error occurred. Please check your connection."

**Resolution:**
1. User checks internet connection
2. User clicks "Try Again" for automatic retry
3. If issue persists, user reloads page

**Code Example:**
```tsx
const callWithTimeout = async () => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    return await fetch(url, { signal: controller.signal });
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Network timeout after 30000ms');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
};
```

### Scenario 3: Wallet Disconnected

**Error:** `Authentication failed: wallet disconnected`

**User Sees:** "Authentication failed. Please reconnect your wallet."

**Resolution:**
1. User reconnects wallet via Header
2. User clicks "Try Again" to retry
3. Component rerenders with new wallet state

**Code Example:**
```tsx
if (!walletState.isConnected) {
  throw new Error('Authentication failed: wallet disconnected');
}
```

## Testing Error Handling

### Unit Tests

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const ThrowingComponent = () => {
  throw new Error('Contract execution failed');
};

test('should display error fallback', () => {
  render(
    <ErrorBoundary>
      <ThrowingComponent />
    </ErrorBoundary>
  );

  expect(screen.getByText(/Failed to interact with the smart contract/i)).toBeInTheDocument();
});

test('should reset on button click', () => {
  const { rerender } = render(
    <ErrorBoundary>
      <ThrowingComponent />
    </ErrorBoundary>
  );

  fireEvent.click(screen.getByRole('button', { name: /try again/i }));

  rerender(
    <ErrorBoundary>
      <SafeComponent />
    </ErrorBoundary>
  );

  expect(screen.getByText('Safe content')).toBeInTheDocument();
});
```

### Manual Testing Checklist

- [ ] Throw error in Header component
- [ ] Verify error fallback displays
- [ ] Click "Try Again" button
- [ ] Verify component resets
- [ ] Click "Reload Page" button
- [ ] Verify page reloads
- [ ] Test with different error types (CONTRACT, NETWORK, WALLET)
- [ ] Test in development mode (verify stack traces shown)
- [ ] Test in production mode (verify stack traces hidden)
- [ ] Test with custom fallback UI
- [ ] Test with resetKeys changes
- [ ] Verify error logged to console

## Best Practices

### DO ✅

1. **Wrap sections appropriately**
   ```tsx
   <ErrorBoundary>
     <Header />
     <Main />
   </ErrorBoundary>
   ```

2. **Log errors to analytics**
   ```tsx
   <ErrorBoundary onError={(e, info) => logToSentry(e, info)}>
     {children}
   </ErrorBoundary>
   ```

3. **Use resetKeys for prop changes**
   ```tsx
   <ErrorBoundary resetKeys={[userId, selectedTab]}>
     <ComponentDependentOnProps />
   </ErrorBoundary>
   ```

4. **Provide custom fallback for important sections**
   ```tsx
   <ErrorBoundary fallback={<StakingErrorFallback />}>
     <StakingForm />
   </ErrorBoundary>
   ```

5. **Handle errors at source too**
   ```tsx
   try {
     await operation();
   } catch (error) {
     setError(error.message);
     throw error; // For ErrorBoundary to catch
   }
   ```

### DON'T ❌

1. **Don't suppress all errors silently**
   ```tsx
   // Bad: Silently ignores errors
   const result = await operation().catch(() => null);
   ```

2. **Don't use ErrorBoundary for async errors**
   ```tsx
   // Bad: ErrorBoundary doesn't catch async errors
   <ErrorBoundary>
     <AsyncComponent /> {/* Must handle errors internally */}
   </ErrorBoundary>
   ```

3. **Don't rely only on ErrorBoundary**
   ```tsx
   // Bad: Missing try-catch in component
   async function handleStake() {
     await prepareStakingCall(); // May throw, needs try-catch
   }
   ```

4. **Don't display sensitive error info in production**
   ```tsx
   // Bad: Exposes implementation details
   <ErrorBoundary onError={(e) => showAlert(e.stack)}>
     {children}
   </ErrorBoundary>
   ```

5. **Don't forget to cleanup timeouts**
   ```tsx
   // Bad: Timeout not cleared
   setTimeout(() => {
     throw new Error('Timeout');
   }, 30000);
   ```

## TypeScript Support

Full TypeScript support for error handling:

```tsx
import { ErrorBoundary, ErrorCode } from '@/components/ErrorBoundary';
import type { ErrorBoundaryState } from '@/components/ErrorBoundary';

interface Props {
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  fallback?: React.ReactNode;
  resetKeys?: Array<string | number>;
}

export function GuardedComponent(props: Props) {
  return (
    <ErrorBoundary {...props}>
      <MyComponent />
    </ErrorBoundary>
  );
}
```

## Performance Considerations

1. **Error Boundary Tree**
   - Place boundaries at appropriate levels
   - Don't over-granularize (performance overhead)
   - Use for major sections (Header, Main, Sidebar)

2. **Error Logging**
   - Batch errors in analytics (don't log each one)
   - Use sampled logging in high-traffic apps
   - Clean up old error logs periodically

3. **Recovery**
   - Reset only affects subtree, not entire app
   - Full reload is last resort
   - Consider partial state reset for better UX

## Troubleshooting

### Problem: Error not caught by ErrorBoundary

**Cause:** Async errors aren't caught by error boundaries

**Solution:** Use try-catch in async functions:
```tsx
async function handleStake() {
  try {
    await stakeTokens();
  } catch (error) {
    // Handle or rethrow for ErrorBoundary
    throw new Error('Stake failed: ' + error.message);
  }
}
```

### Problem: Error shows during tests

**Cause:** console.error not suppressed

**Solution:** Suppress in test setup:
```tsx
beforeEach(() => {
  console.error = vi.fn();
});
```

### Problem: Custom fallback not showing

**Cause:** Fallback needs ChakraProvider

**Solution:** Ensure ChakraProvider wraps ErrorBoundary:
```tsx
<ChakraProvider>
  <ErrorBoundary fallback={customFallback}>
    {children}
  </ErrorBoundary>
</ChakraProvider>
```

## Summary

The error handling system provides:

✅ **Catchable Errors** — React renders and lifecycle errors
✅ **Error Classification** — Automatic categorization with user-friendly messages
✅ **Recovery Options** — Reset and reload buttons with analytics
✅ **Logging Integration** — Hooks for Sentry, LogRocket, custom loggers
✅ **Development Support** — Full stack traces in dev mode
✅ **Production Ready** — Hidden details in production builds
✅ **TypeScript Support** — Full type safety
✅ **Testing Support** — Comprehensive test coverage with examples

For more details on specific integrations, see:
- [Security Guide](./SECURITY.md) — Input validation and XSS prevention
- [Services Guide](./SERVICES_WRITE.md) — Error handling in contract services
- [Testing Guide](./TESTING.md) — Error testing patterns
