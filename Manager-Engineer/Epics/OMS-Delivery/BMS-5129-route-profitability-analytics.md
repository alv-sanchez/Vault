---
epic: BMS-5129
release_phase: walk
title: "[REQ-202] Route Profitability Analytics"
status: To Do
audit_verdict: Not-Yet
score: 2
stream: S4-OMS-Delivery
executable_children: []
blockers: [BMS-3853]
build_order: []
updated: 2026-06-28
jira: https://ohanafy.atlassian.net/browse/BMS-5129
tags:
  - manager-engineer
  - epic
---

# BMS-5129 — [REQ-202] Route Profitability Analytics

> [!summary] Verdict
> **Not-Yet** · score 2 · stream S4-OMS-Delivery. Real intent and partial substrate exist, but neither child is buildable: no acceptance criteria, the financial data model (budget/cost/margin/comp) doesn't exist, and the feature name collides with an existing, different route-analytics dashboard.

## Audit
- **Children:** 2 total · 0 executable
  - BMS-3853 "Route Profitability Analytics" (Backlog) — CANDIDATE → polish **Contradicted**, not executable. Labeled `polished`/`bk-polish-complete` but has Story/Why/Context and **no ACs**; financial data model absent; scope collides with existing dashboard. See [[BMS-3853-route-profitability-analytics]].
  - BMS-5551 "Strategic reroute KPI view" (Backlog) — EXCLUDED, not refined (3-sentence description, no ACs, created 2026-06-25).
- **Blocked by:** none external. BMS-3853 relates-to BMS-4773 (epic, To Do) and the now-Done COA work BMS-3978 — *Relates*, not blocking links.
- **Shared substrate / overlap:** ⚠ Existing `routeAnalytics` service layer + `routeOptimizationDashboard` LWC (Route Optimization Opportunities) already own "route analytics" — `OHFY-OMS/.../services/routeAnalytics/S_RouteAnalytics.cls`, `OHFY-OMS-UI/.../lwc/routeOptimizationDashboard/`. `Route_Analytics_Settings__mdt`, `Route_Analytics_Warehouse_Access__c` exist. Profitability would touch the same OMS + OMS-UI surface → coordinate to avoid forking metric logic.

## Executable children — live (auto-updates from ticket notes)
> Replace `BMS-XXXX` below with this epic's key. This is a live query over `Tickets/` — never hand-edit a status here.

```base
filters:
  and:
    - file.inFolder("Manager-Engineer/Tickets")
    - epic == "BMS-5129"
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

| Ticket | Why skipped (not refined / blocked / not decomposed) |
|---|---|
| BMS-3853 | Candidate but NOT executable — polish Contradicted: no acceptance criteria; financial data model (budget/cost/margin/driver-comp) does not exist on `Route__c`/`Delivery__c`; name/scope collides with existing Route Optimization analytics surface. 2 open questions. |
| BMS-5551 | Not refined — thin description, no ACs, no metric/UI spec; overlaps 3853. Needs refinement + dedup against 3853 before it's a candidate. |

## Open questions for PO
- [[BMS-3853-financial-data-model]] — where do route cost / driver comp / budget come from, and what object holds them?
- [[BMS-3853-scope-collision-existing-dashboard]] — extend the existing Route Optimization dashboard or build a separate Profitability one; how does 5551 relate?

## Run history
- 2026-06-28 — DRY-RUN audit. Verdict Not-Yet (score 2). 0/2 children executable. 1 candidate (3853, Contradicted), 1 exclusion (5551, not refined). 2 PO questions raised (vault-only).
