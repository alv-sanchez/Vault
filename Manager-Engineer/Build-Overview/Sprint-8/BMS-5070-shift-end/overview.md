---
ticket: BMS-5070
title: Shift-End Workflow
domain: WMS / Warehouse Ops
status: BUILD IN PROGRESS
branch: feat/shift-end-workflow-bms-4078
relates:
  - BMS-4077
  - BMS-4078
  - BMS-4079
  - BMS-4080
sprint: "none"
sprint_status: dormant   # Epic + all 4 children confirmed Done in Jira (checked 2026-07-13), not in Sprint 9. `status:` above is stale — see Epics/Warehouse-WMS/BMS-5070-shift-end-workflow.md for the corrected Done status.
sprint_history: ["Sprint 5", "Sprint 6", "Sprint 7", "Sprint 8"]
po: Elliot Flores
updated: 2026-07-13
tags:
  - manager-engineer
  - build-overview
---

# BMS-5070 — Shift-End Workflow

> [!info] Build status — BUILD IN PROGRESS
> Branch `feat/shift-end-workflow-bms-4078`. Builds **Ph1: the shift-end checklist + breakage review** on new WMS objects — **`Shift_End_Checklist__c`**, **`Shift_End_Checklist_Item__c`**, **`Shift_Pass_Down__c`**. **Org:** `ohfy-val-4078`.

- **Domain:** WMS / Warehouse Ops · Customer: Gulf Distributing (beverage DSD)
- **User:** Warehouse supervisors (open + complete checklist) · Incoming crew (receive pass-down notes) · Finance / ops (shrinkage reporting — Phase 3)

## New here? Shift-end / warehouse ops primer

New to warehouse operations *and* Salesforce? Read this first.

- **Shift** — a defined working period in the warehouse (Day, Night, Mid). Gulf runs day/night shifts across all 5 warehouses; Milton FL also has a mid-shift. Each shift is a different crew supervised by a different person.
- **Breakage** — product damaged during a shift (dropped cases, spills, damaged-on-arrival). It must be recorded so it can be counted against inventory and reported to finance.
- **Shrinkage** — the total unaccounted loss of product. Breakage is the most common category. Without a formal checklist, breakage quietly becomes invisible shrinkage.
- **Pick event** — a warehouse scan event recorded when a picker completes a pick or short-picks. Breakage events (`Pick_Event__c` with `Reason__c = DAMAGED`) accumulate throughout the shift.
- **Shift handoff** — the moment when one shift ends and the next crew arrives. Critical information (breakage found, replenishment gaps, safety issues) must transfer reliably.
- **Pass-down note** — a written note from the outgoing supervisor to the incoming crew. Phase 1 seeds the `Shift_Pass_Down__c` object; structured pass-down entry is Phase 2.
- **Checklist item** — a category checkpoint on the shift-end checklist (Safety, Equipment, Replenishment, Other). A supervisor walks through these before closing the shift.
- **`__c`** — Salesforce suffix for a **custom** object/field.
- **Rollup** — a field summing/counting child records onto a parent. The `Total_Breakage_Cases__c` rollup on the checklist is **Phase 3** (BMS-4080).

> [!example] Worked example
> A Milton FL mid-shift runs 11 PM–7 AM. Three pickers each damage some cases during picks.
> At 6:45 AM the supervisor opens the shift-end checklist, reviews the 9 breakage events (34 total cases), works through Safety/Equipment/Replenishment/Other items, leaves a pass-down note about a cracked floor tile, and saves. The incoming day-shift supervisor sees the exact state of the warehouse before walking the floor.

### Jargon legend

| Term | Plain meaning |
|---|---|
| Shift-end checklist | The one screen a supervisor opens to close a shift: review breakage, work through checklist items, leave pass-down notes. |
| Breakage | Damaged product found or caused during a shift. Sourced from `Pick_Event__c` damaged events. |
| Shrinkage | Total unaccounted product loss; breakage is the main component. |
| Pass-down note | A written note from outgoing supervisor to incoming crew. |
| Checklist item | A category checkpoint (Safety / Equipment / Replenishment / Other). |
| Rollup | A field summing children onto the parent; `Total_Breakage_Cases__c` is a Phase-3 rollup. |
| `__c` | Salesforce suffix for a custom object/field. |
| Phase 1 (BMS-4078) | Built: checklist screen, breakage review, seed checklist items and pass-down notes. |
| Phase 2 (BMS-4079) | Future: formal cycle counts tied to the shift, structured pass-down entry. |
| Phase 3 (BMS-4080) | Future: checklist submission, `Total_Breakage_Cases__c` rollup, finance reporting. |

