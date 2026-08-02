# Ambient Brief

Ambient Brief is a single-page ambient information dashboard built with React 19, strict TypeScript, Tailwind CSS, and Vite. This repository currently contains the application foundation and existing prototype integrations; it does not require an application server.

## Requirements

- Node.js 22 or newer
- npm 10 or newer

npm is the authoritative package manager. The committed `package-lock.json` is used for reproducible installs.

## Setup

```bash
npm ci
npm run dev
```

The development server prints its local URL. No environment variables or API keys are required to start the app.

Available checks:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

Use `npm run preview` to serve the completed production build locally.

## Optional configuration

`BASE_PATH` changes the Vite asset base for static hosting outside the automatic GitHub Pages configuration. Copy `.env.example` to `.env.local` only when this override is needed.

An Alpha Vantage key can optionally be entered in Settings to enable the existing market prototype. Without one, markets show a setup state; the rest of Ambient Brief starts normally. The key is stored in browser local storage and is visible to browser scripts and developer tools, so do not use a privileged or developer-owned secret.

The application does not use OpenWeather and does not require OpenWeather, Guardian, or Alpha Vantage environment variables.

## Demo mode

Mock data and visual state controls are explicit development tools. They are available only while running `npm run dev`; production builds force demo mode off and exclude the development-controls module.

## GitHub Pages

The Pages workflow runs all validation commands and builds the static artifact. During GitHub Actions builds, Vite derives the base path from `GITHUB_REPOSITORY` (for example, `/ambient-brief/`). User or organization Pages repositories ending in `.github.io` use `/`.

For another static host or a custom Pages path:

```bash
BASE_PATH=/custom-path/ npm run build
```

Enable GitHub Pages with “GitHub Actions” as the source in the repository settings before running the deployment workflow.

## Current data behavior

- Open-Meteo weather, geocoding, and air-quality integrations are keyless.
- NWS alerts are keyless and apply to supported US locations.
- Live news is currently unavailable in production. The GDELT DOC 2.0 adapter remains production-gated because deployed-origin verification did not pass; local development may exercise it, cached stories are labeled as cached, and production never substitutes mock stories.
- Frankfurter currency and AlAdhan prayer-time integrations are keyless.
- Alpha Vantage markets are optional and do not block startup.

Provider availability and browser CORS behavior can vary by deployed origin. No mock value should be treated as live production data.

### GDELT browser-access verification

The detailed 2026-08-02 verification record is in [`docs/gdelt-news-audit.md`](docs/gdelt-news-audit.md). The documented Pages URL returned GitHub's 404 page, a direct article-list GET returned HTTP 429, and a preflight returned `Access-Control-Allow-Origin: *`. Because an actual article response could not be fetched from a running Pages app, live GDELT news remains disabled. Re-enable it only after a successful article-list request is observed in the deployed page context and the payload, duplicate rate, timestamps, and images are re-audited.

### NWS browser-access verification

NWS alerts use the official `https://api.weather.gov/alerts/active?point={latitude},{longitude}` GeoJSON endpoint directly from the browser, and only when the normalized location country code is `US`. No proxy is used. On 2026-08-02, direct browser access was verified from local Vite and `https://abirh2.github.io/ambient-brief/`; both requests completed without an NWS browser-access error. The deployed origin should be checked after future deployments because NWS CORS headers can change. If that check fails, the app disables the provider for the session and exposes an NWS diagnostic rather than presenting alerts as available.

## License

See [LICENSE](LICENSE).
