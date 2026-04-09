# DRAFT-005: Self-Registration — SMS Opt-In & Conditional License Number |ECOM|

## Related
- Testing: [[DRAFT-005]] (in Testing/)
- Docs: [[DRAFT-005]] (in Documentation/)

---

**Priority**: High
**Effort**: M
**Components**: `ecomRegister` LWC, `RegisterController` Apex, `NotificationPreferenceController` Apex, Contact object (new fields)

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

### SCENARIO: Conditional License Number Field
**GIVEN** a user searches for a business on Step 1
**WHEN** the matched Account has `ohfy__Alcohol_License_Required__c = true`
**THEN** the State License Number field is required
**AND** the search query includes the license number to match against `ohfy__State_License_Number__c`

### SCENARIO: License Not Required
**GIVEN** a user searches for a business
**WHEN** the matched Account has `ohfy__Alcohol_License_Required__c = false` or unchecked
**THEN** the State License Number field is optional
**AND** only accounts without alcohol license requirements are returned

## Dependencies
- **Cannot Start Until**: `ohfy__State_License_Number__c` field on Account (OHFY-CORE — see DRAFT-008)
- **This Story Unlocks**: None
- **Ships With**: New Contact fields `SMS_Opt_In__c`, `SMS_Opt_In_Date__c`

## Testing Notes
- Verify SMS checkbox only appears after valid phone entry (`phoneValid = true`)
- Verify `SMS_Opt_In__c` and `SMS_Opt_In_Date__c` persisted on Contact after registration
- Verify `Contact_Notification__c` records: SMS_Enabled matches SMS_Opt_In on Contact
- Verify license field conditional rendering based on `ohfy__Alcohol_License_Required__c`
- Verify expired license blocks registration with user-friendly error
- Verify duplicate email/contact detection still works

## Implementation Notes
- New Contact fields: `ohfy__SMS_Opt_In__c` (Checkbox), `ohfy__SMS_Opt_In_Date__c` (DateTime)
- `RegisterController.registerUser()`: accepts `Boolean smsOptIn` parameter, sets both fields on Contact
- `NotificationPreferenceController.initializeContactNotifications()`: queries `Contact.SMS_Opt_In__c` to set `SMS_Enabled__c`
- `ecomRegister.js`: `smsOptIn` tracked property, passed in `params` to `registerUser`
- `ecomRegister.html`: SMS checkbox rendered inside `<template if:true={phoneValid}>`
- License logic already in `RegisterController.searchAccounts()` — filters by `ohfy__Alcohol_License_Required__c` and `ohfy__State_License_Number__c`
