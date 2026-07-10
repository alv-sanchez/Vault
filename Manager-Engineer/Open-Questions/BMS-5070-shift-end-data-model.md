---
ticket: BMS-5070
relates: [BMS-4077, BMS-4078, BMS-4079, BMS-4080]
question: "Shift-End Workflow data model — breakage object vs existing fields; first-class Shift object vs existing convention; checklist/pass-down model; 4077 spike disposition"
status: Answered
decided_by: Alvaro Sanchez (+ SME research, code-grounded)
method: warehouse-ops SME agent + OHFY-Split main code evidence + owner input
po: Elliot Flores
jira_comment_url:
raised: 2026-06-29
updated: 2026-06-29
tags:
  - manager-engineer
  - open-question
---

# BMS-5070 — Shift-End Workflow Data Model (resolution)

> [!success] Decision
> **Reuse** existing breakage + shift primitives; **don't** build a `Breakage__c` object or a first-class `Shift__c` object. Build **3 small new objects** (`Shift_End_Checklist__c` + `_Item__c` child + `Shift_Pass_Down__c`) with the checklist as the shift anchor, plus **one optional lookup** to tie cycle counts to the shift. Re-frame the 4077 spike to schema decisions; the build ACs belong to 4078/4080.

## Decisions

| # | Question | Decision |
|---|---|---|
| Q1 | Breakage = new object or reuse? | **Reuse** `Pick_Event__c.Breakage_Quantity__c` → `Pick_Performance_Summary__c.Total_Breakage__c`. Shift-end "review" = a sign-off layer over existing damaged pick events. No `Breakage__c` object. |
| Q2 | First-class Shift object? | **No.** Keep the existing shift Text-key convention; make the new `Shift_End_Checklist__c` the de-facto shift anchor. |
| Q3 | Checklist + pass-down | **Net-new** (confirmed nothing exists): `Shift_End_Checklist__c`, `Shift_End_Checklist_Item__c` (M-D child), `Shift_Pass_Down__c` (child). |
| Q4 | 4077 spike disposition | **Rotation artifact** — spike delivers the ERD + field list + Gulf-confirms; build ACs move to 4078/4080. |

### Confirmed operational answers (owner)
1. **Fixed named shifts per warehouse** → the shift Text-key gets a controlling `Warehouse_Shift_Config__mdt` of valid shift names per warehouse (no free-text drift).
2. **Per-picker breakage, rolled up to shift for finance** → 4080 sources breakage from `Pick_Performance_Summary__c` (picker grain), rolls to the checklist.
3. **One close per warehouse per shift** → `Shift_End_Checklist__c` cardinality = one per warehouse+shift-key.
4. **Simple sign-off for v1** → a review/sign-off flag; a full disposition workflow (write-off / claim / recount) is **v2** (see below).
5. **Pass-down carries forward** → `Shift_Pass_Down__c.Flagged_For_Next_Shift__c` surfaces on the next shift's open checklist.

## How we reached the conclusion (evidence)

**Q1 — reuse, not a new object:** breakage is already first-class. `Pick_Event__c.Breakage_Quantity__c` (populated when `Reason__c=DAMAGED`) sums into `Pick_Performance_Summary__c.Total_Breakage__c` via `S_PickPerformance.cls` (lines ~197-199, 315). A new `Breakage__c` object would fork the source of truth, orphan that working rollup, and force finance (4080) to reconcile two breakage numbers. The shift-end "breakage review" is a **state/sign-off layer over existing DAMAGED pick events**, not a new transaction object.

**Q2 — keep the shift Text key:** the repo treats a shift as a `String` key (warehouse+date+window) on `Replenishment_Task__c.Shift__c` / `Shift_Reset_Log__c.Shift__c`, threaded through `E_ReplenishmentTask.cls` (`getBoard(Id warehouseId, String shift)`). **24 non-test Apex references** rely on this; a first-class `Shift__c` object would be a high-blast-radius migration of live picking/replenishment. Middle path: the new `Shift_End_Checklist__c` becomes the **anchor record** (one per warehouse+shift-key, carrying the same `Shift__c` Text key + `Warehouse__c` lookup); cycle counts / breakage reviews / pass-downs look up to *it* — referential integrity for the workflow without disturbing the existing convention.

