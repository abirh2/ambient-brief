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

The development server prints its local URL. No environment variables or API keys are required to start the frontend. News is read from the last generated `public/data/news-feed.json` when that file exists.

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

The application does not use OpenWeather. Currents credentials are never frontend configuration.

## Demo mode

Mock data and visual state controls are explicit development tools. They are available only while running `npm run dev`; production builds force demo mode off and exclude the development-controls module.

## GitHub Pages

The Pages workflow runs all validation commands and builds the static artifact. During GitHub Actions builds, Vite derives the base path from `GITHUB_REPOSITORY` (for example, `/ambient-brief/`). User or organization Pages repositories ending in `.github.io` use `/`.

For another static host or a custom Pages path:

```bash
BASE_PATH=/custom-path/ npm run build
```

Enable GitHub Pages with “GitHub Actions” as the source in the repository settings before running the deployment workflow.

## Static news pipeline

Ambient Brief does not call a news API from the browser. News follows this static pipeline:

```text
Currents News API v2 → scheduled GitHub Actions job → public/data/news-feed.json → Vite frontend
```

The update workflow uses at most five Currents requests per run and requests no more than 20 results from each, matching the Currents Developer-plan result cap. It fetches a broad English feed plus focused US, business, sport, and entertainment feeds, validates the provider responses with Zod, normalizes and conservatively deduplicates the articles, ranks each application category, validates the complete generated document, and atomically replaces the previous file. Partial runs retain prior valid data for categories whose owning request failed. If every request fails, the prior file is left untouched and the workflow fails with safe per-request HTTP, timeout, network, JSON, or schema diagnostics.

The browser resolves `data/news-feed.json` through Vite's configured base path, so repository Pages paths such as `/ambient-brief/` work without a root-relative URL. It validates the generated document before updating local storage. Cached stories remain visible when a fetch fails, old or partial output is labeled as delayed, and an installation with neither static output nor cache shows “News temporarily unavailable.” No minute-by-minute browser polling is used.

### Configure Currents for GitHub Actions

