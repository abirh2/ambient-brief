export const TRADINGVIEW_TICKER_TAPE_TAG = 'tv-ticker-tape';
export const TRADINGVIEW_TICKER_TAPE_SCRIPT =
  'https://widgets.tradingview-widget.com/w/en/tv-ticker-tape.js';

export const TRADINGVIEW_INDEX_SYMBOLS = [
  'SP:SPX',
  'DJ:DJI',
  'NASDAQ:IXIC',
] as const;

const COMPANY_SYMBOLS: Readonly<Record<string, string>> = {
  AAPL: 'NASDAQ:AAPL',
  MSFT: 'NASDAQ:MSFT',
  NVDA: 'NASDAQ:NVDA',
  AMZN: 'NASDAQ:AMZN',
  GOOGL: 'NASDAQ:GOOGL',
  META: 'NASDAQ:META',
};

let scriptLoadPromise: Promise<void> | null = null;

export function getTradingViewSymbols(selectedCompanies: readonly string[]): string {
  const companies = selectedCompanies
    .map((symbol) => COMPANY_SYMBOLS[symbol])
    .filter((symbol): symbol is string => Boolean(symbol));

  return [...TRADINGVIEW_INDEX_SYMBOLS, ...companies].join(',');
}

export function loadTradingViewTickerTape(): Promise<void> {
  if (customElements.get(TRADINGVIEW_TICKER_TAPE_TAG)) return Promise.resolve();
  if (scriptLoadPromise) return scriptLoadPromise;

  scriptLoadPromise = new Promise<void>((resolve, reject) => {
    const selector = `script[data-ambient-tradingview="ticker-tape"]`;
    const existing = document.querySelector<HTMLScriptElement>(selector);
    const script = existing ?? document.createElement('script');
    const timeout = window.setTimeout(() => {
      script.dataset.status = 'error';
      reject(new Error('TradingView widget script timed out'));
    }, 15_000);

    const finish = () => {
      void customElements.whenDefined(TRADINGVIEW_TICKER_TAPE_TAG).then(() => {
        window.clearTimeout(timeout);
        script.dataset.status = 'loaded';
        resolve();
      });
    };
    const fail = () => {
      window.clearTimeout(timeout);
      script.dataset.status = 'error';
      reject(new Error('TradingView widget script was blocked or unavailable'));
    };

    script.addEventListener('load', finish, { once: true });
    script.addEventListener('error', fail, { once: true });

    if (existing?.dataset.status === 'loaded') {
      finish();
      return;
    }

    if (!existing) {
      script.type = 'module';
      script.src = TRADINGVIEW_TICKER_TAPE_SCRIPT;
      script.dataset.ambientTradingview = 'ticker-tape';
      document.head.appendChild(script);
    }
  }).catch((error: unknown) => {
    document
      .querySelector<HTMLScriptElement>('script[data-ambient-tradingview="ticker-tape"][data-status="error"]')
      ?.remove();
    scriptLoadPromise = null;
    throw error;
  });

  return scriptLoadPromise;
}
