# Safety Stock Epic (BMS-5068) — Resources

## Primary sources (this repo / this epic — highest trust)

- [Epic BMS-5068 — [REQ-141] Safety Stock Controls](https://ohanafy.atlassian.net/browse/BMS-5068)
  The epic. Status Done, label `polished`. Its description frames the business problem (supplier lead-time variability, seasonal swings → planners need to raise DOI targets per supplier/SKU without touching system defaults).

- [BMS-4025 — Safety Stock Controls [Demo April 17]](https://ohanafy.atlassian.net/browse/BMS-4025)
  The **demo** ticket. Critical for the "why tidy" story: its data-model section proposed a **net-new `Safety_Stock_Override__c` object** with its own scope picklist, effective dates, and lifecycle. The production epic deliberately did *not* build that — it reused `SKU_Override__c`. This ticket is the "before" the tidy decision reacts against. Also holds the full Gherkin acceptance criteria the epic was measured against.

- [PR #442 — feat(inventory): Safety Stock Controls — complete epic](https://github.com/Ohanafy/OHFY-Split/pull/442) (MERGED, +4429/−36, 69 files)
  The single delivery PR. Its body is unusually honest — a story→delivered table, a manual-QA dry-run log, a **QA findings** section (fixed / deliberately-not-fixed / not-independently-verified), and a note that the merge went in without independent code review (bot hit the monthly spend cap). Primary source for "what actually shipped vs. what the AC asked for."

- The six delivered child stories — each names its "**Reuse — do NOT rebuild**" list explicitly, which is the tidy principle in the tickets' own words:
  - [BMS-4217 — Production-ready DOH order sizing](https://ohanafy.atlassian.net/browse/BMS-4217) (the engine, cloned & hardened from the demo)
  - [BMS-5636 — supplier-scope override + Scheduled/Manually-Closed lifecycle](https://ohanafy.atlassian.net/browse/BMS-5636)
  - [BMS-5638 — expiry & approaching-expiry notifications](https://ohanafy.atlassian.net/browse/BMS-5638)
  - [BMS-5639 — freeze effective DOH + resolution source on the replenishment task](https://ohanafy.atlassian.net/browse/BMS-5639)
  - [BMS-5640 — planning & management UI + impact preview](https://ohanafy.atlassian.net/browse/BMS-5640)
  - [BMS-5641 — override audit history + impact reporting](https://ohanafy.atlassian.net/browse/BMS-5641) (+ [BMS-5754](https://ohanafy.atlassian.net/browse/BMS-5754) — $ value on the impact report)

## Code (the ground truth for the mechanics)

- `OHFY-WMS/.../services/inventoryThresholds/S_InventoryThresholds.cls`
  The **resolver waterfall**. `resolve(itemId, locationId, accountId)` → a `Result` carrying `targetDOH` + `resolutionSource` (`SKU Override` / `Supplier Override` / `Standard` / `System Default`). Read the header comment: it lists the exact precedence tiers. This is where "safety stock" is chosen.

- `OHFY-WMS/.../services/replenishmentOrderSizing/S_ReplenishmentOrderSizing.cls`
  The **order-sizing engine** (BMS-4217). `size(SizingInput)` → `SizingResult{cases, dohDriven}`. Formula in the header: `targetCases = round(targetDOH × Average_Daily_Depletion__c ÷ Units_Per_Case__c)` then round to layer/pallet. Note the **fallback contract** — null/non-positive targetDOH or velocity returns the capacity-fill quantity *unchanged*, so unconfigured SKUs size exactly as before. This is the additive-safety guarantee.

- `OHFY-Data-Model/.../objects/Replenishment_Task__c/fields/Effective_Target_DOH__c` + `Resolution_Source__c`
  The two **freeze fields** (BMS-5639). Stamped at generation time so the audit trail doesn't drift when the override later expires.

- `OHFY-WMS/.../DTOs/safetyStock/SafetyStockImpactDTO.cls`
  The **impact-preview payload**: `skusAffected`, `additionalCases`, `additionalInventoryValue`, `currentTargetDOH`, `proposedTargetDOH`. Powers the "if I set this supplier to 15 DOI, here's what it costs" preview before save.

## Concept grounding (external, for the "why" not the "what")

- Days of Inventory / Days-on-Hand (DOH/DOI) and safety stock as a *service-level buffer* — any operations/supply-chain primer (e.g. APICS/ASCM glossary). Use only to confirm the vocabulary; the repo's DOH is the definitive local meaning.

## Gaps
- No single repo doc yet ties the six stories into one narrative diagram — this teaching set's cheat-sheet (`reference/data-flow-and-seams.html`) is currently the most complete "whole picture" artifact. If a canonical version is wanted in-repo, it belongs under `docs/product/wms/` (the epic already added docs there), not in the vault (see memory `feedback_notion_not_sdlc`).
