---
ticket: BMS-3922
title: Call Center Order Visibility
status: Backlog
type: Story
priority: TBD
phase: 3
execution_order: 15
labels: [ecom, fast-trackable, gulf, phase-2]
jira: https://ohanafy.atlassian.net/browse/BMS-3922
---

# BMS-3922 — Call Center Order Visibility

> [Jira](https://ohanafy.atlassian.net/browse/BMS-3922) | Phase 3 | Execution Order: 15

## Summary

Call center agents need to place and manage on-premise orders with full promotional and account context. Currently agents lack visibility into active promotions, pricing, and order history — forcing them to rely on fragmented communication with field sales reps.

## Jira Links

- Blocked by: [[BMS-3930 — Credit Terms & Payment Status]] (credit terms)

## What Already Exists in the Codebase

| Component | Status | Path |
|-----------|--------|------|
| OrderHistoryController (Apex) | **COMPLETE** | `classes/OrderHistoryController.cls` |
| getOrderHistory(customerId) | **COMPLETE** | Returns orders with items for a customer |
| getOrderedProducts(customerId) | **COMPLETE** | Returns frequently ordered products |
| Order detail fields | **COMPLETE** | Totals, payment terms, delivery dates, invoice info |
| Agent-facing order search | MISSING | No customer lookup by name/phone/email |
| Agent-facing dashboard | MISSING | No workqueue or order queue |
| Account context panel | MISSING | No agent view of pricing, promotions, credit |
| Order modification for agents | MISSING | No edit/cancel capabilities |
| Agent notes on orders | MISSING | No case management integration |
| Customer communication history | MISSING | No interaction log |

## What Needs to Be Done

1. Build agent-facing customer lookup component (search by name, phone, email, account #)
2. Create agent order dashboard showing queue of orders to process
3. Add account context panel (pricing code, territory, credit status, active promotions)
4. Enable order placement on behalf of retailer
5. Add order modification capabilities (edit quantities, cancel)
6. Optional: Integrate with case management for support tickets

## Effort Estimate

**Large** — mostly net-new work. The data layer (OrderHistoryController) exists but needs agent-facing UI and additional Apex methods.

## Dependencies

- **Blocks**: None
- **Blocked by**: [[BMS-4052 — Cart Ph 3 — Checkout, Tax & Order]] (checkout flow for agent order placement), [[BMS-3925 — Product Catalog & Availability]] (catalog for agent browsing)
