# SEO / AEO / GEO fixes: delivery summary

**Date:** 2026-11-26 · **Status:** implemented locally and verified locally. **Not yet live:** it needs a commit and deploy, plus the Render rules in [render-setup.md](render-setup.md).
**Scope:** the user authorised metadata and technical fixes only. Visible page content must not change.
**Source audit:** [../audit-2026-11-26/site-audit.md](../audit-2026-11-26/site-audit.md)

## What changed

| Audit finding | Fix | Files |
|---|---|---|
| F1: every page's canonical pointed to the homepage | Each page has its own canonical, in the static HTML and kept in sync in the browser | `src/seo/meta.js`, `src/seo/head.js`, `src/layouts/SiteLayout.jsx` |
| F2: same title, description and social card on every URL | Each page has its own title, description, OG and Twitter tags | same |
| F3: empty HTML; AI crawlers saw nothing | Build-time prerender: 17 public pages written as full HTML (77–8,970 words each) | `src/entry-server.jsx`, `scripts/prerender.mjs`, `src/App.jsx` (router split out), `package.json` build |
| F4: no sitemap | `sitemap.xml` with 17 URLs; `Sitemap:` line added to robots.txt | `scripts/prerender.mjs`, `public/robots.txt` |
| F5: soft 404s | Unknown URLs now carry `noindex` in the browser. They still redirect to `/` as before (visible behaviour kept). A real 404 status would need Render-side changes. | `src/seo/meta.js` |
| F6: private areas crawlable | robots.txt disallows `/admin`, `/account`, `/checkout` and `/_p/`; those screens get `noindex, nofollow` | `public/robots.txt`, `src/seo/meta.js` |
| F7: thin or stale structured data | Per-page JSON-LD built from the same data the pages display: Organization (+ socials, email), WebSite, Product with one Offer per pack (₹ prices taken from `content.js`), FAQPage matching the visible FAQs, BlogPosting, Blog, BreadcrumbList, ContactPage, AboutPage | `src/seo/meta.js` |
| *New:* structured data didn't match the page | The old hard-coded JSON-LD in `index.html` was deleted. Its prices and FAQ answers disagreed with the visible page (e.g. a "Subscribe & Save 5%" answer that the page doesn't give). The data is now generated, so it can't drift. | `index.html` |
| Markdown discovery (O3) | `/llms.txt`, `/sitemap.md` and a Markdown version of every public page at `/md/...`, generated from the same render as the HTML. Each page links to its version with `<link rel="alternate" type="text/markdown">`. | `scripts/prerender.mjs` |

## How visible content stays unchanged

- The static HTML is hidden (`#root{visibility:hidden}`) until React mounts, then the hiding style is removed (`src/main.jsx`). Visitors see the same live app as before, with no static copy flashing first.
- **Verified:** a headless Chrome comparison of the old build (HEAD `c5501fe`) against the new build, served the way Render serves them, found **identical visible text on all 15 routes tested**. That covered home, shop, both products, sequence, science, about, journal, one article, contact, shipping, privacy, account sign-in, checkout and an unknown URL. On every route the hiding style was gone after the app mounted. A screenshot of `/shop` looked normal.
- The one code change outside SEO files: `LegalPage.jsx` reads the screen width only when `window` exists, so it can render at build time. Behaviour in the browser is the same.
- `legal.js` (~140 KB) stays out of the main bundle. The policy summaries are copied into `meta.js`, and the build fails if they drift from `legal.js`.

## Safety

- If any page fails to render, or its metadata is incomplete, `npm run build` fails, so a broken build can't deploy.
- The new HTML files live in `/_p/`, never at page addresses, so Render's current handling of `/shop` etc. cannot change until you add the rules.
- **Rollback:** revert the commit. Removing the Render rules alone also returns every page to the current behaviour.

## Still open

| Item | Owner | Why |
|---|---|---|
| **Render may not be deploying this repo.** The live homepage shows ₹1,599 / ₹1,099 prices; this repo has never contained them. | Site owner | Pushed changes may not be reaching the live site. See [render-setup.md](render-setup.md) step 0 |
| Add the Render rewrite rules | Site owner | Turns on per-page HTML for crawlers |
| Verify the site in Google Search Console and Bing Webmaster Tools; submit `sitemap.xml` | Site owner | Requires owner access; not done by me |
| Article dates and authors | Content | Articles carry no publish date, so none was invented. Adding real dates helps freshness signals. |
| Journal and science depth with cited sources | Content | The main lever for AI citations; changes visible content, so out of scope here |
| Product-page OG images | Dev, optional | All pages share `og-image.jpg`; per-product 1200×630 JPGs would make better share cards |

## Skill coverage (27-skill screen, condensed)

**Run:**
- seo-audit
- seo-technical (rendering, canonical, robots, sitemap, llms.txt)
- seo-page and seo-content (titles and descriptions from existing copy only)
- seo-schema
- seo-sitemap
- seo-architecture (route inventory, breadcrumbs)
- seo-commerce (Product/Offer price parity with the page)
- seo-geo (entity consistency: one Organization `@id` and matching facts)
- seo-aeo (FAQ structured data matches the visible Q&A)
- optimise-seo (implementation)

**Not applicable:**
- seo-hreflang (single locale en-IN)
- seo-local (no storefront)
- seo-video (no watch pages)
- seo-news-discover (not a publisher)
- seo-programmatic (no scaled templates)
- seo-competitor-pages (no comparison pages requested)
- seo-images (alt text is visible-adjacent; existing alts unchanged)
- seo-agentic (checkout flow unchanged)

**Blocked (no access):**
- seo-performance (Search Console, analytics)
- ai-visibility-monitor
- ai-search-research (no query corpus or engine observations)
- seo-research (no keyword data)
- seo-authority (backlink data)

**Deferred:** seo-action-plan and seo-plan; the open items above serve as the plan.

This coverage handoff is **provisional**: the formal orchestration ledger script was not run.

No ranking, indexing or AI-citation outcome is claimed. Deployment and sitemap submission don't guarantee crawling, indexing or citations.
