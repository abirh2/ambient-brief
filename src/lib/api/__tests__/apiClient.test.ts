import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { apiFetch } from '../apiClient';
import { AppApiError } from '../types';

describe('apiFetch', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => vi.restoreAllMocks());
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('returns a valid response parsed by its schema', async () => {
    const schema = z.object({ temperature: z.number(), condition: z.string() });
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ temperature: 72, condition: 'Sunny' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    await expect(apiFetch('https://example.test/weather', { schema, retries: 0 })).resolves.toEqual({
      temperature: 72,
      condition: 'Sunny',
    });
  });

  it('normalizes schema failures', async () => {
    const schema = z.object({ temperature: z.number() });
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ temperature: 'warm' }), { status: 200 }),
    );

    await expect(apiFetch('https://example.test/weather', { schema, retries: 0 })).rejects.toMatchObject({
      code: 'invalid-response',
      status: 200,
    });
    expect(globalThis.fetch).toHaveBeenCalledOnce();
  });

  it('normalizes invalid JSON without retrying it', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(new Response('<html>', { status: 200 }));

    await expect(apiFetch('https://example.test/data', { retries: 2, retryDelayMs: 0 })).rejects.toMatchObject({
      code: 'invalid-response',
    });
    expect(globalThis.fetch).toHaveBeenCalledOnce();
  });

  it('times out a request and does not retry when retries are disabled', async () => {
    globalThis.fetch = vi.fn((_url: string | URL | Request, init?: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
      }),
    );

    await expect(
      apiFetch('https://example.test/slow', { timeoutMs: 5, retries: 0 }),
    ).rejects.toMatchObject({ code: 'timeout' });
  });

  it('honors cancellation without starting or retrying a request', async () => {
    const controller = new AbortController();
    controller.abort();
    globalThis.fetch = vi.fn();

    await expect(
      apiFetch('https://example.test/data', { signal: controller.signal, retries: 2 }),
    ).rejects.toMatchObject({ code: 'aborted' });
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('retries safe transient HTTP errors', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(new Response(null, { status: 503 }));

    await expect(
      apiFetch('https://example.test/data', { retries: 1, retryDelayMs: 0 }),
    ).rejects.toMatchObject({ code: 'http', status: 503 });
    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
  });

  it('recognizes rate limits and Retry-After dates or seconds', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(null, { status: 429, headers: { 'Retry-After': '30' } }),
    );

    await expect(apiFetch('https://example.test/data', { retries: 0 })).rejects.toMatchObject({
      code: 'rate-limit',
      status: 429,
      retryAfterSeconds: 30,
    });
  });

  it('does not retry invalid configuration', async () => {
    globalThis.fetch = vi.fn();

    const request = apiFetch('https://example.test/data', { timeoutMs: 0, retries: 3 });
    await expect(request).rejects.toBeInstanceOf(AppApiError);
    await expect(request).rejects.toMatchObject({ code: 'configuration' });
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });
});
