# 🥤 Session Kickoff — Red Bull Allocation Import (BMS-4120)

> Paste this whole file into a fresh Claude Code session as the first message,
> or tell the session: "Read this file first." It is the entire context seed.

## Scope of THIS session
Only BMS-4120 (epic BMS-4935). Do not touch Short Pay, Shift-End, or any other ticket.

## Where the work lives
- **Branch:** `feat/redbull-allocation-import-bms-4120` (pushed, in sync with origin)
- **Repo:** `/Users/alvarosanchez_1/OHFY-Split` on that branch (use its own worktree)
- **Dev org:** `ohfy-val-4120`
- **Screen:** `sf org open -o ohfy-val-4120 -p /lightning/n/ohfy__Supplier_Allocation_Import`
- **Docs (this folder):** `overview.html`, `red-bull-explained.html`, `BMS-4120-admin-developer-guide.md`, `BMS-4120-data-queries.md`
- **Test CSVs:** `Manager-Engineer/Test-Imports/BMS-4120-redbull-*.csv`

## Code (OHFY-PLTFM/.../services/supplierAllocation/)
- `E_SupplierAllocationImport` — entry; row validation (unknown SKU, bad/zero/negative qty, duplicate SKU+week)
- `S_AllocationCsvParser` — column resolution by header label, then `Source_Index__c` fallback
- `S_AllocationImportConfig` — file-level: required columns + split=100%
- `S_WarehouseAllocationSplit` — remainder-to-largest
- Object `Supplier_Allocation__c`: `Allocated_Case_Amount__c`, `Allocation_Week__c` (Text), `External_Id__c` (`redbull:{week}:{sku}:{whCode}`), `Item__c`, `Location__c`, `Supplier__c`, `Parent_Supplier_Allocation__c`
- Split mdt `Warehouse_Allocation_Split__mdt` RedBull: MILFL 30 / MGMAL 25 / MOBAL 20 / HSVAL 15 / MCCAL 10

## State / known gaps
- Screen is live + clickable (CustomTab + `Demo_SupplierAllocImport_Tab` permset).
- **Pre-ship bug:** `Supplier_Allocation__c` ships with NO FLS/permission set → real (non-admin) users are blocked. Should be posted to BMS-4120 and fixed before merge.
- Namespaced org: SObject fields serialize with `ohfy__` prefix across the LWC↔Apex bridge.

## Likely next work
- Add the FLS/permission set for `Supplier_Allocation__c`.
- Tests for the importer (none yet).
- `/code-review` then `/end-ticket` → PR when Low-risk.
