# primalone.in: SEO / AEO / GEO audit

**Status:** provisional. This audit uses only public evidence. Search Console, analytics, and backlink data were not available.
**Date of evidence:** 2026-11-26 · **Scope:** `https://primalone.in` (public storefront, en-IN). Admin and account areas were reviewed only for crawl exposure.
**Evidence:** live `curl` captures in `raw/`, plus the source in this repo (`index.html`, `src/App.jsx`, `src/layouts/SiteLayout.jsx`, `src/data/pages.js`).

## 1. Audit charter

| Item | Value |
|---|---|
| Objective | Find out whether search engines and AI answer engines can find, understand, and correctly attribute PrimalOne's pages |
| Business | D2C supplement brand, India, 2 products (Origin, Restore), plus a journal |
| Templates sampled | Home, shop, product (origin), science, about, journal index, unknown URL |
| Lanes run | Technical (crawl/index/render), on-page metadata, structured data, sitemap/robots, AEO/GEO readiness |
| Lanes not run (no access) | Search Console indexation, analytics traffic, Core Web Vitals field data, backlinks/authority, Google Business Profile, live AI-answer observations |

## 2. How the site looks to a crawler

The site is a client-side React app. Every URL returns **the same 6,208-byte HTML file**, and its body is only `<div id="root"></div>`. All visible text is built by JavaScript in the browser.

- **Google** runs JavaScript, but it does so in a deferred second pass. It also reads the `<head>` it receives first.
- **Most AI crawlers** (GPTBot, ClaudeBot, PerplexityBot and similar) and many link-preview bots **do not run JavaScript**. They see an empty page that says "PrimalOne needs JavaScript enabled to show this page."

## 3. Findings

### Confirmed defects

| # | Severity | Finding | Evidence |
|---|---|---|---|
| F1 | **Critical** | **Every page's canonical points to the homepage.** `/shop`, `/science`, `/products/origin` and every other page serve `<link rel="canonical" href="https://primalone.in/">`. Nothing in the app changes it per page. This tells Google that each inner page is a duplicate of the homepage, so the inner pages are likely to be folded into the homepage instead of indexed on their own. | `raw/home.html` (served byte-identical at every path, confirmed by matching sizes); `index.html`; no canonical logic in `src/` |
| F2 | **Critical** | **Same title, description, OG and Twitter tags on every URL in the raw HTML.** `SiteLayout.jsx` changes `document.title` after JavaScript runs, but it never changes the description, canonical, or `og:*` tags. Shares of `/products/origin` on WhatsApp, LinkedIn or X show the homepage card. | `src/layouts/SiteLayout.jsx:9-37` |
| F3 | **Critical (AEO/GEO)** | **No server-rendered content.** AI crawlers that don't run JavaScript get no product facts, ingredients, journal articles, or answers. The FAQ JSON-LD in `<head>` is the only content they can read. | `raw/home.html` body |
| F4 | High | **No XML sitemap.** `/sitemap.xml` returns the homepage HTML with status 200. `robots.txt` has no `Sitemap:` line. | live capture: `/sitemap.xml → 200 text/html 6208B` |
| F5 | High | **Soft 404s.** Any made-up URL (for example `/this-page-does-not-exist-xyz`) returns 200 and then redirects to `/` in the browser. Search engines may index junk URLs as copies of the homepage. | live capture; `App.jsx` `path="*" → Navigate to "/"` |
| F6 | Medium | **Private areas are not excluded from crawling.** `/admin/*`, `/account/*` and `/checkout` are allowed by `robots.txt` and carry no `noindex`. They contain no secrets in the HTML, but crawlers don't need them. | `raw/robots.txt` = `Allow: /` |
| F7 | Medium | **Structured data is homepage-only and generic.** The homepage `Product` entries have no `url`, `sku`, or per-pack `Offer`, and nothing ties them to the product pages. Journal articles have no `Article` markup. There is no `BreadcrumbList`. | `index.html` JSON-LD |

### Working correctly

