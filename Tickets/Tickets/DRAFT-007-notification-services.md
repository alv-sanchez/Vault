# DRAFT-007: Notification Services — Abandoned Cart Reminder & Order Confirmation |ECOM|

## Related
- Testing: [[DRAFT-007]] (in Testing/)
- Docs: [[DRAFT-007]] (in Documentation/)

---

**Priority**: High
**Effort**: L
**Components**: `AbandonedCartReminderScheduler`, `AbandonedCartReminderBatch`, `OrderConfirmationService`, `TwilioSMSService`, `NotificationPreferenceController` Apex, `draftInvoiceService` LWC, `Notification__c`, `Notification_Log__c`, `Contact_Notification__c`

## Story Statement

As an Admin, I want the abandoned cart reminder and order confirmation notifications to send emails and SMS to eligible portal customers based on their preferences and delivery cutoff windows, so that customers are reminded to place orders and receive confirmation when they do.

## Acceptance Criteria

### SCENARIO: Order Confirmation — Email & SMS Sent After Checkout
**GIVEN** a retailer confirms a draft order
**WHEN** the order is successfully submitted
**THEN** an order confirmation email is sent (if `Contact_Notification__c.Email_Enabled__c = true`)
**AND** an order confirmation SMS is sent via Twilio (if `Contact_Notification__c.SMS_Enabled__c = true`)
**AND** a `Notification_Log__c` record is created for each channel with status Sent/Failed/Skipped

### SCENARIO: Order Confirmation — Split Invoice Support
**GIVEN** a retailer confirms a split invoice order
**WHEN** the result returns `sObjectName = 'Invoice_Group__c'`
**THEN** `OrderConfirmationService` queries all `Order__c` records linked to that `Invoice_Group__c`
**AND** SMS includes all order numbers comma-separated
**AND** email is sent per order (one email per split invoice)

### SCENARIO: Abandoned Cart Reminder — Eligible Contact Notified
**GIVEN** a retailer has an active delivery route, the cutoff window is open, and no confirmed order exists for that delivery
**WHEN** the `AbandonedCartReminderScheduler` runs
**THEN** the retailer receives an email and/or SMS based on their notification preferences
**AND** a `Notification_Log__c` record is created

### SCENARIO: Abandoned Cart — Dedup Prevents Double Notification
**GIVEN** a retailer was already notified in the last 24 hours
**WHEN** the scheduler runs again
**THEN** the contact is skipped (unless `bypassDedup = true`)

### SCENARIO: Abandoned Cart — Contact With Confirmed Order Excluded
**GIVEN** a retailer's account has an order with `Status__c` not in ('Draft', 'Cancelled') tied to the upcoming delivery
**WHEN** the scheduler runs
**THEN** that account is excluded from notifications

### SCENARIO: Order Name Fix After Confirmation
**GIVEN** the Core trigger `TA_Order_AU_NameSetter` sets `Sales_Rep__c` to the portal user
**WHEN** `fixEcomOrderNames` fires after confirmation
**THEN** `Sales_Rep__c` is corrected to `Account.Sales_Rep__c`
**AND** the order `Name` is rebuilt as: `CustomerName: OrderDate - $Total - SalesRepName`
**AND** the sales rep name is resolved via direct User query (`FirstName`, `LastName`) to avoid Experience Cloud CommunityNickname masking

## Dependencies
- **Cannot Start Until**: Twilio account configured (Account SID, Auth Token, From Number, Content Templates)
- **This Story Unlocks**: None
- **Ships With**: Named Credential `ohfy__Twilio_Named_Cred`, External Credential `ohfy__Twilio`

## Testing Notes
- Verify `OrderConfirmationService.sendOrderConfirmation()` accepts `(contactId, recordId, sObjectName)` — handles both single and split invoices
- Verify `fixEcomOrderNames()` uses direct User query for sales rep name (not `Sales_Rep__r.Name` which returns CommunityNickname in Experience Cloud)
- Verify `AbandonedCartReminderScheduler` cutoff window logic: `windowStart <= now < cutoffDateTime`
- Verify dedup: `Notification_Log__c` with `Status__c = 'Sent'` and `Sent_At__c >= now - 24h`
- Verify `bypassDedup` flag works for manual testing via anonymous Apex
- Verify SMS template variables match Twilio Content Template positions
- Verify batch size = 10 (Salesforce limit on SingleEmailMessage per transaction)
- Verify `Notification_Log__c` records created for every send attempt (Sent/Failed/Skipped)

## Implementation Notes
- **Scheduler**: `AbandonedCartReminderScheduler` (global, Schedulable) — runs hourly, pre-computes all data, dispatches `AbandonedCartReminderBatch`
- **Batch**: `AbandonedCartReminderBatch` (Database.Batchable, Database.AllowsCallouts) — sends email via `Messaging.sendEmail`, SMS via `TwilioSMSService.send()`
- **Order Confirmation**: `OrderConfirmationService.sendOrderConfirmation()` — immediate, called fire-and-forget from `draftInvoiceService.confirmDraft()`
- **SMS**: `TwilioSMSService` — Named Credential `callout:ohfy__Twilio_Named_Cred`, Content Template API
- **Order Name Fix**: `CartController.fixEcomOrderNames()` — called fire-and-forget from `draftInvoiceService.confirmDraft()`
- **SMS future method**: `OrderConfirmationService.sendSMSFuture()` — `@future(callout=true)` to avoid "uncommitted work pending" from email DML
- **Assumption**: Twilio is set up (Named Credential, External Credential, Content Templates). This ticket does not cover Twilio setup — it assumes the integration is already configured.
