---
ticket: BMS-4120
epic: BMS-4935
title: "Admin & Developer Guide — Red Bull Allocation Import"
org: "ohfy-val-4120"
screen: "/lightning/n/ohfy__Supplier_Allocation_Import"
object: "ohfy__Supplier_Allocation__c"
updated: 2026-06-30
jira: https://ohanafy.atlassian.net/browse/BMS-4120
tags:
  - manager-engineer
  - reference
  - BMS-4120
  - BMS-4935
---

# Admin & Developer Guide — Red Bull Allocation Import

Everything you need to run, configure, and reason about the Supplier Allocation Import feature. Verified against `ohfy-val-4120` on 2026-06-30. Pairs with [[BMS-4120-red-bull-import-tests|the test imports]] and [[BMS-4120-data-queries|the tracking queries]].

## 1. What it does (one breath)
Upload a supplier's weekly allocation spreadsheet → the importer validates each row against a **feed-specific column mapping**, matches SKUs to Items, splits each accepted line across the 5 Gulf warehouses by a **configurable percentage**, and writes a parent (aggregate) + 5 child (per-warehouse) `Supplier_Allocation__c` records. Bad rows are rejected with reasons and never persisted.

## 2. The flow, end to end
```
CSV file ─► E_SupplierAllocationImport.importFromCsv
              │  1. load feed config (Allocation_Import_Mapping__mdt)
              │  2. parse rows (S_AllocationCsvParser) — apply transforms
              │  3. validate: required cols, SKU match, qty, dup-key
              │  4. split accepted qty across warehouses (S_WarehouseAllocationSplit + Warehouse_Allocation_Split__mdt)
              ▼
        Supplier_Allocation__c   (1 aggregate parent + 5 warehouse children per SKU)
              ▲
        LWC supplierAllocationImport ──► OMS_UI_Wrappers (@AuraEnabled proxy) renders result + split table
```

## 3. Warehouse split — how the % is determined
**Config, not code.** One `Warehouse_Allocation_Split__mdt` record per warehouse per feed. RedBull feed today:

| Warehouse | Code | Percent |
|---|---|---|
| Milton FL | MILFL | 30% |
| Montgomery AL | MGMAL | 25% |
| Mobile AL | MOBAL | 20% |
| Huntsville AL | HSVAL | 15% |
| McCalla AL | MCCAL | 10% |
| | | **= 100%** |

- Split = `lineQty × percent`, with a **remainder-to-largest-warehouse** rule so the 5 children always sum *exactly* to the parent (e.g. 1200 → 360/300/240/180/120).
- The config **must sum to 100%** or the whole file is rejected (`S_AllocationImportConfig` validator).
- `Item_Key__c` is blank = "applies to all SKUs in this feed." Set it to a specific SKU to give that SKU its own split (per-SKU override). None defined today.
- Change the split with **no deploy** — edit the CMDT rows in Setup → Custom Metadata Types → Warehouse Allocation Split.

> [!warning] Open question for Gulf
> 30/25/20/15/10 is an **assumed demo value**. Confirm with Gulf whether the real Red Bull split is fixed %s, varies by SKU (`Item_Key__c`), or is driven by warehouse capacity / territory. This is a prime "catch the direction" item for the demo.

## 4. Column mapping — how the CSV is read
**Config, not code.** `Allocation_Import_Mapping__mdt`, one row per source column per feed. RedBull feed:

| CSV column (index) | Header label | Target | Required | Transform | Item match |
|---|---|---|---|---|---|
| 0 | `Supplier Item (SKU)` | Sku | ✅ | Trim | `Item.External_ID__c` |
| 3 | `Allocation Qty` | Quantity | ✅ | StripNonNumeric | — |
| 4 | `Week` | Week | ✅ | ParseWeek | — |

- Columns **not** mapped (Description, Pack Config, UPC) are ignored — they can stay in the file for human readability.
- A **missing required column** rejects the entire file (not just a row).
- To onboard a **new supplier feed**: add a new set of mapping rows with a new `Feed` value + matching split rows — no Apex change. The importer is fully feed-driven.

