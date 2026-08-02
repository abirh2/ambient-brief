import { ApiDiagnosticsDrawer } from './ApiDiagnosticsDrawer';
import { DevStateSwitcher } from './DevStateSwitcher';
import { ScreenWidthIndicator } from './ScreenWidthIndicator';

export default function DevTools() {
  return (
    <>
      <ScreenWidthIndicator />
      <DevStateSwitcher />
      <ApiDiagnosticsDrawer />
    </>
  );
}
