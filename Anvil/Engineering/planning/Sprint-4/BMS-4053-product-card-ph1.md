---
ticket: BMS-4053
title: "Retailer Portal Product Card — Ph 1: Card Component"
type: Story
status: To Do
sprint: "Sprint 4"
parent: BMS-3924
assignee: Alvaro Sanchez
jira: https://ohanafy.atlassian.net/browse/BMS-4053
tags: [sprint4, ecom, gulf, card, lwc, pricing]
---

# BMS-4053 — Retailer Portal Product Card — Ph 1: Card Component

## Summary

Build the product card component displaying account-specific pricing, pack configuration, and warehouse availability. This is the atomic UI building block for the entire storefront.

## Key Design Direction (from Emily via Elliot)

> "The objective is to have a framework within the existing UI where you can provide something like a field set or some kind of configurable data element. The customer can specify what data points they would like to see or expose to a retailer from the product details."

**Approach: Inject configurable data into existing UI, NOT create entirely new UI.** Use field set or configurable element pattern.

## Comment Highlights

- **Elliot Flores:** "stock visibility is what will be shown to retailer" (not raw inventory numbers)
- **Alvaro:** Confirm UPC on product cards? Minimum case enforcement at brand level?
- **TODO:** Add 2 blocking tickets from Leah

## Open Questions

- [ ] Confirm UPC inclusion on cards
- [ ] Are we enforcing minimum case quantity at the brand level?
- [ ] Add Leah's 2 blocking tickets
- [ ] Field set / configurable data element design — how does the admin configure visible fields?

## Key Takeaway

Emily's guidance is critical: **configurable field framework in the existing UI**. Stock visibility (not raw inventory) shown to retailers. The card needs to be a reusable LWC extracted from the current inline tile markup in `ecomShop.html`.
