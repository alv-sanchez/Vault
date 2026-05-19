---
ticket: BMS-4168
title: "E-Commerce Order Table — Dynamic Backordering"
type: Testing Notes
status: Draft
component: ecomOrderHistory, ecomReviewSummary, ecomProductPage, ecomOrderPlaced, ecomCartPage, CartController, OrderHistoryController
change_type: New Feature
load_testing: false
package: E-Commerce
jira: https://ohanafy.atlassian.net/browse/BMS-4168
tags:
  - testing
  - ecom
---

# Testing Notes - BMS-4168: E-Commerce Order Table — Dynamic Backordering

## Related
- Ticket: [[BMS-4168]] (in Tickets/)
- Docs: [[BMS-4168]] (in Documentation/)

---

| Ticket | Component | Change Type | Ticket Link |
|--------|-----------|-------------|-------------|
| BMS-4168 | ecomOrderHistory / ecomReviewSummary / ecomProductPage / ecomOrderPlaced / CartController / OrderHistoryController | New Feature | https://ohanafy.atlassian.net/browse/BMS-4168 |

---

## Overview
**Component**: ecomOrderHistory, ecomReviewSummary, ecomProductPage, ecomOrderPlaced, ecomCartPage, CartController, OrderHistoryController, ecomOrderItemUtils
**Change Type**: New Feature
**Ticket Description**: Dynamic backordering across the e-commerce flow. When a customer adds more cases of an item than the fulfillment location currently has on hand, the storefront splits the line into a fulfilled portion and a backordered portion. The split surfaces consistently on the product page, review/checkout, the order placed confirmation, and the order history table. The order table now exposes a per-line backorder quantity instead of a single ordered quantity.
**Impact Assessment**: Touches the full purchase path (product detail → cart → review → place order → order history). Changes how quantity is displayed everywhere downstream of the cart: displayed quantity is now the fulfilled portion only, with the backordered portion shown as a separate amber annotation. Subtotals on the order placed and review pages are sourced from the server (Sub_Total__c) when available so promotions/discounts remain correct. Risk areas: items whose available inventory equals zero, items with promotions applied while partially backordered, split invoices (delivery vs pickup) where each sub-invoice must be enriched independently, and re-orders from order history pulling backorder quantities back into a new cart.
**Load Testing Required**: [ ] Yes [x] No

---

## Configuration Preferences

| Configuration Preference Name | New? | Active / Inactive | Value (if applicable) |
|------------------------------|------|-------------------|------------------------|
| N/A | - | - | - |

*None required*

---

## Pre-existing Data / Preconditions

| Preconditions ID | Object(s) | Fields & Values | Description |
|------------------|-----------|-----------------|-------------|
| PRE-01 | Account, Contact, User | Community user with portal access; Account assigned a Pricelist and a default Fulfillment Location | Standard storefront login with cart access |
| PRE-02 | Item__c | Two pricelist items: one fully in stock (Quantity Available greater than typical order qty), one with limited inventory (e.g. Quantity Available = 2) | Drives in-stock vs partial-availability paths |
| PRE-03 | Item__c | One pricelist item with Quantity Available = 0 at the customer's fulfillment location | Drives full-backorder path |
| PRE-04 | Order__c, Order_Item__c | Existing posted order with at least one Order_Item where Backorder_Quantity__c is greater than 0 and Ordered_Quantity__c is greater than Backorder_Quantity__c | Historical order with mixed fulfilled/backordered quantities for order history validation |
| PRE-05 | Order__c, Order_Item__c | Existing posted order with all Order_Items having Backorder_Quantity__c = 0 | Control case — order history should render with no backorder annotations |
| PRE-06 | Item__c, Promotion | Item with an active promotion (e.g. tier discount) and limited inventory so the line will split | Validates promotion subtotals on partially-backordered lines |
| PRE-07 | Account | Account configured for split delivery (delivery + pickup) | Validates backorder enrichment on each sub-invoice in a split scenario |

---

## UI Component Details

### Setup / Navigation

**Component Location**:
- Storefront site (Experience Cloud) — Product Detail page, Cart page, Review/Checkout page, Order Placed confirmation, and Order History page
- Navigate by logging in as a community user, then: Shop → product card → Product Detail; cart icon → Cart page → Review Order → Place Order; user menu → Order History

### Input Fields / Interactive Elements

| Input Label/Descriptor | Type | Allowed Inputs/Values |
|------------------------|------|------------------------|
| Quantity stepper (product detail / cart) | Numeric stepper | Positive integer; values exceeding available inventory trigger a backorder annotation rather than blocking |
| Add to Cart button (product detail) | Button | Click — adds the entered quantity; if the quantity exceeds availability, the inline "{N} will be backordered" warning appears beneath the stock status |
| Place Order button (review summary) | Button | Click — confirms the draft via `confirmDraftsWithBackorder`, which enriches each invoice item with live availability before posting |
| Order History row (expand) | Disclosure | Click — expands the row to show per-item Ordered Quantity with an amber "({N} backordered)" annotation when Backorder_Quantity__c is greater than 0 |
| Order History collapsed summary | Read-only list | Each item shows "x{ordered}" plus "({N} BO)" in amber when backordered |

---

## Test Cases

*ID prefix: TC-BO-*

### Valid Cases

#### **Product Detail Page — Backorder Preview**

