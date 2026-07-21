# Return Pre-Visibility — What Exists Today

_Captured 2026-07-20 from the Gulf partial sandbox (`ohanafy-gulf-distributing--partial`). Source of truth: the OHFY-Split repo + the `chore/gulf-uat-demo-data-audit-bms-4184` branch audit trail._

Goal of this doc: record the existing data flow and existing demo data behind the **Return Pre-Visibility** screen so we can modify / build on top of it without re-discovering it.

---

## 1. Where the code lives

| Layer | File |
| --- | --- |
| LWC | `OHFY-WMS-UI/force-app/main/default/lwc/returnPreVisibility/` |
| Apex proxy (UI pkg) | `OHFY-WMS-UI/.../classes/wrappers/WMS_UI_Wrappers.cls` (lines 241–252) |
| Executable (business logic) | `OHFY-WMS/.../classes/executables/delivery/E_Delivery_ReturnPreVisibility.cls` |
| DTOs | `OHFY-WMS/.../classes/DTOs/delivery/` → `TruckSummaryDTO`, `TruckLoadSummaryDTO`, `LoadLineDTO` |

Three Apex calls feed the screen:

1. `getReturnPreVisibilityWarehouses()` → the **Warehouse** picker.
2. `getReturnPreVisibilityTrucks(warehouseId)` → the **left-panel truck cards** (`TruckSummaryDTO[]`).
3. `getReturnPreVisibilityTruckLoad(truckLocationId)` → the **right-panel product table** (`TruckLoadSummaryDTO` = sellable + unsellable `LoadLineDTO[]`).

---

## 2. The record graph (what a truck card is built from)

```
Location__c (warehouse)            ← GULF MOBILE- 110-00649949
  └─ Equipment__c / Vehicle__c     ← TRUCK#766 -- SPARE TRUCK
        (Type=Motorized Vehicle, Status=Operational,
         Fulfillment_Location__c = warehouse)
        └─ Delivery__c             ← D-00003147
              (Route__r = "Demo Return Route 1",
               Driver__r = "Jason Damaschun",
               Status__c NOT IN {Complete, Cancelled},
               Truck_Location__c → the on-truck inventory Location)
              └─ Location__c (Truck_Location__c)
                    ├─ Inventory__c            (one per Item, Quantity_On_Hand__c > 0)
                    └─ Lot_Inventory__c        (lot cargo; Lot__r.Is_Sellable__c
                                                → Restockable vs Non-Restockable)
                          └─ Item__c           (Name, SKU_Number__c, Package_Type__c,
                                                Packaging_Type_Short_Name__c, Units_Per_Case__c)
```

**Selection rules baked into the Apex (worth knowing before you seed):**

- Warehouse picker = top-level `Location__c` where `Parent_Location__c = NULL AND Is_Active__c = TRUE AND Is_Truck__c != TRUE`.
- A truck only appears if its Vehicle is `Motorized Vehicle` + `Operational`, its `Fulfillment_Location__c` = the selected warehouse, and it has a **non-terminal** Delivery with a non-null `Truck_Location__c`.
- One card per vehicle: Apex picks the "active" delivery by status priority (`Delivered` 0 → `Out For Delivery` 1 → `Loaded` 2 → … `Draft` 7), then closest `Delivery_Date__c` to today, then newest `CreatedDate`. A stale `Delivered` from a prior day is demoted (priority 8) so it stops pinning the card.
- **Product Return** button is enabled only when the active delivery is `Out For Delivery` or `Delivered`.

---

## 3. What the screenshot showed (GULF MOBILE / TRUCK#766)

Real backend data:

| Field | Value | Backing |
| --- | --- | --- |
| Warehouse | GULF MOBILE- 110-00649949 | `Location__c.Name` |
| Truck | TRUCK#766 -- SPARE TRUCK | Vehicle `Name` |
| Delivery | D-00003147 | `Delivery_Number__c` |
| Route | Demo Return Route 1 | `Route__r.Name` |
| Driver | Jason Damaschun | `Driver__r.Name` |
| Distinct items | 3 | rollup |
| Total | 60 cs (60 restock / 0 non-rest) | rollup, converted to cases |

Cargo lines (all sellable lots → "Restockable"):

