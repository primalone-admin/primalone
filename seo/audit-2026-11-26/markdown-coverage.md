# Markdown / LLM discovery coverage: primalone.in

**Status:** completed (baseline) · **Date:** 2026-11-26

| Check | Result |
|---|---|
| `/llms.txt` | 404, not present |
| `/sitemap.md` | No real file. Returns the homepage HTML (SPA rewrite) |
| `.md` page versions | None |
| Pages with readable HTML content without JavaScript | **0 of ~19 public pages** (all serve an empty shell) |

## Eligible public pages (from `src/App.jsx`, `src/data/pages.js`)

`/`, `/shop`, `/products/origin`, `/products/restore`, `/sequence`, `/science`, `/about`, `/journal`, the 4 journal articles (`/journal/why-sequencing-beats-stacking`, `/journal/the-morning-window-and-breakfast`, `/journal/evening-recovery-without-a-sleep-drug`, `/journal/what-forever-daily-actually-means`), `/contact`, `/shipping`, `/returns`, `/privacy`, `/terms`.

**Excluded (private):** `/admin/*`, `/account/*`, `/checkout`.

## Assessment

Markdown coverage is 0%. More importantly, HTML coverage for non-JavaScript readers is also 0%. Markdown versions would only help after pages are prerendered (see `site-audit.md` §4). Building them earlier would create a second copy of the content that has to be kept in sync, while the main problem stays unfixed. **Recommendation:** do the prerender first, then generate `llms.txt` and the `.md` page versions from the same build. This is not done; it needs your approval.
