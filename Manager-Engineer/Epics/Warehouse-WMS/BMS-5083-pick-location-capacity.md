---
epic: BMS-5083
release_phase: crawl
title: "[REQ-156] Pick Location Capacity"
domain: "WMS / Master Data Management"
user: "Slotting / replenishment teams · pickers · warehouse-layout planning"
impact: "Over/under-filled bins; replenishment & slotting decisions run on informal knowledge instead of product data"
build_status: "Built (reporting) · feat/pick-capacity-reporting-bms-4467 · core 3785 shipped · needs org"
awaiting_ui_direction: false   # surface is native Salesforce Reports/Dashboards (config), not a custom UI
org:                          # ohfy-val-4467 EXPIRED (auto-expired) — reclaim on resume; branch feat/pick-capacity-reporting-bms-4467 (CMDT+RT; reports env-blocked)
status: In Progress
audit_verdict: Build-Now
polish_verdict: Confirmed
score: 4
stream: S6-Warehouse
phase: 1
locked_down: true
due: 2026-06-30
eod_realistic: true
executable_children: [BMS-4467]
blockers: []
build_order: [BMS-4466, BMS-4467, BMS-4465]
updated: 2026-06-29
jira: https://ohanafy.atlassian.net/browse/BMS-5083
tags:
  - manager-engineer
  - epic
---

# BMS-5083 — [REQ-156] Pick Location Capacity

> [!summary] Verdict
> **Build-Now (thin remainder)** · score 4 · stream S6-Warehouse. `/polish-epic`: **Confirmed** — the hard engineering (BMS-3785) is genuinely **Done** and grounded in code; **no Apex/data-model risk remains**. Only a reporting build + design pass are open. The **one locked-down epic realistically closable by EOD.**

## 🎯 Phase-One brief (locked down · due 2026-06-30)
- **The issue:** Gulf pick locations need to enforce **min/max stocking levels** that reflect each SKU's physical characteristics (case dimensions, weight, handling) — so replenishment and slotting are governed by product data, not informal warehouse knowledge.
- **Who in Gulf is impacted:** **Warehouse slotting / replenishment teams** and **pickers** (right product in right-sized location), and **warehouse-layout planning**.
- **Proposed solution:** associate SKU attributes with location capacity rules; surface capacity-compliance reporting. Core build = BMS-3785; design = BMS-4465; reporting spike + build = BMS-4466 / BMS-4467.
- **Polish reality (vs main):** ✅ `Confirmed`. `Pick_Location_Assignment__c` ships with `Min_Capacity__c` / `Max_Capacity__c` / `Calculated_Max_Capacity__c` / `Capacity_Override_Reason__c`, plus full Apex (`E_PickLocationAssignment.cls`, `PickLocationAssignmentTriggerService.cls`, `CapacityResultDTO`). Capacity is derived from `Item__c.Case_Volume__c`/case dims — so **BMS-4245 (keystone) does NOT gate this epic**.
- **EOD-realistic? ✅ Yes (the one that is).** Collapse 4466→4467: define a small set of capacity-compliance reports/dashboards on `Pick_Location_Assignment__c` and build in one pass; treat 4465 as a demo writeup. No build risk remains.

## Audit
- **Children:** 4 total — BMS-3785 (Done, ✅ Confirmed), BMS-4465 (design), BMS-4466 (reporting spike), BMS-4467 (reporting build).
- **Blocked by:** none. BMS-4245 historically linked but **not a real gate** (3785 shipped without it).
- **Shared substrate / overlap:** WMS / Data-Model `Pick_Location_Assignment__c` + `Item__c` case dims. Disjoint from the INV-LOCK and from the transfer cluster.

## Executable children — live (auto-updates from ticket notes)
```base
filters:
  and:
    - file.inFolder("Manager-Engineer/Tickets")
    - epic == "BMS-5083"
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

## Not-yet-executable children
| Ticket | Why skipped |
|---|---|
| BMS-3785 — Pick Location Capacity (build) | **Done · Confirmed.** Fully grounded in `Pick_Location_Assignment__c` + Apex. No remaining work. |
| BMS-4467 — Reporting build (capacity dashboards) | **Incomplete** — buildable, but depends on the 4466 spike to define metrics. The real EOD target if you scope the dashboards yourself. |
| BMS-4466 — Reporting spike | **Unverifiable** — metrics-definition investigation; collapse into 4467. |
| BMS-4465 — Design / Prototype / Demo | **Unverifiable** — design artifact; treat as a demo writeup. |

## Open questions for PO / architect
- Define the small set of capacity-compliance reports/dashboards on `Pick_Location_Assignment__c` (collapses 4466 → 4467). Otherwise none — no build risk.

## Run history
- 2026-06-29 — `/polish-epic` on main: **Confirmed** core (3785 Done, grounded). Remainder = reporting (4467, gated on 4466 spike) + design (4465). 4245 not a gate. Locked into Phase One as the EOD-finishable epic. Read-only, no writes.
