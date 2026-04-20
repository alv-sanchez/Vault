---
title: Alvaro Sanchez - Ticket Overview
created: 2026-04-15
updated: 2026-04-15
assignee: Alvaro Sanchez
total_open: 41
---

# Alvaro Sanchez — Ticket Overview

> **Source**: [BMS Board / Backlog](https://ohanafy.atlassian.net/jira/software/c/projects/BMS/boards/428/backlog)
> **Snapshot date**: 2026-04-15
> **Total open tickets**: 41

---

## In Progress / Review / Testing

These are already active and should be closed before pulling new work.

| Ticket                                                    | Status      | Priority | Summary                                               | Notes                               |
| --------------------------------------------------------- | ----------- | -------- | ----------------------------------------------------- | ----------------------------------- |
| [BMS-4192](https://ohanafy.atlassian.net/browse/BMS-4192) | In Progress | TBD      | Sales rep notifications on order confirmation         |                                     |
| [BMS-4171](https://ohanafy.atlassian.net/browse/BMS-4171) | In Progress | TBD      | E-Commerce - Enforce Order Case Minimum               |                                     |
| [BMS-4168](https://ohanafy.atlassian.net/browse/BMS-4168) | In Progress | TBD      | E-Commerce Order Table — Dynamic Backordering         | Moved to sprint 1                   |
| [BMS-3980](https://ohanafy.atlassian.net/browse/BMS-3980) | In Progress | TBD      | E-Commerce: Remaining Pieces (Scope TBD)              | Ping Auston                         |
| [BMS-3632](https://ohanafy.atlassian.net/browse/BMS-3632) | In Progress | TBD      | Skeleton Loading Screens Overhaul                     |                                     |
| [BMS-3366](https://ohanafy.atlassian.net/browse/BMS-3366) | In Progress | TBD      | Order Placed Page - Confirmation screen               | Dilapidated work items              |
| [BMS-3399](https://ohanafy.atlassian.net/browse/BMS-3399) | Build       | TBD      | Profile Page – Account/Contact Details                | Ping Auston                         |
| [BMS-3400](https://ohanafy.atlassian.net/browse/BMS-3400) | Build       | TBD      | Navigation Menu – Search, Cart, Profile               | Ping Auston                         |
| [BMS-3034](https://ohanafy.atlassian.net/browse/BMS-3034) | Review      | Sev 3    | Cancel Invoice – Add messages for delivered/completed | Kill this ticket - Or redo on split |
| [BMS-4008](https://ohanafy.atlassian.net/browse/BMS-4008) | Testing     | TBD      | Shop Tab – Brand search returns no products           | Ping Auston                         |

---

## Sprint Batching Plan

### Sprint N (Current) — Finish What's Started

> **Goal**: Close out in-progress and review items before pulling new work.

| Order | Ticket                                                    | Summary                                       | Rationale                                         | Status                          |
| ----- | --------------------------------------------------------- | --------------------------------------------- | ------------------------------------------------- | ------------------------------- |
| 1     | [BMS-4192](https://ohanafy.atlassian.net/browse/BMS-4192) | Sales rep notifications on order confirmation | Active branch — finish first                      | Needs OTS                       |
| 2     | [BMS-4171](https://ohanafy.atlassian.net/browse/BMS-4171) | Enforce Order Case Minimum                    | In-progress order table work                      | In Progress                     |
| 3     | [BMS-4168](https://ohanafy.atlassian.net/browse/BMS-4168) | Dynamic Backordering                          | In-progress, shares order table context with 4171 | Needs finale requirements       |
| 4     | [BMS-3034](https://ohanafy.atlassian.net/browse/BMS-3034) | Cancel Invoice messages                       | In Review — just needs to land                    | Just sitting in review with DNR |
| 5     | [BMS-4008](https://ohanafy.atlassian.net/browse/BMS-4008) | Shop Tab brand search bug                     | In Testing — verify and close                     | Ping Auston                     |

### Sprint N+1 — Core UX & Bugs

> **Goal**: Ship remaining storefront foundation and fix user-facing bugs.

| Order | Ticket                                                    | Summary                                                    | Rationale                                       | Status                                                                                                                                    |
| ----- | --------------------------------------------------------- | ---------------------------------------------------------- | ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | [BMS-4073](https://ohanafy.atlassian.net/browse/BMS-4073) | Notification Services: Abandoned Cart & Order Confirmation | Sev 2 — highest priority queued; builds on 4192 | Just needs more testing                                                                                                                   |
| 2     | [BMS-4007](https://ohanafy.atlassian.net/browse/BMS-4007) | Checkout – Duplicate dates & read-only field               | Bug — quick win                                 | Removed Expected Delivery in checkout page                                                                                                |
| 3     | [BMS-3667](https://ohanafy.atlassian.net/browse/BMS-3667) | Logout redirects to wrong login page                       | Bug — quick win                                 | Issue is logged - When you log in directly from the contact record and hit log out - it logs you out of your current internal org session |
| 4     | [BMS-3399](https://ohanafy.atlassian.net/browse/BMS-3399) | Profile Page – Account/Contact Details                     | In Build — storefront shell                     | Add testing notes - move to testing column                                                                                                |
| 5     | [BMS-3400](https://ohanafy.atlassian.net/browse/BMS-3400) | Navigation Menu – Search, Cart, Profile                    | In Build — storefront shell                     | Add testing notes - move to testing column                                                                                                |
| 6     | [BMS-3401](https://ohanafy.atlassian.net/browse/BMS-3401) | Footer – Navigation Items & Dynamic Company Info           | Storefront shell — groups with 3399/3400        | Add testing notes - move to testing column                                                                                                |

### Sprint N+2 — Cart, Search & Polish

> **Goal**: Polish UX, mobile support, and complete in-flight items.

| Order | Ticket                                                    | Summary                                                | Rationale                     | Status                                                         |
| ----- | --------------------------------------------------------- | ------------------------------------------------------ | ----------------------------- | -------------------------------------------------------------- |
| 1     | [BMS-3632](https://ohanafy.atlassian.net/browse/BMS-3632) | Skeleton Loading Screens Overhaul                      | In progress — land when ready | Unfinished work                                                |
| 2     | [BMS-4005](https://ohanafy.atlassian.net/browse/BMS-4005) | Auto Apply Promotions with Delivery Date               | Cart/pricing logic            | Blocked until promotion functionality is completed within core |
| 3     | [BMS-3366](https://ohanafy.atlassian.net/browse/BMS-3366) | Order Placed confirmation page                         | Post-checkout flow            | Add testing notes - move to testing column                     |
| 4     | [BMS-3669](https://ohanafy.atlassian.net/browse/BMS-3669) | Mobile & Tablet support                                | UX polish                     | Kicked back                                                    |
| 5     | [BMS-2840](https://ohanafy.atlassian.net/browse/BMS-2840) | Prevent lot-tracked conversion with existing inventory | Data safety trigger           | Old ticket                                                     |

### Sprint N+3 — Sales Rep & Advanced Features

> **Goal**: Expand portal capabilities beyond core shopping.

| Order | Ticket                                                    | Summary                                      | Rationale        | Status   |
| ----- | --------------------------------------------------------- | -------------------------------------------- | ---------------- | -------- |
| 1     | [BMS-3687](https://ohanafy.atlassian.net/browse/BMS-3687) | Sales rep login-as-retailer via quick action | Sales enablement | TODO     |
| 2     | [BMS-3838](https://ohanafy.atlassian.net/browse/BMS-3838) | Return Pre-Visibility                        | Returns flow     | TODO     |
| 3     | [BMS-3304](https://ohanafy.atlassian.net/browse/BMS-3304) | Embed Rainforest payment component           | Payments         | Outdated |
| 4     | [BMS-3364](https://ohanafy.atlassian.net/browse/BMS-3364) | Support Page – Validate functionality        | Support flow     | Outdated |

---

## Deferred — Gulf Retailer Portal Epic

> These form a separate initiative. Plan as its own epic after the core OHFY storefront is stable.

| Ticket | Summary |
|--------|---------|
| [BMS-3920](https://ohanafy.atlassian.net/browse/BMS-3920) | Retailer Online Ordering Experience |
| [BMS-3921](https://ohanafy.atlassian.net/browse/BMS-3921) | Retailer Engagement Notifications |
| [BMS-3922](https://ohanafy.atlassian.net/browse/BMS-3922) | Call Center Order Visibility |
| [BMS-3923](https://ohanafy.atlassian.net/browse/BMS-3923) | Experience Cloud theme & brand setup (Gulf branding) |
| [BMS-3924](https://ohanafy.atlassian.net/browse/BMS-3924) | Retailer portal product card & grid components |
| [BMS-3925](https://ohanafy.atlassian.net/browse/BMS-3925) | Product Catalog & Availability for Retailers |
| [BMS-3926](https://ohanafy.atlassian.net/browse/BMS-3926) | Retailer account registration & onboarding flow |
| [BMS-3927](https://ohanafy.atlassian.net/browse/BMS-3927) | Product search & filtering (category, brand, pack size) |
| [BMS-3928](https://ohanafy.atlassian.net/browse/BMS-3928) | Cart & checkout with Gulf pricing integration |
| [BMS-3929](https://ohanafy.atlassian.net/browse/BMS-3929) | Order history & one-click reorder |
| [BMS-3930](https://ohanafy.atlassian.net/browse/BMS-3930) | Retailer credit terms display & payment status |
| [BMS-3931](https://ohanafy.atlassian.net/browse/BMS-3931) | Order status tracking & delivery notifications |
| [BMS-3932](https://ohanafy.atlassian.net/browse/BMS-3932) | Self-service account management (address, contacts) |
| [BMS-4049](https://ohanafy.atlassian.net/browse/BMS-4049) | Cart & Checkout with Gulf Pricing — Spike: Architecture Discovery |
| [BMS-4050](https://ohanafy.atlassian.net/browse/BMS-4050) | Cart & Checkout with Gulf Pricing — Ph 1: Cart + Basic Pricing |
| [BMS-4051](https://ohanafy.atlassian.net/browse/BMS-4051) | Cart & Checkout with Gulf Pricing — Ph 2: Volume Tiers + Promos |
| [BMS-4052](https://ohanafy.atlassian.net/browse/BMS-4052) | Cart & Checkout with Gulf Pricing — Ph 3: Checkout + Tax + Order |
| [BMS-4053](https://ohanafy.atlassian.net/browse/BMS-4053) | Retailer Portal Product Card — Ph 1: Card Component |
| [BMS-4054](https://ohanafy.atlassian.net/browse/BMS-4054) | Retailer Portal Product Card — Ph 2: Grid Layout + Reuse |

---

## Remaining Backlog

| Ticket | Status | Summary |
|--------|--------|---------|
| [BMS-2957](https://ohanafy.atlassian.net/browse/BMS-2957) | Backlog | Delivery – Allow move to delivered when all invoices delivered & complete |
| [BMS-3980](https://ohanafy.atlassian.net/browse/BMS-3980) | In Progress | E-Commerce: Remaining Pieces (Scope TBD) — needs scope definition |

---

## Key Dependencies

- **BMS-4192 → BMS-4073**: Finishing sales rep notifications gives you the foundation for abandoned cart & order confirmation emails.
- **BMS-3399 + BMS-3400 + BMS-3401**: Storefront shell (profile, nav, footer) should ship together.
- **BMS-4168 + BMS-4171**: Both touch the order table — do them in the same sprint.
- **Gulf epic (3920–3932, 4049–4054)**: Depends on core storefront being stable first.
