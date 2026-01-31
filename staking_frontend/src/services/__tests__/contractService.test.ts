import { vi, describe, it, expect, beforeEach } from 'vitest';
import { callReadOnlyWithRetry } from '@/services/contractService';
import { fetchCallReadOnlyFunction } from '@stacks/transactions';
import { cvToValue, intCV } from '@stacks/transactions';

vi.mock('@stacks/transactions', async () => {
  const actual = await vi.importActual<any>('@stacks/transactions');
  return {
    ...actual,
    fetchCallReadOnlyFunction: vi.fn(),
    cvToValue: (v: any) => v,
  };
});

describe('contractService.callReadOnlyWithRetry', () => {
  beforeEach(() => {
    (fetchCallReadOnlyFunction as any).mockReset();
  });

  it('returns value on success', async () => {
    (fetchCallReadOnlyFunction as any).mockResolvedValueOnce({ ok: true, value: 42 });

    const res = await callReadOnlyWithRetry({
      network: {} as any,
      contractIdentifier: 'SP123.contract',
      functionName: 'get-number',
      functionArgs: [],
    }, { retries: 1, baseDelayMs: 10 });

    expect(res).toEqual({ ok: true, value: 42 });
    expect(fetchCallReadOnlyFunction).toHaveBeenCalledTimes(1);
  });

  it('retries on transient failures and succeeds', async () => {
    (fetchCallReadOnlyFunction as any)
      .mockRejectedValueOnce(new Error('ECONNRESET'))
      .mockRejectedValueOnce(new Error('ETIMEDOUT'))
      .mockResolvedValueOnce({ ok: true, value: 'done' });

    const res = await callReadOnlyWithRetry({
      network: {} as any,
      contractIdentifier: 'SP123.contract',
      functionName: 'get-status',
      functionArgs: [],
    }, { retries: 3, baseDelayMs: 1 });

    expect(res).toEqual({ ok: true, value: 'done' });
    expect(fetchCallReadOnlyFunction).toHaveBeenCalledTimes(3);
  });

  it('throws ContractServiceError after retries exhausted', async () => {
    (fetchCallReadOnlyFunction as any)
      .mockRejectedValue(new Error('ECONNRESET'));

    await expect(callReadOnlyWithRetry({
      network: {} as any,
      contractIdentifier: 'SP123.contract',
      functionName: 'will-fail',
    }, { retries: 2, baseDelayMs: 1 })).rejects.toThrow();

    expect(fetchCallReadOnlyFunction).toHaveBeenCalled();
  });
});
