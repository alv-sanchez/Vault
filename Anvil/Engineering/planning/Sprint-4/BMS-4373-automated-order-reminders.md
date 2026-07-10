---
ticket: BMS-4373
title: "E-Commerce - Automated Order Reminders: Email Retailer + SMS Sales Rep Pre-Delivery"
type: SPIKE
status: Backlog
sprint: "Sprint 4"
assignee: Alvaro Sanchez
jira: https://ohanafy.atlassian.net/browse/BMS-4373
tags: [sprint4, ecom, gulf, notifications, email, sms, twilio, spike]
---

# BMS-4373 — Automated Order Reminders: Email + SMS Pre-Delivery

## Summary

**TBM Ask.** SPIKE to design automated order reminders:
- **Email to retailers** N days before delivery if no order placed
- **SMS to sales reps** day-before delivery if no order placed

## V1 Scope

- Daily scheduled job evaluates upcoming deliveries on `Delivery__c`
- Email to retailer contacts — sent N days (admin-configurable) before delivery date
- SMS to assigned sales rep (Account Owner) — sent when delivery is tomorrow
- Both skipped if confirmed order already exists for that account + delivery date
- Contact-level opt-out honored for email; STOP keyword for SMS (Twilio default)
- Admin configures lead-time via `Notification__c.Threshold_Hours__c` (existing pattern)

## V2 (future)

Smart cadence / frequency-aware triggers based on retailer's historical ordering pattern instead of `Delivery__c` schedule.

## No Comments

No discussion yet on this ticket.

## Key Takeaway

**This is a SPIKE, not implementation.** Clean scope — research the notification approach (Salesforce email templates + Twilio SMS), design the scheduled job, and define the data model. No blockers from pricing architecture. Could be started independently of the other blocked tickets.
