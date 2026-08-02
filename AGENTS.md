# Ambient Brief Development Instructions

## Product

Ambient Brief is a single-page ambient information dashboard designed to remain open on a laptop or ultrawide monitor.

Its primary hierarchy is:

1. Large live clock and date
2. Concise local weather
3. Top news
4. Markets
5. Contextual information such as AQI, daylight, currency and optional prayer times

The app should feel cinematic, calm, modern and useful at a glance.

## Technical principles

- Use React, TypeScript and Vite.
- Preserve strict TypeScript.
- Avoid `any` and unsafe casts.
- Prefer small feature-oriented components.
- Keep external provider response types out of UI components.
- Validate third-party responses at runtime with Zod.
- Keep provider adapters replaceable.
- Do not add a backend unless explicitly requested.
- Do not expose developer-owned API keys in the frontend.
- Do not use unofficial CORS proxies.
- Do not present mock data as live production data.
- Run tests, lint, TypeScript and production builds after meaningful changes.

## UI principles

- Avoid generic admin-dashboard styling.
- Use restrained glassmorphism.
- Use no more than three dominant glass surfaces.
- Avoid nested cards, neon borders, grids, gradient blobs and excessive pills.
- Time and date should be more prominent than detailed weather.
- Weather should be concise rather than dominate the screen.
- Prayer information is optional and disabled by default.
- Show only the next prayer prominently; keep the full schedule expandable.
- Support 1366×768, 1440×900, 1920×1080 and ultrawide screens.
- Avoid page scrolling at normal desktop heights when practical.
- Respect reduced-motion preferences.

## Data integrity

Every external value must be identified internally as one of:

- live
- delayed
- end-of-day
- cached
- stale
- unavailable
- demo

Never update a “last refreshed” timestamp after a failed request.

Never fall back to realistic mock values in production.

## API preferences

Prefer keyless, documented browser-compatible providers:

- Open-Meteo for weather, geocoding and air quality
- National Weather Service for US alerts
- GDELT for keyless news, only after deployed-origin CORS verification
- Frankfurter for currency rates
- AlAdhan for prayer times and Hijri dates
- TradingView widgets for no-key market displays when native keyless market APIs are unavailable

## Git behavior

- Do not commit unless asked.
- Keep each task focused.
- Do not rewrite unrelated code.
- Report files changed, tests run and remaining concerns.