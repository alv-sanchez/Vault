---
ticket: BMS-4120
epic: BMS-4935
title: "Test Imports — Red Bull Allocation Import"
domain: "Allocation & Launch Planning"
org: "ohfy-val-4120"
screen: "/lightning/n/ohfy__Supplier_Allocation_Import"
demo_review: true
updated: 2026-06-30
jira: https://ohanafy.atlassian.net/browse/BMS-4120
tags:
  - manager-engineer
  - test-import
  - BMS-4120
  - BMS-4935
---

# Test Imports — Red Bull Allocation Import (BMS-4120 · epic [[BMS-4935-red-bull-allocation-import|BMS-4935]])

Sample CSVs for the **Supplier Allocation Import** screen in `ohfy-val-4120`. The importer is mapping-driven; these columns match the deployed `Allocation_Import_Mapping__mdt` for the Red Bull feed.

> [!info] How to run
> 1. Open the screen: `sf org open -o ohfy-val-4120 -p /lightning/n/ohfy__Supplier_Allocation_Import`
> 2. Supplier → **Red Bull** · Feed → **Red Bull**
> 3. Upload one of the CSVs below, then enter the matching **Week** to view the split.

## Column format
`Supplier Item (SKU), Description, Pack Config, Allocation Qty, Week, UPC`
- **SKU** must match an existing Item in the org (RB-25316 … RB-25622 are seeded).
- **Week** must be ISO week format `YYYY-Www` (e.g. `2026-W28`). ⚠️ Non-ISO formats silently return an empty split table (known bug, flagged on the PR).
- **Allocation Qty** is split across the 5 Gulf warehouses by CMDT weights (Milton FL 30 / Montgomery AL 25 / Mobile AL 20 / Huntsville AL 15 / McCalla AL 10).

## Files

### ✅ `BMS-4120-redbull-happy-path.csv` — clean import
8 valid SKUs, **week 2026-W28** (W27 is already seeded, so W28 shows fresh inserts).
**Expect:** 8 accepted, 0 rejected, 40 warehouse children (8 × 5). E.g. 1000 → 300/250/200/150/100.

### ❌ `BMS-4120-redbull-validation-errors.csv` — exercises rejection, **week 2026-W29**
Deliberately broken rows to demo validation:

| Row | SKU | Issue | Expected |
|---|---|---|---|
| 1–2 | RB-25316, RB-25318 | valid | accepted |
| 3 | **RB-99999** | SKU not in catalog | rejected — unrecognized SKU |
| 4 | RB-25320 | qty = `ABC` | rejected — non-numeric quantity |
| 5 | RB-25469 | qty = `-250` | rejected — invalid (negative) quantity |
| 6 | **RB-25316** (again) | same SKU+week as row 1 | rejected — duplicate row |
| 7 | RB-25622 | valid | accepted |

**Expect:** 3 accepted, 4 rejected, with per-row reasons surfaced in the result panel.

## Adding more test imports
Drop new CSVs in this folder named `BMS-<ticket>-<scenario>.csv` and add a row here (or a sibling note) tagged with the ticket. Keep one note per epic so the `test-import` tag stays browsable.
