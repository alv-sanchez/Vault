---
ticket: BMS-3928
title: Cart & checkout with Gulf pricing integration
status: Backlog
type: Story
priority: TBD
phase: track-only
execution_order: N/A
labels: [decomposed, ecom, gulf, high-judgment, phase-2, spike-recommended]
jira: https://ohanafy.atlassian.net/browse/BMS-3928
parent_type: decomposed
---

# BMS-3928 — Cart & checkout with Gulf pricing integration

> [Jira](https://ohanafy.atlassian.net/browse/BMS-3928) | **DECOMPOSED — Track Only**

## Summary

Parent story for cart & checkout with Gulf pricing. **Do not execute directly** — work is decomposed into a spike + 3 phases.

## Decomposed Into

| Phase | Ticket | Summary |
|-------|--------|---------|
| Spike | [[BMS-4049 — Gulf Pricing Spike — Architecture Discovery]] | Architecture Discovery — define pricing engine contract, Order__c schema |
| Ph 1 | [[BMS-4050 — Cart Ph 1 — Cart & Basic Pricing]] | Cart + Basic Pricing — account-specific pricing, warehouse filtering |
| Ph 2 | [[BMS-4051 — Cart Ph 2 — Volume Tiers & Promos]] | Volume Tiers + Promos — tier recalculation, mixed pricing codes |
| Ph 3 | [[BMS-4052 — Cart Ph 3 — Checkout, Tax & Order]] | Checkout + Tax + Order — FL/AL tax, order minimums, pricing snapshot |

## Jira Links

- Blocked by: [[BMS-3930 — Credit Terms & Payment Status]] (credit terms)
- Related: [[BMS-4049 — Gulf Pricing Spike — Architecture Discovery]], [[BMS-4050 — Cart Ph 1 — Cart & Basic Pricing]], [[BMS-4051 — Cart Ph 2 — Volume Tiers & Promos]], [[BMS-4052 — Cart Ph 3 — Checkout, Tax & Order]]

---

## Completion — Built vs Wanted

**~63% already built** • **~37% Gulf-specific work remaining**

Progress: `█████████████░░░░░░░` (63%)

Decomposed parent — percentage is the average of child tickets:

| Child ticket | % Built |
|---|---:|
| BMS-4049 (Pricing Spike — infra readiness) | 56% |
| BMS-4050 (Cart Ph 1 — Cart & Basic Pricing) | 77% |
| BMS-4051 (Cart Ph 2 — Volume Tiers & Promos) | 56% |
| BMS-4052 (Cart Ph 3 — Checkout, Tax & Order) | 62% |

**Top gap drivers (rolled up from children):**
- PRC pricing engine integration contract (spike output — BMS-4049)
- Multi-pricing-code resolution with Gulf waterfall (frontline → volume → promo → chain)
- Pricing snapshot / lineage stored on Order__c at checkout
- FL vs AL tax jurisdiction (replace hard-coded 8.75%)
- Minimum order enforcement per warehouse territory
- Chain-specific negotiated rate overlay (e.g., 7-Eleven vs independent)
