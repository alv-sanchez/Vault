# Return Pre-Visibility

## Component
`returnPreVisibility` LWC (`OHFY-WMS-UI`) → `WMS_UI_Wrappers` (3 methods) → `E_Delivery_ReturnPreVisibility` (`OHFY-WMS`)

## Tickets

| Ticket | Date Added | Engineer | Ticket Type |
|---|---|---|---|
| [[BMS-3838]] | 4/15/2026 | Alvaro Sanchez | Story |

---

## 1. Overview

**Purpose:** A read-only, warehouse-wide pre-visibility view of every active delivery truck and its current return load. Lets warehouse supervisors staff unloading bays and allocate restocking labor before return trucks arrive — closing the blind spot where unannounced returns compete with outbound pick operations.

**Target Users:** Warehouse supervisors and dock leads at distributor sites (initial rollout: Gulf Distributing).

**How it works:** The user picks a warehouse → the left panel lists every operational delivery truck for that warehouse → the right panel renders the selected truck's load summary (sellable + unsellable lines with reason codes). The top KPI strip aggregates expected return cases across the whole warehouse. The component is pure read — no edits, no record mutations.

**Reference**: Lovable prototype — [bay-planner-pro.lovable.app](https://bay-planner-pro.lovable.app/) (operative spec).

---

## 2. User Flow

1. **Open the page** — exposed for App Page, Home Page, and Tab. Header shows brand · warehouse · today's date plus a LIVE clock that ticks every 30s.
2. **Select a warehouse** from the picker on the left. The truck list loads.
3. **Browse the warehouse-wide KPIs** at the top: Expected Return Cases, Restockable, Non-Restockable, Routes Reporting (X / total).
4. **Scan the REASON BREAKDOWN chips** to see what's coming back at the warehouse level (BREAKAGE, OUT OF CODE, PRICING ISSUE, MISPICKED, etc.) — color-coded by sellability.
5. **Filter the truck list** with ALL / FIELD / RETURN / ARRIVED.
6. **Click a truck card** to load its detail panel: total cases, distinct items, delivery number, line-by-line table with reason pills, and Restockable / Non-Restockable summary boxes.
7. **Pick a bay** from the BAY dropdown (Bay 1-4 or Unassigned). If the truck's total return volume crosses the threshold, a "HIGH RETURN VOLUME — Consider Additional Unloading Staff" alert appears.
8. **Click Refresh** at any time to re-pull warehouses, trucks, and the selected truck's load. Current selections are preserved when still valid.

---

## 3. Setup Steps (Subscriber Org)

1. **Add the LWC to a Lightning App Page** (or Home Page / Tab) using the Lightning App Builder.
   - Component: **Return Pre-Visibility**
   - Targets supported: `lightning__AppPage`, `lightning__HomePage`, `lightning__Tab`
   - Form factors: Large + Small
2. **Confirm warehouse data**: at least one top-level `Location__c` with `Is_Active__c = TRUE` and `Is_Truck__c != TRUE`. The warehouse picker shows these.
3. **Confirm truck data**: `Equipment__c` records for the warehouse with `Type__c = 'Motorized Vehicle'`, `Status__c = 'Operational'`, and a populated `Truck_Location__c`.
4. **Confirm delivery data**: at least one `Delivery__c` per truck with `Vehicle__c` set and a non-terminal `Status__c` (i.e. not `Complete` or `Cancelled`).
5. **Confirm reason codes**: returns must come through `Inventory_Adjustment__c` with `Reason__c` populated for the REASON BREAKDOWN chips and per-line reason pills to show.

---

## 4. Layout & Sections

| Section | Where | What it shows |
|---|---|---|
| Page header | Top bar | "RETURN PRE-VISIBILITY" + brand · warehouse · day, month date · LIVE clock |
| KPI strip | Stats card, top | Expected Return Cases / Restockable / Non-Restockable / Routes Reporting |
| Reason breakdown | Stats card, bottom | Color-coded chips per reason code with case counts (warehouse-wide) |
| Filter buttons | Left panel, top | ALL / FIELD / RETURN / ARRIVED — filters the truck list by status category |
| Warehouse picker | Left panel | Combobox + refresh icon |
| Truck list | Left panel, scrollable | Per-truck card: name, status badge, route, driver, ETA, totals (TOTAL / RESTOCK / NON-REST) |
| Detail header | Right panel, top | Truck name + status badge, route · driver · ETA, delivery number, big total cs, distinct items |
| Bay + alert row | Right panel, mid | BAY dropdown + HIGH RETURN VOLUME alert (when threshold met) |
| Detail table | Right panel | One row per inventory line: product, package type, size, reason pill, qty in cs (sellable/unsellable color stripe) |
| Summary boxes | Right panel, bottom | Per-truck Restockable + Non-Restockable / Breakage totals |

---

## 5. Data Model — what feeds the view

| sObject | How it's used |
|---|---|
| `Location__c` | Warehouses (top-level, non-truck) populate the picker. Truck Locations (`Is_Truck__c = TRUE`) are queried as `truckLocationId` for inventory rollups. |
| `Equipment__c` | Trucks for a warehouse — filtered to `Type__c = 'Motorized Vehicle'`, `Status__c = 'Operational'`, `Truck_Location__c` populated. |
| `Delivery__c` | Active deliveries per vehicle — non-terminal status (not `Complete` / `Cancelled`). Provides delivery number, route, driver, status. Sorted by status priority then proximity to today. |
| `Inventory__c` | Non-lot-tracked qty currently on the truck location. |
| `Lot_Inventory__c` | Lot-tracked qty currently on the truck location. Sellability driven by `Lot__r.Is_Sellable__c`. |
| `Inventory_Adjustment__c` | Source of reason codes per line — sellable reasons via `Reason_Code__mdt.Can_Resell__c = TRUE`, unsellable otherwise. |
| `Item__c` | Product name, package type, SKU, units-per-case, lot-tracked / sold-in-units flags. |

**Sellability rule**: a line is unsellable if any of (a) `Lot_Inventory.Lot.Is_Sellable__c = FALSE`, or (b) tagged with an unsellable adjustment reason (Breakage, Out of Code, Empty Keg, etc.). Otherwise sellable.

**Rounding noise**: lines below `qty > 1 / Units_Per_Case / 2` (e.g. < ~0.04 cases for a 12-unit case) are dropped. Mirrors the Item Return LWC threshold.

---

## 6. Backend Methods

All exposed via `WMS_UI_Wrappers`. Underlying logic lives in `E_Delivery_ReturnPreVisibility` (`OHFY-WMS`).

| Wrapper Method | Description |
|---|---|
| `WMS_UI_Wrappers.getReturnPreVisibilityWarehouses()` | Returns active top-level non-truck `Location__c` records for the picker. |
| `WMS_UI_Wrappers.getReturnPreVisibilityTrucks(Id warehouseId)` | Returns `TruckSummary[]` for the warehouse — operational trucks with inventory and/or non-terminal active delivery, sorted by status priority then equipment name. Each entry includes route, driver, delivery number, totals. |
| `WMS_UI_Wrappers.getReturnPreVisibilityTruckLoad(Id truckLocationId)` | Returns `TruckLoadSummary { sellableLines[], unsellableLines[] }` — the line-by-line view for a single truck, with reason codes already applied. |

All three are `@AuraEnabled` (non-cacheable — refresh re-pulls fresh data).

**Active delivery selection**: when a truck has multiple non-terminal deliveries, the backend picks the one with the highest status priority (Out For Delivery > Loaded > Picking > In Progress > Scheduled > New > Draft), tie-broken by `Delivery_Date__c` proximity to today, then `CreatedDate` desc.

---

## 7. KPIs & Aggregations

The KPIs and reason chips aggregate across **every truck in the warehouse**, not just the selected one. The LWC parallel-loads each truck's load summary on warehouse change, caches the result, and re-renders the KPIs once the cache is populated.

| KPI | Calculation |
|---|---|
| Expected Return Cases | Σ (sellable cases + unsellable cases) across all cached truck loads |
| Restockable | Σ sellable cases across all cached truck loads |
| Non-Restockable | Σ unsellable cases across all cached truck loads |
| Routes Reporting | Count of trucks with `activeDeliveryId` populated / total trucks for the warehouse |

Per-line case math: `cases = floor(quantityOnHand / unitsPerCase)`. Remainder units only show when `Item.Is_Sold_In_Units__c = TRUE`.

---

## 8. Demo Scaffolding (pending real backend)

The Lovable prototype includes a few elements that ship today as **demo overlays** until the underlying data model catches up. Each is acknowledged in the code comments.

| Item | What's stubbed | Real source needed |
|---|---|---|
| ETAs per truck | Cycled from a hardcoded list (`["2:14 PM", "3:45 PM", …]`) by truck index | Real ETA from delivery / route data |
| Bay options | Hardcoded `Bay 1-4` + `Unassigned`; auto-cycled by truck index; selection does not persist | Real bay model + persistence |
| Brand string | Hardcoded `"GULF DISTRIBUTING"` | Org / Account / Warehouse-driven brand |
| RETURNING / ARRIVED status | Random pick of one in-field truck → RETURNING and another → ARRIVED per warehouse load | Real `Delivery_Status__c = 'Returning'` value + Delivered detection |
| Truck filter scope | UI narrows backend results to `Out For Delivery` only | Widen once Returning/Arrived statuses exist |
| HIGH RETURN VOLUME threshold | Hardcoded at 100 cs | CMDT or warehouse-tunable knob |
| Reason definitions list | Hardcoded JS list, kept in sync manually with `Inventory_Adjustment__c.Reason__c` | Drive from `Reason_Code__mdt.Can_Resell__c` |

These overlays exist on purpose — they enable the warehouse-supervisor lens that the Lovable prototype designed without blocking on backend changes. Track them as follow-ups before broader (non-demo) rollout.

---

## 9. Limitations

- **Read-only**. No edits, no save buttons, no record mutations. Bay selection is local to the session.
- **No user-driven sort/group**. The detail table groups implicitly via row striping (sellable / unsellable) and reason pills. There is no column-header sort or grouping control. Matt Keeter called these optional in the original direction.
- **Photos not surfaced**. Driver-captured breakage photos are not displayed (the LWC has no photo column or DTO field). V2 candidate.
- **Performance ceiling**. The component parallel-loads one Apex call per truck on warehouse change. Very large warehouses (50+ trucks) may need pagination or lazy-load on truck click.

---

## 10. Notes for Engineers

- **Same data layer as Item Return**. `E_Delivery_ReturnPreVisibility.getTruckLoadSummary` delegates to `E_Delivery_ItemReturn.getUnsoldInventories` / `getUnsoldLotInventories` / `getItemReturnReasons` / `getSellableItemReturnReasons`. The two views agree on what's "really there" vs. rounding noise.
- **No new objects, no platform events, no polling**. The earlier auto-generated proposal (`Return_Previsibility__c`, handheld sync pipeline, Platform Event subscription) was disregarded in favor of reuse.
- **Cross-package access**. `E_Delivery_ReturnPreVisibility` is `@NamespaceAccessible` and lives in `OHFY-WMS`; the LWC accesses it via the wrapper proxy in `OHFY-WMS-UI` per the package's wrapper pattern (LWCs cannot directly call `@AuraEnabled` from another managed package).
- **Apex tests**: `E_Delivery_ReturnPreVisibility_T.cls` (`OHFY-WMS`).
- **Jest tests**: not yet added — backfill candidate per repo convention (one `__tests__/` per LWC).

---

## 11. Changelog

| Date | Ticket | Change |
|---|---|---|
| May 2026 | BMS-3838 | Initial implementation — warehouse-wide truck load lens with KPIs, reason chips, status filter, bay selector, and high-return alert. Reuses Item Return data layer. |



```
Run # --config is required: the only Playwright config lives at

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:2)# --config is required: the only Playwright config lives at

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:3)# test-automation/playwright.config.ts (testDir ./tests +

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:4)# globalSetup auth). Without it, a repo-root run finds no

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:5)# config, skips auth setup, and matches no specs. The dir

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:6)# filters are repo-root-relative paths (test-automation/tests/<sku>/).

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:7)npx playwright test \

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:8)--config test-automation/playwright.config.ts \

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:9)--project=chromium \

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:10)test-automation/tests/oms/ test-automation/tests/pltfm/ test-automation/tests/wms/

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:11)shell: /usr/bin/bash -e {0}

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:12)env:

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:13)AWS_DEFAULT_REGION: us-east-2

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:14)AWS_REGION: us-east-2

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:15)AWS_ACCESS_KEY_ID: ***

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:16)AWS_SECRET_ACCESS_KEY: ***

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:17)AWS_SESSION_TOKEN: ***

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:18)SF_ORG_ALIAS: ci-org

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:20)› Warning: @salesforce/cli update available from 2.134.6 to 2.137.7.

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:21)› Warning: @salesforce/cli update available from 2.134.6 to 2.137.7.

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:22)✓ Assigned permission set ohfy__Legacy_Security_Bypass to test-n3tmxxvbsqqj@example.com

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:23)› Warning: @salesforce/cli update available from 2.134.6 to 2.137.7.

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:24)› Warning: @salesforce/cli update available from 2.134.6 to 2.137.7.

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:25)✓ Assigned permission set ohfy__BMS5258_Test_Tabs to test-n3tmxxvbsqqj@example.com

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:26)› Warning: @salesforce/cli update available from 2.134.6 to 2.137.7.

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:27)✓ Auth state saved for org: ci-org

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:28)✓ Test Account: 001VA00001G6m5IYAR

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:29)

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:30)Running 188 tests using 1 worker

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:31)› Warning: @salesforce/cli update available from 2.134.6 to 2.137.7.

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:32)› Warning: @salesforce/cli update available from 2.134.6 to 2.137.7.

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:33)°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°×±··°···°°··°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°°

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:34)› Warning: @salesforce/cli update available from 2.134.6 to 2.137.7.

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:35)› Warning: @salesforce/cli update available from 2.134.6 to 2.137.7.

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:36)› Warning: @salesforce/cli update available from 2.134.6 to 2.137.7.

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:37)› Warning: @salesforce/cli update available from 2.134.6 to 2.137.7.

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:38)› Warning: @salesforce/cli update available from 2.134.6 to 2.137.7.

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:39)› Warning: @salesforce/cli update available from 2.134.6 to 2.137.7.

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:40)› Warning: @salesforce/cli update available from 2.134.6 to 2.137.7.

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:41)› Warning: @salesforce/cli update available from 2.134.6 to 2.137.7.

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:42)› Warning: @salesforce/cli update available from 2.134.6 to 2.137.7.

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:43)°°°°°°°°°°°°°°°°····°°··°°°°°°°°°°°°°°°°°°°°°°°↻ Pick-path scaffolding missing — seeding zones/PLAs/path version (orgScripts/seedPickPathData.apex)

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:44)› Warning: @salesforce/cli update available from 2.134.6 to 2.137.7.

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:45)› Warning: @salesforce/cli update available from 2.134.6 to 2.137.7.

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:46)› Warning: @salesforce/cli update available from 2.134.6 to 2.137.7.

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:47)› Warning: @salesforce/cli update available from 2.134.6 to 2.137.7.

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:48)› Warning: @salesforce/cli update available from 2.134.6 to 2.137.7.

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:49)› Warning: @salesforce/cli update available from 2.134.6 to 2.137.7.

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:50)› Warning: @salesforce/cli update available from 2.134.6 to 2.137.7.

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:51)› Warning: @salesforce/cli update available from 2.134.6 to 2.137.7.

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:52)› Warning: @salesforce/cli update available from 2.134.6 to 2.137.7.

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:53)› Warning: @salesforce/cli update available from 2.134.6 to 2.137.7.

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:54)› Warning: @salesforce/cli update available from 2.134.6 to 2.137.7.

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:55)› Warning: @salesforce/cli update available from 2.134.6 to 2.137.7.

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:56)› Warning: @salesforce/cli update available from 2.134.6 to 2.137.7.

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:57)› Warning: @salesforce/cli update available from 2.134.6 to 2.137.7.

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:58)› Warning: @salesforce/cli update available from 2.134.6 to 2.137.7.

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:59)› Warning: @salesforce/cli update available from 2.134.6 to 2.137.7.

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:60)› Warning: @salesforce/cli update available from 2.134.6 to 2.137.7.

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:61)› Warning: @salesforce/cli update available from 2.134.6 to 2.137.7.

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:62)› Warning: @salesforce/cli update available from 2.134.6 to 2.137.7.

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:63)› Warning: @salesforce/cli update available from 2.134.6 to 2.137.7.

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:64)› Warning: @salesforce/cli update available from 2.134.6 to 2.137.7.

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:65)› Warning: @salesforce/cli update available from 2.134.6 to 2.137.7.

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:66)› Warning: @salesforce/cli update available from 2.134.6 to 2.137.7.

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:67)› Warning: @salesforce/cli update available from 2.134.6 to 2.137.7.

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:68)› Warning: @salesforce/cli update available from 2.134.6 to 2.137.7.

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:69)············↻ Auth state is 8m old — capturing a fresh session for ci-org

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:70)› Warning: @salesforce/cli update available from 2.134.6 to 2.137.7.

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:71)› Warning: @salesforce/cli update available from 2.134.6 to 2.137.7.

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:72)› Warning: @salesforce/cli update available from 2.134.6 to 2.137.7.

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:73)› Warning: @salesforce/cli update available from 2.134.6 to 2.137.7.

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:74)·°°°°°°°°°°°°°°°°°°°°

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:75)°°°✓ RPV setup completed against org ci-org

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:76)› Warning: @salesforce/cli update available from 2.134.6 to 2.137.7.

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:77)·····················✓ RPV teardown completed against org ci-org

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:78)×✓ RPV setup completed against org ci-org

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:79)› Warning: @salesforce/cli update available from 2.134.6 to 2.137.7.

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:80)✓ RPV teardown completed against org ci-org

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:81)F✓ RPV setup completed against org ci-org

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:82)› Warning: @salesforce/cli update available from 2.134.6 to 2.137.7.

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:83)···✓ RPV teardown completed against org ci-org

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:84)·

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:85)

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:86)1) [chromium] › test-automation/tests/wms/return-pre-visibility.spec.ts:519:9 › Return Pre-Visibility › unsellable rows tag the qty cell with the red-treatment inline style and a Non-restockable pill

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:87)

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:88)Error: expect(received).toContain(expected) // indexOf

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:89)

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:90)Expected substring: "color:#dc2626"

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:91)Received string: "color:rgb(var(--ohfy-danger,1634545));"

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:92)

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:93)535 |

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:94)536 | const qtyStyle = (await firstUnsellable.locator("td").last().getAttribute("style")) || "";

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:95)> 537 | expect(qtyStyle.replace(/\s+/g, "")).toContain("color:#dc2626");

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:96)| ^

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:97)538 |

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:98)539 | // RESTOCKABLE column is the second-to-last cell in each row.

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:99)540 | const restockCellText = (

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:100)at /home/runner/work/OHFY-Split/OHFY-Split/test-automation/tests/wms/return-pre-visibility.spec.ts:537:46

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:101)

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:102)attachment #1: screenshot (image/png) ──────────────────────────────────────────────────────────

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:103)test-results/wms-return-pre-visibility--dee34--and-a-Non-restockable-pill-chromium/test-failed-1.png

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:104)────────────────────────────────────────────────────────────────────────────────────────────────

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:105)

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:106)Error Context: test-results/wms-return-pre-visibility--dee34--and-a-Non-restockable-pill-chromium/error-context.md

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:107)

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:108)Error Context: test-results/wms-return-pre-visibility--dee34--and-a-Non-restockable-pill-chromium/error-context.md

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:109)

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:110)Retry #1 ───────────────────────────────────────────────────────────────────────────────────────

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:111)

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:112)Error: expect(received).toContain(expected) // indexOf

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:113)

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:114)Expected substring: "color:#dc2626"

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:115)Received string: "color:rgb(var(--ohfy-danger,1634545));"

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:116)

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:117)535 |

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:118)536 | const qtyStyle = (await firstUnsellable.locator("td").last().getAttribute("style")) || "";

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:119)> 537 | expect(qtyStyle.replace(/\s+/g, "")).toContain("color:#dc2626");

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:120)| ^

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:121)538 |

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:122)539 | // RESTOCKABLE column is the second-to-last cell in each row.

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:123)540 | const restockCellText = (

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:124)at /home/runner/work/OHFY-Split/OHFY-Split/test-automation/tests/wms/return-pre-visibility.spec.ts:537:46

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:125)

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:126)attachment #1: screenshot (image/png) ──────────────────────────────────────────────────────────

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:127)test-results/wms-return-pre-visibility--dee34--and-a-Non-restockable-pill-chromium-retry1/test-failed-1.png

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:128)────────────────────────────────────────────────────────────────────────────────────────────────

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:129)

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:130)Error Context: test-results/wms-return-pre-visibility--dee34--and-a-Non-restockable-pill-chromium-retry1/error-context.md

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:131)

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:132)Error Context: test-results/wms-return-pre-visibility--dee34--and-a-Non-restockable-pill-chromium-retry1/error-context.md

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:133)

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:134)attachment #4: trace (application/zip) ─────────────────────────────────────────────────────────

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:135)test-results/wms-return-pre-visibility--dee34--and-a-Non-restockable-pill-chromium-retry1/trace.zip

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:136)Usage:

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:137)

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:138)npx playwright show-trace test-results/wms-return-pre-visibility--dee34--and-a-Non-restockable-pill-chromium-retry1/trace.zip

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:139)

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:140)────────────────────────────────────────────────────────────────────────────────────────────────

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:141)

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:142)2) [chromium] › test-automation/tests/oms/driver-home-page.spec.ts:26:9 › Driver Home Page › should load page with date selector and today button

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:143)

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:144)Error: expect(locator).toBeVisible() failed

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:145)

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:146)Locator: getByTestId('driver-home-prev-day-btn')

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:147)Expected: visible

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:148)Timeout: 15000ms

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:149)Error: element(s) not found

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:150)

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:151)Call log:

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:152)- Expect "toBeVisible" with timeout 15000ms

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:153)- waiting for getByTestId('driver-home-prev-day-btn')

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:154)

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:155)

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:156)27 | await expect(sfPage.getByRole("heading", { name: "Driver Home" })).toBeVisible();

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:157)28 |

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:158)> 29 | await expect(sfPage.getByTestId("driver-home-prev-day-btn")).toBeVisible();

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:159)| ^

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:160)30 | await expect(sfPage.getByTestId("driver-home-next-day-btn")).toBeVisible();

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:161)31 | await expect(sfPage.getByTestId("driver-home-today-btn")).toBeVisible();

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:162)32 | });

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:163)at /home/runner/work/OHFY-Split/OHFY-Split/test-automation/tests/oms/driver-home-page.spec.ts:29:70

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:164)

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:165)attachment #1: screenshot (image/png) ──────────────────────────────────────────────────────────

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:166)test-results/oms-driver-home-page-Drive-1aad4-e-selector-and-today-button-chromium/test-failed-1.png

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:167)────────────────────────────────────────────────────────────────────────────────────────────────

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:168)

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:169)Error Context: test-results/oms-driver-home-page-Drive-1aad4-e-selector-and-today-button-chromium/error-context.md

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:170)

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:171)1 failed

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:172)[chromium] › test-automation/tests/wms/return-pre-visibility.spec.ts:519:9 › Return Pre-Visibility › unsellable rows tag the qty cell with the red-treatment inline style and a Non-restockable pill

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:173)1 flaky

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:174)[chromium] › test-automation/tests/oms/driver-home-page.spec.ts:26:9 › Driver Home Page › should load page with date selector and today button

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:175)135 skipped

[](https://github.com/Ohanafy/OHFY-Split/actions/runs/27165485562/job/80191938499?pr=259#step:13:176)51 passed (12.4m)
```