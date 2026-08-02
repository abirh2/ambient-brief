import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { z } from 'zod';
import { apiFetch } from '../apiClient';
import { ApiError } from '../types';

describe('apiFetch Wrapper', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('successfully fetches and validates data against a Zod schema', async () => {
    const mockData = { temperature: 72, condition: 'Sunny' };
    const TestSchema = z.object({
      temperature: z.number(),
      condition: z.string(),
    });

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockData,
      headers: new Headers(),
    } as unknown as Response);

    const result = await apiFetch('https://api.example.com/weather', {
      schema: TestSchema,
      retries: 0,
    });

    expect(result).toEqual(mockData);
  });

  it('throws an invalid-response error when Zod validation fails', async () => {
    const invalidData = { temperature: '72 degrees', condition: 'Sunny' };
    const TestSchema = z.object({
      temperature: z.number(), // expect number, gets string
      condition: z.string(),
    });

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => invalidData,
      headers: new Headers(),
    } as unknown as Response);

    try {
      await apiFetch('https://api.example.com/weather', {
        schema: TestSchema,
        retries: 0,
      });
      expect.fail('Should have thrown an error');
    } catch (err: unknown) {
      const error = err as ApiError;
      expect(error.code).toBe('invalid-response');
      expect(error.message).toContain('Response validation failed');
    }
  });

  it('throws an invalid-response error on non-JSON response body', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => {
        throw new SyntaxError('Unexpected token < in JSON at position 0');
      },
      headers: new Headers(),
    } as unknown as Response);

    try {
      await apiFetch('https://api.example.com/data', { retries: 0 });
      expect.fail('Should have thrown an error');
    } catch (err: unknown) {
      const error = err as ApiError;
      expect(error.code).toBe('invalid-response');
    }
  });

  it('handles HTTP error responses (e.g., 500) and attempts retries', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      headers: new Headers(),
    } as unknown as Response);

    try {
      await apiFetch('https://api.example.com/data', { retries: 1, retryDelayMs: 10 });
      expect.fail('Should have thrown an error');
    } catch (err: unknown) {
      const error = err as ApiError;
      expect(error.code).toBe('http');
      expect(error.status).toBe(500);
      expect(global.fetch).toHaveBeenCalledTimes(2);
    }
  });

  it('detects 429 rate limit errors and extracts Retry-After header', async () => {
    const headers = new Headers();
    headers.set('Retry-After', '30');

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      headers,
    } as unknown as Response);

    try {
      await apiFetch('https://api.example.com/rate-limited', { retries: 0 });
      expect.fail('Should have thrown an error');
    } catch (err: unknown) {
      const error = err as ApiError;
      expect(error.code).toBe('rate-limit');
      expect(error.status).toBe(429);
      expect(error.retryAfterSeconds).toBe(30);
    }
  });

  it('handles user-initiated cancellation via AbortSignal', async () => {
    const controller = new AbortController();
    controller.abort();

    try {
      await apiFetch('https://api.example.com/data', {
        signal: controller.signal,
        retries: 0,
      });
      expect.fail('Should have thrown an error');
    } catch (err: unknown) {
      const error = err as ApiError;
      expect(error.code).toBe('aborted');
    }
  });
});
