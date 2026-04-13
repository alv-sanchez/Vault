# Enforce E-Commerce Order Case Minimum |ECOM|

- **Jira**: [BMS-4171](https://ohanafy.atlassian.net/browse/BMS-4171)
- **Type**: Story | **Status**: To Do | **Priority**: Medium
- **Effort**: M
- **Assignee**: Alvaro Sanchez
- **Components**: `ecomReviewSummary`, `draftInvoiceService`, `Account` (custom fields)

---

## Story Statement

> As an **E-Commerce Customer**, I want **the system to enforce a minimum case quantity on my order before submission**, so that **our distribution operations receive orders that meet the minimum fulfillment threshold.**

---

## Acceptance Criteria

### SCENARIO: Happy Path — Meets Case Minimum
**GIVEN** the Account has `ECOM_Minimum_Case_Quantity__c = 5` and `ECOM_Allow_Keg_Override__c = true`
**AND** the cart contains 6 cases of non-keg products
**WHEN** the customer clicks Place Order
**THEN** the order is submitted successfully with no validation error

### SCENARIO: Happy Path — Keg Override
**GIVEN** the Account has `ECOM_Minimum_Case_Quantity__c = 5` and `ECOM_Allow_Keg_Override__c = true`
**AND** the cart contains 2 cases of a Keg product (total cases < 5)
**WHEN** the customer clicks Place Order
**THEN** the order is submitted successfully because a Keg product is present

### SCENARIO: Failure — Below Minimum, No Keg
**GIVEN** the Account has `ECOM_Minimum_Case_Quantity__c = 5`
**AND** the cart contains 3 cases of non-keg products and no keg products
**WHEN** the customer clicks Place Order
**THEN** the order is blocked and a toast error displays "Minimum order not met. Please add at least 5 cases to your order."

### SCENARIO: Keg Override Disabled
**GIVEN** the Account has `ECOM_Minimum_Case_Quantity__c = 5` and `ECOM_Allow_Keg_Override__c = false`
**AND** the cart contains 2 cases of a Keg product (total cases < 5)
**WHEN** the customer clicks Place Order
**THEN** the order is blocked with the minimum order error because keg override is disabled

### SCENARIO: No Minimum Configured
**GIVEN** the Account has `ECOM_Minimum_Case_Quantity__c = null` (blank)
**WHEN** the customer clicks Place Order
**THEN** the order is submitted with no minimum check (no enforcement when unconfigured)

---

## Dependencies

- **Cannot Start Until**: None
- **This Story Unlocks**: None
- **Ships With**: None

---

## Implementation Notes

### New Custom Fields on Account

| Field API Name | Type | Default | Description |
|---|---|---|---|
| `ECOM_Minimum_Case_Quantity__c` | Number(18,0) | 5 | Minimum total cases required for an ecom order |
| `ECOM_Allow_Keg_Override__c` | Checkbox | true | If checked, any keg product in cart bypasses the case minimum |

### Validation Location

**Frontend — `ecomReviewSummary.js`**
- Add validation inside `validateForm()` (currently at lines 759-783)
- This method already validates billing address, delivery date, and date-not-in-past
- New check goes after existing validations, before `return true`

**Logic**:
1. Get the Account's `ECOM_Minimum_Case_Quantity__c` and `ECOM_Allow_Keg_Override__c` (expose via `userDataService` or wire from the Account record)
2. Check if any cart item is a Keg — identify via `ohfy__Keg_Deposit__c` field on the Item, or `ohfy__Item_Type__r.ohfy__Sub_Type__c` containing "Keg"
3. If keg override is enabled and cart contains a keg item, skip minimum check
4. Otherwise, sum `orderedQuantityCases` across all cart items and compare to the minimum
5. Block submission with toast error if below threshold

### Key Code References

| File | What | Lines |
|---|---|---|
| `ecomReviewSummary.js` | `handlePlaceOrder()` — submission entry point | 710-753 |
| `ecomReviewSummary.js` | `validateForm()` — where to add the check | 759-783 |
| `ecomReviewSummary.js` | `loadCartItems()` — maps item data including `productType` | 294-350 |
| `draftInvoiceService.js` | `confirmDraft()` — actual Apex call for order confirmation | 487-537 |
| `draftInvoiceService.js` | `getItemCount()` — existing item count logic | 226-252 |
| `userDataService.js` | `getPricelistItems()` — loads product data with keg/type fields | 290-374 |

### Keg Identification

Products can be identified as kegs via:
- `ohfy__Keg_Deposit__c` (Boolean on Item__c)
- `ohfy__Item_Type__r.ohfy__Sub_Type__c` containing "Keg"
- `ohfy__Item_Line__r.ohfy__Type__c` (though "Keg Shell" type is excluded from catalog)

The `loadCartItems()` method at line 325 already extracts `productType` from `ohfy__Item_Type__r?.Name` and `productSubType` from `ohfy__Sub_Type__c` — these are available on cart items.

### Scope Boundaries

- Ecom only — does not affect internal order creation flows
- Quantity-based only — no dollar threshold
- Account-level configuration for per-account flexibility
- Frontend validation only for MVP; consider server-side validation in `EcomWrappers.confirmDrafts_ECOM` as a follow-up

---

## Testing Notes

- Verify with accounts that have the minimum configured and accounts where the field is blank
- Test keg override both enabled and disabled
- Confirm that split invoices (if applicable) aggregate case counts across all splits
- Confirm error toast is clear and includes the required minimum number
- Verify that editing cart quantities (removing items below threshold) re-triggers validation on next Place Order attempt
- Note: `EcomWrappers.confirmDrafts_ECOM` lives in an external package (OHFY-CORE) — no server-side minimum check in this ticket scope

---

## Related

- [[BMS-3823]] — prior ticket reference for format
