# Testing Notes - BMS-4073: Notification Services

## Related
- Ticket: [[BMS-4073-notification-services]] (in Tickets/Created Tickets/)
- Jira: https://ohanafy.atlassian.net/browse/BMS-4073

---

| Ticket | Component | Change Type | Ticket Link |
|--------|-----------|-------------|-------------|
| BMS-4073 | AbandonedCartReminderScheduler, OrderConfirmationService, TwilioSMSService, CartController | New Feature | https://ohanafy.atlassian.net/browse/BMS-4073 |

## Overview
**Component**: Apex notification framework + `draftInvoiceService` LWC
**Change Type**: New Feature
**Ticket Description**: Order confirmation (email + SMS after checkout) and abandoned cart reminder (scheduled, delivery cutoff-based).
**Impact Assessment**: Backend notifications, order naming, Twilio SMS integration.
**Load Testing Required**: [ ] Yes [x] No

## Preconditions
- Twilio configured: Named Credential `ohfy__Twilio_Named_Cred`, Content Templates
- `Notification__c` records exist for ORDER_CONFIRMATION and ABANDONED_CART_REMINDER
- `Contact_Notification__c` records seeded for the test contact
- Active delivery routes with `Warehouse_Cutoff_Time__c` on Location

---

## Test Cases

*ID prefix: TC-NOT*

### Order Confirmation

| Test Case | Expected Outcome |
|-----------|------------------|
| TC-NOT-001: Place single order with email enabled | Notification_Log__c created, Status = Sent, Channel = Email |
| TC-NOT-002: Place single order with SMS enabled | Notification_Log__c created, Status = Sent, Channel = SMS |
| TC-NOT-003: Place split invoice order | All orders in the Invoice_Group resolved and notified |
| TC-NOT-004: Contact has email disabled | Notification_Log__c: Status = Skipped, email channel |
| TC-NOT-005: Contact has no phone number | Notification_Log__c: Status = Skipped, SMS channel |

### Abandoned Cart Reminder

| Test Case | Expected Outcome |
|-----------|------------------|
| TC-NOT-006: Run scheduler within cutoff window | Contact receives email/SMS |
| TC-NOT-007: Run scheduler outside cutoff window | Contact skipped — "too early" or "cutoff passed" |
| TC-NOT-008: Account has confirmed order for delivery | Account excluded |
| TC-NOT-009: Contact notified in last 24 hours | Contact skipped (dedup) |
| TC-NOT-010: Run with bypassDedup = true | Dedup skipped, contact notified |

### Order Name Fix

| Test Case | Expected Outcome |
|-----------|------------------|
| TC-NOT-011: Place order from portal | Order Name = "CustomerName: Date - $Total - SalesRepName" (real name, not CommunityNickname) |
| TC-NOT-012: Sales_Rep__c on order | Corrected to Account.Sales_Rep__c (not portal user) |

### Verification Query

```sql
SELECT Id, ohfy__Contact__c, ohfy__Channel__c, ohfy__Status__c, ohfy__Error_Message__c, ohfy__Sent_At__c
FROM ohfy__Notification_Log__c
ORDER BY ohfy__Sent_At__c DESC LIMIT 10
```