1. [Create a Currents News API account and key](https://currentsapi.services/en/news-api-key).
2. In the GitHub repository, open **Settings → Secrets and variables → Actions**.
3. Create a repository secret named `CURRENTS_API_KEY` containing the key.
4. Open **Actions → Update static news feed → Run workflow** to generate the first feed manually.

The workflow then runs at minutes 7 and 37 of each hour. GitHub scheduled workflows can start later than their nominal cron time during periods of scheduler load, so a delayed label does not necessarily indicate a provider outage. Five requests per scheduled run, 48 runs per day, is approximately **240 Currents requests per day**, plus any manual runs. Check the limits and usage terms for the selected Currents plan.

The workflow commits `public/data/news-feed.json` only when its contents change, then explicitly dispatches the existing Pages deployment workflow. The explicit dispatch is necessary because GitHub does not emit another push-triggered workflow for commits made with the workflow's `GITHUB_TOKEN`. The news updater itself has no `push` trigger, preventing an update loop.

### Run the fetch locally

Supply the key only to the Node process; do not add it to a `VITE_` variable or commit it to an environment file:

```bash
CURRENTS_API_KEY='your-temporary-key' npm run fetch:news
```

The command logs only aggregate request and article counts. It never logs or serializes the key. Inspect `public/data/news-feed.json`, then run the normal checks. If the generated file is only for local verification, do not stage it.

## Current data behavior

- Open-Meteo weather, geocoding, and air-quality integrations are keyless.
- NWS alerts are keyless and apply to supported US locations.
- News comes from the validated static Currents cache generated by GitHub Actions. Production never substitutes mock stories.
- Frankfurter currency and AlAdhan prayer-time integrations are keyless.
- Markets come from the validated static Finnhub snapshot generated by GitHub Actions; the provider key never reaches the frontend.

Provider availability and browser CORS behavior can vary by deployed origin. No mock value should be treated as live production data.

The historical reason for replacing the direct-browser provider is retained in [`docs/gdelt-news-audit.md`](docs/gdelt-news-audit.md).

## Market data

Ambient Brief does not call Finnhub from the browser. The native market panel reads a validated public snapshot produced independently of the website deployment:

```text
Finnhub
→ GitHub Actions
→ market-data branch
→ markets.json
→ Ambient Brief
```

The producer uses Finnhub's documented [`GET /api/v1/quote`](https://finnhub.io/docs/api/quote) endpoint. It sends authentication in the `X-Finnhub-Token` header, validates every response, and normalizes provider fields before publishing. The public snapshot URL is centralized in `src/features/markets/config.ts`; update that one public value if this repository is forked or moved.

### Initial setup

1. Create a personal Finnhub API key.
2. Open the GitHub repository.
3. Go to **Settings**.
4. Open **Secrets and variables**.
5. Open **Actions**.
6. Select **New repository secret**.
7. Name it `FINNHUB_API_KEY`.
8. Paste the personal Finnhub key and save it.
9. Open **Actions → Update market snapshot → Run workflow** and enable **Force a refresh** for the first run.
10. Confirm the `market-data` branch contains `markets.json`, then confirm the deployed app can fetch it.

The secret is required only by the workflow. Local frontend builds do not need it. Never place the key in a `VITE_` variable, browser storage, a generated file, or source control.

### Scheduled updates

The workflow is scheduled at minutes 7, 22, 37, and 52 during a broad weekday UTC window covering US pre-market, regular, and after-hours periods across daylight-saving changes. A low-frequency weekend invocation checks whether the existing snapshot has become unusually old. The script estimates session state in `America/New_York` and suppresses unnecessary closed-market refreshes; manual runs can force an update.

GitHub cron expressions use UTC, and scheduled Actions are approximate—they can start later than the nominal time. Session labels use simple weekday and clock-time rules, not an exchange holiday calendar. They are estimates and do not imply that a quote is real-time.

### Website refresh behavior

The website's refresh controls only check the published `markets.json` for a newer snapshot. An explicit check bypasses browser caches, compares `generatedAt`, and reports when the displayed snapshot is already current. It does not call Finnhub and does not start GitHub Actions. Triggering a repository workflow from a public browser would require exposing a GitHub credential, so it is intentionally unsupported.

### Security, accuracy, and recovery

- `FINNHUB_API_KEY` remains a GitHub Actions repository secret and is sent only in a request header.
- The key is not included in frontend JavaScript, `markets.json`, browser storage, URLs, or workflow diagnostics.
- The three broad-market rows are ETF proxies: SPY for the S&amp;P 500, DIA for the Dow Jones, and QQQ for the Nasdaq-100. Their prices are never presented as index levels.
- Quotes may be delayed, cached, stale, partial, or unavailable. The dashboard is informational and is not trading software.
- A partial provider run retains prior validated values for failed symbols and marks them stale. A total failure leaves the previous public snapshot untouched.
- The browser revalidates the generated document and retains its own last valid cache during temporary failures. Invalid or missing values are never replaced with zeroes or plausible mock prices.

To rotate the provider key, replace the `FINNHUB_API_KEY` Actions secret, manually force the workflow once, and confirm a valid new snapshot. No frontend redeployment is required.

### NWS browser-access verification

NWS alerts use the official `https://api.weather.gov/alerts/active?point={latitude},{longitude}` GeoJSON endpoint directly from the browser, and only when the normalized location country code is `US`. No proxy is used. On 2026-08-02, direct browser access was verified from local Vite and `https://abirh2.github.io/ambient-brief/`; both requests completed without an NWS browser-access error. The deployed origin should be checked after future deployments because NWS CORS headers can change. If that check fails, the app disables the provider for the session and exposes an NWS diagnostic rather than presenting alerts as available.

## License

See [LICENSE](LICENSE).
