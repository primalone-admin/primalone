// Build-time only: renders one route to HTML so crawlers that don't run JavaScript
// (most AI crawlers, link previews) can read the page. Used by scripts/prerender.mjs.
import { Writable } from 'node:stream';
import { renderToPipeableStream } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { AppRoutes } from './App.jsx';

export function render(url) {
  return new Promise((resolve, reject) => {
    let html = '';
    const sink = new Writable({
      write(chunk, _enc, cb) { html += chunk.toString(); cb(); },
      final(cb) { resolve(html); cb(); },
    });
    const { pipe } = renderToPipeableStream(
      <StaticRouter location={url}>
        <AppRoutes />
      </StaticRouter>,
      {
        // wait for lazy pages (legal) so the full text is in the HTML
        onAllReady() { pipe(sink); },
        onShellError: reject,
        onError: reject,
      },
    );
  });
}

// Metadata + source data the prerender script needs (server bundle only).
export { metaFor, jsonLd, publicRoutes, legalDocs, SITE } from './seo/meta.js';
export { privacyDoc, returnsDoc, termsDoc } from './data/legal.js';
export { products } from './data/content.js';
