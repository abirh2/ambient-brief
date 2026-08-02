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
  return safeUrl;
}

export function getPublisherDomain(value: string): string | undefined {
  const safeUrl = getSafeExternalUrl(value);
  if (!safeUrl) return undefined;
  return new URL(safeUrl).hostname.toLowerCase().replace(/^www\./, '');
}

export function getCanonicalArticleUrl(value: string): string | undefined {
  const safeUrl = getSafeExternalUrl(value);
  if (!safeUrl) return undefined;

  const parsed = new URL(safeUrl);
  parsed.hash = '';
  for (const key of [...parsed.searchParams.keys()]) {
    if (/^(utm_|fbclid$|gclid$|mc_cid$|mc_eid$)/i.test(key)) parsed.searchParams.delete(key);
  }
  parsed.hostname = parsed.hostname.toLowerCase();
  if (parsed.pathname !== '/') parsed.pathname = parsed.pathname.replace(/\/+$/, '');
  return parsed.href;
}