<details><summary>Transform meanings (important for validation)</summary>

- **Trim** — strips surrounding whitespace from the SKU before matching.
- **StripNonNumeric** — cleans the quantity, then the importer **rejects anything that isn't a positive number**. Verified (2026-06-30): `ABC` → empty → rejected; `-250` → rejected; blank/zero → rejected. Only positive numerics import.
- **ParseWeek** — normalizes the week to canonical `YYYY-Www`. The UI "Allocation Week" you type must match the normalized value or the post-import split table renders empty (known bug, §8).
</details>

### Verified rejection output — `BMS-4120-redbull-validation-errors.csv` (week 2026-W29)
Live run on 2026-06-30 → **3 accepted, 4 rejected.** The screen lists each rejected row with its reason:

| CSV line | SKU | Reason given |
|---|---|---|
| 4 | RB-99999 | unknown SKU "RB-99999" |
| 5 | RB-25320 | bad, zero, or negative quantity "" *(`ABC` stripped to empty)* |
| 6 | RB-25469 | bad, zero, or negative quantity "-250" *(negative rejected)* |
| 7 | RB-25316 | duplicate row for SKU "RB-25316" week "2026-W29" |

Accepted: RB-25316 (row 2), RB-25318 (row 3), RB-25622 (row 8). **Confirmed:** quantity must be a positive number — non-numeric, blank, zero, and negative are all rejected; unknown SKUs and in-file duplicates (same SKU+week) are rejected.

## 5. Data model — where the data lands
Object **`ohfy__Supplier_Allocation__c`** (self-referential parent/child):

| Field | Meaning |
|---|---|
| `Name` | `RB <sku> <week>` (parent) / `RB <sku> <week> <whCode>` (child) |
| `ohfy__Allocated_Case_Amount__c` | quantity (line qty on parent, split qty on child) |
| `ohfy__Allocation_Week__c` | week, Text(10), e.g. `2026-W28` |
| `ohfy__Item__c` | Lookup → Item (the SKU) |
| `ohfy__Location__c` | Lookup → Location (the warehouse; **null on parent**) |
| `ohfy__Supplier__c` | Lookup → Account (the supplier, e.g. Red Bull) |
| `ohfy__Parent_Supplier_Allocation__c` | self-lookup (**null on parent**, set on children) |
| `ohfy__External_Id__c` | upsert key `redbull:{week}:{sku}:{whCode}` (parent uses `:AGG`) — **Unique** |
| `ohfy__Is_Active__c` | active flag |

**Idempotent:** re-importing the same week **upserts** on `External_Id__c` (overwrites, no duplicates). To force an empty-state demo, delete the week first (query sheet §7).

## 6. Components inventory (what's deployed)
<details><summary>Full list with package homes</summary>

- **LWC:** `supplierAllocationImport` — `OHFY-OMS-UI`
- **@AuraEnabled proxy:** `OMS_UI_Wrappers` — methods `getSupplierAllocationFeeds`, `getSupplierAccounts`, `runSupplierAllocationImport`, `loadImportedSplit`
- **DTOs (`global`):** `SupplierAllocationImportResultDTO`, `SupplierAllocationGroupDTO`, `SupplierAllocationChildDTO` — `OHFY-OMS-UI`
- **Service Apex:** `OHFY-PLTFM/.../services/supplierAllocation/` — `E_SupplierAllocationImport` (entry, `@NamespaceAccessible`), `S_AllocationCsvParser`, `S_AllocationImportConfig`, `S_WarehouseAllocationSplit`
- **CMDT:** `Allocation_Import_Mapping__mdt` (column mapping), `Warehouse_Allocation_Split__mdt` (split %)
- **Object:** `Supplier_Allocation__c`
- **UI surface:** CustomTab `ohfy__Supplier_Allocation_Import` (+ a `_Tmp` duplicate) → FlexiPage `Supplier_Allocation_Import` (AppPage)
- **Permission sets (demo):** `Supplier_Allocation_Import_Demo` (object + field FLS), `Demo_SupplierAllocImport_Tab` (tab visibility)
</details>

