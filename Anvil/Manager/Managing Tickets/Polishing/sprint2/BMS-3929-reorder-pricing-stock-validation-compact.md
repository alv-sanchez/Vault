---
ticket: BMS-3929
title: "Reorder pricing + stock-availability hardening (Gulf)"
type: Story
parent_epic: "BMS-3702 — Gulf E-Commerce & Ordering"
status: "Needs Refinement"
sprint: "Sprint 2 (2026-05-02 → 2026-05-15)"
polished_on: 2026-04-23
polished_by: Alvaro Sanchez
jira: https://ohanafy.atlassian.net/browse/BMS-3929
tags: [polish, ecom, gulf, reorder, pricing, inventory, hardening]
---

# BMS-3929 — Jira-Ready (compact)

**Title:** Reorder pricing + stock-availability hardening (Gulf)

## Description

The reorder surface in the Gulf e-commerce portal is already built — retailers can open an order from their history and add its line items to a new cart in a couple of clicks. Two edge cases are not yet covered and can cause silent data problems at scale:

1. **Reorder pricing must always reflect the retailer's *current* pricing.** A "Gulf pricing code" in the portal is the pricelist assigned to the retailer's `Account`. When a retailer reorders, every line must re-resolve against that current pricelist — not against the price stored on the original `Order` / `Order_Item`. Today the code does this, but there is no test proving it and the retailer gets no visible indication that a price has changed since the last time they ordered.

2. **Stock availability must be re-validated at add-to-cart time.** Today the reorder modal reads availability once when the modal opens. Between that read and the retailer clicking Add to Cart, another retailer can consume the same stock, or Ops can re-pin the account's fulfillment location. The current path silently inserts the cart line anyway, which surfaces later as a BOL variance and a call-center ticket.

This story adds the validation layer that closes both gaps: pricing code resolution becomes asserted and user-visible, and stock drift is caught at the moment the cart actually mutates with a clear user-facing message when a line can no longer be honored at the quantity shown.

## Why it matters

- **Gulf runs 150+ account-specific pricing (volume discounts, promotional pricing, route-specific rules).** A miskeyed or stale price on reorder cascades into invoice-reconciliation work that the call center currently absorbs. Making the reorder price surface the delta — and adding a test that fails loudly if the recalculation ever regresses — is the cheapest possible insurance against that cost.
- **Under-stocked reorders are the #1 avoidable BOL variance driver.** The parent epic's business case is reducing call-center volume and fulfillment disputes. Re-checking stock at cart-mutation time (without moving to full inventory reservation, which is a much larger Cart Phase 2 effort) closes the race condition that causes most of those variances.
- **Gulf retailers are moving to digital self-service.** Reorder that silently prices wrong or silently under-stocks erodes trust faster than any feature gap; Gulf's account-retention pitch depends on the self-service channel being at least as accurate as a phone order.

## Acceptance Criteria

```gherkin
Scenario: Reorder prices reflect the retailer's current pricing
  Given a retailer placed an order last month when Item ABC was priced at $10.00
  And   their Account's current pricing code now prices Item ABC at $12.00
  When  the retailer opens the reorder modal from that historical order
  Then  the line for Item ABC shows the current $12.00 price, not the historical $10.00
  And   the retailer can see that the price has changed since the original order
  And   a summary message communicates how many lines have updated pricing
  And   the modal total reflects current prices

Scenario: Reorder uses the account's current pricing code, not the source order's
  Given the account has been reassigned to a different pricing code since the original order
  When  the retailer opens the reorder modal
  Then  every line prices against the account's current pricing code
  And   any item no longer available on the current pricing code is separated into an "Unavailable" list
  And   unavailable items cannot be added to the cart

Scenario: Stock drift between modal open and Add to Cart is caught
  Given the retailer opens the reorder modal and sees an item with 5 units available
  And   concurrent activity consumes those 5 units before the retailer submits
  When  the retailer clicks Add to Cart
  Then  the drifted item is not added to the cart
  And   the retailer sees a clear message that stock for that item changed
  And   other items on the reorder that are still in stock are added normally

Scenario: Fulfillment-location change between modal open and Add to Cart is caught
  Given the retailer opens the reorder modal for their Mobile AL warehouse
  And   Ops reassigns the account to the Montgomery AL warehouse before the retailer submits
  When  the retailer clicks Add to Cart
  Then  the submission is rejected with a message that the warehouse assignment changed
  And   no cart line is created against the stale warehouse
  And   the retailer is prompted to re-open the reorder so stock is re-evaluated against the new warehouse

Scenario: The retailer is not forced to redo work when only some lines drift
  Given the retailer has four lines in the reorder modal
  And   one line has drifted to out-of-stock while the other three are still available
  When  the retailer clicks Add to Cart
  Then  the three available lines are added to the cart at current pricing
  And   the drifted line is surfaced in the modal with an "Out of stock — not added" indicator
  And   the retailer is not forced to click Add to Cart again for the three successful lines

Scenario: Automated tests protect both behaviors going forward
  Given the team runs the existing test suite
  Then  there is a test that asserts the current pricelist wins over the historical price on reorder
  And   there is a test that asserts a stock-drift or location-change scenario is rejected at cart time
  And   both tests would fail loudly if the behavior ever regressed
```



Out scope - may be needed for a extra ticket

```
Scenario: Order history immutability for audit compliance Given a retailer has historical orders dating back 3 years, including some with cancelled or voided invoices When the retailer views the order history Then All historical orders are displayed regardless of status — including Cancelled and Voided orders And No historical order record can be edited or deleted from the portal And Cancelled/voided orders show their original details with a clear status badge and the cancellation reason And Order data matches the corresponding Order__c and Invoice__c records in Salesforce with no discrepancies
```
