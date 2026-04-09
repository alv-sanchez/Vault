# DRAFT-003: Shop Page — Category Carousel & Pagination Dropdown Fix |ECOM|

## Related
- Testing: [[DRAFT-003]] (in Testing/)
- Docs: [[DRAFT-003]] (in Documentation/)

---

**Priority**: Medium
**Effort**: M
**Components**: `ecomHomeBody` LWC, `ecomShop` LWC

## Story Statement

As a Retailer, I want to see all product categories in a scrollable carousel and always have access to the pagination dropdown on the shop page, so that I can browse the full catalog without UI elements disappearing.

## Acceptance Criteria

### SCENARIO: Category Carousel Shows All Types
**GIVEN** a retailer visits the home page
**WHEN** the page loads
**THEN** all product sub-types from the pricelist are displayed as category tiles in a horizontal scrollable carousel
**AND** there is no hard limit on the number of categories shown
**AND** the carousel is scrollable on both mobile and desktop

### SCENARIO: Category Icons Match Sub-Type
**GIVEN** a retailer views the category carousel
**WHEN** a category tile is displayed
**THEN** the icon matches the sub-type (Beer, RTD, Non Alcoholic, NA Beer, Cider, Wine, Alcoholic, Cannabis, Import, Kids Beverages, Mixers, Red Bull, Energy/Sports)
**AND** a fallback Lightning icon is shown if no matching static resource exists

### SCENARIO: Category Click Navigates to Shop
**GIVEN** a retailer clicks a category tile
**WHEN** navigation occurs
**THEN** the shop page opens filtered to that category's sub-type

### SCENARIO: Pagination Dropdown Always Visible
**GIVEN** a retailer is on the shop page
**WHEN** the total number of items is less than or equal to the selected page size (e.g., 25 items with page size 25, or 75 items with page size 100)
**THEN** the pagination dropdown remains visible
**AND** the retailer can still change the page size

### SCENARIO: Pagination Dropdown with Fewer Items
**GIVEN** a retailer selects a page size of 100
**WHEN** only 30 items exist in the filtered results
**THEN** all 30 items are shown on one page
**AND** the page size dropdown is still visible and functional

## Dependencies
- **Cannot Start Until**: None
- **This Story Unlocks**: None
- **Ships With**: Static resource images for category icons (ecomBeer, ecomRTDs, ecomAlcoholic, ecomOverhead, ecomCannabis, ecomCider, ecomImport, ecomKidsBeverages, ecomMixers, ecomNABeer, ecomNonAlc, ecomRedBull, ecomSportsAndEnergy, ecomWine)

## Testing Notes
- Verify no `.slice()` limit on categories array in `ecomHomeBody.js`
- Verify carousel scrolls horizontally on desktop (not grid)
- Verify mobile carousel uses `snap-x snap-mandatory` for swipe behavior
- Verify icon matching order: more specific keys first (e.g., "na beer" before "beer") to avoid false matches
- Verify pagination dropdown visibility condition in `ecomShop.html` — should not be conditionally hidden when items <= page size

## Implementation Notes
- `ecomHomeBody.js`: Categories built from `typeCounts` in `handleUserDataInitialized`, no `.slice()` limit
- `ecomHomeBody.js`: `getCategoryIcon()` uses an ordered array of tuples (not object) to prevent "na beer" matching "beer" first
- `ecomHomeBody.html`: Desktop uses `flex overflow-x-auto snap-x` carousel, not `grid-cols-4`
- `ecomShop.html`: Pagination dropdown conditionally hidden — needs fix to always render
- Static resources: `ecomBeer`, `ecomRTDs`, `ecomAlcoholic`, `ecomOverhead`, `ecomCannabis`, `ecomCider`, `ecomImport`, `ecomKidsBeverages`, `ecomMixers`, `ecomNABeer`, `ecomNonAlc`, `ecomRedBull`, `ecomSportsAndEnergy`, `ecomWine`
- Branding wire adapter `getAllBrandingResources` provides overrides via `_brandingMap`
