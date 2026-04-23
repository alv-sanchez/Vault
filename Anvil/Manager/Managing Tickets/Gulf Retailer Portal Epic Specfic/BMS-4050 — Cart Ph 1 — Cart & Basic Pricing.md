---
ticket: BMS-4050
title: "Cart & Checkout with Gulf Pricing — Ph 1: Cart + Basic Pricing"
status: Backlog
type: Story
priority: TBD
phase: 2b
execution_order: 8
labels: [decomposed-from-BMS-3928, ecom, gulf, phase-2]
jira: https://ohanafy.atlassian.net/browse/BMS-4050
parent: BMS-3928
---

# BMS-4050 — Cart & Checkout with Gulf Pricing — Ph 1: Cart + Basic Pricing

> [Jira](https://ohanafy.atlassian.net/browse/BMS-4050) | Phase 2b | Execution Order: 8

## Summary

Add products to cart and see account-specific pricing with warehouse-filtered availability. Cart must resolve correct pricing for 154+ pricing codes and show only products available at the retailer's warehouse.

## Jira Links

- Relates to: [[BMS-3928 — Cart & Checkout with Gulf Pricing]] (parent: Cart & checkout with Gulf pricing)
- Preceded by: [[BMS-4049 — Gulf Pricing Spike — Architecture Discovery]] (Spike — defines pricing contract)
- Followed by: [[BMS-4051 — Cart Ph 2 — Volume Tiers & Promos]] (Ph 2: Volume Tiers)

## What Already Exists in the Codebase

| Component | Status | Path |
|-----------|--------|------|
| ecomCartPage (full cart UI) | **COMPLETE** | `lwc/ecomCartPage/` |
| Cart pagination (10, 25, 50, 100) | **COMPLETE** | Page size selector |
| Quantity updates (debounced 1s) | **COMPLETE** | Optimistic updates with fallback |
| Cart item removal + clear cart | **COMPLETE** | With confirmation |
| draftInvoiceService (state mgmt) | **COMPLETE** | `lwc/draftInvoiceService/` |
| Split invoice support | **COMPLETE** | Multi-type order handling |
| cartQuantities Map | **COMPLETE** | Product → quantity tracking |
| cartItemIds Map | **COMPLETE** | Product → item ID tracking |
| Unit price + case price display | **COMPLETE** | Both pricing modes |
| Subtotal calculations | **COMPLETE** | Item + cart level |
| Gulf pricing code resolution | MISSING | Single pricelist, no multi-code waterfall |
| Warehouse-filtered products | MISSING | No FL/AL warehouse filter in cart |
| Pricing snapshot on add-to-cart | MISSING | No price audit trail |

## What Needs to Be Done

1. Integrate pricing resolution from spike (BMS-4049) into cart add/update flow
2. Resolve account-specific pricing code when items are added to cart
3. Filter cart products by retailer's assigned warehouse
4. Store resolved price at cart-item level for audit trail
5. Update subtotal calculation to use resolved Gulf pricing

## Effort Estimate

**Medium** — cart UI is complete. Work is integrating Gulf's pricing engine into the existing cart data flow.

## Dependencies

- **Blocks**: [[BMS-4051 — Cart Ph 2 — Volume Tiers & Promos]] (volume tiers build on basic pricing)
- **Blocked by**: [[BMS-4049 — Gulf Pricing Spike — Architecture Discovery]] (spike must define pricing contract first)

---

## Completion — Built vs Wanted

**~77% already built** • **~23% Gulf-specific work remaining**

Progress: `███████████████░░░░░` (77%)

| Status | Count |
|---|---:|
| Built (COMPLETE) | 10 |
| Partial | 0 |
| Missing | 3 |
| **Total tracked items** | **13** |

**Top gap drivers (what still needs building):**
- Integrate pricing resolution from spike (BMS-4049) into cart add / update flow
- Resolve account-specific Gulf pricing code when items are added to cart
- Filter cart products by retailer's assigned warehouse (FL / AL)
- Store resolved price at cart-item level for audit trail / pricing snapshot

> Cart UI is effectively complete — the Gulf-specific work is plumbing the pricing engine into the existing data flow.
