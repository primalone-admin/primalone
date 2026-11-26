// Runs after `vite build` (client) and `vite build --ssr src/entry-server.jsx` (server bundle).
//
// For every public route it writes a static HTML file with the full page text and that page's
// own <title>, description, canonical, Open Graph and JSON-LD, so search engines and AI crawlers
// that don't run JavaScript can read the site. Visitors still get the live app: the static copy
// is hidden by #prerender-hide until React mounts (see src/main.jsx).
//
// Output (all inside dist/):
//   index.html               the homepage (also Render's fallback for every other URL)
//   _p/<route>.html          every other public page; Render rewrite rules map /shop -> /_p/shop.html
//                            (kept out of the route paths so no folder like dist/shop/ ever exists)
//   sitemap.xml              every public URL
//   llms.txt, sitemap.md     plain-language guides for AI tools, pointing to the Markdown pages
//   md/<route>.md            Markdown version of each public page, made from the same render
//
// The build fails (and nothing deploys) if a page can't render or metadata is incomplete.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';

const DIST = 'dist';
const SSR = '.ssr-build/entry-server.js';

// The app reads saved carts/sessions from localStorage during render; the build has none.
globalThis.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };
// React warns that useLayoutEffect is a no-op on the server; that's expected here.
const warn = console.error;
console.error = (msg, ...rest) => { if (!String(msg).includes('useLayoutEffect does nothing on the server')) warn(msg, ...rest); };

const ssr = await import(pathToFileURL(SSR).href);
const { render, metaFor, jsonLd, publicRoutes, legalDocs, SITE } = ssr;

const fail = (msg) => { console.error(`prerender: ${msg}`); process.exit(1); };

// Policy summaries are copied into src/seo/meta.js to keep the bundle small; stop if they drift.
for (const [slug, doc] of Object.entries({ privacy: ssr.privacyDoc, returns: ssr.returnsDoc, terms: ssr.termsDoc })) {
  for (const key of ['kind', 'title', 'lead']) {
    if (legalDocs[slug][key] !== doc[key]) fail(`src/seo/meta.js legalDocs.${slug}.${key} no longer matches src/data/legal.js`);
  }
}

const template = readFileSync(join(DIST, 'index.html'), 'utf8');
if (!template.includes('<!--seo:start') || !template.includes('<!--app-->')) fail('dist/index.html is missing the <!--seo:start--> or <!--app--> markers');

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const mdPath = (route) => (route === '/' ? '/md/index.md' : `/md${route}.md`);

function headFor(m, route) {
  const ld = jsonLd(m);
  return [
    `<title>${esc(m.title)}</title>`,
    `<meta name="description" content="${esc(m.description)}">`,
    `<meta name="robots" content="${m.robots}">`,
    `<link rel="canonical" href="${m.canonical}">`,
    `<link rel="alternate" type="text/markdown" href="${mdPath(route)}" title="Markdown version">`,
    '<meta name="theme-color" content="#14261b">',
    `<meta property="og:type" content="${m.ogType}">`,
    '<meta property="og:site_name" content="PrimalOne">',
    '<meta property="og:locale" content="en_IN">',
    `<meta property="og:url" content="${m.canonical}">`,
    `<meta property="og:title" content="${esc(m.ogTitle)}">`,
    `<meta property="og:description" content="${esc(m.description)}">`,
    `<meta property="og:image" content="${m.image}">`,
    '<meta property="og:image:width" content="1200">',
    '<meta property="og:image:height" content="630">',
    '<meta name="twitter:card" content="summary_large_image">',
    `<meta name="twitter:title" content="${esc(m.ogTitle)}">`,
    `<meta name="twitter:description" content="${esc(m.description)}">`,
    `<meta name="twitter:image" content="${m.image}">`,
    // JSON in a script tag: escape "<" so text like "</script>" can't end it early
    `<script type="application/ld+json" id="seo-ld">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>`,
    // hide the static copy until the app mounts, so visitors see no change (removed in src/main.jsx)
    '<style id="prerender-hide">#root{visibility:hidden}</style>',
  ].join('\n');
}

