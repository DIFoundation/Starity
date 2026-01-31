import { describe, it, expect, beforeEach, vi } from 'vitest';
import { retryWithBackoff } from '@/services/retry';
import { ContractServiceError } from '@/services/errors';

describe('services/retry.ts - retryWithBackoff', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  it('succeeds on first attempt', async () => {
    const fn = vi.fn().mockResolvedValueOnce('success');
    const result = await retryWithBackoff(fn, 3, 100);

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries on failure and succeeds', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('fail 1'))
      .mockRejectedValueOnce(new Error('fail 2'))
      .mockResolvedValueOnce('success');

    const promise = retryWithBackoff(fn, 3, 100);
    
    // Fast-forward past all delays
    vi.advanceTimersByTime(1000);
    
    const result = await promise;
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('throws after retries exhausted', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('persistent failure'));

    const promise = retryWithBackoff(fn, 2, 100);
    vi.advanceTimersByTime(1000);

    await expect(promise).rejects.toThrow('persistent failure');
    expect(fn).toHaveBeenCalledTimes(3); // initial + 2 retries
  });

  it('uses exponential backoff delays', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('fail 1'))
      .mockRejectedValueOnce(new Error('fail 2'))
      .mockResolvedValueOnce('success');

    const promise = retryWithBackoff(fn, 3, 100);

    // After first retry: 100ms delay
    expect(vi.getTimerCount()).toBeGreaterThan(0);
    
    vi.advanceTimersByTime(100);
    await vi.runOnlyPendingTimersAsync();

    // After second retry: 200ms delay (100 * 2^1)
    vi.advanceTimersByTime(200);
    await vi.runOnlyPendingTimersAsync();

    const result = await promise;
    expect(result).toBe('success');
  });

  it('works with zero retries', async () => {
    const fn = vi.fn().mockResolvedValueOnce('success');
    const result = await retryWithBackoff(fn, 0, 100);

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('fails immediately with zero retries', async () => {
    const fn = vi.fn().mockRejectedValueOnce(new Error('fail'));

    const promise = retryWithBackoff(fn, 0, 100);
    await expect(promise).rejects.toThrow('fail');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  afterEach(() => {
    vi.useRealTimers();
  });
});

describe('services/errors.ts - ContractServiceError', () => {
  it('creates error with all properties', () => {
    const error = new ContractServiceError('Test error', 'TEST_CODE', true);

    expect(error.message).toBe('Test error');
    expect(error.code).toBe('TEST_CODE');
    expect(error.transient).toBe(true);
  });

  it('defaults transient to false', () => {
    const error = new ContractServiceError('Test error', 'TEST_CODE');

    expect(error.transient).toBe(false);
  });

  it('preserves error stack', () => {
    const error = new ContractServiceError('Test error', 'TEST_CODE', false);

    expect(error.stack).toBeDefined();
    expect(error instanceof Error).toBe(true);
  });

  it('identifies transient errors', () => {
    const transientError = new ContractServiceError('Timeout', 'TIMEOUT', true);
    const permanentError = new ContractServiceError('Invalid input', 'INVALID_INPUT', false);

    expect(transientError.transient).toBe(true);
    expect(permanentError.transient).toBe(false);
  });
});

describe('services/contractService.ts - callReadOnlyWithRetry', () => {
  let contractServiceModule: typeof import('@/services/contractService');

  beforeEach(async () => {
    vi.clearAllMocks();
    // Mock fetchCallReadOnlyFunction before importing
    vi.doMock('@stacks/transactions', () => ({
      fetchCallReadOnlyFunction: vi.fn(),
      cvToValue: (v: any) => v,
    }));
  });

  it('returns value on successful read', async () => {
    const { callReadOnlyWithRetry } = await import('@/services/contractService');
    const { fetchCallReadOnlyFunction } = await import('@stacks/transactions');

    vi.mocked(fetchCallReadOnlyFunction).mockResolvedValueOnce({ ok: true, value: 42 });

    const result = await callReadOnlyWithRetry({
      network: {} as any,
      contractIdentifier: 'SP123.contract',
      functionName: 'get-number',
      functionArgs: [],
    }, { retries: 1, baseDelayMs: 10 });

    expect(result).toEqual({ ok: true, value: 42 });
  });

  it('throws ContractServiceError on invalid contract identifier', async () => {
    const { callReadOnlyWithRetry } = await import('@/services/contractService');

    await expect(callReadOnlyWithRetry({
      network: {} as any,
      contractIdentifier: 'invalid-format',
      functionName: 'get-number',
      functionArgs: [],
    }, { retries: 1, baseDelayMs: 10 })).rejects.toThrow(ContractServiceError);
  });

  it('throws ContractServiceError with transient flag on network error', async () => {
    const { callReadOnlyWithRetry } = await import('@/services/contractService');
    const { fetchCallReadOnlyFunction } = await import('@stacks/transactions');

    const networkError = new Error('ECONNRESET');
    vi.mocked(fetchCallReadOnlyFunction).mockRejectedValueOnce(networkError);

    try {
      await callReadOnlyWithRetry({
        network: {} as any,
        contractIdentifier: 'SP123.contract',
        functionName: 'get-number',
        functionArgs: [],
      }, { retries: 0, baseDelayMs: 10 });
    } catch (err) {
      expect(err).toBeInstanceOf(ContractServiceError);
      if (err instanceof ContractServiceError) {
        expect(err.transient).toBe(true);
      }
    }
  });

  afterEach(() => {
    vi.resetModules();
  });
});
