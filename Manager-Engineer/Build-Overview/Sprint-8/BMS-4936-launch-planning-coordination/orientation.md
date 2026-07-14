---
key: BMS-4936
kind: strata-orientation-epic
repo: OHFY-Split
verified_at_sha: 6c07cdeff
generated: 2026-07-08 16:50
packages_touched: ["OHFY-Data-Model", "OHFY-WMS", "OHFY-WMS-UI", "OHFY-OMS", "OHFY-PLTFM", "OHFY-Utilities"]
children: ["BMS-5592"]
tags: [manager-engineer, strata, orientation, epic]
---

# 🪨 Orientation (epic) — BMS-4936 Launch Planning Coordination

> **Thesis:** BMS-4936 adds a cross-functional new-product Launch Plan (record + 4-track readiness checklist) to Allocation & Launch Planning because Gulf coordinates ~16 launches/year informally today and promotions fire before product lands.
> _Code-verified against `OHFY-Split` @ `6c07cdeff` · 2026-07-08 16:50_

## 🎯 Why now
- Gulf onboards new products at high volume (~16 in one recent batch) with no single view of whether a launch is on track — work lives in scattered spreadsheets and people's heads.  `[jira]`
- Suppliers (Red Bull especially) change launch details up to launch day, so the plan must tolerate a moving launch date and surface what is now at-risk.  `[jira]`
- POS/marketing materials are ordered 'shooting from the hip' on a separate track and arrive after product — so POS deployment needs its own tracked lane.  `[jira]`
- 5592 is intentionally the foundation: the two REQ-009 follow-on safeguards (supply-in-position gate, promo-timing guard) both read the readiness this plan tracks — so it is staged, not the whole epic.  `[inferred]`

## 🏛️ Bedrock — what already exists (shared across the epic)
- **Shift-End Checklist: parent Shift_End_Checklist__c + master-detail child _Item__c, with S_ShiftEndChecklist service + ShiftEndChecklistController add/update/getItems — the exact parent-initiate + child-item shape a Launch Plan needs** (BMS-4078) — `OHFY-WMS/.../classes/services/shiftEnd/S_ShiftEndChecklist.cls:9`
- **Master-detail child pattern for checklist items (drives free rollup summaries on the parent)** (BMS-4078) — `OHFY-Data-Model/.../objects/Shift_End_Checklist_Item__c/Shift_End_Checklist_Item__c.object-meta.xml:6`
- **Percent-complete rollup + formula: Display_Run__c counts children (Total_Displays__c COUNT rollup) and derives Display_Compliance__c = active/total — copy-ready shape for a percent-ready field** — `OHFY-Data-Model/.../objects/Display_Run__c/fields/Display_Compliance__c.field-meta.xml:7`
- **Template to children save orchestration: E_HolidayTemplate loads template children in batch and persists transactionally — the pattern for spawning one task per track from config** — `OHFY-OMS/.../classes/executables/holidayTemplate/E_HolidayTemplate.cls:64`
- **At-risk decoupled from persistence: ReplenishmentTaskDTO carries atRisk (bool) + riskBand (text) computed in the service, not stored raw — good shape for launch-task at-risk in the LWC render path** — `OHFY-WMS/.../classes/DTOs/replenishment/ReplenishmentTaskDTO.cls:59`
- **Transactional DML with AccessLevel + allOrNone — every service inserts/updates children through this, not raw DML** — `OHFY-Utilities/.../classes/dml/DmlService.cls:22`
- **Record-page LWC pattern: shiftEndChecklist renders collapsible sections with per-row add/edit gated on status — mirror it for the 4-track layout with progress bars** (BMS-4078) — `OHFY-WMS-UI/.../lwc/shiftEndChecklist/shiftEndChecklist.html:1`
- **Location hierarchy traversal (walk to Warehouse ancestor) if per-warehouse readiness is needed across the 5 sites** — `OHFY-PLTFM/.../classes/executables/locations/E_LocationHierarchy.cls:41`

