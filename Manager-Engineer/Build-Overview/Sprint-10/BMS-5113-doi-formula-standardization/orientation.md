---
key: BMS-5113
kind: strata-orientation-epic
repo: OHFY-Split
verified_at_sha: 97777425c
generated: 2026-07-13 15:30
packages_touched: ["OHFY-Data-Model", "OHFY-WMS"]
children: ["BMS-3822", "BMS-3742", "BMS-4543", "BMS-4544", "BMS-4545"]
tags: [manager-engineer, strata, orientation, epic]
---

# 🪨 Orientation (epic) — BMS-5113 DOI Formula Standardization

> **Thesis:** BMS-5113 standardizes the Days-on-Inventory calculation to a single authoritative source (completed invoiced quantity) and propagates it as 30/60/90-day windows, because Gulf's five warehouses were reading inconsistent DOI signals off a distorted proxy.
> _Code-verified against `OHFY-Split` @ `97777425c` · 2026-07-13 15:30_

## 🎯 Why now
- Gulf's warehouses interpret 'days on inventory' differently, leading to duplicated purchase orders or missed replenishment windows.  `[jira]`
- The BMS-3817 DOI/DOH spike mandates completed invoiced quantity as the sales-rate source at 30/60/90-day windows, not the on-hand-decrease proxy.  `[code]`

## 🏛️ Bedrock — what already exists (shared across the epic)
- **S_InventoryDOI.calculate() + nightly B_InventoryDOI batch already stamp Current_DOI__c / DOI_Status__c on Inventory__c** (BMS-3779) — `OHFY-WMS/force-app/main/default/classes/batchJobs/B_InventoryDOI.cls`
- **Inventory_Threshold__c object + resolver (min/target/max DOH per warehouse/SKU) already ship, feeding classify()** (BMS-3822) — `OHFY-Data-Model/force-app/main/default/objects/Inventory_Threshold__c`
- **Days_of_Inventory report type + permission set already ship, covering most of the Reporting Build intent** (BMS-3779) — `OHFY-WMS/force-app/main/default/reportTypes/Days_of_Inventory.reportType-meta.xml`

**From the capability ledger:**
- OHFY-Data-Model · Current DOI — live actual days-on-hand, stamped nightly by B_InventoryDOI (BMS-3779)
- OHFY-Data-Model · Effective Target DOH — resolved leadership benchmark on each Inventory row (BMS-3779)
- OHFY-WMS · Days of Inventory report type — the inventory-health reporting surface (BMS-3779)

## 🧭 Shape
`Invoice_Item__c (Status=Complete) → S_InventoryDOI.calculateStandardWindows() aggregate query (per item×warehouse, 3 windows in one pass) → nightly B_InventoryDOI batch stamps Current_DOI__c/_60/_90 + DOI_Status__c/_60/_90 on Inventory__c → Days_of_Inventory report type`

## 🧱 The children — understood one by one

### 1. BMS-3822 — Inventory threshold baseline object + resolver  `Done`
> **Thesis:** Delivered the Inventory_Threshold__c object + resolver this epic's DOI classification reads.

**🔨 Delta:**
- _(none captured)_

**🎯 Why:** Already merged before this session — nothing to build. `[code]`



### 2. BMS-3742 — DOI Formula Standardization (core story)  `Review (draft PR #513)`
> **Thesis:** The one real remaining build — switches the sales-rate source and adds 30/60/90-day windows.

**🔨 Delta:**
- [EXTEND] **Sales-rate source swap + 30/60/90 windows** — High risk, org-wide DOI shift

**🎯 Why:** BMS-3817 spike is unambiguous that invoiced quantity is the correct source. `[jira]`

**🏛️ Child-specific prior art:**
- **S_InventoryDOI/B_InventoryDOI shipped structure reused verbatim, only the query changes** — `OHFY-WMS/force-app/main/default/classes/services/inventoryDOI/S_InventoryDOI.cls`
**⚠️ Watch out:** Needs live reconciliation before ready-for-review


### 3. BMS-4543 — Design / Prototype / Demo  `Backlog`
> **Thesis:** UI surface for the standardized DOI figures — depends on BMS-3742's new fields landing.

**🔨 Delta:**
- [BUILD] **Not started** — Blocked on BMS-3742 merging

**🎯 Why:** Cannot mock up fields that don't exist yet. `[inferred]`



### 4. BMS-4544 — Reporting Spike  `Backlog`
> **Thesis:** Largely pre-answered by the BMS-3817 spike, which already defines the reporting requirements this ticket would investigate.

**🔨 Delta:**
- [REUSE] **Confirm BMS-3817 covers this spike's questions rather than re-investigating** — Likely a fast close, not new work

**🎯 Why:** BMS-3817 (Done) already established the formula logic and multi-level threshold data model. `[code]`



### 5. BMS-4545 — Reporting Build  `Backlog`
> **Thesis:** Partly pre-delivered — the Days_of_Inventory report type + permission set already ship; depends on BMS-3742's new 60/90-day fields for full coverage.

**🔨 Delta:**
- [EXTEND] **Extend existing report type with 60/90-day columns once BMS-3742 lands** — Small incremental build, not greenfield

**🎯 Why:** Report type and perm set already exist per the ledger. `[code]`



## ⚠️ Watch out (epic-level)
- High risk: org-wide DOI shift — needs a live before/after reconciliation against real invoice/inventory data before this draft PR is marked ready for review (the build org had no seed data to prove it against)
- Units_Per_Case__c is a formula field and can't sit in a GROUP BY — fetched per-item via a separate query instead
- Sales rate resolved at warehouse grain (both inventory and fulfillment locations walked to their warehouse ancestor) since invoiced quantity only exists at that grain

---
_Honesty: reports only what was searched — packages: OHFY-WMS, OHFY-Data-Model · terms: S_InventoryDOI, B_InventoryDOI, Current_DOI, Inventory_Threshold, Invoice_Item. Absence = **not searched**, not **doesn't exist**. Every prior-art claim is cited to `file:line`/SHA or flagged uncited. "Why" is tagged by source; `inferred` = not confirmed in code. Regenerate — pinned to `97777425c`._
