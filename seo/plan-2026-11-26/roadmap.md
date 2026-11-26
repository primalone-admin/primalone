# PrimalOne search, AI-answer and agent roadmap

**Date:** 2026-11-26 · **Status:** proposed, awaiting owner approval
**Goal:** make PrimalOne findable, correctly described and easy to buy from, in Google/Bing, in AI answers (ChatGPT, Perplexity, Gemini, Claude) and for shopping agents.
**Market:** India, en-IN, adults buying daily supplement powders. **Risk class:** health/supplement (YMYL), so claims need careful review.
**Inputs:** [audit](../audit-2026-11-26/site-audit.md) · [delivery](../implementation-2026-11-26/delivery-summary.md) · [agentic readiness](agent-journey.md) · [dependencies](dependencies.md)

There are no calendar dates: nobody has supplied an owner capacity plan. Work is ordered by **gates**; each gate opens only when the one before it is verified. No ranking, traffic, citation or sales outcome is promised. Each item lists what can be **measured**, not what will be **achieved**.

## Done so far (2026-11-26, local build; goes live with Gate 0)

| Roadmap item | What was made | Where |
|---|---|---|
| A2 (share images) | 1200×630 share images for Origin, Restore and each journal article, wired into `og:image`/`twitter:image`. The build fails if one is missing. Regenerate with `node scripts/og-images.mjs`. | `public/og/`, `src/seo/meta.js` |
| C1 (AI baseline) | 29 fixed questions × 4 engines, with a run guide and log sheet. **Run it before deploying** to capture the "before" picture. | [ai-answer-baseline.md](ai-answer-baseline.md), [ai-baseline-log.csv](ai-baseline-log.csv) |
| C3 (keep in sync) | The build warns when a public page has no Render rule listed in render-setup.md | `scripts/prerender.mjs` |
| D2 (cart, local) | Agent-style accessibility-tree run: pack chosen, added to cart, cart verified; 0 unnamed controls | [agent-journey.md](agent-journey.md), `evidence/` |
| 1.3 (feed, prepared) | `merchant-feed.xml`: 4 items (2 products × 2 packs) built from the same prices as the pages. **Do not submit until real payments work (Gate 1).** | `dist/merchant-feed.xml`, `scripts/prerender.mjs` |

**Still needs you:** everything in Gate 0 except 0.2 (I can commit and deploy when you say so), the business decision on "To confirm" tags (0.5), Gate 1 (payment provider choice), real article dates and a named reviewer (A2, B2), and running the AI baseline (C1).

---

## Gate 0: get the fixes live (blocks everything)

| # | Action | Owner | Acceptance | Verify | Rollback |
|---|---|---|---|---|---|
| 0.1 | Confirm Render deploys `primalone-admin/primalone` `main` (live prices ₹1,599/₹1,099 are not in this repo) | Site owner | Live homepage shows the repo's prices | `curl -s https://primalone.in/ \| grep lowPrice` | n/a |
| 0.2 | Commit and deploy the SEO build | Dev | Render build succeeds | Render deploy log | Revert commit |
| 0.3 | Add the 16 rewrite rules ([render-setup.md](../implementation-2026-11-26/render-setup.md)) | Site owner | `/shop` returns 200 with its own canonical, no redirect | curl checks in render-setup.md | Delete the rules |
| 0.4 | Verify Google Search Console + Bing Webmaster Tools; submit `sitemap.xml` | Site owner | 17 URLs submitted | GSC → Sitemaps | n/a |
| 0.5 | Resolve or remove the visible **"To confirm"** tags (bundle rate etc.) | Business owner | No "To confirm" text on public pages | `grep "To confirm" dist/` | Restore the tag |

**Gate 0 exit:** all five checks pass. Start a baseline of 28 days of Search Console data (indexed pages, queries, impressions, clicks).

## Gate 1: make buying real (blocks commerce and agent tasks)

