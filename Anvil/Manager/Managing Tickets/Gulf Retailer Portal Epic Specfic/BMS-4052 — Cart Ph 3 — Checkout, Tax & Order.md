---
ticket: BMS-4052
title: "Cart & Checkout with Gulf Pricing — Ph 3: Checkout + Tax + Order"
status: Backlog
type: Story
priority: TBD
phase: 2c
execution_order: 12
labels: [decomposed-from-BMS-3928, ecom, gulf, phase-2]
jira: https://ohanafy.atlassian.net/browse/BMS-4052
parent: BMS-3928
---

# BMS-4052 — Cart & Checkout with Gulf Pricing — Ph 3: Checkout + Tax + Order

> [Jira](https://ohanafy.atlassian.net/browse/BMS-4052) | Phase 2c | Execution Order: 12

## Summary

Checkout with entity-aware tax calculation (FL vs AL), order creation with full pricing lineage, and minimum order enforcement. The order must match exactly what the retailer saw in the cart.

## Jira Links

- Relates to: [[BMS-3928 — Cart & Checkout with Gulf Pricing]] (parent: Cart & checkout with Gulf pricing)
- Preceded by: [[BMS-4051 — Cart Ph 2 — Volume Tiers & Promos]] (Ph 2: Volume Tiers)

## What Already Exists in the Codebase

| Component | Status | Path |
|-----------|--------|------|
| ecomReviewSummary (checkout page) | **COMPLETE** | `lwc/ecomReviewSummary/` |
| Billing info capture | **COMPLETE** | Company, phone, address fields |
| Delivery info | **COMPLETE** | Date, window, instructions, same-as-billing |
| Payment method selection | **COMPLETE** | Net 30, Credit Card |
| handlePlaceOrder() | **COMPLETE** | Order creation flow |
| calculateOrderData() | **COMPLETE** | Subtotal, tax, total calculation |
| Order confirmation display | **COMPLETE** | Order name + confirmation screen |
| Tax calculation | **BROKEN** | Hard-coded 8.75% (`this.subtotal * 0.0875`) |
| Rainforest Pay integration | STUB | Lines 94-104 marked "not fully implemented" |
| FL vs AL tax jurisdiction | MISSING | No state-based tax logic |
| Minimum order enforcement | MISSING | No order minimum validation |
| Pricing lineage snapshot | MISSING | No audit trail from cart to order |
| Order minimum per warehouse | MISSING | No warehouse-specific thresholds |

## What Needs to Be Done

1. Replace hard-coded 8.75% tax with jurisdiction-based calculation (FL vs AL rates)
2. Add minimum order enforcement per warehouse territory
3. Create pricing snapshot at order time (lineage for invoice traceability)
4. Validate all pricing from cart matches checkout totals
5. Complete Rainforest Pay integration (or defer to separate ticket)
6. Add order summary with pricing breakdown before final submission

## Effort Estimate

**Large** — tax logic, minimum order enforcement, and pricing snapshot are all non-trivial. This is the most complex checkout ticket.

## Dependencies

- **Blocks**: [[BMS-3931 — Order Status Tracking & Delivery Notifications]] (delivery notifications need orders), [[BMS-3929 — Order History & One-Click Reorder]] (reorder needs order records)
- **Blocked by**: [[BMS-4051 — Cart Ph 2 — Volume Tiers & Promos]] (volume tier pricing must be resolved first)

---

## Completion — Built vs Wanted

**~62% already built** • **~38% Gulf-specific work remaining**

Progress: `████████████░░░░░░░░` (62%)

| Status | Count |
|---|---:|
| Built (COMPLETE) | 7 |
| Partial (BROKEN / STUB) | 2 |
| Missing | 4 |
| **Total tracked items** | **13** |

> Hard-coded 8.75% tax rate and Rainforest Pay stub are counted as PARTIAL (0.5 each) since the hook points exist but behavior is incorrect/incomplete.

**Top gap drivers (what still needs building):**
- Replace hard-coded 8.75% tax with FL vs AL jurisdiction-based calculation
- Minimum order enforcement per warehouse territory
- Pricing snapshot at order time (lineage for invoice traceability)
- Cart-to-order total reconciliation / validation
- Complete Rainforest Pay integration (or defer)
- Order summary with full pricing breakdown before submission

> **Most complex checkout ticket** — tax logic, minimum order enforcement, and pricing snapshot are all non-trivial.
