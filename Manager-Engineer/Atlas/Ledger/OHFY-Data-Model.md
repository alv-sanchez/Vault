---
area: OHFY-Data-Model
kind: capability-ledger
tags: [manager-engineer, atlas, ledger]
---

# 🧱 OHFY-Data-Model — Capabilities (4)

> Append-only inventory of shipped capability in this area. Reach for these before building; each is cited to source at the SHA it was observed.

| Capability | Ticket | Where (cite) | SHA | Added |
|---|---|---|---|---|
| POS_Deployment__c + POS_Campaign__c — per-account POS deployment record (status/reason/geotag/conflict) with Invoice_Item__c + Transfer__c seams, and campaign header for compliance/ROI grouping | [BMS-3854](https://ohanafy.atlassian.net/browse/BMS-3854) | `OHFY-Data-Model/force-app/main/default/objects/POS_Deployment__c/POS_Deployment__c.object-meta.xml:1` | `93c243612` | 2026-07-21 |
| Replenishment_Exception_Code__mdt — warehouse-scoped exception taxonomy CMDT (Scan/Pick reason-code override pattern), Requires_Note gate | [BMS-3780](https://ohanafy.atlassian.net/browse/BMS-3780) | `OHFY-Data-Model/force-app/main/default/objects/Replenishment_Exception_Code__mdt/Replenishment_Exception_Code__mdt.object-meta.xml:1` | `d2c5f489e` | 2026-07-21 |
| Effective Target DOH — resolved leadership benchmark on each Inventory row | [BMS-3779](https://ohanafy.atlassian.net/browse/BMS-3779) | `OHFY-Data-Model/.../Inventory__c/fields/Effective_Target_DOH__c.field-meta.xml` | `956df295` | 2026-07-08 |
| Current DOI — live actual days-on-hand, stamped nightly by B_InventoryDOI | [BMS-3779](https://ohanafy.atlassian.net/browse/BMS-3779) | `OHFY-Data-Model/.../Inventory__c/fields/Current_DOI__c.field-meta.xml` | `956df295` | 2026-07-08 |
