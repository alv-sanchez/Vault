---
ticket: BMS-4053
title: "Retailer Portal Product Card — Ph 1: Card Component"
status: Backlog
type: Story
priority: TBD
phase: 2a
execution_order: 6
labels: [decomposed-from-BMS-3924, ecom, gulf, phase-2]
jira: https://ohanafy.atlassian.net/browse/BMS-4053
parent: BMS-3924
---

# BMS-4053 — Retailer Portal Product Card — Ph 1: Card Component

> [Jira](https://ohanafy.atlassian.net/browse/BMS-4053) | Phase 2a | Execution Order: 6

## Summary

Build the atomic product card component that displays account-specific pricing, pack configuration, and warehouse availability. This card is the building block for every catalog view, search result, and reorder flow.

## Jira Links

- Relates to: [[BMS-3924 — Product Card & Grid Components]] (parent: Product card & grid)
- Followed by: [[BMS-4054 — Product Card Ph 2 — Grid Layout & Reuse]] (Ph 2: Grid Layout)

## What Already Exists in the Codebase

| Component | Status | Path |
|-----------|--------|------|
| Product card rendering in ecomShop | **COMPLETE** | `lwc/ecomShop/ecomShop.html` |
| Card displays: image, name, SKU, type, UOM, price | **COMPLETE** | Inline in ecomShop grid |
| Cart state on cards (add/remove/qty) | **COMPLETE** | `handleAddToCart()`, qty buttons |
| Stock status badges (In/Low/Out) | **COMPLETE** | Configurable via MDT |
| Promotion savings display | **COMPLETE** | Shows savings amount |
| MSRP comparison pricing | **COMPLETE** | Unit price vs individual unit price |
| Standalone reusable card component | MISSING | Card is inline in ecomShop, not extracted |
| Gulf pricing code display | MISSING | No multi-pricing-code resolution on cards |
| Warehouse availability indicator | MISSING | No warehouse badge |
| Pack configuration display | MISSING | Shows UOM but not pack details |

## What Needs to Be Done

1. Extract the product card from ecomShop into a standalone, reusable LWC component
2. Add Gulf pricing code resolution (show account-specific price)
3. Add warehouse availability indicator (FL/AL)
4. Add pack configuration details to card display
5. Ensure card accepts data from any parent (shop, search, reorder, promotions)

## Effort Estimate

**Medium** — the card UI exists inline. Work is extracting it into a reusable component and adding Gulf-specific data points.

## Dependencies

- **Blocks**: [[BMS-4054 — Product Card Ph 2 — Grid Layout & Reuse]] (grid needs the card component)
- **Blocked by**: [[BMS-3925 — Product Catalog & Availability]] (catalog provides the data), [[BMS-4049 — Gulf Pricing Spike — Architecture Discovery]] (pricing approach)
