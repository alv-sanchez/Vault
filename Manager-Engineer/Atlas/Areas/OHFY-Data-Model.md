---
tags: [atlas, area]
area: OHFY-Data-Model
ticket_count: 6
---
# 🗺️ OHFY-Data-Model
> Data Model — objects, fields, schema (Tier-0, everything sits on it)

**Repo:** `OHFY-Split/OHFY-Data-Model` · rules + DoD live in `OHFY-Data-Model/CLAUDE.md`.

## 🎟️ Tickets that touch this area (6)
- [BMS-3742](https://ohanafy.atlassian.net/browse/BMS-3742) DOI Formula Standardization — `Review` · [#513](https://github.com/Ohanafy/OHFY-Split/pull/513)
- [BMS-3853](https://ohanafy.atlassian.net/browse/BMS-3853)
- [BMS-5625](https://ohanafy.atlassian.net/browse/BMS-5625) Short Pay — Ph 4: Driver Finalize-Stop Approval Gate (Configurable) — `In Progress` · [#582](https://github.com/Ohanafy/OHFY-Split/pull/582)
- [BMS-5791](https://ohanafy.atlassian.net/browse/BMS-5791)
- [BMS-5899](https://ohanafy.atlassian.net/browse/BMS-5899)
- [BMS-5900](https://ohanafy.atlassian.net/browse/BMS-5900)

## 🔗 Logged notes here
- [[Manager-Engineer/Build-Overview/Sprint-8/BMS-5067-practical-days-on-hand/orientation]]
- [[BMS-3742-doi-formula-standardization]]
- [[BMS-3853-route-profitability-analytics]]
- [[BMS-5625-driver-finalize-approval-gate]]
- [[BMS-5791-po-freight-billback]]
- [[BMS-5899-charge-type-dimension]]
- [[BMS-5900-agreement-terms-coverage-cascade]]

## 🧱 Capabilities already built here (4)
_Reach for these before building — the anti-reinvention catalog (cited + shipped). Full table: [[Ledger/OHFY-Data-Model]]._
- **POS_Deployment__c + POS_Campaign__c — per-account POS deployment record (status/reason/geotag/conflict) with Invoice_Item__c + Transfer__c seams, and campaign header for compliance/ROI grouping** (BMS-3854) — `OHFY-Data-Model/force-app/main/default/objects/POS_Deployment__c/POS_Deployment__c.object-meta.xml:1`
- **Replenishment_Exception_Code__mdt — warehouse-scoped exception taxonomy CMDT (Scan/Pick reason-code override pattern), Requires_Note gate** (BMS-3780) — `OHFY-Data-Model/force-app/main/default/objects/Replenishment_Exception_Code__mdt/Replenishment_Exception_Code__mdt.object-meta.xml:1`
- **Effective Target DOH — resolved leadership benchmark on each Inventory row** (BMS-3779) — `OHFY-Data-Model/.../Inventory__c/fields/Effective_Target_DOH__c.field-meta.xml`
- **Current DOI — live actual days-on-hand, stamped nightly by B_InventoryDOI** (BMS-3779) — `OHFY-Data-Model/.../Inventory__c/fields/Current_DOI__c.field-meta.xml`

## 🕸️ See the web
Open **Graph View** and filter `tag:#area` — this note is a hub; its links are the tickets/epics that hit this part of the product. Backlinks (bottom of pane) show everything pointing here.