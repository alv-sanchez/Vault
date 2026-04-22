---
ticket: BMS-3929
title: "Order history & one-click reorder (Gulf)"
type: Story
parent_epic: "BMS-3702 — Gulf E-Commerce & Ordering"
blocked_by: "BMS-3930 — Retailer credit terms display & payment status (link likely mis-scoped — see Polish Notes)"
status: "Needs Refinement"
sprint: "Sprint 2 (2026-05-02 → 2026-05-15)"
repo_scanned: "/Users/alvarosanchez_1/Documents/OHFY-Ecom/force-app/main/default"
polished_on: 2026-04-22
polished_by: Alvaro Sanchez
jira: https://ohanafy.atlassian.net/browse/BMS-3929
tags: [polish, ecom, gulf, order-history, reorder]
---

# BMS-3929 — Jira-Ready

**Title:** Order history & one-click reorder (Gulf)

**Description:**

Gulf retailers repeatedly place the same product mix across weekly route cycles. Today the portal already has a full order-history view and a reorder modal, but reorder requires opening the modal, selecting items, and adjusting quantities — effectively a 3-to-5 click flow. This story rebases the ticket on the actual OHFY-Ecom code (`ecomOrderHistory`, `reorderModal`, `OrderHistoryController`) and adds the thin Gulf-specific delta on top:

