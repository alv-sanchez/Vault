---
ticket: BMS-3929
title: "Reorder pricing + stock-availability hardening (Gulf)"
type: Story
parent_epic: "BMS-3702 — Gulf E-Commerce & Ordering"
blocked_by: "None (drop stale BMS-3930 link — credit-terms UI is not a prerequisite)"
status: "Needs Refinement"
sprint: "Sprint 2 (2026-05-02 → 2026-05-15)"
repo_scanned: "/Users/alvarosanchez_1/Documents/OHFY-Ecom/force-app/main/default"
polished_on: 2026-04-23
polished_by: Alvaro Sanchez
jira: https://ohanafy.atlassian.net/browse/BMS-3929
tags: [polish, ecom, gulf, reorder, pricing, inventory, hardening]
---

# BMS-3929 — Jira-Ready (scope-narrowed rewrite)

**Title:** Reorder pricing + stock-availability hardening (Gulf)

**Scope correction (2026-04-23):**
The original ticket bundled order-history UI, two-click reorder, and a long list of pricing / stock behaviours. The reorder UX (`lwc/ecomOrderHistory` + `lwc/reorderModal`) is already built and is what QA will demo in Sprint 2. This ticket is narrowed to the **two hardening requirements** that are not yet proven by code or tests:

1. **Validate Gulf pricing codes resolve correctly on reordered items** — prove that the current pricelist wins over the historical order-item price, with the correct tier for the retailer's account, and that this is testable rather than incidental.
2. **Handle stock-availability drift between original order and reorder** — close the window between "modal opens with stockMap" and "Add to Cart succeeds", so drift produced by concurrent orders or warehouse re-pinning does not silently create under-stocked cart lines.

Everything else from the original ticket (two-click journey, discontinued flag, `Reorder_Source__c`, warehouse column, pagination defaults) stays in the sprint1 polish and is being tracked separately.

---

**Description:**

Gulf retailers reorder frequently and their Account pricelist assignment — what the business calls a *Gulf pricing code* — drives both the unit price and the eligible SKU set. Two risks exist on the current reorder path:

- **Price silently stale.** `reorderModal.js:306-316` reads `userDataService.getPricelistData().pricelistItems[].ohfy__Discounted_Item_Price__c` and overrides the historical unit price. This works today, but there is **no test** proving it. If a future change to `userDataService` or to pricelist provisioning causes the LWC to fall back to the historical price, nothing will fail loudly. Gulf cannot ship reorder in front of 150+ account-specific pricelists without an assertion.
- **Stock drift silently under-stocks the cart.** `reorderModal.loadStockAvailability()` reads `CartController.getQuantityAvailableAtFulfillmentLocation` once on modal open (`reorderModal.js:169-185`) and stores it in `stockMap`. Out-of-stock items are zeroed on render (`reorderModal.js:318-330`). Between modal open and the user clicking **Add to Cart**, another retailer can consume the same stock, or Ops can re-pin `Account.ohfy__Fulfilled_From__c` to a different warehouse. `CartController.addDraftItems` does not re-check; the cart silently accepts the line and the insufficient quantity surfaces only at fulfillment (BOL variance).

This story adds the validation layer that closes both risks: pricelist resolution becomes explicit and asserted; stock drift is re-checked at add-to-cart time, with a clear user message when an item can no longer be reordered at the quantity shown.

**Why it matters:**
- Gulf's blueprint workshops explicitly called out that a miskeyed or stale price cascades into invoice-reconciliation work. The pricelist-resolution code is already in place — the missing piece is the test + a user-visible delta when the reorder price differs from the historical price.
- BOL variances caused by under-stocked reorders generate call-center volume — exactly the cost the parent epic exists to reduce. Hard-validating stock at add-to-cart time keeps the reorder pipe clean without blocking the happy path.

**Current State (2026-04-23, per `/Users/alvarosanchez_1/Documents/OHFY-Ecom` scan):**

