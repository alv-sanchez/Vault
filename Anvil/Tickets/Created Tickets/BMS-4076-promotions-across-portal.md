# BMS-4076: Promotions v2 — Shop Page, Product Page & Cart Page Integration |ECOM|

## Related
- Jira: https://ohanafy.atlassian.net/browse/BMS-4076
- Testing: [[BMS-4076]] (in Testing/)

---

**Priority**: High
**Effort**: L
**Components**: `ecomShop` LWC, `ecomProductPage` LWC, `ecomCartPage` LWC, `itemPromotionsModal` LWC, `userDataService` LWC, `CartController.getPromotionCriteriaQuantities` Apex

## Story Statement

As a Retailer, I want to see active promotions on products throughout the portal — on the shop page, product detail page, and cart page — including progress toward unlocking a deal, nudge messages when I'm close, and visual flags on discounted items, so that I can take advantage of available deals and understand my savings.

## Acceptance Criteria

### Shop Page — Promotion Badges & Progress

**GIVEN** a product has one or more active straight-line auto-apply promotions
**WHEN** the retailer views the shop page
**THEN** a promotion badge icon appears on the product card with a count of active promotions
**AND** clicking the badge opens the `itemPromotionsModal` with full promotion details
**AND** a promotion progress bar appears below the product image showing fulfillment status

**GIVEN** the retailer's cart quantity meets the promotion criteria
**WHEN** the shop page renders
**THEN** the progress bar shows green with "Promotion applied!" and the savings amount

**GIVEN** the retailer's cart quantity is below the criteria
**WHEN** the shop page renders
**THEN** the progress bar shows the current progress (e.g., "2 of 5") with an amber fill

### Product Page — Promotions Panel & Nudge

**GIVEN** a retailer views a product with active promotions
**WHEN** the product page loads
**THEN** an "Active Promotions" collapsible panel shows all applicable promotions
**AND** each promotion displays: name, description, discount (% OFF or $X.XX OFF), progress bar, and fulfillment status

**GIVEN** a retailer is within 3 units of unlocking a promotion
**WHEN** they view the product page
**THEN** a nudge banner appears below the quantity stepper: "Add X more for Y% off this product!" or "Add X more — get $Y off this product!"

**GIVEN** a promotion is fulfilled
**WHEN** the product page renders
**THEN** the promotional price is displayed alongside the regular price
**AND** the progress bar shows 100% green with "Promotion applied!"

### Cart Page — Applied Promotion Flag & Nudge

**GIVEN** a cart item's quantity meets the promotion criteria
**WHEN** the cart page renders
**THEN** a yellow bookmark flag with "%" appears on the top-right corner of that item's row
**AND** the item's subtotal reflects the discounted price
**AND** a "Promotion Savings" line appears in the cart summary with the total discount

**GIVEN** a cart item is within 3 units of meeting the criteria
**WHEN** the cart page renders
**THEN** a promotion nudge banner appears on that item: "Add X more for Y% off!"
**AND** a quick-add button lets the retailer add the remaining quantity in one click

**GIVEN** no cart items have promotions applied
**WHEN** the cart page renders
**THEN** no bookmark flags are shown
**AND** the "Promotion Savings" line is hidden from the summary

### Dollar Discount Formatting

**GIVEN** a promotion has `Discount_Dollars__c = 0.50`
**WHEN** displayed anywhere in the portal
**THEN** it shows as "$0.50 OFF" (not "$0.5 OFF")

## Dependencies
- **Cannot Start Until**: None
- **This Story Unlocks**: None
- **Ships With**: None

## Testing Notes
- Verify `userDataService` loads `itemToPromotionsMap` and `allPromotions` during initialization
- Verify only straight-line auto-apply promotions are shown (`ohfy__Straight_Line__c = true`, `ohfy__Auto_Apply_Promotion__c = true`)
- Shop page: verify promotion badge count, modal open on click, progress bar states (fulfilled/in-progress/no progress)
- Product page: verify collapsible panel, nudge within 3 units, dollar discount `.toFixed(2)`, promotional price display
- Cart page: verify yellow bookmark flag on fulfilled items, nudge banner within 3 units, quick-add button, savings line in summary
- Cart page: verify `applyPromotionToItem()` recalculates on every quantity change
- Cart page: verify `loadPromotionCriteriaQuantities()` calls Apex with relevant promotion IDs and item IDs
- Verify promotions banner on shop page shows count: "X promotions available"

## Implementation Notes
- **Shop page** (`ecomShop.js`): `loadItems()` stamps `hasPromotions`, `promotionsCount`, `firstPromotion` (with `isFulfilled`, `progressPercent`, `savingsText`) on each item from `itemToPromotionsMap`
- **Product page** (`ecomProductPage.js`): `processedPromotions` getter builds promotion list with progress, nudge messages, dollar formatting (`.toFixed(2)` for dollar discounts)
- **Cart page** (`ecomCartPage.js`): `applyPromotionToItem()` stamps `isFulfilled`, `promotionSavings`, `showPromotionNudge`, `promotionNudge`, `promotionRemainingQty` on each cart item; `loadPromotionCriteriaQuantities()` fetches criteria from Apex
- **Cart page** (`ecomCartPage.html`): Bookmark flag via `<template if:true={cartItem.isFulfilled}>` with yellow `clip-path: polygon(...)` bookmark; nudge banner with "Add X more" button calling `handleAddRemainingForPromotion`
- **Promotions modal** (`itemPromotionsModal`): Opened from shop page badge click, shows full promotion details
- **Promotion data source**: `userDataService.getPromotionsData()` → `itemToPromotionsMap` (itemId → promoIds), `allPromotions` (full promo records)
- **Criteria quantities**: `CartController.getPromotionCriteriaQuantities()` returns required quantities per promotion+item