| # | Action | Owner | Acceptance | Verify |
|---|---|---|---|---|
| 1.1 | Connect a real order backend and payment gateway (replace the `store.js` demo) | Dev + business | A real test order is paid and confirmed, with an order number and email | Test order end-to-end |
| 1.2 | Keep payment human-confirmed: gateway confirmation step, price shown before pay, no stored card data | Dev | Checklist in [agent-journey.md § T3](agent-journey.md#t3-order-task-result-blocked-checkout-is-a-demo) | Manual walkthrough |
| 1.3 | Google Merchant Center free listings: product feed (price, availability, GTIN/MPN if any), shipping and returns policies | Business + dev | Feed approved, no price mismatches with the page | Merchant Center diagnostics |

## Track A: nearer-term capture and defence (starts after Gate 0)

| # | Action | Owner | Measure |
|---|---|---|---|
| A1 | **Brand-query defence:** keep name, logo, description and links identical on the site, Instagram, LinkedIn and X; claim a Google Business Profile only if a real address is public | Marketing | GSC "primalone" query: position and CTR; brand knowledge panel present or absent |
| A2 | **Product pages:** per-product 1200×630 share images; real publish dates and named author/reviewer on journal articles | Content + dev | Search Console enhancements report shows no Product or Article errors |
| A3 | **Snippet tuning:** after 28 days, rewrite titles and descriptions for pages with impressions but low CTR | SEO | CTR by page, like-for-like windows |
| A4 | **Reviews:** collect real verified-buyer reviews, then add review markup. Never invent ratings. | Business | Count of verified reviews; markup validity |

## Track B: category / head-term leadership (foundation starts now, runs long)

The target families below are **hypotheses**. No keyword-volume data was available, so `seo-research` must confirm volume and intent with real India data before content is written.

| Candidate family (to validate) | Canonical owner page | Gap today | Foundation work |
|---|---|---|---|
| greens / daily-essentials powder India | `/products/origin` | No authority, no ingredient depth | Ingredient explainer pages (omega-3, D3+K2, probiotic, PHGG) with cited studies |
| evening recovery / magnesium + glycine / ashwagandha (KSM-66) | `/products/restore` | Same | Ingredient pages for glycine, NAC, KSM-66, myo-inositol, each with doses and sources |
| "how to take supplements" / timing / stacking | `/sequence`, `/journal` | 4 short articles, no dates or sources | Deeper, dated, cited articles; one canonical page per question (no overlap) |

| # | Action | Owner | Measure |
|---|---|---|---|
| B1 | Keyword and intent research with real data (GSC after Gate 0 + a keyword tool) | SEO | Approved query-to-page map |
| B2 | **E-E-A-T for a health brand:** named nutrition or medical reviewer, credentials and an editorial policy page | Business + content | Reviewer shown on science and journal pages |
| B3 | Science hub + ingredient pages (cited, FSSAI/ASCI-safe wording; claims reviewed) | Content + compliance | Pages indexed; impressions for ingredient queries |
| B4 | Authority: earn mentions and links (founder story, Indian health/fitness press, expert contributions; no paid link schemes) | Marketing | Referring domains (from GSC links report or a backlink tool) |

## Track C: AI answers (AEO/GEO)

| # | Action | Owner | Measure |
|---|---|---|---|
| C1 | **Baseline before more changes:** a fixed list of ~30 real buyer questions (e.g. "best greens powder in India", "can I take ashwagandha with magnesium") asked in ChatGPT, Perplexity, Gemini and Copilot. Record whether PrimalOne is mentioned or cited and whether the facts are right. | SEO | Mention rate, citation rate and accuracy per engine. These are observations, not causal proof. |
| C2 | Answer-first blocks on science and journal pages: a direct 1–2 sentence answer, then the evidence (visible-content change, needs approval) | Content | Same question set, re-run after 6–8 weeks |
| C3 | Keep `llms.txt` and the Markdown pages in sync (automatic at build); add new journal posts to the Render rules | Dev | Build passes; `/llms.txt` lists every public page |
| C4 | Entity consistency: one company description everywhere (site, socials, press, marketplaces) | Marketing | Wrong-fact rate in the C1 re-run |

## Track D: agent readiness

| # | Action | Owner | Prerequisite | Measure |
|---|---|---|---|---|
| D1 | Re-run T1 (knowledge) on the live site | SEO | Gate 0 | Task completes with source URLs |
| D2 | Live click-through of T2 (cart) with a browser agent; capture the accessibility tree | Dev | Gate 0 | Task completes; no unlabeled controls |
| D3 | T3 (order) with human confirmation | Dev | Gate 1 | The agent stops at payment for human approval |
| D4 | Agent commerce protocols (ACP / UCP / MCP) | Dev + business | Gate 1 **and** a real consumer that PrimalOne wants to sell through | Decide then; not before |

## Explicitly not doing

- Fake reviews or ratings, bought links, doorway pages or keyword-stuffed copy.
- Health claims beyond the reviewed copy.
- Protocol work for its own sake.

---

**Approval needed from you:** Gate 0 items (only you can do 0.1, 0.3, 0.4, 0.5) and whether to start Gate 1 (real payments). Tracks A–D proceed in the order shown once their gate is open.
