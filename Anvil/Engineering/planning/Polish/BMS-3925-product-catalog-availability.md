---
ticket: BMS-3925
title: "Product Catalog & Availability for Retailers"
type: Story
parent_epic: "BMS-3702 — Gulf E-Commerce & Ordering"
blocked_by: "BMS-3930 — Retailer credit terms display & payment status (mismatch — see Polish Notes)"
status: "Backlog / Refinement Needed"
sprint: "Sprint 3 (2026-05-16 → 2026-05-29)"
repo_scanned: "/Users/alvarosanchez_1/Documents/OHFY-Ecom/force-app + /Users/alvarosanchez_1/OHFY-Split/OHFY-Data-Model"
polished_on: 2026-05-05
polished_by: Alvaro Sanchez
jira: https://ohanafy.atlassian.net/browse/BMS-3925
tags: [polish, ecom, gulf, catalog, sprint3]
---

# BMS-3925 — Jira-Ready

**Title:** Retailer Product Catalog — warehouse-filtered availability, account-specific pricing, promo surfacing

**Description:**

As a Gulf retailer buyer, I want the catalog page to show only items stocked at my servicing warehouse, priced per my account's pricelist, and with promotional offers visibly surfaced — so I can self-serve order entry without phoning my rep to confirm stock or my negotiated rate.

**Current State (2026-05-05, per codebase scan):**

- `lwc/ecomShop` is **already a working catalog grid** with pagination, client-side search, and filter state for brand / product-type / family / UOM (`ecomShop.js:38-55, 71-96`). It pulls items via `draftInvoiceService` rather than a dedicated catalog controller (`ecomShop.js:20`).
- Warehouse-aware availability lookup already exists: `CartController.getQuantityAvailableAtFulfillmentLocation(fulfillmentLocationId)` queries `Inventory__c` + `Lot_Inventory__c` filtered by `Location__r.Location_Hierarchy_Dev__c LIKE :pattern AND Location__r.Is_Sellable__c = TRUE` (`CartController.cls:642-680`). Wired into ecomShop (`ecomShop.js:23`).
- Account → servicing warehouse: `Account.Fulfillment_Location__c` (renamed from `Fulfilled_From__c` during the Develop-Split migration) drives the filter.
- **The catalog object is `Item__c`, not `Product__c`.** `Cart_Item__c.Product__c` is a *lookup field* that points at `ohfy__Item__c` — the field name is "Product" but the target SObject is `Item__c` (OHFY-Data-Model).
- Brand list source: `CartController.getBrands(List<Pricelist_Item__c>)` returning `Item_Type__c` rows (live, lines 903-921).
- Promotion model surfaces are **currently stubbed pending Develop-Split rebuild**:
  - `getPromotionCriteriaQuantities` returns empty map (CartController.cls:630-637) — comment notes `Promotion_Brand__c / Promotion_Product__c / Promotion_Supplier__c` were removed in OHFY-Core in favor of `Promotion_Item__c` / `Promotion_Item_Type__c`.
  - `getItemIdToPromotionsMap` returns empty map (CartController.cls:968-975).
  - `getPromotionJunctions` returns empty map (CartController.cls:962-966).
  - `getTerritoryExclusions` returns empty list — `Brand_Territory_Exclusion__c` removed; replacement is `Item_Type_Territory_Exclusion__c` (CartController.cls:896-901).
- Order/cart write path has been re-wired through `EcomWrappers.cls` (new file in `classes/experienceSite/`) which is an `@AuraEnabled` passthrough to `DraftInvoiceController` (initializeDraftInvoice, updateDraftInvoice, onInvoiceItemChange, confirmDrafts).
- `Order__c` / `Order_Item__c` no longer exist — renamed to `Invoice__c` / `Invoice_Item__c` (Develop-Split migration). Most Promotional ACs reference promotional pricing displayed on the catalog tile (rendering surface), not promotional Order_Item line behavior.

**Out of Scope (this ticket):**

- Rebuilding the four stubbed promotion methods against `Promotion_Item__c` / `Promotion_Item_Type__c` / `Item_Type_Territory_Exclusion__c` — that is a foundational pre-req shared with BMS-3924 / 4053 / 4054 / 3927 and probably warrants a single own ticket.
- The PRC pricing waterfall resolver itself (assumed to live upstream in the pricing package; this ticket only renders the resolved unit price).
- Search/filter behavior covered by **BMS-3927** (this ticket scopes filter facets to *category* navigation; faceted brand+pack-size search is BMS-3927).

