---
title: Retailer Online Ordering — What's Accomplishable in the Not-Done Pool
epic: BMS-4995 [REQ-068] Retailer Online Ordering Experience
date: 2026-06-22
updated: 2026-06-24
author: Alvaro Sanchez
analysis_basis: live repo (OHFY-Split-BMS-4053) + Jira (descriptions, ACs, comments, status)
tags: [ecommerce, ordering, epic-analysis, accomplishable, BMS-4995]
---

# BMS-4995 — What Can Actually Be Finished in the Not-Done Pool

**Bottom line:** The not-Done pool *looked* like ~18 open tickets, but most is **finish-line UI work, redundant umbrellas (now closed), and work already shipped under other tickets.** The genuine net-new engineering left is **two real builds** — **Checkout + Tax + Order (BMS-4052)** (gated on an FL/AL tax decision) and the **Post-off + Quantity-Discount promo UI on cart/PDP (BMS-4051)** — plus small refinements. Drive the in-flight tickets to close and the epic is down to those.

> [!important] One sentence
> ~4 tickets at the finish line, **2 redundant umbrellas now ✅ closed**, **3 small/medium builds (3932, 5321, 4051 promo UI)**, **1 fold-and-close (4050)**, **1 core feature (4052 checkout/tax/order)**, and **5 deferred**.

---

## 🔁 Re-audit log

### 2026-06-25 — BMS-3925 verified COVERED by BMS-4053 (reverses the 06-24 defer)

Verified against the **`feat/product-card-component-bms-4053`** branch (OHFY-Split, code-level audit). BMS-4053 pulls account-specific **front-line price + promotions** into both the **shop page** and **product detail page**:
- **Account pricing** (shop + PDP): ✅ via `Ecom_UI_Wrappers.resolveCatalogPricing` / `resolveCartPricing`.
- **Post-off** (flat, struck-through price) **+ Quantity-Discount** (volume-tier meter): ✅ shop + PDP (tiers unlock on cart qty).
- **Basic availability** (in-stock / low / sold-out per fulfillment location): ✅.

BMS-3925's only un-covered thread is **real-time *per-warehouse* availability**. **Decision (2026-06-25): keep BMS-3925 open but RE-SCOPE it to that remaining thread** — its Jira description was rewritten to emphasize that pricing + promos + basic availability are delivered by 4053, and the ticket now covers only real-time warehouse-specific availability (dependency: a per-warehouse inventory feed that doesn't exist yet). This reverses the 06-24 "defer the whole ticket" framing — the *catalog pricing/promo* scope is done, the *availability* scope stays as 3925's focused purpose.

> [!important] Bigger correction — the storefront IS an `S_PriceResolver` consumer on the 4053 branch.
> The 06-24 warning ("storefront is FLP-only / `S_PriceResolver` has zero consumers") came from BMS-3874's **2026-06-15** audit. **The 4053 branch supersedes it:** `Ecom_UI_Wrappers.resolveCatalogPricing` / `resolveCartPricing` now call `S_PriceResolver.resolve()` (full FLP + promo waterfall). Reconcile:
> - **BMS-3874 consumer #6 (e-commerce)** is largely delivered by 4053 once it merges — that leg may be redundant.
> - **BMS-4050** (cart basic pricing) is plausibly **done by 4053's `resolveCartPricing`**, not merely "folded into 3874" — re-verify the cart page before closing.
> - The **§4 / §6 / trust-trap** notes that say "promo display is client-side only, invoice still FLP-only" need revisiting **for the e-comm surface** (still true for invoice/truck consumers until 3874 lands).

### 2026-06-24 — re-audit + continued deferral (paper trail)

Not-Done pool moved **17 → 15**. Deltas since the 2026-06-22 audit:

