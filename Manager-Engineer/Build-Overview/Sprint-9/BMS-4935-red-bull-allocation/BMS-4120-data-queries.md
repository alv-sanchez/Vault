---
ticket: BMS-4120
epic: BMS-4935
title: "Data Tracking Queries — Red Bull Allocation Import"
org: "ohfy-val-4120"
object: "ohfy__Supplier_Allocation__c"
updated: 2026-06-30
jira: https://ohanafy.atlassian.net/browse/BMS-4120
tags:
  - manager-engineer
  - test-import
  - BMS-4120
  - BMS-4935
---

# Data Tracking Queries — Red Bull Allocation Import

Raw SOQL for verifying what the import wrote to **`ohfy__Supplier_Allocation__c`** in `ohfy-val-4120`. Paste into the **Developer Console Query Editor** or **Salesforce Inspector**. (§7 is Apex — run in Execute Anonymous.)

> [!info] Data model recap
> - **Parent (aggregate)** row = SKU + week, `ohfy__Parent_Supplier_Allocation__c = null`, holds the full line qty in `ohfy__Allocated_Case_Amount__c`.
> - **Child (warehouse split)** row = SKU + warehouse, `ohfy__Parent_Supplier_Allocation__c` points to the parent, `ohfy__Location__c` = the warehouse.
> - Quantity = `ohfy__Allocated_Case_Amount__c` · Week = `ohfy__Allocation_Week__c` (Text) · Upsert key = `ohfy__External_Id__c` (`redbull:{week}:{sku}:{whCode}`).
> - Rejected rows are **never written** — they show only in the screen's result panel.

## 1. Health check — active row counts by week
```sql
SELECT ohfy__Allocation_Week__c week, COUNT(Id) rows FROM ohfy__Supplier_Allocation__c WHERE ohfy__Is_Active__c = true GROUP BY ohfy__Allocation_Week__c ORDER BY ohfy__Allocation_Week__c
```
Expect per fully-imported week: SKUs × 6 (1 parent + 5 children). 8 SKUs → 48 rows.

## 2. Aggregate parents for a week (one per SKU)
```sql
SELECT ohfy__Item__r.Name, ohfy__Allocated_Case_Amount__c, ohfy__Allocation_Week__c FROM ohfy__Supplier_Allocation__c WHERE ohfy__Allocation_Week__c = '2026-W28' AND ohfy__Parent_Supplier_Allocation__c = null ORDER BY ohfy__Item__r.Name
```

## 3. Warehouse splits for a week (children)
```sql
SELECT ohfy__Item__r.Name, ohfy__Location__r.Name, ohfy__Allocated_Case_Amount__c FROM ohfy__Supplier_Allocation__c WHERE ohfy__Allocation_Week__c = '2026-W28' AND ohfy__Parent_Supplier_Allocation__c != null ORDER BY ohfy__Item__r.Name, ohfy__Location__r.Name
```

## 4. Split integrity — children must sum to parent
```sql
SELECT ohfy__Parent_Supplier_Allocation__r.Name parent, SUM(ohfy__Allocated_Case_Amount__c) splitTotal FROM ohfy__Supplier_Allocation__c WHERE ohfy__Allocation_Week__c = '2026-W28' AND ohfy__Parent_Supplier_Allocation__c != null GROUP BY ohfy__Parent_Supplier_Allocation__r.Name ORDER BY ohfy__Parent_Supplier_Allocation__r.Name
```
`splitTotal` for each parent must equal that SKU's line qty (e.g. RB-25316 = 1000).

## 5. Trace one SKU end-to-end (parent + its 5 children)
```sql
SELECT Name, ohfy__Location__r.Name, ohfy__Allocated_Case_Amount__c, ohfy__External_Id__c FROM ohfy__Supplier_Allocation__c WHERE ohfy__External_Id__c LIKE 'redbull:2026-W28:RB-25316:%' OR ohfy__External_Id__c = 'redbull:2026-W28:RB-25316:AGG' ORDER BY ohfy__Location__r.Name NULLS FIRST
```
(Adjust the SKU/week. `NULLS FIRST` puts the aggregate parent on top.)

## 6. After the errors file — confirm only valid rows persisted
```sql
SELECT ohfy__Item__r.Name, COUNT(Id) FROM ohfy__Supplier_Allocation__c WHERE ohfy__Allocation_Week__c = '2026-W29' AND ohfy__Parent_Supplier_Allocation__c = null GROUP BY ohfy__Item__r.Name
```
Expect exactly 3 SKUs (RB-25316, RB-25318, RB-25622). RB-99999 / RB-25320 / RB-25469 must be absent.

## 7. Reset (Apex — Execute Anonymous)
Run in **Developer Console → Debug → Open Execute Anonymous Window**.

Reset one week:
```apex
delete [SELECT Id FROM ohfy__Supplier_Allocation__c WHERE ohfy__Allocation_Week__c = '2026-W28'];
```

Wipe all allocations (every week):
```apex
delete [SELECT Id FROM ohfy__Supplier_Allocation__c];
```

Undo a delete (Recycle Bin, ~15 days):
```apex
undelete [SELECT Id FROM ohfy__Supplier_Allocation__c WHERE ohfy__Allocation_Week__c = '2026-W28' ALL ROWS];
```
(Imports are idempotent/upsert, so a reset is only needed for a true empty-state demo. Deleting allocations does not touch Items, Locations, the supplier Account, or the CMDT config.)

---
> [!warning] If a field name errors, describe `ohfy__Supplier_Allocation__c` and reconcile. Queries 1 and 4 were validated live against seeded W27 data.
