# DRAFT-008: Add State License Number Field to Account |OHFY-CORE|

## Related
- Testing: [[DRAFT-008]] (in Testing/)
- Docs: [[DRAFT-008]] (in Documentation/)

---

**Priority**: Medium
**Effort**: S
**Components**: Account object (OHFY-CORE package)

## Story Statement

As an Admin, I want a `State_License_Number__c` field on the Account object, so that the e-commerce self-registration flow can validate retailer license numbers during signup.

## Acceptance Criteria

### SCENARIO: Field Exists on Account
**GIVEN** an admin views the Account object
**WHEN** they inspect the fields
**THEN** `ohfy__State_License_Number__c` (Text) exists
**AND** `ohfy__Alcohol_License_Required__c` (Checkbox) exists
**AND** `ohfy__License_Expiration_Date__c` (Date) exists

### SCENARIO: Registration Uses License Fields
**GIVEN** a user registers on the portal
**WHEN** they search for a business
**THEN** the search matches against `ohfy__State_License_Number__c` (digits only comparison)
**AND** expired licenses (`License_Expiration_Date__c < today`) block registration with an error message

## Dependencies
- **Cannot Start Until**: None
- **This Story Unlocks**: DRAFT-005 (Self-Registration SMS Opt-In & Conditional License)
- **Ships With**: OHFY-CORE package update

## Testing Notes
- Verify fields exist after CORE package install
- Verify `RegisterController.searchAccounts()` queries these fields
- Verify digits-only comparison: `replaceAll('[^0-9]', '')` on both input and stored value

## Implementation Notes
- These fields may already exist in OHFY-CORE — verify before creating
- `RegisterController.searchAccounts()` already references these fields
- This is a CORE dependency — must be packaged and installed before ECOM registration works with license validation
