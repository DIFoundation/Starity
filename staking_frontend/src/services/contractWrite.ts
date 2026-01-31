import { broadcastTransaction } from '@stacks/transactions';
import { ContractWriteOptions, SubmitResult } from './types';
import { ContractServiceError } from './errors';
import { retryWithBackoff } from './retry';

/**
 * Prepare a write-call payload that can be consumed by a wallet or used to
 * construct and sign a transaction.
 */
export function prepareContractCall(opts: ContractWriteOptions) {
  const {
    contractAddress,
    contractName,
    functionName,
    functionArgs = [],
    fee,
    nonce,
    postConditionMode,
    postConditions,
    network,
  } = opts;

  if (!contractAddress || !contractName) {
    throw new ContractServiceError('Invalid contract address/name', 'INVALID_CONTRACT', false);
  }

  return {
    contractAddress,
    contractName,
    functionName,
    functionArgs,
    fee,
    nonce,
    postConditionMode,
    postConditions,
    network,
  };
}

/**
 * Submit a signed transaction (hex or Tx object) to the network using
 * `broadcastTransaction` and wrap the response.
 */
export async function submitSignedTransaction(signedTx: any, network: any): Promise<SubmitResult> {
  try {
    const res = await retryWithBackoff(async () => {
      // broadcastTransaction accepts a SignedTransaction object or hex
      const r = await broadcastTransaction({ tx: signedTx, network } as any);
      return r;
    }, 2, 300);

    // Response may contain a txId or error
    const txId = (res as any)?.txId || (res as any)?.tx_id || undefined;
    if (!txId && (res as any)?.error) {
      throw new ContractServiceError((res as any).error, 'BROADCAST_ERROR', true);
    }

    return { txId, success: true };
  } catch (err: any) {
    const transient = /timeout|ECONNRESET|ETIMEDOUT|network/i.test(err?.message || '');
    throw new ContractServiceError(err?.message || 'Broadcast failed', err?.code, transient);
  }
}

/**
 * Wait for transaction confirmation by polling the node's transaction endpoint.
 * Uses `network.coreApiUrl` to query `/v2/transactions/{txId}`. Times out after
 * `timeoutMs`.
 */
export async function waitForConfirmation(txId: string, network: any, timeoutMs = 60_000, pollInterval = 1500) {
  const coreApi = (network && (network as any).coreApiUrl) || '';
  if (!coreApi) throw new ContractServiceError('Network core API URL missing', 'MISSING_NETWORK_API', false);

  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`${coreApi.replace(/\/$/, '')}/v2/transactions/${txId}`);
      if (res.status === 200) {
        const json = await res.json();
        const status = json.tx_status || json.status || json.tx_status || json.status_code;
        // Accept several representations; success means transaction completed
        if (status === 'success' || status === 'confirmed') return json;
        if (status === 'failed') throw new ContractServiceError('Transaction failed', 'TX_FAILED', false);
      } else if (res.status === 404) {
        // Not yet available, continue polling
      } else {
        // Non-fatal but continue
      }
    } catch (err: any) {
      // ignore transient network errors and retry until timeout
    }

    await new Promise((r) => setTimeout(r, pollInterval));
  }

  throw new ContractServiceError('Transaction confirmation timed out', 'TX_TIMEOUT', true);
}

export default {
  prepareContractCall,
  submitSignedTransaction,
  waitForConfirmation,
};
