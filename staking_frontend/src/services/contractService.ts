import { fetchCallReadOnlyFunction, cvToValue } from '@stacks/transactions';
import { ContractServiceError } from './errors';
import { ReadOnlyCallOptions, RetryOptions } from './types';
import { retryWithBackoff } from './retry';

export async function callReadOnlyWithRetry(
  opts: ReadOnlyCallOptions,
  retryOpts: RetryOptions = { retries: 3, baseDelayMs: 200 }
) {
  const { network, contractIdentifier, functionName, functionArgs = [], senderAddress } = opts;

  if (!contractIdentifier || !contractIdentifier.includes('.')) {
    throw new ContractServiceError(`Invalid contract identifier: ${contractIdentifier}`, 'INVALID_CONTRACT_IDENTIFIER', false);
  }

  const [contractAddress, contractName] = contractIdentifier.split('.');

  try {
    const result = await retryWithBackoff(
      async () => {
        const res = await fetchCallReadOnlyFunction({
          network,
          contractAddress,
          contractName,
          functionName,
          functionArgs,
          senderAddress,
        });
        return res;
      },
      retryOpts.retries,
      retryOpts.baseDelayMs
    );

    // Convert Clarity Value to JS value
    return cvToValue(result);
  } catch (err: any) {
    // Determine if transient (network errors usually transient)
    const transient = /timeout|ECONNRESET|ETIMEDOUT|network/i.test(err?.message || '');
    throw new ContractServiceError(err?.message || 'Read-only call failed', err?.code, transient);
  }
}

export default {
  callReadOnlyWithRetry,
};