- **Reorder entry point:** `lwc/reorderModal/reorderModal.js:108` `openWithOrder(order)` — deep-clones the order, calls `processOrderItems()` + `loadStockAvailability()` in parallel, then `processOrderItems()` again after both promises resolve to apply prices + stock flags.
- **Pricelist lookup:** `reorderModal.js:306-316`. Matches `pricelistItems[].ohfy__Item__c === item.productId`, overrides `unitPrice` from `ohfy__Discounted_Item_Price__c`. No fallback logging, no diff surfaced to the user.
- **Stock read:** `reorderModal.js:169-185` → `CartController.getQuantityAvailableAtFulfillmentLocation` (`CartController.cls:927-1000`), which returns a `Map<ItemId, AvailableQty>` from `Inventory__c` minus pending `Status__c = 'New'` orders. Populates `stockMap` once.
- **Stock render:** `reorderModal.js:318-330` zeroes `reorderQuantity` and flips `isOutOfStock` when `qtyAvailable <= 0`.
- **Add to Cart:** `reorderModal.js:371-402` → `draftInvoiceService.addMultipleItems(...)` → `CartController.addDraftItems` (`CartController.cls:561`+). **No stock re-check in the Apex path.**
- **Existing Apex tests on the reorder path:** `CartController_T.testReorderItems` (line 561), `testReorderItemsAddToExistingCart` (line 625), `testAddDraftItems_CreateNew` (line 1512), `testAddDraftItems_UpdateExisting` (line 1545). **None assert pricing against a different pricelist state. None assert stock drift.**

