---
title: Gulf Retailer Portal — Execution Order
created: 2026-04-15
updated: 2026-04-15
epic: Gulf Retailer Portal
total_tickets: 19
---

# Gulf Retailer Portal — Execution Order

> **Epic**: Gulf Retailer Portal
> **Snapshot date**: 2026-04-15
> **Total tickets**: 19 (13 parent stories + 6 decomposed sub-stories)
> **Source**: [BMS Backlog](https://ohanafy.atlassian.net/jira/software/c/projects/BMS/boards/428/backlog)

---

## Dependency Map

```
BMS-3923 (Theme/Branding) ─────────────────────────────────┐
                                                           │
BMS-4049 (Spike: Architecture) ─┐                          │  FOUNDATION
                                │                          │
BMS-3926 (Registration) ────────┤                          │
                                │                          │
                                ▼                          ▼
                    ┌───────────────────────────────────────────┐
                    │         CORE STOREFRONT                    │
                    │                                           │
                    │  BMS-3925 (Catalog) ◄── BMS-3927 (Search) │
                    │       │                                   │
                    │       ▼                                   │
                    │  BMS-3924 (Product Card parent)           │
                    │    ├── BMS-4053 (Card Ph 1)               │
                    │    └── BMS-4054 (Grid Ph 2)               │
                    │                                           │
                    └───────────────────────────────────────────┘
                                │
                                ▼
                    ┌───────────────────────────────────────────┐
                    │         CART & CHECKOUT                    │
                    │                                           │
                    │  BMS-3928 (Cart parent)                   │
                    │    ├── BMS-4050 (Cart Ph 1: Basic)        │
                    │    ├── BMS-4051 (Cart Ph 2: Tiers)        │
                    │    └── BMS-4052 (Cart Ph 3: Checkout)     │
                    │                                           │
                    └───────────────────────────────────────────┘
                                │
                                ▼
                    ┌───────────────────────────────────────────┐
                    │         POST-ORDER & ENGAGEMENT            │
                    │                                           │
                    │  BMS-3929 (Order History & Reorder)       │
                    │  BMS-3921 (Engagement Notifications)      │
                    │  BMS-3931 (Delivery Notifications)        │
                    │  BMS-3932 (Account Management)            │
                    │                                           │
                    └───────────────────────────────────────────┘
                                │
                                ▼
                    ┌───────────────────────────────────────────┐
                    │         ADVANCED / SUPPORT                 │
                    │                                           │
                    │  BMS-3922 (Call Center Visibility)        │
                    │  BMS-3930 (Credit Terms & Payment)        │
                    │  BMS-3920 (Full Ordering Experience)      │
                    │                                           │
                    └───────────────────────────────────────────┘
```

---

## Execution Order

### Phase 1 — Foundation (Sprint S1)

| #   | Ticket                                                     | Summary                                              | Existing Code                                                                                                                                                        | Effort            |
| --- | ---------------------------------------------------------- | ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- |
| 1   | [[BMS-3923 — Experience Cloud Theme & Brand Setup]]        | Experience Cloud theme & brand setup (Gulf branding) | EcomBrandingController + 23 MDT records exist. No Gulf-specific assets.                                                                                              | Config + design   |
| 2   | [[BMS-4049 — Gulf Pricing Spike — Architecture Discovery]] | Cart & Checkout — Spike: Architecture Discovery      | ecomCartPage, ecomReviewSummary, draftInvoiceService exist. Need Gulf pricing engine contract.                                                                       | Spike (timeboxed) |
| 3   | [[BMS-3926 — Registration & Onboarding Flow]]              | Registration & onboarding flow                       | **ecomRegister LWC + RegisterController.cls are COMPLETE** — 3-step wizard with license validation. Needs Gulf-specific onboarding (pricing code assignment, route). | Fast-trackable    |

**Why this order**: Theme is phase-1 (everything inherits it). Spike unblocks all cart/checkout work. Registration is mostly done — fast win.

---

### Phase 2a — Catalog & Product Display (Sprint S2)

| # | Ticket | Summary | Existing Code | Effort |
|---|--------|---------|---------------|--------|
| 4 | [[BMS-3925 — Product Catalog & Availability]] | Product Catalog & Availability | **ecomShop + ecomProductPage + CartController.getQuantityAvailable all exist.** Need multi-warehouse filtering for Gulf FL/AL. | Medium — extend existing |
| 5 | [[BMS-3927 — Product Search & Filtering]] | Product search & filtering | **ecomShop has full filtering: brand, type, UOM, price, stock + 400ms debounced search.** Need pack size filter + Gulf category mapping. | Small — extend existing |
| 6 | [[BMS-4053 — Product Card Ph 1 — Card Component]] | Product Card — Ph 1: Card Component | Product cards render in ecomShop grid already. Need Gulf-specific pricing display (pricing codes, warehouse availability). | Medium |
| 7 | [[BMS-3929 — Order History & One-Click Reorder]] | Order history & one-click reorder | **ecomOrderHistory + reorderModal are COMPLETE** — tabs, filtering, stats, bulk reorder. Need 1-click quick-reorder. | Small — extend existing |

**Why this order**: These all have significant existing code. Catalog must come before cards. Order history is nearly done.

---

### Phase 2b — Cart & Checkout (Sprint S3)

| # | Ticket | Summary | Existing Code | Effort |
|---|--------|---------|---------------|--------|
| 8 | [[BMS-4050 — Cart Ph 1 — Cart & Basic Pricing]] | Cart Ph 1: Cart + Basic Pricing | **ecomCartPage + draftInvoiceService exist.** Need Gulf pricing code resolution per account. | Medium |
| 9 | [[BMS-4054 — Product Card Ph 2 — Grid Layout & Reuse]] | Product Card — Ph 2: Grid Layout + Reuse | ecomShop grid exists with pagination. Need responsive layout for tablet (sales reps in field). | Medium |
| 10 | [[BMS-4051 — Cart Ph 2 — Volume Tiers & Promos]] | Cart Ph 2: Volume Tiers + Promos | ecomPromotions + promotion criteria exist. Need volume tier recalculation on qty change. | Large |
| 11 | [[BMS-3921 — Retailer Engagement Notifications]] | Retailer Engagement Notifications | **Full notification framework exists**: AbandonedCartReminderBatch, DeliveryCutoffReminderBatch, TwilioSMSService, NotificationPreferenceController. Need Gulf-specific templates + cutoff windows. | Fast-trackable |

**Why this order**: Cart builds on spike findings. Grid reuses Ph 1 card. Volume tiers build on basic cart. Notifications can parallel.

---

### Phase 2c — Checkout & Post-Order (Sprint S4)

| # | Ticket | Summary | Existing Code | Effort |
|---|--------|---------|---------------|--------|
| 12 | [[BMS-4052 — Cart Ph 3 — Checkout, Tax & Order]] | Cart Ph 3: Checkout + Tax + Order | **ecomReviewSummary exists** but has hard-coded 8.75% tax. Need FL/AL jurisdiction tax + minimum order enforcement. | Large |
| 13 | [[BMS-3931 — Order Status Tracking & Delivery Notifications]] | Order status tracking & delivery notifications | OrderConfirmationService exists. Need delivery status tracking (no carrier tracking in route model). | Medium |
| 14 | [[BMS-3932 — Self-Service Account Management]] | Self-service account management | **ecomProfilePage is COMPREHENSIVE** — contact editing, notification prefs, account display. Need address editing (currently read-only). | Small — extend existing |

**Why this order**: Checkout completes the cart flow. Delivery notifications build on order confirmation. Account management is mostly done.

---

### Phase 3 — Advanced & Support (Sprint S5+)

| #   | Ticket                                             | Summary                                | Existing Code                                                                                                                           | Effort              | Notes                           |
| --- | -------------------------------------------------- | -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ------------------- | ------------------------------- |
| 15  | [[BMS-3922 — Call Center Order Visibility]]        | Call Center Order Visibility           | OrderHistoryController exists for customer-facing. Need agent-facing search/lookup + account context.                                   | Large — mostly new  |                                 |
| 16  | [[BMS-3930 — Credit Terms & Payment Status]]       | Retailer credit terms & payment status | **Minimal** — only Payment_Terms__c and Payment_Due_Date__c on Order__c. Need full AR visibility, credit limit display, payment status. | Large — mostly new  | Split - have minimal in phase 1 |
| 17  | [[BMS-3920 — Retailer Online Ordering Experience]] | Retailer Online Ordering Experience    | **Umbrella ticket** — most functionality delivered by tickets above. Validate end-to-end flow.                                          | Integration testing |                                 |

**Why this order**: Call center and credit terms are the most net-new work with least existing code. BMS-3920 is the capstone.

---

### Parent Tickets (Decomposed — Track Only)

These parent stories are decomposed into the phases above. Don't execute directly.

| Ticket | Summary | Decomposed Into |
|--------|---------|-----------------|
| [[BMS-3924 — Product Card & Grid Components]] | Retailer portal product card & grid | [[BMS-4053 — Product Card Ph 1 — Card Component]] (Ph 1) + [[BMS-4054 — Product Card Ph 2 — Grid Layout & Reuse]] (Ph 2) |
| [[BMS-3928 — Cart & Checkout with Gulf Pricing]] | Cart & checkout with Gulf pricing | [[BMS-4049 — Gulf Pricing Spike — Architecture Discovery]] (Spike) + [[BMS-4050 — Cart Ph 1 — Cart & Basic Pricing]] (Ph 1) + [[BMS-4051 — Cart Ph 2 — Volume Tiers & Promos]] (Ph 2) + [[BMS-4052 — Cart Ph 3 — Checkout, Tax & Order]] (Ph 3) |

---

## Codebase Reality Check — What Already Exists

| Feature | Status | Key Files |
|---------|--------|-----------|
| Product browsing & shop grid | COMPLETE | `lwc/ecomShop/`, `lwc/ecomProductPage/` |
| Search & filtering (brand, type, UOM, price, stock) | COMPLETE | `lwc/ecomShop/ecomShop.js` |
| Cart & draft invoice management | COMPLETE | `lwc/ecomCartPage/`, `lwc/draftInvoiceService/` |
| Checkout & order review | COMPLETE (needs Gulf pricing) | `lwc/ecomReviewSummary/` |
| Order history & reorder | COMPLETE | `lwc/ecomOrderHistory/`, `lwc/reorderModal/` |
| Registration (3-step wizard) | COMPLETE | `lwc/ecomRegister/`, `classes/RegisterController.cls` |
| Profile & account display | COMPLETE | `lwc/ecomProfilePage/`, `classes/UpdateContactController.cls` |
| Notification framework (Email + SMS) | COMPLETE | `classes/notifications/` (6 classes), `objects/Notification__c/` |
| Branding metadata system | COMPLETE | `classes/EcomBrandingController.cls`, `objects/Ecom_Branding__mdt/` |
| Gulf-specific pricing engine | MISSING | No PRC integration, no multi-pricing-code resolution |
| Multi-warehouse filtering | MISSING | Single fulfillment location only |
| Address editing | MISSING | Profile page is read-only for addresses |
| Credit/AR visibility | MISSING | Only order-level payment terms |
| Call center agent UI | MISSING | No agent-facing components |
| Gulf branding assets | MISSING | No Gulf-specific static resources or theme |
| Tax jurisdiction logic | MISSING | Hard-coded 8.75% in ecomReviewSummary |

---

## Key Insight

**~60% of the Gulf Retailer Portal already exists in the OHFY-Ecom codebase.** The core shopping experience (browse, search, filter, cart, checkout, order history, reorder, registration, profile, notifications) is built. The Gulf work is primarily:

1. **Multi-entity pricing** — Resolving 154+ pricing codes per account (net new)
2. **Multi-warehouse filtering** — FL vs AL catalog filtering (extend existing)
3. **Gulf branding** — Theme + static resources (config)
4. **Tax jurisdiction** — FL vs AL tax calculation (replace hard-coded rate)
5. **Credit/AR visibility** — Account financial status (net new)
6. **Call center tooling** — Agent-facing order management (net new)

The fast-trackable tickets (labeled in Jira) are: BMS-3929, BMS-3921, BMS-3931, BMS-3932, BMS-3922.
