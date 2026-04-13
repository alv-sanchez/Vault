# Testing Notes - BMS-3399: Profile Page — Account & Contact Details

## Related
- Jira: https://ohanafy.atlassian.net/browse/BMS-3399

---

| Ticket | Component | Change Type | Ticket Link |
|--------|-----------|-------------|-------------|
| BMS-3399 | ecomProfilePage | New Feature | https://ohanafy.atlassian.net/browse/BMS-3399 |

## Overview
**Component**: `ecomProfilePage` LWC
**Change Type**: New Feature
**Ticket Description**: Profile page displaying account info, contact details, and business info with inline editing for contact fields (First Name, Last Name, Phone Number).
**Impact Assessment**: Profile page only.
**Load Testing Required**: [ ] Yes [x] No

---

## Test Cases

*ID prefix: TC-PP*

### Display — Account & Business Info (Read-Only)

| Test Case | Expected Outcome |
|-----------|------------------|
| TC-PP-001: Navigate to Profile page | Page loads with account and contact data displayed |
| TC-PP-002: Verify account name displayed | Shows the retailer's Account name |
| TC-PP-003: Verify business info section | Sales rep, fulfillment location, pricelist, territory shown |
| TC-PP-004: Verify billing address | Street, city, state, ZIP displayed |
| TC-PP-005: Verify contact email displayed | Contact email shown (read-only) |

### Inline Editing — Contact Fields

| Test Case | Expected Outcome |
|-----------|------------------|
| TC-PP-006: Edit First Name | Field becomes editable, saves on submit |
| TC-PP-007: Edit Last Name | Field becomes editable, saves on submit |
| TC-PP-008: Edit Phone Number | Field becomes editable with formatted input, saves 10 digits |
| TC-PP-009: Save valid changes | Toast: success, fields update in UI, Contact record updated in Salesforce |
| TC-PP-010: Cancel editing | Fields revert to original values, no save |

### Phone Validation

| Test Case | Expected Outcome |
|-----------|------------------|
| TC-PP-011: Enter valid 10-digit phone | No error, saves successfully |
| TC-PP-012: Enter fewer than 10 digits | Validation error shown |
| TC-PP-013: Phone area code starts with 0 or 1 | Validation error: invalid US phone |
| TC-PP-014: Phone exchange code starts with 0 or 1 | Validation error: invalid US phone |
| TC-PP-015: Paste phone number | Formatted correctly, validates |

### Invalid Cases

| Test Case | Expected Behavior |
|-----------|-------------------|
| TC-PP-016: Submit with empty Last Name | Validation error — required field |
| TC-PP-017: Save fails (Apex error) | Toast: error message, fields revert |
| TC-PP-018: Edit email directly | Should NOT be editable — read-only |
| TC-PP-019: Edit business info fields | Should NOT be editable — read-only |
