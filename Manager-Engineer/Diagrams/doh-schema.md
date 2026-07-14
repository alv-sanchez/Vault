---
title: OHFY — DOH / Safety-Stock schema (rendered via DBML Render plugin)
tags: [manager-engineer, diagram, data-model]
domain: Inventory-Replenishment
updated: 2026-07-13
---

# 🗺️ OHFY — Practical DOH / Safety-Stock schema

> Rendered inline by the **DBML Render** plugin (the ```dbml block below). Plugin-safe syntax — plain tables + refs, no dbdiagram-only extras.

**The waterfall:** `B_InventoryDOI` stamps `Current_DOI` + `Effective_Target_DOH` nightly on each `Inventory` (Item × Location). `Effective_Target_DOH` is resolved by `S_InventoryThresholds`: **SKU_Override → Inventory_Threshold (supplier+warehouse / warehouse) → Account default.** BMS-3816 formulas compare `Current_DOI` vs `Effective_Target_DOH` → the variance signal.

```dbml
Table Item {
  Id varchar [pk]
  Name varchar
  SKU_Number varchar
  Units_Per_Case int
  Average_Case_Cost float
  Last_Landed_Case_Cost float
  Quantity_On_Hand float
  Is_Active boolean
}

Table Location {
  Id varchar [pk]
  Name varchar
  Type varchar
  Parent_Location varchar [ref: > Location.Id]
  Location_State varchar
  Is_Truck boolean
  Is_Dock boolean
}

Table Account {
  Id varchar [pk]
  Name varchar
}

Table Inventory {
  Id varchar [pk]
  Item varchar [ref: > Item.Id]
  Location varchar [ref: > Location.Id]
  Quantity_On_Hand float
  Average_Daily_Depletion float
  Current_DOI float
  Effective_Target_DOH float
  DOI_Status varchar
  Target_DOH_Variance float
  Target_DOH_Variance_Pct float
  Target_Variance_Status varchar
}

Table Inventory_Threshold {
  Id varchar [pk]
  Account varchar [ref: > Account.Id]
  Location varchar [ref: > Location.Id]
  Target_DOH float
  Min_DOH float
  Max_DOH float
  Lead_Time float
}

Table SKU_Override {
  Id varchar [pk]
  Item varchar [ref: > Item.Id]
  Location varchar [ref: > Location.Id]
  Account varchar [ref: > Account.Id]
  Scope varchar
  Target_DOH_Override float
  Min_DOH_Override float
  Max_DOH_Override float
  Start_Date date
  End_Date date
  Status varchar
}
// @view 246 36 0.351
```

## Field notes (the annotations, kept out of the block so it parses)
- `Inventory.Current_DOI` / `Effective_Target_DOH` — stamped nightly by `B_InventoryDOI`
- `Inventory.Target_DOH_Variance*` / `Target_Variance_Status` — formula fields (BMS-3816): `Current_DOI − Effective_Target_DOH`; status = Above / At / Below / No Benchmark Set / No Velocity Data
- `Inventory_Threshold.Target_DOH` — leadership benchmark (the "practical" DOH)
- `SKU_Override.Target_DOH_Override` — dated override, beats the threshold baseline while `Status = Active`
- `Item.Last_Landed_Case_Cost` — cost FLS-gated (drives cost/margin)
- `Location.Parent_Location` — self-ref; walks bin → warehouse ancestor
- `Account` — standard object, used as the Supplier
