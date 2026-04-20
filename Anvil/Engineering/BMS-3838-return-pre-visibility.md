---
ticket: BMS-3838
title: "Return Pre-Visibility"
type: Story
status: In Progress
priority: TBD
assignee: Alvaro Sanchez
reporter:
epic:
sprint:
labels: [wms, delivery, returns]
repo: OHFY-Split
packages_touched: [OHFY-WMS, OHFY-WMS-UI]
branch: story/BMS-3838
pr:
commits: []
deploy_status: deployed-scratch
created: 2026-04-16
updated: 2026-04-16
started:
completed:
jira: https://ohanafy.atlassian.net/browse/BMS-3838
tags:
  - engineering
  - wms
  - returns
---

# BMS-3838: Return Pre-Visibility

## Related
- Jira: https://ohanafy.atlassian.net/browse/BMS-3838
- Branch: `story/BMS-3838`
- PR: _(not opened yet)_

---

## Story Statement
Give warehouse/delivery users visibility into returns *before* the delivery is completed, so pick/load operations can account for returning product at the truck level instead of discovering it at receipt.

## Why It Matters
Today returns are only reconciled after delivery close-out. Seeing anticipated returns pre-delivery lets the warehouse prep correctly-sized receiving and reduces unexpected inventory adjustments.

---

## Scope

### Packages Touched
- [ ] OHFY-Data-Model
- [ ] OHFY-Utilities
- [ ] OHFY-Service-Locator
- [ ] OHFY-PLTFM
- [ ] OHFY-OMS
- [x] OHFY-WMS
- [ ] OHFY-REX
- [ ] OHFY-PLTFM-UI
- [ ] OHFY-OMS-UI
- [x] OHFY-WMS-UI
- [ ] OHFY-REX-UI

### Implementation Plan
1. Backend executable on WMS side to query pre-delivery return candidates.
2. WMS-UI wrapper method exposing the executable to LWC via `WMS_UI_Wrappers`.
3. New `returnPreVisibility` LWC + FlexiPage to surface the data.
4. Apex + Jest + E2E coverage.

---

## Files Changed

| Path | Change | Why |
|---|---|---|
| `OHFY-WMS/force-app/main/default/classes/executables/delivery/E_Delivery_ReturnPreVisibility.cls` | **new** (426 lines) | Core executable that computes anticipated returns per delivery. |
| `OHFY-WMS/force-app/main/default/classes/executables/delivery/E_Delivery_ReturnPreVisibility_T.cls` | **new** | Apex test class for the executable. |
| `OHFY-WMS-UI/force-app/main/default/classes/wrappers/WMS_UI_Wrappers.cls` | **modified** | Added `@AuraEnabled` wrapper method exposing the executable to the LWC. |
| `OHFY-WMS-UI/force-app/main/default/classes/wrappers/tests/ReturnPreVisibility_Wrappers_T.cls` | **new** (122 lines) | Tests for the new wrapper entry point. |
| `OHFY-WMS-UI/force-app/main/default/lwc/returnPreVisibility/` | **new** | New LWC (`.js`, `.html`, `.css`, `.js-meta.xml`) rendering the pre-visibility view. |
| `OHFY-WMS-UI/force-app/main/default/flexipages/Return_Pre_Visibility.flexipage-meta.xml` | **new** | Hosting FlexiPage for the LWC. |
| `e2e/tests/returnPreVisibility.spec.ts` | **new** (184 lines) | Playwright E2E covering the pre-visibility flow. |

---

## Scope Boundary — What This Ticket Is Not
- **Read-only pre-visibility.** `E_Delivery_ReturnPreVisibility.cls:1-8` is explicit: *"warehouse-wide views of the inventory currently on each active delivery truck so supervisors can plan unloading and restocking before returns arrive."* No DML, only `get*` methods.
- **Reuses the same query surface as `E_Delivery_ItemReturn`.** Both pre-visibility and the item-return LWC call `E_Delivery_ItemReturn.getUnsoldInventories` / `getUnsoldLotInventories` / `getItemReturnReasons`. If those queries change (e.g. add fields, change filters), both features move together — intentional. Don't duplicate the query shape here.
- **The actual write path is `ItemReturnController.returnProducts`** (called from the `itemReturn` LWC via `WMS_UI_Wrappers.returnProducts`). BMS-3838 does not touch it.

---

## Open Questions / Discussion — Adhoc Product Tracking

### Context (Jira BMS-3838)
> "Gulf warehouses enforce hard pick-lock cutoffs (as early as 10:30 AM) … drivers on route-based delivery already capture return data on handhelds (quantities, reason codes, breakage photos); the infrastructure exists to transmit this data before the truck returns to the warehouse."

