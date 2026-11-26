import { StrictMode, useLayoutEffect } from 'react';
import { createRoot } from 'react-dom/client';
// Only the Bootstrap layers this page uses (reboot, grid, utilities); no component CSS.
// The PrimalOne layer loads after it so brand styles win without !important.
import 'bootstrap/dist/css/bootstrap-reboot.min.css';
import 'bootstrap/dist/css/bootstrap-grid.min.css';
import 'bootstrap/dist/css/bootstrap-utilities.min.css';
import './styles/base.css';
import App from './App.jsx';

// Built pages ship their content as static HTML for crawlers (scripts/prerender.mjs), kept
// hidden by a <style id="prerender-hide"> until the app has mounted here, so visitors see
// exactly what they saw before: the live app, never a static copy flashing first.
function Mounted({ children }) {
  useLayoutEffect(() => { document.getElementById('prerender-hide')?.remove(); }, []);
  return children;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Mounted>
      <App />
    </Mounted>
  </StrictMode>,
);
