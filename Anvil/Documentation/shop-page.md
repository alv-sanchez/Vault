# Shop Page
> **Confluence**: https://ohanafy.atlassian.net/wiki/spaces/PD/pages/744980487

## Component
`ecomShop` LWC

## Related Tickets
- [[BMS-4069-shop-category-carousel-pagination]] — Pagination dropdown always visible
- [[BMS-4076-promotions-across-portal]] — Promotion badges, progress bars, modal
- [[BMS-4011]] — Account Item creation on add to cart
- [[BMS-4008]] — Brand search fix

## Configuration
- See [[configuration-preferences]] for `ecommerceShowQuantityAvailable`

---

## 1. Overview

**Purpose:** Product catalog page where retailers browse, search, filter, and add items to their cart.

**Target Users:** Retailers

---

## 2. Features

### Product Grid
- Displays pricelist items as cards with image, name, brand, price, stock status
- Default image: `ecomNoProductImage` for products without `Logo_URL__c`
- Click navigates to product detail page

### Search
- `checkSearchFilter()` matches against product name, item number (`ohfy__Item_Number__c`), and brand name (`ohfy__Item_Type__r.Name`)

### Filters
- Sidebar filters: Brand, Type (Sub_Type__c), Supplier, UOM, Stock status
- Category filter from URL params (home page category click)
- Filters update dependent options (e.g., selecting a supplier filters brands)

### Pagination
- Page sizes: 25, 50, 100, 200
- Dropdown always visible regardless of item count vs page size

### Promotions
- Promotion badge with count on product cards (click opens modal)
- Progress bar below image: green (fulfilled), amber (in progress)
- "X promotions available" banner at top of grid

---

## 3. Known Issues & Workarounds
- `getPromotionJunctions` has a known issue with parameter assignment

---

## 4. Backend Notes

| Data Source | Description |
|---|---|
| `userDataService` | Pricelist items, promotions, filter options |
| `CartController.getQuantityAvailableAtFulfillmentLocation` | Stock quantities |
| `CartController.getBrands` | Brand/type/supplier filter data |
| `CartController.getPromotionCriteriaQuantities` | Promotion fulfillment progress |
| `CartController.createAccountItem` | Creates/reactivates Account_Item__c on add to cart (fire-and-forget) |

---

## 5. Changelog

| Date | Ticket | Change |
|---|---|---|
| 2026-04 | BMS-4069 | Pagination dropdown always visible |
| 2026-04 | BMS-4076 | Promotion badges, progress bars, promotions modal |
| 2026-04 | BMS-4008 | Search now matches brand name (`Item_Type__r.Name`) in addition to product name and SKU |
| 2026-04 | BMS-4011 | Account Item created/reactivated on add to cart |