| Test Case | Expected Outcome | Preconditions ID |
|-----------|------------------|------------------|
| Open product detail for an item where cart quantity is less than or equal to available inventory | No backorder warning is displayed; only the standard stock status shows | PRE-02 |
| Open product detail for an item already in the cart at a quantity greater than its available inventory | Below the stock status, an amber "{N} will be backordered" message is displayed where N equals (cart quantity − available quantity) | PRE-02 |
| Open product detail for an item with availability = 0 that is in the cart | The full cart quantity is shown as the backordered amount in the amber warning | PRE-03 |

#### **Review / Checkout Page — Backorder Annotation**

| Test Case | Expected Outcome | Preconditions ID |
|-----------|------------------|------------------|
| Cart contains one item where ordered quantity is less than available inventory; navigate to Review | The line item shows full ordered quantity, standard subtotal, and no backorder annotation | PRE-02 |
| Cart contains one item where ordered quantity exceeds available inventory; navigate to Review | The displayed Qty is the fulfilled portion only; an amber "Backorder Qty: {N}" line appears beneath the price; subtotal reflects price × fulfilled quantity | PRE-02 |
| Cart contains an item with availability = 0; navigate to Review | Displayed Qty is 0 with the full ordered amount shown as Backorder Qty in amber; subtotal is $0 for that line | PRE-03 |
| Cart contains a promoted item that splits into fulfilled + backorder; navigate to Review | The fulfilled portion uses the promoted (discounted) price for the displayed subtotal; the backorder annotation appears under the line | PRE-06 |

#### **Place Order — Posted Backorder Quantity**

| Test Case | Expected Outcome | Preconditions ID |
|-----------|------------------|------------------|
| Place an order where every line is fully in stock | Order Placed page shows each item with full quantity, standard subtotal, and no backorder annotation; order is posted with Backorder_Quantity__c = 0 on all items | PRE-02 |
| Place an order with one line where ordered quantity exceeds availability | Order Placed page shows fulfilled Qty only and an amber "Backorder Qty: {N}" annotation for that line; the posted Order_Item has Ordered_Quantity__c equal to the requested total and Backorder_Quantity__c equal to the unfulfilled portion | PRE-02 |
| Place a split order (delivery + pickup) where one sub-invoice has a partially-backordered line | Each sub-invoice is enriched independently; the affected line is annotated on the order placed page; the unaffected sub-invoice posts with no backorder quantities | PRE-07 |

#### **Order History Table — Dynamic Backordering Display**

| Test Case | Expected Outcome | Preconditions ID |
|-----------|------------------|------------------|
| Open Order History and locate an order whose items are all fully fulfilled | Each line in the collapsed row shows "x{ordered}" with no amber annotation; expanded view shows ordered quantity with no "(N backordered)" text | PRE-05 |
| Open Order History and locate an order with at least one backordered line | Collapsed row shows the affected item with "x{ordered}" plus "({N} BO)" in amber; expanded row shows the ordered quantity with "({N} backordered)" in amber beneath it | PRE-04 |
| Expand an order with a mix of fully-fulfilled and partially-backordered lines | Only the partially-backordered lines display the amber annotation; fully-fulfilled lines render normally | PRE-04 |
| Refresh the Order History page after the underlying Order_Item Backorder_Quantity__c is updated in Salesforce | The annotation reflects the latest backorder quantity; orders previously without a backorder now show one if applicable | PRE-04 |

#### **Quantity Normalization — Cart Page**

| Test Case | Expected Outcome | Preconditions ID |
|-----------|------------------|------------------|
| Reload the cart page when a line in the draft invoice has a backorder quantity attached | The cart line displays the fulfilled portion as the active quantity (not the ordered total); stepper edits operate from that value | PRE-02 |
| Reload the cart page when no line carries a backorder quantity | The cart line displays the raw ordered quantity (fallback path) — no behavior regression for in-stock-only carts | PRE-02 |

---

### Invalid Cases

#### **Backorder Edge Cases — Invalid / Negative Paths**

| Test Case | Expected Behavior | Preconditions ID |
|-----------|-------------------|------------------|
| Place an order while the user's account has no fulfillment location set | The fulfillment-location-aware enrichment is skipped (availability map is empty); the order still posts; backorder messaging on review may not appear, but no error or page break is raised | PRE-01 |
| Inventory drops to zero between the review page render and the Place Order click | The enrichment at confirm time uses the latest availability; the posted order reflects the correct backorder split (may differ from what was previewed); user is not blocked | PRE-03 |
| User edits cart quantity downward so that ordered quantity is now less than or equal to available inventory | The amber backorder annotation disappears on product detail and review without requiring a manual refresh | PRE-02 |
| Order History contains an order with Backorder_Quantity__c = null on every line | All lines render normally with no amber annotation; the field is treated as 0 | PRE-05 |
| Order History contains an order with Backorder_Quantity__c greater than Ordered_Quantity__c (data anomaly) | The page must not throw; the annotation should still display but may show unexpected text — flag for the engineer to confirm guardrail behavior | PRE-04 |
| Network failure on the inventory availability call from the review page | The page renders without backorder annotations (availability map defaults to empty); console error is logged; user can still place the order | PRE-02 |
| Rapidly increase quantity past availability and back below availability before the page finishes computing | The final displayed state matches the last quantity entered (no stuck amber annotation, no stale subtotal) | PRE-02 |
