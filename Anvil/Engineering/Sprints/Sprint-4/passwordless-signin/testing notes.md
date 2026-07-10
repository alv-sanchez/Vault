# Passwordless Login: Testing Notes

## Overview
**Component**: ecomLoginPasswordless (LWC)  
**Change Type**: New Feature  
**Ticket Description**: Passwordless email-based sign-in for the Retailer Portal. Users enter their email, receive a one-time verification code, and are logged in without a password.  
**Impact Assessment**: Adds a new login method alongside the existing username/password form. No changes to the existing login flow (this is a separate LWC). New User trigger sends verification emails on community user creation — *could affect user provisioning workflows if email deliverability is misconfigured*.  
**Load Testing Required**: [ ] Yes [x] No

---

## Configuration Preferences:

| Configuration Preference Name | New? | Active / Inactive | Value (if applicable) |
|------------------------------|------|-------------------|------------------------|
| None required                |      |                   |                        |

*No configuration preferences are used by this feature.*

---

## Pre-existing Data / Preconditions



| Preconditions ID | Object(s)                     | Fields & Values                                                                                            | Description                                                               |
| ---------------- | ----------------------------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| PRE-01           | User                          | Profile = "Ohanafy Community User", IsActive = true, ContactId != null, HasUserVerifiedEmail = true        | A community user with a verified email address (Validate if not already)  |
| PRE-02           | User                          | Profile = "Ohanafy Community User", IsActive = true, ContactId != null, HasUserVerifiedEmail = false       | A community user whose email has NOT been verified                        |
| PRE-03           | Network                       | Name = "E-Commerce", Status = "Live"                                                                       | An active Experience Cloud site                                           |
| PRE-04           | PermissionSet                 | Ohanafy_Ecom_Guest_Access assigned to E-Commerce guest user (Allows access to PasswordlessLoginController) | Guest user has access to PasswordlessLoginController and Ecom_UI_Wrappers |
| PRE-05           | Setup -> Deliverability       | Email Deliverability = "All Email"                                                                         | Org can send emails to external addresses                                 |
| PRE-06           | Experience Cloud Site Builder | Login Page Type = "Experience Builder Page", ecomLoginPasswordless LWC placed on Login page                | Passwordless component is visible on the login page                       |
| PRE-07           | Setup -> Email -> Organization-Wide Addresses | Organization-Wide Address is configured for the site's sender email                       | Required for Salesforce to send verification emails from a valid address  |
| PRE-08           | Experience Cloud Administration -> Settings   | Site Status = "Active"                                                                    | E-Commerce site must be activated (Administration > Settings > Activate)  |
| PRE-09           | Experience Cloud Administration -> Emails     | "Welcome New Member" = unchecked                                                          | For passwordless login only — disable the welcome email to avoid confusion with the verification email |

---

## UI Component Details

### Setup / Navigation

**Component Location**:  
- Experience Cloud site Login page (`/login`)
- Accessible to unauthenticated (guest) users

### Input Fields / Interactive Elements

| Input Label/Descriptor | Type | Allowed Inputs/Values |
|------------------------|------|------------------------|
| Email Address | Text input (type="email") | Valid email format (e.g., user@company.com) |
| Continue button | Button | Enabled when a valid email is entered; disabled otherwise |

---

## Test Cases

### Valid Cases

#### **Passwordless Login - Valid Cases**

| Test Case                                                                           | Expected Outcome                                                                                                                                                             | Preconditions ID       |
| ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| TC-PL-001: Navigate to the login page                                               | The passwordless login section is visible with an email input field, helper text ("We'll send a verification code to your email address."), and a disabled "Continue" button | PRE-03, PRE-04, PRE-06 |
| TC-PL-002: Enter a valid email and click Continue (verified user)                   | Loading spinner appears ("Sending verification..."), then browser redirects to Salesforce's verification code page                                                           | PRE-01, PRE-05         |
| TC-PL-003: Enter the correct verification code on the SF verification page          | User is authenticated and redirected to the storefront home page                                                                                                             | PRE-01, PRE-05         |
| TC-PL-004: Branding logo is displayed                                               | The Ohanafy logo renders above the "Sign In" heading                                                                                                                         | PRE-06                 |
| TC-PL-005: Press Enter key with valid email                                         | Same behavior as clicking Continue — initiates the passwordless flow                                                                                                         | PRE-01, PRE-05         |
| TC-PL-006: Create a new community user (Ohanafy Community User profile)             | A verification email is automatically sent to the new user's email address                                                                                                   | PRE-03, PRE-05         |
| TC-PL-007: New user clicks verification link in email, then uses passwordless login | After clicking the verification link, the user can sign in via the passwordless flow                                                                                         | PRE-03, PRE-05         |

---

### Invalid Cases

#### **Passwordless Login - Invalid Cases**

| Test Case | Expected Behavior | Preconditions ID |
|-----------|-------------------|------------------|
| TC-PL-101: Click Continue with empty email field | Button is disabled — cannot be clicked | PRE-06 |
| TC-PL-102: Enter an invalid email format (e.g., "notanemail") and blur | Inline validation error appears: "Please enter a valid email address" | PRE-06 |
| TC-PL-103: Focus then blur the email field without entering anything | Inline validation error appears: "Email address is required" | PRE-06 |
| TC-PL-104: Enter a valid email that does not match any user | Blue info banner appears: "If an account exists for this email, a verification code has been sent. Please check your inbox." (intentionally ambiguous — prevents account enumeration) | PRE-03, PRE-04 |
| TC-PL-105: Enter an email for an unverified user (HasUserVerifiedEmail = false) | Same blue info banner as TC-PL-104 — response is identical to prevent email enumeration | PRE-02, PRE-04 |
| TC-PL-106: Enter an incorrect verification code on the SF verification page | Salesforce displays an error on the verification page (standard SF behavior) | PRE-01, PRE-05 |
| TC-PL-107: Create a new community user with a non-"Ohanafy Community User" profile | No verification email is sent (trigger only fires for the ecom profile) | PRE-03 |

---

## Sign-off Criteria:

- [ ] Visual/UI behaviors match expectations
- [ ] Functional logic works as intended
- [ ] Accessibility and responsiveness meet requirements
- [ ] Load testing completed and performance meets requirements
- [ ] Impact assessment reviewed and no negative impact on existing functionality
