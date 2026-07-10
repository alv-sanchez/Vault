---
title: Phase One — Locked Down
due: 2026-06-30
generated: 2026-06-29
method: /polish-epic against OHFY-Split @ main (a00a3fe5), read-only
related: "[[_dashboard]]"
tags:
  - manager-engineer
  - phase-one
---

# Phase One — Locked Down (due EOD 2026-06-30)

> [!summary] The honest headline
> Four crawl epics locked in. After polishing every one against `main`, **only BMS-5083 is realistically finishable by EOD** — its hard engineering is already done. The other three are **gated on refinement/direction, not coding**: two have specs that contradict the codebase, one externally blocked on a Gulf file. The bottleneck is *direction*, not capacity.

## 📊 The four at a glance

| Epic | Domain | Polish verdict | What's really going on | EOD? |
|---|---|---|---|---|
| [[BMS-5083-pick-location-capacity\|BMS-5083]] Pick Location Capacity | Master Data / WMS | ✅ **Confirmed** | Core (3785) **Done** in code. Only reporting + design left. No build risk. | ✅ **Yes** |
| [[BMS-5070-shift-end-workflow\|BMS-5070]] Shift-End Workflow | Inventory / WMS-picking | 🟡 **Incomplete** | All 4 children **lack AC**; spike must *reconcile* existing breakage/cycle-count primitives, not greenfield. | 🟡 Start spike only |
| [[BMS-5068-safety-stock-controls\|BMS-5068]] Safety Stock Controls | Inventory | 🟠 **Contradicted** | Spec wants a new object + supplier-tier DOI model; main has a **location-based DOH** framework + no supplier link. Re-scope. | 🟠 No — re-scope |
| [[BMS-4935-red-bull-allocation-import\|BMS-4935]] Red Bull Allocation | Allocation | 🔴 **Contradicted** | No supplier `Allocation__c`, no importer on main. Needs Gulf **sample file** + data model first. | 🔴 No — blocked |

*Swapped out: [[BMS-4936-launch-planning-coordination\|BMS-4936]] Launch Planning (walk, undecomposed) → replaced by BMS-5083.*

---

## 1. BMS-5083 — Pick Location Capacity  ✅ *the finishable one*
- **Issue:** pick locations need min/max stocking levels driven by SKU physical data (case dims, weight), not informal knowledge.
- **Gulf impact:** slotting / replenishment teams, pickers, warehouse-layout planning.
- **Proposed solution:** SKU-attribute-driven capacity rules + compliance reporting.
- **Polish reality:** ✅ `Pick_Location_Assignment__c` + full Apex (`E_PickLocationAssignment.cls`) already ship; capacity derived from `Item__c.Case_Volume__c`. BMS-4245 does **not** gate it.
- **To close by EOD:** collapse the 4466 spike into 4467 — define a small set of capacity-compliance dashboards on `Pick_Location_Assignment__c` and build in one pass; treat 4465 as a demo writeup.

## 2. BMS-5070 — Shift-End Workflow  🟡 *start, don't finish*
- **Issue:** no standardized shift handoff — breakage informal, cycle counts not tied to shifts, pass-down context lost.
- **Gulf impact:** warehouse managers + incoming crews; finance/ops reporting quality.
- **Proposed solution:** checklist → breakage review → cycle counts → pass-down → submission.
- **Polish reality:** 🟡 breakage (`Pick_Event__c.Breakage_Quantity__c`) and a cycle-count flag (`Inventory_Log_Group__c.Is_Cycle_Count__c`) exist; `Checklist__c`, pass-down, and a first-class Shift object don't. **No child has AC.**
- **To progress by EOD:** start the BMS-4077 spike re-scoped around existing primitives; write AC. Build lands later.

## 3. BMS-5068 — Safety Stock Controls  🟠 *re-scope*
- **Issue:** static reorder points can't flex for supplier/seasonal disruptions.
- **Gulf impact:** inventory/demand planners; service levels (stockout risk).
- **Proposed solution:** per-supplier / per-SKU buffer elevation without changing system defaults.
- **Polish reality:** 🟠 `polished` label is misleading. Main ships `SKU_Override__c` + `Inventory_Threshold__c` (DOH, **location-based**) via `S_InventoryThresholds.resolve()`; the ticket's `Safety_Stock_Override__c` + **supplier-tier DOI** model doesn't exist and there's **no item→supplier link**.
- **To progress by EOD:** decide the re-scope (extend DOH framework; is supplier-tier even feasible?). Not a code task yet.

## 4. BMS-4935 — Red Bull Allocation Import  🔴 *blocked on Gulf*
- **Issue:** weekly Red Bull spreadsheet split across 5 warehouses by hand — slow, error-prone, no audit.
- **Gulf impact:** purchasing analysts; warehouse split accuracy; downstream drivers/customers.
- **Proposed solution:** typed supplier `Allocation__c` → import → validate → auto-split → audit.
- **Polish reality:** 🔴 `Allocation__c` is customer/retail (`Customer__c → Account`, type {Launch, Ongoing}), **no `Supplier__c`**, no import framework.
- **To progress by EOD:** waiting on the **Gulf sample file** (requested on BMS-4119) + a data-model decision. Spike first.

---

## ✅ Recommended EOD plan
1. **Ship BMS-5083** — your one real win. Scope + build the capacity dashboards; demo it.
2. **Start BMS-5070's spike** (4077), re-scoped + AC written — visible progress.
3. **Decide BMS-5068's re-scope** — a direction call, not code.
4. **BMS-4935 stays blocked** until Gulf returns the sample file — don't burn EOD time on it.

<sub>Generated from `/polish-epic` runs on `main`. Per-epic detail in `Epics/`. Visual: [[Phase-One.excalidraw]]. Skim version: `Phase-One.html`.</sub>
