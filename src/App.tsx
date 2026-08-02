/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { App as AmbientApp } from './app/App';
import { AppProviders } from './app/AppProviders';

export default function App() {
  return (
    <AppProviders>
      <AmbientApp />
    </AppProviders>
  );
}

