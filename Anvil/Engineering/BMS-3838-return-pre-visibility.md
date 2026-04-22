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
| `OHFY-WMS-UI/force-app/main/default/flexipages/Return_Pre_Visibility.flexipage-meta.xml` | **new** | Hosting FlexiPage (AppPage) that renders the `ohfy:returnPreVisibility` LWC. Required — see wiring note below. |
| `OHFY-WMS-UI/force-app/main/default/tabs/Return_Pre_Visibility.tab-meta.xml` | **new** | CustomTab that registers `/lightning/n/ohfy__Return_Pre_Visibility` and points at the FlexiPage. |
| `e2e/tests/returnPreVisibility.spec.ts` | **new** (184 lines) | Playwright E2E covering the pre-visibility flow. |

---

## Metadata Wiring — Tab → FlexiPage → LWC ❗NOTED

**Summary:** `/lightning/n/ohfy__Return_Pre_Visibility` works because the **CustomTab** registers the URL and the **FlexiPage** is what renders inside it — nuking either one breaks the route.

- **`tabs/Return_Pre_Visibility.tab-meta.xml`** — the `n` in `/lightning/n/<TabApiName>` means "navigation item" (CustomTab). This file is what makes the URL resolvable. Its `<flexiPage>Return_Pre_Visibility</flexiPage>` element says *what* to render when the route is hit.
- **`flexipages/Return_Pre_Visibility.flexipage-meta.xml`** — an `AppPage` FlexiPage whose only region contains the `ohfy:returnPreVisibility` LWC. Without this, the tab deploy fails (the `<flexiPage>` reference can't resolve) and even if it deployed the URL would render nothing.
- **Why both are required:** Salesforce does not support pointing a CustomTab directly at an LWC. An LWC-backed tab is always the three-file chain `Tab → FlexiPage (AppPage) → LWC`. That's the minimum wiring.
- **Tab visibility (`Default On` on the Admin profile) is separate** — it controls *who sees it in the nav*, not whether the route exists. **Now source-controlled** via `utilityScripts/assignOrgMetadata.js` Step 1 (`deployProfileAssignments` + `collectTabVisibilities`): every tab found in `org-metadata/scratch/tabs/` or in any `*/force-app/main/default/tabs/*.tab-meta.xml` is set to `DefaultOn` on the Admin profile as part of `npm run deploy:full`. No more manual Setup clicks for new tabs.

---

## Pattern for Other Engineers — Standalone Tabbed LWC

This ticket establishes the template for home page-level LWCs (not record-page embeds). If you're adding a new standalone screen accessed from its own tab, copy this PR's layout verbatim.

### Required files (per package's `force-app/main/default/`)
1. **LWC** — `lwc/<name>/` (`.js`, `.html`, `.css`, `.js-meta.xml`).
2. **FlexiPage** — `flexipages/<Name>.flexipage-meta.xml` with `<type>AppPage</type>` referencing the LWC in its only region.
3. **CustomTab** — `tabs/<Name>.tab-meta.xml` with `<flexiPage>` pointing at the FlexiPage.
4. **E2E spec + per-spec fixtures** (new pattern this PR introduces):
   - Spec at `e2e/tests/<name>.spec.ts`. Entry URL = `/lightning/n/ohfy__<TabApiName>`.
   - Fixture folder at `e2e/fixtures/<name>/` with `setup.apex`, `teardown.apex`, `fixture.ts`. Reference implementation: `e2e/fixtures/returnPreVisibility/`.

### What you no longer need to do manually
- Flipping Setup → Profiles → Admin → Object Settings → Tab Settings → `Default On`. `assignOrgMetadata.js` Step 1 now unions all synced tabs + any source-controlled `*.tab-meta.xml` across `OHFY-*` packages and flips them to `DefaultOn` automatically on the Admin profile. Runs as part of `npm run deploy:full`.

### Gotchas to flag in code review
- **FlexiPage must be `AppPage`, not `RecordPage`.** Different types, different activation paths. RecordPages go through the `activateFlexiPages()` step; AppPages just need to exist.
- **Salesforce won't let a CustomTab point directly at an LWC.** The FlexiPage is the required middle layer — the chain is `Tab → FlexiPage (AppPage) → LWC`. Don't try to shortcut it.
- **E2E URL uses the namespaced tab name** (`/lightning/n/ohfy__<TabApiName>`) because the scratch org is namespaced.
- **Tab visibility automation is Admin-profile-only.** If the feature needs non-Admin profiles or ships in a packaged install, write a PermissionSet with `<tabSettings>` and assign it in the seed flow. Not in scope for this PR.

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

### 2026-04-21 — `assignOrgMetadata.js` refactor safety review

**Plain-language summary:** the old script had one function that assigned layouts to the Admin profile. I split it so the same function now also assigns tab visibilities (`DefaultOn`) in the same deploy. Concern was whether the layout behavior still works the same. **Answer: yes, it does.** The layout-generating code is the same logic, pulled out into a helper. Same files read, same XML built, same deploy command. The only new thing is that tab visibilities get tacked onto the same profile payload before the deploy goes out. Layouts can't stop being assigned because nothing in that path changed.

**What changed in `utilityScripts/assignOrgMetadata.js`:**
- `deployLayoutAssignments()` → `deployProfileAssignments()`.
- Layout-building logic extracted into `collectLayoutAssignments()` (`:75-97`).
- New `collectTabVisibilities()` (`:99-132`) unions tabs from `org-metadata/scratch/tabs/` + every `OHFY-*/force-app/main/default/tabs/*.tab-meta.xml`.
- `deployProfileAssignments()` (`:134-157`) concatenates both entry lists into one Profile payload and deploys once.

**Why the layout path is not at risk:**
| Aspect | Before | After | Risk? |
|---|---|---|---|
| Source dir | `SCRATCH_DIR/layouts` | Same (`collectLayoutAssignments:76`) | None |
| File filter | `.endsWith(".layout")` | Same (`:79`) | None |
| Record-type mapping | `ACCOUNT_LAYOUT_MAP` | Same (`:85`) | None |
| `<layoutAssignments>` XML template | 2 branches (with / without `<recordType>`) | Character-identical branches (`:86-93`) | None |
| Profile envelope | `<Profile xmlns=…>…</Profile>` | Same (`:146`) | None |
| `package.xml` | Profile members, v65.0 | Same (`:147`) | None |
| Deploy command | `sf project deploy start --metadata-dir ./${WORKING_DIR} -o ${orgAlias} -w 10` | Same (`:154`) | None |
| Cleanup sequence | `cleanup → mkdir → write → deploy → cleanup` | Same (`:149-155`) | None |
| Iteration order | `readdirSync` filesystem order | Same | None |

**Only three actual behavioral differences** (none affect layout correctness):
1. **Skip condition widened.** Old: skipped when `layoutsDir` didn't exist. New: skips only when *both* layouts and tabs are empty (`:140`). If `layoutsDir` is missing but tabs exist, we now deploy a tabs-only profile — old code assigned zero layouts in that case either way, so nothing regressed.
2. **Body order.** `[...layouts.entries, ...tabs.entries].join("\n")` puts layout elements first, tab elements after (`:145`). Profile XML is order-insensitive, so Salesforce doesn't care.
3. **Log strings** changed (`"layouts"` → `"layouts + tab visibilities"`, new count in final log). Cosmetic.

**Edge case considered:** `layoutsDir` exists but contains zero `.layout` files, tabs empty. Old behavior: deployed an empty-body Profile (no-op). New behavior: skips deploy entirely. Either way, zero layouts assigned. Safe.

**Net:** the refactor strictly *adds* tab-visibility assignment to the same deploy. It doesn't reorder, weaken, or remove any layout assignment step. Low risk.

---

## Testing
- [ ] Apex tests passing locally (`E_Delivery_ReturnPreVisibility_T`, `ReturnPreVisibility_Wrappers_T`)
- [ ] LWC Jest tests passing
- [x] E2E coverage authored (`e2e/tests/returnPreVisibility.spec.ts`) — **15 tests**
- [x] E2E green against `apr16Org` — 15/15 passed, ~1m10s, zero retries
- [x] E2E green against `apr20TestOrg` — 15/15 passed, ~1m06s, zero retries
- [x] Manual scratch-org verification — deployed to both `apr16Org` and `apr20TestOrg`

**Test notes:**
- Spec covers: happy path, all four Group By modes, both Sort By modes, refresh preservation, table-layout (Code Date in, Sellability out), Cases/Units quantity split, KPI cases + optional units row, unsellable-row tint class, and the read-only contract.
- Seed lives at `e2e/fixtures/returnPreVisibility/setup.apex` (deterministic truck + inventory + reason-coded adjustments); `teardown.apex` inverts.
- Still need to run the full Apex test suite against `apr16Org` and a Jest pass locally before opening the PR.
- **Scratch-org prerequisite:** `apr20TestOrg` needed `sf data import tree --plan data/sample-data-plan.json` + `postLoadResolver.apex` before the seed would work — the seed queries `Warehouse 1`, `Customer Account 0`, and a `Route__c` that only exist in sample data.

### Running the spec

```bash
# Against your current scratch (replace alias as needed)
SF_ORG_ALIAS=apr20TestOrg npm run test:e2e:headed -- \
  e2e/tests/returnPreVisibility.spec.ts \
  --project=chromium \
  --retries=0
```

`--retries=0` gives a clean first-pass signal; drop it to let Playwright retry once on flake. Headed mode is useful to watch the Lightning nav + combobox reflow in real time.

### E2E test cases (in spec order) | **Generate/Link to Xray**

Source: `e2e/tests/returnPreVisibility.spec.ts`. `beforeAll` seeds a deterministic truck + inventory + reason-coded adjustments via `e2e/fixtures/returnPreVisibility/`; `afterAll` tears down.

**Core render + happy path**
1. `renders the component shell on the app page` — LWC root, left panel, main panel (attached), warehouse select, and refresh button all render on `/lightning/n/ohfy__Return_Pre_Visibility`.
2. `shows the initial warehouse-selection prompt` — `rpv-warehouse-prompt` is visible before any warehouse is picked.
3. `drives the full happy path: warehouse → truck → load summary` — after picking warehouse + truck, main-panel truck location, KPI total, group-by, and sort-by render; load summary resolves to either populated `rpv-group` rows or the `rpv-empty-load` affordance.

**Group By**
4. `group-by 'Package Type' replaces sellability labels` — switching group-by to Package Type produces group labels that are neither `Sellable` nor `Non-Sellable`.
5. `group-by 'None' collapses everything into a single 'All Items' group` — a single group renders with label `All Items`.
6. `group-by 'Reason Code' produces non-sellability labels` — group labels are neither `Package Type` nor `Sellability`.

**Sort By**
7. `sort-by 'Item Name (A–Z)' orders rows alphabetically within a group` — with group-by forced to `None`, item-link names are alphabetically sorted.
8. `sort-by 'Quantity (High → Low)' reorders rows vs alphabetical` — switching from A–Z to Quantity High→Low keeps the same row set but allows re-ordering.

**Refresh**
9. `refresh reloads data and preserves warehouse + truck selection` — clicking refresh disables then re-enables the button; warehouse + truck selection are preserved; group-by and sort-by controls still render after reload.

**Table layout & presentation**
10. `table layout: Code Date column present, Sellability column removed` — asserts the new Code Date column header renders and the old Sellability column header is gone (matches the post-redesign table).
11. `quantity cell splits qty into Cases (and Units when applicable)` — each row's quantity cell shows "Cases: X" always and "Units: Y" only when the row has a fractional/unit remainder (`line.hasUnits`).
12. `group header total reads in cases` — group header shows `{count} products · {totalCases} cs` (and `· {totalUnits} ea` when any row contributes units).
13. `KPI shows total cases (with optional units row)` — top-right KPI shows `{loadCases} cs` + "{totalDistinctItems} distinct products", with a secondary `{loadUnits} ea` line only when units roll up.
14. `unsellable rows render with the unsellable tint class` — rows for unsellable lines carry `rpv-row-unsellable` (amber tint + left-accent via CSS), replacing the removed Sellability badge column.

**Read-only contract**
15. `load summary is read-only — no editable inputs in the main panel` — main panel contains zero `input[type=text]`, `input[type=number]`, or `textarea` elements regardless of load state.

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
