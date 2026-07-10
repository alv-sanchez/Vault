---
ticket: BMS-4050
title: "Cart & Checkout with Gulf Pricing — Ph 1: Cart + Basic Pricing"
type: Story
status: Backlog
sprint: "Sprint 4"
blocked_by: "BMS-4049 (architecture spike — still To Do)"
parent: BMS-3928
assignee: Alvaro Sanchez
jira: https://ohanafy.atlassian.net/browse/BMS-4050
tags: [sprint4, ecom, gulf, cart, pricing, blocked, polish-flagged]
---

# BMS-4050 — Cart & Checkout with Gulf Pricing — Ph 1: Cart + Basic Pricing

## Summary

Add products to a cart with account-specific pricing and warehouse-filtered availability. Pricing must resolve through the PRC waterfall engine per the retailer's pricing code (154+ codes).



### Story Statement

As a Gulf Retailer, I want to add products to a cart and see my **account-specific pricing** with **warehouse-filtered availability**, so that I only see products available at my servicing warehouse with prices that match my negotiated rates



### Why It Matters

The core cart experience must resolve correct pricing on every product add. Gulf retailers have 154+ pricing codes, and the catalog varies by warehouse. If the cart shows the wrong price or a product from the wrong warehouse, it erodes trust and creates invoice disputes downstream.

### Gulf Context

**From Gulf Blueprint Workshops:**

- Gulf's FL and AL operations carry partially overlapping product catalogs — some brands are stocked in Alabama but not Florida and vice versa — so the storefront must filter available SKUs by the customer's servicing warehouse before any pricing logic runs.
    
- Retailers may have multiple pricing layers applied simultaneously: a frontline price, a volume discount tier, a promotional discount, and potentially a chain-specific negotiated rate — the cart must resolve all layers through the PRC waterfall engine rather than storing a single flat price.
    
- Florida and Alabama have different tax jurisdictions and regulatory requirements for beverage distribution, meaning tax calculation at checkout must be entity-aware, not just zip-code-based.

























## Polish Review (Josh Kraszeski, 2026-05-20) — 7 Issues

### HIGH RISK

1. **Sequencing:** BMS-4049 architecture spike is still "To Do" — this ticket depends on decisions the spike hasn't made yet (pricing waterfall location, tax dispatch, pricing snapshot, OHFY-CORE access). **Cannot groom with confidence.**

2. **Repo mismatch:** Architecture notes reference "OHFY-Core" / "Ozone" — neither exists in OHFY-Split. Real target is OHFY-Ecom + OHFY-CORE per the spike.

3. **Object/field references wrong:** `Cart__c`, `Price_Record__c`, `Product__c`, `Pricing_Code__c` don't exist in OHFY-Split. Need schema confirmation.

4. **Scope creep:** AC#1 includes promo-overlay + volume-tier content that belongs in **Phase 2 (BMS-4051)**. Phase 1 should be frontline pricing only.

5. **Thin ACs:** Only 2 ACs. Missing: cart CRUD (update/remove), persistence, empty state, pricing fallback, min-order-qty, delivery cutoff, regression on sales-rep invoice path.

6. **Open questions not surfaced:** Pricing API contract, stub vs real engine for Phase 1, snapshot refresh behavior — all from parent BMS-3928 but not addressed here.

7. **Minor:** Sprint label drift (`sprint-s3-recommended` vs Sprint 4), Low Stock threshold undefined, `Pricing_Snapshot__c` doesn't exist.

## Suggested Next Steps (from Josh)

1. Decide whether to run BMS-4049 spike first or move this out of Sprint 4
2. Fix Architecture Notes with real repo names
3. Tighten AC#1 — remove promo overlay (Phase 2)
4. Add the 7 missing ACs
5. Surface relevant open questions from BMS-3928

## Key Takeaway

**Highest-risk ticket in the sprint.** Blocked by BMS-4049 spike and has significant refinement work needed per Josh's /polish review. Should not be committed to Sprint 4 until the spike runs.
