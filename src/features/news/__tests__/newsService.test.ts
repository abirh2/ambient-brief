import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  isNewsProviderEnabled,
} from '../newsService';

describe('news provider availability gate', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('allows local development but keeps unverified production disabled', () => {
    expect(isNewsProviderEnabled(true)).toBe(true);
    expect(isNewsProviderEnabled(false)).toBe(false);
  });
});