The story's premise: warehouse leads can plan labor/bays from data **captured on the handheld before the truck arrives**. Pre-visibility reads the truck's current `Inventory__c` / `Lot_Inventory__c` state.

### Q1: How will adhoc products be tracked? Could they be low or huge?
- In `itemReturn.js`, adhoc products live in the **client-side** `adhocProductList: []` (see `itemReturn.js:39, 728-867`). Drivers pick freely from `Item__c` via `c-multi-select-lookup` (search fields: `Name`, `ohfy__Item_Number__c` — `itemReturn.js:57`).
- **No server-side cap** on multi-select count or catalog breadth. Typical case is small (1–10), but a driver could conceivably select hundreds.
- On submit, `adhocProductList` is `JSON.stringify`'d and sent to `WMS_UI_Wrappers.returnProducts` (`itemReturn.js:1174-1180`). `ItemReturnController.returnProducts` deserializes, loops each row, and does Inventory/Lot_Inventory DML per row.
- **Risk with "huge":** CPU/DML governor limits on submit, not during pre-visibility. Pre-visibility never sees adhoc rows — by definition they aren't on the truck's inventory.
- **Pre-visibility blind spot:** supervisors planning off of pre-visibility see **expected** returns only. Adhoc returns (breakage found, missing product at stops, etc.) will not appear until the driver submits. The ticket description ("drivers capture return data on handhelds") suggests pre-visibility *is* expected to cover those — worth clarifying with the PM.

**Action item:** confirm with stakeholders whether pre-visibility should reflect *captured-but-not-yet-submitted* adhoc returns. If yes, this ticket's scope grows (need a "draft return" concept on the handheld before truck arrival). If no, document the limitation in the UI copy (e.g., "Expected returns only — actual returns may differ").

### Q2: On submit of item return, do the truck inventory queries get wiped?
**They don't get wiped; they get filtered out.**
- `getUnsoldInventories` and `getUnsoldLotInventories` both filter with `Quantity_On_Hand__c > 0` (`E_Delivery_ItemReturn.cls:25, 63`).
- `ItemReturnController.returnProducts` adjusts the truck's Inventory/Lot_Inventory qty down to 0 as part of the return and creates new Inventory/Lot_Inventory rows at the return **location**. The truck rows still exist with qty=0, so they're excluded from subsequent queries — effectively "wiped" from the view.
- `ItemReturnController.deleteUnsellableLots()` (`ItemReturnController.cls:868`) does hard-delete unsellable Lot_Inventory__c rows.
- **Pre-visibility consequence:** after a driver submits, that truck's pre-visibility counts drop to 0 (the refresh button will now reflect the post-submit state). Supervisors looking at the screen mid-route will see values shrinking.

### Q3a: Where is product return submitted — truck or warehouse? (business-logic trace)
**Answer: either. The code doesn't gate by location, only by status/credit state.**
- `itemReturn.js-meta.xml:17-19` exposes the LWC to both `Large` and `Small` form factors on `RecordPage` / `RecordAction` / `FlowScreen`. Mobile (handheld on the truck) and desktop (warehouse) both work.
- Status sequence enforced by triggers:
  1. `Picking → Loaded → Out For Delivery` — Delivery can't advance to `Out For Delivery` unless all invoices are `Loaded` or `Cancelled` (`DeliveryTriggerService.cls:553-562`).
  2. Driver opens Item Return on the Delivery/Invoice while status = `Out For Delivery`. No Apex gate on *when* they submit.
  3. **Invoice `→ Delivered` is blocked** if any `Credit__c` tied to that invoice has `Was_Picked_Up__c = false` AND its `Reason_Code__mdt` is active + `Can_Inventory_Return__c = true` (`InvoiceBeforeUpdate.cls:283-290`). Error: *"Credits must be returned back to the truck before marking this invoice as delivered."* Submitting the item return flips `Was_Picked_Up__c = true` and clears the gate.
  4. **Delivery `→ Delivered`** blocked unless all invoices are `Delivered`/`Cancelled` (`DeliveryTriggerService.cls:563-570`).
  5. Then `Delivered → Complete`.
- What submit does (`ItemReturnController.returnProducts`): adjusts truck Inventory/Lot_Inventory down to 0, creates/updates Inventory at the driver-selected return **location** (warehouse sub-location, per-row), and writes `Transfer__c` records for the truck → warehouse move. `truckLocationId` is passed in from the LWC (source), destination `locationId` is per-product.

