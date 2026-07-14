---
epic: BMS-5067
title: "[REQ-140] Practical Days on Hand"
domain: Inventory-Replenishment
release_phase: walk
status: In Progress
org:                          # ohfy-val-5067 EXPIRED — reclaim to re-demo/re-seed BMS-3816
claimed_orgs:
  - "ohfy-val-5067 — RELEASED/EXPIRED (auto-expired; was orgId 00Ddh000009SgC4EAK) — BMS-3816 formula fields + report + demo seed were deployed + validated here"
updated: 2026-07-06
jira: https://ohanafy.atlassian.net/browse/BMS-5067
tags:
  - manager-engineer
  - epic
---

# BMS-5067 — Practical Days on Hand

> [!summary] Polished (2026-07-06 · code-verified)
> Benchmark storage + DOI calc **already shipped** (`Inventory_Threshold__c`, `SKU_Override__c`, nightly `B_InventoryDOI`, `S_InventoryThresholds`, Days-of-Inventory report). Remaining delta = variance surfacing (**BMS-3816**) + spike-docs merge (**BMS-5702**).

## Children
- **BMS-3816** — Practical DOH: target-vs-actual variance at warehouse/location grain. **To Do · Sprint 8 · 3 pts.** Build in progress on `feat/practical-doh-variance-bms-3816`.
- **BMS-5702** — merge the BMS-3817 DOH/DOI spike docs to main.

## Build status (BMS-3816)
- 3 formula fields on `Inventory__c` (`Target_DOH_Variance__c`, `Target_DOH_Variance_Pct__c`, `Target_Variance_Status__c`) + Days-of-Inventory report columns + docs. Committed locally (`09cb2b35`), **deployed + validated clean to `ohfy-val-5067`** (4/4 components, 0 errors).
- Full build detail + decisions: `Build-Overview/Sprint-8/BMS-5067-practical-days-on-hand/SESSION.md`.
- Pending: Chrome smoke (report shows variance columns + blank states) → open PR.

## 🖥️ Claimed orgs (kept until merge)
| Org | Status | Notes |
|---|---|---|
| `ohfy-val-5067` | **ACTIVE** (claimed 2026-07-06, orgId `00Ddh000009SgC4EAK`, instance `miso-capricorn-7107`) | BMS-3816 change deployed + validated. Keep until the 3816 PR merges. |
