---
ticket: BMS-5576
title: Ecom — Phase 2: Pricing/Promo Completion & Checkout
domain: e-commerce-ordering
relates: [BMS-4052, BMS-4051, BMS-5321, BMS-4053, BMS-3932, BMS-3926, BMS-3874]
branch: feat/ecom-phase2-pricing-checkout-bms-5576
org: ohfy-5576
status: BUILD — 3/3 build tickets code-complete & review-clean on branch; PRs + full live smoke pending
sprint: "Sprint 9"
sprint_status: active
sprint_history: []
po: Elliot Flores
updated: 2026-07-14
tags:
  - manager-engineer
  - build-overview
---

# BMS-5576 — Ecom — Phase 2: Pricing/Promo Completion & Checkout

> [!warning] BUILD — branch `feat/ecom-phase2-pricing-checkout-bms-5576` (21 commits, 4 packages)
> All three build tickets (4052/4051/5321) implemented, code-reviewed, findings fixed, green (Apex + Jest) on `ohfy-5576`. Not yet PR'd/merged. Live storefront: FLP pricing + checkout tax render live; demo Post-off + tiered QD promos now seeded Active. See `front-line-pricing.md` for the full pricing precedence.

- **Domain:** e-commerce-ordering (Gulf retailer storefront, Experience Cloud / LWR)
- **User:** Gulf retailers buying through the self-service portal; Gulf marketing (segmented banners)
- **Business impact:** closes the Phase-1 ordering loop — server-resolved promo pricing across cart+PDP, real checkout with entity-aware tax + order creation + minimum-order enforcement, and segmented storefront banners. Wrong pricing/tax here = invoice disputes + tax-compliance risk.

## What it is
Phase 2 of the retailer e-commerce build (Phase 1 = BMS-4995 MVP). Finishes: (1) **checkout** — warehouse-jurisdiction tax + draft-Invoice order creation + minimum-order gate (BMS-4052); (2) **cart/PDP reactive pricing** — server-resolved volume-tier + promo pricing wired into the cart page and PDP (BMS-4051); (3) **segmented promotional banners** by retailer group (BMS-5321).

## Intended solution
Built on the **draft `Invoice__c` / `Invoice_Item__c`** model via `DraftInvoiceController` (there is **no** `Order__c`/`Cart__c` — a stale-AC assumption corrected in polish), and the **`S_PriceResolver` → `S_FrontLinePricing`** pricing waterfall (full precedence in `front-line-pricing.md`).
- **BMS-4052** — `CartController.getCheckoutSummary` → global `CheckoutSummaryDTO` (tax by fulfillment `Location__c.Location_State__c` via `Tax_Authority__c`, jurisdiction label, `Is_Tax_Exempt__c`, `minimumOrderValue`); new `Location__c.Minimum_Order_Value__c`; gate in `DraftInvoiceController.confirmDrafts` (single **and** split paths, **ecom-scoped** via `Invoice__c.E_Commerce__c`), surfaced as an `AuraHandledException`. `ecomReviewSummary` LWC: real server tax, **total now includes tax**, jurisdiction label, min-order Place-Order gate.
- **BMS-4051** — wired `Ecom_UI_Wrappers.resolveCartPricing` into `ecomCartPage` + `ecomProductPage`: per-line `finalCasePrice`, Volume/Promo labels, request-sequencing guard, graceful degradation, base-price-preserving persistence.
- **BMS-5321** — new `Storefront_Banner__c` + `StorefrontBannerController.getSegmentedBanner` (promotion-group / chain / account targeting, priority tiebreak, date-window + Active gating, hero fallback) + `segmentedBanner` LWC (home = segmented, login = global).

## Status / what's built
- ✅ **BMS-4052** — reviewed (3 blockers fixed); `CartController_T`+`DraftInvoiceController_T` + Jest `ecomReviewSummary` green · `044e1885b`, `c8d85b3a1`
- ✅ **BMS-4051** — reviewed; Jest 9/9 green · `5a2a09cb7`, `eadf9283a`
- ✅ **BMS-5321** — reviewed (2 blockers fixed); Apex 11/11 (97%) + Jest 5/5 green · `7f2f6f9c2`, `9caec73bb`
- 🔁 **BMS-4053** — branch base (merged forward); product card shipped. Rule-8 Fieldset-config flaw deferred + logged (comment 58172).
- ⏭️ **BMS-3926** — disregarded (login already merged via PR #458).
- 🔀 **BMS-3932** — in **open PR #388** (approval model, plan-of-record); needs `/code-review` + merge off this branch.

## Next phase
- **Per-domain split → PRs** (Data-Model → OMS → eCommerce → eCommerce-UI, dependency order) for release.
- **BMS-3932 PR #388** `/code-review` + merge.
- **Deferred UI gates**: `/playwright-tests` + `/document`; wire `segmentedBanner` onto login/home FlexiPages.
- **Infra to escalate (OHFY-CICD)**: `setup-site.sh` publishes but doesn't **activate** the Network; source-deployed new fields on managed objects absent from runtime global-describe on pool clones (in-namespace Apex sees them — tests pass); stale seed scripts (`seed-promo-demo` Active-guard, `link-test-user` dup rule) — worked around here by inserting `Upcoming` + running `S_Promotion_Maintenance.run()`.

## Demo
**Storefront:** `https://canal-lagoon-5885-dev-ed.scratch.my.site.com/vforcesite/login` · retailer `ecomtest_00drt00000t5buf@example.com` / `Ecomtest1!` → *Customer Account 0*.
1. **Shop / PDP** — account-specific FLP pricing (Wave Splitter 1/2 BBL **$160**, 1/4 BBL **$80**, 1/6 BBL **$69** — see `front-line-pricing.md`). ✅ live
2. **Promotions** — Post-off (Wave Splitter 1/6 BBL $69→**$59**) + tiered QD (Boats Float 1/2 BBL 10+→−$3, 50+→−$6). ✅ seeded Active (refresh storefront)
3. **Cart / PDP** — reprice on qty; Volume/Promo labels. ✅ live
4. **Checkout / review summary** — Subtotal / **FL Sales Tax** / Order Total (total includes tax). ✅ live
- **Don't demo (pool-org gaps):** min-order gate (`Minimum_Order_Value__c` not settable from outside the namespace on this clone — verified by tests), segmented banner (not yet on a page). Blockers are infra/seed, not code.
