---
epic: BMS-5070
release_phase: crawl
title: "[REQ-143] Shift-End Workflow"
domain: "WMS picking / inventory"
user: "Warehouse managers · incoming shift crews · finance/ops reporting"
impact: "Lost crew-to-crew context; informal breakage + cycle counts untied to the shift → dirty finance/ops close data"
build_status: "Done · all 4 children shipped (per Jira)"
demo_pitch: "One shift-end checklist turns scattered breakage reports into a single shrinkage number."
status: Done
audit_verdict: Slice
polish_verdict: Complete
score: 3
stream: S6-Warehouse
phase: 1
locked_down: true
due: 2026-06-30
eod_realistic: true
executable_children: [BMS-4077, BMS-4078, BMS-4079, BMS-4080]
blockers: []
build_order: [BMS-4077, BMS-4078, BMS-4079, BMS-4080]
updated: 2026-07-13
jira: https://ohanafy.atlassian.net/browse/BMS-5070
tags:
  - manager-engineer
  - epic
---

# BMS-5070 — [REQ-143] Shift-End Workflow

> [!summary] Verdict
> **Done** · score 3 · stream S6-Warehouse. All four children (BMS-4077, 4078, 4079, 4080) are **Done in Jira**, and the epic itself is **Done**. AC/data-model concerns from the 2026-06-29 `/polish-epic` pass were resolved (see [[BMS-5070-shift-end-data-model]]) and the build shipped against that plan.

## 🎯 Phase-One brief (locked down · due 2026-06-30)
- **The issue:** Gulf warehouse managers close shifts with **no standardized handoff** — breakage is noted informally, cycle counts aren't tied to shift records, and pass-down context is lost between crews.
- **Who in Gulf is impacted:** **Warehouse managers** + **incoming shift crews** (lost context), and **finance / ops reporting** (dirty, inconsistent close data).
- **Proposed solution:** a structured shift-end workflow — checklist → breakage review → cycle counts tied to the shift → pass-down notes → submission, feeding clean finance/ops data. Spike 4077 → Ph1 4078 → Ph2 4079 → Ph3 4080.
- **Polish reality (vs main):** 🟡 `Incomplete`. Primitives partly exist: breakage is captured per pick stop (`Pick_Event__c.Breakage_Quantity__c`, rolled up in `Pick_Performance_Summary__c.Total_Breakage__c`, used in `S_PickPerformance.cls`); cycle count exists as a **flag** (`Inventory_Log_Group__c.Is_Cycle_Count__c`). **Absent:** a `Checklist__c` object, a **pass-down/handoff** object, and a first-class **Shift** object. So spike 4077's real job is **reconciliation**, not invention — and **no child has AC**.
- **EOD-realistic? 🟡 Partly.** You can *start* the 4077 spike today (re-scoped around existing breakage/cycle-count schema) and write AC, but the build (checklist + pass-down objects) won't land by EOD.

## Audit
- **Children:** 4 total · 4/4 Done (per Jira, confirmed 2026-07-13).
- **Blocked by:** none (old blocker BMS-3793 is Done).
- **Shared substrate / overlap:** WMS-picking — reads `Pick_Event__c` / `Pick_Performance_Summary__c` / `Inventory_Log_Group__c`. ⚠ coordinate with other picking work; not the INV-LOCK.

## Executable children — live (auto-updates from ticket notes)
```base
filters:
  and:
    - file.inFolder("Manager-Engineer/Tickets")
    - epic == "BMS-5070"
formulas:
  open: file.asLink(file.name)
views:
  - type: table
    name: Children
    order:
      - status
      - ticket
    columnSize:
      formula.open: 280
      status: 120
      polish_verdict: 110
      risk: 60
      ui: 70
```

## Children — status (per Jira, confirmed 2026-07-13)
| Ticket | Status |
|---|---|
| BMS-4077 — Spike: checklist + breakage model | Done |
| BMS-4078 — Ph1: checklist + breakage review | Done |
| BMS-4079 — Ph2: cycle counts + pass-down | Done |
| BMS-4080 — Ph3: submission + finance roll-up | Done |

## Open questions for PO / architect
- None open — AC/data-model gaps resolved 2026-06-29 (see [[BMS-5070-shift-end-data-model]]); all children shipped.

## Run history
- 2026-06-29 — `/polish-epic` on main: **Incomplete** (no AC anywhere; spike must reconcile existing primitives). Locked into Phase One. Read-only, no writes.
- 2026-07-13 — `/pulse`: Jira confirms epic + all 4 children **Done**. Note refreshed to match (was stale at "In Progress" / "Incomplete").