### Q3b: Scope tension for BMS-3838
The Gulf story is premised on: *"drivers on route-based delivery already capture return data on handhelds … the infrastructure exists to transmit this data before the truck returns to the warehouse."* That phrasing implies **capture without commit** (data is recorded on the handheld, transmitted for pre-visibility, but the actual inventory write happens later, e.g. at receipt).

**Today's flow is commit-on-submit.** Once the driver taps submit from the handheld mid-route:
- Truck Inventory/Lot_Inventory goes to 0 immediately.
- Credits flip to `Was_Picked_Up__c = true`.
- Invoices can advance to `Delivered`.
- Pre-visibility will show **0 expected returns** — even though the truck is still physically on the road.

Three possible reconciliations (pick one, confirm with PM):
1. **Pre-visibility reflects submitted-and-committed returns only** — current behavior. Document the limitation: supervisors see what has been processed, not what drivers have captured but not yet submitted. Labor-planning value is limited if drivers don't submit until arrival.
2. **Drivers delay submit until at the warehouse** — operational policy, no code change. Pre-visibility stays empty on the road, which defeats the story.
3. **Introduce a "draft return" concept** — new object/state where handheld capture is staged without adjusting inventory, and pre-visibility reads the drafts. Real commit happens later (e.g., on `Delivered` or at warehouse). This is a net-new data model; **not in this ticket's scope**.

### Q4: Should pre-visibility read truck Inventory or Transfer records?
**Conceptual gap discovered (2026-04-16, mid-build):** today's executable reads truck Inventory>0, which represents *what is currently sitting on the truck*. Once a driver submits an item return, that goes to 0 and pre-visibility goes blank — even though the actual returns are now in `Transfer__c` rows. The user (Alvaro) flagged this: *"I need to show what is product returned, not what is going to be product returned."*

**Caveat:** by the time a `Transfer__c` exists, the warehouse-side `Inventory__c` has already been incremented. The product is *on the books* at the warehouse, just not physically in the bay. So a Transfers-based view is "already arrived per system" not "incoming."

**Right framing for labor planning:** total expected receipt = (still on truck) + (already-submitted Transfers for this trip). Two complementary sources, not one-or-the-other.

#### Truck-reuse problem
`Transfer__c` has **no `Delivery__c` lookup** (verified — fields: `Origin_Location__c`, `New_Location__c`, `Item__c`, `Transfer_Date__c`, `Transfer_Group__c`, qty fields, `Description__c`, `Is_Sellable__c`, `Should_Bypass_Adjustment__c`). Same truck across multiple deliveries → Transfer rows pile up on the same `Origin_Location__c` with no per-trip key.

#### Three paths, ranked
1. **Add `Transfer__c.Delivery__c` lookup (recommended).**
   - Tier 0 Data-Model change → ripples through, but cleanest.
   - `ItemReturnController.returnProducts` already receives `deliveryId` → stamp it on Transfers as they're created.
   - Pre-visibility scopes by `WHERE Delivery__c = :activeDeliveryId`.
   - Permanently solves truck reuse, multi-trip days, overnight routes.
   - **Concrete change set** if approved:
     - New `Delivery__c` lookup field on `Transfer__c` (OHFY-Data-Model).
     - In `ItemReturnController.cls`, set `transfer.Delivery__c = this.deliveryId` where Transfers are constructed.
     - Add a "Submitted Returns" panel in `returnPreVisibility` LWC sourcing from a new wrapper method `getSubmittedReturns(activeDeliveryId)` that queries Transfers by `Delivery__c`.
     - Update `E_Delivery_ReturnPreVisibility_T` and the wrapper test for the new method.
2. **Time-scoped query, no model change.** Filter `Transfer__c` by `Origin_Location__c = :truckLocation AND CreatedDate >= :activeDelivery.CreatedDate`. Works for same-day single-trip routes. Fragile under multi-trip days or overnight cuts. Document the limitation.
3. **Status quo (current ticket).** Truck Inventory only. Pre-visibility goes blank as drivers submit. Lowest cost, weakest story-fit. OK as a v1 if Option 1 is filed as a follow-up.

#### Recommendation
Option 1 if PM/architect signs off on the Data-Model change. Otherwise ship Option 2 with the limitation called out in UI copy + a follow-up ticket for the FK.

