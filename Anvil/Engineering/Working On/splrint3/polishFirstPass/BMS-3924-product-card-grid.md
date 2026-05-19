---
ticket: BMS-3924
title: "Retailer portal product card & grid components"
type: Story
parent_epic: "BMS-3702 — Gulf E-Commerce & Ordering"
blocked_by: "BMS-3930 — Retailer credit terms display & payment status (mismatch — see Polish Notes)"
relates_to: "BMS-4053 (Ph 1 Card), BMS-4054 (Ph 2 Grid + Reuse)"
status: "Backlog / Refinement Needed"
sprint: "Sprint 3 (2026-05-16 → 2026-05-29)"
repo_scanned: "/Users/alvarosanchez_1/Documents/OHFY-Ecom/force-app + /Users/alvarosanchez_1/OHFY-Split/OHFY-Data-Model"
polished_on: 2026-05-05
polished_by: Alvaro Sanchez
jira: https://ohanafy.atlassian.net/browse/BMS-3924
tags: [polish, ecom, gulf, card, grid, sprint3, decomposed]
---

# BMS-3924 — Jira-Ready

**Title:** Retailer portal product card & grid (umbrella) — superseded by BMS-4053 (Ph 1) + BMS-4054 (Ph 2)

**Description:**

Umbrella for the product card primitive and the responsive grid that hosts it. Decomposed into:

- **BMS-4053 — Ph 1: Card Component** (rendering, pricing, pack info, warehouse availability, add-to-cart)
- **BMS-4054 — Ph 2: Grid Layout + Reuse** (responsive layout, search-results reuse, reorder reuse)

This ticket should either be **closed in favor of 4053+4054**, or kept as the parent epic with no sprint commitment. The seven ACs originally on this ticket are split across the two children.

**Current State (2026-05-05, per codebase scan):**

- `lwc/ecomShop` already renders product tiles in a paginated grid with cart integration. There is no isolated `productCard` LWC today — tile markup is inline in `ecomShop.html`. **Extracting a reusable card LWC IS net-new structural work** (the tile rendering exists; the reusable component does not).
- Catalog object: `Item__c` (NOT `Product__c`). `Cart_Item__c.Product__c` is a *lookup field* pointing at `ohfy__Item__c`.
- Cart object: `Cart__c` + `Cart_Item__c` exist locally in OHFY-Ecom (`objects/Cart__c`, `objects/Cart_Item__c`). Cart-write path is being migrated to `DraftInvoiceController` via `EcomWrappers.cls`.
- No `Order__c` / `Order_Item__c` — renamed to `Invoice__c` / `Invoice_Item__c` during Develop-Split.
- Promotion lookups (badge driver) are currently **stubs**: `getItemIdToPromotionsMap` (`CartController.cls:968-975`), `getPromotionCriteriaQuantities` (`CartController.cls:630-637`), `getPromotionJunctions` (`CartController.cls:962-966`), `getTerritoryExclusions` (`CartController.cls:896-901`). All return empty pending Develop-Split rebuild.
- Warehouse availability is live: `CartController.getQuantityAvailableAtFulfillmentLocation` (`CartController.cls:642-680`).
- Reorder is per-item via `lwc/reorderModal`; no bulk "Reorder All" exists.
- No keyword highlighting in any LWC (grep confirms).

**Out of Scope (umbrella ticket; see children):**

- Implementation work — done in BMS-4053 and BMS-4054.

**Acceptance Criteria:**

> AC sets are defined on the children (BMS-4053 = card behavior; BMS-4054 = grid + reuse). The 7 ACs originally on this ticket should be removed here and confirmed inherited by the children.

**Recommendation:** Close this ticket as superseded, OR convert to an epic-style umbrella with no AC of its own and link 4053+4054 as children (not "relates to").

---

# BMS-3924 — Polish Notes

## Verdict at a Glance

**Decompose-and-close (or convert to epic).** This ticket has a `decomposed` label and "relates to" links to BMS-4053 and BMS-4054 — yet it still has its full 7-AC original payload AND its own Sprint 3 placement. That is a triple-count: BMS-3924, BMS-4053, BMS-4054 all share Sprint 3 and overlapping scope. Pick one shape.

