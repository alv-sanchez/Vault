---
ticket: BMS-4054
title: "Retailer Portal Product Card — Ph 2: Grid Layout + Reuse"
status: Backlog
type: Story
priority: TBD
phase: 2b
execution_order: 9
labels: [decomposed-from-BMS-3924, ecom, gulf, phase-2]
jira: https://ohanafy.atlassian.net/browse/BMS-4054
parent: BMS-3924
---

# BMS-4054 — Retailer Portal Product Card — Ph 2: Grid Layout + Reuse

> [Jira](https://ohanafy.atlassian.net/browse/BMS-4054) | Phase 2b | Execution Order: 9

## Summary

Responsive product grid layout that reuses the Ph 1 card component across catalog browsing, search results, and reorder history. Must work on desktop (warehouse office) and tablet (sales rep in field).

## Jira Links

- Relates to: [[BMS-3924 — Product Card & Grid Components]] (parent: Product card & grid)
- Preceded by: [[BMS-4053 — Product Card Ph 1 — Card Component]] (Ph 1: Card Component)

## What Already Exists in the Codebase

| Component | Status | Path |
|-----------|--------|------|
| ecomShop grid layout | **COMPLETE** | `lwc/ecomShop/ecomShop.html` |
| Pagination (25, 50, 100, 200 items) | **COMPLETE** | Page size selector |
| Product rendering across contexts | PARTIAL | Cards are inline in ecomShop, not reusable across components |
| Responsive layout | PARTIAL | Tailwind grid but not tablet-optimized |
| Grid in reorder modal | PARTIAL | `lwc/reorderModal/` uses its own card rendering |
| Grid in order history products tab | PARTIAL | `lwc/ecomOrderHistory/` uses its own product rendering |
| Unified card component | MISSING | Each context renders its own card markup |
| Tablet-optimized responsive grid | MISSING | No explicit tablet breakpoints |

## What Needs to Be Done

1. Create responsive grid container component that accepts any array of products
2. Integrate Ph 1 card component into grid
3. Replace inline card rendering in ecomShop, reorderModal, ecomOrderHistory with shared grid
4. Add tablet breakpoints (sales reps use tablets in the field)
5. Test grid across desktop, tablet, and mobile viewports

## Effort Estimate

**Medium** — grid patterns exist in multiple components. Work is unifying them into one reusable grid + card system.

## Dependencies

- **Blocks**: None (improves consistency, not a functional blocker)
- **Blocked by**: [[BMS-4053 — Product Card Ph 1 — Card Component]] (Ph 1 card must exist first)

---

## Completion — Built vs Wanted

**~50% already built** • **~50% Gulf-specific work remaining**

Progress: `██████████░░░░░░░░░░` (50%)

| Status | Count |
|---|---:|
| Built (COMPLETE) | 2 |
| Partial | 4 |
| Missing | 2 |
| **Total tracked items** | **8** |

> Grid-like patterns exist in `ecomShop`, `reorderModal`, and `ecomOrderHistory`, but each renders its own card markup — those rows count as PARTIAL.

**Top gap drivers (what still needs building):**
- Responsive grid container component that accepts any array of products
- Integrate Ph 1 card component into the shared grid
- Replace inline card rendering in `ecomShop`, `reorderModal`, `ecomOrderHistory`
- Tablet breakpoints for sales reps in the field
- Cross-viewport testing (desktop / tablet / mobile)
