---
ticket: BMS-3927
title: "Product search & filtering (category, brand, pack size)"
type: Story
parent_epic: "BMS-3702 — Gulf E-Commerce & Ordering"
blocked_by: "BMS-3930 — Retailer credit terms display & payment status (mismatch — see Polish Notes)"
status: "Backlog / Refinement Needed"
sprint: "Sprint 3 (2026-05-16 → 2026-05-29)"
repo_scanned: "/Users/alvarosanchez_1/Documents/OHFY-Ecom/force-app + /Users/alvarosanchez_1/OHFY-Split/OHFY-Data-Model"
polished_on: 2026-05-05
polished_by: Alvaro Sanchez
jira: https://ohanafy.atlassian.net/browse/BMS-3927
tags: [polish, ecom, gulf, search, sprint3]
---

# BMS-3927 — Jira-Ready

**Title:** Retailer Catalog — keyword search + faceted filtering (category, brand, pack size)

**Description:**

As a Gulf retailer buyer with hundreds of SKUs to sift through, I want fast keyword search plus stackable facet filters (category, brand, pack size) so I can locate the right SKU in a few clicks instead of scrolling the full catalog.

**Current State (2026-05-05, per codebase scan):**

- `lwc/ecomShop` already has a search field and filter state for brand, product-type, family, UOM (`ecomShop.js:71-100`). Search is **client-side filtering on the in-memory `items` array** — there is no SOSL or `@AuraEnabled` search call for the catalog page (grep confirms no SOSL in OHFY-Ecom).
- `navigationMenu` has a header search input and a search-results template. Behavior appears to surface to ecomShop via routing/pubsub — no dedicated `ecomSearchResults` LWC exists.
- Brands list source: `CartController.getBrands(List<Pricelist_Item__c>)` returning `Item_Type__c` rows with `Item_Line__r.Supplier__c` (`CartController.cls:903-921`, live).
- Catalog object: **`Item__c`** (not `Product__c`). `Item__c.Category__c` is a *formula* rolling up from `Item_Type__r.Category__c` — there is **no separate `Product_Category__c` object**. Subtype is `Item__c.Item_Type_Subtype__c` (renamed during Develop-Split from `Stock_UOM_Sub_Type__c` / `Sub_Type__c`).
- Pack-size representation: `Item__c.Units_Per_Case__c`, `Cases_Per_Pack__c`, `UOM__c` — no single "pack size" string field; pack-size facet must be derived (or a new formula field added).
- Promotional-surfacing inside results: gated on the same stubbed methods that block BMS-3925 (`getItemIdToPromotionsMap`, `getPromotionCriteriaQuantities`, `getPromotionJunctions`, `getTerritoryExclusions` — all return empty pending Develop-Split rebuild against `Promotion_Item__c` / `Promotion_Item_Type__c` / `Item_Type_Territory_Exclusion__c`).
- "Featured / Promoted" badge requires the promo map (currently empty). Promotion__c has no `Is_Featured__c` flag.

**Out of Scope:**