// ---------- HTML -> Markdown (for the app's own, well-formed render output) ----------
const decode = (s) => s
  .replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&nbsp;/g, ' ').replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d)).replace(/&amp;/g, '&');

function toMarkdown(html) {
  let s = html.slice(html.indexOf('<main'), html.lastIndexOf('</main>'));
  s = s
    .replace(/<(svg|script|style|video|noscript|template)\b[\s\S]*?<\/\1>/g, '')
    .replace(/<(input|textarea|select)\b[\s\S]*?(\/>|<\/\1>)/g, '')
    .replace(/<img\b[^>]*>/g, '')
    // keep words apart where inline elements sit side by side ("30 days" + "₹3,499")
    .replace(/<\/(span|b|strong|em|small)>(?=<(span|b|strong|em|small)\b)/g, '</$1> ')
    .replace(/<br\s*\/?>/g, '\n')
    .replace(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/g, (_, n, t) => `\n\n${'#'.repeat(+n)} ${t.replace(/<[^>]+>/g, '').trim()}\n\n`)
    .replace(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g, (_, href, t) => {
      const text = t.replace(/<[^>]+>/g, '').trim();
      if (!text) return '';
      const url = href.startsWith('/') ? SITE + href : href;
      return url.startsWith('http') ? `[${text}](${url})` : text;
    })
    .replace(/<(b|strong)\b[^>]*>([\s\S]*?)<\/\1>/g, (_, _t, t) => (t.trim() ? `**${t.trim()}**` : ''))
    .replace(/<li\b[^>]*>/g, '\n- ')
    .replace(/<\/(p|div|section|header|footer|article|aside|ul|ol|li|dl|dt|dd|tr|table|figure|figcaption|summary|details|blockquote|button|label|form)>/g, '\n')
    .replace(/<(dt|summary)\b[^>]*>/g, '\n')
    .replace(/<[^>]+>/g, '');
  return decode(s)
    .split('\n').map((l) => l.replace(/[ \t]+/g, ' ').trim()).join('\n')
    .replace(/^-\s*$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// ---------- render every public route ----------
const pages = [];
for (const route of publicRoutes) {
  const m = metaFor(route);
  if (!m.canonical || !m.title || !m.description) fail(`incomplete metadata for ${route}`);
  if (!existsSync(join(DIST, new URL(m.image).pathname))) fail(`share image missing for ${route}: ${m.image} (run node scripts/og-images.mjs)`);
  let app;
  try { app = await render(route); } catch (e) { fail(`could not render ${route}: ${e.message}`); }
  if (!app.includes('<main')) fail(`${route} rendered without a <main> element`);

  let html = template
    .replace(/<!--seo:start[\s\S]*?<!--seo:end-->/, headFor(m, route))
    .replace('<!--app-->', app);
  // the hero image preload only helps the homepage
  if (route !== '/') html = html.replace(/<link rel="preload" as="image"[^>]*>\n?/, '');

  const file = route === '/' ? join(DIST, 'index.html') : join(DIST, '_p', `${route.slice(1)}.html`);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, html);

  const md = `# ${m.title}\n\n> ${m.description}\n\nCanonical page: ${m.canonical}\n\n${toMarkdown(app)}\n`;
  const mdFile = join(DIST, mdPath(route).slice(1));
  mkdirSync(dirname(mdFile), { recursive: true });
  writeFileSync(mdFile, md);
  pages.push({ route, m, md: mdPath(route) });
}

// ---------- sitemap.xml ----------
writeFileSync(join(DIST, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<!-- PrimalOne public pages. Markdown versions of each page are listed at ${SITE}/sitemap.md and summarised in ${SITE}/llms.txt -->
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map((p) => `  <url><loc>${p.m.canonical}</loc></url>`).join('\n')}
</urlset>
`);

// ---------- llms.txt + sitemap.md ----------
const group = (title, filter) => {
  const rows = pages.filter((p) => filter(p.route));
  return `## ${title}\n\n${rows.map((p) => `- [${p.m.title.replace(/ \| PrimalOne.*$/, '')}](${SITE}${p.md}): ${p.m.description}`).join('\n')}\n`;
};
const sections = [
  group('Products', (r) => r === '/shop' || r.startsWith('/products/')),
  group('How the routine works', (r) => ['/', '/sequence', '/science', '/about'].includes(r)),
  group('Journal', (r) => r.startsWith('/journal')),
  group('Help and policies', (r) => ['/contact', '/shipping', '/returns', '/privacy', '/terms'].includes(r)),
].join('\n');

writeFileSync(join(DIST, 'llms.txt'), `# PrimalOne

> PrimalOne (Primalone Nutrition Pvt Ltd, India) makes two daily supplement powders taken at different times of day: Origin, a morning daily-essentials scoop taken with or after breakfast, and Restore, an optional evening recovery formula. The two are never taken together ("Sequence, don't stack").

Each link below is a Markdown version of a page on ${SITE}, generated from the same build as the HTML page. A full list of pages, with links to both the web page and its Markdown version, is at ${SITE}/sitemap.md. Product information here is general and is not medical advice.

${sections}`);

writeFileSync(join(DIST, 'sitemap.md'), `# PrimalOne site map

Every public page on ${SITE}, with its Markdown version. The XML sitemap is ${SITE}/sitemap.xml; an overview for AI tools is ${SITE}/llms.txt.

| Page | Web page | Markdown |
|---|---|---|
${pages.map((p) => `| ${p.m.title.replace(/\|/g, '–')} | ${p.m.canonical} | ${SITE}${p.md} |`).join('\n')}
`);

// ---------- Google Merchant Center product feed (submit only once real payments are live) ----------
const { products } = ssr;
const x = (v) => esc(v);
writeFileSync(join(DIST, 'merchant-feed.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
<channel>
<title>PrimalOne</title>
<link>${SITE}/</link>
<description>PrimalOne products, generated from the same data as the product pages.</description>
${Object.values(products).flatMap((p) => {
  const m = metaFor(`/products/${p.id}`);
  return p.sizes.map((s) => `<item>
  <g:id>${p.id}-${s.days}d</g:id>
  <g:item_group_id>${p.id}</g:item_group_id>
  <g:title>${x(`PrimalOne ${p.name} – ${p.shopTag}, ${s.days}-day pack`)}</g:title>
  <g:description>${x(m.description)}</g:description>
  <g:link>${m.canonical}</g:link>
  <g:image_link>${SITE}/img/${p.image.name}-1600.webp</g:image_link>
  <g:additional_image_link>${SITE}/img/${p.shopImage.name}-1600.webp</g:additional_image_link>
  <g:availability>in_stock</g:availability>
  <g:price>${s.price.toFixed(2)} INR</g:price>
  <g:brand>PrimalOne</g:brand>
  <g:condition>new</g:condition>
  <g:identifier_exists>no</g:identifier_exists>
  <g:size>${s.days}-day pack</g:size>
  <g:shipping><g:country>IN</g:country></g:shipping>
</item>`);
}).join('\n')}
</channel>
</rss>
`);

// ---------- Render rewrite rules: warn when a page has no rule yet ----------
// Each non-home page needs a Render rule "/<page>" -> "/_p/<page>.html" (seo/implementation-2026-11-26/render-setup.md).
try {
  const doc = readFileSync('seo/implementation-2026-11-26/render-setup.md', 'utf8');
  const missing = pages.filter((p) => p.route !== '/' && !doc.includes(`| \`${p.route}\` | \`/_p${p.route}.html\``));
  if (missing.length) console.warn(`prerender: WARNING add these Render rewrite rules (and list them in render-setup.md):\n${missing.map((p) => `  ${p.route} -> /_p${p.route}.html`).join('\n')}`);
} catch { /* doc not present in this checkout */ }

console.log(`prerender: ${pages.length} pages, sitemap.xml, llms.txt, sitemap.md, merchant-feed.xml and ${pages.length} Markdown pages written`);
