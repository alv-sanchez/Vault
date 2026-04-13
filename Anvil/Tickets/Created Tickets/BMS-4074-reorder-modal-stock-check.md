# BMS-4074: Reorder Modal — Stock Availability Check & Out of Stock Section |ECOM|

## Related
- Jira: https://ohanafy.atlassian.net/browse/BMS-4074
- Testing: [[BMS-4074]] (in Testing/)

---

**Priority**: Medium
**Effort**: S
**Components**: `reorderModal` LWC, `CartController.getQuantityAvailableAtFulfillmentLocation` Apex

## Story Statement

As a Retailer, I want to see which items from a previous order are currently in stock when I open the reorder modal, so that I know what I can reorder and don't waste time adjusting quantities for unavailable products.

## Acceptance Criteria

### SCENARIO: Stock Check on Modal Open
**GIVEN** a retailer clicks "Reorder" on a previous order
**WHEN** the reorder modal opens
**THEN** stock availability is fetched from the fulfillment location for all items in the order
**AND** items are split into two sections: in-stock and out-of-stock

### SCENARIO: In-Stock Items Display Normally
**GIVEN** a product has quantity available > 0
**WHEN** the reorder modal displays
**THEN** the product appears in the main list with quantity steppers, price, and remove button
**AND** the reorder quantity defaults to the original ordered quantity

### SCENARIO: Out-of-Stock Items Sorted to Bottom
**GIVEN** one or more products have quantity available <= 0
**WHEN** the reorder modal displays
**THEN** those products appear below an "Out of Stock" header
**AND** they are visually greyed out (opacity reduced)
**AND** no quantity steppers are shown — just the product name, type, and "Currently unavailable" label
**AND** their reorder quantity is set to 0

### SCENARIO: All Items Out of Stock
**GIVEN** every product in the order has quantity available <= 0
**WHEN** the reorder modal displays
**THEN** all items appear under the "Out of Stock" header
**AND** the "Add to Cart" button is disabled (total items = 0)

### SCENARIO: Remove Button Blocked on Last In-Stock Item
**GIVEN** only one in-stock item remains in the reorder modal
**WHEN** the retailer tries to remove it
**THEN** the remove button is visually disabled (greyed out, not clickable)
**AND** at least one item must remain to reorder

### SCENARIO: Order Data Not Mutated
**GIVEN** a retailer opens the reorder modal and changes quantities
**WHEN** they close the modal without adding to cart
**THEN** the original order in Order History is unchanged

## Dependencies
- **Cannot Start Until**: None
- **This Story Unlocks**: None
- **Ships With**: None

## Testing Notes
- Verify `loadStockAvailability()` calls `getQuantityAvailableAtFulfillmentLocation` with the account's fulfillment location
- Verify `processOrderItems()` sets `isOutOfStock = true` and `reorderQuantity = 0` for items with qty <= 0
- Verify items are sorted: in-stock first, out-of-stock last
- Verify out-of-stock section has red "Out of Stock" header on both mobile and desktop
- Verify out-of-stock items show `opacity-50` and "Currently unavailable" text
- Verify `isLastInStockItem` getter disables the remove button (renders as `<span>` not `<button>`)
- Verify `openWithOrder()` deep clones the order (`JSON.parse(JSON.stringify(order))`) so edits don't mutate Order History
- Verify stock check and cart data load in parallel (`Promise.all`)
- Verify if stock API fails, modal still opens with all items shown as in-stock (non-blocking)

## Implementation Notes
- `reorderModal.js`: `loadStockAvailability()` — calls `getQuantityAvailableAtFulfillmentLocation`, populates `stockMap` (productId → qty)
- `reorderModal.js`: `processOrderItems()` — adds `qtyAvailable`, `isOutOfStock` to each item, sorts out-of-stock to bottom
- `reorderModal.js`: `openWithOrder()` — deep clones order data, runs `loadCartData()` + `loadStockAvailability()` in `Promise.all`
- `reorderModal.js`: Getters — `inStockItems`, `outOfStockItems`, `hasOutOfStockItems`, `isLastInStockItem`
- `reorderModal.html`: Mobile uses `<template if:true={hasOutOfStockItems}>` with card layout, desktop uses table row with `colspan="5"` header
- `reorderModal.html`: Remove button swaps between `<button>` and disabled `<span>` via `<template if:true/false={isLastInStockItem}>`