- HTTPS is enforced. `http://` and `www.` both 301-redirect to `https://primalone.in/` (www adds one extra hop).
- `lang="en-IN"` and `og:locale=en_IN` are set. The homepage title and description are good and specific.
- The homepage has Organization, Product ×2 and FAQPage JSON-LD.
- Each page template has exactly one real `<h1>` (Hero, Shop, Science, Sequence, Journal, Contact, product and article pages).
- Images are served as responsive WebP, with the hero preloaded. `og-image.jpg` is 1200×630.
- `robots.txt` does not block any bot, including AI crawlers. GPTBot and Googlebot get a 200.
- Deep links now resolve (200) after the Render rewrite rule.

### Opportunities (supported, not defects)

- **O1. Journal = your AEO/GEO asset.** There are 4 articles in `src/data/pages.js` ("Why Sequencing Beats Stacking", etc.). Once crawlers can read them as HTML (with author, date, and sources), they are the pages most likely to be quoted by answer engines.
- **O2. Science page.** This page could carry specific, cited ingredient doses and studies. Specific, attributable facts are what AI answers cite.
- **O3. `llms.txt` + Markdown page versions.** These are optional, owner-chosen discovery aids, not a ranking factor. They are not present today (`/llms.txt` → 404). Worth adding only after F1–F4 are fixed.
- **O4. FAQ rich results.** Google currently shows FAQ rich results only for government and health sites, so the FAQPage markup is unlikely to produce a SERP feature. It is still useful as machine-readable Q&A.

### Unknown (needs access)

- How many pages Google has actually indexed. Check Search Console → Pages, or search `site:primalone.in` as a rough check.
- Traffic, queries, and impressions (Search Console and analytics).
- Backlinks and brand mentions, Google Business Profile, and Core Web Vitals field data.
- Whether ChatGPT, Perplexity, or Gemini currently mention or cite PrimalOne. This needs a defined query set and repeated observation.

### Compliance note (not a ranking claim)

Supplement health claims are scrutinised by search engines and by Indian regulators (FSSAI/ASCI). The site already includes a "not evaluated by regulatory authorities" disclaimer, which is good. Any new answer-style content should keep that standard.

## 4. Root cause and recommended fix

F1, F2, F3, F4 and F5 share one cause: **the site ships one empty HTML shell for every URL.** Because all page content already lives in static files (`src/data/*.js`), the fix is **build-time prerendering (static site generation)**:

1. At build time, render each public route to its own HTML file, with the full page text plus a per-page `<title>`, description, canonical, OG tags and JSON-LD. The URLs stay clean (`/shop`, not `/shop/index.html`); Render's rewrite rule keeps serving them.
2. Generate `sitemap.xml` from the same route list (public routes plus the 4 journal slugs), and add `Sitemap: https://primalone.in/sitemap.xml` to `robots.txt`.
3. Return a real 404 page for unknown URLs instead of redirecting to `/`.
4. Add `Disallow: /admin` and `Disallow: /account`, plus `noindex` on checkout, account and admin.
5. Add per-page JSON-LD: Product (with `url` and offers) on product pages, Article (with author and date) on journal pages, and BreadcrumbList.
6. After these ship, submit the sitemap in Google Search Console and Bing Webmaster Tools, and use URL Inspection on `/shop` and the product pages.

Possible tools: `vite-react-ssg`, or a small Puppeteer/`react-dom/server` prerender script run after `vite build`. Either way, the scope is one build step plus a per-route head-tags helper. This is **pending your approval**; nothing has been changed.

## 5. Ownership and priority

| Priority | Item | Owner | Effort |
|---|---|---|---|
| P0 | F1 + F2 + F3: prerender + per-page head tags | Dev | 1–2 days |
| P0 | F4: sitemap.xml + robots `Sitemap:` line | Dev | hours |
| P1 | F5: real 404 · F6: robots/noindex for private areas | Dev | hours |
| P1 | Verify Search Console + Bing Webmaster ownership; submit sitemap | Site owner | 30 min |
| P2 | F7: per-page structured data | Dev | half day |
| P2 | O1/O2: expand journal & science with cited, specific content | Content | ongoing |
| P3 | O3: llms.txt + Markdown versions | Dev | after P0 |

## 6. Limitations

- Public evidence only. No indexation, traffic, or AI-citation data was observed, so nothing here measures rankings or traffic.
- The rendered (JavaScript-executed) page was assessed from source code, not with a headless browser.
- The URL sample covers each template, not every URL.
