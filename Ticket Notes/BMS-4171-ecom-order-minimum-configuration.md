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

### SCENARIO: Config Default Applies When Account Field is Blank
**GIVEN** the `Configuration_Preference__mdt` record with `Key__c = 'ecomMinimumCaseQuantity'` has `Value__c = '5'`
**AND** the Account has `ECOM_Minimum_Case_Quantity__c = null` (blank)
**AND** the cart contains 3 cases of non-keg products
**WHEN** the customer clicks Place Order
**THEN** the order is blocked and the toast error references the config default of 5 cases
**AND** the minimum used for the check is sourced from the config record, not the Account field

### SCENARIO: Account Override Supersedes Config
**GIVEN** the config record has `Value__c = '5'`
**AND** the Account has `ECOM_Minimum_Case_Quantity__c = 10` (explicit override)
**AND** the cart contains 7 cases of non-keg products
**WHEN** the customer clicks Place Order
**THEN** the order is blocked because the Account override (10) wins over the config default (5)
**AND** the error message references 10, not 5

### SCENARIO: Happy Path — Meets Account-Level Minimum
**GIVEN** the Account has `ECOM_Minimum_Case_Quantity__c = 5` and `ECOM_Allow_Keg_Override__c = true`
**AND** the cart contains 6 cases of non-keg products
**WHEN** the customer clicks Place Order
**THEN** the order is submitted successfully with no validation error
**AND** the Account value is used regardless of what the config holds

### SCENARIO: Happy Path — Keg Override
**GIVEN** the Account has `ECOM_Minimum_Case_Quantity__c = 5` and `ECOM_Allow_Keg_Override__c = true`
**AND** the cart contains 2 cases of a Keg product (total cases < 5)
**WHEN** the customer clicks Place Order
**THEN** the order is submitted successfully because a Keg product is present
**AND** the keg override applies regardless of whether the minimum came from config or the Account field

### SCENARIO: Failure — Below Minimum, No Keg
**GIVEN** the resolved minimum is 5 (from Account field or config, whichever applies)
**AND** the cart contains 3 cases of non-keg products and no keg products
**WHEN** the customer clicks Place Order
**THEN** the order is blocked and a toast error displays "Minimum order not met. Please add at least 5 cases to your order."

### SCENARIO: Keg Override Disabled
**GIVEN** the Account has `ECOM_Minimum_Case_Quantity__c = 5` and `ECOM_Allow_Keg_Override__c = false`
**AND** the cart contains 2 cases of a Keg product (total cases < 5)
**WHEN** the customer clicks Place Order
**THEN** the order is blocked with the minimum order error because keg override is disabled

### SCENARIO: Neither Config nor Account Configured — No Enforcement
**GIVEN** the Account has `ECOM_Minimum_Case_Quantity__c = null` (blank)
**AND** no `Configuration_Preference__mdt` record exists for `Key__c = 'ecomMinimumCaseQuantity'` (or its `Value__c` is blank)
**WHEN** the customer clicks Place Order
**THEN** the order is submitted with no minimum check (no enforcement when nothing is configured)
**AND** this is the backward-compatible fallback for accounts that existed before this feature shipped

---

## Dependencies

- **Cannot Start Until**: None
- **This Story Unlocks**: None
- **Ships With**: None

---

## Implementation Notes

### Configuration Hierarchy

The minimum case quantity resolves in this order (first populated value wins):

1. **Account override** — `Account.ECOM_Minimum_Case_Quantity__c` (if populated, use it)
2. **Config default** — `Configuration_Preference__mdt` record with `Key__c = 'ecomMinimumCaseQuantity'` (if Value__c is populated, use it)
3. **No enforcement** — if neither is set, skip the minimum check entirely (backward-compatible fallback)

This mirrors the existing OHFY-Core pattern where a global config value provides a sensible default and per-record overrides handle exceptions. Admins configure the default once at the org level; individual accounts with unusual requirements (high-volume chains, regulated-only customers, etc.) get the override field set on their Account record.

### New Config Record (Custom Metadata)

