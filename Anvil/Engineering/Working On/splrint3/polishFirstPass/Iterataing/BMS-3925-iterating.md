---
ticket: BMS-3925
title: "Product Catalog & Availability for Retailers"
type: Story
parent_epic: "BMS-3702 — Gulf E-Commerce & Ordering"
source_polish: "../BMS-3925-product-catalog-availability.md"
source_progress: "Anvil/Manager/Managing Tickets/Gulf Retailer Portal Epic Specfic/BMS-3925 — Product Catalog & Availability.md"
iterated_on: 2026-05-05
phase: 2a
execution_order: 4
status: "Backlog — refinement narrowed to Gulf gap items"
tags: [polish, iterating, ecom, gulf, catalog, sprint3]
---

# BMS-3925 — Iterating (outstanding only)

> Epic-specific note says **~73% built**. Catalog UI is fully built; this ticket is the data-layer extension to make it Gulf-aware.

## Pulled OUT (already complete per epic note)

| Item | Path |
|---|---|
| `ecomShop` product browsing grid | `lwc/ecomShop/` |
| `ecomProductPage` product detail | `lwc/ecomProductPage/` |
| `CartController.getQuantityAvailableAtFulfillmentLocation` (single-location) | `classes/experienceSite/CartController.cls:642-680` |
| `userDataService` product caching | `lwc/userDataService/` |
| Pricelist item loading | `CartController.getFilteredRecords()` |
| Stock status display (In Stock / Low Stock / Out of Stock) | ecomShop + ecomProductPage |
| `Configuration_Preference.EcommerceShowQuantityAvailable` show-qty toggle MDT | configurationPreferences |

→ The polish first-pass ACs that **just verify these paths render correctly** can be dropped (or downgraded to regression-only).

## REMAINING (what hasn't been done)

### Code work

1. **Multi-warehouse query support** — extend `getQuantityAvailableAtFulfillmentLocation()` (or a sibling) to accept *multiple* fulfillment locations / handle FL ↔ AL partial-overlap catalog. Today the method takes a single `fulfillmentLocationId` and substring-matches against `Location_Hierarchy_Dev__c`.
2. **Warehouse-specific catalog filtering** — apply the retailer's `Account.Fulfillment_Location__c` to the catalog *load path* (today's filter happens at availability-check time, not at items-list-build time).
3. **Account-specific pricing display** — replace generic pricelist price with Gulf-pricing-code resolution on each tile. **Hard blocker: depends on the BMS-4049 pricing spike to land first.**
4. **Warehouse indicator badge** on the product card (which warehouse stocks this item) — coordinate with **BMS-4053** (card extraction owns the badge UI).
5. **Empty-state copy + link** — "No products at your location" with link to browse all categories (UI gap; small).
6. **Promotional carousel placement** — decide whether `ecomPromotions` LWC renders above the catalog grid as the "Promotions" carousel (AC #4 on the Jira ticket). Reuse not rebuild.

### Outstanding ACs (from polish first-pass, with completed work removed)

```gherkin
Scenario: Retailer sees only items stocked at their servicing warehouse (warehouse-aware catalog load)
  ↑ AC remains — the *availability check* exists but warehouse-aware *catalog load* is the gap

Scenario: Catalog reflects warehouse-specific stock status badges with configurable threshold
  ↑ Tier display is built; what's missing is a configurable LOW-stock threshold MDT
     (today's `EcommerceShowQuantityAvailable` toggles visibility; no `EcomLowStockThresholdCases`)

Scenario: Promotional items surface with account-eligible discounts
  ↑ See "Conflicts to verify" — promo lookup methods are stubbed; AC cannot pass

Scenario: Empty-state when no items match warehouse + category filter
  ↑ Net-new copy + link

Scenario: Regression — existing ecomShop pagination, pubsub, cart-add path keep working
  ↑ KEEP — extracts as the safety net for any catalog-load refactor
```

## Conflicts to verify

> Items the **epic note** marks COMPLETE that the **Develop-Split migration** appears to have stubbed. **Check before assuming "done."**

| Item | Epic note says | Actual code says | Resolution needed |
|---|---|---|---|
| Territory exclusion support | COMPLETE (`CartController.getTerritoryExclusions()`) | **STUB** — returns empty list (`CartController.cls:896-901`); `Brand_Territory_Exclusion__c` removed in OHFY-CORE in favor of `Item_Type_Territory_Exclusion__c` | Rebuild against the new model OR confirm whether the catalog actually relies on territory exclusions today |
| Promo-aware filtering / surfacing | implied COMPLETE (Configuration MDT toggles exist) | **STUB** — `getItemIdToPromotionsMap`, `getPromotionCriteriaQuantities`, `getPromotionJunctions` all return empty (CartController.cls:630-637, 962-975) | Same rebuild dep — file the foundational ticket if not already filed |
| `Configuration_Preference.EcommerceShowQuantityAvailable` | COMPLETE | likely fine, but no `EcomLowStockThresholdCases` MDT exists | Decide whether 'Low Stock' threshold lives in MDT or per-Location__c / per-Item__c |

## Hard dependencies (still binding)

- **BMS-4049 — Gulf Pricing Spike** (architecture discovery for account-specific pricing) — must land before AC #1 around per-pricing-code price display can be implemented.
- **BMS-3923 — Experience Cloud Theme & Brand Setup** — listed as blocker in the epic note.
- **Promotion-model rebuild** — not yet filed as a ticket; needed for promo carousel + badges.
- **BMS-3930** — same title-mismatch as BMS-3923/3927/3924; either re-link or clarify.

## Updated estimate

**~1.5–2 days** for the actually outstanding work, **excluding** the BMS-4049 spike outcome and the promotion-rebuild ticket. (Epic note already estimates "Medium — extending the data layer.") Down from the polish first-pass's 3–4d because the catalog UI and the single-location availability API are confirmed done.
