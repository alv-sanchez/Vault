---
epic: BMS-4997
title: Call Center Order Visibility [REQ-070]
domain: eCommerce
sprint: Sprint 10
status: mostly-already-shipped — disposition decision OPEN
updated: 2026-07-22
---

# BMS-4997 — Call Center Order Visibility (overview)

## One line
Give call-center agents / retailers a single view of an account's order history, active promotions,
resolved pricing, and delivery context — **but validation shows the shipped storefront already
delivers the core of this**, so the epic is closer to *validate + close 4 small gaps* than a new build.

## Where it stands (2026-07-22)
- **Epic:** [BMS-4997](https://ohanafy.atlassian.net/browse/BMS-4997) — Epic, To Do, `polished`. Children **BMS-3858** + **BMS-3922** (both Backlog, un-groomed; rich Gherkin ACs, stale June polish reviews).
- **Key finding:** the existing E-Commerce storefront already ships order history (`ecomOrderHistory`), promotions (`ecomPromotions`), pricing (product cards / `resolveCartPricing`), and account/credit context (`ecomProfilePage`, `ecomAccountSwitcher`, BMS-3930). See `VALIDATION.md`.
- **Built this session (in `ccov-4997`, branch `feat/call-center-order-visibility-reporting-bms-4997`, not committed):** `ecomOrderVisibility` LWC (redundant), `DeliveryCutoffController` + report type (reusable), site embed, order seed. See `SESSION.md`.

## The 4 genuine deltas (only these are net-new)
1. **Consolidated single view** — the surfaces exist but on separate routes, not one dashboard.
2. **Pricing-waterfall breakdown** (list → price code → promo → net) — no such UI today (research [S4]).
3. **Internal call-center *agent* audience** — storefront is external-retailer; an agent surface belongs in **OMS-UI**, not the community site.
4. **Supervisor multi-warehouse aggregate** — a native report/dashboard (the `ohfy__Ecom_Order_Visibility` report type serves this).

## OPEN — disposition decision (blocking)
- **(a)** Document the disposition (already-covered vs the 4 deltas), back out the redundant `ecomOrderVisibility` LWC + embed, keep only what's genuinely new.
- **(b)** Keep the pricing-waterfall + consolidated view; drop the order-history/promotions re-aggregation; re-confirm audience (retailer vs internal agent).

## Docs in this folder
- `SESSION.md` — handoff context seed (read the "🛑 READ FIRST" block).
- `ASSUMPTIONS.md` — grounded data-model/reuse facts (`[S#]`/`[D#]`); framing superseded — see its banner.
- `VALIDATION.md` — the already-shipped finding + what was/wasn't validated.
- `Dry Run Testing/seed-data.apex` — order-history seed for Customer Account 0.
