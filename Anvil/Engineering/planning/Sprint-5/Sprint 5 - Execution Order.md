---
title: "Sprint 5 — Execution Order"
sprint: "Sprint 5"
updated: 2026-05-21
---

# Sprint 5 — Recommended Execution Order

## Prerequisites from Sprint 4

- BMS-4050 (Cart Ph 1) must be done — BMS-4051 builds directly on it
- BMS-4373 (Order Reminders spike) must be done — BMS-3921 implements its findings
- BMS-3725 (FLP Resolver, Leah) must be landed and wired

---

## Execution Order

### 1. BMS-4051 — Cart Ph 2: Volume Tiers + Promos
**Summary:** Volume tier recalculation on quantity changes, promotional pricing, mixed pricing codes in cart.
**Depends on:** BMS-4050 (Cart Ph 1 from Sprint 4)
**Why first:** Direct continuation of the cart pricing pipeline. Ph 1 ships frontline-only; Ph 2 adds the volume + promo layers on top.
**Status:** Backlog, no comments yet.

### 2. BMS-3921 — Retailer Engagement Notifications
**Summary:** Automated notifications for order cutoff windows, stalled carts, delivery reminders.
**Depends on:** BMS-4373 spike output (Sprint 4)
**Why second:** Emily noted this may duplicate work from BMS-4373 (TBM Ask). The spike output from Sprint 4 defines what's already built vs what's new scope. Can run in parallel with cart Ph 3.
**Note:** Emily comment: "This feels like this duplicates work that Sanchez already completed for TBM."

### 3. BMS-4052 — Cart Ph 3: Checkout + Tax + Order
**Summary:** Entity-aware tax (FL vs AL), order creation with pricing lineage, minimum order enforcement.
**Depends on:** BMS-4051 (Cart Ph 2), tax dispatch deferred from BMS-4049
**Why last:** Final phase of the cart pipeline. Tax dispatch strategy was explicitly deferred to this ticket from the architecture spike.
**Status:** Backlog, no comments yet.

### 4. BMS-3928 — Cart & Checkout with Gulf Pricing (PARENT)
**Action:** This is the umbrella for BMS-4050 → 4051 → 4052. Close as superseded or convert to epic. No direct implementation work.
**Status:** Backlog, no comments.

---

## Sprint 5 looks clean

The execution order is a natural phase progression:
- Cart: Ph 1 (S4) → **Ph 2 (S5)** → **Ph 3 (S5)**
- Notifications: Spike (S4) → **Implementation (S5)**
- Both parent tickets (BMS-3924, BMS-3928) are umbrellas to close