**Acceptance Criteria:**

```gherkin
Scenario: Retailer sees only items stocked at their servicing warehouse
  Given a portal-logged-in retailer's Account has Fulfillment_Location__c = 'Milton FL'
  And   the Milton FL Location__c has Is_Sellable__c = TRUE
  And   Inventory__c at Milton FL has 80 distinct Item__c records with Quantity_Available__c > 0
  When  the retailer loads the Catalog page
  Then  ecomShop renders only those 80 items
  And   items stocked exclusively at Montgomery / Mobile / Huntsville / McCalla AL warehouses are excluded
  And   each tile shows the resolved unit price for the retailer's pricelist (not the base list price on Item__c)

Scenario: Catalog reflects warehouse-specific stock status badges
  Given the retailer is serviced from Milton FL
  And   Item 'Gulf Coast IPA' has Inventory__c.Quantity_Available__c = 12 cases at Milton FL
  And   the Configuration_Preference__mdt low-stock threshold = 24 cases
  When  the catalog renders
  Then  the 'Gulf Coast IPA' tile displays a 'Low Stock' badge
  And   tiles for items with Quantity_Available__c = 0 at Milton FL show 'Out of Stock' (tile grayed-out, Add-to-Cart disabled)
  And   tiles do NOT display the exact case count to the retailer — only In Stock / Low Stock / Out of Stock tier
  And   availability is read live (not cached past a single page load)

Scenario: Category navigation filters within warehouse-stocked items
  Given the retailer's Milton FL catalog includes items across categories Beer, Hard Seltzer, Spirits, Non-Alcoholic, Mixers
  And   Item__c.Category__c is a formula rolled up from Item_Type__r.Category__c
  When  the retailer selects the 'Hard Seltzer' category filter
  Then  only Hard Seltzer items stocked at Milton FL are displayed
  And   the count indicator reads 'Hard Seltzer (N)' where N is items with Quantity_Available__c > 0 at Milton FL within that category

Scenario: Promotional items surface with account-eligible discounts
  Given Promotion__c.Is_Active__c = TRUE for the current date (Start_Date__c <= TODAY <= End_Date__c)
  And   the promotion targets the retailer via Promotion__c.Customer__c, .Territory__c, or eligible chain (Is_Chain_Level__c)
  And   the promotion is linked via Promotion_Item__c or Promotion_Item_Type__c to items in the retailer's catalog
  When  the catalog loads with default sort
  Then  eligible items render in a 'Promotions' carousel/section above the main grid
  And   each promo tile shows the original price struck through with the discounted price below
  And   the discount % (Promotion__c.Discount_Percent__c) and promo Name are visible on the tile
  And   retailers not eligible for this Promotion__c do not see it surfaced

Scenario: Empty-state when no items match the warehouse-and-category filter
  Given a retailer serviced from Huntsville AL with no Spirits inventory
  When  the retailer applies the 'Spirits' category filter
  Then  the grid shows: 'No Spirits products are currently stocked at your location (Huntsville AL). Check back soon or contact your Gulf rep.'
  And   the message includes a link to 'Browse all available categories'
  And   no placeholder/dummy tiles are rendered

Scenario: Regression — existing ecomShop pagination, pubsub, and cart-add path keep working
  Given the catalog renders for a Milton FL retailer
  When  the retailer paginates, edits filters, or clicks Add-to-Cart
  Then  pageList recomputes correctly (ecomShop.js:38-55)
  And   add-to-cart flows through draftInvoiceService → DraftInvoiceController via EcomWrappers (no regressions vs. develop-split baseline)
  And   the cart icon badge updates without a full page reload
```

**Technical Approach:**

