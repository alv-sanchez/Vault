# BMS-4071: Self-Registration — SMS Opt-In & Conditional License Number |ECOM|

## Related
- Jira: https://ohanafy.atlassian.net/browse/BMS-4071
- Testing: [[BMS-4071]] (in Testing/)
- Docs: [[BMS-4071]] (in Documentation/)

---

**Priority**: High
**Effort**: M
**Components**: `ecomRegister` LWC, `RegisterController` Apex, `NotificationPreferenceController` Apex, Contact object (new fields), Account object (OHFY-CORE fields)

## Story Statement

As a Retailer registering for the portal, I want to opt in to SMS notifications during signup and only be asked for my license number if my business requires one, so that my notification preferences are set correctly from day one and registration is streamlined.

## Acceptance Criteria

### SCENARIO: SMS Opt-In Checkbox
**GIVEN** a user is on Step 2 (User Details) of registration
**WHEN** they enter a valid 10-digit phone number
**THEN** an SMS opt-in checkbox appears with consent language: "By checking this box, you agree to receive SMS messages related to order confirmations and account notifications..."

### SCENARIO: SMS Opt-In Stored on Contact
**GIVEN** a user checks the SMS opt-in checkbox and submits registration
**WHEN** the Contact record is created
**THEN** `Contact.SMS_Opt_In__c = true`
**AND** `Contact.SMS_Opt_In_Date__c` is set to the current date/time

### SCENARIO: SMS Opt-Out (Checkbox Unchecked)
**GIVEN** a user does NOT check the SMS opt-in checkbox
**WHEN** the Contact record is created
**THEN** `Contact.SMS_Opt_In__c = false`
**AND** `Contact.SMS_Opt_In_Date__c` is null

### SCENARIO: Contact Notifications Seeded Based on Opt-In
**GIVEN** a new user registers with SMS opt-in = true
**WHEN** `initializeContactNotifications` runs
**THEN** `Contact_Notification__c` records are created for all active notifications
**AND** `Email_Enabled__c = true` on all records
**AND** `SMS_Enabled__c = true` on all records

### SCENARIO: Contact Notifications Seeded Without Opt-In
**GIVEN** a new user registers with SMS opt-in = false
**WHEN** `initializeContactNotifications` runs
**THEN** `Contact_Notification__c` records are created for all active notifications
**AND** `Email_Enabled__c = true` on all records
**AND** `SMS_Enabled__c = false` on all records

### SCENARIO: Account License Fields Exist (OHFY-CORE)
**GIVEN** an admin inspects the Account object
**WHEN** they view custom fields
**THEN** `ohfy__State_License_Number__c` (Text), `ohfy__Alcohol_License_Required__c` (Checkbox), and `ohfy__License_Expiration_Date__c` (Date) exist
**AND** these fields are available after OHFY-CORE package install

### SCENARIO: Conditional License Number Field
**GIVEN** a user searches for a business on Step 1
**WHEN** the matched Account has `ohfy__Alcohol_License_Required__c = true`
**THEN** the State License Number field is required
**AND** the search query includes the license number to match against `ohfy__State_License_Number__c` (digits-only comparison)

### SCENARIO: License Not Required
**GIVEN** a user searches for a business
**WHEN** the matched Account has `ohfy__Alcohol_License_Required__c = false` or unchecked
**THEN** the State License Number field is optional
**AND** only accounts without alcohol license requirements are returned

### SCENARIO: Expired License Blocks Registration
**GIVEN** a user searches for a business that requires an alcohol license
**WHEN** the Account's `ohfy__License_Expiration_Date__c` is before today
**THEN** registration is blocked with error: "Your license has expired. Please reach out to your account owner to update your license information before registering."

## Dependencies
- **Cannot Start Until**: None
- **This Story Unlocks**: None
- **Ships With**: New Contact fields `SMS_Opt_In__c`, `SMS_Opt_In_Date__c` + OHFY-CORE Account fields (`State_License_Number__c`, `Alcohol_License_Required__c`, `License_Expiration_Date__c`)

## Testing Notes
- Verify SMS checkbox only appears after valid phone entry (`phoneValid = true`)
- Verify `SMS_Opt_In__c` and `SMS_Opt_In_Date__c` persisted on Contact after registration
- Verify `Contact_Notification__c` records: SMS_Enabled matches SMS_Opt_In on Contact
- Verify license field conditional rendering based on `ohfy__Alcohol_License_Required__c`
- Verify expired license blocks registration with user-friendly error
- Verify duplicate email/contact detection still works
- Verify Account fields exist after OHFY-CORE install
- Verify digits-only license comparison: `replaceAll('[^0-9]', '')` on both input and stored value

## Implementation Notes
- New Contact fields: `ohfy__SMS_Opt_In__c` (Checkbox), `ohfy__SMS_Opt_In_Date__c` (DateTime)
- OHFY-CORE Account fields: `ohfy__State_License_Number__c`, `ohfy__Alcohol_License_Required__c`, `ohfy__License_Expiration_Date__c` — may already exist, verify before creating
- `RegisterController.registerUser()`: accepts `Boolean smsOptIn` parameter, sets both fields on Contact
- `NotificationPreferenceController.initializeContactNotifications()`: queries `Contact.SMS_Opt_In__c` to set `SMS_Enabled__c`
- `ecomRegister.js`: `smsOptIn` tracked property, passed in `params` to `registerUser`
- `ecomRegister.html`: SMS checkbox rendered inside `<template if:true={phoneValid}>`
- `RegisterController.searchAccounts()`: filters by `ohfy__Alcohol_License_Required__c` and `ohfy__State_License_Number__c`, blocks expired licenses