**Out of Scope:**
- The two-click journey UX, discontinued-SKU flagging, `Reorder_Source__c` provenance, warehouse column, pagination default — all covered by the sprint1 polish of BMS-3929.
- Reserving inventory (holding stock between modal open and checkout). That's a Cart Phase 2 concern, not reorder hardening.
- Changing the pricelist resolution model itself (that's spike BMS-4049 / Cart Ph 1 BMS-4050). This ticket validates the *current* pricelist model resolves correctly; it does not redesign it.
- Any discontinued-product logic (separate AC in the sprint1 polish).

---

**Acceptance Criteria:**

```gherkin
Scenario: Current pricelist price overrides historical order price on reorder
  Given a Mobile AL retailer placed an order last month for Item ABC at $10.00 per unit
  And   the retailer's Account is assigned Pricelist "Gulf AL Tier 2" with Item ABC priced at $12.00 today
  When  the retailer opens the reorder modal from that historical order
  Then  each line for Item ABC displays $12.00 as the current unit price (not $10.00)
  And   the line shows the historical $10.00 struck through with the $12.00 in the primary position
  And   the modal header banner reads "N items have updated pricing since your last order" where N is the count of lines whose current price differs from the historical price
  And   the modal grand total sums current prices, not historical prices

Scenario: Reordered item uses the account's current pricelist, not the source order's pricelist
  Given the account has been reassigned from Pricelist "Gulf AL Tier 3" to Pricelist "Gulf AL Tier 2" since the original order
  When  the retailer opens the reorder modal
  Then  every line's unit price resolves from the Tier 2 pricelist
  And   no line uses the Tier 3 price or the historical Unit_Price__c from the source Order_Item__c
  And   an item that exists on Tier 3 but not on Tier 2 is surfaced in the "Unavailable" list with a badge "Not available on your current pricelist"

Scenario: Reorder price falls back cleanly when the pricelist lookup misses
  Given an item on the source order has no matching record in userDataService.getPricelistData().pricelistItems
  When  the reorder modal renders that line
  Then  the line is placed in the "Unavailable" list with a badge "Not available on your current pricelist"
  And   the line cannot be added to the cart
  And   a client-side console warning is emitted with the itemId + pricelistId for observability (not a user-facing error)

Scenario: Stock availability is re-validated at Add-to-Cart time, not only at modal open
  Given the retailer opens the reorder modal at 10:00 with stockMap showing 5 units of Item XYZ available
  And   a different user places an order at 10:01 that consumes 5 units of Item XYZ at the same fulfillment location
  When  the retailer clicks "Add to Cart" at 10:02
  Then  the client sends the reorder payload plus the stockMap snapshot it was computed against
  And   CartController.addDraftItems re-queries current availability before inserting the line
  And   the insert is rejected for Item XYZ; the cart receives zero units of Item XYZ
  And   the LWC displays a banner "Stock for N items changed while you were reviewing — please refresh" and reopens the modal with a fresh stockMap

Scenario: Partial add-to-cart succeeds for still-available items when others have drifted
  Given the retailer has 4 reorder lines at Add-to-Cart time
  And   line 2 has drifted to out-of-stock since modal open but lines 1, 3, 4 still have inventory
  When  the retailer clicks "Add to Cart"
  Then  lines 1, 3, and 4 are added to the cart at their current pricelist prices
  And   line 2 is skipped and its row is highlighted in the modal with "Out of stock — not added"
  And   the user is not forced to re-click "Add to Cart" for the remaining lines

Scenario: Account fulfillment-location change between modal open and Add-to-Cart is detected
  Given the retailer opens the reorder modal with Account.ohfy__Fulfilled_From__c = Mobile AL warehouse
  And   Ops re-pins Account.ohfy__Fulfilled_From__c to Montgomery AL warehouse at 10:01
  When  the retailer clicks "Add to Cart" at 10:02
  Then  CartController.addDraftItems detects that the stockMap was computed for a different fulfillment location
  And   the insert is rejected; the LWC banner reads "Your warehouse assignment changed — please re-open the order to reorder"
  And   no draft invoice line is created against the stale location

Scenario: Test coverage for pricelist-driven recalculation exists
  Given the Apex test suite runs
  Then  a @IsTest method `testReorder_PricelistDrivesCurrentPrice` exists in CartController_T.cls
  And   the test creates an item priced at $10 on the source order's pricelist
  And   reprices the same item at $12 on the account's current pricelist
  And   asserts that the reorder path surfaces $12 as the unit price
  And   asserts that the source order's historical $10 is preserved on the source Order_Item__c

Scenario: Test coverage for stock drift exists
  Given the Apex test suite runs
  Then  a @IsTest method `testAddDraftItems_StockDriftRejected` exists in CartController_T.cls
  And   the test simulates a client stockMap captured when availability was 5 units
  And   sets current availability to 0 units before addDraftItems is called
  And   asserts that the add-to-cart call rejects that line with a documented error code
  And   asserts that other lines still add successfully
```

---

**Technical Approach:**

1. **LWC — `reorderModal` price-delta surface (no new Apex):**
   - In `reorderModal.js:293-331` `processOrderItems`, compute `priceDelta = currentPrice - historicalPrice` per line and attach to the row alongside the existing `unitPrice` + `isOutOfStock` fields.
   - Render treatment: if `priceDelta !== 0`, show the historical price struck through and the current price in the primary slot. Modal header banner counts lines with non-zero delta.
   - For lines whose item id is not in `pricelistItems`, place them in an "Unavailable" list with a distinct badge from OOS, and prevent `addToCart` from including them.

2. **LWC — send stockMap snapshot + fulfillmentLocationId on Add-to-Cart:**
   - Extend the payload from `reorderModal.js:371-402` `addToCart` to include `stockMapSnapshot` (the map used on render) and `fulfillmentLocationId` (the `ohfy__Fulfilled_From__c` that drove the stock read).
   - `draftInvoiceService.addMultipleItems(...)` must pass these through to the Apex call.

3. **Apex — `CartController.addDraftItems` stock + location re-check:**
   - Before DML, re-query `getQuantityAvailableAtFulfillmentLocation(currentLocation)` for the items in the incoming payload.
   - Compare against `stockMapSnapshot` — any line whose current availability is lower than the requested quantity is removed from the DML set and returned in a `rejectedLines` structure with reason (`'OUT_OF_STOCK'` | `'QUANTITY_REDUCED'` | `'LOCATION_CHANGED'`).
   - Location mismatch: if the Account's current `ohfy__Fulfilled_From__c` does not match the `fulfillmentLocationId` supplied by the client, reject the whole payload with `'LOCATION_CHANGED'`.
   - Return `{ inserted: [...], rejected: [{lineRef, reason}...] }` so the LWC can surface a partial-success banner.

4. **Apex tests — add two targeted methods in `CartController_T.cls`:**
   - `testReorder_PricelistDrivesCurrentPrice` — asserts pricelist recalculation and that the historical `Unit_Price__c` is unchanged on the source order item.
   - `testAddDraftItems_StockDriftRejected` — asserts partial rejection, with the preserved lines inserted and the rejected line excluded, and that `rejectedLines` carries the correct reason code.
   - Optional: `testAddDraftItems_LocationChanged` — asserts full-payload rejection when the account's fulfillment location has changed.

5. **LWC test — Jest spec for `reorderModal`:**
   - Mock `userDataService.getPricelistData()` to return a pricelist priced differently from the `unitPrice` on the seeded order. Assert that the rendered line shows the new price, the struck-through historical price, and that the modal banner reads the right count.
   - Mock a drifted `addDraftItems` response with one line rejected; assert the UI shows the partial-success banner and does not lose the other lines.

**Files to touch (scoped, cited):**
- `/Users/alvarosanchez_1/Documents/OHFY-Ecom/force-app/main/default/lwc/reorderModal/reorderModal.js` — `processOrderItems`, `addToCart`, add `priceDelta` + partial-success handling.
- `/Users/alvarosanchez_1/Documents/OHFY-Ecom/force-app/main/default/lwc/reorderModal/reorderModal.html` + `.css` — price-delta rendering, banner slot.
- `/Users/alvarosanchez_1/Documents/OHFY-Ecom/force-app/main/default/classes/experienceSite/CartController.cls` — `addDraftItems` stock + location re-check, typed response.
- `/Users/alvarosanchez_1/Documents/OHFY-Ecom/force-app/main/default/classes/experienceSite/CartController_T.cls` — two new `@IsTest` methods.
- (Optional) `/Users/alvarosanchez_1/Documents/OHFY-Ecom/force-app/main/default/lwc/reorderModal/__tests__/reorderModal.test.js` — Jest specs.

---

**Open Questions (carry to refinement):**
1. **Pricelist mismatch UX wording.** Do we say *"Not available on your current pricelist"* (confusing to retailers who don't know what a pricelist is) or something like *"Discontinued for your account"*? Needs a CX review before the LWC strings land.
2. **Partial-success retry behaviour.** When `addDraftItems` returns partial rejections, does the modal stay open so the user sees which lines were skipped, or close and show the banner in the cart review page? Recommend staying open; confirm with product.
3. **Error-code vocabulary.** `OUT_OF_STOCK`, `QUANTITY_REDUCED`, `LOCATION_CHANGED`, `ITEM_NOT_ON_PRICELIST` — agree on exact names so the LWC can map to user-facing copy and telemetry can count reasons.
4. **Historical price surface in cart after Add-to-Cart.** Once the reorder lines are in the cart, do we keep the historical-price strike-through in the cart UI, or drop it because the price delta is now "just the price"? Recommend: drop in the cart; the modal already made the user aware.
5. **Do we log the pricelist-miss telemetry to Salesforce or only console?** If retailers hit "Not available on your current pricelist" frequently, Ops will want to see it. A `platform event` or `Log__c` row feels like overkill for v1 — console is enough unless product disagrees.

**Estimate:** Small — ~2 days.
- 0.5d LWC price-delta + banner
- 0.5d LWC stockMap snapshot + partial-success handling
- 0.5d Apex `addDraftItems` re-check + typed response
- 0.5d tests (2 Apex + 1 Jest)

---

# BMS-3929 — Polish Notes (sprint2 rewrite)

## Verdict at a Glance

**Ready for refinement as a narrowly-scoped hardening story.** The original BMS-3929 polished in sprint1 was a full reorder build-out; everything except these two validation gaps has been implemented. Splitting them off keeps sprint2 small and lets QA run a targeted regression against the live reorder modal. No redesign, no new objects, no cross-package dependency.

| Requirement | Current Code Says | Gap |
|---|---|---|
| 1. Gulf pricing codes resolve correctly on reorder | `reorderModal.js:306-316` reads current pricelist and overrides historical price | No test proves this; no user-visible delta treatment; silent miss when item not on pricelist |
| 2. Stock-availability drift between original order and reorder | Stock read once at modal open (`reorderModal.js:169-185`); OOS zeroed on render (`:318-330`); **no re-check at `addDraftItems`** | Stale `stockMap` + concurrent consumption → under-stocked cart lines + BOL variance downstream |

---

## Requirement 1 — Gulf Pricing Codes on Reorder

### What "Gulf pricing code" actually means in this codebase
There is no `Gulf_Pricing_Code__c` field. Gulf's 150+ pricing codes are implemented as **Pricelist records** (`Pricelist__c`) with child `Pricelist_Item__c` rows carrying `ohfy__Discounted_Item_Price__c`. An Account is assigned one pricelist at a time; that assignment IS the "Gulf pricing code" for the business. `userDataService.getPricelistData()` pre-caches the assigned pricelist's items for the portal user.

### Code-level evidence
- `reorderModal.js:306-316` — active pricelist resolution path. Confirmed.
- `CartController.cls` has no Gulf-specific code branch; the pricelist model is uniform across all Gulf accounts.
- No test asserts pricelist wins over historical `Unit_Price__c` on reorder.

### What a passing test proves
That the reorder modal will **never** regress to using the stale historical price if `userDataService` or the pricelist shape changes. It also catches the case where an account's pricelist assignment has changed since the source order.

### Caveat — what's still upstream
If pricelist resolution logic itself changes (spike BMS-4049 / Cart Ph 1 BMS-4050), this ticket's test will need to adapt. That's fine; it's still the right asymmetric bet because today there is *zero* coverage.

---

## Requirement 2 — Stock-Availability Drift

### The specific race
1. User A opens reorder modal at T0. `stockMap[itemX] = 5`. UI shows 5 available, defaults `reorderQuantity = 5`.
2. User B completes a draft invoice at T1 that consumes 5 units of itemX at the same fulfillment location.
3. User A clicks **Add to Cart** at T2. `CartController.addDraftItems` blindly inserts 5 units.
4. At fulfillment the cart is under-stocked; BOL variance; call-center ticket; the exact flow the parent epic exists to avoid.

### Similar risk — fulfillment-location re-pinning
Ops can re-pin `Account.ohfy__Fulfilled_From__c` at any moment. The `stockMap` was computed against the *old* location; the cart should be computed against the *current* one. Currently there is no guard.

### Why a re-check at `addDraftItems` (not a reservation)
Full inventory reservation is a Cart Phase 2 concern — it implies holding stock across sessions, TTL logic, and cleanup on abandoned carts. That's weeks of work. The hardening here is the cheap win: re-check at the exact moment the cart mutates, and return a typed response the UI can handle gracefully. Most races are resolved correctly; edge cases surface a clear message instead of silent corruption.

### Payload contract (proposed)
```
// LWC → Apex
{
  lineItems: [{itemId, quantity, unitPrice}, ...],
  stockMapSnapshot: {itemId: quantityAtModalOpen, ...},
  fulfillmentLocationId: 'a0X...'
}

// Apex → LWC
{
  inserted: [{itemId, quantity}, ...],
  rejected: [{itemId, reason: 'OUT_OF_STOCK' | 'QUANTITY_REDUCED' | 'LOCATION_CHANGED' | 'ITEM_NOT_ON_PRICELIST', currentAvailable: 0}, ...]
}
```

---

## Claim-by-Claim Against the Current Jira Ticket Content

| Current ticket claim / AC | Verdict | Rationale |
|---|---|---|
| "Each line item shows the current applicable price, not the promotional price from the original order" | Confirmed at code level, **unproven at test level** | `reorderModal.js:306-316` does this. No test. This story adds the test. |
| "Lines where the price differs from the original order display both the original price (struck through) and the current price" | **Missing in current UI** | Not implemented in `reorderModal.html`. This story adds it. |
| "'3 items have updated pricing since your last order'" banner | **Missing** | Not implemented. This story adds it. |
| "No promotional pricing code is applied unless the retailer's account currently qualifies under an active `Price_Record__c`" | **Contradicted by data model** | There is no `Price_Record__c` object in OHFY-Ecom; pricing is pricelist-based. Rewrite as "unless an active pricelist item exists for the account's current pricelist". |
| Order history immutability / audit compliance | Out of scope for this ticket | Already satisfied by existing `OrderHistoryController` being read-only. Covered in sprint1 polish. |

---

## Dependencies

| Link | Check | Result |
|---|---|---|
| Blocked by BMS-3930 (credit terms) | Does upstream deliver anything this narrow story needs? | **No.** Drop the link. Credit-terms UI is unrelated to pricing recalculation or stock re-checks. |
| Parent BMS-3702 (Gulf ECOM epic) | Consistent | Confirmed. |
| Sprint 1 BMS-3929 polish (full reorder build) | Is this story a subset? | Yes. This ticket covers validation items called out in the sprint1 polish as "Missing — not implemented today" for price-delta UX and as an implicit gap in the stock-check flow. |
| Spike BMS-4049 / Cart Ph 1 BMS-4050 | Does this story's code need to wait for the spike? | **No**, but once the spike lands this ticket's tests may need a small adjustment if pricelist resolution moves. Acceptable risk. |
| `Order__c.Reorder_Source__c` cross-package work | Needed here? | No. That's a different story in the sprint1 polish. This ticket touches no object schema. |

---

## Open Questions for Team Refinement

1. **Pricelist-miss wording** (see Open Question #1 in the Jira-Ready section).
2. **Partial-success UX** — modal stays open or closes?
3. **Error-code vocabulary** — lock the strings so telemetry is consistent.
4. **Do we emit a platform event / log row on pricelist miss** or is console-only acceptable for v1?
5. **Historical-price treatment in the cart review page** — keep the strike-through once the line is in the cart, or drop it?

## Readiness Recommendation

**GO for Sprint 2.** Self-contained, ~2 days, no schema work, no cross-package dependency, no blocker link. The two ACs map directly to two new Apex tests + one LWC spec, plus a thin UI treatment for the price delta. Recommend committing this alongside the sprint1 BMS-3929 polish if that story also lands in Sprint 2; otherwise ship it standalone as the reorder-hardening follow-up.
