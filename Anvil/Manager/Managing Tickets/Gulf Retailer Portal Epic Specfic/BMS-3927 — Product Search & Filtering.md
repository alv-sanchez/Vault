---
ticket: BMS-3927
title: Product search & filtering (category, brand, pack size)
status: Backlog
type: Story
priority: TBD
phase: 2a
execution_order: 5
labels: [ecom, gulf, phase-2, refinement-needed]
jira: https://ohanafy.atlassian.net/browse/BMS-3927
---

# BMS-3927 — Product search & filtering (category, brand, pack size)

> [Jira](https://ohanafy.atlassian.net/browse/BMS-3927) | Phase 2a | Execution Order: 5

## Summary

Retailer buyers need to quickly locate products by category, brand, and pack size without scrolling through Gulf's full catalog. Fast browse drives order volume and reduces follow-up calls to sales reps.

## Jira Links

- Blocked by: [[BMS-3930 — Credit Terms & Payment Status]] (credit terms)

## What Already Exists in the Codebase

| Component | Status | Path |
|-----------|--------|------|
| Search (name + SKU, 400ms debounce) | **COMPLETE** | `ecomShop.js` — `handleSearch()`, `handleSearchChange()` |
| Filter: Product Type | **COMPLETE** | Cascading to families/brands |
| Filter: Brand Family (multi-select) | **COMPLETE** | With search within filter |
| Filter: Brand (multi-select) | **COMPLETE** | With cascading hierarchy |
| Filter: UOM/Pack Size (multi-select) | **COMPLETE** | Via `brandToUOMs` map |
| Filter: Price Range (4 ranges) | **COMPLETE** | Under $25, $25-50, $50-100, Over $100 |
| Filter: Stock Availability | **COMPLETE** | In Stock / Out of Stock |
| Filter: Special Offers (On Promotion) | **COMPLETE** | Promotion filter |
| Sort options (4 modes) | **COMPLETE** | Cart Items First, Price Low/High, Name |
| Filter hierarchy maps (O(1) lookups) | **COMPLETE** | `productTypeToFamilies`, `familyToBrands`, etc. |
| Full-text search (descriptions) | MISSING | Name/SKU only |
| Search autocomplete/typeahead | MISSING | No suggestions |
| Pack size as dedicated filter | MISSING | Currently bundled in UOM |
| Gulf category taxonomy mapping | MISSING | Uses generic OHFY categories |

## What Needs to Be Done

1. Add pack size as a dedicated filter (separate from UOM)
2. Map Gulf's category taxonomy to existing filter hierarchy
3. Optional: Add search autocomplete for product names
4. Optional: Extend search to include product descriptions
5. Validate filter behavior with Gulf's FL/AL catalog overlap

## Effort Estimate

**Small** — the filtering system is comprehensive. Gulf-specific work is mapping their taxonomy and possibly adding pack size as a standalone filter.

## Dependencies

- **Blocks**: None directly
- **Blocked by**: [[BMS-3925 — Product Catalog & Availability]] (catalog data feeds the filters)

---

## Completion — Built vs Wanted

**~71% already built** • **~29% Gulf-specific work remaining**

Progress: `██████████████░░░░░░` (71%)

| Status | Count |
|---|---:|
| Built (COMPLETE) | 10 |
| Partial | 0 |
| Missing | 4 |
| **Total tracked items** | **14** |

**Top gap drivers (what still needs building):**
- Pack size as a dedicated filter (currently bundled in UOM)
- Gulf category taxonomy mapping to existing filter hierarchy
- Full-text search across product descriptions (currently name + SKU only)
- Search autocomplete / typeahead (optional)
