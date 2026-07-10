---
ticket: BMS-3925
title: "Product Catalog & Availability for Retailers"
type: Story
status: To Do
sprint: "Sprint 4"
blocked_by: "BMS-4019, BMS-3719 (pricing architecture)"
relates_to: "BMS-3924, BMS-4053, BMS-4054"
assignee: Alvaro Sanchez
jira: https://ohanafy.atlassian.net/browse/BMS-3925
tags: [sprint4, ecom, gulf, catalog, pricing, blocked]
---

# BMS-3925 — Product Catalog & Availability for Retailers

## Summary

Gulf retailer catalog browsing with warehouse-filtered availability, account-specific pricing, and promotional offers. Real-time availability has been struck through in the story statement — warehouse-specific availability is the focus.

## Current State

- **Layer 1 (warehouse-specific availability) is DONE.**
- Remaining work is remapping pricing code + promotions to the new architecture.
- Low Stock threshold `<24 cases` is hardcoded — should be config-driven (per warehouse or global)? Answered in AC 4 of BMS-3924.
- Recommend **deleting AC A5** — product types should come from the pricelist, not a hardcoded list.

## Blockers

- **BMS-4019** — Pricing codes architecture
- **BMS-3719** — Pricing architecture definition
- Flagged on 2026-05-19

## Open TODOs

- [ ] Confirm UI via Lovable prototype: https://lovable.dev/projects/e840f1e1-6a53-4482-b5ae-2bba8ebdb4d8
- [ ] Add 2 blocking tickets from Leah
- [ ] AC 4 — confirm promotions carousel UI ("Promotions" carousel at top of catalog)

## Key Takeaway

Most of the catalog work is done. This ticket is effectively **blocked until pricing architecture lands** (BMS-4019 / BMS-3719). The remaining scope is wiring up pricing codes and promotions to the new architecture — it's chore-level once the blockers clear.
