---
ticket: BMS-4936
title: Launch Planning Coordination
domain: Allocation & Launch Planning
relates: []
branch: feat/launch-plan-checklist-bms-5592
org: ohfy-bms5592
status: BUILD IN PROGRESS
po: Elliot Flores
updated: 2026-07-08
tags:
  - manager-engineer
  - build-overview
---

# BMS-4936 — Launch Planning Coordination

> [!warning] BUILD IN PROGRESS — branch `feat/launch-plan-checklist-bms-5592`
> Epic has one groomed child (BMS-5592). Objects in OHFY-Data-Model, service/triggers/controller in OHFY-Platform, LWC in OHFY-PLTFM-UI (judgment call — see SESSION.md). Four open questions resolved by best judgment, pending PO confirmation.

- **Domain:** Allocation & Launch Planning
- **User:** The Gulf launch coordinator responsible for getting a new product to market.
- **Business impact:** New products launch informally today — purchasing, warehouse, POS, and sales activation each work off separate spreadsheets/memory with no shared view. The failure mode is a promotion firing with no product on the shelf, or POS materials arriving weeks late. Gulf launches ~16+ new products a year, so this is a routine pain, not an edge case.

## What it is
A `Product_Launch__c` record per new product with an auto-generated 4-lane checklist (Purchasing, Warehouse Readiness, POS Material, Sales Activation), each step owned and due-dated backward from launch day, rolling up to per-lane ready flags, an overall readiness percentage, and an overall `Status__c` (Not Started/In Progress/Complete). This story is tracking-only — it does not gate any pricing/promotion/allocation activation; that's deferred to two future REQ-009 stories that will read these readiness fields.

## Intended solution
- **Net-new:** `Product_Launch__c` (master) + `Product_Launch_Step__c` (detail, master-detail), `S_ProductLaunch.cls` (`initiateLaunch`, `handleLaunchDateChange`, `recalculateReadiness`), `productLaunchPlan` LWC.
- **Reuse, not rebuild:** `BA_Location_InventoryCreator.cls`/`Inventory__c` (warehouse signal), `E_PurchaseOrder.cls`/`Purchase_Order__c`/`Purchase_Order_Item__c` (purchasing signal — corrected via /strata; the ticket originally named a non-existent `E_PurchaseOrderForecasts.cls`), `Promotion__c`/`Pricelist__c` read directly (referenced only, not triggered — `S_Promotions.cls`/`B_Pricelist_FrontLinePromotionSetter.cls` were deleted in BMS-3870).
- **Package split:** objects → OHFY-Data-Model (Tier 0, Hard Constraint 8); `S_ProductLaunch`/triggers/`ProductLaunchController` → OHFY-Platform (Tier 2, so future WMS/OMS follow-on safeguards can consume the rollups without an illegal Tier-3-to-Tier-3 dependency); `productLaunchPlan` LWC → **OHFY-PLTFM-UI** (Tier 4 — Platform has no LWC/Tailwind infrastructure).

## Status / what's built
BMS-5592 is **code-complete in draft PR #488** (https://github.com/Ohanafy/OHFY-Split/pull/488), branch `feat/launch-plan-checklist-bms-5592`. Risk: **Low** (net-new, additive, contained blast radius).
- `Product_Launch__c` (master) + `Product_Launch_Step__c` (detail) in OHFY-Data-Model with the full field set, restricted picklists, `External_Id__c`, and an owner-required validation rule.
- `S_ProductLaunch` service + `ProductLaunch`/`ProductLaunchStep` trigger services + CMDT wiring in OHFY-Platform: auto-generates the 4-lane checklist on create, rolls step completion up to per-lane ready flags + readiness percent + overall `Status__c`, flags past-due steps at risk, and recalculates due dates + at-risk when the launch date changes.
- `ProductLaunchController` (+ read-only Inventory/PO/Promotion context signals) and the `productLaunchPlan` LWC (4-lane readiness board, inline status/owner editing, launch-status badge) in OHFY-PLTFM-UI, plus a `Launch_Planning_Access` permission set.
- Default record page: `Product_Launch_Record_Page.flexipage` (managed + scratch, namespace-split) so the LWC is reachable without a manual App Builder drop — closes a gap the ticket originally deferred. Also fixed a hardcoded `ohfy__` prefix in the LWC's `js-meta.xml` target-config object reference.
- Apex `_T` ≥90% on every touched file (`S_ProductLaunch` 90.07%, `ProductLaunchController` 90.97%), Jest 7/7 green, dry-run deploy clean, and full behavior + the FlexiPage placement validated live on `ohfy-bms5592` (21/21 Apex methods).

## Next phase
Deferred (separate, not-yet-groomed REQ-009 stories): a supply-in-position gate (blocks launch activation until product is staged) and a promo-timing guard (blocks a campaign from firing before product is available). Both will read the readiness fields this story produces (including `Status__c`).

## Demo
Open a `Product_Launch__c` record (the default record page now ships the LWC automatically), create a launch with an Item and a Launch Date. The header shows a launch-status badge (Not Started → In Progress → Complete) alongside the readiness % and at-risk indicator; four lanes below each carry a ready badge and a context signal; steps carry an owner, a due date, and an at-risk indicator when overdue. Flip a step to Complete and the lane badge + readiness % + overall status update; reassign an owner inline; change the launch date and every due date + at-risk flag recalculates.
- **Don't say:** this gates anything — it's tracking-only; the readiness fields (including `Status__c`) are read-only signals for future safeguard stories. The Inventory/PO/Promotion strings are informational context, not the source of the ready flags (those come from step completion).

## Polish history
- **2026-07-08, /polish pass 1:** corrected two stale class references (`E_PurchaseOrderForecasts.cls`, `S_Promotions.cls`/`B_Pricelist_FrontLinePromotionSetter.cls` — already caught by /strata) and shipped-field-name drift in the ticket's Technical field.
- **2026-07-08, /polish pass 2 (thorough):** found AC Scenario 2 asserted a `Product_Launch__c.Status__c` that didn't exist in the build — a real gap, not a naming nit. Built it (see above) rather than just re-documenting around it. Also fixed `Due_Offset_Days__c` → `Offset_Days__c` in the AC text itself (not just the Technical field), and un-mislabeled `Due_Date__c` as "(formula)" when it's an Apex-maintained plain Date field.
