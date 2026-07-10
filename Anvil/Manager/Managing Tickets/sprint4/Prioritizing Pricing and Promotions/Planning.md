## Context

Alvaro Sanchez [8:53 AM]
No, not all. Within the current state of E-Commerce in OHFY-Split:
- Removed price list reference, it just pulls all the items within the repo - it needs to be hooked up to the pricing data model
- Promotions isn't supported, needs to be hooked up to the new promotions data model

Matt Keeter [9:04 AM]
Got it - is this functionality you're actively working and if not, do we have tickets scoped out for this? I would like to start getting ecom configured/setup in Gulf sandbox ASAP even if all the functionality is not supported at the moment.
[9:05 AM]
I don't need it setup this week, but would like to say at the latest that by end of next week it's fully ready to go with solid data (pick a few accounts) and ensure images/product detail is good.

---

## Current State of Backend Dependencies

### Front Line Pricing (FLP)

| Ticket | Summary | Status |
|---|---|---|
| BMS-3719 | FLP Architecture: Refactor & Solutioning (ADR-0009) | **Done** |
| BMS-3713 | FLP Data Model (`Front_Line_Price__c`, `Account_Pricing_Group__c`, etc.) | **Done** |
| BMS-3725 | FLP Centralized Resolver (`S_FrontLinePricing.resolve()`) — PR #224 | **Review** |
| BMS-5204 | FLP Defensive Apex (trigger services + schedulable for Status/Active maintenance) | In parallel |

**Bottom line:** The FLP data model is merged. The resolver is in PR review. Once BMS-3725 merges, e-com can wire pricing through `S_FrontLinePricing.resolve()`.

### Promotions

| Ticket   | Summary                                              | Status      |
| -------- | ---------------------------------------------------- | ----------- |
| BMS-4019 | Promotion & Discount Pricing Architecture (ADR-0010) | **Done**    |
| BMS-3875 | Promotions Data Model (`Promotion__c` + 4 children)  | **Done**    |
| BMS-5205 | Reconcile legacy Promotion shell post-ADR-0010       | In Progress |
| BMS-3876 | Promotion Centralized Resolver (`S_PriceResolver`)   | **To Do**   |
| BMS-3874 | Wire promotion resolver to invoice                   | **To Do**   |

**Bottom line:** The promotions data model is merged. But the resolver (BMS-3876) hasn't started yet. Without it, e-com can't apply promotions through the new architecture. BMS-4005 (auto-apply promos on e-com) is written against the old model and will need a rewrite to use BMS-3876.

---

## E-Com Ticket Priority 

### Tier 0 — Unblock everything (not mine, but the gate)

| Ticket | Status | Impact |
|---|---|---|
| **BMS-3930** | **Review** | Retailer credit terms Ph 1. **Blocks 7 of my tickets.** Chase the reviewer. |

### Tier 1 — Pricing hookup

| Ticket | Status | Blocked? | Notes |
|---|---|---|---|
| **BMS-3925** | To Do | BMS-3930 | Product catalog + pricing display — hooks e-com to FLP data model |
| **BMS-4050** | Backlog | Implicitly BMS-3925 | Cart Ph 1: basic pricing integration |
| **BMS-4005** | To Do | **Unblocked formally, but implicitly needs BMS-3876** | Auto-apply promos. Written against old model; needs rewrite for ADR-0010 |

### Tier 2 — Product detail "looks good" (Matt's second ask)

| Ticket | Status | Blocked? |
|---|---|---|
| **BMS-5257** | Backlog | **Unblocked** — Logo URL gallery fix, trivial |
| **BMS-4053** | To Do | BMS-3822 [Review], BMS-3876 [To Do] |
| **BMS-3927** | To Do | BMS-3930 |

### Tier 3 — Checkout flow (after pricing lands)

| Ticket | Status |
|---|---|
| **BMS-4051** | Backlog — Cart Ph 2: volume tiers + promos |
| **BMS-4052** | Backlog — Cart Ph 3: checkout + tax + order |
| **BMS-4011** | To Do — Order submission: Account Items sync |

### Tier 4 — Not needed for Matt's deadline

Registration, notifications, abandoned cart, multi-account, tech debt.

---

## What I Can Start Today (unblocked)

1. **BMS-5257** — Gallery Logo URL fix. Trivial bug, makes product detail look right.
2. **BMS-4005** — Auto-apply promotions. No formal blockers, but needs to be scoped against the new promo architecture (BMS-3876). If BMS-3876 hasn't started, this ticket either waits or ships against the old model (tech debt).

---

## Dependency Chain: Pricing on E-Com

```
BMS-3713 (FLP data model)              Done
    |
BMS-3725 (FLP resolver)                Review (PR #224)
    |
BMS-3925 (Product catalog + pricing)   To Do — blocked by BMS-3930
    |
BMS-4050 (Cart Ph 1: basic pricing)    Backlog
    |
BMS-4051 (Cart Ph 2: volume + promos)  Backlog
    |
BMS-4052 (Cart Ph 3: checkout + tax)   Backlog
```

## Dependency Chain: Promotions on E-Com

```
BMS-3875 (Promo data model)            Done
    |
BMS-3876 (Promo resolver S_PriceResolver)  To Do — NOT STARTED
    |
BMS-3874 (Wire resolver to invoice)    To Do
    |
BMS-4005 (Auto-apply on e-com)         To Do — needs rewrite for ADR-0010
```

---

## Key Blocker Summary

| Blocker | What it gates | Status | Action |
|---|---|---|---|
| **BMS-3930** | 7 e-com tickets (BMS-3920, 3925, 3926, 3927, 3921, 3924, 4525) | **Review** | Push for merge this week |
| **BMS-3725** | Pricing resolver — needed before e-com can show FLP prices | **Review** (PR #224) | Approve and merge |
| **BMS-3876** | Promo resolver — needed before e-com can apply promotions correctly | **To Do** | Flag to Matt: this is the real gate for "promotions supported in e-com". Not assigned to me. |

---

## Risks to Flag to Matt

1. **Promotions can't be done right until BMS-3876 lands.** The promo resolver hasn't started. BMS-4005 was written against the old `Promotion_Invoice_Item__c` model. Shipping it as-is creates tech debt that ADR-0010 was specifically written to prevent.
2. **BMS-3930 is the single gate for 7 tickets.** If that review drags, the entire pricing hookup path (BMS-3925 -> BMS-4050) stays blocked.
3. **"End of next week" is tight.** Even if BMS-3930 merges today, BMS-3925 (catalog + pricing) is a meaningful ticket. Realistic target: pricing display working by end of next week, but full cart/checkout (Ph 1-3) is further out.
