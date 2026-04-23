---
ticket: BMS-4051
title: "Cart & Checkout with Gulf Pricing — Ph 2: Volume Tiers + Promos"
status: Backlog
type: Story
priority: TBD
phase: 2b
execution_order: 10
labels: [decomposed-from-BMS-3928, ecom, gulf, phase-2]
jira: https://ohanafy.atlassian.net/browse/BMS-4051
parent: BMS-3928
---

# BMS-4051 — Cart & Checkout with Gulf Pricing — Ph 2: Volume Tiers + Promos

> [Jira](https://ohanafy.atlassian.net/browse/BMS-4051) | Phase 2b | Execution Order: 10

## Summary

Volume tier recalculation when quantities change, plus correct handling of mixed pricing codes and promotional pricing in the cart. Gulf's pricing waterfall: frontline price → volume discount → promo → chain-specific rate.

## Jira Links

- Relates to: [[BMS-3928 — Cart & Checkout with Gulf Pricing]] (parent: Cart & checkout with Gulf pricing)
- Preceded by: [[BMS-4050 — Cart Ph 1 — Cart & Basic Pricing]] (Ph 1: Basic Pricing)
- Followed by: [[BMS-4052 — Cart Ph 3 — Checkout, Tax & Order]] (Ph 3: Checkout + Tax)

## What Already Exists in the Codebase

| Component | Status | Path |
|-----------|--------|------|
| ecomPromotions LWC | **COMPLETE** | `lwc/ecomPromotions/` |
| Promotion criteria quantities (Apex) | **COMPLETE** | `CartController.getPromotionCriteriaQuantities()` |
| Percent + dollar discount types | **COMPLETE** | Promotion calculation logic |
| Promotion progress tracking | **COMPLETE** | Visual nudges toward next tier |
| Promotion savings display | **COMPLETE** | Cart + review pages |
| Volume tier re-resolution on qty change | MISSING | No dynamic tier recalculation |
| Mixed pricing code handling | MISSING | No cross-contamination prevention |
| Chain-specific negotiated rates | MISSING | No chain-level pricing overlay |
| Pricing waterfall display | MISSING | No visual breakdown of price components |

## What Needs to Be Done

1. Implement volume tier recalculation when cart quantities cross tier thresholds
2. Prevent pricing code cross-contamination between line items
3. Add chain-specific negotiated rate overlay (e.g., 7-Eleven vs independent)
4. Display pricing breakdown: frontline → volume → promo → final
5. Ensure promotion savings update dynamically with tier changes

## Effort Estimate

**Large** — pricing waterfall logic is complex. Multiple discount layers must compose correctly without cross-contamination.

## Dependencies

- **Blocks**: [[BMS-4052 — Cart Ph 3 — Checkout, Tax & Order]] (checkout needs correct pricing)
- **Blocked by**: [[BMS-4050 — Cart Ph 1 — Cart & Basic Pricing]] (basic pricing must work first)

---

## Completion — Built vs Wanted

**~56% already built** • **~44% Gulf-specific work remaining**

Progress: `███████████░░░░░░░░░` (56%)

| Status | Count |
|---|---:|
| Built (COMPLETE) | 5 |
| Partial | 0 |
| Missing | 4 |
| **Total tracked items** | **9** |

**Top gap drivers (what still needs building):**
- Volume tier recalculation when cart quantities cross tier thresholds
- Pricing code cross-contamination prevention between line items
- Chain-specific negotiated rate overlay (e.g., 7-Eleven vs independent)
- Visible pricing waterfall breakdown (frontline → volume → promo → final)
- Dynamic promotion-savings updates as tiers shift