| Area                                                              | Verdict                                                                                                |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Structural shape                                                  | **Contradicted by labels** — `decomposed` label + relates-to children, but ACs and sprint still active |
| Product card primitive exists today                               | **Contradicted** — tile markup is inline in ecomShop.html; no `lwc/productCard`                       |
| `Product__c`, `Order__c` references in ACs                        | **Contradicted** — `Item__c`, `Invoice__c` / `Cart_Item__c.Product__c` (lookup field name only)       |
| Warehouse availability mechanism                                  | **Confirmed** — CartController.cls:642-680                                                             |
| Promotional badge wiring                                          | **Contradicted today** — stub methods                                                                  |
| "Generic product data object" / "slot into any parent container"  | Reasonable design; net-new                                                                             |
| Reorder context (AC #7)                                           | Partial — `lwc/reorderModal` exists; no Reorder-All button                                             |
| Search-result reuse (AC #6)                                       | Partial — search lives in ecomShop today; no separate results LWC                                      |
| Keyword highlighting in search results                            | **Contradicted** — no highlighting code anywhere                                                       |
| Dependency BMS-3930                                               | **Mismatched title** — same issue as BMS-3925 / 3927 / 3923                                            |

---

## Phase 2 — Business Requirements & ACs

### Structural check

- ✅ Clear purpose
- 🟥 **Wrong shape.** `decomposed` label + child links, but ACs duplicated on parent. Either close this and run with 4053+4054, or convert to an epic.
- 🟨 If kept open, sprint placement triple-counts work with the children.

### AC validation (7 scenarios on the ticket)

| AC | Belongs to | Verdict |
|---|---|---|
| 1 — Product card with account-specific pricing | 4053 | Partial (PRC resolver path TBD) |
| 2 — Pack configuration & brand hierarchy display | 4053 | Confirmed (`Item__c.Units_Per_Case__c`, `UOM__c`, `Item_Type__c`) |
| 3 — Grid responsive at 1440 / 768 / 375 | 4054 | Confirmed (testable) |
| 4 — Warehouse availability indicator | 4053 | Partial (live availability + needs threshold MDT) |
| 5 — Add-to-cart inline quantity selector | 4053 | Partial (cart write path is mid-migration) |
| 6 — Card reuse in search results | 4054 | Partial (no separate results LWC; reuse depends on extraction) |
| 7 — Card reuse in reorder; "Reorder All" button | 4054 | **Incomplete** — no Reorder-All exists; per-item reorder via reorderModal |

### Gaps to plug

- **Missing AC** (umbrella-level, if kept): regression on existing ecomShop pagination + filter + cart paths must keep working post-extraction.
- **Missing AC**: handoff — the extracted `lwc/productCard` is consumed identically by ecomShop, search-results, reorder.

---

## Phase 3 — Technical Approach

### Auto-gen ticket says

> "Build the product card as a reusable LWC (productCard) with a companion grid wrapper LWC (productGrid) that handles layout, pagination, and context-awareness (catalog vs. search vs. reorder). Pricing resolution should call an Apex controller that queries Price_Record__c using the retailer's account pricing code and applies the waterfall logic server-side, returning a resolved price DTO to the card. Inventory status is fetched from Inventory__c filtered by the account's assigned Warehouse__c."

### Claim-by-claim validation

**Claim 1: "Build a reusable LWC `productCard`"**
- **Code shows:** No `lwc/productCard` exists. Tile markup lives in `ecomShop.html`. Extraction is real net-new structural work.
- **Assessment:** Confirmed-as-net-new.

**Claim 2: "Companion grid wrapper LWC `productGrid` that handles layout + pagination + context-awareness"**
- **Code shows:** ecomShop already does paginated grid layout (`ecomShop.js:38-55, 71-100`). A separate `productGrid` is *one option*; the other is "ecomShop becomes the grid wrapper, productCard is the leaf."
- **Assessment:** Decision needed — fork into productGrid or keep ecomShop as the wrapper. Affects how 4054 ships.

**Claim 3: "Apex controller that queries `Price_Record__c` using pricing code"**
- **Code shows:** No `Price_Record__c` object found. Pricing data lives in `Pricelist__c` / `Pricelist_Item__c` / `Pricelist_Account__c` / `Tier_Setting__c` (OHFY-Data-Model). The waterfall resolver class is not in OHFY-Ecom — believed to live upstream.
- **Assessment:** **Contradicted.** Object name is wrong; resolver location should be confirmed.

**Claim 4: "Returning a resolved price DTO to the card"**
- **Code shows:** No `PriceDTO` / `ResolvedPriceDTO` in OHFY-Ecom or visible OHFY-Data-Model.
- **Assessment:** Net-new (DTO design TBD; should follow the global DTO pattern per CLAUDE.md ADR-0007 if it crosses package boundaries).

**Claim 5: "Inventory status filtered by `Warehouse__c`"**
- **Code shows:** Account's servicing warehouse is `Account.Fulfillment_Location__c` → `Location__c`. There is a denormalized `Warehouse__c` text field on `Inventory__c`, but the standard relationship is `Inventory__c.Location__c`.
- **Assessment:** Partially correct — the *concept* is right, but the field is `Location__c` (lookup), and the live API is `getQuantityAvailableAtFulfillmentLocation`.

**Claim 6: "Generic product data object so card can be slotted into any parent container"**
- **Code shows:** Net-new design; current tile uses inline data from ecomShop's items[] array.
- **Assessment:** Confirmed-as-net-new — sensible pattern; document the data shape in 4053.

### Scorecard

| # | Claim | Verdict |
|---|---|---|
| 1 | Reusable productCard LWC | Confirmed net-new |
| 2 | productGrid wrapper | Decision needed (productGrid vs. extend ecomShop) |
| 3 | `Price_Record__c` resolver | Contradicted (object name; resolver location) |
| 4 | Resolved-price DTO | Net-new |
| 5 | Warehouse filter | Partially correct (field is Location__c) |
| 6 | Generic product data object | Confirmed-as-net-new |

---

## Phase 4 — Dependencies

| Link | Check | Result |
|---|---|---|
| Blocked-by **BMS-3930** | Same as siblings — title doesn't match | **Mismatch** |
| Relates **BMS-4053** (Ph 1 Card) | Should be parent/child, not sibling | Convert to "is parent of" (or close 3924) |
| Relates **BMS-4054** (Ph 2 Grid+Reuse) | Same | Same |
| Sibling **BMS-3925** (catalog) | Scope overlap on tile rendering | Decide: tile lives in 4053; 3925 reuses |
| Sibling **BMS-3927** (search & filter) | Scope overlap on search-results card reuse | Same — 4054 owns the reuse |
| Implicit dep: **promotion rebuild** | Required for promo badge | File a ticket |

---

## Top Issues (ranked)

1. **Decompose-and-close.** The labels say it's decomposed, the children exist, but the parent still owns ACs and sprint. Pick: close-as-superseded, or convert to an epic with no AC.
2. **Wrong object names.** `Product__c`, `Order__c`, `Price_Record__c`, `Warehouse__c` — none of these are the right model. Update or remove this ticket's ACs.
3. **Promotion methods stubbed.** Same blocker as siblings.
4. **Promotion-rebuild ticket missing.** File it as the foundational dependency.
5. **BMS-3930 dependency mismatch.** Same as everywhere else.

---

## Suggested Revisions

- **Recommended:** Close BMS-3924 as superseded by BMS-4053 + BMS-4054 (or transition to epic-shape with no AC).
- If kept open: replace ACs with a single "umbrella + integration" AC such as: "When BMS-4053 (Card) and BMS-4054 (Grid + Reuse) ship, ecomShop, search, and reorder all render via the extracted `lwc/productCard` and the existing pagination/cart/pubsub flows pass regression."
- Re-link BMS-4053 / BMS-4054 as children (parent/child), not "relates to."
- Re-link or clarify BMS-3930.
