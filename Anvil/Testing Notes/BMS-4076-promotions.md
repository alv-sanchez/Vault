# Testing Notes - BMS-4076: Promotions v2

## Related
- Ticket: [[BMS-4076-promotions-across-portal]] (in Tickets/Created Tickets/)
- Jira: https://ohanafy.atlassian.net/browse/BMS-4076

---

| Ticket | Component | Change Type | Ticket Link |
|--------|-----------|-------------|-------------|
| BMS-4076 | ecomShop, ecomProductPage, ecomCartPage, itemPromotionsModal | New Feature | https://ohanafy.atlassian.net/browse/BMS-4076 |

## Overview
**Component**: `ecomShop`, `ecomProductPage`, `ecomCartPage`, `itemPromotionsModal` LWCs
**Change Type**: New Feature
**Ticket Description**: Promotions across shop, product, and cart pages — badges, progress bars, nudge messages, bookmark flags, savings summary.
**Impact Assessment**: All product-facing pages.
**Load Testing Required**: [ ] Yes [x] No

## Preconditions
- Active straight-line auto-apply promotions exist
- Promotion_Product__c junctions with criteria quantities
- Products in pricelist that match promotion criteria

---

## Test Cases

*ID prefix: TC-PR*

### Shop Page

| Test Case | Expected Outcome |
|-----------|------------------|
| TC-PR-001: Product with active promotion | Promotion badge with count visible on card |
| TC-PR-002: Click promotion badge | itemPromotionsModal opens with promotion details |
| TC-PR-003: Promotion fulfilled (qty meets criteria) | Progress bar green, "Promotion applied!" with savings |
| TC-PR-004: Promotion in progress | Progress bar amber with current/required count |
| TC-PR-005: "X promotions available" banner | Count matches number of promotable products |

### Product Page

| Test Case | Expected Outcome |
|-----------|------------------|
| TC-PR-006: Product with promotions | "Active Promotions" collapsible panel visible |
| TC-PR-007: Expand promotions panel | Shows name, description, discount, progress bar |
| TC-PR-008: Dollar discount of $0.50 | Displays "$0.50 OFF" (not "$0.5 OFF") |
| TC-PR-009: Within 3 units of criteria | Nudge banner: "Add X more for Y% off!" |
| TC-PR-010: Promotion fulfilled | Promotional price shown, progress bar 100% green |
| TC-PR-011: Product with no promotions | No promotions panel or nudge shown |

### Cart Page

| Test Case | Expected Outcome |
|-----------|------------------|
| TC-PR-012: Cart item meets promotion criteria | Yellow bookmark flag (%) on top-right of item |
| TC-PR-013: Cart item subtotal | Reflects discounted price when promotion fulfilled |
| TC-PR-014: Cart summary | "Promotion Savings" line visible with total discount |
| TC-PR-015: Cart item within 3 units of criteria | Nudge banner with "Add X more" quick-add button |
| TC-PR-016: Click quick-add button | Remaining quantity added, promotion fulfilled |
| TC-PR-017: No promotions fulfilled | No bookmark flags, no savings line |
| TC-PR-018: Change quantity to meet criteria | Flag appears, subtotal updates, savings recalculated |
| TC-PR-019: Change quantity below criteria | Flag disappears, subtotal reverts to regular price |

### Invalid Cases

| Test Case | Expected Behavior |
|-----------|-------------------|
| TC-PR-020: Non-straight-line promotion | Should NOT appear (only straight-line auto-apply supported) |
| TC-PR-021: Promotion with no criteria quantity | No progress bar or nudge shown |
