import { CurrencyRate, IslamicDaylightInfo, MarketTicker, NewsArticle, WeatherData } from '../types';

export const MOCK_WEATHER_DATA: WeatherData = {
  temperature: 78,
  feelsLike: 81,
  high: 84,
  low: 68,
  condition: 'Partly Cloudy',
  iconName: 'SunCloud',
  humidity: 54,
  windSpeedMph: 8,
  aqi: 38,
  uvIndex: 4,
  summaryNote: 'Gentle breeze with optimal ambient air quality throughout the evening',
  sunrise: '2026-07-29T06:00',
  sunset: '2026-07-29T20:00',
  isDay: true,
  timezone: 'America/New_York',
  hourly: [
    { time: '3 PM', temp: 78, pop: 10, iconName: 'SunCloud' },
    { time: '4 PM', temp: 79, pop: 15, iconName: 'Sun' },
    { time: '5 PM', temp: 77, pop: 20, iconName: 'SunCloud' },
    { time: '6 PM', temp: 75, pop: 10, iconName: 'SunCloud' },
    { time: '7 PM', temp: 73, pop: 5, iconName: 'Sunset' },
    { time: '8 PM', temp: 71, pop: 0, iconName: 'Moon' },
    { time: '9 PM', temp: 69, pop: 0, iconName: 'Moon' },
    { time: '10 PM', temp: 68, pop: 0, iconName: 'Moon' },
  ],
};

export const MOCK_NEWS_ARTICLES: NewsArticle[] = [
  {
    id: 'news-1',
    title: 'Federal Reserve Signals Steady Rate Environment as Inflation Metrics Modernize',
    summary: 'Central bankers highlight stable productivity gains and balanced employment indicators in their latest quarterly outlook.',
    category: 'Business',
    source: 'Financial Times',
    publishedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    imageUrl: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'news-2',
    title: 'Next-Generation Renewable Microgrids Reach Record Grid Efficiency in Urban Centers',
    summary: 'Distributed energy storage systems demonstrate reliable peak shaving and resilience during regional demand spikes.',
    category: 'Tech',
    source: 'TechCrunch',
    publishedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: 'news-3',
    title: 'Global Clean Transport Summit Unveils Standardized Ultrafast Charging Networks',
    summary: 'Cross-industry consensus brings unified high-voltage infrastructure standards across North America and Europe.',
    category: 'Top',
    source: 'Reuters',
    publishedAt: new Date(Date.now() - 3600000 * 6).toISOString(),
  },
];

export const MOCK_MARKET_TICKERS: MarketTicker[] = [
  {
    symbol: 'S&P 500',
    name: 'S&P 500 Index',
    category: 'index',
    price: 5432.1,
    changePercent: 0.45,
    sparklineData: [
      { time: '9:30', value: 5408 },
      { time: '11:00', value: 5415 },
      { time: '12:30', value: 5410 },
      { time: '14:00', value: 5425 },
      { time: '16:00', value: 5432.1 },
    ],
  },
  {
    symbol: 'NASDAQ',
    name: 'Nasdaq Composite',
    category: 'index',
    price: 17890.55,
    changePercent: 0.82,
    sparklineData: [
      { time: '9:30', value: 17720 },
      { time: '11:00', value: 17790 },
      { time: '12:30', value: 17810 },
      { time: '14:00', value: 17850 },
      { time: '16:00', value: 17890.55 },
    ],
  },
  {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    category: 'stock',
    price: 224.5,
    changePercent: 1.2,
    sparklineData: [
      { time: '9:30', value: 221.8 },
      { time: '11:00', value: 222.5 },
      { time: '12:30', value: 223.1 },
      { time: '14:00', value: 223.9 },
      { time: '16:00', value: 224.5 },
    ],
  },
  {
    symbol: 'CRUDE OIL',
    name: 'WTI Crude',
    category: 'commodity',
    price: 81.4,
    changePercent: -1.2,
    sparklineData: [
      { time: '9:30', value: 82.5 },
      { time: '11:00', value: 82.1 },
      { time: '12:30', value: 81.9 },
      { time: '14:00', value: 81.6 },
      { time: '16:00', value: 81.4 },
    ],
  },
];

export const MOCK_CURRENCY_RATES: CurrencyRate[] = [
  { pair: 'USD / EUR', rate: 0.918, change24h: -0.12 },
  { pair: 'USD / GBP', rate: 0.785, change24h: 0.08 },
  { pair: 'USD / BDT', rate: 122.15, change24h: 0.05 },
];

export const MOCK_ISLAMIC_INFO: IslamicDaylightInfo = {
  hijriDate: '14 Safar 1448 AH',
  fajr: '4:42 AM',
  sunrise: '6:08 AM',
  dhuhr: '1:06 PM',
  asr: '4:52 PM',
  maghrib: '8:04 PM',
  isha: '9:28 PM',
  nextPrayer: 'Maghrib',
  timeRemainingNextPrayer: '3h 12m',
};