1. **Two-click reorder** (per Elliot's 2026-04-16 comment on the ticket — "rework to document actual 2 click journey"): a "Reorder" button on each order row in `ecomOrderHistory` that opens `reorderModal` pre-populated with all line items at their original quantities, one confirm click away from cart.
2. **Current-pricelist recalculation** on reorder — already implemented via `userDataService.getPricelistData()` in `reorderModal.js:306-316`; this story adds the UX treatment (strike-through original price, "updated pricing" banner).
3. **Out-of-stock + discontinued flagging** — `reorderModal` already zeroes OOS items (`reorderModal.js:318-330`); extend to mark discontinued SKUs explicitly.
4. **Reorder provenance** — capture the source order when a new draft Invoice/Order is created from a reorder so AR and call-center reporting can link the two.
5. **Graceful degradation** — if the account has no `ohfy__Fulfilled_From__c` (fulfillment location) or no pricelist assigned, the Reorder button is disabled with an informational message, not silently broken.

**Current State (2026-04-22, per OHFY-Ecom codebase scan):**
- `lwc/ecomOrderHistory/` exists — two-tab layout (orders + frequently-ordered products), filters by status (All / Pending / In Transit / Out For Delivery / Delivered / Cancelled) and timeframe (All / 30d / 3m / 6m / This Year / Last Year), search, pagination (10/25/50/100, default **10 — not 20**).
- `lwc/reorderModal/` exists — `openWithOrder()` accepts an order, calls `processOrderItems()` + `loadStockAvailability()`, user adjusts quantities via +/- buttons, then clicks add-to-cart.
- Pricing: recalculation happens via `userDataService.getPricelistData()` (pricelist items with `ohfy__Discounted_Item_Price__c`). **The OHFY-Ecom pricing model is pricelist-based, not `Price_Record__c`.** The ticket's original AC references to `Price_Record__c` are codebase-inaccurate and must be rewritten.
- Warehouse model: `Account.ohfy__Fulfilled_From__c` (lookup to a fulfillment location), with `ohfy__Warehouse_Cutoff_Time__c` on the location. **There is no `Warehouse__c` field.**
- `Order__c` and `Order_Item__c` are **referenced in `OrderHistoryController.cls` queries but not defined in `OHFY-Ecom/force-app/main/default/objects/`** — these objects live in a dependency package. Any field addition (`Reorder_Source__c`) will need to target whichever package owns `Order__c`.
- Stock availability: `CartController.getQuantityAvailable` + `reorderModal.stockMap`. OOS items are flagged and zeroed; "discontinued" is not a concept in the current data model.

**Out of Scope:**
- Recurring / saved order templates (separate follow-up).
- Sub-weekly reorder reminders — covered by BMS-3921 (Retailer Engagement Notifications).
- Pricing-code resolution itself — that is spike BMS-4049 + Cart Ph 1 (BMS-4050).
- Any credit-hold gating of reorder — depends on BMS-3930 clarifying whether credit fields will exist on Account at all.

**Acceptance Criteria:**

```gherkin
Scenario: Two-click reorder from the order history row
  Given a retailer on a Montgomery AL account is on the Order History page
  And   at least one Delivered order exists in their history
  When  the retailer clicks the "Reorder" action on an order row
  Then  reorderModal opens pre-populated with every line item from that order
  And   each line item's reorderQuantity defaults to the original ordered quantity
  And   clicking "Add to Cart" without further interaction adds every in-stock line item to the draft invoice and navigates to the cart review page
  And   the full journey from Order History → cart review is two clicks (Reorder → Add to Cart)

Scenario: Pricelist recalculation on reorder with visible delta
  Given a retailer reorders an order originally placed during an expired promotional price
  When  reorderModal populates the line items
  Then  each line's unit price is resolved from userDataService.getPricelistData().pricelistItems (current pricelist)
  And   any line whose current price differs from the historical Unit_Price__c on the source Order_Item__c shows both: original price (struck through) and current price
  And   a modal-level banner shows "N items have updated pricing since your last order" when N > 0
  And   the line total and modal grand total reflect current pricing

Scenario: Out-of-stock items segregated and zeroed
  Given a retailer reorders an order containing 8 line items
  And   2 of those items have Quantity_Available__c <= 0 at the account's ohfy__Fulfilled_From__c location
  When  reorderModal renders
  Then  the 6 available items appear in the primary list with their original quantities
  And   the 2 OOS items appear in a separate "Unavailable" list with reorderQuantity = 0 and an "Out of stock at your warehouse" badge
  And   clicking "Add to Cart" adds only the 6 available items; the OOS items are skipped without error

Scenario: Discontinued SKU flagged separately from OOS
  Given a line item on the source order references an Item whose ohfy__Is_Active__c = false (or equivalent discontinued flag — confirm field during refinement)
  When  reorderModal renders
  Then  the discontinued item appears in the Unavailable list with a "Discontinued" badge distinct from "Out of stock"
  And   the item is never added to the cart, regardless of availability

Scenario: Reorder provenance captured on the new draft invoice
  Given a retailer clicks "Add to Cart" from a reorder populated from Order ORD-28741
  When  the draft invoice (Order__c) is created or updated
  Then  the new record stores a reference to ORD-28741 via Reorder_Source__c (lookup on Order__c — new field, owner package TBD)
  And   the reference survives checkout; the submitted Order__c retains Reorder_Source__c = ORD-28741
  And   OrderHistoryController.getOrderHistory returns Reorder_Source__c alongside existing fields so a future view can show "Reorder of ORD-28741"

Scenario: Reorder gracefully degraded when account is not configured
  Given a retailer's Account has no ohfy__Fulfilled_From__c OR no assigned pricelist
  When  the retailer views Order History
  Then  the Reorder button on every row is disabled
  And   a tooltip reads "Reorder is unavailable for your account — please contact your Gulf sales representative"
  And   no reorderModal opens; no malformed Order__c or Cart is created

Scenario: Order history page size default
  Given a retailer with 40+ historical orders lands on the Order History page
  When  the page initially renders
  Then  the order list shows the first 10 orders (current default) with a page-size selector exposing 10/25/50/100
  # NOTE: original AC said "20 per page" — codebase default is 10. Confirm with product whether to change default or align AC.

Scenario: Cancelled and voided orders remain visible
  Given a retailer has historical orders including Cancelled and Voided statuses
  When  the retailer filters by "All Statuses"
  Then  Cancelled and Voided orders appear with a distinctly colored status badge
  And   the Reorder button is disabled for Cancelled/Voided rows
  And   clicking the row still opens the read-only order detail for audit review

Scenario: Expandable line-item preview on the order row
  Given a retailer sees an order row in the list
  When  the retailer clicks the row's disclosure chevron
  Then  the row expands inline to show SKU, product name, quantity, unit price, and line total for every Order_Item__c on that order
  And   collapsing the row hides the detail without re-querying

Scenario: Warehouse column exposed on order history
  Given orders have been placed against multiple fulfillment locations on the account (if applicable)
  When  the Order History table renders
  Then  a "Warehouse" column displays each order's originating location via the Order__c → ohfy__Fulfilled_From__r relationship (or equivalent on Order__c)
  And   the column is sortable and visible on desktop; responsive collapse acceptable on mobile
```

**Technical Approach:**

1. **`ecomOrderHistory` UI additions:**
   - Add a top-level Reorder button on each order row (`ecomOrderHistory.html`) that fires a `reorder` custom event with the order id.
   - Add a disclosure chevron + inline expand-row slot that lazy-renders the existing Order_Item__c details already returned by `OrderHistoryController.getOrderHistory`.
   - Add a Warehouse column sourced from `Order__c.ohfy__Fulfilled_From__r.Name` (requires `OrderHistoryController` to include that relationship in the SOQL).
   - Wire the Reorder button disabled-state to a computed getter (`canReorder`) based on `userDataService.fulfillmentLocation` and `userDataService.getPricelistData().pricelistId`.
2. **`reorderModal` UX additions:**
   - In `processOrderItems`, compute `priceDelta = pricelistItem.Discounted_Item_Price__c - originalUnitPrice`; attach to each row so the template can render the strike-through treatment.
   - Add a `discontinuedItems` getter alongside `outOfStockItems` — split on the Item's active/discontinued flag (confirm the exact field during refinement).
   - Add an "N items updated" banner slot that reads the count of rows with a non-zero priceDelta.
3. **`OrderHistoryController.cls`:**
   - Extend SOQL to return `ohfy__Fulfilled_From__r.Name`, the discontinued flag on the Item, and `Reorder_Source__c` (once the field is created).
   - Keep the existing totals and filter semantics — no change to `getOrderHistory` signature required.
4. **`Order__c.Reorder_Source__c`:**
   - New lookup field on `Order__c` pointing to `Order__c` (self-lookup). Owner package is whichever package defines `Order__c` — **this is a dependency the team must confirm before sprint commit**; OHFY-Ecom references `Order__c` but does not own it.
   - Draft invoice creation path (likely in CartController / draftInvoiceService) must set this field when the cart is seeded from a reorder.
5. **Two-click journey accounting:**
   - "Reorder" (click 1 on Order History row) → modal opens populated → "Add to Cart" (click 2) → navigate to cart review. No intermediate confirm screen.

**Open Questions (carry to refinement):**
- **Blocker on BMS-3930** — the Jira link says "is blocked by BMS-3930 (credit terms)", but nothing in this story logically requires credit-terms UI. Recommend removing the link or replacing with BMS-3925 (Product Catalog) which is the real pricing-data dependency.
- Page size default: keep at 10 (codebase) or align to the ticket's "20 per page"? Product call.
- Discontinued flag on Item — confirm exact field name (`ohfy__Is_Active__c` inverse? `Discontinued__c`?) so the AC can be tightened.
- Reorder eligibility for partially-delivered orders or orders with BOL variances — block or allow with a warning?
- Does the reorder re-evaluate the account's current `ohfy__Fulfilled_From__c`, or does it honor the source order's warehouse if different (relevant if an account has been reassigned between Mobile AL and Montgomery AL)?
- History retention window — full regulatory 10+ years visible in the portal, or rolling window with "export archive"?

**Estimate:** Small-to-Medium — ~3 days.
- 1d UI additions on `ecomOrderHistory` + `reorderModal`
- 0.5d `OrderHistoryController` SOQL/field additions
- 0.5d `Reorder_Source__c` field + draft-invoice wiring
- 0.5d regression + visual QA on existing flow
- 0.5d refinement buffer for discontinued flag + edge cases

---

# BMS-3929 — Polish Notes

## Verdict at a Glance

**Ready for refinement with significant scope corrections.** The feature is mostly a UX shortcut and a few field additions, not net-new reorder logic — the reorder flow is already ~90% built. The ticket's original technical writeup is based on a sales-demos repo pattern and references `Price_Record__c` / `Warehouse__c` concepts that **do not exist in OHFY-Ecom**. Rebase the ACs and approach on the actual codebase (`reorderModal`, pricelist-based pricing, `ohfy__Fulfilled_From__c`) before sprint commit.

| Area                                                   | Verdict                                                                                                |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| Story statement (two-click reorder, reduce call vol.)  | Confirmed                                                                                              |
| Elliot's "actual 2 click journey" comment              | **Confirmed** — current flow is 3-5 clicks; two-click is the real target                               |
| AC claim: `Price_Record__c` drives reorder pricing     | **Contradicted** — OHFY-Ecom pricing model is pricelist-based (`ohfy__Discounted_Item_Price__c`)        |
| AC claim: 20 orders per page                           | **Contradicted** — default is 10                                                                        |
| AC claim: expandable line items                        | **Missing** — not implemented today                                                                     |
| AC claim: warehouse column on order table              | **Missing** — no warehouse column                                                                       |
| Reorder prices from current pricelist (ACs say yes)    | Confirmed (`reorderModal.js:306-316`)                                                                   |
| OOS items flagged & zeroed                             | Confirmed (`reorderModal.js:318-330`)                                                                   |
| Discontinued flag handling                             | **Missing** — only OOS today                                                                            |
| `Order__c.Reorder_Source__c`                           | **Missing** — field does not exist; `Order__c` object lives outside OHFY-Ecom                           |
| Block reorder when account lacks fulfillment/pricelist | **Incomplete** — location presence is checked but no hard gate; silent failure possible                |
| Jira "blocked by BMS-3930"                             | **Mis-scoped** — credit-terms UI is not a logical prerequisite for reorder                              |

---

## Phase 2 — Business Requirements & ACs

### Structural check
- ✅ Clear purpose (reduce inbound calls, reduce pricing/transcription errors)
- ⚠️ Testable Gherkin ACs — currently testable but codebase-inaccurate in places
- ✅ Scoped correctly (UX + small data model addition; not a cart rebuild)
- ✅ Correct issue type (Story)

### AC validation

| AC in ticket today | Verdict | Note |
|---|---|---|
| 1. Order history with filters and 20-per-page pagination | Incomplete | Page size default is 10. Warehouse column and expandable rows are missing from current UI. |
| 2. One-click reorder populates cart with same SKUs + quantities | Contradicted as "one-click" | Current UX is 3-5 clicks (open modal, adjust, add). Rework to "two-click" journey per Elliot's comment. |
| 3. Prices recalculate against current `Price_Record__c` | Contradicted by data model | Pricing is pricelist-based; `Price_Record__c` does not exist in OHFY-Ecom. |
| 4. Reorder flags discontinued/OOS items | Incomplete | OOS flagged; "discontinued" is not a concept in current Item model. |
| 5. Partial reorder → new `Order__c` with `Reorder_Source__c` + current route/warehouse | Contradicted by data model | No `Reorder_Source__c` field exists; `Order__c` object lives in a dependency package, not OHFY-Ecom. |
| 6. Order history immutability | Confirmed — testable | No UI editing today; keep as-is. |
| 7. Reorder blocked if account lacks Price_Record__c or Warehouse__c | Contradicted by data model | Replace with: blocked if account lacks `ohfy__Fulfilled_From__c` or assigned pricelist. |

### Gaps to plug
- **Missing AC** — define the concrete "two-click" journey (Elliot's comment).
- **Missing AC** — price-delta UX treatment (strike-through + banner) given the recalc already happens.
- **Missing AC** — reorder provenance that the owner package must ship (`Reorder_Source__c`).
- **Missing AC** — graceful-degradation behaviour when the account is not configured.
- **Missing AC** — cancelled/voided orders visible in history but non-reorderable.
- **Open question on ticket (retention window)** — convert to an AC once product decides.

---

## Phase 3 — Technical Approach

### Ticket says (auto-gen)
> "Build the Order History view as an LWC component querying Order__c with child Order_Line_Item__c records, filtered by the portal user's Account. Reorder logic implemented in an Apex service class that clones line items, resolves current pricing via Price_Record__c lookup (respecting the account's pricing code hierarchy), and validates Inventory__c availability at the assigned warehouse. The Reorder_Source__c lookup on Order__c provides traceability. Leverage the existing historyTile component pattern from the Sales-Demos codebase as a starting point…"

### Claim-by-claim validation (honesty protocol)

**Claim 1: Build Order History view as an LWC querying `Order__c` with child line items**
- **Code shows:** `lwc/ecomOrderHistory/ecomOrderHistory.js` (1106 lines) + `OrderHistoryController.cls` are already built and in production use. Two-tab layout, stats, filters, search, pagination.
- **Assessment:** **Contradicted.** The view exists; the story is _additions_, not a rebuild.

**Claim 2: Reorder logic implemented in a new Apex service class that clones line items**
- **Code shows:** `lwc/reorderModal/reorderModal.js:108-254` + `draftInvoiceService` handle the cloning flow entirely on the client today. No new Apex service class is required.
- **Assessment:** **Contradicted.** Keep the work in `reorderModal` + existing `draftInvoiceService`; add a small amount of Apex only if `Reorder_Source__c` stamping needs server-side handling.

**Claim 3: Resolve current pricing via `Price_Record__c` lookup**
- **Code shows:** `reorderModal.js:306-316` resolves price from `userDataService.getPricelistData().pricelistItems[].ohfy__Discounted_Item_Price__c`. **`Price_Record__c` does not exist in OHFY-Ecom.**
- **Assessment:** **Contradicted.** Rewrite as pricelist-based recalculation (already implemented).

**Claim 4: Validate `Inventory__c` availability at the assigned warehouse**
- **Code shows:** `reorderModal.js:318-330` uses `stockMap` populated by `loadStockAvailability()` from `CartController.getQuantityAvailable`. The "assigned warehouse" is `Account.ohfy__Fulfilled_From__c`, not a `Warehouse__c` field.
- **Assessment:** **Incomplete.** The validation exists and uses the correct data model — replace "Warehouse__c" with `ohfy__Fulfilled_From__c` in the writeup.

**Claim 5: `Reorder_Source__c` lookup on `Order__c`**
- **Code shows:** No such field. `Order__c` object metadata is not in OHFY-Ecom (`force-app/main/default/objects/` does not contain it); only Apex references it. This means the field must be created in whichever package owns `Order__c`, not in OHFY-Ecom.
- **Assessment:** **Missing + cross-package dependency.** Identify the owning package (likely OHFY-Data-Model or OHFY-OMS) before sprint commit.

**Claim 6: "Leverage historyTile component pattern from Sales-Demos"**
- **Code shows:** OHFY-Ecom has its own `ecomOrderHistory` which is substantially more capable than a `historyTile`. The auto-gen suggestion rebuilds from a weaker starting point.
- **Assessment:** **Contradicted.** Build on `ecomOrderHistory`, not a sales-demo tile.

### Scorecard

| # | Auto-gen claim | Verdict |
|---|---|---|
| 1 | LWC querying `Order__c` | Contradicted — already built |
| 2 | New Apex service for cloning | Contradicted — client-side in `reorderModal` today |
| 3 | `Price_Record__c` for current pricing | Contradicted — pricelist model |
| 4 | `Inventory__c` at assigned warehouse | Incomplete — stock + `ohfy__Fulfilled_From__c`, not Warehouse__c |
| 5 | `Reorder_Source__c` on `Order__c` | Missing + dependency on owning package |
| 6 | "historyTile pattern from Sales-Demos" | Contradicted — wrong baseline |

---

## Phase 4 — Dependencies

| Link | Check | Result |
|---|---|---|
| Blocked by BMS-3930 ("Retailer credit terms display & payment status") | Does upstream deliver anything reorder requires? | **Mis-scoped.** Credit-terms UI is not needed to place a reorder. Remove the Jira link or replace with BMS-3925 (Product Catalog) which drives pricelist + availability. |
| Parent BMS-3702 (Gulf ECOM epic) | Parent consistent | Confirmed |
| Pricing spike BMS-4049 / Cart Ph 1 BMS-4050 | Reorder pricing depends on the same pricelist model the cart uses | Implicit dependency — if BMS-4050 changes the pricing resolution, this ticket's pricelist call must adapt. Confirm sequencing. |
| `Order__c.Reorder_Source__c` field | Which package owns the field? | **Open.** Likely OHFY-Data-Model or OHFY-OMS — must confirm and add a sub-task to that package. |

---

## Top Issues (ranked)

1. **Rebase the AC and Technical Approach on OHFY-Ecom reality** — drop `Price_Record__c` / `Warehouse__c` references; use `userDataService.getPricelistData()` and `ohfy__Fulfilled_From__c`. The auto-gen writeup is based on a sales-demo repo, not the Gulf codebase.
2. **Tighten "one-click" → "two-click"** per Elliot's 2026-04-16 comment. Make the journey step-count explicit in an AC.
3. **`Reorder_Source__c` is a cross-package change** — identify and sub-task the owning package before sprint commit. The ticket cannot land end-to-end without this.
4. **Remove or re-scope the BMS-3930 "blocked by" link** — credit-terms UI is not a logical prerequisite for reorder.
5. **Page-size default mismatch** — ticket says 20, code says 10. Product decision: keep 10, or change default as part of this story.
6. **Discontinued vs. out-of-stock** — decide if "discontinued" is a first-class flag in the Item model. If not, drop the AC; if yes, add the field lookup.

---

## Suggested Revisions

### Proposed title (unchanged)
"Order history & one-click reorder" — or tighten to "Order history & two-click reorder" to match the journey.

### Proposed description addition
Prepend the **Current State (2026-04-22)** block from the Jira-Ready section above so the team refines against the actual codebase, not the sales-demo reference.

### Proposed ACs
Replace the existing 6 ACs with the 9 in the Jira-Ready section. Material changes: introduce the "two-click" journey explicitly; replace `Price_Record__c` with pricelist; replace `Warehouse__c` with `ohfy__Fulfilled_From__c`; split discontinued from OOS; add graceful-degradation and warehouse-column ACs.

### Proposed field updates
- **Blocked By:** drop BMS-3930, add BMS-3925 (Product Catalog) if pricelist + availability plumbing lands there.
- **Sub-task:** create a sub-task for the owning package (to be confirmed) to add `Order__c.Reorder_Source__c`.
- **Labels:** keep `fast-trackable`, `gulf`, `phase-2`, `sprint-s2-recommended`; remove `refinement-needed` once the dependency is resolved.

---

## Open Questions for Team Refinement
1. Which package owns `Order__c`? The `Reorder_Source__c` field needs to land there, not in OHFY-Ecom.
2. Page-size default: 10 (current) or 20 (ticket)?
3. Is there a discontinued flag on Item in the Gulf data model? If not, is adding one in scope?
4. Reorder eligibility for partially-delivered orders — block, allow with warning, or allow silently?
5. Warehouse column on order history — useful for single-account retailers (most of them), or is the value only for multi-entity accounts?
6. **Warehouse context in the portal — three-part question** (critical; drives both this ticket and BMS-4258):
   - **6a. Per-order warehouse selection** — at cart/reorder time, can the retailer *pick* which warehouse fulfills the order, or is the warehouse strictly determined by `Account.ohfy__Fulfilled_From__c`? Today the codebase assumes the latter — there is no warehouse picker in `ecomCartPage` or `reorderModal`. If Gulf wants a picker, it is net-new scope and should be split into its own story; it is explicitly *not* part of this ticket.
   - **6b. Multi-account warehouse context** — for a retailer with multiple businesses (per BMS-4258) whose accounts live in different warehouses (e.g., Milton FL + Mobile AL), does the portal show orders and enable reorder across *all* linked accounts at once, or only for the currently "active" account? Recommendation: scope to active account only in Sprint 2; revisit once the multi-account switcher UI lands.
   - **6c. Account reassignment** — if Ops re-pins `Account.ohfy__Fulfilled_From__c` from Mobile AL to Montgomery AL, should a reorder of a historical Mobile AL order route to the *original* Mobile AL warehouse (honoring the source order) or to the *current* Montgomery AL assignment (honoring the live account)? Recommendation: use current assignment, warn if availability differs. Locks in on refinement.

   *Rationale for splitting*: asking "can retailers swap warehouses" conflates these three cases, and each has a different owner and different scope implication. 6a is a cart/checkout change (out of scope here). 6b is a multi-profile concern (BMS-4258 dependency). 6c is reorder-routing logic (inside this ticket). Getting explicit answers for each avoids building a picker the team didn't intend or silently routing to the wrong warehouse on a reorder.

## Readiness Recommendation
**GO for Sprint 2 refinement** once the dependency on the `Order__c`-owning package is confirmed and the ACs are rebased per the Jira-Ready section. The implementation itself is small because the hard parts (order list, modal, pricelist recalc, OOS zeroing) are already shipped.
