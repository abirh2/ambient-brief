# Ambient Brief

An ambient, glanceable information dashboard prototype engineered to stay open on desktop monitors, laptops, and ambient displays for hours. **Ambient Brief** provides real-time atmospheric weather metrics, curated news summaries, live financial market trends, and contextual indicators (Air Quality, UV Index, Sunset Countdown, Currency, Islamic Prayer Times) in a distraction-free, low-cognitive-load glassmorphic layout.

---

## Technical Stack

- **Framework:** React 18 + Vite
- **Language:** TypeScript 5.8 (Strict Mode)
- **Styling:** Tailwind CSS v4 + Layered Glassmorphism Design Tokens
- **State Management:** Zustand (Persistent Settings & Visual Dev Controls)
- **Icons:** Lucide React (`lucide-react`)
- **Animations & Transitions:** Native GPU-accelerated CSS keyframes with `will-change: transform`

---

## Live Providers & API Integration Audit

### 1. Open-Meteo Geocoding API (`geocoding-api.open-meteo.com`)
- **CORS Result:** Fully enabled (`Access-Control-Allow-Origin: *`). Suitable for static SPA deployment.
- **Requirements:** No API key required. Free tier.
- **Usage:** Powers location search and autocomplete.

### 2. Open-Meteo Weather Forecast API (`api.open-meteo.com`)
- **CORS Result:** Fully enabled (`Access-Control-Allow-Origin: *`). Suitable for static SPA deployment.
- **Requirements:** No API key required. Free tier.
- **Usage:** Powers current temperature, feels-like, humidity, wind, hourly forecast, sunrise/sunset, and weather insights.

### 3. Open-Meteo Air Quality API (`air-quality-api.open-meteo.com`)
- **CORS Result:** Fully enabled (`Access-Control-Allow-Origin: *`). Suitable for static SPA deployment.
- **Requirements:** No API key required. Free tier.
- **Usage:** Powers US AQI, PM2.5, PM10, Ozone, and pollen breakdown.

### 4. National Weather Service (NWS) Alerts API (`api.weather.gov`)
- **CORS Result:** Fully enabled (`Access-Control-Allow-Origin: *`). Suitable for static SPA deployment (US regions only).
- **Requirements:** No API key required (requires User-Agent / Accept headers).
- **Usage:** Powers active severe weather warnings, watches, and advisories for US locations. Non-US locations return empty alerts gracefully.

### 5. GDELT Doc 2.0 API (`api.gdeltproject.org`)
- **CORS Result:** Fully enabled (`Access-Control-Allow-Origin: *`). Suitable for static SPA deployment.
- **Requirements:** No API key required. Free global news wire.
- **Usage:** Powers real-time global news headlines across categories (Top, U.S., World, Business, Tech, Science, Sports, Entertainment).

### 6. The Guardian Open Platform (`content.guardianapis.com`) - Optional
- **CORS Result:** Enabled for authenticated requests.
- **Requirements:** Personal API key required (optional fallback to GDELT/mock).
- **Usage:** Premium curated journalism feed.

### 7. Frankfurter API (`api.frankfurter.app`) - or Mock Currency Service
- **CORS Result:** Fully enabled.
- **Requirements:** No API key required.
- **Usage:** Powers currency exchange rate pairs.

### 8. AlAdhan Prayer Times API (`api.aladhan.com`)
- **CORS Result:** Fully enabled.
- **Requirements:** No API key required.
- **Usage:** Powers precise Islamic prayer schedule calculations based on latitude, longitude, calculation method (ISNA, MWL, etc.), and Asr juristic school (Standard vs. Hanafi).

### 9. Alpha Vantage Global Quote API (`www.alphavantage.co`) - Optional
- **CORS Result:** Varies; may be restricted or blocked by strict browser CORS/adblockers depending on origin headers. **Marked as optional with fallback/mock data & advisory request budget (20 requests/day).**
- **Requirements:** Personal API key required.
- **Usage:** Powers stock watchlist quotes and S&P 500 / Dow / Nasdaq-100 ETF proxies (SPY, DIA, QQQ).

---

## Static-Site Limitations & Deployment Verification

Ambient Brief is built as a single-page application (SPA) designed for deployment on static hosting providers such as GitHub Pages, Vercel, or Netlify.
- **Client-Side Storage:** All settings, location favorites, and API diagnostic states are stored in browser `localStorage`.
- **CORS Constraints:** Most data providers (Open-Meteo, GDELT, AlAdhan, NWS) support direct browser CORS. Alpha Vantage may experience CORS blocks on certain static origins and is wrapped with graceful fallback to cached/mock data.
- **Background Visibility:** Uses the Page Visibility API (`useVisibilityRefresh`) to pause polling when tabs are hidden and perform staggered refresh upon foreground return.

---

## Data Refresh Policies & Freshness Disclosures

- **Weather Data:** Cached for 15 minutes. Stale data labeled clearly after expiration.
- **Air Quality:** Cached for 30 minutes.
- **News Headlines:** Cached for 20 minutes.
- **Financial Markets:** Cached for 4 hours during market hours (12 hours off-hours). Labeled with "End of day" or "Delayed".
- **Prayer Times:** Cached for 24 hours (refreshes at midnight rollover).

---

## Security & API Key Warnings

> [!WARNING]
> **API Key Storage Notice:** User-entered API keys (Alpha Vantage, Guardian) are stored in client-side `localStorage` and never transmitted to any third-party server. Because browser-side keys are visible in developer tools, users are advised to use restricted or free-tier personal keys.
- **No Secrets in Source Control:** No hardcoded API secrets exist in the repository.
- **Input Sanitization & Validation:** All incoming API payloads are validated using Zod runtime schemas before rendering.

---

## Troubleshooting & Support

1. **Weather/Geocoding fails to load:** Check network connection or adblocker settings blocking `open-meteo.com`.
2. **Stock markets show stale data:** Alpha Vantage free tier limits requests to 25/day (Ambient Brief enforces a 20-request daily advisory budget). Enter a valid API key in Settings or use ETF proxies.
3. **Prayer times incorrect:** Verify location coordinates and select the appropriate calculation method (e.g., ISNA for North America) in Settings.

---

## Attribution & Licenses
- Weather & Geocoding data powered by [Open-Meteo.com](https://open-meteo.com) (CC BY 4.0).
- News wire powered by [GDELT Project](https://www.gdeltproject.org).
- Prayer times powered by [AlAdhan.com](https://aladhan.com).
- Open source under the MIT License.

