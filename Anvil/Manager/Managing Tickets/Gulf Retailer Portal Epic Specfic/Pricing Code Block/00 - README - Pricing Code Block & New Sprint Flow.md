---
title: Pricing Code Block — README & New Sprint Flow
created: 2026-04-22
updated: 2026-04-22
epic: Gulf Retailer Portal
owner: Alvaro Sanchez
status: proposed
tags: [gulf, pricing, sprint-planning, execution-order]
---

# Pricing Code Block — README & New Sprint Flow

> **Purpose**: Remove "pricing codes" as the single upstream dependency blocking Sprints 2+ of the Gulf Retailer Portal epic by decomposing the work into four parallel workstreams that can be scheduled, owned, and shipped independently.

> **Author**: Alvaro Sanchez · **Date**: 2026-04-22 · **Scope**: Sprints 2–5 · **Status**: Proposed (awaiting alignment with Matt Keeter / Emily Shull / Elliot Flores before Sprint 2 commit).

---

## 1. The Block (why we're stuck)

The Gulf Retailer Portal execution order currently treats pricing as a **single serial blocker**:

```
BMS-4049 (Spike: Architecture Discovery)
        │  [must complete]
        ▼
BMS-4050 (Cart Ph 1: Cart + Basic Pricing)
        │  [must complete]
        ▼
BMS-4051 (Cart Ph 2: Volume Tiers + Promos)
        │
        ▼
BMS-4052 (Cart Ph 3: Checkout, Tax & Order)
        │
        ▼
Every other downstream ECOM ticket that references pricing
```

Gulf has **154+ pricing codes per account**, structured as combinations of:
- **Pricelist / route / territory** — which book of prices applies
- **Volume tiers** — qty breakpoints
- **Promotional overrides** — time-bounded price records
- **Per-item exceptions** — account-specific deals
- **Warehouse entity** — Milton FL and Mobile AL have separate pricing in some cases

Until BMS-4049 closes, nothing downstream can be committed with confidence. The spike is scoped as a single Jira ticket with no concrete deliverables, which makes it hard to timebox and hard to know when we can release the block.

**The block is not "we don't know the pricing logic" — it's that the logic is being sequenced as one monolithic decision, when at least four independent decisions can run in parallel.**

---

## 2. What's in This Folder

| File | Purpose |
|------|---------|
| [[00 - README - Pricing Code Block & New Sprint Flow]] | This file — the mental model + execution flow |
| [[01 - Decomposed Tickets & Parallel Workstreams]] | Proposed replacement for BMS-4049 monolithic spike — four parallel tracks with concrete tickets |
| [[02 - Sprint-by-Sprint Execution Order]] | Tangible week-by-week plan across Sprints 2, 3, 4, 5 — what the team ships each sprint |
| [[03 - Decision Gate — Pre-Sprint 2]] | Questions that must be answered before Sprint 2 commit, with recommended defaults |

---

## 3. The New Flow (elevator pitch)

**Replace one serial spike + one cart ticket with four parallel workstreams, each producing a concrete deliverable each sprint:**

```
                      Sprint 2 (2026-05-02 → 2026-05-15)
┌──────────────────────────────────────────────────────────────────────┐
│  Track A: PRICING DATA MODEL                                         │
│    → Decide where pricing codes live (pricelist items vs. CMDT)       │
│    → Net: "which object holds the 154+ pricing rules" decided by EOS2 │
│                                                                      │
│  Track B: RESOLUTION ALGORITHM (contract-only, no UI)                │
│    → Specify the resolve(accountId, itemId, qty, asOf) → price API   │
│    → Net: an Apex interface + mock implementation downstream can bind │
│                                                                      │
│  Track C: PORTAL HOOKS (consumer-side)                               │
│    → ecomShop, ecomCartPage, ecomReviewSummary call the resolver     │
│      through a thin service that today returns the existing pricelist │
│    → Net: portal is "pricing-ready" even before real resolver lands   │
│                                                                      │
│  Track D: INGESTION & AUTHORING                                      │
│    → How does the 154+ pricing code data get into Salesforce?        │
│    → Net: a sample CSV + loader script + a doc for AR/Ops            │
└──────────────────────────────────────────────────────────────────────┘

                      Sprint 3 (2026-05-16 → 2026-05-29)
┌──────────────────────────────────────────────────────────────────────┐
│  Track B: real resolver lands (basic — single pricelist + quantity)  │
│  Track C: portal wires to real resolver; cart Ph 1 ships              │
│  Track A: pricelist items are populated with Gulf data                │
│  Track D: ingestion pipeline running in sandbox                      │
└──────────────────────────────────────────────────────────────────────┘

                      Sprint 4 (2026-05-30 → 2026-06-12)
┌──────────────────────────────────────────────────────────────────────┐
│  Cart Ph 2 — volume tiers + promos on top of resolver                │
│  Pricing UX in ecomShop + cart (shows applied code + amount)         │
└──────────────────────────────────────────────────────────────────────┘

                      Sprint 5 (2026-06-13 → 2026-06-26)
┌──────────────────────────────────────────────────────────────────────┐
│  Cart Ph 3 — checkout, tax, order submit                             │
│  Pricing audit trail + admin override                                │
└──────────────────────────────────────────────────────────────────────┘
```

The key change: **Tracks A, B, C, and D can all start on day 1 of Sprint 2.** Track B ships a contract (interface + mock), which lets Track C begin consumer wiring without waiting. The team no longer has a three-week serial gate.

---

## 4. Why This Works (the underlying principles)

1. **Contract-first over implementation-first.** Define the resolver's API before building its internals. Downstream tickets bind to the interface, not the implementation.
2. **Mocks unblock consumers.** A mock resolver returning the current pricelist price is good enough for Sprint 2 UI work. The real resolver arrives in Sprint 3 without breaking anything.
3. **Data authoring is a separate skill from data modelling.** AR/Ops can work on the CSV/loader (Track D) while engineers work on the model (Track A) and the resolver (Track B).
4. **Every sprint ships something demonstrable.** Sprint 2 demos "portal calls pricing resolver and renders price" (even with mock). Sprint 3 demos "real resolver with Gulf pricelist". Etc. No sprint is invisible to stakeholders.
5. **Unknowns are named and timeboxed.** The "154+ pricing codes" fear gets reduced to four well-bounded questions (see `03 - Decision Gate`).

---

## 5. What Doesn't Change

- BMS-4049 remains the umbrella spike ticket but is **reframed** — its deliverable becomes "sign off on the four-track plan" rather than "design the entire pricing engine". It closes at the end of Sprint 2 once Tracks A + B have landed their Sprint 2 deliverables.
- BMS-4050 / BMS-4051 / BMS-4052 stay as the cart phase tickets, but each binds to a specific Sprint (3, 4, 5) with the resolver contract as their dependency — no longer waiting on the spike.
- The existing Gulf Retailer Portal execution order in `00 - Gulf Retailer Portal — Execution Order.md` remains the authoritative epic-level map; this folder is the pricing-slice zoom-in.

---

## 6. Open Alignment

Before merging this into the epic plan, I need:
- Matt Keeter + Emily Shull to validate the four-track decomposition (Track B contract shape is the highest-leverage review).
- Elliot Flores to confirm Jira structure changes (retain or replace BMS-4049 / BMS-4050; create sub-tasks).
- A 30-minute pre-Sprint-2 decision meeting on the items in `03 - Decision Gate`.

Without alignment, default behaviour is: this plan remains a proposal and the team stays on the serial flow. **I'd rather ship a partial decomposition than delay for a perfect one** — Tracks A + C can move even if B and D are debated further.