**Q3 — net-new checklist/pass-down:** confirmed neither a checklist, handoff, nor pass-down object exists on main. Minimal model:
- `Shift_End_Checklist__c` — `Warehouse__c`(Lookup Location__c), `Shift__c`(Text key), `Shift_Date__c`, `Status__c`(In Progress/Submitted/Approved), `Submitted_By/At__c`, `Approved_By/At__c`, breakage + cycle-count summary fields for finance, `External_Id__c`.
- `Shift_End_Checklist_Item__c` (M-D child) — `Item_Type__c`(picklist), `Is_Complete__c`, `Notes__c`.
- `Shift_Pass_Down__c` (child) — `Note__c`(LongText), `Category__c`(Safety/Equipment/Replenishment/Other), `Flagged_For_Next_Shift__c`, `Author__c`.
- **Cycle-count tie-in (4079):** add an **optional** `Shift_End_Checklist__c` lookup to `Inventory_Log_Group__c` (today it has only `Location__c`+`Log_Date__c`+`Is_Cycle_Count__c`, no shift link). `InventoryCountController.cls` already creates the group → 4079 sets the lookup.

**Q4 — 4077 spike:** its AC currently holds 4078's checklist-init and 4080's submit scenarios verbatim (rotation). Real deliverable = the schema decisions above (ERD + field list + Gulf-confirms); the build scenarios return to 4078/4080.

**Industry grounding:** shift-end checklist + pass-down/turnover-log conventions (SafetyCulture warehouse handover; Shiftbase end-of-shift report; LineView shift handover/OEE) — capture incidents, equipment, what's running low, what next shift must monitor.

## Build sequence
4077 (decisions/ERD) → 4078 (`Shift_End_Checklist__c` + `_Item__c`, breakage-review layer over `Pick_Event__c`, reuse `Total_Breakage__c`) → 4079 (`Shift_Pass_Down__c` + the `Inventory_Log_Group__c` checklist lookup) → 4080 (checklist submission `Status__c` flow + finance rollups sourced from `Total_Breakage__c`).

**REUSE:** `Pick_Event__c.Breakage_Quantity__c`, `Pick_Performance_Summary__c.Total_Breakage__c` + `S_PickPerformance.cls`, the `Shift__c` Text-key convention, `Picker_Shift_Presence__c`, `Inventory_Log_Group__c.Is_Cycle_Count__c`. **BUILD:** the 3 new objects + 2 lookups + `Warehouse_Shift_Config__mdt`.

## v2 / later (noted, not in scope now)
- **Breakage disposition workflow (Q4 v2):** write-off / claim / recount dispositions for finance. v1 ships a simple sign-off flag only.

## Risk / guardrails
- Do NOT change `S_PickPerformance.cls` aggregation or `Pick_Event__c.Breakage_Quantity__c`/`Reason__c` — the daily rollup + `Unique_External_Id__c` (Picker+Date) upsert is load-bearing; the review layer adds a *separate* disposition field, never mutates breakage.
- The `Inventory_Log_Group__c` checklist lookup must be **optional** — `InventoryCountController.cls` creates groups for ad-hoc counts outside any shift; a required lookup breaks that.
- The `Shift__c` Text key is free-form across 24 Apex refs — `Warehouse_Shift_Config__mdt` (fixed named shifts, per #1) tames format drift before the checklist relies on it as a matcher.

---
<sub>Resolved 2026-06-29 from a warehouse-ops SME research pass + OHFY-Split @ main code evidence + owner input. Posted to BMS-5070.</sub>
