# Roadmap dependencies

**Date:** 2026-11-26 · Companion to [roadmap.md](roadmap.md)

```
Gate 0  deploy source ok → deploy → Render rules → GSC/Bing + sitemap → "To confirm" tags resolved
   │
   ├──► 28-day Search Console baseline ──► A3 snippet tuning, B1 keyword research
   ├──► C1 AI-answer baseline ──► C2 answer-first content ──► C1 re-run
   ├──► D1, D2 agent tests on live site
   └──► A1, A2, B2, B3, C3, C4 (no further blocker)

Gate 1  real backend + payment ──► 1.2 human-confirmed payment ──► 1.3 Merchant Center feed
   │                                                             ──► A4 verified reviews
   └──► D3 order task ──► D4 protocol decision (only with a real consumer)

B1 research ──► B3 ingredient pages ──► B4 authority outreach
B2 named reviewer ──► B3 (health content should not ship without a reviewer)
```

| Item | Depends on | Why |
|---|---|---|
| Everything | 0.1 deploy source | Pushes may not reach the live site today |
| 0.3 Render rules | 0.2 deploy | The `/_p/` files must exist first |
| Any measurement | 0.4 Search Console | No first-party search data exists yet |
| A3, B1 | 28-day baseline | Before/after must compare like-for-like windows |
| C2 | C1 baseline | Otherwise changes in AI answers can't be compared |
| 1.3, A4, D3 | Gate 1 | No real orders → no feed, no verified buyers, no purchase task |
| B3, C2 | B2 reviewer + compliance check | Supplement claims are YMYL and regulated (FSSAI/ASCI) |
| D4 | Gate 1 + documented consumer | Protocol support without orders or a buyer channel has no use |

**Owners** (to be named by you): Site owner (Render, Search Console, approvals) · Dev · Content · Business/Compliance · Marketing.
