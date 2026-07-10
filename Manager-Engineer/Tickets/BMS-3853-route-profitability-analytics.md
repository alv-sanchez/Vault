---
ticket: BMS-3853
title: "Route Profitability Analytics"
epic: BMS-5129
status: Queued
polish_verdict: Contradicted
executable: false
risk: High
ui: needed
stream: S4
track:
packages_touched: [OHFY-Data-Model, OHFY-OMS, OHFY-OMS-UI]
blocked_by: []
blocks: []
branch:
pr:
dod_met: false
updated: 2026-06-28
jira: https://ohanafy.atlassian.net/browse/BMS-3853
tags:
  - manager-engineer
  - ticket
---

# BMS-3853 — Route Profitability Analytics

> [!info] Status
> **Queued** · polish Contradicted · risk High · stream S4 · UI needed

## 🎨 UI/UX approval (only if `ui: needed`)
Build stops here until you approve. Analytics dashboard surface → `ui: needed`.
- Mockup: not generated (ticket not executable — see below)
- [ ] **Approved by you**
- Change requests: …

## Polish findings (against OHFY-Split @ main)
| Claim | Verdict | Evidence (file:line) |
|---|---|---|
| "Route Profitability Analytics" surface | Contradicted | A *Route Optimization Opportunities* dashboard already exists and owns the "route analytics" name/CMDT — different intent (consolidation/clustering, not P&L). `OHFY-OMS/.../classes/services/routeAnalytics/S_RouteAnalytics.cls:1-11`; LWC `OHFY-OMS-UI/.../lwc/routeOptimizationDashboard/` |
| "combine actual cost against budget" (budget vs actual) | Unverifiable | No budget or actual-cost data anywhere. `Route__c` has 19 fields, none budget/cost/margin: `OHFY-Data-Model/.../objects/Route__c/fields/` (Driver, Vehicle, Warehouse, Frequency, Cutoff…). No `*budget*`/`*headcount*` object exists. |
| "profitability / margin / cost-to-serve" metric | Unverifiable | grep `profitab|cost-to-serve|margin` in OMS/OMS-UI hits only the CTC suggestion engine and CSS, not route P&L. No profitability roll-up field on `Route__c` or `Delivery__c`. |
| "truck utilization, delivery volume, headcount" | Partial | Volume primitives exist on `Delivery__c` (`Total_Cases__c`, `Total_Stops__c`, `Total_Weight__c`, `Service_Ratio__c`) but no utilization target or headcount field to compare against. `OHFY-Data-Model/.../objects/Delivery__c/fields/` |
| "two audiences — finance sees cost/margin, ops sees operations" (visibility split) | Unverifiable | A `Route_Analytics_Warehouse_Access__c` junction exists (User/Warehouse) for warehouse-scoped access, but there is no field-level/audience cost-vs-ops split modeled. `OHFY-Data-Model/.../objects/Route_Analytics_Warehouse_Access__c/fields/` |
| "delivery vs sales route distinction" | Confirmed | Both modeled: `Route__c` + `Sales_Route__c`/`Sales_Route_Stop__c`/`Account_Route__c`. |
| Acceptance Criteria present | Contradicted | Description has Story Statement / Why / Gulf Context only — **no Acceptance Criteria, no metric definitions, no UI spec.** Not buildable as written. |

## Implementation brief
- Packages (anticipated, once defined): OHFY-Data-Model (new budget/cost/margin fields + roll-ups on Route__c / new period object), OHFY-OMS (profitability calc service), OHFY-OMS-UI (dashboard LWC).
- Approach: **Blocked on definition.** Cannot proceed: (1) no ACs; (2) the financial data model (budgeted routes per warehouse, route cost-to-serve incl. driver comp, actual vs budget) does not exist and the source of cost/comp data is unspecified; (3) name/scope collides with the existing routeOptimization analytics surface — must decide extend vs new.
- Files expected to change: TBD after PO answers.

## Build log (append-only)
- 2026-06-28 — DRY-RUN audit. Not started. Not executable: missing ACs, missing financial data model, scope collision with existing route analytics dashboard.

## Definition of Done
- [ ] Polish clean (no open Contradicted / blocker)
- [ ] Implemented per AC
- [ ] Tests pass
- [ ] PR opened
- [ ] No unresolved open question

## Handoff (only if risk ≥ Med)
Nothing built. This is a decomposition/definition problem, not an implementation one. Needs PO to (a) supply ACs + metric formulas, (b) decide the cost/comp data source and budget model, (c) rule on extend-vs-new vs the existing Route Optimization dashboard. See `Open-Questions/BMS-3853-*`.
