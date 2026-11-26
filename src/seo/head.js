// Keeps <head> in step with the current route in the browser (title, description, canonical,
// robots, Open Graph / Twitter and JSON-LD). The same values are baked into each page's static
// HTML at build time by scripts/prerender.mjs; this keeps them right after client-side navigation.
import { jsonLd } from './meta.js';

function upsert(selector, create) {
  let el = document.head.querySelector(selector);
  if (!el) { el = create(); document.head.appendChild(el); }
  return el;
}
const setMeta = (attr, key, value) => {
  const el = upsert(`meta[${attr}="${key}"]`, () => { const m = document.createElement('meta'); m.setAttribute(attr, key); return m; });
  el.setAttribute('content', value);
};

export function applyHead(m) {
  document.title = m.title;
  setMeta('name', 'description', m.description);
  setMeta('name', 'robots', m.robots);
  setMeta('property', 'og:title', m.ogTitle || m.title);
  setMeta('property', 'og:description', m.description);
  setMeta('property', 'og:type', m.ogType || 'website');
  setMeta('name', 'twitter:title', m.ogTitle || m.title);
  setMeta('name', 'twitter:description', m.description);
  if (m.image) { setMeta('property', 'og:image', m.image); setMeta('name', 'twitter:image', m.image); }

  const canonical = document.head.querySelector('link[rel="canonical"]');
  if (m.canonical) {
    upsert('link[rel="canonical"]', () => { const l = document.createElement('link'); l.rel = 'canonical'; return l; }).href = m.canonical;
    setMeta('property', 'og:url', m.canonical);
  } else canonical?.remove();

  const data = jsonLd(m);
  const ld = document.getElementById('seo-ld');
  if (data) {
    upsert('#seo-ld', () => { const s = document.createElement('script'); s.id = 'seo-ld'; s.type = 'application/ld+json'; return s; })
      .textContent = JSON.stringify(data);
  } else ld?.remove();
}
