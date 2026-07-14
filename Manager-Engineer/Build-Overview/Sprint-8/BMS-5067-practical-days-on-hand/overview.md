---
ticket: BMS-5067
title: Practical Days on Hand
domain: Inventory Management
relates: [BMS-3816, BMS-4542]
branch: TBD
org: TBD
status: IN PROGRESS — child BMS-3816 not yet polished
sprint: "none"
sprint_status: dormant   # BMS-3816 is Done as of Sprint 8, not carried into Sprint 9 (checked 2026-07-13) — verify before resuming
sprint_history: ["Sprint 8"]
po: Elliot Flores
updated: 2026-07-13
tags:
  - manager-engineer
  - build-overview
  - inventory
---

# BMS-5067 — Practical Days on Hand

> [!info] Phase: walk · child BMS-3816 (Target Days on Hand), Backlog
> Part of DOI Formula Standardization (BMS-4542). Confirm BMS-3816 is build-ready via `/polish` vs latest `origin/main` before building.

- **Domain:** Inventory Management
- **User:** Gulf inventory analysts / supply-chain leadership
- **Business impact:** Purchasing runs on ad-hoc averages + tribal knowledge. Without stored **Target DOH** benchmarks per SKU/brand, you get excess inventory tying up space (Huntsville/Milton) or stockouts on high-velocity SKUs (Milton/Mobile). This makes the benchmark a system value, not a spreadsheet.

## What it is
Persist realistic **Practical DOH** targets (storage capacity, supplier cadence, sales velocity) and use them as the reference point for inventory-health evaluation.

## Intended solution (BMS-3816)
- Store **Target DOH** per SKU/brand, **warehouse-specific** (capacity differs by site).
- Derive from **rolling average daily rates** (promo/seasonal aware), not single-day snapshots.
- **Provisional benchmarks** for new items until data-driven targets exist.
- Surface target + **actual-vs-target** in replenishment/planning views.

## Status / what's built
- Nothing built yet. Epic In Progress; BMS-3816 is Backlog. Needs polish → refine → build.

## Next phase
`/polish` BMS-3816 vs latest main → confirm no divergence from DOI standardization (BMS-4542) → claim org → build (Data-Model field + planning view).

## Demo
_None yet._
