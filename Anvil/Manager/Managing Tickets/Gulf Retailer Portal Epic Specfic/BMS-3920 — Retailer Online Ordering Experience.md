---
ticket: BMS-3920
title: Retailer Online Ordering Experience
status: Backlog
type: Story
priority: TBD
phase: 3
execution_order: 17
labels: [ecom, gulf, phase-2, refinement-needed, roadmap-v2-baseline]
jira: https://ohanafy.atlassian.net/browse/BMS-3920
---

# BMS-3920 — Retailer Online Ordering Experience

> [Jira](https://ohanafy.atlassian.net/browse/BMS-3920) | Phase 3 | Execution Order: 17

## Summary

**Umbrella ticket** — represents the full retailer self-service ordering experience: browsing promotions, reordering from history, and checking out with accurate pricing. This is the capstone that validates the end-to-end flow across all other Gulf tickets.

## Jira Links

- Blocked by: [[BMS-3930 — Credit Terms & Payment Status]] (credit terms)

## What Already Exists in the Codebase

This ticket is fulfilled by the sum of the other Gulf tickets:

| Capability | Delivered By | Status |
|-----------|-------------|--------|
| Product browsing | [[BMS-3925 — Product Catalog & Availability]] + existing ecomShop | Existing + extend |
| Search & filtering | [[BMS-3927 — Product Search & Filtering]] + existing ecomShop | Existing + extend |
| Product cards | [[BMS-4053 — Product Card Ph 1 — Card Component]] + [[BMS-4054 — Product Card Ph 2 — Grid Layout & Reuse]] | New (extract + Gulf data) |
| Cart with pricing | [[BMS-4050 — Cart Ph 1 — Cart & Basic Pricing]] + [[BMS-4051 — Cart Ph 2 — Volume Tiers & Promos]] | Existing + Gulf pricing |
| Checkout with tax | [[BMS-4052 — Cart Ph 3 — Checkout, Tax & Order]] | Existing + FL/AL tax |
| Order history & reorder | [[BMS-3929 — Order History & One-Click Reorder]] + existing ecomOrderHistory | Existing + quick-reorder |
| Registration | [[BMS-3926 — Registration & Onboarding Flow]] + existing ecomRegister | Existing + Gulf onboarding |
| Notifications | [[BMS-3921 — Retailer Engagement Notifications]] + [[BMS-3931 — Order Status Tracking & Delivery Notifications]] | Existing framework + Gulf config |

## What Needs to Be Done

1. End-to-end integration testing of complete ordering flow
2. Validate all Gulf-specific data (pricing codes, warehouse filtering, tax) across the full journey
3. Performance testing with Gulf's product catalog size
4. UAT with Gulf retailers and sales reps

## Effort Estimate

**Integration testing** — not implementation work. All functionality is delivered by child tickets.

## Dependencies

- **Blocks**: None (capstone)
- **Blocked by**: All other Gulf tickets (this validates the whole flow)

---

## Completion — Built vs Wanted

**~64% already built** • **~36% Gulf-specific work remaining**

Progress: `█████████████░░░░░░░` (64%)

Umbrella ticket — percentage is the weighted average of child ticket completion (BMS-3921, 3925, 3926, 3927, 3929, 3931, 4049, 4050, 4051, 4052, 4053, 4054).

| Capability | % Built |
|---|---:|
| Product browsing (3925) | 73% |
| Search & filtering (3927) | 71% |
| Product cards (4053 + 4054) | 55% |
| Cart + pricing (4050 + 4051) | 66% |
| Checkout + tax (4052) | 62% |
| Order history + reorder (3929) | 87% |
| Registration (3926) | 58% |
| Notifications (3921 + 3931) | 61% |

**Top gap drivers across the epic:**
- Gulf pricing engine (PRC waterfall + multi-pricing-code resolution) — net new
- Multi-warehouse filtering (FL vs AL catalog) — extend existing
- FL vs AL tax jurisdiction (currently hard-coded 8.75%)
- Credit/AR visibility for retailers — net new
- Call center agent UI (BMS-3922, 40% built)
- Gulf branding assets + Experience Cloud site config