## Issue · Impact · Proposed solution

- **Issue** — At the end of every warehouse shift, supervisors have no structured checklist or formal breakage-review screen. Breakage events accumulate in `Pick_Event__c` throughout the shift but are never consolidated into a shift-level total. Crew handoffs are verbal; nothing is written. The night shift leaves and the day shift walks in blind.
- **Impact** — Breakage disappears into invisible shrinkage. Finance closes the books on guesswork. No shift-level accountability: a loss can't be tied to a crew or a shift. Repeat patterns (same picker, same aisle, same shift type) are invisible.
- **Proposed solution** — Build a shift-end checklist screen (`Shift_End_Checklist__c`) that a supervisor opens once at shift close. It aggregates breakage from `Pick_Event__c` damaged events, presents a four-category checklist (Safety / Equipment / Replenishment / Other), and provides a place for pass-down notes to the incoming crew. Phase 3 will close the loop with a single `Total_Breakage_Cases__c` rollup and finance reporting.

## Key framing

Ph1 is strictly **supervisor-facing, shift-close only** — it surfaces existing `Pick_Event__c` breakage data into a consolidated view, does not re-collect or modify the underlying events. The `Total_Breakage_Cases__c` field on the checklist reads 0 in Ph1 because the rollup trigger is **BMS-4080 (Phase 3, not yet built)**. The real breakage total (34 cases in the demo) comes from the breakage-events list the screen loads at runtime. This is a **known Phase-1 gap, not a bug** — document it clearly when demoing.

## Closed questions

- ✅ **New dedicated objects** — `Shift_End_Checklist__c` / `Shift_End_Checklist_Item__c` / `Shift_Pass_Down__c` sourced from `Pick_Event__c` damaged events. No reuse of invoice or AR objects.
- 🧠 **Shift identification** — checklist is keyed by `(Warehouse__c, Shift__c, Shift_Date__c)`; `S_ShiftEndChecklist.initiate()` creates or retrieves the existing record.
- 🧠 **Breakage sourcing** — `S_BreakageReview.getDamagedEvents()` windows by GMT day: `Timestamp__c >= dayStart AND < dayEnd`. Events are read-only from the checklist screen.
- 🧠 **Tab access** — granted via `Demo_Shift_End_Tab` permission set. Screen path: `/lightning/n/ohfy__Shift_End_Checklist`.

## Still open

- 🟠 **Cycle-count configuration** — which bin positions require a spot-count at shift end, and how often? **Gulf, via Elliot.** Phase 2 deliverable; build configurable, not a Ph1 blocker.
- 🟠 **Submission rules** — does checklist submission require all items complete, or just a signature? Threshold config pending. **Phase 3 (BMS-4080).**

## What's being built

- **`Shift_End_Checklist__c`** — (Warehouse__c, Shift__c, Shift_Date__c, Status__c, Total_Breakage_Cases__c). Status: In Progress → Submitted (Ph3).
- **`Shift_End_Checklist_Item__c`** — child items (Item_Type__c: Safety / Equipment / Replenishment / Other, Notes__c, Is_Complete__c).
- **`Shift_Pass_Down__c`** — pass-down notes from outgoing to incoming crew (Category__c, Note__c, Flagged_For_Next_Shift__c).
- **`ShiftEndChecklistController`** — LWC Apex controller: `loadChecklist(warehouseId, shift, shiftDate)` returns checklist + items + damagedEvents + passDowns bundle.
- **`S_ShiftEndChecklist`** + **`S_BreakageReview`** — service layer.
- **LWC `shiftEndChecklist`** — the single-page supervisor screen in OHFY-WMS-UI.
- **`Demo_Shift_End_Tab`** permission set — grants tab visibility for the demo org.

> [!warning] Known Ph1 gap
> `Total_Breakage_Cases__c` reads **0** — the rollup is BMS-4080 (Phase 3, not built). The screen shows the real breakage total (34 cases in the demo) by summing the events list at runtime. Mention this proactively when demoing — it is expected, not broken.

---
<sub>Generated 2026-06-30 from branch `feat/shift-end-workflow-bms-4078`, verified org `ohfy-val-4078`, and seed script `seedShiftEndChecklistDemo.apex`. Diagram: `diagram.excalidraw.md`.</sub>
