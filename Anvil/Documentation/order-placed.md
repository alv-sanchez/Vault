# Order Placed
> **Confluence**: https://ohanafy.atlassian.net/wiki/spaces/PD/pages/749010955

## Component
`ecomOrderPlaced` LWC

## Related Tickets
- [[BMS-4068-order-placed-cleanup]] — Remove unimplemented elements
- [[BMS-4070-product-image-branding]] — Default product image

---

## 1. Overview

**Purpose:** Order confirmation page displayed after successful checkout. Shows order details, delivery date, and item summary.

**Target Users:** Retailers

---

## 2. Features

### Confirmation Display
- Order number, expected delivery date
- Order items with images, quantities, prices
- Email confirmation notice with masked email
- Continue Shopping / View Order History buttons

### Removed Elements (BMS-4068)
- "Review or edit your order" link
- "What happens next" box
- Shipping/tracking bullet points

---

## 3. Known Issues & Workarounds
- `getOrderConfirmation` is `cacheable=true` — old orders won't reflect Apex changes until a new order is placed

---

## 4. Backend Notes

| Data Source | Description |
|---|---|
| `CartController.getOrderConfirmation` | Order + line items (supports single + split invoices) |
| `CartController.getFilteredRecords` | Contact email for confirmation notice |

---

## 5. Changelog

| Date | Ticket | Change |
|---|---|---|
| 2026-04 | BMS-4068 | Removed review link, what happens next box, shipping bullets |
| 2026-04 | BMS-4070 | Default product image (silver can), branding wire fix |
