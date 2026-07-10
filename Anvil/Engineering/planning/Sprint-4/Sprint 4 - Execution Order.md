---
title: "Sprint 4 — Execution Order"
sprint: "Sprint 4 (2026-05-30 → 2026-06-12)"
updated: 2026-05-21
---

# Sprint 4 — Recommended Execution Order

## Key Update: BMS-4049 spike is RESOLVED

Your comment on BMS-4049 (2026-05-20) confirms architecture decisions are answered by ADR-0009 + BMS-3725. This **unblocks BMS-4050** (Cart Ph 1).

**External dependency still in play:** BMS-3725 (Leah's `S_FrontLinePricing.resolve()`) must land before BMS-4050/3925/3929 can wire to it. Status: To Do, PRs up for migration in Split.

---

## Execution Order

### 1. BMS-3927 — Product search & filtering (FINISH FIRST)
**Why first:** Near-complete. Only fuzzy match AC remains. Quick win to close out early and clear the board.

### 2. BMS-4373 — Automated Order Reminders (SPIKE, parallel)
**Why early:** Unblocked — no pricing dependency. Research spike can run in parallel while card work starts. Emily noted BMS-3921 may duplicate this work, so the spike output clarifies Sprint 5 scope.

### 3. BMS-4053 — Product Card Ph 1: Card Component
**Why next:** Core building block. Every other UI ticket (grid, catalog, reorder) needs this card. Emily's direction: configurable field set in existing UI. Open Qs: UPC, min case qty, Leah's blocking tickets.

### 4. BMS-4054 — Product Card Ph 2: Grid Layout + Reuse
**Why here:** Directly depends on BMS-4053. Can start as soon as the card component ships. Needs refinement on promo sort vs carousel question.

### 5. BMS-4050 — Cart + Basic Pricing Ph 1
**Why mid-sprint:** Now unblocked by BMS-3725/ADR-0009 resolving the spike. But still needs:
- ACs tightened (Josh's 7 issues from /polish)
- Promo content stripped to Ph 2 boundary
- BMS-3725 resolver available to call from ecom

### 6. BMS-3925 — Product Catalog & Availability
**Why later:** Layer 1 (warehouse availability) is done. Remaining work (pricing remap + promos) needs BMS-3725 to land. Can start the promo carousel UI work while waiting.

### 7. BMS-3929 — Order History & Two-Click Reorder
**Why last:** Blocked on pricing architecture AND needs rework to document 2-click journey (Elliot's ask). Depends on BMS-3725 + potentially BMS-4050 cart patterns.

### 8. BMS-3924 — Product Card & Grid (PARENT)
**Action:** Close as superseded by BMS-4053 + BMS-4054, or convert to epic. No implementation work.

---

## Risk Assessment

| Risk | Impact | Mitigation |
|---|---|---|
| BMS-3725 doesn't land during Sprint 4 | BMS-4050, 3925, 3929 can't wire pricing | Start UI/cart shell work independent of resolver; mock pricing layer |
| BMS-4050 ACs not tightened before sprint starts | Implementation drifts or scope creeps | Refine ACs before sprint starts using Josh's /polish feedback |
| Leah's 2 blocking tickets (BMS-4053/3925) unknown | May gate card or catalog work | Surface these immediately |
