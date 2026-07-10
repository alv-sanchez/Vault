---
ticket: BMS-5068
title: Safety Stock Controls
domain: Inventory / replenishment planning
relates: [BMS-4217, BMS-4609, BMS-4025, BMS-4204]
branch: feat/safety-stock-doh-sizing-bms-4217
status: BUILD IN PROGRESS
po: Elliot Flores
updated: 2026-06-29
tags:
  - manager-engineer
  - build-overview
  - inventory
---

# BMS-5068 — Safety Stock Controls

> [!warning] BUILD IN PROGRESS — branch `feat/safety-stock-doh-sizing-bms-4217`
> v1 scope locked (SKU+location, layer/pallet rounding, additive + flag-guarded). **One architectural fork still open** for the refinement meeting: Option A (pick-face replenishment, being built) vs Option B (inbound PO sizing).

- **Domain:** Inventory / replenishment planning
- **User:** Inventory / demand planners; service-level owners

## 📦 New here? Inventory primer

Gulf Distributing is a beverage distributor (DSD = *Direct Store Delivery* — they truck drinks straight to stores). This epic is about **not running out** of a product and **not drowning in too much** of it.

- **Safety stock** — extra buffer inventory kept on purpose so you don't run out when a supplier ships late or demand spikes.
- **DOH / DOI (Days on Hand / Days of Inventory)** — how many days current stock lasts at the current sales rate. Stock measured in *time*, not cases. `Current_DOI__c` holds the live value.
- **Velocity** — how fast it sells, `Average_Daily_Depletion__c` (cases/day). DOH = `stock ÷ velocity`.
- **Reorder point + replenishment** — when stock hits a low line, the system creates a refill task (`E_ReplenishmentTask`). Refilling = replenishment.
- **Pick face vs inbound PO** — the *pick face* is the front bin pickers pull from, refilled from bulk you already own. An *inbound PO* (Purchase Order) is buying *more* from the supplier. The open decision below is just: does "raise the buffer" mean refill the pick face, or buy more from the supplier?

### Jargon legend

| Term | Plain meaning |
|---|---|
| Salesforce | The platform it's built on. Data lives in **objects** (tables); logic runs in **Apex** (a Java-like language). |
| Custom object / field (`__c`) | A company-defined table / column. `Inventory__c` = the Inventory table; `Average_Daily_Depletion__c` = a column on it. |
| Formula field | A field that computes itself from others, like a spreadsheet cell. `Effective_Target_DOH__c` is one. |
| Relationship (`__r`) | A link to another row. `Item_Line__r.Supplier__r` hops product → supplier (the deferred supplier tier). |
| CMDT feature flag | A config switch shipped with the code (Custom Metadata Type) to turn behavior on/off per org without redeploying. The new sizing is flag-guarded, off by default. |
| Supplier tier | Per-supplier safety stock. Plumbing exists via `Inventory_Threshold__c.Account__c`; deferred for v1. |
| Layer / pallet | Physical shipping units (a fixed count of cases). You ship whole layers/pallets, so order quantity rounds to them. |

## Issue · Impact · Proposed solution

| | |
|---|---|
| **Issue** | Static reorder points can't flex when a supplier is slow or demand is seasonal — buffers don't move with conditions. |
| **Impact** | Stockouts or overstock when supply conditions change; service levels slip. |
| **Proposed solution** | The override/threshold **engine already shipped** (BMS-4609). Net-new work = make the resolved **target DOH actually size replenishment orders** in `E_ReplenishmentTask` (today DOH only nudges *priority*, never *quantity*). `targetCases = round(targetDOH × Average_Daily_Depletion__c ÷ Units_Per_Case__c)`, rounded to layer/pallet, clamped to bin capacity, with a safe fallback to today's capacity-fill when DOH/velocity is null. |

## Closed questions

- ✅ **Don't rebuild the engine — close BMS-4217 as a duplicate.** `SKU_Override__c` + `Inventory_Threshold__c` + `S_InventoryThresholds.resolve()` already shipped under BMS-4609 (Done). 4217 is a byte-identical clone of the Done 4025 demo.
- 🧠 **v1 = SKU + location grain only.** Supplier-tier is **deferred** (zero confirmed demand) but **feasible** — the relationship exists via `Item_Line__r.Supplier__r`; switch it on later by passing the supplier `accountId` into `resolve()`.
- 🧠 **Round order sizing to layer/pallet** (standard in beverage DSD).

## Still open — architectural fork (refinement)

> 🟠 **Where does DOH order-sizing belong?** This is the live product call, not a code call. Same target DOH, two different builds in two different places.

| | **Option A — Pick-face replenishment** | **Option B — Inbound PO sizing** |
|---|---|---|
| **Question** | Don't let the *pick face* go dry mid-shift | Don't run out because the *supplier* is slow / seasonal |
| **Where** | `E_ReplenishmentTask` (bulk → pick face) | Purchasing — `E_PurchaseOrder` (supplier → receiving) |
| **DOH role** | Keep the bin from running empty during a shift | Reorder buffer vs lead-time + demand swings |
| **Code today** | **Only existing DOH consumer** — already wired | **No DOH consumer exists yet** |
| **Status** | **BEING BUILT** (cheap / already-wired path) | Not built |

**The tension:** the epic's business wording ("supplier lead-time variability, seasonal demand swings") leans toward **Option B (purchasing)**, but the only existing code hook is **Option A (pick-face)**. Recommendation to the meeting: confirm intent first — A, B, or both, and if B, whether it belongs in this epic or a purchasing epic.

## Build status

**Branch:** `feat/safety-stock-doh-sizing-bms-4217` — **BUILD IN PROGRESS**

Building:
- A **reusable DOH order-sizing helper** — `targetCases = round(targetDOH × Average_Daily_Depletion__c ÷ Units_Per_Case__c)`, layer/pallet rounding, clamped to bin capacity.
- **Wiring into `E_ReplenishmentTask`** — additive and **flag-guarded**; **null fallback** to today's capacity-fill (un-configured SKUs unchanged).
- **v1 grain:** SKU + location.
- An **`OPEN(refinement)` marker** left at the wire-in point flagging the A-vs-B fork in code.

**Needs an org:** deploy-validate + run Apex tests once the helper and wiring are done.

---
<sub>Source: `Open-Questions/BMS-5068-safety-stock-rescope.md`. v1 decisions resolved 2026-06-29 (owner + code-grounded SME). Q4 framed for product refinement.</sub>
