---
ticket: BMS-3927
title: "Product search & filtering (category, brand, pack size)"
type: Story
parent_epic: "BMS-3702 — Gulf E-Commerce & Ordering"
source_polish: "../BMS-3927-product-search-filtering.md"
source_progress: "Anvil/Manager/Managing Tickets/Gulf Retailer Portal Epic Specfic/BMS-3927 — Product Search & Filtering.md"
iterated_on: 2026-05-05
phase: 2a
execution_order: 5
status: "Backlog — Gulf taxonomy + pack-size facet only"
tags: [polish, iterating, ecom, gulf, search, sprint3]
---

# BMS-3927 — Iterating (outstanding only)

> Epic-specific note says **~71% built**. The filtering system in ecomShop is comprehensive — most of the polish first-pass concern was about non-existent infra, but the epic note shows it IS there. This ticket is small.

## Pulled OUT (already complete per epic note)

| Item | Path |
|---|---|
| Search (name + SKU, 400ms debounce) | `ecomShop.js` — `handleSearch()`, `handleSearchChange()` |
| Filter: Product Type (cascading) | ecomShop |
| Filter: Brand Family (multi-select w/ in-filter search) | ecomShop |
| Filter: Brand (multi-select w/ cascading hierarchy) | ecomShop |
| Filter: UOM / Pack Size (multi-select via `brandToUOMs` map) | ecomShop |
| Filter: Price Range (4 ranges: <$25, $25-50, $50-100, >$100) | ecomShop |
| Filter: Stock Availability (In Stock / Out of Stock) | ecomShop |
| Filter: Special Offers / On Promotion | ecomShop (UI; data layer — see Conflicts) |
| Sort options (4 modes: Cart Items First, Price L/H, Name) | ecomShop |
| Filter hierarchy maps (`productTypeToFamilies`, `familyToBrands`, etc.) | ecomShop |

→ My polish first-pass concerns about "filter chips," "facet counts," "client-side substring search" were partly redundant — the chip-equivalent multi-select filters and live filter hierarchy already exist. The Gherkin AC #2 about "active filter chips with X to remove" should be checked against the current UI before being declared a gap.

## REMAINING (what hasn't been done)

### Code work

1. **Pack size as a dedicated filter** — currently bundled inside UOM. Two options:
    - (a) Derive pack size at render time from `Cases_Per_Pack__c` + `UOM__c` and split it out as its own facet group. Cheap, slightly fragile across pack conventions.
    - (b) Add a normalized `Pack_Size__c` formula on `Item__c`. Cleanest for grouping; metadata change required.
2. **Gulf category taxonomy mapping** — today's filter hierarchy uses generic OHFY product types/families. Map Gulf's category structure (Beer / Hard Seltzer / Spirits / Non-Alcoholic / Mixers per the AC) into the existing `productTypeToFamilies` / `familyToBrands` hierarchy. Likely metadata + light data load.
3. **(Optional) Search autocomplete / typeahead** — no suggestions today; net-new. Defer if not in MVP scope.
4. **(Optional) Full-text search across descriptions** — today is name + SKU. Net-new; SOSL or a description-field include.
5. **FL/AL catalog overlap behavior validation** — confirm filters behave correctly when the retailer's loaded catalog is warehouse-scoped (depends on BMS-3925's warehouse-aware load path landing).

### Outstanding ACs (from polish first-pass, with completed work removed)

```gherkin
Scenario: Pack size facet returns the right items
  Given ecomShop is loaded for a retailer
  When  the buyer selects pack size '24-pack' from the (new) dedicated Pack Size filter
  Then  only Item__c records matching the pack-size derivation OR the new Pack_Size__c formula are shown
  And   pack-size facet entries reflect only items in the buyer's loaded (warehouse-scoped) catalog

Scenario: Gulf category taxonomy reflected in filters
  Given Gulf-specific category metadata is loaded
  When  the buyer opens the Category facet
  Then  Beer / Hard Seltzer / Spirits / Non-Alcoholic / Mixers appear as Gulf-mapped options
  And   selecting a category narrows the catalog to its mapped Item_Type__c rows

Scenario: Filters behave correctly with FL ↔ AL warehouse-overlap catalog (depends on BMS-3925)
  ↑ Sanity AC — gated on BMS-3925 warehouse-aware catalog load
```

The ACs about "Promoted badge inside category" and "Featured badge" are owned by **BMS-3925 + BMS-4053** plus the promo rebuild — pull them out of this ticket.

## Conflicts to verify

| Item | Epic note says | Actual code says | Resolution needed |
|---|---|---|---|
| Filter: Special Offers / On Promotion | COMPLETE | UI filter likely exists; **data feed is stubbed** — `getItemIdToPromotionsMap` returns empty (`CartController.cls:968-975`) — so the filter currently filters against an empty promo set | Verify in a sandbox: does toggling "On Promotion" actually return items? If not, this filter is a no-op until the promo rebuild lands |

## Hard dependencies (still binding)

- **BMS-3925 — Product Catalog & Availability** — feeds the loaded items[] that filters operate on. The epic note marks 3925 as a blocker; that's correct.
- **Promotion-model rebuild** — needed if the "On Promotion" filter is expected to return non-empty results.
- **BMS-3930** — same title-mismatch concern.

## Updated estimate

**~1 day** for pack-size facet split (option a) + Gulf taxonomy mapping. Add ~1–2 days if (option b) the Item__c formula field route is chosen, or if autocomplete/full-text are pulled in. Aligns with epic note's "Small."
