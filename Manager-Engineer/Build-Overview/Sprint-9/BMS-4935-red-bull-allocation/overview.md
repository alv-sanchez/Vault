---
ticket: BMS-4935
relates: [BMS-4119, BMS-4120, BMS-4121]
domain: Allocation & Launch Planning (OMS / Data-Model)
branch: feat/redbull-allocation-import-bms-4120
status: DONE — on main (a00a3fe5)
sprint: "Sprint 9"
sprint_status: active
sprint_history: []
tags: [manager-engineer, build-overview, allocation]
updated: 2026-07-13
---

# BMS-4935 — Red Bull Allocation Import

> [!success] Build status — **DONE, on main (`a00a3fe5`)**
> Branch `feat/redbull-allocation-import-bms-4120`. New `Supplier_Allocation__c` object + two parse/split CMDTs + config-driven Apex importer + `_T` tests, all merged.
> **Needs an org:** `sf project deploy validate`, run Apex tests, FLS/permset.
> **Placeholder:** warehouse codes + split %s pending the Gulf sample file.

> [!info] New here? Domain primer
> **Gulf Distributing** is a **beverage distributor** — it buys drinks from suppliers (Red Bull) and trucks them to stores. That model is **DSD** (Direct Store Delivery): Gulf's own drivers stock the shelf. Gulf runs **5 warehouses** (Milton FL; Montgomery/Mobile/Huntsville/McCalla AL).
> When a supplier can't make enough for everyone, it **allocates** — rations the scarce product ("you get exactly X cases this week"). **Red Bull does this weekly**, sending Gulf **one total per product**. Gulf must split that one number across its 5 warehouses.
> Two opposite kinds of allocation: **supplier (inbound)** = what Gulf may *receive* (this ticket); **customer (sell-side)** = the most a customer may *buy* from Gulf (the *existing* `Allocation__c`). The mismatch is why we build something new.

> [!note]- Jargon legend (term → plain English)
> - **Distributor** — middleman that buys bulk from suppliers, resells/delivers to stores (Gulf).
> - **DSD** — Direct Store Delivery; the distributor's drivers restock the shelf directly.
> - **Supplier** — the maker (Red Bull); stored as an `Account` (see `Item_Line__c.Supplier__c`).
> - **Allocation** — rationing of scarce product. **Inbound** = cap on what Gulf receives (this ticket); **sell-side** = cap on what a customer buys (`Allocation__c`).
> - **SKU** — one uniquely-identified product = one `Item__c`. **Case** — a box of N sellable units (`Units_Per_Case__c`).
> - **Warehouse split** — dividing one company-wide total into per-warehouse amounts that sum back to it. **Warehouse** = `Location__c` with `Type__c = "Warehouse"`.
> - **Stockout** — a warehouse runs out → lost sales. **Overstock** — too much → waste/markdowns.
> - **`__c`** — custom object/field. **`__mdt` / CMDT** — Custom Metadata Type: config rows shipped in the package, admin-editable, no code deploy.
> - **Aggregate vs per-warehouse** — the single company total vs the 5 rows it explodes into.
> - **External Id** — unique text key matching an incoming row to the right record (so re-imports update, not duplicate).
> - **Idempotent upsert** — insert-or-update where re-running the same week makes no duplicates.

## Domain / User
- **Domain:** Allocation & Launch Planning (OMS / Data-Model).
- **User:** Purchasing analysts; warehouse teams; downstream drivers/customers.

## Issue
Red Bull sends Gulf a weekly allocation spreadsheet (a single aggregate number per SKU/week) that must be split across **5 warehouses** (Milton FL; Montgomery / Mobile / Huntsville / McCalla AL) **by hand** — slow, error-prone, no audit trail.

## Impact
Wasted weekly analyst time; **bad splits → wrong stock at a warehouse** → stockout (lost sales) or overstock (waste). No idempotent re-import, no integrity guarantee that children sum to the supplier total.

