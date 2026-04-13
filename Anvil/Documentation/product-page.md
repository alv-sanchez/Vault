# Product Page
> **Confluence**: https://ohanafy.atlassian.net/wiki/spaces/PD/pages/745308179

## Component
`ecomProductPage` LWC

## Related Tickets
- [[BMS-4070-product-image-branding]] — Default product image
- [[BMS-4076-promotions-across-portal]] — Promotions panel, nudge, dollar formatting
- [[BMS-4011]] — Account Item creation on add to cart

## Configuration
- See [[configuration-preferences]] for `ecommerceShowQuantityAvailable`

---

## 1. Overview

**Purpose:** Product detail page showing full product info, image gallery, pricing, promotions, and add-to-cart functionality.

**Target Users:** Retailers

---

## 2. Features

### Product Details
- Name, brand, description, SKU, category, ABV
- Image gallery with fallback to `ecomNoProductImage`
- Responsive: meta fields stack on mobile (`grid-cols-1 sm:grid-cols-3`)

### Pricing
- Regular price, discounted price, savings display
- Promotional price shown when promotion criteria met

### Promotions Panel
- Collapsible "Active Promotions" section
- Per-promotion: name, description, discount (% OFF or $X.XX OFF), progress bar
- Dollar discounts formatted with `.toFixed(2)` ($0.50 not $0.5)
- Nudge banner within 3 units: "Add X more for Y% off!"

### Add to Cart
- Quantity stepper with debounced save (1s)
- Optimistic updates with confirmed quantity fallback on error

---

## 3. Known Issues & Workarounds
- None at this time

---

## 4. Backend Notes

| Data Source | Description |
|---|---|
| `userDataService` | Product data, pricelist pricing, promotions |
| `draftInvoiceService` | Add/update cart items |
| `CartController.getPromotionCriteriaQuantities` | Promotion progress |
| `CartController.createAccountItem` | Creates/reactivates Account_Item__c on add to cart (fire-and-forget) |

---

## 5. Changelog

| Date | Ticket | Change |
|---|---|---|
| 2026-04 | BMS-4070 | Default image changed to silver can |
| 2026-04 | BMS-4076 | Promotions panel, nudge, dollar formatting fix |
| 2026-04 | BMS-4011 | Account Item created/reactivated on add to cart |
