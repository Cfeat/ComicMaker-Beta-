import { ApiError } from './api';

export const delay = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

// A delay that resolves early when the workflow is cancelled.
export function abortableDelay(ms: number, signal?: AbortSignal): Promise<void> {
  if (!signal) return delay(ms);
  if (signal.aborted) return Promise.resolve();
  return new Promise<void>((resolve) => {
    const timer = setTimeout(resolve, ms);
    signal.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);
        resolve();
      },
      { once: true },
    );
  });
}

export interface RetryOptions {
  retries?: number;
  baseDelayMs?: number;
  signal?: AbortSignal;
  shouldRetry?: (error: unknown) => boolean;
}

// Retry on rate limits, transient server errors and network failures, with
// exponential backoff. Never retries an aborted request.
const defaultShouldRetry = (error: unknown): boolean =>
  error instanceof ApiError && (error.status === 429 || error.status === 0 || error.status >= 500);

export async function withRetry<T>(operation: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const { retries = 2, baseDelayMs = 3000, signal, shouldRetry = defaultShouldRetry } = options;
  try {
    return await operation();
  } catch (error) {
    if (retries <= 0 || signal?.aborted || !shouldRetry(error)) throw error;
    await abortableDelay(baseDelayMs, signal);
    if (signal?.aborted) throw error;
    return withRetry(operation, { retries: retries - 1, baseDelayMs: baseDelayMs * 2, signal, shouldRetry });
  }
}
