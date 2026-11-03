import {lazy, StrictMode, Suspense} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Explicit opt-in only. Normal release builds eliminate the prototype import.
const prototypeEnabled = (import.meta.env.DEV || import.meta.env.VITE_WORLD_PROTOTYPE === 'true')
  && new URLSearchParams(window.location.search).get('world') === 'observatory';
const WorldPrototype = prototypeEnabled ? lazy(() => import('./app/WorldPrototype')) : null;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {WorldPrototype
      ? <Suspense fallback={<main>Opening the island study…</main>}><WorldPrototype /></Suspense>
      : <App />}
  </StrictMode>,
);
