---
title: "EPIC PHASING (DRAFT) — Retailer E-Commerce, Phase 1 vs Next vs Post-MVP"
type: epic-plan
status: ✅ EXECUTED in Jira (2026-06-25)
phase_1_epic: BMS-4995 (renamed)
phase_2_epic: BMS-5576
post_mvp_epic: BMS-5577
source_epic: BMS-4995 [REQ-068] Retailer Online Ordering Experience
cutline: Phase 1 = merged/shipped work only. BMS-4053 (Product Card, in Build) moved to Phase 2 on 2026-06-26.
date: 2026-06-25
author: Alvaro Sanchez
tags: [epic-plan, ecommerce, phasing, MVP, BMS-4995, executed]
---

# Retailer E-Commerce — Phasing (EXECUTED 2026-06-25)

> **Objective:** retroactively divide the e-commerce work for visibility — a **Phase 1** epic naming everything *done* (by Pages / Flows / Enablement), a **Phase 2** epic for what's *left*, and a **Post-MVP** epic for deferred/dependency-gated work. **Cutline (revised 2026-06-26): Phase 1 = merged/shipped work only; BMS-4053 (Product Card, still in Build) moved to Phase 2.** Companion analysis: [[ECOM-Ordering-Epic-Accomplishable-Analysis]].

---

## ✅ Execution log — 2026-06-25 (live in Jira)

Chose **option (a)**: BMS-4995 repurposed as Phase 1 (kept `[REQ-068]` in the title for traceability); two new epics created; 14 children re-parented.

