# Testing Notes - BMS-4071: Registration SMS Opt-In & Conditional License

## Related
- Ticket: [[BMS-4071-registration-sms-optin-license]] (in Tickets/Created Tickets/)
- Jira: https://ohanafy.atlassian.net/browse/BMS-4071

---

| Ticket   | Component                                                          | Change Type | Ticket Link                                   |
| -------- | ------------------------------------------------------------------ | ----------- | --------------------------------------------- |
| BMS-4071 | ecomRegister, RegisterController, NotificationPreferenceController | New Feature | https://ohanafy.atlassian.net/browse/BMS-4071 |

## Overview
**Component**: `ecomRegister` LWC, `RegisterController` Apex, `NotificationPreferenceController` Apex
**Change Type**: New Feature
**Ticket Description**: SMS opt-in during registration, conditional license number field, Contact_Notification seeding based on opt-in.
**Impact Assessment**: Registration flow + notification preference seeding.
**Load Testing Required**: [ ] Yes [x] No

---

## Test Cases

*ID prefix: TC-REG*

### Valid Cases — SMS Opt-In

| Test Case | Expected Outcome |
|-----------|------------------|
| TC-REG-001: Enter valid 10-digit phone | SMS opt-in checkbox appears with consent language |
| TC-REG-002: Check SMS opt-in and register | Contact.SMS_Opt_In__c = true, SMS_Opt_In_Date__c = current datetime |
| TC-REG-003: Do NOT check opt-in and register | Contact.SMS_Opt_In__c = false, SMS_Opt_In_Date__c = null |
| TC-REG-004: Register with opt-in = true | Contact_Notification__c records: Email_Enabled = true, SMS_Enabled = true |
| TC-REG-005: Register with opt-in = false | Contact_Notification__c records: Email_Enabled = true, SMS_Enabled = false |

### Valid Cases — Conditional License

| Test Case | Expected Outcome |
|-----------|------------------|
| TC-REG-006: Search account with Alcohol_License_Required = true, provide license | Account found, license matched digits-only |
| TC-REG-007: Search account with Alcohol_License_Required = false, no license | Account found, license field optional |
| TC-REG-008: Account with expired license | Registration blocked with error message |

### Invalid Cases

| Test Case | Expected Behavior |
|-----------|-------------------|
| TC-REG-009: Enter fewer than 10 digits for phone | SMS checkbox does NOT appear |
| TC-REG-010: Search with Alcohol_License_Required = true, no license provided | Only non-alcohol accounts returned |
| TC-REG-011: Duplicate email registration | Error: "A contact with this email already exists" |

### Verification Query

```sql
SELECT Contact__r.Name, Notification__r.Developer_Key__c, Email_Enabled__c, SMS_Enabled__c
FROM Contact_Notification__c
WHERE Contact__r.Email = '<registered-email>'
```
