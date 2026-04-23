---
ticket: BMS-3929
title: Order history & one-click reorder
status: Backlog
type: Story
priority: TBD
phase: 2a
execution_order: 7
labels: [ecom, fast-trackable, gulf, phase-2]
jira: https://ohanafy.atlassian.net/browse/BMS-3929
---

# BMS-3929 — Order history & one-click reorder

> [Jira](https://ohanafy.atlassian.net/browse/BMS-3929) | Phase 2a | Execution Order: 7

## Summary

Gulf's high-value retailers frequently reorder the same product mix. Self-service reorder reduces phone calls, transcription errors, and pricing disputes across 150+ pricing code structures.

## Jira Links

- Blocked by: [[BMS-3930 — Credit Terms & Payment Status]] (credit terms)

## What Already Exists in the Codebase

| Component | Status | Path |
|-----------|--------|------|
| ecomOrderHistory LWC | **COMPLETE** | `lwc/ecomOrderHistory/` |
| Order tabs (orders + products) | **COMPLETE** | Two-tab layout |
| Order filtering (status, time range) | **COMPLETE** | All, Pending, In Transit, Delivered, Cancelled + time ranges |
| Order statistics | **COMPLETE** | Total orders, total spent, pending, completed, avg order value |
| Order search | **COMPLETE** | Search across orders and products |
| Pagination (10, 25, 50, 100) | **COMPLETE** | Both tabs |
| reorderModal LWC | **COMPLETE** | `lwc/reorderModal/` |
| Bulk product selection for reorder | **COMPLETE** | Select items → qty adjust → add to cart |
| Stock availability check on reorder | **COMPLETE** | `loadStockAvailability()` |
| Out-of-stock item separation | **COMPLETE** | Splits available vs unavailable |
| OrderHistoryController (Apex) | **COMPLETE** | `classes/OrderHistoryController.cls` |
| getOrderHistory() | **COMPLETE** | Returns orders with items, totals, payment terms |
| getOrderedProducts() | **COMPLETE** | Returns Account_Item__c (frequently ordered) |
| 1-click full order reorder | MISSING | Must open modal, select items, then add |
| Recurring order templates | MISSING | No saved order preferences |

## What Needs to Be Done

1. Add 1-click "Reorder All" button that adds all items from a past order to cart
2. Validate Gulf pricing codes are resolved correctly on reordered items
3. Handle stock availability changes between original order and reorder
4. Optional: Add recurring order template save/load

## Effort Estimate

**Small** — the order history and reorder flow are fully built. Gulf work is adding a quick-reorder shortcut and validating pricing.

## Dependencies

- **Blocks**: None
- **Blocked by**: [[BMS-3925 — Product Catalog & Availability]] (catalog/pricing for reorder validation)

---

## Completion — Built vs Wanted

**~87% already built** • **~13% Gulf-specific work remaining**

Progress: `█████████████████░░░` (87%)

| Status | Count |
|---|---:|
| Built (COMPLETE) | 13 |
| Partial | 0 |
| Missing | 2 |
| **Total tracked items** | **15** |

**Top gap drivers (what still needs building):**
- 1-click "Reorder All" button (currently requires modal → select → add)
- Validate Gulf pricing codes resolve correctly on reordered items
- Handle stock-availability drift between original order and reorder
- Recurring order templates / saved order preferences (optional)

> **Highest-completion ticket in the epic.** Fast-trackable — primarily a quick-reorder shortcut + Gulf pricing validation.
