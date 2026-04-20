---
ticket: BMS-3930
title: Retailer credit terms display & payment status
status: Needs Refinement
type: Story
priority: TBD
phase: 3
execution_order: 16
labels: [ecom, fast-trackable, gulf, phase-2, roadmap-v2-baseline]
jira: https://ohanafy.atlassian.net/browse/BMS-3930
---

# BMS-3930 — Retailer credit terms display & payment status

> [Jira](https://ohanafy.atlassian.net/browse/BMS-3930) | Phase 3 | Execution Order: 16

## Summary

Retailers need to view their credit terms, outstanding balances, and payment status directly in the portal — eliminating calls to Gulf's AR department for routine account inquiries.

## Jira Links

> **Note**: In Jira, this ticket is marked as "Blocks" for nearly every other Gulf ticket. This appears to be a link configuration issue — credit terms display is not a logical prerequisite for ordering, search, or notifications. Recommend reviewing Jira links.

- Blocks (in Jira): [[BMS-3920 — Retailer Online Ordering Experience]], [[BMS-3921 — Retailer Engagement Notifications]], [[BMS-3922 — Call Center Order Visibility]], [[BMS-3923 — Experience Cloud Theme & Brand Setup]], [[BMS-3924 — Product Card & Grid Components]], [[BMS-3925 — Product Catalog & Availability]], [[BMS-3926 — Registration & Onboarding Flow]], [[BMS-3927 — Product Search & Filtering]], [[BMS-3928 — Cart & Checkout with Gulf Pricing]], [[BMS-3929 — Order History & One-Click Reorder]], [[BMS-3931 — Order Status Tracking & Delivery Notifications]], [[BMS-3932 — Self-Service Account Management]], BMS-3980

## What Already Exists in the Codebase

| Component | Status | Path |
|-----------|--------|------|
| Payment_Terms__c on Order__c | **EXISTS** | Field on order records |
| Payment_Due_Date__c on Order__c | **EXISTS** | Field on order records |
| Order totals in OrderHistoryController | **EXISTS** | `getOrderHistory()` returns totals |
| ecomOrderHistory displays payment info | PARTIAL | Shows terms per order, no account-level view |
| Account credit limit display | MISSING | No credit limit field/display |
| Outstanding balance display | MISSING | No AR balance component |
| Payment status tracking | MISSING | No Paid/Unpaid/Overdue/Partial status |
| AR aging report | MISSING | No aging buckets |
| Invoice download/viewing | MISSING | No invoice PDF generation |
| Payment history | MISSING | No payment transaction log |
| Payment method management | MISSING | No stored payment methods |

## What Needs to Be Done

1. Define data source for AR data (ERP integration? Custom objects? External API?)
2. Build account financial summary component (credit limit, available credit, outstanding balance)
3. Add payment status to order history (Paid/Unpaid/Overdue)
4. Create AR aging display (Current, 30, 60, 90+ days)
5. Optional: Invoice download/PDF generation
6. Optional: Payment method management (Rainforest integration)

## Effort Estimate

**Large** — mostly net-new work. Requires AR data source definition and new UI components. Status is "Needs Refinement" for a reason.

## Dependencies

- **Blocks**: None (despite Jira links — see note above)
- **Blocked by**: None technically, but needs data source decision
