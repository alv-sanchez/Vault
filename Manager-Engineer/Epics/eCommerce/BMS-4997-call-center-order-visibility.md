---
epic: BMS-4997
release_phase: run
title: "[REQ-070] Call Center Order Visibility"
status: In Progress
audit_verdict: Not-Yet
score: null
stream: S1-eCommerce
executable_children: []
blockers: []
build_order: []
updated: 2026-07-23
jira: https://ohanafy.atlassian.net/browse/BMS-4997
tags:
  - manager-engineer
  - epic
---

# BMS-4997 — [REQ-070] Call Center Order Visibility

> [!summary] Verdict
> **Not-Yet** · stream S1-eCommerce · phase **run**. Newly picked up (To-Do → In Progress on the 2026-07-21 pulse). Both child stories are **pending decomposition/grooming** — nothing is cleanly executable until they carry real AC. First build artifact exists: **draft PR #612** (`feat/call-center-order-visibility-reporting-bms-4997`), hand-worked.

## What it's for
Call-center teams handle inbound orders but lack consolidated context. This epic delivers **purpose-built agent dashboards** that surface, in one view: **account insights, active promotions, ordering history, and current order status** — so agents can respond faster and catch upsell/MBO opportunities. Related initiative: **BMS-4717**.

## Audit
- **Children:** 2 total · **0 executable** (both need grooming).
- **Blocked by:** none external recorded. Internal: both stories undecomposed → gates buildable scope.
- **Shared substrate / overlap:** OMS / OMS-UI (agent-facing console). ⚠ Coordinate package-overlap with the active Pricing-Manager wave and Short Pay (#582) before scheduling — same OMS/OMS-UI neighborhood. The "active promotions" surface presupposes the same MBO/promotion-eligibility object flagged as a prerequisite in the E-Commerce work (upstream, not an e-comm/agent-console task).
- **Not code-grounded yet** — no `/polish` pass run against these children; treat scope as provisional until groomed.

## Children
| Ticket | Status | Notes |
|---|---|---|
| [BMS-3858](https://ohanafy.atlassian.net/browse/BMS-3858) | Backlog / To Do | Call Center Order Visibility — pending decomposition & grooming |
| [BMS-3922](https://ohanafy.atlassian.net/browse/BMS-3922) | Backlog / To Do | Call Center Order Visibility — pending decomposition & grooming |

## Build artifacts
- **PR #612** (draft) — `feat/call-center-order-visibility-reporting-bms-4997`. First artifact for the newly-active stream; hand-worked, not auto-dispatched.

## Open items
- **Groom + decompose** BMS-3858 / BMS-3922 into executable stories with real AC (run a `/polish` pass on the next Jira-connected session).
- Confirm the **promotion-eligibility data source** dependency (shared with E-Commerce) before building the "active promotions" panel.
- No dev org currently claimed for this epic.
