---
title: Sprint-by-Sprint Execution Order (Pricing + Portal)
created: 2026-04-22
updated: 2026-04-22
epic: Gulf Retailer Portal
owner: Alvaro Sanchez
status: proposed
tags: [gulf, pricing, sprint-plan, execution-order]
---

# Sprint-by-Sprint Execution Order — Pricing + Portal (revised)

> **Purpose**: Translate the pricing-code decomposition in [[01 - Decomposed Tickets & Parallel Workstreams]] into a concrete week-by-week plan across Sprints 2–5. Every sprint has a **demoable deliverable**, a **dependency gate**, and a **risk flag**.

> **Sprint cadence**: 2-week sprints. Sprint 2 starts 2026-05-02.

---

## Summary at a Glance

| Sprint | Dates | Theme | Demoable output |
|---|---|---|---|
| **Sprint 2** | 2026-05-02 → 2026-05-15 | Pricing foundation + portal consumers ready (mocked) | Shop grid renders prices through PricingResolver (mock); refined Sprint-2 ticket set (BMS-3929, 3921, 4258, 3930 Ph 1) refined and in progress |
| **Sprint 3** | 2026-05-16 → 2026-05-29 | Real resolver + cart wired | Retailer adds items to cart, sees real Gulf pricing per their pricelist |
| **Sprint 4** | 2026-05-30 → 2026-06-12 | Volume tiers + promos | Retailer crosses a volume breakpoint and sees the price drop; active promotions override base price |
| **Sprint 5** | 2026-06-13 → 2026-06-26 | Checkout, tax, order submit | End-to-end order submitted with Gulf pricing, FL/AL tax, and audit trail |

---

## Sprint 2 (2026-05-02 → 2026-05-15) — Foundation

### Goal
Unblock every downstream pricing consumer by shipping the **contract** (resolver interface + mock) and **four parallel tracks** that start producing value immediately.

### Committed scope

**Pricing block (this folder):**
- **A1** — Confirm pricing object topology (1d)
- **A2** — Add missing fields to chosen object(s) (1d)
- **B1** — Define `PricingResolver` Apex interface + `PricingResult` wrapper (0.5d)
- **B2** — Ship `MockPricingResolver` (0.5d)
- **C1** — Build `pricingService` LWC module calling resolver (1d)
- **C2** — Migrate `ecomShop` to `pricingService` (mock) (1d)
- **D1** — Publish CSV template + data dictionary for Ops (0.5d)
- **BMS-4049 umbrella reframed** — umbrella closes EOS2 once the five above are accepted

**Polished Sprint-2 tickets (from the `sprint1` polishing folder):**
- **BMS-3929** — Order history & two-click reorder (3d)
- **BMS-3921** — Retailer engagement notifications Gulf delta (4-5d)
- **BMS-4258** — Multi-profile registration (4-5d)
- **BMS-3930 Ph 1** — Credit terms + portal page (5-6d)

### Dependency gate (must be resolved by 2026-05-01)
Before Sprint-2 Day 1, the items in [[03 - Decision Gate — Pre-Sprint 2]] must be answered. In particular:
1. Topology for pricing data (A1 default pre-picked).
2. Owning package for `Order__c` and any `Invoice__c` (affects BMS-3929 and BMS-3930).
3. "Contacts to Multiple Accounts" org setting enabled (affects BMS-4258).
4. BMS-3930 split into Ph 1 / Ph 2 agreed.

### Sprint-2 demo
1. Open Gulf portal as a test retailer.
2. Browse shop grid — prices render, but a small badge notes "Pricing resolved via mock (passthrough)".
3. Navigate to `/payment-status` — credit summary renders (Ph 1 scope).
4. Order history shows two-click reorder; reorder opens modal pre-populated.
5. Registration wizard supports adding a second business.
6. Engineering team walks through the PricingResolver interface and the four-track plan.

