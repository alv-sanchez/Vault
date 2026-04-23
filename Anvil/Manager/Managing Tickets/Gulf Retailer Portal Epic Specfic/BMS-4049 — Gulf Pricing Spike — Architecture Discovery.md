---
ticket: BMS-4049
title: "Cart & Checkout with Gulf Pricing — Spike: Architecture Discovery"
status: Backlog
type: Story
priority: TBD
phase: 1
execution_order: 2
labels: [decomposed-from-BMS-3928, ecom, gulf, phase-2, spike]
jira: https://ohanafy.atlassian.net/browse/BMS-4049
parent: BMS-3928
---

# BMS-4049 — Cart & Checkout with Gulf Pricing — Spike: Architecture Discovery

> [Jira](https://ohanafy.atlassian.net/browse/BMS-4049) | Phase 1 | Execution Order: 2

## Summary

Timeboxed spike to define the PRC (Pricing Rules Code) pricing engine integration contract, Order__c schema, and pricing snapshot storage approach. Without this, the cart/checkout implementation phases risk rework when pricing edge cases (volume tiers, chain-specific rates, FL vs AL tax) emerge.

## Jira Links

- Relates to: [[BMS-3928 — Cart & Checkout with Gulf Pricing]] (parent: Cart & checkout with Gulf pricing)
- Informs: [[BMS-4050 — Cart Ph 1 — Cart & Basic Pricing]], [[BMS-4051 — Cart Ph 2 — Volume Tiers & Promos]], [[BMS-4052 — Cart Ph 3 — Checkout, Tax & Order]]

## What Already Exists in the Codebase

| Component | Status | Path |
|-----------|--------|------|
| ecomCartPage (cart UI) | COMPLETE | `lwc/ecomCartPage/` |
| ecomReviewSummary (checkout) | COMPLETE | `lwc/ecomReviewSummary/` |
| draftInvoiceService (cart state) | COMPLETE | `lwc/draftInvoiceService/` |
| CartController (Apex) | COMPLETE | `classes/experienceSite/CartController.cls` |
| userDataService (pricing cache) | COMPLETE | `lwc/userDataService/` |
| PRC pricing engine integration | MISSING | No pricing waterfall resolution |
| Multi-pricing-code resolution | MISSING | Single pricelist only |
| Tax jurisdiction logic | MISSING | Hard-coded 8.75% in ecomReviewSummary (line ~159) |
| Pricing snapshot storage | MISSING | No order-level price audit trail |

## What Needs to Be Done

1. Map Gulf's pricing waterfall: frontline price → volume discount → promo → chain-specific rate
2. Define integration contract with PRC pricing engine (API? Apex callout? Custom object?)
3. Design Order__c schema for pricing lineage (snapshot at order time)
4. Determine multi-warehouse pricing resolution (FL vs AL)
5. Document tax calculation approach (FL vs AL jurisdiction)
6. Output: Architecture decision record + schema design

## Effort Estimate

Spike — timebox to 1 sprint. Output is documentation, not code.

## Dependencies

- **Blocks**: [[BMS-4050 — Cart Ph 1 — Cart & Basic Pricing]], [[BMS-4051 — Cart Ph 2 — Volume Tiers & Promos]], [[BMS-4052 — Cart Ph 3 — Checkout, Tax & Order]] (all cart phases)
- **Blocked by**: None

---

## Completion — Built vs Wanted

**Infrastructure readiness: ~56%** • **Spike deliverable: 0% (no ADR written yet)**

Progress (infra): `███████████░░░░░░░░░` (56%)

| Status | Count |
|---|---:|
| Infra exists (ready to extend) | 5 |
| Missing / to be designed | 4 |
| **Total tracked items** | **9** |

> **Note:** This is a spike — the output is an ADR + schema design, not code. The percentage above measures **infrastructure readiness** (how much of the surrounding cart/checkout code exists to build against), not spike completion. The spike itself has produced no decision record yet.

**Top gap drivers (what the spike must define):**
- PRC pricing engine integration contract (API vs Apex callout vs custom object)
- Multi-pricing-code resolution logic (Gulf's 154+ codes → single resolved price)
- `Order__c` schema extensions for pricing lineage / snapshot audit trail
- Multi-warehouse pricing resolution (FL vs AL)
- Tax calculation approach (FL vs AL jurisdiction — replaces hard-coded 8.75%)
