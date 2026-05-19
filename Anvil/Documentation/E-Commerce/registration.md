# Self-Registration
> **Confluence**: https://ohanafy.atlassian.net/wiki/spaces/PD/pages/910557207

## Component
`ecomRegister` LWC

## Related Tickets
- [[BMS-4048-quick-fixes]] — Shipping ZIP, flexible search, min 3 chars
- [[BMS-4071-registration-sms-optin-license]] — SMS opt-in, conditional license
- [[BMS-4006]] — Password email flow fix

---

## 1. Overview

**Purpose:** 3-step self-registration flow for retailers to create a portal account by finding their business, entering personal details, and setting up credentials.

**Target Users:** Retailers (new)

---

## 2. Features

### Step 1: Business Search
- Search by business name + shipping ZIP code
- Word-split matching: each word matched independently via dynamic SOQL
- Smart quote normalization via `c/utils.sanitizeSearchInput()`
- Minimum 3 characters required
- Optional state license number (required if `Alcohol_License_Required__c = true`)
- Expired licenses block registration with error message

### Step 2: User Details
- First name, last name, email, phone, job title (optional)
- Phone: formatted input with paste support, US validation
- SMS opt-in checkbox appears after valid phone entry
- Consent language for SMS notifications
- `Contact.SMS_Opt_In__c` and `SMS_Opt_In_Date__c` stored on creation

### Step 3: Confirmation
- Success message with email notice
- "Go to Login" button

### Post-Registration (BMS-4006)
- Contact created with SMS opt-in fields
- User created with Experience Cloud profile (triggers welcome email)
- `Contact_Notification__c` records seeded — `SMS_Enabled__c` based on opt-in
- Welcome email sent to set password — user clicks link, sets password, redirected to home page
- User does NOT land on reset password screen — they go through the email-based password setup flow

---

## 3. Known Issues & Workarounds
- OHFY-CORE Account fields must exist before ECOM package install
- `Site.createExternalUser` not available in test context

---

## 4. Backend Notes

| Data Source | Description |
|---|---|
| `RegisterController.searchAccounts` | Dynamic SOQL with word-split, ShippingPostalCode |
| `RegisterController.registerUser` | Creates Contact + User, sets SMS opt-in |
| `NotificationPreferenceController.initializeContactNotifications` | Seeds Contact_Notification__c based on SMS_Opt_In__c |

---

## 5. Changelog

| Date | Ticket | Change |
|---|---|---|
| 2026-04 | BMS-4048 | ZIP changed to ShippingPostalCode, word-split search, 3-char minimum |
| 2026-04 | BMS-4006 | Fixed post-registration flow: welcome email → set password → redirected to home page |
| 2026-04 | BMS-4071 | SMS opt-in checkbox, Contact fields, conditional license |