### Risks
- **A1 + A2 tied to the engineering lead's decision.** If topology is debated past sprint day 3, B3/C3 slip into Sprint 4. Mitigation: default pick (A1.a = reuse existing pricelist objects) is documented in `03 - Decision Gate`.
- **BMS-4258 org setting toggle is external.** If Gulf admin doesn't enable "Contacts to Multiple Accounts" before sprint start, that story can be implemented but cannot run end-to-end.
- **BMS-3930 Ph 1 needs Outstanding_Balance source decision.** Manual is fastest; agree at pre-sprint.

---

## Sprint 3 (2026-05-16 → 2026-05-29) — Real resolver + cart

### Goal
Replace the mock with a real resolver that reads Gulf pricing data and ship the cart flow end-to-end with Gulf-specific pricing.

### Committed scope

**Pricing block:**
- **B3** — `GulfPricingResolver` (single pricelist, base price) (2d)
- **A3** — Gulf sample pricing seed data (1d)
- **D2** — Idempotent loader script (1-1.5d)
- **C3** — Migrate `ecomCartPage` + `draftInvoiceService` to `pricingService` (1.5d)

**Cart:**
- Resolver swap via `Service_Configuration__mdt` — mock → real
- Apex test coverage for every path (no pricelist, no item, asOf = now, bulk resolve)

**Other tickets shipped in parallel this sprint** (from the broader portal epic, not this folder):
- BMS-3925 — Product Catalog & Availability (multi-warehouse filtering)
- BMS-3927 — Product Search & Filtering (pack size + Gulf category mapping)
- Any Sprint-2 rollovers (likely BMS-3930 Ph 1 if Outstanding_Balance decision slipped)

### Dependency gate
- Sprint 2 Tracks A1, A2, B1, B2, C1 accepted.
- Gulf AR / Ops confirms they have the authoring time to produce a meaningful sample dataset for A3.

### Sprint-3 demo
1. Load the Gulf sample pricing seed via the new loader script (D2).
2. As a Gulf retailer on a Montgomery AL account, browse the shop — prices now reflect the retailer's real pricelist, not the mock.
3. Add items to cart — cart line prices are resolved live; total matches the resolver's bulk output.
4. Switch the account's pricelist in Salesforce — cart auto-re-resolves next page load.
5. Show the Apex test suite green including bulk resolve governor-limit case.

### Risks
- **A3 depends on Ops availability.** If Ops can't produce sample data by sprint day 5, use a synthetic dataset and note it as a gap.
- **B3 vs. B4/B5 scope creep.** Keep Sprint 3 to "single pricelist, base price". Volume tiers and promos are explicitly Sprint 4.

---

## Sprint 4 (2026-05-30 → 2026-06-12) — Volume tiers + promos + pricing UX

### Goal
Add the two highest-value pricing features (volume tier breakpoints + active promotional overrides) and expose the applied pricing code in the UI.

### Committed scope

**Pricing block:**
- **B4** — Volume-tier resolver logic (1-1.5d)
- **B5** — Promotional-window resolver logic (1d)
- **C4** — Show `appliedCodeName` in shop grid and cart line rows (0.5d)

**Other tickets in parallel:**
- BMS-3924 / BMS-4053 — Product Card Ph 1 (Gulf-specific pricing display)
- BMS-4054 — Product Card Ph 2 — Grid Layout & Reuse
- BMS-3931 — Order Status Tracking & Delivery Notifications

### Dependency gate
- Sprint 3 B3 + C3 accepted.
- Sample data extended with volume-tier rows and at least one active promotional window.

### Sprint-4 demo
1. Add 10 cases of an SKU → base price.
2. Bump to 25 cases → price drops to volume-tier price. Cart line shows "Volume Tier 25-49" label.
3. Add an SKU covered by the "Summer 2026 Promo" → cart line shows "Summer 2026 Promo" label and the promo price.
4. Fast-forward the asOf date past the promo end → price reverts and label disappears.
5. Walk through the resolver's Apex test matrix.

