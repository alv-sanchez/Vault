# Review & Checkout
> **Confluence**: https://ohanafy.atlassian.net/wiki/spaces/PD/pages/746684443

## Component
`ecomReviewSummary` LWC

## Related Tickets
- [[BMS-4072-delivery-banner-cutoff-fix]] — Delivery dates filtered by active routes, `> TODAY`

---

## 1. Overview

**Purpose:** Final review step before order submission. Retailer selects delivery date, adds instructions, and confirms the order.

**Target Users:** Retailers

---

## 2. Features

### Delivery Date Selection
- Queries active `Account_Route__c` first, then filters `Delivery__c` by those route IDs
- Uses `> TODAY` (excludes today's deliveries)
- Falls back to free-form date input if no routes/deliveries found

### Order Summary
- Line items with quantities and prices
- Special instructions text area
- Submit button triggers `draftInvoiceService.confirmDraft()`

### Post-Confirmation
- Navigates to Order Placed page with `orderId` and `sObjectName`
- Fire-and-forget: `sendOrderConfirmation`, `fixEcomOrderNames`

---

## 3. Known Issues & Workarounds
- None at this time

---

## 4. Backend Notes

| Data Source | Description |
|---|---|
| `draftInvoiceService` | Draft state, setSubmissionDetails, confirmDraft |
| `CartController.getFilteredRecords` | Unlocked Delivery__c records |
| `CartController.getRecordsByMultipleFields` | Active Account_Route__c |

---

## 5. Changelog

| Date | Ticket | Change |
|---|---|---|
| 2026-04 | BMS-4072 | Delivery dates filtered by active routes, exclude today |
