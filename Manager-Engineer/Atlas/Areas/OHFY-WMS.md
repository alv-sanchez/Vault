---
tags: [atlas, area]
area: OHFY-WMS
ticket_count: 3
---
# 🗺️ OHFY-WMS
> Warehouse — picking, shift-end, breakage, capacity

**Repo:** `OHFY-Split/OHFY-WMS` · rules + DoD live in `OHFY-WMS/CLAUDE.md`.

## 🎟️ Tickets that touch this area (3)
- [BMS-3742](https://ohanafy.atlassian.net/browse/BMS-3742) DOI Formula Standardization — `Review` · [#513](https://github.com/Ohanafy/OHFY-Split/pull/513)
- [BMS-5791](https://ohanafy.atlassian.net/browse/BMS-5791)
- [BMS-5901](https://ohanafy.atlassian.net/browse/BMS-5901)

## 🔗 Logged notes here
- [[Manager-Engineer/Build-Overview/Sprint-8/BMS-5067-practical-days-on-hand/orientation]]
- [[BMS-3742-doi-formula-standardization]]
- [[BMS-5791-po-freight-billback]]
- [[BMS-5901-receipt-fee-billback-source]]

## 🧱 Capabilities already built here (5)
_Reach for these before building — the anti-reinvention catalog (cited + shipped). Full table: [[Ledger/OHFY-WMS]]._
- **Task completion gate: block completeTask while unresolved exceptions exist absent a logged, permission-gated Supervisor Override** (BMS-3780) — `OHFY-WMS/force-app/main/default/classes/executables/replenishment/E_ReplenishmentTask.cls:1907`
- **E_ReplenishmentExceptions — log/get/resolve/supervisor-override exceptions on replenishment tasks + bulk unresolved-count queries (audit-child pattern)** (BMS-3780) — `OHFY-WMS/force-app/main/default/classes/executables/replenishment/E_ReplenishmentExceptions.cls:1`
- **S_TransferAlerts resolves close-to-code urgency against the RECEIVING warehouse's CTC_Threshold__mdt row (not the origin), giving per-warehouse/brand alert thresholds for free via existing CMDT rather than new schema** (BMS-3768) — `OHFY-WMS/force-app/main/default/classes/services/transferAlert/S_TransferAlerts.cls:9`
- **Transfer_Alert__c + Transfer_Alert_Event__e: generic, Alert_Type__c-discriminated per-transfer alert record with idempotent (External_Id__c) redelivery-safe materialization and custom-permission-gated notification — extensible to new alert types without new schema** (BMS-3768) — `OHFY-WMS/force-app/main/default/classes/executables/transferAlert/TransferAlertEventHandler.cls:12`
- **Days of Inventory report type — the inventory-health reporting surface** (BMS-3779) — `OHFY-WMS/.../reportTypes/Days_of_Inventory.reportType-meta.xml`

## 🕸️ See the web
Open **Graph View** and filter `tag:#area` — this note is a hub; its links are the tickets/epics that hit this part of the product. Backlinks (bottom of pane) show everything pointing here.