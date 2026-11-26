# Agentic readiness: agent journeys and task verification

**Date:** 2026-11-26 · **Status:** provisional (local build + agent-style trace; no live run, no formal findings bundle)
**Environment:** local production build (`npm run build`), served with Render-equivalent routing; source in `src/`. The live site was not used for transactional tests.

## Task contracts

| ID | Task | Actor / authorisation | Allowed | Prohibited | Success state | Irreversible step |
|---|---|---|---|---|---|---|
| T1 | "What's in Restore, when do I take it, what does it cost?" | Any AI agent, public read | Read `/llms.txt`, Markdown pages, HTML pages | Any state change | Correct ingredients, timing, price and safety note, each with a source URL | none |
| T2 | "Add Origin 30-day to my cart" | Agent acting for a shopper, in the shopper's browser | Choose a pack, add it to the cart, open the cart | Checkout and payment | The cart drawer shows Origin 30-day at ₹3,499 | none |
| T3 | "Place my order" | Shopper, with explicit human confirmation | Sign in, choose an address, choose payment | Skipping the human confirmation, storing card data | Order confirmation with an order number | Payment (when live) |

## Task verification

### T1: knowledge task. Result: **completes on the local build; not live yet**
- **Path:** `/llms.txt` → *Products* → `/md/products/restore.md`. That page gives glycine (3 g), NAC (600 mg), magnesium, KSM-66 ashwagandha and myo-inositol; "30–60 minutes before bed"; 30 days ₹3,999 and 15 days ₹2,299; and "Consult a physician if pregnant, nursing, or on medication."
- The HTML page (`/_p/products/restore.html`) carries the same facts plus Product/Offer JSON-LD with the same prices.
- **Blocker:** none of this is live until deploy and the Render rules ([../implementation-2026-11-26/render-setup.md](../implementation-2026-11-26/render-setup.md)). The live site today gives a non-JavaScript agent an empty page.

### T2: cart task. Result: **completes on the local build (verified with an agent-style run)**
- **Method:** headless Chrome driven only through the accessibility tree (role + accessible name), the way a browser agent perceives the page. Full trace: [evidence/t2-trace.txt](evidence/t2-trace.txt). End-state screenshot: [evidence/t2-cart.png](evidence/t2-cart.png).
- **Trace:**
  1. Opened `/products/origin`.
  2. Found the heading "Origin" and the radiogroup "Pack size" with "30 DAYS ₹3,499" (checked) and "15 DAYS ₹1,999".
  3. Chose 30 days.
  4. Clicked the button "Add to cart ₹3,499".
  5. The dialog "Your cart 1" opened, containing "Origin 30-day pack · Morning ₹3,499".
- Interactive controls without an accessible name on that screen: **0**.
- Supporting semantics in source: `role="radiogroup"`/`role="radio"`+`aria-checked` (`src/components/Shop.jsx:73`, `src/pages/ShopPage.jsx:26`, `src/pages/ProductDetail.jsx:52`); the cart is a `role="dialog"` with `aria-modal`, and the quantity buttons have specific names (`src/components/CartDrawer.jsx`).
- **The cart also shows "TO CONFIRM"** next to the 10% bundle offer, so the unconfirmed-offer issue reaches the purchase path.
- **Still to do:** repeat on the live site once it is deployed (roadmap D1/D2).

### T3: order task. Result: **blocked: checkout is a demo**
- `src/services/store.js` says *"DEMO BACKEND … no payment is taken"* (`DEMO_MODE = true`). Orders are saved only in the visitor's own browser.
- Good foundations are in place: address fields use correct `autocomplete` values (name, tel, address-line1/2, address-level1/2, postal-code), payment choice is a labelled radio group, errors use `role="alert"`, and "Place order" is a deliberate, explicit button.
- **Must hold when payment goes live:** payment and confirmation stay with the human. That means a payment-gateway confirmation step, no saved card data, and an order summary showing the price before payment.

## Other findings for agents and shoppers

| Finding | Evidence | Owner |
|---|---|---|
| Visible **"To confirm"** review tags (for example the bundle "save 10%" rate, marked `tbc: true`) appear on `/shop` and `/contact` | `src/data/content.js:6,121`; build output | Business owner, then content |
| No agent commerce protocol (ACP/UCP/MCP). **Correct for now:** there is no real order backend and no documented consumer | n/a | Deferred |

## Limitations
T2 was run on the local build, not live. One page and one browser size (1366×900, desktop) were tested; mobile was not. No claim is made that any agent uses this site.
