# Contract Write Service Guide

## Overview

The `contractWrite` service provides helpers for building, signing, and submitting write transactions to the Stacks blockchain. It integrates with `@stacks/connect-react` to simplify wallet interaction patterns for staking operations (stake, unstake, claim rewards).

## API Reference

### `prepareContractCall(opts: ContractWriteOptions)`

Prepares a generic contract call object that can be used with wallet integration.

**Parameters:**
- `network` — StacksNetwork instance for the target chain
- `contractAddress` — Principal address of the contract (e.g., `SP123...`)
- `contractName` — Name of the contract (e.g., `staking`)
- `functionName` — Name of the function to call (e.g., `stake`, `claim-rewards`)
- `functionArgs?` — Array of ClarityValue arguments
- `fee?` — Transaction fee in microSTX
- `nonce?` — Transaction nonce
- `postConditionMode?` — Post-condition validation mode
- `postConditions?` — Array of post-conditions

**Returns:** Contract call object ready for `doContractCall()`

**Example:**
```typescript
const callOpts = prepareContractCall({
  network: STACKS_MAINNET,
  contractAddress: 'SP123...',
  contractName: 'staking',
  functionName: 'stake',
  functionArgs: [principalCV(token), uintCV('1000000')],
});

// Use with Connect
const result = await doContractCall(callOpts);
```

---

### `prepareStakingCall(opts: PrepareStakingCallOptions)`

Specialized helper for staking operations. Builds proper function arguments for stake, unstake, and claim-rewards operations.

**Parameters:**
- `network` — StacksNetwork instance
- `contractAddress` — Staking contract principal
- `contractName` — Staking contract name
- `tokenContractAddress` — Token contract principal (for stake/unstake/claim)
- `action` — One of `'stake'`, `'unstake'`, `'claim-rewards'`
- `amount?` — Amount in smallest units (microSTX) for stake/unstake; omit for claim
- `userAddress?` — User principal (optional, inferred from session if omitted)

**Returns:** Contract call object with properly constructed function arguments

**Example:**
```typescript
// Prepare stake call
const stakeCall = prepareStakingCall({
  network: STACKS_MAINNET,
  contractAddress: 'SP123...',
  contractName: 'staking',
  tokenContractAddress: 'SP456.token',
  action: 'stake',
  amount: '1000000', // 1 STX in microSTX
});

// Prepare unstake call
const unstakeCall = prepareStakingCall({
  network: STACKS_MAINNET,
  contractAddress: 'SP123...',
  contractName: 'staking',
  tokenContractAddress: 'SP456.token',
  action: 'unstake',
  amount: '500000', // 0.5 STX
});

// Prepare claim-rewards call
const claimCall = prepareStakingCall({
  network: STACKS_MAINNET,
  contractAddress: 'SP123...',
  contractName: 'staking',
  tokenContractAddress: 'SP456.token',
  action: 'claim-rewards',
});
```

---

### `submitSignedTransaction(signedTx: any, network: any): Promise<SubmitResult>`

Broadcasts a signed transaction to the Stacks network. Includes retry logic for transient failures.

**Parameters:**
- `signedTx` — Signed transaction (hex string or SignedTransaction object)
- `network` — StacksNetwork instance

**Returns:**
```typescript
{
  txId?: string;        // Transaction ID on success
  success: boolean;     // Whether submission succeeded
  error?: Error;        // Error details if failed
}
```

**Example:**
```typescript
const result = await submitSignedTransaction(signedTx, STACKS_MAINNET);

if (result.success) {
  console.log('Transaction submitted:', result.txId);
} else {
  console.error('Submission failed:', result.error);
}
```

**Error Handling:**
- Returns `ContractServiceError` with `transient: true` for network timeouts/connection errors (safe to retry)
- Returns `ContractServiceError` with `transient: false` for permanent failures (invalid tx, rejection)

---

### `waitForConfirmation(txId: string, network: any, timeoutMs?: number, pollInterval?: number): Promise<any>`

Polls the Stacks node for transaction confirmation status. Waits until the transaction reaches a terminal state (success/failure) or times out.

**Parameters:**
- `txId` — Transaction ID to poll
- `network` — StacksNetwork instance
- `timeoutMs?` — Maximum time to wait (default: 60,000 ms = 1 minute)
- `pollInterval?` — Interval between polls (default: 1500 ms)

**Returns:** Transaction details object from the node

**Throws:** `ContractServiceError` if:
- Transaction fails (`tx_status: 'failed'`)
- Confirmation times out
- Network API URL is missing

**Example:**
```typescript
try {
  const confirmed = await waitForConfirmation(txId, STACKS_MAINNET, 60_000);
  console.log('Transaction confirmed:', confirmed.tx_status);
} catch (err) {
  if ((err as ContractServiceError).transient) {
    console.error('Timeout waiting for confirmation (may retry)');
  } else {
    console.error('Transaction failed or error:', err);
  }
}
```

---

## Integration with `@stacks/connect-react`

### Using `doContractCall()`

The prepare functions return objects compatible with `@stacks/connect-react`'s `doContractCall()`:

