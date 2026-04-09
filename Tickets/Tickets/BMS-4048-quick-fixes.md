# BMS-4048: Quick Fixes — Registration ZIP, Account Search, Delivery Banner |ECOM|

## Related
- Testing: [[BMS-4048]] (in Testing/)
- Jira: https://ohanafy.atlassian.net/browse/BMS-4048

---

**Priority**: High
**Effort**: S
**Components**: `RegisterController` Apex, `ecomRegister` LWC, `navigationMenu` LWC, `c/utils` LWC

## Story Statement

As a Retailer, I want account search to match my business regardless of special characters, use my shipping ZIP for registration, and see accurate weekday cutoff dates on the delivery banner, so that registration and ordering guidance work correctly.

## Acceptance Criteria

### 1. Shipping ZIP Code for Registration

**GIVEN** a retailer is registering on the portal
**WHEN** they enter a ZIP code and search for their business
**THEN** the search matches against `ShippingPostalCode` (not `BillingPostalCode`)

### 2. Flexible Account Search

**GIVEN** a retailer searches for "Dixie Bar Grill"
**WHEN** the account name in Salesforce is "Dixie's Bar & Grill"
**THEN** the account is found — each word is matched independently, missing special characters don't block results

**GIVEN** a retailer searches with fewer than 3 characters
**WHEN** they click search or blur the field
**THEN** a validation error shows: "Please enter at least 3 characters"

### 3. Delivery Banner — Weekday Cutoff Only

**GIVEN** a retailer has a Monday delivery route with a 4:30 PM cutoff
**WHEN** the delivery banner renders
**THEN** it reads "Place order by 4:30 PM Friday..." (not Sunday)
**AND** the cutoff date always falls on a weekday (Mon–Fri)

## Dependencies
- **Cannot Start Until**: None
- **This Story Unlocks**: None
- **Ships With**: None