| Object                          | Key__c                    | Value__c    | Description                                                                                                                                               |
| ------------------------------- | ------------------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Configuration_Preference__mdt` | `ecomMinimumCaseQuantity` | (e.g., `5`) | Global default minimum case quantity for ecom orders. Overridden per-account by `Account.ECOM_Minimum_Case_Quantity__c`. Unset or blank = no enforcement. |

Look up via the shared utility: `U_ConfigurationPreferenceMDT.getMetadataValue('ecomMinimumCaseQuantity')` (returns `List<String>`; first non-null element is the value).

### New Custom Fields on Account

| Field API Name | Type | Default | Description |
|---|---|---|---|
| `ECOM_Minimum_Case_Quantity__c` | Number(18,0) | (blank) | Per-account override for the minimum cases required. **Leave blank to inherit the config default.** Only set this when an account's minimum must differ from the org-wide value. |
| `ECOM_Allow_Keg_Override__c` | Checkbox | true | If checked, any keg product in cart bypasses the case minimum (regardless of whether the minimum came from Account or config) |

### Validation Location

**Frontend — `ecomReviewSummary.js`**
- Add validation inside `validateForm()` (currently at lines 759-783)
- This method already validates billing address, delivery date, and date-not-in-past
- New check goes after existing validations, before `return true`

**Logic** (resolve the minimum first, then validate):

1. **Resolve the effective minimum** (in order, stop at first populated value):
   a. Read `Account.ECOM_Minimum_Case_Quantity__c` — if populated, use it
   b. Else call `U_ConfigurationPreferenceMDT.getMetadataValue('ecomMinimumCaseQuantity')` — if Value__c is populated, use it (parse to Integer)
   c. Else **skip the minimum check entirely** (no enforcement, backward-compatible fallback) and short-circuit the rest of this logic
2. Read the Account's `ECOM_Allow_Keg_Override__c` flag
3. Check if any cart item is a Keg — identify via `ohfy__Keg_Deposit__c` field on the Item, or `ohfy__Item_Type__r.ohfy__Sub_Type__c` containing "Keg"
4. If keg override is enabled **and** the cart contains a keg item, skip the minimum check
5. Otherwise, sum `orderedQuantityCases` across all cart items and compare to the resolved minimum from step 1
6. Block submission with a toast error that **references the resolved minimum** (so the error matches whichever source won — account or config)

**Note on exposing the config value to the LWC**: Custom Metadata can't be read directly from JS — route it through an `@AuraEnabled` wrapper on an existing or new Apex controller (or expose it via `userDataService` so it's cached once per session alongside the other account/pricelist context). Reading it per-Place-Order is fine too, since this is a single click, not a hot path.

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
- Two-level configuration hierarchy: Custom Metadata default + per-Account override
- Frontend validation only for MVP; consider server-side validation in `EcomWrappers.confirmDrafts_ECOM` as a follow-up

---

## Testing Notes

### Configuration hierarchy coverage
- **Config only** — Account field blank, config set to 5 → enforce 5; error message references 5
- **Account only** — Account field set to 7, no config record (or config blank) → enforce 7; error message references 7
- **Both set, account wins** — Account field set to 10, config set to 5 → enforce 10 (not 5); error message references 10
- **Neither set** — Account field blank, no config record → no enforcement; order submits regardless of cart size
- **Config changed live** — update the config record mid-session on an account without an override; next Place Order attempt should pick up the new value (verifies no stale caching)

### Keg override combined with hierarchy
- Keg override enabled + config default 5 + cart of 2 keg cases → order submits (keg bypasses)
- Keg override disabled + config default 5 + cart of 2 keg cases → order blocked
- Keg override enabled + Account override 10 + cart of 2 keg cases → order submits (keg bypasses regardless of source)

### General
- Test keg override both enabled and disabled
- Confirm that split invoices (if applicable) aggregate case counts across all splits
- Confirm error toast is clear and includes the required minimum number
- Verify that editing cart quantities (removing items below threshold) re-triggers validation on next Place Order attempt
- Note: `EcomWrappers.confirmDrafts_ECOM` lives in an external package (OHFY-CORE) — no server-side minimum check in this ticket scope

---

## Related

- [[BMS-3823]] — prior ticket reference for format
