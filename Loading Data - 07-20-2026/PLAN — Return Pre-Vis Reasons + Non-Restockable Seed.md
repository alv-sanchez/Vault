# PLAN — Return Pre-Visibility: attach reasons + add non-restockable products

_Status: **✅ EXECUTED 2026-07-20** (script `orgScripts/seedGulfReturnPreVisReasons.apex`, run against `gulfPartial`). Signed off: keep Alchemy items; Loss Prevention firing accepted as intended functionality. Target org: `gulfPartial` (`ohanafy-gulf-distributing--partial`). Truck: **TRUCK#766 -- SPARE TRUCK**, Delivery **D-00003147**, warehouse **GULF MOBILE**._

## ✅ Result (verified live)

| Product | Cases | Status | Reason |
|---|---|---|---|
| BLUEMOON BELGIUM 6/4/16Z CAN | 15 | Restockable | Customer Refusal |
| TWISTED TEA LIGHT 2/12Z CAN | 20 | Restockable | Mispick / Wrong Product |
| CORONA EXTRA 12/24Z CAN | 25 | Restockable | — |
| ALCHEMY CONEY ISLAND CHERRY CREAM 4/6/12 BTL | 10 | **Non-Restockable** | Quality Issue |
| ALCHEMY CONEY ISLAND HARD LEMON LIME TWIST 24/16Z CAN | 6 | **Non-Restockable** | Damaged Product |
| ALCHEMY CONEY ISLAND HARD ROOTBEER 24/16Z CAN | 4 | **Non-Restockable** | Product Recall |

**Totals: 6 items · 80 cs → Restockable 60 / Non-Restockable 20.** 5 `Loss_Prevention_Event__c` created (intended, fail-open). Records confirmed via SOQL; all tagged `test:wms-onsite-retvis720-%`.

_Re-run the same script anytime to reset (teardown-by-tag is built in). Teardown removes the 5 LP events via `Source_Adjustment__r`._

## Goal
Give the warehouse-team view a full rundown of what's coming back on the truck:
- Tag the **existing** restockable cargo with *why* it's coming back (restockable reasons).
- Add **non-restockable** cargo so the team sees the full staffing picture (restock vs. breakage/quarantine).

---

## Foundation (verified live, read-only — Fable scout 2026-07-20)

**Truck inventory location (TRUCK_LOC):** `a0kWE00000IZNx3YAH` — "Demo Return Truck 1" (Type=Zone, Is_Truck=true).
**Delivery:** `a0BWE00000GpcWf2AJ` — Out For Delivery, 2026-07-20.
**Existing adjustments on this cargo:** 0 (clean slate).

Existing cargo (all lot-tracked, sellable lots):

| Product | Inventory Id | Lot Id | UPC | QOH (units) | Cases |
|---|---|---|---|---|---|
| BLUEMOON BELGIUM 6/4/16Z CAN | a0VWE000009knGi2AI | a0oWE00000CETJNYA5 | 24 | 360 | 15 |
| TWISTED TEA LIGHT 2/12Z CAN | a0VWE000009knIH2AY | a0oWE00000CEPUHYA5 | 24 | 480 | 20 |
| CORONA EXTRA 12/24Z CAN | a0VWE000009knJt2AI | a0oWE00000CEPajYAH | 12 | 300 | 25 |

Reason codes (CMDT `ohfy__Reason_Code__mdt`, all active — **not touched by this plan**):

| Reason (`Reason__c`) | Can_Resell | Triggers_Loss_Prevention |
|---|---|---|
| Customer Refusal | true | false |
| Mispick / Wrong Product | true | false |
| Quality Issue | false | false |
| Damaged Product | false | false |
| Product Recall | false | false |

---

## How the screen derives each column (why the plan is shaped this way)
- **REASON** column ← `ohfy__Inventory_Adjustment__c.ohfy__Unsold_Reason__c` (string-matches `Reason__c`), qty from `ohfy__Quantity_Change__c`. No adjustment = blank reason.
- **STATUS** (Restockable vs Non-Restockable) for lot-tracked cargo ← `ohfy__Lot__c.ohfy__Is_Sellable__c`. A **Non-Restockable line requires a lot-tracked item with a non-sellable lot** (the non-lot path never emits a non-restockable *line*, it only reduces sellable qty — verified in `E_Delivery_ReturnPreVisibility.getTruckLoadSummary`).
- **QTY (cases)** ← `Quantity_On_Hand__c / Units_Per_Case__c`. Adjustments do **not** change on-hand (trigger `beforeInsert` only sets an accounting key), so setting `Quantity_Change__c` = full lot QOH keeps the displayed case count identical while populating the reason.

---

## What will be executed

**One idempotent anonymous-Apex script** (teardown-by-tag, then insert), tag prefix `test:wms-onsite-retvis720-`. **Zero CMDT edits. Zero edits to existing records** (Part A only *adds* adjustment rows).

### Part A — restockable reasons on existing cargo (2 records)
| New `Inventory_Adjustment__c` | Inventory | Unsold_Reason | Quantity_Change | External_Id |
|---|---|---|---|---|
| 1 | Bluemoon (a0VWE000009knGi2AI) | `Customer Refusal` | 360 | test:wms-onsite-retvis720-adj-bluemoon |
| 2 | Twisted Tea (a0VWE000009knIH2AY) | `Mispick / Wrong Product` | 480 | test:wms-onsite-retvis720-adj-twistedtea |

