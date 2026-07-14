---
title: OHFY — Practical DOH / Safety-Stock data model
tags: [manager-engineer, diagram, data-model]
domain: Inventory-Replenishment
updated: 2026-07-13
---

# 🗺️ OHFY — Practical DOH / Safety-Stock data model

> Renders natively in Obsidian (Mermaid, no plugin). The `.dbml` + `.sql` siblings in this folder are for [dbdiagram.io](https://dbdiagram.io) — enable **Settings → Files and links → Detect all file extensions** to see them in the explorer.

**The story:** `B_InventoryDOI` stamps `Current_DOI__c` + `Effective_Target_DOH__c` nightly on each `Inventory__c` (Item × Location). `Effective_Target_DOH__c` is *resolved* by the `S_InventoryThresholds` waterfall — **`SKU_Override__c` → `Inventory_Threshold__c` (supplier+warehouse / warehouse) → Account default**. The BMS-3816 formulas then compare `Current_DOI__c` vs `Effective_Target_DOH__c` → the variance signal.

```mermaid
erDiagram
    Item__c ||--o{ Inventory__c : "master-detail"
    Location__c ||--o{ Inventory__c : "lookup"
    Location__c ||--o{ Location__c : "Parent_Location__c (→ Warehouse)"
    Account ||--o{ Inventory_Threshold__c : "supplier"
    Location__c ||--o{ Inventory_Threshold__c : "warehouse"
    Item__c ||--o{ SKU_Override__c : "SKU"
    Location__c ||--o{ SKU_Override__c : "location"
    Account ||--o{ SKU_Override__c : "supplier"

    Item__c {
        id Id PK
        string Name
        number Units_Per_Case__c
        currency Average_Case_Cost__c
        currency Last_Landed_Case_Cost__c "cost FLS-gated"
        rollup Quantity_On_Hand__c
    }
    Location__c {
        id Id PK
        string Name
        picklist Type__c "Warehouse/Zone/Bin/Truck/Dock"
        lookup Parent_Location__c FK "self-ref"
        string Location_State__c "FL/AL"
    }
    Account {
        id Id PK
        string Name "used as Supplier"
    }
    Inventory__c {
        id Id PK
        masterdetail Item__c FK
        lookup Location__c FK
        number Quantity_On_Hand__c
        number Average_Daily_Depletion__c "velocity"
        number Current_DOI__c "nightly · B_InventoryDOI"
        number Effective_Target_DOH__c "resolved benchmark"
        number Target_DOH_Variance__c "formula BMS-3816"
        percent Target_DOH_Variance_Pct__c "formula"
        text Target_Variance_Status__c "Above/At/Below/No Benchmark"
    }
    Inventory_Threshold__c {
        id Id PK
        lookup Account__c FK "supplier grain"
        lookup Location__c FK "warehouse grain"
        number Target_DOH__c "leadership benchmark"
        number Min_DOH__c
        number Max_DOH__c
    }
    SKU_Override__c {
        id Id PK
        lookup Item__c FK
        lookup Location__c FK
        lookup Account__c FK "supplier scope"
        picklist Scope__c "SKU/Supplier"
        number Target_DOH_Override__c
        date Start_Date__c
        date End_Date__c
        picklist Status__c "Scheduled/Active/Expired"
    }
```

## Source DBML (paste into dbdiagram.io for the polished view)

```dbml
// see ohfy-doh-safety-stock.dbml in this folder — copy it with:
//   cat Diagrams/ohfy-doh-safety-stock.dbml | pbcopy
// then paste into https://dbdiagram.io
```

_Faithful to OHFY-Data-Model metadata. Curated to the DOH/safety-stock cluster — not every field._