**Epics:**
- **[BMS-4995](https://ohanafy.atlassian.net/browse/BMS-4995)** → renamed *"Ecom — Phase 1: Retailer Storefront MVP — Catalog · Cart · Reorder · Credit View · Branding [REQ-068]"*
- **[BMS-5576](https://ohanafy.atlassian.net/browse/BMS-5576)** → *Ecom — Phase 2: Pricing/Promo Completion & Checkout* (NEW)
- **[BMS-5577](https://ohanafy.atlassian.net/browse/BMS-5577)** → *Ecom — Post-MVP: Credit, Self-Service v2, Allocation, Availability, Reporting* (NEW)

**Re-parented → Phase 2 (BMS-5576):** 4052, 4051, 4054, 3932, 5321, 3926, 5344, 4050, **+ 4053 (moved 2026-06-26)** — ✅ done.
**Re-parented → Post-MVP (BMS-5577):** 4525, 5322, 3920, 3925, 4494, 4495 — ✅ done.
**Stayed in Phase 1 (BMS-4995):** 3923, 3927, 3929, 3930, 4168, 4171, 4258, 4076, 3980, 4049 — all Done/merged. Closed umbrellas 3924 / 3928 (Won't Do) remain as superseded.

> **Update 2026-06-26 — BMS-4053 moved Phase 1 → Phase 2.** Rationale: 4053 is still in Build (PR #293, not merged), so Phase 1 now contains only merged/shipped work. **Consequence:** the product card and the storefront `S_PriceResolver` pricing/promo wiring now *land in Phase 2*, not Phase 1. Phase 1's coverage no longer includes account-pricing/promo display on the card — that ships when 4053 merges (Phase 2). 4053 is the foundation for the rest of Phase 2 (4051 cart promo UI, 4054 grid).

**Observed during execution:** **BMS-4050 was already `Won't Do`** — it now sits in Phase 2 as a closed/superseded child (consistent with the fold-into-3874 decision).

**Trail:** phasing comment posted on BMS-4995; child lists + BMS-3874 dependency written into the BMS-5576 / BMS-5577 descriptions.

### Open follow-ups (NOT yet done)
1. **Formal issue-link** BMS-3874 → BMS-5576 as "depends on" (currently text-reference only in the description).
2. **Epic assignees** left blank on BMS-5576 / BMS-5577 — assign if desired.
3. **Phase prefix/label on children** for board filtering — not applied.

---

## Proposed epic names

**Phase 1 (rename / retro — what shipped):**
> ### ✅ Ecom — Phase 1: Retailer Storefront MVP — *Catalog · Cart · Reorder · Credit View · Branding*
> *(suffix spells out coverage so the "done" line is legible at a glance)*

Alternatives if you want the suffix to mirror the three lenses literally:
- `Ecom Phase 1 — Storefront MVP (Pages: Shop/PDP/Cart/History/Profile · Flows: Browse→Order, Reorder, Multi-Account · Enablement: Theming, Credit, Min-Order, Pricing wiring)`
- `Ecom Phase 1 — Retailer Ordering MVP (browse, price, cart, submit, reorder)`

**Phase 2 (next — what's left to finish the experience):**
> ### 🟡 Ecom — Phase 2: Pricing/Promo Completion & Checkout
> Closes the storefront loop: server-resolved promo pricing across cart/PDP, checkout + tax + order, grid polish.

**Post-MVP (dump the deferred / dependency-gated):**
> ### 🔴 Ecom — Post-MVP: Credit, Self-Service v2, Allocation, Availability, Reporting

---

## ✅ Phase 1 — Retailer Storefront MVP (DONE / merged work only)

Merged/shipped storefront work. **BMS-4053 (Product Card) was moved to Phase 2 on 2026-06-26** (still in Build) — the rows below marked *→ Phase 2* now live under BMS-5576.

### Pages (storefront surfaces delivered)
| Ticket | Surface | Status |
|---|---|---|
| **BMS-3923** | Experience Cloud theme + Gulf branding (admin theming system, `Ecom_Theme__c`) | ✅ Done |
| **BMS-3927** | Shop page — product search & filtering (category/brand/pack, warehouse-scoped) | ✅ Done |
| ~~**BMS-4053** Product card — account price + Post-off + QD promo + stock badge~~ | ➡️ **MOVED to Phase 2 (BMS-5576)** 2026-06-26 — in Build, not merged |
| **BMS-3929** | Order history page (+ pricing-aware reorder, cancelled-order visibility) | ✅ Done |
| **BMS-3930** | Credit terms / payment-status section on profile (Ph 1 read view) | ✅ Done |

### Flows (end-to-end actions working)
| Ticket | Flow | Status |
|---|---|---|
| **BMS-3927** | Search → filter → locate product | ✅ Done |
| **BMS-4168** | Cart → order submission with **dynamic backordering** (matches internal order table) | ✅ Done |
| **BMS-4171** | **Minimum case quantity** enforcement at review/submit (account override → config default) | ✅ Done |
| **BMS-3929** | **Two-click reorder** from history | ✅ Done |
| **BMS-4258** | **Multi-account business switching** (one contact ↔ many Accounts via ACR) | ✅ Done |
| **BMS-4076** | Promotions v2 display across Shop/PDP/Cart (straight-line auto-apply) — *(confirmed under BMS-4995)* | ✅ Done |

### Enablement (config / data / platform under the hood)
| Ticket | Enablement | Status |
|---|---|---|
| **BMS-3923** | UI-driven theming (`Ecom_Theme__c`, `ohfyTheme`, WCAG contrast tooling) | ✅ Done |
| **BMS-3930** | Credit-line fields + community-profile read-only permissions on Account | ✅ Done |
| **BMS-4171** | `ECOM_Minimum_Case_Quantity__c` + `Configuration_Preference__mdt` config | ✅ Done |
| **BMS-4258** | Contacts-to-Multiple-Accounts (AccountContactRelation) enabled | ✅ Done |
| **BMS-4168** | `Order_Item__c.Backorder_Quantity__c` alignment to internal logic | ✅ Done |
| ~~**BMS-4053** Storefront wired to `S_PriceResolver`~~ | ➡️ **MOVED to Phase 2** — ships when 4053 merges |
| **BMS-3980** | "E-Commerce: Remaining Pieces" original scope tracker | ✅ Done (closed-out umbrella) |

**Phase 1 one-liner for the epic:** *"Retailer storefront MVP — branded Experience Cloud portal where a retailer logs in, browses a warehouse-scoped catalog with account-specific pricing and promotions, manages a cart with min-order + backorder rules, submits and reorders, switches between their businesses, and sees their credit/payment status."*

---

## 🟡 Phase 2 — Pricing/Promo Completion & Checkout (NEXT)

The genuine remaining build to finish the ordering loop. Spine = the BMS-3874 pricing-engine integration.

| Ticket | What's left | Status | Crucial? |
|---|---|---|---|
| **BMS-4053** | Product Card — account price + Post-off + QD promo + stock badge (shop + PDP); storefront `S_PriceResolver` wiring. **Foundation for the rest of Phase 2.** | Build (PR #293) | 🔴 Crucial |
| **BMS-4052** | Checkout + Tax + Order — full-waterfall total, **entity-aware FL/AL tax**, order creation w/ pricing lineage | Needs Refinement | 🔴 Crucial |
| **BMS-4051** | **Post-off + QD promo UI on cart page + PDP** + cart-reactive recalc (4076 was straight-line only) | Needs Refinement | 🟡 Consistency-critical |
| **BMS-4054** | Product Card Ph2 — grid reuse + promotions-first sort + image fallback | In Progress | 🟡 |
| **BMS-3932** | Self-service account mgmt v1 (address/contacts, no approval) | In Progress | 🟢 |
| **BMS-5321** | Segmented promo banners at login | Needs Refinement | 🟢 |
| **BMS-3926** | Passwordless login + registration — verify & close | Testing | 🔴 (access gate) |
| **BMS-5344** | Reorder banner blue-on-blue fix | Review | 🟢 cosmetic |
| *dep* **BMS-3874** | Wire forward-sale consumers → `S_PriceResolver` (e-comm leg likely covered by 4053) | To Do | 🔴 enabler |
| **BMS-4050** | Cart basic pricing — **fold/close** (covered by 4053's `resolveCartPricing`; verify cart page) | Fold → close | — |

---

## 🔴 Post-MVP — deferred / dependency-gated (DUMP HERE)

| Ticket              | Why post-MVP                                                                                   | Status           |
| ------------------- | ---------------------------------------------------------------------------------------------- | ---------------- |
| **BMS-4525**        | Credit terms Ph 2 — AR sync, invoice list, payment history (integration dependency)            | To Do (SP8)      |
| **BMS-5322**        | Self-service v2 — zone model, address validation, change-approval (Named Cred + Gulf sign-off) | Backlog          |
| **BMS-3920**        | Supplier allocation constraints & case-pack rounding (no data model yet)                       | Needs Refinement |
| **BMS-3925**        | Real-time **per-warehouse** availability (needs warehouse-inventory feed) — re-scoped 06-25    | Needs Refinement |
| **BMS-4494 / 4495** | Reporting spike + build (downstream of feature completion)                                     | Backlog          |

---

## Closed (not in any phase)

| Ticket | Resolution |
|---|---|
| **BMS-3924** Product card & grid (umbrella) | ✅ Won't Do — superseded by 4053/4054 |
| **BMS-3928** Cart & checkout (umbrella) | ✅ Won't Do — superseded by 4049/4050/4051/4052 |

---

## Decisions needed before this goes live in Jira

1. **Structure (3 options):**
   - **(a) Rename BMS-4995 → Phase 1**, create Phase 2 + Post-MVP epics, move the ~14 open/deferred children out. *Cheapest — Phase 1's 11 stay put.* ⚠ But BMS-4995 is **[REQ-068]** — renaming changes what the REQ epic reads as.
   - **(b) New Phase 1 epic**, re-parent all 11 into it; new Phase 2 + Post-MVP epics. *Preserves REQ-068 traceability; most moves (~25).*
   - **(c) Keep BMS-4995, add `phase-1`/`phase-2`/`post-mvp` labels.** *Zero re-parenting; no hierarchy separation.*
2. **Phase 1 cutline:** confirm BMS-4053 is the line. Items in Testing/Review (3926, 5344) — Phase 1 tail or Phase 2? (Drafted them as Phase 2 since they're not merged.)
3. **Phase 1 name:** pick from the options above.
4. ✅ **Parentage — RESOLVED 2026-06-25:** all 11 Phase 1 tickets (incl. BMS-4076 / BMS-4049) confirmed under BMS-4995.
