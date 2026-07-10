---
ticket: BMS-4054
title: "Retailer Portal Product Card — Ph 2: Grid Layout + Reuse"
type: Story
parent_epic: "BMS-3702 — Gulf E-Commerce & Ordering"
parent_decomposed_from: "BMS-3924"
depends_on: "BMS-4053 — Ph 1: Card Component"
status: "Backlog / Refinement Needed"
sprint: "Sprint 3 (2026-05-16 → 2026-05-29)"
repo_scanned: "/Users/alvarosanchez_1/Documents/OHFY-Ecom/force-app + /Users/alvarosanchez_1/OHFY-Split/OHFY-Data-Model"
polished_on: 2026-05-05
polished_by: Alvaro Sanchez
jira: https://ohanafy.atlassian.net/browse/BMS-4054
tags: [polish, ecom, gulf, grid, reuse, sprint3]
---

# BMS-4054 — Jira-Ready

**Title:** Product card — responsive grid + reuse in search results & reorder

**Description:**

After BMS-4053 extracts `lwc/productCard`, host it in a responsive grid that adapts at desktop / tablet / mobile breakpoints, and reuse the same card across catalog, search results, and reorder contexts so the experience is consistent regardless of how a retailer reaches a product.

**Current State (2026-05-05, per codebase scan):**

- ecomShop today already implements paginated grid layout with internal page slicing (`ecomShop.js:38-55, 71-100`). Tailwind responsive classes are loaded via `tailwindcss` static resource (`ecomShop.js:8`).
- **No dedicated `ecomSearchResults` LWC.** `navigationMenu` has a search input and search-results template (`navigationMenu/navigationMenu.js`); behavior routes search to ecomShop or renders inline. Reuse path is "search results render in ecomShop" not "search results have their own host."
- **No bulk Reorder-All button.** `lwc/reorderModal` displays per-item quantity adjustments and per-item reorder via `getQuantityAvailableAtFulfillmentLocation`. `lwc/ecomOrderHistory` shows order history; reorder is modal-driven and per-item.
- **No keyword highlighting** in any LWC (full grep). AC #2's "search-matched terms are highlighted within the product name on the card" is net-new behavior.
- "No longer available" overlay for discontinued/out-of-stock items in reorder is net-new — `Item__c.Is_Active__c` (renamed from `Active__c`) provides the flag; "suggested alternative" surface doesn't exist today.
- Catalog object: `Item__c`. Order history uses `Invoice__c` (NOT `Order__c`, which has been removed).
- Reorder reads from `Invoice__c` lines now (per Develop-Split — `Order__c` and `Order_Item__c` are gone). `OrderHistoryController` is currently a full stub pending migration to `Placement__c` / `Invoice__c` lines.

**Out of Scope:**

