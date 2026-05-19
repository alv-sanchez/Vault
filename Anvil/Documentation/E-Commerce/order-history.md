# Order History
> **Confluence**: https://ohanafy.atlassian.net/wiki/spaces/PD/pages/745078804

## Components
`ecomOrderHistory` LWC, `reorderModal` LWC

## Related Tickets
- [[BMS-4074-reorder-modal-stock-check]] — Stock check on reorder, out-of-stock section
- [[BMS-4011]] — Account Item creation on bulk reorder

---

## 1. Overview

**Purpose:** Displays past orders with filtering, detail views, and reorder capability. Includes ordered products tab for bulk reorder.

**Target Users:** Retailers

---

## 2. Features

### Order List
- Orders sorted by date (newest first), excludes Draft/Cancelled
- Status badges: Pending, In Transit, Out For Delivery, Delivered, Cancelled
- Collapsible order details with line items
- Timeframe filters: Last 7 Days, 30 Days, 90 Days, 1 Year, All

### Reorder Modal
- Opens with deep-cloned order data (edits don't mutate history)
- Stock availability check on open (`getQuantityAvailableAtFulfillmentLocation`)
- In-stock items: quantity steppers, remove button, price display
- Out-of-stock items: sorted to bottom, "Out of Stock" header, greyed out
- Remove button disabled on last in-stock item
- Bulk add to cart via `draftInvoiceService.addMultipleItems`

### Ordered Products Tab
- Aggregated view of all products ordered in the selected timeframe
- Bulk selection with "Reorder Selected" button

---

## 3. Known Issues & Workarounds
- Items not in the current pricelist are filtered out before reaching the reorder modal

---

## 4. Backend Notes

| Data Source | Description |
|---|---|
| `OrderHistoryController.getOrderHistory` | Orders + line items for the account |
| `CartController.getQuantityAvailableAtFulfillmentLocation` | Stock check for reorder modal |
| `draftInvoiceService` | Add items to cart from reorder |
| `CartController.createAccountItem` | Creates/reactivates Account_Item__c per item on bulk reorder (fire-and-forget) |

---

## 5. Changelog

| Date | Ticket | Change |
|---|---|---|
| 2026-04 | BMS-4074 | Reorder modal: stock check, out-of-stock section, remove guard, deep clone |
| 2026-04 | BMS-4011 | Account Item created/reactivated per item on bulk reorder |