### Risks
- **Volume-tier data shape is still TBD in A1/A2.** If Sprint 2 chose a minimal topology that can't express tiers, B4 becomes a migration. Mitigation: require topology to handle tiers by the end of A1.
- **Promotion trigger / notification dependency**: BMS-3921 Sprint 2 promotional-activation notifications bind to whatever the promo record is; keep their shape synchronized.

---

## Sprint 5 (2026-06-13 → 2026-06-26) — Checkout, tax, order submit

### Goal
Close the loop: retailer can submit a real order with Gulf pricing, FL/AL tax, and an audit trail.

### Committed scope

**Pricing block:**
- **C5** — `ecomReviewSummary` checkout page binds to `pricingService` with an on-mount re-resolve (1d)
- **D3** — Optional admin authoring UI (1-2d, conditional — only if Sprint 4 retrospective shows CSV editing is painful)
- Pricing audit trail: `Order_Item__c.Applied_Pricing_Code__c` + `Resolver_Explanation__c` (1d)

**Cart / checkout:**
- BMS-4052 equivalent — Gulf FL/AL tax jurisdiction replaces the hard-coded 8.75% in `ecomReviewSummary`
- Minimum order enforcement
- Submit → Order__c with resolved prices + audit trail

**Other tickets in parallel:**
- BMS-3932 — Self-service account management (address editing)
- BMS-3922 — Call Center Order Visibility (can begin — no pricing dep)

### Dependency gate
- Sprint 4 B4 + B5 + C4 accepted.
- Tax jurisdiction data available in Salesforce (FL rate, AL rate, per-county overrides if needed).

### Sprint-5 demo
1. End-to-end: retailer adds items, sees volume tier + promo, navigates to checkout, sees FL tax applied, submits.
2. New Order__c record contains resolved prices, applied pricing codes per line, and a human-readable explanation string.
3. Call-center agent (BMS-3922 preview) can see the order with the same audit data.

### Risks
- **Tax is itself a substantial scope.** If FL + AL county tax is non-trivial, split into its own Sprint-6 mini-sprint. Do not let tax swallow the checkout story.
- **Audit-trail field additions cross packages** — verify Order__c ownership and coordinate with Data-Model maintainers.

---

## Sprint Rollover Rules (explicit)

1. A Track-B ticket cannot be "in progress" without its interface (B1) merged. No verbal agreements; ship the interface file first.
2. A Track-C ticket cannot be "in progress" without a working resolver (mock or real). Consumers depend on behaviour, not code.
3. A Track-D ticket cannot be "done" without Ops running the loader at least once in sandbox. Theoretical correctness isn't proof.
4. If a sprint commits to more than the demos listed above, renegotiate before day 3. Most slippage in the Gulf epic has been late over-commitment, not mid-sprint surprises.

---

## Cross-Sprint Parallel Track Map

```
                    Sprint 2            Sprint 3            Sprint 4            Sprint 5
Track A (data) ──►  A1, A2  ────────►  A3  ─────────►     (stable)      ────►  (stable)
Track B (resolver)  B1, B2  ────────►  B3  ─────────►  B4, B5  ────────►  (stable)
Track C (portal) ►  C1, C2  ────────►  C3  ─────────►  C4       ───────►  C5
Track D (ingest) ►  D1       ───────►  D2  ─────────►  (stable) ────────►  D3 (optional)
Other ECOM      ►  3929,3921,4258,   3925,3927        3924,4053,4054    3932, 3922
                   3930-Ph1            rollovers          3931
```

Every column (sprint) has output in every row (track). No sprint is silent on any track.

---

## Key principle

> **Ship the mock first. Ship the contract before the implementation. Ship the plumbing before the feature.**

This is the difference between a 3-week serial block and four 2-week parallel sprints. Execute it, and the pricing code block disappears as a concept — by Sprint 3, the team is talking about "resolver tests" and "volume tier edge cases", not "waiting on the spike".
