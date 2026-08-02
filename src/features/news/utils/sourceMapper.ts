const DOMAIN_MAP: Record<string, string> = {
  'chalkbeat.org': 'Chalkbeat',
  'theepochtimes.com': 'The Epoch Times',
  'hellomagazine.com': 'HELLO!',
  'reuters.com': 'Reuters',
  'bbc.co.uk': 'BBC News',
  'bbc.com': 'BBC News',
  'cnn.com': 'CNN',
  'nytimes.com': 'The New York Times',
  'theguardian.com': 'The Guardian',
  'bloomberg.com': 'Bloomberg',
  'wsj.com': 'The Wall Street Journal',
  'apnews.com': 'Associated Press',
  'techcrunch.com': 'TechCrunch',
  'theverge.com': 'The Verge',
  'wired.com': 'Wired',
  'arstechnica.com': 'Ars Technica',
};

export function formatPublisherName(sourceOrDomain: string): string {
  if (!sourceOrDomain) return 'News Source';
  const clean = sourceOrDomain
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .split('/')[0];
  
  if (DOMAIN_MAP[clean]) {
    return DOMAIN_MAP[clean];
  }

  const parts = clean.split('.');
  if (parts.length >= 2) {
    const commonSecondLevelSuffixes = new Set(['co.uk', 'com.au', 'co.nz', 'com.br']);
    const suffix = parts.slice(-2).join('.');
    const main = commonSecondLevelSuffixes.has(suffix) && parts.length >= 3
      ? parts[parts.length - 3]
      : parts[parts.length - 2];
    if (!main) return sourceOrDomain;
    return main.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  }

  return sourceOrDomain;
}
