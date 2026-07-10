---
ticket: BMS-5083
title: Pick Location Capacity
domain: WMS / Master Data Management
status: DONE — on main (a00a3fe5)
branch: feat/pick-capacity-reporting-bms-4467
relates: [BMS-4463, BMS-3785, BMS-4465, BMS-4466, BMS-4467]
po: Elliot Flores
updated: 2026-06-29
tags:
  - manager-engineer
  - build-overview
---

# BMS-5083 — Pick Location Capacity

> [!success] Build status — DONE, on main (`a00a3fe5`)
> Branch `feat/pick-capacity-reporting-bms-4467`. Core build (BMS-3785, `Pick_Location_Assignment__c`) was already shipped. This epic added the **native reporting layer**: a packaged custom report type + 3 reports + 1 dashboard + a per-warehouse config CMDT.
> **Needs an org:** deploy + report/dashboard folder sharing + set the dashboard running-user.

**Domain:** WMS / Master Data Management
**User:** Slotting / replenishment teams · pickers · warehouse-layout planning

> [!info] New here? Warehouse-slotting primer
> - **Pick location / bin:** a specific slot a picker pulls product from. **Capacity** = how many cases of a SKU physically fit there (beverage DSD → unit is cases).
> - **Slotting:** deciding which product goes in which slot and how much. Better slotting = less walking, fewer refills, no jammed/empty bins.
> - **Min / Max:** Max = don't overfill; Min = refill trigger. Both driven by the SKU's physical size (`Case_Volume__c`, case dims) so a big case isn't over-assigned to a small slot.
> - **"Informal knowledge → product data":** capacity that lives in workers' heads becomes governed system data.
> - **"Reclassification Recommended":** system flag that a slot no longer fits its SKU → review for re-slotting.

**Jargon:** `__c` = custom object/field · `__mdt` (CMDT) = config that upgrades centrally with the package · **Report Type** = defines which object+fields a report may use · **Report/Dashboard** = native point-and-click (no code) · **LWC** = custom-coded UI (deliberately *none* here) · **managed package upgrade** = why native report types ship to every org centrally.

## Issue · Impact · Solution

| | |
|---|---|
| **Issue** | No system-enforced min/max stocking by SKU physical size — it lives as informal picker knowledge, and there is no reporting on capacity compliance, override behavior, or reclassification need. |
| **Impact** | Over/under-filled bins; replenishment + slotting run on guesswork; no visibility into where assignments breach capacity or why pickers override. |
| **Solution** | Core `Pick_Location_Assignment__c` (capacity fields) already shipped under 3785. Build a **native reporting layer** — a packaged custom report type + 3 reports + 1 reference dashboard — plus a **per-warehouse min-% config** (`Pick_Capacity_Warehouse_Config__mdt`) that feeds compliance thresholds. **No custom LWC.** |

## Closed questions

- ✅ **Keep BMS-5083 canonical.** 5083 holds all 4 children (3785 Done, 4465, 4466, 4467); 4463 has zero. Flagged 4463 to **Elliot** to close as duplicate (port the requirement link/labels).
- 🧠 **Native Reports/Dashboards + a packaged custom report type — NO LWC.** Compliance reporting (over-capacity %, override rate by reason, reclassification counts) is aggregate/filter/group; native covers it. The repo already ships packaged report types, so the type + reference dashboard upgrade centrally while customer instances/filters/folders stay per-org config.
- 🧠 **Warehouse-specific min %** (not a uniform 25%) — a per-warehouse config keyed by warehouse code feeds the thresholds.
- 🧠 **Fix BMS-3785's doc-only noun drift** (3785 is Done; corrections are documentation-only):

| AC/Tech doc says | Real on main |
|---|---|
| `Product__c` | `Item__c` |
| `Quantity_Needed__c` | `Quantity__c` (on `Replenishment_Task__c`) |
| `Replenishment_Request__c` | `Replenishment_Task__c` |
| "velocity tier" (no field) | `Priority__c` / `Replenishment_Rank__c` |

  Report only off the real schema: `Pick_Location_Assignment__c` joined to `Item__c` + `Replenishment_Task__c`. (`Inventory__c` reference is fine — it exists.)

## Still open

- 🟠 **Per-warehouse % values (Gulf):** the actual per-warehouse min-default numbers — config only, not a blocker. The CMDT ships with **5 placeholder records at 25%**.
- 🟠 **Elliot (PO):** bless closing BMS-4463 as duplicate (flagged on 4463, comment #54837).

## The capacity fields (plain English)

On `Pick_Location_Assignment__c` — one record per "this SKU lives in this slot":

| Field | Means |
|---|---|
| `Calculated_Max_Capacity__c` | Cases the system says fit = `floor(Location.Cubic_Volume__c / Item.Case_Volume__c)`. Set at creation, immutable. |
| `Max_Capacity__c` | Effective max actually used. Defaults to Calculated; supervisor may override. |
| `Capacity_Override_Reason__c` | Required when Max ≠ Calculated. Picklist: Structural Constraint / Safety Limit / Operational Preference / Other. |
| `Min_Capacity__c` | Refill trigger — drop below → replenishment fires. |
| `Reclassification_Recommended__c` | Checkbox set by the DOH engine when a SKU's velocity outgrew its slot → review for re-slotting. |

**How Calculated Max is derived** (real code: `E_PickLocationAssignment.calculateCapacity`): `Case_Volume__c = (L × W × H) / 1728` cu ft, divided into the bin's `Cubic_Volume__c`, floored (can't store a fraction of a case). Missing dims → manual entry.

**Why native reports, not an LWC:** the asks (over-capacity %, override rate by reason, reclass counts) are aggregate/filter/group — native handles it with zero code to maintain, and the report type + reference dashboard upgrade centrally via the managed package. An LWC would be cost with no payoff.

## What was built

- **Packaged custom report type** on `Pick_Location_Assignment__c` (joined to `Item__c` + `Replenishment_Task__c`) — defines the field palette reports draw from.
- **3 reports:** (1) capacity compliance, (2) override-rate by reason, (3) reclassification-recommended queue.
- **1 dashboard** over those reports.
- **`Pick_Capacity_Warehouse_Config__mdt`** — per-warehouse min % (`Warehouse_Code__c` + `Min_Default_Percent__c`), 5 placeholder records (HSV, BHM, MOB, MLT, PEN) at 25%.

---
<sub>Generated 2026-06-29 from `Open-Questions/BMS-5083-canonical-and-reporting.md` (code-grounded SME + owner input). Diagram: `diagram.excalidraw.md`.</sub>
