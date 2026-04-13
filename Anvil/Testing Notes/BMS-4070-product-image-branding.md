# Testing Notes - BMS-4070: Default Product Image & TBM Branding

## Related
- Ticket: [[BMS-4070-product-image-branding]] (in Tickets/Created Tickets/)
- Jira: https://ohanafy.atlassian.net/browse/BMS-4070

---

| Ticket | Component | Change Type | Ticket Link |
|--------|-----------|-------------|-------------|
| BMS-4070 | Multiple LWCs | Enhancement | https://ohanafy.atlassian.net/browse/BMS-4070 |

## Overview
**Component**: `ecomProductPage`, `ecomShop`, `ecomCartPage`, `ecomReviewSummary`, `ecomOrderPlaced`, `ecomRegister`, `ecomHomeBody`
**Change Type**: Branding Update
**Ticket Description**: Replace Ohanafy logo fallback with "Image Coming Soon" can, update branding for TBM.
**Impact Assessment**: All pages that display product images or loading states.
**Load Testing Required**: [ ] Yes [x] No

---

## Test Cases

*ID prefix: TC-IMG*

### Valid Cases

| Test Case | Expected Outcome |
|-----------|------------------|
| TC-IMG-001: Product without Logo_URL__c on Shop page | Silver can "IMAGE COMING SOON" shown |
| TC-IMG-002: Product without Logo_URL__c on Product page | Silver can shown |
| TC-IMG-003: Product without Logo_URL__c on Cart page | Silver can shown |
| TC-IMG-004: Product without Logo_URL__c on Review Order | Silver can shown |
| TC-IMG-005: Product without Logo_URL__c on Order Placed | Silver can shown |
| TC-IMG-006: Product WITH Logo_URL__c | Actual product image shown (not the can) |
| TC-IMG-007: Loading spinner on any page | Shows branding logo (not product fallback) |
| TC-IMG-008: Registration page logo | Shows TBM branding |

### Invalid Cases

| Test Case | Expected Behavior |
|-----------|-------------------|
| TC-IMG-009: Ohanafy spinning logo shown as product fallback | Should NOT happen — silver can shown instead |
| TC-IMG-010: Order Placed page overwrites product image with loading logo | Should NOT happen — fixed in branding wire handler |
