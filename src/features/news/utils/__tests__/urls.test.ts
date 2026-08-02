import { describe, expect, it } from 'vitest';
import { getSafeExternalUrl, getSafeImageUrl } from '../urls';

describe('news URL validation', () => {
  it('allows only HTTP(S) article links', () => {
    expect(getSafeExternalUrl('https://example.com/story')).toBe('https://example.com/story');
    expect(getSafeExternalUrl('http://example.com/story')).toBe('http://example.com/story');
    expect(getSafeExternalUrl('javascript:alert(1)')).toBeUndefined();
    expect(getSafeExternalUrl('not a url')).toBeUndefined();
  });

  it('allows HTTP(S) images and rejects unsafe schemes', () => {
    expect(getSafeImageUrl('https://example.com/image.jpg')).toBe('https://example.com/image.jpg');
    expect(getSafeImageUrl('http://example.com/image.jpg')).toBe('http://example.com/image.jpg');
    expect(getSafeImageUrl('data:image/svg+xml,bad')).toBeUndefined();
  });
});