> [!example]- Worked split — why a wrong split hurts
> Red Bull sends **1,000 cases** for all of Gulf. Correct split (matching demand): Mobile 30% = 300, Montgomery 25% = 250, Huntsville 20% = 200, McCalla 15% = 150, Milton 10% = 100 → Σ = 1,000 ✓, every warehouse balanced.
> Wrong by hand — analyst gives Mobile 150 (demand 300) and Milton 250 (demand 100): same grand total, but **Mobile stocks out** (150 short → trucks run dry) and **Milton overstocks** (150 too many → expiry/waste). Same total, wrong *distribution* — and the distribution is what hits the shelf. The importer makes the math automatic and validates Σ(children) = aggregate (remainder assigned to the largest-% warehouse so no case is lost to rounding).

## Proposed solution
Build a **new `Supplier_Allocation__c`** object (do **not** extend `Allocation__c`) modeled as an **aggregate parent (supplier total per SKU/week) + per-warehouse child rows**. A **config-driven** CSV importer maps file rows → `Item__c` by **SKU code**, validates, explodes the aggregate across 5 warehouses by configurable %, and **idempotently upserts** on a composite `External_Id__c` (`redbull:{week}:{itemExtId}:{warehouseCode}`). Treated as **inbound / planning only** for v1 (no sell-side enforcement). Upsert via `DmlService` (raw DML is a repo PR blocker).

## Closed open-questions
- ✅ **New `Supplier_Allocation__c`, not extend `Allocation__c`** — `Allocation__c` is a live **order-blocking cap**: `S_AllocationEnforcement` runs in the `Invoice_Item__c` before-insert/update trigger (`enforceOnInsert`/`enforceOnUpdate` → `evaluate()`) and `addError()`s any invoice line over `Allocated_Cases_Remaining__c`. Loading supplier rows there with a warehouse in `Location__c` would make the location tier **block real customer orders** — production-breaking. → separate object the enforcement service never queries.
- 🧠 **Aggregate parent + per-warehouse children** (ratify in refinement) — Gulf sends one aggregate and owns the split; parent + children summing to parent gives an integrity guarantee.
- ✅ **SKU code** as the file→`Item__c` key — changeable to UPC later (additive, no rework; link is to the Item record).
- 🧠 **Inbound / planning only for v1** (ratify in refinement) — sell-side cap noted as possible v2.
- ✅ **Configurable parsing = build now** — config-driven parser (pattern: `LotIdentifierParser` + `Lot_Identifier_Format__mdt`) means the build is **not blocked** on the real file.

## Still open
- 🟠 **Gulf sample file** (config only, not a blocker) — locks exact header labels/order, which Item id the SKU matches, week encoding, CSV-vs-XLSX, qty unit, and the real warehouse codes + split %s.

## What was built
- **`Supplier_Allocation__c`** — `Supplier__c`, `Item__c`, `Location__c` (Warehouse), `Allocated_Case_Amount__c`, `Allocation_Week__c`, `External_Id__c` (unique), `Is_Active__c`, `Parent_Supplier_Allocation__c` (self-lookup).
- **`Allocation_Import_Mapping__mdt`** — one row per source column → target field, data type, required, transform, feed.
- **`Warehouse_Allocation_Split__mdt`** — `Warehouse_Code__c`, `Percent__c`, `Item_Key__c` (blank = default set / set = per-SKU override), `Is_Active__c`. Active set must sum to 100.
- **Apex importer** — `S_AllocationImportConfig`, `S_AllocationCsvParser`, `S_WarehouseAllocationSplit`, `E_SupplierAllocationImport` + `_T` tests.

## Risk / guardrail
Biggest risk = contaminating invoice-item enforcement. The separate `Supplier_Allocation__c` object guarantees the import cannot trip invoice-line blocks via `S_AllocationEnforcement`.

---
<sub>Source of truth: `Open-Questions/BMS-4935-supplier-allocation-data-model.md`. Diagram: `diagram.excalidraw.md`. Web view: `overview.html`.</sub>
