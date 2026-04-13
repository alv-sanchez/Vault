# Cart Page
> **Confluence**: https://ohanafy.atlassian.net/wiki/spaces/PD/pages/746618885

## Component
`ecomCartPage` LWC

## Related Tickets
- [[BMS-4070-product-image-branding]] — Default product image
- [[BMS-4076-promotions-across-portal]] — Promotion flag, nudge, savings summary

---

## 1. Overview

**Purpose:** Shopping cart where retailers review items, adjust quantities, apply promotions, and proceed to checkout.

**Target Users:** Retailers

---

## 2. Features

### Cart Items
- Product image, name, brand, unit price, quantity stepper, subtotal
- Default image: `ecomNoProductImage` for missing Logo_URL__c
- Clear all items functionality

### Promotions
- Yellow bookmark flag (%) on fulfilled items (`clip-path: polygon`)
- Discounted subtotal when promotion criteria met
- Nudge banner within 3 units: "Add X more for Y% off!" with quick-add button
- "Promotion Savings" line in cart summary total

### Cart Summary
- Subtotal, promotion savings (if any), total
- Proceed to checkout button

---

## 3. Known Issues & Workarounds
- None at this time

---

## 4. Backend Notes

| Data Source | Description |
|---|---|
| `draftInvoiceService` | Cart state, add/update/clear items |
| `CartController.getPromotionCriteriaQuantities` | Promotion fulfillment check |
| `userDataService` | Promotions data, pricelist pricing |

---

## 5. Changelog

| Date | Ticket | Change |
|---|---|---|
| 2026-04 | BMS-4070 | Default product image |
| 2026-04 | BMS-4076 | Promotion bookmark flag, nudge, savings summary |
