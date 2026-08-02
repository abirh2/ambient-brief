export function getSafeExternalUrl(value?: string): string | undefined {
  if (!value) return undefined;

  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:' ? parsed.href : undefined;
  } catch {
    return undefined;
  }
}

export function getSafeImageUrl(value?: string): string | undefined {
  const safeUrl = getSafeExternalUrl(value);
  return safeUrl?.startsWith('https://') ? safeUrl : undefined;
}