**From the capability ledger:**
- OHFY-Data-Model · Current DOI stamped nightly by B_InventoryDOI (BMS-3779) — not launch-plan; no launch-plan capability in the ledger yet
- OHFY-WMS · Days of Inventory report type (BMS-3779) — reporting-surface precedent only

## 🧭 Shape
`record-page LWC -> Apex controller -> S_LaunchPlan (template-gen + due-date + rollup) -> Launch_Plan__c ->> Launch_Plan_Task__c (m-d) <- Launch_Track_Config__mdt`

## 🧱 The children — understood one by one

### 1. BMS-5592 — New-Product Launch Plan record + cross-functional readiness checklist  `Review`
> **Thesis:** Adds Launch_Plan__c + a generated 4-track task checklist (owners + back-counted due dates + percent-ready + at-risk) — the foundation the two REQ-009 safeguards read.

**🔨 Delta:**
- [BUILD] **New data model: Launch_Plan__c (parent, Launch_Date__c + readiness %) + Launch_Plan_Task__c (master-detail child: Track, Owner, Lead_Time_Days, Due_Date, Is_Complete, Is_At_Risk) + Launch_Track_Config__mdt for the 4-track template** — The spine. Object shape reuses the Shift-End checklist parent/child pattern; the CMDT track template is new.
- [EXTEND] **Template-driven generation + rollups: on create, spawn one seeded task set per track from the CMDT with Due_Date = Launch_Date - lead-time; percent-ready + per-track ready flip via rollup/formula** — Core automation. Extends E_HolidayTemplate's batch child-save and Display_Run's count-rollup/percent-formula patterns.
- [BUILD] **Cascade recalc + at-risk: trigger/service recomputes all task Due_Dates when Launch_Date__c moves, and flags Is_At_Risk when Due_Date < TODAY & not complete** — Keeps the plan honest under late supplier changes. At-risk reuses the ReplenishmentTaskDTO shape; the cascade itself is unbuilt anywhere — bulkify.

**🎯 Why:** Setting a launch date should auto-build the full to-do list across Purchasing / Warehouse / POS-Marketing / Sales, each task pre-owned and due-dated back from launch. `[jira]` · If launch day moves, every due date shifts and at-risk flags recalculate — because supplier launch details change late. `[jira]` · Turning the plan on must not change how today's pricing/promos/allocations behave (isolation AC). `[jira]`

**⚠️ Watch out:** AC #7 (isolation): the plan must not perturb pricing/promo/allocation — keep it a standalone object graph with no writes into those paths. · AC #3/#5: block launch with no date (half-built plan) and flag at-risk immediately when set up inside a task's lead time — validation + compute must run on insert, not just on date-change.


## ⚠️ Watch out (epic-level)
- Cascade recalc on a moved Launch_Date__c has NO packaged precedent — it is build-fresh (query children -> recompute Due_Date = launch - lead-time -> DmlService.doUpdate). Bulkify: tasks x warehouses can be large; keep it off per-row triggers.
- Percent-ready: a master-detail rollup summary is the cheapest overall %, but per-track readiness ('Purchasing 3/5') needs extra rollup fields or a service-computed breakdown — decide before the schema freezes.
- 5592 is the ONLY groomed child of 4936; the two follow-on safeguards are unbuilt and depend on this readiness — leave readiness queryable, don't pre-build their hooks.
- This baseline is vs origin/main (6c07cdeff). The actual 5592 build lives on feat/launch-plan-checklist-bms-5592 / org ohfy-bms5592 and is NOT merged — regenerate strata after merge before trusting it as ground.

---
_Honesty: reports only what was searched — packages: OHFY-WMS, OHFY-PLTFM, OHFY-Data-Model, OHFY-Utilities, OHFY-OMS, OHFY-WMS-UI · terms: checklist, generate, template, insert new, addDays, Lead_Time, at_risk, overdue, percent, Complete, readiness, rollup, AggregateResult, Location__c, Warehouse__c, DmlService, Trigger.new/old. Absence = **not searched**, not **doesn't exist**. Every prior-art claim is cited to `file:line`/SHA or flagged uncited. "Why" is tagged by source; `inferred` = not confirmed in code. Regenerate — pinned to `6c07cdeff`._
