# Notification Services

## Components
`AbandonedCartReminderScheduler`, `AbandonedCartReminderBatch`, `OrderConfirmationService`, `TwilioSMSService`, `NotificationPreferenceController` Apex

## Related Tickets
- [[BMS-4073-notification-services]] — ACR, Order Confirmation, Twilio, order name fix
- [[BMS-4071-registration-sms-optin-license]] — SMS opt-in seeding into Contact_Notification__c
- [[BMS-4075-delete-abandoned-drafts-flow-fix]] — Draft invoice cleanup (related)

---

## 1. Overview

**Purpose:** Backend notification framework for email and SMS. Handles order confirmations (immediate, after checkout) and abandoned cart reminders (scheduled, hourly).

**Target Users:** Retailers (recipients), Admins (configuration)

---

## 2. Features

### Order Confirmation
- Triggered fire-and-forget from `draftInvoiceService.confirmDraft()`
- Supports single (`Order__c`) and split (`Invoice_Group__c`) invoices
- Email: Salesforce EmailTemplate with `WhatId = Order__c`
- SMS: Twilio Content Template via `@future(callout=true)`

### Abandoned Cart Reminder
- `AbandonedCartReminderScheduler` — global, Schedulable, runs hourly
- Cutoff window: `[cutoffDateTime - Threshold_Hours__c, cutoffDateTime)`
- Excludes: confirmed orders, recently notified (24h dedup), no portal user
- `bypassDedup` flag for manual testing
- Dispatches `AbandonedCartReminderBatch` (batch size 10)

### Contact Notification Preferences
- `Contact_Notification__c` — per-contact, per-notification email/SMS toggles
- Seeded on registration via `initializeContactNotifications()`
- `SMS_Enabled__c` set based on `Contact.SMS_Opt_In__c`

### Order Name Fix
- `CartController.fixEcomOrderNames()` — corrects Sales_Rep__c and rebuilds order Name
- Direct User query avoids Experience Cloud CommunityNickname masking

### Twilio SMS
- Named Credential: `ohfy__Twilio_Named_Cred`
- Content Template API with variable builders per notification type
- `sendAndInsertLog()` for callout-first, DML-after pattern

---

## 3. Known Issues & Workarounds
- Twilio must be configured before SMS works
- `System.debug` hidden in managed package subscriber orgs — deploy unmanaged for debugging
- `DateTime.newInstance(Date, Time)` treats inputs as GMT

---

## 4. Backend Notes

| Object | Purpose |
|---|---|
| `Notification__c` | Config: channels, threshold, template keys, Twilio SID |
| `Contact_Notification__c` | Per-contact email/SMS preferences |
| `Notification_Log__c` | Audit: Sent/Failed/Skipped per channel |
| `Delivery__c` | Upcoming deliveries for ACR window |
| `Account_Route__c` | Routes + warehouse cutoff time |

---

## 5. Changelog

| Date | Ticket | Change |
|---|---|---|
| 2026-04 | BMS-4073 | Full notification framework: ACR scheduler/batch, Order Confirmation, Twilio SMS, order name fix |
| 2026-04 | BMS-4071 | SMS_Opt_In__c drives SMS_Enabled on Contact_Notification seeding |