| Product | Item Id | SKU | PKG | Size | Cases |
| --- | --- | --- | --- | --- | --- |
| BLUEMOON BELGIUM 6/4/16Z CAN | a0oWE00000CETJN | 702021 | Packaged | 6/4/16Z CAN | 15 |
| TWISTED TEA LIGHT 2/12Z CAN | a0oWE00000CEPUH | (live) | Packaged | 2/12Z CAN | 20 |
| CORONA EXTRA 12/24Z CAN | a0oWE00000CEPaj | (live) | Packaged | 12/24Z CAN | 25 |

> **Units note:** the DTO carries `quantityOnHand` in **raw units**. The LWC divides by `Units_Per_Case__c` to show "Cases: N" (`decorateTruck` / `formatQuantity`, js line ~287). Card KPI totals are re-derived as the sum of per-line cases from the load-summary cache.

---

## 4. ⚠️ Fabricated in the frontend — NOT data (do not try to seed)

| Card element | Value seen | Where it comes from |
| --- | --- | --- |
| **ETA** | `2:14 PM` | `HARDCODED_ETAS[index % 7]` — TRUCK#766 is card index 0 → first entry. js line 35 + 327. |
| **Bay** | `Bay 1` | `bay${(index % 4) + 1}` — positional; operator-overridable dropdown only. js line 45 + 332. |
| **RETURNING badge** | `RETURNING` | `_demoReturningTruckId` — **one truck picked at random per page load** as RETURNING, another as ARRIVED. Real `Delivery__c.Status__c` has no "Returning" value yet. js lines 116–121, 234–257, 315–325. |

Everything else on the card (route, driver, delivery #, item lines, quantities, restockable/non-restockable) **is** real backend data.

---

## 5. What the `chore/gulf-uat-demo-data-audit-bms-4184` branch actually contains

The branch is a **docs + scripts audit trail**, not the Return-Pre-Vis seed. Full diff vs `main` (8 files, +1678):

| File | What it is |
| --- | --- |
| `.claude/skills/gulf-demo-data/SKILL.md` (+ `references/org-recipes.md`) | Seeding conventions skill |
| `.claude/uat-app-meta/app-map.json` / `.md` | UAT app map |
| `docs/engineering/spikes/2026-07-17-gulf-partial-wms-uat-org-changes.md` | The org-changes audit trail (picklist fixes, type fixes, live seeding log) |
| `docs/engineering/spikes/2026-07-17-gulf-uat-seeded-data-urls.csv` | Per-experience seeded-record URLs |
| `orgScripts/seedGulfReceivingPOs.apex` | Clones a PO's receiving graph ×4 (tag `test:wms-onsite-clone-%`) — **Receiving**, not Return Pre-Vis |
| `orgScripts/inspectGulfWmsSeedData.apex` | Read-only inspector |

**The Return Pre-Visibility cargo you saw is NOT committed anywhere in this branch.** Per the 7/19 audit note (§5b), it was created **live in the org**:

> _"Return Pre-Vis @ GM (`test:wms-onsite-mack2-%`): Mobile Trucks 21/22/23 created; today's real Mobile 07/12/19 deliveries wired to them (org enforces one delivery per route per day) with lot cargo aboard."_

So the records feeding the screen carry the external-id tag `test:wms-onsite-mack2-%` in the live org — there is no reproducible script for them in git. (TRUCK#766 / "Demo Return Route 1" naming doesn't match "Mobile Trucks 21/22/23", so it may be a later live seed or real Gulf equipment — confirm against the org by external-id before assuming.)

The canonical seeded anchor recorded in the URLs CSV for this screen is:

> Return Pre-Visibility → `a0kWE00000IWLa2YAH` — "On-Site Demo Return Truck (lot inventory on board)"

---

## 6. To build on top of it

- The machine-readable model is in **`return-pre-visibility-data-model.json`** (same folder).
- To reproduce/extend the cargo you'll need a **new** idempotent Apex seed script against live GM records (Vehicle + Delivery + Truck `Location__c` + `Inventory__c`/`Lot_Inventory__c`), following the teardown-then-insert pattern in `seedGulfReceivingPOs.apex` and tagging with a fresh `test:wms-onsite-*` external id.
- Remember: seeding will populate route/driver/items/qty/restockable, but **ETA, Bay, and RETURNING remain frontend-only** until the backend grows real fields/statuses for them.