### Q3c: Which query is used — `Inventory__c` or `Lot_Inventory__c`?
**Both, and they represent different item types:**
- Non-lot-tracked items (`Item__c.Is_Lot_Tracked__c = false`) → tracked directly on `Inventory__c.Quantity_On_Hand__c`.
- Lot-tracked items → `Inventory__c` holds the parent record, but actual qty is on child `Lot_Inventory__c` rows (one per lot/code-date).
- `buildInventoryRollup` in `E_Delivery_ReturnPreVisibility.cls:201-258` correctly splits: non-lot items roll up from `Inventory__c`; lot-tracked items roll up from `Lot_Inventory__c` (sellable vs. unsellable based on `Lot__r.Is_Sellable__c`).
- **Observed seed-data quirk (2026-04-16, apr16Org):** a truck with `distinctItemCount=2` but `totalQty=0 / sellable=0 / unsellable=0` — because the parent `Inventory__c` rows have qty>0 but no `Lot_Inventory__c` children with qty>0. Current logic counts the distinct item even when no qty rolls up. **Worth reviewing** whether this is acceptable or we should hide items with no rollup-able qty.

---

## Working Notes

### 2026-04-16
- Followed the UI Wrapper Pattern: LWC → `WMS_UI_Wrappers` → `E_Delivery_ReturnPreVisibility` executable. No direct service imports from the LWC.
- Packaged-metadata-only work so far (no Data-Model or Platform changes). Stays within Tier 3 (WMS) + Tier 4 (WMS-UI), so the blast radius is isolated.
- FlexiPage added as separate metadata so it can be assigned via the metadata-sync layout/flexipage activation step that ships with `fullDeploy.js`.
- Added a Refresh button to the left panel (copied pattern from `deliveryOptimizer.html:137-143`: `lightning-button-icon` + `utility:refresh` + `border-filled`). Needed because pre-visibility counts go stale the moment an item-return is submitted elsewhere.
- Bug fix: `buildLineFromInventory` / `buildLineFromLotInventory` were reading `Item__r.Item_Number__c` that wasn't in the parent SOQL. Fixed by querying `Item__c` separately in `fetchItemsForLines` rather than coupling the query shape to `E_Delivery_ItemReturn.getUnsoldInventories`.
- Bug fix (unrelated, same session): `itemReturn.js:366` used `quantityOnHand` in the unsellable branch where only `qoh` was in scope — runtime ReferenceError. Replaced with `qoh`.

---

## Testing
- [ ] Apex tests passing locally (`E_Delivery_ReturnPreVisibility_T`, `ReturnPreVisibility_Wrappers_T`)
- [ ] LWC Jest tests passing
- [x] E2E coverage authored (`e2e/tests/returnPreVisibility.spec.ts`)
- [x] Manual scratch-org verification — deploy succeeded to `apr16Org`

**Test notes:**
- E2E spec is 184 lines; covers the golden path of viewing pre-visibility from a delivery context.
- Still need to run the full Apex test suite against `apr16Org` and a Jest pass locally before opening the PR.

---

## Deployment

### Current Status
- **Target org:** `apr16Org` (scratch)
- **Last deploy:** 2026-04-16 — ✅ success in **8:31**
- **Command used:**
  ```bash
  npm run deploy:full -- --target-org apr16Org --ignore-conflicts --skip-data
  ```
- **Result:** All 5 deploy groups succeeded; 8 FlexiPages activated by the metadata-sync post-step (includes the new `Return_Pre_Visibility` FlexiPage).

### Deploy Group Layout (from `utilityScripts/fullDeploy.js`)
| Group | Packages | Runs In |
|---|---|---|
| 1 | Data-Model, Utilities | parallel |
| 2 | Service-Locator | serial |
| 3 | PLTFM | serial |
| 4 | OMS, WMS, REX | parallel |
| 5 | PLTFM-UI, OMS-UI, WMS-UI, REX-UI | parallel |

### Faster Iteration Options (for this ticket)
Only WMS + WMS-UI changed, so the full deploy is overkill going forward. Prefer one of:

```bash
# Only the two packages that changed (~30–60s each)
sf project deploy start \
  -d OHFY-WMS/force-app \
  -d OHFY-WMS-UI/force-app \
  -o apr16Org --ignore-conflicts

# Single LWC iteration (~15–30s)
sf project deploy start \
  -d OHFY-WMS-UI/force-app/main/default/lwc/returnPreVisibility \
  -o apr16Org
```

Use `npm run deploy:full` only when:
- FlexiPage / layout assignment needs to re-run (metadata-sync post-step).
- A fresh scratch org is being set up.
- Tier 0–2 changes need to propagate.

### Checklist
- [x] Deployed to scratch (`apr16Org`)
- [ ] Deployed to sandbox
- [ ] Deployed to UAT
- [ ] Released


### Scripts
``` SQL
SELECT Id, Name, ohfy__Parent_Location__c
FROM ohfy__Location__c
```



---

## End-of-Ticket Summary
_Filled at finalization._

**What shipped:**

**Deferred / follow-up:**

**Lessons / surprises:**
