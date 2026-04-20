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
