# Home Page
> **Confluence**: https://ohanafy.atlassian.net/wiki/spaces/PD/pages/745504772

## Component
`ecomHomeBody` LWC

## Related Tickets
- [[BMS-4069-shop-category-carousel-pagination]] — Category carousel, no limit, scrollable
- [[BMS-4070-product-image-branding]] — Default product image, TBM branding, hero banner

---

## 1. Overview

**Purpose:** Landing page for retailers after login. Displays hero banner, category carousel, featured products, and recent order history with reorder capability.

**Target Users:** Retailers

---

## 2. Features

### Hero Banner
- Configurable title, subtitle, and height via Experience Builder properties
- Background image from `retailHeroBanner` static resource (overridable via branding)
- Gradient overlay for text readability

### Shop by Category Carousel
- Horizontal scrollable carousel (mobile + desktop)
- Categories built from pricelist `Item_Type__r.Sub_Type__c` values
- No hard limit — all sub-types shown, sorted by product count
- Icon matching: ordered array prevents false matches (e.g., "na beer" before "beer")
- Branding overrides via `EcomBrandingController` wire adapter
- Click navigates to shop page filtered by category

### Featured Products
- First 3 pricelist items displayed as product cards
- Shows price, MSRP, savings, stock status (In Stock / Low Stock / Out of Stock)
- Default image: `ecomNoProductImage` (silver can)

### Recently Ordered
- Last 3 orders from `OrderHistoryController.getOrderHistory`
- Shows order number, date, status badge, total, item count
- "Reorder" button opens `reorderModal` with deep-cloned order data

---

## 3. Known Issues & Workarounds
- Featured products use `.slice(0, 3)` on pricelist — not a curated selection

---

## 4. Backend Notes

| Data Source | Description |
|---|---|
| `userDataService` | Pricelist items, promotions, filter data, fulfillment location |
| `OrderHistoryController.getOrderHistory` | Recent orders (limit 3) |
| `CartController.getQuantityAvailableAtFulfillmentLocation` | Inventory for stock badges |
| `EcomBrandingController.getAllBrandingResources` | Logo/banner overrides |

---

## 5. Changelog

| Date | Ticket | Change |
|---|---|---|
| 2026-04 | BMS-4069 | Category carousel: removed 3-item limit, scrollable on desktop, new icons |
| 2026-04 | BMS-4070 | Default product image changed to silver can placeholder |
