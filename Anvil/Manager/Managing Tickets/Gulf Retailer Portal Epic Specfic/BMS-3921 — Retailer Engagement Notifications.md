---
ticket: BMS-3921
title: Retailer Engagement Notifications
status: Backlog
type: Story
priority: TBD
phase: 2b
execution_order: 11
labels: [ecom, fast-trackable, gulf, phase-2, roadmap-v2-baseline]
jira: https://ohanafy.atlassian.net/browse/BMS-3921
---

# BMS-3921 — Retailer Engagement Notifications

> [Jira](https://ohanafy.atlassian.net/browse/BMS-3921) | Phase 2b | Execution Order: 11

## Summary

Automated notifications to ensure retailers place orders before route cutoff windows, and alerts for sales reps on stalled carts. Gulf's route-based delivery model depends on timely ordering.

## Jira Links

- Blocked by: [[BMS-3930 — Credit Terms & Payment Status]] (credit terms)

## What Already Exists in the Codebase

| Component | Status | Path |
|-----------|--------|------|
| Notification__c object | **COMPLETE** | `objects/Notification__c/` |
| Contact_Notification__c (preferences) | **COMPLETE** | `objects/Contact_Notification__c/` |
| Notification_Log__c (audit) | **COMPLETE** | `objects/Notification_Log__c/` |
| NotificationPreferenceController | **COMPLETE** | `classes/notifications/NotificationPreferenceController.cls` |
| OrderConfirmationService | **COMPLETE** | `classes/notifications/OrderConfirmationService.cls` |
| TwilioSMSService | **COMPLETE** | `classes/notifications/TwilioSMSService.cls` |
| AbandonedCartReminderBatch | **COMPLETE** | `classes/notifications/AbandonedCartReminderBatch.cls` |
| AbandonedCartReminderScheduler | **COMPLETE** | `classes/notifications/AbandonedCartReminderScheduler.cls` |
| DeliveryCutoffReminderBatch | **COMPLETE** | `classes/notifications/DeliveryCutoffReminderBatch.cls` |
| DeliveryCutoffReminderScheduler | **COMPLETE** | `classes/notifications/DeliveryCutoffReminderScheduler.cls` |
| ecomProfilePage notification toggles | **COMPLETE** | Email/SMS per notification type |
| SMS opt-in tracking | **COMPLETE** | `Contact.SMS_Opt_In__c` |
| Gulf-specific cutoff window config | MISSING | Need per-territory cutoff times |
| Gulf email/SMS templates | MISSING | Need Gulf-branded templates |
| Sales rep stalled cart alerts | MISSING | No rep-facing notification |

## What Needs to Be Done

1. Configure Gulf-specific delivery cutoff windows per warehouse territory (5 territories)
2. Create Gulf-branded email templates (abandoned cart, cutoff reminder)
3. Create Gulf Twilio Content Templates (SMS)
4. Add sales rep notification when retailer cart stalls past threshold
5. Configure notification scheduling for Gulf's route windows

## Effort Estimate

**Fast-trackable** — the entire notification framework is built. Gulf work is templates and configuration.

## Dependencies

- **Blocks**: None
- **Blocked by**: [[BMS-3923 — Experience Cloud Theme & Brand Setup]] (Gulf branding for email templates)