1. **Promotion-model rebuild (shared dependency):** Coordinate with BMS-3924 / 3927 / 4053 / 4054 owners — the four stubbed CartController methods (`getPromotionCriteriaQuantities`, `getItemIdToPromotionsMap`, `getPromotionJunctions`, `getTerritoryExclusions`) need rebuilding against `Promotion_Item__c` / `Promotion_Item_Type__c` / `Item_Type_Territory_Exclusion__c`. Without these, every promo-related AC on this ticket can only be unit-tested with mock data. **This should be split into its own ticket** if not already.
2. **Wire warehouse filter end-to-end in ecomShop:** confirm the catalog loader filters by `Account.Fulfillment_Location__c` from page load (today `getQuantityAvailableAtFulfillmentLocation` exists but the catalog-load source pulls items via `draftInvoiceService`). Verify the load path applies the warehouse filter pre-render rather than client-side.
3. **Low-stock threshold:** add or confirm a `Configuration_Preference__mdt` record (e.g., `EcomLowStockThresholdCases`) — current MDT inventory shows `EcomMinimumCaseQuantity` but no low-stock-tier threshold. Default to 24 cases unless workshop says otherwise.
4. **Promo carousel placement:** decide if the existing `ecomPromotions` LWC renders above ecomShop on the catalog page or if a new top-of-grid carousel is required. Reuse rather than rebuild.
5. **Empty-state copy & link:** add empty-state slot to ecomShop's render path (today the LWC handles "no items" implicitly via empty `pageList`).

**Open Questions (carry to refinement):**

- BMS-3930 dependency mismatch — title is "Retailer credit terms display & payment status," not a structural blocker for catalog rendering. Either the link is wrong or 3930's scope needs clarifying.
- Does Gulf want to see *exact* case-on-hand counts, or only tier badges (In Stock / Low Stock / Out of Stock)? Current AC says tier-only.
- Low-stock threshold: per-warehouse, per-item, or global? Today's `Inventory_Threshold__c` object exists but per-Location__c + per-Account__c — confirm intended granularity.
- Promo carousel: does Gulf want a single top-of-grid carousel, or in-grid badges + carousel both? Affects ecomPromotions reuse strategy.
- Pricing waterfall resolver — which class/method resolves account-specific unit price? (Pricelist_Item__c + Tier_Setting__c are the data; the resolver is assumed but not located in OHFY-Ecom.)
- Are the four stubbed promotion methods being rebuilt as part of this ticket, or is that a separate (currently unfiled) story?

**Estimate:** ~3–4 days **assuming the promotion rebuild is a separate ticket**. If this ticket also owns the promotion-model rebuild, double it.

---

# BMS-3925 — Polish Notes

## Verdict at a Glance

**Refinement needed.** Auto-gen "no existing pattern found" is materially wrong — `ecomShop` is already a functional warehouse-aware catalog grid, with `getQuantityAvailableAtFulfillmentLocation` live and Brand/Item-Type filtering wired. The real risks are: (a) four promotion-related Apex methods are currently stubbed pending Develop-Split rebuild against the new junction model, (b) ticket uses obsolete object names (`Product__c`, `Order__c`) that have been renamed/replaced, (c) BMS-3930 dependency title doesn't match the kind of blocker this ticket needs.

| Area                                                                | Verdict                                                                                                |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Story statement (warehouse-filtered, priced, promo-aware catalog)   | Confirmed                                                                                              |
| Auto-gen risk: "Net new development - no existing pattern found"    | **Contradicted** — ecomShop is a working catalog grid                                                  |
| `Product__c` references in ACs                                      | **Contradicted** — object is `Item__c`; `Cart_Item__c.Product__c` is a lookup *field name*             |
| `getQuantityAvailableAtFulfillmentLocation` for warehouse stock     | **Confirmed** — `CartController.cls:642-680` (live, queries Inventory__c + Lot_Inventory__c)           |
| Promo rendering on catalog tiles                                    | **Contradicted today** — `getItemIdToPromotionsMap` & criteria methods are stubs (CartController:962+) |
| Old promotion model (`Promotion_Brand/Product/Supplier__c`)         | **Removed** — replaced by `Promotion_Item__c` / `Promotion_Item_Type__c`                               |
| `Brand_Territory_Exclusion__c` references                           | **Removed** — replaced by `Item_Type_Territory_Exclusion__c`                                           |
| Dependency BMS-3930                                                 | **Mismatched title** — "Retailer credit terms display & payment status" is not a catalog blocker      |
| Low-stock threshold (24 cases)                                      | **Unverifiable** — no `EcomLowStockThresholdCases` MDT exists today; only `EcomMinimumCaseQuantity`    |

