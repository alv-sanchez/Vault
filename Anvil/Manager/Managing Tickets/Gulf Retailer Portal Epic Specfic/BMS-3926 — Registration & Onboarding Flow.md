---
ticket: BMS-3926
title: Retailer account registration & onboarding flow
status: Backlog
type: Story
priority: TBD
phase: 1
execution_order: 3
labels: [ecom, gulf, phase-2, refinement-needed, roadmap-v2-baseline]
jira: https://ohanafy.atlassian.net/browse/BMS-3926
---

# BMS-3926 — Retailer account registration & onboarding flow

> [Jira](https://ohanafy.atlassian.net/browse/BMS-3926) | Phase 1 | Execution Order: 3

## Summary

New retail accounts (e.g., 7-Eleven FL locations) need to self-register, get pricing codes and routes assigned, and begin placing orders without manual Gulf sales rep setup.

## Jira Links

- Blocked by: [[BMS-3930 — Credit Terms & Payment Status]] (credit terms)

## What Already Exists in the Codebase

| Component | Status | Path |
|-----------|--------|------|
| ecomRegister LWC (3-step wizard) | **COMPLETE** | `lwc/ecomRegister/` |
| RegisterController (Apex) | **COMPLETE** | `classes/RegisterController.cls` |
| Account search by name/ZIP/license | **COMPLETE** | `RegisterController.searchAccounts()` |
| Alcohol license validation | **COMPLETE** | Built into RegisterController |
| Auto-login after registration | **COMPLETE** | `RegisterController.loginUser()` |
| SMS opt-in during registration | **COMPLETE** | Contact field `SMS_Opt_In__c` |
| Profile assignment | **COMPLETE** | "Ohanafy Community User" fallback |
| Gulf pricing code assignment | MISSING | No pricing code auto-assignment |
| Route/warehouse association | MISSING | No route assignment in registration |
| Welcome email template | MISSING | No onboarding email |
| Payment method setup flow | MISSING | No payment method capture |
| Document/compliance acceptance | MISSING | No T&C acceptance flow |

## What Needs to Be Done

1. Extend RegisterController to assign Gulf pricing code based on account type/location
2. Auto-associate new accounts with correct warehouse/route
3. Create welcome email template for new registrants
4. Add terms & conditions acceptance step (if required by Gulf)
5. Optional: payment method capture during registration

## Effort Estimate

**Fast-trackable** — the 3-step registration wizard is fully built. Gulf-specific work is extending the existing flow with pricing/route assignment.

## Dependencies

- **Blocks**: All downstream ordering (can't order without an account)
- **Blocked by**: [[BMS-3923 — Experience Cloud Theme & Brand Setup]] (theme should be in place first)
