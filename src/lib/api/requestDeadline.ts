import { AppApiError } from './types';

/** Bounds fetch, body consumption and validation, even if I/O ignores abort. */
export async function withRequestDeadline<T>(
  run: (signal: AbortSignal) => Promise<T>,
  signal?: AbortSignal,
  timeoutMs = 15_000,
): Promise<T> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let onAbort = () => {};
  try {
    return await Promise.race([
      new Promise<never>((_resolve, reject) => {
        onAbort = () => {
          controller.abort();
          reject(new DOMException('Aborted', 'AbortError'));
        };
        if (signal?.aborted) return onAbort();
        signal?.addEventListener('abort', onAbort, { once: true });
        timer = setTimeout(() => {
          controller.abort();
          reject(new AppApiError('timeout', `The request timed out after ${timeoutMs}ms.`));
        }, timeoutMs);
      }),
      (async () => {
        controller.signal.throwIfAborted();
        return run(controller.signal);
      })(),
    ]);
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onAbort);
  }
}
