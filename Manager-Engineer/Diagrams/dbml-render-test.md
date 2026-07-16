---
title: DBML Render — test note
tags: [manager-engineer, diagram, test]
---

# 🧪 DBML Render plugin — test

If the **DBML Render** plugin is enabled, the block below renders as an ER diagram. If you just see the code, the plugin isn't enabled yet (Settings → Community plugins → turn off Restricted Mode → enable *DBML Render*).

```dbml
Table Item {
  Id varchar [pk]
  Name varchar
  Units_Per_Case int
  Average_Case_Cost float
}

Table Location {
  Id varchar [pk]
  Name varchar
  Type varchar
  Parent_Location varchar [ref: > Location.Id]
}

Table Inventory {
  Id varchar [pk]
  Item varchar [ref: > Item.Id]
  Location varchar [ref: > Location.Id]
  Current_DOI float
  Effective_Target_DOH float
  Target_Variance_Status varchar
}

Table Inventory_Threshold {
  Id varchar [pk]
  Location varchar [ref: > Location.Id]
  Target_DOH float
}

Table SKU_Override {
  Id varchar [pk]
  Item varchar [ref: > Item.Id]
  Location varchar [ref: > Location.Id]
  Target_DOH_Override float
  Status varchar
}
// @pos Location 365 275
// @view 152 32 0.664
```

_Clean/simple DBML on purpose (no dbdiagram-only extras like `headercolor`/`Note:`/`TableGroup`, which the v2 parser may reject). This is the DOH/safety-stock cluster in plugin-safe form._