- Server-side fuzzy / full-text search (SOSL or external) — split if confirmed needed (today's client-side filter ≈ substring match against in-memory items; "fuzzy" is a stretch goal not currently supported anywhere).
- Promotion-model rebuild (shared dependency with BMS-3925 / 3924 / 4053 / 4054 — file as its own ticket).
- New "Pack_Size__c" formula on `Item__c` if introduced — handle as its own metadata ticket if Gulf wants a normalized facet.

**Acceptance Criteria:**

```gherkin
Scenario: Keyword search filters the loaded catalog with retailer's resolved pricing
  Given a portal-logged-in retailer with Account.Fulfillment_Location__c = 'Montgomery AL'
  And   the retailer's pricelist resolves to pricing code 'VD-112'
  And   ecomShop has loaded items stocked at Montgomery AL
  When  the buyer types 'Michelob Ultra' into the catalog search bar
  Then  results display only Item__c records whose Name (or Brand or UPC) matches 'Michelob Ultra'
  And   each result tile shows: Name, Item_Type__c (brand), Units_Per_Case__c × UOM__c, image (or fallback), and the VD-112 unit price
  And   items with Quantity_Available__c = 0 at Montgomery AL show 'Out of Stock' or are excluded per chosen UX
  And   the search returns within 1s for the loaded catalog (≤200 items in memory) — note: client-side filter, not server roundtrip

Scenario: Stackable facet filters narrow the result set
  Given the buyer is viewing the full catalog
  When  the buyer selects Category 'Beer', then Brand 'Budweiser', then Pack '24'
  Then  the grid displays Item__c records where Category__c='Beer' AND Item_Type__c.Name='Budweiser' AND Cases_Per_Pack__c (or derived pack facet) matches '24'
  And   active filter chips for 'Beer', 'Budweiser', '24' appear above the grid with X to clear each
  And   the result count updates dynamically (e.g., 'Showing 4 items')
  And   removing the '24' chip expands results to all Budweiser Beer pack sizes without a full page reload (re-filter the existing items list)

Scenario: Promoted items are surfaced inside category browse
  Given Promotion__c records flag certain Item__c rows via Promotion_Item__c or Promotion_Item_Type__c for the current date range
  And   the retailer is eligible (Promotion__c.Customer__c, .Territory__c, or chain-level match)
  When  the buyer browses the 'Beer' category with default sort
  Then  promoted items render with a 'Promotion' badge
  And   they appear at the top of the category listing under default sort
  And   the promotional unit price (if different from the buyer's pricelist price) is shown with the original struck-through

Scenario: Filter facets reflect only items stocked at the retailer's warehouse
  Given a retailer serviced from Milton FL whose stocked catalog covers 80 of Gulf's 200 SKUs
  When  the buyer opens the Brand facet
  Then  only Item_Type__c records with at least one Item__c stocked at Milton FL appear as options
  And   each option shows the count in parentheses (e.g., 'Corona (5)')
  And   brands stocked exclusively elsewhere (e.g., McCalla AL) are not shown

Scenario: Empty state for no-match filter combination
  Given Category 'Wine', Brand 'Barefoot', Pack '6' filters are active
  And   no items in the retailer's warehouse match all three
  When  the grid renders
  Then  it shows 'No products found for your current filters'
  And   a suggestion appears: 'Try removing a filter or searching by keyword'
  And   active filter chips remain visible so the buyer can modify without resetting

Scenario: Partial / abbreviated keyword input still returns matches
  Given the buyer types 'bud lt 12' into the search
  When  results render
  Then  Bud Light 12-pack variants appear (substring match on Item__c.Name + Item_Type__c.Name + UPC across loaded items)
  And   results are ordered by relevance: exact brand match first, then partial pack-size match
  And   no error is thrown for whitespace-separated partial terms
  Note: This is client-side substring matching, not true fuzzy matching. If "fuzzy" is required (typo tolerance, stemming), this is net-new scope.

Scenario: Regression — ecomShop pagination, cart-add, and pubsub keep working
  Given the catalog is loaded and search/filters are applied
  When  the buyer paginates, edits filters, or adds to cart
  Then  pageList recomputes correctly (ecomShop.js:38-55)
  And   cart-add flows through draftInvoiceService → DraftInvoiceController via EcomWrappers.cls
  And   no LWC throws on missing fields after Develop-Split renames
```

**Technical Approach:**

1. **Confirm "client-side substring filter" is acceptable.** Today's ecomShop already does this on `items[]`. If Gulf wants typo-tolerant fuzzy matching, that's a different project (SOSL with metaphone, an external search service, or a fuzzy JS lib). Add a clear scope decision.
2. **Filter chips + counts.** ecomShop has filter state but no first-class chip/badge UI today. Build chips into the filter sidebar/topbar with X-to-remove and dynamic counts.
3. **Pack-size facet.** Decide between (a) deriving from `Cases_Per_Pack__c`+`UOM__c` at render time, (b) adding a formula `Pack_Size__c` on `Item__c` for stable grouping. (b) is cleaner but is a metadata change; coordinate with BMS-3924 owners since they want pack-size on the card.
4. **Brand facet shows warehouse-only counts.** Augment `getBrands` (CartController:903-921) — currently takes `List<Pricelist_Item__c>` and returns Item_Type rows; needs intersection with stocked items at the retailer's warehouse.
5. **Promo surfacing inside results.** Gated on the same shared promotion-rebuild dep as BMS-3925 — flag as cross-cutting.
6. **Search index strategy.** If Gulf insists on sub-2-second perceived latency for huge catalogs, page-load streaming + chunked filtering may matter; today's pattern loads everything up front then filters.

**Open Questions (carry to refinement):**

- Pure client-side substring search OK, or do we need server-side / fuzzy?
- Which `Item__c` fields participate in the search index? Name, brand (Item_Type__r.Name), UPC, supplier? (today's behavior is unclear — please confirm grep of ecomShop's filter logic).
- Pack-size facet: derive at render or add a formula field?
- Same BMS-3930 dependency mismatch as BMS-3925 / 3923 — the title doesn't read like a search-page blocker.
- Should "Promoted" badge live on top of "Featured" — are they the same concept or two different campaigns?

**Estimate:** ~2–3 days **excluding** the promotion-model rebuild and **assuming** client-side substring search is acceptable. If fuzzy/server-side or pack-size formula are confirmed in scope, +1–2 days.

---

# BMS-3927 — Polish Notes

## Verdict at a Glance

**Refinement needed.** Most of the search/filter machinery already exists in `ecomShop` — this is incremental UX (chips, counts, brand-stock intersection) plus shared dependency on the promo rebuild. Auto-gen "no existing pattern found + dynamic SOQL backed by SOSL fuzzy" is wrong on both counts: today is client-side substring, and there's no SOSL anywhere in OHFY-Ecom.

| Area                                                              | Verdict                                                                                  |
| ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Story statement (search + facets to reduce scroll)                | Confirmed                                                                                |
| Auto-gen claim: "Net new development - no existing pattern"       | **Contradicted** — ecomShop has filters + search input; navigationMenu has search input  |
| Auto-gen claim: "SOSL fuzzy search"                               | **Contradicted** — no SOSL in OHFY-Ecom; current path is client-side substring filter    |
| `Product__c` references in ACs                                    | **Contradicted** — catalog is `Item__c`                                                  |
| `Product_Category__c` references                                  | **Contradicted** — Category is a formula on Item__c rolling up from Item_Type__c         |
| `getBrands` for brand list                                        | **Confirmed live** (CartController.cls:903-921)                                          |
| Promoted badge in search results                                  | **Contradicted today** — depends on stubbed promo map                                    |
| 2-second SLA                                                      | Unverifiable until search architecture is decided                                        |
| Dependency BMS-3930                                               | **Mismatched title** — same issue as BMS-3925 / 3923                                     |

---

## Phase 2 — Business Requirements & ACs

### Structural check

- ✅ Clear purpose
- ✅ Story type
- 🟨 Sprint placement vs. dependency on promotion rebuild — same risk as 3925
- 🟨 Scope overlap with **BMS-3925** — 3925 covers warehouse + category nav with empty-state; 3927 is keyword + brand+pack faceting + chips. Define the seam explicitly.

### AC validation (6 scenarios on the ticket)

| AC | Verdict | Notes |
|---|---|---|
| 1 — Keyword search returns relevant items in 2s | Partial | Search input exists; client-side substring filter; "2 seconds" is unverifiable until the index source is decided |
| 2 — Stackable category/brand/pack-size with chips | Partial | Filter state exists; chip UI is net-new; pack-size facet needs derivation OR a new formula field |
| 3 — Promoted items badge inside category | **Contradicted today** | Depends on `getItemIdToPromotionsMap` (stubbed) |
| 4 — Brand facet reflects only retailer-warehouse-stocked items with counts | Partial | `getBrands` exists but doesn't intersect with warehouse stock; needs augment |
| 5 — Empty-state for no-match filters | Confirmed (testable) | UI work in ecomShop |
| 6 — Partial / abbreviated input "fuzzy" matching | **Unverifiable / probably contradicted** | No SOSL; "bud lt 12" → Bud Light 12-pack requires explicit token-split + ranking that doesn't exist today |

### Gaps to plug

- **Missing AC**: regression — confirm pagination + cart-add + pubsub continue working in ecomShop after the search-UX refactor.
- **Missing AC**: define which Item__c fields are searchable (Name only? + Item_Type__r.Name? + UPC? + Supplier?). AC 1 assumes Name-and-brand match.
- **Missing AC**: empty-state for keyword search with zero results (only have empty-state for filter combo).
- **Missing AC**: pack-size facet semantics — is "12-pack" matched on `Cases_Per_Pack__c`, or `Units_Per_Case__c`, or a formula? Different SKUs use different pack conventions.

---

## Phase 3 — Technical Approach

### Auto-gen ticket says

> "Build as an LWC product browse component backed by an Apex controller that queries Product__c with dynamic SOQL filtered by warehouse and pricing code. Implement faceted filters using aggregate SOQL queries scoped to warehouse inventory. Keyword search via SOSL with fuzzy matching."

### Claim-by-claim validation

**Claim 1: "LWC product browse component backed by Apex controller"**
- **Code shows:** `lwc/ecomShop` is the browse component; backing controller is `CartController` + `draftInvoiceService` route, not a dedicated catalog controller.
- **Assessment:** **Partial.** Browse component exists; the description implies a fresh controller. Reuse `ecomShop` + add facet/search logic (and possibly an `@AuraEnabled` brand-with-warehouse-counts method).

**Claim 2: "queries Product__c"**
- **Code shows:** No `Product__c` object exists. Catalog is `Item__c` (OHFY-Data-Model).
- **Assessment:** **Contradicted.** Update to `Item__c`.

**Claim 3: "filtered by warehouse and pricing code"**
- **Code shows:** Warehouse filter via `getQuantityAvailableAtFulfillmentLocation` (live). Pricing-code resolution lives upstream (Pricelist__c + Tier_Setting__c data; resolver class not in OHFY-Ecom).
- **Assessment:** **Partial.** Warehouse confirmed; pricing-code path needs the resolver entry point identified.

**Claim 4: "Faceted filters using aggregate SOQL queries scoped to warehouse inventory"**
- **Code shows:** `getBrands` returns Item_Type rows from a passed-in pricelist-item list; no AggregateResult / GROUP BY query for facet counts visible.
- **Assessment:** **Partial.** Building counts is straightforward (GROUP BY on Inventory__c filtered by Location__c) — net-new but small.

**Claim 5: "Keyword search via SOSL with fuzzy matching"**
- **Code shows:** No SOSL anywhere in OHFY-Ecom classes or LWCs (full grep). Current ecomShop uses `searchTerm` for client-side filtering.
- **Assessment:** **Contradicted.** Either keep client-side substring (cheap, fits today's catalog volume) or build SOSL (net-new). Decide explicitly — don't ship "we'll use SOSL" as the plan without confirming need.

**Claim 6: "Cache filter option counts client-side"**
- **Code shows:** ecomShop tracks filter state; counts aren't cached today because facets aren't built yet.
- **Assessment:** **Incomplete.** Becomes relevant after AC4 lands.

**Claim 7: "Promotional flagging driven by a junction object or field on Product__c"**
- **Code shows:** Junction is `Promotion_Item__c` / `Promotion_Item_Type__c` (not on `Product__c`, which doesn't exist). All four lookup methods are stubbed.
- **Assessment:** **Contradicted today** (and partially correct in concept).

### Scorecard

| # | Claim | Verdict |
|---|---|---|
| 1 | Browse LWC + backing controller | Partial (ecomShop exists, controller is shared) |
| 2 | `Product__c` queries | Contradicted (object is Item__c) |
| 3 | Warehouse + pricing-code filter | Partial (warehouse ✅, pricing path TBD) |
| 4 | Aggregate SOQL facet counts | Partial (net-new but small) |
| 5 | SOSL fuzzy search | Contradicted (no SOSL today; need scope decision) |
| 6 | Client-side cached facet counts | Incomplete |
| 7 | Promotional junction flagging | Contradicted today (junctions exist; lookup methods stubbed) |

---

## Phase 4 — Dependencies

| Link | Check | Result |
|---|---|---|
| Blocked-by **BMS-3930** | Same as 3925 / 3923 — title is credit-terms; not a structural search blocker | **Mismatch** |
| Sibling **BMS-3925** (catalog & availability) | Scope overlap on warehouse-filtered list | Yes — agree the boundary |
| Sibling **BMS-3924 / 4053 / 4054** (cards) | Scope overlap — search results render as cards | Reuse the same card; don't fork |
| Implicit dep: **promotion rebuild** | Required for promo badge AC | **Not a ticket today.** File one. |

---

## Top Issues (ranked)

1. **"SOSL fuzzy" claim isn't grounded.** Today's path is client-side substring filtering on `items[]`. Decide explicitly: keep substring (cheap), or invest in SOSL/external (project-sized).
2. **Promotion methods stubbed.** Same as BMS-3925 — promoted badge AC depends on a promo lookup that returns empty until rebuild.
3. **Object naming wrong.** ACs reference `Product__c` and `Product_Category__c`; neither exists.
4. **Pack-size facet is ambiguous.** No single field; either derive at render time (cheap, fragile) or add a formula on Item__c (clean, requires metadata).
5. **2-second SLA is unverifiable** until the search source is decided.
6. **BMS-3930 dependency mismatch.** Same fix as elsewhere.
7. **Scope overlap with BMS-3925.** Agree the seam in refinement.

---

## Suggested Revisions

- Update ACs to use `Item__c`, `Item_Type__c`, `Item_Type_Subtype__c`, `Cases_Per_Pack__c`, `UOM__c`. Drop `Product__c` and `Product_Category__c`.
- Replace the SOSL/fuzzy framing with an explicit scope decision: "Search = client-side substring across `Item__c.Name` + `Item_Type__c.Name` + `Item__c.Retailer_UPC__c` over loaded items. Fuzzy matching is out of scope."
- Add a regression AC for ecomShop's existing pagination + cart-add path.
- Add a "promo-surfacing" AC that explicitly notes the promotion-rebuild dependency.
- Add an AC for keyword empty-state (separate from filter-combo empty-state).
- Re-link or clarify BMS-3930.
