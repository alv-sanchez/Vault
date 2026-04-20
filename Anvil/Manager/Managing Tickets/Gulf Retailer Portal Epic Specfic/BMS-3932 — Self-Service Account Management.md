---
ticket: BMS-3932
title: Self-service account management (address, contacts)
status: Backlog
type: Story
priority: TBD
phase: 2c
execution_order: 14
labels: [ecom, fast-trackable, gulf, phase-2]
jira: https://ohanafy.atlassian.net/browse/BMS-3932
---

# BMS-3932 — Self-service account management (address, contacts)

> [Jira](https://ohanafy.atlassian.net/browse/BMS-3932) | Phase 2c | Execution Order: 14

## Summary

On-premise retail accounts (bars, restaurants, convenience stores) need to maintain their own delivery addresses and contact details without submitting requests to Gulf's operations team.

## Jira Links

- Blocked by: [[BMS-3930 — Credit Terms & Payment Status]] (credit terms)

## What Already Exists in the Codebase

| Component | Status | Path |
|-----------|--------|------|
| ecomProfilePage LWC | **COMPLETE** | `lwc/ecomProfilePage/` |
| Contact editing (name, phone) | **COMPLETE** | `handleSaveContact()` |
| UpdateContactController (Apex) | **COMPLETE** | `classes/UpdateContactController.cls` |
| Account info display | **COMPLETE** | Name, Billing Address, Business Info |
| User info display | **COMPLETE** | Username, SenderEmail |
| Phone formatting & validation | **COMPLETE** | 10-digit US number formatting |
| SMS opt-in tracking | **COMPLETE** | Toggle in profile page |
| Notification preference panel | **COMPLETE** | Email/SMS toggles per notification |
| LMS integration (UserDataChannel) | **COMPLETE** | Cross-component updates |
| Address editing | **MISSING** | Billing address is read-only display only |
| Shipping address management | **MISSING** | No separate shipping address |
| Additional contacts management | **MISSING** | Single contact only |
| Email editing | **MISSING** | Email is display-only |

## What Needs to Be Done

1. Enable address editing in ecomProfilePage (currently read-only)
2. Extend UpdateContactController to handle address field updates
3. Add shipping address as separate from billing address
4. Add address validation (format, completeness)
5. Optional: Support multiple contacts per account
6. Optional: Add email change flow (may require re-verification)

## Effort Estimate

**Small** — profile page is comprehensive. Work is enabling address fields for editing and extending the Apex controller.

## Dependencies

- **Blocks**: None
- **Blocked by**: [[BMS-3926 — Registration & Onboarding Flow]] (account must exist first)
