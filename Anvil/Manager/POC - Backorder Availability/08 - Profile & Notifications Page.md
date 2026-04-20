---
title: "Profile & Notification Preferences Page — Lovable Prompt"
page: /profile
covers: Account management, notification preferences, allocation visibility, credit terms
---

# Profile & Notification Preferences — `/profile`

## Lovable Prompt

Build a profile/account management page for a B2B beverage distributor portal. This page combines **account info**, **notification preferences** (email/SMS toggles), **allocation visibility**, and **credit terms snapshot**.

### Layout

- **Top**: Account header card
- **Tabs**: Account Info | Notification Preferences | Allocation | Credit & Billing

---

### Account Header Card

```
┌─────────────────────────────────────────────────────────────────┐
│  Lucky's Bar & Grill                                             │
│  Account #: ACCT-FL-4820                                         │
│  Territory: Tampa Bay  |  Warehouse: Milton FL                   │
│  Sales Rep: James Rodriguez (james.r@gulfdist.com)               │
│  Pricing Code: FL-ONPREM-TIER2                                   │
│  Member since: January 2024                                      │
└─────────────────────────────────────────────────────────────────┘
```

---

### Tab 1 — Account Info

```
┌─ CONTACT INFORMATION ──────────────────────────────── [Edit] ───┐
│  Name: Mike Thompson                                             │
│  Email: mike@luckysgrill.com                                     │
│  Phone: (813) 555-0142                                           │
│  Job Title: Owner/Manager                                        │
│  SMS Opt-In: ✅ Yes (since Jan 15, 2024)                         │
└──────────────────────────────────────────────────────────────────┘

┌─ DELIVERY ADDRESS ─────────────────────────────────── [Edit] ───┐
│  1234 Main Street                                                │
│  Tampa, FL 33602                                                 │
│                                                                  │
│  Delivery Notes: Use back entrance, ask for Mike                 │
│  Route: Tuesday / Thursday (AM window)                           │
└──────────────────────────────────────────────────────────────────┘

┌─ BILLING ADDRESS ──────────────────────────────────── [Edit] ───┐
│  Same as delivery address ✓                                      │
│  [Set different billing address]                                 │
└──────────────────────────────────────────────────────────────────┘
```

---

### Tab 2 — Notification Preferences

```
┌─ NOTIFICATION PREFERENCES ───────────────────────────────────────┐
│                                                                   │
│  Control how you receive updates. Toggle Email and/or SMS        │
│  for each notification type.                                      │
│                                                                   │
│  ┌─────────────────────────────────┬────────┬────────┐           │
│  │ Notification                    │ Email  │  SMS   │           │
│  ├─────────────────────────────────┼────────┼────────┤           │
│  │ Order Confirmation              │  [✓]   │  [✓]   │           │
│  │ Shipment Shipped                │  [✓]   │  [✓]   │           │
│  │ Out for Delivery                │  [✓]   │  [ ]   │           │
│  │ Delivered                       │  [✓]   │  [ ]   │           │
│  │ ─── BACKORDER NOTIFICATIONS ─── │        │        │           │
│  │ Backorder Created               │  [✓]   │  [✓]   │           │
│  │ Backorder ETA Changed           │  [✓]   │  [✓]   │           │
│  │ Backorder Ready to Ship         │  [✓]   │  [✓]   │           │
│  │ Backorder Cancelled             │  [✓]   │  [ ]   │           │
│  │ ─── ENGAGEMENT ──────────────── │        │        │           │
│  │ Delivery Cutoff Reminder        │  [✓]   │  [✓]   │           │
│  │ Abandoned Cart Reminder         │  [✓]   │  [ ]   │           │
│  │ New Promotions Available        │  [ ]   │  [ ]   │           │
│  │ Product Back in Stock           │  [✓]   │  [ ]   │           │
│  │ ─── BILLING ─────────────────── │        │        │           │
│  │ Invoice Generated               │  [✓]   │  [ ]   │           │
│  │ Payment Due Reminder            │  [✓]   │  [✓]   │           │
│  │ Payment Received                │  [✓]   │  [ ]   │           │
│  └─────────────────────────────────┴────────┴────────┘           │
│                                                                   │
│  [Save Preferences]                                               │
│                                                                   │
│  ℹ️ SMS messages are sent to (813) 555-0142.                     │
│     To change your number, update it in Account Info.             │
│     Reply STOP to any SMS to unsubscribe from all.               │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

The **Backorder Notifications** section is a distinct group — these are the new notification types the POC is proposing.

---

### Tab 3 — Allocation (B2B Feature)

```
┌─ YOUR PRODUCT ALLOCATION ────────────────────────────────────────┐
│                                                                   │
│  Your account has reserved allocation for high-demand products.  │
│  Allocated quantities are guaranteed for you.                     │
│                                                                   │
│  ┌───────────────────────┬───────┬──────────┬───────────┐        │
│  │ Product               │ Alloc │ Ordered  │ Remaining │        │
│  ├───────────────────────┼───────┼──────────┼───────────┤        │
│  │ Gulf Reserve Bourbon  │  10   │    6     │  4 left   │        │
│  │ Bay Aged Rum 750ml    │   8   │    4     │  4 left   │        │
│  │ Sunshine Reserve Cab  │   5   │    1     │  4 left   │        │
│  │ Coastal Limited IPA   │  12   │    0     │  12 left  │        │
│  └───────────────────────┴───────┴──────────┴───────────┘        │
│                                                                   │
│  Allocation period: April 2026                                    │
│  Resets: May 1, 2026                                              │
│                                                                   │
│  ℹ️ Orders within your allocation get priority fulfillment.      │
│     Orders beyond allocation are subject to availability.         │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

---

### Tab 4 — Credit & Billing

```
┌─ CREDIT TERMS ───────────────────────────────────────────────────┐
│                                                                   │
│  Terms: Net 30                                                    │
│  Credit Limit: $15,000.00                                        │
│  Current Balance: $6,550.00                                      │
│  Available Credit: $8,450.00                                     │
│                                                                   │
│  ┌─────────────────────────────────────────────────┐             │
│  │ ██████████████████████░░░░░░░░░░░░░░ 44% used   │             │
│  └─────────────────────────────────────────────────┘             │
│                                                                   │
│  ── Outstanding Invoices ──────────────────────────────────────  │
│                                                                   │
│  INV-2026-0415  Apr 16  $421.27  Due May 16   ● Current         │
│  INV-2026-0408  Apr 8   $412.50  Due May 8    ● Current         │
│  INV-2026-0328  Mar 28  $650.00  Due Apr 27   🟡 Due in 11 days │
│  INV-2026-0320  Mar 20  $156.00  Paid Apr 15  ✅ Paid            │
│                                                                   │
│  ── Aging Summary ─────────────────────────────────────────────  │
│  Current:   $1,483.77                                             │
│  1-30 days: $650.00                                               │
│  31-60:     $0                                                    │
│  61-90:     $0                                                    │
│  90+:       $0                                                    │
│                                                                   │
│  [Download Statement]  [View All Invoices]                        │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```