- **BMS-3924** (card/grid umbrella) → ✅ **Won't Do** (closed). Superseded by BMS-4053 + BMS-4054.
- **BMS-3928** (cart/checkout umbrella) → ✅ **Won't Do** (closed). Superseded by BMS-4049 spike + 4050/4051/4052.
- BMS-4053 Product Card Ph1: In Progress → **Build** (CI/CD); draft **PR #293** open. ⚠ Merge-order: PR #293 reworks `ecomShop.html/js` — same surface as in-flight **BMS-3927** (search). Coordinate merge order.
- **BMS-3932** Self-service acct mgmt v1: To Do → **In Progress**.
- **BMS-3925** Product Catalog & Availability: moved **Tier 3 (close) → Tier 6 (defer)** by decision 2026-06-24. Real-time warehouse availability is genuine net-new (needs a warehouse-inventory feed) → deferred to the follow-up bucket, **not** closed as duplicate.
- **BMS-4050** (Tier 4): **folded into [BMS-3874](https://ohanafy.atlassian.net/browse/BMS-3874)** 2026-06-24 — correct-price requirement = 3874's consumer #6 (`Ecom_UI_Wrappers` → `S_PriceResolver`); no UI residual. **Closure candidate.** Comments posted on 3874 + 4050.
- **BMS-4051** (Tier 4): **KEEP OPEN — corrected 2026-06-24.** Earlier fold/close call was wrong: BMS-4076 (Done) covered **only straight-line auto-apply promos**, so the **Post-off + Quantity-Discount priced UI on cart page + PDP** (and cart-reactive recalc deferred here from BMS-4053 AC4) is **real net-new UI** that stays in this ticket. Only the server-side resolution folds into BMS-3874; checkout-total → BMS-4052. Correction comment posted on BMS-4051 (supersedes the earlier closure-candidate note).

> [!warning] Be mindful — pricing-engine integration (BMS-3874). **Correction to the 2026-06-22 note.**
> The storefront does **NOT** yet price through `S_PriceResolver`. Per BMS-3874's 2026-06-15 audit, `S_PriceResolver` has **zero production consumers** — every forward-sale path, **including `Ecom_UI_Wrappers` (consumer #6), is still FLP-only** (`S_FrontLinePricing`). The card's promo display today comes from the **client-side BMS-4076 path**, not server-resolved promotions.
> - **BMS-3874** (To Do, pricing epic BMS-5097) will **rewire `Ecom_UI_Wrappers` → `S_PriceResolver`** (full FLP + promo waterfall) — the exact pricing surface the product card reads.
> - **Impact on BMS-4053: none for finishing now.** 4053's residual (PR #293: LWC extraction + configurable data points + UPC) doesn't touch pricing resolution. **Land 4053 first** — 3874 hasn't started.
> - **After 3874 lands:** re-verify card promo/volume pricing (4053 AC2–AC4) — source of truth flips from client-side (4076) to server-resolved (`S_PriceResolver`).
> - Pricing-engine state: BMS-3876 (resolver v1), BMS-3877 (promo layers integration), BMS-3879 (tiered/customer discounts) all **Done**; BMS-5206 (defensive Apex) **To Do**; BMS-3878 (BOGO) **Backlog / v2 deferred per ADR-0010 §13.4**.

---

## 1. The epic

**BMS-4995 — [REQ-068] Retailer Online Ordering Experience** (In Progress, your epic). 37 children. Per the **2026-06-24 re-audit: 15 not-Done**, with **BMS-3924 + BMS-3928 newly Won't Do** (3 Won't Do total; the rest Done). This is the corrected target — the e-commerce/ordering epic where the product-card (BMS-4053) work lives, *not* the pricing-engine epic (BMS-5097).

---

## 2. The not-Done pool — accomplishability tiers

🟢 buildable/closeable now · 🟡 real build but needs refinement first · 🔴 defer (dependency or v2)

