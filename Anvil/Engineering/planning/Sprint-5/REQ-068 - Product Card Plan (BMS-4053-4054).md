---
title: "REQ-068 — Product Card Plan (BMS-4053 / BMS-4054)"
epic: "BMS-4995"
sprint: "Sprint 5"
goal_by: 2026-06-19
updated: 2026-06-17
status: in-progress
---

# REQ-068 Retailer Online Ordering Experience — Product Card Plan

**Goal:** complete the BMS-4995 product-card scope by end of week (target 2026-06-19).
**Tickets picked up:** [BMS-4053](https://ohanafy.atlassian.net/browse/BMS-4053) (Ph 1: Card Component) → [BMS-4054](https://ohanafy.atlassian.net/browse/BMS-4054) (Ph 2: Grid Layout + Reuse).

---

## TL;DR — should I start with these?

**Yes — and 4053 is further along than it looks.** A **draft PR is already open: [#293](https://github.com/Ohanafy/OHFY-Split/pull/293)** with all gates green on the lane org (48/48 Apex, 650 Jest, deploy-validate, Playwright 5/5, live storefront check). So 4053 is mostly *get-it-reviewed-and-merged*, not *build*. **4054 stacks on the 4053 branch**, so the order is forced: **4053 first, then 4054.**

The parent epic is a **validate-don't-re-engineer** effort. Elliot's note: *"E-Commerce just needs to support the new pricing/promotions functionality. The rest is already completed."* Most of both tickets was already on `main`; what's left is the *residual* scope captured in the polish comments.

---

## Sequence (dependency-forced)

```
BMS-3927 (search, in Review) ──┐  same ecomShop.html/js surface → merge-order conflict
                               ▼
BMS-4053 PR #293  ──►  merge  ──►  BMS-4054 (branch off 4053)  ──►  merge
```

1. **Coordinate merge order with BMS-3927 first** (see Blockers). Decide who lands first; rebase the loser.
2. **Land BMS-4053** (PR #293) — review, resolve parked brand-accent question, merge.
3. **BMS-4054** — branch off the merged 4053 (it consumes `c-ecom-product-card`). Implement residual scope, test, PR.

---

## BMS-4053 — Ph 1: Card Component  *(To Do, draft PR #293 open)*

**What's already delivered on the branch** (per polish comment 2026-06-12):
- Card extracted into reusable `c-ecom-product-card` LWC (OHFY-eCommerce-UI) — the contract 4054 consumes. Zero visual/behavioral change; data-testids preserved.
- Configurable, field-set-driven data-point framework on shop card **and** product detail page (reuses `Fieldset_Customization__mdt` + `U_FieldUtility`; new `Ecom_Product_Card` / `Ecom_Product_Detail` field sets on `Item__c`; new `ProductDisplayController.getProductDisplayFields(purpose)`).
- UPC ships displayed by default in both field sets, admin-removable (closes the open UPC question reversibly).
- Tests: Jest for `ecomProductCard`, `ProductDisplayController_T` + wrapper delegation, Playwright (card + configured data points + call-for-pricing regression).

**Remaining to close the ticket:**
- [ ] Resolve / merge with BMS-3927 (see Blockers).
- [ ] Get the parked **brand logo/color accent** decision from Emily (Blocker #2).
- [ ] `/code-review` on the final diff; address findings.
- [ ] Promote PR #293 out of draft → review → merge to `main`.
- [ ] CI green (`gh pr checks 293 --watch`).
- [ ] Confirm Story Points (5) set before any Refined→To Do transition (needs-refinement exit requires points).

**Already-satisfied dependencies:** BMS-3822 (Inventory Threshold) **Done**, BMS-3876 (S_PriceResolver) **Done** — neither blocks.

---

## BMS-4054 — Ph 2: Grid Layout + Reuse  *(To Do, ~2 pts, frontend-only)*

**Residual acceptance criteria** (per polish comment 2026-06-12 — grid/pagination/search-reuse already shipped):
1. [ ] **Promotions-first default sort** — items with `item.hasPromotions` render before non-promoted; within group, in-cart first, else stable. Relabel default option to "Promotions First" in **both** dropdowns (desktop header + mobile filter drawer).
2. [ ] **"Cart Items First"** kept as an explicit selectable sort option (today's default behavior).
3. [ ] **Image-error fallback** — `ecomProductCard` falls back to `ecomNoProductImage` / `defaultKeggedProductImage` static resources on broken `Logo_URL__c` (currently `src=""` → broken glyph); one-shot guard.
4. [ ] **Image sizing / perf** — `loading="lazy"`, fixed-height `object-contain` frame w/ padding (200-SKU pages, 3s SLA).
5. [ ] **Card adoption** — catalog + search render exclusively through `c-ecom-product-card`; satisfied by stacking on the merged 4053 branch (verify, don't rebuild).
6. [ ] Tests — Jest for sort branches + image fallback; Playwright spec for promotions-first ordering.

**Explicitly excluded (do not build):**
- Reorder-history card-reuse leg → owned by **BMS-3929** (Done/in Review; re-touching guarantees conflicts). Follow-up candidate only.
- Promotions **carousel** → **BMS-5321** territory; the 2026-05-08 comment resolved this toward *sort order*, not a carousel.

**No Apex, no new routes/permissions** — pure frontend. Use `/ohfy-design` for any visual change (sort label, image frame) per repo workflow.

---

## Blockers & risks to be aware of

1. **🔴 Merge-order collision with BMS-3927 (search, in Review).** PR #293 reworks `ecomShop.html` / `ecomShop.js` — the *same surface* BMS-3927 touches. Whoever merges second eats the conflict. **Action:** sync with the BMS-3927 owner today, agree on order, rebase accordingly. This is the single biggest schedule risk for the week.
2. **🟡 Parked product decision — brand logo/color accent.** No brand color/logo field exists on `Item_Type__c` and no UX decision is recorded. Original AC asked for "brand logo or color accent consistently across cards." **Action:** get a call from Emily — new packaged field vs derived accent vs drop. Until then it stays out of scope (documented in both tickets). Don't block the merge on it; ship without it.
3. **🟡 Hard sequence 4053 → 4054.** 4054 consumes `c-ecom-product-card`. Don't start 4054 against `main` — branch off the merged 4053 (or off the 4053 branch if merging late) or you'll rebuild the component.
4. **🟢 Resolved open questions (for the record):**
   - UPC on card → ships as default field-set content, admin-removable. ✅
   - Brand-level minimum-case enforcement → **not here**, owned by BMS-3920. ✅
   - Promoted placement (sort vs carousel) → **sort order** for 4054; carousel is BMS-5321. ✅
5. **🟢 Upstream deps done:** BMS-3822, BMS-3876 both Done — pricing waterfall + inventory threshold resolvers are in place.

---

## End-of-week definition of done (per repo)

- [ ] Both tickets' residual ACs demonstrably met.
- [ ] `/ohfy-design` applied to visual changes (4054 sort label + image frame).
- [ ] All relevant Apex `_T` + full Jest green; affected Apex ≥ 90% coverage.
- [ ] Chrome DevTools MCP live smoke on the storefront (card render, sort, image fallback).
- [ ] `/playwright-tests` specs updated + green (chromium only).
- [ ] `/document` run for the package-affecting change.
- [ ] `/code-review` clean; Pre-PR checks pass.
- [ ] PRs open against `main`, CI green and watched to completion.

## Suggested order of operations this week

1. **Mon/Tue:** Lock merge order with BMS-3927 owner. Ping Emily on brand-accent decision (async is fine — it's parked, not blocking).
2. **Tue/Wed:** `/code-review` + finalize PR #293 → merge BMS-4053.
3. **Wed/Thu:** Branch 4054 off merged 4053; implement 6 residual ACs; Jest + Playwright.
4. **Thu/Fri:** `/document`, Pre-PR checks, open 4054 PR, watch CI green.