- Card behavior itself — owned by **BMS-4053 Ph 1** (this ticket assumes it ships first).
- Promotion-model rebuild — shared dependency.
- `OrderHistoryController` stub rebuild — file as its own ticket if reorder is actually in scope here (right now it's stubbed, so the reorder AC depends on rebuilding it).
- True full-text/fuzzy search (out of scope of grid; relevant to BMS-3927).

**Acceptance Criteria:**

```gherkin
Scenario: Grid responsive at desktop / tablet / mobile breakpoints
  Given the catalog grid hosts the productCard LWC from BMS-4053
  When  the retailer accesses the portal at 1440px (desktop), 768px (tablet), 375px (mobile)
  Then  desktop renders 4 cards/row with image, product details, price, Add-to-Cart all visible
  And   tablet renders 2-3 cards/row with no horizontal scroll
  And   mobile renders 1-2 cards/row in a compact layout where pack size and price stay visible
  And   no card content is truncated or overlapping at any breakpoint
  And   ecomShop pagination keeps working

Scenario: Card reused in search results context
  Given the retailer types 'Mountain Dew 24pk' into the navigationMenu search bar
  When  search results render
  Then  the SAME productCard component renders in the results grid
  And   the layout, pricing resolution, and availability indicators match the catalog view
  And   matched terms are visually highlighted on the card name (or product description) — note: keyword highlighting is net-new
  And   if no results, a zero-state reads 'No products found for "Mountain Dew 24pk" — try a different search or browse the catalog'

Scenario: Card reused in reorder history context
  Given a retailer navigates to 'Reorder' and has previous Invoice__c records with line items
  And   OrderHistoryController has been rebuilt against the post-Develop-Split schema (currently a stub)
  When  the reorder grid renders
  Then  each previously ordered item renders using the SAME productCard with CURRENT pricing (not historical Invoice_Item__c price)
  And   if a previously ordered Item__c is now Is_Active__c = FALSE OR has Quantity_Available__c = 0
  Then  the card shows a 'No longer available' overlay
  And   if a "suggested alternative" Item__c is provided (mechanism TBD), it appears below the overlay
  And   a 'Reorder All' button above the grid adds all available items to the cart in one action via cartService → draftInvoiceService → EcomWrappers
  And   the cart icon updates without a full page reload

Scenario: Regression — ecomShop pagination, filters, cart-add, pubsub keep working
  Given the grid hosts the extracted productCard
  When  a retailer paginates, edits filters, types in search, or clicks Add-to-Cart
  Then  pageList recomputes correctly (ecomShop.js:38-55)
  And   draftInvoiceService cart writes succeed via EcomWrappers
  And   userDataService / message-channel pubsub continue to deliver

Scenario: Card data-input contract is documented
  Given productCard accepts an `@api item` object
  When  any host (ecomShop, search-results host, reorder host) passes the item shape per BMS-4053 spec
  Then  the card renders identically across hosts
  And   missing optional fields render the documented fallback (image fallback, hidden promo badge, etc.)
```

**Technical Approach:**

1. **Grid hosting strategy.** Two options:
    - (A) `ecomShop` IS the grid wrapper. Search and reorder become alternate "modes" of ecomShop (or sibling thin wrappers).
    - (B) Build a separate `productGrid` LWC that ecomShop, search, and reorder all use.
    Recommend (A) — less duplication. Extract layout-only utilities if needed.
2. **Search-results reuse.** Decide if navigationMenu search renders a popover/dropdown OR routes to ecomShop with `?searchTerm=...` (or pubsub). Keyword highlighting is net-new — pick a small library or roll a `<mark>`-based tokenizer.
3. **Reorder reuse.** Two-step:
    - First: get the `OrderHistoryController` stub rebuilt against `Invoice__c` lines (and possibly `Placement__c`). This is **a prerequisite ticket**, not part of this story.
    - Then: render reorder grid with productCard + 'Reorder All' button calling `EcomWrappers.onInvoiceItemChange` per item.
4. **"No longer available" overlay.** Use `Item__c.Is_Active__c` and Inventory__c availability tier. "Suggested alternative" needs Gulf to define the matching rule (same Item_Type__c? same Item_Line__c? merchandiser-curated?).
5. **Reorder All UX.** Confirm modal: "Add 8 items to cart? Out-of-stock items will be skipped: …". Single batched call to draftInvoiceService.
6. **Tests.** Jest + Playwright (per CLAUDE.md `Pre-PR Checks`) — search-context Jest, reorder-context Jest, responsive snapshots at three viewports.

**Open Questions (carry to refinement):**

- Reorder context AC depends on the stubbed `OrderHistoryController` being rebuilt. Confirm whether that rebuild is in scope here, a prerequisite ticket, or out of scope for Sprint 3.
- "Suggested alternative" — what's the matching rule, and does Gulf actually need it Sprint 3?
- Search results — popover from navigationMenu, dedicated results page, or route-to-ecomShop?
- Keyword highlighting library — bring in a small dep (e.g., `match-sorter`), or roll a 20-line tokenizer?
- "Reorder All" — full-replace cart, or merge into existing cart?
- Tablet form factor (sales reps in field) — does it ship with this ticket, or does a different breakpoint matrix apply?

**Estimate:** ~3–4 days **assuming** BMS-4053 ships first AND the OrderHistoryController rebuild is either out of scope or a separate ticket. Adding the OrderHistoryController rebuild = +2–3 days.

---

# BMS-4054 — Polish Notes

## Verdict at a Glance

**Refinement needed.** Concept is sensible — host the Ph 1 card in three contexts. Real risks: (a) reorder context AC currently depends on a fully-stubbed `OrderHistoryController`, (b) "search results reuse" implies a host that doesn't exist yet (no `ecomSearchResults`), (c) keyword highlighting and Reorder-All are both net-new, (d) wrong object names in original framing.

| Area                                                              | Verdict                                                                                                |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Story statement (responsive grid + reuse across 3 contexts)       | Confirmed                                                                                              |
| Responsive grid in ecomShop                                       | **Confirmed** — Tailwind + paginated layout exists today                                               |
| Search-results host                                               | **Contradicted** — no dedicated component; navigationMenu search routes through ecomShop              |
| Keyword highlighting                                              | **Contradicted** — no highlighting code in any LWC                                                     |
| Reorder context with productCard                                  | Partial — `lwc/reorderModal` exists; per-item reorder; no Reorder-All; OrderHistoryController stubbed  |
| 'No longer available' overlay                                     | Net-new — Is_Active__c + availability tier are the building blocks                                     |
| 'Suggested alternative' surface                                   | **Net-new** — no mechanism exists today                                                                |
| `Order__c` references in original framing                         | **Contradicted** — Order__c is gone; use Invoice__c                                                    |
| `OrderHistoryController` available for reorder                    | **Contradicted** — full stub                                                                           |

---

## Phase 2 — Business Requirements & ACs

### Structural check

- ✅ Clear purpose
- ✅ Story type
- 🟨 Sprint placement vs. Ph 1 (BMS-4053) and the OrderHistoryController stub — Sprint 3 only fits if OrderHistoryController rebuild is out of scope OR a separate prereq ticket lands first.

### AC validation (3 scenarios on the ticket)

| AC | Verdict | Notes |
|---|---|---|
| 1 — Grid responsive at desktop/tablet/mobile | Confirmed (testable) | Tailwind + ecomShop layout already in place |
| 2 — Card reuse in search results + keyword highlighting | Partial / Contradicted | No search-results host; highlighting is net-new |
| 3 — Card reuse in reorder + Reorder-All + "no longer available" | **Contradicted today** | OrderHistoryController is full stub; Reorder-All doesn't exist; suggested-alt is net-new |

### Gaps to plug

- **Missing AC**: regression — pagination + filter + cart-add + pubsub continue to work.
- **Missing AC**: card data-input contract documented (handoff from BMS-4053).
- **Missing AC**: prerequisite — `OrderHistoryController` must be rebuilt before the reorder AC can pass.
- **Missing AC**: Reorder-All confirmation modal copy (full-replace? merge? skip out-of-stock?).
- **Missing AC**: tablet/mobile cart-icon visibility & qty badge behavior at small viewports.

---

## Phase 3 — Technical Approach

### Auto-gen ticket says

> "Architecture Layer: UI/Experience (L3). Relevant SObjects: Product__c, Product_Category__c, Cart__c, Cart_Item__c, Invoice__c (draft for ecom orders), Account, Contact. Key Repos: OHFY-Core (product catalog), Ozone (Experience Cloud components, 331 objects). Integration Points: Experience Cloud, Pricing engine, Inventory system. Technical Considerations: Responsive design, Delivery cutoff, Case minimum validation."

### Claim-by-claim validation

**Claim 1: SObjects = `Product__c`, `Product_Category__c`**
- **Code shows:** Neither exists.
- **Assessment:** **Contradicted.**

**Claim 2: SObjects = `Cart__c`, `Cart_Item__c`, `Invoice__c`**
- **Code shows:** All exist.
- **Assessment:** **Confirmed.**

**Claim 3: Repos OHFY-Core / Ozone**
- **Code shows:** Repos are OHFY-Data-Model + OHFY-Ecom + OHFY-Split mono-repo packages.
- **Assessment:** **Contradicted.**

**Claim 4: "Responsive design (tablet/mobile form factors)"**
- **Code shows:** Tailwind static resource loaded; responsive classes available; ecomShop already responsive-ish.
- **Assessment:** **Confirmed.**

**Claim 5: "Delivery cutoff time enforcement"**
- **Code shows:** `Location__c.Warehouse_Cutoff_Time__c` is the new Time field; `AbandonedCartReminderScheduler` uses it. UI surface for cutoff in the grid context isn't built today.
- **Assessment:** **Out of scope for Ph 2** unless explicitly added.

**Claim 6: "Case minimum validation at order submission"**
- **Code shows:** Account-scoped `getMinimumCaseQuantity`. No per-SKU.
- **Assessment:** Belongs to Ph 1 (BMS-4053), not Ph 2.

**Claim 7: "Card reuse in search results"**
- **Code shows:** No standalone `ecomSearchResults`; navigationMenu search appears to route to ecomShop or render inline.
- **Assessment:** **Partial / contradicted** — needs a host design decision.

**Claim 8: "Card reuse in reorder + 'Reorder All' button"**
- **Code shows:** `lwc/reorderModal` exists (per-item); `OrderHistoryController` is a full stub; no Reorder-All anywhere.
- **Assessment:** **Contradicted today.** Path requires the controller rebuild + a new bulk-add UX.

### Scorecard

| # | Claim | Verdict |
|---|---|---|
| 1 | `Product__c`/`Product_Category__c` | Contradicted |
| 2 | `Cart__c`/`Cart_Item__c`/`Invoice__c` | Confirmed |
| 3 | OHFY-Core/Ozone repos | Contradicted |
| 4 | Responsive design | Confirmed |
| 5 | Delivery cutoff enforcement | Out of scope (or flag) |
| 6 | Case minimum validation | Belongs to Ph 1 |
| 7 | Search results card reuse | Partial / contradicted (host TBD) |
| 8 | Reorder card reuse + Reorder-All | Contradicted today |

---

## Phase 4 — Dependencies

| Link | Check | Result |
|---|---|---|
| Decomposed-from **BMS-3924** | Should be parent | Currently "relates to" — convert |
| **BMS-4053** (Ph 1 Card) | Hard dependency — Ph 2 needs Ph 1's extracted card | Order: 4053 → 4054 |
| **OrderHistoryController stub** | Reorder AC depends on rebuilding it | **Not a ticket today.** File one OR drop reorder from this ticket |
| Sibling **BMS-3927** (search & filter) | Search-results reuse intersects | Coordinate — search host design |
| Implicit dep: **promotion rebuild** | Card promo display (inherited from Ph 1) | File as own ticket |
| BMS-3930 | Title mismatch | Same as siblings |

---

## Top Issues (ranked)

1. **Reorder AC depends on a fully-stubbed controller.** `OrderHistoryController` is a stub right now — file the rebuild as a prereq ticket OR drop reorder from this story. Trying to do both inside Sprint 3 is risky.
2. **"Search results reuse" needs a host design decision.** Today there's no dedicated search-results LWC. Options: popover from navigationMenu, route-to-ecomShop with searchTerm, or build a new `lwc/ecomSearchResults`.
3. **Keyword highlighting is net-new.** Pick a strategy (lib vs. roll-your-own) explicitly in the ticket.
4. **"Reorder All" is net-new.** Confirm cart-merge vs. cart-replace behavior with Gulf.
5. **"Suggested alternative" is net-new** with no defined matching rule. Drop it Sprint 3 unless Gulf has a rule.
6. **Object naming wrong** (Product__c, Order__c). Update.
7. **OrderHistoryController stub is invisible to refinement attendees.** Surface this prominently.

---

## Suggested Revisions

- Replace `Product__c` / `Product_Category__c` / `Order__c` with `Item__c` / `Item_Type__c` / `Invoice__c`.
- Remove the auto-gen "OHFY-Core / Ozone" repo names.
- Make BMS-4053 a hard dependency (not "relates to") and order: 4053 ships first.
- Either drop the reorder AC from this ticket OR file an explicit prereq ticket for the OrderHistoryController stub rebuild.
- For search reuse — pick the host (popover vs. routed search). Don't ship "card renders in search results" without specifying where.
- Drop "suggested alternative" unless Gulf has a matching rule.
- Add the regression AC and the data-input-contract AC.
- Re-link or clarify BMS-3930.
