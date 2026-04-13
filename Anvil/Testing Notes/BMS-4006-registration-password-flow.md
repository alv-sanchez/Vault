# Testing Notes - BMS-4006: Registration — Password Email Flow

## Related
- Ticket: [[BMS-4006]]
- Jira: https://ohanafy.atlassian.net/browse/BMS-4006

---

| Ticket | Component | Change Type | Ticket Link |
|--------|-----------|-------------|-------------|
| BMS-4006 | ecomRegister, RegisterController | Bug Fix | https://ohanafy.atlassian.net/browse/BMS-4006 |

## Overview
**Component**: `ecomRegister` LWC, `RegisterController` Apex
**Change Type**: Bug Fix
**Ticket Description**: After registration, user was redirected to the reset password screen instead of the app. Fix: registration creates the user which triggers a welcome email to set password; after setting password, user is redirected to the landing page.
**Impact Assessment**: Registration flow — new user onboarding.
**Load Testing Required**: [ ] Yes [x] No

---

## Test Cases

*ID prefix: TC-RF*

### Valid Cases — Registration Flow

| Test Case | Expected Outcome |
|-----------|------------------|
| TC-RF-001: Complete registration (Step 1 → Step 2 → Submit) | Step 3 confirmation screen shown: "We've sent an email to your inbox" |
| TC-RF-002: Check email after registration | Welcome/password-setup email received |
| TC-RF-003: Click password link in email | Redirected to password setup page |
| TC-RF-004: Set password and submit | Redirected to the Experience Cloud home/landing page |
| TC-RF-005: Log in with new credentials after flow | Login succeeds, lands on home page |

### Valid Cases — Registration Data

| Test Case | Expected Outcome |
|-----------|------------------|
| TC-RF-006: Verify Contact created | Contact exists under the selected Account with correct name, email, phone |
| TC-RF-007: Verify User created | User exists with correct profile (Ohanafy Community User), linked to Contact |
| TC-RF-008: Verify Contact_Notification__c seeded | Notification preference records created for active notifications |

### Invalid Cases

| Test Case | Expected Behavior |
|-----------|-------------------|
| TC-RF-009: User redirected to reset password screen after registration | Should NOT happen — Step 3 shows email confirmation, user sets password via email link |
| TC-RF-010: Registration fails — verify Contact cleanup | If User creation fails, Contact is deleted (rollback) |
| TC-RF-011: Duplicate email registration | Error: "A user with this email/username already exists" |
