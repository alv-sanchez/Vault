---
tags: [atlas, area]
area: OHFY-WMS
ticket_count: 2
---
# 🗺️ OHFY-WMS
> Warehouse — picking, shift-end, breakage, capacity

**Repo:** `OHFY-Split/OHFY-WMS` · rules + DoD live in `OHFY-WMS/CLAUDE.md`.

## 🎟️ Tickets that touch this area (2)
- [BMS-3742](https://ohanafy.atlassian.net/browse/BMS-3742) DOI Formula Standardization — `Review` · [#513](https://github.com/Ohanafy/OHFY-Split/pull/513)
- [BMS-5791](https://ohanafy.atlassian.net/browse/BMS-5791) PO-side optional billback — freight-scoped supplier-owes-distributor origination — `Review` · [#516](https://github.com/Ohanafy/OHFY-Split/pull/516)

## 🔗 Logged notes here
- [[orientation]]
- [[BMS-3742-doi-formula-standardization]]
- [[BMS-5791-po-freight-billback]]

## 🧱 Capabilities already built here (3)
_Reach for these before building — the anti-reinvention catalog (cited + shipped). Full table: [[Ledger/OHFY-WMS]]._
- **S_TransferAlerts resolves close-to-code urgency against the RECEIVING warehouse's CTC_Threshold__mdt row (not the origin), giving per-warehouse/brand alert thresholds for free via existing CMDT rather than new schema** (BMS-3768) — `OHFY-WMS/force-app/main/default/classes/services/transferAlert/S_TransferAlerts.cls:9`
- **Transfer_Alert__c + Transfer_Alert_Event__e: generic, Alert_Type__c-discriminated per-transfer alert record with idempotent (External_Id__c) redelivery-safe materialization and custom-permission-gated notification — extensible to new alert types without new schema** (BMS-3768) — `OHFY-WMS/force-app/main/default/classes/executables/transferAlert/TransferAlertEventHandler.cls:12`
- **Days of Inventory report type — the inventory-health reporting surface** (BMS-3779) — `OHFY-WMS/.../reportTypes/Days_of_Inventory.reportType-meta.xml`

## 🕸️ See the web
Open **Graph View** and filter `tag:#area` — this note is a hub; its links are the tickets/epics that hit this part of the product. Backlinks (bottom of pane) show everything pointing here.