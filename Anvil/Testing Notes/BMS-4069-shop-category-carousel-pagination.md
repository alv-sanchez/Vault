# Testing Notes - BMS-4069: Shop by Category Carousel & Pagination

## Related
- Ticket: [[BMS-4069-shop-category-carousel-pagination]] (in Tickets/Created Tickets/)
- Jira: https://ohanafy.atlassian.net/browse/BMS-4069

---

| Ticket | Component | Change Type | Ticket Link |
|--------|-----------|-------------|-------------|
| BMS-4069 | ecomHomeBody, ecomShop | Enhancement | https://ohanafy.atlassian.net/browse/BMS-4069 |

## Overview
**Component**: `ecomHomeBody` LWC, `ecomShop` LWC
**Change Type**: Enhancement
**Ticket Description**: Remove category limit, make carousel scrollable, update icons, fix pagination dropdown visibility.
**Impact Assessment**: Home page category section and shop page pagination.
**Load Testing Required**: [ ] Yes [x] No

---

## Test Cases

*ID prefix: TC-CC*

### Valid Cases

| Test Case | Expected Outcome |
|-----------|------------------|
| TC-CC-001: Home page loads with categories | All product sub-types displayed (no 3-item limit) |
| TC-CC-002: Scroll category carousel on desktop | Horizontal scroll works smoothly |
| TC-CC-003: Swipe category carousel on mobile | Snap-x swipe behavior works |
| TC-CC-004: Category icon for "Beer" | Shows ecomBeer icon |
| TC-CC-005: Category icon for "NA Beer" | Shows ecomNABeer icon (not Beer icon) |
| TC-CC-006: Category with no matching icon | Shows fallback Lightning custom icon |
| TC-CC-007: Click a category tile | Navigates to shop page filtered by that sub-type |
| TC-CC-008: Shop page with 25 items, page size 25 | Pagination dropdown visible |
| TC-CC-009: Shop page with 20 items, page size 25 | Pagination dropdown still visible |
| TC-CC-010: Shop page with 75 items, page size 100 | Pagination dropdown still visible |

### Invalid Cases

| Test Case | Expected Behavior |
|-----------|-------------------|
| TC-CC-011: Category carousel shows only 3 tiles | Should NOT happen — all sub-types shown |
| TC-CC-012: Pagination dropdown disappears when items <= page size | Should NOT happen — always visible |