_Corona left as-is (Restockable, no reason) — you named exactly 2 restockable reasons. Bluemoon & Twisted Tea stay Restockable; only the reason label appears._

### Part B — 3 new non-restockable products (4 records each = 12)
Each product = `Inventory__c` + `Lot__c` (Is_Sellable=**false**, Is_Active=true) + `Lot_Inventory__c` (on-hand) + `Inventory_Adjustment__c` (reason). All on TRUCK_LOC.

| Product (real Gulf item) | Item Id | UPC | Cases | Units | Reason | Renders |
|---|---|---|---|---|---|---|
| ALCHEMY CONEY ISLAND CHERRY CREAM 4/6/12 BTL | a0iWE000006BrTmYAK | 24 | 10 | 240 | `Quality Issue` | Non-Restockable |
| ALCHEMY CONEY ISLAND HARD LEMON LIME TWIST 24/16Z CAN | a0iWE000006BrTnYAK | 24 | 6 | 144 | `Damaged Product` | Non-Restockable |
| ALCHEMY CONEY ISLAND HARD ROOTBEER 24/16Z CAN | a0iWE000006BrToYAK | 24 | 4 | 96 | `Product Recall` | Non-Restockable |

> ⚠️ **Decision point — item brand:** these 3 are the alphabetical scout result (all "Alchemy" craft brand). If you'd rather the recall/damaged/quality demo on recognizable mainstream brands, say so and I'll re-pick before executing.

### Resulting card (TRUCK#766)
- **6 distinct items**, **80 cs total** → **Restockable 60 cs**, **Non-Restockable 20 cs**.
- Restockable rows now show reasons (Bluemoon = Customer Refusal, Twisted Tea = Mispick); 3 new rows show Non-Restockable + their reason.

---

## Impacted experiences (good / bad)

| Experience | Impact | Good / Bad |
|---|---|---|
| **Return Pre-Visibility** (target) | Full rundown: restock + non-restock + reasons on TRUCK#766 | ✅ Intended |
| **Loss Prevention Register** | **5 new `Loss_Prevention_Event__c` records** (Type=Adjustment, Status=Open, dated today) — one per adjustment. Fail-open is active (no reason has `Triggers_Loss_Prevention__c=true`), so **all 5 reasons create an event**, including the 2 restockable ones. Linked via `Source_Adjustment__c`. | ⚠️ Mixed — realistic (returns *are* loss events) but adds 5 rows to that register. Fully tagged/reversible. |
| **Item Return** (`itemReturn` LWC) | Shares the identical TRUCK_LOC data + helpers → shows the same 6 lines incl. non-sellable + reasons. It's an *action* screen, so a tester could now action these returns. | ⚠️ Neutral — consistent by design; flagging the action surface. |
| **On-hand / inventory views for TRUCK_LOC** | 3 new inventory rows on the *truck* location (not a real warehouse bin). | 🟢 Negligible |
| **Warehouse Visualization / Replenishment / Pick** | TRUCK_LOC is a truck zone, not a pickable warehouse location; no put-away/replen/pick generation. | 🟢 None |
| **Accounting (journal entries)** | Only fire on adjustment *update*, not insert → none created. | 🟢 None |
| **Negative-inventory guard** | `Quantity_Change__c` positive → no negative incident events. | 🟢 None |

---

## Loss Prevention — blast-radius recap (intended behavior)
- The 6 reason-tagged `Inventory_Adjustment__c` inserts auto-created **6 `Loss_Prevention_Event__c`** (Customer Refusal ×2, Mispick, Quality Issue, Damaged Product, Product Recall) — Type=Adjustment, Status=Open, dated today, linked via `Source_Adjustment__c`.
- This is the **only** footprint outside TRUCK#766's truck location; it surfaces on the **Loss Prevention Register**.
- **Intended, not a glitch:** `InventoryAdjustmentTriggerService.afterInsert` → `S_LossPreventionRegister.createFromAdjustments` is a designed derivation — any adjustment with an unsold reason is captured as a loss event for review. Fail-open (no reason opts in via `Triggers_Loss_Prevention__c`) means every reason logs, including resellable ones. **Seeded return data being captured as LP events is the feature working as designed.**
- Fully reversible via the tagged teardown (`Source_Adjustment__r.External_Id__c LIKE 'test:wms-onsite-retvis720-%'`).

## Blast-radius summary
- **No managed metadata / CMDT changes** (reusing the 6 existing reason codes).
- **No mutation of existing records** — Part A adds child adjustments; existing inventory/lots untouched.
- **All 14 new records tagged** `test:wms-onsite-retvis720-%`.
- **Only unavoidable spillover:** 5 auto-created `Loss_Prevention_Event__c` (trigger-driven, fail-open) — disclosed above, and reversible.

## Teardown (bundled into the same idempotent script header)
Delete in child-first order, by tag:
1. `Loss_Prevention_Event__c` where `Source_Adjustment__r.External_Id__c LIKE 'test:wms-onsite-retvis720-%'`
2. `Inventory_Adjustment__c` where tag
3. `Lot_Inventory__c` where tag
4. `Lot__c` where tag
5. `Inventory__c` where tag

---

## Sign-off
- [ ] Approve item brands (Alchemy) or request mainstream swap
- [ ] Approve the 5 Loss Prevention events as acceptable spillover
- [ ] **Approve execution** against `gulfPartial`

_On approval: I write the script to `orgScripts/`, run it via `sf apex run --file … -o gulfPartial`, then verify the TRUCK#766 card live._
