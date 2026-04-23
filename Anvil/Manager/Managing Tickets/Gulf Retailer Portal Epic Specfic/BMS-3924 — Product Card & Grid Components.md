---
ticket: BMS-3924
title: Retailer portal product card & grid components
status: Backlog
type: Story
priority: TBD
phase: track-only
execution_order: N/A
labels: [decomposed, ecom, gulf, phase-2, roadmap-v2-baseline]
jira: https://ohanafy.atlassian.net/browse/BMS-3924
parent_type: decomposed
---

# BMS-3924 — Retailer portal product card & grid components

> [Jira](https://ohanafy.atlassian.net/browse/BMS-3924) | **DECOMPOSED — Track Only**

## Summary

Parent story for product card and grid work. **Do not execute directly** — work is decomposed into phases.

## Decomposed Into

| Phase | Ticket | Summary |
|-------|--------|---------|
| Ph 1 | [[BMS-4053 — Product Card Ph 1 — Card Component]] | Card Component — extract reusable card with Gulf pricing/warehouse data |
| Ph 2 | [[BMS-4054 — Product Card Ph 2 — Grid Layout & Reuse]] | Grid Layout + Reuse — responsive grid across all contexts |

## Jira Links

- Blocked by: [[BMS-3930 — Credit Terms & Payment Status]] (credit terms)
- Related: [[BMS-4053 — Product Card Ph 1 — Card Component]], [[BMS-4054 — Product Card Ph 2 — Grid Layout & Reuse]]

---

## Completion — Built vs Wanted

**~55% already built** • **~45% Gulf-specific work remaining**

Progress: `███████████░░░░░░░░░` (55%)

Decomposed parent — percentage is the average of child tickets:

| Child ticket | % Built |
|---|---:|
| BMS-4053 (Card Component) | 60% |
| BMS-4054 (Grid Layout & Reuse) | 50% |

**Top gap drivers (rolled up from children):**
- Extract product card from `ecomShop` into a standalone reusable LWC
- Unified responsive grid shared across `ecomShop`, `reorderModal`, `ecomOrderHistory`
- Gulf pricing code resolution on the card (account-specific price)
- Warehouse availability indicator (FL/AL)
- Tablet-optimized breakpoints (sales reps in the field)
