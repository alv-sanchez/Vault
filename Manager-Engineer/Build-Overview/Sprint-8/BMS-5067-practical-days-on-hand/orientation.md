---
key: BMS-3816
kind: strata-orientation
repo: OHFY-Split
verified_at_sha: 7e0126f13
generated: 2026-07-08 10:23
packages_touched: ["OHFY-Data-Model", "OHFY-WMS"]

tags: [manager-engineer, strata, orientation]
---

# 🪨 Orientation — BMS-3816 Practical DOH — target-vs-actual variance at warehouse and location grain

> **Thesis:** BMS-3816 adds a target-vs-actual DOH variance signal to Inventory__c/Days-of-Inventory because the leadership-set benchmark and the live DOI figure already both exist on the record, but nothing compares them — so over/understock stays invisible until someone builds a spreadsheet.
> _Code-verified against `OHFY-Split` @ `7e0126f13` · 2026-07-08 10:23_

## 🎯 Why now
- Leadership defines a 'Practical DOH' target per SKU/warehouse, but there was no in-system comparison of live stock vs that benchmark — analysts computed variance by hand.  `[jira]`
- Reuse-first, confirmed in code: benchmark storage (Inventory_Threshold__c/SKU_Override__c), the resolution waterfall (S_InventoryThresholds), and the nightly DOI calc (B_InventoryDOI) already shipped under BMS-3779 — this ticket only needed to SURFACE the comparison, no new objects/batch/Apex.  `[code]`
- A prior spec draft on this ticket (new Target_DOH__c object, CSV import, provisional benchmark types, auto-supersede trigger) was explicitly dropped in favor of this lighter formula-field approach, per the BMS-3817 spike's ticket-action index.  `[jira]`

## 🏛️ Bedrock — what already exists (shared across the epic)
- **Current_DOI__c / Effective_Target_DOH__c stamped nightly by the DOI batch** (BMS-3779) — `OHFY-WMS/force-app/main/default/classes/batchJobs/B_InventoryDOI.cls:63-75`
- **S_InventoryThresholds.resolve — 4-tier benchmark waterfall (SKU override → supplier+warehouse → warehouse → supplier default)** — `OHFY-WMS/force-app/main/default/classes/services/inventoryThresholds/S_InventoryThresholds.cls:44-79`
- **Inventory_Threshold__c.Target_DOH__c — baseline target DOH per supplier/warehouse grain** — `OHFY-Data-Model/force-app/main/default/objects/Inventory_Threshold__c/fields/Target_DOH__c.field-meta.xml:1-17`
- **SKU_Override__c.Target_DOH_Override__c — dated per-SKU/location target override** — `OHFY-Data-Model/force-app/main/default/objects/SKU_Override__c/fields/Target_DOH_Override__c.field-meta.xml:1-17`
- **Days of Inventory report type — 12 pre-existing columns this PR extends, not replaces** (BMS-3779) — `OHFY-WMS/force-app/main/default/reportTypes/Days_of_Inventory.reportType-meta.xml:10-59`

**From the capability ledger:**
- OHFY-Data-Model · Current DOI — live actual days-on-hand, stamped nightly by B_InventoryDOI (BMS-3779) — OHFY-Data-Model/.../Inventory__c/fields/Current_DOI__c.field-meta.xml @956df295
- OHFY-Data-Model · Effective Target DOH — resolved leadership benchmark on each Inventory row (BMS-3779) — OHFY-Data-Model/.../Inventory__c/fields/Effective_Target_DOH__c.field-meta.xml @956df295
- OHFY-WMS · Days of Inventory report type — the inventory-health reporting surface (BMS-3779) — OHFY-WMS/.../reportTypes/Days_of_Inventory.reportType-meta.xml @956df295

## 🧭 Shape
`B_InventoryDOI (nightly) → Current_DOI__c + Effective_Target_DOH__c (via S_InventoryThresholds waterfall) → 3 variance formula fields → Days of Inventory report, gated by Days_Of_Inventory_Report_Access`

## 🔨 The delta — what THIS ticket adds
- [BUILD] **3 formula fields on Inventory__c: Target_DOH_Variance__c (days), Target_DOH_Variance_Pct__c (%, derives from the days field), Target_Variance_Status__c (Above/At/Below Target · No Benchmark Set · No Velocity Data)** — overstock/understock becomes a filterable, always-in-sync field — zero new batch work, purely declarative on top of two fields B_InventoryDOI already stamps
- [EXTEND] **3 variance columns added to the existing Days of Inventory report type** — warehouse view via report grouping, location view via filter — no new report type, no persisted rollup
- [BUILD] **Days_Of_Inventory_Report_Access permission set — read FLS on all 6 Inventory__c fields the report depends on** — first field-level-only permission set for Inventory__c reporting fields in the repo; widened from an initial 3-field DOH_Variance_Access to also cover the 3 pre-existing sibling fields (Current_DOI__c, Effective_Target_DOH__c, DOI_Status__c) after code review flagged that gap — no prior narrow-FLS precedent existed to extend, so this is now the durable home for future report fields too

## ⚠️ Watch out (epic-level)
- No validation rule anywhere prevents Target_DOH__c / Target_DOH_Override__c from being ≤ 0 (only relative Min≤Target≤Max ordering is enforced) — the 3 formulas defensively treat ≤ 0 as 'No Benchmark Set'. A code-review pass caught the 3 formulas disagreeing on this exact case (zero/negative target produced 'Above Target' + populated Days but blank/sign-flipped Percent); fixed by deriving Percent from the Days field so one guard covers all three.
- Days_Of_Inventory_Report_Access (renamed from DOH_Variance_Access) now grants FLS on all 6 report-dependent fields, closing a gap that predated this PR: the 3 pre-existing DOI fields had never had a permission-set FLS grant anywhere in the repo since BMS-3779 shipped them.
- BMS-5702 (3 spike docs merged from a dead branch) rides the same branch/PR but is content-unrelated to the BMS-3816 code delta — bundled for convenience, not a dependency.
- Percent formula field pitfall: do NOT multiply by 100 — Salesforce Percent fields auto-scale for display. The original build did (11,524% instead of 115%); caught during org validation and fixed.

---
_Honesty: reports only what was searched — packages: OHFY-Data-Model/objects/Inventory__c, OHFY-Data-Model/objects/Inventory_Threshold__c, OHFY-Data-Model/objects/SKU_Override__c, OHFY-Data-Model/permissionsets, OHFY-WMS/classes/batchJobs, OHFY-WMS/classes/services/inventoryThresholds, OHFY-WMS/classes/services/inventoryDOI, OHFY-WMS/reportTypes, OHFY-WMS-UI/permissionsets, docs/product/wms/days-of-inventory-monitoring, docs/spikes · terms: Current_DOI__c, Effective_Target_DOH__c, DOI_Status__c, FROM Inventory__c, InventoryThreshold, Inventory__c. (permissionset grep). Absence = **not searched**, not **doesn't exist**. Every prior-art claim is cited to `file:line`/SHA or flagged uncited. "Why" is tagged by source; `inferred` = not confirmed in code. Regenerate — pinned to `7e0126f13`._
