import { useState } from 'react';
import { WeatherAlertBanner } from '../../src/features/weather/components/WeatherAlertBanner';
import { MOCK_WEATHER_ALERTS } from '../../src/mocks/ambientData';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { useWeather } from '../../src/features/weather/hooks/useWeather';
import { useNWSAlerts } from '../../src/features/weather/hooks/useNWSAlerts';
import { useAirQuality } from '../../src/features/air-quality/hooks/useAirQuality';
import { useSettingsStore, DEFAULT_LOCATION } from '../../src/stores/settingsStore';
import { useDevStateStore } from '../../src/stores/devStateStore';
import { cacheService } from '../../src/lib/api/cacheService';
import type { AppLocation } from '../../src/types';

const results = document.querySelector('#results');
const host = document.querySelector('#probe');
const runButton = document.querySelector<HTMLButtonElement>('#run');
const liveButton = document.querySelector<HTMLButtonElement>('#live');
if (!results || !host || !runButton || !liveButton) throw new Error('Missing test host');
const output = results;
const root = createRoot(host);
import.meta.hot?.dispose(() => root.unmount());
let weather!: ReturnType<typeof useWeather>;
let alerts!: ReturnType<typeof useNWSAlerts>;
let aqi!: ReturnType<typeof useAirQuality>;
function Probe() { weather = useWeather(); alerts = useNWSAlerts(); aqi = useAirQuality(); return <p>Mounted real React data owners</p>; }
const settle = () => new Promise<void>((resolve) => setTimeout(resolve, 30));
function assert(value: unknown, message: string): void { if (!value) throw new Error(message); }
function select(location: AppLocation, temperatureUnit: 'fahrenheit' | 'celsius' = 'fahrenheit') {
  flushSync(() => useSettingsStore.getState().updateSettings({ activeLocation: location, temperatureUnit }));
}
function weatherFixture(temperature: number) {
  const time = new Date().toISOString().slice(0, 16);
  return { latitude: 40, longitude: -75, timezone: 'America/New_York', utc_offset_seconds: -14400,
    current: { time, temperature_2m: temperature, apparent_temperature: temperature, relative_humidity_2m: 50, weather_code: 2, wind_speed_10m: 8, is_day: 1 },
    hourly: { time: [time], temperature_2m: [temperature], precipitation_probability: [0], weather_code: [2], uv_index: [1] },
    daily: { time: [time.slice(0, 10)], temperature_2m_max: [temperature], temperature_2m_min: [temperature], sunrise: [time.slice(0, 10) + 'T06:00'], sunset: [time.slice(0, 10) + 'T18:00'] } };
}
function alertFixture(expires: string) {
  return { type: 'FeatureCollection', features: [{ id: 'fixture-alert', properties: { event: 'Fixture warning', description: 'Official fixture details', instruction: 'Fixture instructions', status: 'Actual', messageType: 'Alert', expires } }] };
}
const response = (value: unknown) => new Response(JSON.stringify(value), { headers: { 'Content-Type': 'application/json' } });
const nativeFetch = window.fetch.bind(window);
let handleFetch: typeof fetch = async () => response(weatherFixture(70));
runButton.onclick = async () => {
  runButton.disabled = true;
  const lines: string[] = [];
  const originalSettings = useSettingsStore.getState().settings;
  const originalStorage = Array.from({ length: localStorage.length }, (_, index) => localStorage.key(index)).filter((key): key is string => key !== null).map((key) => [key, localStorage.getItem(key)] as const);
  const passed = (name: string) => { lines.push('PASS ' + name); output.textContent = lines.join('\n'); };
  try {
    cacheService.clearAll();
    localStorage.removeItem('ambient_dismissed_nws_alerts_v2');
    useDevStateStore.getState().setWeatherStatus('loaded');
    useSettingsStore.getState().updateSettings({ isDemoMode: false });
    window.fetch = (input, init) => handleFetch(input, init);
    select(DEFAULT_LOCATION);
    flushSync(() => root.render(<Probe />));
    await weather.loadWeather(); await settle();
    assert('data' in weather.weatherState && weather.weatherState.data.temperature === 70, 'Weather fixture not loaded');
    select(DEFAULT_LOCATION, 'celsius');
    assert(!('data' in weather.weatherState), 'Old Fahrenheit weather visible under Celsius');
    handleFetch = async () => response(weatherFixture(20));
    await weather.loadWeather(); await settle();
    assert('data' in weather.weatherState && weather.weatherState.data.temperature === 20, 'Celsius replacement missing');
    passed('Weather unit switch isolates prior readings');

    let complete: (value: Response) => void = () => { throw new Error('No deferred request'); };
    handleFetch = () => new Promise<Response>((resolve) => { complete = resolve; });
    const pending = weather.loadWeather(true).catch(() => undefined);
    const other = { ...DEFAULT_LOCATION, id: 'test-tokyo', name: 'Tokyo', latitude: 35.6762, longitude: 139.6503, timezone: 'Asia/Tokyo', countryCode: 'JP', country: 'Japan' };
    select(other);
    assert(!('data' in weather.weatherState), 'Old weather remains in new location');
    complete(response(weatherFixture(99))); await pending; await settle();
    assert(!('data' in weather.weatherState), 'Late old-location success published');
    passed('Rapid location switch rejects late weather success');

    select(DEFAULT_LOCATION, 'celsius');
    handleFetch = async () => new Response('{}', { status: 400 });
    await weather.loadWeather(true); await settle();
    assert(weather.weatherState.status === 'cached', 'Same-context fallback not preserved');
    assert('data' in weather.weatherState && weather.weatherState.data.temperature === 20, 'Fallback has wrong units');
    passed('Failed weather refresh preserves only matching validated cache');
    const successfulFetchAt = weather.metadata?.successfulFetchAt;
    handleFetch = () => new Promise<Response>((resolve) => { complete = resolve; });
    const sameContextOld = weather.loadWeather(true).catch(() => undefined);
    select(other); select(DEFAULT_LOCATION, 'celsius');
    complete(response(weatherFixture(99))); await sameContextOld; await settle();
    assert(!('data' in weather.weatherState) || weather.weatherState.data.temperature !== 99, 'A-to-B-to-A accepted obsolete revision');
    assert(weather.metadata?.successfulFetchAt === successfulFetchAt, 'Context return fabricated a fetch time');
    passed('A to B to A rejects obsolete revision while retaining original cache time');
    const controller = new AbortController();
    const aborted = weather.loadWeather(true, controller.signal).catch(() => undefined);
    controller.abort(); complete(response(weatherFixture(88))); await aborted; await settle();
    assert(!('data' in weather.weatherState) || weather.weatherState.data.temperature !== 88, 'Aborted response published');
    passed('Aborted weather response cannot replace last-good data');


    select(DEFAULT_LOCATION);
    handleFetch = async () => response(alertFixture(new Date(Date.now() + 60_000).toISOString()));
    await alerts.refreshAlerts(); await settle();
    assert(alerts.alerts.length === 1, 'US alert fixture missing');
    select(other);
    assert(alerts.alerts.length === 0 && alerts.coverage === 'unsupported', 'US alert survives unsupported context');
    passed('US to non-US immediately clears alerts without a provider call');
    select(DEFAULT_LOCATION);
    handleFetch = () => new Promise<Response>((resolve) => { complete = resolve; });
    const pendingAlert = alerts.refreshAlerts().catch(() => undefined);
    select(other); complete(response(alertFixture(new Date(Date.now() + 60_000).toISOString())));
    await pendingAlert; await settle();
    assert(alerts.alerts.length === 0 && alerts.coverage === 'unsupported', 'Late US alerts published outside coverage');
    passed('Late old-location alert response cannot publish');

    select(DEFAULT_LOCATION);
    handleFetch = async () => response(alertFixture(new Date(Date.now() + 200).toISOString()));
    await alerts.refreshAlerts(); await settle();
    assert(alerts.alerts.length === 1, 'Expiring alert not initially active');
    await new Promise((resolve) => setTimeout(resolve, 350));
    assert(alerts.alerts.length === 0, 'Alert did not expire without a refresh');
    passed('Alert expiration timer removes active alert within one second');
    handleFetch = async () => response({ type: 'FeatureCollection', features: [] });
    await alerts.refreshAlerts(); await settle();
    assert(alerts.coverage === 'none', 'Successful empty check not distinguished');
    select({ ...DEFAULT_LOCATION, id: 'new-us', latitude: 41 });
    handleFetch = async () => new Response('{}', { status: 503 });
    await alerts.refreshAlerts().catch(() => undefined); await settle();
    assert(alerts.coverage === 'unavailable', 'Failed empty check claimed no alerts');
    passed('Confirmed no alerts differs from failed check');

    handleFetch = async () => response(alertFixture(new Date(Date.now() + 60_000).toISOString()));
    await alerts.refreshAlerts(); await settle();
    alerts.dismissAlert('fixture-alert', new Date(Date.now() + 60_000).toISOString()); await settle();
    assert(alerts.coverage === 'active', 'Dismissing the final alert falsely asserted an official all-clear');
    await alerts.refreshAlerts(); await settle();
    assert(alerts.alerts.length === 0, 'Dismissal lost on recheck');
    assert(alerts.coverage === 'active', 'Dismissed active alert became an official all-clear');
    passed('Dismissal survives valid recheck');
    select({ ...DEFAULT_LOCATION, id: 'hidden-us', latitude: 42 });
    handleFetch = async () => response(alertFixture(new Date(Date.now() + 60_000).toISOString()));
    // A different CAP identifier avoids the preceding persistent dismissal.
    handleFetch = async () => {
      const fixture = alertFixture(new Date(Date.now() + 60_000).toISOString());
      fixture.features[0].id = 'hidden-expiry';
      return response(fixture);
    };
    await alerts.refreshAlerts(); await settle();
    const nativeNow = Date.now;
    try {
      Date.now = () => nativeNow() + 120_000;
      document.dispatchEvent(new Event('visibilitychange')); await settle();
      assert(alerts.alerts.length === 0, 'Expired alert restored on visibility event');
    } finally { Date.now = nativeNow; }
    passed('Visibility restoration reconciles alert expiration before cues');


    handleFetch = async () => response({ latitude: 40, longitude: -75, timezone: 'America/New_York', current: { time: '2026-11-02T12:00', us_aqi: 42 } });
    await aqi.loadAirQuality(); await settle();
    assert('data' in aqi.aqiState, 'AQI fixture missing');
    select(other);
    assert(!('data' in aqi.aqiState), 'AQI from old location remains');
    passed('AQI location identity is isolated');
    cacheService.setCache(`weather_v2_${other.latitude.toFixed(2)}_${other.longitude.toFixed(2)}_fahrenheit`, { contextKey: JSON.stringify([other, 'fahrenheit']), value: { temperature: 'corrupt' } }, 60_000);
    handleFetch = async () => new Response('{}', { status: 400 });
    await weather.loadWeather(true).catch(() => undefined); await settle();
    assert(!('data' in weather.weatherState), 'Corrupt weather fallback rendered');
    passed('Corrupt context-matching cache is rejected');
    select(DEFAULT_LOCATION);
    handleFetch = async () => response(weatherFixture(70));
    await weather.loadWeather(); await settle();
    const wallClock = Date.now;
    try {
      Date.now = () => wallClock() + 26 * 60 * 60_000;
      flushSync(() => root.render(<Probe />));
      assert(!('data' in weather.weatherState), 'Expired mounted weather survived offline retention');
    } finally { Date.now = wallClock; }
    passed('Mounted weather stops exposing values beyond retention without a fetch');


    output.textContent = lines.join('\n') + '\nALL BROWSER REGRESSIONS PASSED';
  } catch (error) { output.textContent = lines.join('\n') + '\nFAIL ' + String(error); }
  finally {
    window.fetch = nativeFetch;
    useSettingsStore.getState().updateSettings(originalSettings);
    localStorage.clear();
    for (const [key, value] of originalStorage) if (value !== null) localStorage.setItem(key, value);
    runButton.disabled = false;
  }
};
liveButton.onclick = async () => {
  output.textContent = 'Checking public v1 endpoint from this browser origin…';
  try {
    const supported = await nativeFetch('https://api.frankfurter.dev/v1/latest?from=USD&to=EUR');
    const supportedBody: unknown = await supported.json();
    const unsupported = await nativeFetch('https://api.frankfurter.dev/v1/latest?from=USD&to=BDT');
    const unsupportedBody: unknown = await unsupported.json();
    output.textContent = JSON.stringify({ origin: location.origin, supported: { status: supported.status, body: supportedBody }, defaultPair: { status: unsupported.status, body: unsupportedBody } }, null, 2);
  } catch (error) { output.textContent = 'Browser access failed: ' + String(error); }
};

function AlertPreview() {
  const [dismissed, setDismissed] = useState(false);
  return dismissed ? <p>Fixture dismissed</p> : <WeatherAlertBanner alert={{ ...MOCK_WEATHER_ALERTS.warning, description: 'Official fixture details. Take shelter.', instruction: 'Fixture safety instructions.', expires: new Date(Date.now() + 60_000).toISOString() }} onDismiss={() => setDismissed(true)} />;
}
const alertButton = document.querySelector<HTMLButtonElement>('#alert');
if (alertButton) alertButton.onclick = () => root.render(<AlertPreview />);
