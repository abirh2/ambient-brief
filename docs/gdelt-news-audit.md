# GDELT DOC 2.0 news audit

Date: 2026-08-02  
Intended deployed page: `https://abirh2.github.io/ambient-brief/`  
Decision: **Unavailable; do not enable the live provider.**

## Requested API

The audit used the official GDELT DOC 2.0 Article List endpoint over HTTPS, with English source filtering, newest-first sorting, a 24-hour window, and JSON/JSONFeed output. No proxy was used.

Minimal request:

```text
https://api.gdeltproject.org/api/v2/doc/doc?query=climate%20sourcelang%3Aenglish&mode=artlist&format=json&maxrecords=50&sort=datedesc
```

The official DOC 2.0 documentation says Article List supports JSON and JSONFeed and advertises wildcard CORS. Runtime verification is still required because provider and origin behavior can change.

## Verification results

| Check | Result | Evidence |
| --- | --- | --- |
| Minimal local GET | Failed | `HTTP 429 Too Many Requests`; `Server: GDELT Server`; 444-byte error body. The error response did not include `Access-Control-Allow-Origin`. |
| Deployed Pages app | Failed | The intended URL rendered GitHub's `404 — There isn't a GitHub Pages site here` page. There was no deployed Ambient Brief page context from which to issue the request. |
| CORS preflight using `Origin: https://abirh2.github.io` | Passed only at preflight level | `HTTP 200`, `Access-Control-Allow-Origin: *`, `Timing-Allow-Origin: *`, `Content-Type: application/json; charset=utf-8`. |
| Actual cross-origin article response | Not verified | A successful GET could not be observed from the deployed application, so preflight headers alone are insufficient. |

Follow-up testing from a cold local cache confirmed the live failure rather than hiding it behind prior results. Both a minimal JSON request and a minimal JSONFeed request returned HTTP 429. The 429 response omitted `Access-Control-Allow-Origin`, so browser JavaScript receives an unreadable network/CORS failure instead of a usable 429 response. The previous `news_gdelt_v2_*` cache also allowed results from the old broad query to appear after a refresh; the corrected integration uses a new cache generation.

## Payload-quality observations

No successful article payload was received, so the audit deliberately records the following as **not measured** rather than extrapolating from fixtures or inventing results:

- Response fields: not observed. The pre-existing adapter assumed `articles[]` entries containing `title`, `url`, `domain`, `seendate`, and optional `socialimage`, but those fields were not confirmed in this run.
- Duplicate frequency: not measurable (zero articles received).
- Timestamp format: not observed. The pre-existing adapter expects `YYYYMMDDTHHmmssZ`; this remains an unverified assumption for the current endpoint response.
- Image reliability: not measurable (zero image URLs received).

## Existing-integration audit

The pre-existing GDELT path could not be considered production-quality even apart from availability:

- It enabled live requests without a recorded deployed-origin success.
- Broad keyword OR queries could label an article as a category based only on title substring matches.
- Ranking was order-dependent and attached diagnostics to production objects before the UI hid them.
- Source diversity penalties were calculated before the final reorder, so the visible order was not guaranteed to be diverse.
- Missing/invalid timestamps became the Unix epoch, which could produce misleading relative text.
- Remote images had no error fallback and HTTP image URLs could be accepted on an HTTPS deployment.
- A fresh legacy cache was displayed as `loaded`, even when live-provider availability was unknown.

## Current behavior and re-enable criteria

Live GDELT requests are gated off in production. Local development may attempt the provider so its behavior can be inspected; requests are bounded to 15 seconds and failures identify GDELT/browser connectivity rather than pretending that saved stories refreshed. The provider retries every 15 minutes while visible. Failures still fall back to explicitly labeled cached stories or an unavailable state. Development-only mock states remain development-only.

Before changing the availability gate, repeat all of these checks from a working GitHub Pages deployment:

1. Observe a successful Article List GET in the deployed page context.
2. Confirm the successful response has a usable JSON content type and CORS headers.
3. Record the actual field set and validate it with Zod.
4. Measure exact-URL and conservative title-similarity duplicate rates on a representative sample.
5. Confirm timestamp syntax and reject invalid/missing dates instead of substituting plausible values.
6. Probe image URLs for HTTPS, content type, status, and load failures; images must remain optional.
7. Validate category queries and ranking output for recency, relevance, source diversity, metadata quality, conservative duplicate suppression, Top-feed locality, and entertainment deprioritization.
