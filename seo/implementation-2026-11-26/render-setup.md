# Render setup to activate the per-page HTML

**Owner:** site owner (Render dashboard) · **Status:** pending. Nothing below is live until it is done.

## Why this is needed

The build now writes each page's crawler-readable HTML to `dist/_p/<page>.html`, for example `dist/_p/shop.html`. The files sit in `/_p/` on purpose. Render's docs don't say how it treats a folder or file whose name matches a page address (it might redirect `/shop` to `/shop/`). Keeping the files out of the page addresses means today's behaviour cannot change. Each rewrite rule below tells Render to answer `/shop` with `/_p/shop.html`, and the address bar keeps showing `/shop`.

## Step 0: confirm Render deploys this repo

On 2026-11-26 the live homepage was serving content that is not in this repo's history. Live shows Origin from ₹1,599; this repo shows ₹1,999. In Render → your static site → **Settings**, check all of these:

- the **Repository** is `primalone-admin/primalone` and the **Branch** is `main`
- **Auto-Deploy** is on
- the **Build Command** is `npm ci && npm run build` (or `npm install && npm run build`)
- the **Publish Directory** is `dist`

## Step 1: add these rules (Redirects/Rewrites → Add Rule)

All of them have the Action **Rewrite**. Render checks rules from the top, so these must sit **above** the existing `/*` → `/index.html` rule.

| Source | Destination | Action |
|---|---|---|
| `/shop` | `/_p/shop.html` | Rewrite |
| `/products/origin` | `/_p/products/origin.html` | Rewrite |
| `/products/restore` | `/_p/products/restore.html` | Rewrite |
| `/sequence` | `/_p/sequence.html` | Rewrite |
| `/science` | `/_p/science.html` | Rewrite |
| `/about` | `/_p/about.html` | Rewrite |
| `/journal` | `/_p/journal.html` | Rewrite |
| `/journal/why-sequencing-beats-stacking` | `/_p/journal/why-sequencing-beats-stacking.html` | Rewrite |
| `/journal/the-morning-window-and-breakfast` | `/_p/journal/the-morning-window-and-breakfast.html` | Rewrite |
| `/journal/evening-recovery-without-a-sleep-drug` | `/_p/journal/evening-recovery-without-a-sleep-drug.html` | Rewrite |
| `/journal/what-forever-daily-actually-means` | `/_p/journal/what-forever-daily-actually-means.html` | Rewrite |
| `/contact` | `/_p/contact.html` | Rewrite |
| `/shipping` | `/_p/shipping.html` | Rewrite |
| `/returns` | `/_p/returns.html` | Rewrite |
| `/privacy` | `/_p/privacy.html` | Rewrite |
| `/terms` | `/_p/terms.html` | Rewrite |
| `/*` | `/index.html` | Rewrite *(already there; keep it last)* |

The homepage `/` needs no rule.

**When you publish a new journal article,** add one more rule of the same shape. Until you do, that article still works for visitors, but crawlers get the homepage HTML for it.

## Step 2 (optional): keep Markdown copies out of Google's results

Under **Headers**, add: Path `/md/*`, Name `X-Robots-Tag`, Value `noindex`. AI tools can still read the Markdown pages, but Google won't list them as duplicates of the real pages.

## Check that it worked

```
curl -sI https://primalone.in/shop          # expect 200 and no "location:" header
curl -s https://primalone.in/shop | grep -o '<link rel="canonical"[^>]*>'
#   expect: <link rel="canonical" href="https://primalone.in/shop">
curl -s https://primalone.in/sitemap.xml | head -3   # expect XML, not HTML
curl -s https://primalone.in/llms.txt | head -3
```

## Rollback

Delete the rules above. Every page then falls back to `/index.html`, exactly as it does today.