### 🟢 Tier 1 — finish line (in flight, nearly done)
| Ticket | Status | SP | Note |
|---|---|---|---|
| BMS-4053 Product Card Ph1 | **Build** (PR #293) | 5 | Your current ticket — finish & merge. Coordinate merge order vs BMS-3927 (same `ecomShop` surface). |
| **BMS-4054** Product Card Ph2 (grid + reuse) | In Progress | 2 | Card is built; grid reuse is the natural next step |
| **BMS-5344** Reorder banner blue-on-blue | Review | 1 | Basically done — push to close |
| **BMS-3926** Passwordless login + registration | Testing | 5 | In testing — verify & close |

### 🟢 Tier 2 — accomplishable now, scope is clear
| Ticket                                                     | Status           | SP  | Note                                                                                                                                                                                                                                                                                                                                                                 |
| ---------------------------------------------------------- | ---------------- | --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **BMS-3932** Self-service account mgmt (address, contacts) | In Progress      | 3   | **v1 only.** Direct-write on the existing `ecomProfilePage` + `Ecom_UI_Wrappers` + `UpdateContactController`. **No approval process in v1** (blocked on Gulf sign-off), no external address validation. Needs a fresh `/polish` for ACs (prior polish is stale), but the v1 path is buildable today. Coordinate with BMS-4258 (Done) — same wrapper/profile surface. |
| **BMS-5321** Segmented promo banners at login              | Needs Refinement | 2   | Small, clear; just needs refinement → To Do.                                                                                                                                                                                                                                                                                                                         |

### 🧹 Tier 3 — ✅ CLOSED (redundant umbrellas, Won't Do 2026-06-24)
These restated the epic and were already decomposed into real children. Closed administratively.
| Ticket | Resolution | Covered by |
|---|---|---|
| **BMS-3924** Product card & grid components | ✅ Won't Do (2026-06-24) | BMS-4053 + BMS-4054 (the real phased build) |
| **BMS-3928** Cart & checkout (umbrella) | ✅ Won't Do (2026-06-24) | BMS-4049 (Done spike) + 4050/4051/4052 phases |

### 🟡 Tier 4 — BMS-4050 folded/close · BMS-4051 stays a real build (revised 2026-06-24)
*BMS-4050 → folded into [BMS-3874](https://ohanafy.atlassian.net/browse/BMS-3874), close. BMS-4051 → KEEP OPEN: real Post-off + Quantity-Discount UI on cart page + PDP (BMS-4076 only covered straight-line auto-apply promos). Only 4051's server-side resolution rides on BMS-3874.*
| Ticket                                     | Reality                                                                                                                                                                                                                                                                                                                                                                 |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **BMS-4050** Cart + basic pricing          | **Largely exists** — the storefront cart resolves FLP pricing live via `Ecom_UI_Wrappers` (currently **FLP-only**, `S_FrontLinePricing`) plus client-side promo display (BMS-4076). ⚠ *Correction 2026-06-24: `Ecom_UI_Wrappers` is NOT yet an `S_PriceResolver` consumer — that wiring is BMS-3874 (To Do). See re-audit log.* Refine to confirm the gap; likely thin. |
| **BMS-4051** Volume tiers + promos in cart | 🟡 **KEEP OPEN — real UI build.** BMS-4076 (Done) covers **only straight-line auto-apply promos** (per its Testing Notes) — badges, progress bars, nudges, cart flag, savings summary. It does **NOT** cover the **Quantity Discount (tier) priced display**, the **Post-off priced line on cart/PDP**, or the **cart-reactive recalc on cart page + PDP** (deferred here from BMS-4053 AC4). **Residual = build the Post-off + QD promo UI on cart page + PDP.** Server-side resolution → BMS-3874; checkout-total → BMS-4052. **Not a closure candidate.** |

### 🟡 Tier 5 — the only real remaining feature (needs refinement)
| Ticket | Status | Note |
|---|---|---|
| **BMS-4052** Checkout + Tax + Order | Needs Refinement | **The genuine remaining engineering lift.** Entity-aware **FL/AL tax** calculation, order creation with full pricing lineage, minimum-order enforcement. The **tax piece is the open unknown/dependency** — entity-aware, not just ZIP-based. This is where to focus refinement energy. |

### 🔴 Tier 6 — defer (real dependency or v2)
| Ticket | Status | Why deferred |
|---|---|---|
| **BMS-4525** Credit terms Ph2 — AR sync, invoice list, payment history | To Do (SP8) | Buildable **only if** an AR data source/sync exists — it's an **integration dependency**, not pure UI. Heaviest real ticket. Confirm the AR feed before committing. |
| **BMS-5322** Self-service account mgmt v2 (zone model, address validation, approval) | Backlog | Needs a new **Named Credential + external API** (USPS/Google) + Gulf **sign-off on approval semantics**. Explicitly deferred from BMS-3932. |
| **BMS-3920** Supplier allocation constraints & case-pack rounding | Needs Refinement | **No data model exists** for allocation rules today; needs customer input on where they live (object/CMDT) and enforcement point. Refine/defer. |
| **BMS-3925** Product Catalog & Availability | Needs Refinement → **RE-SCOPED** | **Reframed 2026-06-25 (not deferred, not closed).** Catalog pricing + Post-off + QD promos on shop **and** PDP, plus basic availability, are **delivered by BMS-4053**. Ticket **re-scoped to its only remaining thread: real-time per-warehouse availability** (dependency: a per-warehouse inventory feed that doesn't exist yet). Jira description rewritten to emphasize the remaining scope. See 06-25 re-audit log. |
| **BMS-4494 / BMS-4495** Reporting spike + build | Backlog | Downstream of feature completion; reporting track, not ordering build. |

---

## 3. The reframe — the pool is smaller than it looks

| Bucket | Count | Tickets |
|---|---|---|
| Finish line (in flight) | 4 | 4053, 4054, 5344, 3926 |
| Small/medium builds | 3 | 3932 (v1), 5321, **4051 (Post-off + QD promo UI on cart/PDP)** |
| Redundant umbrellas → ✅ closed (Won't Do) | 2 | 3924, 3928 |
| Re-scoped → availability only | 1 | 3925 (pricing/promos done by 4053; remaining = real-time per-warehouse availability) |
| Fold & close | 1 | 4050 → BMS-3874 (re-verify cart vs 4053 first) |
| **Core net-new feature** | **1** | **4052 (checkout + tax + order)** |
| Genuinely deferred | 4 | 4525, 5322, 3920, 4494/4495 |

**So the true remaining engineering is:** finish the 4 in-flight tickets → build 3932 v1 + 5321 + **4051 (promo UI)** → land **4052** (the core feature, pending the FL/AL tax decision). Close 4050 (folded into BMS-3874); everything else is deferral.

---

## 4. Why this is accomplishable — the platform is already there

Confirmed in the repo this session:
- **Storefront prices through FLP today, with client-side promo display.** ⚠ *Corrected 2026-06-24:* `Ecom_UI_Wrappers` is currently **FLP-only** (`S_FrontLinePricing`); per BMS-3874's audit `S_PriceResolver` has **zero production consumers**. Promo pricing on the card/cart is the **client-side BMS-4076 path**, not the server-side waterfall. Wiring the storefront to the full `S_PriceResolver` waterfall is **BMS-3874 (To Do)**. See the re-audit log.
- **Card-level promo UI built** (your BMS-4053) and **straight-line auto-apply promos integrated across Shop/PDP/Cart** (BMS-4076, Done) — so **4050's basic-pricing piece is done** (folds into BMS-3874). ⚠ **But 4051 is NOT done:** Post-off + Quantity-Discount priced UI + reactive recalc on the **cart page + PDP** were out of 4076's scope (straight-line only) and remain a real build.
- **Profile/account surface exists** (`ecomProfilePage`, `Ecom_UI_Wrappers`, `UpdateContactController`, multi-account BMS-4258 Done) — so 3932 v1 is incremental, not net-new scaffolding.

The gaps are: **checkout→order→tax (4052)**, **AR integration (4525)**, and **external/v2 concerns (5322, 3920)**.

---

## 5. Recommended actions

```
CLOSE TO FINISH (drive in-flight to Done):
  ├─ BMS-4053  Product Card Ph1 .......... finish
  ├─ BMS-4054  Product Card Ph2 (grid) ... finish
  ├─ BMS-5344  Banner fix ................ Review → Done
  └─ BMS-3926  Passwordless login ........ Testing → Done

BUILD (small/medium, clear):
  ├─ BMS-3932  Self-service acct mgmt v1 . /polish then build (no approval in v1)
  ├─ BMS-5321  Promo banners at login .... refine → build
  └─ BMS-4051  Promo UI: Post-off + QD ... build on cart page + PDP (server-side via 3874; checkout-total via 4052)

CLOSED ✅ (Won't Do, 2026-06-24):
  ├─ BMS-3924  card/grid umbrella ........ → 4053/4054      [DONE]
  └─ BMS-3928  cart/checkout umbrella .... → 4049/.../4052  [DONE]

FOLD & CLOSE:
  └─ BMS-4050  cart + basic pricing ...... folded into BMS-3874 → close (Won't Do); no UI residual

THE ONE REAL FEATURE (refine, then build):
  └─ BMS-4052  Checkout + Tax + Order .... ⚠ decide FL/AL tax approach first

DEFER (dependency / v2):
  ├─ BMS-4525  Credit terms AR sync ...... confirm AR data source first
  ├─ BMS-5322  Self-service v2 ........... Named Credential + approval sign-off
  ├─ BMS-3920  Supplier allocation ....... no data model; needs customer input
  └─ BMS-3925  Catalog/availability ...... RE-SCOPED to real-time per-warehouse availability (pricing/promos done by 4053); needs warehouse-inventory feed
  └─ BMS-4494/4495  Reporting ............ downstream of feature completion
```

**Epic exit:** BMS-4995 can reach Done by finishing the 4 in-flight tickets, building 3932 v1 + 5321 + **4051 (promo UI)**, closing 4050 (3924/3928 already Won't Do), and landing 4052. The 5 deferred tickets should move to their own follow-up bucket (AR integration, self-service v2, allocation, catalog/availability, reporting) so they don't hold the epic open.

---

## 6. Feature criticality — crucial vs nice-to-have (trust lens)

*Added 2026-06-24. Lens: would shipping the deliverable **without** this item break the retailer's experience or trust? A storefront that takes orders at the wrong price, won't let you log in, or can't complete checkout is not shippable. Cosmetic, marketing, and back-office items are not.*

### 🔴 Crucial — must be correct to ship (UX/trust-breaking if missing or wrong)
| Ticket | Why it's crucial | Status |
|---|---|---|
| **BMS-4052** Checkout + Tax + Order | No checkout = no storefront. **Wrong FL/AL tax = invoice disputes = direct trust loss.** This is the core transaction. | Needs Refinement (the one real build) |
| BMS-4053 Product Card Ph1 | The price the retailer sees before buying. **A wrong account price on the card breaks trust instantly** and sends them back to calling their rep. | Build (PR #293) |
| **BMS-4050 → BMS-3874** Cart pricing | The cart total must match the card and the eventual invoice. Price drift across surfaces = disputes. **Requirement is crucial; the ticket itself folds into BMS-3874 (4050 closing).** | Fold → close |
| **BMS-3926** Passwordless login + registration | The access gate. No login = no portal at all. | Testing |

### 🟢 Nice-to-have — safe to defer without breaking core UX/trust
| Ticket | Why it's deferrable | Status |
|---|---|---|
| **BMS-5321** Segmented promo banners at login | Marketing enhancement; ordering works fine without it. | Needs Refinement |
| **BMS-4054** Product Card Ph2 (promotions-first sort, image fallback) | Responsive grid already live; sort/fallback are polish. | In Progress |
| **BMS-4051** Post-off + QD promo UI (cart/PDP) | Base price stays correct without it; promo display is upside. **Caveat:** promos already show on the card (BMS-4076) — keep cart/PDP consistent or suppress, or you hit the trust trap below. | Needs Refinement → build |
| **BMS-3932** Self-service acct mgmt v1 | Convenience; absence is friction (call to update address), not a broken purchase. | In Progress |
| **BMS-3925** Catalog **real-time per-warehouse** availability | Basic stock badge already shipped (4053); real-time per-warehouse is the upside. "Call for stock" fallback exists; ordering still completes. | 🟡 Re-scoped (availability only) |
| **BMS-5322** Self-service v2 | v1 covers the baseline; zone model / validation / approvals are upgrades. | 🔴 Deferred |
| **BMS-4494 / 4495** Reporting | Internal/back-office; retailer never sees it. | 🔴 Deferred |

### ⚠️ The trust trap — deferred ≠ "half-shipped"
Some deferred items are safe to defer **only if you don't display what you can't back up.** Showing something wrong is worse than not showing it:
- **Real-time availability (BMS-3925):** ship with **no stock indicator** rather than a stale/incorrect one. A "In stock" badge that's wrong erodes trust faster than its absence.
- **Promotions on the storefront (BMS-4076 client-side vs BMS-3874 server-side):** today promo pricing is **client-side display only** — the server invoice still prices FLP-only until **BMS-3874** wires `S_PriceResolver`. **Risk: a promo shown on the card/cart that does not match the delivered invoice price = the exact dispute we're trying to avoid.** Until 3874 lands, confirm the displayed promo equals what the order actually books, or suppress the promo display on surfaces that feed checkout.
- **Supplier allocation / oversell (BMS-3920):** deferred, but if the storefront accepts an order it can't fulfill, that's a trust break. Safe to defer **only** while order volume/SKU-allocation risk stays low; revisit before high-demand/allocated SKUs go live.

**Net:** the crucial set is small — **4052 (build), 4053 (finishing), 4050 (confirm), 3926 (verify)** — plus the **BMS-3874 promo-consistency check**. Everything else can slip without breaking the deliverable, *provided deferred features are hidden rather than shown incorrectly.*

---

## Appendix — sources

- **Jira (2026-06-22):** BMS-4995 epic + 37 children; full descriptions/ACs/comments read for BMS-3920, 3924, 3925, 3928, 3932, 4050, 4051, 4052; status/SP/assignee for all 37.
- **Jira re-audit (2026-06-24):** fresh status pull of the 15 not-Done children; resolution check on BMS-3924/3928 (both Won't Do); pricing-engine cross-check via BMS-3874 / 3876 / 3877 / 3878 / 3879 / 5206 and BMS-4053 / 4054 ACs + comments.
- **Repo:** `OHFY-Split-BMS-4053`. `Ecom_UI_Wrappers` (**FLP-only today**; `S_PriceResolver` wiring pending BMS-3874), `userDataService`, `ecomProfilePage`, product-card LWCs. Cross-referenced with the pricing-engine epic (BMS-5097).
- Companion visual: `ECOM-Ordering-Epic-Accomplishable-Analysis.html` (same folder) — ⚠ **stale as of 2026-06-24** (predates this re-audit; regenerate to reflect 3924/3928 closure, 3925 deferral, and the BMS-3874 note).

---

## 7. Two buckets — promo-blocked vs ecom nice-to-haves

### Bucket 1: Blocked by promotions / pricing engine (BMS-3874)

These tickets cannot fully ship until `Ecom_UI_Wrappers` is wired to `S_PriceResolver` via BMS-3874. The promo/pricing surface they depend on is currently client-side only (BMS-4076).

| Ticket   | Title                             | Status           | Promo dependency                                                                                                                                      | Nice-to-Have?                                                        |
| -------- | --------------------------------- | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| BMS-4050 | Cart + basic pricing              | Fold → close     | Folded directly into BMS-3874 — this IS the wiring ticket                                                                                             | ❌ Crucial                                                            |
| BMS-4051 | Post-off + QD promo UI (cart/PDP) | Needs Refinement | Server-side promo resolution rides on 3874; UI can't show correct post-off/QD until the waterfall is live                                             | ✅ Yes — but consistency trap if shown incorrectly                    |
| BMS-4052 | Checkout + Tax + Order            | Needs Refinement | Checkout total must reflect full promo waterfall pricing; also gated on FL/AL tax decision                                                            | ❌ Crucial                                                            |
| BMS-4053 | Product Card Ph1                  | Build (PR #293)  | Can finish NOW (no promo code touched); needs re-verification of AC2-AC4 after 3874 lands                                                             | ❌ Crucial                                                            |
| BMS-4054 | Product Card Ph2 (grid + reuse)   | In Progress      | Grid renders promo badges/pricing from Ph1 — must reflect correct waterfall data post-3874                                                            | ❌ Crucial                                                            |
| BMS-3925 | Product catalog & availability    | Needs Refinement | Re-scoped 06-25: pricing/promos done by 4053; remaining scope = real-time per-warehouse availability (needs warehouse feed + promo-aware stock logic) | ✅ Yes — basic stock badge shipped; real-time per-warehouse is upside |

> BMS-4053 is **not blocked** — land it first. It only needs a post-3874 verification pass on promo display.

### Bucket 2: Ecom — not promo-blocked

#### ❌ Crucial — must ship

| Ticket   | Title                             | Direction             | Status  |
| -------- | --------------------------------- | --------------------- | ------- |
| BMS-3926 | Passwordless login + registration | Verify/Test & close   | Testing |

#### ✅ Nice-to-haves — safe to defer

| Ticket        | Title                                         | Direction                                      | Status           | Why it's deferrable                                        |
| ------------- | --------------------------------------------- | ---------------------------------------------- | ---------------- | ---------------------------------------------------------- |
| BMS-5344      | Reorder banner blue-on-blue                   | PR: Approved - Push to close                   | Review           | Cosmetic fix                                               |
| BMS-3932      | Self-service account mgmt v1                  | /polish ACs then build (no approval in v1)     | In Progress      | Friction, does not affect core order placement process     |
| BMS-5321      | Segmented promo banners at login              | Refine → build                                 | Needs Refinement | Marketing enhancement                                      |
| BMS-4525      | Credit terms Ph2 (AR sync)                    | Confirm AR data source before committing       | To Do            | Integration dependency, not ordering-critical              |
| BMS-5322      | Self-service v2 (zones, validation, approval) | Defer — needs Named Credential + Gulf sign-off | Backlog          | v1 covers baseline                                         |
| BMS-3920      | Supplier allocation & case-pack rounding      | Defer — no data model; needs customer input    | Needs Refinement | Safe while volume/allocation risk is low                   |
| BMS-4494/4495 | Reporting (spike + build)                     | Defer — downstream of feature completion       | Backlog          | Internal/back-office only                                  |

### Closed (not in either bucket)

| Ticket   | Title                          | Resolution                                     |
| -------- | ------------------------------ | ---------------------------------------------- |
| BMS-3924 | Product card & grid (umbrella) | ✅ Won't Do — superseded by 4053/4054           |
| BMS-3928 | Cart & checkout (umbrella)     | ✅ Won't Do — superseded by 4049/4050/4051/4052 |