## 7. Common admin tasks
- **Change a warehouse's %:** edit its `Warehouse_Allocation_Split__mdt` row (keep feed total = 100%).
- **Per-SKU split:** add split rows with `Item_Key__c` = the SKU's external id.
- **New supplier:** create the Account (must be **Type = `Vendor`** to appear in the picker — see §8), add `Allocation_Import_Mapping__mdt` + `Warehouse_Allocation_Split__mdt` rows under a new `Feed`.
- **Grant a real user access:** assign `Supplier_Allocation_Import_Demo` (FLS) **and** `Demo_SupplierAllocImport_Tab` (tab). These are demo stopgaps — see the ship gap in §8.
- **Add a warehouse:** create a Location whose code matches a new split row's `Warehouse_Code__c`.

## 8. Known gotchas & pre-ship gaps
| # | Gotcha | Impact | Status |
|---|---|---|---|
| 1 | **UI Week must match CSV week exactly** | mismatch → "accepted" count shows but split table is blank | known bug, flagged on PR |
| 2 | **Object ships with NO permission set / FLS** | no real user can run the import | **pre-ship blocker** — demo permsets are a stopgap; PR needs a scoped permset |
| 3 | Supplier picker filters `Account.Type = 'Vendor'` | non-Vendor supplier Accounts silently absent | by design — document for admins |
| 4 | Quantity validation | non-numeric / blank / zero / negative all rejected (verified §4) | working as intended |
| 5 | `loadImportedSplit` has no LIMIT | governor risk once a week has many historical rows | flagged on PR |
| 6 | `wiredFeeds` ignores the wire error branch | a CMDT/permission failure → empty feed picker, no message | flagged on PR |
| 7 | `global` DTOs + `@NamespaceAccessible` entry | API frozen once packaged — additive changes only | design note |

## 9. Quick reference
- **Open the screen:** `sf org open -o ohfy-val-4120 -p /lightning/n/ohfy__Supplier_Allocation_Import`
- **Screen path (namespaced!):** `/lightning/n/ohfy__Supplier_Allocation_Import`
- **Test files:** [[BMS-4120-red-bull-import-tests]] · **Tracking queries:** [[BMS-4120-data-queries]]
- **Weeks:** W27 seeded · W28 happy-path · W29 errors

## 10. Tracking queries
Raw SOQL — paste into the **Developer Console Query Editor** or **Salesforce Inspector** in `ohfy-val-4120`. Verified field names as of 2026-06-30.

**a) Health check — active rows by week** (fully-imported week = SKUs × 6)
```sql
SELECT ohfy__Allocation_Week__c week, COUNT(Id) rows FROM ohfy__Supplier_Allocation__c WHERE ohfy__Is_Active__c = true GROUP BY ohfy__Allocation_Week__c ORDER BY ohfy__Allocation_Week__c
```

**b) Aggregate parents for a week** (one per SKU)
```sql
SELECT ohfy__Item__r.Name, ohfy__Allocated_Case_Amount__c, ohfy__Allocation_Week__c FROM ohfy__Supplier_Allocation__c WHERE ohfy__Allocation_Week__c = '2026-W28' AND ohfy__Parent_Supplier_Allocation__c = null ORDER BY ohfy__Item__r.Name
```

**c) Warehouse splits for a week** (children)
```sql
SELECT ohfy__Item__r.Name, ohfy__Location__r.Name, ohfy__Allocated_Case_Amount__c FROM ohfy__Supplier_Allocation__c WHERE ohfy__Allocation_Week__c = '2026-W28' AND ohfy__Parent_Supplier_Allocation__c != null ORDER BY ohfy__Item__r.Name, ohfy__Location__r.Name
```

**d) Split integrity — children must sum to parent**
```sql
SELECT ohfy__Parent_Supplier_Allocation__r.Name parent, SUM(ohfy__Allocated_Case_Amount__c) splitTotal FROM ohfy__Supplier_Allocation__c WHERE ohfy__Allocation_Week__c = '2026-W28' AND ohfy__Parent_Supplier_Allocation__c != null GROUP BY ohfy__Parent_Supplier_Allocation__r.Name ORDER BY ohfy__Parent_Supplier_Allocation__r.Name
```

