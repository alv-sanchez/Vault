---
ticket: BMS-5113
title: DOI Formula Standardization
domain: Purchasing & Supply Planning
relates: [BMS-3822, BMS-3742, BMS-4543, BMS-4544, BMS-4545, BMS-3817, BMS-3779]
branch: feat/doi-invoiced-source-bms-3742
org: bms-5113-doi
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

# BMS-5113 — DOI Formula Standardization

> [!warning] BUILD IN PROGRESS — branch `feat/doi-invoiced-source-bms-3742`
> Core story (BMS-3742) has a draft PR (#513) with 21/21 tests passing, but is flagged **High risk** and gated on a live before/after DOI reconciliation against real invoice data before it can go ready-for-review.

- **Domain:** Purchasing & Supply Planning
- **User:** Purchasing/warehouse planners across Gulf's 5 warehouses who use Days-on-Inventory to decide when to reorder or flag overstock.
- **Business impact:** Inconsistent DOI formulas across departments were producing conflicting inventory-health signals — one warehouse sees a SKU as overstocked, another sees the same brand as critically low — causing duplicated purchase orders and missed replenishment windows.

## What it is
A single, authoritative Days-on-Inventory calculation, computed once and read everywhere — replacing a distorted proxy (day-over-day on-hand decrease, which double-counts transfers and shrink and gets confused by reorder timing) with the source the BMS-3817 spike actually specifies: completed invoiced quantity. Extended with 30/60/90-day lookback windows so trend reporting doesn't need a second calculation.

## Intended solution
Reuses the shipped `S_InventoryDOI` service and nightly `B_InventoryDOI` batch (BMS-3779) almost entirely — this is an **extend**, not a rebuild. The only real change is the sales-rate query: instead of reading `Inventory_History__c` on-hand snapshots, it now aggregates `Invoice_Item__c` (`Status__c = 'Complete'`) base units per item×warehouse across 30/60/90-day windows in one pass, then stamps 9 fields (3 released + 6 additive `_60`/`_90`) onto `Inventory__c`. `Inventory_Threshold__c` (BMS-3822, already merged) supplies the min/target/max DOH bounds for classification.

## Status / what's built
- **BMS-3822** (Inventory Threshold baseline object + resolver) — merged before this session.
- **BMS-3742** (core formula switch + 30/60/90 windows) — draft PR [#513](https://github.com/Ohanafy/OHFY-Split/pull/513), 21 tests passing, includes a before/after proof (old proxy: DOI 24 → new source: DOI 48 on identical fixture data).
- **Live-demonstrated**: seeded a realistic scenario in `bms-5113-doi` (Riverbend IPA, Montgomery AL Distribution Center, 480 units on hand, real invoice history at -5/-45/-75 days) and ran the actual nightly batch — correctly produced **DOI 48 (30d) / 64 (60d) / 72 (90d)**.
- BMS-4543/4544/4545 (Design/Reporting Spike/Reporting Build) — not started; largely pre-answered or pre-delivered per the code audit (see `orientation.html`).

## Next phase
Before BMS-3742 can go ready-for-review: a live before/after DOI reconciliation against a data-populated org (not just seed data), with PO sign-off on the results — this is the explicit High-risk gate, not a formality. After that, BMS-4543/4545 pick up the new 60/90-day fields; BMS-4544 likely closes fast since BMS-3817 already answers most of it.

## Demo
Open `bms-5113-doi`, find the **Riverbend IPA: 1/2 BBL** item at **Montgomery AL Distribution Center** — its `Inventory__c` record shows `Current_DOI__c = 48`, `Current_DOI_60__c = 64`, `Current_DOI_90__c = 72`, `DOI_Status__c = "In Range"`. **Don't say** this is validated against production-scale data — it's a proof-of-mechanism on seeded fixture data, not the pending live reconciliation.
