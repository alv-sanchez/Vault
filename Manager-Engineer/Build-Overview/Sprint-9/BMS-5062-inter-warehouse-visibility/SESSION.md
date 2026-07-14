# 🏭 Session Kickoff — Inter-Warehouse Inventory Visibility (Epic BMS-5062)

> Paste into a fresh Claude Code session as the first message. Context seed.
> Last updated: 2026-07-13. **Status: not started — no branch/build yet (scaffold).**

**Sprint:** Sprint 9 (2026-07-13 → 2026-07-20) — BMS-3823 is in the active sprint (status: To Do, not yet started).

## Scope of THIS session
Epic BMS-5062 (build story **BMS-3823**). Do not touch other tickets.

## Where the work lives
- **Branch:** none yet — cut `feat/inter-warehouse-visibility-bms-3823` from `main` when starting.
- **Dev org:** none claimed yet — `bash utilityScripts/claim-dev.sh ohfy-val-3823` (or similar).
- **Build folder:** this folder — no HTML/overview yet (scaffold only).

## What it is (one line)
Give a **unified, real-time view of on-hand stock across all 5 warehouses + in-transit truck inventory**, so sales ops / planners stop overselling depleted sites while surplus sits idle elsewhere.

## Ticket map (epic BMS-5062)
| Ticket | What | Status | Owner |
|---|---|---|---|
| **BMS-3823** | Inter-Warehouse Inventory Visibility — on-hand across 5 sites + transit stock in one view | **To Do** | **mine** (the build) |
| BMS-5567 | Forecast: draft transfers netted in (AL→FL, supplier-hidden) | Backlog | Matt Keeter (not me) |

## Gulf context
- 5 warehouses (Milton FL, Montgomery / Mobile / Huntsville / McCalla AL) operate as **separate inventory pools** today.
- Transfers run on **emailed Excel** + tribal knowledge — no live cross-site view, no in-transit visibility.
- Related initiative: BMS-4639 (Warehouse-to-Warehouse Transfers).

## Likely code area (verify when starting)
- Inventory lives in **OHFY-PLTFM** (`Inventory__c`, `InventoryAdjustmentTriggerService`) — this is the shared inventory lock stream, so coordinate with DOI/Safety-Stock work that touches the same handler.
- A read/aggregation view across `Location__c` + in-transit (Delivery/transfer) records; likely a new LWC + `E_`/`S_` read service (no writes → lower risk).

## ✅ Next steps (when picked up)
1. Cut the branch + claim an org.
2. Confirm the data model: on-hand per `Location__c` + how in-transit stock is represented (transfer/delivery records).
3. Build the aggregation service (read-only) + a cross-site visibility LWC.
4. Tests, `/code-review`, `/end-ticket` → PR.

## ⛔ Blockers / notes
- **Shared inventory handler:** don't run this in parallel with an epic that *rewrites* `InventoryAdjustmentTriggerService` — coordinate (read-only here should be safe).
- BMS-5567 (forecast netting) is Matt's, not part of your build.
