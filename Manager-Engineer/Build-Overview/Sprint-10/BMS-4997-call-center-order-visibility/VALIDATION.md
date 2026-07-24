---
kind: validation-log
epic: BMS-4997
org: ccov-4997 (00Ddh00000ADho9EAD, namespaced ohfy, expires 2026-08-19)
date: 2026-07-22
status: KEY FINDING — shipped storefront already covers the core asks; built surface deployed but largely redundant; visual dry-run NOT yet run
---

# Validation log — BMS-4997 (org `ccov-4997`)

## ⭐ Headline validation (2026-07-22): most of the epic is already shipped
Validated against `main` that the existing E-Commerce storefront already delivers, as shipped
routes/components for the logged-in retailer:

| Ask | Shipped component (evidence) |
| --- | --- |
| Order history | `Order_History__c` route → `ecomOrderHistory` (`OrderHistoryController.cls`) |
| Active promotions | `Promotions__c` route → `ecomPromotions`, `itemPromotionsModal` |
| Pricing (account-specific) | `Product_Page__c`/`Cart_Page__c` cards + `Ecom_UI_Wrappers.resolveCartPricing` |
| Account context / credit / multi-account | `Profile_Page__c` → `ecomProfilePage`, `ecomAccountSwitcher`, credit view (BMS-3930 Done) |
| Reorder | `reorderModal` |

**Conclusion: YES — the shipped e-commerce experience already solves the core of BMS-4997.** Genuine
deltas: (1) consolidated single view, (2) pricing-waterfall breakdown UI [S4], (3) internal-agent
audience (storefront is external-retailer → belongs in OMS-UI if truly for agents), (4) supervisor
multi-warehouse aggregate report. **Disposition (a vs b) is OPEN — see `SESSION.md`.**

## What was validated on the built surface (before the redundancy finding)
- **Deploy — PASS.** `ecomOrderVisibility` LWC + `DeliveryCutoffController` + `DeliveryCutoffDTO` +
  `Ecom_UI_Wrappers.getDeliveryCutoffInfo` + `ohfy__Ecom_Order_Visibility` report type deployed clean
  to `ccov-4997`. The deploy validated all `Route__c`/`Account_Route__c` field references live.
- **Jest — PASS (4/4).** Incl. an explicit read-only-guarantee test (no reorder/apply/add-to-cart/
  create controls in the rendered surface).
- **Rule compliance — PASS.** New Apex uses `QueryService` (no raw SOQL/DML), `Logger`+`flush` in
  catch, no hardcoded `ohfy__`, dynamic access mode (no explicit USER/SYSTEM_MODE), `@namespaceAccessible`.
- **Site embed — done.** `ohfy:ecomOrderVisibility` added to the `Order_History__c` route's
  `content.json`; experience bundle deployed; community republished (async).
- **Seed — partial.** Customer Account 0 (`001dh00000shsR6AAI`): 4 orders + 8 lines seeded. Active
  promotions NOT seeded (demo seed failed an inactive-promotion-group validation) → promotions panel
  shows its graceful-empty state.

## What was NOT validated
- **Visual dry-run — NOT run.** No login-as-community-user pass; no screenshots. Would use
  `ecomtest_00ddh00000adho9@example.com` / `Ecomtest1!` at `…/vforcesite/order-history`.
- **Apex `_T` coverage — not executed** (deployed NoTestRun on the dev org; `DeliveryCutoffController_T`
  exists but wasn't run for coverage).
- **Promotions + pricing panels with real data** — promotions empty (seed gap); pricing depends on FLP
  resolving for the seeded items (unverified visually).

## Honest verdict
Code = healthy and deployed. But the **build is largely redundant** with the shipped storefront — the
right next move is the disposition decision, not a dry-run of duplicate surfaces. If (b) is chosen,
only the pricing-waterfall + consolidated view (and the reusable `DeliveryCutoffController` + report
type) survive; the rest backs out.
