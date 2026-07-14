---
ticket: BMS-5481
title: Picker Incentive Engine
domain: Warehouse — Labor & Incentives
relates: [BMS-5529]
branch: feat/picker-incentive-engine-bms-5481
org: bms-5481-picker-incentive
status: AUDITED — EXECUTABLE (pending UI mockup + PO/Bryson decisions)
sprint: Sprint 9
sprint_status: active
sprint_history: []
po: Elliot Flores
tier: go-live
labels: [crawl, domain:warehouse, gulf, net-new-requirement, onsite-jun2026, sf-tracker, tier:go-live]
ui: needed
updated: 2026-07-13
tags:
  - manager-engineer
  - build-overview
---

# BMS-5481 — Picker Incentive Engine

> [!success] EXECUTABLE NOW — not blocked on the scan model
> The load-bearing question was: *does the WMS scan task model (#36) that this depends on exist on `main` yet?* **It does — shipped, live, and feeding data.** BMS-5529 is buildable now. The only gates left are a UI mockup approval and three business decisions for Bryson/PO (comp curve, payroll integration scope, rollout timing) — none of which block starting the backend build.

- **Domain:** Warehouse — picker labor performance → bonus.
- **User:** Gulf warehouse pickers (see own running bonus on-device) and warehouse managers (per-picker bonus lookup); biweekly rollups feed payroll.
- **Business impact:** A visible, running bonus tied to pick rate × accuracy nudges pickers toward higher throughput and fewer mis-picks — the core of Gulf's go-live warehouse productivity story. The hard constraint is pay privacy: a picker may never see another picker's pay/bonus.

## The load-bearing finding (executability)
**BMS-5529 is EXECUTABLE on `main` now.** The epic frames it as gated on first building the "scan task model (#36)." Code audit shows that premise is **stale** — the scan model and the whole performance pipeline already exist and run:

- **`Pick_Event__c`** (the scan-in/scan-out task model) — live per-event log, `Picker__c` → **User**, `Event_Type__c` (PICK_COMPLETE / SHORT_PICK / MIS_PICK / SESSION_START/END / scans), timestamps, quantities, breakage. **Written live** by `E_PickPath`, `E_PickPathFulfillment`, `E_ScanValidation`, `E_TransferDockScan` via `S_PickEvent`.
- **`Pick_Performance_Summary__c`** (daily per-picker rollup) — ships with **both bonus operands already computed**: `Cases_Per_Hour__c` (= pick rate) and `Pick_Accuracy__c` = `(Total_Picks − Total_Mis_Picks)/Total_Picks` (= accuracy multiplier input). Re-aggregated nightly by `B_PickPerformanceSummary`.

So "bonus = pick rate × accuracy multiplier" reads straight off an existing daily record. The epic shrinks from *build a labor + incentive subsystem* to *add a bonus formula + payroll-period rollup + a privacy-safe picker view*.

## What must actually be built (BMS-5529 delta)
1. **Bonus-formula config** (recommend a CMDT) mapping rate × accuracy → "total possible payout." None exists on `main`.
2. **Biweekly payroll-period rollup** per picker. Only a *daily* summary exists — grep for `biweekly`/`payroll`/`pay-period` returns zero. New.
3. **Self-scoped picker device view** — own running bonus ONLY (the HR crux; see below). New.
4. **Manager per-picker bonus lookup** — extends the existing manager performance UI with bonus $.
5. **Biweekly bonus report/export → payroll** — likely fast-follow; scope is a Bryson decision.

## The HR constraint is a hard build blocker (resolved in code, not by Bryson)
"Never broadcast pay." The **existing** performance layer is built the wrong way for this: `E_PickPerformance.getPickerRanking` is a **cross-picker leaderboard**, and its query methods take an **arbitrary `pickerId`** with no self-scoping; the shipped dashboard is explicitly a "manager view with leaderboard." Reusing any of these on a picker's device leaks peers' numbers.

**Build rule (enforced, not deferred):** the picker device view gets a **new** controller that forces `UserInfo.getUserId()`, ignores any caller-supplied picker Id, is denied the ranking/leaderboard method, and enforces sharing/FLS. Any design where a picker can reach another picker's bonus is a blocker. This is an architecture decision, not a customer question.

## Wrong-object warning
`Incentive__c` exists but is the **REX/sales-rep goal incentive** (Attainment, Revenue, Supplier, Billback, Goal_Template, Is_Team_Incentive, Is_On_Premises) — not warehouse labor. Do **not** overload it for picker bonuses.

## Open questions — answered, with what still needs Bryson
See `BMS-5481-feedback.md` for the plain-language stakeholder version; full evidence is in `orientation.md`. Summary:

| # | Question | Resolvable from code? | Verdict |
|---|----------|----------------------|---------|
| Q1 | Cutover: does the warehouse switch to the OHFY scan model at go-live, or keep current tooling first (incentive as fast-follow)? | **Split.** The *technical prerequisite* (scan model exists) is RESOLVED. The *operational rollout* is a real Gulf change-mgmt call. | **Bryson** decides rollout timing only. Engineering is unblocked either way — recommend building now, gating the *turn-on*. |
| Q2 | The actual bonus curve — what pick-rate thresholds → what payout, accuracy multiplier scale? | No. Code gives the operands, not the comp policy. | **Bryson/HR** — comp decision. Recommend CMDT-configurable curve + placeholder for demo. |
| Q3 | "Biweekly rollups feed pay" — automated export to Gulf's payroll system, or manager-reviewed report keyed in manually? | No integration exists. | **Bryson** — recommend V1 = manager-reviewed biweekly bonus report/export; automated payroll feed = fast-follow. |
| Q4 | Pay privacy — how do we guarantee a picker never sees another's pay? | **Yes — code.** | **Resolved by architecture** (self-scoped controller). Not a Bryson question. |
| Q5 | Individual bonus only, or team bonuses too? | Story says "their own running bonus" → individual. | Minor **PO** confirm; recommend individual-only V1. |

## Polish verdict
BMS-5529 is already labeled `polished` and its description is sound and well-scoped (crawl tier, clear HR constraint, clear formula intent) — **no churn needed on the body.** Two gaps worth applying (drafted, NOT pushed to Jira — for you to apply):
- **No explicit acceptance criteria.** Drafted set in SESSION.md.
- **The stale-premise + existing-substrate finding isn't recorded**, so an engineer could re-derive #36 as a prerequisite. Recommend adding a note that the scan model + daily summary already exist.
- **Epic BMS-5481's open-question text should be reframed** — the "scan model prerequisite" is satisfied; only rollout + comp-curve + payroll remain for Bryson. (No Jira edit made — cutover is a customer decision, not one to fabricate.)

## Status / next phase
- **Audited, executable.** Branch `feat/picker-incentive-engine-bms-5481`, dedicated org `bms-5481-picker-incentive` (Active, ready).
- **Backend (formula config + biweekly rollup + self-scoped controller)** can start now against `main`.
- **UI (picker device view + manager bonus lookup)** is Tier 4 → produce a mockup and get PO sign-off before building the real component (hard gate).
- **Blocked on decisions:** Q2 (comp curve) and Q3 (payroll scope) shape the deliverable but don't block scaffolding; Q1 governs turn-on, not build.
