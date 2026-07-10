---
ticket: BMS-3924
title: "Retailer portal product card & grid components"
type: Story (umbrella/parent)
status: To Do
sprint: "Sprint 4"
children: "BMS-4053 (Ph 1 Card), BMS-4054 (Ph 2 Grid)"
assignee: Alvaro Sanchez
jira: https://ohanafy.atlassian.net/browse/BMS-3924
tags: [sprint4, ecom, gulf, card, grid, umbrella]
---

# BMS-3924 — Retailer portal product card & grid components

## Summary

Parent/umbrella story for the product card + grid components. Decomposed into two children:

- **BMS-4053** — Ph 1: Card Component (rendering, pricing, pack info, availability, add-to-cart)
- **BMS-4054** — Ph 2: Grid Layout + Reuse (responsive layout, search/reorder reuse)

## Current State (from polishFirstPass)

- No isolated `productCard` LWC exists today — tile markup is inline in `ecomShop.html`
- Extracting a reusable card LWC **is net-new structural work**
- Warehouse availability is live: `CartController.getQuantityAvailableAtFulfillmentLocation`
- Promotional badge wiring is **stubbed** (all return empty pending rebuild)
- No comments on this ticket

## Recommendation

Per polish notes: **close as superseded** by BMS-4053 + BMS-4054, or convert to epic with no ACs of its own. Currently triple-counts sprint work with its children.

## Key Takeaway

This is the **container ticket** — actual work happens in BMS-4053 and BMS-4054. Should be resolved as a tracking parent only.