**e) Trace one SKU end-to-end** (parent + its 5 children)
```sql
SELECT Name, ohfy__Location__r.Name, ohfy__Allocated_Case_Amount__c, ohfy__External_Id__c FROM ohfy__Supplier_Allocation__c WHERE ohfy__External_Id__c LIKE 'redbull:2026-W28:RB-25316:%' OR ohfy__External_Id__c = 'redbull:2026-W28:RB-25316:AGG' ORDER BY ohfy__Location__r.Name NULLS FIRST
```

**f) After the errors file — confirm only valid rows persisted**
```sql
SELECT ohfy__Item__r.Name, COUNT(Id) FROM ohfy__Supplier_Allocation__c WHERE ohfy__Allocation_Week__c = '2026-W29' AND ohfy__Parent_Supplier_Allocation__c = null GROUP BY ohfy__Item__r.Name
```

**g) Show the live split config** (good to display during the demo)
```sql
SELECT ohfy__Warehouse_Code__c, ohfy__Percent__c, ohfy__Feed__c FROM ohfy__Warehouse_Allocation_Split__mdt ORDER BY ohfy__Percent__c DESC
```

> [!note] If a query errors on a field name, describe `ohfy__Supplier_Allocation__c` and reconcile. Queries (a) and (d) were validated live against seeded W27 data.

## 11. Reset / revert toolkit (safe test → clean demo)
Two layers of safety so you can test freely and still walk into the demo clean.

### Layer 1 — reserve a clean week for the live demo (no revert needed)
The simplest safety is to **test in throwaway weeks and never touch the demo week.** Suggested split:
- **W27** = pre-seeded reference data (leave it).
- **W29 / W30 / …** = scratch weeks for your own testing — delete freely.
- **W28** = reserved **clean** for the live demo. If you never import W28 while practicing, the live import is a true fresh insert (shows records being *created*, not *updated*).

### Layer 2 — revert what you imported
Salesforce `delete` sends rows to the **Recycle Bin**, recoverable for ~15 days via `undelete`. So a reset is reversible.

**Always pre-flight first** — SOQL (Query Editor), see exactly what you'd remove:
```sql
SELECT COUNT(Id) FROM ohfy__Supplier_Allocation__c WHERE ohfy__Allocation_Week__c = '2026-W28'
```

The reset statements are **Apex** — run them in **Developer Console → Debug → Open Execute Anonymous Window**, not the Query Editor.

**Revert one week (surgical — only that week):**
```apex
delete [SELECT Id FROM ohfy__Supplier_Allocation__c WHERE ohfy__Allocation_Week__c = '2026-W28'];
```

**Undo the revert (restore from Recycle Bin, within ~15 days):**
```apex
undelete [SELECT Id FROM ohfy__Supplier_Allocation__c WHERE ohfy__Allocation_Week__c = '2026-W28' ALL ROWS];
```

**Full reset to baseline (remove everything except the W27 seed):**
```apex
delete [SELECT Id FROM ohfy__Supplier_Allocation__c WHERE ohfy__Allocation_Week__c != '2026-W27'];
```

> [!warning] Safety notes
> - These only touch `ohfy__Supplier_Allocation__c` — they do **not** delete Items, Locations, the supplier Account, or the CMDT config. Re-importing always works afterward.
> - Imports are **idempotent (upsert on `External_Id__c`)**, so re-running a week you didn't delete *overwrites* rather than duplicates — deletion is only needed for a true empty-state.
> - **Scoping matters:** the `WHERE` clause is the safety. Never run a bare `delete [SELECT Id FROM ohfy__Supplier_Allocation__c]` unless you intend to wipe the object. Pre-flight with the COUNT query every time.
> - This is a disposable scratch org — even a total wipe is recoverable by re-running the seed + your import.

### Recommended demo rhythm
1. Practice the upload + rejection path in **W29/W30**.
2. When happy, **delete your scratch weeks** (revert).
3. Confirm **W28 is empty** (pre-flight COUNT = 0).
4. Live demo: import the happy-path file as **W28** → fresh records created on screen.
