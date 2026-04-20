---
ticket: BMS-3931
title: Order status tracking & delivery notifications
status: Backlog
type: Story
priority: TBD
phase: 2c
execution_order: 13
labels: [ecom, fast-trackable, gulf, phase-2]
jira: https://ohanafy.atlassian.net/browse/BMS-3931
---

# BMS-3931 — Order status tracking & delivery notifications

> [Jira](https://ohanafy.atlassian.net/browse/BMS-3931) | Phase 2c | Execution Order: 13

## Summary

Gulf retailers have no visibility between order placement and truck arrival (fixed-route delivery, no carrier tracking). Surfacing delivery status and proactive notifications eliminates "where's my order" calls across all 5 warehouse territories.

## Jira Links

- Blocked by: [[BMS-3930 — Credit Terms & Payment Status]] (credit terms)

## What Already Exists in the Codebase

| Component | Status | Path |
|-----------|--------|------|
| OrderConfirmationService | **COMPLETE** | `classes/notifications/OrderConfirmationService.cls` |
| Email + SMS sending | **COMPLETE** | Salesforce email templates + TwilioSMSService |
| Notification logging | **COMPLETE** | Notification_Log__c |
| Notification preferences | **COMPLETE** | Contact_Notification__c + portal toggles |
| Order status in ecomOrderHistory | **COMPLETE** | Pending, In Transit, Out For Delivery, Delivered, Cancelled |
| Order status field on Order__c | **COMPLETE** | Status tracking field |
| Delivery status change notifications | MISSING | No trigger/flow on status change |
| Route-based delivery ETA | MISSING | No route schedule visibility |
| Delivery tracking UI | MISSING | No timeline/tracking component |
| Push notifications | MISSING | No web/mobile push |

## What Needs to Be Done

1. Create delivery status change trigger/flow that fires notifications on status transitions
2. Build email + SMS templates for each status change (Confirmed → In Transit → Out For Delivery → Delivered)
3. Add route-based delivery window display (e.g., "Expected: Tuesday AM")
4. Optional: Add delivery tracking timeline component in order detail
5. Leverage existing NotificationPreferenceController for opt-in/opt-out

## Effort Estimate

**Medium** — notification framework is built. Work is creating status change triggers and templates.

## Dependencies

- **Blocks**: None
- **Blocked by**: [[BMS-4052 — Cart Ph 3 — Checkout, Tax & Order]] (checkout creates orders), [[BMS-3921 — Retailer Engagement Notifications]] (notification templates)
