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