```typescript
import { useConnect } from '@stacks/connect-react';
import { prepareStakingCall } from '@/services/contractWrite';

function StakingComponent() {
  const { doContractCall } = useConnect();

  const handleStake = async () => {
    const callOpts = prepareStakingCall({
      network: STACKS_MAINNET,
      contractAddress: 'SP123...',
      contractName: 'staking',
      tokenContractAddress: 'SP456.token',
      action: 'stake',
      amount: '1000000',
    });

    try {
      const result = await doContractCall({
        ...callOpts,
        onFinish: (data) => {
          console.log('Tx submitted:', data.txId);
          // TODO: Wait for confirmation here
        },
        onCancel: () => {
          console.log('User cancelled');
        },
      });
    } catch (err) {
      console.error('Error:', err);
    }
  };

  return <button onClick={handleStake}>Stake</button>;
}
```

---

### Using `useWalletContractCall` Hook

For convenience, use the provided hook that wraps Connect integration:

```typescript
import { useWalletContractCall } from '@/hooks/useWalletContractCall';

function StakingComponent() {
  const { executeStakingCall } = useWalletContractCall({
    onSuccess: (txId) => {
      console.log('Transaction submitted:', txId);
      // TODO: Display confirmation UI or wait for confirmation
    },
    onError: (err) => {
      console.error('Transaction failed:', err);
    },
  });

  const handleStake = async () => {
    try {
      await executeStakingCall('stake', '1000000');
    } catch (err) {
      console.error('Unexpected error:', err);
    }
  };

  return <button onClick={handleStake}>Stake 1 STX</button>;
}
```

---

## Complete Example: Full Staking Flow

```typescript
import { useWalletContractCall } from '@/hooks/useWalletContractCall';
import { useStakingContract } from '@/hooks/useStakingContract';
import { useState } from 'react';
import { useToast } from '@chakra-ui/react';

function StakingPage() {
  const { getContractState, getUserInfo } = useStakingContract();
  const { executeStakingCall } = useWalletContractCall();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleStake = async (amount: string) => {
    setIsLoading(true);
    try {
      // Execute stake via wallet
      const result = await executeStakingCall('stake', amount);

      toast({
        title: 'Transaction submitted',
        description: `TX: ${result?.txId}`,
        status: 'success',
        duration: 5000,
      });

      // TODO: Wait for confirmation in a separate effect
      // const confirmed = await waitForConfirmation(result.txId, network);
    } catch (err: any) {
      toast({
        title: 'Staking failed',
        description: err.message,
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClaim = async () => {
    setIsLoading(true);
    try {
      const result = await executeStakingCall('claim-rewards');

      toast({
        title: 'Claim submitted',
        description: `TX: ${result?.txId}`,
        status: 'success',
      });
    } catch (err: any) {
      toast({
        title: 'Claim failed',
        description: err.message,
        status: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <button onClick={() => handleStake('1000000')} disabled={isLoading}>
        {isLoading ? 'Processing...' : 'Stake 1 STX'}
      </button>
      <button onClick={handleClaim} disabled={isLoading}>
        {isLoading ? 'Processing...' : 'Claim Rewards'}
      </button>
    </div>
  );
}
```

---

## Error Handling

All functions throw `ContractServiceError` with categorized error codes:

| Code | Meaning | Transient? | Action |
|------|---------|-----------|--------|
| `INVALID_CONTRACT` | Invalid contract address/name | ❌ | Fix parameters |
| `MISSING_PARAMS` | Missing required parameters | ❌ | Provide all parameters |
| `MISSING_AMOUNT` | Amount required for stake/unstake | ❌ | Check input validation |
| `UNKNOWN_ACTION` | Invalid action type | ❌ | Use valid action |
| `BROADCAST_ERROR` | Network error during broadcast | ✅ | Retry submission |
| `TX_FAILED` | Transaction execution failed | ❌ | Check contract state/params |
| `TX_TIMEOUT` | Confirmation polling timeout | ✅ | Retry polling manually |
| `MISSING_NETWORK_API` | Network API URL missing | ❌ | Fix network config |

**Handling transient errors:**

```typescript
try {
  const result = await submitSignedTransaction(signedTx, network);
} catch (err: any) {
  if (err instanceof ContractServiceError && err.transient) {
    // Safe to retry
    console.log('Network error, will retry...');
  } else {
    // Permanent failure, inform user
    console.error('Transaction failed permanently:', err.message);
  }
}
```

---

## Testing

The service is designed for easy testing with mocks:

```typescript
import { vi } from 'vitest';
import { prepareStakingCall, submitSignedTransaction } from '@/services/contractWrite';

describe('Staking flow', () => {
  it('prepares stake call correctly', () => {
    const result = prepareStakingCall({
      network: mockNetwork,
      contractAddress: 'SP123...',
      contractName: 'staking',
      tokenContractAddress: 'SP456.token',
      action: 'stake',
      amount: '1000000',
    });

    expect(result.functionName).toBe('stake');
    expect(result.functionArgs).toHaveLength(2);
  });

  it('handles submission errors', async () => {
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

    await expect(
      submitSignedTransaction(mockSignedTx, mockNetwork)
    ).rejects.toThrow();
  });
});
```

---

## Related Documentation

- [Service Layer Architecture](./SERVICES.md)
- [useStakingContract Hook](./HOOKS.md#useStakingContract)
- [Testing Guide](./TESTING.md)
- [@stacks/connect-react Docs](https://github.com/hirosystems/connect/tree/main/packages/connect-react)

---

**Last Updated:** January 31, 2026