---

## Phase 2 — Business Requirements & ACs

### Structural check

- ✅ Clear purpose (self-service ordering, no rep call)
- ✅ Story type (correct as Story)
- 🟨 Sprint placement — Sprint 3 with BMS-3930 as blocker is risky if BMS-3930 isn't actually blocking
- 🟨 Scope overlap with **BMS-3927** (search & filter) — agree the boundary explicitly: 3925 = warehouse + category + price + promo surfacing; 3927 = keyword search + faceted brand/pack-size filtering

### AC validation (5 scenarios on the ticket)

| AC | Verdict | Notes |
|---|---|---|
| 1 — Warehouse-filtered catalog with account pricing & Featured badge | Partial | Warehouse filter is wireable today (live API). "Featured" badge depends on the stubbed promo map — currently returns empty. |
| 2 — Real-time availability per warehouse | Partial | Live `Inventory__c` query exists (CartController:647-660). "12 cases / threshold 24" needs an MDT-driven threshold (doesn't exist yet). |
| 3 — Category & brand navigation | Partial | Category = `Item__c.Category__c` formula (rolls up from Item_Type__c). Brand is `Item_Type__c`. Both are usable. Sub-filter facets and counts need building. |
| 4 — Promotional carousel with account-targeted discounts | **Contradicted today** | All four promotion lookups are stubbed in CartController. AC cannot pass until rebuild. |
| 5 — Empty state for no-stock category | Confirmed (testable) | Pure UI work in ecomShop. |

### Gaps to plug

- **Missing AC**: regression criterion — confirm existing pagination, search, cart-add, and pubsub flows continue to work post-refactor (ecomShop is non-trivial, ~hundreds of lines, with many subscribers).
- **Missing AC**: handoff criterion — promotional pricing visible on tiles should match what the cart later applies (`Promotion_Invoice_Item__c`).
- **Missing AC**: error-state for "pricelist not resolvable" → fall back to "Contact your rep for pricing" rather than $0 or blank (this exists in BMS-4053's ACs but should also be on the catalog).

---

## Phase 3 — Technical Approach

### Auto-gen ticket says

> "Architecture: L3 (UI/Experience). Related Code: No direct match - likely new development. Approach: Implement following existing patterns in E-Commerce domain. May require new development."

### Claim-by-claim validation

**Claim 1: "No direct match - likely new development"**
- **Code shows:** `ecomShop` is a fully built catalog LWC with pagination, search, filter, cart integration (`ecomShop.js:35-200+`). `EcomBrandingController.getBrandingResource` is wired across 10+ ecom LWCs.
- **Assessment:** **Contradicted.** The catalog page exists; this ticket is incremental enhancement.

**Claim 2: "warehouse-specific availability"**
- **Code shows:** `CartController.getQuantityAvailableAtFulfillmentLocation` (lines 642-680) — works against current schema (`Quantity_Available__c`, `Is_Lot_Tracked__c`, `Location__r.Location_Hierarchy_Dev__c LIKE`, `Is_Sellable__c`). Already wired in `ecomShop.js:23`.
- **Assessment:** **Confirmed.** The mechanism exists; ticket needs to confirm it runs at catalog-load time, not just at add-to-cart time.

**Claim 3: "PRC engine resolves account-specific pricing"**
- **Code shows:** `Pricelist__c`, `Pricelist_Item__c`, `Pricelist_Account__c`, `Tier_Setting__c` exist in OHFY-Data-Model. No resolver class located within OHFY-Ecom; `CartController.getBrands(List<Pricelist_Item__c>)` consumes already-resolved items but does not resolve.
- **Assessment:** **Unverifiable from this repo.** The resolver likely lives in a sibling pricing package; ask the platform team to confirm the entry point. This affects whether ecomShop's tile renders fan out one resolver call per item or batch.

**Claim 4: "Featured badge from active promo campaign"**
- **Code shows:** `getItemIdToPromotionsMap` returns `new Map<>()` (CartController.cls:968-975, comment `STUB during develop-split: depends on Promotion_Brand__c / Promotion_Product__c / Promotion_Supplier__c which were removed`).
- **Assessment:** **Contradicted today.** The promo map is empty; no items can render a Featured badge until the rebuild happens.

**Claim 5: "Promotional pricing struck-through with discount % visible"**
- **Code shows:** `Promotion__c` has `Discount_Type__c`, `Discount_Percent__c`, `Discount_Dollars__c`, `Is_Active__c`, date range fields. The data exists; the resolution path doesn't (claim 4).
- **Assessment:** **Incomplete.** Data model supports it; runtime path is gated on the promo rebuild.

**Claim 6: "Real-time, not stale cache"**
- **Code shows:** `getQuantityAvailableAtFulfillmentLocation` is `@AuraEnabled` (not cacheable=true). `getOrderConfirmation` and some others are `cacheable=true`.
- **Assessment:** **Confirmed.** Live read on each invocation; ticket should clarify this is per-page-load, not per-tile (governor-limit risk on huge catalogs).

### Scorecard

| # | Claim | Verdict |
|---|---|---|
| 1 | "No existing pattern found" | Contradicted |
| 2 | Warehouse availability mechanism | Confirmed |
| 3 | PRC waterfall integration | Unverifiable |
| 4 | Featured/promo badge wiring | Contradicted today (stub) |
| 5 | Promotional discount data | Incomplete (data ✅, resolver ❌) |
| 6 | Real-time availability | Confirmed |

---

## Phase 4 — Dependencies

| Link | Check | Result |
|---|---|---|
| Blocked-by **BMS-3930** ("Retailer credit terms display & payment status") | Does it gate catalog rendering? | **Mismatch.** Title is about credit terms — orthogonal to whether tiles render. If 3930 is actually about ecom site provisioning, fix its title; otherwise re-link. (Same issue surfaced on BMS-3923.) |
| Parent **BMS-3702** (Gulf ECOM) | Consistent | Confirmed |
| Sibling **BMS-3927** (search & filter) | Scope overlap | Yes — agree boundary: 3925 owns warehouse+category+price+promo surfacing; 3927 owns keyword + multi-facet brand/pack |
| Sibling **BMS-3924 / 4053 / 4054** (cards & grid) | Scope overlap | Yes — the *tile* this ticket renders IS the card from 3924/4053. Either 3924/4053 ships first as a primitive 3925 reuses, or 3925 owns rendering and 3924/4053 are subsumed |
| Implicit dep: **promotion rebuild** | Required for promo ACs | **Not currently a ticket.** File one. |

---

## Top Issues (ranked)

1. **Auto-gen framing is wrong.** `ecomShop` is a working catalog. Refinement should start from "enhance existing" not "build new".
2. **Promotion methods are stubbed.** Four of the controllers this ticket's promo ACs depend on currently `return new Map<>()`. File a foundational ticket to rebuild against `Promotion_Item__c` / `Promotion_Item_Type__c` / `Item_Type_Territory_Exclusion__c`, or fold that scope into 3925 explicitly.
3. **Object naming wrong.** ACs reference `Product__c` and `Order__c`. The codebase uses `Item__c` and `Invoice__c`. Update the ACs.
4. **Scope overlap with 3924/4053/4054 + 3927.** Decide who owns the tile (rendering) vs. who owns the catalog (orchestration). The cards tickets are tagged as "decomposed-from-BMS-3924"; 3925 currently re-states some of the same tile-level ACs.
5. **BMS-3930 dependency mismatch.** Same dependency-ordering issue as BMS-3923. Fix the link or clarify 3930.
6. **Low-stock threshold MDT doesn't exist.** Add `EcomLowStockThresholdCases` (or similar) to `Configuration_Preference__mdt`, or pick a different mechanism (per-warehouse on `Location__c`, per-item, etc.).

---

## Suggested Revisions

- Replace `Product__c` → `Item__c` throughout the description and ACs.
- Replace `Order__c` references → `Invoice__c`. Adjust the "previous order" wording where relevant.
- Add a "Current State" section linking to `ecomShop`, `getQuantityAvailableAtFulfillmentLocation`, and the four stubbed promo methods so refinement attendees see the reality.
- Add a regression AC for ecomShop's existing pagination + search + cart-add path.
- Either (a) split the promotion-rebuild into its own ticket and link it as a hard blocker, or (b) explicitly add the rebuild work to this ticket's scope (and re-estimate).
- Re-link or re-scope BMS-3930.
