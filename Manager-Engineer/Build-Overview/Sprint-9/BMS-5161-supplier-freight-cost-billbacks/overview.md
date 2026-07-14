---
ticket: BMS-5161
title: Supplier Freight Cost Billbacks
domain: Transfers & Regulatory Compliance
relates: [BMS-5789, BMS-5790, BMS-5791, BMS-5792, BMS-4141, BMS-4951, BMS-4952, BMS-5118, BMS-5200]
branch: feat/po-freight-billback-bms-5791
org: bms-5113-5161-integration
status: BUILD IN PROGRESS
sprint: Sprint 9
sprint_status: active
sprint_history: []
po: Elliot Flores
updated: 2026-07-13
tags:
  - manager-engineer
  - build-overview
---

# BMS-5161 — Supplier Freight Cost Billbacks

> [!warning] BUILD IN PROGRESS — branch `feat/po-freight-billback-bms-5791`
> All 3 code tickets have draft PRs open and stacked (#511 → #514 → #516), each independently tested and passing. The 4th child (UI mockup) is parked at Awaiting-UI pending PO approval.

- **Domain:** Transfers & Regulatory Compliance
- **User:** Gulf's AR/finance team, who need to recover freight costs from suppliers instead of Gulf silently absorbing them.
- **Business impact:** When Gulf moves product across state lines, freight cost incurred for a supplier's benefit was going unrecovered — no capture point existed on the transfer, and no path existed from either a transfer or a PO reconciliation into a billback.

## What it is
Captures freight cost on cross-state transfers (and separately, on PO reconciliations where a supplier owes Gulf for inbound freight) and routes both into Gulf's **existing** billback ledger — not a new, parallel recovery system. The epic was originally scoped assuming no billback infrastructure existed; code audit found that premise stale (a mature billback pipeline, BMS-4141, had already shipped), which reshaped this epic from "build a subsystem" to "add a source to a pipeline."

## Intended solution
- **BMS-5789**: adds `Freight_Cost__c` / `Freight_Cost_Source__c` / `Recoverable_Freight_Account__c` / `Is_Cross_State__c` to `Transfer_Group__c` — deliberately source-agnostic, not tied to the truck-builder flow (BMS-5154).
- **BMS-5790**: new `S_FreightBillbackCalculation` mirrors the shipped `S_BillbackCalculation` pattern exactly (idempotent recompute, deterministic External_Ids, stale-line retraction), reached from WMS via a new Tier-1 `FreightBillbackService` interface (Service-Locator, same cross-tier pattern as `DeliveryUpdaterService`).
- **BMS-5791**: a second origination path — `POFreightBillbackService` — for freight discovered at PO reconciliation, scoped narrowly (freight-only; a general PO-reconciliation engine stays out of scope, belongs to BMS-4951).
- **BMS-5792**: mockup done (quick-action entry, single status pill not a lifecycle stepper, multi-row supplier breakdown, field-locking post-Accrued) — awaiting PO approval before any LWC gets built.

## Status / what's built
- **BMS-5789** — draft PR [#511](https://github.com/Ohanafy/OHFY-Split/pull/511), Low risk.
- **BMS-5790** — draft PR [#514](https://github.com/Ohanafy/OHFY-Split/pull/514), Med risk, depends on #511.
- **BMS-5791** — draft PR [#516](https://github.com/Ohanafy/OHFY-Split/pull/516), Med risk, depends on #514.
- **Live-demonstrated end-to-end**: seeded a realistic scenario (Riverbend Brewing Co., 40% funding agreement, Milton FL → Montgomery AL) in the validated integration org — a $1,200 cross-state freight transfer generated a **$480 recoverable billback**, and a $300 PO freight reconciliation generated a **$120 recoverable billback**, both via the real trigger hooks (not a direct service call).
- **BMS-5792** — mockup + 4 design decisions resolved, parked at Awaiting-UI.

## Next phase
Merge order: #511 → #514 → #516. One open question flagged to PO on BMS-5790: the freight-vs-claim audit surface shipped as a `Freight`-only list view (no matched cross-object "both owed on this shipment" report yet, since claims are separate `Claim__c` records). BMS-5792 needs your mockup approval before any LWC build starts.

## Demo
In the validated org, query `Billback__c` filtered to `Type = 'Freight'` — two records: one sourced from a `Transfer_Group__c` ($480 recoverable), one from a `Purchase_Order__c` ($120 recoverable), both at 40% coverage from the same supplier's funding agreement. **Don't say** the UI is ready — there's no LWC yet, this is Apex/data-level proof of the pipeline.
